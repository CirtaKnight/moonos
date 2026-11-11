import type { ComponentType, ReactNode, SVGProps } from "react";

/**
 * The MoonOS icon set. Every glyph is drawn on a 24-unit grid with a 1.5 stroke and round
 * joins, in moon-silver (`currentColor`) with exactly one gold detail borrowed from the
 * logo's star. Identity comes from the shape, never from colour.
 */
export interface GlyphProps {
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number | string;
}
export type Glyph = ComponentType<GlyphProps>;

const GOLD = "var(--gold)";

function glyph(name: string, body: ReactNode): Glyph {
  function G({ size = 24, className, color, strokeWidth = 1.5 }: GlyphProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color ?? "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={className}
      >
        {body}
      </svg>
    );
  }
  G.displayName = `Glyph(${name})`;
  return G;
}

/** The logo's four-point star, centred on (cx, cy), radius r. */
const star = (cx: number, cy: number, r: number, props: SVGProps<SVGPathElement> = {}) => (
  <path
    d={`M${cx} ${cy - r} L${cx + r * 0.32} ${cy - r * 0.32} L${cx + r} ${cy} L${cx + r * 0.32} ${cy + r * 0.32} L${cx} ${cy + r} L${cx - r * 0.32} ${cy + r * 0.32} L${cx - r} ${cy} L${cx - r * 0.32} ${cy - r * 0.32} Z`}
    fill={GOLD}
    stroke="none"
    {...props}
  />
);

const gold = { stroke: GOLD } as const;

/* ------------------------------------ People & work ----------------------------------- */

export const AboutGlyph = glyph(
  "about",
  <>
    <circle cx="11" cy="8.5" r="3.5" />
    <path d="M4.5 20c.6-3.6 3.3-5.8 6.5-5.8s5.9 2.2 6.5 5.8" />
    {star(18.6, 5.4, 2.4)}
  </>,
);

/** A folder whose tab carries a crescent notch. */
export const FolderGlyph = glyph(
  "folder",
  <>
    <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9.5A1.5 1.5 0 0 0 19.5 8h-7.2l-1.8-2.3a1.5 1.5 0 0 0-1.2-.6H4.5A1.5 1.5 0 0 0 3 6.6Z" />
    <path d="M14.2 12.4a2.8 2.8 0 1 0 0 4.2 2.2 2.2 0 1 1 0-4.2Z" {...gold} />
  </>,
);

/** Résumé: a folded-corner sheet, a portrait dot, and one gold rule. */
export const ResumeGlyph = glyph(
  "cv",
  <>
    <path d="M6 3.5h8.5L19 8v12a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
    <path d="M14.5 3.5V8H19" />
    <circle cx="9.5" cy="10" r="1.6" />
    <path d="M8.5 15h7" {...gold} />
    <path d="M8.5 17.8h4.5" />
  </>,
);

/** Plain text note. */
export const NoteGlyph = glyph(
  "note",
  <>
    <path d="M6 3.5h8.5L19 8v12a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
    <path d="M14.5 3.5V8H19" />
    <path d="M8.5 11.5h7M8.5 14.5h7" />
    <path d="M8.5 17.5h4" {...gold} />
  </>,
);

/** A sphere with a tilted orbit and a gold satellite. */
export const BrowserGlyph = glyph(
  "browser",
  <>
    <circle cx="12" cy="12" r="6.5" />
    <path d="M12 5.5c-2 1.8-2.8 4-2.8 6.5s.8 4.7 2.8 6.5M12 5.5c2 1.8 2.8 4 2.8 6.5s-.8 4.7-2.8 6.5M5.5 12h13" />
    <ellipse cx="12" cy="12" rx="10.5" ry="3.6" transform="rotate(-24 12 12)" strokeOpacity=".55" />
    <circle cx="20.6" cy="7.4" r="1.3" fill={GOLD} stroke="none" />
  </>,
);

/** An envelope with an arched flap and a gold seal. */
export const MailGlyph = glyph(
  "mail",
  <>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3.6 6.6C6.5 9.8 9 11.6 12 11.6s5.5-1.8 8.4-5" />
    <circle cx="12" cy="13.6" r="1.4" fill={GOLD} stroke="none" />
  </>,
);

/** Calendar whose "today" cell is a moon-phase dot. */
export const AgendaGlyph = glyph(
  "agenda",
  <>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    <path d="M7.5 13h.01M11 13h.01M7.5 16.5h.01M11 16.5h.01M14.5 16.5h.01" strokeWidth="2" />
    <path d="M15.8 11.5a1.9 1.9 0 1 1 0 3.8a1.4 1.4 0 0 0 0-3.8Z" fill={GOLD} stroke="none" />
  </>,
);

