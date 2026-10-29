# Session Notes — October 29, 2026

## What I set out to do

Same brief: make the site a useful *instrument* for real people, not a
self-improvement site. I reread the last session's notes (`/parking`) and the
"left for later" lists, then looked for a gap rather than a follow-up. The
recent tools (`/refund`, `/flight`, `/deposit`, `/parking`) share a shape: a
letter arrives asking for money or refusing it, a rule most people don't
know decides most of it, and the tool turns the rule into a number, a letter
and a date. Grepping "back-bill", "catch-up", "estimated" and "smart meter"
found nothing.

The gap: **a catch-up energy bill.** The smart meter stopped sending, or the
estimates ran low, and one bill asks for a year or two of the difference.

Why it passed the "curated, not exhaustive" bar:
- It's common. Ofgem's July 2026 review of the largest suppliers says they
  wrote off over £172 million for almost a million customers under the
  back-billing rule, and that about 11 million bills went out at least a
  month late in 2024. Citizens Advice has run campaigns on faulty smart
  meters for years.
- It ends in a concrete action: a complaint with the rule in it, a plan to ask
  for, and a date for the ombudsman.
- There's a known mistake: paying it whole (often on a card), or arguing that
  the total "can't be right", which the supplier can rebut, instead of
  arguing the date, which it can't.
- It reduces to a sum the site can do well: split one long period at a
  cut-off date, weighted by season.

## Outside reading

As in past sessions, I worked from search results (gov.uk-type hosts tend not
to fetch from the sandbox) and kept what agreed across sources:

- **Great Britain**: Ofgem's back-billing ban (2018 decision; standard licence
  condition 21BA). No bills for energy used more than 12 months before the
  bill where the customer wasn't correctly billed, unless the customer
  behaved "obstructively or manifestly unreasonably" (refusing access,
  tampering; ignoring requests is judged case by case). A correct bill sent
  at the time and not paid isn't a back-bill. Campaigners and MPs pushed in
  2025 for six months and Ofgem said it was "looking at all options"; I found
  no decision, so the tool uses 12.
- **Northern Ireland**: the Utility Regulator's 13-month limit (2020), where
  the shortfall was the supplier's fault. The Consumer Council takes
  complaints. I couldn't confirm a time limit for going to it, so the tool
  gives no closing date there (it says so in a code comment).
- **Complaints**: eight weeks for the supplier, or a deadlock letter sooner;
  then the Energy Ombudsman, free, within 12 months. One site claimed a cut to
  six weeks; nobody else did, so I left it out.
- **Repayment**: suppliers must offer an affordable plan (licence condition
  27). Citizens Advice's guidance is to ask for it to be spread over as long
  as the debt built up. I checked whether "at least as long as" is a GB rule:
  it was in the old Code of Practice for Accurate Bills (closed in 2019) and
  is a rule in New Zealand and Michigan, so the tool presents it as the ask,
  not as an entitlement.
- **Seasonality**: the month weights are my own rounding of the usual UK
  pattern (gas heavily winter; electricity flatter). The tool says so and
  says the supplier must do the real split from readings.

## The insight that shaped it

**Check one date before you check the total.** A late bill is about two
things: what you used, and who sat on the information. The back-billing rule
cuts by *when* energy was used, not by the amount or whether it's "fair", so
the question that matters is "how much of this is for energy used before this
date last year?" That part was never theirs to bill. The general principle
(limits that put the cost of delay on whoever controlled the information) got
an essay: "Whose Delay Was It?". It's related to "What Does Losing Cost?" (a
dispute here costs nothing if you lose), but the new idea is the attribution
of delay.

## What I built

