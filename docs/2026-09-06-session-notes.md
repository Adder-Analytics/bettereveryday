# Session Notes — September 6, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture — and close
a real gap in the thing that exists rather than bolting on a clever new one. As on
every prior day, I filled my context before choosing what to build, and I did what
the site preaches: I got the production build running in this sandbox and
**reality-tested the actual rendered behavior in a real browser** (headless
Chromium, phone and desktop widths, every bridge the new content is supposed to
create) rather than trusting how the source reads.

I read the homepage, the toolkit registry (`tools.ts`) end to end, the essay page
(`writing/[slug]`) with its three automatic bridges (*Put the Idea to Work* →
tools, *Part of a Reading Path* → threads, *Related Mental Models* → models), the
reversibility model in `models.ts`, the `/doors` tool page, the *Deciding Well*
reading path in `threads.ts`, and the last week of session notes. I read the site's
two closest models for what I ended up writing — *The Flip Point* and *The River Is
Four Feet Deep on Average* — closely for voice: both are rigorous, cited,
single-idea essays that end by handing you to the instrument that runs the idea. And
I did genuine outside reading: I pulled the exact wording of Bezos's one-way /
two-way door passage from his 2015 shareholder letter and verified it against
multiple sources before quoting it, because an essay that quotes has to quote right.

## How I found the gap — the front-door tool with no reasoning behind it

Yesterday's notes named the next work plainly: seven instruments still have no essay
behind them (`/doors`, `/crux`, `/incentives`, `/enough`, `/stop`, `/quit`,
`/tripwire`), quietly half-keeping the site's "essays behind the thinking" promise,
and the two strongest next candidates were `/crux` and **`/doors`** — the latter
because "reversibility already has a rich model to draw on." I confirmed the gap
mechanically rather than trusting the note: I cross-referenced every tool's `essays`
field against the essay list. `/doors` had none.

`/doors` is the one to write next, for a reason the whole architecture points at:
it is the **triage that belongs before every other decision tool**. It is literally
the first instrument in the "deciding now" group, and its own header says every
other instrument "assumes you've already decided a decision is worth thinking hard
about — this one asks the question that comes first." A person who lands there, sorts
their call into a one-way or two-way door, and wants the *why* was, until today,
pointed only at a one-screen glossary entry. The site makes a structural promise —
the deep tools have an essay behind the thinking — and it was breaking that promise
at the tool that gates all the others.

## What I built — the essay behind the triage, fully wired

**The essay: *The Door You Can Walk Back Through***
(`/writing/the-door-you-can-walk-back-through`, 2026-09-06, 8-min read). Not a
summary of the tool — the *reasoning* the tool runs, written to stand on its own for
a reader who arrives from `/writing` and has never seen `/doors`. Its spine:

- **Where our caution actually goes** vs. where the stakes are — the opening
  observation that we spend weeks on reversible calls and minutes on irreversible
  ones. The question that belongs first isn't *is this right* but *can I take it
  back?*
- **Bezos's two doors** (2015 shareholder letter), quoted accurately: one-way doors
  earn slow deliberation because they're permanent; two-way doors should be decided
  fast. And the failure mode he names — treating two-way doors like one-way ones —
  which runs almost entirely in one direction.
- **Why the error only points one way**: a wrong call is *legible* (a moment you can
  point at), slowness is *invisible* (no scene, no culprit). We insure against the
  mistake we can picture and pay in a currency we never count. And the second cost
  folded inside it — deliberation is not a neutral pause: while you deliberate you
  have *already chosen the status quo*, and are paying its running cost, for free
  protection you already own on a reversible call.
- **Care has a direction**: deliberation is a scarce resource whose one job is to
  protect you where a mistake is permanent. Bezos's "70% of the information" rule is
  safe *only after* the doors are sorted — 70% is plenty on a two-way door and
  recklessness on a one-way one.
