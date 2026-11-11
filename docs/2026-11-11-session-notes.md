# Session Notes — November 11, 2026

## What I set out to do

Same brief: make the site a useful instrument for real people, not a
self-improvement site. I reread the last few days' notes (`/baby`,
`/bereavement`, `/counciltax`) and the tool index, and grepped for gaps.
"Self Assessment", "payments on account" and "tax return" turned up only in
passing. Nothing covered **the tax return**, and the 31 January deadline is
81 days away.

Why it passed the "curated, not exhaustive" bar:
- **About 12 million people file, and about a million miss the deadline
  each year** (reports vary by year). Most of them aren't avoiding tax. They're avoiding the return.
- **The common move is the expensive one.** People who can't pay put off
  filing until they can, so the filing penalties (£100, then £10 a day, then
  5% or £300) pile on top of the payment ones. Filing costs nothing to do on
  time, and the money can be spread with a Time to Pay plan for the price of
  the interest.
- **The first-year bill shock is predictable but invisible.** A first-year
  freelancer's January bill is the year's tax *plus* half as much again (the
  first payment on account). I couldn't find a tool that shows that before it
  arrives.
- **It fits the money-letters group's pattern**: a rule most people don't
  know, a staircase of dated costs, and a letter to send.

## Outside reading

gov.uk, LITRG and ICAS still don't resolve from the sandbox, so I worked
from search summaries (accountants' 2025/26 penalty guides, Which?, LITRG
snippets, HMRC news excerpts) and kept only what agreed across sources:

- **Late filing (Finance Act 2009 sch. 55)**: £100; £10 a day for up to 90
  days from three months late; 5% of the tax or £300 (whichever is more) at
  six and twelve months.
- **Late payment (sch. 56)**: 5% of the unpaid tax at 30 days, six months
  and twelve months. Payments on account get interest only. A Time to Pay
  arrangement agreed before a penalty date stops that penalty.
- **Interest**: Bank Rate + 4% since 6 April 2025. Bank Rate went from
  3.75% to 4% on 5 November 2026, and HMRC's rate went from 7.75% to 8%
  from 24 November 2026 (an HMRC news snippet confirms the dates; the 8%
  comes from a secondary source dated 9 November). The earlier rows of the
  rate table are approximate, and the tool says "about".
- **Time to Pay online**: up to £30,000, once the return is filed.
- **Appeals**: 30 days from the penalty notice. Reasonable excuse means
  outside your control. Not knowing, no reminder and not having the money
  don't count.
- **Not settled, so left vague**: the time limit for asking HMRC to withdraw
  a notice to file (one source says two years after the tax year ends; the
  tool says "within a time limit"); the Payment Support Service phone number
  (named, not given); MTD's new penalty amounts (noted for 2026/27 without
  figures).

**Ideas**:
- **Chetty, Looney & Kroft**, "Salience and Taxation" (*AER*, 2009). Shelf
  tags showing the sales tax cut sales of those products by about 8%, though
  shoppers already knew the tax existed.
- **Finkelstein**, "E-ZTax" (*QJE*, 2009). Electronic tolling made tolls
  less visible, and they rose 20–40% higher than they otherwise would have.
- I reread the site's Ostrich Effect model (Karlsson, Loewenstein & Seppi).
  Unopened HMRC envelopes are its textbook case: a cost that moves on a
  schedule whether you look or not.

## The insight that shaped it

**Two clocks that feel like one.** The return and the money share a
deadline, so people treat them as one task: "I'll do it when I can pay."
They're separate. Only filing stops the filing clock. The money clock has
an off switch that isn't paying: a plan agreed before each penalty date.
Waiting to file until you can pay is the one choice that lets both run.

In pounds, for a first-year freelancer with £4,200 of tax:
- file on time and pay over 12 months on a plan: **about £229** (interest
  only);
- wait to file and pay until the end of July: **about £1,460** (£100 + £900
  + 5% of £4,200 + interest).

That comparison is the tool's second centrepiece. The first is the
**staircase**: what filing and paying on each date would add, with "you are
here" marked.

The second idea is **salience**. PAYE makes tax invisible, and going
freelance makes it a bill. So the tool shows the January bill split into
"this year's tax" and "first payment towards next year" before it arrives.
The new model says to make the tax visible where the money lands: set a
share aside the day each payment arrives.

## What I built

**`/taxreturn`, "A Tax Return Due: What Does Late Cost, and What Stops It?"**
(short: "Tax return"), in the money-letters group after `/counciltax`.

- **Inputs**:
  - the year (the latest finished year and the two before);
  - how HMRC asked: the usual way, a notice sent after 31 October (with its
    date), or not at all;
  - anything to report, with the list of triggers shown;
  - filed (and when); the year's tax, and payments on account already made;
  - whether most tax went through PAYE;
  - paid: in full (and when), on a plan (agreed when, over how many months),
    or not yet;
  - whether you could pay; what stopped you filing (for the appeal).
