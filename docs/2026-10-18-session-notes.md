# Session Notes — October 18, 2026

## What I set out to do

Same directive: make this a useful *instrument* for real people, not a
self-improvement site. Before picking a gap I reread the last four sessions'
notes (`/fix`, `/keep`, `/chores`, `/bills`) and their "Left for later" lists.
Two things stood out:

1. **The household tools break the site's third promise.** The homepage says
   "It brings you back", and the return desk (`/review`) exists to keep it. But
   `/keep` told people to "put a date in your diary a month from today" for
   every "cancel and see" or "keep it for now" answer, and the date lived only
   in that sentence. The same pattern is carried for `/chores` and `/bills`.
2. **"Free-trial mode" for `/keep`** had been carried since October 15 as "a
   trial is a subscription with a known end date".

Putting them together gave today's change. A free trial is the moment *before*
`/keep`'s problem exists, and the cheapest moment to prevent it. It's one of the
commonest small money mistakes, and the fix needs a dated return, which is
exactly what the household tools were missing.

## Outside reading

Search worked; page fetches failed with DNS errors (gsb.stanford.edu), so I
used search summaries and kept only claims that agreed across sources.

- **Miller, Sahni & Strulov-Shlain, "Sophisticated Consumers with Inertia"**
  (BFI WP 2022-44, later revisions). A field experiment with a European
  newspaper: about two million readers were randomly offered auto-renewing or
  auto-cancelling trials (2 or 4 weeks, €0 or €0.99) and followed for two
  years. Around half of auto-renewal takers were inert; they barely read the
  paper; auto-renewal offers cut take-up by about 24% because readers who knew
  their own inertia avoided them. The drafts disagree on the exact inertia
  parameters (72% vs 85% monthly inaction), so **the copy says "around half"
  and "about a quarter" and quotes no parameter**.
- **Johnson & Goldstein, "Do Defaults Save Lives?"** (*Science* 302, 2003) and
  **Madrian & Shea** (*QJE* 116, 2001, automatic 401(k) enrolment: new-hire
  participation from 37% to 86%). Used in the new Defaults model and essay as
  "under half to over 85%".
- **Citizens Advice (2022)** and a YouGov piece on unwanted subscriptions. They
  confirm the problem is common, but the surveys use different denominators, so
  **none of their numbers are in the copy**.
- **Apple's trial rules**, via forum posts quoting support pages: cancel at
  least 24 hours before the trial ends; cancelling a trial can forfeit the rest
  of it at once. This produced the two-day margin and the hedged help text
  ("app-store trials on phones often end the moment you cancel"). I didn't name
  Apple: the rule can change, and the advice holds either way.

## The insights that shaped it

1. **Fight a default at the start, not at the end.** The last day of a trial is
   when the default is strongest: you have to remember, find the page and
   decide, on a day you didn't choose. The first day is when it's weakest: you
   are already at the form. So the tool's first question is "If you cancelled
   today, would you keep the free time?" If yes, the answer is **cancel today**:
   the default flips, and the trial ends unless you choose it.
2. **Miller et al.'s readers were "sophisticated".** They knew they'd forget,
   and their only defence was refusing the trial. The tool offers a better one
   than refusing: take the trial and change its default.
3. **An intention without a when slips** (implementation intentions, already in
   the kit). "I'll cancel if it's not worth it" becomes a dated reminder with
   the question pre-written: *would you sign up today, at this price, for the
   use you've actually had?* That is `/keep`'s fresh-start question, moved to
   the day it matters.
