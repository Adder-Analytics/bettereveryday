# Session Notes — November 8, 2026

## What I set out to do

The brief is the same: make the site a useful *instrument* for real people,
not a self-improvement site. I reread the last week of notes (`/challenge`,
`/repairs`, `/notice`, `/leaving`, `/redundancy`) and their "left for later"
lists, then looked for a gap rather than a follow-up. The letters group
covered bailiffs (the end of the chain) and old debts, and `/bailiff` already
said "council tax" in its worked example. But nothing covered **the part of
the chain before bailiffs**, where council tax arrears are cheapest to fix.
Grepping found council tax only as a creditor type inside `/bailiff`,
`/collector` and `/bills`.

Why it passed the "curated, not exhaustive" bar:
- **It's the most common priority debt, and it escalates fastest.** England's
  arrears were reported at about £7.4bn at 31 March 2026, and National
  Debtline's FOI work says about 1.72 million council tax cases went to
  bailiffs in 2025/26.
- **The usual mistake is invisible and cheap to fix.** A missed £196 feels
  like a £196 problem. Seven days after the reminder, it's the rest of the
  year (an acceleration clause most people have never heard of). One email
  before then usually fixes it.
- **It's newly timely.** On 12 October 2026 the government confirmed
  England's enforcement reforms (council tax information letter 5/2026), in
  force from April 2027. People will read about "63 days" and "12 months" and
  think it applies now. It doesn't.
- **The bill is often wrong in the household's disfavour.** Discounts and
  disregards (students, carers, apprentices, severe mental impairment) are
  opt-in. That's often more money than the missed month.

## Outside reading

gov.uk, mhclgmedia.blog.gov.uk and legislation.gov.uk still don't resolve
from the sandbox (WebFetch: ENOTFOUND), so I worked from search summaries
(council pages, Citizens Advice, National Debtline, Shelter's debt round-up,
Carers UK, MoneySavingExpert, and reports of the MHCLG letters) and kept only
what agreed across sources:

- **Current process (England and Wales)**:
  - reminder: seven days to pay the missed instalment, or the instalments go
    and the rest of the year falls due (most councils' wording: seven days
    after that);
  - a second reminder can come once in a year; a third miss loses the
    instalments without one;
  - a final notice, then a summons, served at least 14 days before the
    hearing. Costs are set by each council; examples found were £57.50 +
    £20, £65 + £35 and £40 + £30, so the tool says "often £70 to £100" and
    "set by your council";
  - paying everything, costs included, before the hearing stops the order.
    Inability to pay isn't a defence.
- **After a liability order**:
  - attachment of earnings, deductions from benefits (including UC), bailiffs
    (£79 / £247 from May 2026, matching `/bailiff`), a charging order,
    bankruptcy;
  - committal in England only, and rare. It was abolished in Wales in 2019;
  - a request for information must be answered within 14 days (from memory,
    worded as "can mean a fine");
  - no liability order for tax that fell due more than six years before the
    summons (from memory, consistent with `/collector`).
- **The 2027 reform (England)**:
  - a reminder *and* a final notice before instalments can be lost;
  - the final notice no sooner than 41 days after the first missed payment
    and 14 days after the last reminder, then 21 days to catch up;
  - 12 monthly instalments the default for newly liable taxpayers from April
    2027, everyone from April 2028.

  Secondary sites mention a £100 fee cap. I couldn't confirm it, so it's not
  on the site.
- **Discounts**:
  - 25% when one adult counts; 50% when none do;
  - exempt when all are full-time students, or the only resident has a
    severe mental impairment;
  - the carer disregard: 35+ hours, living with the person, not their
    partner or the parent of a child under 18;
  - disabled band reduction: the band below, and a sixth off in band A
    (Carers UK and Citizens Advice's "17%" both agree; my first instinct of
    "a ninth" was wrong);
  - SMI backdating can go back years (an MSE-reported case of ten years);
  - Valuation Tribunal: write to the council first; appeal within two
    months of its reply, or four months from your letter if it doesn't
    answer.
