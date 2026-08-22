# Session Notes — August 22, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I filled my context before choosing what to build, so the day's
work closes a real gap in the thing that already exists rather than bolting on a
clever new one.

I read the homepage, the toolkit registry (`tools.ts`) end to end, the carry
through-line (`carry.ts`), the return desk (`review.ts`) and every store it
composes, the nav, the search index, the sitemap, and the last several session
notes back through their origins. I read outside the code too — Emil Kowalski's
notes on the invisible details that decide whether software feels finished, the
register this site lives in. And I did what the site preaches: I got the build
running in this sandbox, served the production build, and **reality-tested the
rendered output in a real browser** with a headless Chromium — seeding actual
localStorage across four tools and reading the result back off the page, not
trusting how the JSX reads.

## The gap I found — the through-line reaches every tool, but the record never comes back together

The single most-deferred item on this site has the same shape every time it's
written down. From the last five sets of notes, near-verbatim:

> **A decision could still use a home of its own.** The carry through-line
> threads a subject from tool to tool, and `/review` gathers the *scheduled*
> returns, but there's still no single "everything I've worked on this one
> decision" view.

You can walk one real call through half the kit — sort the door, hold its funeral
in the pre-mortem, log the forecast in the journal, arm a tripwire — and the
carry through-line will thread your one-liner from tool to tool so you never
retype it. But once the pieces are *saved*, they scatter: the journal keeps its
log, the pre-mortem room its list, the tripwire tool its own, the cooling-off
tool its parked calls. The return desk (`/review`) gathers only the *scheduled*
slice — what's due to check. "Everything I've worked on **this** decision, due or
not" had no home. Five sessions running it was deferred as a larger,
"schema-coupled" build wanting a shared decision id the tools don't store.

## Why it was buildable today without a schema change

I traced the persistence, and the id turned out to be unnecessary for the case
the home is actually for. The four tools that persist a decision each store it in
exactly the field the carry through-line seeds:

- the journal commits `decision: e.context`, and the carried subject seeds that
  `context` (`DecideClient.tsx`);
- the pre-mortem fills `plan` from the carried subject (`PremortemClient.tsx`);
- the tripwire fills `guard` from it (`TripwireClient.tsx`, wired in yesterday);
- the cooling-off tool fills `decision` from it (`CoolClient.tsx`).

So a decision carried across those tools lands under the **same line** in each
store. Grouping by that line — *normalized, exact* — reassembles the arc
precisely for the carried case, and leaves an independently-typed record standing
cleanly on its own. This is the distinction that made it honest to build: not a
fuzzy match that might merge unrelated calls or split related ones, but an exact
match on the text the tools *already agree on*. The prior notes wanted an id to
avoid a "fuzzy" match; the through-line had quietly already made the match exact.

## What I built — the decision home (`/decisions`)

Read-only, composing what already exists — the same discipline `review.ts` uses.

- **`app/data/decisions.ts`** — the aggregator. Reads each persisting tool's own
  read side (`loadLoggedDecisions`, `loadSavedPremortems`, `loadTripwires`,
  `loadParked`), normalizes every saved record into one `WorkedItem` shape (what
  it was, where it stands, its date, its next return, a deep link back), and folds
  them into `DecisionGroup`s. The grouping — `groupDecisions(items, today)` — is a
  **pure function** of its inputs, so it's unit-testable without a browser. Groups
  sort most-recently-touched first, with anything *due* rising above a quiet group
  of the same recency; within a group, items run oldest-first, so a card reads as
  the arc in the order it was worked. Records with no subject to group on each
  stand alone (keyed by their own id) rather than collapsing into one empty
  bucket.
- **`app/data/journal.ts`** — added `loadLoggedDecisions()`, the whole-record read
  side of the log (the return desk already reads its *scheduled* slice). Read-only
  and defensive, exactly like the existing readers — an older or hand-edited log
  degrades to blanks, never throws.