/** Gallery: a frame, a horizon and a gold moon. */
export const GalleryGlyph = glyph(
  "gallery",
  <>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M3.5 16.5l5-4.5 3.5 3 3-2.5 5.5 4.5" />
    <circle cx="16" cy="9" r="2" fill={GOLD} stroke="none" />
  </>,
);

/** Videos: a frame with a gold play wedge. */
export const VideosGlyph = glyph(
  "videos",
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3 8.5h18" strokeOpacity=".55" />
    <path d="M10.2 11.2v5.1l4.4-2.55Z" fill={GOLD} stroke={GOLD} strokeWidth="1" />
  </>,
);

/** Viewer: a lens over a frame corner. */
export const ViewerGlyph = glyph(
  "viewer",
  <>
    <path d="M3.5 14V6a2 2 0 0 1 2-2H16" />
    <circle cx="13.5" cy="13.5" r="5" />
    <path d="M17.2 17.2L20.5 20.5" />
    <path d="M11.3 11.8a2.6 2.6 0 0 1 2.4-1.2" {...gold} />
  </>,
);

/** Map: a folded map with a gold pin. */
export const MapGlyph = glyph(
  "map",
  <>
    <path d="M3.5 6.5l5-2 7 2.5 5-2v13l-5 2-7-2.5-5 2Z" />
    <path d="M8.5 4.5v13M15.5 7v13" strokeOpacity=".55" />
    <path d="M15.5 6.2c0 2.3-2.6 4.9-2.6 4.9s-2.6-2.6-2.6-4.9a2.6 2.6 0 0 1 5.2 0Z" fill={GOLD} stroke={GOLD} strokeWidth="1" />
    <circle cx="12.9" cy="6.2" r=".9" fill="#1a1406" stroke="none" />
  </>,
);

/** Konshu: a speech bubble holding the crescent. */
export const KonshuGlyph = glyph(
  "konshu",
  <>
    <path d="M5 4.5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7.5L7 21v-3.5H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
    <path d="M13.6 7.6a3.6 3.6 0 1 0 0 6.3 2.9 2.9 0 1 1 0-6.3Z" fill={GOLD} stroke="none" />
  </>,
);

/** Skills: a small constellation, one star in gold. */
export const SkillsGlyph = glyph(
  "skills",
  <>
    <path d="M5 17.5L9.5 9 15 12.5 19 5.5" strokeOpacity=".55" />
    <circle cx="5" cy="17.5" r="1.6" fill="currentColor" />
    <circle cx="9.5" cy="9" r="1.6" fill="currentColor" />
    <circle cx="19" cy="5.5" r="1.6" fill="currentColor" />
    {star(15, 12.5, 3)}
  </>,
);

/** Activity: a row of waxing moons, the last one full and gold. */
export const ActivityGlyph = glyph(
  "activity",
  <>
    <circle cx="5" cy="12" r="2.6" strokeOpacity=".55" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M12 9.4a2.6 2.6 0 0 1 0 5.2Z" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="2.6" fill={GOLD} stroke={GOLD} />
    <path d="M3 18.5h18" strokeOpacity=".4" />
  </>,
);

/* --------------------------------------- System --------------------------------------- */

/** Terminal: a prompt chevron and a gold caret. */
export const TerminalGlyph = glyph(
  "terminal",
  <>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="M7 10l3 2.5-3 2.5" />
    <path d="M12.5 15.5h4.5" {...gold} strokeWidth="1.8" />
  </>,
);

/** Settings: a switch whose knob is a half-lit moon. */
export const SettingsGlyph = glyph(
  "settings",
  <>
    <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" />
    <circle cx="16.8" cy="12" r="2.9" />
    <path d="M16.8 9.1a2.9 2.9 0 0 1 0 5.8Z" fill={GOLD} stroke="none" />
    <path d="M6.5 12h4" strokeOpacity=".6" />
  </>,
);

export const BinGlyph = glyph(
  "bin",
  <>
    <path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
    <path d="M6.3 7l.9 12a1.5 1.5 0 0 0 1.5 1.4h6.6a1.5 1.5 0 0 0 1.5-1.4l.9-12" />
    <path d="M10 11v6M14 11v6" strokeOpacity=".6" />
  </>,
);

export const InfoGlyph = glyph(
  "info",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="7.8" r="1.1" fill={GOLD} stroke="none" />
  </>,
);

