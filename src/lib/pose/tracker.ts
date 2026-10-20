import { visibility, type Pose, type Side } from "./geometry";
import { computeMetric, METRICS, requiredLandmarks, type MetricId } from "./metrics";

// The motion tracker is a pure state machine: feed it one pose per video frame
// and it reports rep counts, hold time and form cues. It knows nothing about
// the camera, the DOM or speech, which keeps it unit-testable.

export type FormCheck = {
  id: string;
  metric: MetricId;
  /** Which extreme of the metric over a rep (or each frame of a hold) to test. */
  aggregate: "min" | "max";
  failWhen: { op: "<" | ">"; value: number };
  cue: string;
};

export type RepTracking = {
  kind: "reps";
  view: "side" | "front";
  metric: MetricId;
  /** Metric value at the start and end of every rep. */
  restAt: number;
  /** Metric value that counts as a full-range rep. */
  peakAt: number;
  partialCue: string;
  checks?: FormCheck[];
  /** Reps faster than this get a "slow down" cue. */
  minRepMs?: number;
  setup: string;
};

export type HoldTracking = {
  kind: "hold";
  view: "side" | "front";
  metric: MetricId;
  range: [number, number];
  outOfRangeCue: string;
  checks?: FormCheck[];
  setup: string;
};

export type ManualTracking = { kind: "manual"; reason: string };

export type Tracking = RepTracking | HoldTracking | ManualTracking;
export type CameraTracking = RepTracking | HoldTracking;

export type TrackerEvent =
  | { type: "ready" }
  | { type: "rep"; count: number; good: boolean; cues: string[]; durationMs: number }
  | { type: "partial"; cue: string }
  | { type: "cue"; cue: string };

export type TrackerStatus = "searching" | "ready" | "tracking";

export type TrackerFrame = {
  status: TrackerStatus;
  /** True when the landmarks needed for this exercise aren't visible. */
  lost: boolean;
  side: Side;
  value: number | null;
  /** 0 at rest, 1 at full range (reps) or 1 while inside the hold range. */
  progress: number;
  reps: number;
  goodReps: number;
  partials: number;
  heldMs: number;
  holding: boolean;
  events: TrackerEvent[];
};

const VIS_SINGLE = 0.55;
const VIS_PAIR = 0.35;
const SMOOTHING = 0.45;
const READY_MS = 400;
const LOST_RESET_MS = 1500;
const HOLD_CUE_EVERY_MS = 4000;

const START = 0.2;
const PARTIAL_RETURN = 0.08;
const COMPLETE_RETURN = 0.15;
const PARTIAL_MIN_EXTENT = 0.35;

type Phase = "rest" | "moving" | "peak";

export class MotionTracker {
  private side: Side = "left";
  private smoothed = new Map<MetricId, number>();
  private phase: Phase = "rest";
  private status: TrackerStatus = "searching";
  private restSince: number | null = null;
  private repStart = 0;
  private extent = 0;
  private aggregates = new Map<string, number>();
  private lastSeen = 0;
  private lastFrame: number | null = null;
  private lastHoldCue = -Infinity;
  private reps = 0;
  private goodReps = 0;
  private partials = 0;
  private heldMs = 0;
  private wasHolding = false;

  constructor(private readonly config: CameraTracking) {}

  update(pose: Pose | null, aspect: number, now: number): TrackerFrame {
    const events: TrackerEvent[] = [];
    const dt = this.lastFrame === null ? 0 : Math.min(200, now - this.lastFrame);
    this.lastFrame = now;

    const visible = pose !== null && this.chooseSide(pose) && this.isVisible(pose);
    if (!pose || !visible) {
      if (this.phase !== "rest" && now - this.lastSeen > LOST_RESET_MS) {
        this.phase = "rest";
      }
      this.restSince = null;
      this.wasHolding = false;
      return this.frame({ lost: true, value: null, progress: 0, holding: false, events });
    }
    this.lastSeen = now;

    const value = this.smooth(this.config.metric, computeMetric(this.config.metric, pose, this.side, aspect));
    const checkValues = (this.config.checks ?? []).map((c) => ({
      check: c,
      value: this.smooth(c.metric, computeMetric(c.metric, pose, this.side, aspect)),
    }));

    if (this.config.kind === "hold") {
      return this.updateHold(value, checkValues, dt, now, events);
    }
    return this.updateReps(value, checkValues, now, events);
  }

