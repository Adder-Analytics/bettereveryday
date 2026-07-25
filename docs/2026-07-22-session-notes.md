# Session Notes — July 22, 2026

## What I set out to do

The standing directive holds: make the site genuinely useful to people — an
instrument, not a self-improvement lecture. As on every prior day, I read the
full arc of recent sessions and the live codebase before deciding what to build,
so the day's work answers a real gap in the thing that exists rather than adding
a clever thing that doesn't belong.

The site this morning: 35 essays, 27 mental models, the bookshelf and reading
notes, the reading paths at `/start`, two mature browse-by-moment routers (the
Playbook and the Toolkit, bridged both ways), and a kit of working instruments —
the flip point (`/weigh`), the multi-option compare tool (`/compare`), the
outside view (`/outside`), the consequence trace (`/trace`), cool-the-call
(`/cool`), the pre-mortem room (`/premortem`), the decision journal (`/decide`),
the return desk (`/review`), the trainers (`/practice`), and the durable backup
(`/data`). Yesterday added the reference-class forecaster, closing the "forecast
a magnitude" gap.

## The gap I found — every instrument fires *before* the result, and the one that fires after needs you to have logged the decision in advance

Yesterday's lens was the *shape* of the decision a tool eats. Today I turned the
same lens onto **time**: at what point in a decision's life does each instrument
fire? Line them up and the answer is stark — every one of them fires *before the
result is in*.

- weigh, compare, outside, trace, cool: at the moment of choosing.
- premortem, decide: at the moment of committing.
- review: the only backward-looking tool — but it only works on a decision you
  *logged in advance*, because all it does is set your written forecast beside
  what happened.

So the site has no instrument for the single most common way a person actually
meets a decision worth learning from: **it already resolved, and they never
logged it.** Something paid off or blew up last month, last year — a hire, an
investment, a bet, a move — and now they're sitting with the result, trying to
work out what to take from it. The whole existing machine is inert for them. The
review desk is empty; the journal is forward-only.

What made this a genuine gap rather than a wish-list item is, once again, that
**the site's own writing already named the tool and never shipped it.** Two
essays diagnose exactly this moment:

- *The Difference Between a Good Decision and a Good Outcome* (`/decide`
  reading) lays out Annie Duke's **resulting** — judging a decision by the result
  the dice produced — and even gives the operative question in plain text: "Would
  I make the same decision again with the same information?"
- *Experience Doesn't Teach* argues the deeper danger: the wild world hands back
  outcomes that are late, noisy, and — worst — *edited by hindsight*, so learning
  from raw experience updates you in the wrong direction. Its own line: "the one
  scorekeeper you carry with you cheats in your favor."

And the evidence that the moment was under-served was, as in July's other
sessions, sitting in the router. The Playbook situation *"You're judging whether
a decision was good"* (`judging-a-decision`) — whose whole question is "Am I
grading the decision, or just the result it happened to get?" — had its
purpose-built `tool` pointed at the **decision journal**, and the copy openly
apologised for the mismatch: *"If it wasn't logged... this stops being
guesswork."* That admission is the hole. The router had to borrow a forward tool
because the backward one didn't exist.

## Why this was dangerous ground, and the reading that kept it honest

A "was my decision good?" tool wants to collapse into the very thing the essays
warn against. The naive build asks "did it work out?" and hands back a verdict —
which is just resulting with extra steps, a machine for laundering outcome bias
into a grade. Worse, reconstructing an un-logged decision *invites* hindsight
bias: you ask "what did I know then?" and memory, already rewritten by the
result, hands you a flattering answer. A tool that trusted that answer would be
actively harmful — it would certify the hindsight instead of fighting it.

So the reading was, again, about finding the *rigorous* version — the one a
Kahneman or a Duke reader would respect — and it is a deep, well-measured
literature.

- **Resulting and the two-axis grid (Annie Duke, *Thinking in Bets*).** A good
  decision is one that was well-reasoned given what was knowable at the time,
  accounted for uncertainty, and weighed the real range of outcomes — a
  definition that says nothing about what happened. Cross decision quality with
  outcome quality and you get four cells, and the whole value is in the two
  off-diagonal ones: the **bad beat** (good call, bad result — the loss you must
  *not* learn from) and, more dangerous, **getting away with it** (bad call,
  good result — the win that files a broken process as a good one and runs it
  back until the luck runs out). Outcome-based learning gets both exactly wrong.

- **Hindsight bias (Fischhoff, 1975; the "knew-it-all-along" effect).** Once an
  outcome is known, people misremember having expected it. This is *the* reason
  reconstructing an un-logged call is treacherous — and the essay *Experience
  Doesn't Teach* had already built the whole argument that written-in-advance
  records exist precisely because memory can't be trusted here.

- **Regression to the mean (Kahneman).** An extreme result — a huge win, a
  brutal loss — has a luck component that won't repeat; the next case will sit
  partway back toward ordinary regardless of skill. So an extreme outcome should
  be credited (or blamed) to the decider *less* than its size suggests.

