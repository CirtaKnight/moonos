"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, BellOff, CalendarDays, Sparkles, Trophy, X } from "lucide-react";
import { siGithub } from "simple-icons";
import { useEffect } from "react";
import { openApp, openProject } from "../apps/launch";
import type { AppId } from "../apps/registry";
import { useContent } from "../content/ContentProvider";
import { useNow } from "../hooks";
import { timeAgo } from "../lib/github";
import { useNotifications, type Notice, type NoticeSource } from "../store/notifications";
import { useSettings } from "../store/settings";
import { useUI } from "../store/ui";
import { LogoMark } from "./Logo";
import { MENUBAR_H, TASKBAR_H } from "./Shell";

const NEW_PROJECT_DAYS = 45;
const ACTIVITY_DAYS = 30;
const UPCOMING_DAYS = 14;
const DAY = 86_400_000;

const noticeTime = (n: Notice) => Date.parse(n.time ?? new Date(n.at).toISOString());
const byTime = (a: Notice, b: Notice) => noticeTime(b) - noticeTime(a);

/**
 * Startup notifications: welcome, new projects, admin announcements, live GitHub activity
 * and upcoming agenda items. Everything lands in the notification center; only things the
 * visitor hasn't seen before pop up as toasts (a few at most).
 */
export function useStartupNotifications() {
  const { projects, announcements, activity, events } = useContent();
  useEffect(() => {
    const settings = useSettings.getState();
    const seen = new Set(settings.seenNotices);
    const { push } = useNotifications.getState();
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 1800;
    let toasts = 0;
    const queue = (n: Omit<Notice, "at">, wantToast = true) => {
      const toast = wantToast && !seen.has(n.id) && toasts < 4;
      if (toast) toasts++;
      const at = toast ? (delay += 1300) : 0;
      timers.push(setTimeout(() => push(n, { toast }), at));
    };

    queue({
      id: "welcome",
      title: settings.seenNotices.length ? "Welcome back" : "Welcome to MoonOS",
      body: "Double-click an icon to open it. Start with About me, or press Ctrl+K to search everything.",
      source: "system",
      action: { type: "app", app: "about" },
    });

    const cutoff = Date.now() - NEW_PROJECT_DAYS * DAY;
    projects
      .filter((p) => !p.archived && !settings.seenProjects.includes(p.id) && p.publishedAt && new Date(p.publishedAt).getTime() > cutoff)
      .slice(0, 3)
      .forEach((p) =>
        queue({
          id: `project:${p.id}`,
          title: `New project: ${p.title}`,
          body: p.summary,
          source: "star",
          action: { type: "project", slug: p.slug, title: p.title },
        }),
      );

    announcements.slice(0, 6).forEach((a) =>
      queue({
        id: `ann:${a.id}`,
        title: a.title,
        body: a.body,
        time: a.publishedAt,
        source: a.source,
        action: a.url ? { type: "url", href: a.url } : undefined,
      }),
    );

    const now = Date.now();
    events
      .filter((e) => {
        const t = new Date(e.start).getTime();
        return t >= now - DAY && t <= now + UPCOMING_DAYS * DAY;
      })
      .forEach((e) =>
        queue({
          id: `event:${e.id}`,
          title: `Coming up: ${e.title}`,
          body: [new Date(e.start).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }), e.location]
            .filter(Boolean)
            .join(" · "),
          source: "calendar",
          action: { type: "app", app: "agenda" },
        }),
      );

    const recent = now - ACTIVITY_DAYS * DAY;
    activity
      .filter((a) => new Date(a.at).getTime() > recent)
      .slice(0, 10)
      .forEach((a, i) =>
        // Only the two most recent GitHub events may pop up; the rest wait in the center.
        queue({ id: a.id, title: a.title, body: a.body, time: a.at, source: "github", action: { type: "url", href: a.url } }, i < 2),
      );

    settings.markProjectsSeen(projects.map((p) => p.id));
    settings.markNoticesSeen([
      "welcome",
      ...announcements.map((a) => `ann:${a.id}`),
      ...events.map((e) => `event:${e.id}`),
      ...activity.map((a) => a.id),
    ]);
    return () => timers.forEach(clearTimeout);
  }, [projects, announcements, activity, events]);
}

function runAction(n: Notice) {
  const a = n.action;
  if (!a) return;
  if (a.type === "project") openProject({ slug: a.slug, title: a.title });
  else if (a.type === "app") openApp(a.app as AppId, a.params);
  else window.open(a.href, "_blank", "noopener,noreferrer");
}

