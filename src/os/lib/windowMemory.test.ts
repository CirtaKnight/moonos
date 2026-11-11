import { beforeEach, describe, expect, it } from "vitest";
import { useWindows, type WindowInstance } from "../store/windows";
import { parseWindowMemory, serializeWindowMemory, snapshotWindows, trimMemory } from "./windowMemory";

const bounds = { x: 0, y: 32, w: 1280, h: 620 };
const known = new Set(["about", "terminal", "folder"]);

const win = (id: string, appId: string, z: number, extra: Partial<WindowInstance> = {}): WindowInstance => ({
  id,
  appId,
  key: appId,
  title: appId,
  params: {},
  rect: { x: 100, y: 100, w: 500, h: 400 },
  z,
  minimized: false,
  maximized: false,
  snap: null,
  ...extra,
});

beforeEach(() => {
  useWindows.setState({ windows: [], memory: {}, focusedId: null, nextZ: 1, openCount: 0, bounds });
});

describe("window memory", () => {
  it("snapshots windows bottom-most first, without ids or z", () => {
    const snap = snapshotWindows([win("w2", "terminal", 5), win("w1", "about", 2, { maximized: true })]);
    expect(snap.map((w) => w.appId)).toEqual(["about", "terminal"]);
    expect(snap[0]).not.toHaveProperty("id");
    expect(snap[0].maximized).toBe(true);
  });

  it("round-trips and drops unknown apps and malformed entries", () => {
    const raw = serializeWindowMemory([win("w1", "about", 1), win("w2", "gone", 2)], { about: { x: 1, y: 2, w: 300, h: 300 } });
    const back = parseWindowMemory(raw, known);
    expect(back.windows.map((w) => w.appId)).toEqual(["about"]);
    expect(back.memory.about).toEqual({ x: 1, y: 2, w: 300, h: 300 });
    expect(parseWindowMemory("{not json", known)).toEqual({ windows: [], memory: {} });
    expect(parseWindowMemory(JSON.stringify({ v: 99, windows: [] }), known)).toEqual({ windows: [], memory: {} });
  });

  it("keeps only the most recent remembered rects", () => {
    const many = Object.fromEntries(Array.from({ length: 5 }, (_, i) => [`k${i}`, { x: i, y: 0, w: 300, h: 300 }]));
    expect(Object.keys(trimMemory(many, 2))).toEqual(["k3", "k4"]);
  });
});

describe("window store with memory", () => {
  it("reopens a window where it was last moved", () => {
    const s = useWindows.getState();
    const id = s.open("terminal", { title: "Terminal" });
    useWindows.getState().setRect(id, { x: 300, y: 200 });
    useWindows.getState().close(id);
    const again = useWindows.getState().open("terminal", { title: "Terminal" });
    expect(useWindows.getState().windows.find((w) => w.id === again)!.rect).toMatchObject({ x: 300, y: 200 });
  });

  it("restores saved windows in order and focuses the top one", () => {
    useWindows.getState().restore([
      { appId: "about", key: "about", title: "About", params: {}, rect: { x: 50, y: 60, w: 600, h: 400 }, minimized: false, maximized: false, snap: null },
      { appId: "terminal", key: "terminal", title: "Terminal", params: {}, rect: { x: 5000, y: 60, w: 600, h: 400 }, minimized: false, maximized: false, snap: "left" },
    ]);
    const { windows, focusedId } = useWindows.getState();
    expect(windows.map((w) => w.appId)).toEqual(["about", "terminal"]);
    expect(windows.find((w) => w.id === focusedId)!.appId).toBe("terminal");
    // Off-screen rects are pulled back onto the desktop.
    expect(windows[1].rect.x).toBeLessThan(bounds.w);
    expect(windows[1].snap).toBe("left");
  });
});

describe("restore under existing windows", () => {
  it("keeps a deep-linked window on top", () => {
    const deep = useWindows.getState().open("folder", { title: "MoonOS", key: "folder:moonos" });
    useWindows.getState().restore([
      { appId: "about", key: "about", title: "About", params: {}, rect: { x: 50, y: 60, w: 600, h: 400 }, minimized: false, maximized: false, snap: null },
    ]);
    const { windows, focusedId } = useWindows.getState();
    expect(focusedId).toBe(deep);
    const top = windows.reduce((a, b) => (a.z > b.z ? a : b));
    expect(top.id).toBe(deep);
  });
});
