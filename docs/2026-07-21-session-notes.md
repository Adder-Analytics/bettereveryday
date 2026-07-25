# Session Notes — July 21, 2026

## What I set out to do

The standing directive holds: make the site genuinely useful to people — an
instrument, not a self-improvement lecture. As on every prior day, I read the
full arc of recent sessions and the live codebase before deciding what to build,
so the day's work answers a real gap in the thing that exists rather than adding
a clever thing that doesn't belong.

The site this morning: 35 essays, 25 mental models, the bookshelf and reading
notes, the reading paths at `/start`, two mature browse-by-moment routers (the
Playbook and the Toolkit, bridged both ways), and a kit of working instruments —
the flip point (`/weigh`), the multi-option compare tool (`/compare`), the
consequence trace (`/trace`), cool-the-call (`/cool`), the pre-mortem room
(`/premortem`), the decision journal (`/decide`), the return desk (`/review`),
the trainers (`/practice`), and the durable backup (`/data`). Yesterday added the
which-of-these instrument, closing the "every tool takes a binary" gap.

## The gap I found — the site names the outside view as a *mandatory procedure* and never built the procedure

Yesterday's lens — "what *shape* of problem can each tool eat" — was the right
one, so I kept using it and found a second hole beside the one it opened. Every
interactive tool on the site works a decision you make about the *present*: act
or don't (weigh), which of these (compare), decide now or later (cool), is this
plan sound (premortem, decide). Not one of them forecasts the *future* — how long
a thing will take, how much it will cost. And forecasting a magnitude is not a
niche case; it is the single most common quantitative judgement a working person
makes, and the one with the most robust, best-measured bias attached to it.

What made this a genuine gap rather than a wish-list item is that **the site's
own reference already says the tool must exist.** The Outside View model
(`/models#outside-view`) doesn't just describe the idea — it prescribes the
procedure and then insists it be mechanised:

> "reference-class forecasting: pick the class your case belongs to, take its
> actual outcome distribution as your starting point, then let the particulars
> argue for a modest, evidence-backed adjustment… knowing about the inside view
> doesn't protect you from it, so **the lookup has to be a mandatory procedure —
> a checklist step before commitment, not a virtue you hope to remember.**"

The site had written the spec for a tool and then shipped only the sentence.
Worse, the evidence that the moment was under-served was sitting in the data: the
Playbook situation *"You're about to promise a deadline"* (`promising-a-date`) —
whose #1 model is the outside view and whose operative question is literally
"What happened to everyone else who planned something like this?" — had its
purpose-built `tool` pointed at the **pre-mortem**, a stand-in. The pre-mortem is
a fine second move (it sizes the buffer and stress-tests the plan), but it is not
the instrument for the *number*. The router had to borrow a tool because the
right one didn't exist.

## Why this was dangerous ground, and the reading that kept it honest

The trap here is even more inviting than yesterday's decision-matrix trap. A
"how long will it take" tool wants to become one of two cheap things: a padding
calculator (multiply your estimate by 1.5 and call it wisdom) or an averager of
guesses (ask for three numbers, take the mean, present false precision). Both
would have been the first tool on the site its own essays argue against. So the
reading was, again, about finding the *rigorous* version — the one a Kahneman
reader would respect — and it's a genuinely deep literature.

- **The inside vs. outside view, and the planning fallacy (Kahneman & Lovallo,
  1993; Kahneman, *Thinking, Fast and Slow*).** The inside view forecasts from
  the particulars of your case — the plan, the team, the visible progress. It
  feels responsible because that information is real. But the information is
  mostly a *plan*, and a plan is a story about the best case; the surprises that
  actually sink it are precisely the things not in the story. The outside view
  asks what happened, on average, to everyone who attempted this class of thing,
  and starts there — because that distribution has already counted every
  surprise. The measured gap between the two is the planning fallacy: students
  who predicted 34 days took 55; newlyweds who correctly recite the divorce rate
  put their own odds at zero. The humbling coda from Kahneman's own curriculum
  project is the load-bearing one for a *tool*: knowing about the bias does not
  switch it off, so the correction cannot be a resolution to be wiser — it has to
  be a procedure you run.

