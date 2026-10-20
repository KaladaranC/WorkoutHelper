import type { Illustration, PoseSpec } from "@/lib/figure";

// Start and finish positions for every move. Side views face right; the floor
// is y = 0. Only hands, feet, hips and shoulders are placed by hand — elbows
// and knees are solved in lib/figure.ts.

const STAND: PoseSpec = {
  hip: [0, 46],
  shoulder: [0, 78],
  leg: { ankle: [1, 3] },
  arm: { wrist: [2, 49], bend: -1 },
};

const STAND_FRONT: PoseSpec = {
  hip: [0, 46],
  shoulder: [0, 78],
  leg: { ankle: [7, 3] },
  arm: { wrist: [12, 49], bend: -1 },
};

// Lying on the back, head to the left.
const SUPINE: PoseSpec = {
  hip: [0, 7],
  shoulder: [-32, 6],
  head: 180,
  leg: { ankle: [30, 3] },
  arm: { wrist: [-4, 4], bend: 1 },
};

// Lying face down, head to the right.
const PRONE: PoseSpec = {
  hip: [0, 7],
  shoulder: [32, 9],
  head: 0,
  leg: { ankle: [-42, 5] },
  arm: { wrist: [60, 7] },
};

// On hands and knees, facing right.
const QUADRUPED: PoseSpec = {
  hip: [0, 25],
  shoulder: [31, 32],
  leg: { ankle: [-21, 3] },
  arm: { wrist: [31, 3], bend: -1 },
};

// Lying on one side, head to the left, propped on the bottom arm.
const SIDE_LYING: PoseSpec = {
  hip: [0, 8],
  shoulder: [-32, 9],
  head: 180,
  leg: { ankle: [42, 7] },
  arm: { wrist: [-14, 4], bend: 1 },
  farLeg: { ankle: [42, 4] },
  farArm: { wrist: [-46, 12], elbow: [-40, 4] },
};

const PUSH_UP_TOP: PoseSpec = {
  hip: [-4, 19],
  shoulder: [26, 31],
  leg: { ankle: [-44, 4] },
  arm: { wrist: [27, 3] },
};

const KNEE_PUSH_UP: Illustration = {
  view: "side",
  start: {
    hip: [5, 14],
    shoulder: [32, 31],
    leg: { knee: [-14, 3], ankle: [-30, 13] },
    arm: { wrist: [35, 3] },
  },
  end: {
    hip: [8, 7],
    shoulder: [39, 12],
    leg: { knee: [-14, 3], ankle: [-30, 13] },
    arm: { wrist: [35, 3], elbow: [29, 15] },
  },
};

const SQUAT: Illustration = {
  view: "side",
  start: STAND,
  end: {
    hip: [-12, 26],
    shoulder: [6, 52],
    leg: { ankle: [1, 3] },
    arm: { wrist: [34, 55], bend: -1 },
  },
};

const BRIDGE: Illustration = {
  view: "side",
  start: SUPINE,
  end: { ...SUPINE, hip: [-5, 24], shoulder: [-31, 6], arm: { wrist: [-3, 4], bend: 1 } },
};

const HIP_THRUST_START: PoseSpec = {
  hip: [-2, 10],
  shoulder: [-28, 30],
  head: 140,
  leg: { ankle: [26, 3] },
  arm: { wrist: [-56, 31] },
};

const HIP_THRUST_END: PoseSpec = {
  hip: [4, 30],
  shoulder: [-28, 30],
  head: 165,
  leg: { ankle: [26, 3] },
  arm: { wrist: [-56, 31] },
};

const COUCH_BEHIND = { kind: "couch", x: -78, w: 50, top: 28, back: "left" } as const;

