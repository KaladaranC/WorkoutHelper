"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Flame, Minus, Plus, SkipForward, Trophy, X } from "lucide-react";
import { CoachPanel, type CoachStats } from "@/components/coach/coach-panel";
import { bandClass } from "@/components/band";
import { MoveAnimation } from "@/components/figure/move-animation";
import { MoveRow } from "@/components/move-row";
import { findExercise } from "@/lib/data/exercises";
import { estimateMinutes, findDay, PLANS, type Prescription, type ProgramDay } from "@/lib/data/program";
import { db, exerciseHistory, finishSession, logSet, openSession, type Session } from "@/lib/db";
import { useProfile, useSessions } from "@/lib/hooks";
import { EFFORT_LABEL, suggestNext, type Effort, type Suggestion } from "@/lib/progression";
import { speak } from "@/lib/speech";
import { cn, formatSeconds } from "@/lib/utils";
import { useWakeLock } from "./use-wake-lock";

type Cursor = { item: number; set: number };
type Stage = "overview" | "set" | "rest" | "summary";
type SetResult = { weightKg?: number; effort?: Effort };

const targetFor = (p: Prescription) => (p.exercise.perSide ? p.amount * 2 : p.amount);

function nextCursor(day: ProgramDay, c: Cursor): Cursor | null {
  if (c.set + 1 < day.items[c.item].sets) return { item: c.item, set: c.set + 1 };
  if (c.item + 1 < day.items.length) return { item: c.item + 1, set: 0 };
  return null;
}

function firstOpenCursor(day: ProgramDay, session: Session): Cursor | null {
  for (let item = 0; item < day.items.length; item++) {
    for (let set = 0; set < day.items[item].sets; set++) {
      const id = day.items[item].exercise.id;
      if (!session.sets.some((s) => s.exerciseId === id && s.setIndex === set)) return { item, set };
    }
  }
  return null;
}

