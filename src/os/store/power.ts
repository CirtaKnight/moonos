"use client";

import { create } from "zustand";
import { unlock } from "./achievements";
import { useWindows } from "./windows";

export type PowerState = "booting" | "on" | "locked" | "shutting-down" | "off";

interface PowerStore {
  state: PowerState;
  /** True when the next boot must play in full (restart / replay from settings). */
  fullBoot: boolean;
  bootDone: () => void;
  restart: () => void;
  shutdown: () => void;
  powerOn: () => void;
  /** What the locked state shows first: the screensaver (idle) or the lock screen (manual). */
  lockPhase: "saver" | "lock";
  lock: (phase?: "saver" | "lock") => void;
  unlockScreen: () => void;
}

let wasOff = false;

export const usePower = create<PowerStore>()((set, get) => ({
  state: "booting",
  fullBoot: false,
  lockPhase: "lock",
  bootDone: () => {
    set({ state: "on", fullBoot: false });
    // Recorded quietly: a toast on every first visit felt like noise.
    unlock("moonrise", { silent: true });
    if (wasOff) {
      wasOff = false;
      unlock("power-cycle");
    }
  },
  restart: () => {
    useWindows.getState().closeAll();
    set({ state: "booting", fullBoot: true });
  },
  shutdown: () => {
    useWindows.getState().closeAll();
    set({ state: "shutting-down" });
    setTimeout(() => set({ state: "off" }), 2200);
  },
  powerOn: () => {
    wasOff = true;
    set({ state: "booting", fullBoot: false });
  },
  // Locking keeps windows open; the desktop stays mounted underneath the lock screen.
  lock: (phase = "lock") => {
    if (get().state === "on") set({ state: "locked", lockPhase: phase });
  },
  unlockScreen: () => {
    if (get().state === "locked") set({ state: "on" });
  },
}));
