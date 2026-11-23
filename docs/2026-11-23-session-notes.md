# Session Notes — November 23, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last two days' notes and the toolkit index (about 69
tools, most for UK life admin), then grepped for gaps: Marriage Allowance,
PIP, Pension Credit, Winter Fuel, Help to Save, broadband price rises.
**Pension Credit came up only in passing**, in `/carers`, `/lpa`,
`/statepension` and `/bereavement`. It passed the "curated, not exhaustive"
bar because:

- **It's one of the most under-claimed benefits there is.** The DWP's
  estimate for the year to March 2025: about 820,000 entitled households
  (730,000 to 900,000) don't claim it, a take-up of about 62%. Up to
  £2.5 billion a year goes unclaimed.
- **The commonest belief is wrong in the expensive direction.** In DWP and
  Age UK research, about two-thirds of non-claimants assume they wouldn't
  qualify. Usually the reason is owning the home (it isn't counted) or
  having savings (only the part over £10,000 counts, and there's no upper
  limit).
- **The weekly figure undersells it.** Any award opens a free TV licence at
  75 (£180), the Warm Home Discount (£150) and Cold Weather Payments.
  Guarantee Credit usually brings the whole council tax bill and the
  maximum Housing Benefit. Attendance Allowance, which isn't counted as
  income, adds £86.05 a week to the minimum for someone who lives alone.
- **It has a date.** Backdating is three months, and every week past that
  is lost. It's late November: winter bills, and families together soon.
- **It sits with `/carers` and `/lpa`** in "Looking after someone".

## Outside reading

gov.uk and assets.publishing.service.gov.uk were still DNS-blocked, so I
worked from search summaries and kept what several sources agreed on:

- **2026/27**: minimum guarantee £238.00 single / £363.25 couple (up 4.8%).
  Severe disability addition £86.05 / £172.10, carer addition £48.15.
  Savings Credit threshold £208.07 / £329.75, maximum £17.96 / £20.10. One
  source listed the maximums in the wrong columns. I checked them against
  the formula, 60% × (guarantee − threshold), and both match exactly.
- **Capital**: £10,000 ignored, then £1 a week per £500 or part. No upper
  limit. The home isn't counted.
- **Attendance Allowance** £76.70 / £114.60 (DWP table via a secondary
  site; one outlier site disagreed). New State Pension £241.30, basic
  £184.90.
- **TV licence** £180 from April 2026; free at 75+ with Pension Credit, on
  application. **Warm Home Discount** £150 for winter 2026/27, for
  Guarantee or Savings Credit, usually automatic. Sources disagree on the
  qualifying date, so the tool gives none. **Cold Weather Payment** £25 a
  spell; I couldn't confirm the 2026/27 figure officially.
- **My premise was wrong, and the search corrected it.** I went in assuming
  a "claim by 21 December to get the Winter Fuel Payment" hook. That rule
  belongs to 2024/25. Since winter 2025/26 everyone over State Pension age
  gets the payment, and it's clawed back through tax over £35,000 unless
  they get Pension Credit. The tool says this and doesn't use the old
  hook.
- **Mixed-age couples**: Universal Credit since 15 May 2019.
- **From memory, not verified**: earnings disregard £5 / £10 (£20 in some
  cases); Savings Credit tapers at 40p per £1 over the minimum; under 10p
  isn't paid; you can claim four months before State Pension age; Support
  for Mortgage Interest is a loan; and claiming Pension Credit within three
  months of an Attendance Allowance award gets it backdated to that date
  (the tool says "ask for it to start from the same date"). **Verify.**

**Ideas**:
- **Finkelstein and Notowidigdo, "Take-Up and Targeting" (QJE 2019).**
  They wrote to about 30,000 older Americans likely eligible for SNAP. A
  letter raised enrolment, and a letter plus help with the application
  tripled it. The barrier was information and effort, not need. That's why
  the tool writes the claim-call script and offers "let's do the call
  together".
- Herd and Moynihan's administrative burden and Sunstein's sludge are
  already models on the site. So the new idea had to be something else.
  What stood out was **the price people put on a claim**: they compare the
  face value (£8.95 a week) with the hassle, and never count what the
  award opens. New model: **Gateway Value**.

## The insight that shaped it

**A small award is a key, not a coin.** So the read always shows two
numbers: the weekly award, and "with what it unlocks", a year, counting
only what has a price. The second insight is **the second key**. When the
person needs help with personal care but doesn't claim Attendance
Allowance, the tool works out the award both ways. For the worked example
(Pat, 78, lives alone, owns the house, £219.90 State Pension + £150/month
+ £12,600 saved), it goes from £8.95 a week (about £800 a year with the
unlocks) to £81.49 a week (about £10,500 a year with council tax and the
allowance itself).

The conversation opener leads with the doors ("it would make your TV
licence free"), not the coin ("you could get a few pounds"). The coin
version sounds like "you're struggling".

## What I built

**`/pensioncredit`, "Pension Credit: Could You Get It, and What Does It
Unlock?"** (short: "Pension Credit"), in "Looking after someone".

- **Inputs**: whose (mine / a parent) and a name for the messages; where;
  single / couple / mixed-age couple; whether State Pension age was
  reached before April 2016; anyone 75+; State Pension a week; other
  pensions a month; earnings; other income; savings; disability benefit
  (none / one / both / "needs help but hasn't claimed"); another adult
  living in; a paid carer; whether they care for someone; home type,
  service charges, rent, council tax.
- **The read** (`app/data/pensioncredit.ts`, pure): verdicts guarantee /
  savings / aa / close / no / mixed. A breakdown of the minimum against
  income, a list of what the award unlocks, tiles (weekly, year with
  unlocks, the backdating date), checks, dates with .ics (claim today, the
  AA claim, chase at six weeks, 6 April 2027), and messages
  (conversation opener, the claim call script with the backdating request,
  TV Licensing, the council for CTR/HB). Handoffs go to `/challenge`,
  `/counciltax`, `/lpa`, `/carers`, `/statepension`.
- **New model**: Gateway Value (Decisions). **New essay**: "The Key, Not
  the Coin" (Pat).
- **Wired into**: tools (entry; the caring group's blurb now covers it),
  `/find` triage, the playbook (situation "A parent lives on the State
  Pension and says Pension Credit isn't for them", added to the playbook
  group, which the build enforces), backup (`pensioncredit:v1`), search,
  sitemap, writing groups, `/now` (new lead item; `/statepension` dropped),
  `SITE_UPDATED`.

## How I verified it

- **A Bun script ran nine cases** through `readPc` and `pcSummary`: the
  worked example (savings, £8.95; with AA £81.49); the same person with AA
  awarded; basic State Pension only and renting (£53.10; about £10,900 a
  year with Housing Benefit and council tax); full new State Pension alone
  ("close", £3.30 over, which is a real and useful insight); the same plus
  AA living alone (£82.75); a better-off couple (no); comfortable (no);
  mixed-age; a carer in Scotland (£86.15).
- From the output I fixed: the "close" text, which made a confused claim
  about gross pensions; the AA advice in the savings verdict (claim both
  now and report the award, rather than "AA first"); a dead verdict type
  that `tsc` caught; an entity-space lint error.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean
  (node_modules had to be reinstalled first). The first build failed
  because the situation wasn't in a playbook group; that guard worked as
  designed.
- **Headless Chromium at 375 px on `next start`**: the worked example
  opens; filling in "Dad, basic State Pension, £200/month, £9,000, owns,
  75+" gives "Dad could get about £20.74 a week" (checked by hand: £6.95
  Guarantee + £13.79 Savings Credit). No console errors. scrollWidth is
  375 on `/pensioncredit`, `/tools`, `/now`, the essay, `/find`, `/models`,
  `/playbook`, `/`, `/search`, `/data`, `/writing`. The model anchor
  exists; search finds the tool for "pension credit", "mum wont claim" and
  "free tv licence"; the playbook shows the situation.
- **Not done**: no check against gov.uk (blocked); no screen reader or
  real phone; `/find` checked by type-checking only.

## Calls I'd defend

- **Only priced unlocks count in the yearly figure.** Cold Weather
  Payments depend on the weather and dental savings on need, so they're
  listed without a number.
- **No claim-line phone number.** I couldn't confirm it, so the tool says
  "number on gov.uk".
- **No children, mortgage interest or £20 disregard in the model.** These
  are rare for pensioners. The footer says what isn't modelled, and the
  tool points to Age UK / Independent Age for a full check.
- **Couple SDA rules are modelled honestly** (both partners must qualify),
  even though that makes "one of them needs help" usually add nothing for
  a couple. The check explains why.

## Left for later

- `/pensioncredit`: verify on gov.uk (the disregards, the AA-linked
  backdating rule, the Cold Weather Payment amount, the claim number, the
  WHD qualifying date); maybe model children and the £20 disregard; maybe
  an Attendance Allowance companion. It's the bigger, more neglected key,
  and its form is the real barrier.
- Carried: motor finance redress after the Upper Tribunal (February–March
  2027); BNPL complaints; `/lpa` verification; making a will;
  `/pension`; `/carers`; `/statepension`; `/studentloan`; `/remortgage`;
  `/childcare`; `/speeding`; `/taxcode`; `/dismissed`; `/sick`;
  `/taxreturn`; `/baby`; a real screen-reader pass.
