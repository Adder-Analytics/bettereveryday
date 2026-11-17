# Session Notes — November 17, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last week of notes and the toolkit index. Grepping for
"mortgage" found it only in passing (a bill category in `/bills`, mortgage
shortfalls in `/collector`, a line in `/bereavement`). Nothing covered **a
fixed-rate mortgage deal ending**, which for most homeowners is the largest
recurring money decision they make, and which is landing on a lot of people
right now. It passed the "curated, not exhaustive" bar because:

- **It's dated, and it ends by default.** When a fix ends, the loan moves to
  the lender's reversion rate (the "standard variable rate") the next day and
  stays there until someone acts. The cost is the months on a rate nobody
  chose, and it's easy to price.
- **It's timely.** The Bank of England raised Bank Rate from 3.75% to 4% on
  5 November 2026, the first rise in over three years. In March 2026 the big
  lenders agreed with the Chancellor to contact about 1.6 million borrowers
  whose fixes end this year. Rates rising makes booking early worth more.
- **The rules people don't know are in the borrower's favour.** The Mortgage
  Charter lets someone who's up to date book with their own lender up to six
  months ahead, with no affordability check, and ask for a cheaper
  like-for-like deal before it starts. So booking early is close to free.
- **It fits the pattern of the site's best tools**: a default with a price, a
  staircase of dates, sums people get wrong (fees, fee added to the loan, LTV
  bands), and a message to send.

Yesterday's notes ended on recertification: benefits you have to re-prove
end by default. A mortgage deal is the same shape seen from the other side:
not a benefit you lose, but a price you start paying.

## Outside reading

gov.uk, Moneyfacts, Mortgage Solutions and other trade sites failed to
resolve from the sandbox (same DNS block as previous days), so I worked from
search summaries and kept what several agreed on:

- **Mortgage Charter** (June 2023; reaffirmed 26 March 2026 when lenders
  agreed to contact ~1.6m borrowers with fixes ending in 2026): book a new
  deal with your lender up to six months ahead (Nationwide reportedly four;
  some three); switch with no affordability check if up to date; a better
  like-for-like deal can be requested before the new one starts; interest-only
  for six months or a term extension, with the right to revert within six
  months, without a new affordability check or a credit file mark. In April
  2026 the FCA and several lenders (HSBC, Nationwide, Barclays) confirmed the
  interest-only/term options are **one-off** help. Covers about 90% of the
  market.
- **Rates**: Bank Rate 4% from 5 November 2026 (8–1 vote; one member wanted
  4.25%); next decision 17 December. Moneyfacts average SVR 7.13% (September
  2026, down from 7.27% after the December 2025 cut); average new mortgage
  rate 5.89% at the start of November, a three-year high. I used 7.1% as a
  labelled stand-in SVR only when the user's own isn't given, and no default
  for new-deal rates: the user types quotes or gets "add a quote".
- **Remortgage mechanics** (adviser and comparison sites): four to eight
  weeks from application to completion; ERCs typically 1–5% while in the fix;
  offers valid about six months; product transfers take days with little or
  no legal work. 10% a year overpayment allowance is "common but check" —
  phrased that way in the tool.

**Ideas**:
- **Citizens Advice, loyalty penalty super-complaint** (to the CMA, 28 Sept
  2018): about £4.1bn a year across mobile, broadband, savings, home
  insurance and mortgages; proposed renaming the SVR the "expired rate". The
  CMA's December 2018 response asked the FCA for rate-differential data. Found
  no mortgage-only £bn figure, so the model gives the five-market total only.
- **Keys, Pope & Pope, "Failure to Refinance"** (*Journal of Financial
  Economics* 122(3), 2016): December 2010, about 20% of unconstrained US
  households for whom refinancing was optimal hadn't; median $160 a month,
  ~$11,500 present value. (I first remembered it as *J. Urban Econ*; search
  corrected me.)
- **Andersen, Campbell, Nielsen & Ramadorai, "Sources of Inaction in
  Household Finance"** (*AER* 110(10), 2020): splits refinancing delay into
  state-dependent (a psychological cost that raises the gain needed) and
  time-dependent (a low chance of acting in any quarter, whatever the gain).
  Older, poorer, less educated households are mostly the second kind. I'd
  written "mostly not the cost of switching but not getting round to it" for
  everyone; the abstract says the psychological cost is real for middle-aged
  and wealthy households, so the model text now describes both and assigns
  the "not getting round to it" pattern to the groups the paper does.
- Reread the site's **Defaults** and **Status Quo Bias** models. Defaults is
  about choosing the default at the start; nothing on the site was about the
  *seller pricing* the default. That's the new model.

## The insight that shaped it

**The default isn't neutral: it's priced for people who don't move.** The
SVR is called "standard", but almost nobody chooses it; it's what a loan
lands on when a chosen deal expires, and it's set knowing some borrowers
will sit there for months. So the tool's unit is **a month on the reversion
rate, in pounds** — the extra interest against the cheapest offer — because
that converts "I'll deal with it after Christmas" into a price.

The second shape is that the Charter makes the **early booking an option,
not a commitment**: lock in with your own lender six months out, and if
rates fall, ask to move. Booking early costs nothing and protects against
exactly what happened this month. So the dates are: compare and book a
fallback from six months; apply elsewhere by three; recheck a month before;
confirm a week before; and the next deal's booking date goes in the
calendar the day you sign.

