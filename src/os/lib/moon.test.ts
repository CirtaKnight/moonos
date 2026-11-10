import { describe, expect, it } from "vitest";
import { moonIllumination, moonPhase, moonPhaseName } from "./moon";

describe("moonPhase", () => {
  it("is ~0 at a known new moon", () => {
    const p = moonPhase(new Date(Date.UTC(2024, 0, 11, 11, 57)));
    expect(Math.min(p, 1 - p)).toBeLessThan(0.02);
  });

  it("is ~0.5 at a known full moon", () => {
    const p = moonPhase(new Date(Date.UTC(2024, 0, 25, 17, 54)));
    expect(Math.abs(p - 0.5)).toBeLessThan(0.02);
  });

  it("always returns a value in [0, 1)", () => {
    for (const year of [1970, 1999, 2026, 2100]) {
      const p = moonPhase(new Date(Date.UTC(year, 5, 1)));
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(1);
    }
  });
});

describe("moonPhaseName / moonIllumination", () => {
  it("names the main phases", () => {
    expect(moonPhaseName(0)).toBe("New moon");
    expect(moonPhaseName(0.25)).toBe("First quarter");
    expect(moonPhaseName(0.5)).toBe("Full moon");
    expect(moonPhaseName(0.99)).toBe("New moon");
  });

  it("computes illumination", () => {
    expect(moonIllumination(0)).toBeCloseTo(0);
    expect(moonIllumination(0.5)).toBeCloseTo(1);
    expect(moonIllumination(0.25)).toBeCloseTo(0.5);
  });
});
