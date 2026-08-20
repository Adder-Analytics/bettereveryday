# Session Notes — August 20, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for real
people facing real decisions — a tool, not a self-improvement lecture. As on
every prior day, I filled my context before choosing what to build, so the day's
work answers a real gap in the thing that already exists rather than bolting on a
clever new one.

I read the homepage front to back, the toolkit registry (`tools.ts`) and its
`toolGroups`/`resolveToolGroups`, the guided front door (`FindClient.tsx`) and
the carry through-line (`carry.ts`) that lets a decision ride from tool to tool,
the nav's link set, the `ReviewDueBadge` island, `globals.css` and its print
block, and the last several session notes back to their origins. And I did what
this site preaches: I built the site, served it, and read the rendered output in
a real browser — homepage light, dark, and at phone width, plus the actual
click-through — instead of trusting how the JSX reads. That render caught a real
bug before it shipped (below).

I also re-read the one thing the last two sessions both wrote down as the
deliberately-deferred #1 item, and left untouched each time.

## The gap I found — the useful thing was buried under the personal frame

The site is two halves of one argument: the **writing** (33 essays, 30 mental
models) and the **instruments** (17 working tools that run those ideas on a
decision of your own). Over the last several sessions the *connective tissue*
between those halves got beautifully finished — an essay now bridges to the
instrument that practices it, a model does too, a decision carries its subject
from tool to tool, a worked record can be printed and held. The machine is whole.

But a stranger never sees the machine. The **homepage** — the front door every
first-time visitor actually lands on — led with a personal-blog frame: a hero
that read "Essays on finance, decisions, learning, and craft," then three recent
essays, then, third and below the fold under a heading literally called
*"Reference,"* a dense paragraph of prose that was the only mention of the
genuinely differentiated, useful-to-a-stranger thing the site holds — a private,
on-your-side toolkit for thinking through a decision you're facing *right now*.
The personal "Currently" block (half-marathon mileage, Spanish plateau) sat as a
peer of the toolkit, not below it.

So the site's actual utility was its third act, wrapped in prose, labeled
"Reference," while its opening said *personal essayist*. The August 18 and 19
notes both named this exact imbalance and both, correctly, declined to touch it
— because rebalancing a person's homepage is "a real judgement call about the
owner's site identity," not a seam to quietly fix. Today's task made that call
explicit: *make this site better… make it useful to people… this should not be a
self-improvement site.* That is the authorization those two sessions were waiting
for. So I took it — carefully, without erasing the person.

## What I built — a homepage that leads with the instrument, and lets you start in one line

Two changes, both reuse, no new data model.

- **A real decision entry on the homepage** (`app/components/DecideHero.tsx`).
  The old homepage's one affordance for someone facing a decision was a text
  link pointing at the guided front door. But that door (`/find`) opens with a
  "what are you deciding?" field, and the site's whole through-line is built to
  carry that one line onward so you type it once. The new hero *is* that field:
  you name your decision on the page you land on, hit **Find your instrument →**,
  and it rides straight into `/find` pre-filled — one fewer cold start between
  arriving and working the real thing. It's a thin client island that holds
  nothing and sends nothing; the subject travels only in the URL, reusing
  `withSubject` — the exact helper the tools already use between each other — so
  the homepage can't drift from the rest of the site. Submitting empty is fine:
  `/find` works without a subject and `withSubject` puts no dead `?subject=` on
  a blank field. I verified the full flow in the browser: type on the homepage →
  land on `/find` with the decision already in the field (both via the click and
  via a direct `?subject=` load).

