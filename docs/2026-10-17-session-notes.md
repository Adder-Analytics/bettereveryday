# Session Notes — October 17, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. Yesterday's `/chores` notes ruled out "unequal target
shares (one person works longer paid hours…)" because it "needs a defensible
way to set the weights, and that's an argument the tool would be taking sides
in". That sentence pointed at the money side of the same household: **how two
people on unequal pay split the shared bills**. Grepping "proportion", "joint
account", "pool", "income" and "50/50" found nothing but passing lines.

Why it passed the "curated, not exhaustive" bar: nearly every couple that
moves in together faces it, usually twice (moving in, and when one pay
changes: part-time, parental leave, a new job). It ends in a clear answer (a
rule and an amount each). It's a known source of quiet resentment, and it's
the third member of the household fair-division set with `/split` and
`/chores`.

## Outside reading

Search worked; I used summaries and abstracts, and only claims that agreed
across sources.

- **Deutsch, "Equity, Equality, and Need"** (*Journal of Social Issues* 31,
  1975). Three bases for distributive justice, and the claim that which one a
  group reaches for depends on the kind of group. This became the tool's
  organising idea and a new model. (Search confirmed the citation and abstract;
  the economic/solidarity/caring mapping is Deutsch's well-known thesis, and
  the copy states it plainly but briefly.)
- **Clark & Mills** (*JPSP* 37, 1979), communal vs exchange relationships;
  Clark (1984) on record keeping in exchange relationships. Used for "keeping a
  tally suits the first; the second usually stops counting".
- **Gladstone, Garbinsky & Mogilner, "Pooling Finances and Relationship
  Satisfaction"** (*JPSP* 123(6), 2022). Six studies, N = 38,534. Full poolers
  more satisfied and less likely to break up; strongest when money is tight.
  Mostly correlational plus an experiment: the essay says "most of that
  evidence is correlational".
- **Vogler & Pahl, "Money, Power and Inequality within Marriage"**
  (*Sociological Review* 42(2), 1994). Nominal pools are often controlled by
  one partner; only about a fifth had a jointly controlled pool, and those were
  the most equal (decisions, deprivation, personal spending money). This
  produced the "keep some money of your own, whatever you choose" clause in
  every line.
- **YouGov, August 2024** (UK). 48% think bills should follow pay vs 37%
  50-50; among dual-earner couples 46% split 50-50 vs 38% by pay; 69% split
  evenly where pay is similar. The say/do gap is in the essay and the model.
  Other surveys (ClearScore, MoneySuperMarket) are from firms selling
  products, so I left them out.

## The insights that shaped it

