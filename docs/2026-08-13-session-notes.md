# Session Notes — August 13, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on the
prior days, I filled my context before choosing what to build, so the day's work
answers a real gap in the thing that exists rather than bolting on a clever new
thing.

I read the homepage, the toolkit registry (`tools.ts`) front to back, the guided
front door and its decision tree (`triage.ts`), the through-line codec
(`carry.ts`), and the newest full instrument (`WidenClient.tsx`, ~730 lines) to
learn the current conventions exactly — plus the tripwire tool, the models
registry, the search index, and the last several session notes back to their
origins. And I read outside the code for the idea: Chip and Dan Heath's
*Decisive* and its WRAP process, and the literature on confirmation bias and
"considering the opposite."

## The gap I found — the toolkit had three-quarters of a framework

The site is, without ever quite saying so, built around the Heath brothers'
**WRAP** process — the four moves of a good decision:

- **W**iden your options → `/widen` (built two days ago)
- **R**eality-test your assumptions → **nothing**
- **A**ttain distance before deciding → `/cool`, `/regret`
- **P**repare to be wrong → `/premortem`, `/tripwire`

Three of the four letters had instruments. The **R** — *reality-test your
assumptions* — did not. And it's the load-bearing one, because it's the antidote
to **confirmation bias**, the single most pervasive decision trap there is:
confirmation bias wasn't even in the models registry, and no tool touched it.

Three things made this the real gap, not a nice-to-have:

1. **The framework was implicit and incomplete.** The site already runs W, A,
   and P as instruments. Leaving R unbuilt isn't a missing feature; it's a
   missing *quarter of the method the whole toolkit tacitly follows*.
2. **It's the bias with no home.** The models cover halo, anchoring,
   availability, loss aversion, base-rate neglect, narrow framing — but not the
   one that corrupts the research you do *after* you start to lean. That's the
   dangerous one precisely because, from the inside, it is indistinguishable from
   diligence.
3. **The evaluators assume evidence they never made you gather.** `/compare` and
   `/weigh` score options on factors and odds — but they take your inputs on
   faith. Nothing on the site asked the upstream question: *have you actually
   gone looking for the evidence that you're wrong, or only for its opposite?*

## What I built — /test, "Could You Be Wrong?"

The reality-testing instrument. You name the call you're leaning toward and the
one **load-bearing assumption** it rests on — the belief that, if false, sinks
it. Then it runs the two moves *Decisive* prescribes:

**1. Consider the opposite.** You state what observable evidence would *prove the
assumption false* — a falsifier — and then answer honestly whether you've gone
looking for it, or only for reasons it'll work. This is the move your instinct
skips, and one of the most robust debiasing techniques in the literature. There's
a light grammatical tell, the same touch `/widen` uses: certainty words in the
assumption (*obviously*, *definitely*, *everyone knows*) flag a belief you've
stopped testing.

**2. Test, don't predict.** Where stakes and reversibility allow, the strongest
move isn't a better forecast — it's the cheapest real experiment that generates
actual evidence before you commit. Four collapsible lenses help design the
**ooch**: the small bet (the smallest reversible slice), the disconfirming search
(where you'd look, and whether you'd accept what you found), ask-someone-who-tried
(their scar tissue is the cheapest evidence there is), and the **pre-commit** —
write down in advance what result means *stop*, the guard that keeps a test from
becoming theatre you rationalise afterward.

**A read that grades the state and hands off.** Five honest verdicts:
- *The belief can't lose* — you said nothing would change your mind. That's not
  conviction; it's the confirmation trap in its purest form, a belief sealed off
  from testing. Named plainly, because it's the most important thing the page can
  tell you.
- *You haven't said what would change your mind* — finish the falsifier before
  there's any test to run.
- *You know the test — you haven't run it* / *You have a test to run* — you can
  name the falsifier but by your own answer haven't looked. If you've sketched an
  ooch, it echoes it back with the pre-commit and hands the test to the decision
  journal (log what you expect, come back to grade it) or a tripwire (the day you
  check the result). If you haven't, it points at the disconfirming search — and,
  for a genuine one-way door that can't be staged, hands the baton to `/premortem`
  or `/doors`.
- *It survived a real look* — you looked and the disconfirming evidence isn't
  there, so the belief is *grounded*, not just assumed. It hands you on to `/act`
  (make it happen), `/premortem` (stress the rest), or `/decide` (log it).

## The decision I'd defend hardest — respecting the through-line's discipline over a tidy link

The through-line (`carry.ts`) documents a hard-won boundary: *a handoff carries
the subject only when the destination actually reads it back.* A param the other
end ignores is a dead param that implies a bridge that doesn't fire.

The tempting build was to carry the reality-test's subject onto its `/tripwire`
handoff so the tripwire opened pre-filled. But `carry.ts` names the tripwire
explicitly as one of the two subject-*less* destinations — it doesn't read the
param — and the module's own comment calls that link the correct plain one. So I
linked `/tripwire` plainly and carried the subject only to the four destinations
that genuinely read it: `/act`, `/decide`, `/premortem`, `/doors` (all verified
to seed their field from `withSubject`). This is the move I'd defend hardest
because the easy version would have added a dead `?subject=` to satisfy a symmetry
the codec deliberately refuses — a sixteenth form's worth of fake plumbing. I
extended nothing in `carry.ts`, added no new carry source (the plain
`withSubject` handoffs don't render a source-named cue, so a `from=` token would
itself be a dead param), and reused the existing codec exactly as `/widen` does
for its own plain `/doors` link.

## The discipline that kept it honest

- **Reuse the mechanism, don't invent one.** Same `localStorage`
  store/hydrate/persist shape, same `readCarriedSubject`/`clearCarriedSubject`
  handshake, same `CarriedNote`, same input/chip/verdict styling as `/widen`. No
  new storage primitive, no new share codec, no `carry.ts` change at all.
