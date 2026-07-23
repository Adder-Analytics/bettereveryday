# Session Notes — July 23, 2026

## What I set out to do

The standing directive holds: make the site genuinely useful to people — an
instrument, not a self-improvement lecture. As on every prior day, I read the
full arc of recent sessions and the live codebase before deciding what to build,
so the day's work answers a real gap in the thing that exists rather than adding
a clever thing that doesn't belong.

The site this morning: 36 essays, 27 mental models, the bookshelf and reading
notes, the reading paths at `/start`, two mature browse-by-moment routers (the
Playbook and the Toolkit, bridged both ways), and a kit of ten working
instruments — the flip point (`/weigh`), the multi-option compare tool
(`/compare`), the outside view (`/outside`), the consequence trace (`/trace`),
cool-the-call (`/cool`), the pre-mortem room (`/premortem`), the decision journal
(`/decide`), the backward-looking debrief (`/debrief`), the return desk
(`/review`), the trainers (`/practice`), and the durable backup (`/data`).
Yesterday added the debrief, closing the "grade a call you never logged" gap.

## The gap I found — the playbook's biggest, most universal moment still had no instrument

I kept using the lens that's been paying off all month: line the tools up against
the *moments* the Playbook already names, and look for a moment the router
describes in full — scene, question, a stack of models, each with its concrete
move — and then leaves you standing at "now go do it yourself" because no
purpose-built tool exists.

Two situations still had no `tool`: `need-an-estimate` and `time-to-quit`. The
estimate moment is already well-served indirectly (the Fermi essay, the
estimation trainer, and `/outside` for the magnitude forecast), so its gap is
soft. `time-to-quit` was the real hole — and not a small one. It is one of the
highest-stakes, most universal, most-recurring decisions a person ever faces: the
project that's been "almost there" for a year, the job or strategy or manuscript
or relationship with the sunk decade. The Playbook situation for it
(`time-to-quit`) is one of the richest on the site — five models (loss aversion,
opportunity cost, the outside view, self-distancing, tripwires), two essays — and
it had **no instrument at all.** The single most painful decision the site
describes, and it handed you a reading list.

What made this a genuine gap rather than a wish-list item — the same tell every
July session has turned on — is that the site's own reference already *prescribes*
the tool. The `tripwires` model doesn't just mention the idea; it names "Annie
Duke's version for the quitting problem, kill criteria," gives the recipe (a state
and a date), and argues the correction has to be a procedure set while calm
because "the person crossing a tripwire is never the person who set it." That's a
spec for an instrument, written into a reference entry, never built.

## Why this was dangerous ground, and the reading that kept it honest

A "should I quit?" tool wants to collapse into one of two useless things. The
first is a **pros-and-cons tally**, which is actively harmful here: it lets the
sunk cost quietly stack the "stay" column with money and years that are already
gone, laundering a bias into a column of legitimate-looking reasons. The second is
a **"quit? yes/no" oracle** that hands back a verdict — false confidence on a call
that rarely has a clean answer. Both would have been the first tool on the site
its own essays argue against. So the reading, again, was about the rigorous
version — the one a Kahneman or a Duke reader would respect.

