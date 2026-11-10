"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Lock, Plus, RotateCw, Star, X } from "lucide-react";
import { useState } from "react";
import { Avatar } from "../components/Avatar";
import { LogoMark } from "../components/Logo";
import { SocialIcon } from "../components/SocialIcon";
import { useContent } from "../content/ContentProvider";
import { prettyUrl } from "../lib/embed";
import type { AppProps } from "./types";
import { EmptyState, Scroll } from "./ui";

/**
 * A small browser whose "internet" is the owner's links page.
 * Real sites open in a new tab (most of them refuse to be framed).
 */
export function Browser(_props: AppProps) {
  void _props;
  const { profile, socials } = useContent();
  const [spin, setSpin] = useState(0);

  return (
    <div className="flex h-full flex-col">
      {/* Tab strip */}
      <div className="flex shrink-0 items-end gap-1 bg-bg-2/70 px-2 pt-2">
        <div className="flex h-8 max-w-56 min-w-0 items-center gap-2 rounded-t-lg border border-b-0 border-line bg-surface-solid px-3 text-xs text-fg">
          <LogoMark size={14} />
          <span className="truncate">{profile.name} · Links</span>
          <X size={12} className="ml-1 shrink-0 text-faint" aria-hidden />
        </div>
        <span className="grid h-8 w-7 place-items-center text-faint" aria-hidden>
          <Plus size={14} />
        </span>
      </div>
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-1.5 border-y border-line bg-surface-solid px-2 py-1.5">
        <span className="grid size-7 place-items-center text-faint" aria-hidden><ArrowLeft size={15} /></span>
        <span className="grid size-7 place-items-center text-faint" aria-hidden><ArrowRight size={15} /></span>
        <button
          type="button"
          aria-label="Reload"
          onClick={() => setSpin((s) => s + 1)}
          className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface-hover hover:text-fg"
        >
          <RotateCw size={14} style={{ transform: `rotate(${spin * 360}deg)`, transition: "transform .6s" }} />
        </button>
        <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-surface-2 px-3 text-[13px]">
          <Lock size={12} className="shrink-0 text-success" />
          <span className="truncate text-muted">
            ck://<span className="text-fg">{profile.handle}</span>/links
          </span>
          <Star size={13} className="ml-auto shrink-0 fill-gold text-gold" aria-hidden />
        </div>
      </div>

      {/* Page */}
      <div className="min-h-0 flex-1 bg-bg-2/40">
        <Scroll>
          <div key={spin} className="mx-auto flex max-w-xl flex-col items-center gap-6 px-5 py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar profile={profile} size={84} />
              <div>
                <h1 className="text-xl font-semibold text-fg">{profile.name}</h1>
                <p className="text-sm text-muted">{profile.shortBio || profile.title}</p>
              </div>
            </div>
            {socials.length === 0 ? (
              <div className="h-48 w-full">
                <EmptyState title="No links yet">Socials will appear here soon.</EmptyState>
              </div>
            ) : (
              <ul className="flex w-full flex-col gap-2.5">
                {socials.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="group flex items-center gap-4 rounded-2xl border border-line bg-surface-solid p-4 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-glow"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-fg ring-1 ring-line">
                        <SocialIcon platform={s.platform} size={22} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-fg">{s.platform}</span>
                        <span className="block truncate text-xs text-muted">
                          {s.handle || prettyUrl(s.url)}
                          {s.description ? ` — ${s.description}` : ""}
                        </span>
                      </span>
                      <ArrowUpRight size={18} className="shrink-0 text-faint transition group-hover:text-accent" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <p className="pt-4 font-mono text-[11px] text-faint">served from the moon · 0 trackers</p>
          </div>
        </Scroll>
      </div>
    </div>
  );
}
