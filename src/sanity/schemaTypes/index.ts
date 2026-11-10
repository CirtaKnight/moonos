import { media, siteSettings, social, track } from "./misc";
import { profile } from "./profile";
import { project, projectItem } from "./project";

export const schemaTypes = [profile, project, projectItem, media, social, track, siteSettings];

/** Documents that exist exactly once; edited from fixed entries in the Studio sidebar. */
export const SINGLETONS = ["profile", "siteSettings"] as const;
