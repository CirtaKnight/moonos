"use client";

import { create } from "zustand";
import type { Rect } from "./windows";

export type Panel = "start" | "search" | "notifications" | "shortcuts" | null;

interface UIState {
  panel: Panel;
  snapPreview: Rect | null;
  /** Desktop icons currently selected. */
  selectedIcons: string[];
  /** Bumped by "Refresh" to replay the desktop shimmer. */
  refreshTick: number;
  togglePanel: (p: Exclude<Panel, null>) => void;
  closePanel: () => void;
  setSnapPreview: (r: Rect | null) => void;
  selectIcons: (ids: string[]) => void;
  refresh: () => void;
}

export const useUI = create<UIState>()((set, get) => ({
  panel: null,
  snapPreview: null,
  selectedIcons: [],
  refreshTick: 0,
  togglePanel: (p) => set({ panel: get().panel === p ? null : p }),
  closePanel: () => set({ panel: null }),
  setSnapPreview: (snapPreview) => set({ snapPreview }),
  selectIcons: (selectedIcons) => set({ selectedIcons }),
  refresh: () => set({ refreshTick: get().refreshTick + 1 }),
}));
