import {
  AboutGlyph,
  ActivityGlyph,
  AgendaGlyph,
  BinGlyph,
  BrowserGlyph,
  DriftGlyph,
  FolderGlyph,
  GalleryGlyph,
  GamesGlyph,
  InfoGlyph,
  MapGlyph,
  KeystrokeGlyph,
  KonshuGlyph,
  MailGlyph,
  MemoryGlyph,
  MoonwordGlyph,
  MusicGlyph,
  NoteGlyph,
  OrbitGlyph,
  ResumeGlyph,
  SettingsGlyph,
  SkillsGlyph,
  TerminalGlyph,
  TrophiesGlyph,
  VideosGlyph,
  ViewerGlyph,
} from "../components/AppGlyphs";
import { About } from "./About";
import { Activity } from "./Activity";
import { Agenda } from "./Agenda";
import { Browser } from "./Browser";
import { CV } from "./CV";
import { Folder as FolderApp } from "./Folder";
import { Info } from "./Info";
import { Skills } from "./Skills";
import { Konshu } from "./Konshu";
import { MapApp } from "./MapApp";
import { Gallery, Videos } from "./Media";
import { Trophies } from "./Trophies";
import { GamesHub } from "./games/GamesHub";
import { Keystroke } from "./games/Keystroke";
import { Memory } from "./games/Memory";
import { Moonword } from "./games/Moonword";
import { Orbit } from "./games/Orbit";
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
  "moonword",
  "keystroke",
  "memory",
  "orbit",
  "map",
  "konshu",
  "skills",
  "activity",
] as const;
export type AppId = (typeof APP_IDS)[number];

/** Tile glow families: identity lives in the glyph shape, colour only groups. */
const WORK = "#7f9fe0";
const PLAY = "#c8a96f";
const SYSTEM = "#aab4c8";

export const apps: Record<AppId, AppDefinition> = {
  about: { id: "about", name: "About me", icon: AboutGlyph, tint: WORK, component: About, size: { w: 720, h: 520 }, listed: true, pinned: false, description: "Who I am" },
  projects: { id: "projects", name: "Projects", icon: FolderGlyph, tint: WORK, component: Projects, size: { w: 860, h: 540 }, listed: true, pinned: true, description: "All my projects" },
  folder: { id: "folder", name: "Folder", icon: FolderGlyph, tint: WORK, component: FolderApp, size: { w: 860, h: 560 }, listed: false, pinned: false },
  viewer: { id: "viewer", name: "Viewer", icon: ViewerGlyph, tint: SYSTEM, component: Viewer, size: { w: 900, h: 620 }, listed: false, pinned: false },
  note: { id: "note", name: "Notes", icon: NoteGlyph, tint: SYSTEM, component: Note, size: { w: 560, h: 440 }, listed: false, pinned: false },
  cv: { id: "cv", name: "Résumé", icon: ResumeGlyph, tint: WORK, component: CV, size: { w: 780, h: 640 }, listed: true, pinned: true, description: "My CV" },
  browser: { id: "browser", name: "Browser", icon: BrowserGlyph, tint: WORK, component: Browser, size: { w: 940, h: 600 }, listed: true, pinned: true, description: "Find me online" },
  gallery: { id: "gallery", name: "Gallery", icon: GalleryGlyph, tint: WORK, component: Gallery, size: { w: 860, h: 580 }, listed: true, pinned: true },
  videos: { id: "videos", name: "Videos", icon: VideosGlyph, tint: WORK, component: Videos, size: { w: 900, h: 580 }, listed: true, pinned: false },
  terminal: { id: "terminal", name: "Terminal", icon: TerminalGlyph, tint: SYSTEM, component: Terminal, size: { w: 720, h: 460 }, listed: true, pinned: true, description: "Type `help`" },
  mail: { id: "mail", name: "Mail", icon: MailGlyph, tint: WORK, component: MailApp, size: { w: 620, h: 560 }, listed: true, pinned: true, description: "Contact me" },
  music: { id: "music", name: "Music", icon: MusicGlyph, tint: PLAY, component: Music, size: { w: 420, h: 540 }, listed: true, pinned: false },
  game: { id: "game", name: "Lunar Drift", icon: DriftGlyph, tint: PLAY, component: Game, size: { w: 560, h: 600 }, listed: false, pinned: false, description: "A tiny game" },
  settings: { id: "settings", name: "Settings", icon: SettingsGlyph, tint: SYSTEM, component: Settings, size: { w: 700, h: 500 }, listed: true, pinned: true },
  bin: { id: "bin", name: "Recycle Bin", icon: BinGlyph, tint: SYSTEM, component: Bin, size: { w: 720, h: 460 }, listed: false, pinned: false },
  info: { id: "info", name: "Get info", icon: InfoGlyph, tint: SYSTEM, component: Info, size: { w: 420, h: 440 }, listed: false, pinned: false },
  games: { id: "games", name: "Games", icon: GamesGlyph, tint: PLAY, component: GamesHub, size: { w: 640, h: 480 }, listed: true, pinned: false, description: "Small original games" },
  agenda: { id: "agenda", name: "Agenda", icon: AgendaGlyph, tint: WORK, component: Agenda, size: { w: 860, h: 580 }, listed: true, pinned: true, description: "Projects, events & hackathons" },
  trophies: { id: "trophies", name: "Trophies", icon: TrophiesGlyph, tint: PLAY, component: Trophies, size: { w: 720, h: 560 }, listed: true, pinned: false, description: "Achievements & secrets" },
  moonword: { id: "moonword", name: "Moonword", icon: MoonwordGlyph, tint: PLAY, component: Moonword, size: { w: 480, h: 640 }, listed: false, pinned: false, description: "Daily word game" },
  keystroke: { id: "keystroke", name: "Keystroke", icon: KeystrokeGlyph, tint: PLAY, component: Keystroke, size: { w: 760, h: 480 }, listed: false, pinned: false, description: "Code typing test" },
  memory: { id: "memory", name: "Phase memory", icon: MemoryGlyph, tint: PLAY, component: Memory, size: { w: 480, h: 600 }, listed: false, pinned: false, description: "Memory match" },
  orbit: { id: "orbit", name: "Orbit", icon: OrbitGlyph, tint: PLAY, component: Orbit, size: { w: 520, h: 600 }, listed: false, pinned: false, description: "One-tap arcade" },
  map: { id: "map", name: "Map", icon: MapGlyph, tint: WORK, component: MapApp, size: { w: 980, h: 620 }, listed: true, pinned: true, description: "Where I've built, studied and hacked" },
  konshu: { id: "konshu", name: "Konshu", icon: KonshuGlyph, tint: PLAY, component: Konshu, size: { w: 460, h: 600 }, listed: true, pinned: true, description: "Ask the guide anything" },
  skills: { id: "skills", name: "Skills", icon: SkillsGlyph, tint: WORK, component: Skills, size: { w: 900, h: 600 }, listed: true, pinned: false, description: "Skills constellation" },
  activity: { id: "activity", name: "Activity", icon: ActivityGlyph, tint: WORK, component: Activity, size: { w: 860, h: 560 }, listed: true, pinned: false, description: "GitHub activity in moon phases" },
};

export function getApp(id: string): AppDefinition {
  return apps[id as AppId] ?? apps.about;
}
