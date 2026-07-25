# Session Notes — July 24, 2026

## What I set out to do

The standing directive holds: make the site genuinely useful to people — an
instrument, not a self-improvement lecture. As on every prior day, I read the
full arc of recent sessions and the live codebase before deciding what to build,
so the day's work answers a real gap in the thing that exists rather than adding
a clever thing that doesn't belong.

The site this morning: 36 essays, 27 mental models, the bookshelf and reading
notes, the reading paths at `/start`, two mature browse-by-moment routers (the
Playbook and the Toolkit, bridged both ways), and a kit of eleven working
instruments — the flip point (`/weigh`), the multi-option compare tool
(`/compare`), the outside view (`/outside`), the quit-or-stay tool (`/quit`), the
consequence trace (`/trace`), cool-the-call (`/cool`), the pre-mortem room
(`/premortem`), the decision journal (`/decide`), the backward-looking debrief
(`/debrief`), the return desk (`/review`), and the trainers (`/practice`).
Yesterday added `/quit`, the last of the site's richly-modelled *deliberation*
situations to get its instrument.

## The gap I found — the site helped you decide well, then went quiet at the exact moment decisions die

I kept using the lens that's been paying off all month: line the tools up against
the *moments* the Playbook already names, and look for a moment the router
describes in full — scene, question, a stack of models, each with its concrete
move — and then leaves you standing at "now go do it yourself" because no
purpose-built tool exists.

After `/quit` landed yesterday, exactly one richly-modelled situation still had no
`tool`: **`make-it-happen`** — "You've made the call — now make sure it happens."
And it isn't a fringe moment. It's the one that comes *after every other tool on
the site*. Every instrument here fires around the decision — weigh it, compare
the options, forecast the magnitude, cool the hot version, run the pre-mortem, log
it, grade it later. Then the site fell silent at the precise point its own Playbook
names as where most decisions die: "the week after a decision is where most of
them quietly die — never started, or never revisited when something changed." The
site had become very good at helping you *decide* and had no instrument for the
part that actually changes your life: *doing*.

