# Session Notes — September 11, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people facing real decisions — a tool, not a self-improvement lecture — and
close a real gap in the thing that exists rather than bolt a clever new one on.
I filled my context before choosing what to build, did genuine outside reading so
the citations are right, and did what the site preaches: I got the production
build running in this sandbox and **reality-tested the actual rendered behavior in
a real browser** (headless Chromium, phone and desktop widths, every bridge the
new content is supposed to create) instead of trusting how the source reads.

I read the homepage, the toolkit registry (`tools.ts`) end to end, the essay page
(`writing/[slug]`) with its three automatic asides (*Put the Idea to Work* → tools,
*Part of a Reading Path* → threads, *Related Mental Models* → models), the models
registry, the reading-path threads (`threads.ts`), the `/incentives` tool page and
its `IncentivesClient`, and the last several days of session notes. For voice I read
the nearest deep essay closely — *The Money Is Already Gone* (sunk cost) — the
rigorous, cited, single-idea piece that opens on a vivid second-person moment, names
the idea plainly, cites its history accurately, works one concrete example, earns a
three-part *honest limits* section, and ends by handing you to the instrument. I held
to that shape exactly.

## How I found the gap — the last strong essay the prior notes teed up

For over a week the notes have named the same standing work: the kit is saturated
(the instrument count has been stable for weeks), and the highest-value remaining
move is *depth* — the "essays behind the thinking" promise that several instruments
still half-keep. I confirmed the gap mechanically rather than trusting the note: I
cross-referenced every tool's `essays` field against the essay list. Only two
instruments still had no essay: **`/incentives`** and **`/tripwire`**. Yesterday's
notes named `/incentives` as *the most natural next candidate* — "a rich, well-cited
idea (Munger, agency costs, principal–agent) behind a genuinely universal moment
(someone with a stake is urging you toward a yes)," and the stronger of the two
because `/tripwire`'s idea is already carried heavily by its model prose.

`/incentives` is the one to write for, and not only because the schedule points at
it. It serves one of the most universal decision situations there is — *someone is
telling you what to do, and they gain from your yes* — and it's the toolkit's one
instrument that checks the reasoning you were **given** rather than your own. It had
the fullest possible foundation already: a well-cited `incentive-structures` model
(Munger's "show me the incentive"), and the tool page even pointed a reader to that
model "for the idea in full." What it did *not* have was the reasoning — the essay a
reader who wants the *why* could stand on. The site promises the deep tools have an
essay behind the thinking, and at `/incentives` it was pointing at a model, not a
piece of writing.

## What I built — the essay and the wiring in every direction

**The essay: *Never Ask a Barber*** (`/writing/never-ask-a-barber`, 2026-09-11,
10-min read). Not a summary of the tool or a restatement of the model — the
*reasoning* the tool runs, written to stand on its own for a reader who arrives from
`/writing` and has never seen `/incentives`. Its spine, drawn from genuine outside
reading, deliberately goes past both the tool and the model:

- **Show me the incentive.** Munger's line, ranked *first* in *The Psychology of
  Human Misjudgment*, and his startling admission that even he has "always
  underestimated that power." The FedEx night-shift story (paid by the hour → paid
  by the shift, free to go home once the planes were loaded) to set the mechanism on
  the person who *acts*.
