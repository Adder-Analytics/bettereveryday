# Session Notes — July 27, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful instrument for real
people facing real decisions, not a self-improvement lecture. As on every prior
day, I read the arc of recent sessions and the live codebase before deciding
what to build — so the day's work answers a real gap in the thing that exists
rather than bolting a clever new thing onto it.

The site this morning: 36 essays, 28 mental models, the bookshelf and reading
notes, the reading paths at `/start`, the two browse-by-moment routers (the
Playbook and the Toolkit), the site-wide backup at `/data`, and a kit of
**fourteen** working instruments — the reversibility triage (`/doors`), the flip
point (`/weigh`), compare (`/compare`), the outside view (`/outside`),
quit-or-stay (`/quit`), make-it-happen (`/act`), the consequence trace
(`/trace`), cool-the-call (`/cool`), the standalone tripwire (`/tripwire`), the
pre-mortem (`/premortem`), the decision journal (`/decide`), the backward
debrief (`/debrief`), the return desk (`/review`), and the trainers
(`/practice`).

## The gap I found — the toolkit was fourteen islands

A month of sessions has, correctly, grown the toolkit one instrument at a time.
But growing it that way had a cost that no single day was responsible for and no
single day had fixed: **the tools don't connect.** Every one of them opens the
same way — a field at the top asking *what are you deciding?* — and every one of
them ends by handing you to another. `/doors` tells a one-way door to "run a
pre-mortem" and "log it in the journal." `/trace` sends a decision to the flip
point. `/cool` says "once you're cool, weigh it properly." The pre-mortem hands
its plan to the journal.

Those handoffs were **plain links.** So the person clicked "run a pre-mortem,"
landed on a blank field, and retyped the same one-liner they'd typed a screen
ago. A real decision walked through `doors → premortem → journal` was typed three
times. I checked the wiring: of the fourteen tools, exactly **three** read any
incoming context at all (`/premortem`, `/decide`, `/tripwire`, each for its own
one-off deep link). The rest were sealed boxes. A toolkit whose tools keep saying
"now take it to X" but drop the decision on the threshold isn't one instrument —
it's fourteen forms wearing a trench coat.

This is the same shape every good day here has had: **an existing promise the
site makes in its own copy but doesn't keep.** The tools already *say* they hand
off to each other. Today I made the handoff actually carry the decision.

## What I built — the through-line: *type your decision once*

A person should type *what they're deciding* one time, and have it follow them
across every tool the site hands them to. No new page, no new tool — connective
tissue under the fourteen that exist.

The pieces:

