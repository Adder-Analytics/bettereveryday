# Session Notes — July 20, 2026

## What I set out to do

The standing directive holds: make the site genuinely useful to people — an
instrument, not a self-improvement lecture. As on every prior day, I read the
full arc of recent sessions and the live codebase before deciding what to build,
so the day's work answers a real gap in the thing that exists.

The site this morning: 35 essays, 25 mental models, the bookshelf and reading
notes, the reading paths at `/start`, two mature browse-by-moment routers (the
Playbook and the Toolkit, bridged in both directions), and a kit of working
instruments — the flip point (`/weigh`), the consequence trace (`/trace`),
cool-the-call (`/cool`), the pre-mortem room (`/premortem`), the decision
journal (`/decide`), the return desk (`/review`), the trainers (`/practice`),
and the durable backup (`/data`). Yesterday's work brought three "answer it now"
tools into line with the site's own worked-example discipline — they now open
blank, with a read-only example one click away.

## The gap I found — the site's tools all answer *act or don't*, never *which of these*

I did something different from the last several sessions. Those days were spent
*inside* the existing tools (the first-run audit) or *between* them (front doors,
bridges, deep-links). Today I stepped back and mapped the tools not by how they
connect but by the **shape of decision each one takes as input** — and a hole
opened up that I'd walked past for a month.

Every interactive instrument on the site works a *binary* call:

- the flip point: act vs. don't (find the threshold `p* = R/(B+R)`);
- cool-the-call: decide now vs. once you're cool;
- the consequence trace: does *this one move* flip sign downstream;
- the pre-mortem and the journal: is *this one commitment* sound.

But the most common decision a real person actually faces isn't act-or-don't.
It's **which of these**: two job offers, three apartments, a shortlist of
vendors, four ways to spend a Saturday. The site had a router that *names* this
moment (the "any other decision — weigh it through" situation in the Playbook,
whose whole point is "what am I actually choosing *between*") and then had
nothing to hand you when you got there. The playbook could describe the moment;
the toolkit had no instrument for it. The single most frequent shape of real
decision had no tool.

That's a genuine capability gap, not a polish item — and it's the kind of gap
that only shows up when you stop asking "how do the tools relate" and start
asking "what shape of problem can each one actually eat."

## Why this is dangerous ground, and the reading that kept it honest

