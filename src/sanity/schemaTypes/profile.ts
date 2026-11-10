import { defineArrayMember, defineField, defineType } from "sanity";

export const profile = defineType({
  name: "profile",
  title: "Profile (About me)",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "handle", type: "string", description: "Used in the terminal prompt, e.g. cirtaknight" }),
    defineField({ name: "title", title: "Headline", type: "string", description: "e.g. Computer Science Engineering Student" }),
    defineField({ name: "avatar", title: "Photo", type: "image", options: { hotspot: true } }),
    defineField({ name: "shortBio", title: "Short bio", type: "string", description: "One sentence." }),
    defineField({
      name: "bio",
      title: "About me",
      type: "array",
      description: "One entry per paragraph.",
      of: [{ type: "text", rows: 4 }],
    }),
    defineField({ name: "skills", type: "array", of: [{ type: "string" }], options: { layout: "tags" } }),
    defineField({
      name: "education",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "educationEntry",
          fields: [
            defineField({ name: "school", type: "string" }),
            defineField({ name: "degree", type: "string" }),
            defineField({ name: "period", type: "string", description: "e.g. 2023 – 2028" }),
          ],
          preview: { select: { title: "degree", subtitle: "school" } },
        }),
      ],
    }),
    defineField({ name: "location", type: "string" }),
    defineField({
      name: "email",
      type: "string",
      description: "Optional. Shown publicly in About me. Leave empty to only use the contact form.",
    }),
    defineField({ name: "cv", title: "CV / Résumé (PDF)", type: "file", options: { accept: "application/pdf" } }),
    defineField({ name: "available", title: "Open to opportunities", type: "boolean", initialValue: true }),
  ],
  preview: { select: { title: "name", subtitle: "title", media: "avatar" } },
});