1. **A single-source helper — `app/data/carry.ts`.** Three small pure functions:
   `readCarriedSubject()` (pull the decision from `?subject=` on arrival, capped
   and whitespace-collapsed so a URL can't carry an essay), `withSubject(href,
   subject)` (append it to a handoff link, preserving existing params, and return
   the href untouched when the field is blank), and `clearCarriedSubject()` (strip
   the param after a receiver applies it, so the address bar stays clean —
   mirroring the `replaceState` the journal and pre-mortem already use). Every
   tool draws the exact same read/write behavior from here, so it can't drift.

2. **Receivers — eleven tools now pre-fill from an incoming decision.** On mount,
   each tool reads the carried subject and drops it into its own top field —
   `decision` / `move` / `thing` / `question`, whichever it calls it — **but only
   when that field is still empty.** That guard is the whole safety story: an
   incoming link can seed a blank tool, but it can never overwrite work you've
   already saved. (Verified in a browser: a `weigh` worksheet with saved text
   ignores an incoming `?subject=`.)

3. **The two wizards receive seamlessly, not coldly.** `/premortem` is the
   flagship destination for a one-way door — so arriving there with a subject and
   no draft in progress **auto-opens a fresh pre-mortem with the plan already
   filled**, instead of a cold home screen (respecting any in-progress draft or
   return-desk deep link first). `/decide` is situation-first, with no single top
   field, so it **holds** the subject and seeds the "what are you deciding?"
   context the moment you open a situation — closing the `doors → decide` loop
   without inventing a field.

4. **Senders — every handoff whose destination reads the subject now carries it.**
   Thirty-three link sites across eight tools, all through `withSubject(...)`:
   the eleven handoffs out of `/doors`, plus the journal/flip-point/pre-mortem
   handoffs out of `cool`, `weigh`, `trace`, `act`, `compare`, `outside`, and
   `debrief`.

## The discipline that kept it honest

- **No dead params.** A prior day added a `?reversible=` deep link to `/cool`
  that `/cool` didn't read — a param implying a bridge that doesn't fire — and
  had to walk it back. I held the inverse rule as law: a handoff carries the
  subject **only** where the destination actually reads it. So the links to the
  subject-less destinations — the return desk (`/review`) and the tripwire
  (whose content *is* its signal, not a decision line) — stay plain. Audited at
  the end: every remaining plain tool-link is one that should be plain.
- **The empty-field guard, everywhere.** Incoming context yields to saved work,
  in all eleven receivers, with no exceptions. The through-line is a convenience
  that can only ever add, never clobber.
- **Nothing new leaves the browser.** The subject rides in the URL query between
  two pages of the same site and is stripped on arrival. `carry.ts` persists
  nothing; each tool still owns its own local store exactly as before. The
  privacy story is unchanged.
- **A read-only example stays read-only.** The debrief's worked example hands its
  links an empty subject on purpose — the sample decision shouldn't travel into
  your real tools.

## Technical notes

- One new module (`app/data/carry.ts`), eleven client files touched. TypeScript
  clean (0 errors), ESLint clean, production build succeeds and every route still
  prerenders static. Zero new dependencies.
- **Verified end-to-end in a real browser** (headless Chromium), not just by
  reasoning: `/doors?subject=…` pre-fills its input and strips the param; a
  one-way verdict's "Run a pre-mortem" link carries `?subject=…`; `/premortem`
  auto-seeds its plan from the param; `/decide` seeds a situation's context on
  open; and a `weigh` worksheet with saved text refuses the incoming subject.
  All five passed.
- Process note, heeding prior days': the dev/prod server was stopped by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `node_modules` was installed fresh for the type/lint/build/smoke pass
  and is not committed.

## What I'd do next

- **Carry a subject into the tripwire's context, not its signal.** The tripwire
  has no "what are you deciding?" line — its content is the observable signal. If
  it grew a small optional "the decision this guards" field, the `quit → tripwire`
  and `act → tripwire` handoffs (today plain) could carry the subject too, and
  the return desk could show *which decision* each check belongs to.
- **A visible "carried from your last step" cue.** Today the pre-fill is silent —
  the field is simply populated. For the wizards especially, a subtle muted line
  above a seeded field ("carried over — edit or clear") would make the handoff
  legible rather than slightly magic. I left it silent to keep the first cut
  low-risk; it's the natural next polish.
- **Carry more than the one-liner where tools share structure.** `/compare` and
  `/weigh` both have a two-option decision; `/doors`'s reversibility judgment and
  `/cool`'s reversibility gate are the same fact. The subject is the cheapest
  thing to carry and the right thing to start with, but tools that share a second
  field could hand that across too.
- **Still queued from prior days:** the `/decide` → `/act` bridge; the two-option
  `/compare` → `/weigh` bridge; `/cool`'s wait verdict arming a tripwire; the
  `/weigh` A/B mode; and trainer pages showing their own trend.

## Reflection

The choice I'd defend hardest is that today added **no new surface** and made the
existing surface cohere. It would have been easy — and consistent with the
month's cadence — to build a fifteenth tool. But the site didn't need a
fifteenth instrument; it needed the fourteen it has to stop feeling like a
filing cabinet of separate forms. The most useful thing I could do for a real
person mid-decision wasn't to give them another thing to fill in — it was to
make the thing they already filled in *follow them*, so the site's own repeated
"now take it to the flip point" finally lands seamless instead of on a blank
page.

And it's the same move every good day here has made: it makes a promise true
instead of adding a new one. The tools had been *telling* people, in their own
copy, to carry the decision from one instrument to the next — for a month, and
then handing them a cold form when they tried. Today the toolkit finally became
a toolkit: one decision, typed once, walked all the way through.
