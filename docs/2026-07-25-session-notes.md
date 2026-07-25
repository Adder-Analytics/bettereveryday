# Session Notes — July 25, 2026

## What I set out to do

The standing directive holds: make the site genuinely useful to people — an
instrument, not a self-improvement lecture. As on every prior day, I read the
full arc of recent sessions and the live codebase before deciding what to build,
so the day's work answers a real gap in the thing that exists rather than adding
a clever thing that doesn't belong.

The site this morning: 36 essays, 28 mental models, the bookshelf and reading
notes, the reading paths at `/start`, two mature browse-by-moment routers (the
Playbook and the Toolkit), and a kit of twelve working instruments — the flip
point (`/weigh`), the multi-option compare tool (`/compare`), the outside view
(`/outside`), the quit-or-stay tool (`/quit`), the make-it-happen planner
(`/act`), the consequence trace (`/trace`), cool-the-call (`/cool`), the
pre-mortem room (`/premortem`), the decision journal (`/decide`), the backward
debrief (`/debrief`), the return desk (`/review`), and the trainers
(`/practice`).

(Housekeeping note for whoever reads this next: I opened on a stale base — my
branch had been reset to `main`, which sits a dozen commits behind the real head
of `origin/claude/zen-carson-mprh4v` where July 19–24's work — `/compare`,
`/outside`, `/debrief`, `/quit`, `/act` — actually lives. I restored the branch
to that head before starting, so today builds on the true latest state, not on
the month-old `main`. The merge at the end brings the whole arc into `main`.)

## The gap I found — the site kept promising a return it could only deliver from one room

I used the lens that's paid off all month: line the tools up against the *loop*
the whole site runs on — decide now, come back later on the day you set — and
look for where that loop silently breaks.

It broke in the same place, over and over, and I'd walked past it every session
because each tool looked complete on its own. A **tripwire** — Chip and Dan
Heath's brown-M&Ms detector, Annie Duke's kill criteria — is the site's own
recipe for the return: *a state and a date*, an observable signal you can't argue
with and a real day you're obligated to look, set now while you're calm. And the
toolkit had quietly grown so that **nearly every instrument ends by producing
one and then has nowhere to put it**:

- `/act` computes a *perfect* reconsider line — a `reconsiderState` and a
  `reconsiderDate`, already a tripwire — and could only tell you to go re-type it
  in `/premortem`.
- `/trace` surfaces the later cost that will sour a win — the exact thing a
  tripwire watches for — and linked you off to reconstruct it elsewhere.
- `/quit` *makes* you set a kill criterion (a state and a date) for anything you
  decide to keep going on, then handed it to a link.

The pre-mortem room was the only place a tripwire could actually enter the
return desk (`/review`), because `/review` only reads two stores: the journal's
reviews and the pre-mortem's checks. So the site's central promise — *a system
that brings you back at the right moment* — was silently broken everywhere except
the one room that owned the store. This is the "arm a tripwire from anywhere"
handoff that the last several sessions' notes kept queuing as the shared next
step for both `/quit` and `/act`; the fact that it was requested independently
from multiple tools was the tell that it wanted to be *one* generic instrument,
not a fourth per-tool patch.

And, exactly as every July session has turned on, the site's own reference
already prescribed it. The `tripwires` model spells out the whole spec — the
state-and-a-date recipe, "it belongs in a calendar, not a memory," the Everest
turnaround time that killed the man who set it because nothing outside his own
judgement enforced it, and "the check itself must end in a recorded answer —
fired, or all clear." A tool written into a model entry that had never been
built standalone.

## Why this was dangerous ground, and the discipline that kept it honest

A "set a reminder" tool wants to collapse into a **to-do list** or a **habit
tracker** — the generic productivity app the directive rules out. What separates
an honest tripwire from a reminder is the whole point, and it's all in the model:

- **A tripwire is not a task.** It's an *implementation intention pointed at
  reconsidering rather than doing* — the if-then reversed. It doesn't tell you to
  act; it watches for the signal that a call already made has started to go
  wrong, so it can't coast past the point it stopped being right.
