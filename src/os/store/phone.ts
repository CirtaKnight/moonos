"use client";

import { create } from "zustand";
import type { WindowParams } from "./windows";

export interface Screen {
  id: string;
  appId: string;
  title: string;
  params: WindowParams;
  key: string;
}

interface PhoneState {
  /** True while the phone shell is the active UI (small / touch-first screens). */
  active: boolean;
  stack: Screen[];
  setActive: (active: boolean) => void;
  push: (s: Omit<Screen, "id">) => void;
  pop: () => void;
  home: () => void;
  update: (id: string, patch: Partial<Pick<Screen, "title" | "params">>) => void;
}

let seq = 0;

export const usePhone = create<PhoneState>()((set, get) => ({
  active: false,
  stack: [],
  setActive: (active) => set({ active }),
  push: (s) => {
    const stack = get().stack;
    // Re-opening something already in the stack brings it back to the top.
    const existing = stack.findIndex((x) => x.key === s.key);
    if (existing >= 0) {
      const screen = { ...stack[existing], ...s };
      set({ stack: [...stack.slice(0, existing), ...stack.slice(existing + 1), screen] });
      return;
    }
    set({ stack: [...stack, { ...s, id: `s${++seq}` }] });
  },
  pop: () => set({ stack: get().stack.slice(0, -1) }),
  home: () => set({ stack: [] }),
  update: (id, patch) => set({ stack: get().stack.map((s) => (s.id === id ? { ...s, ...patch } : s)) }),
}));
