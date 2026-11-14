# Session Notes — November 14, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last two weeks of notes. Each session added one
situation-specific tool, and the "left for later" lists kept carrying the
same small cross-links for days (`/parking` → `/bailiff`, `/rent` →
`/repairs`, `/deposit` → `/repairs`, `/redundancy` and `/leaving` →
`/dismissed`). So today was two things: one new tool where the gap was
biggest, and clearing that backlog of links.

The gap: the work group checked sick pay, dismissal, redundancy money and
the final payslip, but not the line on **every** payslip that nobody reads,
the **tax code**. It passed the "curated, not exhaustive" bar because:

- **It affects nearly everyone on PAYE, and errors are common and quiet.**
  An emergency code after a job change, BR on a main job, a company car
  still in the code, a missing Marriage Allowance letter, a second job with
  its own allowance. Each costs a few pounds per payslip, so nobody notices.
- **There's a cliff with a date.** A cumulative code corrected before
  5 April refunds everything over-taken in one payslip. After that it's a
  P800, which since 2024 mostly has to be *claimed* (HMRC has reported
  hundreds of thousands of unclaimed PAYE refunds). And 2022/23
  overpayments can only be claimed until 5 April 2027.
- **It's arithmetic, not judgment.** The code is a formula, so a tool can
  read it exactly, which a friend or a forum can't do.

## Outside reading

gov.uk, LITRG and legislation.gov.uk still don't resolve from the sandbox
(I tried LITRG directly: DNS-blocked). I worked from search summaries of
payroll guides, ICAEW/ACCA/CIOT summaries, Royal London's and FreeAgent's
rate tables and snippets of LITRG and HMRC's PAYE manual, and kept what
agreed:

- **2026/27**: Personal Allowance £12,570 (frozen), tapered over £100,000;
  rUK bands 20% on £37,700, 40% to £125,140, 45% above; Wales the same.
- **Scotland 2026/27**: starter and basic bands up 7.4%: 19% to £16,537,
  20% to £29,526, 21% to £43,662, 42% to £75,000, 45% to £125,140, 48%
  above. (One Royal London table repeated 2025/26; the Scottish Budget
  summaries agree on the above.)
- **Codes**: number × 10 (+9 in the tables); L, M, N, T; S and C prefixes;
  BR, D0, D1 (and SD0–SD3 in Scotland), 0T, NT; K codes with the 50%
  overriding limit; W1/M1/X non-cumulative. Emergency code 1257L W1/M1/X.
- **Starter checklist**: A → 1257L cumulative; B → 1257L W1/M1; C → BR;
  none → 0T.
- **Coding out** owed tax only under £3,000; turned into an allowance cut
  at the marginal rate.
- **Refunds**: in-year via payroll once the code is corrected; after the
  year a P800, mostly claimed (app, Personal Tax Account, or cheque since
  May 2024); four-year limit (2022/23 by 5 April 2027, 2023/24 by 5 April
  2028).
- **State Pension 2026/27**: £241.30 a week, £12,547.60 a year, just under
  the allowance.
- **Not settled, so left out or flagged**: one adviser says multi-year
  P800 handling changed again in August 2026 (left as "most have to be
  claimed"); exact PAYE-table rounding (the tool says "a pound or two");
  pension flexible-withdrawal forms P55/P53Z/P50Z (from memory, given as a
  doubt, not a computed path).

**Ideas**:
- **Donella Meadows**, *Thinking in Systems* (2008): stocks and flows; a
  stock is the memory of its flows.
- **Booth Sweeney & Sterman**, "Bathtub Dynamics: Initial Results of a
  Systems Thinking Inventory" (*System Dynamics Review* 16(4), 2000):
  graduate students at an elite business school did poorly at sketching a
  bathtub's level from its inflow and outflow; education, age and origin
  didn't predict who could. (I couldn't get per-question figures, so the
  site says "many couldn't".)
- I reread the site's Half-Life of Facts and Notches models. Today's idea
  sits beside them: not a rule that changed, or a line you're near, but
  whether the system *remembers*.

## The insight that shaped it

**Before asking how bad a mistake is, ask whether the system keeps a
running total, and when the total closes.** A cumulative tax code
recomputes the whole year at every payslip, so a mistake is free to fix
until 5 April. An M1 code settles each month alone, so the allowance for
months you didn't work is simply never used. And a forgiving system with a
closing date behaves like an unforgiving one if you only look after it
closes.

So the tool's centrepiece is **both versions of your year, payslip by
payslip**: tax to 5 April as coded against tax with the code your details
give, and how much of the gap has already gone (which comes back in one
payslip if fixed now). The worked example: a new job on 1 October after
six months off, £2,400 a month, no P45, the middle starter-checklist box
ticked, 1257L M1. About £1,621 by April against £364: **£1,257 too much**,
£270 of it gone on the first payslip.

## What I built

**`/taxcode`, "Is Your Tax Code Right?"** (short: "Tax code"), first in
the work group, now titled "Work: the payslip, off sick, let go, or a job
ending".

- **The code, read aloud** as soon as it's typed: each part (prefix,
  number, letter, K, BR/D0/0T/NT, W1/M1/X or "cumulative") in plain words.
  Parser accepts lower case, spaces and slashes ("s1257l m1", "0T/M1").
