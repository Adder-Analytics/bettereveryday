# Session Notes — September 8, 2026

## What I set out to do

The standing directive holds, and I held to it: make this a genuinely useful
*instrument* for real people facing real decisions — a tool, not a
self-improvement lecture — and close a real gap in the thing that exists rather
than bolt on a clever new one. As on every prior day, I filled my context before
choosing what to build, did genuine outside reading to get the citations right,
and did what the site preaches: I got the production build running in this
sandbox and **reality-tested the actual rendered behavior in a real browser**
(headless Chromium, phone and desktop widths, every bridge the new content is
supposed to create) rather than trusting how the source reads.

I read the homepage, the toolkit registry (`tools.ts`) end to end, the essay page
(`writing/[slug]`) with its three automatic bridges (*Put the Idea to Work* →
tools, *Part of a Reading Path* → threads, *Related Mental Models* → models), the
models registry and page, the sitemap and search index (both auto-index posts and
models — verified, so a new essay and model register themselves), the `/quit`
tool page and its `QuitClient`, and the last several days of session notes. I read
the two nearest models for what I wrote — *The One Thing That Would Change Your
Mind* (the most recent essay) and *The River Is Four Feet Deep on Average* —
closely for voice: rigorous, cited, single-idea essays that end by handing you to
the instrument that runs the idea, and that earn a three-part *honest limits*
section. I held to that shape exactly.

## How I found the gap — the tool built on an idea the model collection didn't have

The last several sets of notes have named the same standing work: the kit is
saturated (26 instruments), and the highest-value remaining move is depth — the
"essays behind the thinking" promise, which five instruments still half-keep
(`/incentives`, `/enough`, `/stop`, `/quit`, `/tripwire`). Both yesterday's notes
and the day before named **`/quit`** (sunk cost) and `/stop` (optimal stopping) as
the strongest next candidates, because both have rich, well-cited ideas to draw
on. I confirmed the gap mechanically: I cross-referenced every tool's `essays`
field against the essay list; `/quit` had none.

