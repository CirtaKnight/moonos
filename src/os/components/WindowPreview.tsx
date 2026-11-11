"use client";

import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { apps, type AppId } from "../apps/registry";
import { useWindows, type WindowInstance } from "../store/windows";
import { AppIcon } from "./AppIcon";

const THUMB_W = 196;
const THUMB_MAX_H = 124;
const REFRESH_MS = 1500;

/**
 * Hover previews for a dock / taskbar entry: a live-looking thumbnail of each of the app's
 * windows. Click one to bring it forward, or close it from here.
 */
export function WindowPreviews({
  appId,
  anchor,
  onEnter,
  onLeave,
  onPicked,
}: {
  appId: AppId;
  anchor: RefObject<HTMLElement | null>;
  onEnter: () => void;
  onLeave: () => void;
  onPicked: () => void;
}) {
  const all = useWindows((s) => s.windows);
  const windows = useMemo(() => all.filter((w) => w.appId === appId).sort((a, b) => b.z - a.z), [all, appId]);
  const focusedId = useWindows((s) => s.focusedId);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);

  // Centre over the anchor, kept inside the viewport.
  useLayoutEffect(() => {
    const a = anchor.current?.getBoundingClientRect();
    const box = ref.current?.getBoundingClientRect();
    if (!a || !box) return;
    const left = Math.min(Math.max(8, a.left + a.width / 2 - box.width / 2), window.innerWidth - box.width - 8);
    setPos({ left, bottom: window.innerHeight - a.top + 10 });
  }, [anchor, windows.length]);

  if (!windows.length) return null;
  const app = apps[appId];

  return createPortal(
    <div
      ref={ref}
      role="group"
      aria-label={`${app.name} windows`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="glass fixed z-[90] flex gap-2 rounded-2xl border border-line-strong p-2 shadow-window transition-[opacity,translate] duration-150 ease-out"
      style={pos ? { ...pos, opacity: 1, translate: "0 0" } : { left: -9999, bottom: 0, opacity: 0, translate: "0 6px" }}
    >
      {windows.slice(0, 4).map((w) => (
        <PreviewCard
          key={w.id}
          win={w}
          focused={w.id === focusedId && !w.minimized}
          icon={<AppIcon icon={app.icon} tint={app.tint} size={18} />}
          onPick={() => {
            useWindows.getState().focus(w.id);
            onPicked();
          }}
        />
      ))}
      {windows.length > 4 && <span className="self-center px-2 text-xs text-muted">+{windows.length - 4}</span>}
    </div>,
    document.body,
  );
}

function PreviewCard({ win, focused, icon, onPick }: { win: WindowInstance; focused: boolean; icon: React.ReactNode; onPick: () => void }) {
  return (
    <div className={`group relative w-[204px] rounded-xl border p-1 transition-colors ${focused ? "border-accent/50 bg-accent/8" : "border-transparent hover:border-line-strong hover:bg-surface-hover"}`}>
      <button type="button" onClick={onPick} className="block w-full text-left" aria-label={`Show ${win.title}`}>
        <span className="flex items-center gap-1.5 px-1 pt-0.5 pb-1.5 pr-6">
          {icon}
          <span className="truncate text-xs text-fg">{win.title}</span>
          {win.minimized && <span className="ml-auto shrink-0 text-[10px] text-faint">minimized</span>}
        </span>
        <Thumbnail id={win.id} />
      </button>
      <button
        type="button"
        aria-label={`Close ${win.title}`}
        onClick={() => useWindows.getState().close(win.id)}
        className="absolute top-1 right-1 grid size-6 place-items-center rounded-md text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger/20 hover:text-fg focus-visible:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/**
 * A static snapshot of the window's DOM, scaled down. Embeds (PDFs, iframes) are swapped
 * for a plain panel so nothing reloads; canvases (games, map) are copied pixel for pixel.
 */
function Thumbnail({ id }: { id: string }) {
  const host = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState({ w: THUMB_W, h: 110 });

  useEffect(() => {
    const draw = () => {
      const src = document.querySelector<HTMLElement>(`[data-window-id="${id}"]`);
      const box = host.current;
      if (!src || !box) return;
      const w = src.offsetWidth || 1;
      const h = src.offsetHeight || 1;
      const scale = Math.min(THUMB_W / w, THUMB_MAX_H / h);
      setSize({ w: Math.round(w * scale), h: Math.round(h * scale) });

      const clone = src.cloneNode(true) as HTMLElement;
      clone.removeAttribute("data-window-id");
      clone.removeAttribute("role");
      clone.removeAttribute("aria-label");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      clone.querySelectorAll("iframe, object, embed").forEach((el) => {
        const panel = document.createElement("div");
        panel.style.cssText = "width:100%;height:100%;background:var(--surface-2)";
        el.replaceWith(panel);
      });
      // Copy pixels from live canvases and videos into the clone.
      const srcCanvases = src.querySelectorAll("canvas");
      clone.querySelectorAll("canvas").forEach((c, i) => {
        const from = srcCanvases[i];
        if (!from) return;
        try {
          c.width = from.width;
          c.height = from.height;
          c.getContext("2d")?.drawImage(from, 0, 0);
        } catch {
          /* tainted or unreadable: leave blank */
        }
      });
      const srcVideos = src.querySelectorAll("video");
      clone.querySelectorAll("video").forEach((v, i) => {
        const from = srcVideos[i];
        const c = document.createElement("canvas");
        c.width = from?.videoWidth || 16;
        c.height = from?.videoHeight || 9;
        c.style.cssText = "width:100%;height:100%;object-fit:contain;background:#000";
        try {
          if (from) c.getContext("2d")?.drawImage(from, 0, 0);
        } catch {
          /* cross-origin video */
        }
        v.replaceWith(c);
      });
      Object.assign(clone.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: `${w}px`,
        height: `${h}px`,
        transform: `scale(${scale})`,
        transformOrigin: "0 0",
        opacity: "1",
        visibility: "visible",
        zIndex: "auto",
        pointerEvents: "none",
        transition: "none",
      });
      box.replaceChildren(clone);
    };
    draw();
    const t = setInterval(draw, REFRESH_MS);
    return () => clearInterval(t);
  }, [id]);

  return (
    <span
      ref={host}
      aria-hidden
      // inert: the snapshot is a picture, not a second copy of the app.
      inert
      className="relative mx-auto block overflow-hidden rounded-lg bg-bg-2 ring-1 ring-line"
      style={{ width: size.w, height: size.h }}
    />
  );
}

/** Hover intent shared by dock and taskbar items: open after a short pause, close with grace. */
export function usePreviewHover(enabled: boolean) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clear = () => clearTimeout(timer.current);
  useEffect(() => clear, []);
  return {
    open: open && enabled,
    enter: () => {
      clear();
      timer.current = setTimeout(() => setOpen(true), open ? 0 : 320);
    },
    leave: () => {
      clear();
      timer.current = setTimeout(() => setOpen(false), 180);
    },
    close: () => {
      clear();
      setOpen(false);
    },
  };
}
