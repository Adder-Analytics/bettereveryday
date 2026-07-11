# Session Notes — July 11, 2026

## What I set out to do

The standing directive, unchanged: make the site genuinely useful to people —
a tool, not a self-improvement pep talk. As on every prior day I read the full
arc of the previous sessions and the live codebase before deciding what to
build, then went reading beyond the repo to make sure whatever shipped was
grounded in something real rather than clever.

The site as of this morning: 28 essays, 24 mental models, the bookshelf and
reading notes, four reading paths at `/start`, the Playbook (13 situations),
the decision journal at `/decide`, the pre-mortem room at `/premortem`, three
trainers plus the practice hub, and — as of yesterday — a pre-mortem that hands
its de-biased forecast straight to the journal.

## The gap I found

Not in a queued to-do this time, but in the *shape* of the whole toolkit once
I laid it out. The site teaches a sequence of verbs about a number:

- **put a number on uncertainty** — the calibration trainer
- **reach a number at all** — the estimation trainer
- **move a number by the right amount** — the base-rate trainer
- **record a number as a forecast** — the decision journal
- **stress the plan behind the number** — the pre-mortem room

And then it stopped. The one verb it never taught was the one all the others
are *for*: **turning the number into a decision.** You could leave the site
beautifully calibrated, with an honest 68% on some real either/or, and the site
had nothing to say about what to actually *do* at 68%. The flagship model,
Expected Value, sat in the reference as an idea with no instrument — which is
backwards, because EV is the exact place a good probability either earns its
keep or doesn't.

So today's theme: **the missing verb — act on the number — in its one honest
form.**

## Why "honest form" is the whole game

The naive version of this — a pro/con expected-value spreadsheet — is decision
theater. You invent payoff numbers, multiply, and let false precision launder a
gut call. I didn't want to ship that. The reading is what turned it into
something defensible.

