# Session Notes — November 13, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread yesterday's notes (`/sick`) and the work group. The group
covered sick pay, redundancy money and the final payslip, but nothing for
the most common bad day at work: **being sacked**. `/redundancy` and
`/leaving` both mention the tribunal deadline in passing, and neither asks
the first question people have: *can I do anything at all?*

Why it passed the "curated, not exhaustive" bar:
- **Both rules people "know" moved this autumn.** "Two years to claim" and
  "three months to do it" are what a friend will say. The deadline became
  six months less a day for jobs ending from 1 October 2026; the
  qualifying period becomes six months for jobs ending from 1 January 2027.
- **It's timely in a dated way.** Anyone let go in the next seven weeks is
  next to the 1 January line, and the statutory-notice rule means a
  no-notice dismissal from about 25 December already lands on the right side.
- **The common move is the expensive one.** People wait for the internal
  appeal. The appeal doesn't pause the tribunal clock; only Acas does.
- **It fits the work group's pattern**: a rule most people get wrong, a
  date, and letters to send.

## Outside reading

gov.uk, Acas and legislation.gov.uk still don't resolve from the sandbox
(I tried Acas directly: DNS-blocked), so I worked from search summaries of
law-firm and HR-publisher guides and kept what agreed:

- **Time limits (GB)**: six months less a day where the effective date of
  termination is on or after 1 October 2026; three months before. Acas's
  worked examples: 30 Sep 2026 → 29 Dec 2026; 1 Oct 2026 → 31 Mar 2027.
  Breach of contract in the tribunal reportedly follows; one source says
  discrimination stays at three, most say six, so the tool flags it and
  gives the safe three-month date.
- **Early conciliation**: required, free; Day A to Day B doesn't count;
  at least a month after the certificate; up to 12 weeks for notifications
  from 1 December 2025. An employer-only notification doesn't stop the clock.
- **Qualifying period**: two years → six months for EDTs from 1 January 2027
  (the redundancy notes cite SI 2026/559). s.97(2) adds statutory notice not
  given, PILON included. Firms agree a no-notice dismissal after about
  24–25 December 2026 carries over; they disagree on whether those cases
  keep the compensation cap (flagged).
- **Caps**: week's pay £751 (from 6 April 2026); compensatory award the
  lower of £123,543 or 52 weeks' pay, removed from 1 January 2027.
- **Not settled, so left vague**: whether the s.92 written-reasons
  threshold also falls to six months (the tool says "with two years'
  service … ask anyway"); tribunal fees (not mentioned).

**Ideas**:
- **Kleven & Waseem**, "Using Notches to Uncover Optimization Frictions and
  Structural Elasticities" (*QJE*, 2013): bunching below Pakistan's tax
  notches, but many people stuck in the dominated band just above.
- **Marinescu**, "Job Security Legislation and Job Duration" (*Journal of
  Labor Economics*, 2009): when the UK cut the qualifying period from two
  years to one in 1999, the firing hazard for workers with one to two years'
  tenure fell about 26% relative to longer-tenure workers (the published
  figure; a working paper says 29%; the site says "about a quarter").
- I reread the Bright-Line Rules and Backward Planning models. Notches is
  the other side of a bright line: a line chosen for you, which the
  informed side already knows.

## The insight that shaped it

**A notch rewards whoever knows exactly where the line is, and the law
measures the distance in a way the letter doesn't show.** Service runs to
the end of the notice, and notice not given (or paid in lieu) is added
first. So the tool's centrepiece is **your service against the line**,
counted the law's way, with the days short or the "carried over" note.
Its headline is **the clock**: the Acas date, with the appeal explicitly
not pausing it.

The worked example shows both: eight months in, sacked "for performance"
with a week in lieu after asking about holiday pay. The ordinary claim is
49 days short of the line, but asking about holiday pay is asserting a
statutory right (no service needed), and the deadline is 5 May 2027, not
February.

## What I built

**`/dismissed`, "Dismissed: Do You Have a Claim, and By When?"** (short:
"Dismissed"), second in the work group, now titled "Work: off sick, let go,
or a job ending".

- **Inputs**: GB or NI; dismissed, resigned because of treatment, or not
  yet (a meeting coming); start date; the day told; notice worked, paid in
  lieu or none (and the last day); the reason given; seven "might be behind
  it" toggles (pregnancy/family, asking about pay or rights,
  whistleblowing, health and safety, union, disability, other protected
  characteristics); the process and the appeal; pay, date of birth and
  contractual notice (optional); Acas contact and certificate dates.
