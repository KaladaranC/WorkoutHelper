import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, Hand } from "lucide-react";
import { MoveAnimation } from "@/components/figure/move-animation";
import { MoveFrame } from "@/components/figure/move-figure";
import { EXERCISES, findExercise, GOAL_LABEL } from "@/lib/data/exercises";
import { ILLUSTRATIONS } from "@/lib/data/illustrations";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: PageProps<"/moves/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: findExercise(id)?.name ?? "Move" };
}

export default async function MovePage({ params }: PageProps<"/moves/[id]">) {
  const { id } = await params;
  const e = findExercise(id);
  if (!e) notFound();
  const easier = e.easier ? findExercise(e.easier) : undefined;
  const harder = e.harder ? findExercise(e.harder) : undefined;
  const tracked = e.tracking.kind !== "manual";

  return (
    <article className="flex flex-col gap-9">
      <div className="pt-2">
        <Link href="/moves" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground">
          <ArrowLeft className="size-4" /> All moves
        </Link>
        <h1 className="font-scoreboard mt-4 text-[clamp(3rem,12vw,4.75rem)] font-extrabold uppercase">{e.name}</h1>
        <p className="mt-2 text-sm font-semibold text-muted">
          {e.goals.map((g) => GOAL_LABEL[g]).join(" · ")} · {e.muscles}
        </p>
        <p className="mt-4 max-w-[60ch] text-lg">{e.why}</p>
      </div>

      <section aria-labelledby="demo" className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
        <h2 id="demo" className="sr-only">Demonstration</h2>
        <MoveAnimation id={e.id} className="mx-auto h-52 max-w-md sm:h-64" />
        {ILLUSTRATIONS[e.id]?.end && (
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
            {(["start", "end"] as const).map((which) => (
              <figure key={which} className="flex flex-col items-center gap-1.5">
                <MoveFrame id={e.id} which={which} className="h-24 w-full sm:h-28" />
                <figcaption className="text-xs font-semibold text-muted">
                  {which === "start" ? "Start" : "Finish"}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        {tracked && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <span aria-hidden className="inline-block size-3 rounded-full border-2 border-primary" />
            The ring marks the joint the camera measures to count your reps.
          </p>
        )}
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="font-scoreboard text-3xl font-bold uppercase">How to do it</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2.5 pl-5 marker:font-mono marker:text-muted">
          {e.steps.map((s) => (
            <li key={s} className="max-w-[62ch] pl-1">
              {s}
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="cues">
          <h2 id="cues" className="font-scoreboard text-3xl font-bold uppercase">Say it to yourself</h2>
          <ul className="mt-3 flex flex-col gap-1.5">
            {e.cues.map((c) => (
              <li key={c} className="font-semibold">
                “{c}”
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="mistakes">
          <h2 id="mistakes" className="font-scoreboard text-3xl font-bold uppercase">Watch out for</h2>
          <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 marker:text-warn">
            {e.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="camera" className="rounded-2xl bg-stage p-5 text-stage-foreground">
        <h2 id="camera" className="flex items-center gap-2 font-semibold">
          {tracked ? <Camera className="size-5" /> : <Hand className="size-5" />}
          {tracked ? "Counted by camera" : "Counted by hand"}
        </h2>
        <p className="mt-2 max-w-[56ch] text-sm text-stage-muted">
          {e.tracking.kind === "manual" ? e.tracking.reason : e.tracking.setup}
        </p>
        <Link
          href={`/practice/${e.id}`}
          className="press mt-4 inline-flex h-11 items-center rounded-full bg-stage-foreground px-5 font-semibold text-stage"
        >
          {tracked ? "Practise with the camera" : "Practise with the counter"}
        </Link>
      </section>

      {(easier || harder) && (
        <nav aria-label="Variations" className="flex flex-wrap gap-3 text-sm">
          {easier && (
            <Link href={`/moves/${easier.id}`} className="press rounded-full border border-line px-4 py-2 hover:border-foreground/40">
              Easier: <span className="font-semibold">{easier.name}</span>
            </Link>
          )}
          {harder && (
            <Link href={`/moves/${harder.id}`} className="press rounded-full border border-line px-4 py-2 hover:border-foreground/40">
              Harder: <span className="font-semibold">{harder.name}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
