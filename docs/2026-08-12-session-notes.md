# Session Notes — August 12, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of the recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I filled my context first. I read the homepage, the toolkit registry
(`tools.ts`), the guided front door and its decision tree (`triage.ts`), the
through-line codec (`carry.ts`) front to back, and — because the gap turned out
to live at their seams — the two option-*evaluating* tools cold: the halo-off
comparison (`CompareClient.tsx`, ~1400 lines) and the flip point
(`WeighClient.tsx`, ~1600 lines), plus the newest instrument (`RegretClient.tsx`)
to learn the current conventions exactly. I read the last several session notes
back to their origins. And I read outside the code for the idea itself: Chip and
Dan Heath's *Decisive* on narrow framing, Paul Nutt's decision-tracking research,
and — the tell that this was the right build — the site's own essay on the topic.

## The gap I found — the toolkit weighs options it never helped you find

The kit has fifteen instruments. Every one of them *evaluates* a decision you
already hold: it sorts a call by reversibility, finds the flip point between two
options, scores several past the halo, plays a pull forward to three horizons,
strips the sunk cost, traces the second-order bill. But not one of them helps you
**generate the options in the first place** — and that is where decision research
says most decisions actually go wrong.

Chip and Dan Heath name it the first villain of decision-making: **narrow
framing** — treating a choice as "whether or not to do X" when the real choice is
"X, or Y, or Z, or some combination nobody wrote down." Paul Nutt's research is
the receipt: decisions that weighed only one option failed far more often than
ones that weighed even two. It is the single most common and most damaging
decision mistake, and it happens *before* any of the kit's instruments get a
turn.

Three things made this the load-bearing gap, not a nice-to-have:

1. **The site already argued for it and then didn't build it.** There's a strong
   essay — "The First Mistake Is the Question" — whose own closing line promises
   "the worksheet on this site opens every general decision with exactly this
   move." No worksheet did. `/decide` doesn't run the vanishing test; nothing
   did. The site made a promise it hadn't kept.
2. **The evaluators had no upstream feeder.** `/compare` assumes you arrive with
   several options; `/weigh` assumes you arrive with two. Where do they come
   from? Nowhere on the site. `/compare`'s own copy even warns "if you've framed
   this as *whether or not*, that's a warning" — naming the disease with no
   instrument to treat it.
3. **The guided front door had a hole.** The triage's "making a call" node
   branches on "several options" (→ compare) and "two options and I keep
   re-arguing the odds" (→ weigh) — but had **no branch for the one-option,
   yes-or-no frame**, which is the most common shape a hard call actually takes.

## What I built — /widen, "What Else Could You Do?"

The instrument at the front of the funnel — the one that acts *before* the
others. You name the decision and the single option you're weighing. It catches
the grammatical tell (*whether*, *or not*, a bare *should I* — a decision with
exactly two sides is usually a wide-open situation in a yes/no mask), then does
the one move that's most of the value: **refuse to decide between one thing and
nothing.**

