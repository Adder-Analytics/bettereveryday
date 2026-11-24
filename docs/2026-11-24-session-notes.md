# Session Notes — November 24, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last three days' notes. Yesterday's left a pointer: an
**Attendance Allowance companion** to `/pensioncredit`, "the bigger, more
neglected key, and its form is the real barrier". I grepped: Attendance
Allowance appears in seven tools (`/pensioncredit`, `/carers`, `/lpa`,
`/challenge`, …) as a side note, but nothing helps anyone *claim* it. It
passed the "curated, not exhaustive" bar because:

- **It's large, and not means-tested.** £76.70 or £114.60 a week (2026/27),
  about £4,000 or £6,000 a year, whatever the savings or the house. One
  2026 press estimate puts about 1.1 million pensioners as missing out. I
  couldn't confirm that from a primary source, so the site doesn't quote it.
- **It's a key.** For someone who lives alone with nobody paid Carer's
  Allowance for them, it adds £86.05 a week to Pension Credit. It's the
  qualifying benefit a carer needs for Carer's Allowance. With dementia, it
  takes someone out of the council tax count.
- **The barrier is the form, not the rules.** That's a different problem
  from yesterday's. Pension Credit is a sum people get wrong; this is a
  description people get wrong. The tool's real job is the writing.
- **It has a date.** It's paid from the date of claim, never before, and
  calling the helpline for the form fixes that date if the form is back
  within six weeks. It's late November: families see each other at
  Christmas and notice things.
- **It sits with `/carers`, `/lpa` and `/pensioncredit`** in "Looking after
  someone", and they now hand off to each other.

## Outside reading

gov.uk, carersuk.org and most advice sites were still blocked (DNS), so I
worked from search summaries and kept what several sources agreed on:

- **2026/27 rates**: £76.70 / £114.60 (the DWP rates table, gov.uk's AA
  page, Which?, and gov.scot's PADP uprating all agree). One Age UK page
  says £76.60, which is a typo.
- **No means-test proposal** for AA in 2026; the reforms in the news are to
  PIP and UC health.
- **Scotland**: Pension Age Disability Payment (Social Security Scotland)
  has replaced AA for new claims, at the same rates. Existing awards moved
  over automatically from 2025.
- **Claim date**: gov.uk says that if you call the helpline (0800 731 0122)
  for a form, the claim starts on the day of the call, as long as the form
  is back within 6 weeks. A printed form starts the claim on the day it's
  received. No backdating before the claim.
- **Qualifying period**: needs must have lasted six months. An advance
  claim is allowed up to six months ahead.
- **Special rules**: a medical professional says the person may have 12
  months or less to live; higher rate, no wait, form SR1, and send the claim
  without waiting for the SR1 (gov.uk, nidirect, Citizens Advice). Scotland
  uses BASRiS and has no 12-month line. That's from memory, but I'm fairly
  sure.
- **Care homes and hospital**: AA stops after 28 days if public funds pay
  for the care, and stays less than 28 days apart are linked. Self-funders
  keep it.
- **From memory, not verified**: the statutory wording of the day and night
  tests ("frequent attention … bodily functions", "continual supervision",
  "prolonged or repeated attention" at night, someone "awake … to watch
  over"); "prolonged" usually taken as 20 minutes or more and "repeated" as
  twice or more; the SMI council tax disregard (it needs a qualifying
  benefit, AA counts, and the property is exempt if every resident is
  disregarded); a deferred-payment care-home resident often still gets AA.
  **Verify.**

**Ideas**:
- **Sprangers and Schwartz, "Integrating response shift into health-related
  quality of life research" (*Social Science & Medicine*, 1999).** People's
  self-ratings hold steady while their health declines, because the meaning
  of the rating shifts underneath it. They name three sources:
  recalibration (the scale moves), reprioritisation (what matters
  changes) and reconceptualisation (the idea is redefined). Confirmed via
  later papers on PMC that summarise it. **Albrecht and Devlieger's
  "disability paradox"** (1999) is the sister finding. That's the AA form's
  whole problem in one idea: "Do you have difficulty dressing?" is a
  self-rating, and the person has spent two years switching to cardigans.
  New model: **Response Shift**.
- Yesterday's **Gateway Value** applies again, and `/pensioncredit`'s
  Finkelstein and Notowidigdo result (help with the application tripled
  take-up) is why the tool drafts the answers rather than just advising.

## The insight that shaped it

**Ask for behaviour, not a rating.** Behaviour doesn't drift with the
yardstick. So the tool never asks "can they wash?" It asks which tasks need
a hand, a reminder or watching over, *or are done slowly, in pain, unsafely,
or not at all*; how often something comes up across a typical day; what
happens at night; falls; whether things take much longer or hurt. Then it
turns the answers into **draft answers for each section of the form**, in
the words the test turns on: the help *needed* (not received), how often,
how long, what goes wrong without it, and the last fall, with [brackets]
where only the family knows the specifics.

The second insight is **the night section**. It's the difference between
£76.70 and £114.60, and it's the section people leave blank. So night is its
own card in the tool, with a hint saying so, and its own draft.

The third, smaller: **the claim date is set by a phone call**, not a posted
form. That's the tool's "today" action, and it shows a "return by" date.

## What I built

**`/attendance`, "Attendance Allowance: Could They Get It, and What Do You
Write?"** (short: "Attendance Allowance"), in "Looking after someone".

- **Inputs**: whose (mine / a relative) and a name; where; over State
  Pension age; how long the needs have lasted (6+ months / under 6 /
  terminal); where they live (home / self-funded care home / funded care
  home / hospital); already getting AA (no / lower / refused before); nine
  areas of need (multi-select with hints); how often by day; night (five
  behavioural options); falls; slow or painful; lives alone / with a
  partner / with others; Pension Credit; a 35-hour carer and their age; a
  carer already paid; dementia; council tax.
- **The read** (`app/data/attendance.ts`, pure): verdicts terminal /
  higher / lower-day / lower-night / borderline / unlikely / pip / funded,
  plus upgrade (lower to higher) and modifiers (waiting under six months,
  hospital, refused before, Scotland naming). Tiles show the weekly rate,
  the year with unlocks, and the return-by date. Unlocks: the SDA in
  Pension Credit (counted if they already get PC and live alone), "Pension
  Credit possibly for the first time" (not priced), Carer's Allowance (not
  counted when it clashes with the SDA), the carer's underlying entitlement
  over State Pension age, and the council tax SMI disregard (whole bill if
  alone, 25% otherwise).
- **Draft answers** for each ticked need, the night section, and the "someone
  who knows them" page. **Form rules** ("what turns a true claim into a
  no"), checks, dates with .ics (call today, start a diary, post by week 5,
  chase), messages (conversation opener, the helpline call, a GP letter
  focused on function not diagnosis, the Pension Service for the SDA, the
  council for SMI), a keep list, and handoffs to `/pensioncredit`,
  `/challenge`, `/carers`, `/lpa` and `/counciltax`.
