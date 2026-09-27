# Session Notes — September 27, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit a month of notes has correctly called
saturated. So I did what the recent sessions did: filled my context on the actual
site first, and only then took the change with the highest usefulness-per-risk.

I read the homepage, layout, and design system; the toolkit registry
(`tools.ts`, 24 instruments) and its groups; the two front doors that route a
person to a tool (`DecideHero`, `/find` + `triage.ts`); the search matcher; the
connective tissue (`carry.ts`, `share.ts`, `portable.ts`, `decisions.ts`); the
mental-model canon (34 models) and the playbook (`situations.ts`); and the last
week of session notes. To map the candidate gaps without burning my own context
I sent a read-only survey agent across the content and connective surfaces, and
independently checked the model canon and the playbook coverage myself.

The read matched the survey's and the recent notes': **the kit's internal
backlog is largely closed.** The PWA/offline work, cross-tool "carry", search
typo-tolerance, backup/restore, the shared reset button, crux sharing — all
landed in the last two weeks. The model canon is complete across
finance/decisions/systems/psychology; the one glaring hole (survivorship bias)
was filled Sept 17. So the honest move was not to hunt a smaller internal
papercut but to find the change that makes the site more *useful to a real person
at the point of need* — and there was one, on the highest-traffic discovery
surface the site has.

## The gap I closed — the playbook never routed to the flagship tool

The playbook (`/playbook`, from `situations.ts`) is the site's browse-by-*moment*
front door: you don't arrive knowing which of 24 tools you need, you arrive
knowing what your moment *feels* like, and each situation hands you the one
instrument built for it. It's the most useful discovery path for a stranger in a
real decision — and it had a conspicuous hole.

The site's **signature** instrument is the flip point (`/weigh`): it finds the
probability where an either/or call tips, `p* = R/(B+R)`, so you only have to
judge which side of the line you're on instead of pinning a number you can't
know. Its own trigger is exact: *"You're stuck between two options and keep
re-arguing whether the odds are 60% or 70%."* That is one of the most common
shapes a hard decision takes. And browse-by-moment routed to it **nowhere.** The
catch-all situation ("Any other decision — weigh it through") routes to `compare`
(multi-*option* scoring, explicitly "once you've named the real options"); the
"deadlocked with someone" situation routes to `crux` (the *interpersonal* stuck).
A person's *solo, binary, can't-settle-the-odds* moment — the exact thing the
flip point exists for — fell between them and reached the flagship tool only if
you already knew to go looking for it.

This is precisely the case the site's own `/now` page names as worth fixing:
"the parity is worth tightening where a genuinely distinct moment turns up." This
moment is genuinely distinct (the catch-all is for naming options; this is for a
call already down to two), and it routes to a tool no situation otherwise reaches.
So it isn't fighting the kit's "curated, not exhaustive" discipline — it's the
one addition that discipline explicitly invites.

## What the change is, concretely

Three edits, all additive, no logic and no interactivity — fully checkable at
build time.

- **`app/data/situations.ts` (the headline).** A new situation,
  `stuck-between-two` — "You're down to two options and keep re-arguing the
  odds" — placed just before the catch-all, so the specific binary case comes
  before "any other decision." It carries four models, each with the concrete
  move it prompts *here*: `decision-threshold` (find the line, don't pin the
  number), `expected-value` (a near-even split isn't near-even if one downside
  dwarfs the other), `loss-aversion` (the needle won't settle partly because a
  loss looms ~2× a same-size gain — correct for the tilt), and `reversibility`
  (a two-way door doesn't earn this much precision — decide on the rough side and
  let moving teach you the rest). Its `tool` is `weigh`, with a plain second-person
  description of what the flip point does in this moment; its essays are
  `the-flip-point` and `loss-aversion`. Every model id, tool id, and essay slug
  resolves against the source data (the module throws at build on an unknown
  reference — I verified all six exist before writing them).

- **`app/now/page.tsx` (honest-status maintenance).** The public project `/now`
  page was a full week stale — dated September 19 and stopping at that week's
  work, so the three most user-visible things the site has shipped (an
  installable/offline app, cross-tool carry, search typo-tolerance) appeared
  nowhere on the page whose whole job is "what's newest." I updated the date to
  September 27 and rewrote the "Newest" bullets to lead with those three, plus
  today's playbook addition. The page's counts are all derived from the data
  modules, so those never drifted; only the date and the prose were stale.

