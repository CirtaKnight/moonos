"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { SINGLETONS, schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

const singletons = new Set<string>(SINGLETONS);

export default defineConfig({
  name: "moonos",
  title: "MoonOS · Admin",
  basePath: "/admin",
  projectId,
  dataset,
  apiVersion,
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    // Singletons can't be created from "New document".
    templates: (templates) => templates.filter(({ schemaType }) => !singletons.has(schemaType)),
  },
  document: {
    // Singletons can't be duplicated or deleted.
    actions: (input, context) =>
      singletons.has(context.schemaType)
        ? input.filter(({ action }) => action && ["publish", "discardChanges", "restore"].includes(action))
        : input,
  },
});
