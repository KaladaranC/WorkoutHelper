"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Hand } from "lucide-react";
import { MoveThumb } from "@/components/figure/move-figure";
import { EXERCISES, GOAL_LABEL, type Goal } from "@/lib/data/exercises";
import { cn } from "@/lib/utils";

const FILTERS: (Goal | "all")[] = ["all", "glutes", "thighs", "bust", "waist"];

export default function MovesPage() {
  const [goal, setGoal] = useState<Goal | "all">("all");
  const list = goal === "all" ? EXERCISES : EXERCISES.filter((e) => e.goals.includes(goal));
  const tracked = EXERCISES.filter((e) => e.tracking.kind !== "manual").length;

  return (
    <div className="flex flex-col gap-6">
      <header className="pt-4">
        <h1 className="font-scoreboard text-6xl font-extrabold uppercase">Moves</h1>
        <p className="mt-3 max-w-[56ch] text-muted">
          {EXERCISES.length} moves, no gym needed. The camera can count {tracked} of them. Open any move to see how to
          do it, or practise it with the camera before a session.
        </p>
      </header>

      <div role="group" aria-label="Filter by goal" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={goal === f}
            onClick={() => setGoal(f)}
            className={cn(
              "press rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-foreground/40",
              goal === f && "border-foreground bg-foreground text-background",
            )}
          >
            {f === "all" ? "All" : GOAL_LABEL[f]}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-line border-y border-line">
        {list.map((e) => (
          <li key={e.id}>
            <Link href={`/moves/${e.id}`} className="flex items-center gap-4 py-3 hover:bg-surface">
              <MoveThumb id={e.id} />
              <span className="flex-1">
                <span className="block font-semibold">{e.name}</span>
                <span className="block text-sm text-muted">{e.muscles}</span>
              </span>
              {e.tracking.kind === "manual" ? (
                <Hand className="size-4 text-muted" aria-label="Counted by hand" />
              ) : (
                <Camera className="size-4 text-foreground" aria-label="Counted by camera" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
