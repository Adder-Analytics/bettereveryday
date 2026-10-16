# Session Notes — October 16, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. I started from the "Left for later" lists. **A chores
split** had been carried for three sessions with the same reason each time:
"it's a different fair-division problem (bads, not goods), and `/split`'s money
engine doesn't carry over cleanly. It needs its own design session." Today was
that session.

Why it passed the "curated, not exhaustive" bar: dividing housework is a
recurring call almost every household faces, for couples, flatmates and
families with teenagers. It ends in a clear answer (who owns what). It's a
well-known source of conflict, and nothing on the site touched it. `grep -i
chore` found only the fair-division model's one-word mention.

## Outside reading

Search worked. Fetches of PDFs (procaccia.info, cs.toronto.edu, arxiv.org)
failed with DNS errors, so I relied on search summaries and only used claims
that agreed across sources:

- **Ross & Sicoly, "Egocentric Biases in Availability and Attribution"**
  (*JPSP*, 1979). Five studies, including 37 married couples. People took more
  responsibility for joint work than others gave them, because their own
  contributions are more available in memory. **Note:** the popular "spouses'
  estimates sum to well over 100%" claim comes from a secondary source I
  couldn't check against the paper. The essay hedges it ("very likely") and the
  model doesn't quote a number.
- **Daminger, "The Cognitive Dimension of Household Labor"** (*ASR* 84(4),
  2019). 70 interviews with 35 couples, and four parts of cognitive labour:
  anticipating, identifying options, deciding and monitoring. Women did more,
  especially anticipating and monitoring. Decision-making was roughly equal.
  The work is often unseen. This produced the "remembering" chips.
- **Spliddit's chores/tasks app.** As far as summaries say, it solves an LP for
  a fractional *egalitarian-equivalent* (equitable) allocation, then samples a
  whole-chore allocation. I couldn't see the input form, so the copy describes
  its idea (each person says what a task costs *them*; equally fair to everyone
  by their own measure) and not its interface.
- **Pew, "Modern Marriage"** (2007). 62% of US adults rated sharing household
  chores very important to a successful marriage (47% in 1990), third of nine
  items. Pew's own page confirms both figures.
- **Perceived fairness research** (a German panel from 2023, *PLoS ONE* 2019,
  an Italian sample of 404 couples). Perceived fairness often tracks
  satisfaction more than the actual split does, but it's conditional (gender,
  life stage, attitudes). **Kept out of the copy**: it's too mixed to state
  cleanly, though it supports the design choice of measuring fairness by each
  person's own count.

## The insights that shaped it

1. **The counting argument can't be won, so don't have it.** Overclaiming is
   honest and runs in the same direction for everyone. The tool's first move
   is one list instead of two memories, and the remembering goes on the list.
2. **Chores are easier to split than rent, because people mind different
   ones.** With goods, envy-freeness needs prices. With bads rated per person,
   giving each chore to whoever minds it least lets *everyone* come in under an
   even share as they each count it. In the worked example each does under a
   third. That gain from trade is the tool's headline, and it's a much better
   conversation than "who does more".
3. **Normalise each person's share by their own total.** A share is
   (time × own weight on owned chores) ÷ (time × own weight on all chores). This
   makes the method immune to the obvious game: rating everything "hate it"
   changes nothing, and only the *ranking* counts. The tool says so on the
   page, because it's also what makes people willing to be honest.
4. **Owning, not helping.** From Daminger: "just ask me and I'll do it" leaves
   the noticing with the other person. The line to keep says "every chore has
   one owner, who notices when it's due".

## What I built

**`/chores`, "Who Does Which Chore?"** (short name: "Chores").

- **Who's sharing**: 2–5 names (add/remove; focus moves to a new name).
- **List them all**: tap-to-add chips for the usual chores, plus dashed chips
  for the remembering ("Meal planning", "Noticing what's run out", "Bills and
  admin", "Birthdays and presents", "Booking repairs and appointments"). A chip
  fills an untouched blank card first, then focus jumps to its time field.
- **One card per chore** (max 15): name; a rough time a week (parses "45",
  "1h", "1h 30m", "1.5 hours", "2:15"); for each person "Happy to / Fine /
  Rather not / Hate it" (×0.5/1/2/3; unrated = fine, and the read says how
  many are blank); "take turns on this one"; and an optional "who does it now?"
  (a person or Shared).
- **The engine** (`app/data/chores.ts`, pure): branch and bound over whole
  chores, biggest first, from a greedy start. It minimises the largest share,
  then the total of shares. The bounds are the current max and (current sum +
  cheapest remaining) ÷ n, which makes the all-identical-ratings worst case
  (5 people × 15 chores) prune immediately. It has a step limit, and an `exact`
  flag records whether it was hit (never hit in testing).
