"use client";

import type { ReactNode } from "react";
import { apps } from "../apps/registry";
import { openApp, openProject } from "../apps/launch";
import { useContent, useProjects } from "../content/ContentProvider";
import { useUI } from "../store/ui";
import { useWindows } from "../store/windows";
import { AppIcon, DocIcon, FolderIcon } from "./AppIcon";

interface IconEntry {
  id: string;
  label: string;
  icon: ReactNode;
  open: () => void;
}

/** Desktop icon grid: flows top-to-bottom, then into the next column. */
export function DesktopIcons() {
  const projects = useProjects();
  const { projects: all } = useContent();
  const bounds = useWindows((s) => s.bounds);
  const selected = useUI((s) => s.selectedIcon);
  const select = useUI((s) => s.selectIcon);
  const binFull = all.some((p) => p.archived);

  const entries: IconEntry[] = [
    {
      id: "welcome",
      label: "Welcome.txt",
      icon: <DocIcon />,
      open: () => openApp("note", { welcome: 1 }, "Welcome.txt", "note:welcome"),
    },
    { id: "about", label: "About me", icon: <AppIcon icon={apps.about.icon} tint={apps.about.tint} />, open: () => openApp("about") },
    ...projects.map((p) => ({
      id: `project:${p.slug}`,
      label: p.title,
      icon: <FolderIcon color={p.color} />,
      open: () => openProject(p),
    })),
    { id: "cv", label: "Résumé.pdf", icon: <AppIcon icon={apps.cv.icon} tint={apps.cv.tint} />, open: () => openApp("cv") },
    { id: "terminal", label: "Terminal", icon: <AppIcon icon={apps.terminal.icon} tint={apps.terminal.tint} />, open: () => openApp("terminal") },
    {
      id: "bin",
      label: "Recycle Bin",
      icon: <AppIcon icon={apps.bin.icon} tint={binFull ? "#e9ecf3" : apps.bin.tint} />,
      open: () => openApp("bin"),
    },
  ];

  return (
    <ul
      aria-label="Desktop"
      className="absolute grid content-start justify-start gap-x-2 gap-y-1 p-3"
      style={{
        left: bounds.x,
        top: bounds.y,
        height: bounds.h,
        gridAutoFlow: "column",
        gridTemplateRows: "repeat(auto-fill, 100px)",
        gridAutoColumns: "92px",
      }}
    >
      {entries.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            data-icon={e.id}
            onClick={(ev) => {
              ev.stopPropagation();
              select(e.id);
              // Touch / pen: a single tap opens, like on a tablet.
              if ((ev.nativeEvent as PointerEvent).pointerType && (ev.nativeEvent as PointerEvent).pointerType !== "mouse") e.open();
            }}
            onDoubleClick={() => e.open()}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") e.open();
            }}
            className={`group flex h-[96px] w-[88px] flex-col items-center gap-1.5 rounded-lg px-1 pt-2 text-center outline-none transition-colors ${
              selected === e.id ? "bg-accent/18 ring-1 ring-accent/40" : "hover:bg-white/6"
            }`}
          >
            <span className="drop-shadow-[0_6px_10px_rgb(0_0_0/0.45)] transition-transform group-active:scale-95">
              {e.icon}
            </span>
            <span
              className={`line-clamp-2 max-w-full px-1 text-[11.5px] leading-tight text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.9)] ${
                selected === e.id ? "font-medium" : ""
              }`}
            >
              {e.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
