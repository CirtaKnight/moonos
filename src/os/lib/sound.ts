"use client";

import { useSettings } from "../store/settings";

/**
 * Tiny synthesized UI sounds (no audio files). Silent unless the visitor
 * turns sound on in Settings.
 */
type Sound = "open" | "close" | "notify" | "boot" | "error";

let ctx: AudioContext | null = null;

function tone(freq: number, start: number, duration: number, gain = 0.05, type: OscillatorType = "sine") {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export function play(sound: Sound) {
  if (typeof window === "undefined" || !useSettings.getState().sound) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    switch (sound) {
      case "open":
        tone(660, 0, 0.12);
        tone(990, 0.05, 0.14, 0.035);
        break;
      case "close":
        tone(520, 0, 0.1, 0.04);
        break;
      case "notify":
        tone(880, 0, 0.18, 0.04);
        tone(1320, 0.12, 0.25, 0.03);
        break;
      case "error":
        tone(220, 0, 0.18, 0.05, "triangle");
        break;
      case "boot":
        // A soft rising fifth, like moonrise.
        [392, 587, 784].forEach((f, i) => tone(f, i * 0.16, 0.9, 0.035));
        break;
    }
  } catch {
    /* audio unavailable — stay silent */
  }
}
