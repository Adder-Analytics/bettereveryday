# Session Notes — October 9, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. The last two sessions each found a moment the kit
didn't cover (a group agreeing on a number, two options on a par). Today I
went looking for another, and checked the playbook against the tools to see
which situations still had no instrument behind them.

## What I noticed

The playbook's **"Someone just put a number in front of you"** (a salary
offer, an asking price, a quote) is one of the most common real moments on the
whole site, and it had no tool. The anchoring essay and model said "set your
own number first", but nothing helped you do it. Grepping for BATNA, walk-away
and negotiation found only stray mentions. The commonest form of that moment
is **a negotiation**: a job offer, a raise, a car, a house, a freelance rate.
The usual mistake there isn't a bad tactic. It's walking in without a line,
so the line gets drawn in the room. It's frequent, it's distinct (not a
variant of `/round`, `/incentives` or `/compare`), and it ends in a clear
answer. So it passed the "curated, not exhaustive" bar.

## Outside reading

Search worked and page fetches mostly didn't, so I read through summaries
(PON Harvard, Columbia Business School, APS, Kellogg, SSRN abstracts):

- **Fisher & Ury, *Getting to Yes* (1981)**: the BATNA. The point I
  carried into the copy (via Hiro Aragaki's teaching note) is that **a BATNA
  is a course of action, not a number**. The tool asks "If there's no deal,
  I'll…" before it asks what that's worth.
- **Malhotra & Bazerman, *Negotiation Genius* (2007)**: turn the BATNA into a
  **reservation value**, adjusted for what this deal offers beyond the number,
  and estimate the other side's too, to find whether a zone of agreement
  exists.
- **Tuncel, Mislin, Kesebir & Pinkley, "Agreement Attraction and Impasse
  Aversion", *Psychological Science* 27(3), 2016**: people chose a worse
  option more often when it was labelled "Agreement", avoided a better one
  labelled "Impasse", and a substantial share agreed to deals worse than their
  BATNA face to face. **Impasse aversion was the stronger pull.** That's the
  whole case for setting the line beforehand, and it became the card's
  in-the-room question.
- **Galinsky & Mussweiler (JPSP 2001)**: first offers predict settlements.
  Galinsky's own caveat: when the other side knows much more, going first
  can hurt. The tool's "who knows more?" question is that caveat.
- **Mason, Lee, Wiley & Ames (JESP 2013)**: precise first offers draw smaller
  counteroffers (read as knowledge). A later Lee et al. paper (2018) found
  precise list prices can deter people from starting a negotiation at all.
  That's quoted in the essay's limits.
- **Ames & Mason, "Tandem Anchoring" (JPSP 2015)**: a *bolstering* range
  (target and up) beat a point offer without relational cost, and a
  *backdown* range (target and down) lost value. Their practical note was to
  stretch 5–15%.
- Also relied on: Galinsky, Mussweiler & Medvec (2002), where focusing on
  target rather than floor gives better outcomes but lower satisfaction.

## What I built

**`/walkaway`, "Where's Your Line?"** (short name: "Walk-away").

- **Inputs, revealed step by step**: the deal; the direction (higher: I'm
  paid or selling; lower: I'm paying or buying); an optional unit; the
  alternative as an action ("If there's no deal, I'll…"), its value, and how
  real it is (in hand / likely / a hope); whether this deal is better or
  worse in other ways and by how much; a target and its reason; and,
  optionally, their likely limit, a number they've already named, and who
  knows more.
- **The walk-away point** appears as soon as it can be computed: alternative
  ± the non-price adjustment, in the right direction for buyer or seller.
  A "likely, not certain" alternative gets a note that the real line sits
  between it and the next fallback.
- **Four reads, checked in order** (`app/data/walkaway.ts`, pure):
  1. target doesn't beat the line → *"Your target is no better than your
     walk-away. Aim higher/lower."* (timid target, or an overvalued
     alternative). Hands off to `/outside`.
  2. alternative is only a hope → *"Your walk-away rests on a hope. Firm it
     up before you talk."* Hands off to `/widen`.
  3. their guessed limit is short of the line → *"There may be no deal here."*
     Look for terms beyond the number, or decide a polite no tonight.
  4. otherwise → *"Your line: no deal below £55,000. Aim for £68,000."*
     Concede in shrinking steps. Hands off to `/decide`.
- **The first number**: if they've opened, say where their number sits and
  counter from your target, not theirs. If they know more, let them open.
  Otherwise go first a little past target, as a precise figure (three
  significant figures, e.g. £71,400) or a bolstering range (target to +10%).
  Mirrored for buyers.
- **Line card**: the walk-away, with "I say 'I can't make that work' and I
  [your alternative]"; the target and its reason; and the question *"did I
  learn something about my alternative, or do I just want this to be over?"*
  It can be copied as text.
- **In the room**: type the number on the table. It reads past your line
  (no), clears it (ask once more first), or meets the target (take it and
  stop). It's announced.
- `AnnounceAnswer` from the start. `aria-pressed` chips. Number fields say
  under themselves when they can't parse input (`aria-invalid` +
  described-by). There's a read-only worked example (a salary offer: line
  £55k, target £68k, they opened at £60k). It receives the carried subject.
