# Session Notes — October 24, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I reread the last two sessions (`/scam`, `/sell`) and
their "Left for later" lists, then looked for a gap rather than a follow-up.
The money tools cover the moment *before* a debt (`/monthly`, `/lend`,
`/cover`) but nothing for the debts people already have. Grepping "avalanche",
"snowball" and "which debt" found only a passing line in `/ruin` and the
money-math essay.

The gap: **several debts and one amount a month**. Two cards, a store card,
an overdraft. After the minimums, where does the rest go?

Why it passed the "curated, not exhaustive" bar: very common, it recurs every
month, it ends in a clear instruction ("this month: pay £X on Y"), the money
at stake is large, and there's good field evidence that people get it wrong
in a specific way. It's also a pure calculation the site can do exactly on
the person's own numbers, where most advice online argues in generalities.

## Outside reading

Search worked; aeaweb.org and nber.org didn't resolve from the sandbox, so I
used abstracts, university summaries and the Nottingham write-up, and kept only
claims that agreed across them.

- **Gathergood, Mahoney, Stewart & Weber, "How Do Individuals Repay Their
  Debt? The Balance-Matching Heuristic"** (*AER* 109(3), 2019). 1.4 million UK
  cardholders. Cost-minimising would put ~97% of two-card holders' excess
  payments on the costlier card; they put ~51.5% there. Payments track each
  card's share of the balance, and misallocation doesn't shrink as stakes
  rise. **This was the idea that shaped the tool**: the debate is avalanche vs
  snowball, but the common behaviour is a third option, spreading, which is
  worse than both. So the tool shows all three.
- **Amar, Ariely, Ayal, Cryder & Rick, "Winning the Battle but Losing the
  War"** (*JMR* 48, 2011). "Debt account aversion": in four experiments people
  cleared small debts first even when larger ones charged more; drawing
  attention to each debt's accumulated interest helped. That's why the read
  puts a pound figure on the snowball's cost rather than just a verdict.
- **Gal & McShane, "Can Small Victories Help Win the War?"** (*JMR* 49, 2012).
  ~6,000 debt-settlement clients: closing accounts predicted eliminating debt,
  independent of the balances closed. Observational, and the copy says so
  ("that's a correlation, not proof").