- **The vague signal is the failure mode.** "If it isn't working we'll rethink"
  renegotiates itself every morning and has never fired. The tool's copy — and
  its placeholder — insist on a state a stranger could check ("under 25 paying
  users," not "if it isn't working").
- **The check must end in a recorded answer.** Fired, or all clear — like an
  aviation checklist demanding the actual status spoken back, never a bare
  "checked," because a reminder you swipe away is an acknowledgement, not a
  check. So the tool moves an answered tripwire out of "Armed" into "Answered"
  with its outcome on the record, and never lets a check quietly evaporate.

The reframe that fell out matches the shape the site keeps converging on: **the
useful output isn't a reminder, it's a decision turned into a signal-and-a-date
that runs without you and comes back on its day to one place you already look.**

## What I built

A new instrument: **Set a Tripwire** (`/tripwire`) — the standalone place any
tool hands a reconsider line to, and where the return desk sends you to answer
one.

The pieces:

1. **The store — `app/data/tripwires.ts`.** A standalone `tripwires:v1` store
   modelled exactly on `journal.ts` and `premortem.ts`: SSR-safe, degrades to
   `[]` on malformed or hand-edited JSON, a `mergeTripwire` normalizer, and a
   read side (`dueTripwireItems` / `upcomingTripwireItems` / `countDueTripwires`
   / `countTripwires` / `countTripwiresCreatedAfter`) that mirrors the
   pre-mortem's flattened `ScheduledCheck` shape so the desk can fold it in
   without special-casing. Write side: `armTripwire`, `answerTripwire`,
   `reopenTripwire`, `deleteTripwire` — one write path, silent-degrading.

2. **The tool — `/tripwire`** (server `page.tsx` + `TripwireClient.tsx`).
   Hydrate-once from storage on mount (the established pattern, no hydration
   mismatch). Three ways in, all through `window.location.search` read in an
   effect the same way `/premortem` reads its `?check=`:
   - Type one here — a form with a *guard* (what it protects), a *signal*
     (with the vague-signal warning), a *date* (min today), and an optional
     *failure*, plus a live "Reads as: If … by … , stop and reconsider" preview
     and a required-fields gate.
   - Arrive pre-filled from a tool via
     `?signal=…&on=…&guard=…&failure=…&from=/act`, with a "Handed over from …"
     note naming the source.
   - Land from the return desk via `?check=<id>` — scrolls to and glows the
     exact tripwire that's due, ready to answer.
   Armed tripwires list sorted by date, due ones accented, each with **It
   appeared — reconsider** / **All clear** answers, **Add to calendar** (an ICS
   download reusing the shared `data/ics.ts` plumbing — the model's "belongs in
   a calendar" made real), and Remove. Answered ones collapse into a section
   showing their outcome, re-armable. A **read-only worked example** behind a
   toggle ("nothing here is saved") rendered from the same `Tripwire` shape, so
   it can't drift.

3. **The loop closed — `/review` + the badge.** `review.ts` now folds standalone
   tripwires into the due/upcoming queue beside journal reviews and pre-mortem
   checks (a `tripwireToItem` mapper, `kind: "tripwire"`, deep-linking
   `/tripwire?check=<id>`), counts them in the backup nudge, and I added an
   `answerLabel` field to `ReviewItem` so the desk can say "Answer the tripwire →"
   for these, "Answer in the journal →" / "Answer in the room →" for the others
   (previously a two-way `kind` check that couldn't tell the two tripwire
   sources apart). The homepage `ReviewDueBadge` now includes
   `countDueTripwires()`, so a due tripwire chases you to the desk like every
   other open loop.

4. **The three handoffs — the whole reason it exists.**
   - `/act`: `assemblePlan` now exposes the reconsider tripwire's raw parts, and
     the deliverable shows **Arm it as a tripwire →** right beside the reconsider
     line (not gated behind a fully-complete plan — a verification finding: the
     tripwire is independent of the coping-plan's completeness), deep-linking the
     state, date, and decision.
   - `/trace`: the "Guard the effect you almost missed" onward step now
     deep-links **Set it as a tripwire**, pre-filling the first later-worse
     effect as the signal and the move as the guard.
   - `/quit`: the kill-criterion step now deep-links **arm it as a tripwire**,
     carrying the `killState` and `killDate`.

5. **Durability — `portable.ts`.** Added `tripwires:v1` to the `STORES` registry
   with a describe that counts armed vs answered, so backups actually include the
   new store (otherwise the backup nudge would count records it couldn't save).

6. **Discovery + single-source wiring.** `tools.ts`: a new `tripwire` tool,
   placed in the "You've made the call — now make it happen" group beside `/act`
   (together they close both ways a decision dies — never started, never
   revisited), with the group blurb updated to say so. `sitemap.ts`: `/tripwire`.
   `search`: a full tool doc. The `tripwires` model text: one sentence naming the
   standalone tool as where any tool's reconsider line lands.

### No new model, on purpose

The `tripwires` model already carried the entire idea — the state-and-a-date
recipe, the calendar, the recorded answer, the Everest cautionary tale, "an
implementation intention pointed at reconsidering." A duplicate would have broken
the single-source discipline the last week kept rewarding. I did the honest
thing: pointed the existing model at its new instrument, the way `/quit` and
`/act` already point their models at theirs.

## Technical notes

- One new route (`/tripwire`) — the build is now **67 static pages** (was 66).
  TypeScript clean (0 errors), ESLint clean (0 warnings) across every touched
  file. Zero new dependencies; everything computes locally and nothing leaves the
  browser. Store: `tripwires:v1`.
- Verified end-to-end in real Chromium (playwright-core against `next start`),
  **37 checks, zero uncaught page errors**: the page renders and the worked
  example is read-only; arm → the card appears with provenance and a due/ahead
  label → persists across reload → answer moves it to "Answered" with its outcome
  → re-arm returns it; it surfaces at `/review` labelled "Tripwire" with an
  "Answer the tripwire →" deep-link back, and the homepage badge counts it; the
  `?check=` deep-link focuses the right one; the pre-fill handoff fills signal +
  date + guard and shows the source note, then arms as upcoming; `/act`, `/trace`
  and `/quit` all render the correct pre-filled `/tripwire?…&from=…` deep-link
  (the `/act` one verified to sit by the reconsider line and carry the date); and
  `/tools` + `/search` both surface the new tool. playwright-core was installed
  against the pre-installed Chromium and is **not** committed
  (package.json/bun.lock reverted; the verify + screenshot scripts removed).
- One design fix caught in verification: the `/act` "arm as tripwire" link had
  initially lived only inside the fully-ready plan block, so a user who wrote a
  reconsider line but hadn't finished the coping plan couldn't hand it off. Moved
  it next to the reconsider line itself, where it's available whenever a
  reconsider tripwire exists.
- Process note, heeding prior days': stopped the dev server by port
  (`fuser -k 3111/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). The ESM verify scripts lived inside the project tree so they could
  resolve `playwright-core` from `node_modules`; the pre-installed Chromium is at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## What I'd do next

- **Carry the guard into `/quit`'s handoff.** `/quit` passes the kill state and
  date but not the *thing* it's about (the `VerdictBlock` sub-component doesn't
  receive it); threading `thing` through would let the guard pre-fill too, the
  way `/act` and `/trace` already carry theirs.
- **A `/premortem` → `/tripwire` bridge, or unify the stores.** The pre-mortem
  still owns its own tripwire store and answer flow; now that a standalone store
  exists, a pre-mortem's armed tripwire could optionally live in the same place,
  so the return desk reads one tripwire source instead of two. Worth weighing
  against the value of a tripwire staying attached to the failure analysis that
  produced it.
- **`/cool`'s wait verdict should arm a tripwire.** The cooling-off tool's most
  common verdict is "decide once you're cool" — that's a reconsider-on-a-date
  with no landing spot yet. The one remaining tool that ends on a return and
  doesn't hand it here.
- **A `/decide` → `/act` bridge** (still queued from Jul 24): the journal's
  first-move line is where `/act` begins.
- **The `need-an-estimate` situation still has no dedicated tool** (Jul 24): a
  Fermi-decomposition tool is the one honest candidate left, though the gap stays
  soft.
- **Still open from prior days:** the two-option `/compare`→`/weigh` bridge
  (Jul 20); the `/weigh` A/B mode (Jul 11); trainer pages showing their own trend
  (Jul 5).

## Reflection

The choice I'd defend hardest is treating this as *one* instrument rather than a
fourth per-tool patch. Three separate sessions had each ended by wishing their
tool could arm a tripwire that lands in the return desk — and the easy move each
time would have been to bolt a little tripwire-writer onto that one tool. What
made today worth a day was seeing that the same wish, arriving from three places,
was the site telling me the tripwire wanted to be a *place*, not a feature: a
standalone store the whole toolkit hands off to, so a reconsider line computed
anywhere comes back on its day to the one desk you already check.

The part I'm proudest of is that it makes an existing promise true instead of
adding a new one. The site has spent a month arguing that the useful move is
almost never "more willpower" but "one honest sentence, set down while you can
still think straight — and a system that brings you back at the right moment." It
had built the sentence, over and over, in tool after tool. Today it finally built
the system that brings you back — from everywhere, not just from the one room
that happened to own the filing cabinet.
