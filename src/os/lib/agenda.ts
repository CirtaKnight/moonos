import type { AgendaEvent, EventKind } from "../content/types";

/** "YYYY-MM-DD" for a local date. */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Parse "YYYY-MM-DD" as a local date (avoids the UTC shift of `new Date("2026-01-02")`). */
export function parseDay(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** 6×7 grid of dates for a month view, weeks starting on Monday. */
export function monthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)),
  );
}

/** Events active on a given day (multi-day events span start..end inclusive). */
export function eventsOn(day: Date, events: AgendaEvent[]): AgendaEvent[] {
  const k = dayKey(day);
  return events.filter((e) => {
    const s = e.start.slice(0, 10);
    const end = (e.end ?? e.start).slice(0, 10);
    return k >= s && k <= end;
  });
}

/** Upcoming (soonest first) and past (most recent first), relative to `today`. */
export function splitTimeline(events: AgendaEvent[], today: Date) {
  const k = dayKey(today);
  const upcoming = events.filter((e) => (e.end ?? e.start).slice(0, 10) >= k).sort((a, b) => a.start.localeCompare(b.start));
  const past = events.filter((e) => (e.end ?? e.start).slice(0, 10) < k).sort((a, b) => b.start.localeCompare(a.start));
  return { upcoming, past };
}

/** "in 3 days", "today", "tomorrow", "2 weeks ago"… */
export function relativeDay(dateStr: string, today: Date): string {
  const diff = Math.round((parseDay(dateStr).getTime() - parseDay(dayKey(today)).getTime()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  const abs = Math.abs(diff);
  const unit = abs >= 60 ? [Math.round(abs / 30), "month"] : abs >= 14 ? [Math.round(abs / 7), "week"] : [abs, "day"];
  const label = `${unit[0]} ${unit[1]}${unit[0] === 1 ? "" : "s"}`;
  return diff > 0 ? `in ${label}` : `${label} ago`;
}

export const KIND_STYLE: Record<EventKind, { label: string; color: string }> = {
  project: { label: "Project", color: "#8ea7dc" },
  event: { label: "Event", color: "#9fc3e8" },
  hackathon: { label: "Hackathon", color: "#c8a96f" },
  competition: { label: "Competition", color: "#f29fb8" },
  talk: { label: "Talk", color: "#9fe0b8" },
  exam: { label: "Exam", color: "#e8a6a6" },
  other: { label: "Other", color: "#b8bfcc" },
};
