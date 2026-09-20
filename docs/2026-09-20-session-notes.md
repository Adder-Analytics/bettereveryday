# Session Notes — September 20, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit that's already saturated. So I did
what the last month of notes did: filled my context on the actual site before
choosing, and reality-tested the rendered product, not the source.

I read the homepage and layout, the toolkit registry (`tools.ts`, 24 instruments
in 4 moment-groups), the four front doors (`/find`, `/playbook`, `/tools`,
`/search`), the connective tissue (`carry.ts`, `decisions.ts`, `decisionText.ts`,
`review.ts`, `portable.ts`), the design system (`globals.css`), and the last few
sessions' notes. I drove all 42 routes in a headless browser at phone width:
every one 200, no overflow, no console errors. On every axis the recurring
conclusion held — the site is finished and saturated. A 25th tool or 35th model
would be padding, the exact thing every recent session has refused to do.

To map the whole interactive surface without burning my own context, I sent a
read-only survey agent across the tools. It came back with two concrete things
the site had, by its own standards, gotten wrong — not missing features, but
places where a discipline the site applies everywhere had quietly lapsed. Both
are load-bearing for real people. I fixed both.

## The two gaps I closed — the site's own standards, applied where they slipped

### 1. The homepage was under-reporting the kit to first-time visitors

The whole `toolCount` / `spellCount` machinery in `tools.ts` exists for one
reason, spelled out in its own comment: for fifteen sessions the count lived in
prose as an English word, copied by hand into many places, and every one went
stale the moment a tool was added. Every surface was migrated to derive the
count from the registry — every surface *except the two highest-traffic ones*:

- **The homepage hero (`page.tsx`).** Read "the flip point, the pre-mortem, the
  consequence trace, and **a dozen** more" — which, with 24 instruments, told a
  first-time visitor the kit was about half its real size.
- **The site meta description (`layout.tsx`).** The sentence Google and every
  Slack/iMessage unfurl shows, hardcoded to "**two dozen** more working
  instruments" — a *different* wrong number from the hero, so the two most
  public surfaces on the site disagreed with each other about how big it is.

These were the last two un-migrated counts, on the two surfaces a person sees
*first* — the exact drift the machinery was built to end. Both now read "A
private toolkit of `{toolCountWord}` working instruments…" (twenty-four),
interpolated from the registry, so they can never go stale or disagree again.
This directly continues last session's finding: first impressions are
load-bearing, and until now the first impression mis-sized the tool.

### 2. The instruments were unusable on a screen reader — the worst place for it

The site invests visibly in accessibility: a skip link, one consistent
`:focus-visible` ring drawn for keyboard users, honored `prefers-reduced-motion`,
ARIA on the nav's due-count and mobile panel. The `globals.css` comment even
names the case — "a decision tool gets reached for in a real moment, and some of
those moments are keyboard-only — a screen reader, a trackpad that died."

But across the toolkit, the pattern had diverged. Three tools (`decide`,
`premortem`, `tripwire`) associated each worksheet `<label>` with its field
correctly (`htmlFor` + `id`); the trainers (`estimate`, `update`) named their
fields with `aria-label`. **Every other tool** wrote a bare `<label>` next to an
`<input>`/`<textarea>` with no association at all — so on a screen reader the
most important fields (the "what are you deciding?" line, and every field that
settles the call) were announced with *no prompt*. A placeholder is not an
accessible name. A blind user could reach the flip point, the pre-mortem's
survivors, the pre-mortem trace — and not be told what any box was for. That
isn't a nicety; it's the difference between the instrument working for someone
and not.

I associated every unlabelled worksheet field with its label across the twenty
tools that had the gap, matching the pattern the site already used correctly:

- **Static labelled fields** (`doors`, `ruin`, `widen`, `weigh`, `compare`,
  `outside`, `test`, `incentives`, `enough`, `stop`, `crux`, `trace`, `cool`,
  `regret`, `advise`, `rule`, `act`, `quit`, `debrief`): the `<label>` got an
  `htmlFor` and its field a matching `id`, with ids namespaced per tool
  (`weigh-decision`, `crux-they-want`, `quit-kill-date`) so they stay unique.
  For the two-mode tools (`weigh`'s "do this, or don't" vs "A or B"; `stop`'s
  count vs time), each branch got its own id even though they never co-render.
- **Fields with a visible heading but no `<label>` element** (the reused
  `OrderBlock` textarea in `trace`, the dynamic option rows in `widen` and
  `compare`, `outside`'s forecast field and reference-class rows, and a handful
  of sub-fields in `act`/`quit`/`advise`/`debrief` sitting under a `<p>` prompt):
  each got an `aria-label` carrying the visible prompt, since there was no label
  element to associate.
- **One companion fix, same theme:** `/data`'s restore file-picker `<input>` —
  visually hidden behind a labelled button — was the one remaining nameless
  control on the whole site. It got an `aria-label` too.