- **The read** (`app/data/dismissed.ts`, pure functions, reusing
  `statutoryNoticeWeeks`, `redundancyWeeks` and `fullYears` from
  `redundancy.ts`): EDT; the s.97 qualifying EDT; whether it clears the line
  (two years before 2027, six months from 1 January 2027, a year in NI);
  days short; for "not yet", the first protected date and the first
  no-notice dismissal date that carries over; the Acas date; the claim
  deadline with the pause and the one-month floor (or the latest estimate
  while conciliation runs); notice pay owed; basic award; compensation cap.
- **Claim by claim**: unfair (or constructive) dismissal, automatically
  unfair, discrimination, notice pay, wages and holiday (→ `/leaving`),
  redundancy pay (→ `/redundancy`).
- **Letters**: written reasons (s.92); the appeal with grounds that fit the
  inputs; notice pay; for "not yet", a pre-meeting letter asking for the
  case in writing and a companion.
- **Also**: an .ics; doubts (the carried-over cap question, discrimination
  limit, constructive dismissal's high bar, missing certificate date);
  what to keep; home-insurance legal cover; benefits.
- **New model**: Notches. **New essay**: "The Day Before the Line".
- **Wired into**: tools (work group title and blurb), `/find`, the playbook
  ("You've been sacked and told there's nothing you can do"), backup
  (`dismissed:v1`), search, sitemap, writing groups, `/now` (new lead item;
  the oldest, `/bereavement`, dropped), `SITE_UPDATED`.

## How I verified it

- **A bun script ran ten cases**: the worked example; no-notice dismissals
  on 28 and 20 December 2026 with 18 months (carried over vs five days
  short); three years with worked notice short of the contract and Acas
  dates; a September 2026 dismissal (old three-month limit); "not yet" at
  four months and at a year; NI; a resignation with a disability flag; Acas
  contacted, no certificate. Reading the output, I fixed:
  - the "needs two years, reached in 49 days" contradiction (now names both
    sides of the 1 January line);
  - "you were given less than the legal minimum notice" for a resignation
    and for PILON (each now has its own sentence);
  - "the employer has to show a fair reason" for constructive dismissal;
  - the notice-extension paragraph showing for people with years of
    service it didn't affect;
  - a muddled "earliest/latest" headline while conciliation runs.
- **Arithmetic**: 3 years, age 46, £2,500 a month: £576.92 a week ×
  4.5 weeks = £2,596 basic award; contract 4 weeks, 21 days worked = 1 week
  short ≈ £577. Acas 25 Nov 2026 → certificate 10 Jan 2027 = 46 days, so
  22 May 2027 → 7 July 2027.
- `bunx tsc --noEmit`, `bun run lint` (after `eslint --fix` for one
  entity-space guard) and `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: a clicked-through case
  gives the right headline, clock and line, no console errors; scrollWidth
  375 on `/dismissed`, `/tools`, `/now`, the essay, `/find`, `/models`,
  `/playbook`, `/`, `/search` and `/data`. Search finds it for "unfair
  dismissal".
- **Not done**: no check against gov.uk/Acas text (DNS-blocked); no real
  phone or screen reader.

## Calls I'd defend

- **The deadline is the headline, not the claim.** Whether there's a claim
  can be argued later; a missed date can't.
- **"Not yet" is a stage.** The most useful moment to know the line is
  before the meeting, and the letter that asks for the case in writing is
  cheap then.
- **No compensatory-award estimate.** It depends on how long it takes to
  find work and on mitigation; a number would be false precision. The
  basic award and notice pay are formula-based, so those are shown.
- **The timing note is careful.** Dismissing just before the line isn't
  unlawful; the tool says so, and only suggests writing the timing down.

## Left for later

- `/dismissed`:
  - verify against gov.uk/Acas when reachable (discrimination limit,
    s.92 threshold, the carried-over cap);
  - NI's own rules in more depth;
  - fixed-term contracts ending, and probation;
  - a link from `/redundancy` and `/leaving` into it.
- Carried: `/sick` follow-ups (gov.uk checks, 2027/28 rate, rotas);
  `/taxreturn` (MTD penalties, set-aside calculator); `/baby` (adoption,
  ShPL); `/rent` → `/repairs` links; a real screen-reader pass.