- **No share link, on purpose**: a walk-away is the one number you never hand
  over. That's consistent with `/now`'s sharing note (this isn't a decision
  made *with* the other side).

**Wired in**: `tools.ts` (deciding-now, after round), the router
(`triage.ts`, a new "negotiate" choice under "It's other people", then
`/decide`), the playbook (new `about-to-negotiate` situation in the people
cluster, so both front doors got it), a new **BATNA and the Walk-Away Point**
model, the search index, the sitemap, and the backup registry (`walkaway:v1`,
subject `deal`, answer-now so Clear sweeps it into history).

**Essay: "Decide Your Line Before the Room Does"** (people group on
`/writing`). It covers the two forces in the room (their number, impasse
aversion), where the line comes from, why the line isn't the goal, who goes
first, the no-deal case, and three honest limits (multi-issue deals,
conditional research, relationships). It's linked both ways via `Tool.essays`
and `Model.essays`.

**`/now`**: new lead bullet, oldest (essay-tool bridge) dropped.
`SITE_UPDATED` is now October 9.

## How I verified it

- `bun run lint`, `bunx tsc --noEmit` and `bun run build` are all clean
  (after `bun install`; the container had no node_modules).
- A scratch script covered all four reads, seller and buyer, the opening
  (named / let them / go first), the live check at, below and above the line
  and target, incomplete inputs → null, defensive parsing and `altClause`.
- **Wording bug caught there**: the live check said "£1,300 *short of* your
  target" for a buyer, whose target is *below*. Now it says "from your
  target" (and "away from" in the opening block).
- Headless Chromium at 375×812 against `next start`: the carried subject
  seeded and the URL was cleaned. The live region said each read once and
  stayed silent after reload with state kept. The no-room and live-check
  reads were announced. The bad-number hint showed. No horizontal scroll, no
  page errors. `/find` (make the call → negotiate) leads to `/walkaway`.
  Search "salary negotiation" finds the tool and essay. `/tools`, `/`,
  `/playbook`, `/models`, `/now`, `/writing`, the essay and the sitemap all
  show it.
- **Not done**: a real screen reader, a real phone, and the case where
  someone types a unit like "k" into the unit field (it'd print "55,000 k",
  ugly but true).

## Calls I'd defend

- **The alternative is asked as an action first, then as a number.**
  "What's your walk-away?" invites a gut figure. "If there's no deal,
  I'll…" makes people name the thing the number has to beat.
- **"A hope" outranks "no room".** A line built on an alternative you don't
  have is a bluff, and the fix (firm it up) comes before any reading of
  their side.
- **The target-inside read comes first**, because every later output
  (opening, room, live check) is nonsense when target and line are
  inverted.
- **Research quoted as tilts.** First-offer and precision effects are
  conditional, and the essay says so, including the counter-finding.
- **No share button.** The obvious "send to your partner" use is covered by
  handing off to `/round` (set the offer price blind together).

## What I ruled out

- **A full multi-issue negotiation planner** (issues × priorities, logrolling).
  That's real, but much heavier, and the one-number case is where most
  people actually get hurt. The essay names multi-issue trades as a limit,
  and the no-room read points at terms beyond the number.
- **Scripts/phrases for the call.** It drifts toward coaching. The tool gives
  three numbers and one sentence, and stops.
- **Giving `a-number-appears` the tool directly.** That situation also covers
  statistics in arguments. A dedicated negotiation situation is the honest
  match. Both now sit near each other in the playbook.

## Left for later

- **Link `a-number-appears` → `/walkaway`** in its anchoring move ("if it's
  an offer you're about to answer…") once I'm sure it doesn't crowd that
  situation.
- **Router placement**: "I'm about to negotiate" sits under "It's other
  people". Watch whether people look for it under "There's a number in it".
- Carried: stacking duplicate dots on `/round`'s strip, the "first number in
  the room" essay (partly covered today from the negotiation side), focus
  after the trainers' reveal, the journal's "Mark reviewed", a real
  screen-reader pass, scripting the offline check, and `/crux`'s values branch
  → `/par`.
