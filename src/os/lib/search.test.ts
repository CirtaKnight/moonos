import { describe, expect, it } from "vitest";
import { fallbackContent } from "../content/fallback";
import { scoreText, search } from "./search";

const apps = [
  { id: "terminal", name: "Terminal", description: "Type `help`" },
  { id: "mail", name: "Mail", description: "Contact me" },
];

describe("scoreText", () => {
  it("ranks prefix above substring above subsequence", () => {
    expect(scoreText("term", "Terminal")).toBeGreaterThan(scoreText("min", "Terminal"));
    expect(scoreText("min", "Terminal")).toBeGreaterThan(scoreText("tml", "Terminal"));
    expect(scoreText("xyz", "Terminal")).toBe(0);
  });
});

describe("search", () => {
  it("finds apps, projects, tags and files", () => {
    expect(search("term", fallbackContent, apps)[0]).toMatchObject({ kind: "app", id: "terminal" });
    expect(search("moon", fallbackContent, apps)[0]).toMatchObject({ kind: "project", slug: "moonos" });
    expect(search("zustand", fallbackContent, apps)[0]).toMatchObject({ kind: "project" });
    expect(search("readme", fallbackContent, apps)[0]).toMatchObject({ kind: "file", title: "README.txt" });
  });

  it("matches app descriptions", () => {
    expect(search("contact", fallbackContent, apps)[0]).toMatchObject({ kind: "app", id: "mail" });
  });

  it("returns nothing for an empty query", () => {
    expect(search("   ", fallbackContent, apps)).toEqual([]);
  });
});
