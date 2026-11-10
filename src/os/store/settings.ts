"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "night" | "day";
export type ShellLayout = "dock" | "taskbar";
export type IconCell = { c: number; r: number };

export interface SettingsData {
  theme: Theme;
  layout: ShellLayout;
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
}

export interface SettingsState extends SettingsData {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLayout: (layout: ShellLayout) => void;
  setWallpaper: (id: string) => void;
  setSound: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
  setCustomCursor: (on: boolean) => void;
  setScreensaverMinutes: (m: number) => void;
  markBooted: () => void;
  markProjectsSeen: (ids: string[]) => void;
  markNoticesSeen: (ids: string[]) => void;
  setIconLayout: (layout: Record<string, IconCell>) => void;
}

function applyToDocument(theme: Theme, reduceMotion: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  if (reduceMotion) document.documentElement.dataset.motion = "reduced";
  else delete document.documentElement.dataset.motion;
}

const DEFAULTS: SettingsData = {
  theme: "night",
  layout: "dock",
  wallpaper: "starfield",
  sound: false,
  reduceMotion: false,
  customCursor: true,
  screensaverMinutes: 3,
  hasBooted: false,
  seenProjects: [],
  seenNotices: [],
  iconLayout: {},
};

const unique = (a: string[], b: string[]) => [...new Set([...a, ...b])].slice(-300);

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      setTheme: (theme) => {
        applyToDocument(theme, get().reduceMotion);
        set({ theme });
      },
      toggleTheme: () => get().setTheme(get().theme === "night" ? "day" : "night"),
      setLayout: (layout) => set({ layout }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setSound: (sound) => set({ sound }),
      setReduceMotion: (reduceMotion) => {
        applyToDocument(get().theme, reduceMotion);
        set({ reduceMotion });
      },
      setCustomCursor: (customCursor) => set({ customCursor }),
      setScreensaverMinutes: (screensaverMinutes) => set({ screensaverMinutes }),
      markBooted: () => set({ hasBooted: true }),
      markProjectsSeen: (ids) => set({ seenProjects: unique(get().seenProjects, ids) }),
      markNoticesSeen: (ids) => set({ seenNotices: unique(get().seenNotices, ids) }),
      setIconLayout: (iconLayout) => set({ iconLayout }),
    }),
    {
      // Keep in sync with the theme init script in app/layout.tsx.
      name: "ck-os-settings",
      version: 2,
      // v1 → v2 (MoonOS): new fields get defaults; everyone gets the new animated wallpaper once.
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Partial<SettingsData>;
        return { ...DEFAULTS, ...old, ...(version < 2 ? { wallpaper: "starfield" } : {}) };
      },
      partialize: (s): SettingsData => ({
        theme: s.theme,
        layout: s.layout,
        wallpaper: s.wallpaper,
        sound: s.sound,
        reduceMotion: s.reduceMotion,
        customCursor: s.customCursor,
        screensaverMinutes: s.screensaverMinutes,
        hasBooted: s.hasBooted,
        seenProjects: s.seenProjects,
        seenNotices: s.seenNotices,
        iconLayout: s.iconLayout,
      }),
    },
  ),
);