export const ILLUSTRATIONS: Record<string, Illustration> = {
  "glute-bridge": BRIDGE,
  "glute-bridge-hold": BRIDGE,
  "single-leg-glute-bridge": {
    view: "side",
    start: { ...SUPINE, farLeg: { ankle: [36, 26] } },
    end: { ...BRIDGE.end!, farLeg: { ankle: [34, 45] } },
  },
  "frog-pump": {
    view: "side",
    start: { ...SUPINE, leg: { ankle: [18, 3] } },
    end: { ...SUPINE, hip: [-4, 20], shoulder: [-32, 8], leg: { ankle: [18, 3] } },
  },
  "hip-thrust": { view: "side", props: [COUCH_BEHIND], start: HIP_THRUST_START, end: HIP_THRUST_END },
  "single-leg-hip-thrust": {
    view: "side",
    props: [COUCH_BEHIND],
    start: { ...HIP_THRUST_START, farLeg: { ankle: [22, 24] } },
    end: { ...HIP_THRUST_END, farLeg: { ankle: [30, 40] } },
  },
  "donkey-kick": {
    view: "side",
    start: QUADRUPED,
    end: { ...QUADRUPED, leg: { ankle: [-22, 46] }, farLeg: QUADRUPED.leg },
  },
  // Seen from behind: the knee opens out to the side.
  "fire-hydrant": {
    view: "front",
    start: {
      hip: [0, 25],
      shoulder: [0, 33],
      head: 90,
      leg: { knee: [7, 3], ankle: [9, 1], foot: -10 },
      arm: { wrist: [10, 3] },
    },
    end: {
      hip: [0, 25],
      shoulder: [0, 33],
      head: 90,
      leg: { knee: [26, 23], ankle: [28, 13], foot: -60 },
      arm: { wrist: [10, 3] },
      farLeg: { knee: [-7, 3], ankle: [-9, 1], foot: 190 },
      farArm: { wrist: [-10, 3] },
    },
  },
  clamshell: {
    view: "side",
    start: {
      ...SIDE_LYING,
      arm: { wrist: [-5, 12], bend: 1 },
      leg: { knee: [14, 12], ankle: [-3, 7], foot: 180 },
      farLeg: { knee: [14, 6], ankle: [-3, 4], foot: 180 },
    },
    end: {
      ...SIDE_LYING,
      arm: { wrist: [-5, 12], bend: 1 },
      leg: { knee: [11, 28], ankle: [-3, 8], foot: 180 },
      farLeg: { knee: [14, 6], ankle: [-3, 4], foot: 180 },
    },
  },
  "side-lying-leg-raise": {
    view: "side",
    start: SIDE_LYING,
    end: { ...SIDE_LYING, leg: { ankle: [39, 24] } },
  },

  squat: SQUAT,
  "tempo-squat": SQUAT,
  "sumo-squat": {
    view: "front",
    start: { hip: [0, 46], shoulder: [0, 78], leg: { ankle: [19, 3] }, arm: { wrist: [3, 60], bend: 1 } },
    end: { hip: [0, 24], shoulder: [0, 56], leg: { ankle: [19, 3] }, arm: { wrist: [3, 38], bend: 1 } },
  },
  "reverse-lunge": {
    view: "side",
    start: STAND,
    end: {
      hip: [-10, 24],
      shoulder: [-10, 56],
      leg: { ankle: [4, 3] },
      arm: { wrist: [-8, 27], bend: -1 },
      farLeg: { ankle: [-38, 8] },
    },
  },
  "bulgarian-split-squat": {
    view: "side",
    props: [{ kind: "chair", x: -58, w: 22, top: 24, back: "left" }],
    start: {
      hip: [-4, 44],
      shoulder: [-3, 76],
      leg: { ankle: [8, 3] },
      arm: { wrist: [-2, 47], bend: -1 },
      farLeg: { ankle: [-42, 27] },
    },
    end: {
      hip: [-12, 24],
      shoulder: [-7, 55],
      leg: { ankle: [8, 3] },
      arm: { wrist: [-5, 26], bend: -1 },
      farLeg: { ankle: [-42, 27] },
    },
  },
  "curtsy-lunge": {
    view: "front",
    start: { ...STAND_FRONT, arm: { wrist: [6, 47], elbow: [20, 60] } },
    end: {
      hip: [2, 28],
      shoulder: [2, 60],
      leg: { ankle: [9, 3] },
      arm: { wrist: [8, 29], elbow: [22, 42] },
      farLeg: { ankle: [14, 7], bend: -1 },
      farArm: { wrist: [-4, 29], elbow: [-18, 42] },
    },
  },
  "hip-hinge": {
    view: "side",
    start: { ...STAND, arm: { wrist: [-3, 85], bend: -1 } },
    end: { hip: [-10, 42], shoulder: [20, 53], leg: { ankle: [1, 3] }, arm: { wrist: [23, 62], bend: -1 } },
  },
  "wall-sit": {
    view: "side",
    props: [{ kind: "wall", x: -14 }],
    start: { hip: [-8, 42], shoulder: [-9, 74], leg: { ankle: [14, 3] }, arm: { wrist: [-7, 45], bend: -1 } },
    end: { hip: [-8, 24], shoulder: [-9, 56], leg: { ankle: [14, 3] }, arm: { wrist: [4, 29], bend: -1 } },
  },

  "incline-push-up": {
    view: "side",
    props: [{ kind: "couch", x: 30, w: 46, top: 27, back: "right" }],
    start: { hip: [-7, 31], shoulder: [18, 51], leg: { ankle: [-40, 3] }, arm: { wrist: [34, 29], bend: 1 } },
    end: { hip: [-2, 23], shoulder: [26, 38], leg: { ankle: [-40, 3] }, arm: { wrist: [34, 29], elbow: [17, 40] } },
  },
  "knee-push-up": KNEE_PUSH_UP,
  "wide-knee-push-up": KNEE_PUSH_UP,
  "push-up": {
    view: "side",
    start: PUSH_UP_TOP,
    end: { hip: [-1, 10], shoulder: [30, 14], leg: { ankle: [-44, 4] }, arm: { wrist: [27, 3], elbow: [20, 16] } },
  },
  "chair-dip": {
    view: "side",
    props: [{ kind: "chair", x: -34, w: 22, top: 26, back: "left" }],
    start: { hip: [-7, 25], shoulder: [-9, 57], leg: { ankle: [22, 3] }, arm: { wrist: [-12, 28] } },
    end: { hip: [-4, 10], shoulder: [-5, 42], leg: { ankle: [22, 3] }, arm: { wrist: [-12, 28], bend: -1 } },
  },
  "wall-angel": {
    view: "front",
    start: { ...STAND_FRONT, arm: { wrist: [24, 92], elbow: [25, 77] } },
    end: { ...STAND_FRONT, arm: { wrist: [16, 105], bend: -1 } },
  },
  "palm-press": {
    view: "front",
    start: { ...STAND_FRONT, arm: { wrist: [2, 70], elbow: [22, 70] } },
  },
  superman: {
    view: "side",
    start: PRONE,
    end: { ...PRONE, shoulder: [31, 15], head: 15, leg: { ankle: [-41, 15] }, arm: { wrist: [58, 23] } },
  },
  "reverse-snow-angel": {
    view: "side",
    start: { ...PRONE, arm: { wrist: [4, 10] } },
    end: { ...PRONE, shoulder: [32, 11], arm: { wrist: [59, 15] } },
  },

  plank: {
    view: "side",
    start: { hip: [-2, 12], shoulder: [30, 18], leg: { ankle: [-44, 4] }, arm: { wrist: [44, 3], elbow: [30, 3] } },
  },
  "side-plank": {
    view: "side",
    start: {
      hip: [-2, 6],
      shoulder: [29, 19],
      leg: { ankle: [-44, 4] },
      arm: { wrist: [43, 3], elbow: [29, 4] },
      farLeg: { ankle: [-44, 6] },
      farArm: { wrist: [1, 9] },
    },
    end: {
      hip: [-2, 13],
      shoulder: [29, 19],
      leg: { ankle: [-44, 4] },
      arm: { wrist: [43, 3], elbow: [29, 4] },
      farLeg: { ankle: [-44, 6] },
      farArm: { wrist: [0, 15] },
    },
  },
  "dead-bug": {
    view: "side",
    start: { ...SUPINE, shoulder: [-32, 7], leg: { ankle: [21, 29] }, arm: { wrist: [-32, 36] } },
    end: {
      ...SUPINE,
      shoulder: [-32, 7],
      leg: { ankle: [21, 29] },
      arm: { wrist: [-60, 9] },
      farLeg: { ankle: [42, 11] },
      farArm: { wrist: [-32, 36] },
    },
  },
  "bird-dog": {
    view: "side",
    start: QUADRUPED,
    end: { ...QUADRUPED, arm: { wrist: [60, 34] }, farLeg: { ankle: [-42, 28] }, farArm: QUADRUPED.arm },
  },
  "bicycle-crunch": {
    view: "side",
    start: {
      hip: [0, 7],
      shoulder: [-30, 17],
      head: 160,
      leg: { ankle: [8, 24] },
      arm: { wrist: [-40, 26], elbow: [-22, 26] },
      farLeg: { ankle: [40, 14] },
      farArm: { wrist: [-40, 25], elbow: [-30, 30] },
    },
    end: {
      hip: [0, 7],
      shoulder: [-30, 17],
      head: 160,
      leg: { ankle: [40, 14] },
      arm: { wrist: [-40, 26], elbow: [-22, 26] },
      farLeg: { ankle: [8, 24] },
      farArm: { wrist: [-40, 25], elbow: [-30, 30] },
    },
  },
  "stomach-vacuum": {
    view: "side",
    start: { ...STAND, arm: { wrist: [6, 52], bend: -1 } },
  },

  "jumping-jacks": {
    view: "front",
    start: { ...STAND_FRONT, leg: { ankle: [6, 3] }, arm: { wrist: [13, 49], bend: -1 } },
    end: { hip: [0, 47], shoulder: [0, 79], leg: { ankle: [22, 3] }, arm: { wrist: [20, 107], bend: -1 } },
  },
  "mountain-climbers": {
    view: "side",
    start: { ...PUSH_UP_TOP, leg: { ankle: [4, 7] }, farLeg: { ankle: [-44, 4] } },
    end: { ...PUSH_UP_TOP, leg: { ankle: [-44, 4] }, farLeg: { ankle: [4, 7] } },
  },

  // ─── Push ──────────────────────────────────────────────────────────────
  "decline-push-up": {
    view: "side",
    props: [{ kind: "chair", x: -62, w: 22, top: 30, back: "left" }],
    start: { hip: [-3, 32], shoulder: [28, 31], leg: { ankle: [-46, 33] }, arm: { wrist: [29, 3] } },
    end: { hip: [-4, 23], shoulder: [27, 15], leg: { ankle: [-46, 33] }, arm: { wrist: [29, 3], elbow: [20, 17] } },
  },
  "diamond-push-up": {
    view: "side",
    start: PUSH_UP_TOP,
    end: { hip: [-1, 10], shoulder: [30, 14], leg: { ankle: [-44, 4] }, arm: { wrist: [29, 3], elbow: [22, 17] } },
  },
  "pike-push-up": {
    view: "side",
    start: { hip: [0, 44], shoulder: [26, 30], leg: { ankle: [-20, 3] }, arm: { wrist: [32, 3] } },
    end: { hip: [6, 36], shoulder: [30, 14], leg: { ankle: [-20, 3] }, arm: { wrist: [34, 3], elbow: [22, 16] } },
  },
  "db-floor-press": {
    view: "side",
    dumbbells: true,
    start: { ...SUPINE, arm: { wrist: [-31, 35] } },
    end: { ...SUPINE, arm: { wrist: [-24, 19], elbow: [-22, 4] } },
  },
  "db-fly": {
    view: "side",
    dumbbells: true,
    start: { ...SUPINE, arm: { wrist: [-31, 35] }, farArm: { wrist: [-31, 35] } },
    end: {
      ...SUPINE,
      arm: { wrist: [-48, 10], elbow: [-42, 17] },
      farArm: { wrist: [-16, 10], elbow: [-22, 17] },
    },
  },
  "db-shoulder-press": {
    view: "front",
    dumbbells: true,
    start: { ...STAND_FRONT, arm: { wrist: [22, 86], elbow: [24, 72] } },
    end: { ...STAND_FRONT, arm: { wrist: [13, 106], bend: -1 } },
  },
  "db-lateral-raise": {
    view: "front",
    dumbbells: true,
    start: { ...STAND_FRONT, arm: { wrist: [14, 50], bend: -1 } },
    end: { ...STAND_FRONT, arm: { wrist: [38, 74], bend: -1 } },
  },
  "db-overhead-extension": {
    view: "side",
    dumbbells: true,
    start: { ...STAND, arm: { wrist: [3, 107], bend: -1 } },
    end: { ...STAND, arm: { wrist: [-8, 84], elbow: [4, 93] } },
  },

  // ─── Pull ──────────────────────────────────────────────────────────────
  "pull-up": {
    view: "front",
    props: [{ kind: "bar", x: -30, w: 60, y: 117 }],
    start: { hip: [0, 58], shoulder: [0, 90], leg: { ankle: [5, 16] }, arm: { wrist: [14, 116], bend: -1 } },
    end: { hip: [0, 78], shoulder: [0, 108], leg: { ankle: [5, 36] }, arm: { wrist: [14, 116], bend: -1 } },
  },
  "inverted-row": {
    view: "side",
    props: [{ kind: "table", x: 12, w: 48, top: 41 }],
    start: { hip: [-2, 10], shoulder: [30, 15], leg: { ankle: [-44, 3] }, arm: { wrist: [25, 41] } },
    end: { hip: [-4, 20], shoulder: [26, 33], leg: { ankle: [-44, 3] }, arm: { wrist: [25, 41], elbow: [13, 35] } },
  },
  "db-bent-over-row": {
    view: "side",
    dumbbells: true,
    start: { hip: [-10, 44], shoulder: [18, 58], leg: { ankle: [1, 3] }, arm: { wrist: [19, 30] } },
    end: { hip: [-10, 44], shoulder: [18, 58], leg: { ankle: [1, 3] }, arm: { wrist: [5, 46], elbow: [4, 61] } },
  },
  "db-pullover": {
    view: "side",
    dumbbells: true,
    start: { ...SUPINE, arm: { wrist: [-31, 35] } },
    end: { ...SUPINE, arm: { wrist: [-60, 10] } },
  },
  "rear-delt-fly": {
    view: "side",
    dumbbells: true,
    start: { hip: [-10, 44], shoulder: [18, 58], leg: { ankle: [1, 3] }, arm: { wrist: [19, 30] } },
    end: { hip: [-10, 44], shoulder: [18, 58], leg: { ankle: [1, 3] }, arm: { wrist: [26, 56], elbow: [24, 52] } },
  },
  "db-curl": {
    view: "side",
    dumbbells: true,
    start: { ...STAND, arm: { wrist: [2, 49], elbow: [1, 63] } },
    end: { ...STAND, arm: { wrist: [12, 73], elbow: [1, 63] } },
  },
  "hammer-curl": {
    view: "side",
    dumbbells: true,
    start: { ...STAND, arm: { wrist: [2, 49], elbow: [1, 63] } },
    end: { ...STAND, arm: { wrist: [12, 73], elbow: [1, 63] } },
  },

  // ─── Legs & core ───────────────────────────────────────────────────────
  "goblet-squat": {
    view: "side",
    dumbbells: true,
    start: { ...STAND, arm: { wrist: [9, 72], elbow: [5, 64] } },
    end: {
      hip: [-12, 26],
      shoulder: [6, 52],
      leg: { ankle: [1, 3] },
      arm: { wrist: [16, 47], elbow: [13, 39] },
    },
  },
  "db-rdl": {
    view: "side",
    dumbbells: true,
    start: { ...STAND, arm: { wrist: [3, 49], bend: -1 } },
    end: { hip: [-12, 42], shoulder: [17, 56], leg: { ankle: [1, 3] }, arm: { wrist: [18, 28] } },
  },
  "calf-raise": {
    view: "side",
    start: STAND,
    end: {
      hip: [0, 51],
      shoulder: [0, 83],
      leg: { ankle: [1, 8], foot: -50 },
      arm: { wrist: [2, 54], bend: -1 },
    },
  },
  "lying-leg-raise": {
    view: "side",
    start: { ...SUPINE, leg: { ankle: [43, 5] } },
    end: { ...SUPINE, leg: { ankle: [8, 49] } },
  },
};
