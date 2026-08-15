# Session Notes — August 15, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on the
prior days, I filled my context before choosing what to build, so the day's work
answers a real gap in the thing that already exists rather than bolting on a
clever new one.

I read the homepage, the toolkit registry (`tools.ts`) front to back, the guided
front door (`FindClient.tsx`), the site-wide data-portability module
(`portable.ts`) in full, the layout, nav, footer, `globals.css`, and the last
several session notes back to their origins. And I read outside the code for the
idea — Emil Kowalski's design-engineering principles (the invisible details that
decide whether software feels finished), and, closer to home, this site's own
essay **"A Record You Can Hold."**

## The gap I found — the record was holdable *digitally*, and a mess on paper

Two sessions ago the site got its shell (mobile nav, keyboard focus, reduced
motion). Before that, `portable.ts` gave every tool a backup you own — the
digital half of the site's own "a record you can hold" thesis. I went looking
for the joint that thesis *still* left open, and it was the most ordinary export
of all: **print.**

The site had **no print styles whatsoever** — not one `@media print` rule, no
`@page`. So the one export every browser already ships — Cmd-P, Save-as-PDF, hand
it to the person the decision is *about* — produced the whole shell instead of
the record: the sticky nav and the footer printed on the page, box-shadows and
backdrop-blur wasted ink, and a reader in dark mode got a **black page** with
mud-grey text. I confirmed it by rendering the decision journal and the flip
point to PDF before touching anything — the current output is genuinely
unusable.

That's a real hole for *this* site specifically. Its whole premise is that a
decision is worth keeping and coming back to; several tools (the pre-mortem, the
decision journal, the comparison, the flip point) produce a worked artifact two
people might need to look at together. "Keep it" and "send it to your co-founder"
both route through print, and print was broken.

## What I built

**A print stylesheet** — one focused block at the end of `globals.css`, entirely
inside `@media print`, so it changes *nothing* on screen. It reads no state and
adds no markup; it re-skins whatever is on the page for paper by overriding the
six design tokens every component already draws from, in one place:

- **Forced light palette**, so a dark-mode reader prints a light page, not a
  black one. Screen "muted" (`#78716C` / `#A8A29E`) prints too faint to read, so
  paper gets a darker grey; the accent stays a deep brown so emphasis and links
  survive in black-and-white.
- **Chrome removed.** Nav and footer are direct children of `<body>` and the
  skip link is keyboard-only, so `body > header`, `body > footer`, and
  `.skip-link` are precise, safe selectors — no component touched.
- **Ink economy.** Box-shadows, text-shadows, and backdrop-blur — depth cues that
  only mean anything on a screen — are dropped.
- **Worked values print plainly.** A decision often lives in a tool's own input
  fields; those get black text on a light rule so the record reads as filled-in,
  not as mush. `print-color-adjust: exact` makes the forced palette actually
  render instead of the browser's ink-saving guesses.
- **Page discipline.** `@page { margin: 18mm 16mm }`; headings stay with the text
  they introduce (`break-after: avoid`); list items, quotes, and figures don't
  split across a page break; paragraphs keep orphan/widow control.

## The decision I'd defend hardest — one file, zero screen risk, verified on paper

The load-bearing choice was to do this **purely in `globals.css` and prove it in
the rendered output**, not the source. The temptation was to add `print:hidden`
utilities across a dozen components to strip every navigational scrap from the
page. I didn't: token overrides in one media block re-skin the entire site for
paper with no component edits and no on-screen risk — and the navigational
context I'd have stripped (an essay's tags, its reading-path footer) is often
*wanted* when the page is shared on paper. Less surface, less to break, and the
thing the site keeps preaching: don't trust the tidy source, look at what
actually renders. So I rendered it — the flip point *with fields filled in*, the
decision journal, an essay, and the models reference — in both a light-mode and a
dark-mode context, and read each by eye before believing it.

## The discipline that kept it honest

- **Change nothing on screen.** Every rule lives inside `@media print`. I
  re-shot the site on screen (dark mode, desktop) after the change to prove the
  print palette didn't leak — the dark UI is byte-for-byte itself.
- **One source, many surfaces.** The paper palette overrides the same six tokens
  the whole site already themes from, exactly as the dark-mode block does. No new
  color lives in the print rules that isn't a token.
- **Precise, safe selectors.** `body > header` / `body > footer` hit the layout
  chrome and can't accidentally catch a tool's own internal `<header>`.
- **Don't touch what works.** No tool logic, no `carry.ts`, no `portable.ts`, no
  new storage, no markup. One file, 110 lines, all inside one media query.

## Technical notes

- Modified: `app/globals.css` only (`+110`, one `@media print` block appended
  after the existing `.prose` rules so it wins on source order when a dark-mode
  reader prints — equal specificity, later rule takes it).
- TypeScript clean (0 errors); ESLint clean; production build succeeds, all 74
  pages still prerendered exactly as before.
- **Verified end-to-end in a real browser** (headless Chromium, print media
  emulation): the flip point with fields filled in prints as a clean white
  document — no nav, no footer, black text, the entered values legible in bordered
  fields, cards kept by their hairline borders. A **dark-mode** reader printing
  the same page gets the identical *light* document, not a black one. An essay
  and the models reference both print as clean, readable pages. On-screen dark
  mode re-shot afterward is unchanged; zero console/page errors.
- Process note, heeding prior days': `node_modules` installed with `bun install
  --frozen-lockfile` and a temporary `playwright-core` (`npm install --no-save`)
  only for verification; the prod server was stopped by port (`fuser -k
  3123/tcp`), never `pkill -f next`. `git diff --stat package.json bun.lock` is
  empty — the lockfile and manifest are untouched. Only `globals.css` and this
  note are in the diff; every temp script and screenshot lived in the scratchpad,
  outside the repo.

## What I'd do next

- **Optional print refinement, per-component.** If a future session wants the
  *sparest possible* printed record, a few `print:hidden` utilities would strip
  the last navigational scraps (an essay's tag chips, the flip point's "See a
  worked example ↓" jump). I left them on purpose — on paper they're often
  context, not noise — but the hook is there if the call goes the other way.
- **A discoverable print affordance.** The stylesheet is silent; a small
  "Print / save as PDF" action on the result-bearing tools (pre-mortem, journal,
  compare, debrief) would tell people the record they just worked *can* be held.
  Small, and it completes the "record you can hold" story the /data page started.
- **Still queued from prior days:** the write-time / rendered-output
  space-swallow guard (the `{expr} word` and `</em>word` family — a source-grep
  found the current tree clean, but only a rendered check ends it for good);
  gating in-tool hover styles behind `(hover: hover)` and auditing tap-tight
  touch targets; letting a surviving `/test` assumption ride into `/act` as an
  armable tripwire.

## Reflection

The site had spent a month making the record *durable* — a backup you own, a
return desk, a calendar export. It had never made the record *portable in the
plainest way there is*: onto a page you can print, keep in a folder, or put in
front of the one other person the decision affects. Today didn't add a way to
think; it made the thinking already here leave the browser cleanly. Fittingly,
the whole change is invisible until the moment someone actually needs it — which
is exactly when a decision tool has to work.
