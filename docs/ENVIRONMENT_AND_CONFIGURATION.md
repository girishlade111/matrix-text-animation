# Environment Variables & Configuration

Complete reference for every configuration file in this project and how environment variables work here.

> **TL;DR:** This project currently needs **zero** environment variables to run. There is no `.env` file in the repo. This document explains the `.env` convention anyway (so you know where secrets go when you add backend features later) and documents every config file that *does* exist.

---

## 1. Environment files (`.env`)

### Current state

| File | Exists in repo | Purpose |
|---|---|---|
| `.env` | No | Local secrets — never committed |
| `.env.local` | No | Local overrides (Next.js loads this first) |
| `.env.example` | Yes (added with these docs) | Template documenting every variable the app understands |

`.gitignore` already ignores `.env*`, so any `.env*` file you create stays local.

### How Next.js loads env files

Priority order (highest first):

1. `.env.local` — always loaded, never committed
2. `.env.development` / `.env.production` — per-environment
3. `.env` — lowest priority fallback

Rules that matter:

- **Server-only variables** (e.g. `DATABASE_URL`): usable in Server Components, Route Handlers, Server Actions. Never sent to the browser.
- **Public variables** must be prefixed `NEXT_PUBLIC_` (e.g. `NEXT_PUBLIC_SITE_URL`) to be inlined into client-side JavaScript. Anything without the prefix is stripped from the client bundle.
- Values are loaded at **build time** for client variables — changing them requires a rebuild.

### `.env.example`

```bash
# ── Public (exposed to the browser — never put secrets here) ──
# NEXT_PUBLIC_SITE_URL=https://your-domain.com

# ── Server-only (add when you introduce backend features) ──
# DATABASE_URL=
# RESEND_API_KEY=

# ── Vercel Analytics ──
# No key required. @vercel/analytics auto-configures on Vercel deployments.
# On self-hosted deployments, pageview tracking is silently disabled.
```

Copy it to start local development if you ever add variables:

```bash
cp .env.example .env.local
```

### On Vercel

Set variables in **Project Settings → Environment Variables** (per environment: Production / Preview / Development). They are injected at build and runtime — no `.env` file needed on the platform.

---

## 2. `next.config.mjs`

```js
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}
```

| Setting | What it does | Trade-off |
|---|---|---|
| `eslint.ignoreDuringBuilds: true` | Skips `next lint` during `next build` | Faster builds, but lint errors can ship. Run `pnpm lint` in CI separately if you care. |
| `typescript.ignoreBuildErrors: true` | Ships the build even with TS errors | Same trade-off — fine for a v0 prototype, tighten for production. |
| `images.unoptimized: true` | Disables Next.js Image Optimization | Required for static export / non-Vercel hosts. On Vercel you lose automatic WebP/resizing — remove this if you stay on Vercel and use `next/image`. |

---

## 3. `tsconfig.json`

Standard Next.js TypeScript config with one notable line:

```json
"paths": { "@/*": ["./*"] }
```

This is the **`@/` path alias** — `@/lib/utils` resolves to `<root>/lib/utils`, `@/components/...` to `<root>/components/...`. Used in `matrix-text.tsx` (`import { cn } from "@/lib/utils"`).

Other relevant flags: `strict: true`, `jsx: "preserve"` (Next.js handles JSX transform), `noEmit: true` (type-check only — Next emits), `moduleResolution: "bundler"`.

---

## 4. `tailwind.config.ts`

Tailwind CSS **v3** configuration:

- **`darkMode: ['class']`** — dark mode is toggled by a `.dark` class on `<html>`, not by OS preference. (Pairs with `next-themes` when you wire up `ThemeProvider`.)
- **`content`** — globs scanned for class names: `./pages/**`, `./components/**`, `./app/**`, plus root-level files. Any class used outside these globs will be purged in production.
- **`theme.extend.colors`** — full shadcn-style color system built on CSS variables (`hsl(var(--background))`, etc.). Change the actual values in `app/globals.css` (`:root` / `.dark` blocks), not here.
- **`borderRadius`** — derived from `--radius` (0.5rem).
- **`plugins: [require('tailwindcss-animate')]`** — accordion keyframes/animations used by shadcn components.

---

## 5. `postcss.config.mjs`

```js
{ plugins: { tailwindcss: {} } }
```

Runs Tailwind through PostCSS. Note: `autoprefixer` is in `package.json` dependencies but **not wired here** — Tailwind v3 bundles its own autoprefixing via PostCSS, so this is correct as-is.

---

## 6. `components.json` (shadcn/ui)

Config for the shadcn/ui CLI (`npx shadcn@latest add <component>`):

| Key | Value | Meaning |
|---|---|---|
| `style` | `default` | shadcn style variant |
| `rsc` | `true` | Generate React Server Components by default |
| `tsx` | `true` | TypeScript |
| `tailwind.config` / `tailwind.css` | `tailwind.config.ts` / `app/globals.css` | Where the CLI writes theme tokens |
| `baseColor` | `neutral` | Base palette |
| `cssVariables` | `true` | Theme via CSS vars (matches the Tailwind config) |
| `aliases` | `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks` | Import paths the CLI uses |
| `iconLibrary` | `lucide` | `lucide-react` for icons |

No shadcn UI components are installed yet (`components/ui/` doesn't exist) — the CLI will scaffold them here on demand.

---

## 7. `package.json` scripts

| Script | Command | Use |
|---|---|---|
| `dev` | `next dev` | Local dev server with HMR → http://localhost:3000 |
| `build` | `next build` | Production build → `.next/` |
| `start` | `next start` | Serve the production build |
| `lint` | `next lint` | ESLint (Next.js flat-config prompt on first run) |

Lockfile is `pnpm-lock.yaml` → use **pnpm** (`pnpm install`, `pnpm dev`). npm/yarn work but will generate a second lockfile — pick one.

---

## 8. `app/layout.tsx` metadata

```ts
export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}
```

**Change this before shipping** — it's the `<title>` and meta description every search engine and link preview sees. Suggested: title `"Matrix Text Animation"`, description describing the effect.

Fonts are loaded via `next/font` (`GeistSans`, `GeistMono`) and injected as CSS variables `--font-sans` / `--font-mono`.

---

## 9. `.gitignore` highlights

Ignores `node_modules/`, `.next/`, `/out/`, `.env*`, `.vercel`, `*.tsbuildinfo`, `next-env.d.ts`. Standard Next.js set — nothing to change.
