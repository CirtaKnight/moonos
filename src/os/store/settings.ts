"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "night" | "day";
export type ShellLayout = "dock" | "taskbar";

export interface SettingsState {
  theme: Theme;
  layout: ShellLayout;
  wallpaper: string;
  sound: boolean;
  reduceMotion: boolean;
  /** Set after the first full boot; return visits get the short boot. */
  hasBooted: boolean;
  /** Project ids the visitor has already been notified about. */
  seenProjects: string[];
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLayout: (layout: ShellLayout) => void;
  setWallpaper: (id: string) => void;
  setSound: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
  markBooted: () => void;
  markProjectsSeen: (ids: string[]) => void;
}

function applyToDocument(theme: Theme, reduceMotion: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  if (reduceMotion) document.documentElement.dataset.motion = "reduced";
  else delete document.documentElement.dataset.motion;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: "night",
      layout: "dock",
      wallpaper: "eclipse",
      sound: false,
      reduceMotion: false,
      hasBooted: false,
      seenProjects: [],
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
      markBooted: () => set({ hasBooted: true }),
      markProjectsSeen: (ids) => set({ seenProjects: [...new Set([...get().seenProjects, ...ids])] }),
    }),
    {
      // Keep in sync with the theme init script in app/layout.tsx.
      name: "ck-os-settings",
      partialize: ({ theme, layout, wallpaper, sound, reduceMotion, hasBooted, seenProjects }) => ({
        theme,
        layout,
        wallpaper,
        sound,
        reduceMotion,
        hasBooted,
        seenProjects,
      }),
    },
  ),
);
