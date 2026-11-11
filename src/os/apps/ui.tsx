import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MoonGlyph } from "../components/MoonGlyph";

/** Shared building blocks for app windows. */

export function Scroll({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`scroll-area selectable h-full ${className ?? ""}`}>{children}</div>;
}

export function EmptyState({
  title,
  children,
  phase = 0.12,
  action,
}: {
  title: string;
  children?: ReactNode;
  phase?: number;
  action?: ReactNode;
}) {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div className="flex max-w-xs flex-col items-center gap-3">
        <MoonGlyph phase={phase} size={44} className="text-accent" />
        <h3 className="font-medium text-fg">{title}</h3>
        {children && <p className="text-sm leading-relaxed text-muted">{children}</p>}
        {action}
      </div>
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11.5px] text-muted">
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  href,
  icon: Icon,
  variant = "secondary",
  download,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
  /** true, or the suggested filename. */
  download?: boolean | string;
}) {
  const cls = `inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors ${
    variant === "primary"
      ? "bg-accent text-accent-ink hover:bg-accent-strong"
      : "border border-line bg-surface-2 text-fg hover:border-line-strong hover:bg-surface-hover"
  }`;
  const content = (
    <>
      {Icon && <Icon size={15} />}
      {children}
    </>
  );
  if (href)
    return (
      <a
        href={href}
        className={cls}
        target={download ? undefined : "_blank"}
        rel="noopener noreferrer"
        download={download || undefined}
      >
        {content}
      </a>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{children}</h3>;
}

export function formatMonth(date?: string) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
