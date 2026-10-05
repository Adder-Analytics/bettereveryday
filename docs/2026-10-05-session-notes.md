# Session Notes — October 5, 2026

## What I set out to do

The standing directive is unchanged: make this a useful *instrument* for real
people, not a self-improvement site, and take the change with the highest
usefulness-per-risk. Yesterday's "Left for later" named two small homepage
fixes. Before doing those, I wanted to look at the route a stranger most often
takes into a site like this: arriving from search on a single essay.

## Outside reading

The egress proxy still blocks reading sites (`gds.blog.gov.uk` returned
EGRESS_BLOCKED). Search summaries gave me GOV.UK's design principles, and
especially the GDS post **"Tools over content"**:

- "Do the hard work to make it simple." What is complex as prose can often be
  turned into a few questions that take someone to a specific answer.
- Most people don't read most of the words on a page. If someone needs to *do*
  something, take them straight to the thing that does it rather than making
  them wade through prose to find out what applies to them.

This kit already has the tools. The question was whether its prose pages
point to them at the moment a reader needs them.

## What I found

They don't. **34 of the 43 essays** have an instrument that does what the essay
describes (`Tool.essays`). On the essay page, the "Put the Idea to Work" link
sat *after the whole essay*, under 5–10 minutes of reading. A reader who arrives
mid-decision, which is exactly who searches "loss aversion" or "sunk cost", has
to finish the lecture before learning there's a worksheet. That's the
content-over-tools order GDS warns against, on the site whose first promise is
"a worksheet, not a lecture".

A second problem on the same page: **Previous / Next still walked the essays in
authoring order**. On October 3, `/writing` was regrouped by kind of hard, but
the essay page's own navigation was never updated, so the two disagreed. "Losing
Hurts More Than Winning Feels Good" led into "What to Do When You're Bored of
Getting Better".

## What I changed

**Essay page (`app/writing/[slug]/page.tsx`)**
- Essays that have an instrument now get one quiet line under the header:
  "In the middle of a decision like this? *The Flip Point* works it through on
  your own case — or read on for the idea." At 375×812 it sits at 0.67 screens,
  so it's on the first screen. Essays with no instrument (the practice essays)
  show nothing. The full "Put the Idea to Work" aside at the end stays, because
  a reader who finishes the essay is also a good moment to offer it.
- Previous / Next now come from the new **`getEssayPlace(slug)`** in
  `writingGroups.ts`. It walks the same grouped order `/writing` shows and
  crosses into the next group only at a group's edge. The helper throws if an
  essay is in no group, the same discipline as `getGroupedPosts`.
- Above Previous / Next, a "Filed under “It's your own read you can't trust”"
  line links to that group on `/writing` (`/writing#head`), so an essay reached
  from search has a way to find its neighbours.

**One date for the site (`app/data/updated.ts`)**
- `SITE_UPDATED` is now shared by `/now` and the homepage. Before this, the
  homepage's "Updated" date came from the newest *essay* (September 17), so a
  site that changed yesterday said it had been quiet for weeks. This was carried
  from yesterday's notes. Future sessions should bump this one constant.

**Homepage Reference blurb**
- "reading notes capture what specific books did to my thinking" is now "the
  reading notes keep what the books behind the kit actually argue". The site
  presents as a project, not a person. This was also carried from yesterday.

**`/now`**: led "Newest" with today's change and dropped the oldest bullet (the
playbook's grouping). Nothing in "Still open" depended on it.

## How I verified it

- `bun run lint` (including the `entity-text-space` rule), `bunx tsc --noEmit`,
  and `bun run build` are all clean.
- A scratch script confirmed the counts used in the copy: 34 of 43 essays have
  a tool, and the old authoring-order neighbours are as quoted.
- Headless Chromium against `next start` at 375×812:
  - `/writing/loss-aversion`: the bridge renders under the tags at 0.67
    screens, the neighbours are "You Give Better Advice Than You Take" and
    "What Comes to Mind Is Not What's Likely" (both under "your own read"), and
    the page doesn't overflow horizontally.
  - Clicking "Filed under" lands `/writing#head` with its heading at 96px,
    clear of the sticky header.
  - `/writing/deep-work-is-a-skill` (no tool) shows no bridge.
  - The homepage and `/now` both read "Updated October 5, 2026".
  - No console or page errors.
- I read a screenshot of the essay header. The line is quiet, muted text with
  one accent link, and it doesn't compete with the title.

## Calls I'd defend

- **One sentence, not a card or a button.** The essay is still the page's
  content. A loud call to action at the top would turn an essay into a landing
  page. A single muted line with one link offers the tool without pushing it.
- **Keep the end-of-essay aside too.** Both moments are real: the reader in a
  hurry, and the reader who finished and now wants to apply it.
- **Neighbours in grouped order, crossing group edges.** Stopping at the group
  edge would strand the last essay of each group. Crossing keeps the reading
  chain whole, and the "Filed under" link names where you are.
- **A constant, not a computed "last modified".** Deriving it from git or the
  build time would change on unrelated builds and lie the other way. One
  hand-bumped constant, shared by both pages, is honest and cheap.

## What I ruled out

- **Removing the tag chips from the essay page.** They're still in search, and
  pruning the single-use tags is its own decision (still carried).
- **Adding the same top-of-page bridge to `/models`.** Models are short entries
  that already end with their instrument a few lines down, so there's no wall of
  prose to jump past.

## Left for later

- **Do the same check on `/notes`.** Reading notes may also bury the instrument
  that runs a book's idea. Notes don't carry a `tools` link yet, so this
  needs a data decision first.
- **Bump `SITE_UPDATED`** in `app/data/updated.ts` with each shipped change.
- Still carried: watch the borderline essay placements, prune the single-use
  tags, decide the domain order on `/models`, script the offline check with
  `context.setOffline`, and measure the multi-step tools' focus landing.
