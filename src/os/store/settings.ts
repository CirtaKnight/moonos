"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ShellLayout = "dock" | "taskbar";
/** "auto" = the visitor hasn't picked one yet: taskbar on big mouse-driven screens, dock on tablets (see useShellLayout). */
export type LayoutPreference = ShellLayout | "auto";
export type IconCell = { c: number; r: number };

export interface SettingsData {
  layout: LayoutPreference;
  /** Go fullscreen on the visitor's first click or key press. */
  fullscreen: boolean;
  wallpaper: string;
  sound: boolean;
  reduceMotion: boolean;
  customCursor: boolean;
  /** Idle minutes before the screensaver; 0 = never. */
  screensaverMinutes: number;
  /** Set after the first full boot; return visits get the short boot. */
  hasBooted: boolean;
  /** Project ids the visitor has already been notified about. */
  seenProjects: string[];
  /** Notification ids (GitHub events, announcements, agenda) already shown as toasts. */
  seenNotices: string[];
  /** Desktop icon positions the visitor arranged (grid cells). */
  iconLayout: Record<string, IconCell>;
  /** Phone home screen slots the visitor arranged. */
  homeLayout: Record<string, number>;
  /** Reopen last visit's windows on the desktop. */
  restoreWindows: boolean;
  /** Apps pinned to the dock / taskbar, in order; null = the default set. */
  pinnedApps: string[] | null;
}

export interface SettingsState extends SettingsData {
  setLayout: (layout: LayoutPreference) => void;
  setFullscreen: (on: boolean) => void;
  setWallpaper: (id: string) => void;
  setSound: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
  setCustomCursor: (on: boolean) => void;
  setScreensaverMinutes: (m: number) => void;
  markBooted: () => void;
  markProjectsSeen: (ids: string[]) => void;
  markNoticesSeen: (ids: string[]) => void;
  setIconLayout: (layout: Record<string, IconCell>) => void;
  setHomeLayout: (layout: Record<string, number>) => void;
  setRestoreWindows: (on: boolean) => void;
  setPinnedApps: (apps: string[] | null) => void;
}

function applyToDocument(reduceMotion: boolean) {
  if (typeof document === "undefined") return;
  if (reduceMotion) document.documentElement.dataset.motion = "reduced";
  else delete document.documentElement.dataset.motion;
}

const DEFAULTS: SettingsData = {
  layout: "auto",
  fullscreen: true,
  wallpaper: "starfield",
  sound: false,
  reduceMotion: false,
  customCursor: true,
  screensaverMinutes: 10,
  hasBooted: false,
  seenProjects: [],
  seenNotices: [],
  iconLayout: {},
  homeLayout: {},
  restoreWindows: true,
  pinnedApps: null,
};

const unique = (a: string[], b: string[]) => [...new Set([...a, ...b])].slice(-300);

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      setLayout: (layout) => set({ layout }),
      setFullscreen: (fullscreen) => set({ fullscreen }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setSound: (sound) => set({ sound }),
      setReduceMotion: (reduceMotion) => {
        applyToDocument(reduceMotion);
        set({ reduceMotion });
      },
      setCustomCursor: (customCursor) => set({ customCursor }),
      setScreensaverMinutes: (screensaverMinutes) => set({ screensaverMinutes }),
      markBooted: () => set({ hasBooted: true }),
      markProjectsSeen: (ids) => set({ seenProjects: unique(get().seenProjects, ids) }),
      markNoticesSeen: (ids) => set({ seenNotices: unique(get().seenNotices, ids) }),
      setIconLayout: (iconLayout) => set({ iconLayout }),
      setHomeLayout: (homeLayout) => set({ homeLayout }),
      setRestoreWindows: (restoreWindows) => set({ restoreWindows }),
      setPinnedApps: (pinnedApps) => set({ pinnedApps }),
    }),
    {
      // Keep in sync with the motion init script in app/layout.tsx.
      name: "ck-os-settings",
      version: 5,
      // v1 → v2 (MoonOS): new fields get defaults; everyone gets the new animated wallpaper once.
      // v2 → v3: the Day theme was removed, so the stored `theme` is dropped.
      // v3 → v4: project folders moved to the top-right by default, so old icon layouts are reset;
      // the 3-minute screensaver (too eager for reading) becomes 10.
      // v4 → v5: the layout follows the screen by default (dock was simply the old default).
      migrate: (persisted, version) => {
        const { theme: _drop, ...old } = (persisted ?? {}) as Partial<SettingsData> & { theme?: string };
        void _drop;
        return {
          ...DEFAULTS,
          ...old,
          ...(version < 2 ? { wallpaper: "starfield" } : {}),
          ...(version < 4 ? { iconLayout: {}, ...(old.screensaverMinutes === 3 ? { screensaverMinutes: 10 } : {}) } : {}),
          ...(version < 5 && old.layout === "dock" ? { layout: "auto" as const } : {}),
        };
      },
      partialize: (s): SettingsData => ({
        layout: s.layout,
        fullscreen: s.fullscreen,
        wallpaper: s.wallpaper,
        sound: s.sound,
        reduceMotion: s.reduceMotion,
        customCursor: s.customCursor,
        screensaverMinutes: s.screensaverMinutes,
        hasBooted: s.hasBooted,
        seenProjects: s.seenProjects,
        seenNotices: s.seenNotices,
        iconLayout: s.iconLayout,
        homeLayout: s.homeLayout,
        restoreWindows: s.restoreWindows,
        pinnedApps: s.pinnedApps,
      }),
    },
  ),
);
