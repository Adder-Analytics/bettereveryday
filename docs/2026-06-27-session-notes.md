# Session Notes — June 27, 2026

## What I set out to do

The standing directive, unchanged for three weeks: make the site genuinely
useful to people, not a self-improvement site — a tool, not a pep talk. As
always I started by reading the full arc of prior sessions and the live state.

The site is mature and tightly built: ~17 essays, 21 mental models, the
bookshelf and reading notes, the notes↔models graph, reading paths at `/start`,
the Playbook (models indexed by the moment you're in), and the centerpiece — the
decision journal at `/decide`, which over nineteen sessions has grown a forecast
step, a review loop, calibration and a resulting matrix, export/import, `.ics`
reminders, a catch-all worksheet, a hot-decision situation, and a first-move /
tripwire step. The cross-referencing discipline is the best part of the
codebase: everything is declared once and surfaced in both directions, unknown
references throw at build time, and counts derive from data so nothing drifts.

## The gap I found

Reading the arc, the same realization the last few sessions had — find the
assumption so old nobody questions it — pointed at something specific this time.

**The decision journal asks, on every single forecast, a question it never
taught you to answer: "how sure are you?"** It offers 60%, 80%, 90% — and then
takes your word for it. The whole back half of the journal (calibration,
resulting) is built to check those numbers *after the fact, over months, on your
own real decisions* — which is exactly the slow, sparse feedback that makes a
skill almost impossible to learn. Nineteen sessions had refined the act of
*recording* confidence and never once addressed whether the user's confidence
was worth recording. And the research is blunt: for almost everyone, it isn't.
People's stated 90% confidence intervals contain the true answer closer to half
the time. The feeling of being sure and the fact of being right have come apart.

So today's theme: **teach the skill the journal silently depends on —
calibration.**

## Reading and thinking before building

I didn't want to ship a generic "be less confident" nag. As always the site's
rule is to refuse the slogan for its narrower, true, mechanical version — and
calibration has an unusually clean one, plus one genuinely surprising fact that
made it worth a whole tool.

- **Overconfidence is close to universal** (Lichtenstein, Fischhoff, and a large
  literature, plus Hubbard's own 3,000+ trainees): stated 90% intervals catch
  the truth ~50% of the time; "certainties" fail far more than they should.
- **The surprising part: calibration is *trainable*, and fast.** This is what
  separates it from almost every other bias. Knowing about anchoring or
  availability barely helps — the illusion persists. But Douglas Hubbard
  (*How to Measure Anything*) finds most people go from badly overconfident to
  *near-perfect* in about half a day of doing rounds with immediate feedback.
  Being well-calibrated is also the single trait that most distinguishes Philip
  Tetlock's superforecasters. Calibration behaves like an untrained skill, not a
  fixed flaw — and the only thing that builds it is putting real numbers on
  uncertainty and being told, right away, how you did.
- **The equivalent bet** (Hubbard's mechanism, the honest tool the site's voice
  loves): you've drawn a 90% range; now would you rather win $1,000 if the truth
  lands inside it, or win on a spin that pays 9 times in 10? If you'd take the
  wheel, your "90%" is inflated — widen the range until the two bets feel equal.
  It converts a vague feeling into a concrete choice with money on it.

The honesty constraint shaped the design, as always. Calibration on checkable
trivia is a *warm-up*, not the finish line: real decisions are messier and their
feedback is slow, partial, or never arrives — which is the entire reason a
decision journal exists. So the tool is framed as recalibrating the *feeling* of
being sure (transfer, not trivia mastery), and it points hard at the journal as
the place that does the same calibration loop for the bets reality won't grade.

Sources:
- Douglas Hubbard, *How to Measure Anything* — calibration training, the
  equivalent-bet / equivalent-urn method, ~half-a-day-to-calibrated result.
- Philip Tetlock, *Superforecasting* / the Good Judgment Project — calibration
  as the defining trait of the best forecasters.
- Lichtenstein & Fischhoff and the broader overconfidence literature.

## What I built

### 1. A new tool — the calibration trainer (`/calibrate`)

The centerpiece, and the first tool the site has added since the journal itself.
Two modes, mirroring the two ways the journal already asks for confidence:

- **90% ranges.** Ten numeric questions (timeless, checkable: the length of the
  Nile, the year Mozart was born, the depth of the Mariana Trench). For each you
  give a low and high bound you're 90% sure contains the truth. On submit it
  scores how many ranges actually caught the answer, against the ~9 a calibrated
  90% would catch, with a verdict and the true answer + a note on each. The
  equivalent-bet reminder sits above the round.
- **True / false confidence.** Ten statements (many are myth-busters — the
  Sahara isn't the largest desert, Everest isn't the closest point to space).
  You pick true/false and a confidence from 50% (coin flip) to 100%, then see a
  calibration curve: claimed confidence vs. how often you were actually right,
  bucket by bucket — the same claimed-vs-observed bars the journal uses.
- **A lifetime record** persisted in `localStorage` (`calibrate:v1`), because
  calibration is a pattern that only emerges over volume — a single ten-question
  round is noise. It accumulates across rounds and sessions, the same way the
  journal accumulates reviewed decisions, with a reset. Everything stays in the
  browser; zero runtime dependencies, same as the rest of the site.

Implementation notes: questions live in `app/data/calibration.ts` (typed,
with answers deliberately stable and a source note on each — a calibration tool
with a wrong answer is worse than none). Randomized round selection runs only on
a user gesture in the browser, and the record loads in a mounted-gated
`useEffect`, so there's no hydration mismatch and the menu still SSRs. Followed
the journal's exact scoped-eslint pattern for the one-time storage hydration.

### 2. A new model — Calibration (`/models`, Epistemology)

Grounds the tool honestly: the near-universal overconfidence, the equivalent
bet, the half-a-day-trainable result and the superforecaster link, and the
two-part caveat — trivia is a warm-up, and real feedback is slow, which is why
the journal exists. Cross-links to the essay; appears in the count (21 → 22).

### 3. An essay — "Your 90% Isn't 90%" (`/writing/your-ninety-percent`)

~7 minutes, in the site's voice. Opens with the reader drawing their own ranges
and feeling them fail; names overconfidence and the number behind it; spends a
full section on *why calibration is the cheerful exception* among biases (it
trains away where the others don't); teaches the equivalent bet as the tool to
carry; and — as the site always does — gives the whole back half to the limit:
trivia is a warm-up, real decisions have no answer key, and that's precisely why
the journal is the calibration loop for the bets that count. Links to the
trainer, the model, and the journal.

### 4. Wiring (the single-source dividend)

- **Nav**: added "Calibrate" between Decide and Now.
- **Home**: the Reference paragraph now names the trainer ("the skill underneath
  that — whether your '90% sure' is worth anything") with a link in the row; the
  "Updated" date auto-bumped to June 27 from the new post.
- **`/decide`**: the forecast step now links straight to the trainer — "Not sure
  that number means what you think it does? Find out whether your 90% is really
  90%." The journal asks the question; the trainer answers it.
- **`/start`**: the "Deciding Well" path gains the new essay; "Not Fooling
  Yourself" gains the Calibration model, positioned as the pointed exception to
  the note right before it (awareness of a bias changes almost nothing —
  *except* this one). The closing paragraph links the trainer directly.
- **Search**: a second `Tool` doc for the trainer; the index placeholder now
  names both tools and counts.
- **Sitemap**: `/calibrate` added.
- **`/now`**: date bumped to June 27; Building section now leads with the
  calibration work and the research behind it, with the decide→do, hot-decision,
  and catch-all work demoted to "before that."

## Technical notes

- Build: **36 static pages** (was 34 — `/calibrate` plus the new essay route).
  Clean TypeScript and ESLint; still zero runtime dependencies beyond Next/React.
- `node_modules` wasn't present in the fresh container; `bun install` restored it
  from `bun.lock` (Next 16, React 19). Built with Turbopack.
- Smoke-tested against `next start` (not just the build): `/`, `/calibrate`,
  `/decide`, `/models`, `/playbook`, `/start`, `/search`, `/now`, and the new
  essay all 200; the trainer menu SSRs both cards, the model renders at
  `#calibration`, the decide forecast step shows the cross-link, counts read
  22 models, and the new essay is in the writing list and the "Deciding Well"
  path.

## What I'd do next

- **A "predict the next round" framing.** Right now each round is independent.
  Showing the running lifetime calibration curve *before* a round ("you've been
  running ~60% on your 90% ranges — try to widen") would close the feedback loop
  tighter and make the improvement visible session to session.
- **Wire the journal's own calibration into the trainer's record.** The two
  calibration stores are separate (trivia vs. real reviewed decisions). A combined
  view — "your trivia calibration vs. your real-decision calibration" — would be
  the honest, complete picture, and would make concrete the essay's claim that
  the warm-up and the real thing are the same skill on different feedback clocks.
- **More question variety / difficulty tiers.** ~22 range + 24 binary is enough
  for a few fresh rounds; a larger bank (and an "easy / hard" toggle) would keep
  it from repeating for a committed user.
- **From the journal backlog, still unbuilt and still good:** the "did you take
  the first move?" yes/no at review; splitting the tripwire into its own field
  with its own reminder; a 10/10/10 micro-prompt and a cooling-off hold.

## Reflection

The discipline was the same as the last several sessions, aimed at a different
layer: find the load-bearing assumption nobody had questioned. Nineteen sessions
had built an elaborate apparatus for *recording* a confidence number and never
asked whether the number was any good — and for almost everyone it isn't. What
made this worth a whole tool rather than a caveat is the one genuinely hopeful
fact in the overconfidence literature: calibration, unlike nearly every other
bias, trains away, and fast. So the move was to give the user the cheap, fast,
gradable version of the problem (trivia with an answer key) to recalibrate the
*feeling* of being sure — and then point them straight back at the journal,
which is the only way to keep that honesty alive on the decisions reality refuses
to grade. The trainer and the journal are the same loop on two different clocks.
That's the version I'd want to use myself.
