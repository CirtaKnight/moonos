"use client";

import type { ReactNode } from "react";
import { apps, type AppId } from "./apps/registry";
import { openApp, openProject } from "./apps/launch";
import { AppIcon, DocIcon, FolderIcon } from "./components/AppIcon";
import { useContent, useProjects } from "./content/ContentProvider";

export interface DesktopEntry {
  id: string;
  label: string;
  kind: "document" | "app" | "folder" | "system";
  icon: ReactNode;
  /** Used for "Sort by date". */
  date?: string;
  /** `?open=` value for "Copy link", if shareable. */
  link?: string;
  /** Params for the Get info window. */
  info: Record<string, string>;
  open: () => void;
}

function appEntry(id: AppId, label = apps[id].name, kind: DesktopEntry["kind"] = "app", tint?: string): DesktopEntry {
  return {
    id,
    label,
    kind,
    icon: <AppIcon icon={apps[id].icon} tint={tint ?? apps[id].tint} />,
    link: id,
    info: { app: id },
    open: () => openApp(id),
  };
}

/** Everything that lives on the desktop, in default order. */
export function useDesktopEntries(): DesktopEntry[] {
  const projects = useProjects();
  const { projects: all } = useContent();
  const binFull = all.some((p) => p.archived);
  return [
    {
      id: "welcome",
      label: "Welcome.txt",
      kind: "document",
      icon: <DocIcon />,
      info: { doc: "welcome" },
      open: () => openApp("note", { welcome: 1 }, "Welcome.txt", "note:welcome"),
    },
    appEntry("about"),
    ...projects.map<DesktopEntry>((p) => ({
      id: `project:${p.slug}`,
      label: p.title,
      kind: "folder",
      icon: <FolderIcon color={p.color} />,
      date: p.date ?? p.publishedAt,
      link: `project/${p.slug}`,
      info: { project: p.slug },
      open: () => openProject(p),
    })),
    appEntry("games", "Games"),
    appEntry("agenda"),
    appEntry("cv", "Résumé.pdf", "document"),
    appEntry("terminal"),
    appEntry("trophies"),
    appEntry("bin", "Recycle Bin", "system", binFull ? "#e9ecf3" : undefined),
  ];
}

export function sortEntries(entries: DesktopEntry[], by: "name" | "date" | "type"): DesktopEntry[] {
  const order = { document: 0, folder: 1, app: 2, system: 3 };
  const sorted = [...entries].sort((a, b) => {
    if (by === "name") return a.label.localeCompare(b.label);
    if (by === "date") return (b.date ?? "").localeCompare(a.date ?? "");
    return order[a.kind] - order[b.kind] || a.label.localeCompare(b.label);
  });
  // The bin always ends up last, like on a real desktop.
  return [...sorted.filter((e) => e.id !== "bin"), ...sorted.filter((e) => e.id === "bin")];
}