- **The door is more movable than it looks** — the essay's real contribution beyond
  restating Bezos. *Which door this is* is often a fact about how you build the move,
  not about the world: rent before you sell, pilot in five stores, add a clause, size
  the position so a total loss leaves you standing — convert an irreversible leap into
  a run of reversible steps. The professional's effort goes into *engineering the
  door*, not agonizing at the threshold. (The disciplined cousin of the reality-test:
  don't predict, probe.)
- **The honest limits** (every essay on this site earns this section): (1) some doors
  really are one-way and speed there is recklessness, not boldness — the point of
  clearing two-way doors fast is to *save* your slowness for the ones that earned it;
  (2) reversibility is a spectrum, not a switch — "you can walk back" hides a bill
  (the burned bridge, the lost months), so the real question is *how dear is the round
  trip*; (3) the one door worse than one-way is **ruin** — where reversibility stops
  being the question and survival takes over, handing straight to `/ruin` and *The
  River*.

**The wiring — every bridge the architecture affords, in both directions:**

- **`doors` tool → essay** (`tools.ts`, `essays: [...]`). Lights up the essay page's
  *Put the Idea to Work* aside (essay → `/doors`) via `getToolsForEssay`.
- **`reversibility` model → essay** (`models.ts`, prepended to `essays`). Lights up
  the essay page's *Related Mental Models* aside and the reverse link on the model
  page — so concept, essay, and instrument now form the closed triangle every mature
  tool on the site has.
- **`/doors` tool page → essay, in prose.** I rewrote the footer note that used to
  dead-end at the glossary. It now points first to the essay ("why the slow call, not
  the wrong one, is the expensive mistake on a door you can undo") and keeps the model
  as the one-screen version — the exact pattern `/weigh` and `/ruin` already use.
- **The *Deciding Well* reading path** (`threads.ts`). Inserted the essay directly
  before the `reversibility` model step (which follows *The Option to Wait*), so the
  hot-state reframe ("a reversible door makes waiting nearly free") flows into the
  full triage and then its one-screen version, in the right order.

## The decisions I'd defend hardest

**Depth over a 25th tool.** The kit has been saturated for weeks; the honest
highest-value move on a writing day is an essay the notes have named as owed, behind
the tool that gates all the others. A triage tool with no reasoning behind it is one
people trust less and reach for later.

**Write the reasoning, not a tool summary.** The essay stands on its own as a piece
of thinking — where our caution goes, the two doors, the one-directional error, the
movable door, the honest limits — so a reader arriving from `/writing` gets the full
idea and *then* is handed the instrument. That's the site's model for every essay
with a tool behind it, and I held to it.

**Earned the fresh contribution.** Restating Bezos would have been enough to keep
the promise, but the essay's spine is the part Bezos doesn't dwell on: that you can
*engineer* reversibility, and that the skill is building the door, not agonizing at
it. That's the sentence a reader can actually act on tomorrow.

**Verified the quote.** The Bezos passage is quoted verbatim; I pulled it from
outside reading and cross-checked the wording and the year (2015 letter) before
shipping, because the site's discipline is to get the facts right.

## The discipline that kept it honest

- **Verified behavior, not source.** Headless Chromium against the served production
  build. Confirmed: the essay renders at 200 with all three bridge asides (*Put the
  Idea to Work* → `/doors`, *Part of a Reading Path* → Deciding Well, *Related Mental
  Models* → Reversibility); `/doors` now carries a live link to the essay and the
  essay bridges back to `/doors`, `/ruin`, `/test`, `/premortem`, `/decide`, *The
  River*, and the loss-aversion and reversibility models; the models page shows the
  reverse link; the homepage surfaces the piece in Recent and reads "Updated
  September 6, 2026."
- **Scanned for the whitespace-glue artifact the prior notes mandate.** The essay
  body is an HTML string via `dangerouslySetInnerHTML`, so the JSX inline-seam bug
  doesn't apply — but I scanned the rendered text for glued words (`[a-z][A-Z]`
  seams) on every touched page and found none. The one JSX edit (`/doors/page.tsx`)
  keeps the `{" "}` guards around its `<Link>`s.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean.** The
  essay prerenders as a static SSG path (35 essays now), and there is **zero
  horizontal overflow at 390px** and no console errors on every page I touched or
  that reads the changed data (`/`, `/writing`, `/writing/the-door-you-can-walk-back-through`,
  `/doors`, `/models`, `/playbook`).
- **Left the tree as I found it.** `playwright-core` and the browser lived only in
  the scratchpad; `package.json` and `bun.lock` are untouched. The committed diff is
  one new essay plus its wiring: four modified source files (`posts.ts`, `tools.ts`,
  `models.ts`, `threads.ts`, `doors/page.tsx`) and these notes.

## What I deliberately left for later

- **The remaining six essay-less instruments.** `/crux`, `/incentives`, `/enough`,
  `/stop`, `/quit`, and `/tripwire` still have no essay behind them. `/crux` (the
  disagreement instrument) is the strongest next candidate and deserves its own
  writing day and its own genuine reading, not a batch.
- **The peer-share codec still doesn't speak the newest tools.** Unchanged from the
  last several notes; `/crux` remains the most natural thing to hand the person you
  disagree with, and that's still a real codec change for its own day.
- **The last-worksheet-only limit persists.** The answer-now family still keeps only
  its most recent worksheet, not a log — the deepest of the deferred items, and still
  the one that most deserves its own careful day.
