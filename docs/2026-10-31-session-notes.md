# Session Notes — October 31, 2026

## What I set out to do

Same brief: make the site a useful *instrument* for real people, not a
self-improvement site. I reread yesterday's notes (the regroup into "what's in
front of you") and the recent tools. The first group, *A letter, bill or
message wants money*, now has the clearest scent on the site, so I looked for
the most common letter it didn't cover yet. Grepping "statute", "limitation"
and "debt collector" found only passing mentions inside `/parking`.

The gap: **a debt collector chasing a debt from years ago.** A company that
bought an old card, loan or phone debt writes asking for the balance, or for
"a token £1 a month to show goodwill".

Why it passed the "curated, not exhaustive" bar:
- It's common. Debt purchase is a big industry, and "statute-barred" questions
  are a steady topic on every UK debt charity's site.
- The usual mistake is expensive and permanent: a small payment or a signed
  form made before the limit runs out restarts six years. The other instinct,
  binning everything, fails badly once court papers arrive, because the limit
  is a defence you have to raise.
- It comes down to one date plus a few exceptions, which the site can do well,
  and it ends in a letter and a deadline.

## Outside reading

As in earlier sessions, the official and charity sites (legislation.gov.uk,
the FCA handbook, National Debtline, StepChange) don't resolve from the
sandbox, so I worked from search summaries and kept what agreed across
sources:

- **Limitation Act 1980, s.5** (England and Wales) and the **Limitation (NI)
  Order 1989**: six years for simple contract debts. A payment, or a signed
  written acknowledgement, restarts the clock (s.29). Once a debt is barred, a
  later payment doesn't revive it (s.29(7)); I confirmed that wording from a
  legislation.gov.uk search result.
- **Scotland** (Prescription and Limitation (Scotland) Act 1973, s.6): five
  years, and then the debt is *extinguished*. The FCA handbook says so
  explicitly.
- **FCA CONC 7.15**: a firm mustn't threaten court on a debt it knows is
  barred, and must stop demanding payment once the customer says they won't
  pay because it's barred. The summaries gave different paragraph numbers, so
  the tool cites "CONC 7.15" without a paragraph.
- **Exceptions**: CCJs (one over six years old needs permission to enforce);
  council tax once there's a liability order; most HMRC tax; SLC student
  loans; benefit overpayments taken from benefits; and mortgage shortfalls
  (six years for interest, twelve for capital). The sources disagreed on the
  details for council tax and benefits, so the tool gives these as caveats
  instead of computing them. For a Scottish mortgage shortfall it computes
  nothing: it says the period is disputed and sends you to advice.
- **CCA s.77/78**: £1 for a copy of a regulated credit agreement. The prove-it
  letter uses it.
- **Court timings** (the Civil Procedure Rules, from memory, consistent with
  the guides): a claim form sent by post is deemed served on the second
  business day after posting. Then you have 14 days to respond, or 28 to file
  a defence if you acknowledge first. The Pre-Action Protocol for Debt Claims
  gives 30 days to reply to a letter of claim. Bank holidays aren't counted, so
  the tool says to treat the earlier date as the deadline.
- **Foot-in-the-door** (Freedman and Fraser, 1966), for the essay: people who
  agreed to a small window sign were far more likely to accept a big lawn sign
  later.
