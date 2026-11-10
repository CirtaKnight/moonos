"use client";

import type { Project, ProjectItem } from "../content/types";
import { play } from "../lib/sound";
import { useAchievements } from "../store/achievements";
import { usePhone } from "../store/phone";
import { useWindows, type WindowParams } from "../store/windows";
import { getApp, type AppId } from "./registry";

/**
 * Open (or focus) an app: a window on the desktop, a full-screen app in the phone shell.
 */
export function openApp(appId: AppId, params: WindowParams = {}, title?: string, key?: string) {
  const app = getApp(appId);
  const resolvedTitle = title ?? app.name;
  const resolvedKey = key ?? appId;
  play("open");
  useAchievements.getState().trackApp(appId);
  if (usePhone.getState().active) {
    usePhone.getState().push({ appId, title: resolvedTitle, params, key: resolvedKey });
    return resolvedKey;
  }
  return useWindows.getState().open(appId, {
    title: resolvedTitle,
    params,
    key: resolvedKey,
    size: app.size,
  });
}

export function openProject(project: Pick<Project, "slug" | "title">) {
  return openApp("folder", { slug: project.slug }, project.title, `folder:${project.slug}`);
}

/** Open a project item in the right place: links in a new tab, notes in Notes, files in Viewer. */
export function openItem(projectSlug: string, item: ProjectItem) {
  if (item.kind === "link" && item.url) {
    window.open(item.url, "_blank", "noopener,noreferrer");
    return;
  }
  if (item.kind === "note") {
    return openApp("note", { slug: projectSlug, item: item.id }, item.title, `note:${projectSlug}:${item.id}`);
  }
  return openApp(
    "viewer",
    { slug: projectSlug, item: item.id },
    item.title,
    `viewer:${projectSlug}:${item.id}`,
  );
}

/** Replace the params of the window / phone screen an app lives in (e.g. next image). */
export function updateHost(windowId: string | undefined, screenKey: string | undefined, patch: { title: string; params: WindowParams }) {
  if (windowId) {
    useWindows.setState((s) => ({
      windows: s.windows.map((w) => (w.id === windowId ? { ...w, ...patch, params: { ...w.params, ...patch.params } } : w)),
    }));
  } else if (screenKey) {
    const screen = usePhone.getState().stack.find((s) => s.id === screenKey);
    if (screen) usePhone.getState().update(screen.id, { title: patch.title, params: { ...screen.params, ...patch.params } });
  }
}
