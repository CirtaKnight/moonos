"use client";

import { AnimatePresence, motion } from "motion/react";
import { BellOff, X } from "lucide-react";
import { useEffect } from "react";
import { openApp, openProject } from "../apps/launch";
import type { AppId } from "../apps/registry";
import { useContent } from "../content/ContentProvider";
import { useNow } from "../hooks";
import { useNotifications, type Notice } from "../store/notifications";
import { useSettings } from "../store/settings";
import { useUI } from "../store/ui";
import { LogoMark } from "./Logo";
import { MENUBAR_H, TASKBAR_H } from "./Shell";

const NEW_PROJECT_DAYS = 45;

/** Raises welcome + "new project" notifications once per visitor. */
export function useStartupNotifications() {
  const { projects } = useContent();
  useEffect(() => {
    const settings = useSettings.getState();
    const { push } = useNotifications.getState();
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(
        () =>
          push({
            id: "welcome",
            title: settings.seenProjects.length ? "Welcome back" : "Welcome to CirtaKnight OS",
            body: "Open the Terminal and type `help`, or press Ctrl+K to search.",
            action: { type: "app", app: "terminal" },
          }),
        1800,
      ),
    );

    const cutoff = Date.now() - NEW_PROJECT_DAYS * 86_400_000;
    const fresh = projects.filter(
      (p) =>
        !p.archived &&
        !settings.seenProjects.includes(p.id) &&
        p.publishedAt &&
        new Date(p.publishedAt).getTime() > cutoff,
    );
    fresh.slice(0, 3).forEach((p, i) =>
      timers.push(
        setTimeout(
          () =>
            push({
              id: `project:${p.id}`,
              title: `New project: ${p.title}`,
              body: p.summary,
              action: { type: "project", slug: p.slug, title: p.title },
            }),
          3200 + i * 1400,
        ),
      ),
    );
    settings.markProjectsSeen(projects.map((p) => p.id));
    return () => timers.forEach(clearTimeout);
  }, [projects]);
}

function runAction(n: Notice) {
  if (n.action?.type === "project") openProject({ slug: n.action.slug, title: n.action.title });
  else if (n.action?.type === "app") openApp(n.action.app as AppId);
}

function NoticeCard({ n, onClose, compact }: { n: Notice; onClose?: () => void; compact?: boolean }) {
  const now = useNow(30_000);
  const ago = now ? Math.max(0, Math.round((now.getTime() - n.at) / 60000)) : 0;
  return (
    <div className="group relative flex gap-3 rounded-xl border border-line bg-surface-solid/95 p-3 shadow-window">
      <span className="mt-0.5 shrink-0">
        <LogoMark size={22} />
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
          {!compact && <span className="ml-auto shrink-0 text-[10.5px] text-faint">{ago ? `${ago}m ago` : "now"}</span>}
        </span>
        {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{n.body}</span>}
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
                items.map((n) => (
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
