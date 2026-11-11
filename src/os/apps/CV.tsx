"use client";

import { Download, ExternalLink, PanelsTopLeft } from "lucide-react";
import { useContent } from "../content/ContentProvider";
import { RECRUITER_PATH, RESUME_PDF_PATH } from "../lib/resume";
import type { AppProps } from "./types";
import { Button, EmptyState } from "./ui";

/**
 * The uploaded résumé when there is one, otherwise the one-pager generated from the CMS
 * content (same file as the recruiter view's PDF), so this app is never empty.
 */
export function CV(_props: AppProps) {
  void _props;
  const { profile } = useContent();
  const uploaded = profile.cvUrl;
  const src = uploaded ?? RESUME_PDF_PATH;
  const filename = `${profile.name} - ${uploaded ? "CV" : "Resume"}.pdf`;
  const downloadHref = uploaded ? `${uploaded}?dl=${encodeURIComponent(filename)}` : RESUME_PDF_PATH;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <p className="mr-auto truncate text-sm text-muted">
          {uploaded ? `${profile.name} — Résumé.pdf` : `${profile.name} — One-page summary`}
        </p>
        <Button href={RECRUITER_PATH} icon={PanelsTopLeft}>
          Recruiter view
        </Button>
        <Button href={src} icon={ExternalLink}>
          Open
        </Button>
        <Button href={downloadHref} icon={Download} variant="primary" download={filename}>
          Download
        </Button>
      </div>
      <object data={`${src}#view=FitH`} type="application/pdf" className="min-h-0 w-full flex-1 bg-white">
        <EmptyState title="Preview unavailable">Use Open or Download above to read the résumé, or the recruiter view for a quick summary.</EmptyState>
      </object>
    </div>
  );
}
