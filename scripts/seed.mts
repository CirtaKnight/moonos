/**
 * Seeds the Sanity dataset with the built-in starter content (profile, settings,
 * the "CirtaKnight OS" project and the GitHub social) so it's all editable in /admin.
 * Idempotent: existing documents are left untouched.
 *
 *   node --env-file=.env.local scripts/seed.ts
 */
import { createClient } from "@sanity/client";
import { fallbackContent } from "../src/os/content/fallback.ts";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN (see .env.local)");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2025-10-01",
  token,
  useCdn: false,
});

const { profile, settings, projects, socials } = fallbackContent;
const key = (i: number) => `k${i.toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const tx = client.transaction();

tx.createIfNotExists({
  _id: "profile",
  _type: "profile",
  name: profile.name,
  handle: profile.handle,
  title: profile.title,
  shortBio: profile.shortBio,
  bio: profile.bio,
  skills: profile.skills,
  education: profile.education.map((e, i) => ({ _key: key(i), _type: "educationEntry", ...e })),
  available: profile.available,
});

tx.createIfNotExists({
  _id: "siteSettings",
  _type: "siteSettings",
  welcomeNote: settings.welcomeNote,
  bootLines: settings.bootLines,
});

for (const p of projects) {
  tx.createIfNotExists({
    _id: `project-${p.slug}`,
    _type: "project",
    title: p.title,
    slug: { _type: "slug", current: p.slug },
    summary: p.summary,
    description: p.description,
    tags: p.tags,
    date: "2026-11-01",
    color: p.color,
    order: 0,
    archived: false,
    items: p.items.map((it, i) => ({
      _key: key(i),
      _type: "projectItem",
      kind: it.kind,
      title: it.title,
      ...(it.text ? { text: it.text } : {}),
      ...(it.url ? { url: it.url } : {}),
    })),
  });
}

for (const s of socials) {
  tx.createIfNotExists({
    _id: `social-${s.id}`,
    _type: "social",
    platform: s.platform,
    handle: s.handle,
    url: s.url,
    description: s.description,
    order: 0,
  });
}

const res = await tx.commit();
console.log(`Seeded ${res.results.length} documents into ${projectId}.`);