  private updateReps(
    value: number,
    checks: { check: FormCheck; value: number }[],
    now: number,
    events: TrackerEvent[],
  ): TrackerFrame {
    const cfg = this.config as RepTracking;
    const progress = (value - cfg.restAt) / (cfg.peakAt - cfg.restAt);

    // Don't count anything until she has settled into the start position;
    // otherwise walking into frame registers as a rep.
    if (this.status === "searching") {
      if (progress < START) {
        this.restSince ??= now;
        if (now - this.restSince >= READY_MS) {
          this.status = "ready";
          events.push({ type: "ready" });
        }
      } else {
        this.restSince = null;
      }
      return this.frame({ lost: false, value, progress, holding: false, events });
    }

    if (this.phase === "rest") {
      if (progress > START) {
        this.phase = "moving";
        this.status = "tracking";
        this.repStart = now;
        this.aggregates.clear();
        this.extent = progress;
      }
    }

    if (this.phase !== "rest") {
      this.extent = Math.max(this.extent, progress);
      for (const { check, value: v } of checks) {
        const prev = this.aggregates.get(check.id);
        const next =
          prev === undefined ? v : check.aggregate === "min" ? Math.min(prev, v) : Math.max(prev, v);
        this.aggregates.set(check.id, next);
      }
    }

    if (this.phase === "moving") {
      if (progress >= 1) {
        this.phase = "peak";
      } else if (progress <= PARTIAL_RETURN) {
        this.phase = "rest";
        if (this.extent >= PARTIAL_MIN_EXTENT) {
          this.partials += 1;
          events.push({ type: "partial", cue: cfg.partialCue });
        }
      }
    } else if (this.phase === "peak" && progress <= COMPLETE_RETURN) {
      this.phase = "rest";
      const durationMs = now - this.repStart;
      const cues = checks
        .filter(({ check }) => fails(check, this.aggregates.get(check.id)))
        .map(({ check }) => check.cue);
      if (cfg.minRepMs && durationMs < cfg.minRepMs) {
        cues.push("Slow it down and control every rep");
      }
      this.reps += 1;
      if (cues.length === 0) this.goodReps += 1;
      events.push({ type: "rep", count: this.reps, good: cues.length === 0, cues, durationMs });
    }

    return this.frame({ lost: false, value, progress, holding: false, events });
  }

  private updateHold(
    value: number,
    checks: { check: FormCheck; value: number }[],
    dt: number,
    now: number,
    events: TrackerEvent[],
  ): TrackerFrame {
    const cfg = this.config as HoldTracking;
    const [lo, hi] = cfg.range;
    const inRange = value >= lo && value <= hi;
    const failing = checks.find(({ check, value: v }) => fails(check, v));
    const holding = inRange && !failing;

    if (holding) {
      if (this.status !== "tracking") {
        this.status = "tracking";
        events.push({ type: "ready" });
      }
      if (this.wasHolding) this.heldMs += dt;
    } else if (this.status === "tracking" && now - this.lastHoldCue >= HOLD_CUE_EVERY_MS) {
      this.lastHoldCue = now;
      events.push({ type: "cue", cue: inRange ? failing!.check.cue : cfg.outOfRangeCue });
    }

    this.wasHolding = holding;
    return this.frame({ lost: false, value, progress: holding ? 1 : 0, holding, events });
  }

  /** Lock onto the side facing the camera; switch only on a clear difference. */
  private chooseSide(pose: Pose): boolean {
    if (METRICS[this.config.metric].kind === "pair") return true;
    const score = (s: Side) => visibility(pose, requiredLandmarks(this.config.metric, s));
    const other: Side = this.side === "left" ? "right" : "left";
    if (score(other) > score(this.side) + 0.15) this.side = other;
    return true;
  }

  private isVisible(pose: Pose): boolean {
    const ids = [this.config.metric, ...(this.config.checks ?? []).map((c) => c.metric)];
    return ids.every((id) => {
      const threshold = METRICS[id].kind === "pair" ? VIS_PAIR : VIS_SINGLE;
      return visibility(pose, requiredLandmarks(id, this.side)) >= threshold;
    });
  }

  private smooth(id: MetricId, raw: number): number {
    const prev = this.smoothed.get(id);
    const next = prev === undefined ? raw : prev + SMOOTHING * (raw - prev);
    this.smoothed.set(id, next);
    return next;
  }

  private frame(
    f: Pick<TrackerFrame, "lost" | "value" | "progress" | "holding" | "events">,
  ): TrackerFrame {
    return {
      ...f,
      status: this.status,
      side: this.side,
      reps: this.reps,
      goodReps: this.goodReps,
      partials: this.partials,
      heldMs: this.heldMs,
    };
  }
}

function fails(check: FormCheck, value: number | undefined): boolean {
  if (value === undefined) return false;
  return check.failWhen.op === "<" ? value < check.failWhen.value : value > check.failWhen.value;
}
