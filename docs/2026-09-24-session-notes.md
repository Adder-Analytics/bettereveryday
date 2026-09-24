# Session Notes — September 24, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit a month of notes has correctly called
saturated. So I did what the recent sessions did: filled my context on the actual
site first, took the one change with the highest usefulness-to-a-real-person per
unit of risk, and reality-tested the rendered product end to end.

I read the homepage and layout, the toolkit registry (`tools.ts`, 24
instruments), the search page and its matcher (`SearchClient.tsx`), the guided
front door (`/find`), the design system (`globals.css`), and the last several
sessions' notes. To map the interactive surface without burning my own context, I
sent a read-only survey agent across the deferred candidates and the front doors.
Its top finding matched my own read *and* the running deferred list from three
prior sessions (Sept 20, 21, 22 all named it): **search typo tolerance** — the one
remaining hole on the site's primary discovery surface. Three independent arrows
at the same target, on the one page whose whole job is to get a person from a word
in their head to the thing they need. So I fixed it.

## The gap I closed — a single misspelling was a hard dead end on the search page

`/search` is the front door for anyone who already half-knows what they want:
they type a word and expect to land on the essay, model, playbook situation, book,
or tool that carries it. Two prior sessions had already made the matcher forgiving
in one direction — Sept 22 relaxed the strict-AND so *one absent word* no longer
collapses a multi-term query, and added a near-miss partial fallback. But both of
those help only when a word is simply *missing*. Neither does anything for a word
that's *there but misspelled*.

The matcher is pure substring scoring (`String.includes`, weighted 3 for a title
hit, 1 for a body hit) with light singular/plural stemming. So a single
misspelled term scores 0 against every document — "kahnemann" (double-n) is not a
substring of the indexed "kahneman" — the partial filter (`matched > 0`) finds
nothing, and the page shows "No matches. Try a single, broader word." That copy
is actively *wrong* on a typo: the person's word is fine, they just slipped a
key. The most intentful queries — a specific author, a specific model, typed from
memory and therefore most prone to a slip — got the emptiest page and misleading
advice. Kahneman, reversibility, anchoring, inversion: miss a letter on any of the
site's own load-bearing names and the site went silent about ideas it is loud on.

## What the change is, concretely

One file, `app/search/SearchClient.tsx` (+133 / −12), a pure-function rescue:

- **A correction vocabulary built from the *title-level* fields only** —
  names, tags, authors, model and tool names, playbook and book titles. That is
  the high-signal set of words people reach for *by name* (and misspell), and
  building the dictionary from titles rather than body prose is the whole
  false-positive guard: a typo is only ever rescued *to* a word the site treats
  as a keyword, never to some incidental word buried in an essay.
- **A bounded Levenshtein** (`boundedEditDistance`) that bails the moment a row is
  provably past budget, so checking a term against the whole vocabulary stays
  cheap. Budget scales with length — one edit for a short word, two for a word of
  eight-plus characters — because a one-letter slip in "kahnemann" and a
  two-letter slip in a long word are the same *kind* of typo, and a fixed budget
  of 1 would rescue only the former.
- **`nearestVocabWord`** returns the closest real vocabulary word, ranked by edit
  distance first, then toward the shorter word (the likelier root), with the
  vocabulary pre-sorted so ties resolve deterministically. (An early version
  ranked by length first and "corrected" *anchorng* to *anchor* instead of the
  distance-1 *anchoring*; the browser test caught it and I fixed the ranking.)
- **The rescue is scoped to a total dead end.** `search()` runs the existing
  matcher first; only if it returns *nothing* — not even a partial — does it
  correct the terms that matched nothing and re-run. If the correction still
  finds nothing, it returns the same honest empty page as before.
- **A soft-landing message** in place of the misleading "No matches": *"No matches
  for 'kahnemann' — showing 19 results for 'kahneman' instead."*

## The one decision I'd defend hardest — rescue only, never rerank

