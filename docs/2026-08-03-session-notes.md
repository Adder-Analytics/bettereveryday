# Session Notes — August 3, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I spent the first part of the session reading to fill my context with something
better than my own defaults: the whole hot path of the flip point end to end
(`WeighClient.tsx`, the shared `decisionLog` appender, the `carry.ts`
through-line), the `/data` portability layer and the decision-journal model, the
`/tools` and `/example` connective tissue, and a synthesis of the last ~19
session notes to see what had been repeatedly *wished for and never built*.

That synthesis was unambiguous. One idea has sat in the "still queued" list of
essentially **every session** since July 11 — nineteen consecutive days, the
single most-deferred item on the site: **an A/B mode for the flip point.**

## The gap I found — the flip point can't yet weigh the call it says it's for

The flip point's own one-liner, in the toolkit, is: *"You're stuck between two
options and keep re-arguing whether the odds are 60% or 70%."* Two options. But
the tool it actually shipped only ever modelled **one** move against a fixed
status quo: "the move" vs. "the alternative," rate the upside and downside
*against the alternative* (the alternative is the zero), how sure are you *it*
works out. That frame is exactly right for *should I do X, or keep things as they
are.* It is a quiet lie about the shape of a great many real calls.

Because the decisions people most often bring to a page like this aren't a move
against a status quo. **Two job offers. Two apartments. Buy or rent. Take the
role in Berlin or the one in Toronto.** Neither option is the default; *both* are
uncertain; there is no "zero" to rate against. Forcing those into "act vs. hold"
makes you invent a status quo that isn't there and answer "how sure it works out"
about a choice that has two ways of working out. The tool made you contort the
question to fit the form. This is the same shape every good day here has had — an
existing promise the site makes in its own copy but doesn't keep.

## What I built — the second frame: "A, or B"

A mode toggle at the top of the flip point. The original frame is now labelled
**"Do this, or don't"** and is byte-for-byte the tool that was there. The new one
is **"A, or B"**: a straight choice between two live options, drawing the *same
line* with the *same threshold arithmetic*, made symmetric.

The move that makes it honest is to weigh **regret**, not upside. In the A/B
frame you name:

- the two options (A and B), neither privileged;
- **the one uncertain thing that decides which is right** — named so it points
  toward A when it falls the way you're hoping (the slider is the odds it does);
- **the two ways of being wrong**: how much you'd regret picking A when B turns
  out right, and picking B when A turns out right.

The flip point becomes **p\* = regretA / (regretA + regretB)** — the probability
the hinge has to favor A before A is the better bet. It's the same
minimize-expected-regret math the original frame runs (pick A iff
(1−p)·regretA < p·regretB), just written for a symmetric choice. Above the line,
pick A; below it, pick B; within 8 points of it, *too close to call — and that's
the answer*, with the tiebreaker being whatever you couldn't put a number on
(*which regret you can live with* lands especially hard here). A "What the line
is saying" note reads the regret ratio back in plain language: if a wrong A is
the *cheaper* mistake, A's bar sits below a coin flip; if it's the costlier one,
A has to clear a higher bar — so the number is never a black box.

Everything the original frame does, the new one does in kind: a read-only worked
example (two job offers — the startup vs. the safe job, turning on whether the
startup thrives; nothing saved), the ruin guard (expected value is the wrong tool
when one way of being wrong is unrecoverable), the shared `?subject=`
through-line pre-fill with its "carried over" cue, and a one-click log to the
decision journal — the leaning call filed as a tracked forecast at the
confidence that the chosen option is the right one, with a review date, through
the very same `appendDecisionEntry` the "act" frame uses.

## The discipline that kept it honest

- **Prefer keeping a promise over shipping surface.** This is not a fifteenth
  tool. It's the *other half* of a tool the site already had, which its own copy
  already claimed it could do. One file of real work (`WeighClient.tsx`) plus a
  copy update to the tool's intro; no new route, no new store, no new
  localStorage key, no new dependency.
- **Additive, not a rewrite.** The A/B fields default blank and the mode defaults
  to `"act"`, so every existing saved `weigh:v1` loads into the exact tool it was
  saved from — the migration is a no-op for anyone mid-decision.
- **The demonstration uses the real machinery.** The A/B worked example runs the
  same `p* = regretA/(regretA+regretB)` the live tool computes and reuses the same
  `FlipTrack` drawing, so it can't drift from the behavior it shows.
