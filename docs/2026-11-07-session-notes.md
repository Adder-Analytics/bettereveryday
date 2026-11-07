# Session Notes — November 7, 2026

## What I set out to do

The brief is the same: make the site a useful *instrument* for real people,
not a self-improvement site. I reread the last two sessions' notes
(`/notice`, `/repairs`) and their "left for later" lists, then looked for a
gap rather than a follow-up. The letters group covers bills, debts, bailiffs,
parking, refunds and flights, and the renting and work groups cover the
landlord and the employer. Nothing covered the other big institution that
sends life-changing letters: **the DWP.** Grepping for "mandatory
reconsideration" found nothing, and "PIP" appeared only in passing.

Why it passed the "curated, not exhaustive" bar:
- **It's very common and the money is large.** PIP alone gets about 86,000
  reconsiderations a quarter, and a standard-rate award of both components is
  £107 a week (over £5,500 a year).
- **The odds are much better than the letter makes them feel.** About one in
  four PIP reconsiderations changes the award. About two in three PIP appeals
  go the claimant's way at the tribunal. Yet many people stop after the first
  "no".
- **The usual mistake is invisible and cheap to fix.** People wait for
  perfect evidence, or for the energy to face it, and miss the one-month
  deadline. Or they don't know a tribunal exists separately from the DWP.
- **The decision letter already contains the numbers.** It lists the points
  per activity, so a tool can show the gap to the line exactly, without having
  to encode every descriptor.
- It comes down to two deadlines, a points table and a letter, which is what
  the site does well.

## Outside reading

gov.uk and legislation.gov.uk still don't resolve from the sandbox, so I
worked from search summaries (Citizens Advice, Shelter, council welfare-rights
pages, Disability Rights UK, Benefits and Work's write-ups of the DWP and HMCTS
statistics) and kept only what agreed across sources:

- **Mandatory reconsideration**: within one calendar month of the date on the
  decision. A late request can be accepted with a good reason up to 13 months
  from the decision. (Disability Rights UK's "12 months after the normal
  deadline" is the same thing.)
- **Appeal**: to HMCTS (online, or form SSCS1, with the MR notice) within one
  month of the MR notice. The tribunal can accept a late appeal up to 13
  months after it, usually if the DWP doesn't object.
- **The odds, PIP**:
  - MR success was 26% in the quarter to July 2026, with 86,000 registered;
  - tribunal claimant success was 67% in January to March 2026 (63% the
    quarter before), with PIP 61% of all social security appeals;
  - MR takes about 45 days for new claims and longer overall, and a whole
    challenge takes about 11 months on average;
  - new-claim award rates fell to 34%.

  One outlet said 65% give up after the MR, but I couldn't verify it, so it's
  not on the site.
- **PIP rates from 6 April 2026** (3.8% uprating): daily living £76.70 and
  £114.60, mobility £30.30 and £80.00. One calculator site disagreed, but the
  majority and charity sources agree.
- **The four-point rule** was withdrawn in July 2025. The Timms Review's
  interim report was updated in July 2026, and its recommendations are due in
  autumn 2026. Any change needs new law. Several blogs still say "November
  2026", which is stale. Nothing in the tool models it.
- **Whole-award risk**: Citizens Advice says challenging the amount or length
  can lead the DWP to look at the whole claim. The sources don't settle
  exactly how far a tribunal can go, so the tool states the risk and points
  to an adviser.
- **From memory, consistent with the summaries**:
  - PIP Schedule 1: activity maxima and the points each descriptor can give;
  - reg 7's "reliably" test (safely, acceptable standard, repeatedly,
    reasonable time = no more than twice as long);
  - the more-than-50%-of-days rule;
  - UC overpayments are recoverable whatever the cause;
  - official-error revision has no time limit.
- **Administrative burden**: Moynihan, Herd and Harvey (*JPART* 2015), and
  Herd and Moynihan, *Administrative Burden: Policymaking by Other Means*
  (2018). Learning, compliance and psychological costs. Policy in Practice
  estimates about £23 billion a year of UK benefits and social tariffs goes
  unclaimed.

## The insight that shaped it

**The first no is a draft, and the system filters for stamina, not
entitlement.** Yesterday's insight was about the illusion that they know.
Today's is about the illusion that they've decided. A decision letter has the
form of a verdict, but the system builds in two corrections and the second
one usually goes the claimant's way. The people who lose out are mostly the
ones who stop, and every stage is designed (or has drifted) to make stopping
easy: a new form, a new wait, another account of your worst days. That's
Herd and Moynihan's administrative burden. It reads to the person filtered
out as a judgement on their case.

So the tool's job isn't to argue the case. It's to **shrink each cost**:
- the learning cost becomes one date (the printed date plus a month, shown
  as a countdown bar);
- the compliance cost becomes one letter, with each disputed activity already
  set out and only the "what happens when I try" left to write;
- the psychological cost gets the base rates and the backdating fact: the
  wait costs you time, not the money.

The second centrepiece is **the points against the lines**: two bars, one
per component, with 8 and 12 marked. They show what they gave solid and your
count lighter. "You're 2 points short of the standard rate of daily living"
is a far more actionable sentence than "you scored 6".

## What I built

