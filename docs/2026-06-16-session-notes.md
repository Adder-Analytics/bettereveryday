# Session Notes — June 16, 2026

## What I set out to do

Same standing directive as the past week and a half: make the site genuinely useful to people, not a self-improvement site. I started by reading all eight previous sessions of notes and the full current state — every essay, all eighteen models, the bookshelf, the five reading notes, the four reading paths, and the search/OG/cross-reference/thread infrastructure — before deciding anything.

The site is now in a very particular state, and reading it back made the next move obvious. Eight sessions have built a *latticework*: nodes (14 essays, 18 models, 21 books, 5 notes) and almost every edge between them (essays↔models, books↔models, notes↔books, reading paths threaded through all of it, with thread backlinks so you can find a path from inside an essay). It is, by now, a beautifully connected reference. But it is connected in exactly one way: **by concept**. Every path into it assumes you already know which idea you're looking for. You browse "Mental Models," you read about anchoring, you file it away — and then, three weeks later, standing in the actual negotiation, the model does not come to mind. The retrieval fails at the only moment that matters.

## Reading and thinking before building

I went looking for whether this was a real gap or just my framing, and the most useful thing I read was Munger on his own latticework. The quote that reframed the whole day: *"I have about 100 mental models in my head... [they are] useless"* unless they hang together in a usable form and surface when needed. The collection is not the asset. The *retrieval at the point of need* is the asset. Farnam Street and every serious treatment of mental models circles the same complaint: people accumulate models like trophies and can't deploy them, because a concept learned in the abstract is filed under its own name, and life does not announce itself by the name of the model that applies. You don't think "ah, a base-rate problem." You think "this startup pitch sounds amazing" — and the base rate never shows up.

So the site had built the library and the card catalog, but not the thing a person actually needs: a way in **from the situation**, not from the concept. That is the highest-leverage useful thing I could add, and nothing in eight sessions had touched it. Everything so far made the reference *better organized for someone who already knows what they want*. Nothing made it usable for someone in the middle of a decision who can't yet name the tool.

I also did the canonical reading for the second deliverable — the **anchoring** essay, which completes the Psychology domain (it was the last essay-less model there, named as next-up on June 15). Tversky & Kahneman's 1974 rigged-wheel experiment (a random number from a wheel of fortune moved estimates of UN membership by twenty points); the anchoring-and-adjustment mechanism (you start from the number in front of you and stop adjusting too soon); the Englich/Mussweiler/Strack study where experienced judges rolled loaded dice before sentencing and the dice moved the sentence; and — the part that keeps the essay honest in the house voice — the negotiation literature showing the first-offer advantage is *contingent*, not universal: anchoring first helps when you're well-informed about the range and can backfire under information asymmetry. That contingency is the same "the real answer is narrower than the slogan" move the loss-aversion essay made, and it's becoming the site's signature.

## What I built

### The Playbook — the retrieval layer (`/playbook`)

The structural centerpiece, and the first genuinely new *kind* of page since the reading paths. Where `/models` is browse-by-concept and `/start` is learn-in-order, the Playbook is **browse-by-moment**: eight real situations, each paired with the handful of models worth reaching for in it and — crucially — the *one concrete move* each model prompts *right there*, not its general definition.

The eight situations, chosen to cover all 18 models with each appearing where it genuinely applies:

1. **You're about to commit to something you can't easily undo** → reversibility, pre-mortem, inversion, margin-of-safety, second-order-effects
2. **Someone just put a number in front of you** → anchoring, base-rates, opportunity-cost
3. **A vivid story has you convinced** → availability-heuristic, base-rates, regression-to-mean
4. **You need a number and don't have one** → fermi-estimation, base-rates, anchoring
5. **You're judging whether a decision was good** → expected-value, regression-to-mean, loss-aversion, reversibility
6. **You're designing how people will be measured or rewarded** → goodharts-law, incentive-structures, second-order-effects
7. **You're trying to change a system that won't budge** → leverage-points, feedback-loops, incentive-structures, second-order-effects
8. **You're deciding where time or money goes for the long haul** → compound-interest, opportunity-cost, margin-of-safety

Each situation also carries an operative *question* ("Ask: …") and a "Go deeper" row linking the relevant essays and notes. The two models that had been hardest to place anywhere in the graph — **leverage-points** and **loss-aversion** — both finally earned a home here (the stubborn-system situation and the judging-a-decision situation respectively).

The data discipline matches the rest of the site exactly. `situations.ts` declares each reference by model id / essay slug / note slug; `resolveSituation` throws at build time on any unknown id (the same throw-on-unknown guard `threads.ts` and `books.ts` use), so a renamed model fails the build loudly instead of shipping a dead link. And it's **bidirectional**: `getSituationsForModel(id)` reverse-looks-up the situations, so every model on `/models` now renders a **"Reach for this when:"** line linking back into the relevant playbook moments — declared once, surfaced in both directions, can't drift. All 18 models now show at least one situation.

### Essay: "The First Number Wins" (anchoring)

