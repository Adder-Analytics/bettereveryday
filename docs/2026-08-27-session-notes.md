# Session Notes — August 27, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture — and close
a real gap in the thing that already exists rather than bolting on a clever new
one. As on every prior day, I filled my context before choosing what to build,
and I did what the site preaches: I got the production build running in this
sandbox and **reality-tested the actual rendered behavior in a real browser**,
across desktop and phone widths, rather than trusting how the source reads.

I read the homepage and its hero (`DecideHero.tsx`), the toolkit registry
(`tools.ts`) end to end, the nav, the guided front door (`/find` and its
`FindClient`), the carry through-line (`carry.ts`), the decision home
(`decisions.ts`) and the return desk, the shared due-count read sides
(`journal.ts`, `premortem.ts`, `tripwires.ts`, `parked.ts`), and the last week
of session notes back through the calendar-export and decision-home work. I read
outside the code too — Emil Kowalski on the invisible details that decide whether
software feels finished, the register this site lives in.

## The gap I found — the site's whole spine reached every page but its two most useful signals did not

The site has grown extraordinarily connected *inside* the toolkit — carry,
peer-share, the decision home, the calendar export. But two of its most useful
things live on exactly one page each, and the one surface that *is* on every
page — the nav — carried neither.

**The guided front door was unreachable from the nav.** `/find` is the single
destination most useful to a person actually in a hard moment: answer a question
or two about the *shape* of the decision and be handed the one instrument for it,
your words carried in — not seventeen tools to read through under stress. It was
linked from the homepage and `/tools`, and nowhere else. So a person reading an
essay who realizes "I actually have a decision like this" had no one-click path
to the guided door from where they stood. This has been the most-repeated backlog
item across many sessions, deferred every time over one honest worry: *not a
fourteenth flat link*. Meanwhile the nav spent a slot on `/decide` — the decision
journal, which is just **one** of the toolkit's instruments, the only tool with a
dedicated nav link. And it sat right beside `/decisions`, so "Decide" and
"Decisions" — near-homographs pointing at unrelated things (one tool vs. your
whole archive) — read as a puzzle rather than a signpost.

**The "something's due" signal lived only on the homepage.** The whole site runs
on one loop: decide now, come back on the day to grade it. The homepage carries a
`ReviewDueBadge` — "2 things are due for review" — but a person reading, browsing
models, or working a tool got no nudge that a review or a tripwire check had come
due. The one surface present on every page said nothing about the debt the site
was holding for them.

## What I built — made the nav the decision loop's ambient spine

One file changed (`app/components/nav.tsx`), no new store, no new route, no new
dependency. The nav now carries both halves of the loop from every page: the
*entry* and the *return signal*.

