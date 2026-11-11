"use client";

import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { FolderIcon } from "../components/AppIcon";
import { useProjects } from "../content/ContentProvider";
import { openProject } from "./launch";
import type { AppProps } from "./types";
import { EmptyState, Scroll, Tag, formatMonth } from "./ui";

/** Explorer listing every project, with a tag filter and grid/list views. */
export function Projects(_props: AppProps) {
  void _props;
  const projects = useProjects();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [tag, setTag] = useState<string | null>(null);
  const tags = [...new Set(projects.flatMap((p) => p.tags))].sort();
  const shown = tag ? projects.filter((p) => p.tags.includes(tag)) : projects;

  if (!projects.length) {
    return <EmptyState title="No projects yet">The first projects are being polished. Check back soon.</EmptyState>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <div className="scroll-area flex min-w-0 flex-1 gap-1.5 overflow-x-auto py-0.5">
          <FilterChip active={!tag} onClick={() => setTag(null)}>
            All · {projects.length}
          </FilterChip>
          {/* Tag filters only help once there is something to filter. */}
          {projects.length >= 4 && tags.map((t) => (
            <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>
              {t}
            </FilterChip>
          ))}
        </div>
        <div className="flex shrink-0 rounded-lg border border-line p-0.5">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-label={`${v} view`}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`grid size-7 place-items-center rounded-md ${view === v ? "bg-surface-hover text-fg" : "text-muted"}`}
            >
              {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Scroll>
          {view === "grid" ? (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 p-4">
              {shown.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => openProject(p)}
                    className="flex h-full w-full flex-col gap-3 rounded-xl border border-line bg-surface-2 p-4 text-left transition-colors hover:border-line-strong hover:bg-surface-hover"
                  >
                    <div className="flex items-center gap-3">
                      <FolderIcon color={p.color} size={40} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-fg">{p.title}</p>
                        <p className="text-xs text-faint">
                          {p.items.length} file{p.items.length === 1 ? "" : "s"}
                          {p.date ? ` · ${formatMonth(p.date)}` : ""}
                        </p>
                      </div>
                    </div>
                    {p.summary && <p className="line-clamp-2 text-[13px] text-muted">{p.summary}</p>}
                    <div className="mt-auto flex flex-wrap gap-1">
                      {p.tags.slice(0, 4).map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-solid text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="hidden px-4 py-2 font-medium sm:table-cell">Tags</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr
                    key={p.slug}
                    onClick={() => openProject(p)}
                    className="cursor-pointer border-t border-line hover:bg-surface-hover"
                  >
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-2.5 text-fg">
                        <FolderIcon color={p.color} size={22} /> {p.title}
                      </span>
                    </td>
                    <td className="hidden truncate px-4 py-2 text-muted sm:table-cell">{p.tags.join(", ")}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-muted">{formatMonth(p.date) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Scroll>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors ${
        active ? "border-accent/60 bg-accent/15 text-fg" : "border-line text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
