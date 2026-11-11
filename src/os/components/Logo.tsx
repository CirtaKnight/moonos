"use client";

import { motion } from "motion/react";
import { useId } from "react";

/** Crescent: outer arc r=40 (centre 42,50) and inner arc r=32; together they draw the "C". */
const CRESCENT = "M 66 18 A 40 40 0 1 0 66 82 A 32 32 0 1 1 66 18 Z";
/** Four-point star resting in the crescent's hollow. */
const STAR = "M 49 50 L 53 41 L 57 50 L 53 59 Z M 44 50 L 53 46.5 L 62 50 L 53 53.5 Z";
/**
 * The ink spans x 2–66 and y 10–90, so the viewBox is centred on the ink (x 34, y 50),
 * not on a 100×100 square. Otherwise the mark sits visibly left of centre in its box.
 */
const VIEWBOX = "-6 6 80 88";

/**
 * The MoonOS mark: a crescent that doubles as the "C", with a single star in its curve.
 * - `line` (default): hairline strokes, "inked" in during boot; for large sizes.
 * - `glyph`: solid silver crescent + gold star; for the start button and other small sizes,
 *   where a hairline would be the faintest thing on screen.
 */
export function LogoMark({
  size = 96,
  animate = false,
  variant = "line",
  className,
}: {
  size?: number;
  animate?: boolean;
  variant?: "line" | "glyph";
  className?: string;
}) {
  const gid = `ck-moon-${useId().replace(/:/g, "")}`;

  if (variant === "glyph") {
    return (
      <svg width={size} height={size} viewBox={VIEWBOX} aria-hidden className={className}>
        <defs>
          <linearGradient id={gid} x1="10" y1="10" x2="66" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#f3f5fa" />
            <stop offset="1" stopColor="#aebcdc" />
          </linearGradient>
        </defs>
        <path d={CRESCENT} fill={`url(#${gid})`} />
        <path d={STAR} fill="var(--gold)" />
      </svg>
    );
  }

  const draw = animate
    ? {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration: 1.4, ease: [0.65, 0, 0.35, 1] as const },
      }
    : {};

  return (
    <svg width={size} height={size} viewBox={VIEWBOX} fill="none" aria-hidden className={className}>
      <defs>
        <linearGradient id={gid} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--text)" />
          <stop offset="1" stopColor="var(--accent-strong)" />
        </linearGradient>
      </defs>
      <motion.path d={CRESCENT} stroke={`url(#${gid})`} strokeWidth={2.2} strokeLinejoin="round" {...draw} />
      <motion.path
        d={CRESCENT}
        fill={`url(#${gid})`}
        initial={animate ? { opacity: 0 } : undefined}
        animate={animate ? { opacity: 0.16 } : undefined}
        style={animate ? undefined : { opacity: 0.16 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      />
      <motion.path
        d={STAR}
        fill="var(--gold)"
        initial={animate ? { opacity: 0, scale: 0.4 } : undefined}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        transition={{ delay: 1.2, duration: 0.6, ease: "backOut" }}
        style={{ transformOrigin: "53px 50px" }}
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`font-display tracking-[0.32em] uppercase ${className ?? ""}`}>
      Moon<span className="text-accent">OS</span>
    </span>
  );
}
