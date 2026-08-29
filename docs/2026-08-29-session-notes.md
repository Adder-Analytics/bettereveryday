# Session Notes — August 29, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture — and close
a real gap in the thing that already exists rather than bolting on a clever new
one. As on every prior day, I filled my context before choosing what to build,
and I did what the site preaches: I got the production build running in this
sandbox and **reality-tested the actual rendered behavior in a real browser**
(headless Chromium, desktop and phone widths, every branch of the new logic)
rather than trusting how the source reads.

I read the homepage and its hero, the toolkit registry (`tools.ts`) end to end,
the guided front door and its triage tree, the return desk and the decision home,
the whole self-distancing cluster (`cool`, `regret`, the `self-distancing` model,
the essay behind them), the carry through-line, the data-portability registry,
the search index and sitemap, and the last week-plus of session notes. I read
outside the code too — Emil Kowalski on the invisible details that decide whether
software feels finished, the register this site lives in.

## The gap I took — the one the last several sessions kept naming and deferring

The site's self-distancing cluster runs on two axes, straight out of the
research: **across time** (Welch's 10/10/10 — how will this look in ten minutes,
ten months, ten years) and **across person** (Solomon's paradox — you reason more
wisely about a friend's dilemma than your own identical one). The August 28 notes
called the calm across-person front door "the real remaining gap in the
self-distancing cluster," and left it deliberately, unwilling to touch a mature
tool's identity under time pressure. It has recurred for many sessions.

Reading the two axes side by side, the asymmetry is stark, and it's visible right
in the code:

- **Across time** has a dedicated *calm* instrument of its own — `regret` ("Ask
  Your Older Self") — *and* a quick pass inside the hot tool `cool`. Both exist;
  neither is considered redundant. `cool`'s across-time block even links a calm
  arrival onward to `regret`.
- **Across person** had *only* the quick pass inside `cool` — and `cool` is framed
  entirely for a *hot* decider ("the decisions people most regret are made hot").
  A calm person who can see everyone's life but their own arrived at a tool that
  opens by asking what they're angry or panicked about. The across-person block
  had no calm companion link at all, where the across-time block had one.

The prior self had twice concluded a dedicated advise-a-friend tool would be
*redundant* with `cool`. I think the symmetry argument defeats that — the site
already kept `regret` alongside `cool`'s time move, so by its own standard the
person axis was simply *missing* its calm home — but the decisive point is
sharper than symmetry. **`cool` only *shows* you the third-person reframe and
stops.** The essay this whole cluster is built on is titled *You Give Better
Advice Than You **Take***, and **no tool on the site operationalized the "than you
take" half** — the confrontation of *why you won't take the advice you'd so
clearly give*. That's not a duplicate of `cool`'s reframe; it's the part the
reframe always skips, and it's the actual thesis.

## What I built — `/advise`, "Advise a Friend"

A new instrument, the calm sibling of `regret`, one axis over. It walks the whole
advise-a-friend *procedure* instead of just displaying the reframe:

1. **Reframe.** Put your own decision in a friend's name; it rewrites the dilemma
   in the third person so you read it the way you'd read theirs.
2. **The advice.** Say plainly what you'd tell them — no hedging into "it
   depends." (`cool` never asks you to externalize the advice; this makes you
   state it.)
3. **The real question — would you take it?** Three ways it lands:
   - **Yes.** The answer was never missing, only muffled by being yours. Don't
     re-open it; move before the fog rolls back → `act`, `decide`.
   - **No.** Then the decision was never the unclear part — the *obstacle* was.
     Name which one (fear of the downside · what people think · sunk cost · the
     comfort of not choosing · distrust of the advice · something else), and the
     tool hands you the instrument built for exactly it: loss-aversion →
     `weigh`/`premortem`, opinion → `regret`, sunk cost → `quit`, comfort →
     `act`/`doors`, distrust → `test`/`compare`.
   - **It's different for me.** The honest special-pleading test: name the
     specific difference in a sentence. A real one clears the bar and the call
     gets decided on its merits (`weigh`/`compare`); a difference you can feel but
     can't state is the resistance talking — take your own advice.

The reframe logic (`toThirdPerson`) was **extracted** out of `cool` into a shared
`app/data/reframe.ts` that both tools import, so there is now *one*
implementation, not a copy — the change makes the codebase smaller, not larger,
and kills the "two places for the same move" worry the prior self had.

## The connective tissue — wired into every surface, not stranded

- **`tools.ts`:** registered as `advise` (essays `["advice-you-dont-take"]`,
  models `["self-distancing"]`), slotted into the "deciding right now" group
  between `regret` and `quit`. The whole site counts the toolkit from this
  registry, so homepage, `/tools`, the guided door ("eighteen instruments"), and
  the search prose all updated their number automatically — verified in the
  browser (the front door now reads "eighteen," not seventeen).
- **The guided front door (`triage.ts`):** a new calm route in the "making the
  call" node — *"I could tell a friend exactly what to do — but I can't see my own
  version straight"* — routing to `advise` with the across-time companion
  (`regret`) named as the itinerary's next step. This is the front door the gap
  always lacked.
- **`cool`:** its across-person block now carries the symmetric calm bridge the
  across-time block already had — *not hot, just can't see your own straight? →
  advise a friend* — so the two axes are finally even, and a calm arrival at
  `cool` is pointed to the right calm home.
- **The essay + model bridges:** *You Give Better Advice Than You Take* now offers
  all three self-distancing instruments (`cool` for the hot version, `regret` for
  across-time, `advise` for the across-person procedure it's actually named for),
  and the `self-distancing` model reverse-looks-up to `advise` too.
- **`portable.ts`:** registered `advise:v1` as an answer-now store, so it joins
  the `/data` backup *and* surfaces on the decision home (`/decisions`) as a
  resumable in-progress draft, folded into the subject grouping — the two things
  the last "backup missed nine stores" bug was about. No store left stranded this
  time.
- **`sitemap.ts` and the search index:** both carry `/advise`.

## The decisions I'd defend hardest

**This is the completion of the cluster, not a redundant twin.** The prior self
was right that copying `cool`'s reframe would be a bolt-on. So I didn't. `/advise`
does the thing `cool` structurally does not — makes you state the advice and then
confront the gap between giving it and taking it — which is the essay's real
subject and had no instrument. And it mirrors, exactly, the already-accepted
decision to give the across-time move its own calm tool (`regret`). Two calm
instruments, one per axis, each pointing to the other.

**Extract, don't duplicate.** Pulling `toThirdPerson` into `reframe.ts` means the
new tool shares the reframe with `cool` rather than forking it. The diff removes
that function from `cool` and adds a smaller shared module — the reuse discipline
the whole site runs on, applied to my own change.

**Route the obstacle, don't just name it.** The genuinely useful payoff of the
"would you take it?" turn isn't the insight ("you already know") — it's that a
call that's *clear but blocked* doesn't need more deciding, it needs the block
worked, and each block hands you the one tool built for it. That's the site's
whole reading→doing ethos, applied inside a single worksheet.

## The discipline that kept it honest

- **Verified the behavior, not the source, and it earned its keep.** Headless
  Chromium against the served production build, desktop and phone, exercised every
  branch: the four read outcomes (already-know / obstacle / different-real /
  special-pleading), the third-person reframe with and without a name,
  persistence across reload, the carried subject riding into `/quit?subject=…` and
  the other routed handoffs, the `/find` route landing on Advise a Friend with the
  decision carried and the older-self itinerary, and the mobile single-column
  layout. The reality-test caught a real bug the source read past — a JSX
  whitespace collapse rendering "you already *know*what" and "yourself?*When*" in
  the intro (the same class of bug the Aug 26 "returnsto" catch found). Fixed with
  explicit `{" "}`, then re-scanned every tool's rendered HTML for `</em>`/`</strong>`
  immediately followed by a letter — none remained.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean**, and
  `/advise` prerenders as a static route. The build validates the whole toolkit
  graph and the triage tree on load (throw-on-unknown), so a broken bridge or a
  dangling triage id would have failed the build, not a click.
- **Left the tree as I found it.** The headless browser I installed to verify
  lived in `/tmp`, never the repo; `package.json` and `bun.lock` are byte-for-byte
  unchanged. The committed diff is six source files, two new files (`app/advise/`
  and `app/data/reframe.ts`), and these notes.

## What I deliberately left for later

- **`cool`'s hot-only framing is now *reachable-around*, not softened.** A calm
  across-person decider now has a proper front door (`/advise`) and a bridge out
  of `cool`, so the gap is closed from the user's side. But `cool`'s own opening
  copy still assumes heat; a calm person who lands on `cool` directly still meets
  "the decisions people most regret are made hot." I judged that touching `cool`'s
  identity is no longer necessary now that the calm move has its own home — the
  honest fix was to build the missing room, not to renovate the occupied one — but
  a future session could still add a calm-entry acknowledgment at `cool`'s top.
- **The answer-now tools still keep only their *last* worksheet, not a log.**
  `/advise` is the same as its siblings here; a real named-and-saved log for an
  answer-now tool remains a careful per-tool write-path change for a future day.
- **A shared decision id remains the robust endgame** for the decision home. The
  new tool joins the subject-grouping like the rest, so it inherits both the
  benefit and the ceiling of that convention — unchanged by today.
