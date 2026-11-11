import type { OSContent, Place } from "../content/types";

export type PinKind = "project" | "experience" | "event";

export interface Pin {
  id: string;
  kind: PinKind;
  /** e.g. "Hackathon", "Internship". */
  label: string;
  title: string;
  subtitle?: string;
  place: Place;
  /** ISO date used for ordering (most recent first). */
  date?: string;
  dateText?: string;
  action?: { type: "project"; slug: string; title: string } | { type: "app"; app: string } | { type: "url"; href: string };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const monthYear = (d?: string) => {
  if (!d) return undefined;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

export function range(start?: string, end?: string, ongoing = false) {
  const a = monthYear(start);
  const b = end ? monthYear(end) : ongoing ? "now" : undefined;
  return a && b && a !== b ? `${a} – ${b}` : a;
}

/** Every item with a map pin, newest first. */
export function buildPins(content: Pick<OSContent, "projects" | "experiences" | "events">): Pin[] {
  const pins: Pin[] = [];
  for (const p of content.projects) {
    if (!p.place || p.archived) continue;
    pins.push({
      id: `project:${p.id}`,
      kind: "project",
      label: "Project",
      title: p.title,
      subtitle: p.summary,
      place: p.place,
      date: p.date,
      dateText: monthYear(p.date),
      action: { type: "project", slug: p.slug, title: p.title },
    });
  }
  for (const x of content.experiences) {
    if (!x.place) continue;
    pins.push({
      id: `experience:${x.id}`,
      kind: "experience",
      label: cap(x.kind),
      title: x.role,
      subtitle: x.organization,
      place: x.place,
      date: x.start,
      dateText: range(x.start, x.end, true),
      action: x.url ? { type: "url", href: x.url } : undefined,
    });
  }
  for (const e of content.events) {
    if (!e.place) continue;
    pins.push({
      id: `event:${e.id}`,
      kind: "event",
      label: cap(e.kind),
      title: e.title,
      subtitle: e.description,
      place: e.place,
      date: e.start,
      dateText: range(e.start, e.end),
      action: e.projectSlug ? { type: "project", slug: e.projectSlug, title: e.title } : { type: "app", app: "agenda" },
    });
  }
  return pins.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

/** [[west, south], [east, north]] around the pins, padded; null when there are none. */
export function pinBounds(pins: Pin[], pad = 2): [[number, number], [number, number]] | null {
  if (!pins.length) return null;
  const lats = pins.map((p) => p.place.lat);
  const lngs = pins.map((p) => p.place.lng);
  return [
    [Math.max(-180, Math.min(...lngs) - pad), Math.max(-85, Math.min(...lats) - pad)],
    [Math.min(180, Math.max(...lngs) + pad), Math.min(85, Math.max(...lats) + pad)],
  ];
}
