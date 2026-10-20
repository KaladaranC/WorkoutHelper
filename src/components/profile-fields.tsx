"use client";

import { Check } from "lucide-react";
import { PLAN_LIST, type PlanId } from "@/lib/data/program";
import type { Gender } from "@/lib/db";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "female", label: "Woman" },
  { value: "male", label: "Man" },
  { value: "unspecified", label: "Prefer not to say" },
];

export function GenderPicker({ value, onChange }: { value: Gender | null; onChange: (g: Gender) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Gender</legend>
      <p className="mt-1 text-sm text-muted">Sets your default plan and which body measurements you track.</p>
      <div role="radiogroup" className="mt-2 flex flex-wrap gap-2">
        {GENDER_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "press h-11 rounded-full border border-line px-5 font-semibold hover:border-foreground/40",
              value === o.value && "border-foreground bg-foreground text-background",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PlanPicker({ value, onChange }: { value: PlanId; onChange: (p: PlanId) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Plan</legend>
      <div role="radiogroup" className="mt-2 grid gap-2 sm:grid-cols-2">
        {PLAN_LIST.map((p) => {
          const selected = value === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(p.id)}
              className={cn(
                "press flex flex-col gap-1.5 rounded-2xl border border-line p-4 text-left hover:border-foreground/40",
                selected && "border-foreground ring-1 ring-foreground",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-scoreboard text-2xl font-bold uppercase">{p.name}</span>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border border-line",
                    selected && "border-transparent bg-foreground text-background",
                  )}
                  aria-hidden
                >
                  {selected && <Check className="size-3.5" />}
                </span>
              </span>
              <span className="text-sm">{p.summary}</span>
              <span className="text-xs text-muted">Needs: {p.equipment}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
