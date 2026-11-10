import type { Metadata } from "next";
import Link from "next/link";
import { getOSContent } from "@/os/content/getContent";

export const metadata: Metadata = {
  title: "Projects",
  description: "Projects by CirtaKnight, computer science engineering student.",
};

export default async function ProjectsIndex() {
  const { profile, projects } = await getOSContent();
  const visible = projects.filter((p) => !p.archived);
  return (
    <>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-2 text-muted">
        {profile.name} — {profile.title}. {profile.shortBio}
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {visible.map((p) => (
          <li key={p.slug}>
            <Link href={`/projects/${p.slug}`} className="block rounded-2xl border border-line bg-surface-2 p-5 transition-colors hover:border-accent/60">
              <h2 className="text-lg font-medium">{p.title}</h2>
              {p.summary && <p className="mt-1 text-sm text-muted">{p.summary}</p>}
              {p.tags.length > 0 && <p className="mt-2 text-xs text-faint">{p.tags.join(" · ")}</p>}
            </Link>
          </li>
        ))}
        {!visible.length && <li className="text-muted">The first projects are on their way.</li>}
      </ul>
    </>
  );
}
