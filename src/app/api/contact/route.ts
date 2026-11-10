import { type NextRequest, NextResponse } from "next/server";
import { escapeHtml, validateContact } from "@/os/lib/contact";

/**
 * Contact form endpoint → email via Resend's HTTP API.
 * Host-agnostic (no Netlify Forms), so the site can move hosts freely.
 *
 * Env: RESEND_API_KEY, CONTACT_TO_EMAIL, optional CONTACT_FROM_EMAIL
 * (defaults to Resend's onboarding sender until a domain is verified).
 */

// Best-effort, per-instance rate limit: 3 messages per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    return NextResponse.json({ error: "Mail isn't configured yet." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = validateContact(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });
  const { name, email, subject, message, website } = result.data;

  // Bots fill the honeypot; pretend success so they don't retry.
  if (website) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL ?? "MoonOS <onboarding@resend.dev>",
      to: [to],
      reply_to: email,
      subject: `[Portfolio] ${subject || `Message from ${name}`}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    }),
  });

  if (!res.ok) {
    console.error("[contact] Resend error", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "The message couldn't be sent. Please try again later." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
