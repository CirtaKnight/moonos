const SYNODIC_MONTH = 29.530588853; // days
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // 2000-01-06 18:14 UTC
const DAY_MS = 86_400_000;

/** Moon phase in [0, 1): 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. */
export function moonPhase(date: Date = new Date()): number {
  const days = (date.getTime() - KNOWN_NEW_MOON) / DAY_MS;
  const phase = (days / SYNODIC_MONTH) % 1;
  return phase < 0 ? phase + 1 : phase;
}

const NAMES = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
] as const;

export function moonPhaseName(phase: number): (typeof NAMES)[number] {
  return NAMES[Math.round(phase * 8) % 8];
}

/** Fraction of the disc that is lit, 0..1. */
export function moonIllumination(phase: number): number {
  return (1 - Math.cos(phase * 2 * Math.PI)) / 2;
}
