import type { Place } from "../content/types";

/** Parse a CMS map pin `{ name, coordinates: "lat, lng" }` into a Place, or undefined. */
export function parsePlace(raw: unknown): Place | undefined {
  const r = raw as { name?: unknown; coordinates?: unknown } | null | undefined;
  if (!r || typeof r.coordinates !== "string") return undefined;
  const parts = r.coordinates.split(",").map((n) => Number(n.trim()));
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [lat, lng] = parts;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  return { lat, lng, name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : undefined };
}
