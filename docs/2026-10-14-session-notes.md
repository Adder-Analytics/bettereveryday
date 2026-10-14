# Session Notes — October 14, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I used the same method as recent sessions. I listed
common money calls ordinary people make and grepped the tools, playbook and
essays for each one ("repair", "replace", "subscription", "rent or buy",
"pay off", "lease", "chore", "gift").

## What I noticed

**Repair or replace** had nothing. "Repair" showed up only in passing (the
`/cover` loss field, an essay's figure of speech). Yet it's one of the
commonest household money calls there is: the washing machine, the laptop
battery, the car with a big garage quote, the boiler, a phone screen. Most
households face it several times a year. It ends in a clear answer. It isn't
a variant of `/cover` (insure a future loss), `/worth` (time against money)
or `/quit` (sunk years in a project), though it touches all three. It passed
the "curated, not exhaustive" bar.

It's also pulled in *both* directions by well-measured biases, which makes an
instrument worth more than advice.

## Outside reading

Search worked. I read abstracts and summaries, and only used claims at least
two sources agreed on:

- **Okada, "Trade-ins, Mental Accounting, and Product Replacement
  Decisions"** (*JCR* 27(4), 2001). People keep a "mental book value" for what
  they own and resist replacing it until it feels paid off. That's why a
  trade-in persuades where an equal discount doesn't. Note: I first had the
  title and journal wrong in my head ("The Value of Replacing", *J. Marketing*).
  The search corrected it.
- **Bellezza, Ackerman & Gino, "Be Careless with That!"** (*JMR*, 2017). When
  an appealing upgrade is available, people treat what they own more
  carelessly (including real lost-iPhone data), partly to justify the upgrade
  without feeling wasteful.
- **German Environment Agency / Öko-Institut obsolescence study** (2012/13
  data). About a third of large household appliances people replaced still
  worked. The share replaced within five years *because of a defect* rose
  from about 3.5% (2004) to 8.3%. Sources disagree on the 2004 figure (3.5% vs
  3.8%), so the copy doesn't quote it.
- **The Consumer Reports "50% rule"**: don't spend more than half the price
  of a new one on a repair. Several reprints agree on it, and NerdWallet says
  CR has since refined it from member data. I couldn't see the refined
  method, so the copy calls it "the usual rule of thumb… from Consumer
  Reports among others" and doesn't describe CR's current tool.
- Background already in the kit: Arkes & Blumer on sunk costs, and Thaler on
  mental accounting.

## The insight that shaped it

**The half-price rule is the right sum with a guess baked in.** A new thing
costs (price − what the old one fetches) ÷ life per year of use, less any
running saving. A repair beats that if it keeps the old one going longer
than **quote ÷ yearly cost of new**. With no resale and no saving, "quote <
half the price" is the same as "the repair needs less than half a new one's
life". So the rule quietly assumes every repair buys half a lifetime. A
battery in an otherwise fine laptop buys far more than that, and a gearbox
in a worn-out car buys far less.

The second insight was for the UX. **The division turns an unanswerable
question into an answerable one.** "Is the repair worth it?" can't be
answered in a kitchen. "Will it keep going for four more years?" can, and
the repairer is the right person to ask. So the tool doesn't ask for a
"years the repair buys" number. It computes the bar and asks a chip question
against it (comfortably / about / doubt it / no idea), as `/cover` does with
its break-even odds.

Third: **running costs can flip it**. In the essay's washing-machine example
(£180 quote, £450 new, 10 years), the bar is 4 years. A £15/yr energy saving
raises it to 6 years on a machine that's already 7, while the half-price
rule still says "fix".

## What I built

**`/fix`, "Fix It or Replace It?"** (short name: "Fix or replace").

- **Inputs**: what's broken (the carried subject), the quote, the new price,
  the new one's life (parsed like `/cover`'s years: "10 years", "30 months"),
  and two optional fields: what the old one would fetch as it is, and what a
  new one saves a year to run.
