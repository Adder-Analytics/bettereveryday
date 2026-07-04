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
    tagline: "Before a major decision, declare it already failed — then write the history of how.",
    explanation:
      "Psychologist Gary Klein's technique (HBR, 2007) for bypassing the optimism that makes us underweight failure: don't ask what could go wrong — announce that the plan has already failed, spectacularly, and have everyone independently write the story of why. The tense is the active ingredient. A possibility gets debated, and the plan's author is a motivated lawyer; a certainty gets explained, and explaining is something people are measurably better at — Mitchell, Russo & Pennington (1989) found that 'prospective hindsight,' imagining an event as having already occurred, raises the ability to correctly identify reasons for future outcomes by about 30%. In a group it does a second job Kahneman calls its main virtue: it legitimizes doubt — once the plan is declared dead, finding flaws stops being disloyalty and becomes the way to look smart, so the sharpest reservations finally surface. The pre-mortem doesn't mean abandoning the decision; plans should survive their funeral, modified. The output that matters is the triage: each imagined cause of death becomes a plan change made now while it's cheap, a tripwire set for later, or a risk accepted with open eyes. The pre-mortem room on this site runs the whole exercise, solo, in about twenty minutes.",
    essays: ["decision-quality", "hold-the-funeral-first"],
  },
  {
    id: "tripwires",
    name: "Tripwires",
    domain: "Decisions",
    tagline: "Decide in advance what would make you stop and re-decide — an observable signal and a date, set while you're calm.",
    explanation:
      "Van Halen's touring contract demanded a backstage bowl of M&Ms with the brown ones removed — not decadence but a detector: the clause was buried mid-contract, so brown M&Ms in the bowl meant the venue hadn't read the document that kept nine trucks of rigging from killing someone, and the band knew to line-check everything. That's a tripwire, in Chip and Dan Heath's coinage: a cheap, observable signal chosen in advance that means stop and reconsider — the fuel light that interrupts you at the threshold you set while calm, so you don't have to monitor the gauge or trust the moment's judgement. Annie Duke's version for the quitting problem, kill criteria, gives the recipe: a good tripwire is a state and a date. Not 'if it isn't working we'll rethink' — 'working' renegotiates itself in the moment and that clause has never fired — but 'if we're under 100 paying users on March 1, we stop.' The state must be observable enough that you can't argue with it; the date must be a real day on which you're obligated to look, which means it belongs in a calendar, not a memory. The cautionary case is the 1996 Everest disaster: the turnaround time — a textbook tripwire — was championed by Rob Hall, who then crossed his own line under summit fever and died descending, while the three clients who turned around on schedule survived, unremembered. The person crossing a tripwire is never the person who set it, so build it to outrank your future self: written down, dated, delivered by something that doesn't care how the plan feels that morning. Structurally it's an implementation intention pointed at reconsidering rather than doing — and the pre-mortem is where the signals worth watching come from.",
    essays: ["hold-the-funeral-first"],
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
  {
    id: "narrow-framing",
    name: "Narrow Framing",
    domain: "Decisions",
    tagline: "Most decisions are framed as 'whether or not' — and the framing quietly throws away every option you didn't name.",
    explanation:
      "Chip and Dan Heath's central finding in Decisive: the most common decision error happens before any analysis, in how the choice is posed. 'Should I quit my job or not?' hides the third, fourth, and fifth options — negotiate, transfer, take a sabbatical, stay and start something on the side. A 'whether or not' question has you weighing a single path against nothing, when you should be weighing it against the alternatives you haven't bothered to find. The tell is the word 'whether,' or any choice that has exactly two sides. The fix is mechanical: force yourself to generate at least one more real option before you decide, ask 'what would I do if this option vanished?', and look for someone who has already solved this exact problem. Widening the frame costs minutes and routinely changes the answer.",
    essays: ["whether-or-not"],
  },
  {
    id: "self-distancing",
    name: "Self-Distancing",
    domain: "Decisions",
    tagline: "You reason more wisely about other people's problems than your own — so step outside your own to decide.",
    explanation:
      "Two findings, pointing the same way. George Loewenstein's hot–cold empathy gap: in a 'hot' visceral state — fear, anger, infatuation, the panic after bad news — we systematically overweight the present feeling and can't model the calm self who has to live with the choice (and, once calm, can't quite believe we felt that way). And Solomon's paradox, named for the wise king who ruined his own house: Igor Grossmann and Ethan Kross found people reason more wisely about a friend's dilemma than an identical one of their own — and that the gap closes when they take distance from themselves. The practical tools are just ways to manufacture that distance. Temporal distance: how will this look in ten minutes, ten months, ten years? (Suzy Welch's 10/10/10 — the ten-minute pang usually shrinks against the ten-year view, which is exactly the recalibration a hot state blocks.) Social distance: what would I tell a friend in this spot, or what would the person I want to be do here? A simple cooling-off period does the same work by letting the hot state pass. The honest caveat runs the other way, though: distance is for stripping the visceral *overweighting*, not for numbing a feeling that is real information. 'It won't matter in ten years' flattens almost everything, and can become a way to talk yourself out of a problem worth acting on now. Use it on choices you'll have to live with once you're calm; don't use it to explain away the calm signal itself.",
    essays: ["advice-you-dont-take"],
  },
  {
    id: "implementation-intentions",
    name: "Implementation Intentions",
    domain: "Decisions",
    tagline: "A decision changes nothing until it becomes an action — and an 'if-then' plan is what reliably gets it there.",
    explanation:
      "Peter Gollwitzer's finding, and one of the most replicated in behavioral science: the gap between deciding to do something and actually doing it is closed less by motivation than by a plan with a trigger in it. Take the intention and rewrite it as an if-then — 'When [specific situation] happens, I will [specific action]' — and you hand control of the behavior from your distractible in-the-moment self to the situation itself. Across 94 studies and more than 8,000 people, forming that plan produced a medium-to-large increase in follow-through (about d = 0.65) over holding the same goal without one. The specificity is the active ingredient: a concrete cue — a time, a place, an event — fires the action almost automatically, where a vague 'I'll get to it' never becomes a cue at all. The Heath brothers' 'tripwire' is the same tool pointed the other way: an if-then that triggers reconsidering ('if the market hits 10% digital, we revisit this') rather than doing — so the two together cover both ways a decision dies after it's made, never started or never revisited. The honest caveat runs in two directions: an if-then helps most when the obstacle is starting, remembering, or catching a narrow window, and it's weak against a goal you don't actually want — there the problem is the wanting, not the planning — while a plan welded to one rigid cue can blind you to a better move, which is exactly why you set the tripwire alongside it.",
    essays: ["deciding-and-doing"],
  },

  // Systems Thinking
  {
    id: "feedback-loops",
    name: "Feedback Loops",
    domain: "Systems",
    tagline: "Systems regulate or amplify themselves through circular causation.",
    explanation:
      "A thermostat is a negative feedback loop: output (temperature) feeds back to reduce the driver (heating). A microphone near a speaker is a positive feedback loop: output (sound) amplifies the input, producing a screech. Understanding which type is operating predicts whether a system will seek equilibrium or spiral. Most healthy systems rely on negative feedback to self-correct. Most crises involve positive feedback loops that weren't noticed until they were hard to stop. The same lens explains why experience makes some people better and merely makes others confident: learning is a feedback loop, and it only closes when your output — a prediction, a decision — comes back scored, quickly and honestly. Robin Hogarth called environments that do this 'kind' (chess, golf, weather forecasting) and those that don't — feedback delayed, noisy, missing, or misleading — 'wicked' (hiring, strategy, most judgement calls that matter). In a wicked environment the loop that closes isn't accuracy but confidence: outcomes arrive late and garbled, memory rewrites the prediction to fit them, and each repetition amplifies certainty instead of correcting it — a positive feedback loop wearing the costume of experience. The fix is structural, not motivational: build the missing negative loop yourself, by writing forecasts down in advance and scheduling the moment reality grades them.",
    essays: ["experience-doesnt-teach"],
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
      "When a startup founder says their company will be worth $1 billion, the right starting place isn't enthusiasm or skepticism — it's the base rate: what fraction of startups actually reach that outcome? The specific evidence about this particular team and idea then updates that prior. Starting without a base rate is one of the most common sources of overconfidence in forecasting, investing, and career planning. The base rate is not the final answer — it's the right starting place. The classic demonstration of how badly we neglect it: a test that's 99% accurate, for a disease 1 person in 1,000 has, comes back positive — and the chance you're actually sick is about 9%, not 99%, because the rare true cases are swamped by false positives drawn from the huge healthy majority. Most people, including most doctors asked this exact question, are off by a factor of ten. The cure is Gerd Gigerenzer's: stop thinking in percentages and count a concrete crowd — natural frequencies make the answer something you can simply tally. The hard part isn't the arithmetic but choosing the right reference class and an honest prior; a confident wrong base rate produces a confident wrong answer — that upstream judgement is its own model, the Outside View. The base-rate trainer on this site is a place to practise updating evidence against the prior — and to find out whether you systematically land too high.",
    essays: ["how-much-should-this-change-your-mind"],
  },
  {
    id: "outside-view",
    name: "Outside View",
    domain: "Epistemology",
    tagline: "Forecast from what happened to everyone who tried this kind of thing — not from the story of your attempt.",
    explanation:
      "Kahneman's names for the two ways to predict: the inside view builds the forecast from your case's particulars — the plan, the team, the visible progress — while the outside view asks what happened, on average, to everyone who attempted this class of thing, and starts the forecast there. The inside view feels more responsible, because your specific information is real; but that information is mostly a plan, and a plan is a story about the best case — the surprises that will actually sink it are precisely the things not in the story. The outside view has already counted them: every surprise that wrecked a similar case is baked into how the class turned out. The measured gap is the planning fallacy — students predicting 34 days and taking 55, nine in ten megaprojects over budget, newlyweds who correctly recite the ~50% divorce rate and put their own odds at zero. The mechanical form is reference-class forecasting: pick the class your case belongs to, take its actual outcome distribution as your starting point, then let the particulars argue for a modest, evidence-backed adjustment. The genuinely hard judgement is choosing the class — start broad, narrow only as far as measured differences take you (never with adjectives), reject folklore rates you can't source, and remember a class of one is not a class. And the humbling coda, from Kahneman's own curriculum project: knowing about the inside view doesn't protect you from it, so the lookup has to be a mandatory procedure — a checklist step before commitment, not a virtue you hope to remember. The base-rate trainer's pick-the-prior mode exists to drill exactly this choice.",
    essays: ["nobody-thinks-theyre-the-base-rate"],
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
    id: "calibration",
    name: "Calibration",
    domain: "Epistemology",
    tagline: "A probability is only honest if it comes true at the rate it claims — and most people's don't.",
    explanation:
      "When a calibrated person says they're 90% sure, they're right about nine times in ten; when they say 70%, about seven. Almost nobody starts out this way. The near-universal default is overconfidence — people's 90% confidence intervals contain the true answer closer to half the time, and their 'certainties' fail often enough to matter. What makes calibration worth singling out is that, unlike most biases, it's quickly and measurably trainable: Douglas Hubbard found that most people reach near-perfect calibration within about half a day of practice with immediate feedback, and being well-calibrated is the trait that most distinguishes Philip Tetlock's superforecasters. The mechanics are simple — put a number on your uncertainty, check it against reality, and repeat until the feeling of '90% sure' actually behaves like 90%. The classic tool for catching your own overconfidence is the equivalent bet: would you rather win on your stated range, or on a gamble with the same stated odds? If you'd take the gamble, your confidence was inflated. The honest caveat: calibration on checkable trivia is a warm-up. Real decisions are messier and feedback is slow or never arrives, which is exactly why a decision journal — write the probability down before the outcome — is the only way to keep score on the bets that count.",
    essays: ["your-ninety-percent", "experience-doesnt-teach"],
  },
  {
    id: "fermi-estimation",
    name: "Fermi Estimation",
    domain: "Epistemology",
    tagline: "Estimate any unknown quantity by building it from simpler, knowable pieces.",
    explanation:
      "Enrico Fermi could estimate the number of piano tuners in Chicago from population, piano ownership rates, and tuning frequency — each step an educated guess, but the product a reasonable estimate. It works because the errors in independent guesses tend to point in different directions and partly cancel, so the product lands closer than any single guess would. The point isn't precision: a Fermi estimate within an order of magnitude is almost always more useful than refusing to estimate. The process also reveals which assumptions matter most and which ones barely affect the answer. Develop calibrated reference points — world population is 8 billion, US GDP is $26 trillion — and you can anchor estimates on almost any question. It's a trainable skill: the estimation trainer on this site is a place to practise it.",
    essays: ["orders-of-magnitude", "guessing-on-purpose"],
  },
];

export const domains = Array.from(new Set(models.map((m) => m.domain)));