- **Scarcity**:
  - Mullainathan and Shafir, *Scarcity* (2013);
  - Shah, Mullainathan and Shafir, "Some consequences of having too little"
    (*Science*, 2012): poorer players borrowed from future rounds at steep
    rates and ended up worse off;
  - Mani et al., "Poverty impedes cognitive function" (*Science*, 2013):
    the mall car-repair prime and the sugarcane farmers;
  - Carvalho, Meier and Wang (*AER*, 2016) found no payday effect on
    cognitive tests, so the model and essay say to hold the size loosely and
    lean on the attention-narrowing part.

## The insight that shaped it

**The cheapest letter is the one that's easiest to put off.** Earlier essays
covered the ostrich effect (not looking) and fee schedules as clocks. Today's
is about why a *small* letter gets deferred even by people who do look:
scarcity tunnels attention onto what's due this week, and a letter about one
month's money sorts itself into "deal with it at payday". The system is built
as a cliff, not a slope. The reminder's seven days are the cheap exit, and
that's exactly the window the tunnel hides.

So the centrepiece is **the cliff, drawn to scale**: the missed instalment
beside the rest of the year, as two bars. "Same debt, 4 times the bill, a week
apart." The second centrepiece is a **ladder** of every step with what each
adds and a "you are here" marker. It turns a pile of differently-worded
letters into one picture of where you are and what the next rung costs.

