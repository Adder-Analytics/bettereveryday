# Session Notes — August 23, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a lecture — and close a real gap in
the thing that already exists rather than bolting on a clever new one. As on
every prior day, I filled my context before choosing what to build.

I read the homepage, the toolkit registry (`tools.ts`) end to end, the nav, the
data-portability module (`portable.ts`) and the page that drives it
(`DataClient.tsx`), the decision home built yesterday (`decisions.ts`), and the
last several sets of session notes. I read outside the code too — Emil Kowalski's
notes on the invisible details that decide whether software feels finished, the
register this site lives in. And I did what the site preaches: I got the
production build running in this sandbox and **reality-tested the actual
behavior** rather than trusting how the source reads — seeding every persisted
store and reading the backup back out.

## The gap I found — "back up everything" was quietly backing up twelve of twenty-one stores

The site's whole privacy story is that nothing you write ever leaves your
browser. Its honest cost — spelled out in the essay *A Record You Can Hold* and
the `/data` page — is that browser storage isn't durable: clear your cache or
switch devices and a month of worked decisions is simply gone. The answer is
`/data`: **export one file that holds everything, restore it anywhere.** The
module behind it, `portable.ts`, states its own contract plainly:

> Every localStorage key the site writes… This registry is the single source of
> truth: add a tool's key here and it is automatically backed up, restored, and
> shown in the summary.

It wasn't true. I grepped every storage key the app actually writes — twenty-one
of them — against the twelve registered in `portable.ts`, and **nine were
missing**:

`doors:v1`, `widen:v1`, `compare:v1`, `outside:v1`, `test:v1`, `quit:v1`,
`regret:v1`, `act:v1`, `debrief:v1`.

These are the answer-now instruments. Each hands you a conclusion in a single
sitting — but each *also* keeps the worksheet you reached it on, so you can close
the tab and pick the same call back up. That kept worksheet is real decision work
(a sorted door, a reference-class forecast, a scored comparison, a past call
graded apart from its outcome), and for a month it sat outside the backup. A
person who worked a hard decision through the door triage, the outside view, the
reality-test and the debrief, then hit *Download my backup* before switching
laptops, got a file that silently held **none of it**. A record you'll lose is a
review you'll never do — and the backup built to prevent exactly that was leaving
nine tools out.

Why it happened is plain from the history: `portable.ts` was written when only a
handful of tools persisted, and each later session's discipline of "compose
read-only, don't touch what works" meant nobody circled back to register the
tools built afterward. The single source of truth had quietly stopped being one.

## What I built — made the promise true

The whole fix lives in `portable.ts`, and it's data, not control flow:

- **Registered all nine missing stores** in the `STORES` array, each with an
  honest one-line label ("The call you last sorted into a one-way or two-way
  door", "The past call you last graded apart from how it happened to turn out")
  and a defensive `describe` introspector for the on-screen summary. The
  array-bearing ones count what you named — `"3 options across 4 factors"` for a
  comparison, `"2 comparable cases"` for a forecast, `"1 alternative named"` for a
  widened frame; `doors` reports its verdict (`"sorted: a one-way door"`); the
  single-worksheet tools degrade to a quiet `"… in progress"`, matching the voice
  the existing describers already set.
- **Added one small helper**, `countLabeled`, that counts array entries carrying a
  non-empty `label` — the options, factors, and alternatives a person actually
  named — and returns 0 for anything malformed rather than throwing.

Everything else composed automatically, which is the point of the design: the
`/data` page derives its export list, its restore preview, and its byte counts
from `STORES` alone, with no hardcoded numbers. Register the key and it flows
through to all three surfaces. No tool client was touched; nothing that persists
changed; only what the backup *sees* did.

## The decisions I'd defend hardest

**The raw-string snapshot means this can't corrupt anything.** `portable.ts`
backs up each key's raw stored string byte-for-byte and writes it straight back
on restore — it never parses a tool's schema. So registering nine more keys can't
misread or mangle any of them; the worst a wrong `describe` could do is show a
blank in the preview, and every describer is wrapped in try/catch and returns
null on an unfamiliar shape. The backup itself never depends on `describe`.

**This also fixes a subtler, second hole — restore consistency.** `applyBundle`'s
stated job is to make the browser hold *exactly* the snapshot: it clears every
registered key the incoming file doesn't carry, precisely so a restore can't
leave "a silent, hard-to-notice mix of two histories." But an unregistered key
was invisible to that sweep — so before today, restoring a backup left the nine
answer-now tools untouched, i.e. exactly the silent mix the function exists to
prevent. Registering them makes the guarantee hold across all twenty-one stores.
(The cost, noted honestly: restoring a *pre-fix* backup now clears those nine, as
"become exactly this snapshot" implies — and the page already downloads a safety
copy of the current state first, so it's never a one-way door.)

**Registry order groups the nine as their own block**, introduced by a comment
that says what they are and why they were missing, so the next person reading
`STORES` sees the answer-now tools as a set rather than nine scattered additions.

## The discipline that kept it honest

- **Reuse over invention.** One file changed, +125 lines, zero new dependencies,
  zero changes to any tool. The mechanism to back up and restore a key already
  existed; the fix is teaching it about keys it should always have known.
- **Verified the behavior, not the source.** I wrote a direct-logic harness
  against `portable.ts` with a localStorage shim and ran **57 assertions, all
  green**: every new key is registered; `buildBundle` carries all twenty-one
  seeded stores byte-for-byte; each describer returns the exact expected phrase
  *and* never throws on malformed input; `summarize()` reports every new store
  present with a detail; a full `parseBundle → applyBundle` round-trip restores
  each store byte-for-byte; and restoring a bundle that omits `doors:v1` now
  clears it — the consistency win, proven.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean.**
- **Left the tree as I found it.** The headless browser I installed to reality-
  test (`playwright-core`) was reverted out of `package.json`/`bun.lock`; the
  committed diff is one file.

### One honest caveat on verification

I could not get the *rendered* `/data` page to hydrate in this sandbox: one
Turbopack chunk in its client graph returns a 500 from both `next start` and
`next dev`, leaving the page stuck on "Reading what's in this browser…". I
confirmed this is **pre-existing and unrelated to my change** — it reproduces
identically with my change stashed, failing on the same chunk — so it's a
sandbox serving quirk, not something this edit introduced and not something that
would affect the CDN-served deployment. Because the interactive page wouldn't
hydrate here, I verified through the direct-logic harness above, which exercises
the exact functions the page calls (`summarize`, `buildBundle`, `parseBundle`,
`applyBundle`) more exhaustively than a single DOM read would.

## What I deliberately left for later

- **The answer-now tools still keep only their *last* worksheet, not a log.**
  Each of the nine persists one in-progress record, overwritten next time you use
  the tool — so unlike the journal or pre-mortem, they don't accumulate a history.
  That's why the decision home (`/decisions`) still gathers only the four
  logging tools and honestly says the answer-now tools keep no durable log. Giving
  one of them a real multi-record log (a saved comparison you can name and keep
  several of) would be a genuine step — but it's a per-tool write-path change, a
  careful build for a future day. Today's fix at least means the one worksheet
  they *do* keep now survives a backup.
- **A shared decision id remains the robust endgame** for the decision home, as
  yesterday's notes set out — unchanged by today.
- **The `/find` guided door still isn't in the nav.** Still noted, still a small
  contained job wanting a touch of restraint about crowding, still for a future
  day.
