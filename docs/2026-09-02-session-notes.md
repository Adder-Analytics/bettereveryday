# Session Notes — September 2, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture — and close
a real gap in the thing that already exists rather than bolting on a clever one.
As on every prior day, I filled my context before choosing what to build, and I
did what the site preaches: I got the production build running in this sandbox and
**reality-tested the actual rendered behavior in a real browser** (headless
Chromium, desktop and phone widths, every branch of the new logic) rather than
trusting how the source reads.

I read the homepage and hero, the toolkit registry (`tools.ts`) end to end, the
guided front door and its triage tree, the decision home and the return desk, the
carry through-line, the data-portability registry, the models layer (`models.ts`),
the search index and sitemap, and recent session notes — paying closest attention
to yesterday's `/ruin` build, since it's the nearest precedent for what I ended up
doing (a proven idea made usable with no math, wired into every surface, keyed to
a first-class model, routing *out* the moment it turns out not to be the problem).
I also did some genuine outside reading: the standard "most common decision
mistakes" lists (to check the kit's coverage against them), and Annie Duke's
kill-criteria / pre-mortem lineage, to be sure I wasn't about to rebuild a moment
the kit already serves.

## How I found the gap — the site's own promise, unkept

The kit is mature: after `/ruin` it stood at twenty-one instruments, and the near
neighbours for most "new tool" ideas are already built. So instead of guessing at
a missing moment, I used the site's *own philosophy* to find the gap. The site
promises — structurally, via `getToolsForModel` and the essay/model bridges — that
every idea it teaches points to the instrument that *runs* it on a decision of
your own. So I asked the mechanical question: **which first-class mental models
have no tool that practices them?** Five did:

- `compound-interest`, `feedback-loops`, `leverage-points` — mindsets/systems
  lenses, not discrete decision *moments*; that's *why* they have no worksheet, and
  forcing one would be the bolt-on I'm told to avoid.
- `regression-to-mean` — a real judgment correction, but closer to a bias-fix that
  already lives inside `/debrief` and `/outside` than a standalone front door.
- **`incentive-structures`** — Charlie Munger's *"show me the incentive and I'll
  show you the outcome."* A concrete, universal decision moment with **no
  instrument**, and the one whose absence was a genuine hole rather than an
  awkward fit.

That last one is the gap. The site explains incentives as a first-class idea, but
gave a person *no way to run the check* on a real recommendation they'd been handed.
And it's one of the most common decision moments there is: you're being advised,
sold, or urged toward a choice by someone who gains from your yes — a financial
adviser on commission, an agent paid on the sale price, a contractor pricing the
bigger job, a recruiter paid when you sign, a boss whose bonus rides on it — and
you can't tell how much of the advice is the advice and how much is the incentive.

I held it against the near neighbours to be sure it wasn't a twin:

- **`/test` ("Could You Be Wrong?")** is the closest surface, and the contrast is
  the whole design. `/test` interrogates *your own* reasoning for what would prove
  it wrong (confirmation bias). `/incentives` interrogates the reasoning you were
  *given* — by someone with a stake — for how much of it is the incentive talking.
  One checks the thinker; the other checks the source. Both are about the
  reliability of an input *before* you weigh it, which is exactly why I slotted the
  new tool right after `/test` in "deciding now": the two "check what you're
  working from" instruments, side by side.
- **`/widen`** surfaces options nobody named; `/incentives` *routes to* it (the
  options an incentivized messenger never mentions are the ones they don't get paid
  for) but does the thing widening can't — diagnose whose side the recommendation
  is on in the first place.
