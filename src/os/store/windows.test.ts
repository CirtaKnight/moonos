import { beforeEach, describe, expect, it } from "vitest";
import { clampRect, effectiveRect, useWindows } from "./windows";

const bounds = { x: 0, y: 28, w: 1280, h: 620 };

beforeEach(() => {
  useWindows.setState({ windows: [], memory: {}, focusedId: null, nextZ: 1, openCount: 0, bounds });
});

const s = () => useWindows.getState();

describe("window manager", () => {
  it("opens a window and focuses it", () => {
    const id = s().open("terminal", { title: "Terminal" });
    expect(s().windows).toHaveLength(1);
    expect(s().focusedId).toBe(id);
  });

  it("de-duplicates by key and refocuses the existing window", () => {
    const a = s().open("folder", { title: "A", key: "folder:a" });
    s().open("folder", { title: "B", key: "folder:b" });
    const again = s().open("folder", { title: "A", key: "folder:a" });
    expect(again).toBe(a);
    expect(s().windows).toHaveLength(2);
    expect(s().focusedId).toBe(a);
    const za = s().windows.find((w) => w.id === a)!.z;
    expect(Math.max(...s().windows.map((w) => w.z))).toBe(za);
  });

  it("focus raises z-order", () => {
    const a = s().open("a", { title: "A" });
    const b = s().open("b", { title: "B" });
    s().focus(a);
    const [wa, wb] = [a, b].map((id) => s().windows.find((w) => w.id === id)!);
    expect(wa.z).toBeGreaterThan(wb.z);
  });

  it("minimizing hands focus to the next topmost window", () => {
    const a = s().open("a", { title: "A" });
    const b = s().open("b", { title: "B" });
    s().minimize(b);
    expect(s().focusedId).toBe(a);
  });

  it("activate toggles minimize for the focused window and restores minimized ones", () => {
    const a = s().open("a", { title: "A" });
    s().activate(a);
    expect(s().windows[0].minimized).toBe(true);
    s().activate(a);
    expect(s().windows[0].minimized).toBe(false);
    expect(s().focusedId).toBe(a);
  });

  it("closing the focused window focuses the next one", () => {
    const a = s().open("a", { title: "A" });
    const b = s().open("b", { title: "B" });
    s().close(b);
    expect(s().focusedId).toBe(a);
    s().close(a);
    expect(s().focusedId).toBeNull();
  });

  it("snap and maximize produce full-height rectangles", () => {
    const a = s().open("a", { title: "A" });
    s().snapTo(a, "right");
    const win = s().windows[0];
    expect(effectiveRect(win, bounds)).toEqual({ x: 640, y: 28, w: 640, h: 620 });
    s().toggleMaximize(a);
    expect(s().windows[0].snap).toBeNull();
    expect(s().windows[0].maximized).toBe(false);
    s().toggleMaximize(a);
    expect(effectiveRect(s().windows[0], bounds)).toEqual(bounds);
  });

  it("moving a window un-maximizes it and keeps it on screen", () => {
    const a = s().open("a", { title: "A" });
    s().toggleMaximize(a);
    s().setRect(a, { x: -5000, y: -100 });
    const win = s().windows[0];
    expect(win.maximized).toBe(false);
    expect(win.rect.y).toBe(bounds.y);
    expect(win.rect.x + win.rect.w).toBeGreaterThanOrEqual(120);
  });
});

describe("clampRect", () => {
  it("enforces minimum size", () => {
    const r = clampRect({ x: 10, y: 40, w: 10, h: 10 }, bounds);
    expect(r.w).toBe(300);
    expect(r.h).toBe(200);
  });
});