What made this a genuine gap rather than a wish-list item — the same tell every
July session has turned on — is that the site's own reference already *prescribes*
the tool, in unusual detail. The `implementation-intentions` model doesn't just
mention if-then plans; it spells out the whole instrument: an if-then pointed at
*doing* (Gollwitzer's implementation intention — "when [specific situation], I
will [specific action]," d ≈ 0.65 across 94 studies), plus "the tripwire is the
same tool pointed the other way," an if-then pointed at *reconsidering* — and
"the two together cover both ways a decision dies after it's made, never started
or never revisited." That's a spec for a tool, written into a reference entry, and
the essay `deciding-and-doing` closes by noting the decision journal already asks
for a single first-move line. The full instrument had never been built.

## Why this was dangerous ground, and the reading that kept it honest

An "action plan" tool wants to collapse into a **to-do list** or a **habit
tracker** — the generic productivity app, which is exactly the self-improvement
lecture the directive rules out. The whole discipline of this site is that a tool
is an *instrument tied to a rigorous idea that interrupts a specific failure
mode*, not a container for tasks. So the reading, again, was about the version a
Gollwitzer reader would respect — and, crucially, about the caveats, because the
caveats are where the honest tool diverges from the productivity app.

- **The intention–action gap (the `deciding-and-doing` essay; Sheeran's reviews).**
  Knowing what you intend barely predicts whether you'll do it; the gap is the
  default. An intention "lives in your head and quietly waits to be remembered,
  re-decided, and acted on at some unspecified later moment — and that moment,
  undefended, tends never to arrive."

- **Implementation intentions (Gollwitzer & Sheeran, 94 studies).** The fix is a
  single sentence with a *trigger* in it. The mechanism is delegation: you hand
  the behaviour from your distractible in-the-moment self to the situation, so the
  action fires with far less friction. "The specificity is the whole trick" — a
  concrete cue (a time, a place, an event you'll unambiguously notice) fires;
  "soon," "later," "when things calm down" never become cues, so they never fire.

- **The tripwire, the if-then reversed (Heath brothers, *Decisive*; Duke's kill
  criteria; the `tripwires` model).** A decision dies two ways. The first if-then
  makes sure a good call *happens*; the tripwire makes sure a call quietly going
  wrong doesn't *coast* past the point it stopped being right. A state and a date,
  set while calm.

- **The two honest limits (both named in the essay).** (1) An if-then is weak
  against a goal you don't actually want — "there the problem is the wanting, not
  the planning," and "no clever cue rescues a decision your gut keeps voting
  against." (2) A plan welded to one rigid cue makes you brittle, which is exactly
  why you set the tripwire alongside it. These aren't footnotes; they're the spine
  of what separates an honest tool from a habit app.

The reframe that fell out matches the shape the site keeps converging on: **the
useful output isn't a task list, it's the decision turned into two sentences that
run without you — one that fires the start, one that fires the reconsider — after
an honest check that a plan is even the right tool.**

## What I built

A new instrument: **Decided Isn't Done** (`/act`) — the make-it-happen tool for
the `make-it-happen` moment.

The flow, and the deliberate choices in it:

1. **The call, and the honest gate.** You name what you've decided, then answer
   the one question every productivity tool skips: *is the hard part the doing, or
   the wanting?* If you only feel you **should**, the tool **refuses to build a
   plan** — it says the problem is the wanting, no cue rescues a goal your gut
   keeps voting against, and building a plan here would just be a more
   sophisticated way of not deciding. It routes you back to the deciding tools
   (`/weigh`, `/compare`, or `/quit` if you're already in it). This is the
   counterintuitive move for `/act`, the equivalent of `/quit` walking someone
   away from $30k: the tool tells a whole class of users that *it is the wrong
   tool*, which no habit app ever does. It's also the deliberate mirror of
   `/quit`'s sunk-cost quarantine and `/debrief`'s hindsight guard — name the
   contaminant up front so the rest of the tool can work around it.

2. **The first move — small enough to finish this week.** Not the whole thing;
   the smallest concrete step you could finish in one sitting. The copy grounds it
   in `reversibility`: the first step's job is to *start*, not to finish, and a
   cheap, easy-to-undo step taken now beats a perfect one planned forever, because
   action creates information deliberation can't.

3. **The cue that fires it.** The if-then's "if" — bound to a time, place, or (best)
   an event that already happens on its own. A conservative inline heuristic flags
   a cue that will never trip ("soon," "when I have time," "eventually") without
   false-flagging a real one ("when I sit down Monday at 9").

4. **The obstacle, and the coping if-then.** Second-generation II: name the one
   thing most likely to stop the first move, and pre-decide *now* what you'll do
   when it shows up. The if-then that shields the plan from the first time the
   world doesn't cooperate.

5. **The tripwire to reconsider.** The same if-then pointed the other way — a state
   and a date, "if X by this date, I stop and rethink," reusing the site's
   established tripwire recipe. Handoff to `/premortem` to arm it and `/review` so
   it lands on the day.

6. **The deliverable — a plan you can hold.** The three if-thens assembled into
   clean sentences (to start / if it stalls / to reconsider), **copyable**, with a
   readiness read that names any weak link: a vague cue, a missing coping plan, a
   missing tripwire. "Ready" means all three are in place and the copy tells you to
   put it where the cue lives so it outranks the tired, later version of you.

The part I'm most pleased with is the **gate that refuses to run.** It would have
been easy — and it's what every tool in this space does — to assume the user wants
the thing and just needs a system, then sell them a cleverer trigger. The essay is
explicit that this is where the technique *fails*: three good plans skated past is
a signal to revisit the call, not to engineer a fourth. Making the tool hold that
line — telling some users a plan is the wrong instrument and sending them back to
decide — is the difference between an honest instrument and the productivity app
the directive rules out.

And, following the now-settled discipline: a **read-only worked example** behind a
toggle ("nothing here is saved") that runs the tool's *actual* `assemblePlan()`
over a fixed scenario, and a **gated build** so the plan-builder only appears once
you've answered the gate — a stranger never lands mid-form. The example is the
universal case — meaning to save for retirement and never starting — built out to
a load-bearing plan, chosen because it's the intention–action gap everyone
recognizes and it shows the whole payoff shape: a resolution turned into a
sentence with a trigger, the one obstacle disarmed in advance, a line for when to
stop and rethink.

### No new model, on purpose

The temptation was to add a "procrastination" or "first-move" model. I didn't:
`implementation-intentions` already carries the entire idea (the if-then, the
d ≈ 0.65, both caveats, and the tripwire-as-reversed-if-then), `tripwires` carries
the reconsider half, and `reversibility` carries "action creates information." A
duplicate would have broken the site's single-source discipline, exactly as it
would have on July 21–23. Instead I did the honest thing — pointed the *existing*
`implementation-intentions` model at its new instrument (one sentence naming
`/act`), the same way `tripwires` names `/quit` and the outside-view model names
`/outside`.

## Technical notes

- One new route (`/act`) — the build is now **66 static pages** (was 65).
  TypeScript clean (0 errors). Zero new dependencies. The tool is a client
  component; everything it computes runs locally, and nothing is sent anywhere.
  Inputs persist under `act:v1`.
- The plan logic lives in two pure functions shared by the live tool and the
  worked example — `assemblePlan(inputs)` (assembles the three if-then sentences
  and reads how load-bearing the plan is) and `cueIsVague(cue)` (the conservative
  vague-cue flag) — so the example can never drift from the logic it illustrates,
  the same guarantee `/quit`'s `readVerdict()` and `/debrief`'s give.
- Wired into every index the site keeps in sync from single sources: `tools.ts`
  (new tool, plus a **new fourth group**, "You've made the call — now make it
  happen," placed between the big-commitment and coming-back groups — so the
  toolkit now tells the full decision lifecycle: decide now → commit with a record
  → make it happen → come back), `situations.ts` (set `make-it-happen`'s `tool` to
  `/act` — the last richly-modelled situation to get its instrument), the
  `/search` index (a full doc), `sitemap.ts`, and the `implementation-intentions`
  model's own text. The `resolveToolGroups`/`getTool` and `resolveSituation`
  throw-on-unknown discipline means a bad id would have failed the build; it
  didn't.
- Verified end-to-end in real Chromium (playwright-core against `next start`),
  **31 checks, zero uncaught page errors**: opens gated (builder hidden until the
  gate is answered); the worked example renders "nothing here is saved," runs the
  real `assemblePlan()` to a "ready" plan, and leaves the live fields untouched;
  the "should" gate refuses to build and shows the wrong-tool panel; the "want"
  gate reveals the builder; a vague cue is flagged both inline and in the readiness
  gaps and the flag clears on a concrete cue; all three if-thens assemble from
  their fields; the readiness read moves thin → partial → ready as fields fill;
  inputs persist across reload including the assembled plan; clear re-gates; and
  the tool surfaces on `/tools` (with its new group), resolves on `/playbook`, is
  named by the `implementation-intentions` model on `/models`, is found by
  `/search` on "intention action gap" and "follow through," and is in the sitemap.
  playwright-core was installed against the pre-installed Chromium and is not
  committed (package.json/bun.lock reverted before commit; the verify script
  removed).
- Process note, heeding prior days': I stopped the dev server by resolving its PID
  from the listening port (`fuser 3111/tcp`), never `pkill -f next` (which SIGTERMs
  the session shell here). The ESM verify script lived *inside* the project tree so
  it could resolve `playwright-core` from `node_modules`, and the pre-installed
  Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## What I'd do next

- **Pre-fill the reconsider tripwire into `/review`.** Right now `/act` links to
  `/premortem` to arm the tripwire (matching `/quit`'s deliberate restraint), but
  the cleaner loop would carry the state + date straight in as a pre-filled
  tripwire, the way `/review` deep-links each due item — so the reconsider line you
  just wrote lands in the return desk without re-typing. This is now the *shared*
  next step for both `/quit` and `/act`, which is a good sign it's worth building a
  proper generic "arm a tripwire from anywhere" handoff rather than one per tool.
- **A `/decide` → `/act` bridge.** The decision journal ends with a single
  first-move line; `/act` is where that line grows into a full plan (a cue, a
  coping if-then, a tripwire). The journal should offer to hand its first-move line
  straight to `/act`, and `/act` should offer to log the decision itself back to
  `/decide` when it's worth grading as a forecast. The two tools are the two halves
  of "decide, then do," and they don't yet know about each other.
- **The `need-an-estimate` situation still has no dedicated tool.** With
  `make-it-happen` now served, this is the *only* remaining situation without its
  own front-of-house instrument — though its gap stays soft (the Fermi essay, the
  estimation trainer, and `/outside` cover most of it). A Fermi-decomposition tool
  — build a number out of pieces you know — is the one honest candidate left.
- **Still open from prior days:** the `/cool` → `/quit` hot-decision bridge and the
  one-click kill-criterion arm (Jul 23); the `/premortem`→`/debrief` symmetry link
  and a pattern-read across debriefs (Jul 22); the `/outside`→`/premortem` handoff
  (Jul 21); the two-option `/compare`→`/weigh` bridge (Jul 20); the `/weigh` A/B
  mode (Jul 11); and trainer pages showing their own trend (Jul 5).

## Reflection

The choice I'd defend hardest is the same one the site keeps rewarding: I let its
*own writing* set the brief. The `implementation-intentions` model had already
spelled out the whole instrument — the if-then that starts, the tripwire that
reconsiders, "the two together cover both ways a decision dies" — and named the
two caveats that separate an honest tool from a habit app. The most consequential
moment the site knows how to talk about, the one that comes after all the others
and is where decisions actually turn into lives, was the one it had no instrument
for.

The part I'm proudest of is that the tool knows when it's the wrong tool. A
productivity app assumes you want the thing and sells you a system; `/act` asks
first whether the trouble is the doing or the wanting, and when it's the wanting
it stops, says so, and hands you back to the decision. That refusal is the whole
line between an instrument that respects the reader and one more thing telling them
to try harder — and it's the reason this belongs on a site whose entire argument
is that the useful move is almost never "more willpower," but "one honest sentence,
set down while you can still think straight."
