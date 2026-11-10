"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clampMenu } from "../lib/iconGrid";
import { useContextMenu, type MenuEntry } from "../store/contextMenu";

/** The single context menu layer; opened via `useContextMenu().open` / `contextMenuProps`. */
export function ContextMenuLayer() {
  const menu = useContextMenu((s) => s.menu);
  const close = useContextMenu((s) => s.close);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.("[data-context-menu]")) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
    };
  }, [menu, close]);

  return (
    <AnimatePresence>
      {menu && <Menu key={`${menu.x}:${menu.y}`} x={menu.x} y={menu.y} items={menu.items} root />}
    </AnimatePresence>
  );
}

function Menu({ x, y, items, root }: { x: number; y: number; items: MenuEntry[]; root?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const [active, setActive] = useState(-1);
  const [openSub, setOpenSub] = useState<{ index: number; x: number; y: number } | null>(null);
  const close = useContextMenu((s) => s.close);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(clampMenu(x, y, r.width, r.height, window.innerWidth, window.innerHeight));
  }, [x, y]);

  useEffect(() => {
    if (root) ref.current?.focus({ preventScroll: true });
  }, [root]);

  const selectable = items.map((it, i) => (it !== "separator" && !it.disabled ? i : -1)).filter((i) => i >= 0);

  /** Position a submenu next to item `i` (called from event handlers only). */
  function showSub(i: number) {
    const nth = items.slice(0, i).filter((x) => x !== "separator").length;
    const el = ref.current?.querySelectorAll("[data-menu-item]")[nth] as HTMLElement | undefined;
    const menuRect = ref.current?.getBoundingClientRect();
    if (!el || !menuRect) return;
    setOpenSub({ index: i, x: menuRect.right - 4, y: el.getBoundingClientRect().top - 5 });
  }

  function run(it: Exclude<MenuEntry, "separator">, i: number) {
    if (it.disabled) return;
    if (it.submenu) {
      showSub(i);
      return;
    }
    close();
    it.onSelect?.();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const idx = selectable.indexOf(active);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(selectable[(idx + 1) % selectable.length]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(selectable[(idx - 1 + selectable.length) % selectable.length]);
    } else if ((e.key === "Enter" || e.key === " ") && active >= 0) {
      e.preventDefault();
      run(items[active] as Exclude<MenuEntry, "separator">, active);
    } else if (e.key === "ArrowRight" && active >= 0 && (items[active] as { submenu?: unknown }).submenu) {
      showSub(active);
    }
  }

  return (
    <>
      <motion.div
        ref={ref}
        data-context-menu
        role="menu"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.08 } }}
        transition={{ duration: 0.12 }}
        className="glass fixed z-[950] min-w-52 rounded-xl border border-line-strong p-1 shadow-window outline-none"
        style={{ left: pos.x, top: pos.y, transformOrigin: "top left" }}
      >
        {items.map((it, i) =>
          it === "separator" ? (
            <div key={`sep-${i}`} className="mx-2 my-1 h-px bg-line" role="separator" />
          ) : (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              data-menu-item
              disabled={it.disabled}
              aria-haspopup={it.submenu ? "menu" : undefined}
              onPointerEnter={() => {
                setActive(i);
                if (it.submenu) showSub(i);
                else setOpenSub(null);
              }}
              onClick={() => run(it, i)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] disabled:opacity-40 ${
                active === i ? (it.danger ? "bg-danger/80 text-white" : "bg-accent/20 text-fg") : it.danger ? "text-danger" : "text-fg"
              }`}
            >
              <span className="grid w-4 shrink-0 place-items-center text-muted">
                {it.checked ? <Check size={14} className="text-accent" /> : it.icon ? <it.icon size={14} /> : null}
              </span>
              <span className="flex-1 truncate">{it.label}</span>
              {it.shortcut && <span className="font-mono text-[10.5px] text-faint">{it.shortcut}</span>}
              {it.submenu && <ChevronRight size={13} className="text-muted" />}
            </button>
          ),
        )}
      </motion.div>
      {openSub && (items[openSub.index] as { submenu?: MenuEntry[] }).submenu && (
        <Menu x={openSub.x} y={openSub.y} items={(items[openSub.index] as { submenu: MenuEntry[] }).submenu} />
      )}
    </>
  );
}
