# Session Notes — November 21, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last two days of notes and the toolkit index (about 67
tools, most for UK life admin), then grepped for gaps: drawdown, P55, MPAA,
Lifetime ISA, Delay Repay, jury service, probate, energy debt. **Nothing
covered taking money out of a pension pot**, beyond a P55 mention in
`/taxcode` and the April 2027 inheritance tax line in `/bereavement`. It
passed the "curated, not exhaustive" bar because:

- **The same sum can cost wildly different tax.** £40,000 from a £120,000
  pot for someone on £38,000: about £9,546 as a plain lump sum (UFPLS, a
  quarter of each payment tax-free), about £2,000 if they move the pot into
  drawdown and take the *whole pot's* tax-free quarter first. The form asks
  "how much?", never "how?".
- **The first payment is taxed wrongly by design** (emergency month 1 code).
  HMRC repays roughly £45–50 million a quarter through P55/P53Z/P50Z. For high
  earners it goes the other way: too little taken, a bill later.
- **It starts things people don't see**: the £10,000 money purchase annual
  allowance (employer contributions count; 91 days to tell other schemes).
- **It's timely.** Unused pensions enter inheritance tax for deaths from
  6 April 2027 (Finance Act 2026, Royal Assent 18 March 2026), and every
  Budget brings a tax-free-cash rumour and a rush. The minimum pension age
  rises to 57 on 6 April 2028.
- **It fits the site's best tools**: a sum people get wrong, a date line
  (5 April), a form to claim money back, and messages to send.

## Outside reading

gov.uk and most other sites failed to resolve from the sandbox again (same
DNS block; groplan.co.uk and richify.ai also failed), so I worked from search
summaries and kept what several agreed on:

- **Income tax 2026/27**: £12,570 allowance (tapered over £100,000), 20% to
  £50,270, 40%, 45% over £125,140. **Frozen for 2027/28** (several summaries
  of the 28 October 2026 Budget).
- **Scotland 2026/27** (Scottish Budget, 13 January 2026): starter 19% to
  £16,537, basic 20% to £29,526, intermediate 21% to £43,662, higher 42% to
  £75,000, advanced 45% to £125,140, top 48%. 2027/28 not set; assumed same.
- **2026 Budget and pensions**: tax-free cash untouched (lump sum allowance
  £268,275); the two-year rule on death benefits removed from 28 October 2026;
  a new **Pension Tax Allowance** from 6 April 2027 to 5 April 2030 for
  pensioners with income up to about the full new State Pension (worth about
  £94; sources differ on the taper). Not modelled; too small and too new.
- **MPAA** £10,000; triggered by UFPLS or drawdown income, not tax-free cash
  alone or small pots. 91 days to notify; the provider's flexible access
  statement within 31 days. The penalty figure (£300 + £60/day) is from a 2015
  post and **not used**.
- **Small pots**: up to £10,000, whole pot, three from personal pensions, no
  MPAA. That basic rate is taken off the taxable part is from memory.
  **Verify.**
- **Emergency tax**: month 1 basis on the first flexible payment (several
  sources); P55 partial, P53Z emptied with other income, P50Z emptied with
  none. "HMRC usually repays within weeks" is hedged: I couldn't confirm the
  30 days I remembered.
- **NMPA**: 57 from 6 April 2028; born after 5 April 1973 waits for 57;
  born 6 April 1971 to 5 April 1973 has a window at 55 until then.
- **Pre-Budget rush**: Quilter (2026) found three in five who took tax-free
  cash before the previous Budget regretted it; HMRC said cancelling a
  tax-free cash payment doesn't undo it.
- **From memory, not verified**: DB commutation around 12:1, the £30,000
  advice requirement on DB transfers, the UC £16,000 capital limit, the
  inheritance tax figures (£325,000 / £175,000 / £3,000 annual exemption /
  seven years), death benefits income-tax-free before 75.

**Ideas**:
- **William Vickrey, "Averaging of Income for Income-Tax Purposes"**
  (*Journal of Political Economy*, 1939): a progressive annual tax punishes
  lumpy income; average it. The US allowed income averaging 1964–1986; the UK
  still lets farmers and creators average profits. Everyone else smooths by
  hand, and a pension pot is the one big lump most people can time. New
  model: **Bracket Smoothing**.
- **Mental accounting** (Thaler) for the inheritance tax rush: "pension" and
  "savings" are different jars to us, not to inheritance tax.

## The insight that shaped it

**The decision isn't how much; it's which quarter and which tax year.** Two
things I hadn't seen clearly before running the sums:

- **Taking the whole pot's tax-free quarter first costs nothing over a
  lifetime** (the tax-free total is still a quarter) but can cut this year's
  tax by thousands, and if the sum fits in the quarter, there's no tax, no
  emergency code and no MPAA at all.
- **The emergency code isn't always "too much".** For someone with a big
  salary it gives the payment a slice of an allowance already used, so it
  takes too little. The tool says "keep this much aside" in that case.
- **Withdrawing to dodge inheritance tax mostly doesn't.** The tool's
  comparison makes it concrete: on £100,000 with a taxable estate, take and
  keep = the same 60% as leaving it (if taken tax-free), less if taxed; only
  giving it away (and living seven years) beats leaving it. For most people
  the estate is under the thresholds anyway.

