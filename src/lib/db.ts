"use client";

import Dexie, { type EntityTable } from "dexie";
import { z } from "zod";

// Everything the app remembers lives here, in the browser's IndexedDB.
// Nothing is sent anywhere: camera frames are processed in memory and
// discarded, and only these numbers are stored.

export const setLogSchema = z.object({
  exerciseId: z.string(),
  setIndex: z.number().int().nonnegative(),
  target: z.number().nonnegative(),
  /** Reps or seconds completed. */
  done: z.number().nonnegative(),
  goodReps: z.number().nonnegative(),
  partials: z.number().nonnegative(),
  /** Form cue text → how many reps it fired on. */
  cues: z.record(z.string(), z.number()),
  tracked: z.boolean(),
  at: z.number(),
});
export type SetLog = z.infer<typeof setLogSchema>;

export const sessionSchema = z.object({
  id: z.string(),
  dayId: z.string(),
  startedAt: z.number(),
  finishedAt: z.number().optional(),
  status: z.enum(["active", "done"]),
  sets: z.array(setLogSchema),
});
export type Session = z.infer<typeof sessionSchema>;

const cm = z.number().positive().max(300).optional();
export const measurementSchema = z.object({
  id: z.number().int().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: z.number().positive().max(400).optional(),
  bustCm: cm,
  underbustCm: cm,
  waistCm: cm,
  hipsCm: cm,
  thighCm: cm,
});
export type Measurement = z.infer<typeof measurementSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(40),
  startedOn: z.string(),
  voice: z.boolean(),
  model: z.enum(["lite", "full"]),
  units: z.enum(["cm", "in"]),
});
export type Profile = z.infer<typeof profileSchema>;

type SettingRow = { key: "profile"; value: Profile };

class WorkoutDB extends Dexie {
  sessions!: EntityTable<Session, "id">;
  measurements!: EntityTable<Measurement, "id">;
  settings!: EntityTable<SettingRow, "key">;

  constructor() {
    super("workout-helper");
    this.version(1).stores({
      sessions: "id, dayId, status, startedAt",
      measurements: "++id, date",
      settings: "key",
    });
  }
}

export const db = new WorkoutDB();

export async function saveProfile(profile: Profile) {
  await db.settings.put({ key: "profile", value: profileSchema.parse(profile) });
}

export async function getProfile(): Promise<Profile | null> {
  return (await db.settings.get("profile"))?.value ?? null;
}

/** Resume the active session for a day, or start a new one. */
export async function openSession(dayId: string): Promise<Session> {
  const active = await db.sessions.where({ dayId, status: "active" }).first();
  if (active) return active;
  const session: Session = {
    id: crypto.randomUUID(),
    dayId,
    startedAt: Date.now(),
    status: "active",
    sets: [],
  };
  await db.sessions.add(session);
  return session;
}

export async function logSet(sessionId: string, set: SetLog) {
  await db.sessions
    .where("id")
    .equals(sessionId)
    .modify((s) => {
      s.sets = [
        ...s.sets.filter((x) => !(x.exerciseId === set.exerciseId && x.setIndex === set.setIndex)),
        setLogSchema.parse(set),
      ];
    });
}

export async function finishSession(sessionId: string) {
  await db.sessions.update(sessionId, { status: "done", finishedAt: Date.now() });
}

// ─── Backup ────────────────────────────────────────────────────────────────
// Because data never leaves the device, export/import is the only way to move
// it to a new phone or survive clearing browser data.

const backupSchema = z.object({
  app: z.literal("workout-helper"),
  version: z.literal(1),
  exportedAt: z.string(),
  profile: profileSchema.nullable(),
  sessions: z.array(sessionSchema),
  measurements: z.array(measurementSchema),
});

export async function exportBackup(): Promise<string> {
  const backup: z.infer<typeof backupSchema> = {
    app: "workout-helper",
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: await getProfile(),
    sessions: await db.sessions.toArray(),
    measurements: await db.measurements.toArray(),
  };
  return JSON.stringify(backup, null, 2);
}

export async function importBackup(json: string) {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("That file isn't valid JSON. Choose a backup exported from this app.");
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("That file isn't a Workout Helper backup, or it's from an incompatible version.");
  }
  const data = parsed.data;
  await db.transaction("rw", db.sessions, db.measurements, db.settings, async () => {
    await Promise.all([db.sessions.clear(), db.measurements.clear(), db.settings.clear()]);
    await db.sessions.bulkAdd(data.sessions);
    await db.measurements.bulkAdd(data.measurements.map((m) => {
        const copy = { ...m };
        delete copy.id;
        return copy;
      }));
    if (data.profile) await db.settings.put({ key: "profile", value: data.profile });
  });
}

export async function deleteEverything() {
  await db.delete({ disableAutoOpen: false });
}
