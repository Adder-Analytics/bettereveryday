# Session Notes — August 19, 2026

## What I set out to do

The standing directive holds: make this a genuinely useful *instrument* for
real people facing real decisions — a tool, not a self-improvement lecture. As
on every prior day, I filled my context before choosing what to build, so the
day's work answers a real gap in the thing that already exists rather than
bolting on a clever new one.

I read the homepage, the toolkit registry (`tools.ts`) front to back, the
guided front door (`FindClient.tsx`), the carry through-line (`carry.ts`) that
threads a decision from tool to tool, the portability layer (`portable.ts`) and
the return desk (`review.ts`) that between them make the record durable and give
it a home, the mental-models reference (`models.ts`) and its page, the essay
route, the nav, and the last several session notes back to their origins. And I
did what this site preaches: I built and rendered the whole thing in a real
browser — homepage, `/find`, `/tools`, `/widen`, `/compare`, `/models` — light
and dark, instead of trusting how the JSX reads.

## The gap I found — the *models* page was the last idea surface with no bridge to the instruments

The site is two halves of one argument: the **ideas** (33 essays, 30 mental
models) and the **instruments** (17 working tools that run those ideas on a
decision of your own). Yesterday's session bridged the first idea surface — an
essay page now carries a "Put the Idea to Work" section linking each essay to
the instrument its idea is the practice of.

But there are **two** idea surfaces, and the other one was still an island. The
`/models` page — the site's deepest, densest idea reference — already bridges
each model *outward* to four things: the essay that explores it, the books on
the shelf, the playbook situations that call for it, and the reading notes that
touch it. Every one of those is *more to read*. The one actionable next step —
*here is the instrument that runs this idea on a decision of your own* — was
missing, at exactly the surface that most invites it. It was missing even where
the model's own prose already names the tool: the pre-mortem model mentions "the
pre-mortem room on this site," `/quit`, `/tripwire`, and the decision journal;
the tripwires model names `/quit` and `/tripwire`; the flip point is described
model-for-model in "The Decision Threshold." The relationship existed in the
prose and in the reader's head — it just wasn't a link they could follow.

So a person who lands on "Reality-Testing" or "Second-Order Effects" from a
search, understands the idea, and is primed to *use* it, was handed only more
reading. The whole site is built on applying ideas; the models page is where an
idea is explained most completely, and it pointed everywhere except at the doing.

## What I built — "Put it to work"

The exact twin of yesterday's essay→tool bridge, one surface over, so the two
idea surfaces (essays and models) now both route to the instruments. After
today, the reading→doing connective tissue is complete on both sides.

- **`tools.ts` gains a `models?: string[]` field** on `Tool`, the precise twin
  of the existing `essays?` field. It names the mental models whose *idea* an
  instrument is the *practice* of — `reversibility` for the door triage,
  `decision-threshold`/`expected-value`/`loss-aversion` for the flip point,
  `pre-mortem`/`inversion` for the pre-mortem room, `halo-effect`/`anchoring`/
  `mediating-assessments` for the halo-off comparison, and so on. Declaring both
  `essays` and `models` on the tool keeps every "this instrument practices these
  ideas" relationship in one file, and lets each idea surface reverse-look-it-up
  so the two directions can't drift. A `getToolsForModel(modelId)` helper mirrors
  `getToolsForEssay(slug)` exactly.
- **The `/models` page renders a "Put it to work:" row**, placed *first* among
  each model's outward links — above the essay, the shelf, the playbook, the
  notes — because the site's own ethos is instrument over lecture: doing comes
  before more reading. It uses the page's existing compact inline `·`-separated
  row style, so it reads as a native sibling of "Reach for this when:" rather
  than a bolted-on banner. The row's tools are the tool's own evocative names
  ("The Flip Point," "Could You Be Wrong?"), each a link to the instrument.

**The mapping is curated, high-signal, 1:1 — never spammy.** 22 of the 30 models
earn a bridge. The eight that don't — Compound Interest, Opportunity Cost's
finance cousins Margin of Safety and Incentive Structures, Feedback Loops,
Leverage Points, Regression to the Mean — are the finance/systems/epistemology
concepts with no single instrument that *is* their practice, so they show no row
at all. The bridge appears only where it's earned, which is exactly what keeps
it trustworthy — the same rule the essay bridge follows on the finance essays.

Where a model is genuinely practiced by two instruments, the row shows both:
Self-Distancing → "Cool the Call · Ask Your Older Self" (distance in the moment,
and distance across time); Base Rates → "You Are Not the Exception · Practice"
(the decision instrument, and the trainer). A powerful instrument, in turn,
surfaces under several models — the flip point under three, the comparison under
three, the outside view under three — which is true and useful, not redundant.

## The decisions I'd defend hardest

**Declare on the tool, reverse-look-up per model.** I put the `models` list on
the `Tool`, not a `tools` list on the `Model`, and gave the page a
`getToolsForModel(id)` helper matching its four existing `getXForModel(id)`
siblings. This keeps *all* of a tool's "ideas I practice" data (essays and
models both) in one file, mirrors the `essays`/`getToolsForEssay` pair it's
twinning, and lets `models.ts` stay a pure reference untouched by tool concerns.

**Don't import `models.ts` into `tools.ts` for build-time validation.** The
tempting move — assert every referenced model id exists, throwing at build like
`resolveToolGroups` does for tool ids — would pull all 30 models' long
explanation strings into every bundle that imports `tools.ts`, and `tools.ts` is
in a client bundle (`FindClient` imports it). That's real bundle bloat for a
guard. So I matched the `essays` precedent instead (no cross-module throw) and
validated the other way: a script cross-checking all 22 referenced ids against
the real model ids (zero typos), plus rendering every bridge in the browser and
reading back all 22 rows to confirm each one resolves to the right instrument.

**First among the outward links, mt-3 then mt-2.** The action goes above the
reading, and the "first row gets the larger top margin" rule the page already
used is preserved — the essays row now takes `mt-3` only when no tools row
precedes it, so spacing never doubles up.

## The discipline that kept it honest

- **Reuse over invention.** One new optional field, one helper, one row —
  mirroring `Tool.essays` / `getToolsForEssay` exactly. No new store, no client
  code, no dependency, no new page. It degrades to nothing on the models that
  don't earn it.
- **High-signal, curated mapping.** Only strong 1:1 model↔instrument matches;
  the eight concepts without a true instrument show no row, so the bridge stays
  trustworthy.
- **Rendered, not trusted.** Built the site, served the production build, and
  read every one of the 22 rendered rows — including the two-tool `·` rows — in
  the browser, light and dark. `bun run lint` and `bun run build` both clean.

## What I deliberately left for later

- **The homepage still leads with the personal frame** ("Essays on finance,
  decisions, learning, and craft") and a personal "Currently" block, while the
  genuinely differentiated, useful-to-a-stranger thing — the privacy-first
  decision toolkit — sits below the fold under "Reference." Rebalancing that is
  a real judgement call about the owner's site identity, not a seam fix, so I
  left it untouched rather than quietly hijack the voice.
- **A decision could still use a home of its own.** The carry through-line
  threads a subject from tool to tool, and `/review` gathers the *scheduled*
  returns, but there's no single "everything I've worked on this one decision"
  view. That's a larger, schema-coupled build; noting it here for a future day.
