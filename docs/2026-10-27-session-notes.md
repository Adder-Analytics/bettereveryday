# Session Notes — October 27, 2026

## What I set out to do

The brief was the same as before: make this a useful *instrument* for real
people, not a self-improvement site. I reread the last three sessions
(`/flight`, `/refund`, `/debts`) and their "Left for later" lists. Then I
looked for a gap rather than a follow-up. The money tools cover buying,
paying, owing, being scammed, things breaking and flights. Nothing covered the
largest sum most renters ever hand over and then have to argue to get back.
Grepping "deposit", "landlord", "tenan" and "wear and tear" found only
passing lines (`/refund`'s section 75 "even the deposit", one essay).

The gap: **you've moved out, and the landlord or agent wants most of your
deposit back as deductions**: a new carpet, a full repaint, a professional
clean, £60 for picture-hook holes.

Why it passed the "curated, not exhaustive" bar:
- It's very common: every move out of a rented home ends here.
- The money is large: often a month's rent or more.
- It ends in a concrete action: one number to ask for, a reply, and a date.
- There's a known, specific mistake: people haggle *from the landlord's
  list*, which is anchoring. The rules give a way to price each line
  independently, and the site can do that sum exactly.
- There's a free referee (the scheme's adjudication) with a hard deadline
  that people miss.

## Outside reading

gov.uk, legislation.gov.uk and the scheme sites didn't resolve from the
sandbox (WebFetch failed on DNS), so I worked from search results: council
pages mirroring gov.uk text, the DPS guide (via its PDF host), NRLA's copy of
the TDS lifespan guide, Shelter / Shelter Cymru, law-firm write-ups, and
Scottish tribunal decisions. I kept only what agreed across sources:

- **Protection**: England and Wales, 30 days to protect in DPS, TDS or
  mydeposits and give the prescribed information. If not, England: the court
  must order the deposit back plus 1–3× (Housing Act 2004 s.213–214; claim
  survives the tenancy; six years). Wales: up to 3× (Renting Homes (Wales)
  Act 2016, s.45 and Sch. 5; Shelter Cymru's template letters say "up to",
  one says "between one and three", so the copy says "up to three times").
  Scotland: 30 working days, and the First-tier Tribunal must award up to 3×
  if you apply within three months of the tenancy ending (several 2025–26
  decisions confirm the wording and the deadline). Northern Ireland: sources
  conflict on deadlines; the penalty is a council fine, not a payment to the
  tenant, so the NI read asks for the deposit and says you'll report it.
- **Return**: the landlord must repay within 10 days of *agreeing* the
  amount (not of moving out). Disputed money stays protected.
- **Dispute**: each scheme's dispute service is free, decided on written
  evidence only (DPS: adjudicators never visit), and final. TDS and mydeposits
  take disputes within three months of the tenancy ending (mydeposits: after
  asking and waiting 10 days). I couldn't confirm DPS's window, so the copy
  says "TDS and mydeposits … check yours" and dates three months.
- **Fair wear and tear**: "reasonable use of the premises by the tenant and
  the ordinary operation of natural forces" (the DPS guide quotes it; it's
  Haskell v Marlow 1928, approved by the House of Lords in 1959). It isn't
  chargeable. Adjudicators weigh the length of the tenancy, the number and age
  of occupiers, and the condition at check-in.
- **Betterment and apportionment**: adjudicators don't award betterment. DPS's
  worked example: a £500 carpet two years into a five-year life gives a tenant
  share of £300 (remaining life ÷ total life × cost). Dorset Council's bond
  procedure uses the same formula. The TDS lifespan guide gives carpets 2–4
  years (low quality), 5–8 (medium), 8–15 (top), and decoration 3–5 years.
- **Burden**: several guides state the landlord must prove each deduction;
  the TDS case write-ups show no award without check-in evidence.
- **Outcomes**: TDS 2020–21, England and Wales: 69% of disputed deposits
  split, the tenant got all of the disputed amount in 16%. I used this to
  keep the copy honest ("adjudicators split most disputed deposits"), not to
  promise wins.
- **Cap**: Tenant Fees Act 2019, England: five weeks' rent, six from £50,000 a
  year; the excess is a prohibited payment, recoverable via Trading Standards
  or the First-tier Tribunal. Wales has no equivalent cap in what I found, so
  the check runs for England only.
