"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { achievementById } from "../lib/achievements";
import { useNotifications } from "./notifications";

/** Apps that count toward "Completionist" (everything a visitor can launch directly). */
export const TRACKED_APPS = [
  "about", "projects", "cv", "browser", "gallery", "videos", "terminal", "mail", "music",
  "game", "settings", "games", "agenda", "trophies", "map", "konshu",
];

interface AchievementsState {
  unlocked: Record<string, number>;
  appsOpened: string[];
  commandsRun: number;
  /** `silent` records the trophy without a toast. */
  unlock: (id: string, opts?: { silent?: boolean }) => void;
  trackApp: (appId: string) => void;
  trackCommand: () => void;
}

export const useAchievements = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlocked: {},
      appsOpened: [],
      commandsRun: 0,
      unlock: (id, { silent = false } = {}) => {
        if (get().unlocked[id]) return;
        const a = achievementById(id);
        if (!a) return;
        set({ unlocked: { ...get().unlocked, [id]: Date.now() } });
        if (silent) return;
        useNotifications.getState().push({
          id: `ach:${id}`,
          title: `🏆 ${a.title}`,
          body: a.description,
          source: "trophy",
          action: { type: "app", app: "trophies" },
        });
      },
      trackApp: (appId) => {
        if (!TRACKED_APPS.includes(appId) || get().appsOpened.includes(appId)) return;
        const appsOpened = [...get().appsOpened, appId];
        set({ appsOpened });
        if (appsOpened.length >= 5) get().unlock("explorer");
        if (TRACKED_APPS.every((a) => appsOpened.includes(a))) get().unlock("completionist");
      },
      trackCommand: () => {
        const commandsRun = get().commandsRun + 1;
        set({ commandsRun });
        if (commandsRun >= 10) get().unlock("terminal-regular");
      },
    }),
    { name: "moonos-achievements" },
  ),
);

export const unlock = (id: string, opts?: { silent?: boolean }) => useAchievements.getState().unlock(id, opts);
