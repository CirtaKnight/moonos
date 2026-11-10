import "server-only";
import { fallbackContent } from "./fallback";
import type { OSContent } from "./types";

/**
 * Loads OS content. Uses the CMS when configured, otherwise the built-in defaults,
 * so the site always renders — even before the admin is set up.
 */
export async function getContent(): Promise<OSContent> {
  return fallbackContent;
}
