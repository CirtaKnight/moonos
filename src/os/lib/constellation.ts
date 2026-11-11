import type { OSContent } from "../content/types";
import { seeded } from "./pointer";

export interface SkillUse {
  kind: "project" | "experience";
  id: string;
  title: string;
  slug?: string;
}

export interface SkillNode {
  id: string;
  label: string;
  /** How many projects / experiences use it (0 = listed in the profile only). */
  weight: number;
  uses: SkillUse[];
  x: number;
  y: number;
}

export interface SkillEdge {
  a: string;
  b: string;
  /** Number of projects / experiences the two skills share. */
  weight: number;
}

const keyOf = (s: string) => s.trim().toLowerCase();

/**
 * Skills from the profile, project tags and experience skills, joined into constellations
 * by co-occurrence: two skills are linked when a project or experience used both.
 */
export function buildConstellation(content: Pick<OSContent, "profile" | "projects" | "experiences">) {
  const nodes = new Map<string, Omit<SkillNode, "x" | "y">>();
  const edges = new Map<string, SkillEdge>();

  const touch = (label: string) => {
    const k = keyOf(label);
    if (!k) return null;
    if (!nodes.has(k)) nodes.set(k, { id: k, label: label.trim(), weight: 0, uses: [] });
    return nodes.get(k)!;
  };
  for (const s of content.profile.skills) touch(s);

  const groups: { use: SkillUse; skills: string[] }[] = [
    ...content.projects
      .filter((p) => !p.archived)
      .map((p) => ({ use: { kind: "project" as const, id: p.id, title: p.title, slug: p.slug }, skills: p.tags })),
    ...content.experiences.map((x) => ({
      use: { kind: "experience" as const, id: x.id, title: `${x.role} · ${x.organization}` },
      skills: x.skills,
    })),
  ];

  for (const { use, skills } of groups) {
    const ids = [...new Set(skills.map((s) => touch(s)?.id).filter((x): x is string => !!x))];
    for (const id of ids) {
      const n = nodes.get(id)!;
      n.weight++;
      n.uses.push(use);
    }
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const [a, b] = [ids[i], ids[j]].sort();
        const k = `${a}|${b}`;
        const e = edges.get(k) ?? { a, b, weight: 0 };
        e.weight++;
        edges.set(k, e);
      }
    }
  }

  const list = [...nodes.values()];
  const positions = arrange(list.map((n) => n.id), [...edges.values()]);
  return {
    nodes: list.map((n) => ({ ...n, ...positions.get(n.id)! })),
    edges: [...edges.values()],
  };
}

/**
 * Deterministic Fruchterman–Reingold layout in the unit square, with gravity so unlinked
 * skills float around the constellations instead of being pushed into the corners.
 * Same input → same sky.
 */
export function layout(ids: string[], edges: SkillEdge[], iterations = 400) {
  const n = Math.max(ids.length, 1);
  const rand = seeded(n * 7919 + edges.length);
  // Start on a golden-angle spiral: evenly spread, no initial overlaps.
  const pos = new Map(
    ids.map((id, i) => {
      const r = 0.38 * Math.sqrt((i + 0.5) / n);
      const a = i * 2.39996 + rand() * 0.2;
      return [id, { x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) }];
    }),
  );
  const k = 0.75 * Math.sqrt(1 / n);
  const degree = new Map(ids.map((id) => [id, 0]));
  for (const e of edges) {
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
    degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
  }
  for (let it = 0; it < iterations; it++) {
    const temp = 0.08 * (1 - it / iterations) + 0.001;
    const disp = new Map(ids.map((id) => [id, { x: 0, y: 0 }]));
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos.get(ids[i])!;
        const b = pos.get(ids[j])!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
        const f = (k * k) / d;
        disp.get(ids[i])!.x += (dx / d) * f;
        disp.get(ids[i])!.y += (dy / d) * f;
        disp.get(ids[j])!.x -= (dx / d) * f;
        disp.get(ids[j])!.y -= (dy / d) * f;
      }
    }
    for (const e of edges) {
      const a = pos.get(e.a)!;
      const b = pos.get(e.b)!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
      const f = ((d * d) / k) * (1 + Math.min(e.weight, 3) * 0.25);
      disp.get(e.a)!.x -= (dx / d) * f;
      disp.get(e.a)!.y -= (dy / d) * f;
      disp.get(e.b)!.x += (dx / d) * f;
      disp.get(e.b)!.y += (dy / d) * f;
    }
    for (const id of ids) {
      const p = pos.get(id)!;
      const v = disp.get(id)!;
      // Lone stars get a stronger pull so they orbit the constellations, not the corners.
      const gravity = degree.get(id) ? 2.2 : 5.5;
      v.x += (0.5 - p.x) * gravity * k;
      v.y += (0.5 - p.y) * gravity * k;
      const len = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
      const step = Math.min(len, temp);
      p.x = Math.min(0.92, Math.max(0.08, p.x + (v.x / len) * step));
      p.y = Math.min(0.9, Math.max(0.1, p.y + (v.y / len) * step));
    }
  }
  return pos;
}

/**
 * Composition: connected skills form the constellation in the centre (force layout, scaled to
 * fit); skills with no links sit evenly on an outer ring, like a zodiac around it.
 */
export function arrange(ids: string[], edges: SkillEdge[]) {
  const linked = new Set(edges.flatMap((e) => [e.a, e.b]));
  const core = ids.filter((id) => linked.has(id));
  const lone = ids.filter((id) => !linked.has(id)).sort();
  const out = new Map<string, { x: number; y: number }>();

  if (core.length) {
    const raw = layout(core, edges);
    const xs = core.map((id) => raw.get(id)!.x);
    const ys = core.map((id) => raw.get(id)!.y);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const span = Math.max(maxX - minX, maxY - minY, 1e-3);
    // Fit inside the inner disc (smaller when there's a ring around it).
    const box = lone.length ? 0.42 : 0.7;
    for (const id of core) {
      const p = raw.get(id)!;
      out.set(id, {
        x: 0.5 + ((p.x - (minX + maxX) / 2) / span) * box,
        y: 0.5 + ((p.y - (minY + maxY) / 2) / span) * box * 0.9,
      });
    }
  }
  lone.forEach((id, i) => {
    const a = -Math.PI / 2 + (i / lone.length) * Math.PI * 2 + (core.length ? Math.PI / lone.length : 0);
    const r = core.length ? 1 : 0.6;
    out.set(id, { x: 0.5 + Math.cos(a) * 0.41 * r, y: 0.5 + Math.sin(a) * 0.38 * r });
  });
  return out;
}
