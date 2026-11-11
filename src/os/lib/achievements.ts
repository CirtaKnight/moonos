export type AchievementGroup = "explore" | "secrets" | "terminal" | "games";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  group: AchievementGroup;
  /** Hidden until unlocked (shown as "???"). */
  secret?: boolean;
  /** Game app id, for per-game sections. */
  game?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "moonrise", title: "Moonrise", description: "Boot MoonOS for the first time.", group: "explore" },
  { id: "explorer", title: "Explorer", description: "Open 5 different apps.", group: "explore" },
  { id: "completionist", title: "Completionist", description: "Open every app in the start menu.", group: "explore" },
  { id: "power-cycle", title: "Power cycle", description: "Shut down MoonOS and power it back on.", group: "explore" },
  { id: "night-owl", title: "Night owl", description: "Visit between midnight and 5 a.m.", group: "secrets", secret: true },
  { id: "full-moon", title: "Lunatic", description: "Visit during a full moon.", group: "secrets", secret: true },
  { id: "konami", title: "Old school", description: "Enter the Konami code on the desktop.", group: "secrets", secret: true },
  { id: "one-small-step", title: "One small step", description: "Zoom out of the Map until you can reach the moon.", group: "secrets", secret: true },
  { id: "inspector", title: "Inspector", description: "Try to inspect the moon.", group: "secrets", secret: true },
  { id: "terminal-regular", title: "Terminal regular", description: "Run 10 terminal commands.", group: "terminal" },
  { id: "hire-me", title: "Excellent decision", description: "Run `sudo hire-me`.", group: "terminal" },
  { id: "nice-try", title: "Nice try", description: "Attempt to delete everything.", group: "terminal", secret: true },
  { id: "moonwalk", title: "Moonwalker", description: "Find the hidden dance command.", group: "terminal", secret: true },
  { id: "drift-50", title: "Stargazer", description: "Score 50 in Lunar Drift.", group: "games", game: "game" },
  { id: "drift-150", title: "Star hoarder", description: "Score 150 in Lunar Drift.", group: "games", game: "game" },
  { id: "moonword-solve", title: "Wordsmith", description: "Solve a daily Moonword.", group: "games", game: "moonword" },
  { id: "moonword-3", title: "Mind reader", description: "Solve Moonword in 3 guesses or fewer.", group: "games", game: "moonword" },
  { id: "moonword-streak", title: "Lunar cycle", description: "Solve Moonword 3 days in a row.", group: "games", game: "moonword" },
  { id: "keystroke-60", title: "Fast fingers", description: "Reach 60 WPM in Keystroke.", group: "games", game: "keystroke" },
  { id: "keystroke-perfect", title: "Zero bugs", description: "Finish a Keystroke snippet with 100% accuracy.", group: "games", game: "keystroke" },
  { id: "memory-18", title: "Total recall", description: "Clear Phase memory in 18 moves or fewer.", group: "games", game: "memory" },
  { id: "orbit-30", title: "Stable orbit", description: "Survive 30 seconds in Orbit.", group: "games", game: "orbit" },
];

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);
