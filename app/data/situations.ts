import { models } from "./models";
import { posts } from "./posts";
import { notes } from "./notes";

/**
 * A "situation" is a moment in real life — a decision you're in, a number
 * someone just put in front of you — paired with the handful of models worth
 * reaching for in it, and the specific move each one prompts *here*.
 *
 * The models page is browse-by-concept: useful once you already know which
 * idea you need. This is the other direction — browse-by-moment — so the
 * reference can be used at the point of need, when you can't yet name the tool.
 *
 * Each model/essay/note is referenced by id/slug so titles resolve from the
 * source data and can't drift; an unknown reference throws at build time (see
 * resolveSituation), the same throw-on-unknown discipline threads.ts uses.
 */
export type SituationModel = {
  /** Must match an id in models.ts. */
  id: string;
  /** The concrete move this model prompts in *this* situation. */
  move: string;
};

export type Situation = {
  id: string;
  /** The moment, in the second person — "You're about to…". */
  title: string;
  /** One line setting the scene: what it feels like to be here. */
  scene: string;
  /** The single operative question to ask yourself in this situation. */
  question: string;
  models: SituationModel[];
  /** Slugs of essays that go deeper on this situation. */
  essays?: string[];
  /** Slugs of reading notes worth pairing with it. */
  notes?: string[];
};