- **Kettle, Trudel, Blanchard & Häubl, "Repayment Concentration and Consumer
  Motivation to Get Out of Debt"** (*JCR* 43(3), 2016). Field study + three
  experiments: concentrating repayments on one account raised motivation and
  repayment, most when it was the smallest. People judge progress by the
  biggest proportional drop in any one account. (One search result had the
  author as "Blouin"; it's Blanchard.)
- **Stewart, "The Cost of Anchoring on Credit-Card Minimum Repayments"**
  (*Psychological Science*, 2009), and the **FCA's Occasional Paper 42**
  replication: showing the minimum pulls chosen repayments down. Became the
  "your line" footnote: set your own amount as a fixed payment so the minimum
  never gets a vote.
- **Kivetz, Urminsky & Zheng, "The Goal-Gradient Hypothesis Resurrected"**
  (*JMR* 43, 2006), and Hull (1932). Coffee-card customers bought faster near
  the free coffee; a 12-stamp card with 2 pre-stamped beat a 10-stamp card. I
  checked I wasn't conflating it with Nunes & Drèze's car-wash study (2006),
  which is a separate paper. I left out the percentages I couldn't confirm.

## The insights that shaped it

1. **The argument is about the small number.** On realistic debts the
   avalanche–snowball gap is often tens of pounds. Paying only the minimums vs
   a fixed budget is thousands. In the worked example: order worth £95,
   amount worth ~£5,000. So the read always shows the minimums-only figure and
   what a round step up (~10% more a month) would save.
2. **Name the price of the win, then let people buy it.** The snowball isn't
   irrational if motivation is the binding constraint (Gal & McShane, Kettle).
   It's only a mistake when it's expensive and unpriced (Amar et al.). So the
   read takes the win when the gap is ≤ max(£20, 1% of what's owed), goes by
   rate otherwise, and offers a hybrid (one quick win within six months, then
   by rate) to someone who says they've stalled before.
3. **Spreading is the one answer with nothing going for it.** It doesn't
   minimise interest and it delays the first win. The read says so with both
   numbers (extra cost, and "first debt in month 17, not month 3").
4. **When the money doesn't cover the minimums or the interest, the order
   question is the wrong question.** Those reads skip the plan entirely and go
   to free debt advice (StepChange, National Debtline, Citizens Advice; NFCC
   in the US) and calling lenders before a missed payment, with a warning about
   fee-charging debt firms.

## What I built

**`/debts`, "Which Debt First?"** (short: "Which debt first?"; group "deciding
now", after `/monthly`).

- **Inputs**: what you're working towards (carried subject seeds it); up to 8
  debts with name, balance, APR and minimum (blank minimum guessed at 3% of the
  balance, min 25, and flagged); the monthly budget, minimums included (the
  hint shows the minimums' total); "stalled before?" (shown with ≥2 debts).
- **The engine** (`app/data/debts.ts`, pure). Month-by-month simulation:
  interest at APR/12, every minimum (fixed at today's), the rest to the target,
  cleared debts' minimums roll on. Orders: `rate`, `small`, `hybrid`, `spread`
  (proportional to balance, re-spread when a share clears a debt), plus
  minimums-only without rollover. 50-year horizon. Kinds `short | never | one |
  same | close | hybrid | rate`, checked in that order.
- **The read**: spoken headline; "This month: pay the minimum on A (£x) and B
  (£y), and put £z on C"; a body per kind; when each debt goes (calendar
  months); interest bars by order with the comparison sentence; notes (amount
  vs order, a step up, don't spread, 0% deals, guessed minimums); the line;
  copy line / copy the whole plan.
- **Handoffs**: `/keep` (find the money), `/ruin` when stuck, `/monthly`
  (before the next plan), `/rule`.
- **Worked example**: four debts, £7,550, £400 a month → go by rate (store
  card first), £95 cheaper than smallest-first; minimums only would be 7+
  years and ~£7,000.

**Wired in**: a new model, **Goal Gradient** (Psychology; Hull, Kivetz et al.,
tied to Kettle and Gal & McShane); `anchoring` now also lists the essay;
`tools.ts`; the router (options group, after monthly, rec `/debts` then
`/keep`); the playbook (`several-debts`, money group, after pay-monthly); the
essay **"One Debt at a Time"**; search, sitemap, backup registry (`debts:v1`),
`/now` (new lead bullet, the oldest dropped), `SITE_UPDATED` → October 24.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint`, `bun run build` clean; `/debts` static.
  (Lint caught `useMemo(() => new Date(), [])` under the React Compiler;
  switched to `useState(() => new Date())`.)
- A scratch script ran 20,000 random drafts (bad money, bad rates, duplicate
  and non-string ids, non-arrays, nulls) through `parseDebtsInputs` →
  `readDebts` → every text function: no undefined/NaN/null/Infinity/[object,
  every non-stuck read had a finishing plan, and the avalanche never cost more
  than the snowball. All seven kinds occurred.
- Headless Chromium at 375 px on `next start`: `?subject=` seeded the field;
  example headline; adding a debt focuses its name; close / short / never
  headlines; reload kept inputs; the live region spoke the headline;
  scrollWidth 375; no page errors. `/tools`, `/playbook`, `/models`, `/now`,
  `/data`, the sitemap and the essay link it; `/find` → make the call → the
  debts choice recommends `/debts`. Search: "which debt first", "pay off debt",
  "debt snowball", "credit card debt", "avalanche", "minimum payment" → `/debts`
  first; "is this a scam", "lend money" unchanged.
- **Caught while testing**: the spread note said "no debt goes early", which
  isn't always true; it now gives both first-win months, only when spreading is
  actually later. And a gap under £1 read "costs only about £0"; now "costs
  nothing extra".
- **Not done**: a real screen reader, a real phone, clicking copy.

## Calls I'd defend

- **APR/12 monthly, fixed minimums.** Not a statement replica. Real minimums
  shrink with the balance, which would make "minimums only" look even worse;
  keeping today's minimum is also the better habit, so the tool models it and
  says so in the doc comment.
- **A threshold, not a slider, for "close".** max(£20, 1% of the total) is a
  judgment. A slider asking "what's a quick win worth to you?" would be a
  question nobody can answer; the copy shows the gap in pounds so anyone who
  disagrees with the call can see why.
- **Mortgages left out** in the copy: long, cheap and secured, different sum.
- **No balance-transfer calculator.** The 0% note covers the common trap (the
  deal ends before you've cleared it) without another set of fields.

## Left for later

- `/debts`: a 0% end date per debt (switch to the revert rate in the
  simulation); a return-desk check on the first debt's cleared month; an `.ics`
  for it; a link from `/monthly`'s "stretch" read and `/ruin`.
- `/scam`: the "send this to someone" share card; the base-rate trainer link;
  a romance/long-con mode.
- Carried: `/sell` many-items and box date as a return-desk kind; `/lend`
  check-offs; the `/monthly` pay-in-four `.ics`; `/cover` and `/fix` →
  `/monthly`; `renewals:v1` kinds for `/bills` and `/chores`; the `/trial`
  yearly-plan headline; `/chores` "can't do it" and rota; the `/bills` share
  link; `/cover` → `/fix`; the second-quote prompt on `/fix`;
  collect-by-message for `/split`; multiple claims on `/cover`; `/ruin` →
  `/cover`; `/rule` receiving a line; `/round` duplicate dots; the trainers'
  reveal focus; the journal's "Mark reviewed"; a real screen-reader pass;
  `/crux` values → `/par`.
