# Developer Guide

How to work on this project: setup, architecture, the animation engine, customization, and deployment.

---

## 1. Prerequisites

- **Node.js** 18.18+ (20 LTS recommended)
- **pnpm** (the repo ships `pnpm-lock.yaml` — `npm install -g pnpm` if needed). npm/yarn also work but create a second lockfile; stick to one.

## 2. Setup & daily workflow

```bash
pnpm install     # install dependencies
pnpm dev         # dev server → http://localhost:3000 (HMR on)
pnpm build       # production build → .next/
pnpm start       # serve the production build locally
pnpm lint        # ESLint
```

No `.env` file needed. No database. Clone → install → dev.

---

## 3. Project structure

```
matrix-text-animation/
├── app/
│   ├── layout.tsx        # Root layout: fonts, metadata, <Analytics />
│   ├── page.tsx          # Single route ("/") → renders <MatrixText />
│   └── globals.css       # Tailwind + shadcn CSS variables (:root / .dark)
├── components/
│   ├── kokonutui/
│   │   └── matrix-text.tsx   # ★ The animation component
│   └── theme-provider.tsx    # next-themes wrapper (wired into layout.tsx)
├── lib/
│   └── utils.ts          # cn() — clsx + tailwind-merge
├── styles/
│   └── globals.css       # Duplicate of app/globals.css (v0 artifact — see §8)
├── public/               # Static assets (placeholder images only)
├── docs/                 # This documentation set
├── components.json       # shadcn/ui CLI config
├── tailwind.config.ts    # Tailwind v3 + shadcn theme
├── postcss.config.mjs    # Tailwind via PostCSS
├── tsconfig.json         # Strict TS, "@/*" path alias
└── next.config.mjs       # Build flags (see config doc)
```

**Routing:** Next.js App Router. There is exactly one route — `/` (`app/page.tsx`).

**Rendering:** `page.tsx` and `matrix-text.tsx` are both `"use client"` — the entire page is client-rendered. `layout.tsx` is a Server Component (metadata, fonts, Analytics).

---

## 4. The animation engine (`components/kokonutui/matrix-text.tsx`)

### What you see

The text `"HelloWorld!"` appears letter by letter; each letter first flickers as a random binary digit (`1`/`0`) glowing Matrix-green (`#00ff00` + text-shadow glow), then resolves to its final character.

### Component API

