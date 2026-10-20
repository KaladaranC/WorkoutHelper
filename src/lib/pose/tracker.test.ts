import { describe, expect, it } from "vitest";
import { LM, type Pose } from "./geometry";
import { MotionTracker, type HoldTracking, type RepTracking } from "./tracker";

// Build a side-view pose (left side to camera) whose knee bends to `kneeDeg`
// while the torso leans forward by `leanDeg`.
function squatPose(kneeDeg: number, leanDeg = 10): Pose {
  const pose: Pose = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.1 }));
  const ankle = { x: 0.5, y: 0.9 };
  const knee = { x: 0.5, y: 0.7 };
  // Thigh direction measured from the shin (straight up) by 180 - kneeDeg.
  const bend = ((180 - kneeDeg) * Math.PI) / 180;
  const hip = { x: knee.x - Math.sin(bend) * 0.2, y: knee.y - Math.cos(bend) * 0.2 };
  const lean = (leanDeg * Math.PI) / 180;
  const shoulder = { x: hip.x + Math.sin(lean) * 0.25, y: hip.y - Math.cos(lean) * 0.25 };
  const set = (i: number, p: { x: number; y: number }) => (pose[i] = { ...p, visibility: 0.95 });
  set(LM.leftAnkle, ankle);
  set(LM.leftKnee, knee);
  set(LM.leftHip, hip);
  set(LM.leftShoulder, shoulder);
  return pose;
}

const squat: RepTracking = {
  kind: "reps",
  view: "side",
  metric: "knee",
  restAt: 165,
  peakAt: 100,
  partialCue: "Go deeper",
  checks: [
    { id: "lean", metric: "torsoLean", aggregate: "max", failWhen: { op: ">", value: 45 }, cue: "Chest up" },
  ],
  setup: "",
};

function run(tracker: MotionTracker, angles: number[], lean = 10, stepMs = 50) {
  let t = 0;
  let last = tracker.update(null, 1, t);
  const events = [];
  for (const a of angles) {
    t += stepMs;
    last = tracker.update(squatPose(a, lean), 1, t);
    events.push(...last.events);
  }
  return { last, events };
}

const settle = Array(12).fill(175);
const fullRep = [...Array(4).fill(150), ...Array(6).fill(90), ...Array(6).fill(175)];

describe("MotionTracker reps", () => {
  it("waits for the start position before counting", () => {
    const t = new MotionTracker(squat);
    const { last } = run(t, Array(10).fill(120));
    expect(last.status).toBe("searching");
    expect(last.reps).toBe(0);
  });

  it("counts a full-range rep once", () => {
    const t = new MotionTracker(squat);
    const { last, events } = run(t, [...settle, ...fullRep, ...fullRep]);
    expect(last.reps).toBe(2);
    expect(last.goodReps).toBe(2);
    expect(events.filter((e) => e.type === "rep")).toHaveLength(2);
  });

  it("reports a partial rep instead of counting it", () => {
    const t = new MotionTracker(squat);
    const shallow = [...Array(6).fill(125), ...Array(6).fill(175)];
    const { last, events } = run(t, [...settle, ...shallow]);
    expect(last.reps).toBe(0);
    expect(last.partials).toBe(1);
    expect(events).toContainEqual({ type: "partial", cue: "Go deeper" });
  });

  it("flags form faults on a counted rep", () => {
    const t = new MotionTracker(squat);
    const { last, events } = run(t, [...settle, ...fullRep], 60);
    expect(last.reps).toBe(1);
    expect(last.goodReps).toBe(0);
    const rep = events.find((e) => e.type === "rep");
    expect(rep && rep.type === "rep" && rep.cues).toContain("Chest up");
  });

  it("ignores frames where the body is out of view", () => {
    const t = new MotionTracker(squat);
    run(t, settle);
    const frame = t.update(null, 1, 10_000);
    expect(frame.lost).toBe(true);
    expect(frame.reps).toBe(0);
  });
});

describe("MotionTracker holds", () => {
  const wallSit: HoldTracking = {
    kind: "hold",
    view: "side",
    metric: "knee",
    range: [75, 110],
    outOfRangeCue: "Sit lower",
    setup: "",
  };

  it("accumulates time only inside the range", () => {
    const t = new MotionTracker(wallSit);
    const { last } = run(t, [...Array(10).fill(90), ...Array(10).fill(150)], 5, 100);
    // The first in-range frame starts the clock, so 9 intervals of 100ms count.
    expect(last.heldMs).toBe(900);
    expect(last.holding).toBe(false);
  });
});
