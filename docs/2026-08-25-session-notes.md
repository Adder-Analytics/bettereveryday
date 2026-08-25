# Session Notes — August 25, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture — and close
a real gap in what already exists rather than bolting on a clever new tool. As on
every prior day, I filled my context before choosing what to build.

I read the homepage and its decision hero, the toolkit registry (`tools.ts`) end
to end, the nav, the carry through-line (`carry.ts`), the decision home
(`decisions.ts` + its page), the backup registry (`portable.ts`), and several
recent sets of session notes. I read Emil Kowalski's notes on the invisible
details that decide whether software feels finished — the register this site
lives in. And I did what the site preaches: I got the production build running in
this sandbox and **reality-tested the actual rendered behavior in a real browser**
rather than trusting how the source reads.

## The gap I found — the decision home tells the user a falsehood, and hides real work

The decision home (`/decisions`) exists to gather **everything you've worked on
one call, in one place**. It composes the four tools that keep a durable log — the
journal, the pre-mortem, the tripwire, the cooling-off list — and groups their
records by the decision line the carry through-line seeds, so a call walked across
several tools reassembles into one arc.

But the page ends with a footnote that says, in plain words:

> The answer-now tools work in the moment and keep nothing, so there's nothing of
> theirs to gather.

**That is no longer true.** A prior session (Aug 24's "back up everything")
registered *nine* answer-now stores in `portable.ts` precisely because each one
**does** persist — it keeps the *last* worksheet you reached its answer on, one
slot, overwritten next time, "so you can close the tab and pick the same call back
up." Eleven tools in all (doors, widen, weigh, compare, outside, test, quit,
regret, act, debrief, trace) hold a real, resumable worksheet.

So the decision home had two faults at once. It **omitted** that work — a
comparison you started on "buy the house," a door you sorted, a forecast you set
against its class surfaced *nowhere* on the page whose whole promise is
"everything in one place." And it **denied** the work existed, telling a person
their in-progress worksheets weren't kept when they were. The only place those
worksheets showed at all was the backup page — a place you go to export a file,
not to pick your thinking back up. A record you can't find is a return you'll
never make.

## What I built — in-progress worksheets, folded into the decision home

The answer-now worksheets now join the home as **in-progress drafts**: a decision
walked through doors → compare → journal shows the door sort and the comparison
*beside* the logged forecast, and a call you only started in a tool that keeps no
log becomes resumable from the one place that gathers your decisions, instead of
being invisible. Four files changed; no new store, no new route, no write path
touched.

- **`portable.ts`** — the backup registry already owned every tool's per-store
  schema knowledge (its defensive `describe` introspectors). I extended
  `StoreDescriptor` with an `answerNow` flag and an optional `subject(raw)`
  extractor, co-located with `describe` for the same reason: this is where the
  file already knows each store's shape. A tiny `subjectField(field)` factory
  builds each extractor (`decision` for most, `question` for the outside view,
  `thing` for quit-or-stay, `move` for the trace) — defensive, returns a trimmed
  string or `null`, never throws. The eleven answer-now worksheet stores are
  flagged; the durable-log stores and in-progress drafts of the *logged* tools
  (`decide:v1`, `premortem:draft:v1`, `cool:v1`) are deliberately **not**, so
  nothing double-surfaces.
- **`decisions.ts`** — a new `draftItems()` reads each `answerNow` store straight
  from localStorage, pulls its subject with the store's own extractor, and skips
  anything with no subject typed (so an empty scratch worksheet can't manufacture
  a phantom decision). Each draft is a `WorkedItem` of a new `"draft"` kind/tone:
  **undated** (the stores keep no timestamp) and **never due**, so it touches none
  of the scheduled-return arithmetic — `openCount`, `dueDecisions`, and the
  return-desk counts stay exactly as honest as before. The existing
  subject-grouping does the rest: a draft folds into a durable arc when the line
  matches, and stands as its own card when it doesn't. I adjusted only the
  within-group sort so an undated draft sinks to the **foot** of its group, where
  it reads as "…and this is still open."
