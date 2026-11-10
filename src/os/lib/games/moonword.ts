import { seeded } from "../pointer";

/**
 * Moonword — an original daily word game with developer & space vocabulary.
 * Everyone gets the same word on the same (UTC) day.
 */

const RAW = `
array cache stack queue orbit lunar comet stars space pixel debug merge class async await fetch parse token
route proxy react linux shell bytes float const while break yield scope clone patch index query table input
fiber mutex logic graph nodes edges heaps regex lexer macro model train layer agent crash catch throw error
print loops split slice shift chars venus earth pluto titan moons solar flare astro rover probe light night
tidal phase polar ozone radar laser atoms quark boson helix prism waves mouse modem cyber admin login email
virus robot chips board power watts volts ascii octet unity rails swift scala julia cobol basic excel sheet
chmod mkdir touch nginx redis mongo spark flask babel mocha agile scrum story build tests specs stage drive
disks files paths users group owner mount boots reset abort retry sleep timer clock event hooks state store
props slots views modal frame embed label title style fonts color theme grids media width depth alpha gamma
delta sigma omega tuple union never infer typed proto super inner outer local trace dumps level audit nonce
vault guard proof block chain miner peers relay pings ports posts craft forge pilot cargo deque trait enums
`;

export const ANSWERS: string[] = [...new Set(RAW.trim().split(/\s+/).map((w) => w.toUpperCase()))].filter((w) => /^[A-Z]{5}$/.test(w));

// Deterministic shuffle so consecutive days don't walk the list alphabetically.
const ORDER = (() => {
  const rand = seeded(20261110);
  const a = [...ANSWERS];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
})();

const EPOCH = Date.UTC(2026, 0, 1);

/** Puzzle number for a date (1-based), counted in UTC days since the launch epoch. */
export function puzzleNumber(date: Date): number {
  return Math.floor((date.getTime() - EPOCH) / 86_400_000) + 1;
}

export function dailyWord(date: Date): string {
  const n = puzzleNumber(date);
  return ORDER[(((n - 1) % ORDER.length) + ORDER.length) % ORDER.length];
}

export type Mark = "hit" | "near" | "miss";

/** Two-pass evaluation so repeated letters are only marked as many times as they occur. */
export function evaluate(guess: string, answer: string): Mark[] {
  const g = guess.toUpperCase().split("");
  const a = answer.toUpperCase().split("");
  const marks: Mark[] = Array(g.length).fill("miss");
  const remaining: Record<string, number> = {};
  g.forEach((ch, i) => {
    if (ch === a[i]) marks[i] = "hit";
    else remaining[a[i]] = (remaining[a[i]] ?? 0) + 1;
  });
  g.forEach((ch, i) => {
    if (marks[i] === "hit") return;
    if (remaining[ch]) {
      marks[i] = "near";
      remaining[ch]--;
    }
  });
  return marks;
}

/** Best known mark per letter, for colouring the on-screen keyboard. */
export function keyboardMarks(guesses: string[], answer: string): Record<string, Mark> {
  const rank: Record<Mark, number> = { miss: 0, near: 1, hit: 2 };
  const out: Record<string, Mark> = {};
  for (const guess of guesses) {
    evaluate(guess, answer).forEach((m, i) => {
      const ch = guess[i].toUpperCase();
      if (!out[ch] || rank[m] > rank[out[ch]]) out[ch] = m;
    });
  }
  return out;
}

export const isValidGuess = (w: string) => /^[A-Za-z]{5}$/.test(w);

const EMOJI: Record<Mark, string> = { hit: "🌕", near: "🌓", miss: "🌑" };

export function shareText(n: number, guesses: string[], answer: string, won: boolean): string {
  const rows = guesses.map((g) => evaluate(g, answer).map((m) => EMOJI[m]).join(""));
  return `Moonword #${n} ${won ? guesses.length : "X"}/6\n${rows.join("\n")}`;
}

export interface MoonwordStats {
  played: number;
  wins: number;
  streak: number;
  maxStreak: number;
  lastWin: number | null;
  dist: number[];
}

export const emptyStats = (): MoonwordStats => ({ played: 0, wins: 0, streak: 0, maxStreak: 0, lastWin: null, dist: [0, 0, 0, 0, 0, 0] });

/** Update stats after finishing puzzle `n`; streaks only continue on consecutive days. */
export function recordResult(stats: MoonwordStats, n: number, won: boolean, tries: number): MoonwordStats {
  const s = { ...stats, dist: [...stats.dist], played: stats.played + 1 };
  if (won) {
    s.wins++;
    s.streak = stats.lastWin === n - 1 ? stats.streak + 1 : 1;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
    s.lastWin = n;
    s.dist[tries - 1]++;
  } else {
    s.streak = 0;
  }
  return s;
}