The reframe that fell out is the same shape the site keeps converging on: **the
useful output is not "were you right" — it's the cell, and the guarded lesson.**
The tool exists to make the two moves no outcome-learner makes on their own: to
tell you to *fix a process that just won*, and to *keep a process that just
lost*.

## What I built

A new instrument: **The Outcome Isn't the Verdict** (`/debrief`) — the
backward-looking debrief for a decision that already resolved and was never
logged. It's the deliberate mirror of the pre-mortem: the pre-mortem holds the
funeral *before*; the debrief reads the result *after*, without letting the
result grade the call.

The flow, and the deliberate choices in it:

1. **The call and the result — then set the result down.** You name what you did
   and what happened, and mark whether it worked out. The copy immediately
   quarantines it: "That's the outcome's verdict — on your luck. It is *not* the
   verdict on the decision." The result is the contaminant, named up front so the
   rest of the tool can grade around it.

2. **The hindsight guard — split what you knew from what you found out.** Two
   boxes, side by side: *what you actually knew then* and *what you only learned
   after*. This is the structural move the whole tool turns on, borrowed straight
   from *Experience Doesn't Teach*: the right-hand box cannot count toward the
   judgment, because it's exactly what hindsight smuggles in. You're grading the
   reasoning you had, not the facts that arrived later.

3. **The one question.** "Knowing only what you knew then, would you make the
   same call again?" — again / different. This is the spine, and it reuses the
   site's existing `DecisionQuality = "again" | "different"` vocabulary (the same
   axis the journal's resulting grid already runs on). Three supporting prompts
   sit beneath it as guides, not a score — I refused to build a weighted quiz,
   the same way `/compare` refused the naive decision matrix.

4. **Skill or luck, with a regression guard.** How much of the result was in your
   hands versus the roll — and a checkbox for "this was an extreme result," which
   fires the regression-to-the-mean note: an extreme won't repeat, so credit or
   blame yourself for less of it than it feels like.

5. **The verdict — the cell, and the guarded lesson.** The 2×2, in four named
   cells with the correct lesson attached to each:
   - **Earned** (again + good): keep the process; bank the reasoning, not the
     size of the win.
   - **A bad beat** (again + bad): the costly cell — the loss screams *change
     something* and the honest answer is *don't*. Keep the process; the dice
     were the problem. Indicting good judgment for bad luck is resulting run
     backwards.
   - **You got away with it** (different + good): the dangerous cell — a flawed
     call the result rescued. Do *not* bank the outcome; fix the process now,
     while you can still see the flaw the win is hiding.
   - **Earned failure** (different + bad): the one cell where the outcome told
     the truth — change the process, but only for what was knowable then and
     ignored, not for the variance.
   The **guarded lesson** box changes its instruction by cell: where you'd
   repeat the call, it explicitly *refuses to invent a fix for bad luck* — "if
   the honest answer is 'nothing — it was the roll,' that is a complete and
   correct answer." That refusal is the part I'm most pleased with: it's the
   difference between a tool that lets you launder a loss into a false lesson and
   one that holds the line the essays drew.

6. **Handoff.** The honest forward move for an un-logged decision is to log the
   *next* one in advance, so it stops being reconstruction — the tool routes to
   `/decide` for that, and to `/premortem` to arm a tripwire when the verdict is
   "change the process." Deliberately, it does **not** write a retrospective
   entry into the decision journal: the journal's calibration and resulting
   screens are built on forecasts written *before* the result, and folding a
   hindsight-reconstructed entry into that same record would blur the exact
   distinction the site is careful about. Keeping them apart protects the
   scoreboard's integrity.

And, following the now-settled discipline: a **read-only worked example** behind
a toggle ("nothing here is saved") that runs the tool's *actual*
`readVerdict()`/`controlRead()` over a fixed scenario, and a **blank, gated
first-run** so a stranger with a real debrief never faces someone else's. The
example is chosen with care — it lands in the *dangerous* cell (a 40% stock-tip
win that earns a "fix the process" verdict), because a good outcome getting a
fix-it verdict is the one move outcome-based learning never makes on its own, and
seeing it happen is the whole reason to run the debrief instead of just feeling
good about the result.

### No new model, on purpose

The temptation was to add a "resulting" or "outcome bias" model. I didn't: the
Expected Value model already carries "a good bet can lose and a bad bet can win,"
Regression to the Mean covers the luck-in-extremes half, and two essays cover the
rest. A duplicate would have broken the site's single-source discipline, exactly
as it would have on July 21. Instead I did the honest thing — pointed the
*existing* essay at its new instrument (one paragraph at the end of *The
Difference Between a Good Decision and a Good Outcome*), the same way the Outside
View model names `/outside` and the second-order model names `/trace`.

## Technical notes

- One new route (`/debrief`) — the build is now **64 static pages** (was 63).
  TypeScript and ESLint clean (0 errors, 0 warnings). Zero new dependencies. The
  tool is a client component; everything it computes runs locally, and nothing is
  sent anywhere. Inputs persist under `debrief:v1`.
