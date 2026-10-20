"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Camera, Check, Hand } from "lucide-react";
import { Band, bandClass } from "@/components/band";
import { MoveThumb } from "@/components/figure/move-figure";
import { estimateMinutes, nextDay, PROGRAM, TOTAL_WEEKS } from "@/lib/data/program";
import { saveProfile } from "@/lib/db";
import { completedDayIds, useProfile, useSessions } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export default function TodayPage() {
  const profile = useProfile();
  const sessions = useSessions();

  if (profile === undefined || sessions === undefined) return null;
  if (profile === null) return <Onboarding />;

  const done = completedDayIds(sessions);
  const day = nextDay(done);
  const active = sessions.find((s) => s.status === "active");

  if (!day) {
    return (
      <section className="pt-10">
        <h1 className="font-scoreboard text-6xl font-extrabold uppercase">Program complete</h1>
        <p className="mt-4 max-w-[52ch] text-muted">
          All {PROGRAM.length} sessions done, {profile.name}. Repeat the Sculpt phase with slower reps, or log your
          measurements to see how far you&apos;ve come.
        </p>
        <Link href="/progress" className="press mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground">
          See your progress <ArrowRight className="size-4" />
        </Link>
      </section>
    );
  }

  const weekDays = PROGRAM.filter((d) => d.week === day.week);
  const resuming = active?.dayId === day.id;

  return (
    <div className="flex flex-col gap-10">
      <section className="pt-4">
        <p className="flex items-center gap-3 text-sm font-semibold text-muted">
          <Band phase={day.phase} />
          Week {day.week} of {TOTAL_WEEKS} · {day.phase.name}
        </p>
        <h1 className="font-scoreboard mt-3 text-[clamp(3.5rem,14vw,5.5rem)] font-extrabold uppercase">
          {day.title}
        </h1>
        <p className="mt-3 text-lg text-muted">
          {day.focus}. Session {day.index} of {PROGRAM.length}, about {estimateMinutes(day)} min.
        </p>

        <Link
          href={`/session/${day.id}`}
          className="press mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground hover:brightness-110 sm:w-auto sm:px-10"
        >
          {resuming ? "Resume session" : "Start session"} <ArrowRight className="size-5" />
        </Link>
      </section>

      <section aria-labelledby="moves-heading">
        <h2 id="moves-heading" className="text-sm font-semibold text-muted">
          Today&apos;s moves
        </h2>
        <ol className="mt-3 divide-y divide-line border-y border-line">
          {day.items.map((item) => {
            const tracked = item.exercise.tracking.kind !== "manual";
            return (
              <li key={item.exercise.id}>
                <Link href={`/moves/${item.exercise.id}`} className="flex items-center gap-4 py-3 hover:bg-surface">
                  <MoveThumb id={item.exercise.id} />
                  <span className="flex-1">
                    <span className="block font-semibold">{item.exercise.name}</span>
                    <span className="block text-sm text-muted">{item.exercise.muscles}</span>
                  </span>
                  <span className="font-mono text-sm tabular-nums">
                    {item.sets}×{item.amount}
                    {item.exercise.unit === "seconds" ? "s" : ""}
                    {item.exercise.perSide ? "/side" : ""}
                  </span>
                  <span className="text-muted" title={tracked ? "Counted by camera" : "Counted by hand"}>
                    {tracked ? <Camera className="size-4" aria-label="Counted by camera" /> : <Hand className="size-4" aria-label="Counted by hand" />}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="week-heading">
        <h2 id="week-heading" className="text-sm font-semibold text-muted">
          Week {day.week}
        </h2>
        <ul className="mt-3 grid grid-cols-4 gap-2">
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
          Leave a rest day between sessions when you can. On rest days, a 30-minute walk does more for your waist than
          extra crunches. <Link href="/science" className="font-semibold text-foreground underline underline-offset-4">Why this plan works</Link>
        </p>
      </section>
    </div>
  );
}

function Onboarding() {
  const [name, setName] = useState("");
  const [voice, setVoice] = useState(true);
  const [saving, setSaving] = useState(false);

  return (
    <section className="flex flex-col gap-8 pt-8">
      <div>
        <h1 className="font-scoreboard text-[clamp(3.5rem,14vw,5.5rem)] font-extrabold uppercase">
          Eight weeks.
          <br />
          Every rep counted.
        </h1>
        <p className="mt-5 max-w-[52ch] text-lg text-muted">
          A home plan for glutes, thighs, bust and waist. Prop your phone up and its camera counts your reps and tells
          you when your form slips. Video is analysed on this device, never uploaded, and never saved.
        </p>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setSaving(true);
          await saveProfile({
            name: name.trim(),
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
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={voice}
            onChange={(e) => setVoice(e.target.checked)}
            className="mt-1 size-5 accent-[var(--primary)]"
          />
          <span>
            <span className="block font-semibold">Coach out loud</span>
            <span className="block text-sm text-muted">Hear rep counts and form cues so you don&apos;t have to look at the screen.</span>
          </span>
        </label>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="press mt-2 h-14 rounded-full bg-primary text-lg font-semibold text-primary-foreground disabled:opacity-50"
        >
          Start week 1
        </button>
      </form>
    </section>
  );
}