**Four generators, as collapsible lenses.** The vanishing-options test as the
headline (*suppose your option were gone — what would you do instead?*, the
question people who "have no choice" can always answer, which proves the others
were there all along); opportunity cost (*"or not" is never nothing — it's what
you'd do with the same time and money*); and-not-or (a smaller, both-at-once,
try-it-first version that beats the all-or-nothing leap); and someone-already-
solved-it (another person's path is a cheaper teacher than your own regret). You
type the alternatives into a list; the option on the table is pinned above it.

**A decoy guard.** The known failure mode of widening is *sham* options — a
strawman planted to make the choice you already wanted look obvious by standing
next to something no one would pick. Each added option gets a real/decoy toggle;
decoys are set aside and don't count. If every alternative is a decoy, the tool
says so plainly: strip them and you're back in the frame you started in.

**A count-based read that hands off.** One real option → you're still in a
"whether or not," the frame most likely to fail (or, rarely, a genuine single
path — which earns a *different* test: is it reversible, what breaks it, where's
the bill — handed to `/doors`, `/premortem`, `/trace`). Two → a real two-way
call, both options carried to the flip point. Three or more → a real slate, the
whole set carried to the halo-off comparison, pre-filled. And it keeps the essay's
honest other half: past a handful, more options mostly produce stall, not better
calls — the failure to beat is the frame with *one* option in it.

## The decision I'd defend hardest — making the handoff *land*, not just link

The through-line (`carry.ts`) exists to kill exactly one thing: a tool that says
"now take it to X" and drops the decision on the threshold, so you land on a
blank field and retype what you typed a screen ago. A widener whose verdict said
"go compare these" and then handed `/compare` an empty form would have violated
the module's entire reason for being.

So I extended the codec rather than linking plainly. There was already a
two-label carry (`withOptions`, the comparison's two finalists → the flip point's
A/B frame). I added the missing shape: a **whole-slate carry** (`withOptionList`
/ `readCarriedOptionList`) so three-or-more real options ride to `/compare`
pre-filled, and taught `/compare` to seed them — into blank option slots only,
the same never-clobber rule the subject seed already follows, so an incoming link
can never overwrite a comparison in progress. The two-option case reuses the
existing `withOptions` untouched. Both handoffs name their source
(`from: "widen"`), so the receiver's "carried over" cue reads "carried from
widening your options" instead of the generic "your last step" — I verified both
the comparison and the flip point pick this up.

This is the move I'd defend hardest because it's the difference between a fifteenth
form and a sixteenth *instrument*. The kit's two evaluators had a dead upstream
end; now the tool that generates options feeds the tools that weigh them, and a
real decision — one option → widened to a slate → scored — is typed once and
walks the whole way.

## The discipline that kept it honest

- **Reuse the mechanism, don't invent one.** No new storage primitive (the same
  `localStorage` store/hydrate/persist shape), no new share codec. The
  option-list carry is a sibling of the existing two-label carry, joined on a
  control character no one types (U+001F) so a label can't collide with the
  delimiter, capped in count and length so a link stays a link, read only by the
  one destination that consumes it (`/compare`) — the exact no-dead-param rule
  `carry.ts` already documents.
