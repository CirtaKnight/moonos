import type { MetadataRoute } from "next";
import { getContent } from "@/os/content/getContent";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { projects } = await getContent();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/projects`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/recruiter`, changeFrequency: "weekly", priority: 0.9 },
    ...projects
      .filter((p) => !p.archived)
      .map((p) => ({ url: `${base}/projects/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