- **The read**: the headline is spoken via `AnnounceAnswer` ("Each of you does
  at most 30% of the housework, as you each count it." or "Whole chores won't
  split evenly here: Jo ends up with 69%…"). Then:
  - a why line (under an even share because you mind different things; or
    even; or not even, plus the one chore whose turns would help most, found by
    re-running with each chore turned)
  - per-person cards with a share bar marked at the even share (aria-hidden),
    minutes a week and the chores they own
  - now-vs-after by the clock
  - an envy check ("would rather have X's list, by their own ratings")
  - the line to keep, copy line / copy split
  - handoffs to `/worth` (pay someone), `/crux` (one chore stuck) and `/split`
- **Worked example**: Alex and Sam. Alex did 82% of the 9h 55m. After the
  split it's 4h 53m vs 5h 3m by the clock, and each is under a third as they
  count it, with the bathroom taken in turns.

**Wired in**:
- `tools.ts` (deciding-now, after split)
- router: a new `chores` choice under "Other people", then `/crux`
- playbook: a new `sharing-chores` situation in the people group
- a new **Egocentric Bias (Overclaiming)** model, and a chores paragraph
  added to Envy-Free Division
- search index, sitemap, and backup registry (`chores:v1`, subject "Chores:
  Alex, Sam (8 chores)")

**Essay: "Trade the Chores You Mind"** (people group, after
`price-the-rooms-not-the-people`).

**`/now`**: new lead bullet, oldest (`/split`'s) dropped. `SITE_UPDATED` is now
October 16.

## How I verified it

- `bun run lint`, `bunx tsc --noEmit` and `bun run build` are clean (`/chores`
  is static). Lint caught one entity-space drop (`{" "}` added by `--fix`).
- A scratch script ran the worked example and the minutes parser, plus **400
  random households** (2–5 people, 1–15 chores, random ratings, turns and
  now). The slowest read took 10 ms, the step limit was never hit, and no
  sentence contained NaN/undefined/Infinity. The all-identical 5×15 case took
  under 1 ms. The parser also handled malformed stores: an id of "shared",
  ratings for unknown people, and a "now" pointing at nobody.
- Headless Chromium at 375 px against `next start`:
  - scrollWidth stayed 375 with the example open and with three cards
  - the live region spoke the headline
  - state survived a reload
  - focus moved correctly after chip-add, add-chore and add-person
  - no page errors
  - search for "chores" puts the essay first; "housework", "mental load" and
    "chore rota" put `/chores` first; "who does more" puts the playbook
    situation first
  - the router's "Other people" branch shows the new choice and links to
    `/chores`
  - `/tools`, `/playbook`, `/models`, `/now`, the essay, `/data` and the
    sitemap all include it
- **Caught in testing**: the first chip filled the blank card (row count
  unchanged), so the focus effect keyed on `chores.length` never fired, and the
  typed time went nowhere. The effect now keys on `inp`.
- **Process note**: `pkill -f "next start"` inside a compound command killed
  the shell itself (exit 144), because the pattern matched its own command
  line. Run it on its own.
- **Not done**: a real screen reader, a real phone, clicking copy.

## Calls I'd defend

- **Minimax of own-normalised shares, not equal minutes.** Equal minutes
  throws away the gain from trade. Minutes are still shown per person, so a
  household that wants equal clock time can see it and adjust.
- **Open ratings on one screen, not pass-the-phone.** `/split` hides prices
  because money invites strategy. Here normalisation removes the main
  strategic lever, and the conversation is half the value. The copy still
  suggests each person rate before hearing the others.
- **A 4-step geometric-ish scale (½, 1, 2, 3).** It's coarse on purpose: it
  can be answered in a second per chore per person. "Hate it" counting six
  times "happy to" is stated on the page.
- **Whole chores, with turns as the user's choice plus one suggestion.** A
  fractional LP like Spliddit's would always reach equitable, but "do 37% of
  the cooking" isn't something a household can run. Turns are the fractions
  people actually use.

## What I ruled out

- **Unequal target shares** (one person works longer paid hours, is away half
  the week). It's real, but it needs a defensible way to set the weights, and
  that's an argument the tool would be taking sides in.
- **"Can't do it" ratings** (no licence for the big shop). It's easy in the
  engine (infinite weight), but turns among a subset complicate the copy.
  Left for later.
- **Preset times per chore.** They vary too much by household.
- **Children's chores / pocket money.** It's a different design (ability,
  teaching).

## Left for later

- `/chores`: a "can't do it" rating; unequal target shares; an `.ics`
  "look again in a month" reminder (the kit has `ics.ts`); a rota view for
  turns (whose week it is).
- Carried: `/keep` → calendar and free-trial mode, `/cover` → `/fix`, a
  second-quote prompt on `/fix`, collect-by-message for `/split`, multiple
  claims per term on `/cover`, `/ruin` → `/cover`, the dishwasher-lifetime
  field on `/worth`, `/rule` receiving a line, `/rule` → `/later`,
  `a-number-appears` → `/walkaway`, `/round` duplicate dots, trainers' reveal
  focus, the journal's "Mark reviewed", a real screen-reader pass, and `/crux`
  values → `/par`.