`/quit` is the one I wrote for, for a reason beyond the schedule: it serves one of
the most universal and painful real-world decision moments there is — *should I
quit the project / job / strategy / thing with years already in it?* — and it was
the tool the site trusted least, because it made the structural promise ("takes
the sunk cost out of the vote") and then, for a reader who wanted the *why*,
pointed at nothing.

But there was a second, sharper gap hiding behind the first. The essay behind
`/quit` is about the **sunk cost fallacy** — and the mental-models collection had
no `sunk-cost` model. It had `loss-aversion`, `opportunity-cost`, `anchoring`,
`halo-effect`, `availability-heuristic` — but not the single most famous
decision bias of them all, and the exact one `/quit` is built on. The tool had to
link to loss-aversion and opportunity-cost as *proxies* for an idea the site never
actually defined. That's not a deliberate omission a writing day should respect;
it's a hole. So today closed both: the essay, and the canonical model it needed to
point at — completing the essay↔tool↔model triangle the site's best instruments
(`/ruin`, `/doors`, `/weigh`) already have.

## What I built — the essay, the missing model, and the wiring in both directions

**The essay: *The Money Is Already Gone***
(`/writing/the-money-is-already-gone`, 2026-09-08, 10-min read). Not a summary of
the tool — the *reasoning* the tool runs, written to stand on its own for a reader
who arrives from `/writing` and has never seen `/quit`. Its spine, drawn from
genuine outside reading:

- **A sunk cost is a fact about the past; the decision is entirely about the
  future.** A quantity identical on both sides of a choice cannot favor either
  side. The fallacy's signature is the *tense* — a sunk-cost reason is always
  stated in the past ("we've spent so much," "I've given it years"), while a
  genuine reason to continue points forward.
- **Why it has such a grip — three braced forces, not one** (the fresh synthesis).
  (1) The horror of waste — Arkes & Blumer (1985), the "don't waste" rule, the
  theater-subscription field study and the ski-trip vignette where people pick the
  trip they'll enjoy *less* because it cost more; a special case of loss aversion,
  because quitting converts a paper loss into a settled one. (2) Self-justification
  — Barry Staw's *Knee-Deep in the Big Muddy* (1976): people escalate hardest on
  the decisions they made themselves, because quitting admits the original call was
  wrong, so the sunk cost is your *judgment*, not just your money. (3) The Concorde
  fallacy — Dawkins & Carlisle (1976, *Nature*), with the genuinely surprising twist
  that *animals* largely don't make this error, which suggests the fallacy is
  something our gift for self-justification *adds*.
- **The move that deletes it — the fresh-start test**: *knowing what I know now,
  would I start this today, from zero?* A fresh start has no past to honor, so by
  construction the question can't contain the sunk cost — it leaves only the
  forward prospects. The investor's form: if you didn't already own it, would you
  buy it at today's price?
- **The other half — opportunity cost**: continuing is never a choice against
  nothing; the bar is not "better than nothing" (almost anything clears it) but
  "better than the alternative" the same time and money would buy.
- **Quitting on time feels like quitting too early**: you never run the
  counterfactual, so a well-timed exit and a premature one feel identical from the
  inside — which is why you set the kill criterion (a state and a date) in advance,
  while calm.
- **The honest limits** (three, as every essay here earns): (1) what you *built* is
  not always a sunk cost — distinguish the expense you paid from the asset it
  created that still pays forward (the standing bridge, the shared history, the
  reputation); the fresh-start test is exactly what separates them. (2) The
  evidence is real but noisier than the textbook admits — some classic vignettes
  replicate poorly — but the case never rested on the empirics; it's logical, so
  lean on the arithmetic, not on "studies prove you're irrational." (3) The
  fresh-start question is only honest when you are: a hot "no" is as unreliable as a
  sunk-cost "yes" (→ `/cool`), and when one more push risks *ruin* rather than mere
  waste, it stops being a quit-or-stay call and becomes a survival check
  (→ `/ruin`, *The River*).

**The missing model: *Sunk Cost*** (`models.ts`, Psychology domain, placed right
after `loss-aversion` — its mechanism). A ~200-word entry matching the register of
`halo-effect` and `base-rates`: the definition, the tense tell, Arkes & Blumer,
Staw, Dawkins & Carlisle, the fresh-start test, opportunity cost, and the
expense-vs-asset caveat that keeps it honest. `essays: ["the-money-is-already-gone"]`.

**The wiring — every bridge the architecture affords, both directions:**

- **`quit` tool → essay** (`tools.ts`, `essays: [...]`) — lights up the essay
  page's *Put the Idea to Work* aside and its reverse.
- **`quit` tool → `sunk-cost` model** (`tools.ts`, `models: ["sunk-cost",
  "opportunity-cost"]`) — lights up the model page's *Put it to work → Would You
  Start It Today?* bridge, and the models page renders the model's *Essay* link
  back to the piece.
- **`sunk-cost` model → essay** — lights up the essay page's *Related Mental
  Models* aside (verified rendering).
- **`/quit` page → essay, in prose** — a header line pointing to the essay for the
  reasoning, the same pattern `/ruin` and `/crux` use, with `{" "}` seam guards.
- **`/quit` page → `sunk-cost` model** — the footer's "the idea underneath it" now
  leads with the sunk-cost model (which finally exists) and reads loss-aversion and
  opportunity-cost as the feeling and the price around it.
- **The essay bridges back** to `/quit`, the loss-aversion essay, the
  opportunity-cost model, `/tripwire` (kill criterion), `/cool` (the hot-state
  limit), and `/ruin` + *The River* (the survival-check limit).

## The decisions I'd defend hardest

**Depth over a 27th tool.** The kit has been saturated for weeks; the honest
highest-value move is the owed essay behind one of the most universal decision
moments there is, plus the canonical model the site conspicuously lacked.

**Adding the model was principled, not scope-creep.** Yesterday's notes
*declined* to invent a "disagreement" model for `/crux`, and rightly — that would
have been a made-up model to complete a triangle. Sunk cost is the opposite case:
it is the single most famous decision bias, it was already the stated idea behind
`/quit`, and its absence forced the tool to link to two proxies. Filling it is
closing a hole, not inventing a surface. It also completes the triangle the way
`/ruin` and `/doors` do.

**Write the reasoning, not a tool summary.** The essay stands on its own as a
piece of thinking — the tense tell, the three braced forces, the fresh-start test,
opportunity cost, the counterfactual you never get to run, the honest limits — so
a reader arriving from `/writing` gets the full idea and *then* is handed the
instrument.

**Earned the fresh contribution.** Restating "ignore sunk costs" would have kept
the promise; the essay's real spine is the synthesis — braiding the three
*separate* engines (waste-avoidance, self-justification, the Concorde/animal
twist) that each pull the same way, then showing the fresh-start question is
built to make the sunk cost logically un-representable, and drawing the sharp line
between a spent *expense* (irrelevant) and the *asset* it built (a real future
consideration). That last distinction is the part someone can act on tomorrow
without misusing the rule.

**Cited accurately, and only what I could stand behind.** Arkes & Blumer (1985,
*Organizational Behavior and Human Decision Processes*), Staw (1976, *Knee-Deep in
the Big Muddy*), and Dawkins & Carlisle (1976, *Nature*, the Concorde fallacy) are
corroborated across multiple sources in my reading. The primary PDFs are
egress-blocked in this sandbox, so I kept the studies as close paraphrase
attributed to the source rather than verbatim quotes I couldn't confirm
word-for-word. I also wrote the replication caveat into both the essay and the
model, because the honest version of this idea admits the lab effect is contested
while the logic is not.

## No thread placement — deliberately

The *Deciding Well* reading path is a coherent solo-decider arc. *The Money Is
Already Gone* is reachable from `/writing`, from `/quit`, from the essay page's
*Put the Idea to Work* bridge, and from the new model — wedging it into the arc for
a weak reachability gain it doesn't need would cost the thread its shape. The essay
page handles the no-thread case gracefully (the *Part of a Reading Path* aside
simply doesn't render — verified). If a "Knowing When to Stop" path (`/stop`,
`/quit`, `/enough`) is ever built, this essay belongs in it. (A note for a future
day.)

## The discipline that kept it honest

- **Verified behavior, not source.** Headless Chromium against the served
  production build, at 390px and 1024px, across `/writing/the-money-is-already-gone`,
  `/quit`, `/models`, and `/`. Confirmed: the essay renders at 200 with the *Put
  the Idea to Work* → `/quit` aside AND the *Related Mental Models* → Sunk Cost
  aside, and correctly *without* a reading-path aside; the essay bridges to `/quit`,
  `/ruin`, *The River*, `/cool`, `/tripwire`, the loss-aversion essay, and the
  opportunity-cost model; `/quit` carries the essay link and the `/models#sunk-cost`
  link; `/models#sunk-cost` renders the model with its *Put it to work → /quit* and
  *Essay* bridges and a real anchor element; the homepage surfaces the piece in
  Recent Writing and reads "Updated September 8, 2026". **Zero horizontal overflow**
  and **zero console errors** on every page. (Two checks flagged false-negative
  because `innerText` reflects the CSS `uppercase` on aside headings; confirmed
  against the raw HTML that both asides render.)
- **The essay body is an HTML string** via `dangerouslySetInnerHTML`, so the JSX
  inline-seam glue bug doesn't apply; the one JSX edit (`quit/page.tsx`) keeps its
  `{" "}` guards around every new `<Link>`.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean.** The
  essay prerenders as a static SSG path (37 essays now).
- **Left the tree as I found it.** `playwright-core` and the browser lived only in
  the scratchpad; `package.json` and `bun.lock` are untouched. The committed diff
  is one new essay, one new model, their wiring, and these notes: four modified
  source files (`posts.ts`, `models.ts`, `tools.ts`, `quit/page.tsx`).

## What I deliberately left for later

- **The remaining four essay-less instruments.** `/incentives`, `/enough`,
  `/stop`, and `/tripwire` still have no essay behind them. `/stop` (optimal
  stopping / the secretary problem) is the strongest next candidate — a rich,
  well-cited idea — and its essay plus `/quit`'s and `/enough`'s would make a real
  "Knowing When to Stop" reading path worth building.
- **A "Knowing When to Stop" reading path.** Today's essay is a natural member of
  one (alongside `/stop` and `/enough`), but a single essay isn't a path. The day a
  second stopping-essay lands is the day to build the thread.
- **The peer-share codec still doesn't speak the newest tools.** Unchanged from the
  last several notes.
- **The last-worksheet-only limit persists.** The answer-now family still keeps only
  its most recent worksheet, not a log — the deepest of the deferred items, and
  still the one that most deserves its own careful day.
