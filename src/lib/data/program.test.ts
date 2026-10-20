import { describe, expect, it } from "vitest";
import { EXERCISES, type Area } from "./exercises";
import { ALL_DAYS, DAYS_PER_WEEK, nextDay, PLANS, PROGRAMS, TOTAL_WEEKS, type PlanId } from "./program";

const daysHitting = (plan: PlanId, week: number, area: Area) =>
  PROGRAMS[plan]
    .filter((d) => d.week === week)
    .filter((d) => d.items.some((i) => i.exercise.areas.includes(area))).length;

describe.each(Object.keys(PLANS) as PlanId[])("%s plan", (plan) => {
  it("has four sessions in each of eight weeks", () => {
    expect(PROGRAMS[plan]).toHaveLength(TOTAL_WEEKS * DAYS_PER_WEEK);
  });

  it("progresses inside a phase", () => {
    const w3 = PROGRAMS[plan].find((d) => d.week === 3 && d.key === "a")!;
    const w5 = PROGRAMS[plan].find((d) => d.week === 5 && d.key === "a")!;
    expect(w5.items[0].amount).toBe(w3.items[0].amount + 4);
  });

  it("starts at the first day and moves on in order", () => {
    const [first, second] = PROGRAMS[plan];
    expect(nextDay(plan, [])?.id).toBe(first.id);
    expect(nextDay(plan, [first.id])?.id).toBe(second.id);
  });
});

describe("plans", () => {
  it("use ids that never collide across plans", () => {
    expect(new Set(ALL_DAYS.map((d) => d.id)).size).toBe(ALL_DAYS.length);
  });

  it("keep the original plan's day ids so saved history stays valid", () => {
    expect(PROGRAMS.shape[0].id).toBe("w1-a");
  });

  it("shape: glutes, thighs and chest twice a week, core every session", () => {
    for (let week = 1; week <= TOTAL_WEEKS; week++) {
      expect(daysHitting("shape", week, "glutes")).toBeGreaterThanOrEqual(2);
      expect(daysHitting("shape", week, "legs")).toBeGreaterThanOrEqual(2);
      expect(daysHitting("shape", week, "chest")).toBeGreaterThanOrEqual(2);
      expect(daysHitting("shape", week, "core")).toBe(DAYS_PER_WEEK);
    }
  });

  it("ppl: every upper-body muscle at least twice a week, legs and core covered", () => {
    for (let week = 1; week <= TOTAL_WEEKS; week++) {
      for (const area of ["chest", "back", "shoulders", "biceps", "triceps"] as Area[]) {
        expect(daysHitting("ppl", week, area), `${area} in week ${week}`).toBeGreaterThanOrEqual(2);
      }
      expect(daysHitting("ppl", week, "legs")).toBeGreaterThanOrEqual(2);
      expect(daysHitting("ppl", week, "core")).toBeGreaterThanOrEqual(3);
    }
  });

  it("only reference valid easier/harder exercises", () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const e of EXERCISES) {
      if (e.easier) expect(ids).toContain(e.easier);
      if (e.harder) expect(ids).toContain(e.harder);
    }
  });
});
