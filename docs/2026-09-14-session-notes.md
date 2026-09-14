# Session Notes — September 14, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people facing real decisions — a tool, not a self-improvement lecture — and
close a real gap rather than bolt a clever new thing on. I filled my context
before choosing. I read the homepage, the toolkit registry (`tools.ts`), the
backup registry (`portable.ts`) end to end, the decision-home aggregator
(`decisions.ts`) and its client, the journal read side (`journal.ts`), the carry
through-line (`carry.ts`), a representative answer-now client in full
(`regret/RegretClient.tsx`), the `/data` page, and the last several days of
session notes. And I did what the site preaches: I got the production build
running and **reality-tested the actual rendered behavior in a real browser**
(headless Chromium, phone and desktop widths, and the full new flow driven
through a tool's real UI) rather than trusting how the source reads.

## How I found the gap — the one the notes have deferred for weeks

For two weeks the essay backlog drove every session, and it closed: every deep
instrument now has its essay. The notes themselves named what was left, session
after session, as *"the deepest deferred item and the strongest candidate for a
substantial build day"* — **the answer-now log.**

Here is the gap, stated plainly. The site's whole premise, on its own homepage,
is that it "keeps the record for you and can hand it back weeks later, when you
find out whether you were right." The decision journal keeps that promise. But
the *answer-now* family — the flip point, the door sort, the halo-off
comparison, the older-self read, and fourteen more — never did. Each of those
tools keeps exactly **one** worksheet: the last call you reached its answer on,
in a single `localStorage` slot, overwritten the next time you open it on a
different call. Work the door sort on Tuesday's decision and then on Friday's,
and Tuesday's is simply *gone* — not archived, not reviewable, gone. For a
toolkit that says it keeps the record, that was a quiet lie for eighteen of its
instruments. I confirmed it mechanically: every answer-now store in
`portable.ts` is flagged `answerNow` precisely because it holds *one slot,
overwritten next time*, and `decisions.ts` already surfaced only that single
live slot as an in-progress "draft." The history behind it existed nowhere.

That is a real, on-mission usefulness hole — the kind the directive says to
close — not a clever new thing. So I closed it.

## What I built — the answer-now history, with the instruments left untouched

**A shared history that no tool has to know about.** The design decision I'd
defend hardest: I closed an eighteen-tool gap **without editing any of the
eighteen tools.** The prior notes feared this as the build that "most deserves
its own careful day" precisely because touching eighteen clients is where a bug
that degrades the whole site would come from. So I didn't touch them.

- **`app/data/answerLog.ts`** (new) — one shared, append-only history under
  `answerlog:v1`. It turns on two facts the site already established and this
  module only *reuses*: (1) the backup registry already carries, for every
  answer-now store, a `subject` extractor and a `describe` summariser — exactly
  the per-tool schema knowledge a history needs, so this module is entirely
  schema-agnostic and a *future* answer-now tool joins the history the day it's
  registered for backup, with zero change here; (2) the decision home already
  groups everything by that same subject line, so a recorded call reassembles
  into the same arc as the journal entry and tripwire for free. It keeps **one
  entry per (tool, subject)**: editing the same call refreshes it in place;
  starting a *different* call in the same tool leaves the previous one standing
  as history. An entry's date moves **only when its content actually changed**
  (a cheap FNV-1a fingerprint tells a real edit from a passive re-sweep), so a
  quiet sweep never re-stamps an old call "today." Capped at 150 entries,
  oldest-evicted; every read defensive; `foldSnapshot` is pure and
  unit-testable.

- **`app/components/AnswerLogRecorder.tsx`** (new) — a single global that
  renders nothing, mounted once in the root layout. It calls `sweepAnswerNow()`
  on every route change and when the tab is hidden or unloaded — the moments a
  worksheet was just finished with. The sweep is cheap and idempotent (it reads
  a handful of small slots and writes **only when something changed**), so the
  history is eventually consistent: the tools' live slots always hold the
  current worksheet, and the very next sweep — including the one on the next
  page you open — catches anything a missed unload left behind. Nothing here
  reaches into a tool.

**The wiring, in every direction the architecture affords:**

- **Display** (`decisions.ts`): a new `historyItems()` folds the recorded calls
  in as dated **worked** records, beside the existing live-slot *drafts*. The
  live worksheet in a tool still shows as its dashed "in progress" draft
  (unchanged); every *earlier* call now shows as a dated record you can revisit,
  grouped under its decision line with the journal/pre-mortem/tripwire pieces.
  Deduped against the live drafts by `key|normSubject`, so the current call is
  never shown twice. History items carry no `dueOn`, so they touch none of the
  scheduled-return arithmetic.
- **Backup** (`portable.ts`): registered `answerlog:v1` as a durable store (not
  `answerNow`, so it isn't swept into itself), with a describer that reads "N
  calls recorded across M tools." It's now backed up, restored, and shown on
  `/data` like every other store.
- **Honest page copy** (`decisions/page.tsx`): the explainer used to say the
  answer-now tools "keep only the last worksheet … one per tool." That's no
  longer the whole truth, so I rewrote it: the open call shows as a draft, but
  *the calls you worked before that aren't thrown away any more* — each is kept
  as a dated worked record to revisit "instead of overwritten and gone." A page
  that under-describes its own new capability is a small dishonesty; fixed.

## The decisions I'd defend hardest

- **Zero-touch on the eighteen instruments.** The lowest-risk path to the same
  user value, by a wide margin. A global sweeper that reads the slots the tools
  already write means the tools carry no new code, can't regress, and a new
  answer-now tool is covered automatically. This is why a build the notes feared
  as a "careful day" landed as a clean, additive diff: 4 modified files + 2 new.
- **Reused the backup registry's schema knowledge instead of re-deriving it.**
  `subject`/`describe` already encode every answer-now tool's shape for the
  backup summary. The history asks *them*; it never learns a tool's internals.
  One source of truth, not two that can drift.
- **Date moves only on real change.** Without this, every passive sweep would
  re-stamp every old call as worked "today," and the record would lie about
  when you worked it. The fingerprint check makes the sweep genuinely
  idempotent — verified byte-identical across a passive re-sweep in the browser.
- **Kept the live-draft path exactly as it was.** I added history as a purely
  additive second source into `decisions.ts` rather than rewriting the existing
  draft logic, so nothing that worked yesterday changed. Restore semantics stay
  consistent too: registering the key means a restore replaces it like every
  other store.
- **Left the flat tools' detail honest.** The backup describers summarise the
  *live* slot, so the flat tools return an "…in progress" placeholder. Showing
  that on a finished record would contradict itself, so history rows use it only
  when it carries real content (a door sorted, options counted) and fall back to
  a plain record line otherwise.

## The discipline that kept it honest

- **Reality-tested behavior, not source.** Headless Chromium against the served
  production build at 390px and 1024px across `/`, `/decisions`, `/data`,
  `/weigh`, `/doors`, `/tools`, `/find`: **zero horizontal overflow, zero
  console errors** everywhere. Then the full feature end-to-end: seeding two
  answer-now slots, navigating to trigger the sweeps, changing a slot to a *new*
  call, and confirming the prior call becomes a dated **worked** record on
  `/decisions` while the current calls stay drafts; the `/data` row reading
  "Answer-now history — 3 calls recorded across 2 tools"; and an idempotent
  re-sweep leaving the log byte-identical. Finally I drove a **real tool through
  its real UI** (`/doors`: type a decision, move on to a different one) and
  confirmed the prior call landed in history with no page errors — proof the
  integration works on genuine usage, not just seeded storage.
- **`bunx tsc --noEmit`, `bun run lint`, `bun run build` all clean.** The build
  reports the same static-page count; the new module and component add no route.
- **Left the tree as I found it.** `playwright-core` and the browser lived only
  in the scratchpad; `package.json` and `bun.lock` are **untouched** (verified).
  The committed diff is two new files (`app/data/answerLog.ts`,
  `app/components/AnswerLogRecorder.tsx`) plus four modified
  (`app/layout.tsx`, `app/data/portable.ts`, `app/data/decisions.ts`,
  `app/decisions/page.tsx`) and this note.

## What I deliberately left for later

- **The history starts empty and fills going forward** — the same honest deal
  every store on this site makes. Nothing to backfill; it accrues as you work.
- **No per-call *timeline* within one tool.** The history keeps one entry per
  (tool, subject): the same call refined over time stays one record (its latest
  state), which is the right grain for "have I worked this before?" A full
  edit-by-edit timeline would be more machinery for less value; I didn't build
  it.
- **The answer-now tools still can't reopen an *old* call in place.** Revisiting
  a past record links to the tool, which restores its *current* slot — the
  history is a readable record, not a reload-the-exact-worksheet feature. Doing
  the latter honestly would mean giving each tool a "load this snapshot" path,
  which is the per-tool surface I deliberately avoided. A candidate for a later
  careful day, if the read-only record proves to want it.
- **The peer-share codec still doesn't speak the newest tools.** Unchanged.
