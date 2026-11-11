import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Download, FileText, Mail, MapPin, Monitor } from "lucide-react";
import { Avatar } from "@/os/components/Avatar";
import { LogoMark, Wordmark } from "@/os/components/Logo";
import { MoonHeatmap } from "@/os/components/MoonHeatmap";
import { SocialIcon } from "@/os/components/SocialIcon";
import { getOSContent } from "@/os/content/getContent";
import { buildResume, RESUME_PDF_PATH, type ResumeEntry } from "@/os/lib/resume";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getOSContent();
  return {
    title: `${profile.name} — Recruiter view`,
    description: `${profile.title}. ${profile.shortBio}`,
    alternates: { canonical: "/recruiter" },
  };
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/**
 * Recruiter mode: everything that matters on one plain, fast, printable page —
 * no boot, no windows. Same CMS content as the OS, plus a generated one-page PDF.
 */
export default async function RecruiterPage() {
  const content = await getOSContent();
  const r = buildResume(content, SITE);
  const email = r.links.find((l) => l.label === "Email");

  return (
    <div className="recruiter selectable fixed inset-0 overflow-y-auto bg-bg text-fg">
      <header className="recruiter-bar sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="MoonOS home">
            <LogoMark size={26} />
            <Wordmark className="hidden text-xs sm:inline" />
          </Link>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] tracking-wide text-muted">Recruiter view</span>
          <nav className="ml-auto flex items-center gap-2" aria-label="Actions">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-fg sm:inline-flex"
            >
              <Monitor size={14} /> Explore MoonOS
            </Link>
            <a
              href={RESUME_PDF_PATH}
              download={`${r.name} - Resume.pdf`}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-ink transition-colors hover:bg-[#d3ddf3]"
            >
              <Download size={14} /> One-page PDF
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12">
        {/* Identity */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <Avatar profile={content.profile} size={84} />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl tracking-[0.06em] sm:text-4xl">{r.name}</h1>
            <p className="mt-1 text-lg text-muted">{r.title}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {r.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} /> {r.location}
                </span>
              )}
              {r.available && (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <span className="size-2 rounded-full bg-success" aria-hidden /> Open to opportunities
                </span>
              )}
            </p>
          </div>
          <a
            href={email ? email.href : "/?open=app/mail"}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-accent/20 sm:self-center"
          >
            <Mail size={16} /> Get in touch
          </a>
        </section>

        {r.links.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Links">
            {r.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/60 hover:text-fg"
                >
                  <SocialIcon platform={l.label === "Email" ? "email" : l.label === "Portfolio" ? "website" : l.label} size={14} />
                  {l.display}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_17rem] md:gap-12">
          <div className="flex min-w-0 flex-col gap-10">
            <Section title="Profile">
              <p className="text-[17px] leading-relaxed text-fg">{r.summary}</p>
              {r.about.map((p, i) => (
                <p key={i} className="mt-3 leading-relaxed text-muted">
                  {p}
                </p>
              ))}
            </Section>

            {r.experience.length > 0 && (
              <Section title="Experience">
                <Timeline entries={r.experience} />
              </Section>
            )}

            <Section title="Projects">
              {r.projects.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {r.projects.slice(0, 6).map((p) => (
                    <li key={p.slug} className="flex flex-col rounded-2xl border border-line bg-surface-2 p-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link href={`/projects/${p.slug}`} className="font-medium text-fg hover:text-accent">
                          {p.title}
                        </Link>
                        {p.date && <span className="shrink-0 font-mono text-[11px] text-faint">{p.date}</span>}
                      </div>
                      {p.summary && <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.summary}</p>}
                      {p.tags.length > 0 && <p className="mt-3 text-xs text-faint">{p.tags.slice(0, 6).join(" · ")}</p>}
                      <p className="mt-auto flex gap-4 pt-3 text-xs">
                        <Link href={`/?open=project/${p.slug}`} className="text-accent hover:underline">
                          Open in MoonOS
                        </Link>
                        {p.repoUrl && (
                          <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-accent hover:underline">
                            Code <ArrowUpRight size={11} />
                          </a>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">The first projects are on their way.</p>
              )}
              {r.projects.length > 6 && (
                <Link href="/projects" className="mt-3 inline-block text-sm text-accent hover:underline">
                  All {r.projects.length} projects →
                </Link>
              )}
            </Section>
          </div>

          <aside className="flex flex-col gap-10">
            {r.skills.length > 0 && (
              <Section title="Skills">
                <ul className="flex flex-wrap gap-1.5">
                  {r.skills.map((s) => (
                    <li key={s} className="rounded-md border border-line px-2 py-0.5 text-sm text-fg/90">
                      {s}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {r.education.length > 0 && (
              <Section title="Education">
                <Timeline entries={r.education} compact />
              </Section>
            )}

            {r.github && (
              <Section title="Coding activity">
                <p className="text-sm text-muted">
                  <span className="text-fg">{r.github.total.toLocaleString("en")}</span> GitHub contributions over the last year, on{" "}
                  <span className="text-fg">{r.github.activeDays}</span> days.
                </p>
                <div className="mt-3 overflow-hidden">
                  <MoonHeatmap days={content.contributions} cell={11} weeks={20} showMonths={false} />
                </div>
              </Section>
            )}

            <Section title="Documents">
              <ul className="flex flex-col gap-1.5 text-sm">
                <li>
                  <a href={RESUME_PDF_PATH} download={`${r.name} - Resume.pdf`} className="inline-flex items-center gap-2 text-accent hover:underline">
                    <Download size={14} /> One-page summary (PDF)
                  </a>
                </li>
                {r.cvUrl && (
                  <li>
                    <a href={r.cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-accent hover:underline">
                      <FileText size={14} /> Full résumé (PDF)
                    </a>
                  </li>
                )}
              </ul>
            </Section>
          </aside>
        </div>

        <footer className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-sm text-faint sm:flex-row sm:items-center">
          <p>This page and the PDF are generated from the same content as MoonOS, so they are always up to date.</p>
          <Link href="/" className="text-muted hover:text-fg">
            Boot the full experience →
          </Link>
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Timeline({ entries, compact }: { entries: ResumeEntry[]; compact?: boolean }) {
  return (
    <ol className="flex flex-col gap-5 border-l border-line pl-5">
      {entries.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border border-accent/60 bg-bg" aria-hidden />
          <div className={compact ? "" : "flex flex-wrap items-baseline justify-between gap-x-4"}>
            <h3 className="font-medium text-fg">
              {e.title}
              <span className="text-muted"> · {e.url ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{e.org}</a> : e.org}</span>
            </h3>
            {e.period && <p className="font-mono text-xs text-faint">{e.period}</p>}
          </div>
          {e.place && <p className="mt-0.5 text-xs text-faint">{e.place}</p>}
          {e.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{e.description}</p>}
          {!compact && e.skills.length > 0 && <p className="mt-2 text-xs text-faint">{e.skills.join(" · ")}</p>}
        </li>
      ))}
    </ol>
  );
}
