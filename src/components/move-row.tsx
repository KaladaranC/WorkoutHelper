"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, ChevronDown, Hand } from "lucide-react";
import { MoveAnimation } from "@/components/figure/move-animation";
import { MoveThumb } from "@/components/figure/move-figure";
import { targetLabel, type Prescription } from "@/lib/data/program";
import { cn } from "@/lib/utils";

const TONE = {
  page: { muted: "text-muted", marker: "marker:text-muted", hover: "hover:bg-surface", panel: "border border-line bg-surface" },
  stage: { muted: "text-stage-muted", marker: "marker:text-stage-muted", hover: "hover:bg-white/5", panel: "bg-white/5" },
} as const;

/** A move in a workout list that opens in place to show how to do it. */
export function MoveRow({ p, tone = "page" }: { p: Prescription; tone?: keyof typeof TONE }) {
  const [open, setOpen] = useState(false);
  const e = p.exercise;
  const t = TONE[tone];
  const panelId = `how-${e.id}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn("flex w-full items-center gap-4 py-2.5 text-left", t.hover)}
      >
        <MoveThumb id={e.id} className="h-12 w-16" />
        <span className="flex-1">
          <span className="block font-semibold">{e.name}</span>
          <span className={cn("block text-sm", t.muted)}>{e.muscles}</span>
        </span>
        <span className={cn("text-right font-mono text-sm tabular-nums", p.finisher ? "font-semibold" : t.muted)}>
          {targetLabel(p)}
        </span>
        {e.tracking.kind === "manual" ? (
          <Hand className={cn("size-4", t.muted)} aria-label="Counted by hand" />
        ) : (
          <Camera className="size-4" aria-label="Counted by camera" />
        )}
        <ChevronDown className={cn("size-4 transition-transform", t.muted, open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div id={panelId} className="flex flex-col gap-4 pb-5">
          <MoveAnimation id={e.id} className={cn("h-48 rounded-2xl p-3", t.panel)} />
          <ol className={cn("flex list-decimal flex-col gap-2 pl-5 marker:font-mono", t.marker)}>
            {e.steps.map((s) => (
              <li key={s} className="max-w-[60ch] pl-1">
                {s}
              </li>
            ))}
          </ol>
          <p>
            <span className={cn("text-sm font-semibold", t.muted)}>Cues: </span>
            {e.cues.join(" · ")}
          </p>
          <p className={cn("text-sm", t.muted)}>
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
