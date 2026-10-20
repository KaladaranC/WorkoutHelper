import {
  angleAt,
  angleFromVertical,
  distance,
  joint,
  LM,
  midpoint,
  type Pose,
  type Side,
} from "./geometry";

// A metric turns one pose into one number the rep counter and form checks can
// reason about. "single" metrics read one side of the body (the engine picks
// whichever side faces the camera); "pair" metrics need both sides at once.

type SingleMetric = {
  kind: "single";
  label: string;
  required: (side: Side) => number[];
  compute: (pose: Pose, side: Side, aspect: number) => number;
};

type PairMetric = {
  kind: "pair";
  label: string;
  required: number[];
  compute: (pose: Pose, aspect: number) => number;
};

export type Metric = SingleMetric | PairMetric;

const at = (pose: Pose, side: Side, ...names: Parameters<typeof joint>[1][]) =>
  names.map((n) => pose[joint(side, n)]);

const knee = (pose: Pose, side: Side, aspect: number) => {
  const [h, k, a] = at(pose, side, "hip", "knee", "ankle");
  return angleAt(h, k, a, aspect);
};

const hip = (pose: Pose, side: Side, aspect: number) => {
  const [s, h, k] = at(pose, side, "shoulder", "hip", "knee");
  return angleAt(s, h, k, aspect);
};

const armRaise = (pose: Pose, side: Side, aspect: number) => {
  const [h, s, w] = at(pose, side, "hip", "shoulder", "wrist");
  return angleAt(h, s, w, aspect);
};

const sideIdx = (side: Side, ...names: Parameters<typeof joint>[1][]) =>
  names.map((n) => joint(side, n));

const both = (...names: Parameters<typeof joint>[1][]) => [
  ...sideIdx("left", ...names),
  ...sideIdx("right", ...names),
];

export const METRICS = {
  knee: {
    kind: "single",
    label: "Knee angle",
    required: (s) => sideIdx(s, "hip", "knee", "ankle"),
    compute: knee,
  },
  hip: {
    kind: "single",
    label: "Hip angle",
    required: (s) => sideIdx(s, "shoulder", "hip", "knee"),
    compute: hip,
  },
  elbow: {
    kind: "single",
    label: "Elbow angle",
    required: (s) => sideIdx(s, "shoulder", "elbow", "wrist"),
    compute: (pose, side, aspect) => {
      const [s, e, w] = at(pose, side, "shoulder", "elbow", "wrist");
      return angleAt(s, e, w, aspect);
    },
  },
  bodyLine: {
    kind: "single",
    label: "Body line",
    required: (s) => sideIdx(s, "shoulder", "hip", "ankle"),
    compute: (pose, side, aspect) => {
      const [s, h, a] = at(pose, side, "shoulder", "hip", "ankle");
      return angleAt(s, h, a, aspect);
    },
  },
  torsoLean: {
    kind: "single",
    label: "Torso lean",
    required: (s) => sideIdx(s, "shoulder", "hip"),
    compute: (pose, side, aspect) => {
      const [s, h] = at(pose, side, "shoulder", "hip");
      return angleFromVertical(h, s, aspect);
    },
  },
  // Lunges bend both knees; the front knee is the one that bends most.
  kneeMin: {
    kind: "pair",
    label: "Front knee angle",
    required: both("hip", "knee", "ankle"),
    compute: (pose, aspect) =>
      Math.min(knee(pose, "left", aspect), knee(pose, "right", aspect)),
  },
  // In a kneeling kick the working leg's hip opens far more than the support leg's.
  hipMax: {
    kind: "pair",
    label: "Working hip angle",
    required: both("shoulder", "hip", "knee"),
    compute: (pose, aspect) =>
      Math.max(hip(pose, "left", aspect), hip(pose, "right", aspect)),
  },
  legSpread: {
    kind: "pair",
    label: "Leg opening",
    required: [LM.leftHip, LM.rightHip, LM.leftAnkle, LM.rightAnkle],
    compute: (pose, aspect) => {
      const mid = midpoint(pose[LM.leftHip], pose[LM.rightHip]);
      return angleAt(pose[LM.leftAnkle], mid, pose[LM.rightAnkle], aspect);
    },
  },
  armsRaise: {
    kind: "pair",
    label: "Arm height",
    required: both("hip", "shoulder", "wrist"),
    compute: (pose, aspect) =>
      (armRaise(pose, "left", aspect) + armRaise(pose, "right", aspect)) / 2,
  },
  // Knee width divided by ankle width. Under ~0.85 the knees are caving in.
  kneeTrack: {
    kind: "pair",
    label: "Knee tracking",
    required: [LM.leftKnee, LM.rightKnee, LM.leftAnkle, LM.rightAnkle],
    compute: (pose, aspect) => {
      const ankles = distance(pose[LM.leftAnkle], pose[LM.rightAnkle], aspect);
      if (ankles === 0) return 1;
      return distance(pose[LM.leftKnee], pose[LM.rightKnee], aspect) / ankles;
    },
  },
} satisfies Record<string, Metric>;

export type MetricId = keyof typeof METRICS;

export function requiredLandmarks(id: MetricId, side: Side): number[] {
  const m: Metric = METRICS[id];
  return m.kind === "pair" ? m.required : m.required(side);
}

export function computeMetric(
  id: MetricId,
  pose: Pose,
  side: Side,
  aspect: number,
): number {
  const m: Metric = METRICS[id];
  return m.kind === "pair" ? m.compute(pose, aspect) : m.compute(pose, side, aspect);
}
