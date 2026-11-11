import { defineQuery } from "next-sanity";

/** Everything the OS needs, in one round trip. Asset references are resolved to URLs. */
export const OS_CONTENT_QUERY = defineQuery(`{
  "profile": *[_id == "profile"][0]{
    name, handle, title, shortBio, bio, skills, location, email, available, githubUsername,
    "avatarUrl": avatar.asset->url,
    "cvUrl": cv.asset->url,
    education[]{ school, degree, period }
  },
  "projects": *[_type == "project" && defined(slug.current)] | order(order asc, date desc){
    "id": _id,
    "slug": slug.current,
    title, summary, description, tags, date, color, "repoUrl": repo, place,
    "archived": coalesce(archived, false),
    "publishedAt": _createdAt,
    "coverUrl": cover.asset->url,
    "items": items[]{
      "id": _key, kind, title, caption, text,
      "url": select(
        kind == "image" => image.asset->url,
        kind in ["pdf", "video"] => file.asset->url,
        url
      ),
      "width": image.asset->metadata.dimensions.width,
      "height": image.asset->metadata.dimensions.height
    }
  },
  "media": *[_type == "media"] | order(order asc, _createdAt desc){
    "id": _id, kind, title, caption,
    "url": select(kind == "image" => image.asset->url, kind == "video" => file.asset->url, url),
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height
  },
  "socials": *[_type == "social"] | order(order asc){ "id": _id, platform, handle, url, description },
  "tracks": *[_type == "track" && defined(audio.asset)] | order(order asc){
    "id": _id, title, artist, "url": audio.asset->url
  },
  "announcements": *[_type == "announcement" && publishedAt <= now() && (!defined(expiresAt) || expiresAt > now())]
    | order(publishedAt desc)[0...20]{ "id": _id, title, body, url, linkLabel, "source": coalesce(source, "generic"), publishedAt },
  "events": *[_type == "event" && defined(start)] | order(start desc){
    "id": _id, title, "kind": coalesce(kind, "other"), start, end, location, url, description,
    "projectSlug": project->slug.current, place
  },
  "experiences": *[_type == "experience"] | order(start desc){
    "id": _id, role, organization, kind, start, end, place, description, skills, url,
    "logoUrl": logo.asset->url
  },
  "settings": *[_id == "siteSettings"][0]{
    welcomeNote, bootLines, weatherCity,
    "wallpapers": wallpapers[]{ "id": _key, name, "url": image.asset->url }
  }
}`);