- **The guided door takes the nav's decision slot.** The "Decide" item now points
  at `/find`, not `/decide`. This isn't a fourteenth link — it's the honest fix
  the deferrals were circling: a lone tool doesn't belong at nav level, but the
  toolkit's *entry* does. The nav now shows both of the kit's doors — **Tools**
  (browse every instrument by the moment you're in) and **Decide** (the guided
  door that routes you straight to one) — and the journal stays one click away
  from each of them, from `/decisions`, from the homepage, and from every essay
  bridge, exactly as all sixteen other instruments already are (it's referenced
  in 32 files; it loses nothing but a redundant slot). As a bonus it unpicks the
  Decide/Decisions clash: they now read cleanly as the **action** (start deciding)
  beside the **archive** (the calls you've saved). Link count stays at thirteen.

- **The "Review" item carries a live due count.** A compact accent badge on the
  return-desk link, folding in the *same four debts* the desk and the homepage
  badge count — journal reviews, pre-mortem checks, standalone tripwires,
  cooled-off decisions — read from the exact shared `countDue*` helpers, so the
  three surfaces can never disagree. It's read after mount and re-read on every
  navigation (answer something, move on, and the count drops), renders **nothing**
  on the server or first client paint (no hydration mismatch, no empty
  placeholder for the common case of nothing due), and appears only when the count
  is real — the same restraint the homepage badge shows. The count is decorative
  to assistive tech; the number is spoken through the link's `aria-label`
  ("Review — 2 due for review").

## The decisions I'd defend hardest

**Repoint, don't append.** Every prior session named the nav gap and stopped at
the same wall — *not a fourteenth flat link*. The resolution was never to find
room for one more; it was to notice that the slot was already misallocated. A
single tool sitting at nav level, while the toolkit's front door sat nowhere, is
the actual defect. Fixing *that* adds the front door and removes a confusion in
one move, and the link count doesn't rise. It's reversible in one line if the
site's owner would rather keep "Decide" on the journal — which is exactly why I
wrote the reasoning into the code and these notes.

**One counter, three surfaces, zero drift.** The nav badge invents no new notion
of "due." It calls the same four functions the return desk and the homepage badge
call. That's the discipline `decisions.ts` and `review.ts` already hold — read the
tools' own read sides; never re-derive — carried onto the nav. I verified in a
browser that the nav count and the homepage pill always show the same number.

**Ambient, not nagging.** The badge shows only when there's real debt, adds no
chrome when there's none, and never animates or interrupts. It's a signal you can
glance at, not a notification that grabs you — the same restraint the whole site
keeps around the return (the deep link stops at the form; it never becomes a
one-tap "mark reviewed").

## The discipline that kept it honest

- **Reuse over invention.** One file, no new store/route/dependency. Both changes
  surface machinery that already existed (the guided door; the four due counters)
  on the one surface that reaches every page.
- **Verified the behavior, not the source.** Three headless-Chromium passes
  against the served production build, all green:
  1. **Reachability (15 assertions):** from a deep reading page the nav "Decide"
     resolves to `/find` on desktop and in the mobile panel; no lone `/decide`
     slot remains; the link count is still 13; clicking/tapping it lands on the
     guided door; a full triage walk reaches a recommendation with the typed
     decision carried onto the handoff and the landed tool pre-filled; `/decide`
     still serves directly; the mobile panel closes after navigation. No page
     errors.
  2. **Due badge (across two stores):** empty state renders no badge and throws no
     hydration error; a due tripwire plus a due journal review sum to a nav badge
     of **2** on desktop and in the mobile panel; the `aria-label` speaks the
     count; the homepage pill and the nav badge agree; answering one drops the
     count to 1 on the next navigation; clearing the debt makes the badge vanish.
  3. **Combined smoke** after the badge refactor of the same nav maps: reachability
     still holds, no page errors.
- **`bunx tsc --noEmit`, `bun run lint`, and `bun run build` are all clean.**
- **Left the tree as I found it.** The headless browser I installed to verify
  (`playwright-core`) was removed from `package.json`/`bun.lock`; the committed
  diff is one source file plus these notes.

## What I deliberately left for later

- **The nav could gain light grouping.** Its own comment has long fretted that
  thirteen destinations "is a lot." Today's change makes the decision cluster
  (Decide · Decisions · Review) read as a coherent lifecycle, but the reading
  cluster and the toolkit cluster still sit as one flat wall. Grouping the mobile
  panel into labeled sections would help first-time legibility — a real but larger
  design change I left alone rather than depart from the site's flat-nav restraint
  under time pressure.
- **The due count refreshes on navigation, not live.** Answer a review inline on
  `/review` and the nav count updates when you next navigate, not the instant you
  answer — the same read-once-per-visit behavior the homepage badge already has. A
  `storage`/focus listener could make it live; it isn't worth the complexity for a
  signal you glance at, and it would be the same change on both surfaces.
- **The answer-now tools still keep only their *last* worksheet, not a log.**
  Unchanged from prior notes; a real named-and-saved log for an answer-now tool
  remains a careful per-tool write-path change for a future day.
- **A shared decision id remains the robust endgame** for the decision home, as
  the last several sessions set out — unchanged by today.
