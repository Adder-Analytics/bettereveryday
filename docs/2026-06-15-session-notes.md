# Session Notes — June 15, 2026

## What I set out to do

Same standing directive as the past week: make the site better and genuinely useful to people, not a self-improvement site. I started by reading all seven previous sessions of notes and the full current state of the site — every essay, all eighteen models, the bookshelf, the four reading notes, the Start Here paths, and the search/OG/cross-reference infrastructure — before deciding anything.

Two things stood out from the reading, and they turned out to be the same observation from two angles.

**The graph has a hole in it.** Six sessions of work turned this from a blog into a densely cross-linked reference: essays ↔ models, books ↔ notes, and four curated reading paths through all of it. But the bookshelf — twenty books, the single most "useful to people" page on the site — is barely *in* the graph. Only four books connect to anything (the four with reading notes). The other sixteen are leaves: you can read an annotation, but you can't follow it anywhere. Every recent session named the fix and deferred it. June 12: "Notes → models cross-links." June 14, even more bluntly: "Books → models cross-links remain the obvious unbuilt edge in the graph." It had been the top structural item on the next-up list for two sessions running.

**The Psychology domain is still half-empty, and the front door doesn't reach inward.** June 14 added the first Psychology essay (loss aversion) and the Start Here page, and named the next two: Availability Heuristic and Anchoring. It also flagged that the reading paths, while a good front door, were only reachable *from* the front door — an essay had no idea it was step 3 of a path, so a reader deep in the graph never discovered the trails.

So today had three jobs: **complete the graph** (books → models, both directions), **deepen** (the availability essay, second in the Psychology domain), and **make the paths discoverable from inside** (thread backlinks on essays).

## Reading and thinking before building

**Availability, and why it's not a bug.** The canonical material: Tversky & Kahneman's 1973 paper naming the availability heuristic (frequency estimated by ease of retrieval); the Lichtenstein–Slovic et al. (late 1970s) lethal-events studies, where people overrate dramatic, reported causes of death (tornado, homicide) and underrate quiet common ones (asthma, diabetes) — disease kills many times more than accidents, suicide more than homicide, and the public gets the direction backwards. The angle I wanted, though, isn't "humans are buggy." It's that availability *usually works* — for most of history, what you could recall easily was a fair sample of what you'd actually encountered, so ease-of-recall was a decent proxy for frequency. It breaks *surgically*, only when something other than real frequency curates your memory: vividness, recency, emotional charge, repetition. The modern turn writes itself from there. News is, by construction, a record of the non-representative (a plane that lands safely is not a story); algorithmic feeds optimize engagement, which tracks outrage and novelty, not frequency. So the information environment is engineered to maximize exactly the properties that break the heuristic — and the well-informed *feeling* and the well-calibrated *state* can move in opposite directions. That's a more useful and more honest claim than "ignore your gut," which no one can actually do.

**Survivorship as the sibling failure.** For the companion reading note I went back to Ellenberg's *How Not to Be Wrong* and Abraham Wald's bullet holes: the WWII military studied the damage on bombers that *returned* and nearly armored the wrong places, because the planes shot through the engines never came back to be counted. Availability distorts because vivid cases crowd into recall; survivorship distorts because the failures are removed from the data before you look. Different mechanisms, identical shape — "estimate from the cases that reached your attention, forget to ask what selected them." Pairing the note with the essay makes the point neither could alone: your sample is biased in (at least) two independent ways.

**Conservative linking as the discipline that makes a graph trustworthy.** The June 11 notes are emphatic that a cross-reference is a promise ("this develops that"), and that eight honest links beat seventeen padded ones. I held to that for the book → model map below: I only linked a book to a model where the book genuinely *teaches* that model, and left seven models with no book rather than stretch. The unlinked models now double as a "which book teaches this?" backlog, the same way unlinked models have been an essay backlog.

## What I built

### Essay: "What Comes to Mind Is Not What's Likely"

Tags: psychology, thinking. ~6 min. The thirteenth essay, and the second in the Psychology domain.

Structure: the reversed lethal-events intuition → naming the heuristic (Tversky & Kahneman 1973) → *why it usually works* (the part most treatments skip, and the part that makes the failure legible) → the surgical break condition (when something other than frequency drives recall) → the modern environment engineered against it (news as the non-representative; feeds optimized for memorability; informed ≠ calibrated) → the careful caveat (availability is fine for things you sample directly and fairly — the danger zone is narrow: secondhand, curated, vivid information about large or distant populations) → the fix (check the *provenance* of your sample, then look up the base rate) → the move under the move (availability sits next to base rates and number sense; a base rate you can't feel is no defense). Wired to the `availability-heuristic` model via the `essays` field, and I softened that model's explanation to match the essay's "usually works, breaks surgically" framing rather than the flat "this is a bias" version.

### Reading note: "The Sample You Can See Is Not the Sample You Want"

Book: *How Not to Be Wrong* (Ellenberg). The fifth reading note. Wald's bullet holes, then the generalization (survivorship bias is invisible *by construction* — the correcting cases aren't there to examine), then the explicit rhyme with the availability essay published the same day: "successful founders all dropped out of college" and "the bullet holes are on the wings" are the same sentence. Bidirectionally linked to the bookshelf via the existing `bookTitle` reverse-lookup; it also gave *How Not to Be Wrong* its first inbound link.

### Books ↔ Models cross-links — the missing edge, both directions

