# Session Notes — October 11, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. The last four sessions each found a common moment the
kit didn't cover. I kept the same method. I listed the calls ordinary people
make every week and grepped the tools, playbook and essays for each one.

## What I noticed

The most frequent everyday call with no instrument was **trading time against
money**: pay for delivery or do the shop, a cleaner, a taxi, the direct flight
or the cheap one with the layover, driving across town for a better price,
doing it yourself, and the big one, the cheaper flat further out with the
longer commute. Grepping for "hourly", "worth my time", "commute",
"warranty" and "mental account" turned up only passing mentions (`/par` and
`/walkaway` use a commute as an example factor). It's frequent, distinct
from `/compare` (which weighs many factors, not a two-sided unit
conversion), and it ends in a clear answer. It passes the "curated, not
exhaustive" bar.

It's also a trap with a specific, well-measured mechanism, which is what
makes an instrument worth more than advice.

## Outside reading

Search worked. I read abstracts, university press releases and summaries,
not full papers:

- **Tversky & Kahneman, "The Framing of Decisions and the Psychology of
  Choice"** (*Science* 211, 1981): the jacket and calculator. People will drive
  20 minutes to save $5 on a $15 calculator, but not on a $125 one. I quoted
  no percentages, because a secondary source's numbers didn't match the group
  sizes. The copy says "far more" / "most".
- **Saini & Monga, "How I Decide Depends on What I Spend"** (*JCR* 34(6),
  2008): decisions about time are more heuristic than decisions about money
  (more anchoring, more compromise choices), because time is harder to account
  for. When people were primed to account for it, the gap closed. That is the
  whole design rationale: put both sides in one unit.
- **Whillans, Dunn, Smeets, Bekkers & Norton, "Buying Time Promotes
  Happiness"** (*PNAS*, 2017): 6,271 adults in four countries. Buying time
  went with higher life satisfaction at every income level. There was a field
  experiment with 60 people, given $40 on two weekends. And of 98 working
  adults asked how they'd spend a $40 windfall, only 2% said they'd save time.
  I checked that figure separately, because a first summary garbled it. The
  copy says the surveys are correlational and the experiment small.
- **DeVoe & House, "Time, money, and happiness: how does putting a price on
  time affect our ability to smell the roses?"** (*JESP* 48, 2012): people
  prompted to think of their hourly wage enjoyed leisure (music) less and were
  more impatient. This became the tool's most important design choice (below).
- **DeVoe & Pfeffer** (Stanford GSB summaries): hourly-paid people treat time
  more like money and volunteer less. I didn't use it in the copy. It's
  background for "not your wage".
- **Stutzer & Frey, "Stress That Doesn't Pay: The Commuting Paradox"**
  (*Scand. J. Econ.* 110(2), 2008): 19 years of the German SOEP panel. Longer
  commutes went with lower life satisfaction, not offset by pay or housing.
- **Kahneman, Krueger, Schkade, Schwarz & Stone, the Day Reconstruction
  Method** (*Science* 306, 2004): 909 employed women in Texas. Commuting came
  bottom of 28 activities for enjoyment. The copy says "study of how people
  spend their days", without overclaiming generality.

## The insight that shaped it

The obvious version of this tool is a calculator: "your time is worth £X/hour
(your wage)". The reading says that's wrong twice. Your **wage** isn't the
price of a free hour unless you can actually sell that hour, and the hour's
price depends on what the hour *is* (commuting ≠ cooking). And DeVoe & House
say that **constantly pricing your time is itself harmful**.

So the tool asks a plain question instead: *what would someone have to pay you
to spend an hour of your free time on this?* It ends in a **line to keep**:
"My line for an hour of the weekly shop: £15. I'll pay up to £15 an hour to
skip it, and I won't spend the hour to save less." The point of pricing the
hour once is to stop pricing it. For recurring trades it hands off to `/rule`.
That gives the tool and the essay one coherent message rather than "be more
economically rational".

## What I built

**`/worth`, "Is It Worth the Time?"** (short name: "Time for money").

- **Inputs**: the trade, its direction (pay money to save time / spend time
  to save money), the money and the time each with a period (once, a day, each
  working day, a week, a month, a year), the optional full price, what the hour
  would be spent doing, your price for that hour, and which is tighter right
  now (time / money / neither).
- **Math** (`app/data/worth.ts`, pure): both sides go to per-year totals, then
  rate = money / hours, compared with your line. Mixed one-off/recurring is
  counted over one year, with a note that a durable purchase comes out cheaper.
- **Reads, checked in order**:
  1. **"Too small to weigh. Pick either."** The yearly gap between the options
     is worth less than 15 minutes of your time.
  2. **Close** (rate within ×0.8–×1.25 of your line). The arithmetic can't
     separate them, so the tighter resource decides. The headline changes
     with the answer, e.g. "Close. Buy the time: it's the tighter one."
  3. **"Buy the time."** / **"Keep the money."** (paying) or
     **"Worth your time."** / **"Not worth your time."** (saving).
