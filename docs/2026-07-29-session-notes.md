# Session Notes — July 29, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful instrument for real
people facing real decisions, not a self-improvement lecture. As on every prior
day, I read the arc of recent sessions and the live codebase before deciding
what to build — so the day's work answers a real gap in the thing that exists
rather than bolting a clever new thing onto it.

The site this morning: 36 essays, 28 mental models, the bookshelf and reading
notes, the reading paths at `/start`, the two browse-by-moment routers (the
Playbook and the Toolkit), the site-wide backup at `/data`, the through-line
that carries a decision across tools, and a kit of **fourteen** working
instruments — the reversibility triage (`/doors`), the flip point (`/weigh`),
compare (`/compare`), the outside view (`/outside`), quit-or-stay (`/quit`),
make-it-happen (`/act`), the consequence trace (`/trace`), cool-the-call
(`/cool`), the standalone tripwire (`/tripwire`), the pre-mortem (`/premortem`),
the decision journal (`/decide`), the backward debrief (`/debrief`), the return
desk (`/review`), and the trainers (`/practice`).

## The gap I found — the cooling-off tool makes a claim it never checks

Yesterday the cooling-off tool (`/cool`) finally learned to *bring you back*: a
wait verdict can park the decision, the return desk hands it back cold on its
day, and a `?resume=` link reopens it. That closed the loop the tool had been
leaving open for a month.

But it left the tool's own *premise* untested. The entire case for `/cool` — the
essay it's built for, "You Give Better Advice Than You Take" — is a **bet**:
that the calm version of you makes a better call than the hot one, so on a
reversible decision with no real clock, waiting is nearly free and worth it.
The tool asks people to make that bet dozens of times. It had never once told
them whether the bet paid off. A person who parks five decisions and decides
them all cold has, sitting in their browser, the exact data that answers *does
sleeping on it actually change my mind?* — and the tool threw it away. On the
cold return, "I've decided it" just cleared the record. Whether cooling had
moved the call or left it identical — the one fact worth keeping — was never
asked, so it was never known.

This is the same shape every good day here has had: **an existing promise the
site makes in its own copy but doesn't keep.** The tool's whole reason to exist
is a claim about waiting; today I made the tool keep the receipts on that claim,
and read them back.

There was a second, smaller gap that belonged to the same tool: `/cool` couldn't
show you its own parked decisions. The tripwire page lists its armed set; the
cooling-off tool listed nothing. To find what you'd parked you had to go to the
return desk. Both gaps were the tool lacking self-awareness — of what it's
holding, and of what it has taught — and both were on yesterday's "what I'd do
next." I built them as one coherent thing.

## What I built — grade the wait, and read the record back

