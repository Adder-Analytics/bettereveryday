export type Model = {
  id: string;
  name: string;
  domain: string;
  tagline: string;
  explanation: string;
  /** Slugs of essays that explore this model in depth. */
  essays?: string[];
};

export const models: Model[] = [
  // Finance & Economics
  {
    id: "compound-interest",
    name: "Compound Interest",
    domain: "Finance",
    tagline: "Returns accumulate on previous returns, producing exponential rather than linear growth.",
    explanation:
      "The returns in year thirty don't just come from the principal — they come from thirty years of accumulated growth. This is why starting early matters more than starting smart, and why the first decade of investing feels unremarkable despite being the most important. The same math applies to knowledge, skills, and reputation: the value of early investment is invisible until it suddenly isn't.",
    essays: ["money-math", "compounding-improvements"],
  },
  {
    id: "opportunity-cost",
    name: "Opportunity Cost",
    domain: "Finance",
    tagline: "The real cost of any choice is what you give up by not choosing the next-best alternative.",
    explanation:
      "When you spend an hour watching TV, the cost isn't zero — it's whatever you would have done otherwise. When a company holds cash, the cost isn't zero — it's whatever return they could have earned elsewhere. Ignoring opportunity cost produces systematically bad resource allocation because you only account for what you gain, not what you forgo. The question isn't 'is this good?' but 'is this better than the alternatives?'",
  },
  {
    id: "margin-of-safety",
    name: "Margin of Safety",
    domain: "Finance",
    tagline: "Build a buffer between your estimate and your actual exposure.",
    explanation:
      "Benjamin Graham's core principle: if you think a company is worth $100 a share, don't buy it at $90 — buy it at $60, so that if your analysis is wrong you still don't lose money. The margin of safety absorbs your inevitable errors. The same principle applies wherever estimates are involved: engineers over-design bridges, doctors set conservative dosage limits, builders add schedule buffers. The underlying logic is always the same: your assumptions are probably optimistic.",
  },
  {
    id: "incentive-structures",
    name: "Incentive Structures",
    domain: "Finance",
    tagline: "People respond to what they're rewarded for, not what they're told.",
    explanation:
      "Charlie Munger: 'Show me the incentive and I'll show you the outcome.' Almost every institutional dysfunction, perverse behavior, or persistent failure can be traced to an incentive structure that rewards the wrong thing. A doctor paid per procedure has different incentives than one paid per patient outcome. A fund manager paid on assets under management has different incentives than one paid on returns. Before judging people for behaving badly, understand what they're actually being paid — in money, status, or security — to do.",
    essays: ["metric-not-the-mission"],
  },

  // Decision-making
  {
    id: "expected-value",
    name: "Expected Value",
    domain: "Decisions",
    tagline: "Multiply probability by magnitude for each outcome, then sum — the result is what a decision is worth in expectation.",
    explanation:
      "A 10% chance of winning $1,000 has the same expected value as a 100% chance of winning $100. Thinking in expected value makes you systematically better at trade-offs involving risk and uncertainty — you stop treating unlikely bad outcomes as reasons to avoid favorable bets, and stop treating unlikely good outcomes as justification for bad ones. The challenge: human intuition about probability is poorly calibrated, especially for small or large probabilities.",
    essays: ["decision-quality"],
  },
  {
    id: "inversion",
    name: "Inversion",
    domain: "Decisions",
    tagline: "To solve a problem, ask what would cause the opposite outcome — then avoid it.",
    explanation:
      "Charlie Munger's adaptation of mathematician Carl Jacobi's advice: 'Invert, always invert.' Instead of asking 'How do I succeed?' ask 'What would cause me to fail?' Instead of 'How do I build a good business?' ask 'What would definitely destroy one?' Problems often become much easier when approached from the other end. Inversion also produces more honest analysis — it's harder to maintain motivated reasoning when you're trying to steelman failure.",
  },
  {
    id: "pre-mortem",
    name: "Pre-mortem",
    domain: "Decisions",
    tagline: "Before a major decision, imagine it failed — then ask what went wrong.",
    explanation:
      "Psychologist Gary Klein's technique for bypassing the optimism bias that makes us underweight failure scenarios. Imagining failure as already having happened shifts thinking from advocacy mode to analysis mode: suddenly risks feel real rather than disloyal to the plan. The pre-mortem doesn't mean abandoning the decision — it means stress-testing it. Decisions that survive a rigorous pre-mortem are more likely to actually be good decisions, not just compelling ones.",
    essays: ["decision-quality"],
  },
  {
    id: "reversibility",
    name: "Reversibility",
    domain: "Decisions",
    tagline: "Separate one-way decisions from two-way decisions — and treat them very differently.",
    explanation:
      "Jeff Bezos's 'Type 1 and Type 2' framework: one-way doors require extensive deliberation because you can't undo them; two-way doors should be decided quickly because the cost of being wrong is low and you learn more by moving. The error most organizations make is treating too many decisions like one-way doors, which makes them slow when they should be fast. The genuinely one-way doors — hiring, culture, irreversible commitments — deserve the slowness. Most decisions don't.",
    essays: ["decision-quality"],
  },

  // Systems Thinking
  {
    id: "feedback-loops",
    name: "Feedback Loops",
    domain: "Systems",
    tagline: "Systems regulate or amplify themselves through circular causation.",
    explanation:
      "A thermostat is a negative feedback loop: output (temperature) feeds back to reduce the driver (heating). A microphone near a speaker is a positive feedback loop: output (sound) amplifies the input, producing a screech. Understanding which type is operating predicts whether a system will seek equilibrium or spiral. Most healthy systems rely on negative feedback to self-correct. Most crises involve positive feedback loops that weren't noticed until they were hard to stop.",
  },
  {
    id: "second-order-effects",
    name: "Second-Order Effects",
    domain: "Systems",
    tagline: "The consequences of consequences are often more important than first-order effects.",
    explanation:
      "Rent control lowers rents in the short term (first order) while reducing housing supply and raising rents in the long term (second order). Antibiotics kill bacteria immediately (first order) while selecting for resistant strains over time (second order). Most policy failures and unintended consequences come from acting on first-order effects without modeling the second. The question to always ask: 'And then what?'",
    essays: ["second-order-thinking"],
  },
  {
    id: "goodharts-law",
    name: "Goodhart's Law",
    domain: "Systems",
    tagline: "When a measure becomes a target, it ceases to be a good measure.",
    explanation:
      "Every metric is a proxy — chosen because it's cheaper to observe than the thing you actually want. Attach rewards to the proxy and people will optimize the proxy, widening the gap between what's measured and what matters: test scores without education, accounts opened without customers served. The defense isn't abandoning measurement — it's stress-testing metrics before adopting them ('how could someone hit this number while failing at the goal?'), pairing metrics so gaming one trips another, and retiring measures before they're fully optimized against.",
    essays: ["metric-not-the-mission"],
  },
  {
    id: "leverage-points",
    name: "Leverage Points",
    domain: "Systems",
    tagline: "Small changes in certain system parameters produce large and lasting effects.",
    explanation:
      "Donella Meadows identified twelve places to intervene in complex systems, ranked by effectiveness. Adjusting flows and stocks (the obvious moves) is low leverage. Changing the rules, changing the goals, and changing the paradigm within which the system operates are high leverage. Most well-resourced interventions target the wrong level. The most effective change-makers find the leverage points — usually somewhere surprising — and push there.",
  },

  // Psychology
  {
    id: "availability-heuristic",
    name: "Availability Heuristic",
    domain: "Psychology",
    tagline: "We estimate probability by how easily examples come to mind.",
    explanation:
      "Plane crashes feel more dangerous than car crashes because they're more vivid and memorable. The availability heuristic makes us systematically overestimate dramatic, recent, or emotionally resonant risks and underestimate mundane, distributed ones. It usually works — ease of recall once tracked real frequency — and breaks precisely when something other than frequency (vividness, repetition, an algorithmic feed) curates what you remember. The correction isn't to suppress intuition — it's to check where your examples came from, then look up the base rate.",
    essays: ["availability-heuristic"],
  },
  {
    id: "anchoring",
    name: "Anchoring",
    domain: "Psychology",
    tagline: "The first number we encounter disproportionately influences our estimates, even when it's irrelevant.",
    explanation:
      "Tell someone the Ganges River is 2,000 miles long before asking them to estimate the Nile's length, and their guess will be lower than if you'd said the Ganges is 5,000 miles — even though the Ganges has nothing to do with the Nile. Anchoring affects salary negotiations, price perception, and judicial sentencing. The counteraction: generate your own estimate before encountering external figures, and be especially suspicious of the first number offered in any negotiation.",
    essays: ["anchoring"],
  },
  {
    id: "loss-aversion",
    name: "Loss Aversion",
    domain: "Psychology",
    tagline: "Losses tend to loom larger than equivalent gains — reliably in some settings, less so in others.",
    explanation:
      "Kahneman and Tversky's finding: the pain of losing $100 is roughly equivalent to the pleasure of winning $200. This asymmetry helps explain why people hold losing investments too long (selling would make the loss real), avoid risks that are actually favorable (the downside looms too large), and respond to framing (presenting something as avoiding a loss rather than achieving a gain makes it feel more urgent). How robust the effect is has become genuinely contested — the careful version is that it's contingent, holding up strongly in some settings (the disposition effect, sunk costs) and weakly or not at all in others. Knowing about it doesn't eliminate it; it just makes it visible.",
    essays: ["loss-aversion"],
  },

  // Epistemology
  {
    id: "base-rates",
    name: "Base Rates",
    domain: "Epistemology",
    tagline: "The prior probability of an event, before considering specific evidence.",
    explanation:
      "When a startup founder says their company will be worth $1 billion, the right starting place isn't enthusiasm or skepticism — it's the base rate: what fraction of startups actually reach that outcome? The specific evidence about this particular team and idea then updates that prior. Starting without a base rate is one of the most common sources of overconfidence in forecasting, investing, and career planning. The base rate is not the final answer — it's the right starting place.",
  },
  {
    id: "regression-to-mean",
    name: "Regression to the Mean",
    domain: "Epistemology",
    tagline: "Extreme measurements tend to be followed by less extreme ones, regardless of what you do.",
    explanation:
      "The student who scored highest on the first test is likely to score somewhat lower on the next — not because they got worse, but because exceptional performance has a luck component that doesn't replicate. This explains why praising good performance seems to make things worse (they regress toward average regardless) and why punishment after bad performance seems to make things better (they regress toward average regardless). The failure to account for regression to the mean produces an enormous amount of false learning from experience.",
    essays: ["decision-quality"],
  },
  {
    id: "fermi-estimation",
    name: "Fermi Estimation",
    domain: "Epistemology",
    tagline: "Estimate any unknown quantity by building it from simpler, knowable pieces.",
    explanation:
      "Enrico Fermi could estimate the number of piano tuners in Chicago from population, piano ownership rates, and tuning frequency — each step an educated guess, but the product a reasonable estimate. The point isn't precision: a Fermi estimate within an order of magnitude is almost always more useful than refusing to estimate. The process reveals which assumptions matter most and which ones barely affect the answer. Develop calibrated reference points — world population is 8 billion, US GDP is $26 trillion — and you can anchor estimates on almost any question.",
    essays: ["orders-of-magnitude"],
  },
];

export const domains = Array.from(new Set(models.map((m) => m.domain)));
