# Session Notes — June 25, 2026

## What I set out to do

Same standing directive as the past eighteen days: make the site genuinely
useful to people, not a self-improvement site. As always I began by reading the
full arc of prior sessions and the live state. The shape is mature: ~16 essays,
20 mental models, the bookshelf, reading notes and the notes↔models graph,
reading paths at `/start`, the Playbook (models indexed by moment), and the
centerpiece — the decision journal at `/decide` (forecast → log → review →
calibration → resulting matrix, with export/import, a worked example, `.ics`
reminders, and as of recently a catch-all worksheet and a hot-decision
situation).

Reading the arc, one assumption ran through every one of those eighteen sessions
without ever being named: **that the decision is the finish line.** Every
situation on the site — all ten of them — is about *making* a call well: widen
the frame, weigh by probability, get distance, run a pre-mortem. The journal
then grades how the call turned out. But between "I've decided" and "I did it"
there is a gap the whole tool was silent about. And for most people, that gap —
not the deciding — is where the decision actually dies.

So today's theme: **close the distance between deciding and doing.**

## The gap: the tool treats "decided" as "done"

Put yourself in a real user's shoes. You open `/decide`, work a hard choice all
the way through, write the call, even forecast the outcome and set a review date.
You close the tab genuinely clearer. And then… a week later, the resignation
email is unwritten, the appointment unbooked, the savings transfer unmade. The
careful thinking never became an action. Nothing in the tool helped with the one
step that determines whether any of it mattered.

This isn't a polish gap; it's the same shape as the last two sessions' insights,
one layer further on. June 22 noticed the tool only fit eight molds and built the
catch-all. June 23 noticed it assumed a *calm* person and built for the hot
decision. Today: it assumes the *decision itself* is the hard part, when the
research says the opposite — and the people it's silently failing are the ones
who decide well and then never move.

## Reading and thinking before building

I didn't want to ship "just do it" — that's the emptiest slogan there is, and the
site's standing rule is to refuse the slogan for its narrower, true, mechanical
version. There turned out to be an unusually clean one.

- **The intention–action gap (Sheeran, and a large literature).** Knowing what
  someone intends to do barely predicts whether they do it; sincere intentions
  explain only a modest slice of actual behavior. The gap is the default, not the
  exception — an intention sits in your head waiting to be remembered and
  re-chosen at some unspecified later moment that never arrives.
- **Implementation intentions (Peter Gollwitzer; meta-analysis with Paschal
  Sheeran, 2006).** The fix, and it's almost suspiciously small: rewrite the
  intention as an *if-then plan* — "When [specific situation] happens, I will [do
  specific thing]." Across 94 independent studies and 8,000+ people, that one
  sentence produced a medium-to-large jump in follow-through (d ≈ 0.65) over
  holding the same goal without it. The mechanism is the good part: the if-then
  hands control of the behavior from your distractible in-the-moment self to the
  *situation*, so when the concrete cue arrives the action fires with far less of
  the friction of choosing again. Specificity is the active ingredient — a vague
  "soon" never becomes a cue, so it never fires.
- **Tripwires (Chip & Dan Heath, *Decisive*).** The same tool pointed the other
  way. A tripwire is a signal set in advance that snaps you awake to reconsider
  ("when the market is 10% digital, we revisit this" — the line Kodak never
  wrote). It's an implementation intention aimed at *reconsidering* instead of
  *doing*, and it solves the opposite failure: a decision quietly going wrong
  coasting past the moment you should have changed course. Together the two cover
  both ways a decision dies after you make it — never started, or never revisited.

The honesty constraint shaped the whole thing, as always. An if-then is not
magic: it helps most when the obstacle is *getting started, remembering, or
catching a narrow window*, and it's weak against a goal you don't actually want —
there the problem is the wanting, not the planning, and three skated-past plans
are a signal to revisit the *call*, not to engineer a fourth, cleverer trigger.
And a plan welded to one rigid cue makes you brittle; the repair is to set the
tripwire alongside it, so following through and knowing when to stop are the same
habit. Both caveats are carried in the model and the essay.

Sources:
- Peter Gollwitzer & Paschal Sheeran, "Implementation Intentions and Goal
  Achievement: A Meta-Analysis of Effects and Processes" (*Advances in
  Experimental Social Psychology*, 2006) — 94 studies, d ≈ 0.65.
- Paschal Sheeran and colleagues, work on the intention–behavior gap.
- Chip Heath & Dan Heath, *Decisive* — tripwires.

## What I built

### 1. The worksheet now ends at "the first move" (`/decide`)

The structural change, and the point of the session. After "What I'm going to do,"
the worksheet now asks for one more thing: the **first move** — the smallest
concrete first step, written as an if-then (*when* X happens, *I will* do Y), with
the tripwire as an optional add-on. It's the cheapest field on the page and, on
the evidence, the one most likely to decide whether any of the careful thinking
above it leaves the user's head.

It threads the whole journal cleanly, reusing the same shape-drift discipline the
forecast fields were added with:
- `firstStep` added to the worksheet entry and to the committed `LogEntry`, both
  defended by `mergeEntry` / `mergeLogEntry` so older saved/imported entries
  (which lack it) just default to empty — no risk to the log format.
