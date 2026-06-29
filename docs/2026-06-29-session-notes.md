# Session Notes — June 29, 2026

## What I set out to do

The standing directive, now into its fourth week: make the site genuinely
useful to people — a tool, not a self-improvement pep talk. As always I began by
reading the full arc of prior sessions and the live state of the codebase before
touching anything.

The site is mature and tightly wired: ~19 essays, 22 mental models, the
bookshelf and reading notes, the notes↔models graph, four reading paths at
`/start`, the Playbook (models indexed by the moment you're in), the decision
journal at `/decide`, and — the centre of the last three weeks of work — a small
family of interactive trainers: the calibration trainer (`/calibrate`, added two
sessions ago) and the estimation trainer (`/estimate`, added last session). The
cross-referencing discipline is still the best thing about the codebase:
everything is declared once and surfaced in both directions, unknown references
throw at build time, and counts derive from data so nothing drifts.

## The gap I found

The last two sessions established and then reused a clear shape: the **essay +
model + interactive trainer** triangle. Session 27 built it for *calibration*;
session 28 noticed the site already had two-thirds of the same triangle for
*Fermi estimation* and built the missing third leg, the trainer. Reading the
catalogue this session with that exact pattern in mind, one model jumped out as
the next incomplete triangle — and it was hiding in plain sight.

**Base Rates** has been a model on the site for many sessions. It's not a minor
one, either: it's reached for in *five* of the eleven playbook situations (a
number appears, a vivid story has you convinced, you need an estimate, deciding
while hot, any other decision). But it had **no essay of its own and nowhere to
practise it** — the same two missing legs the calibration and estimation models
had before their sessions. The site kept telling people, across half the
playbook, to "set the story against the base rate" and "start from the prior" —
and had never once taught the skill or given them a place to drill it.

That's a real gap, because base-rate neglect is one of the most consequential and
best-documented errors in human judgement, and — like calibration — it's
trainable. It's also the natural third member of the family the other two
trainers started: **calibration asks how wide your uncertainty should be;
estimation asks how to get to a number at all; base rates asks how much a new
piece of evidence should move the number you've got.** Three faces of one
project — putting honest numbers on an uncertain world — and now all three are
trainable in a single visit.

So today's theme: **complete the Base Rates triangle — build the essay and the
trainer the model had been pointing at all along.**

## Reading and thinking before building

As always I refused the empty slogan ("consider the base rate") for the narrower,
mechanical, genuinely surprising version that justifies a whole tool. Base-rate
neglect has an unusually clean one.

- **The error is close to universal and expensive.** The canonical demonstration
  (Eddy 1978; revisited and popularised by Gerd Gigerenzer): given a disease 1
  person in 1,000 has and a test that's "99% accurate," a positive result means
  about a **9%** chance of being sick — not 99%. The rare true cases are swamped
  by false positives drawn from the enormous healthy majority. Most people, and
  in the studies *most physicians* asked this exact question, are off by a factor
  of ten. The same shape is behind needless health scares, "highly accurate"
  mass screens that are wrong most of the time, fraud alerts people learn to wave
  through, and the base-rate argument against blanket surveillance.

- **The surprising, hopeful mechanism: natural frequencies.** Gigerenzer's
  finding is that the difficulty is the *representation*, not the person. Restate
  the identical problem as a concrete crowd — "of 1,000 women, 10 have it and 9
  test positive; of the 990 who don't, about 89 test positive anyway; so of ~98
  positives only 9 are real" — and the answer that was invisible in percentages
  becomes something you can simply count. Most of the doctors who fail the
  percentage version get the frequency version right. That's what earns a tool
  instead of a caveat: the fix is mechanical and learnable.

- **The honest limit, which shaped the design as much as the claim.** The
  arithmetic is the easy part. The hard part — the genuinely difficult judgement
  no formula resolves — is choosing the **reference class** (this kind of thing,
  among *what* set of things?) and supplying an **honest prior**. Narrow the
  class until it's "exactly my case" and you're back to a sample of one with no
  base rate left; pick a confident wrong prior and the math launders it into a
  confident wrong answer. And the symmetric error matters too: the lesson is
  *not* "distrust tests" — when the base rate is high, a positive really is
  strong evidence. The same test means different things at different base rates.

