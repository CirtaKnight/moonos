"use client";

import { RotateCcw, Shuffle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { autoIndent, computeStats, SNIPPETS } from "../../lib/games/keystroke";
import { readJSON, writeJSON } from "../../lib/storage";
import { unlock } from "../../store/achievements";
import type { AppProps } from "../types";

const BEST_KEY = "keystroke-best";

/** Keystroke — type real code. Live WPM and accuracy; Enter auto-indents. */
export function Keystroke(_props: AppProps) {
  void _props;
  const [index, setIndex] = useState(() => Math.floor(Math.random() * SNIPPETS.length));
  const snippet = SNIPPETS[index];
  const target = snippet.code;
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [keys, setKeys] = useState({ total: 0, mistakes: 0 });
  const [now, setNow] = useState(0);
  const [best, setBest] = useState(() => readJSON(BEST_KEY, 0));
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const id = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(id);
  }, [startedAt, finishedAt]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [index]);

  const elapsed = startedAt ? (finishedAt ?? (now || startedAt)) - startedAt : 0;
  const stats = computeStats(target, typed, keys.total, keys.mistakes, elapsed);
  const done = finishedAt !== null;

  function reset(next = index) {
    setIndex(next);
    setTyped("");
    setStartedAt(null);
    setFinishedAt(null);
    setKeys({ total: 0, mistakes: 0 });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (done) return;
    if (e.key === "Tab") e.preventDefault();
    if (e.key === "Backspace") {
      e.preventDefault();
      setTyped((t) => t.slice(0, -1));
      return;
    }
    let ch = e.key === "Enter" ? "\n" : e.key === "Tab" ? "  " : e.key.length === 1 ? e.key : null;
    if (ch === null || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    const t0 = startedAt ?? performance.now();
    if (!startedAt) setStartedAt(t0);
    if (ch === "\n") ch += autoIndent(target, typed.length + 1);
    const nextTyped = (typed + ch).slice(0, target.length);
    const wrong = [...ch].some((c, i) => target[typed.length + i] !== c);
    const k = { total: keys.total + 1, mistakes: keys.mistakes + (wrong ? 1 : 0) };
    setKeys(k);
    setTyped(nextTyped);
    if (nextTyped.length >= target.length) {
      const end = performance.now();
      setFinishedAt(end);
      const final = computeStats(target, nextTyped, k.total, k.mistakes, end - t0);
      if (final.wpm >= 60) unlock("keystroke-60");
      if (final.accuracy === 100) unlock("keystroke-perfect");
      if (final.wpm > best && final.accuracy >= 90) {
        setBest(final.wpm);
        writeJSON(BEST_KEY, final.wpm);
      }
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#05070d] text-[#d5dbe8]" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      <div className="flex shrink-0 items-center gap-4 border-b border-white/10 px-4 py-2.5 font-mono text-xs">
        <span className="rounded bg-white/10 px-2 py-0.5 text-[#bccbeb]">{snippet.lang}</span>
        <Stat label="WPM" value={stats.wpm} />
        <Stat label="ACC" value={`${stats.accuracy}%`} />
        <Stat label="TIME" value={`${(elapsed / 1000).toFixed(1)}s`} />
        <Stat label="BEST" value={best} />
        <div className="ml-auto flex gap-1">
          <IconBtn label="Restart" onClick={() => reset()}>
            <RotateCcw size={14} />
          </IconBtn>
          <IconBtn label="Another snippet" onClick={() => reset((index + 1 + Math.floor(Math.random() * (SNIPPETS.length - 1))) % SNIPPETS.length)}>
            <Shuffle size={14} />
          </IconBtn>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-auto p-5">
        <pre className="font-mono text-[15px] leading-relaxed break-words whitespace-pre-wrap">
          {target.split("").map((c, i) => {
            const state = i < typed.length ? (typed[i] === c ? "ok" : "bad") : i === typed.length ? "cursor" : "todo";
            const cls =
              state === "ok" ? "text-[#e9ecf3]" : state === "bad" ? "bg-[#e2787a]/30 text-[#e2787a]" : state === "cursor" ? "bg-[#bccbeb]/25 text-[#8c94a8] underline decoration-[#bccbeb]" : "text-[#4b5366]";
            return (
              <span key={i} className={cls}>
                {c === "\n" ? (state === "bad" ? "↵\n" : "\n") : c}
              </span>
            );
          })}
        </pre>
        <textarea
          ref={inputRef}
          aria-label="Type the code here"
          value=""
          onChange={() => {}}
          onKeyDown={onKeyDown}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="absolute h-px w-px opacity-0"
        />
        {!startedAt && <p className="mt-6 text-center font-mono text-xs text-[#5c6478]">Start typing — the timer starts with your first key.</p>}
        {done && (
          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <p className="font-mono text-lg text-[#c8a96f]">
              {stats.wpm} WPM · {stats.accuracy}% accuracy
            </p>
            <button type="button" onClick={() => reset((index + 1) % SNIPPETS.length)} className="rounded-full bg-[#bccbeb] px-4 py-1.5 text-sm font-medium text-[#0a0f1c]">
              Next snippet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span>
      <span className="text-[#5c6478]">{label} </span>
      <span className="text-[#e9ecf3] tabular-nums">{value}</span>
    </span>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid size-7 place-items-center rounded-md text-[#8c94a8] hover:bg-white/10 hover:text-white">
      {children}
    </button>
  );
}