export function SessionRunner({ dayId }: { dayId: string }) {
  const day = findDay(dayId)!;
  const plan = PLANS[day.planId];
  const router = useRouter();
  const profile = useProfile();
  const sessions = useSessions();
  const [stage, setStage] = useState<Stage>("overview");
  const [session, setSession] = useState<Session | null>(null);
  const [cursor, setCursor] = useState<Cursor>({ item: 0, set: 0 });
  const stats = useRef<CoachStats>({ done: 0, goodReps: 0, partials: 0, cues: {}, tracked: false });

  useWakeLock(stage === "set" || stage === "rest");

  const start = async () => {
    const s = await openSession(day.id);
    const c = firstOpenCursor(day, s);
    setSession(s);
    if (c) {
      setCursor(c);
      setStage("set");
    } else {
      await finishSession(s.id);
      setStage("summary");
    }
  };

  const finishSet = async (result: SetResult) => {
    if (!session) return;
    const p = day.items[cursor.item];
    await logSet(session.id, {
      exerciseId: p.exercise.id,
      setIndex: cursor.set,
      target: targetFor(p),
      ...stats.current,
      ...result,
      at: Date.now(),
    });
    const next = nextCursor(day, cursor);
    if (!next) {
      await finishSession(session.id);
      speak(plan.voice.sessionDone, { interrupt: true });
      setStage("summary");
      return;
    }
    setCursor(next);
    setStage("rest");
  };

  const skipExercise = () => {
    const nextItem = cursor.item + 1;
    if (nextItem >= day.items.length) {
      if (session) finishSession(session.id).then(() => setStage("summary"));
      return;
    }
    setCursor({ item: nextItem, set: 0 });
    setStage("rest");
  };

  const onStats = useCallback((s: CoachStats) => {
    stats.current = s;
  }, []);

  if (profile === undefined || sessions === undefined) return <div className="min-h-dvh bg-stage" />;

  return (
    <div data-plan={day.planId} className="flex min-h-dvh flex-col bg-stage text-stage-foreground">
      {stage === "overview" && <Overview day={day} sessions={sessions} onStart={start} />}
      {stage === "set" && session && (
        <SetScreen
          key={`${cursor.item}-${cursor.set}`}
          day={day}
          cursor={cursor}
          sessionId={session.id}
          model={profile?.model ?? "lite"}
          onStats={onStats}
          onFinish={finishSet}
          onSkip={skipExercise}
          onExit={() => router.push("/")}
        />
      )}
      {stage === "rest" && (
        <RestScreen
          key={`${cursor.item}-${cursor.set}`}
          day={day}
          cursor={cursor}
          onDone={() => {
            stats.current = { done: 0, goodReps: 0, partials: 0, cues: {}, tracked: false };
            setStage("set");
          }}
        />
      )}
      {stage === "summary" && session && <Summary day={day} sessionId={session.id} />}
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────

function Overview({ day, sessions, onStart }: { day: ProgramDay; sessions: Session[]; onStart: () => void }) {
  const plan = PLANS[day.planId];
  const active = sessions.find((s) => s.dayId === day.id && s.status === "active");
  const done = sessions.find((s) => s.dayId === day.id && s.status === "done");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-stage-muted hover:text-stage-foreground"
      >
        <ArrowLeft className="size-4" /> Today
      </Link>
      <header>
        <p className="flex items-center gap-3 text-sm font-semibold text-stage-muted">
          <span className={cn("h-2 w-10 rounded-full", bandClass(day.phase))} />
          Week {day.week} · {day.phase.name} · about {estimateMinutes(day)} min
        </p>
        <h1 className="font-scoreboard mt-3 text-[clamp(3.5rem,14vw,5.5rem)] font-extrabold uppercase">{day.title}</h1>
        <p className="mt-2 text-stage-muted">{day.focus}</p>
        {done && !active && (
          <p className="mt-3 text-stage-muted">
            You finished this session on {new Date(done.finishedAt ?? done.startedAt).toLocaleDateString()}. You can
            do it again any time.
          </p>
        )}
      </header>

      <p className="rounded-2xl border border-stage-accent/40 bg-stage-accent/10 p-4 font-semibold">
        {plan.sessionTip}
      </p>

      <section aria-labelledby="warm">
        <h2 id="warm" className="text-sm font-semibold text-stage-muted">
          Warm up first, about 5 min
        </h2>
        <ul className="mt-2 flex flex-col gap-1">
          {plan.warmUp.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="moves">
        <h2 id="moves" className="text-sm font-semibold text-stage-muted">
          Moves
        </h2>
        <p className="mt-1 text-sm text-stage-muted">Tap a move to see how to do it.</p>
        <ol className="mt-2 divide-y divide-white/10 border-y border-white/10">
          {day.items.map((p) => (
            <li key={p.exercise.id}>
              <MoveRow p={p} tone="stage" />
            </li>
          ))}
        </ol>
      </section>

      <p className="max-w-[56ch] text-sm text-stage-muted">
        For camera moves, prop your phone where it can see your whole body. Each move tells you where to put it. Video
        stays on this phone.
      </p>

      <button
        type="button"
        onClick={onStart}
        className="press mt-auto flex h-14 items-center justify-center gap-2 rounded-full bg-stage-accent text-lg font-semibold text-stage hover:brightness-110"
      >
        {active ? "Resume session" : "I'm warmed up, start"} <ArrowRight className="size-5" />
      </button>
    </div>
  );
}

// ─── Set ────────────────────────────────────────────────────────────────────

function SetScreen({
  day,
  cursor,
  sessionId,
  model,
  onStats,
  onFinish,
  onSkip,
  onExit,
}: {
  day: ProgramDay;
  cursor: Cursor;
  sessionId: string;
  model: "lite" | "full";
  onStats: (s: CoachStats) => void;
  onFinish: (result: SetResult) => void;
  onSkip: () => void;
  onExit: () => void;
}) {
  const plan = PLANS[day.planId];
  const p = day.items[cursor.item];
  const e = p.exercise;
  const target = targetFor(p);
  const strength = plan.style === "strength";
  const rateEffort = strength && e.unit === "reps";
  const usesWeights = e.equipment === "dumbbells";
  const [howTo, setHowTo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [weight, setWeight] = useState<number | null>(null);
  const [advice, setAdvice] = useState<Suggestion | null>(null);
  // Survives the coach panel unmounting while "How to" is open.
  const latest = useRef<CoachStats | undefined>(undefined);
  const [resumeFrom, setResumeFrom] = useState<CoachStats | undefined>();
  const reportStats = useCallback(
    (st: CoachStats) => {
      latest.current = st;
      onStats(st);
    },
    [onStats],
  );

  useEffect(() => {
    if (!usesWeights && !p.range) return;
    exerciseHistory(e.id, sessionId).then(({ previous, thisSession }) => {
      const suggestion = p.range ? suggestNext(previous, p.range, usesWeights) : null;
      setAdvice(suggestion);
      if (usesWeights) {
        // Later sets reuse this session's weight; the first set starts from the suggestion.
        const sameSession = thisSession.at(-1)?.weightKg;
        const lastAny = previous.at(-1)?.weightKg;
        setWeight((w) => w ?? sameSession ?? suggestion?.kg ?? lastAny ?? 5);
      }
    });
  }, [e.id, sessionId, usesWeights, p.range]);

  const totalSets = day.items.reduce((n, i) => n + i.sets, 0);
  const setsBefore = day.items.slice(0, cursor.item).reduce((n, i) => n + i.sets, 0) + cursor.set;

  useEffect(() => {
    const what = p.finisher
      ? "Finisher. Everything you've got."
      : p.range
        ? `Set ${cursor.set + 1} of ${p.sets}. ${p.range[0]} to ${p.range[1]} reps.`
        : `Set ${cursor.set + 1} of ${p.sets}.`;
    speak(`${e.name}. ${what}`, { interrupt: true });
  }, [e.name, cursor.set, p.sets, p.range, p.finisher]);

  const amountText = (n: number | string) =>
    e.perSide ? `${n}${e.unit === "seconds" ? "s" : ""} each side` : `${n}${e.unit === "seconds" ? " seconds" : " reps"}`;
  const subtitle = p.finisher
    ? `One all-out set · aim for ${amountText(p.amount)}`
    : `Set ${cursor.set + 1} of ${p.sets} · ${amountText(p.range ? `${p.range[0]}–${p.range[1]}` : p.amount)}`;

  // Strength style: at the bottom of the range, push for the top.
  const milestone =
    p.range && !e.perSide && e.unit === "reps"
      ? { at: p.range[0], text: `That's ${p.range[0]}. Push for ${p.range[1]}.` }
      : undefined;

  const finish = async (result: SetResult) => {
    setBusy(true);
    await onFinish({ weightKg: usesWeights && weight !== null ? weight : undefined, ...result });
  };

  return (
    <div className="flex h-dvh flex-col">
      <div className="h-1 bg-white/10">
        <div className={cn("h-full", bandClass(day.phase))} style={{ width: `${(setsBefore / totalSets) * 100}%` }} />
      </div>
      <header className="flex items-start gap-3 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
        <div className="flex-1">
          {p.finisher && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-stage-accent px-2.5 py-0.5 text-xs font-bold text-stage uppercase">
              <Flame className="size-3.5" /> Finisher
            </span>
          )}
          <h1 className="font-scoreboard text-4xl font-extrabold uppercase">{e.name}</h1>
          <p className="mt-1 text-sm text-stage-muted">{subtitle}</p>
          {advice && !usesWeights && <p className="mt-1 text-sm">{advice.message}</p>}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!howTo) setResumeFrom(latest.current);
            setHowTo(!howTo);
          }}
          aria-expanded={howTo}
          className="press inline-flex h-10 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-sm hover:border-white/35"
        >
          <BookOpen className="size-4" /> How to
        </button>
        <button
          type="button"
          onClick={onExit}
          aria-label="Leave session (progress is saved)"
          className="press grid size-10 place-items-center rounded-full border border-white/15 hover:border-white/35"
        >
          <X className="size-4" />
        </button>
      </header>

      {howTo ? (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <MoveAnimation id={e.id} className="mb-5 h-56 rounded-2xl bg-white/5 p-4" />
          <ol className="flex list-decimal flex-col gap-2 pl-5 marker:font-mono marker:text-stage-muted">
            {e.steps.map((s) => (
              <li key={s} className="max-w-[60ch] pl-1">
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm font-semibold text-stage-muted">Cues</p>
          <p className="mt-1">{e.cues.join(" · ")}</p>
          {e.tracking.kind !== "manual" && (
            <>
              <p className="mt-5 text-sm font-semibold text-stage-muted">Camera</p>
              <p className="mt-1">{e.tracking.setup}</p>
            </>
          )}
        </div>
      ) : (
        <CoachPanel
          exercise={e}
          target={target}
          model={model}
          cameraDefault
          initial={resumeFrom}
          doneLine={plan.voice.setDone}
          milestone={milestone}
          onStats={reportStats}
        />
      )}

      {usesWeights && weight !== null && <WeightPicker kg={weight} advice={advice} onChange={setWeight} />}

      {rateEffort && !p.finisher ? (
        <footer className="flex flex-col gap-2 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">Finish set: how hard was it?</p>
            <button
              type="button"
              onClick={onSkip}
              className="press inline-flex items-center gap-1 text-sm text-stage-muted hover:text-stage-foreground"
            >
              <SkipForward className="size-4" /> Skip move
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(EFFORT_LABEL) as Effort[]).map((effort) => (
              <button
                key={effort}
                type="button"
                disabled={busy}
                onClick={() => finish({ effort })}
                className={cn(
                  "press flex h-16 flex-col items-center justify-center rounded-2xl font-semibold disabled:opacity-60",
                  effort === "hard" ? "bg-stage-accent text-stage" : "bg-white/10 hover:bg-white/15",
                )}
              >
                <span className="text-lg leading-tight">{EFFORT_LABEL[effort].title}</span>
                <span className="text-xs font-medium opacity-75">{EFFORT_LABEL[effort].hint}</span>
              </button>
            ))}
          </div>
        </footer>
      ) : (
        <footer className="flex items-center gap-3 px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <button
            type="button"
            onClick={onSkip}
            className="press inline-flex h-14 items-center gap-1.5 rounded-full px-4 text-sm text-stage-muted hover:text-stage-foreground"
          >
            <SkipForward className="size-4" /> Skip move
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => finish({})}
            className="press flex h-14 flex-1 items-center justify-center rounded-full bg-stage-accent text-lg font-semibold text-stage disabled:opacity-60"
          >
            {p.finisher ? "Done, I'm spent" : "Finish set"}
          </button>
        </footer>
      )}
    </div>
  );
}

