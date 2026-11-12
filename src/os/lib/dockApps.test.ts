import { describe, expect, it } from "vitest";
import { moveApp, pinApp, resolvePinned, unpinApp } from "./dockApps";

const known = new Set(["a", "b", "c", "d"]);

describe("dock apps", () => {
  it("uses the defaults until the visitor customises, and drops unknown apps", () => {
    expect(resolvePinned(null, ["a", "b"], known)).toEqual(["a", "b"]);
    expect(resolvePinned(["c", "gone", "a", "c"], ["a", "b"], known)).toEqual(["c", "a"]);
    expect(resolvePinned([], ["a"], known)).toEqual([]);
  });

  it("pins at a position without duplicates, and unpins", () => {
    expect(pinApp(["a", "b"], "c", 1)).toEqual(["a", "c", "b"]);
    expect(pinApp(["a", "b"], "c")).toEqual(["a", "b", "c"]);
    expect(pinApp(["a", "b"], "a", 0)).toEqual(["a", "b"]);
    expect(unpinApp(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("moves an app to a new position", () => {
    expect(moveApp(["a", "b", "c", "d"], "a", 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveApp(["a", "b", "c", "d"], "d", 0)).toEqual(["d", "a", "b", "c"]);
    expect(moveApp(["a", "b"], "a", 99)).toEqual(["b", "a"]);
    expect(moveApp(["a", "b"], "zz", 0)).toEqual(["a", "b"]);
  });
});
