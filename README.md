# Matrix Text Animation

A Next.js showcase of a **Matrix-style text reveal effect** — letters flicker as glowing green binary digits (`1`/`0`) one by one, then resolve into the final text. Built with React, Motion, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)

---

## Table of Contents

- [Demo](#demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quickstart](#quickstart)
- [Project Structure](#project-structure)
- [Component API](#component-api)
- [Configuration](#configuration)
- [Third-Party Integrations](#third-party-integrations)
- [Documentation](#documentation)
- [Customization](#customization)
- [Build & Deployment](#build--deployment)
- [Known Quirks](#known-quirks)
- [Roadmap Ideas](#roadmap-ideas)
- [License](#license)

---

## Demo

Run it locally (`pnpm dev` → http://localhost:3000) and you'll see `HelloWorld!` materialize letter by letter — each character first flashes as a random `1` or `0` in Matrix-green (`#00ff00`) with a glow, then snaps to its final glyph.

https://github.com/girishlade111/matrix-text-animation

## Features

- **Matrix rain text reveal** — per-letter binary flicker → final character, staggered across the string
- **Fully parameterized** — text, timing, stagger, and styling are all props or one-line edits
- **Jitter-free typography** — monospace + fixed `1ch` widths + tabular numerals keep the layout rock-solid during animation
- **Dark-mode ready** — Tailwind `class`-strategy dark mode with shadcn CSS-variable theme tokens
- **Zero backend** — pure client-side animation; no database, no auth, no API routes, no cookies
- **Portable build** — `images.unoptimized` means it deploys to Vercel, Netlify, Cloudflare, or any Node host
- **Vercel Analytics** wired in — pageviews + Web Vitals with zero config on Vercel

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.5.9 |
| UI | React | 19 |
| Language | TypeScript (strict) | 5 |
| Animation | Motion (`motion/react`) | latest |
| Styling | Tailwind CSS + shadcn theme tokens | 3.4.17 |
| Fonts | Geist Sans / Geist Mono (self-hosted via `next/font`) | ^1.3.1 |
| Analytics | Vercel Analytics | 1.3.1 |
| Theming | next-themes (wired via `ThemeProvider`, optional) | ^0.4.4 |
| UI primitives | Radix UI (installed, for future shadcn components) | various |
| Package manager | pnpm (`pnpm-lock.yaml` committed) | — |

## Quickstart

**Prerequisites:** Node.js 18.18+ (20 LTS recommended), pnpm.

```bash
git clone https://github.com/girishlade111/matrix-text-animation.git
cd matrix-text-animation
pnpm install
pnpm dev
```

Open http://localhost:3000. No `.env` file, no database, no setup wizard — it just runs.

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server with hot reload |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |

## Project Structure

```
├── app/
│   ├── layout.tsx        # Root layout: Geist fonts, metadata, <Analytics />
│   ├── page.tsx          # Route "/" — renders <MatrixText />
│   └── globals.css       # Tailwind + shadcn CSS variables (:root / .dark)
├── components/
│   ├── kokonutui/
│   │   └── matrix-text.tsx   # ★ The animation component
│   └── theme-provider.tsx    # next-themes wrapper (wired into layout.tsx)
├── lib/
│   └── utils.ts          # cn() — clsx + tailwind-merge class merging
├── public/               # Static assets
├── docs/                 # Detailed documentation (see below)
├── components.json       # shadcn/ui CLI configuration
├── tailwind.config.ts    # Tailwind v3 + shadcn color system
├── tsconfig.json         # Strict TS with "@/*" path alias
└── next.config.mjs       # Build flags (lint/TS leniency, unoptimized images)
```

## Component API

```tsx
import MatrixText from "./components/kokonutui/matrix-text"

<MatrixText
  text="HelloWorld!"
  className=""
  initialDelay={200}            // ms before animation starts
  letterAnimationDuration={500} // ms each letter spends flickering
  letterInterval={100}          // ms stagger between letters
/>
```

**How it works:** a `letters` state array tracks each character (`{ char, isMatrix, isSpace }`). A sequencer flips one letter at a time to a random `1`/`0` with a green glow variant, then restores the true glyph after `letterAnimationDuration`. Each letter is keyed by `` `${index}-${char}` `` so every swap remounts the element — that's what makes the flicker sharp instead of a smooth morph. Full internals in `docs/DEVELOPER_GUIDE.md`.

## Configuration

**No environment variables are required.** `.gitignore` covers `.env*`, and a documented `.env.example` template ships for when you add backend features later.

Every config file is documented line-by-line in [`docs/ENVIRONMENT_AND_CONFIGURATION.md`](docs/ENVIRONMENT_AND_CONFIGURATION.md) — highlights:

- `next.config.mjs` — skips ESLint/TS errors during builds (prototype-friendly, tighten for prod), `images.unoptimized` for portable deploys
- `tsconfig.json` — strict mode, `@/*` path alias
- `tailwind.config.ts` — class-based dark mode, shadcn CSS-variable color system, `tailwindcss-animate` plugin
- `components.json` — shadcn/ui CLI ready (`npx shadcn@latest add button`)
- `app/layout.tsx` metadata — **update the `title`/`description` before shipping** (still says "v0 App")

## Third-Party Integrations

| Integration | Status | Notes |
|---|---|---|
| Vercel Analytics | ✅ Active | `<Analytics />` in layout; zero-config on Vercel |
| Motion | ✅ Active | Per-letter animation engine |
| Geist Fonts | ✅ Active | Self-hosted via `next/font` |
| Vercel hosting | ✅ Ready | Auto-detected Next.js, no env vars |
| Radix UI / shadcn stack | 🟡 Installed, unused | 25 primitives + form/chart libs ready for growth; safe to prune if this stays a showcase |
| next-themes | 🟡 Installed, unwired | `ThemeProvider` exists but isn't mounted — wire it up or delete |

Full audit (used vs. installed, versions, privacy surface) in [`docs/THIRD_PARTY_INTEGRATIONS.md`](docs/THIRD_PARTY_INTEGRATIONS.md).

## Documentation

| Document | Covers |
|---|---|
| [`docs/ENVIRONMENT_AND_CONFIGURATION.md`](docs/ENVIRONMENT_AND_CONFIGURATION.md) | `.env` conventions, `.env.example`, every config file explained |
| [`docs/THIRD_PARTY_INTEGRATIONS.md`](docs/THIRD_PARTY_INTEGRATIONS.md) | All integrations: active vs. template baggage, setup, privacy |
| [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md) | Setup, architecture, animation internals, customization recipes, deploy, troubleshooting |

## Customization

```tsx
// app/page.tsx — your text, your timing
<MatrixText text="LadeStack" initialDelay={600} letterAnimationDuration={900} letterInterval={220} />
```

- **Color:** edit the `matrix` variant in `components/kokonutui/matrix-text.tsx` (`color: "#00ff00"` + `textShadow`).
- **Charset:** `getRandomChar()` returns `1`/`0` — swap in katakana or hex for a denser Matrix feel.
- **Replay:** remount via `key` — `<MatrixText key={run} … />` and bump `run` on click.
- **Dark mode:** `ThemeProvider` is wired in `layout.tsx` — OS dark mode works out of the box (add a toggle UI if you want manual control).

More recipes in the Developer Guide.

## Build & Deployment

```bash
pnpm build && pnpm start
```

- **Vercel:** import the repo, deploy with defaults. Analytics activates automatically.
- **Any Node host:** `pnpm build` → `pnpm start` (`PORT=` to override 3000).
- **Static hosts:** `output: 'export'` is already set — `next build` emits static `out/` for Netlify / Cloudflare Pages / GitHub Pages.
- **Docker:** use Next.js `output: 'standalone'` for a minimal image.

## Known Quirks

- `public/` contains only placeholder images.
- `public/` contains only placeholder images.
- No ESLint config ships with the repo (`next lint` prompts interactively); `ignoreDuringBuilds: true` is set.

(Fixed 2026-09-27: `styles/globals.css` duplicate deleted, metadata corrected, package renamed, strict TypeScript build enabled, motion variants made explicit, unmount timer leak fixed, `text` prop changes restart the animation. Details in `docs/DEVELOPER_GUIDE.md` §8.)

## Roadmap Ideas

- Replay button + controls (speed, charset, color pickers)
- Canvas-based renderer for long-text performance
- Preset gallery (binary / katakana / hex / emoji)
- Scramble-on-hover variant for nav links and headings
- NPM package export (`<MatrixText />` as a reusable component)

## License

No license file is specified yet. Add one (`MIT`, `Apache-2.0`, …) before public distribution if you want others to reuse the code.

---

Built with ❤ by [Girish Lade](https://github.com/girishlade111) — [ladestack.in](https://ladestack.in)
