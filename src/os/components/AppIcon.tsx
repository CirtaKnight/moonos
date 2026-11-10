import type { LucideIcon } from "lucide-react";

/**
 * App tile: a midnight glass square with a tinted glyph and a faint top highlight.
 * One recipe for every app keeps the desktop calm; the tint carries identity.
 */
export function AppIcon({
  icon: Icon,
  tint,
  size = 48,
  className,
}: {
  icon: LucideIcon;
  tint: string;
  size?: number;
  className?: string;
}) {
  const radius = Math.round(size * 0.26);
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(160deg, color-mix(in oklab, ${tint} 30%, #1a2030) 0%, #0d111b 100%)`,
        boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.14), inset 0 0 0 1px rgb(255 255 255 / 0.06), 0 6px 16px -6px rgb(0 0 0 / 0.6)`,
      }}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: "linear-gradient(180deg, rgb(255 255 255 / 0.07), transparent)" }}
      />
      <Icon size={Math.round(size * 0.5)} strokeWidth={1.6} color={tint} />
    </span>
  );
}

/** Project folder icon; the tab and a thin band take the project's color. */
export function FolderIcon({ color = "#8ea7dc", size = 48 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={`fb-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3246" />
          <stop offset="1" stopColor="#151a27" />
        </linearGradient>
      </defs>
      <path d="M5 13a4 4 0 0 1 4-4h9.2a3 3 0 0 1 2.1.9L23 12.5h16a4 4 0 0 1 4 4V17H5z" fill={color} opacity="0.85" />
      <rect x="5" y="15" width="38" height="25" rx="4" fill={`url(#fb-${color})`} />
      <rect x="5" y="15" width="38" height="25" rx="4" fill="none" stroke="rgb(255 255 255 / 0.12)" />
      <rect x="11" y="33" width="14" height="2" rx="1" fill={color} opacity="0.9" />
    </svg>
  );
}

/** A plain-text document icon (Welcome.txt, notes). */
export function DocIcon({ size = 48, label = "TXT" }: { size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="shrink-0">
      <path d="M12 5h17l9 9v27a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="#e9ecf3" />
      <path d="M29 5v7a2 2 0 0 0 2 2h7" fill="#bccbeb" />
      <rect x="15" y="20" width="16" height="1.6" rx=".8" fill="#8c94a8" />
      <rect x="15" y="24.5" width="18" height="1.6" rx=".8" fill="#8c94a8" />
      <rect x="15" y="29" width="12" height="1.6" rx=".8" fill="#8c94a8" />
      <text x="24" y="39.5" textAnchor="middle" fontSize="6.5" fontFamily="var(--font-mono)" fontWeight="700" fill="#3b5894">
        {label}
      </text>
    </svg>
  );
}
