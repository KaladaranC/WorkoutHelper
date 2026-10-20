"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Hand } from "lucide-react";
import { MoveThumb } from "@/components/figure/move-figure";
import { AREA_LABEL, EXERCISES, type Area } from "@/lib/data/exercises";
import { areaLabel, PLANS, planExerciseIds } from "@/lib/data/program";
import { useProfile } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type Filter = "plan" | "all" | Area;

export default function MovesPage() {
  const profile = useProfile();
  const [filter, setFilter] = useState<Filter>("plan");
  if (profile === undefined) return null;

  const plan = profile ? PLANS[profile.plan] : undefined;
  const inPlan = plan ? planExerciseIds(plan.id) : null;
  const filters: Filter[] = [...(inPlan ? (["plan"] as const) : []), "all", ...(plan?.areas ?? (Object.keys(AREA_LABEL) as Area[]))];
  const active: Filter = !inPlan && filter === "plan" ? "all" : filter;

  const list = EXERCISES.filter((e) =>
    active === "all" ? true : active === "plan" ? inPlan!.has(e.id) : e.areas.includes(active),
  );
  const tracked = EXERCISES.filter((e) => e.tracking.kind !== "manual").length;
  const label = (f: Filter) =>
    f === "plan" ? "In your plan" : f === "all" ? "All" : areaLabel(plan, f, AREA_LABEL[f]);

  return (
    <div className="flex flex-col gap-6">
      <header className="pt-4">
        <h1 className="font-scoreboard text-6xl font-extrabold uppercase">Moves</h1>
        <p className="mt-3 max-w-[56ch] text-muted">
          {EXERCISES.length} home moves. The camera can count {tracked} of them. Open any move to see how to do it, or
          practise it with the camera before a session.
        </p>
      </header>

      <div role="group" aria-label="Filter moves" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={active === f}
            onClick={() => setFilter(f)}
            className={cn(
              "press rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-foreground/40",
              active === f && "border-foreground bg-foreground text-background",
            )}
          >
            {label(f)}
          </button>
        ))}
      </div>

      <p className="-mt-2 text-sm text-muted">
        {list.length} {list.length === 1 ? "move" : "moves"}
      </p>

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
