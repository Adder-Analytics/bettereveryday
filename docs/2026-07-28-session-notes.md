# Session Notes — July 28, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful instrument for real
people facing real decisions, not a self-improvement lecture. As on every prior
day, I read the arc of recent sessions and the live codebase before deciding
what to build — so the day's work answers a real gap in the thing that exists
rather than bolting a clever new thing onto it.

The site this morning: 36 essays, 28 mental models, the bookshelf and reading
notes, the reading paths at `/start`, the two browse-by-moment routers (the
Playbook and the Toolkit), the site-wide backup at `/data`, the through-line
that carries a decision across tools (built two days ago), and a kit of
**fourteen** working instruments — the reversibility triage (`/doors`), the flip
point (`/weigh`), compare (`/compare`), the outside view (`/outside`),
quit-or-stay (`/quit`), make-it-happen (`/act`), the consequence trace
(`/trace`), cool-the-call (`/cool`), the standalone tripwire (`/tripwire`), the
pre-mortem (`/premortem`), the decision journal (`/decide`), the backward
debrief (`/debrief`), the return desk (`/review`), and the trainers
(`/practice`).

## The gap I found — the cooling-off tool tells you to come back, and can't bring you back

I used the lens that's paid off all month: line each tool up against the promise
its own copy makes, and find one it doesn't keep.

`/cool` is the tool for the person deciding hot. Its most common verdict — for a
reversible call with no real external clock — is **"Sleep on it."** The copy is
unambiguous about what happens next:

> "Close this and come back to it cold; if it still looks the same tomorrow, it
> wasn't the heat talking."

And the handoff at the bottom leaned on the same idea: *"This page keeps what you
wrote, so a decision you slept on is still here when you come back cold."*

But keeping the draft on the page is not the same as bringing the person back.
The entire "come back to it cold" promise rested on the user **remembering, days
later and unprompted, to reopen a browser tab** — which is exactly the thing the
site built a whole return desk (`/review`) to replace. Every other dated
commitment on the site — a logged forecast, an armed tripwire — comes back to you
on its day at the desk. The cooling-off tool, whose defining output *is* a
deferral, was the one that scheduled nothing. A hot decision slept on and never
returned to isn't cooled; it's abandoned, and the heat wins by default.

This is the same shape every good day here has had: an existing promise the site
makes in its own copy but doesn't keep.

## Why a parked decision is a *third* kind of return, not a tripwire

The tempting shortcut was to reuse the tripwire store — it already lands on the
return desk. I didn't, because it would have been a category error the site's own
discipline warns against. A tripwire is *a signal you set while calm, guarding a
decision you've already made.* A cooling-off deferral is the exact inverse: *you
are not calm, and you have not decided.* Forcing one into the other would have put
"watch for a bad signal" machinery in service of "come back and finish deciding,"
and a careful future session would rightly walk it back.

So a parked decision earns its own small store. The return desk now holds three
genuinely different returns, and I made the distinction explicit in its code and
copy:

- a **forecast** reality has settled, which you grade (the journal),
- a **signal** you watch for (the tripwires), and
- an **appointment to finish deciding** a call you deferred (this).

## What I built — "park it, and it comes back cold"

1. **A new store — `app/data/parked.ts`.** It mirrors `tripwires.ts` line for
   line: a single source for the parked list, defensive normalization so
   hand-edited or older JSON degrades to a safe value instead of throwing, and a
   flattened read side for the desk. A `Parked` record holds the decision, the
   feeling it was parked under, an optional note to your cold self, the verdict
   at park time, and the two dates (parked / decide-on). Nothing leaves the
   browser; it rides in the same full-backup bundle as every other store.

2. **`/cool` gained a park control — but only on a "wait" verdict.** When the call
   is *sleep on it* or *don't decide this tonight*, a panel appears: pick when to
   come back (Tomorrow / In 3 days / In a week / any date), leave an optional note,
   and park it. It deliberately does **not** appear on the decide-now verdict
   (`reversible-go`) or the forced one-way case — parking a genuinely
   clock-bound call to tomorrow would be advice that misses the window.

