# Session Notes — October 25, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I reread the last two sessions (`/scam`, `/debts`) and
the tool list. The money tools cover the moment *before* paying (`/monthly`,
`/cover`, `/trial`), the moment of being targeted (`/scam`), and what you
already owe (`/debts`). Nothing covered the moment *after* paying when it goes
wrong. Grepping "chargeback" found nothing; "complain" and "refund" only
passing lines in `/sell`, `/widen` and the renewals copy.

The gap: **something you paid for broke, never came, or was done badly, and
they're fobbing you off.** "It's the manufacturer's problem." "Take it up with
the courier." "It's out of warranty."

Why it passed the "curated, not exhaustive" bar: nearly everyone hits it a few
times a year, it ends in a concrete action (a message and a date), the money is
real, and the gap between what people do (give up) and what they're entitled
to is large and well documented. It's also a case where the site can do the
work rather than describe it: the message gets written for them.

## Outside reading

Search worked; legislation.gov.uk didn't resolve from the sandbox, so I relied
on Which?, Citizens Advice, Financial Ombudsman pages, council and law-firm
summaries, and kept only what agreed across them.

- **Consumer Rights Act 2015** (via Which?, Gowling, Gepp, Bromley Trading
  Standards). 30-day short-term right to reject; then one repair or
  replacement; then the final right to reject or a price reduction; a fault in
  the first six months is presumed present at delivery; after six months the
  burden moves to the buyer and a refund may be reduced for use; claims run six
  years (five in Scotland). **s29**: goods are at the trader's risk until in
  the consumer's possession, so a lost parcel is the shop's problem. Services:
  reasonable care and skill; repeat performance, else price reduction (up to
  100%); refunds within 14 days.
- **Consumer Contracts Regulations 2013** (Citizens Advice templates): 14 days
  after delivery to cancel distance purchases, refund within 14 days.
- **Section 75, Consumer Credit Act 1974** (Which?, MoneySuperMarket, Capital
  One): credit card company jointly liable for items £100–£30,000, deposit-only
  counts; no extra deadline. **Chargeback**: card-scheme process, not law, any
  amount, usually 120 days from purchase or due date. Paying via PayPal usually
  breaks the s75 chain.
- **Financial Ombudsman**: firms get eight weeks for a final response; six
  months to refer after it. **Small claims**: £10,000 online in England and
  Wales (Citizens Advice); letter before claim first.
- **US**: Fair Credit Billing Act, 60 days from the statement (Cornell LII,
  NerdWallet). Kept to one footnote.
- **Why people don't complain**: the TARP studies (60–80% of unhappy customers
  never complain, by industry); Kwok's thesis (UWL, 2021) on the reasons: not
  worth the time, won't work, don't know how; Huppertz's effort model.
  Goodman & Hatanaka on non-complainers' lower loyalty (not used in copy).
- **Sunstein, "Sludge Audits"** (*Behavioural Public Policy*, 2020): friction
  that costs time and wears people down; costs bigger than institutions admit
  because of scarcity. The search didn't confirm a "people abandon claims"
  finding in that paper, so the copy only uses his definition and argument and
  attributes the giving-up numbers to TARP.
- Things I'd have written from memory and checked instead: PayPal's 180-day
  window, NI and Scotland small claims at £5,000, the s75 deposit rule.

## The insights that shaped it

1. **The claim usually dies of effort, not of a no.** So the tool's job is to
   make the effort small: name the remedy, cite the law in one sentence, write
   the message, give the address it should go to (in writing, dated).
2. **One remedy, by a date.** A message without a date can be ignored forever.
   Every letter the tool writes asks for one thing and sets 14 days (the
   Citizens Advice convention), with an `.ics` for the day.
3. **Decide the next rung before sending the first message.** This is the
   site's implementation-intentions idea pointed at sludge: the evening they
   say no, you're tired and "it's not worth it" wins. The ladder is shown with
   "you're here", and the letter itself says what happens next.
4. **There's usually a way round them, and it's often better than arguing.**
   Section 75 doesn't need the shop to agree. That's why the "escalate" read
   leads with the card message and offers the seller letter as optional.
5. **The cheapest win is at the till.** The line puts anything over £100 on a
   credit card — paid off in full — so the second company exists before
   anything goes wrong. It hands off to `/rule`.

## What I built

**`/refund`, "Get Your Money Back"** (short: "Get money back"; group
"deciding now", after `/scam`).

- **Inputs**: what it is (carried subject seeds it); seller (optional); what's
  wrong (faulty, not as described, never arrived, a job done badly, changed my
  mind); where (business online, business in person, private seller); when it
  arrived / was finished / was due; price; how you paid (credit, debit,
  PayPal/Klarna/marketplace, transfer or cash); "they've already tried once";
  where it's got to (not yet, waiting, refused, gone quiet) and when you asked.
