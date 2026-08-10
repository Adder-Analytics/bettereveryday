# Session Notes — August 10, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of the recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I read to fill my context first. Beyond the codebase — the homepage, the toolkit
registry (`tools.ts`), the peer-share codec (`share.ts`), and the whole
pre-mortem stack (`premortem.ts`, `PremortemClient.tsx`, ~1900 lines) — I read
outside my own defaults for craft: Emil Kowalski's design-engineering notes on
the unseen details that make an interface feel right, and back through Gary
Klein's own framing of the pre-mortem as a *group* exercise. I read the last
several session notes to the origins, looking for the load-bearing gap, not the
next clever handoff.

## The gap I found — the loop the last session opened but couldn't close

Yesterday's build made a pre-mortem's *setup* shareable: a link that hands
someone the plan and the date and deliberately withholds your reasons, so they
imagine the failure independently in their own browser. Its own closing note
named the missing half in plain words: *"Pool the pre-mortems… a 'hand it back'
return link… would close Klein's loop completely: imagine alone, then pool."*

That is the true shape of the technique. Klein's pre-mortem is not a solo
worksheet that happens to be shareable — it is a room: each person imagines the
plan already dead, alone, then the room **pools** what each saw that the others
didn't. The site had been a careful substitute for that room (the "walk the
perimeter" lenses stand in for colleagues you don't have). Yesterday restored
the first half across distance — *imagine alone.* The second half — *then pool* —
still had nowhere to land. The second person's failures lived in their browser
and never came back. So of everything I could build, this was the one that
finishes a method the site was already three-quarters of the way through, rather
than starting a new one.

## What I built — hand the failures back, and pool them in

A pre-mortem you were **handed** (not one you framed yourself) now offers to
**send your failures back**. It encodes just your failure list into the same
fragment-only, sent-nowhere link, tagged distinctly (`premortem-pool`) so a setup
link and a return link can never be misread for one another. The original author
opens it and gets a **"a second pre-mortem came back"** card: pool the returned
failures into their saved plan and they land in a **triage** flow — each returned
cause waiting to become a plan change, a tripwire, or an accepted risk, exactly
as their own did. A match **replaces the original in place** (same id, so the
journal link and creation date survive) — no duplicate; a plan they don't have
saved becomes a fresh pre-mortem seeded with the returned causes.

The provenance that gates the "hand it back" affordance is a single new field,
`receivedShare`, defaulted defensively in `mergePremortem` so records saved
before pooling existed load as not-received. Only a pre-mortem you were *given*
to run offers to hand its failures back; your own originals don't, so the
author never sees "send back" on the plan they authored.

## The decision I'd defend hardest — the mirror-image omission

Yesterday's build withheld the *reasons* on the way out, because handing someone
your finished list anchors them onto it and they never surface the seventh cause
only they can see. This build makes the exact opposite omission, and it is the
heart of the design: **the triage does not ride back.**

The return carries the second person's failure list and *not* what they'd do
about each. A returned "accept it" or "change the plan" would be a guess about a
plan the author owns and the returner doesn't — it would anchor the author's own
call the same way an unseen list would have anchored the returner's. So each
direction carries exactly what the other person is *for* — a fresh list one way,
the author's own decision the other — and neither carries the part that would
quietly make a judgment for someone it doesn't belong to. The setup withholds the
reasons; the return withholds the response. Symmetric, and both in service of the
same thing: independent judgment, pooled only after it's formed. The UI says this
in plain words on both cards, so the discipline reads as a feature.

## The discipline that kept it honest

- **Reuse the mechanism, don't invent one.** No new codec, no new storage
  primitive, nothing new persisted. `encodeShare`/`readShare`/`clearShare` are
  used exactly as the setup share uses them, under a second tool tag; the
  receiving card mirrors the setup-share's adopted-vs-pending branch.
- **Never clobber, and never silently mutate.** A returned list never merges
  itself on open — it waits as a card behind an explicit "pool them in." Pooling
  into a matched plan *adds* de-duped reasons and touches none of the existing
  triage. If a draft is in progress, the card says plainly that opening replaces
  it (the same honesty the setup share uses).
- **Degrade to silence, never to noise.** `coercePoolReturn` is defensive
  throughout: a truncated, hand-edited, or hostile fragment reads as "nothing
  pooled," never a throw. Reasons are capped in length and count so a link stays
  a link; duplicates are dropped by a normalized key.
