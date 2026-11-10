"use client";

import { motion } from "motion/react";

/**
 * The CirtaKnight mark: a crescent that doubles as the "C", with a single star
 * resting in its curve. Drawn as strokes so it can be "inked" in during boot.
 */
export function LogoMark({
  size = 96,
  animate = false,
  className,
}: {
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  // Crescent: outer arc of r=40 and inner arc of r=32 offset to the right.
  const crescent =
    "M 66 18 A 40 40 0 1 0 66 82 A 32 32 0 1 1 66 18 Z";
  const draw = animate
    ? {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration: 1.4, ease: [0.65, 0, 0.35, 1] as const },
      }
    : {};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id="ck-moon" x1="10" y1="10" x2="90" y2="90">
          <stop offset="0" stopColor="var(--text)" />
          <stop offset="1" stopColor="var(--accent-strong)" />
        </linearGradient>
      </defs>
      <motion.path
        d={crescent}
        stroke="url(#ck-moon)"
        strokeWidth={2.2}
        strokeLinejoin="round"
        {...draw}
      />
      <motion.path
        d={crescent}
        fill="url(#ck-moon)"
        initial={animate ? { opacity: 0 } : undefined}
        animate={animate ? { opacity: 0.16 } : undefined}
        style={animate ? undefined : { opacity: 0.16 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      />
      {/* Four-point star in the crescent's hollow */}
      <motion.path
        d="M 49 50 L 53 41 L 57 50 L 53 59 Z M 44 50 L 53 46.5 L 62 50 L 53 53.5 Z"
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
      Cirta<span className="text-accent">Knight</span>
    </span>
  );
}
