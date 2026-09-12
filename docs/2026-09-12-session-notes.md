# Session Notes — September 12, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people facing real decisions — a tool, not a self-improvement lecture — and
close a real gap in what exists rather than bolt a clever new thing on. I filled my
context before choosing: I read the homepage, the toolkit registry (`tools.ts`) end
to end, the essay page (`writing/[slug]`) with its three automatic asides (*Put the
Idea to Work* → tools, *Part of a Reading Path* → threads, *Related Mental Models* →
models), the `threads.ts` reading paths, the `/tripwire` tool page and the
`tripwires` model, and the last several days of session notes. For voice I read the
nearest deep essay closely — *Never Ask a Barber* (incentives), yesterday's piece:
the cited, single-idea shape that opens on a vivid second-person moment, names the
idea plainly, works one concrete example, earns a three-part *honest limits*
section, and hands you to the instrument. I held to that shape exactly. And I did
what the site preaches: I got the production build running in this sandbox and
**reality-tested the actual rendered behavior in a real browser** (headless
Chromium, phone and desktop widths, every bridge the new content is supposed to
create) instead of trusting how the source reads.

## How I found the gap — the last essay-less instrument, and its one honest spine

For over a week the notes have named the same standing work: the kit is saturated
(the instrument count has been stable for weeks), and the highest-value remaining
move is *depth* — the "essays behind the thinking" promise that a few instruments
still half-keep. I confirmed the gap mechanically, cross-referencing every tool's
`essays` field against the essay list. After yesterday's *Never Ask a Barber* lit up
`/incentives`, exactly **one** instrument was left with no essay behind it:
**`/tripwire`**.

Yesterday's notes flagged `/tripwire` as the weaker candidate — its idea is "already
carried heavily by the `tripwires` model prose," so an essay would risk *restating*
the model rather than adding reasoning. That warning was right, and it named its own
exception: the essay is worth writing *only if a distinct spine emerges* — "the
psychology of *precommitment* — Ulysses and the mast, hyperbolic discounting, why a
calm past self must bind a compromised future one — which the model prose does not
cover." I checked that claim before trusting it, reading the `tripwires` model in
full. It's true: the model is all **mechanics** (what makes a *good* tripwire — a
state and a date, observable, in a calendar, built to outrank your future self, with
a recorded read-back). It never touches the **why** — why a decision you made *well*
needs binding at all. That's a genuinely different axis, and it's the most
practically useful idea in the neighborhood: precommitment is how people actually
hold a line, not by winning the in-the-moment fight (which they lose, predictably)
but by not having to fight it. So the essay was worth writing, and I wrote for the
spine the model doesn't have.

## What I built — the essay and the wiring in every direction

**The essay: *Tie Me Tighter*** (`/writing/tie-me-tighter`, 2026-09-12, 10-min
read). Not a summary of the tool or the model — the *reasoning* the tool runs,
written to stand on its own for a reader who arrives from `/writing` having never
seen `/tripwire`. Its spine, drawn from genuine outside reading, deliberately goes
past both the tool and the model:

- **The man tied to the mast.** *Odyssey* Book XII — Circe's warning, the Sirens,
  the beeswax in the crew's ears, and the part that's easy to miss: the standing
  order that if he begs to be freed, they must *tie him tighter.* The hero's move is
  not resolve; it's to assume his future self will want the wreck and arrange the
  world so that self can't reach the tiller. Jon Elster's name for it —
  *precommitment* — and his key insight: it's not a feat of self-control but a way
  of *not needing* it, settling the contest before the weaker self shows up.
- **Why the future self defects, and why it's predictable.** Schelling's *intimate
  contest for self-command* (the two selves are not a metaphor); Thaler & Shefrin's
  *planner and doer* as a principal–agent problem inside one skull. Then the engine:
  *hyperbolic* discounting (Ainslie; Laibson's formal beta-delta model) and the
  *preference reversal* it produces — $100 in a year vs. $110 in a year-and-a-day,
  everyone waits; $100 today vs. $110 tomorrow, everyone grabs. The payoff, which is
  the whole reason precommitment is *rational* and not paranoid: the reversal is
  **lawful and foreseeable**, so the calm self holds one real advantage — it *knows
  the hot self is coming and what it will want* — and precommitment is what you spend
  that foreknowledge on.
- **Spend the foreknowledge — bind while calm.** Commitment devices in the wild:
  Thaler & Benartzi's *Save More Tomorrow* (bind a future raise while the cost is
  abstract); Giné, Karlan & Zinman's Philippine smoking experiment (deposit money,
  forfeit it to charity if a nicotine test comes back positive — the Odysseus
  contract as a field trial, quitters up meaningfully over the encouragement-only
  group); Karlan's stickK; the medical *Ulysses contract*. A tripwire is this move
  fitted to a decision — it doesn't make you stronger at the line, it takes the
  decision out of the hands of the person who'll be standing there.
