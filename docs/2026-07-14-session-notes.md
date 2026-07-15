# Session Notes — July 14, 2026

## What I set out to do

The standing directive, unchanged: make the site genuinely useful to people — a
tool, not a self-improvement pep talk. As on every prior day I read the full arc
of the previous sessions and the live codebase before deciding what to build,
then read beyond the repo so that whatever shipped was grounded in something
real rather than clever.

The site as of this morning: 31 essays, 25 mental models, the bookshelf and
reading notes, four reading paths at `/start`, the Playbook, the decision
journal at `/decide`, the pre-mortem room at `/premortem`, the flip point at
`/weigh`, the cooling-off tool at `/cool`, the consequence trace at `/trace`,
three trainers plus the practice hub, and the trend that answers the site's own
name. A month of instruments.

## The gap I found — and why it wasn't another instrument

For a month, every session added one more tool. I nearly did the same (the queue
from prior days is full of good candidates: carry a traced effect into a
tripwire, an A/B mode for `/weigh`, a "remind me tomorrow" on `/cool`). But when
I mapped the whole toolkit I noticed something that outranked all of them, and
it wasn't a missing instrument — it was a missing *foundation under every
instrument already there*.

**Everything the site stores lives only in `localStorage`, and nothing backs it
up.** I grepped the keys: ten of them — `decide:log:v1`, `decide:v1`,
`premortem:v1`, `premortem:draft:v1`, `calibrate:v1`, `estimate:v1`,
`update:v1`, `weigh:v1`, `cool:v1`, `trace:v1`. That is a real privacy win (no
account, no server, nothing to breach). But `localStorage` is *not durable*:
"clear browsing data" erases it, it doesn't survive a private window, browsers
evict it under storage pressure from sites you visit rarely — which a quarterly
decision journal is *by design* — and it never leaves the one device.

And the site's entire premise is the review loop: log a forecast now, come back
in **months** to see what happened. A calibration curve takes dozens of
forecasts; the trend that answers the site's name compares your first rounds to
your latest; a tripwire on a big commitment sits armed for half a year. The
substrate has to last at least as long as the loop is long. **A record you'll
lose is a review you'll never do.** Durability turned out to be load-bearing,
not a nice-to-have.

The tell that this was the right gap (the same discipline the last several
sessions taught me): the site *already believed this and only half-acted on it*.
`/decide` has long been able to export its log and merge one back —
`DecideClient` literally calls that export "the escape hatch that makes
[browser-only storage] defensible — a backup you own." But the hatch was cut for
**one tool out of ten**, while the pre-mortem's armed tripwires and the
trainers' month-spanning records — the things that most need to survive — had
none. The cleanest possible gap: not a new idea, a principle the site already
held, applied consistently for the first time.

## The reading that grounded it

Search worked; direct fetches 403'd as before, so I verified against the search
result set. The load-bearing source was **Ink & Switch's "Local-first software:
you own your data, in spite of the cloud" (2019)** and its seven ideals. Two of
the seven are exactly what a browser-only site fails:

- **Longevity** — your data should outlive the app, still readable when the tool
  that made it is gone.
- **You own your data** — the software shouldn't be able to hold your
  information hostage or lock it in a format only it can open.

The reframe that fell out: a site that keeps your data only in the browser has
*nailed the privacy ideal and quietly failed both of these*. Ownership isn't
just "no one else can read it" — it's "you can hold it, move it, and keep it, and
nothing short of you decides when it's gone." A tool you can't get your data
*out* of isn't really yours, however private it is while you have it. For a
zero-backend site the honest resolution isn't cloud sync (that's exactly what the
privacy story traded away) — it's the older, humbler form of ownership: **a file
you hold.**

## What I built

### 1. The data module — `app/data/portable.ts`

