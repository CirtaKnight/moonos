"use client";

import { Calendar, Check, ExternalLink, Link2 } from "lucide-react";
import { useState } from "react";
import { siGithub } from "simple-icons";
import { FolderIcon } from "../components/AppIcon";
import { FileThumb, kindLabel } from "../components/FileIcons";
import { useContent } from "../content/ContentProvider";
import { timeAgo } from "../lib/github";
import { openItem } from "./launch";
import type { AppProps } from "./types";
import { EmptyState, Scroll, Tag, formatMonth } from "./ui";

/** A project folder: description header + its files. */
export function Folder({ params }: AppProps) {
  const { projects } = useContent();
  const project = projects.find((p) => p.slug === params.slug);
  if (!project) {
    return <EmptyState title="Folder not found">This project may have been moved or deleted.</EmptyState>;
  }

  return (
    <Scroll>
      <header className="relative overflow-hidden border-b border-line">
        {project.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${project.coverUrl}?w=1400&auto=format`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        <div className="relative flex gap-4 p-5 sm:p-6">
          <span className="hidden sm:block">
            <FolderIcon color={project.color} size={64} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <h1 className="mr-auto text-xl font-semibold tracking-tight text-fg">{project.title}</h1>
              <CopyLink slug={project.slug} />
            </div>
            {project.summary && <p className="mt-1 text-sm text-muted">{project.summary}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {project.date && (
                <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-muted">
                  <Calendar size={13} /> {formatMonth(project.date)}
                </span>
              )}
              {project.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </div>
          </div>
        </div>
        {project.repo && (
          <a
            href={project.repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative mx-5 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-surface-2 px-3.5 py-2 text-xs text-muted transition-colors hover:border-accent/50 sm:mx-6"
          >
            <span className="flex items-center gap-1.5 font-medium text-fg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d={siGithub.path} />
              </svg>
              {project.repo.fullName}
            </span>
            {project.repo.stars != null && <span>★ {project.repo.stars}</span>}
            {project.repo.language && <span>{project.repo.language}</span>}
            {project.repo.pushedAt && <span>Updated {timeAgo(project.repo.pushedAt)}</span>}
            <ExternalLink size={12} className="ml-auto" />
          </a>
        )}
        {project.description && (
          <p className="relative max-w-3xl px-5 pb-5 text-[14px] leading-relaxed whitespace-pre-line text-fg/90 sm:px-6">
            {project.description}
          </p>
        )}
      </header>

      {project.items.length === 0 ? (
        <div className="h-64">
          <EmptyState title="This folder is empty">Files for this project are on their way.</EmptyState>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(116px,1fr))] gap-2 p-4" aria-label="Files">
          {project.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openItem(project.slug, item)}
                title={item.caption ?? item.title}
                className="group flex w-full flex-col items-center gap-2 rounded-xl p-3 text-center transition-colors hover:bg-surface-hover focus-visible:bg-surface-hover"
              >
                <span className="transition-transform group-hover:-translate-y-0.5">
                  <FileThumb item={item} />
                </span>
                <span className="line-clamp-2 text-[12.5px] leading-tight text-fg">
                  {item.title}
                  {item.kind === "link" && <ExternalLink size={11} className="ml-1 inline text-muted" />}
                </span>
                <span className="text-[10.5px] text-faint">{kindLabel(item.kind)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Scroll>
  );
}

function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}/?open=project/${slug}`;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          window.prompt("Copy this link:", url);
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-xs text-muted transition-colors hover:text-fg"
    >
      {copied ? <Check size={13} className="text-success" /> : <Link2 size={13} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
