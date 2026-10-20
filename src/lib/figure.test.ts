import { describe, expect, it } from "vitest";
import { EXERCISES } from "./data/exercises";
import { ILLUSTRATIONS } from "./data/illustrations";
import { BONES, resolveIllustration, solveJoint, type Frame } from "./figure";

const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe("solveJoint", () => {
  it("bends a standing knee forward with bend = 1", () => {
    const knee = solveJoint([0, 40], [0, 3], 22, 21, 1);
    expect(knee[0]).toBeGreaterThan(0);
    expect(dist([0, 40], knee)).toBeCloseTo(22, 5);
    expect(dist(knee, [0, 3])).toBeCloseTo(21, 5);
  });

  it("straightens toward an out-of-reach target", () => {
    const knee = solveJoint([0, 60], [0, 0], 22, 21, 1);
    expect(knee[0]).toBeCloseTo(0, 5);
  });
});

describe("illustrations", () => {
  it("covers every exercise", () => {
    for (const e of EXERCISES) expect(ILLUSTRATIONS[e.id], e.id).toBeDefined();
  });

  const frames = Object.entries(ILLUSTRATIONS).flatMap(([id, ill]) => {
    const { start, end } = resolveIllustration(ill);
    return [
      [id, "start", start],
      [id, "end", end],
    ] as [string, string, Frame][];
  });

  it.each(frames)("%s %s keeps the body above the floor", (_id, _which, f) => {
    for (const l of [f.near, f.far]) {
      for (const p of Object.values(l)) expect(p[1]).toBeGreaterThan(-2);
    }
  });

  it.each(frames)("%s %s keeps the torso a plausible length", (_id, _which, f) => {
    const d = dist(f.hip, f.shoulder);
    // Foreshortened rear views are allowed to be short; nothing should stretch.
    expect(d).toBeLessThan(36);
  });

  it.each(frames)("%s %s solves legs without stretching", (_id, _which, f) => {
    for (const l of [f.near, f.far]) {
      const reach = dist(l.hip, l.ankle);
      if (reach < BONES.thigh + BONES.shin) {
        expect(dist(l.hip, l.knee) + dist(l.knee, l.ankle)).toBeLessThan(BONES.thigh + BONES.shin + 12);
      }
    }
  });
});
