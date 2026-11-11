"use client";

import { Check, Info, Monitor, RotateCcw, Volume2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LogoMark } from "../components/Logo";
import { MoonGlyph } from "../components/MoonGlyph";
import { useContent } from "../content/ContentProvider";
import { useNow } from "../hooks";
import { moonIllumination, moonPhase, moonPhaseName } from "../lib/moon";
import { play } from "../lib/sound";
import { usePower } from "../store/power";
import { useSettings, type ShellLayout } from "../store/settings";
import type { AppProps } from "./types";
import { Button, Scroll } from "./ui";

const SECTIONS = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "sound", label: "Sound, cursor & motion", icon: Volume2 },
  { id: "about", label: "About this OS", icon: Info },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

/** Built-in wallpaper swatches (drawn in CSS, so previews are tiny gradients). */
const SWATCH: Record<string, string> = {
  starfield:
    "radial-gradient(circle at 82% 14%, rgb(188 203 235 / 0.35) 0 6%, transparent 7%), radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent), radial-gradient(1px 1px at 45% 60%, #fff 50%, transparent), radial-gradient(1px 1px at 70% 40%, #fff 50%, transparent), radial-gradient(1px 1px at 30% 75%, #fff 50%, transparent), linear-gradient(180deg, #070a16, #030409)",
  eclipse: "radial-gradient(circle at 80% 15%, #2a3550 0, #0a0e1a 45%, #04060c 100%)",
  tide: "linear-gradient(180deg, #0a1022, #0c1530 60%, #1a2a50)",
  dune: "linear-gradient(180deg, #0b0d1a, #1b1a2e 45%, #3a2a2a 75%, #1a120f)",
};

