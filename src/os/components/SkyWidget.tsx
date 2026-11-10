"use client";

import { CalendarDays, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useContent } from "../content/ContentProvider";
import { useNow } from "../hooks";
import { relativeDay, splitTimeline } from "../lib/agenda";
import { moonIllumination, moonPhase, moonPhaseName } from "../lib/moon";
import { useSettings } from "../store/settings";
import { MoonGlyph } from "./MoonGlyph";
import { MENUBAR_H } from "./Shell";

interface Weather {
  temp: number;
  code: number;
  isDay: boolean;
}

/** WMO weather code → icon + label (https://open-meteo.com/en/docs). */
function describe(code: number) {
  if (code === 0) return { icon: Sun, label: "Clear" };
  if (code <= 2) return { icon: CloudSun, label: "Partly cloudy" };
  if (code === 3) return { icon: Cloud, label: "Overcast" };
  if (code <= 48) return { icon: CloudFog, label: "Fog" };
  if (code <= 57) return { icon: CloudDrizzle, label: "Drizzle" };
  if (code <= 67 || (code >= 80 && code <= 82)) return { icon: CloudRain, label: "Rain" };
  if (code <= 77 || code === 85 || code === 86) return { icon: CloudSnow, label: "Snow" };
  return { icon: CloudLightning, label: "Storm" };
}

/** Desktop widget: tonight's moon, plus live weather when a city is set in the admin. */
export function SkyWidget() {
  const { settings, events } = useContent();
  const city = settings.weatherCity;
  const now = useNow(60_000);
  const layout = useSettings((s) => s.layout);
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    if (!city) return;
    const ctrl = new AbortController();
    const load = () =>
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code,is_day`,
        { signal: ctrl.signal },
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.current) setWeather({ temp: d.current.temperature_2m, code: d.current.weather_code, isDay: d.current.is_day === 1 });
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 15 * 60_000);
    return () => {
      ctrl.abort();
      clearInterval(id);
    };
  }, [city]);

  if (!now) return null;
  const phase = moonPhase(now);
  const w = weather ? describe(weather.code) : null;
  const next = splitTimeline(events, now).upcoming[0];

  return (
    <aside
      aria-label="Sky"
      style={{ top: (layout === "dock" ? MENUBAR_H : 0) + 16 }}
      className="glass pointer-events-none absolute right-4 hidden w-56 flex-col gap-3 rounded-2xl border border-line p-4 shadow-window select-none lg:flex"
    >
      <div className="flex items-center gap-3">
        <MoonGlyph phase={phase} size={44} className="text-fg" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{moonPhaseName(phase)}</p>
          <p className="text-xs text-muted">{Math.round(moonIllumination(phase) * 100)}% illuminated</p>
        </div>
      </div>
      {city && w && weather && (
        <div className="flex items-center gap-3 border-t border-line pt-3">
          <w.icon size={28} strokeWidth={1.5} className="text-accent" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">
              {Math.round(weather.temp)}° <span className="font-normal text-muted">{w.label}</span>
            </p>
            <p className="truncate text-xs text-muted">{city.name}</p>
          </div>
        </div>
      )}
      {next && (
        <div className="flex items-center gap-3 border-t border-line pt-3">
          <CalendarDays size={22} strokeWidth={1.5} className="shrink-0 text-[#f0c987]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-fg">{next.title}</p>
            <p className="text-xs text-muted">Next up · {relativeDay(next.start, now)}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