function WeightPicker({
  kg,
  advice,
  onChange,
}: {
  kg: number;
  advice: Suggestion | null;
  onChange: (kg: number) => void;
}) {
  const step = kg < 10 ? 0.5 : 1;
  const set = (v: number) => onChange(Math.max(0, Math.round(v * 2) / 2));
  return (
    <div className="flex items-center gap-3 border-t border-white/10 px-4 pt-3">
      <div className="flex-1">
        <p className="text-sm font-semibold">Dumbbell weight (each)</p>
        <p className="text-xs text-stage-muted">
          {advice?.message ?? "Pick a weight you can lift for every rep with 1–2 to spare."}
        </p>
      </div>
      <button
        type="button"
        aria-label="Less weight"
        onClick={() => set(kg - step)}
        className="press grid size-10 place-items-center rounded-full border border-white/15 hover:border-white/35"
      >
        <Minus className="size-4" />
      </button>
      <label className="flex items-baseline gap-1">
        <span className="sr-only">Weight in kilograms</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.5}
          value={kg}
          onChange={(ev) => set(Number(ev.target.value) || 0)}
          className="w-16 rounded-lg bg-white/10 px-2 py-1.5 text-center font-mono text-lg outline-none focus:ring-2 focus:ring-stage-accent"
        />
        <span className="text-sm text-stage-muted">kg</span>
      </label>
      <button
        type="button"
        aria-label="More weight"
        onClick={() => set(kg + step)}
        className="press grid size-10 place-items-center rounded-full border border-white/15 hover:border-white/35"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

// ─── Rest ───────────────────────────────────────────────────────────────────

function RestScreen({ day, cursor, onDone }: { day: ProgramDay; cursor: Cursor; onDone: () => void }) {
  const p = day.items[cursor.item];
  const [left, setLeft] = useState(p.restSec);
  const endAt = useRef(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    endAt.current = Date.now() + p.restSec * 1000;
    const id = setInterval(() => {
      const s = Math.ceil((endAt.current - Date.now()) / 1000);
      setLeft(s);
      if (s === 10) speak(p.finisher ? "Ten seconds. Finisher next. Leave nothing." : `Ten seconds. Next, ${p.exercise.name}.`);
      if (s <= 0) {
        clearInterval(id);
        doneRef.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [p.restSec, p.exercise.name, p.finisher]);

  const setup = p.exercise.tracking.kind === "manual" ? null : p.exercise.tracking.setup;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
      <p className="text-sm font-semibold text-stage-muted">Rest</p>
      <div className="flex flex-1 flex-col justify-center">
        <span className="font-scoreboard text-[clamp(8rem,40vw,13rem)] font-extrabold" aria-live="off">
          {formatSeconds(Math.max(0, left))}
        </span>
        <p className="mt-6 text-sm font-semibold text-stage-muted">
          {p.finisher ? "Up next · finisher" : `Up next · set ${cursor.set + 1} of ${p.sets}`}
        </p>
        <p className="font-scoreboard mt-1 text-4xl font-bold uppercase">{p.exercise.name}</p>
        <MoveAnimation id={p.exercise.id} className="mt-4 h-40 max-w-sm rounded-2xl bg-white/5 p-3" />
        {setup && cursor.set === 0 && <p className="mt-3 max-w-[52ch] text-stage-muted">{setup}</p>}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            endAt.current += 15_000;
            setLeft((l) => l + 15);
          }}
          className="press h-14 rounded-full border border-white/15 px-5 font-semibold hover:border-white/35"
        >
          +15 s
        </button>
        <button
          type="button"
          onClick={onDone}
          className="press flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-stage-foreground text-lg font-semibold text-stage"
        >
          Skip rest <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}

// ─── Summary ────────────────────────────────────────────────────────────────

type Totals = {
  reps: number;
  seconds: number;
  tracked: number;
  good: number;
  minutes: number;
  topCue?: [string, number];
  /** Strength: Σ kg × reps over weighted sets. */
  volumeKg: number;
  maxSets: number;
  bests: { name: string; kg: number }[];
  /** Sculpt: reps from glute and leg moves, and the finisher result. */
  lowerReps: number;
  finisher?: { name: string; done: number; seconds: boolean };
};

function computeTotals(day: ProgramDay, session: Session, earlier: Session[]): Totals {
  const t: Totals = { reps: 0, seconds: 0, tracked: 0, good: 0, minutes: 0, volumeKg: 0, maxSets: 0, bests: [], lowerReps: 0 };
  const cues: Record<string, number> = {};
  const heaviest = new Map<string, number>();

  for (const s of session.sets) {
    const item = day.items.find((i) => i.exercise.id === s.exerciseId);
    const e = item?.exercise;
    if (e?.unit === "seconds") t.seconds += s.done;
    else t.reps += s.done;
    if (s.tracked && e?.unit === "reps") {
      t.tracked += s.done;
      t.good += s.goodReps;
    }
    if (e?.unit === "reps" && e.areas.some((a) => a === "glutes" || a === "legs")) t.lowerReps += s.done;
    if (s.weightKg !== undefined) {
      t.volumeKg += s.weightKg * s.done;
      heaviest.set(s.exerciseId, Math.max(heaviest.get(s.exerciseId) ?? 0, s.weightKg));
    }
    if (s.effort === "max") t.maxSets += 1;
    if (item?.finisher && e) t.finisher = { name: e.name, done: s.done, seconds: e.unit === "seconds" };
    for (const [k, v] of Object.entries(s.cues)) cues[k] = (cues[k] ?? 0) + v;
  }

  for (const [id, kg] of heaviest) {
    const before = earlier.flatMap((s) => s.sets.filter((x) => x.exerciseId === id && x.weightKg !== undefined));
    const prev = Math.max(0, ...before.map((x) => x.weightKg!));
    if (before.length > 0 && kg > prev) t.bests.push({ name: findExercise(id)?.name ?? id, kg });
  }

  t.topCue = Object.entries(cues).sort((a, b) => b[1] - a[1])[0];
  t.minutes = Math.round(((session.finishedAt ?? session.startedAt) - session.startedAt) / 60000);
  return t;
}

function Summary({ day, sessionId }: { day: ProgramDay; sessionId: string }) {
  const plan = PLANS[day.planId];
  const [data, setData] = useState<{ session: Session; earlier: Session[] } | null>(null);
  useEffect(() => {
    db.sessions.toArray().then((all) => {
      const session = all.find((s) => s.id === sessionId);
      if (session) setData({ session, earlier: all.filter((s) => s.id !== sessionId && s.startedAt < session.startedAt) });
    });
  }, [sessionId]);

  const t = useMemo(() => (data ? computeTotals(day, data.session, data.earlier) : null), [data, day]);
  if (!t) return null;
  const clean = t.tracked ? `${Math.round((t.good / t.tracked) * 100)}%` : "–";

  const tiles =
    plan.style === "strength"
      ? [
          { label: "Weight moved", value: t.volumeKg ? `${Math.round(t.volumeKg).toLocaleString()} kg` : "–" },
          { label: "Reps", value: String(t.reps) },
          { label: "Sets to max effort", value: String(t.maxSets) },
          { label: "Duration", value: `${t.minutes} min` },
        ]
      : [
          { label: "Glute & thigh reps", value: String(t.lowerReps) },
          { label: "Time under hold", value: formatSeconds(t.seconds) },
          { label: "Clean camera reps", value: clean },
          { label: "Duration", value: `${t.minutes} min` },
        ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
      <h1 className="font-scoreboard text-[clamp(3.5rem,14vw,5.5rem)] font-extrabold uppercase">Session done</h1>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-white/10 py-6">
        {tiles.map((tile) => (
          <div key={tile.label}>
            <dt className="text-sm text-stage-muted">{tile.label}</dt>
            <dd className="font-scoreboard text-5xl font-bold">{tile.value}</dd>
          </div>
        ))}
      </dl>

      {plan.style === "strength" && t.bests.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-stage-muted">
            <Trophy className="size-4 text-stage-accent" /> New heaviest weights
          </h2>
          <ul className="mt-2 flex flex-col gap-1">
            {t.bests.map((b) => (
              <li key={b.name} className="font-semibold">
                {b.name}: {b.kg} kg
              </li>
            ))}
          </ul>
        </section>
      )}

      {plan.style === "sculpt" && t.finisher && (
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-stage-muted">
            <Flame className="size-4 text-stage-accent" /> Finisher
          </h2>
          <p className="mt-1 text-xl font-semibold">
            {t.finisher.name}: {t.finisher.seconds ? formatSeconds(t.finisher.done) : `${t.finisher.done} reps`}
          </p>
          <p className="mt-1 text-sm text-stage-muted">Beat this number the next time this finisher comes up.</p>
        </section>
      )}

      {t.topCue && (
        <section>
          <h2 className="text-sm font-semibold text-stage-muted">Work on next time</h2>
          <p className="mt-1 text-xl font-semibold">“{t.topCue[0]}”</p>
          <p className="mt-1 text-sm text-stage-muted">The camera flagged this on {t.topCue[1]} reps.</p>
        </section>
      )}
      <section>
        <h2 className="text-sm font-semibold text-stage-muted">Cool down</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {plan.coolDown.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
      <Link
        href="/"
        className="press mt-auto flex h-14 items-center justify-center rounded-full bg-stage-accent text-lg font-semibold text-stage"
      >
        Back to today
      </Link>
    </div>
  );
}
