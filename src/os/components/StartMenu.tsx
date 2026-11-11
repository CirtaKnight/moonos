"use client";

import { motion } from "motion/react";
import { ChevronRight, Keyboard, Lock, Power, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { apps, type AppId } from "../apps/registry";
import { openApp, openProject } from "../apps/launch";
import { useContent, useProjects } from "../content/ContentProvider";
import { usePower } from "../store/power";
import { useSettings } from "../store/settings";
import { useUI } from "../store/ui";
import { AppIcon, FolderIcon } from "./AppIcon";
import { Avatar } from "./Avatar";
import { DOCK_RESERVED, MENUBAR_H, TASKBAR_H } from "./Shell";

export function StartMenu() {
  const { profile } = useContent();
  const projects = useProjects();
  const layout = useSettings((s) => s.layout);
  const closePanel = useUI((s) => s.closePanel);
  const togglePanel = useUI((s) => s.togglePanel);
  const { restart, shutdown, lock } = usePower.getState();
  const [powerOpen, setPowerOpen] = useState(false);

  const listed = (Object.keys(apps) as AppId[]).filter((id) => apps[id].listed && id !== "about");
  const recent = [...projects]
    .sort((a, b) => (b.publishedAt ?? b.date ?? "").localeCompare(a.publishedAt ?? a.date ?? ""))
    .slice(0, 4);

  const launch = (fn: () => void) => {
    fn();
    closePanel();
  };

  const position =
    layout === "taskbar"
      ? { left: 8, bottom: TASKBAR_H + 8 }
      : { left: "50%", bottom: DOCK_RESERVED + 4, x: "-50%" };

  return (
    <motion.div
      role="dialog"
      aria-label="Start menu"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ type: "spring", stiffness: 460, damping: 34 }}
      onClick={(e) => e.stopPropagation()}
      className="glass absolute z-[70] flex w-[min(560px,calc(100vw-16px))] flex-col overflow-hidden rounded-2xl border border-line-strong shadow-window"
      style={{ ...position, maxHeight: `calc(100dvh - ${MENUBAR_H + DOCK_RESERVED + 24}px)` }}
    >
      {/* Search */}
      <div className="p-4 pb-3">
        <button
          type="button"
          onClick={() => togglePanel("search")}
          className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3 text-left text-sm text-muted transition-colors hover:border-line-strong"
        >
          <Search size={16} />
          Search projects, files and apps
          <kbd className="ml-auto rounded border border-line px-1.5 font-mono text-[10px]">Ctrl K</kbd>
        </button>
      </div>

      <div className="scroll-area min-h-0 flex-1 px-4">
        {/* Profile → About me */}
        <button
          type="button"
          onClick={() => launch(() => openApp("about"))}
          className="group flex w-full items-center gap-3.5 rounded-xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-hover"
        >
          <Avatar profile={profile} size={52} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-fg">{profile.name}</span>
            <span className="block truncate text-sm text-muted">{profile.title}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-accent opacity-80 group-hover:opacity-100">
            About me <ChevronRight size={14} />
          </span>
        </button>

        <h3 className="mt-5 mb-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Apps</h3>
        <ul className="grid grid-cols-4 gap-1 sm:grid-cols-6">
          {listed.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => launch(() => openApp(id))}
                className="flex w-full flex-col items-center gap-1.5 rounded-lg p-2 text-center transition-colors hover:bg-surface-hover"
              >
                <AppIcon icon={apps[id].icon} tint={apps[id].tint} size={40} />
                <span className="text-[11.5px] leading-tight text-fg">{apps[id].name}</span>
              </button>
            </li>
          ))}
        </ul>

        <h3 className="mt-4 mb-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Recent projects</h3>
        {recent.length ? (
          <ul className="mb-3">
            {recent.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => launch(() => openProject(p))}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-surface-hover"
                >
                  <FolderIcon color={p.color} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{p.title}</span>
                    {p.summary && <span className="block truncate text-xs text-muted">{p.summary}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 px-2 py-3 text-sm text-muted">No projects yet. The first ones are on their way.</p>
        )}
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between border-t border-line bg-surface-2 px-3 py-2">
        <button
          type="button"
          onClick={() => togglePanel("shortcuts")}
          className="mr-auto flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-fg"
        >
          <Keyboard size={16} /> Shortcuts
        </button>
        <div className="relative">
          {powerOpen && (
            <div className="glass absolute right-0 bottom-11 w-44 overflow-hidden rounded-xl border border-line-strong p-1 shadow-window">
              <button
                type="button"
                onClick={() => launch(() => lock("lock"))}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg hover:bg-surface-hover"
              >
                <Lock size={15} /> Lock
                <kbd className="ml-auto font-mono text-[10px] text-faint">Alt L</kbd>
              </button>
              <button
                type="button"
                onClick={() => launch(restart)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg hover:bg-surface-hover"
              >
                <RotateCcw size={15} /> Restart
              </button>
              <button
                type="button"
                onClick={() => launch(shutdown)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg hover:bg-surface-hover"
              >
                <Power size={15} /> Shut down
              </button>
            </div>
          )}
          <button
            type="button"
            aria-label="Power"
            aria-expanded={powerOpen}
            onClick={() => setPowerOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-fg"
          >
            <Power size={17} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
