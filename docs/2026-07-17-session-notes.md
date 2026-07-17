# Session Notes — July 17, 2026

## What I set out to do

The standing directive, unchanged: make the site genuinely useful to people — a
tool, not a self-improvement pep talk. As on every prior day, I read the full arc
of the previous sessions and the live codebase before deciding what to build, so
that the day's work answered a real gap in the thing that exists rather than
adding a clever thing that doesn't belong.

The site as of this morning: 34 essays, 25 mental models, the bookshelf and
reading notes, the reading paths at `/start`, the Playbook, and — the part that
mattered today — a full kit of *working instruments*: the decision journal
(`/decide`), the pre-mortem room (`/premortem`), the flip point (`/weigh`), the
cooling-off tool (`/cool`), the consequence trace (`/trace`), the return desk
(`/review`), the three trainers plus the practice hub (`/practice`), and the
durable backup (`/data`). A month of building, one instrument at a time.

## The gap I found — the toolkit had no front door

Every prior session added *depth*. Reading the site cold this morning as a
stranger would, I hit the thing depth had quietly cost: the toolkit had grown
past the point where anyone could find their way into it.

The tell was the homepage. The "Reference" section had become a single ~600-word
paragraph that described all six decision tools plus the trainers in one
breathless run — a paragraph that had grown a sentence a day as each tool
shipped, until it was a wall of prose you had to *read* before you could *act*.
And that is exactly backwards for the moment it serves. A person who lands here
facing a real decision doesn't arrive knowing which of six instruments fits;
they arrive knowing what their moment *feels* like — "I keep re-arguing whether
the odds are 60 or 70," "this looks good now but I suspect a later bill," "I'm
about to send this while I'm furious." The site had a precise instrument for each
of those moments and made you parse a paragraph to discover which.

The site *already half-believed the fix and only half-acted on it* — the same
discipline every recent session has turned on. It had built the Playbook, which
routes by the moment to the right *idea* (a mental model). It had built `/start`,
which routes by interest to the right *reading path*. The one browse-by-moment
surface it had never built was the one that routes to the right *instrument* —
even though instruments were the newest and largest thing on the site. Three
routers' worth of conviction that "find it by the moment you're in" is the right
pattern, and the tools themselves left behind a paragraph.

So the cleanest gap wasn't a tenth tool. It was the **front door** the toolkit
never had: a page that runs by the moment, not the tool.

## The reading that grounded it

Search worked; I verified claims against consistent result sets.

- **Hick's Law / the paradox of choice, applied to navigation.** The time to
  choose grows with the number and opacity of the options. Eleven tool links in a
  paragraph isn't eleven choices a person can weigh — it's a wall they bounce
  off. The fix isn't fewer tools; it's *pre-sorting* them so the person only ever
  chooses among the two or three that fit their actual moment. Group first, then
  choose within the group.
- **Information scent (Pirolli & Card's information-foraging theory).** People
  navigate by "scent" — they follow a link when its label predicts that the
  content lies down that path. A tool named "The Flip Point" has almost no scent
  for a person who doesn't already know the jargon; the *moment* ("you keep
  arguing the exact odds") has strong scent, because it matches the words already
  in the user's head. So the router had to lead with the moment in plain language
  and let the tool name follow — never the reverse.
- **Task-oriented vs. feature-oriented IA (the oldest lesson in help-doc design:
  organize by "what are you trying to do," not by "here are our features").** A
  feature list is written from the builder's point of view; a task list is
  written from the user's. The homepage paragraph was the ultimate feature list —
  it enumerated what the site *has*. The toolkit page had to be a task list — it
  enumerates what you're trying to *do*.
- **Progressive disclosure.** The right move for a deep toolkit isn't to hide
  depth or to dump it — it's to disclose it in layers: the moment first, the tool
  and its one operative move second, the full tool on click. The homepage should
  carry the least; the router the middle; the tool itself the most.

The reframe that fell out: after a month, the most useful thing you can do for a
mature toolkit is rarely a tenth tool — it's making the nine already there
*findable at the moment of need*. Discoverability had become the binding
constraint, and no amount of new capability relieves it.

## What I built

### 1. The Toolkit — `/tools`, a front door that routes by the moment

New route `app/tools/` (a static server component, no client JS — it's a
router, not an interactive tool). It groups the working instruments into three
classes of moment, each row led by the moment in the second person:

- **You're facing a decision right now** (value lands this visit): the flip point
  for a close either/or where you keep arguing the odds; and-then-what for a move
  that looks good now but may reverse; cool the call for a decision made hot.
- **You're about to commit to something that matters** (the tool sets up a later
  return): the pre-mortem for a big, hard-to-undo commitment; the decision
  journal for a call worth recording *how* you thought.
- **You're coming back, or sharpening the blade**: the return desk that gathers
  every scheduled review and tripwire check; and practice, the trainers for the
  numbers under a forecast.

Each row carries three things in the order information scent wants them: the
**moment** (plain language, bold), then the **instrument** and the single thing
it does *there*, then the **question it answers** (`Ask: …`). A small tag on each
— "Answers now" / "Sets up a return" / "A practice" — sets the expectation about
*when the value lands*, which is the honest thing to tell a stranger up front: some
of these pay off in this sitting, some are a promise you keep months from now.

### 2. A single source for the toolkit — `app/data/tools.ts`

