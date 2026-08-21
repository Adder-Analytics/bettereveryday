# Session Notes — August 21, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I filled my context before choosing what to build, so the day's
work answers a real gap in the thing that already exists rather than bolting on a
clever new one.

I read the homepage, the toolkit registry (`tools.ts`) front to back, the guided
front door (`/find`), the carry through-line (`carry.ts`) that threads a decision
from tool to tool, the peer-share codec (`share.ts`), the return desk
(`review.ts`) and the persistence model under it, the nav, and the last several
session notes back to their origins. I read outside the code, too — Emil
Kowalski's design-engineering notes on the invisible details that decide whether
software feels finished, which is the exact register this change lives in.

And I did what this site preaches and rarely gets to do to itself: I got the
build working in this sandbox (it couldn't be reconstructed on some prior days),
served it, and **reality-tested the rendered output in a real browser** — driving
the actual click-through with Playwright against the live server, not trusting how
the JSX reads. That's what caught the gap in the first place and what proved the
fix door-to-door.

## The gap I found — the through-line reached every tool but one, and lied about it

The site's central connective mechanism is the **carry through-line**
(`carry.ts`): you type your decision once — "what are you deciding?" — and it
rides from tool to tool in the URL, pre-filling each destination's own field so
you never retype it. Fourteen tools read it; every handoff link is built with the
same `withSubject(href, decision)` helper. It's the thing that makes the kit feel
like one instrument instead of, in the module's own words, "fourteen forms
wearing a trench coat."

`carry.ts` states a hard rule it learned from a prior day's mistake: **a handoff
carries the subject ONLY when the destination actually reads it. A param the
other end ignores is a dead param that implies a bridge that doesn't fire.** The
comment named the tripwire as a deliberately "subject-less destination" that
tools should link to plainly.

But that had quietly stopped being true. The **tripwire** (`/tripwire`) — the
tool you reach for at one of the most important moments, when you've made a hard
call and are setting the signal that will tell you to reconsider — read its own
ad-hoc pre-fill params (`?guard=`, `?signal=`, `?on=`) but **not** the
through-line's `subject`. And three tools were already trying to hand it a
decision:

- **`/regret` (Ask Your Older Self)** built its tripwire link with
  `withSubject("/tripwire", decision)` — appending `?subject=…`. The tripwire
  ignored it. **A live dead param**: the site's own named anti-pattern, shipped.
  You'd play a decision forward to three horizons, land on "Arm the trough," click
  it — and arrive at a blank guard field, retyping the decision you just worked.
- **`/quit` (Would You Start It Today?)** carried the kill-criterion signal and
  date to the tripwire but dropped the *decision itself* — the very thing being
  quit — so its guard field came up blank too.
- **`/test` (Could You Be Wrong?)** linked to a bare `/tripwire`, carrying
  nothing.

So the through-line reached every tool that holds a decision except the last one,
and at that last one the site was violating the exact discipline `carry.ts`
preaches. That's the seam I fixed.

## What I built — wired the tripwire into the site's one carry convention

Four files, all reuse, no new store, no new param, no dependency.

- **`/tripwire` now reads the carried `subject` as its guard**
  (`TripwireClient.tsx`). One import (`readCarriedSubject`) and one branch in the
  mount effect: an explicit `?guard=` still wins (the consequence trace and the
  if-then planner compute a *precise* guard and should keep it), and the carried
  subject fills the guard only when no explicit one was given — the same
  never-clobber rule every carry reader follows. `readCarriedSubject` normalizes
  and caps the value, so a hand-edited link can't seed an essay into the field.
- **`/regret` needed no change at all** — its existing `withSubject("/tripwire",
  …)` handoff, dead until today, now lands. Fixing the receiver fixed the sender
  for free, which is the whole point of routing through one convention.
- **`/quit` now carries the decision** (`QuitClient.tsx`): a `guard` prop threaded
  into the verdict block (`inp.thing` live, `EXAMPLE.thing` in the worked
  example), wrapped onto the existing tripwire link with `withSubject` so the
  signal, date, *and* decision all ride across.
- **`/test` now carries the decision**: its bare `/tripwire` became
  `withSubject("/tripwire", subject)`, matching the `withSubject("/decide", …)`
  link right beside it.
- **`carry.ts`'s comment was corrected** to match reality: the tripwire is no
  longer a subject-less destination; the return desk is the only genuinely
  subject-less one left. Leaving the comment stale would have re-planted the same
  mistake for the next reader.

The result: a decision worked in the older-self tool, the quit-or-stay tool, or
the reality-test — then armed as a tripwire — is typed once, not twice, at exactly
the moment retyping stings most.

## The decisions I'd defend hardest

**Fix the receiver, not each sender.** The tempting patch was to change `/regret`
to pass a bespoke `?guard=`. Instead I taught the tripwire to read the site's one
carry key, `subject`. That fixed `/regret` with zero changes to it and means any
future tool that does `withSubject("/tripwire", decision)` — the obvious thing to
write — just works. The gap wasn't three broken links; it was one tool standing
outside the convention. So I moved the tool inside it.

**Explicit guard wins.** `/act` and `/trace` hand over a *computed* guard that
isn't the raw decision — the effect that turned against you, the plan being
protected. Those are better guards than the generic subject, so an explicit
`?guard=` takes precedence and the carried subject is only a fallback. I verified
this precedence in the browser rather than assuming it.

**Match the tool's existing behavior, don't gold-plate.** The tripwire reads its
pre-fill params without clearing them from the URL afterward. I considered
clearing the `subject` param to keep the address bar clean (as other carry readers
do), but that path also strips the `from` param that `/act`, `/quit`, and
`/trace` rely on for their handoff attribution — a behavior change to working
code, to buy a cosmetic cleanup. The guard field is editable and holds no
persisted draft, so a lingering `?subject=` can't clobber anything. I left it,
matching the tool's own established pattern. Minimal beats clever.

## The discipline that kept it honest

- **Reuse over invention.** One import, one branch, one prop, two link wrappers,
  one corrected comment. No new store, route, param, data model, or dependency.
- **Rendered, not trusted.** I installed a headless browser and wrote a
  verification pass that (1) confirmed `?subject=` pre-fills the guard, (2)
  confirmed an explicit `?guard=` still wins over it, (3) confirmed a plain
  `/tripwire` visit leaves the guard blank, (4) confirmed the full quit-shape URL
  lands guard *and* signal, and then (5) drove `/regret` end-to-end — set the
  three horizons to the "dip" J-curve, clicked "Arm the trough," and read the
  decision back out of the tripwire's guard field on the page it landed on. All
  five passed. `bunx tsc --noEmit`, `bun run lint`, and `bun run build` are clean.
- **Left the tree as I found it.** The browser I installed to verify
  (`playwright-core`) was reverted out of `package.json`/`bun.lock` — the
  committed diff is four source files and nothing else.

## What I deliberately left for later

- **A decision could still use a home of its own.** The carry through-line threads
  a subject from tool to tool, and `/review` gathers the *scheduled* returns, but
  there's still no single "everything I've worked on this one decision" view. The
  last several sessions all noted this; it stays a larger, schema-coupled build
  (the persisted stores are keyed by tool, not by a shared decision id — a robust
  version wants that id, not a fuzzy subject match). Noted again for a future day.
- **The `/find` guided door still isn't in the nav.** It's prominent on the
  homepage and linked from `/tools`, but a returning visitor deep in the site has
  no top-level way back to it. The nav is already twelve links — its own comment
  frets about the crowding — so this wants a small restructure, not just a
  thirteenth link. A safe, contained job for a future day.
