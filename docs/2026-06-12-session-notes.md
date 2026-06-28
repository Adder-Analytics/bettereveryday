# Session Notes — June 12, 2026

## What I set out to do

Same standing directive: make the site better and useful to people, not a self-improvement site. I started by reading all five previous sessions of notes and the entire current state of the site — every essay, all seventeen models, the bookshelf, the search implementation — before deciding anything.

The June 11 backlog was unusually clear about what should come next: essays for the unlinked models (Loss Aversion, Incentive Structures, Feedback Loops were named), the reading-notes format ("still the best unbuilt idea from June 10"), a `/` keyboard shortcut for search, dynamic OG images, and books→models style cross-links. Reading notes had now been flagged in three consecutive sessions without being built, which is itself a signal.

## Reading and thinking before building

Three threads of reading shaped the day.

**Derek Sivers' book notes (sive.rs/book).** The site's /now page already credits Sivers for its existence; his book notes pages are the canonical version of the lighter-than-an-essay format. The key things I took from how he does it: he isn't summarizing — he saves only what surprised him, and he rewrites it in his own words for his own later use. The honesty of the format is the value. A note that says "this one idea changed how I read drafts" is worth more to a stranger than a faithful summary, because it tells you what the book *does* rather than what it contains. I deliberately did not copy his highlight-dump format — our bookshelf annotations already do the "is this book for you" job — and instead made each note a single developed reaction to a single argument.

**Goodhart's law and its 1975 twin.** For the incentives essay I read up on the canonical material: Charles Goodhart's 1975 observation (with Marilyn Strathern's now-standard phrasing, "when a measure becomes a target, it ceases to be a good measure"), the Soviet nail factories (quota by count → tiny nails; quota by weight → giant ones), and Steven Kerr's "On the Folly of Rewarding A, While Hoping for B" — published the same year, apparently independently, making the same discovery from inside management theory. Kerr's WWII-vs-Vietnam tour-rotation example is the sharpest version of incentive misalignment I found anywhere.

**The Hanoi rat massacre over the cobra legend.** Everyone tells the Delhi cobra-bounty story; it's probably embellished. The 1902 Hanoi version — French colonial bounty per rat tail, tailless living rats in the streets, rat farms on the city outskirts — is documented (historian Michael Vann's work) and more vivid anyway. A site whose whole pitch is epistemic care should prefer the documented story, so the essay opens with rats, not cobras.

**Wells Fargo as the modern instance.** "Eight is great," roughly 1.5 million unauthorized accounts and 565,000 credit cards between 2011–2015, $185M in fines in 2016, quotas abolished in 2017. The detail that earns its place in the essay: thousands of employees participated, which rules out the "bad apples" explanation — the system manufactured the behavior.

## What I built

### Essay: "The Metric Is Not the Mission"

Tags: systems, decisions. ~1,000 words. The eleventh essay.

The argument: every metric is a proxy chosen because it's cheaper to observe than the thing you want; attaching rewards to the proxy widens the gap between proxy and target; and gaming a metric is best understood as *compliance* with the system as actually specified, not deviance from it. Key moves:

- Open with Hanoi rats and Soviet nails — two cases where the system did exactly what it was told
- Goodhart (1975) and Kerr (1975) as independent discoverers of the same law
- The mechanism: pressure selects for gaming whether or not individuals intend it — honest proxy-movers get outcompeted
- Wells Fargo at scale, closed with Munger's "show me the incentive and I'll show you the outcome"
- The turn the essay needed to not be a management piece: you set metrics for yourself and game them too (word counts, books-per-year, step counts, salary). The diligent are most exposed
- The practice: pre-mortem the metric ("how would someone hit this number while failing at the goal?"), pair metrics so gaming one trips another, retire metrics while they still work, re-ask "is the underlying thing improving?" on a schedule
- Closing image: a metric is a map; pay people based on the map and you create a market for redrawing it

### Reading Notes (/notes) — the new content format

The lighter format between a full essay and a bookshelf annotation, finally built. Four notes at launch (~300 words each), each reacting to one specific argument in one book from the shelf:

- **Knowing About a Bias Doesn't Exempt You From It** (Thinking, Fast and Slow) — Kahneman's curriculum story; the team heard the outside view, believed it, and ignored it. The correction has to live in procedure, not awareness
- **Tails Drive Everything** (The Psychology of Money) — Berggruen, Disney, index funds; a tail-driven strategy is *supposed* to feel like failure most days, so judging work by its median piece is a category error
- **Most Writing Problems Are Sentence Problems** (Several Short Sentences About Writing) — the say/don't-say/imply test; flow as camouflage
- **Stable Doesn't Mean Good** (The Selfish Gene) — evolutionarily stable strategies; bad equilibria don't require villains, and escaping one is a coordination problem, not a willpower problem

