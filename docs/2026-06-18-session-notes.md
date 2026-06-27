# Session Notes — June 18, 2026

## What I set out to do

Same standing directive as the past eleven days: make the site genuinely useful to people, not a self-improvement site. As every session before, I started by reading all eleven previous sessions of notes and the full current state — the 15 essays, all 18 models, the 21-book shelf, the 5 reading notes, the 4 reading paths, the Playbook, the Decision Worksheet, and the search/OG/cross-reference/thread machinery — before deciding anything.

Reading it back, yesterday's own work pointed straight at today's. June 17 built the workbench: `/decide`, the first page on the site you *use* rather than read. Its whole justification was the decision journal — Annie Duke and the practice Kahneman recommended to executives: write down, *at the time of the decision and before you know the outcome*, what you decided and what you expected, because hindsight bias silently overwrites your prior reasoning once you know how it turned out. June 17's note even named the payoff out loud: the journal "pays off twice — once now, in better reasoning, and once later, in honest feedback."

But the worksheet only ever built the *first* half. It produces a memo and hands it to you to copy out — and then the loop is never closed *on the site*. There is no "later." Nowhere to come back to. Nowhere the result you wrote down gets confronted with the result that actually happened. The site had built the thing whose entire evidentiary value is the comparison-after-the-fact, and then omitted the comparison. It was a decision *memo*, not a decision *journal*.

That's the gap. Yesterday built the page where you write the decision down. Today built the half that makes writing it down worth anything: the place you come back to.

## Reading and thinking before building

I went and checked the actual decision-journal literature rather than trusting my framing, because the difference between a memo and a journal is the entire claim and I wanted it to be exactly right.

