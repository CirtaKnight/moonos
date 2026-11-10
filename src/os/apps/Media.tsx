"use client";

import { Play } from "lucide-react";
import { useContent } from "../content/ContentProvider";
import { openApp } from "./launch";
import type { AppProps } from "./types";
import { EmptyState, Scroll } from "./ui";

function openMedia(id: string, title: string) {
  openApp("viewer", { media: id }, title, `viewer:media:${id}`);
}

/** Gallery: standalone images uploaded in the admin. */
export function Gallery(_props: AppProps) {
  void _props;
  const images = useContent().media.filter((m) => m.kind === "image");
  if (!images.length) {
    return <EmptyState title="The gallery is empty" phase={0.62}>Photos and visuals will be hung here soon.</EmptyState>;
  }
  return (
    <Scroll>
      <ul className="columns-2 gap-2 p-3 sm:columns-3">
        {images.map((m) => (
          <li key={m.id} className="mb-2 break-inside-avoid">
            <button
              type="button"
              onClick={() => openMedia(m.id, m.title)}
              className="group relative block w-full overflow-hidden rounded-lg ring-1 ring-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${m.url}?w=600&auto=format`}
                alt={m.caption ?? m.title}
                loading="lazy"
                width={m.width}
                height={m.height}
                className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {m.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Scroll>
  );
}

/** Videos: uploaded files and YouTube/Vimeo links. */
export function Videos(_props: AppProps) {
  void _props;
  const videos = useContent().media.filter((m) => m.kind === "video" || m.kind === "embed");
  if (!videos.length) {
    return <EmptyState title="No videos yet" phase={0.88}>Demos and walkthroughs will play here.</EmptyState>;
  }
  return (
    <Scroll>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 p-4">
        {videos.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => openMedia(v.id, v.title)}
              className="group flex w-full flex-col gap-2 rounded-xl text-left"
            >
              <span className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_20%,#1d2640,#06080f)] ring-1 ring-line">
                <span className="grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-ink">
                  <Play size={20} className="translate-x-0.5" />
                </span>
              </span>
              <span className="px-1">
                <span className="block truncate text-sm font-medium text-fg">{v.title}</span>
                {v.caption && <span className="block truncate text-xs text-muted">{v.caption}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Scroll>
  );
}
