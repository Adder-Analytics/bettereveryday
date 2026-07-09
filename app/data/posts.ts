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
  {
    slug: "money-math",
    title: "The Money Math Nobody Teaches You",
    date: "2026-06-09",
    excerpt:
      "The same equation behind the 1% better habit is also the single most important concept in personal finance. Understanding it clearly changes what you do — and when you start.",
    readTime: 7,
    tags: ["finance", "math"],
    content: `<p>There's an equation that appears in two completely different contexts, and recognizing the connection changes how you think about both. You've probably seen it in the context of habits: if you improve by 1% every day for a year, you end up 37 times better. 1.01 to the power of 365. The math of compounding.</p>

<p>The same equation is the most important idea in personal finance. And yet it's almost never taught that way — not in school, not by most financial advisors, not in the breathless articles about which stocks to buy. Understanding it clearly and early is worth more than any investment tip you'll ever receive.</p>

<h2>The arithmetic of time</h2>

<p>Here's what the math actually shows. If you invest $10,000 at age 25 and earn an average annual return of 8% (roughly what broad stock market index funds have historically returned over long periods), by age 65 you'll have about $217,000. That single $10,000 investment grew to 21 times its original value without you touching it.</p>

<p>Wait ten years and invest that same $10,000 at 35 instead. At 65, you'll have about $100,000. Not $217,000. $100,000. The decade of delay — years when you were still young and the market was available to you — cost you $117,000 from a single $10,000 investment.</p>

<p>This is the Rule of 72, and it's the one piece of financial arithmetic worth memorizing: divide 72 by your expected annual return to find how many years it takes to double your money. At 8%, your money doubles every 9 years. At 6%, every 12 years. At 4%, every 18 years. The math demands you start early because every doubling you miss in your twenties is a doubling that would have cascaded through every decade that followed.</p>

<h2>Why people optimize the wrong thing</h2>

<p>Most personal finance coverage focuses on stock picking, timing the market, finding the next great investment, crypto, real estate plays. The implicit promise is that skill in selecting investments will produce better outcomes. And maybe it will — marginally, occasionally, unpredictably.</p>

<p>But the math shows that the variable that matters most isn't which investment you pick. It's how long the money has to compound. A mediocre investment started at 25 beats a great investment started at 45. Time is the lever that moves everything else, and it's the one you can only pull while you're young.</p>

<p>The practical conclusion: maximize time in the market, not return in the market. This means starting as early as possible, in low-cost index funds that track the whole market (Vanguard, Fidelity, and Schwab all offer these with negligible fees), inside tax-advantaged accounts (a 401k match is literally free money; an IRA compounds without annual tax drag), and then leaving it alone for decades.</p>

<h2>The same invisibility problem</h2>

<p>Here's why this is genuinely hard to do even once you understand it: the first decade looks like nothing is happening. You put $500 a month into an index fund from 25 to 35, and at 35 you have roughly $90,000. That's meaningful, but it doesn't feel extraordinary. It feels like a decade of discipline that produced a car's worth of savings.</p>

<p>What's invisible is everything that $90,000 will do from 35 to 65 without you adding another dollar. At 8%, it becomes roughly $906,000. The work you did in your twenties is doing most of the compounding in your fifties and sixties — you just can't see it yet.</p>

<p>This is the identical problem as habits: the effort is front-loaded and the payoff is back-loaded. Our brains are poorly calibrated for this. We're wired to expect proportional returns on proportional effort. The compound doesn't work that way. It's slow, invisible, and then suddenly overwhelming — but only if you started early enough to reach the overwhelming part.</p>

<h2>What to actually do</h2>

<p>The practical version of all this is almost insultingly simple: if your employer offers a 401k match, contribute at least enough to get the full match (that's an immediate 50-100% return before any market growth). Open a Roth IRA if you're eligible. Put the money in a low-cost total market index fund. Set up automatic contributions. Stop looking at it except once a year. Repeat for forty years.</p>

<p>The difficulty isn't the strategy — the strategy is known and simple. The difficulty is the same as every compounding challenge: acting now on behalf of a future self who feels abstract, trusting math you can't see work in real time, and resisting the noise that will tell you to do something clever with money that should be doing something boring.</p>

<p>The compound doesn't care whether you find it exciting. It only cares whether you started.</p>`,
  },
  {
    slug: "decision-quality",
    title: "The Difference Between a Good Decision and a Good Outcome",
    date: "2026-06-09",
    excerpt:
      "We judge decisions by their outcomes. But outcomes have randomness. Learning to separate decision quality from outcome quality is one of the most useful mental moves you can make.",
    readTime: 6,
    tags: ["thinking", "decisions"],
    content: `<p>A drunk driver makes it home safely. A careful driver gets hit by someone running a red light. We have intuitions about these situations — we know the drunk driver got lucky and the careful driver got unlucky — but we don't apply the same logic to our own decisions, where the feedback is murkier and the stakes feel higher.</p>

<p>This is the distinction between decision quality and outcome quality, and confusing them is one of the most reliably expensive cognitive errors a person can make.</p>

<h2>Resulting</h2>

<p>Annie Duke, a former professional poker player, calls this "resulting" — judging the quality of a decision by its outcome. It's seductive because outcomes are visible and decisions are invisible. You can observe what happened. You can rarely observe how good your thinking was when you made the call.</p>

<p>The problem: outcomes have randomness. A business that succeeded might have been a mediocre decision that got lucky. A business that failed might have been an excellent decision that got unlucky. If you learn from the outcome rather than the decision, you'll update your beliefs in the wrong direction. You'll think the lucky mediocre decision was a good strategy. You'll abandon the unlucky good strategy. Your judgment gets worse over time even as your experience accumulates.</p>

<p>This is especially dangerous in domains where the feedback loop is long and noisy — careers, relationships, investments, creative work. These are precisely the domains where better decisions matter most, and they're the ones where outcome-based learning is most misleading.</p>

<h2>What good decisions actually look like</h2>

<p>A good decision is one that was well-reasoned given the information available at the time, accounted appropriately for uncertainty, and considered the range of plausible outcomes — not just the hoped-for one. Note that this definition says nothing about what actually happened. A good decision can produce a terrible outcome. A bad decision can produce a great one.</p>

<p>The discipline of evaluating decisions this way requires asking: <em>What did I know when I made this call? What was the realistic probability distribution of outcomes? Did I reason honestly about the downside, or did I mostly imagine the upside? Would I make the same decision again with the same information?</em></p>

<p>That last question is the key one. If a bet goes badly but you'd make it again under the same conditions, you didn't make a mistake. You made a good bet that didn't pay off. Those happen. The right response is to keep making good bets, not to abandon the strategy.</p>

<h2>The pre-mortem</h2>

<p>One of the most practically useful tools here is the pre-mortem, developed by psychologist Gary Klein. Before a major decision, imagine that you've already made it, time has passed, and it went badly. Now ask: what went wrong?</p>

<p>This technique works because it bypasses the optimism bias that makes us underweight failure scenarios when we're in the grip of a plan we're excited about. Imagining the failure as already having happened shifts your thinking from advocacy mode to analysis mode. You suddenly find yourself generating risks and failure modes that felt unimportant or even slightly disloyal to the plan a moment ago.</p>

<p>The pre-mortem doesn't mean abandoning the decision — it means stress-testing it. The decisions that survive a serious pre-mortem are more likely to be actually good decisions, not just compelling ones.</p>

<h2>Reversibility as a decision variable</h2>

<p>One clean rule that improves most decision-making: weight the reversibility of a decision heavily. Bad reversible decisions cost you time and perhaps money or embarrassment. You recover. Bad irreversible decisions can cost you things you cannot get back — health, relationships, reputation, compounding years.</p>

<p>For reversible decisions, err toward speed. The cost of being wrong is low, and moving quickly produces information that deliberation can't. For irreversible decisions, slow down dramatically. Add friction intentionally. Sleep on it. Run the pre-mortem. The asymmetry in consequences warrants an asymmetry in care.</p>

<p>Jeff Bezos called these Type 1 and Type 2 decisions — two-way doors and one-way doors. Most decisions are two-way doors. People treat too many of them like one-way doors, which makes them slow. The genuinely one-way doors deserve the slowness. The rest don't.</p>

<h2>The long run</h2>

<p>Here's the uncomfortable part: you can make excellent decisions consistently and still have a bad run of outcomes for years. The randomness is real and it doesn't care about your process. This is why most people don't maintain decision discipline — the feedback is too delayed and too noisy to feel like it's working.</p>

<p>But the math eventually wins. Over enough decisions, the quality of your reasoning shows up in the quality of your outcomes. The poker player who makes correct expected-value decisions every hand will have terrible sessions, terrible months. Over years, the money flows toward them. The investor who makes structurally sound decisions will have ugly years. Over decades, the compound takes hold.</p>

<p>The work isn't to get every outcome right. It's to get your process right, and then trust the process long enough for the math to show itself. That requires separating, in your own mind and in your own self-evaluation, the decisions from the outcomes. It's harder than it sounds. It's also more valuable than almost any other mental skill you could develop.</p>`,
  },
  {
    slug: "orders-of-magnitude",
    title: "How to Think in Orders of Magnitude",
    date: "2026-06-10",
    excerpt:
      "Most people can't feel the difference between a million and a billion. Fermi estimation is the practice that fixes this — and it's more useful than any other math skill most people will ever learn.",
    readTime: 7,
    tags: ["thinking", "math"],
    content: `<p>The US federal debt is around $34 trillion. A congressional hearing lasts four hours. An advocacy group proposes a policy that will cost $2 billion. These numbers appear in the same news cycle, and most people process them with the same mental shorthand: <em>big number</em>. But $2 billion is not a rounding error on $34 trillion — it's about 0.006% of it. The inability to feel this difference makes it almost impossible to evaluate claims that depend on scale.</p>

<p>Number sense — the ability to reason about scale without getting lost in zeros — is a skill, not a talent. The specific technique for developing it is called Fermi estimation, named for physicist Enrico Fermi, who famously estimated the yield of the first nuclear test by dropping scraps of paper and watching how far the blast wave carried them. He got within a factor of two. The technique generalizes far beyond physics.</p>

<h2>How it works</h2>

<p>The core move is to decompose an unknown quantity into pieces you can estimate. You might not know how many piano tuners are in Chicago, but you can estimate: Chicago has about 3 million people, maybe 1 in 20 households has a piano, each piano gets tuned once a year, a tuner can service about 4 pianos a day and works 250 days a year. That's 3,000,000 ÷ 2.5 people per household ≈ 1,200,000 households; ÷ 20 with a piano = 60,000 pianos; ÷ (4 × 250) = 60 tuners. The actual number is around 50–100. You got there without any specialized knowledge — just multiplication and a few reasonable guesses.</p>

<p>The point isn't precision. Being off by a factor of two is fine for almost every real-world purpose. What matters is being in the right order of magnitude — having an answer that's 60 rather than 6 or 6,000. An estimate within a factor of ten is almost always more useful than refusing to estimate.</p>

<h2>Why the gap between million, billion, and trillion matters</h2>

<p>Here's the intuition most people lack: a million seconds is about 12 days. A billion seconds is 31 years. A trillion seconds is 31,700 years. These three numbers feel adjacent when written out — six zeros, nine zeros, twelve zeros — but they describe completely different things. Any argument that treats them as roughly equivalent is an argument that has already failed.</p>

<p>This confusion is not academic. When politicians discuss budget line items, when journalists write about corporate valuations, when scientists report on distances in space — the numbers span many orders of magnitude, and the inability to feel those magnitudes makes you a passive recipient of whatever framing you're given. Developing even rough intuitions about scale makes you an active reader of quantitative claims.</p>

<h2>A few reference points worth memorizing</h2>

<p>Good Fermi estimation starts with a set of anchors — numbers you know well enough to build from. A short useful list: the world has about 8 billion people; the US has about 330 million; the average US household has about 2.5 people; US GDP is about $26 trillion; a working year has about 2,000 hours; a human lifetime is about 700,000 hours; light travels one foot per nanosecond.</p>

<p>With these anchors, you can estimate almost anything. How much would it cost to give every American $1,000? $330 billion — a significant but not incomprehensible fraction of the federal budget. If a company employs 10,000 people at an average cost of $100,000 per employee, their payroll is $1 billion per year — useful to know before evaluating their profitability. How many 20-minute podcast episodes would you need to listen to one million minutes? About 50,000. You'd have to listen to ten episodes a day for fourteen years.</p>

<h2>The practical application</h2>

<p>Fermi estimation is most useful as a sanity check. When you encounter a claim that depends on a number — a statistic in an article, a projection in a business plan, a cost estimate in a policy debate — the first question is: does this number make sense given what I know about scale?</p>

<p>A common pattern in misleading statistics is to report a number in whatever unit makes it sound most impressive. A drug that "helps 1 in 1,000 patients" sounds less impressive than one that "will help 330,000 Americans" — but they're the same claim. A government program that costs "only $3 per American per year" sounds negligible until you multiply: $3 times 330 million is $990 million, approaching a billion dollars.</p>

<p>The most practically useful version of this skill isn't mastery of Fermi techniques — it's developing the reflex to ask, for any important number: <em>Is this plausible given what I know about scale?</em> That reflex, applied consistently, filters out an enormous fraction of numerical nonsense before it has a chance to influence how you think.</p>

<p>Like any reflex, it's built by repetition. There's an <a href="/estimate">estimation trainer</a> on this site for exactly that — problems to decompose and order-of-magnitude guesses to check against the real figure. And for <em>why</em> a chain of rough guesses lands closer than a single confident one, see <a href="/writing/guessing-on-purpose">How to Guess on Purpose</a>.</p>`,
  },
  {
    slug: "inflation-silent-tax",
    title: "Inflation Is a Tax You Never Voted For",
    date: "2026-06-10",
    excerpt:
      "Cash doesn't just sit there — it slowly loses value. Understanding how inflation works, and doing the math on what it actually costs you, changes where you put your money.",
    readTime: 7,
    tags: ["finance", "math"],
    content: `<p>Somewhere between the moment you earn a dollar and the moment you spend it, a fraction of its purchasing power disappears. Not to the IRS — you've already paid them. Not to fees or losses. It just evaporates, quietly, every year. That's inflation, and it's been doing this your entire lifetime.</p>

<p>Most people understand inflation in the abstract: prices go up over time, a dollar today buys less than a dollar ten years ago. What most people don't do is run the actual numbers on what this costs them — specifically, what it costs to hold money in forms that don't keep up. Doing that math changes decisions.</p>

<h2>Real versus nominal</h2>

<p>The most important distinction in personal finance is one that gets almost no attention in mainstream coverage: real returns versus nominal returns. A nominal return is the percentage your money grew. A real return is the percentage your purchasing power grew — which means subtracting inflation.</p>

<p>In 2022, US inflation hit 8%. The average savings account that year offered around 0.1% interest. The nominal return was positive. The real return was negative 7.9%. A year of discipline — keeping money in a savings account instead of spending it — was, in purchasing power terms, a year of decline. The account balance went up; what it could buy went down.</p>

<p>This is not unusual. US inflation has averaged roughly 3–4% annually over long periods. Savings accounts rarely match it. When they do, it's typically during high-inflation crises when the interest rate spike is itself a symptom of the inflation eroding your cash. The structural condition is that safe, liquid money loses real value over time.</p>

<h2>The math of silent loss</h2>

<p>The Rule of 72 — divide 72 by your rate to find how long it takes to double — works just as well applied to inflation as to investment returns. At 3% inflation, prices double every 24 years. A retirement you're planning to fund with $1 million in today's dollars will require closer to $1.8 million in 24 years to buy the same things. The target moves, invisibly, every year.</p>

<p>Here's the concrete version: $100,000 kept in cash today, over ten years at 3% annual inflation, becomes $74,000 in purchasing power. You still have $100,000 in the account. You have not, by any standard you care about, preserved its value. You've chosen a form of slow decline that doesn't appear on any statement.</p>

<p>This is what makes inflation effective as a policy tool and dangerous as a personal assumption: the loss is never visible as a loss. There's no red number, no transaction record, no moment when the subtraction happens. It's distributed across millions of daily prices, and it accumulates over years. By the time you notice it, it's years old.</p>

<h2>Why cash is not the safe choice</h2>

<p>The intuition that cash is safe is correct in one narrow sense: cash doesn't go to zero the way a stock can. It doesn't default the way a bond can. In a short-term crisis, liquidity is real and valuable. Cash's safety is real — over short periods.</p>

<p>Over long periods, the risk of cash isn't a dramatic collapse. It's a slow, certain, invisible one. A 3% annual loss in purchasing power, compounding over twenty years, cuts the real value of your cash by about 45%. The "safe" asset is safe from one kind of risk and fully exposed to another, rarer kind — one you're not measuring because it doesn't show up as a loss.</p>

<p>The investment vehicles that outpace inflation over long periods are equities — ownership stakes in real companies producing real goods and services, whose value tends to grow in real terms because the underlying economy tends to grow in real terms. Stocks are not safe in any short-term sense; they fluctuate dramatically. But "safe from short-term fluctuation" and "safe from long-term purchasing power loss" are different properties, and conflating them produces bad decisions about where to keep money you won't need for decades.</p>

<h2>What to actually do about it</h2>

<p>The practical implication is not complicated: don't hold more cash long-term than you need for genuine liquidity. An emergency fund covering three to six months of expenses in a high-yield savings account is prudent and worth the inflation drag — that's insurance against income disruption, and the premium is the real return you're forgoing. Beyond that, money you won't need for years belongs in assets that grow in real terms.</p>

<p>When evaluating any investment or savings vehicle, the first question is: what is the real return? Nominal returns are the advertised number. Real returns are what you'll actually have when you go to buy something with the money. A bond yielding 4% during 5% inflation is a losing proposition in real terms. A savings account yielding 5% during 2% inflation is a fine short-term holding. The number that matters is always the difference.</p>

<p>Inflation doesn't ask your permission. It doesn't depend on your awareness of it. It operates on your money whether or not you understand it, whether or not you've done the math. The only leverage you have is in deciding, deliberately, which assets you hold — and understanding that "holding cash" is itself a decision with a real cost attached, not a neutral default.</p>`,
  },
  {
    slug: "second-order-thinking",
    title: "And Then What? Thinking Past the First-Order Effect",
    date: "2026-06-11",
    excerpt:
      "Every decision produces consequences, and those consequences produce consequences. Most bad decisions come from stopping the analysis one step too early — and there's a specific question that fixes it.",
    readTime: 6,
    tags: ["thinking", "decisions"],
    content: `<p>In 1935, Australia had a beetle problem. Cane beetles were destroying Queensland's sugar crops, and the government's solution was elegant: import cane toads from South America to eat them. A natural predator, no pesticides, problem solved. The toads were released, and two things happened. First, they largely ignored the beetles, which live near the tops of cane stalks where toads can't reach. Second, they bred. Australia now has hundreds of millions of cane toads, they're toxic to nearly every native predator that tries to eat them, and they've become one of the worst ecological disasters in the country's history.</p>

<p>The failure wasn't a lack of intelligence. The people who made the decision reasoned correctly about the first link in the causal chain: toads eat insects, beetles are insects. What they didn't do was ask the question that would have saved them: <em>and then what?</em></p>

<h2>The seen and the unseen</h2>

<p>The French economist Frédéric Bastiat made this the centerpiece of an essay in 1850, and his framing has never been improved on: the difference between a bad economist and a good one is that the bad economist considers only the effect that can be seen, while the good one also considers the effects that must be foreseen.</p>

<p>His example was a broken shop window. The visible effect: the glazier gets paid, money circulates, and someone might even conclude the broken window stimulated the economy. The unseen effect: the shopkeeper now can't spend that money on the shoes or books he would have bought instead. The glazier's gain is exactly offset by an invisible loss elsewhere. The error isn't in the logic — it's in where the logic stops.</p>

<p>This pattern is everywhere once you have a name for it. The visible effect of a hiring freeze is lower costs this quarter. The unseen effect is the senior engineer who quietly starts interviewing elsewhere because her team is permanently understaffed. The visible effect of skipping the workout is a free hour today. The unseen effect is distributed across hundreds of future days, none of which will individually feel like a consequence.</p>

<h2>Second-level thinking in competitive arenas</h2>

<p>The investor Howard Marks draws the same distinction in markets, where he calls it second-level thinking. First-level thinking says: this is a good company, so the stock will go up. Second-level thinking says: this is a good company, but everyone can see that it's a good company, so its quality is already reflected in the price — the only question that matters is whether it's better or worse than the price implies.</p>

<p>This is the special property of any competitive arena: the first-order conclusion is already priced in. In markets, in job hunting, in choosing where to live, the obvious move has been seen by everyone capable of seeing the obvious. Whatever advantage existed in the first-order observation has been competed away. The opportunity, if there is one, lives exclusively at the second level — in the gap between what's true and what everyone believes is true.</p>

<h2>Why we stop at the first order</h2>

<p>First-order effects are immediate, visible, and attributable. Second-order effects are delayed, diffuse, and deniable. This asymmetry isn't just cognitive — it's built into most incentive structures. A politician gets credit for the visible factory the subsidy created, not blame for the invisible businesses that never started because of the tax that funded it. An executive gets rewarded for this quarter's cost reduction, not penalized for the attrition that shows up in next year's numbers, possibly on someone else's watch.</p>

<p>There's a personal version of this asymmetry, and it has a useful structure: for a surprising number of decisions, the first-order and second-order effects have opposite signs. Eating the dessert is first-order positive, second-order negative. Exercise, hard conversations, saving money, asking the embarrassing question — first-order negative, second-order positive. This suggests a heuristic worth taking seriously: <em>be suspicious of anything that is purely pleasant now, and give a second look at anything whose costs are all up front.</em> Most things worth doing are first-order negative and second-order positive, which is precisely why they remain available to do.</p>

<h2>The practice</h2>

<p>The technique is not complicated. When evaluating a decision, ask "and then what?" — and then ask it again. The first iteration gets you past the immediate effect. The second gets you to the responses: how will the people affected by this adapt? Second-order effects matter most in systems that contain people, because people respond to whatever you do. Prices adjust, competitors react, employees reroute around the policy. A rule that assumes everyone keeps behaving the way they did before the rule is a rule that has already failed.</p>

<p>Two refinements make the question sharper. First, run it across time horizons: what does this look like in ten minutes, ten months, ten years? Decisions that look identical at the first horizon often separate dramatically at the third. Second, ask it about the response to the response — not just "what happens next" but "what will people do about what happens next."</p>

<p>First-order thinking is everyone's default. It's fast, it feels complete, and in simple mechanical situations it's perfectly adequate. But in any system with feedback — an economy, a company, a family, your own habits — the first-order answer is the one everyone already has. The second order is where the actual consequences live, and almost nobody is looking there. That's not a reason to despair about human reasoning. It's an enormous standing opportunity for anyone willing to ask one more question.</p>`,
  },
  {
    slug: "metric-not-the-mission",
    title: "The Metric Is Not the Mission",
    date: "2026-06-12",
    excerpt:
      "Every measure is a stand-in for something you actually want. Attach rewards to the measure, and people will deliver the measure — not the thing. The pattern has a name, a long history, and a defense.",
    readTime: 7,
    tags: ["systems", "decisions"],
    content: `<p>In 1902, the French colonial government in Hanoi had a rat problem. The city's new sewers had become a breeding ground, plague was a real fear, and the administration announced a sensible-sounding program: a bounty for every rat killed. To keep things sanitary, you didn't have to deliver the rat — just its tail.</p>

<p>The tails came in by the thousands. And then people began noticing something strange in the streets: living rats, healthy and busy, with no tails. The rat catchers had realized that a dead rat earns one bounty, but a live rat that keeps breeding produces an unlimited supply of future tails. Inspectors later found farms on the outskirts of the city where rats were being raised for harvest. The bounty program was producing rats.</p>

<p>The Soviet Union ran the industrial version of this experiment for decades. When nail factories were given quotas by count, they produced millions of tiny, useless nails — maximum units, minimum material. When the planners noticed and switched the quota to weight, the factories pivoted to enormous nails, the size of railroad spikes, useless for almost everything. The detail that matters: the factories weren't malfunctioning. They were doing precisely what they were told. Gaming a metric isn't deviance. It's compliance — with the system as actually specified, rather than as intended.</p>

<h2>A law with two discoverers</h2>

<p>In 1975, the British economist Charles Goodhart observed that any statistical regularity tends to collapse once pressure is placed on it for control purposes. The anthropologist Marilyn Strathern later compressed this into the form everyone now quotes: <em>when a measure becomes a target, it ceases to be a good measure.</em></p>

<p>The same year — apparently independently — the management professor Steven Kerr published a paper whose title says everything: "On the Folly of Rewarding A, While Hoping for B." Organizations, Kerr observed, hope for long-term growth and reward quarterly earnings. They hope for teamwork and reward individual statistics. They hope for candor and reward agreement. And then they are sincerely surprised to receive exactly what they paid for. His sharpest example: in World War II, soldiers went home when the war was won, so individual incentives pointed at collective victory. In Vietnam, soldiers went home when their twelve-month tour ended — and the incentive pointed at personal survival until the date, an entirely different war from the one the strategy assumed.</p>

<h2>The mechanism</h2>

<p>Why does this keep happening, everywhere, to smart people who have read about it happening? Because a metric is never the thing you want. It's a proxy — chosen precisely because it's cheaper to observe than the thing itself. You want educated students; you can measure test scores. You want good code; you can count commits. You want customer relationships; you can count accounts opened.</p>

<p>The gap between the proxy and the target is where the gaming lives, and pressure widens it. Nobody even has to be cynical. Under enough pressure, the people who move the proxy honestly are simply outcompeted by the people who move it any way available. The system selects for gaming whether or not any individual intends it.</p>

<p>Wells Fargo made this legible at scale. Through the early 2010s, the bank's stated goal was deep customer relationships; its measured target was products per customer — eight of them, because "eight is great." Between 2011 and 2015, employees under quota pressure opened on the order of 1.5 million unauthorized accounts and over half a million unauthorized credit cards. The bank paid $185 million in fines, the CEO resigned, and the quotas were abolished. The instructive part is the scale: thousands of employees participated. Wells Fargo did not manage to hire thousands of uniquely dishonest people. It built an incentive structure that reliably manufactured the behavior, then prosecuted the output as if it were a character flaw. Charlie Munger's line is the whole story in nine words: show me the incentive and I'll show you the outcome.</p>

<h2>You do this to yourself</h2>

<p>It's tempting to file all this under management, someone else's problem. But the most consequential Goodhart failures in most lives are self-imposed, because you are both the designer of your own metrics and the agent gaming them.</p>

<p>A daily word count is a proxy for becoming a better writer — until you find yourself padding sentences at 11pm to hit the number. Books read per year is a proxy for understanding — until it quietly incentivizes finishing fast over thinking slowly. The step counter is a proxy for fitness, the salary is a proxy for a good life, and both keep getting optimized long after they've diverged from the thing they were supposed to stand for. The diligent people are the most exposed: gaming your own metrics is what conscientiousness looks like when it stops asking what the metric was for.</p>

<h2>Holding metrics loosely</h2>

<p>The wrong conclusion is to abandon measurement. Unmeasured goals drift, and "I'll just use judgment" is how most ambitions dissolve. The right conclusion is to stop treating any metric as the mission, and to manage the gap deliberately. A few practices that help:</p>

<p><em>Run the pre-mortem on the metric.</em> Before adopting a measure, ask: how would someone hit this number while completely failing at the real goal? If there's an easy answer — and there almost always is — you now know what the metric will eventually produce under pressure. Decide in advance whether you can live with that.</p>

<p><em>Pair metrics so that gaming one trips another.</em> Speed paired with defect rate. Output paired with a spot-check for usefulness. Accounts opened paired with accounts actually used — the single pairing that would have surfaced Wells Fargo's fraud years earlier, since most of the fake accounts sat empty.</p>

<p><em>Retire metrics while they're still working.</em> A measure is most informative when it's fresh, before anyone has had time to optimize against it. Treat metrics as instruments with a service life, not as permanent fixtures.</p>

<p><em>Re-state the mission separately, and check the metric against it.</em> The question "is the number going up?" needs a sibling that gets asked on a schedule: "is the thing the number was supposed to track actually improving?" The moment those two answers diverge, believe the second one.</p>

<p>A metric is a map of the territory you care about. Maps are useful precisely because they leave things out. But the moment you start paying people — including yourself — based on the map, you create a market for redrawing it. The territory doesn't care how the map looks. Keep checking the territory.</p>`,
  },
  {
    slug: "loss-aversion",
    title: "Losing Hurts More Than Winning Feels Good. Probably.",
    date: "2026-06-14",
    excerpt:
      "It's the most famous finding in behavioral economics — and one of the most quietly contested. How loss aversion held up under scrutiny is a more useful lesson than the bias itself.",
    readTime: 8,
    tags: ["psychology", "decisions"],
    content: `<p>Here is a bet. I flip a fair coin: heads, you win some amount; tails, you lose $100. How large would the win have to be before you'd take it? Almost nobody accepts the even-money version — win $100 or lose $100 on a coin flip. Most people want the upside somewhere around $200 before the bet feels worth it. But a $100-for-$100 coin flip is a mathematical wash, and anything above it is free money in expectation. People decline it anyway. The pain of losing $100 is doing roughly twice the work of the pleasure of winning it.</p>

<p>That asymmetry is loss aversion, and it is the most famous single idea to come out of behavioral economics. It is also, it turns out, one of the most quietly contested. The interesting part isn't the bias — it's what happened when people went looking to confirm it, because the lesson in that is more transferable than the bias itself.</p>

<h2>The case for</h2>

<p>Daniel Kahneman and Amos Tversky built loss aversion into prospect theory in 1979, and in a 1992 sequel they put a number on it: the sting of a loss was about 2.25 times the pleasure of an equivalent gain. "Losses loom larger than gains" became one of the load-bearing sentences of a discipline, and the supporting evidence was genuinely impressive.</p>

<p>The cleanest demonstration is the endowment effect. In a 1990 experiment, Kahneman, Knetsch, and Thaler handed coffee mugs to half the students in a room and nothing to the other half — at random, minutes earlier — then opened a market. If a mug was worth around $5 to a typical person, you'd expect roughly half the owners to sell. Instead, owners demanded about twice what buyers would pay — on the order of $7 to part with a mug versus $3 to acquire one — and almost no trades happened. Ownership, conferred by coin flip moments before, had roughly doubled the thing's value. The standard reading: giving up the mug registered as a loss, and losses loom larger.</p>

<p>It shows up with real money, too. The disposition effect, which Terrance Odean documented across 10,000 brokerage accounts, is the tendency to sell winning investments while clinging to losing ones — investors in his data realized their gains at roughly a 50% higher rate than their losses. Selling a winner books a gain; selling a loser makes the loss real, so people don't. There is a whole catalogue like this — status quo bias, the way a "10% chance of dying" frightens more than an identical "90% chance of surviving" reassures — and loss aversion sat underneath all of it as the common cause.</p>

<h2>The case against</h2>

<p>Then a strange thing happened: the more carefully people looked, the more the <em>universal</em> version frayed.</p>

<p>The sharpest challenge came from David Gal and Derek Rucker in a 2018 paper with a pointed title — "The Loss of Loss Aversion." Their main objection was about confounds. Return to the mugs. Selling a mug you were just handed isn't only experiencing a loss; it's also taking an <em>action</em>, departing from where you already are. Loss is tangled up with action, and gain with inaction. Design the experiment to pull those apart — so that keeping versus switching no longer lines up with losing versus gaining — and much of the asymmetry shrinks or disappears. People may not be loss-averse so much as change-averse, and the two had been quietly measured together.</p>

<p>There was a second, more philosophical objection. Loss aversion was routinely used to explain the endowment effect — while the endowment effect was treated as evidence <em>for</em> loss aversion. Deployed that way, the phrase isn't an explanation at all; it's a relabeling. "People overvalue what they own because losing it would hurt" adds nothing you didn't already see in the behavior. It's a description wearing the costume of a cause.</p>

<h2>What actually survived</h2>

<p>This is the part worth slowing down on, because the honest answer isn't "the famous thing was a myth." It's more interesting than that.</p>

<p>The defenders pushed back hard. A 2020 paper — its subtitle, "reports of its death are greatly exaggerated," sets the tone — pooled more than 17,000 participants and argued that loss aversion is real but has <em>moderators</em>. It's stronger for some people than others (experience and domain knowledge reliably shrink it), stronger for large stakes than trivial ones, stronger in some framings than others. What it is not is a universal constant of 2.25 applying to everyone, everywhere, including a coffee mug you've owned for ninety seconds.</p>

<p>So the careful version of the claim is narrower and more contingent than the slogan, and the slogan oversold it. Losses do tend to loom larger than gains — reliably enough to plan around in some settings, weakly or not at all in others. That's a less quotable sentence than "losses loom larger than gains," and it's the true one.</p>

<h2>Where it still bites</h2>

<p>The practical value didn't evaporate with the universal claim, because the settings where loss aversion holds up best are exactly the consequential ones.</p>

<p>The disposition effect is the clearest. If you can't bring yourself to sell a losing investment — waiting for it to "get back to even" first — notice that "back to even" is a fact about your purchase price, a number the market has never heard of and does not care about. The only real question is whether you'd buy it today at today's price. Sunk costs are the same machine running on time and effort instead of money: the half-finished degree, the project that stopped making sense two years ago, the commitment continued mainly because of what's already been poured in. In every case the spent thing is gone whether you continue or not, and the aversion to "wasting" it is precisely what keeps you spending more.</p>

<p>The framing effects are real enough to defend against, too. The same option described as a loss to avoid will feel more urgent than when it's described as a gain to capture — which is why warranties, insurance upsells, and "don't miss out" are all worded the way they are. When a choice suddenly feels urgent, it's worth asking whether the urgency is in the situation or only in the framing.</p>

<h2>The lesson under the lesson</h2>

<p>Loss aversion is worth understanding. But the more durable skill is in <em>how the idea held up to scrutiny</em> — because most of what you'll meet is in exactly this state: a real effect, oversold as a universal law, quietly walked back to "true under these conditions" by the people who bothered to check.</p>

<p>The discipline is to refuse both lazy responses. One is to swallow the slogan whole — repeating "losses loom twice as large as gains" as a fixed fact, which is more than the evidence will bear. The other is the cynical overcorrection that travels even faster: "loss aversion was debunked," equally false, and seductive because debunking a famous idea feels like sophistication. The honest position is the narrow one in between, and it satisfies neither instinct: it's real, it's contingent, here are the conditions, here's where I'd still bet on it. Hold your most-cited beliefs the way the careful researchers eventually held this one — not "is it true or false," but "where, how much, and how do I know?" That question is worth more than any single bias you might point it at.</p>`,
  },
  {
    slug: "plateau-boredom",
    title: "What to Do When You're Bored of Getting Better",
    date: "2026-06-08",
    excerpt:
      "Around month three or four of any practice, the novelty is gone but the results aren't dramatic enough to compensate. This is the plateau — and it's where almost every long-term skill is actually built.",
    readTime: 6,
    tags: ["habits", "mindset"],
    content: `<p>The first month of any meaningful practice is easy. Everything is new: the concepts, the sensations, the small wins. You can feel yourself improving in ways that are visible and concrete. This is the honeymoon phase, and it's a trap — because it doesn't last, and most people mistake its end for a signal to quit.</p>

<p>Around month three or four, the novelty is gone but the results aren't dramatic enough to compensate. The practice feels like maintenance rather than growth. Other things look more interesting. You start wondering if a different approach might work better. This is the plateau, and it's where almost every long-term skill is actually built.</p>

<h2>Why this moment is everything</h2>

<p>The excitement phase doesn't build lasting capability. It builds familiarity. What happens during the plateau is different in kind: the practice stops being something you do and starts becoming something you are. Identity-level change is slow and invisible and profoundly boring, which is why so few people stay long enough to experience it.</p>

<p>There's a paradox here. The new thing — the fresh system, the different approach, the reset — is appealing precisely because it's new. The excitement is guaranteed for the first few weeks. But you've already done the first few weeks of your current practice. You're comparing the highlight reel of something you haven't started against the lived reality of something you know intimately. That's not a fair comparison, and it's never in favor of the thing you're actually building.</p>

<h2>The switching cost nobody mentions</h2>

<p>When you abandon a practice at month four to start a new one, you lose more than the time invested. You lose the accumulated context: understanding of your specific failure modes, the adjustments you've made to fit the practice to your actual life, the deep familiarity with how it feels when it's working versus when you're coasting. The new practice starts at zero, and you'll hit the same plateau again in a few months, with nothing carried over.</p>

<p>The compound doesn't just operate on your skills — it operates on your self-knowledge. A year of consistent writing teaches you things about how your mind works that four different three-month writing experiments never could. Depth reveals things that breadth misses entirely.</p>

<h2>Reframing boredom</h2>

<p>Boredom in a practice isn't a signal that the practice has stopped working. It's often a signal that you've stopped noticing. The early improvements were obvious. The later improvements are subtle and structural — the way a foundation is less visible than the walls above it but more important.</p>

<p>One reframe that helps: boredom is evidence of competence. When you're struggling and overwhelmed, the practice is teaching you basics. When you're bored, you've entered the territory where mastery lives. The masters in any field are people who found a way to stay interested in things beginners find tedious — the edge cases, the small variations, the details that only matter once you're operating at the frontier. Boredom isn't the opposite of mastery. It's a prerequisite.</p>

<h2>What to do</h2>

<p>Don't quit. But don't grit your way through it either — that's a recipe for resentment, not growth. Instead: get more specific. Boredom is often a sign that you're practicing at too high an altitude. You're doing "writing" instead of working on the specific structural weakness your last ten drafts share. You're doing "training" instead of drilling the movement pattern that's actually limiting your progress.</p>

<p>The plateau becomes productive when you narrow the target. Find the thing that's actually hard right now and go there. The discomfort returns — which means you're back in the territory where learning happens.</p>

<p>The other shift that helps is finding a real audience. External feedback transforms a private practice into a conversation with stakes. Boredom has a harder time surviving accountability.</p>

<p>But mostly: stay. The people who get genuinely good at things aren't the ones who found the perfect practice. They're the ones who showed up long enough to understand what they were actually practicing.</p>`,
  },
  {
    slug: "availability-heuristic",
    title: "What Comes to Mind Is Not What's Likely",
    date: "2026-06-15",
    excerpt:
      "We judge how common something is by how easily examples come to mind. That worked when memory was a fair sample of the world. It stopped working the moment something else started curating what you remember.",
    readTime: 6,
    tags: ["psychology", "thinking"],
    content: `<p>Ask people whether more deaths in the United States come from homicide or from suicide, and most say homicide. Ask whether more come from accidents or from disease, and many say accidents. Both answers are wrong, and not by a little: suicide kills more people than homicide most years, and disease kills many times more people than accidents. The classic studies — Lichtenstein, Slovic, and colleagues in the late 1970s — found that people systematically overrate dramatic, reported causes of death and underrate quiet, common ones. The error has a direction, and the direction is the whole point.</p>

<p>Tversky and Kahneman named the mechanism in 1973: the <em>availability heuristic</em>. We estimate how frequent or likely something is by how easily instances come to mind. Asked whether shark attacks or falling airplane parts kill more beachgoers, you don't consult a table — you check how readily you can summon an example, and you answer from the ease of that retrieval.</p>

<h2>It usually works, which is the trap</h2>

<p>The reason the heuristic is so deeply wired is that it is usually <em>right</em>. For most of human history, the things you could recall easily were the things you had actually encountered often. If lions came to mind faster than leopards, it was probably because there were more lions around. Ease of recall was a decent proxy for frequency because your memory was a roughly fair sample of your own experience. The heuristic isn't a design flaw; it's a shortcut that was well-calibrated to the environment that produced it.</p>

<p>So the failure isn't that the heuristic is crude. The failure is specific and almost surgical: availability breaks exactly when something other than real frequency determines what you can easily recall. Vividness does it. Recency does it. Emotional charge does it. Sheer repetition does it. When any of those decouple from how often a thing actually happens, your sense of "how common is this?" quietly detaches from the world and attaches to whatever has been loud in your memory lately.</p>

<h2>The environment is now optimized against you</h2>

<p>Here is the uncomfortable modern turn. The information environment most of us live inside is engineered to maximize exactly the properties that break availability — and to strip out the one property that would keep it honest.</p>

<p>News is, almost by definition, a record of the non-representative. A plane that lands safely is not a story; the one in ten million that doesn't is wall-to-wall coverage. Reporting selects for the rare, the dramatic, and the emotionally legible, because that is what holds attention. An algorithmic feed goes further: it is tuned to engagement, and engagement correlates with outrage, fear, and novelty far more than with frequency. The result is a sample of reality curated by newsworthiness — which is close to the precise opposite of a base rate.</p>

<p>This produces a genuinely strange effect: the more closely you follow the news about a category of event, the <em>worse</em> calibrated your sense of its frequency can become. The feeling of being well-informed and the state of being well-calibrated can move in opposite directions. People who consume the most coverage of rare violent crime, plane crashes, or kidnappings are often the most miscalibrated about how common those things are, because their internal sample has been assembled by editors and recommendation engines optimizing for memorability, not for representativeness.</p>

<h2>What this is not</h2>

<p>The careful version matters here, because the lazy version — "your intuition is garbage, ignore your gut" — is both wrong and useless. Availability is not always distorting. For things you sample directly and fairly, recall remains a perfectly good estimator: you don't need a base rate to know how often it rains where you live, because your memory of local weather <em>is</em> a representative sample. The danger zone is narrow and identifiable. It is secondhand, curated, vivid information about large or distant populations — exactly the kind of thing you cannot sample yourself and so must take on a channel's terms.</p>

<p>So the fix is not to distrust intuition wholesale, which no one can actually do and stay functional. The fix is to learn to check the <em>provenance</em> of your sample. When a sense of "this is common" or "this is dangerous" arrives, ask one question: where did my examples come from? My own representative experience — or a channel that selects for memorability? If it's the channel, that's the signal to stop estimating from memory and go look up the actual rate.</p>

<h2>The move under the move</h2>

<p>This is why availability sits next to two other tools and not alone. The first is the <em>base rate</em>: when your gut delivers a frequency, treat it as a hypothesis and find the real proportion — what fraction of cases actually go this way? The second is number sense, the habit of estimating magnitudes from known pieces, because a base rate you can't interpret is no defense at all. Knowing that a risk kills "a few hundred people a year" only protects you if you can feel that against the size of the population it's drawn from.</p>

<p>The question to carry isn't "what comes to mind?" Your mind will always answer that one, instantly and with confidence. The better question is "what would I see if I could sample the whole thing fairly?" — and then the discipline to notice that you usually can't, and to go find the number instead of trusting the highlight reel your memory has been fed. The cost of getting this wrong is not abstract. It's where you point your fear, your money, your attention, and your vote.</p>`,
  },
  {
    slug: "anchoring",
    title: "The First Number Wins",
    date: "2026-06-16",
    excerpt:
      "The first number you hear pulls every estimate that follows toward it — even when you watched it come up on a rigged wheel. Why you can't just decide to ignore it, and what actually helps.",
    readTime: 7,
    tags: ["psychology", "decisions"],
    content: `<p>In one of the most-replicated experiments in psychology, Amos Tversky and Daniel Kahneman spun a wheel of fortune in front of their subjects. The wheel was rigged to stop on 10 or 65. Then they asked a question that had nothing to do with the wheel: what percentage of African countries are in the United Nations? People who watched the wheel land on 10 guessed about 25%. People who saw it land on 65 guessed about 45%. A number everyone knew was random — they had just watched it come up on a wheel — moved their answer by twenty points.</p>

<p>That is anchoring: the first number you encounter pulls every estimate that follows toward itself, even when you know it's meaningless, even when you'd swear it didn't. Tversky and Kahneman named it in 1974, alongside the mechanism they called <em>anchoring and adjustment</em>. You start from whatever number is in front of you and adjust toward what you actually believe — but you stop adjusting too soon, while you're still in the neighborhood of the anchor.</p>

<h2>Why it isn't just a lab trick</h2>

<p>The easy reaction is to file this under lab curiosities — rigged wheels, trivia about the UN. But anchoring runs deep for a reason worth respecting: most of the time, the first number really is informative. When a house lists at $400,000, that figure isn't random. It encodes the seller's read of the market, the neighborhood, the comparable sales. Anchoring on it and adjusting from it is a sensible starting move. The first number you hear is usually a clue, and using clues is not a bug.</p>

<p>Which is exactly why the failure is so hard to catch. The heuristic doesn't break when numbers influence you — that's often correct. It breaks when an <em>uninformative</em> number influences you as much as an informative one. A wheel of fortune carries no information about the United Nations, and it moved people twenty points anyway. The danger isn't that anchors pull. It's that arbitrary and strategically chosen anchors pull about as hard as legitimate ones, and from the inside the two feel identical.</p>

<h2>The number that was chosen to move you</h2>

<p>Once you see that meaningless numbers anchor, you start noticing how many of the numbers around you were placed there on purpose. The opening offer in a negotiation is the clearest case. Research consistently finds that the first number on the table drags the final price toward it — the side that anchors first often does better, because the other party spends the rest of the conversation adjusting away from a figure the first side chose. The "was $200, now $80" tag is the same move: the high "original" is an anchor placed so the real price feels like a rescue.</p>

<p>It reaches places it has no business being. In a striking study, the German researchers Birte Englich, Thomas Mussweiler, and Fritz Strack had experienced judges read a criminal case and then roll a pair of dice — secretly loaded — before recommending a sentence. Judges who rolled high recommended substantially longer sentences than judges who rolled low. These were legal professionals; sentencing was their craft; and a pair of dice moved their judgment. The anchor doesn't need to be plausible to work. It just needs to be the number you saw first.</p>

<p>But honesty about the research cuts both ways, and the negotiation case is where the slogan oversells. Making the first offer is not a free win. If the other side knows things you don't — the true value of the house, what the role actually pays — an aggressive opening anchor can backfire, advertising your ignorance and leaving on the table value you didn't know was there. The careful claim is the contingent one: anchoring first helps when you're well-informed about the range and hurts when you aren't. "Always make the first offer" is exactly the kind of confident, portable rule this site keeps finding to be narrower than advertised.</p>

<h2>Why you can't just decide not to</h2>

<p>The natural response — "fine, I'll ignore the anchor" — doesn't work, and it's worth understanding why. You can't un-hear a number. Once it's in your head it becomes the point your mind adjusts <em>from</em>, and adjustment is effortful: it takes deliberate work to keep moving away from the anchor, and you run out of conviction before you've gone far enough. Worse, people who know about anchoring are not measurably protected from it. Told in advance that the number is random, warned to ignore it, even paid to be accurate — subjects anchor anyway. Like most biases worth knowing, awareness does almost nothing on its own. The correction has to live in what you <em>do</em>, not in what you know.</p>

<h2>What actually helps</h2>

<p>Three habits measurably reduce the damage, and none of them is "try harder to ignore it."</p>

<p><em>Set your own anchor first.</em> Before you look at the salary range, the asking price, the consultant's estimate, write down your own number — what your own analysis predicts — and seal it before exposure. You can't stop their number from pulling you, but you can make sure you arrive with a competing one that wasn't chosen by the other side. This is the concrete reason the other tools on this site earn their place: a base rate or a Fermi estimate is, in practice, a number you generated yourself, which is the only kind of number an anchor can't manufacture for you.</p>

<p><em>Consider the opposite.</em> The one debiasing move that holds up in the lab is to argue against the anchor on purpose — to ask "what are the reasons this number is too high?" and then "too low?" Generating reasons the anchor is wrong is precisely what insufficient adjustment fails to do on its own; doing it deliberately restores some of the adjustment you'd otherwise skip.</p>

<p><em>Ask who put the number there.</em> When a figure appears — a price, a quote, a target, a forecast — pause on its provenance, the same question the availability heuristic demands of a vivid memory: did this number come from the thing I'm trying to estimate, or from someone who benefits from where I land? A list price, an opening bid, a "typical" budget, a suggested donation, the amount pre-filled as the default on a form — these are anchors with authors. Knowing a number was chosen for you doesn't dissolve its pull, but it tells you exactly which numbers deserve an independent estimate of your own to push back against.</p>

<h2>The move under the move</h2>

<p>Anchoring is, in the end, a fact about order: whatever comes first sets the frame, and everything after is an adjustment from it. That's why it appears wherever you have to put a value on something uncertain — money, time, probability, worth — and why the defense always has the same shape. Have your own number ready before you meet theirs. The first number wins; the only way not to lose to someone else's is to bring one of your own.</p>`,
  },
  {
    slug: "whether-or-not",
    title: "The First Mistake Is the Question",
    date: "2026-06-22",
    excerpt:
      "Most bad decisions aren't reasoned badly — they're framed badly, as 'whether or not' to do one thing, which quietly throws away every option nobody named. The fix takes minutes and routinely changes the answer.",
    readTime: 6,
    tags: ["decisions", "thinking"],
    content: `<p>Here is a decision you have probably made some version of: <em>should I take this job, or not?</em> It feels like a decision. You can weigh it. You can list the pros and the cons, sleep on it, ask a friend. But notice what the question has already done before you've reasoned about anything. It has reduced a wide-open situation — your work, your next few years, the dozen things you could be doing with them — to a single yes-or-no about one option. Everything you didn't name has quietly left the room.</p>

<p>Chip and Dan Heath, in their book <em>Decisive</em>, argue that this is where most decisions go wrong: not in the analysis, but in the framing that happens before any analysis starts. They call it <strong>narrow framing</strong> — treating a choice as "whether or not to do X" when the real choice is "X, or Y, or Z, or some combination nobody has written down yet." And the cost is large. When researchers tracked the decisions of teenagers, they found the kids framed something like two-thirds of their choices as "whether or not" — whether or not to go to the party, whether or not to break up. Adults in organizations do barely better. A study of company decisions found that only about a third of them ever considered more than one alternative. The rest were "whether or not" calls dressed up as deliberation.</p>

<h2>Why the frame is invisible</h2>

<p>The reason narrow framing is so dangerous is that it doesn't feel like a mistake. It feels like focus. When you're weighing whether or not to take the job, you are genuinely thinking hard — you're just thinking hard inside a box you didn't notice you were standing in. The diligence is real. The boundary of the question is the problem, and diligence inside a bad boundary only makes you more confident in a choice you never really opened up.</p>

<p>There's a tell, and it's almost grammatical. Any time you can phrase your decision with the word "whether," or any time it has exactly two sides — this or nothing, in or out, yes or no — you are probably in a narrow frame. Real decisions rarely have two sides. "Should I quit?" hides: negotiate the thing that's making you want to quit, transfer teams, go part-time, stay and start something on the side, leave for a specific better thing rather than away from this one. Each of those is a door the original question painted over.</p>

<h2>The cheapest improvement in decision-making</h2>

<p>The fix is almost embarrassingly mechanical, which is what makes it trustworthy: it doesn't depend on being wise in the moment. Before you decide, force the frame open.</p>

<p><em>Make yourself find one more option.</em> Not ten — the goal isn't paralysis. Just refuse to decide between one thing and nothing. The Heaths cite a striking finding from the German decision researcher Paul Nutt: simply adding a second alternative to consider made decisions dramatically more likely to be rated successful years later. The act of generating an option you weren't already attached to is most of the benefit, because it breaks the spell of the single path.</p>

<p><em>Run the vanishing test.</em> Ask: "what would I do if this option were suddenly off the table — illegal, impossible, gone?" People who insist they have only one choice can almost always answer this instantly, which proves they had other options the whole time; the frame had just hidden them. The job offer evaporates — now what? Whatever you'd scramble to do is a real alternative you were pretending you didn't have.</p>

<p><em>Find someone who already solved it.</em> Most of your decisions are not original. Someone has taken this job, made this move, had this hard conversation. Their experience is a cheaper teacher than your own future regret. This is the same instinct as looking up a base rate — replace the vivid story in your head with what actually tends to happen to people who do the thing.</p>

<h2>The trap on the other side</h2>

<p>It would be too neat to say "always widen, more options are always better," and it isn't true. Past a handful, more choices mostly produce anxiety and stall, not better outcomes — the well-documented cost of choice overload. And widening can curdle into its own avoidance: generating endless alternatives is a comfortable way to never decide, especially for a choice that's genuinely close and genuinely reversible. The honest version of the rule is narrow: the failure to beat is the <em>frame with one option in it</em>. Going from one to two or three is where almost all the value lives. Going from three to fifteen is usually a new way of being stuck.</p>

<p>This is also why widening pairs with the rest of a good decision rather than replacing it. Once you have real alternatives on the table, you still have to weigh them honestly — against the base rate, against the range of plausible outcomes, against how reversible each one is. Widening the frame doesn't make the decision for you. It just guarantees you're deciding among the choices you actually have, instead of the single one that happened to be loudest.</p>

<h2>Try it on the next one</h2>

<p>The next time you catch yourself asking whether or not to do something, stop at the word "whether." Write the question again with an "or" in it and at least two real options after it. It costs a few minutes, it requires no special insight, and it routinely changes the answer — not because you reasoned better, but because you finally let yourself reason about the right thing. The worksheet on this site opens every general decision with exactly this move, because it's the one step that, skipped, makes all the careful thinking that follows quietly beside the point.</p>`,
  },
  {
    slug: "advice-you-dont-take",
    title: "You Give Better Advice Than You Take",
    date: "2026-06-23",
    excerpt:
      "You can see the answer to a friend's dilemma in seconds and stay blind to the same one in your own life. That gap is measurable — and you can close it on purpose.",
    readTime: 6,
    tags: ["decisions", "psychology"],
    content: `<p>A friend sits across from you and lays out their dilemma — the job, the relationship, the move — and within a minute you can see it. Not because you're wiser than they are, but because you can see the whole board, and they can only see the one square they're standing on. What's strange is that you have a version of that exact dilemma in your own life, and on that one you are just as stuck as they are. You give counsel you can't take. You can read everyone's life but your own.</p>

<p>This isn't a personal failing. It's reliable enough to have a name and a number behind it.</p>

<h2>The wise king who couldn't run his house</h2>

<p>Psychologists call it Solomon's paradox, after the biblical king famous for dispensing wisdom to everyone who came to him and famous, in the same stories, for a personal life he governed disastrously. Igor Grossmann and Ethan Kross put it to the test: they gave people dilemmas — some framed as their own, some as a friend's — and scored the reasoning for the things wisdom is actually made of, like recognizing the limits of your own knowledge, considering other perspectives, and looking for compromise. People reasoned more wisely about a friend's problem than about an identical one of their own. The same person, the same problem, two different qualities of thought — the only thing that changed was whose name was on it.</p>

<p>The part that matters for everyday use is what fixed it. When the researchers had people reflect on their <em>own</em> dilemma from a distanced, third-person vantage — as if watching it happen to someone else — the gap closed. The wisdom was available the whole time. It was just locked behind the first person.</p>

<h2>Why the hot state is a bad advisor</h2>

<p>The mechanism underneath is what George Loewenstein named the hot–cold empathy gap. In a "hot" visceral state — fear, anger, infatuation, the adrenaline after bad news, the sting of a loss — we systematically overweight what we feel right now and lose the ability to model the calm version of ourselves who has to live with the choice. And it runs both directions: once you've cooled off, you genuinely can't reconstruct why it felt so urgent. Anyone who has read an email they fired off in anger, or remembered a panic-sell at the bottom of a dip, has met both selves and watched them fail to understand each other.</p>

<p>The danger isn't feeling things. The danger is that a hot state quietly rewrites the weights — it makes the ten-minute relief of sending the email outrank the ten-month cost of having sent it, and it does that without announcing itself as a feeling at all. It shows up disguised as obviousness. The call feels less like an emotion and more like simply seeing clearly. That's exactly when it's worth distrusting.</p>

<h2>Manufacturing distance</h2>

<p>If the problem is that you're standing too close to your own life, the fix is to step back from it — and you can do that deliberately, in two directions.</p>

<p><strong>Across time.</strong> Suzy Welch's version is the cleanest: how will I feel about this in ten minutes, in ten months, in ten years? The three horizons do real work because a hot state collapses them into one. The ten-minute pang — the awkwardness of the hard conversation, the rush of the impulse buy, the relief of quitting — is loud and almost always shrinks against the ten-year view. Running the three on purpose is just forcing the recalibration the feeling is blocking. Sometimes the answer survives all three horizons, and then you know it wasn't the heat talking.</p>

<p><strong>Across person.</strong> Ask what you'd tell a friend who described this exact situation to you — or what the person you're trying to become would do here. Say it in the third person, by name, if it helps: not "should I take this" but "should she take this." It sounds like a gimmick and it measurably isn't; it's the same move that closed the gap in the research. The advice you'd give a friend is the advice you'd give yourself if you could see your own board.</p>

<p>The oldest tool of all is just a cooling-off period. Most hot decisions have a fuse far shorter than the choice itself — sleep on it and the part that was deciding for you is often simply gone by morning. The rule worth keeping is structural: never make an irreversible decision in a hot state. If the door swings both ways, waiting costs you almost nothing. If it doesn't, that's precisely the one you don't decide while you're on fire.</p>

<h2>The trap on the other side</h2>

<p>It would be too tidy to conclude "get distance, stay cool, feelings are noise" — and it's false. Distance is for stripping the visceral <em>overweighting</em>, not for numbing a feeling that carries real information. Some feelings are data. The dread you feel walking into a place, the way a person makes you smaller, the quiet wrongness of a deal that pencils out fine — those aren't heat to be cooled off. They're signal, and "I'm sure I'll feel differently in a week" is exactly how you talk yourself out of acting on them.</p>

<p>The ten-year horizon has its own failure mode, too. Almost nothing survives it; at ten years, the projects, the people, the whole afternoon all flatten toward the same gray "won't matter." Lean on it too hard and it curdles into a reason to never care about anything, which is its own way of deciding badly. The honest version is narrow: use distance on the choices you'll have to live with once you're calm — the ones a hot state is about to overweight — and not as a solvent for every feeling you'd rather not have. The goal isn't to feel less. It's to keep the feeling from doing your arithmetic for you.</p>

<h2>The next time you're on fire</h2>

<p>The next time a decision feels urgent and obvious and your pulse is up, treat that exact combination as the signal to wait. Run the three horizons. Write the question with someone else's name in it and answer that one. If the door is reversible, sleep on it; if it isn't, that's the strongest reason of all not to walk through it tonight. You already have good judgment — you spend it on your friends every week. This is just how you point it at your own life, which is the one place it's hardest to aim and matters most.</p>`,
  },
  {
    slug: "deciding-and-doing",
    title: "The Distance Between Deciding and Doing",
    date: "2026-06-25",
    excerpt:
      "The hard part of most decisions isn't making them. It's the silence afterward, where a clear call quietly never becomes an action. There's a fix, and it's almost mechanical.",
    readTime: 6,
    tags: ["decisions", "habits"],
    content: `<p>Picture the moment you finally settle something you've been turning over — take the job, have the conversation, start putting money away, see the doctor about the thing you've been ignoring. There's a particular relief in it, the relief of a question closed. And then, often, nothing happens. A week later the call is still just a call. You haven't booked the appointment, sent the message, opened the account. The decision, it turns out, was never the hard part. The doing was — and the deciding felt so much like progress that it disguised how little had actually moved.</p>

<p>This is not a personal failing either, and it's not rare. Psychologists call it the intention–action gap, and it's one of the most reliably measured facts about human behavior: knowing what you intend to do barely predicts whether you'll do it. Reviews of the research keep finding that even strong, sincere intentions explain only a modest slice of what people actually go on to do. The gap is the default, not the exception. An intention lives in your head and quietly waits to be remembered, re-decided, and acted on at some unspecified later moment — and that moment, undefended, tends never to arrive.</p>

<h2>The fix is suspiciously small</h2>

<p>The psychologist Peter Gollwitzer spent a career on a fix so small it sounds like it can't possibly matter. Take the thing you intend to do and rewrite it as an <strong>if-then plan</strong>: "When <em>this specific situation</em> arises, I will <em>do this specific thing</em>." Not "I should exercise more," but "When I get home on Monday, Wednesday, and Friday, I'll change into running clothes before I sit down." Not "I'll deal with the money stuff," but "When my paycheck lands, I'll move $200 into savings before I do anything else."</p>

<p>The effect is not subtle. Pooling 94 separate studies and more than eight thousand people, Gollwitzer and his colleague Paschal Sheeran found that forming that one if-then plan produced a medium-to-large jump in follow-through over wanting the same goal exactly as much without one. It's one of the most replicated results in the field, and it costs a single sentence.</p>

<h2>Why a sentence does so much</h2>

<p>The mechanism is the interesting part. When you write the if-then, you hand control of the behavior away from your in-the-moment self — the one who's tired, distracted, already running late, quietly hoping to skip it — and give it to the situation. You've pre-decided. So when the cue actually arrives, the action fires with far less of the friction of choosing all over again. You're not spending willpower at the moment of truth; you spent your deliberation up front and bought yourself something closer to a reflex.</p>

<p>And the specificity is the whole trick. A cue has to be concrete enough to actually trip — a time, a place, an event you'll unambiguously notice. "Soon," "later," "when things calm down" never become cues, so they never fire, which is precisely why the most sincere version of a vague plan still dies. The if-then works not because it makes you want the goal more, but because it removes the requirement that you remember and re-choose it at exactly the moment you're least equipped to.</p>

<h2>The same tool, pointed backwards</h2>

<p>There's a second place the if-then earns its keep, and it's one this site has circled before. In <em>Decisive</em>, Chip and Dan Heath call it a <strong>tripwire</strong>: a signal you set in advance that snaps you awake to reconsider. Their example is Kodak, which decided not to chase digital photography and then simply rode that decision down for years. The decision might even have been defensible at the time; what was missing was the tripwire — "when the market is 10% digital, we revisit this." A line that would have forced a fresh look at the moment the old call stopped being right.</p>

<p>A tripwire is just an implementation intention aimed at the reconsidering instead of the doing: "if I see X, I stop and rethink." And it solves the opposite failure. The first kind of if-then makes sure a good decision actually <em>happens</em>. The tripwire makes sure a decision that's quietly going wrong doesn't <em>coast</em> — doesn't drift past the moment you should have changed course, carried along by the same momentum that's supposed to help you. Between them they cover both ways a decision dies after you make it: never started, or never revisited.</p>

<h2>The trap on the other side</h2>

<p>It would be too neat to say "make the plan, and the plan delivers the outcome." Two honest limits keep it from being magic. The first: an if-then helps most when the obstacle is <em>getting started</em>, <em>remembering</em>, or <em>catching a narrow window</em>. It is far weaker against a goal you don't really want, where the true problem is the wanting, not the planning — no clever cue rescues a decision your gut keeps voting against. If you've set a perfectly good plan three times and skated past it three times, that's worth reading as a signal to revisit the call itself, not as a reason to engineer a fourth, more elaborate trigger.</p>

<p>The second: a plan welded to a single cue can make you brittle. If your run only happens "when I get home at six," the evening that falls apart takes the run with it, where a looser intention would have improvised a different slot. The repair is to plan for the cue to miss — a backup if-then, or a tripwire that tells you when to abandon the plan entirely rather than keep forcing it. Following through and knowing when to stop are the same skill, and the if-then is how you write both down.</p>

<h2>Where the worksheet now ends</h2>

<p>This is why the decision worksheet on this site no longer stops at the call. After you've written what you're going to do, it asks for one more line — the first move: the smallest concrete step, and exactly when or where you'll take it. It's the cheapest field on the page, a single if-then sentence. On the evidence, it's also the one most likely to decide whether any of the careful thinking above it ever makes it out of your head and into your life.</p>`,
  },
  {
    slug: "guessing-on-purpose",
    title: "How to Guess on Purpose",
    date: "2026-06-28",
    excerpt:
      "Asked for a number you don't have, most people freeze or wave a hand. There's a third option — break the question into pieces you can guess, and multiply. The rough parts beat the confident whole, for a reason worth understanding.",
    readTime: 7,
    tags: ["thinking", "math", "decisions"],
    content: `<p>Someone asks you a question with a number for an answer, and you don't have the number. How many electric cars are on the road in your country? What would it cost to repaint every classroom in the city? How many people would actually use the thing you're thinking of building? Most people do one of two things here, and both are bad. They freeze — "no idea, I'd have to look it up" — and the conversation moves on without the number that would have settled it. Or they wave a hand and produce a single confident figure pulled from nowhere, which is worse, because now there's a number on the table and it's wrong.</p>

<p>There is a third option, and it is a learnable skill rather than a gift. You break the question into smaller questions you <em>can</em> guess at, and you multiply your guesses together. It sounds too simple to help. It helps enormously, and the reason it helps is genuinely surprising — surprising enough that it's worth the rest of this piece.</p>

<h2>The move</h2>

<p>Say you're weighing whether to build a small paid app for dog owners in your city, and you want a rough sense of the yearly revenue if it goes reasonably well. You have no idea. But you can chip at the pieces. Your city has maybe a million people; perhaps one household in three has a dog, and households run about two and a half people, so call it 130,000 dogs. Maybe one owner in twenty is the kind who buys apps like this — 6,500 of them. At, say, $30 a year, that's around $200,000 a year if it goes well. None of those five guesses is solid. The answer is still useful: it tells you this is a modest side business, not a company, and it tells you the whole thing hinges on that "one owner in twenty," which you could actually go check.</p>

<p>This is Fermi estimation — named for the physicist who estimated the first atomic bomb's yield by tossing scraps of paper into the blast wave, and got within a factor of two. The mechanics are nothing more than the multiplication you already know. The skill is the decomposition: choosing pieces small and familiar enough that you can put a number on each without flinching.</p>

<h2>Why the rough parts beat the confident whole</h2>

<p>Here's the part that feels like a trick but isn't. Each of those five guesses might be off by a lot — easily a factor of two in either direction. You'd think stringing five wobbly guesses together would multiply the wobble into nonsense. The opposite tends to happen. The errors point in different directions and partly cancel.</p>

<p>The intuition: when you guess a single number for a thing you don't understand, your one error has nowhere to go — whatever you're wrong by, you're wrong by all of it. When you guess five numbers, you'll overshoot some and undershoot others, more or less at random. An overshoot on dog ownership gets quietly offset by an undershoot on willingness to pay. The more independent pieces you break the problem into, the more your individual mistakes average out, and the more the product converges on something reasonable. It's the same reason a poll of a thousand people beats asking one loud person: independent errors wash out in aggregate. Decomposition manufactures that aggregate out of a single hard question.</p>

<p>That is the real case for the technique, and it's stronger than "some structure is better than none." A decomposed estimate isn't just more organized than a gut guess. On the questions that matter — the ones where you genuinely have no feel for the answer — it is reliably, measurably closer to the truth.</p>

<h2>Where it stops working</h2>

<p>The cancellation is the whole engine, which means the honest limit is exactly where the cancellation fails. It needs your errors to be roughly independent and roughly unbiased — scattered around the truth, not all leaning the same way. Two things break that.</p>

<p>The first is correlated error. If you're estimating a project's cost and you're an optimist, you won't make scattered mistakes — you'll shade <em>every</em> factor low, and the optimism compounds instead of cancelling. This is why your decomposed timelines and budgets still come out too rosy: the errors share a direction. The fix isn't more factors; it's checking each one against the outside world, or handing the estimate to a pessimist.</p>

<p>The second is the load-bearing factor. Sometimes one piece dominates, and being a hundred-fold off on that one piece sinks the whole estimate no matter how careful the rest were. But this is also where decomposition quietly earns its keep, because it <em>shows you which factor that is</em>. You can see that the dog-app answer lives or dies on the conversion rate, and that the bus-full-of-golf-balls answer barely cares whether the bus is ten or twelve metres long. The estimate hands you the one number worth arguing about.</p>

<h2>The number was never the point</h2>

<p>Which is the part most people miss. The output of a Fermi estimate — $200,000, sixty piano tuners, three trillion trees — is the least valuable thing it produces. The valuable thing is the <em>structure</em>: an explicit list of the assumptions your answer rests on, and a clear view of which one it actually hinges on. A vague feeling that "this market seems big" can't be checked or argued with. A chain of five named factors can be. You can hand it to someone who'll say "your conversion rate is fantasy," and now you're having the right argument.</p>

<p>This is why estimation belongs next to the rest of the thinking on this site rather than off in a math corner. Most real decisions secretly turn on a quantity nobody has bothered to estimate — how likely, how big, how long, how much. Refusing to put a number on it doesn't make the decision more careful; it just means you're deciding on the same hidden guess, with none of it written down where you could check it. Guessing on purpose drags that guess into the open.</p>

<p>So practise it deliberately, the way you'd practise anything. The <a href="/estimate">estimation trainer</a> on this site gives you problems to decompose and order-of-magnitude guesses to test, and shows you — round over round — your estimates tightening. Pair it with two things: <a href="/writing/orders-of-magnitude">a feel for scale</a>, so your factors aren't off by powers of ten to begin with, and <a href="/calibrate">honest confidence</a>, so the error bars you put around the final number mean what they say. A number you built on purpose, with calibrated uncertainty around it, is worth more than any figure you could have looked up — because you know exactly what it depends on.</p>`,
  },
  {
    slug: "your-ninety-percent",
    title: "Your 90% Isn't 90%",
    date: "2026-06-27",
    excerpt:
      "When you say you're 90% sure, how often are you actually right? For most people the honest answer is closer to 50% — and unlike almost every other bias, this one you can fix in an afternoon.",
    readTime: 7,
    tags: ["decisions", "epistemology", "forecasting"],
    content: `<p>Here is a small, slightly uncomfortable experiment. Without looking it up: how long is the Nile? Don't give a single number — give a range, a low and a high, wide enough that you're <em>90% sure</em> the true length falls inside it. Whatever range you just pictured, sit with how confident you feel about it. Then do the same for the year Mozart was born, the diameter of the Moon, the number of bones in your body.</p>

<p>Now the catch. If your ranges really are 90% confidence intervals, then across ten of them the truth should land outside only about once. When researchers run this — and they have run it on thousands of people — the typical result is that something like half the answers fall outside the ranges. People who sincerely believe they're 90% sure are, in practice, more like 50% sure. They've drawn their ranges far too narrow, because a narrow range feels knowledgeable and a wide one feels like admitting you don't know. The feeling of confidence and the fact of being right have quietly come apart.</p>

<p>This is overconfidence, and it is about as close to universal as findings about human judgment get. It shows up in trivia and in expert forecasts; in doctors estimating diagnoses, engineers estimating timelines, executives estimating markets. The number you attach to your certainty — "I'm pretty sure," "90% chance," "no way that happens" — is, for almost everyone, systematically inflated. And it matters far beyond trivia, because that same inflated number is the one you use to decide whether a risk is worth taking, whether a plan needs a backup, whether the thing you're sure about deserves a second look.</p>

<h2>The thing that makes it different</h2>

<p>Most of what's known about cognitive bias is a little demoralizing. You read about anchoring or loss aversion or the availability heuristic, you nod, you understand the mechanism exactly — and then you go on being anchored and loss-averse and swayed by vivid stories, because knowing about a bias mostly doesn't dissolve it. The illusions persist even when you can name them.</p>

<p>Calibration is the cheerful exception. It behaves less like a fixed flaw and more like a skill you simply haven't practiced — and a fast-learning one. Douglas Hubbard, who has trained thousands of people to put honest numbers on uncertainty, reports that most reach near-perfect calibration after about half a day of doing rounds and seeing how they did. Half a day. The trait that most sharply distinguishes Philip Tetlock's "superforecasters" from everyone else isn't intelligence or access to secrets; it's that their probabilities are well-calibrated — when they say 70%, it happens about 70% of the time. That's not a gift they were born with. It's the residue of keeping score.</p>

<p>Which points at what actually builds the skill, and it's almost insultingly simple: put a number on your uncertainty, check it against reality, and repeat until the feeling of "90% sure" starts behaving like 90%. The only essential ingredient is feedback fast enough to learn from — which is exactly what ordinary life, with its slow and ambiguous outcomes, refuses to give you.</p>

<h2>The equivalent bet</h2>

<p>There's one tool worth carrying out of all this, because it catches your overconfidence in the act. Hubbard calls it the <strong>equivalent bet</strong>. You've drawn your 90% range for the length of the Nile. Now imagine two ways to win $1,000. Option one: you win if the true answer falls inside your range. Option two: you spin a wheel that pays out nine times in ten. Which would you rather have?</p>

<p>If you find yourself preferring the wheel, you've just confessed something — that you don't actually believe your range has a 90% chance of being right. So widen it. Keep widening until the two bets feel genuinely equal, until you'd be honestly indifferent between trusting your range and trusting a 9-in-10 gamble. That point of indifference is what 90% confidence actually feels like from the inside, and the first time you find it, you'll be startled how much wider the range had to get. The bet works because it converts a vague feeling of confidence into a concrete choice with money on it, and money has a way of making us honest.</p>

<p>The same move works on yes-or-no questions. Before you say "they'll definitely ship on time," ask whether you'd take an even-money bet on it, or want odds. Whether you'd put it at 60% or 95% is the difference between a hunch and a forecast — and the gap between them is usually where the trouble lives.</p>

<h2>Where it stops being a game</h2>

<p>Now the honest limit, because there always is one. Getting calibrated on checkable trivia is a warm-up, not the finish line. Two things separate the Nile from the decisions you actually lose sleep over. First, the questions that matter are messier — "will this hire work out," "is this the right time to move" — and they don't come with an answer key in the footnotes. Second, and worse, the feedback is slow, partial, or never arrives at all. You make a big call, the world moves on, and you never get the clean "right / wrong" the trivia hands you instantly. Without that feedback loop, the skill has nothing to train against, and the overconfidence creeps back.</p>

<p>So the trainer on this site is deliberately the small version of the problem: trivia, because trivia can be scored. It's there to do one thing — recalibrate the <em>feeling</em> of being sure — so that when that feeling next shows up over something that matters, you recognize it for the unreliable narrator it is and widen the range accordingly. Being right about the Moon's diameter is worthless in itself. The transfer is the point: a person who has felt, viscerally, how often their 90% was really 50% carries a useful suspicion of their own certainty into every room.</p>

<p>And for the decisions that don't come with an answer key, there's only one way to manufacture the missing feedback: write the probability down before the outcome, then go back and check. That's the entire reason this site has a <a href="/decide">decision journal</a> — it's a calibration trainer for the questions reality refuses to grade for you. The <a href="/calibrate">trainer</a> teaches your gut what a real 90% feels like in an afternoon. The journal is how you keep that honesty alive on the bets that actually count, one logged forecast at a time.</p>

<p>Start with the cheap version. Draw a few ranges, run the bet against yourself, watch the truth slip outside more often than you'd ever have guessed. It's a strangely freeing thing to learn. The goal was never to be certain — it was to know exactly how uncertain you are, and to finally have the number be true.</p>`,
  },
  {
    slug: "how-much-should-this-change-your-mind",
    title: "How Much Should This Change Your Mind?",
    date: "2026-06-29",
    excerpt:
      "A 99%-accurate test comes back positive for a disease 1 person in 1,000 has. Your chance of having it isn't 99% — it's about 9%. The gap is a base rate, and forgetting it is one of the most expensive habits in human judgement.",
    readTime: 7,
    tags: ["decisions", "epistemology", "forecasting"],
    content: `<p>Try this before you read on. There's a disease that 1 person in 1,000 has. There's a test for it that's 99% accurate — it comes back positive for 99% of people who have the disease, and falsely positive for only 1% of people who don't. You take the test. It's positive. What's the chance you actually have the disease?</p>

<p>Most people, asked this cold, answer somewhere around 99%. The number feels like it's about you now — the test was nearly perfect and it pointed at you. The real answer is about 9%. Not 90%, not 50% — nine percent. If that feels wrong, you've just met one of the most consequential errors in everyday reasoning, and the good news is that it comes apart cleanly the moment you stop thinking in percentages.</p>

<h2>Count the crowd</h2>

<p>Here's the same problem with the percentages turned into people. Picture 100,000 of them. One in a thousand has the disease, so 100 do. The test catches 99% of them: 99 true positives. The other 99,900 people are healthy — but the test falsely flags 1% of them anyway, and 1% of 99,900 is 999 false positives. So 99 + 999 = 1,098 people test positive, and only 99 of them are actually sick. Your chance, given a positive, is 99 out of 1,098 — about 9%.</p>

<p>Nothing changed but the format, and yet the answer that was invisible in percentages is obvious as a headcount. This is Gerd Gigerenzer's finding, and it's a genuinely hopeful one: the difficulty was never your intelligence, it was the representation. Probabilities hide the thing that matters; <strong>natural frequencies</strong> — concrete counts out of a real crowd — put it back. The reason the answer is so low is now plain to see: the disease is rare, so the tiny sliver of true cases is simply outnumbered by the false alarms the test scatters across the enormous healthy majority.</p>

<p>The piece your intuition dropped is the <strong>base rate</strong> — how common the thing was before any test. A positive result is evidence, and evidence is supposed to move you <em>from</em> somewhere. Start almost nowhere — 1 in 1,000 — and even strong evidence can only carry you to 9%. Skip the starting point and you treat the test's accuracy as if it were the answer. That's base-rate neglect, and it is close to universal.</p>

<h2>It isn't just a puzzle</h2>

<p>This would be a parlour trick if it stayed in textbooks. It doesn't. The original version of the problem was put to practising physicians — given a disease's prevalence, a test's detection rate, and its false-positive rate, what should a patient with a positive result conclude? The large majority got it badly wrong, most of them answering ten times too high. These were doctors, reasoning about the tool they use every day, and the format alone defeated them. Reframe it as natural frequencies and most of them get it right.</p>

<p>Once you've seen the shape, you start seeing it everywhere. The "highly accurate" screening that, applied to a healthy population, produces far more false alarms than real findings. The fraud alert that fires so often on legitimate purchases that people learn to wave it through. The face-recognition match at the airport that's almost certainly an innocent traveller, because the genuine target is one in tens of thousands. The security system, the background check, the diagnostic panel: whenever a test for a <em>rare</em> thing is run across <em>everyone</em>, the math guarantees the alarms will be mostly false — not because the test is bad, but because the base rate is low. A test can be excellent and a positive result can still mean almost nothing.</p>

<h2>The lesson is not "distrust tests"</h2>

<p>It's tempting to walk away with "results don't mean much," and that's the wrong lesson — the symmetric error in the other direction. The honest rule is that <em>the same result means different things at different base rates</em>. Take that 9% disease test and imagine a patient who already has every symptom and a family history, so that, before testing, the odds they have it are more like 1 in 3 rather than 1 in 1,000. Run the same arithmetic and a positive now means roughly an 80% chance — because this time the evidence is updating a prior that was already substantial. Same test, same accuracy, completely different conclusion.</p>

<p>That's the whole idea, and it has a name: you're combining a prior with the strength of the evidence to get a posterior — Bayes' rule, though you never need the formula if you can count a crowd. A positive flu test in the middle of flu season, when a third of the people around you are sick, really is strong news. The identical test for something genuinely rare is nearly silent. The number you should land on isn't "trust it" or "distrust it" — it's the result <em>weighed against</em> how common the thing was to begin with.</p>

<h2>Where it gets hard</h2>

<p>Now the catch, because there always is one, and here it's a real one. The arithmetic is the easy part. The hard part is knowing the base rate at all — and choosing the right one.</p>

<p>The neat textbook problems hand you "1 in 1,000." Life rarely does. To ask how likely your startup is to reach a billion dollars, or this hire is to work out, or this lump is to be serious, you first have to pick the reference class: <em>this kind of thing, among what set of things?</em> Startups in general, or venture-backed startups in your sector with this much funding? The choice moves the answer enormously, and there's no formula that picks for you — narrow the class until it's "companies exactly like mine" and you're back to a sample of one, with no base rate left. This is the genuinely difficult judgement, the place where two careful people can disagree, and no amount of crowd-counting resolves it.</p>

<p>And the prior has to be honest, because the rule cuts both ways: a confident wrong base rate produces a confident wrong answer, with the arithmetic lending it false authority. Garbage prior in, garbage posterior out. So the skill isn't really the multiplication. It's the discipline of asking, before you react to any vivid new piece of evidence, "what's the rate for things like this?" — and the humility to admit when you're guessing at it.</p>

<h2>The everyday version</h2>

<p>Strip away the tests and what's left is a habit of mind you use a hundred times a day, mostly badly. A dramatic news story arrives and feels like a trend. A single bad review feels like the truth about a product. One vivid anecdote about someone who quit their job and got rich feels like evidence about your odds. Each of these is a piece of evidence shouting for a big update, and in each case the right first move is the same quiet question: how often does this actually happen, to people in general, before I heard this one loud story? The story is real. It's just not the whole probability — it's the part you multiply <em>against</em> the base rate, not instead of it.</p>

<p>That's why this sits next to the other thinking on this site rather than in a statistics appendix. <a href="/writing/your-ninety-percent">Calibration</a> asks how wide your uncertainty should be; <a href="/writing/guessing-on-purpose">estimation</a> asks how to get to a number when you don't have one; this asks how much a new fact should move the number you've got. All three are the same project — putting honest numbers on an uncertain world — and all three are trainable. The <a href="/update">base-rate trainer</a> here gives you the test problems to work, first slowly as a crowd you can count and then as quick rounds, and quietly tracks the one thing worth knowing about your own judgement: whether you keep landing too high. Most people do, at first. It's the most fixable expensive habit you have.</p>`,
  },
  {
    slug: "three-numbers-for-an-uncertain-world",
    title: "Three Numbers for an Uncertain World",
    date: "2026-06-30",
    excerpt:
      "Almost every real decision hides the same three questions: how sure am I, what's my best guess, and how much should this new thing change my mind? Each has a wrong answer you reach for by default — and each is a skill you can train.",
    readTime: 6,
    tags: ["decisions", "forecasting", "epistemology"],
    content: `<p>Watch yourself make a real decision — take a job, price a project, read a worrying symptom, believe a headline — and underneath the specifics you'll find you're doing arithmetic with numbers you never wrote down. <em>How likely is this? How big is it? How much does this new fact change things?</em> You answer all three in an instant, mostly without noticing, and the quality of the decision rides on answers you never checked. The uncomfortable finding from decades of research is that the default answers are wrong in predictable directions — and the hopeful finding is that all three are skills, trainable the way a backhand or a scale is trainable: with reps and honest feedback.</p>

<p>There are, as far as I can tell, exactly three of these numbers. Naming them is most of the battle, because once you can see which one a decision is leaning on, you know which mistake you're about to make.</p>

<h2>One: how sure are you?</h2>

<p>The first number is the width of your uncertainty. Not "am I confident" — confidence is a feeling and it lies — but how much room you're actually leaving for being wrong. Ask people for a range they're 90% sure contains some answer, and the truth falls inside barely half the time. The interval that <em>feels</em> like 90% is really a 50% interval wearing a confident face. The error has a direction: almost everyone's ranges are too narrow. We are, as a species, more sure than we have any right to be.</p>

<p>This is the most quietly trainable of the three. Douglas Hubbard finds that most people go from badly overconfident to nearly calibrated in an afternoon, just by making range guesses and seeing how often the truth lands inside. Being well-calibrated — your "70% sure" coming true about 70% of the time — is the single trait that most distinguishes the forecasters who beat everyone else. You can't fix a width you can't feel, and the only way to feel it is to be graded.</p>

<h2>Two: how do you get to a number at all?</h2>

<p>The second number is the estimate itself — and the failure here isn't being wrong, it's freezing. Asked how big a market is, how long a project will take, how many people would use a thing, most people either wave a hand or quote back the first figure they heard. But there's a third move, and it's a craft: break the question into pieces you can actually guess, and multiply them back together. How many piano tuners in Chicago? You don't know — but you can guess the city's population, how many households own a piano, how often one gets tuned, how many a tuner can service in a year. Four shaky guesses chained together land startlingly close.</p>

<p>The reason it works is the part worth keeping: a chain of rough guesses beats one confident guess, because the errors point in different directions and partly cancel. Overshoot the pianos, undershoot the tunings, and the mistakes eat each other. The bonus is that a decomposition shows you <em>which</em> assumption the answer hinges on — it turns a vibe into something you can argue with and check. The risk is the mirror image: if your errors all lean the same way — a chronic optimist's do — they compound instead of cancelling, and one load-bearing factor can still sink the whole estimate.</p>

<h2>Three: how much should this change your mind?</h2>

<p>The third number is the update — how far a new piece of evidence should move you. This is where the most expensive single mistake in everyday reasoning lives. A test that's 99% accurate comes back positive for a disease one person in a thousand has, and almost everyone, including most doctors asked the question, puts the odds of being sick near 99%. It's about 9%, because the rare true cases are swamped by false alarms from the enormous healthy majority. The mistake is forgetting the <em>base rate</em> — how common the thing was before the evidence arrived — and just reading the evidence off as the answer.</p>

<p>The everyday version skips the lab entirely. A dramatic headline feels like a trend. One bad review feels like the truth. A single story about someone who quit and got rich feels like evidence about your odds. Each is a loud fact demanding a big update, and in each case the right move is the same quiet question: how often does this happen, to people in general, before I heard this one story? The evidence is real. It's the thing you weigh <em>against</em> the prior, not instead of it.</p>

<h2>Why three, together</h2>

<p>Each of these has its own essay and its own trainer on this site, and you could stop at any one of them and come out ahead. But they're worth holding together, because they're not really three skills — they're three views of one. <strong>Width</strong> asks how much you don't know. <strong>Estimation</strong> asks for your best single number anyway. <strong>Updating</strong> asks how to revise that number when the world says something. Every forecast you make in the <a href="/decide">decision journal</a> uses all three at once: you estimate an outcome, you put honest error bars on it, and then — when reality reports back — you update. Get one wrong and the other two inherit the error. A sharp estimate with no error bars is a trap; well-drawn error bars around a number you reached by panic are decoration; a perfect prior you refuse to update is a different kind of stubbornness.</p>

<p>What I like about treating them as a set is that it makes your own weak spot legible. Most people aren't bad at "thinking" in some vague global way; they're specifically overconfident, or specifically frozen in front of a blank estimate, or specifically prone to letting the latest vivid thing knock them around. Those are different muscles with different exercises. The <a href="/practice">practice page</a> puts all three records side by side for exactly this reason — so you can see which number your judgement is shakiest on, and spend the next ten minutes there instead of practising the one you're already good at.</p>

<p>None of this turns an uncertain world into a certain one. The point was never certainty. It's that the world hands you the same three questions over and over, you're already answering them whether you mean to or not, and — unlike most things worth getting better at — these three will tell you your score if you let them. That's rare enough to be worth using.</p>`,
  },
  {
    slug: "nobody-thinks-theyre-the-base-rate",
    title: "Nobody Thinks They're the Base Rate",
    date: "2026-07-02",
    excerpt:
      "Newlyweds, asked what fraction of marriages end in divorce, answer about half — accurately. Asked about their own marriage, the median answer is zero. The gap between those two numbers is the inside view, and closing it is a skill.",
    readTime: 7,
    tags: ["decisions", "forecasting", "epistemology"],
    content: `<p>In the early 1990s, two researchers asked people applying for marriage licenses a pair of questions. First: what fraction of American marriages end in divorce? The couples knew the statistic — about half, they said, which was right. Then the second question: what's the chance <em>your</em> marriage ends in divorce? The median answer was zero. Not "lower than average." Zero percent — from people who had just correctly recited the average, standing in the building where you file the paperwork.</p>

<p>It's easy to laugh at newlyweds, so try the same move on yourself. How do most estimated timelines go? Late — everyone knows this. How will your current project go? You've got a good feeling about this one. What happens to most people who buy a gym membership in January? You already know. And you, this January? This time is different. The couples aren't unusually deluded. They're doing the thing everyone does with every case they're standing inside of: reasoning from the particulars in front of them, and quietly filing the statistics under <em>other people</em>.</p>

<h2>Two ways to forecast</h2>

<p>Daniel Kahneman gave the two moves names that stuck. The <strong>inside view</strong> builds a forecast from the case itself — your plan, your team, your talent, what you can see from where you stand. The <strong>outside view</strong> ignores nearly all of that and asks one question: <em>what happened to everyone else who tried this kind of thing?</em> Find the class your case belongs to, look up how that class actually turned out, and start your forecast there — from the record, not the story.</p>

<p>The inside view feels more responsible. You have all this specific information — surely using it beats some crude average over people who aren't you? But that intuition gets the situation backwards, and the reason is worth holding onto. Your specific information is mostly a <em>plan</em>, and a plan is a story about the best case: it contains the steps you thought of, scheduled as if each will go roughly as imagined. What sinks projects is what's not in the story — the contractor who vanishes, the dependency that ships broken, the month you lose to something that, today, has no name. You can't enumerate surprises from inside the plan; reading it harder just makes the story more vivid. But the outside view has already counted them, blindly and honestly, because every surprise that ever wrecked a similar case is baked into how the class turned out. The crude average knows things the detailed story structurally cannot.</p>

<h2>The most replicated embarrassment in psychology</h2>

<p>Measure the gap and it's not subtle. In the classic study, students predicted how long their thesis projects would take: 34 days, on average. Actual: 55. Only about 30% finished by the date they'd named — and when researchers asked instead for a date they were "99% sure" to finish by, still fewer than half made it. That's the <strong>planning fallacy</strong>, and it does not spare professionals: across Bent Flyvbjerg's database of thousands of major projects — full-time planners, formal schedules, real money — roughly one in ten comes in on budget. Nine of ten megaprojects run over, the overruns repeat decade after decade, and the estimates never learn.</p>

<p>They never learn because each new project is planned from the inside, where this one, with its visible steps and its competent team, feels like the exception. Which is the newlywed answer again, wearing a hard hat. The failure isn't ignorance of the base rate — the students knew about late projects, the planners had lived through the last overrun. The failure is that the base rate never feels like it's <em>about you</em>. Nobody thinks they're the base rate. That's what a base rate is: everyone, each of whom thought they weren't.</p>

<p>There's an institutional version of the fix — <strong>reference-class forecasting</strong>, developed by Flyvbjerg from Kahneman's work, now required for big projects by some governments. Strip the ceremony and it's three steps. Pick the class your case belongs to. Get the distribution of how that class actually turned out. Start there, and let the particulars of your case argue for a <em>modest</em> adjustment — earned with evidence you could defend out loud, not with the feeling of being special.</p>

<h2>The hard judgement is choosing the class</h2>

<p>Everything above makes the outside view sound mechanical, and the arithmetic is. The judgement that isn't — the part that makes this a skill rather than a lookup — is deciding what counts as "this kind of thing." Choose the class badly and the outside view launders a bad prior into a confident wrong answer. A few rules of thumb do most of the work.</p>

<p><strong>Start broad, and narrow only as far as real data takes you.</strong> A wedding guest starting from "all first marriages" gets about 55% lasting. Narrowing to "college graduates marrying after 25" legitimately moves it to roughly 75% — because that's a measured class with a measured difference. Narrowing further to "couples as right for each other as these two" moves it to wherever you wanted it to go, because that class has a membership of one and its only data is your impression. That's the boundary: narrow with statistics, never with adjectives.</p>

<p><strong>A class of one is not a class.</strong> "Projects exactly like this one, run by me, this year" sounds rigorous and is just the inside view with a census form. If the class you've picked contains only your case, you haven't consulted the record — you've asked the story to grade itself.</p>

<p><strong>A rate you can't source isn't a rate.</strong> Everyone knows 90% of restaurants fail in the first year. No study has ever found this; the figure traces to a two-decade-old TV commercial. When economists tracked every restaurant in the government's business census, about 17% closed in year one, and just under half were still open at five years — almost exactly the rate for new businesses generally. Folklore can be pessimistic too, and the outside view corrects in both directions: the friend opening a restaurant deserves neither your gut's 80% nor the commercial's 10%, but the record's roughly-half.</p>

<p><strong>Define the event before you pick the class.</strong> "What's the chance the startup succeeds?" has no base rate, because "succeeds" isn't an event. Returns its investors' capital: about one in four. Reaches a billion-dollar valuation: about one in a hundred. The honest number moves by a factor of twenty-five depending on what you meant, which means half of choosing the reference class is being forced to say precisely what you're predicting — a benefit smuggled in as a chore.</p>

<h2>Knowing this will not save you</h2>

<p>Here is the uncomfortable coda, and this site's <a href="/notes#kahneman-inside-view">favorite cautionary tale</a>. Kahneman — the man who named the inside view — once asked his own textbook team how long their project would take. Two more years, they estimated. He then asked the team's expert how long comparable teams took: seven-plus years, the expert admitted, and 40% never finished at all. The team heard the base rate, believed it, and kept working to the two-year plan anyway. The book took eight more years. Awareness did nothing — for the people who literally wrote the literature.</p>

<p>So the correction can't live in your judgement; it has to live in your <em>procedure</em>. Make the outside view a mandatory step, not a virtue you hope to remember under enthusiasm. Before you commit — in the <a href="/decide">decision journal</a>, on the whiteboard, in the email promising a date — the question "what's the rate for things like this?" gets asked and answered, every time, the way a pilot runs a checklist whether or not the sky looks clear. And because the reflex only builds with reps, the <a href="/update">base-rate trainer</a> now has a mode for exactly this: messy questions with no answer key, where you give your gut number first, then choose the reference class you'd start from — with the traps included, folklore rates and classes-of-one, because those are the candidates real life offers you too. It keeps one score across visits: how far your gut runs above the outside view before any evidence arrives. Your inside-view premium.</p>

<p>None of this asks you to stop believing your case is special. Every case is special; the classes are coarse and your particulars are real. The discipline is only about <em>where you stand</em> while you argue for the adjustment: on the record of everyone who tried, nudging the number with evidence — instead of on the story, defending zero percent in the marriage-license line. <a href="/writing/how-much-should-this-change-your-mind">How far the evidence should move you</a> is a skill this site drills elsewhere. This one is quieter and comes first: before you can update the number, you have to be honest about where the number starts.</p>`,
  },
  {
    slug: "experience-doesnt-teach",
    title: "Experience Doesn't Teach",
    date: "2026-07-03",
    excerpt:
      "When a weather forecaster says 70% chance of rain, it rains about 70% of the time — a calibration almost no other profession can show. Not because weather is easy, but because the rain answers back: fast, unambiguous, and scored. Most of life never answers. That part is fixable.",
    readTime: 7,
    tags: ["decisions", "learning", "epistemology"],
    content: `<p>There is exactly one profession famous for knowing how likely it is to be right, and it's the one we make jokes about. When a National Weather Service forecaster says there's a 70&nbsp;percent chance of rain, it rains on about 70&nbsp;percent of those days. When they say 90, about 90. Allan Murphy and Robert Winkler measured this in the 1970s, on years of operational forecasts, and the result has held up ever since: forecasters' stated probabilities track reality about as closely as human judgement gets. Almost nobody else can show a curve like that. In a classic study of a real clinic, physicians' confident diagnoses of pneumonia ran far ahead of how many patients actually had it — and doctors are the people we trust with the stakes.</p>

<p>The strange part is that meteorologists earn their calibration on one of the least predictable systems humans deal with. Weather is the textbook example of chaos; whether your new hire works out is, by comparison, a simple question. So the difference can't be that weather is easy or that forecasters are smarter. The difference is what happens <em>after</em> the forecast.</p>

<h2>The loop</h2>

<p>Consider what a weather forecaster's day actually delivers. The forecast is a number, stated in advance, in writing — not "looks like rain," but 70&nbsp;percent, on the record. The outcome arrives fast: by tomorrow morning it rained or it didn't, and nobody argues about which. And the two are scored against each other — the US Weather Bureau started formally grading probability forecasts in the 1950s, using a rule its own statistician, Glenn Brier, worked out — so every forecaster gets an unambiguous, personal answer to the only question that improves you: <em>when I say 70, what actually happens?</em> Repeat a thousand times a year for a career.</p>

<p>Now count how many of those properties your own judgement gets. You predicted the reorganization would be a disaster — but you never said how confident you were, or what "disaster" would look like, so whatever happens can be read as roughly what you meant. The outcome lands quarters later, tangled with everything else that happened in between. And by then, memory has quietly done you the favor psychologists call hindsight bias: what you <em>now know</em> happened seeps backward into what you're sure you <em>expected</em>, so the record you consult — your own recollection — has been edited by the result. You were never scored, and the one scorekeeper you carry with you cheats in your favor.</p>

<h2>Kind worlds and wicked ones</h2>

<p>The psychologist Robin Hogarth gave the two situations names. A <strong>kind</strong> learning environment is one where feedback is quick, accurate, and honestly linked to what you did: chess, golf, weather forecasting. Practice in a kind world compounds — experience really does become skill, which is why ten thousand hours of chess makes a grandmaster. A <strong>wicked</strong> environment gives feedback that is delayed, noisy, missing, or actively misleading — and most judgement calls that matter live there. Hiring: you never learn how the people you rejected would have done. Strategy: the market moved for nine reasons and you tested one. Medicine, sometimes, at its worst: Hogarth tells of a turn-of-the-century physician who could famously spot typhoid before symptoms showed by palpating patients' tongues — and whose intuition was "confirmed" again and again, patient after patient falling ill exactly as predicted. He was a healthy carrier. His examinations were spreading the disease. The feedback loop wasn't just broken; it was manufacturing confidence in the thing causing the harm.</p>

<p>This is why the proverb about ten years of experience being one year repeated ten times is more than a jab. In a wicked environment, experience doesn't teach — it <em>confirms</em>. You keep making the call, the feedback keeps failing to arrive or arriving garbled, and the main thing that grows is your certainty. The senior person's confidence is real; whether their accuracy grew with it depends entirely on whether their world ever answered back. Seniority is measured in years. Calibration is measured in graded forecasts. They only correlate in kind worlds.</p>

<h2>Feedback is the active ingredient</h2>

<p>The hopeful result hiding in this literature is that the forecasters' calibration is made, not born. Sarah Lichtenstein and Baruch Fischhoff ran the experiment directly in 1980: take ordinarily overconfident people, have them make a couple of hundred judgements, and after each round show them the score — how often their "80&nbsp;percent sure" actually came true. Calibration improved, substantially, and it didn't take a career: most of the gain arrived early. The same shape shows up wherever the loop gets closed — <a href="/writing/deliberate-practice">deliberate practice</a> was never "years of doing the thing"; it was always tight cycles of attempt and honest correction, and judgement turns out to obey the same law as backhands. People aren't incurably overconfident. They're unscored.</p>

<p>So the question stops being "how do I get more experience?" and becomes an engineering problem: <em>my environment won't grade me — where do I get the grades?</em> Three properties do the teaching, and they're exactly the three the weather forecaster gets for free. The forecast has to be <strong>specific in advance</strong> — a number and a named outcome, so the result can actually contradict you. The feedback has to be <strong>prompt enough to reach you</strong> — or failing that, scheduled, so it arrives at all. And it has to be scored against <strong>what you actually said, not what you remember saying</strong> — which, given hindsight bias, means it has to be written down somewhere memory can't reach.</p>

<h2>Building the machine</h2>

<p>Everything this site's tools do, under the hood, is manufacture those three properties for a world that doesn't supply them. The <a href="/practice">trainers</a> are an imported kind environment: trivia and scenarios with knowable answers, so the loop that takes a forecaster years closes in an afternoon — you say 90, you find out in seconds, and the feeling of "90&nbsp;percent sure" starts to mean something. That's real, and measured: it's the Lichtenstein–Fischhoff procedure as a game.</p>

<p>But your actual decisions still live in the wicked world, and no amount of trivia changes that. The <a href="/decide">decision journal</a> is the wickedness-correction device: it makes the forecast specific in advance (what do you expect, how sure are you), schedules the feedback (a review date, so the outcome comes back to you instead of dissolving), and freezes the record where hindsight can't edit it (you grade against the words you wrote, not the memory the result has been rewriting). It is, deliberately, a machine for doing to your decisions what the Weather Bureau did to its forecasters in 1950 — and the <a href="/practice">practice page</a> now shows both scoreboards side by side, the warm-up and the real game, because the trivia score was only ever there in service of the real one.</p>

<h2>The honest limit</h2>

<p>The journal's loop is still the slower, muddier one, and pretending otherwise would be its own miscalibration. You make a handful of consequential decisions a year, not a thousand; your real-world sample will stay small for a long time, and the numbers it produces stay coarse — counts, not curves. "Did it go as expected?" is itself a judgement call in a way "did it rain?" never is, and some outcomes stay genuinely ambiguous forever. A manufactured feedback loop narrows the gap between your world and the forecaster's; nothing closes it.</p>

<p>But coarse, honest feedback beats vivid, flattering feedback by a margin that's hard to overstate — the tongue-palpating doctor had <em>abundant</em> feedback, remember, all of it vivid and all of it wrong in his favor. A few dozen written-in-advance forecasts, graded against what you actually said, will teach you more about your own judgement than a decade of remembered vindication. The rain answers the forecaster whether or not he wants to hear it. Your life will mostly spare you the answer. That courtesy is the whole problem, and declining it is the skill.</p>`,
  },
  {
    slug: "hold-the-funeral-first",
    title: "Hold the Funeral First",
    date: "2026-07-04",
    excerpt:
      "Ask whether a plan could fail and your mind defends it. Tell it the plan has failed and your mind explains it — and people are measurably better at explaining than predicting. Why the pre-mortem's one-word tense trick works, and why the list it produces is only half the tool.",
    readTime: 8,
    tags: ["decisions", "planning", "psychology"],
    content: `<p>There is a moment near the start of every doomed plan when someone in the room already knows why it will die — and says nothing. Not from cowardice, exactly. The plan has momentum, the leader is visibly committed, and voicing the doubt would make you the person who isn't on board. So the meeting ends in agreement, the plan launches with its flaw riding along in someone's head, and a year later everyone gets to say they'd had a bad feeling. When you plan alone the dynamic is worse, not better: the advocate and the doubter share a skull, and the advocate runs the meeting.</p>

<p>The psychologist Gary Klein published a fix in 2007 that takes about twenty minutes and has become the rare debiasing technique with a fan club. Just before a plan kicks off, gather the people who know it, and have someone say: <em>imagine we're a year into the future. We implemented the plan as it now stands. It failed — spectacularly. Take a few minutes and write the history of that disaster.</em> Everyone writes alone. Then you go around the room, one reason per person, until every list is on the table.</p>

<p>Notice what the framing did not say: "what are the risks?" It said the thing is already dead. You are not being asked to predict — you're being asked to explain.</p>

<h2>A certainty is explained; a possibility is debated</h2>

<p>That tense shift is the whole engine, and it was measured before it had a use. In 1989, Deborah Mitchell, Jay Russo, and Nancy Pennington ran the comparison directly: ask one group whether an outcome <em>might</em> happen and why, and tell another the outcome <em>has</em> happened and ask why it did. The second framing — they called it <strong>prospective hindsight</strong> — raised people's ability to correctly identify reasons for the outcome by about 30&nbsp;percent. A possibility invites your mind to litigate it, and if you're the plan's author, your mind is a motivated lawyer. A certainty closes the case and reassigns everyone to forensics. "It failed" can't be argued with, only accounted for — and the accounting is where the fixable causes live.</p>

<p>In a group, the trick does a second job that may matter more. Daniel Kahneman — who calls the pre-mortem his favorite way of countering overconfidence — says its main virtue is that it <em>legitimizes doubts</em>. As a team converges on a decision, expressed doubt slides from useful to disloyal, and the people with the sharpest reservations go quietest. The pre-mortem inverts the incentive in one sentence: once the plan is declared dead, the smartest person in the room is by definition the one who finds the most interesting reason it died. The same people who would never have volunteered an objection will compete to produce one, because it stopped being an objection and became insight.</p>

<h2>Running it alone</h2>

<p>Honesty requires saying that Klein's version is a group ritual, and half its power is social. Run it solo and nobody hands you the safety of the room. What's left is the part that was measured on individuals — the tense shift — and it's worth the twenty minutes on its own: writing the history of your plan's death gives your own doubts the standing your own advocacy denies them. The room's other advantage, breadth, you have to manufacture: ten people carry ten different worries, and you carry one, usually rehearsed. The substitute is to walk the perimeter deliberately — the people the plan quietly depends on, the money and fuel it burns, the schedule it assumed was the median case when it was the best one, the outside world it assumed would hold still, and the version of you it requires who has never once shown up. The first two reasons on your list will be the ones you already knew about. The useful ones — the embarrassing ones — tend to arrive around number four or five, after the rehearsed worries run out.</p>

<h2>From dread to decisions</h2>

<p>What most retellings of the pre-mortem skip is that a list of failure modes is not an output. Organized dread is still dread. The exercise pays off in the triage, where every cause of death gets exactly one of three verbs.</p>

<p><strong>Change the plan.</strong> Some failures, once written down, are just cheap to fix — the funeral was the price of seeing them. This is the best outcome the exercise offers: the failure happened, completely, on paper, and cost you a sentence.</p>

<p><strong>Set a tripwire.</strong> Some failures can't be fixed in advance, only caught early — and these are where plans actually die, because catching-early is a decision, and nobody re-decides a running plan on a random Tuesday. More on this in a moment, because it's the half of the tool with its own literature.</p>

<p><strong>Accept it.</strong> Some risks you simply carry — unfixable, unwatchable, or too expensive to insure against. Naming them still buys you something real: a risk accepted with open eyes stops generating background anxiety, and future-you knows it was seen rather than missed.</p>

<h2>The brown M&amp;Ms</h2>

<p>Van Halen's touring contract in the 1980s famously demanded a bowl of M&amp;Ms backstage with the brown ones removed. It reads as rock-star decadence and was the opposite: the band traveled with nine trucks of rigging that could kill someone if a venue skimped on staging, and the M&amp;M clause was buried mid-contract precisely so it would only be honored by crews who had read every line. Brown M&amp;Ms in the bowl meant the contract hadn't been read — so, David Lee Roth wrote, line-check <em>everything</em>. The genius of it is that the expensive thing to detect (a sloppy crew) was made observable by a cheap thing (a glance at a bowl), and the response was decided before anyone was tired, embarrassed, or hopeful.</p>

<p>That's a <a href="/models#tripwires">tripwire</a>: a signal, chosen in advance, that means <em>stop and re-decide</em>. Chip and Dan Heath, who pulled the Van Halen story into the decision literature, compare it to the fuel light in a car — you don't monitor the gauge continuously, and you don't need to, because a threshold you set while calm will interrupt you at the right moment. Annie Duke's version, built for the harder case of quitting things, is <strong>kill criteria</strong>, and her formula is worth memorizing: a good one has <em>a state and a date</em>. Not "if it isn't working we'll rethink" — that clause has never once fired in the history of planning, because "working" renegotiates itself in the moment. Instead: if we're below a hundred paying users on March&nbsp;1, we stop. The state is observable enough that you can't argue with it; the date is a real calendar day on which someone is obligated to look.</p>

<h2>The man who set the turnaround time</h2>

<p>The reason tripwires need this much structure is that the person crossing one is not the person who set it. On Everest, expedition leaders enforce a turnaround time on summit day — reach the top by early afternoon or turn back wherever you are, because the mountain kills people on the descent, in the dark, when the weather turns. It's a textbook tripwire: a state, a date, decided at base camp by calm people. In the 1996 season the leader most insistent on it was Rob Hall, a guide with five summits behind him. On May&nbsp;10, three of his clients did the arithmetic mid-morning, saw they wouldn't summit in time, and turned around a few hundred meters short. Hall himself pressed on past his own deadline, summited in the early afternoon, then waited near the top for a struggling client. The storm caught them on the descent, and neither came home. The three who turned around are names nobody knows, which is Duke's bitter footnote about quitting: do it on time and it will usually feel — and look — like quitting too early. Nobody writes books about the summit you sensibly declined.</p>

<p>The lesson isn't that Hall didn't understand turnaround times; he understood them better than almost anyone alive. It's the same lesson <a href="/writing/nobody-thinks-theyre-the-base-rate">this site keeps colliding with</a>: awareness doesn't protect you, procedure does — and a procedure you can quietly renegotiate under summit fever isn't a procedure. So give the tripwire the structure that takes your future self out of the loop: write the signal down where the wanting can't edit it, give it a date, and put the date somewhere that will interrupt you — a calendar that doesn't care how the plan feels that morning. An if-then owned by the calendar is an <a href="/models#implementation-intentions">implementation intention</a> pointed at reconsidering instead of doing — the same tool that starts a plan, aimed at the rarer skill of stopping one.</p>

<h2>The honest limits</h2>

<p>A pre-mortem is not prophecy. You'll list ten causes of death and reality will select the eleventh; the only defense against the failures no one in the room can enumerate is the record of everyone who tried before you, which is a <a href="/writing/nobody-thinks-theyre-the-base-rate">different tool</a>. It isn't a pessimism ritual either — Klein's point was always that plans should <em>survive</em> their funerals, modified: the exercise usually ends with the same plan, three sentences stronger and a couple of tripwires better guarded. And the guard is only as good as its externality. A tripwire that lives in your head is a mood. A tripwire with a state, a date, and a reminder that arrives whether or not you want to hear it is the closest a solo decision-maker gets to the friend at base camp with the authority to call you down.</p>

<p>There's a <a href="/premortem">room for this</a> on the site now: it runs the exercise in Klein's order — the plan, the funeral, the triage — and won't let a tripwire leave without a signal and a date, which it will hand to your calendar. Every plan gets its autopsy eventually. The only decision you get to make is whether to hold it while the patient can still benefit.</p>`,
  },
  {
    slug: "the-compound-needs-evidence",
    title: "The Compound Needs Evidence",
    date: "2026-07-05",
    excerpt:
      "Weigh yourself every morning of a diet and the scale will spend the first month telling you it's failing. Your practice scores have the same physics: the day is noise, the trend is the signal. What real learning curves look like, why your best day is mostly luck, and how to see improvement without inventing it.",
    readTime: 8,
    tags: ["learning", "practice", "psychology"],
    content: `<p>Step on a scale every morning of a diet and it will spend the first month insulting you. An ordinary adult's weight swings a kilogram or two day to day — water, salt, glycogen, the timing of meals — while actual fat loss proceeds at maybe half a kilo a week. The signal is a fraction of the daily noise. Tuesday says the diet is working; Wednesday says it never did. Anyone who grades the project on this morning's number will conclude, correctly by the evidence in front of them and wrongly in fact, that nothing is happening — and quit. The people who stay sane do one thing differently: they stop reading the number and start reading the <em>trend</em> — a weekly average, a line through a month — because at that resolution the noise cancels and the half-kilo a week finally shows.</p>

<p>Every score this site keeps has the same physics. Answer ten calibration ranges and each one moves your day's hit rate by ten points; one unlucky miss is the difference between "calibrated" and "overconfident" for the whole session. A great round of estimates is partly skill and partly which questions came up. The day is noise. And yet the day is what you feel.</p>

<h2>A good day is mostly luck</h2>

<p>There's a second trap stacked on the first, and it has a name: <a href="/models#regression-to-mean">regression to the mean</a>. Daniel Kahneman's famous encounter with it came from a flight instructor who'd noticed that praising a cadet's exceptional landing was reliably followed by a worse one, while chewing out a botched landing was reliably followed by improvement — proof, the instructor concluded, that praise ruins performance and criticism fixes it. The real explanation is arithmetic. An exceptional landing is partly luck, and luck doesn't repeat; the next attempt regresses toward the cadet's average regardless of what anyone said in between. The instructor was reading causality off a statistical certainty, and a lifetime of landings had only deepened his confidence in the lesson.</p>

<p>Watch your own daily scores and you will run the same experiment on yourself, with the same result. Your best-ever round will most likely be followed by a worse one — not because you got complacent, but because your best-ever round was partly luck, and the luck went home. It will <em>feel</em> like backsliding. Your worst round will most likely be followed by a better one, and whatever you happened to change that morning — the coffee, the posture, the new trick — will get the credit. Day-resolution scorekeeping doesn't just fail to show improvement; it actively manufactures false lessons, one plausible story per fluctuation.</p>

<p>The <a href="/writing/compounding-improvements">first essay on this site</a> called the underlying problem the invisibility problem: improvement compounds below the threshold of daily perception, our linear-expectation brains register the silence as failure, and the failure feeling is what makes people quit in exactly the stretch where the compound is quietly assembling. What that essay didn't say is what to do about it beyond persisting on faith. Faith is the wrong tool. The right tool is the one the dieters found: change the resolution until the signal outweighs the noise.</p>

<h2>What getting better actually looks like</h2>

<p>The first people to draw a learning curve were measuring telegraph operators. In 1899, William Bryan and Noble Harter charted students learning Morse code, week by week, and found the shape that has turned up in almost every skill measured since: a steep, gratifying rise at the start, then a long flattening — including, in their receiving data, genuine <em>plateaus</em>, stretches where the curve went flat for weeks before rising again as the operators stopped hearing letters and started hearing whole words. Eighty years later, Allen Newell and Paul Rosenbloom collected learning curves from every domain they could find — cigar rolling, arithmetic, proofreading, card games — and formalized the shape as the <strong>power law of practice</strong>: the improvement each repetition buys shrinks steadily as repetitions accumulate. Plot skill against practice on log-log axes and you get a straight line; plot it against calendar time and you get a curve that soars, then crawls.</p>

<p>Two consequences follow, and they point in opposite directions. First: don't extrapolate week one. The early gains are the cheapest ones — the curve's steep segment — and projecting them forward is how every new practice regime gets oversold, including by you to yourself. Second, and more importantly: <em>a flattening curve is what learning looks like when it's working</em>. The crawl after the soar isn't the system breaking; it's the system's documented shape. A flat month two is not evidence that month one was a fluke.</p>

<p>There is one plateau worth fearing, and it isn't in the arithmetic. Anders Ericsson called it the OK plateau: the point where a skill becomes automatic, attention withdraws, and the hours keep accumulating while the improvement stops entirely — decades of typing at the same speed, a lifetime of driving without becoming a better driver. The difference between the power law's honest crawl and the OK plateau's disguised halt is <a href="/writing/deliberate-practice">whether you're still practising at the edge</a>: uncomfortable, scored, aimed at the specific thing you miss. A flat trend line can mean "the gains are slower now" or it can mean "you're coasting," and the remedy for the second is not more volume but harder questions — which is <a href="/writing/plateau-boredom">its own discipline</a>, because the edge is exactly where practice stops being pleasant.</p>

<h2>The good news about this particular skill</h2>

<p>If judgement took ten thousand hours to move, a trend line would be a cruel instrument. It doesn't. Calibration — the skill of your "90% sure" actually meaning 90% — is among the fastest-moving skills ever measured. Sarah Lichtenstein and Baruch Fischhoff found that ordinarily overconfident people became substantially calibrated after a couple of hundred judgements with immediate feedback; Douglas Hubbard reports most people reaching near-perfect calibration within about half a day of drills. In Philip Tetlock's multi-year forecasting tournament, a single one-hour training module — probability basics, base rates, a warning about the standard biases — made forecasters measurably more accurate for the entire following year, roughly a ten percent improvement in accuracy scores, and the edge was still there, six to seven percent, years later. These are not decade-scale effects. A few dozen honest rounds is enough volume for real movement — which means a trend line over a month or two of practice isn't wishful; it's the right instrument at the right scale.</p>

<h2>The instrument</h2>

<p>As of this week, the site keeps the evidence. Every trainer's record now carries dates — one small bucket per day you practised — and the <a href="/practice">practice hub</a> splits your record into two halves by volume and puts them side by side: your first thirty ranges beside your latest thirty, your first dozen estimates beside your newest. The <a href="/decide">decision journal</a>'s card does the same with the bets that count, splitting your scored forecasts by when you made them. The comparison is the dieter's move, applied to judgement: aggregates against aggregates, eras against eras, never today against yesterday.</p>

<p>Just as important is what the instrument refuses to do. It won't speak until each half is big enough to carry the claim, and until your record spans real calendar — two weeks for the trainers, a month for the journal — because "your first 4 versus your latest 4" is a horoscope with tabular numerals. It won't backdate: the aggregate scores you built before the record carried dates still count toward your headlines, but the trend starts counting from the day the dates do, because inventing a past would be exactly the kind of tidy false precision the rest of the site exists to fight. And it will never show you a daily graph. The day is noise. You already have a feeling for the day; what you need is the thing the feeling can't supply.</p>

<p>When your trend does speak, read it the way you'd read the scale's monthly line, not the morning number. Movement toward honest is real once the halves are this size — enjoy it, and don't extrapolate it. A flat line has two honest readings: you may be at a ceiling that is the actual goal (once your 90% ranges hold about 90% of the time, "improvement" means staying put — calibration is a skill with a finish line), or you may be in the power law's long crawl, in which case the question isn't "why am I not improving" but "<em>do the questions still sting?</em>" If practice has become comfortable, the flat line is an OK plateau wearing the power law as a costume.</p>

<p>One caveat belongs in writing, here, where the scoreboard lives: the score is a proxy, and <a href="/writing/metric-not-the-mission">proxies rot under optimization</a>. The mission is not a beautiful trend line on trivia; it's the phone estimate you didn't inflate, the deadline you padded to the reference class, the review you graded against what you actually wrote. If your trainer trend keeps improving while your <a href="/writing/experience-doesnt-teach">real-world record</a> doesn't move, you're getting better at the test. The journal's half of the page is the audit on the trainers' half — which is why they now sit together.</p>

<p>The first essay here ended by asking what you're compounding. A month later, the honest follow-up is the question this site is named after and could not, until now, answer: <em>is it working?</em> Not "does it feel like it's working" — the feeling reports daily noise, arrives with a story attached, and quits in the invisible stretch. Measured, at the resolution where measurement means something: halves against halves, eras against eras, direction rather than verdicts. The compound was never going to be visible in the moment. That was never a reason to take it on faith. The compound needs evidence. Now it has somewhere to accumulate.</p>`,
  },
  {
    slug: "the-plan-was-never-tried",
    title: "The Plan Was Never Tried",
    date: "2026-07-09",
    excerpt:
      "About half of sincere intentions never become action. So before a review is allowed to grade your judgement, it has to ask one unglamorous question: did you ever actually do the thing? What an untried plan's outcome can — and can't — teach you.",
    readTime: 7,
    tags: ["decisions", "habits"],
    content: `<p>It's review day. The entry is from March: the decision written in one line, the reasoning, the call, and the forecast you pinned down before you knew anything — what you expected, how sure you were. You read what actually happened, grade it honestly — <em>turned out badly</em> — and start writing the lesson. Something about over-optimism, maybe. Something about the market, or the manager, or your read of the situation. The pen is already moving when the question that should have come first finally clears its throat: <strong>did you ever actually do it?</strong> The first move — the careful if-then you wrote at the bottom of the worksheet, the call you were going to make that first week — never happened. The plan didn't fail. The plan was never tried.</p>

<p>If that stings, the consolation is that it's not a personal defect — it's the statistically normal case. Psychologists have been measuring the distance between intending and doing for decades, and the numbers are brutal in a specific, useful way. Paschal Sheeran's review of the field — a meta-analysis of ten meta-analyses, four hundred–odd studies, eighty-two thousand people — found that intentions explain only about a quarter of the variation in what people actually do. Follow-up work puts it more bluntly: roughly <strong>half of sincere intenders simply never act</strong>. And when Sheeran decomposed the gap, it wasn't people who changed their minds or decided against the goal. It was the group he named <em>inclined abstainers</em>: still fully intending, right up until the window quietly closed. They didn't quit. They just never started.</p>

<p>Which means that on any honest review day, a meaningful fraction of the "outcomes" in your journal aren't outcomes of your decisions at all. They're outcomes of the gap.</p>

<h2>What is this outcome evidence of?</h2>

<p>A decision journal exists to answer one question memory can't be trusted with: are your calls any good? The <a href="/writing/decision-quality">oldest move on this site</a> is separating that question from how things happened to turn out — a good call can lose, a bad call can win, and grading the reasoning by the dice teaches you backwards lessons. But luck is only one of the confounders sitting between your judgement and the result. The other is execution. A decision produces an outcome only <em>through</em> a plan that actually gets carried out — and if the plan was never carried out, the outcome is unlabeled data. It's the night you didn't cook the recipe. Dinner was bad; the recipe has learned nothing, and neither have you.</p>

<p>The cost of misfiling this isn't abstract. File an unexecuted plan's bad outcome as a bad call, and the lesson you bank is about your judgement — so you fix your judgement. You get more careful, more analytical, more conservative; next time you deliberate longer and commit to less. But deciding was never the step that failed. The person who "tried freelancing and it didn't work" but never sent the first pitch hasn't learned that freelancing doesn't work, and the correction their next decision needs isn't caution. Every wrongly-banked lesson of this kind points the same direction — <em>be less bold</em> — and boldness wasn't the thing that failed.</p>

<h2>It still counts — against something else</h2>

<p>The tempting move at this point is to throw the entry out: plan untried, outcome uninformative, nothing to see. That's half right and importantly wrong, because of a detail hiding in the forecast. When you wrote "80% confident," you weren't forecasting the weather. You were forecasting a world that included <em>you executing the plan</em> — and you priced your own follow-through off how determined you felt that evening. Derek Koehler and Connie Poon showed that this is precisely how self-prediction fails: people's forecasts of their own behavior track the <strong>strength of their current intentions</strong> and systematically underweight the situational frictions that decide whether intentions ever become action. Strengthen someone's resolve and their predictions jump while their behavior barely moves; change the frictions and their behavior moves while their predictions barely notice. Feeling determined is real evidence, but it's weak evidence wearing a strong costume.</p>

<p>So the review that ends "never took it" writes down two different lessons at once, and the discipline is keeping them apart. About your judgement of the world — the market, the manager, the odds — it says nothing; that model never got its test. About your judgement of <em>yourself</em>, it says something precise: your word about your own behavior runs optimistic, by a measurable amount. That amount is a <a href="/writing/nobody-thinks-theyre-the-base-rate">base rate</a>, and you own it now. "Plans I make" is a reference class with a hit rate, and the next time you're about to claim 80% on a forecast whose main moving part is you, that hit rate — not that evening's resolve — is the honest place to start.</p>

<h2>The check you have to answer</h2>

<p>There's a second place the same failure hides, one level up, and it's sneakier because it wears the costume of diligence. A <a href="/models#tripwires">tripwire</a> — the signal you set in advance that means <em>stop and reconsider</em> — is itself a plan: an intention to check, scheduled for a future day. Which means it inherits the intention–behavior gap whole. The calendar reminder fires while you're making dinner. You glance at it, feel briefly responsible, and swipe. The tripwire is still armed in your notes and dead in the world — and the plan it was guarding coasts on, unguarded, with your full unearned confidence.</p>

<p>Aviation solved this a long time ago, and the solution is almost offensively simple. Cockpit checklists run <em>challenge and response</em>: one pilot reads the item, the other answers — and the answer must be the actual status, never an acknowledgement. "Flaps?" gets "twenty," not "checked," because "checked" carries no information; it's the sound of a box being ticked, and a box can be ticked by a glance that saw nothing. A silent checklist, in the trade's view, isn't a checklist at all. The lesson transfers exactly: a tripwire check isn't the reminder firing, and it isn't you noticing the reminder. It's a question that ends in a <strong>recorded answer</strong> — the signal appeared, or it didn't. Fired, or all clear. Two words; but they convert a mood of vigilance into an auditable event, and an unanswered check into visible debt instead of silent decay.</p>

<h2>The third question</h2>

<p>So as of today, the review on this site asks three questions instead of two. How did it turn out. Was it the right call, ignoring how it turned out. And — first, whenever you wrote a first move at decision time — <em>did you take it?</em> Took it, partly, or never. The <a href="/decide">journal</a> counts your answers, which means that alongside your calibration and your luck-versus-judgement grid, your record now carries the least glamorous statistic it will ever hold: your follow-through rate. And in the <a href="/premortem">pre-mortem room</a>, a tripwire whose check date has arrived stops being a line of text and becomes a question that wants its answer — fired or all clear — recorded, re-armed if the risk is still live, chased while it's due. The pieces were all there. The worksheet has asked for <a href="/writing/deciding-and-doing">a first move as an if-then</a> since June; the pre-mortem has saved tripwires with dates on them from the day it opened. What was missing was anyone ever coming back to ask whether the mechanism moved.</p>

<h2>The honest limits</h2>

<p>Three, and they matter. First: "partly, or late" is not a failure category — it's most of real life. The question behind the question is whether the plan got a real test, and a first move taken in week three instead of week one usually still tested it. Grade generously and move on; the point is attribution, not purity.</p>

<p>Second — and this is the deciding-and-doing essay's caveat, pointed backwards — a first move you kept not taking is sometimes <em>information about the call</em>. If you've written three crisp if-thens toward the same goal and executed none of them, the pattern isn't three execution failures; it's your gut filing a dissent through the only channel it has. The follow-through question is meant to protect your judgement from unfair verdicts, not to protect a decision you don't actually want from a fair one. Three untried plans toward one goal is a verdict on the goal.</p>

<p>Third, the flattering misuse. "Great decisions, poor execution" is a comfortable identity — it lets you keep the compliment and outsource the failure to a lesser self who merely does things. The counts are there so that story has to survive arithmetic. If your journal says your calls are excellent and your follow-through runs forty percent, then the highest-value "decision" available to you isn't a decision at all; it's a sharper if-then, a smaller first move, a tripwire on your own starting. The site's oldest refrain — procedure over virtue — applies to the doing too.</p>

<p>The journal's founding promise was to grade the bet, not the result. The quiet corollary took a month to surface: a bet you never placed can't be graded at all — except on the one thing every plan you will ever make is also, always, a bet on. You. That number is on the page now. For about half of us, if the research is right, it's the number doing the most work.</p>`,
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
