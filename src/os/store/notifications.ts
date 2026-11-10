"use client";

import { create } from "zustand";
import { play } from "../lib/sound";

export interface Notice {
  id: string;
  title: string;
  body?: string;
  at: number;
  /** What happens when the notification is clicked. */
  action?: { type: "project"; slug: string; title: string } | { type: "app"; app: string };
}

interface NotificationsState {
  items: Notice[];
  /** Ids currently shown as toasts. */
  toasts: string[];
  push: (n: Omit<Notice, "at">) => void;
  dismissToast: (id: string) => void;
  clear: () => void;
}

export const useNotifications = create<NotificationsState>()((set, get) => ({
  items: [],
  toasts: [],
  push: (n) => {
    if (get().items.some((x) => x.id === n.id)) return;
    set({ items: [{ ...n, at: Date.now() }, ...get().items], toasts: [...get().toasts, n.id] });
    play("notify");
    setTimeout(() => get().dismissToast(n.id), 6000);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t !== id) }),
  clear: () => set({ items: [], toasts: [] }),
}));
