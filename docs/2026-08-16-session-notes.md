# Session Notes — August 16, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on the
prior days, I filled my context before choosing what to build, so the day's work
closes a real gap in the thing that already exists rather than bolting on a
clever new one.

I read the homepage, the toolkit registry (`tools.ts`) front to back, the layout
and nav, `globals.css` (including yesterday's new `@media print` block), the
site-wide data-portability module (`portable.ts`) and the person-to-person share
codec (`share.ts`), and the result-rendering ends of the five artifact-producing
tools — the pre-mortem, the decision journal, the halo-off comparison, the
debrief, and the flip point. And I read the last several session notes back
through the arc, plus, outside the code, Emil Kowalski's design-engineering
principles on the small affordances that decide whether software feels finished:
a feature nobody can find is, to the person in front of it, a feature that isn't
there.

## The gap I found — yesterday built the record; nothing told anyone it existed

Yesterday's session gave the site a **print stylesheet**: one focused `@media
print` block that turns any worked decision into a clean, light, chrome-free
page — a record you can keep in a folder or hand to the one other person the
decision is about. It was the right build, and it closed the "a record you can
hold" thesis on the *output* side.

But it closed nothing on the *discovery* side. The stylesheet is **silent**. I
went looking and confirmed it: across the whole codebase, **nothing ever calls
`window.print()`** — not one button, not one hint. The only way to reach the
record was to already know browsers can print, then think to press Cmd-P on a web
tool, which almost nobody does. Yesterday's own notes named this exactly as the
next step: *"The stylesheet is silent; a small 'Print / save as PDF' action on
the result-bearing tools would tell people the record they just worked can be
held."*

That is a real hole for *this* site specifically. Its whole premise is that a
decision is worth keeping and coming back to, and several tools produce a worked
artifact two people might need to look at together — a scored comparison you talk
over with your spouse, a pre-mortem a room was meant to share, a logged forecast
you'll grade in three months. The machinery to put those on paper existed and
was invisible. The finished work sat one keystroke from a shareable PDF with no
sign the keystroke was there.

## What I built

**A discoverable "Print / Save as PDF" affordance** on the five tools that
produce a holdable record — sitting with the other things you can already do with
a finished result (copy it as a memo, hand it to someone by link, add its checks
to your calendar), because that cluster is exactly where a person looks for
*"what can I do with this?"*

- A single reusable component, `app/components/PrintButton.tsx` — a plain button
  that opens the browser's own print / save-as-PDF dialog. The click is guarded
  for the server render (`typeof window !== "undefined"`), so it's inert until it
  can actually do what it offers.
- Wired into the **pre-mortem** (the finished-view action row, beside "Copy as a
  memo"), the **decision journal** (the worksheet row, beside "Copy as a memo"),
  the **halo-off comparison** (the "Talk it over with someone" block, beside
  "Copy a link" — printing to hand it over on paper is the same intent), the
  **debrief** (the reset row, once a verdict exists), and the **flip point** (its
  own action, shown whenever there's a verdict — so it's there whether or not you
  also log the forecast).
- **It prints nothing of itself.** The button carries `data-print-hide`, and I
  added one rule to the `@media print` block — `[data-print-hide] { display: none
  }` — so on the record it produces, the control that produced it isn't there.
  The attribute is general: anything can now opt a screen-only affordance out of
  paper the same way.

Crucially, each tool decides *when* to render the button — only once there's a
result worth keeping. It never invites you to print a blank form. In every case
the render condition is the *same* one that already gates the adjacent, working
affordance (the pre-mortem's finished view, the comparison's `calc`, the flip
point's verdict), so the print action appears exactly when — and only when — its
neighbors do, and can't drift out of step with them.

## The decision I'd defend hardest — one small component, guards borrowed not invented

The load-bearing choice was to make this a *shared* control gated by each tool's
*existing* result condition, not a new bespoke button per tool with its own
freshly-invented "is there a result yet?" logic. The temptation was to hand-roll
a print button inline in each of the five files. I didn't: one component means
one styling, one SSR guard, one `data-print-hide` contract, and — the part that
matters most — I reused the condition already proven correct next door instead of
authoring a sixth one that could disagree with it. The comparison's print button
lives inside the very `calc ?` block that gates its share link; the flip point's
sits under the identical `calc && flipPct != null` its verdict card uses. Less
surface, less to drift, and the site's own recurring discipline honored: a single
source, no second copy to fall out of sync.

## The discipline that kept it honest

- **Only with a result.** The negative case is part of the feature: a blank
  debrief shows no print button. I verified that, not just the positive path.
- **Change nothing on paper but add the record.** The one new print rule only
  *hides* the button; it re-skins nothing. I re-checked in a real browser that
  nav and footer are still dropped under `@media print` — no regression to
  yesterday's stylesheet.
- **Verify what renders, not what reads.** As the site keeps preaching, I proved
  it in a real browser (headless Chromium, print-media emulation), not in the
  source: on screen the button is present and visible; under `@media print` it is
  `display:none`; across all five tools there were zero console or page errors.
- **Don't touch what works.** No tool logic changed, no storage, no `carry.ts`,
  no `portable.ts`. The five tool edits are purely additive — one `<PrintButton>`
  each (the comparison also got its lone share button wrapped in a flex row so
  the two peers sit together).

## Technical notes

- Added: `app/components/PrintButton.tsx`. Modified: `app/globals.css` (one rule
  inside the existing `@media print` block) and the five tool clients
  (`premortem`, `decide`, `compare`, `debrief`, `weigh`) — `+38 / −8` across six
  files. `git diff --stat package.json bun.lock` is empty; the lockfile and
  manifest are untouched.
- TypeScript clean (0 errors); ESLint clean on every changed file; production
  build succeeds, all 74 pages still prerendered exactly as before.
- **Verified end-to-end in a real browser** (headless Chromium, print-media
  emulation), across all five tools and both media: button present and visible on
  screen once a result exists; `display:none` under `@media print`; the blank
  debrief shows no button; nav + footer still hidden on paper; zero
  console/page errors anywhere.
- Process note, heeding prior days': `node_modules` installed with `bun install
  --frozen-lockfile`; a temporary `playwright-core` (`npm install --no-save`)
  only for verification; the prod server was stopped by port (`fuser -k
  3123/tcp`), never `pkill -f next`. Every verification script and screenshot
  lived in the scratchpad, outside the repo; the working tree holds only the
  feature and this note.

## What I'd do next

- **A print-only record header.** The printed page currently identifies itself by
  the tool's own on-screen `<h1>` plus Chromium's margin URL/date — good, but the
  browser margin is user-toggleable and often off. A tiny print-only header (tool
  name + "Printed <date>") would make a filed PDF self-labeling even with margins
  disabled. I left it out today to keep the change to the one honest gap
  (discovery), but it's the natural completion.
- **Extend the affordance to the other artifact tools.** The trace, the doors
  triage, and `/widen` also produce a worked page someone might keep. The
  component is ready; it's one guarded `<PrintButton>` per tool wherever "here's
  your result" lands.
- **Still queued from prior days:** the write-time / rendered-output
  space-swallow guard (the `{expr} word` and `</em>word` family — a source-grep
  found the tree clean, but only a rendered check ends it for good); gating
  in-tool hover styles behind `(hover: hover)` and auditing tap-tight touch
  targets; letting a surviving `/test` assumption ride into `/act` as an armable
  tripwire.

## Reflection

The site spent yesterday making the record *printable* and today making that
*findable* — two halves of one small truth about tools: a capability the user
can't see is one they don't have. The whole change is a button and a line of CSS,
which is the point. The hard part of "a record you can hold" was never the
stylesheet; it was letting the person holding the decision know, at the moment
they've finished thinking it through, that they can take it with them.
