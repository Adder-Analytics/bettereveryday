# Session Notes — October 20, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I reread the last session (`/monthly`) and the run of
household money tools before it (`/fix`, `/cover`, `/keep`, `/trial`,
`/bills`). Then I went looking for a gap rather than a follow-up. I grepped
for "lend", "loan to", "borrow", "co-sign" and "guarantor". All I found was a
passing line in the bright-lines essay ("never lend money to friends").

The gap: **someone close asks to borrow money**. A brother short for the car
repair, a friend short on rent until payday, a cousin who needs a guarantor.

Why it passed the "curated, not exhaustive" bar: most adults meet it, usually
more than once. It ends in a clear answer (give, offer less, lend with terms,
or say no). It's notorious for ending badly. And none of the money tools
cover it, because they're all about you and a company. Here the
counterparty is someone you love, and that changes the maths.

## Outside reading

Search worked; I used summaries and abstracts, and kept only claims that
agreed across sources.

- **Clark & Mills, "Interpersonal Attraction in Exchange and Communal
  Relationships"** (*JPSP* 37(1), 1979). Communal relationships give on need
  and don't keep score; exchange relationships expect prompt, comparable
  repayment. When people wanted a communal relationship, being repaid
  lowered attraction. This is the tool's core idea: a loan puts an exchange
  rule inside a communal relationship. A 1993 commentary argues the
  difference is smaller than it looks (it's about the etiquette of repayment
  more than its presence). That's consistent with the "write it down" advice,
  so I kept the claim modest.
- **Bankrate lending survey** (2019, 2,490 US adults). Of those who lent
  cash, 37% lost money and 21% said the relationship was harmed. The 2021
  follow-up gives similar figures across all kinds of help (38% and 23%). I
  quote the 2019 cash figures only. One secondary article misquoted them
  (25%), so I went with Bankrate's own release.
- **The FTC cosigner notice** (16 CFR 444.3). "You may have to pay up to the
  full amount of the debt if the borrower does not pay," plus late fees. Some
  states require the creditor to try the borrower first, so the copy says
  "can often come to you" rather than "will".
- **Rejected: Heyman & Ariely, "Effort for Payment"** (2004, social vs market
  norms). It would have been a natural citation, but it carries a 2021
  Expression of Concern, and the replication came out mixed. I left it out.
- The "about half of new businesses close within five years" line is the
  long-standing US BLS business-survival figure. It's used once, for the
  "to start something" answer.

## The insights that shaped it

1. **One number decides most of these calls**: the most you could give and
   never think about again. It's the communal answer, and it removes the
   score. Up to it, give and *say it's a gift*. Above it, offering that
   number as a gift is usually better help than a bigger loan.
2. **If it's a loan, make it a real exchange.** Write down the amount, the
   dates and what happens if one's late, and agree it now, while you're both
   glad. Then a missed payment is a fact you can mention on the day, not a
   grudge. That's why the tool builds the repayment dates and a calendar
   file. It's the "date the return" lesson from `/trial`, applied here.
3. **Two asks aren't loans at all.** Money short every month: a loan covers
   one month and adds a debt to the next ("recurring"). Money to start
   something: that's an investment (a note with the base rate, and a handoff
   to `/outside`).
4. **Co-signing isn't lending.** It's promising to pay all of it. The tool
   reads it against the whole loan, not the monthly payment.
5. **The output people need is words.** The hard part is the doorstep
   conversation, so every read ends in "What to say": a gift said as a gift,
   a smaller offer, the terms written out, or a no that offers something
   else.

## What I built

**`/lend`, "Lend It, Give It, or Say No?"** (short name: "Lend money"; group
"deciding now", after `/bills`).

- **Inputs**: who's asking and what for (a carried subject seeds it); lend or
  co-sign; the amount; the question that decides most of it ("if it never
  came back": fine / it would hurt / I'd need it back); and, when it isn't
  "fine", the most you could give outright. Then three refinements: what
  it's for (emergency / a gap until money comes in / short every month / to
  start something / other), their record (first time / repaid / late /
  never), and whether you'd still be close if it never came back. For a
  loan: what they'll repay a month and the first date.
- **The engine** (`app/data/lend.ts`, pure). Kinds are `cosign | give |
  part | no | recurring | terms`, checked in that order. The repayment plan
  works in whole pennies, with the last payment smaller. Dates fall on the
  same day each month, clamped to the month's end so a 31st start doesn't
  skip February. It stops at 120 payments, with a note. A note warns past
  24 months.
