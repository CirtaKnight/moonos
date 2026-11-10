/**
 * Lunar Drift — steer a crescent along the horizon, catch falling stardust,
 * dodge meteors. Pure game state + step function (rendering lives in the app).
 * Coordinates are normalised: the field is 1 wide and 1 tall.
 */

export type BodyKind = "dust" | "orb" | "meteor";

export interface Body {
  id: number;
  kind: BodyKind;
  x: number;
  y: number;
  vy: number;
  r: number;
}

export interface GameState {
  status: "ready" | "playing" | "over";
  t: number;
  playerX: number;
  bodies: Body[];
  score: number;
  lives: number;
  spawnIn: number;
  nextId: number;
  /** Seconds of invulnerability after a hit. */
  shield: number;
  /** Short-lived flashes for catches / hits, for the renderer. */
  events: { kind: "catch" | "hit" | "bonus"; x: number; y: number; age: number }[];
}

export const PLAYER_Y = 0.9;
export const PLAYER_HALF_W = 0.07;
const PLAYER_SPEED = 1.1; // field widths per second

export function newGame(status: GameState["status"] = "ready"): GameState {
  return { status, t: 0, playerX: 0.5, bodies: [], score: 0, lives: 3, spawnIn: 0.4, nextId: 1, shield: 0, events: [] };
}

/** Difficulty ramps with time: faster falls and denser spawns. */
export function difficulty(t: number) {
  const level = Math.min(t / 60, 1);
  return {
    fallSpeed: 0.28 + level * 0.42,
    spawnEvery: 0.7 - level * 0.4,
    meteorChance: 0.22 + level * 0.23,
  };
}

export interface Input {
  /** -1 left, 0 none, 1 right */
  dir: number;
  /** Absolute target x from pointer/touch, overrides dir. */
  targetX?: number | null;
}

export function step(state: GameState, dt: number, input: Input, rand: () => number = Math.random): GameState {
  if (state.status !== "playing") return state;
  const s: GameState = { ...state, bodies: [...state.bodies], events: state.events.map((e) => ({ ...e, age: e.age + dt })).filter((e) => e.age < 0.5) };
  s.t += dt;
  s.shield = Math.max(0, s.shield - dt);

  // Player movement
  if (input.targetX != null) {
    const delta = input.targetX - s.playerX;
    const maxMove = PLAYER_SPEED * 1.6 * dt;
    s.playerX += Math.max(-maxMove, Math.min(maxMove, delta));
  } else {
    s.playerX += input.dir * PLAYER_SPEED * dt;
  }
  s.playerX = Math.max(PLAYER_HALF_W, Math.min(1 - PLAYER_HALF_W, s.playerX));

  // Spawning
  const d = difficulty(s.t);
  s.spawnIn -= dt;
  if (s.spawnIn <= 0) {
    const roll = rand();
    const kind: BodyKind = roll < d.meteorChance ? "meteor" : roll > 0.96 ? "orb" : "dust";
    s.bodies.push({
      id: s.nextId++,
      kind,
      x: 0.05 + rand() * 0.9,
      y: -0.05,
      vy: d.fallSpeed * (kind === "meteor" ? 1.15 : 1) * (0.85 + rand() * 0.3),
      r: kind === "meteor" ? 0.035 : kind === "orb" ? 0.03 : 0.02,
    });
    s.spawnIn = d.spawnEvery * (0.7 + rand() * 0.6);
  }

  // Motion + collisions
  const kept: Body[] = [];
  for (const b of s.bodies) {
    const y = b.y + b.vy * dt;
    const caught = Math.abs(y - PLAYER_Y) < b.r + 0.02 && Math.abs(b.x - s.playerX) < PLAYER_HALF_W + b.r;
    if (caught) {
      if (b.kind === "meteor") {
        if (s.shield <= 0) {
          s.lives -= 1;
          s.shield = 1.2;
          s.events.push({ kind: "hit", x: b.x, y, age: 0 });
        }
      } else {
        s.score += b.kind === "orb" ? 5 : 1;
        s.events.push({ kind: b.kind === "orb" ? "bonus" : "catch", x: b.x, y, age: 0 });
      }
      continue;
    }
    if (y < 1.1) kept.push({ ...b, y });
  }
  s.bodies = kept;
  if (s.lives <= 0) s.status = "over";
  return s;
}