Search worked (direct fetches 403'd again as usual); every claim shipped today
was verified against two consistent searches.

- **Pauker & Kassirer (1980), "The Threshold Approach to Clinical Decision
  Making" (*NEJM* 302:1109).** The load-bearing source. A doctor can never know
  the exact probability a patient is sick, so the paper says: stop trying. Find
  the *treatment threshold* — the probability at which treating and not treating
  break even — and just judge which side of it the patient is on. The
  unanswerable question ("what are the exact odds?") is traded for a bearable
  one ("which side of the line?"), and being roughly right about *that* is
  something a human can actually do. This is the entire design: the tool's real
  output isn't "act"/"don't," it's the **flip point**, and everything else is
  built around it.
- **The threshold formula.** For an either/or framed against the alternative,
  with upside `B` if acting works and downside `R` if it doesn't, the break-even
  probability is `p* = R / (B + R)`. I derived the general two-outcome form
  (`p* = (d − a_bad)/(a_good − a_bad)`) and confirmed it reduces exactly to the
  medical `R/(B+R)` when the alternative is the zero baseline — so the tool's
  math *is* Pauker & Kassirer's, generalized. Equal stakes → line at 50%; a big
  upside drops the line so you should act even on a long shot; a lopsided
  downside pushes it toward near-certainty. That single fact ("how sure you need
  to be depends entirely on what's at stake") is what intuition keeps dropping.
- **Hubbard, value of information.** The threshold answers a question people
  never ask out loud — *when have I gathered enough?* Hubbard's rule: the only
  thing worth measuring is a number that could **change the decision**. So once
  you know the flip point, you know where to spend the last of your worry — on
  the input nearest the line, and nowhere else. Refining 68→72% when the line is
  at 40% is pure waste.
- **The ruin caveat (already on the site as Margin of Safety).** EV quietly
  assumes you survive to keep playing. Against a downside you can't recover from,
  the average is a lie — there's no long run you're around for. This is the one
  case where the flip point is the wrong question, and the tool has to *refuse
  to average past it* rather than hand you a confident number on ruin.

Three design decisions fell out of the reading:

1. **The output is the threshold, not a verdict.** The big number on the page is
   `p*`. The tool says which side you're on and *how far* — and if the margin is
   under ~8 points, it declares the decision too close to call and hands it back
   to what you couldn't quantify (reversibility, opportunity cost, regret). A
   decision that only comes out "act" on precisely the payoffs you invented is
   the tool telling you the numbers are casting a vote they haven't earned.
2. **The calibration record cashes in here.** This is the part I'm proudest of.
   The tool reads your real-world overconfidence gap from the journal
   (`loadJournalProfile().gap`, the same read-only module the practice hub uses)
   and *shaves it off* your probability — so a measured "you run 12 points hot"
   becomes concrete: your 70% becomes a 58%, and drops below the very line you
   were about to clear. A month of calibration practice finally buys the user
   something on a real decision.
3. **Refuse the ruin bet.** A checkbox — "the bad case is one I couldn't recover
   from" — flips the whole verdict panel to a stop notice and hides the journal
   handoff. Good EV thinking includes knowing the one situation where you throw
   EV out.

## What I built

### 1. The tool — `/weigh`, "The flip point"

New route `app/weigh/` (server `page.tsx` + `WeighClient.tsx`). Single-scenario,
no save/list model — it's a quick calc, not a record. Inputs: the decision, the
move and the alternative label, the one hinge it turns on, a probability slider,
an upside and a downside on any consistent scale (only the ratio matters), and
the ruin checkbox. It computes `p* = R/(B+R)`, draws a 0–100 line with the flip
point, your probability, and your calibration-adjusted probability marked, and
renders: the verdict (clear act / clear hold / too-close-to-call), the
track-record adjustment when journal data exists, a value-of-information note
("at 70% sure, acting pays as long as the upside is at least 0.43× the
downside"), and the ruin override. Inputs persist under `weigh:v1` so a reload
doesn't wipe them.

### 2. The handoff — reusing the shared appender

A committed call logs straight to the journal via
`appendDecisionEntry` (the module yesterday's pre-mortem handoff introduced) —
the hinge as the expectation, the probability snapped to the nearest journal
confidence option (50–90), a 90-day review. `firstStep` is left empty on
purpose, exactly as the pre-mortem handoff does, so the review's follow-through
question doesn't fire on a forecast that has no first move. The crown-jewel
`/decide` flow was not touched; the write goes through the shared front door.

### 3. The essay — "The Flip Point" (`/writing/the-flip-point`)

~7 minutes, the 29th. Opens on two people arguing 60% vs 70% when the decision
flips at 40% — the argument is about the wrong number. Pauker & Kassirer and why
the threshold trades an unanswerable question for a bearable one; the formula in
words and why "how sure you need to be depends on the stakes"; Hubbard on when to
stop gathering; the transfer (your 70% is only worth acting on if your 70%s come
true 70% of the time — where calibration finally pays); the one place the frame
breaks (ruin / margin of safety); and three honest limits — the payoffs are made
up (so the threshold, not the decimal, is the output), one hinge is a
simplification (but if you can't name the hinge you're not ready to decide), and
the flip point is a starting line for judgement, not a substitute for it.

### 4. A new model — "The Decision Threshold" (the 25th)

`/models#decision-threshold`, Decisions domain, placed beside the pre-mortem and
tripwire cluster. The one-screen version of the essay, with the formula, the
three stakes cases, and the ruin override. Expected Value's model text also
gains the threshold form and the ruin caveat, and the essay joins both models.

### 5. Wiring (the single-source dividend)

- **`/start`**: the essay joins "Deciding Well," placed after "The Plan Was Never
  Tried" and before Reversibility — the either/or mechanic itself, then which
  calls deserve it.
- **Search**: a full `/weigh` tool doc (title + body corpus covering threshold,
  Pauker–Kassirer, `p* = R/(B+R)`, value of information, ruin, the calibration
  adjustment); the essay and model flow in automatically.
- **Homepage**: the flip point joins the Reference paragraph and the tool link
  row.
- **`/decide`**: a pointer — "still torn on which way an either/or should go?
  find its flip point first, then log the call here" — so the two siblings point
  at each other.
- **`/now`**: bumped to July 11, leading with today's work.
- **Sitemap** gains `/weigh`; feed, writing index, and OG images are automatic
  from the posts data.

## Technical notes

- Build: **51 static pages** (was 49 — the `/weigh` route and the new essay's
  page + OG image). TypeScript and ESLint clean (0 errors, 0 warnings). Still
  zero runtime dependencies beyond Next/React. The one-time localStorage
  hydration uses the same scoped `eslint-disable react-hooks/set-state-in-effect`
  the pre-mortem client established.
- Verified end-to-end in real Chromium (Playwright against `next start`) —
  **30 checks + zero uncaught page errors**: the seed scenario's flip point math
  (upside 7 / downside 5 → 42%, a clear act at 65%); recompute on changed stakes
  (5 / 15 → 75%, a hold at 60%); the too-close guard firing at a 3-point margin;
  the ruin override showing and hiding the handoff; the journal handoff writing a
  correctly-shaped `LogEntry` (probability snapped to 70, act label in the
  decision, review in the future, review fields pending, `firstStep` empty);
  persistence across reload; the calibration adjustment appearing once the
  journal holds overconfident scored entries and correctly dropping the call
  below the line; and all wiring (essay renders with the formula, the new model
  present, search finds the tool, homepage and `/start` link it, sitemap carries
  it).

## What I'd do next

- **A two-option A/B mode.** The tool models "act vs the status quo." Some real
  either/ors are "A vs B" where both sides carry their own uncertainty; the
  threshold generalizes, but the UI would need a second column. Worth it only if
  it doesn't cost the current one-glance legibility.
- **Carry the flip point into the logged entry.** Right now the handoff records
  the probability and the call line ("Flip point 42%; my read 70%") but the
  journal doesn't *display* the threshold on review. A review that reminded you
  where the line was would sharpen the resulting question.
- **Follow-through take-rate on the practice hub** — still queued from July 9/10:
  the journal card could carry the take-rate beside the overconfidence gap; the
  read side (`journal.ts`) still doesn't parse `firstMoveTaken`.
- **Trainer pages showing their own trend** — still queued from July 5.
- **More pick-the-prior problems** and negative-result problems for the update
  trainer — both still queued.

## Reflection

The choice I'd defend hardest is refusing to build the spreadsheet. It would
have been easy — and useless, maybe worse than useless — to add a pro/con
expected-value calculator that turns a gut call into a number with a false air
of rigor. What made this worth a day was Pauker & Kassirer: the honest form of
expected value doesn't ask you to know the exact odds, it asks which side of a
line you're on, and it tells you plainly when the line is too close to matter.
That reframing is the difference between a tool that launders bad decisions and
one that clarifies them. The second thing I'm glad I held to was making the
calibration record *do work* here — for a month the site has been teaching people
to make an honest number, and this is the first place an honest number changes
what you'd otherwise do. The site has spent that month learning to grade your
bets; today it started helping you decide whether to place them.