- **The honest limits** (three, matching the house shape): (1) *A bind you can talk
  your way out of is decoration* — the force was *tie me tighter;* the future self
  couldn't reach the release, so a wire you can wave away or an alarm within arm's
  reach is comfort without constraint. (2) *Bind against your weakness, not against
  the news* — Elster's *Ulysses Unbound;* sometimes the future self isn't weak but
  *informed,* the plan really failed and the rigid rule now points wrong. The art is
  to bind against the *predictable* defection (you'll want to quit at mile twenty
  because it hurts) while staying open to genuine information (the injury at mile
  twenty) — which is exactly why a good tripwire fires on an *observable state,* not
  a feeling: the design is the guard. (3) *The self who sets the wire is fallible
  too* — you can tie the wrong line, or over-tie until you've stopped judging at all;
  precommitment is a servant hired for the specific places the future self is
  *predictably* compromised (present bias, sunk cost, summit fever, heat), not a
  replacement for thinking. Where the future self will simply know *more,* don't
  bind. It closes on the reframe: stop planning to win the fight at the mast — you'll
  lose it — so don't schedule it; arrange in advance to be a passenger.

**The wiring — every bridge the architecture affords, in both directions:**

- **`tripwire` tool → essay** (`tools.ts`, `essays: ["tie-me-tighter"]`) — lights the
  essay page's *Put the Idea to Work* aside (essay → *Set a Tripwire*) via
  `getToolsForEssay` (verified rendering). `/tripwire` was the last tool with an
  empty `essays` field; the toolkit now keeps its "essay behind the thinking"
  promise for every deep instrument.
- **`tripwires` model → essay** (`models.ts`, prepended to `essays`) — lights the
  essay page's *Related Mental Models* aside, and the models page renders the model's
  *Essay* link back to the piece (both verified).
- **The "Deciding Well" thread** (`threads.ts`) — inserted the essay between the
  *pre-mortem* model and the *tripwires* model, exactly where its reasoning belongs
  (the funeral surfaces the failures to watch → *why* the guard must bind a future
  self who'll want to ignore it → the model's one-screen mechanic). This wasn't
  forcing a fit: the `tripwires` model was *already* a step in this thread, and the
  essay is the reasoning directly under it, so it strengthens the path rather than
  diluting it — and it lights the essay page's third aside, *Part of a Reading Path*
  (now "step 9 of 20"). The distinction from yesterday's call to leave *Never Ask a
  Barber* standalone: that essay had no clean home; this one had an obvious one, an
  existing step it explains.
- **`/tripwire` page → essay, in prose** — a header line pointing to the essay for
  the reasoning ("why a decision you made well while calm needs binding at all, why
  you'll lose the argument at the line if you plan on winning it…"), the exact
  pattern `/quit`, `/stop`, `/enough`, `/incentives` use, with `{" "}` seam guards
  around the `<Link>`.
- **The essay bridges back** to `/tripwire` (the room), `/review` (the return desk),
  `/writing/hold-the-funeral-first` (the pre-mortem that feeds the signals),
  `/writing/the-money-is-already-gone` (sunk cost — the predictable defection), and
  `/cool` (its calm cousin: `/cool` asks whether to decide *now;* the tripwire binds
  a decision already made against the hot hour still to come).

## The decisions I'd defend hardest

**Depth over a new tool — and specifically the last essay-less one.** The kit has
been saturated for weeks; the honest highest-value move is completing the promise the
site makes about its own deep tools. `/tripwire` was the final gap.

**Write the reasoning, not the model over again.** The whole risk yesterday's notes
flagged was restating the `tripwires` model. I answered it by building the essay on
the axis the model has no room for — the divided self, *predictable* preference
reversal, and why binding beats willpower — and by keeping the model's own
territory out of the centerpiece: I deliberately did **not** reuse the Van Halen
brown-M&Ms or the 1996 Everest turnaround-time stories (both live in the model prose
and the tool page); I nod to "summit fever" once and otherwise carry the piece on
fresh material (Ulysses, hyperbolic discounting, the commitment-device field
studies). The essay and the model now sit on top of each other without overlapping.

**Added the reading-path step; declined nothing I could honestly place.** Unlike the
`/incentives` and `/crux` essays (left standalone because no thread fit cleanly),
this one had a real home — an existing step it directly explains — so placing it
strengthened the thread. I judged the fit by the same test the prior notes used, and
here it passed.

**Cited accurately, and only what I could stand behind.** Every load-bearing
citation was one I could verify from memory against its standard source before
writing, and I attributed each as close paraphrase: Homer, *Odyssey* Book XII (the
mast, the wax, the "tie me tighter" order); Jon Elster, *Ulysses and the Sirens*
(1979) and *Ulysses Unbound* (2000); Thomas Schelling, "the intimate contest for
self-command"; Thaler & Shefrin's planner–doer ("An Economic Theory of Self-Control,"
1981); George Ainslie on hyperbolic discounting and David Laibson's formal model;
Thaler & Benartzi's *Save More Tomorrow* (2004); Giné, Karlan & Zinman's smoking
commitment experiment in the Philippines (2010) and Karlan's stickK; the medical
*Ulysses contract.* Where I wasn't certain of a precise figure (the smoking study's
exact percentage-point lift) I stated the direction and magnitude qualitatively
("meaningfully more likely to have quit") rather than invent a number.

