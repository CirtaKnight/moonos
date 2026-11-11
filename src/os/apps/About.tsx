"use client";

import { Globe, GraduationCap, Mail, MapPin, ScrollText } from "lucide-react";
import { Avatar } from "../components/Avatar";
import { MoonHeatmap } from "../components/MoonHeatmap";
import { range } from "../lib/pins";
import { useContent } from "../content/ContentProvider";
import { openApp } from "./launch";
import type { AppProps } from "./types";
import { Button, Scroll, SectionTitle, Tag } from "./ui";

/** "About me" — opened from the profile card in the start menu. */
export function About(_props: AppProps) {
  void _props;
  const { profile, experiences, contributions } = useContent();
  return (
    <Scroll>
      <div className="grid gap-0 sm:grid-cols-[240px_1fr]">
        <aside className="flex flex-col items-center gap-3 border-b border-line bg-surface-2 p-6 text-center sm:border-r sm:border-b-0">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-accent/15 blur-xl" aria-hidden />
            <div className="relative">
              <Avatar profile={profile} size={112} />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-fg">{profile.name}</h1>
            <p className="text-sm text-muted">{profile.title}</p>
          </div>
          {profile.location && (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <MapPin size={13} /> {profile.location}
            </p>
          )}
          {profile.available && (
            <p className="flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs text-success">
              <span className="size-1.5 animate-pulse rounded-full bg-success" /> Open to opportunities
            </p>
          )}
          <div className="mt-2 flex w-full flex-col gap-2">
            <Button variant="primary" icon={Mail} onClick={() => openApp("mail")}>Contact me</Button>
            <Button icon={ScrollText} onClick={() => openApp("cv")}>Résumé</Button>
            <Button icon={Globe} onClick={() => openApp("browser")}>Find me online</Button>
          </div>
        </aside>

        <div className="flex flex-col gap-7 p-6">
          <section>
            <SectionTitle>About</SectionTitle>
            {profile.shortBio && <p className="mb-3 text-[15px] font-medium text-fg">{profile.shortBio}</p>}
            <div className="flex flex-col gap-3 text-[14px] leading-relaxed text-fg/85">
              {profile.bio.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {experiences.length > 0 && (
            <section>
              <SectionTitle>Experience</SectionTitle>
              <ol className="flex flex-col gap-3 border-l border-line pl-4">
                {experiences.map((x) => (
                  <li key={x.id} className="relative">
                    <span className="absolute top-1 -left-[21px] size-2.5 rounded-full bg-gold ring-4 ring-bg" />
                    <p className="text-sm font-medium text-fg">
                      {x.role} <span className="text-muted">· {x.organization}</span>
                    </p>
                    <p className="text-xs text-muted">{[range(x.start, x.end, true), x.place?.name].filter(Boolean).join(" · ")}</p>
                    {x.description && <p className="mt-1 text-[13px] text-fg/85">{x.description}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {contributions.length > 0 && (
            <section>
              <SectionTitle>Coding activity</SectionTitle>
              <button type="button" onClick={() => openApp("activity")} className="scroll-area block max-w-full overflow-x-auto rounded-xl border border-line bg-surface-2 p-3 text-left transition-colors hover:border-accent/50">
                <MoonHeatmap days={contributions} weeks={26} cell={10} showMonths={false} />
                <span className="mt-2 block text-[11px] text-muted">Last 6 months on GitHub · open Activity for the full year</span>
              </button>
            </section>
          )}

          {profile.skills.length > 0 && (
            <section>
              <SectionTitle>Skills</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
            </section>
          )}

          {profile.education.length > 0 && (
            <section>
              <SectionTitle>Education</SectionTitle>
              <ol className="flex flex-col gap-3 border-l border-line pl-4">
                {profile.education.map((e, i) => (
                  <li key={i} className="relative">
                    <span className="absolute top-1 -left-[21px] grid size-2.5 place-items-center rounded-full bg-accent ring-4 ring-bg" />
                    <p className="flex items-center gap-1.5 text-sm font-medium text-fg">
                      <GraduationCap size={14} className="text-accent" /> {e.degree}
                    </p>
                    <p className="text-xs text-muted">
                      {e.school}
                      {e.period ? ` · ${e.period}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {profile.email && (
            <section>
              <SectionTitle>Email</SectionTitle>
              <a href={`mailto:${profile.email}`} className="text-sm text-accent hover:underline">
                {profile.email}
              </a>
            </section>
          )}
        </div>
      </div>
    </Scroll>
  );
}
