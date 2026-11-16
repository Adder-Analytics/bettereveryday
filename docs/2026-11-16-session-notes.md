# Session Notes — November 16, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last week of notes and the toolkit index. Grepping for
"childcare" found it only in passing: one "can wait" line in `/baby`, a
bill category in `/bills`, an evidence line in `/challenge`. Nothing covered
**the help with the nursery bill**, which for a family with a baby in
nursery in England is often worth £8,000 to £10,000 a year. It passed the
"curated, not exhaustive" bar because:

- **It's dated, and the next date is close.** The code for the January term
  has to be issued by 31 December, 45 days from today. A child who turns 9
  months in the autumn and has no code by then waits until April.
- **It ends by default.** The 30 hours and Tax-Free Childcare share one
  account that has to be reconfirmed every three months. A missed date stops
  the top-up at once and ends the funded place after a grace period.
- **The famous cliff is misunderstood both ways.** "Over £100k, no
  childcare" makes families just over the line never apply, though the test
  is adjusted net income and a pension contribution moves it. And families
  just under it don't know a bonus can tip them over.
- **It fits the pattern of the site's best tools**: rules most people get
  wrong, a staircase of dates, sums, and a message to send.

## Outside reading

gov.uk, Best Start in Life, Childcare Choices and council PDFs all failed to
resolve from the sandbox, so I worked from search summaries of council pages
(Derbyshire, Solihull, Kent, Dorset, Peterborough, North Yorkshire,
Lincolnshire, Bracknell Forest), LITRG, adviser pieces (Royal London, AJ Bell,
Brooks Macdonald, PensionBee) and calculators, and kept what agreed:

- **Working parent entitlement (England)**: 30 hours a week, 38 weeks, from
  9 months to school; from the term after 9 months *or* the term after the
  code is issued, whichever is later; terms 1 Jan / 1 Apr / 1 Sep, code
  issued by the day before; apply from 16 weeks before 9 months (one source
  said "23 weeks old", which is about the same).
- **Earnings test**: 16 hours at the person's minimum wage over the next
  three months. 2026/27 rates £12.71 (21+), £10.85 (18–20), £8.00 (under 18
  or apprentice), which I remembered from the November 2025 Budget; one
  search source agreed on £12.71 (£2,643.68 a quarter), others had stale
  rates. Exceptions: statutory leave, new self-employed (12 months), a couple
  where one works and the other has Carer's Allowance or can't work.
- **£100,000 adjusted net income** per parent, checked at application and at
  each reconfirmation.
- **Grace periods**: a council table gave 1 Jan–10 Feb → 31 Mar,
  11 Feb–31 Mar → 31 Aug, 1 Apr–26 May → 31 Aug, 27 May–31 Aug → 31 Dec. The
  autumn split (1 Sep–31 Oct → 31 Dec, 1 Nov–31 Dec → 31 Mar) is from memory
  of the DfE table; marked as such in the code, and the tool tells people
  their council publishes its own. No new place can start in a grace period.
- **Tax-Free Childcare**: 20% top-up, £500 a quarter per child (£1,000 if
  disabled), to the September after 11; not with Universal Credit, and a
  successful application ends a UC claim (LITRG; gov.uk via search snippet).
- **UC childcare 2026/27**: 85% up to £1,071.09 (one child) / £1,836.16 (two
  or more); one source had £1,863.16, which looks like a typo.

**Ideas**:
- **Tatiana Homonoff & Jason Somerville**, "Program Recertification Costs:
  Evidence from SNAP" (*AEJ: Economic Policy* 13(4), 2021): about half of San
  Francisco cases closed at recertification; a later interview slot cut
  recertification by about 22%; those who left were as needy as those who
  stayed; most came back, a quarter were off a year later.
- Reread the site's **Notches** (Kleven & Waseem) and **Administrative
  Burden** (Herd & Moynihan) models. Notches already covers cliffs in
  employment law; today adds the £100,000 childcare line as its sharpest
  everyday case. Administrative Burden is about getting on; nothing on the
  site was about *staying* on.

## The insight that shaped it

**A benefit you have to re-prove on a schedule ends by default, so the
renewal, not the application, is the real deadline.** The application is
the step everyone thinks about; the reconfirmation is a recurring penalty
default that nobody sees until it bites. So the tool treats every
reconfirmation as a dated, priced event and pushes them into a calendar, and
its "line to keep" names the day of the month.

The second shape is the notch: £1 over £100,000 loses everything for the
whole family. The centrepiece for those families is **"The £100,000 line"**,
three rows: what you get at £100,000, £0 at £100,001, and the take-home cost
of the pension contribution that gets you back (about 40p a pound in the
taper, 55p above £125,140), with the reminder that the money isn't spent.

## What I built

**`/childcare`, "Childcare Codes: What You Can Get, and By When?"** (short:
"Childcare codes"), in the baby group, renamed "A baby's coming, or
childcare to pay for".

