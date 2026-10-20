"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import type { Exercise } from "@/lib/data/exercises";
import type { ModelSize } from "@/lib/pose/landmarker";
import { MotionTracker, type CameraTracking, type TrackerEvent } from "@/lib/pose/tracker";
import { speak } from "@/lib/speech";
import { cn, formatSeconds } from "@/lib/utils";
import { RangeArc, type ArcApi } from "./range-arc";
import { usePoseCamera, type Tone } from "./use-pose-camera";

export type CoachStats = {
  done: number;
  goodReps: number;
  partials: number;
  cues: Record<string, number>;
  tracked: boolean;
};

type Props = {
  exercise: Exercise;
  /** Total reps or seconds for this set (already doubled for per-side moves). */
  target: number;
  model: ModelSize;
  cameraDefault: boolean;
  /** Progress so far in this set, so remounting the panel doesn't reset it. */
  initial?: CoachStats;
  /** Spoken when the target is reached; each plan has its own voice. */
  doneLine?: string;
  /** Spoken once on reaching a rep count, e.g. the bottom of a rep range. */
  milestone?: { at: number; text: string };
  onStats: (stats: CoachStats) => void;
};

const EMPTY: CoachStats = { done: 0, goodReps: 0, partials: 0, cues: {}, tracked: false };

