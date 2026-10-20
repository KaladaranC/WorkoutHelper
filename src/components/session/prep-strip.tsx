import { PrepFigure } from "@/components/figure/prep-figure";
import type { PrepMove } from "@/lib/data/program";
import { cn } from "@/lib/utils";

const MOOD = {
  // Warm-up arrows wear the plan's accent; the cool-down settles into green.
  warm: "[--prep-accent:var(--stage-accent)]",
  cool: "[--prep-accent:var(--stage-good)]",
} as const;

/**
 * Warm-up or cool-down as a swipeable strip of sketch cards, in order. Kept
 * visually apart from the move list: line drawings on open cards, not
 * pictogram rows.
 */
export function PrepStrip({
  moves,
  firstMoveId,
  mood,
  label,
}: {
  moves: PrepMove[];
  /** Drawn for a step without its own figure ("light set of your first move"). */
  firstMoveId: string;
  mood: keyof typeof MOOD;
  label: string;
}) {
  return (
    <ol
      aria-label={label}
      className={cn(
        "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]",
        MOOD[mood],
      )}
    >
      {moves.map((m, i) => (
        <li
          key={m.name}
          className="flex w-36 shrink-0 snap-start flex-col rounded-2xl border border-dashed border-white/20 p-3"
        >
          <span className="font-mono text-xs text-stage-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <PrepFigure
            id={m.figure ?? firstMoveId}
            title={`${m.name} sketch`}
            className="my-2 h-24 w-full text-stage-foreground"
          />
          <span className="text-sm leading-snug font-semibold">{m.name}</span>
          <span className="mt-auto pt-1 font-mono text-xs text-(--prep-accent)">{m.dose}</span>
        </li>
      ))}
    </ol>
  );
}
