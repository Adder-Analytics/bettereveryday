# Session Notes — October 7, 2026

## What I set out to do

The directive is the same as always: make this a useful *instrument* for real
people, not a self-improvement site. The last week was all polish (live
regions, focus, essay bridges, word-gluing). That work was worth doing, but
polish has diminishing returns. Today I wanted to look for a **moment a real
person lands in that the kit doesn't cover at all**, and only build if it
passed the "curated, not exhaustive" bar on `/now`.

## Outside reading

Fetching reading sites is still blocked, but search worked. What I read:

- **Kahneman, Sibony & Sunstein, *Noise*, on "decision hygiene"**: aggregate
  *independent* judgments, and use **estimate–talk–estimate**. Everyone
  estimates privately, then each explains, then each re-estimates privately,
  and the second round is aggregated. This removes the noise of who speaks
  first, who speaks loudest, and information cascades.
- **Annie Duke**: opinions are infectious, so collect them *before* the
  meeting. "Convey, don't convince."
- **Planning poker**: the simultaneous reveal exists only to beat anchoring.
  The line that stuck was *"when estimates spread widely, the spread itself is
  the finding"*. It usually means people are picturing different scope or a
  different idea of "done".
- Background I already knew and relied on: Galton's 1906 ox-weighing crowd
  (median 1,207 lb against a true 1,198 lb), Surowiecki's independence
  condition, and Lorenz et al. (PNAS 2011) on social influence narrowing the
  spread without improving accuracy.

## What I noticed

Every tool in the kit is for one person deciding, with two exceptions.
`/crux` handles two people deadlocked. The pre-mortem has a group mode for
imagining failure independently. Nothing covered **the most common group
decision there is: a team, a family or partners who have to agree on one
number.** A launch date for the client, a renovation budget, a price to offer
on a house, the odds a plan works. In the usual meeting the first number said
becomes everyone's number. That's a distinct moment, it's frequent, it isn't
a variant of any existing tool, and `/now` had literally said the next
multi-person instrument "should ship shareable, not have sharing bolted on
later". So it passed the bar.

## What I built

**`/round`, "Before Anyone Speaks"** (short name: "Blind round").

- **Setup**: the question (worded so the answer is one number), an optional
  unit, and the people (2–20).
- **Round one, pass the device**: each person taps "I'm Ana — my turn", types
  a number and one line on why, and taps "Lock it in and hide it". Answers
  are never shown before the reveal. "Redo" clears an answer *without*
  showing it. Numbers parse the way people type them (`1,200`, `$4.5k`,
  `70%`).
- **Round one, by message**: the organizer copies an invite link (question,
  unit and round only). Each person answers on their own screen and gets a
  reply link, with explicit instructions to send it *to the organizer alone,
  not the group thread*, because a number posted in the thread anchors
  everyone who answers after. The organizer pastes any number of replies in
  one go. They're matched by name, fill unnamed seats, and stay hidden. If the
  organizer clicks a reply link instead of pasting it, it's taken in on load.
  Both modes can be mixed in one round. Everything rides in the fragment
  (`share.ts`), so no server sees it. I added `decodeShareToken` to
  `share.ts` for pasted tokens, and `readShare` now uses it.
- **Reveal**: everything at once, as a dot strip with the middle marked
  (decorative, `aria-hidden`), plus the list with reasons. The spread is read
  by plain thresholds in `app/data/round.ts`:
  - within a fifth of the middle: *"You already agree."* Take the median and
    stop, because more talk only adds noise.
  - moderately apart: *"Close — talk briefly, then settle it."*
  - two-thirds apart or more, or the high at double the low: *"You're not
    estimating the same thing."* This is the finding.
  - For the last two, a **"Who speaks first"** box names the lowest and the
    highest person (they say what they were *counting*). Everyone else asks
    "what are you including that I left out?" The most senior person speaks
    last.
- **Round two**: everyone answers again privately, and is reminded of their
  own first answer. The headline becomes *"The group's number: 9 weeks."* or
  *"Still far apart after hearing each other."* (which routes to `/crux`).
  The tool also notes whether talking narrowed or widened the spread.
  `collapsedOnto()` flags a second round where everyone moved to one
  person's first answer and that person didn't move: persuasion or deference?
- **Handoffs**: `/outside` for a timeline or budget (a room shares its
  optimism), `/weigh` for a probability, `/decide` to log it. There's also a
  plain-text "Copy the result as text" for meeting notes, plus Print.
- **Accessibility**, done from the start this time: `AnnounceAnswer` speaks
  "Locked in. Hand the device to Dev." and each reveal headline. Focus moves
  to the round heading after a lock (the form that held focus unmounts) and
  to the reveal heading on reveal. The invite view scrolls to and focuses its
  question, because an invitee came to answer, not to read the intro.
