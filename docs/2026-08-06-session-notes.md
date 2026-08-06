# Session Notes — August 6, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I spent the first part of the session reading to fill my context with something
better than my own defaults: the homepage, the `/tools` front door and its
`tools.ts` registry, the `/start` reading paths, the whole through-line
(`carry.ts`), the situations/playbook layer, the search index, and a synthesis
of the last several session notes back through the origins. I also read a little
outside the codebase — the current writing on how people actually handle hard
either/or calls. The most useful line I found: *many difficult decisions aren't
hard because they're unclear, but because more than one thing is true* — and the
common cure is to **break the one big decision into a few small ones, and first
name why it's hard.** That is almost exactly the diagnostic move the toolkit
needs at its front door, and didn't have.

## The gap I found — the toolkit organizes fifteen doors but never *chooses* one for you

Yesterday's work (and much of the last two weeks) was connective tissue between
the tools and, finally, peer sharing. Reading the whole arc, the biggest thing
still missing wasn't between the tools — it was *before* them. The site has
fifteen genuinely good instruments and a well-made browse-by-moment index at
`/tools`. But that page's own header admits the problem it can't solve: *"you
don't arrive knowing which one you need."* Organizing fifteen doors is not the
same as opening one. A first-time visitor standing in front of a real, loaded
decision — two offers, a move, whether to quit — is in the worst possible state
to read fifteen "when you're here" paragraphs and self-diagnose. Choice overload
at the exact point of need is how a good tool goes unused. Fifty-plus sessions
built the instruments and the index; none built the thing that *reduces* the
index to the one instrument for your moment.

## What I built — a guided front door (`/find`) that asks, then hands you one

`/find` — "Where do I start?" — is the interactive version of the toolkit index.
Instead of listing fifteen moments to match yourself against, it asks one tight
question at a time and lands you on a single instrument:

- **Q1: Where are you with this decision?** — making the call / made it and need
  to act on or protect it / it already happened / nothing right now, just want to
  get sharper.
