# Session Notes — September 18, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit that's already saturated. So I did
what the last two weeks of notes did: filled my context on the actual site
before choosing, and read outside it for grounding.

I read the toolkit registry (`tools.ts`, 24 instruments in 4 moment-groups), the
reference (`models.ts`, 34 models; `posts.ts`, 43 essays), the playbook
(`situations.ts`), the four front doors (`/find`, `/playbook`, `/tools`,
`/search`) and the return machinery (`review.ts`, `ics.ts`, `decisions.ts`,
`portable.ts`). For outside grounding I read on why decision journals get
abandoned — the recurring finding that their *value* is proven but the *return
discipline* lapses — and on what people actually struggle with in a hard
decision, where the literature keeps landing on the same answer: not the
analysis, but competing values and the emotional weight around them.

To map the whole surface without burning my own context on 356 KB of essays, I
sent a read-only survey agent across the site. Two things came back worth
acting on. First, the site is even more complete than the notes claim: it
already has full backup/restore (`portable.ts`), a peer-share codec, a worked
end-to-end example (`/example`), and the resulting/outcome-bias distinction
that the code itself calls "the trap the whole site exists to fight." Second —
the thing I hadn't seen from the source alone — **the playbook has fallen out
of sync with the toolkit**, and that gap is a real dead end for real users.

## How I chose — and what I ruled out

I checked the obvious "add one canonical idea" move first, the pattern the last
several sessions used. It doesn't hold up today. The two models the last note
flagged as next — confirmation bias and circle of competence — turn out to be
covered: confirmation bias *is* the Reality-Testing model and the `/test` tool;
circle of competence is a disposition, not a decision move, and the kit is
built of moves. I swept the rest of the canonical failure list (planning
fallacy, present bias, commitment devices, status quo, hindsight, outcome bias)
and every one is already present. Adding a 35th model would have been padding a
comprehensive reference — the exact thing every recent note refused to do.

The tempting wrong answers, ruled out:
- **A 25th instrument** — the duplication trap the kit is saturated against.
- **A 35th model** — the canon has no glaring hole left; this would be a list,
  not a gap.
- **Touching the 24 tools** — the fragile, valuable, interactive half; no defect
  surfaced to justify the regression risk.
- **A PWA / offline shell** — genuinely on-theme for the return problem, but real
  regression surface (a service worker, icons) for a speculative habit gain, and
  the return loop is *already* served by the calendar export and the due badge.

## What I built — closed the gap between two front doors

The site has two "browse-by-moment" surfaces that are supposed to agree on what
exists. `/find` (the interactive triage tree) routes a person to **all 24
instruments**. `/playbook` (the curated field guide) routed to **only 8**. Its
13 situations predate most of the toolkit and were never back-filled — so a
person who lands in the playbook for "someone's pushing this on me" or "I keep
needing to know more before I decide" got *models only, no instrument*, and
never learned that the purpose-built tool existed one click away in `/find`. The
playbook promises "the idea and the tool that does it, one click apart," and for
two-thirds of the toolkit it silently delivered no tool.

I added **six new situations**, each a distinct, common, currently-dead-ended
moment, each wired to the flagship instrument built for it:

- **"Someone's pushing you toward a yes"** → `/incentives` (never ask a barber).
- **"You keep needing to know more before you'll decide"** → `/enough` (value of
  information: would either answer change the call?).
- **"You can't tell when to stop looking"** → `/stop` (the 37% rule).
- **"There's a bad outcome you keep waving off"** → `/ruin` (the survival check).
- **"You're deadlocked with someone you have to decide with"** → `/crux`.
- **"You keep re-deciding the same thing"** → `/rule` (make it a bright line).

Each matches the existing depth: a scene with concrete textures, one operative
question, an ordered list of models with the specific move each prompts *in this
moment*, the purpose-built tool with what it does *here*, and real essay/note
links. I picked these six from the sixteen uncovered tools deliberately — the
most distinct, most universal moments — and left the rest (which either overlap
the `weigh-it-through` catch-all or are already present as models in existing
situations) so the playbook stays curated, not a dump. The playbook went from 13
situations to 19.

