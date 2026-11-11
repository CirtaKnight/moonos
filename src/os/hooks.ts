"use client";

import { useSyncExternalStore } from "react";

/** Current time, ticking every `intervalMs`. Returns null during SSR / before hydration. */
export function useNow(intervalMs = 1000): Date | null {
  return useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, intervalMs);
      return () => clearInterval(id);
    },
    () => currentTick(intervalMs),
    () => null,
  );
}

// Cache one Date per (interval, tick) so getSnapshot returns a stable value between renders.
const cache = new Map<number, { key: number; date: Date }>();
function currentTick(intervalMs: number) {
  const key = Math.floor(Date.now() / intervalMs);
  const hit = cache.get(intervalMs);
  if (hit && hit.key === key) return hit.date;
  const date = new Date();
  cache.set(intervalMs, { key, date });
  return date;
}

/** Subscribe to a CSS media query. Server snapshot is `fallback`. */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

export function useViewport(): { w: number; h: number } | null {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => viewportSnapshot(),
    () => null,
  );
}

let vp: { w: number; h: number } | null = null;
function viewportSnapshot() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!vp || vp.w !== w || vp.h !== h) vp = { w, h };
  return vp;
}

/**
 * Some hosts inject a fixed badge in the bottom-right corner (Netlify's free plan shows a
 * "Powered by Netlify" badge that can't be hidden). This reports the space to keep clear so
 * our own bottom bars never sit underneath it.
 */
export const HOST_BADGE = { w: 190, h: 56 };

export function useHostBadge(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mo = new MutationObserver(cb);
      mo.observe(document.body, { childList: true });
      return () => mo.disconnect();
    },
    () => !!document.getElementById("nl-badge-frame"),
    () => false,
  );
}
