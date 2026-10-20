@AGENTS.md

# CLAUDE.md — Spotter

## Project overview

Spotter is an 8-week home workout app with two plans, chosen at onboarding from the user's gender (and switchable in Settings):

- **shape**: glutes, thighs, chest/bust and waist. Bodyweight only. Day ids `w1-a` … (kept from v1 so saved history stays valid).
- **ppl**: Push / Pull / Legs / Arms & shoulders for muscle gain. Needs dumbbells (weight is logged per set); pull-up bar from week 3. Day ids `ppl-w1-a` ….

The phone's camera counts reps and gives spoken form cues using an on-device pose model.

It is **fully client-side**: a Next.js static export hosted on Vercel, with all data in the browser's IndexedDB. There is no server, no account, and camera video never leaves the device.

## Architecture

- Framework: Next.js 16 App Router with `output: "export"` (see next.config.ts). Every route is prerendered at build time; dynamic routes need `generateStaticParams`.
- UI: TypeScript, Tailwind CSS v4, lucide-react icons, `cn()` from `src/lib/utils.ts`.
- Vision: `@mediapipe/tasks-vision` Pose Landmarker (33 body landmarks per frame) running in the browser via WASM + WebGL.
- Storage: Dexie (IndexedDB) in `src/lib/db.ts`, read in components with `useLiveQuery`.
- Validation: Zod schemas in `src/lib/db.ts` for stored records and backup import.
- Tests: Vitest for the pure logic (`npm test`).

## How the vision pipeline fits together

```text
camera → usePoseCamera (components/coach)   one landmarker, rAF loop, skeleton drawing
       → MotionTracker.update (lib/pose)    pure state machine: reps, holds, form cues
       → CoachPanel                          spoken cues, range arc, counts → SetLog
```

- `lib/pose/geometry.ts`: aspect-corrected 2D angles over normalized landmarks.
- `lib/pose/metrics.ts`: named metrics (knee, hip, elbow, bodyLine, torsoLean, kneeTrack…).
- `lib/pose/tracker.ts`: rep state machine (rest → moving → peak → rest) with smoothing, a "ready" gate, partial-rep detection, per-rep form checks and hold timing.
- Per-exercise thresholds live in `lib/data/exercises.ts` under `tracking`. Tuning a move means editing its `restAt` / `peakAt` / `checks` there, not touching the tracker.
- The WASM runtime is copied from node_modules into `public/mediapipe/wasm` by `scripts/copy-mediapipe.mjs` (runs on predev/prebuild, gitignored). Models are committed in `public/models/`.

## Exercise illustrations

Each move has a start and finish pose in `lib/data/illustrations.ts`. Only hips, shoulders, hands and feet are placed by hand. `lib/figure.ts` solves elbows and knees with two-bone IK so proportions stay consistent. `components/figure/` renders them: `MoveThumb` for lists, `MoveFrame` for stills, and `MoveAnimation` for the looping tutorial (autoplays unless reduced motion is on, then waits for Play). The primary-colour ring marks the joint the camera measures. `figure.test.ts` checks that every exercise has a pose and nothing goes through the floor. Coordinates: floor at y = 0, y up, side views face +x.

## Key directories

```text
src/app/(main)/       tabbed pages: Today, Plan, Moves, Progress, Settings, Science
src/app/session/      full-screen workout runner (one static page per program day)
src/app/practice/     try one move with the camera, nothing logged
src/components/coach/ camera hook, range arc, coach panel
src/components/session/ session runner, practice runner, wake lock
src/components/figure/  exercise pictograms (thumbnail, still, animation)
src/lib/data/         exercises and the 8-week program builder
src/lib/pose/         geometry, metrics, motion tracker (pure + tested)
```

## Conventions

- Keep tracking logic pure and in `lib/pose`; components only wire camera, speech and UI to it. Add a test in `tracker.test.ts` for any state-machine change.
- Program rules (plans, phases, progression, weekly balance) live in `lib/data/program.ts`, guarded by `program.test.ts`. Exercises are tagged with body `areas`; plans can relabel an area (e.g. legs → "Thighs") via `areaLabels`.
- Profiles saved before `gender`/`plan` existed are upgraded by the Zod defaults in `profileSchema`. Always read profiles through `useProfile`/`getProfile`, never raw from Dexie.
- Theme tokens are CSS variables on `:root` mapped through one `@theme inline` block in `globals.css`. Use semantic utilities (`bg-primary`, `text-muted`, `bg-stage`). The workout "stage" is always dark.
- Copy is plain, second person, and honest about what training can and can't change (see `/science`). Don't promise breast growth or spot reduction.
- No server features: no route handlers that read requests, server actions, cookies or middleware. They break the static export.

## Commands

```bash
npm run dev        # dev server (copies the MediaPipe WASM first)
npm run build      # static export to out/
npm start          # serve out/ locally
npm test           # vitest
npm run typecheck
npm run lint
```

## Deployment

Import the repo into Vercel. No environment variables are needed. Vercel detects the static export. `vercel.json` adds long cache headers for the models and a `Permissions-Policy` that allows the camera. The camera requires HTTPS, which Vercel provides (localhost also works in development).

## Known limitations

- Rep thresholds are first estimates from joint biomechanics and haven't been tuned against real footage yet. Expect to adjust `restAt`/`peakAt` per move after testing.
- Fire hydrants, clamshells, dead bugs, bird dogs, bicycle crunches, supermen, reverse snow angels and timed static moves are counted by hand. One camera can't measure them reliably.
- Data lives in one browser. Clearing site data erases it; Settings → Export backup is the only way to move it.
