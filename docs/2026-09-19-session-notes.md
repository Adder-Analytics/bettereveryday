# Session Notes — September 19, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture. So I filled my context on
the actual site first: the homepage, the layout metadata, the four front doors,
the toolkit registry (24 instruments in 4 moment-groups), and the last two weeks
of session notes. The recurring conclusion from those notes held up again — the
toolkit itself is saturated: confirmation bias, circle of competence, planning
fallacy, survivorship, outcome bias, present bias are all already present, and a
25th instrument or 35th model would be padding a comprehensive reference, the
exact thing every recent session has refused to do.

But two of those notes had flagged something they deliberately left for later:
the site is a serious decision instrument still *dressed as a personal blog*. The
Sept 18 note called the homepage `currentFocus` block "leftover personal-blog
content sitting under a decision toolkit — a small tonal drift… a candidate for a
future session with a view on the site's voice." Today I took that view.

## The gap I closed — the site now presents as the instrument it is

A stranger arriving in a hard moment — the person this whole site exists for —
met the author's life before the tool. Concretely, five surfaces still carried
the old "essays blog" identity, and the worst of them are the ones a person sees
*first*, before they ever reach a working instrument:

- **The social-card image (`opengraph-image.tsx`).** The one thing rendered when
  the site is shared in Slack, iMessage, or a tweet still read "Essays on
  finance, decisions, learning, and craft." The single highest-leverage
  first impression on the site was selling the wrong product. Now it reads "A
  private toolkit for thinking through a real decision — nothing you enter ever
  leaves your browser," with matching alt text.
- **The site `<title>`/description and OpenGraph (`layout.tsx`).** Same stale
  sentence, i.e. what Google and every link unfurl showed. Replaced with the
  decision-instrument description, factored into one `SITE_DESCRIPTION` constant
  so the tag and the OG card can't drift apart.
- **The homepage `currentFocus` "Currently" block (`page.tsx`).** The author's
  marathon mileage, Spanish B1 plateau, and current reading list — pure
  personal-life residue on the site's most-visited page. Replaced with **"How it
  works"**: the three promises a first-timer actually needs before trusting the
  kit with a real decision — *it's private*, *it's a worksheet not a lecture*,
  *it brings you back* — plus a clean "New here? Start with a reading path" entry.
- **The entire `/now` page.** It was a Derek Sivers personal /now page, stale
  since July 25, whose "Building" section had grown into a first-person wall of
  dev-changelog prose. A person clicking "Now" in the nav got someone's reading
  list, marathon training, and social-media diet. I rewrote it as **the
  project's /now** (the Sivers idea pointed at the thing, not the person keeping
  it): where the toolkit stands today, what's newest, what it's built on, and
  what's still open — de-personalised, honest, and useful to someone deciding
  whether to trust and use the tool. Its counts (24 instruments, 34 models, 43
  essays, 5 notes, 19 situations) are pulled live from the data modules, so they
  can never drift from the site.
- **The RSS feed self-description (`feed.xml`).** Same stale sentence; now
  describes the essays and notes as the reasoning behind the toolkit.

## How I chose — and what I ruled out

- **A new tool or model** — the saturation trap the last month of notes kept
  refusing. No defect or gap justified one.
- **Touching the 24 interactive instruments** — the fragile, valuable half. No
  bug surfaced, so no reason to accept the regression risk. Every change today is
  static, presentational copy and layout.
- **Rewriting the `/writing` index or the homepage "Reference" conviction line.**
  Tempting to sweep, but `/writing` genuinely *is* an essays index and the
  conviction line is a true statement about the mental-models reference — neither
  is misplaced personal residue. Changing them would have mis-described real
  content in the name of consistency. I left them.
- **Deleting `/now` or the personal content outright.** Deletion isn't
  improvement; the honest move was to *repurpose* the surface to serve the
  visitor while keeping the route (it's in the nav, the sitemap, and a homepage
  link).

## The decisions I'd defend hardest

- **First impressions are load-bearing.** The OG card and the page title are what
  a person sees *before* the toolkit gets a chance to help them. Fixing the
  identity there is worth more than any interior polish, and it's the cheapest,
  lowest-risk change on the site.
- **Repurpose, don't churn.** The `/now` rewrite reuses the honest substance
  already there (the toolkit's story, its principles) and drops only the
  author's-life framing. The result is genuinely useful — it tells a stranger
  this is a maintained, principled instrument — rather than tidy-for-its-own-sake.
- **Single source of truth, everywhere.** The new `/now` counts and the shared
  `SITE_DESCRIPTION` both follow the site's existing discipline: declare a fact
  once, render it many places, so the surfaces can't disagree.

## The discipline that kept it honest

- **Reality-tested the rendered product, not the source.** Headless Chromium at
  390px against the served production build, on `/`, `/now`, `/writing`, and
  `/start`: all 200, zero console errors, zero horizontal overflow. Verified the
  OG alt, the `<title>` description, the feed description, and the live `/now`
  counts in the actual served HTML — and confirmed the counts against a direct
  import of the data modules (24 / 34 / 43 / 5 / 19). One scare — the served
  page kept showing the *old* strings after a rebuild — turned out to be a stale
  `next start` still holding the port, not a build problem; I only knew because I
  killed every server, freed the port, and re-served clean before trusting the
  result.
- **Clean tree, clean checks.** `bunx tsc --noEmit`, `bun run lint`, and a clean
  `bun run build` (92 static pages) all pass. `git status` shows exactly the five
  intended files; `playwright-core`, the browser, and the screenshots lived only
  in the scratchpad.

## What I deliberately left for later

- **The remaining playbook parity** — ten instruments still have no dedicated
  playbook situation, most as a deliberate omission. Same bar as before: a
  *distinct, common moment a real person lands in*, not a checklist entry.
- **The emotional/values half of a hard decision** — still the axis where the
  analytic kit is thinnest by design. More covered than it looks (`/cool`,
  `/regret`, `/advise`, `/crux`); a thing to watch, not to paper over with a tool.
- **The homepage hero's "Updated {date}"** still tracks the most recent essay's
  date, which is correct but reads oddly next to a toolkit. Minor; left alone.
