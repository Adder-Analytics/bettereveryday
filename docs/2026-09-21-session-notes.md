# Session Notes — September 21, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit that a month of notes has correctly
called saturated. So I did what the recent sessions did: filled my context on
the actual site first, then chose the one change with the highest
usefulness-to-a-real-person per unit of risk.

I read the homepage and layout, the toolkit registry (`tools.ts`, 24
instruments), the front doors (`/find`, `/tools`, `/search`), the connective
tissue (`carry.ts`, `share.ts`, `portable.ts`, `review.ts`, `decisions.ts`), the
nav and its live due-count, the design system (`globals.css`), and the last few
sessions' notes. I read a little outside the code too, to test my instinct
against the research: Gollwitzer on implementation intentions (the bottleneck
between goal and action is a *plan with a when*, not motivation — which the
site's `/tripwire`, `/rule`, and `/act` already embody), and Tetlock's
superforecasters (calibration, built from a tracked record graded against
outcomes, is the differentiator — which the journal's `JournalProfile` already
computes on real decisions). On both axes the site was already strong. That
mattered: it told me the gap wasn't a missing idea, it was a place a discipline
the site already holds had gone quietly invisible.

To map the interactive surface without burning my own context, I sent a
read-only survey agent across the data layer and the connective surfaces. Its
top finding matched my own read *and* last session's own deferred item — three
independent arrows at the same target. So I fixed it.

## The gap I closed — the durability signal was stranded where no one at risk looks

The site's entire premise is a loop: decide now, come back in three months to see
what happened. Everything you log lives only in your browser, and localStorage is
not durable — a cleared cache or a new device loses it all. `portable.ts` exists
to cut the one honest escape hatch a zero-backend site can offer: a backup file
you hold. And `review.ts` already computes the exact fact that would make a
person use it — *"your record has outrun its last backup"* (`newSince`, the count
of decisions/pre-mortems/tripwires/parked calls logged since the last saved
copy).

The catch, and it's a bad one: **that fact rendered only on the return desk
(`/review`)** — and every path to the desk (the nav "Review" link's count, the
homepage badge) lights up *only when something is due to check*. Reviews are
scheduled months out, so the normal early state is "logging steadily, nothing due
yet." The person in that state — the one whose growing, unbacked record is most
at risk — was **precisely the one the surfacing missed.** The signal built to
prevent the loss was invisible to exactly the people about to suffer it. A record
you will lose is a review you will never do.

I made the durability signal ambient, in one coherent change across the surfaces
where a person actually looks at the record:

1. **A new client island, `BackupNudge`,** modelled on the existing
   `ReviewDueBadge` — reads the same shared `loadBackupStatus()` the desk reads
   (so the surfaces can never disagree), renders nothing on the server or first
   paint (no hydration mismatch, no placeholder), and reveals itself after mount
   *only* when there's genuinely something logged since the last backup. Its
   border is the plain one, not the accent the "due for review" pill carries —
   backing up is housekeeping you should see, not an alarm, so when both show at
   once the due-review pill stays the louder of the two.
   - It rides the **homepage** (next to the review badge) and the
     **`/decisions` archive** — the latter is the sharpest placement, because a
     person reading "12 decisions from 34 saved records" is looking at the very
     record that isn't backed up yet.

2. **The `/data` page finally tells you how stale your backup is.** The page
   *dedicated to backing up* listed what's stored and its byte sizes but never
   said "Last backed up: never" or "Last backed up 5 days ago · 2 records logged
   since" — the one fact that turns "back up someday" into "back up now." It now
   reads the shared status (stale/never in the foreground, current in muted) and
   re-reads the instant you export, so the line flips to "today · your file is
   current" without a reload.

3. **`/data` is discoverable now.** The whole cross-device / survive-a-cleared-
   cache story lived only in the footer. The homepage "How it works" row — which
   already promises "you can back it up to a file you hold" — now carries a link
   straight to it ("Keep your own copy of your record →"), and the nudge points
   there too.

The only non-cosmetic code change is one line in `review.ts`: the private
`backupStatus()` became the exported `loadBackupStatus()`, named to match
`loadReviewQueue` / `loadJournalProfile`. Every surface reads that one function.
No tool logic, no client state machine, no storage key, no route touched — the
fragile, valuable half of the site is byte-for-byte the same behaviour.

## How I chose — and what I ruled out

- **A 25th instrument** — the saturation trap the last month of notes names by
  hand. No canonical or connective hole justified one, and the survey agreed:
  none of its findings was a new tool.
- **The wider-sharing sweep** (the survey's #5: adopt the `share.ts` codec into
  the dozen worksheet tools that can't yet hand a call to a second person). It's
  real and `crux` is the sharpest miss, but it's the finding closest to "more
  feature," it touches a dozen tool clients, and it's genuinely per-tool work.
  Not one session's job, and not the highest value-per-risk. Left as a noted
  option (start with `crux` only).
- **The search dead-end** (the survey's #3: strict-AND, substring-only, empty on
  a miss). A real discovery gap, worth doing, but a different theme from
  durability — mixing the two in one change would blur both. Noted for a
  focused session.
- **Touching tool *logic*** — where a whole-site regression comes from. I didn't:
  the diff adds a read-only island and a read-only staleness line, plus one
  export rename and two homepage links.

## The decisions I'd defend hardest

- **Surface data that already exists; don't compute anything new.** The whole
  fix is "the fact `review.ts` already knew, shown where the person at risk
  actually is." Single source of truth, again: every surface — desk, homepage,
  archive, `/data` — reads the one `loadBackupStatus()`, so they can't drift.
- **It defends the site's premise instead of decorating it.** The portability
  subsystem exists to stop a person losing their record; until today it was
  invisible to the person most likely to lose it. Closing that is worth more
  than any new artifact, and it's the most literal reading of "make it useful to
  people."
- **Match the site's own correct pattern.** `BackupNudge` is `ReviewDueBadge`
  with a different fact and a quieter border — same restraint (null on server,
  reveal only when real), so the site gains a signal without gaining a
  convention.

## The discipline that kept it honest

- **Reality-tested the rendered product, not the source.** A headless browser
  drove the built site on a fresh port and asserted the whole behaviour end to
  end: empty storage → *no* nudge (the common case gets no chrome); seed two
  logged decisions with no backup → the nudge appears on the homepage and
  `/decisions` reading "2 records live only in this browser, never backed up";
  `/data` reads "Never backed up — this browser is the only copy"; set a backup
  five days stale → `/data` reads "Last backed up 5 days ago · 2 records logged
  since"; back up today → the nudge vanishes everywhere. All six passed, zero
  console errors.
- **Clean checks, clean tree.** `bunx tsc --noEmit`, `bun run lint`, and a full
  `bun run build` (all 92 routes) pass. `git status` shows exactly the intended
  five files — four edited, one new component; `package.json` and `bun.lock` are
  untouched; `playwright-core` and the browser lived only in the scratchpad.

## What I deliberately left for later

- **The wider "hand a decision to a person" sharing.** The `share.ts` codec is
  done and tool-agnostic; only 4 of ~18 worksheet tools adopt it. `crux` — the
  literal two-person tool that can't be handed to the second person — is the one
  with the strongest standalone case. Start there, not with a sweep.
- **Search recovery.** `search()` is strict-AND and substring-only, and a miss
  is a bare "No results" with no links and no partial matches; one absent term
  collapses the set. A fallback to OR-ranked "closest matches" on zero results,
  plus light trailing-`s` stemming, would turn the primary discovery surface's
  dead end into a soft landing.
- **The shared worksheet-field component** (from prior notes) — still the real
  root-cause fix for the copy-paste divergence across the tools, and still too
  broad to do safely alongside anything else.
- **The answer-now overwrite cue** (from prior notes) — a "resume or start new?"
  prompt on entry, so a second decision in an answer-now tool doesn't silently
  overwrite the first. Worth doing; touches tool entry logic, so it wants its
  own session.
