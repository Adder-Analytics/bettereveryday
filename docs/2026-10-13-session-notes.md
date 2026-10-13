# Session Notes — October 13, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I used the same method as recent sessions. I listed
calls ordinary people make, then grepped the tools, playbook and essays for
each one ("repair or replace", "split the rent", "fair share", "chore",
"envy", "subscription", "rent or buy").

## What I noticed

Almost the whole kit is for one person deciding alone. `/crux` and `/round`
are the only group tools, and neither handles the commonest shared money call
I could think of: **housemates splitting the rent on rooms that aren't
equal**. Grepping "split the rent", "fair share" and "envy" found nothing at
all. It happens to most people at least once (often several times in their
twenties), it sours households, and it ends in a clear answer. It passed the
"curated, not exhaustive" bar.

It's also a rare case where there's a *provably* good answer, not just better
advice, and where the usual defaults (equal split, split by floor area,
kitchen-table haggling) each fail in a specific, explainable way.

## Outside reading

Search worked and page fetches didn't (DNS failures on every host again), so I
read abstracts and secondary summaries, and only used claims that more than
one summary agreed on:

- **Francis Su, "Rental Harmony: Sperner's Lemma in Fair Division"**
  (*American Mathematical Monthly* 106(10), 1999). Under mild assumptions
  there's always a rent split at which every housemate prefers a different
  room, and the proof gives a procedure. The NYT built a calculator on it in
  2014.
- **Goldman & Procaccia, "Spliddit: Unleashing Fair Division Algorithms"**
  (*SIGecom Exchanges* 13(2), 2014), plus a CMU news item: almost 40,000
  unique users in its first months. That's the source of the "values sum to
  the rent" question and the welfare-maximising assignment.
- **Gal, Mash, Procaccia & Zick, "Which Is the Fairest (Rent Division) of
  Them All?"** (EC 2016; JACM 2017; CACM 2018). Envy-freeness alone allows
  lopsided splits. Among envy-free splits, the one that does best by the
  worst-off person was rated by real Spliddit users as fairer by more than a
  point on a 1–5 scale. It's been Spliddit's default since April 2015. I
  didn't find the sample size, so the copy doesn't give one.
