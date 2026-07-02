/**
 * The problem bank behind the base-rate trainer's "pick the prior" mode.
 *
 * The trainer's other two modes hand you the base rate and drill the update —
 * how far a test result should move you. Both essays that anchor this corner of
 * the site end on the same honest admission: the arithmetic is the easy part,
 * and the genuinely hard judgement is upstream, in *choosing the prior at all* —
 * picking the reference class your case belongs to. Kahneman's name for the
 * failure is the inside view: you forecast from the particulars of your case
 * (the plan, the talent, the feeling) instead of from the record of everyone
 * who tried the same kind of thing. The reading note on Thinking, Fast and Slow
 * ends by demanding that the base-rate lookup become a procedure, a mandatory
 * step. This mode is that procedure, made drillable.
 *
 * Each problem is a messy, real-shaped question with no answer key — that's the
 * point. You give a gut answer first; then you're shown candidate reference
 * classes and asked which one you'd *start from*. The candidates include traps:
 * a class of one (the inside view wearing a costume — it has no rate to give
 * you) and, where folklore supplies one, a famous number with no study behind
 * it. The reveal shows where every honest class lands, how far your gut ran
 * from the outside view, and the specific judgement this problem trains.
 *
 * Every honest rate is sourced, and deliberately rounded — these are starting
 * points, not answer keys, and pretending to precision would teach the wrong
 * lesson. What gets recorded is the *inside-view premium*: how far your gut ran
 * above (or below) the class you chose to stand on.
 */

export type ReferenceClass = {
  id: string;
  /** Short label for the card — "All new US businesses". */
  label: string;
  /** What the class is and what its history reports, shown on the card. */
  description: string;
  /**
   * The class's rate for the question's outcome, as a whole percentage 0–100.
   * Null for trap cards — a class of one has no rate to give, and folklore's
   * number doesn't count as one.
   */
  rate: number | null;
  /**
   * Why this card can't be your starting point. "one" is a class of one — the
   * inside view dressed as a class. "folklore" is a widely repeated rate with
   * no study behind it. Honest classes leave this unset.
   */
  trap?: "one" | "folklore";
  /** Shown when you pick a trap (the correction) or at reveal (the reading). */
  note: string;
};

export type ReferenceProblem = {
  id: string;
  /** Short label for the menu / record. */
  title: string;
  /** The setup — always a case that feels special from the inside. */
  scenario: string;
  /**
   * The question, framed so a higher percentage is the rosier answer — the
   * recorded gap (gut − chosen rate) then reads as optimism when positive.
   */
  question: string;
  classes: ReferenceClass[];
  /** The judgement this problem exists to train, shown at reveal. */
  lesson: string;
  /** Where the numbers come from. */
  source: string;
};

