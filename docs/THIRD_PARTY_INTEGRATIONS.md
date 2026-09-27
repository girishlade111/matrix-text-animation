# Third-Party Integrations

Every external service, library, and platform this project touches — what is **actually used in code** vs. what is merely **installed** (v0 template baggage).

---

## A. Used in code

### 1. Vercel Analytics — `@vercel/analytics@1.3.1`

- **Where:** `app/layout.tsx` → `<Analytics />` inside `<body>`.
- **What it does:** Privacy-friendly pageview + Web Vitals tracking. No cookies, no fingerprinting.
- **Setup:** Zero config on Vercel — auto-detects the project. **No API key, no env variable.**
- **Self-hosted:** If you deploy outside Vercel, the component renders but silently collects nothing. Either remove it or proxy events yourself.
- **Dashboard:** Vercel Project → Analytics tab.

### 2. Motion — `motion@latest` (Motion One / Framer Motion successor)

- **Where:** `components/kokonutui/matrix-text.tsx` → `import { motion } from "motion/react"`.
- **What it does:** Powers the per-letter color/glow animation. Each letter is a `<motion.div>` switching between `matrix` (green `#00ff00` + glow) and `normal` variants with a 0.1s `easeInOut` transition.
- **Note:** `motion` is the renamed successor of `framer-motion`. The `motion/react` import path is the current API — do not "downgrade" to `framer-motion`.

### 3. Geist Fonts — `geist@^1.3.1`

- **Where:** `app/layout.tsx` → `GeistSans`, `GeistMono` from `geist/font/sans` and `geist/font/mono`.
- **What it does:** Vercel's Geist typeface, self-hosted via `next/font` (zero layout shift, no Google Fonts request at runtime). Exposed as CSS variables `--font-sans` / `--font-mono`; the matrix letters themselves use `font-mono`.

### 4. clsx + tailwind-merge — via `lib/utils.ts`

- **Where:** `matrix-text.tsx` → `import { cn } from "@/lib/utils"`.
- **What it does:** `cn()` merges conditional class names (`clsx`) and resolves Tailwind conflicts intelligently (`tailwind-merge`, e.g. `px-2` + `px-4` → `px-4`). Standard shadcn utility.

---

## B. Pruned in the 2026-09-27 audit (were template baggage)

v0 scaffolds include the full shadcn/Radix ecosystem whether the app uses it or not. These were in `package.json` but imported **nowhere** in `app/`, `components/`, or `lib/`, so they were removed: `@radix-ui/react-*` (25 packages), `lucide-react`, `class-variance-authority`, `react-hook-form` + `@hookform/resolvers` + `zod`, `cmdk`, `sonner`, `vaul`, `embla-carousel-react`, `recharts`, `react-day-picker` + `date-fns`, `input-otp`, `react-resizable-panels`, `@emotion/is-prop-valid`. Pruning cut the `pnpm audit --prod` findings from 59 to 34 (the remainder are Next.js/PostCSS advisories not applicable to a static export). If you later add shadcn UI components, reinstall the pieces you need.

---

## C. Platform integrations

### v0.app (origin)

- This repo was generated and synced from a v0 chat. The original README documented auto-sync: edits in v0 push here, Vercel deploys from here.
- The upstream chat/deploy URLs in the old README pointed at another user's project — treat v0 sync as **historical**, not active, unless you reconnect it yourself at [v0.app](https://v0.app).

### Vercel (hosting)

- `next.config.mjs` sets `images.unoptimized: true`, which means the build is **portable** — it deploys cleanly to Vercel, Netlify, Cloudflare Pages/Workers, or any Node host.
- Deploy on Vercel: import the repo → framework auto-detected (Next.js) → `pnpm build`. No env vars required.
- Analytics (section A.1) lights up automatically on Vercel with no further setup.

---

## D. Data & privacy surface

- **No database, no auth, no API routes, no cookies, no localStorage.** The app is a pure client-side animation.
- **Outbound network calls at runtime:** Vercel Analytics beacon (Vercel deploys only). Fonts are self-hosted — no Google Fonts ping.
- Adding any backend later (DB, auth, email) starts with `.env.local` — see `docs/ENVIRONMENT_AND_CONFIGURATION.md`.
