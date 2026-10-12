# Session Notes — October 12, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I used the same method as the last five sessions. I
listed the calls ordinary people make every month and grepped the tools,
playbook and essays for each one.

## What I noticed

The commonest money call with no instrument was **being offered cover**: the
extended warranty at the till, phone or gadget insurance, the rental desk's
damage waiver, GAP, travel cover, and choosing the excess on a renewal.
Grepping "insur", "warrant", "deductible" and "excess" found only passing
lines in essays (a "warranties and upsells" aside in the framing essay,
"insurance" as one way to cap a tail in `/ruin`). It's frequent, it ends in a
clear answer, and it isn't a variant of `/worth` (time vs money), `/ruin`
(survive a bet you're choosing to make) or `/incentives` (who gains from
your yes). It passed the "curated, not exhaustive" bar.

It's also a trap that goes wrong in *both* directions, which makes it a
better instrument than advice. "Never buy warranties" is half right and
dangerous for the other half.

## Outside reading

Search worked and page fetches didn't (DNS failures on every host I tried),
so I read abstracts and secondary summaries. I only used figures that at
least two summaries agreed on, or that came from the regulator itself:

- **Sydnor, "(Over)insuring Modest Risks"** (*AEJ: Applied* 2(4), 2010). Most
  homeowners at one large US insurer chose low deductibles costing far more
  than their expected value, and the implied risk aversion is implausible. A
  secondary summary gave "$100 more to cut the deductible by $500, claim rate
  under 5%". I used that only as the *shape* of the tool's excess example and
  didn't quote it as Sydnor's number. I also left out the sample size, which I
  couldn't confirm.
- **Abito & Salant, "The Effect of Product Misperception on Economic
  Outcomes: Evidence from the Extended Warranty Market"** (*REStud* 86(6),
  2019). Warranty demand is driven mainly by overestimating failure
  probability, not by risk aversion. In the survey experiment (about 1,000
  people), uninformed guesses were 13–15% against an expert 5%, and the median
  WTP fell from about $50 to $25 when the figure was shown. This is the
  "doubt" read, nearly verbatim.
- **Michel-Kerjan, Lemoyne de Forges & Kunreuther, "Policy Tenure Under the
  NFIP"** (*Risk Analysis* 32(4), 2012). The median tenure of new flood
  policies was 2–4 years, shorter than residence. This is the other direction
  of the error, and it became the "don't let it lapse" note on the insure
  read.
- **FCA**: the GAP sales pause (Feb 2024) followed a claims ratio of 6% vs 65%
  for motor. The 2025 value-measures data puts gadget insurance at 36p of each
  £1 paid out (down from 42%). I used both, dated.
- **Kahneman & Tversky, prospect theory / the fourfold pattern** (1979, 1992):
  small probabilities are overweighted. It's the basis of the new model.
  Harbaugh, Krause & Vesterlund's caveat (the pattern shows up in
  willingness-to-pay but not in choices) is why the copy leans on the warranty
  field evidence rather than the theory.
- Also read, but not used in the copy: **de Meza & Reyniers, "Insuring
  replaceable possessions"** (*Economica*, 2023). If you can't afford to
  replace something, "insure income, not things" breaks down. It's why the
  tool's insure read offers "plan to replace it with something cheaper" as
  the alternative. And the **Mankaï et al. meta-analysis** (2024): stated WTP
  for low-probability insurance averages 87% of expected loss, and people are
  bimodal (pay nothing, or pay a lot), driven by worry. That's why the tool has
  an "I'd worry without it" box rather than pretending worry is irrational.

## The insight that shaped it

**Sort by size before odds.** Both documented errors come from reacting to
how vivid a loss feels instead of first asking whether you could absorb it.
So the tool's first real question is not "how likely?" but "what's the
biggest bill you could pay from savings this month, without borrowing or real
hardship?" That one number decides most cases. It's also the reusable part,
so it becomes the line to keep: *"I insure losses I couldn't pay from savings,
anything over £1,000. Below that I carry the risk myself…"*

For the losses you could carry, I didn't ask for a probability, since people
can't produce one and, per Abito & Salant, the one they produce is inflated.
The tool computes the **break-even** (price ÷ payout) and asks a yes/no
question: *"Is a claim likelier than 1 in 6 over the 3 years it covers?"* The
answer chips separate **why** you'd say yes: my own record vs a feeling. Those
lead to opposite reads, the same move `/later` made with guilt vs want.

## What I built

**`/cover`, "Insure It or Carry It?"** (short name: "Cover or carry").

- **Two modes**: whether to buy the cover, or which excess to take on a policy.
  Both use the same maths, a sure cost P to cut a possible loss by L, so
  break-even = P / L.
- **Inputs**: the cover; the price (once with a term in years, or monthly or
  yearly); what replacing or repairing it would cost and the excess, or for an
  excess choice the extra premium and the two excess levels; the savings
  buffer; whether existing cover might apply (maker's warranty, legal rights,
  card, contents policy); then, once the break-even is known, the odds
  question and "I'd worry without it".
- **Reads, checked in order** (`app/data/cover.ts`, pure):
  1. **never**: the cover costs at least what one claim pays.
  2. **insure**: the worst case is over the buffer. "This is the loss insurance
     is for." For recurring cover, the flood-lapse note. For cover mode, a tip
     to raise the excess up to the buffer. For excess mode, "Keep the lower
     excess. You couldn't pay the higher one."
  3. **check**: something you already have may cover it.
  4. By the odds answer: **carry** / **record** ("Worth it on your record",
     check exclusions and whether the price already prices your record) /
     **doubt** ("Probably not. The feeling runs high." with Abito & Salant) /
     **house** ("The seller set the odds." with FCA gadget 36p, or Sydnor for
     excess) / **threshold** while unanswered.
