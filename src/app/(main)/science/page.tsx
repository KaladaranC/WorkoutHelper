import type { Metadata } from "next";

export const metadata: Metadata = { title: "Why this plan works" };

const GOALS = [
  {
    title: "Bust",
    can: "Build the chest muscles (pectorals) that sit underneath breast tissue. A stronger chest and an upright posture make the bust sit higher and look fuller.",
    cant: "Breasts are mostly fat and glandular tissue, not muscle, so no exercise increases cup size. Their size depends mainly on genetics, hormones and body weight.",
    how: "Push-up progressions from incline to knees to full, plus wall angels and reverse snow angels for an open upper back.",
  },
  {
    title: "Waist",
    can: "Lose fat overall through regular training and a modest calorie deficit, and build a strong deep core so your stomach stays flatter and better supported.",
    cant: "Spot reduction doesn't work. Thousands of crunches don't burn fat from the stomach specifically, and studies of targeted ab training found no local fat loss. Where you lose fat first is largely genetic.",
    how: "Cardio-style circuits, full-body strength work and deep-core moves (planks, dead bugs, vacuums) in every session. Building glutes and hips also makes the waist look smaller in comparison.",
  },
  {
    title: "Glutes",
    can: "Glutes respond well to training. Bridges and hip thrusts load them through full hip extension, and side-glute work (leg raises, fire hydrants) rounds out the upper hip.",
    cant: "Bodyweight alone eventually stops being enough. After 8 weeks, adding a resistance band or dumbbells is the next step.",
    how: "Glutes are trained in three of four sessions, progressing from two legs to one leg, from floor to couch, and to slower tempos.",
  },
  {
    title: "Thighs",
    can: "Squats, lunges and split squats firm the quads, inner thighs and hamstrings. Toned thighs come from muscle plus overall fat loss.",
    cant: "Like the waist, you can't choose to lose fat from your thighs specifically.",
    how: "A squat pattern and a single-leg pattern in every lower-body day, plus hip hinges for the backs of the thighs.",
  },
];

const SOURCES = [
  { label: "Glute EMG: bridge with hip adduction raises glute max activity", href: "https://blog.webexercises.com/?p=659" },
  { label: "Single-leg banded bridge EMG study (2023)", href: "https://doaj.org/article/b59929fd6e024e3b8f66925b4afa6c68" },
  { label: "Glute bridge vs hip thrust", href: "https://barbend.com/glute-bridge-vs-hip-thrust/" },
  { label: "Hip thrusts rank highest for glute max activation", href: "https://www.mendcolorado.com/physical-therapy-blog/2023/4/4/what-are-the-best-exercises-for-gluteus-maximus/" },
  { label: "Do push-ups make your breasts bigger?", href: "https://livestrong.com/article/389605-do-push-ups-make-your-breasts-bigger" },
  { label: "What chest exercises do to the appearance of breasts", href: "https://cathe.com/what-impact-do-chest-exercises-have-on-the-appearance-of-your-breasts/" },
  { label: "Spot reduction: overview of the evidence", href: "https://www.wikipedia.org/wiki/Spot_reduction" },
  { label: "Is spot reduction a myth?", href: "https://www.bulknutrients.com.au/blog/weight-loss/is-spot-reduction-actually-a-myth" },
  { label: "Strength plan structure: non-consecutive days, gradual load", href: "https://fitnessista.com/wp-content/uploads/2026/05/strength-plan-for-women-over-35.pdf" },
  { label: "Dose-response of weekly training volume and muscle growth (Schoenfeld et al., meta-analysis)", href: "https://researchgate.net/profile/Brad-Schoenfeld/publication/305455324_Dose-response_relationship_between_weekly_resistance_training_volume_and_increases_in_muscle_mass_A_systematic_review_and_meta-analysis/links/59dc0269458515e9ab4527d6/Dose-response-relationship-between-weekly-resistance-training-volume-and-increases-in-muscle-mass-A-systematic-review-and-meta-analysis.pdf" },
  { label: "Evidence-based guidelines for training volume (Sports, 2018)", href: "https://dx.doi.org/10.3390/sports6010007" },
  { label: "Rep ranges for muscle growth: closeness to failure matters most", href: "https://mennohenselmans.com/the-optimal-rep-range-for-muscle-growth-isnt-what-you-think/" },
  { label: "Light vs heavy loads for hypertrophy", href: "https://fitnessvolt.com/light-vs-heavy-hypertrophy-training/" },
  { label: "MediaPipe Pose Landmarker (the on-device vision model)", href: "https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js" },
];

