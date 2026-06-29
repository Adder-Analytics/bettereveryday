/**
 * The question bank behind the calibration trainer (`/calibrate`).
 *
 * The decision journal (`/decide`) asks you, on every forecast, how sure you
 * are — but nothing on the site ever let you find out whether your "sure" is
 * worth anything. This is that missing piece: a place to put numbers on your
 * uncertainty against facts with knowable answers, and get told, immediately,
 * how often your confidence was justified.
 *
 * Two question types, mirroring the two ways the journal already asks for
 * confidence:
 *   - `RangeQuestion` — give a 90% confidence interval around a number. A
 *     well-calibrated person's ranges contain the true answer about 90% of the
 *     time. Most people land far lower — the classic overconfidence Douglas
 *     Hubbard documents in "How to Measure Anything."
 *   - `BinaryQuestion` — say whether a statement is true and how sure you are.
 *     Plotted as a calibration curve: of the times you said "70%," were you
 *     right about 70% of the time?
 *
 * Answers are deliberately timeless and checkable — no figure that drifts month
 * to month — because a calibration tool with a wrong answer in it is worse than
 * none. Where a figure has an accepted rounded value, the note records it.
 */

export type RangeQuestion = {
  id: string;
  /** The quantity to bound, phrased so the unit is unambiguous. */
  prompt: string;
  /** The true value, in `unit`. */
  answer: number;
  /** Unit shown beside the inputs and the answer (e.g. "km", "year"). */
  unit: string;
  /** One line of context shown with the answer — the source or a caveat. */
  note: string;
};

export type BinaryQuestion = {
  id: string;
  /** A statement that is flatly true or false. */
  prompt: string;
  answer: boolean;
  /** Shown after answering — why it's true or false. */
  note: string;
};