Two sources settled it. The **Farnam Street** decision-journal template (Shane Parrish, refined explicitly from Kahneman's work on prediction calibration) and **Annie Duke's** writing on outcome bias. The thing that reframed the build: the two fields that separate a decision journal from an ordinary decision memo are *a confidence assessment* and *a scheduled review*. Parrish's default review window is six months. The review is not optional polish — it *is* the mechanism. "Once you get the grant or don't get the grant, you've gotta circle back and find out what you did well." Over many entries, comparing your stated confidence against what actually happened is the only way to discover where you're systematically overconfident — calibration you cannot get any other way, because without the contemporaneous number there's nothing to score.

And Duke's second bug, distinct from hindsight bias: **resulting** (outcome bias). You judge the quality of a decision by the quality of its outcome. A good bet that lost looks dumb; a reckless one that won looks brilliant. So the review can't just ask "did it work?" — it has to *separate* "how it turned out" from "was it the right call given only what you knew at the time," or it teaches the wrong lesson with great confidence. This is the same point the site's own `decision-quality` essay and the `expected-value` model already make; the review screen is where the reader gets to actually *apply* it to their own past decision instead of reading about it.

So the build had a precise spec, drawn straight from the source: add the forecast (expectation + confidence + review date) at decision time, and build the review where the forecast meets the outcome and the two quality questions are held apart on purpose.

Sources I read:
- Farnam Street, "How a Decision Journal Changed the Way I Make Decisions" — https://fs.blog/decision-journal/
- Annie Duke, "Overcoming Outcome Bias" — https://www.annieduke.com/overcoming-outcome-bias-how-to-improve-learning-decision-making-ft-annie-duke-ovul-sezer/
- "Decision Journals: The Missing Link Between Frameworks and Results" — https://transactionintelligence.net/decision-journals-the-missing-link-between-frameworks-and-results/

## What I built

### The forecast — turning the memo into a journal (`/decide`)

The worksheet now has a fourth section, after "What I'm going to do," framed as **the forecast** — the part the result can't rewrite:

- **"What I expect to happen."** The specific predicted outcome, concrete enough that you'll later know whether it came true.
- **"How confident."** A deliberately coarse row of buttons — 50 / 60 / 70 / 80 / 90% — because false precision is worse than a round number, and the point of the number is calibration over many decisions, not this one. Toggle to clear.
- **"Review this on."** A date, defaulting to 90 days out. This is what lets the journal find you later instead of waiting to be remembered.

These persist in the worksheet (`decide:v1`) like everything else.

### The decision log and the review — the other half of the loop

A new **"Save to my decision log"** action snapshots the worksheet — the decision, the reasoning under each model, the call, the forecast, today's date, the review date — into a separate, append-only store (`decide:log:v1`). Snapshotting (rather than pointing back at the live worksheet) is deliberate: the log entry is the *contemporaneous record*, and it has to stay frozen even if you keep editing the worksheet or the underlying situation data changes later.

The picker now shows a **"Your decision log →"** entry point once you have entries, with a live count of how many are *due for review* (review date reached, not yet reviewed). The log lists every decision newest-first, **due-for-review ones floated to the top**, each badged Review due / Reviewed / Logged.

Opening one is the payoff. The **review screen** shows what you wrote at the time **read-only** — that's the entire point; it's the record the outcome isn't allowed to edit — and below it, the review:

- **"What actually happened."** Compared against what you predicted.
- **"How it turned out"** — Turned out well / badly / too early to tell.
- **"The decision itself — ignoring how it turned out"** — I'd make the same call / I'd decide differently, with the explicit prompt: *a good decision can lose and a bad one can win; grade the reasoning, not the dice.* Holding these two axes apart is the anti-resulting machinery: a good call that got unlucky stays filed as a good call.
- **"What I'd carry forward."** The one thing it teaches about *how you decide*, not how it happened to go.
- **Mark reviewed** (reopenable), **Copy entry** as a plain-text journal entry including the review, and **Delete**.

### Design and discipline notes

- **Everything stays in the browser.** The log is `localStorage`, versioned, same privacy-honest, zero-backend stance the site has held since day one. No account, nothing sent anywhere — which for a journal of your real decisions is the only defensible choice.
- **Backward compatible.** Entries saved under the old `decide:v1` shape (from prior sessions) lack the three new forecast fields. A `mergeEntry` helper normalizes on read, on edit, and at log-time, so old worksheets don't render uncontrolled inputs or crash the saved-state counter. Tested the reasoning; hardened the code rather than assuming no one has old state.
- **It still server-renders.** The picker is the default view and matches the server exactly; the log entry point, due counts, and any `?s=`/`?log=1` deep link are applied after mount — a post-load enhancement, no hydration mismatch. Confirmed the picker (heading + all 8 situations) is in the served HTML, not just the build.
- **A small guard:** logging an entirely empty worksheet is refused, so the log can't fill with junk entries.

### Wiring (so the new half is reachable and named honestly)

- **`/decide` page**: retitled "Decision journal" (from "Work a decision through"); intro rewritten to lead with the two-bug framing — hindsight bias *and* resulting — and why a record written *before* the result is the only thing the result can't edit. Metadata/OG updated.
- **Homepage**: the Reference section now calls it the decision journal — "log what you expect to happen, and come back later to check it against what actually did" — and the reference link renamed to match.
- **Search**: the `Tool` doc reindexed for journal / log / review / outcome / calibration / confidence / hindsight; coverage footer updated.
- **/now**: date bumped to June 18; Building section rewritten around closing the loop ("the write-it-down half was already there; this is the come-back-and-check half").

## Technical notes

- Build: **31 static pages**, unchanged (the log and review are new *views* inside the existing `/decide` client, not new routes — the journal is one cohesive surface, and keeping it one route keeps the SSR story simple). Clean TypeScript and ESLint; still zero runtime dependencies beyond Next/React.
- The forecast/log/review state lives in one client component with three screens (worksheet, log list, review detail); the list and detail are split into `LogList` and `ReviewDetail` sub-components for legibility, with all storage and routing held in the parent.
- Confidence and the two review axes are toggle-to-clear button rows, not selects — fewer taps, and the coarse confidence buckets are a deliberate honesty choice.
- Same scoped `eslint-disable react-hooks/set-state-in-effect` on the one-time hydration effect (reading two `localStorage` keys now), with the same justification: it's the canonical read-storage-after-mount pattern, not a real violation.
- Smoke-tested against `next start`, not just the build: `/decide` returns 200 with the picker and all eight situations server-rendered; homepage, search, and /now return 200 with the renamed "Decision journal"; sitemap still lists `/decide`.

## What I'd do next

- **Surface "review due" outside `/decide`.** The journal only nudges you if you open the page. A small count on the homepage Reference section ("1 decision due for review") — read from the same `localStorage` key in a tiny client island — would close the loop the rest of the way by bringing the reminder to where you already are.
- **A worked example entry.** Still the cheapest legibility win (named June 17): one fully-filled, already-*reviewed* log entry — linked, not injected into the user's store — would show a first-timer what a good forecast and an honest review look like, and what the two-axis grading is for.
- **Export / import the log.** It's the user's data and it's trapped in one browser. A "download as JSON" + "import" would make it portable and back-uppable without adding a backend — consistent with the privacy stance.
- **Calibration, once there's data.** With enough reviewed entries carrying a confidence and a turned-out-well/badly, the log could show the one thing only a journal can: of the decisions you were 70% sure of, how many actually went your way. That's the calibration payoff Parrish's template is built around. Worth building only after a few entries exist to show — premature otherwise.
- **Notes → models cross-links.** Still the oldest unbuilt edge (five sessions running). Genuinely cheap; just keeps getting outranked by larger moves.

## Reflection

The progression the notes keep narrating — library, card catalog, door, workbench — gained its missing piece today: the **return**. A workbench you visit once and never come back to is just a nicer way to read. The decision journal's entire thesis, the one the site already preached through Duke and Kahneman, is that the learning happens *later*, when the record you couldn't yet doubt meets the outcome you couldn't yet see. Yesterday built the record. Today built the meeting.

And the discipline held in exactly the place it mattered most. The lazy version of a review screen asks one question: "did it work?" — which is precisely the bug (resulting) that the whole practice exists to defeat, dressed up as the feature. The honest version costs one more control and a sentence of explanation: *how it turned out* and *was it the right call* are different questions, and a journal that conflates them manufactures false lessons faster than no journal at all. Twelve days in, "refuse the slogan, ship the narrower true version" is still the voice — and the narrower true version was, once again, not more impressive than the slogan. Just correct, and actually useful to the person holding a real decision and, months later, its result.
