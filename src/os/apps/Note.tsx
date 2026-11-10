"use client";

import { useContent } from "../content/ContentProvider";
import type { AppProps } from "./types";
import { EmptyState, Scroll } from "./ui";

/** Plain-text reader for Welcome.txt and project notes. */
export function Note({ params }: AppProps) {
  const { projects, settings } = useContent();
  const text = params.welcome
    ? settings.welcomeNote
    : projects.find((p) => p.slug === params.slug)?.items.find((i) => i.id === params.item)?.text;

  if (!text) return <EmptyState title="Empty note" />;

  return (
    <Scroll className="bg-bg-2/60">
      <pre className="p-5 font-mono text-[13px] leading-relaxed break-words whitespace-pre-wrap text-fg sm:p-6">
        {text}
      </pre>
    </Scroll>
  );
}
