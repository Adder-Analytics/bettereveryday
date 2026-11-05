# Session Notes — November 5, 2026

## What I set out to do

The brief is the same: make the site a useful *instrument* for real people,
not a self-improvement site. I reread the last two sessions (`/leaving`,
`/redundancy`) and their "left for later" lists, then looked for a gap rather
than a follow-up. The renting tools covered the rent going up (`/rent`) and
getting the deposit back (`/deposit`). They had nothing for the bigger
moment in between: **the landlord wants the home back.** Grepping "evict"
found only passing mentions.

Why it passed the "curated, not exhaustive" bar:
- **It's common, and the rules have just changed.** Section 21 ended on
  1 May 2026. The last window to use an old notice closed on 31 July. Every
  notice from now on is a section 8 on Form 3A with a ground, and most tenants
  (and plenty of landlords) don't know what that means.
- **The usual mistake is very costly and easy to fix.** People read the date
  on the notice as the day they have to be out. They move out early (and can
  lose the council's help), or they stop paying because it feels over. That
  turns a defensible arrears case into a mandatory one.
- **There's one number that changes the outcome.** Ground 8 (mandatory
  arrears) needs three months' rent owed *at the hearing*. Bring it under the
  line and the court has to judge what's reasonable instead of having to
  evict.
- It comes down to a few rules, a timeline and a figure, and ends in letters
  and dates, which is what the site does well.

## Outside reading

gov.uk, legislation.gov.uk, Shelter and the NRLA still don't resolve from the
sandbox (WebFetch: ENOTFOUND), so I worked from search summaries and kept only
what agreed across sources (law firms, landlord bodies, council pages, Shelter
summaries quoted in search):

- **Section 21**: abolished for assured tenancies from 1 May 2026. A notice
  served before then (s21, or s8 on the old Form 3) could only be taken to
  court by the earlier of its own limit and **31 July 2026**. The NRLA says
  that route is now closed.
- **Form 3A**: the prescribed section 8 form for private landlords from
  1 May 2026.
- **Notice periods** (the figures most sources give; some tables disagree):
  - 4 months: grounds 1 (moving in), 1A (selling) and 6 (redevelopment);
  - 4 weeks: grounds 8, 8A, 10 and 11 (arrears);
  - 2 weeks: grounds 12 (breach), 13 and 15 (damage);
  - none: grounds 14 (anti-social behaviour) and 7A (serious anti-social
    behaviour).
- **First year**: a notice on grounds 1 or 1A can't expire in the tenancy's
  first 12 months. There's also a 12-month ban on re-letting after using
  them.
- **Ground 8**: three months' rent (13 weeks for weekly rent) owed both at
  service and at the hearing. Arrears caused only by a Universal Credit
  payment delay don't count. Ground 8A covers repeated arrears.
- **Lapse**: proceedings have to begin within 12 months of service.
- **Deposit bar**: on most grounds (not anti-social behaviour), a court can't
  order possession while a deposit is unprotected, unless it has been
  protected late or returned. Sources agree on the bar but differ on the
  details, so the tool flags it for an adviser rather than calling the notice
  invalid.
- **Homelessness**: from 1 May 2026, a valid s8 notice whose date falls
  within 56 days makes a private tenant "threatened with homelessness", so
  the council owes the prevention duty (Shelter, via search).
- **Housing Loss Prevention Advice Service**: free legal advice once there's
  a notice, with no means test, and a duty adviser at court.
- **Court steps** (from memory of the rules, consistent with the summaries):
  - the first hearing is at least 28 days after the claim (CPR 55.5);
  - a possession order gives 14 days, up to six weeks for exceptional
    hardship (Housing Act 1980 s.89);
  - after that, a warrant and bailiffs;
  - anything else is illegal eviction (Protection from Eviction Act 1977).
- **Authority bias**:
  - Bickman (*J. Applied Social Psychology* 1974): passers-by obeyed trivial
    requests far more often when the requester wore a guard's uniform;
  - Milgram (1963) as the famous extreme.

## The insight that shaped it

**A notice borrows the authority of the court it mentions.** Form 3A is a
real legal form, with ground numbers and statute on it, and it ends in a
date. It looks like an order. But it's one side's paperwork, and what the date
actually means is "the earliest I can *ask* a court". A judge hasn't seen it.
Bickman's uniform is the clean version of the effect: people respond to the
signs of authority, not to whether anyone actually has it. Private parking
charges that look like council fines and debt collectors' talk of "field
agents" use the same trick. So the tool's centrepiece is a **timeline**,
which puts the date in the notice in the *middle* of the line, not at the
end:

notice → council help (−56 days) → the date in the notice → the earliest
hearing (+28) → the earliest you could have to leave (+14).

Each step is labelled as the soonest the law allows. On a four-week arrears
notice, the earliest real date is about ten weeks from service.

The second idea is **the next payment matters most**. The date pushes people
to stop paying, but ground 8 is judged on the day of the hearing. The tool
draws the arrears against the line and gives the one figure: in the worked
example, **£251** on £3,100 owed at £950 a month.

## What I built

