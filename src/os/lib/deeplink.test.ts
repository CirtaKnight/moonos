import { describe, expect, it } from "vitest";
import { linkFor, parseDeepLink } from "./deeplink";

const apps = ["about", "terminal", "cv"] as const;

describe("parseDeepLink", () => {
  it("parses projects and apps", () => {
    expect(parseDeepLink("?open=project/my-app", apps)).toEqual({ kind: "project", slug: "my-app" });
    expect(parseDeepLink("?open=terminal", apps)).toEqual({ kind: "app", app: "terminal" });
    expect(parseDeepLink("?open=app/cv", apps)).toEqual({ kind: "app", app: "cv" });
    expect(parseDeepLink("?quick", apps)).toEqual({ kind: "quick" });
  });

  it("ignores unknown or empty values", () => {
    expect(parseDeepLink("", apps)).toBeNull();
    expect(parseDeepLink("?open=", apps)).toBeNull();
    expect(parseDeepLink("?open=rm-rf", apps)).toBeNull();
    expect(parseDeepLink("?open=project/", apps)).toBeNull();
  });
});

describe("linkFor", () => {
  it("links folders and their files to the project", () => {
    expect(linkFor("folder", { slug: "x" })).toBe("project/x");
    expect(linkFor("viewer", { slug: "x", item: "i" })).toBe("project/x");
    expect(linkFor("viewer", { media: "m" })).toBeNull();
    expect(linkFor("about", {})).toBe("about");
  });
});
