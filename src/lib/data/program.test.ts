import { describe, expect, it } from "vitest";
import { EXERCISES } from "./exercises";
import { nextDay, PROGRAM, TOTAL_WEEKS, DAYS_PER_WEEK } from "./program";

describe("program", () => {
  it("has four sessions in each of eight weeks", () => {
    expect(PROGRAM).toHaveLength(TOTAL_WEEKS * DAYS_PER_WEEK);
    expect(new Set(PROGRAM.map((d) => d.id)).size).toBe(PROGRAM.length);
  });

  it("progresses inside a phase", () => {
    const w3 = PROGRAM.find((d) => d.id === "w3-a")!;
    const w5 = PROGRAM.find((d) => d.id === "w5-a")!;
    expect(w5.items[0].amount).toBe(w3.items[0].amount + 4);
  });

  it("trains glutes and thighs at least twice a week, core every session", () => {
    for (let week = 1; week <= TOTAL_WEEKS; week++) {
      const days = PROGRAM.filter((d) => d.week === week);
      const hits = (goal: string) =>
        days.filter((d) => d.items.some((i) => i.exercise.goals.includes(goal as never))).length;
      expect(hits("glutes")).toBeGreaterThanOrEqual(2);
      expect(hits("thighs")).toBeGreaterThanOrEqual(2);
      expect(hits("bust")).toBeGreaterThanOrEqual(2);
      expect(hits("waist")).toBe(days.length);
    }
  });

  it("picks the first unfinished day", () => {
    expect(nextDay([])?.id).toBe("w1-a");
    expect(nextDay(["w1-a", "w1-b"])?.id).toBe("w1-c");
  });

  it("only references valid easier/harder exercises", () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const e of EXERCISES) {
      if (e.easier) expect(ids).toContain(e.easier);
      if (e.harder) expect(ids).toContain(e.harder);
    }
  });
});
