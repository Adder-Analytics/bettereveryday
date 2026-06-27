# Session Notes — June 11, 2026

## What I set out to do

Same directive as previous days: make the site better, useful to people, not a self-improvement site. I started by reading all four previous sessions of notes and the full current state of the site — every essay, the models page, the bookshelf — before deciding what to build.

## Reading and thinking before building

Two threads of reading shaped today's work.

**Digital gardens and connected references.** I read up on the digital garden tradition — the line of thinking associated with Maggie Appleton's garden history, Andy Matuschak's evergreen notes, and gwern.net's design philosophy. The idea that stuck: the difference between a blog and a reference is *topology*. A blog is a timeline; a reference is a graph. What makes a knowledge site genuinely useful to a reader is dense internal linking — especially bidirectional linking, where a page knows what links to it. The June 10 notes had already diagnosed the problem ("Currently these are siloed") and put cross-references at the top of the next-up list. The garden reading confirmed that this was the right priority and clarified the shape: links should go both ways, and they should land on a specific spot, not a whole page.

**Second-order thinking source material.** The June 10 session flagged a second-order effects essay as deserving a full treatment. I read up on the canonical material: Frédéric Bastiat's 1850 "That Which Is Seen, and That Which Is Not Seen" (the broken window, and his definition of a good economist as one who considers the effects that must be foreseen), Howard Marks' "second-level thinking" from *The Most Important Thing* (in competitive arenas, the first-order conclusion is already priced in), and the 1935 Australian cane toad introduction as the concrete opening disaster (imported to eat cane beetles, mostly couldn't reach them, became one of the country's worst invasive species).

## What I built

### Essay: "And Then What? Thinking Past the First-Order Effect"

Tags: thinking, decisions. ~850 words. The tenth essay.

The central argument: most bad decisions come from stopping the causal analysis one step too early, and the fix is a question, not a framework. Key moves:

- Open with the cane toads — a vivid case where the first link in the chain was reasoned correctly and everything after it was ignored
- Bastiat's seen/unseen as the 175-year-old name for the pattern, with the broken window, then modern instances (hiring freezes, skipped workouts)
- Howard Marks' second-level thinking as the special case for competitive arenas: the first-order conclusion is already priced in, so the opportunity lives exclusively at the second level
- Why we stop at first order: first-order effects are immediate, visible, attributable; second-order effects are delayed, diffuse, deniable — and most incentive structures (election cycles, quarterly earnings) are built on that asymmetry
- The sign-flip heuristic: for many decisions, first-order and second-order effects have opposite signs. Most things worth doing are first-order negative and second-order positive — which is why they remain available to do
- The practice: ask "and then what?" twice; run decisions across time horizons; remember second-order effects matter most in systems containing people, because people adapt

This essay completes a connection the site had been implying: the second-order effects *model* existed on /models with a two-sentence treatment, and now there's a full essay behind it.

### Bidirectional cross-references between essays and models

The structural work of the day, and the digital-garden idea made concrete:

- `Model` type gained an optional `essays` field (slugs of essays that explore the model in depth)
- The models page renders an "Essay: → " link under each model that has one, and each model now has an anchor (`id` + `scroll-mt` for the sticky nav), so models are linkable as `/models#fermi-estimation`
- Essay pages render a "Related Mental Models" section — computed by *reverse lookup* from the models data, so the link only has to be declared once and appears in both directions. That's the backlink pattern from the digital garden tradition, implemented with a filter rather than a graph database

Mappings are deliberately conservative — only where the essay genuinely develops the model: Compound Interest → money-math + compounding-improvements; Expected Value, Pre-mortem, Reversibility, Regression to the Mean → decision-quality; Second-Order Effects → second-order-thinking; Fermi Estimation → orders-of-magnitude. I left models without a true essay counterpart unlinked rather than stretching. The unlinked models are also a visible writing backlog: each one is a candidate essay.

### Site-wide search (/search)

