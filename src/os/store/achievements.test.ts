import { beforeEach, describe, expect, it } from "vitest";
import { ACHIEVEMENTS } from "../lib/achievements";
import { TRACKED_APPS, useAchievements } from "./achievements";
import { useNotifications } from "./notifications";

const s = () => useAchievements.getState();

beforeEach(() => {
  useAchievements.setState({ unlocked: {}, appsOpened: [], commandsRun: 0 });
  useNotifications.setState({ items: [], toasts: [] });
});

describe("achievements", () => {
  it("has unique ids", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("unlocks once and notifies once", () => {
    s().unlock("moonrise");
    s().unlock("moonrise");
    expect(Object.keys(s().unlocked)).toEqual(["moonrise"]);
    expect(useNotifications.getState().items).toHaveLength(1);
  });

  it("ignores unknown ids", () => {
    s().unlock("nope");
    expect(s().unlocked).toEqual({});
  });

  it("tracks apps toward Explorer and Completionist", () => {
    TRACKED_APPS.slice(0, 4).forEach((a) => s().trackApp(a));
    expect(s().unlocked.explorer).toBeUndefined();
    s().trackApp(TRACKED_APPS[4]);
    expect(s().unlocked.explorer).toBeDefined();
    TRACKED_APPS.forEach((a) => s().trackApp(a));
    expect(s().unlocked.completionist).toBeDefined();
  });

  it("counts terminal commands", () => {
    for (let i = 0; i < 10; i++) s().trackCommand();
    expect(s().unlocked["terminal-regular"]).toBeDefined();
  });
});
