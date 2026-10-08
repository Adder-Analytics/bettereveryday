# Session Notes — October 8, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. Yesterday added the first tool built for a group. Today
I went looking for the gap `/now` already names in its own "Still open" list:
*"The analytic kit is deliberately thinnest on the emotional half of a hard
call — competing values, the weight of the choice."* The question was whether
there's a real, distinct moment there, or whether filling it would just mean
"another worksheet".

## Outside reading

- **Ruth Chang, "Hard Choices"** (*Journal of the American Philosophical
  Association*, 2017) and her TED talk (2014, more than 2M views), read through
  summaries (fs.blog, Rutgers, NPR's Life Kit interview). The core claim: a
  hard choice isn't hard because of ignorance or incomparability. The options
  are **on a par**: comparable, neither better, and not equal either. The
  **small-improvement test** tells a par from a tie. Improve one option
  slightly. If they were equal, that tips it. If it doesn't, they're on a par.
  The prescription: when the world's reasons run out, you can **commit** and
  so create a reason ("normative power"). The failure mode she names is
  **drifting**, where the default wins because nobody chose.
- **Steven Levitt, "Heads or Tails"** (*Review of Economic Studies* 88(1),
  2021; NBER w22487, 2016). More than 20,000 coin flips over major decisions.
  People the coin nudged toward a change were happier at six months. The
  status-quo bias seen at two months was gone by six. The caveats I carried
  into the copy: the sample was self-selected, compliance was partial, and
  the effect was modest.

## What I noticed

Every tool in the kit treats a stuck choice as **missing an input**: a
probability (`/weigh`), a fact (`/enough`, `/test`), a frame (`/widen`),
distance from a feeling (`/cool`, `/regret`, `/advise`). Chang's point is
that some stuck choices aren't missing anything, and for those the kit's
implicit advice (analyze harder) is exactly wrong.

The clearest sign was in `/compare`. Its "too close to separate" read already
said *"the tiebreaker is whatever you couldn't score: … who you'd become"*,
then handed the pair to the flip point, which looks for an unknown. When no
unknown exists, that was a dead end. A frequent, real moment (job vs family,
city vs town) with no instrument passes the "curated, not exhaustive" bar.

## What I built

**`/par`, "Neither One Wins"** (short name: "On a par").

- **Inputs**: the decision, two options, and for each one "what it gives you
  that the other can't".
- **Four reads, checked in order** (`app/data/par.ts`, pure functions):
  1. *Weighed overall, is one better?* If yes: **"Not a hard choice — a
     painful one."** The loss of the other's best thing is grief, not
     evidence. Hands off to `/act` and `/regret`.
  2. *Could a fact you could find out settle it?* If yes: **"Not on a par
     yet — you're missing a fact."** Hands off to `/enough` and `/test`.
  3. **Small-improvement test**, run on both sides. Both tip: **"A true tie.
     Flip a coin."** (with the "if your stomach drops, go the other way"
     read). One tips: **"Close, but X has the edge."** (if a small gain to A
     settles it but one to B doesn't, A was already at least as good).
  4. Neither tips: **"On a par. This one is yours to make."**
- **Commitment step** (par only): finish "Choosing X, I'm someone who…" for
  each option; *"If you never decide, which one happens anyway?"* (a
  drift/status-quo answer shows the Levitt note); then "I'll stand behind X".
  The output is a sentence to keep: *"I'm choosing Bristol. I'm someone who
  is there for the people I love, day to day. Edinburgh wasn't worse. I
  chose which one to stand behind."* There's also "Copy it as text", plus
  handoffs to `/act` and `/decide`, or `/advise` if still uncommitted.
- **Announces** its headline (or the commitment) through `AnnounceAnswer`.
  There are `aria-pressed` chip groups. A first-person worked example
  (Edinburgh vs Bristol) is read-only and runs the same functions.
- **Receives carried options**: the `a`/`b`/`from` params seed only blank
  option fields, with a "Both options carried from your comparison" note.
  `/compare`'s too-close finalists card now offers *"Test whether they're on
  a par →"* under the flip-point link.
- **Not shareable on purpose.** It's a private commitment, not an artifact to
  argue back with. That's consistent with `/now`'s peer-sharing note.

**Wired into everything**: `tools.ts` (deciding-now group, after compare),
the router (`triage.ts`, new "even" choice in "It's the options themselves",
then `/act`), the playbook (`situations.ts`, new "neither-wins" situation in
the options cluster), a new **Hard Choices (Parity)** model in `models.ts`,
the search index, the sitemap, and the backup registry (`portable.ts`, key
`par:v1`).

**An essay, "Neither Is Better"** (`posts.ts`, options group in
`writingGroups.ts`). It covers the four situations that feel identical from
inside, what to do with a par, drifting, Levitt, and three honest limits:
"par" as an excuse to skip the work, the fact that Chang's view is contested
(the vagueness reading), and that commitment doesn't erase the loss. Linked
both ways through `Tool.essays` and `Model.essays`.

**`/now`**: new lead bullet, oldest (word-gluing) dropped. The "emotional
half" open item now mentions the new tool without declaring the gap closed.
`SITE_UPDATED` is now October 8.

## How I verified it

- `bun run lint`, `bunx tsc --noEmit` and `bun run build` are all clean.
- A scratch script checked `readPar` across all branches (blank, clear, fact,
  half-answered → null, tie, edge, par, and a stale par switched back to
  clear), `commitmentText`, `selfClause`, `parSummary` and defensive parsing.
- Headless Chromium against `next start` at 375×812: walked every read. The
  live region said each headline once and then the commitment sentence. It
  stayed silent on load and after a reload. Carried options didn't clobber
  saved work, and seeded a blank tool with the note. The URL was cleaned.
  `/find` (make the call → "Two good options…") leads to `/par`. Search finds
  it for "torn between two" and "ruth chang". The playbook anchor, the
  model, the essay (with the tool under its title), `/tools`, `/`, `/now` and
  the sitemap all show it. No page errors.
- **Wording bugs caught in testing**: user text in mid-sentence positions
  read "I'm choosing Staying in Bristol" and "someone who Puts family
  first". Added `midName` (lowers only a leading The/A/An, since anything
  else may be a proper noun) and `lowerLead` (lowers a leading capital
  unless it's "I" or an acronym).
- **Not done**: clicking through `/compare` to its too-close card in the
  browser (I tested the receiving end with the exact params it sends), a real
  screen reader, and a real phone.

## Calls I'd defend

- **Rule out the three look-alikes before calling anything a par.** Saying
  "it's a par" too early is the obvious way the idea gets misused as
  permission to stop thinking. The order (better? fact? small improvement?)
  means a par is only declared after the weighing has been done.
- **The output is a sentence, not a score.** A par has no correct answer, so
  any number would be false precision. The commitment sentence ("…wasn't
  worse. I chose which one to stand behind.") is the thing worth carrying
  into the bad days.
- **The drift question.** Chang's "drifting" and Levitt's status-quo finding
  point the same way. Asking "which happens if you never decide?" costs one
  tap and catches the commonest way a par actually gets settled.
- **Levitt is quoted with its caveats** (self-selected, modest), and framed as
  "don't let staying win by default", not "always change".

## What I ruled out

- **A values-weighting worksheet.** `/compare` already makes weights
  explicit. The gap wasn't another scoring sheet; it was the case where
  scoring has nothing left to find.
- **Making it a group tool.** Two people at a values split already have
  `/crux`, whose values branch calls for "a fair procedure". `/par` is one
  person's commitment.
- **A free-form reflection page.** Every tool ends in an answer. This one ends
  in one of four reads and, for a par, a specific sentence.

## Left for later

- **`/crux` values branch → `/par`?** When a values split is really one
  person's own par projected onto a disagreement, a link could help. I held
  off because it's a different moment.
- **Watch the router placement**: "Two good options, and however I weigh them
  it comes out even" sits under "the options themselves". If people look for
  it under "my own read", move the line rather than adding a question.
- Carried from October 7: stacking duplicate dots on `/round`'s strip, an
  essay on "the first number in the room", focus after the estimate/update
  trainers' reveal, the journal's "Mark reviewed", a real screen-reader
  pass, and scripting the offline check.
