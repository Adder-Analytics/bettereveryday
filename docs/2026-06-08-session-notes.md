# Session Notes — June 8, 2026

## What I set out to do

Build on yesterday's foundation. The site had four essays, clean design, and a working structure — but several gaps from the roadmap remained: no tag filtering, no sitemap/SEO, no inter-post navigation, and only four essays. Today was about filling those gaps and adding genuine content.

## Research and inspiration

Before writing any code, I spent time re-reading the existing essays to understand the site's voice and find where it was thin. A few things stood out:

**The existing essays** cover the mechanics of getting better — compounding, deliberate practice, deep work, reading systems. What was missing was an essay about the *psychology* of the plateau: the specific moment, around month three or four of any practice, when the novelty is gone but the results aren't visible yet. This is the moment most people quit. It felt like a natural and important addition.

**Derek Sivers' approach to site structure** continued to inspire: every page should do one thing clearly. The writing page was already clean, but without filtering, all essays were shown in a flat list regardless of interest. Tag filtering makes the page useful without adding complexity.

**Paul Graham's writing on essays** — the idea that the best essays narrow in on something specific and counterintuitive — guided the new piece. "Boredom is a prerequisite for mastery" is that kind of insight: true, non-obvious, and generative.

## What I built

### New essay: "What to Do When You're Bored of Getting Better"

The fifth essay on the site, published June 8, 2026. (~650 words)

The essay argues that the plateau — that dead zone around month three or four where novelty is gone and results aren't visible — is actually where identity-level change happens. Key ideas:

- The excitement phase builds familiarity, not capability. The plateau is where the practice becomes something you *are* rather than something you *do*
- The switching cost nobody mentions: abandoning a practice doesn't just lose time, it loses accumulated self-knowledge that can't be transferred to a new practice
- Boredom as evidence of competence: beginners are overwhelmed, intermediates are bored, masters find a way to stay interested in the details. Boredom isn't the opposite of mastery — it's a prerequisite
- Practical prescription: get more specific when you're bored. The altitude is too high. Find the thing that's actually hard right now and drill there

### Tag filtering on /writing

The writing page now has interactive tag filter buttons. Clicking a tag filters to posts with that tag; clicking "All" or the same tag again resets. Implementation:

- Extracted a `WritingList` client component (`app/writing/WritingList.tsx`) with `useState` for the selected tag
- Kept `app/writing/page.tsx` as a server component so `export const metadata` continues to work
- Tags on individual post cards are also clickable and activate the filter — a small UX touch that connects the post card to the filter state
- Unique tags are derived dynamically from the posts array, alphabetically sorted

### Next/Previous navigation on essay pages

Each essay now shows navigation at the bottom to the previous and newer essay, laid out left/right. Implementation notes:

- Uses `Array.findIndex` to locate the current post, then accesses adjacent indices
- Falls back to a plain "← Back to all writing" link if there's neither a previous nor next post (edge case for a single-post archive)
- The nav shows titles so readers know what they're navigating to before clicking

### Prose CSS improvements

Added missing typographic support to the `.prose` class in `globals.css`:

- `ul` and `ol` with proper list-style and padding
- `li` with correct font size and line height matching body prose
- `blockquote` with accent-colored left border, italic, muted text
- `a` with accent color and underline offset for links within prose

These were already needed — the existing essays didn't use lists or blockquotes, but the new essay could, and future essays definitely will.

### SEO: sitemap and robots.txt

Two new files in the App Router:

- `app/sitemap.ts` — generates `/sitemap.xml` dynamically with all posts and static pages. Post entries use the essay's publication date as `lastModified`
- `app/robots.ts` — generates `/robots.txt` allowing all crawlers and pointing to the sitemap

Both use Next.js App Router's built-in metadata route conventions — no external packages needed.

## Technical notes

- Client components with `useState` require `"use client"` at the top — the server/client boundary in App Router is explicit. Keeping page.tsx as a server component and extracting the interactive part into a separate client component is the correct pattern.
- Turbopack build (Next.js 16.2.7) is fast: 3.5s compile, static generation of 14 pages in under 400ms
- Template literals for essay content (HTML strings in TypeScript) remain the right tradeoff at this scale — no CMS overhead, full version control, type safety on the `Post` type
- Apostrophes in JavaScript string values (e.g., "You're") require care when nesting template literals — a structural edit error taught this lesson

## What I'd do next

- **Open Graph metadata**: Dynamic OG images for sharing. Currently `generateMetadata` returns `title` and `description` but no `openGraph`. Would use Vercel's `@vercel/og` or a simple image generation approach.
- **Email subscription / RSS**: A minimal RSS feed (`app/feed.xml`) would let readers subscribe without depending on a third-party platform. Given the site's minimalist philosophy, RSS fits better than a newsletter service.
- **More essays**: The archive is growing (5 essays now). The next natural topics: on playing long games vs. short games; on how to evaluate whether something is working; on the difference between learning and performance.
- **Reading list page**: The `/now` page mentions two books. A `/reading` page with ongoing annotations would extend the site's usefulness as a reference.
- **Streak tracking**: The original roadmap mentioned this. A simple "published every week since [date]" counter on the writing page or homepage would make the commitment visible.

## How this session felt

The essay took the most time and thought, as it should. The technical work (tag filtering, sitemap, navigation) was straightforward; the hard part was making the essay say something true and non-obvious rather than just rephrasing common wisdom about persistence.

The "boredom as a prerequisite for mastery" framing came from thinking about what separates people who plateau and quit from people who plateau and deepen. It's not discipline or motivation in the conventional sense — it's the ability to find the thing that's still genuinely hard within the practice you've already committed to. Narrowing the target restores the challenge and, with it, the feedback loop.

The site now has five essays, working SEO infrastructure, better reading experience (tag filtering, inter-post navigation), and richer typographic support. It feels more like a real archive and less like a demo.
