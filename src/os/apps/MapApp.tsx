"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Briefcase, Calendar, FolderOpen, MapPin, Rocket, X } from "lucide-react";
import type { Map as MLMap, Marker } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { useContent } from "../content/ContentProvider";
import { buildPins, pinBounds, type Pin, type PinKind } from "../lib/pins";
import { play } from "../lib/sound";
import { unlock } from "../store/achievements";
import { openApp, openProject } from "./launch";
import type { AppId } from "./registry";
import type { AppProps } from "./types";

/** CARTO's free dark basemap (attribution is part of the style). */
const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
/** Below this zoom the globe is small enough for the moon to come within reach. */
const MOON_ZOOM = 1.15;

const KIND: Record<PinKind, { label: string; color: string; icon: typeof MapPin }> = {
  project: { label: "Projects", color: "#8ea7dc", icon: FolderOpen },
  experience: { label: "Experience", color: "#c8a96f", icon: Briefcase },
  event: { label: "Events", color: "#9fe0b8", icon: Calendar },
};

function runPin(pin: Pin) {
  const a = pin.action;
  if (!a) return;
  if (a.type === "project") openProject({ slug: a.slug, title: a.title });
  else if (a.type === "app") openApp(a.app as AppId);
  else window.open(a.href, "_blank", "noopener,noreferrer");
}

