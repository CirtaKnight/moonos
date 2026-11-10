"use client";

import { useEffect } from "react";
import { APP_IDS, type AppId } from "./apps/registry";
import { openApp, openProject } from "./apps/launch";
import { useContent } from "./content/ContentProvider";
import { linkFor, parseDeepLink } from "./lib/deeplink";
import { usePhone } from "./store/phone";
import { useWindows } from "./store/windows";

/** Opens what the URL asks for, once, after the shell mounts. Also used by Quick view. */
export function launchQuickView() {
  if (usePhone.getState().active) {
    openApp("projects");
    openApp("about");
    return;
  }
  const projects = openApp("projects");
  const about = openApp("about");
  const { snapTo } = useWindows.getState();
  snapTo(about, "left");
  snapTo(projects, "right");
}

let consumed = false;

export function useDeepLinks() {
  const { projects } = useContent();

  // Apply the incoming link once per page load. The timer is deliberately not cancelled on
  // cleanup: a dev-mode effect re-run must not swallow the link.
  useEffect(() => {
    if (consumed) return;
    consumed = true;
    const link = parseDeepLink(window.location.search, APP_IDS);
    if (!link) return;
    // Let the shell lay out first so windows get correct bounds.
    setTimeout(() => {
      if (link.kind === "quick") launchQuickView();
      else if (link.kind === "app") openApp(link.app as AppId);
      else {
        const p = projects.find((x) => x.slug === link.slug);
        if (p) openProject(p);
      }
    }, 80);
  }, [projects]);

  // Keep the address bar in sync with the focused window, so it can be copied and shared.
  useEffect(() => {
    const sync = () => {
      const phone = usePhone.getState();
      let open: string | null = null;
      if (phone.active) {
        const top = phone.stack[phone.stack.length - 1];
        open = top ? linkFor(top.appId, top.params) : null;
      } else {
        const { windows, focusedId } = useWindows.getState();
        const w = windows.find((x) => x.id === focusedId && !x.minimized);
        open = w ? linkFor(w.appId, w.params) : null;
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("quick");
      if (open) url.searchParams.set("open", open);
      else url.searchParams.delete("open");
      const next = url.pathname + (url.search ? url.search.replace(/%2F/g, "/") : "") + url.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.replaceState(window.history.state, "", next);
      }
    };
    const unsubA = useWindows.subscribe(sync);
    const unsubB = usePhone.subscribe(sync);
    return () => {
      unsubA();
      unsubB();
    };
  }, []);
}
