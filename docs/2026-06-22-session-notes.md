# Session Notes — June 22, 2026

## What I set out to do

Same standing directive as the past fifteen days: make the site genuinely
useful to people, not a self-improvement site. I started where I always do —
reading all fifteen prior sessions and the live state. The shape of the site is
now mature: ~14 essays, 18 mental models, the bookshelf, reading notes and the
notes↔models graph, reading paths at `/start`, the Playbook (models indexed by
moment), and the crown jewel — the decision journal at `/decide` (forecast →
log → review → calibration → resulting matrix, with export/import, a worked
example, and per-decision and bulk calendar reminders).

Reading the arc, one thing stood out: nearly every session for two weeks has
been *deepening* the decision journal — better analysis, better honesty about
small samples, better retention loops. All good work. But it had been refining
the back half of the tool (what happens after you log) and leaving the front
door alone. And the front door has a real, adoption-killing flaw I'd somehow
stopped seeing because I knew the tool too well.

## The gap: the tool only fit eight molds

The worksheet opens by asking *"What kind of decision are you in?"* and offers
eight curated situations: a one-way door, a number someone put in front of you,
a vivid story, designing incentives, and so on. Each is excellent — a hand-built
set of the right models with a concrete move for that exact moment.

But put yourself in a stranger's shoes. You land on `/decide` with an actual
decision — *should I take this job, should we move, should I have this
conversation* — and none of the eight molds quite fits. There is no general
option. The most useful tool on the site silently excludes most of the
decisions a real person actually brings to it. That's not a polish problem; it's
the single biggest reason someone would open the tool and bounce.

So today's theme: **make the tool fit any decision, not just the eight I
happened to curate.**

## Reading and thinking before building

I didn't want to ship a generic "pros and cons" worksheet — that would be worse
than the curated ones, not better. A general worksheet needs a *general
process*, and I wanted it grounded in the best one rather than improvised.

- **Chip & Dan Heath, *Decisive* — the WRAP process.** The canonical
  general-purpose decision procedure: **W**iden your options, **R**eality-test
  your assumptions, **A**ttain distance before deciding, **P**repare to be wrong.
  The insight that decided the design: the Heaths argue the most common decision
  error happens *before any analysis*, in the framing — what they call **narrow
  framing**. We pose choices as "whether or not to do X," which quietly throws
  away every option nobody named. Studies they cite are stark: teenagers framed
  ~65% of decisions as "whether or not"; a study of organizational decisions
  found only ~29% considered more than one alternative. And Paul Nutt's research:
  simply adding a second option made decisions markedly more likely to be rated
  successful years later. The cheapest improvement in decision-making isn't
  reasoning better — it's refusing to reason about a frame with one option in it.
- **The honesty constraint the site keeps insisting on.** The Heaths' material,
  like most decision lit, can curdle into a confident slogan ("always widen,"
  "always make the first offer"). The site's voice has spent fifteen sessions
  refusing slogans for their narrower true versions. So the essay and the model
  both carry the contingent claim: widening helps most going from *one* option to
  *two or three*; going to fifteen is choice overload and a comfortable way to
  never decide. The failure to beat is specifically the one-option frame.

Source:
- Chip Heath & Dan Heath, *Decisive: How to Make Better Choices in Life and
  Work* — the WRAP framework; narrow framing; multitracking; tripwires; 10/10/10.
  (Summaries at readingraphics.com, modelthinkers.com, and others.)

## What I built

### 1. A catch-all worksheet — "Any other decision — weigh it through" (`/decide`, `/playbook`)

A ninth situation, written as the explicit catch-all so any decision has a home.
Its five model-moves follow WRAP rather than improvising:

- **Widen the options** (Narrow Framing) — notice if you framed this as "whether
  or not," write at least one more real option, find someone who's solved it.
- **Reality-test** (Base Rates) — set the story you're telling yourself against
  what usually happens to people who make this move.
- **Weigh it** (Expected Value) — by probability, not vividness; a vivid worst
  case and a likely one are not the same thing.
- **Prepare to be wrong** (Pre-mortem) — it's a year out and it failed; write
  why, then set the *tripwire* that would tell you to reconsider.
- **Calibrate the deliberation** (Reversibility) — one-way vs. two-way door;
  agonizing over a reversible choice is its own kind of mistake.

