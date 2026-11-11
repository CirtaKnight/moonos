"use client";

import { KonshuCorner } from "../components/KonshuCorner";
import { RecruiterButton } from "../components/RecruiterButton";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { BatteryFull, ChevronLeft, FolderOpen, Info, Link2, Search, Wifi } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apps, type AppId } from "../apps/registry";
import { openApp, openProject } from "../apps/launch";
import { AppIcon, DocIcon, FolderIcon } from "../components/AppIcon";
import { Avatar } from "../components/Avatar";
import { ContextMenuLayer } from "../components/ContextMenu";
import { MoonGlyph } from "../components/MoonGlyph";
import { NotificationLayer, useStartupNotifications } from "../components/Notifications";
import { Spotlight } from "../components/Spotlight";
import { Wallpaper } from "../components/Wallpaper";
import { useContent, useProjects } from "../content/ContentProvider";
import { HOST_BADGE, useHostBadge, useNow, useViewport } from "../hooks";
import { copyText, shareUrl } from "../lib/links";
import { moonIllumination, moonPhase, moonPhaseName } from "../lib/moon";
import { moveHome, pageCount, placeHome, slotOf, slotPosition } from "../lib/homeGrid";
import { useContextMenu, type MenuEntry } from "../store/contextMenu";
import { useSettings } from "../store/settings";
import { usePhone, type Screen } from "../store/phone";
import { useUI } from "../store/ui";
import { useDeepLinks } from "../useDeepLinks";
import { useSkyAchievements } from "../useSkyAchievements";

const DOCK: AppId[] = ["projects", "terminal", "browser", "mail"];
const GRID_APPS: AppId[] = ["konshu", "games", "agenda", "map", "skills", "activity", "cv", "gallery", "videos", "music", "trophies", "settings", "bin"];
const STATUS_H = 34;
const DOCK_H = 96;
const ROW_H = 96;

interface HomeEntry {
  id: string;
  label: string;
  icon: ReactNode;
  open: () => void;
  info?: Record<string, string>;
  link?: string;
}

function homeMenu(e: HomeEntry): MenuEntry[] {
  return [
    { label: "Open", icon: FolderOpen, onSelect: e.open },
    ...(e.link ? [{ label: "Copy link", icon: Link2, onSelect: () => void copyText(shareUrl(e.link!)) } as MenuEntry] : []),
    ...(e.info ? [{ label: "Get info", icon: Info, onSelect: () => openApp("info", e.info, `${e.label} — Info`, `info:${e.id}`) } as MenuEntry] : []),
  ];
}

/** Phone-style shell for small / touch-first screens. Same content, same apps. */
export function Phone() {
  const stack = usePhone((s) => s.stack);
  const panel = useUI((s) => s.panel);
  useStartupNotifications();
  useDeepLinks();
  useSkyAchievements();

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg">
      <Wallpaper />
      <StatusBar />
      <HomeScreen dimmed={stack.length > 0} />
      <AnimatePresence>
        {stack.map((screen, i) => (
          <AppScreen key={screen.id} screen={screen} depth={stack.length - 1 - i} prev={stack[i - 1]} />
        ))}
      </AnimatePresence>
      <NotificationLayer />
      <AnimatePresence>{panel === "search" && <Spotlight key="search" />}</AnimatePresence>
      <ContextMenuLayer />
    </div>
  );
}

function StatusBar() {
  const now = useNow(1000);
  const phase = now ? moonPhase(now) : 0;
  return (
    <div
      className="absolute inset-x-0 top-0 z-[60] flex items-center justify-between px-6 text-[13px] font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]"
      style={{ height: STATUS_H, paddingTop: "env(safe-area-inset-top)" }}
    >
      <span className="tabular-nums">
        {now ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}
      </span>
      <span className="flex items-center gap-1.5">
        <MoonGlyph phase={phase} size={13} />
        <Wifi size={14} />
        <BatteryFull size={18} />
      </span>
    </div>
  );
}

const COLS = 4;
const KONSHU_STRIP = 54;
const GRID_TOP = 12;
const LONG_PRESS_MS = 450;
const EDGE_PX = 28;
const EDGE_HOLD_MS = 550;