Every change is attribute-only. No tool logic, no client state, no storage key,
no route touched — the fragile, valuable half of the site is byte-for-byte the
same behaviour, now announced correctly.

## How I chose — and what I ruled out

- **A 25th instrument / 35th model** — the saturation trap the last month of
  notes names by hand. No defect or canonical hole justified one.
- **Touching tool *logic*** — where a whole-site regression comes from. I didn't:
  the diff adds only `htmlFor`, `id`, and `aria-label` attributes, plus two copy
  strings. The build's throw-on-unknown resolvers and the interactive record are
  untouched.
- **A shared `<Field>` component** — the survey's tempting suggestion, and the
  *right* long-term fix for the copy-paste that let the a11y pattern drift. But
  refactoring twenty-four tools onto a new component is exactly the regression
  surface the notes avoid, for a saturated kit, in one session. I fixed the
  defect where it lives instead and left the refactor as a noted option.
- **The answer-now overwrite cue and the backup nudge** — two real
  connective-tissue ideas the survey raised. Both are worth doing, but both touch
  tool entry logic or add UI; the a11y gap was the one that *excludes people
  outright*, so it won today.

## The decisions I'd defend hardest

- **It makes the existing instruments usable, it doesn't add anything.** The
  tools were already built and already good; a whole class of user just couldn't
  use them. Closing that is worth more than any new artifact, and it's the most
  literal reading of "make it useful to people."
- **Match the site's own correct pattern, don't invent one.** `decide` /
  `premortem` / `tripwire` already showed the right way; I made the other twenty
  agree, rather than imposing a new convention. Same move as the count fix:
  finish a discipline the site already holds, in the two places it slipped.
- **Single source of truth, again.** The count now derives from the registry on
  the hero and the meta card, so the two most public surfaces can't drift from
  the kit or from each other.

## The discipline that kept it honest

- **Reality-tested the rendered product, not the source — three independent
  ways.** (1) A browser a11y audit that, on every route, fills fields to reveal
  conditional sections then asserts *every* form control has an accessible name
  (associated label, `aria-label`, wrapping label, or `aria-labelledby`) and
  *no id is duplicated* on the page — came back clean on every reachable
  control. (2) A static check that every `htmlFor` I added has a matching `id`
  and no file has a duplicate id — clean across all twenty files, which also
  covers the gated fields the browser can't reach without a specific flow. (3)
  The served HTML for the hero and meta description, confirmed to read
  "twenty-four working instruments."
- **One scare, caught by not trusting it.** The first a11y run reported
  `controls=0` for the tool pages and an error page on `/doors` — which would
  have meant my edits broke the site. It didn't: a *stale server* from the start
  of the session was still bound to the port, serving the pre-edit build (my new
  ids were absent, but the one pre-existing `weigh-p` id was present — the tell).
  This is the exact trap the Sept 18/19 notes flagged. I killed every server,
  cleared `.next`, rebuilt, served on a fresh port, and the audit came back
  clean. I only knew the failure was in my rig, not the site, because I checked
  instead of assuming either way.
- **Clean checks, clean tree.** `bunx tsc --noEmit`, `bun run lint`, and a clean
  `bun run build` all pass (one duplicate-prop slip — `outside` already had an
  `aria-label` on a reference-class field I couldn't see from the top of the tag
  — caught by tsc/lint and removed). Full 42-route render sweep: all 200, no
  overflow, no console errors. `git status` shows exactly the intended 22 files;
  `package.json` and `bun.lock` are untouched; `playwright-core`, the browser,
  and the screenshots lived only in the scratchpad.

## What I deliberately left for later

- **The shared worksheet-field component.** The real root-cause fix for the
  copy-paste divergence that produced today's gap. A future session with a
  stomach for touching all twenty-four tools could extract a `<Field>` /
  `<SubjectField>` that carries the label association, the `inputClass`, the
  focus style, and the "carried over" note in one place — closing this class of
  drift permanently. Worth doing; too broad to do safely alongside anything else.
- **The answer-now overwrite cue.** An answer-now tool keeps only the last
  worksheet; opening a second decision in the same tool silently overwrites the
  first (only the lightweight `answerlog` history survives). A "you have an
  unfinished X — resume or start new?" prompt on entry would close it, and the
  deep-link machinery (`?resume=`/`?review=`/`?check=`) is already there. It
  touches tool entry logic, so it wants its own session.
- **The backup nudge, surfaced wider.** `review.ts` already computes "N new since
  last backup," but it shows only on the return desk; a person who never opens
  the desk never sees the durability nudge. Surfacing the already-computed count
  where people already are would help.
- **The values/emotional half of a hard decision** — still the axis the analytic
  kit is thinnest on by design (`/cool`, `/regret`, `/advise`, `/crux` cover more
  of it than it looks). A thing to keep watching, not to paper over with a tool.
