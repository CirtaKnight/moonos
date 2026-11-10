import { describe, expect, it } from "vitest";
import { difficulty, newGame, PLAYER_Y, step, type GameState } from "./lunarDrift";

const playing = (patch: Partial<GameState> = {}): GameState => ({ ...newGame("playing"), spawnIn: 99, ...patch });

describe("Lunar Drift", () => {
  it("does nothing until started", () => {
    const s = newGame();
    expect(step(s, 0.1, { dir: 1 })).toBe(s);
  });

  it("moves the player and clamps to the field", () => {
    let s = playing();
    for (let i = 0; i < 100; i++) s = step(s, 0.05, { dir: 1 });
    expect(s.playerX).toBeLessThan(1);
    expect(s.playerX).toBeGreaterThan(0.9);
  });

  it("catches stardust for points", () => {
    const s = step(playing({ bodies: [{ id: 1, kind: "dust", x: 0.5, y: PLAYER_Y - 0.01, vy: 0.3, r: 0.02 }] }), 0.016, { dir: 0 });
    expect(s.score).toBe(1);
    expect(s.bodies).toHaveLength(0);
  });

  it("loses a life to a meteor, then is briefly shielded", () => {
    const meteor = { id: 1, kind: "meteor" as const, x: 0.5, y: PLAYER_Y, vy: 0, r: 0.035 };
    let s = step(playing({ bodies: [meteor] }), 0.016, { dir: 0 });
    expect(s.lives).toBe(2);
    s = step({ ...s, bodies: [{ ...meteor, id: 2 }] }, 0.016, { dir: 0 });
    expect(s.lives).toBe(2);
  });

  it("ends the game when lives run out", () => {
    const s = step(playing({ lives: 1, bodies: [{ id: 1, kind: "meteor", x: 0.5, y: PLAYER_Y, vy: 0, r: 0.035 }] }), 0.016, { dir: 0 });
    expect(s.status).toBe("over");
  });

  it("spawns bodies and gets harder over time", () => {
    const s = step(playing({ spawnIn: 0 }), 0.016, { dir: 0 }, () => 0.5);
    expect(s.bodies).toHaveLength(1);
    expect(difficulty(60).fallSpeed).toBeGreaterThan(difficulty(0).fallSpeed);
    expect(difficulty(60).spawnEvery).toBeLessThan(difficulty(0).spawnEvery);
  });
});
