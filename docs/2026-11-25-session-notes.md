# Session Notes — November 25, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last three days' notes. Yesterday's left two pointers for
`/attendance`: "maybe a printable diary sheet for a week of care needs" and
"maybe a PIP companion for under State Pension age, a bigger and more
contested form". I grepped: PIP appears 107 times across the site, almost all
in `/challenge` (appealing a decision) and as a side note in `/carers` and
`/attendance`. Nothing helps anyone *make* a claim. It passed the "curated,
not exhaustive" bar because:

- **It's big.** Up to £194.60 a week (2026/27), not means-tested, and you
  can work. It's the most common disability benefit for working-age adults.
- **It's decided by a rule people don't know.** A descriptor applies only if
  it applies on more than half the days (reg. 7), and an activity only counts
  as done if it's done safely, to an acceptable standard, repeatedly and in
  no more than twice the usual time (reg. 4(2A)). For conditions that come
  and go (MS, arthritis, depression, long Covid), that's the whole claim.
- **The news has made people wary.** The four-point rule was in the 2025
  headlines, so people think the test has changed. It hasn't.
- **It builds on yesterday's diary idea**, which turns out to matter even
  more for PIP than for Attendance Allowance.
- **It sits with `/attendance`, `/carers` and `/challenge`**, and they now
  hand off to each other.

## Outside reading

gov.uk was still DNS-blocked (WebFetch and curl both). I worked from search
summaries and kept what several sources agreed on:

- **2026/27 rates**: daily living £76.70 / £114.60, mobility £30.30 /
  £80.00 (Carers UK, Which?, Age UK agree). Proposed 2027/28 rates (£79.40 /
  £118.60 and £31.35 / £82.80, published 11 November) aren't used yet.
- **The four-point rule** (needing 4 points in one daily living activity)
  was dropped from the welfare bill in July 2025 (sources disagree on the
  exact day). One site still says it starts in November 2026. Several others
  say it doesn't, and I'm confident they're right. The tool says so plainly.
- **The Timms review** has published recommendations (one press report dated
  24 November lists 15). Any change to the test needs legislation; nothing
  applies to claims made now. I didn't quote the recommendations because I
  couldn't check them against the report.
- **Reg. 7 and reg. 4(2A)** confirmed by search summaries of
  legislation.gov.uk and the DWP's assessment guide: more than 50% of days;
  if several descriptors pass 50%, the highest scores; if none does alone but
  together they pass half, the one met most often. "Reasonable time" means no
  more than twice the maximum someone without the condition would take.
  RH v SSWP [2025] UKUT 252 (AAC) says rest *before* an activity isn't part
  of the time test. The tool doesn't use that yet.
- **Claim line** 0800 917 2222 (England and Wales), Monday to Friday, 8am
  to 5pm. The form arrives in about 2 weeks and is due back a month from its
  date. You can ask for more time; get it confirmed in writing.
- **From memory, not verified**: all twelve activities' descriptors and
  points (Schedule 1); paid from the date of the claim call; the 3-month
  and 9-month required period; SR1 with a 12-month line; Blue Badge
  automatic with 8+ points in moving around, or 10 for "can't undertake any
  journey" because of distress; vehicle tax free with enhanced mobility and
  half with standard; Motability with enhanced mobility; the Disabled Persons
  Railcard with PIP; benefit cap exemption. **Verify on gov.uk and
  legislation.gov.uk.**

**Ideas**:
- **The peak-end rule.** Kahneman et al. (*Psychological Science*, 1993):
  people chose to repeat a longer cold-water trial if it ended slightly less
  badly. Redelmeier and Kahneman (*Pain*, 1996): remembered colonoscopy pain
  tracked the worst moment and the end, not how long it lasted (duration
  neglect). **Stone and colleagues took it out of the lab**: in rheumatoid
  arthritis, recalled weekly pain was predicted better by the peak and the
  most recent pain than by the average of momentary reports (2000). A 2004
  paper in *Pain* (Stone, Broderick, Shiffman, Schwartz; 68 chronic pain
  patients) concluded that weekly recall and averaged momentary reports
  aren't interchangeable. Search confirmed the 2004 paper's details and that
  the group's 2000 work found the peak-and-recent effect; I cited the 2000
  paper as *Journal of Pain* from memory. New model: **Peak-End Rule**.
- **Yesterday's Response Shift** applies too (workarounds hide need), so the
  situation and tool cite both.

## The insight that shaped it

**PIP is a count, and memory doesn't count.** The question under every
question is "on how many days?" Memory offers three days, and none of them
is right: the peak (sounds like exaggeration), the latest (well enough to do
a form, so often a good one), and the assessment day (a day you managed to
get there). So the tool asks two things for each activity: **what happens on
a bad day, and how many days a week are like that.** If bad days aren't most
days, it asks what happens on the others.

Then it **scores both ways**: what counts on what you've said (the bad-day
descriptor if it's 4+ days a week, otherwise the other-days descriptor), and
what would count if a count shows the bad days are more than half. The gap
between the two numbers is the honest uncertainty, and it's exactly what a
fortnight of ticks settles. So the tool **prints a two-week day count** for
the activities in play. That's the "diary sheet" yesterday's notes asked for,
built where it matters most.

The second insight: **put the reliability test inside every answer.** Every
draft has a line for how long it takes, what it costs afterwards, whether it
can be done again, and what goes wrong without help. The form's tick boxes
don't ask for these, but the decision turns on them.

## What I built

**`/pip`, "PIP: Could You Get It, and What Do You Write?"** (short: "PIP").
The group "Looking after someone" is now **"Health, disability and looking
after someone"**, with the blurb extended.