- A read-only **worked example**: a website launch. Ana, Ben, Chloe and Dev
  answer 3, 4, 4 and 10 weeks. Dev, the newest person, knew about the
  client's legal review. Round two gives 8, 9, 9, 10, so the group's number
  is 9.

**Wired into everything that lists tools**: `tools.ts` (deciding-now group,
after crux), the router (`triage.ts`, a new "group-number" choice in "It's
other people", handing off to `/outside`), the playbook (`situations.ts`, a
new "group-needs-a-number" situation in the people cluster, so **both front
doors got it at once**, as `/now` asks), a new **Independent Judgments**
model in `models.ts` (Decisions), the search index, the sitemap, and the
backup registry (`portable.ts`, key `round:v1`, subject `question`).

**`/now`**: new lead bullet, oldest dropped. The peer-sharing bullet in
"Still open" now says the blind round is the first tool built multi-person
from the start. `SITE_UPDATED` is now October 7.

## How I verified it

- `bun run lint`, `bunx tsc --noEmit` and `bun run build` are all clean.
- A scratch script checked `parseNumber`, `roundStats` (3/4/4/10 → wide,
  middle 4, ratio 3.33; 8/9/9/10 → some; 9/10/11 → tight) and `collapsedOnto`.
- Headless Chromium against `next start` at 375×812, as a full
  end-to-end run:
  - Ana, Ben and Chloe answered by passing the device, and Dev answered by
    message (invite, then the reply page in a second tab, then the link
    pasted inside surrounding chat text). The note read "Added an answer
    from dev, still hidden", and the name matched case-insensitively.
  - Nothing leaked before the reveal (a reason string wasn't in the page
    text).
  - Focus after each lock: "Round one — everyone answers privately". Focus on
    reveal: "Round one, revealed".
  - Live region: "Locked in. Hand the device to Dev." → "Round one: You're not
    estimating the same thing. The middle is 4 weeks." → "Round two: The
    group's number: 9 weeks."
  - The copied text summary was correct. After a reload it stayed silent and
    kept its state. No page errors.
  - Sweep: the tool appears on `/tools`, `/`, `/playbook`, `/models`, `/now`
    and in search ("planning poker"), and the `/find` leaf routes to it.
- **A testing gotcha worth remembering**: Playwright drives a page faster than
  `AnnounceAnswer`'s 900ms restore window, so a script that acts immediately
  after `goto` sees silence. Wait about 1.5s after load before asserting on
  the live region. A real person can't be that fast.
  Also, `text=Reveal them all at once` matched the status line ("…reveal them
  all at once") before the button. Use `getByRole("button")`.
- **Not done**: a real screen reader, a real phone passed round a table, and
  a real messaging app's handling of long fragment links (they're about 300
  characters, which is fine for every messenger I know, but untested).

## Calls I'd defend

- **Median, not mean.** One wild answer shouldn't move the group's number, and
  "the middle" is something everyone in the room understands.
- **The spread is the headline, not the number.** Planning poker and *Noise*
  agree that a wide first round is the useful output. The tool says so in
  the largest type rather than hurrying to an average.
- **Reply links go to the organizer, not the thread**, and the tool says it in
  both places it matters (the organizer's invite steps and the reply view). It's the one
  way the by-message mode could quietly reintroduce the anchor it exists to
  remove.
- **No accounts, no server, no real-time sync.** A live room would be nicer,
  but it would break the site's "sent nowhere" promise. Pass-the-phone covers
  the in-person case, and copy-paste links cover the remote one.
- **Round two is optional.** If round one is tight, the tool doesn't offer
  it: talking a tight spread through only adds noise.

## What I ruled out

- **A voting/ranking tool for "which option".** That's a different moment
  (preference aggregation, Arrow's theorem territory) and `/compare` plus
  `/crux` already cover the useful parts. Numbers are where anchoring bites
  hardest and where aggregation is unambiguous.
- **Showing a confidence interval per person.** That's more faithful to
  forecasting practice but doubles the typing at the table. One number and
  one reason is what people will actually do.
- **An essay.** The model entry and the tool's own intro carry the idea for
  now. A future essay on "the first number in the room" would fit the people
  group on `/writing`.

## Left for later

- **An essay** on independent judgments and the first number in the room,
  bridging to `/round` (add it to `Tool.essays` and to a writing group).
- **Two dots at the same value overlap on the strip** (Ben and Chloe at 4). The
  list below is complete, but stacking duplicates would read better.
- **Router wording**: watch whether "We have to agree on a number together"
  is found under "It's other people", or whether people look for it under
  "There's a number in it" (the playbook's numbers cluster). If they do, move
  the line rather than adding a question.
- Still carried from October 6: focus after the estimate/update trainers'
  reveal, the journal's "Mark reviewed", a real screen-reader pass, a note in
  the tool-authoring docs that new tools ship with `<AnnounceAnswer>` (this
  one did), and script the offline check.
