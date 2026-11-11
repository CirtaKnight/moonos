import { describe, expect, it } from "vitest";
import { moveHome, pageCount, placeHome, slotPosition } from "./homeGrid";

describe("placeHome", () => {
  it("puts `right` ids down the right column of page one and fills the rest in order", () => {
    const l = placeHome(["a", "p1", "b", "p2", "c"], {}, 8, 4, ["p1", "p2"]);
    expect(l).toEqual({ p1: 3, p2: 7, a: 0, b: 1, c: 2 });
  });

  it("keeps saved slots and fills around them", () => {
    const l = placeHome(["a", "b", "c"], { b: 0, c: 9 }, 8, 4);
    expect(l).toEqual({ b: 0, c: 9, a: 1 });
    expect(pageCount(l, 8)).toBe(2);
  });

  it("falls back to the normal fill when the right column is full", () => {
    const l = placeHome(["p1", "p2", "p3"], {}, 8, 4, ["p1", "p2", "p3"]);
    expect(l).toEqual({ p1: 3, p2: 7, p3: 0 });
  });
});

describe("moveHome", () => {
  it("moves into a free slot or swaps with the occupant", () => {
    expect(moveHome({ a: 0, b: 1 }, "a", 5)).toEqual({ a: 5, b: 1 });
    expect(moveHome({ a: 0, b: 1 }, "a", 1)).toEqual({ a: 1, b: 0 });
  });
});

describe("slotPosition", () => {
  it("maps a slot to page, row and column", () => {
    expect(slotPosition(13, 12, 4)).toEqual({ page: 1, row: 0, col: 1 });
  });
});
