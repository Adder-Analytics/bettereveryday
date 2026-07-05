/**
 * The three trainers, read as one.
 *
 * Calibration, estimation, and base-rate updating are three faces of a single
 * project: putting honest numbers on an uncertain world. Each trainer already
 * keeps its own lifetime record in the browser; this module reads all three
 * from the *same* localStorage keys they write to (so nothing duplicates or
 * drifts) and folds each into one normalized profile — a headline number, a
 * plain-language verdict, and a comparable "how much would practice help here"
 * score. The Practice hub uses these to show your whole judgement profile in
 * one place and to suggest where to spend the next ten minutes.
 *
 * It deliberately never *writes* — the trainers own their records. This is the
 * read side only, so adding it can't regress any existing tool.
 */

import { MIN_TREND_SPAN_DAYS, spanDays, splitByWeight } from "./history";

/* ----------------------------- record shapes ----------------------------- */
/* These mirror the types declared inside each trainer's client. They must stay
   in sync with the writers; the loaders below tolerate missing/partial fields
   so an older or newer record shape degrades to "no data" rather than throwing. */

type CalDay = {
  d: string;
  rangeN?: number;
  rangeHits?: number;
  binaryN?: number;
  binaryClaimed?: number;
  binaryHits?: number;
};

type EstDay = {
  d: string;
  oneshotN?: number;
  sumAbsLog?: number;
  decomposeN?: number;
  beatGut?: number;
};

type UpdDay = {
  d: string;
  n?: number;
  sumAbsErr?: number;
  priorN?: number;
  priorSigned?: number;
};

type CalibrateRecord = {
  range: { n: number; hits: number };
  binary: { [confidence: number]: { n: number; hits: number } };
  /** Per-day buckets — absent in records written before the trend existed. */
  days?: CalDay[];
};

type EstimateRecord = {
  decompose: { n: number; beatGut: number };
  oneshot: { n: number; sumAbsLog: number; withinOrder: number };
  days?: EstDay[];
};

type UpdateRecord = {
  n: number;
  sumAbsErr: number;
  sumSignedErr: number;
  within: number;
  /** The pick-the-prior mode's record — absent in records written before it existed. */
  prior?: { n?: number; sumAbs?: number; sumSigned?: number };
  days?: UpdDay[];
};

const CALIBRATE_KEY = "calibrate:v1";
const ESTIMATE_KEY = "estimate:v1";
const UPDATE_KEY = "update:v1";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* ------------------------------ the profile ------------------------------ */

/** How the headline should read — drives the colour of the stat. */
export type Tone = "good" | "mid" | "work" | "none";

/**
 * The answer to the site's own name, computed honestly or not at all: your
 * first rounds against your latest, split by volume (see data/history.ts).
 * Null until each half can carry the claim — a minimum of answers per half
 * and at least two weeks between the first and last practice day — because
 * a "trend" read off two noisy handfuls is worse than silence.
 */
export type Trend = {
  /** e.g. "first 30 ranges" */
  earlyLabel: string;
  /** e.g. "58% held" */
  early: string;
  lateLabel: string;
  late: string;
  /** One plain sentence on what the movement means — including "nothing yet". */
  reading: string;
  tone: Tone;
};

export type TrainerProfile = {
  id: "calibrate" | "estimate" | "update";
  name: string;
  /** The route to the trainer itself. */
  route: string;
  /** The one-sentence skill question this trainer answers. */
  question: string;
  /** Has the visitor done anything here yet? */
  hasData: boolean;
  /** Total questions/updates answered (across all of this trainer's modes). */
  n: number;
  /** The single number to show big, already formatted (e.g. "78%", "4.2×"). */
  headline: string | null;
  /** What the headline measures, in a few words. */
  headlineLabel: string;
  /** A plain-language reading of where you stand. */
  verdict: string;
  tone: Tone;
  /**
   * 0–100, higher = more to gain from practising here. Untouched trainers are
   * null (handled separately as "start here"). Used only to rank a suggestion;
   * it's a gentle heuristic, never shown as a score.
   */
  needsPractice: number | null;
  /** First half vs latest half, once the dated record can carry it. */
  trend: Trend | null;
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Compact factor formatting, matching the estimation trainer's own. */
function fmtFactor(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 10) return n.toFixed(1);
  if (n < 100) return Math.round(n).toString();
  return Math.round(n).toLocaleString("en-US");
}

