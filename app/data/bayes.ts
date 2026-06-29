/**
 * The scenario bank behind the base-rate trainer (`/update`).
 *
 * The site already has a model (Base Rates) and the model is reached for in half
 * the playbook situations — but it never had an essay of its own, and nowhere to
 * *practise* the skill. That's the same gap the calibration and estimation
 * trainers filled for their models; this is the third leg of that triangle.
 *
 * The skill is Bayesian updating: you hold a prior (how common is the thing?),
 * you get a piece of evidence with a known hit-rate and false-alarm rate (a test,
 * an alarm, a symptom), and the question is how far that evidence should move
 * you. Almost everyone moves too far — they fixate on how accurate the test is
 * and forget how rare the thing is, so when the base rate is low even a good
 * test mostly produces false alarms. That single error (base-rate neglect) is
 * behind a startling amount of real-world misjudgement: needless cancer scares,
 * "99%-accurate" screens that are wrong nine times in ten, the security alarm
 * that's almost always a false one.
 *
 * The cure is Gerd Gigerenzer's: stop thinking in probabilities and think in
 * natural frequencies. Picture a concrete crowd of people. The same problem that
 * fools most doctors in percentage form ("90% sensitive, 9% false positive, 1%
 * prevalence — what's a positive worth?") becomes obvious as counts: of 1,000
 * women, 10 have it and 9 test positive; of the 990 who don't, about 89 test
 * positive anyway; so of ~98 positives, only 9 are real — about 9%.
 *
 * Every number here is a fraction, and the posterior the trainer grades you
 * against is computed from those fractions exactly (see `posterior`). The natural
 * frequencies shown are those same fractions scaled to a round crowd and rounded
 * for legibility — a trainer that grades against a wrong number is worse than
 * none, so the grade always comes from the exact arithmetic, never the rounded
 * display.
 */

export type BayesProblem = {
  id: string;
  /** Short label for the menu / record. */
  title: string;
  /** The setup — who's being tested and why. */
  scenario: string;
  /** P(condition) before the evidence — the base rate. A fraction in (0,1). */
  baseRate: number;
  /** P(positive | condition) — the test's true-positive (hit) rate. */
  sensitivity: number;
  /** P(positive | no condition) — the false-positive (false-alarm) rate. */
  falsePositive: number;
  /** A round crowd to render the natural frequencies over (1,000; 100,000…). */
  perN: number;
  /** Plural noun for someone who has the condition — "people with the disease". */
  conditionNoun: string;
  /** What a positive result is called here — "a positive test", "an alarm". */
  resultNoun: string;
  /** The question asked: given a positive, how likely is it real? */
  question: string;
  /** The lesson, shown with the answer. */
  note: string;
  /** Where the numbers come from. */
  source: string;
  /** Whether this one reads well as the deep, single walk-through. */
  feature?: boolean;
};

