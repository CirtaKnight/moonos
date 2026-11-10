"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { BatteryFull, ChevronLeft, Search, Wifi } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apps, type AppId } from "../apps/registry";
import { openApp, openProject } from "../apps/launch";
import { AppIcon, DocIcon, FolderIcon } from "../components/AppIcon";
import { Avatar } from "../components/Avatar";
import { MoonGlyph } from "../components/MoonGlyph";
import { NotificationLayer, useStartupNotifications } from "../components/Notifications";
import { Spotlight } from "../components/Spotlight";
import { Wallpaper } from "../components/Wallpaper";
import { useContent, useProjects } from "../content/ContentProvider";
import { useNow, useViewport } from "../hooks";
import { moonIllumination, moonPhase, moonPhaseName } from "../lib/moon";
import { usePhone, type Screen } from "../store/phone";
import { useUI } from "../store/ui";
import { useDeepLinks } from "../useDeepLinks";

const DOCK: AppId[] = ["projects", "terminal", "browser", "mail"];
const GRID_APPS: AppId[] = ["cv", "gallery", "videos", "music", "game", "settings", "bin"];
const STATUS_H = 34;
const DOCK_H = 96;
const ROW_H = 96;

interface HomeEntry {
  id: string;
  label: string;
  icon: ReactNode;
  open: () => void;
}

/** Phone-style shell for small / touch-first screens. Same content, same apps. */
export function Phone() {
  const stack = usePhone((s) => s.stack);
  const panel = useUI((s) => s.panel);
  useStartupNotifications();
  useDeepLinks();

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

function HomeScreen({ dimmed }: { dimmed: boolean }) {
  const { profile } = useContent();
  const projects = useProjects();
  const viewport = useViewport();
  const togglePanel = useUI((s) => s.togglePanel);
  const [page, setPage] = useState(0);

  const entries: HomeEntry[] = useMemo(
    () => [
      { id: "welcome", label: "Welcome", icon: <DocIcon size={56} />, open: () => openApp("note", { welcome: 1 }, "Welcome.txt", "note:welcome") },
      { id: "about", label: "About me", icon: <AppIcon icon={apps.about.icon} tint={apps.about.tint} size={56} />, open: () => openApp("about") },
      ...projects.map((p) => ({
        id: `project:${p.slug}`,
        label: p.title,
        icon: <FolderIcon color={p.color} size={58} />,
        open: () => openProject(p),
      })),
      ...GRID_APPS.map((id) => ({
        id,
        label: apps[id].name,
        icon: <AppIcon icon={apps[id].icon} tint={apps[id].tint} size={56} />,
        open: () => openApp(id),
      })),
    ],
    [projects],
  );

  // Fit as many rows as the screen allows; extra icons spill onto more pages (no scrolling).
  const h = viewport?.h ?? 800;
  const widgetH = h > 700 ? 168 : 112;
  const rows = Math.max(2, Math.floor((h - STATUS_H - widgetH - DOCK_H - 40) / ROW_H));
  const perPage = rows * 4;
  const pages = Math.max(1, Math.ceil(entries.length / perPage));
  const current = Math.min(page, pages - 1);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50 || info.velocity.x < -400) setPage(Math.min(current + 1, pages - 1));
    else if (info.offset.x > 50 || info.velocity.x > 400) setPage(Math.max(current - 1, 0));
  };

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

      {/* Search pill */}
      <div className="flex shrink-0 justify-center pt-3 pb-1">
        <button
          type="button"
          onClick={() => togglePanel("search")}
          className="glass flex h-8 items-center gap-2 rounded-full border border-line px-4 text-xs text-muted"
        >
          <Search size={13} /> Search
        </button>
      </div>

      {/* Icon pages */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <motion.div
          className="flex h-full"
          drag={pages > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={onDragEnd}
          animate={{ x: `${-current * 100}%` }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
        >
          {Array.from({ length: pages }, (_, p) => (
            <ul key={p} className="grid w-full shrink-0 grid-cols-4 content-start gap-y-2 px-3 pt-3" style={{ gridAutoRows: ROW_H - 8 }}>
              {entries.slice(p * perPage, (p + 1) * perPage).map((e) => (
                <li key={e.id}>
                  <HomeIcon label={e.label} onOpen={e.open}>
                    {e.icon}
                  </HomeIcon>
                </li>
              ))}
            </ul>
          ))}
        </motion.div>
      </div>

      {/* Page dots */}
      <div className="flex h-5 shrink-0 items-center justify-center gap-1.5">
        {pages > 1 &&
          Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              onClick={() => setPage(i)}
              className={`size-1.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/35"}`}
            />
          ))}
      </div>

      {/* Dock */}
      <div className="shrink-0 px-3 pb-[max(10px,env(safe-area-inset-bottom))]" style={{ height: DOCK_H }}>
        <div className="glass mx-auto flex h-[78px] max-w-md items-center justify-around rounded-[28px] border border-line px-2">
          {DOCK.map((id) => (
            <motion.button
              key={id}
              type="button"
              aria-label={apps[id].name}
              whileTap={{ scale: 0.88 }}
              onClick={() => openApp(id)}
            >
              <AppIcon icon={apps[id].icon} tint={apps[id].tint} size={56} />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function HomeIcon({ label, onOpen, children }: { label: string; onOpen: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={onOpen}
      className="flex w-full flex-col items-center gap-1.5"
    >
      <span className="drop-shadow-[0_6px_12px_rgb(0_0_0/0.4)]">{children}</span>
      <span className="line-clamp-1 max-w-full px-0.5 text-[11.5px] text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.8)]">
        {label}
      </span>
    </motion.button>
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
