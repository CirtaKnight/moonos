import { describe, expect, it } from "vitest";
import type { AgendaEvent } from "../content/types";
import { dayKey, eventsOn, monthMatrix, parseDay, relativeDay, splitTimeline } from "./agenda";

const ev = (id: string, start: string, end?: string): AgendaEvent => ({ id, title: id, kind: "event", start, end });

describe("agenda", () => {
  it("parses dates as local days", () => {
    expect(dayKey(parseDay("2026-03-09"))).toBe("2026-03-09");
  });

  it("builds a Monday-first 6×7 month grid", () => {
    const m = monthMatrix(2026, 10); // November 2026 starts on a Sunday
    expect(m).toHaveLength(6);
    expect(m.every((w) => w.length === 7)).toBe(true);
    expect(dayKey(m[0][0])).toBe("2026-10-26");
    expect(dayKey(m[0][6])).toBe("2026-11-01");
  });

  it("finds single and multi-day events on a day", () => {
    const events = [ev("a", "2026-11-10"), ev("b", "2026-11-08", "2026-11-12"), ev("c", "2026-11-20")];
    expect(eventsOn(parseDay("2026-11-10"), events).map((e) => e.id)).toEqual(["a", "b"]);
    expect(eventsOn(parseDay("2026-11-13"), events)).toEqual([]);
  });

  it("splits upcoming and past around today", () => {
    const today = parseDay("2026-11-10");
    const { upcoming, past } = splitTimeline(
      [ev("old", "2026-01-01"), ev("now", "2026-11-09", "2026-11-11"), ev("soon", "2026-12-01"), ev("older", "2025-05-01")],
      today,
    );
    expect(upcoming.map((e) => e.id)).toEqual(["now", "soon"]);
    expect(past.map((e) => e.id)).toEqual(["old", "older"]);
  });

  it("describes relative days", () => {
    const today = parseDay("2026-11-10");
    expect(relativeDay("2026-11-10", today)).toBe("today");
    expect(relativeDay("2026-11-11", today)).toBe("tomorrow");
    expect(relativeDay("2026-11-13", today)).toBe("in 3 days");
    expect(relativeDay("2026-10-27", today)).toBe("2 weeks ago");
    expect(relativeDay("2027-03-10", today)).toBe("in 4 months");
  });
});
