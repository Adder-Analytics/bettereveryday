/**
 * The question bank behind the estimation trainer (`/estimate`).
 *
 * The site already has a model (Fermi Estimation) and an essay (How to Think in
 * Orders of Magnitude) about producing a defensible number for a quantity you
 * have no idea about. What it never had was a place to *do* it — the same gap the
 * calibration trainer filled for confidence. This is that piece.
 *
 * Two modes, mirroring the two halves of the skill:
 *   - `FermiProblem` — decompose. A question you can't answer directly is broken
 *     into a chain of factors you *can* estimate; multiply (and divide) them and
 *     the rough product lands surprisingly close. The trainer asks for a gut
 *     guess first, then walks the chain, so you can watch the decomposition beat
 *     the gut — the whole point of the method.
 *   - `EstimateQuestion` — one-shot. A single order-of-magnitude estimate, scored
 *     by how many factors of ten you were off. Over a round and over a lifetime,
 *     your typical miss shrinks. This is the part that builds the record.
 *
 * Answers are kept timeless and checkable, and each carries a source note — a
 * trainer that grades you against a wrong number is worse than none. Where a
 * figure is inherently fuzzy (how many piano tuners, how many golf balls), the
 * note says so: the target was never the exact value, only the right order of
 * magnitude.
 */

/** One link in a decomposition: a sub-quantity you can estimate, and how it
 *  folds into the running product. The user enters their own value; `reference`
 *  is a reasonable number revealed afterwards so they can see where they were
 *  off. `op` applies to both the entered value and the reference. */
export type Factor = {
  /** The sub-question, in plain words. Phrased to invite a single number. */
  prompt: string;
  /** A reasonable value for this factor, in `unit`. Shown after submitting. */
  reference: number;
  /** Unit shown beside the input (may be empty for a bare fraction or count). */
  unit: string;
  /** How this factor combines into the running product. */
  op: "×" | "÷";
  /** One line of grounding for the reference value. */
  note: string;
};

export type FermiProblem = {
  id: string;
  /** The headline question — something you can't answer head-on. */
  prompt: string;
  /** The true (or best-accepted) answer, in `unit`. */
  answer: number;
  unit: string;
  /** The ordered chain of factors that builds the estimate. */
  factors: Factor[];
  /** What the decomposition reveals — the takeaway, shown with the result. */
  note: string;
  /** Where the answer comes from, and how fuzzy it really is. */
  source: string;
};

export type EstimateQuestion = {
  id: string;
  /** A quantity that spans orders of magnitude — the interesting kind to guess. */
  prompt: string;
  /** The true value, in `unit`. */
  answer: number;
  unit: string;
  /** Shown after answering — the figure and its source. */
  note: string;
};

