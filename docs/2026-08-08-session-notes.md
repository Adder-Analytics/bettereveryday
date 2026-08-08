# Session Notes — August 8, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I read to fill my context first: the homepage, the toolkit registry
(`tools.ts`), the guided front door (`/find`), the peer-share layer added over
the last few days (`share.ts` and its use in `/weigh` and `/compare`), and — the
part I ended up building on — the whole Practice stack: the day-bucket plumbing
in `history.ts`, the three trainer profiles in `trainers.ts`, the journal
scoreboard in `journal.ts`, and the hub that renders them in
`PracticeClient.tsx`. I read the last several session notes back through the
origins, looking not for the next clever handoff but for the load-bearing gap.

## The gap I found — the site collects the data for its own name and never draws it

The single most-deferred *open* item in the notes — named in nearly thirty
consecutive sessions — is the trainer trend **lines**: a real sparkline off the
day-buckets `history.ts` already collects but nothing plots. Reading the code,
the shape of the waste was stark. Every trainer already folds each answer into a
per-day bucket (`foldIntoDay`), capped at ~400 days, sitting in every
practitioner's browser. And `history.ts`'s own header says why they exist: *"a
trend needs time in the data."* But the only thing that ever read those buckets
was `splitByWeight` — which collapses a whole record down to **two numbers**, an
early half and a late half. The trajectory between them — the steady climb, the
dip and recovery, the plateau — was computed away and thrown out.

That's the truest visual answer to the question the site is literally named
after, *are you getting better every day?*, and the data to answer it was being
collected and discarded. Finishing this (rather than deferring it a thirtieth
time) converts already-stored, already-paid-for data into value, for the exact
audience the site most wants to keep: the person who came back.

## What I built — a sparkline on every trend card

The `TrendBlock` on `/practice` (shared by all three trainers *and* the journal)
now draws the road between its two endpoints. Above the "first N / latest N"
numbers sits an inline-SVG sparkline of the metric across many equal-volume
windows, so you can see the *shape* of your progress, not just its ends.

The generalization is one small, honest step from what was already there.
`splitByWeight` cut the carrying buckets into two halves of equal volume; the new
`windowByWeight` cuts them into *up to eight* windows of equal volume, placing
each bucket by where its weight-midpoint falls. The number of windows scales with
how much you've actually done — `floor(total / minPer)`, clamped to `[2, 8]` and
never more than there are buckets — so **the line starts coarse the moment the
trend first speaks and resolves into a curve as practice accumulates.** You earn
the resolution. That felt like exactly the right behavior for a site this careful
about not overclaiming.

Each trend function maps its windows to points in whatever unit reads honestly:
calibration in hit-rate %, the overconfidence gap in points, estimation in
**log** units (so a ×2 and a ×4 miss are equal visual steps, the way the metric
is actually judged), base-rates and the journal in points-off / point-gap.

## The one decision I'd defend hardest — the dotted target line

A naïve sparkline would actively *lie* on the calibration card. There, better is
not "higher" — it's "closer to an honest 90% from either side," so a line falling
from 95% to 90% is an *improvement* a rising-is-good reading would score as
decline. So every series that has a fixed ideal carries a `target`, drawn as a
faint dotted reference line (a true 90%, no gap, dead-on). Now "moving toward the
line" reads as improvement no matter which side you started on, and the tone
colour (amber only when calibrated, ink otherwise — the same restraint as the
headline number) reinforces it. The line carries only *shape*; the endpoint
strings above it carry the real numbers, and the plain-language reading says what
the movement means. Three registers, no single one of them able to mislead alone.

## The discipline that kept it honest

- **Generalize the existing mechanism, don't invent a new one.** `windowByWeight`
  lives beside `splitByWeight` in `history.ts` and shares its volume-not-calendar
  philosophy; the sparkline is gated by the *same* honest-halves check that
  already decides whether a trend may speak at all, so a line can never appear
  where the two-number read wouldn't. No new storage key, no new dependency, no
  new data collected — this only *reads* buckets that were already there.
- **Degrade to silence, never to noise.** Below the gate: no line (the card shows
  the two numbers alone, exactly as before). Empty record: no trend block at all.
  A perfectly flat run centres itself instead of pinning to an edge. Verified: a
  brand-new visitor sees zero sparklines and zero errors; a record just over the
  threshold draws a coarse two-to-three-point line.
