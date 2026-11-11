"use client";

import { motion } from "motion/react";
import { ArrowUp, ArrowUpRight, FolderOpen, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { LogoMark } from "../components/Logo";
import { MoonPhaseLoader } from "../components/MoonPhaseLoader";
import { useContent } from "../content/ContentProvider";
import { extractActions, localAnswer, type KonshuAction } from "../lib/konshu";
import { openApp, openProject } from "./launch";
import type { AppId } from "./registry";
import type { AppProps } from "./types";

interface Message {
  id: number;
  role: "user" | "konshu";
  text: string;
  actions?: KonshuAction[];
  remote?: boolean;
}

const SUGGESTIONS = ["Show me your projects", "Where have you worked?", "How can I contact you?", "What can I do here?"];

let seq = 0;

function runAction(a: KonshuAction) {
  if (a.type === "app") openApp(a.app as AppId);
  else if (a.type === "project") openProject({ slug: a.slug, title: a.title });
  else window.open(a.href, "_blank", "noopener,noreferrer");
}

export function KonshuAvatar({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#1d2640,#06080f)] ring-1 ring-accent/40"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <LogoMark variant="glyph" size={Math.round(size * 0.62)} />
    </span>
  );
}

/** Konshu: the guide. Local answers first; Gemini for anything it doesn't know by heart. */
export function Konshu({ params }: AppProps) {
  const content = useContent();
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: seq++,
      role: "konshu",
      text: `I'm Konshu, I watch over this night sky. Ask me about ${content.profile.name}'s work, or how to find your way around.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const asked = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || thinking) return;
    const user: Message = { id: seq++, role: "user", text: q };
    const history = [...messages, user];
    setMessages(history);
    setInput("");

    const local = localAnswer(q, content);
    if (local.confident) {
      setThinking(true);
      // A beat, so it reads as a reply rather than a reflex.
      setTimeout(() => {
        setMessages((m) => [...m, { id: seq++, role: "konshu", text: local.text, actions: local.actions }]);
        setThinking(false);
      }, 350);
      return;
    }

    setThinking(true);
    try {
      const res = await fetch("/api/konshu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(1).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.text) {
        const { text, actions } = extractActions(data.text, content);
        setMessages((m) => [...m, { id: seq++, role: "konshu", text, actions, remote: true }]);
      } else {
        // Remote brain unavailable: fall back to the local best guess.
        const note = res.status === 503 ? "" : data.error ? `${data.error} ` : "";
        setMessages((m) => [...m, { id: seq++, role: "konshu", text: `${note}${local.text}`, actions: local.actions }]);
      }
    } catch {
      setMessages((m) => [...m, { id: seq++, role: "konshu", text: local.text, actions: local.actions }]);
    } finally {
      setThinking(false);
    }
  }

  // Opened from search with a question ("Ask Konshu: …").
  useEffect(() => {
    if (asked.current || typeof params.q !== "string" || !params.q) return;
    asked.current = true;
    void ask(params.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="scroll-area selectable min-h-0 flex-1 space-y-4 p-4">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}
          >
            {m.role === "konshu" && <KonshuAvatar />}
            <div className={`max-w-[80%] ${m.role === "user" ? "text-right" : ""}`}>
              <p
                className={`inline-block rounded-2xl px-3.5 py-2 text-left text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "rounded-br-md bg-accent text-accent-ink" : "rounded-tl-md border border-line bg-surface-2 text-fg"
                }`}
              >
                {m.text}
              </p>
              {m.actions && m.actions.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {m.actions.map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => runAction(a)}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-fg transition-colors hover:border-accent/60"
                    >
                      {a.type === "url" ? <ArrowUpRight size={12} /> : a.type === "project" ? <FolderOpen size={12} /> : null}
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
              {m.remote && (
                <p className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-faint">
                  <Sparkles size={10} /> answered with Gemini, from this site&apos;s content
                </p>
              )}
            </div>
          </motion.div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2.5" aria-live="polite" aria-label="Konshu is thinking">
            <KonshuAvatar />
            <MoonPhaseLoader size={12} />
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void ask(s)}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-accent/60 hover:text-fg"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex shrink-0 items-end gap-2 border-t border-line p-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask(input);
            }
          }}
          rows={1}
          maxLength={500}
          placeholder="Ask Konshu…"
          aria-label="Message Konshu"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!input.trim() || thinking}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink transition-opacity disabled:opacity-40"
        >
          <ArrowUp size={18} />
        </button>
      </form>
    </div>
  );
}
