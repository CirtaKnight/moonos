import Link from "next/link";
import { LogoMark, Wordmark } from "@/os/components/Logo";

/**
 * Plain, crawlable pages for search engines, screen readers and people who prefer them.
 * The body is fixed (no page scroll for the OS), so this layout scrolls internally.
 */
export default function ProjectsLayout({ children }: LayoutProps<"/projects">) {
  return (
    <div className="selectable fixed inset-0 overflow-y-auto bg-bg text-fg">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
        <Link href="/projects" className="flex items-center gap-3">
          <LogoMark size={30} />
          <Wordmark className="text-sm" />
        </Link>
        <Link href="/" className="rounded-full border border-line px-4 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-fg">
          Boot MoonOS →
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-20">{children}</main>
    </div>
  );
}