- **Renters' Rights Act 2025**: Royal Assent 27 October 2025; phase one from
  1 May 2026. Sources agree the core deposit rules carry over. A claimed
  eight-week pet deposit appeared in one source only, so I left it out.
- **Anchoring**: Northcraft & Neale (1987), estate agents anchored by the
  listing price and denying it; used in the essay.

## The insights that shaped it

1. **Price each line before you look at the total.** The agent's list is an
   anchor. Splitting the difference from £1,395 still concedes most of it. So
   the tool never shows "offer X% of their total"; it prices each line from a
   rule, then adds up.
2. **The rule is "nobody ends up better off".** That single idea covers wear
   and tear (no loss to pay for), betterment (no upgrade at your expense) and
   apportionment (pay for the life you cut short). It's also general: the
   borrowed lawnmower, the scrape on an old car, indemnity vs new-for-old
   insurance. So it got an essay, "Charge for the Life That Was Left", which is
   a different idea from "Ask Once, in Writing", not a repeat of it.
3. **The burden is on them, so "no check-in inventory" helps the tenant.** The
   read and the messages say so explicitly instead of treating a missing
   inventory as the tenant's weakness.
4. **The hard date is the scheme's window, not the reply date.** Three months
   after moving out, the free referee closes. The read always shows it, and the
   `.ics` goes on the reply-by date (with the deadline in the description) or,
   if that's past, on the deadline itself.
5. **An unprotected deposit changes the whole conversation.** It isn't a
   footnote: it's its own read, with the letter citing s.213–214 (or the Welsh
   or Scottish equivalent) and the range of what a court must award.
6. **Ask for the undisputed part now.** The money nobody is arguing about
   shouldn't sit with the landlord while the rest is decided, so the reply
   asks for it.

## What I built

**`/deposit`, "Get Your Deposit Back"** (short: "Deposit back"), in the
"deciding now" group after `/flight`.

- **Inputs**: the place (carried subject seeds it) and the landlord/agent;
  England / Wales / Scotland / Northern Ireland; the deposit; the rent and
  period (England, for the cap); protected (yes / late or no details / never
  / don't know, with how to check); which scheme (the list changes by nation);
  the check-in inventory (signed / own photos / none); where it's got to (not
  moved out / not asked / asked, silence / they sent deductions / stuck /
  agreed but unpaid); the move-out date and the asked or agreed date; and up
  to 12 deductions, each with the amount, what it's for (cleaning, damage,
  wear, replacement, redecoration, rent, other), your view (fair / too much /
  not mine), the age and usual life for replacements and redecoration (ranges
  like "3 to 5" take the midpoint), and an optional fair figure.
- **The engine** (`app/data/deposit.ts`, pure):
  - Each deduction gets a verdict: `accept | apportion | spent | wear |
    unproven | refuse | offer | open`, with a one-sentence reason that goes
    into the letters.
  - Totals: claimed, fair (capped at the deposit), back, undisputed, the
    England cap and any excess.
  - Kinds, checked in order: `living | unprotected | late | agreed | ask |
    wait | reply | dispute`.
  - Messages: the first ask, the reply to deductions, the statement for the
    scheme's form, the chase for an agreed amount, the unprotected-deposit
    letter (by nation), and the letter before a small claim.
  - It reuses `/refund`'s date helpers (`addMonthsISO` is now exported).
- **The read** shows the headline (spoken) and body; a priced table (claimed
  struck through, fair beside it, the total and what comes back); the cap
  note; the message with copy; the scheme statement in a collapsible; the
  reply-by date, the last day to raise the dispute (or apply to the tribunal),
  and the `.ics`; a "protected late" note; the evidence list (before moving
  out, and for the dispute); the line; copy-the-whole-plan; handoffs to
  `/split`, `/bills` and `/rule`.
- **Worked example**: three years, £1,200 deposit, £1,395 of deductions
  (carpet £600 at 5 of 6 years, repaint £450 at 3 of 5, clean £250 offered
  £80, hook holes £60, blind £35 accepted). The read: fair £395, ask for £805
  back. Dates are relative to today.

**The essay**: "Charge for the Life That Was Left" (`/writing/…`), in the
"people" writing group and linked from the Anchoring model.

