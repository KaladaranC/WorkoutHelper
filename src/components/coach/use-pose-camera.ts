"use client";

import { useEffect, useRef, useState } from "react";
import type { Pose } from "@/lib/pose/geometry";
import { loadLandmarker, type ModelSize } from "@/lib/pose/landmarker";

export type CameraState = "loading" | "running" | "denied" | "unsupported" | "error";

export type Tone = "neutral" | "good" | "warn";

type Options = {
  enabled: boolean;
  model: ModelSize;
  /** Called once per processed frame; return the tone to draw the skeleton in. */
  onFrame: (pose: Pose | null, aspect: number, now: number) => Tone;
};

// Skeleton edges between MediaPipe landmark indices (face omitted on purpose).
const EDGES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32],
];

const TONE_COLOR: Record<Tone, string> = {
  neutral: "rgba(243, 241, 247, 0.85)",
  good: "#4fd18b",
  warn: "#ffad4d",
};

export function usePoseCamera({ enabled, model, onFrame }: Options) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFrameRef = useRef(onFrame);
  const [state, setState] = useState<CameraState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let raf = 0;

    async function start() {
      setState("loading");
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unsupported");
        return;
      }
      try {
        const [landmarker, media] = await Promise.all([
          loadLandmarker(model),
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          }),
        ]);
        stream = media;
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = media;
        await video.play();
        if (cancelled) return;
        setState("running");

        let lastVideoTime = -1;
        const loop = () => {
          if (cancelled) return;
          raf = requestAnimationFrame(loop);
          if (video.readyState < 2 || video.currentTime === lastVideoTime) return;
          lastVideoTime = video.currentTime;
          const now = performance.now();
          const result = landmarker.detectForVideo(video, now);
          const pose = (result.landmarks[0] as Pose | undefined) ?? null;
          const aspect = video.videoWidth / video.videoHeight || 1;
          const tone = onFrameRef.current(pose, aspect, now);
          draw(canvasRef.current, video, pose, tone);
        };
        loop();
      } catch (e) {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setState("denied");
        } else {
          setState("error");
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled, model]);

  return { videoRef, canvasRef, state, error };
}

function draw(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, pose: Pose | null, tone: Tone) {
  if (!canvas) return;
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  if (!pose) return;

  const color = TONE_COLOR[tone];
  const unit = Math.max(w, h) / 200;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = unit * 1.6;
  for (const [a, b] of EDGES) {
    const p = pose[a];
    const q = pose[b];
    if ((p.visibility ?? 0) < 0.4 || (q.visibility ?? 0) < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(p.x * w, p.y * h);
    ctx.lineTo(q.x * w, q.y * h);
    ctx.stroke();
  }
  ctx.fillStyle = "#0e0d12";
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    const p = pose[i];
    if ((p.visibility ?? 0) < 0.4) continue;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, unit * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = unit * 0.8;
    ctx.stroke();
  }
}
