"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "portal-tour-seen";

/**
 * §4.4 "vídeo curto de 2 min ou walkthrough no primeiro acesso" — "seen the
 * tour" state lives in localStorage, not a backend flag, so there is no
 * server dependency. Not BLOCKED — this is the one Fase 6 task that ships
 * fully client-side today. If product later wants the flag to survive a
 * device switch, that's a small follow-up to move this into ClientProfile.
 */
export function useFirstAccessTour() {
  const [shouldShow, setShouldShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== "true";
  });

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShouldShow(false);
  }, []);

  return { shouldShow, dismiss };
}
