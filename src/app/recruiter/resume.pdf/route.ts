import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { connection } from "next/server";
import { createElement, type ReactElement } from "react";
import { getOSContent } from "@/os/content/getContent";
import { buildResume } from "@/os/lib/resume";
import { ResumeDocument } from "@/os/pdf/ResumeDocument";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/** The recruiter one-pager as a real PDF, generated on request from the CMS content. */
export async function GET() {
  await connection();
  const content = await getOSContent();
  const resume = buildResume(content, SITE);
  const doc = createElement(ResumeDocument, { resume, siteUrl: SITE }) as unknown as ReactElement<DocumentProps>;
  const pdf = await renderToBuffer(doc);
  const filename = `${resume.name.replace(/[^\w .-]+/g, "")} - Resume.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      // Short CDN cache: cheap to serve, still reflects CMS edits within minutes.
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
