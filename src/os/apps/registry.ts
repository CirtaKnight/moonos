import {
  Clapperboard,
  FileText,
  Folder,
  FolderOpen,
  Gamepad2,
  Globe,
  Images,
  Mail,
  Music2,
  ScrollText,
  Settings2,
  SquareTerminal,
  Trash2,
  UserRound,
  Eye,
  Info as InfoIcon,
  CalendarDays,
  Trophy,
  Joystick,
} from "lucide-react";
import { About } from "./About";
import { Agenda } from "./Agenda";
import { Browser } from "./Browser";
import { CV } from "./CV";
import { Folder as FolderApp } from "./Folder";
import { Info } from "./Info";
import { Gallery, Videos } from "./Media";
import { Soon } from "./Soon";
import { Trophies } from "./Trophies";
import { Game } from "./Game";
import { Mail as MailApp } from "./Mail";
import { Music } from "./Music";
import { Note } from "./Note";
import { Bin } from "./Bin";
import { Settings } from "./Settings";
import { Terminal } from "./Terminal";
import { Projects } from "./Projects";
import { Viewer } from "./Viewer";
import type { AppDefinition } from "./types";

export const APP_IDS = [
  "about",
  "projects",
  "folder",
  "viewer",
  "note",
  "cv",
  "browser",
  "gallery",
  "videos",
  "terminal",
  "mail",
  "music",
  "game",
  "settings",
  "bin",
  "info",
  "games",
  "agenda",
  "trophies",
] as const;
export type AppId = (typeof APP_IDS)[number];

export const apps: Record<AppId, AppDefinition> = {
  about: { id: "about", name: "About me", icon: UserRound, tint: "#e9ecf3", component: About, size: { w: 720, h: 520 }, listed: true, pinned: false, description: "Who I am" },
  projects: { id: "projects", name: "Projects", icon: FolderOpen, tint: "#8ea7dc", component: Projects, size: { w: 860, h: 540 }, listed: true, pinned: true, description: "All my projects" },
  folder: { id: "folder", name: "Folder", icon: Folder, tint: "#8ea7dc", component: FolderApp, size: { w: 860, h: 560 }, listed: false, pinned: false },
  viewer: { id: "viewer", name: "Viewer", icon: Eye, tint: "#bccbeb", component: Viewer, size: { w: 900, h: 620 }, listed: false, pinned: false },
  note: { id: "note", name: "Notes", icon: FileText, tint: "#e9ecf3", component: Note, size: { w: 560, h: 440 }, listed: false, pinned: false },
  cv: { id: "cv", name: "Résumé", icon: ScrollText, tint: "#c8a96f", component: CV, size: { w: 780, h: 640 }, listed: true, pinned: false, description: "My CV" },
  browser: { id: "browser", name: "Browser", icon: Globe, tint: "#9fc3e8", component: Browser, size: { w: 940, h: 600 }, listed: true, pinned: true, description: "Find me online" },
  gallery: { id: "gallery", name: "Gallery", icon: Images, tint: "#d6b6e8", component: Gallery, size: { w: 860, h: 580 }, listed: true, pinned: true },
  videos: { id: "videos", name: "Videos", icon: Clapperboard, tint: "#e8a6a6", component: Videos, size: { w: 900, h: 580 }, listed: true, pinned: false },
  terminal: { id: "terminal", name: "Terminal", icon: SquareTerminal, tint: "#9fe0b8", component: Terminal, size: { w: 720, h: 460 }, listed: true, pinned: true, description: "Type `help`" },
  mail: { id: "mail", name: "Mail", icon: Mail, tint: "#f0c987", component: MailApp, size: { w: 620, h: 560 }, listed: true, pinned: true, description: "Contact me" },
  music: { id: "music", name: "Music", icon: Music2, tint: "#f29fb8", component: Music, size: { w: 420, h: 540 }, listed: true, pinned: false },
  game: { id: "game", name: "Lunar Drift", icon: Gamepad2, tint: "#a6e3e8", component: Game, size: { w: 560, h: 600 }, listed: true, pinned: false, description: "A tiny game" },
  settings: { id: "settings", name: "Settings", icon: Settings2, tint: "#b8bfcc", component: Settings, size: { w: 700, h: 500 }, listed: true, pinned: true },
  bin: { id: "bin", name: "Recycle Bin", icon: Trash2, tint: "#b8bfcc", component: Bin, size: { w: 720, h: 460 }, listed: false, pinned: false },
  info: { id: "info", name: "Get info", icon: InfoIcon, tint: "#bccbeb", component: Info, size: { w: 420, h: 440 }, listed: false, pinned: false },
  games: { id: "games", name: "Games", icon: Joystick, tint: "#a6e3e8", component: Soon, size: { w: 640, h: 480 }, listed: true, pinned: false, description: "Small original games" },
  agenda: { id: "agenda", name: "Agenda", icon: CalendarDays, tint: "#f0c987", component: Agenda, size: { w: 860, h: 580 }, listed: true, pinned: true, description: "Projects, events & hackathons" },
  trophies: { id: "trophies", name: "Trophies", icon: Trophy, tint: "#c8a96f", component: Trophies, size: { w: 720, h: 560 }, listed: true, pinned: false, description: "Achievements & secrets" },
};

export function getApp(id: string): AppDefinition {
  return apps[id as AppId] ?? apps.about;
}
