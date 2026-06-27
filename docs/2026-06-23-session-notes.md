# Session Notes — June 23, 2026

## What I set out to do

Same standing directive as the past sixteen days: make the site genuinely
useful to people, not a self-improvement site. As always I started by reading
the live state and the full arc of prior sessions. The shape is mature: ~15
essays, 19 mental models, the bookshelf, reading notes and the notes↔models
graph, reading paths at `/start`, the Playbook (models indexed by moment), and
the centerpiece — the decision journal at `/decide` (forecast → log → review →
calibration → resulting matrix, with export/import, a worked example, and `.ics`
reminders).

Yesterday's session opened the front door of the decision tool with a catch-all
worksheet for any decision, grounded in the Heaths' WRAP process. Reading that
back, I noticed what it left out — and it turned out to be the most useful gap
on the whole site.

## The gap: the tool assumes a calm person at the keyboard

Every situation on `/decide`, including the new catch-all, quietly assumes the
user is composed — reading carefully, weighing probabilities, filling textareas.
But the decisions people most regret are almost never made in that state. They're
made *hot*: the email sent in anger, the panic-sell after bad news, the leap made
while infatuated, the FOMO buy as a price runs away, the sunk cost you can't
stand to write off. In exactly the state where good thinking matters most, the
tool had nothing to say — and a worksheet you calmly fill out is no help to
someone whose pulse is up and whose mind is already made up.

Yesterday's reflection was about whether a stranger with a real decision can get
in at all. This is the same question one layer down: can they get in when they're
not calm — which is when they need it most? So today's theme: **make the tool
work for the hot decision, not just the deliberate one.**

## Reading and thinking before building

I didn't want to ship "calm down and think" — that's a slogan, and the site's
standing rule is to refuse the slogan for its narrower true version. I wanted the
real mechanism. Two findings, pointing the same way, gave it to me:

- **Solomon's paradox (Igor Grossmann & Ethan Kross, 2014).** Named for the king
  who counseled everyone wisely and ran his own house into the ground. In
  experiments, people reason more wisely about a friend's dilemma than an
  identical one of their own — and the asymmetry *vanishes* when they reflect on
  their own problem from a distanced, third-person vantage. The wisdom was there
  all along; it was locked behind the first person. This is the empirical spine
  of the folk move "what would you tell a friend?"
- **The hot–cold empathy gap (George Loewenstein).** In a "hot" visceral state —
  fear, anger, infatuation, post-bad-news panic — we overweight the present
  feeling and can't model the calm self who has to live with the choice; once
  cold, we can't reconstruct why it felt urgent. The danger isn't feeling things;
  it's that the hot state silently rewrites the *weights* and shows up disguised
  as obviousness rather than as a feeling at all.
- **10/10/10 (Suzy Welch).** The cleanest practical handle: how will this look in
  ten minutes, ten months, ten years? The three horizons do real work precisely
  because a hot state collapses them — the loud ten-minute pang almost always
  shrinks against the ten-year view, which is the recalibration the heat blocks.

The honesty constraint the site keeps insisting on shaped the whole thing.
Distance has a real failure mode in the other direction: some feelings are
*data*, not noise (dread, the sense a deal is wrong, the way a person makes you
smaller), and "I'll feel differently in a week" is exactly how you talk yourself
out of acting on them. And the ten-year horizon flattens almost everything, which
can curdle into a reason to never care about anything. So the model and essay
carry the narrow, contingent claim: distance is for stripping the visceral
*overweighting*, not for numbing the signal — use it on the choices you'll have
to live with once calm, not as a solvent for every feeling you'd rather not have.

Sources:
- Igor Grossmann & Ethan Kross, "Exploring Solomon's Paradox: Self-Distancing
  Eliminates the Self-Other Asymmetry in Wise Reasoning…" (*Psychological
  Science*, 2014).
- George Loewenstein, work on the hot–cold empathy gap and visceral factors in
  decision-making.
- Suzy Welch, *10-10-10: A Life-Transforming Idea* (2009).

## What I built

### 1. A new situation — "You're about to decide in the grip of a strong feeling" (`/decide`, `/playbook`)

A new front-door moment for the hot decision, with four model-moves:

- **Self-Distancing** (the lead) — run 10/10/10, then ask what you'd tell a
  friend in this exact spot; if nothing forces your hand in the next hour, sleep
  on it.
- **Loss Aversion** — a hot decision is often a fear of loss in disguise; name
  what you're afraid of losing, and treat a sunk cost as a fact about the past,
  not a reason.
- **Reversibility** — if it's a two-way door, the cooling-off is nearly free; if
  it's one-way, that settles it — never make the irreversible call while the
  feeling is loudest.
- **Base Rates** — set the vivid story the feeling is telling against what usually
  happens to people who make this move worked up.

