import type { OSContent } from "../content/types";

export const DEFAULT_GITHUB_USER = "CirtaKnight";
export const SOURCE_REPO = "moonos";

/** The owner's GitHub username: explicit profile field, else parsed from the GitHub social link. */
export function githubUser(content: Pick<OSContent, "profile" | "socials">): string {
  if (content.profile.githubUsername) return content.profile.githubUsername;
  const gh = content.socials.find((s) => /github\.com/i.test(s.url));
  const m = gh?.url.match(/github\.com\/([A-Za-z0-9-]+)/i);
  return m?.[1] ?? DEFAULT_GITHUB_USER;
}

export const sourceUrl = (content: Pick<OSContent, "profile" | "socials">) =>
  `https://github.com/${githubUser(content)}/${SOURCE_REPO}`;

export const shareUrl = (open: string) =>
  typeof window === "undefined" ? `/?open=${open}` : `${window.location.origin}/?open=${open}`;

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt("Copy this:", text);
    return false;
  }
}
