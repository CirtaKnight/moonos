"use client";

import { Lock, Trophy } from "lucide-react";
import { ACHIEVEMENTS, type AchievementGroup } from "../lib/achievements";
import { useAchievements } from "../store/achievements";
import type { AppProps } from "./types";
import { Scroll, SectionTitle } from "./ui";

const GROUPS: { id: AchievementGroup; label: string }[] = [
  { id: "explore", label: "Exploring" },
  { id: "terminal", label: "Terminal" },
  { id: "games", label: "Games" },
  { id: "secrets", label: "Secrets" },
];

/** Achievements & secrets. Locked secrets stay hidden as "???". */
export function Trophies(_props: AppProps) {
  void _props;
  const unlocked = useAchievements((s) => s.unlocked);
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  const secrets = ACHIEVEMENTS.filter((a) => a.secret);
  const secretsFound = secrets.filter((a) => unlocked[a.id]).length;
  const pct = Math.round((count / ACHIEVEMENTS.length) * 100);

  return (
    <Scroll className="p-5">
      <header className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-surface-2 p-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/40">
          <Trophy size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-fg">
            {count} / {ACHIEVEMENTS.length} unlocked
          </p>
          <p className="text-xs text-muted">
            {secretsFound} / {secrets.length} secrets found. Some only appear under the right moon.
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      {GROUPS.map((g) => (
        <section key={g.id} className="mb-6">
          <SectionTitle>{g.label}</SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ACHIEVEMENTS.filter((a) => a.group === g.id).map((a) => {
              const at = unlocked[a.id];
              const hidden = a.secret && !at;
              return (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    at ? "border-gold/40 bg-gold/8" : "border-line bg-surface-2 opacity-70"
                  }`}
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                      at ? "bg-gold/20 text-gold" : "bg-line text-faint"
                    }`}
                  >
                    {at ? <Trophy size={18} /> : <Lock size={16} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">{hidden ? "???" : a.title}</span>
                    <span className="block text-xs text-muted">
                      {hidden ? "A secret. Keep exploring." : a.description}
                    </span>
                    {at && (
                      <span className="block text-[10.5px] text-faint">
                        Unlocked {new Date(at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Scroll>
  );
}