- **The fresh spine — the sincere adviser.** The version that matters when you're
  *taking* advice is quieter and runs through nobody's dishonesty. Upton Sinclair
  (1935): "It is difficult to get a man to understand something, when his salary
  depends upon his not understanding it." The incentive doesn't mainly corrupt what
  people *tell* you — it corrupts what they *believe*, and then they report it
  honestly. This is Munger's *incentive-caused bias* (the Xerox / Joe Wilson story:
  salesmen sincerely pushing the inferior machine the commission favored). The
  payoff: **sincerity is worthless as reassurance**, because it's exactly what the
  bias produces — a conflicted believer and a straight one look identical from the
  outside. A signal that shows up either way tells you nothing (an explicit callback
  to `/enough`'s value-of-information logic, pointed at a person instead of a fact).
  So you *can't read your way out of it* — you have to look at the structure.
- **Which way does the incentive point.** The principal–agent problem and *agency
  costs*, cited to Jensen & Meckling (1976). Three cases with three responses:
  *aligned* (weigh on the merits), *divergent* (the barber — discount hard), and the
  worst, *inverted* (they win more when you lose). The worked example is the
  Levitt & Syverson real-estate finding — agents' own homes sit ~10 days longer and
  sell for ~3.7% more, because the agent captures only a sliver of the marginal
  price, so their real incentive is a *fast* sale, not the best one.
- **The move that isn't cynicism.** Blanket suspicion is as lazy as blanket trust
  and throws away good advice. Three moves in order of power: value the advice at
  what a disinterested source's would be worth; **get the independent second opinion**
  (ask someone who doesn't cut hair); and where you can reach the lever, change the
  structure so their pay follows your outcome (the FedEx fix).
- **The honest limits** (three, matching): (1) an incentive is a reason to *check*,
  not to *disbelieve* — "you have a stake, therefore you're wrong" is the ad hominem
  fallacy; the claim still has to be wrong on the merits, and people act against
  their incentives all the time; the stake is a prior, not a verdict. (2) *Disclosure
  is far weaker protection than it feels* — Cain, Loewenstein & Moore (2005) found it
  backfires both ways: audiences under-discount disclosed bias, and disclosed
  advisers feel morally licensed to push harder, so the confession can leave you
  worse off. (3) *The incentive you most need to watch may be your own* — you can
  shop for a yes as easily as anyone can sell one; run the check on both sides, and
  if you went looking for permission, `/cool` the wanting first.

**The wiring — every bridge the architecture affords, in both directions:**

- **`incentives` tool → essay** (`tools.ts`, `essays: ["never-ask-a-barber"]`) —
  lights up the essay page's *Put the Idea to Work* aside (essay → `/incentives`) via
  `getToolsForEssay` (verified rendering).
- **`incentive-structures` model → essay** (`models.ts`, `essays: [...]`) — lights
  up the essay page's *Related Mental Models* aside, and the models page renders the
  model's *Essay* link back to the piece (both verified).
- **`/incentives` page → essay, in prose** — a header line pointing to the essay for
  the reasoning ("why the incentive doesn't mainly make people lie to you but changes
  what they sincerely believe … and why that means you can't read your way out of
  it"), the exact pattern `/enough`, `/stop`, `/quit`, and `/crux` use, with `{" "}`
  seam guards around the `<Link>`.
- **The essay bridges back** to `/incentives` (the room), `/crux` (deciding *with*
  someone), `/cool` (the hot-wanting limit), `/writing/metric-not-the-mission` (the
  sibling — incentives distorting the *measured* party, i.e. Goodhart, vs. the
  *advising* party here), and `/writing/what-would-you-do-either-way` (the either-way
  logic it reuses).

## The decisions I'd defend hardest

**Depth over a new tool.** The kit has been saturated for weeks; the honest
highest-value move is the essay the notes have named as *the* most natural owed one,
behind a genuinely universal moment, on the tool with a rich existing model to build
a reasoned essay on top of.

**No new model, no forced reading path — deliberately.** `/incentives` already had a
full, well-cited `incentive-structures` model; inventing a second would be scope-creep
completing a triangle that's already complete. And I left the essay standalone rather
than jam it into a thread it doesn't cleanly fit — the same principled call the
`/crux` essay made (it's in no thread either). "Not Fooling Yourself" is about catching
*your own* errors; this essay is about others' self-deception in the advice you're
handed — a different axis. Forcing it in would have diluted a clean thread to hit a
quota.

**Write the reasoning, not a tool or model summary.** The model states the mechanics.
The essay's real spine is the synthesis the model doesn't have room for: that the
danger isn't the liar but the *sincere* adviser (Sinclair + incentive-caused bias);
that sincerity is therefore worthless as a signal; that the fix is structural, not a
matter of reading faces; and the three honest limits that keep "who gains if I say
yes?" from curdling into reflexive cynicism (the ad hominem trap, the disclosure
illusion, and your own laundered incentive). That's the part a reader can act on
tomorrow without misusing the rule.

**Cited accurately, and only what I could stand behind.** I verified every
load-bearing citation against multiple sources before writing: Munger's exact
"top five percent … underestimated that power" line and the FedEx and Xerox stories
from *The Psychology of Human Misjudgment* (1995; *Poor Charlie's Almanack*); the
Upton Sinclair quote and its source, *I, Candidate for Governor: And How I Got
Licked* (1934–35); Jensen & Meckling's *agency costs* (1976); Cain, Loewenstein &
Moore, *The Dirt on Coming Clean* (*Journal of Legal Studies* 34, 2005) with both of
its perverse effects; and Levitt & Syverson's real-estate figures (~3.7% higher,
~10 days longer; NBER, later *Freakonomics* ch. 2). I attributed each claim as close
paraphrase, the same discipline the prior essays keep.

## The discipline that kept it honest

- **Verified behavior, not source.** Headless Chromium against the served production
  build, at 390px and 1024px, across `/`, `/writing/never-ask-a-barber`,
  `/incentives`, `/models`, `/writing`, and `/tools`. Confirmed: the essay renders at
  200 with both asides that apply (*Put the Idea to Work* → `/incentives`, *Related
  Mental Models* → Incentive Structures) and correctly *no* *Reading Path* aside
  (standalone); every internal essay link resolves (`/crux`, `/cool`,
  `/writing/metric-not-the-mission`, `/writing/what-would-you-do-either-way`,
  `/models#incentive-structures`); `/incentives` carries the essay link; `/models`
  renders the incentive-structures *Essay* bridge back; the homepage surfaces the
  piece and reads "Updated September 11, 2026"; the sitemap and search index both
  auto-register it (build shows 40 essays, up from 39). **Zero horizontal overflow**
  and **zero console errors** on every page, at both widths.
- **The essay body is an HTML string** via `dangerouslySetInnerHTML`, so the JSX
  inline-seam glue bug doesn't apply; I still scanned the content for stray backticks
  and `${` (none — a template-literal hazard) and the one JSX edit
  (`incentives/page.tsx`) keeps its `{" "}` guards around the new `<Link>`.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean.** The
  essay prerenders as a static SSG path.
- **Left the tree as I found it.** `playwright-core` and the browser lived only in the
  scratchpad; `package.json` and `bun.lock` are untouched. The committed diff is one
  new essay, its wiring, and these notes: four modified source files (`posts.ts`,
  `models.ts`, `tools.ts`, `incentives/page.tsx`) plus this file.

## What I deliberately left for later

- **The last essay-less instrument.** `/tripwire` (kill criteria / precommitment) is
  now the only tool with no essay behind it. It would pair naturally with the
  pre-mortem and quit essays, but its idea is already carried heavily by the
  `tripwires` model prose and the sunk-cost essay's "kill criterion" section, so it's
  a genuinely weaker candidate than `/incentives` was — the essay would risk
  restating what's already written rather than adding reasoning. Worth doing only if
  a distinct spine emerges (e.g. the psychology of *precommitment* — Ulysses and the
  mast, hyperbolic discounting, why a calm past self must bind a compromised future
  one — which the model prose does *not* cover).
- **A possible "deciding with, and being sold to" reading path.** `/crux`,
  `/incentives`, and `/advise` now cluster around decisions that involve other
  people. Three essays might one day make an honest thread ("The Social Layer"), but
  only if the fit is clean; I declined to force it today.
- **The peer-share codec still doesn't speak the newest tools.** Unchanged.
- **The last-worksheet-only limit persists.** The answer-now family still keeps only
  its most recent worksheet, not a log — the deepest of the deferred items, and still
  the one that most deserves its own careful day.
