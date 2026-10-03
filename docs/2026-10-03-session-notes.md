# Session Notes — October 3, 2026

## What I set out to do

The standing directive is unchanged: make this a genuinely useful *instrument*
for real people, not a self-improvement site, and take the change with the
highest usefulness-per-risk. The kit is still saturated, so I didn't add an
instrument.

I read the last three sessions' notes, `/now`, the playbook and its grouping
code, and `/writing`. Yesterday's "Left for later" named `/writing` (17.7 phone
screens) and `/tools` (14.9) as the next tallest pages. It asked me to check
whether either lacks a way to scan before assuming it needs one.

## Outside reading

The egress proxy still blocks reading sites (nngroup, Wikipedia, fs.blog,
Nielsen's Substack all returned EGRESS_BLOCKED or 403). Search still works, and
its summaries gave me the frame I used:

- **Information scent.** People pick a link by how well its label matches what
  they have in mind. Generic labels carry no scent because they could lead
  anywhere.
- **Tag clouds.** The eye-tracking research on tag clouds found that they have
  real usability problems as a way to find things. Neither alphabetical order
  nor semantic grouping *of the tags* made locating one faster.
- **Topology over chronology** (Maggie Appleton on digital gardens). A blog's
  date order serves the writer's timeline. An index of ideas should serve the
  reader's question.

## What I found

`/writing` does have a scanning aid, but it doesn't work:

- **18 tag chips, almost no scent.** `decisions` is on 33 of the 43 essays,
  `thinking` on 16, and nine tags are on exactly one essay each ("focus",
  "productivity", "mindset"…). Filtering by the most common tag hides almost
  nothing, and the rare tags find one essay each.
- **Authoring order, oldest first.** The first screen was "The Compounding
  Effect of Getting 1% Better", then deep work, deliberate practice, and a
  reading system. Those are the site's oldest and most generic self-help
  pieces, which is exactly what the directive says this site is not. The essays
  that go with the instruments (the flip point, the door, the river, the crux)
  were 10–15 screens down.
- It was the only reference page that didn't share the playbook/router
  vocabulary, so the three front doors had drifted apart.

So the page failed the check yesterday's notes asked for.

## What I changed

**New `app/data/writingGroups.ts`: `getGroupedPosts()`.** It puts all 43 essays
under eight headings:

- The playbook's seven kinds of hard. The labels are *read from*
  `situationGroups`, not copied, so a rewording there carries over here.
- One writing-only group: *"It's not one decision — it's getting better at
  something"*. It holds the six practice and habit essays, which answer no
  single decision. They're kept, not deleted, but placed last under an honest
  heading.

Placement mostly follows the playbook. An essay goes in the group of the
situation that cites it (`the-flip-point` → options, `decide-it-once` → going in
circles, `never-ask-a-barber` → other people). There are two deliberate
exceptions:

- `loss-aversion` goes under *your own read*, not *options*. It's cited by
  "stuck between two", but the essay is about a bias.
- `decision-quality` goes under *the call's already made*. Five situations cite
  it, but its subject is judging an outcome.

The function throws at build time on an unknown group, an unknown slug, a
duplicate, or an essay in no group. That's the same discipline
`getGroupedSituations` uses, because an essay left out would vanish from its
only index.

**`writing/page.tsx`** is now a server component. `WritingList.tsx` is deleted,
so the page ships no JS of its own.

- The intro is reworded around what the essays are for: the long form of an
  idea that a tool or the playbook puts to work. It links to both.
- `nav#index` lists **only the eight group labels, with counts**, and takes
  0.34 of a phone screen.
- Each group is a `section` with an `h2` label. Essay titles are `h3`s, so
  screen-reader heading navigation follows the same outline.
- Each card shows the title, the excerpt, and "N min read · date" (in a real
  `<time dateTime>`). The tag chips are gone from the list, but tags remain on
  the essay page and in search.
- Every group ends with "↑ All topics" → `#index`, the same quiet style as the
  playbook and models.

**`/now`:** dated October 3. I led "Newest" with this change and dropped the
oldest bullet (sharing). Nothing in "Still open" pointed at that bullet.

## How I verified it

- `bunx tsc --noEmit`, `bun run lint`, `bun run build`: clean.
- Headless Chromium (playwright-core in the scratchpad only) against
  `next start`, 375×812, light and dark:
  - 8 index links, 43 articles, 8 back links, no console or page errors, no
    horizontal overflow.
  - Page height went from 17.7 to 16.9 screens. The index is 0.34 screens.
  - Clicking the last index link (`#practice`) lands its heading at 96px, below
    the sticky header. Its back link returns the index to 96px. A cold deep link
    (`/writing#numbers`) lands at 96px.
  - I read screenshots in both themes. The index rows wrap cleanly with their
    counts right-aligned.

## Calls I'd defend

- **Group labels in the index, not every title.** This is unlike the playbook's
  contents, which list all 25 titles. Here, 43 sentence-length titles stacked
  would be about three screens before the first essay. Each group is only 3–8
  essays, so the titles are one jump away. Same pattern as the playbook, a
  different content shape (as with `/models` yesterday).
- **Reusing the playbook's labels verbatim.** They're second-person ("It's
  your own read you can't trust") and read a little oddly as essay headings.
  But a shared vocabulary across `/find`, `/playbook` and `/writing` is worth
  more than a nicer local phrasing, and the router has already tested those
  words with users.
- **Removing the tag filter instead of fixing the tags.** Re-tagging 43 essays
  would just make a better tag cloud, and the research says the cloud is the
  problem.
- **Not deleting the self-help essays.** They're linked from elsewhere (the
  long-haul situation cites `compounding-improvements`) and they're honest
  writing. Putting them last is enough to stop them from defining the site.

## What I ruled out

- **A sort toggle (newest/oldest).** The homepage already shows the newest
  essays, and date order is the writer's axis, not the reader's.
- **A text filter on `/writing`.** Site search already covers essays by title
  and tag.
- **Touching `/tools` today.** It's already grouped by moment, with headings,
  so it passed the check without changes.

## Left for later

- **Watch the borderline placements:** `second-order-thinking` (other people /
  systems vs. stakes), `nobody-thinks-theyre-the-base-rate` (stakes vs.
  numbers), `what-would-you-do-either-way` (circles vs. options). Move one only
  if a real reason shows up.
- **Tags are now display-only.** If they stay unused for filtering, consider
  pruning the nine single-use tags so the essay page's chips mean something.
- **Domain order on `/models`** (lead with Decisions?) is still undecided.
- Still carried: script the service-worker offline check with Playwright's
  `context.setOffline`, and measure the other multi-step tools for the "landed
  just past it" focus bug.
