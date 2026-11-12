"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSettings } from "./store/settings";

const supported = () => typeof document !== "undefined" && !!document.fullscreenEnabled && !!document.documentElement.requestFullscreen;

export function enterFullscreen() {
  if (!supported() || document.fullscreenElement) return;
  document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {
    /* refused (no user gesture, or the browser said no): stay windowed */
  });
}

export function exitFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

export function toggleFullscreen() {
  if (document.fullscreenElement) exitFullscreen();
  else enterFullscreen();
}

/** Whether the page is fullscreen right now, and whether this browser can do it at all. */
export function useFullscreen(): { active: boolean; supported: boolean } {
  const active = useSyncExternalStore(
    (cb) => {
      document.addEventListener("fullscreenchange", cb);
      return () => document.removeEventListener("fullscreenchange", cb);
    },
    () => !!document.fullscreenElement,
    () => false,
  );
  const can = useSyncExternalStore(
    () => () => {},
    supported,
    () => false,
  );
  return { active, supported: can };
}

/**
 * Fullscreen by default. Browsers only allow it right after a click or key press, so the
 * first one (usually the press that skips the boot) does it. Once per page load: if the
 * visitor leaves with Esc, it isn't forced on them again.
 */
export function useAutoFullscreen() {
  useEffect(() => {
    if (!supported()) return;
    const go = (e: Event) => {
      // Escape and shortcuts don't count as a user gesture; wait for a real one.
      if (e instanceof KeyboardEvent && (e.key === "Escape" || e.ctrlKey || e.metaKey || e.altKey)) return;
      // The boot screen's recruiter link leaves the OS: don't go fullscreen for it.
      if ((e.target as Element | null)?.closest?.("[data-quick-view]")) return;
      stop();
      if (useSettings.getState().fullscreen) enterFullscreen();
    };
    const stop = () => {
      window.removeEventListener("pointerup", go, true);
      window.removeEventListener("keydown", go, true);
    };
    window.addEventListener("pointerup", go, true);
    window.addEventListener("keydown", go, true);
    return stop;
  }, []);
}