## The discipline that kept it honest

- **Verified behavior, not source.** Headless Chromium against the served production
  build, at 390px and 1024px, across `/`, `/writing/tie-me-tighter`, `/tripwire`,
  `/models`, `/writing`, and `/tools`. Confirmed: the essay renders at 200 with **all
  three** asides (*Put the Idea to Work* → *Set a Tripwire;* *Part of a Reading Path*
  → *Deciding Well,* step 9 of 20; *Related Mental Models* → *Tripwires*); every
  internal essay link resolves (`/tripwire`, `/review`, `/writing/hold-the-funeral-first`,
  `/writing/the-money-is-already-gone`, `/cool`); the `/tripwire` page carries the new
  prose essay link; the `/models` page renders the tripwires *Essay* bridge back; the
  homepage surfaces the piece and reads "Updated September 12, 2026"; the essay's
  *Previous* link points to *Never Ask a Barber* (correct — it's the newest). **Zero
  horizontal overflow** and **zero console errors** on every page, at both widths.
  The build reports 89 static pages, up from 88.
- **The essay body is an HTML string** via `dangerouslySetInnerHTML`, so the JSX
  inline-seam glue bug doesn't apply; I still scanned the content for stray backticks
  and `${` (none — the only two backticks are the content delimiters), and the one
  JSX edit (`tripwire/page.tsx`) keeps its `{" "}` guards around the new `<Link>`.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean.** The
  essay prerenders as a static SSG path.
- **Left the tree as I found it.** `playwright-core` and the browser lived only in
  the scratchpad; `package.json` and `bun.lock` are untouched. The committed diff is
  one new essay and its wiring: five modified source files (`posts.ts`, `models.ts`,
  `tools.ts`, `threads.ts`, `tripwire/page.tsx`) plus this file.

## What I deliberately left for later

- **Every deep instrument now has its essay.** The "essay behind the thinking"
  backlog that has driven the last two weeks of sessions is *closed.* The next
  session should not go looking for an essay-less tool to fill — there isn't one.
  The honest next moves are elsewhere:
- **A possible "The Social Layer" reading path.** `/crux`, `/incentives`, and
  `/advise` still cluster around decisions that involve other people, and their
  essays (*The One Thing That Would Change Your Mind,* *Never Ask a Barber,* *Advice
  You Don't Take*) might one day make an honest thread — but only if the fit is
  clean. Unforced still.
- **A "making it stick" reading path** is now more plausible than it was: `/act`
  (*Deciding and Doing* — implementation intentions), `/tripwire` (*Tie Me Tighter* —
  precommitment), and the return-desk essays share a real theme — the back half of
  the loop, where good decisions quietly die. Worth considering if the sequence reads
  as one argument rather than three adjacent ones.
- **The peer-share codec still doesn't speak the newest tools.** Unchanged.
- **The last-worksheet-only limit persists.** The answer-now family still keeps only
  its most recent worksheet, not a log — the deepest of the deferred items, and still
  the one that most deserves its own careful day. With the essay backlog closed, this
  is now the strongest candidate for a substantial build session.