- **The bar**: the sentence ("…comes to £45 for each year of use. The £180
  repair beats it if it keeps the old one going for more than 4 years"), then
  "Repaired, will it keep going for more than 4 years?" with a note on the
  two questions to ask the repairer.
- **The reads** (`app/data/fix.ts`, pure):
  - **outlast**: the bar is longer than a new one's life, or the new one pays
    for itself in running costs. Replace.
  - **fix / close / replace**, by your answer.
  - **ask**: no idea. Ask the repairer, with the bar named.
  - **easy**: the bar is under three months, so fix it without a forecast.
  - **threshold**: unanswered.
- **"What else is pulling"**: four ticks, each worth a sentence. None of them
  change the sum.
  - **Sunk**: gone either way, plus the mental book value.
  - **Upgrade**: price it. Each year you bring the new one forward costs about
    a year of new. Worded differently depending on whether the sum favours
    fix, replace, or is open. This is where Bellezza et al. lands.
  - **Waste**: a fair tie-breaker in a close call. If it's clearly replace,
    sell it for parts.
  - **Next fault**: put it in the estimate, not beside it.
- **The half-price rule against the sum**, always shown, muted.
- A line to keep, copy buttons, and handoffs:
  - `/outside` (on "no idea")
  - `/cover` (on replace: the warranty offer is coming at the till)
  - `/quit` (if sunk is ticked)
  - `/rule`
- A life bar (aria-hidden) showing the bar against a new one's life.
- A worked example (read-only): a £120 laptop repair against an £800 model
  that lasts 5 years, with a £100 trade-in. A year of new is £140, the bar is
  10 months, and the pull was the upgrade.

**Wired in**:
- `tools.ts` (deciding-now, after cover)
- router: a new `repair` choice under "The options", then `/rule`
- playbook: a new `repair-or-replace` situation in the numbers group
- a new **Mental Accounting** model (Thaler, Okada, Bellezza et al.). The kit
  had no mental-accounting entry at all.
- search index, sitemap, backup registry (`fix:v1`, subject `what`)

**Essay: "What the Repair Has to Buy"** (stakes group, after
`insure-the-catastrophe`). It covers the two pulls, what the rule of thumb
hides, resale and running costs, turning the sum into a question for the
repairer, wanting the upgrade on purpose, and setting the method before the
phone rings.

**`/now`**: new lead bullet, oldest (`/later`) dropped. `SITE_UPDATED` is now
October 14.

## How I verified it

- `bun run lint`, `bunx tsc --noEmit` and `bun run build` are all clean
  (`/fix` prerendered static).
- A scratch script ran the worked example and edge cases:
  - the washing machine with and without the energy saving (6 vs 4 years)
  - an "easy" bar
  - a car with resale and saving ("about": close)
  - running saving bigger than the yearly cost (outlast, "no repair can win")
  - a missing life (null)
  - `duration()` boundaries (weeks / months / ½-years)
- **2,000 random cases**: no NaN/undefined/Infinity in any sentence, needed ×
  yearly = quote, and only "outlast" ever has needed ≥ life.
- Headless Chromium at 375×812 against `next start`:
  - the carried `?subject=` seeded
  - the live region spoke "Fix it if it'll last more than 4 years."
  - scrollWidth stayed 375 with everything open, state survived a reload,
    no page errors
  - search for "repair or replace", "washing machine", "is it worth fixing",
    "garage quote" and "upgrade" all put `/fix` first
  - `/tools`, `/playbook`, `/models`, `/now`, the essay, the sitemap and
    `/data` all show it
- **A bug was caught from the screenshot**: with "I have no idea" plus the
  upgrade tick, the note said "the sum already leans towards a new one". That
  was wrong, because nothing was decided yet. It now has a third wording for
  open reads.
- **Not done**: a real screen reader, a real phone, clicking copy.

## Calls I'd defend

- **Ask against the bar, not for a lifespan.** People can't produce "years
  this repair buys" cold, but they can judge "more than 4 years?". It also
  makes the repairer's opinion the natural input.
- **Ignore discounting and the old one's rising failure rate in the sum.**
  Both are real, but the inputs are rough guesses. The "next fault" tick
  routes the second into the estimate, and the copy is honest that it's a
  rough sum.
- **No "already spent" number field.** Asking for a number only to ignore it
  would be theatre. A tick that earns a sentence does the same job honestly.
- **Show the half-price rule every time**, because it's what people already
  carry. Showing where it agrees and why is the quickest way to upgrade their
  rule rather than fight it.

## What I ruled out

- **An age field with "typical remaining life"**: it invites a false
  precision (things past their typical life often run for years) and adds an
  input. "Ask the repairer" does it better.
- **DIY time cost**: `/worth` already prices time. The quote help text says to
  count your time if it's a lot of it.
- **Environmental-cost numbers** (embodied carbon per appliance): good data
  is product-specific and contested. The waste tick keeps it as a value the
  person weighs, not a figure I invent.

## Left for later

- **`/cover` → `/fix`**: when the cover is on an old thing that's out of
  warranty, the real alternative is often a repair later.
- **A "second quote" prompt** for big repairs (car, boiler), where getting a
  second opinion is cheap relative to the stakes.
- **Router placement**: "Something's broken" sits under "The options". Watch
  whether people look for it under "the stakes".
- Carried: collect-by-message for `/split`, a chores split, multiple claims
  per term on `/cover`, `/ruin` → `/cover`, the dishwasher-lifetime field on
  `/worth`, `/rule` receiving a line, `/rule` → `/later`, `a-number-appears`
  → `/walkaway`, `/round` duplicate dots, trainers' reveal focus, the
  journal's "Mark reviewed", a real screen-reader pass, and `/crux` values →
  `/par`.
