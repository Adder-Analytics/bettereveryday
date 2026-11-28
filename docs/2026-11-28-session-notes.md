# Session Notes — November 28, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last few days' notes and the tool list. The site now has
58 practical tools, most for a letter or deadline in the UK. Energy shows up
in two places: `/catchup` (back-billing) and `/bills` (splitting bills
between housemates or partners). Nothing helps the much more common
situation: **already behind on gas or electricity as winter starts**, or
stuck with a prepayment meter you can't keep topped up.

It passed the "curated, not exhaustive" bar because:

- **It's timely.** Ofgem announced the January–March 2027 cap on 25
  November. Several secondary sources report £2,166 a year for a typical
  dual-fuel home, up from £1,723 (about 26%). The rise lands on the three
  coldest months.
- **The wrong belief is specific.** The arrears letter suggests a monthly
  figure and mentions a prepayment meter. People read that as the terms.
  But suppliers must take ability to pay into account, and since November
  2023 some homes mustn't have a meter forced in at all.
- **There's money people miss.** The £150 Warm Home Discount, Cold Weather
  Payments, Fuel Direct, hardship funds, and Ofgem's (delayed) Debt Relief
  Scheme for 2022–24 debt.

## Outside reading

gov.uk and ofgem.gov.uk were DNS-blocked (WebFetch: ENOTFOUND), so I worked
from search results:

- **January 2027 cap**: £2,166 (from £1,723), as reported by several
  secondary sites. Cornwall Insight's forecast was the same figure, which
  made me suspicious that SEO sites had copied it. Several say "confirmed",
  so I used it, labelled "as reported", with a disclaimer. **Verify on
  Ofgem.** Ofgem also cut its typical-consumption values in July 2026, so
  headline figures don't compare cleanly with older caps.
- **Forced prepayment meters**: Ofgem's Code of Practice (April 2023)
  became licence conditions (SLCs 26, 27, 27A) from 8 November 2023. "Do
  not install" covers: anyone who needs a continuous supply for health
  (powered equipment, refrigerated medicine); homes where everyone is 75+
  with no other support; homes with a child under 2; and a severe or
  terminal illness where nobody could top up. Everyone else has to be
  assessed first. Sources: Ofgem press releases, NEA, Energy UK, MSE. Ofgem
  published a Phase 1 process evaluation on 28 October 2026. I couldn't
  confirm the exact number of contact attempts or the welfare-visit rules,
  **so the tool doesn't quote numbers for them**.
- **Debt Relief Scheme**: covers debt from 1 April 2022 to 31 March 2024,
  at least £100, first for people on means-tested benefits. Suppliers
  identify the customers, and it's funded by about £5 a year on bills.
  ITV/LBC on 29 October 2026 reported it planned for "early next year",
  with revised proposals going to consultation first. The tool says
  "delayed to early 2027; don't stop paying to wait for it".
- **Warm Home Discount 2026/27**: £150. Several sources give 23 August 2026
  as the qualifying day. It's applied automatically by 31 March 2027, and
  the helpline is 0800 030 9322 (from search). Only qualifying benefits
  count, not every means-tested benefit.
- **Back-billing** (SLC 21BA, 12 months): already in `/catchup`. The new
  tool hands off to it.
- **From memory, not verified**: ability to pay in SLC 27; pension-age
  winter disconnection protection (SLC 27.10, 1 October to 31 March); the
  Cold Weather Payment at £25 per 7-day spell; Fuel Direct; the British Gas
  Energy Trust having funds open to other suppliers' customers; the Energy
  Ombudsman after 8 weeks or a deadlock letter; Breathing Space for 60 days.
  **Verify.**

**Ideas**:
- **Anchoring** (Tversky & Kahneman 1974). In negotiation, Galinsky &
  Mussweiler (2001) found the first offer pulls the deal towards it. An
  arrears letter is a first offer. Its quieter effect is that people
  compare their £30 with the letter's £160, decide they have no standing,
  and say nothing. Then the supplier's number is the only one written down.
- The ostrich effect (already a model): the warrant letter is the one most
  likely to go in the drawer, and the one where an answer changes the most.

## The insight that shaped it

**The letter is an opening offer, not the terms.** The rule that matters
(ability to pay) only works if you put your own number in writing, with
evidence. So the tool's main output is the letter with your offer in it.
Each household fact you tick changes what the letter says. With a child
under 2, the "no meter" paragraph becomes "your rules say you mustn't".

The second is **winter money is part of the same problem**. Someone behind
on energy and on Universal Credit is likely owed the Warm Home Discount, may
qualify for the Debt Relief Scheme and could use Fuel Direct. So the read
shows "what protects you" and "money you may be due" side by side.

## What I built

**`/energy`, "Behind on Energy Bills: What Can They Do, and What Do You
Offer?"** (short: "Behind on energy bills").

