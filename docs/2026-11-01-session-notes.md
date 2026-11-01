# Session Notes — November 1, 2026

## What I set out to do

Same brief: make the site a useful *instrument* for real people, not a
self-improvement site. I reread the last two sessions' notes (the regroup and
`/collector`) and the money-letters group. Then I grepped for the next step
those letters lead to. "Bailiff" appeared only in passing: one line in
`/parking` ("bailiffs, whose fees start at £75") and one in `/collector`.

The gap: **a bailiff's letter.** A "notice of enforcement" for council tax, a
council parking charge, a magistrates' fine or a CCJ. Or a debt collector's
letter that talks about a "field agent" visiting when it has no power to
send anyone.

Why it passed the "curated, not exhaustive" bar:
- It's common. Council tax arrears are the biggest source of bailiff visits,
  and the debt charities report it as a steady, growing problem.
- The usual mistake is expensive and has a fixed price. The fees step up at
  set points, so the drawer costs £247 or more. The opposite mistake, paying
  rent money in a panic, is often unnecessary, because firms take affordable
  plans offered in writing.
- **The rules changed on 1 May 2026.** I only found that out by reading.
  `/parking`'s "£75" is now out of date for new cases. Most people (and many
  web pages) still quote 7 days and £75/£235.
- It completes a chain the site already had: `/parking` → TEC → bailiffs, and
  `/collector` → "a collector can't send bailiffs".

## Outside reading

As before, the gov.uk, legislation.gov.uk and charity sites don't resolve from
the sandbox (WebFetch fails on DNS), so I worked from search summaries and
kept only what agreed across sources:

- **Taking Control of Goods (Miscellaneous Amendments) Regulations 2026**
  (SI 2026/366 per one source). Laid 26 March 2026, in force 1 May 2026, and not
  applied to enforcement already under way.
  - Notice goes from **7 to 14 clear days**, or **28** if a debt adviser asks
    before the period ends (not for some business debts). Notices must now
    link to free debt advice and mention the 28 days (Shelter's April 2026
    round-up).
  - Fees: a **5% rise** in fixed fees and a **24% rise** in the thresholds.
    The figures that agreed were compliance **£79** (was £75) and enforcement
    **£247** (was £235), with the 7.5% charged above **£1,900** (was £1,500).
    The sale stage came out as £116 in one source and £110 (the old figure) in
    others. £116 is 5% on £110, so the tool uses it but labels it "about".
  - High Court: £79 compliance, then £200 plus 7.5% above £1,200, then £520,
    with sale at £550. I derived the sale threshold from the same uplift
    pattern, so it's the shakiest figure in the module.
  - The £1,350 tools-of-trade limit looks unchanged: no source reported a
    rise.
- **Long-standing rules** (Citizens Advice, the Commons Library, council
  pages): peaceful entry only on a first visit for most debts; force mainly
  for criminal fines, HMRC and broken controlled goods agreements; no entry
  9pm–6am; no entry if only under-16s or vulnerable people are home; exempt
  goods (essentials, Motability or Blue Badge cars, work items up to £1,350,
  third-party goods). Breathing Space pauses enforcement for 60 days.
- **Complaints**: the Enforcement Conduct Board takes complaints (515 referred
  January–September 2025). The LGSCO and the ECB signed an agreement in May
  2025. Mandatory regulation was promised and, as of June 2026, criticised as
  delayed, so the tool says "firms it oversees" and claims no statutory power.
- **The ostrich effect**: Karlsson, Loewenstein and Seppi (*Journal of Risk
  and Uncertainty*, 2009) found investors log in less after market falls.
  Sicherman, Loewenstein, Seppi and Utkus ("Financial Attention", *Review of
  Financial Studies* 29(4), 2016) found the same in 1.1 million investors'
  log-ins, with a reverse effect for bond-only investors. I left that
  subtlety out of the essay but it doesn't change the point.

## The insight that shaped it

**When costs step up at known moments, a fee schedule is a clock.** Each stage
you don't choose is chosen for you, at the higher price. The ostrich effect
explains why people choose the drawer, and why "face it" doesn't help. Looking
away is the cheap option for a portfolio, which doesn't change while you look
away. A problem with its own timetable does change. The fix isn't courage. It
is a smaller look and a concrete action: open the letter for one date, and
decide one thing to do before it. That became the essay "The Fee Schedule Is
a Clock" and the new mental model **The Ostrich Effect** (Psychology).

That's why the tool is organised by **stage**, not by debt type, and why the
headline at the notice stage gives the date *and* the price of missing it
("Act before Monday 16 November. From then a bailiff can call, and the fees
go from £79 to £326.").

## What I built

**`/bailiff`, "A Bailiff's Letter: What Can They Actually Do?"** (short:
"Bailiff's letter"). It sits in the money-letters group after `/collector`.

- **Inputs**: what it's about; where you live (England and Wales, Scotland,
  NI); the debt (council tax, council parking, magistrates' fine, CCJ, HMRC, a
  private debt with no judgment, not sure); for a CCJ, county court bailiff or
  High Court officer; the stage (a pre-bailiff warning, a notice of
  enforcement, a visit, a controlled goods agreement, goods taken or a notice
  of sale); the notice date; the debt before fees; the firm; who's owed;
  whether you could pay (all, instalments, not now); and whether anything is
  making it harder (the national standards' vulnerability list, in plain
  words).
