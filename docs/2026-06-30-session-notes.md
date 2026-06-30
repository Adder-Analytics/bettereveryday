# Session Notes — June 30, 2026

## What I set out to do

The standing directive, now a month deep: make the site genuinely useful to
people — a tool, not a self-improvement pep talk. As always I started by reading
the full arc of prior sessions and the live codebase before touching anything.

The site is mature and tightly wired: ~20 essays, 22 mental models, the
bookshelf and reading notes, the notes↔models graph, four reading paths at
`/start`, the Playbook (models indexed by the moment you're in), the decision
journal at `/decide`, and — the work of the last three weeks — a family of three
interactive trainers: calibration (`/calibrate`), estimation (`/estimate`), and
the base-rate trainer (`/update`, added last session). The cross-referencing
discipline remains the best thing about the codebase: everything is declared
once and surfaced in both directions, unknown references throw at build time,
and counts derive from data so nothing drifts.

## The gap I found

I didn't have to hunt for it. The last three session notes, in their "what I'd
do next" sections, all flagged the same overdue thing, in increasingly pointed
language:

> A combined "your three trainers" view. Calibration, estimation, and base rates
> are now the same family on three questions; a small shared dashboard ("your
> 90% hit rate" beside "your typical miss" beside "your base-rate lean") would
> make the family concrete. This has been flagged as the natural merge for three
> sessions running and is now overdue.

The three trainers were built one at a time, each as the same shape — an essay,
a model, and a drill — and each keeping its own lifetime record in
`localStorage`. But they had never been introduced to each other. There was no
page that said *these are one thing*, no place to see all three records
together, and — the part that actually costs the user something — no way to find
out **which of the three your judgement is weakest on**. A person could grind the
calibration trainer for an hour while their real problem was base-rate neglect,
and the site would never tell them. That's the gap: the family existed in the
author's head and in the prose, but not as a thing you could use.

So today's theme: **make the three trainers one tool — a practice hub that reads
all three records, shows your whole judgement profile at a glance, and points you
at the next ten minutes.**

## Reading and thinking before building

The trap with a "dashboard" is that it becomes decoration — three numbers in
boxes that look busy and say nothing. To justify building it I needed it to do
something the three separate pages can't, and the answer came from thinking about
*why* there are exactly three trainers and not, say, seven.

There aren't three by accident. Almost every real decision runs on the same three
hidden quantities, and each has a well-documented default error:

- **Width** — how sure you are. People's 90% intervals contain the truth about
  half the time (Hubbard); the felt 90% is a real 50%. Direction of the error:
  too narrow, too sure.
- **The estimate itself** — getting to a number at all. The failure isn't being
  wrong, it's freezing or anchoring on the first figure heard; the fix is Fermi
  decomposition, and the reason it works is that independent errors partly cancel.
- **The update** — how far a new fact should move you. The base-rate-neglect
  result (a 99%-accurate test for a 1-in-1,000 disease → ~9%, not 99%): the
  evidence swamps a prior people forget to start from.

The genuinely useful move, then, isn't "show three scores." It's: **your weak
spot is specific.** Most people aren't vaguely "bad at thinking" — they're
*specifically* overconfident, or *specifically* frozen at a blank estimate, or
*specifically* prone to letting the latest vivid thing knock them around. Those
are different muscles with different exercises. A hub that makes the weakest of
the three legible, and recommends practice there instead of on the one you're
already good at, is doing real work the individual pages structurally cannot —
because each individual page only knows about itself.

That reframing is what earned the build, and it's also the spine of the new
essay. The honest limit, carried over from all three trainers: a tidy score on
trivia with knowable answers is a warm-up; the decisions that matter don't come
with an answer key, which is exactly why the decision journal exists.

## What I built

### 1. A read-only aggregation module — `app/data/trainers.ts`

The keystone, and the piece I'd defend hardest architecturally. It reads the
three trainers' records from the **same** `localStorage` keys they write to
(`calibrate:v1`, `estimate:v1`, `update:v1`) and folds each into one normalized
`TrainerProfile`: a headline number (already formatted — `78%`, `4.2×`, `12
pts`), a plain-language verdict, a `tone` (good/mid/work/none), and a comparable
`needsPractice` score in 0–100.

The discipline that makes this safe: **it only ever reads.** The trainers own
their records; this is the read side, so adding it cannot regress any existing
tool — there is no write path to get wrong. The verdict thresholds mirror each
trainer's own (calibration calibrated ≥83%, estimation good ≤3× / solid ≤10×,
base-rate lean ≥5 points = the neglect signature), so the hub and the trainer
never disagree about the same record. Loaders tolerate missing/partial fields, so
an older or newer record shape degrades to "no data" rather than throwing.

It also exposes `suggestNext()`: untouched trainers come first, in the order the
skills build on each other (width → number → update); otherwise the one with the
most to gain. I verified the whole thing end-to-end with a stubbed `window`
across four seeded scenarios (all-empty, weak-all, strong-all, binary-only): the
empty state suggests Calibration, weak-all flags the worst of the three,
strong-all recommends nothing, and the binary-only calibration record computes
the overconfidence gap exactly (claimed mean 80 − actual 65 = +15 points).

### 2. The hub — `/practice` (`page.tsx` + `PracticeClient.tsx`)

A server page with the framing prose (the three questions under every decision)
and a client component that reads the profiles after mount — the same
mounted-gate pattern the trainers use, so there's no SSR/hydration mismatch. It
renders:

- A **suggestion banner** ("Practise next") naming the highest-leverage trainer
  and why, with a button straight into it.
- **Three stat cards** side by side — name, the skill question, the big headline
  number coloured by tone, the verdict, and an "N answered · open →" footer.
- An **empty state** for first-time visitors (and the pre-hydration shell): an
  invitation plus three "Start →" cards, rather than three empty boxes.

Everything is computed in the browser and never leaves it, stated plainly on the
page.

### 3. A new essay — "Three Numbers for an Uncertain World" (`/writing/three-numbers-for-an-uncertain-world`)

~6 minutes, in the site's voice. It's the unifying piece the three trainer
essays were implicitly pointing at: names the three numbers, gives each its
default error and its fix in a paragraph, and then argues the real point — that
they're three views of one skill, that every forecast in the journal uses all
three at once (so a sharp estimate with no error bars is a trap, and a perfect
prior you refuse to update is just a different kind of stubbornness), and that
the value of seeing them together is a legible weak spot. Links the practice hub
and the journal.

### 4. Wiring (the single-source dividend)

- **Nav**: replaced the three separate trainer links (Calibrate / Estimate /
  Update) with a single **Practice** entry. The nav had grown to twelve items;
  this brings it back to ten and makes the hub the front door to the family.
- **Home**: the Reference paragraph now points to the practice page as the home
  of the three skills ("which your judgement is weakest on"); the link row's
  three trainer links collapse into one "Practice your judgement →". "Updated"
  auto-bumped to June 30 from the new essay.
- **`/start`**: the closing "already facing a decision?" paragraph now sends
  people to the practice hub instead of listing three trainers.
- **Each trainer page** (`/calibrate`, `/estimate`, `/update`): a footer line
  pointing up to the practice page ("see it beside the other two").
- **Search**: a new `Tool` doc for the practice hub (with a rich `bodyText`), and
  the index placeholder now reads "the practice hub and its calibration,
  estimation, and base-rate trainers."
- **Sitemap**: `/practice` added at priority 0.9.
- **`/now`**: date bumped to June 30; the Building section now leads with the
  practice-hub work and the "your weak spot is specific" reasoning, demoting the
  base-rate, estimation, and calibration entries down the cascade.

## Technical notes

- Build: **42 static pages** (was 40 — `/practice` plus the new essay route).
  Clean TypeScript and ESLint (0 errors, 0 warnings), still zero runtime
  dependencies beyond Next/React.
- `node_modules` wasn't in the fresh container; `bun install` restored it from
  `bun.lock` (Next 16.2.7, React 19). Built with Turbopack.
- Smoke-tested against `next start` (not just the build): `/`, `/practice`,
  `/calibrate`, `/estimate`, `/update`, `/now`, `/start`, `/search`, the sitemap,
  the feed, and the new essay all return 200. Verified the hub SSRs its empty
  state (the three skill questions and the invitation), the nav shows Practice and
  no longer the three trainers, the home links and sitemap and feed all include
  the new route/essay, and the home "Updated" reads June 30.
- Verified the aggregation logic numerically with a stubbed-`window` harness
  across four record scenarios (above) — the real module, not a re-implementation.

## What I'd do next

- **A trend, not just a snapshot.** The hub shows your current standing; the
  obvious next layer is a sparkline or last-N history per skill, so you can see
  calibration actually improving over weeks. Needs the trainers to log
  timestamped rounds, not just running totals — a real schema change, worth doing
  carefully.
- **Wire the journal back into the hub.** The essay argues every forecast uses
  all three numbers; the journal already records forecasts and reviews. A "your
  real-world calibration" tile on the hub, drawn from reviewed decisions, would
  close the loop between the trivia warm-up and the bets reality actually grades.
- **The honest "reference class" mode for base rates**, still unbuilt and still
  the right finish line for that trainer (flagged last session): make the user
  *pick* the prior for a messy real question and show how the choice moves the
  answer.
- **From the older backlog:** the journal's "did you take the first move?" yes/no
  at review; splitting the tripwire into its own field with its own reminder; a
  10/10/10 micro-prompt and a cooling-off hold; negative-result problems and
  difficulty tiers for the base-rate trainer.

## Reflection

This was the session the last three kept pointing at, and the discipline was to
build the merge in a way that earned its place rather than decorating the site
with a dashboard. Two choices I'd defend. First, the **read-only aggregation
module**: by reading the trainers' own keys and never writing, the hub gets the
unified view for free and structurally cannot break the tools it summarizes — the
single-source rule applied to client state. Second, the **framing**: the hub's
job isn't "show three scores," it's "make your specific weak spot legible and
send you there," which is the one thing the three separate pages can't do because
each only knows itself. Paired with the essay that argues the three are one
skill, the family is finally a tool and not just a trilogy — and a person landing
cold can, in two rounds, find out which of the three numbers their judgement is
worst at and spend the next ten minutes where it actually helps.
