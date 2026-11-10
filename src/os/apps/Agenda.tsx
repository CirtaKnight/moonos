"use client";

import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, FolderOpen, List, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useContent } from "../content/ContentProvider";
import type { AgendaEvent } from "../content/types";
import { useNow } from "../hooks";
import { dayKey, eventsOn, KIND_STYLE, monthMatrix, parseDay, relativeDay, splitTimeline } from "../lib/agenda";
import { openProject } from "./launch";
import type { AppProps } from "./types";
import { EmptyState, Scroll, SectionTitle } from "./ui";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Past and upcoming projects, events and hackathons — managed from the admin. */
export function Agenda(_props: AppProps) {
  void _props;
  const { events, projects } = useContent();
  const now = useNow(60_000) ?? new Date();
  const [view, setView] = useState<"calendar" | "timeline">("timeline");
  const [cursor, setCursor] = useState(() => ({ y: now.getFullYear(), m: now.getMonth() }));
  const [selected, setSelected] = useState(() => dayKey(now));

  if (!events.length) {
    return (
      <EmptyState title="Nothing on the agenda yet" phase={0.75}>
        Projects, hackathons and events will show up here — past and upcoming.
      </EmptyState>
    );
  }

  const openRelated = (e: AgendaEvent) => {
    const p = e.projectSlug && projects.find((x) => x.slug === e.projectSlug);
    if (p) openProject(p);
    else if (e.url) window.open(e.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <div className="flex rounded-lg border border-line p-0.5">
          {(
            [
              ["timeline", List, "Timeline"],
              ["calendar", CalendarDays, "Calendar"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs ${view === id ? "bg-surface-hover text-fg" : "text-muted"}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        <div className="ml-auto hidden flex-wrap gap-2 sm:flex">
          {Object.entries(KIND_STYLE)
            .filter(([k]) => events.some((e) => e.kind === k))
            .map(([k, s]) => (
              <span key={k} className="flex items-center gap-1 text-[11px] text-muted">
                <span className="size-2 rounded-full" style={{ background: s.color }} /> {s.label}
              </span>
            ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {view === "timeline" ? (
          <Timeline events={events} today={now} onOpen={openRelated} />
        ) : (
          <Calendar
            events={events}
            today={now}
            cursor={cursor}
            setCursor={setCursor}
            selected={selected}
            setSelected={setSelected}
            onOpen={openRelated}
          />
        )}
      </div>
    </div>
  );
}

function EventCard({ e, today, onOpen }: { e: AgendaEvent; today: Date; onOpen: (e: AgendaEvent) => void }) {
  const style = KIND_STYLE[e.kind] ?? KIND_STYLE.other;
  const start = parseDay(e.start);
  const end = e.end ? parseDay(e.end) : null;
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const clickable = Boolean(e.projectSlug || e.url);
  return (
    <div className="relative flex gap-3 rounded-xl border border-line bg-surface-2 p-3.5">
      <span className="mt-1 w-1 shrink-0 self-stretch rounded-full" style={{ background: style.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h4 className="font-medium text-fg">{e.title}</h4>
          <span className="text-[11px] tracking-wide uppercase" style={{ color: style.color }}>
            {style.label}
          </span>
          <span className="ml-auto text-[11px] text-faint">{relativeDay(e.start, today)}</span>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
          <span>{end ? `${fmt(start)} → ${fmt(end)}` : fmt(start)}</span>
          {e.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} /> {e.location}
            </span>
          )}
        </p>
        {e.description && <p className="mt-1.5 text-[13px] leading-relaxed text-fg/85">{e.description}</p>}
        {clickable && (
          <button type="button" onClick={() => onOpen(e)} className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline">
            {e.projectSlug ? (
              <>
                <FolderOpen size={12} /> Open project
              </>
            ) : (
              <>
                Learn more <ArrowUpRight size={12} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function Timeline({ events, today, onOpen }: { events: AgendaEvent[]; today: Date; onOpen: (e: AgendaEvent) => void }) {
  const { upcoming, past } = useMemo(() => splitTimeline(events, today), [events, today]);
  return (
    <Scroll className="p-4">
      <section className="mb-6">
        <SectionTitle>Upcoming · {upcoming.length}</SectionTitle>
        {upcoming.length ? (
          <div className="flex flex-col gap-2">
            {upcoming.map((e) => (
              <EventCard key={e.id} e={e} today={today} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Nothing planned yet — new things are always brewing.</p>
        )}
      </section>
      {past.length > 0 && (
        <section>
          <SectionTitle>Past · {past.length}</SectionTitle>
          <div className="flex flex-col gap-2 opacity-90">
            {past.map((e) => (
              <EventCard key={e.id} e={e} today={today} onOpen={onOpen} />
            ))}
          </div>
        </section>
      )}
    </Scroll>
  );
}

function Calendar({
  events,
  today,
  cursor,
  setCursor,
  selected,
  setSelected,
  onOpen,
}: {
  events: AgendaEvent[];
  today: Date;
  cursor: { y: number; m: number };
  setCursor: (c: { y: number; m: number }) => void;
  selected: string;
  setSelected: (k: string) => void;
  onOpen: (e: AgendaEvent) => void;
}) {
  const weeks = monthMatrix(cursor.y, cursor.m);
  const todayKey = dayKey(today);
  const dayEvents = eventsOn(parseDay(selected), events);
  const shift = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };
  return (
    <div className="flex h-full flex-col md:flex-row">
      <div className="shrink-0 p-4 md:w-[56%]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-fg">
            {new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </h3>
          <div className="flex gap-1">
            <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface-hover hover:text-fg">
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setCursor({ y: today.getFullYear(), m: today.getMonth() });
                setSelected(todayKey);
              }}
              className="rounded-md px-2 text-xs text-muted hover:bg-surface-hover hover:text-fg"
            >
              Today
            </button>
            <button type="button" aria-label="Next month" onClick={() => shift(1)} className="grid size-7 place-items-center rounded-md text-muted hover:bg-surface-hover hover:text-fg">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d) => (
            <span key={d} className="pb-1 text-[10.5px] tracking-wide text-faint uppercase">
              {d}
            </span>
          ))}
          {weeks.flat().map((d) => {
            const k = dayKey(d);
            const inMonth = d.getMonth() === cursor.m;
            const evs = eventsOn(d, events);
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(k)}
                aria-pressed={selected === k}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[13px] transition-colors ${
                  selected === k ? "bg-accent/20 text-fg ring-1 ring-accent/60" : "hover:bg-surface-hover"
                } ${inMonth ? "text-fg" : "text-faint"} ${k === todayKey ? "font-bold" : ""}`}
              >
                <span className={k === todayKey ? "grid size-6 place-items-center rounded-full border border-accent" : ""}>{d.getDate()}</span>
                <span className="flex h-1.5 gap-0.5">
                  {evs.slice(0, 3).map((e) => (
                    <span key={e.id} className="size-1.5 rounded-full" style={{ background: (KIND_STYLE[e.kind] ?? KIND_STYLE.other).color }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1 border-t border-line md:border-t-0 md:border-l">
        <Scroll className="p-4">
          <SectionTitle>
            {parseDay(selected).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </SectionTitle>
          {dayEvents.length ? (
            <div className="flex flex-col gap-2">
              {dayEvents.map((e) => (
                <EventCard key={e.id} e={e} today={today} onOpen={onOpen} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">A quiet day.</p>
          )}
        </Scroll>
      </div>
    </div>
  );
}
