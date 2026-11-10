/** Keystroke — type real code snippets as fast and accurately as you can. */

export interface Snippet {
  lang: string;
  code: string;
}

export const SNIPPETS: Snippet[] = [
  { lang: "TypeScript", code: "const debounce = (fn: () => void, ms: number) => {\n  let t: ReturnType<typeof setTimeout>;\n  return () => {\n    clearTimeout(t);\n    t = setTimeout(fn, ms);\n  };\n};" },
  { lang: "Python", code: "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a" },
  { lang: "C", code: "int sum(int *xs, int n) {\n  int s = 0;\n  for (int i = 0; i < n; i++) s += xs[i];\n  return s;\n}" },
  { lang: "SQL", code: "SELECT name, COUNT(*) AS commits\nFROM pushes\nWHERE repo = 'moonos'\nGROUP BY name\nORDER BY commits DESC;" },
  { lang: "JavaScript", code: "const phase = (d) => ((d - NEW_MOON) / 29.53) % 1;\nconsole.log(`moon: ${phase(Date.now())}`);" },
  { lang: "Rust", code: "fn main() {\n    let stars: Vec<u32> = (1..=5).collect();\n    println!(\"{:?}\", stars);\n}" },
  { lang: "Bash", code: "for f in *.log; do\n  grep -c ERROR \"$f\"\ndone | sort -n | tail -1" },
  { lang: "Java", code: "public int binarySearch(int[] a, int x) {\n  int lo = 0, hi = a.length - 1;\n  while (lo <= hi) {\n    int mid = (lo + hi) >>> 1;\n    if (a[mid] == x) return mid;\n    if (a[mid] < x) lo = mid + 1; else hi = mid - 1;\n  }\n  return -1;\n}" },
];

/** After a newline, the leading indentation of the next line is filled in automatically. */
export function autoIndent(target: string, typedLength: number): string {
  let s = "";
  let i = typedLength;
  while (i < target.length && target[i] === " ") {
    s += " ";
    i++;
  }
  return s;
}

export interface KeystrokeStats {
  wpm: number;
  accuracy: number;
  correct: number;
}

/**
 * WPM uses the standard 5-characters-per-word; only correctly typed characters count.
 * Accuracy = keystrokes that were right / all keystrokes (backspaced mistakes still count).
 */
export function computeStats(target: string, typed: string, keystrokes: number, mistakes: number, ms: number): KeystrokeStats {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++;
  const minutes = Math.max(ms, 1) / 60_000;
  return {
    wpm: Math.round(correct / 5 / minutes),
    accuracy: keystrokes ? Math.round(((keystrokes - mistakes) / keystrokes) * 100) : 100,
    correct,
  };
}