**`/notice`, "A Notice to Leave: Do You Have to Go?"** (short: "Notice to
leave").

- **Inputs**:
  - region and landlord type (Wales, Scotland, NI, social and lodgers get
    pointers);
  - what arrived: Form 3A; a section 21; a text, email or own-words letter;
    "not sure"; or court papers (with an optional hearing date);
  - for Form 3A: the date it arrived, the date in the notice, the tenancy
    start, the grounds (a multi-select of 11), and for arrears grounds the
    rent period, rent, what's owed and any UC delay;
  - the deposit and what you'd like (stay, go, or not sure).
- **The read** (`app/data/notice.ts`, pure functions):
  - statuses: elsewhere, social, lodger, court, informal, s21, old, invalid,
    lapsed, valid;
  - checks: the notice period against the longest ground, the first-year
    rule for 1/1A, a "just met" warning for postal service, the 12-month lapse
    and the pre-May cut-off;
  - ground 8: threshold, whether it's met, and `payToDrop` (rounded up to a
    pound, so you land at least £1 under the line). Under the line isn't
    "invalid": the ground just can't succeed if it stays there;
  - mandatory vs discretionary wording, the deposit flag, and the council
    date.
- **Letters**:
  - "Why the notice doesn't work" (invalid, s21, old, lapsed) or "Reply to
    the message" (informal);
  - "An offer on the arrears", with the lump sum to get under the line, rent
    as it falls due, and `[amount] a month`, plus the UC paragraph;
  - "Agree a moving date" (if you want to go), or "Acknowledge it, on the
    record" (with a question about the sale or the move-in for 1A/1);
  - "To the council's housing team", citing s.175/s.195 HA 1996 depending on
    whether the 56 days have started.
- **Also on the page**:
  - the arrears bar and the timeline;
  - an `.ics` with the council date, the earliest court date and the lapse
    date, or the hearing;
  - what to keep, free help and what's illegal, the line, and hand-offs to
    `/debts`, `/walkaway`, `/deposit` and `/bailiff`.
- **Toolkit regroup**: a new group, **"Renting: the rent, the deposit, a
  notice to leave"** (`rent`, `notice`, `deposit`). The money-letters group
  drops to seven, and its blurb was updated.
- **New model**: **Authority Bias**. Ostrich Effect also links the new essay.
- **New essay**: "The Date on the Notice".
- **Wired into**:
  - tools, `/find` ("The landlord has served a notice to leave", then
    `/debts`) and the playbook ("The landlord has served a notice to leave");
  - backup (`notice:v1`), search and the sitemap;
  - writing groups;
  - `/now` (a new lead item; the oldest, `/bailiff`, dropped) and
    `SITE_UPDATED`.

## How I verified it

- A bun script ran 11 cases through the read and printed the full summary
  and letters:
  - the worked example; a valid 1A; 1A in the first year; ground 1 with only
    two months' notice;
  - weekly ground 8 under the line with an unsure UC delay; ground 14 on an
    "unsure" letter with no date;
  - s21; an old Form 3; a lapsed (served 2025) notice; informal; court papers.

  Reading the output, I fixed:
  - a ground 8 under the line reading as "the notice doesn't work" (it's a
    ground that will fail, not an invalid notice);
  - a "You don't have to be out on [service date]" headline for no-notice
    grounds;
  - an arrears-specific example ("something off the arrears") on an ASB
    notice;
  - the paragraph order (ground 8 before "with ground 8 out of the way");
  - "each month's rent" on weekly tenancies;
  - "served on X," comma splices in the letters;
  - the "just met" postal doubt showing on notices that were already
    invalid.
- `bunx tsc --noEmit`, `bun run lint` (one `entity-text-space` hit, fixed
  with `--fix`) and `bun run build` are clean.
- Headless Chromium at 375 px on `next start`:
  - `/notice`, `/tools`, `/now`, the essay, `/find`, `/models`, `/playbook`,
    `/`, `/rent` and `/search` all have scrollWidth 375;
  - I filled in the worked example by clicking through. The headline was
    "Pay £251 off the arrears…", and the bar, timeline and letters rendered
    with no console errors;
  - in search, "section 8", "eviction notice", "form 3a" and "authority
    bias" all find `/notice`, the essay, the model and the playbook.
- **Not done**: no real phone or screen reader, and no check against the
  primary legislation or the Form 3A guidance (DNS-blocked).

## Calls I'd defend

- **Under the ground 8 line isn't "invalid".** "What you owe now" isn't what
  was owed at service, so the tool can't say the notice failed. What it can
  say truthfully is that ground 8 won't succeed if you stay under the line.
- **Earliest dates only, never estimates.** I'd have liked "usually 3–6
  months", but I couldn't source a figure. The timeline gives legal minimums
  and says real dates are later.
- **The deposit is a flag, not a verdict.** The bar is real, but the cure
  rules are unclear in the sources, so it goes to the adviser.
- **"Agree a date" is offered, not pushed.** Staying until the bailiffs is a
  right, but it can add court costs. The tool says both and lets the person
  choose.
- **The notice periods are the majority view.** One source gave 3 months for
  1/1A, and another gave 4 weeks for ground 14. The page footnote says to
  check with an adviser.

## Left for later

- `/notice`:
  - grounds 1B, 2, 4, 5A–5H, 6A/6B and 7, which currently come under
    "another ground";
  - 8A's own test (three times in three years);
  - deemed service by post as an input rather than a doubt;
  - confirm the periods for 7A and 14, the deposit-bar cure, and the 12-month
    lapse wording, once legislation.gov.uk is reachable;
  - a court-stage path with the N11R defence points as a checklist.
- Social housing notices (pre-action protocol, Form 3) could be a mode
  rather than a pointer.
- Carried:
  - `/leaving` (the 52-week average, the minimum wage check, worker vs
    employee);
  - `/redundancy` (irregular-hours holiday, enhanced multipliers);
  - `/rent` (the fee, and Wales and Scotland);
  - a real screen-reader pass.
