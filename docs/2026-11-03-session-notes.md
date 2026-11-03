# Session Notes — November 3, 2026

## What I set out to do

Same brief: make the site a useful *instrument* for real people, not a
self-improvement site. I reread the last three sessions (`/collector`,
`/bailiff`, `/rent`) and their "left for later" lists, then looked for a gap
rather than a follow-up. The money-letters group covers bills, debts, a
landlord and purchases. It had nothing about **work**, which is where most
people's money comes from. Grepping "redundan" found one passing mention in a
playbook line.

The gap: **you're being made redundant, and there's a figure on the table**,
often with a settlement agreement to sign.

Why it passed the "curated, not exhaustive" bar:
- It's common, and more so in 2026 (restructures, AI-driven cuts).
- The usual mistakes are worth thousands. People judge the total by how big it
  feels and sign. Or they accept a month's notice when the legal minimum after
  eight years is eight weeks. Or they miss that pay in lieu still counts the
  statutory notice towards their service.
- **The rules are moving.** The Employment Rights Act 2025 doubles the
  tribunal time limit to six months for jobs ending from 1 October 2026. From
  1 January 2027 it cuts the unfair dismissal qualifying period to six months
  and removes the compensation cap. The weekly cap rose to £751 in April.
- It comes down to a formula, three lines and a split, and ends in an email
  and a deadline, which is what the site does well.

## Outside reading

gov.uk and legislation.gov.uk still don't resolve from the sandbox, so I
worked from search summaries (CIPP, law firms' 2026 rate tables, Acas
summaries, Browne Jacobson, Lewis Silkin, Mishcon) and kept only what agreed:

- **Statutory redundancy pay**: ½ / 1 / 1½ weeks per full year by age bands
  (under 22, 22–40, 41+), counted back from the relevant date, max 20 years.
  The weekly cap is **£751** in GB from 6 April 2026 (SI 2026/310), so the max
  is £22,530. It's **£783** in NI, and £719 in GB for 2025/26. A worked age-42
  example (19 × 1 + 1 × 1.5 = 20.5 weeks) confirmed that each year is rated by
  the age at its *start*, which is how the code does it.
- **s.145(5)**: if the employer gives less than statutory notice (e.g. pays in
  lieu), the relevant date is pushed to when statutory notice would have
  ended. That counts for the two-year test and the years count.
- **Tax**: the first £30,000 of genuine compensation is tax-free, and
  statutory redundancy pay uses up part of that band. PENP (notice in lieu) and
  holiday are taxed as pay.
- **ERA 2025**: six-month time limits for an EDT on/after 1 October 2026 (one
  source says breach of contract may stay at three months, so the tool doesn't
  promise six for contract claims specifically). Unfair dismissal needs six
  months' service for an EDT on/after 1 January 2027 (SI 2026/559), and the
  compensatory cap goes. I couldn't confirm the protective award going to 180
  days, so it's left out.
- **Settlement agreements**: they need an independent adviser to be binding,
  and the Acas Code suggests at least 10 calendar days to consider one.
- **The illusion of wealth**: Goldstein, Hershfield and Benartzi (*JMR* 53(5),
  2016). At smaller amounts a lump sum feels more adequate than the equivalent
  monthly income ($100,000 vs $639/month). It reverses at large amounts.
  Redundancy payments sit right in the range where the illusion works.

## The insight that shaped it

**The total hides the only question that matters.** A redundancy offer mixes
money you're owed anyway (statutory redundancy pay, notice, holiday) with
money that's actually being offered. When you're asked to sign a settlement
agreement, only the second part is buying anything: your claims. In the worked
example, £16,000 sounds like four months' salary, but £14,800 is owed anyway,
so the signature is priced at about £1,200. That's the headline the tool
gives: "Of the £16,000 offered, £14,805 is owed anyway. Your signature is
being bought for £1,195."

That is mental accounting used as a correction: open more jars, not fewer. It
is also BATNA: the alternative to signing isn't nothing, it's everything the
law already gives you. And the lump-sum illusion is why the tool turns the
total into **months of outgoings**. The essay is "The Price of Your
Signature".

## What I built

