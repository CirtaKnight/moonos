import { describe, expect, it } from "vitest";
import { autoIndent, computeStats, SNIPPETS } from "./keystroke";
import { flip, newBoard, settle, SYMBOLS } from "./memory";
import { hop, newOrbit, RINGS, stepOrbit } from "./orbit";

describe("Keystroke", () => {
  it("computes WPM from correct characters and accuracy from keystrokes", () => {
    const target = "hello world";
    // 10 correct chars in 6 s → (10/5) / 0.1 min = 20 wpm
    expect(computeStats(target, "hello worl", 12, 2, 6000)).toEqual({ wpm: 20, accuracy: 83, correct: 10 });
    expect(computeStats(target, "", 0, 0, 0).accuracy).toBe(100);
  });

  it("auto-indents after a newline", () => {
    const code = "a {\n    b\n}";
    expect(autoIndent(code, 4)).toBe("    ");
    expect(autoIndent(code, 0)).toBe("");
  });

  it("ships snippets", () => {
    expect(SNIPPETS.length).toBeGreaterThanOrEqual(6);
  });
});

describe("Phase memory", () => {
  it("deals 8 pairs", () => {
    const b = newBoard(() => 0.5);
    expect(b.cards).toHaveLength(SYMBOLS.length * 2);
  });

  it("matches pairs, counts moves and finishes", () => {
    let s = newBoard(() => 0.999);
    const pairs = new Map<string, number[]>();
    s.cards.forEach((c, i) => pairs.set(c.symbol, [...(pairs.get(c.symbol) ?? []), i]));
    const [[a1, a2], [b1]] = [...pairs.values()];
    s = flip(s, a1);
    s = flip(s, b1); // mismatch
    expect(s.moves).toBe(1);
    expect(s.open).toHaveLength(2);
    s = settle(s);
    expect(s.open).toEqual([]);
    for (const [x, y] of pairs.values()) s = flip(flip(s, x), y);
    expect(s.done).toBe(true);
    expect(s.moves).toBe(1 + SYMBOLS.length);
    expect(flip(s, a2)).toBe(s);
  });

  it("ignores taps on the same card", () => {
    const s = flip(newBoard(), 0);
    expect(flip(s, 0)).toBe(s);
  });
});

describe("Orbit", () => {
  it("hops rings with wrap-around", () => {
    let s = newOrbit("playing");
    const start = s.ring;
    for (let i = 0; i < RINGS; i++) s = hop(s);
    expect(s.ring).toBe(start);
  });

  it("ends the run on contact with debris on the same ring", () => {
    const s = { ...newOrbit("playing"), debris: [{ id: 1, ring: 1, angle: -Math.PI / 2 + 0.05, speed: 0 }], spawnIn: 99 };
    expect(stepOrbit(s, 0.01).status).toBe("over");
    expect(stepOrbit({ ...s, ring: 2 }, 0.01).status).toBe("playing");
  });

  it("accumulates survival time and spawns debris", () => {
    let s = newOrbit("playing");
    for (let i = 0; i < 120; i++) s = { ...stepOrbit({ ...s, debris: [] }, 1 / 60, () => 0.5) };
    expect(s.t).toBeCloseTo(2, 1);
    expect(stepOrbit({ ...s, spawnIn: 0 }, 0.01, () => 0.5).debris.length).toBe(1);
  });
});
