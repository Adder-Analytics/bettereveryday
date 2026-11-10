# Session Notes — November 10, 2026

## What I set out to do

Same brief: make the site a useful instrument for real people, not a
self-improvement site. I reread the last two days' notes (`/counciltax`,
`/bereavement`) and the tool index, looking for a gap rather than a
follow-up. Grepping for "maternity", "paternity" and "child benefit" found
them only in passing (inside `/bereavement`'s BSP rules). Nothing covered
**having a baby**: the most common life event with money and deadlines
attached.

Why it passed the "curated, not exhaustive" bar:
- **Hundreds of thousands of people a year go through it**, usually for the
  first time, so nobody knows the rules from last time.
- **The deciding date is hidden.** Statutory Maternity Pay is decided by the
  *qualifying week* (the 15th week before the due week, about 25 weeks
  pregnant), not the due date. That week settles whether you qualify (26
  weeks with the employer), how much the first six weeks pay (90% of
  earnings in the eight weeks up to it, uncapped), and when you must tell
  work. People plan around the due date.
- **A common, innocent move is expensive.** Unpaid leave or cut hours in
  those eight weeks lowers all six 90% weeks. In the worked example, two
  weeks' unpaid leave costs about £800.
- **It's newly timely.** Paternity leave became a day-one right in Great
  Britain on 6 April 2026, but Statutory Paternity Pay still needs 26 weeks.
  People will read "day one" and assume the pay follows. It doesn't.
- **The quiet deadlines after the birth match yesterday's tool**: Child
  Benefit only backdated three months, the £500 Sure Start Maternity Grant
  shut six months after the birth, paternity pay within a year.

## Outside reading

gov.uk still doesn't resolve from the sandbox, so as before I worked from
search summaries (payroll firms' 2026/27 rate notes, Turn2us, Working
Families, Citizens Advice, Social Security Scotland, CPAG, law firms on the
Employment Rights Act 2025) and kept only what agreed across sources:

- **Statutory pay 2026/27**: £194.32 a week (up from £187.18) for SMP's weeks
  7–39, SPP, ShPP and Maternity Allowance; the lower earnings limit is £129
  (up from £125). Sources differ on whether the new rate starts 5 or 6 April.
  It doesn't matter for this tool.
- **SMP**: 26 weeks' employment continuing into the qualifying week, and
  earnings at or above the LEL in the 8-week reference period. Notice by the
  end of the qualifying week. Leave from 11 weeks before the due week. MATB1
  from 20 weeks before; hand it over within 21 days of SMP starting. The
  employer confirms the return date within 28 days.
- **Maternity Allowance**: worked in 26 of the 66 weeks before the due week,
  earning £30 a week on average in 13 of them. Claim from 26 weeks pregnant.
  Backdating is three months (sources agree on that, though they word it
  differently).
- **Paternity**: day-one leave in GB from 6 April 2026 (not NI). The pay
  still needs 26 weeks (the government factsheet is quoted as saying "the
  26-week qualifying period for Paternity Pay is unchanged"). A temporary
  28-day notice rule applied to babies due 5 April–25 July 2026. Otherwise
  notice by the end of the qualifying week, and 28 days before each block.
- **Birth registration**: 42 days in England, Wales and NI; 21 in Scotland.
- **Child Benefit**: £27.05 eldest, £17.90 others (3.8% uprating); backdated
  three months; the HICBC runs from £60k to £80k. Claiming gives NI credits.
- **Sure Start Maternity Grant**: £500, from 11 weeks before the due date to
  6 months after the birth, usually first child only.
- **Scotland's Pregnancy and Baby Payment**: £796.65 for a first child,
  £398.35 for later ones (from April 2026, per Social Security Scotland's
  March 2026 notice and Turn2us). From 24 weeks to 6 months after the birth.

**Ideas**:
- **Park, Lu & Hedgcock**, "Relative Effects of Forward and Backward
  Planning on Goal Pursuit" (*Psychological Science*, 2017). Across five
  studies, backward planning raised motivation and goal expectancy and
  lowered time pressure, mainly for complex goals, and in one study it went
  with better exam marks. Their mechanism is that starting from the end makes
  the steps and their order visible. (I read press and university summaries,
  not the paper itself.)
- I reread Reinertsen's cost of delay and the mere urgency effect from
  yesterday's model. The tail end of this tool is the same idea.

## The insight that shaped it

**The deciding date sits upstream of the date you're watching.** Yesterday's
idea was loud versus quiet deadlines. Today's is *early* versus *late*: the
due date is on the fridge, but the money is decided fifteen weeks before it.
Counted forward, week 25 is a Tuesday like any other. Counted back from the
due date, it's the first thing you hit. That's backward planning, and it
generalises: university applications, mortgage offers expiring before a move,
visa renewals.

So the tool has two halves:
1. **Count back** (before the birth): a ruler of the pregnancy from week 0 to
   due, with today, the 8-week reference period and the qualifying week
   drawn where they really fall.
2. **Sort by cost of delay** (after the birth), reusing `/bereavement`'s
   money / has-a-date / no-deadline tags and timeline.

The second centrepiece is **your pay through the year**: a 52-bar step chart
against your usual pay (dashed). It dates the two drops, at week 7 (to
£194.32) and week 40 (to nothing), and gives the year's gap in pounds. Most
people learn about the week-40 cliff when it arrives.

## What I built

**`/baby`, "A Baby's Coming: What to Tell, Claim, and By When?"** (short: "A
new baby"), in a new tool group, "A baby's coming".

- **Inputs**:
  - region; which parent you are (giving birth, or the partner); due date;
    date of birth once born;
  - work (employed, self-employed, not working); start date with this
    employer; gross pay (week, month or year), optional; planned leave
    start, optional; told your employer yet;
  - means-tested benefits; another child under 16; the higher earner's
    income band.
- **The read** (`app/data/baby.ts`, pure functions):
  - EWC (the Sunday on or before the due date), the qualifying week, its
    Saturday (the notice deadline), and the latest start date for 26 weeks;
  - pay kind and amounts: SMP, MA, SPP, none or unknown, each with a
    one-sentence reason;
  - the items: telling work, the reference period (shown only before the
    qualifying week ends), MATB1, Maternity Allowance, leave start, SSMG or
    the Pregnancy and Baby Payment, Healthy Start or Best Start Foods,
    registering the birth, Child Benefit (worded by income band), reporting
    to UC, paternity leave within 52 weeks, shared parental leave;
  - the pay-drop dates from the leave start.
- **Headline**:
  - "Tell your employer by Saturday 2 January, the end of the week that
    decides about £9,653 of maternity pay.";
  - otherwise "Claim Maternity Allowance from …", "Your maternity pay is
    settled at about …", an open-now item, or the next money date.
- **Letters**: maternity notice (with MATB1, the 28-day return-date request,
  KIT days and holiday questions, the risk assessment) and paternity notice
  (covers what form SC3 asks).
- **Also**:
  - an .ics with a week's warning; "what can wait" (childcare codes, a will,
    flexible-working requests about three months before returning);
  - free help (Maternity Action, Working Families, Acas, with the tribunal
    time limit);
  - hand-offs to `/bills` (a half-each split stops being fair when one pay
    drops), `/leaving` (holiday accrued on leave) and `/challenge`.
- **New model**: Backward Planning (Park, Lu & Hedgcock). Cost of Delay now
  also links the new essay.
- **New essay**: "Count Back from the Due Date".
- **Wired into**: tools and the new group; `/find` (people group, then
  `/bills`); the playbook ("A baby's on the way", people group); backup
  (`baby:v1`); search; the sitemap; writing groups; `/now` (new lead item,
  the oldest, `/repairs`, dropped); `SITE_UPDATED`.

## How I verified it

- **A bun script ran 7 cases through the read**:
  - the worked example; a new job (MA fallback); an NI partner with SPP; a
    GB partner in a new job (leave yes, pay no);
  - a Scottish self-employed mother on UC after the birth with another
    child; not working, on benefits;
  - past the qualifying week with notice already given.

  Reading the output, I fixed:
  - the reference-period item showing after it had passed;
  - "Nothing here costs money before the birth" appearing while the MATB1
    was still due (now "Your maternity pay is settled at about …");
  - Healthy Start being skipped in the headline when it was open now;
  - "the date that settles" (wrong: the notice doesn't settle the pay; the
    week does);
  - a duplicate partner branch.
- **The worked example's arithmetic**: £600/wk AWE → £540 × 6 + £194.32 ×
  33 = £9,652.56. Two unpaid weeks in eight cut the AWE by 25%, so the loss
  is £540 × 6 × 0.25 = £810 ("about £800"). Weeks 7–39 are unaffected
  because 90% of £450 is still above £194.32. I changed the story from
  "after Christmas" to "next month": the example is dated relative to today,
  and a monthly payslip in January could fall outside the reference period.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are all clean. One
  self-inflicted TS error came from my /now edit script (a doubled
  `className`).
- **Headless Chromium at 375 px on `next start`**:
  - a clicked-through employed case shows the right headline, with no
    console errors;
  - the first count-back bar (startBy to a year after) was an unlabeled row
    of ticks, so I redrew it as the pregnancy (week 0 → due) with Today,
    Week 25 and Due labelled. That reads at a glance;
  - the pay chart's axis labels overlapped at phone width (fixed: three
    labels, larger font), and the right-hand amounts wrapped (fixed:
    nowrap);
  - all checked pages have scrollWidth 375: `/baby`, `/tools`, `/now`, the
    essay, `/find`, `/models`, `/playbook`, `/`, `/search` and `/data`;
  - in search, "maternity pay", "paternity", "child benefit" and "backward
    planning" all find the tool.
- **Not done**: no check against gov.uk text (DNS-blocked), no real phone or
  screen reader.

## Calls I'd defend

- **One tool, two roles, not two tools.** The partner runs it too. The
  household items (Child Benefit, registration, grants) show for both, so
  either parent's copy of the list is complete.
- **A week counts if you're employed for any of it** (start date ≤ the
  Saturday of week 1 of the 26), and the date is shown as "about". The HMRC
  rule is fiddly at the edge, and payroll confirms it.
- **No enhanced-pay modelling.** Employer schemes vary too much. The tool
  says to check the handbook, and the chart is labelled "statutory".
- **No Healthy Start or Scottish Child Payment amounts.** I couldn't confirm
  2026/27 figures, so I named the schemes without numbers.
- **Universal Credit is a pointer, not a calculation.** SMP counts as
  earnings and MA doesn't. That's stated, but UC is too household-specific to
  model here.
- **Adoption and surrogacy are named as out of scope** rather than
  half-handled.

## Left for later

- `/baby`:
  - verify against gov.uk when reachable (the 26-week counting edge, MA
    backdating wording, SSMG exceptions);
  - adoption (matching date instead of EWC);
  - premature births before the qualifying week (SMP still payable if the
    service would have been met);
  - a Shared Parental Leave planner (who takes which weeks, with the pay);
  - a return-to-work / flexible-working request letter;
  - pregnancy discrimination and the tribunal clock (3 months less a day,
    Acas early conciliation) as its own path.
- Carried:
  - `/bereavement` and `/counciltax` follow-ups (see Nov 8–9 notes);
  - `/rent` → `/repairs` and `/deposit` → `/repairs` links;
  - a real screen-reader pass.
