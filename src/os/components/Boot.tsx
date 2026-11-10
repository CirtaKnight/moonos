"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LogoMark, Wordmark } from "./Logo";
import { MoonPhaseLoader } from "./MoonPhaseLoader";

type Status = "ok" | "info" | "warn" | "dim";
interface ParsedLine {
  status: Status;
  text: string;
}

export function parseBootLine(raw: string): ParsedLine {
  const [head, ...rest] = raw.split("|");
  if (rest.length && ["ok", "info", "warn", "dim"].includes(head)) {
    return { status: head as Status, text: rest.join("|") };
  }
  return { status: "info", text: raw };
}

const CHARS_PER_FRAME = 6;
const LINE_PAUSE_MS = 35;
const LOGO_MS = 2600;

/**
 * Boot sequence: a typed kernel-style log, then the logo, then `onDone`.
 * `short` (return visitors) keeps only the last few lines and a quicker logo.
 * Any key, click or tap skips straight to the desktop.
 */
export function Boot({
  lines,
  short,
  onDone,
  onQuickView,
}: {
  lines: string[];
  short: boolean;
  onDone: () => void;
  /** Recruiter shortcut: skip straight to About + Projects. */
  onQuickView?: () => void;
}) {
  const source = (short ? lines.slice(-4) : lines).map(parseBootLine);
  const [phase, setPhase] = useState<"log" | "logo">("log");
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const doneRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  // Typing loop.
  useEffect(() => {
    if (phase !== "log") return;
    if (lineIndex >= source.length) {
      const t = setTimeout(() => setPhase("logo"), 280);
      return () => clearTimeout(t);
    }
    const line = source[lineIndex];
    if (charIndex < line.text.length) {
      const t = setTimeout(
        () => setCharIndex((c) => Math.min(c + CHARS_PER_FRAME, line.text.length)),
        16,
      );
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setLineIndex((i) => i + 1);
        setCharIndex(0);
      },
      short ? 40 : LINE_PAUSE_MS + Math.random() * 70,
    );
    return () => clearTimeout(t);
  }, [phase, lineIndex, charIndex, source, short]);

  // Keep the newest log line in view (the log box itself never scrolls the page).
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lineIndex]);

  // Logo hold, then hand over to the desktop.
  useEffect(() => {
    if (phase !== "logo") return;
    const t = setTimeout(finish, short ? 1500 : LOGO_MS);
    return () => clearTimeout(t);
  }, [phase, short, finish]);

  // Skip on any key / pointer (except the Quick view button, which has its own action).
  useEffect(() => {
    const skip = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest?.("[data-quick-view]")) return;
      finish();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [finish]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#030409] text-[#c9cfdc]"
      role="status"
      aria-label="CirtaKnight OS is booting. Press any key to skip."
    >
      <AnimatePresence mode="wait">
        {phase === "log" ? (
          <motion.div
            key="log"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            ref={logRef}
            className="h-full overflow-hidden px-4 py-5 font-mono text-[11px] leading-[1.65] sm:px-8 sm:py-8 sm:text-[13px]"
          >
            {source.slice(0, lineIndex + 1).map((line, i) => {
              const typed = i < lineIndex ? line.text : line.text.slice(0, charIndex);
              const isCurrent = i === lineIndex;
              return (
                <div key={i} className="flex gap-3 whitespace-pre-wrap break-words">
                  <span className="shrink-0 text-[#4b5366]">
                    [{(i * 0.137 + 0.004).toFixed(6).padStart(10, " ")}]
                  </span>
                  <StatusTag status={line.status} visible={!isCurrent || charIndex >= line.text.length} />
                  <span className={line.status === "dim" ? "text-[#6b7387]" : undefined}>
                    {typed}
                    {isCurrent && <span className="caret ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] bg-[#c9cfdc]" />}
                  </span>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid h-full place-items-center"
            data-theme="night"
          >
            <div className="flex flex-col items-center gap-6">
              <LogoMark size={short ? 84 : 112} animate />
              <motion.div
                initial={{ opacity: 0, letterSpacing: "0.6em" }}
                animate={{ opacity: 1, letterSpacing: "0.32em" }}
                transition={{ delay: 0.7, duration: 1.1, ease: "easeOut" }}
              >
                <Wordmark className="text-lg text-[#e9ecf3] sm:text-2xl" />
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                <MoonPhaseLoader />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {onQuickView && (
        <button
          type="button"
          data-quick-view
          onClick={() => {
            if (doneRef.current) return;
            doneRef.current = true;
            onQuickView();
          }}
          className="absolute bottom-4 left-4 rounded-full border border-[#2a3246] px-3.5 py-1.5 font-mono text-[11px] text-[#bccbeb] transition-colors hover:border-[#bccbeb] hover:bg-[#bccbeb]/10 sm:bottom-6 sm:left-8"
        >
          In a hurry? Quick view →
        </button>
      )}
      <p className="pointer-events-none absolute right-4 bottom-5 font-mono text-[10px] tracking-widest text-[#4b5366] uppercase sm:right-8 sm:bottom-7">
        <span className="hidden sm:inline">Press any key to skip</span>
        <span className="sm:hidden">Tap to skip</span>
      </p>
    </div>
  );
}

function StatusTag({ status, visible }: { status: Status; visible: boolean }) {
  if (status === "dim" || status === "info") return null;
  const style =
    status === "ok" ? "text-[#7fcf9e]" : "text-[#e3b65f]";
  const label = status === "ok" ? "  OK  " : " WARN ";
  return (
    <span className={`shrink-0 ${visible ? "" : "invisible"}`}>
      [<span className={style}>{label}</span>]
    </span>
  );
}