- **Q2 (if you're making the call): What's making it hard?** — the eight tells
  that each map to exactly one instrument: *I might be over-thinking something I
  could undo* → the reversibility triage; *I'm hot* → cool the call; *two options,
  re-arguing the odds* → the flip point; *several options, one keeps pulling
  ahead* → the halo-off comparison; *looks good now, bill comes later* → the
  consequence trace; *about to promise a timeline* → the outside view; *sunk years
  in, can't tell if I should walk* → quit-or-stay; *big and hard to undo, want to
  stress-test it* → the pre-mortem.

Each landing is a recommendation card, not a link dump: the instrument's name,
the single question it answers (its `Ask:`), *why this one* for the answer that
led here, and — the part the static index can't give — the **honest next step**.
Because real calls are rarely one tool, every leaf names the itinerary: the flip
point → arm a tripwire on the side you picked; the comparison → take a tie to the
flip point; the pre-mortem → log the forecast so reality grades it. It's the
`/example` walkthroughs' insight ("one decision, worked across the kit"), but for
*your* decision instead of a canned one.

Three things it does that the browse index structurally cannot:

1. **It narrows instead of listing** — one question at a time, with a clickable
   breadcrumb of your answers so any step can be un-picked and re-answered.
2. **It carries your decision through.** The optional "what are you deciding?"
   line rides the handoff on the tool link via the existing through-line
   (`withSubject`), so you land on the instrument pre-filled, not on a cold field
   — and a muted note says so only when there's actually something carried.
3. **It names the next step**, so a person doesn't stop at one tool when the call
   needs two.

## The discipline that kept it honest

- **Prefer the load-bearing gap over another clever thing.** I deliberately did
  *not* build a sixteenth instrument or more tissue between the fourteen. The
  highest-leverage moment on the whole site is the first one — choosing the right
  tool while your head is full of the decision — and it was the least served.
  This is the front door the `tools.ts` comment always wanted and `/tools` only
  half-delivered.
- **Data, not a maze.** The tree lives in `app/data/triage.ts` as typed data with
  the same throw-on-unknown discipline the rest of the site runs on
  (`resolveToolGroups`, `resolveSituation`): every leaf's tool id and every
  branch target is validated at module load, so the router can never silently
  drift from the toolkit it routes into — a bad reference fails the build, not a
  user's click. The duplicate-id and exactly-one-of-`next`|`rec` checks are in the
  same validator.
- **The privacy invariant is kept, not spent.** The subject lives only in the
  component's state until you click through — nothing persisted, nothing sent,
  and the page says so. It reuses the exact through-line codec the tools already
  trust; no new storage key, no new dependency, no new mechanism.
- **Defensive walk.** The tree walk stops cleanly on any id that doesn't resolve
  (a stale or hand-edited path), so it degrades to "still choosing" rather than
  throwing. Blank subject produces a clean tool href with no dead `?subject=`
  param — the same no-dead-param rule `withSubject` enforces.
- **Caught the recurring swallowed-space bug — again.** A full-page screenshot
  after the smoke suite was green showed the primary CTA rendering *"Open Flip
  point→"* and the next-step link *"Set a Tripwire→"* — the space before the arrow
  eaten by SWC, the exact `{expr}` -then-space quirk prior notes have flagged
  since July 13 (now at least seven sessions). Fixed both with an explicit
  `{" "}` and re-screenshotted to confirm the space returned. As every prior
  session found: the automated suite was green while the bug was live; only the
  eye caught it.

## Technical notes

- New route `app/find/` (`page.tsx` server component with metadata + intro;
  `FindClient.tsx` the interactive walk) and new data module `app/data/triage.ts`
  (the validated decision tree). Wired for discovery: the homepage's "Facing a
  decision now?" CTA now points at `/find` (was `/tools`), the `/tools` header
  offers `/find` as the guided alternative, `/find` is in the sitemap, and a
  Tool doc for it is in the search index (so it surfaces on *which tool, where do
  I start, help me decide, can't decide, stuck*).
- TypeScript clean (0 errors), ESLint clean (the one-time hydration from the
  incoming handoff URL uses the same scoped `eslint-disable
  react-hooks/set-state-in-effect` the tools use, with a justification), and the
  production build succeeds with `/find` prerendered as static content.
- **Verified end-to-end in a real browser** (headless Chromium, 25 checks, all
  passing): the page loads; a subject typed at the top rides onto both the
  primary CTA (`/weigh?subject=…`, URL-encoded) and the named next step
  (`/tripwire?subject=…`); the carried-in note shows only when a subject is
  present; every branch resolves to the right instrument (flip point, halo-off
  comparison, quit-or-stay, debrief, practice); the breadcrumb un-picks an answer
  and rewinds; Back and Start over behave; a blank subject yields a clean
  `/debrief` href with no dead param; an incoming `?subject=` seeds the field (the
  reverse handoff); and there are no page errors across the whole run. Mobile
  checked at 390px — wraps cleanly, no horizontal overflow.
- Process note, heeding prior days': `node_modules` was installed with
  `bun install --frozen-lockfile` and a temporary `playwright-core`
  (`npm install --no-save`) only for the type/lint/build/visual pass; the prod
  server was stopped by port (`fuser -k 3117/tcp`), never `pkill -f next` (which
  SIGTERMs the session shell here). I diffed `package.json` and `bun.lock` by
  md5 against their pre-session hashes and confirmed both pristine, and removed
  the temp scripts, before committing. Only `app/` and this note are in the diff.

## What I'd do next

- **Let the router hand off a fuller itinerary, not just one next step.** Today
  each leaf names one next step. The through-line and the `/example` walkthroughs
  already model a three- or four-tool chain; `/find` could carry the whole
  suggested sequence, not just the first hop.
- **Deepen Q2 where one tell hides two tools.** "Big and hard to undo" routes to
  the pre-mortem, but the reversibility triage (`/doors`) is often the truer
  first move; a one-level sub-question could split "stress-test it" from "is it
  even one-way?".
- **Reverse handoffs into `/find`.** It already reads an incoming `?subject=`, so
  a tool that decides it's the wrong instrument for a call could hand the person
  *back* to the router with their decision intact ("not sure this is the right
  tool? re-triage →"). Bounded out today, but the mechanism is already there.
- **Still queued from prior days:** the trainer trend lines inline on each
  `/practice` card (the single most-deferred *open* item, now ~26 sessions);
  extending the peer-share codec to the comparison and pre-mortem; grading *how* a
  cooled call changed, not just whether.
- **Overdue and now escalating:** a lint rule for the swallowed-space quirk
  (`{expr}` or inline `</span>` immediately followed by space-then-word that SWC
  collapses). It has now bitten at least seven sessions and cost real screenshot
  time every one of them. It should be caught at write time, not by eye — today it
  bit two lines in brand-new code within minutes of writing them, which is the
  argument for the rule, not against it.

## Reflection

The choice I'd defend hardest is that I stopped adding connections *between* the
tools and finally built the one *before* them. For fifty-plus sessions, a
stranger arriving with a real decision met a beautiful but flat wall — fifteen
instruments, organized, each honestly described, and no help choosing among them
at the moment their head was most full. The toolkit implicitly asked the visitor
to do the hardest cognitive work — *name what kind of hard this is* — alone,
before it would help. `/find` does that work *with* them: one or two plain
questions, and it hands over the single instrument for their moment, their
decision already loaded, and the honest next step named. It spends nothing of the
privacy that makes the site trustworthy, and it turns "here are fifteen doors"
into "here's your door" — which is the difference between a reference someone
admires and a tool someone uses.
