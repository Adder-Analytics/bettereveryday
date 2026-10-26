# Session Notes — October 26, 2026

## What I set out to do

The brief was the same as before: make this a useful *instrument* for real
people, not a self-improvement site. I reread the last two sessions (`/refund`,
`/debts`) and their "Left for later" lists. `/refund` covers goods and services
under the Consumer Rights Act. It listed "flights (UK261 compensation)" as a
gap, and grepping for "flight", "UK261" and "delay compensation" found nothing.

The gap: **your flight landed hours late, was cancelled at short notice, or
you were bumped, and the airline says it was extraordinary circumstances.**

Why it passed the "curated, not exhaustive" bar:
- It's very common.
- The money is large: £220–£520 per passenger, and £1,400 for a family of four
  on a medium-haul flight.
- The rules are a fixed table, so the site can do the sum exactly instead of
  describing it.
- People reliably leave the money behind, or pay a claims company a share for
  filling in one form.

## Outside reading

legislation.gov.uk and caa.co.uk didn't resolve from the sandbox again, so I
worked from search snippets of those pages plus guides. I kept only what agreed
across sources:

- **Regulation 261/2004 (UK261 / EU261), Article 7**: £220 / £350 / £520 (EU
  €250 / €400 / €600) for flights up to 1,500 km, 1,500–3,500 km and over
  3,500 km. legislation.gov.uk snippets confirmed the bands. Every
  intra-EU flight over 1,500 km gets the middle amount.
- **The long-haul 3–4 hour half (£260)**: several guides report it, and it's
  attributed to the CAA. Article 7(2) lets the airline halve the amount when a
  rerouted arrival is within 2 / 3 / 4 hours (by distance); courts applied the
  same reduction to delays. One source said £520 from 3 hours. I went with the
  CAA-attributed £260.
- **Sturgeon v Condor (CJEU, 2009)**: delay of 3+ hours at arrival pays like a
  cancellation. Arrival is measured when the doors open.
- **Article 5(1)(c)** (legislation.gov.uk snippet and the Spanish regulator
  AESA): with 14+ days' notice, no compensation. With 7–13 days, none if the
  new flight left ≤2h early and arrived <4h late. With <7 days, none if it
  left ≤1h early and arrived <2h late.
- **Extraordinary circumstances**: van der Lans v KLM (C-257/14, 2015)
  confirmed by search. Jet2 v Huzar (CA 2014), Krüsemann (C-195/17, 2018) and
  SAS (C-28/20, 2021) I cite from knowledge; the search returned only
  secondary mentions of Huzar.
