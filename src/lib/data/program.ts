import { getExercise, type Area, type Exercise } from "./exercises";

// Two 8-week, 4-day home plans that share one structure:
//
// - "shape": built around glutes, thighs, chest and waist. Glutes and thighs
//   train twice a week, chest twice, core every session. Bodyweight only.
// - "ppl": push / pull / legs plus an arms & shoulders day. Each upper-body
//   muscle gets a direct day and a second hit from an overlapping one, which is
//   the "twice a week" frequency the hypertrophy research favours. Needs a pair
//   of dumbbells; a pull-up bar from week 3 (table rows work without one).
//
// Progression: harder variations each phase, and inside a phase 2 more reps
// (or 5 more seconds) every week. Dumbbell moves also progress by weight,
// which is logged per set.

export type PhaseId = "foundation" | "build" | "sculpt";
export type PlanId = "shape" | "ppl";
export type DayKey = "a" | "b" | "c" | "d";

export type Phase = {
  id: PhaseId;
  name: string;
  weeks: number[];
  /** Named after the resistance-band colour convention: light → heavy. */
  band: "yellow" | "red" | "blue";
  summary: string;
};

type Slot = { id: string; sets: number; amount: number };
type DayTemplate = { key: DayKey; title: string; focus: string; slots: Slot[] };

export type Plan = {
  id: PlanId;
  name: string;
  /** One line under the name, in the user's terms. */
  summary: string;
  equipment: string;
  /** The areas this plan trains, in the order its filters should show. */
  areas: Area[];
  /** Plan-specific names for shared areas, e.g. "Thighs" instead of "Legs". */
  areaLabels: Partial<Record<Area, string>>;
  restDayNote: string;
  phases: Phase[];
  templates: Record<PhaseId, DayTemplate[]>;
  restSec: Record<PhaseId, number>;
  warmUp: string[];
  coolDown: string[];
};

const s = (id: string, sets: number, amount: number): Slot => ({ id, sets, amount });

const SHAPE_TEMPLATES: Record<PhaseId, DayTemplate[]> = {
  foundation: [
    {
      key: "a",
      title: "Glutes & thighs",
      focus: "Bridge and squat patterns",
      slots: [
        s("glute-bridge", 3, 12),
        s("squat", 3, 12),
        s("reverse-lunge", 2, 8),
        s("side-lying-leg-raise", 2, 12),
        s("clamshell", 2, 15),
        s("plank", 3, 20),
      ],
    },
    {
      key: "b",
      title: "Chest & posture",
      focus: "Chest strength and an open upper back",
      slots: [
        s("incline-push-up", 3, 10),
        s("wall-angel", 3, 10),
        s("palm-press", 3, 20),
        s("superman", 3, 10),
        s("dead-bug", 3, 8),
        s("stomach-vacuum", 3, 15),
      ],
    },
    {
      key: "c",
      title: "Glutes & thighs II",
      focus: "Side glutes and inner thighs",
      slots: [
        s("frog-pump", 3, 15),
        s("sumo-squat", 3, 12),
        s("donkey-kick", 3, 12),
        s("wall-sit", 3, 30),
        s("fire-hydrant", 2, 12),
        s("side-plank", 2, 15),
      ],
    },
    {
      key: "d",
      title: "Full body & waist",
      focus: "Conditioning circuit",
      slots: [
        s("jumping-jacks", 3, 30),
        s("squat", 3, 12),
        s("incline-push-up", 3, 10),
        s("glute-bridge", 3, 15),
        s("bird-dog", 2, 8),
        s("mountain-climbers", 3, 20),
      ],
    },
  ],
  build: [
    {
      key: "a",
      title: "Glutes & thighs",
      focus: "Single-leg strength",
      slots: [
        s("single-leg-glute-bridge", 3, 10),
        s("tempo-squat", 3, 10),
        s("bulgarian-split-squat", 3, 8),
        s("side-lying-leg-raise", 3, 15),
        s("glute-bridge-hold", 3, 30),
        s("plank", 3, 30),
      ],
    },
    {
      key: "b",
      title: "Chest & posture",
      focus: "Push-up strength",
      slots: [
        s("knee-push-up", 3, 10),
        s("wide-knee-push-up", 3, 8),
        s("wall-angel", 3, 12),
        s("chair-dip", 3, 10),
        s("reverse-snow-angel", 3, 10),
        s("dead-bug", 3, 10),
        s("stomach-vacuum", 3, 20),
      ],
    },
    {
      key: "c",
      title: "Glutes & thighs II",
      focus: "Hip thrusts and the back of the thighs",
      slots: [
        s("hip-thrust", 3, 15),
        s("sumo-squat", 3, 15),
        s("curtsy-lunge", 3, 10),
        s("donkey-kick", 3, 15),
        s("hip-hinge", 3, 12),
        s("side-plank", 3, 20),
      ],
    },
    {
      key: "d",
      title: "Full body & waist",
      focus: "Conditioning circuit",
      slots: [
        s("jumping-jacks", 3, 40),
        s("reverse-lunge", 3, 10),
        s("knee-push-up", 3, 10),
        s("frog-pump", 3, 20),
        s("bicycle-crunch", 3, 12),
        s("mountain-climbers", 3, 30),
      ],
    },
  ],
  sculpt: [
    {
      key: "a",
      title: "Glutes & thighs",
      focus: "The hardest single-leg work",
      slots: [
        s("single-leg-hip-thrust", 3, 10),
        s("bulgarian-split-squat", 4, 10),
        s("tempo-squat", 3, 12),
        s("side-lying-leg-raise", 3, 20),
        s("glute-bridge-hold", 3, 45),
        s("plank", 3, 45),
      ],
    },
    {
      key: "b",
      title: "Chest & posture",
      focus: "Full push-ups and a burnout set",
      slots: [
        s("push-up", 4, 6),
        s("wide-knee-push-up", 3, 12),
        s("incline-push-up", 2, 15),
        s("wall-angel", 3, 15),
        s("chair-dip", 3, 12),
        s("reverse-snow-angel", 3, 12),
        s("stomach-vacuum", 3, 30),
      ],
    },
    {
      key: "c",
      title: "Glutes & thighs II",
      focus: "High-rep glute volume",
      slots: [
        s("hip-thrust", 4, 20),
        s("sumo-squat", 3, 20),
        s("curtsy-lunge", 3, 12),
        s("hip-hinge", 3, 15),
        s("fire-hydrant", 3, 15),
        s("wall-sit", 3, 60),
        s("side-plank", 3, 30),
      ],
    },
    {
      key: "d",
      title: "Full body & waist",
      focus: "Conditioning circuit",
      slots: [
        s("jumping-jacks", 4, 50),
        s("squat", 3, 20),
        s("knee-push-up", 3, 12),
        s("frog-pump", 3, 25),
        s("bird-dog", 3, 10),
        s("bicycle-crunch", 3, 15),
        s("side-plank", 3, 30),
      ],
    },
  ],
};