- **Peters, Procaccia & Zhu, "Robust Rent Division"** (NeurIPS 2022). People's
  values are rough (they've seen the rooms briefly), so prefer the split that
  stays envy-free for the largest error in everyone's numbers ("lexislack").
  This changed the design (below).
- Also read, not used in the copy: **Ross & Sicoly (1979)** on egocentric
  bias in joint work. The famous "spouses' chore shares sum to over 100%"
  line turns out to come from their pilot work and later retellings, not the
  main study (which used a line-mark, not percentages). That's a reason not
  to quote it, and a note for a future chores tool.

## The insight that shaped it

**The margin is what people need to see, not the maximin.** Maximin (Gal et
al.) picks the envy-free split that's kindest to the worst-off. But its
solution makes many no-envy constraints *exactly* tight: someone ends up
precisely indifferent between their room and another. With rough numbers,
"exactly indifferent" means "might well prefer the other room". Peters et
al.'s point is that slack matters.

So the tool does it in this order, all in closed form, no LP solver:

1. **Rooms**: brute-force the welfare-maximising assignment (n ≤ 6, so 720
   permutations).
2. **Widest margin**: in utility terms the no-envy constraints are
   difference constraints, `u_i − u_j ≥ v_i(σ_j) − v_j(σ_j)`. Adding a
   uniform slack `s` stays feasible until some cycle's total goes positive,
   so the best `s` is the minimum over simple cycles of minus the mean cycle
   weight. With n ≤ 6 there are at most 409 cycles.
3. **Share the rest equally**: the least potentials (longest paths) at that
   slack, plus an equal share of the remaining surplus. Every constant shift
   keeps the constraints, so the sum lands exactly on the rent.
4. **Guard**: if the margin would push the worst-off below what zero slack
   would leave them, binary-search the slack down. Robustness never costs the
   person doing worst.

The second insight was for the UX: **only the gaps within one person's
numbers matter**. Adding a constant to all of one person's rooms changes
nothing. So a row that doesn't add up to the rent isn't an error. The tool
offers "spread what's left evenly" (rounded so it still sums exactly), does
the same silently on lock-in, and says so in the result. That removes the
most annoying part of Spliddit-style forms.

The question is framed as **"price the rooms so you wouldn't mind which one
you got"**. That's what quasi-linear values mean, put in words a housemate
can answer.

## What I built

**`/split`, "Who Gets Which Room?"** (short name: "Room and rent").

- **Setup**: what you're splitting (the carried subject), the rent, 2–6 people
  (chips; changing the count unlocks everyone), names, rooms.
- **"Before anyone types a number"**: agree out loud to accept the result.
  The procedure is the fair part.
- **Private turns, pass-the-phone**, the same as `/round`: "I'm X — my turn"
  opens a panel with one price per room. A live total shows "£50 left to
  place" or "Adds up ✓". "Lock in and hide my prices" returns focus to the
  heading, and "Redo" clears a row without showing it. There's a note that
  pricing the room you want low can lose you it.
- **The answer** (`app/data/split.ts`, pure):
  - **clear**: "Nobody would swap. Each of you prefers your own room by at
    least £X."
  - **close**: margin under 1% of the rent; names the person and suggests a
    second look at that room before signing.
  - **tie**: another assignment scores the same; "two of you could trade
    rooms and be just as happy", so use a coin or let whoever cares more
    choose.
  - It also gives the nearest swap ("Alex would need the box room to be £25
    cheaper…") and the **equal-split check**. Equal works only if everyone can
    have a favourite (checked over permutations, so indifferent people don't
    count as clashes); otherwise it names who'd fight over which room.
  - Notes for evened rows and for a negative rent.
- **Show everyone's prices** (a table with each person's room marked) only
  after the answer, plus **Copy the split as a message** (with a sentence on
  how it was worked out), and a handoff to `/crux` if someone won't accept it.
- Prices are rounded to whole units (or pence if the rent has pence) by
  largest remainder, so they sum exactly to the rent. Margins are computed on
  the rounded prices.
- Worked example (read-only): Alex, Sam and Priya, a £2,400 flat, an en
  suite both Alex and Priya want. The result is £992 / £892 / £516, nobody
  would swap by at least £24, and Priya is better off in the box room by her
  own numbers.

**Wired in**: `tools.ts` (deciding-now, after round), router (`triage.ts`, a
new "split-rooms" choice under "Other people", then `/crux`), playbook (a new
`splitting-the-rent` situation in the people group), a new **Envy-Free
Division** model, search index, sitemap, backup registry (`split:v1`, subject
`what`).

**Essay: "Price the Rooms, Not the People"** (people group, after
`decide-your-line-first`). It covers the kitchen-table scene, why equal and
floor-area splits fail, the envy-free test, Su's theorem, Spliddit's method,
maximin and the user study, robustness, and the three procedural rules
(price privately, price honestly, agree to the method first).

**`/now`**: new lead bullet, oldest (`/walkaway`) dropped. `SITE_UPDATED` is
now October 13.

## How I verified it

- `bun run lint`, `bunx tsc --noEmit` and `bun run build` are all clean.
- A scratch script checked: the worked example; a 2-person case (prices at
  the midpoint of the two valuations, margin = half the welfare gain);
  identical valuations (tie read); distinct favourites (equal works); a row
  with an all-equal person (no false clash); a lopsided 1800/0/0 row; an
  unlocked row (no read); and **300 random cases with 2–6 people**. Prices
  always summed exactly to the rent and no one envied anyone beyond rounding.
  Six people ×20 runs took 5 ms in total.
- Headless Chromium at 375×812 against `next start`:
  - The carried subject seeded.
  - Three private turns, focus returned to the heading after each lock.
  - The live region spoke the headline.
  - "Spread what's left" now sums exactly. **A bug was caught here**: naive
    per-cell rounding left £1 over, so the result wrongly said Sam's row was
    evened. Fixed with largest-remainder rounding.
  - scrollWidth stayed 375 with the prices table open, state survived a
    reload, no page errors.
  - Search for "split the rent", "roommates", "en suite", "fair rent" and
    "envy free" all surface `/split` in the top two.
  - `/tools`, `/playbook`, `/models`, `/now`, the essay, the sitemap and
    `/data` all show it.
- **Not done**: a real screen reader, a real phone, clicking the copy button.

## Calls I'd defend

- **Margin first, then equal surplus**, instead of pure maximin. With rough
  numbers, a split where someone is exactly indifferent is fragile, and the
  margin is a number people can understand ("by at least £25"). The guard
  keeps it from hurting the worst-off.
- **Don't force rows to sum to the rent.** It's mathematically neutral to
  even them out, and forcing it is the main friction in existing tools.
- **One room per person; couples count as one.** Spliddit's model, and enough
  for most houses.
- **Pass-the-phone only, no remote collection yet.** `/round` has
  reply-links; a per-room price row is a bigger payload. See below.
- **Show everyone's prices only after the answer**, behind a toggle.
  Transparency helps people trust the result; showing them earlier would
  anchor.

## What I ruled out

- **A floor-area comparison.** It's common advice, but the equal-split check
  already makes the point (a formula prices what it measures), and it would
  add another input.
- **Su's iterative Sperner procedure.** It's elegant, but it asks each person
  many "which room at these prices?" questions. One row of prices is faster
  at a kitchen table.
- **Chores and bills.** Bills are better split equally or by use (the copy
  says so). Chores are a different fair-division problem (bads, not goods,
  plus the egocentric bias above) and deserve their own tool.

## Left for later

- **Collect by message** for housemates who aren't in one room: a reply link
  carrying one person's row, as `/round` does.
- **A chores split** (envy-free division of bads), using the same engine with
  the signs flipped.
- **Weighting a couple's room** (two people, one room, more of the shared
  space).
- Carried: multiple claims per term on `/cover`, `/ruin` → `/cover`, the
  dishwasher-lifetime field on `/worth`, `/rule` receiving a line, `/rule` →
  `/later`, `a-number-appears` → `/walkaway`, `/round` duplicate dots,
  trainers' reveal focus, the journal's "Mark reviewed", a real screen-reader
  pass, and `/crux` values → `/par`.