- **The engine** (`app/data/refund.ts`, pure). Window (`reject` ≤30 days,
  `early` ≤6 months, `late` ≤6 years, `old`), route (`s75` | `chargeback` |
  `platform` | `court`), kinds checked in order `policy | cancel | private |
  old | ask | wait | escalate`. Remedy and law line per problem and window;
  the seller message (first ask, or final letter naming the next step); the
  card/platform message (s75, chargeback, or claim); the ladder; the line.
- **The read**: headline (spoken), body, the messages with copy buttons, the
  reply-by or cancel-by date with `.ics`, the ladder with "you're here", a US
  footnote, the line, copy-the-whole-plan, handoffs (`/fix` when it's old and
  faulty, `/scam` when a transfer went to someone who's vanished, `/cover` for
  the next extended warranty, `/rule`).
- **Worked example**: a £449 washing machine on a credit card, failed twice,
  the shop says "manufacturer" → s75 claim. Dates are relative to today so the
  windows read the same whenever it's opened.

**Wired in**: a new model, **Sludge** (Decisions; Thaler & Sunstein, Sunstein
2020, TARP, Huppertz, tied to implementation intentions); `tools.ts`; the
router (other-people group, after scam, then `/rule`); the playbook
(`something-went-wrong`); the essay **"Ask Once, in Writing, With a Date"**;
search (placed before `/scam` so "refund" ranks the tool first), sitemap,
backup registry (`refund:v1`), `/now` (new lead bullet, oldest dropped),
`SITE_UPDATED` → October 25.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint`, `bun run build` clean; `/refund` static.
- A scratch script ran 30,000 random drafts (bad dates, Feb 30, future dates,
  non-strings, bad money) through `parseRefundInputs` → `readRefund` → every
  text function: no undefined/NaN/null/Infinity/[object; every ask/wait/
  escalate read had a valid reply-by date; s75 only ever on credit. All seven
  kinds and all four routes occurred.
- Headless Chromium at 375 px on `next start`: `?subject=` seeded the field;
  example headline; reject-window, chargeback and change-of-mind headlines;
  reload kept inputs; scrollWidth 375; no page errors; screenshots of the read
  checked by eye. `/tools`, `/playbook`, `/models`, `/now`, `/data`, the
  sitemap and the essay all link it. Search: "section 75", "refund", "faulty",
  "parcel not delivered", "chargeback", "complaint letter" → `/refund` first;
  "is this a scam", "which debt first", "lend money" unchanged.
- **Caught while testing**: "Dear the shop," (greeting now falls back to
  "Hello," for "the/a/my …"); "The parcel … The parcel hasn't arrived" (the
  problem line now says "It"); "If you don't provide the work put right…"
  (now "I'm asking again for …. If this isn't resolved by …"); a claim that
  sellers who don't settle "usually lose", which I couldn't source — removed;
  "refund" ranked `/scam` first on a tie — reordered; the reply-due row showed
  beside the card claim, where it only applied to the optional letter — hidden.
- **Not done**: a real screen reader, a real phone, clicking copy or opening
  the `.ics`; no lawyer has read the letters.

## Calls I'd defend

- **UK law with a US footnote**, not a jurisdiction switch. The UK scheme is
  one statute and tidy to encode; US rights vary by state and mostly run
  through the store's policy and card disputes. A half-built US engine would
  be worse than an honest footnote.
- **14 days for every reply-by.** It's the Citizens Advice convention, not a
  statute; one number is easier to keep than a table.
- **Chargeback by the arrival date.** The real clock starts at purchase or the
  due date; arrival is the nearest thing people know. The copy says "about".
- **Private sellers get a narrow read.** No satisfactory-quality promise, so
  "faulty" is pointed back at "was it as described?" rather than pretending.
- **No return-desk entry** for the reply date, just the `.ics`. The renewals
  store is built for trials; a second kind there was more than today needed.

## Left for later

- `/refund`: reply-by on the return desk (a `renewals:v1`-style kind, or its
  own store); flights (UK261 compensation) and energy/telecom as named sectors
  with their ombudsman; a "they offered less" counter-offer helper; a
  link from `/fix` ("is it still under the Consumer Rights Act?") and `/cover`
  ("you're already covered for six years").
- `/debts`: a 0% end date per debt; a return-desk check on the first cleared
  month; links from `/monthly` and `/ruin`.
- Carried: `/scam` share card and romance mode; `/sell` many-items; `/lend`
  check-offs; the `/monthly` pay-in-four `.ics`; `renewals:v1` kinds for
  `/bills` and `/chores`; the `/trial` yearly-plan headline; `/chores` rota;
  the `/bills` share link; the second-quote prompt on `/fix`; collect-by-message
  for `/split`; `/rule` receiving a line; a real screen-reader pass.