/* ------------------------------------ Play & trophies --------------------------------- */

/** Games: a d-pad with a gold centre. */
export const GamesGlyph = glyph(
  "games",
  <>
    <path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6Z" />
    <circle cx="12" cy="12" r="1.5" fill={GOLD} stroke="none" />
  </>,
);

/** Lunar Drift: a crescent catcher under a falling star. */
export const DriftGlyph = glyph(
  "game",
  <>
    <path d="M4.5 15.5c1.8 2.6 4.4 4 7.5 4s5.7-1.4 7.5-4c-2 1.2-4.6 1.8-7.5 1.8s-5.5-.6-7.5-1.8Z" />
    {star(12, 7.5, 3.6)}
    <path d="M15.5 4l1.3-1.3M17.8 7l1.7-.6" strokeOpacity=".6" />
  </>,
);

/** One laurel branch (left side); mirrored for the right. */
const laurel = (
  <>
    <path d="M10.5 20.5C6.6 19.6 4.2 16.2 4.6 11.6" />
    <path d="M6.9 18.6c-1.7.3-3-.4-3.6-1.6 1.5-.4 2.8.2 3.6 1.6Z" fill="currentColor" stroke="none" />
    <path d="M5.2 15.6c-1.6-.2-2.6-1.2-2.8-2.5 1.5 0 2.6.9 2.8 2.5Z" fill="currentColor" stroke="none" />
    <path d="M4.7 12.3c-1.2-.8-1.7-2-1.5-3.3 1.4.5 2 1.8 1.5 3.3Z" fill="currentColor" stroke="none" />
  </>
);

/** Trophies: the logo star cradled in two laurel branches. */
export const TrophiesGlyph = glyph(
  "trophies",
  <>
    {laurel}
    <g transform="matrix(-1 0 0 1 24 0)">{laurel}</g>
    {star(12, 10.2, 4.6)}
  </>,
);

/** Moonword: a row of letter tiles, the middle one solved in gold. */
export const MoonwordGlyph = glyph(
  "moonword",
  <>
    <rect x="2.5" y="8.5" width="5.5" height="7" rx="1.2" />
    <rect x="9.25" y="8.5" width="5.5" height="7" rx="1.2" fill={GOLD} stroke={GOLD} />
    <rect x="16" y="8.5" width="5.5" height="7" rx="1.2" />
    <path d="M10.6 13.6l1.4-3.4 1.4 3.4M11.1 12.5h1.8" stroke="#1a1406" strokeWidth="1.1" />
  </>,
);

/** Keystroke: a keyboard with one gold key. */
export const KeystrokeGlyph = glyph(
  "keystroke",
  <>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M6 9.5h.01M9 9.5h.01M12 9.5h.01M15 9.5h.01M18 9.5h.01M6 12.2h.01M9 12.2h.01M15 12.2h.01M18 12.2h.01" strokeWidth="1.8" />
    <path d="M8 15h8" />
    <rect x="11" y="11.2" width="2" height="2" rx=".4" fill={GOLD} stroke="none" />
  </>,
);

/** Phase memory: four moon phases in a grid. */
export const MemoryGlyph = glyph(
  "memory",
  <>
    <circle cx="7.5" cy="7.5" r="3.5" />
    <circle cx="16.5" cy="7.5" r="3.5" />
    <path d="M16.5 4a3.5 3.5 0 0 1 0 7Z" fill="currentColor" stroke="none" />
    <circle cx="7.5" cy="16.5" r="3.5" />
    <path d="M7.5 13a3.5 3.5 0 1 1 0 7a2.6 2.6 0 0 0 0-7Z" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="16.5" r="3.5" fill={GOLD} stroke={GOLD} />
  </>,
);

/** Orbit: the moon, a ring, and a gold satellite. */
export const OrbitGlyph = glyph(
  "orbit",
  <>
    <circle cx="12" cy="12" r="3.2" />
    <ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(-30 12 12)" />
    <rect x="17.4" y="3.6" width="3" height="3" rx=".6" transform="rotate(30 18.9 5.1)" fill={GOLD} stroke="none" />
  </>,
);

/** Music: two notes, one head in gold. */
export const MusicGlyph = glyph(
  "music",
  <>
    <path d="M9 17.5V6l10-2v11.5" />
    <path d="M9 9l10-2" strokeOpacity=".6" />
    <circle cx="6.8" cy="17.5" r="2.3" />
    <circle cx="16.8" cy="15.5" r="2.3" fill={GOLD} stroke={GOLD} />
  </>,
);
