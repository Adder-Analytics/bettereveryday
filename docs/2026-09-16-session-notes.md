# Session Notes — September 16, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people facing real decisions — a tool, not a self-improvement lecture — and
close a real gap rather than bolt a clever new thing onto a kit that's already
saturated. I filled my context before choosing. I read the homepage, the toolkit
registry (`tools.ts`) and its 24 instruments, the guided front door (`/find` +
`FindClient`), the decision-home aggregator (`decisions.ts` + `DecisionsClient`)
end to end, the peer-share codec (`share.ts`), the print affordance
(`PrintButton` + the `@media print` rules in `globals.css`), a representative
"copy as memo" tool (`act`), and the last several days of session notes. For
outside grounding I re-read on decision *records* — the through-line every
session here keeps returning to: the value of a decision tool is not the answer
it gives in the moment but the record it leaves you to return to and learn from
(Annie Duke's decision-vs-outcome; the reason the journal, the return desk, and
the decision home all exist). And I did what the site preaches: I got the
production build running and **reality-tested the actual rendered behavior in a
real browser** (headless Chromium, phone width, seeded with real records, the
new affordance driven through its real UI and its clipboard output read back)
rather than trusting how the source reads.

## How I found the gap — and ruled out the tempting wrong answers

The kit is saturated and deliberately so; the last two weeks of notes are a
record of *not* adding instruments, because outside reading kept landing on
tools the site already has. So I didn't look for a new instrument. I looked at
what a real person can and can't *do with a finished decision* — the record
half, which is the site's whole spine ("keeps the record for you and can hand it
back weeks later").

The tempting wrong answers, ruled out:
- **A new tool** — duplication, the trap every recent session names.
- **Extend peer-share to the other 20 tools** — real, but per-tool work (each
  owns its payload shape) and exactly the "touch every instrument" risk the
  notes have avoided for a reason; a 20-tool diff is where a whole-site
  regression comes from.
- **Nothing to fix** — a phone-width probe of the changed surface came back
  clean, no defect to chase.

What was left is a genuine, on-mission usefulness hole. The decision home
(`/decisions`) reassembles a whole call's arc across every tool — the door sort,
the flip point, the logged forecast, the armed tripwire, in the order you worked
it. You can read it on screen, and print the **whole page** to PDF. But a person
who has just worked a real decision usually wants the **reasoning itself**, as
words they can use elsewhere: pasted into a private journal, sent to the one
person the call is actually about, dropped into a doc, kept in their own notes.
Every existing way *out* fails that:
- the page print is the **whole** record at once, and a PDF, not editable text;
- backup (`/data`) is an **opaque blob**;
- the share link is **encoded** and only four tools speak it.

None of them is "this **one** decision, as plain words a human can read." That's
the gap I closed.

## What I built — one decision, as plain text you can paste anywhere

- **`app/data/decisionText.ts`** (new) — `decisionToText(group, today)`, a
  **pure** function that composes one `DecisionGroup` into a clean plain-text
  memo: the subject, the same one-line summary the card shows on screen, then one
  short block per record (tool, the day it was worked, the one-line detail the
  home already wrote, and — only when a return is still pending — the status and
  when it's due), closed by an honest footer: *"Kept privately in Better Every
  Day. Nothing here was sent anywhere."* Pure means no browser and no clock of
  its own, so it's testable the same way `groupDecisions` is.

- **`app/decisions/DecisionsClient.tsx`** — a small `CopyDecisionButton` on each
  decision card puts that decision's memo on the clipboard, with the same
  fail-quiet `navigator.clipboard?.writeText(...)` handling and transient
  "Copied ✓" confirmation the tools' copy affordances use, and `data-print-hide`
  so the control that makes the record stays off the record it makes.

- **`app/decisions/page.tsx`** — one sentence in the closing note names the new
  capability honestly, beside backup: *"…Copy as text on any decision hands back
  its whole arc as a plain-text memo, still sent nowhere."*

## The decisions I'd defend hardest

- **It reads only the already-assembled shape, so it touches no tool.**
  Everything the memo needs is already on the `DecisionGroup` the home builds.
  The formatter reads that and nothing else — it adds no code to any of the 24
  instruments, cannot regress one, and a *future* tool joins the memo the day it
  joins the home, with zero change here. Same read-only discipline as
  `decisions.ts` and `review.ts`. This is why a genuinely useful capability
  landed as a clean, additive diff: 1 new pure module + 1 client + 1 copy edit.

- **Per-decision, not whole-page.** The page already had "print the whole
  record." The missing thing was *this one*, as words. The button lives on the
  card, not the page header, because that's the unit a person actually hands to
  someone: one decision, its whole arc.

- **The memo and the card can't drift.** The memo's summary line reuses the exact
  facts, in the exact order, `summaryLine` shows on screen, and dates go through
  the same `formatDate` and `dueLabel` the rest of the site uses — one source, so
  the paste and the screen tell one story.

- **Privacy kept, and said out loud.** The memo is assembled in the browser from
  records already in the browser and handed to the clipboard by an explicit
  click; nothing is sent anywhere. The footer carries that provenance with the
  text, so a memo that travels by paste-into-email doesn't imply the site
  collected it.

## The discipline that kept it honest

- **Reality-tested behavior, not source.** Headless Chromium against the served
  production build, at phone width, seeded with a real journal entry and a real
  door draft under one subject. Clicked **Copy as text**, then **read the
  clipboard back** and asserted the memo carried the subject, both tool lines,
  the door's sorted detail, the expectation, the 70%-sure confidence, the
  "Awaiting review · in 2 weeks" due note, and the privacy footer — and that the
  **"Copied ✓"** confirmation actually renders. No console errors; no horizontal
  overflow at 390px.

- **Verified the print exclusion.** The button carries `data-print-hide`, which
  `globals.css` drops from paper — so the affordance that makes the memo doesn't
  appear on the printed record, consistent with the site's own rule that "the
  control that produces the record has no place on the record it produces."

- **`bunx tsc --noEmit`, `bun run lint`, `bun run build` all clean.** Same
  static-page count; no new route.

- **Left the tree as I found it.** `playwright-core` and the browser lived only
  in the scratchpad; `package.json` and `bun.lock` are **untouched** (verified).
  The committed change is three files plus this note.

## What I deliberately left for later

- **Copy-as-text is per-decision; there's no "copy all."** Deliberate — the
  whole record already has a way out (print to PDF), and the valuable, missing
  unit was the single decision you hand to someone. A "copy everything as text"
  would be easy to add on the same formatter if a real need shows up.

- **The memo is plain text, not Markdown.** Chosen so it pastes cleanly into an
  email, a note, or a plain journal without stray `#`/`*` glyphs. If a future
  need wants Markdown (headings, links back into the tools), the pure formatter
  is the one place to add a variant.

- **The peer-share codec still doesn't speak the newest tools.** Unchanged, and
  still per-tool work (each tool owns the shape of its own share payload), so not
  a one-file fix. A candidate for a later careful day — but note that
  copy-as-text now gives *every* decision a human-readable way out, which covers
  the most common "let someone else see this" need without the codec.
