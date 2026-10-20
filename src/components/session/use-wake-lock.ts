"use client";

import { useEffect } from "react";

/** Keep the screen on while she's working out across the room. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // Denied (e.g. low battery mode). The workout still works, the screen may just dim.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible" && !released) acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