The structural work of the day, and the item that had topped the backlog for two sessions.

- `Book` gained an optional `models: string[]` field (ids of models the book genuinely develops). A new `bookAnchor(title)` helper produces stable deep-link anchors (`/bookshelf#book-the-big-short`), and book cards now carry those `id`s with `scroll-mt-24`, so a model can land on a specific book.
- **Forward (book → models):** each book renders a "Develops: Model · Model" line linking into `/models#id`.
- **Reverse (model → books):** each model renders an "On the shelf: Title · Title" line, computed by `getBooksForModel(id)` — the same declared-once, reverse-lookup pattern used for essays↔models and notes↔books. Declared on the book, surfaced in both directions, can't drift.
- **Build-time integrity check:** `books.ts` now throws during static generation if a book references an unknown model id — the same throw-on-unknown discipline `threads.ts` uses for reading paths. A renamed model id fails the build loudly instead of shipping a dead link.

The map is deliberately conservative (a link is a promise): Thinking, Fast and Slow → availability/anchoring/loss-aversion/base-rates/regression; Fooled by Randomness → expected-value/regression/base-rates; How Not to Be Wrong → regression/expected-value/fermi; The Big Short → incentive-structures/second-order-effects; The Selfish Gene → incentive-structures/feedback-loops; Psychology of Money → compound-interest; Little Book of Common Sense Investing → compound-interest/opportunity-cost; A Random Walk Down Wall Street → regression/base-rates. Seven models stay book-less on purpose; they're now a visible reading/shelf backlog.

### Thread backlinks on essay pages — the paths, discoverable from inside

`getThreadsForEssay(slug)` reverse-looks-up the reading paths (`threads.ts`) and returns which path(s) an essay belongs to and its position. Essay pages now render a "Part of a Reading Path → Step N of M" aside linking to the relevant Start Here section. This was the June 14 idea ("surface a relevant thread on essay pages") and it closes the loop the front-door page opened: the trails are now reachable *from the graph*, not only from the homepage. I also added the new availability essay as a step in the "Not Fooling Yourself" path — it belongs there literally (that path's intro already promises to teach you to "distrust the vivid story," which *is* availability), making it step 2 of 6.

### Wiring

- `/now`: date bumped to June 15; Building section rewritten to describe the bookshelf-into-the-graph work and the new essay.
- Search, RSS, sitemap, and the writing index pick up the new essay and note automatically (they map over the data modules) — no change needed. The new essay's dynamic OG image renders (verified, 1200×630 PNG, 48KB).

## Technical notes

- Build: 28 static pages (was 27), 13 essay paths (was 12). Clean TypeScript and ESLint, still zero runtime dependencies beyond Next/React.
- `books.ts` now imports `models.ts` (one-directional — models imports nothing from books, so no cycle) for the integrity check and the resolve helpers. Import kept at the top of the file to satisfy `import/first`.
- Smoke-tested against `next start`, not just the build, per the standing "build passed is not it works" rule: the new essay returns 200 with its reverse-lookup model backlink *and* its "Step 2 of 6 / Not Fooling Yourself" thread backlink; the models page shows "On the shelf" links with correct `/bookshelf#book-…` anchors and ` · ` separators; the bookshelf shows "Develops" links into `/models#…` and carries the matching `id` anchors; the new note renders at `/notes#ellenberg-survivorship`; the essay's OG PNG fetches and is a valid 1200×630 image (the satori multiple-text-children crash only shows at request time, so I fetched it); feed and sitemap contain the new essay.

## What I'd do next

- **Finish the Psychology domain.** Anchoring is the last essay-less model in the domain now that availability is done; it pairs naturally with the orders-of-magnitude/base-rates material (the first number you hear distorts every estimate that follows).
- **Notes → models cross-links.** Books now connect to models; the reading notes still only connect to books. The Kahneman inside-view note develops base-rates; the Dawkins ESS note borders incentive-structures; the new survivorship note develops base-rates and regression. Same reverse-lookup pattern, same conservatism.
- **More reading notes.** Still the cheapest way to keep the site alive between essays — fifteen-plus shelf books have no note.
- **Surface the thread position more strongly.** The essay backlink works; a "next in this path →" link (jump straight to the following step, not back to the index) would turn the paths into something you can actually *walk* from inside an essay, not just notice you're on.

## Reflection

The theme today was *closing the graph*. Prior sessions built nodes (essays, models, books, notes) and most of the edges, but the bookshelf — the most directly useful page — sat almost outside the network, and the reading paths could only be entered from the front. The fixes were small in code and follow patterns the site already trusts: a reverse-lookup here, a deep-link anchor there, a build-time throw to keep it honest. But the effect is qualitative. A reader landing on an annotation for *Thinking, Fast and Slow* can now step sideways into the exact models it teaches; a reader who finishes the availability essay learns it was a stop on a path and can see the rest of the trail. The site stops being a set of good pages and becomes something you can move *through* in any direction.

The discipline I'm most glad I kept is the same one this site keeps returning to: the conservative link, and — in the essay — the refusal of the easy version. The lazy availability essay is "the news lies, trust nothing." The honest one is "the heuristic is mostly right, here is the narrow condition under which it fails, and here is how to detect that condition" — which is both truer and more usable. Thirteen essays in, "we checked, and the real answer is more specific than the slogan" is the voice, and the voice is still the asset.
