import type { OSContent } from "../content/types";
import { contributionStats } from "./github";

/**
 * Recruiter mode: one normalized, ordered view of the CMS content, shared by the
 * /recruiter page and the generated one-page PDF so both always say the same thing.
 */

export interface ResumeLink {
  label: string;
  href: string;
  /** Short, printable form (no protocol, no trailing slash). */
  display: string;
}

export interface ResumeEntry {
  title: string;
  org: string;
  period: string;
  place?: string;
  description?: string;
  skills: string[];
  url?: string;
}

export interface ResumeProject {
  title: string;
  slug: string;
  summary?: string;
  tags: string[];
  date?: string;
  repoUrl?: string;
  /** The project's crawlable page on this site. */
  pageUrl: string;
}

export interface Resume {
  name: string;
  title: string;
  avatarUrl?: string;
  location?: string;
  available: boolean;
  summary: string;
  about: string[];
  links: ResumeLink[];
  skills: string[];
  experience: ResumeEntry[];
  projects: ResumeProject[];
  education: ResumeEntry[];
  /** GitHub contributions over the last year, when known. */
  github?: { total: number; activeDays: number; longest: number };
  cvUrl?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-09" / "2025-09-14" → "Sep 2025"; "2025" → "2025"; anything else passes through. */
export function formatMonth(value?: string): string {
  if (!value) return "";
  const m = value.match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return value;
  const month = m[2] ? MONTHS[Number(m[2]) - 1] : undefined;
  return month ? `${month} ${m[1]}` : m[1];
}

export function formatPeriod(start?: string, end?: string, ongoing = "Present"): string {
  const a = formatMonth(start);
  const b = end ? formatMonth(end) : ongoing;
  if (!a) return end ? b : "";
  return a === b ? a : `${a} – ${b}`;
}

export function displayUrl(href: string): string {
  return href.replace(/^mailto:/, "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
}

const byStartDesc = <T extends { start: string; end?: string }>(a: T, b: T) =>
  // Ongoing first, then most recent start.
  Number(!!a.end) - Number(!!b.end) || b.start.localeCompare(a.start);

export function buildResume(content: OSContent, siteUrl = ""): Resume {
  const { profile } = content;
  const base = siteUrl.replace(/\/+$/, "");

  const links: ResumeLink[] = [];
  if (profile.email) links.push({ label: "Email", href: `mailto:${profile.email}`, display: profile.email });
  for (const s of content.socials) {
    if (!/^https?:\/\//.test(s.url)) continue;
    links.push({ label: s.platform, href: s.url, display: displayUrl(s.url) });
  }
  if (base) links.push({ label: "Portfolio", href: base, display: displayUrl(base) });

  const experiences = [...content.experiences].sort(byStartDesc);
  const experience = experiences
    .filter((x) => x.kind !== "education")
    .map<ResumeEntry>((x) => ({
      title: x.role,
      org: x.organization,
      period: formatPeriod(x.start, x.end),
      place: x.place?.name,
      description: x.description,
      skills: x.skills,
      url: x.url,
    }));

  const education: ResumeEntry[] = [
    ...experiences
      .filter((x) => x.kind === "education")
      .map<ResumeEntry>((x) => ({
        title: x.role,
        org: x.organization,
        period: formatPeriod(x.start, x.end),
        place: x.place?.name,
        description: x.description,
        skills: x.skills,
      })),
    ...profile.education
      .filter((e) => !experiences.some((x) => x.kind === "education" && x.organization === e.school && x.role === e.degree))
      .map<ResumeEntry>((e) => ({ title: e.degree, org: e.school, period: e.period ?? "", skills: [] })),
  ];

  const projects = content.projects
    .filter((p) => !p.archived)
    .sort((a, b) => (b.date ?? b.publishedAt ?? "").localeCompare(a.date ?? a.publishedAt ?? ""))
    .map<ResumeProject>((p) => ({
      title: p.title,
      slug: p.slug,
      summary: p.summary ?? p.description?.split(/(?<=\.)\s/)[0],
      tags: p.tags,
      date: formatMonth(p.date),
      repoUrl: p.repo?.url,
      pageUrl: `${base}/projects/${p.slug}`,
    }));

  // Skills: profile order first, then anything only listed on experiences / projects.
  const skills = [...profile.skills];
  const seen = new Set(skills.map((s) => s.toLowerCase()));
  for (const s of [...experience.flatMap((x) => x.skills), ...projects.flatMap((p) => p.tags)]) {
    if (!seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      skills.push(s);
    }
  }

  const stats = content.contributions.length ? contributionStats(content.contributions) : null;

  return {
    name: profile.name,
    title: profile.title,
    avatarUrl: profile.avatarUrl,
    location: profile.location,
    available: !!profile.available,
    summary: profile.shortBio,
    about: profile.bio,
    links,
    skills,
    experience,
    projects,
    education,
    github: stats && stats.total > 0 ? { total: stats.total, activeDays: stats.activeDays, longest: stats.longest } : undefined,
    cvUrl: profile.cvUrl,
  };
}

export const RECRUITER_PATH = "/recruiter";
export const RESUME_PDF_PATH = "/recruiter/resume.pdf";
