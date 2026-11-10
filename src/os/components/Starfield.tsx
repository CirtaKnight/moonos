"use client";

import { useEffect, useRef } from "react";
import { pointer, seeded, trackPointer } from "../lib/pointer";
import { useSettings } from "../store/settings";

interface Star {
  x: number;
  y: number;
  r: number;
  depth: number;
  phase: number;
  speed: number;
  base: number;
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const LAYERS = [
  { depth: 0.25, density: 0.00011, size: [0.4, 0.9] },
  { depth: 0.55, density: 0.00006, size: [0.6, 1.3] },
  { depth: 1, density: 0.000028, size: [0.9, 1.9] },
] as const;
const PARALLAX = 34; // px at depth 1
const LINK_RADIUS = 150; // constellation reach around the cursor
const LINK_DIST = 95;

function makeStars(w: number, h: number): Star[] {
  const rand = seeded(1729);
  const stars: Star[] = [];
  // Over-scan so parallax never reveals empty edges.
  const W = w + PARALLAX * 2;
  const H = h + PARALLAX * 2;
  for (const layer of LAYERS) {
    const n = Math.round(W * H * layer.density);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: rand() * W - PARALLAX,
        y: rand() * H - PARALLAX,
        r: layer.size[0] + rand() * (layer.size[1] - layer.size[0]),
        depth: layer.depth,
        phase: rand() * Math.PI * 2,
        speed: 0.6 + rand() * 1.8,
        base: 0.35 + rand() * 0.55,
      });
    }
  }
  return stars;
}

/**
 * The living wallpaper: layered stars with cursor parallax, twinkling, shooting stars,
 * constellation lines that form around the cursor, and an eclipse whose glow leans
 * toward the pointer. Pauses when hidden; a single still frame with reduced motion.
 */
export function Starfield({ dim = false }: { dim?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useSettings((s) => s.reduceMotion);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const release = trackPointer();
    const prefersReduced = reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let raf = 0;
    let ox = 0; // eased parallax
    let oy = 0;
    let shooting: Shooting | null = null;
    let nextShoot = performance.now() + 4000;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(w, h);
      if (prefersReduced) frame(performance.now());
    };

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      // Ease toward the pointer (or a slow idle drift when it isn't over the page).
      const tx = pointer.inside || pointer.nx ? pointer.nx : Math.sin(t * 0.05) * 0.3;
      const ty = pointer.inside || pointer.ny ? pointer.ny : Math.cos(t * 0.04) * 0.2;
      ox += (tx - ox) * 0.045;
      oy += (ty - oy) * 0.045;

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#070a16");
      sky.addColorStop(0.6, "#05070f");
      sky.addColorStop(1, "#030409");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Eclipse, top right, glow leaning toward the pointer
      const R = Math.min(w * 0.3, h * 0.38);
      const mx = w * 0.84 - ox * 18;
      const my = h * 0.12 - oy * 12;
      const lean = { x: ox * R * 0.12, y: oy * R * 0.12 };
      const halo = ctx.createRadialGradient(mx + lean.x, my + lean.y, R * 0.85, mx, my, R * 2.1);
      halo.addColorStop(0, "rgba(188,203,235,0.22)");
      halo.addColorStop(1, "rgba(188,203,235,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);
      ctx.beginPath();
      ctx.arc(mx, my, R, 0, Math.PI * 2);
      ctx.fillStyle = "#04060d";
      ctx.fill();
      // Bright rim on the side facing the pointer
      const rim = ctx.createRadialGradient(mx + lean.x * 2.4, my + lean.y * 2.4, R * 0.9, mx, my, R * 1.03);
      rim.addColorStop(0, "rgba(233,236,243,0)");
      rim.addColorStop(1, "rgba(233,236,243,0.5)");
      ctx.strokeStyle = rim;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Stars
      const near: { x: number; y: number }[] = [];
      for (const s of stars) {
        const x = s.x - ox * PARALLAX * s.depth;
        const y = s.y - oy * PARALLAX * s.depth;
        if (x < -4 || y < -4 || x > w + 4 || y > h + 4) continue;
        const tw = prefersReduced ? 1 : 0.65 + 0.35 * Math.sin(t * s.speed + s.phase);
        const a = s.base * tw * (y > h * 0.85 ? 0.6 : 1);
        ctx.fillStyle = `rgba(233,236,243,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.depth === 1 && pointer.inside) {
          const d = Math.hypot(x - pointer.x, y - pointer.y);
          if (d < LINK_RADIUS) near.push({ x, y });
        }
      }

      // Constellations around the cursor
      if (near.length > 1) {
        ctx.lineWidth = 0.7;
        for (let i = 0; i < near.length; i++) {
          for (let j = i + 1; j < near.length; j++) {
            const d = Math.hypot(near[i].x - near[j].x, near[i].y - near[j].y);
            if (d > LINK_DIST) continue;
            const mxp = (near[i].x + near[j].x) / 2;
            const myp = (near[i].y + near[j].y) / 2;
            const fade = 1 - Math.hypot(mxp - pointer.x, myp - pointer.y) / LINK_RADIUS;
            ctx.strokeStyle = `rgba(188,203,235,${0.45 * fade})`;
            ctx.beginPath();
            ctx.moveTo(near[i].x, near[i].y);
            ctx.lineTo(near[j].x, near[j].y);
            ctx.stroke();
          }
        }
      }

      // Shooting stars
      if (!prefersReduced) {
        if (!shooting && now > nextShoot) {
          const fromLeft = Math.random() < 0.5;
          shooting = {
            x: fromLeft ? Math.random() * w * 0.5 : w * 0.5 + Math.random() * w * 0.5,
            y: Math.random() * h * 0.35,
            vx: (fromLeft ? 1 : -1) * (700 + Math.random() * 500),
            vy: 260 + Math.random() * 200,
            life: 0,
          };
        }
        if (shooting) {
          shooting.life += 1 / 60;
          shooting.x += shooting.vx / 60;
          shooting.y += shooting.vy / 60;
          const len = 0.12;
          const g = ctx.createLinearGradient(shooting.x, shooting.y, shooting.x - shooting.vx * len, shooting.y - shooting.vy * len);
          const alpha = Math.max(0, 1 - shooting.life / 0.9);
          g.addColorStop(0, `rgba(255,255,255,${alpha})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(shooting.x, shooting.y);
          ctx.lineTo(shooting.x - shooting.vx * len, shooting.y - shooting.vy * len);
          ctx.stroke();
          if (shooting.life > 0.9) {
            shooting = null;
            nextShoot = now + 5000 + Math.random() * 9000;
          }
        }
      }

      // Horizon haze
      const haze = ctx.createLinearGradient(0, h * 0.6, 0, h);
      haze.addColorStop(0, "rgba(0,0,0,0)");
      haze.addColorStop(1, "rgba(3,4,9,0.7)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
    };

    const loop = (now: number) => {
      if (!document.hidden) frame(now);
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!prefersReduced) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      release();
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={dim ? { filter: "brightness(0.7)" } : undefined}
    />
  );
}
