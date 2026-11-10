/**
 * Converts a YouTube or Vimeo page URL into a privacy-friendly embed URL.
 * Returns null for anything else.
 */
export function toEmbedUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
    const m = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(?:\/video)?\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}?dnt=1` : null;
  }
  return null;
}

/** Short display form of a URL, e.g. "github.com/cirtaknight". */
export function prettyUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
  } catch {
    return raw;
  }
}
