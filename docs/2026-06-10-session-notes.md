# Session Notes — June 10, 2026

## What I set out to do

The directive was the same as the past few days: make this site better, with the constraint that it shouldn't be a self-improvement site. I read all three previous sessions of notes and spent time with the existing essays before writing a line of code.

A few things stood out from the reading:

**The site has a voice.** The essays take a non-obvious angle on familiar subjects and follow the argument carefully. "Boredom is a prerequisite for mastery," "the variable that matters most isn't which investment you pick — it's how long the money has to compound," "a good decision can produce a terrible outcome." These are claims worth reading. The voice is consistent enough that it would be wrong to expand the site in ways that dilute it.

**The content is thin relative to its ambition.** Seven essays is a start, not a resource. The essays reference ideas (compound interest, decision quality, deliberate practice) that deserve more exploration — and there are neighboring ideas that deserve their own treatment. The finance thread, in particular, opened with the compounding essay and continued with inflation being the obvious next topic. Fermi estimation had been floating in the session notes as "useful next content" and never got written.

**The bookshelf and models are the most useful pages.** The essays are the draw, but the bookshelf and the new models page are what make the site a reference rather than a blog. The distinction matters: a blog you read and forget; a reference you return to. This site has the potential to be a reference.

## Reading and thinking before building

Before writing anything, I re-read:

- All seven existing essays, paying attention to what threads they open and don't close
- The bookshelf annotations — specifically the mental models books (Munger, Kahneman, Taleb, Galef, Duke) — to understand what conceptual ground is covered by the reading list
- Session notes from all three prior sessions, tracking the "would do next" lists

A few specific things that shaped what I built:

**Fermi estimation** was on the "would do next" list from June 9 and kept appearing in the edges of other essays. The money math essay implicitly requires number sense to be actionable. The decision quality essay requires understanding probability and scale. Fermi estimation is the underlying skill — the practice of decomposing large or uncertain quantities into estimable pieces. It's not self-improvement content; it's epistemics. The essay wrote itself once I found the right frame: most people can't feel the difference between a million and a billion, and this specific gap makes them passive consumers of quantitative claims rather than active evaluators.

**Inflation** is the natural sequel to the compounding essay. The first essay says: compounding is the most important force in finance. The inflation essay says: inflation is the force that works against you when you don't invest. Together they form a coherent argument for why time in the market matters more than almost anything else. I wanted to write the essay that a 22-year-old with their first paycheck would actually find useful — not another "avoid avocado toast" piece, but a clear account of what happens to money that sits still.

**Mental models as a reference format.** The idea came from looking at the bookshelf and noticing that the most useful thing about it isn't the list of titles — it's the annotations that tell you what the book actually contains and whether it's for you. A mental models page does something similar for ideas: instead of saying "read Kahneman," you can say "here's what System 1 / System 2 actually means and when it applies." The annotation is the value. The models page is, in that sense, an extension of the bookshelf into a more granular format.

## What I built

### Essay: "How to Think in Orders of Magnitude"

Tags: thinking, math. ~700 words.

The central argument: number sense is a trainable skill, and Fermi estimation is the specific technique that develops it. Most people process "a million," "a billion," and "a trillion" as rough synonyms for "large number." This failure makes them passive recipients of whatever framing is offered.