export const rangeQuestions: RangeQuestion[] = [
  {
    id: "nile-length",
    prompt: "How long is the Nile River?",
    answer: 6650,
    unit: "km",
    note: "About 6,650 km — the longest river in Africa, and by most measures the longest in the world.",
  },
  {
    id: "paris-nyc",
    prompt: "What is the air (great-circle) distance from Paris to New York City?",
    answer: 5837,
    unit: "km",
    note: "About 5,837 km, roughly 3,627 miles.",
  },
  {
    id: "wikipedia-year",
    prompt: "In what year did Wikipedia launch?",
    answer: 2001,
    unit: "year",
    note: "January 15, 2001.",
  },
  {
    id: "everest",
    prompt: "How tall is Mount Everest above sea level?",
    answer: 8849,
    unit: "m",
    note: "8,848.86 m, by the joint China–Nepal survey published in 2020.",
  },
  {
    id: "human-bones",
    prompt: "How many bones are in the adult human body?",
    answer: 206,
    unit: "bones",
    note: "206 in a typical adult — babies are born with around 300, which fuse over time.",
  },
  {
    id: "light-speed",
    prompt: "What is the speed of light in a vacuum?",
    answer: 299792,
    unit: "km/s",
    note: "299,792 km per second (exactly 299,792.458).",
  },
  {
    id: "iphone-year",
    prompt: "In what year was the first iPhone released?",
    answer: 2007,
    unit: "year",
    note: "June 2007.",
  },
  {
    id: "un-members",
    prompt: "How many member states does the United Nations have?",
    answer: 193,
    unit: "states",
    note: "193 member states.",
  },
  {
    id: "moon-diameter",
    prompt: "What is the diameter of the Moon?",
    answer: 3475,
    unit: "km",
    note: "About 3,475 km — a bit over a quarter of Earth's diameter.",
  },
  {
    id: "piano-keys",
    prompt: "How many keys are on a standard full-size piano?",
    answer: 88,
    unit: "keys",
    note: "88 — 52 white and 36 black.",
  },
  {
    id: "davinci-born",
    prompt: "In what year was Leonardo da Vinci born?",
    answer: 1452,
    unit: "year",
    note: "1452, in Vinci, near Florence.",
  },
  {
    id: "earth-moon",
    prompt: "What is the average distance from the Earth to the Moon?",
    answer: 384400,
    unit: "km",
    note: "About 384,400 km on average — the orbit is an ellipse, so it varies.",
  },
  {
    id: "elements",
    prompt: "How many chemical elements are on the periodic table?",
    answer: 118,
    unit: "elements",
    note: "118 confirmed, up to oganesson (element 118).",
  },
  {
    id: "berlin-wall",
    prompt: "In what year did the Berlin Wall fall?",
    answer: 1989,
    unit: "year",
    note: "November 1989.",
  },
  {
    id: "elephant-gestation",
    prompt: "How long is the gestation period of an elephant?",
    answer: 640,
    unit: "days",
    note: "About 640 days — nearly 22 months, the longest of any land animal.",
  },
  {
    id: "mariana",
    prompt: "How deep is the Challenger Deep, the lowest point in the ocean?",
    answer: 10935,
    unit: "m",
    note: "About 10,935 m below sea level — measurements vary by a few tens of metres.",
  },
  {
    id: "marathon",
    prompt: "How long is a marathon?",
    answer: 42.195,
    unit: "km",
    note: "42.195 km, or 26.2 miles.",
  },
  {
    id: "equator",
    prompt: "What is the Earth's circumference around the equator?",
    answer: 40075,
    unit: "km",
    note: "About 40,075 km — close to 40,000 by design, since the metre was originally defined from it.",
  },
  {
    id: "mozart-born",
    prompt: "In what year was Mozart born?",
    answer: 1756,
    unit: "year",
    note: "1756, in Salzburg.",
  },
  {
    id: "adult-teeth",
    prompt: "How many permanent teeth does an adult human have?",
    answer: 32,
    unit: "teeth",
    note: "32, including the four wisdom teeth.",
  },
  {
    id: "great-wall",
    prompt: "How long is the Great Wall of China, counting all its branches?",
    answer: 21196,
    unit: "km",
    note: "21,196 km by China's official 2012 survey, including every branch ever built.",
  },
  {
    id: "blue-whale",
    prompt: "How long is the largest recorded blue whale?",
    answer: 30,
    unit: "m",
    note: "Up to about 30 m — the largest animal known to have ever lived.",
  },
];

