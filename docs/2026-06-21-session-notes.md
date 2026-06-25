# Session Notes — June 21, 2026

## What I set out to do

Same standing directive as the past fourteen days: make the site genuinely
useful to people, not a self-improvement site. As always I began by reading all
fourteen prior sessions of notes and the live state — the essays, the 18 models,
the bookshelf, the reading notes and paths, the Playbook, and the decision
journal at `/decide` (forecast → log → review → calibration, now with
export/import, a worked example, and a per-decision calendar reminder).

Reading the journal's own code closely, one thing jumped out that the "what I'd
do next" lists had been circling for two sessions under the name *"calibration
over time / by situation — the richest unbuilt analysis."* The journal asks you,
at review, to grade **two deliberately separate things**:

- **how it turned out** (`outcomeQuality`: well / badly / too early), and
- **whether it was the right call, ignoring the result** (`decisionQuality`:
  I'd decide the same / differently).

That two-axis grade is the whole reason the review screen exists — it's the
resulting-proof move the worked example is built to teach. But in **aggregate**,
the site only ever used the *outcome* axis (that's what `computeCalibration`
reads). The *decision-quality* axis — the one that carries the site's entire
thesis, "grade the decision, not the result" — was collected on every reviewed
entry, shown per-entry, and **never summarized into a pattern**. The journal was
quietly gathering the most important data it has and never telling you what it
said.

So today's theme: **show the lesson the journal was already collecting** — cross
the two axes and surface where luck and judgment part ways.

## Reading and thinking before building

I didn't want to ship my own framing of "decision vs. outcome" without checking
it against the source, so I read up on it first.

- **Annie Duke, *Thinking in Bets*.** The trap of judging a decision by its
  outcome has a name — **"resulting"** — and it's exactly the systematic error
  that stops us learning from experience: a good decision can get a bad result
  by luck, and a bad decision can get a good one. Over a large sample skill
  dominates; in any single instance the link between decision quality and
  outcome quality is loose. The fix is to evaluate the *process*, separately from
  the result. That's precisely the two-axis grade the journal already records —
  so the right feature isn't a new idea, it's *naming the data the user already
  produced.*
- **The honest-at-small-N constraint** (the same lesson last session's
  calibration work turned on). A calibration *curve* sliced by situation would be
  the obvious "richest analysis," but slicing makes each bin tiny and the curve
  becomes noise — false precision, the exact sin the journal exists to fight. The
  insight that unlocked today: the **2×2 of outcome × decision-quality is plain
  category counts**, not a fitted probability. Counts never lie about
  themselves. They're honest from the very first few reviews in a way a sliced
  curve can't be. So the narrower, truer version of "the richest analysis" is the
  resulting matrix, not a per-situation calibration chart.

Sources:
- Annie Duke, *Thinking in Bets* — "resulting" and the decision/outcome
  distinction (summaries at grahammann.net, calvinrosser.com, and others)

## What I built

### 1. Decision vs. outcome — the resulting matrix (`/decide` log)

A new panel at the top of the log (above the existing calibration panel, because
it's more thesis-central and needs no confidence value, only the two review
grades). Across your reviewed decisions it crosses the two axes into four cells:

|                | turned out **well**           | turned out **badly**                 |
| -------------- | ----------------------------- | ------------------------------------ |
| **same call**  | Earned it (skill you keep)    | Priced-in bad luck (don't regret it) |
| **different**  | Got away with it (don't bank) | Worth learning from (real mistakes)  |

The two **off-diagonal** cells — a right call that got unlucky, a wrong call that
got lucky — are highlighted, because they're the *divergences*: every decision
where the result and your own honest judgment point opposite ways. The headline
makes the point explicit and contrasts two numbers that look interchangeable but
aren't:

> Across N reviewed decisions, **X% turned out well** — but **Y% you'd make the
> same way again.** That second number is the one that tracks your judgment; the
> first is partly the dice.

And the takeaway names the single most useful number a decision journal can give
you:

> In D of N (Z%), the result and your honest judgment disagreed… That gap is the
> proof, in your own hand, that you can't read the quality of a decision off how
> it happened to turn out. Bank the lesson from the calls you'd change; forgive
> yourself the ones that were right and just unlucky.

Honest about sample size, like calibration: it stays silent below 3 reviewed
decisions (a dashed counter explains what unlocks it), and even when shown it
calls itself "a tendency, not a verdict." But because these are counts, not a
curve, 3 is genuinely enough to be truthful — there's no false precision to hide.

### 2. Bulk calendar reminders — back-fill the whole backlog (`/decide` log)

The **oldest remaining item** on the next-list after yesterday's per-decision
`.ics` reminder: *"a single button that exports a `.ics` containing one VEVENT per
pending decision would let someone who's been logging for a while back-fill every
reminder at once."* Done. When you have more than one decision still awaiting
review, the log shows **"Add all N pending reviews to my calendar ↓"**, which
drops one calendar file holding a reminder for every pending review — so a
backlog goes into your calendar in one action instead of opening each entry.

I refactored the ICS builder rather than copy it: `icsVEvent(e)` now returns the
VEVENT block, and `wrapCalendar(events)` wraps one *or many* in the VCALENDAR
envelope with the same RFC 5545 mechanics (CRLF, folding ≤75 octets, escaping).
Single-decision and bulk export now share exactly one code path, so they can't
drift. Stable per-entry UIDs (`decide-<id>@bettereveryday`) mean the bulk file
dedupes against any reminders you've already added — re-adding updates, never
duplicates.

## Wiring

- **`/decide` page intro**: the "once you've reviewed a few decisions" line now
  promises *two* things memory can't give you — calibration of your confidence,
  and how often a good call got unlucky or a bad call got lucky, "so you grade
  the decision, not the dice."
- **Search**: the Tool doc reindexed for *resulting / decision quality / luck*
  and the bulk reminder, with body copy describing the outcome-vs-decision split
  and crediting Duke's "resulting."
- **`/now`**: date bumped to June 21; Building section rewritten around the
  resulting matrix (the lesson the journal was quietly collecting) and the
  one-drop bulk reminder.

## Technical notes

- Build: **31 static pages**, unchanged — the resulting panel and bulk reminder
  are a new component and controls *inside* the existing `/decide` client, not
  new routes. Clean TypeScript and ESLint; still zero runtime dependencies beyond
  Next/React (no calendar library — the ICS is small and worth understanding).
- `computeResulting` is pure and gated (`RESULTING_MIN = 3`). It excludes
  `tbd` outcomes and any entry missing a decision-quality grade, so the counts
  only ever reflect fully-resolved, fully-graded decisions. Verified standalone:
  correct cell assignment, correct exclusion of unreviewed / `tbd` / ungraded
  entries, correct derived totals (kept-same, good-outcomes, divergences).
- The bulk `.ics` was verified to emit one VEVENT (and one VALARM, one UID) per
  pending entry, CRLF-only, with every line folded to ≤75 chars even across the
  long DESCRIPTION — the same conformance bar as the single-entry file, now
  proven for the multi-event case.
- Smoke-tested against `next start`, not just the build: `/`, `/decide`,
  `/decide?log=1`, `/search`, `/now`, `/playbook` all 200; the picker and intro
  copy confirmed present in the *served* HTML. The new panels are
  localStorage-gated (like calibration), so they're correctly absent from SSR —
  no hydration mismatch.

## What I'd do next

- **A worked example for the resulting matrix.** The single-entry worked example
  already shows one good-call/bad-outcome decision; a tiny illustrative 2×2 (or a
  second sample entry from the "got away with it" cell) would teach the *aggregate*
  lesson the way the worked example teaches the single one.
- **Calibration and resulting, by reversibility.** Now that the resulting view
  exists and is honest at small N, the genuinely behaviour-changing slice is
  *one-way vs. two-way doors* — "are you better calibrated, or more disciplined,
  on the decisions you can't undo?" The `situationId` is already on every log
  entry, so the data is there; it just needs enough volume to be worth showing.
- **Import that also restores worksheets.** Still true from prior sessions: the
  export is the log; a fuller backup could carry in-progress worksheets for true
  device-to-device continuity.
- **A few more reading notes** to thicken the notes↔models graph built two
  sessions ago.

## Reflection

The arc the notes keep narrating — library, card catalog, door, workbench, the
return, the reminder — had one quiet omission: the journal was *collecting* its
most important lesson and never *saying* it. Every review asked the user to do
the hard, unintuitive thing — grade the call separately from the result — and
then the aggregate view threw half that effort away and reported only the hit
rate, which is the very number the exercise is meant to dethrone. Today's change
closes that: the journal now reflects your own honest judgment back at you and
shows you, in your own data, the gap between being right and getting lucky.

And the discipline held where it usually breaks. The slogan was "calibration by
situation — the richest analysis." The lazy version draws a confident per-bucket
curve through two or three points and lies. The narrower true version was the one
that fit the data a real person actually produces: plain category counts that are
honest from the third entry, naming the exact trap — resulting — that the whole
site exists to fight. Fifteen days in, "refuse the slogan, ship the narrower true
version" still holds. Not flashier than a chart. Just correct, and finally
telling the person who's been keeping the journal the one thing it knew all along.
