"use client";

import { create } from "zustand";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Snap = "left" | "right" | null;

/** Arbitrary, serialisable parameters an app is opened with (e.g. a project slug). */
export type WindowParams = Record<string, string | number | undefined>;

export interface WindowInstance {
  id: string;
  appId: string;
  /** Identity used to de-duplicate: opening the same key again focuses the existing window. */
  key: string;
  title: string;
  params: WindowParams;
  rect: Rect;
  z: number;
  minimized: boolean;
  maximized: boolean;
  snap: Snap;
  /** "Always on top". */
  pinned?: boolean;
}

export interface OpenOptions {
  title: string;
  params?: WindowParams;
  key?: string;
  size?: { w: number; h: number };
}

/** The usable desktop area (viewport minus menu bar / dock / taskbar). */
export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A window as remembered between visits (no ids or z values: those are per session). */
export interface SavedWindow {
  appId: string;
  key: string;
  title: string;
  params: WindowParams;
  rect: Rect;
  minimized: boolean;
  maximized: boolean;
  snap: Snap;
  pinned?: boolean;
}

interface WindowsState {
  windows: WindowInstance[];
  /** Last floating rectangle per window key and per app, so windows reopen where they were. */
  memory: Record<string, Rect>;
  focusedId: string | null;
  bounds: Bounds;
  nextZ: number;
  openCount: number;
  setBounds: (b: Bounds) => void;
  open: (appId: string, opts: OpenOptions) => string;
  close: (id: string) => void;
  closeAll: () => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setRect: (id: string, rect: Partial<Rect>) => void;
  snapTo: (id: string, snap: Snap) => void;
  /** Click on a taskbar/dock entry: focus, restore, or minimize if already focused. */
  activate: (id: string) => void;
  togglePin: (id: string) => void;
  setMemory: (memory: Record<string, Rect>) => void;
  /** Reopen windows from a previous visit, bottom-most first; the last one gets focus. */
  restore: (saved: SavedWindow[]) => void;
}

const MIN_W = 300;
const MIN_H = 200;
const CASCADE = 28;

export const WINDOW_MIN = { w: MIN_W, h: MIN_H };

export function clampRect(rect: Rect, bounds: Bounds): Rect {
  const w = Math.max(MIN_W, Math.min(rect.w, bounds.w));
  const h = Math.max(MIN_H, Math.min(rect.h, bounds.h));
  // Keep at least the title bar reachable.
  const x = Math.min(Math.max(rect.x, bounds.x - w + 120), bounds.x + bounds.w - 120);
  const y = Math.min(Math.max(rect.y, bounds.y), bounds.y + bounds.h - 40);
  return { x, y, w, h };
}

/** The rectangle a window occupies on screen, accounting for maximize / snap. */
export function effectiveRect(win: WindowInstance, bounds: Bounds): Rect {
  if (win.maximized) return { ...bounds };
  if (win.snap === "left") return { x: bounds.x, y: bounds.y, w: bounds.w / 2, h: bounds.h };
  if (win.snap === "right")
    return { x: bounds.x + bounds.w / 2, y: bounds.y, w: bounds.w / 2, h: bounds.h };
  return win.rect;
}

let idSeq = 0;
const newId = () => `w${++idSeq}`;

function topmostVisible(windows: WindowInstance[], exclude?: string): string | null {
  const candidates = windows.filter((w) => !w.minimized && w.id !== exclude);
  if (!candidates.length) return null;
  return candidates.reduce((a, b) => (a.z > b.z ? a : b)).id;
}