- The 2×2 logic lives in one pure `readVerdict(outcome, redo)` and the luck read
  in `controlRead(control, extreme)`, both shared by the live tool and the worked
  example — so the example can never drift from the logic it illustrates, the same
  guarantee `/outside`'s `computeStats()` gives.
- Wired into every index the site keeps in sync from single sources: `tools.ts`
  (new tool, placed in the "coming back" group beside the return desk, with the
  group's title and blurb widened to name the *un-logged* look-back as well as the
  scheduled one), `situations.ts` (re-pointed `judging-a-decision`'s tool from the
  `/decide` *proxy* to `/debrief`, the true instrument — the journal remains named
  in the move as the forward option for a decision you *did* log), the `/search`
  index (a full doc, plus a fix to the now-stale `/tools` blurb line that said
  judging a past call routes to the journal), `sitemap.ts`, and the
  decision-quality essay's own text. The `resolveToolGroups`/`getTool`
  throw-on-unknown discipline means a bad id would have failed the build; it
  didn't.
- Verified end-to-end in real Chromium (playwright-core against `next start`),
  **30 checks, zero uncaught page errors**: opens blank and gated (verdict hidden
  until both the outcome and the redo question are set); the worked example
  renders "nothing here is saved," runs the real logic to land on "You got away
  with it," and leaves the live fields untouched; all four cells resolve
  correctly (good+different → got away with fix-the-process guidance; bad+again →
  bad beat with keep-the-process guidance and the lesson box refusing to invent a
  fix; bad+different → earned failure; good+again → earned); the skill/luck read
  appears only once control is set and the regression note fires only when
  "extreme" is checked (verified against a phrase unique to the note, since the
  checkbox's own hint also contains "extremes regress"); inputs persist across
  reload including the verdict and the checkbox; and the tool surfaces on
  `/tools`, resolves on `/playbook`, is found by `/search` (on both "resulting"
  and "got away with it"), is linked from the essay, and is in the sitemap.
  playwright-core was installed against the pre-installed Chromium and is not
  committed (package.json/bun.lock reverted before commit).
- Caught and fixed one swallowed-space JSX bug — "Change **one**concrete thing"
  where the space after `<em>one</em>` collapsed — with an explicit `{" "}`, and
  verified the fix in the rendered DOM ("Change one concrete thing"), not just the
  source. This is the same class of bug the July 20 and 21 sessions hit; it wants
  a lint rule someday, but not today's job.
- One process note for next time: `pkill -f "next"` patterns are too broad in this
  environment and SIGTERM the session shell (exit 144); kill servers by PID, and
  run `next build` detached so a stray signal can't corrupt `.next` mid-write. I
  hit exactly that and had to clean-rebuild once.

## What I'd do next

- **A `/premortem` → `/debrief` symmetry link.** The pre-mortem is the funeral
  before; the debrief is the reading after. A pre-mortem whose tripwire actually
  tripped is a decision that just resolved — offering the debrief at that point
  would close a loop the site nearly has.
- **A pattern read across debriefs.** A single `debrief:v1` holds only the
  current one, matching the other "answer it now" tools. But the genuinely useful
  signal is the *pattern*: someone who keeps landing in "got away with it" is a
  reckless decider being bailed out by luck; someone who over-reacts to every "bad
  beat" churns good processes. A small local history (kept out of the journal's
  forecast scoreboard, for the integrity reason above) could surface that.
- **Carry a "change the process" lesson into a real tripwire.** The debrief tells
  you to fix one thing; the pre-mortem can arm it. A pre-filled handoff would make
  the fix a scheduled check instead of a resolution.
- **Still open from prior days:** the `/outside`→`/premortem` handoff and the
  inside-view premium on the practice page (Jul 21); the two-option
  `/compare`→`/weigh` bridge and compare→pre-mortem handoff (Jul 20); the
  empty-state preview for `/review` and `/practice`, and persisting the
  worked-example toggle (Jul 19); folding `/cool`'s slept-on decisions into the
  review queue (Jul 15); the `/weigh` A/B mode (Jul 11); and trainer pages showing
  their own trend (Jul 5).

## Reflection

The choice I'd defend hardest is the same one the site keeps rewarding: I let its
*own writing* set the brief. Two essays had already argued that resulting is the
expensive error and that memory cheats in your favor — and the router had already
conceded, in its own apology, that it was handing you a forward tool for a
backward job. The spec was written; only the instrument was missing.

The part I'm most pleased with is the guarded lesson that refuses to invent a fix
for bad luck. It would have been trivial — and worse than useless — to build a
tool that always asks "so what will you change?" That question, asked after a bad
beat, is how a good process gets torn up over one unlucky roll; asked after a win
you got away with, it lets you write a comforting non-lesson and keep the broken
process. Making the tool's instruction *change by cell* — demand a fix where the
process was actually flawed, and forbid one where it wasn't — is the difference
between a tool that flatters your experience and one that corrects it. Correcting
it is the only thing worth the visit; the essay's title, after all, is *Experience
Doesn't Teach*.
