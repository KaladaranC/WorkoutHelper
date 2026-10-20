"use client";

import { useEffect } from "react";
import { useProfile } from "@/lib/hooks";

/** Puts the user's plan on <html> so the whole app picks up that plan's colours. */
export function PlanTheme() {
  const profile = useProfile();
  useEffect(() => {
    if (profile) document.documentElement.dataset.plan = profile.plan;
    else delete document.documentElement.dataset.plan;
  }, [profile]);
  return null;
}
