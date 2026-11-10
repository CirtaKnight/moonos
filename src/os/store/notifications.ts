"use client";

import { create } from "zustand";
import { play } from "../lib/sound";

export type NoticeSource = "system" | "github" | "linkedin" | "trophy" | "calendar" | "star" | "generic";

export interface Notice {
  id: string;
  title: string;
  body?: string;
  at: number;
  /** Original time of the event (e.g. a GitHub push), shown instead of "now". */
  time?: string;
  source?: NoticeSource;
  /** What happens when the notification is clicked. */
  action?:
    | { type: "project"; slug: string; title: string }
    | { type: "app"; app: string; params?: Record<string, string> }
    | { type: "url"; href: string };
}

interface NotificationsState {
  items: Notice[];
  /** Ids currently shown as toasts. */
  toasts: string[];
  /** Adds a notification; `toast: false` files it in the center silently. */
  push: (n: Omit<Notice, "at">, opts?: { toast?: boolean }) => void;
  dismissToast: (id: string) => void;
  clear: () => void;
}

export const useNotifications = create<NotificationsState>()((set, get) => ({
  items: [],
  toasts: [],
  push: (n, { toast = true } = {}) => {
    if (get().items.some((x) => x.id === n.id)) return;
    set({ items: [{ ...n, at: Date.now() }, ...get().items], toasts: toast ? [...get().toasts, n.id] : get().toasts });
    if (!toast) return;
    play("notify");
    setTimeout(() => get().dismissToast(n.id), 6000);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t !== id) }),
  clear: () => set({ items: [], toasts: [] }),
}));
