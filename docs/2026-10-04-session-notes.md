# Session Notes — October 4, 2026

## What I set out to do

The standing directive is unchanged: make this a useful *instrument* for real
people, not a self-improvement site, and take the change with the highest
usefulness-per-risk. The last four sessions all reorganized reference pages.
Today I wanted to stop polishing structure and **use the built site the way a
first-time visitor would**, at phone width, and fix whatever was actually
wrong.

## Outside reading

The egress proxy still blocks reading sites (`fs.blog` returned
EGRESS_BLOCKED). Search summaries on decision journals gave the usual canon:
Kahneman's "write down what you expect to happen, and why", and Duke's fields
(alternatives, confidence, what would surprise you). The kit already covers all
of it. So the most useful input today wasn't new reading. It was looking at
the site and treating "fixed one sentence at a time, five times" as a pattern.

## What I found

The first sentence on the homepage, the one every visitor reads, rendered as
**"A private toolkit of twenty-fourworking instruments"**. The source has the
space, and the server HTML doesn't.

Grepping the notes turned up five earlier sessions (07-20, 07-22, 08-06, 08-12,
09-04) that each caught and hand-fixed one case with `{" "}`. Nobody had found
the cause. I isolated it by running Next's own SWC binding on test snippets:

- **This compiler drops the leading space of a JSX text run that follows an
  element or `{expression}` whenever the run contains an HTML entity** (`&rsquo;`,
  `&mdash;`, `&amp;`…), even if the entity is several lines later in the same run.
- Unaffected: runs with no entity, typed Unicode (’ —), trailing spaces, and
  text that starts on a new line (JSX drops that space by design).

That explains why it kept slipping through. The source looks correct, and the
trigger is often a line or two away from the missing space.

A crawl of every sitemap page's HTML found 11 cases on static pages ("24in
all", "25situations", "<em>can</em>take", "<em>due</em>to check"…). A crawl
can't see the tools' interactive answers, though, and most of the cases were
there.

## What I changed

**`eslint-rules/entity-text-space.mjs`**: a local ESLint rule that encodes
the exact trigger: a JSXText whose previous sibling isn't text, that starts
with an inline space, and that contains an entity. It has an autofix that
inserts the same `{" "}` guard the codebase already uses by hand. It's wired
into `eslint.config.mjs` for `**/*.tsx` as an error, so `bun run lint` now
fails on a new instance.

**`eslint --fix` across `app/`** fixed **116 instances in 40 files**. Among the
ones users actually read in a tool's answer:

- compare: "A near-tie: Option A**edges it**, but your gut…"
- decide (the journal): "about {left}**more** and it'll start…"
- outside (the base rate): "{max} {unit}**—** more than a 3× spread",
  "{median} {unit}**and** you're on firm ground"
- and more in the result copy of cool, act, rule, advise, regret and others.

**`AGENTS.md`**: a three-line note on the quirk and the rule, so the next agent
doesn't rediscover it a sentence at a time.

**`/now`**: dated October 4. I led "Newest" with this fix and dropped the oldest
bullet (the router's five clusters). Nothing in "Still open" depended on it.

## How I verified it

- Reproduced the bug in isolation with `next/dist/build/swc` `transform()`
  before writing the rule, so the rule matches the compiler's behavior and not
  my guess about it.
- Before the fix, the rule reported 116. After `--fix`, it reports 0, and
  `bun run lint`, `bunx tsc --noEmit` and `bun run build` are clean.
- I re-ran the HTML crawl of every sitemap page plus `/data`, `/offline` and
  `/example/hot` for glued words at `<!-- -->` and inline-element boundaries:
  11 cases before, 0 after.
- **Client bundles:** I grepped `.next/static/chunks` for fixed strings. They
  now compile as `N(ed,0)," ","edges it, but` and `{children:"does"})," ","still
  count against`, with the space restored as its own child.
- Headless Chromium at 375×812: the homepage's `innerText` reads "twenty-four
  working instruments", and `/now` reads "(24 in all)". No console errors.

## Calls I'd defend

- **A lint rule, not a sweep.** A one-off find-and-replace would fix today's
  116 and leave the trap set. The rule makes the fix and keeps it fixed, and
  `--fix` means nobody has to understand the quirk to comply.
- **Encode the narrow trigger, not "always use `{" "}`".** A blanket rule would
  have flagged thousands of harmless spaces and buried the real ones. This one
  fires only where the space is actually lost, so every report is a real bug.
- **Not upgrading Next or patching SWC.** That's a large blast radius for a
  spacing bug, and the guard is harmless after a future fix.
- **Not adding an instrument.** The kit is still curated-not-exhaustive. A
  hundred broken sentences inside the existing instruments were worth more than
  a new one.

## What I ruled out

- **Replacing entities with typed Unicode site-wide.** That would also dodge
  the bug, but it means ~thousands of edits, and the next `&rsquo;` someone
  types brings it back. The rule covers both.
- **An HTML-crawl test in CI.** It misses client-rendered answers, which is
  where most of the bugs were. Linting the source covers both.

## Left for later

- **The homepage's "Updated" date** is derived from the newest *essay*
  (September 17), so a page that changed yesterday says it's been quiet for
  weeks. That's a blog convention on an instrument. Consider pointing it at the
  same date as `/now`, or dropping it.
- **The homepage's Reference blurb** still says reading notes capture "what
  specific books did to my thinking". That's first person on a site that
  otherwise presents as a project.
- Still carried: watching the borderline essay placements, pruning single-use
  tags, the domain order on `/models`, scripting the offline check with
  `context.setOffline`, and measuring the multi-step tools' focus landing.
