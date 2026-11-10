import type { OSContent, ProjectItem } from "../content/types";

export type SearchHit =
  | { kind: "app"; id: string; title: string; subtitle?: string; score: number }
  | { kind: "project"; slug: string; title: string; subtitle?: string; color?: string; score: number }
  | { kind: "file"; slug: string; item: ProjectItem; title: string; subtitle: string; score: number };

export interface SearchableApp {
  id: string;
  name: string;
  description?: string;
}

/** Score how well `query` matches `text`: prefix > word-prefix > substring > subsequence. */
export function scoreText(query: string, text: string | undefined): number {
  if (!text) return 0;
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.split(/[\s\-_./]+/).some((w) => w.startsWith(q))) return 60;
  if (t.includes(q)) return 40;
  // Subsequence (e.g. "ckos" → "MoonOS")
  let i = 0;
  for (const ch of t) if (ch === q[i]) i++;
  return i === q.length ? 15 : 0;
}

export function search(query: string, content: OSContent, apps: SearchableApp[], limit = 12): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const hits: SearchHit[] = [];

  for (const app of apps) {
    const score = Math.max(scoreText(q, app.name), scoreText(q, app.description) * 0.6);
    if (score) hits.push({ kind: "app", id: app.id, title: app.name, subtitle: app.description, score: score + 5 });
  }

  for (const p of content.projects) {
    if (p.archived) continue;
    const score = Math.max(
      scoreText(q, p.title),
      scoreText(q, p.summary) * 0.6,
      ...p.tags.map((t) => scoreText(q, t) * 0.7),
    );
    if (score) hits.push({ kind: "project", slug: p.slug, title: p.title, subtitle: p.summary, color: p.color, score: score + 3 });
    for (const item of p.items) {
      const s = Math.max(scoreText(q, item.title), scoreText(q, item.caption) * 0.5);
      if (s) hits.push({ kind: "file", slug: p.slug, item, title: item.title, subtitle: `in ${p.title}`, score: s });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
