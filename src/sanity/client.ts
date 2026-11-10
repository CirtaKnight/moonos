import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/** Read-only client for published content (dataset is public; CDN-backed). */
export const client = createClient({
  projectId: projectId || "unset",
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

/** Cache tag shared by all CMS reads; the webhook route revalidates it. */
export const SANITY_TAG = "sanity";
