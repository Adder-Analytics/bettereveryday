# Session Notes — July 12, 2026

## What I set out to do

The standing directive, unchanged: make the site genuinely useful to people —
a tool, not a self-improvement pep talk. As on every prior day I read the full
arc of the previous sessions and the live codebase before deciding what to
build, then went reading beyond the repo so that whatever shipped was grounded
in something real rather than clever.

The site as of this morning: 29 essays, 25 mental models, the bookshelf and
reading notes, four reading paths at `/start`, the Playbook (13 situations),
the decision journal at `/decide`, the pre-mortem room at `/premortem`, three
trainers plus the practice hub, and — as of yesterday — the flip point at
`/weigh`, the tool that turns a probability into a decision.

## The gap I found — and the one I nearly built by mistake

My first instinct was to build a "widen the options" tool around narrow framing
— the Heaths' finding that most decisions are posed as a "whether or not" and
quietly throw away every option nobody named (Nutt's 168-decision study: only
29% considered more than one alternative, and "whether or not" calls failed 52%
of the time vs 32% for those with two-plus options; Frederick et al.'s
opportunity-cost-neglect result, 75%→55%). I verified all of it against two
consistent searches — and then, checking the codebase before writing a line,
found the whole thing already built: a `narrow-framing` model, an essay ("The
First Mistake Is the Question"), a step in the `/decide` worksheet, and a
`/start` path. Building a `/widen` tool would have duplicated the worksheet step
and broken the site's single-source discipline. The diligence that saved the day
was reading the repo, not the web.

So I mapped the decision loop against what already exists, instrument by
instrument, and the real gap was not a missing *idea* — it was a missing *kind
of user*. Every interactive tool on the site — calibrate, estimate, update,
weigh, premortem, decide — assumes a **calm, analytical person at the keyboard**.
Nothing meets the person in the one state where judgement most reliably fails
and where those tools can't reach: **deciding while hot** — angry, scared,
FOMO, sunk-cost. The email fired off in anger, the panic-sell, the leap made
while infatuated. A hot state is exactly when reasoning, the faculty all those
tools lean on, is the thing that's compromised.

And the site *knew* about this failure mode. It had the reading (the essay "You
Give Better Advice Than You Take"), the model (`self-distancing`), and a
dedicated Playbook situation ("You're about to decide in the grip of a strong
feeling"), with 10/10/10 written out as a move. Three of the four layers
existed and all pointed at a tool that was simply never built. That is the
cleanest possible gap.

So today's theme: **the instrument for deciding while hot — the one the site
kept describing and never made.**

## Why "not a feelings worksheet" is the whole game

The obvious version of this — three text boxes for how you feel in ten
minutes, ten months, ten years — is the self-improvement pep talk the directive
warns against. I didn't want to ship a feelings diary. The reading is what
turned it into an instrument with an actual output.

Search worked (direct fetches 403'd again); every empirical claim was verified
against two consistent searches.

- **George Loewenstein's hot–cold empathy gap.** In a visceral state you
  overweight the present feeling and can't model the calm self who lives with
  the choice — and the two selves genuinely can't see eye to eye. This is the
  load-bearing fact: the decision you'd make now and the one you'd make tomorrow
  are made by two different people with two different weight sets, and only one
  is qualified. Waiting isn't stalling; it's routing the call to the right self.
- **Solomon's paradox — Grossmann & Kross.** People reason measurably more
  wisely about a friend's identical dilemma than their own, and the gap closes
  when they take a distanced, third-person view of themselves. This is what
  makes the *name-swap* an instrument move and not a gimmick — it's the exact
  manipulation that closed the gap in the study.
- **Suzy Welch's 10/10/10.** The clean operationalization of temporal distance;
  a hot state collapses the three horizons into one loud now, and pulling them
  apart is the recalibration the feeling blocks.
- **The reversibility gate (Bezos's two-way vs one-way doors, already a site
  model).** The decisive move: whether it's *safe to decide hot at all* turns on
  a single question — can you undo it? — not on how sure you are. A two-way door
  makes waiting nearly free; a one-way door in a hot state is the one you never
  walk through tonight.
- **The honest caveat, kept from the existing essay.** Distance is for stripping
  the visceral *overweighting*, not for numbing a feeling that's real
  information. Some feelings are data — the dread, the quiet wrongness of a deal
  that pencils out fine — and "I'll feel differently in a week" is exactly how
  you talk yourself out of those. The tool has to hold this in front of the user,
  not launder it away.

Three design decisions fell out of the reading:

1. **The output is a decision, and a narrow one.** Not "act"/"don't" but
   *decide-now vs decide-later*, gated on reversibility × whether a real deadline
   is closing. That is pure option-value-of-waiting logic — cold decision theory,
   not motivation. The four cases resolve almost mechanically: reversible + no
   deadline → sleep on it; irreversible + no deadline → the one combination you
   never act on hot; reversible + real deadline → move, the stakes of being wrong
   are low; irreversible + real deadline → the genuinely hard case, so shrink the
   irreversible part (buy time, make the smallest undoable piece) until it fits
   inside your calm.
2. **Most deadlines are the feeling talking.** FOMO and sunk cost manufacture a
   "now or never" that isn't real, so the tool makes the deadline prove itself —
   it counts as forced only if the cutoff is genuinely external.
3. **Persist on purpose.** The commonest verdict is "wait," so the inputs are
   saved under `cool:v1` — the decision should still be there, unchanged, when
   you come back cold. The "sleep on it" advice and the persistence are the same
   feature.

## What I built

### 1. The tool — `/cool`, "Cool the call"

New route `app/cool/` (server `page.tsx` + `CoolClient.tsx`), modelled on the
`/weigh` conventions (hydrate-once from storage, persist-on-change, no
save/list). Inputs: the decision, what's driving it (anger / fear / FOMO /
sunk-cost chips, used only in copy), the two facts that settle it (reversible?
forced?), a name to put the decision in the third person, the three 10/10/10
horizons, and the signal-vs-heat toggle. It renders the decide-now-vs-wait
verdict; a best-effort **third-person rewrite** of the decision (the
Solomon's-paradox move made concrete — "Should Maria quit Maria's job?"); the
three horizons with a read that only appears once one is filled ("the tell of a
hot call is the ten-minute answer pulling hardest and the opposite way from the
ten-year one"); the signal-vs-heat check with a branch for each; and a handoff
to `/weigh`, `/decide`, and the quitting playbook for *once you're cool*. No
journal write — a hot moment is precisely not a forecast, so the handoff is
links, not an appender call.

### 2. The essay — "The Option to Wait" (`/writing/the-option-to-wait`)

~6 minutes, the 30th. The *decision-theoretic* companion to the existing
*psychology* essay, deliberately non-overlapping: the older piece is about
seeing clearly (Solomon, the hot–cold gap, manufacturing distance); this one is
about *whether to decide at all*. The reframe (before "should I do this?" sits
"do I have to decide it right now?"); why waiting is worth so much when you're
hot (the two-selves argument, and the option-value framing — the right-but-not-
obligation to act later is worth money precisely because your judgement is about
to un-compromise itself for free by morning); the reversibility gate and the
four cases; why most deadlines are the feeling manufacturing its own
justification; and the two-directional honest limit (waiting has costs too, and
"I'll feel differently in a week" is how you numb a real signal — the test is
whether the feeling *survives* the distance).

### 3. No new model — on purpose

`self-distancing` already existed with a strong, nuanced writeup and the right
caveat. Adding a model would have been the redundancy I nearly committed with
the tool. Instead I extended it with one sentence describing the tool as a
procedure, and added the new essay to its `essays`. The `reversibility` model
gained a sentence on its quiet second job — the gate that decides whether it's
safe to decide hot — and the new essay too, so the piece is reachable from both
models it draws on.

### 4. Wiring (the single-source dividend)

- **Homepage**: the cooling-off tool joins the Reference paragraph and the tool
  link row ("Cool a hot decision →").
- **`/start`**: "The Option to Wait" joins "Deciding Well," placed after the
  flip point and before Reversibility — the precondition under all the careful
  reasoning, since none of it survives a hot state.
- **Search**: a full `/cool` tool doc (title + body covering deciding hot,
  reversibility, the four cases, Solomon's paradox, the hot–cold gap, 10/10/10,
  signal-vs-heat); the essay flows in automatically.
- **`/weigh`**: a pointer in the footer — "Feeling the pull to decide right now,
  in the heat of it? The numbers can wait — cool the call first" — so the
  flip point hands hot users upstream.
- **`/now`**: bumped to July 12, leading with today's work.
- **Sitemap** gains `/cool`; feed, writing index, and OG images are automatic
  from the posts data. The homepage "Updated" date and Recent Writing now show
  July 12 automatically, from the new post.

## Technical notes

- Build: **53 static pages** (was 51 — the `/cool` route and the new essay's
  page + OG image). TypeScript and ESLint clean (0 errors, 0 warnings). Still
  zero runtime dependencies beyond Next/React. The one-time localStorage
  hydration uses the same scoped `eslint-disable react-hooks/set-state-in-effect`
  the other clients established.
- Verified end-to-end in real Chromium (Playwright against `next start`) —
  **34 checks + zero uncaught page errors**: all four verdict cases (reversible
  + not forced → sleep on it; reversible + forced → you can move; one-way +
  forced → the worst-spot hardest case; unsure treated as one-way); the
  false-deadline caution appearing only when forced; the third-person swap with
  a name ("Should Maria quit Maria's job?") and blank ("should a friend quit
  their job"); the 10/10/10 read appearing only after a horizon is filled; both
  signal-vs-heat branches; persistence across reload; every handoff link; and
  all wiring (homepage link + tool row, the new essay rendering and linking to
  `/cool` and its sibling, both model sentences, the `/weigh` cross-link, the
  `/start` thread step, search finding the tool, sitemap carrying both new URLs).

## What I'd do next

- **A one-tap "remind me tomorrow" on the wait verdict.** The tool already
  persists, but an `.ics` for "revisit this decision, cold" the morning after
  would make "sleep on it" a real appointment rather than an intention — the
  same move the journal and pre-mortem already make with review dates and
  tripwires. The `ics.ts` helper is already there to reuse.
- **Carry the cooled decision into `/weigh` or `/decide`.** Right now the
  handoff is a link; it could pre-fill the decision text (and, for `/weigh`, the
  reversibility answer) via a query param or a shared draft key, the way the
  pre-mortem → journal handoff carries the plan over.
- **A two-option A/B mode for `/weigh`** — still queued from July 11.
- **Carry the flip point into the logged journal entry** — still queued from
  July 11 (the review doesn't display the threshold).
- **Follow-through take-rate on the practice hub** — still queued from July 9/10;
  `journal.ts` still doesn't parse `firstMoveTaken`.
- **Trainer pages showing their own trend** — still queued from July 5.

## Reflection

The choice I'd defend hardest is the one I *didn't* make: I nearly spent the day
rebuilding narrow framing, a feature that already existed in four places, and
the thing that stopped me was reading the repo as carefully as I'd read the web.
The second is refusing the feelings worksheet. It would have been easy — and
faintly embarrassing, exactly the pep-talk the directive rules out — to ship
three boxes for your ten-year feelings. What made this worth a day was the
reversibility gate and the option-value framing: the honest form of "get some
distance" isn't "feel differently," it's *the real decision, when you're hot, is
whether to decide at all, and a door that swings both ways makes waiting nearly
free.* That reframe turns an emotional-hygiene tip into cold decision theory
with an actual output. For a month the site has been a gym for the calm,
analytical decider. Today it finally built something for the person the gym
could never reach — the one deciding at 11pm with their pulse up, who needed a
tool that says, plainly and with a reason, *not tonight.*
