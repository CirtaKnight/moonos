"use client";

import { Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { hop, newOrbit, RINGS, stepOrbit, type OrbitState } from "../../lib/games/orbit";
import { play } from "../../lib/sound";
import { readJSON, writeJSON } from "../../lib/storage";
import { unlock } from "../../store/achievements";
import { useWindows } from "../../store/windows";
import type { AppProps } from "../types";

const BEST_KEY = "orbit-best";

/** Orbit: tap / click / Space to hop rings and dodge the debris. */
export function Orbit({ windowId }: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<OrbitState>(newOrbit());
  const [ui, setUi] = useState(() => ({ status: "ready" as OrbitState["status"], score: 0, best: readJSON(BEST_KEY, 0) }));

  const start = () => {
    stateRef.current = newOrbit("playing");
    setUi((u) => ({ ...u, status: "playing", score: 0 }));
  };
  const act = () => {
    if (stateRef.current.status === "playing") stateRef.current = hop(stateRef.current);
    else start();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (windowId && useWindows.getState().focusedId !== windowId) return;
      if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        act();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let shownScore = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const before = stateRef.current;
      const s = stepOrbit(before, dt);
      stateRef.current = s;
      const score = Math.floor(s.t);
      if (s.status === "playing" && score !== shownScore) {
        shownScore = score;
        if (score >= 30) unlock("orbit-30");
        setUi((u) => ({ ...u, score }));
      }
      if (s.status === "over" && before.status === "playing") {
        play("error");
        const best = Math.max(readJSON(BEST_KEY, 0), score);
        writeJSON(BEST_KEY, best);
        setUi({ status: "over", score, best });
      }
      draw(canvasRef.current, wrapRef.current, s, now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className="relative h-full touch-none overflow-hidden bg-[#04060c] select-none" onPointerDown={act}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-3 font-mono text-xs text-[#bccbeb]">
        <span>TIME {ui.score}s</span>
        <span className="text-[#6f7890]">BEST {ui.best}s</span>
      </div>
      {ui.status !== "playing" && (
        <div className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]">
          <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center">
            <h2 className="font-display text-2xl tracking-[0.25em] text-[#e9ecf3] uppercase">{ui.status === "over" ? "Signal lost" : "Orbit"}</h2>
            <p className="text-sm text-[#8c94a8]">
              {ui.status === "over" ? `You held orbit for ${ui.score}s.` : "Hop between rings to dodge the debris. How long can you stay in orbit?"}
            </p>
            <p className="font-mono text-[11px] text-[#5c6478]">tap · click · space</p>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={start}
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#bccbeb] px-5 py-2 text-sm font-medium text-[#0a0f1c]"
            >
              {ui.status === "over" ? <RotateCcw size={15} /> : <Play size={15} />}
              {ui.status === "over" ? "Try again" : "Launch"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function draw(canvas: HTMLCanvasElement | null, wrap: HTMLDivElement | null, s: OrbitState, time: number) {
  if (!canvas || !wrap) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (canvas.width !== Math.round(w * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2 + 10;
  const unit = Math.min(w, h) / 2 - 24;
  const radius = (ring: number) => unit * (0.42 + ring * 0.24);

  // Moon
  const g = ctx.createRadialGradient(cx - 10, cy - 10, 4, cx, cy, unit * 0.26);
  g.addColorStop(0, "#f3f5fa");
  g.addColorStop(1, "#8ea7dc");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, unit * 0.24, 0, Math.PI * 2);
  ctx.fill();

  // Rings
  for (let r = 0; r < RINGS; r++) {
    ctx.strokeStyle = r === s.ring ? "rgba(188,203,235,0.45)" : "rgba(188,203,235,0.14)";
    ctx.lineWidth = r === s.ring ? 1.6 : 1;
    ctx.setLineDash(r === s.ring ? [] : [4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius(r), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Debris
  for (const d of s.debris) {
    const x = cx + Math.cos(d.angle) * radius(d.ring);
    const y = cy + Math.sin(d.angle) * radius(d.ring);
    ctx.fillStyle = "#8a5a5c";
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 2 + d.id);
    ctx.fillRect(-6, -4, 12, 8);
    ctx.restore();
  }

  // Satellite
  const sr = radius(s.ring) + (s.hop > 0 ? -18 * (s.hop / 0.18) : 0);
  const sx = cx + Math.cos(s.angle) * sr;
  const sy = cy + Math.sin(s.angle) * sr;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(s.angle + Math.PI / 2);
  ctx.shadowColor = "rgba(200,169,111,0.8)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#e9ecf3";
  ctx.fillRect(-4, -4, 8, 8);
  ctx.fillStyle = "#c8a96f";
  ctx.fillRect(-13, -2, 7, 4);
  ctx.fillRect(6, -2, 7, 4);
  ctx.restore();
}
