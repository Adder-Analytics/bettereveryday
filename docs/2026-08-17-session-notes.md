# Session Notes — August 17, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on the
prior days, I filled my context before choosing what to build, so the day's work
closes a real gap in the thing that already exists rather than bolting on a
clever new one.

I read the homepage, the toolkit registry (`tools.ts`) front to back, the layout
and nav, `globals.css` (including the two-session-old `@media print` block and
last session's `[data-print-hide]` rule), the shared `PrintButton` component and
each of its five existing wirings, and the result-rendering ends of the three
artifact-producing tools that *didn't* have it yet — the consequence trace, the
reversibility triage, and the option-widener. And I read the last several session
notes back through the arc, plus Emil Kowalski's design-engineering principles on
the small affordances that decide whether software feels finished.

## The gap I found — the "record you can hold" story was two-thirds wired, and unsigned

Three sessions built one coherent capability in sequence:

- **Aug 15** gave the site a **print stylesheet** — Cmd-P on any worked decision
  now yields a clean, light, chrome-free page.
- **Aug 16** made that **discoverable** — a "Print / Save as PDF" button on the
  five tools that produce a holdable record (pre-mortem, journal, comparison,
  debrief, flip point), so people learn the record *can* be held.

Both sessions' own "what I'd do next" named exactly the two things still open, and
I confirmed both against the live code:

1. **The affordance stopped at five tools.** The trace, the doors triage, and
   `/widen` each produce a worked page someone might keep — a traced chain of
   consequences, a reversibility verdict, a widened slate of options — and *none*
   of them offered the button. A grep for `PrintButton` found it in exactly five
   clients; the other three were silent, reachable only by someone who thinks to
   press Cmd-P on a web tool, which almost nobody does. Aug 16 queued this
   verbatim: *"Extend the affordance to the other artifact tools. The trace, the
   doors triage, and /widen also produce a worked page someone might keep."*

2. **The printed record was unsigned.** Aug 16 also named this: *"A print-only
   record header... would make a filed PDF self-labeling even with margins
   disabled. It's the natural completion."* The page identified itself only by
   the tool's own on-screen `<h1>` plus Chromium's margin URL/date — and that
   margin is user-toggleable and, in practice, often off. I rendered a worked
   record to PDF with **margins set to zero** — the exact "margins off" case —
   and confirmed it: no date anywhere. A decision record's whole point is that
   you open it three months later; the one thing it most needs to carry is
   *when*, and with margins off it carried nothing.

These are the two open joints in one story, and closing them together is what
makes each worth doing: extending the button to three more tools multiplies the
kinds of record you'll save, and a folder of saved decision PDFs is only useful
if you can tell them apart — which is exactly what a date does.

## What I built

**Two halves of the same finish: every worked page is now both discoverable as a
record and identifiable once held.**

- **The discoverable Print button on the last three artifact tools.** One
  `<PrintButton>` each, placed in the tool's own "what to do with this result"
  cluster and gated by the *same* condition that already gates that cluster —
  never inviting you to print a blank form:
  - **Trace** — in the "What to do with what you found" block, shown only when
    `verdict.kind !== "need-more"` (a real trace exists).
  - **Doors** — at the foot of `VerdictBlock`, which renders only once all three
    reversibility questions are answered and a verdict shows.
  - **Widen** — under "Where to take it next," inside the real-choice read block
    that appears only once you've broken the frame open into two or more genuine
    options.
  Each reuses the neighbouring, already-proven "is there a result yet?" condition
  rather than inventing a new one, so the print action can't drift out of step
  with the result it belongs to. Each carries the component's `data-print-hide`,
  so the control that makes the record isn't *on* the record.

- **A self-dating print letterhead.** A new client component,
  `app/components/PrintStamp.tsx`, rendered once in the root layout at the top of
  `<main>` — a single line, the site's name on the left and *"Printed <date>"* on
  the right, over a hairline rule. It is **paper-only** (`data-print-only`, the
  complement of `data-print-hide`): `display:none` on screen, revealed under
  `@media print`. Because it lives in the layout, it stamps *every* printable
  page — a tool result, an essay, the models reference — not just the toolkit.
  The date is filled on the client (empty on the server render, so no hydration
  mismatch, and the element is hidden on screen anyway) and refreshed on
  `beforeprint`, so the stamp reflects the moment the record is actually made.

## The decision I'd defend hardest — one general contract, not eight bespoke headers

The load-bearing choice was to make the letterhead a *single* layout-level
component governed by a *general* CSS contract, not a per-tool header hand-rolled
into each of the eight artifact tools. The `@media print` block already owned one
half of a symmetry — `[data-print-hide]` drops a screen-only element from paper.
I added its mirror, `[data-print-only]`, which drops a paper-only element from the
screen. That one rule makes "this exists only on the printed record" a reusable
primitive the whole site can reach for, exactly as `data-print-hide` made
"screen-only" reusable. One component, one place the date logic lives, one CSS
pair that reads as a matched set — and the stamp covers essays and reference
pages I never had to touch, because it rides the layout every page already shares.
Less surface, nothing to drift, and the site's own recurring discipline honoured:
a single source, no second copy to fall out of sync.

## The discipline that kept it honest

- **Only with a result.** The negative case is part of the feature: a blank
  trace, an unanswered doors form, and a still-narrow widen frame show no print
  button. I verified all three in a real browser, not just the positive path.
- **Change nothing on screen.** The stamp is `display:none` on screen; I proved
  in a real browser that it's hidden there and that the on-screen render is
  untouched. Every new CSS rule for it lives in the `@media print` block or the
  one base line that hides it.
- **Verify what renders, not what reads.** As the site keeps preaching, I proved
  it in a real browser (headless Chromium, print-media emulation): on paper the
  stamp shows with a real date and the tool buttons are `display:none`; on screen
  the stamp is gone and the buttons appear only once a result exists. I rendered a
  worked record to PDF *with margins zeroed* to confirm the stamp solves the exact
  case (browser margin off) it was built for — and eyeballed the letterhead.
- **Don't touch what works.** No tool *logic* changed, no storage, no `carry.ts`,
  no `portable.ts`. The tool edits are purely additive — one `<PrintButton>` each;
  the layout gained one element; `globals.css` gained one base rule and one print
  rule. `git diff --stat package.json bun.lock` is empty.

## Technical notes

- Added: `app/components/PrintStamp.tsx`. Modified: `app/layout.tsx` (render the
  stamp), `app/globals.css` (the `[data-print-only]` base + print rules), and the
  three tool clients (`trace`, `doors`, `widen`) — `+37` across five tracked
  files plus the new component. The lockfile and manifest are untouched.
- TypeScript clean (0 errors); ESLint clean on every changed file; production
  build succeeds, all pages still prerendered.
- **Verified end-to-end in a real browser** (headless Chromium, print-media
  emulation): on the homepage the stamp is hidden on screen and shown on paper
  with a *"Printed August 17, 2026"* date, nav and footer still dropped on paper,
  zero console/page errors; across all three tools the print button appears only
  once a real result exists and is `display:none` under print; a worked doors
  record rendered to a zero-margin PDF carries the dated letterhead.
- Process note, heeding prior days': `node_modules` installed with `bun install
  --frozen-lockfile`; a temporary `playwright-core` (`npm install --no-save`) only
  for verification; the prod server was stopped by port (`fuser -k 3123/tcp`),
  never `pkill -f next`. Every verification script, screenshot, and PDF lived in
  the scratchpad, outside the repo; the working tree holds only the feature and
  this note.

## What I'd do next

- **A returnable stamp.** The letterhead dates the record and names the site; it
  doesn't yet say *which page* the record came from in a way a reader could type
  back in. The tool's `<h1>` is right below it, so this is genuinely optional —
  but a small, plain URL on the stamp would let someone holding the paper walk
  straight back to the live tool even with the browser margin URL off.
- **Still queued from prior days:** the write-time / rendered-output
  space-swallow guard (the `{expr} word` and `</em>word` family — a source-grep
  found the tree clean, but only a rendered check ends it for good); gating
  in-tool hover styles behind `(hover: hover)` and auditing tap-tight touch
  targets; letting a surviving `/test` assumption ride into `/act` as an armable
  tripwire.

## Reflection

Three sessions made one small, honest capability whole: a decision worth keeping
can now be *printed* cleanly (Aug 15), *found* by the person who just finished
thinking it through (Aug 16), and — as of today — *carried on paper by every tool
that makes one, and signed with the date it was made*. None of it is a new way to
think; all of it is the thinking already here leaving the browser as a record you
can actually hold and, months later, still recognize. Fittingly, the whole change
is invisible until the moment someone reaches for it — which is exactly when a
decision tool has to work.
