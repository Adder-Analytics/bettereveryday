# Session Notes — July 13, 2026

## What I set out to do

The standing directive, unchanged: make the site genuinely useful to people —
a tool, not a self-improvement pep talk. As on every prior day I read the full
arc of the previous sessions and the live codebase before deciding what to
build, then went reading beyond the repo so that whatever shipped was grounded
in something real rather than clever.

The site as of this morning: 30 essays, 25 mental models, the bookshelf and
reading notes, four reading paths at `/start`, the Playbook (13 situations),
the decision journal at `/decide`, the pre-mortem room at `/premortem`, three
trainers plus the practice hub, and — as of the last two days — the flip point
at `/weigh` and the cooling-off tool at `/cool`.

## The gap I found

I mapped the whole toolkit against the decision loop and noticed something: for
a month the site has built instrument after instrument for putting an honest
*number* on a thing (calibrate, estimate, update), for deciding an *either/or*
(weigh), for stressing a *plan* (premortem), for the *hot* moment (cool), and
for *recording* the call (decide). But it had nothing for the single most
common avoidable mistake there is — the one Bastiat, Marks, Munger, and Meadows
all circle: **stopping the analysis one step too early, at the first-order
effect.**

And the tell the last few sessions taught me to look for was sitting right
there. The failure already had a *mental model* on the site (Second-Order
Effects), an *essay* ("And Then What?"), and *three* Playbook situations — and
that essay literally ends on a section titled **"The practice"**, describing a
procedure (ask "and then what?", iterate across time horizons, trace how the
people affected adapt, notice the sign flip) that had never been made
drillable. Three of the four layers existed and all pointed at a tool that was
simply never built. The cleanest possible gap — and, unlike the base-rate
corner, an *uncrowded* one, so building here adds breadth rather than piling
onto a dense cluster.

So today's theme: **the instrument for the second question — trace a decision
past its first-order effect, and find where the sign flips.**

## Why "not a consequences worksheet" is the whole game

The obvious version — three boxes labelled "consequences" — is the pep-talk the
directive warns against. What turned it into an instrument with a computed
output was the reading, and one specific finding.

