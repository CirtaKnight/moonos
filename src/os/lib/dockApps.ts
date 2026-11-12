/**
 * The apps pinned to the dock / taskbar, in the visitor's order. `null` means "never
 * customised": follow the defaults (so new default apps still show up for them).
 */

/** Saved list, cleaned of apps that no longer exist; the defaults when nothing was saved. */
export function resolvePinned(saved: readonly string[] | null, defaults: readonly string[], known: ReadonlySet<string>): string[] {
  const list = saved ?? defaults;
  return [...new Set(list)].filter((id) => known.has(id));
}

export function pinApp(list: readonly string[], id: string, index = list.length): string[] {
  if (list.includes(id)) return [...list];
  const next = [...list];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, id);
  return next;
}

export function unpinApp(list: readonly string[], id: string): string[] {
  return list.filter((x) => x !== id);
}

/** Move `id` to position `to` (clamped); unknown ids leave the list unchanged. */
export function moveApp(list: readonly string[], id: string, to: number): string[] {
  const from = list.indexOf(id);
  if (from < 0) return [...list];
  const next = [...list];
  next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, id);
  return next;
}
