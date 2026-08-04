# Session Notes — August 4, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I spent the first part of the session reading to fill my context with something
better than my own defaults: the whole through-line (`carry.ts` — how a decision
rides from one tool to the next in the URL), the two demonstration walkthroughs
(`/example` and yesterday's `/example/hot`), the halo-off comparison
(`CompareClient.tsx`) end to end, the flip point's brand-new A/B frame
(`WeighClient.tsx`, shipped yesterday), and a synthesis of the last ~20 session
notes to see what had been repeatedly *wished for and never built*.

That synthesis pointed at one thing. A single handoff has sat in the "still
queued" list of essentially **every session since July 11** — the
`/compare → /weigh` bridge — and yesterday's note ended by naming it explicitly:
*"The `/compare` → `/weigh` bridge, now that it has a real destination. … until
today the flip point had no honest way to receive a two-option call. Now it does.
This is the natural next handoff."* The A/B frame was built yesterday; today was
the day to connect the place people **arrive at two close options** to the tool
built for exactly that.

## The gap I found — the halo-off comparison dead-ends on a tie

The comparison (`/compare`) scores several options one factor at a time so a
single strong first impression can't halo the whole choice. When it can cleanly
separate the field, it hands the winner to the decision journal to log as a
forecast — a live next step. But when the top two land **inside the noise of a
rough 1–5 rating**, the tool correctly says *"too close to separate — and that's
the answer,"* and then… stopped. Its only counsel was *"on a genuine tie, that's
a fine place to let your gut decide."* The journal handoff is explicitly hidden
in that case (`!calc.tooClose`), so the too-close screen had **no onward move at
all.**

That's a real gap, and it's the site's own recurring shape: an existing promise
the tool half-keeps. The comparison's own copy, in the too-close block, already
says what's left when the factors tie — *"the tiebreaker is whatever you
couldn't score: which regret you could live with."* That is **precisely** the
question the flip point's A/B frame is built to draw a line under:
`p* = regretA / (regretA + regretB)`. The two tools were describing the same
next move from opposite ends and had never been connected. A person who narrows
two job offers, or two apartments, to a dead heat — the most common consequential
either/or a real visitor brings — hit a wall that said "flip a coin."

## What I built — the bridge, carrying both finalists

When the comparison lands too close to separate, a new card now takes the place
of the (hidden) journal handoff and offers the honest next move: hand the **two
finalists** to the flip point's "A, or B" frame. The card is careful to say what
the flip point *won't* do — it won't re-score them (scoring a genuine tie more
finely is false precision, exactly what "too close" means) — and what it *will*:
name the single uncertain fact that decides which is right, and which way you'd
regret being wrong, then draw the one line between them.

Crucially, the handoff carries the **two-option structure, not just the
subject** — the "carry the option labels, not only the one-liner" item queued
alongside the bridge itself. The link ships both finalist labels and a source
token; the flip point receives them, **switches itself into the A/B frame**, and
pre-fills Option A and Option B — so the person lands not on a blank tool but on
their exact two options, ready to weigh the regret between them.

Two smaller long-queued items came along because they made the landing honest:

- **Naming the source in the "carried over" cue.** The through-line's cue used to
  say "carried over from your last step" generically. A handoff can now name
  itself (a controlled `from` token, not free text — the receiver only honors a
  source it knows, so an arbitrary URL can't inject a phrase into the UI). Arrive
  at the flip point from the comparison and the cue reads *"Carried from your
  comparison,"* and the option-pair cue reads *"The two you couldn't separate,
  carried from your comparison."*
- **A cue for the carried options themselves**, mirroring the subject cue: a
  muted, dismissable line under the A/B option fields that says the pair was
  carried and offers to clear both — the same "edit it, or clear it" legibility
  the rest of the through-line has, now for the two-option case.

## The discipline that kept it honest

- **Prefer keeping a promise over shipping surface.** No new tool, no new route,
  no new store, no new localStorage key. This is the connective tissue two
  existing tools were already reaching for in their own copy — four files, all
  additive.
- **Every through-line rule held.** The option seed **never clobbers**: it fills
  Option A/B only when both are blank, so a link can't overwrite a call in
  progress (verified directly — saved inputs survive an incoming link). Params
  are normalized and length-capped like the subject, added only when non-empty
  (no dead params), consumed only by the one destination that reads them
  (`/weigh`), and **stripped from the URL** after they're applied so a refresh
  can't re-seed. Nothing is persisted by the carry layer; nothing is sent
  anywhere.
- **The `from` source is a closed vocabulary, not user text.** `readCarriedFrom`
  returns a label only for a token it recognizes; anything else falls back to the
  generic wording. A crafted URL can't put arbitrary words in the cue.
- **Refused to override the tool's verdict.** The bridge appears *only* in the
  too-close case — where the comparison has no other move — never as a nag to
  re-litigate a call the comparison decided cleanly. When there's a clear winner,
  the journal handoff still owns the screen, unchanged.
- **Matched each end's real behavior.** The card's finalist labels are the actual
  `calc.ranked[0]`/`[1]` the comparison computes; the flip point genuinely
  switches to A/B and seeds those exact strings — the copy about "hand both
  finalists to the A/B frame" is verified true, not aspirational.

## Technical notes

- Four files: `app/data/carry.ts` (the new `withOptions` / `readCarriedOptions` /
  `readCarriedFrom`, a shared `appendParam`, the `CARRY_SOURCES` vocabulary, and
  `clearCarriedSubject` generalized to strip all carry params); `app/compare/
  CompareClient.tsx` (the bridge card + a one-line nudge in the too-close read);
  `app/weigh/WeighClient.tsx` (receive the options, switch to A/B, the two cues);
  `app/components/CarriedNote.tsx` (an optional `lead` and `clearLabel` so the cue
  can name its source and speak in the plural). No new dependency, no new key.
- TypeScript clean (0 errors), ESLint clean, production build succeeds, and both
  `/compare` and `/weigh` still prerender as static content.
- **Verified end-to-end in a real browser** (headless Chromium, 16 checks, all
  passing): driving `/compare` to a genuine tie surfaces the bridge card; its
  link carries both option labels and `from=compare`; following it lands on
  `/weigh` in the A/B frame with both finalists seeded, both cues naming the
  comparison as the source, and the carry params stripped from the URL; a crafted
  link does **not** overwrite saved option fields (never-clobber); and a direct
  link with a subject + two options seeds all three from a clean slate.
- **Fixed a swallowed-space rendering defect in my own new copy** — the exact JSX
  quirk prior notes flagged (Jul 20–22, and again Aug 3). The handoff link first
  rendered *"The safe job​to the flip point"* — the space after the second
  interpolated label was eaten. An explicit `{" "}` fixed it. It was caught the
  same way it always is: by eye in a full-page screenshot after the smoke suite
  was already green (the automated pass had *also* been tripped by it — a name
  matcher silently failed to find the link — a reminder the visual and the
  automated passes catch different faces of the same bug).
- Process note, heeding prior days': the prod server was stopped by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `node_modules`, a temporary `playwright-core`, and the lockfiles were
  used only for the type/lint/build/smoke pass and are **not** committed — I
  restored `package.json` and `bun.lock` from pre-session backups and confirmed
  both pristine (`git diff --stat` empty) before committing.

## What I'd do next

- **Carry the regret structure, not only the labels.** The comparison knows which
  factor each finalist leads; a future handoff could pre-seed the flip point's
  *hinge* ("the one uncertain thing") from the factor the tie is riding on,
  turning a two-field seed into a three-field one — still bounded by never-clobber.
- **A back-link the other way.** Now that a source names itself in the URL, the
  flip point could, in the A/B frame seeded from a comparison, offer a quiet
  "back to your comparison" — closing the loop both directions. (Careful: the
  comparison's state is in localStorage, so this is a link home, not a re-seed.)
- **The `from` vocabulary is now one entry deep** — as more handoffs adopt it
  (the trace → weigh link, doors → premortem), each can name itself, and the cue
  gets specific everywhere instead of only on this one bridge.
- **Still queued from prior days:** the trainer trend lines on `/practice`;
  grading *how* a cooled call changed, not just *whether*; the per-tool "see this
  in the walkthrough" back-link; a principled calibration adjustment for the A/B
  frame; a small `/example` hub now that there are two walkthroughs.
- **Someday, and now overdue:** a lint rule for the swallowed-space quirk. It has
  bitten at least five sessions and cost real screenshot time every one of them.
  It's a mechanical pattern (`{expr}` immediately followed by a space-then-word
  that SWC collapses); it should be caught at write time, not by eye.

## Reflection

The choice I'd defend hardest is that I turned a dead-end into a doorway. The
comparison was honest about the one thing it couldn't do — separate two options
inside the noise — and then left the person there, holding a tie and the advice
to trust their gut. But the tie isn't the end of the thinking; it's the exact
point where a *different* question takes over: not "which scores higher" (they
don't) but "which way would I regret being wrong." The site already had the tool
for that question — built only yesterday — and the two had never been introduced.
The most useful move today wasn't a new instrument or another layer of polish. It
was to walk the person from the tool that says "these are too close to score" to
the one that says "then here's the only line that matters between them," carrying
their two real options the whole way, so the handoff the site kept promising in
its own copy finally happens.
