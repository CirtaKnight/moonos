import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOSContent } from "@/os/content/getContent";

export async function generateStaticParams() {
  const { projects } = await getOSContent();
  return projects.filter((p) => !p.archived).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getOSContent()).projects.find((x) => x.slug === slug);
  if (!p) return { title: "Project not found" };
  return {
    title: p.title,
    description: p.summary ?? p.description?.slice(0, 160),
    openGraph: { title: `${p.title} · MoonOS`, description: p.summary, images: p.coverUrl ? [{ url: `${p.coverUrl}?w=1200&h=630&fit=crop` }] : undefined },
  };
}

const KIND: Record<string, string> = { pdf: "PDF", image: "Image", video: "Video", embed: "Video", link: "Link", note: "Note" };

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = (await getOSContent()).projects.find((x) => x.slug === slug && !x.archived);
  if (!p) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    description: p.summary ?? p.description,
    keywords: p.tags.join(", "),
    ...(p.repo ? { codeRepository: p.repo.url } : {}),
  };
  return (
    <article className="mt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/projects" className="text-sm text-muted hover:text-fg">
        ← All projects
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{p.title}</h1>
      {p.summary && <p className="mt-2 text-lg text-muted">{p.summary}</p>}
      {p.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
          {p.tags.map((t) => (
            <li key={t} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
              {t}
            </li>
          ))}
        </ul>
      )}
      {p.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${p.coverUrl}?w=1400&auto=format`} alt="" className="mt-6 w-full rounded-2xl border border-line" />
      )}
      {p.description && <p className="mt-6 leading-relaxed whitespace-pre-line text-fg/90">{p.description}</p>}
      {p.repo && (
        <p className="mt-6 text-sm text-muted">
          Source:{" "}
          <a href={p.repo.url} className="text-accent hover:underline" rel="noopener noreferrer">
            {p.repo.fullName}
          </a>
          {p.repo.stars != null && ` · ★ ${p.repo.stars}`}
          {p.repo.language && ` · ${p.repo.language}`}
        </p>
      )}
      {p.items.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">Files</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
            {p.items.map((it) => (
              <li key={it.id} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 w-12 shrink-0 font-mono text-[11px] text-faint">{KIND[it.kind]}</span>
                <div className="min-w-0">
                  {it.url ? (
                    <a href={it.url} className="text-fg hover:text-accent" rel="noopener noreferrer">
                      {it.title}
                    </a>
                  ) : (
                    <span>{it.title}</span>
                  )}
                  {it.caption && <p className="text-sm text-muted">{it.caption}</p>}
                  {it.kind === "note" && it.text && <pre className="mt-2 font-mono text-xs whitespace-pre-wrap text-muted">{it.text}</pre>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link
        href={`/?open=project/${p.slug}`}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink"
      >
        Open in MoonOS →
      </Link>
    </article>
  );
}
