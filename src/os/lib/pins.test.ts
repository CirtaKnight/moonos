import { describe, expect, it } from "vitest";
import { buildPins, pinBounds, range } from "./pins";

const place = (lat: number, lng: number) => ({ lat, lng, name: "X" });

describe("buildPins", () => {
  const content = {
    projects: [
      { id: "p1", slug: "a", title: "A", tags: [], archived: false, items: [], date: "2025-03-01", place: place(36, 6) },
      { id: "p2", slug: "b", title: "B", tags: [], archived: true, items: [], place: place(1, 1) },
      { id: "p3", slug: "c", title: "C", tags: [], archived: false, items: [] },
    ],
    experiences: [{ id: "x1", role: "Intern", organization: "Org", kind: "internship" as const, start: "2026-06-01", skills: [], place: place(48.8, 2.3) }],
    events: [{ id: "e1", title: "Hack", kind: "hackathon" as const, start: "2025-11-01", place: place(40, -3), projectSlug: "a" }],
  };

  it("collects pinned, non-archived items newest first", () => {
    const pins = buildPins(content);
    expect(pins.map((p) => p.id)).toEqual(["experience:x1", "event:e1", "project:p1"]);
    expect(pins[0]).toMatchObject({ label: "Internship", title: "Intern", subtitle: "Org" });
    expect(pins[1].action).toEqual({ type: "project", slug: "a", title: "Hack" });
  });

  it("computes padded bounds", () => {
    expect(pinBounds([])).toBeNull();
    expect(pinBounds(buildPins(content), 1)).toEqual([[-4, 35], [7, 49.8]]);
  });

  it("formats date ranges", () => {
    expect(range("2026-06-01", undefined, true)).toBe("Jun 2026 – now");
    expect(range("2026-06-01", "2026-06-20")).toBe("Jun 2026");
    expect(range(undefined)).toBeUndefined();
  });
});
