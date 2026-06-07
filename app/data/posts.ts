export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  readTime: number;
  tags: string[];
};

export const posts: Post[] = [
  {
    slug: "compounding-improvements",
    title: "The Compounding Effect of Getting 1% Better",
    date: "2026-05-20",
    excerpt:
      "Small daily improvements compound into extraordinary results. Here's how to harness the mathematics of marginal gains — and why the early months look like nothing is happening.",
    readTime: 5,
    tags: ["habits", "mindset"],
    content: `<p>If you improve at something by just 1% every day, by the end of a year you'll be 37 times better. Get 1% worse each day, and you'll decline to nearly nothing. This math — 1.01 to the power of 365 versus 0.99 to the same — has been cited so often it risks becoming a cliché. But most people miss what actually makes it difficult to apply.</p>

<p>The problem isn't understanding compounding. It's that compounding is invisible in the moment. A day where you write a slightly better paragraph, hold a plank ten seconds longer, or understand a concept just a bit more deeply — these feel unremarkable. They don't feel like progress. They <em>are</em> progress, but you can't see them compound in real time.</p>

<h2>The invisibility problem</h2>

<p>We're pattern-matching creatures who expect effort to produce proportional results. Study an hour, understand a bit more. Practice for a week, get noticeably better. This linear expectation is wrong for most worthwhile skills, but it's deeply intuitive. So when we put in the work and don't see dramatic results, our brains register failure — and failure is demotivating.</p>

<p>The antidote isn't motivation. It's building a system where you don't need to see results to continue. James Clear calls these identity-based habits: you're not trying to run a marathon, you're becoming someone who runs. The behavior follows from the identity, not the other way around. When not running would feel weird, you've won.</p>

<h2>What actually compounds well</h2>

<p>Not everything rewards compounding equally. Before committing to a practice, it's worth asking: will this skill be more valuable in ten years than it is today? Writing compounds well — every essay makes the next one easier and better. Physical fitness compounds well — a decade of consistent training produces capabilities that can't be bought or shortcut. A second language compounds well, slowly at first and then explosively once fluency is approached.</p>

<p>Skills that are context-specific, easily automated, or tied to a particular employer's needs compound less well. Choose your compounding investments carefully. The question isn't what you want to be good at — it's what you're willing to be bad at, consistently, for a long time before the compound kicks in.</p>

<h2>Protect the compound</h2>

<p>Most writing about improvement focuses on peaks: the perfect morning routine, the optimal training program, the ideal reading system. But what actually kills compounding is variance — the terrible days that break the streak and reset your momentum.</p>

<p>Missing one day is forgivable. Missing two days is the beginning of a new habit. The most valuable skill in any long-term pursuit isn't performing at your best — it's never having a zero day. A rough workout beats no workout. A terrible draft beats a blank page. Show up even when you don't want to, even if only for ten minutes. The compound needs you to keep showing up.</p>

<p>The practical question: what are you compounding right now? And is it actually what you want to be 37 times better at in a year?</p>`,
  },
  {
    slug: "deep-work-is-a-skill",
    title: "Deep Work Is a Skill, Not a Setting",
    date: "2026-05-28",
    excerpt:
      "Most advice about deep work focuses on environment — turn off notifications, close the door. But the real challenge is that focused attention itself needs to be trained like a muscle.",
    readTime: 6,
    tags: ["focus", "productivity"],
    content: `<p>Most advice about deep work focuses on environment: turn off notifications, close the door, use website blockers. This is all useful. But it misses the more fundamental challenge — focused attention is itself a skill that needs to be trained, and like all skills, it atrophies when unused.</p>

<p>We've spent years training ourselves to be constantly interruptible. Every notification accepted, every context switch made, every half-hour meeting scheduled has taught our brains that sustained focus is neither expected nor required. The result is that many people who want to do deep work have literally lost the ability to focus for more than twenty minutes at a stretch. The environment is fine. The muscle is gone.</p>

<h2>Focus as a muscle</h2>

<p>Anders Ericsson's research on expertise showed that the best performers in any field are those who engage in deliberate practice — effortful, focused, and outside their comfort zone. The same principle applies to focus itself. You can't get better at sustained attention by having good intentions. You have to practice it, progressively, just like lifting.</p>

<p>Start small: twenty minutes of genuine, distraction-free work. Not just time with notifications off, but actual focused engagement with a challenging problem. Notice when your mind wanders (it will, constantly at first), and bring it back without judgment. This is the mental equivalent of a push-up. Do it daily, gradually extend the duration, and over months you'll rebuild capacities that years of distraction have degraded.</p>

<h2>The uncomfortable middle ground</h2>

<p>Deep work feels uncomfortable in ways that shallow work doesn't. When you're processing email or in meetings, you're busy and social — two things humans are wired to enjoy. When you're genuinely thinking hard about something uncertain and important, there's nothing to show for it mid-stream. Progress is invisible until it suddenly isn't.</p>

<p>This discomfort is actually the signal that you're doing it right. If focused work feels effortless and pleasant, you're probably in a flow state with something you already know how to do. The genuinely productive deep work sessions — the ones that build real capability — are often the ones that feel the most uncomfortable in the moment.</p>

<h2>Design for your worst day</h2>

<p>My deep work practice lives or dies not on my best days but on my worst ones. On days I wake up energized and motivated, deep work happens naturally. On days I'm tired or distracted or don't feel like it, I need the system to do the work that willpower can't.</p>

<p>This means: scheduled blocks in my calendar that I treat like meetings I can't cancel. A small startup ritual — same first task, same playlist or silence — that cues focus automatically after a few weeks. Commitment devices that make distraction physically inconvenient rather than just theoretically undesirable. The environment should do what willpower shouldn't have to.</p>

<p>The output of deep work isn't just the work itself. It's the proof to yourself that you can still think, still create, still do the hard thing. That confidence compounds too.</p>`,
  },
  {
    slug: "deliberate-practice",
    title: "What Deliberate Practice Actually Looks Like",
    date: "2026-06-02",
    excerpt:
      "Anders Ericsson's research on expertise gets cited everywhere. But most people miss the most important part — the one that makes it actually work.",
    readTime: 7,
    tags: ["learning", "skills"],
    content: `<p>Anders Ericsson's research on expertise — popularized by Malcolm Gladwell's "10,000 hours" framing — gets cited constantly and misunderstood almost as often. The actual finding isn't that practice makes perfect. It's that a very specific kind of practice makes perfect, and most practice doesn't qualify.</p>

<p>Deliberate practice has four components: it targets specific weaknesses, it operates at the edge of current ability, it requires focused attention throughout, and it includes immediate feedback on performance. Miss any of these and you might improve, but you'll improve slowly and hit ceilings much sooner than necessary.</p>

<h2>The specificity requirement</h2>

<p>Most people practice the things they're already good at. It's rewarding to do things well. A chess player who loves endgames will study endgames. A writer who has a strong voice will write essay after essay without ever improving their structural arguments. A programmer who's confident in one language will keep building things in it rather than learning a paradigm that would expand their thinking.</p>

<p>Real improvement requires identifying your specific weaknesses and targeting them directly. This is uncomfortable by design. If it were comfortable, you'd already be good at it. The drill should feel hard and somewhat demoralizing — that's not a sign you're failing; it's a sign the deliberate practice is working. The discomfort is the mechanism.</p>

<h2>The feedback loop problem</h2>

<p>One reason chess players improve faster than most professionals is that chess provides immediate, unambiguous feedback. You made a move, your opponent responded, the game is going well or it isn't. Most professional skills have much longer and fuzzier feedback loops. Did that presentation go well? It's hard to say. Is this essay good? You won't really know for months, if ever.</p>

<p>The solution is to compress your feedback loops artificially. Get more writing reviewed more often. Record yourself doing the thing you're trying to improve and watch it back — this is uncomfortable in a specific way that accelerates learning. Find mentors or peers who can give you honest feedback before the world does. Build in checkpoints that force evaluation before moving on.</p>

<h2>Volume is not the point</h2>

<p>Here's what Gladwell's popularization lost: Ericsson's subjects who reached expertise didn't just practice more hours than their peers. They practiced <em>better</em>. The best violinists in his study didn't spend more total time practicing — they spent more of their practice time in deliberate, effortful, uncomfortable work rather than playing pieces they already knew.</p>

<p>Two hours of deliberate practice is worth far more than eight hours of going through the motions. If you leave a practice session feeling good and comfortable, you probably didn't push hard enough. If you leave frustrated and exhausted and slightly more capable than when you started — that's the session that's building something real.</p>

<p>The corollary: you can't sustain deliberate practice for very long each day. Ericsson found that the best performers rarely practiced for more than four hours of genuinely deliberate work. After that, the quality degrades. This reframes rest not as laziness but as part of the training architecture.</p>`,
  },
  {
    slug: "reading-system",
    title: "My Reading System After a Decade of Trying",
    date: "2026-06-05",
    excerpt:
      "I've tried every reading system: the commonplace book, Zettelkasten, Roam, Notion databases. Here's what I've kept, what I've discarded, and the single principle that now guides everything.",
    readTime: 6,
    tags: ["reading", "learning"],
    content: `<p>I've tried every reading system. The commonplace book. The Zettelkasten. Roam Research. Notion databases with linked references. Anki flashcards for every concept. Highlights-only. Full transcription. Most of them made reading feel more like a chore than a pleasure, and my actual retention improved less than I'd hoped.</p>

<p>After a decade of experimenting, I've landed on something simple that actually works for me. But more importantly, I've developed a guiding principle: reading for synthesis is more valuable than reading for coverage.</p>

<h2>Coverage versus synthesis</h2>

<p>Coverage is reading a lot of books so you can say you've read them. It's a way of feeling productive without doing the real cognitive work. You absorb facts, you follow arguments, but you don't change how you think. You add to your list but not to your understanding.</p>

<p>Synthesis is reading different books and noticing how they connect, contradict, and illuminate each other. It's reading Adam Smith and then reading a behavioral economist and noticing which parts of classical economic theory hold up and which get demolished. It's reading a history of Rome and recognizing patterns you'd encountered in a book about evolutionary biology. This kind of reading changes how you think, not just what you know.</p>

<p>The practical implication: read fewer books, more slowly. Spend time with books you've already read. Read things that are in conversation with each other. Let the books talk to each other in your notes.</p>

<h2>What I actually do</h2>

<p>I read in two blocks: mornings before screens, usually 30–45 minutes, and evenings before sleep, usually 20–30 minutes. This totals about five hours per week — enough for roughly 25 books a year if you're selective about what you read and when to stop.</p>

<p>For note-taking: I write in the margins. For physical books, literally — pen in hand. For ebooks, I use highlight comments that force me to react to what I'm reading rather than just marking it. At the end of a session, I take five minutes to write one or two sentences about what I just read. Not a summary — a reaction. What does this connect to? What assumption does it challenge? What do I want to think more about?</p>

<p>The notes go nowhere elaborate. A simple text file organized by date. What matters is the act of writing, not the system that holds the notes. Writing forces synthesis that passive reading doesn't.</p>

<h2>What I've discarded</h2>

<p>I stopped trying to read 52 books a year. The number is seductive but counterproductive — it incentivizes moving on before you've really understood something. I stopped building elaborate note systems that took more time to maintain than they returned in insight. I stopped finishing bad books out of a misplaced obligation to whoever wrote them.</p>

<p>The reading system that works is the one you'll actually use, consistently, for years. Complexity is the enemy of consistency. Find the minimum viable system, protect it from the urge to optimize, and trust that the compound will take care of the rest.</p>`,
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
