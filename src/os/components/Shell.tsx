"use client";

import { HOST_BADGE, useHostBadge } from "../hooks";
import { RecruiterButton } from "./RecruiterButton";
import { motion } from "motion/react";
import { useState } from "react";
import { apps, type AppId } from "../apps/registry";
import { openApp } from "../apps/launch";
import { dockMenu } from "../menus";
import { contextMenuProps } from "../store/contextMenu";
import { useUI } from "../store/ui";
import { useWindows, type WindowInstance } from "../store/windows";
import type { Glyph } from "./AppGlyphs";
import { AppIcon } from "./AppIcon";
import { LogoMark } from "./Logo";
import { Clock, MoonIndicator, TrayActions } from "./Tray";

export const MENUBAR_H = 32;
export const DOCK_RESERVED = 84;
export const TASKBAR_H = 52;

interface ShellEntry {
  appId: AppId;
  windows: WindowInstance[];
}

/** Pinned apps first, then any other running app, in launch order. */
function useShellEntries(): ShellEntry[] {
  const windows = useWindows((s) => s.windows);
  const pinned = (Object.keys(apps) as AppId[]).filter((id) => apps[id].pinned);
  const running = [...new Set(windows.map((w) => w.appId as AppId))].filter((id) => !pinned.includes(id));
  return [...pinned, ...running].map((appId) => ({
    appId,
    windows: windows.filter((w) => w.appId === appId),
  }));
}

function activateEntry(entry: ShellEntry) {
  const { windows, focusedId, activate } = useWindows.getState();
  if (!entry.windows.length) {
    openApp(entry.appId);
    return;
  }
  // Cycle: if one of this app's windows is focused, minimize it / go to the next; else raise the topmost.
  const own = windows.filter((w) => w.appId === entry.appId).sort((a, b) => b.z - a.z);
  const focusedOwn = own.find((w) => w.id === focusedId);
  if (focusedOwn && own.length > 1) {
    useWindows.getState().focus(own[own.length - 1].id);
  } else {
    activate((focusedOwn ?? own[0]).id);
  }
}

/** The MoonOS mark as a tile glyph, so the launcher shares the app-icon recipe. */
const LogoGlyph: Glyph = ({ size = 24 }) => <LogoMark variant="glyph" size={size} />;
const LAUNCHER_GLOW = "#8ea7dc";

/**
 * Start button. `tile` (taskbar): the same 40px button and 28px tile as the app entries, so
 * it reads as "the first app, but special". `bare` (menu bar): just the solid mark.
 */
function StartButton({ variant }: { variant: "tile" | "bare" }) {
  const panel = useUI((s) => s.panel);
  const togglePanel = useUI((s) => s.togglePanel);
  const open = panel === "start";
  return (
    <button
      type="button"
      aria-label="Start menu"
      aria-expanded={open}
      title="Start"
      onClick={(e) => {
        e.stopPropagation();
        togglePanel("start");
      }}
      className={`grid shrink-0 place-items-center rounded-md transition-colors hover:bg-surface-hover ${
        variant === "tile" ? "size-10" : "h-7 w-8"
      } ${open ? "bg-surface-hover" : ""}`}
    >
      {variant === "tile" ? <AppIcon icon={LogoGlyph} tint={LAUNCHER_GLOW} size={28} /> : <LogoMark variant="glyph" size={17} />}
    </button>
  );
}

/* ---------------------------------- Dock layout ---------------------------------- */

export function MenuBar() {
  const focusedTitle = useWindows((s) => {
    const w = s.windows.find((x) => x.id === s.focusedId);
    return w ? apps[w.appId as AppId]?.name ?? w.title : null;
  });
  return (
    <header
      className="glass absolute inset-x-0 top-0 z-[60] flex items-center gap-3 border-b border-line px-2 text-fg"
      style={{ height: MENUBAR_H }}
    >
      <StartButton variant="bare" />
      <span className="text-[13px] font-semibold tracking-tight">{focusedTitle ?? "MoonOS"}</span>
      <div className="ml-auto flex items-center gap-1">
        <RecruiterButton size="sm" className="mr-2" />
        <TrayActions />
        <span className="mx-1 h-4 w-px bg-line" />
        <MoonIndicator />
        <span className="ml-2 pr-1">
          <Clock />
        </span>
      </div>
    </header>
  );
}

export function Dock() {
  const entries = useShellEntries();
  const focusedId = useWindows((s) => s.focusedId);
  const binOpen = useWindows((s) => s.windows.some((w) => w.appId === "bin"));
  return (
    <nav aria-label="Dock" className="pointer-events-none absolute inset-x-0 bottom-2 z-[60] flex justify-center">
      <div className="glass pointer-events-auto flex items-end gap-1.5 rounded-2xl border border-line px-2 py-1.5 shadow-window">
        <DockLauncher />
        <span className="mx-0.5 h-10 w-px self-center bg-line" />
        {entries.map((entry) => (
          <DockItem
            key={entry.appId}
            appId={entry.appId}
            running={entry.windows.length > 0}
            focused={entry.windows.some((w) => w.id === focusedId)}
            onClick={() => activateEntry(entry)}
          />
        ))}
        <span className="mx-0.5 h-10 w-px self-center bg-line" />
        <DockItem appId="bin" running={binOpen} focused={false} onClick={() => openApp("bin")} />
      </div>
    </nav>
  );
}

