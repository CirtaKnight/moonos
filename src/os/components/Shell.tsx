"use client";

import { movePinned, usePinnedApps } from "../dockApps";
import { HOST_BADGE, useHostBadge } from "../hooks";
import { RecruiterButton } from "./RecruiterButton";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { apps, type AppId } from "../apps/registry";
import { openApp } from "../apps/launch";
import { dockMenu } from "../menus";
import { contextMenuProps } from "../store/contextMenu";
import { useUI } from "../store/ui";
import { useWindows, type WindowInstance } from "../store/windows";
import type { Glyph } from "./AppGlyphs";
import { AppIcon } from "./AppIcon";
import { LogoMark } from "./Logo";
import { usePreviewHover, WindowPreviews } from "./WindowPreview";
import { Clock, MoonIndicator, TrayActions } from "./Tray";

export const MENUBAR_H = 32;
export const DOCK_RESERVED = 84;
export const TASKBAR_H = 60;

interface ShellEntry {
  appId: AppId;
  windows: WindowInstance[];
}

/** Pinned apps first (in the visitor's order), then any other running app, in launch order. */
function useShellEntries(): (ShellEntry & { pinned: boolean })[] {
  const windows = useWindows((s) => s.windows);
  const pinned = usePinnedApps();
  const running = [...new Set(windows.map((w) => w.appId as AppId))].filter((id) => !pinned.includes(id) && id !== "bin");
  return [...pinned, ...running].map((appId) => ({
    appId,
    pinned: pinned.includes(appId),
    windows: windows.filter((w) => w.appId === appId),
  }));
}

/**
 * Drag pinned apps sideways to reorder them (dock and taskbar). The item hops to its new
 * slot as soon as the pointer passes a neighbour's centre; a drag never counts as a click.
 */
function useDockReorder() {
  const drag = useRef<{ id: AppId; startX: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState<AppId | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (!d.moved) {
        if (Math.abs(e.clientX - d.startX) < 6) return;
        d.moved = true;
        setDragging(d.id);
      }
      const items = [...document.querySelectorAll<HTMLElement>("[data-dock-pinned]")];
      const from = items.findIndex((el) => el.dataset.dockPinned === d.id);
      for (let i = 0; i < items.length; i++) {
        if (i === from) continue;
        const r = items[i].getBoundingClientRect();
        const centre = r.left + r.width / 2;
        if ((i > from && e.clientX > centre && e.clientX < r.right) || (i < from && e.clientX < centre && e.clientX > r.left)) {
          movePinned(d.id, i);
          break;
        }
      }
    };
    const up = () => {
      if (drag.current?.moved) suppressClick.current = true;
      drag.current = null;
      setDragging(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  return {
    dragging,
    start: (id: AppId, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      suppressClick.current = false;
      drag.current = { id, startX: e.clientX, moved: false };
    },
    /** True (once) right after a drag, so the click that ends it doesn't open the app. */
    consumeDrag: () => {
      const was = suppressClick.current;
      suppressClick.current = false;
      return was;
    },
  };
}
type DockReorder = ReturnType<typeof useDockReorder>;

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
 * Start button. `tile` (taskbar): the same 48px button and 34px tile as the app entries, so
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
        variant === "tile" ? "size-12" : "h-7 w-8"
      } ${open ? "bg-surface-hover" : ""}`}
    >
      {variant === "tile" ? <AppIcon icon={LogoGlyph} tint={LAUNCHER_GLOW} size={34} /> : <LogoMark variant="glyph" size={17} />}
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
  const reorder = useDockReorder();
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
            reorder={entry.pinned ? reorder : undefined}
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
  reorder,
}: {
  appId: AppId;
  running: boolean;
  focused: boolean;
  onClick: () => void;
  /** Present for pinned apps, which can be dragged into a new order. */
  reorder?: DockReorder;
}) {
  const app = apps[appId];
  const [hover, setHover] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const preview = usePreviewHover(running);
  return (
    <div
      ref={anchor}
      data-dock-pinned={reorder ? appId : undefined}
      className={`relative flex flex-col items-center transition-opacity ${reorder?.dragging === appId ? "opacity-60" : ""}`}
      onMouseEnter={preview.enter}
      onMouseLeave={preview.leave}
      onPointerDown={reorder ? (e) => reorder.start(appId, e) : undefined}
    >
      {hover && !preview.open && !reorder?.dragging && <DockLabel text={app.name} />}
      {preview.open && (
        <WindowPreviews appId={appId} anchor={anchor} onEnter={preview.enter} onLeave={preview.leave} onPicked={preview.close} />
      )}
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
          preview.close();
          if (reorder?.consumeDrag()) return;
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
  const reorder = useDockReorder();
  // Keep the tray clear of a host badge pinned to the bottom-right corner.
  const badge = useHostBadge();
  return (
    <footer
      className="glass absolute inset-x-0 bottom-0 z-[60] flex items-center gap-1 border-t border-line px-2"
      style={{ height: TASKBAR_H, paddingRight: badge ? HOST_BADGE.w : undefined }}
    >
      <StartButton variant="tile" />
      <span className="mx-1.5 h-7 w-px shrink-0 bg-line" />
      <nav aria-label="Taskbar" className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {entries.map((entry) => (
          <TaskbarItem key={entry.appId} entry={entry} focusedId={focusedId} reorder={entry.pinned ? reorder : undefined} />
        ))}
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

function TaskbarItem({ entry, focusedId, reorder }: { entry: ShellEntry; focusedId: string | null; reorder?: DockReorder }) {
  const app = apps[entry.appId];
  const running = entry.windows.length > 0;
  const focused = entry.windows.some((w) => w.id === focusedId);
  const anchor = useRef<HTMLButtonElement>(null);
  const preview = usePreviewHover(running);
  return (
    <>
      <button
        ref={anchor}
        type="button"
        aria-label={app.name}
        // The preview replaces the native tooltip once the app has windows.
        title={running ? undefined : app.name}
        data-dock={entry.appId}
        data-dock-pinned={reorder ? entry.appId : undefined}
        onPointerDown={reorder ? (e) => reorder.start(entry.appId, e) : undefined}
        onMouseEnter={preview.enter}
        onMouseLeave={preview.leave}
        onContextMenu={contextMenuProps(() => dockMenu(entry.appId)).onContextMenu}
        onClick={(e) => {
          e.stopPropagation();
          preview.close();
          if (reorder?.consumeDrag()) return;
          activateEntry(entry);
        }}
        className={`relative flex h-12 shrink-0 items-center gap-2 rounded-lg px-2 transition-[background-color,opacity] hover:bg-surface-hover ${
          focused ? "bg-surface-hover" : ""
        } ${reorder?.dragging === entry.appId ? "opacity-60" : ""}`}
      >
        <AppIcon icon={app.icon} tint={app.tint} size={34} />
        {running && (
          <span className="hidden max-w-36 truncate text-[13px] text-fg lg:inline">
            {entry.windows.length > 1 ? `${app.name} (${entry.windows.length})` : entry.windows[0].title}
          </span>
        )}
        <span
          className={`absolute bottom-0.5 left-1/2 h-[3px] -translate-x-1/2 rounded-full transition-all ${
            running ? (focused ? "w-5 bg-accent" : "w-2 bg-muted") : "w-0"
          }`}
        />
      </button>
      {preview.open && (
        <WindowPreviews appId={entry.appId} anchor={anchor} onEnter={preview.enter} onLeave={preview.leave} onPicked={preview.close} />
      )}
    </>
  );
}