export function CoachPanel({
  exercise,
  target,
  model,
  cameraDefault,
  initial,
  doneLine,
  milestone,
  onStats,
}: Props) {
  const tracking = exercise.tracking;
  const canTrack = tracking.kind !== "manual";
  const [useCamera, setUseCamera] = useState(canTrack && cameraDefault);
  const [stats, setStats] = useState<CoachStats>(initial ?? EMPTY);

  const report = useCallback(
    (next: CoachStats) => {
      setStats(next);
      onStats(next);
    },
    [onStats],
  );

  const half = exercise.perSide ? target / 2 : null;
  const announced = useRef({
    half: half !== null && stats.done >= half,
    milestone: milestone !== undefined && stats.done >= milestone.at,
    done: stats.done >= target,
  });
  useEffect(() => {
    const unit = exercise.unit;
    if (half !== null && !announced.current.half && stats.done >= half && stats.done < target) {
      announced.current.half = true;
      speak("Switch sides", { interrupt: unit === "reps" ? false : true });
    }
    if (milestone && !announced.current.milestone && stats.done >= milestone.at && stats.done < target) {
      announced.current.milestone = true;
      speak(milestone.text);
    }
    if (!announced.current.done && stats.done >= target) {
      announced.current.done = true;
      speak(unit === "reps" ? (doneLine ?? "Set complete. Nice work.") : "Time. Well held.");
    }
  }, [stats.done, half, target, exercise.unit, milestone, doneLine]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {useCamera && canTrack ? (
        <CameraCoach
          key={`${exercise.id}-cam`}
          exercise={exercise}
          tracking={tracking}
          target={target}
          model={model}
          base={stats}
          onStats={report}
        />
      ) : (
        <ManualCoach key={`${exercise.id}-manual`} exercise={exercise} target={target} initial={stats} onStats={report} />
      )}

      <div className="flex items-center justify-between gap-3 px-4 pt-3 text-sm text-stage-muted">
        {canTrack ? (
          <button
            type="button"
            onClick={() => setUseCamera((v) => !v)}
            className="press inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 hover:border-white/35 hover:text-stage-foreground"
          >
            {useCamera ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
            {useCamera ? "Count by hand" : "Use camera"}
          </button>
        ) : (
          <p className="max-w-[40ch] text-pretty">{tracking.reason}</p>
        )}
        {half !== null && (
          <span className="shrink-0">
            {stats.done < half ? "First side" : "Second side"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Camera ─────────────────────────────────────────────────────────────────

function CameraCoach({
  exercise,
  tracking,
  target,
  model,
  base: baseAtMount,
  onStats,
}: {
  exercise: Exercise;
  tracking: CameraTracking;
  target: number;
  model: ModelSize;
  /** Reps or seconds already done this set (e.g. counted by hand before switching). */
  base: CoachStats;
  onStats: (s: CoachStats) => void;
}) {
  const [base] = useState(baseAtMount);
  const tracker = useMemo(() => new MotionTracker(tracking), [tracking]);
  const arc = useRef<ArcApi | null>(null);
  const cues = useRef<Record<string, number>>({ ...base.cues });
  const [count, setCount] = useState(base.done);
  const [pop, setPop] = useState(0);
  const [cue, setCue] = useState<{ text: string; tone: Tone; id: number } | null>(null);
  const [status, setStatus] = useState<"lost" | "searching" | "ready" | "tracking">("searching");
  const holdSeconds = useRef(base.done);
  const lastTone = useRef<Tone>("neutral");
  const isHold = tracking.kind === "hold";

  const showCue = useCallback((text: string, tone: Tone) => {
    setCue({ text, tone, id: Date.now() });
  }, []);

  const handleEvents = useCallback(
    (events: TrackerEvent[], frame: ReturnType<MotionTracker["update"]>) => {
      for (const e of events) {
        if (e.type === "ready") {
          showCue(isHold ? "Holding. Keep it there." : "I see you. Start when ready.", "good");
          speak(isHold ? "Go" : "Ready", { interrupt: true });
        } else if (e.type === "rep") {
          for (const c of e.cues) cues.current[c] = (cues.current[c] ?? 0) + 1;
          const total = base.done + e.count;
          setCount(total);
          setPop((p) => p + 1);
          lastTone.current = e.good ? "good" : "warn";
          if (e.good) {
            speak(String(total), { interrupt: true });
          } else {
            speak(`${total}. ${e.cues[0]}`, { interrupt: true });
            showCue(e.cues[0], "warn");
          }
        } else if (e.type === "partial" || e.type === "cue") {
          lastTone.current = "warn";
          showCue(e.cue, "warn");
          speak(e.cue);
          if (e.type === "partial") cues.current[e.cue] = (cues.current[e.cue] ?? 0) + 1;
        }
      }
      if (events.some((e) => e.type === "rep" || e.type === "partial")) {
        onStats({
          done: base.done + frame.reps,
          goodReps: base.goodReps + frame.goodReps,
          partials: base.partials + frame.partials,
          cues: { ...cues.current },
          tracked: true,
        });
      }
    },
    [base, isHold, onStats, showCue],
  );

  const onFrame = useCallback(
    (pose: Parameters<MotionTracker["update"]>[0], aspect: number, now: number): Tone => {
      const frame = tracker.update(pose, aspect, now);
      const nextStatus = frame.lost ? "lost" : frame.status;
      setStatus((s) => (s === nextStatus ? s : nextStatus));
      if (frame.events.length) handleEvents(frame.events, frame);

      if (isHold) {
        const secs = base.done + Math.floor(frame.heldMs / 1000);
        if (secs !== holdSeconds.current) {
          holdSeconds.current = secs;
          setCount(secs);
          onStats({ done: secs, goodReps: 0, partials: 0, cues: { ...cues.current }, tracked: true });
        }
        const tone: Tone = frame.lost ? "neutral" : frame.holding ? "good" : "warn";
        arc.current?.set((base.done + frame.heldMs / 1000) / target, tone, frame.value === null ? "" : `${Math.round(frame.value)}°`);
        return tone;
      }

      const tone: Tone = frame.lost || frame.status === "searching" ? "neutral" : frame.progress >= 1 ? "good" : lastTone.current === "warn" ? "warn" : "neutral";
      arc.current?.set(frame.progress, tone, frame.value === null ? "" : `${Math.round(frame.value)}°`);
      return tone;
    },
    [base.done, tracker, handleEvents, isHold, onStats, target],
  );

  const { videoRef, canvasRef, state, error } = usePoseCamera({ enabled: true, model, onFrame });

  const banner =
    state === "loading"
      ? "Starting camera and pose model…"
      : state === "denied"
        ? "Camera access is blocked. Allow it in your browser's site settings, or count by hand."
        : state === "unsupported"
          ? "This browser can't open the camera. Count by hand instead."
          : state === "error"
            ? `The camera couldn't start (${error}). Count by hand instead.`
            : status === "lost"
              ? tracking.setup
              : status === "searching"
                ? isHold
                  ? "Get into position and the timer will start."
                  : "Get into the start position and hold still."
                : null;

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 size-full -scale-x-100 object-cover opacity-80"
      />
      <canvas ref={canvasRef} className="absolute inset-0 size-full -scale-x-100 object-cover" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-2 bg-gradient-to-b from-black/70 to-transparent px-4 pt-4 pb-10">
        {banner ? (
          <p className="max-w-[38ch] text-center text-sm text-balance text-stage-foreground">{banner}</p>
        ) : cue ? (
          <p
            key={cue.id}
            className={cn(
              "cue-in rounded-full px-4 py-1.5 text-center text-base font-semibold text-balance",
              cue.tone === "warn" ? "bg-stage-warn text-stage" : "bg-stage-good text-stage",
            )}
          >
            {cue.text}
          </p>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/85 via-black/50 to-transparent px-6 pt-16 pb-4">
        <RangeArc
          apiRef={arc}
          startLabel={isHold ? "0s" : "Start"}
          endLabel={isHold ? formatSeconds(target) : "Full range"}
          showStartTick={!isHold}
        >
          <div className="flex items-baseline gap-1.5 text-stage-foreground">
            <span key={pop} className="font-scoreboard rep-pop text-[5.5rem] font-extrabold">
              {count}
            </span>
            <span className="font-scoreboard text-2xl font-semibold text-stage-muted">
              /{isHold ? formatSeconds(target) : target}
            </span>
          </div>
        </RangeArc>
      </div>
      <span className="sr-only" aria-live="polite">
        {isHold ? `${count} seconds held` : `${count} reps`}
      </span>
      {exercise.tracking.kind !== "manual" && status === "lost" && state === "running" && (
        <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-stage-muted">
          Can&apos;t see you
        </span>
      )}
    </div>
  );
}

// ─── Manual ─────────────────────────────────────────────────────────────────

function ManualCoach({
  exercise,
  target,
  initial,
  onStats,
}: {
  exercise: Exercise;
  target: number;
  initial: CoachStats;
  onStats: (s: CoachStats) => void;
}) {
  const [done, setDone] = useState(initial.done);
  const [running, setRunning] = useState(false);
  const isTimer = exercise.unit === "seconds";

  const set = useCallback(
    (n: number) => {
      const v = Math.max(0, n);
      setDone(v);
      onStats({ done: v, goodReps: 0, partials: 0, cues: {}, tracked: false });
    },
    [onStats],
  );

  useEffect(() => {
    if (!running) return;
    const started = performance.now() - done * 1000;
    const id = setInterval(() => {
      const secs = Math.floor((performance.now() - started) / 1000);
      set(secs);
    }, 250);
    return () => clearInterval(id);
    // done is only read when the timer (re)starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, set]);

  const reached = done >= target;

  if (isTimer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <div className="flex items-baseline gap-2">
          <span className={cn("font-scoreboard text-[8rem] font-extrabold", reached && "text-stage-good")}>
            {formatSeconds(done)}
          </span>
          <span className="font-scoreboard text-3xl text-stage-muted">/{formatSeconds(target)}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="press inline-flex h-14 items-center gap-2 rounded-full bg-stage-foreground px-8 text-lg font-semibold text-stage"
          >
            {running ? <Pause className="size-5" /> : <Play className="size-5" />}
            {running ? "Pause" : done > 0 ? "Resume" : "Start timer"}
          </button>
          <button
            type="button"
            aria-label="Reset timer"
            onClick={() => {
              setRunning(false);
              set(0);
            }}
            className="press grid size-14 place-items-center rounded-full border border-white/15 hover:border-white/35"
          >
            <RotateCcw className="size-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <button
        type="button"
        onClick={() => {
          set(done + 1);
          speak(String(done + 1), { interrupt: true });
        }}
        className="press flex flex-1 flex-col items-center justify-center gap-2 select-none"
      >
        <span className="flex items-baseline gap-2">
          <span className={cn("font-scoreboard text-[9rem] font-extrabold", reached && "text-stage-good")}>{done}</span>
          <span className="font-scoreboard text-3xl text-stage-muted">/{target}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-stage-muted">
          <Plus className="size-4" /> Tap anywhere here after each rep
        </span>
      </button>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => set(done - 1)}
          disabled={done === 0}
          className="press inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-stage-muted hover:text-stage-foreground disabled:opacity-40"
        >
          <Minus className="size-4" /> Undo last rep
        </button>
      </div>
    </div>
  );
}
