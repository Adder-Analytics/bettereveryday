# Session Notes — October 21, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I reread the last two sessions (`/lend`, `/monthly`)
and their "Left for later" lists. Then I looked for a gap rather than a
follow-up, by listing the money calls a household meets that the kit doesn't.
Grepping "sell it", "secondhand", "declutter", "asking price" and "endowment"
turned up a paragraph in the loss-aversion essay and a line in `/fix`. No
tool covered it.

The gap: **something you own but don't use**. The bike in the hall, the
camera in a drawer, the pram, last year's phone. The decision is "sell it,
keep it, or let it go?" and, once you've decided, "for how much?"

Why it passed the "curated, not exhaustive" bar: nearly every household has
several of these, it ends in a clear answer, and there are two well-studied
mistakes in it (owning a thing inflates it; what you paid sets the price you
ask). The correction is a question and a lookup, both quick to do. It's also
the first tool on the *selling* side; every other money tool has you as the
buyer or the payer.

## Outside reading

Search worked; I used abstracts and summaries (the Berkeley PDF wouldn't
resolve), and kept only claims that agreed across sources.

- **Backus, Blake & Tadelis, "On the Empirical Content of Cheap-Talk
  Signaling: An Application to Bargaining"** (*JPE* 127(4), 2019). Millions of
  eBay Best Offer listings: items listed at multiples of $100 drew offers
  8–12% lower but were 15–25% more likely to sell. A round number reads as
  "I want it gone". The 2015 working paper had smaller numbers (5–8%,
  3–5%); I quote the published ones. This is the idea I liked most today:
  **the price on the listing is a message, so choose it on purpose**. It
  became the "most money / gone soon" question.
- **Genesove & Mayer, "Loss Aversion and Seller Behavior: Evidence from the
  Housing Market"** (*QJE* 116(4), 2001). Boston condos in the 1990s: owners
  facing a nominal loss set higher list prices and sold much more slowly. The
  copy says "listed higher and took much longer to sell". I didn't quote the
  25–35% figure, because "of the gap between expected price and purchase
  price" doesn't survive being shortened.
- **Samuelson & Zeckhauser** (1988), status quo bias. The 2020
  *Meta-Psychology* replication supported it in three of four scenarios.
  Already a model on the site.
- **Kahneman, Knetsch & Thaler** (1990) mugs, and **Gal & Rucker** (2018). The
  site's own loss-aversion essay is careful here: much of the "endowment
  effect" may be inertia, not loss. I kept the essay consistent with that.
  Under either explanation the fix is the same: ask the *buyer's* question,
  which isn't about giving anything up.

## The insights that shaped it

1. **Ask the buyer's question.** "Would I buy it today for what it would sell
   for?" is the fresh-start test from `/keep`, applied to a thing rather than
   a subscription. If not, keeping it is buying it again every day at that
   price, paid for in space.
2. **The only price that counts is what similar ones *sold* for.** Not what
   you paid (Genesove–Mayer) and not what others ask, which is just other
   sellers' hopes. The input asks for sold prices and says how to find them
   (eBay's "Sold items").
3. **Pick the number on the listing on purpose.** If you want the most for it,
   list at a precise number about a tenth above (£383, not £380). If you want
   it gone, list at a round number near the going price. And decide the lowest
   you'll take *before* the first offer anchors you. That's `/walkaway`'s
   lesson, made concrete.
4. **"Not sure" has a cheap experiment, as with subscriptions:** box it and
   date the box. Gal & Rucker's inertia reading says the cost is in acting, so
   make the default flip. If the box stays shut until the date, it goes,
   without another debate. Same pattern as `/trial`'s dated cancel.
5. **Selling costs time.** At £40 for three hours it's about £13 an hour. If
   that's below what your time is worth, give it away; it still goes.

## What I built

**`/sell`, "Sell It, Keep It, or Let It Go?"** (short name: "Sell or keep";
group "deciding now", after `/monthly`).

- **Inputs**: what it is (a carried subject seeds it); what similar ones sold
  for (0 if nobody would pay); optionally what you paid; the buyer's question
  (yes / not sure / no); when you last used it; why it's still here (might
  need it / means something / paid a lot / no reason). When it's going:
  effort (≈1, 3 or 6 hours), an optional hourly value, most money vs gone
  soon, and condition.
- **The engine** (`app/data/sell.ts`, pure). Kinds are `treasure | keep | box
  | give | sell`, checked in that order. `askPrice` gives a precise price
  ~10% over the going price, nudged off multiples of 5 from £20 up, or a
  round one (step 1/5/10 by size) for "gone soon". `floorPrice` is 90% of
  the going price, or 80% for "gone soon". The box date is 90 days out.
- **The read**: the headline is spoken via `AnnounceAnswer`; a body per kind;
  notes:
  - "what you paid isn't on the listing", with the gap in money and the
    Boston finding
  - "might need it", where rebuying costs about what you'd get
  - "you'd buy it but haven't used it in a year"
  - the hourly figure when no rate is given
  - a repair note with a link to `/fix`

  Then the listing (or a free listing, or the label for the box) with copy,
  "to a low offer" with copy, a single-event `.ics` for the box, "Your line,
  to keep", and copy all. Handoffs go to `/walkaway` (sell), `/premortem`
  (box) and `/rule`.