- **"Watch the percentage."** If a full price is given, it flags relative
  thinking only when it pushes *against* the read. A big share of a cheap
  thing ("33% off sounds like a lot. It's still £5… Would you do the same for
  £5 off something costing £125?") or a small share of a dear one ("It's only
  3% of the price… It's still $300").
- **A rate strip**: a log-scale bar with your line in the middle, the close
  band shaded, and the trade as a dot. It's `aria-hidden`, because the sentence
  below says the same thing.
- **Commute note**: when the trade mentions commuting and the read is "not
  worth it", it cites the DRM ranking and Stutzer & Frey.
- **Line to keep**, plus "Copy your line" and "Copy the whole read as text".
- Handoffs: `/rule` (any settled recurring trade), `/compare` (keep/not
  worth with yearly money ≥ 40 hours of your line, so likely part of a
  move or job), `/act` (one-off buy), `/doors` (trivial).
- House conventions: `AnnounceAnswer`, `aria-pressed` chips, labelled
  period selects, fields that say under themselves when they can't parse
  (money accepts `£40`, `$1,200`, `12,50`, `1.5k`; hours reuse `/later`'s
  parser), carried subject, `ClearCallButton`, and a read-only worked example
  (a cheaper flat: £250/month for 50 min/workday works out at £15.65 an hour
  to commute against a £20 line, so "Not worth your time").
  The currency comes from whatever symbol the person types (default £).
- **No share link**: it's a personal price, not a shared call.

**Wired in**: `tools.ts` (deciding-now, after later), the router (`triage.ts`,
new "time-money" choice under "It's the options themselves", then `/rule`),
the playbook (new `time-or-money` situation in "There's a number in it"), a
new **Relative Thinking** model, the search index, the sitemap, and the backup
registry (`worth:v1`, subject `what`).

**Essay: "An Hour Has a Price, Whether You Set It or Not"** (stakes group, next
to `money-math`). It covers the calculator, why time makes it worse, the one
division, your price for an hour (not your wage, take-home pay, the commute),
that most people under-buy time (with honest caveats), setting the line once
(DeVoe & House), and three limits (close, trivial, part of something bigger).

**`/now`**: new lead bullet, oldest (blind round) dropped. `SITE_UPDATED` is
now October 11.

## How I verified it

- `bun install` (the container had no `node_modules`), then `bun run lint`,
  `bunx tsc --noEmit` and `bun run build` are all clean.
- A scratch script checked every read (trivial, close × each lean, buy, keep,
  worth, notworth), `parseMoney` (symbols, thousands commas, decimal comma,
  `k`, junk, negatives), defensive parsing, `formatMoney`, relative notes in
  both directions, mixed periods, and the summary.
- **A wording bug caught there**: the line rule read "My line for an hour of
  take the cheaper flat further out". It now uses a separate "what would the
  hour be spent doing?" field, falling back to "an hour like this".
- Headless Chromium (global `playwright`) at 375×812 against `next start`:
  - The carried `?subject=` seeded the field and the URL was cleaned.
  - The bad-hours hint showed.
  - The live region said "Not worth your time." and then "Close. Buy the time:
    it's the tighter one." It stayed silent after a reload, with state kept.
  - The relative note fired on £5 / £15.
  - The `/rule` handoff appeared for the weekly trade.
  - scrollWidth was 375, and there were no page errors.
  - Search for "worth my time", "grocery delivery", "commute cheaper rent",
    "pay a cleaner" and "drive across town" all put `/worth` first.
  - `/find` → make the call → "One option costs more money…" leads to `/worth`.
  - `/tools`, `/playbook`, `/models`, `/now`, `/writing`, the essay and the
    sitemap all show it.
- **Not done**: a real screen reader, a real phone, and the copy buttons (no
  clipboard in headless).

## Calls I'd defend

- **Ask the price of the hour, not the wage.** It's harder to answer, but it's
  the right number, and the help text says why.
- **The output is a line, not a verdict.** DeVoe & House make "price every
  hour" actively bad advice. Setting the number once is the remedy.
- **The relative note only speaks when it pushes against the read.** A note
  agreeing with the answer is noise, and the bias matters when it's winning.
- **"Too small to weigh" comes first.** For most small trades the honest
  answer is that the deliberation costs more than the difference.
- **Close is decided by scarcity, not more maths.** Whillans' time-poverty
  framing, and it avoids pretending the line is precise to ±20%.

## What I ruled out

- **A full commute/move calculator** (fuel, fares, rent, tax). `/compare` exists
  for multi-factor moves, and the core error is the unit, not missing costs.
- **Inferring a "value of time" from income.** That's the wage fallacy again,
  and the tool would be priming people to monetise their time.
- **A "buy back your time" self-help framing.** The tool is neutral: about
  half its reads say keep the money or skip the saving.

## Left for later

- **One-off purchases that save time for years** (a dishwasher, a robot
  vacuum) currently count over one year with a note. A "lasts N years" field
  would make them exact.
- **`/rule` could receive the line** (carry the rule text), not just the
  subject.
- **The walk-away tool's "non-price" adjustment** could link here when the
  difference is a commute.
- Carried from earlier: `/rule` → `/later` link, link `a-number-appears` →
  `/walkaway`, `/round` duplicate dots, trainers' reveal focus, the journal's
  "Mark reviewed", a real screen-reader pass, and `/crux` values → `/par`.