export const referenceProblems: ReferenceProblem[] = [
  {
    id: "deadline",
    title: "The deadline you're about to promise",
    scenario:
      "You've scoped a project — a launch, a renovation, a rewrite, a thesis. The plan says three months, and the plan looks solid: you've listed the steps, nothing on the list looks hard, and you've left what feels like slack.",
    question: "What's the chance you actually finish by the date in the plan?",
    classes: [
      {
        id: "this-plan",
        label: "This project, as planned",
        description:
          "You know the steps, the team, the tools. You've done the estimating carefully, and nothing on the list looks hard.",
        rate: null,
        trap: "one",
        note:
          "That's a class of one, and its only data is the plan itself. A plan is a story about the best case — the steps that will actually sink the schedule are the ones that aren't on the list, which is why reading the plan harder can't find them. Start from a class with a history.",
      },
      {
        id: "self-predictions",
        label: "People predicting their own work",
        description:
          "Students predicting their own thesis said 34 days on average and took 55. About 30 in 100 finished by the date they'd named.",
        rate: 30,
        note:
          "The classic planning-fallacy measurement — honest people, familiar work, no incentive to lie, and still a 30% hit rate on their own dates.",
      },
      {
        id: "sure-dates",
        label: "Dates people were “99% sure” of",
        description:
          "Asked instead for a date they were almost certain to finish by, people did give themselves more room — and still fewer than half made it.",
        rate: 45,
        note:
          "Even the padded, near-certain date holds less than half the time. The miss isn't in the arithmetic of the estimate; it's in forecasting from the plan at all.",
      },
      {
        id: "big-projects",
        label: "Big projects with professional planners",
        description:
          "Across a database of thousands of major projects — full-time planners, formal schedules, real budgets — roughly 1 in 10 comes in on budget, and on time as well is rarer still.",
        rate: 8,
        note:
          "Professionalism doesn't cure it. The people missing these dates plan for a living; what they share with the student and the thesis is the inside view.",
      },
    ],
    lesson:
      "Nearly everyone's gut starts above 80% — the plan is right there, and it looks doable. Every class with a history lands between roughly 8% and 45%. The move is not to distrust plans; it's to forecast from the record of people finishing things, let the plan argue for a modest adjustment, and size the buffer to the usual overrun instead of to your optimism.",
    source:
      "Buehler, Griffin & Ross (1994), Journal of Personality and Social Psychology — predicted 33.9 days, actual 55.5, ~30% done by the predicted date, and under half by the dates given with near-certainty. Bent Flyvbjerg's project database (How Big Things Get Done, 2023) for the professionals.",
  },
  {
    id: "restaurant",
    title: "Your friend's restaurant",
    scenario:
      "A friend who genuinely can cook is opening a restaurant. Great location, real savings behind it, ten years of kitchen experience. She asks what you honestly think her odds are.",
    question: "What's the chance the restaurant is still open five years from now?",
    classes: [
      {
        id: "everyone-knows",
        label: "The number everyone's heard",
        description:
          "“90% of restaurants fail in the first year.” By that arithmetic she'd be lucky to see year two, never mind year five.",
        rate: null,
        trap: "folklore",
        note:
          "That number has no study behind it — it traces to an early-2000s TV commercial and has never appeared in any dataset. When researchers tracked every restaurant in the government's business census, about 17% closed in the first year — slightly better than service businesses generally. A rate you can't source isn't a base rate; it's a rumor with a percent sign.",
      },
      {
        id: "all-businesses",
        label: "All new US businesses",
        description:
          "The Bureau of Labor Statistics tracks every new employer establishment: about half are still operating five years in, a figure that's held for decades, across booms and busts.",
        rate: 50,
        note:
          "The broadest honest class — everything from restaurants to plumbing firms — and the most stable number in the set.",
      },
      {
        id: "restaurants",
        label: "New restaurants specifically",
        description:
          "Tracking restaurants alone in the same census data: about 17% close in the first year, and a bit under half reach year five — barely different from other young businesses.",
        rate: 45,
        note:
          "The narrower class the question actually names — and it turns out to sit almost on top of the broad one, which is itself worth knowing: restaurants are a normal business, not a doomed one.",
      },
    ],
    lesson:
      "The honest classes agree — about half — and the correction runs in both directions at once. Your gut, with the talent and the location in view, probably said 70 or 80; the folklore says 10. Both are wrong, and the outside view fixes both. Her talent is real evidence — it's what you use to nudge 45% upward a little, not a reason to throw the class away.",
    source:
      "US Bureau of Labor Statistics, Business Employment Dynamics (five-year establishment survival ≈ 50%). Luo & Stark (2014), tracking restaurant mortality in BLS census data: ~17% first-year closure. The 90% figure traces to a 2003 American Express commercial.",
  },
  {
    id: "wedding",
    title: "The wedding-toast question",
    scenario:
      "Two friends — early thirties, both college-educated, first marriage for both, visibly right for each other — are getting married this summer. Privately, honestly: what are the odds?",
    question: "What's the chance the marriage lasts for good?",
    classes: [
      {
        id: "this-couple",
        label: "This couple, as you know them",
        description:
          "You've watched them together for years. They communicate, they've weathered hard stretches, their friends all say the same thing.",
        rate: null,
        trap: "one",
        note:
          "Everyone at every wedding is reasoning from this class. In the classic study, newlyweds estimated the national divorce rate accurately — about half — and put the median chance of their own divorce at zero percent. A class of one always reports whatever the inside view feels; that's why it can't be the starting point.",
      },
      {
        id: "first-marriages",
        label: "All US first marriages",
        description:
          "The long-run record: roughly 40–45% of first marriages end in divorce — call it a bit better than a coin flip that one lasts.",
        rate: 55,
        note:
          "The broad class, and the one the folklore '50% of marriages fail' loosely tracks — for first marriages it's a little kinder than the slogan.",
      },
      {
        id: "college-late",
        label: "College graduates marrying after 25",
        description:
          "Marriage stability differs sharply by education and age at marriage: for college-educated couples marrying from their late twenties on, roughly three in four marriages go the distance.",
        rate: 75,
        note:
          "A genuinely narrower class with measured data behind the narrowing — this couple really does belong to it, and it really does have better odds.",
      },
    ],
    lesson:
      "This is the problem where narrowing is legitimate. The couple truly belongs to a class with better odds, and it's the survey data — not their visible glow — that moves 55% to 75%. That's the art in one line: narrow exactly as far as measured differences take you, and no further. And notice what never happened: no honest class got anywhere near the 95%+ that everyone in the room, including the couple, feels.",
    source:
      "Baker & Emery (1993), Law and Human Behavior — newlyweds' median estimate of their own divorce odds: 0%, alongside accurate estimates for the population. CDC/NCHS National Survey of Family Growth (Copen et al., 2012) on marriage survival by education and age at marriage.",
  },
  {
    id: "startup",
    title: "Your friends' startup",
    scenario:
      "Two of the sharpest people you know quit their jobs to found a startup, and they've just raised a seed round. They're picturing the outcome every founder pictures: the big one.",
    question:
      "What's the chance it succeeds the way they're picturing — an exit that makes them genuinely rich?",
    classes: [
      {
        id: "these-founders",
        label: "Founders this talented",
        description:
          "They're exceptional — everyone says so. Smarter and more determined than the average founder by a mile.",
        rate: null,
        trap: "one",
        note:
          "Every pitch deck ever written argues from this class. The uncomfortable arithmetic: the founders inside the failure statistics were also, overwhelmingly, exceptional people whom everyone believed in — that's how they raised money and entered the dataset. 'Talented founders' isn't a class you can look up; it's the adjective the inside view gives itself.",
      },
      {
        id: "returns-capital",
        label: "Venture-backed startups that pay back their investors",
        description:
          "Harvard research tracking venture-backed companies: about three in four never return their investors' capital at all.",
        rate: 25,
        note:
          "The generous definition of success — the company merely gives the money back — and it still excludes three-quarters of the class.",
      },
      {
        id: "unicorns",
        label: "Seed-funded startups that reach a billion-dollar valuation",
        description:
          "Of seed-funded tech companies tracked cohort by cohort, roughly 1 in 100 ever reaches a billion-dollar valuation — the outcome the phrase 'the big one' usually means.",
        rate: 1,
        note:
          "The outcome in the daydream, at its measured frequency. Not zero — someone is the 1% — but a lottery is a bad plan even when the ticket is real.",
      },
    ],
    lesson:
      "The spread here — 1% to 25% — isn't noise; it's the other half of the skill. Before you can pick the class you have to pin down the event: 'succeeds' isn't an outcome, 'returns its investors' money' is, and the honest number moves by a factor of twenty-five depending on which you meant. The useful answer to your friends is not 'you'll fail.' It's that the plan should survive the 75% case, and the equity daydream should be priced at the 1% it costs.",
    source:
      "Shikhar Ghosh (Harvard Business School) on venture-backed startups failing to return capital (~75%). CB Insights cohort tracking of seed-funded companies reaching $1B valuations (~1%). Both deliberately rounded — these are priors, not predictions.",
  },
];

/** The honest (data-bearing) classes — what the reveal strip plots. */
export function honestClasses(p: ReferenceProblem): ReferenceClass[] {
  return p.classes.filter((c) => c.rate !== null);
}

/** The span of defensible starting points, for the reveal copy. */
export function honestRange(p: ReferenceProblem): { lo: number; hi: number } {
  const rates = honestClasses(p).map((c) => c.rate as number);
  return { lo: Math.min(...rates), hi: Math.max(...rates) };
}
