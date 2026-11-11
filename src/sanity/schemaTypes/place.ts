import { defineArrayMember, defineField, defineType } from "sanity";

/** "36.365, 6.6147" — what you get from right-click → copy coordinates in any map app. */
export const COORDINATES_RE = /^\s*-?\d{1,2}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?\s*$/;

/** A pin on the Map app. */
export const place = defineType({
  name: "place",
  title: "Map pin",
  type: "object",
  fields: [
    defineField({ name: "name", title: "Place name", type: "string", description: "e.g. Constantine, Algeria" }),
    defineField({
      name: "coordinates",
      title: "Coordinates",
      type: "string",
      description: "Latitude, longitude. In Google Maps: right-click the spot → click the coordinates to copy them.",
      validation: (r) =>
        r.custom((v) => {
          if (!v) return true;
          if (!COORDINATES_RE.test(v)) return 'Use "latitude, longitude", e.g. 36.365, 6.6147';
          const [lat, lng] = v.split(",").map((n) => Number(n.trim()));
          return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? true : "Latitude must be within ±90 and longitude within ±180";
        }),
    }),
  ],
  options: { collapsible: true, collapsed: false },
});

export const experience = defineType({
  name: "experience",
  title: "Experience",
  type: "document",
  fields: [
    defineField({ name: "role", type: "string", validation: (r) => r.required(), description: "e.g. Software engineering intern" }),
    defineField({ name: "organization", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Internship", value: "internship" },
          { title: "Job", value: "job" },
          { title: "Freelance", value: "freelance" },
          { title: "Club / association", value: "club" },
          { title: "Volunteering", value: "volunteering" },
          { title: "Education", value: "education" },
        ],
      },
      initialValue: "internship",
      validation: (r) => r.required(),
    }),
    defineField({ name: "start", type: "date", validation: (r) => r.required() }),
    defineField({ name: "end", type: "date", description: "Leave empty if ongoing." }),
    defineField({ name: "place", type: "place" }),
    defineField({ name: "description", type: "text", rows: 4 }),
    defineField({ name: "skills", type: "array", of: [defineArrayMember({ type: "string" })], options: { layout: "tags" } }),
    defineField({ name: "url", title: "Link", type: "url" }),
    defineField({ name: "logo", type: "image" }),
  ],
  orderings: [{ title: "Most recent", name: "recent", by: [{ field: "start", direction: "desc" }] }],
  preview: {
    select: { title: "role", org: "organization", start: "start", media: "logo" },
    prepare: ({ title, org, start, media }) => ({ title, subtitle: [org, start?.slice(0, 4)].filter(Boolean).join(" · "), media }),
  },
});
