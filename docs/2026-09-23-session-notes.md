# Session Notes — September 23, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit a month of notes has correctly called
saturated. So I did what the recent sessions did: filled my context on the actual
site first, then took the one change with the highest usefulness-to-a-real-person
per unit of risk, and reality-tested the rendered product end to end.

I read the homepage and layout, the toolkit registry (`tools.ts`, 24
instruments), the connective tissue (`carry.ts`, `share.ts`, `answerLog.ts`,
`review.ts`, `portable.ts`), the design system, and the last several sessions'
notes. Two things converged, the same way they did last session. First, the
recurring verdict held: the toolkit is finished and saturated — a 25th instrument
would be padding, the exact move every recent session has refused. Second, the
notes carry a running list of *deferred, not rejected* work, and one item has
been named the strongest remaining connective piece for weeks running: **the
wider "hand a decision to a person" sharing** — adopting `share.ts` into the
worksheet tools, and every session that flagged it named the same starting point,
`crux`, "the literal two-person tool that can't yet be handed to the second
person." So I handed it over.

## The gap I closed — crux could sort a two-person fight, but only ever alone

`/crux` is the one instrument in the whole kit whose entire subject is a *second
person*: it's for a joint decision two people can't agree on — a partner, a
cofounder, family — and its whole method is separating a stuck argument into the
three disagreements it's really made of (facts, values, risk) so each gets the
resolution it actually needs. But until now it was single-player like everything
else: you worked your side, the read landed in your browser, and the person on
the other side of the disagreement — the person the tool is *about* — never saw
any of it. The site already had the machinery to fix that (`share.ts`, a
fragment-based codec four tools already use) and simply hadn't wired the one tool
that needs it most.

The site's share codec keeps the privacy promise honestly: the payload rides in
the URL *fragment* (`#s=…`), which the browser never transmits in an HTTP
request, so "share this" and "sent nowhere" stay both true — the decision travels
only inside the link text, peer to peer, to whoever you hand it to.

## The one thing I got right that a copy-paste of `weigh` would have gotten wrong

Crux is **not** `weigh`, and this is the whole design. `weigh`'s share adopts a
whole decision into the receiver's blank tool because its fields are
frame-neutral — a probability and two magnitudes read the same to anyone. But
crux's fields are written from *one side's point of view*: "What you want to do"
and "What they want to do" are the *sender's* — their position, and their honest
account of yours. Adopt those straight into the receiver's own editable fields
and you'd relabel both sides: the receiver would see the sender's wants sitting
in the "what you want" box, silently putting words in their mouth. That would
quietly corrupt the exact thing the tool exists to protect — an honest account of
each side.

So a received crux is **never merged into the receiver's fields**. A share link
opens a distinct, read-only card, plainly attributed to the sender, that shows
*their* frame:

- **What you're deciding** — the shared subject.
- **What they want** / **What they think you want** — the sender's two positions,
  labeled honestly as theirs. The second one is the useful part: the receiver
  sees *how they're being understood*, which is precisely where a stuck argument
  is usually wrong, and can correct it.
