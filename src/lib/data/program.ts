import { getExercise, type Exercise } from "./exercises";

// An 8-week, 4-day home program built around the tester's goals: glutes and
// thighs trained twice a week each, chest and posture once a week plus push-ups
// in the full-body day, and core work in every session.
//
// Progression follows the usual bodyweight path: harder variations each phase,
// and inside a phase, 2 more reps (or 5 more seconds) every week.

export type PhaseId = "foundation" | "build" | "sculpt";

export type Phase = {
  id: PhaseId;
  name: string;
  weeks: number[];
  /** Named after the resistance-band colour convention: light → heavy. */
  band: "yellow" | "red" | "blue";
  summary: string;
};

export const PHASES: Phase[] = [
  {
    id: "foundation",
    name: "Foundation",
    weeks: [1, 2],
    band: "yellow",
    summary: "Learn each movement with the camera checking your form. Keep reps clean, even if they feel too easy.",
  },
  {
    id: "build",
    name: "Build",
    weeks: [3, 4, 5],
    band: "red",
    summary: "Harder single-leg variations, slower lowering and more volume. This is where the glutes start to change shape.",
  },
  {
    id: "sculpt",
    name: "Sculpt",
    weeks: [6, 7, 8],
    band: "blue",
    summary: "The hardest bodyweight versions, longer holds and shorter rests.",
  },
];

type Slot = { id: string; sets: number; amount: number };
type DayTemplate = { key: DayKey; title: string; focus: string; slots: Slot[] };
export type DayKey = "a" | "b" | "c" | "d";

const s = (id: string, sets: number, amount: number): Slot => ({ id, sets, amount });

const TEMPLATES: Record<PhaseId, DayTemplate[]> = {
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

export type Prescription = {
  exercise: Exercise;
  sets: number;
  /** Reps (per side when exercise.perSide) or seconds. */
  amount: number;
  restSec: number;
};

export type ProgramDay = {
  id: string;
  week: number;
  key: DayKey;
  /** 1-based position across the whole program, for "session 5 of 32". */
  index: number;
  phase: Phase;
  title: string;
  focus: string;
  items: Prescription[];
};

export const TOTAL_WEEKS = 8;
export const DAYS_PER_WEEK = 4;

export function dayId(week: number, key: DayKey) {
  return `w${week}-${key}`;
}

export function phaseForWeek(week: number): Phase {
  const phase = PHASES.find((p) => p.weeks.includes(week));
  if (!phase) throw new Error(`Week ${week} is outside the program`);
  return phase;
}

function buildProgram(): ProgramDay[] {
  const days: ProgramDay[] = [];
  for (let week = 1; week <= TOTAL_WEEKS; week++) {
    const phase = phaseForWeek(week);
    const weekInPhase = phase.weeks.indexOf(week);
    const restSec = phase.id === "sculpt" ? 45 : 60;
    for (const t of TEMPLATES[phase.id]) {
      days.push({
        id: dayId(week, t.key),
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
            restSec,
          };
        }),
      });
    }
  }
  return days;
}

export const PROGRAM: ProgramDay[] = buildProgram();

const DAY_BY_ID = new Map(PROGRAM.map((d) => [d.id, d]));

export function findDay(id: string): ProgramDay | undefined {
  return DAY_BY_ID.get(id);
}

/** The first program day she hasn't completed yet, in order. */
export function nextDay(completedIds: Iterable<string>): ProgramDay | undefined {
  const done = new Set(completedIds);
  return PROGRAM.find((d) => !done.has(d.id));
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

export const WARM_UP = [
  "March on the spot, 60 s",
  "Arm circles forward and back, 10 each",
  "Hip circles, 10 each way",
  "Bodyweight good mornings, 10 slow",
  "Glute bridges, 10 easy",
];

export const COOL_DOWN = [
  "Figure-four glute stretch, 30 s each side",
  "Kneeling hip-flexor stretch, 30 s each side",
  "Doorway chest stretch, 30 s",
  "Child's pose, 45 s",
];