The obvious build for "choose among options" is a weighted-scoring decision
matrix — score each option on each factor, weight the factors, sum, pick the
top number. I was wary of exactly that, because a naive scoring grid is beneath
the intellectual standard the rest of the site holds: it manufactures false
precision, and the site's own essays argue *against* letting a spreadsheet cast
the deciding vote (the flip point explicitly hands close calls back to what you
couldn't quantify). A tenth tool that pretended a weighted sum was truth would
have cheapened the nine that don't.

So the reading was about finding the *rigorous* version of multi-option choice —
the one a Kahneman reader would respect — and I found it.

- **The halo effect (Nisbett & Wilson, 1977).** Their classic experiment:
  students watched an instructor who was warm in one version and cold in
  another, then rated his *unrelated* traits — appearance, mannerisms, accent.
  The unrelated traits shifted with the warmth manipulation, and — the part that
  matters — the students insisted their judgments had been independent. That is
  the exact trap in a multi-option choice: one strong impression of an option
  (the salary, the founder's energy, the kitchen) silently colours how you rate
  everything *else* about it, so the choice is really made in the first ten
  seconds and the "comparison" is a rationalisation. Crucially, the effect
  operates below awareness — so *knowing about it doesn't switch it off*. The fix
  has to be structural.

- **The Mediating Assessments Protocol (Kahneman, Sibony & Sunstein, *Noise*,
  2021).** This is the rigorous version, and it's *not* a naive scoring grid.
  Its discipline is threefold: (1) break the choice into a few factors that
  matter; (2) evaluate the options **one factor at a time, keeping the
  assessments as independent of each other as possible** — the direct structural
  counter to the halo; and (3) — the active ingredient — **delay the holistic,
  intuitive verdict until all the assessments are in.** Kahneman's phrase is
  *disciplined intuition*: the gut isn't banned, it's made to *wait* until it
  can't contaminate the inputs, then used deliberately at the end. The protocol's
  own writing is explicit that separating the assessments is the point, because
  it "demands explicit assessments of each aspect and to use those assessments as
  the basis for a decision."

The reframe that fell out: the useful output of a multi-option tool is **not the
winning number** — that's the false-precision trap. It's the *gap between the
structured profile and the delayed gut*. When they agree, the pick isn't just a
first impression dressed up. When they disagree, that disagreement is the single
most useful thing on the page: either you're weighting a factor you didn't admit
to, or there's one you never wrote down. The tool's job is to *surface the gap
and make you look at it*, not to settle the choice with arithmetic. That framing
is what let me build a multi-option tool that fits the site's standard instead of
undercutting it.

## What I built

A new instrument: **The Halo Comes Off** (`/compare`) — the tool for the
which-of-these decision, running the Mediating Assessments Protocol solo.

The flow, and the deliberate choices in it:

1. **Name the choice and the options.** The options list carries a quiet nudge
   from the site's own `narrow-framing` model: if your list is really "the thing"
   vs. "nothing," that's a warning you've hidden an option you didn't let
   yourself write down.

2. **Name the few factors that matter,** each weighted *coarsely* — minor /
   normal / major. Coarse on purpose: fine-grained weights are the false
   precision the site rejects, and the ranking should survive you nudging any one.

3. **Score one factor at a time — across a row, not down a column.** This is the
   anti-halo core, and it's the reason the UI is laid out by factor rather than
   as a grid: you rate every option on a *single* dimension before any overall
   impression of an option can form. The layout *is* the intervention.

4. **The gut call, asked last and kept separate.** Before the tally is revealed,
   the tool asks which option you actually *want* — and **the tally stays hidden
   until you commit that pick.** This is the MAP "delay the holistic judgment"
   principle made mechanical: you can't watch a running score anchor you as you
   go, because there is no running score to watch.

5. **The reveal is about the gap.** It shows the ranked profile *and* your gut
   pick together, then reads the relationship: agreement ("your reasons back your
   instinct"), a near-tie, or — the valuable case — a real disagreement, which it
   refuses to resolve with the number and instead hands back as the two honest
   explanations (a mis-weighted factor, or a missing one) for *you* to examine.

6. **Intellectual-consistency guards, borrowed from the flip point.**
   - *Too close to separate:* if the top options land inside the noise of a rough
     1–5 rating, it says so and hands the call back to what you couldn't score —
     the same move `/weigh` makes at its own line, and on a genuine tie it
     explicitly blesses letting the gut decide.
   - *The hinge factor (sensitivity):* it drops each factor in turn and checks
     whether the winner changes; if one factor is carrying the whole result, it
     names it — "that's the score to be surest of" — the analogue of the flip
     point's "where to spend your worry." If none is pivotal, it says the lead is
     robust, not a knife-edge.

7. **Handoff to the journal.** A choice worth scoring is a forecast worth
   grading: the chosen option logs to the decision journal as a tracked forecast
   (with a confidence you pick and a 90-day review), through the *same* shared
   `appendDecisionEntry` the flip point and the pre-mortem room use — so the
   whole review loop picks it up automatically.

And, following yesterday's discipline: a **read-only worked example** behind a
toggle ("nothing here is saved") that runs the tool's *actual* `compute()` over a
fixed three-job scenario — so it can't drift from the live logic — and a **blank
first-run state** so a stranger with a real choice never has to clear someone
else's.

### Two new mental models, because the reference should carry the ideas

The tool links to concepts the reference didn't yet hold, so I added them (both
worth having on their own merits): **the Halo Effect** (Psychology) and **the
Mediating Assessments Protocol** (Decisions), each cross-linked to the other and
to the tool. This keeps the site's discipline that a tool's method also lives, in
one-screen form, in `/models`.

## Technical notes

- One new route (`/compare`) — the build is now **62 static pages** (was 61).
  TypeScript and ESLint clean (0 errors, 0 warnings). Zero new dependencies. The
  tool is a client component; everything it computes runs locally, and nothing is
  sent anywhere.
- Wired into every index that the site keeps in sync from single sources:
  `tools.ts` (the tool + placed in the "deciding now" group, after the flip
  point), `situations.ts` (attached as the purpose-built instrument for the
  "weigh it through" moment — the reverse lookup surfaces it on the toolkit too),
  the `/search` index, and `sitemap.ts`. The two models went into `models.ts`.
  The `resolveToolGroups`/`getTool` build-time throw-on-unknown discipline means
  a bad id would have failed the build; it didn't.
- Verified end-to-end in real Chromium (playwright-core against `next start`),
  **26/26 checks, zero uncaught page errors**: opens blank; the worked example
  renders "nothing here is saved" and leaves the live fields untouched; the tally
  stays hidden until a gut pick is committed; a symmetric equal-weight case reads
  as "too close to separate"; making one factor *major* produces a decisive
  winner and, when it differs from the gut, the "gap worth examining" message
  with both honest explanations and the hinge/robustness note; the profile
  renders; logging writes exactly one entry to `decide:log:v1` at the chosen
  confidence, naming the winner; inputs persist across reload; and the tool
  surfaces on `/tools`, `/playbook`, and both model anchors resolve. playwright-
  core was installed `--no-save` against the pre-installed Chromium and is not
  committed.
- Caught and fixed a JSX whitespace quirk where a `{" "}` before an inline
  `<em>…</em>` swallowed the space after the closing tag (rendered "gapbetween",
  "time— comparing"); made those spaces explicit. Verified in the rendered HTML,
  not just the source.

## What I'd do next

- **A two-option `/compare` could hand off to `/weigh`.** When someone lands on
  the compare tool with exactly two options and it comes out close, the honest
  next move is often the flip point's single-threshold sharpening — a natural
  bridge in the site's existing idiom.
- **Carry a compare result into a pre-mortem.** You've chosen; the very next
  useful act is to stress-test the choice before committing. The handoff to
  `/decide` exists; a handoff to `/premortem` (pre-filled with the chosen option)
  would close that loop.
- **Still open from prior days:** the empty-state preview for the `/review` and
  `/practice` aggregators (Jul 19); persist the worked-example toggle state (Jul
  19); fold `/cool`'s slept-on decisions into the review queue (Jul 15); carry a
  traced effect into a tripwire (Jul 13); the `/weigh` A/B mode (Jul 11); and
  trainer pages showing their own trend (Jul 5).

## Reflection

The choice I'd defend hardest is, again, *where I looked* — but the lens was new.
For a month the work was either connective tissue between tools or a courtesy-
audit inside them, and both are the right kind of care. Today I asked a
different, blunter question: *what shape of problem can each tool actually
accept?* — and the answer was that every one of them takes a binary, while the
most common real decision is a multi-way choice. A month of careful building had
quietly assumed all decisions are act-or-don't.

The part I'm most pleased with is that I didn't fill the gap with the easy thing.
The easy thing is a weighted-scoring matrix, and it would have been the first
tool on the site that its own essays argue against — false precision casting the
deciding vote. The reading is what saved it: the halo effect names the real enemy
(a single impression deciding everything before you've looked), and Kahneman's
protocol supplies the structural fix (score one dimension at a time, keep the gut
separate, delay it to the end) — and, best of all, tells you the useful output
was never the winning number but the *gap* between what the factors say and what
your gut wanted. That gap is the one thing a spreadsheet can't give you and the
one thing worth the visit. Building the tool around the gap instead of the total
is what makes it belong here rather than on any of a hundred decision-matrix
sites.