1. **The row is about principles, not numbers.** Half each (equality of what
   goes in), in proportion (ability to pay), pool it (equality of what's left)
   are each fair. Two people can agree on every figure and still disagree.
   So the tool *doesn't recommend a rule*: it shows all three and makes the
   couple choose together. That's how it avoids the side-taking that ruled out
   unequal shares in `/chores`.
2. **The stakes have a closed form.** Between half each and pooling, the lower
   earner's bills move by exactly half the pay gap, whatever the bills are;
   proportional always sits between. So the headline is "The rule you choose
   moves up to £X a month between you", which turns a moral argument into a
   sized one. When pay is within 10% of the total, the headline says so and
   that half each is fair enough (matching what most such couples do).
3. **Stress-test the rule, not the people.** "If one pay stopped" is where
   half each fails silently (it still asks the person with no income for
   half), while the other two adapt. That's computed, not lectured.
4. **The line includes the amounts and the redo trigger.** "We redo the sum
   whenever either of our pay changes" is the status-quo-bias fix.

## What I built

**`/bills`, "Who Pays for What?"** (short name: "Bills").

- **The two of you**: names and take-home pay a month (parses "£2,400",
  "2.4k", "2,400"; reuses `parseMoney`/`formatMoney` from `worth.ts`).
- **What you share**: tap-to-add chips (rent or mortgage, energy, council tax,
  water, internet and phones, groceries, insurance, childcare, car, holidays)
  that fill an untouched blank row first and move focus to its amount; a
  running total. Max 12 rows.
- **What you do now** (optional): what person 1 pays; the rest is person 2's.
  Flags an amount bigger than the bills.
- **The engine** (`app/data/bills.ts`, pure): three outcomes (pays, left,
  share of pay), a pool top-up when the pay gap exceeds the bills, a
  can't-cover flag for half each, the span, "close", "short", nearest rule to
  now.
- **The read**: headline spoken via `AnnounceAnswer`; a why line; three rule
  cards (principle, a split bar marked at half, aria-hidden, the outcome
  sentence, "Choose this one" with `aria-pressed`); the stress line; the now
  line; "What usually decides it" (why one earns less, how tied together you
  are, what it leaves each, money of your own); "Your line, to keep", which
  appears once a rule is chosen; copy line / copy all three; handoffs to
  `/chores`, `/crux` and `/keep`.
- **Worked example**: Jordan (£3,400) and Robin (£2,100), £2,320 of bills.
  Robin went part-time to retrain; half each takes 55% of Robin's pay. The
  rule moves up to £650 a month. They chose in proportion.

**Wired in**: `tools.ts` (deciding-now, after chores); router "Other people" →
`bills`, then `/chores`; playbook `splitting-bills` (people group) with the
new model and status-quo bias; new **Equality, Equity and Need** model; essay
**"Three Fair Ways to Split the Bills"** (people group); search index;
sitemap; backup registry (`bills:v1`, subject "Bills: Jordan, Robin (£2,320 a
month)"); `/now` lead bullet (oldest, `/split`'s, dropped); `SITE_UPDATED`
October 17.

## How I verified it

- `bun install` was needed first (fresh container). Then `bun run lint`,
  `bunx tsc --noEmit` and `bun run build` are clean (`/bills` static). Lint
  caught five entity-space drops; `--fix` inserted the `{" "}` guards.
- A scratch script ran the worked example and **2,000 random households**
  (pay 0–6,000, 1–5 costs, some unreadable, random "now" and rule). Every
  rule's payments summed to the bills, the pool always left both level when
  not short, and no sentence contained NaN/undefined/Infinity. The parser
  handled malformed stores (duplicate ids, non-string names, unknown rule).
- Headless Chromium at 375 px against `next start`: scrollWidth stayed 375
  (example open and with costs); chip-add focused the amount field; the live
  region spoke the headline; choosing a rule showed the line; state and the
  chosen rule survived a reload; no page errors. `/tools`, `/playbook`,
  `/models`, `/now`, the essay and the sitemap all link `/bills`, and the
  router's "Other people" choice leads to it. Search: "split the bills" puts
  the essay first, "joint account" and "50/50" put `/bills` first, "earns more"
  puts the playbook situation first.
- **Process note, again**: `pkill -f "next start"` killed the calling shell
  (exit 144), exactly as yesterday's notes warned. It needs its own command
  and a pattern that can't match itself.
- **Not done**: a real screen reader, a real phone, clicking copy.

## Calls I'd defend

- **No recommendation engine.** A questionnaire that outputs "you should pool"
  would be taking sides on a values question. The tool sizes the choice, shows
  consequences, offers the questions that usually decide it, and leaves the
  choice to the couple, together.
- **Two people only.** Housemates almost always split evenly and have `/split`
  for unequal rooms; generalising pooling to three or more people needs
  multi-way top-ups for a rare case.
- **Take-home, monthly.** It's the number people know and what bills are paid
  from. Gross pay would overstate the higher earner's ability to pay under
  progressive tax.
- **"Some money of your own" in every line.** Vogler & Pahl is the strongest
  reason; it also defuses the commonest objection to pooling.

## What I ruled out

- **Valuing unpaid work in money** (housework hours as income). It's the real
  counterweight to a pay gap, but any hourly rate takes sides. The handoff to
  `/chores` covers it without a number.
- **Debts and savings goals.** Too product- and country-specific.
- **A fourth "hybrid" rule** (proportional for essentials, half for extras).
  Couples can do this by choosing which costs to list; adding a rule would
  blur the three principles.

## Left for later

- `/bills`: an `.ics` "redo the sum" reminder (the kit has `ics.ts`); a
  "costs only one of us uses" column; a share link so each person can enter
  their own pay privately (like `/round`).
- Carried: `/chores` "can't do it" rating, `.ics` look-again and rota view;
  `/keep` → calendar and free-trial mode, `/cover` → `/fix`, a second-quote
  prompt on `/fix`, collect-by-message for `/split`, multiple claims per term
  on `/cover`, `/ruin` → `/cover`, the dishwasher-lifetime field on `/worth`,
  `/rule` receiving a line, `/rule` → `/later`, `a-number-appears` →
  `/walkaway`, `/round` duplicate dots, trainers' reveal focus, the journal's
  "Mark reviewed", a real screen-reader pass, and `/crux` values → `/par`.
