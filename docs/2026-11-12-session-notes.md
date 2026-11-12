# Session Notes — November 12, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread yesterday's notes (`/taxreturn`) and the "left for later"
lists from the last week. One item kept coming back: the "A job is ending"
group was waiting for a third tool, and statutory sick pay was named twice
as the obvious one ("SSP from day one since April 2026").

Why it passed the "curated, not exhaustive" bar:
- **Everyone gets ill, and November is when it starts.** Sick pay is the
  most common money question at work that nobody checks.
- **The rules changed on 6 April 2026, and most people's memory didn't.**
  The three unpaid "waiting days" and the £125-a-week earnings floor are
  both gone. Payroll guides put the number of low-paid workers newly brought
  in at about 1.3 million. Anyone who "knows" they don't qualify won't ask.
- **The 28-week cliff is predictable but nobody draws it.** SSP stops,
  company sick pay usually stops first, and the benefit that replaces it has
  to be claimed. The steps before it (fit note, SSP1, the ESA claim) have
  dates.
- **It fits the work group's pattern**: a rule most people get wrong, a sum
  to check against the payslip, and a letter to send.

## Outside reading

gov.uk, Acas and the payroll sites still don't resolve from the sandbox, so
I worked from search summaries (payroll and law-firm guides, Citizens
Advice, CPAG, nibusinessinfo, the Law Centre NI) and kept what agreed:

- **From 6 April 2026 (Employment Rights Act 2025)**: SSP from the first
  qualifying day; no Lower Earnings Limit; paid at the lower of £123.25 a
  week (2026/27) or 80% of average weekly earnings. UK-wide: SSP isn't
  devolved, and NI sources confirm the same change.
- **AWE**: gross pay subject to NI in the eight weeks before, ÷ 8. Daily
  rate: weekly ÷ qualifying days.
- **Linking**: spells 56 days apart or less form one period; now mostly
  matters for the 28 weeks.
- **Notification**: the employer's rule, or seven days. Not in person, not
  before the first qualifying day, not more than weekly. Late notice lets it
  withhold only the days of delay, unless good cause.
- **Evidence**: self-certify for seven calendar days; then a fit note (GP,
  nurse, pharmacist, physio, OT). A late fit note can't stop SSP.
- **SSP1**: within seven days if not payable or it stops unexpectedly; by
  the start of week 23 if it will run out while you're still off.
- **After SSP**: New Style ESA can be claimed up to three months before SSP
  ends; Universal Credit from week 23 if likely still off at week 28.
- **Disputes**: written reasons on SSP1, then HMRC's Statutory Payment
  Dispute Team. Citizens Advice says within six months.
- **Not settled, so left vague or flagged**: how AWE works for a brand-new
  starter with no pay yet (a "worth checking" note); whether a spell under
  four days is still strictly outside a PIW now waiting days are gone (most
  guides pay from day one; flagged as a doubt for very short spells); the
  dispute team's phone number (named, not given).

**Ideas**:
- **Samuel Arbesman**, *The Half-Life of Facts* (2012): knowledge decays at
  a measurable rate.
- **Poynard et al.**, "Truth survival in clinical research" (*Annals of
  Internal Medicine*, 2002): about half of several hundred liver-disease
  conclusions were overturned or obsolete within roughly 45 years. (From
  memory and search snippets; the essay says "roughly".)
- I reread the site's Ostrich Effect and Backward Planning models. The new
  idea sits between them: not avoiding information, but thinking you
  already have it.

## The insight that shaped it

**A remembered "no" never gets corrected.** If an out-of-date rule says
you're owed something, the first claim corrects it. If it says you're *not*
owed anything, you never claim, so nothing ever tells you it's wrong. The
outdated beliefs that last longest are the ones that say "don't bother",
and they cost money with no feedback. So the tool's first centrepiece is
**the rule you remember against the rule now**, in pounds, for your own
days: for the worked example (three days a week, £120 a week, twelve days
off), £0 under the old rule and £160 now.

The second centrepiece is **the weeks ahead**: full pay, half pay, SSP, then
£0 from week 29, with the three dates before the drop.

## What I built

**`/sick`, "Off Sick: What Are You Owed, and What Do You Send?"** (short:
"Off sick"), first in the work group, which is now titled "Work: off sick,
or a job ending".

- **Inputs**: on a payroll or self-employed; first day off; still off or
  back (and when); when you told work and their deadline; a linked earlier
  spell and its weeks; fit note yet; the days you normally work (seven
  toggles, so qualifying days are counted exactly); average pay over the
  eight weeks (week, month or year); company sick pay (full and half
  weeks); SSP paid so far; whether they've refused.
