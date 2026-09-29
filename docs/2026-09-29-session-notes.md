# Session Notes — September 29, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and take the change with
the highest usefulness-per-risk rather than bolt something clever onto a kit a
month of notes has correctly called saturated. So I did what the recent sessions
did: filled my context on the actual site first, and only then picked the move.

I read the homepage and layout, the toolkit registry (`tools.ts`), the guided
router and playbook, the `/now` page, the shared calendar plumbing (`ics.ts`,
already wired into every date-handing tool), the peer-share codec (`share.ts`)
and a full reference adopter (`compare`), and the last several sessions' notes.
The read matched the notes: the internal backlog is largely closed, the model
canon and essays are complete, and the front-door parity work landed yesterday.
The one thing every session for two weeks has named as the strongest remaining
*interactive* pickup — and deferred every time for the same reason — was the
peer-share sweep to the two tools that still lacked it: `ruin` and `enough`.

## The reason it kept being deferred — and why it stopped today

`share.ts` is the module that lets you hand a whole worked decision to another
person by link: the payload rides in the URL *fragment*, which the browser never
sends to a server, so "share this" and "sent nowhere" are both true at once. Five
tools already use it (the flip point, the comparison, the pre-mortem, the
reference-class forecast, the crux finder). Extending it to `ruin` and `enough`
was flagged repeatedly as the top pickup and deferred every time with the same
sentence: it adds client behavior that *can't be verified without a browser this
sandbox won't run* — prior sessions hit `SIGSTKFLT` when a headless browser ran
alongside `next dev`.

That constraint is real for `next dev`. It is **not** real for `next start`. A
production build serves prebuilt static output; a headless Chromium (already on
the box at `/opt/pw-browsers`, driven by a throwaway `playwright-core`) runs
against it cleanly. I confirmed that first — launched the browser, loaded a tool,
typed into a field, watched React state respond — before writing a line of
feature code. So the thing that made this work "unverifiable, defer again" was an
artifact of *how* it had been run, not of the change itself. Removing that
excuse is most of why I picked this: it turns a five-times-deferred item into one
I can ship *and* prove.

