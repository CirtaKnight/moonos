"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { pointer, trackPointer } from "../lib/pointer";
import { useSettings } from "../store/settings";

const INTERACTIVE = 'a, button, [role="button"], [role="option"], [data-icon], summary, label, select';
const TEXT = 'input:not([type="range"]):not([type="checkbox"]), textarea, [contenteditable="true"]';
const MAX_PARTICLES = 48;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  gold: boolean;
}

/**
 * The MoonOS pointer: a small crescent with a short stardust trail. Over clickable things
 * it blooms into a soft ring; on press it squashes. Text fields keep the native I-beam.
 * Only mounted for fine pointers (mouse / trackpad).
 */
export function Cursor() {
  const moonRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useSettings((s) => s.reduceMotion);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.cursor = "custom";
    const release = trackPointer();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const particles: Particle[] = [];
    let mode: "default" | "hover" | "text" = "default";
    let pressed = false;
    let lastX = pointer.x;
    let lastY = pointer.y;
    let ringX = pointer.x;
    let ringY = pointer.y;
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onOver = (e: PointerEvent) => {
      const el = e.target as Element | null;
      mode = el?.closest?.(TEXT) ? "text" : el?.closest?.(INTERACTIVE) ? "hover" : "default";
    };
    const onDown = () => (pressed = true);
    const onUp = () => (pressed = false);

    const loop = () => {
      const { x, y } = pointer;
      const moon = moonRef.current;
      const ring = ringRef.current;
      ringX += (x - ringX) * 0.22;
      ringY += (y - ringY) * 0.22;
      const visible = pointer.inside && mode !== "text";
      if (moon) {
        moon.style.opacity = visible ? "1" : "0";
        moon.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${pressed ? 0.82 : mode === "hover" ? 0.9 : 1})`;
      }
      if (ring) {
        ring.style.opacity = visible && mode === "hover" ? "1" : "0";
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${pressed ? 0.85 : 1})`;
      }

      // Stardust: spawn proportionally to movement.
      const speed = Math.hypot(x - lastX, y - lastY);
      if (!reduceMotion && visible && speed > 1.5) {
        const n = Math.min(3, Math.floor(speed / 8) + 1);
        for (let i = 0; i < n && particles.length < MAX_PARTICLES; i++) {
          particles.push({
            x: x - 2 + (Math.random() - 0.5) * 6,
            y: y + 6 + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 0.4,
            vy: 0.25 + Math.random() * 0.5,
            life: 1,
            size: 0.6 + Math.random() * 1.4,
            gold: Math.random() < 0.18,
          });
        }
      }
      lastX = x;
      lastY = y;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.028;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.gold ? `rgba(200,169,111,${p.life})` : `rgba(220,228,245,${p.life * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      delete root.dataset.cursor;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      release();
    };
  }, [reduceMotion]);

  // Rendered at the top of the page (not inside the desktop's layer) with the highest
  // z-index, so nothing — previews, menus, overlays — can ever draw over the pointer.
  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[2147483647]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        ref={ringRef}
        className="absolute top-0 left-0 size-9 rounded-full border border-[#bccbeb]/70 bg-[#bccbeb]/10 opacity-0 shadow-[0_0_18px_rgb(188_203_235/0.45)] transition-opacity duration-150"
      />
      <div ref={moonRef} className="absolute top-0 left-0 opacity-0 transition-opacity duration-150" style={{ transformOrigin: "2px 2px" }}>
        {/* Hotspot is the crescent's upper tip at (2,2). */}
        <svg width="22" height="22" viewBox="0 0 22 22" className="drop-shadow-[0_0_6px_rgb(188_203_235/0.7)]">
          <path
            d="M2 2 C 12 3, 19 10, 18.5 19 C 15 14, 9 8.5, 2 2 Z"
            fill="#eef1f8"
            stroke="#0a0f1c"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="12.5" r="1.1" fill="#c8a96f" />
        </svg>
      </div>
    </div>,
    document.body,
  );
}