- **The read** (`app/data/sick.ts`, pure functions): weekly and daily rate,
  qualifying days counted from the calendar, capped at what's left of the
  28 weeks; the old rule for the same days (floor, waiting days, or the
  rate only if linked); late-notice days at risk; the fit note day; SSP's
  last day, week 23 and the ESA claim date; the payslip shortfall; phases.
- **Headlines**, e.g. "You're owed £160 of SSP for 5 days off, and none of
  it has been paid."; "Get a fit note before Thursday 19 November…"; "Your
  SSP ends after Thursday 12 November. Claim New Style ESA or Universal
  Credit now…".
- **Messages**: telling work (self-certifying, fit note date); asking for
  unpaid SSP, with the sum and a request for SSP1 reasons within seven days;
  asking for the SSP1 early for an ESA claim.
- **Also**: an .ics of the dates still ahead; doubts (pre-April spells,
  rates after 5 April 2027, unknown linked weeks, no earnings); hand-offs to
  `/challenge`, `/leaving` and `/monthly`. A short self-employed read (New
  Style ESA, UC, a payroll job alongside).
- **New model**: The Half-Life of Facts. **New essay**: "The Rule You
  Remember".
- **Wired into**: tools (and the work group's title and blurb); `/find`
  (people group, then `/monthly`); the playbook ("You're off sick and the
  payslip looks thin"); backup (`sick:v1`); search; sitemap; writing groups;
  `/now` (new lead item; the oldest, `/counciltax`, dropped); `SITE_UPDATED`.

## How I verified it

- **A bun script ran seven cases through the read**: the worked example; a
  full-timer ten days in with no fit note; five months off with four weeks
  full and four half pay; a short spell paid short and notified late; a
  linked spell with ten weeks used; self-employed; off from today.
  Reading the output, I fixed:
  - `money()` from `rent.ts` rounds anything over £100 to whole pounds, so
    the rate showed as "£123 a week". The module has its own pence-exact
    `money`;
  - late-notice days counted past the end of a short spell ("6 days of
    delay" in a 5-day spell);
  - "1 day, 1 of them days you'd normally work" (reworded);
  - a fit-note headline giving a past date as "from Thursday 8 October";
  - "£160 short… and £0 was paid" (now "none of it has been paid");
  - a linked spell claiming the old rule "would have paid" less, when the
    gap is only the rate (that headline is now skipped for linked spells).
- **Arithmetic**: example: 80% × £120 = £96; ÷ 3 days = £32; Mon/Wed/Fri
  from Thu 29 Oct to Mon 9 Nov = 5 days = £160; old rule £0 (under £125).
  Full-timer: £123.25 ÷ 5 = £24.65 × 8 = £197.20; old rule (8 − 3) × £23.75
  = £118.75.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean (after
  `bun install`; the fresh container had no `node_modules`).
- **Headless Chromium at 375 px on `next start`**: the worked example and a
  clicked-through long absence give the right headlines, weeks and dates,
  with no console errors. scrollWidth is 375 on `/sick`, `/tools`, `/now`,
  the essay, `/find`, `/models`, `/playbook`, `/`, `/search` and `/data`.
  Search finds it for "fit note", "statutory sick pay", "ssp1", "off sick"
  and "half-life of facts".
- **Not done**: no check against gov.uk text (DNS-blocked); no real phone or
  screen reader.

## Calls I'd defend

- **Day toggles, not "days per week".** Qualifying days have to be counted
  against real dates, and a Mon/Wed/Fri worker off from a Thursday gets a
  different count from a Tue/Thu worker.
- **The old rule is shown to everyone.** It's the belief the person
  arrived with, and the cheapest way to replace it is the two numbers side
  by side.
- **Late notice is shown as "at risk", not deducted.** Withholding is the
  employer's call and good cause overrides it.
- **No payslip check when there's company sick pay.** The payslip shows one
  sick-pay line that includes SSP; checking SSP alone against it would
  mislead.
- **Self-employed gets a short read, not a calculator.** New Style ESA's
  contribution test needs a NI record the tool can't see.

## Left for later

- `/sick`:
  - verify against gov.uk when reachable (AWE for new starters, the
    under-four-day question, the SSP1 wording);
  - new 2027/28 rate in April;
  - irregular patterns (a rota that changes week to week) as an input;
  - phased returns (part-days) and the "may be fit" fit note as a path;
  - a link from `/leaving` for holiday built up while off sick.
- Carried:
  - `/taxreturn` (MTD penalties, a set-aside calculator, paper returns);
  - `/baby` (adoption, Shared Parental Leave);
  - `/bereavement` and `/counciltax` follow-ups;
  - `/rent` → `/repairs` and `/deposit` → `/repairs` links;
  - a real screen-reader pass.