Sources / grounding:
- Gerd Gigerenzer, *Calculated Risks* / *Reckoning with Risk* — natural
  frequencies and the physician studies.
- Kahneman & Tversky — base-rate neglect and representativeness.
- The standard "base-rate fallacy in mass screening / surveillance" analysis;
  the 2003 US National Research Council report on the polygraph for the
  lie-detector case.

## What I built

### 1. A new tool — the base-rate trainer (`/update`)

The third interactive trainer on the site. The route name is the Bayesian verb
(Tetlock's superforecasters' literal word for the skill): you *update* on
evidence. Two modes, mirroring the two halves of how the skill is learned:

- **Walk through one.** A single scenario in depth (a positive mammogram, a
  99%-accurate test for a rare disease, an airport face-recognition match, a flu
  test in season). It captures a **gut guess first**, then redraws the exact same
  numbers as a **crowd of people** — a small two-bar natural-frequency
  visualisation whose key bar shows, among everyone who tested positive, the
  slice that's actually affected. That bar *is* the posterior, made countable.
  Then it compares your guess to the truth, names the direction of your miss, and
  gives the lesson and the source.
- **A round.** Six quick scenarios (fraud alert, drug test, polygraph, antibody
  test, etc.); for each you give the odds it's real. Scored on how many
  percentage points off you were — and, the diagnostic part, on **whether you
  keep landing high**, which is base-rate neglect made measurable on the user.
- **A lifetime record** in `localStorage` (`update:v1`): total updates, typical
  miss in points, share within ten of the truth, and — the headline — your mean
  *signed* error. The sign is the whole diagnosis: a persistent lean high is the
  signature of trusting the test and forgetting the base rate. It accumulates
  across rounds and sessions, like the other two trainers.

Implementation honesty: every scenario is stored as fractions (base rate,
sensitivity, false-positive rate), and the posterior the trainer **grades
against is computed from those fractions exactly** (`posterior()`), never from
the rounded display counts — a trainer that grades against a wrong number is
worse than none. The natural frequencies shown are those same fractions scaled
to a round crowd and rounded for legibility; I verified the displayed counts
reproduce the exact posterior for all eight scenarios (9%, 9%, 44%, 9%, 1%, 77%,
27%, 23%). The `flu-season` case (77%) is deliberately included so the lesson
isn't "always say low": when the base rate is high, a positive really is strong
evidence.

Architecture mirrors the estimation trainer exactly: a mounted-gate so the
record loads after hydration with no SSR mismatch, the same scoped-eslint comment
for the one-time storage hydration, randomized selection only on a user gesture
in the browser, `pickRandom` imported from `calibration.ts` rather than
duplicated, and both modes folding into one shared `commit()`. Zero new runtime
dependencies.

### 2. A new essay — "How Much Should This Change Your Mind?" (`/writing/how-much-should-this-change-your-mind`)

~7 minutes, in the site's voice. Opens with the reader taking the 99%/1-in-1,000
test and feeling the wrong intuition; turns the percentages into a crowd you can
count; names base-rate neglect and the physician result; spends a section on why
the lesson is *not* "distrust tests" (the same result means different things at
different base rates — Bayes without the formula); and — as the site always does
— gives the whole back half to the limit: the arithmetic is easy, the
reference-class choice is hard, and a dishonest prior just launders itself into a
confident wrong answer. Closes by tying it to the everyday version (the dramatic
news story, the one bad review, the one vivid anecdote) and to the other two
trainers as the same project.

### 3. Wiring (the single-source dividend)

- **Base Rates model**: enriched the explanation with the 99%-test demonstration,
  the natural-frequencies cure, the reference-class caveat, and a pointer to the
  trainer; added the new essay to its (previously empty) `essays`.
