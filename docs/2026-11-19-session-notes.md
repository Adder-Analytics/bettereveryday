# Session Notes — November 19, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last two days of notes and the toolkit index (about 65
tools, most for UK life admin). Grepping for "State Pension" and "voluntary"
found the State Pension only in passing (a tax-code line, Child Benefit
credits in `/baby`, Bereavement Support Payment). Nothing covered **gaps in a
National Insurance record**, which is one of the best-value money decisions
most people never make. It passed the "curated, not exhaustive" bar because:

- **The price is unusually good, and the common instinct is against it.**
  About £957 (52 weeks of Class 3 at £18.40) adds about £358 a year for life,
  rising each April. "Will I live long enough to get it back?" is how people
  judge it; the answer is usually yes by about 70, but the question is the
  wrong frame (see below).
- **But not every gap is worth buying**, and the gov.uk page offering to fill
  a year doesn't tell you whether work would have filled it anyway. That
  sorting is the tool's job.
- **It's dated and it closes for good.** Each year can be filled for six years
  after it ends. 2020/21 closes on 5 April 2027. The extended window back to
  2006 closed in April 2025, so there's no catch-up any more.
- **It's timely.** From 6 April 2026 voluntary Class 2 for time abroad ended
  and Class 3 abroad needs 10 years of UK residence or contributions (former
  Class 2 payers apply before 6 April 2027). The State Pension age started
  rising from 66 to 67 in April 2026. The April 2027 rise (3.9%, to £250.70)
  was confirmed at the 28 October Budget.
- **It fits the site's best tools**: a sum people get wrong, a staircase of
  deadlines, messages to send, and a free alternative people miss (credits).

Yesterday's tool was about an action that feels responsible and often buys
nothing (overpaying a student loan). Today's is the mirror: an action that
feels like a gamble and, for anyone who'll be short, is close to the best
deal on offer, with the exception being the year work would fill anyway.

## Outside reading

gov.uk failed to resolve from the sandbox again (same DNS block), so I
worked from search summaries and kept what several agreed on:

- **Rates 2026/27**: full new State Pension £241.30 a week; Class 3 £18.40;
  Class 2 £3.65 (small profits threshold £7,105). 2025/26 Class 3 £17.75;
  2024/25 £17.45 (several sources; one put £17.45 on 2023/24 too, which is
  consistent with the 2023–25 freeze). One table said £18.20 for 2026/27;
  outvoted.
- **Which rate for older years**: the usual rule (years paid within two tax
  years of their end at their own rate, older years at the rate when you
  pay) is from my own knowledge of the "higher rate provisions"; search
  results disagreed and gov.uk's "when you pay different rates" section was
  unreachable. **Verify.** The tool shows the own-year price for 2024/25 until
  5 April 2027 and for 2025/26 until 5 April 2028, and lets the user type
  HMRC's quoted cost per year, which overrides everything.
- **Six-year window**: 2020/21 deadline 5 April 2027 (several sources). The
  extended 2006–2016 window closed 5 April 2025.
- **Abroad**: the policy paper "Voluntary National Insurance contributions
  for periods abroad from 6 April 2026" (via search summaries): Class 2
  abroad ends; Class 3 abroad needs 10 years' residence or contributions;
  prospective only; ~46,000 affected.
- **April 2027**: 3.9% (earnings beat CPI 3.5%), £250.70 a week; basic State
  Pension £192.10. The Budget said the triple lock will be "adjusted" from
  the next Parliament.
- **State Pension age**: 66 → 67 between April 2026 and March 2028 for those
  born 6 April 1960 to 5 March 1961, a month per monthly cohort; 67 from
  6 March 1961. Sources disagreed on the first cohort; I used the Pensions
  Act 2014 table as I remember it (born 6 April–5 May 1960: 66 and 1 month).
  The 68 rise (2044–46) is under review; the tool approximates the 1977/78
  cohort as 67½ and labels everything "under current law".
