"use client";

import { ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react";
import { useEffect } from "react";
import { useContent } from "../content/ContentProvider";
import type { ProjectItem } from "../content/types";
import { toEmbedUrl } from "../lib/embed";
import { useWindows } from "../store/windows";
import type { AppProps } from "./types";
import { Button, EmptyState } from "./ui";

/** Shows one file of a project: image (with prev/next), PDF, video or embedded video. */
export function Viewer({ params, windowId }: AppProps) {
  const { projects, media } = useContent();
  const project = projects.find((p) => p.slug === params.slug);
  const items: ProjectItem[] = project
    ? project.items
    : params.media
      ? media.map((m) => ({ ...m }))
      : [];
  const item = items.find((i) => i.id === (params.item ?? params.media));

  if (!item) return <EmptyState title="File not found">It may have been removed from the folder.</EmptyState>;

  if (item.kind === "image") return <ImageView items={items} item={item} params={params} windowId={windowId} />;
  if (item.kind === "pdf") return <PdfView item={item} />;
  if (item.kind === "video") return <VideoView item={item} />;
  if (item.kind === "embed") return <EmbedView item={item} />;
  return <EmptyState title={item.title}>This file type can&apos;t be previewed.</EmptyState>;
}

function ImageView({
  items,
  item,
  params,
  windowId,
}: {
  items: ProjectItem[];
  item: ProjectItem;
  params: AppProps["params"];
  windowId?: string;
}) {
  const images = items.filter((i) => i.kind === "image" && i.url);
  const index = images.findIndex((i) => i.id === item.id);
  const go = (delta: number) => {
    const next = images[(index + delta + images.length) % images.length];
    if (!next || !windowId) return;
    const key = params.media ? "media" : "item";
    useWindows.setState((s) => ({
      windows: s.windows.map((w) =>
        w.id === windowId ? { ...w, title: next.title, params: { ...w.params, [key]: next.id } } : w,
      ),
    }));
  };

  useEffect(() => {
    if (!windowId || images.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (useWindows.getState().focusedId !== windowId) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="relative flex h-full flex-col bg-black/40">
      <div className="relative grid min-h-0 flex-1 place-items-center p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${item.url}?w=2000&fit=max&auto=format`}
          alt={item.caption ?? item.title}
          className="max-h-full max-w-full rounded-md object-contain shadow-window"
        />
        {images.length > 1 && (
          <>
            <NavButton side="left" onClick={() => go(-1)} />
            <NavButton side="right" onClick={() => go(1)} />
          </>
        )}
      </div>
      {(item.caption || images.length > 1) && (
        <p className="shrink-0 border-t border-line px-4 py-2 text-center text-xs text-muted">
          {item.caption}
          {images.length > 1 && <span className="ml-2 text-faint">{index + 1} / {images.length}</span>}
        </p>
      )}
    </div>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous image" : "Next image"}
      onClick={onClick}
      className={`glass absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-line text-fg transition hover:scale-105 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <Icon size={20} />
    </button>
  );
}

function PdfView({ item }: { item: ProjectItem }) {
  if (!item.url) return <EmptyState title="Missing file" />;
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-end gap-2 border-b border-line px-3 py-2">
        <Button href={item.url} icon={ExternalLink}>Open</Button>
        <Button href={`${item.url}?dl=`} icon={Download} download>Download</Button>
      </div>
      {/* Native PDF viewer; mobile browsers that can't inline PDFs fall back to the buttons above. */}
      <object data={`${item.url}#view=FitH`} type="application/pdf" className="min-h-0 w-full flex-1 bg-white">
        <EmptyState title="Preview unavailable">Your browser can&apos;t show PDFs inline. Use Open or Download above.</EmptyState>
      </object>
    </div>
  );
}

function VideoView({ item }: { item: ProjectItem }) {
  if (!item.url) return <EmptyState title="Missing file" />;
  return (
    <div className="grid h-full place-items-center bg-black">
      <video src={item.url} controls playsInline className="max-h-full max-w-full" />
    </div>
  );
}

function EmbedView({ item }: { item: ProjectItem }) {
  const src = toEmbedUrl(item.url);
  if (!src) {
    return (
      <EmptyState title="Can't embed this video" action={item.url ? <Button href={item.url} icon={ExternalLink}>Watch it there</Button> : undefined} />
    );
  }
  return (
    <iframe
      src={src}
      title={item.title}
      className="h-full w-full bg-black"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