export const fermiProblems: FermiProblem[] = [
  {
    id: "piano-tuners-chicago",
    prompt: "How many piano tuners work in the Chicago metro area?",
    answer: 100,
    unit: "tuners",
    factors: [
      {
        prompt: "People living in the Chicago metro area",
        reference: 9_000_000,
        unit: "people",
        op: "×",
        note: "The metro area is home to roughly 9 million people.",
      },
      {
        prompt: "People per household",
        reference: 2.5,
        unit: "people",
        op: "÷",
        note: "About 2.5 — so ~3.6 million households.",
      },
      {
        prompt: "One household in how many owns a piano?",
        reference: 30,
        unit: "",
        op: "÷",
        note: "Maybe 1 in 30 today (ownership has fallen for decades) — so ~120,000 pianos.",
      },
      {
        prompt: "Times a piano is tuned per year",
        reference: 1,
        unit: "/year",
        op: "×",
        note: "Roughly once a year for a piano that's actually played.",
      },
      {
        prompt: "Tunings one tuner does in a year",
        reference: 1_000,
        unit: "/year",
        op: "÷",
        note: "~4 a day × ~250 working days ≈ 1,000 — so ~120 tuners.",
      },
    ],
    note: "This is the problem Enrico Fermi made famous. Five rough guesses, each easily wrong by half, and yet their product lands in the right neighbourhood — because the over- and under-estimates tend to cancel.",
    source:
      "There's no exact count. Old phone-directory tallies and piano-technician guild figures for Chicago land roughly between 50 and 200; the classic teaching answer is about 100. The point was never the precise number — only the order of magnitude.",
  },
  {
    id: "heartbeats-lifetime",
    prompt: "How many times does a human heart beat in a long lifetime?",
    answer: 3_000_000_000,
    unit: "beats",
    factors: [
      {
        prompt: "Resting heart rate",
        reference: 70,
        unit: "beats/min",
        op: "×",
        note: "A typical resting rate is 60–80 beats a minute.",
      },
      {
        prompt: "Minutes in an hour",
        reference: 60,
        unit: "min",
        op: "×",
        note: "Exact — a known conversion, not a guess.",
      },
      {
        prompt: "Hours in a day",
        reference: 24,
        unit: "hours",
        op: "×",
        note: "Exact.",
      },
      {
        prompt: "Days in a year",
        reference: 365,
        unit: "days",
        op: "×",
        note: "Exact enough — ignore the leap day.",
      },
      {
        prompt: "Years in a long life",
        reference: 80,
        unit: "years",
        op: "×",
        note: "Roughly a long human lifespan.",
      },
    ],
    note: "Most of the chain is exact conversions; only the first and last factors are real guesses. When most of your factors are known, a Fermi estimate gets tight — here, within a factor of two of the textbook figure.",
    source:
      "Usually quoted as about 2.5–3 billion beats over a long life, varying with heart rate and lifespan.",
  },
  {
    id: "coffee-cups-usa",
    prompt: "How many cups of coffee do Americans drink on a typical day?",
    answer: 400_000_000,
    unit: "cups",
    factors: [
      {
        prompt: "People in the United States",
        reference: 330_000_000,
        unit: "people",
        op: "×",
        note: "About 330 million.",
      },
      {
        prompt: "Fraction who drink coffee on a given day (e.g. 0.6)",
        reference: 0.6,
        unit: "",
        op: "×",
        note: "Around 6 in 10 — a fraction is a perfectly good factor.",
      },
      {
        prompt: "Cups per coffee-drinker per day",
        reference: 2,
        unit: "cups",
        op: "×",
        note: "Two is a reasonable average across light and heavy drinkers.",
      },
    ],
    note: "A three-factor chain, and notice the middle one is a fraction. Factors don't have to be whole counts — 'what share?' and 'how often?' are estimable quantities too.",
    source:
      "The National Coffee Association and others commonly cite Americans drinking on the order of 400 million cups a day.",
  },
  {
    id: "golf-balls-bus",
    prompt: "How many golf balls would fit inside an empty school bus?",
    answer: 500_000,
    unit: "balls",
    factors: [
      {
        prompt: "Interior length of the bus",
        reference: 11,
        unit: "m",
        op: "×",
        note: "A big bus is around 11 m of usable interior length.",
      },
      {
        prompt: "Interior width",
        reference: 2.3,
        unit: "m",
        op: "×",
        note: "About 2.3 m wide inside.",
      },
      {
        prompt: "Interior height",
        reference: 1.9,
        unit: "m",
        op: "×",
        note: "Roughly 1.9 m — together, ~48 cubic metres of space.",
      },
      {
        prompt: "Golf balls that fit in one cubic metre",
        reference: 11_000,
        unit: "/m³",
        op: "×",
        note: "A golf ball is ~43 mm across; with packing gaps, ~11,000 fit in a cubic metre.",
      },
    ],
    note: "A volume problem instead of a population one — but the same move. The hardest factor (balls per cubic metre) is itself a small Fermi estimate you could break down further.",
    source:
      "A classic interview question. Published answers run from about 300,000 to 700,000 depending on the bus and how tightly you pack — anywhere in the hundreds of thousands is a win.",
  },
];

