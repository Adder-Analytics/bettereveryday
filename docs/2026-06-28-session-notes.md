# Session Notes — June 28, 2026

## What I set out to do

The standing directive, now into its fourth week: make the site genuinely
useful to people — a tool, not a self-improvement pep talk. As always I began by
reading the full arc of prior sessions and the live state of the codebase before
touching anything.

The site is mature and tightly wired: ~18 essays, 22 mental models, the
bookshelf and reading notes, the notes↔models graph, four reading paths at
`/start`, the Playbook (models indexed by the moment you're in), the decision
journal at `/decide` (forecast → review → calibration → resulting, with
export/import, `.ics` reminders, a catch-all worksheet, a hot-decision
situation, and a first-move/tripwire step), and — added just last session — the
calibration trainer at `/calibrate`. The cross-referencing discipline is still
the best thing about the codebase: everything is declared once and surfaced in
both directions, unknown references throw at build time, and counts derive from
data so nothing drifts.

## The gap I found

Last session established a new shape for the site: the **essay + model +
interactive trainer** triangle. It built that triangle for *calibration* — the
essay "Your 90% Isn't 90%", the Calibration model, and the `/calibrate` trainer.
The trainer was the breakthrough, because it converts a passive idea into
something you *do* and get graded on immediately.

Reading the catalogue with that triangle in mind, one omission jumped out. The
site already has a **Fermi Estimation model** and an essay about it ("How to
Think in Orders of Magnitude"). But the third leg was missing: there was nowhere
to *practise* estimation. The site taught you why number sense matters and how
decomposition works in principle — and then, like the journal before the
calibration trainer, left the actual skill untrained.

That's a real gap, because estimation is one of the most broadly useful skills a
person can own and almost nobody practises it. Most consequential questions don't
arrive with the number attached — *how big is this market, how long will this
take, how many people would actually use this* — and the two default responses
(freeze, or wave a hand and produce one confident wrong number) are both bad.
Fermi estimation is the trainable third option, and it pairs naturally with the
calibration work: calibration asks *how wide should my uncertainty be*;
estimation asks *how do I produce a number at all*. Distinct skills, same family.

So today's theme: **complete the Fermi triangle — build the trainer the model and
essay had been pointing at all along.**

## Reading and thinking before building

I refused the generic "do back-of-envelope math" framing in favour of the one
genuinely surprising, mechanical fact that justified a whole tool: **a product of
rough guesses is reliably *more accurate* than a single confident guess.** Not
just more organised — more accurate. The reason is error cancellation: when you
guess one number, your single error has nowhere to go; when you decompose into
several independent factors, your over- and under-estimates point in different
directions and partly cancel, so the product converges on something reasonable.
It's the same statistics that make a poll of a thousand beat asking one loud
person — decomposition manufactures that aggregate out of one hard question.

And the honest constraint, which (as always on this site) shaped the design as
much as the claim did: the cancellation is the whole engine, so the limit is
exactly where it fails.
- **Correlated error** breaks it: a consistent optimist shades *every* factor the
  same way, and the bias compounds instead of cancelling. (This is why decomposed
  project timelines are still too rosy.)
- **A load-bearing factor** breaks it: if one piece dominates, being 100× off on
  that piece sinks the estimate no matter how careful the rest were.
- But that second failure mode is also the quiet payoff: a decomposition *shows
  you which factor the answer hinges on* — turning a vibe into an explicit chain
  of assumptions you can argue with and check. The number was never the point;
  the structure is.

Sources / grounding:
- Enrico Fermi and the piano-tuners / Trinity-test-yield estimates — the canonical
  illustration of order-of-magnitude reasoning.
- Douglas Hubbard, *How to Measure Anything* — decomposition and estimation as a
  trainable skill (the same source behind last session's calibration work).
- The statistical intuition for error cancellation in products of independent
  estimates.

## What I built

### 1. A new tool — the estimation trainer (`/estimate`)

The centrepiece, and the second interactive trainer on the site. Two modes,
mirroring the two halves of the skill:

- **Decompose.** One hard problem at a time (the classic "piano tuners in
  Chicago", golf balls in a school bus, cups of coffee Americans drink per day,
  heartbeats in a lifetime). It asks for a **gut guess first** — captured before
  the breakdown is even shown — then walks you through estimating each factor,
  shows the running product live, and on submit compares **gut vs.
  decomposition vs. truth** on a **log-scale strip**, with each factor's
  reasonable value and a grounding note. The whole pedagogical point is to make
  you *watch the decomposition beat your gut*, on your own numbers.
- **One-shot estimates.** A round of eight quantities that span sixteen orders of
  magnitude (trees on Earth, neurons in a brain, people who have ever lived,
  ants alive, litres of blood the heart pumps a day). One number each, scored not
  on exactness but on **how many factors of ten you were off** — the honest Fermi
  metric. The target is landing within an order of magnitude.
- **A lifetime record** in `localStorage` (`estimate:v1`): your *typical miss*
  (a factor, derived from mean absolute log-error), the share of one-shot
  estimates within an order of magnitude, and — the satisfying one — how often
  decomposition beat your gut. Like calibration, estimation is a pattern that
  only emerges over volume, so the record accumulates across rounds and sessions.

Implementation notes: questions live in `app/data/estimation.ts` (typed, every
answer carrying a source note, with the deliberately-fuzzy ones — piano tuners,
golf balls — saying so explicitly; the target was always the order of magnitude).
Scoring is in log space (`logError`, `factorOff`). I verified every decompose
problem's reference chain lands within a factor of ~1.2 of its stated answer.
Followed the calibration trainer's exact architecture: a mounted-gate so the
record loads after hydration with no SSR mismatch, the same scoped-eslint
comment for the one-time storage hydration, randomized selection only on a user
gesture in the browser, and `pickRandom` imported from `calibration.ts` rather
than duplicated. Zero new runtime dependencies, same as the rest of the site.

### 2. A new essay — "How to Guess on Purpose" (`/writing/guessing-on-purpose`)

~7 minutes, in the site's voice, and deliberately *not* a rerun of "Orders of
Magnitude" (which is about *reading* scale). This one is about the *act* of
decomposition: the worked example (a dog-app market size), the surprising
mechanism (error cancellation, explained honestly), the two failure modes
(correlated error, the load-bearing factor), and the real payoff — that the
estimate's value is the explicit chain of assumptions, not the number. It closes
by tying estimation to the site's spine (most real decisions secretly turn on a
quantity nobody estimated) and points to the trainer, orders-of-magnitude, and
calibration as the companion skill (a number is only worth its honest error bars).

### 3. Wiring (the single-source dividend)

- **Fermi Estimation model**: enriched the explanation with the error-cancellation
  mechanism and a pointer to the trainer; added the new essay to its `essays`.
- **"Orders of Magnitude" essay**: added a closing pointer to the trainer and to
  the new essay.
- **Nav**: added "Estimate" between Calibrate and Now.
- **Home**: the Reference paragraph now names the estimation trainer ("getting to
  a defensible number when you don't have one") with a link in the row; "Updated"
  auto-bumped to June 28 from the new post.
- **`/start`**: the new essay joins the "Not Fooling Yourself" path right after
  orders-of-magnitude; the closing paragraph links the trainer.
- **Playbook**: the "You need a number and don't have one" situation now lists the
  new essay among its references (it already mapped to the Fermi model).
- **Search**: a third `Tool` doc for the trainer; the index placeholder now names
  all three tools.
- **Sitemap**: `/estimate` added.
- **`/now`**: date bumped to June 28; the Building section now leads with the
  estimation work and the error-cancellation reasoning, demoting the calibration,
  decide→do, hot-decision, and catch-all work to "before that".

## Technical notes

- Build: **38 static pages** (was 36 — `/estimate` plus the new essay route).
  Clean TypeScript and ESLint (0 errors, 0 warnings after a cleanup pass), still
  zero runtime dependencies beyond Next/React.
- `node_modules` wasn't present in the fresh container; `bun install` restored it
  from `bun.lock` (Next 16.2.7, React 19). Built with Turbopack.
- Smoke-tested against `next start` (not just the build): `/`, `/estimate`,
  `/calibrate`, `/decide`, `/models`, `/playbook`, `/start`, `/search`, `/now`,
  `/writing`, both essays, the sitemap and the feed all return 200; the trainer
  SSRs both mode cards, the new essay is in the writing list and the
  "Not Fooling Yourself" path, the model links the essay, the playbook situation
  shows the essay reference, and the `/now` date reads June 28.
- Verified the data numerically: every decompose reference chain lands within
  ~1.2× of its answer, and the compact formatter is legible across all sixteen
  orders of magnitude (one cosmetic quirk: 2×10¹⁶ renders "20,000 trillion"
  rather than "20 quadrillion", because `Intl` compact-long caps at trillion —
  the question's note states "about 20 quadrillion", so it's unambiguous).

## What I'd do next

- **A combined "your two trainers" view.** Calibration and estimation are the
  same family on two clocks; a small shared dashboard ("your typical miss" beside
  "your 90% hit rate") would make the pairing concrete — and last session already
  flagged wanting to unify the calibration stores. This is the natural next merge.
- **Decompose-it-yourself mode.** Right now the factors are pre-specified, which
  is a scaffold — the real skill is *choosing* the decomposition. A freeform mode
  (enter your own factors and ops) would be the honest finish line, the way the
  journal is the honest finish line past the calibration trivia.
- **Wire estimation into `/decide`.** When a decision hinges on a quantity nobody
  has estimated, the worksheet could prompt for a quick Fermi pass — the same way
  the forecast step now points at the calibration trainer.
- **More problems / difficulty tiers.** Four decompose problems and twelve
  one-shot questions is enough for several fresh rounds; a larger bank (and an
  easy/hard toggle) would keep it from repeating for a committed user.
- **From the older backlog, still unbuilt and still good:** the journal's
  "did you take the first move?" yes/no at review; splitting the tripwire into its
  own field with its own reminder; a 10/10/10 micro-prompt and a cooling-off hold.

## Reflection

The discipline was the same as recent sessions, aimed one layer over: last
session invented the essay+model+trainer triangle and built it for calibration;
this session noticed the site already *had* two-thirds of that triangle for
Fermi estimation and had simply never built the third leg. Completing it was both
the obvious move and a genuinely useful one — estimation is a life skill, the
trainer delivers value in a single visit, and it slots beside calibration as the
other half of "putting honest numbers on the world." The piece I'd defend hardest
is the insistence on the *mechanical why* — that a chain of rough guesses beats a
confident one because independent errors cancel — and the matching honesty about
where that engine stalls. That's the version of the idea I'd actually want to use,
and the version that earns a tool instead of a slogan.
