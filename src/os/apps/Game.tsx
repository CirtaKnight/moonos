"use client";

import { Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { newGame, PLAYER_HALF_W, PLAYER_Y, step, type GameState } from "../lib/lunarDrift";
import { play } from "../lib/sound";
import { useWindows } from "../store/windows";
import type { AppProps } from "./types";

const BEST_KEY = "ck-lunar-drift-best";

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Lunar Drift: an original tiny arcade game. Arrows / A-D, or drag with mouse / finger. */
export function Game({ windowId }: AppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(newGame());
  const keys = useRef({ left: false, right: false });
  const pointerX = useRef<number | null>(null);
  // Apps only render client-side (after boot), so reading localStorage here is safe.
  const [ui, setUi] = useState<{ status: GameState["status"]; score: number; best: number }>(() => ({
    status: "ready",
    score: 0,
    best: readBest(),
  }));

  function start() {
    stateRef.current = newGame("playing");
    setUi((u) => ({ ...u, status: "playing", score: 0 }));
  }

  // Keyboard (only while this window is focused, or always in the phone shell).
  useEffect(() => {
    const active = () => !windowId || useWindows.getState().focusedId === windowId;
    const down = (e: KeyboardEvent) => {
      if (!active()) return;
      if (["ArrowLeft", "a", "A"].includes(e.key)) keys.current.left = true;
      if (["ArrowRight", "d", "D"].includes(e.key)) keys.current.right = true;
      if ((e.key === " " || e.key === "Enter") && stateRef.current.status !== "playing") start();
    };
    const up = (e: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(e.key)) keys.current.left = false;
      if (["ArrowRight", "d", "D"].includes(e.key)) keys.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [windowId]);

  // Game loop + rendering.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastLives = 3;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const before = stateRef.current;
      const s = step(before, dt, { dir: Number(keys.current.right) - Number(keys.current.left), targetX: pointerX.current });
      stateRef.current = s;
      if (s.status === "playing" && s.lives < lastLives) play("error");
      lastLives = s.lives;
      if (s.score !== before.score || s.status !== before.status) {
        if (s.status === "over" && before.status === "playing") {
          const best = Math.max(readBest(), s.score);
          try {
            localStorage.setItem(BEST_KEY, String(best));
          } catch {}
          setUi({ status: "over", score: s.score, best });
        } else setUi((u) => ({ ...u, score: s.score, status: s.status }));
      }
      draw(canvasRef.current, wrapRef.current, s, now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toX = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    return rect ? (clientX - rect.left) / rect.width : null;
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-full touch-none overflow-hidden bg-[#04060c] select-none"
      onPointerDown={(e) => {
        pointerX.current = toX(e.clientX);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || e.buttons) pointerX.current = toX(e.clientX);
      }}
      onPointerUp={() => (pointerX.current = null)}
      onPointerCancel={() => (pointerX.current = null)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-3 font-mono text-xs text-[#bccbeb]">
        <span>SCORE {String(ui.score).padStart(4, "0")}</span>
        <span className="text-[#6f7890]">BEST {String(ui.best).padStart(4, "0")}</span>
      </div>
      {ui.status !== "playing" && (
        <div className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]">
          <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center">
            <h2 className="font-display text-2xl tracking-[0.25em] text-[#e9ecf3] uppercase">
              {ui.status === "over" ? "Eclipsed" : "Lunar Drift"}
            </h2>
            <p className="text-sm text-[#8c94a8]">
              {ui.status === "over"
                ? `You gathered ${ui.score} stardust.${ui.score > 0 && ui.score >= ui.best ? " New best!" : ""}`
                : "Catch the falling stardust, dodge the meteors. Golden orbs are worth 5."}
            </p>
            <p className="font-mono text-[11px] text-[#5c6478]">← → / A D · or drag</p>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={start}
              className="pointer-events-auto mt-1 inline-flex items-center gap-2 rounded-full bg-[#bccbeb] px-5 py-2 text-sm font-medium text-[#0a0f1c] transition-transform hover:scale-105"
            >
              {ui.status === "over" ? <RotateCcw size={15} /> : <Play size={15} />}
              {ui.status === "over" ? "Play again" : "Start"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const STARS = Array.from({ length: 60 }, (_, i) => ({ x: (i * 0.618) % 1, y: (i * 0.377) % 1, r: i % 7 === 0 ? 1.4 : 0.7 }));

function draw(canvas: HTMLCanvasElement | null, wrap: HTMLDivElement | null, s: GameState, time: number) {
  if (!canvas || !wrap) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // Background stars, slowly drifting
  for (const st of STARS) {
    const y = ((st.y + time * 0.01) % 1) * h;
    ctx.fillStyle = `rgba(233,236,243,${0.25 + 0.25 * Math.sin(time * 2 + st.x * 10)})`;
    ctx.beginPath();
    ctx.arc(st.x * w, y, st.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Horizon glow
  const g = ctx.createLinearGradient(0, h * 0.8, 0, h);
  g.addColorStop(0, "rgba(142,167,220,0)");
  g.addColorStop(1, "rgba(142,167,220,0.12)");
  ctx.fillStyle = g;
  ctx.fillRect(0, h * 0.8, w, h * 0.2);

  const unit = Math.min(w, h);
  for (const b of s.bodies) {
    const x = b.x * w;
    const y = b.y * h;
    const r = b.r * unit;
    if (b.kind === "meteor") {
      ctx.strokeStyle = "rgba(226,120,122,0.35)";
      ctx.lineWidth = r * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 4);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = "#8a5a5c";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const color = b.kind === "orb" ? "200,169,111" : "233,236,243";
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
      glow.addColorStop(0, `rgba(${color},1)`);
      glow.addColorStop(0.35, `rgba(${color},0.6)`);
      glow.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Player crescent (blinks while shielded)
  if (s.shield <= 0 || Math.floor(time * 12) % 2 === 0) {
    const px = s.playerX * w;
    const py = PLAYER_Y * h;
    const pr = PLAYER_HALF_W * w * 0.75;
    ctx.save();
    ctx.shadowColor = "rgba(188,203,235,0.6)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#e9ecf3";
    ctx.beginPath();
    ctx.ellipse(px, py, pr, pr * 0.55, 0, 0, Math.PI);
    ctx.ellipse(px, py - pr * 0.12, pr * 0.82, pr * 0.32, 0, Math.PI, 0, true);
    ctx.fill();
    ctx.restore();
  }

  for (const e of s.events) {
    ctx.strokeStyle = e.kind === "hit" ? `rgba(226,120,122,${1 - e.age * 2})` : e.kind === "bonus" ? `rgba(200,169,111,${1 - e.age * 2})` : `rgba(188,203,235,${1 - e.age * 2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.x * w, e.y * h, 6 + e.age * 60, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lives
  for (let i = 0; i < s.lives; i++) {
    ctx.fillStyle = "#bccbeb";
    ctx.beginPath();
    ctx.arc(w - 14 - i * 14, h - 14, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