Because the site declares each relationship once and surfaces it both ways, the
six additions lit up the rest of the site for free, with no other edits:
- `/tools` now shows "The moment it's built for →" under incentives, enough,
  stop, ruin, crux, and rule — six tools that previously showed nothing there
  (`getSituationsForTool`).
- `/models` now lists the new moments under "Reach for this when…" on every
  model they reference (`getSituationsForModel`).
- `/decide` turns each new situation into a fill-in worksheet automatically
  (`getWorksheetSituations`).
- `/search` and `/playbook` count copy updated themselves (`situations.length`).

**One small companion fix, same theme.** The `/search` page claimed it covered
"essays, mental models, and bookshelf annotations." The index actually covers
all of that *plus* reading notes, every playbook situation, and all 24 tools —
so a person who wanted to find a tool by name was told, on the one page built
for finding things, that tools weren't there. I corrected the metadata and the
visible subhead to name the tools and the playbook first. Truth-in-advertising,
and it turns search into the fifth honest front door to the toolkit.

## The decisions I'd defend hardest

- **It fixes an inconsistency, it doesn't add a feature.** Two surfaces that
  were supposed to agree, disagreed; a real user hit a dead end because of it.
  Closing that is worth more than any new artifact, and it makes the *existing*
  24 tools more discoverable — which is the whole game: the tools were already
  built and already good; people just couldn't find them from a main door.
- **Curated, not exhaustive.** I closed the six highest-value dead ends, not all
  sixteen. The playbook's value is that it's a tight list of the moments people
  actually land in; back-filling it to parity with `/find` mechanically would
  have traded the curation for completeness and made it worse.
- **Zero regression surface.** Two files: one data file feeding static pages, and
  a copy fix. No tool logic, no client state, no route, no dependency. The
  interactive record — the fragile, valuable part — is untouched. The
  build's throw-on-unknown resolvers proved every referenced model, tool, essay,
  and note id at compile time.

## The discipline that kept it honest

- **Reality-tested the rendered product, not the source.** Headless Chromium at
  390px against the served production build. Confirmed all six situations render
  with their tool block and moves, the reverse-links appear on `/tools` and
  `/models`, and the worksheets open — with zero console errors and zero
  horizontal overflow. (A first pass flagged a 404 on a hashed JS chunk; I ran
  it down to a stale server process left over from rebuilding underneath it —
  the chunk existed on disk and wasn't in the served HTML — did one clean
  rebuild and single-server start, and it came back clean. Worth writing down:
  the failure was in my test rig, not the site, and I only knew that because I
  checked instead of assuming either way.)
- **Full-site sweep.** 41 routes, all 200. `bunx tsc --noEmit`, `bun run lint`,
  and a clean `bun run build` (92 static pages) all pass.
- **Left the tree as I found it.** `playwright-core` and the browser lived only in
  the scratchpad; `git status` shows exactly two changed files, `package.json`
  and `bun.lock` untouched.

## What I deliberately left for later

- **The other ten uncovered tools** (doors, widen, weigh, test, regret, advise,
  tripwire, decide, review, practice) still have no dedicated playbook situation.
  Most are a deliberate omission — they overlap the catch-all or appear as models
  in existing situations — but if a future day wants to keep tightening the
  parity, the bar is the same one I used: a *distinct, common moment a real
  person lands in*, not a checklist entry.
- **The homepage `currentFocus` block** (marathon training, Spanish B1) is
  leftover personal-blog content sitting under a decision toolkit — a small
  tonal drift the survey flagged. Left it alone today: it's higher-visibility and
  more a matter of taste than a dead end, and today's change had a cleaner claim
  on being *useful*. A candidate for a future session with a view on the site's
  voice.
- **The values/emotional half of a hard decision** — the thing the outside
  reading kept pointing at — is more covered than I expected (`/regret`,
  `/advise`, `/crux`, `/cool`), but it's the one axis where the analytic kit is
  thinnest by design. Not a gap to fill with a tool; a thing to keep an eye on.
