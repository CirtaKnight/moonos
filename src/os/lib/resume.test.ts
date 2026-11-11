import { describe, expect, it } from "vitest";
import { fallbackContent } from "../content/fallback";
import type { OSContent } from "../content/types";
import { buildResume, displayUrl, formatMonth, formatPeriod } from "./resume";

const content = (patch: Partial<OSContent> = {}): OSContent => ({ ...fallbackContent, ...patch });

describe("dates", () => {
  it("formats months and periods", () => {
    expect(formatMonth("2025-09-14")).toBe("Sep 2025");
    expect(formatMonth("2024")).toBe("2024");
    expect(formatMonth("Spring")).toBe("Spring");
    expect(formatPeriod("2025-09")).toBe("Sep 2025 – Present");
    expect(formatPeriod("2024-06", "2024-08")).toBe("Jun 2024 – Aug 2024");
    expect(formatPeriod("2024-06", "2024-06-30")).toBe("Jun 2024");
  });
  it("shortens urls", () => {
    expect(displayUrl("https://www.linkedin.com/in/someone/")).toBe("linkedin.com/in/someone");
    expect(displayUrl("mailto:a@b.co")).toBe("a@b.co");
  });
});

describe("buildResume", () => {
  const exp = (id: string, kind: OSContent["experiences"][number]["kind"], start: string, end?: string) => ({
    id,
    role: `Role ${id}`,
    organization: `Org ${id}`,
    kind,
    start,
    end,
    skills: [`Skill ${id}`],
  });

  it("orders experience (ongoing first) and splits education out", () => {
    const r = buildResume(
      content({ experiences: [exp("a", "internship", "2024-06", "2024-08"), exp("b", "club", "2023-01"), exp("c", "education", "2022-09")] }),
    );
    expect(r.experience.map((x) => x.org)).toEqual(["Org b", "Org a"]);
    expect(r.experience[0].period).toBe("Jan 2023 – Present");
    expect(r.education[0]).toMatchObject({ title: "Role c", org: "Org c" });
    // Profile education is kept as well.
    expect(r.education.length).toBe(1 + fallbackContent.profile.education.length);
  });

  it("collects links, projects and extra skills", () => {
    const r = buildResume(
      content({
        profile: { ...fallbackContent.profile, email: "me@example.com" },
        experiences: [exp("a", "job", "2025-01")],
      }),
      "https://example.com/",
    );
    expect(r.links[0]).toEqual({ label: "Email", href: "mailto:me@example.com", display: "me@example.com" });
    expect(r.links.at(-1)).toEqual({ label: "Portfolio", href: "https://example.com", display: "example.com" });
    expect(r.projects[0].pageUrl).toBe("https://example.com/projects/moonos");
    expect(r.skills.slice(0, fallbackContent.profile.skills.length)).toEqual(fallbackContent.profile.skills);
    expect(r.skills).toContain("Skill a");
    expect(new Set(r.skills.map((s) => s.toLowerCase())).size).toBe(r.skills.length);
  });

  it("only reports GitHub stats when there were contributions", () => {
    expect(buildResume(content({ contributions: [] })).github).toBeUndefined();
    const r = buildResume(content({ contributions: [{ date: "2026-01-01", count: 3, level: 1 }, { date: "2026-01-02", count: 2, level: 1 }] }));
    expect(r.github).toEqual({ total: 5, activeDays: 2, longest: 2 });
  });
});