```tsx
<MatrixText
  text="HelloWorld!"        // string to animate
  className="..."            // extra Tailwind classes on the wrapper
  initialDelay={200}         // ms before the animation starts
  letterAnimationDuration={500}  // ms each letter spends in "matrix" state
  letterInterval={100}       // ms between starting consecutive letters
/>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `text` | `string` | `"HelloWorld!"` | Spaces are preserved and never flicker |
| `className` | `string` | — | Merged via `cn()` onto the centering wrapper |
| `initialDelay` | `number` | `200` | |
| `letterAnimationDuration` | `number` | `500` | How long the green binary flicker lasts per letter |
| `letterInterval` | `number` | `100` | Stagger between letters — total runtime ≈ `initialDelay + text.length × letterInterval + letterAnimationDuration` |

### How it works (internals)

1. **State:** `letters: LetterState[]` — one entry per character: `{ char, isMatrix, isSpace }`. A `isAnimatingRef` ref (not state) guards against double-starts.
2. **Kickoff:** a `useEffect` resets the letters, then fires `startAnimation` after `initialDelay`. The effect re-runs whenever `text` or timing props change, so changing the `text` prop replays the animation from scratch.
3. **Sequencer:** `startAnimation` walks an index pointer; every `letterInterval` ms it calls `animateLetter(i)`.
4. **`animateLetter(i)`:**
   - Inside `requestAnimationFrame`, sets `letters[i]` to a random `1`/`0` with `isMatrix: true` (spaces skipped).
   - After `letterAnimationDuration`, restores the true character with `isMatrix: false`.
5. **Timer hygiene:** every `setTimeout` goes through a `later()` wrapper that tracks IDs in a ref; the effect cleanup clears all pending timers — no `setState` after unmount, no leaks.
6. **Rendering:** each letter is a `<motion.div>` keyed `` `${index}-${letter.char}` `` — **the key change on every char swap forces a remount**, which is what makes the flicker feel sharp rather than a smooth morph.
   - `animate={letter.isMatrix ? "matrix" : "normal"}` with variants: `matrix` = green + glow; `initial`/`normal` are intentional no-ops so the base look stays owned by CSS (`text-black dark:text-white`).
   - Fixed `w-[1ch]` + `font-mono` + `tabular-nums` keeps every glyph the same width so the text doesn't jitter as characters change.
7. **Accessibility:** wrapper has `aria-label="Matrix text animation"`.

### Performance notes

- State updates are per-letter and batched by React; fine for headline-length strings.
- For very long strings (>200 chars), consider a canvas-based rewrite — hundreds of remounting `motion.div`s will jank on low-end devices.
- `getRandomChar` returns only `1`/`0`. For a richer Matrix rain feel, swap in a katakana/hex charset.

---

## 5. Customization recipes

**Change the text:**
```tsx
// app/page.tsx
export default function Page() {
  return <MatrixText text="LadeStack" />
}
```

**Slow cinematic reveal:**
```tsx
<MatrixText text="HelloWorld!" initialDelay={600} letterAnimationDuration={900} letterInterval={220} />
```

**Change the matrix color** — edit the variant in `matrix-text.tsx`:
```ts
matrix: {
  color: "#ff2d2d",                              // red instead of green
  textShadow: "0 2px 4px rgba(255, 45, 45, 0.5)",
},
```

**Replay on click** — the component doesn't expose replay; lift `isAnimating` or add a `key` prop from the parent:
```tsx
const [run, setRun] = useState(0)
<button onClick={() => setRun(r => r + 1)}>Replay</button>
<MatrixText key={run} text="HelloWorld!" />
```
(Remounting resets all state — simplest replay mechanism.)

**Dark-mode page background:** the wrapper uses `text-black dark:text-white` with `.dark` class strategy. `components/theme-provider.tsx` is wired into `layout.tsx` (`attribute="class"`, system default), so OS dark mode works out of the box.

---

## 6. Styling system

- **Tailwind CSS v3** with the shadcn token architecture: semantic colors (`bg-background`, `text-foreground`, `border-border`…) resolve to CSS variables defined in `app/globals.css` under `:root` (light) and `.dark` (dark).
- **To retheme:** edit the HSL values in `app/globals.css` — never hardcode colors in `tailwind.config.ts` (it only references the variables).
- **Radius scale** derives from `--radius: 0.5rem`.
- `tailwindcss-animate` provides `animate-accordion-down/up` etc. for future shadcn components.

## 7. Adding shadcn/ui components

`components.json` is pre-configured. From the project root:

```bash
npx shadcn@latest add button
```

This scaffolds `components/ui/button.tsx` using the `@/` aliases and lucide icons. All 25 Radix primitives are already in `package.json`, so new components install with no extra dependency step.

---

## 8. Known quirks & cleanup opportunities

1. ~~**`components/theme-provider.tsx` is dead code**~~ — wired into `layout.tsx` in the 2026-09-27 audit (system dark mode now functional).
2. **`public/` holds only placeholder images** (`placeholder-logo.*`, `placeholder-user.jpg`, `placeholder.jpg`) — replace or delete before shipping.
3. **ESLint has no config** — `next.config.mjs` sets `ignoreDuringBuilds: true` and the repo ships no eslint config, so `next lint` prompts interactively. Add a flat `eslint.config.mjs` if you want lint in CI.
4. **`motion` and `@emotion/is-prop-valid` are pinned** (were `"latest"`) — keep them pinned for reproducible installs.
5. **Unused dependency baggage** (Radix set, react-hook-form, recharts, …) is installed but imported nowhere — prune if this stays a single-animation showcase (see `docs/THIRD_PARTY_INTEGRATIONS.md`).

Fixed in the 2026-09-27 audit: `styles/globals.css` duplicate deleted; metadata (`title`/`description`) corrected; `package.json` name fixed; `typescript.ignoreBuildErrors` removed (build is now strict); motion variants defined explicitly (incl. transparent textShadow start/end so Motion interpolates the glow without warnings); unmount timer leak fixed; `text` prop changes now restart the animation; stale-rAF guard for shortened text; `next` upgraded 15.2.4 → 15.5.9 (patches critical flight-protocol RCE GHSA-9qr9-h5gf-34mp); ~40 unused v0/Radix deps pruned (59 → 34 audit findings, remainder not applicable to static export); `ThemeProvider` wired; `output: 'export'` enabled — the app is now a fully static site deployable to any static host.

---

## 9. Build & deploy

```bash
pnpm build && pnpm start
```

- **Vercel (recommended):** import repo → defaults work → no env vars needed. Analytics activates automatically.
- **Any Node host:** `pnpm build` → `pnpm start` (port `3000`, override with `PORT=`).
- **Static hosts (Netlify, Cloudflare Pages, GitHub Pages):** `output: 'export'` is set in `next.config.mjs`, so `next build` emits a static `out/` directory — deployed to Cloudflare Pages (note: `<Analytics />` still renders harmlessly).
- **Docker:** standard Next.js standalone pattern works; set `output: 'standalone'` if you want the minimal image.

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Port in use | another dev server | `pnpm dev -- -p 3001` |
| Styles missing / unstyled | class used outside `content` globs | add the path to `tailwind.config.ts` `content` |
| `next lint` asks about flat config | Next 15 + ESLint 9 prompt | accept once, or run `pnpm dlx @next/codemod` |
| TS errors don't fail build | `ignoreBuildErrors: true` | remove it in `next.config.mjs` |
| Analytics shows no data locally | expected — only collects on Vercel prod | deploy a preview and check the Analytics tab |
| Flicker looks smooth instead of sharp | key no longer changes per char | keep `` key={`${index}-${letter.char}`} `` |
