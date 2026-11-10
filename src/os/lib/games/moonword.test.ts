import { describe, expect, it } from "vitest";
import { ANSWERS, dailyWord, emptyStats, evaluate, keyboardMarks, puzzleNumber, recordResult, shareText } from "./moonword";

describe("Moonword", () => {
  it("has a decent list of unique 5-letter answers", () => {
    expect(ANSWERS.length).toBeGreaterThan(150);
    expect(ANSWERS.every((w) => /^[A-Z]{5}$/.test(w))).toBe(true);
    expect(new Set(ANSWERS).size).toBe(ANSWERS.length);
  });

  it("gives everyone the same word per UTC day and changes daily", () => {
    const a = new Date(Date.UTC(2026, 10, 10, 1));
    const b = new Date(Date.UTC(2026, 10, 10, 23));
    const c = new Date(Date.UTC(2026, 10, 11, 1));
    expect(dailyWord(a)).toBe(dailyWord(b));
    expect(dailyWord(a)).not.toBe(dailyWord(c));
    expect(puzzleNumber(new Date(Date.UTC(2026, 0, 1)))).toBe(1);
  });

  it("marks hits, nears and misses", () => {
    expect(evaluate("CACHE", "CACHE")).toEqual(["hit", "hit", "hit", "hit", "hit"]);
    expect(evaluate("STACK", "TASKS")).toEqual(["near", "near", "near", "miss", "near"]);
  });

  it("handles repeated letters", () => {
    // THEME has two Es: one is placed (last), the other is claimed by the first guessed E only.
    expect(evaluate("EERIE", "THEME")).toEqual(["near", "miss", "miss", "miss", "hit"]);
    // One E in the answer, already matched in place → extra guessed Es are misses.
    expect(evaluate("EERIE", "SLATE")).toEqual(["miss", "miss", "miss", "miss", "hit"]);
    // Two Ls guessed, one L in the answer and not in place → one near, one miss.
    expect(evaluate("LLAMA", "SLATE")).toEqual(["miss", "hit", "hit", "miss", "miss"]);
    expect(evaluate("ALLOY", "LOCAL")).toEqual(["near", "near", "near", "near", "miss"]);
  });

  it("keeps the best mark per keyboard key", () => {
    const k = keyboardMarks(["STACK", "CACHE"], "CACHE");
    expect(k.C).toBe("hit");
    expect(k.S).toBe("miss");
  });

  it("builds a share grid", () => {
    expect(shareText(7, ["CACHE"], "CACHE", true)).toBe("Moonword #7 1/6\n🌕🌕🌕🌕🌕");
  });

  it("tracks streaks across consecutive days only", () => {
    let s = recordResult(emptyStats(), 10, true, 3);
    s = recordResult(s, 11, true, 2);
    expect(s.streak).toBe(2);
    s = recordResult(s, 13, true, 4);
    expect(s.streak).toBe(1);
    expect(s.maxStreak).toBe(2);
    s = recordResult(s, 14, false, 6);
    expect(s.streak).toBe(0);
    expect(s.dist).toEqual([0, 1, 1, 1, 0, 0]);
  });
});