**`/redundancy`, "Made Redundant: Is the Money Right?"** (short: "Redundancy
pay"). It sits in the money-letters group after `/rent`.

- **Inputs**: GB or NI; trading or insolvent; employer name; date of birth,
  start, notice given, last day; how notice is handled (worked, garden leave,
  in lieu, unsure); contractual notice in weeks; pay (year, month or week);
  days a week; holiday entitlement, leave-year start and days taken; the
  offer total and redundancy line; settlement agreement yes/no; monthly
  outgoings.
- **The read** (`app/data/redundancy.ts`, pure functions):
  - the relevant date with the s.145(5) extension, full years, age, the cap
    by date and region, and the age-banded weeks;
  - notice = max(statutory, contract). With a worked notice cut short, the
    shortfall becomes its own "in lieu" line;
  - holiday accrued pro rata through the leave year, never below 5.6 weeks
    (capped at 28 days);
  - the owed-anyway lump vs the offer gives "short by", "matches", "on top" or
    "your signature is being bought for";
  - the £30k tax split, and the runway in months;
  - statuses: insolvent (Redundancy Payments Service at the capped rate,
    statutory notice only, holiday up to six weeks), short (< 2 years) and
    owed.
- **Letters**: the "ask for the breakdown" email, with your lines, the
  s.145(5) point, any shortfall, and the selection criteria and scores. For a
  settlement agreement, a reply that neither accepts nor refuses: the legal
  fee contribution, ten days, the breakdown, an agreed reference, and "of the
  £X, £Y is owed anyway".
- **Also on the page**: a two-tone bar showing owed-anyway vs on top; the
  dates (last day, the Acas or LRA deadline, the six-month written claim for
  statutory pay) with an `.ics`; "also worth knowing" (time off to look for
  work, the four-week trial, collective consultation at 20+, the selection
  scores, the 2027 qualifying change); what to keep; the line to keep; and
  hand-offs to `/walkaway`, `/debts` and `/monthly`.
- **Wired into**:
  - tools (and the group blurb), the router (`/find`: "I'm being made
    redundant…", then `/walkaway`), situations (the playbook: "You're being
    made redundant");
  - backup (`redundancy:v1`), search and the sitemap;
  - models (the essay is added to `batna` and `mental-accounting`) and
    writing groups;
  - `/now` (a new lead item; the oldest, the regroup note, dropped) and
    `SITE_UPDATED`.

## How I verified it

- A bun script ran 10 cases through the read:
  - the worked example; no offer; a short offer with a low redundancy line;
  - under two years with pay in lieu; under two years with notice worked;
  - a £120k earner aged 60 with 27 years (the cap, the 20-year limit, over
    £30k); age 21 (half weeks);
  - insolvent; NI; a January 2027 leaver with eight months' service.

  Reading the output, I fixed:
  - nested parentheses in the letter lines;
  - "£751 a week (capped at £751)";
  - the insolvent read using contractual notice and uncapped pay;
  - "By law you're owed at least £0" when notice is worked (the headline now
    names the notice paid as salary);
  - a runway of "0 months";
  - "£0 is redundancy compensation";
  - and, from the browser pass, a real bug: weeks of notice cut short weren't
    counted in the owed-anyway total, so an offer looked more generous than
    it was. They're now their own line.
- `bunx tsc --noEmit`, `bun run lint` (after `eslint --fix` for two entity
  spaces) and `bun run build` are clean.
- Headless Chromium at 375 px on `next start`:
  - `/redundancy`, `/tools`, `/now`, the essay, `/find`, `/search`,
    `/models`, `/playbook` and `/` all have scrollWidth 375 and no console
    errors;
  - I filled in a 2018 start, £42k, notice worked, an offer of £12,000 with a
    settlement agreement. The read showed the split;
  - "settlement agreement" in search finds `/redundancy`; `/models`, the essay
    and the homepage link to it.
- **Not done**: no real phone or screen reader, and no check against the 2026
  Limits Order or the ERA 2025 text (DNS-blocked). The figures rest on
  agreeing secondary sources.

## Calls I'd defend

- **Statutory notice beats the contract, and the tool says so out loud.** In
  the example, the letter said a month; the law says eight weeks. That one
  line is worth thousands, and most people never check it.
- **No coaching to "hold out".** The settlement paragraph says to judge the
  part on top against what you'd give up. Sometimes £1,200 is fair because
  there's no claim worth the name.
- **No tax estimate beyond the split.** Marginal rates, student loans and
  pension sacrifice vary too much. "A little less after tax" is honest, and a
  fake net figure isn't.
- **Holiday from the leave-year start, pro rata by calendar days.** That's the
  ordinary method. Irregular-hours workers (12.07% accrual) aren't modelled;
  the pay hint says to average 12 weeks.
- **Employee only.** Workers and the self-employed don't get statutory
  redundancy pay. The page says "for employees" rather than adding a status
  question.

## Left for later

- `/redundancy`:
  - irregular-hours holiday (12.07%);
  - enhanced scheme multipliers (e.g. "statutory × 2, uncapped");
  - pension contributions during notice;
  - a check of the figures against the Limits Order once gov.uk is reachable;
  - the protective award (90 → 180 days?) if confirmed.
- A "work" group may be worth starting if a second work tool comes (a
  disciplinary or grievance letter, holiday pay for a job you've left).
- Carried:
  - `/rent` fee figure, Wales/Scotland models, the rent review clause wording;
  - `/parking` → `/bailiff` link; `/bailiff` fee checker;
  - the homepage money-letters group (now ten names long);
  - `/collector`, `/catchup`, `/deposit`, `/flight`, `/debts` and `/scam`
    follow-ups;
  - a real screen-reader pass.
