import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionRunner } from "@/components/session/session-runner";
import { findDay, PROGRAM } from "@/lib/data/program";

export function generateStaticParams() {
  return PROGRAM.map((d) => ({ dayId: d.id }));
}

export async function generateMetadata({ params }: PageProps<"/session/[dayId]">): Promise<Metadata> {
  const { dayId } = await params;
  const day = findDay(dayId);
  return { title: day ? `Week ${day.week}: ${day.title}` : "Session" };
}

export default async function SessionPage({ params }: PageProps<"/session/[dayId]">) {
  const { dayId } = await params;
  if (!findDay(dayId)) notFound();
  return <SessionRunner dayId={dayId} />;
}
