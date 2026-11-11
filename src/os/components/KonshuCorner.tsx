"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { KonshuAvatar } from "../apps/Konshu";
import { openApp } from "../apps/launch";
import { useContent } from "../content/ContentProvider";
import { RECRUITER_PATH } from "../lib/resume";
import { useSettings } from "../store/settings";
import { useWindows } from "../store/windows";

const GREETED_KEY = "moonos:konshu-greeted";

function alreadyGreeted() {
  try {
    return sessionStorage.getItem(GREETED_KEY) === "1";
  } catch {
    return false;
  }
}

function markGreeted() {
  try {
    sessionStorage.setItem(GREETED_KEY, "1");
  } catch {
    /* private mode: greet again next time, no harm */
  }
}

const ask = (q?: string) => openApp("konshu", q ? { q } : {}, "Konshu", "konshu");

/**
 * Konshu, floating in the corner: pops in shortly after the desktop appears, says hello
 * once per visit, and opens the chat on click. Hidden while the Konshu window is open.
 */
export function KonshuCorner({ bottom, right = 18, size = 52, compact = false }: { bottom: number; right?: number; size?: number; compact?: boolean }) {
  const { profile } = useContent();
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const chatOpen = useWindows((s) => s.windows.some((w) => w.appId === "konshu"));
  const [shown, setShown] = useState(false);
  const [bubble, setBubble] = useState(false);

  // Pop in after the desktop has settled, then greet (once per session).
  useEffect(() => {
    const t1 = setTimeout(() => setShown(true), 1800);
    const t2 = alreadyGreeted()
      ? undefined
      : setTimeout(() => {
          setBubble(true);
          markGreeted();
        }, 3000);
    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
    };
  }, []);

  // The greeting steps aside on its own after a while.
  useEffect(() => {
    if (!bubble) return;
    const t = setTimeout(() => setBubble(false), 16000);
    return () => clearTimeout(t);
  }, [bubble]);

  const visible = shown && !chatOpen;
  const first = profile.name.split(" ")[0];

  return (
    <div className="pointer-events-none absolute z-[58] flex flex-col items-end gap-2" style={{ right, bottom }} onClick={(e) => e.stopPropagation()}>
      <AnimatePresence>
        {visible && bubble && (
          <motion.div
            key="bubble"
            role="status"
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            style={{ transformOrigin: "bottom right" }}
            className={`glass pointer-events-auto relative rounded-2xl rounded-br-md border border-line-strong p-3.5 pr-8 shadow-window ${compact ? "w-[min(250px,calc(100vw-32px))]" : "w-[270px]"}`}
          >
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setBubble(false)}
              className="absolute top-2 right-2 grid size-6 place-items-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-fg"
            >
              <X size={13} />
            </button>
            <p className="text-[13px] leading-snug text-fg">
              Hi, I&apos;m <span className="text-gold">Konshu</span>, keeper of this sky. Need a hand finding something in {first}&apos;s work?
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setBubble(false);
                  ask("Show me your projects");
                }}
                className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-fg transition-colors hover:border-accent/60"
              >
                Show me the projects
              </button>
              <a
                href={RECRUITER_PATH}
                className="rounded-full border border-gold/50 bg-gold/10 px-2.5 py-1 text-xs text-[#f1e3c4] transition-colors hover:bg-gold/20"
              >
                I&apos;m a recruiter
              </a>
              <button
                type="button"
                onClick={() => {
                  setBubble(false);
                  ask();
                }}
                className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-fg transition-colors hover:border-accent/60"
              >
                Ask something
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <motion.button
            key="avatar"
            type="button"
            aria-label="Ask Konshu"
            title="Ask Konshu"
            data-konshu-corner
            initial={{ opacity: 0, scale: 0.3, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              setBubble(false);
              ask();
            }}
            className="pointer-events-auto relative rounded-full shadow-[0_10px_30px_-6px_rgb(0_0_0/0.7),0_0_24px_-4px_rgb(200_169_111/0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {/* The idle float lives on an inner element so the button itself stays put. */}
            <motion.span
              className="block rounded-full"
              animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <KonshuAvatar size={size} />
            </motion.span>
            {!reduceMotion && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-gold/60"
                initial={{ opacity: 0.9, scale: 1 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 1.6, delay: 0.3, repeat: 2, repeatDelay: 2.5 }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
