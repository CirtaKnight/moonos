"use client";

import { motion } from "motion/react";
import { Orbit as RingedIcon, RotateCcw, Rocket, Sparkle } from "lucide-react";
import { useEffect, useState } from "react";
import { MoonGlyph } from "../../components/MoonGlyph";
import { flip, newBoard, settle, type MemoryState, type Symbol } from "../../lib/games/memory";
import { readJSON, writeJSON } from "../../lib/storage";
import { unlock } from "../../store/achievements";
import type { AppProps } from "../types";

const BEST_KEY = "memory-best";
const nowMs = () => Date.now();

function Face({ symbol }: { symbol: Symbol }) {
  const phase = { new: 0.02, crescent: 0.13, quarter: 0.25, gibbous: 0.38, full: 0.5 } as Record<string, number>;
  if (symbol in phase) return <MoonGlyph phase={phase[symbol]} size={40} className="text-[#e9ecf3]" />;
  if (symbol === "comet") return <Sparkle size={34} className="text-[#c8a96f]" />;
  if (symbol === "ringed") return <RingedIcon size={34} className="text-[#d6b6e8]" />;
  return <Rocket size={32} className="text-[#f29fb8]" />;
}

/** Phase memory: find the 8 pairs in as few moves as possible. */
export function Memory(_props: AppProps) {
  void _props;
  const [state, setState] = useState<MemoryState>(() => newBoard());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [best, setBest] = useState<number | null>(() => readJSON<number | null>(BEST_KEY, null));

  // Hide a mismatched pair after a moment.
  useEffect(() => {
    if (state.open.length !== 2) return;
    const t = setTimeout(() => setState((s) => settle(s)), 800);
    return () => clearTimeout(t);
  }, [state.open]);

  useEffect(() => {
    if (!startedAt || state.done) return;
    const id = setInterval(() => setElapsed(Math.floor((nowMs() - startedAt) / 1000)), 500);
    return () => clearInterval(id);
  }, [startedAt, state.done]);

  function tap(i: number) {
    if (!startedAt) setStartedAt(nowMs());
    const next = flip(state, i);
    setState(next);
    if (next.done && !state.done) {
      if (next.moves <= 18) unlock("memory-18");
      if (best === null || next.moves < best) {
        setBest(next.moves);
        writeJSON(BEST_KEY, next.moves);
      }
    }
  }

  function restart() {
    setState(newBoard());
    setStartedAt(null);
    setElapsed(0);
  }

  return (
    <div className="flex h-full flex-col items-center gap-3 bg-[#05070d] p-4 select-none">
      <div className="flex w-full max-w-md items-center justify-between font-mono text-xs text-[#8c94a8]">
        <span>MOVES <b className="text-[#e9ecf3]">{state.moves}</b></span>
        <span>TIME <b className="text-[#e9ecf3]">{elapsed}s</b></span>
        <span>BEST <b className="text-[#c8a96f]">{best ?? "—"}</b></span>
        <button type="button" onClick={restart} aria-label="New game" className="grid size-7 place-items-center rounded-md hover:bg-white/10 hover:text-white">
          <RotateCcw size={14} />
        </button>
      </div>
      <div className="grid min-h-0 w-full max-w-md flex-1 grid-cols-4 content-center gap-2">
        {state.cards.map((c, i) => {
          const up = c.matched || state.open.includes(i);
          return (
            <button
              key={c.id}
              type="button"
              aria-label={up ? c.symbol : "Hidden card"}
              onClick={() => tap(i)}
              className="aspect-square [perspective:600px]"
            >
              <motion.span
                animate={{ rotateY: up ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="relative block h-full w-full [transform-style:preserve-3d]"
              >
                <span className="absolute inset-0 grid place-items-center rounded-xl border border-white/10 bg-[radial-gradient(circle_at_30%_25%,#1d2640,#0b0f1a)] [backface-visibility:hidden]">
                  <span className="size-2 rounded-full bg-[#bccbeb]/40" />
                </span>
                <span
                  className={`absolute inset-0 grid place-items-center rounded-xl border [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                    c.matched ? "border-[#c8a96f]/60 bg-[#c8a96f]/10" : "border-[#bccbeb]/40 bg-[#10141f]"
                  }`}
                >
                  <Face symbol={c.symbol} />
                </span>
              </motion.span>
            </button>
          );
        })}
      </div>
      {state.done && (
        <p className="font-mono text-sm text-[#c8a96f]">
          Cleared in {state.moves} moves and {elapsed}s.{" "}
          <button type="button" onClick={restart} className="text-[#bccbeb] underline">
            Again?
          </button>
        </p>
      )}
    </div>
  );
}
