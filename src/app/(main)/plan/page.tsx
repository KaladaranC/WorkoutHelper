"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Band } from "@/components/band";
import { PLANS, PROGRAMS } from "@/lib/data/program";
import { completedDayIds, useProfile, useSessions } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export default function PlanPage() {
  const sessions = useSessions();
  const profile = useProfile();
  if (profile === undefined) return null;
  const plan = PLANS[profile?.plan ?? "shape"];
  const program = PROGRAMS[plan.id];
  const done = new Set(sessions ? completedDayIds(sessions) : []);

  return (
    <div className="flex flex-col gap-12">
      <header className="pt-4">
        <h1 className="font-scoreboard text-6xl font-extrabold uppercase">The plan</h1>
        <p className="mt-2 font-semibold">{plan.name}</p>
        <p className="mt-2 max-w-[56ch] text-muted">
          Three phases over eight weeks, four sessions a week. Each phase wears a resistance band colour, from light to
          heavy, because each one asks more of you than the last. Needs: {plan.equipment}
        </p>
        <p className="mt-2 text-sm text-muted">
          Want a different plan?{" "}
          <Link href="/settings" className="font-semibold text-foreground underline underline-offset-4">
            Switch in Settings
          </Link>
        </p>
      </header>

      {plan.phases.map((phase) => (
        <section key={phase.id} aria-labelledby={`phase-${phase.id}`}>
          <div className="flex items-center gap-3">
            <Band phase={phase} className="w-14" />
            <h2 id={`phase-${phase.id}`} className="font-scoreboard text-4xl font-bold uppercase">
              {phase.name}
            </h2>
            <span className="text-sm text-muted">
              Weeks {phase.weeks[0]}–{phase.weeks.at(-1)}
            </span>
          </div>
          <p className="mt-2 max-w-[60ch] text-muted">{phase.summary}</p>

          <div className="mt-5 flex flex-col gap-6">
            {phase.weeks.map((week) => (
              <div key={week}>
                <h3 className="text-sm font-semibold">Week {week}</h3>
                <ul className="mt-2 divide-y divide-line border-y border-line">
                  {program.filter((d) => d.week === week).map((d) => (
                    <li key={d.id}>
                      <Link href={`/session/${d.id}`} className="flex items-center gap-4 py-3 hover:bg-surface">
                        <span className="font-mono w-6 text-sm text-muted uppercase">{d.key}</span>
                        <span className="flex-1">
                          <span className="block font-semibold">{d.title}</span>
                          <span className="block text-sm text-muted">
                            {d.items.length} moves · {d.focus}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "grid size-7 place-items-center rounded-full border border-line",
                            done.has(d.id) && "border-transparent bg-good text-background",
                          )}
                          aria-label={done.has(d.id) ? "Completed" : "Not done yet"}
                        >
                          {done.has(d.id) && <Check className="size-4" />}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
