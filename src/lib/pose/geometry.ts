// Pure 2D geometry over MediaPipe's normalized image landmarks.
//
// Landmark x is normalized by frame width and y by frame height, so a raw
// angle is skewed whenever the frame isn't square. Every function takes the
// frame aspect ratio (width / height) and rescales x before measuring.

export type Point = { x: number; y: number; z?: number; visibility?: number };
export type Pose = Point[];

export const LM = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

export type Side = "left" | "right";
export type Joint = "shoulder" | "elbow" | "wrist" | "hip" | "knee" | "ankle";

export function joint(side: Side, name: Joint): number {
  const key = `${side}${name[0].toUpperCase()}${name.slice(1)}` as keyof typeof LM;
  return LM[key];
}

function scaled(p: Point, aspect: number) {
  return { x: p.x * aspect, y: p.y };
}

/** Interior angle at `b` in degrees, 0–180. */
export function angleAt(a: Point, b: Point, c: Point, aspect = 1): number {
  const A = scaled(a, aspect);
  const B = scaled(b, aspect);
  const C = scaled(c, aspect);
  const v1x = A.x - B.x;
  const v1y = A.y - B.y;
  const v2x = C.x - B.x;
  const v2y = C.y - B.y;
  const dot = v1x * v2x + v1y * v2y;
  const mag = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (mag === 0) return 180;
  const cos = Math.min(1, Math.max(-1, dot / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Angle in degrees between the segment from→to and straight up (0 = vertical). */
export function angleFromVertical(from: Point, to: Point, aspect = 1): number {
  const F = scaled(from, aspect);
  const T = scaled(to, aspect);
  const dx = T.x - F.x;
  const dy = F.y - T.y; // image y grows downward
  return (Math.abs(Math.atan2(dx, dy)) * 180) / Math.PI;
}

export function distance(a: Point, b: Point, aspect = 1): number {
  const A = scaled(a, aspect);
  const B = scaled(b, aspect);
  return Math.hypot(A.x - B.x, A.y - B.y);
}

export function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}

export function visibility(pose: Pose, indices: readonly number[]): number {
  if (indices.length === 0) return 1;
  let min = 1;
  for (const i of indices) min = Math.min(min, pose[i]?.visibility ?? 0);
  return min;
}
