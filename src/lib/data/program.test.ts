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

  it("never repeats a move within a day (set logs are keyed by move)", () => {
    for (const d of PROGRAMS[plan]) {
      const ids = d.items.map((i) => i.exercise.id);
      expect(new Set(ids).size, d.id).toBe(ids.length);
    }
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

  it("shape: fixed reps climb inside a phase and glute days end on a finisher", () => {
    const w3 = PROGRAMS.shape.find((d) => d.id === "w3-a")!;
    const w5 = PROGRAMS.shape.find((d) => d.id === "w5-a")!;
    expect(w5.items[0].amount).toBe(w3.items[0].amount + 4);
    for (const d of PROGRAMS.shape.filter((d) => d.key === "a" || d.key === "c")) {
      expect(d.items.at(-1)?.finisher, d.id).toBe(true);
    }
  });

  it("ppl: every rep-based move uses a rep range that progresses by weight, not reps", () => {
    for (const d of PROGRAMS.ppl) {
      for (const i of d.items.filter((i) => i.exercise.unit === "reps" && !i.exercise.perSide)) {
        expect(i.range, `${d.id} ${i.exercise.id}`).toBeDefined();
      }
    }
    const w3 = PROGRAMS.ppl.find((d) => d.id === "ppl-w3-a")!;
    const w5 = PROGRAMS.ppl.find((d) => d.id === "ppl-w5-a")!;
    expect(w5.items[0].range).toEqual(w3.items[0].range);
  });

  it("only reference valid easier/harder exercises", () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const e of EXERCISES) {
      if (e.easier) expect(ids).toContain(e.easier);
      if (e.harder) expect(ids).toContain(e.harder);
    }
  });
});