export function Settings({ params }: AppProps) {
  const [section, setSection] = useState<Section>((params.section as Section) ?? "desktop");
  return (
    <div className="flex h-full">
      <nav className="flex w-14 shrink-0 flex-col gap-1 border-r border-line bg-surface-2 p-2 sm:w-48">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            aria-current={section === id}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
              section === id ? "bg-accent/15 text-fg" : "text-muted hover:bg-surface-hover hover:text-fg"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1">
        <Scroll className="p-5 sm:p-6">
          {section === "desktop" && <DesktopSection />}
          {section === "sound" && <SoundMotion />}
          {section === "about" && <AboutOS />}
        </Scroll>
      </div>
    </div>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Choice({ selected, onClick, label, children }: { selected: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="group flex flex-col gap-2 text-left"
    >
      <span
        className={`relative block overflow-hidden rounded-xl ring-2 transition ${
          selected ? "ring-accent" : "ring-line group-hover:ring-line-strong"
        }`}
      >
        {children}
        {selected && (
          <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-accent text-accent-ink">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className={`text-xs ${selected ? "text-fg" : "text-muted"}`}>{label}</span>
    </button>
  );
}

function DesktopSection() {
  const { settings } = useContent();
  const wallpaper = useSettings((s) => s.wallpaper);
  const setWallpaper = useSettings((s) => s.setWallpaper);
  const layout = useSettings((s) => s.layout);
  const setLayout = useSettings((s) => s.setLayout);
  const layouts: { id: ShellLayout; label: string }[] = [
    { id: "dock", label: "Menu bar + dock" },
    { id: "taskbar", label: "Taskbar" },
  ];
  return (
    <>
      <Group title="Wallpaper">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {settings.wallpapers.map((w) => (
            <Choice key={w.id} selected={wallpaper === w.id} onClick={() => setWallpaper(w.id)} label={w.name}>
              <span
                className="block aspect-video bg-cover bg-center"
                style={{ background: w.url ? `center / cover url(${w.url}?w=400&auto=format)` : SWATCH[w.id] }}
              />
            </Choice>
          ))}
        </div>
      </Group>
      <Group title="Layout" hint="Where the app launcher lives.">
        <div className="grid max-w-md grid-cols-2 gap-4">
          {layouts.map((l) => (
            <Choice key={l.id} selected={layout === l.id} onClick={() => setLayout(l.id)} label={l.label}>
              <span className="relative block aspect-video bg-[radial-gradient(circle_at_70%_20%,#1d2640,#06080f)]">
                {l.id === "dock" ? (
                  <>
                    <span className="absolute inset-x-0 top-0 h-2 bg-white/15" />
                    <span className="absolute bottom-1.5 left-1/2 flex h-3 w-1/2 -translate-x-1/2 gap-0.5 rounded bg-white/15 p-0.5">
                      {Array.from({ length: 6 }, (_, i) => (
                        <span key={i} className="flex-1 rounded-[2px] bg-white/30" />
                      ))}
                    </span>
                  </>
                ) : (
                  <span className="absolute inset-x-0 bottom-0 flex h-3 items-center gap-0.5 bg-white/15 px-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className="size-2 rounded-[2px] bg-white/30" />
                    ))}
                    <span className="ml-auto h-1 w-4 rounded bg-white/30" />
                  </span>
                )}
              </span>
            </Choice>
          ))}
        </div>
      </Group>
    </>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex max-w-lg cursor-pointer items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 p-3.5">
      <span>
        <span className="block text-sm text-fg">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-6 w-10 shrink-0 rounded-full bg-line-strong transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
    </label>
  );
}

function SoundMotion() {
  const sound = useSettings((s) => s.sound);
  const setSound = useSettings((s) => s.setSound);
  const reduceMotion = useSettings((s) => s.reduceMotion);
  const setReduceMotion = useSettings((s) => s.setReduceMotion);
  const customCursor = useSettings((s) => s.customCursor);
  const setCustomCursor = useSettings((s) => s.setCustomCursor);
  const saver = useSettings((s) => s.screensaverMinutes);
  const setSaver = useSettings((s) => s.setScreensaverMinutes);
  const restoreWindows = useSettings((s) => s.restoreWindows);
  const setRestoreWindows = useSettings((s) => s.setRestoreWindows);
  return (
    <>
      <Group title="Windows">
        <Toggle
          label="Reopen windows from my last visit"
          hint="Windows also remember where you moved and resized them."
          checked={restoreWindows}
          onChange={setRestoreWindows}
        />
      </Group>
      <Group title="Sound">
        <Toggle
          label="UI sounds"
          hint="Soft synthesized chimes when opening apps and receiving notifications."
          checked={sound}
          onChange={(v) => {
            setSound(v);
            if (v) setTimeout(() => play("notify"), 50);
          }}
        />
      </Group>
      <Group title="Cursor">
        <Toggle
          label="Crescent cursor"
          hint="A moon-shaped pointer with a stardust trail (mouse and trackpad only)."
          checked={customCursor}
          onChange={setCustomCursor}
        />
      </Group>
      <Group title="Screensaver" hint="A drifting moon after you've been idle, then the lock screen.">
        <div className="flex max-w-lg flex-wrap gap-2">
          {[0, 1, 3, 5, 10].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={saver === m}
              onClick={() => setSaver(m)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                saver === m ? "border-accent bg-accent/15 text-fg" : "border-line text-muted hover:text-fg"
              }`}
            >
              {m === 0 ? "Never" : `${m} min`}
            </button>
          ))}
        </div>
      </Group>
      <Group title="Motion">
        <Toggle
          label="Reduce motion"
          hint="Turns off most animations."
          checked={reduceMotion}
          onChange={setReduceMotion}
        />
      </Group>
    </>
  );
}

function AboutOS() {
  const now = useNow(60_000);
  const { source } = useContent();
  const restart = usePower((s) => s.restart);
  const phase = now ? moonPhase(now) : 0;
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex items-center gap-4">
        <LogoMark size={64} />
        <div>
          <h2 className="font-display text-lg tracking-[0.2em] text-fg uppercase">MoonOS</h2>
          <p className="text-sm text-muted">Version 1.0 “Crescent”</p>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted">Built with</dt>
        <dd className="text-fg">Next.js, React, TypeScript, Tailwind CSS, Zustand, Motion</dd>
        <dt className="text-muted">Content</dt>
        <dd className="text-fg">{source === "cms" ? "Sanity (live)" : "Built-in defaults"}</dd>
        <dt className="text-muted">Tonight</dt>
        <dd className="flex items-center gap-2 text-fg">
          <MoonGlyph phase={phase} size={16} />
          {now ? `${moonPhaseName(phase)}, ${Math.round(moonIllumination(phase) * 100)}% lit` : "…"}
        </dd>
      </dl>
      <div>
        <Button icon={RotateCcw} onClick={restart}>Replay boot sequence</Button>
      </div>
    </div>
  );
}