**Wired in**: `tools.ts` and its group; the router (other-people group);
the playbook situation `deposit-deductions` (anchoring, sludge); search (the
tool ranks first for "landlord keeping deposit", "wear and tear" and
"tenancy deposit scheme dispute"; "refund" still ranks `/refund` first and
"flight delay compensation" `/flight`); the sitemap; the backup registry
(`deposit:v1`); `/now` (new lead item; the oldest, `/scam`, dropped); a
pointer from the `/refund` header; `SITE_UPDATED` → October 27.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean, and
  `/deposit` is static.
- A scratch script checked 30 hand-worked cases:
  - the DPS example (£500, 2 of 5 years → £300);
  - past its life (→ £0, "spent");
  - "fair" view still apportioned when the item was old, but a new one kept;
  - wear, unproven with no inventory, open items, claims above the deposit;
  - the cap (£1,100/month → £1,269.23; £1,000/week → six weeks; none in
    Wales) and the excess;
  - every stage, including the 14-day wait, the three-month "late" switch
    (not in Scotland), unprotected, the Scottish tribunal date, the agreed
    pay-by, and the reply-by clamped to the dispute deadline;
  - two not-ready cases; and ranges ("3 to 5 years" → 4).
- The same script fuzzed 40,000 random drafts through parse → read → every
  text function: no undefined, NaN, null, Infinity or `[object`; fair never
  above the deposit; back never negative; all eight kinds occurred.
- Headless Chromium at 375 px on `next start`:
  - `?subject=` seeded the field;
  - the example headline rendered;
  - a typed three-item list gave the expected read and survived a reload;
  - switching to "stuck" changed the read to the dispute;
  - scrollWidth was 375 and there were no page errors;
  - I checked screenshots of the form and the read by eye;
  - `/tools`, `/playbook`, `/now`, `/refund` and the essay all link to it.
- **Caught while testing**:
  - `/tools` didn't list it: the group's `toolIds` is a separate list. Fixed.
  - "In any case, release the undisputed part" sat on its own line. Joined.
  - The age and life labels wrapped unevenly at 375 px. Shortened.
  - "It was about 2 years old" read oddly for a repaint. Now "The decoration
    was…".
  - Rejected lines read "£60 claimed, £0 fair". Now "(£60): I don't accept
    this", which is how a person would write it.
- **Not done**: a real screen reader, a real phone, clicking copy or opening
  the `.ics`; no lawyer has read the letters; I couldn't read gov.uk or the
  statutes directly today.

## Calls I'd defend

- **Your view is an input, not something the tool guesses.** Only the tenant
  knows whether they broke the blind. The tool's job is to price honestly
  given that view, and to apportion even when the tenant says "fair", because
  people concede full replacement cost without knowing they needn't.
- **No invented lifespans.** The tool asks for the age and life, with the
  TDS guide's ranges in the hint, rather than baking in numbers for
  mattresses or sofas I couldn't source.
- **"Too much" without a figure stays open**, counted at the claimed amount,
  and the letter asks for the invoice. Guessing a number would put words in
  the tenant's mouth.
- **Scotland and Northern Ireland are covered honestly, not fully.** The
  pricing applies everywhere (adjudication works the same way), but the
  dispute deadline is only dated for England and Wales, where I could source
  it.
- **An essay this time.** The last session skipped one because the idea
  repeated an existing essay. This one doesn't: apportionment and betterment
  are a reusable sum, not a restatement of "ask in writing".

## Left for later

- `/deposit`:
  - the DPS dispute window, confirmed from its own rules;
  - a "check-in day" mode: the inventory review and photos list as a
    printable checklist;
  - joint tenancies (one deposit, several tenants, one of them leaving);
  - holding deposits (the 15-day rule under the Tenant Fees Act);
  - the Renters' Rights Act's later phases, if they touch deposits.
- `/flight`: the voucher counter-reply; package holidays; Canada's APPR.
- `/refund`: the reply-by on the return desk; energy and telecom as named
  sectors.
- Carried over: the `/debts` 0% end date; the `/scam` share card; `/sell`
  many-items; `/lend` check-offs; the `/monthly` pay-in-four `.ics`;
  `renewals:v1` kinds for `/bills` and `/chores`; the `/chores` rota; a real
  screen-reader pass.
