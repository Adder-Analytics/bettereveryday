# Session Notes — October 19, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I reread the last two sessions (`/bills`, `/trial`) and
their "Left for later" lists, then looked for a gap rather than another
follow-up. The household money set now covers repairs (`/fix`), cover at the
till (`/cover`), subscriptions (`/keep`), trials (`/trial`) and shared bills
(`/bills`). One checkout decision was missing: **"£649, or 12 payments of
£59.99"**. Grepping "APR", "instalment", "pay monthly" and "buy now, pay later"
found nothing.

Why it passed the "curated, not exhaustive" bar: almost everyone meets it,
often weekly (pay-in-four at every online checkout, sofa and phone finance,
car PCP). It ends in a clear answer. And the error behind it is well
documented, with a correction that's just arithmetic people don't do at the
checkout.

## Outside reading

Search worked (summaries and abstracts; I didn't fetch full papers). I kept
only claims that agreed across sources.

- **Stango & Zinman, "Exponential Growth Bias and Household Finance"**
  (*Journal of Finance* 64, 2009). People underestimate the interest rate
  implied by a loan's payments, and the most-biased borrow more and save less.
  This became the tool's core move: say the rate out loud.
- **Prelec & Loewenstein, "The Red and the Black"** (*Marketing Science* 17(1),
  1998). The pain of paying. Plus **Prelec & Simester** (*Marketing Letters*,
  2001), the credit-card auction study. In the copy I say "far more" and quote
  no multiple.
- **Di Maggio, Katz & Williams, "Buy Now, Pay Later Credit"** (NBER w30508,
  2022). BNPL access raises *total* spending, including for people who aren't
  short of cash ("liquidity flypaper"). This produced the second question:
  *would you buy it at this price without the plan?* It's a working paper, so
  the copy gives no dollar figures.
- **CFPB BNPL report** (January 2025, 2022 data). 63% of borrowers had several
  loans at once at some point in the year. This produced the optional "what you
  already pay on other plans" field and the stack sentence.
- **FCA BNPL regime**, in force 15 July 2026 (PS26/1): affordability checks,
  clear information, Ombudsman access. I didn't name it in the copy, since the
  tool is jurisdiction-neutral and the rules will change, but it confirms that
  "read what a missed payment costs" is now information UK lenders must give.

I also corrected a claim I nearly made: that interest-free lenders make their
money "largely from missed payments". Most BNPL revenue is merchant fees. The
copy now says the shop pays for the free part and late fees pay for some of it.

## The insights that shaped it

1. **The rate is invisible, so compute it.** 12 × £59.99 against £649 is
   about 21% a year, roughly a credit card's rate, and nobody guesses it from
   "£59.99 a month". The tool solves for the effective annual rate (the way a
   UK APR is quoted) by bisection on the payment schedule. It handles weekly,
   fortnightly and monthly plans, a first payment at checkout, a deposit and a
   fee.
2. **The rate isn't the most important question.** Flypaper says the plan
   changes *whether* people buy, not just how. So the "would you buy it
   without the plan?" answer overlays every verdict, and when it's no the
   headline changes ("Free to spread. Is it worth buying?").
3. **Interest-free is genuinely better. Say so.** A site that only ever said
   "pay now" would be moralising. Interest-free plus already-decided gives
   "Spread it, and set every payment to come out automatically": the Defaults
   model from yesterday, applied to the one way a free plan turns expensive.
4. **Can't-pay-today changes the category.** Then it's a loan to afford the
   thing, whatever the rate. That can be right for a need (the cooker, the car
   for work), so the tool doesn't forbid it. It asks for the loan questions
   instead, and hands off to `/ruin`.

## What I built

**`/monthly`, "Pay Now or Pay Monthly?"** (short name: "Pay monthly"; group
"deciding now", after `/fix`).

- **Inputs**: what it is (a carried subject seeds it); the price today; each
  payment and how many; weekly / fortnightly / monthly; "first payment taken
  today"; and an optional deposit and fee. Then two questions: could you pay
  today (yes / only from emergency savings / no), and would you buy it without
  the plan (yes / a cheaper one / probably not). Also optional: the savings
  rate and what you already pay a month on other plans.
- **The engine** (`app/data/monthly.ts`, pure). Kinds `stretch | cheaper |
  free | earns | costs`, with a `nudged` overlay. It computes the total, the
  extra, the effective yearly rate, what keeping the money in savings is worth
  (the price less the plan's present value at the savings rate), a monthly
  equivalent, and the term. Its own `formatMoney` keeps the pennies (£59.99,
  not £60), because on a plan the pennies are the point.
- **The read**: the headline is spoken via `AnnounceAnswer`; two bars (pay
  today vs spread it, aria-hidden); a body per kind; notes for nudged,
  emergency savings, savings interest kept and savings earning less; the stack
  sentence; "Your line, to keep"; copy line / copy all. Handoffs go to `/cool`
  (nudged), `/ruin` (stretch), `/cover` (the next offer at the same checkout)
  and `/rule`.
- **Worked example**: a £649 laptop against 12 × £59.99 = £719.88, about 21%.
  The buyer could pay and had already decided, so: pay now.

**Wired in**:
- `tools.ts`
- the router: "There's a price, or a monthly plan for it…" under "The
  options", then `/cover`
- the playbook: a `pay-monthly` situation (pain of paying, compound interest,
  defaults)
- a new **Pain of Paying** model
- the essay **"The Smallest Number on the Page"** (stakes group)
- search, sitemap, the backup registry (`monthly:v1`), and `/now` (new lead
  bullet; the oldest, `/keep`'s, dropped)
- `SITE_UPDATED` set to October 19

## How I verified it

- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean; `/monthly`
  is static.
- **Caught by the build**: the router choice was in the node but in no group
  ("Triage choice making/monthly is in no group"). I added it to the options
  group.
- A scratch script ran 5,000 random drafts: garbage money, counts 0–999, every
  frequency, flag and answer. There was no NaN/undefined/Infinity/null in any
  sentence, and for every "costs" read, discounting the payments at the solved
  rate reproduced the amount financed to within 1p. Malformed stored input
  falls back to blank.
- **Caught by the sample runs**:
  - the site's shared `formatMoney` rounds from £20 up, so "£59.99" read
    "£60" (now a local, penny-keeping formatter)
  - "about more than 1,000%" (`aboutRate` now drops the hedge)
  - "12 payments … comes to" (rephrased as "Altogether that's £X for …")
  - the nudged note told people to price it at the plan's total when the
    honest question is the cash price (fixed)
- Headless Chromium at 375 px against `next start`:
  - `?subject=` seeded the name
  - scrollWidth stayed 375, with the example open too
  - state survived a reload
  - the live region spoke the headline once the input settled
  - `/find` → "I have to make the call" → "the options" shows the new choice
  - `/tools`, `/playbook`, `/models`, `/now`, the essay, `/data` and the
    sitemap all link it
  - no page errors
  - search: "buy now pay later", "interest free" and "klarna" put `/monthly`
    first; "pay monthly" puts the playbook situation first, then `/monthly`;
    "subscription" and "repair" still lead with their own essays and tools
- **Process**: I stopped the server by port (`fuser -k 3123/tcp`), not
  `pkill -f`. That avoided the shell-killing problem the last three sessions
  hit.
- **Not done**: a real screen reader, a real phone, clicking copy.

## Calls I'd defend

- **No product names or legal rules in the tool.** Klarna, Clearpay and PCP
  are in the search keywords so people find it, but the copy stays generic:
  providers and regulations change, the arithmetic doesn't.
- **"Spread it" when it's free.** Honest arithmetic beats a blanket "avoid
  debt". The guardrails are the would-you-buy-it question and automating every
  payment.
- **The effective annual rate, not the flat rate.** A flat "£70.88 on £649 is
  11%" halves the true cost, because you hold the money for less time as you
  pay. The effective rate is what an APR quotes, so people can compare it with
  a card.
- **No credit-card rate table.** "A typical credit card charges over 20% a
  year" is true in the UK and US and won't go stale soon. Anything more
  precise would.

## What I ruled out

- **Balloon payments and PCP modelling** (a final payment, mileage, handing it
  back). A car PCP is a different decision (a lease with an option). The fee
  field covers an option-to-purchase fee; the rest would bloat the tool.
- **Deferred-interest maths** (US "no interest if paid in full"). It's a
  warning in the copy, not a computation, because the terms vary too much.
- **Affordability scoring against income.** It would need income and outgoings
  and would pretend to a precision it can't have. The stack sentence and the
  `/ruin` handoff do the honest version.

## Left for later

- `/monthly`: a "pay-in-four calendar" (the payment dates as an `.ics`, so
  automation has a backstop), and a link from `/cover` and `/fix` ("buying new?
  there'll be a plan offered").
- Carried from yesterday: `/bills` "redo the sum" and `/chores` "look again" as
  `renewals:v1` kinds; the `/trial` yearly-plan headline.
- Carried: `/chores` "can't do it" rating and rota view; `/bills` share link
  and "costs only one of us uses"; `/cover` → `/fix`; a second-quote prompt on
  `/fix`; collect-by-message for `/split`; multiple claims per term on
  `/cover`; `/ruin` → `/cover`; the dishwasher-lifetime field on `/worth`;
  `/rule` receiving a line; `/rule` → `/later`; `a-number-appears` →
  `/walkaway`; `/round` duplicate dots; trainers' reveal focus; the journal's
  "Mark reviewed"; a real screen-reader pass; and `/crux` values → `/par`.