Key moves in the essay:
- Open with the US federal debt to establish the stakes (the inability to feel scale has political and financial consequences)
- Explain the Fermi method: decompose into knowable pieces, accept approximate answers
- Walk through the piano tuner example (Fermi's classic) and show how it produces an answer in the right order of magnitude without any specialized knowledge
- The million/billion/trillion intuition: a million seconds is 12 days, a billion seconds is 31 years, a trillion is 31,700 years — the gap is enormous and invisible when written as digits
- A short set of reference anchors worth memorizing (world population, US GDP, etc.)
- Practical application: the Fermi reflex as a sanity check on any important quantitative claim

### Essay: "Inflation Is a Tax You Never Voted For"

Tags: finance, math. ~700 words.

The central argument: cash is not a safe asset over long periods — it loses purchasing power at the rate of inflation, year after year, invisibly. Understanding this clearly changes where you put money you won't need for decades.

Key moves:
- Open with the "evaporation" framing — inflation is not something that happens to prices, it's something that happens to money
- The real vs. nominal distinction: the number that matters is always real return (nominal minus inflation)
- Concrete example: 2022, when savings accounts offered 0.1% against 8% inflation — the nominal return was positive, the real return was -7.9%
- The Rule of 72 applied to inflation: at 3%, prices double in 24 years; the retirement you're planning to fund with $1M today requires $1.8M in 24 years to buy the same things
- Why "cash is safe" is a category error: safe from one kind of risk (short-term volatility) while fully exposed to another (long-term purchasing power erosion)
- Equities as the appropriate long-term vehicle: ownership of real assets that grow in real terms
- Practical prescription: know your real return, not just your nominal return

### /models — Mental Models reference page

Seventeen models across five domains: Finance, Decisions, Systems, Psychology, and Epistemology. Each model has:
- A name
- A tagline: the model in one crisp sentence
- An explanation: 2-4 sentences on how to apply it and why it matters

The selection principle: these are models I find myself reaching for most often when thinking through hard problems. Not a comprehensive list — a curated one. The domains were chosen to cover the core intellectual territory of the site: Finance (for the money essays), Decisions (for the decision quality essay), Systems (for thinking about how things interact), Psychology (for human nature as it intersects with finance and decisions), and Epistemology (for how we know what we know).

The models:

*Finance:* Compound Interest, Opportunity Cost, Margin of Safety, Incentive Structures

*Decisions:* Expected Value, Inversion, Pre-mortem, Reversibility

*Systems:* Feedback Loops, Second-Order Effects, Leverage Points

*Psychology:* Availability Heuristic, Anchoring, Loss Aversion

*Epistemology:* Base Rates, Regression to the Mean, Fermi Estimation

The Finance and Decisions models connect directly to existing essays. The Systems and Psychology models extend the site's intellectual range. The Epistemology models provide the foundations for everything else.

### Bookshelf category filtering

The bookshelf now has interactive category filter buttons — the same pattern as the writing page's tag filter. I extracted a `BookshelfList` client component that holds the filter state, keeping the `bookshelf/page.tsx` as a server component for metadata export.

With six categories (Finance, Thinking, Writing, Science, History, Work), the filter is immediately useful if you want to browse only the finance books or only the writing craft books without scrolling past everything else.

### Homepage and navigation updates

- Added "Models" to the nav between "Bookshelf" and "Now"
- Added a "Reference" section to the homepage linking to the models page
- Fixed the hardcoded "June 9, 2026" date on the homepage — it now derives from the most recent post's date, so it stays current as new essays are published
- Updated /now page date to June 10, 2026, and updated the Building section to mention the models page

### Writing page metadata

Updated the writing page description from "Essays on improvement, focus, learning, and the long game" to "Essays on finance, decisions, learning, and craft — focused on understanding how things actually work." More accurate to what the essays actually are.

## Technical notes

- Build: 21 static pages (was 18), 9 essay paths (was 7). Clean TypeScript compilation.
- The `models.ts` data file uses the same pattern as `books.ts`: a typed export and a derived `domains` array from unique model domains, so adding a new domain automatically creates a new section on the page.
- The bookshelf client component follows the same `"use client"` extraction pattern as `WritingList.tsx` — interactive state is isolated to a child component while the parent remains a server component.
- No new dependencies added. Total footprint unchanged.

## What I'd do next

- **Cross-references**: Link from models to relevant essays (e.g., the "Compound Interest" model links to both the compounding essay and the money math essay). Currently these are siloed; the cross-references would make the site feel more like a connected resource.
- **More essays**: The systems and psychology models on the models page each deserve full essays. Second-order effects has obvious applications to policy, medicine, and personal decisions. Loss aversion deserves a full treatment of how it interacts with investing and negotiation.
- **Reading notes**: A lighter format between a full essay and a bookshelf annotation — reacting to a specific argument or passage, 300-400 words. Feeds more regularly without requiring the full-essay commitment.
- **Search**: With 9 essays and a growing models page, a client-side search would help. Could index the models, essays, and bookshelf annotations.
- **Bookshelf additions**: A few obvious gaps — anything by Michael Lewis for narrative nonfiction; something on probability and statistics; something on biological systems.

## Reflection

The most useful thing I did today wasn't the code — it was reading. Every good idea came from spending an hour with the existing content and session notes before building anything.

The mental models page is the addition I'm most pleased with. It exists in a gap between "essay" (too long for quick reference) and "tweet" (too short to be useful). The tagline-plus-explanation format turns out to be the right length: enough to understand the model, not so much that it becomes an essay itself. A reader who already knows the model gets confirmation that they understand it correctly; a reader who doesn't gets enough to apply it immediately.

The inflation essay is the most practically useful piece on the site. The money math essay set up the compounding framework; the inflation essay completes it by explaining what happens to people who understand compounding but still keep their money in cash. Together they make a case for a specific set of financial behaviors that is, I think, genuinely better advice than most of what gets published on personal finance.

The site now has nine essays, seventeen mental models, sixteen books, and a /now page. That's a real resource. The challenge from here is maintaining quality as it grows — adding content only when the content is genuinely worth reading, not to hit a publishing schedule.
