"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { FolderIcon } from "../components/AppIcon";
import { useContent } from "../content/ContentProvider";
import { play } from "../lib/sound";
import { openProject } from "./launch";
import type { AppProps } from "./types";
import { EmptyState, Scroll, formatMonth } from "./ui";

const EMPTY_JOKES = [
  "Emptying failed: these are learning experiences, not trash.",
  "Permission denied. Past projects are load-bearing.",
  "Can't empty the bin while the moon is watching.",
];

/** Archived projects, kept with a sense of humour. */
export function Bin(_props: AppProps) {
  void _props;
  const archived = useContent().projects.filter((p) => p.archived);
  const [joke, setJoke] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
        <p className="mr-auto text-sm text-muted">
          {archived.length
            ? "Old experiments, abandoned ideas and early drafts. Everyone starts somewhere."
            : "Nothing here yet."}
        </p>
        {archived.length > 0 && (
          <button
            type="button"
            onClick={() => {
              play("error");
              setJoke(EMPTY_JOKES[Math.floor(Math.random() * EMPTY_JOKES.length)]);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-danger/60 hover:text-danger"
          >
            <Trash2 size={13} /> Empty bin
          </button>
        )}
      </div>
      {joke && (
        <p role="alert" className="shrink-0 border-b border-line bg-danger/10 px-4 py-2 text-xs text-danger">
          {joke}
        </p>
      )}
      <div className="min-h-0 flex-1">
        {archived.length === 0 ? (
          <EmptyState title="The bin is empty" phase={0.02}>
            Every project made it so far. Suspicious, isn&apos;t it?
          </EmptyState>
        ) : (
          <Scroll>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2 p-4">
              {archived.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => openProject(p)}
                    className="flex w-full flex-col items-center gap-2 rounded-xl p-3 text-center opacity-75 grayscale-[60%] transition hover:bg-surface-hover hover:opacity-100 hover:grayscale-0"
                  >
                    <FolderIcon color={p.color} size={52} />
                    <span className="line-clamp-2 text-[12.5px] text-fg">{p.title}</span>
                    {p.date && <span className="text-[10.5px] text-faint">{formatMonth(p.date)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </Scroll>
        )}
      </div>
    </div>
  );
}
