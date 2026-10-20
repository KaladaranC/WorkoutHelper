// Turns a hand-authored pose (hip, shoulder, hands and feet) into a full
// body: elbows and knees are solved with two-bone inverse kinematics so every
// figure has consistent proportions. Pure, so it renders on the server and is
// unit-tested.
//
// Coordinates: y points up, the floor is y = 0, and side-view figures face +x.
// A standing figure is about 100 units tall.

export type Pt = [number, number];

export type LegSpec = {
  ankle: Pt;
  /** Set explicitly for foreshortened poses; otherwise solved by IK. */
  knee?: Pt;
  /** 1 bends the joint to the left of the root→end vector (counter-clockwise). */
  bend?: 1 | -1;
  /** Foot direction in degrees; defaults to perpendicular to the shin. */
  foot?: number;
};

export type ArmSpec = { wrist: Pt; elbow?: Pt; bend?: 1 | -1 };

export type PoseSpec = {
  hip: Pt;
  shoulder: Pt;
  /** Head direction from the shoulders in degrees; defaults to the torso's. */
  head?: number;
  leg: LegSpec;
  arm: ArmSpec;
  /** Omitted far limbs copy the near ones (side view) or mirror them (front view). */
  farLeg?: LegSpec;
  farArm?: ArmSpec;
};

export type Prop =
  | { kind: "couch"; x: number; w: number; top: number; back: "left" | "right" }
  | { kind: "chair"; x: number; w: number; top: number; back: "left" | "right" }
  | { kind: "wall"; x: number }
  | { kind: "table"; x: number; w: number; top: number }
  | { kind: "bar"; x: number; w: number; y: number };

export type Illustration = {
  view: "side" | "front";
  start: PoseSpec;
  /** Omitted for static holds. */
  end?: PoseSpec;
  props?: Prop[];
  /** Draw a dumbbell in each hand. */
  dumbbells?: boolean;
};

export type Limbs = {
  hip: Pt;
  knee: Pt;
  ankle: Pt;
  toe: Pt;
  shoulder: Pt;
  elbow: Pt;
  wrist: Pt;
};

export type Frame = {
  view: "side" | "front";
  hip: Pt;
  shoulder: Pt;
  head: Pt;
  near: Limbs;
  far: Limbs;
  /** True when the far limbs were copied from the near ones (draw them offset). */
  farIsCopy: boolean;
};

export const BONES = { thigh: 22, shin: 21, upperArm: 15, forearm: 14, foot: 7, neck: 10 };
export const HEAD_R = 6.5;
const HIP_HALF = 6;
const SHOULDER_HALF = 10;

const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const scale = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const deg = (a: Pt) => (Math.atan2(a[1], a[0]) * 180) / Math.PI;
const unit = (degrees: number): Pt => {
  const r = (degrees * Math.PI) / 180;
  return [Math.cos(r), Math.sin(r)];
};

/** Middle joint of a two-bone chain from `root` reaching for `end`. */
export function solveJoint(root: Pt, end: Pt, l1: number, l2: number, bend: 1 | -1): Pt {
  const v = sub(end, root);
  const d = len(v);
  if (d === 0) return add(root, [0, l1]);
  const dir = scale(v, 1 / d);
  if (d >= l1 + l2) return add(root, scale(v, l1 / (l1 + l2)));
  const dd = Math.max(d, Math.abs(l1 - l2) + 0.01);
  const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const perp: Pt = [-dir[1], dir[0]];
  return add(add(root, scale(dir, a)), scale(perp, h * bend));
}

function mirrorLeg(l: LegSpec, cx: number): LegSpec {
  return {
    ankle: [2 * cx - l.ankle[0], l.ankle[1]],
    knee: l.knee && [2 * cx - l.knee[0], l.knee[1]],
    bend: l.bend === undefined ? -1 : ((-l.bend) as 1 | -1),
    foot: l.foot === undefined ? undefined : 180 - l.foot,
  };
}

function mirrorArm(a: ArmSpec, cx: number): ArmSpec {
  return {
    wrist: [2 * cx - a.wrist[0], a.wrist[1]],
    elbow: a.elbow && [2 * cx - a.elbow[0], a.elbow[1]],
    bend: ((-(a.bend ?? 1)) as 1 | -1),
  };
}

