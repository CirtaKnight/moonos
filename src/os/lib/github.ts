import type { ActivityItem, RepoStats } from "../content/types";

/* eslint-disable @typescript-eslint/no-explicit-any -- raw GitHub API payloads */

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const firstLine = (s: string | undefined) => (s ?? "").split("\n")[0].trim();

/**
 * Turns GitHub "public events" into human notifications. Unknown / noisy events are dropped.
 * https://docs.github.com/en/rest/activity/events
 */
export function mapGithubEvents(events: any[]): ActivityItem[] {
  const out: ActivityItem[] = [];
  for (const e of events ?? []) {
    if (!e || typeof e !== "object") continue;
    const repo: string = e?.repo?.name ?? "";
    const short = repo.split("/")[1] ?? repo;
    const repoUrl = `https://github.com/${repo}`;
    const base = { id: `gh:${e.id}`, at: e.created_at as string, repo: short };
    const p = e.payload ?? {};
    switch (e.type) {
      case "PushEvent": {
        const commits: any[] = p.commits ?? [];
        const n = p.size ?? p.distinct_size ?? commits.length;
        const last = commits[commits.length - 1];
        if (!n && !last) break;
        out.push({
          ...base,
          kind: "push",
          title: `Pushed ${plural(n || 1, "commit")} to ${short}`,
          body: firstLine(last?.message) || undefined,
          url: last?.sha ? `${repoUrl}/commit/${last.sha}` : p.head ? `${repoUrl}/commit/${p.head}` : repoUrl,
        });
        break;
      }
      case "CreateEvent":
        if (p.ref_type === "repository") {
          out.push({ ...base, kind: "create", title: `Created a new repository: ${short}`, body: p.description || undefined, url: repoUrl });
        }
        break;
      case "ReleaseEvent":
        if (p.action === "published" && p.release) {
          out.push({
            ...base,
            kind: "release",
            title: `Released ${p.release.tag_name ?? p.release.name} of ${short}`,
            body: firstLine(p.release.name) || undefined,
            url: p.release.html_url ?? repoUrl,
          });
        }
        break;
      case "PullRequestEvent": {
        const pr = p.pull_request;
        if (!pr) break;
        const merged = p.action === "closed" && pr.merged;
        if (p.action !== "opened" && !merged) break;
        out.push({
          ...base,
          kind: "pr",
          title: `${merged ? "Merged" : "Opened"} a pull request in ${short}`,
          body: pr.title,
          url: pr.html_url ?? repoUrl,
        });
        break;
      }
      case "WatchEvent":
        out.push({ ...base, kind: "star", title: `Starred ${repo}`, url: repoUrl });
        break;
      case "ForkEvent":
        out.push({ ...base, kind: "fork", title: `Forked ${repo}`, url: p.forkee?.html_url ?? repoUrl });
        break;
      case "PublicEvent":
        out.push({ ...base, kind: "create", title: `Open-sourced ${short}`, url: repoUrl });
        break;
    }
  }
  return out;
}

/** Parses "owner/name" from a GitHub URL (or returns null). */
export function parseRepo(url: string | undefined): string | null {
  const m = url?.match(/github\.com\/([A-Za-z0-9-_.]+)\/([A-Za-z0-9-_.]+?)(?:\.git)?(?:[/#?]|$)/i);
  return m ? `${m[1]}/${m[2]}` : null;
}

export function mapRepo(raw: any): RepoStats | null {
  if (!raw?.full_name) return null;
  return {
    url: raw.html_url,
    fullName: raw.full_name,
    description: raw.description ?? undefined,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    language: raw.language ?? undefined,
    pushedAt: raw.pushed_at ?? undefined,
  };
}

/** "3h ago", "2d ago", "Nov 3". */
export function timeAgo(iso: string | undefined, now = Date.now()): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* --------------------------------- Contribution calendar --------------------------------- */

export interface ContributionDay {
  date: string;
  /** GitHub's 0–4 intensity bucket. */
  level: 0 | 1 | 2 | 3 | 4;
  count: number;
}

const clampLevel = (n: number) => Math.max(0, Math.min(4, Math.round(n))) as ContributionDay["level"];

/** Parse github.com/users/<u>/contributions (public HTML, no token needed). */
export function parseContributionsHtml(html: string): ContributionDay[] {
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = m[2].match(/^(\d[\d,]*) contributions?/);
    counts.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
  }
  const days: ContributionDay[] = [];
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = m[0];
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    const level = tag.match(/data-level="(\d)"/)?.[1];
    if (!date || level == null) continue;
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    days.push({ date, level: clampLevel(Number(level)), count: (id ? counts.get(id) : undefined) ?? (Number(level) ? 1 : 0) });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

const LEVELS: Record<string, ContributionDay["level"]> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

 
export function mapContributionCalendar(data: any): ContributionDay[] {
  const weeks = data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];
  return weeks
     
    .flatMap((w: any) => w.contributionDays ?? [])
     
    .map((d: any) => ({ date: d.date, count: d.contributionCount ?? 0, level: LEVELS[d.contributionLevel] ?? 0 }))
    .sort((a: ContributionDay, b: ContributionDay) => a.date.localeCompare(b.date));
}

export function contributionStats(days: ContributionDay[], today?: string) {
  const total = days.reduce((s, d) => s + d.count, 0);
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Current streak counts back from today (or yesterday, if today is still empty).
  const upto = today ? days.filter((d) => d.date <= today) : days;
  let i = upto.length - 1;
  if (i >= 0 && upto[i].count === 0) i--;
  let current = 0;
  while (i >= 0 && upto[i].count > 0) {
    current++;
    i--;
  }
  const busiest = days.reduce<ContributionDay | null>((b, d) => (!b || d.count > b.count ? d : b), null);
  return { total, longest, current, busiest: busiest && busiest.count > 0 ? busiest : null, activeDays: days.filter((d) => d.count > 0).length };
}