const PPL_TEMPLATES: Record<PhaseId, DayTemplate[]> = {
  foundation: [
    {
      key: "a",
      title: "Push",
      focus: "Chest, shoulders and triceps",
      slots: [
        s("push-up", 3, 8),
        s("db-floor-press", 3, 10),
        s("pike-push-up", 3, 6),
        s("db-lateral-raise", 3, 12),
        s("chair-dip", 3, 8),
        s("plank", 3, 30),
      ],
    },
    {
      key: "b",
      title: "Pull",
      focus: "Lats, back and biceps",
      slots: [
        s("inverted-row", 3, 8),
        s("db-bent-over-row", 3, 10),
        s("db-pullover", 3, 10),
        s("db-rdl", 3, 10),
        s("db-curl", 3, 10),
        s("dead-bug", 3, 8),
      ],
    },
    {
      key: "c",
      title: "Legs",
      focus: "Quads, hamstrings, glutes and calves",
      slots: [
        s("goblet-squat", 3, 10),
        s("reverse-lunge", 3, 8),
        s("db-rdl", 3, 10),
        s("glute-bridge", 3, 12),
        s("calf-raise", 3, 15),
        s("lying-leg-raise", 3, 10),
      ],
    },
    {
      key: "d",
      title: "Arms & shoulders",
      focus: "Biceps, triceps and delts",
      slots: [
        s("db-shoulder-press", 3, 10),
        s("db-curl", 3, 10),
        s("db-overhead-extension", 3, 10),
        s("hammer-curl", 3, 10),
        s("diamond-push-up", 3, 6),
        s("rear-delt-fly", 3, 12),
        s("side-plank", 2, 20),
      ],
    },
  ],
  build: [
    {
      key: "a",
      title: "Push",
      focus: "More chest volume",
      slots: [
        s("decline-push-up", 3, 10),
        s("db-floor-press", 4, 10),
        s("pike-push-up", 3, 8),
        s("db-fly", 3, 12),
        s("db-lateral-raise", 3, 12),
        s("db-overhead-extension", 3, 10),
        s("plank", 3, 40),
      ],
    },
    {
      key: "b",
      title: "Pull",
      focus: "Pull-ups start here",
      slots: [
        s("pull-up", 4, 5),
        s("db-bent-over-row", 4, 10),
        s("inverted-row", 3, 10),
        s("db-pullover", 3, 12),
        s("db-rdl", 3, 10),
        s("hammer-curl", 3, 10),
        s("dead-bug", 3, 10),
      ],
    },
    {
      key: "c",
      title: "Legs",
      focus: "Single-leg strength",
      slots: [
        s("goblet-squat", 4, 12),
        s("bulgarian-split-squat", 3, 8),
        s("db-rdl", 4, 10),
        s("wall-sit", 3, 45),
        s("calf-raise", 3, 20),
        s("lying-leg-raise", 3, 12),
      ],
    },
    {
      key: "d",
      title: "Arms & shoulders",
      focus: "Arm size",
      slots: [
        s("db-shoulder-press", 4, 10),
        s("db-lateral-raise", 3, 15),
        s("db-curl", 4, 10),
        s("diamond-push-up", 3, 8),
        s("chair-dip", 3, 12),
        s("rear-delt-fly", 3, 12),
        s("bicycle-crunch", 3, 12),
      ],
    },
  ],
  sculpt: [
    {
      key: "a",
      title: "Push",
      focus: "Heavier presses and high-rep finishers",
      slots: [
        s("db-floor-press", 4, 12),
        s("decline-push-up", 4, 12),
        s("pike-push-up", 3, 10),
        s("db-fly", 3, 15),
        s("db-lateral-raise", 4, 15),
        s("push-up", 2, 15),
        s("plank", 3, 50),
      ],
    },
    {
      key: "b",
      title: "Pull",
      focus: "More pull-ups and rows",
      slots: [
        s("pull-up", 5, 6),
        s("db-bent-over-row", 4, 12),
        s("inverted-row", 3, 12),
        s("db-pullover", 3, 12),
        s("db-rdl", 3, 12),
        s("db-curl", 3, 12),
        s("dead-bug", 3, 12),
      ],
    },
    {
      key: "c",
      title: "Legs",
      focus: "Volume and single-leg work",
      slots: [
        s("bulgarian-split-squat", 4, 10),
        s("goblet-squat", 4, 15),
        s("db-rdl", 4, 12),
        s("reverse-lunge", 3, 12),
        s("calf-raise", 4, 20),
        s("lying-leg-raise", 3, 15),
      ],
    },
    {
      key: "d",
      title: "Arms & shoulders",
      focus: "Supersets for arm pump",
      slots: [
        s("db-shoulder-press", 4, 12),
        s("hammer-curl", 4, 12),
        s("db-overhead-extension", 4, 12),
        s("db-curl", 3, 12),
        s("diamond-push-up", 3, 12),
        s("rear-delt-fly", 3, 15),
        s("side-plank", 3, 30),
      ],
    },
  ],
};

