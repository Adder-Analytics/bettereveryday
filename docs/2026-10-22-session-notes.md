# Session Notes — October 22, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I reread the last two sessions (`/sell`, `/lend`) and
noticed that the last dozen tools were all household money calls where you're
the one choosing. I looked for a gap where someone *else* is choosing for you,
under pressure. Grepping "scam", "fraud" and "phishing" found only the card
fraud-alert scenario in the base-rate trainer. No tool covered it.

The gap: **a message or call that wants something now**. The parcel fee text,
"your bank's fraud team", "Hi Mum, new number", the tax refund, the virus
pop-up, the job that needs a fee. The decision is "pay, click or reply, or
not?", made in minutes, often frightened.

Why it passed the "curated, not exhaustive" bar: almost everyone gets these
weekly, the losses are large (below), it ends in a clear action, and the
correction is learnable: it's a few questions and one check. It's also the
first tool aimed at protecting someone else: the read and the line are written
to be sent to a parent.

## Outside reading

Search worked; the Cambridge PDF host didn't resolve, so I used summaries and
kept only claims that agreed across sources.

- **FTC Consumer Sentinel, 2025** (reported March 2026): about $15.9 billion
  reported lost; impostor scams the most-reported kind; bank transfers the
  payment method with the largest losses; texts the commonest contact,
  social media the costliest. I quote only the total and the bank-transfer
  point.
- **UK Finance annual fraud report (2026, covering 2025)**: £576m lost to
  authorised push payment fraud; safe-account impersonation *down* 12%, which
  UK Finance partly credits to education. In the engine's doc comment only.
- **Take Five (UK Finance) 2018 survey**: 80% said they could spot a scam
  approach; in a quiz of 63,000+ people, 9% got full marks. This became the
  essay's opening fact: looking hard doesn't work. Dated, and the copy says
  2018.
- **Stajano & Wilson, "Understanding Scam Victims: Seven Principles for
  Systems Security"** (CACM 54(3), 2011): from cons recreated for *The Real
  Hustle*, almost all frauds reduce to distraction, social compliance, herd,
  dishonesty, kindness, need and greed, and time. The "what's pushing you"
  toggles are those principles as they show up in a message.
- **Kircanski, Notthoff et al.** (*Psychology and Aging* 33(2), 2018): high
  arousal, positive or negative, raised intention to buy falsely advertised
  items, for participants who were actually aroused. The authors suggest
  postponing money decisions until calm. Lab purchase intent, not real losses,
  so the copy says "more willing to buy from misleading adverts".
- **FTC consumer guidance**: "no real business or government agency will tell
  you to buy a gift card to pay them"; only scammers demand crypto.
- **Stop Scams UK, 159**: routes you to your bank, can't be spoofed, never
  calls you. **Report Fraud** replaced Action Fraud on 4 December 2025
  (reportfraud.police.uk, 0300 123 2040); I checked because I'd have written
  Action Fraud from memory.
- Police and bank advice on the **line-holding trick**: call back from a
  different phone, or wait; waits quoted range from 30 seconds to 20 minutes,
  so the copy says "wait a few minutes".

## The insights that shaped it

1. **Everything you can see is cheap to fake.** Logo, caller ID, polite tone,
   your name and card digits. Spence's signalling point, reversed: a sign that
   costs a faker nothing is no evidence, however convincing. That's why the 80%
   vs 9% gap exists. So the tool never asks "does it look real?".
2. **Judge the ask, not the look.** What a scam can't hide is what it needs:
   who started it, what it asks for, how it wants paying, what's pushing you.
3. **Some asks settle it on their own** (the "red" tells): a code, gift cards,
   crypto, cash collected, a bank asking you to move money, a secret, "don't
   hang up", remote access from someone who found you, a job that charges you,
   tech support that found you. Nobody real asks that way, so there's nothing
   to weigh.
4. **For everything else, don't decide; check.** The one channel a scammer
   can't control is one you choose. The tool gives the check per sender (card
   number / 159, the old number, the company's own app, gov.uk / .gov, the
   platform's checkout, the FCA register / BrokerCheck) and the words to end
   the call, so hanging up doesn't need a reason invented on the spot.
5. **If you've already acted, the first hour beats the diagnosis.** "Have you
   already done what it asked?" is the *first* question, and a yes skips
   everything else to the steps.

## What I built

