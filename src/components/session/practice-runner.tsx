"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CoachPanel } from "@/components/coach/coach-panel";
import { getExercise } from "@/lib/data/exercises";
import { useProfile } from "@/lib/hooks";
import { useWakeLock } from "./use-wake-lock";

const noop = () => {};

/** Try a move with the camera without logging anything. */
export function PracticeRunner({ id }: { id: string }) {
  const e = getExercise(id);
  const profile = useProfile();
  useWakeLock(true);
  const target = e.unit === "seconds" ? 30 : 10;

  return (
    <div className="flex h-dvh flex-col bg-stage text-stage-foreground">
      <header className="flex items-start gap-3 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
        <Link
          href={`/moves/${e.id}`}
          aria-label="Back to move"
          className="press grid size-10 shrink-0 place-items-center rounded-full border border-white/15 hover:border-white/35"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-scoreboard text-4xl font-extrabold uppercase">{e.name}</h1>
          <p className="mt-1 text-sm text-stage-muted">Practice, nothing is logged</p>
        </div>
      </header>
      {profile !== undefined && (
        <CoachPanel exercise={e} target={target} model={profile?.model ?? "lite"} cameraDefault onStats={noop} />
      )}
      <div className="h-[max(env(safe-area-inset-bottom),1rem)]" />
    </div>
  );
}
