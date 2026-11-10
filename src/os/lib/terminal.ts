import type { OSContent, Project, ProjectItem } from "../content/types";
import { splitTimeline } from "./agenda";
import { moonIllumination, moonPhase, moonPhaseName } from "./moon";

export type Tone = "default" | "muted" | "accent" | "success" | "error" | "gold";
export interface Line {
  text: string;
  tone?: Tone;
}

export type Effect =
  | { type: "clear" }
  | { type: "exit" }
  | { type: "restart" }
  | { type: "openApp"; app: string }
  | { type: "openProject"; slug: string; title: string }
  | { type: "openItem"; slug: string; item: ProjectItem }
  | { type: "achievement"; id: string };

export interface Result {
  lines: Line[];
  cwd: string[];
  effects: Effect[];
}

/* ------------------------------ Virtual filesystem ------------------------------ */

type Node =
  | { kind: "dir"; name: string; children: Node[]; project?: Project }
  | { kind: "file"; name: string; content?: string; item?: ProjectItem; project?: Project; app?: string };

const fileName = (s: string) => s.trim().replace(/\s+/g, "_");

export function buildFs(content: OSContent): Node {
  const { profile, projects, socials, settings } = content;
  const about = [
    `${profile.name} — ${profile.title}`,
    profile.location ? `Location: ${profile.location}` : "",
    "",
    ...profile.bio,
    "",
    profile.skills.length ? `Skills: ${profile.skills.join(", ")}` : "",
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");

  const visible = projects.filter((p) => !p.archived);
  return {
    kind: "dir",
    name: "~",
    children: [
      { kind: "file", name: "about.txt", content: about, app: "about" },
      { kind: "file", name: "welcome.txt", content: settings.welcomeNote },
      {
        kind: "file",
        name: "socials.txt",
        content: socials.map((s) => `${s.platform.padEnd(12)} ${s.url}`).join("\n") || "(none yet)",
        app: "browser",
      },
      ...(profile.cvUrl ? [{ kind: "file" as const, name: "resume.pdf", app: "cv" }] : []),
      {
        kind: "dir",
        name: "projects",
        children: visible.map((p) => ({
          kind: "dir" as const,
          name: p.slug,
          project: p,
          children: [
            ...(p.description || p.summary
              ? [{ kind: "file" as const, name: "README.md", content: `# ${p.title}\n\n${p.description ?? p.summary}`, project: p }]
              : []),
            ...p.items.map((item) => ({
              kind: "file" as const,
              name: fileName(item.title),
              content: item.kind === "note" ? item.text : item.kind === "link" ? item.url : undefined,
              item,
              project: p,
            })),
          ],
        })),
      },
    ],
  };
}

function resolve(root: Node, cwd: string[], target = ""): { node: Node; path: string[] } | null {
  let path = target.startsWith("~") || target.startsWith("/") ? [] : [...cwd];
  const parts = target.replace(/^~\/?|^\/+/, "").split("/").filter(Boolean);
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") path = path.slice(0, -1);
    else path.push(part);
  }
  let node: Node = root;
  for (const seg of path) {
    if (node.kind !== "dir") return null;
    const next: Node | undefined =
      node.children.find((c) => c.name === seg) ??
      node.children.find((c) => c.name.toLowerCase() === seg.toLowerCase());
    if (!next) return null;
    node = next;
  }
  return { node, path };
}

export const promptPath = (cwd: string[]) => (cwd.length ? `~/${cwd.join("/")}` : "~");

/* ---------------------------------- Commands ---------------------------------- */

const APPS = ["about", "projects", "browser", "gallery", "videos", "terminal", "mail", "music", "game", "settings", "bin", "cv", "games", "agenda", "trophies", "moonword", "keystroke", "memory", "orbit"];
const APP_ALIASES: Record<string, string> = {
  resume: "cv",
  "résumé": "cv",
  contact: "mail",
  email: "mail",
  socials: "browser",
  trash: "bin",
  "recycle-bin": "bin",
  drift: "game",
  "lunar-drift": "game",
  wordle: "moonword",
  typing: "keystroke",
};

