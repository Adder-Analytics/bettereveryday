# Session Notes — September 25, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit a month of notes has correctly called
saturated. So I did what the recent sessions did: filled my context on the actual
site first, took the change with the highest usefulness-to-a-real-person per unit
of risk, and reality-tested the rendered product end to end.

I read the homepage and layout, the toolkit registry (`tools.ts`, 24
instruments), the connective tissue (`carry.ts`, `share.ts`, `answerLog.ts`,
`portable.ts`), a representative answer-now tool in full (`weigh`), the answer-log
recorder, and the last several sessions' notes. I also sent a read-only survey
agent across the interactive surface, briefed to rank candidate gaps by
usefulness-per-risk. Its top finding matched my own read *and* the running
deferred list four prior sessions kept naming: **the answer-now family has no way
to start a second decision.** So I closed it — for the whole family, not one
tool — and folded in a two-line handoff fix the survey turned up beside it.

## The gap I closed — 15 of 18 quick tools stranded you after one call

The site's whole promise, in its own home-page words, is that it "keeps the
record for you." The *answer-now* family — the flip point, the door sort, the
survival check, the halo-off comparison, and fifteen more — each keeps a single
worksheet slot: the last call you worked, overwritten next time. Three of the
eighteen (act, quit, debrief) had grown a bespoke "Clear this" button. The other
**fifteen had none at all.** To work a second decision in any of them you had to
hand-delete every field, one at a time, over the old call. For a toolkit built to
be *used*, on a real decision, and then *used again* on the next one, that was the
plainest friction on the site — and the one place the "worksheet, not a lecture"
promise quietly stopped short.

Worse, the obvious fix is a trap. The answer-now history (`answerLog.ts`) only
captures a call when the global recorder *sweeps* the slots — and it sweeps on
navigation, tab-hide, or unload, never on an in-place reset. A naive
`setInp(BLANK)` blanks the slot with no navigation, so a call you *just finished*
could be overwritten before it was ever swept into the record: gone, not
archived. The three tools that already had a reset (act, quit, debrief) carried
exactly this latent data-loss bug.

## What the change is, concretely

A single shared component, `app/components/ClearCallButton.tsx` (new, ~130 lines
with its reasoning), wired into all eighteen answer-now tools:

- **It sweeps before it clears.** On click it calls `sweepAnswerNow()` — folding
  the current worksheet into the shared history — *and only then* runs the tool's
  own reset. The finished call lands on `/decisions`, reopenable, instead of being
  lost. That is the site's own "keep the record, hand it back" promise, finally
  kept for the quick tools on a *reset* too, not only when you happen to navigate
  away. This also fixes the pre-existing bug in act/quit/debrief.
- **It tells you the truth about where the call went.** It asks `portable.ts`'s
  own `subject` extractor whether the slot held a recordable call, so the
  confirmation is honest: "Cleared — a fresh worksheet is ready. Your last call is
  kept in *your decisions*, where you can reopen it." — with a link — when there
  was a real call to keep, and a plain "Cleared" when there wasn't. It never
  claims to have saved something it didn't.
- **It touches no tool's logic.** The worksheet lives in each tool's own React
  state, so the tool passes in its reset (`() => setInp(BLANK)`); the component
  renders one button and calls back. Every instrument's fields, compute, verdict,
  and handoffs are byte-for-byte what they were — the diff per tool is an import
  and one line. This is the same "close the gap without reaching into a tool"
  discipline `answerLog.ts` itself was built on.
- **It's in-idiom.** Same muted "Clear this" text button the three existing tools
  used, same placement (the quiet end of the worksheet), plus `data-print-hide` so
  a reset control never prints on a decision record — a small correctness win the
  old three lacked.

The per-tool edits: fourteen tools take `onReset={() => setInp(BLANK)}`; the
comparison uses `setState`, so it takes `() => setState(BLANK)`; the debrief keeps
its own "Clear this debrief" label and its print button, with the shared control
beside it. act and quit drop their bespoke button entirely for the shared one.

## The second fix — two flip-point off-ramps dropped the decision

The survey caught two genuine escapes from the through-line (`carry.ts`), the
exact "fourteen forms in a trench coat" bug that module exists to kill. When the
flip point hits a **ruin** guard it says "take it to the survival check"; when a
call is **too close to call** it says "check whether it's worth going to get
[more information]" → `/enough`. Both destinations *read* a carried subject, but
both links were plain — so the person landed on a blank field and retyped the
decision they'd just worked. These are the two highest-stakes handoffs on the
page (survival, value-of-information), and they were the two that dropped the
ball.

