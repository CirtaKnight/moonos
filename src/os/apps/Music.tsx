"use client";

import { motion } from "motion/react";
import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MoonGlyph } from "../components/MoonGlyph";
import { useContent } from "../content/ContentProvider";
import type { AppProps } from "./types";
import { EmptyState } from "./ui";

const fmt = (s: number) =>
  Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";

/** A small player for tracks uploaded in the admin. */
export function Music(_props: AppProps) {
  void _props;
  const { tracks } = useContent();
  const audio = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const track = tracks[index];

  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  if (!tracks.length) {
    return (
      <EmptyState title="No tracks yet" phase={0.3}>
        The playlist for late-night coding sessions is still being curated.
      </EmptyState>
    );
  }

  const go = (delta: number) => {
    setIndex((i) => (i + delta + tracks.length) % tracks.length);
    setTime(0);
  };

  const toggle = async () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      try {
        await el.play();
      } catch {
        setPlaying(false);
      }
    } else el.pause();
  };

  return (
    <div className="flex h-full flex-col">
      <audio
        ref={audio}
        src={track.url}
        preload="metadata"
        autoPlay={playing}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => go(1)}
      />
      <div className="flex shrink-0 flex-col items-center gap-4 px-6 pt-6 pb-4">
        <motion.div
          animate={{ rotate: playing ? 360 : 0 }}
          transition={playing ? { duration: 24, repeat: Infinity, ease: "linear" } : { duration: 0.6 }}
          className="relative grid size-40 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#1d2640,#06080f)] shadow-window ring-1 ring-line"
        >
          <MoonGlyph phase={(time / Math.max(duration, 1)) * 0.98 + 0.01} size={88} className="text-[#e9ecf3]" />
          <span className="absolute size-3 rounded-full bg-bg ring-1 ring-line-strong" />
        </motion.div>
        <div className="w-full text-center">
          <p className="truncate font-semibold text-fg">{track.title}</p>
          <p className="truncate text-sm text-muted">{track.artist ?? "Unknown artist"}</p>
        </div>
        <div className="w-full">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            onChange={(e) => {
              const t = Number(e.target.value);
              if (audio.current) audio.current.currentTime = t;
              setTime(t);
            }}
            aria-label="Seek"
            className="w-full accent-[var(--accent)]"
          />
          <div className="flex justify-between text-[11px] text-faint tabular-nums">
            <span>{fmt(time)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" aria-label="Previous" onClick={() => go(-1)} className="grid size-10 place-items-center rounded-full text-muted hover:text-fg">
            <SkipBack size={20} />
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={toggle}
            className="grid size-14 place-items-center rounded-full bg-accent text-accent-ink transition-transform hover:scale-105"
          >
            {playing ? <Pause size={24} /> : <Play size={24} className="translate-x-0.5" />}
          </button>
          <button type="button" aria-label="Next" onClick={() => go(1)} className="grid size-10 place-items-center rounded-full text-muted hover:text-fg">
            <SkipForward size={20} />
          </button>
        </div>
        <label className="flex w-40 items-center gap-2 text-muted">
          <Volume2 size={14} />
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" className="w-full accent-[var(--accent)]" />
        </label>
      </div>
      <ol className="scroll-area min-h-0 flex-1 border-t border-line p-2">
        {tracks.map((t, i) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => {
                setIndex(i);
                setPlaying(true);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                i === index ? "bg-accent/15 text-fg" : "text-muted hover:bg-surface-hover"
              }`}
            >
              <span className="w-5 text-right text-xs tabular-nums text-faint">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              {t.artist && <span className="truncate text-xs text-faint">{t.artist}</span>}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
