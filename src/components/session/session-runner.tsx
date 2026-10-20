"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Camera, ChevronDown, Hand, SkipForward, X } from "lucide-react";
import { CoachPanel, type CoachStats } from "@/components/coach/coach-panel";
import { bandClass } from "@/components/band";
import { MoveAnimation } from "@/components/figure/move-animation";
import { MoveThumb } from "@/components/figure/move-figure";
import { COOL_DOWN, estimateMinutes, findDay, WARM_UP, type Prescription, type ProgramDay } from "@/lib/data/program";
import { db, finishSession, logSet, openSession, type Session } from "@/lib/db";
import { useProfile, useSessions } from "@/lib/hooks";
import { speak } from "@/lib/speech";
import { cn, formatSeconds } from "@/lib/utils";
import { useWakeLock } from "./use-wake-lock";

type Cursor = { item: number; set: number };
type Stage = "overview" | "set" | "rest" | "summary";

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

  const finishSet = async () => {
    if (!session) return;
    const p = day.items[cursor.item];
    await logSet(session.id, {
      exerciseId: p.exercise.id,
      setIndex: cursor.set,
      target: targetFor(p),
      ...stats.current,
      at: Date.now(),
    });
    const next = nextCursor(day, cursor);
    if (!next) {
      await finishSession(session.id);
      speak("Session complete. Great work.", { interrupt: true });
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
    <div className="flex min-h-dvh flex-col bg-stage text-stage-foreground">
      {stage === "overview" && (
        <Overview
          day={day}
          sessions={sessions}
          onStart={start}
        />
      )}
      {stage === "set" && session && (
        <SetScreen
          key={`${cursor.item}-${cursor.set}`}
          day={day}
          cursor={cursor}
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
  const active = sessions.find((s) => s.dayId === day.id && s.status === "active");
  const done = sessions.find((s) => s.dayId === day.id && s.status === "done");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-10">
      <Link href="/" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-stage-muted hover:text-stage-foreground">
        <ArrowLeft className="size-4" /> Today
      </Link>
      <header>
        <p className="flex items-center gap-3 text-sm font-semibold text-stage-muted">
          <span className={cn("h-2 w-10 rounded-full", bandClass(day.phase))} />
          Week {day.week} · {day.phase.name} · about {estimateMinutes(day)} min
        </p>
        <h1 className="font-scoreboard mt-3 text-[clamp(3.5rem,14vw,5.5rem)] font-extrabold uppercase">{day.title}</h1>
        {done && !active && (
          <p className="mt-3 text-stage-muted">
            You finished this session on {new Date(done.finishedAt ?? done.startedAt).toLocaleDateString()}. You can
            do it again any time.
          </p>
        )}
      </header>

      <section aria-labelledby="warm">
        <h2 id="warm" className="text-sm font-semibold text-stage-muted">Warm up first, about 5 min</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {WARM_UP.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="moves">
        <h2 id="moves" className="text-sm font-semibold text-stage-muted">Moves</h2>
        <p className="mt-1 text-sm text-stage-muted">Tap a move to see how to do it.</p>
        <ol className="mt-2 divide-y divide-white/10 border-y border-white/10">
          {day.items.map((p) => (
            <li key={p.exercise.id}>
              <MoveRow p={p} />
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
        className="press mt-auto flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground hover:brightness-110"
      >
        {active ? "Resume session" : "I'm warmed up, start"} <ArrowRight className="size-5" />
      </button>
    </div>
  );
}

/** A move in the session list that opens in place to show the tutorial. */
function MoveRow({ p }: { p: Prescription }) {
  const [open, setOpen] = useState(false);
  const e = p.exercise;
  const panelId = `how-${e.id}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 py-2.5 text-left hover:bg-white/5"
      >
        <MoveThumb id={e.id} className="h-12 w-16" />
        <span className="flex-1 font-semibold">{e.name}</span>
        <span className="font-mono text-sm tabular-nums text-stage-muted">
          {p.sets}×{p.amount}
          {e.unit === "seconds" ? "s" : ""}
          {e.perSide ? "/side" : ""}
        </span>
        {e.tracking.kind === "manual" ? (
          <Hand className="size-4 text-stage-muted" aria-label="Counted by hand" />
        ) : (
          <Camera className="size-4" aria-label="Counted by camera" />
        )}
        <ChevronDown className={cn("size-4 text-stage-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div id={panelId} className="flex flex-col gap-4 pb-5">
          <MoveAnimation id={e.id} className="h-48 rounded-2xl bg-white/5 p-3" />
          <ol className="flex list-decimal flex-col gap-2 pl-5 marker:font-mono marker:text-stage-muted">
            {e.steps.map((s) => (
              <li key={s} className="max-w-[60ch] pl-1">
                {s}
              </li>
            ))}
          </ol>
          <p>
            <span className="text-sm font-semibold text-stage-muted">Cues: </span>
            {e.cues.join(" · ")}
          </p>
          <p className="text-sm text-stage-muted">
            {e.tracking.kind === "manual" ? e.tracking.reason : e.tracking.setup}
          </p>
          <Link href={`/moves/${e.id}`} className="self-start text-sm font-semibold underline underline-offset-4">
            Common mistakes and easier or harder versions
          </Link>
        </div>
      )}
    </>
  );
}

// ─── Set ────────────────────────────────────────────────────────────────────

function SetScreen({
  day,
  cursor,
  model,
  onStats,
  onFinish,
  onSkip,
  onExit,
}: {
  day: ProgramDay;
  cursor: Cursor;
  model: "lite" | "full";
  onStats: (s: CoachStats) => void;
  onFinish: () => void;
  onSkip: () => void;
  onExit: () => void;
}) {
  const p = day.items[cursor.item];
  const e = p.exercise;
  const target = targetFor(p);
  const [howTo, setHowTo] = useState(false);
  const [busy, setBusy] = useState(false);
  const totalSets = day.items.reduce((n, i) => n + i.sets, 0);
  const setsBefore = day.items.slice(0, cursor.item).reduce((n, i) => n + i.sets, 0) + cursor.set;

  useEffect(() => {
    speak(`${e.name}. Set ${cursor.set + 1} of ${p.sets}.`, { interrupt: true });
  }, [e.name, cursor.set, p.sets]);

  return (
    <div className="flex h-dvh flex-col">
      <div className="h-1 bg-white/10">
        <div className={cn("h-full", bandClass(day.phase))} style={{ width: `${(setsBefore / totalSets) * 100}%` }} />
      </div>
      <header className="flex items-start gap-3 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
        <div className="flex-1">
          <h1 className="font-scoreboard text-4xl font-extrabold uppercase">{e.name}</h1>
          <p className="mt-1 text-sm text-stage-muted">
            Set {cursor.set + 1} of {p.sets} ·{" "}
            {e.perSide
              ? `${p.amount}${e.unit === "seconds" ? "s" : ""} each side`
              : `${p.amount}${e.unit === "seconds" ? " seconds" : " reps"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHowTo((v) => !v)}
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
              <li key={s} className="max-w-[60ch] pl-1">{s}</li>
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
        <CoachPanel exercise={e} target={target} model={model} cameraDefault onStats={onStats} />
      )}

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
          onClick={async () => {
            setBusy(true);
            await onFinish();
          }}
          className="press flex h-14 flex-1 items-center justify-center rounded-full bg-stage-foreground text-lg font-semibold text-stage disabled:opacity-60"
        >
          Finish set
        </button>
      </footer>
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
      if (s === 10) speak(`Ten seconds. Next, ${p.exercise.name}.`);
      if (s <= 0) {
        clearInterval(id);
        doneRef.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [p.restSec, p.exercise.name]);

  const setup = p.exercise.tracking.kind === "manual" ? null : p.exercise.tracking.setup;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
      <p className="text-sm font-semibold text-stage-muted">Rest</p>
      <div className="flex flex-1 flex-col justify-center">
        <span className="font-scoreboard text-[clamp(8rem,40vw,13rem)] font-extrabold" aria-live="off">
          {formatSeconds(Math.max(0, left))}
        </span>
        <p className="mt-6 text-sm font-semibold text-stage-muted">Up next · set {cursor.set + 1} of {p.sets}</p>
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

function Summary({ day, sessionId }: { day: ProgramDay; sessionId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    db.sessions.get(sessionId).then((s) => setSession(s ?? null));
  }, [sessionId]);

  const totals = useMemo(() => {
    if (!session) return null;
    let reps = 0;
    let tracked = 0;
    let good = 0;
    let seconds = 0;
    const cues: Record<string, number> = {};
    for (const s of session.sets) {
      const e = day.items.find((i) => i.exercise.id === s.exerciseId)?.exercise;
      if (e?.unit === "seconds") seconds += s.done;
      else reps += s.done;
      if (s.tracked && e?.unit === "reps") {
        tracked += s.done;
        good += s.goodReps;
      }
      for (const [k, v] of Object.entries(s.cues)) cues[k] = (cues[k] ?? 0) + v;
    }
    const topCue = Object.entries(cues).sort((a, b) => b[1] - a[1])[0];
    const minutes = Math.round(((session.finishedAt ?? session.startedAt) - session.startedAt) / 60000);
    return { reps, seconds, tracked, good, topCue, minutes };
  }, [session, day.items]);

  if (!totals) return null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
      <h1 className="font-scoreboard text-[clamp(3.5rem,14vw,5.5rem)] font-extrabold uppercase">Session done</h1>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-white/10 py-6">
        <div>
          <dt className="text-sm text-stage-muted">Reps</dt>
          <dd className="font-scoreboard text-5xl font-bold">{totals.reps}</dd>
        </div>
        <div>
          <dt className="text-sm text-stage-muted">Time under hold</dt>
          <dd className="font-scoreboard text-5xl font-bold">{formatSeconds(totals.seconds)}</dd>
        </div>
        <div>
          <dt className="text-sm text-stage-muted">Clean camera reps</dt>
          <dd className="font-scoreboard text-5xl font-bold">
            {totals.tracked ? `${Math.round((totals.good / totals.tracked) * 100)}%` : "–"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-stage-muted">Duration</dt>
          <dd className="font-scoreboard text-5xl font-bold">{totals.minutes} min</dd>
        </div>
      </dl>
      {totals.topCue && (
        <section>
          <h2 className="text-sm font-semibold text-stage-muted">Work on next time</h2>
          <p className="mt-1 text-xl font-semibold">“{totals.topCue[0]}”</p>
          <p className="mt-1 text-sm text-stage-muted">The camera flagged this on {totals.topCue[1]} reps.</p>
        </section>
      )}
      <section>
        <h2 className="text-sm font-semibold text-stage-muted">Cool down</h2>
        <ul className="mt-2 flex flex-col gap-1">
          {COOL_DOWN.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
      <Link
        href="/"
        className="press mt-auto flex h-14 items-center justify-center rounded-full bg-stage-foreground text-lg font-semibold text-stage"
      >
        Back to today
      </Link>
    </div>
  );
}