export const useWindows = create<WindowsState>()((set, get) => ({
  windows: [],
  memory: {},
  focusedId: null,
  bounds: { x: 0, y: 0, w: 1280, h: 720 },
  nextZ: 1,
  openCount: 0,

  setBounds: (bounds) => set({ bounds }),

  open: (appId, { title, params = {}, key, size }) => {
    const state = get();
    const dedupeKey = key ?? appId;
    const existing = state.windows.find((w) => w.key === dedupeKey);
    if (existing) {
      set({
        windows: state.windows.map((w) =>
          w.id === existing.id ? { ...w, minimized: false, z: state.nextZ, title, params } : w,
        ),
        focusedId: existing.id,
        nextZ: state.nextZ + 1,
      });
      return existing.id;
    }

    const { bounds } = state;
    const w = Math.min(size?.w ?? 720, bounds.w - 32);
    const h = Math.min(size?.h ?? 480, bounds.h - 32);
    const step = (state.openCount % 8) * CASCADE;
    // Reopen where this window (or, failing that, this app) was last left.
    const remembered = state.memory[dedupeKey] ?? state.memory[appId];
    const rect = clampRect(
      remembered ?? {
        x: bounds.x + Math.max(16, (bounds.w - w) / 2 - 3 * CASCADE + step),
        y: bounds.y + Math.max(12, (bounds.h - h) / 2 - 3 * CASCADE + step),
        w,
        h,
      },
      bounds,
    );
    const win: WindowInstance = {
      id: newId(),
      appId,
      key: dedupeKey,
      title,
      params,
      rect,
      z: state.nextZ,
      minimized: false,
      // Small screens: open maximized, there's no room for floating windows.
      maximized: bounds.w < 640,
      snap: null,
    };
    set({
      windows: [...state.windows, win],
      focusedId: win.id,
      nextZ: state.nextZ + 1,
      openCount: state.openCount + 1,
    });
    return win.id;
  },

  close: (id) => {
    const windows = get().windows.filter((w) => w.id !== id);
    set({
      windows,
      focusedId: get().focusedId === id ? topmostVisible(windows) : get().focusedId,
    });
  },

  closeAll: () => set({ windows: [], focusedId: null }),

  focus: (id) => {
    const { windows, nextZ, focusedId } = get();
    const target = windows.find((w) => w.id === id);
    if (!target) return;
    if (focusedId === id && !target.minimized && target.z === nextZ - 1) return;
    set({
      windows: windows.map((w) => (w.id === id ? { ...w, z: nextZ, minimized: false } : w)),
      focusedId: id,
      nextZ: nextZ + 1,
    });
  },

  minimize: (id) => {
    const windows = get().windows.map((w) => (w.id === id ? { ...w, minimized: true } : w));
    set({ windows, focusedId: topmostVisible(windows, id) });
  },

  toggleMaximize: (id) =>
    set({
      windows: get().windows.map((w) =>
        w.id === id ? { ...w, maximized: !(w.maximized || w.snap), snap: null } : w,
      ),
    }),

  setRect: (id, partial) => {
    const { bounds, windows, memory } = get();
    const target = windows.find((w) => w.id === id);
    if (!target) return;
    const rect = clampRect({ ...target.rect, ...partial }, bounds);
    set({
      windows: windows.map((w) => (w.id === id ? { ...w, rect, maximized: false, snap: null } : w)),
      memory: { ...memory, [target.key]: rect, [target.appId]: rect },
    });
  },

  setMemory: (memory) => set({ memory }),

  restore: (saved) => {
    const { bounds } = get();
    let z = get().nextZ;
    const existing = new Set(get().windows.map((w) => w.key));
    const restored = saved
      .filter((s) => !existing.has(s.key))
      .map<WindowInstance>((s) => ({
        id: newId(),
        appId: s.appId,
        key: s.key,
        title: s.title,
        params: s.params,
        rect: clampRect(s.rect, bounds),
        z: z++,
        minimized: s.minimized,
        maximized: s.maximized,
        snap: s.snap,
        pinned: s.pinned,
      }));
    if (!restored.length) return;
    // Anything already open (e.g. from a deep link) stays on top of the restored windows.
    const current = [...get().windows].sort((a, b) => a.z - b.z).map((w) => ({ ...w, z: z++ }));
    const windows = [...restored, ...current];
    set({ windows, nextZ: z, focusedId: topmostVisible(windows), openCount: get().openCount + restored.length });
  },

  snapTo: (id, snap) =>
    set({
      windows: get().windows.map((w) => (w.id === id ? { ...w, snap, maximized: false } : w)),
    }),

  togglePin: (id) =>
    set({ windows: get().windows.map((w) => (w.id === id ? { ...w, pinned: !w.pinned } : w)) }),

  activate: (id) => {
    const { windows, focusedId } = get();
    const target = windows.find((w) => w.id === id);
    if (!target) return;
    if (target.minimized || focusedId !== id) get().focus(id);
    else get().minimize(id);
  },
}));
