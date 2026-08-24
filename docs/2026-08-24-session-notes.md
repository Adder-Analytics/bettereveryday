# Session Notes — August 24, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture — and close
a real gap in the thing that already exists rather than bolting on a clever new
one. As on every prior day, I filled my context before choosing what to build.

I read the homepage and its hero (`DecideHero.tsx`), the toolkit registry
(`tools.ts`) end to end, the nav, the carry through-line (`carry.ts`), the
peer-share codec (`share.ts`), the guided front door (`/find`), the decision home
and return desk, and the last several sets of session notes back to their
origins. I read outside the code too — Emil Kowalski's notes on the invisible
details that decide whether software feels finished, the register this site lives
in. And I did what the site preaches: I got the production build running in this
sandbox and **reality-tested the actual rendered behavior in a real browser**
rather than trusting how the source reads.

## The gap I found — the site can hand a decision to another person, but only for three of its tools

The site has two kinds of connective tissue, and this session is about the second
one. The **carry through-line** (`carry.ts`) hands a decision from *tool to tool*
so you type it once. The **peer-share codec** (`share.ts`) hands a whole worked
decision from *person to person* — a link that encodes the frame and the numbers
into the URL *fragment*, which no browser ever sends to a server, so "share this"
and "sent nowhere" are both true at once. It's the site's answer to the fact that
the calls people actually bring to a tool like this — two job offers, a move, a
hire, whether to quit — are rarely made alone.

`share.ts` is deliberately tool-agnostic: it packs an opaque payload and tags it
with the tool it's meant for, and each tool owns and validates its own payload
shape. Its own comment names the growth path — "the comparison or the pre-mortem
can adopt the same codec later without touching this file" — and three tools have:
the **flip point** (`/weigh`), the **comparison** (`/compare`), and the
**pre-mortem** (`/premortem`).

But the single instrument whose output is *most* worth handing to someone else
couldn't be shared: the **reference-class forecast** (`/outside`). Its whole
reason for existing is to make one hard-to-defend thing plain — the *class* behind
a number. "You think three months; here are five comparable projects that took
five to sixteen." That is exactly the artifact a manager, a client, or a partner
needs to see, and exactly the number they'll want to argue back on by adding a
case of their own. The tool computed it, persisted it, and logged it to the
journal — but had no way to put it in someone else's hands. So a person who worked
the outside view on a real timeline and wanted to show the base rate to the people
it affected had to screenshot it or retype it. The connective tissue reached the
comparison but not the forecast that most needed it.

## What I built — taught the reference-class forecast to share

The whole change lives in `/outside`, adopting the existing codec exactly the way
`/compare` and `/weigh` already do. No change to `share.ts`; one honest comment
fix in it.

