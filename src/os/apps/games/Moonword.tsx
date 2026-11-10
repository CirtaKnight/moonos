"use client";

import { motion } from "motion/react";
import { Check, CornerDownLeft, Delete, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  dailyWord,
  emptyStats,
  evaluate,
  isValidGuess,
  keyboardMarks,
  puzzleNumber,
  recordResult,
  shareText,
  type Mark,
  type MoonwordStats,
} from "../../lib/games/moonword";
import { play } from "../../lib/sound";
import { readJSON, writeJSON } from "../../lib/storage";
import { unlock } from "../../store/achievements";
import { useWindows } from "../../store/windows";
import type { AppProps } from "../types";

const ROWS = 6;
const KEYS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const STATE_KEY = "moonword-state";
const STATS_KEY = "moonword-stats";

interface DayState {
  n: number;
  guesses: string[];
  status: "playing" | "won" | "lost";
}

const tile: Record<Mark | "empty" | "typing", string> = {
  hit: "bg-gold text-[#1a1406] border-gold",
  near: "bg-[#5b77b5] text-white border-[#5b77b5]",
  miss: "bg-[#20263a] text-[#8c94a8] border-[#20263a]",
  empty: "border-line",
  typing: "border-line-strong text-fg",
};

/** Moonword — the daily developer / space word. Five letters, six tries. */
export function Moonword({ windowId }: AppProps) {
  const today = useMemo(() => new Date(), []);
  const n = puzzleNumber(today);
  const answer = dailyWord(today);
  const [day, setDay] = useState<DayState>(() => {
    const saved = readJSON<DayState | null>(STATE_KEY, null);
    return saved?.n === n ? saved : { n, guesses: [], status: "playing" };
  });
  const [stats, setStats] = useState<MoonwordStats>(() => readJSON(STATS_KEY, emptyStats()));
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const say = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const submit = useCallback(() => {
    if (day.status !== "playing") return;
    if (!isValidGuess(input)) {
      setShake((s) => s + 1);
      play("error");
      say("Five letters, please");
      return;
    }
    const guesses = [...day.guesses, input.toUpperCase()];
    const won = guesses[guesses.length - 1] === answer;
    const status: DayState["status"] = won ? "won" : guesses.length >= ROWS ? "lost" : "playing";
    const next = { n, guesses, status };
    setDay(next);
    writeJSON(STATE_KEY, next);
    setInput("");
    if (status !== "playing") {
      const s = recordResult(stats, n, won, guesses.length);
      setStats(s);
      writeJSON(STATS_KEY, s);
      if (won) {
        play("notify");
        unlock("moonword-solve");
        if (guesses.length <= 3) unlock("moonword-3");
        if (s.streak >= 3) unlock("moonword-streak");
        say(["Lunar!", "Stellar!", "Brilliant!", "Nice!", "Phew!", "Just in orbit!"][guesses.length - 1]);
      } else {
        say(answer);
      }
    }
  }, [day, input, answer, n, stats]);

  const press = useCallback(
    (key: string) => {
      if (day.status !== "playing") return;
      if (key === "ENTER") submit();
      else if (key === "BACK") setInput((v) => v.slice(0, -1));
      else if (/^[A-Z]$/.test(key)) setInput((v) => (v.length < 5 ? v + key : v));
    },
    [day.status, submit],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (windowId && useWindows.getState().focusedId !== windowId) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") press("ENTER");
      else if (e.key === "Backspace") press("BACK");
      else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase());
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, windowId]);

  const keyMarks = keyboardMarks(day.guesses, answer);
  const rows = Array.from({ length: ROWS }, (_, r) => {
    if (r < day.guesses.length) return { letters: day.guesses[r].split(""), marks: evaluate(day.guesses[r], answer) as (Mark | "empty" | "typing")[] };
    if (r === day.guesses.length && day.status === "playing")
      return { letters: input.padEnd(5).split(""), marks: input.padEnd(5).split("").map((c) => (c.trim() ? "typing" : "empty")) as ("typing" | "empty")[] };
    return { letters: Array(5).fill(" "), marks: Array(5).fill("empty") as "empty"[] };
  });

  const share = async () => {
    const text = shareText(n, day.guesses, answer, day.status === "won");
    try {
      await navigator.clipboard.writeText(text);
      say("Result copied");
    } catch {
      say("Couldn't copy");
    }
  };

  return (
    <div className="relative flex h-full flex-col items-center gap-3 overflow-hidden p-4 select-none">
      <div className="flex w-full max-w-sm items-baseline justify-between text-xs text-muted">
        <span className="font-display tracking-[0.2em] text-fg uppercase">Moonword #{n}</span>
        <span>
          Streak {stats.streak} · Best {stats.maxStreak}
        </span>
      </div>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div className="grid aspect-[5/6] h-full max-h-[24rem] grid-rows-6 gap-1.5 [container-type:size]">
        {rows.map((row, r) => (
          <motion.div
            key={`${r}-${r === day.guesses.length ? shake : 0}`}
            animate={r === day.guesses.length && shake ? { x: [0, -8, 8, -6, 6, 0] } : {}}
            transition={{ duration: 0.35 }}
            className="grid min-h-0 grid-cols-5 gap-1.5"
          >
            {row.letters.map((ch, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={r < day.guesses.length ? { rotateX: [90, 0] } : {}}
                transition={{ delay: i * 0.08, duration: 0.25 }}
                className={`grid place-items-center rounded-lg border-2 text-[min(7cqh,1.6rem)] font-bold ${tile[row.marks[i]]}`}
              >
                {ch.trim()}
              </motion.span>
            ))}
          </motion.div>
        ))}
        </div>
      </div>

      {day.status !== "playing" ? (
        <div className="flex flex-col items-center gap-2 pb-2 text-center">
          <p className="text-sm text-fg">
            {day.status === "won" ? (
              <>
                <Check size={14} className="mr-1 inline text-success" /> Solved in {day.guesses.length}. Come back tomorrow for a new word.
              </>
            ) : (
              <>
                The word was <b className="text-gold">{answer}</b>. Tomorrow&apos;s another night.
              </>
            )}
          </p>
          <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink">
            <Share2 size={14} /> Share result
          </button>
        </div>
      ) : (
        <div className="flex w-full max-w-md flex-col gap-1.5 pb-1">
          {KEYS.map((row, r) => (
            <div key={row} className="flex justify-center gap-1">
              {r === 2 && (
                <Key wide onClick={() => press("ENTER")} label="Enter">
                  <CornerDownLeft size={16} />
                </Key>
              )}
              {row.split("").map((k) => (
                <Key key={k} mark={keyMarks[k]} onClick={() => press(k)} label={k}>
                  {k}
                </Key>
              ))}
              {r === 2 && (
                <Key wide onClick={() => press("BACK")} label="Backspace">
                  <Delete size={16} />
                </Key>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 rounded-lg bg-fg px-3 py-1.5 text-sm font-semibold text-bg shadow-window" role="status">
          {toast}
        </div>
      )}
      <p className="text-[10.5px] text-faint">🌕 right spot · 🌓 in the word · 🌑 not in the word</p>
    </div>
  );
}

function Key({ children, onClick, mark, wide, label }: { children: React.ReactNode; onClick: () => void; mark?: Mark; wide?: boolean; label: string }) {
  const bg = mark === "hit" ? "bg-gold text-[#1a1406]" : mark === "near" ? "bg-[#5b77b5] text-white" : mark === "miss" ? "bg-[#151a27] text-faint" : "bg-surface-hover text-fg";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid h-11 place-items-center rounded-md text-sm font-semibold transition active:scale-95 ${wide ? "px-3" : "min-w-0 flex-1"} ${bg}`}
    >
      {children}
    </button>
  );
}
