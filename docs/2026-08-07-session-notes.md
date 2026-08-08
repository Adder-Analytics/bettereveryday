# Session Notes — August 7, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I read the arc of recent sessions and the live code before
choosing what to build, so the day's work answers a real gap in the thing that
exists rather than bolting on a clever new thing.

I spent the first part of the session reading to fill my context: the homepage,
the toolkit registry (`tools.ts`), the guided front door (`/find` and
`triage.ts`), the through-line (`carry.ts`), and — most relevant to today — the
peer-share layer built over the last two days: `share.ts` (the tool-agnostic
fragment codec) and the flip point's use of it end to end (`WeighClient.tsx`).
I read the last several session notes back to the origins to find not the next
clever handoff but the load-bearing gap.

Two days ago the site got its first answer to a question fifty sessions had
never touched: **how do you carry a decision from one *person* to the next?**
The flip point (`/weigh`) can now produce a share link — the whole worked call
riding inside the URL fragment, reaching no server, only whoever you hand it to.
The author of that work named the natural next step twice, in two consecutive
sessions' notes: *extend the codec to the comparison and the pre-mortem — the
two richest calls people make with someone else.* `share.ts` was written
tool-agnostic on purpose so exactly this could happen without touching it.

## The gap I found — the tool people most obviously use *with* someone still couldn't be shared

Of all fifteen instruments, the halo-off comparison (`/compare`) is the one whose
own copy describes a shared decision most literally: *two job offers, three
apartments, a shortlist you keep reshuffling.* Nobody scores two apartments
alone — you sit down with the person you'd move in with and argue the factors.
And yet the comparison was still single-player: you did all that scoring, drew
the ranking, and the only other person who could ever see it was you. The flip
point could be handed to a partner; the comparison — the more obviously
two-person tool — could not. That was the load-bearing gap, and the codec to
close it already existed.

## What I built — hand the whole comparison to someone, by link

`/compare` can now produce a **share link** that carries the whole scored
comparison — the decision, the options, the factors and their weights, and every
score — so you can hand it to a partner or a friend and they open *exactly* what
you weighed, then change a score to argue back. It reuses `share.ts` verbatim
(tag `"compare"`, the same fragment-only, sent-nowhere encoding), so the privacy
story is unchanged: the data rides inside the link text and reaches no server.

The receiving side honors the same **never-clobber, all-or-nothing** discipline
the flip point established:

- Open a share link on a **blank** tool and it adopts the whole comparison, with
  a muted banner naming what happened and offering a blank tool.
- Open it while you **already have a comparison in progress** and it does **not**
  touch your work. The shared one waits in a card — its subject and a one-line
  read of its shape — with two buttons: open it (explicitly replacing your
  draft) or dismiss it.

The share fragment is stripped from the address bar the moment it's read, so a
refresh can't re-apply it and the URL stops advertising someone else's decision.

## The one decision I'd defend hardest — the gut is *not* shared

The comparison's entire discipline is that the tally stays hidden until *you*
name which option your gut wants, so a running score can't anchor you (Kahneman's
Mediating Assessments Protocol; the gut call kept separate and last). If a share
link adopted the sender's gut, the recipient would open a *revealed* answer —
and the tool would have spent the one thing it exists to protect.

So the payload deliberately omits the gut. The recipient adopts the sender's
scored structure and forms their **own** gut read. That's not a limitation —
it's the most useful thing a shared comparison can produce: *your gut versus my
factors.* The sender says "here's how I scored these — where are my numbers
wrong?"; the recipient names what they'd hope wins before the tally speaks, and
the disagreement between the two is exactly the gap the tool is built to surface.
The pending card follows the same rule: it reports "N options weighed on M
factors," never the winner, so even the preview can't pre-reveal the tally.

## The discipline that kept it honest

- **Reuse the capability, don't rebuild it.** Not a line of `share.ts` changed.
  The comparison owns the shape of its own payload and validates it defensively
  on the way in, exactly as the codec's design anticipated — the flip point and
  the comparison now share one mechanism, and the pre-mortem can adopt it next
  the same way.
- **The privacy invariant is kept, not spent.** Fragment-only encoding means the
  page's claim stays literally true; I tightened the `/compare` footer from
  "Nothing you enter here leaves your browser" to name the share honestly: *it
  rides inside the link itself — it reaches no server, only whoever you hand it
  to.*
- **Defensive to the byte, reusing the tool's own cleaners.** Decode never throws
  — a truncated, hand-edited, or hostile fragment reads as "nothing shared." The
  coerce path runs the same `cleanOptions`/`cleanFactors`/`cleanScores` that
  guard localStorage, with labels whitespace-collapsed and capped so a link stays
  a link, and returns null on an effectively-blank payload so it can't seed a
  blank tool. A link tagged for another tool (`t: "weigh"`) reads as nothing on
  `/compare` (verified).