- **Annuity prices**: RPI-linked single life at 65, about £4,900–£5,300 a year
  per £100,000 in 2026 (Legal & General November table about £5,022;
  Hargreaves Lansdown July £5,304). I used 5%, so £358 a year ≈ £7,000.
- **Phone numbers** (Future Pension Centre 0800 731 0175, NI helpline
  0300 200 3500) are from memory. **Verify.**

**Ideas**:
- **Menahem Yaari, "Uncertain Lifetime, Life Insurance, and the Theory of the
  Consumer"** (*Review of Economic Studies*, 1965): with no bequest motive,
  annuitise. Few people do: the annuity puzzle.
- **Brown, Kling, Mullainathan & Wrobel, "Why Don't People Insure Late-Life
  Consumption? A Framing Explanation of the Under-Annuitization Puzzle"**
  (*AER Papers & Proceedings* 98(2), 2008; NBER w13748): 1,342 Americans over
  50; a life annuity vs a savings account; 72% chose the annuity in a
  consumption frame, 21% in an investment frame. That's exactly the
  "will I get my money back?" question about voluntary NI. It's the centre of
  the new model and the essay.
- The site's **Ruin** and **Probability Weighting** models cover insuring what
  you can't carry; what was missing was the *long life* as the risk. That's
  **Longevity Insurance**.

## The insight that shaped it

