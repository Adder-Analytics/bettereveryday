# Session Notes — October 6, 2026

## What I set out to do

The standing directive is unchanged: make this a useful *instrument* for real
people, not a self-improvement site. Two items had been carried for a week:
"measure the multi-step tools' focus landing" and "do the essay-bridge check on
`/notes`". I started on the first, expecting a small audit, and it turned into
the day's real finding.

## Outside reading

The egress proxy still blocks reading sites (`fs.blog` returned
EGRESS_BLOCKED). Search reached GDS's **"Tools over content"** again, and the
line that stuck this time was about taking someone "straight into the
transaction". A tool's *answer* is that transaction. So the question I asked
was: does every reader actually receive the answer?

## What I found

**None of the 31 interactive client components had a live region** (no
`aria-live`, no `role="status"`). Every tool computes its answer live from the
inputs and draws it in a card further down the page. On screen it's the loudest
thing there. To a screen reader it's silent: you press the last option, hear
the button's name, and then nothing. The site's first principle is "ends in an
answer, not advice", and a whole class of users never heard that answer arrive.

The focus-landing item turned out to be the smaller half of the same problem.
Only views that are *swapped out* (the pre-mortem's steps, the cool tool's
return banner) lose focus. Most tools append their answer below the inputs, so
focus survives but nothing is announced.

## What I changed

**`app/components/AnnounceAnswer.tsx`**: one shared, always-mounted, visually
hidden `role="status" aria-live="polite"` region. Each tool passes the short
headline of its answer, built from the same words it prints largest. Three
rules keep it from becoming noise:
- **Settled, not typed.** A message is spoken only after it holds still for
  700ms, so a number typed digit by digit is announced once.
- **Restoring isn't answering.** Changes in the first 900ms after mount are
  treated as localStorage hydration and taken as the baseline, so reopening a
  tool you used yesterday doesn't start talking.
- **Silence clears.** When the answer disappears, the region empties quietly,
  so the next answer, even an identical one, counts as news.

**Wired into 25 tools.** I did the door triage by hand as the reference, then
split the other 26 files across four parallel subagents with the same brief.
Of those, 24 got a region; practice and the return desk were skipped because
both are read-only hubs with nothing produced by an action.
- Verdict tools (doors, ruin, weigh, compare, outside, test, incentives, enough,
  stop, quit, crux, act, trace, cool, regret, advise, rule, widen, debrief)
  announce their headline. Where the headline lived inside a JSX ternary, it was
  factored into a small string helper that the card now shares
  (`readHeadline`, `revealHeadline`, `walkRead`, `HEADLINES`…), so the spoken
  and printed wording can't drift.
- Trainers (calibrate, estimate, update) announce the score once a round is
  submitted.
- Tripwire announces "Tripwire armed…" (arming clears the form). The journal
  announces "Logged… review set for {date}". The pre-mortem's failure step
  announces "N reasons so far" (Enter clears the box and keeps focus there, so
  this was the only feedback).
- **Focus moves**: the pre-mortem now focuses each new step's heading after a
  step change (the step label became an `h2 tabIndex={-1}`), never on load, and
  leaves alone a field that `autoFocus` already took. The cool tool's cold-return
  banner does the same as it steps decide → grade → done.

**`/notes`**: each reading note now ends "Run it on a decision of your own:"
with the instruments that practice its models, derived through the existing
`note.models` → `getToolsForModel`. So it needed no new data, which answers
yesterday's open "data decision". The Kahneman note, whose last paragraph says
"make the base-rate lookup a mandatory step", now links straight to *You Are Not
the Exception*. The Klinkenborg writing note has no model and shows nothing.

**`SITE_UPDATED`** is now October 6. `/now` leads with this change and drops the
oldest bullet (the models index).

## How I verified it

- `bun run lint`, `bunx tsc --noEmit`, and `bun run build` are all clean.
- Headless Chromium against `next start` at 375×812:
  - **Sweep of 25 tool pages**: each loads with an empty region (silent on
    load) and no page errors. The five whose region lives inside a round or
    step (calibrate, decide, estimate, premortem, update) correctly have none
    until it opens.
  - **Doors**: silent after 2 of 3 answers and silent on the click itself.
    After settling it says "The verdict: A two-way door. Decide fast.". Changing
    the stakes gives "First, the downside you can't take back. The verdict: A
    one-way door…". After a reload with the saved call it stays silent.
  - **Weigh**: a MutationObserver on the region while typing 12000 and 3000
    digit by digit recorded exactly **one** announcement: "The flip point: 20%.
    Clear enough: act."
  - **Pre-mortem**: step 1 focuses the plan field (autoFocus kept), step 2
    focuses the reason field, each Enter announces "1 reason so far." / "2
    reasons so far." with focus kept in the box, and step 3 lands focus on
    "H2: Step 3 of 3 — The response".
- The note→tool mapping was checked with a scratch script: kahneman → outside
  and practice, housel → weigh and ruin, dawkins → incentives, ellenberg →
  outside and practice, klinkenborg → none.
- **Not done**: a real screen reader (NVDA or VoiceOver). Playwright proves the
  region's text and timing, not how a particular reader voices it.

## Calls I'd defend

- **One shared component, not 25 bespoke `aria-live` divs.** The hard parts
  (debounce, hydration grace, staying mounted) are easy to get subtly wrong,
  and getting them wrong means a tool that chatters. Getting them right once
  makes each tool's job a single string.
- **Announce the headline, not the card.** The card can run to paragraphs, and
  reading all of it aloud on every change would be worse than silence. The
  headline tells you the answer exists and what it is, and the rest is right
  there to read.
- **Polite, never assertive.** Nothing here is urgent enough to interrupt
  what's being read, including the ruin warning, which is announced first
  *within* the message instead.
- **Parallel subagents for the fan-out.** The change was mechanical per file
  but needed judgement about each tool's headline. Four batches over disjoint
  files, then one integration build and a browser sweep, was faster and kept
  the review in one place.

## What I ruled out

- **Moving focus to every answer.** It would yank a keyboard user out of the
  inputs they're still adjusting (sliders, numbers). Announce politely and
  leave focus where the user put it, except where the view is actually swapped.
- **Including the numbers that change on every keystroke** in most messages.
  Only where the number *is* the headline (the flip point's %, the trainers'
  score).

## Left for later

- **Estimate and update practice rounds**: the reveal/score button unmounts on
  click, so keyboard focus falls to `<body>`. The answer is now announced, but
  focus should land on the result heading (the same pattern as the pre-mortem).
- **Journal**: "Mark reviewed" in the review screen also unmounts its button.
  Logging the same worksheet twice with the same review date produces identical
  text, so the second save isn't re-announced.
- **A real screen-reader pass** (VoiceOver on iOS is the likeliest real user).
- New tools should ship with `<AnnounceAnswer>` from the start. Consider a
  line in the tool-authoring notes.
- **Bump `SITE_UPDATED`** in `app/data/updated.ts` with each shipped change.
- Still carried: watch the borderline essay placements, prune single-use tags,
  decide the domain order on `/models`, and script the offline check with
  `context.setOffline`.
