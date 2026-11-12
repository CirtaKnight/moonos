"use client";

import { useMediaQuery } from "./hooks";
import { useSettings, type ShellLayout } from "./store/settings";

/** Big, mouse-driven screens get the taskbar; tablets (and touch laptops below it) get the dock. */
export const TASKBAR_QUERY = "(min-width: 1280px) and (pointer: fine)";

/** Same rule as useShellLayout, read once (for menus built outside React). */
export function shellLayoutNow(): ShellLayout {
  const pref = useSettings.getState().layout;
  if (pref !== "auto") return pref;
  return typeof window !== "undefined" && window.matchMedia(TASKBAR_QUERY).matches ? "taskbar" : "dock";
}

/** The layout actually shown: the visitor's choice, or the automatic pick for this screen. */
export function useShellLayout(): ShellLayout {
  const pref = useSettings((s) => s.layout);
  const big = useMediaQuery(TASKBAR_QUERY);
  if (pref !== "auto") return pref;
  return big ? "taskbar" : "dock";
}