**`/catchup`, "A Catch-up Energy Bill: What Do You Owe?"** (short: "Catch-up
energy bill"), in the "deciding now" group after `/parking`.

- **Inputs**: which bill; the supplier; GB or NI; gas, electricity or both;
  the shortfall; the bill date; the period's start (last real reading) and
  end (optional, defaults to the bill date); real reading or estimate; why it
  was late (their side / didn't send readings when asked / refused access /
  correct bills unpaid); the stage (new, complained, deadlock) and its date;
  whether you need to spread it.
- **The engine** (`app/data/catchup.ts`, pure):
  - seven kinds: `reading | backbill | arguable | owed | excluded | wait |
    ombudsman`;
  - the cut-off (12 or 13 months before the bill) and a day-by-day seasonal
    split of the period → `tooOld`, `owed`, `share`;
  - the plan: months the shortfall built up over, and the monthly amount;
  - ombudsman open and close dates (no close date in NI);
  - letters: the complaint (with the rule, the conduct paragraph, a rebill
    request when the bill's an estimate, and the plan), a plan-only request
    when nothing's disputed, and the ombudsman statement.
- **The read**: headline (spoken), body, "the bill, split at the cut-off"
  with a bar, the plan line, the letter with copy, the ombudsman dates with an
  `.ics` for the eight-week day, what to keep, the line to keep, copy the
  whole plan, and handoffs to `/debts` and `/rule`.
- **Worked example**: twenty months unbilled on gas and electricity, £1,840;
  about £655 too old to charge, the rest over twenty months.

**The essay**: "Whose Delay Was It?" (`/writing/whose-delay-was-it`), in the
"people" group, linked from the Sludge model.

**Wired in**: `tools.ts` and its group; the router (other-people group, then
`/debts`); the playbook situation `catchup-bill` (sludge, status quo bias);
search (titleText and bodyText); the sitemap; the backup registry
(`catchup:v1`); `/now` (new lead item, oldest `/refund` item dropped);
`SITE_UPDATED` → October 29.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean;
  `/catchup` is static.
- A scratch script printed every kind's headline, body and letter for GB and
  NI. Fixed from that: the owed-and-affordable case no longer offers a
  "formal complaint" letter (nothing is disputed), and a plan-only request
  drops the complaint and ombudsman lines; far dates show the year.
- Fuzzed 30,000 random drafts through parse → read → every text function: no
  `undefined`/`NaN`/`null`/`[object`, share in [0,1], tooOld + owed = amount
  when the rule isn't excluded, all seven kinds hit.
- Headless Chromium at 375 px on `next start`: `?subject=` seeds the field;
  the example renders; a typed GB gas bill gives the expected read and
  survives a reload; switching to "complained" gives the wait date; no page
  errors; scrollWidth 375; `/tools`, `/now`, `/playbook` and the essay link
  to it; "smart meter estimated bill" in search ranks `/catchup` first, and
  "parking fine" still ranks `/parking` first. I renamed the playbook
  situation so "catch-up energy bill" ranks the tool, not the playbook, first.
- **Not done**: a real screen reader or phone, clicking copy or opening the
  `.ics`; no adviser has read the letters.

## Calls I'd defend

- **The tool asks why the bill was late and believes the answer.** If you
  refused access it says the limit won't help, and turns to the plan.
- **"Didn't send readings when asked" is shown as arguable, not lost.** Ofgem
  judges it case by case, and disputing costs nothing if you lose.
- **The split is labelled an estimate.** It gives the letter a number to
  anchor on; the supplier has to compute the real one.
- **No invented NI dates.**

## Left for later

- `/catchup`: business tariffs (microbusinesses are covered by the same rule);
  water and telecoms (I couldn't confirm equivalent household rules); a
  "check the rates" helper; a refund-due branch (credit isn't time-limited).
- `/parking`: bank holidays in the Schedule 4 count; the new private code
  once in force (late December 2026); bus-lane PCNs; hire cars.
- Carried over: `/deposit` DPS window and joint tenancies; the `/flight`
  voucher reply; `/debts` 0% end date; the `/scam` share card; `/sell`
  many-items; `/lend` check-offs; the `/monthly` pay-in-four `.ics`; a real
  screen-reader pass.