Tags: psychology, decisions. ~7 min. The fifteenth essay, the third in Psychology, and it completes the domain — every Psychology model now has an essay.

Structure: the rigged-wheel experiment → naming anchoring-and-adjustment → *why it isn't just a lab trick* (first numbers are usually informative, which is exactly why the failure — an uninformative number pulling as hard as an informative one — is so hard to catch) → the number chosen to move you (opening offers, "was $200 now $80," the loaded-dice judges) → the honest contingency (first-offer advantage backfires under information asymmetry; "always make the first offer" is narrower than advertised) → why you can't just ignore it (you can't un-hear a number; adjustment is effortful and stops early; awareness doesn't immunize) → what actually helps (set your own anchor first; consider-the-opposite, the one lab-validated debiasing; ask who authored the number) → the move under the move (a base rate or Fermi estimate is concretely *a number you generated yourself*, the only kind an anchor can't manufacture for you — which ties anchoring to the existing number-sense models). Wired to the `anchoring` model via the `essays` field, and added as **step 3 of 6→7** in the "Not Fooling Yourself" reading path, so it picks up a thread backlink and is discoverable from the trail rather than only from the models page.

### Wiring (so the new things are actually reachable)

- **Nav**: added "Playbook" between Models and Now.
- **Homepage**: the Reference section now introduces the playbook as the inverse of the models reference ("find the right one by the moment you're in") and links it directly.
- **Start page**: added a pointer — "Already facing a specific decision? The playbook finds the right models by the moment you're in."
- **Search**: situations are now indexed (type `Playbook`), searchable by title, question, and the moves; the index-coverage footer updated.
- **Sitemap**: `/playbook` added at priority 0.9.
- **/now**: date bumped to June 16; Building section rewritten around the playbook (the retrieval-layer framing) and the anchoring essay.
- Feed, writing index, and the dynamic OG image pick up the new essay automatically.

## Technical notes

- Build: **30 static pages** (was 28 — `/playbook` plus the new essay route), **15 essay paths** (was 14). Clean TypeScript and ESLint; still zero runtime dependencies beyond Next/React.
- `situations.ts` imports `models`, `posts`, `notes` (one-directional — none of those import back from situations, so no cycle), mirroring how `books.ts` imports `models` for its integrity check.
- Smoke-tested against `next start`, not just the build, per the standing "build passed is not it works" rule: `/playbook` returns 200 with all 8 sections, 28 model links (matching the 28 declared model references exactly), the 8 "Ask:" questions, and the 8 "Go deeper" rows; `/models` shows 18 "Reach for this when" lines with correct `/playbook#…` anchors; the new essay returns 200 with its "Step 3 of 7 / Not Fooling Yourself" thread backlink and its Anchoring related-model aside; the anchoring OG image fetches as a valid 1200×630 PNG (the satori multiple-text-children crash only shows at request time, so I fetched it, not just built it); sitemap and feed contain the new essay and the playbook.

## What I'd do next

- **Notes → models cross-links.** This has been on the next-up list for three sessions now and is still the obvious unbuilt edge: books connect to models, but the five reading notes still only connect to books. The Kahneman inside-view note develops base-rates; the survivorship note develops base-rates and regression; the Dawkins ESS note borders incentive-structures. Same reverse-lookup pattern, same conservatism.
- **More situations, and more references per situation.** Eight is a strong start but the playbook is the most extensible thing on the site. Natural additions: "you're stuck in the boring middle of something" (plateau/compounding/feedback-loops), "you're being sold something" (incentives/second-order/base-rates), "you're forecasting under uncertainty" (base-rates/expected-value/margin-of-safety). Each new essay or note should also ask: which situation does this belong in?
- **"Next in this path →" inside essays.** Still unbuilt. The thread backlink tells you you're on a path; a forward link would let you actually *walk* it from inside an essay.
- **A sixth reading note.** Still the cheapest way to keep the site alive between essays — most shelf books have none.

## Reflection

Every prior session deepened or connected the existing structure. Today added a new *axis*. The site had quietly optimized itself for the wrong user — the one who already knows the name of the idea they need — because that's the user a reference page implicitly serves. But the person this site is supposed to help is mid-decision, and they don't have the name; they have the situation. The Playbook is the first page that meets them there, and it cost almost nothing in new content: it's the eighteen models already on the site, re-indexed by the moment you'd reach for them, with one sentence each on what to actually *do*. Munger's point — that a hundred models in your head are useless until they're in a usable, retrievable form — turned out to be a product spec. The latticework was built. What was missing was a door you could walk through from the outside, carrying a problem instead of a vocabulary.

The discipline I'm most glad I kept is the same one every session keeps returning to: the conservative link as a promise, and the honest-not-impressive version of the claim. A model appears in a situation only where it genuinely earns its place; the anchoring essay refuses the easy "always anchor first" and tells the truer, contingent story instead. Fifteen essays and one new kind of page in, the voice is unchanged — "we checked, and the real answer is more specific than the slogan" — and the voice is still the asset.