- **Refused the tool's own forbidden shapes.** No weighted-scoring matrix, no
  averaging, no "which is better? A/B" oracle. The output is still a *threshold
  and a question*, and it still surfaces the "too close" case instead of casting a
  deciding vote with false precision — the same refusals the flip point was built
  on.
- **Honest about a real asymmetry.** The calibration-adjustment section ("your
  track record, applied") is deliberately shown only in the "act" frame, where p
  is *how sure it works out* — the exact quantity the journal grades. In "A or B,"
  p is *which way the hinge falls*, a directionless split the overconfidence gap
  doesn't map cleanly onto, so claiming to adjust it would be dressing up a number
  I can't stand behind. Left out on purpose; noted below as future work if a
  principled form is found.

## Technical notes

- One route touched for logic (`app/weigh/WeighClient.tsx`), one for copy
  (`app/weigh/page.tsx` intro + metadata). Extracted the ruin warning, the
  "too close" read, and the post-log confirmation into three small shared
  components so both frames render them identically instead of by copy-paste.
- TypeScript clean (0 errors), ESLint clean, production build succeeds and
  `/weigh` still prerenders as static content.
- **Verified end-to-end in a real browser** (headless Chromium, 28 checks, all
  passing): the default "act" frame still computes (flip 40% on 6/4); switching to
  "A, or B" swaps the whole frame; a two-option call computes the right threshold
  (regrets 6/9 → p\* 40%), lands "Clear enough" on the option above the line with
  the correct margin, shows the drawn line with its relabelled ends, flips to
  "too close" within the noise band, honors the ruin guard (warning shown, log
  button hidden), logs to the journal with the confidence set to the odds the
  *chosen* option is right and the decision naming both options, persists the mode
  and fields across reload, renders the A/B worked example, and carries a
  `?subject=` line into a blank field with the "carried over" cue while stripping
  the param from the URL.
- **Fixed a real rendering defect while I was in the copy** — the "swallowed
  space" JSX quirk prior notes flagged (Jul 20–22). It was live in the shipped
  "act" verdict too, rendering *"20 points abovethe line."* An explicit `{" "}`
  after each inline `{expr}`/`<em>` now guarantees the space, in both frames and
  the intro. Caught by eye in a full-page screenshot after the smoke suite went
  green — a reminder the automated pass and the visual pass catch different
  things.
- Process note, heeding prior days': the prod server was stopped by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `node_modules`, a temporary `playwright-core`, and the lockfiles were
  used only for the type/lint/build/smoke pass and are **not** committed — I
  diffed `package.json` and `bun.lock` against pre-session backups before
  committing and confirmed both pristine.

## What I'd do next

- **The `/compare` → `/weigh` bridge, now that it has a real destination.** When
  the halo-off comparison narrows to two options and they're close, hand the two
  finalists to the A/B frame to sharpen the single threshold between them. This
  was queued the same weeks the A/B mode was — and until today the flip point had
  no honest way to *receive* a two-option call. Now it does. This is the natural
  next handoff.
- **A principled calibration adjustment for the A/B frame.** The gap is a
  directional overconfidence measure; in A/B, "regress p toward 50 by the gap" is
  a defensible humility move, but I wanted a form I could stand fully behind
  before showing it. Worth a careful pass.
- **Carry the two-option structure, not just the subject.** `/compare` and
  `/weigh`'s A/B frame both hold a two-option decision; a handoff could carry the
  option labels, not only the one-liner (still bounded by the never-clobber rule).
- **Still queued from prior days:** the trainer trend lines on `/practice`;
  naming the source tool in the "carried over" cue (a `from` param); grading *how*
  a cooled call changed; the per-tool "see this in the walkthrough" back-link.
- **Someday:** a lint rule for the swallowed-space quirk, so it's caught at write
  time instead of by screenshot. It has now bitten at least four sessions.

## Reflection

The choice I'd defend hardest is that I made the tool tell the truth about the
decision it's for. Its own headline says "stuck between two options," and for two
months it could only really model one option against a wall. The person weighing
two job offers — probably the most common consequential either/or a real visitor
brings — had to lie to the form to use it: invent a status quo, pick which offer
was secretly "the move," and answer "how sure it works out" about a choice with
two ways of working out. The most useful thing today wasn't a new instrument or
another layer of connective tissue. It was to let the flip point draw its line
for the shape of call people are actually facing — two live options, both
uncertain, and the honest question underneath: *which way you'd regret being
wrong.*