export const COMMANDS: Record<string, string> = {
  help: "list commands",
  whoami: "who is behind this OS",
  ls: "list files (ls [dir])",
  cd: "change directory",
  pwd: "print working directory",
  cat: "print a file",
  open: "open a file, project or app",
  projects: "list projects",
  cv: "open my résumé",
  socials: "where to find me",
  contact: "send me a message",
  neofetch: "system info",
  moon: "tonight's moon",
  date: "current date",
  echo: "print text",
  history: "command history",
  clear: "clear the screen",
  agenda: "past & upcoming events",
  trophies: "your achievements",
  reboot: "restart the OS",
  exit: "close the terminal",
};

const tokenize = (input: string) =>
  (input.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((t) => t.replace(/^["']|["']$/g, ""));

export function runCommand(
  input: string,
  ctx: { content: OSContent; cwd: string[]; history: string[]; now?: Date },
): Result {
  const { content, cwd, history } = ctx;
  const fs = buildFs(content);
  const out: Line[] = [];
  const effects: Effect[] = [];
  let nextCwd = cwd;
  const say = (text: string, tone?: Tone) => out.push({ text, tone });

  const [rawCmd, ...args] = tokenize(input.trim());
  if (!rawCmd) return { lines: [], cwd, effects };
  const cmd = rawCmd.toLowerCase();
  const { profile, projects, socials } = content;

  switch (cmd) {
    case "help": {
      say("Available commands:", "accent");
      for (const [name, desc] of Object.entries(COMMANDS)) say(`  ${name.padEnd(10)} ${desc}`);
      say("Tip: Tab completes names, ↑/↓ browse history.", "muted");
      break;
    }
    case "whoami":
      say(`${profile.name} — ${profile.title}`, "accent");
      if (profile.shortBio) say(profile.shortBio);
      say("Run `open about` for the full story.", "muted");
      break;
    case "pwd":
      say(`/home/${profile.handle}${cwd.length ? "/" + cwd.join("/") : ""}`);
      break;
    case "ls": {
      const hit = resolve(fs, cwd, args.find((a) => !a.startsWith("-")) ?? "");
      if (!hit) say(`ls: cannot access '${args[0]}': No such file or directory`, "error");
      else if (hit.node.kind === "file") say(hit.node.name);
      else if (!hit.node.children.length) say("(empty)", "muted");
      else
        for (const c of hit.node.children)
          say(c.kind === "dir" ? `${c.name}/` : c.name, c.kind === "dir" ? "accent" : "default");
      break;
    }
    case "cd": {
      const hit = resolve(fs, cwd, args[0] ?? "~");
      if (!hit) say(`cd: ${args[0]}: No such file or directory`, "error");
      else if (hit.node.kind !== "dir") say(`cd: ${args[0]}: Not a directory`, "error");
      else nextCwd = hit.path;
      break;
    }
    case "cat": {
      if (!args[0]) {
        say("cat: missing file operand", "error");
        break;
      }
      const hit = resolve(fs, cwd, args[0]);
      if (!hit) say(`cat: ${args[0]}: No such file or directory`, "error");
      else if (hit.node.kind === "dir") say(`cat: ${args[0]}: Is a directory`, "error");
      else if (hit.node.content != null) hit.node.content.split("\n").forEach((l) => say(l));
      else say(`cat: ${hit.node.name}: binary file — try \`open ${args[0]}\``, "muted");
      break;
    }
    case "open":
    case "xdg-open": {
      const target = args.join(" ");
      if (!target) {
        say("open: what should I open? e.g. `open projects`", "error");
        break;
      }
      const hit = resolve(fs, cwd, target);
      if (hit?.node.kind === "dir" && hit.node.project) {
        effects.push({ type: "openProject", slug: hit.node.project.slug, title: hit.node.project.title });
        say(`Opening ${hit.node.project.title}…`, "muted");
        break;
      }
      if (hit?.node.kind === "file") {
        const n = hit.node;
        if (n.item && n.project) effects.push({ type: "openItem", slug: n.project.slug, item: n.item });
        else if (n.project) effects.push({ type: "openProject", slug: n.project.slug, title: n.project.title });
        else if (n.app) effects.push({ type: "openApp", app: n.app });
        else if (n.name === "welcome.txt") n.content?.split("\n").forEach((l) => say(l));
        if (effects.length) say(`Opening ${n.name}…`, "muted");
        break;
      }
      const lower = target.toLowerCase();
      const app = APP_ALIASES[lower] ?? (APPS.includes(lower) ? lower : null);
      if (app) {
        effects.push({ type: "openApp", app });
        say(`Launching ${app}…`, "muted");
        break;
      }
      const project = projects.find(
        (p) => !p.archived && (p.slug === lower || p.title.toLowerCase() === lower),
      );
      if (project) {
        effects.push({ type: "openProject", slug: project.slug, title: project.title });
        say(`Opening ${project.title}…`, "muted");
        break;
      }
      say(`open: ${target}: not found. Try \`ls\` or \`projects\`.`, "error");
      break;
    }
    case "projects": {
      const visible = projects.filter((p) => !p.archived);
      if (!visible.length) say("No projects yet — check back soon.", "muted");
      for (const p of visible) say(`  ${p.slug.padEnd(22)} ${p.summary ?? p.title}`);
      if (visible.length) say("Open one with `open <name>`.", "muted");
      break;
    }
    case "cv":
    case "resume":
      effects.push({ type: "openApp", app: "cv" });
      say("Opening résumé…", "muted");
      break;
    case "socials":
      if (!socials.length) say("No socials yet.", "muted");
      for (const s of socials) say(`  ${s.platform.padEnd(12)} ${s.url}`);
      break;
    case "contact":
    case "mail":
      effects.push({ type: "openApp", app: "mail" });
      say("Opening Mail — say hi!", "muted");
      break;
    case "neofetch":
    case "fastfetch": {
      const art = ["   .--.  ", "  /  .-' ", " |  (    ", "  \\  '-. ", "   '--'  "];
      const info = [
        `${profile.handle}@moonos`,
        "-----------------------",
        "OS: MoonOS 1.0 (crescent)",
        "Kernel: ck-6.13-lunar",
        `Shell: moonsh · Projects: ${projects.filter((p) => !p.archived).length}`,
        "UI: Next.js · React · Tailwind",
        `Moon: ${moonPhaseName(moonPhase(ctx.now))}`,
      ];
      for (let i = 0; i < Math.max(art.length, info.length); i++)
        say(`${(art[i] ?? "").padEnd(11)}${info[i] ?? ""}`, i === 0 ? "accent" : undefined);
      break;
    }
    case "moon": {
      const p = moonPhase(ctx.now);
      say(`${moonPhaseName(p)} — ${Math.round(moonIllumination(p) * 100)}% illuminated.`, "gold");
      say("Someone is always watching over the night shift.", "muted");
      break;
    }
    case "theme":
      say("MoonOS only knows one theme: night. 🌙", "muted");
      break;
    case "date":
      say((ctx.now ?? new Date()).toUTCString());
      break;
    case "echo":
      say(args.join(" "));
      break;
    case "history":
      history.forEach((h, i) => say(`${String(i + 1).padStart(4)}  ${h}`));
      break;
    case "clear":
    case "cls":
      effects.push({ type: "clear" });
      break;
    case "reboot":
    case "restart":
      effects.push({ type: "restart" });
      break;
    case "exit":
    case "logout":
      effects.push({ type: "exit" });
      break;
    case "sudo": {
      const rest = args.join(" ").toLowerCase();
      if (rest.startsWith("hire")) {
        say(`[sudo] password for recruiter: ********`, "muted");
        say(`Access granted. Excellent decision. 🌙`, "success");
        effects.push({ type: "openApp", app: "mail" });
        effects.push({ type: "achievement", id: "hire-me" });
      } else if (rest.startsWith("rm")) {
        say("Nice try. This incident will be reported to the moon.", "error");
        effects.push({ type: "achievement", id: "nice-try" });
      } else {
        say(`${profile.handle} is not in the sudoers file. This incident will be reported.`, "error");
        say("Hint: some sudo commands are more welcome than others. Try `sudo hire-me`.", "muted");
      }
      break;
    }
    case "rm":
      say(args.includes("-rf") ? "rm: refusing to delete the night sky." : "rm: permission denied (portfolio is read-only)", "error");
      if (args.includes("-rf")) effects.push({ type: "achievement", id: "nice-try" });
      break;
    case "moonwalk":
      say("   o      o      o      o", "accent");
      say("  /|\    /|\    /|\    /|\\", "accent");
      say("  / \  <  \   / \  <  \   ← gliding backwards…", "accent");
      say("Smooth. Very smooth.", "muted");
      effects.push({ type: "achievement", id: "moonwalk" });
      break;
    case "agenda":
    case "cal": {
      const today = new Date();
      const { upcoming, past } = splitTimeline(content.events, ctx.now ?? today);
      if (!content.events.length) say("Nothing on the agenda yet.", "muted");
      if (upcoming.length) say("Upcoming:", "accent");
      for (const e of upcoming.slice(0, 6)) say(`  ${e.start.slice(0, 10)}  ${e.title}${e.location ? ` — ${e.location}` : ""}`);
      if (past.length) say("Recently:", "accent");
      for (const e of past.slice(0, 4)) say(`  ${e.start.slice(0, 10)}  ${e.title}`, "muted");
      if (args[0] === "open" || content.events.length) say("Open the calendar with `open agenda`.", "muted");
      break;
    }
    case "trophies":
    case "achievements":
      effects.push({ type: "openApp", app: "trophies" });
      say("Opening Trophies…", "muted");
      break;
    case "coffee":
      say("      ( (", "gold");
      say("       ) )", "gold");
      say("    ........", "gold");
      say("    |      |]", "gold");
      say("    \\      /", "gold");
      say("     `----'", "gold");
      say("Brewing… productivity +20%.", "muted");
      break;
    case "vim":
    case "nano":
    case "emacs":
      say(`${cmd}: no editors here — everything is edited from the admin panel. (and you'd never exit vim anyway)`, "muted");
      break;
    case "hello":
    case "hi":
      say(`Hello, visitor. I'm ${profile.name}. Type \`help\` to look around.`, "accent");
      break;
    case "42":
      say("The answer. But what was the question?", "gold");
      break;
    default:
      say(`${rawCmd}: command not found. Type \`help\`.`, "error");
  }

  return { lines: out, cwd: nextCwd, effects };
}

/** Completion candidates for the last token of `input`. */
export function complete(input: string, ctx: { content: OSContent; cwd: string[] }): string[] {
  const tokens = input.split(/\s+/);
  if (tokens.length <= 1) {
    return Object.keys(COMMANDS).filter((c) => c.startsWith(tokens[0] ?? ""));
  }
  const last = tokens[tokens.length - 1];
  const slash = last.lastIndexOf("/");
  const dirPart = slash >= 0 ? last.slice(0, slash + 1) : "";
  const prefix = last.slice(slash + 1).toLowerCase();
  const hit = resolve(buildFs(ctx.content), ctx.cwd, dirPart);
  const names = hit?.node.kind === "dir" ? hit.node.children.map((c) => (c.kind === "dir" ? `${c.name}/` : c.name)) : [];
  const pool = tokens[0] === "open" && !dirPart ? [...names, ...APPS] : names;
  return pool.filter((n) => n.toLowerCase().startsWith(prefix)).map((n) => dirPart + n);
}
