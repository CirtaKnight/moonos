import type { Rect, SavedWindow, WindowInstance } from "../store/windows";

/**
 * Window memory between visits: the open windows (in z order) plus the last floating
 * rectangle of every window and app. Stored in localStorage, per visitor.
 */
export const WINDOW_MEMORY_KEY = "moonos-windows";
const VERSION = 1;
const MAX_REMEMBERED = 60;
const MAX_RESTORED = 8;

export interface WindowMemory {
  windows: SavedWindow[];
  memory: Record<string, Rect>;
}

export function snapshotWindows(windows: WindowInstance[]): SavedWindow[] {
  return [...windows]
    .sort((a, b) => a.z - b.z)
    .slice(-MAX_RESTORED)
    .map(({ appId, key, title, params, rect, minimized, maximized, snap, pinned }) => ({
      appId,
      key,
      title,
      params,
      rect,
      minimized,
      maximized,
      snap,
      ...(pinned ? { pinned } : {}),
    }));
}

/** Keep the most recently written entries only (object keys keep insertion order). */
export function trimMemory(memory: Record<string, Rect>, max = MAX_REMEMBERED): Record<string, Rect> {
  const keys = Object.keys(memory);
  if (keys.length <= max) return memory;
  return Object.fromEntries(keys.slice(-max).map((k) => [k, memory[k]]));
}

const isRect = (r: unknown): r is Rect =>
  !!r && typeof r === "object" && ["x", "y", "w", "h"].every((k) => Number.isFinite((r as Record<string, unknown>)[k]));

/** Parse what was stored, dropping anything malformed or belonging to an app that no longer exists. */
export function parseWindowMemory(raw: string | null, knownApps: ReadonlySet<string>): WindowMemory {
  const empty: WindowMemory = { windows: [], memory: {} };
  if (!raw) return empty;
  try {
    const data = JSON.parse(raw) as { v?: number; windows?: unknown[]; memory?: Record<string, unknown> };
    if (data.v !== VERSION) return empty;
    const windows = (data.windows ?? []).filter(
      (w): w is SavedWindow =>
        !!w &&
        typeof w === "object" &&
        knownApps.has((w as SavedWindow).appId) &&
        typeof (w as SavedWindow).key === "string" &&
        typeof (w as SavedWindow).title === "string" &&
        isRect((w as SavedWindow).rect),
    );
    const memory = Object.fromEntries(Object.entries(data.memory ?? {}).filter(([, r]) => isRect(r))) as Record<string, Rect>;
    return { windows: windows.map((w) => ({ ...w, params: w.params ?? {}, snap: w.snap ?? null })), memory };
  } catch {
    return empty;
  }
}

export function serializeWindowMemory(windows: WindowInstance[], memory: Record<string, Rect>): string {
  return JSON.stringify({ v: VERSION, windows: snapshotWindows(windows), memory: trimMemory(memory) });
}
