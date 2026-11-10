"use client";

import { Download, ExternalLink, Mail } from "lucide-react";
import { useContent } from "../content/ContentProvider";
import { openApp } from "./launch";
import type { AppProps } from "./types";
import { Button, EmptyState } from "./ui";

export function CV(_props: AppProps) {
  void _props;
  const { profile } = useContent();
  if (!profile.cvUrl) {
    return (
      <EmptyState
        title="Résumé coming soon"
        phase={0.4}
        action={
          <Button variant="primary" icon={Mail} onClick={() => openApp("mail")}>
            Ask me for it
          </Button>
        }
      >
        The latest version is being polished. Meanwhile, the About me app has the essentials.
      </EmptyState>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <p className="mr-auto truncate text-sm text-muted">{profile.name} — Résumé.pdf</p>
        <Button href={profile.cvUrl} icon={ExternalLink}>Open</Button>
        <Button href={`${profile.cvUrl}?dl=${encodeURIComponent(`${profile.name} - CV.pdf`)}`} icon={Download} variant="primary" download>
          Download
        </Button>
      </div>
      <object data={`${profile.cvUrl}#view=FitH`} type="application/pdf" className="min-h-0 w-full flex-1 bg-white">
        <EmptyState title="Preview unavailable">Use Open or Download above to read the résumé.</EmptyState>
      </object>
    </div>
  );
}
