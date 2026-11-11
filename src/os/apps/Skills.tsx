"use client";

import { motion } from "motion/react";
import { Briefcase, FolderOpen, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useContent } from "../content/ContentProvider";
import { buildConstellation } from "../lib/constellation";
import { openApp, openProject } from "./launch";
import type { AppProps } from "./types";
import { EmptyState } from "./ui";

/** Skills as a night sky: brighter stars are used more; lines join skills used together. */
export function Skills(_props: AppProps) {
  void _props;
  const content = useContent();
  const { nodes, edges } = useMemo(() => buildConstellation(content), [content]);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const focus = hover ?? selected;

  if (!nodes.length) {
    return <EmptyState title="The sky is still dark">Skills will light up here as they&apos;re added to the profile and projects.</EmptyState>;
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const linked = new Set(focus ? edges.filter((e) => e.a === focus || e.b === focus).flatMap((e) => [e.a, e.b]) : []);
  const sel = selected ? byId.get(selected) : null;
  const maxW = Math.max(1, ...nodes.map((n) => n.weight));

  return (
    <div className="relative h-full overflow-hidden bg-[radial-gradient(120%_90%_at_70%_10%,#0d1426,#04060c_70%)]" onClick={() => setSelected(null)}>
      <svg viewBox="0 0 1000 640" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Skills constellation">
        {/* Background dust */}
        {Array.from({ length: 80 }, (_, i) => (
          <circle key={i} cx={(i * 137.5) % 1000} cy={(i * 71.3 + (i % 9) * 40) % 640} r={i % 7 === 0 ? 1.2 : 0.6} fill="#e9ecf3" opacity={0.15 + ((i * 13) % 30) / 100} />
        ))}
        {edges.map((e) => {
          const a = byId.get(e.a)!;
          const b = byId.get(e.b)!;
          const on = focus && (e.a === focus || e.b === focus);
          return (
            <line
              key={`${e.a}|${e.b}`}
              x1={a.x * 1000}
              y1={a.y * 640}
              x2={b.x * 1000}
              y2={b.y * 640}
              stroke={on ? "#c8a96f" : "#bccbeb"}
              strokeOpacity={focus ? (on ? 0.85 : 0.08) : 0.22 + Math.min(e.weight, 3) * 0.08}
              strokeWidth={on ? 1.6 : 1}
              style={{ transition: "stroke-opacity 200ms" }}
            />
          );
        })}
        {nodes.map((n) => {
          const r = 3 + (n.weight / maxW) * 6;
          const dim = focus && n.id !== focus && !linked.has(n.id);
          const active = n.id === focus;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x * 1000} ${n.y * 640})`}
              onPointerEnter={() => setHover(n.id)}
              onPointerLeave={() => setHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(n.id);
              }}
              role="button"
              tabIndex={0}
              aria-label={`${n.label}: used in ${n.weight} ${n.weight === 1 ? "place" : "places"}`}
              onKeyDown={(e) => e.key === "Enter" && setSelected(n.id)}
              style={{ cursor: "pointer", opacity: dim ? 0.3 : 1, transition: "opacity 200ms" }}
            >
              <circle r={r * 3.2} fill={active ? "#c8a96f" : "#bccbeb"} opacity={0.1} />
              <circle r={r} fill={active ? "#c8a96f" : n.weight ? "#e9ecf3" : "#8c94a8"} />
              <text y={r + 15} textAnchor="middle" fontSize="13" fill={active ? "#e9ecf3" : "#a8b0c2"} fontFamily="var(--font-sans)">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="pointer-events-none absolute top-3 left-4 text-xs text-[#6f7890]">
        Brighter stars are used more · lines join skills used together
      </p>

      {sel && (
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass absolute top-3 right-3 bottom-3 flex w-64 flex-col rounded-2xl border border-line-strong p-4 shadow-window"
        >
          <button type="button" aria-label="Close" onClick={() => setSelected(null)} className="absolute top-2 right-2 grid size-7 place-items-center rounded-md text-muted hover:bg-surface-hover">
            <X size={14} />
          </button>
          <h3 className="pr-6 text-lg font-semibold text-fg">{sel.label}</h3>
          <p className="text-xs text-muted">
            {sel.weight ? `Used in ${sel.weight} ${sel.weight === 1 ? "place" : "places"}` : "Listed in the profile"}
            {linked.size > 1 ? ` · often with ${[...linked].filter((x) => x !== sel.id).slice(0, 3).map((x) => byId.get(x)!.label).join(", ")}` : ""}
          </p>
          <ul className="scroll-area mt-3 flex min-h-0 flex-1 flex-col gap-1">
            {sel.uses.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => (u.slug ? openProject({ slug: u.slug, title: u.title }) : openApp("map"))}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm text-fg hover:bg-surface-hover"
                >
                  {u.kind === "project" ? <FolderOpen size={14} className="shrink-0 text-accent" /> : <Briefcase size={14} className="shrink-0 text-gold" />}
                  <span className="truncate">{u.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.aside>
      )}
    </div>
  );
}
