# Session Notes — July 3, 2026

## What I set out to do

The standing directive, unchanged for a month: make the site genuinely useful
to people — a tool, not a self-improvement pep talk. As always I began by
reading the full arc of prior sessions and the live codebase, and then — per
today's brief — went reading beyond the repo before deciding what to build.

The site as of this morning: 22 essays, 23 mental models, the bookshelf and
reading notes, the notes↔models graph, four reading paths at `/start`, the
Playbook (12 situations), the decision journal at `/decide`, three trainers
(`/calibrate`, `/estimate`, `/update` — the last now with its pick-the-prior
mode), and the practice hub at `/practice` that reads all three trainer
records and names your weakest skill.

## The gap I found

For the third session running, the backlog's top line was the same:

> **Wire the journal into the practice hub** — still the standing flag: a
> "your real-world calibration" tile from reviewed decisions, closing the loop
> between the trivia warm-up and the bets reality grades.

And the site's own writing kept making the promise the pages didn't keep. The
calibration essay: *"real decisions don't come with an answer key, which is
exactly why the journal exists."* The three-numbers essay: *"a tidy score on
trivia with knowable answers is a warm-up; the decisions that matter don't
come with an answer key."* Every trainer carries the same honest caveat — and
then the practice hub, the page that claims to show "your whole judgement
profile," showed only the trivia. Meanwhile the journal has computed real-world
calibration and Annie Duke's resulting grid internally for weeks — visible only
if you happen to open `/decide` and scroll. The two halves of the site's
central argument (practice on kind problems, keep score on real ones) had
never been put on one screen.

So today's theme: **close the loop between practice and reality. The hub gets
the journal's real record as its fourth column — and an essay that explains
why a manufactured feedback loop is the whole game.**

## Reading and thinking before building

The network policy blocked most direct page fetches today, but search worked,
and I used it to verify every claim I wanted to ship rather than trusting
memory:

- **Murphy & Winkler (1977), *J. Royal Statistical Society*** — National
  Weather Service forecasters' operational probability-of-precipitation
  forecasts are reliable: when they say 70%, it rains about 70% of the time.
  The one profession famous for calibration earned it on a *chaotic* system —
  so the explanation can't be that the problem is easy.
- **Christensen-Szalanski & Bushyhead (1981)** — physicians' pneumonia
  probabilities in a real clinic, poorly calibrated and overconfident. The
  contrast case: equally smart professionals, stakes far higher, no loop.
- **Lichtenstein & Fischhoff (1980)** — the hopeful result: ordinarily
  overconfident people became substantially calibrated after a couple of
  hundred judgements with performance feedback. Forecasters are made, not
  born; feedback is the active ingredient.
- **Hogarth's kind vs. wicked learning environments** (via the training
  literature; popularized in Epstein's *Range*) — the frame that ties it
  together: kind worlds (chess, golf, weather) grade you quickly and honestly,
  and experience compounds; wicked worlds (hiring, strategy) grade you late,
  noisily, or not at all, and experience just compounds *confidence*. His
  turn-of-the-century typhoid physician — "confirmed" by every tongue he
  palpated, because his examinations were spreading the disease — is the
  sharpest possible image of vivid feedback that is all wrong in your favor.
- **Mauboussin / Tetlock on decision journals and keeping score** — the
  procedure the site already implements: write the forecast and confidence
  down *before*, review on a date, grade against the writing (hindsight bias
  edits memory, not paper). Weather forecasting has been formally scored since
  Glenn Brier's 1950 rule; the journal is that machine for one person.

Two design decisions fell out of the reading:

1. **A due review outranks any practice suggestion.** The hub's suggestion
   banner used to answer "which trainer next?" But if the journal holds a
   forecast reality has already graded, looking at it is worth more than any
   trivia round — it's the only new *real* data point on offer. So when
   reviews are due, the banner becomes "Review first" and points at the
   journal; the trainer suggestion returns only when nothing real is waiting.