- **`OutsideClient.tsx`** gained the same four pure helpers the other sharers
  carry — `sharePayload` (encode the frame, the sealed instinct, every comparable
  case and its real outcome, and where you landed — labels capped so a link stays
  a link), `coerceSharedOutside` (rebuild a full `Inputs` defensively, reusing the
  same field-by-field coercion `loadInputs` trusts for localStorage, so a
  truncated or hand-edited link degrades to blank fields, never a throw),
  `isBlankInputs` (the gate — a share adopts a whole forecast **only** into a
  blank tool), and `describeSharedOutside` (the one-line read for the "someone
  shared this" card).
- **The mount effect** now reads a shared forecast after the carry seed: if the
  tool is blank it adopts the whole thing (a banner says so); if the tool already
  holds work — its own, or a carried subject — the shared forecast waits in a card
  the person can open (replacing their draft) or dismiss. Then it strips the
  fragment from the address bar so a refresh can't re-apply it. This is the exact
  all-or-nothing discipline the comparison uses, for the exact same reason: never
  blend two people's numbers into a nonsense hybrid.
- **A "Show someone the class" panel** at the foot of a completed forecast copies
  a link to the clipboard (with the same clipboard-then-`execCommand` fallback the
  other tools use), gated on the same condition as the "log it" panel, so the
  affordance only appears once there's a real forecast to hand over.
- **`share.ts`'s comment was corrected** — it still said "today only the flip
  point reads these." Leaving it stale would re-plant the same confusion for the
  next reader, the exact discipline prior sessions upheld when they fixed the
  `carry.ts` comment.

## The decisions I'd defend hardest

**Share the whole forecast, not a hidden subset.** The comparison deliberately
omits its *gut* from the share, because the comparison's discipline is that you
name your gut blind to the tally — so handing the recipient the sender's gut would
spend the one thing the tool protects. The reference-class forecast has a
superficially similar move (you seal your instinct *before* seeing the cases), but
it isn't the same situation. The recipient of a shared forecast isn't being asked
to make a fresh blind estimate of their own; they're *reviewing yours*. The sealed
number and the class it sits against **are** the artifact under discussion —
hiding either would leave nothing to argue with. So the whole forecast travels.
I wrote that reasoning into the code comment so the next person doesn't "fix" it
to match the comparison.

**Adopt the codec, don't touch it.** `share.ts` stayed unchanged except for the
one stale comment. Every defensive property that makes sharing safe — the
fragment-only transport, the length cap, the decode-never-throws contract, the
tool-tag filter so a `/compare` link reads as nothing on `/outside` — is inherited,
not re-implemented. The new code is one tool learning to speak a protocol three
others already speak.

**The blank-tool gate protects work in progress.** A forecast you're in the
middle of is never silently overwritten by a link someone sends you. If the tool
holds anything — even just a subject carried in from another tool — the shared
forecast is held in a card, not adopted. I verified this both ways in a browser.

## The discipline that kept it honest

- **Reuse over invention.** Two files changed (one tool, one comment). No new
  store, no new route, no new dependency, no change to the shared codec. The
  mechanism to hand a decision to another person already existed; this teaches it
  the one high-value payload it was missing.
- **Verified the behavior, not the source.** Two passes, both green:
  1. **A direct-logic harness, 18 assertions**, driving the **real** `share.ts`
     codec: a full worked forecast round-trips through `encodeShare → readShare →
     coerceSharedOutside` byte-faithfully (question whitespace-collapsed, unit,
     sealed instinct, all five cases with their outcomes, the adjustment); a link
     tagged for another tool reads as nothing here; garbage, truncated, and empty
     fragments all decode to null without throwing; a blank payload can't seed a
     blank tool; partly-malformed objects degrade field by field.
  2. **A headless-Chromium reality-test, 12 assertions**, against the served
     production build: a blank tool adopts a shared forecast (banner shown, the
     question in the field, the base-case reveal rendered from the shared cases,
     the fragment stripped from the URL) with **no page errors on mount**; a tool
     that already holds work shows the *pending* card instead, preserves the
     existing work, and adopts only when "Open it in the tool" is clicked; a cold
     `/outside` visit shows no share UI at all.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean**, and
  `/outside` still prerenders as a static route.
- **Left the tree as I found it.** The headless browser I installed to verify
  (`playwright-core`) was reverted out of `package.json`/`bun.lock`; the committed
  diff is two source files and nothing else.

## What I deliberately left for later

- **Three tools can be shared but don't yet advertise it to a receiver the way a
  cold link deserves.** The share *reading* is robust; what a first-time recipient
  of an `/outside` link sees is a full, correct forecast with a banner — good. A
  future nicety would be a tiny "someone shared this with you" affordance on the
  homepage for people who land on a share link without knowing what the site is.
  Not load-bearing; the tool page already explains itself.
- **The answer-now tools still keep only their *last* worksheet, not a log.**
  Unchanged from prior notes — `/outside` persists one in-progress forecast,
  overwritten next time. Today's share at least means a completed forecast can be
  *kept elsewhere* (a link in your notes is a durable copy) even before a
  multi-record log exists. A real named-and-saved log for an answer-now tool
  remains a careful per-tool write-path change for a future day.
- **The `/find` guided door still isn't in the nav.** Still the most-repeated
  backlog item, still wanting a touch of restraint about nav crowding rather than
  a fourteenth flat link, still for a future day.
- **A shared decision id remains the robust endgame** for the decision home, as
  the last several sessions set out — unchanged by today.