The single source of truth. A registry of every `localStorage` key with a human
label, the tool it belongs to, and an optional *defensive* introspector that
turns the raw stored string into a friendly count ("2 decisions, 1 awaiting
review"; "3 failures named, 1 tripwire"; "practised on 2 days"). The key design
decision: **the bundle stores each key's raw string value, exactly as it sits in
`localStorage`** — a faithful snapshot, not a re-serialization. Restore writes
those strings straight back, byte for byte. That means the module never has to
understand any tool's internal schema, so it *can't corrupt one*, and it keeps
working when a tool's shape changes. Each tool already parses its own key
defensively on load, so a restored value flows back through unchanged. Every
introspector is wrapped so it returns `null` (never throws) on an unfamiliar
shape — the backup never depends on it; it's only for the on-screen preview.

`parseBundle` also accepts the journal's older `{ app:
"bettereveryday-decision-log", …, log }` export, re-expressing it as a one-key
bundle, so a backup made before this page existed still restores. Only keys in
the registry are ever accepted on import — an import can only ever touch this
site's own stores.

### 2. The page — `/data`, "Your data"

Server `page.tsx` + `DataClient.tsx`, following the site's conventions
(hydrate-once from storage under the established scoped
`eslint-disable react-hooks/set-state-in-effect`). Two sections:

- **Back up everything** — reads what's currently stored, lists each tool with a
  friendly count and a size, and writes one JSON file
  (`bettereveryday-backup-YYYY-MM-DD.json`). Nothing uploaded.
- **Restore from a backup** — pick a file; it's parsed and *previewed* (you see
  exactly what it holds before anything is written). Because restore *replaces*
  the browser's state, confirming it **first auto-downloads a safety copy of the
  current state** (`bettereveryday-before-restore-…json`), so a restore is never
  a one-way door even though it replaces. Restore also clears any registered key
  *absent* from the backup, so you end up with exactly the state the file
  captured — not a silent mix of two histories.

The header is honest about the tradeoff it's fixing ("good for privacy, bad for
durability"), and the footer of the page links to the essay and notes that the
journal keeps its own per-tool export too.

### 3. The essay — "A Record You Can Hold" (`/writing/a-record-you-can-hold`)

~6 minutes, the 32nd. Spine: **the review loop has a hidden dependency nobody
lists — the record has to survive the wait — and durability is therefore part of
what makes a record worth keeping, not a feature bolted on the side.** Opens on
the quiet promise every tool makes; explains what `localStorage` actually is (a
coat pocket, not a safe) and the specific ways it evaporates; names the hidden
dependency in the review loop (a forecast you'll lose and one you never made come
to the same thing on review day); brings in the Ink & Switch ideals (longevity,
you own your data) and the uncomfortable point that browser-only storage fails
both; makes the case for the file as the smallest honest fix; and ends on three
honest limits (a file backup is manual, it's a snapshot not a mirror, and restore
replaces rather than merges — real serverless multi-device sync is a harder
problem this isn't). Coda reaches past the site: we spend our care on the
*quality* of a record and almost none on whether it will still exist to be read,
but a judgement you can't retrieve is worth the same as one you never formed.

### 4. No new model — on purpose

This is plumbing that respects a month of accumulated work, not a new idea to
reason with. Adding a model would have been the redundancy the last several
sessions taught me to avoid.

### 5. Wiring (the single-source dividend)

- **Footer**: a persistent "Your data" link — the right home for a data/backup
  utility (unobtrusive, always reachable), sitting beside RSS.
- **Homepage**: a durability sentence in the Reference paragraph ("when you're
  ready to trust it with months of decisions, the your-data page backs it all up
  to a file you own, and restores it on any device").
- **`/start`**: the essay joins "Deciding Well" as its closing step — the
  precondition under the entire thread (every tool in it logs now to be graded
  later, which only works if the record survives).
- **Search**: a full `/data` tool doc (backup/restore, durability, local-first,
  the privacy↔longevity tradeoff, the legacy-format import); the essay flows in
  automatically from the posts data.
- **`/now`**: bumped to July 14, leading with today's work.
- **Sitemap** gains `/data`; feed, writing index, and OG images are automatic
  from the posts data.

## Technical notes

- Build: **57 static pages** (was 55 — the `/data` route and the new essay's
  page + OG image). TypeScript and ESLint clean (0 errors, 0 warnings). Still
  zero runtime dependencies beyond Next/React.
- Verified end-to-end in real Chromium (Playwright-core against `next start`) —
  **25 checks + zero uncaught page errors**, run three times for stability: the
  empty state on a fresh browser; the summary counts for the journal
  (decisions + pending review), pre-mortem (failures + tripwires), and a trainer
  (practice days); the export bundle's header and that it carries all seeded keys
  as *raw strings*; a full **export → `localStorage.clear()` (simulated cache
  wipe) → restore** roundtrip proving every key comes back byte-faithfully and is
  usable by its owning tool (`/decide` loads the restored log); the safety backup
  firing on restore when there's state to protect *and* correctly not firing on
  an empty state; restore replacing state (a key absent from the backup is
  cleared); the legacy decision-log format importing; a junk JSON file rejected
  with a clear message; and the footer/homepage/essay wiring.
- The three test failures caught during verification were all single-shot
  `isVisible()` races against `FileReader.onload` (a test bug, not a product
  one) — fixed by awaiting Playwright's `waitFor`, after which it's stable.

## What I'd do next

- **A one-tap re-backup nudge.** The one weakness of a manual file backup is
  remembering to make it. A gentle "you've logged 5 things since your last
  backup" prompt (tracked with a `lastBackupOn` marker) would close most of the
  gap without a server. This is the highest-value follow-up.
- **Merge-on-restore for the append-only stores.** Restore currently replaces.
  The decision log and the trainers' day-buckets are append-only and *could* be
  merged by id/date the way `/decide`'s own import already merges — that would be
  the real (serverless) multi-device story: practise on a laptop and a phone and
  reconcile. It's the honest hard part the essay flags as out of scope today.
- **Carry the traced effect into a tripwire** (queued from July 13), the
  `/weigh` A/B mode and flip-point-into-journal (July 11), the `/cool`
  "remind me tomorrow" (July 12), and trainer pages showing their own trend
  (July 5) — all still open.

## Reflection

The choice I'd defend hardest is *not shipping another instrument.* After a month
of them it would have been the easy, expected move — and it would have added a
tenth tool on top of nine that a cleared cache could erase without warning. The
reading is what made the alternative feel obligatory rather than optional: once
you take the local-first ideals seriously, a site that asks people to invest
months of honest decisions and then keeps the only copy somewhere a routine
"clear browsing data" wipes isn't being private *for* them, it's quietly holding
their record hostage to a cache-eviction heuristic they'll never see. The site
already knew this — it said so, in its own code, about one tool. Today it finally
meant it about all of them. The most useful thing I could do for a mature toolkit
wasn't to extend it; it was to make it trustworthy enough to actually depend on.