/* ------------------------------- the trend ------------------------------- */
/* Minimum answers per half before a trend will speak. Set where the halves
   stop being coin flips: at 15 ranges per half, one lucky round still moves
   the rate several points, which is why the flat reading stays humble. */
const TREND_MIN_RANGES = 15;
const TREND_MIN_BINARY = 20;
const TREND_MIN_ONESHOT = 8;
const TREND_MIN_UPDATES = 6;

/** Keep only well-formed buckets, in date order. */
function cleanDays<T extends { d: string }>(days: T[] | undefined): T[] {
  if (!Array.isArray(days)) return [];
  return days
    .filter((b) => b && typeof b === "object" && typeof b.d === "string" && b.d)
    .slice()
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
}

/**
 * Split day buckets into halves by volume and check the honesty gates: enough
 * weight in each half, and enough calendar between the first and last carrying
 * day for "over time" to mean anything. Returns the halves or null.
 */
function honestHalves<T extends { d: string }>(
  days: T[],
  weight: (b: T) => number,
  minPerHalf: number
): { early: T[]; late: T[]; earlyN: number; lateN: number } | null {
  const carrying = days.filter((b) => weight(b) > 0);
  if (spanDays(carrying) < MIN_TREND_SPAN_DAYS) return null;
  const split = splitByWeight(carrying, weight);
  if (!split) return null;
  const earlyN = split.early.reduce((s, b) => s + weight(b), 0);
  const lateN = split.late.reduce((s, b) => s + weight(b), 0);
  if (earlyN < minPerHalf || lateN < minPerHalf) return null;
  return { ...split, earlyN, lateN };
}

function calibrateTrend(r: CalibrateRecord | null): Trend | null {
  const days = cleanDays(r?.days);

  // Prefer the range trend — same priority as the headline.
  const ranges = honestHalves(days, (b) => b.rangeN ?? 0, TREND_MIN_RANGES);
  if (ranges) {
    const rate = (half: CalDay[]) =>
      Math.round(
        (half.reduce((s, b) => s + (b.rangeHits ?? 0), 0) /
          half.reduce((s, b) => s + (b.rangeN ?? 0), 0)) *
          100
      );
    const earlyRate = rate(ranges.early);
    const lateRate = rate(ranges.late);
    // Better = closer to an honest 90, from either side — not simply higher.
    const delta = Math.abs(90 - earlyRate) - Math.abs(90 - lateRate);
    const [reading, tone]: [string, Tone] =
      delta >= 6
        ? ["Your ranges are moving toward an honest 90% — the practice is landing.", "good"]
        : delta <= -6
          ? ["Your latest ranges sit further from 90% than your first did — worth slowing down before you commit a range.", "work"]
          : Math.abs(90 - lateRate) <= 7
            ? ["Steady at calibrated — from here, improvement means staying put.", "good"]
            : ["Holding steady. A plateau isn't a verdict — but check the questions still sting.", "mid"];
    return {
      earlyLabel: `first ${ranges.earlyN} ranges`,
      early: `${earlyRate}% held`,
      lateLabel: `latest ${ranges.lateN}`,
      late: `${lateRate}% held`,
      reading,
      tone,
    };
  }

  // Fall back to the true/false overconfidence gap.
  const bin = honestHalves(days, (b) => b.binaryN ?? 0, TREND_MIN_BINARY);
  if (bin) {
    const gap = (half: CalDay[]) => {
      const n = half.reduce((s, b) => s + (b.binaryN ?? 0), 0);
      const claimed = half.reduce((s, b) => s + (b.binaryClaimed ?? 0), 0) / n;
      const actual = (half.reduce((s, b) => s + (b.binaryHits ?? 0), 0) / n) * 100;
      return Math.round(claimed - actual);
    };
    const earlyGap = gap(bin.early);
    const lateGap = gap(bin.late);
    const delta = Math.abs(earlyGap) - Math.abs(lateGap);
    const [reading, tone]: [string, Tone] =
      delta >= 6
        ? ["Your confidence is tracking your hit rate more closely than when you started.", "good"]
        : delta <= -6
          ? ["The gap between how sure you feel and how often you're right has widened lately.", "work"]
          : Math.abs(lateGap) <= 7
            ? ["Steady at calibrated — from here, improvement means staying put.", "good"]
            : ["Holding steady. A plateau isn't a verdict — but check the questions still sting.", "mid"];
    return {
      earlyLabel: `first ${bin.earlyN} calls`,
      early: `${earlyGap >= 0 ? "+" : ""}${earlyGap} pt gap`,
      lateLabel: `latest ${bin.lateN}`,
      late: `${lateGap >= 0 ? "+" : ""}${lateGap} pt gap`,
      reading,
      tone,
    };
  }

  return null;
}

