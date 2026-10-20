"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { db, type Profile, type Session } from "./db";
import { setVoiceEnabled } from "./speech";

/** undefined while IndexedDB is loading, null when she hasn't onboarded yet. */
export function useProfile(): Profile | null | undefined {
  const profile = useLiveQuery(async () => (await db.settings.get("profile"))?.value ?? null);
  useEffect(() => {
    if (profile) setVoiceEnabled(profile.voice);
  }, [profile]);
  return profile;
}

export function useSessions(): Session[] | undefined {
  return useLiveQuery(() => db.sessions.orderBy("startedAt").reverse().toArray());
}

export function completedDayIds(sessions: Session[]): string[] {
  return sessions.filter((s) => s.status === "done").map((s) => s.dayId);
}
