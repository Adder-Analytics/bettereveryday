/**
 * The decision journal, read as a scoreboard.
 *
 * The three trainers grade you on trivia with answer keys; the journal grades
 * you on the bets reality settles. It has computed a calibration table and a
 * resulting grid inside /decide for a while — but only inside /decide. This
 * module reads the same localStorage key the journal writes (decide:log:v1)
 * and folds it into one profile the Practice hub can show beside the trainers,
 * so the warm-up scores and the real score finally sit on one page.
 *
 * Like app/data/trainers.ts, it deliberately never writes — the journal owns
 * its log. This is the read side only, so adding it can't regress the journal.
 * The thresholds below mirror the journal's own (CALIBRATION_MIN, the good/bad
 * outcome axis, Annie Duke's resulting cells), so the hub and the journal
 * never disagree about the same record.
 */

import type { Tone, Trend } from "./trainers";

/* The subset of the journal's LogEntry this module reads. Mirrors the type
   declared in DecideClient; the loader below tolerates missing or malformed
   fields so an older or hand-edited log degrades to "no data", not a throw. */
type LogEntryish = {
  decidedOn?: unknown;
  reviewOn?: unknown;
  reviewedOn?: unknown;
  confidence?: unknown;
  outcomeQuality?: unknown;
  decisionQuality?: unknown;
};

const LOG_KEY = "decide:log:v1";

/** Below this many scored reviews, show counts — the numbers say more about
 *  luck than calibration. Mirrors the journal's own CALIBRATION_MIN. */
const CALIBRATION_MIN = 4;
/** Mirrors the journal's RESULTING_MIN: one or two reviews isn't a pattern. */
const RESULTING_MIN = 3;
/** Scored reviews per half before the real-world trend will speak — the same
 *  bar the journal sets before calling anything calibration at all. */
const TREND_MIN_PER_HALF = CALIBRATION_MIN;
/** Days between your first and latest scored forecast before "over time"
 *  means anything here. The journal runs on review dates months out, so its
 *  eras are longer than the trainers'. */
const TREND_MIN_SPAN = 28;

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function readLog(): LogEntryish[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => e && typeof e === "object") : [];
  } catch {
    return [];
  }
}

/** Entries whose review date has arrived and that haven't been reviewed.
 *  The one journal number worth chasing you around the site with. */
export function countDueReviews(): number {
  const today = todayISO();
  return readLog().filter(
    (e) => !e.reviewedOn && typeof e.reviewOn === "string" && e.reviewOn <= today
  ).length;
}

export type JournalProfile = {
  /** Any entries logged at all? */
  hasLog: boolean;
  /** Total decisions logged. */
  total: number;
  /** Unreviewed entries whose review date has arrived. */
  due: number;
  /** Unreviewed entries whose review date hasn't arrived yet. */
  awaiting: number;
  /** Reviewed entries with a confidence and a settled (good/bad) outcome —
   *  the ones that can be scored like a forecast. */
  scored: number;
  /** Of the scored entries, how many went as expected. */
  hits: number;
  /** Mean confidence claimed across scored entries, in points. */
  claimedMean: number | null;
  /** Actual hit rate across scored entries, in points. */
  actualRate: number | null;
  /** claimed − actual, rounded. The real-world overconfidence gap. */
  gap: number | null;
  /** Reviewed entries where outcome and decision quality were both graded. */
  resultingScored: number;
  /** Of those, how many the outcome and your own judgement disagree on —
   *  good calls that got unlucky plus bad calls that got lucky. */
  divergences: number;
  /** The single number to show big, already formatted — null until scorable. */
  headline: string | null;
  headlineLabel: string;
  /** A plain-language reading of where you stand. */
  verdict: string;
  tone: Tone;
  /** Your first scored forecasts vs your latest — the real-world trend.
   *  Null until each half holds enough reviews and the record spans a month. */
  trend: Trend | null;
};

/**
 * The trend on the bets that count: split the scored entries by when the
 * forecast was *made* (decidedOn — the moment being graded), and compare the
 * overconfidence gap of the first half against the latest. Entries are split
 * by count, not calendar, so both eras carry the same weight.
 */
function journalTrend(scorable: LogEntryish[]): Trend | null {
  const dated = scorable.filter(
    (e) => typeof e.decidedOn === "string" && e.decidedOn
  );
  if (dated.length < TREND_MIN_PER_HALF * 2) return null;
  const sorted = [...dated].sort((a, b) =>
    (a.decidedOn as string) < (b.decidedOn as string) ? -1 : 1
  );
  const first = new Date(`${sorted[0].decidedOn as string}T00:00:00`).getTime();
  const last = new Date(
    `${sorted[sorted.length - 1].decidedOn as string}T00:00:00`
  ).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
  if (Math.round((last - first) / 86_400_000) < TREND_MIN_SPAN) return null;

  const cut = Math.floor(sorted.length / 2);
  const gapOf = (half: LogEntryish[]) => {
    const claimed =
      half.reduce((s, e) => s + (e.confidence as number), 0) / half.length;
    const actual =
      (half.filter((e) => e.outcomeQuality === "good").length / half.length) *
      100;
    return Math.round(claimed - actual);
  };
  const early = sorted.slice(0, cut);
  const late = sorted.slice(cut);
  const earlyGap = gapOf(early);
  const lateGap = gapOf(late);
  const delta = Math.abs(earlyGap) - Math.abs(lateGap);
  const [reading, tone]: [string, Tone] =
    delta >= 8
      ? ["On the bets that count, your word is getting better — the gap between claimed and actual is closing.", "good"]
      : delta <= -8
        ? ["The gap between how sure you were and how things went has widened across your record — worth a look at what changed.", "work"]
        : Math.abs(lateGap) <= 7
          ? ["Steady and close — on real bets, your word holds.", "good"]
          : ["Holding steady. Real reviews accrue slowly — direction here is measured in months, not weeks.", "mid"];
  return {
    earlyLabel: `first ${early.length} decisions`,
    early: `${earlyGap >= 0 ? "+" : ""}${earlyGap} pt gap`,
    lateLabel: `latest ${late.length}`,
    late: `${lateGap >= 0 ? "+" : ""}${lateGap} pt gap`,
    reading,
    tone,
  };
}

