# Session Notes — October 15, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. Same method as recent sessions. I listed common money
calls and grepped the tools, playbook and essays for each one ("subscription",
"rent or buy", "pay off", "overpay", "chore", "gift", "unit price", "move
house").

## What I noticed

**Subscriptions** had nothing. The word appeared twice, both times inside the
Arkes & Blumer theatre-subscription example of the sunk cost. Yet "should I
cancel this?" is probably the commonest recurring money call there is. Almost
everyone has a gym, a streaming service, an app or a yearly membership that
renews itself. It ends in a clear answer per item. It isn't a variant of
`/quit` (years sunk in a project), `/worth` (time against money) or `/fix`
(a one-off repair), though it borrows from all three. It passed the "curated,
not exhaustive" bar.

The other gaps I considered and passed over today:

- **Pay off debt or save/invest.** Too country- and product-specific, and
  close to regulated financial advice.
- **A chores split.** Carried for two sessions now. It's a different
  fair-division problem (bads, not goods), and housemates don't pay each
  other for chores, so `/split`'s money engine doesn't carry over cleanly.
  It needs its own design session.

## Outside reading

Search worked. I read abstracts and summaries, and used only claims that
agreed across sources:

- **DellaVigna & Malmendier, "Paying Not to Go to the Gym"** (*AER* 96(3),
  2006). 7,752 members of three US gyms over three years. People on monthly
  contracts over $70 went 4.3 times a month, paying over $17 a visit against
  $10 on a ten-visit pass. Monthly members were also slower to leave. The
  leading explanation is overconfidence about future self-control. **Note:**
  the 2002 working paper ("Overestimating Self-Control") has different numbers
  (7,978 members, 4.8 visits, $700 forgone), and some secondary sources quote
  those. The copy uses the published figures only.
- **Lambrecht & Skiera, "Paying Too Much and Being Happy About It"** (*JMR*
  43, 2006). The flat-rate bias is more common and more persistent than the
  reverse. They give four causes: insurance, taxi meter, convenience and
  overestimation. I couldn't see the effect sizes, so the copy gives none.
- **Samuelson & Zeckhauser, "Status Quo Bias in Decision Making"** (*J. Risk
  and Uncertainty* 1, 1988). The site had no status-quo-bias model, though
  three essays mention it in passing.
- **C+R Research survey (2022)**, syndicated widely. 1,000 US adults. Their
  quick guess at monthly subscription spending was about $133 below their
  careful count. It's a single survey, and it compared a guess with a count,
  not with bank records. The essay says both of those things, and the tool
  doesn't cite it.
- **UK DMCC Act subscription regime**: reminder notices and easier
  cancellation. Commencement has slipped repeatedly: spring 2026, then autumn
  2026, now spring 2027 per the April 2026 government response. **I kept all
  legal claims out of the copy.** The dates move, and the advice holds either
  way.

## The insight that shaped it

**Cancelling a subscription is usually a two-way door, and that changes what
"not sure" should mean.** For most decisions, "not sure" is a reason to wait.
Here, waiting means paying again, and cancelling is a cheap experiment you can
undo in a minute at the same price. So the honest default for "not sure" is
*cancel and see if you miss it*. The exception is when leaving loses something
you can't buy back (a grandfathered price, history, a place in a queue). That
turns into "keep it, name the price, set a date". Yearly subscriptions make
the experiment free: turning off renewal costs nothing until the date.

Second insight: **the fresh-start question works by moving the reference
point.** "Should I cancel?" is coded as a loss. "Would I sign up today, at
this price?" is coded as a purchase. It's the same decision with the status
quo taken out. That's the whole tool's spine, and it's the move that answers
both status quo bias and loss aversion.

Third: **replace the forecast with a record.** DellaVigna & Malmendier is a
story about forecasts. So the uses field asks for *last month, counted*, and
its help text says the month you meant to have doesn't count. Where a
pay-as-you-go price exists, the sum settles it before any judgment is needed.

## What I built

**`/keep`, "Still Worth Paying For?"** (short name: "Keep or cancel").

- **"First, find them all"**: three places to look. Two months of statements;
  the phone's app-store subscriptions page (charges often show under the
  store's name); and email for "renewal", "receipt" and "your trial", because
  yearly ones won't show on two months of statements.
- **One card per subscription** (up to 15; add and remove; focus moves into a
  new row's name): name, price, billed monthly/yearly/weekly, uses last month
  (optional, counted), and what one use would cost without it (optional).
- **Per-row read** (`app/data/keep.ts`, pure), shown under each card, checked
  in this order:
  - **payg**: paying per use for last month's uses costs less. Cancel and pay
    as you go, with the yearly saving.
  - Then the fresh-start question with the price in it:
    - **keep** (yes)
    - **cancel** (no; "turn off the renewal now" for yearly ones)
    - **test** (not sure, easy to rejoin: cancel and see if you miss it)
    - **hold** (not sure, would lose something: keep, name the yearly price
      of holding on, set a date)
    - **open** (unanswered)
  - If rejoin is still unanswered, "test" is worded conditionally ("If you
    can rejoin…").
- **The read over the list**: a headline ("Cancelling 3 of them would free
  £483 a year."), spoken via `AnnounceAnswer`. It also has a spend bar
  (aria-hidden), the totals sentence, the rows sorted by yearly cost, and a
  "diary date a month from today" note when any are test/hold. A line to keep,
  copy line / copy list, and handoffs to `/tripwire` (when any are
  test/hold), `/worth` and `/rule`.
- **Worked example** (read-only): gym £45 with 3 uses and £8 drop-ins (pay as
  you go, £252/yr), a second streaming service (test), a £99/yr news site
  (cancel, turn off renewal) and photo storage (keep). Total £801/yr, £483
  freed. I deliberately wrote the ending as "went about as often on
  drop-ins". My first draft said "more often", which the taxi-meter effect
  argues against.

**Wired in**:
- `tools.ts` (deciding-now, after fix)
- router: a new `subscriptions` choice under "The options", then `/rule`
- playbook: a new `subscriptions` situation in the numbers group, using
  status quo bias, reversibility and base rates
- a new **Status Quo Bias** model
- search index, sitemap, and backup registry (`keep:v1`). It's the first
  list-shaped store with a custom subject: "Subscriptions: Gym, Netflix and 2
  more".

**Essay: "The Subscription You Wouldn't Buy Today"** (stakes group, after
`what-the-repair-has-to-buy`). It covers the three pulls, the C+R gap
(hedged), counting uses rather than plans, the fresh-start question, "cancel
and see" with its exception, and the once-a-year rule.

**`/now`**: new lead bullet, oldest (`/worth`) dropped. `SITE_UPDATED` is now
October 15.

## How I verified it

- `bun run lint`, `bunx tsc --noEmit` and `bun run build` are clean (`/keep`
  prerendered static). Dependencies weren't installed at the start of the
  session; `bun install` fixed that.
- A scratch script ran the worked example, the headline states (one row,
  all open, keep-all, mixed) and the parser (duplicate ids, bad period). It
  also ran **5,000 random lists** of 1–6 rows across all periods and answers.
  No NaN/undefined/Infinity appeared in any sentence.
- Headless Chromium at 375 px against `next start`:
  - the carried `?subject=` seeded the first row's name
  - "Add another" moved focus to the new name field
  - the live region spoke "Cancelling 3 of them would free £483 a year."
  - scrollWidth stayed 375 with three rows and with the example open
  - state survived a reload
  - no page errors
  - search for "cancel subscription", "gym membership", "free trial" and
    "netflix" puts `/keep` first ("status quo" puts the model first, `/keep`
    second)
  - `/tools`, `/playbook`, `/models`, `/now`, the essay, the sitemap and
    `/data` all show it
- **Caught from the screenshot**: the three-option chips stacked one per line
  on a phone, which made each card very tall. Three-option rows now stay side
  by side at all widths, and "Yes, today" became "Yes" so it doesn't wrap.
  Also caught: "not sure" with rejoin unanswered asserted rejoining was easy.
  It's now conditional.
- **Process note**: an old `next start` left on the port after a rebuild
  served stale chunks, and the page failed to hydrate in the test. Kill the
  old server before re-testing.
- **Not done**: a real screen reader, a real phone, clicking copy.

## Calls I'd defend

- **"Not sure" + easy to rejoin → cancel.** This is the opinionated core.
  It's justified by reversibility: the experiment costs a minute, and staying
  costs money every month.
- **A list, not one subscription at a time.** The finding that matters (the
  C+R gap) is about the total, and people audit subscriptions in one sitting.
  Per-row verdicts stay visible under each card, so it still works for one.
- **Last month's uses, not "typical" uses.** A forecast is exactly what
  DellaVigna & Malmendier show to be biased. One month can mislead for
  seasonal things, and the copy says to count again next month.
- **No legal or cancellation-rights copy.** It varies by country and the UK
  regime keeps moving. The tool's advice is true whatever the law is.
- **Pay-as-you-go beats the fresh-start answer.** If the sum says per-use is
  cheaper for the same use, a "yes I'd sign up" doesn't rescue it. The copy
  says to recount if you'd really use it more.

## What I ruled out

- **An "intended uses" field** next to actual uses. Showing the gap would be
  vivid, but it invites people to enter the hopeful number where it counts.
- **Pre-filled common services and prices.** Prices date fast and vary by
  country.
- **Bank-statement upload/parsing.** It breaks the local-only promise in
  spirit, even if done client-side, and it's a big build.
- **Household sharing** (who pays which subscription). Better as a later
  `/split`-style feature if anyone needs it.

## Left for later

- **`/keep` → calendar**: an `.ics` reminder for the "test" date and a yearly
  review (the kit already has `ics.ts`).
- **Free-trial mode**: a trial is a subscription with a known end date. Set
  the cancel-by date as you sign up.
- **A chores split** (see above). It needs a non-money design.
- Carried: `/cover` → `/fix` for out-of-warranty things, a second-quote prompt
  on `/fix`, collect-by-message for `/split`, multiple claims per term on
  `/cover`, `/ruin` → `/cover`, the dishwasher-lifetime field on `/worth`,
  `/rule` receiving a line, `/rule` → `/later`, `a-number-appears` →
  `/walkaway`, `/round` duplicate dots, trainers' reveal focus, the journal's
  "Mark reviewed", a real screen-reader pass, and `/crux` values → `/par`.
