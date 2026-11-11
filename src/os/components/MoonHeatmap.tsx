import type { ContributionDay } from "../lib/github";
import { MoonGlyph } from "./MoonGlyph";

/** Activity level → moon phase: new moon (nothing) through to a full, gold moon. */
const PHASE = [0.02, 0.13, 0.25, 0.37, 0.5] as const;

function weeksOf(days: ContributionDay[]): (ContributionDay | null)[][] {
  if (!days.length) return [];
  const first = new Date(`${days[0].date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const padded: (ContributionDay | null)[] = [...Array(first).fill(null), ...days];
  const weeks: (ContributionDay | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
  return weeks;
}

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * A GitHub-style contribution calendar drawn in moon phases. `weeks` limits how many of the
 * most recent weeks are shown (the compact strip in About me uses ~26).
 */
export function MoonHeatmap({ days, cell = 12, weeks: limit, showMonths = true }: { days: ContributionDay[]; cell?: number; weeks?: number; showMonths?: boolean }) {
  let weeks = weeksOf(days);
  if (limit) weeks = weeks.slice(-limit);
  const gap = Math.max(2, Math.round(cell / 4));

  return (
    <div className="inline-flex flex-col gap-1" role="img" aria-label={`Contribution calendar: ${days.reduce((s, d) => s + d.count, 0)} contributions`}>
      {showMonths && (
        <div className="flex text-[10px] text-faint" style={{ gap }}>
          {weeks.map((w, i) => {
            const firstDay = w.find(Boolean);
            const prev = weeks[i - 1]?.find(Boolean);
            const month = firstDay ? new Date(`${firstDay.date}T00:00:00Z`).getUTCMonth() : -1;
            const newMonth = firstDay && (!prev || new Date(`${prev.date}T00:00:00Z`).getUTCMonth() !== month);
            return (
              <span key={i} className="overflow-visible whitespace-nowrap" style={{ width: cell }}>
                {newMonth ? new Date(`${firstDay!.date}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) : ""}
              </span>
            );
          })}
        </div>
      )}
      <div className="flex" style={{ gap }}>
        {weeks.map((w, i) => (
          <div key={i} className="flex flex-col" style={{ gap }}>
            {Array.from({ length: 7 }, (_, d) => {
              const day = w[d];
              if (!day) return <span key={d} style={{ width: cell, height: cell }} />;
              return (
                <span key={d} title={`${day.count} contribution${day.count === 1 ? "" : "s"} · ${fmt(day.date)}`}>
                  <MoonGlyph
                    phase={PHASE[day.level]}
                    size={cell}
                    className={day.level === 4 ? "text-gold" : day.level ? "text-[#dfe5f2]" : "text-[#5c6478]"}
                  />
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] text-faint">
      Less
      {PHASE.map((p, i) => (
        <MoonGlyph key={i} phase={p} size={11} className={i === 4 ? "text-gold" : i ? "text-[#dfe5f2]" : "text-[#5c6478]"} />
      ))}
      More
    </span>
  );
}
