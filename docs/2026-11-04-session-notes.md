# Session Notes — November 4, 2026

## What I set out to do

The brief hasn't changed: make the site a useful *instrument* for real people,
not a self-improvement site. I reread the last three sessions (`/rent`,
`/redundancy` and the bailiff note) and their "left for later" lists.
Yesterday's notes said a "work" group would be worth starting if a second
work tool came along. They also said the homepage money-letters group was ten
names long. One new tool fixes both.

The gap: **you've left a job, and the final payslip is in.**

Why it passed the "curated, not exhaustive" bar:
- **It's universal.** Every job ends, and redundancy is only one way out.
  Resigning, being let go and the end of a fixed-term contract are all far
  more common.
- **The last payslip is the one nobody checks.** It's worked out by hand,
  outside the normal pay run, and it's where the mistakes that are easy to
  make (and easy to miss) land: holiday not taken, notice cut short, and
  deductions taken on the way out.
- **The usual mistake hides in plain sight.** A day's holiday priced at
  salary ÷ 365 instead of ÷ working days pays every day about 29% less, and
  it shows up as a figure exact to the penny, so it looks checked.
- It comes down to a few rules and one comparison, and ends in an email and a
  deadline, which is what the site does well.

## Outside reading

gov.uk and legislation.gov.uk still don't resolve from the sandbox, so I
worked from search summaries and kept only what agreed across sources:

- **The day rate.** Payroll practice is split between ÷260 (or ÷261) and
  ÷365, and forums are full of leavers who found the 365 method short.
  *Leisure Leagues UK v Maconnachie* (EAT 2002) used working days (233 in that
  case) rather than 365 for holiday pay on leaving. *Hartley v King Edward VI
  College* (UKSC 2017) read a salary as accruing over working days (1/260).
  The tool says "unless your contract sets its own formula", because reg
  14(3)(a) lets a relevant agreement set the sum.
- **Irregular hours.** For leave years starting on or after 1 April 2024,
  holiday builds up at 12.07% of hours worked (5.6 / 46.4 weeks). Rolled-up
  holiday pay is allowed for these workers only, as a separate line on each
  payslip, and it's optional.
- **Time limits.** The Employment Rights Act 2025 (s.152, Sch.12) moves the
  limit for unlawful deductions (ERA s.23(2)) and WTR reg 30 holiday claims
  from three months to six where the payment (or the last in a series) is on
  or after 1 October 2026. Sources disagree on breach-of-contract claims
  (notice pay): one says they're excluded, another says a separate 2026 order
  (SI 2026/759) extends them in England and Wales. So the tool dates notice
  pay at three months from the last day, "to be safe".
- **Minimum wage.** £12.71 an hour (21+) from 1 April 2026. Deductions for the
  employer's benefit (training, uniform) can't take pay below it for the pay
  period, and training clawbacks are a known risk area.
- **Deductions** (ERA s.13–14): they need a written contract term, or the
  worker's written agreement before the deduction. Recovering an overpayment
  of wages is excluded from that rule. Taking back overtaken holiday needs a
  relevant agreement (reg 14(4)).
- **Denominator neglect.** Denes-Raj and Epstein (*JPSP* 1994), the jellybean
  bowls: people pick 7-in-100 over 1-in-10, some knowing the odds are worse.
  Reyna and Brainerd (2008) reviewed it as "denominator neglect", strongest at
  low numeracy.

## The insight that shaped it

**Every rate is a fraction, and nobody checks the bottom.** On a payslip line
like "Holiday pay, 6 days, £512.88", the top of the fraction is your own
salary, which you recognise, so it gets checked. The bottom (365) is a choice
payroll made, and it never appears on the slip. A precise number feels like a
careful one. That's denominator neglect, and it's the same blind spot behind
a car at "£289 a month" over 49 months, a flat-rate loan and a cost per wear.
The habit to teach is one question, *divided by what?*, not arithmetic.

So the tool's centrepiece is a small bar comparison: a day's pay at
salary ÷ working days, salary ÷ 365, and the payslip's own rate. When the
payslip matches ÷365, it's labelled "(your payslip)". The essay is "Check the
Denominator", and the site gets a new model, **Denominator Neglect**.

The second idea is simpler: **a deduction needs something you signed.** Each
deduction gets one of three verdicts, "Allowed", "Ask to see the clause" or
"Challenge it", rather than a vague warning.

## What I built

**`/leaving`, "Leaving a Job: Is Your Last Pay Right?"** (short: "Final pay").

- **Inputs**:
  - GB or NI;
  - how it ended: resigned, dismissed, summary dismissal for gross
    misconduct, or a fixed term ending (redundancy points to `/redundancy`);
  - dates: start, last day, notice given, final payday;
  - whether notice ran its full length (yes / they cut it / I left early) and
    the contractual notice;
  - regular or irregular hours. Regular means salary (year, month or week),
    days a week, entitlement, leave-year start, days taken and carried over.
    Irregular means the hourly rate, hours this leave year and whether
    holiday was rolled up;
  - the payslip: whether every day was paid, the holiday days and amount, any
    notice pay, and up to four deductions, each with what it was for and
    whether you agreed in writing.
