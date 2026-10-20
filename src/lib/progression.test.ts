import { describe, expect, it } from "vitest";
import { suggestNext } from "./progression";

const range: [number, number] = [8, 12];

describe("suggestNext", () => {
  it("asks for a starting weight the first time", () => {
    expect(suggestNext([], range, true).kg).toBeUndefined();
  });

  it("goes up a step when every set hit the top without maxing out", () => {
    const s = suggestNext(
      [
        { done: 12, weightKg: 12, effort: "hard" },
        { done: 12, weightKg: 12, effort: "hard" },
      ],
      range,
      true,
    );
    expect(s.kg).toBe(14);
  });

  it("uses 1 kg steps on light dumbbells", () => {
    expect(suggestNext([{ done: 12, weightKg: 5, effort: "easy" }], range, true).kg).toBe(6);
  });

  it("stays put while reps are still inside the range", () => {
    const s = suggestNext(
      [
        { done: 12, weightKg: 12, effort: "hard" },
        { done: 10, weightKg: 12, effort: "hard" },
      ],
      range,
      true,
    );
    expect(s.kg).toBe(12);
  });

  it("drops a step after falling short at max effort", () => {
    const s = suggestNext([{ done: 6, weightKg: 12, effort: "max" }], range, true);
    expect(s.kg).toBe(10);
  });

  it("does not raise the weight if the top was only reached at max effort", () => {
    const s = suggestNext([{ done: 12, weightKg: 12, effort: "max" }], range, true);
    expect(s.kg).toBe(12);
  });

  it("coaches reps for bodyweight moves", () => {
    const s = suggestNext([{ done: 7 }, { done: 6 }], range, false);
    expect(s.kg).toBeUndefined();
    expect(s.message).toContain("7, 6");
  });
});