- **Register once, wire everywhere.** One entry in `tools.ts` (so the `/tools`
  index, homepage, and search draw the name from one source and can't drift), one
  leaf in the `triage.ts` tree (validated against the toolkit at build — a bad id
  fails the build, not a click), one `sitemap.ts` entry, one full search record.
- **Degrade to silence, never to noise.** `loadInputs` and `cleanAdded` defend
  every field; a hand-edited or truncated store reads as blank, never throws. The
  carried subject and the carried slate each seed only into empty fields.
- **Keep the honest caveat.** The tool warns about over-widening (choice
  overload, widening-as-avoidance) exactly as the essay does, so it can't be read
  as "more options are always better."

## Technical notes

- New: `app/widen/page.tsx` (server metadata + header) and
  `app/widen/WidenClient.tsx` (the instrument). Modified: `app/data/carry.ts`
  (the `widen` carry source; the whole-slate `withOptionList`/
  `readCarriedOptionList`; `OPTIONS_PARAM` added to the URL-clear list),
  `app/data/tools.ts` (register the tool, place it first among the evaluators in
  the "deciding right now" group), `app/data/triage.ts` (the "whether or not"
  branch in `/find`), `app/compare/CompareClient.tsx` (read and seed the carried
  slate; source-aware carried-over cue; a cross-link from its own narrow-frame
  warning to `/widen`), `app/search/SearchClient.tsx` (the search record), and
  `app/sitemap.ts`.
- TypeScript clean (0 errors); ESLint clean; production build succeeds with
  `/widen` prerendered as **static** (○).
- **Verified end-to-end in a real browser** (headless Chromium, 390px): **21/21
  checks.** Header renders; the worked example opens (the site's own "should I
  quit?" frame breaking into four options, the strawman caught) and writes
  *nothing* to the live fields; the narrow-frame tell fires on "whether"; the
  frame-check card appears; a one-option state reads "still one option and its
  shadow"; one added real option → a two-way verdict whose flip-point link
  carries `a`, `b`, `from=widen`, and the subject; a second → a three-slate
  verdict whose comparison link carries `opts` + `from=widen`; marking one a
  decoy drops the count back to two-way; state persists across reload; following
  the comparison link seeds all three option labels and the subject into
  `/compare`, shows the "carried from widening your options" cue, and strips the
  carry params from the URL; `/tools` lists it; `/find` routes the new branch to
  it. Zero console/page errors. Verdict cards screenshotted and reviewed by eye
  in light and dark; no horizontal overflow at 390px in either theme.
- Process note, heeding prior days': `node_modules` installed with `bun install
  --frozen-lockfile` and a temporary `playwright-core` (`npm install --no-save`)
  only for verification; the prod server was stopped by port (`fuser -k
  3123/tcp`), never `pkill -f next`. `package.json` and `bun.lock` confirmed
  byte-identical (md5) to their pre-session hashes; the five temp scripts were
  removed. Only the two new `app/widen` files, the six wiring edits, and this
  note are in the diff.
- **The swallowed-space quirk bit, and screenshotting caught it — twice over.**
  Three boundaries lost their space in the built output: `<em>Decisive</em> they`
  and `acts <em>before</em> the` in the server-rendered header, and — client-side
  this time — `<em>"…or not."</em> But` in the frame-check card that only renders
  after you name an option. I caught the header pair by eye in the screenshot,
  confirmed all three against the served/rendered HTML (a `</em>[A-Za-z]` scan of
  both the static page and the live DOM in every verdict state), and fixed each
  with an explicit `{" "}`. A follow-up scan for missing-space concatenations
  across all four verdict states and the example came back clean. Twelve sessions
  in, the standing recommendation for a write-time lint rule stands — it has now
  been dodged by hand, again.

## What I'd do next

- **Carry the slate onward from the comparison, too.** `/widen` now feeds
  `/compare`, but if the comparison narrows its own slate to two finalists it
  can't separate, it already hands *those two* to the flip point. A slate that
  gets *pruned* in the widener (you demote one to a decoy after the fact) could
  re-hand the smaller set without a round trip. Minor, but it closes the last
  seam.
- **Let a chosen option ride into `/act`.** When the comparison or the flip point
  resolves the slate `/widen` generated, the winning *option label* — not just
  the subject line — could seed `/act`'s first-move field. The through-line
  carries the decision; it doesn't yet carry the answer.
- **A "vanishing test" micro-trainer.** The generators are lenses you apply to
  your own call; the practice room trains the numbers under a forecast. A short
  drill that shows a narrow frame and asks you to widen it — graded against a
  reference set — would train the move itself, the way the calibration trainer
  trains the probability.
- **Still queued from prior days:** the pre-mortem's per-reason "from a second
  pre-mortem" tag; the sparkline's optional hover read; carrying the horizon
  trajectory into the individual trainers; and — now twelve sessions deep — a
  write-time lint rule for the swallowed-space quirk.

## Reflection

The choice I'd defend hardest is the same shape the last several sessions
defended: I let *what the technique actually is* decide what to build. It would
have been easy to read "the site already covers narrow framing" — there's an
essay, and `/compare` name-drops it — and move on. But an essay is an argument,
not an instrument, and a name-drop with no tool behind it is a promise the site
breaks every time someone reads it. The kit had fifteen ways to weigh a decision
and no way to make sure you were weighing the *right* decision — the one with more
than a single option in it. That's not a small omission; by the research it's the
omission that undoes the most careful weighing that follows, because all the
diligence in the world spent inside a one-option frame only makes you surer of a
choice you never opened up. So the build wasn't another evaluator. It was the
thing that has to come first — and, just as much, the wiring that makes it hand
its widened frame *forward* to the evaluators that were always waiting downstream
for options nobody had built them a way to generate.
