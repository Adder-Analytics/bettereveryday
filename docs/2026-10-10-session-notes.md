# Session Notes — October 10, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. The last three sessions each found a moment the kit
didn't cover (a group agreeing on a number, two options on a par, a
negotiation). I went looking for another by listing the most common calls
ordinary people make in a month and checking each against the tools and the
playbook.

## What I noticed

One of the most common calls people regret had no instrument and no playbook
situation: **someone asks you to do something weeks or months away**. Give a
talk in October, join the PTA committee, help a friend move next month. Yes
is easy because the week it lands on looks empty from here. Grepping for
"say no", "overcommit", "decline" and "next week" found only a stray line in
`/rule` ("hard to say no in the moment"). `/rule` handles the *recurring*
version. `/incentives` handles someone with a stake pushing you. `/outside`
handles promising a timeline. None of them handle the single far-off ask, and
the mistake there has a specific, well-studied mechanism. It's frequent,
distinct, and ends in a clear answer, so it passed the "curated, not
exhaustive" bar.

## Outside reading

Search worked and I read through abstracts and press summaries:

- **Zauberman & Lynch, "Resource slack and propensity to discount delayed
  investments of time versus money"** (*JEP: General* 134(1), 2005). People
  expect more slack in the future than now, much more so for time than for
  money, and they discount future time more steeply because of it. Their
  explanation, which became the copy: time demands arrive close to the day,
  so a far-off week looks empty only because its commitments haven't shown up
  yet. The "Yes… damn!" nickname turns up only in secondary sources, so I
  left it out of the essay and the model (it's in the search keywords only).
- **Liberman & Trope** (*JPSP* 75, 1998): distant choices are made on
  **desirability**, near ones on **feasibility**. Students picked
  assignments due later by interest and ones due soon by difficulty. This is
  the "why it looks good from far away" half.
- **Givi & Kirk, "Saying no: the negative ramifications from invitation
  declines are less severe than we think"** (*JPSP*, 2023; online first,
  DOI 10.1037/pspi0000443). Five studies with more than 2,000 people:
  decliners overestimate how upset inviters will be, and inviters focus on the
  reasons more than on the no itself. Givi's own caveat (don't decline
  everything, because time together builds relationships) went into the
  essay's limits. I only saw press coverage and didn't verify effect sizes, so
  the copy says "less upset than expected" and nothing stronger. I cut an
  "and less likely to ask again" line from my first draft that I couldn't
  source.

## What I built

**`/later`, "If It Were Next Week"** (short name: "Far-off yes").

- **Inputs**: the ask; who's asking (optional); when it is (this week / a few
  weeks / a few months / half a year or more); **the real hours** split into
  the thing itself, prep, travel, and recovery/follow-up; and what those hours
  will come out of.
- The hours line says the total in hours and working days, and when at least
  half the cost isn't the headline event, *"79% of it is the part nobody
  puts in the invitation."*
- **The next-week test**: *"Picture it landing next week… with everything
  already in it, and 13 hours to clear for this, taken from two evenings…
  Would you say yes?"* (yes / only grudgingly / no). A note for things that
  need lead time (a race, a speech): picture the *first week of preparation*
  instead.
- **Why say yes?** (enjoy it / useful / guilt / flattered / owe them) and
  **how hard backing out later would be**.
