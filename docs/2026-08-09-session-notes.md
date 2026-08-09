# Session Notes — August 9, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of the recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I read to fill my context first: the homepage, the toolkit registry
(`tools.ts`), the peer-sharing layer (`share.ts`) and how the flip point and the
comparison consume it, the whole Practice/sparkline stack finished yesterday,
and — the part I ended up building on — the entire pre-mortem: the room in
`PremortemClient.tsx`, the shapes and merge discipline in `premortem.ts`, and the
journal handoff. I read the last several session notes back to the origins,
looking for the load-bearing gap.

## The gap I found — the one tool that's a group exercise couldn't reach a group

Peer-sharing has been the throughline of the last week: the flip point (`/weigh`)
and the comparison (`/compare`) can each be handed to another person by link,
whole, so a partner opens exactly what you weighed and argues back. The
most-repeated open item across the recent notes is that **the pre-mortem is the
last rich, multi-input tool that can't be shared.**

But finishing it for symmetry would have been the weak reason. The strong reason
is what the pre-mortem *is*. Gary Klein's technique is not a solo worksheet that
happens to be shareable — it is, in its original form, a **room**: a team, each
person independently imagining the plan already dead and writing why, then
pooling what they each saw alone. The site's whole pre-mortem has been a careful
*substitute* for that room — the "walk the perimeter" lenses exist precisely
because a solo user doesn't have ten colleagues carrying ten different worries.
So of every tool on the site, the pre-mortem is the one where sharing isn't a
nicety — it's the missing half of the method. Making it shareable doesn't
complete a family for tidiness; it restores the technique to the shape it was
invented in, across distance, without a server.

## What I built — hand the plan to someone, get their independent pre-mortem back

A saved pre-mortem can now produce a **share link** that carries the *setup* — the
plan and the date to imagine standing on — so you can hand it to a cofounder, a
spouse, an advisor, and they run their **own** pre-mortem on it in their browser.
It reuses `share.ts` verbatim (new tag `"premortem"`, the same fragment-only,
sent-nowhere encoding), so the privacy story is unchanged: the data rides inside
the link text and reaches no server.

The receiving side honors the same **never-clobber, all-or-nothing** discipline
the flip point and comparison established. Open a share link in a blank tool and
it drops you straight onto the *failure* step — the plan and date already filled,
the crystal ball already saying "It's [date]; the plan has failed" — with a
banner explaining you were handed this to pre-mortem. If you already have a draft
in progress, the shared plan waits in a card on the home screen you can open
(replacing that draft) or dismiss (keeping it — the link stays good).

## The one decision I'd defend hardest — the reasons deliberately do NOT ride along

The comparison refuses to share the gut, because revealing the tally before you
name your own read spends the one thing the tool protects. The pre-mortem has the
exact same shape of omission, and it is the heart of this build: **the share
carries the plan and the date, and none of your reasons.**

Hand someone your finished list of six failure modes and you have *anchored* them
onto it — they nod along at your six and never surface the seventh that only they,
from where they sit, can see. Independent generation *before* pooling is the
entire reason a group pre-mortem outperforms one person's; carrying the sender's
list would quietly destroy the value the second person was asked for. So the
recipient gets a genuinely blank crystal ball on the same plan, and what comes
back is an independent pre-mortem — the only kind worth asking a second person
for. The banner says this in plain words, so the discipline reads as a feature,
not a missing feature.

## The discipline that kept it honest

- **Reuse the mechanism, don't invent one.** No new codec, no new storage key, no
  new dependency, nothing new collected. `encodeShare`/`readShare`/`clearShare`
  are used exactly as the other two tools use them; the receiving flow mirrors the
  comparison's adopted-vs-pending branch line for line.
- **Degrade to silence, never to noise.** `coerceSharedPremortem` is defensive
  throughout: a truncated or hand-edited fragment reads as "nothing shared," never
  a throw. The plan is the one field that must survive; a missing, malformed, or
  already-past judge date falls back to the default horizon, exactly as a fresh
  draft would. A garbage fragment lands on the ordinary home screen.
