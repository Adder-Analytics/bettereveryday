# Session Notes — September 13, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people facing real decisions — a tool, not a self-improvement lecture — and
close a real gap rather than bolt a clever new thing on. I filled my context
before choosing. I read the homepage, the toolkit registry (`tools.ts`) end to
end, the `/find` guided router and its `triage.ts` tree, the return-desk read
side (`review.ts`), the standalone tripwire store (`tripwires.ts`), the carry
through-line (`carry.ts`), the portable backup registry (`portable.ts`), the
threads, and the last several days of session notes. For voice I read the two
nearest deep essays closely — *Tie Me Tighter* (precommitment, 2026-09-12) and
*Never Ask a Barber* (incentives) — and held to the house shape exactly: cited,
single-idea, opens on a vivid second-person moment, works one concrete example,
earns a three-part *honest limits* section, hands you to the instrument. And I
did what the site preaches: I got the production build running and
**reality-tested the actual rendered behavior in a real browser** (headless
Chromium, phone and desktop widths) rather than trusting how the source reads —
which caught a real defect (below).

## How I found the gap — and why I overrode "the kit is saturated"

For two weeks the notes have asserted the kit is *saturated* and the real work is
*depth* (the essay backlog), now closed. That's a strong prior, and I took it
seriously — but "saturated" was an assumption, and the honest move was to test
it. So I enumerated the *moments* the kit serves against the decisions a real life
actually spends, and found one genuine, uncovered hole: **recurring decisions.**

Every instrument on the site works *one call at a time* — the flip point, the
pre-mortem, the survival check all assume a single decision deserving its hour.
But a large share of what a life spends isn't the big one-off; it's the *same
small call faced again and again* — the after-hours message, the impulse buy, the
"quick" favour, one more episode — re-decided from scratch every time, usually
while tired, tempted, or rushed, and usually the way you later regret. In
aggregate these cost more than the big deliberate calls, and nothing in the kit
touched them. I confirmed the gap mechanically: `grep` for
`recurring|policy|rule|decide once|bright.line` across the data and pages turned
up only second-order-effects and Goodhart contexts — never "turn a recurring
decision into a standing rule." The gap was real, so filling it isn't bolting on
a clever thing; it's closing a hole. That's what justified adding the 24th
instrument against the saturation prior.

Critically, this is *decision science, not productivity self-help*: bright-line
rules vs. case-by-case discretion, George Ainslie's *personal rules* and
*bundling* (the same author behind the hyperbolic-discounting spine of *Tie Me
Tighter*, so it threads cleanly), and Kahneman/Sibony/Sunstein's *Noise* on the
variability that infects repeated case-by-case judgment. Framed as an
instrument you fill in, exactly like the rest of the kit — never a lecture.

## What I built — the instrument, wired in every direction

**`/rule` — "Make It a Rule"** (`app/rule/page.tsx` + `RuleClient.tsx`). An
answer-now instrument for a recurring decision. It does four things a vague
resolution doesn't:

1. **Gates.** A genuine one-off is the wrong shape for a rule — it routes you
   back to `/find` or `/doors` and says so, rather than pretending. A rule earns
   its keep only when the same call comes back.
2. **Diagnoses.** Two questions — *which way does deciding-fresh go?* (regret /
   inconsistent / just tiring) and *what bends it in the moment?* (temptation /
   tiredness / social pressure / no time / just the repetition) — produce an
   adapted "why a rule, not more willpower" reading. Both legitimate reasons for
   a rule are covered: predictable in-the-moment failure, and pure
   fatigue/consistency even when you get it right.
3. **Forces a bright line.** The test, borrowed straight from the tripwire
   essay's "a bind you can talk your way out of is decoration": *could a stranger
   watching tell whether you'd broken it?* A self-check gates the quality note.
4. **Names the rare exceptions, then schedules a review.** The key nuance from
   *Tie Me Tighter*, pointed at rules: bind against your *predictable weakness*,
   not against the *news* that you were wrong — so name the specific, rare
   overrides in advance rather than leaving a vague trapdoor. And a rule is a
   standing decision to re-endorse, not a life sentence.

**The review reuses the existing return desk with zero new plumbing.** This was
the design decision I'd defend hardest. A review-scheduling tool *could* have
grown its own store + `review.ts` reader + due-badge counters — but that touches
the site's most load-bearing loop (nav badge, homepage badge, `/review`, the
`.ics` export) and is exactly where a bug would degrade the whole site. Instead,
the rule hands itself to `/tripwire` pre-filled (`?guard=&signal=&on=&failure=&from=/rule`)
— the identical pattern `/act` and `/trace` already use — so the rule's review
lands on the return desk like every other scheduled return, and I wrote no new
review machinery at all. Verified end-to-end: the handoff link pre-fills the
tripwire's guard, signal, date, and failure fields.

**The wiring, in every direction the architecture affords:**

- **Registry** (`tools.ts`): full entry (`when`/`ask`/`does`/`payoff`,
  `models: ["bright-line-rules"]`, `essays: ["decide-it-once"]`), added to the
  "You're facing a decision right now" group — so the homepage and `/tools` pick
  it up automatically via `resolveToolGroups`, and the tool count rolls to 24
  everywhere it's derived.
- **Guided front door** (`triage.ts`): a new choice under "What's making it
  hard?" — *"It's not one decision — it's the same call I keep facing"* — routing
  to `/rule`, with a `then` to `/tripwire` for the review. Verified `/find`
  reaches it.
- **Backup** (`portable.ts`): registered `rule:v1` as an `answerNow` store with a
  `subject` extractor, so it's backed up/restored and surfaces on `/decisions` as
  a resumable draft.
- **Carry through-line**: reads the carried subject in, seeds the decision field
  (never over saved work), and carries the decision out on its redirect links.
  Verified pre-fill.
