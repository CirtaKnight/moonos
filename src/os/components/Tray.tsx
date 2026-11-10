"use client";

import { Bell, Moon, Search, Sun } from "lucide-react";
import { useNow } from "../hooks";
import { moonIllumination, moonPhase, moonPhaseName } from "../lib/moon";
import { useSettings } from "../store/settings";
import { useUI } from "../store/ui";
import { MoonGlyph } from "./MoonGlyph";

export function Clock({ stacked = false }: { stacked?: boolean }) {
  const now = useNow(1000);
  if (!now) return <span className="w-16" />;
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  if (stacked)
    return (
      <span className="flex flex-col items-end text-[11px] leading-tight tabular-nums">
        <span className="font-medium text-fg">{time}</span>
        <span className="text-muted">{date}</span>
      </span>
    );
  return (
    <span className="text-[12.5px] tabular-nums">
      <span className="text-muted">{date}</span>
      <span className="ml-2 font-medium">{time}</span>
    </span>
  );
}

/** Today's real moon phase. */
export function MoonIndicator() {
  const now = useNow(60_000);
  if (!now) return <span className="size-4" />;
  const phase = moonPhase(now);
  const label = `${moonPhaseName(phase)} · ${Math.round(moonIllumination(phase) * 100)}% lit`;
  return (
    <span title={label} className="grid place-items-center text-fg" aria-label={label} role="img">
      <MoonGlyph phase={phase} size={16} />
    </span>
  );
}

export function TrayButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`grid h-7 min-w-7 place-items-center rounded-md px-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-fg ${
        active ? "bg-surface-hover text-fg" : ""
      }`}
    >
      {children}
    </button>
  );
}

/** Search, theme, notifications — shared by the menu bar and the taskbar. */
export function TrayActions() {
  const panel = useUI((s) => s.panel);
  const togglePanel = useUI((s) => s.togglePanel);
  const theme = useSettings((s) => s.theme);
  const toggleTheme = useSettings((s) => s.toggleTheme);
  return (
    <>
      <TrayButton label="Search (Ctrl+K)" onClick={() => togglePanel("search")} active={panel === "search"}>
        <Search size={15} />
      </TrayButton>
      <TrayButton label={theme === "night" ? "Switch to Day" : "Switch to Night"} onClick={toggleTheme}>
        {theme === "night" ? <Moon size={15} /> : <Sun size={15} />}
      </TrayButton>
      <TrayButton label="Notifications" onClick={() => togglePanel("notifications")} active={panel === "notifications"}>
        <Bell size={15} />
      </TrayButton>
    </>
  );
}