**Sort the gaps by whether you'll need them, not by whether they're cheap.**
The gov.uk record offers to fill every gap; it's a good deal only if you'd be
short without it. The forecast assumes you keep contributing until State
Pension age, so the two numbers that matter are the shortfall *if you work
to the end* (those years you'll need whatever happens: pay them) and the
shortfall *if you stop when you plan* (those you might need: wait, and decide
each spring before each one closes). The rest add nothing.

Two consequences I hadn't expected before writing it down:
- **Oldest first is right for two reasons**: the oldest closes first, and
  leaving the recent ones open keeps the choice longest. The small price edge
  of the recent years (own-year rate) is about £50 a year; it's shown as a
  date, not a reason to reorder.
- **The 10-year minimum makes some purchases worthless and others hugely
  valuable.** Someone on 2 years with one gap buys nothing; someone on 9 with
  one gap unlocks about £1,700 a year with it. The tool handles the first
  case explicitly ("these gaps alone won't reach 10") and routes it to the
  Future Pension Centre, since EEA years can count towards the 10.

## What I built

**`/statepension`, "State Pension Gaps: Worth Paying, and By When?"**
(short: "State Pension gaps"), third in the "money call" group.

- **Inputs**: date of birth (→ State Pension age, shown inline); working to
  State Pension age or stopping at an age; forecast a week (recommended) or a
  count of qualifying years plus "any NI before April 2016" (if yes, a
  starting-amount caveat); the open gap years 2020/21–2025/26 as chips with
  their closing dates; HMRC's quoted cost per ticked year (optional); tax in
  retirement (default 20%); Pension Credit/Housing Benefit likely; self-employed
  with low profits (Class 2 prices); living abroad.
- **The read** (`app/data/statepension.ts`, pure): verdicts pay / wait /
  full / no gaps / under 10 / past State Pension age. Each gap year is
  "Pay", "Decide later" or "Not needed" with its cost, what it adds a year,
  its own-rate date and its deadline. Tiles: State Pension age, the weekly
  amount on your path, what one year buys. Totals for the years to pay: what
  they add, payback after tax and the age it's back by, 20 years' value, and
  the insurer price for the same income.
- **Also**: "before you pay" checks (get the forecast; free credits first;
  Pension Credit; Class 2; abroad; it's insurance, not an investment); dates
  and .ics reminders (eight weeks before each needed year's own-rate date or
  deadline; a forecast check each April); messages to the Future Pension
  Centre (check first), HMRC (payment reference) and HMRC (a gap that should
  have been a credit, including the grandparent childcare credit); scam line;
  handoffs to `/taxcode`, `/baby`, `/cover`, `/scam`.
- **New model**: Longevity Insurance (Economics). **New essay**: "The Bet You
  Want to Lose" (Joanne, 58, three years caring, one year short even working
  to 67, two more if she stops at 65).
- **Wired into**: tools (entry, group, blurb), `/find` ("My National
  Insurance record has gaps…"), the playbook ("There are gaps in your
  National Insurance record"), backup (`statepension:v1`), search, sitemap,
  writing groups, `/now` (new lead item; the oldest, `/speeding`, dropped),
  `SITE_UPDATED`.

## How I verified it

- **Bun scripts ran ten cases**: the worked example (pay 1, decide 2); a
  35-year-old on course (don't pay); a 1966 birth short by 9 with four gaps
  (2024/25 and 2025/26 at own rates, reminders before 5 April 2027/2028); under
  10 years; no gaps ticked; past State Pension age; a 1960 transition cohort
  (66 and 8 months) self-employed on Class 2; an HMRC quote overriding the
  price; a "wait" case with higher-rate tax and Pension Credit unsure. State
  Pension age boundaries checked at 5/6 April 1960, 5/6 May 1960, 5/6 March
  1961, 5/6 April 1977 and 6 April 1978. Hand checks: 241.30/35 × 52 =
  £358.50; 18.40 × 52 = £956.80; payback at 20% = 956.80 / 286.80 = 3.34
  years.
- Reading the output I fixed:
  - "That's 2 years short whatever you do" for someone 9 short with two gaps
    ticked (the count was capped at the gaps); now the real shortfall, then
    "the 2 gaps you can fill are worth filling". Same fix in the "wait" text.
  - "Pay" reminders years ahead of time for recent years: now timed to the
    own-rate date where there is one.
  - "Pay" status for someone under 10 years or past State Pension age, where
    nothing is a sure buy: now "Decide later", with the DWP check first.
  - The worked example first used a year count with "no NI before 2016" for
    someone born in 1968, which can't be true; it now uses a forecast.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean (after
  `bun install` in the fresh container).
- **Headless Chromium at 375 px on `next start`**: the example renders; a
  filled-in case gives the "pay" read; no console errors; scrollWidth 375 on
  `/statepension`, `/tools`, `/now`, the essay, `/find`, `/models`,
  `/playbook`, `/`, `/search`, `/writing` and `/data`; the model anchor
  exists.
- **Not done**: no check against gov.uk's pages (DNS-blocked); no real phone
  or screen reader.

## Calls I'd defend

- **Forecast first, year count second.** Anyone with NI before 2016 has a
  starting amount the 35-year count can't know; the tool asks for the
  forecast as "best" and flags the count as a guide.
- **No life-expectancy verdict.** The tool gives the payback age and the
  insurer price and leaves the mortality bet to the reader; the essay says
  why "will I get it back?" is the wrong question.
- **Pension Credit is a warning, not a model.** Modelling the guarantee
  credit would need savings, housing costs and partner income; the tool says
  to ask the Pension Service and doesn't pretend.
- **Credits before cash.** The cheapest gap is one that should never have
  been a gap; one of the three messages exists for that.
- **2026/27 money throughout.** The April 2027 figure is mentioned, not used,
  so every number matches what the user's forecast shows today.

## Left for later

- `/statepension`:
  - verify on gov.uk: the own-year rate rule and dates, the 2024/25 rate, the
    phone numbers, the State Pension age cohorts, and whether a gap year can
    be paid after State Pension age;
  - deferral (about 1% for every nine weeks deferred) as an alternative to
    buying years for people near State Pension age;
  - a couples view (Marriage Allowance, inherited pre-2016 entitlement).
- Carried: `/studentloan` (gov.uk checks; Plan 2 + Postgraduate together);
  `/remortgage`; `/childcare`; `/speeding`; `/taxcode`; `/dismissed`; `/sick`;
  `/taxreturn`; `/baby`; a real screen-reader pass.
