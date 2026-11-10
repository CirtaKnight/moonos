"use client";

import { useContent } from "../content/ContentProvider";
import { useSettings } from "../store/settings";
import { Starfield } from "./Starfield";

/**
 * Built-in wallpapers are drawn in CSS/SVG so they're crisp at any size and cost no bandwidth.
 * Uploaded wallpapers (from the admin) render as cover images.
 */
export function Wallpaper() {
  const id = useSettings((s) => s.wallpaper);
  const { settings } = useContent();
  const custom = settings.wallpapers.find((w) => w.id === id && w.url);

  if (custom?.url) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${custom.url})` }}
        aria-hidden
      />
    );
  }

  if (id === "starfield") return <Starfield />;
  if (id === "tide") return <Tide />;
  if (id === "dune") return <Dune />;
  return <Eclipse />;
}

/** Faint glyph-like lattice laid over every built-in wallpaper. */
function Lattice({ opacity }: { opacity: number }) {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden style={{ opacity }}>
      <defs>
        <pattern id="ck-lattice" width="96" height="96" patternUnits="userSpaceOnUse">
          <path d="M48 0v96M0 48h96" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="48" cy="48" r="14" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <path d="M48 34a14 14 0 0 1 0 28a10 10 0 0 0 0-28z" fill="currentColor" opacity="0.6" />
        </pattern>
        <radialGradient id="ck-lattice-fade" cx="70%" cy="30%" r="80%">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="ck-lattice-mask">
          <rect width="100%" height="100%" fill="url(#ck-lattice-fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#ck-lattice)" mask="url(#ck-lattice-mask)" />
    </svg>
  );
}

function Eclipse() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden
      style={{
        background: "radial-gradient(120% 90% at 75% 18%, #18213a 0%, #0a0e1a 42%, #04060c 100%)",
        color: "#bccbeb",
      }}
    >
      <Lattice opacity={0.06} />
      {/* The eclipsed moon: a dark disc with a bright rim, partly off-screen */}
      <div
        className="absolute rounded-full"
        style={{
          width: "min(62vw, 78vh)",
          aspectRatio: "1",
          right: "-12vw",
          top: "-14vh",
          background: "radial-gradient(circle at 38% 38%, #0b1020 0%, #070a14 70%)",
          boxShadow: "inset 18px -10px 40px rgb(188 203 235 / 0.22), 0 0 80px 6px rgb(188 203 235 / 0.16), 0 0 260px 40px rgb(142 167 220 / 0.08)",
        }}
      />
      <Stars />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: "linear-gradient(0deg, rgb(3 4 9 / 0.85), transparent)",
        }}
      />
    </div>
  );
}

function Tide() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden
      style={{
        background: "linear-gradient(180deg, #0a1022 0%, #0c1530 55%, #050912 100%)",
        color: "#bccbeb",
      }}
    >
      <Lattice opacity={0.05} />
      <Stars />
      <div
        className="absolute left-1/2 rounded-full"
        style={{
          width: "min(22vw, 26vh)",
          aspectRatio: "1",
          top: "18%",
          transform: "translateX(-50%)",
          background: "radial-gradient(circle at 40% 35%, #f3f5fa, #c7d0e2)",
          boxShadow: "0 0 90px 10px rgb(188 203 235 / 0.25)",
        }}
      />
      <svg className="absolute inset-x-0 bottom-0 h-[42%] w-full" preserveAspectRatio="none" viewBox="0 0 100 40">
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M0 ${6 + i * 4} Q 25 ${4 + i * 4} 50 ${6 + i * 4} T 100 ${6 + i * 4} V40 H0Z`}
            fill={"#8ea7dc"}
            opacity={0.03 + i * 0.012}
          />
        ))}
        <rect x="47" y="2" width="6" height="38" fill={"#bccbeb"} opacity="0.08" />
      </svg>
    </div>
  );
}

function Dune() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden
      style={{
        background: "linear-gradient(180deg, #0b0d1a 0%, #1b1a2e 45%, #3a2a2a 75%, #1a120f 100%)",
        color: "#c8a96f",
      }}
    >
      <Lattice opacity={0.05} />
      <Stars />
      <div
        className="absolute rounded-full"
        style={{
          width: "min(10vw, 12vh)",
          aspectRatio: "1",
          left: "18%",
          top: "16%",
          boxShadow: "inset -14px 6px 0 0 #e9dcc0",
          filter: "drop-shadow(0 0 18px rgb(233 220 192 / 0.4))",
        }}
      />
      <svg className="absolute inset-x-0 bottom-0 h-1/2 w-full" preserveAspectRatio="none" viewBox="0 0 100 50">
        <path d="M0 30 Q 30 14 55 26 T 100 20 V50 H0Z" fill={"#2a1d1b"} />
        <path d="M0 38 Q 40 24 70 34 T 100 32 V50 H0Z" fill={"#1c1312"} />
        <path d="M0 46 Q 30 38 60 44 T 100 42 V50 H0Z" fill={"#120c0b"} />
      </svg>
    </div>
  );
}

/** Deterministic star field (no randomness → no hydration mismatch). */
function Stars() {
  const stars = Array.from({ length: 70 }, (_, i) => {
    const x = (i * 73.13) % 100;
    const y = (i * 41.7 + (i % 7) * 9) % 62;
    const r = i % 9 === 0 ? 1.4 : i % 3 === 0 ? 1 : 0.6;
    const o = 0.25 + ((i * 17) % 50) / 100;
    return { x, y, r, o };
  });
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden>
      {stars.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#e9ecf3" opacity={s.o} />
      ))}
    </svg>
  );
}
