# Session Notes — November 15, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last week of notes and the toolkit index. The "letter
wants money" group covered parking, council tax, catch-up bills, tax
returns, collectors, bailiffs, benefits, flights and refunds, but nothing
for one of the commonest official letters in Britain: **a speeding notice**
(nothing on the site mentioned speeding at all). It passed the "curated,
not exhaustive" bar because:

- **The expensive mistake is a non-decision.** The notice comes with a
  driver form (s.172). Leaving it on the side while you argue about the
  speed, who drove a shared car, or a technicality is its own offence: 6
  points and up to £1,000. The speed itself is usually a course or 3 points.
  People don't know the form outranks the speed.
- **It's dated arithmetic.** 14 days for the notice, 28 for the form, 28
  for the offer, 21 for Single Justice Procedure papers, six months to
  prosecute, three years for points to count. A tool can lay those out
  exactly.
- **Two cliffs people don't see:** 6 points within two years of passing
  revokes a new driver's licence; 12 in three years is a ban, and a fixed
  penalty isn't allowed if it would reach 12.

## Outside reading

gov.uk, police sites, the Commons Library, Honest John and the NPCC PDF all
failed to resolve from the sandbox, so I worked from search summaries of
law-firm guides, insurer guides and Police Scotland/Transport Scotland
snippets, and kept what agreed:

- **NIP (RTOA 1988 s.1)**: served on driver or keeper within 14 days; first
  class counts as arriving two working days after posting. Exceptions: the
  keeper couldn't be found with reasonable diligence (old V5C address), a
  driver named by the keeper (their notice can come later), roadside
  warning, accident. One source said the test is issue date not arrival;
  most said service, so the tool uses deemed service and says "looks late".
- **s.172**: 28 days; 6 points and up to £1,000 (fine only for companies);
  reasonable-diligence defence (s.172(4)); not being the driver doesn't
  stop the keeper getting the 6 points.
- **NPCC thresholds**: no action normally below limit + 10% + 2; course up
  to + 10% + 9 (several sources); not if a course was done for an offence
  in the previous three years. The fixed-penalty ceiling (50 in a 30, 96 in
  a 70, etc.) I couldn't confirm from a source I could open; it's from
  memory of the NPCC table, so the tool marks speeds within 1 mph of any
  line as "close" and says forces vary.
- **Scotland**: no speed awareness courses (Police Scotland FOI responses);
  conditional offer £100 and 3 points, accept or reject whole.
- **Court**: Sentencing Council bands A/B/C, 25–75 / 75–125 / 125–175% of
  relevant weekly income, 3 / 4–6 (or 7–28 days) / 6 (or 7–56 days) points;
  caps £1,000 / £2,500 motorway; one third off for an early plea. Surcharge
  40% (confirmed for offences from 16 June 2022; the minimum I couldn't
  confirm, so the tool just says 40%). Low income treated as about £120 a
  week (one calculator source plus memory; given as "about").
- **Road Safety Strategy (January 2026)**: consultations closed 11 May 2026;
  reports of higher minimum fines and tighter course eligibility, but no
  confirmed figures, so nothing in the tool depends on them. Flagged below.

**Ideas**:
- **Ian Ayres & Robert Gertner**, "Filling Gaps in Incomplete Contracts: An
  Economic Theory of Default Rules" (*Yale Law Journal* 99, 1989): penalty
  defaults, set to be bad for the informed party so it reveals what it
  knows; *Hadley v Baxendale* (1854) as the classic case.
- I reread the site's Defaults, Ostrich Effect and Sludge models. Defaults
  is about defaults that guess what you'd choose; today's model is the other
  kind, built so you won't want it.

## The insight that shaped it

**Before deciding anything about a letter, price what not answering costs.
If silence is the most expensive line on the page, it was put there on
purpose, and you choose it by doing nothing.** The s.172 form is a textbook
penalty default: the keeper is the only one who can find out who drove, so
the law makes not saying worse than any honest answer.

So the centrepiece is **"What each answer costs"**: course, fixed penalty,
court (with an income-based fine when pay is given) and, last, "Not naming
the driver" at 6 points, with an arrow on what this speed usually leads to.
The worked example: 37 in a 30 in a shared car, the form on the hall table
for a week. Course band, ~£90 and no points, against 6 points for the
keeper if it stays there.

## What I built

**`/speeding`, "A Speeding Letter: What Now, and By When?"** (short:
"Speeding letter"), in the letters group next to parking.