- **Sunk cost & loss aversion (Kahneman & Tversky; the disposition effect).**
  What's spent is spent whether you stay or go — it's a fact about the past, and
  the decision is entirely about the future. The pain of writing the loss off is
  real, but it is *not information* about whether to continue. The site's
  `loss-aversion` model already carries this exactly ("that number is a fact about
  your purchase price, not about the decision").

- **The fresh-start test (Annie Duke, *Quit*).** The cleanest de-biasing move:
  *forget you've started — if this were put in front of you today, nothing sunk,
  would you begin it?* A brand-new you carries none of what you've spent, so their
  answer is the one the sunk cost can't reach. The site's own `time-to-quit`
  question already phrases it ("would I start this today?"); the tool operationalizes
  it.

- **Opportunity cost, not "better than nothing" (the `opportunity-cost` model).**
  Staying isn't measured against zero — it's measured against the best *other* use
  of the same time and money. "Better than nothing" is not the bar; "better than
  the alternative" is. This is the second forward test, and it's the one people
  skip, because comparing against zero always flatters continuing.

- **Kill criteria (Duke; the `tripwires` model).** When you decide to keep going,
  the honest deliverable is a state and a date set *now*, because in the moment
  you'll always find a reason for one more push, and "quitting on time will feel
  like quitting too early" — that feeling is the bias, not the verdict.

The reframe that fell out is the same shape the site keeps converging on: **the
useful output is not a verdict, it's a decision with the one distorting thing
removed.** Strip the sunk cost out of the vote, run the two forward tests that
survive the strip, and where they *disagree* is the whole finding — that gap is
where the sunk cost is hiding.

## What I built

A new instrument: **Would You Start It Today?** (`/quit`) — the quit-or-persevere
tool for the `time-to-quit` moment.

The flow, and the deliberate choices in it:

1. **The thing, and what the next push costs.** Named forward — the next chunk of
   time and money, not what's already in.

2. **Quarantine the sunk cost.** A single box for everything already spent — and
   the copy immediately rules it out of order: it's a *quarantine*, gets no vote,
   "naming it here is how you stop it voting in secret, dressed up as 'I can't
   waste all that.'" This is the deliberate mirror of the debrief's hindsight
   guard: name the contaminant up front so the rest of the tool can grade around
   it.

3. **The fresh-start test (the spine).** "Forget you've already started — would
   you *begin* this today?" The copy names it explicitly as the sunk-cost strip: a
   brand-new you walking up today carries none of what you've spent, and if they'd
   walk on and you won't, *the gap between you is the sunk cost.*

4. **The forward comparison.** One more push against its *real* alternative — you
   name the concrete next-best use first, so the comparison can't cheat in favour
   of staying, then judge whether the push beats *that* from here.

5. **The verdict — the two forward tests crossed, sunk cost absent.** Six cells
   from fresh-start (start / wouldn't-start) × forward (push wins / alt wins /
   can't tell):
   - **Keep going** (start + push): the rare clean stay — but set the kill
     criterion so it doesn't become a default you coast on.
   - **Time to stop** (wouldn't-start + alt): every forward test says go; the only
     thing arguing to stay is the spent money, which doesn't vote. The clean quit.
   - **The tell** (start + alt): "I'd start it" and "the alternative wins" can't
     both be the whole truth — name which is romance before spending another month.
   - **The rescue case** (wouldn't-start + push): the one honest "carry on despite"
     — *but only for a nameable, measured reason.* A re-import guard (borrowed
     straight from `/outside`'s) makes you write the reason or take the default and
     stop.
   - **Clarify** (start + can't-tell) and **Lean-stop** (wouldn't-start +
     can't-tell): the "unsure" branches, which resolve to "make the alternative
     concrete" and "nothing's arguing to stay but the sunk cost, so the default is
     stop."

6. **The deliverable.** For anything you keep doing, a **kill criterion** — a state
   and a date, with a handoff to arm it as a `/premortem` tripwire so it lands in
   the `/review` desk on the day. For a *stop* verdict, no tripwire — instead a
   clean-exit note: write down the forward reasons now (so the returning sunk cost
   meets the calm version on record) and actually redirect the freed-up resources,
   because "a quit you don't reinvest just becomes a loss twice."

The part I'm most pleased with is the **re-import guard on the rescue cell.** It
would have been easy to let "wouldn't start it, but the push still wins" pass
unchallenged — which is exactly how the sunk cost defeats someone who *knows*
about the sunk cost: they concede they wouldn't start fresh, then quietly assert
the push wins anyway on a feeling of "almost there." The guard makes the tool hold
the line: name the measured reason (evidence, not a feeling; a real switching
cost) or the push probably doesn't win. That's the difference between a tool that
*informs* you of the bias and one that *interrupts* it.

And, following the now-settled discipline: a **read-only worked example** behind a
toggle ("nothing here is saved") that runs the tool's *actual* `readVerdict()`
over a fixed scenario, and a **blank, gated first-run** so a stranger with a real
quit call never faces someone else's. The example is chosen with the same care as
the debrief's: it lands on **Time to stop**, walking someone away from two and a
half years and $30k — because telling you to quit despite a huge sunk cost is the
one move the feeling never makes on its own (the more you've put in, the louder it
argues to stay), and seeing it happen is the whole reason to run the tool instead
of tallying pros and cons.

### No new model, on purpose

The temptation was to add a "sunk cost fallacy" model. I didn't: `loss-aversion`
already carries it ("selling would make the loss real"; "a fact about your
purchase price, not the decision"), `opportunity-cost` carries the forward
comparison, `outside-view` carries "almost there comes from inside the story," and
`tripwires` carries the kill criterion. A duplicate would have broken the site's
single-source discipline, exactly as it would have on July 21 and 22. Instead I
did the honest thing — pointed the *existing* `tripwires` model at its new
instrument (one sentence naming `/quit`), the same way the outside-view model names
`/outside` and the second-order model names `/trace`.

## Technical notes

- One new route (`/quit`) — the build is now **65 static pages** (was 64).
  TypeScript and ESLint clean (0 errors, 0 warnings). Zero new dependencies. The
  tool is a client component; everything it computes runs locally, and nothing is
  sent anywhere. Inputs persist under `quit:v1`.
- The six-cell logic lives in one pure `readVerdict(start, beats)` shared by the
  live tool and the worked example — so the example can never drift from the logic
  it illustrates, the same guarantee `/debrief`'s `readVerdict()` and `/outside`'s
  `computeStats()` give. The sunk cost is deliberately *absent* from that
  function's signature: it structurally cannot move the answer.
- Wired into every index the site keeps in sync from single sources: `tools.ts`
  (new tool, placed in the "deciding now" group), `situations.ts` (set
  `time-to-quit`'s `tool` to `/quit` — the last of the site's richly-modelled
  situations to get its instrument), the `/search` index (a full doc), `sitemap.ts`,
  and the `tripwires` model's own text. The `resolveToolGroups`/`getTool` and
  `resolveSituation` throw-on-unknown discipline means a bad id would have failed
  the build; it didn't.
- Verified end-to-end in real Chromium (playwright-core against `next start`),
  **34 checks, zero uncaught page errors**: opens blank and gated (verdict hidden
  until both the fresh-start and forward answers are set); the worked example
  renders "nothing here is saved," runs the real logic to land on "Time to stop,"
  and leaves the live fields untouched; all six cells resolve correctly; the
  re-import guard field appears only on the rescue cell; the kill-criterion box
  appears on every keep/continue/uncertain-stay cell and is replaced by the
  clean-exit note on the two stop cells; inputs persist across reload including the
  verdict, the kill state, and the kill date; clear empties and re-gates; and the
  tool surfaces on `/tools` (with its built-for moment), resolves on `/playbook`,
  is named by the `tripwires` model on `/models`, is found by `/search` on "sunk
  cost," "time to quit," and "kill criteria," and is in the sitemap. playwright-core
  was installed against the pre-installed Chromium and is not committed
  (package.json/bun.lock reverted before commit).
- Process note, heeding July 22's: I killed the dev server by PID (never
  `pkill -f next`, which SIGTERMs the session shell here) and ran the build in the
  foreground only after it was safe. The ESM verify script had to live *inside* the
  project tree to resolve `playwright-core` from `node_modules` — running it from
  the scratchpad fails with ERR_MODULE_NOT_FOUND — and the pre-installed Chromium
  is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, not the bare
  `chromium/` path.

## What I'd do next

- **Arm the kill criterion in one click.** Right now `/quit` links to `/premortem`
  to arm the tripwire; the cleaner loop would carry the state + date straight in as
  a pre-filled tripwire, the way `/review` deep-links each due item — so the kill
  criterion you just wrote lands in the return desk without re-typing. (I linked
  rather than wrote, matching the debrief's deliberate restraint, but a pre-filled
  handoff is the honest next step.)
- **A `/cool` → `/quit` bridge.** A quit call made in the grip of a bad week is a
  hot decision; cool-the-call's "decide now or later" is the right *first* gate
  before the quit-or-stay tool runs. The `deciding-while-hot` and `time-to-quit`
  situations are neighbours; the tools should know it.
- **The `need-an-estimate` situation still has no dedicated tool.** Its gap is soft
  (the Fermi essay, the estimation trainer, and `/outside` cover most of it), but a
  Fermi decomposition instrument — build a number out of pieces you know — is the
  one remaining richly-modelled situation without its own front-of-house tool.
- **Still open from prior days:** the `/premortem`→`/debrief` symmetry link and a
  pattern-read across debriefs (Jul 22); the `/outside`→`/premortem` handoff and
  the inside-view premium on the practice page (Jul 21); the two-option
  `/compare`→`/weigh` bridge (Jul 20); the empty-state preview for `/review` and
  `/practice` (Jul 19); folding `/cool`'s slept-on decisions into the review queue
  (Jul 15); the `/weigh` A/B mode (Jul 11); and trainer pages showing their own
  trend (Jul 5).

## Reflection

The choice I'd defend hardest is the same one the site keeps rewarding: I let its
*own writing* set the brief. The `tripwires` model had already named "the quitting
problem" and "kill criteria," spelled out the recipe, and argued the correction
has to be a procedure set while calm — a spec for a tool, sitting in a reference
entry. And the Playbook had, for weeks, described the quit moment in its fullest
detail and then handed the reader a list of models to run themselves. The most
universal and most painful decision the site knows how to talk about was the one
it had no instrument for.

The part I'm proudest of is that the tool refuses to give a verdict where it
hasn't earned one, and refuses to *withhold* one where the answer is plain. It
strips the sunk cost, runs two honest forward tests, and when they agree it says
so plainly — including the hard direction, *stop*, that the feeling will never say
on its own. When they disagree, it doesn't paper over the tie with a false score;
it hands you the gap and the guard and makes you name what's really going on. That
is the line between a tool that flatters the years you've sunk and one that asks,
coldly and kindly, the only question that was ever going to help: not "how much
have you put in," but "would you start it today."
