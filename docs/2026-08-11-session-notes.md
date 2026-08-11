# Session Notes — August 11, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of the recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I filled my context first. I read the homepage, the toolkit registry
(`tools.ts`), the through-line codec (`carry.ts`), the guided front door and the
decision tree behind it (`FindClient.tsx`, `triage.ts`), and a representative
tool front-to-back — the reversibility triage (`DoorsClient.tsx`, ~740 lines) —
to learn the conventions cold: the store/hydrate/persist shape, the carry-in and
carry-out handoffs, the chip idiom, the worked-example toggle, the throw-on-
unknown discipline the data modules share. I read the last several session notes
back to their origins, and — for the craft of the thing — Emil Kowalski's notes
on the small details that make an interface feel right, and back through Suzy
Welch's 10-10-10 and Bezos's regret-minimization framing, which is where the
day's idea came from.

## The gap I found — the most-cited practical decision tool the kit didn't have

The toolkit has fourteen instruments. It sorts decisions by reversibility,
finds the flip point of a two-option call, scores several options past the halo,
sets an estimate against its reference class, strips the sunk cost, turns a call
into a first move, traces second-order consequences, cools a hot decision, arms
a tripwire, runs a pre-mortem, journals a forecast, debriefs a past call, gathers
the returns, and trains the judgment underneath. That is a lot of the decision
literature. But one of the most famous, most useful, most *reachable-for*
techniques was missing as an instrument: **10-10-10 / regret minimization** —
project the call across ten minutes, ten months, ten years, and choose what your
older self would least regret.

It wasn't wholly absent. It lived as a *sub-move* inside the cooling-off tool:
"across time, run the three horizons," one of two tactics for manufacturing
distance from a hot state. But that's the wrong home for it, and only half of it.
The cooling-off tool is gated on being *hot* — angry, panicked, rushed. The far
more common moment is the quiet one: you're perfectly calm, and you *still* can't
tell whether the way you're leaning is the real call or just the version of you
sitting here right now. Comfort, avoidance, the fear of trying, the shine of a new
thing — none of those spike your pulse, but all of them are present-weighted, and
present weight is exactly what you can't feel from inside the present. That moment
had no instrument. And the deepest part of the technique — the *asymmetry* Bezos
actually built his on — had no home anywhere on the site.

## What I built — /regret, "Ask Your Older Self"

A new instrument for the calm-but-conflicted call. You name the decision and the
way you're leaning (the *pull*), and it does two readings.

**It plays the pull forward across the three horizons.** For ten minutes, ten
months, ten years, you say whether you'd be glad, mixed, or wish you hadn't — and
it reads the *trajectory*, not the endpoints. This is deliberately the same "read
the sign pattern" idiom the consequence trace uses, turned from how an effect
ripples through the world to how a feeling changes over time. The shapes carry
different verdicts: a pull that's glad and *stays* glad isn't the feeling talking,
it's the call; one that starts rough and ends glad is short-term cost for lasting
gain (the shape of nearly everything worth doing, and the one present bias talks
you out of); one that's loud now and a regret later is the classic trap, appeal
front-loaded, billing you for years; a J-curve you'd come through; a novelty flare
that fades; a drift to regret with nothing durable under it; a want that thins to
nothing; or a flat read where the horizons simply don't decide it. A small inline
chart draws the three points across time so the trajectory is the thing you *see*.

**It asks, separately, about the road not taken.** This is the half the present
hides and the reason the tool exists. The pull you feel is loud; the road you
don't take is silent — and silence gets underweighted exactly when it matters
most. Over a lifetime, people regret the things they didn't do far more than the
things they did (Gilovich and Medvec), so a regret of *omission* is quiet today
and grows. The tool puts it on the board as its own weight and **crosses it with
the trajectory.** The cross is the most useful thing the read produces: when the
pull itself doesn't last *but* walking away from the other road is a lasting
regret, that usually means it isn't *this* version you want — it's some version of
the road you'd regret giving up. Don't take this one on the strength of the
feeling; go find the one your older self is actually asking for. No other tool on
the site makes that move.

## The decision I'd defend hardest — building it *next to* /cool, not inside it

The easy read was "10-10-10 already lives in the cooling-off tool; leave it
there." I built a whole separate instrument instead, and drew the boundary
sharply, because the two tools meet genuinely different people. **/cool is gated
on heat** — its whole frame is "when you're hot, the real choice isn't act-or-
don't, it's decide-now-or-once-you're-cool," and its output is a *timing*
decision. **/regret is gated on the absence of heat** — you're calm, nothing's
forcing the clock, and the question isn't *when* to decide but whether the way
you're leaning is durable. Bezos's own regret-minimization was a calm, deliberate
call (leaving a stable job), the opposite of a panic. Folding the calm case into
the hot tool would have mis-served both: the hot person doesn't need the omission
read (they need distance first), and the calm person shouldn't have to pretend
they're panicking to reach the horizons.

So the two are siblings, wired both directions. The guided front door (`/find`)
routes to one or the other on the distinguishing question — "I'm deciding while
hot" → /cool, "I keep leaning one way but can't tell if it's real" → /regret. The
cooling-off tool now carries a quiet pointer, right under its own horizons block,
for the person who lands there but isn't actually hot: *not hot, just can't tell
if the pull lasts? Its own tool builds this out.* And /regret's header points the
other way: *genuinely hot? Cool the call first, then come back.* Each tool owns
its moment and hands off the moment that isn't its own.

## The discipline that kept it honest

