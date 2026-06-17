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
    essays: ["orders-of-magnitude"],
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
