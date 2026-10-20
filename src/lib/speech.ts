"use client";

// Spoken feedback, because she can't read the screen mid-squat from 2 m away.
// Rep counts interrupt anything still queued so the voice never lags behind.

let enabled = true;
let lastText = "";
let lastAt = 0;

export function setVoiceEnabled(on: boolean) {
  enabled = on;
  if (!on && typeof window !== "undefined") window.speechSynthesis?.cancel();
}

export function speak(text: string, opts: { interrupt?: boolean } = {}) {
  if (!enabled || typeof window === "undefined" || !window.speechSynthesis) return;
  const now = Date.now();
  // The same cue every rep becomes noise; repeat it at most every 6 s.
  if (text === lastText && now - lastAt < 6000) return;
  lastText = text;
  lastAt = now;
  if (opts.interrupt) window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05;
  window.speechSynthesis.speak(u);
}
