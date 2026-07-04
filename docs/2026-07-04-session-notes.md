# Session Notes — July 4, 2026

## What I set out to do

The standing directive, unchanged: make the site genuinely useful to people —
a tool, not a self-improvement pep talk. As always I read the full arc of
prior sessions and the live codebase first, then — per the brief — went
reading beyond the repo before deciding what to build.

The site as of this morning: 24 essays, 23 mental models, the bookshelf and
reading notes, four reading paths at `/start`, the Playbook (12 situations),
the decision journal at `/decide`, three trainers, and the practice hub that
shows the warm-up scores beside the journal's real record.

## The gap I found

The playbook has recommended the **pre-mortem** since the site's earliest
sessions — it appears in three separate situations ("one-way door,"
"weigh it through," "make it happen"), each with a move that says *assume
it's a year later and this went badly; write the story of why.* The decision
journal's own worksheet asks for "the tripwire — the signal that would tell
you to stop and reconsider," and an old backlog line flagged "the tripwire as
its own field with its own reminder." The Implementation Intentions model
explains, at length, that a tripwire is an if-then pointed at reconsidering.

And yet: **there was nowhere on the site to actually run a pre-mortem**, and
the tripwire — the site's most-referenced unnamed idea — had no model of its
own, no essay, and no mechanism. The site kept telling people to do a thing
it never helped them do. Meanwhile the playbook, twelve situations deep, had
nothing for one of the commonest hard moments there is: not being able to
tell whether it's time to quit.

So today's theme: **give the pre-mortem a room, and give the tripwire its
teeth.** Decide how the plan fails before it starts — and decide, while
you're still calm, what would make you stop.

## Reading and thinking before building

Direct page fetches were mostly blocked by the network policy again, but
search worked, and every claim shipped today was verified against it rather
than trusted from memory:

- **Mitchell, Russo & Pennington (1989)** — "prospective hindsight":
  imagining an event as *having already occurred* raises the ability to
  correctly identify reasons for future outcomes by about 30%. This is the
  pre-mortem's measured engine, and importantly it's an individual effect —
  which is what makes an honest solo version possible at all.
- **Klein (2007), HBR, "Performing a Project Premortem"** — the procedure:
  brief the plan; declare it has failed, spectacularly; a few minutes of
  silent independent writing ("write the history of that disaster"); then
  round-robin, one reason per person, until every list is on the table.
- **Kahneman on the pre-mortem** — his stated favorite counter to
  overconfidence, and his diagnosis of *why* it works in groups: it
  "legitimizes doubts." As a team converges, expressed doubt reads as
  disloyalty; declaring the plan dead inverts the incentive so the smartest
  person in the room is the one who finds the best reason it died.
- **Heath & Heath, *Decisive* — tripwires** — the Van Halen brown-M&Ms
  clause as a cheap observable detector of an expensive hidden state (an
  unread rigging contract), and the fuel-gauge framing: a threshold set while
  calm interrupts you at the right moment so you don't have to monitor the
  gauge or trust the moment's judgement.
- **Annie Duke, *Quit* — kill criteria** — the recipe that gives a tripwire
  teeth: **a state and a date**. "If it isn't working we'll rethink" has
  never fired in the history of planning, because "working" renegotiates
  itself in the moment. And the 1996 Everest disaster as the cautionary
  case: the turnaround time was championed by Rob Hall, who crossed his own
  line under summit fever and died on the descent, while the three clients
  who did the arithmetic and turned around by late morning survived —
  unremembered, which is her bitter footnote: quitting on time usually
  feels, and looks, like quitting too early.

Three design decisions fell out of the reading:

1. **The tense is the product.** The tool never asks "what could go wrong"
   — that's a debate, and the plan's author is a motivated lawyer. It says
   *it's [the date you chose]; the plan failed; write the history*, and asks
   for reasons in the past tense. Everything else is scaffolding around that
   one reframe, because that's the part with a measurement behind it.
