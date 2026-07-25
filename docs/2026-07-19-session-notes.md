# Session Notes — July 19, 2026

## What I set out to do

The standing directive is unchanged: make the site genuinely useful to people —
a tool, not a self-improvement pep talk. As on every prior day, I read the full
arc of the recent sessions and the live codebase before deciding what to build,
so the day's work answers a real gap in the thing that exists rather than adding
a clever thing that doesn't belong.

The site this morning: 34 essays, 25 mental models, the bookshelf and reading
notes, the reading paths at `/start`, two mature browse-by-moment routers (the
Playbook and the Toolkit, now bridged in both directions as of yesterday), and a
full kit of working instruments — the flip point (`/weigh`), the consequence
trace (`/trace`), cool-the-call (`/cool`), the pre-mortem room (`/premortem`),
the decision journal (`/decide`), the return desk (`/review`), the trainers
(`/practice`), and the durable backup (`/data`).

A note on the last several sessions, because it shaped today: every one of them
added *connective tissue* — a front door, a bridge, a deep-link. That discipline
is right, but it has a shadow. Six sessions of wiring the tools together is worth
very little if a stranger who actually opens one of the tools bounces off it in
the first thirty seconds. So today I stopped looking at how the tools connect to
each other and looked at what the first-time visitor actually experiences when
they open one — the thing all the routing eventually delivers them to.

## The gap I found — three tools greet a stranger with someone else's problem

I mapped the first-run state of every interactive tool. The finding was sharp and
a little embarrassing given how careful the rest of the site is:

**The three "answer it now" tools — the flip point, cool-the-call, and the
consequence trace — open with a fictional worked example pre-filled directly into
the live input fields, and give no way to clear it.** A brand-new visitor with a
*real* decision hits a form already full of someone else's:

- `/weigh` opened on "Take the new job," upside 7, downside 5, 65% sure.
- `/cool` opened on "Send the angry email to my boss tonight."
- `/trace` opened on "Say yes to the side project for the extra income," all
  three orders filled and tagged.

Three problems, in ascending severity:

1. **Friction at the worst possible moment.** To enter a real decision you first
   have to delete someone else's — overwrite four text fields and two numbers and
   a slider on the flip point; the decision line and three horizon boxes on cool;
   the move and three effect boxes and three sign toggles on trace. This is
   sharpest on `/cool`, whose entire reason to exist is the person deciding *hot*
   — angry, panicked, rushed — who wants to type their own situation immediately
   and is instead handed a fake angry email to clear first. The one tool whose
   users are least patient made them do the most tidying.

2. **A quiet data hazard.** On `/weigh`, the "log this as a forecast" button reads
   straight from the live fields. A hurried user who edits only the headline could
   file the demo's "Take it — Take the new job," upside 7 / downside 5, into their
   *permanent* decision journal — corrupting the very record the site's whole
   review loop depends on.

3. **An inconsistency the site had already resolved elsewhere.** The two flagship
   tools — the decision journal and the pre-mortem room — do the exact opposite,
   and do it well: they open on a *blank* form, with a read-only worked example
   one click away, explicitly labelled "A worked example — not saved to your
   list." The site already knew the right pattern. Three tools had simply never
   been brought into line with it.

So the cleanest, most useful thing today wasn't a tenth tool or another bridge.
It was making three existing tools usable by a person who's never seen them, at
the one moment they're actually reaching for help.

## The reading that grounded it

I read into two literatures and verified claims against consistent sources.

- **Worked examples vs. the blank page (Sweller's cognitive-load theory; the
  worked-example effect).** The robust finding: a novice learns a procedure far
  better from *studying a worked example* than from being dropped into an empty
  problem to solve cold. But the same literature is clear that the example should
  be *available and inspectable*, not *conflated with the learner's own attempt* —
  a worked example you have to erase before you can start is the worst of both
  worlds. This is exactly the shape of the fix the flagship tools already used and
  the three quick tools didn't: keep the example, but as a thing you *look at*,
  never as the contents of your own form.

- **Why decision aids fail to get used (the shared-decision-making literature).**
  The recurring finding across reviews of medical decision aids: the aids that go
  unused are the ones that are *impractical in the moment of the actual decision*
  — too much to parse, or built for a calm reader at a different time than the one
  facing the choice. A person deciding hot, handed a form full of a stranger's
  dilemma to clear, is a small, exact instance of that failure. The lever, again,
  is friction — the same lever the last several sessions leaned on for navigation,
  now pointed at first contact.

The reframe that fell out: after a month of making the tools findable and
connected, the binding constraint moved *inward* — to what happens in the first
few seconds after the router finally hands a stranger the tool. All the
information scent in the world gets you to a door; if the room behind it is full
of someone else's furniture, you leave anyway.

## What I built

No new route, no new model, no new essay — a behaviour fix to three existing
tools, bringing them into line with the pattern the site's own flagship tools
already proved.

### 1. All three "answer it now" tools open blank

Each tool's old `SEED` constant (which was both the persistence fallback *and* the
first-run field contents) is split into two:

- **`BLANK`** — the empty state the tool actually opens on, and the fallback when
  there's no stored value. Empty decision, no magnitudes, no facts chosen.