- **What debt buyers pay**: the only figures I found ("2–10%", "pennies in the
  pound") came from petitions, so the essay says "by campaigners' estimates".

## The insight that shaped it

**Judge a small ask by what it's worth to the person asking, not by what it
costs you.** A pound a month costs you almost nothing. To the debt buyer it's
worth another six years in which it can sue for the full balance. When the two
values are far apart, the small ask is a big ask in disguise. That became the
essay "What Is the Small Ask Worth to Them?", linked from incentive
structures. It pairs with "Whose Delay Was It?", which already mentioned "a
debt that resurfaces after six years of silence".

The second idea behind the design: **a time limit is a defence, not a
shield.** So the read puts court papers first and always leads with a date.
It's the one place the tool says "act now" rather than "slow down".

## What I built

**`/collector`, "An Old Debt, a New Letter: Do You Still Owe It?"** (short:
"Old debt, new letter"). It sits in the money-letters group after `/catchup`.

- **Inputs**:
  - the debt, who's writing, and the amount (optional);
  - where: England and Wales, Scotland, or Northern Ireland;
  - the kind of debt (8 options);
  - court status (nothing, a letter of claim, a claim form, a judgment, or not
    sure), with its date;
  - whether you recognise it;
  - your last payment, or when it first went unpaid, or "don't know";
  - optionally, the last time you admitted it in writing.
- **The read** (`app/data/collector.ts`, pure functions): the clock starts at
  whichever is later, the last payment or the last written admission.
  - The statuses are barred, close, live, partial (a mortgage shortfall),
    unknown, unclear (a Scottish mortgage shortfall), judgment and exempt.
  - "Close" means within three months either side of the line, because the
    clock often starts at the default rather than the last payment.
  - The stage (no court yet, a letter of claim, or a claim form) sets the
    headline and the deadline.
- **Letters**:
  - the statute-barred letter, with "extinguished" wording for Scotland;
  - the prove-it letter, which asks who owns the debt, for a statement, the
    default date, any court action, a CCA copy for credit, and an ID check if
    you don't recognise the debt. It says it isn't an acknowledgement;
  - an affordable offer, for debts still in time and for judgments;
  - wording for a limitation defence, when a barred debt reaches a court claim.
- **Also on the page**:
  - a clock bar from the start date to the line;
  - a reply-by box with an `.ics` that has a three-day alarm;
  - what to keep;
  - free advice: National Debtline, StepChange, Citizens Advice, Advice NI,
    and Breathing Space in England and Wales;
  - the line to keep, and hand-offs to `/scam` and `/debts`.
- **Wired into**: tools, the group blurb, the router (`/find`), situations (the
  playbook), backup (`collector:v1`), search, the sitemap, models, writing
  groups, `/now` (a new lead item; the oldest, `/deposit`, dropped) and
  `SITE_UPDATED`.

## How I verified it

- A bun script ran 13 cases through the read and printed the headline, body
  and letter for each:
  - barred, in England and Wales and in Scotland;
  - close; live; restarted by a written admission; unknown;
  - a claim form; a letter of claim when you're not sure the debt is yours;
  - a mortgage shortfall (partial); HMRC; a judgment;
  - a debt you don't recognise; a debt never paid.

  Reading the output, I fixed three things: the wording when the clock starts
  at "first went unpaid" or a written admission; a "6 years" in digits in the
  prose; and a worked-example sentence with the arithmetic wrong (a payment "a
  year earlier" would already have been past the line).
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- Headless Chromium at 375 px on `next start`: `/collector`, `/tools`, `/now`,
  the essay, `/find` and `/search?q=statute` all have scrollWidth 375 and no
  console errors. I filled in a claim-form case in the browser: a form issued
  on 28 October gave a deadline of Friday 13 November. I also looked at the
  full-page screenshot.
- **Not done**: no real phone or screen reader, and no check against primary
  legal text beyond the search summaries above.

## Calls I'd defend

- **No "wait it out" advice for a debt still in time.** That read says plainly
  that a claim filed before the line ends in a judgment, and points to a
  budget, an offer and free advice. The tool tells people their rights; it
  doesn't coach them to dodge debts they owe.
- **A three-month "close" band rather than an exact date.** Wrongly reading a
  debt as barred costs far more than a cautious "ask for the dates".
- **No deadline worked out for court papers in Scotland or Northern
  Ireland.** Their procedures differ, and the form prints the date anyway.

## Left for later

- `/collector`:
  - a path for Scotland's simple procedure;
  - a CPR 31.14 request for the documents, for claims that are close or
    unknown;
  - bank holidays in the deadline sums;
  - the reply-by date as a return-desk kind.
- Carried from yesterday:
  - `/find` and the playbook using the five group labels;
  - the homepage showing three tools per group plus "N more";
  - `/catchup` business tariffs; `/parking` bank holidays; `/deposit` DPS
    window;
  - `/flight` voucher reply; `/debts` 0% end date; `/scam` share card;
  - `/sell` many-items; `/lend` check-offs; the `/monthly` pay-in-four `.ics`;
  - a real screen-reader pass.