export const situations: Situation[] = [
  {
    id: "one-way-door",
    title: "You're about to commit to something you can't easily undo",
    scene:
      "A job, a house, a surgery, a co-founder, a move across the country. The kind of choice that doesn't come with a back button.",
    question: "Is this door actually one-way — and if so, what would make me regret walking through it?",
    models: [
      {
        id: "reversibility",
        move: "First decide how reversible this really is. Most choices are two-way doors and deserve speed; spend your slow, careful deliberation only on the ones that genuinely don't swing back.",
      },
      {
        id: "pre-mortem",
        move: "Assume it's a year later and this went badly. Write the story of why. Failures you couldn't feel in advance become visible the moment you imagine them as already real.",
      },
      {
        id: "inversion",
        move: "Stop asking how this succeeds. Ask what would guarantee it fails — then check you're not quietly doing those things.",
      },
      {
        id: "margin-of-safety",
        move: "Your estimate of how this goes is probably optimistic. Leave a buffer — of money, time, or exits — big enough to survive being wrong by the amount you usually are.",
      },
      {
        id: "second-order-effects",
        move: "Play it two steps out, not one. The first-order effect is the obvious win; the second order is how everyone and everything around you adapts to it.",
      },
    ],
    essays: ["decision-quality"],
  },
  {
    id: "a-number-appears",
    title: "Someone just put a number in front of you",
    scene:
      "A salary offer, an asking price, a quote, a valuation, a budget, a statistic in an argument. The figure is now in your head whether you wanted it or not.",
    question: "Where did this number come from — and what would I have guessed before I heard it?",
    models: [
      {
        id: "anchoring",
        move: "The first number reframes every number after it, even when it's arbitrary or chosen to move you. You can't un-hear it, so decide your own figure first and argue, on purpose, why theirs is too high and too low.",
      },
      {
        id: "base-rates",
        move: "Set the number against the prior — what's normal for this whole class of thing — not against your gut reaction to it.",
      },
      {
        id: "opportunity-cost",
        move: "The real price isn't the sticker. It's the next-best thing the same money or time could have bought.",
      },
    ],
    essays: ["anchoring"],
  },
  {
    id: "vivid-story",
    title: "A vivid story has you convinced",
    scene:
      "A headline, a cautionary tale, a recent disaster, a friend's bad experience. It feels common and dangerous because you can picture it so clearly.",
    question: "Is this actually common, or just memorable — and how would I really know?",
    models: [
      {
        id: "availability-heuristic",
        move: "Ease of recall isn't frequency. Ask what curated this example into your memory — vividness, repetition, a feed optimized for engagement — then go find the rate instead of trusting the highlight reel.",
      },
      {
        id: "base-rates",
        move: "Look up how often this really happens before deciding how much to fear it. The anecdote is a hypothesis, not a measurement.",
      },
      {
        id: "regression-to-mean",
        move: "An extreme event is, almost by definition, likely to be followed by something less extreme. One dramatic data point is not a trend.",
      },
    ],
    essays: ["availability-heuristic"],
    notes: ["kahneman-inside-view"],
  },
  {
    id: "need-an-estimate",
    title: "You need a number and don't have one",
    scene:
      "How big is this market? What will this cost? Is this even worth attempting? You're tempted to either guess wildly or refuse to guess at all.",
    question: "Can I build this estimate out of pieces I actually know?",
    models: [
      {
        id: "fermi-estimation",
        move: "Decompose the unknown into knowable factors and multiply them. An answer within a factor of ten beats refusing to estimate, and it shows you which assumption the whole thing hinges on.",
      },
      {
        id: "base-rates",
        move: "Start from what's typical for this kind of thing, then adjust for the specifics of your case — not the other way around.",
      },
      {
        id: "anchoring",
        move: "Be suspicious of the first figure anyone offers — including the one already sitting in your own head before you've done any work.",
      },
    ],
    essays: ["guessing-on-purpose", "orders-of-magnitude"],
  },
  {
    id: "judging-a-decision",
    title: "You're judging whether a decision was good",
    scene:
      "Your own call after it paid off or blew up. An investment. A hire. Someone's track record you're being asked to trust.",
    question: "Am I grading the decision, or just the result it happened to get?",
    models: [
      {
        id: "expected-value",
        move: "A good bet can lose and a bad bet can win. Grade the reasoning against what was knowable at the time, not against the outcome the dice produced.",
      },
      {
        id: "regression-to-mean",
        move: "A standout result has a luck component that won't repeat. Don't over-learn from one extreme — the next data point will likely be more ordinary regardless of skill.",
      },
      {
        id: "loss-aversion",
        move: "Watch for the urge to hold a loser until it's 'back to even.' That number is a fact about your purchase price, not about the decision. Ask only whether you'd choose it again today.",
      },
      {
        id: "reversibility",
        move: "A cheap-to-undo choice made fast isn't a mistake just because it missed. For a two-way door, speed was the right call and a wrong outcome is the cost of doing business.",
      },
    ],
    essays: ["decision-quality"],
  },
  {
    id: "designing-incentives",
    title: "You're designing how people will be measured or rewarded",
    scene:
      "A metric, a bonus, a KPI, a quota, a grading rubric, a policy — including the ones you set for yourself, like a daily word count or books-per-year.",
    question: "How could someone hit this number while completely missing the point?",
    models: [
      {
        id: "goodharts-law",
        move: "The moment a measure becomes a target, people optimize the measure, not the goal it stood for. Run a pre-mortem on the gaming before you adopt it, and retire it while it's still working.",
      },
      {
        id: "incentive-structures",
        move: "People do what they're rewarded for — in money, status, or safety — not what they're told. Read the reward you're actually creating, not the behavior you're hoping for.",
      },
      {
        id: "second-order-effects",
        move: "The first-order effect is the metric moving. The second order is everything people quietly stop doing in order to move it.",
      },
    ],
    essays: ["metric-not-the-mission"],
  },
  {
    id: "stubborn-system",
    title: "You're trying to change a system that won't budge",
    scene:
      "An organization, a market, a household habit, a stuck process. You're pushing hard and the effort isn't translating into change.",
    question: "Am I pushing where the system actually moves — or just where it's easiest to push?",
    models: [
      {
        id: "leverage-points",
        move: "Adjusting flows and quantities is low leverage. Changing the rules, the goals, and the paradigm is high leverage — and usually somewhere less obvious than where everyone is pushing.",
      },
      {
        id: "feedback-loops",
        move: "Find out whether you're fighting a loop that self-corrects (it will undo you) or feeding one that amplifies (it will run away from you). Most stuck systems are held in place by a loop, not a wall.",
      },
      {
        id: "incentive-structures",
        move: "If people keep doing the thing you're trying to stop, look at what they're rewarded for. The behavior is usually rational given an incentive you haven't changed.",
      },
      {
        id: "second-order-effects",
        move: "Before you intervene, ask 'and then what?' The thing you change will provoke a response, and the response is often the part that actually matters.",
      },
    ],
    essays: ["second-order-thinking"],
  },
  {
    id: "long-haul",
    title: "You're deciding where time or money goes for the long haul",
    scene:
      "Savings, a skill, a habit, a career bet, what to read. The payoff is years away and today's choice barely registers.",
    question: "What will be worth far more in ten years than it looks like today?",
    models: [
      {
        id: "compound-interest",
        move: "Early investment looks like nothing and is worth the most. The curve stays flat-looking right up until it isn't, so the move is to start now and protect the streak.",
      },
      {
        id: "opportunity-cost",
        move: "Every yes is a no to the next-best use of the same hour or dollar. Choose deliberately what you're willing to be bad at so the thing that compounds gets your time.",
      },
      {
        id: "margin-of-safety",
        move: "Don't optimize so tightly that one bad year ends the game. Survival is the precondition for compounding — you only collect the long-run payoff if you're still in it.",
      },
    ],
    essays: ["money-math", "compounding-improvements"],
    notes: ["housel-tails"],
  },
  {
    id: "deciding-while-hot",
    title: "You're about to decide in the grip of a strong feeling",
    scene:
      "Anger with your thumb over Send. The panic after bad news. Infatuation, or the fear of missing out while a price runs away from you. The sting of a sunk cost you can't stand to write off. The call feels urgent and obvious right now.",
    question:
      "Would the calm version of me — or a friend I trust — make this same call, or am I acting on a feeling that won't be here in a week?",
    models: [
      {
        id: "self-distancing",
        move: "Get outside the hot state before you act. Run 10/10/10: how will this look in ten minutes, ten months, ten years? Then ask what you'd tell a friend in exactly this spot. If nothing forces your hand in the next hour, sleep on it — the feeling that's deciding for you is usually the part that won't survive the night.",
      },
      {
        id: "loss-aversion",
        move: "A hot decision is often a fear of loss wearing a disguise. Name precisely what you're afraid of losing. If it's a sunk cost — money, time, face already gone — that's a fact about the past, not a reason. Ask only whether you'd choose this fresh today.",
      },
      {
        id: "reversibility",
        move: "If this is a two-way door, the cooling-off costs you almost nothing — so take it. If it's one-way, that settles it: an irreversible choice is exactly the one never to make while the feeling is loudest.",
      },
      {
        id: "base-rates",
        move: "The feeling is telling you a vivid story about how this goes. Set it against what usually happens to people who make this move when they're this worked up. Go find the rate, or ask someone who's been here, before you trust the story.",
      },
    ],
    essays: ["advice-you-dont-take", "decision-quality"],
    notes: ["kahneman-inside-view"],
  },
  {
    id: "weigh-it-through",
    title: "Any other decision — weigh it through",
    scene:
      "It doesn't fit a neat category. Two jobs, a hard conversation, whether to move, whether to commit — just a real choice you keep turning over. Start here and work it like any good decision.",
    question: "What am I actually choosing between — and what would have to be true for this to be the right call?",
    models: [
      {
        id: "narrow-framing",
        move: "Notice if you've framed this as 'whether or not.' That framing hides every option you didn't name. Before anything else, write down at least one more real choice — and ask who has already solved this exact problem.",
      },
      {
        id: "base-rates",
        move: "Set the story you're telling yourself against what usually happens. What's the base rate for people who've made this move? Go find it, or ask someone who has, before you trust your gut on how it'll go.",
      },
      {
        id: "expected-value",
        move: "Weigh each option by how likely each outcome is, not how vivid it is. A small chance of a big loss and a vivid worst case are not the same thing — name the real probabilities, even roughly.",
      },
      {
        id: "self-distancing",
        move: "Get some distance before you commit. How will this look in ten months, ten years? What would you tell a friend who described this exact choice to you? The advice you'd give them is usually clearer than the one you're giving yourself.",
      },
      {
        id: "pre-mortem",
        move: "Assume it's a year out and this went badly. Write the story of why — then set the tripwire: the specific thing that, if you saw it, would tell you to stop and reconsider rather than ride it down.",
      },
      {
        id: "reversibility",
        move: "Ask whether this is a one-way or two-way door. If you can undo it cheaply, decide fast and learn by moving; agonizing over a reversible choice is its own kind of mistake. Save the slow, careful deliberation for the doors that don't swing back.",
      },
    ],
    essays: ["whether-or-not", "decision-quality"],
  },
  {
    id: "make-it-happen",
    title: "You've made the call — now make sure it happens",
    scene:
      "The decision is made, and it was the right one. But 'decided' and 'done' are different things, and the week after a decision is where most of them quietly die — never started, or never revisited when something changed.",
    question:
      "What is the first concrete move, exactly when and where will I make it — and what would tell me to stop and reconsider?",
    models: [
      {
        id: "implementation-intentions",
        move: "Don't leave it at 'I'll get to it.' Write the if-then: when X happens — a specific time, place, or event you'll actually notice — I will do Y. Make Y the smallest first step you could finish this week, and hand it to the cue instead of to your future, busier self.",
      },
      {
        id: "pre-mortem",
        move: "Set the tripwire before you start. Decide now the one signal that would tell you to stop and reconsider rather than ride it down — 'if I see X, I revisit this.' It's an if-then aimed at the reconsidering, and it keeps a decision that's slowly going wrong from coasting past the moment you should have changed course.",
      },
      {
        id: "reversibility",
        move: "If the first step is cheap and easy to undo, take it now rather than planning it perfectly. Action creates information that no amount of deliberation can — and for a two-way door, starting is how you find out whether you were right.",
      },
    ],
    essays: ["deciding-and-doing", "decision-quality"],
  },
];