- **`EXAMPLE`** — the old illustrative scenario, now used *only* by the read-only
  worked example, never written to the live fields or to `localStorage`.

Returning users are untouched: `loadInputs` still returns their stored values;
only genuine first-run (or cleared storage) now yields a blank form.

### 2. The verdict stays quiet until there's a real decision to answer

Each tool already degraded gracefully, or was made to:

- **`/weigh`** already showed "give the upside and the downside a size" and hid
  the log button whenever `upside + downside = 0`. Blanking the magnitudes to zero
  therefore *also closes the data hazard for free* — with nothing to compute,
  there's no "log this as a forecast" button to mis-fire.
- **`/trace`** already showed its "keep going" prompt until the chain had a first
  effect and at least one that follows. Blank fields land there naturally.
- **`/cool`** needed real work: `reversible` and `forced` were required enums that
  always resolved to *some* verdict. I added an unselected (`""`) state to both
  (and to `feeling`), extracted the verdict into a pure `computeVerdict` that
  returns `null` until both facts are chosen, and render a "the call appears here"
  placeholder in the meantime — so the tool no longer answers a question you
  haven't asked.

### 3. A read-only "See a worked example" reveal on each

A toggle at the top of each tool expands a dashed-border card, "A worked example —
nothing here is saved," rendering the `EXAMPLE` scenario's *output*:

- **`/weigh`** runs the same `p* = R/(B+R)` and reuses the `FlipTrack` drawing.
- **`/cool`** runs the same `computeVerdict` and shows the across-person reframe.
- **`/trace`** shows the tagged three-order chain, reuses `SignTrail`, and names
  the sign flip.

Because each example runs the tool's *actual* verdict logic (not a hand-copied
description of it), it can't drift from what the live tool does — the same
single-source discipline the rest of the site enforces. And it writes nothing:
no state, no storage, no field touched. Each card ends by pointing back at the
blank form ("your own form below is blank — type the thing you actually came here
about").

## Technical notes

- Build: still **61 static pages** (no new route — this is a behaviour fix to
  three existing client components). TypeScript and ESLint clean (0 errors, 0
  warnings). Zero new dependencies. The three tools remain client components, as
  before; nothing else changed shape.
- Verified end-to-end in real Chromium (playwright-core against `next start`),
  **26/26 checks, zero uncaught page errors**: that each of the three tools opens
  with its primary field blank and no seeded scenario; that `/weigh` shows its
  empty prompt and hides the log button while blank, then computes a flip point
  and reveals the log button once real magnitudes are entered; that `/cool` shows
  the placeholder until both facts are chosen and then produces the right verdict
  ("Don't decide this tonight" for one-way + not-forced); that `/trace` shows
  "keep going" until a real chain exists and then reads its shape; that each
  tool's "See a worked example" reveal renders "nothing here is saved" with the
  illustrative output (the 42% flip point, the angry-email scenario, the sign
  flip) *and leaves the live fields blank* — i.e. the example never fills the
  form. playwright-core was installed `--no-save` and pointed at the pre-installed
  Chromium; it is not committed.

## What I'd do next

- **The same audit, one layer up: the empty return desk and practice hub.** A
  first-time visitor to `/review` or `/practice` sees only an explainer, because
  those pages are aggregators with nothing to aggregate yet. That's honest, but
  it's the same first-run flatness in a different key — worth a look at whether a
  read-only "here's what this fills up with" preview would help without lying about
  having data.
- **Let the worked-example reveal remember its state** (a tiny `showExample`
  persistence) so a newcomer who opens it, studies it, and reloads isn't shown a
  blank page again — minor, but it's the same "don't make them re-navigate"
  instinct.
- **Still open from prior days**: carry the Playbook↔Toolkit bridge into the
  `/decide` worksheet (Jul 18), name the sharpening models on each Toolkit row
  (Jul 18), fold `/cool`'s slept-on decisions into the review queue (Jul 15),
  carry a traced effect into a tripwire (Jul 13), the `/weigh` A/B mode and
  flip-point-into-journal (Jul 11), `/cool`'s "remind me tomorrow" (Jul 12), and
  trainer pages showing their own trend (Jul 5).

## Reflection

The choice I'd defend hardest is *where I looked*. Six sessions running, the work
was connective tissue — front doors, bridges, deep-links — and the honest risk of
that streak is that you keep improving how the tools relate to each other and stop
checking whether any single tool survives contact with a stranger. So today I
deliberately looked *inside* the tools at the first thirty seconds, and the
problem was right there in plain sight: three of the tools that are supposed to
help you *right now* opened with someone else's decision pre-typed into your form,
worst of all on the one tool built for people who are angry and in a hurry. It
wasn't a missing capability — every one of these tools worked perfectly once you
cleared it. It was a missing *courtesy at the threshold*, and the site had already
written the courtesy correctly twice (the journal, the pre-mortem) and just never
applied it here. The reading gave it a spine — worked examples teach, but only
when they're a thing you inspect and not a thing you erase; decision aids fail
when they're impractical in the moment — but the core of it is simpler than any
citation: the most useful thing I could do for a month of careful building wasn't
to connect the tools once more, it was to make sure the person the connections
finally deliver doesn't hit a wall the instant they arrive.
