"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Band, bandClass } from "@/components/band";
import { MoveRow } from "@/components/move-row";
import { GenderPicker, PlanPicker } from "@/components/profile-fields";
import { findExercise } from "@/lib/data/exercises";
import { estimateMinutes, findDay, nextDay, PLANS, PROGRAMS, TOTAL_WEEKS, type PlanId } from "@/lib/data/program";
import { defaultPlanFor, saveProfile, type Gender, type Session } from "@/lib/db";
import { completedDayIds, useProfile, useSessions } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export default function TodayPage() {
  const profile = useProfile();
  const sessions = useSessions();

  if (profile === undefined || sessions === undefined) return null;
  if (profile === null) return <Onboarding />;

  const plan = PLANS[profile.plan];
  const program = PROGRAMS[profile.plan];
  const done = completedDayIds(sessions);
  const day = nextDay(profile.plan, done);
  const active = sessions.find((s) => s.status === "active");
  const last = sessions.find((s) => s.status === "done");

  if (!day) {
    return (
      <section className="pt-10">
        <h1 className="font-scoreboard text-6xl font-extrabold uppercase">Plan complete</h1>
        <p className="mt-4 max-w-[52ch] text-muted">
          All {program.length} sessions done, {profile.name}. Repeat the last phase with heavier weights or slower
          reps, or switch plans in Settings.
        </p>
        <Link
          href="/progress"
          className="press mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground"
        >
          See your progress <ArrowRight className="size-4" />
        </Link>
      </section>
    );
  }

  const weekDays = program.filter((d) => d.week === day.week);
  const resuming = active?.dayId === day.id;

  return (
    <div className="flex flex-col gap-10">
      <section className="pt-4">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-muted">
          <Band phase={day.phase} />
          Week {day.week} of {TOTAL_WEEKS} · {day.phase.name}
          <span className="font-normal">· {plan.name}</span>
        </p>
        <h1 className="font-scoreboard mt-3 text-[clamp(3.5rem,14vw,5.5rem)] font-extrabold uppercase">
          {day.title}
        </h1>
        <p className="mt-3 text-lg text-muted">
          {day.focus}. Session {day.index} of {program.length}, about {estimateMinutes(day)} min.
        </p>

        <Link
          href={`/session/${day.id}`}
          className="press mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground hover:brightness-110 sm:w-auto sm:px-10"
        >
          {resuming ? "Resume session" : "Start session"} <ArrowRight className="size-5" />
        </Link>
        {last && <LastSession session={last} />}
      </section>

      <section aria-labelledby="moves-heading">
        <h2 id="moves-heading" className="text-sm font-semibold text-muted">
          Today&apos;s moves
        </h2>
        <p className="mt-1 text-sm text-muted">Tap a move to see how to do it.</p>
        <ol className="mt-3 divide-y divide-line border-y border-line">
          {day.items.map((item) => (
            <li key={item.exercise.id}>
              <MoveRow p={item} />
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="week-heading">
        <h2 id="week-heading" className="text-sm font-semibold text-muted">
          Week {day.week}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weekDays.map((d) => {
            const isDone = done.includes(d.id);
            const isNext = d.id === day.id;
            return (
              <li key={d.id}>
                <Link
                  href={`/session/${d.id}`}
                  className={cn(
                    "flex h-full flex-col gap-2 rounded-2xl border border-line p-3 text-sm hover:border-foreground/30",
                    isNext && "border-foreground",
                  )}
                >
                  <span className={cn("h-1.5 w-full rounded-full", isDone ? bandClass(d.phase) : "bg-line")} />
                  <span className="font-semibold leading-tight">{d.title}</span>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs text-muted">
                    {isDone ? (
                      <>
                        <Check className="size-3.5" /> Done
                      </>
                    ) : isNext ? (
                      "Up next"
                    ) : (
                      "Later"
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Leave a rest day between sessions when you can. {plan.restDayNote}{" "}
          <Link href="/science" className="font-semibold text-foreground underline underline-offset-4">
            Why this plan works
          </Link>
        </p>
      </section>
    </div>
  );
}

function LastSession({ session }: { session: Session }) {
  const day = findDay(session.dayId);
  let reps = 0;
  for (const s of session.sets) if (findExercise(s.exerciseId)?.unit === "reps") reps += s.done;
  const when = new Date(session.finishedAt ?? session.startedAt).toLocaleDateString(undefined, {
    weekday: "long",
  });
  return (
    <p className="mt-4 text-sm text-muted">
      Last workout: {day?.title ?? "Session"} on {when}, {reps} reps.
    </p>
  );
}

function Onboarding() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [plan, setPlan] = useState<PlanId | null>(null);
  const [voice, setVoice] = useState(true);
  const [saving, setSaving] = useState(false);
  // Until a plan is picked explicitly, it follows the gender choice.
  const chosenPlan: PlanId = plan ?? defaultPlanFor(gender ?? "unspecified");
  const ready = name.trim() !== "" && gender !== null;

  return (
    <section className="flex flex-col gap-8 pt-8">
      <div>
        <h1 className="font-scoreboard text-[clamp(3.5rem,14vw,5.5rem)] font-extrabold uppercase">
          Eight weeks.
          <br />
          Every rep counted.
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg text-muted">
          A home workout plan with a coach in your phone. Prop it up and the camera counts your reps and tells you when
          your form slips. Video is analysed on this device, never uploaded, and never saved.
        </p>
      </div>

      <form
        className="flex flex-col gap-7"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!ready || gender === null) return;
          setSaving(true);
          await saveProfile({
            name: name.trim(),
            gender,
            plan: chosenPlan,
            startedOn: new Date().toISOString().slice(0, 10),
            voice,
            model: "lite",
            units: "cm",
          });
        }}
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">What should we call you?</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
            autoComplete="given-name"
            className="h-12 rounded-xl border border-line bg-surface px-4 text-lg outline-none focus:border-primary"
          />
        </label>

        <GenderPicker value={gender} onChange={setGender} />

        {gender !== null && <PlanPicker value={chosenPlan} onChange={setPlan} />}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={voice}
            onChange={(e) => setVoice(e.target.checked)}
            className="mt-1 size-5 accent-[var(--primary)]"
          />
          <span>
            <span className="block font-semibold">Coach out loud</span>
            <span className="block text-sm text-muted">
              Hear rep counts and form cues so you don&apos;t have to look at the screen.
            </span>
          </span>
        </label>
        <button
          type="submit"
          disabled={saving || !ready}
          className="press h-14 rounded-full bg-primary text-lg font-semibold text-primary-foreground disabled:opacity-50"
        >
          Start week 1
        </button>
      </form>
    </section>
  );
}