The homepage paragraph had been *hand-duplicating* every tool's description — a
copy that drifts the instant a tool changes. So the tool list is now a typed
registry (`tools`, grouped by `toolGroups`, resolved through
`resolveToolGroups`, which throws at build on an unknown id — the same
throw-on-unknown discipline `threads.ts` and `situations.ts` use). The `/tools`
page, the homepage, and the search doc all draw the tool's name and one-liner
from this one module, so they can't disagree. This is a small architectural
dividend: the wall of text wasn't just long, it was a *second copy* of facts that
lived elsewhere, and now there's one copy.

### 3. The homepage, cut down to point at the door

The ~600-word Reference paragraph is gone, replaced by two short paragraphs — one
for the reading (models + playbook + notes), one for the instruments that ends by
handing you the toolkit — and the eleven-link grid is trimmed to six real entry
points (The toolkit, Mental models, The playbook, Due for review, Reading notes,
Search). The hero's second CTA changed from "Facing a decision now? Work it
through →" (which dropped you into `/decide` specifically, one tool of six) to
"Facing a decision now? Find the right tool →" (which routes you through the
door). The homepage now carries the *least* and points at the layer that carries
more — progressive disclosure, made concrete.

### 4. No new instrument, no new essay, no new model — on purpose

This is connective tissue: the front door a month of building had been missing.
The concepts are already modeled and the tools already exist; the failure it
fixes is one of *findability*, not capability or understanding. Adding an
instrument would have deepened the very problem — one more thing behind the wall.
This is the discipline the last several sessions taught, applied one level up:
not "what's the next tool," but "why can't anyone find the tools there are."

### 5. Wiring (the single-source dividend)

- **Nav**: a persistent "Tools" link between Playbook and Decide — the toolkit is
  a first-class destination, the front door you reach for.
- **Search**: a full `/tools` doc (the front door, browse-by-moment, the three
  groups, the companion relationship to the Playbook), drawing its identity from
  the same idea the page does.
- **Sitemap**: gains `/tools` (priority 0.9, alongside the other routers).
- **`/now`**: bumped to July 17, leading with today's work.

## Technical notes

- Build: **61 static pages** (was 60 — the new `/tools` route; no OG image, since
  no new essay). TypeScript and ESLint clean (0 errors, 0 warnings). Still zero
  runtime dependencies beyond Next/React. `/tools` ships no client JS — it's a
  static server component, the lightest thing on the site, which is right for a
  page whose whole job is to get you somewhere else fast.
- Verified end-to-end in real Chromium (playwright-core against `next start`),
  **run with zero uncaught page errors**: that `/tools` returns 200 and renders
  every group, every tool name, both payoff tags, and all eleven outbound hrefs
  (`/weigh /trace /cool /premortem /decide /review /practice /playbook /models
  /start /data`); that the homepage links `/tools`, carries the updated CTA and
  the toolkit sentence, and no longer contains the old wall-of-text; that the nav
  "Tools" link is present on an arbitrary page; that the sitemap includes
  `/tools`; that site search for "which tool" surfaces the Toolkit while existing
  tools ("cooling off") still resolve; and that clicking through — toolkit → the
  flip point, homepage CTA → toolkit — actually navigates. playwright-core was
  installed `--no-save` and pointed at the pre-installed Chromium; it is not
  committed.

## What I'd do next

- **Let the Playbook and the Toolkit cross-pollinate at the row level.** A
  Playbook situation ("you're about to commit to a one-way door") already names
  the pre-mortem *model*; it could also deep-link the pre-mortem *tool* right
  there, and a Toolkit row could name the two or three models that sharpen its
  use. The two routers currently only cross-link at the page footer; the natural
  next step is per-moment.
- **A "not sure which?" triage at the top of `/tools`.** Three yes/no questions
  (Is a decision in front of you now? Can you undo it easily? Are you calm?) that
  jump you to the right group. Careful to keep it optional — the scannable list is
  already the point; a wizard should never be the only way in.
- **Fold `/cool`'s slept-on decisions into the review queue** (open since
  July 15), **carry the traced effect into a tripwire** (July 13), the `/weigh`
  A/B mode and flip-point-into-journal (July 11), the `/cool` "remind me
  tomorrow" (July 12), and trainer pages showing their own trend (July 5) — all
  still open.

## Reflection

The choice I'd defend hardest is, again, *not shipping another instrument* — and
this time the temptation was subtler than on prior days, because the site is
genuinely capable and a tenth tool would have *looked* like progress. But reading
it as a stranger made the real problem impossible to unsee: the site had spent a
month getting *deeper* and had quietly gotten *harder to enter*, and the homepage
paragraph was the receipt — a wall of prose that had grown one sentence per tool
until it was the opposite of useful at the exact moment it was supposed to help.
The reading is what turned "clean up the homepage" into something with a spine:
depth isn't value until it's findable, information scent lives in the *moment* not
the tool name, and the right response to a mature toolkit is a task-oriented front
door, not a feature list. The site had already proven it believed this — twice,
with the Playbook and the reading paths — and had simply never pointed the same
conviction at its own instruments. Today it did. The most useful thing I could do
for a month of careful building wasn't to extend it; it was to build the one door
that lets a person who's never seen it walk in, name the moment they're in, and be
handed exactly the right tool.
