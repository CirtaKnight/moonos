"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";
import { AppIcon, DocIcon, FolderIcon } from "../components/AppIcon";
import { useContent } from "../content/ContentProvider";
import { copyText, shareUrl } from "../lib/links";
import { apps, type AppId } from "./registry";
import type { AppProps } from "./types";
import { Button, EmptyState, Scroll, Tag, formatMonth } from "./ui";

/** "Get info" panel for desktop items: projects, apps and documents. */
export function Info({ params }: AppProps) {
  const { projects, settings } = useContent();
  const [copied, setCopied] = useState(false);

  let icon: React.ReactNode = null;
  let title = "";
  let rows: [string, React.ReactNode][] = [];
  let link: string | null = null;
  let tags: string[] = [];

  if (params.project) {
    const p = projects.find((x) => x.slug === params.project);
    if (!p) return <EmptyState title="Item not found" />;
    icon = <FolderIcon color={p.color} size={64} />;
    title = p.title;
    tags = p.tags;
    link = `project/${p.slug}`;
    const kinds = p.items.reduce<Record<string, number>>((acc, i) => ({ ...acc, [i.kind]: (acc[i.kind] ?? 0) + 1 }), {});
    rows = [
      ["Kind", "Project folder"],
      ["Contents", p.items.length ? Object.entries(kinds).map(([k, n]) => `${n} ${k}`).join(" · ") : "Empty"],
      ["Date", formatMonth(p.date) ?? "—"],
      ["Added", p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "—"],
      ["Location", `~/projects/${p.slug}`],
    ];
    if (p.repo) rows.push(["Repository", <a key="r" className="text-accent hover:underline" href={p.repo.url} target="_blank" rel="noopener noreferrer">{p.repo.fullName}</a>]);
    if (p.repo?.stars != null) rows.push(["Stars", `★ ${p.repo.stars}`]);
    if (p.repo?.language) rows.push(["Language", p.repo.language]);
  } else if (params.app && apps[params.app as AppId]) {
    const a = apps[params.app as AppId];
    icon = <AppIcon icon={a.icon} tint={a.tint} size={64} />;
    title = a.name;
    link = a.id;
    rows = [
      ["Kind", "Application"],
      ["Description", a.description ?? "—"],
      ["Location", `/usr/apps/${a.id}`],
      ["Version", "1.0"],
    ];
  } else if (params.doc === "welcome") {
    icon = <DocIcon size={64} />;
    title = "Welcome.txt";
    rows = [
      ["Kind", "Plain text document"],
      ["Size", `${new Blob([settings.welcomeNote]).size} bytes`],
      ["Location", "~/Desktop/Welcome.txt"],
    ];
  } else {
    return <EmptyState title="Nothing to show" />;
  }

  return (
    <Scroll className="p-5">
      <div className="flex items-center gap-4 border-b border-line pb-4">
        {icon}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-fg">{title}</h2>
          {tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          )}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="min-w-0 break-words text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      {link && (
        <div className="mt-5">
          <Button
            icon={Link2}
            onClick={async () => {
              await copyText(shareUrl(link!));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Link copied" : "Copy link"}
          </Button>
        </div>
      )}
    </Scroll>
  );
}