/** The Map: where projects, hackathons and experiences happened, on a night-side globe. */
export function MapApp(_props: AppProps) {
  void _props;
  const content = useContent();
  const pins = useMemo(() => buildPins(content), [content]);
  const [filter, setFilter] = useState<PinKind | "all">("all");
  const [selected, setSelected] = useState<Pin | null>(null);
  const [zoom, setZoom] = useState(2);
  const [landed, setLanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<Map<string, { marker: Marker; pin: Pin }>>(new Map());

  const visible = filter === "all" ? pins : pins.filter((p) => p.kind === filter);

  // Create the map once.
  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    const markers = markersRef.current;
    (async () => {
      const maplibre = await import("maplibre-gl");
      if (disposed || !containerRef.current) return;
      // The worker bundle is copied into public/ by scripts/copy-maplibre-worker.mjs.
      maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      const bounds = pinBounds(pins, 4);
      const map = new maplibre.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: bounds ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2] : [8, 30],
        zoom: 1.8,
        minZoom: 0.3,
        maxZoom: 15,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });
      mapRef.current = map;
      map.on("error", (e) => {
        // A missing tile is fine; a style that never loads means the basemap is unreachable.
        if (!map.isStyleLoaded() && String(e.error?.message ?? "").includes("style")) setFailed(true);
      });
      map.on("style.load", () => {
        map.setProjection({ type: "globe" });
        if (bounds && pins.length > 1) map.fitBounds(bounds, { padding: 60, duration: 0, maxZoom: 6 });
      });
      map.on("zoom", () => setZoom(map.getZoom()));
      ro = new ResizeObserver(() => map.resize());
      ro.observe(containerRef.current);
    })().catch(() => setFailed(true));
    return () => {
      disposed = true;
      ro?.disconnect();
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The map is created once; pins are synced by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers with the filter.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const maplibre = await import("maplibre-gl");
      const map = mapRef.current;
      if (cancelled || !map) return;
      const wanted = new Set(visible.map((p) => p.id));
      for (const [id, { marker }] of markersRef.current) {
        if (!wanted.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }
      for (const pin of visible) {
        if (markersRef.current.has(pin.id)) continue;
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", `${pin.title} — ${pin.place.name ?? pin.label}`);
        el.className = "moon-pin";
        el.style.setProperty("--pin", KIND[pin.kind].color);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          setSelected(pin);
          map.flyTo({ center: [pin.place.lng, pin.place.lat], zoom: Math.max(map.getZoom(), 5), speed: 1.4 });
        });
        const marker = new maplibre.Marker({ element: el }).setLngLat([pin.place.lng, pin.place.lat]).addTo(map);
        markersRef.current.set(pin.id, { marker, pin });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const focus = (pin: Pin) => {
    setSelected(pin);
    mapRef.current?.flyTo({ center: [pin.place.lng, pin.place.lat], zoom: 6, speed: 1.4 });
  };

  const moonReach = Math.max(0, Math.min(1, (MOON_ZOOM + 0.6 - zoom) / 0.6));

  return (
    <div className="relative flex h-full">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface-2 sm:flex">
        <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
          {(["all", "project", "experience", "event"] as const).filter((k) => k === "all" || pins.some((p) => p.kind === k)).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                filter === k ? "border-accent/60 bg-accent/15 text-fg" : "border-line text-muted hover:text-fg"
              }`}
            >
              {k === "all" ? `All · ${pins.length}` : KIND[k].label}
            </button>
          ))}
        </div>
        <ul className="scroll-area min-h-0 flex-1 p-2">
          {visible.map((p) => {
            const K = KIND[p.kind];
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => focus(p)}
                  className={`flex w-full items-start gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-surface-hover ${
                    selected?.id === p.id ? "bg-surface-hover" : ""
                  }`}
                >
                  <K.icon size={15} className="mt-0.5 shrink-0" style={{ color: K.color }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-fg">{p.title}</span>
                    <span className="block truncate text-xs text-muted">{[p.place.name, p.dateText].filter(Boolean).join(" · ")}</span>
                  </span>
                </button>
              </li>
            );
          })}
          {!visible.length && (
            <li className="p-3 text-sm leading-relaxed text-muted">
              No pins yet. Places appear here as projects, hackathons and experiences get a map pin.
              <span className="mt-2 block text-xs text-faint">Psst: zoom all the way out.</span>
            </li>
          )}
        </ul>
      </aside>

      {/* Map */}
      <div className="moon-map relative min-w-0 flex-1 overflow-hidden">
        {/* MapLibre forces its container to position:relative, so it fills an absolute wrapper. */}
        <div className="absolute inset-0" onClick={() => setSelected(null)}>
          <div ref={containerRef} className="h-full w-full" />
        </div>
        {failed && (
          <p className="absolute inset-x-4 top-4 rounded-lg bg-danger/15 px-3 py-2 text-xs text-danger">
            The map tiles couldn&apos;t load. Check your connection and reopen the Map.
          </p>
        )}

        {/* The moon drifts into reach as the Earth gets small. */}
        <button
          type="button"
          aria-label="The Moon"
          aria-hidden={moonReach === 0}
          tabIndex={moonReach > 0.6 ? 0 : -1}
          onClick={() => {
            if (moonReach < 0.6) return;
            play("notify");
            unlock("one-small-step");
            setLanded(true);
          }}
          className="absolute right-[8%] top-[10%] rounded-full transition-[opacity,transform] duration-500"
          style={{
            opacity: moonReach,
            transform: `scale(${0.6 + moonReach * 0.4})`,
            pointerEvents: moonReach > 0.6 ? "auto" : "none",
            filter: "drop-shadow(0 0 24px rgb(233 236 243 / 0.35))",
          }}
        >
          <span className="relative block size-[72px] overflow-hidden rounded-full bg-[radial-gradient(circle_at_34%_30%,#f4f6fa,#c3c9d6_55%,#7d8494)] shadow-[inset_-10px_-8px_18px_rgb(0_0_0/0.35)]">
            {[
              [22, 30, 14],
              [52, 18, 9],
              [58, 52, 18],
              [28, 62, 10],
            ].map(([x, y, d], i) => (
              <span
                key={i}
                className="absolute rounded-full bg-[radial-gradient(circle_at_40%_35%,#9aa1b0,#c7ccd7)] shadow-[inset_1px_2px_3px_rgb(0_0_0/0.3)]"
                style={{ left: `${x}%`, top: `${y}%`, width: d, height: d }}
              />
            ))}
          </span>
        </button>

        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="glass absolute inset-x-3 bottom-3 rounded-2xl border border-line-strong p-4 shadow-window sm:right-auto sm:w-80"
            >
              <button type="button" aria-label="Close" onClick={() => setSelected(null)} className="absolute top-2 right-2 grid size-7 place-items-center rounded-md text-muted hover:bg-surface-hover hover:text-fg">
                <X size={14} />
              </button>
              <p className="text-[11px] tracking-wide uppercase" style={{ color: KIND[selected.kind].color }}>
                {selected.label}
              </p>
              <h3 className="mt-0.5 pr-6 font-semibold text-fg">{selected.title}</h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                {selected.place.name && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} /> {selected.place.name}
                  </span>
                )}
                {selected.dateText && <span>{selected.dateText}</span>}
              </p>
              {selected.subtitle && <p className="mt-2 line-clamp-3 text-[13px] text-fg/85">{selected.subtitle}</p>}
              {selected.action && (
                <button type="button" onClick={() => runPin(selected)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
                  {selected.action.type === "url" ? "Learn more" : "Open"} <ArrowUpRight size={12} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{landed && <MoonBase key="base" onLeave={() => setLanded(false)} />}</AnimatePresence>
      </div>
    </div>
  );
}

/** The easter egg: a quiet moon base. */
function MoonBase({ onLeave }: { onLeave: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-10 overflow-hidden bg-[#030409]"
      role="dialog"
      aria-label="Moon base"
    >
      {/* Earth hanging in the black sky */}
      <div className="absolute top-[12%] right-[14%] size-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,#7fa6e6,#23406f_60%,#0b1428)] shadow-[0_0_40px_rgb(127_166_230/0.35)]" />
      {/* Lunar surface */}
      <div className="absolute inset-x-[-20%] bottom-[-55%] h-[100%] rounded-[50%] bg-[radial-gradient(ellipse_at_50%_20%,#c9ced8,#8c93a3_45%,#4b505c)]">
        {[
          [22, 14, 9],
          [48, 9, 5],
          [63, 18, 12],
          [36, 26, 6],
          [76, 11, 4],
        ].map(([x, y, r], i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[radial-gradient(circle_at_40%_35%,#6d7382,#a7adba)] shadow-[inset_2px_3px_6px_rgb(0_0_0/0.35)]"
            style={{ left: `${x}%`, top: `${y}%`, width: `${r}%`, aspectRatio: "1" }}
          />
        ))}
      </div>
      {/* Flag */}
      <svg className="absolute bottom-[28%] left-[44%] h-28 w-24" viewBox="0 0 96 112" aria-hidden>
        <line x1="10" y1="8" x2="10" y2="112" stroke="#d9dde6" strokeWidth="3" />
        <path d="M11 10 H86 V54 H11 Z" fill="#0b0f1a" stroke="#c8a96f" strokeWidth="1.5" />
        <path d="M58 22 A15 15 0 1 0 58 44 A12 12 0 1 1 58 22 Z" fill="#e9ecf3" />
        <path d="M51 33 l2-4 2 4-2 4Z M48 33 l5-1.5 5 1.5-5 1.5Z" fill="#c8a96f" />
      </svg>
      <div className="absolute inset-x-0 top-[16%] flex flex-col items-center gap-2 px-6 text-center">
        <Rocket size={22} className="text-[#c8a96f]" />
        <h3 className="font-display text-xl tracking-[0.25em] text-[#e9ecf3] uppercase">One small step</h3>
        <p className="max-w-sm text-sm text-[#a8b0c2]">
          You zoomed out far enough to reach the moon. Base population: one developer, zero bugs (allegedly). Achievement unlocked.
        </p>
        <button type="button" onClick={onLeave} className="mt-2 rounded-full bg-[#bccbeb] px-4 py-1.5 text-sm font-medium text-[#0a0f1c]">
          Back to Earth
        </button>
      </div>
    </motion.div>
  );
}
