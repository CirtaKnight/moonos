/**
 * Orbit — a satellite circles the moon on one of three rings. Tap to hop to the next ring
 * outward (wrapping back to the inner ring). Debris travels the other way; touching it ends
 * the run. Score = seconds survived.
 */

export const RINGS = 3;
const SAT_SPEED = 1.6; // rad/s
const HIT_ANGLE = 0.2; // rad

export interface Debris {
  id: number;
  ring: number;
  angle: number;
  speed: number;
}

export interface OrbitState {
  status: "ready" | "playing" | "over";
  t: number;
  ring: number;
  angle: number;
  debris: Debris[];
  spawnIn: number;
  nextId: number;
  /** Seconds left of hop animation, for the renderer. */
  hop: number;
}

export function newOrbit(status: OrbitState["status"] = "ready"): OrbitState {
  return { status, t: 0, ring: 1, angle: -Math.PI / 2, debris: [], spawnIn: 1.2, nextId: 1, hop: 0 };
}

export const hop = (s: OrbitState): OrbitState => (s.status === "playing" ? { ...s, ring: (s.ring + 1) % RINGS, hop: 0.18 } : s);

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export function stepOrbit(s: OrbitState, dt: number, rand: () => number = Math.random): OrbitState {
  if (s.status !== "playing") return s;
  const n: OrbitState = { ...s, t: s.t + dt, angle: wrap(s.angle + SAT_SPEED * dt), hop: Math.max(0, s.hop - dt) };
  const level = Math.min(n.t / 45, 1);
  n.spawnIn -= dt;
  const debris = s.debris.map((d) => ({ ...d, angle: wrap(d.angle - d.speed * dt) }));
  if (n.spawnIn <= 0 && debris.length < 3 + Math.floor(level * 5)) {
    // Spawn across from the satellite so it is always reachable.
    debris.push({
      id: n.nextId++,
      ring: Math.floor(rand() * RINGS),
      angle: wrap(n.angle + Math.PI + (rand() - 0.5) * 1.2),
      speed: 0.6 + rand() * 0.6 + level * 0.8,
    });
    n.spawnIn = 1.6 - level * 0.9;
  }
  n.debris = debris;
  if (debris.some((d) => d.ring === n.ring && Math.abs(wrap(d.angle - n.angle)) < HIT_ANGLE)) n.status = "over";
  return n;
}