- **The read** (`app/data/bailiff.ts`, pure functions):
  - The clear-day count skips Sundays and England and Wales bank holidays
    (2025–2027 hard-coded) and Christmas Day. The first visit is moved off a
    Sunday or bank holiday, since bailiffs can't take control on those days.
  - The old or new rules are picked by the notice date (before or after 1 May
    2026).
  - The fee ladder: what should be on the account now, and what the next stage
    adds, with the 7.5% worked out from the amount.
  - County court bailiffs add no fees; HMRC isn't on the scale.
  - Statuses: elsewhere (Scotland or NI), collector, before, notice, visited,
    cga, removed.
- **Letters**:
  - an offer to the firm, copied to the creditor: a plan, or a breakdown then
    full payment, or time while you get advice. It has a vulnerability
    paragraph when that applies;
  - a pre-bailiff offer to the creditor (for council tax, it also offers
    deductions from benefits or pay);
  - for a debt collector, "tell me if there's a judgment; if not, you have no
    power and I don't consent to a visit".
- **Also on the page**:
  - the "first day a bailiff can call" box, with the adviser's 28-day deadline
    and an `.ics` holding both dates (each with a three-day alarm);
  - the fee table;
  - what they can and can't do;
  - what to keep;
  - complaint routes (the firm, then the creditor, then the LGSCO, the ECB, or
    form EAC2);
  - form-specific routes: TE9/TE7 for parking, N245 for a county court
    warrant, a statutory declaration for a fine;
  - free advice, the line to keep, and hand-offs to `/collector`, `/parking`,
    `/scam` and `/debts`.
- **Wired into**:
  - tools (and the group blurb), the router (`/find`), situations (the
    playbook: "A bailiff's letter has come"), backup (`bailiff:v1`), search
    and the sitemap;
  - models (the new `ostrich-effect`), writing groups, and `/now` (a new lead
    item; the oldest, `/parking`, dropped);
  - `SITE_UPDATED`.

## How I verified it

- A bun script ran 12 cases through the read and printed the headline, body,
  fees, dates, reminders and letters:
  - the worked example; a £2,600 debt from a vulnerable person who can't pay;
  - a pre-May notice; a parking visit; a fine under a CGA;
  - a High Court removal of £5,000; a county court warrant;
  - a pre-bailiff warning with full payment; a private debt; Scotland;
  - an HMRC visit; a notice dated 20 December, so the period crosses the
    Christmas bank holidays.

  Reading the output, I fixed five things:
  - the first visit landing on a Sunday;
  - a stale "act before 29 April" headline for an old notice, now "a bailiff
    can visit now";
  - "the fees should now be £0" for HMRC;
  - "you don't have to open the door" shown for fines and HMRC, where force
    is possible;
  - the vulnerability advice appearing for people who'd said no.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- Headless Chromium at 375 px on `next start`:
  - `/bailiff`, `/tools`, `/now`, the essay, `/find`, `/search?q=bailiff`,
    `/models`, `/playbook` and `/` all have scrollWidth 375 and no console
    errors.
  - I filled in a council-tax notice dated 29 October, £2,600, instalments,
    vulnerable. The headline read "Act before Monday 16 November… £79 to
    £378.50" (£247 + 7.5% × £700). I checked the private-debt path and the
    worked example, and looked at the full-page screenshot.
- **Not done**: no real phone or screen reader, and no check against the SI
  text itself (DNS-blocked). The figures rest on agreeing secondary sources.

## Calls I'd defend

- **Stage first, debt type second.** The fee and the options change with the
  stage; the debt type mostly changes who to ask and which form to use.
- **No "hide the car" or dodge tactics.** The page lists the legal limits
  (locking the door is lawful and normal advice) and pushes towards an
  offer. It doesn't coach evasion.
- **"About" on the sale fee, and no computed sale date.** The sources
  disagreed, and the notice of sale prints the date anyway.
- **Scotland and NI get a pointer, not a model.** Their systems (sheriff
  officers and diligence; the EJO) differ too much to fake.

## Left for later

- `/parking` said bailiff fees "start at £75"; I updated both places to £79
  "since May 2026". A real link from the parking read to `/bailiff` is still
  to do.
- `/bailiff`:
  - an "is this fee right?" checker for a total the firm quotes;
  - High Court second-visit logic;
  - bank holidays beyond 2027;
  - a pass over the 2026 rules once legislation.gov.uk is reachable.
- Carried from yesterday:
  - `/find` and the playbook using the five group labels;
  - the homepage showing three tools per group plus "N more" (the
    money-letters group is now 8 long);
  - `/collector` (Scotland's simple procedure, a CPR 31.14 request);
  - `/catchup` business tariffs; `/deposit` DPS window;
  - `/flight` voucher reply; `/debts` 0% end date; `/scam` share card;
  - a real screen-reader pass.