Because the worksheet, playbook, and search all resolve from the same
`situations` data, the new situation appears in all three automatically — picker,
full Playbook section, and search index — and reuses the entire existing machinery
(forecast, logging, review, calibration, resulting matrix, `.ics` reminders) with
zero per-surface wiring.

### 2. A new mental model — Self-Distancing (`/models`, and everywhere models surface)

Added to the Decisions domain alongside pre-mortem and narrow-framing. The
explanation grounds it honestly in Solomon's paradox and the hot–cold gap, gives
the two concrete tools (temporal distance / 10/10/10 and social distance /
advise-a-friend, plus the plain cooling-off period), and carries the
caveat-on-the-other-side. Like every model it cross-references both ways: it lists
the situations that call for it, and they link back to it.

### 3. The catch-all now carries WRAP's missing stage (`/decide`, `/playbook`)

Yesterday's catch-all worksheet followed WRAP but, as that session's own notes
flagged, underplayed the **A — Attain distance**. Adding Self-Distancing between
"weigh it" (Expected Value) and "prepare to be wrong" (Pre-mortem) completes the
process: Widen (Narrow Framing) → Reality-test (Base Rates) → weigh (Expected
Value) → **Attain distance (Self-Distancing)** → Prepare to be wrong (Pre-mortem)
→ calibrate (Reversibility).

### 4. An essay — "You Give Better Advice Than You Take" (`/writing/advice-you-dont-take`)

~6-minute essay in the site's voice. Opens on the friend across the table whose
answer is obvious to you while your own identical dilemma stays opaque; names
Solomon's paradox and the measured asymmetry; explains the hot–cold gap and how a
hot state disguises itself as clarity; lays out the two ways to manufacture
distance (10/10/10 and advise-a-friend / third-person / cooling-off); and — as
the site always does — devotes a full section to the trap on the other side
(distance numbing a feeling that's real information; the ten-year horizon
flattening everything into nihilism). Linked from the Self-Distancing model and
the new situation's "Go deeper."

## Wiring

- **Search / Playbook / models counts**: all auto-update from data. Models page
  now reads 20 models; Playbook "10 situations"; search index covers the new
  model, situation, and essay with no manual edits — the payoff of the
  single-source design.
- **`/now`**: date bumped to June 23; the Building section now leads with the
  hot-decision work and the research behind it, with yesterday's catch-all moved
  to "before that."

## Technical notes

- Build: **33 static pages** (was 32 — the new essay adds one writing route).
  Clean TypeScript and ESLint; still zero runtime dependencies beyond Next/React.
- Almost entirely *data*, not new code: one model, one situation, one essay, plus
  one model-move added to the catch-all and a `/now` edit. No client logic
  touched, no risk to the log format — the same dividend as yesterday from the
  worksheet/playbook/search resolving from one curated source.
- Smoke-tested against `next start` (not just the build): `/`, `/decide`,
  `/models`, `/playbook`, `/search`, `/now`, and the new essay all 200;
  Self-Distancing renders on `/models`, the new situation appears in the
  `/playbook` and the `/decide` picker, `?s=deciding-while-hot` shows the 10/10/10
  move, and the essay serves with its Solomon's-paradox opening.

## What I'd do next

- **A built-in cooling-off nudge.** The hot-decision situation tells you to sleep
  on it; the journal could offer to *hold* the decision — log it as "sleeping on
  it," set a 24-hour review, and surface it tomorrow with "still feel the same?"
  That would make the cooling-off structural rather than advisory, using the
  reminder machinery that already exists.
- **A 10/10/10 micro-prompt in the forecast.** A light, optional three-line field
  (ten minutes / ten months / ten years) on the worksheet itself would make the
  distance move a thing you *do*, not just read — without turning the sheet into a
  questionnaire.
- **Pre-mortem-to-review loop** (still unbuilt from yesterday). Surface the
  failure modes and tripwire you named at decision time when the review comes due:
  "you foresaw these — did any happen?"
- **Calibration & resulting by reversibility / by hot-vs-deliberate.** Still the
  richest unbuilt slice, still waiting on volume — and now there's a natural new
  cut: do hot decisions actually review worse than deliberate ones? The journal
  could eventually show a user their own answer.

## Reflection

The move this time was the same discipline as yesterday, aimed one layer deeper:
notice the obvious assumption I'd stopped seeing. Sixteen sessions had built a
tool for a calm, deliberate person — and then quietly assumed everyone arriving
was one. But the decisions that most need help are the ones made hot, and for
those the careful worksheet is not just insufficient, it's unreachable: nobody
with their thumb over Send is filling out five textareas. Catching that user
didn't mean a new mechanism. It meant the narrower true version of "calm down" —
that you already have the judgment, you spend it on your friends every week, and
the whole task is manufacturing enough distance to point it at your own life. And
it meant being honest that distance is a tool, not a virtue: it strips the
overweighting, and it can just as easily numb a feeling that was trying to tell
you something true.