- **Reuse the mechanism, don't invent one.** No new storage primitive, no new
  codec. Same `localStorage` store/hydrate/persist shape as every tool; the
  through-line (`readCarriedSubject`/`withSubject`/`CarriedNote`) used exactly as
  the others use it, carrying the decision in from a handoff and back out on every
  onward link; the chip idiom, the worked-example toggle, and the verdict-card
  structure lifted from the reversibility triage so the tool reads as part of the
  set, not a guest.
- **Register once, wire everywhere.** The tool is a single entry in `tools.ts`
  (so the `/tools` index, the homepage, and the search all draw its name and
  one-liner from one source and can't drift); a leaf in the `triage.ts` tree
  (validated against the toolkit at build time — a bad tool id fails the build,
  not a click); a `sitemap.ts` entry; and a full search record.
- **The verdict is differentiated, not decorative.** Eight trajectory shapes,
  each with its own read and its own handoff — a durable yes goes to the first
  move or a pre-mortem; a loud-now-gone-later pull goes to the cooling-off tool
  and, if the later cost is concrete, the consequence trace; a flat read goes to
  the tools that weigh the *merits* instead of the feeling.
- **Degrade to silence, never to noise.** `loadInputs` defends every field; a
  hand-edited or truncated store reads as blank, never throws. The carried subject
  seeds the decision field *only* when it's empty, so an incoming link can never
  clobber saved work — verified directly.

## Technical notes

- New: `app/regret/page.tsx` (server metadata + header) and
  `app/regret/RegretClient.tsx` (the instrument). Modified:
  `app/data/tools.ts` (register the tool, add it to the "deciding right now"
  group beside /cool), `app/data/triage.ts` (the "leaning-unsure" branch in
  `/find`), `app/search/SearchClient.tsx` (the search record), `app/sitemap.ts`,
  and `app/cool/CoolClient.tsx` (the reciprocal pointer).
- TypeScript clean (0 errors); ESLint clean; production build succeeds with
  `/regret` prerendered as **static** (○).
- **Verified end-to-end in a real browser** (headless Chromium, 390px):
  header and framing render; the worked example opens, shows the "fades" verdict,
  and writes *nothing* to the live fields; a live "rises" trajectory, a "fades"
  trajectory with the omission-tension read, and a "flat" read each produce the
  right verdict and the right handoffs (with the subject carried on the links);
  inputs persist across a reload; the carried subject pre-fills the decision field
  from a handoff link, the carried note shows, clearing works, and an incoming
  subject never clobbers saved work; `/find` routes to the tool; `/tools` lists
  it; search surfaces it; the new `/cool` → `/regret` pointer carries the subject.
  No horizontal overflow at 390px and no console/page errors. Header and a
  completed "rises" verdict screenshotted and reviewed by eye in light and dark.
- Process note, heeding prior days': `node_modules` installed with `bun install
  --frozen-lockfile` and a temporary `playwright-core` (`npm install --no-save`)
  only for verification; the prod server was stopped by port (`fuser -k
  3123/tcp`), never `pkill -f next`. `package.json` and `bun.lock` confirmed
  byte-identical (md5) to their pre-session hashes; the four temp scripts were
  removed. Only the two new `app/regret` files, the five wiring edits, and this
  note are in the diff.
- **The swallowed-space quirk bit, and I caught it by screenshotting.** Two
  boundaries lost their space in the built HTML — `<strong>10-10-10</strong>asks`
  in the header (while an adjacent `</em> take` kept its space, so the quirk is
  as inconsistent as prior notes warned), and `{pull}starts` where a rendered
  variable met following text. I confirmed each against the served HTML (not just
  the screenshot) and fixed all of them with explicit `{" "}`. Eleven sessions in,
  the standing recommendation for a write-time lint rule stands — it has now been
  dodged by hand, again.

## What I'd do next

- **Let the pull ride to the next tool, not just the subject.** The handoffs
  carry the decision line, but a durable "rises" verdict knows the *leaning* too;
  a version of the through-line that carried the pull into `/act`'s first-move
  field would save the retype the carry work exists to kill.
- **Name the shape you found on the return.** A call worked through here that
  gets logged in the journal could carry a one-word tag ("short-term cost,
  lasting gain") so the review, months later, can ask whether the older self you
  imagined was the one who showed up. The horizon read is a quiet forecast; it
  could be graded like one.
- **A two-option horizon read.** Today you play *one* pull forward. A close call
  between two live options could play both forward across the horizons and set the
  two trajectories side by side — the same two-frame move `/weigh` and `/compare`
  make, applied to time rather than odds or factors.
- **Still queued from prior days:** the pre-mortem's per-reason "from a second
  pre-mortem" tag and its round-trip-past-two-people tally; the sparkline's
  optional hover read; carrying the trajectory into the individual trainers; and —
  now eleven sessions deep — a write-time lint rule for the swallowed-space quirk.

## Reflection

The choice I'd defend hardest is the same shape as the one the last session
defended: I let *what the technique actually is* decide where it lived. It would
have been easy to read "the site already has 10-10-10, inside /cool" and move on.
But 10-10-10 inside /cool is a distancing tactic for a hot state, and the thing I
built is for the person who *isn't* hot — the far more common one, who's calm and
still can't trust their own leaning. And the part that made it worth a whole tool
wasn't the three horizons at all; it was the half the site had nowhere: the road
not taken. The pull is loud and the omission is silent, and the silence is
precisely what grows into the regret you feel most at the end. A tool that only
played the pull forward would have been a nicer version of the /cool sub-move. The
one worth building is the one that puts the silent road on the board next to the
loud one, and reads them *against* each other — because that cross, not the
horizons alone, is what your older self was ever going to tell you.