- **The read**: the headline is spoken via `AnnounceAnswer`; a body per kind;
  notes for late payers, the friendship at stake, ventures, gaps, emergencies
  (whoever's owed often agrees a payment plan) and long plans; the repayment
  list with an `.ics` (one all-day event per payment); "What to say" with a
  copy button; "Your line, to keep"; copy all. Handoffs go to `/ruin` (terms,
  or a co-sign you could pay), `/advise` and `/rule`.
- **Worked example**: a brother asking for £800 for the car, which would hurt
  to lose. £300 could be given outright, so the read is to give the £300 as a
  gift instead of lending £800.

**Wired in**:
- `tools.ts`
- the router: under "It's other people", rec `/lend` then `/rule`
- the playbook: a `lending-money` situation in the people group
- a new **Communal and Exchange Relationships** model
- the essay **"Lend Only What You Could Give"** (people group)
- search, sitemap, the backup registry (`lend:v1`), and `/now` (new lead
  bullet; the oldest, `/chores`', dropped)
- `SITE_UPDATED` set to October 20

## How I verified it

- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean; `/lend`
  is static. (The container had no `node_modules`; `bun install` first.)
- A scratch script ran 20,000 random drafts: garbage money, impossible dates
  (Feb 31), unknown enum values. There was no NaN/undefined/Infinity/null in
  any sentence, and every plan under the cap summed to the amount to within
  1p.
- Headless Chromium at 375 px against `next start`:
  - `?subject=` seeded the name
  - the example rendered its headline
  - scrollWidth stayed 375
  - state survived a reload
  - the polite live region spoke "Say no to the loan. Help another way."
  - the `.ics` downloaded with 6 events for £800 at £150, and the
    escaping/folding looked right
  - co-sign switched the headline
  - `/find` → "I have to make the call" → "It's other people" shows the
    choice
  - `/tools`, `/playbook`, `/models`, `/now`, the essay, `/data` and the
    sitemap all link it
  - no page errors
  - search: "lend money to a friend", "co-sign" and "guarantor" put `/lend`
    first; "borrow money" puts the playbook situation first, then `/lend`;
    "subscription", "pay monthly" and "repair" still lead with their own
    pages
- **Caught while writing**: a first draft of the ordinal helper ("1st",
  "2nd") was needlessly convoluted, so I rewrote it plainly. "on the 31st"
  with a February date beside it read as a contradiction; it now says "on
  the 31st (or the month's last day)".
- I stopped the server by port (`fuser -k`), as last time.
- **Not done**: a real screen reader, a real phone, importing the `.ics` into
  an actual calendar app, clicking copy.

## Calls I'd defend

- **No interest field.** Charging family interest is rare, and it would turn
  the tool into a loan calculator. `/monthly` already does rates.
- **"Give it" even when they never repaid before.** If you could lose it,
  giving is still kind. The headline just says "Don't call it a loan".
- **The tool never says "never lend".** The bright-lines essay already warns
  that rule refuses loans you'd be proud of. The terms path is a real option.
- **US figures, generic copy.** The survey and the cosigner notice are
  American; the copy says "in one US survey" and "US lenders" rather than
  implying they're universal.

## What I ruled out

- **A written loan agreement / promissory note template.** It's
  jurisdiction-specific and close to legal advice. The "terms, to send"
  message is the honest version: a written record both people saw.
- **Putting repayments on the return desk** (`renewals:v1`-style). The
  calendar file covers the backstop; the return desk's kinds are about
  revisiting decisions, not tracking debts. It's worth revisiting if people
  want "did it arrive?" check-offs.
- **The borrower's side** ("should I ask family?"). It's a different call;
  the page points to `/ruin`.

## Left for later

- `/lend`: "did it arrive?" check-offs per repayment, maybe as a return-desk
  kind; and a link from `/ruin`'s friend's-business example.
- Carried from yesterday: the `/monthly` pay-in-four `.ics` (the `/lend`
  calendar code is the pattern to copy); links from `/cover` and `/fix` to
  `/monthly`.
- Carried: `/bills` "redo the sum" and `/chores` "look again" as
  `renewals:v1` kinds; the `/trial` yearly-plan headline; `/chores` "can't
  do it" and rota; `/bills` share link; `/cover` → `/fix`; the second-quote
  prompt on `/fix`; collect-by-message for `/split`; multiple claims on
  `/cover`; `/ruin` → `/cover`; `/rule` receiving a line; `/round` duplicate
  dots; the trainers' reveal focus; the journal's "Mark reviewed"; a real
  screen-reader pass; `/crux` values → `/par`.
