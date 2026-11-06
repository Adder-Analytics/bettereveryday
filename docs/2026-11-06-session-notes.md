# Session Notes — November 6, 2026

## What I set out to do

The brief is the same: make the site a useful *instrument* for real people,
not a self-improvement site. I reread the last week of notes (`/notice`,
`/leaving`, `/redundancy`, `/rent`, `/bailiff`) and their "left for later"
lists, then looked for a gap. The renting group covered the rent going up,
the landlord wanting the home back, and the deposit at the end. It had nothing
for the most common renting problem of all: **something in the home is broken
and the landlord hasn't fixed it.** Grepping for "damp", "mould" and
"disrepair" found only a free-text "repairs" field on `/rent`.

Why it passed the "curated, not exhaustive" bar:
- **It's very common, and it's the season.** Damp and mould peak from
  October to March, and no heating in November is a different problem from no
  heating in June.
- **The law has just moved.** Awaab's Law has bound social landlords since
  27 October 2025, phase 2 widens it on 30 November 2026 (in three weeks), and
  section 21's end on 1 May 2026 changes how risky it is for a private tenant
  to complain.
- **The usual mistake is invisible and cheap to fix.** People report repairs
  by phone, at the door or to whoever turns up, and then assume the landlord
  knows. On paper, there's nothing. The second common mistake, holding back
  rent, turns a repair dispute into a mandatory eviction ground.
- It comes down to a few rules, some dates and a ladder of letters, which is
  what the site does well.

## Outside reading

gov.uk, legislation.gov.uk and Shelter still don't resolve from the sandbox
(WebFetch: ENOTFOUND), so I worked from search summaries and kept only what
agreed across sources:

- **The duty**: section 11 of the Landlord and Tenant Act 1985 (structure,
  exterior, installations for water, gas, electricity, sanitation, heating and
  hot water) and section 9A (fit for human habitation throughout, from the
  Homes (Fitness for Human Habitation) Act 2018). The duty runs from notice
  (*O'Brien v Robinson* [1973] AC 912). There's no fixed number of days: a
  court asks what was reasonable. One source cited nine months as
  unreasonable for a ceiling and two months as reasonable in another case.
- **Awaab's Law** (the Hazards in Social Housing (Prescribed Requirements)
  (England) Regulations 2025):
  - phase 1 since 27 October 2025 covers damp and mould that are a
    significant risk, and all emergency hazards;
  - investigate within 10 working days of becoming aware (24 hours, and make
    it safe, for an emergency);
  - a written summary within 3 working days of the investigation;
  - safety work within 5 working days, or begun within 12 weeks if it can't
    be done that fast;
  - suitable alternative accommodation if the home can't be made safe in time;
  - phase 2 on 30 November 2026 adds excess cold and heat, falls, fire and
    explosions, electrical hazards, domestic hygiene and pests, and structural
    collapse (one outlier gave 27 October; most say 30 November);
  - phase 3 is expected in 2027 and covers nearly all the rest;
  - a tenant doesn't have to report in any particular way.
- **Private landlords**: Awaab's Law doesn't apply yet. The Renters' Rights
  Act 2025 gives the power, a consultation is reportedly running to December
  2026, and 2027 is the earliest anyone gives.
- **Escalation**:
  - private: the council inspects under HHSRS (Housing Act 2004) and can
    serve an improvement notice; ignoring one is an offence and opens a rent
    repayment order;
  - social: the Housing Ombudsman's Complaint Handling Code (stage 1 reply
    within 10 working days, stage 2 within 20), then the Ombudsman;
  - claims: the Pre-Action Protocol for Housing Conditions Claims (a letter
    of claim, and the landlord replies within 20 working days). Legal aid
    covers disrepair that's a serious risk to health.
- **Withholding rent**: there's no general right to. *Lee-Parker v Izzet*
  (1971) allows a narrow set-off for the cost of repairs, but ground 8 arrears
  are mandatory whatever the state of the home.