- **Inputs**: child's name; date of birth or due date; England / Scotland /
  Wales / NI; couple or single; for each parent: status (working, on leave,
  new self-employed, carer/health, not working), age band, pay expected over
  three months, income for the tax year and pension contributions
  (optional); monthly bill, hours, hourly rate (all optional); UC; whether
  you have a code, and when you applied or last reconfirmed.
- **The read** (`app/data/childcare.ts`, pure): the term the 30 hours can
  start and the apply-by date (later of the 9-month term and the next
  term); universal 15 hours from the term after 3; school start; TFC end;
  each parent against both tests, with exceptions and the shortfall in pay
  and hours a week; the annual value of the hours (at the given or derived
  rate, else a labelled £8), TFC on what's left, UC's 85% if claimed; the
  £100,000 notch; reconfirmation dates and the grace end for each.
- **Messages**: a note to the nursery with the code and the questions to ask
  (start date, stretching, extra charges); an email to payroll asking for
  salary sacrifice when a parent is over £100,000.
- **Also**: .ics reminders (apply six weeks before the deadline, each
  reconfirmation two weeks early); the UC-vs-TFC warning; Scotland/Wales/NI
  pointers; "pay in ahead, the quarterly cap doesn't roll over"; scam line;
  handoffs to `/baby`, `/bills`, `/challenge`, `/taxcode`.
- **New model**: Recertification (Economics). **New essay**: "The Benefit
  That Ends by Default" (Jo misses a reconfirmation in Christmas week and
  then the grace period, and pays a term in full).
- **Wired into**: tools (entry, group, blurb), `/find` ("The nursery bill is
  starting…"), the playbook ("The nursery starts in January, and one of you
  earns just over £100,000"), backup (`childcare:v1`), search, sitemap,
  writing groups, `/now` (new lead item; the oldest, `/sick`, dropped),
  `/baby` (handoff and the "can wait" line), `SITE_UPDATED`.

## How I verified it

- **A bun script ran thirteen cases**: the example (9 months on 14 Dec,
  £108k − £3k pension → £5,000 to cut for ~£2,000; £9,052 hours + £1,430
  TFC); the same at £99k; a code to reconfirm; an overdue reconfirmation; a
  child who turned 9 months on 1 Sep (Jan term, not missed); a due date in
  2027; a 3-year-old (universal 15 already, the code adds 15: £4,469); a
  school-age child (TFC only); a single parent £644 short (about 4 hours a
  week); UC (85% vs 20%, the warning); Scotland at £130k (the pension route
  costs £12.7k for £2k of TFC, said so); a non-working partner; a carer
  partner. Reading the output I fixed:
  - school-age TFC came out £0 because the universal hours were still being
    subtracted from the bill;
  - the body said "can start in April 2024, but that term's deadline has
    passed" for a 3-year-old; now "could have started earlier; the earliest
    now is…", and past "apply from" dates are dropped;
  - "Missing it costs £3,017 a term" was wrong about timing: the top-up stops
    at once but the hours run to the grace end, so the headline says both;
  - names at the start of a sentence weren't capitalised ("your child
    turns…"); the over-£100k-but-not-worth-it headline now gives both sums.
- **The essay's timeline** first had Jo learn of the lapse in February,
  which under the grace rules would have cost nothing; rewritten so she
  finds out from the April invoice, after the grace period.
- `bunx tsc --noEmit`, `bun run lint` (one entity-space fix) and
  `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: the example renders; a
  clicked-through single parent with a code gives the reconfirm headline; no
  console errors; scrollWidth 375 on `/childcare`, `/tools`, `/now`, the
  essay, `/find`, `/models`, `/playbook`, `/`, `/search` and `/baby`;
  searching "childcare reconfirm" finds the tool and the essay.
- **Not done**: no check against gov.uk or the DfE grace-period table
  (DNS-blocked); no real phone or screen reader.

## Calls I'd defend

- **England only for funded hours.** Scotland, Wales and NI run different
  schemes through different services; a pointer is better than wrong dates.
  TFC sums still run for them.
- **One child.** Codes are per child; the UC cap for two children is
  mentioned, not modelled. Run it once per child.
- **A labelled default rate.** Without a rate, the value of the hours is the
  whole point of the notch, so it uses £8 an hour and says so, rather than
  hiding the number.
- **No "should you take TFC instead of UC" verdict.** The sums are shown
  side by side, with the warning that applying ends the UC claim and advice
  to check first; UC's interactions are too individual for a verdict.

## Left for later

- `/childcare`:
  - verify the grace-period autumn split and the 16-week window against the
    DfE guidance when reachable; confirm the 2026/27 wage rates on gov.uk;
  - more than one child (UC two-child cap, per-child TFC); disabled-child
    TFC (£4,000) as an input; the 15 hours for 2-year-olds on benefits;
  - the 2027/28 wage rates in April.
- Carried: `/speeding` (NPCC ceilings, Road Safety Strategy outcomes);
  `/taxcode` (gov.uk checks, P2 lines); `/dismissed` (Acas checks); `/sick`
  (2027/28 rate); `/taxreturn` (MTD penalties); `/baby` (adoption, ShPL); a
  real screen-reader pass.
