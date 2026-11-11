import { describe, expect, it } from "vitest";
import { fallbackContent } from "../content/fallback";
import { buildConstellation } from "./constellation";

const content = {
  profile: { ...fallbackContent.profile, skills: ["TypeScript", "Python", "Linux"] },
  projects: [
    { id: "a", slug: "a", title: "A", tags: ["TypeScript", "React"], archived: false, items: [] },
    { id: "b", slug: "b", title: "B", tags: ["typescript ", "React", "Sanity"], archived: false, items: [] },
    { id: "c", slug: "c", title: "C", tags: ["Go"], archived: true, items: [] },
  ],
  experiences: [{ id: "x", role: "Intern", organization: "Org", kind: "internship" as const, start: "2026-01-01", skills: ["Python", "Linux"] }],
};

describe("buildConstellation", () => {
  const { nodes, edges } = buildConstellation(content);
  const node = (id: string) => nodes.find((n) => n.id === id)!;

  it("merges skills case-insensitively and counts uses", () => {
    expect(node("typescript").weight).toBe(2);
    expect(node("react").weight).toBe(2);
    expect(node("python").uses[0]).toMatchObject({ kind: "experience", title: "Intern · Org" });
    expect(nodes.find((n) => n.id === "go")).toBeUndefined();
  });

  it("links skills used together, weighted by shared uses", () => {
    expect(edges.find((e) => e.a === "react" && e.b === "typescript")?.weight).toBe(2);
    expect(edges.find((e) => e.a === "linux" && e.b === "python")?.weight).toBe(1);
  });

  it("lays stars out deterministically inside the sky", () => {
    const again = buildConstellation(content).nodes;
    expect(again.map((n) => [n.x, n.y])).toEqual(nodes.map((n) => [n.x, n.y]));
    expect(nodes.every((n) => n.x >= 0.08 && n.x <= 0.92 && n.y >= 0.1 && n.y <= 0.9)).toBe(true);
  });
});