1. **The wait grade (`WaitGrade` on the parked store).** A parked decision now
   carries one more field, `cooledMatch`: `"same"` (cold, you'd make the same
   call — the heat wasn't talking), `"changed"` (waiting moved you), or `""`
   (resolved without saying). It's normalized defensively like every other field
   in `mergeParked`, so older or hand-edited JSON degrades to `""` instead of
   throwing, and it rides in the same full-backup bundle as the rest — nothing
   new leaves the browser.

2. **The cold return got a middle beat.** It used to be two states (read the
   call, then "marked decided"). Now it's three: read it again → **grade whether
   cooling changed it** → close. The grade step asks one question, "now that
   you're cold, is it the same call you'd have made hot?", with two buttons
   (*Same call — the heat wasn't talking* / *Different — cooling changed it*) and
   a plain **Skip — just clear it** so grading is never forced. The confirmation
   then adapts: a "changed" call gets *good thing you waited*; a "same" call gets
   *the heat wasn't talking after all — worth knowing for sure instead of
   guessing*; a skip gets the old neutral close. Either way the existing handoffs
   to `/weigh` and `/decide` carry the decision onward.

3. **A "Your cooling-off record" panel on `/cool` itself.** It renders only when
   there's something true to say, and says two:
   - **What the tool is holding for you** — every parked decision still waiting to
     be decided cold, soonest-return first, each with its return date (or a *due
     now* flag in accent) and a "Decide it cold →" link straight into the resume
     flow. You can now manage your parked set without a trip to the return desk.
   - **What the wait has taught** — once you've graded a few returns, one plain
     line: *"Across the 3 calls you've decided cold, sleeping on it changed the
     call 2 times and left it the same once — about 67% of the time, the wait
     moved the answer. That's the share of hot calls you'd have gotten wrong on
     the spot."* The copy has three honest branches (none changed / all changed /
     mixed) and never editorializes past what the counts support — when the graded
     set is still small, it says so.

## The discipline that kept it honest

- **The tool's premise, measured, not asserted.** The reading is drawn only from
  the calls *you* graded — it's your record, not a maxim. When you've changed
  none, it says the calm you keeps agreeing with the hot you (and flags that your
  gut may run cooler than it feels, or the set is just small). It refuses to
  claim waiting works when your own data doesn't show it.
- **Grading is optional, always.** "Skip — just clear it" resolves the decision
  with an empty grade. The tool never blocks you from closing a loop just because
  it wants a data point.
- **No new store, no new surface.** One field on the existing parked record; the
  panel lives on the tool that generates the data. The site didn't need a
  fifteenth instrument — it needed the fourteenth to notice what it already knew.
- **Nothing new leaves the browser.** The grade is one more field in a store
  already covered by export/restore. The privacy story is unchanged.
- **Reopen resets the grade.** `reopenParked` now clears `cooledMatch` too — a
  decision sent back to waiting isn't decided anymore, so it can't keep a stale
  verdict.

## Technical notes

- Two files touched (`app/data/parked.ts`, `app/cool/CoolClient.tsx`); no new
  module, no new dependency, no new localStorage key. TypeScript clean (0
  errors), ESLint clean, production build succeeds and `/cool` still prerenders
  static.
- **Verified end-to-end in a real browser** (headless Chromium), 22/22 checks:
  the cold return walks read → grade → done; grading "changed"/"same"/skip each
  writes the right `cooledMatch` and resolves the record; the record panel lists
  waiting decisions with the correct *due now* / *back <date>* state and resume
  links; and the wait reading renders the right branch and percentage for
  none-changed, all-changed, and mixed graded sets, and the whole panel stays
  hidden when there's no parked history.
- A polish the browser test surfaced: my new copy strings used straight
  apostrophes while the whole site uses curly ones. Fixed the confirmation and
  reading strings to curly `’` for typographic consistency.
- Process note, heeding prior days': the prod server was stopped by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `node_modules` was installed fresh for the type/lint/build/smoke pass
  and is not committed.

## What I'd do next

- **Surface the wait record beyond `/cool`.** The "does sleeping on it change my
  mind?" number is a genuine personal insight; it could sit alongside the
  journal's calibration reading on `/practice`, so the site's one place for
  "what your record says about you" holds both the forecast gap and the wait
  payoff.
- **Grade *how* it changed, not just *whether*.** Right now "changed" is binary.
  A future cut could ask whether cooling talked you *out* of acting or *into* a
  different action — the two are different lessons about your hot state.
- **A visible "carried from your last step" cue** (still queued from prior days):
  the through-line pre-fill is silent; a muted line above a seeded field would
  make it legible rather than slightly magic.
- **Still queued:** trainer pages showing their own trend; the two-option
  `/compare` → `/weigh` bridge; the `/weigh` A/B mode.

## Reflection

The choice I'd defend hardest is that this makes the tool *accountable to its own
claim* rather than adding a new claim. `/cool` spends its whole surface arguing
that the calm call beats the hot one — and for a month it asked people to act on
that argument without ever checking, on their own decisions, whether it held.
The most useful thing I could do wasn't a fifteenth instrument; it was to let the
one tool built on an empirical bet finally settle that bet with the user's own
data. If your record says waiting changes two calls in three, that's a reason to
keep parking. If it says waiting has never once moved you, that's worth knowing
too — and the honest tool tells you either way.
