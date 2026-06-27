# Session Notes — June 9, 2026

## What I set out to do

The directive was deliberately open: make the site better. One constraint: it shouldn't be a self-improvement site. That was the useful provocation. The existing essays are all about optimizing yourself — habits, deliberate practice, deep work, getting through plateaus. Good writing, but narrow audience, and it risks sounding like productivity content rather than useful thinking.

The challenge was: what does "useful to people" actually mean? Not a tool. Not a productivity app. Something where the value is in the content and structure — but content that helps people think better about things that matter in their lives.

## Reading and research

Before writing any code, I re-read all five existing essays and both sets of session notes. A few observations:

**The existing essays have a consistent voice** — they take a non-obvious angle on a familiar subject and follow it carefully. "Boredom is a prerequisite for mastery" is the kind of claim that's counterintuitive enough to be worth reading 600 words for. This voice is worth preserving and extending into new domains.

**The compound interest math is already on the site**, in the first essay. 1.01^365 = 37.78 is introduced as a habits metaphor, but the same equation is the most important single concept in personal finance — and most people don't understand it intuitively. That felt like an essay hiding in plain sight.

**Decision-making is a topic where most people reason poorly** without knowing they do. Annie Duke's work on "resulting" (judging decision quality by outcome quality) and Gary Klein's pre-mortem are genuinely useful frameworks that change how you make consequential choices. Not self-improvement — practical epistemology.

**The bookshelf was on the roadmap** from earlier sessions, and the site's /now page already mentions books. A curated reading list with honest annotations is genuinely useful in a way that a list of book titles never is: it's the annotation that tells you whether a book is for you.

## What I built

### Essay: "The Money Math Nobody Teaches You"

The central argument: the compound interest equation is the same equation as the 1% better habit math, and if you understand it intuitively from the habit context, you already understand the most important thing in personal finance — you just haven't applied it to money yet.

Key moves in the essay:
- Start with the familiar (1.01^365) and show it's the same as investment returns
- The Rule of 72 as a concrete, memorable tool: divide 72 by your rate to get years to double
- The $10,000 at 25 vs. 35 comparison: the ten-year delay costs $117,000 from a single investment
- The "invisibility problem" reframe: the same reason habits feel unrewarding in early months is why people don't invest early — the payoff is back-loaded and invisible
- Practical prescription: index funds, tax-advantaged accounts, automatic contributions, leave it alone

The essay avoids stock-picking advice, market timing, and the usual personal finance noise. It focuses entirely on the one variable that matters most: time in the market.

### Essay: "The Difference Between a Good Decision and a Good Outcome"

The central argument: we judge decisions by their outcomes, but outcomes have randomness. Learning to separate these is one of the most valuable and underutilized mental skills.

Key moves:
- Open with the drunk driver / careful driver example — both make vivid something we intuitively understand but don't apply to ourselves
- Annie Duke's term "resulting" — judging decision quality by outcome quality — gives the bias a name, which makes it easier to notice
- What good decisions actually look like: reasoning well from available information, accounting for the distribution of outcomes, not just the hoped-for one
- The pre-mortem (Gary Klein): before a big decision, imagine it failed. What went wrong? Bypasses optimism bias by shifting from advocacy to analysis mode
- Reversibility as a decision variable: bad reversible decisions cost time; bad irreversible decisions cost things you can't get back. Weight these very differently
- The uncomfortable truth: good decisions can produce bad outcomes for years. But the math eventually wins.

The essay is deliberately not about habits or self-improvement — it's about epistemics, which is useful in investing, career decisions, relationships, medicine, and anywhere else that consequential choices get made.

### /bookshelf page

Sixteen books with honest annotations, organized by category:

