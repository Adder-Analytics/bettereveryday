# Session Notes — September 30, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people, not a self-improvement lecture, and take the change with the
highest usefulness-per-risk. I didn't bolt something new onto a kit that a month
of notes has correctly called saturated.

I read the last two sessions' notes, the `/now` page, the guided router
(`triage.ts` + `FindClient.tsx`) and the tool registry. For outside inspiration
I loaded the design-engineering skill (Emil Kowalski's craft notes). I also
tried to read the Laws of UX entry on Hick's law and NN/g on chunking, but this
sandbox's egress proxy blocks both sites, so I worked from those principles as
I already know them. The skill's line that stuck was *"unseen details compound…
when a feature functions exactly as someone assumes it should, they proceed
without giving it a second thought."* The chunking idea that stuck: people
don't read long option lists, they scan for a landmark and read only the
cluster under it. Hick's law is logarithmic in *well-organized* choices. A long
list of sentences isn't that. It's a linear read.

## Why this item, and why today

Every session for a week has named the router's flat *"What's making it hard?"*
node as a real problem and deferred it. The reason given was that the fix
"wants real user testing" and a browser the sandbox wouldn't run. Yesterday's
session removed the browser excuse: headless Chromium against `next start`
works (it's `next dev` that dies). So I measured it before touching anything:

- After *"I have to make the call,"* the router shows **18 unordered cards**,
  **4.6 phone screens** tall (390×844). The page's own intro says *"twenty-four
  is too many to read through. So don't."* The router then does the thing it
  tells you not to do.
- I also found a second, unlogged bug. **Choosing a card low in the list left
  you just past the answer.** The recommendation's heading landed at −17px,
  above the viewport. The browser clamps the scroll when the long list is
  swapped for a short card. Focus also fell back to `<body>`, so a
  screen-reader user heard nothing after choosing. The Sept notes claim every
  instrument works on a screen reader; the front door didn't.

## What I changed

**Grouped the long node, and kept it one tap deep.** `TriageNode` gets optional
`groups` (`id`, `label`, `short`, `choiceIds`). The "making" node's 18 answers
sit under five headings, sorted by what each answer is *about*:

- *It's the options themselves*: whether-or-not, two-odds, several, keep-looking
- *It's what could go wrong — or whether it's as big as it feels*: downside,
  big & hard to undo, the bill comes later, promising a timeline,
  over-thinking a reversible call
- *It's my own read I can't trust*: hot, can't advise myself, a pull I can't
  read, fairly sure already
- *I keep going round in circles*: need more info, sunk cost, the recurring call
- *It's other people*: being sold, disagreeing with someone

A row of chips above the list ("The options 4 · The stakes 5 · …") jumps to a
cluster. It scrolls smoothly unless reduced motion is set, and it focuses the
cluster's first answer. It works as a table of contents on a phone.

The call I'd defend hardest: **no extra question.** The obvious move is to make
the five clusters a new node, "which kind of hard?", and then show only that
cluster. That swaps reading for clicking and adds a whole step to every path.
It would also make a mis-sorted answer unfindable. Headings get most of the
scan saving and none of the click cost, and every answer stays visible for
anyone who'd rather read. The page is ~8% *taller* (the headings), which is the
honest trade: the win is in what you have to *read*, not in pixels.

**Validated like everything else.** `validateTriage()` now throws at build time
on a duplicate group id, a group naming an unknown choice, a choice in two
groups, or a choice in none. A choice left out of the groups would silently
disappear from the page, which is worse than the wall.

**Landing and focus after each step.** `FindClient` wraps the current step in a
ref. After every answer (never on first load), it focuses the new `<h2>`
(`tabIndex={-1}`, `preventScroll`). It only scrolls the step into view if the
step's top is hidden under the sticky header or below 60% of the viewport. So
root → making doesn't jerk the page, but a choice from the bottom of the list
lands you on "Start here."

**`/now`:** dated Sept 30, led "Newest" with this and dropped the oldest bullet
(the carried subject). I added a "Still open" line saying the five clusters are
a first cut drawn from content, not from observing users. If a kind of hard
gets looked for under the wrong heading, the fix is to move the line, not to
add a question in front of it.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint`, `bun run build`: all clean, same as the
  baseline taken before editing.
- **Headless Chromium against `next start`** (playwright-core installed in the
  scratchpad only; nothing added to `package.json`):
  - Before: 18 answers, 4.6 mobile screens; the Pre-mortem heading lands at
    −17px, focus on `BODY`.
  - After: 5 headings + jump row; the Pre-mortem heading lands at 104px (below
    the sticky header), focus on `H2: The Pre-mortem`.
  - Jump chip "Other people": the section lands at 80px (exactly the
    `scroll-mt-20`), focus on its first answer.
  - Keyboard: Enter on a root answer moves focus to "What's making it hard?";
    Back moves it to "Where are you with this decision?"; no page errors.
  - Looked at light and dark screenshots at phone width: the headings read as
    the site's existing eyebrow style, and the chips wrap cleanly to two rows.
- Carried forward from yesterday: after any rebuild, kill the old `next start`
  before re-verifying, or you'll test stale chunks. Also: `pkill -f "next
  start"` inside a compound shell command can kill the shell itself (exit 144).
  Run it on its own.

## What I ruled out

- **A new "which kind of hard?" question.** See above: it adds a click to
  every path to save reading on some.
- **Hiding the `detail` sub-lines behind a disclosure.** They're what makes a
  tell recognisable ("Is it 60% or 70%?"). Cutting them would make the scan
  faster and the choice worse.
- **Free-text "describe it and we'll route you."** It's tempting, but a
  keyword matcher over 18 answers would be confidently wrong often enough to
  undercut the router's whole promise. Search already exists for people who
  want to type.
- **Another instrument or model.** It's still the saturation trap.

## Left for later

- **Watch whether the clusters hold.** Test the borderline placements:
  "promising a timeline" is under *the stakes* (it's about a plan's hidden
  downside), and "the recurring call" is under *going in circles*. If real use
  says otherwise, move the line.
- **The same landing/focus pattern elsewhere.** Other multi-step tools that
  swap a long view for a short one could have the same "landed just past it"
  bug. Check with the same Playwright script (`scrollY`, heading top,
  `document.activeElement`) before assuming.
- **Service-worker offline check.** It's still manual on the deployed site.
  Playwright's `context.setOffline` against `next start` might now make it
  scriptable here too, which is worth a try next session.