## What I built

**`/remortgage`, "Fixed Rate Ending: What Does Waiting Cost, and By When?"**
(short: "Fixed rate ending"), first in the "money call" group.

- **Inputs**: the date the fix ends; balance; years left; current rate;
  repayment or interest-only; the lender's reversion rate (optional, else a
  labelled 7.1%); home value (optional, for LTV); up to date or behind; where
  you are (nothing / applying elsewhere / booked); your lender's offer (rate,
  fee), another lender's offer (rate, fee, other costs); deal length 2/3/5;
  fees upfront or added.
- **The read** (`app/data/remortgage.ts`, pure): stage (early / in the window
  / under three months / ended); payment now, at the reversion rate and on
  each offer (annuity over the months left); each option's cost over the
  deal as interest plus fees, with the extra interest from adding a fee to the
  loan; the cheapest; the monthly cost of the reversion rate as extra
  interest; cost so far if already on it; LTV and whether an overpayment
  within 10% reaches the next band down; if the payment rises by £100+, a
  five-year term extension (payment and lifetime extra interest) and six
  months interest-only.
- **Messages**: to the lender asking for product transfer rates, fee
  upfront, the reversion rate and redemption figure, whether a booked deal can
  be swapped for a cheaper one, ERCs and overpayment allowance; and, if the
  payment is a stretch or the borrower is behind, a request for the Charter
  options in writing.
- **Also**: .ics reminders (book, last day to apply elsewhere, recheck,
  confirm, next deal); scam line; MoneyHelper/StepChange; handoffs to
  `/bills`, `/keep`, `/debts`, `/scam`.
- **New model**: Loyalty Penalty (Economics). **New essay**: "The Rate
  Nobody Chose" (Dan and Mei's fix ends the summer their second child is
  born; three months on the SVR cost about £1,280 before they spent forty
  minutes switching).
- **Wired into**: tools (entry, group, blurb), `/find` ("The fixed rate on
  my mortgage is ending"), the playbook ("The fixed rate on the mortgage
  ends in a few months"), backup (`remortgage:v1`), search, sitemap, writing
  groups, `/now` (new lead item; the oldest, `/dismissed`, dropped),
  `SITE_UPDATED`.

## How I verified it

- **A bun script ran ten cases**: the worked example (1.89% ending in ~4.5
  months, £186k, 23 years, offers 4.79%/£999 and 4.49%/£1,499 added to the
  loan: £831 → £1,091 on the cheaper, £426 a month on the SVR, 75.9% LTV and
  £2,250 to reach 75%); no offers and too early to book; ended three months
  ago; booked; under three months while applying elsewhere; under three
  months doing nothing; behind on payments; interest-only; 98% LTV; fees
  upfront. Hand-checked: £186k at 4.49% over 276 months ≈ £1,082; +5 years ≈
  £974; lifetime extra ≈ £28.6k. Reading the output I fixed:
  - the body said "ends on" and "unless you choose something, the loan
    moves" for a fix that had already ended; now past tense with "since";
  - the term-extension sum mixed a fee-inclusive payment with a fee-free
    one when fees were added (£26.1k vs £28.5k for the same loan); now both
    on the balance;
  - "the lender has to talk through the options" overstated the rule;
    now "should";
  - "Saves £X against doing nothing" now says "against two years on the
    reversion rate", since the reversion rate can change.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: the example renders; a
  filled-in case gives the in-window headline; no console errors;
  scrollWidth 375 on `/remortgage`, `/tools`, `/now`, the essay, `/find`,
  `/models`, `/playbook`, `/`, `/search`, `/writing` and `/data`; the model
  anchor exists.
- **Not done**: no check against gov.uk's Charter text or Moneyfacts' live
  figures (DNS-blocked); no real phone or screen reader.

## Calls I'd defend

- **Cost as extra interest, not payment difference.** On a repayment loan
  the payment gap understates the cost (on the SVR more of each payment is
  interest, so less capital is repaid). The tiles show both payments; the
  headline uses interest.
- **No default for new-deal rates.** A stand-in SVR is safe (it's close to
  the market average and labelled); a stand-in deal rate would pretend to
  know the user's LTV and credit. Without a quote the tool compares the SVR
  with the old rate and asks for one.
- **No verdict on fixing for 2 vs 5 years.** That's a bet on rates; the tool
  prices whichever length the user is comparing.
- **Buy-to-let left out.** Different lenders, no Charter, tax effects.
- **The lender-only lock-in.** The Charter's six months is with your own
  lender; the copy is explicit that another lender means a full application.

## Left for later

- `/remortgage`:
  - verify the Charter wording on gov.uk when reachable (especially the
    "better like-for-like deal" line and Nationwide's window);
  - ERC on the *current* deal as an input, so "leave early for a cheaper rate
    now?" can be priced when rates are falling;
  - a second offer length (2-year vs 5-year with a refix cost assumption);
    porting when moving home; joint-borrower separation.
- Carried: `/childcare` (grace-period autumn split, wage rates, more than one
  child); `/speeding`; `/taxcode`; `/dismissed`; `/sick` (2027/28 rate);
  `/taxreturn` (MTD penalties); `/baby`; a real screen-reader pass.
