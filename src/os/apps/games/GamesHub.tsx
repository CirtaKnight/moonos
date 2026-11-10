"use client";

import { Trophy } from "lucide-react";
import { AppIcon } from "../../components/AppIcon";
import { ACHIEVEMENTS } from "../../lib/achievements";
import { puzzleNumber } from "../../lib/games/moonword";
import { readJSON } from "../../lib/storage";
import { useAchievements } from "../../store/achievements";
import { openApp } from "../launch";
import { apps, type AppId } from "../registry";
import type { AppProps } from "../types";
import { Scroll } from "../ui";

const GAMES: { id: AppId; blurb: string; best: () => string | null }[] = [
  { id: "moonword", blurb: "Today's 5-letter developer & space word.", best: () => {
    const s = readJSON<{ n?: number; status?: string } | null>("moonword-state", null);
    return s?.n === puzzleNumber(new Date()) && s.status !== "playing" ? (s.status === "won" ? "Solved today" : "Try again tomorrow") : "New puzzle today";
  } },
  { id: "game", blurb: "Catch the stardust, dodge the meteors.", best: () => (readJSON("ck-lunar-drift-best", 0) ? `Best ${readJSON("ck-lunar-drift-best", 0)}` : null) },
  { id: "keystroke", blurb: "Type real code. How fast are your fingers?", best: () => (readJSON("keystroke-best", 0) ? `Best ${readJSON("keystroke-best", 0)} WPM` : null) },
  { id: "memory", blurb: "Match the moon phases and stars.", best: () => (readJSON<number | null>("memory-best", null) ? `Best ${readJSON("memory-best", 0)} moves` : null) },
  { id: "orbit", blurb: "One tap to hop rings. Stay in orbit.", best: () => (readJSON("orbit-best", 0) ? `Best ${readJSON("orbit-best", 0)}s` : null) },
];

/** The Games folder: every original MoonOS game with best scores and trophies. */
export function GamesHub(_props: AppProps) {
  void _props;
  const unlocked = useAchievements((s) => s.unlocked);
  return (
    <Scroll className="p-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {GAMES.map((g) => {
          const app = apps[g.id];
          const trophies = ACHIEVEMENTS.filter((a) => a.game === g.id);
          const got = trophies.filter((a) => unlocked[a.id]).length;
          const best = g.best();
          return (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => openApp(g.id)}
                className="flex w-full items-start gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/50"
              >
                <AppIcon icon={app.icon} tint={app.tint} size={48} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{app.name}</span>
                  <span className="block text-xs text-muted">{g.blurb}</span>
                  <span className="mt-2 flex items-center gap-3 text-[11px] text-faint">
                    {best && <span>{best}</span>}
                    {trophies.length > 0 && (
                      <span className={`inline-flex items-center gap-1 ${got ? "text-gold" : ""}`}>
                        <Trophy size={11} /> {got}/{trophies.length}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Scroll>
  );
}
