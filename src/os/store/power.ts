"use client";

import { create } from "zustand";
import { useWindows } from "./windows";

export type PowerState = "booting" | "on" | "shutting-down" | "off";

interface PowerStore {
  state: PowerState;
  /** True when the next boot must play in full (restart / replay from settings). */
  fullBoot: boolean;
  bootDone: () => void;
  restart: () => void;
  shutdown: () => void;
  powerOn: () => void;
}

export const usePower = create<PowerStore>()((set) => ({
  state: "booting",
  fullBoot: false,
  bootDone: () => set({ state: "on", fullBoot: false }),
  restart: () => {
    useWindows.getState().closeAll();
    set({ state: "booting", fullBoot: true });
  },
  shutdown: () => {
    useWindows.getState().closeAll();
    set({ state: "shutting-down" });
    setTimeout(() => set({ state: "off" }), 2200);
  },
  powerOn: () => set({ state: "booting", fullBoot: false }),
}));
