import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Resume, ResumeEntry } from "../lib/resume";

/**
 * The recruiter one-pager, rendered server-side with @react-pdf/renderer.
 * Light and print-friendly; content is trimmed so it always fits on one A4 page.
 */

const INK = "#141826";
const MUTED = "#5b6478";
const FAINT = "#8a91a3";
const ACCENT = "#3b5797";
const GOLD = "#a8884a";
const RULE = "#dfe3ec";

const s = StyleSheet.create({
  page: { paddingVertical: 36, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 9.2, color: INK, lineHeight: 1.4 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: RULE },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  name: { fontFamily: "Helvetica-Bold", fontSize: 22, letterSpacing: 0.4, lineHeight: 1.2 },
  title: { fontSize: 11, color: MUTED, marginTop: 4, lineHeight: 1.2 },
  meta: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, fontSize: 8.6, color: MUTED },
  metaItem: { marginRight: 12 },
  available: { color: "#2f7d52" },
  columns: { flexDirection: "row", gap: 22, marginTop: 16 },
  main: { flex: 1 },
  side: { width: 158 },
  section: { marginBottom: 14 },
  h2: { fontFamily: "Helvetica-Bold", fontSize: 7.8, letterSpacing: 1.4, color: ACCENT, marginBottom: 6, textTransform: "uppercase" },
  summary: { fontSize: 10, marginBottom: 4 },
  para: { color: MUTED },
  entry: { marginBottom: 8 },
  entryHead: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  entryTitle: { fontFamily: "Helvetica-Bold", flex: 1 },
  org: { fontFamily: "Helvetica", color: MUTED },
  period: { fontSize: 8, color: FAINT },
  small: { fontSize: 8, color: FAINT, marginTop: 1 },
  desc: { color: MUTED, marginTop: 2 },
  link: { color: ACCENT, textDecoration: "none" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  chip: { fontSize: 8, borderWidth: 0.6, borderColor: RULE, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1.5 },
  sideLink: { marginBottom: 4 },
  sideLabel: { fontSize: 7.4, color: FAINT },
  footer: { position: "absolute", bottom: 22, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7.4, color: FAINT },
  moon: { color: GOLD },
});

function clip(text: string | undefined, max: number) {
  if (!text) return "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : t;
}

/** Sanity images can be WebP/AVIF; ask the CDN for a small JPEG that react-pdf can embed. */
function pdfAvatar(url?: string) {
  if (!url || !/^https:\/\/cdn\.sanity\.io\//.test(url)) return undefined;
  return `${url.split("?")[0]}?w=160&h=160&fit=crop&fm=jpg`;
}

function Entry({ e, withSkills }: { e: ResumeEntry; withSkills?: boolean }) {
  return (
    <View style={s.entry} wrap={false}>
      <View style={s.entryHead}>
        <Text style={s.entryTitle}>
          {e.title}
          <Text style={s.org}> · {e.org}</Text>
        </Text>
        {e.period ? <Text style={s.period}>{e.period}</Text> : null}
      </View>
      {e.place ? <Text style={s.small}>{e.place}</Text> : null}
      {e.description ? <Text style={s.desc}>{clip(e.description, 230)}</Text> : null}
      {withSkills && e.skills.length ? <Text style={s.small}>{e.skills.slice(0, 8).join(" · ")}</Text> : null}
    </View>
  );
}

export function ResumeDocument({ resume: r, siteUrl }: { resume: Resume; siteUrl?: string }) {
  const avatar = pdfAvatar(r.avatarUrl);
  const experience = r.experience.slice(0, 4);
  const projects = r.projects.slice(0, experience.length >= 3 ? 3 : 4);
  const about = r.about.length ? clip(r.about.join(" "), experience.length ? 420 : 640) : "";

  return (
    <Document title={`${r.name} — Résumé`} author={r.name} subject={r.title} creator="MoonOS" producer="MoonOS">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {avatar ? <Image src={avatar} style={s.avatar} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{r.name}</Text>
            <Text style={s.title}>{r.title}</Text>
            <View style={s.meta}>
              {r.location ? <Text style={s.metaItem}>{r.location}</Text> : null}
              {r.available ? <Text style={[s.metaItem, s.available]}>Open to opportunities</Text> : null}
              {r.links
                .filter((l) => l.label === "Email" || l.label === "Portfolio")
                .map((l) => (
                  <Link key={l.href} src={l.href} style={[s.metaItem, s.link]}>
                    {l.display}
                  </Link>
                ))}
            </View>
          </View>
        </View>

        <View style={s.columns}>
          <View style={s.main}>
            <View style={s.section}>
              <Text style={s.h2}>Profile</Text>
              <Text style={s.summary}>{r.summary}</Text>
              {about ? <Text style={s.para}>{about}</Text> : null}
            </View>

            {experience.length > 0 && (
              <View style={s.section}>
                <Text style={s.h2}>Experience</Text>
                {experience.map((e, i) => (
                  <Entry key={i} e={e} withSkills />
                ))}
              </View>
            )}

            <View style={s.section}>
              <Text style={s.h2}>Projects</Text>
              {projects.length ? (
                projects.map((p) => (
                  <View key={p.slug} style={s.entry} wrap={false}>
                    <View style={s.entryHead}>
                      <Link src={p.pageUrl || `/projects/${p.slug}`} style={[s.entryTitle, s.link]}>
                        {p.title}
                      </Link>
                      {p.date ? <Text style={s.period}>{p.date}</Text> : null}
                    </View>
                    {p.summary ? <Text style={s.desc}>{clip(p.summary, 180)}</Text> : null}
                    {p.tags.length ? <Text style={s.small}>{p.tags.slice(0, 7).join(" · ")}</Text> : null}
                    {p.repoUrl ? (
                      <Link src={p.repoUrl} style={[s.small, s.link]}>
                        {p.repoUrl.replace(/^https?:\/\//, "")}
                      </Link>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={s.para}>The first projects are on their way.</Text>
              )}
            </View>
          </View>

          <View style={s.side}>
            {r.skills.length > 0 && (
              <View style={s.section}>
                <Text style={s.h2}>Skills</Text>
                <View style={s.chips}>
                  {r.skills.slice(0, 26).map((k) => (
                    <Text key={k} style={s.chip}>
                      {k}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {r.education.length > 0 && (
              <View style={s.section}>
                <Text style={s.h2}>Education</Text>
                {r.education.slice(0, 3).map((e, i) => (
                  <View key={i} style={s.entry} wrap={false}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>{e.title}</Text>
                    <Text style={s.para}>{e.org}</Text>
                    {e.period ? <Text style={s.period}>{e.period}</Text> : null}
                  </View>
                ))}
              </View>
            )}

            {r.links.length > 0 && (
              <View style={s.section}>
                <Text style={s.h2}>Links</Text>
                {r.links.slice(0, 7).map((l) => (
                  <View key={l.href} style={s.sideLink}>
                    <Text style={s.sideLabel}>{l.label}</Text>
                    <Link src={l.href} style={s.link}>
                      {l.display}
                    </Link>
                  </View>
                ))}
              </View>
            )}

            {r.github && (
              <View style={s.section}>
                <Text style={s.h2}>Activity</Text>
                <Text style={s.para}>
                  {r.github.total.toLocaleString("en")} GitHub contributions in the last year, across {r.github.activeDays} days.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>
            Generated by <Text style={s.moon}>MoonOS</Text>{siteUrl ? ` · ${siteUrl.replace(/^https?:\/\//, "")}` : ""}
          </Text>
          <Text>Updated {new Date().toISOString().slice(0, 10)}</Text>
        </View>
      </Page>
    </Document>
  );
}
