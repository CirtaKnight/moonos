"use client";

import { ArrowUpRight, Flame, GitCommitHorizontal, Star, Trophy } from "lucide-react";
import { HeatmapLegend, MoonHeatmap } from "../components/MoonHeatmap";
import { useContent } from "../content/ContentProvider";
import { contributionStats, timeAgo } from "../lib/github";
import { githubUser } from "../lib/links";
import type { AppProps } from "./types";
import { EmptyState, Scroll, SectionTitle } from "./ui";

/** GitHub activity: a year of contributions in moon phases, plus the latest events. */
export function Activity(_props: AppProps) {
  void _props;
  const content = useContent();
  const { contributions, activity } = content;
  const user = githubUser(content);
  const stats = contributionStats(contributions, new Date().toISOString().slice(0, 10));

  if (!contributions.length && !activity.length) {
    return <EmptyState title="The sky is quiet">GitHub activity couldn&apos;t be loaded right now. Check back in a little while.</EmptyState>;
  }

  return (
    <Scroll className="p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">{stats.total.toLocaleString("en-GB")} contributions in the last year</h2>
          <p className="text-xs text-muted">Every day is a moon — fuller means busier.</p>
        </div>
        <a
          href={`https://github.com/${user}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs text-fg hover:border-accent/60"
        >
          @{user} on GitHub <ArrowUpRight size={12} />
        </a>
      </div>

      {contributions.length > 0 && (
        <>
          <div className="scroll-area overflow-x-auto pb-2">
            <MoonHeatmap days={contributions} />
          </div>
          <div className="mt-1 flex justify-end">
            <HeatmapLegend />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: Flame, label: "Current streak", value: `${stats.current} day${stats.current === 1 ? "" : "s"}` },
              { icon: Trophy, label: "Longest streak", value: `${stats.longest} day${stats.longest === 1 ? "" : "s"}` },
              { icon: Star, label: "Active days", value: String(stats.activeDays) },
              {
                icon: GitCommitHorizontal,
                label: "Busiest day",
                value: stats.busiest ? `${stats.busiest.count} on ${new Date(`${stats.busiest.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}` : "—",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-line bg-surface-2 p-3">
                <dt className="flex items-center gap-1.5 text-[11px] text-muted">
                  <Icon size={12} /> {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {activity.length > 0 && (
        <section className="mt-6">
          <SectionTitle>Latest</SectionTitle>
          <ul className="flex flex-col">
            {activity.slice(0, 12).map((a) => (
              <li key={a.id}>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-baseline gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-hover">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-fg">{a.title}</span>
                    {a.body && <span className="block truncate text-xs text-muted">{a.body}</span>}
                  </span>
                  <span className="shrink-0 text-[11px] text-faint">{timeAgo(a.at)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Scroll>
  );
}