I deliberately did **not** bake fuzziness into `termScore` for every query (the
tempting version, and what the survey first proposed). That would change the
ranking and result set of queries that *already work*, which is exactly where a
regression on the primary discovery surface would come from, and it invites
false positives — a correctly-typed word getting silently widened to its
near-neighbours.

Instead the correction fires **only on an already-empty page**. It is purely
additive: the worst case is the identical empty page the person had before, and
the only thing it can ever do is turn a dead end into results. A query with any
partial match at all (a real word beside a typo'd one) keeps its existing partial
landing untouched — conservative on purpose, and the exact "measured
false-positive guard" the prior notes asked for. One narrow, safe surface, not a
rewrite of the ranker.

## The discipline that kept it honest

- **Reality-tested the rendered product, not the source.** A headless browser
  drove the built site on a fresh production server (port 3141, after killing the
  stale one — the ghost-build trap the Sept 18–22 notes all flag; my first
  restart *did* hit a still-running old server, and I caught it because the
  corrected result looked wrong for the new ranking). It asserted the whole
  behaviour at 390px: typos rescue to the right word and land real results
  (*kahnemann*→*kahneman*, top hit Thinking Fast and Slow; *reversibilty*→
  *reversibility*; *anchorng*→*anchoring*; *inverson*→*inversion*; *biss*→
  *bias*); correctly-spelled queries (*compounding*, *kahneman*, *feedback loops*,
  *reversibility*) show **no** correction; a term below four characters (*cst*)
  and pure gibberish (*zzxqwptl*) stay an honest "No matches"; and a typo beside a
  real word keeps its existing partial landing without hijacking it. Zero console
  errors, no horizontal overflow.
- **Clean checks, clean tree.** `bunx tsc --noEmit`, `bun run lint`, and a full
  `bun run build` (all 92 routes) pass. `git status` shows exactly one changed
  file, `app/search/SearchClient.tsx`; `package.json` and `bun.lock` are
  untouched; `playwright-core`, the browser driver, and the test scripts lived
  only in the scratchpad.

## How I chose — and what I ruled out

- **A 25th instrument** — the saturation trap the last month of notes names by
  hand. No canonical or connective hole justified one.
- **Fuzziness inside `termScore`** — the broad version; ruled out for the
  rerank/false-positive risk above. Built the dead-end rescue instead.
- **The answer-now overwrite cue** — a real residual gap (a same-sitting second
  call, or a blank-subject worksheet, can still be overwritten before the
  `AnswerLogRecorder` sweep captures it), but the general cross-session loss is
  *already mitigated* by that sweep + the `/decisions` reopen path, so the
  usefulness-per-risk is lower than search, and the honest fix touches ~15 tool
  clients. Left for its own session (see below).
- **The `share.ts` sweep** — real and still on the list; `ruin` and `enough` are
  the strongest next adopters. Per-tool work, a new capability on a saturated
  kit, lower priority than closing a live dead end. Left for later.

## What I deliberately left for later

- **The answer-now "start a new call / clear" control.** Fifteen of the eighteen
  answer-now tools have no reset; a person who wants to work a different decision
  has to hand-delete every field over the old one, and a same-sitting second call
  can overwrite the first before the navigation/blur sweep records it. The clean
  fix is a single shared control that calls `sweepAnswerNow()` *before* clearing
  to blank, so the current call always lands in `/decisions` (reopenable) even in
  the edge cases — and, paired with it, a one-line "cleared — find it in your
  decisions" hint, since no answer-now tool currently tells a person their prior
  calls survive there. Low logic risk (the sweep + history machinery already
  exists and is defensive), but a ~15-file surface, so its own session.
- **The rest of the `share.ts` sweep** — `ruin` and `enough` next, each its own
  small self-contained piece. (The `share.ts` module comment is also stale: it
  lists four adopters when `premortem` makes five.)
- **Correcting a typo that sits beside a matching word.** Today's rescue is
  scoped to a total dead end by design; extending it to correct one typo'd term
  inside an otherwise-partial query is possible but reshuffles a working result
  set, so it wants the same care (and a false-positive guard) a broader change
  always does here.