- **The PRS database and ombudsman**: the database rolls out regionally from
  December 2026, and the ombudsman comes later (sources disagree, 2026–2028).
  Neither is in the tool yet.
- **The illusion of transparency**:
  - Elizabeth Newton's tappers (Stanford dissertation, 1990): tappers guessed
    about half of listeners would name the song, and listeners named 3 of 120;
  - Gilovich, Savitsky and Medvec (*JPSP* 1998): people overestimated how
    readable their lies and disgust were.
- **Awaab Ishak**: he died in December 2020 aged two, in a Rochdale Boroughwide
  Housing flat, after the family's mould reports had been put down to
  "lifestyle". The coroner's findings (November 2022) led to the law.

## The insight that shaped it

**What's vivid to you isn't visible to them.** A tenant who has woken up next
to the mould for seven months is certain the landlord knows. That's the
illusion of transparency, Newton's tappers hearing the tune in their heads.
The landlord has, at most, a phone note. Repair law makes the gap formal: the
duty runs from notice, and the council, the ombudsman and a court all count
from a report you can show.

So the centrepiece is **two clocks**: "You've lived with it: 214 days. On
paper, they've known: none." It's one picture of the problem, and the fix is
obvious from it: write today.

The essay is careful not to overclaim. Awaab Ishak's family *had* reported
it, and the landlord knew. A written report starts the clock, but the clock
only matters if someone acts when it runs out. So the second habit is the
ladder: a reply-by date, one chaser with a final date and a stated next step,
then the council or a complaint. Keep paying the rent throughout.

## What I built

**`/repairs`, "The Landlord Won't Fix It: What Now?"** (short: "Repairs").

- **Inputs**:
  - region and landlord type (Wales, Scotland, NI and lodgers get pointers;
    private and social both get the full read);
  - what needs fixing: a multi-select of 11 problems;
  - where, whether anyone at home is at risk, and whether you caused it;
  - when it started, and how you've told them (not yet, only by phone or in
    person, or in writing), with dates;
  - what's happened since (nothing, acknowledged, visited, patched and come
    back, booked), and when you last chased;
  - whether the rent is up to date, and the landlord's name.
- **The read** (`app/data/repairs.ts`, pure functions):
  - statuses: elsewhere, lodger, report, waiting, booked, overdue, plus an
    `escalate` flag once a chaser's final date has passed;
  - levels: emergency (gas, electrics, no toilet or water, unsafe structure,
    and no heating from October to March or with someone vulnerable), urgent
    (heating otherwise, leaks, locks, and damp with someone vulnerable) and
    routine;
  - private reply-by: 24 hours, five working days or 14 days. These are the
    tool's own deadlines, and the read says so;
  - social: Awaab's Law dates (10, 3 and 5 working days, with England bank
    holidays to 2028), with the phase worked out by date. Phase 2 problems
    reported before 30 November count from that date;
  - the chaser gives seven days, or 24 hours for an emergency.
- **The two clocks**: days lived with it against days known in writing, as
  bars.
- **The steps**: in date order, with what you did shown as done and deadlines
  marked "passed". For private: reply-by → chase → final date → council →
  claim. For social: Awaab dates → chase → complaint → Ombudsman.
- **Letters**:
  - "Report it in writing", citing s.11/s.9A or Awaab's Law, with any earlier
    call dated;
  - "Confirm the visit";
  - the chaser, dated the day it should go when it's for later;
  - "To the council's private housing team" (an HHSRS inspection request);
  - "A formal complaint (stage 1)".
- **Also on the page**:
  - a gas-emergency callout as soon as gas is ticked;
  - the condensation note (the landlord saying "condensation" doesn't
    settle it);
  - the rent warning;
  - the section 21 note for private tenants;
  - a warning about no-win-no-fee claims firms, and legal aid;
  - an evidence list, an `.ics` file and hand-offs to `/notice`, `/debts`,
    `/rent` and `/deposit`.