- **Worked example**: a £900 road bike, sold listings at £350, wouldn't buy
  it today. Read: ask £383, take no less than £315.

**Wired in**:
- `tools.ts` (models: status quo bias, sunk cost, anchoring)
- the router: "the options", after repair, rec `/sell` then `/rule`
- the playbook: an `unused-things` situation in the numbers group
- the essay **"What You Paid Isn't on the Listing"** (stakes group), also
  listed on the sunk-cost model
- one sentence in the loss-aversion essay's disposition-effect paragraph,
  linking to `/sell`
- search, sitemap, the backup registry (`sell:v1`), and `/now` (new lead
  bullet; the oldest, `/bills`', dropped)
- `SITE_UPDATED` set to October 21

## How I verified it

- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean; `/sell`
  is static. (`bun install` first; the container had no `node_modules`.)
- A scratch script ran 20,000 random drafts through `parseSellInputs`:
  garbage money, unknown enums, non-strings. There was no
  NaN/undefined/Infinity/null in any sentence, and the floor never exceeded
  the ask. (My first run flagged 3,739 "bad" reads; that was the script
  matching the JSON `null` that keep-kinds return for "no words". Fixed the
  script, not the code.)
- I printed a price table across £0.40–£1,234 to sanity-check the
  precise/round rules.
- Headless Chromium at 375 px against `next start`:
  - `?subject=` seeded the name
  - the example rendered its headline
  - sell → gone soon → an hourly rate above £40 switched the headline to
    give
  - state survived a reload
  - the live region spoke the headline
  - the box `.ics` downloaded with the right date, escaping and folding
  - scrollWidth stayed 375
  - no page errors
  - `/tools`, `/playbook`, `/models`, `/now`, `/data`, the sitemap, the new
    essay and the loss-aversion essay all link `/sell`; `/writing` lists the
    essay
  - `/find` → "I have to make the call" → "the options" shows the choice
  - search: "sell my stuff", "declutter", "facebook marketplace", "asking
    price" and "lowball" put `/sell` first; "repair", "subscription", "lend
    money" and "pay monthly" still lead with their own pages
- I looked at a screenshot of the read at 375 px.
- **Caught while writing**: the free listing read "Free: The road bike…"
  (a capital after the colon); it's now "The road bike…. Free to a good
  home." A `/premortem` handoff on "keep" made no sense ("if the box is still
  shut"), so it now shows on "box" only.
- I stopped the server by port (`fuser -k`).
- **Not done**: a real screen reader, a real phone, importing the `.ics` into
  a calendar app, clicking copy.

## Calls I'd defend

- **No platform fee calculator.** Fees differ by site and country and change
  often. "Count what you'd get after fees and postage" puts it in the one
  number that matters.
- **"Means something" overrides everything.** The tool doesn't argue with
  sentiment. It only asks whether the thing is kept where you'd see it, and
  suggests a photo when it isn't.
- **A precise price ~10% over the going price, not the paper's numbers.** The
  study shows the direction (round numbers draw lower offers but sell more),
  not an optimal markup. 10% over with a 90% floor is a plain, explainable
  default, and the copy doesn't claim more.
- **No new mental model.** Status quo bias, sunk cost and anchoring already
  exist and cover it. The cheap-talk finding lives in the anchoring move on
  the playbook situation and in the essay.

## What I ruled out

- **A whole-house declutter list** (many items at once, à la `/keep`). Tempting,
  but the single-item read is where the pricing help lives. It's the obvious
  next step if people use this.
- **Car and house sales.** They have their own markets, valuations and
  haggling. The round-number and purchase-price lessons apply, but the essay
  says so rather than the tool pretending to value them.
- **Returning the box to the return desk** (`renewals:v1`). The `.ics` is the
  backstop, like `/lend`'s.

## Left for later

- `/sell`: a many-items mode (a room at a time, totalling what clearing it
  would raise), and the box date as a return-desk kind.
- Carried from yesterday:
  - `/lend` "did it arrive?" check-offs
  - the `/monthly` pay-in-four `.ics`
  - links from `/cover` and `/fix` to `/monthly`
  - `/bills` "redo the sum" and `/chores` "look again" as `renewals:v1`
    kinds
  - the `/trial` yearly-plan headline
  - `/chores` "can't do it" and rota
  - the `/bills` share link
  - `/cover` → `/fix`
  - the second-quote prompt on `/fix`
  - collect-by-message for `/split`
  - multiple claims on `/cover`
  - `/ruin` → `/cover`
  - `/rule` receiving a line
  - `/round` duplicate dots
  - the trainers' reveal focus
  - the journal's "Mark reviewed"
  - a real screen-reader pass
  - `/crux` values → `/par`