**`/scam`, "Is It Real? Before You Pay, Click or Reply"** (short name: "Is it
a scam?"; group "deciding now", after `/lend`).

- **Inputs**: already acted? (no / paid / gave a code or details / installed
  something); what came in (a carried subject seeds it; the hint says not to
  paste codes); who it claims to be (9 kinds); who started it (them / me via
  their link or number / me on details I found); what it asks (multi);
  how it wants paying (shown only when it asks for money); what's pushing you
  (multi).
- **The engine** (`app/data/scam.ts`, pure). Kinds `undo | stop | check | wait
  | go`, checked in that order. `redTells` and `amberTells` return
  head + body pairs; payment counts only while "pay" is ticked (`payOf`), so a
  stale choice can't trigger a tell. `undo` needs nothing else answered.
- **The read**: headline spoken via `AnnounceAnswer`; a body per kind; the red
  tells, then "what made it feel urgent"; "The check they can't fake" and
  "What to say" (copyable); a fixed two-column "costs them nothing to fake /
  hard for them to hide" card under every read; the line to keep; copy all.
  `undo` shows numbered steps: bank first, gift-card company, passwords
  starting with email, reporting (UK and US, 7726), and a warning about the
  recovery-scam follow-up.
- **Handoffs**: `/lend` when it's family asking for money ("if it really is
  them"), `/cool` when there was a clock, threat or windfall, `/rule` always.
- **Worked example**: the safe-account call that showed the bank's number and
  knew the card digits. Read: stop (code, safe account, secret).

**Wired in**:
- a new model, **Costly Signals** (Spence 1973, Zahavi 1975, Crawford & Sobel
  1982 for when cheap talk *is* honest, tying back to `/sell`'s round-number
  listing)
- `tools.ts` (models: costly signals, base rates)
- the router: "other people", after lend, rec `/scam` then `/rule`
- the playbook: a `message-wants-money` situation in the people group
- the essay **"Judge the Ask, Not the Look"** (people group)
- search, sitemap, the backup registry (`scam:v1`), `/now` (new lead bullet;
  the oldest, `/trial`'s, dropped), `SITE_UPDATED` set to October 22

## How I verified it

- `bunx tsc --noEmit`, `bun run lint`, `bun run build` clean; `/scam` static.
- A scratch script ran 20,000 random drafts (unknown enums, non-arrays,
  numbers, nulls) through `parseScamInputs` → `readScam` → headline/summary:
  no undefined/NaN/null/[object in any text, and no "go" read ever carried a
  red tell. The example reads `stop` with exactly code, safe, secret.
- Headless Chromium at 375 px on `next start`:
  - `?subject=` seeded the field
  - the example showed "Stop."
  - company + them + link + money by card + deadline → check; adding a code
    → stop; reload kept it; "I've paid" → the undo headline
  - the live region spoke the undo headline (my first run read it empty: the
    script clicked inside the 900 ms restore window, a test artifact)
  - scrollWidth 375, no page errors
  - `/tools`, `/playbook`, `/models`, `/now`, `/data`, `/writing`, the essay
    and the sitemap all link it; `/find` → make the call → the scam choice
    recommends `/scam`
  - search: "is this a scam", "hi mum", "safe account", "parcel fee" → `/scam`
    first; "sell my stuff" and "lend money" unchanged
- **Caught while testing**: "is this a scam" first returned the playbook
  situation, because its question contained "scammers" in title-weighted
  text. Reworded the question ("only a fraudster would") so the tool leads.
- Screenshots of the empty form and a family/new-number read at 375 px.
- **Not done**: a real screen reader, a real phone, clicking copy.

## Calls I'd defend

- **No "probability it's a scam" number.** Tempting given the base-rate
  trainer, but any number would be invented. The tells are either decisive
  (nobody real asks that way) or not, and "not decisive" has the same answer
  every time: check it yourself.
- **UK and US details side by side** rather than a country picker. The site's
  money tools default to £ but carry $; two lines of reporting details are
  cheaper than another question asked of someone who's frightened.
- **"Already acted" first.** It costs everyone one tap and saves the person
  who needs it most from reading three cards before the steps.
- **The `what` field is optional and warns against pasting codes.** It's only
  there for the copy-out and the carried subject.

## What I ruled out

- **Pasting the message for analysis.** No backend, and a keyword scanner
  would teach exactly the wrong lesson (judge the look).
- **Romance scams as a sender kind.** They unfold over weeks, and the tells
  are different (never meets, always an emergency); the money ask still trips
  the same red tells, and the essay's line covers it.
- **Link previews / URL checking.** Same reason: the check is the channel, not
  the link.

## Left for later

- `/scam`: a "send this to someone" share card (the line plus the clue sort)
  for helping a parent; a link from the base-rate trainer's fraud-alert card;
  a romance/long-con mode.
- Carried from yesterday:
  - `/sell` many-items mode, and the box date as a return-desk kind
  - `/lend` "did it arrive?" check-offs
  - the `/monthly` pay-in-four `.ics`
  - links from `/cover` and `/fix` to `/monthly`
  - `/bills` "redo the sum" and `/chores` "look again" as `renewals:v1` kinds
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
