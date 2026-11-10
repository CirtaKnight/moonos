"use client";

import type { Project, ProjectItem } from "../content/types";
import { useWindows, type WindowParams } from "../store/windows";
import { getApp, type AppId } from "./registry";

/** Open (or focus) an app window. */
export function openApp(appId: AppId, params: WindowParams = {}, title?: string, key?: string) {
  const app = getApp(appId);
  return useWindows.getState().open(appId, {
    title: title ?? app.name,
    params,
    key: key ?? appId,
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