2. **Honesty about the solo version.** Klein's exercise is a group ritual
   and half its power is social (the legitimized-doubt effect). Solo, what
   remains is the prospective-hindsight effect — measured on individuals —
   plus a breadth problem: ten people carry ten worries, you carry one,
   rehearsed. So the tool has "lenses" (people, money & fuel, time, the
   outside world, you) as the deliberate substitute for the room, and the
   essay says plainly which benefit survives the solo adaptation and which
   doesn't.
3. **A tripwire without a signal and a date is a worry.** The triage step
   won't save a tripwire until the signal is written down as something
   observable, and every tripwire gets a check date (defaulted, never
   omitted) that can be dropped into a real calendar as an .ics reminder
   carrying the signal and the failure it guards — because the person
   crossing a tripwire is never the person who set it, and Hall's death is
   the proof that awareness doesn't survive summit fever. Procedure over
   virtue, the site's oldest refrain.

## What I built

### 1. The pre-mortem room — `/premortem`

Three steps, in Klein's order, with a persistent draft so an unfinished one
keeps until you come back:

- **The plan** — one line, plus the date you'd know it failed (Klein's
  default: a year out).
- **The failure** — the crystal-ball framing with the user's own plan and
  date embedded, then fast one-per-line reasons in the past tense (Enter
  adds and clears), the five lenses for when the list stalls, and a nudge
  that the useful reasons arrive around number four or five — but no hard
  gate, because the tool respects the user.
- **The response** — the half most retellings skip: every reason must be
  triaged into *change the plan* (with what changes), *set a tripwire*
  (signal + check date, both enforced), or *accept it* (with an optional
  why, so future-you knows it was seen rather than missed). The save button
  stays disabled, with honest counts, until the triage is complete.

The artifact is a full memo view: numbered causes of death, each with its
decision, copyable as text, with tripwire checks downloadable as calendar
reminders. Saved pre-mortems live in `premortem:v1` (defensively merged on
read, same discipline as the journal); the worked example — a modest,
familiar plan, deliberately not a startup pitch — shows all three triage
moves and is never written into the user's list. The view ends with a
handoff to the decision journal: the plan survived its funeral, now log the
forecast.

### 2. Shared calendar plumbing — `app/data/ics.ts`

The journal had grown a complete, careful RFC 5545 implementation
(escaping, 75-char folding, the VCALENDAR envelope) as private functions.
Extracted the spec plumbing into a shared module — each tool still builds
its own VEVENTs, since the content differs — so the two calendar-writing
tools can't drift apart on conformance. The refactor is regression-tested
end-to-end (below).

### 3. The essay — "Hold the Funeral First" (`/writing/hold-the-funeral-first`)

