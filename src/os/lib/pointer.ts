"use client";

/**
 * One global pointer tracker shared by the cursor, the starfield and the screensaver,
 * so we attach a single listener no matter how many consumers there are.
 * `nx`/`ny` are normalised to [-1, 1] from the viewport centre. On phones, device tilt
 * feeds the same values (when the browser allows it without a permission prompt).
 */
export const pointer = {
  x: -100,
  y: -100,
  nx: 0,
  ny: 0,
  /** Last time the pointer moved (ms), used for idle detection. */
  movedAt: 0,
  inside: false,
};

let refs = 0;

function onMove(e: PointerEvent) {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
  pointer.movedAt = performance.now();
  pointer.inside = true;
}

function onLeave() {
  pointer.inside = false;
}

function onTilt(e: DeviceOrientationEvent) {
  if (e.gamma == null || e.beta == null) return;
  pointer.nx = Math.max(-1, Math.min(1, e.gamma / 30));
  pointer.ny = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
}

/** Start tracking; returns a release function. Reference counted. */
export function trackPointer(): () => void {
  if (typeof window === "undefined") return () => {};
  if (refs++ === 0) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onTilt, { passive: true });
  }
  return () => {
    if (--refs === 0) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    }
  };
}

/** Small deterministic PRNG (mulberry32) so star layouts are stable across renders. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