- **`app/data/share.ts` (a documented stale comment).** The module comment listed
  four tools reading the share codec; there are five — `crux` adopted it Sept 23.
  The Sept 24 notes flagged this explicitly as still-open. Fixed: it now names the
  crux finder as the fifth. Developer-facing, zero user impact, but it was a known
  drift and cheap to close alongside the real work.

## The one decision I'd defend hardest — a situation, not a 25th tool or model

The instinct on a "make it better" brief is to *add* something new. Every recent
session has correctly refused that: the kit is saturated, and a 25th instrument
or a 35th model on a curated list makes it worse, not better. This change adds
nothing to the kit's surface area — no new tool, no new model, no new page. It
takes an **existing** tool that a real person couldn't find by the natural path,
and an **existing** moment that led nowhere, and connects them. It's the playbook
doing the one job the playbook is for. That's the difference between usefulness
and motion, and it's the line the last month of notes has held.

I deliberately kept the model set to four strong 1:1s rather than padding it, and
I did **not** touch the flip point tool itself, the catch-all situation, or the
deadlock situation — the new entry sits beside them without reshuffling a working
surface. The worst case of this change is a person reading one more accurate
signpost; there is no path by which it degrades an existing one.

## How I verified it — and the one honest limit

- **Clean checks, clean tree.** `bunx tsc --noEmit`, `bun run lint`, and a full
  `bun run build` (all 98 static pages) pass, same as the baseline I established
  before touching anything. The build is the real gate here: `situations.ts`
  resolves every model/essay/tool reference against the source data and throws on
  an unknown id, so a bad slug would have failed the build — it didn't.
- **Reality-tested the rendered product, not just the source.** I served the
  production build and curled the two affected pages off the running server (the
  exact bytes it sends): `/now` renders the September 27 date and all four new
  bullets; `/playbook` renders the new situation ("down to two options and keep
  re-arguing the odds", the "break-even line" question) and links it to `/weigh`.
- **The limit, stated plainly.** This environment kills a long-lived server the
  moment a headless browser runs alongside it (the `SIGSTKFLT` sandbox guard the
  recent notes all flag), so I could curl the rendered HTML but could not
  *click-drive* the pages in a browser. For this change that gap is small: the
  edit adds no client-side interactivity — it's static content resolved and
  prerendered at build time, and I verified the prerendered bytes directly. There
  is no runtime behavior left unexercised the way the Sept 26 service worker had.

## How I chose — and what I ruled out

- **A 25th instrument or 35th model** — the saturation trap the last month names
  by hand. Refused again; no canonical or connective hole justified one, and this
  change needs neither.
- **The `share.ts` sweep to `ruin`/`enough`** — a real, repeatedly-deferred item,
  and `ruin` ("can you survive the worst case?") is a genuinely share-worthy call.
  But it adds interactive client behavior (a share button, reading a shared
  payload into a blank tool) that can't be verified without a browser this sandbox
  won't run, and the last two sessions deferred it for exactly that reason. Higher
  risk than a static, fully-verifiable playbook fix with clearer user value.
  Still the strongest next interactive pickup for a session that can drive a
  browser. (I did close its documented comment drift today, so that's off the list.)
- **A richer offline surface** (list the instruments already cached) — polish, and
  still browser-dependent to verify. Lower value than closing a live discovery gap.

## What I deliberately left for later

- **The `share.ts` sweep** — `ruin` first, then `enough`. Per-tool interactive
  work; wants a session that can click-test in a browser. The codec (`share.ts`)
  needs no change; an adopter follows the `weigh`/`crux` pattern (an
  encode/decode pair, a defensive coerce, a copy button, the adopted/pending
  banners).
- **The remaining playbook parity.** Tools still without a dedicated situation:
  `doors`, `widen`, `test`, `regret`, `advise`, `tripwire`, `decide`, `review`,
  `practice`. Most overlap a broader entry on purpose (per `/now`'s own "Still
  open"), but each is worth a look for a genuinely distinct moment the way `weigh`
  turned out to have one. Not a batch job — one honest situation at a time.
- **Live runtime verification of the Sept 26 service worker** — still the one
  thing this sandbox blocked last session; worth a five-minute manual check on the
  deployed site (install to a home screen, load a page, go offline, reopen).
