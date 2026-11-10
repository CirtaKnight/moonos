"use client";

import { AnimatePresence, motion } from "motion/react";
import { Keyboard as KeyboardIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { apps, type AppId } from "../apps/registry";
import { openApp } from "../apps/launch";
import { usePower } from "../store/power";
import { useUI } from "../store/ui";
import { useWindows } from "../store/windows";
import { AppIcon } from "./AppIcon";

export const SHORTCUTS: [string, string][] = [
  ["Ctrl / ⌘ + K", "Search"],
  ["Alt + `", "Switch windows (hold Alt)"],
  ["Alt + Q", "Close window"],
  ["Alt + M", "Minimize window"],
  ["Alt + Enter", "Maximize / restore"],
  ["Alt + ← / →", "Snap left / right"],
  ["Alt + T", "Open Terminal"],
  ["Alt + L", "Lock screen"],
  ["F5", "Refresh desktop"],
  ["Enter", "Open selected icons"],
  ["?", "Show this sheet"],
  ["Esc", "Close menus & panels"],
];

const isTyping = () => {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
};

/** Window-management shortcuts, the Alt+` switcher and the `?` cheat sheet. */
export function KeyboardLayer() {
  const [switcher, setSwitcher] = useState<{ ids: string[]; index: number } | null>(null);
  const panel = useUI((s) => s.panel);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const w = useWindows.getState();
      const focused = w.focusedId;
      if (e.altKey && (e.key === "`" || e.code === "Backquote")) {
        e.preventDefault();
        setSwitcher((cur) => {
          // Most recently used first: highest z.
          const ids = cur?.ids ?? [...w.windows].sort((a, b) => b.z - a.z).map((x) => x.id);
          if (!ids.length) return null;
          const step = e.shiftKey ? -1 : 1;
          const index = cur ? (cur.index + step + ids.length) % ids.length : Math.min(1, ids.length - 1);
          return { ids, index };
        });
        return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        const handled = (() => {
          if (k === "t") return openApp("terminal"), true;
          if (k === "l") return usePower.getState().lock("lock"), true;
          if (!focused) return false;
          if (k === "q") return w.close(focused), true;
          if (k === "m") return w.minimize(focused), true;
          if (e.key === "Enter") return w.toggleMaximize(focused), true;
          if (e.key === "ArrowLeft") return w.snapTo(focused, "left"), true;
          if (e.key === "ArrowRight") return w.snapTo(focused, "right"), true;
          return false;
        })();
        if (handled) e.preventDefault();
        return;
      }
      if (e.key === "?" && !isTyping()) {
        e.preventDefault();
        useUI.getState().togglePanel("shortcuts");
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key !== "Alt") return;
      setSwitcher((cur) => {
        if (cur) useWindows.getState().focus(cur.ids[cur.index]);
        return null;
      });
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return (
    <>
      <AnimatePresence>{switcher && <Switcher key="switcher" ids={switcher.ids} index={switcher.index} />}</AnimatePresence>
      <AnimatePresence>{panel === "shortcuts" && <ShortcutsSheet key="shortcuts" />}</AnimatePresence>
    </>
  );
}

function Switcher({ ids, index }: { ids: string[]; index: number }) {
  const windows = useWindows((s) => s.windows);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-[90] grid place-items-center"
      role="listbox"
      aria-label="Switch window"
    >
      <div className="glass flex max-w-[90vw] flex-wrap justify-center gap-2 rounded-2xl border border-line-strong p-3 shadow-window">
        {ids.map((id, i) => {
          const win = windows.find((w) => w.id === id);
          if (!win) return null;
          const app = apps[win.appId as AppId];
          return (
            <div
              key={id}
              role="option"
              aria-selected={i === index}
              className={`flex w-28 flex-col items-center gap-2 rounded-xl p-3 ${i === index ? "bg-accent/20 ring-1 ring-accent/60" : ""}`}
            >
              <AppIcon icon={app.icon} tint={app.tint} size={44} />
              <span className="w-full truncate text-center text-xs text-fg">{win.title}</span>
              {win.minimized && <span className="text-[10px] text-faint">minimized</span>}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function ShortcutsSheet() {
  const closePanel = useUI((s) => s.closePanel);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[85] grid place-items-center bg-black/35 backdrop-blur-[2px]"
      onClick={(e) => {
        e.stopPropagation();
        closePanel();
      }}
    >
      <motion.div
        role="dialog"
        aria-label="Keyboard shortcuts"
        initial={{ y: 12, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="glass w-[min(520px,calc(100vw-24px))] rounded-2xl border border-line-strong p-5 shadow-window"
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-fg">
          <KeyboardIcon size={16} className="text-accent" /> Keyboard shortcuts
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {SHORTCUTS.map(([keys, what]) => (
            <div key={keys} className="contents">
              <dt>
                <kbd className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-[11.5px] text-fg">{keys}</kbd>
              </dt>
              <dd className="text-muted">{what}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-faint">Alt + Tab belongs to your real OS, so MoonOS uses Alt + ` instead.</p>
      </motion.div>
    </motion.div>
  );
}
