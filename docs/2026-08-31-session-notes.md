# Session Notes — August 31, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture — and close
a real gap in the thing that already exists rather than bolting on a clever one.
As on every prior day, I filled my context before choosing what to build, and I
did what the site preaches: I got the production build running in this sandbox and
**reality-tested the actual rendered behavior in a real browser** (headless
Chromium, desktop and phone widths, every branch of the new logic) rather than
trusting how the source reads.

I read the homepage and its hero, the toolkit registry (`tools.ts`) end to end,
the guided front door and its triage tree, the decision home and the return desk,
the carry through-line and the peer-share codec, the data-portability registry,
the models layer (`models.ts`), the search index and sitemap, and the last two
weeks of session notes — paying special attention to the recent `/advise` and
`/enough` builds, because both survived exactly the "is this a duplicate?" test
that the directive keeps warning about, and I wanted to hold my candidate to the
same bar.

## The gap I found — a whole *shape* of decision the kit doesn't serve

The toolkit is genuinely comprehensive: twenty-ish instruments covering how much
thought a call deserves, whether it's a real choice or one option in disguise,
which of two, which of several, how long it'll take, whether you could be wrong,
whether you have enough information, whether to quit, deciding hot, across time,
across person, and the whole come-back-later loop. But reading them side by side,
I noticed something they *all* quietly share: **every one of them assumes you
already hold your options.** The comparison scores the ones on your table; the
flip point weighs two you can name; the value-of-information check asks whether a
fact about a *fixed* choice would move it. They meet you once the field is in
front of you.

An enormous class of real decisions isn't shaped like that. You're **searching**
— for an apartment, a job, a hire, a used car, a partner — and the options come
*one at a time.* Each is take-it-or-leave-it: hesitate and it's gone, and you
can't line them all up because you haven't seen the rest yet. The decision isn't
*which one* — it's *when to stop looking.* And people fail at it in two
predictable, opposite ways: they grab the first shiny option before they know
what the field even looks like, or they keep passing decent ones sure the next
will be better, sail past the best one they'll ever see, and take whatever's left
in a panic. "I'll know it when I see it" is not a stopping rule; it's how both of
those happen.

This has a *proven* answer — the secretary problem, the "37% rule" (Christian &
Griffiths, *Algorithms to Live By*) — and the site had no instrument for it, and,
tellingly, **the idea appeared nowhere on the site at all**, not even as a
footnote inside another tool. That's the decisive check the prior sessions taught
me: a genuine gap is a moment that is served *nowhere as a front door* and whose
core idea isn't already living somewhere else.

I held it against the near neighbours to be sure it wasn't a twin:

- **`/compare` (the halo-off comparison)** is the closest, and it's exactly the
  contrast that makes the gap real: `compare` is for when you can lay the options
  *side by side* and score them. The stopping moment is the one *before* that —
  when you can't, because they arrive in sequence and passing is final. So I made
  that distinction the tool's own opening gate: if you *can* revisit passed
  options or see them all at once, it says so plainly and routes you *out* to
  `/compare`, which really is the right tool then.