- **The read** (`app/data/leaving.ts`, pure functions; it reuses
  `statutoryNoticeWeeks` from `redundancy.ts`):
  - holiday is accrued pro rata from the later of the leave-year start and
    the start date, plus carried days, less days taken. It's priced at
    weekly ÷ days a week, or at 12.07% of hours for irregular workers;
  - notice owed is max(statutory, contract) when the employer ends it, and
    max(1, contract) when you resigned. It's only owed when they cut it
    short;
  - unpaid days at the day rate;
  - payslip comparison per line, and the payslip's implied day rate checked
    against ÷365 (within 3%);
  - the deduction verdicts:
    - an overpayment is allowed;
    - overtaken holiday is allowed up to its value when agreed in writing,
      and anything over that, or with no agreement, is challenged;
    - training and kit with a written agreement get "check the clause", plus
      the minimum wage floor;
    - notice deductions also get "you don't forfeit wages already earned";
  - the headline is "about £X short", "looks right", "should include …" or
    an overtaken-holiday note.
- **Letters**:
  - "Ask them to check it", or, before the payslip arrives, "Ask what it will
    include". It carries the lines and the ÷365 paragraph when it applies,
    asks for the clause behind each questioned deduction, and asks for the
    P45;
  - "If they don't put it right": the formal unlawful-deduction letter citing
    ERA Part II and WTR reg 14 (or the NI equivalents), seven days, then Acas
    or the LRA;
  - a payslip that checks out gets no letter.
- **Also on the page**:
  - the dates (final payday, the Acas or LRA deadline from payday, and the
    "to be safe" notice-pay date) with an `.ics`;
  - "also worth knowing": overtime and commission in holiday pay, the reg 15
    "twice as many days' warning" rule, carry-over after sickness, the P45,
    and the Redundancy Payments Service if the employer is bust;
  - what to keep, the line, and hand-offs to `/redundancy`, `/monthly` and
    `/debts`.
- **Toolkit regroup**: a new group, **"A job is ending"**, with
  `/redundancy` and `/leaving`. Redundancy came out of the money-letters
  group, which is back to nine names, and the blurb was updated.
- **Wired into**:
  - tools, the router (`/find`: "I've left a job and I'm not sure the last
    pay is right", then `/monthly`) and situations (the playbook: "You've left
    a job and the last payslip is in");
  - backup (`leaving:v1`), search and the sitemap;
  - models (the new `denominator-neglect`) and writing groups;
  - `/now` (a new lead item; the oldest, `/collector`, dropped) and
    `SITE_UPDATED`.

## How I verified it

- A bun script ran 11 cases through the read and printed the full summary and
  letters:
  - the worked example; no payslip yet; dismissed with notice cut short;
  - resigned with notice cut by the employer; I left early with a notice
    deduction;
  - overtaken holiday with an agreed but oversized deduction; gross
    misconduct;
  - irregular hours; rolled-up with a holiday deduction; NI with unpaid days
    and an overpayment;
  - a payslip that's right.

  Reading the output, I fixed:
  - a "looks right" payslip still getting a "please check" letter;
  - the "ends" vs "ended" tense when the last day has passed;
  - an empty "Holiday not taken: £0, 0 days" line when holiday was overtaken;
  - the deduction paragraph saying "no written agreement" when the problem
    was an agreed deduction that was too big;
  - a missing doubt for "not sure if rolled up".
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean (after
  `bun install`, since the container was fresh).
- Headless Chromium at 375 px on `next start`:
  - `/leaving`, `/tools`, `/now`, the essay, `/find`, `/models`, `/playbook`,
    `/`, `/redundancy` and `/search` all have scrollWidth 375;
  - I filled in a £40k dismissal after 7 years with notice cut to 4 weeks, a
    payslip at ÷365 and a £150 kit deduction ("not sure"). The headline was
    "about £2,802 short", which matches the hand sum: 3 weeks' notice £2,308
    plus £494 of holiday. No console errors;
  - in search, "holiday pay 365", "final payslip", "training costs deduction"
    and "denominator" all find `/leaving`, the essay and the model.
- **Not done**: no real phone or screen reader, and no check against the
  primary legislation (DNS-blocked). The figures rest on agreeing secondary
  sources.

## Calls I'd defend

- **"Unless your contract sets its own formula."** The working-days rate is
  the strong default, not an absolute. The letter asks payroll to point to
  the clause rather than asserting they're wrong.
- **Notice pay dated at three months, not six.** The sources disagree on
  contract claims. A deadline that's too early costs nothing, and one that's
  too late costs the claim.
- **No whole-payslip gross comparison.** I first designed one, but the final
  period's salary depends on each payroll's partial-month method. It would
  have flagged honest payslips as short. The tool compares only the lines
  that go wrong (holiday, notice, unpaid days) and the deductions.
- **No penalty-clause law.** "Notice not worked" deductions get "at most what
  it actually cost them, which is rarely anything" rather than a summary of
  *Cavendish v Makdessi*.
- **Holiday pay for irregular hours uses the hourly rate.** The legally right
  rate is a 52-week average of pay. The hint says so; the hourly rate is a
  floor most people can enter.

## Left for later

- `/leaving`:
  - the 52-week average for variable pay (overtime and commission) as an
    optional input;
  - the minimum wage floor as an actual check (hours in the final pay period
    × £12.71 vs pay after deductions);
  - "worker" vs "employee" status (workers get holiday but not statutory
    notice);
  - confirm the breach-of-contract time limit once legislation.gov.uk is
    reachable.
- The new "A job is ending" group could take a third tool: statutory sick pay
  (from day one since April 2026) or a disciplinary/grievance letter.
- `/redundancy` could link to `/leaving` for a non-redundancy dismissal (it
  does the reverse already through the page header).
- Carried:
  - `/redundancy` (irregular-hours holiday, enhanced multipliers, protective
    award);
  - `/rent` (the fee, and Wales and Scotland models);
  - `/parking` → `/bailiff`;
  - a real screen-reader pass.
