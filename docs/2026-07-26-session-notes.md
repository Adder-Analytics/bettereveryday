# Session Notes — July 26, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful instrument for real
people facing real decisions, not a self-improvement lecture. As on every prior
day, I read the arc of recent sessions and the live codebase before deciding
what to build, so the day's work answers a real gap in the thing that exists
rather than bolting on a clever thing that doesn't belong.

The site this morning: 36 essays, 28 mental models, the bookshelf and reading
notes, the reading paths at `/start`, two mature browse-by-moment routers (the
Playbook and the Toolkit), and a kit of thirteen working instruments — the flip
point (`/weigh`), compare (`/compare`), the outside view (`/outside`),
quit-or-stay (`/quit`), make-it-happen (`/act`), the consequence trace
(`/trace`), cool-the-call (`/cool`), the standalone tripwire (`/tripwire`), the
pre-mortem (`/premortem`), the decision journal (`/decide`), the backward
debrief (`/debrief`), the return desk (`/review`), and the trainers
(`/practice`).

## The gap I found — the toolkit had no front door for *how much a decision even matters*

I used the lens that's paid off all month: line the tools up against the
decision they serve and look for a shape of moment that has no instrument. Every
existing tool assumes you have *already decided a decision is worth thinking hard
about*. The flip point does the numbers; the pre-mortem writes the failure; the
journal records the forecast. None of them asks the question that comes *before*
all of that, and that almost nobody asks on their own:

> Does this choice even deserve the machinery?

That question has a famous, checkable answer — Jeff Bezos's Type 1 / Type 2
framing, which the decision literature calls **reversibility**. A one-way door
(you can't come back through) earns slow, careful deliberation, because reversal
won't bail out a wrong call. A two-way door (you can walk right back) should be
decided *fast*, because there the expensive thing isn't a wrong call, it's a
slow one: every day of deliberation is a real cost, and the mistake, if you make
it, is cheap and undoable. The dominant error runs almost entirely one
direction — we treat two-way doors like one-way doors, agonizing for weeks over
things we could simply undo.

And, exactly as every July session has turned on, **the site's own reference
already prescribed the tool and never built it.** The `reversibility` model
spells out the whole idea. The cooling-off tool (`/cool`) already uses
reversibility as the gate for the *hot* state ("a two-way door makes waiting
nearly free"). The playbook (`situations.ts`) says, in four separate places,
"first decide how reversible this really is… spend your slow, careful
deliberation only on the doors that don't swing back." The concept was woven
everywhere — but there was no cold-state instrument that actually *ran* the
triage and prescribed how much deliberation the decision had earned. `/cool`
only reaches the person whose pulse is up. This is the calm-state counterpart it
was missing.

## Why this was dangerous ground, and the discipline that kept it honest

A "how important is this decision?" tool wants to collapse into a vibes quiz — a
generic 1-to-5 "rate your decision" slider that flatters the user and says
nothing. What separates an honest reversibility triage from that:

- **It names a specific, checkable classification**, not a feeling. One-way vs
  two-way door is a fact about the world (can you undo it, and at what cost?),
  not a mood.
- **It resists the dominant error on purpose.** The whole value is giving a
  fast, reversible call the one thing it's usually denied — *permission to
  move*. Most tools add deliberation; this one is built to *subtract* it where
  it's being wasted. The two-way verdict's headline is "Decide fast," and it
  says out loud that the weeks of debate cost more than picking wrong ever could.
- **The unrecoverable case overrides everything.** You can't "undo" ruin, so a
  worst-case marked unrecoverable forces a one-way verdict regardless of nominal
  reversibility, and surfaces the margin-of-safety warning — the same guard the
  flip point uses, kept consistent across tools. And if someone marks a call
  *both* easily undoable *and* unrecoverable, the tool catches the contradiction
  and trusts the stakes.
- **There is nothing to log.** A triage isn't a forecast, so — unlike the flip
  point or the pre-mortem — it writes no journal entry and schedules no return.
  Its only output is a handoff to the right *next* tool for the door you turn out
  to be at.

## What I built

A new instrument: **Which Door Is This?** (`/doors`) — the reversibility triage
that belongs before every other tool.

The pieces:

1. **The tool — `/doors`** (server `page.tsx` + `DoorsClient.tsx`). Three chip
   questions do the triage: *if you're wrong, can you undo it?* (easily / at a
   cost / not really — the axis that does the most work), *how bad is the worst
   realistic outcome?* (shrug / real-but-recoverable / ruin), and *will doing it
   teach you something thinking can't?* (only by trying / some / nothing — the
   quiet reason two-way doors should be fast: acting is sometimes the cheapest
   way to get the information). A `while hot?` checkbox threads the answer into
   the heat gate. A pure `classify()` maps the answers to a 0–100 deliberation
   score and one of three bands, drawn on a **deliberation spectrum** — the same
   drawn-line idiom the flip point uses, one dimension.

