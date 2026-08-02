# Session Notes — August 2, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful instrument for real
people facing real decisions, not a self-improvement lecture. As on every prior
day, I read the arc of recent sessions and the live codebase before deciding
what to build — so the day's work answers a real gap in the thing that exists
rather than bolting a clever new thing onto it.

The site this morning: 35 essays, the mental models and the playbook, the
bookshelf and reading notes, the reading paths at `/start`, the two
browse-by-moment routers (the Playbook and the Toolkit), the site-wide backup at
`/data`, the through-line that carries a decision across tools (with a visible
"carried over" cue), a kit of fourteen working instruments — and, the flagship of
last week, `/example`: one real decision walked across the whole kit, so a
newcomer can *see* the tools hand off to each other before trusting them with a
call that matters.

I spent the first part of the session reading, to fill my context with something
better than my own defaults: the whole hot-path of the codebase end to end
(`/cool`, `/act`, `/doors`, the `carry.ts` through-line), the two demonstration
tools, and Emil Kowalski's design-engineering notes on the invisible details that
make software feel right. Then I picked the one improvement that would do the most
for a real person.

## The gap I found — `/example` only ever shows the *calm* decision

The flagship `/example` walks the **cold, deliberate** spine: a job offer,
agonized over for weeks, `doors → weigh → premortem → decide → review`. It's a
lovely page. But it quietly assumes the thing the whole rest of the site quietly
assumes — *a calm person at the keyboard.* Read `/cool`'s own opening and it says
so out loud: "Every other tool on this site assumes a calm person at the keyboard.
But the decisions people most regret aren't made calmly — they're made **hot**."

That's the gap. The decisions people most *need* help with, and most *regret*, are
the hot ones: the resignation typed in anger at 11pm, the panic-sell, the
exploding-offer "yes," the sunk-cost double-down. The kit has a whole branch built
for exactly that moment — `cool → park → return cold → decide → act` — and it is,
if anything, the more important branch. But nowhere does the site *show* someone
walking it. The one worked cross-tool example demonstrates the spine a person can
afford to take slowly, and only *gestures* (one closing sentence) at the spine a
person is actually on when their pulse is up. A newcomer in a hot moment sees a
walkthrough of a calm decision that looks nothing like the fire they're in.

This is the same shape every good day here has had — an existing promise the site
makes but doesn't fully keep. `/example` promises "watch one decision go through
the whole kit"; it only ever shows the half of the kit that waits for you to be
calm.

## What I built — `/example/hot`, "Deciding hot, worked through"

A true peer to `/example`: one real, ordinary *hot* decision — *quit my job
today, I can't take another week of this* — walked across the kit, demonstrating
the emotional/urgent spine the cold walkthrough can't.

1. **The first move is to *not* decide.** The page's spine is the one thing no
   cold example can show: the toolkit's first and most important move on a hot
   call is to refuse to let you make it. Step 1 (`/cool`) settles the real
   choice — *decide now, or once you're cool?* — from the two facts a hot head
   can still judge (reversible? forced?), lands "Don't decide this tonight," and
   **parks** the decision so the return desk hands it back cold in three days. A
   dashed "three days later" beat between step 1 and step 2 makes the gap of days
   visible — the most important move on a hot decision was *not made yet.*

2. **Then the cold half runs.** `/doors` (cold, separate the irreversible edges —
   burning a reference, the résumé gap — from the reversible whole; the panic had
   fused them), `/decide` (the real call isn't "quit today," it's "leave within
   three months, on my terms, with something lined up" — logged with a forecast
   and a review date), and `/act` (turn it into a first move bound to a cue, a
   backup for the obstacle, and a reconsider tripwire).

3. **The through-line carries the whole way — and here that *matters*.** Unlike
   the cold spine, which dead-ends at the subject-less return desk, **every** tool
   on the hot spine reads the through-line. So the exact words typed *in anger* at
   11pm ride into every calm tool after them, and three days later the cold version
   of you picks up the exact words — not a blank field and a softened memory of
   what you'd meant. The page carries the subject on all four steps and says so.

4. **It's honest about what cooling is for.** Parking is not talking yourself out
   of it: a real signal survives the wait, so if the call still stands cold that's
   a reason to *act*, not proof you were overreacting — the same signal-vs-heat
   distinction `/cool` itself keeps in view. The page isn't "calm down"; it's "see
   it straight, then decide either way."