function estimateTrend(r: EstimateRecord | null): Trend | null {
  const days = cleanDays(r?.days);
  const halves = honestHalves(days, (b) => b.oneshotN ?? 0, TREND_MIN_ONESHOT);
  if (!halves) return null;
  const meanLog = (half: EstDay[]) =>
    half.reduce((s, b) => s + (b.sumAbsLog ?? 0), 0) /
    half.reduce((s, b) => s + (b.oneshotN ?? 0), 0);
  const earlyLog = meanLog(halves.early);
  const lateLog = meanLog(halves.late);
  const delta = earlyLog - lateLog; // positive = tightening
  const [reading, tone]: [string, Tone] =
    delta >= 0.15
      ? ["Your typical miss is tightening — decomposition is becoming the reflex.", "good"]
      : delta <= -0.15
        ? ["Your recent estimates run wider of the mark than your first did — back to factors before committing a number.", "work"]
        : Math.pow(10, lateLog) <= 3
          ? ["Steady at genuinely good — most guesses land in the right neighbourhood.", "good"]
          : ["Holding steady. A plateau isn't a verdict — but check the questions still sting.", "mid"];
  return {
    earlyLabel: `first ${halves.earlyN} estimates`,
    early: `${fmtFactor(Math.pow(10, earlyLog))}× off`,
    lateLabel: `latest ${halves.lateN}`,
    late: `${fmtFactor(Math.pow(10, lateLog))}× off`,
    reading,
    tone,
  };
}

function updateTrend(r: UpdateRecord | null): Trend | null {
  const days = cleanDays(r?.days);
  const halves = honestHalves(days, (b) => b.n ?? 0, TREND_MIN_UPDATES);
  if (!halves) return null;
  const miss = (half: UpdDay[]) =>
    Math.round(
      half.reduce((s, b) => s + (b.sumAbsErr ?? 0), 0) /
        half.reduce((s, b) => s + (b.n ?? 0), 0)
    );
  const earlyMiss = miss(halves.early);
  const lateMiss = miss(halves.late);
  const delta = earlyMiss - lateMiss;
  const [reading, tone]: [string, Tone] =
    delta >= 5
      ? ["Your updates are landing closer to what the numbers demand — the base rate is starting to do its work.", "good"]
      : delta <= -5
        ? ["Your recent updates miss by more than your first did — count the crowd before you answer.", "work"]
        : lateMiss <= 12
          ? ["Steady at close — you're weighing evidence against the prior, not anchoring on either.", "good"]
          : ["Holding steady. A plateau isn't a verdict — but check the questions still sting.", "mid"];
  return {
    earlyLabel: `first ${halves.earlyN} updates`,
    early: `${earlyMiss} pts off`,
    lateLabel: `latest ${halves.lateN}`,
    late: `${lateMiss} pts off`,
    reading,
    tone,
  };
}

