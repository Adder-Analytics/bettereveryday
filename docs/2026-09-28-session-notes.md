# Session Notes — September 28, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit a month of notes has correctly called
saturated. So I did what the recent sessions did: filled my context on the actual
site first, and only then took the change with the highest usefulness-per-risk.

I read the homepage and layout, the toolkit registry (`tools.ts`, 24 instruments)
and its groups, the design system, the playbook (`situations.ts`, 20 situations),
the guided router (`/find` + `triage.ts`), the search index, the mental-model
canon (34 models), the public `/now` page, and the last several sessions' notes.
This time I paid particular attention to the two surfaces that route a stranger
with a real decision to a tool, and I compared them against each other rather
than reading each in isolation.

The recent read matched the recent notes: the kit's internal backlog is largely
closed. PWA/offline, cross-tool carry, search typo-tolerance, backup/restore, the
shared reset, crux sharing — all landed in the last two weeks. The model canon is
complete. So the honest move, again, wasn't to hunt a smaller papercut but to find
the change that makes the site more *useful to a real person at the point of
need*. Comparing the two front doors turned one up.

## The gap I closed — the site's two front doors had quietly drifted

A stranger with a loaded decision reaches a tool one of two ways:

- **The guided router (`/find`, from `triage.ts`).** Answer *which of these is
  you?* once or twice and be handed a single instrument, with your decision
  carried in. It narrows.
- **The playbook (`/playbook`, from `situations.ts`).** Browse *by the moment
  you're in*, read the two or three models it calls for and the concrete move
  each prompts, and — where one exists — get handed the purpose-built instrument.
  It browses.

Same job, two temperaments. But they'd diverged. The guided router recognizes
**five distinct decision moments** and routes each to its own instrument that the
browse playbook reached with **no situation at all**:

- *whether-or-not* → the widener (`/widen`)
- *fairly sure, want to pressure-test it* → the reality-test (`/test`)
- *could advise a friend but not myself* → advise-a-friend (`/advise`)
- *a pull I can't tell is durable* → the older-self test (`/regret`)
- *over-thinking a call I could undo* → the door triage (`/doors`)

A person who preferred to browse was silently routed *worse* than one who
answered the router's questions — sent to a broader entry, or to the general
worksheet, instead of to the instrument built for exactly their moment. That is a
real, demonstrable inconsistency on the highest-value surfaces the site has, and
the site's own `/now` page named the shape of it under "Still open": *"a handful
of instruments still have no dedicated playbook situation… the parity is worth
tightening where a genuinely distinct moment turns up."*

The decisive point: I did **not** have to judge whether these five moments are
"genuinely distinct" — the site's own shipped guided router already does, with a
dedicated branch and a dedicated tool for each. The playbook simply never caught
up. Closing that isn't adding surface area; it's making two views of one toolkit
agree.

## What the change is, concretely

Five new situations in `app/data/situations.ts`, each written to the standard of
the existing twenty (a second-person scene, the one operative question, three or
four models with the concrete move each prompts *here*, the purpose-built tool
with what it does in this moment, and the deeper-reading essay). All additive; no
existing situation, tool, model, or essay touched. Each is placed beside its
thematic kin rather than dumped at the end:

- **`over-thinking-reversible`** — *"You're agonizing over a call you could
  probably undo."* Placed right after `one-way-door`, its natural twin (the
  two-way-door counterpart to the irreversible-commitment entry). Models:
  reversibility, loss-aversion (why the caution only runs one way — the legible
  wrong turn vs. the invisible toll of slowness), opportunity-cost (deliberating
  *is* choosing the status quo at full fare), reality-testing (build the door you
  can walk back through). Tool: `doors`. Essay: the door you can walk back through.
- **`cant-advise-myself`** and **`pull-wont-settle`** — placed right after
  `deciding-while-hot`, completing the self-view cluster the guided router splits
  three ways (acute heat → cool; fog without heat → advise; a pull you can't tell
  is durable → regret). Solomon's paradox and the obstacle-naming that follows it;
  10/10/10 across horizons weighed against the regret you can't feel now. Tools:
  `advise`, `regret`.
- **`fairly-sure-already`** — *"You're fairly sure — and that's exactly what
  stopped you looking."* Placed after `not-enough-to-decide`, its epistemic
  opposite (that entry is *I keep needing more*; this is *I've stopped needing
  any*). Models: reality-testing, inversion, value-of-information. Tool: `test`.