function SourceIcon({ source }: { source?: NoticeSource }) {
  const cls = "grid size-[22px] place-items-center rounded-md";
  switch (source) {
    case "github":
      return (
        <span className={`${cls} bg-white/10 text-fg`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-label="GitHub">
            <path d={siGithub.path} />
          </svg>
        </span>
      );
    case "linkedin":
      return (
        <span className={`${cls} bg-[#0a66c2] text-white`} aria-label="LinkedIn">
          <span className="text-[11px] leading-none font-bold">in</span>
        </span>
      );
    case "trophy":
      return (
        <span className={`${cls} bg-gold/20 text-gold`}>
          <Trophy size={13} />
        </span>
      );
    case "calendar":
      return (
        <span className={`${cls} bg-[#f0c987]/20 text-[#f0c987]`}>
          <CalendarDays size={13} />
        </span>
      );
    case "star":
      return (
        <span className={`${cls} bg-accent/20 text-accent`}>
          <Sparkles size={13} />
        </span>
      );
    default:
      return <LogoMark size={22} />;
  }
}

function NoticeCard({ n, onClose, compact }: { n: Notice; onClose?: () => void; compact?: boolean }) {
  const now = useNow(30_000);
  const when = timeAgo(n.time ?? new Date(n.at).toISOString(), now?.getTime());
  const external = n.action?.type === "url";
  return (
    <div className="group relative flex gap-3 rounded-xl border border-line bg-surface-solid/95 p-3 shadow-window">
      <span className="mt-0.5 shrink-0">
        <SourceIcon source={n.source} />
      </span>
      <button
        type="button"
        onClick={() => {
          runAction(n);
          onClose?.();
        }}
        className="min-w-0 flex-1 text-left"
      >
        <span className="flex items-baseline gap-2">
          <span className="truncate text-[13px] font-semibold text-fg">{n.title}</span>
          {(!compact || n.time) && <span className="ml-auto shrink-0 text-[10.5px] text-faint">{when}</span>}
        </span>
        {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{n.body}</span>}
        {external && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent">
            {n.source === "github" ? "View on GitHub" : n.source === "linkedin" ? "Open on LinkedIn" : "Open link"}
            <ArrowUpRight size={11} />
          </span>
        )}
      </button>
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          className="absolute -top-2 -left-2 grid size-5 place-items-center rounded-full border border-line bg-surface-solid text-muted opacity-0 transition group-hover:opacity-100"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

/** Toasts (top-right) and the notification center panel. */
export function NotificationLayer() {
  const items = useNotifications((s) => s.items);
  const toasts = useNotifications((s) => s.toasts);
  const dismissToast = useNotifications((s) => s.dismissToast);
  const clear = useNotifications((s) => s.clear);
  const panel = useUI((s) => s.panel);
  const closePanel = useUI((s) => s.closePanel);
  const layout = useSettings((s) => s.layout);
  const top = layout === "dock" ? MENUBAR_H + 10 : 10;
  const open = panel === "notifications";

  return (
    <>
      <div
        className="pointer-events-none absolute right-3 z-[75] flex w-[min(340px,calc(100vw-24px))] flex-col gap-2"
        style={{ top }}
        aria-live="polite"
      >
        <AnimatePresence>
          {!open &&
            toasts.map((id) => {
              const n = items.find((x) => x.id === id);
              if (!n) return null;
              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
                  className="pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <NoticeCard n={n} compact onClose={() => dismissToast(id)} />
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="center"
            aria-label="Notifications"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24, transition: { duration: 0.12 } }}
            onClick={(e) => e.stopPropagation()}
            className="glass absolute right-3 z-[75] flex w-[min(360px,calc(100vw-24px))] flex-col rounded-2xl border border-line-strong shadow-window"
            style={{ top, bottom: layout === "dock" ? 92 : TASKBAR_H + 10 }}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold text-fg">Notifications</h2>
              {items.length > 0 && (
                <button type="button" onClick={clear} className="text-xs text-muted hover:text-fg">
                  Clear all
                </button>
              )}
            </div>
            <div className="scroll-area flex min-h-0 flex-1 flex-col gap-2 p-3">
              {items.length === 0 ? (
                <div className="m-auto flex flex-col items-center gap-2 text-sm text-muted">
                  <BellOff size={22} /> All quiet under the moon.
                </div>
              ) : (
                [...items].sort(byTime).map((n) => (
                  <NoticeCard
                    key={n.id}
                    n={n}
                    onClose={() => {
                      useNotifications.setState((s) => ({ items: s.items.filter((x) => x.id !== n.id) }));
                    }}
                  />
                ))
              )}
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="border-t border-line py-2.5 text-xs text-muted hover:text-fg"
            >
              Close
            </button>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