const phases = (summaries: [string, string, string], lastName: string): Phase[] => [
  { id: "foundation", name: "Foundation", weeks: [1, 2], band: "yellow", summary: summaries[0] },
  { id: "build", name: "Build", weeks: [3, 4, 5], band: "red", summary: summaries[1] },
  { id: "sculpt", name: lastName, weeks: [6, 7, 8], band: "blue", summary: summaries[2] },
];

export const PLANS: Record<PlanId, Plan> = {
  shape: {
    id: "shape",
    name: "Glutes, thighs, chest & waist",
    summary: "Shape-focused bodyweight plan: rounder glutes, toned thighs, a lifted chest and a stronger core.",
    equipment: "No equipment. A chair, a couch and a wall.",
    areas: ["glutes", "legs", "chest", "back", "core"],
    areaLabels: { legs: "Thighs", chest: "Chest & bust", back: "Posture", core: "Waist & core" },
    restDayNote: "On rest days, a 30-minute walk does more for your waist than extra crunches.",
    phases: phases(
      [
        "Learn each movement with the camera checking your form. Keep reps clean, even if they feel too easy.",
        "Harder single-leg variations, slower lowering and more volume. This is where the glutes start to change shape.",
        "The hardest bodyweight versions, longer holds and shorter rests.",
      ],
      "Sculpt",
    ),
    templates: SHAPE_TEMPLATES,
    restSec: { foundation: 60, build: 60, sculpt: 45 },
    warmUp: [
      "March on the spot, 60 s",
      "Arm circles forward and back, 10 each",
      "Hip circles, 10 each way",
      "Bodyweight good mornings, 10 slow",
      "Glute bridges, 10 easy",
    ],
    coolDown: [
      "Figure-four glute stretch, 30 s each side",
      "Kneeling hip-flexor stretch, 30 s each side",
      "Doorway chest stretch, 30 s",
      "Child's pose, 45 s",
    ],
  },
  ppl: {
    id: "ppl",
    name: "Push / Pull / Legs",
    summary: "Muscle-building split: chest, back and lats, shoulders, biceps, triceps and legs.",
    equipment: "A pair of dumbbells. A pull-up bar from week 3, or a sturdy table for rows.",
    areas: ["chest", "back", "shoulders", "biceps", "triceps", "legs", "core"],
    areaLabels: {},
    restDayNote:
      "Pick dumbbells you can lift for the target reps with only 1–2 reps left in the tank. When every set feels easy, go heavier.",
    phases: phases(
      [
        "Learn the movements and find your working weights. Finish each set with 2–3 reps still in the tank.",
        "More sets, pull-ups and harder push-up variations. Push sets to 1–2 reps from failure and add weight when you can.",
        "Peak volume. Higher reps and extra sets, still close to failure.",
      ],
      "Strength",
    ),
    templates: PPL_TEMPLATES,
    restSec: { foundation: 75, build: 75, sculpt: 60 },
    warmUp: [
      "Jumping jacks, 60 s",
      "Arm circles forward and back, 10 each",
      "Band-free pull-aparts with your arms, 15",
      "Bodyweight squats, 10",
      "One light warm-up set of the first move",
    ],
    coolDown: [
      "Doorway chest stretch, 30 s",
      "Lat stretch against a wall, 30 s each side",
      "Overhead triceps stretch, 30 s each side",
      "Standing quad stretch, 30 s each side",
    ],
  },
};