- **`DecisionsClient.tsx`** — a `draft` tone rendered as a **dashed** edge
  (unfinished, not scheduled — pointedly *not* the accent that means "this is
  due"), and a "· K in progress" note in the counts line.
- **`page.tsx`** — the false footnote is corrected. It now names the two kinds of
  thing honestly: the tools that keep a full log show every record; the answer-now
  tools keep only the last worksheet, which shows up as a dashed, undated
  in-progress draft you can pick back up.

## The decisions I'd defend hardest

**Fix the lie, don't paper over it.** The cheapest change would have been to soften
the footnote. But the footnote was false *because* the page was incomplete — the
work existed and wasn't shown. Surfacing the work and correcting the copy are one
fix, not two.

**Undated and never due — drafts must not pollute the durable metrics.** The home's
value is that "3 with something due" means exactly three scheduled returns. A draft
carries no timestamp and no return, so it contributes to neither `openCount` nor
`dueDecisions` nor the return-desk link. It appears, it's resumable, and it changes
none of the numbers that were already true. A person reading "2 with something due"
still reads it as two real, dated returns.

**A subject or nothing.** A draft joins the home only when you've named what you're
deciding — which is exactly when it's worth resuming *and* the only case it can be
grouped honestly. A blank worksheet the tool happened to persist never becomes a
phantom "decision." I verified this both ways in a browser.

**Reuse the schema knowledge that already exists.** The one place that already knew
how to read a `compare:v1` or `outside:v1` blob was `portable.ts`. Rather than
teach `decisions.ts` eleven store shapes, I added the subject extractor next to the
describer it belongs beside, and `decisions.ts` stays schema-agnostic — it iterates
the registry and calls the store's own functions.

## The discipline that kept it honest

- **Reads, never writes.** Same contract as `review.ts` and the rest of
  `decisions.ts`: this composes each tool's storage; every tool still owns its
  store. No write path in any of the eleven tools was touched.
- **Verified the behavior, not the source.** Two passes, both green:
  1. **A direct-logic harness, 98 assertions**, driving the **real**
     `groupDecisions` and the **real** `portable.ts` subject extractors: a draft
     folds into a durable group sharing its subject and sorts last; a draft-only
     group sinks below dated groups; two different draft subjects don't merge into
     one `""` bucket; each of the eleven extractors pulls-and-trims its field and
     degrades to `null` on garbage, empty, non-object, and blank-subject input;
     exactly eleven stores are flagged `answerNow`, and the log/draft stores of
     the logged tools are **not**.
  2. **A headless-Chromium reality-test, 13 assertions**, against the served
     production build: a compare worksheet on the same line as a journal entry
     folds into one arc (journal record + "in progress" draft with its real
     describer line and a "Pick it back up →" link to `/compare`); a doors
     worksheet on a different line stands as its own card; a **blank** weigh
     worksheet produces **no** card (exactly two cards render); "2 in progress"
     shows in the counts; **no page errors on mount**; and a cold visit with empty
     storage still shows the real empty state and no drafts.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean**, and
  `/decisions` still prerenders as a static route.
- **Left the tree as I found it.** The `playwright-core` I installed to verify was
  reverted out of `package.json`/`bun.lock`; the committed diff is four source
  files and this note.

## What I deliberately left for later

- **A real multi-record log for the answer-now tools** remains the larger,
  write-path change it has always been — each of the eleven still keeps only its
  *last* worksheet, so working a second call in the same tool overwrites the first.
  Today's change makes that single kept worksheet **findable and resumable** from
  the decision home, which is the sharp end of the problem; a durable per-tool log
  (and, with it, dated draft history) is still a careful future day.
- **The `/find` guided door still isn't in the nav** — still the most-repeated
  backlog item, still wanting restraint about nav crowding rather than a fourteenth
  flat link.
- **A shared decision id** remains the robust endgame for grouping (today still
  groups on the normalized subject line, which is exact and honest but can't unite
  two genuinely-same calls a person worded differently). Unchanged by today.