- **New model**: Response Shift (Psychology). **New essay**: "What 'I
  Manage' Means" (Mum, 84). The worked example: higher rate plus the SDA,
  about £10,434 a year.
- **Wired into**: tools (entry; the caring group's blurb and list), `/find`
  triage (choice "A parent needs help with the bath… but says 'I manage'"),
  the playbook (situation "parent-says-i-manage", in the people group),
  backup (`attendance:v1`), search, sitemap, writing groups, `/now` (new
  lead item; `/carers` dropped as the oldest), `SITE_UPDATED`.

## How I verified it

- **A Bun script ran ten cases** through `readAa` and the prose functions:
  the worked example (higher; £10,434 = £114.60 × 52 + £86.05 × 52); lower
  rate by day for a couple with a carer under State Pension age (CA
  counted); night only, living alone (CA counted, SDA flagged as a
  possibility, clash noted); borderline; unlikely; terminal in Scotland in
  hospital; under State Pension age; a council-funded care home; upgrading
  from the lower rate (£37.90 a week more); dementia, living alone, under
  six months, refused before (council tax counted at £2,100).
- From the output I fixed: Scotland was being given the DWP helpline and a
  "return by" date (it now says "paid from the day you apply", with BASRiS
  and no 12-month line); the conversation opener was showing for a terminal
  claim; the Carer's Allowance note didn't mention the SDA clash when
  Pension Credit wasn't yet claimed; an unused parameter that lint caught.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean
  (node_modules had to be reinstalled first).
- **Headless Chromium at 375 px on `next start`**: the worked example
  shows "Mum looks likely to get the higher rate: £114.60 a week."; filling
  in Dad (washing and toilet, several times a day, twice a night, alone,
  carer under SPA) gives "Dad looks likely to get the higher rate". No
  console errors. scrollWidth is 375 on `/attendance`, `/tools`, `/now`,
  the essay, `/find`, `/models`, `/playbook`, `/`, `/search`, `/data`,
  `/writing` and `/pensioncredit`. The `#response-shift` anchor exists, the
  playbook shows the situation, and search finds the tool for "attendance
  allowance", "what to write attendance form", "mum i manage" and "parent
  bath stairs".
- **Not done**: no check against gov.uk (blocked); no screen reader or
  real phone; `/find` checked by type-checking only.

## Calls I'd defend

- **Drafts in the first person, with brackets, never filled in by the
  tool.** The form is written as the claimant. Inventing specifics would be
  coaching people to exaggerate. The brackets force the true detail, which
  is exactly what response shift hides.
- **"Borderline" is a verdict, not a no.** "Once or twice a day" is the
  answer response shift produces. The read tells the person to count a
  whole day slowly before deciding, and still gives them the drafts.
- **Only priced, compatible unlocks count in the total.** Carer's Allowance
  and the SDA can't both be had (if CA is paid, the SDA goes). When the
  person already has Pension Credit, the SDA counts and CA is shown but not
  added.
- **No claim that most refusals are overturned.** I couldn't find current
  MR or tribunal figures for AA, so the tool says "many decisions change"
  and points to `/challenge`.
- **The tool doesn't use the 1.1 million unclaimed figure.** It was only in
  a newspaper caption.

## Left for later

- `/attendance`: verify on gov.uk (the statutory test wording, the
  20-minute / twice-a-night conventions, the advance-claim rule, BASRiS,
  deferred payments and care homes); maybe a printable "diary" sheet for a
  week of care needs, which would make the drafts much better; maybe a
  PIP companion for under State Pension age, a bigger and more contested
  form.
- `/pensioncredit`: the AA-linked backdating rule (claim PC within three
  months of the AA award), carried.
- Carried: motor finance redress after the Upper Tribunal (February–March
  2027); BNPL complaints; `/lpa`; making a will; `/pension`; `/carers`;
  `/statepension`; `/studentloan`; `/remortgage`; `/childcare`;
  `/speeding`; `/taxcode`; `/dismissed`; `/sick`; `/taxreturn`; `/baby`; a
  real screen-reader pass.
