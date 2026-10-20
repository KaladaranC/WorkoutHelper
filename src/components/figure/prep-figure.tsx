import { ILLUSTRATIONS, PREP_ILLUSTRATIONS } from "@/lib/data/illustrations";
import { bounds, HEAD_R, resolveIllustration, type Box, type Frame, type Illustration, type Pt } from "@/lib/figure";

// Warm-up and cool-down moves drawn as line sketches, unlike the solid
// pictograms used for working sets: the start position is a dashed ghost, the
// finish is a fine line, and an arrow (or a ring, for circling moves) shows
// the path. Stretches are a single held outline. Static, so nothing to pause.

const PAD = 9;

export function prepIllustration(id: string): Illustration | undefined {
  return PREP_ILLUSTRATIONS[id] ?? ILLUSTRATIONS[id];
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** The point that travels furthest between start and finish: what the arrow follows. */
function mover(a: Frame, b: Frame): [Pt, Pt] {
  const pairs: [Pt, Pt][] = [
    [a.near.wrist, b.near.wrist],
    [a.near.ankle, b.near.ankle],
    [a.far.wrist, b.far.wrist],
    [a.far.ankle, b.far.ankle],
    [a.near.knee, b.near.knee],
    [a.hip, b.hip],
    [a.head, b.head],
  ];
  return pairs.reduce((best, p) => (dist(p[0], p[1]) > dist(best[0], best[1]) ? p : best));
}

export function PrepFigure({ id, title, className }: { id: string; title: string; className?: string }) {
  const ill = prepIllustration(id);
  if (!ill) return null;
  const { start, end } = resolveIllustration(ill);
  const moving = ill.end !== undefined;
  const box: Box = bounds(moving ? [start, end] : [end], ill.props);
  const w = box.maxX - box.minX + PAD * 2;
  const h = box.maxY - box.minY + PAD * 2;
  const X = (x: number) => x - box.minX + PAD;
  const Y = (y: number) => box.maxY - y + PAD;
  const P = (p: Pt) => `${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`;

  return (
    <svg viewBox={`0 0 ${w.toFixed(1)} ${h.toFixed(1)}`} className={className} role="img" aria-label={title}>
      <path
        d={`M${X(box.minX - PAD)},${Y(0) + 1}H${X(box.maxX + PAD)}`}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="1 3"
        strokeLinecap="round"
        opacity={0.5}
      />
      {ill.props?.map((p, i) =>
        p.kind === "wall" ? (
          <path key={i} d={`M${X(p.x)},${Y(0)}V${Y(110)}`} stroke="currentColor" strokeWidth={1.5} opacity={0.4} />
        ) : null,
      )}
      {moving && <Sketch frame={start} P={P} ghost />}
      <Sketch frame={end} P={P} />
      {moving && <Motion from={start} to={end} loop={ill.loop} P={P} />}
    </svg>
  );
}

function Sketch({ frame, P, ghost = false }: { frame: Frame; P: (p: Pt) => string; ghost?: boolean }) {
  const chain = (...pts: Pt[]) => `M${pts.map(P).join("L")}`;
  const limbs = (l: Frame["near"]) => (
    <>
      <path d={chain(l.hip, l.knee, l.ankle, l.toe)} />
      <path d={chain(l.shoulder, l.elbow, l.wrist)} />
    </>
  );
  const front = frame.view === "front";
  const [hx, hy] = P(frame.head).split(",").map(Number);
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={ghost ? 1.6 : 2.6}
      strokeDasharray={ghost ? "2.5 3" : undefined}
      opacity={ghost ? 0.45 : 1}
    >
      <g opacity={front || ghost ? 1 : 0.4}>{limbs(frame.far)}</g>
      {front ? (
        <path d={`${chain(frame.near.hip, frame.near.shoulder, frame.far.shoulder, frame.far.hip)}Z`} />
      ) : (
        <path d={chain(frame.hip, frame.shoulder)} />
      )}
      {limbs(frame.near)}
      <circle cx={hx} cy={hy} r={HEAD_R - 0.5} />
      {!ghost &&
        [frame.near.knee, frame.near.elbow, frame.hip].map((p, i) => {
          const [x, y] = P(p).split(",").map(Number);
          return <circle key={i} cx={x} cy={y} r={1.6} fill="currentColor" stroke="none" />;
        })}
    </g>
  );
}

function Motion({ from, to, loop, P }: { from: Frame; to: Frame; loop?: boolean; P: (p: Pt) => string }) {
  const [a, b] = mover(from, to);
  const d = dist(a, b);
  if (d < 3) return null;
  const xy = (p: Pt) => P(p).split(",").map(Number) as Pt;
  const head = (tip: Pt, dir: Pt) => {
    // dir is in screen space; a small open chevron at the tip.
    const l = Math.hypot(dir[0], dir[1]) || 1;
    const u: Pt = [dir[0] / l, dir[1] / l];
    const n: Pt = [-u[1], u[0]];
    const s = 4.2;
    return `M${tip[0] - u[0] * s + n[0] * s * 0.7},${tip[1] - u[1] * s + n[1] * s * 0.7}L${tip[0]},${tip[1]}L${tip[0] - u[0] * s - n[0] * s * 0.7},${tip[1] - u[1] * s - n[1] * s * 0.7}`;
  };

  if (loop) {
    const c = xy([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    const r = Math.max(d / 2 + 3, 7);
    const ang = (t: number) => [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)] as Pt;
    const t0 = -Math.PI * 0.35;
    const t1 = Math.PI * 1.35;
    const p0 = ang(t0);
    const p1 = ang(t1);
    const tangent: Pt = [-Math.sin(t1), Math.cos(t1)];
    return (
      <g fill="none" stroke="var(--prep-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${p0[0]},${p0[1]}A${r},${r} 0 1 1 ${p1[0]},${p1[1]}`} />
        <path d={head(p1, tangent)} />
      </g>
    );
  }

  // A gentle curve from start to finish, bowed away from the body.
  const A = xy(a);
  const B = xy(b);
  const mid: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const n: Pt = [-(B[1] - A[1]) / len, (B[0] - A[0]) / len];
  const body = xy(to.hip);
  const bow = len * 0.28;
  const c1: Pt = [mid[0] + n[0] * bow, mid[1] + n[1] * bow];
  const c2: Pt = [mid[0] - n[0] * bow, mid[1] - n[1] * bow];
  const ctrl = dist(c1, body) > dist(c2, body) ? c1 : c2;
  // Trim both ends so the arrow sits beside the joints rather than on them.
  const trim = (p: Pt, toward: Pt, by: number): Pt => {
    const l = dist(p, toward) || 1;
    return [p[0] + ((toward[0] - p[0]) / l) * by, p[1] + ((toward[1] - p[1]) / l) * by];
  };
  const s = trim(A, ctrl, 4);
  const e = trim(B, ctrl, 4);
  return (
    <g fill="none" stroke="var(--prep-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${s[0]},${s[1]}Q${ctrl[0]},${ctrl[1]} ${e[0]},${e[1]}`} />
      <path d={head(e, [e[0] - ctrl[0], e[1] - ctrl[1]])} />
    </g>
  );
}
