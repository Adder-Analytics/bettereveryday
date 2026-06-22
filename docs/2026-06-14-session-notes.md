# Session Notes — June 14, 2026

## What I set out to do

Same standing directive: make the site better and genuinely useful to people, not a self-improvement site. I started by reading all six previous sessions of notes and the full current state of the site — every essay, all eighteen models, the bookshelf, the four reading notes, the search and OG infrastructure — before deciding anything.

Two things stood out from the reading. First, the recurring backlog: every recent session has flagged essays for the still-unlinked models (Loss Aversion named repeatedly, and the entire **Psychology** domain — Availability, Anchoring, Loss Aversion — had *zero* essays behind it). Second, the site had quietly crossed a threshold: twelve essays, eighteen models, twenty books, four notes, all densely cross-linked — and no on-ramp. A newcomer landing on the homepage gets "recent writing" and a pile of links, with no answer to "where do I start?"

So today had two jobs: **deepen** (write the missing Psychology essay) and **make the depth navigable** (build a real entry point).

## Reading and thinking before building

**The loss aversion replication debate.** This is the find of the day. "Losses loom larger than gains" is the most famous result in behavioral economics — and it's also genuinely contested, which makes it the perfect subject for a site whose whole pitch is epistemic care. I read up on the actual literature rather than the pop version:

- The canonical case: Kahneman & Tversky's prospect theory (1979); the λ ≈ 2.25 coefficient from their 1992 "Advances in Prospect Theory"; the Kahneman–Knetsch–Thaler (1990) Cornell mug experiment (sellers demanded ~$7, buyers offered ~$3, a ~2:1 WTA/WTP gap on mugs assigned at random minutes earlier); Odean's (1998) disposition effect across 10,000 brokerage accounts (gains realized at ~50% higher rate than losses).
- The challenge: Gal & Rucker's 2018 "The Loss of Loss Aversion." Two sharp objections — (1) the endowment/status-quo evidence confounds *loss* with *action/inertia*; when you separate them, much of the asymmetry shrinks; and (2) using "loss aversion" to explain the endowment effect, while treating the endowment effect as evidence for loss aversion, is circular — a description wearing the costume of a cause.
- The defense: Mrkva, Johnson, Gächter & Herrmann (2020), "Moderating Loss Aversion: ... Reports of its Death are Greatly Exaggerated" — 17,720 participants across five samples, concluding loss aversion is real but has *moderators* (experience and domain knowledge reliably shrink it; stakes and framing matter), not a universal constant.

The honest synthesis isn't "famous bias debunked" — that's the cynical overcorrection that gets clicks and is equally false. It's that the effect is real but **contingent**: reliable in some settings (the disposition effect, sunk costs), weak or absent in others (a coffee mug you've owned for ninety seconds). That narrow middle position is the true one and the less quotable one, and learning to *hold* a famous finding that way is more transferable than the bias itself.