- **Finance** (3 books): The Psychology of Money, The Little Book of Common Sense Investing, A Random Walk Down Wall Street
- **Thinking** (4 books): Thinking Fast and Slow, Fooled by Randomness, How Minds Change, The Scout Mindset
- **Writing** (3 books): On Writing (King), Several Short Sentences About Writing, Bird by Bird
- **Science** (2 books): Scale (West), The Body (Bryson)
- **History** (2 books): Meditations (Aurelius), Sapiens
- **Work** (2 books): So Good They Can't Ignore You, Range

The three-star rating system distinguishes "recommend to almost everyone" from "valuable if the topic interests you." The annotations are written to help you decide whether the book is for you — not to summarize the book, but to convey what makes it worth your time (or not) given your situation.

The bookshelf page is the most "useful to people" addition in a direct sense: good book recommendations from a thoughtful curator save hours of wasted reading. The annotations do work that a list of titles can't.

### RSS feed (/feed.xml)

A proper RSS 2.0 feed, implemented as a Next.js App Router route handler. Returns all essays with full content (`content:encoded`), sorted by date, with correct `pubDate` fields and Atom link metadata.

RSS feels philosophically right for this site: it lets readers follow without depending on social media, email, or any third-party platform. It's a direct pipe between writer and reader. The RSS link appears in the footer and in the page `<head>` as an alternate link type, so feed readers can auto-discover it.

### Open Graph metadata

Every page now has proper Open Graph metadata:
- `app/layout.tsx`: site-level OG with title, description, type, and URL
- `app/writing/[slug]/page.tsx`: post-level OG with article type, published date, and per-post title/description
- `app/bookshelf/page.tsx`: bookshelf-specific OG

This means links shared on social platforms will display title and description instead of a bare URL.

### Navigation and structure updates

- Nav: replaced "Skills" with "Bookshelf" — the bookshelf is more broadly useful than a skill-level tracker, which is primarily a personal accountability tool
- Footer: replaced the tagline with an RSS link — functional over decorative
- Homepage hero: updated description from "personal record of improvement" to "essays on finance, decisions, learning, and craft" — more honest about the expanded scope
- Homepage recent posts: now sorted by date (most recent first) rather than insertion order

### Sitemap

Updated to include `/bookshelf` with appropriate priority (0.8, matching writing posts).

## Technical notes

- The RSS route handler needed `content:encoded` with CDATA wrapping to safely embed HTML essay content. The XML escape function handles the channel-level metadata.
- `generateStaticParams` now generates 7 essay pages (up from 5). Build time: ~3.1s compile, 18 static pages in 496ms.
- The bookshelf page uses a `Stars` component with `aria-label` for accessibility — screen readers announce the rating.
- The books data file exports a `categories` array derived dynamically from the books array, so adding a book in a new category automatically creates that section.
- No new npm dependencies were added. Total dependency footprint unchanged.

## What I'd do next

- **Reading progress tracking**: Mark books as "read," "reading," or "want to read" with dates. Makes the bookshelf a living document rather than a static list.
- **More finance essays**: The compounding essay opens a thread. Useful next pieces: inflation and purchasing power, understanding equity/stock options (useful for people joining startups), and the hidden costs of lifestyle inflation.
- **More decision-making content**: Pre-mortem templates, decision journals, Fermi estimation as a practical skill.
- **Search**: With 7 essays and growing, a simple full-text search would be useful. Could be client-side with a small search index.
- **Reading notes / marginalia**: A format between a full essay and a bookshelf entry — shorter, more reactive, tied to a specific book or article.

## Reflection on the "not self-improvement" constraint

The interesting thing about the constraint is that it forced better writing. "Self-improvement" content has a structure: identify a problem people have with themselves, offer a framework, close with encouragement. It's a recognizable pattern, and it limits what you can say.

Essays about money and decisions don't have that structure. They're trying to show you something about how the world works, not something about how to optimize yourself. That shift — from "here's how to be better" to "here's how this actually works" — produced writing that felt more genuinely useful and less generic.

The site is still called "Better Every Day." But "better" can mean better at thinking, not just better at habits. The frame can hold more than it originally contained.