export const bayesProblems: BayesProblem[] = [
  {
    id: "mammogram",
    title: "A positive mammogram",
    scenario:
      "A woman in her forties with no symptoms has a routine screening mammogram, and it comes back positive. In her age group about 1% of women have breast cancer at any given time. The mammogram catches roughly 90% of real cancers, and gives a false positive in about 9% of healthy women.",
    baseRate: 0.01,
    sensitivity: 0.9,
    falsePositive: 0.09,
    perN: 1000,
    conditionNoun: "women who have breast cancer",
    resultNoun: "a positive mammogram",
    question:
      "She just got a positive result. What's the chance she actually has breast cancer?",
    note:
      "Most people — including most doctors asked this exact question — answer around 80–90%, reasoning from the test's accuracy. The real answer is about 9%, because the disease is rare: the great majority of positives come from the huge healthy group, not the tiny sick one. A positive should worry her enough to follow up, not enough to grieve.",
    source:
      "Gigerenzer's canonical version of the problem, with round numbers close to real screening figures. The widely cited study (Eddy, 1978; revisited by Gigerenzer) found ~95% of physicians badly overestimated this.",
    feature: true,
  },
  {
    id: "rare-disease",
    title: "A 99%-accurate test for a rare disease",
    scenario:
      "There's a disease that 1 in 1,000 people have. A test for it is, as advertised, 99% accurate: it's positive for 99% of people who have the disease, and falsely positive for only 1% of people who don't. You test positive.",
    baseRate: 0.001,
    sensitivity: 0.99,
    falsePositive: 0.01,
    perN: 100000,
    conditionNoun: "people who have the disease",
    resultNoun: "a positive test",
    question: "What's the chance you actually have the disease?",
    note:
      "About 9% — not 99%. This is the result that surprises people most, because '99% accurate' sounds decisive. But 1-in-1,000 is so rare that the 1% of false positives, drawn from the enormous healthy majority, still vastly outnumber the genuine cases. 'Accuracy' and 'what a positive means' are different numbers, and the gap between them is the base rate.",
    source:
      "The textbook base-rate problem; the exact arithmetic follows from the stated rates.",
    feature: true,
  },
  {
    id: "drug-test",
    title: "An employee fails a drug test",
    scenario:
      "A company drug-tests everyone. Suppose about 4% of staff actually use the drug. The test correctly flags 95% of users, and wrongly flags 5% of non-users. An employee's test comes back positive.",
    baseRate: 0.04,
    sensitivity: 0.95,
    falsePositive: 0.05,
    perN: 1000,
    conditionNoun: "employees who use the drug",
    resultNoun: "a positive test",
    question: "What's the chance this employee actually uses the drug?",
    note:
      "About 44% — closer to a coin flip than to the 95% the test's accuracy suggests. Even a fairly accurate test, applied to a population where the behaviour is uncommon, produces nearly as many false accusations as true ones. It's a strong argument for confirming a positive before acting on it.",
    source:
      "A standard illustration in testing ethics; arithmetic from the stated rates.",
  },
  {
    id: "card-fraud",
    title: "A fraud alert on your card",
    scenario:
      "About 2 in 1,000 card transactions are fraudulent. The bank's detector flags 98% of genuinely fraudulent transactions, and also flags 2% of legitimate ones. Your card just triggered an alert.",
    baseRate: 0.002,
    sensitivity: 0.98,
    falsePositive: 0.02,
    perN: 10000,
    conditionNoun: "transactions that are actually fraud",
    resultNoun: "an alert",
    question: "What's the chance this flagged transaction is really fraud?",
    note:
      "About 9%. This is why fraud alerts and security systems generate so many false alarms that people learn to wave them through — when the real thing is rare, even a sharp detector spends most of its alarms on the innocent majority. The fix is rarely a 'better' test; it's a cheap second check after the first flag.",
    source: "Illustrative rates; arithmetic exact.",
  },
  {
    id: "security-screen",
    title: "A face-recognition match at the airport",
    scenario:
      "An airport runs every traveller's face against a watchlist. Suppose 1 traveller in 10,000 is genuinely on it. The system matches 95% of real watchlist members, and falsely matches 1% of innocent travellers. It just flagged the person in front of you.",
    baseRate: 0.0001,
    sensitivity: 0.95,
    falsePositive: 0.01,
    perN: 1000000,
    conditionNoun: "travellers genuinely on the watchlist",
    resultNoun: "a match",
    question: "What's the chance this flagged traveller is actually on the watchlist?",
    note:
      "Under 1%. When the target is genuinely rare, mass screening drowns in false positives — here more than 99 in 100 matches are innocent people. It's the base-rate argument against blanket surveillance: a test can be excellent and still be useless, or worse than useless, against a rare enough target.",
    source:
      "The standard 'base-rate fallacy in mass surveillance' analysis; arithmetic from the stated rates.",
    feature: true,
  },
  {
    id: "flu-season",
    title: "A flu test at the peak of the season",
    scenario:
      "It's the height of flu season and you have aches and a fever, so 30% of people walking into the clinic like you actually have the flu. The rapid test catches 80% of real flu cases and is falsely positive 10% of the time. Yours is positive.",
    baseRate: 0.3,
    sensitivity: 0.8,
    falsePositive: 0.1,
    perN: 1000,
    conditionNoun: "patients who actually have the flu",
    resultNoun: "a positive test",
    question: "What's the chance you actually have the flu?",
    note:
      "About 77% — and this is the case that keeps the lesson honest. When the base rate is high (symptoms in flu season), a positive really is strong evidence. The point was never 'always distrust the test.' It's that the same test means wildly different things depending on how common the thing is — decisive here, nearly worthless for a rare disease.",
    source: "Illustrative rates typical of rapid influenza tests; arithmetic exact.",
    feature: true,
  },
  {
    id: "antibody-low",
    title: "An antibody test in a low-prevalence area",
    scenario:
      "Early in an outbreak, only about 2% of people in your area have been infected. An antibody test detects 90% of people who truly have antibodies, and is falsely positive in 5% of those who don't. Yours comes back positive.",
    baseRate: 0.02,
    sensitivity: 0.9,
    falsePositive: 0.05,
    perN: 1000,
    conditionNoun: "people who really have antibodies",
    resultNoun: "a positive test",
    question: "What's the chance you really have antibodies?",
    note:
      "About 27%. This is why public-health agencies warned against reading early antibody results as a personal all-clear: when prevalence is low, most positives are false, and the same test would mean something completely different once a third of the population had been infected.",
    source:
      "Mirrors guidance issued during the 2020 antibody-testing debate; arithmetic from the stated rates.",
  },
  {
    id: "polygraph",
    title: "A failed lie-detector test",
    scenario:
      "A polygraph is used to screen for the roughly 5% of people in a group who are actually lying about something. Suppose it correctly flags 85% of liars and falsely flags 15% of truthful people. Someone fails it.",
    baseRate: 0.05,
    sensitivity: 0.85,
    falsePositive: 0.15,
    perN: 1000,
    conditionNoun: "people who are actually lying",
    resultNoun: "a failed test",
    question: "What's the chance this person was actually lying?",
    note:
      "About 23% — so a failed polygraph is far more likely to come from an honest person than a liar. When the behaviour is uncommon and the test is only moderately accurate, a 'fail' carries almost no information. It's the base-rate case against using such tests to make consequential calls about individuals.",
    source:
      "Reflects the long-standing scientific critique of polygraph screening (e.g. the 2003 US National Research Council report); arithmetic from the stated rates.",
  },
];