3. **The return desk folds it in.** A parked decision shows at `/review` on its
   day — labeled *Cooling-off*, titled with the decision, with "Decide it now →"
   — and it feeds the homepage due badge and the backup nudge alongside reviews
   and tripwires.

4. **The cold return closes the loop.** The desk link is `/cool?resume=<id>`. On
   arrival, the tool reopens the exact decision cold: a banner ("You're back — and
   cold") reminds you when and how hot you parked it, pre-fills the field, and
   offers one button — "I've decided it — clear it from my desk" — that resolves
   the record so it leaves the queue. From there the existing handoffs to `/weigh`
   and `/decide` carry the decision onward.

5. **A calendar option too.** Because a person about to sleep on it is about to
   *close the tab*, the confirmation also offers an all-day `.ics` reminder
   (built on the shared `ics.ts` plumbing), so the return can live in the calendar
   they actually look at — not only on a page they have to remember to open.

## The discipline that kept it honest

- **No forced fit.** The parked return got its own store rather than being
  crammed into the tripwire's inverse semantics. Reuse where it's true; a new
  small store where the shape genuinely differs.
- **Only where the verdict actually says wait.** The park control is gated on the
  two hold verdicts, so the site never offers to defer a call it just told you to
  make now.
- **The empty-field guard is preserved.** A resume link pre-fills the decision
  only when the tool's own field is still blank — incoming context can seed a
  blank tool, never clobber saved work. The same rule the through-line keeps.
- **Nothing new leaves the browser.** One new localStorage key, in the backup
  registry so it's covered by export/restore. The privacy story is unchanged.

## Technical notes

- One new module (`app/data/parked.ts`); four files touched (`CoolClient`,
  `review.ts`, `portable.ts`, `ReviewDueBadge`). TypeScript clean (0 errors),
  ESLint clean, production build succeeds and `/cool` and `/review` still
  prerender static. Zero new dependencies.
- **Verified end-to-end in a real browser** (headless Chromium), 18/18 checks:
  the wait verdict shows the park control and the decide-now verdict doesn't; a
  park writes the right record (decision, note, +N-day date, unresolved); the
  desk shows it labeled *Cooling-off* with the answer link; `?resume=` reopens it
  cold with the banner and pre-filled decision; and "I've decided it" resolves it
  and removes it from the desk.
- Process note, heeding prior days': the prod server was stopped by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `node_modules` was installed fresh for the type/lint/build/smoke pass
  and is not committed.

## What I'd do next

- **A parked-decision count on the cooling-off tool itself.** `/cool` doesn't yet
  show "you have 2 decisions parked, 1 due" the way `/tripwire` lists its armed
  set. A small "waiting to be decided cold" list on the page would let someone
  manage them without going to the desk.
- **Let the cold return grade the wait.** When you resolve a parked decision, the
  site could quietly note whether the cooled call matched the hot one — the
  beginnings of a personal answer to "does sleeping on it actually change my
  mind?", which is the empirical question the whole tool rests on.
- **A visible "carried from your last step" cue** (still queued from prior days):
  the through-line pre-fill is silent; a muted line above a seeded field would
  make it legible rather than slightly magic.
- **Still queued:** trainer pages showing their own trend; the two-option
  `/compare` → `/weigh` bridge; the `/weigh` A/B mode.

## Reflection

The choice I'd defend hardest is that this closes a loop rather than opening a
new one. It would have been easy to reach for the tripwire store and ship a
plainer thing today — but the parked return is honestly a different animal, and
naming it as a third kind of return (grade a forecast, watch a signal, finish
deciding) made the return desk *more* coherent, not more cluttered. And it's the
same move every good day here has made: the cooling-off tool had been telling
people, in its own words, to "come back to it cold" — for a month, while
scheduling nothing to bring them back. Today the one tool whose entire job is
deferral finally learned how to keep the appointment it was asking people to make.
