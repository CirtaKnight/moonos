"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { useContent } from "../content/ContentProvider";
import { useDesktopEntries, type DesktopEntry } from "../desktopEntries";
import { cellAt, intersects, moveIcon, moveIcons, placeIcons, rectFrom, type Rect } from "../lib/iconGrid";
import { desktopMenu, iconMenu, setSelectionOpener } from "../menus";
import { contextMenuProps } from "../store/contextMenu";
import { useSettings } from "../store/settings";
import { useUI } from "../store/ui";
import { useWindows } from "../store/windows";

const CELL_W = 92;
const CELL_H = 100;
const PAD = 12;
const ICON_W = 88;
const ICON_H = 96;

/**
 * Desktop icons on a snapping grid. Drag to rearrange (remembered per visitor),
 * click / Ctrl-click / drag a box to select, double-click or Enter to open,
 * right-click for menus.
 */
export function DesktopIcons() {
  const content = useContent();
  const entries = useDesktopEntries();
  const bounds = useWindows((s) => s.bounds);
  const saved = useSettings((s) => s.iconLayout);
  const setIconLayout = useSettings((s) => s.setIconLayout);
  const selected = useUI((s) => s.selectedIcons);
  const selectIcons = useUI((s) => s.selectIcons);
  const refreshTick = useUI((s) => s.refreshTick);
  const [drag, setDrag] = useState<{ ids: string[]; dx: number; dy: number } | null>(null);
  const [box, setBox] = useState<Rect | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);

  const rows = Math.max(1, Math.floor((bounds.h - PAD * 2) / CELL_H));
  const cols = Math.max(1, Math.floor((bounds.w - PAD * 2) / CELL_W));
  const idKey = entries.map((e) => e.id).join("|");
  const ids = useMemo(() => idKey.split("|"), [idKey]);
  const layout = useMemo(() => placeIcons(ids, saved, rows), [ids, saved, rows]);
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

  const openSelection = (entry: DesktopEntry) => {
    const current = useUI.getState().selectedIcons;
    if (current.includes(entry.id) && current.length > 1) current.forEach((id) => byId.get(id)?.open());
    else entry.open();
  };

  useEffect(() => {
    setSelectionOpener(openSelection);
  });

  // Enter opens the selection when focus isn't in a text field or window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const el = document.activeElement;
      if (el && el !== document.body && !el.closest("[data-icon]")) return;
      const sel = useUI.getState().selectedIcons;
      if (!sel.length) return;
      e.preventDefault();
      sel.forEach((id) => byId.get(id)?.open());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [byId]);

  const iconRect = (id: string): Rect => {
    const c = layout[id];
    return { x: PAD + c.c * CELL_W, y: PAD + c.r * CELL_H, w: ICON_W, h: ICON_H };
  };

  /* ------------------------------- Box selection ------------------------------- */
  function onAreaPointerDown(e: RPointerEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || e.button !== 0 || e.pointerType === "touch") return;
    const origin = areaRef.current!.getBoundingClientRect();
    const sx = e.clientX - origin.left;
    const sy = e.clientY - origin.top;
    const additive = e.ctrlKey || e.metaKey || e.shiftKey;
    const base = additive ? useUI.getState().selectedIcons : [];
    if (!additive) selectIcons([]);
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = rectFrom(sx, sy, ev.clientX - origin.left, ev.clientY - origin.top);
      if (r.w < 3 && r.h < 3) return;
      setBox(r);
      selectIcons([...new Set([...base, ...ids.filter((id) => intersects(r, iconRect(id)))])]);
    };
    const up = () => {
      setBox(null);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  /* -------------------------------- Icon dragging ------------------------------- */
  function onIconPointerDown(e: RPointerEvent<HTMLButtonElement>, entry: DesktopEntry) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY };
    const el = e.currentTarget;
    let dragging = false;
    // Dragging an icon that is part of a multi-selection moves the whole selection.
    const selection = useUI.getState().selectedIcons;
    const group = selection.length > 1 && selection.includes(entry.id) ? selection : [entry.id];
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) < 6) return;
      dragging = true;
      setDrag({ ids: group, dx, dy });
    };
    const up = (ev: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      if (dragging) {
        const r = iconRect(entry.id);
        const target = cellAt(r.x + ev.clientX - start.x + ICON_W / 2 - PAD, r.y + ev.clientY - start.y + ICON_H / 2 - PAD, CELL_W, CELL_H, rows, cols);
        const from = layout[entry.id];
        setIconLayout(
          group.length > 1
            ? moveIcons(layout, group, target.c - from.c, target.r - from.r, rows, cols)
            : moveIcon(layout, entry.id, target),
        );
        setDrag(null);
        return;
      }
      // A plain click: select (Ctrl / Cmd / Shift toggles). Touch opens immediately.
      const sel = useUI.getState().selectedIcons;
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey) {
        selectIcons(sel.includes(entry.id) ? sel.filter((i) => i !== entry.id) : [...sel, entry.id]);
      } else {
        selectIcons([entry.id]);
        if (ev.pointerType !== "mouse") entry.open();
      }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  const areaMenu = contextMenuProps(() => desktopMenu(content, entries, rows));

  return (
    <div
      ref={areaRef}
      aria-label="Desktop"
      role="list"
      className="absolute isolate"
      style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
      onPointerDown={onAreaPointerDown}
      onContextMenu={areaMenu.onContextMenu}
    >
      {entries.map((e, i) => {
        const r = iconRect(e.id);
        const isSel = selected.includes(e.id);
        const isDrag = drag?.ids.includes(e.id) ?? false;
        const menu = contextMenuProps(() => {
          if (!useUI.getState().selectedIcons.includes(e.id)) selectIcons([e.id]);
          return iconMenu(e, useUI.getState().selectedIcons.length);
        });
        return (
          <motion.div
            key={`${e.id}:${refreshTick}`}
            role="listitem"
            initial={refreshTick ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025 }}
            className="absolute"
            style={{
              left: r.x,
              top: r.y,
              zIndex: isDrag ? 5 : 1,
              transform: isDrag && drag ? `translate(${drag.dx}px, ${drag.dy}px)` : undefined,
              transition: isDrag ? "none" : "left 200ms ease, top 200ms ease",
            }}
          >
            <button
              type="button"
              data-icon={e.id}
              onPointerDown={(ev) => onIconPointerDown(ev, e)}
              onClick={(ev) => ev.stopPropagation()}
              onDoubleClick={() => openSelection(e)}
              onContextMenu={menu.onContextMenu}
              onKeyDown={(ev) => ev.key === "Enter" && e.open()}
              className={`group flex flex-col items-center gap-1.5 rounded-lg px-1 pt-2 text-center outline-none transition-colors ${
                isSel ? "bg-accent/18 ring-1 ring-accent/40" : "hover:bg-white/6"
              } ${isDrag ? "opacity-80" : ""}`}
              style={{ width: ICON_W, height: ICON_H }}
            >
              <span className="pointer-events-none drop-shadow-[0_6px_10px_rgb(0_0_0/0.45)] transition-transform group-active:scale-95">
                {e.icon}
              </span>
              <span
                className={`pointer-events-none line-clamp-2 max-w-full px-1 text-[11.5px] leading-tight text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.9)] ${
                  isSel ? "font-medium" : ""
                }`}
              >
                {e.label}
              </span>
            </button>
          </motion.div>
        );
      })}
      {box && (
        <div
          className="pointer-events-none absolute rounded-sm border border-accent/70 bg-accent/12"
          style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
        />
      )}
    </div>
  );
}