/* --------------------------------- math --------------------------------- */

/**
 * The posterior P(condition | positive), straight from Bayes:
 *   (base · sensitivity) / (base · sensitivity + (1 − base) · falsePositive).
 * This is the number the trainer grades against — computed from the fractions,
 * never from the rounded display counts.
 */
export function posterior(p: BayesProblem): number {
  const hit = p.baseRate * p.sensitivity;
  const falseAlarm = (1 - p.baseRate) * p.falsePositive;
  const denom = hit + falseAlarm;
  return denom === 0 ? 0 : hit / denom;
}

export type Frequencies = {
  /** The round crowd. */
  total: number;
  /** How many of them have the condition. */
  withCondition: number;
  /** Of those, how many the test flags (true positives). */
  truePositives: number;
  /** How many don't have the condition. */
  withoutCondition: number;
  /** Of those, how many the test flags anyway (false positives). */
  falsePositives: number;
  /** Everyone who tested positive. */
  positives: number;
};

/**
 * The same fractions, expressed as a concrete crowd — Gigerenzer's natural
 * frequencies. Counts are rounded for legibility; they're a teaching picture of
 * the exact `posterior`, not the graded answer.
 */
export function naturalFrequencies(p: BayesProblem): Frequencies {
  const withCondition = Math.round(p.baseRate * p.perN);
  const withoutCondition = p.perN - withCondition;
  const truePositives = Math.round(p.baseRate * p.sensitivity * p.perN);
  const falsePositives = Math.round((1 - p.baseRate) * p.falsePositive * p.perN);
  return {
    total: p.perN,
    withCondition,
    truePositives,
    withoutCondition,
    falsePositives,
    positives: truePositives + falsePositives,
  };
}

/** Round-trip a fraction to a whole-number percentage for display. */
export function pct(fraction: number): number {
  return Math.round(fraction * 100);
}

/**
 * Fisher–Yates shuffle, shared with the other two trainers — declared once in
 * calibration.ts so the three tools can't drift.
 */
export { pickRandom } from "./calibration";

/** How many scenarios a single round of the trainer serves up. */
export const ROUND_SIZE = 6;

/**
 * A verdict on one update, by how far the estimate landed from the truth (in
 * percentage points). The order-of-magnitude target here is "within ten points".
 */
export function updateVerdict(absErrorPoints: number): string {
  if (absErrorPoints <= 5) return "Nailed it — within five points.";
  if (absErrorPoints <= 10) return "Close — within ten points.";
  if (absErrorPoints <= 25) return "Off by a fair margin.";
  return "Way off — the kind of miss base-rate neglect produces.";
}
