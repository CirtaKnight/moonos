/**
 * Shareable URLs: `?open=project/<slug>` or `?open=<appId>`.
 * Parsing is pure so it can be tested; the hook in useDeepLinks applies it.
 */
export type DeepLink = { kind: "project"; slug: string } | { kind: "app"; app: string } | { kind: "quick" };

export function parseDeepLink(search: string, knownApps: readonly string[]): DeepLink | null {
  const params = new URLSearchParams(search);
  if (params.has("quick")) return { kind: "quick" };
  const open = params.get("open")?.trim();
  if (!open) return null;
  const [head, ...rest] = open.split("/");
  if (head === "project" && rest[0]) return { kind: "project", slug: rest.join("/") };
  const app = head === "app" ? rest[0] : head;
  return app && knownApps.includes(app) ? { kind: "app", app } : null;
}

/** The `open` value describing a window, or null for windows that aren't worth sharing. */
export function linkFor(appId: string, params: Record<string, unknown>): string | null {
  if (appId === "folder" && typeof params.slug === "string") return `project/${params.slug}`;
  if (["viewer", "note"].includes(appId)) return typeof params.slug === "string" ? `project/${params.slug}` : null;
  return appId;
}