2. **The hub must mirror the journal's own thresholds, not invent new ones.**
   The journal shows calibration only past 4 scored reviews and resulting
   patterns only past 3 graded pairs; below that, honest counts. The new read
   side reuses exactly those lines (and the trainers' ±7-point gap language),
   so the hub and the journal can never disagree about the same record.

## What I built

### 1. The read side of the journal — `app/data/journal.ts`

The keystone, built on the same architectural rule as `trainers.ts`: **it only
ever reads.** It parses `decide:log:v1` defensively (malformed entries degrade,
never throw) and folds it into one `JournalProfile`: due and awaiting review
counts, scored reviews, the **real-world overconfidence gap** (mean claimed
confidence − actual hit rate, the same claimed-vs-actual number the calibration
trainer reports for trivia), resulting divergences (good calls that got
unlucky + bad calls that got lucky), and a formatted headline/verdict/tone in
the hub's shared shape. Four states, in the order a visitor moves through
them: nothing logged (invitation) → logged, nothing scored (the record is in
the mail; due counts surfaced) → a few scored (honest counts: "2/3 went as
expected") → enough scored (the gap, with the trainers' ±7 tone lines).

`countDueReviews()` moved here too, and the homepage's `ReviewDueBadge` now
calls it instead of carrying its own copy of the counting — the single-source
rule applied to the one number the site chases you around with.

### 2. The hub's fourth column — `/practice`

The page now has two labelled bands: **"The warm-up — trivia with answer
keys"** (the three trainer cards, unchanged) and **"The real game — bets
reality grades"** (the journal's full-width card: headline gap, verdict,
divergence note once the counts can carry it, and `N logged · N scored · N due`
in the footer). The "Review first" banner takes the suggestion slot whenever
reviews are due. A visitor with journal data but no trainer data — previously
shown a bare invitation — now sees their real record regardless, because the
two bands render independently. The server prose and metadata now tell the
truth about what the page shows.

### 3. The essay — "Experience Doesn't Teach" (`/writing/experience-doesnt-teach`)

~7 minutes. Opens with the one calibrated profession and the pneumonia
contrast; names the loop (a number in advance, in writing; a fast unambiguous
outcome; a score — Brier, 1950; a thousand reps a year); gives your own
judgement the same audit and finds all three properties missing, with
hindsight bias as the cheating scorekeeper. Then Hogarth's kind and wicked
environments, the typhoid doctor, and why wicked-world experience compounds
confidence instead of skill ("seniority is measured in years; calibration is
measured in graded forecasts"). The hopeful turn is Lichtenstein & Fischhoff —
feedback training works, and fast — which converts the problem into
engineering: the three properties feedback needs (specific in advance, prompt
or scheduled, scored against what you *said*, not what you remember). The
trainers are an imported kind environment; the journal is the
wickedness-correction device; the hub now shows both scoreboards. The honest
limit gets its own section: the real-world sample stays small for years,
"did it go as expected?" is itself a judgement, and nothing fully closes the
gap — but coarse honest feedback beats vivid flattering feedback, and the
typhoid doctor had *abundant* feedback.

### 4. Wiring (the single-source dividend)

- **Feedback Loops model**: learning reframed as a feedback loop that only
  closes when output comes back scored; kind vs. wicked; wicked-world
  confidence as a positive feedback loop wearing the costume of experience.
  First essay attached to this model (it had none).
- **Calibration model**: the new essay joins `your-ninety-percent`.
- **`/start`**: the essay slots into "Deciding Well" right after "Your 90%
  Isn't 90%" — is your confidence honest, then why life will never tell you.
- **`/decide`**: footer names the hub as where your reviewed record appears.
- **Home**: the practice paragraph now says the page shows warm-up and real
  game together; "Updated" auto-bumped to July 3 from the new post.
- **Search**: the practice-hub Tool doc covers the real record, kind/wicked,
  reviews due; the journal Tool doc points back at the hub.
- **`/now`**: bumped to July 3, leading with today's work.
- **Sitemap/feed**: the essay flows through automatically, as always.

## Technical notes

- Build: **44 static pages** (was 43 — the new essay route). TypeScript and
  ESLint clean (0 errors, 0 warnings). Still zero runtime dependencies beyond
  Next/React.
- Verified `journal.ts` numerically against the *real* module with a
  stubbed-window harness — 38 checks across nine scenarios: empty, unreviewed
  (due/awaiting split), below-threshold counts, an overconfident record
  (claimed 80 / hit 50 → +30 pts), a calibrated one (gap 0), resulting
  divergences, shape drift (nulls, strings, wrong types), corrupt JSON, and an
  underconfident record (−40 pts, "underselling"). Two of my own test
  expectations were wrong on first run (the module was right both times) —
  the awaiting count and the divergence tally; both worth the embarrassment
  to have written down.
- Verified end-to-end in real Chromium (Playwright against `next start`) — 41
  checks: route/status smoke across the site; feed/sitemap carry the essay;
  the essay renders and sits in its reading path; fresh-visitor hub shows both
  bands with no banner; seeding two due entries flips the hub to "Review
  first" *and* the homepage badge to "2 decisions due" from the same shared
  module; seeding six reviewed decisions produces exactly the +30 pts
  headline, the "30 points less often" verdict, and the "3 of 6 reviews"
  divergence note; adding a trainer record with nothing due brings the
  "Practise next" banner back; `/decide?log=1` still works after the badge
  refactor.

## What I'd do next

- **The journal's numbers could feed the suggestion itself.** The hub now
  shows the real gap but still ranks only trainers for "practise next" when
  nothing's due. A real-world gap of +20 with a tidy trivia record is a strong
  argument for the calibration trainer — the wiring exists now; the heuristic
  doesn't.
- **A trend, not just a snapshot** on the hub (needs timestamped rounds — a
  real schema change, worth doing carefully). Now applies to the journal
  column too: is your real-world gap shrinking?
- **"Did you take the first move?" at review** — the journal asks for an
  if-then first step but never follows up on it; a yes/no at review would
  measure the decide→do gap the site wrote a whole essay about.
- **More pick-the-prior problems** (a hiring question, a health scare), and
  negative-result problems for the update trainer — both still good, both
  still queued.
- **A "your own record" reference class**: the journal now exposes exactly the
  data the pick-the-prior mode's deadline problem wants ("your last N
  forecasts ran X points optimistic") — one more read-side function away.

## Reflection

Today's build is small in surface area — one module, one card, one essay — and
it's the most thesis-central thing the site has shipped in weeks, because it
makes the site keep its own oldest promise. Every trainer has always ended
with "trivia is a warm-up; the journal is the game." Now the page that shows
your scores actually behaves as if that's true: the real record sits below the
warm-up with the better label, and when reality has graded one of your
forecasts, the site says *look at that first*. The two choices I'd defend
hardest are both restraints. First, **read-only again**: the journal owns its
log; the hub can render it but structurally cannot corrupt it, which is why
the riskiest thing shipped today — touching the most protected data on the
site — needed no migration and can't regress. Second, **mirrored thresholds
rather than new cleverness**: the hub says "2/3 went as expected" until the
journal itself would call it calibration, so no page on the site ever
disagrees with another about the same numbers. And the essay earns the
feature's place in the argument: the site's tools stop being three games and a
diary, and become one claim — experience doesn't teach; scored experience
does; here is the scoreboard, and here is why you had to build it.