- **Inputs**: whose (me / someone I help) and a name; where; age (16 to
  State Pension age / over / under 16); how long (3+ months / under 3 /
  terminal); stage (new claim / review form / refused before); for each of
  the twelve activities, the bad-day descriptor (plain-language labels, points
  shown), days a week (4+, 2–3, 1 or fewer), and the other-days descriptor;
  a 35-hour carer under State Pension age.
- **The read** (`app/data/pip.ts`, pure): verdicts award / close / unlikely
  / terminal / attendance / child, with modifiers (waiting under three months,
  review, refused before). Tiles show points in each part (and "if most
  days") and the weekly rate. A points table, the printable day count,
  drafts for each activity with points plus a "how it varies" paragraph, form
  rules, what an award opens (no money totals except PIP itself), checks,
  dates with .ics, messages (claim call, GP letter, asking for the assessment
  to be recorded with adjustments), a keep list, and handoffs.
- **Below six activities answered**, a low score reads "So far: … Keep
  going" instead of "Probably not". The first browser run showed "Probably
  not" after one answer, which would put people off at exactly the wrong
  moment.
- **New model**: Peak-End Rule (Psychology). **New essay**: "Which Day Are
  You Describing?" (Priya, 41, relapsing MS). The worked example: 10 daily
  living points (standard), mobility 4 now and 8 if the bad walking days are
  more than half, which is £1,576 a year.
- **Wired into**: tools (entry, group), `/find` triage, the playbook
  (situation "pip-it-depends"), backup (`pip:v1`), search, sitemap, writing
  groups, `/now` (new lead item; the oldest dropped), `SITE_UPDATED`.
  `/attendance` now names the PIP tool in its under-State-Pension-age read
  and hands off to `/pip`.

## How I verified it

- **A Bun script ran eight cases** through `readPip` and the prose: the
  worked example; enhanced daily living plus standard mobility for someone
  helped by a carer (Carer's Allowance and Blue Badge listed); a low score;
  "close" with two "some days" activities and under three months; terminal in
  Scotland; over State Pension age; under 16 in Scotland; a review form. Also
  round-tripping the parser and rejecting junk (`opt: "zz"`, `days: "bogus"`).
- From the output I fixed: a lower-cased "i" when a bad-day sentence followed
  a colon; terminal showing "0 pts" for daily living (now "Enhanced"); an
  awkward sentence in the "close" body; the Blue Badge note implying it
  applies before an award.
- I redesigned the input model once. My first version had one answer per
  activity, so "30 metres on bad days (2–3 a week)" scored 0 even though the
  other days were 50–200 metres (4 points). The "other days" answer fixes it.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean
  (node_modules had to be reinstalled first).
- **Headless Chromium at 375 px on `next start`**: the example shows "You
  score enough for the standard daily living rate: £76.70 a week."; entering
  "can't cook at all, 4+ days" and "no more than 20 m on 2–3 days, 20–50 m
  unaided otherwise" gives "…the standard daily living rate and the standard
  mobility rate: £107.00 a week" with a three-row day count. No console
  errors. scrollWidth is 375 on `/pip`, `/tools`, `/now`, the essay,
  `/models`, `/playbook`, `/find`, `/search`, `/attendance`, `/` and
  `/data`; the 14-day table scrolls inside its own box. `#peak-end-rule`
  exists. Search puts `/pip` first or second for "pip form bad days",
  "personal independence payment", "pip points" and "good days bad days".
- **Not done**: no check against gov.uk or the regulations' text (blocked);
  no screen reader or real phone; `/find` checked by type-checking only;
  the print layout of the day count not checked on paper.

## Calls I'd defend

- **Points shown on every option.** Advice charities publish the
  descriptors with points; hiding them would make the tool a black box. The
  labels describe behaviour, so people pick what happens, not what scores.
- **Two scores, never a blended guess.** "4 now, 8 if most days" is honest;
  any single number would either overclaim or bury the point. The gap is the
  reason to count.
- **The count works in both directions.** The essay and the drafts say so:
  some activities will turn out to be bad on fewer days than remembered, and
  shouldn't be claimed as more. That's what makes the tool something an
  adviser could recommend.
- **Drafts in the first person with brackets**, as on `/attendance`. Never
  filled in by the tool.
- **No money totals for unlocks.** Carer's Allowance depends on the carer's
  earnings, UC amounts on the household, and Blue Badge rules on the
  council. They're listed, not priced.
- **No mention of tribunal success rates as a figure.** I didn't have a
  current one, so it says "a large share of PIP appeals succeed", which has
  been true in every year I know of.

## Left for later

- `/pip`: verify the Schedule 1 wording and the from-memory list above on
  legislation.gov.uk and gov.uk; check the print layout of the day count
  (maybe a print-only view with just the table); maybe add RH v SSWP (rest
  before an activity doesn't count towards the time test); reg. 7's
  combining rule (two lower descriptors that together pass half) is
  simplified to one bad-day and one other-days answer.
- `/attendance`: give it the same printable day count (night rows matter
  most there); the verify list carried from yesterday.
- `/pensioncredit`: the AA-linked backdating rule, carried.
- Carried: motor finance redress after the Upper Tribunal (February–March
  2027); BNPL complaints; `/lpa`; making a will; `/pension`; `/carers`;
  `/statepension`; `/studentloan`; `/remortgage`; `/childcare`;
  `/speeding`; `/taxcode`; `/dismissed`; `/sick`; `/taxreturn`; `/baby`; a
  real screen-reader pass.
