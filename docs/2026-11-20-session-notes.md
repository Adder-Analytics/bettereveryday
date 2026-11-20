# Session Notes — November 20, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last two days of notes and the toolkit index (about 66
tools, most for UK life admin). I grepped the gaps I could think of (motor
finance redress, Carer's Allowance, Lasting Power of Attorney, Delay Repay,
insurance renewals). Carer's Allowance came up only in passing (a council tax
line, a childcare exemption, the benefit-decision search text). No tool
covered **the Carer's Allowance earnings limit**, which is one of the cruellest
rules in the benefits system. It passed the "curated, not exhaustive" bar
because:

- **It's a cliff.** £86.45 a week, gone entirely in any week counted earnings
  pass £204. A pound over costs £86.45; for a stretch above the line, more work
  leaves you with less.
- **The number people check is the wrong one.** The £204 is measured after
  tax, NI, half of pension contributions, work expenses and care costs (up to
  half of net earnings), with monthly pay turned into a weekly figure. Some
  people wrongly think they're over and never claim; others think they're
  under and get an overpayment letter.
- **It's in the news and the help is years away.** The 2025 independent
  review (Sayce) found the DWP's averaging guidance had been applied wrongly;
  about 200,000 cases have been under review since April 2026. The 28 October
  2026 Budget announced work to remove the cliff "once the necessary
  infrastructure is in place", with no date. Until then the cliff applies.
- **It fits the site's best tools**: a rule drawn on a number nobody sees, a
  sum people get wrong, dated checks, and messages to send.

I also looked at the FCA motor finance redress scheme (very timely), but
parts of it were suspended by the Upper Tribunal in July 2026 and I couldn't
confirm the current state, so it's in "left for later".

## Outside reading

gov.uk, Carers UK and MoneySavingExpert failed to resolve from the sandbox
(the same DNS block as before), so I worked from search summaries and kept
what several agreed on:

- **2026/27**: £86.45 a week (from £83.30); earnings limit £204 net (from
  £196; £151 before April 2025). The limit is tied to 16 hours at the NLW:
  16 × £12.71 = £203.36, rounded up. One site said £207; outvoted, and it
  doesn't fit the formula.
- **April 2027**: NLW £13.21 (Budget, 28 October), so the limit should be
  about £212 (16 × £13.21 = £211.36, rounded up, which several sites gave).
  DWP's proposed rate £89.50 (3.5% September CPI). Both shown as "expected".
- **Deductions**: tax, Class 1 NI, half of pension contributions (Carers UK
  factsheet, citing the DWP's), care costs up to 50% of net earnings (Carers UK
  forum and one calculator; consistent with my memory of the rules), and
  expenses wholly for the job.
- **Assessment**: monthly × 12 ÷ 52 (Carers UK); irregular pay averaged over a
  cycle or five weeks. Secondary sites disagreed on monthly assessment; I used
  Carers UK's version and told the user to confirm.
- **UC carer element** £209.34 a month (several sources; one outlier).
- **Not verified, from memory**: the qualifying benefits list, the
  severe-disability-premium effect on the cared-for person, three-month
  backdating (or to the award date), breaks of 4 weeks in 26 (12 in hospital),
  Carer's Credit for 20+ hours (form CC1), Carer Support Payment having the
  same rate and limit, the Carers UK helpline (0808 808 7777). **Verify.**

**Ideas**:
- **Effective marginal tax rates**: the Mirrlees Review (*Tax by Design*,
  2011) argued tax and benefits must be read together. On UC a basic-rate
  taxpayer keeps about 32p of the next pound; on a cliff the next pound can
  cost £86.
- **Simon Ruh and Stefan Staubli, "Financial Incentives and Earnings of
  Disability Insurance Recipients: Evidence from a Notch Design"** (*AEJ:
  Economic Policy*, 2019): sharp bunching below an Austrian disability
  insurance earnings threshold. Used carefully, only for "people bunch below
  lines they can see".
- Also read about but didn't use: the US Social Security earnings-test
  misperception work (people treat a deferral like a tax), and a September
  2026 CenTax paper on bunching at the £100,000 childcare cliff.
