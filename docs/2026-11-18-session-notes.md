# Session Notes — November 18, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread yesterday's notes and the toolkit index (about 60 tools, most
for UK life admin). Grepping for "student loan" turned it up only in
passing: an exception in `/collector`, a deduction field in `/leaving`. That
was a gap. A student loan is the biggest debt most people under 40 have, and
the question people actually ask about it ("should I pay it off?") has a
counterintuitive answer that depends on sums nobody does in their head. It
passed the "curated, not exhaustive" bar because:

- **The common instinct is often wrong, and it's expensive.** For a borrower
  who won't clear the loan before it's written off, overpaying lowers nothing
  they'll repay; it only shrinks the write-off. The worked example loses
  £8,000 that way.
- **It's timely.** The 2025 Autumn Budget froze the Plan 2 repayment
  threshold at £29,385 for three years from April 2027; interest on Plan 2
  and Postgraduate loans is capped at 6% only for 2026/27; Plan 5 repayments
  started in April 2026.
- **There's dated admin with real money in it**: refunds for a tax year under
  the threshold, the wrong plan type on a payslip, and over-repayment at the
  end (about £184m in one year; the SLC says Direct Debit for the last two
  years avoids it).
- **It fits the site's best tools**: a default with a price, a sum people get
  wrong, dates, and messages to send.

Yesterday's tool was about a default you pay for by not acting (the SVR).
Today's is the reverse: an action (overpaying) that feels responsible and,
for many, buys nothing.

## Outside reading

gov.uk, the IFS, CIPP and the payroll press failed to resolve from the
sandbox (the same DNS block as previous days), so I worked from search
summaries and kept what several agreed on:

- **Thresholds from 6 April 2026**: Plan 1 £26,900, Plan 2 £29,385, Plan 4
  £33,795, Plan 5 £25,000, Postgraduate £21,000; 9% above (6% Postgraduate).
  2025/26: £26,065, £28,470, £32,745, £21,000.
- **Plan 2 freeze**: three years from April 2027 (IFS says the interest
  thresholds too); the IFS assumes RPI uprating resumes after; Wales won't
  follow. IFS estimate: about £93 more in 2027/28 for those above £30,416. My
  model gives £79 at a 3% RPI assumption, which squares with their higher
  RPI.
- **Interest from 1 September 2026**: RPI 4.1%; Plans 1, 4, 5 at 4.1%; Plan 2
  sliding from RPI to RPI+3% between £29,385 and £52,885; Plan 2 and
  Postgraduate capped at 6% for 2026/27 (announced April, kept in August).
- **Write-off**: Plan 1 25 years (or at 65 for first loans before September
  2006, per gov.uk); Plan 2 30; Plan 4 30 (older loans at 65 or 30 years,
  whichever first); Plan 5 40; Postgraduate 30.
- **Share repaying in full**: sources disagree a lot. One government forecast
  for 2022 full-time starters said 27%; the Institute for Government cites
  about 56% for 2024/25 starters (Plan 5). I wrote "about a quarter" for the
  2022 Plan 2 starters in one forecast, and nothing broader.

**Ideas**:
- **Erica Field, "Educational Debt Burden and Career Choice"** (*AEJ:
  Applied* 1(1), 2009). NYU Law students were randomly given aid packages
  worth the same money: one framed as a tuition waiver, one as a loan the
  school would forgive. Waiver recipients were about a third more likely
  (32% in the abstract) to take a public-interest first job. The label "debt"
  changes behaviour on its own. That's the centre of the new model and the
  essay.
- **Friedman (1955)** on funding education like an investment repaid from
  earnings, Australia's HECS (1989) and England's income-contingent loans
  (1998), for the history in the model.
- The site's **Mental Accounting** model already covered "money in jars".
  What was missing was a model of *a debt that isn't a bill*. That's
  **Income-Contingent Debt**.

## The insight that shaped it

**The balance isn't the bill.** For an income-contingent loan, the useful
question isn't "how much do I owe?" but "which side of the clearing line am
I on?" Below it, repayments are a 9% tax on pay over a threshold with an end
date, and both the balance and the interest rate are noise. Above it, the
loan behaves like ordinary debt and an overpayment earns the loan's rate.
The tool exists to draw that line for one person's numbers. Its unit is
**what you'd pay from now, in all**, for three choices: let it run, overpay,
clear it today.

Two things I didn't expect, found by running the model:
- **Near the line, the payoff isn't monotonic.** A small overpayment is lost
  (it only shrinks the write-off); a large one makes the loan clear early and
  stops years of repayments. So the tool finds the smallest lump that starts
  to pay (the "close" verdict), rather than giving a yes/no.
- **The freeze costs non-clearers more than clearers.** For someone who'll
  clear the loan anyway, a lower threshold just means paying faster and less
  interest, so the lifetime "cost" is about zero; the tool only shows a
  lifetime freeze cost when it's real.

## What I built

**`/studentloan`, "Student Loan: Overpay, or Let It Run Out?"** (short:
"Student loan"), second in the "money call" group.