- **Inputs**: where your main home is; main job, second job (with the main
  job's pay) or pension (with State Pension); started before or since
  6 April, and if since, the start date and earlier taxed pay (none, P45
  given, no P45; pay and tax from it); pay frequency, pay per payday,
  latest pay date, tax on that payslip; Marriage Allowance, taxable
  benefits, State Pension, other untaxed income, expenses, tax owed.
- **The read** (`app/data/taxcode.ts`, pure functions): builds the
  expected allowance line by line (taper, MA, expenses, benefits, State
  Pension, other income, owed ÷ marginal rate) and the expected code
  (BR/D0/D1 or SBR/SD0–SD3 for a second job, a split allowance if the
  main job pays less than the allowance, K for a negative total); simulates
  both codes period by period (cumulative with P45 pay where it applies,
  non-cumulative, flat, K's 50% cap); works out the first payday from the
  start date so a mid-year starter isn't charged an extra period.
- **What's off**: wrong prefix for where you live, the emergency basis,
  BR/0T on main income, a second job with its own allowance, a full
  allowance with an earlier job's P45 missing, a K code, a Marriage
  Allowance letter mismatch, an allowance gap of £100+, and the payslip's
  tax not matching the code.
- **Messages**: what to tell HMRC (app, Personal Tax Account or phone
  script, with the reasons filled in), and to payroll (the P45, statement A
  for a first job since April, or "your sum doesn't match the code").
- **Also**: dates with an .ics (next payday, 5 April, the 2022/23 claim
  deadline); P50 for stopping work; ESC A19; refund companies' fees and
  fake refund texts; what to keep.
- **New model**: Running Totals (Systems). **New essay**: "Before the
  Total Closes".
- **Wired into**: tools (work group title and blurb), `/find` ("The tax on
  my payslip looks wrong"), the playbook ("Your payslip's tax looks wrong
  and you've never read the code"), backup (`taxcode:v1`), search, sitemap,
  writing groups, `/now` (new lead item; the oldest, `/baby`, dropped),
  `SITE_UPDATED`.

**Cleared from the backlog** (handoff links, each with a line on why):
`/parking` → `/bailiff` (in the read's "if you ignore it" list and the
handoffs), `/rent` → `/repairs`, `/deposit` → `/repairs`, `/redundancy` →
`/dismissed`, `/leaving` → `/dismissed`.

## How I verified it

- **A bun script ran eleven cases**: the worked example; a correct code
  all year; BR on a main job (£2,516 over); a Scot on 1257L at £4,000 a
  month (£1,054 under; I checked the Scottish figure by hand: £8,142 a year
  against £7,086); a second job on BR (right) and on 1257L (£1,560 under);
  a pensioner on K450 with a large State Pension; 1131N with no Marriage
  Allowance (£252 over); a company car not in the code; a new job with an
  earlier one and no P45 on a cumulative code (£1,400 under); an invalid
  code. Reading the output, I fixed:
  - a mid-year starter counted from the start date's period, which charged
    a payslip that didn't exist (now steps back from the pay date to the
    first payday);
  - Marriage Allowance and "allowance gap" flags both firing for the same
    £1,260;
  - an allowance-gap flag at £20 that fired on rounding (now £100);
  - "a M1"; the next monthly payday estimated as +30 days.
- **Arithmetic**: M1 monthly free pay £12,579 ÷ 12 = £1,048.25; £2,400 −
  £1,048.25 → £1,351 × 20% = £270.20 a month × 6 = £1,621. Cumulative over
  six months: £14,400 against the year's allowance, ≈ £364. Cumulatively,
  months 7–10 take nothing (free pay to date exceeds pay to date until
  month 11).
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: a clicked-through case
  gives the example's headline, no console errors; scrollWidth 375 on
  `/taxcode` (with and without the example), `/tools`, `/now`, the essay,
  `/find`, `/models`, `/playbook`, `/`, `/search` and `/data`. Search finds
  it for "emergency tax".
- **Not done**: no check against gov.uk or LITRG text (DNS-blocked); no
  check against HMRC's own calculator; no real phone or screen reader.

## Calls I'd defend

- **The headline is pounds by 5 April, not "your code is wrong".** A code
  can look different and cost nothing (the read says so), and one that
  looks standard can be badly wrong for the person.
- **Constant pay per payday.** Asking for every payslip would be more exact
  and much less used. The payslip-tax check catches the cases where it
  matters, and the doubt says so.
- **Decode before any other input.** Reading the code back is useful on its
  own, and it's the step that teaches the rest.
- **No refund-company angle beyond a warning.** Everything here is free in
  the HMRC app.

## Left for later

- `/taxcode`:
  - check rates and the P800 claim process against gov.uk/LITRG when
    reachable; 2027/28 bands in April;
  - irregular pay (bonus months) as an optional per-payslip list;
  - a "HMRC's coding notice items" mode that takes the P2's lines directly;
  - pension flexible withdrawals as a proper path (the emergency rate on
    a one-off, and the P55/P53Z/P50Z choice);
  - High Income Child Benefit Charge collected through the code.
- Carried: `/dismissed` (gov.uk/Acas checks, fixed-term and probation);
  `/sick` (gov.uk checks, 2027/28 rate); `/taxreturn` (MTD penalties);
  `/baby` (adoption, ShPL); a real screen-reader pass.
