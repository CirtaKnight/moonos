"use client";

import { motion } from "motion/react";
import { CornerDownLeft, Search } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";
import { apps, type AppId } from "../apps/registry";
import { openApp, openItem, openProject } from "../apps/launch";
import { useContent } from "../content/ContentProvider";
import { search, type SearchHit } from "../lib/search";
import { useUI } from "../store/ui";
import { AppIcon, FolderIcon } from "./AppIcon";
import { FileThumb } from "./FileIcons";

const searchableApps = (Object.keys(apps) as AppId[])
  .filter((id) => apps[id].listed || id === "bin")
  .map((id) => ({ id, name: apps[id].name, description: apps[id].description }));

const KIND_LABEL: Record<SearchHit["kind"], string> = { app: "App", project: "Project", file: "File" };

/** Ctrl/Cmd+K search across apps, projects and files. */
export function Spotlight() {
  const content = useContent();
  const closePanel = useUI((s) => s.closePanel);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const hits = useMemo(() => search(query, content, searchableApps), [query, content]);
  const selected = Math.min(active, Math.max(hits.length - 1, 0));

  function launch(hit: SearchHit) {
    if (hit.kind === "app") openApp(hit.id as AppId);
    else if (hit.kind === "project") openProject({ slug: hit.slug, title: hit.title });
    else openItem(hit.slug, hit.item);
    closePanel();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && hits[selected]) {
      launch(hits[selected]);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      className="absolute inset-0 z-[80] bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => {
        e.stopPropagation();
        closePanel();
      }}
    >
      <motion.div
        role="dialog"
        aria-label="Search"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 480, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="glass mx-auto mt-[12vh] w-[min(620px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line-strong shadow-window"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search projects, files and apps…"
            aria-label="Search"
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-fg placeholder:text-faint focus:outline-none"
          />
          <kbd className="rounded border border-line px-1.5 font-mono text-[10px] text-muted">Esc</kbd>
        </div>
        {query.trim() && (
          <ul className="scroll-area max-h-[min(420px,55vh)] p-2" role="listbox">
            {hits.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No results for “{query}”.</li>}
            {hits.map((hit, i) => (
              <li key={`${hit.kind}:${hit.title}:${i}`} role="option" aria-selected={i === selected}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => launch(hit)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                    i === selected ? "bg-accent/15" : ""
                  }`}
                >
                  {hit.kind === "app" ? (
                    <AppIcon icon={apps[hit.id as AppId].icon} tint={apps[hit.id as AppId].tint} size={30} />
                  ) : hit.kind === "project" ? (
                    <FolderIcon color={hit.color} size={30} />
                  ) : (
                    <FileThumb item={hit.item} size={30} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{hit.title}</span>
                    {hit.subtitle && <span className="block truncate text-xs text-muted">{hit.subtitle}</span>}
                  </span>
                  <span className="shrink-0 text-[10.5px] tracking-wider text-faint uppercase">{KIND_LABEL[hit.kind]}</span>
                  {i === selected && <CornerDownLeft size={14} className="shrink-0 text-muted" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </motion.div>
  );
}