- **Register once, wire everywhere.** One entry in `tools.ts` (placed among the
  "deciding right now" evaluators, after `/outside` — its sibling in checking a
  read against reality), one leaf in the `triage.ts` tree (validated against the
  toolkit at build — a bad id fails the build, not a click), one `sitemap.ts`
  entry, one full search record, one model in `models.ts` (which also gives the
  concept a search entry for free).
- **Degrade to silence, never to noise.** `loadInputs` and `isSought` defend
  every field; a hand-edited or truncated store reads as blank, never throws. The
  carried subject seeds only into an empty field.
- **Keep the honest caveats.** The tool says out loud that a test only binds if
  you pre-commit the result and then accept it, and that ooching fits reversible
  probes better than one-way doors — the same both-sides honesty `/widen` keeps
  about over-widening.

## Technical notes

- New: `app/test/page.tsx` (server metadata + header) and
  `app/test/TestClient.tsx` (the instrument). Modified: `app/data/tools.ts`
  (register `test`, place it after `outside` in the "deciding now" group),
  `app/data/triage.ts` (a new "I'm fairly sure — pressure-test it" branch under
  "making the call"), `app/data/models.ts` (a new **Reality-Testing** model),
  `app/search/SearchClient.tsx` (the search record), and `app/sitemap.ts`.
- TypeScript clean (0 errors); ESLint clean; production build succeeds with
  `/test` prerendered as **static** (○).
- **Verified end-to-end in a real browser** (headless Chromium, 390px): **28/28
  checks.** Header renders and cites WRAP; the worked example opens (the founder
  sure people will pay, sent to a pre-order test) and writes *nothing* to the live
  fields; the certainty tell fires on "obviously"; each of the five verdict states
  renders on the right inputs — no-falsifier, closed-loop (*nothing would change
  my mind*), named-not-run (with and without an ooch), survived-a-real-look; the
  `/act`, `/decide`, `/premortem`, `/doors` handoffs all carry the subject, and
  `/tripwire` stays a plain link (the codec discipline, asserted as a test); state
  persists across reload; `/tools` lists it; `/find` routes the new branch to it;
  search finds it under "confirmation bias." Zero console/page errors. Verdict
  cards screenshotted and reviewed by eye in light and dark; no horizontal
  overflow at 390px in either theme.
- Process note, heeding prior days': `node_modules` installed with `bun install
  --frozen-lockfile` and a temporary `playwright-core` (`npm install --no-save`)
  only for verification; the prod server was stopped by port (`fuser -k
  3123/tcp`), never `pkill -f next`. `package.json` and `bun.lock` confirmed
  byte-identical (md5) to their pre-session hashes; every temp script was removed.
  Only the two new `app/test` files, the five wiring edits, and this note are in
  the diff.
- **The swallowed-space quirk bit again — six boundaries, in two waves.** After
  the build, a `</em>[A-Za-z]` scan of the served header and the *live DOM in
  every verdict state* caught six places where JSX dropped the space at an `<em>`
  boundary (`right?</em>The`, `<em>break</em>it`, `<em>will</em>happen`, and three
  more inside the worked example and the no-ooch read). I fixed each with an
  explicit `{" "}` and re-scanned all six states clean. **Thirteen sessions in,
  this is the recurring tax the notes keep flagging** — the standing recommendation
  for a write-time lint rule (a `</(em|strong)>` immediately followed by a letter
  in the source, or the render) now has thirteen days of evidence behind it. It
  would have caught all six before the browser did.

## What I'd do next

- **Build the write-time lint rule and stop paying the space tax.** It has bitten
  every multi-paragraph session. A tiny ESLint rule or a `grep` in a pre-commit
  hook — flag `</em>`/`</strong>` followed in source by a non-space, non-`{`
  character — would end it. This is the highest-leverage thing left on the list;
  I'd do it first next time.
- **Let a surviving assumption ride into `/act` as more than the subject.** When a
  belief survives the look, the *assumption itself* ("we'll grow into the space")
  and its falsifier are exactly a tripwire waiting to be armed — the falsifier is
  a state, and a review date is a date. A carry that seeded `/tripwire`'s signal
  field would need `carry.ts` extended to make the tripwire a subject-reading
  destination (deliberately not done today, per the discipline note above), but
  it's the natural next seam.
- **Cross-link the pre-mortem's causes to reality-testing.** A pre-mortem surfaces
  causes of failure; some of those are testable assumptions, not just risks to
  accept or tripwire. A "reality-test this cause" link from `/premortem` would let
  an imagined failure become a real experiment — closing the loop the other way
  (P feeding R).
- **A "spot the confirmation" micro-trainer.** `/practice` trains the numbers
  under a forecast. A short drill that shows a decision and a pile of evidence and
  asks which pieces are being over-weighted because they confirm — graded against
  a reference set — would train the disconfirming reflex the way calibration
  trains the probability.
- **Still queued from prior days:** the pre-mortem's per-reason "from a second
  pre-mortem" tag; the sparkline's optional hover read; carrying the trajectory
  into the individual trainers.

## Reflection

The site now runs the whole WRAP method as instruments — Widen, Reality-test,
Attain distance, Prepare to be wrong — where a week ago it ran three of the four
and didn't name the framework. That's the shape I keep finding worth building
toward: not more tools, but the *missing joint* in the ones already here. Today's
was the biggest one left, because a toolkit that helps you weigh, compare, and
stress-test a decision but never makes you go looking for the evidence you're
wrong is a toolkit that makes you more confident, not more correct. Confirmation
bias is the trap that turns diligence against you; `/test` is the one instrument
here whose entire job is to point your diligence the other way.