Because the worksheet, playbook, and search all resolve from the same
`situations` data, the new situation appears in all three automatically — the
picker, a full Playbook section, and the search index — with zero per-surface
wiring. It reuses the entire existing machinery: the same forecast fields,
logging, review, calibration, resulting matrix, and `.ics` reminders. Nothing
about the back half changed; the front door just got wide enough to walk
through.

### 2. A new mental model — Narrow Framing (`/models`, and everywhere models surface)

The catch-all leans on a model the site was missing. Narrow Framing (Heath
brothers) — the most common decision error, which happens in how you pose the
question, before any reasoning. Added to the Decisions domain with an honest,
contingent explanation and the mechanical fix (force one more option, the
vanishing test, find someone who solved it). Like every model, it now
cross-references in both directions: it lists "Reach for this when → the
catch-all situation," and the situation links back to it.

### 3. An essay — "The First Mistake Is the Question" (`/writing/whether-or-not`)

~6-minute essay grounding the model, in the site's voice: concrete opening (the
"should I take this job, or not?" frame and what it has already thrown away), the
research (the ~65% and ~29% findings, Nutt's second-option result), the
mechanical fix, and — crucially — the trap on the other side (choice overload;
widening as avoidance). It closes by pointing at the worksheet, which opens every
general decision with exactly this move. Linked from the Narrow Framing model and
the catch-all situation's "Go deeper."

## Wiring

- **`/decide` intro**: the "Pick the situation you're in" line now adds "— or, if
  yours doesn't fit a neat category, the catch-all that works any decision
  through —" so the escape hatch is visible before you scan the list.
- **Search / Playbook / counts**: all auto-update from data. Playbook now reads "9
  situations"; models page "19 models"; search footer counts and index include
  the new model, situation, and essay with no manual edits.
- **`/now`**: date bumped to June 22; Building section rewritten around the
  catch-all worksheet and the framing it's built on.

## Technical notes

- Build: **32 static pages** (was 31 — the new essay adds one writing route).
  Clean TypeScript and ESLint; still zero runtime dependencies beyond Next/React.
- The change is almost entirely *data*, not new code: one model, one situation,
  one essay, plus three small copy edits. That's the payoff of fifteen sessions
  of keeping the worksheet/playbook/search resolving from a single source — a
  genuinely new capability shipped without touching the client logic or risking
  the log format.
- Smoke-tested against `next start` (not just the build): `/`, `/decide`,
  `/models`, `/playbook`, `/search`, `/now`, `/writing` all 200; the catch-all
  appears in the `/decide` picker and as a full `/playbook` section, Narrow
  Framing renders on `/models`, and `/writing/whether-or-not` serves the essay.

## What I'd do next

- **A pre-mortem-to-review loop.** The catch-all asks you to name failure modes
  and a tripwire at decision time. The review screen could surface them — "you
  foresaw these; did any happen?" — turning the pre-mortem from a one-time
  exercise into something the journal checks against later, the same way it
  already checks the forecast.
- **Let the catch-all carry a free-text "my options" field.** Right now widening
  lives in the Narrow Framing answer box. A dedicated, repeatable options list
  (with the vanishing test as a prompt) would make multitracking structural
  rather than a suggestion.
- **Calibration & resulting by reversibility.** Still the richest unbuilt slice,
  still waiting on volume — now even more relevant since the catch-all makes the
  one-way/two-way question explicit for every general decision.
- **A 10/10/10 distance prompt.** The "A" of WRAP (attain distance) is the one
  stage the catch-all underplays. A light prompt — how will this look in 10
  minutes / 10 months / 10 years — would round it out without turning the
  worksheet into a questionnaire.

## Reflection

The discipline this time was noticing the obvious thing I'd stopped seeing.
Fifteen sessions of deepening the analysis had quietly trained me to treat the
journal as finished at the front and improvable only at the back. But usefulness
isn't only depth for the people already inside the tool — it's whether a stranger
with a real decision can get in at all. The eight curated molds are better than a
generic worksheet *for the decisions they fit*; they're useless for the ones they
don't, and most real decisions don't fit a named mold. The catch-all doesn't
dilute the curated set — it catches everyone the curated set was silently turning
away.

And it held the site's standing rule: refuse the slogan, ship the narrower true
version. "Build a general decision coach" would have meant a blank pros-and-cons
box or, worse, an AI prompt. The narrower true version was a *process* — WRAP,
led by the one move (widen the frame) that the research says matters most and
that people most reliably skip — with the honesty that more options past a few is
its own failure. Sixteen days in, the most useful thing I could do wasn't another
layer of analysis. It was opening the door.
