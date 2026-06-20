import { models } from "./models";

export type Note = {
  slug: string;
  title: string;
  /** Must exactly match a `title` in books.ts — used for bidirectional linking. */
  bookTitle: string;
  date: string;
  content: string;
  /**
   * IDs of mental models (see models.ts) this note sharpens — the abstract idea
   * the concrete story is an instance of. Surfaced in both directions: the note
   * links out to the model, and the model lists the note. Unknown ids throw at
   * build time (see getNotesForModel's caller / resolveNoteModels).
   */
  models?: string[];
};

export const notes: Note[] = [
  {
    slug: "kahneman-inside-view",
    models: ["base-rates"],
    title: "Knowing About a Bias Doesn't Exempt You From It",
    bookTitle: "Thinking, Fast and Slow",
    date: "2026-06-12",
    content: `<p>The most quietly devastating story in the book is one Kahneman tells on himself. He assembled a team to write a decision-making curriculum for Israeli high schools. A year in, he asked everyone to estimate how long the project would take to finish. The estimates clustered around two more years.</p>

<p>Then he asked the team's curriculum expert a different question: how long did <em>comparable teams</em> take? The expert — visibly uncomfortable — reported that about 40% of such teams never finished at all, and none he could recall finished in under seven years. He also rated this team as slightly below average. Then something remarkable happened: nothing. The team, including the expert, including Kahneman, accepted the numbers and kept working off the two-year estimate. The book took eight more years, and by the time it was done, the ministry no longer wanted it.</p>

<p>This is the inside view versus the outside view. The inside view builds a forecast from the particulars of your case — your plan, your team, your visible progress. The outside view asks what happened, on average, to everyone who attempted this class of thing. The outside view is usually right, and almost nobody consults it, because the particulars of our own case feel so much more informative than a base rate.</p>

<p>What stays with me is that awareness did nothing. The man who would win a Nobel Prize partly for describing the planning fallacy heard the base rate, believed it, and proceeded as if he hadn't. The lesson isn't "learn about the bias" — he had written the literature. The lesson is that the correction has to live in the procedure, not in your judgment: make the base-rate lookup a mandatory step before commitment, because the in-the-moment mind will always vote for the inside view.</p>`,
  },
  {
    slug: "housel-tails",
    models: ["expected-value", "margin-of-safety"],
    title: "Tails Drive Everything — Which Means It's Normal for Most Things to Fail",
    bookTitle: "The Psychology of Money",
    date: "2026-06-12",
    content: `<p>The chapter worth re-reading is the one about Heinz Berggruen, the art dealer who assembled one of the great Picasso and Klee collections of the twentieth century. Was he a genius at picking masterpieces? Housel's answer: probably not — he bought in enormous quantity, and a small handful of acquisitions turned out to be the masterpieces that carried everything else. The bulk of the collection could have been mediocre and the portfolio would still have been historic.</p>

<p>The pattern generalizes further than feels comfortable. Disney produced hundreds of cartoons in the 1930s; Snow White effectively paid for all of them. Venture capital is explicit about expecting a fund's returns to come from one or two companies. Most of what an index fund holds underperforms — the index works anyway, because it is guaranteed to contain the handful of stocks doing nearly all of the compounding.</p>

<p>The implication Housel draws is the useful part: if outcomes are driven by tails, then <em>a strategy can be working while feeling like failure almost all of the time</em>. Most of your individual bets, projects, essays, experiments are supposed to be unremarkable. That's not the strategy breaking; that's what a tail-driven distribution looks like from the inside, on an ordinary day.</p>

<p>This connects to a mistake I'd been making without naming it: judging a portfolio by its median holding, or a body of work by its median piece. In a tail-driven domain that's a category error. The right questions are whether you're taking enough swings for the tail to show up, and whether you can survive — financially, emotionally — the long stretch of unremarkable outcomes that the math requires you to sit through.</p>`,
  },
  {
    slug: "klinkenborg-sentences",
    title: "Most Writing Problems Are Sentence Problems",
    bookTitle: "Several Short Sentences About Writing",
    date: "2026-06-12",
    content: `<p>Klinkenborg's central claim sounds too small to be a thesis: the sentence is the unit of writing, and almost no one is ever taught to make one. We're taught the surrounding apparatus — paragraphs, transitions, structure, "flow" — and taught, mostly by implication, to fear the short sentence as childish. So we write long ones to sound like writers, and the length conceals the fact that we don't fully know what we're saying.</p>

<p>His test for revision is the part I've actually adopted. Of every sentence, ask three things: What does it say? What doesn't it say? <em>What does it imply?</em> The third question is where bad writing hides. A sentence can be grammatically clean and factually accurate while implying a claim you never examined and wouldn't defend. Implication is the freight a sentence carries without declaring it, and most drafts are full of undeclared freight.</p>

<p>The practical technique that follows: read your draft one sentence at a time, as if each sentence had to survive alone. What this kills is the illusion of flow — the sense that the paragraph is carrying meaning when really each sentence is leaning on its neighbors, none of them bearing weight individually. Flow, in most drafts, is camouflage.</p>

<p>The book practices its own argument: it's written entirely in short, declarative sentences, set like verse, and the form makes the claim more convincingly than an argument could. It changed how I read my own drafts, which is the most a writing book can do.</p>`,
  },
  {
    slug: "dawkins-ess",
    models: ["incentive-structures", "leverage-points"],
    title: "Stable Doesn't Mean Good",
    bookTitle: "The Selfish Gene",
    date: "2026-06-12",
    content: `<p>The idea from this book that I use most often has nothing to do with genes directly. It's John Maynard Smith's concept of the evolutionarily stable strategy, which Dawkins explains through a population of hawks and doves: hawks always fight, doves always back down. All-doves would be the best world on average — but it isn't stable, because a single hawk in a world of doves wins every encounter and the strategy spreads. The population settles instead at an equilibrium mix that is <em>worse for the average individual than all-doves would have been</em>, yet immune to invasion. That's what stability means: not best, just undefeatable from inside.</p>

<p>Once you have this lens, you see ESS-like equilibria everywhere people interact. The meeting that everyone privately agrees is useless persists because no single attendee can skip it without cost. Escalating work hours, arms races, nine-round interview processes — each is a stable strategy nobody chose and nobody can unilaterally defect from. Bad equilibria don't require villains. They only require that defection be locally punished, even when coordination would make everyone better off.</p>

<p>Two corrections this idea makes to default thinking. First, "this norm exists, therefore it serves us" is a non sequitur — persistence proves only stability, not value. Conflating the two is how bad norms get defended as natural. Second, escaping a bad equilibrium is a coordination problem, not a willpower problem, so the lever is changing payoffs or moving groups at once — lecturing individuals to defect one at a time mostly just gets the defectors punished on schedule.</p>

<p>Fifty years old, and still the clearest account I know of why systems full of reasonable people produce outcomes none of them want.</p>`,
  },
  {
    slug: "ellenberg-survivorship",
    models: ["availability-heuristic", "base-rates"],
    title: "The Sample You Can See Is Not the Sample You Want",
    bookTitle: "How Not to Be Wrong",
    date: "2026-06-15",
    content: `<p>The story Ellenberg opens with is the one I think about most. In World War II, the U.S. military studied bombers returning from missions to decide where to add armor. The planes came back peppered with bullet holes — concentrated on the fuselage and wings, sparse on the engines — and the natural conclusion was to reinforce where the damage clustered. The statistician Abraham Wald said the opposite: armor the engines, the places with <em>no</em> holes. The holes weren't a map of where planes got hit. They were a map of where a plane could get hit and still make it home. The data set was missing every plane that took an engine round and never returned to be counted.</p>

<p>This is survivorship bias, and once Wald names it you cannot stop seeing it. The reason it's so hard to catch unaided is that the missing cases are, by construction, invisible. You reason confidently from the planes in front of you precisely because the ones that would have corrected you aren't there to be examined. The sample isn't just biased — it has been filtered by the very outcome you're trying to study.</p>

<p>What strikes me is how closely this rhymes with the way memory misleads. The availability heuristic distorts because vivid, reported cases crowd into recall while the mundane ones stay quiet; survivorship distorts because the failures are removed from the data entirely before you ever look. Different mechanisms, same shape: you estimate from the cases that made it to your attention and forget to ask what selection process decided which cases those would be. "Successful founders all dropped out of college" and "the bullet holes are on the wings" are the same sentence.</p>

<p>The practical reflex Ellenberg leaves me with isn't a formula. It's a question to ask before drawing any lesson from a set of examples: <em>what would the cases that didn't survive to be counted look like, and where did they go?</em> The most important data point is often the one that isn't in the room.</p>`,
  },
];

export const sortedNotes = [...notes].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export function getNotesForBook(bookTitle: string): Note[] {
  return notes.filter((n) => n.bookTitle === bookTitle);
}

/**
 * The models a note sharpens, resolved to {id, name} so titles come from the
 * source data and can't drift. Throws at build time on an unknown id — the same
 * throw-on-unknown discipline situations.ts and books.ts use.
 */
export function resolveNoteModels(note: Note): { id: string; name: string }[] {
  return (note.models ?? []).map((id) => {
    const model = models.find((m) => m.id === id);
    if (!model) {
      throw new Error(`Note "${note.slug}" references unknown model "${id}"`);
    }
    return { id: model.id, name: model.name };
  });
}

/**
 * Reverse lookup: which reading notes illuminate this model. Lets the models
 * page surface "In the reading notes" without the model declaring anything —
 * declared once on the note, surfaced in both directions, can't drift.
 */
export function getNotesForModel(id: string): { slug: string; title: string }[] {
  return notes
    .filter((n) => (n.models ?? []).includes(id))
    .map((n) => ({ slug: n.slug, title: n.title }));
}