- The site already had **Notches** (find the line in the rule's own units).
  What was missing was the price of being just over it, which is **Effective
  Marginal Tax Rate**.

## The insight that shaped it

**Show what you keep, not what you earn, and work in the rule's units.**
Two things followed that I hadn't fully seen before writing the sums:

- **The limit is set at 16 hours at the minimum wage, so anyone above 16 hours
  at the NLW is over unless the deductions save them.** The worked example
  (Dev, 16 hours, 5% workplace pension) is under by £2.72, and most of that is
  the half of his pension that comes off. Hence the check "don't opt out of a
  workplace pension to take home more".
- **The dead zone is wide.** On 20 hours Dev keeps about £42 a week *less*
  than on 16. He needs about £314 a week (around 25 hours) before extra work
  pays. The tool solves for that band numerically (bisection on gross pay,
  holding the pension fixed) rather than with a rule of thumb, so tax and NI,
  the half-pension rule and the care-cost cap all come through.
- **For monthly pay, one month over loses every week that pay covers**: £219
  of December overtime costs about £375.
- **The cliff is much gentler for UC claimants**, because Carer's Allowance
  comes off UC pound for pound. The tool says so, hedged.

## What I built

**`/carers`, "Carer's Allowance: Can You Get It, and Can You Earn This?"**
(short: "Carer's Allowance"), in a new tool group, "Looking after someone".

- **Inputs**: hours of care (35+, 20–34, under 20); the cared-for person's
  disability benefit (yes / claimed / no); where (E&W, Scotland, NI);
  full-time education; State Pension; Universal Credit; whether the cared-for
  person gets a means-tested benefit (the premium warning). Work: none,
  employed (pay frequency, gross per period, own pension per period and type,
  payslip tax and NI or estimate, expenses, hourly rate, whether pay varies
  and the biggest recent period) or self-employed (yearly profit and pension);
  care costs a week; an overpayment letter.
- **The read** (`app/data/carers.ts`, pure): verdicts hours / noqual /
  student / waiting / overlap / under / tight (headroom under £15) / over /
  wellover (counted earnings past £290.45, where the pay beats the
  allowance). A line-by-line breakdown of the counted earnings; tiles for
  counted earnings, headroom or overage, and the April 2027 limit; headroom
  in gross pay per period and in hours; the cost of the biggest pay period;
  ways back under (a pension contribution, shown only when it's under a fifth
  of pay; salary sacrifice; fewer hours); the keep-less band.
- **Also**: checks (the premium, pension opt-out, one-offs and averaging,
  estimated tax, reporting changes and breaks, taxable but credited, Scotland,
  NI, the Budget promise); dates and .ics (claim today where eligible; check
  December pay; the April 2027 change); messages to the Carer's Allowance Unit
  (earnings with the breakdown, asking for averaging where pay varies), to
  payroll (a bigger pension contribution or salary sacrifice), and to the DWP
  about an overpayment (week-by-week calculation, mandatory reconsideration,
  the averaging review, hold recovery); handoffs to `/challenge`,
  `/statepension`, `/counciltax`, `/taxcode`.
- **New model**: Effective Marginal Tax Rate (Economics); Notches now also
  links the new essay. **New essay**: "The Pound That Costs £86" (Dev).
- **Wired into**: tools (entry, new group), `/find` (triage choice), the
  playbook (situation "You care for someone, and you've been offered more
  hours"), backup (`carers:v1`), search, sitemap, writing groups, `/now` (new
  lead item; the oldest, `/childcare`, dropped), `SITE_UPDATED`.

## How I verified it

- **A Bun script ran eleven cases**: the example (tight, £2.72; December
  month £248.37 counted, £375 cost); the 20-hour offer (over by £43.35; band
  £207–£314; 3.7 fewer hours); no work; 20–34 hours; no qualifying benefit;
  student; State Pension with the premium unsure; well over with UC;
  fortnightly with payslip tax, care costs, expenses, UC and an overpayment;
  self-employed just over (£3.54 a week more pension fixes it) and well over.
  Hand checks: 16 × 12.71 = 203.36; 18.06 × 12 ÷ 52 = 4.17, half 2.08;
  203.36 − 2.08 = 201.28; keep on 16 h = 203.36 − 4.17 + 86.45 = 285.64, on
  20 h = 254.20 − 2.49 − 1.00 − 6.71 = 244.00, so £41.64 less.
- Reading the output I fixed:
  - the pension route suggesting £87 a week more for someone earning £254
    (now shown only when it's under a fifth of pay, and the payroll message
    with it);
  - "between £207 and £314 you're worse off" was abstract: now "on £254 you
    keep about £43 less than on £207 with Carer's Allowance";
  - self-employed overages said "for that week" (profits are averaged; now
    "every week");
  - "(estimated)" and "your" leaking into the letter to the DWP;
  - "a month with five Fridays" in the checks and essay, which matters for UC,
    not for Carer's Allowance's weekly test;
  - the worked example first said the pension "keeps him under"; without it
    he's still 64p under, so it now says most of his headroom is the pension.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: the example renders; a
  filled-in 20-hour case gives the "over" read with the breakdown; no console
  errors; scrollWidth 375 on `/carers`, `/tools`, `/now`, the essay, `/find`,
  `/models`, `/playbook`, `/`, `/search`, `/writing` and `/data`; the model
  anchor exists.
- **Not done**: no check against gov.uk or the Carers UK factsheet
  (DNS-blocked); no real phone or screen reader.

## Calls I'd defend

- **Payslip figures beat estimates**, and estimates are labelled. Tax and NI
  are estimated for 1257L only when both are blank.
- **The "keep" comparison holds the pension fixed** and counts the whole
  contribution as money not kept, because that's what the person sees in
  their bank. The half-pension rule applies only inside the test.
- **No eligibility gate on the State Pension or UC**: both change the advice,
  not whether to claim, so they're notes rather than blocks.
- **The premium warning is about the other person.** It's the one case where
  claiming can make a household worse off, so it leads the checks.
- **No date for the cliff's removal.** The Budget gave none; the tool says the
  cliff applies today.

## Left for later

- `/carers`: verify on gov.uk and the Carers UK factsheet (care-cost cap,
  monthly assessment, breaks, backdating, CC1, Carer Support Payment's rules,
  the helpline); model averaging over a cycle; add the cared-for person's side
  (the premium in pounds); update the April 2027 figures when the uprating
  order is made; and the cliff's replacement, if a taper is announced.
- A **motor finance redress** tool once the Upper Tribunal suspension is
  resolved (the scheme's complaint deadline is 31 August 2027; claims firms
  take a large cut of something that's free).
- Carried: `/statepension` (gov.uk checks; deferral; couples); `/studentloan`;
  `/remortgage`; `/childcare`; `/speeding`; `/taxcode`; `/dismissed`; `/sick`;
  `/taxreturn`; `/baby`; a real screen-reader pass.