function calibrateProfile(r: CalibrateRecord | null): TrainerProfile {
  const base = {
    id: "calibrate" as const,
    name: "Calibration",
    route: "/calibrate",
    question: "How wide should your uncertainty be?",
    trend: calibrateTrend(r),
  };

  const rangeN = r?.range?.n ?? 0;
  const rangeHits = r?.range?.hits ?? 0;
  const binary = r?.binary ?? {};
  const binaryEntries = Object.entries(binary)
    .map(([c, b]) => ({ c: Number(c), n: b?.n ?? 0, hits: b?.hits ?? 0 }))
    .filter((b) => b.n > 0);
  const binaryN = binaryEntries.reduce((s, b) => s + b.n, 0);

  if (rangeN === 0 && binaryN === 0) {
    return {
      ...base,
      hasData: false,
      n: 0,
      headline: null,
      headlineLabel: "of your 90% ranges held the truth",
      verdict:
        "Find out whether your “90% sure” is worth anything — most people's ranges are far too narrow.",
      tone: "none",
      needsPractice: null,
    };
  }

  // Prefer the range hit rate — the most legible single calibration number.
  if (rangeN > 0) {
    const rate = Math.round((rangeHits / rangeN) * 100);
    const verdict =
      rangeN < 20
        ? `Early days — across ${rangeN} range${rangeN === 1 ? "" : "s"}, the truth landed inside ${rate}%. A few more rounds and this number means something.`
        : rate >= 83
          ? `The truth landed inside ${rate}% of your 90% ranges — the mark of a calibrated interval. Well judged.`
          : rate >= 70
            ? `The truth landed inside ${rate}% of your 90% ranges — closing in on a true 90%, but your ranges run a little tight.`
            : `The truth landed inside only ${rate}% of your 90% ranges — like most people, you're claiming more certainty than your ranges earn.`;
    const tone: Tone = rangeN < 20 ? "mid" : rate >= 83 ? "good" : rate >= 70 ? "mid" : "work";
    return {
      ...base,
      hasData: true,
      n: rangeN + binaryN,
      headline: `${rate}%`,
      headlineLabel: "of your 90% ranges held the truth",
      verdict,
      tone,
      needsPractice: clamp((Math.abs(90 - rate) / 40) * 100),
    };
  }

  // Only true/false data so far: the overconfidence gap is the clean number.
  const claimedMean = binaryEntries.reduce((s, b) => s + b.c * b.n, 0) / binaryN;
  const actualMean = (binaryEntries.reduce((s, b) => s + b.hits, 0) / binaryN) * 100;
  const gap = Math.round(claimedMean - actualMean);
  const verdict =
    Math.abs(gap) <= 7
      ? `Across ${binaryN} true/false calls, your confidence matched your hit rate within ${Math.abs(gap)} points — nicely calibrated.`
      : gap > 7
        ? `Across ${binaryN} true/false calls, you were right ${gap} points less often than you felt sure — the textbook overconfidence gap.`
        : `Across ${binaryN} true/false calls, you were right ${Math.abs(gap)} points more often than you claimed — you're underselling what you know.`;
  return {
    ...base,
    hasData: true,
    n: binaryN,
    headline: `${gap >= 0 ? "+" : ""}${gap} pts`,
    headlineLabel: "overconfidence gap (claimed − actual)",
    verdict,
    tone: Math.abs(gap) <= 7 ? "good" : gap > 7 ? "work" : "mid",
    needsPractice: clamp((Math.abs(gap) / 30) * 100),
  };
}