export const estimateQuestions: EstimateQuestion[] = [
  {
    id: "seconds-in-year",
    prompt: "How many seconds are in a year?",
    answer: 31_557_600,
    unit: "seconds",
    note: "About 31.56 million (365.25 days). A famous coincidence: that's very close to π × 10⁷.",
  },
  {
    id: "breaths-per-day",
    prompt: "How many breaths does a person take in a day?",
    answer: 22_000,
    unit: "breaths",
    note: "Around 20,000–25,000 at a resting rate of 12–18 breaths a minute.",
  },
  {
    id: "hairs-head",
    prompt: "How many hairs are on a typical human head?",
    answer: 100_000,
    unit: "hairs",
    note: "Usually 90,000–150,000, varying with hair colour.",
  },
  {
    id: "cells-body",
    prompt: "How many cells are in the human body?",
    answer: 37_000_000_000_000,
    unit: "cells",
    note: "About 37 trillion, by a 2013 estimate — necessarily approximate.",
  },
  {
    id: "trees-earth",
    prompt: "How many trees are there on Earth?",
    answer: 3_000_000_000_000,
    unit: "trees",
    note: "About 3 trillion, from a 2015 Nature study — and roughly 15 billion are lost each year.",
  },
  {
    id: "languages",
    prompt: "How many languages are spoken in the world today?",
    answer: 7_000,
    unit: "languages",
    note: "About 7,000 living languages, though nearly half are endangered.",
  },
  {
    id: "ants-earth",
    prompt: "How many individual ants are alive on Earth?",
    answer: 20_000_000_000_000_000,
    unit: "ants",
    note: "About 20 quadrillion — roughly 2.5 million ants per person — from a 2022 study.",
  },
  {
    id: "people-ever-lived",
    prompt: "How many people have ever been born in all of human history?",
    answer: 117_000_000_000,
    unit: "people",
    note: "About 117 billion births, by the Population Reference Bureau's 2022 estimate.",
  },
  {
    id: "milky-way-stars",
    prompt: "How many stars are in the Milky Way?",
    answer: 200_000_000_000,
    unit: "stars",
    note: "Estimates run from about 100 to 400 billion; 200 billion is a common middle figure.",
  },
  {
    id: "neurons-brain",
    prompt: "How many neurons are in the human brain?",
    answer: 86_000_000_000,
    unit: "neurons",
    note: "About 86 billion, from Suzana Herculano-Houzel's direct counts — not the round '100 billion' often quoted.",
  },
  {
    id: "earths-in-sun",
    prompt: "How many Earths would fit inside the Sun, by volume?",
    answer: 1_300_000,
    unit: "Earths",
    note: "About 1.3 million, by volume.",
  },
  {
    id: "blood-pumped",
    prompt: "How many litres of blood does the heart pump in a day?",
    answer: 7_500,
    unit: "litres",
    note: "Around 7,500 litres (about 2,000 gallons) a day at rest.",
  },
];

/**
 * Fisher–Yates shuffle returning the first `count` items. Pure given a source of
 * randomness; the caller supplies `rand` so selection stays off the
 * server-render path (it only runs on a user gesture in the browser). Shared
 * with the calibration trainer — the same one-place utility.
 */
export { pickRandom } from "./calibration";

/** How many one-shot questions a single round serves up. */
export const ONESHOT_ROUND_SIZE = 8;

/**
 * Absolute error in orders of magnitude: 0 is perfect, 1 means off by a factor
 * of ten, ~0.3 means off by a factor of two. The natural metric for an estimate
 * that only aims to be right within an order of magnitude.
 */
export function logError(estimate: number, answer: number): number {
  if (estimate <= 0 || answer <= 0) return Infinity;
  return Math.abs(Math.log10(estimate / answer));
}

/** The plain "X times off" factor (always ≥ 1), for human-readable feedback. */
export function factorOff(estimate: number, answer: number): number {
  if (estimate <= 0 || answer <= 0) return Infinity;
  return estimate >= answer ? estimate / answer : answer / estimate;
}

/** A verdict on a single estimate, keyed to the order-of-magnitude target. */
export function estimateVerdict(logErr: number): string {
  if (logErr <= 0.3) return "Bang on — within a factor of two.";
  if (logErr <= 0.5) return "Excellent — within a factor of three.";
  if (logErr <= 1) return "Within an order of magnitude — the Fermi target. Good enough to act on.";
  if (logErr <= 2) return "Off by more than ten-fold. A decomposition would likely have caught this.";
  return "Off by more than a hundred-fold — the kind of miss that decomposing is built to prevent.";
}
