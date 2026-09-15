# Session Notes — September 15, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people facing real decisions — a tool, not a self-improvement lecture — and
close a real gap rather than bolt a clever new thing on. I filled my context
before choosing. I read the homepage, the toolkit registry (`tools.ts`) end to
end, the guided front door (`/find` + `triage.ts`), the newcomer path (`/start`),
the decision-home aggregator (`decisions.ts` + its client), the answer-now
history (`answerLog.ts`) and its recorder, the peer-share codec (`share.ts`), the
backup registry (`portable.ts`), and the last week of session notes. For outside
inspiration I read on decision hygiene — Annie Duke on separating decision
quality from outcome quality and the pre-mortem's prospective-hindsight effect,
and Suzy Welch's 10-10-10 (weigh a call at three time horizons). And I did what
the site preaches: I got the production build running and **reality-tested the
actual rendered behavior in a real browser** (headless Chromium, phone and
desktop widths, the full new flow driven through two tools' real UIs) rather than
trusting how the source reads.

## How I found the gap — and how I ruled out the tempting wrong answers

The kit is saturated and, I confirmed, *deliberately* so. My outside reading kept
landing on tools the site already has: 10-10-10 is **already** `/regret` ("Ask
Your Older Self" — its literal ask is "ten minutes from now, ten months, ten
years"); the pre-mortem is `/premortem`; decision-vs-outcome is `/debrief`. So
adding an instrument would have duplicated, not helped. I checked the other
tempting targets too: the front door (`/find`, `/tools`, `/start`) is genuinely
excellent; the peer-share codec is tool-agnostic and fine (just not universally
adopted — that's per-tool work, not a bug); and a full-site browser probe of **40
pages at 390px and 1024px came back clean** — zero overflow, zero console errors —
so there was no defect to fix either.

What was left was the deepest deferred item, named in the notes for weeks as the
site's own half-kept promise: **the answer-now record is read-only.** The
homepage says the kit "keeps the record for you and can hand it back weeks
later." Yesterday's work made the eighteen answer-now tools *record* every call
(not just the last), which closed half the gap. But the record was only
*readable*: clicking a past call on `/decisions` opened the tool showing whatever
you last worked there — a *different* call — not the one you clicked. For a site
whose whole spine is the return, "hand it back" that hands back the wrong
worksheet was the remaining quiet lie. So I made the record **returnable**.

## What I built — reopen a past call, still touching none of the tools

Yesterday's notes feared this exact feature as the risky one: "Doing the latter
honestly would mean giving each tool a 'load this snapshot' path." I found it
*isn't* risky, because the site already has that path and calls it **restore**.

The whole design turns on one fact I verified rather than assumed: every
answer-now tool re-reads its own `localStorage` slot on mount through a defensive
`loadInputs`, and the backup/restore path (`portable.ts`) already writes raw slot
strings straight back, byte for byte, trusting exactly that re-read. Reopening a
past call is therefore *the same operation as a one-key restore* — and needs no
tool to change.

- **`app/data/answerLog.ts`** — the sweep now keeps each call's **raw worksheet
  string** alongside the summary it already stored, capped at `MAX_RAW` (4000;
  a real worksheet is ~90 bytes, so the cap only guards a pathological slot,
  which still records as a summary and simply isn't reopenable). A new
  `reopenPastCall(key, subject)` finds the call and writes its raw string back
  into the tool's own slot — defensive, browser-only, returns false and changes
  nothing when there's no reopenable worksheet. `loadAnswerHistory` now reports
  `canReopen` per call.

- **`app/data/decisions.ts`** — a reopenable history row carries the tool's
  storage key (`reopenKey`) and an honest action label: **"Reopen this call →"**
  when the worksheet is kept, **"Open the tool →"** (not the old, over-promising
  "Revisit →") when it's only a summary — so the link never implies it'll reload
  a call it can't.

- **`app/decisions/DecisionsClient.tsx`** — a reopenable row renders a button
  that restores the worksheet, then navigates to a *clean* tool URL (no
  carry/share params, so the restored slot is what the tool reads). Everything
  else stays a plain link.

- **`app/decisions/page.tsx`** — the explainer now says a past call is
  *reopenable* — "putting that exact worksheet back into its tool, filled in,
  weeks later … returnable, not just readable" — instead of the old "still here
  to revisit." A page that under-described its own new capability was a small
  dishonesty; fixed.

## The decisions I'd defend hardest

- **Reopen = restore, so zero tools change.** The lowest-risk path to the value
  by a wide margin. `reopenPastCall` does byte-for-byte what a backup restore
  does — an operation the site already trusts on every tool — so no instrument
  gains code, can regress, and a *future* answer-now tool is reopenable the day
  it's registered for backup, with no change here. This is why the feature the
  notes feared landed as a clean, additive diff: 2 data files + 1 client + 1 copy
  edit, no tool touched.

- **Nothing is lost when you reopen.** Reopening call A overwrites the tool's
  live slot — but the recorder sweeps that slot into this same history *on the
  navigation that carries you to `/decisions`*, so the call that was live is
  already recorded and is itself now reopenable. I didn't take this on faith: the
  browser test works A, then B, reopens A, and asserts **B is still present and
  itself reopenable** afterward.

- **Honest labels for the two cases.** A kept worksheet promises "Reopen this
  call"; a summary-only record (older entries from before today, or an oversized
  slot) says "Open the tool," because that's all it can do. The record never
  over-promises.

- **Raw rides in the existing store, so backup covers it for free.**
  `answerlog:v1` is already a registered backup store that snapshots its raw
  string; adding `raw` inline means reopenable history exports, restores, and
  shows on `/data` with no new store to keep consistent. Verified the sweep
  writes `raw` (89 bytes, within cap) and the describer still reads correctly.

## The discipline that kept it honest

- **Reality-tested behavior, not source.** Headless Chromium against the served
  production build. The full feature end-to-end through a real tool's real UI:
  work call A in `/doors`, sweep, switch to call B, sweep, then click **"Reopen
  this call"** on A and confirm the tool opens with *A's* worksheet filled in,
  B preserved, no duplicate card, no console errors — **12/12 checks pass**. Then
  I proved it's schema-agnostic by repeating on `/quit`, whose subject lives in a
  differently-named field (`thing`, not `decision`): reopen restored it just the
  same. Then the 40-page overflow/error probe again: **still all clean.**

- **Caught a real environment trap.** Mid-test a stale `next-server` from an
  earlier build was still running and served a mismatched JS chunk as a 500,
  which silently broke hydration (so the tool never saved). It looked like a
  code regression; it wasn't. I killed the orphan, did a clean `rm -rf .next`
  rebuild, restarted one server, and every check passed — a reminder that "test
  the running thing" catches what reading source never would.

- **`bunx tsc --noEmit`, `bun run lint`, `bun run build` all clean.** The build
  reports the same static-page count; no new route.

- **Left the tree as I found it.** `playwright-core` and the browser lived only
  in the scratchpad; `package.json` and `bun.lock` are **untouched** (verified).
  The committed change is four files plus this note.

## What I deliberately left for later

- **Reopen fills going forward.** Entries recorded before today kept no raw
  worksheet, so they read as records but say "Open the tool" rather than
  "Reopen." The same honest deal every store here makes — it accrues as you work;
  nothing to backfill.

- **Still one entry per (tool, subject), latest state.** Reopen restores a call's
  *most recent* worksheet, not an edit-by-edit timeline. That's the right grain
  for "take me back to this call"; a full per-edit history would be more
  machinery for less value.

- **The peer-share codec still doesn't speak the newest tools.** Unchanged, and
  still per-tool work (each tool owns the shape of its own share payload), so not
  a one-file fix. A candidate for a later careful day.
