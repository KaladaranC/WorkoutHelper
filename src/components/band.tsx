import type { Phase } from "@/lib/data/program";
import { cn } from "@/lib/utils";

const BAND_BG: Record<Phase["band"], string> = {
  yellow: "bg-band-yellow",
  red: "bg-band-red",
  blue: "bg-band-blue",
};

/** A short strip of resistance band: each phase wears one, light → heavy. */
export function Band({ phase, className }: { phase: Phase; className?: string }) {
  return <span aria-hidden className={cn("inline-block h-2 w-10 rounded-full", BAND_BG[phase.band], className)} />;
}

export function bandClass(phase: Phase) {
  return BAND_BG[phase.band];
}