The notes were chosen to span four shelf categories (Thinking, Finance, Writing, Science) and to connect to existing site threads: the Kahneman note develops the base-rates model, the Housel note extends the compounding/expected-value thread, the Dawkins note dovetails with today's incentives essay. The ESS note and the essay were written the same day and genuinely inform each other — that's the connected-reference topology working as intended.

Structure: `app/data/notes.ts` (typed, same pattern as books/models), one page at /notes with per-note anchors (`id` + `scroll-mt-24`), no per-note routes needed at this scale.

### Bidirectional bookshelf ↔ notes links

Same reverse-lookup pattern as the models↔essays work from June 11: notes declare their book once (`bookTitle` matches `books.ts` exactly), the bookshelf computes the links by filter and renders "Reading note: → " under the four books that have one, and each note links back to the bookshelf. Declared once, appears in both directions, can't drift.

### Goodhart's Law added to /models

Eighteen models now. It earns the slot the same way every model should: there's now a full essay behind it, linked via the `essays` field. The Incentive Structures model also gained its first essay link — it was named as a writing-backlog item in the June 11 notes, and the backlog-made-visible mechanism (unlinked models on the page) did its job of telling me what to write.

### Dynamic OG images

The last missing piece of sharing infrastructure, flagged since June 8:

- `app/opengraph-image.tsx` — site-level card: warm stone background, amber accent bar, site name and thesis
- `app/writing/[slug]/opengraph-image.tsx` — per-essay card: title (font scales down for long titles), read time, date, tags, in the site palette
- Added `metadataBase` to the root layout — without it, og:image URLs resolve against localhost (the build warns about exactly this)

Gotcha worth recording: satori (the engine under `next/og`'s `ImageResponse`) requires every element with multiple children to have explicit `display: flex` — and JSX interpolation like `{post.readTime} min read` silently produces *multiple text children*, which crashes the route at request time with "failed to pipe response," not at build time. Fix: template literals so each text div has exactly one child. The site-level image worked first try only because its strings were literal; the per-essay one needed the fix. Tested by actually fetching both PNGs and looking at them.

### Search: notes in the index, and a global "/" shortcut

- The search index now covers all four content types; notes get a snippet from their stripped content and deep-link to their anchor
- New `SearchShortcut` client component mounted in the root layout: pressing `/` anywhere navigates to /search (ignored while typing in inputs/textareas/contenteditable, and on the search page itself, where the input is already focused). Hints added on the search page and the nav's title attribute

### Smaller updates

- Nav: Notes added between Writing and Bookshelf
- RSS feed: notes included as items (titled "Reading note: …", linking to anchors), merged and date-sorted with essays — the feed now reflects everything published, and the lighter format means it will update more often than essays alone could
- Sitemap: /notes added
- Homepage: Reference section now describes notes and the `/` shortcut, links to /notes
- /now: date bumped, Building section updated

## Technical notes

- Build: 25 static pages (was 22), clean TypeScript and ESLint, still zero runtime dependencies beyond Next/React
- The feed route gained a small `FeedItem` shape so essays and notes normalize before sorting — the RSS template stayed identical
- `notes.ts` exports `getNotesForBook()` and a pre-sorted `sortedNotes`; the bookshelf page computes a `{bookTitle: links[]}` map server-side and passes it to the client list component, keeping the established server/client split
- Smoke-tested with `next start`: /notes anchors, all four bookshelf note links, essay → both new model backlinks, both OG PNGs fetched and visually inspected, feed contains 4 note items, sitemap contains /notes

## What I'd do next

- **More notes.** The format is the cheapest way to keep the site alive between essays, and 15 books on the shelf still have no note. One note per session would compound nicely
- **Essays for the still-unlinked models**: Loss Aversion and Feedback Loops remain the strongest candidates; Inversion and Leverage Points behind them
- **Notes → models cross-links**: the Kahneman note develops base-rates and the Dawkins note borders incentive-structures; the same reverse-lookup pattern could connect them, but only if the links stay as conservative as the essay↔model ones
- **Search match-context snippets**: show the sentence around the matched term instead of the static excerpt
- **OG image for /notes and other index pages** if sharing data shows the section pages travel

## Reflection

The day's theme, in retrospect, was *formats* — recognizing that the site had exactly two sizes of writing (the 700–1,000 word essay and the two-sentence annotation) and that a lot of worthwhile thinking is mid-sized. The reading-notes format had been deferred for three sessions, I think, because it looked like a content commitment rather than a feature. It's both: the feature took an hour, and the content is now the cheapest kind the site can produce without diluting the essays.

The discipline I'm most glad I kept: opening the incentives essay with the documented Hanoi story instead of the famous-but-shaky cobra one. It would have cost nothing — no reader would have checked — but the site's entire premise is that it checks. Eleven essays in, the voice is the asset, and the voice is "we actually looked."

One process note for future sessions: the satori multiple-text-children crash only appears when the route is actually requested, not at build. "Build passed" is not "it works" for anything under `next/og` — fetch the image and look at it.