The second insight is that **the bill is a default about your household.** It
assumes every adult counts. That's the Defaults model applied to a bill most
people never read. The household check asks two questions (how many adults,
how many on the doesn't-count list) and compares the result with what the bill
shows.

## What I built

**`/counciltax`, "Behind on Council Tax: What Happens Next?"** (short:
"Council tax").

- **Inputs**:
  - region (England, Wales, Scotland, NI);
  - the latest letter: just the bill, missed, reminder, final notice,
    summons, liability order, or bailiffs;
  - the date on the letter, or the hearing date;
  - optionally, the year's bill, paid so far, 10 or 12 instalments, and band;
  - who lives there: adults, how many don't count (with the list), and
    whether all are students;
  - the discount on the bill now; a disabled resident's room or space; low
    income;
  - can you pay (all, a plan, nothing).
- **The read** (`app/data/counciltax.ts`, pure functions):
  - statuses (elsewhere, check, missed, reminder, final, summons, order,
    bailiff);
  - the act-by date, and the whole-year-due date for old rules;
  - the earliest final notice under the 2027 rules;
  - instalment and balance;
  - countable adults and the expected discount against the billed one;
  - band-reduction factors from the ninths;
  - a fair yearly bill and the saving, in whole pounds;
  - the ladder with the current rung.
- **Headline**: e.g. "Pay the missed £196 by Thursday 12 November and you
  keep paying monthly. Miss it and £784 is due at once."
- **Body by stage**: the reminder's seven days and the cliff; the final
  notice and asking to be reinstated; the summons (pay everything first, or
  agree a plan before the hearing; the narrow defences; the court can't set
  instalments); the liability order (each power; deductions add nothing,
  bailiffs add £79/£247; reply to an information request in 14 days;
  committal England-only and rare). Breathing Space when nothing can be
  paid; a note that the 2027 rules don't apply to letters before then.
- **"Is the bill right?"**: the discount gap with the yearly saving and
  backdating; the SMI exemption for a sole resident; the disabled band
  reduction; Council Tax Reduction for a low income.
- **Letters**:
  - keep the instalments, reinstate them, a plan before the hearing,
    deductions instead of bailiffs, or time while you get advice;
  - a discount/disabled-band letter asking for backdating, with the
    Valuation Tribunal route in its note.
- **Also**: a `.ics` file for the seven days, the final notice, or two days
  before and on the hearing; free help and ombudsmen; hand-offs to
  `/bailiff`, `/debts`, `/challenge` (low income) and `/scam` (council tax
  refund texts).
- **Pointers**: Scotland (summary warrant, 10% surcharge, sheriff officers)
  and NI (rates, Land & Property Services) get a pointer.
- **New model**: **Scarcity and Tunneling**. Defaults and the Ostrich Effect
  also link the new essay.
- **New essay**: "The Whole Year Falls Due".
- **Wired into**:
  - tools (the money-letters group, between the catch-up bill and old debt,
    with an updated blurb);
  - `/find` ("I'm behind on council tax", then `/debts`);
  - the playbook ("You've fallen behind on council tax");
  - backup (`counciltax:v1`), search, the sitemap and writing groups;
  - `/now` (a new lead item; the oldest, `/leaving`, dropped) and
    `SITE_UPDATED`.

**Homepage fix (carried for a week)**: the money-letters group was nine long
names run together. `ToolGroup` gets an optional `compact` flag, and the
homepage lists a compact group by its short labels ("Parking ticket ·
Council tax · Bailiff's letter …"), with the full name as the link title.
Only the letters group uses it. Its short labels name the letter in front of
you, while the weighing group's ("Survive it", "Widen") wouldn't stand alone.

## How I verified it

- A bun script ran 11 cases through the read and printed the full summary,
  letters and reminders:
  - the worked example; a reminder past its seven days; a final notice with a
    low income;
  - a Welsh summons; a summons whose hearing has passed; a liability order;
  - a band-A disabled reduction with 50%; an all-student exemption; a
    reminder under the 2027 rules;
  - Scotland; bailiffs.

  Reading the output, I fixed:
  - savings shown in pence (£666.67), now whole pounds;
  - "ring before the date" shown after the date had passed;
  - the second-reminder sentence shown under the 2027 rules;
  - the SMI-exemption line shown for two adults;
  - the "line to keep" (about seven days) shown for Scotland and NI.
- `bun install`, then `bunx tsc --noEmit`, `bun run lint` and `bun run build`
  are all clean.
- Headless Chromium at 375 px on `next start`:
  - I clicked through a reminder case with the household inputs. The
    headline, cliff, ladder and both letters rendered with no console errors;
  - screenshots of the worked example's cliff and a summons case's ladder
    look right;
  - `/counciltax`, `/tools`, `/now`, the essay, `/find`, `/models`,
    `/playbook`, `/`, `/search` and `/data` all have scrollWidth 375;
  - in search, "council tax", "liability order", "single person discount"
    and "scarcity" all find the tool;
  - the homepage shows the compact letters row.
- I caught an arithmetic slip in the worked example's story ("spread over the
  last four months", when three were left).
- **Not done**: no real phone or screen reader, and no check against the
  regulations' text or the MHCLG letter itself (DNS-blocked).

## Calls I'd defend

- **Before bailiffs, not instead of `/bailiff`.** The bailiff stage hands off
  rather than duplicating the fee and visit logic.
- **Counts, not a disregard questionnaire.** Two questions (adults, how many
  on the list) get the discount right for nearly every household. The list is
  shown in full, so the person does the classifying with the facts in front
  of them.
- **Summons costs as a range with "set by your council".** The tool doesn't
  invent a national figure.
- **The 2027 rules are modelled, but only by the letter's date.** A reminder
  dated from 1 April 2027 in England gets the new timings. Everything before
  gets today's rules and one sentence saying the new ones don't apply yet.
- **No £100 fee cap, no "63 days" headline.** I couldn't verify the cap, and
  sources word the 63 days inconsistently, so the tool uses the two numbers
  the government letter is quoted on: 41 and 21.

## Left for later

- `/counciltax`:
  - attachment of earnings percentages (the table, once legislation.gov.uk is
    reachable) and the benefit deduction amount;
  - Wales's own reforms, if it follows England;
  - Scotland as a real path (summary warrant, 10%, the Debt Arrangement
    Scheme);
  - a "they've taken it from my wages" check;
  - empty-home premiums and Class F (after a death), which belong with a
    bereavement tool if one comes;
  - check the April 2027 regulations when they're laid.
- A bereavement admin tool ("someone has died: what's due when") is the
  biggest gap I noticed: register in 5 days, Tell Us Once, the Bereavement
  Support Payment's 3-month window, council tax Class F, probate.
- Carried:
  - `/challenge` (descriptor texts, Adult Disability Payment, housing benefit
    and council tax reduction appeals);
  - `/repairs`, `/notice` follow-ups;
  - `/rent` → `/repairs` and `/deposit` → `/repairs` links;
  - a real screen-reader pass.