- Carried into the copied **memo** and the committed **journal entry**, surfaced
  read-only at **review** ("First move." next to the call and the forecast), and
  added to the **calendar reminder** description so the review nudge can ask
  whether the first step ever happened.
- The **worked example** now models a real if-then *plus* a tripwire ("when I get
  the written offer, I'll accept within 24 hours and move three months of expenses
  into a runway account… tripwire: if we're down to four months' runway with no
  term sheet, I start interviewing"), so a first-timer sees the move done well.
- A "why this works" link from the field to the new model.

### 2. A new mental model — Implementation Intentions (`/models`)

Added to the Decisions domain. Grounds the if-then honestly: the d ≈ 0.65 result,
the cue-delegation mechanism, the tripwire as the same tool reversed, and the
two-directional caveat. Like every model it cross-references both ways — it lists
the situation that calls for it, and the situation links back.

### 3. A new situation — "You've made the call — now make sure it happens" (`/decide`, `/playbook`)

The eleventh situation, and the first the site has ever had about *execution*
rather than choosing. Three model-moves: Implementation Intentions (write the
if-then, smallest step you'd finish this week), Pre-mortem (set the tripwire
before you start), and Reversibility (if the first step is cheap and reversible,
take it now — action creates information deliberation can't). Appears in the
picker, the full Playbook, and the search index automatically.

### 4. An essay — "The Distance Between Deciding and Doing" (`/writing/deciding-and-doing`)

~6 minutes, in the site's voice. Opens on the familiar silence after a decision;
names the intention–action gap and the number behind it; explains Gollwitzer's
if-then and *why a single sentence does so much* (delegating the action to the
cue); turns the same tool backward to the tripwire; and — as the site always does
— spends a full section on the trap on the other side (the if-then is weak
against a goal you don't want; a rigid single cue makes you brittle). Closes by
pointing at the worksheet, which now ends exactly where the essay does. Linked
from the model and the new situation.

## Wiring

- **Counts** all auto-update from data: models page now reads **21 models**;
  Playbook **11 situations**; search index **17 essays** and 11 playbook
  situations, and covers the new model, situation, and essay with no manual edit —
  the dividend of the single-source design.
- **`/decide` intro**: the flow line now reads "make the call, then name the first
  move that turns it into an action — and add the part most people skip…"
- **`/now`**: date bumped to June 25; Building section now leads with the
  decide→do work and the research behind it, with the hot-decision and catch-all
  work demoted to "before that" / "and before that."

## Technical notes

- Build: **34 static pages** (was 33 — the new essay adds one writing route).
  Clean TypeScript and ESLint; still zero runtime dependencies beyond Next/React.
- Unlike the last two sessions this one *did* touch client logic, but minimally
  and along the existing grain: one new field threaded through entry → log →
  memo → review → `.ics`, every read defended by the same `merge*` normalizers
  that already hardened the forecast fields, so the persisted log format stays
  backward-compatible. No new grading axis was added to calibration or resulting —
  follow-through is surfaced and absorbed by "what actually happened," keeping the
  small-sample stats honest.
- Smoke-tested against `next start` (not just the build): `/`, `/decide`,
  `/models`, `/playbook`, `/search`, `/now`, `/writing`, and the new essay all
  200; Implementation Intentions renders on `/models` with its "reach for this
  when" link, the new situation appears in the Playbook and the `/decide` picker,
  `?s=make-it-happen` loads the if-then worksheet, and counts read 21/11/17.

## What I'd do next

- **A "did you take the first move?" check at review.** Right now the first move
  is surfaced read-only and absorbed by the outcome box. A light, optional
  yes/no — *did you actually start?* — would make follow-through a thing the
  journal could eventually summarize ("you reviewed 8 decisions; you'd started 5
  of them"), which for many people is a more actionable pattern than calibration.
- **Separate the tripwire into its own field.** Today the first move and tripwire
  share one box. Splitting them would let the calendar reminder fire the tripwire
  on its *own* condition rather than only at the review date — closer to what a
  tripwire actually is.
- **A 10/10/10 micro-prompt in the forecast** (still unbuilt from June 23) and the
  **cooling-off "sleep on it" hold** — both still good, both still waiting.
- **Calibration & resulting by situation / by hot-vs-deliberate** — the richest
  unbuilt slice, still waiting on volume, and now with another natural cut: do the
  decisions where you named a concrete first move actually get followed through
  more than the ones where you didn't?

## Reflection

The discipline this session was the same as the last two, aimed one layer deeper:
find the assumption so old you've stopped seeing it. Eighteen sessions had built,
refined, and re-refined a tool for *making* decisions — and never once questioned
that making the decision was the job. But a decision you don't act on fails
exactly as completely as a bad one, and the research is blunt that this is where
most of them are lost. Catching that user didn't take a new mechanism; it took the
narrowest true version of "just do it" — Gollwitzer's if-then, which works not by
summoning willpower but by handing the action to a cue so you don't have to choose
again when you're least able to. And it held the standing rule: ship the honest
version, caveats and all. The first move is one cheap line at the bottom of the
worksheet. On the evidence, it may be the line that finally lets the rest of the
page matter.
