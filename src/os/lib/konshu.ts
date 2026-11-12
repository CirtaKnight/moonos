import type { OSContent } from "../content/types";
import { splitTimeline } from "./agenda";

/**
 * Konshu's local brain: recognises common questions about the site and its owner, answers
 * from the CMS content, and proposes actions (open an app, a project, a link). Anything it
 * doesn't recognise confidently is handed to the remote model.
 */
export type KonshuAction =
  | { type: "app"; app: string; label: string }
  | { type: "project"; slug: string; title: string; label: string }
  | { type: "url"; href: string; label: string };

export interface KonshuReply {
  text: string;
  actions: KonshuAction[];
  /** False when the question should go to the remote model. */
  confident: boolean;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+#\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const has = (q: string, words: string[]) => words.some((w) => new RegExp(`\\b${w}`).test(q));
const list = (items: string[], max = 6) =>
  items.length <= max ? items.join(", ") : `${items.slice(0, max).join(", ")} and ${items.length - max} more`;

interface Intent {
  id: string;
  match: (q: string) => boolean;
  answer: (c: OSContent, q: string) => Omit<KonshuReply, "confident">;
}

const APP_GUIDES: Record<string, { words: string[]; app: string; text: string }> = {
  moonword: { words: ["moonword", "word game", "wordle"], app: "moonword", text: "Moonword is the daily 5-letter word game: developer and space vocabulary, the same word for everyone each day." },
  keystroke: { words: ["keystroke", "typing"], app: "keystroke", text: "Keystroke is a typing test on real code snippets: it measures your WPM and accuracy." },
  drift: { words: ["lunar drift", "drift"], app: "game", text: "Lunar Drift: steer the crescent, catch stardust, dodge meteors." },
  orbit: { words: ["orbit game", "orbit"], app: "orbit", text: "Orbit is a one-tap game: hop between rings around the moon and dodge the debris." },
  memory: { words: ["memory", "phase memory"], app: "memory", text: "Phase memory: flip cards and match the moon phases in as few moves as possible." },
  terminal: { words: ["terminal", "command line", "shell"], app: "terminal", text: "The Terminal understands real commands: try `help`, `ls`, `whoami` or `neofetch`." },
  map: { words: ["map", "locations", "places", "on a map"], app: "map", text: "The Map shows where projects, hackathons and experiences happened." },
  trophies: { words: ["trophies", "trophy", "achievement", "secret", "easter egg"], app: "trophies", text: "There are achievements to unlock all over MoonOS, some of them secret. Trophies tracks them. (A hint: the Map hides one if you zoom out far enough.)" },
  settings: { words: ["settings", "wallpaper", "cursor", "screensaver"], app: "settings", text: "Settings lets you change the wallpaper, layout (dock or taskbar), sounds, cursor and screensaver." },
  agenda: { words: ["agenda", "calendar", "upcoming", "hackathon", "events"], app: "agenda", text: "" },
};

const INTENTS: Intent[] = [
  {
    id: "greeting",
    match: (q) => /^(hi|hello|hey|yo|salut|bonjour|good (morning|evening))\b/.test(q) && q.split(" ").length <= 4,
    answer: (c) => ({
      text: `Hello, traveller. I'm Konshu, keeper of this night sky. Ask me about ${c.profile.name}'s projects, experience or how to get in touch, or how anything here works.`,
      actions: [],
    }),
  },
  {
    id: "help",
    match: (q) => has(q, ["help", "what can (you|i) do", "how does (this|it) work", "guide", "lost", "navigate"]),
    answer: () => ({
      text: "MoonOS works like a desktop: double-click icons, drag windows, right-click for menus. Press Ctrl+K to search everything, ? for shortcuts. On a phone, tap icons and swipe up to go home. What are you looking for?",
      actions: [
        { type: "app", app: "projects", label: "Projects" },
        { type: "app", app: "about", label: "About" },
        { type: "app", app: "mail", label: "Contact" },
      ],
    }),
  },
  {
    id: "konshu",
    match: (q) => has(q, ["who are you", "your name", "konshu", "are you (an? )?(ai|bot|robot)"]),
    answer: () => ({
      text: "I'm Konshu, the moon-watcher of MoonOS. I know my way around this desktop and its owner's work. For anything I don't know by heart, I ask an AI model, and only from what's on this site.",
      actions: [],
    }),
  },
  {
    id: "recruiter",
    match: (q) => has(q, ["recruiter", "recruiting", "hiring", "summary", "one page", "one-page", "tl dr", "tldr", "in a hurry", "quick overview"]),
    answer: (c) => ({
      text: `In a hurry? The recruiter view sums ${c.profile.name} up on one page — profile, experience, projects and skills — with a one-page PDF to download.`,
      actions: [
        { type: "url", href: "/recruiter", label: "Recruiter view" },
        { type: "app", app: "cv", label: "Open Résumé" },
      ],
    }),
  },
  {
    id: "who",
    match: (q) => has(q, ["who (are|is) (you|he|she|they|cirtaknight|the owner)", "about (you|him|her|them)", "introduce", "tell me about"]) && !has(q, ["konshu"]),
    answer: (c) => ({
      text: `${c.profile.name} is a ${c.profile.title.toLowerCase()}. ${c.profile.shortBio}`,
      actions: [{ type: "app", app: "about", label: "Open About me" }],
    }),
  },
  {
    id: "projects",
    match: (q) => has(q, ["project", "portfolio", "work(s|ed)? on", "built", "build", "made"]),
    answer: (c) => {
      const ps = c.projects.filter((p) => !p.archived);
      if (!ps.length) return { text: "The first projects are on their way. Check back soon!", actions: [] };
      return {
        text: `There ${ps.length === 1 ? "is 1 project" : `are ${ps.length} projects`}: ${list(ps.map((p) => p.title))}. Each one is a folder on the desktop.`,
        actions: [
          ...ps.slice(0, 3).map<KonshuAction>((p) => ({ type: "project", slug: p.slug, title: p.title, label: p.title })),
          { type: "app", app: "projects", label: "All projects" },
        ],
      };
    },
  },
  {
    id: "experience",
    match: (q) => has(q, ["experience", "intern", "job", "worked (at|for)", "career", "company", "companies"]),
    answer: (c) => {
      if (!c.experiences.length)
        return { text: "No experiences are listed yet. The About me app and Résumé have the essentials.", actions: [{ type: "app", app: "cv", label: "Open Résumé" }] };
      return {
        text: `Experience: ${list(c.experiences.map((x) => `${x.role} at ${x.organization}`), 4)}.`,
        actions: [
          { type: "app", app: "map", label: "See them on the Map" },
          { type: "app", app: "cv", label: "Open Résumé" },
        ],
      };
    },
  },
  {
    id: "skills",
    match: (q) => has(q, ["skill", "stack", "tech", "language", "framework", "know how", "tools"]),
    answer: (c) => ({
      text: c.profile.skills.length ? `Skills include ${list(c.profile.skills, 10)}.` : "Skills are listed in About me.",
      actions: [
        { type: "app", app: "skills", label: "Skills constellation" },
        { type: "app", app: "about", label: "About me" },
      ],
    }),
  },
  {
    id: "cv",
    match: (q) => has(q, ["cv", "resume", "curriculum"]),
    answer: (c) => ({
      text: c.profile.cvUrl
        ? "Here's the résumé. You can read it here or download the PDF — there's also a one-page recruiter view."
        : "Here's a one-page summary generated from the portfolio, ready to download. The recruiter view has the same on a web page.",
      actions: [
        { type: "app", app: "cv", label: "Open Résumé" },
        { type: "url", href: "/recruiter", label: "Recruiter view" },
      ],
    }),
  },
  {
    id: "contact",
    match: (q) => has(q, ["contact", "email", "mail", "reach", "hire", "message", "get in touch", "talk to"]),
    answer: (c) => ({
      text: `The fastest way to reach ${c.profile.name} is the Mail app: write a message and it lands straight in their inbox.${c.profile.email ? ` You can also email ${c.profile.email}.` : ""}`,
      actions: [
        { type: "app", app: "mail", label: "Open Mail" },
        { type: "app", app: "browser", label: "Socials" },
      ],
    }),
  },
  {
    id: "socials",
    match: (q) => has(q, ["github", "linkedin", "social", "instagram", "twitter", "online"]),
    answer: (c) => ({
      text: c.socials.length ? `Find ${c.profile.name} on ${list(c.socials.map((s) => s.platform))}.` : "Socials will appear in the Browser app soon.",
      actions: [
        ...c.socials.slice(0, 3).map<KonshuAction>((s) => ({ type: "url", href: s.url, label: s.platform })),
        { type: "app", app: "browser", label: "All links" },
      ],
    }),
  },
  {
    id: "education",
    match: (q) => has(q, ["study", "studies", "student", "school", "university", "education", "degree"]),
    answer: (c) => ({
      text: c.profile.education.length
        ? `Education: ${list(c.profile.education.map((e) => `${e.degree} (${e.school}${e.period ? `, ${e.period}` : ""})`), 3)}.`
        : `${c.profile.name} is a ${c.profile.title.toLowerCase()}.`,
      actions: [{ type: "app", app: "about", label: "About me" }],
    }),
  },
  {
    id: "games",
    match: (q) => has(q, ["game", "play", "bored", "fun"]),
    answer: () => ({
      text: "There's a whole Games folder: Moonword (daily word), Keystroke (code typing), Lunar Drift, Orbit and Phase memory. All originals.",
      actions: [
        { type: "app", app: "games", label: "Open Games" },
        { type: "app", app: "moonword", label: "Today's Moonword" },
      ],
    }),
  },
];

export function localAnswer(question: string, content: OSContent, now = new Date()): KonshuReply {
  const q = norm(question);
  if (!q) return { text: "Ask me anything about this site.", actions: [], confident: true };

  // Specific apps first ("what is moonword", "open the terminal").
  for (const g of Object.values(APP_GUIDES)) {
    if (!has(q, g.words)) continue;
    if (g.app === "agenda") {
      const { upcoming } = splitTimeline(content.events, now);
      const text = upcoming.length
        ? `Next up: ${list(upcoming.map((e) => `${e.title} (${e.start.slice(0, 10)})`), 3)}.`
        : "Nothing is planned on the agenda right now. Past events are in the Agenda's timeline.";
      return { text, actions: [{ type: "app", app: "agenda", label: "Open Agenda" }], confident: true };
    }
    return { text: g.text, actions: [{ type: "app", app: g.app, label: "Open it" }], confident: true };
  }

  // A project mentioned by name.
  const project = content.projects.find((p) => !p.archived && q.includes(norm(p.title)) && norm(p.title).length > 2);
  if (project) {
    return {
      text: `${project.title}${project.summary ? `: ${project.summary}` : ""}${project.tags.length ? ` Built with ${list(project.tags, 5)}.` : ""}`,
      actions: [{ type: "project", slug: project.slug, title: project.title, label: `Open ${project.title}` }],
      confident: true,
    };
  }

  for (const intent of INTENTS) {
    if (intent.match(q)) return { ...intent.answer(content, q), confident: true };
  }
  return {
    text: "Hmm, the stars are quiet on that one. Try asking about projects, experience, skills or how to contact.",
    actions: [{ type: "app", app: "projects", label: "Projects" }],
    confident: false,
  };
}

/** Action tokens the remote model may append: [[app:projects]], [[project:slug]], [[url:https://…]]. */
export function extractActions(text: string, content: OSContent): { text: string; actions: KonshuAction[] } {
  const actions: KonshuAction[] = [];
  const clean = text.replace(/\[\[(app|project|url):([^\]]+)\]\]/g, (_, kind: string, value: string) => {
    const v = value.trim();
    if (kind === "app") actions.push({ type: "app", app: v, label: `Open ${v}` });
    else if (kind === "project") {
      const p = content.projects.find((x) => x.slug === v);
      if (p) actions.push({ type: "project", slug: p.slug, title: p.title, label: `Open ${p.title}` });
    } else if (/^https:\/\//.test(v)) actions.push({ type: "url", href: v, label: new URL(v).hostname.replace(/^www\./, "") });
    return "";
  });
  return { text: clean.replace(/[ \t]+\n/g, "\n").trim(), actions };
}
