import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { client, SANITY_TAG } from "@/sanity/client";
import { isSanityConfigured } from "@/sanity/env";
import { OS_CONTENT_QUERY } from "@/sanity/queries";
import { githubUser } from "../lib/links";
import { parseRepo } from "../lib/github";
import { parsePlace } from "../lib/place";
import { fallbackContent } from "./fallback";
import { getContributions, getGithubActivity, getRepoStats } from "./github";
import type { OSContent, Profile, Project, SiteSettings } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any -- raw CMS payload is normalised below */

const compact = <T,>(arr: (T | null | undefined)[] | null | undefined): T[] =>
  (arr ?? []).filter((x): x is T => x != null);

function toProfile(raw: any): Profile {
  const fb = fallbackContent.profile;
  if (!raw?.name) return fb;
  return {
    name: raw.name,
    handle: raw.handle || raw.name.toLowerCase().replace(/\s+/g, ""),
    title: raw.title ?? fb.title,
    avatarUrl: raw.avatarUrl ?? undefined,
    shortBio: raw.shortBio ?? "",
    bio: compact<string>(raw.bio),
    skills: compact<string>(raw.skills),
    education: compact<any>(raw.education).map((e) => ({
      school: e.school ?? "",
      degree: e.degree ?? "",
      period: e.period ?? undefined,
    })),
    location: raw.location ?? undefined,
    email: raw.email ?? undefined,
    cvUrl: raw.cvUrl ?? undefined,
    available: raw.available ?? undefined,
    githubUsername: raw.githubUsername || undefined,
  };
}

function toProject(raw: any): Project {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title ?? "Untitled project",
    summary: raw.summary ?? undefined,
    description: raw.description ?? undefined,
    tags: compact<string>(raw.tags),
    date: raw.date ?? undefined,
    coverUrl: raw.coverUrl ?? undefined,
    color: raw.color ?? undefined,
    archived: Boolean(raw.archived),
    publishedAt: raw.publishedAt ?? undefined,
    place: parsePlace(raw.place),
    repo: raw.repoUrl ? { url: raw.repoUrl, fullName: raw.repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "") } : undefined,
    items: compact<any>(raw.items)
      .filter((i) => i.kind && i.title)
      .map((i) => ({
        id: i.id,
        kind: i.kind,
        title: i.title,
        caption: i.caption ?? undefined,
        url: i.url ?? undefined,
        text: i.text ?? undefined,
        width: i.width ?? undefined,
        height: i.height ?? undefined,
      })),
  };
}

function toSettings(raw: any): SiteSettings {
  const fb = fallbackContent.settings;
  const bootLines = compact<string>(raw?.bootLines);
  const extra = compact<any>(raw?.wallpapers).filter((w) => w.url);
  const city = raw?.weatherCity;
  return {
    welcomeNote: raw?.welcomeNote || fb.welcomeNote,
    bootLines: bootLines.length ? bootLines : fb.bootLines,
    wallpapers: [...fb.wallpapers, ...extra.map((w) => ({ id: w.id, name: w.name, url: w.url }))],
    weatherCity:
      city?.name && typeof city.latitude === "number" && typeof city.longitude === "number"
        ? { name: city.name, latitude: city.latitude, longitude: city.longitude }
        : undefined,
  };
}

/**
 * Loads OS content from Sanity, cached and tagged so the publish webhook can refresh it.
 * Falls back to built-in content when the CMS isn't configured or can't be reached,
 * so the site always renders.
 */
export async function getContent(): Promise<OSContent> {
  "use cache";
  cacheTag(SANITY_TAG);
  cacheLife("hours");
  if (!isSanityConfigured) return fallbackContent;
  try {
    const raw: any = await client.fetch(OS_CONTENT_QUERY);
    return {
      source: "cms",
      profile: toProfile(raw?.profile),
      projects: compact<any>(raw?.projects).map(toProject),
      media: compact<any>(raw?.media).filter((m) => m.url),
      socials: compact<any>(raw?.socials),
      tracks: compact<any>(raw?.tracks),
      settings: toSettings(raw?.settings),
      activity: [],
      contributions: [],
      announcements: compact<any>(raw?.announcements).map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body ?? undefined,
        url: a.url ?? undefined,
        linkLabel: a.linkLabel ?? undefined,
        source: a.source ?? "generic",
        publishedAt: a.publishedAt,
      })),
      events: compact<any>(raw?.events).map((e) => ({
        id: e.id,
        title: e.title ?? "Untitled",
        kind: e.kind ?? "other",
        start: e.start,
        end: e.end ?? undefined,
        location: e.location ?? undefined,
        url: e.url ?? undefined,
        description: e.description ?? undefined,
        projectSlug: e.projectSlug ?? undefined,
        place: parsePlace(e.place),
      })),
      experiences: compact<any>(raw?.experiences).map((x) => ({
        id: x.id,
        role: x.role ?? "Role",
        organization: x.organization ?? "",
        kind: x.kind ?? "job",
        start: x.start,
        end: x.end ?? undefined,
        place: parsePlace(x.place),
        description: x.description ?? undefined,
        skills: compact<string>(x.skills),
        url: x.url ?? undefined,
        logoUrl: x.logoUrl ?? undefined,
      })),
    };
  } catch (err) {
    console.error("[getContent] Sanity fetch failed, using built-in content:", err);
    // Don't pin the fallback for hours: retry the CMS soon.
    cacheLife("minutes");
    return fallbackContent;
  }
}

/**
 * CMS content plus live GitHub data (activity feed and per-project repo stats).
 * GitHub calls are cached separately, so a GitHub outage never blocks the page.
 */
export async function getOSContent(): Promise<OSContent> {
  const content = await getContent();
  const user = githubUser(content);
  const [activity, contributions, repos] = await Promise.all([
    getGithubActivity(user),
    getContributions(user),
    Promise.all(
      content.projects.map(async (p) => {
        const full = parseRepo(p.repo?.url);
        return full ? ((await getRepoStats(full)) ?? p.repo) : p.repo;
      }),
    ),
  ]);
  return {
    ...content,
    activity,
    contributions,
    projects: content.projects.map((p, i) => ({ ...p, repo: repos[i] ?? undefined })),
  };
}