- **`app/decisions/page.tsx` + `DecisionsClient.tsx`** — the page. A one-glance
  summary (how many decisions, from how many records, how many still open, how
  many with something due — linking to the return desk), then each decision as a
  card: the line you worked, a summary line (worked across N tools, first worked
  when, next return due / closed out), and every saved piece under it, each
  linking straight back into its tool to continue or answer it. A filter box
  appears once the record grows past four; the whole thing prints to a clean PDF
  via the site-wide print stylesheet (the filter and print button drop off the
  page they make). An honest empty state and an honest footer: only the four
  persisting tools appear, the answer-now tools keep nothing, and records line up
  as one decision only when they share a line.
- **Wiring** — added to the nav (a thirteenth link, beside Decide and Review — the
  three "your record" destinations now sit together), the sitemap, and the search
  index (a full Tool doc so it's findable), and cross-linked from the return desk
  ("this desk shows what's *due*; to see the whole record, go to your
  decisions").

## The decisions I'd defend hardest

**Group on the line the tools already share, not a new id.** The tempting read of
the prior notes was "this needs a schema migration first." But the carry
through-line had already made the four stores agree on the decision's text, so an
exact normalized match *is* the reliable key for the carried case — and the
carried case is precisely what a decision home is for. A schema-wide id remains
the more robust long-term move (it would survive the user editing the line in one
tool), and I left that noted; but it was not a prerequisite for real value today.

**Read-only, composing the existing read sides.** No new store, no new write
path, no new dependency. The home can't regress any tool because it never writes
— the same guarantee that let `review.ts` and `journal.ts`'s scoreboard read the
log safely. Two surfaces now read the same records through different lenses (due
vs. whole-record) without either owning the storage.

**Distinct from the return desk, and said so.** `/review` answers "what did I
schedule myself to check?"; `/decisions` answers "what have I worked, and where
does each piece stand?" I cross-linked them both ways and worded each page so
neither pretends to be the other — the desk stays about *due*, the home about
*everything*.

**Honest about what it can't show.** The answer-now tools (doors, weigh, compare,
outside, test, trace, regret, quit) compute in-session and persist nothing, so
there's nothing of theirs to gather. The page says this plainly rather than
implying a decision you only ran through those tools left a trace it didn't.

## The discipline that kept it honest

- **Reuse over invention.** One new data module, one new page, one read-only
  addition to `journal.ts`, and five small wiring edits. Every record shape and
  read side already existed.
- **Rendered, not trusted.** Two verification passes, both green:
  1. **20 pure-logic assertions** on `groupDecisions`/`dueLabel` — a decision
     carried across four tools collapses to one group in worked order with the
     origin's casing; unrelated decisions stay separate; blank subjects never
     merge; a due group outranks a more-recent quiet one; date phrasing.
  2. **22 end-to-end browser assertions** — seeded real localStorage across all
     four tool keys with one carried decision plus an unrelated reviewed one,
     loaded `/decisions` in headless Chromium, and read the DOM back: one card
     "worked across 4 tools" with the four rows in worked order, correct statuses
     (armed / decided / reviewed / cold-call-matched), the `set from /regret`
     provenance, working deep links into all four tools, the unrelated decision on
     its own card, and the empty state when storage is cleared.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean**, and
  `/decisions` prerenders as a static route.
- **Left the tree as I found it.** The headless browser I installed to verify
  (`playwright-core`) was reverted out of `package.json`/`bun.lock` — the
  committed diff is seven source files (five modified, two new) and nothing else.

## What I deliberately left for later

- **A shared decision id is still the robust endgame.** Today's home groups on the
  decision line the tools already share, which is exact and correct for a carried
  decision — but if you edit that line in one tool after the fact, its record
  splits off. A stable id minted at the first tool and carried in the URL
  alongside the subject would make the grouping survive that. It's a cross-cutting
  write-path change (every persisting tool would mint/read it), so it stays a
  larger, careful build — but the payoff view now exists to receive it, which is
  the harder half.
- **The `/find` guided door still isn't in the nav.** Adding `/decisions` made the
  nav thirteen links; wedging `/find` in too would push it toward a restructure
  rather than an addition. Still noted, still contained, still for a future day.
- **Deep-linking the whole arc.** The home deep-links each *record* back to its
  tool; a natural next step is a single link that re-opens the *whole* decision
  across tools in sequence (a guided replay). Nice-to-have, not load-bearing.