export const binaryQuestions: BinaryQuestion[] = [
  {
    id: "great-wall-space",
    prompt: "The Great Wall of China is visible to the naked eye from the Moon.",
    answer: false,
    note: "A myth. It's not even reliably visible from low Earth orbit without aid.",
  },
  {
    id: "antarctica-desert",
    prompt: "The Sahara is the largest desert in the world.",
    answer: false,
    note: "Antarctica is the largest desert — a desert is defined by precipitation, not heat.",
  },
  {
    id: "chimborazo",
    prompt: "Mount Everest is the point on Earth's surface closest to outer space.",
    answer: false,
    note: "Mount Chimborazo in Ecuador is — Earth bulges at the equator, so its summit reaches farther from the centre.",
  },
  {
    id: "einstein-nobel",
    prompt: "Albert Einstein won his Nobel Prize for the theory of relativity.",
    answer: false,
    note: "He won the 1921 Physics prize for explaining the photoelectric effect.",
  },
  {
    id: "venus-hottest",
    prompt: "Venus is the hottest planet in the solar system.",
    answer: true,
    note: "True — its thick CO₂ atmosphere traps more heat than Mercury's, despite Mercury being closer to the Sun.",
  },
  {
    id: "gold-lead",
    prompt: "Gold is denser than lead.",
    answer: true,
    note: "True — gold is about 19.3 g/cm³ to lead's 11.3.",
  },
  {
    id: "brain-ten-percent",
    prompt: "Humans use only about 10% of their brains.",
    answer: false,
    note: "A myth — imaging shows virtually all of the brain is active over a day.",
  },
  {
    id: "glass-liquid",
    prompt: "Glass is a slow-moving liquid that flows over centuries.",
    answer: false,
    note: "A myth — glass is an amorphous solid. Old wavy windows were made unevenly, not deformed by flow.",
  },
  {
    id: "napoleon-short",
    prompt: "Napoleon was unusually short for his era.",
    answer: false,
    note: "He was about average height for a Frenchman of his time; the 'short' image came partly from British propaganda and a unit mix-up.",
  },
  {
    id: "everest-bull-red",
    prompt: "Bulls are enraged by the colour red.",
    answer: false,
    note: "Cattle are red-green colour-blind; in a bullfight it's the cape's movement that provokes them.",
  },
  {
    id: "pacific-largest",
    prompt: "The Pacific is the largest ocean on Earth.",
    answer: true,
    note: "True — larger than all the land on Earth combined.",
  },
  {
    id: "kilimanjaro",
    prompt: "Mount Kilimanjaro is the highest mountain in Africa.",
    answer: true,
    note: "True — about 5,895 m, and a free-standing volcano.",
  },
  {
    id: "canberra",
    prompt: "Sydney is the capital of Australia.",
    answer: false,
    note: "Canberra is — it was chosen as a compromise between Sydney and Melbourne.",
  },
  {
    id: "ankara",
    prompt: "Istanbul is the capital of Turkey.",
    answer: false,
    note: "Ankara is the capital; Istanbul is the largest city.",
  },
  {
    id: "sun-light-time",
    prompt: "Light from the Sun takes about eight minutes to reach Earth.",
    answer: true,
    note: "True — roughly 8 minutes 20 seconds.",
  },
  {
    id: "venus-rotation",
    prompt: "Venus rotates on its axis more slowly than it orbits the Sun.",
    answer: true,
    note: "True — one Venusian rotation takes about 243 Earth days; one orbit takes about 225.",
  },
  {
    id: "sound-water",
    prompt: "Sound travels faster through water than through air.",
    answer: true,
    note: "True — roughly four times faster.",
  },
  {
    id: "honey-spoil",
    prompt: "Pure honey can stay edible for thousands of years.",
    answer: true,
    note: "True — its low water content and acidity resist spoilage; edible honey has been found in ancient tombs.",
  },
  {
    id: "chess-atoms",
    prompt: "There are more possible games of chess than there are atoms in the observable universe.",
    answer: true,
    note: "True — the number of possible games is vastly larger (around 10¹²⁰ versus roughly 10⁸⁰ atoms).",
  },
  {
    id: "zanzibar-war",
    prompt: "The shortest war in recorded history lasted under an hour.",
    answer: true,
    note: "True — the Anglo-Zanzibar War of 1896 lasted around 38 minutes.",
  },
  {
    id: "mona-lisa",
    prompt: "The Mona Lisa is painted on canvas.",
    answer: false,
    note: "It's painted on a poplar wood panel.",
  },
  {
    id: "goldfish-memory",
    prompt: "A goldfish's memory lasts only a few seconds.",
    answer: false,
    note: "A myth — goldfish can remember things for months and can be trained.",
  },
  {
    id: "lightning-twice",
    prompt: "Lightning never strikes the same place twice.",
    answer: false,
    note: "It does — the Empire State Building is hit dozens of times a year.",
  },
  {
    id: "swiss-franc",
    prompt: "Switzerland's currency is the euro.",
    answer: false,
    note: "It's the Swiss franc; Switzerland is not in the eurozone.",
  },
];

/**
 * Fisher–Yates shuffle returning the first `count` items. Pure given a source
 * of randomness; the caller supplies `rand` so selection can stay off the
 * server-render path (it only runs on a user gesture in the browser).
 */
export function pickRandom<T>(items: T[], count: number, rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

/** How many questions a single round serves up. */
export const ROUND_SIZE = 10;

/** The confidence levels offered on binary questions — 50% means a coin flip. */
export const BINARY_CONFIDENCE = [50, 60, 70, 80, 90, 100] as const;
