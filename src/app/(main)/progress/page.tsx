"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { findExercise } from "@/lib/data/exercises";
import { findDay, PROGRAMS } from "@/lib/data/program";
import { db, measurementSchema, type Gender, type Measurement, type Session } from "@/lib/db";
import { useProfile, useSessions } from "@/lib/hooks";

type FieldKey = "bustCm" | "underbustCm" | "chestCm" | "waistCm" | "hipsCm" | "armCm" | "thighCm";
type Field = { key: FieldKey; label: string };

// What's worth measuring depends on the body and the goal: bust and hips for
// shape, chest and arms for muscle gain.
const FIELDS_BY_GENDER: Record<Gender, Field[]> = {
  female: [
    { key: "bustCm", label: "Bust" },
    { key: "underbustCm", label: "Underbust" },
    { key: "waistCm", label: "Waist" },
    { key: "hipsCm", label: "Hips" },
    { key: "thighCm", label: "Thigh" },
  ],
  male: [
    { key: "chestCm", label: "Chest" },
    { key: "waistCm", label: "Waist" },
    { key: "armCm", label: "Arm" },
    { key: "thighCm", label: "Thigh" },
  ],
  unspecified: [
    { key: "chestCm", label: "Chest" },
    { key: "waistCm", label: "Waist" },
    { key: "hipsCm", label: "Hips" },
    { key: "armCm", label: "Arm" },
    { key: "thighCm", label: "Thigh" },
  ],
};

const IN_PER_CM = 1 / 2.54;

function sessionTotals(s: Session) {
  let reps = 0;
  let tracked = 0;
  let good = 0;
  for (const set of s.sets) {
    if (findExercise(set.exerciseId)?.unit !== "reps") continue;
    reps += set.done;
    if (set.tracked) {
      tracked += set.done;
      good += set.goodReps;
    }
  }
  return { reps, tracked, good };
}

