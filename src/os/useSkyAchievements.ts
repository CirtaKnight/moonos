"use client";

import { useEffect } from "react";
import { moonPhase } from "./lib/moon";
import { unlock } from "./store/achievements";

/** Time-and-sky based secrets: visiting late at night, or under a full moon. */
export function useSkyAchievements() {
  useEffect(() => {
    const t = setTimeout(() => {
      const now = new Date();
      if (now.getHours() < 5) unlock("night-owl");
      if (Math.abs(moonPhase(now) - 0.5) < 0.034) unlock("full-moon");
    }, 4000);
    return () => clearTimeout(t);
  }, []);
}