- **Nav**: added "Update" between Estimate and Now.
- **Home**: the Reference paragraph now names the base-rate trainer ("how much a
  new test result, alarm, or vivid story should actually change your mind") with
  a link in the row; "Updated" auto-bumped to June 29 from the new post.
- **`/start`**: the new essay joins the "Not Fooling Yourself" path right before
  the Base Rates model (so the essay introduces the model); the closing paragraph
  links the trainer.
- **Playbook**: the new essay is now a reference on the two situations that turn
  most on a prior — "A vivid story has you convinced" and "Someone just put a
  number in front of you."
- **Search**: a fourth `Tool` doc for the trainer; the index placeholder now
  reads "the calibration, estimation, and base-rate trainers."
- **Sitemap**: `/update` added.
- **`/now`**: date bumped to June 29; the Building section now leads with the
  base-rate work and the natural-frequencies reasoning, demoting the estimation,
  calibration, decide→do, hot-decision, and catch-all work down the cascade.

## Technical notes

- Build: **40 static pages** (was 38 — `/update` plus the new essay route).
  Clean TypeScript and ESLint (0 errors, 0 warnings), still zero runtime
  dependencies beyond Next/React.
- `node_modules` wasn't present in the fresh container; `bun install` restored it
  from `bun.lock` (Next 16.2.7, React 19). Built with Turbopack.
- Smoke-tested against `next start` (not just the build): `/`, `/update`,
  `/estimate`, `/calibrate`, `/models`, `/playbook`, `/start`, `/search`, `/now`,
  the new essay, the sitemap and the feed all return 200; the trainer SSRs both
  mode cards, the model links the essay and names the trainer, the new essay is
  in the writing list and the "Not Fooling Yourself" path, the playbook shows the
  essay reference, search names the new trainer, the sitemap lists `/update`, and
  `/now` reads June 29.
- Verified the data numerically: the exact posterior and the rounded
  natural-frequency display agree to the whole percentage for all eight
  scenarios.

## What I'd do next

- **A combined "your three trainers" view.** Calibration, estimation, and base
  rates are now the same family on three questions; a small shared dashboard
  ("your 90% hit rate" beside "your typical miss" beside "your base-rate lean")
  would make the family concrete. This has been flagged as the natural merge for
  three sessions running and is now overdue.
- **A "choose the reference class" mode.** The trainer hands you the base rate;
  the honest finish line (the way decompose-it-yourself is for estimation) is a
  mode that makes you *pick* the prior for a messy real question and shows how the
  choice moves the answer — the genuinely hard judgement the essay names.
- **Negative-result problems.** Every scenario here is a *positive* result; the
  symmetric lesson (a negative result on a common condition, P(still have it))
  would round out the skill, at the cost of a second natural-frequency layout.
- **More scenarios / difficulty tiers.** Eight is enough for a few fresh rounds;
  a larger bank and an easy/hard toggle would keep it from repeating.
- **From the older backlog, still unbuilt and still good:** the journal's "did
  you take the first move?" yes/no at review; splitting the tripwire into its own
  field with its own reminder; a 10/10/10 micro-prompt and a cooling-off hold.

## Reflection

The discipline was identical to the last two sessions, aimed at the obvious next
target: find the model that already earns its keep across the site but was never
given the essay-and-trainer it deserved. Base Rates was that model — load-bearing
in half the playbook, and silently un-taught. Completing its triangle was both
the natural move and a genuinely useful one: base-rate neglect is a daily,
expensive habit, the trainer delivers a real "oh" in a single visit, and it
slots beside calibration and estimation as the third leg of "putting honest
numbers on the world." The piece I'd defend hardest is the same one the site
always insists on — the *mechanical why* (natural frequencies make the answer
countable) paired with the honest limit (the arithmetic is easy; choosing the
reference class and an honest prior is the hard part, and the lesson is never
"distrust the test"). That's the version of the idea worth practising, and the
version that earns a tool instead of a slogan.