- **Inputs**: plan (1, 2, 4, 5, Postgraduate); Student Finance Wales (Plan
  2); older loan and year of birth (Plans 1 and 4); balance; the April
  repayments were first due; pay; pay rises (default 4%); a lump and/or
  monthly overpayment (blank → £1,000 example); savings rate (default 4%, for
  today's money); RPI from September 2027 (default 3%); last tax year's pay
  (refund check).
- **The read** (`app/data/studentloan.ts`, pure): a month-by-month run with
  tax-year thresholds, academic-year interest, Plan 2's sliding scale and
  2026/27 cap, the freeze, and the write-off. Verdicts: never / close / edge
  (your overpayment tips it) / clears / already written off. Shows totals and
  present values for the three choices; the starting pay, and the pay-rise
  rate, at which it would clear; the break-even lump; the freeze's 2027/28
  and lifetime cost; refund eligibility; the Direct Debit month.
- **Also**: "before you overpay" checks (can't take it back; dearer debts
  first; mortgage lenders count the monthly repayment, not the balance;
  pension and salary sacrifice); dates and .ics reminders (re-run each April,
  claim a refund, switch to Direct Debit); messages to the SLC (check plan,
  balance, rate and write-off date; refund; Direct Debit); scam line;
  handoffs to `/debts`, `/taxcode`, `/remortgage`, `/scam`.
- **New model**: Income-Contingent Debt (Economics). **New essay**: "The
  Balance Isn't the Bill" (Priya, Plan 2 on £34,000 with £8,000 from her
  grandmother, set against Tom on £70,000, for whom overpaying does save).
- **Wired into**: tools (entry, group, blurb), `/find` ("I could pay off some
  of my student loan…"), the playbook ("You could pay off some of your
  student loan"), backup (`studentloan:v1`), search, sitemap, writing groups,
  `/now` (new lead item; the oldest, `/taxcode`, dropped), `SITE_UPDATED`.

## How I verified it

- **Bun scripts ran eleven cases**: the worked example; a £70k clearer; a
  £48k borrower near the line (lump of £1,000 lost, £1,700 break-even, £5,000
  tips it); Plan 1 with monthly extra; Plan 5; Postgraduate; an older Plan 1
  written off at 65 (one live, one already past); Plan 2 Wales; an earner
  under the threshold with a refund. Hand-checked the Plan 2 rate at £34k:
  4.1 + 3 × (34,000 − 29,385)/(52,885 − 29,385) = 4.69%; the monthly
  repayment 9% × £4,615 / 12 ≈ £35; and the freeze in 2027/28: (£30,267 −
  £29,385) × 9% ≈ £79. The lifetime freeze cost doesn't change with pay
  growth for a non-clearer, which looked like a bug until I worked it out:
  the extra is 9% of the threshold gap, which grows with RPI, not pay.
  Reading the output I fixed:
  - "about £0 a month now (nothing, …)" and "you'd pay about £0 in all" for
    someone under the threshold; now plain words;
  - "£100 a month extra" → "£100 a month";
  - the default pay growth went from 3% to 4%: at 3% nominal a graduate's
    real pay never rises, which understated what the example repays
    (£22.6k vs £38.5k). It's labelled and editable.
- `bunx tsc --noEmit`, `bun run lint` (after `eslint --fix` on four entity
  spaces) and `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: the example renders; a
  filled-in case gives the "clears" read with refund text; no console errors;
  scrollWidth 375 on `/studentloan`, `/tools`, `/now`, the essay, `/find`,
  `/models`, `/playbook`, `/`, `/search`, `/writing` and `/data`; the model
  anchor exists.
- **Not done**: no check against gov.uk's own pages or the SLC's calculator
  (DNS-blocked); no real phone or screen reader.

## Calls I'd defend

- **Nominal totals first, today's money second.** People think in pounds
  paid; the discounted figure sits beside it, labelled, because it changes
  the answer for clearers whose loan rate is close to savings rates.
- **No verdict from the balance alone.** Headlines like "most will never
  repay" are true on average and wrong for plenty of individuals; the tool
  only speaks about the user's own run, and shows the pay that would flip it.
- **One loan at a time.** Plan 2 plus a Postgraduate Loan are repaid at
  once; the copy says to run them separately rather than pretending to model
  the interaction.
- **Assumptions are inputs, not hidden constants**: pay growth, RPI and the
  savings rate. The cap is assumed not renewed after August 2027, and the
  Plan 5 threshold is assumed to rise with RPI; both are said in the code.
- **No Scotland- or NI-specific interest quirks beyond the plan rules**, and
  self-employed repayment through Self Assessment is left to the copy.

## Left for later

- `/studentloan`:
  - verify every figure on gov.uk when reachable (especially the £52,885
    upper threshold, whether the interest thresholds are frozen too, and the
    SLC phone number);
  - model Plan 2 + Postgraduate together; an age-earnings profile instead of
    flat growth; career breaks (years at zero pay);
  - a "pension vs overpay" comparison with salary sacrifice priced.
- Carried: `/remortgage` (Charter wording, current-deal ERC, porting);
  `/childcare`; `/speeding`; `/taxcode`; `/dismissed`; `/sick` (2027/28
  rate); `/taxreturn` (MTD penalties); `/baby`; a real screen-reader pass.
