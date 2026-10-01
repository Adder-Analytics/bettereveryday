# Session Notes — October 1, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people, not a self-improvement lecture, and take the change with the
highest usefulness-per-risk. The kit is saturated, so no new instrument.

I read the last two sessions' notes, the `/now` page, the router's grouping code
(`triage.ts`, `FindClient.tsx`), the playbook and its data (`situations.ts`).
For outside reading I tried the GOV.UK design principles and Wikipedia's
decision-fatigue entry, but the sandbox's egress proxy blocks both. So I
re-read the design-engineering skill (Emil Kowalski's craft notes) instead.
The line I worked from: *"when a feature functions exactly as someone assumes it
should, they proceed without giving it a second thought."* A long reference page
that strands you forty screens deep fails that test in a way nobody files a bug
about.

## How I picked it: measure the whole site first

Instead of guessing, I ran a sweep. I built the site, ran `next start`, and
loaded every URL in the sitemap in headless Chromium at 375×812. For each page I
recorded console and page errors, horizontal overflow (any element past the
viewport not inside a scroll or clip container), and page height in phone
screens. The script is in the scratchpad, not the repo.

- **Errors: none. Horizontal overflow: none, on all ~85 pages.** The
  accessibility and size work from September holds.
- **Height was the outlier:** `/playbook` 44.7 screens, `/models` 37.3,
  `/writing` 17.7, `/tools` 14.9. Every tool page is under 9.

The playbook was the clearest case. Its contents list held 25 situations in
authoring order: "one-way door", then "a number appears", then "vivid story"…
That's the same flat wall the router's "what's making it hard?" node was until
yesterday. Once you jumped into a situation there was **no way back to the
list** short of scrolling. The `/now` "Still open" section says a new moment
should show up in both front doors at once. The router got grouped and the
playbook didn't, so they had drifted again, in structure rather than in content.

## What I changed

**`situations.ts`: `situationGroups` + `getGroupedSituations()`.** The 25
situations sit under seven headings. The first five are the router's kinds of
hard, reworded into the playbook's second person:

- *It's the options themselves*: whether-or-not, down to two, can't stop
  looking, any other decision
- *It's what could go wrong — or whether it's as big as it feels*: one-way
  door, bad tail, over-thinking the reversible, promising a deadline, the long
  haul
- *It's your own read you can't trust*: hot, can't advise myself, a pull that
  won't settle, fairly sure already, a vivid story
- *You keep going round in circles*: not enough to decide, time to quit,
  re-deciding
- *It's other people — or the system they're in*: being sold, deadlocked,
  designing incentives, a stubborn system

The last two are playbook-only kinds that the router reaches by a different
question:

- *There's a number in it*: a number appears, needing an estimate
- *The call's already made*: make it happen, judging a decision

`getGroupedSituations()` throws at build time on a duplicate group, an unknown
id, a situation in two groups, or a situation in none. I tested that by
dropping one id: the build failed and named the situation. A situation left
out would vanish from the page and break every `/playbook#id` link to it,
including links from `/cool`, `/quit`, `/act`, `/decide`, `/models` and search.

**Display order only.** The `situations` array keeps its order, so the
worksheet picker and search are untouched, and every `#id` anchor is unchanged.

**`playbook/page.tsx`:**

- The contents list (`#situations`) is grouped under eyebrow labels.
- The body is grouped too. Group labels are now the `h2`s and situation titles
  the `h3`s, so screen-reader heading navigation follows the same outline. The
  contents list uses labelled lists, not headings, so the outline isn't
  duplicated.
- Every situation ends with a quiet "↑ All situations" link.

**`/now`:** dated October 1. I led "Newest" with this change and dropped the
oldest bullet (installable/offline). I also extended the "Still open"
caveat: the playbook's seven groups are a first cut, just like the router's
five.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint`, `bun run build`: clean.
- Headless Chromium against `next start`, phone width, light and dark:
  - Heading outline: H1 → H2 (kind) → H3 (situation); 25 sections, 25
    contents links, 25 back links.
  - Contents link to the last situation (`judging-a-decision`): its heading
    lands at 96px, below the sticky header. Its back link returns the
    contents to 96px.
  - A cold deep link (`/playbook#time-to-quit`, the shape `/quit` and `/cool`
    use) lands at 96px.
  - No page errors in either scheme. Screenshots read in the site's existing
    eyebrow style.
- Page height is unchanged (44.5 screens). That's expected: the win is in what
  you have to scan, and in the way back.

## Calls I'd defend

- **Not reusing the router's labels verbatim.** The router speaks in first
  person ("I keep going round in circles") because you're answering it. The
  playbook's titles are second person ("You keep re-deciding…"). A heading in
  the other voice over its own items reads as a glitch. The ids and the kinds
  are shared; the wording is not. If the router's clusters move, move these too.
- **No jump-chip row.** The router needed chips because its list sits under a
  question. Here the contents list *is* the table of contents, so chips above
  it would be a contents for the contents.
- **"Any other decision" under *options*,** not in a group of its own. An
  eighth heading holding one item is noise, and "it doesn't fit a category"
  is still a problem with the options.
- **The back link goes to the top of the contents, not to your own group.** It
  does what its label says, and the whole list is only ~3 phone screens.

## What I ruled out

- **Collapsing the playbook into disclosures** (show only titles; expand one).
  That would cut the 45 screens, but it hides the scene and question that make
  a situation recognisable. It also breaks find-in-page and the deep links
  other pages rely on.
- **Grouping `/models` the same way today.** It's the next tallest page (37
  screens), but it's browse-by-concept by design and already has its own
  structure. That's a separate read, not a rider on this change.

## Left for later

- **`/models` at 37 phone screens.** Check what its in-page navigation looks
  like before deciding whether it needs anything at all.
- **The site-wide sweep is worth keeping as a habit.** Overflow, errors and
  height took about a minute for every route and found nothing broken, which
  is itself worth knowing. A future session could commit it as a script if
  the project ever adds a test runner. It needs `playwright-core`, which isn't
  a dependency, so it stays in the scratchpad for now.
- Carried forward from Sept 30: check the other multi-step tools for the
  "landed just past it" focus bug. A quick read today suggests they're at low
  risk: `premortem` calls `top()` on every step change, and the
  `estimate`/`update` trainers reveal content below rather than swapping it.
  That's from reading the code, not from measuring.
