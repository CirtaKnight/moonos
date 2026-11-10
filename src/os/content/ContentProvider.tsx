"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { OSContent } from "./types";

const ContentContext = createContext<OSContent | null>(null);

export function ContentProvider({ content, children }: { content: OSContent; children: ReactNode }) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useContent(): OSContent {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside <ContentProvider>");
  return ctx;
}

/** Projects visible on the desktop (archived ones live in the Recycle Bin). */
export function useProjects() {
  return useContent().projects.filter((p) => !p.archived);
}