type Gesture = {
  id?: string;
  mode: "pending" | "swipe" | "armed" | "drag" | "ignore";
  startX: number;
  startY: number;
  lastX: number;
  lastT: number;
  vx: number;
  timer?: ReturnType<typeof setTimeout>;
};

function HomeScreen({ dimmed }: { dimmed: boolean }) {
  const { profile } = useContent();
  const projects = useProjects();
  const viewport = useViewport();
  const togglePanel = useUI((s) => s.togglePanel);
  const saved = useSettings((s) => s.homeLayout);
  const setHomeLayout = useSettings((s) => s.setHomeLayout);
  const badge = useHostBadge();
  const [page, setPage] = useState(0);
  const [area, setArea] = useState<{ w: number; h: number } | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [armed, setArmed] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; target: number | null } | null>(null);
  const [extraPage, setExtraPage] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const edge = useRef<{ side: -1 | 1; timer: ReturnType<typeof setTimeout> } | null>(null);

  const entries: HomeEntry[] = useMemo(
    () => [
      { id: "welcome", label: "Welcome", icon: <DocIcon size={56} />, open: () => openApp("note", { welcome: 1 }, "Welcome.txt", "note:welcome") },
      { id: "about", label: "About me", icon: <AppIcon icon={apps.about.icon} tint={apps.about.tint} size={56} />, open: () => openApp("about"), info: { app: "about" }, link: "about" },
      ...projects.map((p) => ({
        id: `project:${p.slug}`,
        label: p.title,
        icon: <FolderIcon color={p.color} size={56} />,
        open: () => openProject(p),
        info: { project: p.slug },
        link: `project/${p.slug}`,
      })),
      ...GRID_APPS.map((id) => ({
        id,
        label: apps[id].name,
        icon: <AppIcon icon={apps[id].icon} tint={apps[id].tint} size={56} />,
        open: () => openApp(id),
        info: { app: id },
        link: id,
      })),
    ],
    [projects],
  );
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

  // Measure the real free space between the search pill and the dock, so the last row is
  // never tucked under the dock (mobile browser bars make window heights unreliable).
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setArea({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = Math.max(1, Math.floor(((area?.h ?? 0) - GRID_TOP) / ROW_H));
  const perPage = rows * COLS;
  const ids = useMemo(() => entries.map((e) => e.id), [entries]);
  const layout = useMemo(
    () => placeHome(ids, saved, perPage, COLS, ids.filter((id) => id.startsWith("project:"))),
    [ids, saved, perPage],
  );
  const pages = pageCount(layout, perPage) + (extraPage ? 1 : 0);
  const current = Math.min(page, pages - 1);
  const colW = (area?.w ?? 0) / COLS;

  const h = viewport?.h ?? 800;
  const widgetH = h > 700 ? 168 : 112;
  const dockPad = badge ? HOST_BADGE.h - 6 : 0;

  const clearEdge = () => {
    if (edge.current) clearTimeout(edge.current.timer);
    edge.current = null;
  };

  const targetAt = (x: number, y: number, onPage: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || !colW) return null;
    const col = Math.max(0, Math.min(COLS - 1, Math.floor((x - rect.left) / colW)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor((y - rect.top - GRID_TOP) / ROW_H)));
    return slotOf(onPage, row, col, perPage, COLS);
  };

  // One gesture model for the whole grid: tap opens, horizontal swipe changes page,
  // long-press opens the menu, long-press then move drags the icon instead.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      const now = performance.now();
      g.vx = (e.clientX - g.lastX) / Math.max(1, now - g.lastT);
      g.lastX = e.clientX;
      g.lastT = now;
      if (g.mode === "pending") {
        if (Math.hypot(dx, dy) < 10) return;
        clearTimeout(g.timer);
        g.mode = Math.abs(dx) > Math.abs(dy) ? "swipe" : "ignore";
      }
      if (g.mode === "swipe") {
        const atEdge = (dx > 0 && current === 0) || (dx < 0 && current === pages - 1);
        setSwipeX(atEdge ? dx * 0.3 : dx);
        return;
      }
      if (g.mode === "armed" && g.id && Math.hypot(dx, dy) > 8) {
        g.mode = "drag";
        setArmed(null);
        useContextMenu.getState().close();
      }
      if (g.mode === "drag" && g.id) {
        setDrag({ id: g.id, x: e.clientX, y: e.clientY, target: targetAt(e.clientX, e.clientY, current) });
        // Hold at a screen edge to carry the icon to the neighbouring page.
        const rect = areaRef.current?.getBoundingClientRect();
        const side = !rect ? 0 : e.clientX < rect.left + EDGE_PX ? -1 : e.clientX > rect.right - EDGE_PX ? 1 : 0;
        if (!side) clearEdge();
        else if (!edge.current || edge.current.side !== side) {
          clearEdge();
          edge.current = {
            side: side as -1 | 1,
            timer: setTimeout(() => {
              edge.current = null;
              if (side < 0 && current > 0) setPage(current - 1);
              if (side > 0) {
                if (current === pages - 1) setExtraPage(true);
                setPage(current + 1);
              }
            }, EDGE_HOLD_MS),
          };
        }
      }
    };
    const onUp = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      clearTimeout(g.timer);
      clearEdge();
      gesture.current = null;
      if (g.mode === "swipe") {
        suppressClick.current = true;
        const dx = e.clientX - g.startX;
        if (dx < -50 || g.vx < -0.45) setPage(Math.min(current + 1, pages - 1));
        else if (dx > 50 || g.vx > 0.45) setPage(Math.max(current - 1, 0));
      } else if (g.mode === "armed") {
        // The menu opened while holding; releasing keeps it open.
        suppressClick.current = true;
        setArmed(null);
      } else if (g.mode === "drag" && g.id) {
        suppressClick.current = true;
        const target = targetAt(e.clientX, e.clientY, current);
        if (target !== null) setHomeLayout(moveHome(layout, g.id, target));
        setDrag(null);
        setExtraPage(false);
      }
      setSwipeX(0);
    };
    const onCancel = () => {
      const g = gesture.current;
      if (g) clearTimeout(g.timer);
      clearEdge();
      gesture.current = null;
      setSwipeX(0);
      setArmed(null);
      setDrag(null);
      setExtraPage(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  });

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    suppressClick.current = false;
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-home-id]")?.dataset.homeId;
    const g: Gesture = { id, mode: "pending", startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastT: performance.now(), vx: 0 };
    if (id) {
      g.timer = setTimeout(() => {
        if (gesture.current !== g || g.mode !== "pending") return;
        g.mode = "armed";
        navigator.vibrate?.(10);
        setArmed(id);
        // Like iOS: the menu appears while holding; moving the finger turns it into a drag.
        const entry = byId.get(id);
        if (entry) useContextMenu.getState().open(g.startX, g.startY, homeMenu(entry));
      }, LONG_PRESS_MS);
    }
    gesture.current = g;
  };

  const onIconClick = (entry: HomeEntry) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!useContextMenu.getState().menu) entry.open();
  };

  const editing = !!drag;
  const dragEntry = drag ? byId.get(drag.id) : undefined;
  const ghost = drag && drag.target !== null ? slotPosition(drag.target, perPage, COLS) : null;

  return (
    <motion.div
      animate={{ scale: dimmed ? 0.94 : 1, opacity: dimmed ? 0.5 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 flex flex-col"
      style={{ paddingTop: STATUS_H + 6 }}
    >
      {/* Widgets */}
      <div className="flex shrink-0 gap-3 px-5" style={{ height: widgetH - 16 }}>
        <ClockWidget compact={widgetH < 150} />
        <button
          type="button"
          onClick={() => openApp("about")}
          className="glass flex min-w-0 flex-1 flex-col justify-between rounded-3xl border border-line p-3.5 text-left"
        >
          <Avatar profile={profile} size={widgetH < 150 ? 36 : 48} />
          <span>
            <span className="block truncate text-sm font-semibold text-fg">{profile.name}</span>
            <span className="line-clamp-2 text-[11px] leading-tight text-muted">{profile.title}</span>
          </span>
        </button>
      </div>

      {/* Search + recruiter pills */}
      <div className="flex shrink-0 items-center justify-center gap-2 pt-3 pb-1">
        <button
          type="button"
          onClick={() => togglePanel("search")}
          className="glass flex h-8 items-center gap-2 rounded-full border border-line px-4 text-xs text-muted"
        >
          <Search size={13} /> Search
        </button>
        <RecruiterButton size="sm" className="h-8" />
      </div>

      {/* Icon pages: swipe sideways, long-press for the menu, long-press and move to rearrange. */}
      <div ref={areaRef} data-home-grid onPointerDown={onPointerDown} className="relative min-h-0 flex-1 touch-none overflow-hidden select-none">
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(${-current * 100}% + ${swipeX}px))`,
            transition: swipeX ? "none" : "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {area &&
            Array.from({ length: pages }, (_, p) => (
              <ul key={p} aria-label={`Home page ${p + 1}`} className="relative h-full w-full shrink-0">
                {ghost && ghost.page === p && (
                  <li
                    aria-hidden
                    className="absolute rounded-2xl border border-dashed border-white/35 bg-white/6"
                    style={{ left: ghost.col * colW + 6, top: GRID_TOP + ghost.row * ROW_H, width: colW - 12, height: ROW_H - 12 }}
                  />
                )}
                {entries.map((e) => {
                  const pos = slotPosition(layout[e.id], perPage, COLS);
                  if (pos.page !== p) return null;
                  const lifted = drag?.id === e.id;
                  return (
                    <li
                      key={e.id}
                      className="absolute transition-[left,top] duration-300 ease-out"
                      style={{ left: pos.col * colW, top: GRID_TOP + pos.row * ROW_H, width: colW, height: ROW_H - 8, opacity: lifted ? 0.25 : 1 }}
                    >
                      <HomeIcon id={e.id} label={e.label} onOpen={() => onIconClick(e)} menu={() => homeMenu(e)} armed={armed === e.id} jiggle={editing && !lifted}>
                        {e.icon}
                      </HomeIcon>
                    </li>
                  );
                })}
              </ul>
            ))}
        </div>
      </div>

      {/* The icon being dragged follows the finger. */}
      {drag && dragEntry && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[70] flex w-20 -translate-x-1/2 -translate-y-1/2 scale-110 flex-col items-center gap-1.5"
          style={{ left: drag.x, top: drag.y }}
        >
          <span className="drop-shadow-[0_12px_20px_rgb(0_0_0/0.6)]">{dragEntry.icon}</span>
          <span className="line-clamp-1 text-[11.5px] text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]">{dragEntry.label}</span>
        </div>
      )}

      {/* Page dots, in a strip tall enough for Konshu so he never covers an icon */}
      <div className="flex shrink-0 items-center justify-center gap-1.5" style={{ height: KONSHU_STRIP }}>
        {pages > 1 &&
          Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              aria-current={i === current ? "page" : undefined}
              onClick={() => setPage(i)}
              className={`size-1.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/35"}`}
            />
          ))}
      </div>

      {!dimmed && <KonshuCorner bottom={DOCK_H + dockPad + (KONSHU_STRIP - 46) / 2} right={14} size={46} compact />}

      {/* Dock (lifted above the host badge when there is one) */}
      <div
        className="shrink-0 px-3"
        style={{ height: DOCK_H + dockPad, paddingBottom: dockPad ? dockPad + 10 : "max(10px, env(safe-area-inset-bottom))" }}
      >
        <div className="glass mx-auto flex h-[78px] max-w-md items-center justify-around rounded-[28px] border border-line px-2">
          {DOCK.map((id) => (
            <motion.button key={id} type="button" aria-label={apps[id].name} whileTap={{ scale: 0.88 }} onClick={() => openApp(id)}>
              <AppIcon icon={apps[id].icon} tint={apps[id].tint} size={56} />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function HomeIcon({
  id,
  label,
  onOpen,
  menu,
  armed,
  jiggle,
  children,
}: {
  id: string;
  label: string;
  onOpen: () => void;
  menu: () => MenuEntry[];
  armed: boolean;
  jiggle: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-home-id={id}
      aria-label={label}
      onClick={onOpen}
      onContextMenu={(e) => {
        e.preventDefault();
        // Touch long-presses are handled by the grid's gesture; this is the mouse right-click.
        const native = e.nativeEvent as PointerEvent;
        if (native.pointerType === "touch") return;
        useContextMenu.getState().open(e.clientX, e.clientY, menu());
      }}
      className={`flex h-full w-full flex-col items-center gap-1.5 transition-transform duration-200 [-webkit-touch-callout:none] active:scale-[0.9] ${
        armed ? "scale-110" : ""
      } ${jiggle ? "home-jiggle" : ""}`}
    >
      <span className="pointer-events-none drop-shadow-[0_6px_12px_rgb(0_0_0/0.4)]">{children}</span>
      <span className="pointer-events-none line-clamp-1 max-w-full px-0.5 text-[11.5px] text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]">
        {label}
      </span>
    </button>
  );
}

function ClockWidget({ compact }: { compact: boolean }) {
  const now = useNow(1000);
  const phase = now ? moonPhase(now) : 0;
  return (
    <div className="glass flex min-w-0 flex-[1.3] flex-col justify-between rounded-3xl border border-line p-3.5">
      <span className="flex items-center justify-between text-[11px] text-muted">
        {now?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
        <MoonGlyph phase={phase} size={compact ? 18 : 24} className="text-fg" />
      </span>
      <span className={`font-light tracking-tight text-fg tabular-nums ${compact ? "text-3xl" : "text-5xl"}`}>
        {now?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <span className="truncate text-[11px] text-muted">
        {now ? `${moonPhaseName(phase)} · ${Math.round(moonIllumination(phase) * 100)}%` : ""}
      </span>
    </div>
  );
}

function AppScreen({ screen, depth, prev }: { screen: Screen; depth: number; prev?: Screen }) {
  const app = apps[screen.appId as AppId] ?? apps.about;
  const Body = app.component;
  const pop = usePhone((s) => s.pop);
  const home = usePhone((s) => s.home);

  // Android-style hardware back: browser back pops the app stack.
  useEffect(() => {
    if (depth !== 0) return;
    const onPop = () => pop();
    history.pushState({ ckScreen: screen.id }, "");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [depth, pop, screen.id]);

  const onHomeGesture = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -40 || info.velocity.y < -300) home();
  };

  return (
    <motion.section
      role="dialog"
      aria-label={screen.title}
      initial={{ y: "100%", borderRadius: 32 }}
      animate={{ y: 0, borderRadius: 0, scale: depth > 0 ? 0.96 : 1 }}
      exit={{ y: "100%", transition: { type: "spring", stiffness: 380, damping: 40 } }}
      transition={{ type: "spring", stiffness: 340, damping: 36 }}
      className="window-surface absolute inset-0 z-50 flex flex-col overflow-hidden"
      style={{ paddingTop: STATUS_H }}
    >
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-2">
        <button
          type="button"
          onClick={() => history.back()}
          className="flex min-w-0 items-center gap-0.5 rounded-lg px-1.5 py-1 text-sm text-accent"
        >
          <ChevronLeft size={22} className="shrink-0" />
          <span className="max-w-24 truncate">{prev ? prev.title : "Home"}</span>
        </button>
        <h1 className="pointer-events-none absolute inset-x-0 mx-auto w-1/2 truncate text-center text-[15px] font-semibold text-fg">
          {screen.title}
        </h1>
      </header>
      <div className="relative min-h-0 flex-1">
        <Body params={screen.params} screenId={screen.id} />
      </div>
      {/* Home indicator: swipe up (or tap) to go home */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={onHomeGesture}
        onTap={home}
        className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center pb-[env(safe-area-inset-bottom)]"
        aria-label="Go home"
        role="button"
      >
        <span className="h-1.5 w-32 rounded-full bg-fg/60" />
      </motion.div>
    </motion.section>
  );
}