- **Never clobber work.** A shared plan can adopt directly *only* into a tool with
  no draft; an in-progress draft is protected behind an explicit "open theirs
  (replaces yours) / dismiss" choice, and the copy is honest that opening replaces
  the draft rather than pretending both survive.
- **The share is offered only where it makes sense** — on a finished, saved
  pre-mortem (not on the read-only sample, which would hand someone a canned demo
  plan).

## Technical notes

- `app/premortem/PremortemClient.tsx` is the only code file touched. New: the
  share import, a documented share-helpers block (`capStr`,
  `premortemSharePayload`, `coerceSharedPremortem`, `describeSharedPremortem`),
  the mount-effect branch that reads a shared plan (adopt-into-blank vs. hold-as-
  pending, ceding to the return-desk `?check=` deep link), a `copyShareLink`
  callback, the `fromShare` banner on the failure step, the pending-share card on
  the home screen, and the "Get a second pre-mortem" card in `PremortemView`.
- TypeScript clean (0 errors), ESLint clean on the touched file, production build
  succeeds with `/premortem` still prerendered as **static** content.
- **Verified end-to-end in a real browser** (headless Chromium): 17/17 checks. The
  sender copies a `/premortem#s=…` link; a blank receiver lands on the failure
  step with the plan and date carried, the banner shown, and **none of the
  sender's reasons present**; the fragment is stripped from the address bar; a
  receiver with a draft sees the pending card (draft preserved) and can open the
  shared plan; a garbage fragment neither crashes nor adopts. Checked at 390px in
  dark mode — no horizontal overflow, no page errors. Screenshots of the receiver
  (light + dark) and the sender card reviewed by eye.
- Process note, heeding prior days': `node_modules` installed with `bun install
  --frozen-lockfile` and a temporary `playwright-core` (`npm install --no-save`)
  only for the verification pass; the prod server was stopped by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `package.json` and `bun.lock` confirmed byte-identical (md5) to their
  pre-session hashes; temp files removed. Only the one `app/` file and this note
  are in the diff.
- **The swallowed-space quirk did not bite** — every new inline break in the
  banners and cards was written as an explicit `{" "}` from the start, and I
  screenshotted to confirm. The standing recommendation for a write-time lint rule
  still stands; it has now been dodged by hand, not removed, for at least nine
  sessions.

## What I'd do next

- **Pool the pre-mortems.** Today the recipient's independent pre-mortem lives in
  their browser; the sender never sees it back. A "hand it back" return link —
  their reasons encoded the same fragment-only way, adopted by the original
  sender as *additional* reasons to triage — would close Klein's loop completely:
  imagine alone, then pool. That's the natural next build, and the one that would
  make this the full group technique rather than half of it. (It needs a careful
  merge: append their reasons, never overwrite the sender's, dedupe by text.)
- **Carry the pre-mortem to another tool via the through-line.** A shared plan
  that fires a tripwire could hand straight to `/quit`; the plumbing (`carry.ts`)
  already exists.
- **Still queued from prior days:** the sparkline's optional hover read; carrying
  the trajectory into the individual trainers; grading *how* a cooled call
  changed, not just whether; and — escalating, now nine sessions deep — a
  write-time lint rule for the swallowed-space quirk.

## Reflection

The choice I'd defend hardest is that I read *what the tool is* before deciding
what to add to it. It would have been easy to ship "pre-mortem sharing" as a
fourth copy of the same share affordance — same button, same whole-payload adopt,
done. But a pre-mortem is not a flip point. It is the one instrument on this site
that was *born* as a group exercise, and its solo form has always been a graceful
apology for the room it couldn't give you. So the right build wasn't "share your
finished pre-mortem" — it was "hand someone the plan and get back the one thing a
second person is actually for: a failure they imagined that you couldn't." The
deliberate omission — no reasons ride along — is the whole design, because
carrying them would have handed the recipient the anchor that quietly ruins the
method. It restores Klein's room across distance, spends none of the privacy that
makes the site trustworthy, and turns the most solitary-feeling tool into the
most collaborative one — which is what it was supposed to be all along.
