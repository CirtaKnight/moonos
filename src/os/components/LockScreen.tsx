"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useContent } from "../content/ContentProvider";
import { useNow } from "../hooks";
import { moonPhase, moonPhaseName } from "../lib/moon";
import { pointer } from "../lib/pointer";
import { usePower } from "../store/power";
import { useSettings } from "../store/settings";
import { Avatar } from "./Avatar";
import { MoonGlyph } from "./MoonGlyph";
import { Starfield } from "./Starfield";

/**
 * Screensaver → lock screen. The screensaver drifts a moon across a starfield; any input
 * reveals the lock screen, and a click / key unlocks. No password: it's a portfolio.
 */
export function LockScreen() {
  const initial = usePower((s) => s.lockPhase);
  const unlockScreen = usePower((s) => s.unlockScreen);
  const [phase, setPhase] = useState(initial);
  const { profile } = useContent();
  const now = useNow(1000);

  useEffect(() => {
    // Ignore the input that triggered the lock (e.g. the Alt+L key-up).
    const armedAt = performance.now() + 400;
    const wake = (e: Event) => {
      if (performance.now() < armedAt) return;
      if (phase === "saver") {
        setPhase("lock");
        return;
      }
      if (e.type === "keydown" || e.type === "pointerdown") unlockScreen();
    };
    const events = phase === "saver" ? ["pointermove", "pointerdown", "keydown", "wheel"] : ["pointerdown", "keydown"];
    events.forEach((ev) => window.addEventListener(ev, wake));
    return () => events.forEach((ev) => window.removeEventListener(ev, wake));
  }, [phase, unlockScreen]);

  const time = now?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ?? "";
  const date = now?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) ?? "";
  const lunar = now ? moonPhase(now) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[300] overflow-hidden bg-[#030409] text-[#e9ecf3]"
      role="dialog"
      aria-label={phase === "saver" ? "Screensaver" : "Locked. Press any key to unlock."}
    >
      <Starfield />
      <AnimatePresence mode="wait">
        {phase === "saver" ? (
          <Saver key="saver" time={time} phase={lunar} />
        ) : (
          <motion.div
            key="lock"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-between bg-black/35 py-[12vh] backdrop-blur-md"
          >
            <div className="text-center">
              <p className="text-[clamp(4rem,12vw,8rem)] leading-none font-extralight tracking-tight tabular-nums">{time}</p>
              <p className="mt-2 text-lg text-[#bccbeb]">{date}</p>
              <p className="mt-1 flex items-center justify-center gap-2 text-sm text-[#8c94a8]">
                <MoonGlyph phase={lunar} size={14} /> {moonPhaseName(lunar)}
              </p>
            </div>
            <button type="button" onClick={unlockScreen} className="group flex flex-col items-center gap-3">
              <Avatar profile={profile} size={84} />
              <span className="text-base font-medium">{profile.name}</span>
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-[#bccbeb] transition group-hover:bg-white/20">
                Click or press any key to unlock <ArrowRight size={14} />
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Saver({ time, phase }: { time: string; phase: number }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  // A slow Lissajous drift so the moon never burns into one spot.
  const x = 50 + Math.sin(t * 0.11) * 32;
  const y = 50 + Math.sin(t * 0.07 + 1) * 26;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 text-[#e9ecf3]"
        style={{ left: `${x}%`, top: `${y}%` }}
      >
        <MoonGlyph phase={phase} size={120} className="drop-shadow-[0_0_40px_rgb(188_203_235/0.45)]" />
        <span className="font-mono text-2xl tracking-[0.3em] tabular-nums text-[#bccbeb]">{time}</span>
      </div>
    </motion.div>
  );
}

/** Starts the screensaver after the configured idle time (desktop only). */
export function useIdleScreensaver() {
  const minutes = useSettings((s) => s.screensaverMinutes);
  useEffect(() => {
    if (!minutes) return;
    let last = performance.now();
    const bump = () => (last = performance.now());
    const events = ["keydown", "pointerdown", "wheel"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const id = setInterval(() => {
      const lastActivity = Math.max(last, pointer.movedAt);
      if (!document.hidden && performance.now() - lastActivity > minutes * 60_000) {
        usePower.getState().lock("saver");
        last = performance.now();
      }
    }, 5000);
    return () => {
      clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [minutes]);
}
