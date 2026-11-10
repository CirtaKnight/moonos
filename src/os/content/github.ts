import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { mapGithubEvents, mapRepo } from "../lib/github";
import type { ActivityItem, RepoStats } from "./types";

const API = "https://api.github.com";

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "MoonOS",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // Optional: raises the rate limit from 60 to 5000 requests/hour.
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

/** Recent public activity for a user, cached ~15 minutes. Never throws. */
export async function getGithubActivity(username: string): Promise<ActivityItem[]> {
  "use cache";
  cacheTag("github");
  cacheLife({ stale: 300, revalidate: 900, expire: 86_400 });
  try {
    const res = await fetch(`${API}/users/${encodeURIComponent(username)}/events/public?per_page=40`, { headers: headers() });
    if (!res.ok) return [];
    return mapGithubEvents(await res.json()).slice(0, 25);
  } catch {
    return [];
  }
}

/** Stars / language / last push for a repository, cached ~1 hour. Never throws. */
export async function getRepoStats(fullName: string): Promise<RepoStats | null> {
  "use cache";
  cacheTag("github");
  cacheLife("hours");
  try {
    const res = await fetch(`${API}/repos/${fullName}`, { headers: headers() });
    if (!res.ok) return null;
    return mapRepo(await res.json());
  } catch {
    return null;
  }
}