function limbs(
  view: Illustration["view"],
  hipRoot: Pt,
  shoulderRoot: Pt,
  leg: LegSpec,
  arm: ArmSpec,
  side: 1 | -1,
): Limbs {
  const knee = leg.knee ?? solveJoint(hipRoot, leg.ankle, BONES.thigh, BONES.shin, leg.bend ?? 1);
  const elbow = arm.elbow ?? solveJoint(shoulderRoot, arm.wrist, BONES.upperArm, BONES.forearm, arm.bend ?? -1);
  const footAngle =
    leg.foot ?? (view === "front" ? (side === 1 ? -15 : 195) : deg(sub(leg.ankle, knee)) + 90);
  const footLen = view === "front" ? 5 : BONES.foot;
  let toe = add(leg.ankle, scale(unit(footAngle), footLen));
  if (toe[1] < 0.5) {
    // Toes can't go through the floor: pivot the foot until they rest on it.
    const drop = Math.min(footLen, Math.max(0, leg.ankle[1] - 0.5));
    const run = Math.sqrt(footLen * footLen - drop * drop);
    toe = [leg.ankle[0] + Math.sign(toe[0] - leg.ankle[0] || 1) * run, leg.ankle[1] - drop];
  }
  return {
    hip: hipRoot,
    knee,
    ankle: leg.ankle,
    toe,
    shoulder: shoulderRoot,
    elbow,
    wrist: arm.wrist,
  };
}

export function resolvePose(view: Illustration["view"], p: PoseSpec): Frame {
  const front = view === "front";
  const hipOff: Pt = front ? [HIP_HALF, 0] : [0, 0];
  const shOff: Pt = front ? [SHOULDER_HALF, 0] : [0, 0];
  const near = limbs(view, add(p.hip, hipOff), add(p.shoulder, shOff), p.leg, p.arm, 1);

  const farLegSpec = p.farLeg ?? (front ? mirrorLeg(p.leg, p.hip[0]) : p.leg);
  const farArmSpec = p.farArm ?? (front ? mirrorArm(p.arm, p.hip[0]) : p.arm);
  const far = limbs(view, sub(p.hip, hipOff), sub(p.shoulder, shOff), farLegSpec, farArmSpec, -1);

  const headDir = p.head ?? deg(sub(p.shoulder, p.hip));
  return {
    view,
    hip: p.hip,
    shoulder: p.shoulder,
    head: add(p.shoulder, scale(unit(headDir), BONES.neck)),
    near,
    far,
    farIsCopy: !front && !p.farLeg && !p.farArm,
  };
}

export function resolveIllustration(ill: Illustration): { start: Frame; end: Frame } {
  const start = resolvePose(ill.view, ill.start);
  return { start, end: ill.end ? resolvePose(ill.view, ill.end) : start };
}

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function lerpLimbs(a: Limbs, b: Limbs, t: number): Limbs {
  const out = {} as Limbs;
  for (const k of Object.keys(a) as (keyof Limbs)[]) out[k] = lerp(a[k], b[k], t);
  return out;
}

export function lerpFrame(a: Frame, b: Frame, t: number): Frame {
  return {
    view: a.view,
    hip: lerp(a.hip, b.hip, t),
    shoulder: lerp(a.shoulder, b.shoulder, t),
    head: lerp(a.head, b.head, t),
    near: lerpLimbs(a.near, b.near, t),
    far: lerpLimbs(a.far, b.far, t),
    farIsCopy: a.farIsCopy,
  };
}

export type Box = { minX: number; minY: number; maxX: number; maxY: number };

/** Bounds covering every frame and prop, so an animation never jumps or clips. */
export function bounds(frames: Frame[], props: Prop[] = []): Box {
  const b: Box = { minX: Infinity, minY: 0, maxX: -Infinity, maxY: -Infinity };
  const take = (p: Pt, r: number) => {
    b.minX = Math.min(b.minX, p[0] - r);
    b.maxX = Math.max(b.maxX, p[0] + r);
    b.minY = Math.min(b.minY, p[1] - r);
    b.maxY = Math.max(b.maxY, p[1] + r);
  };
  for (const f of frames) {
    take(f.head, HEAD_R + 1);
    for (const l of [f.near, f.far]) for (const p of Object.values(l)) take(p, 4);
  }
  for (const p of props) {
    if (p.kind === "wall") {
      take([p.x, b.maxY], 2);
    } else if (p.kind === "bar") {
      take([p.x, p.y + 2], 1);
      take([p.x + p.w, p.y - 2], 1);
    } else if (p.kind === "table") {
      take([p.x, p.top + 2], 1);
      take([p.x + p.w, 0], 1);
    } else {
      take([p.x, p.top + (p.kind === "couch" ? 14 : 22)], 1);
      take([p.x + p.w, 0], 1);
    }
  }
  return b;
}
