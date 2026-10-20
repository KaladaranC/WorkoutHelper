// Double progression for the strength plan: stay at a weight and add reps
// until every set reaches the top of the range, then go up a step. Pure, so
// the session screen and tests share it.

export type Effort = "easy" | "hard" | "max";

export const EFFORT_LABEL: Record<Effort, { title: string; hint: string }> = {
  easy: { title: "Easy", hint: "3+ reps left" },
  hard: { title: "Hard", hint: "1–2 reps left" },
  max: { title: "Max", hint: "Nothing left" },
};

export type PastSet = { done: number; weightKg?: number; effort?: Effort };

export type Suggestion = { kg?: number; message: string };

/** Typical home dumbbell steps: 1 kg on light weights, 2 kg from 10 kg. */
export function weightStep(kg: number) {
  return kg < 10 ? 1 : 2;
}

export function suggestNext(last: PastSet[], range: [number, number], weighted: boolean): Suggestion {
  const [lo, hi] = range;
  if (last.length === 0) {
    return {
      message: weighted
        ? `First time: pick a weight you can lift ${lo}–${hi} times with good form.`
        : `First time: aim for ${lo}–${hi} clean reps per set.`,
    };
  }

  const reps = last.map((s) => s.done).join(", ");
  const allTop = last.every((s) => s.done >= hi);
  const anyShort = last.some((s) => s.done < lo);
  const anyMax = last.some((s) => s.effort === "max");
  const weights = last.map((s) => s.weightKg).filter((w): w is number => w !== undefined);
  const kg = weights.length ? weights[weights.length - 1] : undefined;

  if (!weighted || kg === undefined) {
    if (allTop) return { message: `Last time: ${reps}. You own this range. Slow the lowering to make it harder.` };
    return { message: `Last time: ${reps}. Beat at least one of those today.` };
  }

  if (allTop && !anyMax) {
    const next = kg + weightStep(kg);
    return { kg: next, message: `Last time: ${kg} kg × ${reps}. Every set hit ${hi}, so go up to ${next} kg.` };
  }
  if (anyShort && anyMax) {
    const next = Math.max(0, kg - weightStep(kg));
    return { kg: next, message: `Last time: ${kg} kg × ${reps}. Below ${lo} at max effort, so drop to ${next} kg.` };
  }
  return { kg, message: `Last time: ${kg} kg × ${reps}. Stay at ${kg} kg and add reps until every set hits ${hi}.` };
}
