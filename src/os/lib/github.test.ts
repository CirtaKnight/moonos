import { describe, expect, it } from "vitest";
import { contributionStats, mapContributionCalendar, mapGithubEvents, mapRepo, parseContributionsHtml, parseRepo, timeAgo } from "./github";

const at = "2026-11-10T10:00:00Z";

describe("mapGithubEvents", () => {
  it("maps pushes with commit links and messages", () => {
    const [item] = mapGithubEvents([
      {
        id: "1",
        type: "PushEvent",
        created_at: at,
        repo: { name: "CirtaKnight/moonos" },
        payload: { size: 2, commits: [{ sha: "a", message: "first" }, { sha: "b", message: "fix snapping\n\nbody" }] },
      },
    ]);
    expect(item).toMatchObject({
      id: "gh:1",
      kind: "push",
      title: "Pushed 2 commits to moonos",
      body: "fix snapping",
      url: "https://github.com/CirtaKnight/moonos/commit/b",
    });
  });

  it("maps repos, releases, merged PRs and stars; drops noise", () => {
    const items = mapGithubEvents([
      { id: "2", type: "CreateEvent", created_at: at, repo: { name: "u/new" }, payload: { ref_type: "repository" } },
      { id: "3", type: "CreateEvent", created_at: at, repo: { name: "u/new" }, payload: { ref_type: "branch" } },
      { id: "4", type: "ReleaseEvent", created_at: at, repo: { name: "u/r" }, payload: { action: "published", release: { tag_name: "v1.0", html_url: "https://x" } } },
      { id: "5", type: "PullRequestEvent", created_at: at, repo: { name: "u/p" }, payload: { action: "closed", pull_request: { merged: true, title: "Add X", html_url: "https://pr" } } },
      { id: "6", type: "PullRequestEvent", created_at: at, repo: { name: "u/p" }, payload: { action: "closed", pull_request: { merged: false, title: "nope" } } },
      { id: "7", type: "WatchEvent", created_at: at, repo: { name: "o/cool" }, payload: {} },
      { id: "8", type: "IssueCommentEvent", created_at: at, repo: { name: "o/x" }, payload: {} },
    ]);
    expect(items.map((i) => i.kind)).toEqual(["create", "release", "pr", "star"]);
    expect(items[2].title).toBe("Merged a pull request in p");
  });

  it("survives junk", () => {
    expect(mapGithubEvents(undefined as never)).toEqual([]);
    expect(mapGithubEvents([{}, null])).toEqual([]);
  });
});

describe("repo helpers", () => {
  it("parses GitHub URLs", () => {
    expect(parseRepo("https://github.com/CirtaKnight/moonos")).toBe("CirtaKnight/moonos");
    expect(parseRepo("https://github.com/a/b.git")).toBe("a/b");
    expect(parseRepo("https://github.com/a/b/tree/main")).toBe("a/b");
    expect(parseRepo("https://gitlab.com/a/b")).toBeNull();
  });
  it("maps repo stats", () => {
    expect(mapRepo({ full_name: "a/b", html_url: "u", stargazers_count: 3, language: "TypeScript" })).toMatchObject({ stars: 3, language: "TypeScript" });
    expect(mapRepo({})).toBeNull();
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-11-10T12:00:00Z");
  it("formats relative times", () => {
    expect(timeAgo("2026-11-10T11:59:30Z", now)).toBe("now");
    expect(timeAgo("2026-11-10T11:30:00Z", now)).toBe("30m ago");
    expect(timeAgo("2026-11-10T09:00:00Z", now)).toBe("3h ago");
    expect(timeAgo("2026-11-08T12:00:00Z", now)).toBe("2d ago");
    expect(timeAgo("2026-10-01T12:00:00Z", now)).toBe("1 Oct");
  });
});

describe("contribution calendar", () => {
  const html = `
    <td data-date="2026-11-08" id="d-0" data-level="0" class="x"></td>
    <td data-date="2026-11-09" id="d-1" data-level="2"></td>
    <td data-date="2026-11-10" id="d-2" data-level="4"></td>
    <td data-date="2026-11-11" id="d-3" data-level="0"></td>
    <tool-tip for="d-0">No contributions on November 8th.</tool-tip>
    <tool-tip for="d-1">3 contributions on November 9th.</tool-tip>
    <tool-tip for="d-2">1,204 contributions on November 10th.</tool-tip>
    <tool-tip for="d-3">No contributions on November 11th.</tool-tip>`;

  it("parses the public calendar HTML", () => {
    const days = parseContributionsHtml(html);
    expect(days.map((d) => [d.date, d.level, d.count])).toEqual([
      ["2026-11-08", 0, 0],
      ["2026-11-09", 2, 3],
      ["2026-11-10", 4, 1204],
      ["2026-11-11", 0, 0],
    ]);
  });

  it("maps the GraphQL calendar", () => {
    const days = mapContributionCalendar({
      data: { user: { contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays: [{ date: "2026-01-02", contributionCount: 5, contributionLevel: "THIRD_QUARTILE" }] }] } } } },
    });
    expect(days).toEqual([{ date: "2026-01-02", count: 5, level: 3 }]);
  });

  it("computes totals and streaks (today may still be empty)", () => {
    const s = contributionStats(parseContributionsHtml(html), "2026-11-11");
    expect(s).toMatchObject({ total: 1207, longest: 2, current: 2, activeDays: 2 });
    expect(s.busiest?.date).toBe("2026-11-10");
  });
});