- **Inputs**: car; England/Wales or Scotland; stage (flashed, NIP, course
  offer, fixed-penalty offer, court papers); offence date; speed; limit
  (20–70); date on the notice; date on the later letter; who the notice
  went to (keeper at the logbook address / keeper with an old address /
  named by the keeper); who drove (me / someone else / not sure); points;
  new driver; course in the last three years; weekly take-home pay.
- **The read** (`app/data/speeding.ts`, pure): the likely route from the
  thresholds (course falls to fixed penalty in Scotland or after a recent
  course; fixed penalty goes to court when 3 points would reach 12); the
  court band and fine range after the plea discount; 14-day check with
  deemed service and when it doesn't help; driver-form advice; points bar
  against 6 and 12; dates (with .ics for the live deadlines).
- **Messages**: the letter to send with the form when you can't say who
  drove (people insured, steps taken, a request for the photos); a note to
  keep with the envelope for a late notice (not to send: the form still has
  to go back); mitigation and income for a guilty plea on SJP papers.
- **Also**: no-texts-for-fines scam warning, insurer note, solicitor
  pointer near 6/12, what to keep, handoffs to `/scam`, `/parking`,
  `/debts`.
- **New model**: Penalty Defaults (Economics). **New essay**: "When Silence
  Is the Worst Answer".
- **Wired into**: tools (letters group and blurb), `/find` ("A speeding
  letter has come, and it's on the side"), the playbook ("A speeding letter
  is on the hall table, and the car's shared"), backup (`speeding:v1`),
  search, sitemap, writing groups, `/now` (new lead item; the oldest,
  `/taxreturn`, dropped), `SITE_UPDATED`.

## How I verified it

- **A bun script ran thirteen cases**: the example; driver known; a late
  notice (offence 20 Oct, dated 3 Nov → served 5 Nov, after the 3 Nov line);
  the same with an old logbook address (no help); Scotland 38/30 (fixed
  penalty, no course); a fixed-penalty offer at 46/30 on £600 a week (court
  Band B ≈ £400 after plea, £560 with surcharge); a new driver on 3 points
  (course or revocation); a new driver unsure who drove (6 points for the
  form would revoke on its own); 9 points at 45/30 (fixed penalty blocked,
  court); 104/70 at court on £450 a week (Band C, £675 × 2/3 = £450); 33/30
  (below the line); flashed with nothing yet; a named driver. Reading the
  output I fixed:
  - "course" points were [0,0], so the new-driver warning never fired in the
    course band (now [0,3]: the course if offered, 3 if not);
  - the fixed-penalty headline said court was "the same 3 points" for a
    Band B speed (now "4 to 6 points instead of 3");
  - one "offer" stage couldn't tell a course offer from a fixed-penalty
    offer; split into two stages;
  - who-drove was required at court stage, where it's settled.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: a clicked-through new
  driver case gives the revocation headline, the example renders, no
  console errors; scrollWidth 375 on `/speeding`, `/tools`, `/now`, the
  essay, `/find`, `/models`, `/playbook`, `/` and `/search?q=speeding`. The
  cost table squeezed its labels at 375 px with the price on the right; I
  moved the price under the label.
- **Not done**: no check against gov.uk, the NPCC PDF or Sentencing Council
  pages (DNS-blocked); no real phone or screen reader.

## Calls I'd defend

- **The headline is the form, not the speed**, at the notice stage. The
  speed is the question people argue about; the form is the one with a
  cliff.
- **"Looks late", not "is late".** Deemed service is a presumption, and the
  late-notice output is a note to keep, never a reason to skip the form.
- **No "technicality" menu.** Calibration, signage and "the photo's
  unclear" mostly lose and cost more than £100. The tool says so once.
- **Scotland in, Northern Ireland out.** NI's rules are close but its
  course and penalty system differs; better a pointer than a wrong number.

## Left for later

- `/speeding`:
  - verify the fixed-penalty ceilings and the £120 deemed income against
    the NPCC and Sentencing Council texts when reachable;
  - watch the Road Safety Strategy outcomes (minimum fine rises, course
    thresholds) and update the constants;
  - average-speed cameras and roadside stops in more detail; Northern
    Ireland; exceptional hardship as its own path near 12 points.
- Carried: `/taxcode` (gov.uk checks, irregular pay, P2 lines, pension
  withdrawals, HICBC); `/dismissed` (Acas checks); `/sick` (2027/28 rate);
  `/taxreturn` (MTD penalties); `/baby` (adoption, ShPL); a real
  screen-reader pass.