- **`/enough` (value of information)** is a true sibling, not a duplicate: both
  answer "when do I stop gathering and commit," but over different things —
  `enough` over *information* about a fixed choice, `stop` over *options* in a
  search. Different underlying result (Hubbard's VoI vs. the secretary problem),
  different moment. I wired them to reinforce each other rather than blur: the
  over-searching read routes to `/enough` for the case where the pull to keep
  looking is really a hope that more *information* will make the call obvious.

## What I built — `/stop`, "When Do You Stop Looking?"

A new answer-now instrument that runs the 37% rule with no math at all:

1. **Name the search** (carries as the subject through the whole kit).
2. **Gate the shape.** Three honest options: sequential-and-final (proceed), *I
   can go back to any option* (→ this isn't a stopping problem, it's a comparison
   → `/compare`), or *they're all in front of me at once* (same → `/compare`).
   The rule only applies to a genuine no-recall sequential search, so the tool
   refuses to pretend otherwise.
3. **Size the field** — three ways, because real searches are bounded three ways:
   a rough count of options (look phase = round(N/e)), a time window in weeks
   (spend the first 37% looking), or *can't bound it at all* → the robust
   qualitative version (calibrate on a handful, set your bar, take the first that
   clears it). The look-phase number falls out and is phrased for whichever mode
   you chose, with an honest note when the field is too small for the rule to
   bite.
4. **Locate yourself in the search** — and *this* is the actionable heart, because
   the same rule means a different move depending on where you're standing:
   - **Still early → "Keep looking, and take nothing."** The look phase's one job
     is to *calibrate*; the best option you see in it is there to set the bar, not
     to be taken. Names the early-grab trap before it happens.
   - **Past the look phase, and this one beats everything → "Take it."** The leap.
     It names why it won't feel certain (you *can't* know it's the best without
     seeing the rest, by which point they'd be gone) and routes to `/act` (claim
     it before it's gone) and `/decide` (log the call).
   - **Past the look phase, nothing's beaten it yet → "Take the next that beats
     your bar."** Hold your nerve and your bar; don't keep raising it because
     nothing has cleared it — and as the field runs out, *lower* the bar rather
     than hold out for a winner that may not exist.
   - **Been at it far too long → "You're past the rule — call time."** The second,
     costlier failure mode (each further look now costs more than the marginal
     better option — opportunity cost against you). Routes to `/tripwire` (set a
     date and what you'll take, so "just one more" can't move the goalposts) and
     `/enough` (is it really about seeing more?).

A read-only worked example walks the whole rule on one search — the apartment hunt
where the fifth flat you loved and let go *wasn't* a mistake: it set the bar that
let you recognize the eighth and commit the same afternoon, instead of losing it
to someone who could.

## The connective tissue — wired into every surface, not stranded

- **`tools.ts`:** registered as `stop`, slotted into the "deciding right now"
  group right after `enough` (its conceptual sibling). The whole site counts the
  toolkit from this registry, so the homepage, `/tools`, the guided door, and the
  search prose all updated their number automatically — the front door now reads
  **twenty** instruments, verified in the browser.
- **A new mental model, `optimal-stopping`:** the concept was genuinely *absent*
  from the site — a first-class idea (the secretary problem, Kepler's marriage,
  Christian & Griffiths) that deserves its own home. The `/models` page and search
  index consume the models list directly, so both picked it up automatically, and
  `getToolsForModel` reverse-links it to `/stop`.
- **The guided front door (`triage.ts`):** a new tell in the "what's making it
  hard?" node — *"There's always another option — I can't tell when to stop
  looking"* — routing to `stop`, with `act` named as the itinerary's next step
  (when one clears the bar, commit it before it's gone).
- **`portable.ts`:** registered `stop:v1` as an answer-now store with its subject
  extractor (`subjectField("search")`), so it joins the `/data` backup *and*
  surfaces on the decision home (`/decisions`) as a resumable in-progress draft —
  the two things the "backup missed nine stores" bug was about. No store stranded.
- **`sitemap.ts` and the search index:** both carry `/stop`, the search doc
  written to catch the words people in this moment actually type ("when to stop
  searching," "am I settling," "holding out too long," "secretary problem,"
  "apartment hunting," "37% rule").
- **The carry through-line:** `/stop` reads the carried subject in (seeding its
  search field only when empty) and carries it out on every handoff, so a decision
  walked in from `/find` or another tool lands pre-filled, and its own routes (to
  `compare`, `act`, `decide`, `tripwire`, `enough`) hand the decision on rather
  than dropping it on the threshold.

## The decisions I'd defend hardest

**This closes a *shape* of decision, not a duplicate.** The gap wasn't a missing
moment inside the territory the kit already covers — it was a whole axis the kit
silently assumed away: *you don't have the options yet, they're still arriving.*
The tool earns its place by doing the one thing every existing tool structurally
can't (reason about *when to stop the search itself*) and by routing *out* to
`/compare` the instant the situation turns out to be a comparison after all. That
route-out is the honesty that keeps it from overreaching.

**Refuse the math, keep the rigor.** Like the flip point (`p* = R/(B+R)`) and the
outside view (reference classes), this is the site's signature move: a real,
proven result made usable without a single formula on screen. The 37% is derived
once, in the model; the tool only ever says "look at the first four, take none,
then take the first that beats them."

**Route the position, don't just state the rule.** The genuinely useful payoff
isn't the rule (that's a paragraph anyone could read) — it's that the *same* rule
means "take nothing" or "take it, now" or "call time" depending on where you're
standing, and the tool tells you which, and hands you the tool for the next move.
The same reading→doing ethos the rest of the site runs on, inside one worksheet.

## The discipline that kept it honest

- **Verified behavior, not source.** Headless Chromium against the served
  production build, desktop and phone, exercised every branch: the two route-outs
  (recall / all-at-once → compare), the three field-sizing modes with their
  computed look phases (count 12→4, time 6→2 weeks, unbounded), the small-field
  edge (N=1 → look phase 0, N=3 → 1), all four position reads with their correct
  handoff hrefs (`act`/`decide`/`tripwire`/`enough`/`compare`/`weigh`),
  persistence across reload, the carried subject seeding in and the carried note
  showing, the `/find` triage landing on the tool, the draft surfacing on
  `/decisions`, the store appearing on `/data`, and the search returning `/stop`
  for three different real queries. **38/38 checks green.** I also scanned every
  rendered read for the whitespace-collapse bug class prior sessions have caught
  (`</em>`/`</strong>` glued to the next word) — none, on `/stop` or `/models`;
  the source carries explicit `{" "}` guards throughout.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean**, and
  `/stop` prerenders as a static route. The build validates the toolkit graph, the
  triage tree, and the model bridges on load (throw-on-unknown), so a broken
  bridge or a dangling triage id would have failed the build, not a click.
- **Left the tree as I found it.** The headless browser and `playwright-core` I
  installed to verify lived only in `/tmp`; `package.json` and `bun.lock` are
  byte-for-byte unchanged. The committed diff is six modified source files
  (`tools.ts`, `models.ts`, `triage.ts`, `portable.ts`, `sitemap.ts`,
  `SearchClient.tsx`), two new files (`app/stop/page.tsx` and
  `app/stop/StopClient.tsx`), and these notes.

## What I deliberately left for later

- **A reciprocal bridge from `/compare` and `/enough` back to `/stop`.** `/stop`
  points *out* to both, but neither points *in* — a person on `/compare` who
  realizes their options actually arrive in sequence isn't told there's a tool for
  that. I left the mature tools untouched (the site's discipline is not to
  renovate a working instrument without a clear need), and discovery of `/stop` is
  already strong (homepage, `/tools`, `/find`, search, `/models`). A future
  session could add the calm one-line bridge each way.
- **The look-phase math is the classic no-recall / want-the-single-best case.**
  Real searches sometimes allow partial recall, or you'd be happy with "top 10%,"
  which shifts the optimal cutoff. The tool names the search-cost adjustment (lower
  the bar as options dwindle) but keeps the headline rule at the robust 37%,
  because the exact cutoff genuinely barely matters and a second slider would cost
  more clarity than it buys. A future session could add an "I'd settle for very
  good, not the best" mode if it earns its complexity.
- **The answer-now tools still keep only their *last* worksheet, not a log.**
  `/stop` is the same as its siblings here; a real named-and-saved log for an
  answer-now tool remains a careful per-tool write-path change for a future day.