const PPL_POINTS = [
  {
    title: "Each muscle twice a week",
    body: "Studies comparing training frequency found twice a week builds more muscle than once. Push, Pull and Legs train their muscles directly, and the Arms & shoulders day hits triceps, biceps and delts a second time. Romanian deadlifts on Pull day give your legs a second session too.",
  },
  {
    title: "About 10 or more hard sets per muscle",
    body: "Muscle growth rises with weekly sets, with clear evidence up to around 10 sets per muscle per week. The plan starts near that and climbs through Build and Strength.",
  },
  {
    title: "Close to failure, any rep range",
    body: "Sets of roughly 6 to 30 reps all build muscle when they finish close to failure. At home that's the point: lighter dumbbells still work if the last reps are hard. Stop each set with 1–2 reps left in the tank.",
  },
  {
    title: "Add weight when it gets easy",
    body: "Log the dumbbell weight for each set. When you hit the top of the rep target on every set, go up a step next session. The Strength table on Progress shows how far you've come.",
  },
];

export default function SciencePage() {
  return (
    <article className="flex flex-col gap-12">
      <header className="pt-4">
        <h1 className="font-scoreboard text-[clamp(3rem,12vw,4.75rem)] font-extrabold uppercase">Why this plan works</h1>
        <p className="mt-4 max-w-[60ch] text-lg">
          Training can change a lot about your body, but not everything the internet promises. Here is what each plan
          can change and what it can&apos;t, so you know what to expect.
        </p>
      </header>

      <h2 className="-mb-6 text-sm font-semibold text-muted">Glutes, thighs, chest &amp; waist plan</h2>

      {GOALS.map((g) => (
        <section key={g.title} aria-labelledby={`g-${g.title}`} className="grid gap-4 sm:grid-cols-[9rem_1fr]">
          <h2 id={`g-${g.title}`} className="font-scoreboard text-4xl font-bold uppercase">{g.title}</h2>
          <dl className="flex max-w-[62ch] flex-col gap-4">
            <div>
              <dt className="text-sm font-semibold text-good">What training changes</dt>
              <dd className="mt-1">{g.can}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-warn">What it doesn&apos;t</dt>
              <dd className="mt-1">{g.cant}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">In this plan</dt>
              <dd className="mt-1">{g.how}</dd>
            </div>
          </dl>
        </section>
      ))}

      <section aria-labelledby="ppl" className="max-w-[62ch]">
        <h2 id="ppl" className="font-scoreboard text-4xl font-bold uppercase">Push / Pull / Legs plan</h2>
        <p className="mt-3">
          The muscle-building plan follows the most consistent findings in strength research. It needs a pair of
          dumbbells, and a pull-up bar from week 3 (rows under a sturdy table work if you don&apos;t have one).
        </p>
        <dl className="mt-5 flex flex-col gap-4">
          {PPL_POINTS.map((p) => (
            <div key={p.title}>
              <dt className="font-semibold">{p.title}</dt>
              <dd className="mt-1 text-muted">{p.body}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">
          What it doesn&apos;t change: you can&apos;t burn fat from one spot, and visible abs depend on overall body fat
          more than on ab exercises.
        </p>
      </section>

      <section aria-labelledby="camera" className="max-w-[62ch]">
        <h2 id="camera" className="font-scoreboard text-4xl font-bold uppercase">How the camera counts</h2>
        <p className="mt-3">
          A pose model (Google&apos;s MediaPipe Pose Landmarker) finds 33 points on your body in every video frame, right
          on your phone. Spotter measures the angle at the joint that matters for each move, such as your knee in a squat
          or your hip in a bridge. A rep counts only when that angle travels from the start position to full range and
          back. Half reps are flagged rather than counted, and checks like torso lean or knees caving produce the spoken
          cues.
        </p>
        <p className="mt-3 text-muted">
          It&apos;s a coach, not a judge. Lighting, baggy clothes and camera angle all affect accuracy, so you can always
          switch to counting by hand.
        </p>
      </section>

      <section aria-labelledby="safety" className="max-w-[62ch]">
        <h2 id="safety" className="font-scoreboard text-4xl font-bold uppercase">Train safely</h2>
        <p className="mt-3">
          Check with a doctor before starting if you&apos;re pregnant, postpartum, or have a heart condition or an injury.
          Muscle soreness is normal. Sharp joint pain is not, so stop that move and switch to its easier version.
        </p>
      </section>

      <section aria-labelledby="sources">
        <h2 id="sources" className="font-scoreboard text-4xl font-bold uppercase">Sources</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-4 hover:decoration-foreground">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