- **`/outside` / `/advise` / `/regret`** are all about *your own* distortions
  (optimism, Solomon's paradox, how a feeling ages). None asks the "whose interest
  shaped this input?" question.

## What I built — `/incentives`, "Who Gains If You Say Yes?"

A new answer-now instrument that runs the incentive check with no cynicism and no
math. Its signature move is the site's usual one: refuse the lecture, keep the
rigor. The core distinction it teaches and enforces is **alignment vs.
divergence** — a source who wins only when you win (weigh their advice on its
merits) vs. one who wins whether or not you do (worth exactly what it'd be worth
from someone who *didn't* get paid for your yes). And its real payoff — the part
people miss — is that the answer to a diverged incentive is almost never "distrust
them and walk." It's to *disarm the incentive*: get the same recommendation from
someone paid differently, or change the structure so their pay tracks your outcome.

The flow:

1. **Name what you're being urged toward** (carries as the subject through the kit).
2. **Name the messenger, and — concretely — what they gain from your yes.** Not
   just money: a quota met, a client kept, status, an awkward conversation avoided.
   Writing the gain down *is* the move; an incentive you can't see is one you can't
   subtract.
3. **The alignment gate** — the decisive fork, four honest options: *they win only
   if I win* / *they win whether or not I do* / *partly — aligned on the big thing,
   not the details* / *I don't actually know how they're paid.*
4. **The tell** — the diagnostic structure alone can't give you: *picture the exact
   moment your best move would cost them — what do you expect them to do?* (steer
   you right at their own cost / push their way / never seen them at that fork). It
   *modulates* each gate: a diverged structure with a person who'd still steer you
   right is a trustworthy person inside a bad structure; a "we put clients first"
   alignment whose person would push their way is a claim that isn't structural.

The four reads route the position rather than delivering a verdict on the person:

- **Aligned → "The incentive's on your side — weigh the advice on its merits."**
  Their skin's in the same game, so the reflex to discount would just throw away
  good counsel. The one caveat: confirm the alignment is *structural* ("we're paid
  only when you profit"), not a *slogan* ("we put clients first") — and if the tell
  says they'd push their way, that mismatch means the alignment may be claimed, not
  built into how they're paid. Routes *out* to `/weigh` (decide on the merits) and
  `/test` (a trustworthy source can still be wrong).
- **Diverged → "Discount the advice to its incentive-free core."** The core read.
  It doesn't make them a liar and doesn't make the advice wrong — it means the
  advice is worth what it'd be worth from someone unpaid, so subtract the incentive
  and see what's left. Then the actionable heart: **don't distrust them — disarm the
  incentive** (second opinion from someone paid differently; change the structure to
  flat-fee / paid-on-results / fiduciary; ask for the option they *don't* get paid
  for and watch the reaction; subtract the messenger — would a stranger with nothing
  to gain have sold you this?). Modulated by the tell (trusted person = better than
  a cynic in a good structure, but don't lean on virtue where structure is against
  you). Routes to `/widen` and `/test`.
- **Partly → "Find the one seam where you split — and read the advice there."** The
  slippery middle: broadly aligned, so you relax, and the incentive bends the
  *details* (the agent wants the sale, and also fast and cheap; the doctor wants you
  well, and the procedure pays). Name the single axis of divergence — price, timing,
  size, product — and put all your scrutiny there. Routes to `/trace` and `/widen`.
- **Can't tell → "Find out how they're paid — that one fact reorders everything."**
  You can't run the check without it. Ask plainly ("How do you get paid on this? Do
  you make more if I choose one way?") and listen to *how* they answer: vagueness or
  offence where a plain number should be is itself the answer. Routes to `/test` and
  `/widen` while the answer comes back.

A read-only worked example walks the canonical case — an adviser recommending a
commission-paying actively-managed fund — and shows the **reshape**, not a refusal:
ask for the fee-only version, compare against a low-cost index fund they earn
nothing on, and ask what they'd do if you chose the index. Same expert, decision
made on the merits.

## The connective tissue — wired into every surface, not stranded

- **`tools.ts`:** registered as `incentives`, slotted into "deciding now" right
  after `test` (its input-reliability pair). The whole site counts the toolkit from
  this registry, so the homepage (now **22**), `/tools`, the guided door
  (**twenty-two**), and the search prose all updated their number automatically —
  verified in the browser.
- **The model bridge:** the tool declares `models: ["incentive-structures"]`, and
  since `/models` and search read `getToolsForModel` directly, the incentive-
  structures model now reverse-links to the instrument that runs it — closing
  exactly the "idea with no practice" gap that motivated the build. No `models.ts`
  change was needed; the model already existed, unpracticed.
- **The guided front door (`triage.ts`):** a new tell in "what's making it hard?" —
  *"Someone's pushing this — and they stand to gain from my yes"* — routing to
  `incentives`, with `widen` named as the next step.
- **`portable.ts`:** registered `incentives:v1` as an answer-now store with its
  subject extractor (`subjectField("decision")`), so it joins the `/data` backup
  *and* surfaces on the decision home (`/decisions`) as a resumable draft. No store
  stranded — the lesson from the "backup missed nine stores" bug two weeks back.
- **`sitemap.ts` and the search index:** both carry `/incentives`; the search doc is
  written to catch the words people in this moment type ("conflict of interest",
  "whose interest", "cui bono", "biased advice", "commission", "kickback",
  "fee-only", "fiduciary", "should I trust this recommendation", "show me the
  incentive", "skin in the game"). All four test queries return the tool.
- **The carry through-line:** `/incentives` reads the carried subject in (seeding
  its decision field only when empty) and carries it out on every handoff (to
  `weigh`, `test`, `widen`, `trace`), so a decision walked in from `/find` or another
  tool lands pre-filled and hands on cleanly.

## The decisions I'd defend hardest

**This closes a gap the site defined about itself.** I didn't invent a moment and
argue it was missing — I used the site's own structural promise (every idea points
to the tool that runs it) to find an idea it teaches but gave you no way to
practice, and picked the one of five that was a genuine decision *moment* rather
than an awkward fit. That's the least "bolt-on" a new tool can be.

**Check the source, not just the thinker.** Almost the entire kit checks *your*
reasoning — your options, your optimism, your confidence, your framing. But a huge
share of what people decide with is *handed to them* by someone with a stake, and
nothing checked that. `/incentives` is the missing half: `/test` for the input you
were given.

**Disarm, don't distrust.** The useful payoff isn't "be suspicious of everyone" —
that's as lazy as trusting everyone and throws away good advice with the bad. It's
that you can almost always get to the same decision *without the tilt*: the fee-only
version, the structure change, the option they don't get paid for. That's the
reading→doing ethos the rest of the site runs on, inside one worksheet.

**The tell is the lesson.** Asking "at the exact fork where your good is their loss,
what would they do?" teaches the structural-vs-claimed-alignment distinction by
*making you run it*, not by lecturing it — and it's what lets the reads separate a
trustworthy person in a bad structure from a bad structure with a matching person.

## The discipline that kept it honest

- **Verified behavior, not source.** Headless Chromium against the served
  production build, desktop and phone, exercised every branch: all four gate reads
  with their correct headlines and handoff hrefs (`weigh`/`test` out for aligned;
  `widen`/`test` for diverged; `trace`/`widen` for partly; `test`/`widen` for
  can't-tell), the tell-dependent modulation notes (the "claimed not structural"
  caveat on aligned; trusted/push/unknown variants on diverged and partly),
  persistence across reload, the carried subject seeding in with the CarriedNote,
  the `/find` triage landing on the tool, the draft surfacing on `/decisions`, the
  store appearing on `/data`, search returning `/incentives` for four real queries,
  the `/models` bridge, and the homepage/`/find` count reading **22 / twenty-two**.
  **49/49 checks green.**
- **Caught and killed the whitespace-collapse bug class prior sessions warn about.**
  This React/Next build drops the space at inline-element and JSX-expression → text
  boundaries (`</em> word`, `</span> &mdash;`, `{messenger} a liar`) unless the space
  is made explicit with a `{" "}` guard — which is exactly why the mature tools carry
  those guards "throughout." My first draft rendered `ownthinking`, `advisera liar`,
  `differently—`. I wrote a dedicated glue scanner that renders every read + the
  worked example + the header and asserts the *spaced* form of every dynamic
  boundary is present, guarded all ~15 boundaries, and iterated to **GLUE-SCAN
  CLEAN**. This was the bulk of the verification work and the reason to reality-test
  the render rather than trust the source.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean**, and
  `/incentives` prerenders as a static route. The build validates the toolkit graph,
  the triage tree, and the model bridges on load (throw-on-unknown), so a broken
  bridge or a dangling triage id would have failed the build, not a click.
- **Left the tree as I found it.** The headless browser and `playwright-core` I
  installed to verify lived only in the scratchpad; `package.json` and `bun.lock`
  are byte-for-byte unchanged. The committed diff is five modified source files
  (`tools.ts`, `triage.ts`, `portable.ts`, `sitemap.ts`, `SearchClient.tsx`), two
  new files (`app/incentives/page.tsx` and `app/incentives/IncentivesClient.tsx`),
  and these notes.

## What I deliberately left for later

- **A reciprocal bridge from `/weigh` back to `/incentives`.** A person at the flip
  point weighing advice they were handed isn't told there's a check for whose
  interest shaped the inputs. `/incentives` points *out* to `/weigh`, but not back;
  I left the mature tool untouched (the site's discipline is not to renovate a
  working instrument without a clear need), and discovery of `/incentives` is already
  strong (homepage, `/tools`, `/find`, search, `/models`, and the `/test` pairing).
  This is the same reciprocal-bridge follow-up yesterday's notes named for `/ruin`;
  a future session could add both calm one-line bridges together.
- **The tool takes the incentive judgment as given.** It asks *whether* the pay
  tracks your outcome, not helps you compute a fee or model a commission. That's
  deliberate — being roughly right about which side of the aligned/diverged line
  you're on is a judgment a human can make, and a calculator would undercut it — but
  a future session could add an optional "name the fee" helper for the money case if
  it earns its complexity.
- **The answer-now tools still keep only their *last* worksheet, not a log.**
  `/incentives` is the same as its siblings here; a real named-and-saved log for an
  answer-now tool remains a careful per-tool write-path change for a future day.
