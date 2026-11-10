import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { SANITY_TAG } from "@/sanity/client";

/**
 * Sanity webhook target: called on every publish/unpublish/delete.
 * Marks CMS content stale so the next visit shows the change — no redeploy needed.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "SANITY_REVALIDATE_SECRET is not set" }, { status: 500 });
  }
  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret, true);
    if (!isValidSignature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }
    revalidateTag(SANITY_TAG, "max");
    return NextResponse.json({ revalidated: true, type: body?._type ?? null, now: Date.now() });
  } catch (err) {
    console.error("[revalidate]", err);
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}
