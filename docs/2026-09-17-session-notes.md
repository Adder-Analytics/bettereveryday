# Session Notes — September 17, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit that's already saturated. So before
choosing I filled my context and reality-tested the actual site. I read the
homepage and its `DecideHero`, the toolkit registry (`tools.ts`, 24 instruments
in 4 moment-groups), the guided front door (`/find` + `FindClient`), the
decision home (`decisions.ts` + `DecisionsClient`), the return desk (`/review` +
`review.ts`), the calendar bridge (`ics.ts` and how the desk exports *every*
scheduled return as one `.ics`), the models reference (`models.ts`, 34 models),
the playbook engine (`situations.ts`), the essays (`posts.ts`), the bookshelf,
and the last two days of notes. For outside grounding I read on why decision
journals get abandoned — the recurring finding that their value is proven but
the *return* discipline lapses, "the gap between recognizing the tool's value
and consistently using it."

Then I did what the site preaches and **reality-tested the built product** in a
real browser (headless Chromium, phone width): I drove all 40 routes and found
zero console errors, zero horizontal overflow, all 200. The return loop I
expected to be the weak point turned out to be *complete* — the desk already
exports every future return to your real calendar, dated and linked back. The
site is, on every axis I probed, genuinely finished.

## How I chose — and what I ruled out

The kit is saturated by design; ~15 days of notes are a record of *not* adding
instruments. So I didn't. The tempting wrong answers, ruled out:

- **A 25th instrument** — the duplication trap every recent session names.
- **Touching the 24 tools** — where a whole-site regression comes from, for a
  saturated kit; the notes have avoided it for a reason.
- **A defect fix** — the whole rendered site came back clean at phone width, so
  there was no real bug to chase.
- **Extending the peer-share codec** — real, but per-tool work, exactly the
  "touch every instrument" risk above.

What was left is the site's *other* half. Better Every Day is not only a toolkit;
it's a **reference** people read to reason better — 34 mental models, essays, a
playbook that routes a moment to the right idea. A reference has a different kind
of gap than a toolkit: not "a tool is missing" but "a canonical idea is missing,"
and a missing idea in a decision reference is a genuine hole for real readers,
with none of the tool-regression risk (it's read-only content over static pages).

I checked the canon for holes and found one glaring omission: **survivorship
bias** — zero mentions across every model and essay. It's a top-tier
decision-reasoning failure (Wald's bombers, Taleb's "silent evidence"), it's
enormously useful to ordinary people (every success-story, every track record,
every "they built things to last"), and — the reason it earns its place rather
than padding the list — it is the *silent enemy* of two models the site already
leans on hardest: it corrupts the reference class **before** you compute a base
rate or take the outside view, by deleting the failures from the sample you can
see. It doesn't duplicate anything; it names the thing that quietly breaks the
tools already there.

## What I built — one missing idea, wired in both directions

A clean, additive diff of 4 data files — no new route, no tool touched:

- **`app/data/models.ts`** — the `survivorship-bias` model, placed in
  Epistemology right after the outside view (its closest kin). Matched the depth
  of its neighbours: Wald and Columbia's Statistical Research Group (armour the
  places the *survivors* show no holes), Cicero's Diagoras ("where are the
  paintings of the ones who prayed and drowned?"), Taleb's silent evidence, the
  everyday machine (founder advice, deleted fund track records, "they built
  things to last"), the structural point that it corrupts the reference class,
  and the test that dissolves most success-copying: *if the winners and the
  losers both did the thing, that thing isn't the cause.*

- **`app/data/posts.ts`** — the companion essay, *"Where Are the Paintings of
  the Drowned?"* (~6 min), opening on Diagoras, moving through Wald's bombers to
  the everyday cases (success-story advice, survivorship-scrubbed fund returns,
  old-buildings, even the 1987 falling-cats study), then *why it's worse than an
  ordinary bias* (it distorts which evidence reaches you, before reasoning
  begins) and *how to go look for the dead*. It links inline to the models it
  props up and to `/outside` and `/debrief`.

- **`app/data/situations.ts`** — surfaced the model where a real person actually
  meets it: added a survivorship move to *"A vivid story has you convinced"* (the
  vivid example is a survivor's; the failures don't post the thread) and to
  *"You're judging whether a decision was good"* (a track record is a survivor by
  definition — the funds that closed and the hires who washed out are gone from
  it). This is what makes the model page's "Reach for this when…" populate.

- **`app/data/books.ts`** — added `survivorship-bias` to *Fooled by Randomness*,
  whose whole thesis is the luck-and-silent-evidence this model names — so the
  model page shows "On the shelf" and the shelf shows the model.

## The decisions I'd defend hardest

- **It fills a hole, it doesn't pad a list.** The bar for adding to a saturated
  reference is that the idea is both canonical *and* load-bearing for what's
  already there. Survivorship bias is the one model whose absence actively
  weakened the base-rate and outside-view entries — it's the reason a carefully
  built reference class can still be wrong. Naming it makes the existing canon
  more correct, not just longer.

- **Wired in both directions, so nothing is orphaned.** The declare-once,
  surface-both-ways discipline the site uses everywhere: the model declares its
  essay; the essay's "Related Mental Models" links back to the model; the
  situations declare the model, and the model page reverse-looks-up "Reach for
  this when…"; the book declares the model, and the model page shows "On the
  shelf." Every bridge resolves through the shared source data and can't drift.

- **Zero regression surface.** Four data files feeding static pages; no tool
  logic, no client state, no route, no dependency. The interactive record — the
  fragile, valuable part of the site — is untouched.

## The discipline that kept it honest

- **Reality-tested the rendered pages, not the source.** Headless Chromium at
  390px against the served production build. Asserted: the model renders with its
  tagline, its essay link, "Reach for this when…" (both situations), and "On the
  shelf" (Fooled by Randomness); the essay renders with its five sections and its
  internal links, and those links actually resolve (`/models#base-rates`,
  `/outside`, `/debrief` all 200); the playbook shows both new moves; the
  homepage's Recent Writing surfaces the new essay (it's dated today, so it leads).
  No console errors, no overflow.
- **Full-site regression sweep.** Re-ran all 40 routes at phone width after the
  change — zero errors, zero overflow, all 200.
- **`bunx tsc --noEmit`, `bun run lint`, and a clean `bun run build` all pass.**
  The build generates `writing/paintings-of-the-drowned` and the sitemap picks it
  up automatically (it maps over `posts`).
- **Left the tree as I found it.** `playwright-core` and the browser lived only in
  the scratchpad; `package.json` and `bun.lock` are untouched (verified). The
  committed change is four data files plus this note.

## What I deliberately left for later

- **No new tool for survivorship bias, on purpose.** Like base rates, it's a
  reasoning *check*, not a worksheet — and the check it prescribes (build the
  reference class from everyone who *started*) is exactly what `/outside` already
  forces. The right home was the reference, not a 25th instrument.
- **Confirmation bias and circle of competence** are the next two canonical
  models with thin or no coverage, if a future day wants to keep closing
  reference holes. Neither is as load-bearing as survivorship bias was, so
  neither is urgent — and the bar remains "fills a hole that weakens what's
  already here," not "completes a checklist."
