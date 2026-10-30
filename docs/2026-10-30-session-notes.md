# Session Notes — October 30, 2026

## What I set out to do

Same brief: make the site a useful *instrument* for real people, not a
self-improvement site. I reread the last two sessions (`/catchup`, `/parking`)
and their "left for later" lists. Then, before looking for another gap, I
looked at how a newcomer *finds* the tools that already exist. That turned out
to be the bigger problem.

## What I noticed

The last month's work (`/scam`, `/refund`, `/flight`, `/deposit`,
`/parking`, `/catchup`, `/debts`, `/monthly`, `/lend`, `/sell`) is the most
practically useful part of the site. All of it had been added to one group,
"You're facing a decision right now", which had grown to **38 of the 46
tools**. On `/tools` that meant 38 cards in a row, with the parking ticket at
number 26. The page's intro still said "a handful of working instruments".
The homepage hero named only the flip point, the pre-mortem and the
consequence trace, so someone holding a parking ticket had no sign the site
could help with it.

Every new tool made the list a little longer and the front door a little worse.
The site had been adding instruments faster than it was making them findable.

## Outside reading

I wanted a principle rather than a taste call, so I read about navigation:

- **Information scent** (Pirolli and Card's information-foraging theory at
  Xerox PARC, as written up by Nielsen Norman Group). People choose a link by
  how well its label predicts what's behind it, and scent is *relative to what
  they came for*. "Food" has strong scent for cheese and none for face cleanser.
  "You're facing a decision right now" has strong scent for someone stuck
  between two jobs and almost none for someone holding a £70 parking charge,
  who doesn't think of it as "a decision". NN/g also warns against vague
  category labels: a label should describe what's inside it.
- **GOV.UK's design principles**: "start with user needs" and "do less". The
  related "top tasks" finding (a council site where 85% of traffic went to 200
  of 4,000 pages, quoted on GovLoop) supports putting the few things most
  people arrive for at the top, not in strict authoring order.

I worked from search summaries, not the full articles; the notes above are
the points that agreed across them.

## The insight that shaped it

**Group by what's in front of the person, not by the kind of thinking the tool
does.** The site's original groups were by stage in a decision's life (now,
committing, acting, coming back). That works for the reasoning tools. It fails
for the life-admin tools, because a letter demanding money isn't, to the person
holding it, a "decision stage". It's a thing on the table. So a label like "A
letter, bill or message wants money — or you're owed some" has strong scent for
exactly the people those six tools serve.

## What I did

- **Split the 38-tool group into five** (`app/data/tools.ts`):
  - *A letter, bill or message wants money — or you're owed some*: scam,
    refund, flight, deposit, parking, catchup (6)
  - *A money call: spend, borrow, lend, keep or sell*: monthly, debts, lend,
    cover, fix, sell, keep, worth, walkaway (9)
  - *Deciding with other people*: bills, split, chores, crux, round (5)
  - *Weighing a decision of your own*: doors, ruin, widen, weigh, compare,
    par, outside, enough, stop, trace, quit (11). The "start by asking how
    much thought it deserves" line moved here with `/doors`.
  - *When you might not be seeing it straight*: test, incentives, cool,
    regret, advise, later, rule (7)

  The three later-stage groups (commit, make it happen, come back) are
  unchanged. The money-letters group goes first because it has the most
  concrete scent and the most urgent deadlines.
- **A guard**: `resolveToolGroups` now throws at build time unless every tool
  sits in exactly one group. Before this, a new tool left out of `toolGroups`
  would silently disappear from `/tools` and the homepage.
- **`/tools`**: a "Jump to" list of the groups with counts, so the page can be
  scanned at phone width. The intro now gives the real count instead of "a
  handful", and the meta description names the groups.
- **Homepage hero**: names concrete uses ("from a parking ticket, a refund or a
  catch-up bill to a job, a move or a debt") instead of three abstract tool
  names. The homepage tool list reads from the same groups, so it regrouped
  automatically.
- **`/now`**: a new lead item about the regroup; the oldest item (`/flight`)
  dropped. `SITE_UPDATED` → October 30.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- Headless Chromium at 375 px on `next start`: `/`, `/tools` and `/now` have
  scrollWidth 375 and no page errors. `/tools` shows the eight groups in order
  with all 46 tool cards, and the "Jump to" link goes to `#money-letters`. I
  looked at a screenshot of the first group.
- **Not done**: no real phone or screen reader. The old anchor
  `/tools#deciding-now` no longer exists; nothing in the repo linked to it,
  and outside links would land at the top of the page, which is harmless.

## Calls I'd defend

- **No new tool today.** A 39th card in a 38-card list helps fewer people than
  making the existing 38 findable.
- **`walkaway` (negotiating a number) went under money**, not "with other
  people": the person reaching for it thinks "salary / car price", not "a
  group decision".
- **`advise` and `later` went under "not seeing it straight"**: both are
  about a distortion in your own view (closeness, a far-off week looking empty)
  rather than about weighing options.

## Left for later

- `/find` (the router) and the playbook could use the same five labels as
  their first question, so the three front doors speak one language.
- The homepage lists every tool name in each group; with 46 that's still a
  wall of links. Consider showing three per group plus "and N more".
- Carried over: `/catchup` business tariffs and refund-due branch; `/parking`
  bank holidays and the new private code once in force; `/deposit` DPS window
  and joint tenancies; the `/flight` voucher reply; `/debts` 0% end date; the
  `/scam` share card; `/sell` many-items; `/lend` check-offs; the `/monthly`
  pay-in-four `.ics`; a real screen-reader pass.
