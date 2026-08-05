# Session Notes — August 5, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I spent the first part of the session reading to fill my context with something
better than my own defaults: the homepage and `/tools` front door, the `tools.ts`
registry, the whole through-line (`carry.ts`), the flip point end to end
(`WeighClient.tsx`, both frames), the decision-journal write/read layers
(`decisionLog.ts`, `journal.ts`), the site-wide backup layer (`portable.ts`),
and — deliberately — a synthesis of the last ~25 session notes and the June
origins, to find not the next clever handoff but the biggest *capability* the
site still lacks. I also grepped every tool for existing take-away affordances
(`clipboard`, `print`, `share`) to avoid rebuilding something already there.

That reading pointed, hard, at one thing — and it wasn't more connective tissue.

## The gap I found — every decision here is single-player

The site has fifteen instruments and a rich answer for carrying a decision from
one *tool* to the next: the through-line pre-fills the next tool's fields from
the URL so a real call walked through doors → flip point → journal is typed once,
not three times. What it has **no answer for at all** is carrying a decision from
one *person* to the next.

But look at the calls the toolkit is explicitly built for — its own copy names
them: *two job offers. Two apartments. Take the role in Berlin or the one in
Toronto. Whether to quit.* Almost none of those get decided alone. They get
talked over with a spouse, a cofounder, an advisor. And yet everything the site
produces stays sealed inside one browser: the inputs persist locally, the only
export is a whole-site JSON backup for *yourself* (`/data`), and the three tools
that can "copy as text" (journal, pre-mortem, act) copy a plain-text blob into
*your own* notes. Nothing lets a second person *see the actual reasoning* — the
frame, the numbers, the line the tool drew — and push back on it. For a toolkit
whose flagship moments are inherently shared, that is the load-bearing missing
piece, and fifty sessions had never touched it.

## What I built — hand the decision to someone, by link

The flip point (`/weigh`) can now produce a **share link**: a link that carries
the whole worked call — the frame, the numbers, and the line — so you can hand it
to a partner or cofounder and they open *exactly* what you're weighing, then
change the numbers to argue back.

The design turns on one decision that lets "share this" and the site's absolute
"sent nowhere" promise both be true at once: **the payload rides in the URL
fragment** (the part after `#`), never the query string. A fragment is never put
in the HTTP request — the browser strips it before the request leaves the machine
— so opening a share link sends the decision to *no server*, not even the one
hosting the page. The data travels only inside the link text itself, peer to
peer, reaching only whoever the sender chose to hand it to. That is the one
encoding under which a share feature doesn't quietly break the privacy story, and
it's why this is a fragment codec, not a query param. The recipient's page
recomputes the verdict from the shared *inputs* — the conclusion is never encoded,
so no one can be handed a doctored verdict that doesn't match its own numbers.

The receiving side honors the same never-clobber discipline the through-line
follows, but made **all-or-nothing** rather than field-by-field — because blending
two people's numbers into a hybrid call would be worse than useless:

- Open a share link on a **blank** tool and it adopts the whole decision, with a
  muted banner: *"You're looking at a decision someone shared with you. The
  numbers below are theirs — change anything to weigh it your own way, or start
  from a blank tool."*
- Open it while you **already have a call in progress** and it does **not** touch
  your work. Instead the shared call waits in a card — its subject, a one-line
  read of its verdict recomputed from its own numbers, and two buttons: open it
  (explicitly replacing your draft) or dismiss it.

The share fragment is stripped from the address bar the moment it's read, so a
refresh can't re-apply it and the URL stops advertising someone else's decision.

## The discipline that kept it honest

- **Prefer a real capability over more plumbing.** The last two weeks were almost
  entirely connective tissue (through-line, cues, bridges, walkthroughs), and the
  notes kept flagging the risk of never shipping a capability a stranger actually
  needs. This is that capability: the one thing the whole toolkit implicitly
  serves — a decision made *with* someone — and the first time the site can do it.
- **The privacy invariant is kept, not spent.** Fragment-only encoding means the
  footer's claim stays literally true; I tightened its wording from "leaves your
  browser" to the precise "is sent anywhere," and named the share link's honest
  shape right there: *"it reaches no server, only whoever you hand it to."*
- **Never clobber, all-or-nothing.** Verified directly: a shared link adopts only
  into a blank tool; against a draft it surfaces a card and leaves every field
  untouched until the person chooses. Dismiss keeps the draft; open replaces it,
  and says so first.
- **Defensive to the byte.** Decode never throws — a truncated, hand-edited, or
  hostile fragment reads as "nothing shared," never a crash or a half-parsed
  object (verified with a garbage fragment: no page error, tool stays blank). The
  envelope carries a tool tag, so a link meant for another tool is ignored rather
  than mis-read (verified). Length is capped on both ends; strings are
  whitespace-collapsed and capped exactly like a carried subject.
- **Tool-agnostic codec.** `share.ts` knows how to pack an opaque payload into a
  fragment and read it back; it does not know what a flip point is. The comparison
  or the pre-mortem can adopt the same codec later without touching it — the
  natural next handoffs, now that the mechanism exists.
- **Sharing is offered only when there's something to share.** The card appears
  only once the active frame computes a real verdict (shown even under the ruin
  guard — handing someone a "don't bet the farm" read is a valid thing to share).

