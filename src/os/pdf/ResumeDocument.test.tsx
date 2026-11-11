// @vitest-environment node
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { fallbackContent } from "../content/fallback";
import type { OSContent } from "../content/types";
import { buildResume } from "../lib/resume";
import { ResumeDocument } from "./ResumeDocument";

const long = "Designed, built and shipped a feature end to end with a small team, measuring the impact and iterating on feedback every week. ".repeat(4);

const busy: OSContent = {
  ...fallbackContent,
  profile: {
    ...fallbackContent.profile,
    email: "someone@example.com",
    location: "Somewhere",
    bio: [long, long, long],
    skills: Array.from({ length: 40 }, (_, i) => `Skill number ${i}`),
    education: [
      { school: "School A", degree: "Degree A", period: "2022 – 2027" },
      { school: "School B", degree: "Degree B", period: "2019 – 2022" },
    ],
  },
  experiences: Array.from({ length: 8 }, (_, i) => ({
    id: `x${i}`,
    role: `Software engineering intern ${i}`,
    organization: `Organization ${i}`,
    kind: "internship" as const,
    start: `202${i % 6}-0${(i % 9) + 1}`,
    end: i ? `202${i % 6}-12` : undefined,
    description: long,
    skills: ["TypeScript", "React", "Python", "SQL", "Docker", "AWS", "Go", "Rust", "C++"],
  })),
  projects: Array.from({ length: 10 }, (_, i) => ({
    ...fallbackContent.projects[0],
    id: `p${i}`,
    slug: `p${i}`,
    title: `Project ${i}`,
    summary: long,
    tags: ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"],
    repo: { url: `https://github.com/someone/project-${i}`, fullName: `someone/project-${i}` },
  })),
  socials: Array.from({ length: 9 }, (_, i) => ({ id: `s${i}`, platform: `Network ${i}`, handle: "me", url: `https://network${i}.example.com/me` })),
};

describe("ResumeDocument", () => {
  it("always fits on a single page", async () => {
    const pdf = (await renderToBuffer(<ResumeDocument resume={buildResume(busy, "https://example.com")} siteUrl="https://example.com" />)).toString("latin1");
    expect(pdf.startsWith("%PDF")).toBe(true);
    expect(pdf.match(/\/Type \/Page\b/g)?.length).toBe(1);
  }, 30_000);
});
