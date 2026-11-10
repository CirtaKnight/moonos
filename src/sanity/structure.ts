import type { StructureResolver } from "sanity/structure";

/** Admin sidebar: singletons first as fixed entries, then the collections. */
export const structure: StructureResolver = (S) =>
  S.list()
    .title("MoonOS")
    .items([
      S.listItem()
        .title("Profile (About me)")
        .id("profile")
        .child(S.document().schemaType("profile").documentId("profile").title("Profile")),
      S.divider(),
      S.documentTypeListItem("project").title("Projects (desktop folders)"),
      S.documentTypeListItem("media").title("Gallery & Videos"),
      S.documentTypeListItem("social").title("Socials (Browser)"),
      S.documentTypeListItem("track").title("Music"),
      S.documentTypeListItem("event").title("Agenda"),
      S.documentTypeListItem("announcement").title("Announcements"),
      S.divider(),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings").title("Site settings")),
    ]);
