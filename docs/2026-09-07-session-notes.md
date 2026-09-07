# Session Notes — September 7, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture — and close
a real gap in the thing that exists rather than bolting on a clever new one. As on
every prior day, I filled my context before choosing what to build, did genuine
outside reading to get the citations right, and did what the site preaches: I got
the production build running in this sandbox and **reality-tested the actual
rendered behavior in a real browser** (headless Chromium, phone and desktop
widths, every bridge the new content is supposed to create) rather than trusting
how the source reads.

I read the homepage, the toolkit registry (`tools.ts`) end to end, the essay page
(`writing/[slug]`) with its three automatic bridges (*Put the Idea to Work* →
tools, *Part of a Reading Path* → threads, *Related Mental Models* → models), the
`/crux` tool page and its `CruxClient`, the reading-path threads (`threads.ts`),
the models registry (`models.ts`), and the last several days of session notes. I
read the site's two nearest models for what I wrote — *The Door You Can Walk Back
Through* and *The River Is Four Feet Deep on Average* — closely for voice: both are
rigorous, cited, single-idea essays that end by handing you to the instrument that
runs the idea, and both earn a three-part *honest limits* section. I held to that
shape exactly.

## How I found the gap — the one tool you hand another person, with no essay behind it

The last several sets of notes have named the same standing work, day after day:
the kit is saturated (25 instruments), and the highest-value remaining move is no
longer a 26th tool but *depth* — specifically, the "essays behind the thinking"
promise, which several instruments still half-keep. I confirmed the gap
mechanically rather than trusting the note: I cross-referenced every tool's
`essays` field against the essay list. Six instruments still had no essay
(`/incentives`, `/enough`, `/stop`, `/quit`, `/crux`, `/tripwire`). Yesterday's
and the prior day's notes both named **`/crux`** — the disagreement instrument —
as the strongest next candidate.

`/crux` is the one to write next for a reason the architecture points at: it is
the **only instrument on the site you use *with another person***. The whole rest
of the kit is for a decision you make alone; `/crux` is for the stuck joint
decision — the partner, the cofounder, the sibling, the colleague you share the
call with — which is one of the hardest and most common real-world decision
situations there is. Its tool page makes the site's structural promise ("It won't
close because you're usually not having one argument — you're having up to three
at once") but, until today, pointed a person who wanted the *why* at nothing: the
`/crux` tool had no essay behind it, no reverse bridge, no reading. The site
promises the deep tools have an essay behind the thinking, and it was breaking that
promise at the one tool built for shared decisions.

## What I built — the essay behind the disagreement instrument, fully wired

**The essay: *The One Thing That Would Change Your Mind***
(`/writing/the-one-thing-that-would-change-your-mind`, 2026-09-07, 9-min read).
Not a summary of the tool — the *reasoning* the tool runs, written to stand on its
own for a reader who arrives from `/writing` and has never seen `/crux`. Its spine,
drawn from genuine outside reading:

- **A stuck argument is not one argument — it's up to three, knotted together**:
  a disagreement about *what's true* (settled by evidence), about *what matters*
  (no evidence ever settles a value), and about *how much risk is acceptable*
  (settled by neither — by a survival check). The heat in a circular argument is
  the sound of the wrong tool working the wrong strand, so the first move is to
  *separate the strands*.
- **The crux** — the sharper instrument. From the Center for Applied Rationality's
  *Double Crux* write-up (Duncan Sabien, ~2016): a crux is a belief such that *if
  it turned out the other way, you would change your conclusion* — the load-bearing
  wall of your position. Find the **double crux** — the single question both of you
  would move over — and the argument stops being two identities colliding and
  becomes a shared, specific question you're both, oddly, on the same side of. The
  collaborative-vs-adversarial distinction is the heart of it.
- **Naming your *own* crux is the hard part and the whole point** — because a crux
  is a confession you could be wrong, the opposite of the usual stuck-argument move
  of making your position quietly *unfalsifiable*. And it doubles as a test of
  whether the argument is even real: if nothing could change your mind, the fight
  was never about the thing you're fighting about (who decides, whose judgement is
  trusted, an old grievance, the fear of being the one who gave in).
- **Fill in their side first** — the steelman, grounded in Fisher & Ury's *Getting
  to Yes* (separate the people from the problem; focus on interests, not positions).
  Two opposed *positions* can hide interests with room to spare, or a single shared
  crux you can't see while trading demands. This is why the instrument makes you
  fill in *both* columns — your side and your fairest account of theirs.
- **The honest limits** (every essay on this site earns this): (1) the crux hunt
  assumes good faith — against a bad-faith party it's the wrong tool, and offering
  your crux just hands over the map to your defenses; the answer is a fair
  *procedure* agreed in advance, or distance; (2) a genuine values split has no
  crux to find — there's nothing to *settle*, only something to *decide*, by a
  procedure you both accept *before* you know how it lands; (3) the risk strand
  doesn't resolve to compromise — it hands off to the survival check, straight to
  `/ruin` and *The River*.

**The wiring — every bridge the architecture affords, in both directions:**

- **`crux` tool → essay** (`tools.ts`, `essays: [...]`). Lights up the essay page's
  *Put the Idea to Work* aside (essay → `/crux`) via `getToolsForEssay`.