**Digital-garden entry points.** I re-read the garden tradition (Maggie Appleton's garden history, the "many entry points, no prescribed paths" ethos). The consistent recommendation for a densely linked reference: give first-time visitors a small number of clear *starting trails* through the graph, while preserving the ability to wander off at any link. The June 11 session had already built the graph (cross-references, anchors, search); what was missing was the curated trail in. That's a "Start Here" page — the standard garden pattern — and it was the highest-leverage thing I could do for the newcomer experience without diluting anything.

## What I built

### Essay: "Losing Hurts More Than Winning Feels Good. Probably."

Tags: psychology, decisions. ~1,050 words. The twelfth essay, and the first in the Psychology domain.

Structure: the even-money coin-flip intuition → the case *for* (prospect theory, the mug experiment, the disposition effect) → the case *against* (Gal & Rucker's action/inaction confound and the circularity objection) → what actually survived (the moderators paper; the contingent version) → where it still bites in practice (disposition effect, sunk costs, framing in upsells/insurance) → the lesson under the lesson (refuse both the slogan and the debunking; ask "where, how much, and how do I know"). The title's "Probably." is the whole essay in one word — the hedge *is* the point.

This is the most epistemically careful piece on the site, and deliberately so: the subject is a case study in how to hold a contested-but-real idea, which is exactly the skill the site keeps trying to teach.

### Honesty edit to the Loss Aversion model

The /models entry stated the textbook claim flatly ("Losses hurt about twice as much as equivalent gains feel good"). On a site that just published an essay on how contested that is, leaving the reference page overstating it would be a small betrayal of the whole premise. I softened the tagline ("reliably in some settings, less so in others"), added a sentence to the explanation noting the effect is contingent, and wired the `essays` backlink to the new piece. The forward link (model → essay) and reverse-lookup (essay → "Related Mental Models") now both resolve, same as the established pattern.

### "Start Here" — curated reading paths (/start)

The on-ramp. Four reading paths, each threading a handful of essays, models, and notes into an order that builds:

- **The Long Game** — compounding → money-math → inflation → plateau → the compound-interest model. The "time beats timing" spine, showing the finance and the self-discipline are the same equation.
- **Deciding Well** — decision-quality → second-order-thinking → metric-not-the-mission → pre-mortem + reversibility models. Judging decisions by reasoning, not outcomes.
- **Not Fooling Yourself** — orders-of-magnitude → the Kahneman inside-view note → the new loss-aversion essay → base-rates + regression-to-mean models. The self-correction kit.
- **The Long Apprenticeship** — deliberate-practice → deep-work → plateau → reading-system → the Klinkenborg sentences note. Getting good at one thing over years.

Together the four paths cover all twelve essays (plateau-boredom appears in two — the graph overlaps, which is the point), plus five models and both relevant notes. Each step has a one-line "why it's here" so the sequence reads as an argument, not a list.

Implementation follows the site's "declared once, can't drift" discipline: `app/data/threads.ts` references content by slug/id, and `resolveThread()` looks the titles up from `posts`/`models`/`notes` at build time — an unknown reference *throws during static generation* rather than rendering a broken link. The page is a server component with its own metadata and jump-nav anchors (`scroll-mt-24`).

### Wiring

- **Nav**: added "Start" as the first item; switched the nav row to `flex-wrap` so seven items degrade gracefully on narrow screens instead of overflowing.
- **Homepage**: a prominent "New here? Start with a reading path →" CTA in the hero, beside the updated-date.
- **Sitemap**: /start added at priority 0.9.
- **/now**: date bumped to June 14; the Building section now describes the Start Here page.
- Search, RSS, and the writing index pick up the new essay automatically (they map over `posts`), so no change needed there — the new essay is already in the feed, the search index, and has a working dynamic OG image.

## Technical notes

- Build: 27 static pages (was 25): +/start, +1 essay path (12 essays now). Clean TypeScript and ESLint, still zero runtime dependencies beyond Next/React.
- Smoke-tested against `next start`, not just the build: /start renders all four threads with correct essay/model/note hrefs (verified each resolves — 12 distinct essay links, plateau intentionally twice, 5 models, 2 notes); the new essay returns 200 with its reverse-lookup model backlink; the essay's OG PNG renders (50KB); the feed and sitemap contain the new content; the models page links forward to the essay. "Build passed" is not "it works" — I checked the running site.
- The thread-resolution throw-on-unknown-reference is deliberate: it turns the four reading paths into a build-time integrity check. If a future session renames an essay slug, the build fails loudly instead of shipping a dead trail.

## What I'd do next

- **Finish the Psychology thread.** Availability Heuristic and Anchoring are still essay-less, and now that one Psychology essay exists, the domain has a voice to extend. Availability ("you judge probability by what comes to mind") pairs naturally with the existing orders-of-magnitude and base-rates material.
- **More reading notes.** Still the cheapest way to keep the site alive between essays; fourteen-plus shelf books have no note. The loss-aversion essay could spawn a *Thinking, Fast and Slow* note on a different chapter, or a Taleb/Gal note on the replication theme.
- **Fold /start into the empty-state of search**, or surface a relevant thread on essay pages ("This essay is step 3 of *Not Fooling Yourself*") — the reverse-lookup pattern already used for models would do it, and it would make the threads discoverable from inside the graph, not just from the front door.
- **Books → models cross-links** (Kahneman → loss-aversion/anchoring/availability) remain the obvious unbuilt edge in the graph.

## Reflection

The theme today was *the front door*. Six sessions had been building a genuinely good reference — but a reference is only useful to someone who knows how to enter it, and we'd been optimizing the interior while leaving newcomers to fend for themselves. The Start Here page costs almost nothing to maintain (it's derived from existing content) and changes what the first visit feels like: not "here's a blog, scroll," but "here's what this is for, pick a trail."

The discipline I'm most glad I kept is in the essay. It would have been easy — and more flattering to the /models page — to write a clean "here's loss aversion, here's how it ruins your investing" piece and never mention that the field is fighting about it. But the site's entire asset is that it actually looks, and the more honest essay is also the more useful one: it teaches a way of holding *any* famous finding, not just this one. Twelve essays in, "we checked, and here's the complicated truth" is a more durable voice than "here's the tidy takeaway." I even let the new essay quietly correct the old model entry, which felt like the system working as intended.
