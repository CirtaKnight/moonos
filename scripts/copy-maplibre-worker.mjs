// Copies MapLibre's web-worker bundle into public/ so the Map app can load it by URL.
// Runs on install and before dev/build, so it always matches the installed version.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const outDir = join(root, "public", "maplibre");
if (!existsSync(src)) {
  console.warn("[maplibre] worker not found, skipping copy");
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, "maplibre-gl-worker.mjs"));
console.log("[maplibre] worker copied to public/maplibre/");