~8 minutes. Opens with the meeting where someone already knows why the plan
will die and says nothing — and the observation that planning alone is
worse, because the advocate and the doubter share a skull and the advocate
runs the meeting. Then Klein's procedure; the 1989 measurement and the
mechanism ("a certainty is explained; a possibility is debated");
Kahneman's legitimized doubt and the status inversion. A section the
literature rarely bothers with: what honestly survives when you run it
alone. Then the triage (a list of failure modes is organized dread, not an
output), and the tripwire half: brown M&Ms, the fuel gauge, kill criteria
as a state and a date, and the man who set the turnaround time. The honest
limits close it: you'll list ten causes and reality selects the eleventh
(that's what base rates are for — linked); plans should *survive* their
funerals; and a tripwire that lives in your head is a mood.

### 4. The model — Tripwires (the 24th)

Decisions domain, beside Implementation Intentions (its structural sibling —
an if-then pointed at reconsidering rather than doing). Van Halen, the fuel
gauge, states-and-dates, Everest, and the design rule that falls out: build
the tripwire to outrank your future self — written, dated, delivered by
something that doesn't care how the plan feels that morning. The Pre-mortem
model got a matching upgrade: the 1989 research, Kahneman's diagnosis, the
triage framing, and a pointer to the room.

### 5. The situation — "You can't tell if it's time to quit"

The playbook's 13th situation, for the moment the site had never addressed.
Loss Aversion (the pain of making the loss real is not information about the
future), Opportunity Cost (staying isn't free), Outside View ("almost there"
is the inside view's favorite phrase), Self-Distancing (notice how fast the
advice comes when the sunk cost isn't yours), and Tripwires (if you can't
make the call today, make the smaller one: set the kill criteria). Because
situations feed the decision worksheet automatically, the journal can now
work a quitting decision through with these exact prompts.

### 6. Wiring (the single-source dividend)

- **`/start`**: the essay joins "Deciding Well" before the pre-mortem and
  new tripwires model steps.
- **Search**: a Tool doc for `/premortem` (kill criteria, prospective
  hindsight, brown M&Ms, quit…); the model, situation, and essay flow in
  automatically.
- **Home**: the pre-mortem room joins the Reference paragraph and link row.
- **`/decide`**: footer now offers the funeral before the log.
- **Sitemap**: `/premortem` added; the essay flows through with the feed.
- **`/now`**: bumped to July 4, leading with today's work.

## Technical notes

- Build: **46 static pages** (was 44 — the new essay route plus
  `/premortem`). TypeScript and ESLint clean (0 errors, 0 warnings). Still
  zero runtime dependencies beyond Next/React.
- Verified end-to-end in real Chromium (Playwright against `next start`) —
  60 checks: route/status smoke across the site; sitemap/feed carry the new
  pages; models page renders Tripwires with its essay link; the full
  premortem flow (plan gate → crystal ball shows the user's plan and date →
  Enter-adds-reason → lens prompts → triage gates: save blocked while
  reasons are untriaged *and* while a tripwire lacks a signal → save →
  artifact with correct counts and rendered tripwire); `premortem:v1`
  storage shape verified field-by-field; draft persistence and the resume
  banner across a reload, returning to the right step; corrupt storage
  degrades without throwing; memo copy content; the .ics download parsed
  and checked (envelope, PRODID, DTSTART, folded SUMMARY); the decision
  journal's bulk .ics regression-tested after the shared-module refactor
  (two VEVENTs, original PRODID intact); and search returning the tool for
  "tripwire" and "kill criteria".

## What I'd do next

- **The journal should know about the funeral.** A pre-mortem and a logged
  decision about the same plan are strangers today; a future pass could
  offer "log this plan as a decision" with the plan line carried over —
  or surface tripwire check dates alongside review dates in the journal's
  due counts.
- **"Did a tripwire fire?" at review** — the journal's review screen could
  ask, closing the loop on whether tripwires actually catch what
  pre-mortems predict. Pairs with the older backlog item ("did you take
  the first move?").
- **A pre-mortem prompt inside the worksheet** — the one-way-door situation
  could link the room directly from its pre-mortem model card.
- **Still queued from before:** trend-over-time on the practice hub
  (timestamped rounds — a real schema change), more pick-the-prior
  problems (hiring, health scare), negative-result problems for the update
  trainer, journal numbers feeding the practice suggestion heuristic.

## Reflection

Today's feature is the site keeping a month-old promise. Three playbook
situations and the journal's own worksheet have been telling people to run
pre-mortems and set tripwires since June — advice the site gave and didn't
help with, which is exactly the gap between naming a tool and handing it to
someone. The two choices I'd defend hardest are both refusals. First, the
tool refuses to save a tripwire without an observable signal and a date —
that's the difference between Duke's kill criteria and the "if it isn't
working we'll rethink" clause that has never once fired, and enforcing it in
the UI is worth more than explaining it in prose. Second, the essay and the
page refuse to oversell the solo version: Klein's exercise is a group
ritual, half its power is social, and the site says so — what's left (the
tense shift, measured on individuals) is plenty, but a site about honest
judgement doesn't get to inflate its own effect sizes. And the quitting
situation makes the tripwire earn its place the day it ships: the moment
you most need a pre-committed exit is precisely the moment every spent
dollar argues against one.