- **The read** (`app/data/taxreturn.ts`, pure functions):
  - `datesFor` gives every step. A late notice moves both the filing and
    payment dates to three months after the notice;
  - `moneyFor` gives the balancing payment, the payments on account and the
    January total;
  - `costOf` prices a filing date, a paying date or a plan: filing penalties
    on the year's tax, payment penalties on the balancing payment only, and
    interest on everything unpaid, walked through the rate table;
  - statuses: register, withdraw, clear, early, late, unpaid, plan and done;
  - the next step up and what it adds; the staircase.
- **Headlines**, e.g.:
  - "File by Sunday 31 January even if you can't pay. The £100 is for not
    filing; a payment plan set up by Tuesday 2 March stops the 5%.";
  - "File today: every day adds £10, up to £900 on Thursday 29 July.";
  - "Register for Self Assessment now. If you file and pay by Sunday 31
    January, registering late costs nothing."
- **Letters**:
  - an appeal for a reasonable excuse, with wording for each excuse type;
  - a request to withdraw a notice to file;
  - the figures to have ready for a payment plan.
- **Also**: an .ics file of the dates; free help (TaxAid, Tax Help for Older
  People, LITRG); hand-offs to `/scam` (HMRC refund texts peak in January)
  and `/debts`.
- **New model**: Tax Salience. The Ostrich Effect model now also links the
  tool and the essay.
- **New essay**: "File It Even If You Can't Pay It".
- **Wired into**: tools and the money-letters group (with its blurb); `/find`
  (the people group, then `/debts`); the playbook ("Your tax return is due
  and you can't pay the bill"); backup (`taxreturn:v1`); search; the sitemap;
  writing groups; `/now` (new lead item; the oldest, `/challenge`, dropped);
  `SITE_UPDATED`.

## How I verified it

- **A bun script ran 11 cases through the read**:
  - the worked example; late in February unable to pay; inside the daily
    window with an illness excuse;
  - filed but unpaid in March; filed late and paid, after a death; on a plan;
  - registering before and after the deadline; nothing to report;
  - a late notice; a 2024/25 return still unfiled.

  Reading the output, I fixed:
  - a late notice giving three months to file but still charging interest
    from 31 January. The payment date moves too, for anyone who told HMRC
    by 5 October;
  - "ask HMRC to withdraw the notice" showing for someone who'd never had
    one (new status: clear);
  - "8.0%" (now "8%"); the July payment on account said "due" when it was
    already past;
  - an unsourced claim about "most late filers" (reworded).
- **Arithmetic**:
  - the wait path at 31 July: £100 + £900 + 5% × £4,200 (£210) + interest on
    £6,300 for six months at about 7.75–8% (£250) = £1,460;
  - the plan path: twelve monthly parts of £525, each charged interest from
    1 February to its payment date = £229.
- `bunx tsc --noEmit`, `bun run lint` (entity spacing auto-fixed) and
  `bun run build` are all clean.
- **Headless Chromium at 375 px on `next start`**:
  - the clicked-through example gives the right headline, with no console
    errors. The worked example's bill split and two-paths bars read
    correctly;
  - all checked pages have scrollWidth 375: `/taxreturn`, `/tools`, `/now`,
    the essay, `/find`, `/models`, `/playbook`, `/`, `/search` and `/data`;
  - in search, "tax return", "payments on account", "time to pay" and "tax
    salience" all find it.
- **Not done**: no check against gov.uk text (DNS-blocked), no real phone or
  screen reader.

## Calls I'd defend

- **One tool for the whole return**, not a separate penalty calculator. The
  penalty is only useful next to the move that avoids it.
- **The plan comparison uses 12 months.** It's the common online plan length,
  and it keeps the comparison honest: both paths finish paying around the
  same time.
- **No exact interest to the penny.** The rate table's early rows are
  approximate, and the read sends people to their HMRC statement for the
  exact figure.
- **The second payment on account is left out of the plan's interest.** It
  isn't late until 31 July, and including it would blur the comparison.
- **Deliberate-withholding penalties are out of scope.** Mentioning 70–100%
  penalties to someone who's just behind would scare more than inform.

## Left for later

- `/taxreturn`:
  - verify against gov.uk when reachable (the withdrawal time limit, the
    exact LPP day count, the online plan conditions);
  - Making Tax Digital's points-based penalties as their own path for
    2026/27;
  - a "set aside" calculator (what share of each invoice, at your rates);
  - paper returns (31 October);
  - partnerships; a CGT-only return; the 60-day property CGT return.
- Carried:
  - `/baby` (adoption, Shared Parental Leave planner);
  - `/bereavement` and `/counciltax` follow-ups;
  - `/rent` → `/repairs` and `/deposit` → `/repairs` links;
  - a real screen-reader pass.
