import { FolderGlyph, NoteGlyph, type Glyph } from "./AppGlyphs";

const GLYPH_SILVER = "#e3e8f3";

/**
 * The MoonOS tile: one midnight squircle for every app, lit from the upper left with a soft
 * terminator toward the lower right, so each tile reads as a faint moon phase. The app's
 * family (silver = system, blue = work, gold = play) only shows as a low glow in the corner;
 * identity comes from the glyph's shape.
 */
export function AppIcon({
  icon: Icon,
  tint,
  size = 48,
  className,
}: {
  icon: Glyph;
  tint: string;
  size?: number;
  className?: string;
}) {
  const radius = Math.round(size * 0.27);
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: [
          "radial-gradient(130% 110% at 16% 6%, rgb(233 236 243 / 0.17) 0%, rgb(233 236 243 / 0.05) 36%, transparent 60%)",
          `radial-gradient(85% 70% at 92% 112%, color-mix(in oklab, ${tint} 38%, transparent), transparent 72%)`,
          "linear-gradient(165deg, #1a2133 0%, #0c101b 100%)",
        ].join(", "),
        boxShadow:
          "inset 0 1px 0 rgb(255 255 255 / 0.13), inset 0 0 0 1px rgb(255 255 255 / 0.06), 0 6px 16px -6px rgb(0 0 0 / 0.6)",
      }}
      aria-hidden
    >
      {/* Terminator: the shadowed side of the phase */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 120% at 88% 92%, rgb(3 4 9 / 0.38), transparent 55%)" }}
      />
      <Icon size={Math.round(size * 0.56)} strokeWidth={size <= 30 ? 1.75 : 1.5} color={GLYPH_SILVER} className="relative" />
    </span>
  );
}

/** A project folder: the shared tile + folder glyph, glowing in the project's colour. */
export function FolderIcon({ color = "#8ea7dc", size = 48 }: { color?: string; size?: number }) {
  return <AppIcon icon={FolderGlyph} tint={color} size={size} />;
}

/** A plain-text document (Welcome.txt, notes). `label` is kept for API compatibility. */
export function DocIcon({ size = 48 }: { size?: number; label?: string }) {
  return <AppIcon icon={NoteGlyph} tint="#bccbeb" size={size} />;
}
