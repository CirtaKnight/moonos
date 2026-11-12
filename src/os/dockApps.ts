"use client";

import { useMemo } from "react";
import { apps, type AppId } from "./apps/registry";
import { moveApp, pinApp, resolvePinned, unpinApp } from "./lib/dockApps";
import { useSettings } from "./store/settings";

// The bin has its own fixed spot at the end of the dock, so it isn't pinnable.
const KNOWN: ReadonlySet<string> = new Set<string>(
  (Object.keys(apps) as AppId[]).filter((id) => id !== "bin" && (apps[id].listed || apps[id].pinned)),
);
export const DEFAULT_PINNED = (Object.keys(apps) as AppId[]).filter((id) => apps[id].pinned);

export const canPin = (id: string) => KNOWN.has(id);

const current = () => resolvePinned(useSettings.getState().pinnedApps, DEFAULT_PINNED, KNOWN) as AppId[];
const save = (list: string[]) => useSettings.getState().setPinnedApps(list);

/** The dock / taskbar apps, in the visitor's order. */
export function usePinnedApps(): AppId[] {
  const saved = useSettings((s) => s.pinnedApps);
  return useMemo(() => resolvePinned(saved, DEFAULT_PINNED, KNOWN) as AppId[], [saved]);
}

export const isPinned = (id: string) => current().includes(id as AppId);
export const pin = (id: string, index?: number) => save(pinApp(current(), id, index));
export const unpin = (id: string) => save(unpinApp(current(), id));
export const movePinned = (id: string, to: number) => save(moveApp(current(), id, to));
export const resetPinned = () => useSettings.getState().setPinnedApps(null);
