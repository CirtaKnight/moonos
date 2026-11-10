export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = "2025-10-01";

/** False until the Sanity env vars are set — the site then runs on built-in content. */
export const isSanityConfigured = Boolean(projectId);
