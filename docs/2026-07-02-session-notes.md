# Session Notes — July 2, 2026

## What I set out to do

The standing directive, unchanged for a month: make the site genuinely useful
to people — a tool, not a self-improvement pep talk. As always I began by
reading the full arc of prior sessions and the live codebase before touching
anything, and then — per today's brief — went reading for inspiration beyond
the repo before deciding what to build.

The site as of this morning: 21 essays, 22 mental models, the bookshelf and
reading notes, the notes↔models graph, four reading paths at `/start`, the
Playbook (11 situations), the decision journal at `/decide`, three trainers
(`/calibrate`, `/estimate`, `/update`), and the practice hub at `/practice`
that reads all three records and names your weakest skill. The
cross-referencing discipline is still the best thing about the codebase:
declared once, surfaced in both directions, unknown references throw at build
time.

## The gap I found

Three separate strands of the site's own writing were pointing at the same
unbuilt thing, and two sessions of notes had flagged it by name:

- The base-rate essay ends: *"the hard part is knowing the base rate at all —
  and choosing the right one… This is the genuinely difficult judgement, the
  place where two careful people can disagree, and no amount of crowd-counting
  resolves it."*
- The Kahneman reading note ends: *"the correction has to live in the
  procedure, not in your judgment: make the base-rate lookup a mandatory step
  before commitment."*
- The last two sessions' "what I'd do next" both list: *"the honest 'reference
  class' mode for base rates, still unbuilt and still the right finish line for
  that trainer: make the user pick the prior for a messy real question and show
  how the choice moves the answer."*

The trainer's two existing modes hand you the base rate and drill the
*downstream* move (how far evidence should shift you). But real questions never
arrive with the prior attached — and the judgement of choosing it, Kahneman's
inside-vs-outside view, had an essay-sized hole too: the site had the story (in
a reading note) but no essay, no model, no situation, and nowhere to practise.

So today's theme: **teach the judgement upstream of all the arithmetic —
choosing the prior. Complete the base-rate trainer with a pick-the-prior mode,
and give the Outside View its full place in the reference.**

## Reading and thinking before building

I read around the planning-fallacy and reference-class-forecasting literature
before designing anything, and verified every number I wanted to ship:

- **Buehler, Griffin & Ross (1994)** — students predicting their own theses:
  predicted 33.9 days, actual 55.5; only ~30% finished by their own date, and
  the dates given with "99%" confidence held less than half the time. The
  planning fallacy, measured.
- **Baker & Emery (1993)** — the opening datum of the new essay: marriage-license
  applicants accurately estimate that about half of US marriages end in divorce,
  and put the median chance of their *own* divorce at **zero percent**. The
  inside view in one line.