function DockLauncher() {
  const togglePanel = useUI((s) => s.togglePanel);
  const [label, setLabel] = useState(false);
  return (
    // Same column structure as DockItem (tile + indicator strip) so the launcher shares the
    // dock's baseline instead of sitting a dot-strip lower.
    <div className="relative flex flex-col items-center">
      {label && <DockLabel text="Start" />}
      <motion.button
        type="button"
        aria-label="Start menu"
        onHoverStart={() => setLabel(true)}
        onHoverEnd={() => setLabel(false)}
        onFocus={() => setLabel(true)}
        onBlur={() => setLabel(false)}
        whileHover={{ y: -6, scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        onClick={(e) => {
          e.stopPropagation();
          togglePanel("start");
        }}
      >
        <AppIcon icon={LogoGlyph} tint={LAUNCHER_GLOW} size={48} />
      </motion.button>
      <span className="mt-1 h-1 w-1" aria-hidden />
    </div>
  );
}

function DockLabel({ text }: { text: string }) {
  return (
    <span className="glass pointer-events-none absolute -top-9 rounded-md border border-line px-2 py-0.5 text-xs whitespace-nowrap text-fg">
      {text}
    </span>
  );
}

function DockItem({
  appId,
  running,
  focused,
  onClick,
}: {
  appId: AppId;
  running: boolean;
  focused: boolean;
  onClick: () => void;
}) {
  const app = apps[appId];
  const [hover, setHover] = useState(false);
  return (
    <div className="relative flex flex-col items-center">
      {hover && <DockLabel text={app.name} />}
      <motion.button
        type="button"
        aria-label={app.name}
        data-dock={appId}
        onContextMenu={contextMenuProps(() => dockMenu(appId)).onContextMenu}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        whileHover={{ y: -6, scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <AppIcon icon={app.icon} tint={app.tint} size={48} />
      </motion.button>
      <span
        className={`mt-1 h-1 rounded-full transition-all ${
          running ? (focused ? "w-3 bg-accent" : "w-1 bg-muted") : "w-1 bg-transparent"
        }`}
      />
    </div>
  );
}

/* --------------------------------- Taskbar layout --------------------------------- */

export function Taskbar() {
  const entries = useShellEntries();
  const focusedId = useWindows((s) => s.focusedId);
  // Keep the tray clear of a host badge pinned to the bottom-right corner.
  const badge = useHostBadge();
  return (
    <footer
      className="glass absolute inset-x-0 bottom-0 z-[60] flex items-center gap-1 border-t border-line px-2"
      style={{ height: TASKBAR_H, paddingRight: badge ? HOST_BADGE.w : undefined }}
    >
      <StartButton variant="tile" />
      <span className="mx-1.5 h-6 w-px shrink-0 bg-line" />
      <nav aria-label="Taskbar" className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {entries.map((entry) => {
          const app = apps[entry.appId];
          const running = entry.windows.length > 0;
          const focused = entry.windows.some((w) => w.id === focusedId);
          return (
            <button
              key={entry.appId}
              type="button"
              aria-label={app.name}
              title={app.name}
              data-dock={entry.appId}
              onContextMenu={contextMenuProps(() => dockMenu(entry.appId)).onContextMenu}
              onClick={(e) => {
                e.stopPropagation();
                activateEntry(entry);
              }}
              className={`relative flex h-10 items-center gap-2 rounded-md px-2 transition-colors hover:bg-surface-hover ${
                focused ? "bg-surface-hover" : ""
              }`}
            >
              <AppIcon icon={app.icon} tint={app.tint} size={28} />
              {running && (
                <span className="hidden max-w-32 truncate text-xs text-fg lg:inline">
                  {entry.windows.length > 1 ? `${app.name} (${entry.windows.length})` : entry.windows[0].title}
                </span>
              )}
              <span
                className={`absolute bottom-0.5 left-1/2 h-[3px] -translate-x-1/2 rounded-full transition-all ${
                  running ? (focused ? "w-5 bg-accent" : "w-2 bg-muted") : "w-0"
                }`}
              />
            </button>
          );
        })}
      </nav>
      <div className="flex items-center gap-1">
        <RecruiterButton className="mr-2" />
        <TrayActions />
        <span className="mx-1 h-5 w-px bg-line" />
        <MoonIndicator />
        <span className="ml-2 pr-1">
          <Clock stacked />
        </span>
      </div>
    </footer>
  );
}