- **Four reads, checked in order** (`app/data/later.ts`, pure):
  1. would say no next week → **"No. Only the distance made it a yes."**
     (Doesn't need a reason. If you wouldn't do it next week, why yes is
     tempting can't rescue it.)
  2. would clear the space → **"Yes. It passes the next-week test."** Block
     the prep in the calendar now. If the pull was guilt or a debt, it says
     that's a debt you're willing to pay, which is fine, but count it.
  3. grudging + want/useful → **"A smaller yes."** Asks for the version you'd
     do next week without resenting it.
  4. grudging + guilt/flattery/debt → **"Not a yes. A hard-to-say-no."**
- **A reply you can send**, sized to the read and short on purpose. It folds
  in the smaller offer if one is typed. There's "Copy the reply" and "Copy the
  whole read as text". "Others would plan around me" adds the note that
  declining today beats dropping out later.
- Handoffs: `/act` (block the prep), `/outside` (check the prep estimate),
  and `/rule` (if these asks keep coming).
- `AnnounceAnswer`, `aria-pressed` chips, and hours fields that say under
  themselves when they can't parse input (`aria-invalid` + described-by;
  accepts `2.5`, `1,5`, `90 min`, `45m`). There's a read-only worked example
  (a 45-minute meetup talk that's really fifteen hours, answered with an offer
  to share last year's slides). It receives the carried subject.
  `ClearCallButton` is included.
- **No share link**: the reply *is* the thing you send, and the read is
  private.

**Wired in**: `tools.ts` (deciding-now, after walkaway), the router
(`triage.ts`, new "far-off-ask" choice under "It's other people", then
`/rule`), the playbook (new `far-off-ask` situation in the people cluster, so
both front doors got it), a new **Future Time Slack** model, the search index,
the sitemap, and the backup registry (`later:v1`, subject `ask`, answer-now).

**Essay: "Future You Is Not Less Busy"** (people group on `/writing`). It
covers the empty week, why far-off plans look good, the test and its four
answers, why the no costs less than you think (and least right now), three
limits (lead time, deliberate commitment devices, grudging-but-right yeses
like helping a friend move), and sending the reply. It's linked both ways via
`Tool.essays` and `Model.essays`.

**`/now`**: new lead bullet, oldest (the screen-reader one) dropped.
`SITE_UPDATED` is now October 10.

## How I verified it

- `bun run lint`, `bunx tsc --noEmit` and `bun run build` are all clean.
- A scratch script checked `readLater` on every branch (blank, no without a
  reason, yes, yes+guilt, grudging+want, grudging+owe), `parseHours`
  (including junk and negatives), `totalHours`, `hoursInDays`,
  `formatHours`, `laterSummary`, `replyText` with and without a smaller
  offer, and defensive parsing.
- **Wording bugs caught there**: the summary said "(asked by An organiser…)",
  so the name is now lowered mid-sentence. And the pressure reply with an
  offer read "I could help at the summer fair, if that would help", so it now
  ends "if that's useful".
- Headless Chromium (the `chromium_headless_shell-1194` binary; the plain
  `chromium` one refuses old headless mode) at 375×812 against `next start`:
  - The carried subject seeded and the URL was cleaned.
  - The bad-hours hint showed, and the hours line read correctly.
  - The live region said "Not a yes. A hard-to-say-no." and then "No. Only
    the distance made it a yes." It stayed silent after a reload, with state
    kept.
  - No horizontal scroll, no page errors.
  - `/find` (make the call → "Someone's asked me… weeks or months away")
    leads to `/later`.
  - Search for "say no to a talk", "overcommitted", "decline an invitation"
    and "committee" puts `/later` first.
  - `/tools`, `/playbook`, `/models`, `/now`, the essay, the sitemap and
    `/data` all show it.
- **Not done**: a real screen reader, a real phone, and clicking the copy
  buttons (no clipboard in headless).

## Calls I'd defend

- **Hours before the test.** The next-week question alone still lets you
  picture a 45-minute talk. Counting prep and travel first is what makes
  "next week" concrete, and the hours are quoted back inside the question.
- **"No" ends the read without asking why.** If you wouldn't do it next
  week, no reason rescues it, and asking would only give guilt a second vote.
- **Grudging splits on the reason, not on the hours.** "I want this but not
  this much" and "I can't face saying no" feel identical in the moment and
  need opposite replies: a smaller yes, or a no.
- **The output is a sendable reply.** The walk-away session ruled out scripts
  as coaching. Here the decision isn't made until it's sent, and the
  cheapest moment to send it is today. The reply is two sentences, editable,
  with a note to make it sound like you.
- **Lead time and commitment devices are named as limits** (the essay, plus
  a one-line note in the tool), so the test doesn't become "never commit to
  anything".

## What I ruled out

- **A calendar/capacity planner** (load your real calendar, count free
  hours). It's heavier, privacy-sensitive, and it misses the point: the
  future calendar *looks* free, and that's the bias. The test works by
  picturing a week you know, not by reading one you don't.
- **Folding it into `/rule`.** `/rule` is for the call you keep facing. This
  is one ask, often from someone you'll only ask once. The two hand off to
  each other.
- **A "people-pleasing" framing.** It drifts toward self-improvement. The
  tool is about one request and one reply.

## Left for later

- **Router placement**: "Someone's asked me… weeks or months away" sits under
  "It's other people". It could be looked for under "the stakes" (the bill
  comes later). Watch it rather than duplicate it.
- **`/rule` → `/later` link**: `/rule`'s "pressure" trigger could point at
  `/later` for the one-off case.
- **An .ics prep block**: on a yes, offer the prep as calendar events (the
  `ics.ts` plumbing exists). I held off because it needs dates the tool
  doesn't ask for.
- Carried: link `a-number-appears` → `/walkaway`, stacking duplicate dots on
  `/round`'s strip, focus after the trainers' reveal, the journal's "Mark
  reviewed", a real screen-reader pass, scripting the offline check, and
  `/crux`'s values branch → `/par`.