export const PLAN_LIST: Plan[] = [PLANS.shape, PLANS.ppl];

export function areaLabel(plan: Plan | undefined, area: Area, fallback: string): string {
  return plan?.areaLabels[area] ?? fallback;
}

export type Prescription = {
  exercise: Exercise;
  sets: number;
  /** Reps (per side when exercise.perSide) or seconds. */
  amount: number;
  restSec: number;
};

export type ProgramDay = {
  id: string;
  planId: PlanId;
  week: number;
  key: DayKey;
  /** 1-based position across the whole plan, for "session 5 of 32". */
  index: number;
  phase: Phase;
  title: string;
  focus: string;
  items: Prescription[];
};

export const TOTAL_WEEKS = 8;
export const DAYS_PER_WEEK = 4;

/** The original plan keeps its unprefixed ids so saved history stays valid. */
export function dayId(plan: PlanId, week: number, key: DayKey) {
  return plan === "shape" ? `w${week}-${key}` : `${plan}-w${week}-${key}`;
}

export function phaseForWeek(plan: Plan, week: number): Phase {
  const phase = plan.phases.find((p) => p.weeks.includes(week));
  if (!phase) throw new Error(`Week ${week} is outside the program`);
  return phase;
}

function buildProgram(plan: Plan): ProgramDay[] {
  const days: ProgramDay[] = [];
  for (let week = 1; week <= TOTAL_WEEKS; week++) {
    const phase = phaseForWeek(plan, week);
    const weekInPhase = phase.weeks.indexOf(week);
    for (const t of plan.templates[phase.id]) {
      days.push({
        id: dayId(plan.id, week, t.key),
        planId: plan.id,
        week,
        key: t.key,
        index: days.length + 1,
        phase,
        title: t.title,
        focus: t.focus,
        items: t.slots.map((slot) => {
          const exercise = getExercise(slot.id);
          const step = exercise.unit === "seconds" ? 5 : 2;
          return {
            exercise,
            sets: slot.sets,
            amount: slot.amount + step * weekInPhase,
            restSec: plan.restSec[phase.id],
          };
        }),
      });
    }
  }
  return days;
}

export const PROGRAMS: Record<PlanId, ProgramDay[]> = {
  shape: buildProgram(PLANS.shape),
  ppl: buildProgram(PLANS.ppl),
};

export const ALL_DAYS: ProgramDay[] = [...PROGRAMS.shape, ...PROGRAMS.ppl];

const DAY_BY_ID = new Map(ALL_DAYS.map((d) => [d.id, d]));

export function findDay(id: string): ProgramDay | undefined {
  return DAY_BY_ID.get(id);
}

/** The first day of the plan not completed yet, in order. */
export function nextDay(plan: PlanId, completedIds: Iterable<string>): ProgramDay | undefined {
  const done = new Set(completedIds);
  return PROGRAMS[plan].find((d) => !done.has(d.id));
}

/** Exercise ids used anywhere in a plan. */
export function planExerciseIds(plan: PlanId): Set<string> {
  return new Set(PROGRAMS[plan].flatMap((d) => d.items.map((i) => i.exercise.id)));
}

export function estimateMinutes(day: ProgramDay): number {
  let sec = 0;
  for (const p of day.items) {
    const perSet = p.exercise.unit === "seconds" ? p.amount : p.amount * 3;
    const sides = p.exercise.perSide ? 2 : 1;
    sec += p.sets * (perSet * sides + p.restSec);
  }
  return Math.round(sec / 60) + 5; // plus warm-up
}