const kindLabels = { essay: "Essay", model: "Model", note: "Reading note" } as const;

export type ResolvedSituationModel = {
  id: string;
  name: string;
  tagline: string;
  href: string;
  move: string;
};

export type ResolvedReference = {
  kind: "essay" | "note";
  label: string;
  title: string;
  href: string;
};

export type ResolvedSituation = {
  id: string;
  title: string;
  scene: string;
  question: string;
  models: ResolvedSituationModel[];
  references: ResolvedReference[];
};

export function resolveSituation(situation: Situation): ResolvedSituation {
  const resolvedModels = situation.models.map((sm): ResolvedSituationModel => {
    const model = models.find((m) => m.id === sm.id);
    if (!model) {
      throw new Error(`Situation "${situation.id}" references unknown model "${sm.id}"`);
    }
    return {
      id: model.id,
      name: model.name,
      tagline: model.tagline,
      href: `/models#${model.id}`,
      move: sm.move,
    };
  });

  const references: ResolvedReference[] = [];
  for (const slug of situation.essays ?? []) {
    const post = posts.find((p) => p.slug === slug);
    if (!post) {
      throw new Error(`Situation "${situation.id}" references unknown essay "${slug}"`);
    }
    references.push({
      kind: "essay",
      label: kindLabels.essay,
      title: post.title,
      href: `/writing/${post.slug}`,
    });
  }
  for (const slug of situation.notes ?? []) {
    const note = notes.find((n) => n.slug === slug);
    if (!note) {
      throw new Error(`Situation "${situation.id}" references unknown note "${slug}"`);
    }
    references.push({
      kind: "note",
      label: kindLabels.note,
      title: note.title,
      href: `/notes#${note.slug}`,
    });
  }

  return {
    id: situation.id,
    title: situation.title,
    scene: situation.scene,
    question: situation.question,
    models: resolvedModels,
    references,
  };
}

/**
 * Flat, fully-resolved view of every situation — the shape the decision
 * worksheet (`/decide`) renders. Reuses resolveSituation so the worksheet, the
 * playbook, and search all draw from the same curated source and can't drift.
 */
export function getWorksheetSituations() {
  return situations.map((s) => {
    const r = resolveSituation(s);
    return {
      id: r.id,
      title: r.title,
      scene: r.scene,
      question: r.question,
      models: r.models.map((m) => ({
        id: m.id,
        name: m.name,
        move: m.move,
        href: m.href,
      })),
      references: r.references.map((ref) => ({
        label: ref.label,
        title: ref.title,
        href: ref.href,
      })),
    };
  });
}

/**
 * Reverse lookup: which situations call for this model. Lets the models page
 * show "Reach for this when…" without the model having to declare anything in
 * the situation's direction — declared once in `situations`, surfaced in both
 * directions, can't drift.
 */
export function getSituationsForModel(id: string): { id: string; title: string }[] {
  return situations
    .filter((s) => s.models.some((m) => m.id === id))
    .map((s) => ({ id: s.id, title: s.title }));
}