- **Offered only where it makes sense.** "Hand it back" appears only on a
  received pre-mortem, never on the read-only sample or a plan you authored.

## Technical notes

- `app/data/premortem.ts`: one new field, `receivedShare: boolean`, with a
  defensive default in `mergePremortem` and on the sample.
- `app/premortem/PremortemClient.tsx`: the pool-return helpers (`reasonKey`,
  `poolReturnPayload`, `coercePoolReturn`), the mount-effect branch that reads a
  returned list and matches it to a saved plan, `copyReturnLink`, `poolReturnIn`
  (the merge → triage flow), `finish` extended to replace-in-place when pooling
  and to record `receivedShare`, the pending-return home card, the pooled banner
  on the triage and failure steps, and the "hand it back" card in `PremortemView`.
- TypeScript clean (0 errors); ESLint clean across the whole project; production
  build succeeds with `/premortem` still prerendered as **static**.
- **Verified end-to-end in a real browser** (headless Chromium): **28/28 checks.**
  Author shares a setup link; a fresh receiver imagines independently (their view
  confirms none of the author's reasons are present) and gets "hand it back"; the
  author opens the return, sees the match, pools, triages, and saves — one merged
  pre-mortem, no duplicate, the author's original reason and triage preserved. The
  no-match path seeds a fresh pre-mortem on the returned plan (crystal ball shown,
  failures pre-listed). A garbage fragment neither crashes nor adopts. Checked at
  390px in dark mode: no horizontal overflow, no page errors. The "hand it back"
  and "second pre-mortem came back" cards were screenshotted and reviewed by eye
  in dark mode.
- Process note, heeding prior days': `node_modules` installed with `bun install
  --frozen-lockfile` and a temporary `playwright-core` (`npm install --no-save`)
  only for verification; the prod server was stopped by port (`fuser -k
  3123/tcp`), never `pkill -f next` (which SIGTERMs the session shell here).
  `package.json` and `bun.lock` confirmed byte-identical (md5) to their
  pre-session hashes; the two temp scripts were removed. Only the two `app/` files
  and this note are in the diff.
- **The swallowed-space quirk did not bite** — every new inline break in the
  banners and cards was written as an explicit `{" "}` from the start, and I
  screenshotted to confirm. The standing recommendation for a write-time lint
  rule still stands; it has now been dodged by hand, not removed, for ten
  sessions.

## What I'd do next

- **Show the author which reasons are new.** Pooling lands the returned causes at
  the end of the triage list, and the banner counts them, but they aren't
  individually marked. A per-reason "from a second pre-mortem" tag would make the
  ones needing a decision unmistakable — the honest cue the "carried over" note
  set the pattern for. (It needs care: the author can add their own reasons and
  reorder the list, so the tag has to travel with the reason, not an index.)
- **Round-trip past two people.** Today's loop is author → one returner → author.
  Klein's room is many. The mechanism already supports it — the author pools each
  returned link one at a time — but there's no view of *who* contributed what, and
  no signal that three returns are still outstanding. A lightweight tally would
  make a real group pre-mortem legible.
- **Carry a pooled tripwire straight to `/quit` or the return desk** via the
  existing through-line (`carry.ts`), so a failure a second person surfaced can
  arm a check without retyping.
- **Still queued from prior days:** the sparkline's optional hover read; carrying
  the trajectory into the individual trainers; grading *how* a cooled call
  changed; and — now ten sessions deep — a write-time lint rule for the
  swallowed-space quirk.

## Reflection

The choice I'd defend hardest is that I let *what the technique is* decide what to
build. It would have been easy to read "pooling" as "let the author see the
returned pre-mortem" — a read-only view of someone else's finished worksheet. But
that isn't Klein's method; it's a report. The method is that the second person's
failures become **decisions on the author's plan** — triaged by the author, in
the author's own frame, the same as the ones they imagined themselves. So pooling
had to land in the triage flow, not a viewer, and the return had to carry the
failures without the responses, because the response is the author's to make.
Restoring the room across distance meant getting *both* omissions right: withhold
the reasons going out so the second person thinks for themselves, withhold the
triage coming back so the author does. Each person is protected from the other's
anchor, in exactly the direction that would have spent it — and what's left, on
both ends, is the only thing a second person in a pre-mortem was ever for.
