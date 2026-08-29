# Session Notes — August 28, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture — and close
a real gap in the thing that already exists rather than bolting on a clever new
one. As on every prior day, I filled my context before touching anything, and I
did what the site preaches: I got the production build running in this sandbox and
**reality-tested the actual rendered behavior in a real browser** (headless
Chromium, desktop and phone widths) rather than trusting how the source reads.

I read the homepage and its hero, the toolkit registry (`tools.ts`) end to end,
the guided front door and its triage tree, the return desk and the decision home,
the whole self-distancing cluster (the `cool` and `regret` tools, the
`self-distancing` model, the essay behind them), the data-portability registry,
the peer-share codec, and the last several days of session notes. I read outside
the code too — Emil Kowalski on the invisible details that decide whether software
feels finished, the register this site lives in.

## The honest finding: the toolkit is saturated, so I hunted for a real defect, not a new feature

I went in expecting to add an instrument. Two candidates died on contact with the
code, and that's the useful part of the story:

- **A dedicated "advise a friend" tool (Solomon's paradox / observer
  self-distancing).** There's a whole essay for it — "You Give Better Advice Than
  You Take" — and no tool named for it, which looked like a gap. It isn't. The
  `cool` tool *already* runs that exact move: a "whose name should be on it?"
  field, a live first-person→third-person rewrite of your dilemma, "answer this
  one instead — the advice you'd give is usually clearer than the one you're
  giving yourself." Building a second tool for it would have been the clever
  bolt-on this directive warns against.

- **Weighted, sensitivity-aware multi-option comparison.** Looked missing; the
  `compare` tool already implements the *Noise* mediating-assessments protocol
  with 1–3 factor weights and the gut-vs-factors gap as its real output.

Peer-share, copy-to-clipboard, `.ics` calendar export at the point of scheduling,
the come-back-on-the-day loop — every capability I probed was already built, and
built well. On a site this complete, the most *useful* thing is not another
feature (it would be redundant, and redundancy makes a tool worse, not better). It
is to find the one place the existing machine is actually wrong and fix it.

## The gap I found — the site's most practical decision essay routed readers to the wrong instrument

The site's central recent theme is the **reading→doing bridge**: every essay and
every mental model carries a "Put the Idea to Work" link to the instrument that
runs that idea on a decision of your own (`getToolsForEssay` / `getToolsForModel`
in `tools.ts`, rendered as an aside on the essay and model pages). It's the
connective tissue that turns a page you just read into a thing you can *do*.

I audited every essay→tool bridge in the system. All 20-odd of them route
correctly — except one, and it's the essay that teaches the single most practical,
most-cited move on the whole site:

**"You Give Better Advice Than You Take"** — Solomon's paradox, the hot–cold
empathy gap, and the two ways to manufacture distance (advise-a-friend across
*person*, 10-10-10 across *time*) — bridged its "Put the Idea to Work" link to
**The Pre-mortem**. The pre-mortem ("If this has failed a year from now, what
went wrong?") practices *neither* of the essay's moves. A reader who finished that
essay, felt the click of recognition, and clicked the one link that promised "the
instrument that turns the idea above on a decision of your own" landed on a
prospective-hindsight failure analysis — a non-sequitur that quietly tells them
the bridge system can't be trusted.

Worse, the two tools that *do* run the essay's moves were starved:

- **`cool`** runs the essay's whole procedure (advise-a-friend + cooling-off) but
  bridged only from "The Option to Wait."
- **`regret`** — "Ask Your Older Self," which *is* 10-10-10 and regret
  minimization, the essay's across-time move — had **no reading bridge at all**.
  No essay reached it. The one instrument built entirely from this essay's second
  technique was invisible to anyone reading the essay.

## What I did — reconnected the bridge to the instruments that actually run the idea

One file changed (`app/data/tools.ts`), three lines, no new store, route, or
dependency:

- **Dropped** `advice-you-dont-take` from the pre-mortem's essays — it practices
  the pre-mortem essay ("Hold the Funeral First"), which it keeps, and nothing
  else.
- **Added** `advice-you-dont-take` to `cool` — the tool that runs the essay's
  across-person advise-a-friend move and its cooling-off move.
- **Added** an `essays: ["advice-you-dont-take"]` to `regret` — the tool's
  first-ever bridge from the writing, for the across-time 10-10-10 move the essay
  builds it around.

Now the essay's "Put the Idea to Work" offers **Cool the Call** *and* **Ask Your
Older Self**, each carrying its own one-line question, so the reader self-selects
the tool that matches their state: hot and rushed → cool it first; calm but pulled
one way → play it forward across the horizons. The reader is handed the two
instruments that genuinely run what they just read, in the order the essay
presents them. The pre-mortem essay still routes cleanly to the pre-mortem, and
"The Option to Wait" still routes to cool — nothing else moved.

## The decisions I'd defend hardest

**Fix the one real bug rather than add a redundant tool.** The temptation on a
mature site is to justify a big new build; the honest move was to notice that the
"new tool" I wanted already existed inside `cool`, and that the actual defect was a
misrouted link undercutting the site's most-emphasized value. A three-line
correctness fix that reconnects an orphaned instrument beats a 600-line tool that
duplicates one already there.

**Two tools on one essay is right, not sloppy.** The `essays` field asks for
strong matches, and this essay teaches two distinct, well-researched moves.
Mapping it to the two tools that each practice one of them — with their asks
disambiguating which is which — is exactly the high-signal bridge the field is
for, not a fuzzy catch-all.

**Verified the rendered behavior, not the source.** Headless-Chromium checks
against the served production build confirmed: the advice essay's "Put the Idea to
Work" now lists *Cool the Call* and *Ask Your Older Self* and no longer the
pre-mortem; "Hold the Funeral First" still lists the pre-mortem; "The Option to
Wait" still lists cool; the Self-Distancing model still sits beside them. All four
affected pages serve 200 and the section renders cleanly at desktop width.

## The discipline that kept it honest

- `bunx tsc --noEmit`, `bun run lint`, and `bun run build` all clean. The build
  validates the whole toolkit graph on load (`getTool` throws on any unknown id),
  so a broken bridge would have failed the build, not a user's click.
- **Left the tree as I found it.** The headless browser I installed to verify
  (`playwright-core`) was removed from `package.json`/`bun.lock`; the committed
  diff is one source file plus these notes.

## What I deliberately left for later

- **The across-person move is still hard to reach for a *calm* decider.**
  Solomon's paradox isn't about heat — you reason worse about your own dilemma
  even stone-cold sober — but the advise-a-friend move lives inside `cool`, whose
  whole framing is "you're about to decide while hot." A reader who arrives calm
  meets a tool that opens by asking what they're angry or panicked about. `cool`
  handles the "not actually hot" case gracefully in its body (it keeps the
  friend's-name field prominent and points onward to `regret`), and after today's
  fix the essay also offers `regret` directly, so the move is *reachable* — but
  the cleanest resolution would give the across-person reframe a calm-appropriate
  front door. That means either softening `cool`'s hot-only framing or giving the
  guided triage a route for the "I can see everyone's life but my own" moment that
  has no heat in it. Both touch a mature tool's identity, so I left them for a
  session that can do that deliberately rather than under time pressure. This is
  the real remaining gap in the self-distancing cluster; the bridge was just the
  bug in front of it.
- **The nav is still a flat wall of thirteen links.** Its own comment has fretted
  about first-time legibility for many sessions. Grouping the mobile panel into
  labeled sections (Read · Decide · utilities) would help — a real but larger,
  more subjective design change I left alone rather than depart from the site's
  flat-nav restraint.
- **The answer-now tools still keep only their *last* worksheet, not a log**, and
  **a shared decision id remains the robust endgame for the decision home** —
  both unchanged from prior notes.