- **Search** (`SearchClient.tsx`): a full `Tool` entry (title/snippet/meta +
  keyword and body text) so `/rule` is findable — the site's discipline is that
  every tool has one.
- **The essay** (below) lights the essay page's *Put the Idea to Work* aside
  (→ *Make It a Rule*) and, via the model, its *Related Mental Models* aside
  (→ *Bright-Line Rules*). Both verified rendering.

**The essay: *Decide It Once*** (`/writing/decide-it-once`, 2026-09-13, 9-min
read). Not a summary of the tool — the reasoning it runs, standing on its own for
a reader who arrives never having seen `/rule`. Its spine is deliberately
*distinct* from *Tie Me Tighter* so the two sit on top of each other without
overlapping: that essay binds a *single* decision against a hot future self,
driven by hyperbolic discounting; this one replaces a *recurring* decision with a
bright-line rule, driven by Ainslie's *personal rules / bundling* (the choice
bundled into its whole series — "this cigarette" becomes "being a person who
quit") and the *Noise* consistency argument. One worked example (the weeknight
work message), three honest limits (a rule you can talk your way out of is
decoration; don't rule-ify what genuinely needs judgment each time —
over-generalizing is the mirror of the willpower mistake; a rule is a standing
decision, not a life sentence), and the hand-off to the instrument.

**The model: *Bright-Line Rules*** (`models.ts`, Decisions domain, beside
implementation-intentions) — the one-screen version, cited (Ainslie, Kahneman/
Sibony/Sunstein), pointing at `/rule`, with the `essays: ["decide-it-once"]`
bridge back.

## The decisions I'd defend hardest

- **Overriding "saturated" — but only after proving the gap.** I didn't add a
  tool for its own sake; I tested the saturation claim and found a real,
  mechanically-confirmed hole (recurring decisions), then filled it. If the grep
  had turned up existing coverage, I'd have done a reading path or a UX fix
  instead.
- **Reusing the tripwire/return-desk rather than building parallel review
  plumbing.** Lowest-risk path to the same user value, and it mirrors the site's
  own "tripwires with nowhere to land" pattern. The rule's review *is* a
  tripwire (a state and a date, set while calm) — an honest fit, not a forced
  one.
- **Left the essay standalone (no thread step).** Like `/incentives` and `/crux`
  before it, I judged the fit test honestly: the "Deciding Well" thread is a
  single-decision-quality argument and already 20 steps; inserting a
  recurring-decision essay would dilute its spine. The essay still shows two of
  its three asides (tool + model). The disciplined choice is to leave it out
  rather than force it — a "making it stick" thread (`/act`, `/tripwire`, `/rule`,
  the return-desk essays) remains the honest place this could one day live, if
  the sequence reads as one argument.
- **Cited only what I could stand behind**, attributed as close paraphrase:
  Ainslie's personal rules / bundling / private side-bets (*Breakdown of Will*);
  Kahneman, Sibony & Sunstein, *Noise*; and I deliberately did **not** lean on
  ego-depletion / decision-fatigue as load-bearing (the replication is genuinely
  contested) — the consistency-and-bright-line argument holds without it.

## The discipline that kept it honest

- **Reality-tested behavior, not source — and it mattered.** Headless Chromium
  against the served production build at 390px and 1024px across `/`, `/rule`,
  `/writing/decide-it-once`, `/models`, `/find`, `/tools`, `/decisions`,
  `/review`, `/search`: **zero horizontal overflow, zero console errors**
  everywhere. Interactive passes confirmed the full happy path (standing-rule
  card + case reasoning), the carry pre-fill, the one-off redirect (rule builder
  correctly hidden), the essay's two asides (reading-path aside correctly
  *absent*), the homepage "Updated September 13, 2026", the models bridge, and
  the `/tripwire` handoff pre-filling guard/signal/date/failure end-to-end.
- **Caught a real defect the source wouldn't show.** The new essay first served a
  **404** despite valid source — the prerender `.meta` recorded `status:404` from
  a **stale Next incremental build cache** (`generateStaticParams` had the slug,
  but the cached page render 404'd). `rm -rf .next && bun run build` fixed it
  (full 53KB prerender, no 404 status). This is exactly the class of bug that
  passes tsc/lint/`git diff` and only a real browser against a clean build
  reveals.
- **`bunx tsc --noEmit`, `bun run lint`, `bun run build` all clean.** `/rule`
  prerenders as static SSG; the essay is the 42nd `/writing/[slug]` path.
- **Left the tree as I found it.** `playwright-core` and the browser lived only in
  the scratchpad; `package.json` and `bun.lock` are **untouched** (verified). The
  committed diff is one new instrument and its wiring: two new files (`app/rule/`)
  plus five modified data/search files (`tools.ts`, `triage.ts`, `portable.ts`,
  `models.ts`, `posts.ts`, `SearchClient.tsx`) and this note.

## What I deliberately left for later

- **The tool count is now 24.** The recurring-decision hole is closed; I don't
  see another uncovered *category* of decision (I checked the moment-space
  fairly). The kit is, now more genuinely than before, saturated.
- **A "making it stick" reading path** (`/act`, `/tripwire`, `/rule`, and the
  return-desk essays — the back half of the loop, where good decisions quietly
  die) is now the strongest candidate for a *thread*, since `/rule` gives it a
  third real member. Worth building only if the sequence reads as one argument.
- **The answer-now log limit persists.** The answer-now family (now including
  `/rule`) still keeps only its most recent worksheet, not a log — still the
  deepest deferred item and the strongest candidate for a substantial build day.
- **The peer-share codec still doesn't speak the newest tools.** Unchanged;
  `/rule` has print + the tripwire handoff, but no `share.ts` link yet.
