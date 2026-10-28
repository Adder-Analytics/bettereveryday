# Session Notes — October 28, 2026

## What I set out to do

Same brief: make the site a useful *instrument* for real people, not a
self-improvement site. I reread the last three sessions (`/deposit`, `/flight`,
`/refund`) and their "Left for later" lists. Then I looked for a gap rather
than a follow-up. Grepping "parking", "PCN" and "POPLA" found nothing outside
unrelated essay lines.

The gap: **a parking ticket, on the windscreen or as a camera letter in the
post, and you're about to pay the discount or put it in a drawer.**

Why it passed the "curated, not exhaustive" bar:
- It's very common: POPLA alone took over 107,000 appeals in its 2025 report
  year, and that's only the second stage of one of two private schemes.
- It ends in a concrete action: pay a number by a date, or send a letter.
- There's a known mistake on each side. Paying at once throws away appeals
  that would cost nothing; ignoring it is the most expensive move there is.
- The decision reduces to one sum the site can do exactly: what does losing
  cost compared with paying now?

## Outside reading

gov.uk, legislation.gov.uk and the parliament briefing host didn't resolve
from the sandbox (WebFetch failed on DNS, as in past sessions), so I worked
from search results and kept only what agreed across sources:

- **Council PCNs** (council pages: Horsham, Isle of Wight, Ipswich, Sefton,
  Sheffield, Nottingham, Brighton & Hove, Richmond; the Traffic Penalty
  Tribunal's own page): 50% discount within 14 days, 21 for camera tickets by
  post; informal challenge within 28 days. A challenge in the first 14 days
  holds or re-offers the discount at most councils, but practice differs (the
  Isle of Wight re-offers 14 days; Ipswich resets the period), so the copy
  says "most councils" and "check the notice". Notice to Owner → 28 days for
  formal representations → tribunal, free. Charge Certificate +50%, 14 days,
  then registration at the TEC; Order for Recovery → 21 days to pay or file a
  TE9 witness statement on limited grounds. London higher band A is £160/£80
  (Croydon, from April 2025).
- **Private charges**: the industry Single Code caps them at £100, £60 if paid
  within 14 days (the 40% discount), with the debt-recovery fee capped at £70.
  Appeal to the operator within 28 days; POPLA (BPA members) or the IAS (IPC
  members) within 28 days of the rejection. Re-offering the discount after an
  operator rejects is common practice; I couldn't confirm it's a code
  requirement (one operator letter called it goodwill), so the tool also shows
  the worst case.
- **The new government Private Parking Code of Practice**: laid before
  Parliament on 20 October 2026 (Hansard; LexisNexis summary), due to be
  issued around 30 November if there are no objections, in force 21 days
  later. It keeps the £100 cap, the 40% discount and the £70 fee for now, and
  adds 5-minute consideration and 10-minute grace periods. Sources conflicted
  on a £20 charge for keying errors, so I left that figure out. The page says
  the code isn't in force yet and that charges are judged under the rules on
  the day of parking.
- **Keeper liability**: Schedule 4 of the Protection of Freedoms Act 2012
  (England and Wales). The 14-day notice-to-keeper rule for camera tickets and
  the "second working day after posting" deeming rule come from my knowledge of
  paragraph 9; search confirmed the 14-day rule only through forum posts.
  Scotland: Part 8 of the Transport (Scotland) Act 2019 creates keeper
  liability, but I couldn't confirm it has commenced. The code comment says
  "as far as I could confirm".
- **POPLA outcomes**: 40% of completed appeals ended with the charge cancelled
  in the 2024 report, 42% in 2023 and 45% in 2022. I used this as a calibration
  point against the break-even, not as a promise.
- **Court**: a letter before claim gives 30 days to reply (Pre-Action Protocol
  for Debt Claims). A claim gives 14 days from service to acknowledge and 28 to
  defend. A default judgment becomes a CCJ for six years unless it's paid
  within a month. These came from forum sources and match what I know of the
  rules.

## The insight that shaped it

**Price the downside, not the odds.** People treat "should I appeal?" as a
question about their chance of winning, which nobody can answer. The
answerable question is what losing costs compared with giving in now:

- Council, inside the discount window: the discount is held, so losing costs
  what paying costs. Appealing is free.
- Council, after the Notice to Owner: the discount is gone, and
  representations and the tribunal are free. Losing costs what paying costs,
  so appealing is free.
- Private, first appeal: usually free (the discount is re-offered). The worst
  case is shown.
- Private, independent appeal: this costs the discount, so it's worth it when
  p > extra ÷ full (40% for £60 against £100). That's the Expected Value
  model's break-even `p* = R/(B+R)` in its everyday form.
- Ignoring it: the only move that always costs most.

The idea is general (fee waivers, price matches, ombudsman complaints,
renewal haggling), so it got an essay, "What Does Losing Cost?". It's
distinct from "Ask Once, in Writing" (how to ask) and "The Flip-Point" (the
threshold in the abstract): this one is about noticing when the threshold is
zero.

## What I built

**`/parking`, "Parking Ticket: Pay or Appeal?"** (short: "Parking ticket"),
in the "deciding now" group after `/deposit`.

- **Inputs**:
  - where you parked;
  - council, private, or can't tell (with how to tell from the notice);
  - London, England, Wales, Scotland or Northern Ireland;
  - windscreen or post;
  - the parking date (private tickets by post) and the date on the notice;
  - the full and early amounts (left blank: half for councils, 40% off for
    private tickets);
  - the stage (seven council stages, six private ones) and its letter date;
  - the grounds (pick several; "none" can't be combined with the others);
  - a sentence of what happened;
  - who was driving (private tickets only; never written into a letter).
- **The engine** (`app/data/parking.ts`, pure):
  - 13 kinds: `pay | challenge | appeal | wait | again | reps | tribunal |
    independent | certificate | recovery | debt | claimletter | court`.
  - The three costs (pay now, appeal and win, appeal and lose), plus `extra`,
    `extraWorst` and `breakEven`.
  - The act-by and pay-by dates. They're conservative: the date on the letter
    counts as day one.
  - The Schedule 4 late-notice check, counting working days.
  - Ground strength. The council grace period counts as strong only in
    England.
  - Letters: the council challenge, formal representations, the tribunal
    statement, the operator appeal, the POPLA/IAS statement (with the request
    for the landowner contract), and the reply to a debt collector or a
    letter before claim.
- **The read**:
  - the headline (spoken) and body;
  - a "what each choice costs" table, ending in "what trying costs", with the
    break-even under it;
  - the letter, with a copy button;
  - the discount end date and the next-step date, with an `.ics`;
  - an "if you ignore it" ladder and the evidence list;
  - the line to keep and copy-the-whole-plan;
  - handoffs to `/scam` (fake parking-fine texts) and `/rule`.
- **Worked example**: a retail-park camera letter, £100 or £60, an O keyed for
  a 0, the letter dated 15 days after the visit. The read: "Appeal by …: it
  should cost you nothing extra", with the late notice to keeper flagged.

**The essay**: "What Does Losing Cost?" (`/writing/what-does-losing-cost`), in
the "people" writing group and linked from the Expected Value model.

**Wired in**:
- `tools.ts` and its group;
- the router (other-people group);
- the playbook situation `parking-ticket` (expected value, sludge);
- search: "parking fine", "pcn appeal" and "popla" rank `/parking` first, and
  "flight delay compensation" still ranks `/flight` first;
- the sitemap;
- the backup registry (`parking:v1`);
- `/now`: a new lead item, and the oldest (`/debts`) dropped;
- `SITE_UPDATED` → October 28.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean, and
  `/parking` is static. Lint caught one dropped JSX space
  (`<strong>Penalty</strong> Charge`); `--fix` added the guard.
- A scratch script walked every stage for a council ticket (£70, signs) and a
  private one in Scotland (keeper not driving), and I read every headline,
  body and letter. Fixed from that:
  - "Dear the parking company" now reads "Dear Sir or Madam" when no name is
    given;
  - a sentence that started in lower case;
  - the council "rejected" stage after the discount had lapsed, which showed
    a 0% break-even. It now says "wait for the Notice to Owner: losing costs
    nothing extra";
  - court claims in Scotland and Northern Ireland, which got MCOL dates. They
    now say "respond by the date on the form".
- I fuzzed 50,000 random drafts through parse → read → every text function:
  - no undefined, NaN, null, Infinity or `[object`;
  - `extra` and `breakEven` always in range;
  - pay-now never above if-lose;
  - "none" never mixed with other grounds;
  - all 13 kinds occurred.
- Headless Chromium at 375 px on `next start`:
  - `?subject=` seeded the field, and the example rendered;
  - a typed-in council ticket gave the expected read and survived a reload;
  - switching the stage and the ticket type changed the read;
  - scrollWidth was 375, with no page errors;
  - `/tools`, `/playbook`, `/now` and the essay all link to it;
  - I checked a screenshot of the example by eye.
- **Not done**: a real screen reader or phone, clicking copy or opening the
  `.ics`. No lawyer has read the letters, and I couldn't read the statutes
  directly today.

## Calls I'd defend

- **The tool asks for grounds and believes the answer.** It's only useful if
  it says "just pay" when you were in the wrong, and the grounds card says so.
- **No invented odds.** The tool never estimates your chance of winning. It
  gives the break-even and one honest calibration point (POPLA, about 40%).
- **The keeper letters never name the driver, and never lie.** Writing as the
  keeper is lawful and standard. The "who was driving" answer only decides
  whether the Scotland/NI paragraph on keeper liability is used.
- **Hedged where sources disagree**: discount re-offers ("most", plus the
  worst case), the new code (not in force; the £20 figure left out), and
  Scottish keeper liability.

## Left for later

- `/parking`:
  - bank holidays in the Schedule 4 working-day count;
  - the notice-to-keeper window for windscreen tickets (28–56 days);
  - the new code's grace periods and keying-error rule, once it's in force
    (around late December 2026);
  - bus-lane and moving-traffic PCNs;
  - hire and lease cars (the hirer route).
- `/deposit`: the DPS dispute window; a check-in day checklist; joint
  tenancies.
- Carried over: the `/flight` voucher reply; energy and telecom for `/refund`;
  the `/debts` 0% end date; the `/scam` share card; `/sell` many-items; `/lend`
  check-offs; the `/monthly` pay-in-four `.ics`; a real screen-reader pass.
