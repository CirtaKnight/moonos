import { defineArrayMember, defineField, defineType } from "sanity";

/** Folder colors offered in the admin (kept in the lunar palette). */
export const FOLDER_COLORS = [
  { title: "Moonlight blue", value: "#8ea7dc" },
  { title: "Silver", value: "#bccbeb" },
  { title: "Old gold", value: "#c8a96f" },
  { title: "Rose", value: "#f29fb8" },
  { title: "Mint", value: "#9fe0b8" },
  { title: "Lilac", value: "#d6b6e8" },
  { title: "Ember", value: "#e8a6a6" },
];

const ITEM_KINDS = [
  { title: "PDF document", value: "pdf" },
  { title: "Image", value: "image" },
  { title: "Video file", value: "video" },
  { title: "YouTube / Vimeo video", value: "embed" },
  { title: "Link", value: "link" },
  { title: "Text note", value: "note" },
];

export const projectItem = defineType({
  name: "projectItem",
  title: "File",
  type: "object",
  fields: [
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: { list: ITEM_KINDS, layout: "radio", direction: "horizontal" },
      initialValue: "image",
      validation: (r) => r.required(),
    }),
    defineField({ name: "title", title: "File name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "caption", type: "string" }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.kind !== "image",
    }),
    defineField({
      name: "file",
      title: "File upload",
      type: "file",
      description: "PDF or video file. For long videos, prefer a YouTube / Vimeo link to save bandwidth.",
      options: { accept: "application/pdf,video/*" },
      hidden: ({ parent }) => parent?.kind !== "pdf" && parent?.kind !== "video",
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      hidden: ({ parent }) => parent?.kind !== "link" && parent?.kind !== "embed",
    }),
    defineField({
      name: "text",
      title: "Note text",
      type: "text",
      rows: 10,
      hidden: ({ parent }) => parent?.kind !== "note",
    }),
  ],
  preview: {
    select: { title: "title", kind: "kind", media: "image" },
    prepare: ({ title, kind, media }) => ({
      title,
      subtitle: ITEM_KINDS.find((k) => k.value === kind)?.title,
      media,
    }),
  },
});

export const project = defineType({
  name: "project",
  title: "Project (desktop folder)",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      description: "Used in shareable links, e.g. /?open=project/my-app",
      options: { source: "title", maxLength: 64 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "summary", type: "string", description: "One line, shown in lists and search." }),
    defineField({ name: "description", type: "text", rows: 5 }),
    defineField({ name: "tags", type: "array", of: [{ type: "string" }], options: { layout: "tags" } }),
    defineField({ name: "date", type: "date", options: { dateFormat: "MMMM YYYY" } }),
    defineField({ name: "cover", title: "Cover image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "color",
      title: "Folder color",
      type: "string",
      options: { list: FOLDER_COLORS },
      initialValue: "#8ea7dc",
    }),
    defineField({
      name: "order",
      title: "Desktop order",
      type: "number",
      description: "Lower numbers appear first on the desktop.",
      initialValue: 10,
    }),
    defineField({
      name: "archived",
      title: "Move to Recycle Bin",
      type: "boolean",
      description: "Hides the folder from the desktop and shows it in the Recycle Bin instead.",
      initialValue: false,
    }),
    defineField({
      name: "items",
      title: "Folder contents",
      type: "array",
      of: [defineArrayMember({ type: "projectItem" })],
    }),
  ],
  orderings: [{ title: "Desktop order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", subtitle: "summary", media: "cover", archived: "archived" },
    prepare: ({ title, subtitle, media, archived }) => ({
      title: archived ? `🗑 ${title}` : title,
      subtitle,
      media,
    }),
  },
});