Client-side search across all three content types: essays (title, tags, excerpt, full text with HTML stripped), mental models (name, domain, tagline, explanation), and books (title, author, category, annotation).

Implementation: all content already lives in typed TS modules, so the search index is just those modules imported into a client component — no search service, no JSON index generation, no dependencies. Multi-term AND matching with field weighting (title-level matches score 3, body matches 1), results sorted by score with type badges. Essays link to the essay, models deep-link to their anchor on /models, books link to the bookshelf. The whole corpus is ~60KB of text, so shipping it to the client is cheaper than a roundtrip.

Search was on the "next" list of both the June 9 and June 10 sessions; with 10 essays, 17 models, and 19 books, the site crossed the threshold where it earns a nav slot.

### Three bookshelf additions

Filling the three gaps named in the June 10 notes:

- **The Big Short — Michael Lewis** (Finance, ★★): narrative nonfiction; the annotation points at the real lesson — the people who got it right were the ones who read the documents
- **How Not to Be Wrong — Jordan Ellenberg** (Thinking, ★★): the probability/statistics gap; pairs with the orders-of-magnitude essay; Wald and the missing bullet holes
- **The Selfish Gene — Richard Dawkins** (Science, ★★★): the biology gap; the canonical example of a book that hands you a permanent new lens

Nineteen books now.

### Removed the orphaned /skills page

The skills tracker was de-linked from the nav on June 9 (replaced by Bookshelf) but the page and its data file stayed behind, reachable only by direct URL. It was the last remaining self-improvement-tracker artifact on a site that's explicitly not that anymore, and it presented as a stale personal dashboard to anyone who landed on it. Deleted `app/skills/` and `app/data/skills.ts`.

### Smaller updates

- Nav: added Search after Now
- Sitemap: added /search; /skills was never in it, so nothing to remove
- Homepage: Reference section now mentions the cross-linking and links to search
- /now: date bumped to June 11; Building section describes the connected-reference direction

## Technical notes

- Build: 22 static pages, 10 essay paths, clean TypeScript and ESLint
- The reverse-lookup pattern for backlinks (`models.filter((m) => m.essays?.includes(slug))`) means cross-references are declared exactly once, in the models data. No risk of the two directions drifting apart
- Anchors on /models use Tailwind's `scroll-mt-24` so the sticky nav doesn't cover the target on jump
- Smoke-tested with `next start`: essay → related models, model → essay link, anchor IDs, and search page all render
- Still zero runtime dependencies beyond Next/React. The search "engine" is ~40 lines

## What I'd do next

- **Essays for the unlinked models**: Loss Aversion, Incentive Structures, and Feedback Loops are the strongest candidates — each has a tagline on /models that wants 700 words behind it. The cross-reference system now makes this backlog visible on the page itself
- **Reading notes format**: still the best unbuilt idea from June 10 — 300-400 word reactions to specific arguments, a lighter feed between essays
- **Search refinements**: keyboard shortcut (/) to focus search from any page; match-context snippets instead of static excerpts
- **OG images**: dynamic per-essay Open Graph images are the last missing piece of sharing infrastructure
- **Books → models links**: the same cross-reference pattern could connect bookshelf entries to the models they teach (Kahneman → availability/anchoring/loss aversion)

## Reflection

The theme of the day was topology. The site had good nodes — essays, models, books — and almost no edges. Adding edges (cross-references, deep-linkable anchors, search) changed what kind of thing the site is: a blog you read once; a reference you navigate. The digital-garden reading gave me the vocabulary for what previous sessions had been groping toward with "siloed" and "connected resource."

The discipline I'm most glad I kept: linking conservatively. It would have been easy to connect every model to every vaguely related essay and make the feature look fuller. But a cross-reference is a promise — "this essay develops this idea" — and a reader who follows a stretched link once will stop following them. Eight honest links beat seventeen padded ones. The unlinked models double as the writing roadmap, which is the kind of structure that tells you what to do next better than a todo list does.
