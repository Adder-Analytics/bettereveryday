# Session Notes — October 2, 2026

## What I set out to do

The standing directive is unchanged: make this a genuinely useful *instrument*
for real people, not a self-improvement lecture, and take the change with the
highest usefulness-per-risk. The kit is still saturated, so I didn't add an
instrument.

I read the last two sessions' notes, the `/now` page and `/models`. Yesterday's
"Left for later" named `/models` as the next tallest page (37 phone screens) and
asked for a look at its in-page navigation before deciding anything.

## Outside reading

The egress proxy blocks most reading sites again (nngroup.com and
mediawiki.org both returned EGRESS_BLOCKED). Search still works, and its
summaries of the NN/g table-of-contents article and Wikimedia's TOC work gave
three points I used:

- Attention concentrates at the top of a page, so content low on a long page
  goes unread. A contents list at the top makes it discoverable.
- On mobile there's no side rail. Putting the contents directly above the
  content is the simplest arrangement that works.
- On long pages, back-to-top links matter most on phones.

Those confirmed the check yesterday's notes asked for. `/models` had none of it.

## What I found

`/models` has 34 models under five domain headings, authored as one long
column. There was **no contents and no way back up**. Someone who came for
"Goodhart's Law" (from search, or from memory of reading it once) had only
the scroll bar across ~37 screens. The playbook fixed exactly this yesterday,
so the two reference pages had drifted apart in structure.

## What I changed

**`models/page.tsx`:**

- A `nav#index` (aria-label "Models") under the intro. It's grouped by
  domain using the site's eyebrow labels, and each domain is a labelled
  `<ul>`. Model names are short, so each domain's list **wraps inline** instead
  of stacking one per line. The whole index is **0.73 of a phone screen**.
  The playbook's list stacks because its titles are sentences. These are
  names, so stacking would have spent ~4 screens on a contents list.
- Every model ends with a quiet "↑ All models" link to `#index`, the same
  style as the playbook's "↑ All situations".
- Model ids and every `/models#id` anchor are unchanged. Nothing else on the
  site needed touching.

**`/now`:** dated October 2. I led "Newest" with this change and dropped the
oldest bullet (the five playbook moments). One "Still open" line said "the five
distinct moments *above*", which would have pointed at the bullet I removed, so
I reworded it to stand alone.

## How I verified it

- `bun install` (the fresh container had no `node_modules`), then
  `bunx tsc --noEmit`, `bun run lint`, `bun run build`: clean.
- Headless Chromium (playwright-core in the scratchpad only) against
  `next start`, 375×812, light and dark:
  - 34 index links, 34 back links, no page errors, no horizontal overflow.
  - Index height: 0.73 screens. Page height went from 37.3 to 39.5 screens.
    That's the honest cost of the index plus the back links; the win is in
    finding, not in pixels.
  - Clicking the last index link lands its heading at 96px, below the sticky
    header. Its back link returns the index to 96px. A cold deep link
    (`/models#inversion`) lands at 96px.
  - Screenshot read in dark mode: the eyebrow labels and wrapped accent links
    match the playbook's contents.
- Reminder that still holds: `pkill -f "next start"` exits 144 (it kills its
  own shell). It's harmless, but run it on its own.

## Calls I'd defend

- **Inline-wrapped names, not a stacked list.** This is a deliberate departure
  from the playbook's contents. Same pattern, different content shape.
- **Not reordering the domains.** The page opens on Finance ("Compound
  Interest") even though the site is a decision toolkit and Decisions holds 15
  of the 34 models. Moving Decisions first is tempting, but the index now
  shows every domain in one glance, so order matters much less than it did
  this morning. Reordering is a separate, low-stakes call. I've noted it below
  rather than slipping it in.
- **No collapsible index.** The research summary suggests collapsing long
  tables of contents on mobile. This one is under a screen, so collapsing it
  would hide the useful part to save almost nothing.

## What I ruled out

- **Taglines in the index.** They would make it a second copy of the page.
- **A sticky or floating "back to top" button.** It would sit on top of
  content on a phone, and the per-model link does the same job without
  covering anything.
- **A filter box on `/models`.** Site search already covers models, and with a
  one-screen index, find-in-page plus the index is enough.

## Left for later

- **`/writing` (17.7 screens) and `/tools` (14.9)** are the next tallest pages.
  Check whether either lacks a way to scan before assuming it needs one.
  `/tools` is already grouped by moment.
- **Domain order on `/models`.** Consider leading with Decisions. It's one
  line in `models.ts` (`domains` is derived from authoring order), but it
  changes what a first-time visitor reads first, so decide deliberately.
- Still carried: script the service-worker offline check with Playwright's
  `context.setOffline`, and measure the other multi-step tools for the
  "landed just past it" focus bug instead of relying on reading the code.