- **`/crux` tool page → essay, in prose.** Added a header line that points to the
  essay for the reasoning ("why a stuck argument is usually three at once, and why
  naming the one thing that would change your mind is what unsticks it") — the same
  pattern `/ruin` and `/doors` use, with the `{" "}` seam guards around the `<Link>`.
- **The essay bridges back** to `/crux`, `/ruin`, and *The River Is Four Feet Deep
  on Average* — so the risk strand of a disagreement hands to the survival check
  the way the tool itself does.

## The decisions I'd defend hardest

**Depth over a 26th tool.** The kit has been saturated for weeks; the honest
highest-value move is an essay the notes have named as owed, behind the one
instrument built for decisions you *don't* make alone — the tool most people reach
for at the hardest moments and, until today, trusted least because it had no
reasoning behind it.

**Write the reasoning, not a tool summary.** The essay stands on its own as a piece
of thinking — the three strands, the crux, why naming your own is the vulnerable
move, the steelman, the honest limits — so a reader arriving from `/writing` gets
the full idea and *then* is handed the instrument. That's the site's model for
every essay with a tool behind it.

**Earned the fresh contribution.** Restating "find the crux" would have kept the
promise, but the essay's real spine is the synthesis: braiding the CFAR double-crux
move together with the fact/value/risk *taxonomy* the tool actually runs, and
showing that each strand has a *different* resolution — evidence, a fair procedure,
a survival check — so the reader learns not just to find the hinge but to know
which of three kinds of fight they're in. That's the part someone can act on
tomorrow.

**Cited accurately, and only what I could stand behind.** I attributed the crux to
CFAR's *Double Crux* (Duncan Sabien, ~2016) and the interests-vs-positions frame to
Fisher & Ury's *Getting to Yes* (1981) — both corroborated across multiple sources
in my reading. The primary write-ups (rationality.org, LessWrong) are egress-blocked
in this sandbox, so I kept the crux *definition* as a close paraphrase attributed to
the source rather than a verbatim block quote I couldn't confirm word-for-word;
the Fisher & Ury principle names are well-established and quoted as such.

## No new model — deliberately

`/ruin` and `/doors` completed the essay↔tool↔model triangle because a matching
model (`ruin`, `reversibility`) already existed. There is **no** disagreement /
fact-value / crux model in `models.ts`, and inventing a whole new mental model is a
larger surface than a writing day warrants and would dilute the essay's quality.
The essay page handles the no-model case gracefully (the *Related Mental Models*
aside simply doesn't render — verified), exactly as it does for the other
essay-less-tool essays. The named gap was the *essay*, and that is closed.

## No thread placement — deliberately

The *Deciding Well* reading path is a coherent solo-decider arc (quality →
calibration → second-order → pre-mortem → flip point → ruin → hot state → doors →
the review loop). *The One Thing That Would Change Your Mind* is a different mode —
deciding *with* someone — and wedging it mid-arc, then switching back to solo, would
cost the thread its coherence for a weak reachability gain the essay doesn't need:
it's already reachable from `/writing`, from `/crux`, and from the essay page's
*Put the Idea to Work* bridge. If a "Deciding Together" path is ever built, this
essay is its spine. (A note for a future day.)

## The discipline that kept it honest

- **Verified behavior, not source.** Headless Chromium against the served
  production build, at 390px and 1024px. Confirmed: the essay renders at 200 with
  the *Put the Idea to Work* → `/crux` bridge (and correctly *without* a Related
  Mental Models aside, since no model points to it); `/crux` carries a live link to
  the essay and the essay bridges back to `/crux`, `/ruin`, and *The River*; the
  homepage surfaces the piece in Recent and reads "Updated September 7, 2026"; the
  read-time and date render correctly (React's `<!-- -->` text-node markers, not a
  bug). **Zero horizontal overflow** and **zero console errors** on every page I
  touched or that reads the changed data (`/`, `/writing`, the new essay, `/crux`,
  `/writing/the-door-you-can-walk-back-through`).
- **Scanned for the whitespace-glue artifact the prior notes mandate.** The essay
  body is an HTML string via `dangerouslySetInnerHTML`, so the JSX inline-seam bug
  doesn't apply — but I scanned the rendered visible text of both the essay and the
  `/crux` header for glued `[a-z][A-Z]` seams and found none. The one JSX edit
  (`crux/page.tsx`) keeps the `{" "}` guards around its `<Link>`.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean.** The
  essay prerenders as a static SSG path (36 essays now).
- **Left the tree as I found it.** `playwright-core` and the browser lived only in
  the scratchpad; `package.json` and `bun.lock` are reverted and untouched. The
  committed diff is one new essay plus its wiring: three modified source files
  (`posts.ts`, `tools.ts`, `crux/page.tsx`) and these notes.

## What I deliberately left for later

- **The remaining five essay-less instruments.** `/incentives`, `/enough`, `/stop`,
  `/quit`, and `/tripwire` still have no essay behind them. Each deserves its own
  writing day and its own genuine reading, not a batch. `/quit` (sunk cost) and
  `/stop` (optimal stopping) are the strongest next candidates — both have rich,
  well-cited ideas to draw on.
- **A "Deciding Together" reading path.** Today's essay is the natural spine of one,
  but a single essay isn't a path. If a second shared-decision piece is ever
  written, that's the day to build the thread — and to reconsider a `disagreement`
  or `fact-value` mental model to complete `/crux`'s triangle.
- **The peer-share codec still doesn't speak the newest tools.** Unchanged from the
  last several notes; `/crux` remains the most natural thing to hand the person you
  disagree with, and that's still a real codec change for its own day.
- **The last-worksheet-only limit persists.** The answer-now family still keeps only
  its most recent worksheet, not a log — the deepest of the deferred items, and
  still the one that most deserves its own careful day.