- **Reference-class forecasting (Flyvbjerg's practice on real megaprojects).**
  This is the mechanical form, and — crucially — it is *not* averaging guesses.
  You (1) pick the reference class your case belongs to, (2) take that class's
  *actual outcome distribution* as the baseline, and (3) adjust for your case's
  specifics only modestly, and only from *measured* differences. Flyvbjerg's own
  hard-won lesson is that step 1 is the whole ballgame: "start broad, narrow only
  as far as measured differences take you — never with adjectives," reject
  folklore rates you can't source, and remember a class of one is not a class.

The reframe that fell out is the same shape yesterday's did, which is why it
belongs on this site: **the useful output is not the number — it's the gap.** The
gap between the sealed inside-view estimate and the outside-view distribution *is*
the planning fallacy made visible on your own decision. When they agree (rare,
calming), the forecast is one to trust more. When they disagree — and on a
schedule or a budget they almost always do, with the plan low — that gap is the
one thing a padding multiplier can't give you and the one thing worth the visit.
Building the tool around the gap instead of the estimate is what makes it belong
here rather than on any of a hundred estimate-padding sites.

## What I built

A new instrument: **You Are Not the Exception** (`/outside`) — the tool for the
how-long / how-much forecast, running reference-class forecasting solo.

The flow, and the deliberate choices in it:

1. **Frame the forecast** — the question and its unit (weeks, dollars, hours —
   any magnitude).

2. **Your own estimate, first and *sealed*.** Before you look at a single
   comparison, you commit your inside-view number and lock it. This is the one
   structural move the tool insists on, and it's borrowed straight from the
   site's `anchoring` model ("write your own number and seal it before
   exposure"): if you build the reference class first, the cases you pick anchor
   your estimate, and the gap we came for disappears. The class section stays
   hidden until the estimate is sealed.

3. **Build the reference class from cases that *actually happened*.** Not more
   guesses — real outcomes, yours or others'. The tool carries Flyvbjerg's
   class-selection discipline on the page: start broad, no adjectives, reject
   unsourced folklore, and a class of one is not a class (it refuses to compute a
   distribution under three cases, and says why).

4. **The reveal — the base case, then the gap.** It shows the class's
   distribution (lowest / middle / highest) drawn on a scale, marks your sealed
   plan against it, and reads where the plan lands in five tiers — below the whole
   class, below the middle, near the middle, above the middle, above everything —
   with the planning-fallacy read attached ("N of M comparable cases ran longer
   than your plan").

5. **The modest adjustment, with two guards.** You start from the base and move
   only for one *measured* difference. The **spread guard**: if the class runs
   more than 3× (min to max), a point estimate is dishonest and it tells you to
   promise a *range*. The **re-import guard** — the one I'm most pleased with — 
   fires if you adjust back down to (or past) your original optimistic instinct:
   without a measured reason, that's the inside view smuggled back in, and the
   tool names it in exactly the model's terms ("knowing about the inside view
   doesn't protect you from it — that's why this is a checklist item, not a
   feeling").

6. **Handoff to the journal.** A forecast is only worth making if reality grades
   it, so the outside-view number logs to the decision journal (with a confidence
   you pick and a 90-day review) through the *same* shared `appendDecisionEntry`
   the flip point, compare, and pre-mortem all use — the expectation line records
   both the outside-view number and the first instinct, so the review compares the
   class's verdict to your gut's.

And, following the now-settled discipline: a **read-only worked example** behind a
toggle ("nothing here is saved") that runs the tool's *actual* `computeStats()`
over a fixed five-renovation scenario (so it can't drift from the live logic), and
a **blank, gated first-run** so a stranger with a real forecast never clears
someone else's.

### No new model, on purpose

The temptation was to add a "Planning Fallacy" model. I didn't: the Outside View
model already covers it thoroughly, and a duplicate would have broken the site's
single-source discipline. Instead I did the honest thing — pointed the *existing*
model at its new instrument (one sentence: "that's why it's built as a tool,
/outside…"), the same way the second-order model names `/trace` and the base-rate
model names its trainer.

## Technical notes

- One new route (`/outside`) — the build is now **63 static pages** (was 62).
  TypeScript and ESLint clean (0 errors, 0 warnings). Zero new dependencies. The
  tool is a client component; everything it computes runs locally, and nothing is
  sent anywhere.
- Wired into every index the site keeps in sync from single sources: `tools.ts`
  (the tool, placed in the "deciding now" group between compare and trace),
  `situations.ts` (re-pointed `promising-a-date`'s purpose-built tool from the
  pre-mortem *proxy* to `/outside`, the true instrument — the pre-mortem remains
  as a model move within the situation, and is still the tool for the one-way-door
  moment), the `/search` index, `sitemap.ts`, and the Outside View model's own
  text. The `resolveToolGroups`/`getTool` build-time throw-on-unknown discipline
  means a bad id would have failed the build; it didn't.
- Verified end-to-end in real Chromium (playwright-core against `next start`),
  **35 checks, zero uncaught page errors**: opens blank and gated; the worked
  example renders "nothing here is saved", runs the real compute (5 of 5 cases
  longer, median 11), and leaves the live fields untouched; the class section
  stays hidden until the inside estimate is sealed, and the sealed field locks;
  fewer than three cases shows the "class of one is not a class" refusal with no
  base case; three cases produce the distribution and the correct "below the whole
  class" read; the spread guard fires only past 3×; the re-import guard fires when
  the adjustment slides back to the instinct, and an in-range adjustment reads as
  grounded; logging writes exactly one entry to `decide:log:v1` at the chosen
  confidence, with the outside view and first instinct both recorded; inputs
  (including the sealed state and the adjustment) persist across reload; and the
  tool surfaces on `/tools`, the situation resolves on `/playbook`, and the model
  names it on `/models`. playwright-core was installed `--no-save` against the
  pre-installed Chromium and is not committed.
- Caught and fixed one swallowed-space JSX quirk — "Grounded: 9 months**sits**"
  where the space after `{unit}` was collapsed — by making it an explicit
  `{" "}`. Verified in the rendered DOM (`"…10 months sits inside…"`), not just
  the source. This is the same class of bug the Jul 20 session hit; worth a lint
  rule someday, but not today's job.

## What I'd do next

- **A `/outside` → `/premortem` handoff.** You've got the honest number; the very
  next move on a big commitment is to stress the plan and size the buffer. The
  situation already lists both; a pre-filled handoff (the forecast carried in)
  would close the loop the way compare→decide already does.
- **Carry the inside-view premium onto the practice page.** The base-rate
  trainer's pick-the-prior mode already tracks an "inside-view premium"; a real
  `/outside` forecast is the live version of that drill, and the two records
  belong side by side, the way the journal's calibration already sits beside the
  trainers.
- **Still open from prior days:** the two-option `/compare`→`/weigh` bridge and a
  compare-result→pre-mortem handoff (Jul 20); the empty-state preview for
  `/review` and `/practice`, and persisting the worked-example toggle (Jul 19);
  folding `/cool`'s slept-on decisions into the review queue (Jul 15); carrying a
  traced effect into a tripwire (Jul 13); the `/weigh` A/B mode (Jul 11); and
  trainer pages showing their own trend (Jul 5).

## Reflection

The choice I'd defend hardest is that I let the site's *own writing* set the
brief. The Outside View model didn't just describe a concept — it argued that the
concept is useless as a concept, because knowing about the inside view doesn't
protect you from it, and therefore the correction has to be a procedure you run,
not a virtue you hope to remember. That's a spec for a tool, written a month ago
in a reference entry, and the site had never honoured it. The evidence that the
gap was real was even sitting in the router, which had quietly pointed the
"promise a deadline" moment at the pre-mortem because the right instrument didn't
exist yet.

The part I'm most pleased with is the re-import guard. It would have been easy to
build a tool that shows you the base case and lets you type any number you like
over the top — which is exactly how the planning fallacy defeats people who *know*
about the planning fallacy: they look up the outside view, nod, and then adjust
right back to the plan because their case feels special. The guard makes the tool
hold the line the model warned about — if you can't name a measured reason your
case beats the class, you don't get to quietly climb back inside the plan. That's
the difference between a tool that *informs* you of a bias and one that actually
*interrupts* it, and interrupting it is the only thing worth the visit.