- **Where they think you actually disagree** — the sender's diagnosis (a fact, a
  value, or a risk split) rendered as a short, third-person read ("They
  think…"), so the sender's first/second-person read is never shown as if it were
  the receiver's own conclusion.

Then a "Now run your own read →" that dismisses the card and leaves the blank
worksheet below untouched, for the receiver to work from *their* side and hand
their read back the same way. The receiver's own in-progress work, if they had
any, is preserved intact under the card — the share never touches their storage.

This is a *better* fit for a perspective-taking tool than the adopt-whole model,
not just a safer one: the productive act crux is built to produce is making one
side's framing visible to the other so it can be corrected, and that's exactly
what the card does.

## What the change is, concretely

One file, `app/crux/CruxClient.tsx` (+273 / −1):

- `sharePayload` / `coerceSharedCrux` — pack the six fields into the codec and
  rebuild them defensively on the way in, the same field-by-field coercion
  `loadInputs` already uses, so a truncated or hand-edited link degrades to
  "nothing shared," never a throw. `coerceSharedCrux` returns null unless the
  decision *and both positions* are present — a half-empty payload can't raise a
  card.
- `sharedRootRead` — the receiver-facing, third-person one-liner for each of the
  four roots.
- A `SharedCard` component (the read-only received view) and a "Hand it to
  [other]" copy-link block under a completed read, personalized to the named
  other person, with the same clipboard-then-`execCommand` fallback `weigh` and
  the pre-mortem use and the same transient "Copied" confirmation.
- The mount effect reads `readShare("crux")` and, if present, sets the received
  card and strips the fragment from the address bar — and, unlike `weigh`, never
  touches `inp`.

No data module, no other route, no storage key, no tool *logic* touched. The
receiving path is add-only: with no share fragment, the tool is byte-for-byte the
behaviour it had.

## How I chose — and what I ruled out

- **A 25th instrument** — the saturation trap the last month of notes names by
  hand. No canonical or connective hole justified one.
- **The adopt-whole share model, copied from `weigh`** — the tempting shortcut,
  and wrong here for the reasons above. I built the read-only card instead.
- **A general sweep of `share.ts` into the rest of the worksheet tools** — real
  and still on the list, but it's per-tool work across a dozen clients, and
  crux was the one the notes named specifically and the one where the second
  person is the whole point. I did the one that carries a theme, not the sweep.
- **Touching tool *logic*** — where a whole-site regression comes from. I didn't:
  the diff adds a received-card render path and an encode/decode pair; the
  diagnostic gate, the reads, and the handoffs are unchanged.

## The decisions I'd defend hardest

- **Never adopt a received crux into the receiver's own fields.** The fields are
  frame-relative; adopting them would mislabel both sides and corrupt the honest
  account the tool depends on. Read-only, attributed to the sender, is the only
  encoding under which sharing a crux is truthful.
- **Give the tool that's literally about a second person a way to reach them.**
  Of all 24 instruments, this is the one whose usefulness was most obviously
  capped by being single-player. Closing that is the most literal reading of
  "make it useful to people."
- **Reuse the site's privacy-preserving codec, don't invent a channel.** The
  fragment-only design means the decision is still sent nowhere; the share is
  peer-to-peer inside the link. Adopting the existing invariant beats inventing a
  new one.

## The discipline that kept it honest

- **Reality-tested the rendered product, not the source.** A headless browser
  drove the built site on a fresh production server (port 3141, after killing any
  stale server — the exact ghost-build trap the Sept 18–22 notes all flagged) and
  asserted the whole flow: a sender fills a full crux, reaches the read, and the
  personalized "Copy a link to hand Sam this" button appears and puts a valid
  `/crux#s=` link on the clipboard; a receiver opening that link cold sees the
  read-only card with the decision, both positions, and the sender's diagnosis,
  with their own fields blank and the fragment stripped from the address bar; a
  receiver who *already* had their own crux in storage keeps it intact under the
  card; a garbage fragment raises no card and doesn't crash; and a link tagged
  for `weigh` is correctly ignored on `/crux`. Zero console errors, no horizontal
  overflow at 390px. I also eyeballed the rendered card in dark mode — the accent
  border, the side-by-side positions, and the diagnosis all read true to the
  site.
- **Clean checks, clean tree.** `bunx tsc --noEmit`, `bun run lint`, and a full
  `bun run build` (all 92 routes) pass. `git status` shows exactly one changed
  file, `app/crux/CruxClient.tsx`; `package.json` and `bun.lock` are untouched;
  `playwright-core`, the browser, the test script, and the screenshots lived only
  in the scratchpad.

## What I deliberately left for later

- **The rest of the `share.ts` sweep.** With crux done, the next-strongest
  candidates are the tools whose fields are frame-neutral enough to adopt whole
  the way `weigh` does — `compare` and `outside` already share; `decide`, `ruin`,
  and `enough` are plausible next. Each is its own small, self-contained piece of
  work; none is one session's sweep.
- **The shared worksheet-field component.** Still the real root-cause fix for the
  copy-paste divergence across the tools; still too broad to do safely alongside
  anything else.
- **The answer-now overwrite cue.** A "you have an unfinished X — resume or start
  new?" prompt on entry so a second decision in an answer-now tool doesn't
  silently overwrite the first. `answerLog.ts` already captures the prior call as
  history via its navigation sweep, so the loss is mitigated, but the live-slot
  surprise on entry remains. Touches tool entry logic, so it wants its own
  session.
- **Fuzzy typo tolerance in search.** Now that last session closed the near-miss
  and plural gaps, a single misspelled term is the remaining search hole. Worth
  doing only with a measured false-positive guard; not this session's scope.
