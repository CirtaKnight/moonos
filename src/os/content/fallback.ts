import type { OSContent } from "./types";

/**
 * Boot log lines. Format: "<status>|<text>" where status is ok | info | warn | dim.
 * Editable from the admin (Site settings → Boot lines); these are the defaults.
 */
export const DEFAULT_BOOT_LINES: string[] = [
  "dim|MoonOS 1.0.0-crescent (tty1)",
  "info|Booting kernel ck-6.13-lunar ...",
  "dim|Command line: BOOT_IMAGE=/vmlinuz root=/dev/portfolio ro quiet splash curiosity=max",
  "ok|Initialized memory: 16 GB of ideas, 0 B of free time",
  "ok|Detected CPU: Brain v20.x (caffeine-accelerated)",
  "info|Checking filesystem /dev/projects ... clean",
  "ok|Mounted /home/cirtaknight",
  "ok|Started Stack Overflow tab daemon (47 tabs restored)",
  "warn|rm -rf / blocked — nice try",
  "ok|Loaded module git (all commits signed with good intentions)",
  "ok|Reached target: It Works On My Machine",
  "info|Compiling semicolons; ;; ;;;",
  "ok|Resolved 1 of 1 merge conflicts with dignity",
  "dim|Waking up from a very long night shift ...",
  "ok|Aligning lunar phase ... waxing crescent",
  "ok|Calibrating moonlight reflectors",
  "info|Fetching the answer to life, the universe and everything: 42",
  "ok|Started Coffee.service",
  "ok|Started Window Manager",
  "ok|Started Desktop Environment",
  "ok|Reached target: Graphical Interface",
];

export const fallbackContent: OSContent = {
  source: "fallback",
  profile: {
    name: "CirtaKnight",
    handle: "cirtaknight",
    title: "Computer Science Engineering Student",
    shortBio: "I build things for the web and beyond — and I'm just getting started.",
    bio: [
      "Hi, I'm CirtaKnight — a computer science engineering student who likes turning ideas into software people actually enjoy using.",
      "This portfolio is my first exhibit: a small operating system that runs in your browser. Every folder on the desktop is a project. Open them, poke around, try the terminal.",
      "I'm currently learning, building and looking for opportunities to grow. If something here catches your eye, the Mail app is the fastest way to reach me.",
    ],
    skills: ["TypeScript", "React", "Next.js", "Python", "C / C++", "Java", "SQL", "Git", "Linux"],
    education: [{ school: "Engineering school", degree: "Computer Science Engineering", period: "In progress" }],
    available: true,
  },
  projects: [
    {
      id: "fallback-moonos",
      slug: "moonos",
      title: "MoonOS",
      summary: "This portfolio — a web operating system built with Next.js and Sanity.",
      description:
        "A browser-based desktop with a boot sequence, a window manager, a terminal and a phone mode for mobile. All content is managed from an admin panel, so new projects appear without touching code.",
      tags: ["Next.js", "TypeScript", "Tailwind", "Sanity", "Zustand", "Motion"],
      date: "2026-11",
      color: "#8ea7dc",
      archived: false,
      items: [
        {
          id: "readme",
          kind: "note",
          title: "README.txt",
          text: "MoonOS\n==============\n\nYou're running it right now.\n\n- Boot sequence with a typed kernel log\n- Draggable, resizable, snappable windows\n- Terminal with real commands (try `help`)\n- Phone-style home screen on mobile\n- Every project managed from a headless CMS\n\nStack: Next.js · TypeScript · Tailwind CSS · Zustand · Motion · Sanity",
        },
        {
          id: "source",
          kind: "link",
          title: "Source code on GitHub",
          url: "https://github.com/CirtaKnight/moonos",
        },
      ],
    },
  ],
  media: [],
  socials: [
    {
      id: "github",
      platform: "GitHub",
      handle: "@CirtaKnight",
      url: "https://github.com/CirtaKnight",
      description: "Code, experiments and this very OS.",
    },
  ],
  tracks: [],
  activity: [],
  announcements: [],
  events: [],
  settings: {
    bootLines: DEFAULT_BOOT_LINES,
    welcomeNote:
      "Welcome to MoonOS.\n\nEach folder on the desktop is a project — double-click to open it.\nOpen the start menu and click my profile to learn about me.\nCurious? Open the Terminal and type `help`.\n\nNew projects land here regularly. Thanks for visiting.",
    wallpapers: [
      { id: "starfield", name: "Living sky" },
      { id: "eclipse", name: "Eclipse" },
      { id: "tide", name: "Night Tide" },
      { id: "dune", name: "Desert Dawn" },
    ],
  },
};
