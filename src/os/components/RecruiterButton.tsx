import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { RECRUITER_PATH } from "../lib/resume";

/**
 * The always-visible way out to the one-page recruiter view. Gold, so it reads as the
 * one call to action in an otherwise silver shell.
 */
export function RecruiterButton({ size = "md", className = "" }: { size?: "sm" | "md"; className?: string }) {
  const sm = size === "sm";
  return (
    <a
      href={RECRUITER_PATH}
      data-recruiter-button
      onClick={(e) => e.stopPropagation()}
      className={`group inline-flex shrink-0 items-center rounded-full bg-gold font-semibold text-[#1a1406] shadow-[0_0_20px_-4px_rgb(200_169_111/0.75)] transition-colors hover:bg-[#dcc08a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
        sm ? "h-7 gap-1.5 px-2.5 text-xs" : "h-8 gap-2 px-3.5 text-[13px]"
      } ${className}`}
    >
      <BriefcaseBusiness size={sm ? 13 : 14} aria-hidden />
      For recruiters
      <ArrowRight size={sm ? 12 : 13} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
    </a>
  );
}