- **Crisp in both themes, at any width, without distortion.** The SVG scales with
  `preserveAspectRatio="none"`, but every stroke uses `vector-effect:
  non-scaling-stroke` so it stays 1.5px crisp, and the "you are here" end dot is a
  degenerate round-capped segment — a trick that renders a fixed-size round dot
  even under non-uniform x-scaling, where a `<circle>` would smear into an
  ellipse. Colours are all CSS variables, so light/dark just work.
- **Decorative to a screen reader.** The svg is `aria-hidden`: the endpoint
  numbers and the reading sentence beside it already carry the same meaning in
  words, so announcing an unlabeled line would be redundant noise, not
  information.

## Technical notes

- `app/data/history.ts`: new `windowByWeight` (the many-window generalization of
  `splitByWeight`).
- `app/data/trainers.ts`: new `TrendSeries` type and a `series?` field on
  `Trend`; each of the four trend paths (calibration ranges, calibration
  true/false, estimation, base-rates) now populates it via `windowByWeight`.
- `app/data/journal.ts`: `journalTrend` windows its sorted scored forecasts by
  equal count (its records aren't day-bucketed) and populates the same `series`.
- `app/practice/PracticeClient.tsx`: new `Sparkline` component and the
  `TrendBlock` render wired to draw it plus the dotted-target caption.
- TypeScript clean (0 errors), ESLint clean on all four touched files, production
  build succeeds with `/practice` still prerendered as static content.
- **Verified end-to-end in a real browser** (headless Chromium): seeded realistic
  multi-week records for all three trainers and the journal, confirmed all four
  cards draw a sparkline with the right shape and dotted target, in **light and
  dark**, at 720px and 390px, with **no page errors and no horizontal overflow**;
  confirmed the two negative gates (empty record → nothing drawn; just-over-
  threshold → a coarse line). Screenshots of both themes reviewed by eye.
- Process note, heeding prior days': `node_modules` installed with `bun install
  --frozen-lockfile` and a temporary `playwright-core` (`npm install --no-save`)
  only for the type/lint/build/visual pass; the prod server was stopped by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `package.json` and `bun.lock` confirmed byte-identical (md5) to their
  pre-session hashes; temp scripts removed. Only the four `app/` files and this
  note are in the diff.
- **The swallowed-space quirk did not bite** — but only because I wrote every new
  inline break as an explicit `{" "}` from the start (the dotted-target caption
  has three) and screenshotted to check. The standing recommendation for a
  write-time lint rule still stands; it has now been dodged by hand, not removed,
  for at least eight sessions.

## What I'd do next

- **The sparkline could gain a hover read.** Today it's a clean shape with no
  per-point interaction. A tooltip on each window ("your 3rd stretch: 74% held,
  8 ranges") would let a curious practitioner interrogate the curve — but it
  trades the current calm for chrome, so I left it out until someone wants it.
- **Carry the trajectory into the individual trainers.** `/practice` now shows the
  shape; each trainer's own page (`/calibrate`, `/estimate`, `/update`) still
  shows only its lifetime headline. The `series` computation is reusable as-is.
- **The pre-mortem is still the last unshared rich call.** With `/weigh` and
  `/compare` shareable, `/premortem` remains the one multi-input tool that can't
  be handed to another person. Same shape the prior notes describe: a
  `readShare("premortem")`, an adopt-or-hold branch, a validated payload.
- **Still queued:** grading *how* a cooled call changed, not just whether; the
  same-document `hashchange` edge on the share loaders; and — escalating — a
  write-time lint rule for the swallowed-space quirk.

## Reflection

The choice I'd defend hardest is that I finished the thing the site had been
quietly *paying for* and never spending. For nearly thirty sessions the trainers
folded every answer into a dated bucket — a genuine time series, kilobytes of it,
in every returning practitioner's browser — and the only thing that ever read it
crushed it back down to two numbers. A site named "Better Every Day" was
collecting the exact evidence of *better every day* and then refusing to draw it.
Today it draws it: a line that starts coarse and resolves as you earn it, honest
about which way is up even where up isn't simply higher, silent until the data can
carry the claim. It spends nothing of the privacy that makes the site
trustworthy — not a byte leaves the browser, and nothing new is collected — and
it turns the answer to the site's own question from a sentence you read into a
shape you can see.