export default function ProgressPage() {
  const profile = useProfile();
  const sessions = useSessions();
  const measurements = useLiveQuery(() => db.measurements.orderBy("date").reverse().toArray());

  if (!sessions || !measurements || profile === undefined) return null;

  const done = sessions.filter((s) => s.status === "done");
  const all = done.map(sessionTotals);
  const reps = all.reduce((n, t) => n + t.reps, 0);
  const tracked = all.reduce((n, t) => n + t.tracked, 0);
  const good = all.reduce((n, t) => n + t.good, 0);
  const units = profile?.units ?? "cm";
  const program = PROGRAMS[profile?.plan ?? "shape"];
  const planDays = new Set(program.map((d) => d.id));
  const doneInPlan = new Set(done.map((s) => s.dayId).filter((id) => planDays.has(id))).size;

  return (
    <div className="flex flex-col gap-12">
      <header className="pt-4">
        <h1 className="font-scoreboard text-6xl font-extrabold uppercase">Progress</h1>
        <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-line py-5">
          <div>
            <dt className="text-sm text-muted">Sessions</dt>
            <dd className="font-scoreboard text-5xl font-bold">
              {doneInPlan}
              <span className="text-2xl text-muted">/{program.length}</span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Reps</dt>
            <dd className="font-scoreboard text-5xl font-bold">{reps.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Clean form</dt>
            <dd className="font-scoreboard text-5xl font-bold">{tracked ? `${Math.round((good / tracked) * 100)}%` : "–"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted">Clean form is the share of camera-counted reps with no form cue.</p>
      </header>

      <Strength sessions={done} />

      <Measurements
        measurements={measurements}
        units={units}
        fields={FIELDS_BY_GENDER[profile?.gender ?? "female"]}
        intro={
          profile?.gender === "male"
            ? "Chest and arms grow while the waist holds steady or shrinks."
            : "Glutes can grow while your waist shrinks."
        }
      />

      <section aria-labelledby="history">
        <h2 id="history" className="font-scoreboard text-4xl font-bold uppercase">History</h2>
        {done.length === 0 ? (
          <p className="mt-3 text-muted">
            Finished sessions show up here.{" "}
            <Link href="/" className="font-semibold text-foreground underline underline-offset-4">Start today&apos;s session</Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {done.map((s) => {
              const day = findDay(s.dayId);
              const t = sessionTotals(s);
              return (
                <li key={s.id} className="flex items-center gap-4 py-3">
                  <span className="flex-1">
                    <span className="block font-semibold">
                      {day ? `Week ${day.week}: ${day.title}` : s.dayId}
                    </span>
                    <span className="block text-sm text-muted">
                      {new Date(s.finishedAt ?? s.startedAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </span>
                  <span className="font-mono text-sm tabular-nums text-muted">
                    {t.reps} reps{t.tracked ? ` · ${Math.round((t.good / t.tracked) * 100)}% clean` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/** First and latest dumbbell weight per move: the clearest sign of getting stronger. */
function Strength({ sessions }: { sessions: Session[] }) {
  const byExercise = new Map<string, { first: number; latest: number; firstAt: number; latestAt: number }>();
  for (const s of sessions) {
    for (const set of s.sets) {
      if (set.weightKg === undefined) continue;
      const cur = byExercise.get(set.exerciseId);
      if (!cur) {
        byExercise.set(set.exerciseId, { first: set.weightKg, latest: set.weightKg, firstAt: set.at, latestAt: set.at });
        continue;
      }
      if (set.at < cur.firstAt) Object.assign(cur, { first: set.weightKg, firstAt: set.at });
      if (set.at > cur.latestAt) Object.assign(cur, { latest: set.weightKg, latestAt: set.at });
    }
  }
  if (byExercise.size === 0) return null;

  return (
    <section aria-labelledby="strength">
      <h2 id="strength" className="font-scoreboard text-4xl font-bold uppercase">Strength</h2>
      <p className="mt-2 max-w-[60ch] text-muted">Dumbbell weight per move, from your first logged set to your latest.</p>
      <table className="mt-4 w-full text-sm tabular-nums">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th className="py-2 pr-3 font-semibold">Move</th>
            <th className="py-2 pr-3 font-semibold">First</th>
            <th className="py-2 pr-3 font-semibold">Latest</th>
          </tr>
        </thead>
        <tbody>
          {[...byExercise].map(([id, w]) => {
            const delta = w.latest - w.first;
            return (
              <tr key={id} className="border-b border-line">
                <td className="py-2.5 pr-3 font-semibold">{findExercise(id)?.name ?? id}</td>
                <td className="py-2.5 pr-3 font-mono">{w.first} kg</td>
                <td className="py-2.5 pr-3 font-mono">
                  {w.latest} kg
                  {delta !== 0 && (
                    <span className={delta > 0 ? "ml-1.5 text-xs text-good" : "ml-1.5 text-xs text-muted"}>
                      {delta > 0 ? "+" : "−"}
                      {Math.abs(delta)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Measurements({
  measurements,
  units,
  fields,
  intro,
}: {
  measurements: Measurement[];
  units: "cm" | "in";
  fields: Field[];
  intro: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const showRatio = fields.some((f) => f.key === "hipsCm");
  const [values, setValues] = useState<Record<string, string>>({ date: today });
  const [error, setError] = useState<string | null>(null);
  const toDisplay = (cm?: number) => (cm === undefined ? undefined : units === "cm" ? cm : cm * IN_PER_CM);
  const fmt = (n?: number) => (n === undefined ? "–" : n.toFixed(1));
  const first = measurements.at(-1);

  return (
    <section aria-labelledby="measure">
      <h2 id="measure" className="font-scoreboard text-4xl font-bold uppercase">Measurements</h2>
      <p className="mt-2 max-w-[60ch] text-muted">
        Measure every two weeks, in the morning, with the same tape in the same spots. Tape changes show progress the
        scale misses. {intro}
      </p>

      <form
        className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const num = (k: string) => {
            const v = values[k]?.trim();
            if (!v) return undefined;
            const n = Number(v);
            return units === "in" && k.endsWith("Cm") ? n / IN_PER_CM : n;
          };
          const parsed = measurementSchema.safeParse({
            date: values.date,
            weightKg: num("weightKg"),
            ...Object.fromEntries(fields.map((f) => [f.key, num(f.key)])),
          });
          if (!parsed.success) {
            setError("Check the numbers. Each one must be a positive measurement.");
            return;
          }
          if (fields.every((f) => parsed.data[f.key] === undefined) && parsed.data.weightKg === undefined) {
            setError("Enter at least one measurement.");
            return;
          }
          await db.measurements.add(parsed.data);
          setValues({ date: today });
        }}
      >
        <label className="col-span-2 flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-semibold">Date</span>
          <input
            type="date"
            value={values.date ?? today}
            max={today}
            onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
            className="h-11 rounded-xl border border-line bg-surface px-3 outline-none focus:border-primary"
          />
        </label>
        <NumberField label="Weight (kg)" name="weightKg" values={values} setValues={setValues} />
        {fields.map((f) => (
          <NumberField key={f.key} label={`${f.label} (${units})`} name={f.key} values={values} setValues={setValues} />
        ))}
        <button
          type="submit"
          className="press col-span-2 h-12 rounded-full bg-foreground font-semibold text-background sm:col-span-4"
        >
          Save measurements
        </button>
        {error && (
          <p role="alert" className="col-span-2 text-sm font-semibold text-warn sm:col-span-4">
            {error}
          </p>
        )}
      </form>

      {measurements.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm tabular-nums">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-2 pr-3 font-semibold">Date</th>
                {fields.map((f) => (
                  <th key={f.key} className="py-2 pr-3 font-semibold">{f.label}</th>
                ))}
                {showRatio && (
                  <th className="py-2 pr-3 font-semibold" title="Waist ÷ hips. Lower means a more defined waist.">
                    W:H
                  </th>
                )}
                <th className="sr-only">Delete</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m) => (
                <tr key={m.id} className="border-b border-line">
                  <td className="py-2.5 pr-3 font-mono">{m.date}</td>
                  {fields.map((f) => {
                    const v = toDisplay(m[f.key]);
                    const base = toDisplay(first?.[f.key]);
                    const delta = v !== undefined && base !== undefined && m !== first ? v - base : undefined;
                    return (
                      <td key={f.key} className="py-2.5 pr-3 font-mono">
                        {fmt(v)}
                        {delta !== undefined && Math.abs(delta) >= 0.05 && (
                          <span className="ml-1 text-xs text-muted">
                            {delta > 0 ? "+" : "−"}
                            {Math.abs(delta).toFixed(1)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {showRatio && (
                    <td className="py-2.5 pr-3 font-mono">
                      {m.waistCm && m.hipsCm ? (m.waistCm / m.hipsCm).toFixed(2) : "–"}
                    </td>
                  )}
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      aria-label={`Delete measurements from ${m.date}`}
                      onClick={() => m.id !== undefined && db.measurements.delete(m.id)}
                      className="press rounded-full p-1.5 text-muted hover:text-warn"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">
            Small numbers show the change since your first entry.{showRatio ? " W:H is waist ÷ hips." : ""}
          </p>
        </div>
      )}
    </section>
  );
}

function NumberField({
  label,
  name,
  values,
  setValues,
}: {
  label: string;
  name: string;
  values: Record<string, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      <input
        inputMode="decimal"
        type="number"
        step="0.1"
        min="0"
        value={values[name] ?? ""}
        onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
        className="h-11 rounded-xl border border-line bg-surface px-3 font-mono outline-none focus:border-primary"
      />
    </label>
  );
}
