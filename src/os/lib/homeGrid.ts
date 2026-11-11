/**
 * Phone home screen layout: every icon owns a slot index (page * perPage + row * cols + col),
 * so pages and gaps survive rotation and visitors can rearrange icons freely.
 */
export type HomeLayout = Record<string, number>;

export const slotOf = (page: number, row: number, col: number, perPage: number, cols: number) => page * perPage + row * cols + col;

export function slotPosition(slot: number, perPage: number, cols: number) {
  const page = Math.floor(slot / perPage);
  const inPage = slot % perPage;
  return { page, row: Math.floor(inPage / cols), col: inPage % cols };
}

/**
 * Saved slots win (if not colliding). Ids in `right` default to the right-hand column of the
 * first page, top-down; everything else fills the first free slots in order.
 */
export function placeHome(ids: string[], saved: HomeLayout, perPage: number, cols: number, right: string[] = []): HomeLayout {
  const out: HomeLayout = {};
  const taken = new Set<number>();
  for (const id of ids) {
    const s = saved[id];
    if (Number.isInteger(s) && s >= 0 && !taken.has(s)) {
      out[id] = s;
      taken.add(s);
    }
  }
  const rows = Math.max(1, Math.floor(perPage / cols));
  const rightSet = new Set(right);
  let r = 0;
  for (const id of ids) {
    if (id in out || !rightSet.has(id)) continue;
    while (r < rows && taken.has(slotOf(0, r, cols - 1, perPage, cols))) r++;
    if (r >= rows) break; // Column full: the rest fall back to the normal fill.
    const s = slotOf(0, r, cols - 1, perPage, cols);
    out[id] = s;
    taken.add(s);
  }
  let cursor = 0;
  for (const id of ids) {
    if (id in out) continue;
    while (taken.has(cursor)) cursor++;
    out[id] = cursor;
    taken.add(cursor);
  }
  return out;
}

/** Move `id` into `target`; whatever sat there swaps into the old slot. */
export function moveHome(layout: HomeLayout, id: string, target: number): HomeLayout {
  const from = layout[id];
  if (from === undefined || from === target) return layout;
  const next: HomeLayout = { ...layout, [id]: target };
  const occupant = Object.keys(layout).find((k) => k !== id && layout[k] === target);
  if (occupant) next[occupant] = from;
  return next;
}

export function pageCount(layout: HomeLayout, perPage: number) {
  const max = Math.max(-1, ...Object.values(layout));
  return Math.max(1, Math.floor(max / perPage) + 1);
}