function estimateProfile(r: EstimateRecord | null): TrainerProfile {
  const base = {
    id: "estimate" as const,
    name: "Estimation",
    route: "/estimate",
    question: "How do you get to a number at all?",
    trend: estimateTrend(r),
  };

  const oneshotN = r?.oneshot?.n ?? 0;
  const sumAbsLog = r?.oneshot?.sumAbsLog ?? 0;
  const decomposeN = r?.decompose?.n ?? 0;
  const beatGut = r?.decompose?.beatGut ?? 0;

  if (oneshotN === 0 && decomposeN === 0) {
    return {
      ...base,
      hasData: false,
      n: 0,
      headline: null,
      headlineLabel: "your typical miss, in factors of ten",
      verdict:
        "How many piano tuners work in Chicago? Learn to get within a factor of two without looking it up.",
      tone: "none",
      needsPractice: null,
    };
  }

  if (oneshotN > 0) {
    const meanLog = sumAbsLog / oneshotN;
    const factor = Math.pow(10, meanLog);
    const verdict =
      oneshotN < 16
        ? `Early days — across ${oneshotN} estimate${oneshotN === 1 ? "" : "s"}, your typical miss is a factor of ${fmtFactor(factor)}×. A few more and it means something.`
        : factor <= 3
          ? `Your typical miss is a factor of ${fmtFactor(factor)}× — genuinely good Fermi; most guesses land in the right neighbourhood.`
          : factor <= 10
            ? `Your typical miss is a factor of ${fmtFactor(factor)}× — mostly inside an order of magnitude. Decomposing the hard ones will tighten it.`
            : `Your typical miss is a factor of ${fmtFactor(factor)}× — lots of room. Break the wild ones into factors before you commit a number.`;
    const tone: Tone = oneshotN < 16 ? "mid" : factor <= 3 ? "good" : factor <= 10 ? "mid" : "work";
    return {
      ...base,
      hasData: true,
      n: oneshotN + decomposeN,
      headline: `${fmtFactor(factor)}×`,
      headlineLabel: "your typical miss, in factors of ten",
      verdict,
      tone,
      needsPractice: clamp((meanLog / 1.5) * 100),
    };
  }

  // Only decompositions so far.
  return {
    ...base,
    hasData: true,
    n: decomposeN,
    headline: `${beatGut}/${decomposeN}`,
    headlineLabel: "times decomposing beat your gut guess",
    verdict: `Across ${decomposeN} decomposition${decomposeN === 1 ? "" : "s"}, breaking the problem into pieces beat your gut ${beatGut} time${beatGut === 1 ? "" : "s"} — that's the whole case for the method, measured on you. Try a one-shot round to score your raw number sense.`,
    tone: "mid",
    needsPractice: 40,
  };
}

