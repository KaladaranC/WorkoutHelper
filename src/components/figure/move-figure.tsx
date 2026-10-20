import { findExercise } from "@/lib/data/exercises";
import { ILLUSTRATIONS } from "@/lib/data/illustrations";
import { bounds, resolveIllustration } from "@/lib/figure";
import type { MetricId } from "@/lib/pose/metrics";
import { cn } from "@/lib/utils";
import { FigureSVG, type FocusJoint } from "./figure-svg";

const FOCUS_BY_METRIC: Record<MetricId, FocusJoint> = {
  knee: "knee",
  kneeMin: "knee",
  hip: "hip",
  hipMax: "hip",
  legSpread: "hip",
  bodyLine: "hip",
  torsoLean: "hip",
  kneeTrack: "knee",
  elbow: "elbow",
  armsRaise: "shoulder",
};

/** The joint the camera measures for this move, if it's camera-tracked. */
export function focusJoint(id: string): FocusJoint | undefined {
  const t = findExercise(id)?.tracking;
  return t && t.kind !== "manual" ? FOCUS_BY_METRIC[t.metric] : undefined;
}

export function figureData(id: string) {
  const ill = ILLUSTRATIONS[id];
  if (!ill) return null;
  const frames = resolveIllustration(ill);
  return { ill, frames, box: bounds([frames.start, frames.end], ill.props) };
}

/** Small static picture of a move at its working position, for lists. */
export function MoveThumb({ id, className }: { id: string; className?: string }) {
  const data = figureData(id);
  return (
    <span
      aria-hidden
      className={cn(
        "grid h-14 w-[4.5rem] shrink-0 place-items-center rounded-xl bg-current/[0.06] px-1.5 py-1",
        className,
      )}
    >
      {data && (
        <FigureSVG
          frame={data.frames.end}
          box={data.box}
          props={data.ill.props}
          dumbbells={data.ill.dumbbells}
          className="size-full"
        />
      )}
    </span>
  );
}

/** A still frame of the move, labelled for screen readers. */
export function MoveFrame({
  id,
  which,
  className,
}: {
  id: string;
  which: "start" | "end";
  className?: string;
}) {
  const data = figureData(id);
  if (!data) return null;
  const name = findExercise(id)?.name ?? id;
  return (
    <FigureSVG
      frame={data.frames[which]}
      box={data.box}
      props={data.ill.props}
      dumbbells={data.ill.dumbbells}
      focus={focusJoint(id)}
      title={`${name}, ${which === "start" ? "start" : "finish"} position`}
      className={className}
    />
  );
}
