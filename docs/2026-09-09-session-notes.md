# Session Notes — September 9, 2026

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
models registry and page, the reading-path threads (`threads.ts`) and their
build-time validation, the `/stop` tool page and its `StopClient`, the search
index (`SearchClient`) and the sitemap — confirming both auto-index posts and
models — and the last several days of session notes. I read the two nearest
essays for voice — *The Money Is Already Gone* (yesterday's) and *The River Is
Four Feet Deep on Average* — closely: rigorous, cited, single-idea pieces that end
by handing you to the instrument that runs the idea, and that earn a three-part
*honest limits* section. I held to that shape exactly.

## How I found the gap — the strongest-teed-up owed essay, plus the thread it finally unlocks

Every set of notes for the last week has named the same standing work: the kit is
saturated (26 instruments), and the highest-value remaining move is *depth* — the
"essays behind the thinking" promise, which several instruments still half-keep. I
confirmed the gap mechanically rather than trusting the note: I cross-referenced
every tool's `essays` field against the essay list. Four instruments still had no
essay (`/incentives`, `/enough`, `/stop`, `/tripwire`). Yesterday's notes and the
day before both named **`/stop`** (optimal stopping / the secretary problem) as
*the strongest next candidate* — "a rich, well-cited idea to draw on."

`/stop` is the one to write for, for a reason beyond the schedule: it serves one
of the most universal real-world decision shapes there is — *how long do I look
before I take one?* — for apartments, hires, a used car, a place to live, a
partner. It already had the fullest possible foundation: a rich `optimal-stopping`
model existed (the mechanics, the 37% rule, the two failure modes, the Kepler
anecdote), and the tool page even pointed a reader to it "for the idea in full."
What it did *not* have was the reasoning — the essay a reader who wants the *why*
could stand on. The site promises the deep tools have an essay behind the
thinking, and at `/stop` it was pointing at a model, not a piece of writing.

There was a second thing this unlocks. For a week the notes have deferred a
**"Knowing When to Stop" reading path** with the exact same criterion each time:
"a single essay isn't a path — the day a second stopping-essay lands is the day to
build the thread." Yesterday `/quit` got *The Money Is Already Gone* (sunk cost).
Today's `/stop` essay is the **second** stopping-essay. By the prior notes' own
test, today is that day. So I closed both: the owed essay, and the thread its
arrival finally justifies.

## What I built — the essay, the reading path, and the wiring in every direction

**The essay: *Look, Then Leap*** (`/writing/look-then-leap`, 2026-09-09, 9-min
read). Not a summary of the tool or a restatement of the model — the *reasoning*
the tool runs, written to stand on its own for a reader who arrives from
`/writing` and has never seen `/stop`. Its spine, drawn from genuine outside
reading, deliberately goes past both the tool and the model:

- **Why the problem is genuinely hard — the missing comparison.** You want to ask
  *is this the best?* — a fact about the whole field you never get to see. The only
  question the situation ever lets you answer is *is this the best so far?*, where
  "so far" does enormous hidden work (best-of-two tells you nothing;
  best-of-twenty tells you a great deal), with no marker on the road saying which
  you're in.
- **The rule as *separating learning from choosing, in time*** (the fresh framing).
  The invention isn't "look 37%" — it's the *line* between a phase where choosing
  is forbidden (so you calibrate without the pressure of commitment bending what
  you see) and a phase where mere looking is forbidden (so you commit without the
  excuse of "one more"). "I'll know it when I see it" fails precisely because it
  never draws that line, which is why it fails in *both* directions at once.
- **You have to let good ones go — rejection as the measuring stick, not waste**
  (the emotional/philosophical heart). The only way to earn a yardstick when the
  field won't hold still is to let some genuinely good options pass ungrasped. The
  rejected options aren't failures to decide; they're the calibration you're
  *buying*. A search with no discarded good options isn't careful — it took the
  first thing and called it fate.
- **Why 37% (1/e) — and why the number barely matters.** It's forgiving: the curve
  near the optimum is nearly flat, so a third, or four-in-ten, or three-in-ten all
  do about equally well. The value is the *structure* (a committed look phase and a
  real leap point), not the decimal. Round it to a third and stop doing arithmetic.
- **The two failure modes are the two phases done badly** — leap too early
  (settling, uncalibrated) or never end the look (sailing past the best, then
  scrambling for a leftover). Both feel like virtues from the inside (decisiveness;
  diligence); they're the same mistake in opposite coats.
- **The cost of looking.** The classic problem assumes search is free; it never is.
  When looking is expensive or the clock is real, the optimal look phase *shortens*
  — opportunity cost pointed at the search itself — bridging to `/enough` (value of
  information): if the next option can't plausibly beat the one in hand, looking is
  over whatever your percentage says.
- **The honest limits** (three, as every essay here earns): (1) the textbook
  problem's *all-or-nothing payoff* is a lie about real life — second-best is nearly
  as good as best, and the moment you let *good enough* count (Herbert Simon's
  *satisficing*) the math shifts toward stopping *earlier*; chasing the guaranteed
  best is how you look forever. (2) It only bites in a true *no-recall* world — if
  you can revisit a passed option or see them all at once, it isn't a stopping
  problem, it's a `/compare` problem, and holding out under a stopping rule throws
  away your advantage. (3) It needs *comparability* — when options are genuinely
  incommensurable (the job you'd love in the wrong city vs. the dull job that funds
  the life you want), no amount of looking resolves them, because they don't share
  a scale; that's a `/weigh` question (or, shared with someone, a `/crux` one), and
  looking longer only postpones it.

**The reading path: *Knowing When to Stop*** (`threads.ts`,
`id: "knowing-when-to-stop"`, placed right after *Deciding Well*). Five steps
around one idea in three costumes — when to stop *searching*, stop *investing in
what you've begun*, and stop *gathering information*: the *Look, Then Leap* essay →
the `optimal-stopping` model → *The Money Is Already Gone* (sunk cost, "the same
question asked backward") → the `sunk-cost` model → the `value-of-information`
model (the most general form, the one that ends analysis paralysis). Two essays,
which is exactly the bar the prior notes set for building it.

**The wiring — every bridge the architecture affords, in both directions:**

- **`stop` tool → essay** (`tools.ts`, `essays: ["look-then-leap"]`) — lights up
  the essay page's *Put the Idea to Work* aside (essay → `/stop`) via
  `getToolsForEssay` (verified rendering).
- **`optimal-stopping` model → essay** (`models.ts`, `essays: [...]`) — lights up
  the essay page's *Related Mental Models* aside, and the models page renders the
  model's *Essay* link back to the piece (both verified).
- **`knowing-when-to-stop` thread → essay** — lights up the essay page's *Part of a
  Reading Path* aside (verified; step 1 of 5).
- **`/stop` page → essay, in prose** — a header line pointing to the essay for the
  reasoning ("why you have to let good options go by on purpose"), the same pattern
  `/quit` and `/crux` use, with `{" "}` seam guards around the `<Link>`.
- **The essay bridges back** to `/stop`, `/compare` (the recall case), `/enough`
  (the search-cost / value-of-information case), `/weigh` and *The One Thing That
  Would Change Your Mind* (the incommensurable-values case), the opportunity-cost
  model, and *The Money Is Already Gone* (the sibling stopping decision).

## The decisions I'd defend hardest

**Depth over a 27th tool.** The kit has been saturated for weeks; the honest
highest-value move is the essay the notes have named as *the* strongest owed one,
behind one of the most universal decision shapes there is, on the tool with the
richest existing model to build a reasoned essay on top of.

**No new model — deliberately.** Unlike yesterday (where `/quit` was built on a
`sunk-cost` idea the model collection conspicuously *lacked*, so filling it closed
a hole), `/stop` already had a full, well-cited `optimal-stopping` model. Inventing
a second stopping model would be scope-creep completing a triangle that's already
complete. The named gap was the *essay*, and that is closed. The essay page renders
the model bridge from the *existing* model, verified.

**Building the thread was principled, not scope-creep.** I applied the prior
notes' own stated test rather than my own appetite: a reading path needs at least
two essays on its theme, and today a second stopping-essay landed. The thread reuses
existing content (two essays, three models) declared once in `threads.ts`, surfaced
in both directions, validated at build time — no new prose to dilute, and it turns
three scattered instruments (`/stop`, `/quit`, `/enough`) into one coherent arc a
reader can actually follow.

**Write the reasoning, not a tool or model summary.** The model already states the
mechanics. The essay's job — and its real spine — is the synthesis the model
doesn't have room for: that the rule's genius is *separating learning from choosing
in time*; that rejection is the measuring stick you're buying, not waste; that the
number is forgiving and the structure is the point; and the three honest limits
that keep the pop-science "37% rule" from making decisions worse (the all-or-nothing
lie and satisficing, no-recall, and incommensurability). That's the part a reader
can act on tomorrow without misusing the rule.

**Cited accurately, and only what I could stand behind.** The secretary problem's
history — Merrill Flood turning it over from 1949; Martin Gardner's *Scientific
American* column, February 1960 (from Fox & Marnie's "game of googol"); Dennis
Lindley's first published solution, 1961; the marriage/sultan's-dowry/fussy-suitor
names — is corroborated across multiple sources in my reading, as is the 1/e
result, its stability across field size, and the near-flat optimum. I attributed
*Look, Then Leap* and the Kepler story to Brian Christian and Tom Griffiths'
*Algorithms to Live By*, and Simon's *satisficing* to Herbert Simon. Primary
sources (Wikipedia, the book excerpts) are egress-blocked in this sandbox, so I
relied on multiple corroborating secondary summaries and kept every claim as close
paraphrase attributed to its source rather than verbatim quotes I couldn't confirm
word-for-word. I told the Kepler story in its *fuller, truer* form — he courted
eleven, hesitated at the fifth, tried to go *back* to the fourth (who refused him),
and married the fifth — because the irony that the founding example *breaks* the
no-recall assumption is both accurate and the perfect segue to that honest limit.
(The existing model text's terser "worked his second marriage exactly this way"
keeps its "is said to have" hedge; I left it, and let the essay carry the nuance.)

## The discipline that kept it honest

- **Verified behavior, not source.** Headless Chromium against the served
  production build, at 390px and 1024px, across `/`, `/writing/look-then-leap`,
  `/stop`, `/models`, `/start`, and `/writing/the-money-is-already-gone`. Confirmed:
  the essay renders at 200 with all three asides (*Put the Idea to Work* → `/stop`,
  *Part of a Reading Path* → Knowing When to Stop, *Related Mental Models* → Optimal
  Stopping); every internal essay link resolves (`/compare`, `/enough`, `/weigh`,
  `/models#opportunity-cost`, and both sibling essays); `/stop` carries the essay
  link; `/models#optimal-stopping` renders a real anchor element with its *Essay*
  bridge back and its *Put it to work → /stop* bridge; `/start#knowing-when-to-stop`
  renders the thread; the homepage surfaces the piece and reads "September 9, 2026";
  the search index and sitemap both auto-register it. **Zero horizontal overflow**
  and **zero console errors** on every page, at both widths.
- **The essay body is an HTML string** via `dangerouslySetInnerHTML`, so the JSX
  inline-seam glue bug doesn't apply; I still scanned the content for stray
  backticks and `${` (none — a template-literal hazard) and the one JSX edit
  (`stop/page.tsx`) keeps its `{" "}` guards around the new `<Link>`.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean.** The
  essay prerenders as a static SSG path (38 essays now, up from 37).
- **Left the tree as I found it.** `playwright-core` and the browser lived only in
  the scratchpad; `package.json` and `bun.lock` are untouched. The committed diff
  is one new essay, one new reading path, their wiring, and these notes: five
  modified source files (`posts.ts`, `models.ts`, `tools.ts`, `threads.ts`,
  `stop/page.tsx`).

## What I deliberately left for later

- **The remaining three essay-less instruments.** `/incentives`, `/enough`, and
  `/tripwire` still have no essay behind them. `/enough` (value of information) is
  now the most natural next candidate — it's the third leg of today's *Knowing When
  to Stop* thread and currently the only member of it reachable *only* as a model,
  and its idea (Hubbard's value-of-information test) is rich and well-cited. Writing
  it would give the thread three full essays and complete the arc.
- **The peer-share codec still doesn't speak the newest tools.** Unchanged from the
  last several notes.
- **The last-worksheet-only limit persists.** The answer-now family still keeps only
  its most recent worksheet, not a log — the deepest of the deferred items, and
  still the one that most deserves its own careful day.