The catch the survey missed: both links live in *sub-components* (`RuinWarning`,
`TooCloseRead`) that had no access to the decision, so this wasn't the promised
one-liner — I threaded the subject through as a prop to each and wrapped both
hrefs in `withSubject`. Now both off-ramps land pre-filled. (`WeighClient.tsx`,
+19/−8 across the two fixes and the clear control.)

## The one decision I'd defend hardest — one shared control, sweep-first, for all eighteen

Two choices carried the change:

- **Sweep before blank, always.** The convenience of a reset button is nothing;
  the *safety* of it is everything. A reset that can silently eat the call you
  just made is worse than no reset — it turns "keeps the record for you" into a
  lie at the exact moment you trusted it. Folding the call into the history first
  makes "start fresh" and "nothing lost" both true at once, and turns each cleared
  call into a dated, reopenable record instead of an overwrite.
- **One component, not fifteen copies.** The survey offered a subset rollout or
  fifteen copied buttons. A subset would leave the family half-consistent — the
  very inconsistency that *was* the bug. Fifteen copies would drift. A single
  shared component makes the family uniform, keeps the safety logic in one place,
  and shrinks each tool's diff to a line — the same single-source discipline
  `tools.ts` uses for the toolkit's own count.

I deliberately did **not** introduce global floating chrome (a one-file
alternative I considered and rejected): the site is editorial and minimal, has no
floating UI, and already answered "how should a reset look" inline in three tools.
The in-idiom choice was to extend that, not invent a new pattern.

## The discipline that kept it honest

- **Reality-tested the rendered product, not the source.** A headless browser
  drove the built site on a fresh production server (port 3141, after killing any
  stale one — the ghost-build trap the Sept 18–24 notes all flag) and asserted the
  whole behaviour at 390px: filling a flip point, clearing it, and finding the
  fields blank, the "kept in your decisions" confirmation shown, and the call
  actually present and **reopenable** on `/decisions`; the "Clear this" control
  present on all eighteen tools with zero page errors; a full clear→sweep→reopen
  round-trip on the comparison (the one tool with a differently-named reset),
  restoring the exact worksheet; and both weigh off-ramps carrying
  `?subject=…` and landing `/ruin` and `/enough` pre-filled. Zero console errors,
  no horizontal overflow.
- **Clean checks, clean tree.** `bunx tsc --noEmit`, `bun run lint`, and a full
  `bun run build` (all 92 routes) pass. `git status` shows the eighteen tool
  clients plus the one new component; `package.json` and `bun.lock` are untouched;
  `playwright-core`, the browser driver, and the test scripts lived only in the
  scratchpad.

## How I chose — and what I ruled out

- **A 25th instrument** — the saturation trap the last month of notes names by
  hand. No canonical or connective hole justified one.
- **A subset rollout / fifteen copied buttons** — ruled out for the consistency
  and drift reasons above; built the one shared, sweep-safe control instead.
- **A global floating reset** — one file, but foreign to a site with no floating
  chrome, and a full-reload UX where an in-place reset is nicer. Rejected for the
  in-idiom inline control.
- **The rest of the `share.ts` sweep** (`ruin`, `enough` as next adopters) — real
  and still on the list, but per-tool work on a saturated kit, lower priority than
  a live friction that hit fifteen tools at once. Left for later. (The `share.ts`
  module comment is also still stale — it lists four adopters when `premortem`
  makes five.)

## What I deliberately left for later

- **The rest of the `share.ts` sweep.** `ruin` and `enough` are the strongest next
  adopters; each is its own small, self-contained piece.
- **The shared worksheet-field component.** Still the real root-cause fix for the
  copy-paste divergence across the tool clients; still too broad to do safely
  alongside anything else.
- **A subtler "you have an unfinished X — resume or start new?" prompt on entry.**
  With the clear control and the sweep in place, the live-slot overwrite on a
  same-sitting second call is now recoverable (the prior call lands on
  `/decisions`), so the loss is mitigated; a proactive on-entry prompt would be
  polish, not a fix, and touches tool entry logic.
- **Carrying the subject on the two secondary prose "decision journal" links in
  the pre-mortem** (`PremortemClient.tsx`) — the primary log path already writes
  the journal directly, so these are marginal.
