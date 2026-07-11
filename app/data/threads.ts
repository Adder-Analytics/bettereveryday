import { posts } from "./posts";
import { models } from "./models";
import { notes } from "./notes";

/**
 * A "thread" is a curated reading path through existing content — an ordered
 * sequence of essays, models, and notes around one theme. Steps reference
 * content by slug/id so titles are resolved from the source data and can't
 * drift; an unknown reference throws at build time (see resolveThread).
 */
export type ThreadStep =
  | { kind: "essay"; slug: string; why: string }
  | { kind: "model"; id: string; why: string }
  | { kind: "note"; slug: string; why: string };

export type Thread = {
  id: string;
  title: string;
  tagline: string;
  intro: string;
  steps: ThreadStep[];
};

export type ResolvedStep = {
  kind: ThreadStep["kind"];
  label: string;
  title: string;
  href: string;
  why: string;
};

export const threads: Thread[] = [
  {
    id: "the-long-game",
    title: "The Long Game",
    tagline: "Why time beats timing — in money, skill, and habit.",
    intro:
      "The idea this site keeps returning to: small advantages, repeated, become enormous — and the payoff stays invisible until it suddenly isn't. Read in this order and the personal finance and the self-discipline turn out to be the same equation.",
    steps: [
      {
        kind: "essay",
        slug: "compounding-improvements",
        why: "The 1% math, and why the early months feel like nothing is happening.",
      },
      {
        kind: "essay",
        slug: "money-math",
        why: "The same equation, pointed at a retirement account instead of a habit.",
      },
      {
        kind: "essay",
        slug: "inflation-silent-tax",
        why: "The force that's been quietly compounding against you the whole time.",
      },
      {
        kind: "essay",
        slug: "plateau-boredom",
        why: "What it takes to stay in long enough for the compound to actually arrive.",
      },
      {
        kind: "essay",
        slug: "the-compound-needs-evidence",
        why: "How to see the invisible progress without inventing it — the day is noise, the trend is the signal.",
      },
      {
        kind: "model",
        id: "compound-interest",
        why: "The one-screen version of the whole thread, to keep.",
      },
    ],
  },
  {
    id: "deciding-well",
    title: "Deciding Well",
    tagline: "How to choose when you can't see the outcome yet.",
    intro:
      "Most consequential choices get judged by how they happened to turn out. These pieces build the opposite habit — judging the decision by the reasoning behind it, and reasoning past the obvious first step.",
    steps: [
      {
        kind: "essay",
        slug: "decision-quality",
        why: "Separating a good decision from a good outcome — the core move.",
      },
      {
        kind: "essay",
        slug: "your-ninety-percent",
        why: "Before you trust your own forecast: is your “90% sure” worth anything? Usually not — but it's fixable.",
      },
      {
        kind: "essay",
        slug: "experience-doesnt-teach",
        why: "And why the fix never happens on its own: weather forecasters are calibrated because the rain grades them daily — your decisions get no such courtesy, so the scoreboard has to be built.",
      },
      {
        kind: "essay",
        slug: "second-order-thinking",
        why: "“And then what?” The question that catches most avoidable mistakes.",
      },
      {
        kind: "essay",
        slug: "metric-not-the-mission",
        why: "What happens when the measure you chose quietly becomes the goal.",
      },
      {
        kind: "essay",
        slug: "hold-the-funeral-first",
        why: "Then stress-test the call before you commit: declare it already failed, explain why — and set the tripwires that will tell you when to stop.",
      },
      {
        kind: "model",
        id: "pre-mortem",
        why: "The one-screen version of the funeral: assume it failed, write the history, triage the causes.",
      },
      {
        kind: "model",
        id: "tripwires",
        why: "And the guard it leaves behind: a state and a date, set while you're calm, that outranks your future self.",
      },
      {
        kind: "essay",
        slug: "the-honest-number-comes-after",
        why: "The funeral quietly deflates your confidence toward the truth — so log the plan as a forecast now, while the number is honest, and let the journal grade it later.",
      },
      {
        kind: "essay",
        slug: "the-plan-was-never-tried",
        why: "Then, on review day, the question that has to come before any verdict on your judgement: did the plan ever actually get tried?",
      },
      {
        kind: "essay",
        slug: "the-flip-point",
        why: "And the mechanic for the either/or call itself: stop arguing the exact odds, find the probability where the choice flips, and just ask which side you're on — where your calibration finally buys you something.",
      },
      {
        kind: "model",
        id: "reversibility",
        why: "Spend your deliberation where the door only swings one way.",
      },
    ],
  },
  {
    id: "clear-thinking",
    title: "Not Fooling Yourself",
    tagline: "A small kit for catching your own errors.",
    intro:
      "The hardest reasoning errors to catch are your own, because they don't feel like errors from the inside. These build the reflexes: check the scale, check the base rate, distrust the vivid story, and notice that knowing about a bias does almost nothing to protect you from it.",
    steps: [
      {
        kind: "essay",
        slug: "orders-of-magnitude",
        why: "Number sense as a working defense against confident nonsense.",
      },
      {
        kind: "essay",
        slug: "guessing-on-purpose",
        why: "And how to produce a number of your own when you don't have one — decomposition, and why rough parts beat a confident whole.",
      },
      {
        kind: "essay",
        slug: "availability-heuristic",
        why: "Why the vivid story misleads — and how the news environment weaponizes it.",
      },
      {
        kind: "essay",
        slug: "anchoring",
        why: "Why the first number you hear hijacks every estimate after it, even a random one.",
      },
      {
        kind: "note",
        slug: "kahneman-inside-view",
        why: "Why awareness of a bias, on its own, changes almost nothing.",
      },
      {
        kind: "model",
        id: "calibration",
        why: "The cheerful exception to that rule — the one bias you really can train away, in an afternoon.",
      },
      {
        kind: "essay",
        slug: "loss-aversion",
        why: "How to hold a famous finding that turns out to be genuinely contested.",
      },
      {
        kind: "essay",
        slug: "how-much-should-this-change-your-mind",
        why: "The vivid story is evidence — but how much should it actually move you? Why a 99%-accurate test can still mean a 9% chance, and how to count your way out of the trap.",
      },
      {
        kind: "model",
        id: "base-rates",
        why: "Start from the prior probability, then let the specifics update it.",
      },
      {
        kind: "essay",
        slug: "nobody-thinks-theyre-the-base-rate",
        why: "But where does the prior come from? The inside view, the planning fallacy, and how to choose a reference class honestly — the judgement upstream of all the arithmetic.",
      },
      {
        kind: "model",
        id: "outside-view",
        why: "The one-screen version: forecast from the record of everyone who tried, not from the story of your attempt.",
      },
      {
        kind: "model",
        id: "regression-to-mean",
        why: "Why so much hard-won experience teaches exactly the wrong lesson.",
      },
    ],
  },
  {
    id: "getting-good",
    title: "The Long Apprenticeship",
    tagline: "What it actually takes to get good at something over years.",
    intro:
      "The pieces on practice, attention, and the long boring middle — for anyone trying to build one real skill rather than collect new ones. The connecting thread is that depth is uncomfortable, invisible for a long time, and worth it.",
    steps: [
      {
        kind: "essay",
        slug: "deliberate-practice",
        why: "Why most practice doesn't compound, and what the kind that does looks like.",
      },
      {
        kind: "essay",
        slug: "deep-work-is-a-skill",
        why: "Focus as a muscle that's atrophied — not a setting you toggle off.",
      },
      {
        kind: "essay",
        slug: "plateau-boredom",
        why: "The boredom that mastery is built on the far side of.",
      },
      {
        kind: "essay",
        slug: "reading-system",
        why: "Reading for synthesis instead of coverage — depth over a finished count.",
      },
      {
        kind: "note",
        slug: "klinkenborg-sentences",
        why: "Where most writing problems actually live, once you go looking.",
      },
    ],
  },
];

