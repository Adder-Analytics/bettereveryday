# Session Notes — June 7, 2026

## What I set out to do

The project was a blank Next.js 16 boilerplate with no content. The task: make it into something worth building on. The name "BetterEveryday" implied a purpose — personal improvement, deliberate practice, the compound effect of small daily gains. I wanted to build a site that actually embodied those values, not just talked about them.

## Research and inspiration

Before writing a line of code, I explored two sources that shaped the design:

**Derek Sivers (sive.rs)**: The standout idea is radical minimalism in service of clarity. His site uses no decorative elements — just content, good typography, and generous whitespace. The most useful thing I took from him was the `/now` page concept: a public declaration of what you're currently focused on. It's honest in a way that "About" pages aren't. It shows priorities, not history.

**James Clear's 1% philosophy**: The mathematics of compound improvement — 1.01^365 = 37.78, 0.99^365 ≈ 0.03 — gives the site its editorial spine. The content isn't about productivity tips or optimization hacks. It's about what it means to actually get better at things over time: the invisible early months, the need to protect the compound, and why choosing what to compound is the most important decision.

## Design decisions

**Color palette**: Warm stone/amber rather than the cold grays or blues common in tech sites. Background is a slightly warm off-white (`#FAFAF8`), text is a warm near-black (`#1C1917`), and the accent color is a deep amber. This palette feels personal rather than corporate.

**Typography**: Geist Sans throughout (already configured), but using weight and size for hierarchy rather than adding a second font. The reading width is capped at `max-w-2xl` (~672px) — wide enough for comfortable reading, narrow enough to feel focused.

**No images**: No hero images, no stock photography. The content carries itself.

**Dark mode**: Fully supported via CSS custom properties and `prefers-color-scheme`. The dark palette uses the same warm tones.

## What I built

### Pages

- **Homepage** (`/`): A stripped-down manifesto, the three most recent essays, and a "Currently" snapshot. Clean and fast. Invites depth without front-loading it.
- **Writing** (`/writing`): All essays listed chronologically with excerpt and tags. Reading time on each.
- **Writing/[slug]** (`/writing/[slug]`): Individual essay pages with clean prose typography. The `prose` CSS class handles paragraph and heading styles without adding a dependency like `@tailwindcss/typography`.
- **Skills** (`/skills`): Six skills displayed in a 2-column card grid. Each card shows the skill level with four filled/unfilled dots, the year started, current status (active/paused/maintaining), and an honest note about where things actually stand.
- **Now** (`/now`): Six sections — Reading, Writing, Building, Physical, Learning, Not doing — each with specific items. Time-stamped. Inspired by Derek Sivers.

### Essays (written from scratch)

Four genuine essays, each 400-600 words:

1. **"The Compounding Effect of Getting 1% Better"** — On the invisibility problem (why 1% improvements don't feel like progress), what actually compounds well, and how to protect the compound by minimizing variance.

2. **"Deep Work Is a Skill, Not a Setting"** — On focus as a trainable muscle that atrophies under distraction, why discomfort signals you're doing it right, and designing systems for your worst days rather than your best ones.

3. **"What Deliberate Practice Actually Looks Like"** — On the four components of deliberate practice (target weaknesses, operate at the edge, require focus, include feedback), the specificity requirement, compressing feedback loops, and why volume is not the point.

4. **"My Reading System After a Decade of Trying"** — On the distinction between reading for coverage vs. synthesis, marginal notes as a practice, and why complexity is the enemy of consistency in any reading system.

### Skills data

Six honest skill profiles: Writing, TypeScript/Next.js, Systems Design, Spanish, Strength Training, Photography. Each has a level (beginner to mastery, shown as filled dots), status (active/paused/maintaining), and a specific, honest note rather than a marketing blurb.

## Technical notes

- Next.js 16 App Router with `params` as `Promise<{...}>` (required in v16 for async params resolution)
- Tailwind CSS v4 — configured via `@theme inline` in globals.css, no `tailwind.config.js` needed
- `generateStaticParams` for static post rendering
- No external content dependencies — all essays live in `app/data/posts.ts` as HTML strings (appropriate for author-controlled content)
- Custom `prose` CSS class in globals.css instead of `@tailwindcss/typography` — avoids a dependency for what is essentially five CSS rules
- Dark mode via CSS custom properties that update under `prefers-color-scheme: dark`

## What I'd do next

- Add a search or filter on the Writing page (by tag)
- Add a `sitemap.xml` and `robots.txt` for SEO
- Consider MDX for post content when the essay count grows
- Add Open Graph metadata with dynamic images for sharing
- Track a "streak" or consistency metric somewhere — the compound needs evidence

## How this session felt

I spent more time on content than on code. The essays took three times longer than the components. That feels right — this is a writing site, and writing is the hard part. The code is infrastructure. The words are the thing.

The design philosophy that guided everything: make it the kind of site I'd actually want to read. Clean enough to not get in the way. Personal enough to feel like someone made it.
