"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useContent } from "../content/ContentProvider";
import { complete, promptPath, runCommand, type Line, type Tone } from "../lib/terminal";
import { useAchievements } from "../store/achievements";
import { usePhone } from "../store/phone";
import { usePower } from "../store/power";
import { useWindows } from "../store/windows";
import { openApp, openItem, openProject } from "./launch";
import type { AppId } from "./registry";
import type { AppProps } from "./types";

interface Entry {
  id: number;
  prompt?: string;
  input?: string;
  lines: Line[];
}

const toneClass: Record<Tone, string> = {
  default: "text-[#d5dbe8]",
  muted: "text-[#6f7890]",
  accent: "text-[#bccbeb]",
  success: "text-[#7fcf9e]",
  error: "text-[#e2787a]",
  gold: "text-[#c8a96f]",
};

let entrySeq = 0;

/** Terminals are night creatures. */
export function Terminal({ windowId, screenId }: AppProps) {
  const content = useContent();
  const user = content.profile.handle;
  const [cwd, setCwd] = useState<string[]>([]);
  const [entries, setEntries] = useState<Entry[]>(() => [
    {
      id: entrySeq++,
      lines: [
        { text: "MoonOS 1.0 — moonsh", tone: "accent" },
        { text: "Type `help` to see what I can do. Try `whoami` or `ls`.", tone: "muted" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const prompt = `${user}@moonos:${promptPath(cwd)}$`;

  function submit() {
    const raw = input;
    setInput("");
    setCursor(null);
    const nextHistory = raw.trim() ? [...history, raw] : history;
    setHistory(nextHistory);
    const res = runCommand(raw, { content, cwd, history: nextHistory });
    if (raw.trim()) useAchievements.getState().trackCommand();

    let cleared = false;
    for (const fx of res.effects) {
      switch (fx.type) {
        case "clear":
          cleared = true;
          break;
        case "exit":
          if (windowId) useWindows.getState().close(windowId);
          else if (screenId) usePhone.getState().pop();
          return;
        case "restart":
          setTimeout(() => usePower.getState().restart(), 400);
          break;
        case "openApp":
          openApp(fx.app as AppId, fx.params);
          break;
        case "openUrl":
          window.open(fx.href, "_blank", "noopener,noreferrer");
          break;
        case "openProject":
          openProject({ slug: fx.slug, title: fx.title });
          break;
        case "openItem":
          openItem(fx.slug, fx.item);
          break;
        case "achievement":
          useAchievements.getState().unlock(fx.id);
          break;
      }
    }
    setCwd(res.cwd);
    if (cleared) setEntries([]);
    else setEntries((e) => [...e, { id: entrySeq++, prompt, input: raw, lines: res.lines }]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const i = cursor === null ? history.length - 1 : Math.max(0, cursor - 1);
      setCursor(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cursor === null) return;
      const i = cursor + 1;
      if (i >= history.length) {
        setCursor(null);
        setInput("");
      } else {
        setCursor(i);
        setInput(history[i]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const options = complete(input, { content, cwd });
      if (options.length === 1) {
        const tokens = input.split(/\s+/);
        tokens[tokens.length - 1] = options[0];
        setInput(tokens.join(" ") + (options[0].endsWith("/") ? "" : " "));
      } else if (options.length > 1) {
        setEntries((en) => [
          ...en,
          { id: entrySeq++, prompt, input, lines: [{ text: options.join("   "), tone: "muted" }] },
        ]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  }

  return (
    <div
      ref={scrollRef}
      onClick={() => {
        if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true });
      }}
      className="scroll-area selectable h-full bg-[#05070d] px-4 py-3 font-mono text-[12.5px] leading-[1.6]"
    >
      {entries.map((entry) => (
        <div key={entry.id}>
          {entry.prompt !== undefined && (
            <p className="break-all whitespace-pre-wrap">
              <PromptText prompt={entry.prompt} />
              <span className="text-[#e9ecf3]"> {entry.input}</span>
            </p>
          )}
          {entry.lines.map((l, i) => (
            <p key={i} className={`break-words whitespace-pre-wrap ${toneClass[l.tone ?? "default"]}`}>
              {l.text || " "}
            </p>
          ))}
        </div>
      ))}
      <label className="flex items-baseline gap-2">
        <PromptText prompt={prompt} />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label="Terminal input"
          className="min-w-0 flex-1 bg-transparent text-[#e9ecf3] caret-[#bccbeb] outline-none focus-visible:outline-none"
        />
      </label>
    </div>
  );
}

function PromptText({ prompt }: { prompt: string }) {
  const [userHost, path] = prompt.split(":");
  return (
    <span className="shrink-0">
      <span className="text-[#7fcf9e]">{userHost}</span>
      <span className="text-[#6f7890]">:</span>
      <span className="text-[#8ea7dc]">{path}</span>
    </span>
  );
}