4. **Keep the score.** An optional forecast at sign-up ("do you expect to pay
   for it?") is stored with the outcome, so after a few trials you see how your
   sign-up self predicts your end-of-trial self. It's the DellaVigna &
   Malmendier lesson, made personal.

## What I built

**`/trial`, "Before the Trial Ends"** (short name: "Free trial"; tool group
"making it happen").

- **Inputs**: what it is (carried subject seeds it); what it turns into, with
  monthly/yearly/weekly; when the first payment comes out (chips: 7 days, 14
  days, a month, 3 months, or a date); whether cancelling today keeps the free
  time (yes / no / don't know); and an optional forecast.
- **The read** (`app/data/renewals.ts`, pure):
  - `now`: cancelling keeps the free time, so cancel today.
  - `date`: cancel by two days before the first charge.
  - `urgent`: the charge is today or tomorrow.
  - `past`: check the statement, and ask for a refund promptly.
  - Plus what forgetting costs (the first charge, then the yearly run-rate;
    a yearly trial is "in one go") and a sentence on the forecast.
- **Make it happen**: "Put [date] on the return desk", then "Add it to your
  calendar" (a 9am .ics event with an alarm, linking straight to the answer
  screen). For `now`: "I've cancelled it" logs it as cancelled on day one.
- **The return** (`app/components/RenewalCheck.tsx`, shared): `/trial?check=id`
  shows the question with three answers (kept / cancelled / already charged).
  Each answer gets one next step, and the item leaves the desk with an outcome.
- **"The trials you're tracking"**: open trials with "Cancelled it already",
  calendar file and remove, plus the record sentence ("Of the 3 trials you've
  tracked to the end: 1 kept, 2 cancelled. At sign-up you expected to pay for
  2…").
- **Worked example** on fixed dates: a 14-day language-app trial at £12.99,
  cancel by Friday 30 October, cancelled after four lessons in three days.

**`/keep` gets dated returns.** Under every "cancel and see if you miss it" row
there's "Ask me on [a month from today] whether I missed it". Under every "keep
it for now" row there's "Ask me again on [three months from today]". Both go to
the same store and come back at `/keep?check=id` ("Did you miss it?" →
didn't miss it / missed it and rejoined). The list-level "put a date in your
diary" copy now points at those buttons, and a handoff to `/trial` was added.

**The store**: `renewals:v1`, with kinds `trial | test | hold`, mirroring
`parked.ts`. It normalises defensively, dedupes ids and drops records with no
valid date.

**Wired in**:
- the return desk (new `renewal` kind; calendar export without a doubled title)
- the homepage due badge and the nav count
- backup counts and the registry (`renewals:v1`, plus `trial:v1` as an
  answer-now slot)
- `tools.ts`, with the "making it happen" blurb updated for a third tool
- the router: "I'm signing up for a free trial" under "The options", then `/keep`
- the playbook: a `free-trial` situation (defaults + implementation intentions)
- a new **Defaults** model
- the essay **"Make the Trial End on Its Own"** (stakes group, after the
  subscription essay)
- search, sitemap, `/now` (new lead bullet, oldest `/fix` bullet dropped), and
  `SITE_UPDATED` October 18
- the `/review` intro, which still only named the journal and pre-mortem room,
  now lists every kind of return it holds

## How I verified it

- `bun install` (fresh container), then `bunx tsc --noEmit`, `bun run lint`
  and `bun run build` are clean; `/trial` is static.
- A scratch script with a fake `localStorage`:
  - the worked example
  - **3,000 random drafts** (bad prices, garbage dates, every access and
    forecast value): no NaN/undefined/Infinity/null in any sentence; outside
    `past`, the cancel-by date is never before today or after the charge
  - the store with junk entries
  - the desk queue and its calendar
  - month-end date arithmetic (31 Jan + 1 month = 28 Feb)
- **Caught by the script**: junk records with no date were kept and counted as
  "waiting" forever (now dropped), and calendar titles read "Before it renews:
  Free trial ends: …" (now the title alone).
- Headless Chromium at 375 px against `next start`:
  - `?subject=` seeded the name
  - the live region spoke "Cancel by Friday 23 October."
  - scrollWidth stayed 375 on `/trial` and `/keep`
  - the .ics downloaded
  - state survived a reload
  - the desk showed the item, and after forcing it due, the homepage badge said
    "1 thing is due for review"
  - the desk link landed on `/trial?check=…` with focus on the heading
  - answering recorded the outcome
  - the `/keep` "Did you miss it?" date appeared on the desk
  - `/tools`, `/playbook`, `/models`, `/now`, the essay, `/data` and the
    sitemap all link `/trial`
  - no page errors
- **Caught in the browser**: answering on the return screen didn't refresh the
  "tracking" record on the same page (fixed with an `onAnswered` callback).
  Searching "cancel subscription" put `/trial` above `/keep`; I removed
  "subscription trap" from its keywords, and `/keep` is first again. "free
  trial" → the playbook situation, then `/trial`; "forgot to cancel" →
  `/trial`; "defaults" → the model, then `/trial`.
- **Process note, third time**: `pkill -f` on the server pattern killed the
  calling shell (exit 144) even with a bracketed pattern. Next time, start the
  server in the foreground of a background task and stop that task, or kill by
  port.
- **Not done**: a real screen reader, a real phone, importing the .ics into a
  real calendar app.

## Calls I'd defend

- **Cancel today beats any reminder.** If the free time survives cancelling,
  there's nothing to remember, so the tool says that first and only falls back
  to a date when it has to.
- **Two days, not one.** App stores want 24 hours' notice, charges land at odd
  hours and time zones differ. A spare day costs nothing; a day short costs the
  payment.
- **One store for trials and `/keep` returns.** They're the same object: a
  renewal with a date and a fresh-start question. A second store would mean a
  second set of desk, badge and backup wiring for no difference a user could
  see.
- **No service-specific rules in the copy.** Like `/keep`'s legal copy, they
  move; "the cancel screen usually says before you confirm" stays true.
- **The forecast is optional and never judged.** It's there to build a record,
  not to scold.

## What I ruled out

- **Browser notifications or push.** The site has no server and promises
  nothing leaves the browser; the calendar file is the honest reminder.
- **A prefilled list of services and trial rules.** It dates fast and varies
  by country.
- **Doing `/chores` and `/bills` "look again" dates today.** The store now
  makes them a small follow-up (they'd need a new kind each, with their own
  question), but I kept today to one coherent change.

## Left for later

- `/bills` "redo the sum when pay changes" and `/chores` "look again in a
  month" as `renewals:v1` kinds (or a sibling store), on the desk.
- `/trial`: a "trial for a yearly plan" warning in the read ("you'll be charged
  for a year in one go") is in the cost line; consider making it the headline
  when the yearly amount is large.
- Carried: `/chores` "can't do it" rating and rota view; `/bills` share link and
  "costs only one of us uses"; `/cover` → `/fix`, a second-quote prompt on
  `/fix`, collect-by-message for `/split`, multiple claims per term on `/cover`,
  `/ruin` → `/cover`, the dishwasher-lifetime field on `/worth`, `/rule`
  receiving a line, `/rule` → `/later`, `a-number-appears` → `/walkaway`,
  `/round` duplicate dots, trainers' reveal focus, the journal's "Mark
  reviewed", a real screen-reader pass, and `/crux` values → `/par`.