- **The toolkit, surfaced and scannable, above the writing** (`app/page.tsx`).
  The dense "Reference" prose that hid the tools is replaced by the site's own
  best map of them: the four `toolGroups` — the four moments of a decision's life
  ("You're facing a decision right now," "…about to commit to something that
  matters," "…made the call — now make it happen," "…coming back to something
  already decided") — each a heading linking into `/tools`, with its instruments
  listed as links beneath it. A returning visitor's `ReviewDueBadge` sits at the
  top of it, so anything due greets them first. The hero copy now names the
  useful thing plainly ("A private toolkit for thinking through a real
  decision… Nothing you enter ever leaves your browser") while keeping the site's
  soul-line — *understanding a few fundamental ideas well beats knowing many
  things shallowly* — which I moved down into a compact **Reference** row
  (models · playbook · notes · bookshelf · search) rather than deleting. Recent
  Writing stays, reframed as the thinking the tools are built on. And the
  personal **Currently** block stays exactly as it was, at the foot of the page —
  the person is still here; they're just no longer the first thing a stranger
  with a decision has to read past.

The section order now tracks what a stranger actually needs, in order: *here's a
decision you're facing — name it → here are the instruments, by your moment →
here's the writing behind them → here are the ideas to think with → here's who
made this.*

## The decisions I'd defend hardest

**Take the judgement call, but keep the person.** The two prior sessions were
right to leave this until it was authorized, and right that it's identity, not a
seam. The task authorized it. But "useful to people" doesn't mean "strip the
owner out" — it means stop making a stranger read past the personal frame to find
the useful one. So the essays, the soul-line, and the whole "Currently" block all
survive intact; only their *order* and *prominence* changed. The hero leads with
utility; the person closes the page.

**Reuse the count's single source, and force the space.** The scannable toolkit
intro names the number of instruments. There is already a canonical `toolCount`
in `tools.ts` — built precisely so no surface hardcodes the size and goes stale —
so I used it rather than recomputing. My first pass wrote `{toolCount} working
instruments` and the *rendered* page read "17working": JSX had swallowed the
space between the expression and the text, exactly the swallowed-space class the
Aug 19 session's rendered check also caught. Trusting the source, it looked fine;
rendering it, it was broken. An explicit `{" "}` fixed it. This is the whole case
for the site's own discipline — reality-test the output, not the source — turned
back on itself.

**A field, not just a link.** The most useful version of "facing a decision now?"
isn't a link to a tool; it's the first field of the tool, on the page you're
already on. The carry through-line already existed to make that seamless — this
just moves its entry point to the true front door.

## The discipline that kept it honest

- **Reuse over invention.** One small client component and a rewritten homepage —
  no new store, no new route, no new data model, no dependency. `DecideHero`
  leans entirely on the existing `withSubject`/`/find` machinery; the toolkit
  section leans entirely on the existing `resolveToolGroups` and `toolCount`.
- **Rendered, not trusted.** Built and served the site; read the homepage in the
  browser light, dark, and at phone width; drove the actual type-and-submit flow
  and confirmed the decision lands pre-filled in `/find`. The render caught the
  "17working" swallowed space that the source hid.
- **The person is preserved, not overwritten.** Nothing personal was deleted —
  the essays, the conviction line, and the "Currently" block all remain; the
  change is one of order and emphasis, which is exactly what the directive asked
  for and no more.

## A note on the build in this environment

This sandbox could not reconstruct `node_modules`: the shared package cache that
satisfied the first install was wiped along with `node_modules` mid-session, and
a fresh resolve dead-ends on entries the committed lockfile expects but this
network can't reach (two are 404 npm meta-packages — `@next/swc`,
`@vercel/turbopack-ecmascript-runtime` — and one is a git tarball behind a
proxy-blocked `api.github.com`). That's an environment limitation, not a code
one. Verification therefore ran against the live Turbopack dev server, which
compiled all three affected routes (`/`, `/find`, `/tools`) fresh, with zero
errors, and rendered correctly in the browser across themes and widths. The diff
is two files and type-trivial (a string helper and a registry read).

## What I deliberately left for later

- **A decision could still use a home of its own.** The carry through-line threads
  a subject from tool to tool, and `/review` gathers the *scheduled* returns, but
  there's still no single "everything I've worked on this one decision" view.
  Noted by the last session too; still a larger, schema-coupled build for a
  future day. (Worth knowing for whoever picks it up: only the journal,
  pre-mortem, tripwires, cooling-off, and trainers actually persist — the
  answer-now tools compute in-session — so a "decision home" would gather those,
  not all seventeen.)
- **The `/find` guided door still isn't in the nav.** It's now prominent on the
  homepage and linked from `/tools`, but a returning visitor deep in the site has
  no top-level way back to it. A small, safe nav addition for a future day.