- **Coverage**: departing UK/EU on any airline; arriving UK from outside on a
  UK or EU airline (AirHelp's table, CAA-attributed); arriving EU on an EU
  airline. A UK airline flying into the EU from outside is covered by neither.
- **Escalation**: AviationADR's own pages say you need a final response or
  eight weeks before going to ADR. ADR is free and binding on the airline. If
  the airline isn't in a scheme, the CAA's PACT takes it.
- **EU261 reform**: a provisional agreement was reached in June 2026 (DLA
  Piper) and is expected in force in 2027. Sources disagree on whether the
  3-hour threshold survived, so the copy says only that changes are agreed
  but not in force, and that UK261 is unchanged.
- **Not used**: claims-company fee percentages, because I couldn't confirm a
  figure. I also left out "many airlines pay when the claim is filed", which
  I couldn't source.

## The insights that shaped it

1. **The amount is a table, not a negotiation.** So the read leads with the
   number per passenger, multiplied by the passengers on the booking. People
   underclaim by forgetting everyone on the booking.
2. **The reason they give is a claim, not a ruling.** "Technical issue" is the
   most common reason, and it's the one the law has already answered. The
   claim cites the case that answers the specific reason given. When the
   reason really might be extraordinary (weather, ATC), the message doesn't
   claim the cash outright. It asks them to *name* it for this flight and
   show their reasonable measures, and still claims expenses, because care is
   owed whatever the cause.
3. **Care is separate from compensation.** Meals, a hotel, a refund after five
   hours, and the choice of refund or new flight are owed even when no cash
   is. So the read always lists them, including on the "under three hours"
   and "two weeks' notice" reads.
4. **Date the free escalation, not just the reply.** For flights the real
   next step (ADR or the CAA) opens at eight weeks, or sooner with a final
   response. So the key date and the `.ics` are the escalation date. The
   pay-by date (14 days) is in the letter. This is the same
   implementation-intention move as `/refund`, with the rung the law actually
   provides.
5. **Ask for money, not vouchers.** Every message says it.

## What I built

**`/flight`, "Flight Delayed or Cancelled"** (short: "Flight compensation").
It sits in the "deciding now" group, after `/refund`.

- **Inputs**:
  - which flight (carried subject seeds it) and the airline;
  - what happened: delayed (or missed connection on one booking),
    cancelled, or bumped;
  - the date and the number of passengers;
  - where it left from and where it ended up (UK / EU+EEA+CH / elsewhere),
    and the airline's base when that matters;
  - the distance band, with example routes;
  - for a cancellation, the notice given; how late you finally arrived (or
    didn't fly); for a cancellation, whether the replacement left early;
  - the reason given, the money spent while waiting, and where the claim has
    got to.
- **The engine** (`app/data/flight.ts`, pure):
  - Regime: `uk` | `eu` | `none`.
  - The amount, with the Article 7(1)(b) intra-EU cap, the long-haul half,
    the Article 5 reroute exemption and the Article 7(2) halving.
  - Kinds, checked in order: `outside | under | excused | old | ask | wait |
    escalate`.
  - The airline claim (or an expenses-only claim, or the "name the cause"
    letter), the ADR / CAA / national-body text, the care list, the line,
    and a plain-text summary.
  - It reuses `/refund`'s date helpers.
- **The read** shows:
  - the headline (spoken) and body;
  - the messages, each with a copy button;
  - the pay-by date, and the escalation date with an `.ics`;
  - "what you were owed at the airport";
  - a footnote on US rules and the EU reform;
  - the line, and copy-the-whole-plan;
  - handoffs to `/refund` (the rest of the trip), `/scam` (cold calls
    offering to claim for you) and `/rule`.
- **Worked example**: four passengers, Gatwick to Faro, 4h40 late, "technical
  issue", refused. The read is £1,400 + £46 to ADR. Dates are relative to
  today.

**Wired in**:
- `tools.ts` (after `/refund`);
- the router (other-people group);
- the playbook situation `flight-went-wrong`;
- search (the tool ranks first for "flight delay compensation", "uk261",
  "denied boarding" and "extraordinary circumstances"; "refund" still ranks
  `/refund` first);
- the sitemap;
- the backup registry (`flight:v1`);
- `/now` (new lead item; the oldest one, `/sell`, dropped);
- a pointer from the `/refund` header;
- `SITE_UPDATED` → October 26.

I added no new model or essay. Sludge, implementation intentions and "Ask
Once, in Writing, With a Date" are the right ideas, and a second essay saying
the same thing would be padding.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean, and
  `/flight` is static.
- A scratch script checked 22 hand-worked rule cases. They covered each band
  under both regimes, the intra-EU cap, the long-haul half, the out-of-scope
  routes (US→UK on a US airline; US→EU on a UK airline), all three notice
  windows with reroutes either side of the limits, bumped-and-halved, the
  6-year limit, and the wait and escalate stages. All passed after one fix.
- The same script fuzzed 40,000 random drafts through parse → read → every
  text function:
  - no undefined, NaN, null, Infinity or `[object` in any text;
  - every `ask` read had valid dates;
  - all seven kinds occurred.
- Headless Chromium at 375 px on `next start`:
  - `?subject=` seeded the field;
  - the example headline rendered;
  - a cancelled <7-day reroute read gave the halved £350 for two;
  - reload kept the inputs, and "refused" switched the read to ADR;
  - scrollWidth was 375 and there were no page errors;
  - I checked a full-page screenshot by eye;
  - `/tools`, `/playbook`, `/now` and `/refund` all link to it.
- **Caught while testing**:
  - Cancel with 14+ days' notice never produced a read, because it waited
    for a "how late" answer that's hidden in that case. Fixed.
  - The "name the cause" letter mangled its amount sentence ("Under …, The
    flight distance is …"). Rewritten.
  - The reason line said "delay" on cancellations.
  - The ADR text addressed the airline as "you" for unknown reasons.
  - "Claim £350 for the 2 of you yourself" read badly; it's now "Claim £350
    yourself, for both of you" ("for all 4 of you" for larger groups).
- **Not done**:
  - a real screen reader, a real phone, clicking copy, or opening the
    `.ics`;
  - no lawyer has read the letters;
  - I didn't verify the CAA's own page text directly.

## Calls I'd defend

- **Distance as three bands with example routes, not airport codes.** A
  coordinates table typed from memory would be a new source of wrong answers.
  The band is the only thing the law uses, and "search the distance" is one
  step.
- **"Missed connection" folded into delay.** On one booking, the law looks only
  at arrival at the final destination, so it's the same question.
- **Excused reasons get a "name it" letter, not a "you owe nothing".** The
  burden is on the airline, and the reason given at the desk is often not the
  one that survives.
- **Escalation date as the `.ics`, not the pay-by date.** Eight weeks is when
  something free and binding becomes available. A reminder on day 14 would
  mostly prompt a chase that achieves nothing.
- **No EU country-by-country time limits.** They vary widely. The copy says
  "often shorter" and "claim soon" rather than tabulating.

## Left for later

- `/flight`:
  - a "they offered vouchers" counter-reply;
  - package holidays (Package Travel Regulations: the organiser is liable);
  - Canada's APPR and the US DOT refund rule as their own reads, not a
    footnote;
  - a return-desk entry for the escalation date;
  - updating the EU branch when the reform's final text is in force.
- `/refund`: the reply-by on the return desk; energy and telecom as named
  sectors; the counter-offer helper; links from `/fix` and `/cover`.
- Carried over: the `/debts` 0% end date; the `/scam` share card; `/sell`
  many-items; `/lend` check-offs; the `/monthly` pay-in-four `.ics`;
  `renewals:v1` kinds for `/bills` and `/chores`; the `/chores` rota; a real
  screen-reader pass.