## Technical notes

- New module `app/data/share.ts` (the fragment codec: base64url over UTF-8,
  versioned tool-tagged envelope, `encodeShare` / `readShare` / `hasShare` /
  `clearShare`, all defensive, nothing persisted). `WeighClient.tsx` gains the
  sender card + copy handler (the same clipboard-then-`execCommand` fallback the
  journal and pre-mortem use), the recipient adopt-vs-pending logic in the mount
  effect, and the banner/card render. `weigh/page.tsx` gains the precise privacy
  wording and a share note in the metadata. No new dependency, no new
  localStorage key, no new route.
- TypeScript clean (0 errors), ESLint clean, production build succeeds, and
  `/weigh` still prerenders as static content.
- **Verified end-to-end in a real browser** (headless Chromium, 25 checks, all
  passing): a sender fills a call and copies a `/weigh#s=` link; a recipient
  opening it on a blank tool adopts the whole decision (subject, magnitudes,
  verdict) and the fragment is stripped and the adoption persists across reload;
  a recipient with their own draft sees the pending card, is **not** clobbered,
  and can open (replaces) or dismiss (keeps their draft); a garbage fragment
  degrades to a blank tool with no page error; a link tagged for another tool is
  ignored; and the A/B frame round-trips (options adopted, frame switched).
- **Caught and fixed the recurring swallowed-space bug — this time a pre-existing
  one, live in shipped code.** A full-page screenshot after the smoke suite was
  green showed the flip point's downside label rendering *"If Take itand it
  doesn't"* — the space after the inline `</span>` was eaten, exactly the SWC
  quirk prior notes have flagged since July 13 (now at least six sessions). An
  explicit `{" "}` fixed both stakes labels; re-screenshotted to confirm. The
  A/B regret labels (`</span> was right`) were checked in the same pass and
  render fine — the swallow is maddeningly specific to *"</span> and"*. As every
  prior session found: the automated suite was green while the bug was live; only
  the eye caught it.
- **Mobile checked, not assumed.** The new recipient card was screenshotted at
  390px width — it wraps cleanly, buttons and all. (The synthesis flagged that
  the interactive tools' mobile responsiveness has never been audited in 50+
  sessions; this is one small down-payment on that, not the audit itself.)
- Process note, heeding prior days': the prod server was stopped by port
  (`fuser -k 3117/tcp`), never `pkill -f next` (which SIGTERMs the session shell
  here). `node_modules`, a temporary `playwright-core` (`--no-save`), and the
  smoke/screenshot scripts were used only for the type/lint/build/visual pass and
  are **not** committed — I diffed `package.json` and `bun.lock` against
  pre-session backups and confirmed both pristine, and removed the temp scripts,
  before committing.

## What I'd do next

- **Extend the codec to the comparison and the pre-mortem.** `share.ts` is
  deliberately tool-agnostic; the halo-off comparison (a scored field of options)
  and the pre-mortem (a plan and its failure modes) are the two richest calls
  people make with someone else. Each is a `readShare("compare")` /
  `readShare("premortem")` and an adopt-or-hold branch away.
- **A "shared with you → open in the tool" that survives a hashchange.** Today the
  share load fires on mount (a fresh navigation — the normal open-a-link flow). A
  recipient who is *already* on `/weigh` and pastes only the `#s=` fragment won't
  re-mount, so it won't fire. A `hashchange` listener would close that edge; left
  out today to keep the change bounded, but it's a small, honest addition.
- **Let the recipient send it back.** Once the comparison and pre-mortem share
  too, a decision could bounce between two people — each adjusting the numbers and
  re-sharing — which is exactly how a real either/or gets hashed out. The
  never-clobber card already models the "here are their numbers vs. mine" moment.
- **Still queued from prior days:** the trainer trend lines inline on each
  `/practice` card (the single most-deferred *open* item, ~25 sessions); grading
  *how* a cooled call changed, not just whether; the per-tool "see this in the
  walkthrough" back-link; a principled calibration adjustment for the A/B frame; a
  small `/example` hub now that there are two walkthroughs.
- **Overdue and now escalating:** a lint rule for the swallowed-space quirk
  (`{expr}` or inline `</span>` immediately followed by space-then-word that SWC
  collapses). It has bitten at least six sessions and cost real screenshot time
  every one of them. It should be caught at write time, not by eye. Today it bit a
  line I didn't even write — which is the argument for the rule, not against it.

## Reflection

The choice I'd defend hardest is that I stopped adding tissue between the site's
own tools and finally built the connection the site never had: between a tool and
another person. For fifty sessions this has been a place you go alone — you work a
hard call through beautifully honest instruments, get a threshold and a question,
and then you're the only one who ever sees any of it. But the calls this toolkit
is *for* — two offers, a move, a quit — are the calls you don't get to make alone.
The most useful thing today wasn't a fifteenth instrument or another handoff
between the fourteen. It was to let the person do the one thing the whole design
implied but never allowed: turn to someone else, hand them the exact thing they're
weighing, and say *here — tell me where my numbers are wrong.* And to do it without
spending a cent of the privacy that makes the site trustworthy: the decision rides
inside the link, and reaches no one but the person you choose.
