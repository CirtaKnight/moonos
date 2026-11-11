/**
 * The content the OS renders. Shape is CMS-agnostic: Sanity queries map into these
 * types, and `fallback.ts` provides a complete default so the site works with no CMS.
 */

export type ItemKind = "pdf" | "image" | "video" | "embed" | "link" | "note";

export interface ProjectItem {
  id: string;
  kind: ItemKind;
  title: string;
  caption?: string;
  /** File URL (pdf/image/video), page URL (link) or YouTube/Vimeo URL (embed). */
  url?: string;
  /** Plain text for notes. */
  text?: string;
  width?: number;
  height?: number;
}

export interface RepoStats {
  url: string;
  fullName: string;
  description?: string;
  stars?: number;
  forks?: number;
  language?: string;
  pushedAt?: string;
}

export interface Place {
  name?: string;
  lat: number;
  lng: number;
}

export type ExperienceKind = "internship" | "job" | "freelance" | "club" | "volunteering" | "education";

export interface Experience {
  id: string;
  role: string;
  organization: string;
  kind: ExperienceKind;
  start: string;
  end?: string;
  place?: Place;
  description?: string;
  skills: string[];
  url?: string;
  logoUrl?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  description?: string;
  tags: string[];
  date?: string;
  coverUrl?: string;
  /** Optional accent color for the folder icon (hex). */
  color?: string;
  archived: boolean;
  publishedAt?: string;
  items: ProjectItem[];
  /** GitHub repository, with live stats when available. */
  repo?: RepoStats;
  place?: Place;
}

export interface MediaEntry {
  id: string;
  kind: "image" | "video" | "embed";
  title: string;
  caption?: string;
  url: string;
  width?: number;
  height?: number;
}

export interface Social {
  id: string;
  platform: string;
  handle: string;
  url: string;
  description?: string;
}

export interface Track {
  id: string;
  title: string;
  artist?: string;
  url: string;
}

export interface Education {
  school: string;
  degree: string;
  period?: string;
}

export interface Profile {
  name: string;
  handle: string;
  title: string;
  avatarUrl?: string;
  shortBio: string;
  /** Paragraphs of the long bio. */
  bio: string[];
  skills: string[];
  education: Education[];
  location?: string;
  email?: string;
  cvUrl?: string;
  available?: boolean;
  /** GitHub account used for the live activity feed. */
  githubUsername?: string;
}

export interface Wallpaper {
  id: string;
  name: string;
  /** Image URL; built-in wallpapers are drawn in CSS and have no URL. */
  url?: string;
}

export interface SiteSettings {
  bootLines: string[];
  welcomeNote: string;
  weatherCity?: { name: string; latitude: number; longitude: number };
  wallpapers: Wallpaper[];
}

export interface ActivityItem {
  id: string;
  kind: "push" | "create" | "release" | "pr" | "star" | "fork";
  title: string;
  body?: string;
  url: string;
  at: string;
  repo: string;
}

export type AnnouncementSource = "linkedin" | "github" | "trophy" | "calendar" | "star" | "generic";

export interface Announcement {
  id: string;
  title: string;
  body?: string;
  url?: string;
  linkLabel?: string;
  source: AnnouncementSource;
  publishedAt: string;
}

export type EventKind = "project" | "event" | "hackathon" | "competition" | "talk" | "exam" | "other";

export interface AgendaEvent {
  id: string;
  title: string;
  kind: EventKind;
  start: string;
  end?: string;
  location?: string;
  url?: string;
  description?: string;
  projectSlug?: string;
  place?: Place;
}

export interface OSContent {
  profile: Profile;
  projects: Project[];
  media: MediaEntry[];
  socials: Social[];
  tracks: Track[];
  settings: SiteSettings;
  /** Live public GitHub activity (may be empty). */
  activity: ActivityItem[];
  announcements: Announcement[];
  events: AgendaEvent[];
  experiences: Experience[];
  /** "cms" when served from Sanity, "fallback" when using built-in defaults. */
  source: "cms" | "fallback";
}