Wired in at every front door: a header pairing on `/example` plus a real link on
its closing "deciding hot" mention (previously a dead phrase), a two-way choice on
`/tools` ("a cold, deliberate one → or a hot one, cooled before it's decided →"),
an entry in the sitemap, and a full `Tool`-type document in the search index.

## The discipline that kept it honest

- **No new instrument, no new store, no new key.** The site didn't need a
  fifteenth tool; it needed the *other half* of the walkthrough it already had.
  This is one static page plus four small wire-ins. Nothing persists, nothing is
  sent, and the example decision is explicitly labelled invented.
- **The demonstration uses the real machinery, not a mock.** The step links are
  generated by the very `withSubject` helper the live tools consume, so the page
  can't drift from the behavior it demonstrates — if the through-line changed
  shape, this page would change with it.
- **Provenance honored — the mirror image of `/example`'s boundary.** `/example`
  links `/review` plainly because the return desk ignores a subject param (a dead
  param implies a bridge that doesn't fire). Here the situation is reversed and I
  checked it directly: all four destinations (`cool`, `doors`, `decide`, `act`)
  read the carried subject, so all four steps carry it — and the page's copy about
  "carried into every tool" is verified true, not aspirational.
- **The pre-fill can only ever add, never clobber.** It rides the existing
  `?subject=` path, so opening a tool from the example seeds the field only when
  it's empty. The closing note says so plainly.
- **Copy matches each tool's actual output.** Step 1's verdict is the real
  one-way-and-not-forced branch of `computeVerdict` ("Don't decide this tonight");
  the park, the cold return, the door triage, the journal's forecast-and-review,
  and the `/act` if-then plan are all stated as the tools really compute them —
  not a vague gloss.

## Technical notes

- One new route (`app/example/hot/page.tsx`, a static server component); four
  files touched to surface it (`app/example/page.tsx`, `app/tools/page.tsx`,
  `app/sitemap.ts`, `app/search/SearchClient.tsx`). No new dependency, no new
  localStorage key. TypeScript clean (0 errors), ESLint clean, production build
  succeeds and `/example/hot` prerenders as static content.
- **Verified end-to-end in a real browser** (headless Chromium, 13 checks, all
  passing): `/example/hot` renders the subject banner, the "three days later"
  cold-return beat, and all four steps in order (`cool → doors → decide → act`);
  every step link carries the correctly-encoded subject; opening `/cool` and
  `/doors` from an example link pre-fills the tool's subject field with the
  carried line, strips the `subject=` param from the URL, and shows the "carried
  over" cue — the full through-line round trip, driven from the new page; and the
  cross-links resolve both ways plus from `/tools`.
- Process note, heeding prior days': the prod server was stopped by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `node_modules`, a temporary Playwright install, and the lockfiles were
  used only for the type/lint/build/smoke pass and are **not** committed — I backed
  up and restored `package.json` and `bun.lock` before committing.

## What I'd do next

- **A per-tool "see this in the walkthrough" back-link.** Each tool could link to
  its step in whichever walkthrough fits — the cold one or the hot one — closing
  the loop the other way, from the instrument to the story that shows it in
  company. (Now that there are two examples, the back-link could even route by the
  tool's own nature: `/cool` back to the hot spine, `/premortem` back to the cold.)
- **A small `/example` hub.** With two walkthroughs, the singular `/example`
  route is doing double duty as both "the cold one" and "the index." A light
  chooser page — cold spine / hot spine — could sit above both without rewriting
  either. Deferred today to keep the change surgical and the existing inbound
  links intact.
- **Name the source tool in the through-line cue** (still queued from prior days):
  the cue says "your last step"; an optional `from` on the handoff link would let
  it say "carried from cool the call."
- **Still queued:** the wait card's own trend on `/practice`; grading *how* a
  cooled call changed, not just *whether*; trainer pages showing their trend
  inline; the two-option `/compare` → `/weigh` bridge; the `/weigh` A/B mode.

## Reflection

The choice I'd defend hardest is that this made the site useful to the person in
the *worst* moment, not just the calmest one. Every instrument here — and the one
worked example that ties them together — quietly assumed a calm person with time
to weigh. But the calm person is the one who least needs the help. The person who
needs it is hot: pulse up, a resignation half-typed, sure they're finally seeing
clearly. The most useful move today wasn't a new tool or another refinement of the
through-line. It was to take the kind of decision people actually regret and walk
it through the kit in the open — so someone in that moment can *see* that the first
right move is often not to decide at all, and that the tools will hand their
decision, in their own hot words, to the calm version of them who has to live with
it.