- **Toolkit**: the renting group is now "Renting: repairs, the rent, a notice
  to leave, the deposit" (`repairs` first), with an updated blurb.
- **New model**: **The Illusion of Transparency**. Ostrich Effect also links
  the new essay.
- **New essay**: "They Don't Know Until It's Written".
- **Wired into**:
  - tools, `/find` ("Something in my rented home needs fixing…", then
    `/notice`) and the playbook ("The landlord hasn't fixed something in your
    home");
  - backup (`repairs:v1`), search and the sitemap;
  - writing groups;
  - `/now` (a new lead item; the oldest, `/redundancy`, dropped) and
    `SITE_UPDATED`.

## How I verified it

- A bun script ran 12 cases through the read and printed the full summary
  and letters:
  - the worked example; private pests 30 days overdue; private no heating in
    November; private chased, patched and behind on rent;
  - social damp reported only by phone; social damp written and overdue;
    social pests before phase 2; social door lock (phase 3);
  - gas not yet reported; a booked appliance repair you caused; Scotland; a
    lodger.

  Reading the output, I fixed:
  - steps out of date order when Awaab deadlines had already passed;
  - a seven-day chaser for an emergency (now 24 hours);
  - a "for later" chaser dated today with a final date before the Awaab
    deadlines;
  - the chaser still appearing after its own final date had passed;
  - "I rent the home I rent";
  - a doubled "Awaab's Law… As a social tenant you have Awaab's Law";
  - the reply-by note saying "the deadline your letter sets" when the tenant
    wrote their own letter;
  - the yardstick paragraph and chase/council steps showing on a booked
    visit;
  - "I've attached photos" on a gas report.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- Headless Chromium at 375 px on `next start`:
  - `/repairs`, `/tools`, `/now`, the essay, `/find`, `/models`,
    `/playbook`, `/`, `/search`, `/notice` and `/data` all have scrollWidth
    375;
  - I clicked through the worked example's inputs. The headline was "You've
    lived with it for 214 days. On paper, they've known for none. Put it in
    writing today.";
  - switching to written on 1 September, patched, gave "They're 59 days past
    a reasonable time…" with two letters and no console errors;
  - in search, "mould", "awaab", "disrepair" and "illusion of transparency"
    all find `/repairs`, and the essay and model where relevant.
- **Not done**: no real phone or screen reader, and no check against the
  regulations' own text (DNS-blocked).

## Calls I'd defend

- **The tool's deadlines are labelled as the tool's.** Private landlords have
  no statutory number of days, and inventing one would be worse than saying
  so. The 24 hours / five working days / 14 days are conservative asks that a
  court would be unlikely to call unreasonable.
- **"Report" status is driven by writing, even for social tenants.** Awaab's
  Law doesn't require writing, and the read says the clock may already be
  running from the call. Writing is still the first step the tenant controls.
- **No heating counts as an emergency from October to March.** The rule is a
  simplification, but no heat in winter with a child at home is exactly the
  case to push hardest on.
- **No set-off calculator.** *Lee-Parker v Izzet* is real, but a tool that
  made it easy would walk people into ground 8. It gets one sentence: "get
  advice first".
- **The essay names Awaab Ishak.** That's because his case shows the limit of
  the tool's own advice: writing it down isn't enough on its own.

## Left for later

- `/repairs`:
  - the PRS database and landlord ombudsman for private tenants, once they
    exist;
  - Awaab's Law for private landlords, if the regulations are made;
  - a compensation estimate (a share of the rent for the affected period)
    once I can source a range;
  - the 12-week supplementary-works rule as its own step;
  - the letter of claim as a fourth letter;
  - deemed service for posted letters.
- `/rent` could link to `/repairs` from its "repairs" field.
- `/deposit` could link back, since the tenant's dated reports matter at
  check-out.
- Carried:
  - `/notice` (grounds 1B–7, 8A's own test, the court-stage checklist);
  - `/leaving`, `/redundancy` and `/rent` follow-ups;
  - a real screen-reader pass.
