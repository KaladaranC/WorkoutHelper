"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import type { Tone } from "./use-pose-camera";

// The signature of the app: a half-circle that sweeps as her joint moves, from
// the start position on the left to full range on the right. It is driven
// imperatively at camera frame rate, so it never re-renders React.

export type ArcApi = { set: (progress: number, tone: Tone, label?: string) => void };

const R = 84;
const CX = 100;
const CY = 100;
const START = 0.2;

const TONE_STROKE: Record<Tone, string> = {
  neutral: "var(--stage-foreground)",
  good: "var(--stage-good)",
  warn: "var(--stage-warn)",
};

function point(p: number) {
  const a = Math.PI * Math.min(1, Math.max(0, p));
  return { x: CX - R * Math.cos(a), y: CY - R * Math.sin(a) };
}

export function RangeArc({
  apiRef,
  children,
  startLabel = "Start",
  endLabel = "Full range",
  showStartTick = true,
}: {
  apiRef: RefObject<ArcApi | null>;
  children?: ReactNode;
  startLabel?: string;
  endLabel?: string;
  showStartTick?: boolean;
}) {
  const fill = useRef<SVGPathElement>(null);
  const knob = useRef<SVGCircleElement>(null);
  const label = useRef<SVGTextElement>(null);

  useEffect(() => {
    apiRef.current = {
      set(progress, tone, text) {
        const p = Math.min(1, Math.max(0, progress));
        const { x, y } = point(p);
        const stroke = TONE_STROKE[tone];
        fill.current?.setAttribute("stroke-dasharray", `${p * 100} 200`);
        fill.current?.setAttribute("stroke", stroke);
        knob.current?.setAttribute("cx", String(x));
        knob.current?.setAttribute("cy", String(y));
        knob.current?.setAttribute("fill", stroke);
        if (label.current) label.current.textContent = text ?? "";
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);

  const startTick = point(START);
  const arc = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  return (
    <div className="relative w-full max-w-[22rem]">
      <svg viewBox="0 0 200 116" className="w-full overflow-visible" aria-hidden>
        <path d={arc} fill="none" stroke="rgba(243,241,247,0.18)" strokeWidth={10} strokeLinecap="round" />
        <path
          ref={fill}
          d={arc}
          fill="none"
          stroke={TONE_STROKE.neutral}
          strokeWidth={10}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="0 200"
        />
        {showStartTick && (
          <line
            x1={startTick.x}
            y1={startTick.y}
            x2={CX - (R - 18) * Math.cos(Math.PI * START)}
            y2={CY - (R - 18) * Math.sin(Math.PI * START)}
            stroke="rgba(243,241,247,0.45)"
            strokeWidth={1.5}
          />
        )}
        <line x1={CX + R - 9} y1={CY} x2={CX + R - 20} y2={CY} stroke="rgba(243,241,247,0.45)" strokeWidth={1.5} />
        <circle ref={knob} cx={CX - R} cy={CY} r={7.5} fill={TONE_STROKE.neutral} stroke="#0e0d12" strokeWidth={3} />
        <text x={CX - R} y={CY + 15} textAnchor="middle" className="fill-stage-muted text-[7px] font-medium">
          {startLabel}
        </text>
        <text x={CX + R} y={CY + 15} textAnchor="middle" className="fill-stage-muted text-[7px] font-medium">
          {endLabel}
        </text>
        <text
          ref={label}
          x={CX}
          y={CY + 13}
          textAnchor="middle"
          className="fill-stage-muted font-mono text-[7px]"
        />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-[26%] flex justify-center">{children}</div>
    </div>
  );
}
