import { describe, expect, it } from "vitest";
import { cellAt, clampMenu, intersects, moveIcon, moveIcons, placeIcons, rectFrom } from "./iconGrid";

describe("placeIcons", () => {
  it("fills column-major in default order", () => {
    expect(placeIcons(["a", "b", "c"], {}, 2)).toEqual({ a: { c: 0, r: 0 }, b: { c: 0, r: 1 }, c: { c: 1, r: 0 } });
  });

  it("respects saved cells and fills around them", () => {
    const l = placeIcons(["a", "b", "c"], { b: { c: 0, r: 0 } }, 2);
    expect(l.b).toEqual({ c: 0, r: 0 });
    expect(l.a).toEqual({ c: 0, r: 1 });
    expect(l.c).toEqual({ c: 1, r: 0 });
  });

  it("anchors `right` ids to the top-right corner", () => {
    const l = placeIcons(["a", "p1", "b", "p2", "p3"], {}, 2, { cols: 5, right: ["p1", "p2", "p3"] });
    expect(l).toEqual({ a: { c: 0, r: 0 }, b: { c: 0, r: 1 }, p1: { c: 4, r: 0 }, p2: { c: 4, r: 1 }, p3: { c: 3, r: 0 } });
  });

  it("keeps saved cells for right-anchored ids", () => {
    const l = placeIcons(["p1"], { p1: { c: 1, r: 1 } }, 2, { cols: 5, right: ["p1"] });
    expect(l.p1).toEqual({ c: 1, r: 1 });
  });

  it("drops saved cells that no longer fit or collide", () => {
    const l = placeIcons(["a", "b"], { a: { c: 0, r: 9 }, b: { c: 3, r: 0 } }, 4);
    expect(l.a).toEqual({ c: 0, r: 0 });
    expect(l.b).toEqual({ c: 3, r: 0 });
  });
});

describe("moveIcon", () => {
  it("moves into an empty cell", () => {
    expect(moveIcon({ a: { c: 0, r: 0 } }, "a", { c: 2, r: 1 })).toEqual({ a: { c: 2, r: 1 } });
  });
  it("swaps with an occupant", () => {
    const l = moveIcon({ a: { c: 0, r: 0 }, b: { c: 0, r: 1 } }, "a", { c: 0, r: 1 });
    expect(l).toEqual({ a: { c: 0, r: 1 }, b: { c: 0, r: 0 } });
  });
});

describe("geometry helpers", () => {
  it("finds and clamps cells", () => {
    expect(cellAt(150, 250, 92, 100, 5, 4)).toEqual({ c: 1, r: 2 });
    expect(cellAt(-10, 9999, 92, 100, 5, 4)).toEqual({ c: 0, r: 4 });
  });
  it("detects rectangle overlap", () => {
    expect(intersects(rectFrom(10, 10, 0, 0), { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(intersects({ x: 0, y: 0, w: 4, h: 4 }, { x: 5, y: 5, w: 1, h: 1 })).toBe(false);
  });
  it("keeps menus inside the viewport", () => {
    expect(clampMenu(10, 10, 200, 100, 1000, 800)).toEqual({ x: 10, y: 10 });
    expect(clampMenu(950, 780, 200, 100, 1000, 800)).toEqual({ x: 794, y: 694 });
  });
});

describe("moveIcons", () => {
  const base = { a: { c: 0, r: 0 }, b: { c: 0, r: 1 }, x: { c: 2, r: 0 } };

  it("moves a group by the same offset", () => {
    const l = moveIcons(base, ["a", "b"], 1, 0, 4, 4);
    expect(l.a).toEqual({ c: 1, r: 0 });
    expect(l.b).toEqual({ c: 1, r: 1 });
    expect(l.x).toEqual({ c: 2, r: 0 });
  });

  it("clamps the offset so the group stays on the grid", () => {
    const l = moveIcons(base, ["a", "b"], 0, 9, 3, 4);
    expect(l.a).toEqual({ c: 0, r: 1 });
    expect(l.b).toEqual({ c: 0, r: 2 });
  });

  it("moves displaced icons into the vacated cells", () => {
    const l = moveIcons(base, ["a", "b"], 2, 0, 4, 4);
    expect(l.a).toEqual({ c: 2, r: 0 });
    expect(l.b).toEqual({ c: 2, r: 1 });
    expect(l.x).toEqual({ c: 0, r: 0 });
    const cells = Object.values(l).map((c) => `${c.c}:${c.r}`);
    expect(new Set(cells).size).toBe(cells.length);
  });

  it("is a no-op for an empty selection or zero offset", () => {
    expect(moveIcons(base, [], 1, 1, 4, 4)).toBe(base);
    expect(moveIcons(base, ["a"], 0, 0, 4, 4)).toBe(base);
  });
});