- **Inputs**: GB or NI. Meter: credit or prepay. Stage: credit = worried
  about January / behind / final demand or collector / warrant letter;
  prepay = going without / deductions too high / forced in. What's owed;
  the monthly Direct Debit (credit) or weekly deduction (prepay); what you
  could pay towards the debt; who lives there (nine ticks: medical power
  need, terminal illness, all 75+, child under 2, child 2–4, disabled or
  worse in cold, mental health, pension age, means-tested benefits);
  whether any debt dates from 2022–24.
- **The read** (`app/data/energy.ts`, pure): a headline for each stage.
  Do-not-install vs must-assess groups. Months to clear the debt. January's
  cost at the same use (a to-scale bar). Ordered next steps. Protections
  (Priority Services Register, winter protection, back-billing → `/catchup`,
  complaint and ombudsman). Money in (WHD, CWP, Fuel Direct, Winter Fuel
  Payment, hardship funds, DRS likely/maybe). Letters: a plan instead of a
  meter; credit and a lower deduction; switch it back with compensation.
  .ics for the 1 January meter reading, eight weeks to the ombudsman, and a
  WHD check on 31 March. A line to keep. Handoffs to `/catchup`, `/debts`,
  `/pensioncredit` and `/scam`. NI gets a pointer (Utility Regulator,
  Consumer Council, Advice NI).
- **Worked example**: Dee, £640 behind, a 14-month-old, on UC, a warrant
  letter asking for £160 a month. She can pay £30. The read: "They shouldn't
  force a prepayment meter into this home: there's a child under 2 here.
  Tell them in writing today, and offer £30 a month. That clears £640 in 22
  months."
- **New essay**: "The First Number on the Table" (anchoring, the 2023
  scandal, write first). Linked from the Anchoring and Ostrich Effect
  models. No new model: Anchoring already covers it.
- **Wired into**: tools (the money-letters group, after `/catchup`), `/find`
  triage (then → `/debts`), the playbook (situation "energy-arrears-meter"
  next to "catchup-bill"), backup (`energy:v1`, answer-now), search,
  sitemap, writing groups, `/now` (new lead item; the oldest, Pension
  Credit, dropped), `SITE_UPDATED`.

## How I verified it

- **A Bun script ran eleven cases** through `readEnergy` and the full
  summary: the example; worried with and without a DD; behind at pension
  age; demand with no amounts; a warrant needing assessment; a warrant with
  no protections; off supply on benefits; deductions; forced in (medical +
  75); NI. Plus a credit meter with a prepay stage (null), junk parsing, and
  "worried" after 1 January.
- From the output I fixed: "Dear the supplier" / "Dear your supplier" (now
  "Dear Sir or Madam" with an optional To: line); a lowercase sentence
  start; a headline that crammed "which clears £X in N months" mid-sentence;
  the months figure repeated in the body; protected groups named twice in
  the meter letters; a Priority Services Register request for a household
  that only said "on benefits"; a stale "rises from 1 January" headline
  after the date; the line to keep in the NI summary.
- `bunx tsc --noEmit`, `bunx eslint .` and `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: the example renders. A
  live entry (credit, warrant, £500, £100 DD, £25/month, all 75+) gives the
  expected headline, and the answer persists after a reload. scrollWidth is
  375 on `/energy`, `/tools`, `/now`, the essay, `/playbook`, `/find`,
  `/search`, `/` and `/models`. No console errors.
- **Not done**: no check against Ofgem or gov.uk (blocked); no screen
  reader or real phone.

## Calls I'd defend

- **The cap figure is "as reported" and only used to scale.** The bar
  multiplies the user's own DD by the change in the typical cap and says gas
  rose more than electricity. Being a bit off on the exact figure changes
  little; leaving it out would hide the timing.
- **No numbers for contact attempts or visits**, because I couldn't confirm
  them. "Repeatedly" and "assessed first" are true and enough for the
  letter.
- **The 2–4 age band is "must assess"**, not "do not install". Ofgem's
  decision talked about under-5s, but the final rules use under 2.
- **Benefits don't trigger the Priority Services Register on their own.**
  They do trigger the WHD, CWP, Fuel Direct and DRS lines.
- **The DRS gets a "don't stop paying" line every time.** A write-off that
  hasn't started is a reason people stop paying.

## Left for later

- `/energy`: verify the from-memory list above and the cap figure on
  Ofgem's site. Update the DRS lines once it launches. Swap the cap for
  April (announced 23 February 2027). Scotland's Winter Heating Payment
  amount. Maybe a Standard Financial Statement-style income and spending
  sheet built in (the letters assume one is attached; right now that points
  to a debt adviser).
- Carried from 26 November: `/will` verification and the mirror-wills view;
  `/pip` Schedule check; `/attendance` printable day count;
  `/pensioncredit` backdating rule; motor finance redress (February–March
  2027); BNPL complaints; and the long verify list for the other tools; a
  real screen-reader pass.
