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
│   └── theme-provider.tsx    # next-themes wrapper (currently unused)
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

1. **State:** `letters: LetterState[]` — one entry per character: `{ char, isMatrix, isSpace }`. `isAnimating` guards against double-starts (React StrictMode double-invokes effects in dev).
2. **Kickoff:** `useEffect` fires `startAnimation` after `initialDelay`.
3. **Sequencer:** `startAnimation` walks an index pointer; every `letterInterval` ms it calls `animateLetter(i)`.
4. **`animateLetter(i)`:**
   - Inside `requestAnimationFrame`, sets `letters[i]` to a random `1`/`0` with `isMatrix: true` (spaces skipped).
   - After `letterAnimationDuration`, restores the true character with `isMatrix: false`.
5. **Rendering:** each letter is a `<motion.div>` keyed `` `${index}-${letter.char}` `` — **the key change on every char swap forces a remount**, which is what makes the flicker feel sharp rather than a smooth morph.
   - `animate={letter.isMatrix ? "matrix" : "normal"}` with variants: `matrix` = green + glow. (`initial`/`normal` variants are commented out, so non-matrix letters simply render unstyled — Motion ignores missing variant names gracefully.)
   - Fixed `w-[1ch]` + `font-mono` + `tabular-nums` keeps every glyph the same width so the text doesn't jitter as characters change.
6. **Accessibility:** wrapper has `aria-label="Matrix text animation"`.

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

**Dark-mode page background:** the wrapper uses `text-black dark:text-white` with `.dark` class strategy. Wire `components/theme-provider.tsx` into `layout.tsx` and add a theme toggle to make it functional (see §8).

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

1. **`styles/globals.css` is a duplicate** of `app/globals.css` and imported nowhere — v0 artifact. Safe to delete.
2. **`components/theme-provider.tsx` is dead code** — defined but never used in `layout.tsx`. Either wire it up (`<ThemeProvider attribute="class" …>` around `{children}`) or delete it with `next-themes`.
3. **Commented-out variants** in `matrix-text.tsx` (`initial`, `normal`) — harmless (Motion ignores them), but tidy up if you touch the file.
4. **`useEffect(..., [])` with `startAnimation` omitted from deps** — intentional-ish (run once); `next lint` would flag it, but `next.config.mjs` skips ESLint during builds.
5. **`typescript.ignoreBuildErrors: true`** — fine for prototyping; remove for production CI so type errors actually fail the build.
6. **`public/` holds only placeholder images** (`placeholder-logo.*`, `placeholder-user.jpg`, `placeholder.jpg`) — replace or delete before shipping.
7. **`package.json` name is `my-v0-project`** — rename to `matrix-text-animation`.
8. **Old README referenced another user's v0/Vercel URLs** — replaced by the new README in this docs pass.

---

## 9. Build & deploy

```bash
pnpm build && pnpm start
```

- **Vercel (recommended):** import repo → defaults work → no env vars needed. Analytics activates automatically.
- **Any Node host:** `pnpm build` → `pnpm start` (port `3000`, override with `PORT=`).
- **Static hosts (Netlify, Cloudflare Pages, GitHub Pages):** `images.unoptimized: true` is already set, so `next build` output can be served statically; for a fully static export add `output: 'export'` to `next.config.mjs` (note: `<Analytics />` still renders harmlessly).
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