function updateProfile(r: UpdateRecord | null): TrainerProfile {
  const base = {
    id: "update" as const,
    name: "Base rates",
    route: "/update",
    question: "How much should new evidence move you?",
    trend: updateTrend(r),
  };

  const n = r?.n ?? 0;
  const sumAbsErr = r?.sumAbsErr ?? 0;
  const sumSignedErr = r?.sumSignedErr ?? 0;
  const priorN = r?.prior?.n ?? 0;
  const priorSigned = r?.prior?.sumSigned ?? 0;
  const premium = priorN > 0 ? priorSigned / priorN : 0;

  if (n === 0 && priorN === 0) {
    return {
      ...base,
      hasData: false,
      n: 0,
      headline: null,
      headlineLabel: "your typical miss, in points",
      verdict:
        "A 99%-accurate test for a 1-in-1,000 disease comes back positive. Your odds aren't 99% — they're about 9%. Learn why.",
      tone: "none",
      needsPractice: null,
    };
  }

  // A word on the pick-the-prior drills, when they've accumulated enough to
  // mean something — appended to whichever verdict applies below.
  const premiumNote =
    priorN >= 3 && Math.abs(premium) >= 15
      ? ` And in the pick-the-prior drills your gut runs about ${Math.abs(Math.round(premium))} points ${premium >= 0 ? "above" : "below"} the outside view.`
      : "";

  // Only pick-the-prior data so far: the inside-view premium is the number.
  if (n === 0) {
    const lean = Math.abs(Math.round(premium));
    const verdict =
      priorN < 3
        ? `Early days — across ${priorN} pick-the-prior drill${priorN === 1 ? "" : "s"}, your gut ran ${lean} point${lean === 1 ? "" : "s"} ${premium >= 0 ? "above" : "below"} the outside view. A few more and the lean means something.`
        : premium >= 15
          ? `Across ${priorN} pick-the-prior drills, your gut runs about ${lean} points above the outside view — your case keeps feeling like the exception.`
          : premium <= -15
            ? `Across ${priorN} pick-the-prior drills, your gut runs about ${lean} points below the outside view — gloomier than the record.`
            : `Across ${priorN} pick-the-prior drills, your gut stays close to the outside view — your instincts already consult the record.`;
    return {
      ...base,
      hasData: true,
      n: priorN,
      headline: `${premium >= 0 ? "+" : ""}${Math.round(premium)} pts`,
      headlineLabel: "inside-view premium (gut − outside view)",
      verdict,
      tone: priorN < 3 ? "mid" : Math.abs(premium) >= 15 ? "work" : "good",
      needsPractice: priorN < 3 ? 40 : clamp((Math.abs(premium) / 40) * 100),
    };
  }

  const typicalMiss = Math.round(sumAbsErr / n);
  const bias = sumSignedErr / n;
  const leansHigh = bias >= 5;
  const leansLow = bias <= -5;
  const lean = Math.abs(Math.round(bias));

  const verdict =
    (n < 6
      ? `Early days — across ${n} update${n === 1 ? "" : "s"}, your typical miss is ${typicalMiss} point${typicalMiss === 1 ? "" : "s"}. A round or two more and your lean means something.`
      : leansHigh
        ? `You come in about ${lean} points high on average — the classic base-rate-neglect signature: trusting the test and underweighting how rare the thing is.`
        : leansLow
          ? `You come in about ${lean} points low on average — erring cautious, underweighting evidence that genuinely should move you.`
          : `Your highs and lows roughly cancel — you're weighing evidence against the base rate, not anchoring on either. Typical miss: ${typicalMiss} points.`) +
    premiumNote;

  const tone: Tone =
    n < 6 ? "mid" : leansHigh ? "work" : leansLow ? "mid" : typicalMiss <= 12 ? "good" : "mid";

  // The size of the miss, a persistent high lean, and a fat inside-view premium
  // all argue for practice.
  const needs = Math.max(
    (typicalMiss / 30) * 100,
    leansHigh ? (lean / 20) * 100 + 30 : 0,
    priorN >= 3 ? (Math.abs(premium) / 40) * 100 : 0
  );

  return {
    ...base,
    hasData: true,
    n: n + priorN,
    headline: `${typicalMiss} pts`,
    headlineLabel: "your typical miss, in points",
    verdict,
    tone,
    needsPractice: clamp(needs),
  };
}

/** Read all three trainer records from the browser and normalize them. */
export function loadProfiles(): TrainerProfile[] {
  return [
    calibrateProfile(read<CalibrateRecord>(CALIBRATE_KEY)),
    estimateProfile(read<EstimateRecord>(ESTIMATE_KEY)),
    updateProfile(read<UpdateRecord>(UPDATE_KEY)),
  ];
}

export type Suggestion = {
  profile: TrainerProfile;
  /** Why this one — phrased for the reader. */
  reason: string;
};

/**
 * Where to spend the next ten minutes. Untouched trainers come first (in the
 * order the skills build on each other); otherwise the one with the most to
 * gain. Returns null only if all three are in good shape with real data.
 */
export function suggestNext(profiles: TrainerProfile[]): Suggestion | null {
  const untouched = profiles.filter((p) => !p.hasData);
  if (untouched.length > 0) {
    // Canonical build order: width of uncertainty → getting a number → moving it.
    const order = ["calibrate", "estimate", "update"];
    const next = [...untouched].sort(
      (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
    )[0];
    return {
      profile: next,
      reason:
        untouched.length === profiles.length
          ? "Start here — it's the most quickly trainable of the three, and you'll feel the shift in a single round."
          : "You haven't tried this one yet — it's the missing leg of the set.",
    };
  }

  const ranked = [...profiles]
    .filter((p) => p.needsPractice !== null)
    .sort((a, b) => (b.needsPractice ?? 0) - (a.needsPractice ?? 0));

  const top = ranked[0];
  if (!top || (top.needsPractice ?? 0) < 25) return null;

  return {
    profile: top,
    reason:
      top.tone === "work"
        ? "This is where your numbers are furthest from honest right now — the highest-leverage place to practise."
        : "A few more rounds here would sharpen the weakest of your three.",
  };
}
