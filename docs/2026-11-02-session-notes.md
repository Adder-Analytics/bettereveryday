# Session Notes — November 2, 2026

## What I set out to do

Same brief: make the site a useful *instrument* for real people, not a
self-improvement site. I reread the last three sessions (the regroup,
`/collector`, `/bailiff`) and their "left for later" lists, and grepped for
the most common money letter the first group still didn't cover.

"Rent increase", "section 13" and "Renters' Rights" returned nothing at all.
The only rented-home tool was `/deposit`, which helps at the *end* of a
tenancy.

The gap: **the landlord's notice that the rent is going up.**

Why it passed the "curated, not exhaustive" bar:
- It's common. About a fifth of households in England rent privately, and
  most get a rise every year.
- The usual mistakes cost real money every month for years. People pay
  without checking, because arguing feels like asking to be evicted, or they
  judge the rise by its percentage, which says nothing about whether it's fair.
- **The rules changed on 1 May 2026.** The Renters' Rights Act changed both
  halves of the decision: what counts as a valid increase, and how risky a
  challenge is. Most people (and many web pages) still describe the old rules.
- It comes down to a few checkable rules plus one comparison, and ends in a
  letter and a deadline, which is what the site does well.

## Outside reading

As before, gov.uk and legislation.gov.uk don't resolve from the sandbox
(WebFetch fails on DNS), so I worked from search summaries and kept only what
agreed across sources: Shelter's professional pages, published tribunal
decisions on gov.uk's asset server, and solicitors' and agents' summaries.

- **Section 13 after 1 May 2026.** For a private periodic tenancy in England,
  a section 13 notice on **Form 4A** is the only way to raise the rent. It
  needs at least **two months'** notice (was one month for monthly
  tenancies). The new rent must start at the **start of a rent period**, and
  no sooner than **52 weeks** after the last section 13 increase. Rent review
  clauses stopped working for increases taking effect after 1 May. Texts,
  emails and letters in the landlord's own words don't count. Notices on the
  old Form 4 served before 1 May still stand.
- **The tribunal.** The tenant applies to the First-tier Tribunal (Property
  Chamber) on **form MR1** ("market rent determination"), and only *before*
  the new rent starts. For applications after 1 May 2026:
  - it **can't set a rent above the notice** (a published panel decision says
    so in terms);
  - the new rent runs from its decision and **isn't backdated**;
  - it can delay the new rent by **up to two months for undue hardship**.

  Under the old rules it could go higher and backdate, so challenging was a
  gamble. Trade press reports challenges up 58% since May, and warnings about
  tribunal capacity.
- **The fee** came out as £47 in one source and "free" in another. The tool
  says to check the form's guidance and mentions help with fees. It doesn't
  quote a number.
- **Section 21** ended on 1 May 2026, so a landlord needs a legal ground to
  evict. Shelter says forcing someone out for challenging a rise is an
  illegal eviction.
- **Scotland** (private residential tenancies): three months' notice, once in
  12 months, refer to a rent officer, usually within 21 days. That's from
  memory and consistent with the summaries, so it sits in a pointer with
  "usually". Wales and Northern Ireland get pointers to Shelter Cymru and
  Housing Rights.
- **Relative thinking**: Tversky and Kahneman (*Science*, 1981), the $5 off a
  $15 vs a $125 calculator. This is already the site's `relative-thinking`
  model; today it gets its second essay.

## The insight that shaped it

**A rise is judged against the wrong yardstick.** The percentage is measured
from last year's rent, which is an accident of history: when you moved in,
how many years the landlord let it drift. A 12.6% rise on a rent below the
market can be fair, and a 4% rise on one above it isn't. The question that
decides a challenge is the tribunal's own: *what would this home let for
today, as it is?* So the tool asks for similar homes and compares against
their **median**, not the old rent. The landlord's figure also anchors you,
so the tool asks for the comparables before showing a verdict, and the essay
says to find them before you decide what you think.

The second idea is the changed shape of the risk. Since May, the worst case
of challenging a rise that's above the market is roughly the result of
accepting it, a little later, plus your time. I nearly made that the essay,
but it's the same insight as "What Does Losing Cost?" (the parking essay).
So it became one section of the new essay, which links back. The new essay
is "Not How Much It Went Up, but What It Would Let For".

**Notice before number** is the ordering principle. An invalid notice changes
nothing, so validity is checked first and gets its own letter.

## What I built