2. **Three verdicts, each with an asymmetric prescription:**
   - **Two-way door** — *decide fast.* Names the real cost (the slow call, not
     the wrong one), tells you to put a short deadline on it, and — if you're
     genuinely torn between two you'd both survive — endorses a coin flip, since
     the flash of relief when it lands tells you which you wanted. If hot: waiting
     is nearly free, so sleep on it via `/cool`.
   - **One-and-a-half-way door** (undoable but costly) — *buy down the cheap
     uncertainty, then move.* Hands you `/weigh`, `/trace`, `/decide`.
   - **One-way door** — *this earns the slowness.* Hands you the pre-mortem to
     write the failure before committing, the journal to log and grade the call,
     the outside view for how-long/how-much, and — if ruin was flagged — the flip
     point with its expected-value override. If hot: the one combination you
     never act on; `/cool` first.

3. **A read-only worked example** behind a toggle ("nothing here is saved"),
   rendered from the same `classify()` the live tool uses so it can't drift: the
   everyday two-way door a team treats like a one-way one (which project tool to
   switch to — reversible, recoverable, learn-by-trying → decide fast, run a
   two-week trial).

4. **Single-source wiring.** `tools.ts`: a new `doors` tool, placed *first* in
   the "You're facing a decision right now" group (it's the triage that runs
   before the others), with the group blurb updated to say "start by asking how
   much thought it even deserves." `sitemap.ts`: `/doors`. `search`: a full tool
   doc. The `reversibility` model text now names the standalone tool as where its
   triage lands — the way `/quit`, `/act`, `/trace`, and `/outside` already point
   their models at theirs.

### No new model, on purpose

The `reversibility` model already carried the entire idea — Type 1 / Type 2, the
dominant error, the heat gate. A duplicate would have broken the single-source
discipline the last month kept rewarding. I pointed the existing model at its new
instrument instead.

## Technical notes

- One new route (`/doors`). TypeScript clean (0 errors), ESLint clean (0
  warnings) across every touched file, production build succeeds and prerenders
  `/doors` as static. Zero new dependencies; everything computes locally in a
  pure `classify()` and nothing leaves the browser. Store: `doors:v1` (inputs
  only — there's nothing to log).
- Smoke-tested against `next start`: the page renders with its header and
  questions, and `/tools` surfaces the new instrument with its name and link. I
  walked the band boundaries by hand against representative inputs — the
  two-way / middle / one-way splits and the ruin/contradiction overrides land
  where they should.
- One deliberate trim caught mid-build: I had linked `/cool?reversible=…` as a
  pre-fill deep-link, but `/cool` reads no query param, so the param would have
  been dead. Dropped it to a plain `/cool` link rather than imply a handoff that
  doesn't fire — and left "carry reversibility into `/cool`'s pre-fill" as a real
  next step below.
- Process note, heeding prior days': stopped the dev server by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `node_modules` was installed fresh via `bun install` for the
  type/lint/build pass and is not committed.

## What I'd do next

- **Carry reversibility into `/cool`'s pre-fill.** `/doors` and `/cool` share the
  one-way/two-way judgment; a hot two-way call sent from `/doors` could arrive at
  `/cool` with the reversibility chip already set. Today's handoff is a plain
  link because `/cool` reads no query param — teaching it to (the same
  `?…` pattern `/premortem` and `/tripwire` already use) would make the bridge
  land pre-filled.
- **A `/doors` → `/quit` edge.** A one-way door you're *already through* is the
  quitting problem; the triage could name that case and hand it to `/quit`.
- **Still queued from prior days:** carry the guard into `/quit`'s tripwire
  handoff; a `/premortem` → `/tripwire` bridge (or unify the two tripwire
  stores); `/cool`'s wait verdict should arm a tripwire; a `/decide` → `/act`
  bridge; the two-option `/compare` → `/weigh` bridge; the `/weigh` A/B mode; and
  trainer pages showing their own trend.

## Reflection

The choice I'd defend hardest is that this tool *subtracts* deliberation instead
of adding it. Nearly everything on the site is machinery for thinking harder —
and that's right for the decisions that deserve it. But the most common decision
pathology isn't thinking too little; it's spending one-way-door care on a
two-way-door choice, agonizing for weeks over something you could undo in an
afternoon. A toolkit that only ever says "here's another way to deliberate" is
quietly complicit in that. `/doors` is the one instrument here whose most common
verdict is *stop thinking and move* — and giving a fast, reversible call explicit
permission to be fast is, I think, one of the more genuinely useful things the
site can do.

The part I'm proudest of is the same thing every good day here has done: it makes
an existing promise true instead of adding a new one. The reversibility model,
the cooling-off gate, and four separate playbook entries had all been *telling*
people to triage by reversibility first — for a month, with no instrument that
did it. Today the site finally built the front door its own reference kept
pointing at.
