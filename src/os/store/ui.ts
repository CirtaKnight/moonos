"use client";

import { create } from "zustand";
import type { Rect } from "./windows";

export type Panel = "start" | "search" | "notifications" | null;

interface UIState {
  panel: Panel;
  snapPreview: Rect | null;
  /** Desktop icon currently selected (single click). */
  selectedIcon: string | null;
  togglePanel: (p: Exclude<Panel, null>) => void;
  closePanel: () => void;
  setSnapPreview: (r: Rect | null) => void;
  selectIcon: (id: string | null) => void;
}

export const useUI = create<UIState>()((set, get) => ({
  panel: null,
  snapPreview: null,
  selectedIcon: null,
  togglePanel: (p) => set({ panel: get().panel === p ? null : p }),
  closePanel: () => set({ panel: null }),
  setSnapPreview: (snapPreview) => set({ snapPreview }),
  selectIcon: (selectedIcon) => set({ selectedIcon }),
}));
