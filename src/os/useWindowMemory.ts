"use client";

import { useEffect } from "react";
import { apps } from "./apps/registry";
import { parseWindowMemory, serializeWindowMemory, WINDOW_MEMORY_KEY } from "./lib/windowMemory";
import { useSettings } from "./store/settings";
import { useWindows } from "./store/windows";

const knownApps = new Set(Object.keys(apps));
let restoredThisLoad = false;

/**
 * Desktop only: bring back last visit's windows (once per page load, before deep links
 * open anything on top), then keep saving the window layout as it changes.
 */
export function useWindowMemory() {
  useEffect(() => {
    let saved = { windows: [] as ReturnType<typeof parseWindowMemory>["windows"], memory: {} };
    try {
      saved = parseWindowMemory(localStorage.getItem(WINDOW_MEMORY_KEY), knownApps);
    } catch {
      /* storage blocked: start fresh */
    }
    const store = useWindows.getState();
    store.setMemory({ ...saved.memory, ...store.memory });
    // One tick later, once the desktop has measured its real size (rects are clamped to it).
    const restoreTimer = setTimeout(() => {
      if (!restoredThisLoad && useSettings.getState().restoreWindows) useWindows.getState().restore(saved.windows);
      restoredThisLoad = true;
    }, 0);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      // Never overwrite last visit's layout before it has had its chance to come back.
      if (!restoredThisLoad) return;
      try {
        const { windows, memory } = useWindows.getState();
        localStorage.setItem(WINDOW_MEMORY_KEY, serializeWindowMemory(windows, memory));
      } catch {
        /* storage full or blocked: memory is a nicety */
      }
    };
    const unsub = useWindows.subscribe((s, prev) => {
      if (s.windows === prev.windows && s.memory === prev.memory) return;
      clearTimeout(timer);
      timer = setTimeout(save, 400);
    });
    return () => {
      unsub();
      clearTimeout(restoreTimer);
      clearTimeout(timer);
      save();
    };
  }, []);
}