- **Flyvbjerg's project database / reference-class forecasting** — nine in ten
  megaprojects over budget; professional planners don't escape; the fix
  (forecast from the class's actual outcome distribution) is now required
  practice for some governments. The institutional proof that this is a
  procedure, not a virtue.
- **Luo & Stark (2014) + BLS Business Employment Dynamics** — the folklore "90%
  of restaurants fail in year one" traces to a 2003 TV commercial and appears in
  no dataset; the census says ~17% close in year one and just under half survive
  five years — almost exactly the all-industries rate. This gave the design its
  second trap type: not just classes-of-one but *fake base rates*.

Two design decisions fell out of the reading:

1. **The mode must have no answer key.** Both existing modes grade against an
   exact posterior. But the whole point of reference-class choice is that it's
   judgement — so the reveal doesn't declare a "correct" class; it shows where
   *every honest class* lands, marks the traps, and teaches the per-problem
   lesson (each of the four problems trains a distinct facet: the planning
   fallacy; folklore correction running both directions; legitimate narrowing
   with real data; defining the event before you pick the class). What gets
   *recorded* is the one thing that is honestly measurable without an answer
   key: the signed gap between your gut and the class you chose to stand on —
   the **inside-view premium**.
2. **The traps must be selectable.** A class of one ("founders this talented")
   and a folklore rate are what real life actually offers you; pre-labelling
   them would delete the lesson. So they're ordinary-looking cards; picking one
   triggers the correction inline and blocks the reveal until you choose a class
   with a rate behind it.

## What I built

### 1. The problem bank — `app/data/reference.ts`

Four messy, real-shaped problems (a deadline you're about to promise, a
friend's restaurant, a wedding, a startup), each with 2–3 honest reference
classes (every rate sourced and deliberately rounded — these are priors, not
predictions), exactly one trap, a per-problem lesson, and sources. All questions
are framed so higher = rosier, so the recorded gap reads consistently as
optimism. Helpers (`honestClasses`, `honestRange`) keep the client dumb.

### 2. The mode — "Pick the prior" in `UpdateClient.tsx`

Gut answer first (same discipline as every trainer); then the class cards; trap
handling as above; then the reveal — a 0–100 strip plotting every honest class
beside your gut (no text on the strip; with classes at 45 and 50 the labels
would collide, so numbers live in the list below), the honest range, your gap
from your own chosen starting point, the lesson, and each class's reading.

The lifetime record (`update:v1`) gains a `prior` sub-record `{n, sumAbs,
sumSigned}` — kept separate from the posterior modes because it measures a
different thing. Old records simply lack the field and load with it empty;
nothing breaks in either direction. The record panel now shows your inside-view
premium with the same early-days/diagnosis language the other modes use.

### 3. The essay — "Nobody Thinks They're the Base Rate" (`/writing/nobody-thinks-theyre-the-base-rate`)

~7 minutes. Opens with the newlyweds; names the inside/outside view and the
*mechanism* (a plan is a story about the best case; surprises can't be
enumerated from inside the story, but the class's record has already counted
them blindly); the planning fallacy with the Buehler and Flyvbjerg numbers; the
four rules for choosing a class (start broad, narrow only as far as measured
differences take you — with statistics, never adjectives; a class of one is not
a class; a rate you can't source isn't a rate; define the event first); and the
honest coda the site always insists on — Kahneman himself heard his team's base
rate and kept the two-year plan, so awareness protects nobody and the correction
has to be a procedure. Links the trainer mode, the journal, and the updating
essay as the downstream skill.

### 4. The model — Outside View (the 23rd)

Epistemology domain, placed beside Base Rates, with the mechanism, the numbers,
the class-choosing rules, and the pointer to the trainer mode. Base Rates'
explanation now names it for the upstream judgement. The Kahneman reading note
attaches to it (both directions, as always).

### 5. The situation — "You're about to promise a deadline"

The commonest planning moment there is, and the playbook had nothing for it.
Models: Outside View (forecast from the class, not the plan), Margin of Safety
(size the buffer to the usual overrun, not your confidence), Pre-mortem (the
steps that sink schedules are the ones not on the list), Implementation
Intentions (set the re-plan tripwire now). References the new essay and the
Kahneman note.

### 6. Wiring (the single-source dividend)

- **`/start`**: the new essay + Outside View model join "Not Fooling Yourself"
  right after the Base Rates step, so the path now teaches prior-choosing
  immediately after prior-using.
- **`/update` page**: header describes the third mode; footer links both essays
  and both models.
- **Practice hub**: `trainers.ts` reads the new sub-record — a prior-only
  record now counts as data (headline: your inside-view premium), and a mixed
  record appends the premium to the verdict and folds it into `needsPractice`.
- **Search**: the trainer's Tool doc now covers the mode (reference class,
  outside view, planning fallacy, inside-view premium…).
- **Sitemap/feed/home "Updated"**: all derive from data; the new essay flows
  through automatically. `/now` bumped to July 2, leading with today's work.

## Technical notes

- Build: **43 static pages** (was 42 — the new essay route).
  TypeScript and ESLint clean (0 errors, 0 warnings). Still zero runtime
  dependencies beyond Next/React.
- Verified the aggregation numerically against the *real* `trainers.ts` and
  `reference.ts` modules with a stubbed-window harness — 33 checks across five
  record scenarios (empty, prior-only, mixed, old-shape, small-sample) and the
  data invariants (every problem: ≥2 honest classes, exactly one trap, traps
  rate-less, ranges 8–45 / 45–50 / 55–75 / 1–25).
- Verified the mode **end-to-end in real Chromium** (Playwright against `next
  start`): served problem → gut answer → trap card shows its correction and
  blocks continue → honest class enables it → reveal shows range, gap, and
  sources → `update:v1` gains `prior.n === 1` with a sane gap → the menu
  record shows the premium line → the practice hub reads the same record ("1
  answered"). Plus route/status and content-wiring smoke tests across the site.
- The only lint issue the build surfaced was an unused type import; removed.

## What I'd do next

- **A "your own record" class.** The deadline problem's best reference class is
  the one the site can't supply: your own past projects. The journal knows your
  reviewed decisions; a future pass could surface "your last N forecasts ran X
  points optimistic" as a personal reference class inside the drill.
- **Wire the journal into the practice hub** — still the standing flag: a
  "your real-world calibration" tile from reviewed decisions, closing the loop
  between the trivia warm-up and the bets reality grades.
- **A trend, not just a snapshot** on the hub (needs timestamped rounds — a
  real schema change, worth doing carefully).
- **More pick-the-prior problems** — the bank is four deep; a hiring question
  (most hires are fine, most "sure things" aren't) and a health-scare question
  would round it out, each with a distinct lesson to earn its slot.
- **From the older backlog:** the journal's "did you take the first move?"
  yes/no at review; the tripwire as its own field with its own reminder;
  negative-result problems for the update modes.

## Reflection

The satisfying thing about today is that the site *asked for this feature in
three different voices* — an essay's closing caveat, a reading note's final
sentence, and two sessions of backlog — and the build honoured what all three
were actually saying. Two choices I'd defend hardest. First, **no answer key**:
grading reference-class choice against a "correct class" would have taught
falsely that the judgement is mechanical; recording the inside-view premium
instead measures the one thing that's honestly measurable and names the failure
mode that matters. Second, **selectable traps**: the folklore rate and the
class of one aren't quiz distractors, they're the actual candidates life
offers, and the drill only transfers if you get to reach for them and feel the
correction. With this, the base-rate trainer finally teaches the whole skill
its own essay described: where to stand (pick the prior), and how far to move
(update on evidence) — and the essay, model, situation, and drill all say it in
one voice.
