"use client";

import { motion } from "motion/react";
import { Minus, Pin, Square, Copy, X } from "lucide-react";
import { memo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getApp } from "../apps/registry";
import { windowMenu } from "../menus";
import { useContextMenu } from "../store/contextMenu";
import { useUI } from "../store/ui";
import {
  effectiveRect,
  useWindows,
  WINDOW_MIN,
  type Rect,
  type Snap,
  type WindowInstance,
} from "../store/windows";
import { AppIcon } from "./AppIcon";

type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const EDGES: Edge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
const SNAP_EDGE = 8;

const edgeClass: Record<Edge, string> = {
  n: "top-0 left-3 right-3 h-1.5 cursor-ns-resize",
  s: "bottom-0 left-3 right-3 h-1.5 cursor-ns-resize",
  e: "right-0 top-3 bottom-3 w-1.5 cursor-ew-resize",
  w: "left-0 top-3 bottom-3 w-1.5 cursor-ew-resize",
  ne: "top-0 right-0 size-3 cursor-nesw-resize",
  sw: "bottom-0 left-0 size-3 cursor-nesw-resize",
  nw: "top-0 left-0 size-3 cursor-nwse-resize",
  se: "bottom-0 right-0 size-3 cursor-nwse-resize",
};

function WindowFrame({ win }: { win: WindowInstance }) {
  const app = getApp(win.appId);
  const AppBody = app.component;
  const bounds = useWindows((s) => s.bounds);
  const focused = useWindows((s) => s.focusedId === win.id);
  const { focus, close, minimize, toggleMaximize, setRect, snapTo } = useWindows.getState();
  const setSnapPreview = useUI((s) => s.setSnapPreview);
  const [interacting, setInteracting] = useState(false);
  const pendingSnap = useRef<Snap | "max" | null>(null);

  const rect = effectiveRect(win, bounds);
  const isFull = win.maximized || win.snap !== null;

  function snapZone(clientX: number, clientY: number): Snap | "max" | null {
    if (clientY <= bounds.y + 2) return "max";
    if (clientX <= bounds.x + SNAP_EDGE) return "left";
    if (clientX >= bounds.x + bounds.w - SNAP_EDGE) return "right";
    return null;
  }

  function previewFor(zone: Snap | "max" | null): Rect | null {
    if (!zone) return null;
    if (zone === "max") return { ...bounds };
    return effectiveRect({ ...win, maximized: false, snap: zone }, bounds);
  }

  function onTitlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    focus(win.id);
    const startX = e.clientX;
    const startY = e.clientY;
    let base: Rect = { ...rect };
    let restored = !isFull;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    setInteracting(true);

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!restored) {
        if (Math.hypot(dx, dy) < 6) return;
        // Pull a maximized/snapped window out: keep the cursor at the same relative spot.
        const ratio = (startX - rect.x) / rect.w;
        base = { ...win.rect, x: startX - win.rect.w * ratio, y: rect.y };
        restored = true;
      }
      setRect(win.id, { x: base.x + dx, y: base.y + dy });
      const zone = snapZone(ev.clientX, ev.clientY);
      pendingSnap.current = zone;
      setSnapPreview(previewFor(zone));
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      setInteracting(false);
      setSnapPreview(null);
      const zone = pendingSnap.current;
      pendingSnap.current = null;
      if (zone === "max") toggleMaximize(win.id);
      else if (zone) snapTo(win.id, zone);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  function onResizePointerDown(edge: Edge, e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();
    focus(win.id);
    const start = { x: e.clientX, y: e.clientY };
    const base: Rect = { ...rect };
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    setInteracting(true);

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      const next = { ...base };
      if (edge.includes("e")) next.w = base.w + dx;
      if (edge.includes("s")) next.h = base.h + dy;
      if (edge.includes("w")) {
        next.w = Math.max(WINDOW_MIN.w, base.w - dx);
        next.x = base.x + base.w - next.w;
      }
      if (edge.includes("n")) {
        next.h = Math.max(WINDOW_MIN.h, base.h - dy);
        next.y = base.y + base.h - next.h;
      }
      setRect(win.id, next);
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      setInteracting(false);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  return (
    <motion.section
      role="dialog"
      aria-label={win.title}
      data-window={win.appId}
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={
        win.minimized
          ? { opacity: 0, scale: 0.6, y: 220, transitionEnd: { visibility: "hidden" } }
          : { opacity: 1, scale: 1, y: 0, visibility: "visible" }
      }
      exit={{ opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.14 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
      onPointerDownCapture={() => focus(win.id)}
      className={`window-surface absolute flex flex-col overflow-hidden border ${
        focused ? "border-line-strong shadow-window" : "border-line shadow-[0_12px_30px_-12px_rgb(0_0_0/0.5)]"
      } ${isFull ? "rounded-none sm:rounded-lg" : "rounded-xl"} ${
        interacting ? "" : "transition-[left,top,width,height] duration-200 ease-out"
      } ${win.minimized ? "pointer-events-none" : "pointer-events-auto"}`}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex: win.z + (win.pinned ? 100_000 : 0) }}
    >
      {/* Title bar */}
      <div
        onPointerDown={onTitlePointerDown}
        onDoubleClick={(e) => {
          if (!(e.target as HTMLElement).closest("button")) toggleMaximize(win.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          useContextMenu.getState().open(e.clientX, e.clientY, windowMenu(win));
        }}
        className={`flex h-10 shrink-0 cursor-default touch-none items-center gap-2.5 border-b border-line pr-1.5 pl-3 ${
          focused ? "text-fg" : "text-muted"
        }`}
      >
        <AppIcon icon={app.icon} tint={app.tint} size={20} />
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-medium tracking-tight">{win.title}</h2>
        {win.pinned && <Pin size={12} className="shrink-0 text-accent" aria-label="Always on top" />}
        <div className="flex items-center gap-0.5">
          <TitleButton label="Minimize" onClick={() => minimize(win.id)}>
            <Minus size={14} />
          </TitleButton>
          <TitleButton label={isFull ? "Restore" : "Maximize"} onClick={() => toggleMaximize(win.id)}>
            {isFull ? <Copy size={12} className="-scale-x-100" /> : <Square size={12} />}
          </TitleButton>
          <TitleButton label="Close" danger onClick={() => close(win.id)}>
            <X size={15} />
          </TitleButton>
        </div>
      </div>

      {/* Body: apps manage their own inner scrolling */}
      <div className="relative min-h-0 flex-1">
        <AppBody params={win.params} windowId={win.id} />
        {/* While dragging/resizing, stop iframes from swallowing pointer events */}
        {interacting && <div className="absolute inset-0" />}
      </div>

      {!isFull &&
        EDGES.map((edge) => (
          <div
            key={edge}
            onPointerDown={(e) => onResizePointerDown(edge, e)}
            className={`absolute z-10 touch-none ${edgeClass[edge]}`}
          />
        ))}
    </motion.section>
  );
}

function TitleButton({
  label,
  danger,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`grid size-7 place-items-center rounded-md text-muted transition-colors hover:text-fg ${
        danger ? "hover:bg-danger/80 hover:text-white" : "hover:bg-surface-hover"
      }`}
    >
      {children}
    </button>
  );
}

export const Window = memo(WindowFrame);