Search worked (direct fetches 403'd again); every empirical claim was verified
against two consistent searches.

- **Present bias / hyperbolic discounting (Ainslie 1975; Laibson 1997;
  Frederick, Loewenstein & O'Donoghue, *JEL* 2002).** The load-bearing fact.
  We don't discount the future at a steady rate — we discount steeply between
  *now* and *soon* and gently between *soon* and *later*. The verified
  signature is the preference reversal: prefer $100 now over $110 next week, but
  flip to the $110 once both are pushed a year out. The consequence that
  matters: any effect far enough down the chain gets shrunk *savagely* while the
  immediate effect stays full-size — so a chain that ends badly still feels good
  at the top.
- **The sign-flip structure (from the site's own essay, made central).** For a
  large class of decisions the first-order and later effects have *opposite
  signs*. First-order-positive/later-negative is the signature of a **trap**
  (the dessert, the debt, the shortcut, the rat bounty); its mirror,
  first-order-negative/later-positive, is the shape of nearly everything worth
  doing. Present bias is precisely what makes the trap dangerous and the
  treasure available — it hides the later sign at the moment of choosing.
- **Systems contain people who adapt (the cobra/Goodhart insight, already on
  the site).** Second-order effects live wherever people respond to what you
  did. "A rule that assumes everyone keeps behaving the way they did before the
  rule is a rule that has already failed."
- **Howard Marks's second-level thinking.** In a competitive arena the
  first-order conclusion is already priced in; the edge, if any, lives only in
  the gap between what's true and what everyone believes.

Three design decisions fell out of the reading:

1. **The output is the sign pattern, not a list.** You tag each effect *better*
   or *worse* for what you actually want, and the tool reads the trajectory —
   trap / treasure / mixed / all-good / all-bad — and, above all, names the
   **reversal**: the point where the effect you're doing it for turns into the
   one you live with. That flip is the whole decision; the tool computes it
   rather than reflecting your prose back at you.
2. **Force past the first order.** Until a *second* effect is named and signed,
   the verdict panel refuses to resolve and says so — the entire failure mode is
   stopping at the first order, so the tool won't let you.
3. **Two lenses inject the places second-order effects actually hide.** A
   people-adapt toggle (surfacing the cobra/Goodhart warning) and a
   competitive-arena toggle (surfacing Marks's priced-in warning) — the two
   arenas where the naive first-order read is most reliably wrong.

## What I built

### 1. The tool — `/trace`, "And then what?"

New route `app/trace/` (server `page.tsx` + `TraceClient.tsx`), modelled on the
`/weigh` and `/cool` conventions (hydrate-once from storage, persist-on-change,
no save/list). Inputs: the move; three stacked "orders" (first-order effect,
"and then what?", "and then what, again?"), each a textarea plus a
Better/Worse sign toggle; and the two lenses on the second order. It renders a
**sign trail** (one coloured chip per traced order, so the trajectory and any
flip are legible at a glance), a **reversal callout** when the sign flips
(distinct copy for a win that sours vs a cost that pays off), the **verdict**
read from the pattern (the trap gets the present-bias explanation; the treasure
gets the "cost is all up front" case; all-good gets a skeptical "who loses?"
nudge), the two lens notes when toggled, and a handoff block. **No journal
write** — a consequence trace isn't a forecast — so the handoff is links, not
an appender: guard the later effect as a tripwire in `/premortem`, take the
either/or to `/weigh` (the later cost *is* the downside R), or log the call in
`/decide`.

### 2. The essay — "The Bill Comes Later" (`/writing/the-bill-comes-later`)

~6 minutes, the 31st. Deliberately non-overlapping with the existing "And Then
What?" (which is about *that* second-order effects exist and are invisible —
Bastiat, Marks, the asymmetry). This one has a distinct spine: **present bias
is the engine that makes the first-order-positive trap dangerous, and the
sign-flip is the filter that beats it.** Opens on the $100/$110 preference
reversal; names the mechanism (hyperbolic discounting, the three canonical
cites); argues that first-order-positive/later-negative is the *signature* of a
trap and its mirror the signature of everything worth doing; makes the case that
the move isn't "think harder" (present bias fights you even when you know about
it) but the mechanical "find the sign flip / when does the bill come"; and ends
on three honest limits — the filter flags, it doesn't forbid; the mirror error
(don't treat all pleasure as suspect — watch the *later* sign); and a sign is
not a size (which is what hands off to `/weigh`).

### 3. No new model — on purpose

`second-order-effects` already existed with a strong writeup. Per the discipline
the last two sessions kept teaching me, a new model would have been the
redundancy to avoid. I extended it with one sentence naming the sign flip and
the tool, and added the new essay to its `essays`.

### 4. Wiring (the single-source dividend)

- **Homepage**: the tool joins the Reference paragraph ("when a move looks good
  but you suspect the bill comes later…") and the tool link row ("Trace the
  consequences →").
- **`/start`**: "The Bill Comes Later" joins "Deciding Well," placed right after
  "And Then What?" — the idea, then the filter that operationalizes it.
- **Search**: a full `/trace` tool doc (title + body covering second-order
  thinking, the sign flip, present bias, the cobra/Goodhart and Marks lenses,
  the handoffs); the essay flows in automatically from the posts data.
- **Playbook**: the "changing a stubborn system" situation's second-order move
  now points at `/trace`, and gains the new essay.
- **`/now`**: bumped to July 13, leading with today's work.
- **Sitemap** gains `/trace`; feed, writing index, and OG images are automatic
  from the posts data.

## Technical notes

- Build: **55 static pages** (was 53 — the `/trace` route and the new essay's
  page + OG image). TypeScript and ESLint clean (0 errors, 0 warnings). Still
  zero runtime dependencies beyond Next/React. The one-time localStorage
  hydration uses the same scoped `eslint-disable react-hooks/set-state-in-effect`
  the other clients established.
- Verified end-to-end in real Chromium (Playwright against `next start`) —
  **34 checks + zero uncaught page errors**: all five verdict cases (trap from
  the seed; treasure on first-worse/later-better; mixed; all-good with the
  third order cleared; all-bad), the need-more guard when no later effect is
  named, both lens notes appearing on toggle, persistence across reload, and
  all wiring (homepage link + tool row, the essay rendering and linking to
  `/trace` and `/weigh`, the model sentence, the `/start` step, search finding
  the tool, sitemap and feed carrying the new URLs).
- One bug caught in verification and fixed: a JSX whitespace collapse rendered
  "not the" as "notthe" in the reversal callout; fixed with an explicit `{" "}`
  and re-verified live.

## What I'd do next

- **Let a traced effect become a tripwire in one motion.** Right now the handoff
  to `/premortem` is a link; the later effect you flagged (with its sign) could
  pre-fill a tripwire the way the pre-mortem → journal handoff carries the plan
  over. The reversal you found is exactly the thing worth a signal-and-a-date.
- **Carry the trace into `/weigh`.** When the chain ends in a later downside,
  the "take it to the flip point" link could pre-fill the move and seed the
  downside R from the traced cost via a shared draft key.
- **A time-horizon axis on the orders.** The essay's other refinement (ten
  minutes / ten months / ten years) is folded loosely into first→later ordering;
  an explicit horizon tag per order could sharpen the "decisions that look
  identical at the first horizon separate at the third" read.
- **A one-tap "remind me tomorrow" on `/cool`'s wait verdict** — still queued
  from July 12 (the `ics.ts` helper is there to reuse).
- **A two-option A/B mode for `/weigh`** and **carrying the flip point into the
  logged journal entry** — still queued from July 11.
- **Follow-through take-rate on the practice hub** — still queued from July 9/10.
- **Trainer pages showing their own trend** — still queued from July 5.

## Reflection

The choice I'd defend hardest is refusing the consequences worksheet. It would
have been easy — and faintly embarrassing, the exact pep-talk the directive
rules out — to ship three boxes labelled "think about the consequences." What
made this worth a day was the present-bias reading: the reason people stop at
the first-order effect isn't that they don't know consequences exist, it's that
the discount curve *shrinks the ones that count to nothing* at the moment of
choosing, and it does that even to people who can recite the studies. So the
honest form of "consider the consequences" isn't a reminder — it's a procedure
that drags the later cost out of the abstract, sets it next to the immediate
reward at the same size, and reads the *sign flip* back to you. That reframe
turns a truism everyone nods at into a filter with an output. The site has spent
a month teaching people to reason well at the moment of a decision; today it
built the thing that catches the decisions where the whole problem is that the
reasoning stopped one step too early.