**`/challenge`, "The DWP Said No: Challenge It?"** (short: "Benefit
decision").

- **Inputs**:
  - region (England/Wales, Scotland, NI) and benefit (PIP, UC, ESA, other);
  - what they decided, with options per benefit: refused, lower, cut at
    review, too short; sanction, overpayment, WCA, amount wrong, closed;
  - where you are: a decision letter, waiting on an MR, or an MR notice that
    still says no, with the date that matters;
  - a late reason (shown only when late) and whether there's new evidence;
  - for PIP, a two-column points table (they gave / you think) with selects
    limited to the scores each activity can actually give.
- **The read** (`app/data/challenge.ts`, pure functions):
  - statuses: elsewhere, ask, late, lapsed, waiting, appeal, appealLate,
    appealLapsed;
  - the one-month deadline and the 13-month outer limit;
  - PIP totals, rate and weekly money per component, a list of disputed
    activities, the weekly gain on your own count, and an at-risk flag when
    there's an award to lose.
- **Headline**: e.g. "You have 22 days, to Sunday 29 November, to ask them to
  look again. You're 2 points short of the standard rate of daily living."
- **Body**:
  - the route;
  - the points paragraph;
  - the "reliably" test;
  - issue-specific paragraphs (a sanction's good reason and hardship
    payments; UC overpayment recoverability against a challenge on whether
    and how much, with Debt Management as a separate request; a review
    reduction);
  - evidence that fits the issue (paperwork for overpayments, medical and
    support letters for PIP);
  - the whole-award caution;
  - base rates and backdating.
- **Steps** with dates, with estimated ones marked "About".
- **Letters**:
  - ask for the assessment report (PA4);
  - the MR request, with each disputed activity on its own line and a prompt
    for what to describe;
  - the late MR, with the reason;
  - a chaser after 10 weeks' waiting;
  - grounds of appeal, plus a checklist for the appeal form (ask for an oral
    hearing).
- **Also on the page**:
  - a `.ics` file with a send-this-week reminder and the deadline;
  - free help;
  - hand-offs to `/debts`, `/collector` and `/notice` (UC-delay arrears
    don't count towards ground 8).
- **Pointers**: Scotland's PIP (now Adult Disability Payment, run by Social
  Security Scotland) and Northern Ireland get a pointer. Scottish UC and ESA
  take the DWP route.
- **New model**: **Administrative Burden**. Sludge and Base Rates also link
  the new essay.
- **New essay**: "The First No Is a Draft".
- **Wired into**:
  - tools (the money-letters group, with an updated blurb);
  - `/find` ("A benefit decision went against me", then `/debts`);
  - the playbook ("A benefit decision went against you");
  - backup (`challenge:v1`), search, the sitemap and writing groups;
  - `/now` (a new lead item; the oldest, `/redundancy`, dropped) and
    `SITE_UPDATED`.

## How I verified it

- A bun script ran 9 cases through the read and printed the full summary,
  letters and reminders:
  - the worked example; a late PIP with an existing award; PIP lapsed;
  - a UC sanction after 98 days' waiting; a UC overpayment at appeal; a late
    ESA WCA appeal;
  - a PIP review cut on the last day to appeal; Scottish PIP; NI.

  Reading the output, I fixed:
  - "1 points";
  - "shorter deadlines" for Adult Disability Payment (I couldn't confirm it;
    now "its own deadlines");
  - the PIP average wait quoted to a UC claimant;
  - GP letters suggested as evidence for an overpayment;
  - "please send me a calculation" in grounds of appeal, which is addressed
    to the tribunal, not the DWP;
  - estimated steps shown as if they were firm dates.
- `bun install` (node_modules were missing), then `bunx tsc --noEmit`,
  `bun run lint` and `bun run build` are all clean.
- Headless Chromium at 375 px on `next start`:
  - I clicked through the worked example's inputs, including the points
    selects. The headline, the countdown, the bars and the letters rendered
    with no console errors;
  - switching to an MR notice dated 20 October gave "Appeal by Friday 20
    November: 13 days left…";
  - `/challenge`, `/tools`, `/now`, the essay, `/find`, `/models`,
    `/playbook`, `/`, `/search` and `/data` all have scrollWidth 375;
  - in search, "pip", "mandatory reconsideration", "sanction" and
    "administrative burden" all find the tool, and the essay where relevant.
- **Not done**: no real phone or screen reader, and no check against the
  regulations' own text or the DWP's statistics tables (DNS-blocked).

## Calls I'd defend

- **Points, not descriptors.** Encoding all ~70 descriptor texts would be a
  lot of legal text to get exactly right from memory. The letter already
  gives points per activity, and the selects only allow the scores an
  activity can give. The read points to Citizens Advice and Benefits and Work
  for the descriptor wording.
- **The whole-award risk is shown, plainly.** It's the one way the advice
  "always challenge" can hurt someone, and it's what free advisers warn about
  first.
- **No WCA points.** UC's health element is changing (halved for new claims
  from April 2026, with the WCA due to go), so WCA gets the same route and a
  "point to the activities" paragraph, not a calculator.
- **Base rates with dates and sources, rounded to "one in four" and "two in
  three".** The quarterly figures move, so the read names the quarter.
- **No give-up statistic.** It would have made the essay punchier, but I
  couldn't verify it.

## Left for later

- `/challenge`:
  - the descriptor texts as an optional helper per activity, once
    legislation.gov.uk is reachable;
  - Adult Disability Payment as a proper path (re-determination and appeal
    deadlines);
  - Northern Ireland's route;
  - housing benefit and council tax reduction (council decisions, a direct
    appeal);
  - HMRC (child benefit, tax credits) statutory reviews;
  - an "after the hearing" path (a statement of reasons, Upper Tribunal
    permission);
  - update the rates in April 2027 and the base rates each quarter;
  - revisit if the Timms Review leads to legislation.
- A "benefits" group if a second benefits tool arrives (for example a
  benefits check, or a UC deductions tool).
- Carried:
  - `/repairs` (the PRS database and ombudsman, compensation ranges);
  - `/notice` (grounds 1B–7, 8A);
  - `/rent` → `/repairs` and `/deposit` → `/repairs` links;
  - a real screen-reader pass.
