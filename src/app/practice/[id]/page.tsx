import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PracticeRunner } from "@/components/session/practice-runner";
import { EXERCISES, findExercise } from "@/lib/data/exercises";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: PageProps<"/practice/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Practise ${findExercise(id)?.name ?? "move"}` };
}

export default async function PracticePage({ params }: PageProps<"/practice/[id]">) {
  const { id } = await params;
  if (!findExercise(id)) notFound();
  return <PracticeRunner id={id} />;
}
