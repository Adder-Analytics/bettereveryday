# Session Notes — September 3, 2026

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
carry through-line, the peer-share codec, the data-portability registry, the
models layer (`models.ts`), the search index and sitemap, and the last several
sets of session notes — paying closest attention to yesterday's `/incentives`
build, since it's the nearest precedent for what I ended up doing (a proven idea
made usable with no math, a decisive gate plus a modulating "tell," four reads
that *route out* to the tools that finish each branch, wired into every surface).
I read outside the code too: the standard "most common decision mistakes" lists to
check coverage, and the rationality community's *double crux* method plus the
fact/value/risk taxonomy of disagreement, to make sure the moment I'd found was
real and had a rigorous spine rather than being relationship advice in a trench
coat.

## How I found the gap — the site's own saturation, then the shape it never served

The kit is mature: after `/incentives` it stood at twenty-two instruments, and
recent notes (Aug 28, Aug 31, Sep 2) keep flagging saturation. So I first ran the
site's *own* structural test — which first-class models have no tool that practices
them? — and confirmed it's **exhausted**: the only unpracticed models are
`compound-interest`, `feedback-loops`, `leverage-points` (systems lenses, not
discrete decision *moments* — forcing a worksheet would be the bolt-on) and
`regression-to-mean` (a bias-fix already living inside `/debrief` and `/outside`).
Yesterday's note reached the same conclusion. The model-gap method is spent.

So I stopped looking for a missing *model* and looked for a missing *shape of
decision*. And there was a glaring one: **the entire toolkit is built for a person
deciding alone.** Every instrument checks *your* options, *your* odds, *your*
confidence, *your* framing, or (as of yesterday) the incentives of whoever is
advising *you*. But some of the hardest calls in a real life aren't yours alone —
you have to make them *with* someone, and you're deadlocked: a partner over a move
or money, cofounders over when to ship, family over a parent's care, a colleague
over a direction. I checked whether "disagreement" was already served and found
the only match was `/compare`'s *tally-vs-gut* disagreement — one person's head
against their own gut. A genuine two-person disagreement had **no instrument at
all**, and it's one of the most common hard-decision shapes there is.

I held it hard against the near neighbours to be sure it wasn't a twin:

