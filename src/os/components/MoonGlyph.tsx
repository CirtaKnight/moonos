/**
 * Draws the moon at a given phase (0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter).
 * The lit part is the union of a half disc and an ellipse whose width follows the phase.
 */
export function MoonGlyph({
  phase,
  size = 24,
  className,
  title,
}: {
  phase: number;
  size?: number;
  className?: string;
  title?: string;
}) {
  const p = ((phase % 1) + 1) % 1;
  const r = 10;
  const c = 12;
  // Terminator ellipse x-radius: r at new/full, 0 at quarters.
  const rx = Math.abs(Math.cos(p * 2 * Math.PI)) * r;
  const waxing = p < 0.5;
  // Lit half: right side while waxing, left side while waning.
  const litSweep = waxing ? 1 : 0;
  // Gibbous (more than half lit) → terminator bulges into the dark side.
  const gibbous = p > 0.25 && p < 0.75;
  const termSweep = waxing === gibbous ? 1 : 0;
  const d = `M ${c} ${c - r} A ${r} ${r} 0 0 ${litSweep} ${c} ${c + r} A ${rx} ${r} 0 0 ${termSweep} ${c} ${c - r} Z`;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle cx={c} cy={c} r={r} fill="currentColor" opacity={0.14} />
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={0.8} />
      {p > 0.01 && p < 0.99 && <path d={d} fill="currentColor" />}
    </svg>
  );
}
