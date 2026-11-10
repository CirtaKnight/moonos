import { FileImage, FileText, FileVideo, Link2, MonitorPlay, NotebookText } from "lucide-react";
import type { ItemKind, ProjectItem } from "../content/types";

const META: Record<ItemKind, { icon: typeof FileText; tint: string; label: string }> = {
  pdf: { icon: FileText, tint: "#e8a6a6", label: "PDF" },
  image: { icon: FileImage, tint: "#d6b6e8", label: "Image" },
  video: { icon: FileVideo, tint: "#f0c987", label: "Video" },
  embed: { icon: MonitorPlay, tint: "#f29fb8", label: "Video" },
  link: { icon: Link2, tint: "#9fc3e8", label: "Link" },
  note: { icon: NotebookText, tint: "#e9ecf3", label: "Note" },
};

export const kindLabel = (k: ItemKind) => META[k].label;

/** Thumbnail tile for a file: real preview for images, typed glyph otherwise. */
export function FileThumb({ item, size = 72 }: { item: ProjectItem; size?: number }) {
  const meta = META[item.kind];
  if (item.kind === "image" && item.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`${item.url}?w=${size * 3}&h=${size * 3}&fit=crop&auto=format`}
        alt=""
        loading="lazy"
        width={size}
        height={size}
        className="rounded-lg object-cover ring-1 ring-line"
        style={{ width: size, height: size }}
      />
    );
  }
  const Icon = meta.icon;
  return (
    <span
      className="relative grid place-items-center rounded-lg ring-1 ring-line"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, color-mix(in oklab, ${meta.tint} 18%, var(--surface-solid)), var(--surface-solid))`,
      }}
    >
      <Icon size={size * 0.42} strokeWidth={1.5} color={meta.tint} />
      <span className="absolute right-1.5 bottom-1 font-mono text-[9px] font-bold tracking-wider text-muted">
        {meta.label.toUpperCase()}
      </span>
    </span>
  );
}