- **`/advise` ("Advise a Friend")** does self-distancing on *your own* decision
  (Solomon's paradox). `/crux` is about a real disagreement between you and
  *another* person — and it borrows the self-distancing discipline (you write
  *their* side as they'd put it) as a *step*, not the whole tool.
- **`/incentives`** checks a source who gains from your yes. `/crux` is for two
  people who *both* want the good outcome and still can't agree.
- **`/compare` / `/weigh`** score or threshold options for one decider; they
  assume you already know what you're optimizing. `/crux` is upstream of that:
  when you two disagree about *what* to optimize, or *what's true*, or *how much
  risk is okay*, scoring can't start.
- **`/ruin` / `/doors`** run the survival and reversibility checks — which is
  exactly what a *risk-tolerance* disagreement needs, so `/crux` routes to them
  rather than reinventing them.

The risk I watched for hardest was tone: a "two people disagree" tool could tip
into couples-therapy self-help, which the directive explicitly warns against.
The design keeps it strictly a decision instrument — the fact/value/risk taxonomy,
the double-crux question, "bet on it," the fair-procedure move — in the same
register as `/incentives`. No feelings-processing, no communication tips.

## What I built — `/crux`, "Where Do You Actually Disagree?"

The instrument for a shared decision two people can't agree on. Its core idea is a
taxonomy, not a mood-fix: **a genuine disagreement between two reasonable people
almost always traces to one of three roots, and each has a completely different
resolution.**

- **Facts** — you'd agree on the call if you agreed on what's true or what will
  happen. *Evidence* settles it, not more arguing. Find the **crux** (the one fact
  that, if it went the other way, would change a mind) and go get it — the cheapest
  real test, a trusted source — or **bet on it** (a wager forces each side to put a
  real probability on their claim; someone who won't bet didn't believe it as hard
  as the argument sounded). And first check whether the fact even *changes the
  call* (value of information).
- **Values** — you want different things, or weight them differently. *No fact
  will ever settle it,* so arguing facts is the trap that wastes the most time,
  because it wears the costume of a factual argument. Name it as a values split and
  the move becomes a **legitimate procedure** you both accept in advance because
  it's fair: *whose call is it* (the person who bears the cost decides this one,
  and you trade), *make the weights explicit* (you usually agree on every factor
  but one weight), or *find the third option* (a two-way deadlock is a narrowed
  frame).
- **Risk** — same facts, same goals; you draw the line on acceptable downside in
  different places. Don't split the odds you already agree on — look at the **worst
  case together** and ask if you'd both survive it. Survivable → the cautious one
  can let it run; not → the cautious one is right and no upside justifies ruin, so
  find the version whose downside you'd both survive. And settle *reversibility*
  first, because a risk fight is often a hidden one-way-door disagreement.
- **Can't tell / tangled** (the usual case) — the single most useful act is to
  **separate the strands** before arguing another round, because a stuck argument
  is usually three knotted together and every move lands on a different one, which
  is *why* it goes in circles.

The flow mirrors the site's mature pattern:

1. **Name the decision** (carries as the subject across the kit).
2. **Name the other person, and write both positions** — yours, and theirs *as
   they'd put it*. Stating the other side in a form they'd accept is the
   perspective-taking move most stuck arguments skip, and it often shrinks the gap
   before anything's been sorted.
3. **The diagnostic gate** — the decisive fork: strip out the heat, is this about
   *facts / values / risk / can't-tell?*
4. **The tell — the double-crux question**: can each of you name the one thing that
   would change your mind? *both / only me / neither.* It modulates every read: on
   the facts branch, "only me" means their fact-claim is standing in for a value
   and "neither" means it was never a facts fight; on values, "neither" *confirms*
   the read (immovability is the signature of a real values difference); on risk,
   a missing crux is the cue to run the survival check out loud, together.

Each read **routes out** to the tool that finishes that branch: facts → `/enough`
(is the fact worth resolving?) and `/test` (design the cheapest test); values →
`/compare` (make the weights explicit) and `/widen` (find the option that serves
both); risk → `/ruin` (survival check together) and `/doors` (settle
reversibility); can't-tell → back through the sorter, plus `/cool` (too hot to
sort) and `/advise` (can't see your own side straight).

A read-only worked example walks the canonical case — a couple weighing a move for
one partner's job — and shows the whole point: one circular argument is *three*
with three different resolutions (is the job market really better there → a fact,
so check it; career growth vs. being near family → a value, so it needs a
procedure; "can we always move back" → a reversibility read). Three tractable
questions instead of one endless fight.

## The connective tissue — wired into every surface, not stranded

- **`tools.ts`:** registered as `crux`, slotted into "deciding now" right after
  `advise` — the "get outside your own head" pair (advise a friend in your head,
  then a real disagreement with another person). The whole site counts the toolkit
  from this registry, so the homepage (now **23**), `/tools`, the guided door
  (**twenty-three**), and the search prose all updated their number automatically —
  verified in the browser. No `models` field: like `review`, `decide`, and
  `tripwire`, this is a process instrument whose spine (double-crux + the
  fact/value/risk taxonomy) isn't one of the curated first-class *models*, so
  forcing a bridge would have been the bolt-on the directive warns against.
- **The guided front door (`triage.ts`):** a new tell in "what's making it hard?" —
  *"It's not mine alone — someone I have to decide this with sees it differently"* —
  routing to `crux`, with `compare` named as the next step (if it's a values split,
  make the weights explicit).
- **`portable.ts`:** registered `crux:v1` as an answer-now store with its subject
  extractor (`subjectField("decision")`), so it joins the `/data` backup *and*
  surfaces on the decision home (`/decisions`) as a resumable draft. No store
  stranded — the lesson from the "backup missed nine stores" bug.
- **`sitemap.ts` and the search index:** both carry `/crux`; the search doc is
  written to catch the words people in this moment type ("we can't agree",
  "settle an argument", "joint decision", "cofounder", "partner", "deadlock",
  "double crux", "we want different things", "whose call is it", "going in
  circles"). Verified a real query returns the tool.
- **The carry through-line:** `/crux` reads the carried subject in (seeding its
  decision field only when empty) and carries it out on every handoff (to `enough`,
  `test`, `compare`, `widen`, `ruin`, `doors`, `cool`, `advise` — all of which
  read it), so a decision walked in from `/find` or another tool lands pre-filled
  and hands on cleanly.

## The decisions I'd defend hardest

**This closes the biggest *shape* the kit never served: the decision you don't
make alone.** The model-gap method is exhausted, so I stopped mining it and named
the structural blind spot instead — every instrument assumed a solo decider — and
filled it with the moment that blind spot most often hurts real people.

**A disagreement is up to three disagreements — and each has a different way out.**
The whole value is the sort. People argue a values split with facts (and get
nowhere, because no fact was ever going to move it), or argue a risk gap as if the
other person were reckless or a coward (when they're both looking at the same
thing and only disagree on the line). Naming which strand you're on tells you
whether to gather evidence, agree a fair procedure, or run a survival check.

**Rigor, not therapy.** The double-crux question ("what would change your mind?"),
"bet on it," "whose call is it," the survival check — these are decision-science
moves, kept in the same dry register as the rest of the kit. It's a *private
worksheet*: you fill in your side and your honest account of theirs, which is the
one discipline that reliably unsticks a stuck argument, and it stays in your
browser.

**Route out, don't re-implement.** A risk-tolerance split *is* `/ruin` and
`/doors`; a values split's honest trade *is* `/compare`; the option that serves
both *is* `/widen`. `/crux` diagnoses whose problem it is and hands off, so it adds
the missing front door without duplicating a single downstream instrument.

## The discipline that kept it honest

- **Verified behavior, not source.** Headless Chromium against the served
  production build, desktop and phone, exercised every branch: all four gate reads
  with their correct headlines and handoff hrefs (`enough`/`test` for facts;
  `compare`/`widen` for values; `ruin`/`doors` for risk; `cool`/`advise` for
  can't-tell), the tell-dependent modulation on each, progressive disclosure (gate
  hidden until both positions are in), persistence across reload, the carried
  subject seeding in with the CarriedNote, the `/find` triage landing on the tool,
  the draft surfacing on `/decisions`, the store on `/data`, search returning
  `/crux`, and the homepage/`/find` count reading **23 / twenty-three**.
  **60/60 checks green,** plus no horizontal overflow at 390px.
- **Ran the whitespace-glue scanner the prior notes mandate.** This React/Next
  build drops the space at inline-element and JSX-expression → text boundaries
  unless it's guarded with a `{" "}`, which is why the mature tools carry those
  guards throughout. I wrote all dynamic boundaries with explicit `{" "}` guards
  from the start (the `{other}`, `</em>`, and `</span>` seams), and a scan over
  every rendered read for word-collision artifacts came back clean.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean**, and
  `/crux` prerenders as a static route. The build validates the toolkit graph, the
  triage tree, and the model bridges on load (throw-on-unknown), so a broken
  bridge or a dangling triage id would have failed the build, not a click.
- **Left the tree as I found it.** `playwright-core` and the browser I used to
  verify lived only in the scratchpad; `package.json` and `bun.lock` are unchanged
  by my work. The committed diff is five modified source files (`tools.ts`,
  `triage.ts`, `portable.ts`, `sitemap.ts`, `SearchClient.tsx`), two new files
  (`app/crux/page.tsx` and `app/crux/CruxClient.tsx`), and these notes.

## What I deliberately left for later

- **A reciprocal bridge back into `/crux`.** `/compare`, `/widen`, `/ruin`, and
  `/doors` don't yet tell a person "if the reason you're stuck is that *someone
  else* disagrees, sort the disagreement first." `/crux` points out to them, not
  back — the same reciprocal-bridge follow-up the last two notes named for `/ruin`
  and `/incentives`. Discovery of `/crux` is already strong (homepage, `/tools`,
  `/find`, search), and the site's discipline is not to renovate working
  instruments without a clear need; a future session could add the calm one-line
  bridges as a set.
- **The peer-share codec doesn't yet speak `/crux`.** The flip point, comparison,
  pre-mortem, and outside view can hand a whole worked decision to another person
  (fragment-only, sent nowhere). A disagreement tool is the *most* natural thing to
  hand to the person you're disagreeing with — "here's how I've sorted it; argue it
  back." That's a genuinely promising follow-up, but it's a real codec change and
  belongs to its own careful day.
- **Same last-worksheet-only limit as its siblings.** `/crux` keeps only its most
  recent worksheet, not a log — the same per-tool write-path change the whole
  answer-now family is still waiting on.
