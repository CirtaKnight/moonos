# CirtaKnight OS

A portfolio that boots like an operating system. Visitors land on a typed kernel log, watch a crescent logo ink itself in, then explore a desktop where **every folder is a project** — with windows, a terminal, a browser of socials, a phone mode for mobile, and a tiny game.

Everything you see is editable from an admin panel at **`/admin`** — no code changes needed to add a project.

## Features

- **Boot sequence** — typed kernel-style log (editable from the admin), logo reveal, *press any key to skip*, short boot for returning visitors, and a **Quick view** for recruiters in a hurry.
- **Window manager** — drag, resize, minimize, maximize, edge-snapping, z-order, keyboard shortcuts.
- **Two layouts** — menu bar + dock, or a taskbar (switch in Settings). Night / Day themes.
- **Apps** — project folders, Projects explorer, file viewer (images, PDFs, videos, YouTube/Vimeo), Notes, About me, Résumé, Browser (socials), Gallery, Videos, Terminal, Mail, Music, Settings, Recycle Bin, and *Lunar Drift*.
- **Terminal** — `help`, `ls`, `cd`, `cat`, `open`, `neofetch`, `moon`, tab completion, history… and a few easter eggs.
- **Search** — `Ctrl/Cmd + K` across apps, projects and files.
- **Notifications** — welcome toast and "new project" alerts.
- **Phone shell** — on phones the desktop becomes a home screen with widgets, paged icons, a dock and full-screen apps.
- **Shareable links** — `/?open=project/<slug>` opens a project directly; the address bar follows the focused window.
- **No page scroll, ever** — content scrolls inside windows only.
- **Live moon phase** — computed locally, shown in the menu bar, widgets and terminal.

## Stack

Next.js (App Router, Cache Components) · React · TypeScript · Tailwind CSS · Zustand · Motion · Sanity (embedded Studio) · Resend · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

Open http://localhost:3000 (site) and http://localhost:3000/admin (admin).

Without Sanity env vars the site still runs on built-in starter content.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` / `npm run lint` | Type and lint checks |
| `npm run seed` | Load starter content into Sanity (idempotent) |

## Managing content (`/admin`)

Sign in with your Sanity account, then:

- **Profile (About me)** — name, headline, photo, bio, skills, education, CV PDF.
- **Projects** — each project is a desktop folder: title, summary, description, tags, cover, folder color, order, and its **files** (PDF, image, video, YouTube/Vimeo, link, note). Tick *Move to Recycle Bin* to archive.
- **Gallery & Videos**, **Socials (Browser)**, **Music**.
- **Site settings** — Welcome.txt, boot lines, extra wallpapers, weather city.

Published changes appear on the live site within seconds thanks to the revalidation webhook (see below).

## Deploying

The app is host-agnostic (no host-specific features), so it runs on Netlify, Vercel, Cloudflare or any Node server.

1. Set the environment variables from `.env.example` on your host.
2. In Sanity → API → CORS origins, add your site URL (with credentials allowed) so `/admin` works.
3. In Sanity → API → Webhooks, add a webhook to `https://<your-site>/api/revalidate` on create/update/delete, with the secret set to `SANITY_REVALIDATE_SECRET`.
4. For the contact form, create a free [Resend](https://resend.com) API key and set `RESEND_API_KEY` and `CONTACT_TO_EMAIL`.

## Project structure

```
src/
  app/                 routes: / (the OS), /admin (Studio), /api/contact, /api/revalidate
  os/
    OS.tsx             power states: boot → desktop / phone → shutdown
    Desktop.tsx        desktop shell
    mobile/Phone.tsx   phone shell
    apps/              every app + registry + launch helpers
    components/        windows, dock, taskbar, start menu, search, notifications…
    store/             Zustand stores (windows, settings, phone, power, ui…)
    lib/               pure logic with tests (terminal, search, moon, game, links…)
    content/           content types, Sanity loader, built-in fallback
  sanity/              schemas, Studio structure, GROQ query, client
```
