"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import { findExercise } from "@/lib/data/exercises";
import { lerpFrame } from "@/lib/figure";
import { cn } from "@/lib/utils";
import { FigureSVG } from "./figure-svg";
import { figureData, focusJoint } from "./move-figure";

// Loops start → finish → start at a coaching tempo: pause, move, pause, return.
const HOLD_START = 700;
const MOVE = 1100;
const HOLD_END = 900;
const CYCLE = HOLD_START + MOVE + HOLD_END + MOVE;

const REDUCED = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () => window.matchMedia(REDUCED).matches;
function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function phaseAt(ms: number): { t: number; label: "Start" | "Finish" } {
  const m = ms % CYCLE;
  if (m < HOLD_START) return { t: 0, label: "Start" };
  if (m < HOLD_START + MOVE) return { t: ease((m - HOLD_START) / MOVE), label: "Finish" };
  if (m < HOLD_START + MOVE + HOLD_END) return { t: 1, label: "Finish" };
  return { t: 1 - ease((m - HOLD_START - MOVE - HOLD_END) / MOVE), label: "Start" };
}

export function MoveAnimation({ id, className, showLabel = true }: { id: string; className?: string; showLabel?: boolean }) {
  const data = useMemo(() => figureData(id), [id]);
  const animated = data !== null && data.ill.end !== undefined;
  const [phase, setPhase] = useState<{ t: number; label: "Start" | "Finish" }>({ t: animated ? 0 : 1, label: "Start" });
  const reduced = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  // The loop is the tutorial, so it stays available with reduced motion, it just doesn't autoplay.
  const [choice, setChoice] = useState<boolean | null>(null);
  const playing = animated && (choice ?? !reduced);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      setPhase(phaseAt(now - t0));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  if (!data) return null;
  const name = findExercise(id)?.name ?? id;
  const frame = lerpFrame(data.frames.start, data.frames.end, phase.t);

  return (
    <figure className={cn("flex flex-col items-center gap-2", className)}>
      <FigureSVG
        frame={frame}
        box={data.box}
        props={data.ill.props}
        dumbbells={data.ill.dumbbells}
        focus={focusJoint(id)}
        title={`${name} demonstration`}
        className="max-h-full w-full flex-1"
      />
      {showLabel && (
        <figcaption className="flex items-center gap-3 text-xs font-semibold">
          <span className="opacity-70">{animated ? phase.label : "Hold this position"}</span>
          {animated && (
            <button
              type="button"
              onClick={() => setChoice(!playing)}
              aria-label={playing ? "Pause demonstration" : "Play demonstration"}
              className="press grid size-7 place-items-center rounded-full border border-current/25 hover:border-current/60"
            >
              {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </button>
          )}
        </figcaption>
      )}
    </figure>
  );
}