**`/rent`, "The Rent's Going Up: Pay It or Challenge It?"** (short: "Rent
increase"). It sits in the money-letters group after `/deposit`.

- **Inputs**:
  - where (England, Wales, Scotland, NI) and who you rent from (private,
    social, lodger);
  - how they told you: Form 4A, an informal message, or not sure;
  - the date it reached you, the start date, whether that's a rent day, and
    when the rent last changed (optional);
  - how often you pay (monthly, weekly or four-weekly; everything is worked
    out monthly but shown in your own period), the rent now, the new rent, and
    up to five similar homes;
  - repairs outstanding, whether you could afford it, and the landlord's name.
- **The read** (`app/data/rent.ts`, pure functions). The statuses are:
  - elsewhere, social and lodger (pointers);
  - informal ("that isn't a valid increase");
  - invalid (less than two months, not a rent day, inside 52 weeks);
  - old (served before May);
  - passed (start date gone: too late for the tribunal);
  - open.

  For open, the verdict compares the new rent with the median of the
  comparables, using a ±3% band for "about market", and the offer is the
  lower of the proposal and that median. A "worth checking" list covers
  doubts: two months only just met (posting can make the served date later),
  the rent day unknown, the last change unknown.
- **Letters**:
  - the reply to an informal request;
  - why the notice doesn't work;
  - your evidence and an offer (above market only), or an acceptance, with a
    repairs line if you gave one;
  - the "I've applied to the tribunal" note.

  For a lodger, a friendly counter-offer.
- **Also on the page**:
  - the "last day to apply" box (the day before the start date), with an
    `.ics` holding that date and a nudge a week before, and what each month of
    the tribunal's wait is worth;
  - a strip that plots the comparables, the current rent and the new rent;
  - what to keep, and free advice;
  - the line to keep, and hand-offs to `/walkaway` (your line before you
    negotiate), `/split` (housemates) and `/deposit`.
- **Wired into**:
  - tools (and the group blurb), the router (`/find`: "The landlord says the
    rent's going up", then `/walkaway`), situations (the playbook: "The rent's
    going up");
  - backup (`rent:v1`), search (the essay is indexed automatically) and the
    sitemap;
  - models (the essay is added to `relative-thinking` and `anchoring`) and
    writing groups;
  - `/now` (a new lead item; the oldest, `/catchup`, dropped) and
    `SITE_UPDATED`.

## How I verified it

- A bun script ran 14 cases through the read and printed the headline, body,
  reminders and letters:
  - the worked example; no comparables; about market; below market;
  - short notice; inside 52 weeks; not a rent day; informal;
  - a pre-May notice; a passed start date; weekly rent;
  - Scotland; a lodger; social housing.

  Reading the output, I fixed five things:
  - weekly rents came out as monthly figures in the letters ("£1,213 a
    month" for a £280-a-week home), so amounts now show in the rent's own
    period;
  - an "about market" read offered £1,290 against £1,295, a pointless £5, so
    offers now appear only when the rent is above market;
  - the tribunal note appeared for about-market rents;
  - the lodger letter repeated the same figure twice;
  - "the 4 similar homes" was written in digits in prose.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean.
- Headless Chromium at 375 px on `next start`:
  - `/rent`, `/tools`, `/now`, the essay, `/find`, `/search`, `/models`,
    `/playbook` and `/` all have scrollWidth 375 and no console errors;
  - I filled in a £950 → £1,100 case with four comparables around £1,020. It
    read "above", the last day was Thursday 31 December, and the offer was
    £1,020;
  - searching "section 13 rent increase" finds `/rent`, `/models` links to the
    tool and the essay, and the essay links to the tool;
  - I looked at the worked-example screenshot, and moved the strip's end
    labels so they hang inwards instead of spilling off the strip.
- **Not done**: no real phone or screen reader, and no check against the
  amended Act or form MR1 itself (DNS-blocked).

## Calls I'd defend

- **Median of the comparables, not the mean**, and at least two before any
  verdict. One odd listing shouldn't decide it.
- **No offer below the current rent.** The offer is
  `min(proposal, max(median, current))`. A rent challenge isn't a rent cut.
- **No invented tribunal wait.** I found no reliable figure, so the tool
  shows what each month is worth (×3, ×6) instead of predicting the wait.
- **Honest about "about market".** It says a challenge you expect to lose
  mostly buys time, and to weigh that against the relationship. It doesn't
  coach using the tribunal as a delay tactic.
- **I tried and reverted using short labels on the homepage.** Nine long
  names in the money-letters group make a dense paragraph, but labels like
  "Cool", "Trace" and "Widen" have no scent out of context. That's a worse
  trade.

## Left for later

- `/rent`:
  - a fee figure once gov.uk is reachable;
  - Wales (Renting Homes Act) and Scotland as real models rather than
    pointers;
  - a link from `/deposit` and from `/walkaway`'s prompts;
  - "my rent went up on a rent review clause after 1 May", which is invalid
    and deserves its own wording.
- The homepage's money-letters group is nine names long. Perhaps clearer
  short labels for just that group, or "three plus N more".
- Carried:
  - `/parking` → `/bailiff` link in the read;
  - `/bailiff` fee checker, High Court second visit, and bank holidays beyond
    2027;
  - `/collector` (Scotland's simple procedure, CPR 31.14);
  - `/catchup` business tariffs; `/deposit` DPS window; `/flight` voucher
    reply; `/debts` 0% end date; `/scam` share card;
  - a real screen-reader pass.
