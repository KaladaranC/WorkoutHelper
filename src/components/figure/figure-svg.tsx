import type { Box, Frame, Limbs, Prop, Pt } from "@/lib/figure";
import { HEAD_R } from "@/lib/figure";

// Draws one body frame as a pictogram: thick rounded strokes in currentColor,
// far-side limbs faded so depth reads at thumbnail size. Shared by the static
// thumbnails and the animated tutorial.

export type FocusJoint = "knee" | "hip" | "elbow" | "shoulder";

const PAD = 5;

export function FigureSVG({
  frame,
  box,
  props = [],
  focus,
  title,
  className,
  dumbbells = false,
}: {
  frame: Frame;
  box: Box;
  props?: Prop[];
  focus?: FocusJoint;
  title?: string;
  className?: string;
  dumbbells?: boolean;
}) {
  const w = box.maxX - box.minX + PAD * 2;
  const h = box.maxY - box.minY + PAD * 2;
  const X = (x: number) => x - box.minX + PAD;
  const Y = (y: number) => box.maxY - y + PAD;
  const P = (p: Pt) => `${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`;
  const line = (a: Pt, b: Pt) => `M${P(a)}L${P(b)}`;
  const front = frame.view === "front";
  const farShift = frame.farIsCopy ? -2.5 : 0;
  const shift = (l: Limbs): Limbs =>
    Object.fromEntries(Object.entries(l).map(([k, p]) => [k, [p[0] + farShift, p[1]]])) as Limbs;

  const limb = (l: Limbs, opacity: number) => (
    <g opacity={opacity}>
      <path d={line(l.hip, l.knee)} strokeWidth={7.5} />
      <path d={line(l.knee, l.ankle)} strokeWidth={6.5} />
      <path d={line(l.ankle, l.toe)} strokeWidth={4.5} />
      <path d={line(l.shoulder, l.elbow)} strokeWidth={6} />
      <path d={line(l.elbow, l.wrist)} strokeWidth={5} />
      {dumbbells && <Dumbbell elbow={l.elbow} wrist={l.wrist} line={line} />}
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${w.toFixed(1)} ${h.toFixed(1)}`}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g fill="currentColor" stroke="currentColor" opacity={0.3}>
        <path d={`M${X(box.minX - PAD)},${Y(0) + 1}H${X(box.maxX + PAD)}`} strokeWidth={1.5} fill="none" />
        {props.map((p, i) => (
          <PropShape key={i} prop={p} X={X} Y={Y} />
        ))}
      </g>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {limb(front ? frame.far : shift(frame.far), front ? 1 : 0.35)}
        {front ? (
          <path
            d={`M${P(frame.near.hip)}L${P(frame.near.shoulder)}L${P(frame.far.shoulder)}L${P(frame.far.hip)}Z`}
            fill="currentColor"
            strokeWidth={6}
          />
        ) : (
          <path d={line(frame.hip, frame.shoulder)} strokeWidth={10} />
        )}
        {limb(frame.near, 1)}
      </g>
      <circle cx={X(frame.head[0])} cy={Y(frame.head[1])} r={HEAD_R} fill="currentColor" />
      {focus && (
        <circle
          cx={X(frame.near[focus][0])}
          cy={Y(frame.near[focus][1])}
          r={6.5}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2.4}
        />
      )}
    </svg>
  );
}

/** A dumbbell held across the hand: handle perpendicular to the forearm, a plate at each end. */
function Dumbbell({ elbow, wrist, line }: { elbow: Pt; wrist: Pt; line: (a: Pt, b: Pt) => string }) {
  const dx = wrist[0] - elbow[0];
  const dy = wrist[1] - elbow[1];
  const len = Math.hypot(dx, dy) || 1;
  const along: Pt = [dx / len, dy / len];
  const across: Pt = [-along[1], along[0]];
  const at = (k: number, j = 0): Pt => [
    wrist[0] + along[0] * 1.5 + across[0] * k + along[0] * j,
    wrist[1] + along[1] * 1.5 + across[1] * k + along[1] * j,
  ];
  return (
    <g>
      <path d={line(at(-6), at(6))} strokeWidth={2.2} />
      <path d={line(at(-6, -3), at(-6, 3))} strokeWidth={4.5} strokeLinecap="butt" />
      <path d={line(at(6, -3), at(6, 3))} strokeWidth={4.5} strokeLinecap="butt" />
    </g>
  );
}

function PropShape({ prop, X, Y }: { prop: Prop; X: (x: number) => number; Y: (y: number) => number }) {
  if (prop.kind === "wall") {
    return <path d={`M${X(prop.x)},${Y(0)}V${Y(110)}`} strokeWidth={2.5} fill="none" />;
  }
  if (prop.kind === "bar") {
    return <path d={`M${X(prop.x)},${Y(prop.y)}H${X(prop.x + prop.w)}`} strokeWidth={3} fill="none" strokeLinecap="round" />;
  }
  if (prop.kind === "table") {
    return (
      <g fill="none" strokeLinecap="round">
        <path d={`M${X(prop.x)},${Y(prop.top)}H${X(prop.x + prop.w)}`} strokeWidth={4} />
        <path d={`M${X(prop.x + 3)},${Y(0)}V${Y(prop.top)}M${X(prop.x + prop.w - 3)},${Y(0)}V${Y(prop.top)}`} strokeWidth={2.5} />
      </g>
    );
  }
  if (prop.kind === "couch") {
    const backX = prop.back === "left" ? prop.x : prop.x + prop.w - 9;
    return (
      <g stroke="none">
        <rect x={X(prop.x)} y={Y(prop.top)} width={prop.w} height={prop.top} rx={3} opacity={0.5} />
        <rect x={X(backX)} y={Y(prop.top + 14)} width={9} height={14} rx={3} opacity={0.5} />
      </g>
    );
  }
  const backX = prop.back === "left" ? prop.x + 1.5 : prop.x + prop.w - 1.5;
  return (
    <g fill="none" strokeLinecap="round">
      <path d={`M${X(prop.x)},${Y(prop.top)}H${X(prop.x + prop.w)}`} strokeWidth={3.5} />
      <path d={`M${X(prop.x + 1.5)},${Y(0)}V${Y(prop.top)}M${X(prop.x + prop.w - 1.5)},${Y(0)}V${Y(prop.top)}`} strokeWidth={2} />
      <path d={`M${X(backX)},${Y(prop.top)}V${Y(prop.top + 22)}`} strokeWidth={2.5} />
    </g>
  );
}