- **Peace-of-mind note** when worry is ticked and the read is to carry: name
  the price, or buy the same calm with a savings pot.
- **A strip**: worst case against the buffer (`aria-hidden`; the sentence says
  it).
- **Line to keep**, plus "Copy your line" and "Copy the whole read".
- Handoffs: `/outside` (find the base rate, from doubt/house), `/rule` (any
  carry read), `/ruin` (insure: check the rest of the worst case).
- House conventions: `AnnounceAnswer`, `aria-pressed` chips, money fields that
  say under themselves when they can't parse (reusing `/worth`'s parser and
  formatter), a years field that accepts "18 months", carried subject,
  `ClearCallButton`, and a read-only worked example (a £99 three-year warranty
  on a £600 TV breaks even at 1 in 6, it felt that likely, so "Probably not").
  No share link, because it's a personal buffer.

**Wired in**: `tools.ts` (deciding-now, after worth), the router (`triage.ts`,
a new "insure-it" choice under "the stakes", then `/rule`), the playbook (a
new `offered-cover` situation in "There's a number in it"), a new
**Probability Weighting** model, the search index, the sitemap, and the backup
registry (`cover:v1`, subject `what`).

**Essay: "Insure the Catastrophe, Carry the Rest"** (stakes group, after
`an-hour-has-a-price`). It covers the till moment, the two mistakes (Sydnor,
Abito & Salant; Kunreuther), why they're the same error, sorting by size
first, the one division with two worked numbers, the exceptions (your record,
cover you already have), what peace of mind costs, choosing the excess, and
setting the line before the till.

**Also**: the framing essay's "warranties, insurance upsells" aside now links
to `/cover`.

**`/now`**: new lead bullet, oldest (`/par`) dropped. `SITE_UPDATED` is now
October 12.

## How I verified it

- `bun install`, then `bun run lint`, `bunx tsc --noEmit` and `bun run build`
  are all clean.
- A scratch script checked every read in both modes (never, insure, check,
  threshold, carry, record, doubt, house), monthly pricing, an 18-month term,
  a zero buffer, excess ≥ loss (no read), `parseYears`, `oneIn`/`pct`
  rounding, defensive parsing and the summary.
- **A wording bug caught there**: the never case read "only pays if a claim is
  likelier than certain (114%)". It now gets its own sentence.
- Headless Chromium (`chromium_headless_shell-1194`) at 375×812 against `next
  start`:
  - The carried subject seeded and the URL was cleaned.
  - The bad-years hint showed.
  - The odds question rendered with the computed 1 in 6.
  - The live region said "Probably not. The feeling runs high." Dropping the
    buffer turned it to "Insure it. This is the loss insurance is for." It
    stayed silent after a reload, with state kept.
  - Excess mode gave "Take the higher excess. The insurer set the odds."
  - scrollWidth was 375, with no page errors.
  - Search for "extended warranty", "phone insurance", "excess", "is it worth
    insuring", "damage waiver" and "deductible" all put `/cover` first.
  - `/find` (make the call → "I'm being offered cover…") leads to `/cover`.
  - `/tools`, `/playbook`, `/models`, `/now`, `/writing`, the essay, the
    sitemap and `/data` all show it.
- **Not done**: a real screen reader, a real phone, and clicking the copy
  buttons.

## Calls I'd defend

- **The buffer comes before the odds.** It's the question that catches both
  errors, and it's answerable at the till.
- **A yes/no against a computed break-even, not a typed probability.**
  People's probability for "will it break" is the biased input. Asking "is it
  likelier than 1 in 6?" is easier and more honest.
- **The "feeling" answer gets "probably not", not "no".** The evidence is
  about averages, and the copy points to a failure rate instead of overruling
  the person.
- **Worry is treated as a real preference with a price**, not a bias (the
  meta-analysis says people are bimodal on it). The alternative offered, a
  savings pot, buys the same calm.
- **No quoted legal periods.** "Your legal rights over faulty goods run well
  past the first year in the UK and EU" is true without picking a
  jurisdiction's exact number.

## What I ruled out

- **A full expected-value calculator with typed probabilities.** It's the
  wrong input (see above), and `/weigh` already does flip points.
- **Health, life and home insurance comparison.** These are mostly over the
  buffer by definition, so the tool's answer is "insure it" and `/ruin` covers
  the rest. Comparing policies is a shopping problem, not a decision tool.
- **Named product claims ratios beyond the two FCA figures.** Secondary
  numbers on retailer warranty margins (50–60%, "half of Best Buy's profit")
  conflict across sources, so none of them is quoted.

## Left for later

- **Multiple claims per term** (phone cover that pays twice a year) are
  treated as one claim. A "claims allowed" field would make the never read
  exact.
- **`/ruin` → `/cover` link**: its "cap the downside" section could point here
  when the cap is insurance.
- Carried: the dishwasher-lifetime field on `/worth`, `/rule` receiving a line
  rather than just the subject, `/rule` → `/later`, `a-number-appears` →
  `/walkaway`, `/round` duplicate dots, trainers' reveal focus, the journal's
  "Mark reviewed", a real screen-reader pass, and `/crux` values → `/par`.