## What I built

**`/pension`, "Taking Money From Your Pension: How Much Tax, and What Does It
Start?"** (short: "Pension withdrawal"), in the "Money calls" tool group.

- **Inputs**: date of birth; kind (pot / final salary / unsure); tax-free cash
  already taken; pot value; sum wanted; other taxable income this year and
  next; region (rUK / Scotland); first payment this year; one-off or regular;
  yearly contributions (you + employer); taxable money taken before; means-
  tested benefits; reason (spend / income / gift / inheritance tax); estate
  over the thresholds; expected payment date.
- **The read** (`app/data/pension.ts`, pure): verdicts young / db / taxfree /
  split / ok / costly. Routes: UFPLS; tax-free quarter of the whole pot first
  (drawdown); each split across 5 April (greedy £-chunk allocation to the
  cheapest year); UFPLS over three years for big sums; small pot; drawdown
  income if already crystallised. Duplicate routes are dropped. Best = least
  tax, with a waiting penalty of £250 or 2% of the sum and a small MPAA
  penalty for people still paying in. Emergency month 1 deduction, over- or
  under-taxed amount, the right reclaim form (only if ≥ £50 over), MPAA charge
  if contributions exceed £10,000, the inheritance tax comparison.
- **Also**: checks (Pension Wise, inheritance tax reality, the £50,270 /
  £60,000 / £100,000 / 60% lines, benefits, the 2028 window, the lump sum
  allowance, can't put it back, Budget rumours, Scottish caveat); dates and
  .ics (ask for this year's part three weeks before 5 April, the next part on
  6 April, reclaim a week after payment, notify schemes, 6 April 2027, the
  2028 window); messages to the provider (drawdown tax-free cash only, or
  which tax code), and to other schemes (MPAA); handoffs to `/statepension`,
  `/taxcode`, `/scam`, `/bereavement`.
- **New model**: Bracket Smoothing (Finance); Mental Accounting now links
  the essay. **New essay**: "Same Money, Different Tax" (Maureen).
- **Wired into**: tools (entry, money-calls group), `/find` (triage choice),
  the playbook (situation "You want to take a lump sum out of your pension"),
  backup (`pension:v1`), search, sitemap, writing groups, `/now` (new lead
  item; the oldest, `/remortgage`, dropped), `SITE_UPDATED`.

## How I verified it

- **A Bun script ran eleven cases**: the example (UFPLS £9,546; tax-free
  first £2,000; emergency £2,952, P55 for £952); £20,000 from the same pot
  (all tax-free; UFPLS would be £3,546); a retiree on £12,000 emptying £60,000
  (split saves £1,460; P55 because the first payment doesn't empty it);
  drawdown with income falling next year (split saves £4,946); a small pot;
  too young; the 1971–73 window; DB; a taxable estate with £100,000 (all
  tax-free cash; family gets £60,000 keep vs £100,000 give); Scotland; a
  £90,000 earner taking £200,000 (emergency takes £4,892 too little).
  Hand checks: tax on £30,000 over £38,000 = 12,270 × 20% + 17,730 × 40% =
  £9,546; month 1 on £30,000: (30,000 − 1,048.25) → 3,141.67 × 20% +
  7,286.67 × 40% + 18,523.42 × 45% = £11,878.54.
- Reading the output I fixed: marginal rate showing "2000%"; P55 offered for
  £2 of over-deduction; identical routes listed twice; a £500 saving on
  £200,000 recommending waiting (now 2% of the sum); P53Z suggested when the
  first payment of a split doesn't empty the pot; the 1971–73 window missing
  from the "too young" read.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: the example renders;
  filling in Maureen's case gives "Take it the right way and the tax is about
  £2,000, not £9,546."; no console errors; scrollWidth 375 on `/pension`,
  `/tools`, `/now`, the essay, `/find`, `/models`, `/playbook`, `/`,
  `/search`, `/writing`, `/data`; the model anchor exists.
- **Not done**: no check against gov.uk (DNS-blocked); no real phone or
  screen reader.

## Calls I'd defend

- **Pots only.** Final salary schemes get a short, honest read (get the
  quote, look at the commutation rate, advice over £30,000) rather than fake
  precision.
- **The tax-free-first route is shown as a choice, with its catch** (later
  drawdown income is all taxable) and the note that not every workplace
  scheme offers drawdown.
- **The inheritance tax comparison assumes a basic-rate beneficiary after
  75**, labelled. It's there to break the "take it out to save it" reflex,
  not to plan an estate.
- **No Pension Tax Allowance modelling**: worth about £94, new, and the taper
  isn't settled in the sources.

## Left for later

- `/pension`: verify on gov.uk (small pot tax deduction, P55 timescales, the
  MPAA notification penalty, Scottish 2027/28 bands); model a regular monthly
  drawdown (cumulative code after the first month); add the Pension Tax
  Allowance once confirmed; the beneficiary's side after a death (overlaps
  `/bereavement`).
- Carried: a motor finance redress tool once the Upper Tribunal position is
  clear; `/carers` (gov.uk and Carers UK checks); `/statepension`;
  `/studentloan`; `/remortgage`; `/childcare`; `/speeding`; `/taxcode`;
  `/dismissed`; `/sick`; `/taxreturn`; `/baby`; a real screen-reader pass.