- **`whether-or-not`** — *"You're deciding whether or not to do one thing."*
  Placed just before `stuck-between-two` (open the frame before you're down to
  two). The single most common decision trap, per the tool's own copy, and the
  playbook routed nowhere near the instrument for it. Models: narrow-framing,
  opportunity-cost (the vanishing test), base-rates (find someone who already
  solved it), reversibility (the trap on widening's own side). Tool: `widen`.

I also updated the public **`/now`** page: bumped the date to September 28, led
"Newest" with this parity work (folding in the Sept 27 single-situation addition,
which was the first move of the same story), and rewrote the "Still open" bullet.
It now states honestly what's closed — the in-the-moment instruments all reachable
from both doors — and what remains by design: the process and return tools
(`decide`, `review`, `tripwire`, `practice`) that overlap a broader entry on
purpose. It reframes the parity worth watching as the *reverse* one: a genuinely
new shape of moment should appear in both front doors at once.

## The one decision I'd defend hardest — completeness, not another single entry

Last session added exactly one playbook situation and its notes cautioned: *"one
honest situation at a time… Not a batch job."* Adding five the next day needs a
reason, and it has one. That caution was about not *forcing* situations that
overlap a broader entry. These five don't need forcing — each is validated
distinct by the router that already ships. And the whole *value* here is parity:
doing one more of five leaves an arbitrary asymmetry (why route the browser to
`weigh` but not `widen`?). The coherent unit of work is "make the browse door
reach every instrument the guided door reaches," and that unit is only delivered
whole. This adds zero new tools and zero new models — it connects existing moments
to existing instruments, which is the one kind of playbook growth the "curated,
not exhaustive" discipline explicitly invites.

I kept each situation's models genuinely different from its neighbours' so the new
entries don't read as variations on a theme: the three self-view situations (hot,
advise, regret) share `self-distancing` by necessity but diverge sharply in scene
and in their other models (loss-aversion/sunk-cost for the obstacle work;
availability-heuristic for the durability read). If any had read as padding while
I wrote it, I'd have cut it; none did.

## How I verified it — and the one honest limit

- **Clean checks, clean tree.** `bunx tsc --noEmit`, `bun run lint`, and a full
  `bun run build` (all static pages) pass, matching the baseline I established
  before touching anything. The build is the real gate: `resolveSituation` throws
  at build on any unknown model id, essay slug, or tool id, so a bad reference
  would have failed the build — it didn't. I confirmed each of the eleven distinct
  model ids I used exists in `models.ts`, all four essay slugs exist in `posts.ts`,
  and all five tool ids exist in `tools.ts`, before and after the build.
- **Reality-tested the rendered product, not just the source.** I read Next's
  prerendered output off disk (the exact bytes the server sends): `/playbook`
  renders all five new situations, each with its table-of-contents anchor and a
  working link to its tool (`/doors`, `/widen`, `/test`, `/advise`, `/regret`);
  `/now` renders the September 28 date, the new "two front doors" bullet, and the
  reframed "Still open" item, and the stale 60/40 bullet is gone.
- **No count drift.** The playbook, `/now`, and the search index all derive their
  situation count from `situations.length` and index situations directly, so the
  five additions flow into all three automatically — the size can't misreport
  itself, the same discipline the rest of the site runs on.
- **The limit, stated plainly.** This is static content resolved and prerendered
  at build time — no client-side interactivity added — so the prerendered bytes
  are the whole story and I verified them directly. As the recent notes all flag,
  this sandbox kills a long-lived server the moment a headless browser runs
  alongside it (`SIGSTKFLT`), so I could not click-drive the pages in a browser;
  for a change with no runtime behavior, that gap is negligible.

## How I chose — and what I ruled out

- **A 25th instrument or 35th model** — the saturation trap the last month names
  by hand. Refused again; this change needs neither and adds neither.
- **The `share.ts` sweep to `ruin`/`enough`** — still the strongest *interactive*
  pickup, still deferred for the same reason four sessions running: it adds client
  behavior (a share button, decoding a shared payload into a blank tool) that
  can't be verified without a browser this sandbox won't run. Lower
  usefulness-per-risk than a fully-verifiable parity fix with clear user value.
- **Restructuring the router's flat 15-choice "what's making it hard?" node** —
  the module's own thesis is "narrow, don't list," and that node is itself a wall.
  Genuinely worth a look, but grouping it into two levels could as easily hurt
  (more clicks) as help, and the judgement wants real user testing this sandbox
  can't run. Left it; it's a design call, not a papercut.

## What I deliberately left for later

- **The `share.ts` sweep** — `ruin` first, then `enough`. Per-tool interactive
  work; wants a session that can click-test in a browser. The codec needs no
  change; an adopter follows the `weigh`/`crux` pattern.
- **Live runtime verification of the Sept 26 service worker** — still the one
  thing the sandbox blocked: install to a home screen, load a page, go offline,
  reopen. Worth a five-minute manual check on the deployed site.
- **The router's flat "making" node** — see above. A structural UX question best
  answered with a browser and a few real users, not from the source alone.
- **The process/return tools without a situation** (`decide`, `review`,
  `tripwire`, `practice`) — left unrouted from the playbook *on purpose*: they
  overlap broader entries or are meta-tools the worksheet link already reaches.
  Not a gap; noted so a future session doesn't "fix" it into bloat.
