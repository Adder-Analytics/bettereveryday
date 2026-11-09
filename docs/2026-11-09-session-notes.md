# Session Notes — November 9, 2026

## What I set out to do

Same brief: make the site a useful instrument for real people, not a
self-improvement site. I reread yesterday's notes and their "left for later"
list. It named **a bereavement admin tool ("someone has died: what's due
when")** as the biggest gap. Grepping found "probate" and "bereavement" only
in passing in `/bailiff`.

Why it passed the "curated, not exhaustive" bar:
- **Almost everyone goes through it, usually more than once,** at the moment
  they're least able to sort paperwork.
- **The help that exists is sorted the wrong way.** Gov.uk, Citizens Advice
  and funeral directors give long checklists sorted by agency or by order.
  None says which items cost money if they wait.
- **The costliest deadline is the quietest.** Bereavement Support Payment
  (up to £9,800) has to be claimed within three months to get all of it, and
  nobody rings to remind you. Which? called it "Britain's forgotten benefit".
- **A common, frightening myth is cheap to fix.** "Do I have to pay their
  debts?" No, unless a debt was joint or guaranteed. Collectors still ring
  relatives.

## Outside reading

gov.uk still doesn't resolve from the sandbox, so as before I worked from
search summaries and kept only what agreed across sources. The sources were
Turn2us, Marie Curie, Age UK, HMRC guidance excerpts, Citizens Advice,
council pages, Which?, Royal London's adviser notes and law firms on the 2026
probate fee and the 2027 pension change.

- **BSP**:
  - higher rate £3,500 + 18 × £350 = £9,800; standard £2,500 + 18 × £100 =
    £4,300. Frozen since 2017, still the 2026/27 rates;
  - claim within 3 months for all of it. A later claim is backdated 3
    months, so each month late loses a payment. No lump sum after 12
    months, usually nothing after 21;
  - cohabiting partners qualify only with Child Benefit (since Feb 2023).
- **Funeral Expenses Payment**:
  - claim within six months of the funeral (Turn2us, reviewed July 2026);
  - fees plus up to £1,000 of other costs, or £120 with a plan;
  - Scotland's Funeral Support Payment also has a six-month window.
- **Registration**: 5 days (E&W, NI) or 8 days (Scotland). Sources disagree
  on when the 5 days start under the medical examiner system, so the tool
  says "about" and "the register office will tell you".
- **Inheritance tax**: due at the end of the sixth month after the month of
  death, with interest after (e.g. a death on 10 Jan is due 31 Jul). Pensions
  count from 6 April 2027, for deaths from then.
- **Probate fee**: reported as rising from £300 to £526 in July 2026, but one
  source says "subject to approval" and the dates differ (6 or 13 July). The
  tool says "the fee rose in 2026" and gives no number.
- **Council tax Class F**: runs until probate, then up to 6 months while the
  home is empty. It doesn't apply where someone else was jointly liable.

**Ideas**:
- **Don Reinertsen**, *The Principles of Product Development Flow* (2009):
  "if you only quantify one thing, quantify the cost of delay."
- **Zhu, Yang & Hsee**, "The Mere Urgency Effect" (*Journal of Consumer
  Research*, 2018): people pick the task with a deadline over a better-paid
  one without, even when the urgent one pays less.
- I reread this site's Administrative Burden and Scarcity models. Grief is
  the scarcity of stamina that both describe.

## The insight that shaped it

**Loud deadlines and quiet deadlines.** The registrar's five days are loud:
everyone mentions them, and missing them by a day costs nothing. BSP's three
months are silent and cost £350 a month. Urgency is set by whoever's asking.
Cost of delay is a fact about the task, and nobody prints it on the letter.

So the tool's organising principle is **sort by cost of delay**. Each item is
tagged:
- "costs money if it waits";
- "has a date";
- "no deadline".

The tool also says what can wait, in as many words. **Permission is part of
the help**: a list of seventy things all at the same weight doesn't get done,
and a list of four with the rest set aside on purpose does.

## What I built

**`/bereavement`, "Someone Has Died: What's Due, and When?"** (short: "After
a death"), in a new tool group, "Someone has died".

- **Inputs**:
  - region; date of death; your relationship (spouse or civil partner,
    unmarried partner, relative, friend or executor); registered yet, and
    when; coroner;
  - lived with them; lived alone; home owned alone, jointly or rented;
  - under State Pension age; Child Benefit or pregnant;
  - qualifying benefits and the funeral date; rough estate size; everything
    to a spouse; private pension;
  - their name, optional, for the letters.
- **The read** (`app/data/bereavement.ts`, pure functions):
  - dated items: register, Tell Us Once (28 days), empty-home insurance
    (about 30 days), BSP, funeral payment, IHT, pension lump sum (2 years),
    council tax or NI rates, tenancy, deed of variation, probate;
  - each item carries a cost tag, a stake and a detail;
  - BSP is computed for today, with the months lost and whether the lump sum
    has gone.
- **Headline**: register first if it's within days. Otherwise the BSP date
  ("Claim … by Wednesday 30 December and you get all £9,800"), or "today:
  it's worth £3,700 now". Otherwise the next money date, or "Nothing here
  costs money if it waits."
- **Centrepieces**:
  - **What waiting costs**: BSP by claim date as bars (£9,800, £8,750,
    £6,650, then £2,800 just after a year);
  - **a timeline** from the death, with "Today" placed among the items;
  - **What can wait** and **Their debts aren't yours** sections.
- **Unmarried partners**: the tool states the hard fact (no inheritance
  without a will) and the six months after the grant for an Inheritance Act
  claim.
- **Letters**: notifying a bank or company; to a creditor chasing family; the
  council (a Class F exemption, or the single person discount from the day
  after); the landlord.
- **Also**: an .ics file with a week's warning; free help (Bereavement
  Service 0800 151 2012, Cruse 0808 808 1677); hand-offs to `/counciltax`,
  `/scam`, `/collector` and `/challenge`.
- **New model**: Cost of Delay (Reinertsen; Zhu, Yang & Hsee).
  Administrative Burden also links the new essay.
- **New essay**: "Most of It Can Wait".
- **Wired into**: tools and the new group; `/find` (people group, then
  `/scam`); the playbook ("Someone close to you has died"); backup
  (`bereavement:v1`, not answer-now, since it isn't a decision); search; the
  sitemap; writing groups; `/now` (new lead item, oldest dropped);
  `SITE_UPDATED`.

## How I verified it

- **A bun script ran 8 cases through the read**:
  - the worked example; a death two days ago, not yet registered, with an
    empty home and IHT possible;
  - a Scottish widow 8 months on (£3,700 of £4,300 left);
  - an unmarried partner without children (BSP not payable), on benefits;
  - an NI renter; a death more than 21 months ago; a coroner case; an estate
    of unknown size.

  Reading the output, I fixed:
  - a body line counting done items and "none has … they're marked";
  - "as the executor of estate" in the council letter;
  - NI getting council tax (it has rates, via Land & Property Services);
  - "probate likely" shown for every estate under £325k;
  - a lowercase headline fragment;
  - "No deadline: No deadline".
- `bunx tsc --noEmit`, `bun run lint` (two entity-space errors auto-fixed)
  and `bun run build` are all clean. The first build failed because the new
  situation wasn't in a playbook group, so I added it to "people".
- **Headless Chromium at 375 px on `next start`**:
  - I clicked through a spouse case: the headline read "…by Friday 20
    November and you get all £4,300", with no console errors;
  - screenshots of the worked example and an executor timeline look right;
  - all checked pages have scrollWidth 375: `/bereavement`, `/tools`,
    `/now`, the essay, `/find`, `/models`, `/playbook`, `/`, `/search` and
    `/data`;
  - in search, "bereavement support", "probate", "someone died" and "cost of
    delay" all find the tool.
- **Not done**: no check against gov.uk text (DNS-blocked), no real phone or
  screen reader.

## Calls I'd defend

- **Sorted by cost of delay, not by agency.** That's the whole point.
- **No probate fee number, no IHT interest rate.** I couldn't verify either.
- **"About" on the registration date.** The legal start point is disputed
  across sources, and the register office tells people anyway.
- **No "I'm sorry" theatre beyond one sentence.** The page's first two words
  say it. After that, respect is being quick and accurate.
- **Backup only, not answer-now.** A death isn't a "decision" to resume on
  `/decisions`.

## Left for later

- `/bereavement`:
  - verify against gov.uk when it's reachable (BSP backdating wording,
    Funeral Expenses Payment amounts, the probate fee);
  - inheriting State Pension for survivors over pension age;
  - joint accounts and the mortgage (life cover, protection);
  - an executor's own checklist (estate accounts, the Gazette, distribution);
  - Scotland's prior rights, NI's rates relief detail;
  - a "they've written to me about a debt of theirs" path straight into the
    creditor letter.
- Carried:
  - `/counciltax` (attachment of earnings table, Scotland path);
  - `/challenge` follow-ups;
  - `/rent` → `/repairs` and `/deposit` → `/repairs` links;
  - a real screen-reader pass.
