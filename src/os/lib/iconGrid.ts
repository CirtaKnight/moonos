export type Cell = { c: number; r: number };
export type Layout = Record<string, Cell>;

const key = (cell: Cell) => `${cell.c}:${cell.r}`;

/**
 * Place icons on a column-major grid with `rows` rows. Saved positions win (if still on the
 * grid and not colliding); everything else fills the first free cells in default order.
 */
export function placeIcons(ids: string[], saved: Layout, rows: number): Layout {
  const out: Layout = {};
  const taken = new Set<string>();
  for (const id of ids) {
    const cell = saved[id];
    if (cell && cell.r < rows && cell.c >= 0 && cell.r >= 0 && !taken.has(key(cell))) {
      out[id] = cell;
      taken.add(key(cell));
    }
  }
  let cursor = 0;
  for (const id of ids) {
    if (out[id]) continue;
    let cell: Cell;
    do {
      cell = { c: Math.floor(cursor / rows), r: cursor % rows };
      cursor++;
    } while (taken.has(key(cell)));
    out[id] = cell;
    taken.add(key(cell));
  }
  return out;
}

/** Move `id` to `target`; whatever was there swaps into the moved icon's old cell. */
export function moveIcon(layout: Layout, id: string, target: Cell): Layout {
  const from = layout[id];
  if (!from || (from.c === target.c && from.r === target.r)) return layout;
  const next: Layout = { ...layout, [id]: target };
  const occupant = Object.keys(layout).find((k) => k !== id && layout[k].c === target.c && layout[k].r === target.r);
  if (occupant) next[occupant] = from;
  return next;
}

/** Grid cell under a point (relative to the grid origin), clamped to the grid. */
export function cellAt(x: number, y: number, cellW: number, cellH: number, rows: number, cols: number): Cell {
  return {
    c: Math.max(0, Math.min(cols - 1, Math.floor(x / cellW))),
    r: Math.max(0, Math.min(rows - 1, Math.floor(y / cellH))),
  };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Normalised rectangle from two corner points (drag selection). */
export const rectFrom = (x1: number, y1: number, x2: number, y2: number): Rect => ({
  x: Math.min(x1, x2),
  y: Math.min(y1, y2),
  w: Math.abs(x2 - x1),
  h: Math.abs(y2 - y1),
});

/** Keep a menu of size (w, h) opened at (x, y) inside the viewport. */
export function clampMenu(x: number, y: number, w: number, h: number, vw: number, vh: number, margin = 6) {
  return {
    x: x + w + margin > vw ? Math.max(margin, vw - w - margin) : x,
    y: y + h + margin > vh ? Math.max(margin, vh - h - margin) : y,
  };
}
