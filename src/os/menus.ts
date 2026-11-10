"use client";

import {
  ArrowDownAZ,
  CalendarClock,
  Code2,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  Info,
  Link2,
  Maximize2,
  Minimize2,
  Minus,
  Moon,
  PanelLeft,
  PanelRight,
  Pin,
  RefreshCw,
  Settings2,
  Shapes,
  SquareTerminal,
  Sun,
  X,
} from "lucide-react";
import { apps, type AppId } from "./apps/registry";
import { openApp } from "./apps/launch";
import type { OSContent } from "./content/types";
import { type DesktopEntry, sortEntries } from "./desktopEntries";
import { placeIcons } from "./lib/iconGrid";
import { copyText, shareUrl, sourceUrl } from "./lib/links";
import { unlock } from "./store/achievements";
import type { MenuEntry } from "./store/contextMenu";
import { useSettings } from "./store/settings";
import { useUI } from "./store/ui";
import { useWindows, type WindowInstance } from "./store/windows";

export function desktopMenu(content: OSContent, entries: DesktopEntry[], rows: number): MenuEntry[] {
  const s = useSettings.getState();
  const sortBy = (by: "name" | "date" | "type") => () =>
    s.setIconLayout(placeIcons(sortEntries(entries, by).map((e) => e.id), {}, rows));
  return [
    { label: "Open Terminal", icon: SquareTerminal, shortcut: "Alt T", onSelect: () => openApp("terminal") },
    { label: "Search", icon: FolderOpen, shortcut: "Ctrl K", onSelect: () => useUI.getState().togglePanel("search") },
    "separator",
    {
      label: "Wallpaper",
      icon: ImageIcon,
      submenu: content.settings.wallpapers.map((w) => ({
        label: w.name,
        checked: s.wallpaper === w.id,
        onSelect: () => s.setWallpaper(w.id),
      })),
    },
    {
      label: "Theme",
      icon: s.theme === "night" ? Moon : Sun,
      submenu: [
        { label: "Night", icon: Moon, checked: s.theme === "night", onSelect: () => s.setTheme("night") },
        { label: "Day", icon: Sun, checked: s.theme === "day", onSelect: () => s.setTheme("day") },
      ],
    },
    {
      label: "Sort icons by",
      icon: ArrowDownAZ,
      submenu: [
        { label: "Name", icon: ArrowDownAZ, onSelect: sortBy("name") },
        { label: "Date", icon: CalendarClock, onSelect: sortBy("date") },
        { label: "Type", icon: Shapes, onSelect: sortBy("type") },
      ],
    },
    { label: "Refresh", icon: RefreshCw, shortcut: "F5", onSelect: () => useUI.getState().refresh() },
    "separator",
    { label: "Settings", icon: Settings2, onSelect: () => openApp("settings") },
    { label: "About MoonOS", icon: Info, onSelect: () => openApp("settings", { section: "about" }, "Settings", "settings") },
    { label: "View source on GitHub", icon: ExternalLink, onSelect: () => window.open(sourceUrl(content), "_blank", "noopener") },
    "separator",
    {
      label: "Inspect element",
      icon: Code2,
      shortcut: "F12",
      onSelect: () => {
        unlock("inspector");
        openApp("terminal");
      },
    },
  ];
}

export function iconMenu(entry: DesktopEntry, selectedCount: number): MenuEntry[] {
  return [
    { label: selectedCount > 1 ? `Open ${selectedCount} items` : "Open", icon: FolderOpen, shortcut: "Enter", onSelect: () => openSelected(entry) },
    ...(entry.link
      ? [{ label: "Copy link", icon: Link2, onSelect: () => void copyText(shareUrl(entry.link!)) } as MenuEntry]
      : []),
    "separator",
    { label: "Get info", icon: Info, onSelect: () => openApp("info", entry.info, `${entry.label} — Info`, `info:${entry.id}`) },
  ];
}

/** Opens every selected icon when the clicked one is part of the selection. */
let selectionOpener: ((entry: DesktopEntry) => void) | null = null;
export function setSelectionOpener(fn: (entry: DesktopEntry) => void) {
  selectionOpener = fn;
}
function openSelected(entry: DesktopEntry) {
  if (selectionOpener) selectionOpener(entry);
  else entry.open();
}

export function windowMenu(win: WindowInstance): MenuEntry[] {
  const w = useWindows.getState();
  const full = win.maximized || win.snap !== null;
  return [
    { label: "Minimize", icon: Minus, shortcut: "Alt M", onSelect: () => w.minimize(win.id) },
    { label: full ? "Restore" : "Maximize", icon: full ? Minimize2 : Maximize2, shortcut: "Alt ↵", onSelect: () => w.toggleMaximize(win.id) },
    { label: "Snap left", icon: PanelLeft, shortcut: "Alt ←", onSelect: () => w.snapTo(win.id, "left") },
    { label: "Snap right", icon: PanelRight, shortcut: "Alt →", onSelect: () => w.snapTo(win.id, "right") },
    { label: "Always on top", icon: Pin, checked: Boolean(win.pinned), onSelect: () => w.togglePin(win.id) },
    "separator",
    { label: "Close", icon: X, shortcut: "Alt Q", danger: true, onSelect: () => w.close(win.id) },
  ];
}

export function dockMenu(appId: AppId): MenuEntry[] {
  const { windows, focus, close } = useWindows.getState();
  const own = windows.filter((w) => w.appId === appId);
  return [
    ...own.map<MenuEntry>((w) => ({ label: w.title, onSelect: () => focus(w.id) })),
    ...(own.length ? (["separator"] as MenuEntry[]) : []),
    { label: own.length ? `Open ${apps[appId].name}` : "Open", icon: FolderOpen, onSelect: () => openApp(appId) },
    { label: "Get info", icon: Info, onSelect: () => openApp("info", { app: appId }, `${apps[appId].name} — Info`, `info:${appId}`) },
    ...(own.length
      ? (["separator", { label: own.length > 1 ? "Close all" : "Close", icon: X, danger: true, onSelect: () => own.forEach((w) => close(w.id)) }] as MenuEntry[])
      : []),
  ];
}