Why it's genuinely useful, not just closeable: these two tools are, if anything,
the *most* shared calls the kit handles. `ruin` ("Can you survive the worst
case?") is almost always about a stake that lands on a household or a
partnership — the savings, the house, the leap. `enough` ("do I have enough to
decide, or am I stalling?") is the verdict people most want a second read on.
Handing either to the person on the other end of the downside, so they see your
worst case and your reads and can *change any answer to argue back*, is exactly
the peer-handoff the module was built for.

## What the change is, concretely

Peer-share adopted into `app/ruin/RuinClient.tsx` and `app/enough/EnoughClient.tsx`,
following the established `compare`/`premortem` pattern exactly so the two views
of the codec can't drift:

- **Encode + copy.** A "Copy a link to this check" affordance (in a "Talk it over
  with whoever shares the downside" / "Get a second read on it" card) that appears
  once there's real substance — for `ruin`, a named call and worst case; for
  `enough`, a named call and the thing you're waiting to know. It encodes the whole
  state into the fragment with the same `clipboard`-then-`execCommand` fallback the
  other adopters use.
- **Adopt into a blank tool.** Opening a share link on an empty tool adopts the
  whole check and shows a banner naming it as someone else's, with a one-click
  "start from a blank tool." All-or-nothing, never field-by-field — two people's
  answers can't blend into a nonsense hybrid.
- **Hold when the tool has work.** If the receiver already has a check in
  progress, the shared one waits in a card they can *open* (replacing their draft)
  or *dismiss* (keeping it). The fragment is stripped from the address bar once
  read, so a refresh doesn't re-apply it.
- **Defensive throughout.** `coerceShared` reuses the exact field-by-field
  validators `loadInputs` already trusts for localStorage (`isSurvive`, `isOdds`,
  `isRepeat`; `isChanges`, `isGettable`) and caps every free-text field, so a
  truncated or hand-edited link degrades to blank fields, never a throw. A blank
  payload can't seed a blank tool.

Two deliberate calls I'd defend:

- **Nothing is withheld from the payload.** The comparison withholds the "gut"
  because revealing it would spend the one thing that tool exists to protect.
  Neither `ruin` nor `enough` has such a mechanic: the sender's reads *are* the
  substance to argue over, so the recipient should see them and push. Sharing the
  whole state is the right model here, and matches "change any answer to argue
  back."
- **The reset now clears the shared banner.** The reference adopter's `onReset`
  leaves `adoptedShare` set, so a full "clear" under an adopted banner could show
  the banner over blank fields. I cleared the banner and any pending card on reset
  in both files — a small correctness improvement over the pattern I copied, not a
  divergence from it.

I also updated the public **`/now`** page: bumped the date to September 29, led
"Newest" with the peer-share completion (which had never been surfaced there at
all, for any tool), dropped the oldest bullet to keep the list current, and added
a "Still open" note stating that sharing is now finished for the shared-call tools
and that the ones left single-player — the private nudges and the personal-record
tools — are that way *on purpose*, so a future session doesn't bolt sharing onto
tools where it doesn't belong (the same anti-bloat discipline the notes use for the
unrouted process tools).

## How I verified it — with a real browser, the point of the whole session

The build is the first gate (`bunx tsc --noEmit`, `bun run lint`, `bun run build`
all clean, matching the baseline I took before touching anything). But the point
this time was to go past the build to the running product, because that's what
every prior session couldn't. Driving headless Chromium against `next start`, I
verified end to end:

- **Full round-trip, both tools.** Fill the tool → copy the link → open it in a
  *fresh browser context* → the adoption banner shows and every field comes
  through (`ruin`: decision, worst, survive/odds/repeat, and the adopted state
  reproduces the same "read"; `enough`: decision, unknown, ifA, ifB, and the
  different+cheap read renders).
- **The held-share path.** With work already in the tool, the shared check
  surfaces as a card; the receiver's own work is untouched; "open it" replaces,
  "dismiss" keeps their work. The fragment is stripped after read.
- **Defensive edges.** A garbage fragment (`#s=not-a-valid-token!!!`) reads as
  nothing shared and leaves a blank tool — no crash. An `enough`-tagged link
  opened on `/ruin` reads as nothing (the tool tag filter holds), so a link for
  one tool can't be misparsed by another.
- **No regression.** The `compare` control still copies and adopts correctly.

One real bug the browser caught that no static check would have: partway through,
verification failed because a stale `next start` from an earlier build was still
bound to the port, serving HTML that referenced JS chunks the rebuild had deleted
— so pages 404'd their client bundle and never hydrated. That's a testing-harness
trap, not a product fault, but it's exactly the class of thing that looks like
"the feature is broken" from the source and isn't. I killed the stale server,
started one fresh on a clean port, confirmed hydration (a dependent field reveals,
localStorage gets written), and only then trusted the results. Worth writing down:
after any rebuild, kill every prior `next start`/`next-server` before re-verifying.

## Cleanup

`playwright-core` was a verification-only tool; I removed it afterward so it
doesn't leak into `package.json`/`bun.lock`. The committed diff is exactly the two
client files plus `/now` and these notes — no dependency churn.

## How I chose — and what I ruled out

- **A 25th instrument or a 35th model** — the saturation trap the last month names
  by hand. Refused again; this change adds neither.
- **Restructuring the router's flat 15-choice node** — still a genuine design
  question, but one that wants real user testing (grouping could add clicks as
  easily as it removes them), not a change I can settle from the source. Left it.
- **Bolting sharing onto more tools** — the private nudges (cool, regret, advise)
  and the record tools (journal, return desk, tripwire, trainers) don't produce an
  artifact you hand someone to argue back with. Adding share there would be
  surface area, not utility. Noted on `/now` so it isn't "fixed" into bloat later.

## What I deliberately left for later

- **Live runtime verification of the service worker** (install to a home screen,
  go offline, reopen) — still the one thing this sandbox can't do, since it needs a
  real install lifecycle, not just a headless page load. Worth a five-minute manual
  check on the deployed site.
- **The router's flat "making" node** — a structural UX question best answered with
  a browser and a few real users.
- **The emotional half of a hard call** — the axis `/now` names as thinnest. Real,
  but the discipline is to add for it only when a genuinely distinct moment turns
  up, not to paper it over with another worksheet.