/**
 * Reverse lookup: which reading paths include this essay, and where in the
 * sequence. Lets an essay page show "part of <path> (step N of M)" without the
 * thread having to declare anything in the essay's direction — declared once in
 * `threads`, surfaced in both directions, can't drift.
 */
export function getThreadsForEssay(
  slug: string
): { id: string; title: string; step: number; total: number }[] {
  return threads.flatMap((thread) => {
    const i = thread.steps.findIndex(
      (s) => s.kind === "essay" && s.slug === slug
    );
    if (i === -1) return [];
    return [{ id: thread.id, title: thread.title, step: i + 1, total: thread.steps.length }];
  });
}

const kindLabels: Record<ThreadStep["kind"], string> = {
  essay: "Essay",
  model: "Model",
  note: "Reading note",
};

export type ResolvedThread = Omit<Thread, "steps"> & { steps: ResolvedStep[] };

export function resolveThread(thread: Thread): ResolvedThread {
  const steps = thread.steps.map((step): ResolvedStep => {
    if (step.kind === "essay") {
      const post = posts.find((p) => p.slug === step.slug);
      if (!post) throw new Error(`Thread "${thread.id}" references unknown essay "${step.slug}"`);
      return { kind: "essay", label: kindLabels.essay, title: post.title, href: `/writing/${post.slug}`, why: step.why };
    }
    if (step.kind === "model") {
      const model = models.find((m) => m.id === step.id);
      if (!model) throw new Error(`Thread "${thread.id}" references unknown model "${step.id}"`);
      return { kind: "model", label: kindLabels.model, title: model.name, href: `/models#${model.id}`, why: step.why };
    }
    const note = notes.find((n) => n.slug === step.slug);
    if (!note) throw new Error(`Thread "${thread.id}" references unknown note "${step.slug}"`);
    return { kind: "note", label: kindLabels.note, title: note.title, href: `/notes#${note.slug}`, why: step.why };
  });
  return { ...thread, steps };
}
