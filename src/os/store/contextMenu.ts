"use client";

import type { LucideIcon } from "lucide-react";
import { create } from "zustand";

export type MenuEntry =
  | {
      label: string;
      icon?: LucideIcon;
      shortcut?: string;
      checked?: boolean;
      danger?: boolean;
      disabled?: boolean;
      onSelect?: () => void;
      submenu?: MenuEntry[];
    }
  | "separator";

interface ContextMenuState {
  menu: { x: number; y: number; items: MenuEntry[] } | null;
  open: (x: number, y: number, items: MenuEntry[]) => void;
  close: () => void;
}

export const useContextMenu = create<ContextMenuState>()((set) => ({
  menu: null,
  open: (x, y, items) => set({ menu: { x, y, items } }),
  close: () => set({ menu: null }),
}));

/**
 * Props that open a context menu on right-click (mouse) or long-press (touch).
 * `build` is called lazily so menus always reflect current state.
 */
export function contextMenuProps(build: () => MenuEntry[]) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let start: { x: number; y: number } | null = null;
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return {
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      useContextMenu.getState().open(e.clientX, e.clientY, build());
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") return;
      start = { x: e.clientX, y: e.clientY };
      const { clientX, clientY } = e;
      cancel();
      timer = setTimeout(() => {
        navigator.vibrate?.(10);
        useContextMenu.getState().open(clientX, clientY, build());
      }, 500);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
  };
}
