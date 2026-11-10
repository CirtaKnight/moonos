import { defineArrayMember, defineField, defineType } from "sanity";

export const media = defineType({
  name: "media",
  title: "Gallery & Videos",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Image (Gallery)", value: "image" },
          { title: "Video file (Videos)", value: "video" },
          { title: "YouTube / Vimeo (Videos)", value: "embed" },
        ],
        layout: "radio",
      },
      initialValue: "image",
      validation: (r) => r.required(),
    }),
    defineField({ name: "image", type: "image", options: { hotspot: true }, hidden: ({ parent }) => parent?.kind !== "image" }),
    defineField({ name: "file", type: "file", options: { accept: "video/*" }, hidden: ({ parent }) => parent?.kind !== "video" }),
    defineField({ name: "url", title: "URL", type: "url", hidden: ({ parent }) => parent?.kind !== "embed" }),
    defineField({ name: "caption", type: "string" }),
    defineField({ name: "order", type: "number", initialValue: 10 }),
  ],
  preview: { select: { title: "title", subtitle: "kind", media: "image" } },
});

export const social = defineType({
  name: "social",
  title: "Socials (Browser)",
  type: "document",
  fields: [
    defineField({ name: "platform", type: "string", description: "e.g. GitHub, LinkedIn, Instagram", validation: (r) => r.required() }),
    defineField({ name: "handle", type: "string", description: "e.g. @cirtaknight" }),
    defineField({ name: "url", title: "URL", type: "url", validation: (r) => r.required() }),
    defineField({ name: "description", type: "string" }),
    defineField({ name: "order", type: "number", initialValue: 10 }),
  ],
  preview: { select: { title: "platform", subtitle: "handle" } },
});

export const track = defineType({
  name: "track",
  title: "Music",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "artist", type: "string" }),
    defineField({
      name: "audio",
      type: "file",
      description: "Use music you own or that is royalty-free.",
      options: { accept: "audio/*" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "order", type: "number", initialValue: 10 }),
  ],
  preview: { select: { title: "title", subtitle: "artist" } },
});

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "welcomeNote",
      title: "Welcome.txt",
      type: "text",
      rows: 8,
      description: "The note shown in Welcome.txt on the desktop.",
    }),
    defineField({
      name: "bootLines",
      title: "Boot lines",
      type: "array",
      description:
        'Lines typed during boot. Prefix with "ok|", "warn|", "info|" or "dim|" to style them, e.g. "ok|Started Coffee.service".',
      of: [{ type: "string" }],
    }),
    defineField({
      name: "wallpapers",
      title: "Extra wallpapers",
      type: "array",
      description: "Added to the built-in wallpapers in Settings.",
      of: [
        defineArrayMember({
          type: "object",
          name: "wallpaper",
          fields: [
            defineField({ name: "name", type: "string", validation: (r) => r.required() }),
            defineField({ name: "image", type: "image", validation: (r) => r.required() }),
          ],
          preview: { select: { title: "name", media: "image" } },
        }),
      ],
    }),
    defineField({
      name: "weatherCity",
      title: "Weather city",
      type: "object",
      description: "Shown in the weather widget. Find coordinates on any map.",
      fields: [
        defineField({ name: "name", type: "string" }),
        defineField({ name: "latitude", type: "number" }),
        defineField({ name: "longitude", type: "number" }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});

export const announcement = defineType({
  name: "announcement",
  title: "Announcements (notifications)",
  type: "document",
  description: "Shown as a notification to visitors — e.g. a new LinkedIn post, a certificate or an award.",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "body", title: "Text", type: "string" }),
    defineField({ name: "url", title: "Link", type: "url", description: "e.g. your LinkedIn post." }),
    defineField({ name: "linkLabel", title: "Link label", type: "string", initialValue: "Open" }),
    defineField({
      name: "source",
      title: "Icon",
      type: "string",
      options: {
        list: [
          { title: "LinkedIn", value: "linkedin" },
          { title: "GitHub", value: "github" },
          { title: "Trophy / award", value: "trophy" },
          { title: "Calendar / event", value: "calendar" },
          { title: "Star", value: "star" },
          { title: "MoonOS", value: "generic" },
        ],
        layout: "radio",
      },
      initialValue: "linkedin",
    }),
    defineField({ name: "publishedAt", title: "Publish date", type: "datetime", initialValue: () => new Date().toISOString(), validation: (r) => r.required() }),
    defineField({ name: "expiresAt", title: "Hide after", type: "datetime", description: "Optional." }),
  ],
  orderings: [{ title: "Newest", name: "newest", by: [{ field: "publishedAt", direction: "desc" }] }],
  preview: { select: { title: "title", subtitle: "body" } },
});

export const agendaEvent = defineType({
  name: "event",
  title: "Agenda",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Project", value: "project" },
          { title: "Event", value: "event" },
          { title: "Hackathon", value: "hackathon" },
          { title: "Competition", value: "competition" },
          { title: "Talk / workshop", value: "talk" },
          { title: "Exam", value: "exam" },
          { title: "Other", value: "other" },
        ],
      },
      initialValue: "event",
      validation: (r) => r.required(),
    }),
    defineField({ name: "start", type: "date", validation: (r) => r.required() }),
    defineField({ name: "end", type: "date", description: "Optional, for multi-day items." }),
    defineField({ name: "location", type: "string" }),
    defineField({ name: "url", title: "Link", type: "url" }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({ name: "project", title: "Related project", type: "reference", to: [{ type: "project" }] }),
  ],
  orderings: [{ title: "Date", name: "date", by: [{ field: "start", direction: "desc" }] }],
  preview: {
    select: { title: "title", start: "start", kind: "kind" },
    prepare: ({ title, start, kind }) => ({ title, subtitle: [start, kind].filter(Boolean).join(" · ") }),
  },
});