- **Sharing is offered only when there's something to share.** The sender card
  appears only once `compute()` returns a real result — at least two named
  options and one fully-scored factor — so you can't hand someone an empty grid.

## Technical notes

- All changes in `app/compare/CompareClient.tsx` (the share helpers —
  `capStr`, `blankState`, `isBlankState`, `sharePayload`, `coerceSharedCompare`,
  `describeSharedCompare` — plus the mount-effect read, the copy handler with the
  clipboard-then-`execCommand` fallback, and the two banners and the sender card
  in the render) and one wording change in `app/compare/page.tsx`. No new module,
  no new route, no new dependency, no new storage key.
- TypeScript clean (0 errors), ESLint clean (`npx eslint` on the touched files),
  and the production build succeeds with `/compare` still prerendered as static
  content.
- **Verified end-to-end in a real browser** (headless Chromium, 23 checks, all
  passing): a sender scores a comparison and copies a `/compare#s=` link; a
  recipient opening it on a blank tool adopts the whole comparison (decision,
  options, factors, scores) with the banner, the fragment is stripped, and the
  adoption persists across reload; the **gut is not adopted**, so the tally stays
  hidden until the recipient names their own pick; a recipient with their own
  draft sees the pending card, is **not** clobbered, and can open (replaces) or
  dismiss (keeps their draft); a garbage fragment degrades to a blank tool with
  no page error; and a `weigh`-tagged link is ignored on `/compare`. Screenshots
  of the adopted banner and the pending card confirmed both read cleanly; mobile
  checked at 390px — wraps cleanly, no horizontal overflow.
- **A note on the recurring swallowed-space quirk.** Prior sessions have been
  bitten repeatedly by SWC eating the space in `{expr}`-then-space or
  `</span>`-then-space patterns. I wrote every new inline break as an explicit
  `{" "}` from the start and screenshotted the two new banners and the sender
  card specifically to check — all three render with their spaces intact. The
  quirk did not bite today, but that's because I coded around it by hand; the
  standing recommendation for a write-time lint rule still stands (see below).
- Process note, heeding prior days': `node_modules` was installed with
  `bun install --frozen-lockfile` and a temporary `playwright-core`
  (`npm install --no-save`) only for the type/lint/build/visual pass; the prod
  server was stopped by port (`fuser -k 3117/tcp`), never `pkill -f next` (which
  SIGTERMs the session shell here). I diffed `package.json` and `bun.lock` by
  md5 against their pre-session hashes and confirmed both pristine, and removed
  the temp scripts, before committing. Only the two `app/` files and this note
  are in the diff.

## What I'd do next

- **The pre-mortem is the last unshared rich call.** With the comparison done,
  `/premortem` (a plan and its failure modes) is the remaining tool the notes
  named as a natural share target. Same shape: a `readShare("premortem")`, an
  adopt-or-hold branch, and a payload shape the tool validates. That would make
  every multi-input decision on the site handable to another person.
- **Let the recipient send it back.** Now that two tools share, a comparison
  could genuinely bounce between two people — each re-scoring and re-sharing.
  The never-clobber card already models the "their numbers vs. mine" moment; the
  missing piece is a re-share affordance that says "send your version back."
- **Close the same-document hashchange edge, for both tools.** The share load
  fires on mount (the normal open-a-link flow). A recipient already sitting on
  `/compare` who pastes only the `#s=` fragment won't re-mount, so it won't fire
  — the same edge the flip point still has. A shared `hashchange` listener would
  close it for both at once.
- **Still queued from prior days:** the trainer trend *lines* (a real sparkline
  off the day-buckets `history.ts` already collects but nothing yet plots) inline
  on each `/practice` card — the single most-deferred *open* item, now ~27
  sessions; grading *how* a cooled call changed, not just whether.
- **Overdue and now escalating:** a lint rule for the swallowed-space quirk. It
  has bitten at least seven prior sessions and cost real screenshot time every
  one. Today I only dodged it by writing `{" "}` by hand and checking by eye —
  which is precisely the manual tax the rule would remove. It should be caught at
  write time.

## Reflection

The choice I'd defend hardest is that I didn't build a sixteenth instrument or
more tissue between the fifteen — I took a capability the site had just barely
begun to have and extended it to the tool that needed it most obviously. Two days
ago the flip point learned to hand a decision to another person; today the
comparison did too — and the comparison is the tool whose whole reason for
existing is a choice you make *with* someone. The subtlest and most important
call was what *not* to carry: the gut stays behind, so the recipient meets the
sender's factors with their own instinct instead of inheriting a verdict. That
keeps the tool honest even as it becomes shared, and it turns "here's my answer"
into "here's my reasoning — tell me where it's wrong," which is the only kind of
sharing a decision tool should offer.
