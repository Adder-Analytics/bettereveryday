export type Book = {
  title: string;
  author: string;
  year: number;
  annotation: string;
  category: string;
  rating: 1 | 2 | 3;
};

export const books: Book[] = [
  // Finance
  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    year: 2020,
    annotation:
      "The best personal finance book written in the last decade, and it's barely about finance. Housel's central argument: your behavior with money matters more than your knowledge of it. Every chapter is a standalone essay. Chapters 3 and 18 alone are worth the read.",
    category: "Finance",
    rating: 3,
  },
  {
    title: "The Little Book of Common Sense Investing",
    author: "John C. Bogle",
    year: 2007,
    annotation:
      "The inventor of the index fund explains, in under 200 pages, why almost every investor would do better by buying the whole market and doing nothing. The argument is simple, the evidence is overwhelming, and it will make you deeply suspicious of anyone trying to sell you something more complicated.",
    category: "Finance",
    rating: 3,
  },
  {
    title: "A Random Walk Down Wall Street",
    author: "Burton Malkiel",
    year: 1973,
    annotation:
      "The classic case for index investing, backed by decades of research. Malkiel's core claim — that stock prices follow a random walk and can't be reliably predicted — has not aged badly. A more rigorous read than Bogle but makes the same essential case.",
    category: "Finance",
    rating: 2,
  },

  // Thinking & Decisions
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    year: 2011,
    annotation:
      "The comprehensive account of how human judgment actually works, from the psychologist who spent a career studying its failures. System 1 and System 2 have become cultural shorthand for a reason. Read the chapters on overconfidence, planning fallacy, and what Kahneman calls 'what you see is all there is' — these are the biases that cost people the most.",
    category: "Thinking",
    rating: 3,
  },
  {
    title: "Fooled by Randomness",
    author: "Nassim Nicholas Taleb",
    year: 2001,
    annotation:
      "Taleb's best book, sharper and less performatively contrarian than his later work. The core argument: we systematically underestimate the role of luck in success and failure, and this leads to learning exactly the wrong lessons from outcomes. Essential reading alongside Annie Duke on decision quality.",
    category: "Thinking",
    rating: 3,
  },
  {
    title: "How Minds Change",
    author: "David McRaney",
    year: 2022,
    annotation:
      "A surprisingly rigorous investigation into why people change their minds — and why most strategies for persuading them don't work. The chapter on deep canvassing alone reframes how to have productive disagreements. More useful than any debate tactic.",
    category: "Thinking",
    rating: 2,
  },
  {
    title: "The Scout Mindset",
    author: "Julia Galef",
    year: 2021,
    annotation:
      "The cleanest articulation of what it means to care about being right rather than feeling right. Galef distinguishes the 'soldier' mindset (motivated reasoning, defending your existing beliefs) from the 'scout' mindset (genuine curiosity about what's true). Short, practical, and genuinely changes how you read your own thinking.",
    category: "Thinking",
    rating: 2,
  },

  // Writing & Craft
  {
    title: "On Writing",
    author: "Stephen King",
    year: 2000,
    annotation:
      "Half memoir, half craft manual, and the best book on writing I know. The memoir half explains where King's work comes from. The craft half is ruthless about what makes prose work: adverbs kill writing, passive voice signals fear, the only way to write better is to read constantly and write every day. The toolbox metaphor in the middle of the book is the best framing of craft development I've encountered.",
    category: "Writing",
    rating: 3,
  },
  {
    title: "Several Short Sentences About Writing",
    author: "Verlyn Klinkenborg",
    year: 2012,
    annotation:
      "Formally strange — the book is written in short, declarative fragments — but the strangeness makes the argument. Klinkenborg's thesis: the sentence is the unit of writing, and most people never learn to build one with intention. This book made me read my own drafts differently, which is the highest praise I can give a writing book.",
    category: "Writing",
    rating: 3,
  },
  {
    title: "Bird by Bird",
    author: "Anne Lamott",
    year: 1994,
    annotation:
      "The most honest account of the writing life: the fear, the bad first drafts, the imposter syndrome, the small victories. Lamott doesn't make it sound glamorous. She makes it sound survivable, which is more useful. 'Shitty first drafts' has become a cliché, but the chapter it comes from is still true.",
    category: "Writing",
    rating: 2,
  },

  // Science & Systems
  {
    title: "Scale",
    author: "Geoffrey West",
    year: 2017,
    annotation:
      "A physicist investigates why so many phenomena in biology, cities, and companies follow the same mathematical scaling laws. Cities scale superlinearly with population (crime, patents, wages all grow faster than the population); organisms scale sublinearly with mass (larger animals live longer and have slower metabolisms). The unifying mathematics is surprising and beautiful.",
    category: "Science",
    rating: 2,
  },
  {
    title: "The Body",
    author: "Bill Bryson",
    year: 2019,
    annotation:
      "Bryson's comprehensive tour of human anatomy and physiology, written with the humility of a non-expert explaining to other non-experts. The organizing insight: the human body is extraordinarily improbable, constantly solving problems that engineering hasn't, and we understand far less of it than medicine implies. Makes you appreciative in a way that's hard to manufacture any other way.",
    category: "Science",
    rating: 2,
  },

  // History & Perspective
  {
    title: "Meditations",
    author: "Marcus Aurelius",
    year: 180,
    annotation:
      "Private journal of a Roman emperor who kept reminding himself to be better — not for posterity, but because the writing itself was the practice. Stoic philosophy as actually lived, not theorized. Book V and Book VIII are worth reading slowly. The fact that he had to keep reminding himself of the same lessons, decade after decade, is the most humanizing part.",
    category: "History",
    rating: 3,
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    year: 2011,
    annotation:
      "The most ambitious popular history book of the last two decades, covering 70,000 years of human history in 400 pages. Best at the beginning (the cognitive revolution) and weakest toward the end (futures speculation). The argument about shared fictions as the basis of human cooperation is worth the entire book and will change how you see institutions, money, and nations.",
    category: "History",
    rating: 2,
  },

  // Work & Learning
  {
    title: "So Good They Can't Ignore You",
    author: "Cal Newport",
    year: 2012,
    annotation:
      "Newport's contrarian argument: 'follow your passion' is bad advice. Passion follows mastery, not the other way around. The way to love what you do is to get genuinely good at something valuable — developing 'career capital' — and then use that capital to shape your work. Better advice than almost anything about career paths I've encountered elsewhere.",
    category: "Work",
    rating: 3,
  },
  {
    title: "Range",
    author: "David Epstein",
    year: 2019,
    annotation:
      "The counterargument to early specialization. Epstein shows that in most domains, generalists who develop breadth before depth outperform early specialists — they're more adaptable, more creative, and better at transferring insights across domains. Pair with 'So Good They Can't Ignore You' — Newport on depth, Epstein on when breadth builds the right foundation for it.",
    category: "Work",
    rating: 2,
  },
];

export const categories = Array.from(new Set(books.map((b) => b.category)));