/** Read the journal's log from the browser and fold it into one profile. */
export function loadJournalProfile(): JournalProfile {
  const log = readLog();
  const today = todayISO();

  const total = log.length;
  const unreviewed = log.filter((e) => !e.reviewedOn);
  const due = unreviewed.filter(
    (e) => typeof e.reviewOn === "string" && e.reviewOn <= today
  ).length;
  const awaiting = unreviewed.length - due;

  const scorable = log.filter(
    (e) =>
      e.reviewedOn &&
      typeof e.confidence === "number" &&
      (e.outcomeQuality === "good" || e.outcomeQuality === "bad")
  );
  const scored = scorable.length;
  const hits = scorable.filter((e) => e.outcomeQuality === "good").length;
  const claimedMean =
    scored > 0
      ? scorable.reduce((s, e) => s + (e.confidence as number), 0) / scored
      : null;
  const actualRate = scored > 0 ? (hits / scored) * 100 : null;
  const gap =
    claimedMean !== null && actualRate !== null
      ? Math.round(claimedMean - actualRate)
      : null;

  const resulting = scorable.filter(
    (e) => e.decisionQuality === "again" || e.decisionQuality === "different"
  );
  const resultingScored = resulting.length;
  const divergences = resulting.filter(
    (e) =>
      (e.outcomeQuality === "good") !== (e.decisionQuality === "again")
  ).length;

  const base = {
    hasLog: total > 0,
    total,
    due,
    awaiting,
    scored,
    hits,
    claimedMean,
    actualRate,
    gap,
    resultingScored,
    divergences,
    trend: journalTrend(scorable),
  };

  // Nothing logged yet: the invitation state.
  if (total === 0) {
    return {
      ...base,
      headline: null,
      headlineLabel: "real-world overconfidence gap (claimed − actual)",
      verdict:
        "The trainers grade you on trivia with answer keys. This column is for the bets reality settles — log a real decision with a forecast, and your actual record starts accumulating here.",
      tone: "none",
    };
  }

  // Logged but nothing scorable yet: the record is in the mail.
  if (scored === 0) {
    const verdict =
      due > 0
        ? `${total} decision${total === 1 ? "" : "s"} logged, and ${due} ${due === 1 ? "is" : "are"} due for review — your first real data point${due === 1 ? " is" : "s are"} waiting in the journal.`
        : `${total} decision${total === 1 ? "" : "s"} logged, none scored yet. The record fills in as reviews come due — that's the part memory can't fake.`;
    return {
      ...base,
      headline: null,
      headlineLabel: "real-world overconfidence gap (claimed − actual)",
      verdict,
      tone: due > 0 ? "work" : "mid",
    };
  }

  // A note on resulting divergences, once there are enough graded pairs for
  // the counts to mean anything — appended to whichever verdict applies.
  const divergenceNote =
    resultingScored >= RESULTING_MIN && divergences > 0
      ? ` And in ${divergences} of ${resultingScored} reviews, the outcome and your own judgement of the call disagreed — your own proof that results don't grade decisions.`
      : "";

  // Scored, but too few to call it calibration: honest counts only.
  if (scored < CALIBRATION_MIN) {
    return {
      ...base,
      headline: `${hits}/${scored}`,
      headlineLabel: "of your reviewed calls went as expected",
      verdict:
        `Early days — ${hits} of your ${scored} scored review${scored === 1 ? "" : "s"} went the way you predicted. A few more and your real-world gap starts to mean something.` +
        divergenceNote,
      tone: "mid",
    };
  }

  // Enough to read: the real-world overconfidence gap, same ±7 line the
  // trainers use for a claimed-vs-actual gap.
  const g = gap as number;
  const verdict =
    (Math.abs(g) <= 7
      ? `Across ${scored} reviewed decisions, your claimed confidence matched reality within ${Math.abs(g)} point${Math.abs(g) === 1 ? "" : "s"} — on the bets that count, your word is close to good.`
      : g > 7
        ? `Across ${scored} reviewed decisions, things went as expected ${g} points less often than you were sure they would — the overconfidence the trainers warm you up against, showing up in your real bets.`
        : `Across ${scored} reviewed decisions, things went as expected ${Math.abs(g)} points more often than you claimed — on real bets you're underselling your own judgement.`) +
    divergenceNote;

  return {
    ...base,
    headline: `${g >= 0 ? "+" : ""}${g} pts`,
    headlineLabel: "real-world overconfidence gap (claimed − actual)",
    verdict,
    tone: Math.abs(g) <= 7 ? "good" : g > 7 ? "work" : "mid",
  };
}
