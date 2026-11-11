"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ShellLayout = "dock" | "taskbar";
export type IconCell = { c: number; r: number };

export interface SettingsData {
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

function applyToDocument(reduceMotion: boolean) {
  if (typeof document === "undefined") return;
  if (reduceMotion) document.documentElement.dataset.motion = "reduced";
  else delete document.documentElement.dataset.motion;
}

const DEFAULTS: SettingsData = {
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
      setLayout: (layout) => set({ layout }),
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
    }),
    {
      // Keep in sync with the motion init script in app/layout.tsx.
      name: "ck-os-settings",
      version: 4,
      // v1 → v2 (MoonOS): new fields get defaults; everyone gets the new animated wallpaper once.
      // v2 → v3: the Day theme was removed, so the stored `theme` is dropped.
      // v3 → v4: project folders moved to the top-right by default, so old icon layouts are reset.
      migrate: (persisted, version) => {
        const { theme: _drop, ...old } = (persisted ?? {}) as Partial<SettingsData> & { theme?: string };
        void _drop;
        return {
          ...DEFAULTS,
          ...old,
          ...(version < 2 ? { wallpaper: "starfield" } : {}),
          ...(version < 4 ? { iconLayout: {} } : {}),
        };
      },
      partialize: (s): SettingsData => ({
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
