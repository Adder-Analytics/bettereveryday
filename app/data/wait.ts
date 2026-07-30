/**
 * The cooling-off tool's wait payoff, read as a scoreboard.
 *
 * The whole case for `/cool` is a *bet*: on a reversible call with no real
 * clock, the calm version of you makes a better decision than the hot one, so
 * waiting is nearly free and worth it. The tool asks people to make that bet
 * dozens of times. The one place it's ever settled with data instead of a maxim
 * is the person's own graded returns — of the calls you parked and came back to
 * decide cold, how often did the wait actually move the answer?
 *
 * That reading already lived inside `/cool`. But `/practice` is the site's one
 * place for *what your record says about you* — it holds the trainers' warm-up
 * scores and the journal's real-world calibration gap. The wait payoff is a
 * third reading of the same kind (how sure you are · whether you're right ·
 * whether waiting helps), and it belonged there too. This module reads the
 * parked store the cooling-off tool writes (`cool:parked:v1`) and folds it into
 * one profile the Practice hub can show beside the other two.
 *
 * Like `trainers.ts` and `journal.ts`, it deliberately never *writes* — the
 * cooling-off tool owns the parked store. This is the read side only, so adding
 * it can't regress the tool. And `waitReadingText` below is the single source
 * of the reading sentence, imported by both `/cool` and this hub, so the two
 * can never disagree about the same record.
 */

import { loadParked, parkedWaitRecord, type WaitRecord } from "./parked";
import type { Tone } from "./trainers";

/** Graded returns below this many say more about luck than about you — show the
 *  honest count, not a headline percentage. Mirrors the journal's RESULTING_MIN:
 *  one or two isn't a pattern. */
const GRADED_MIN = 3;

/**
 * The one-line reading of the wait, in plain language. It answers the empirical
 * question the whole tool is built on — *does sleeping on it change my mind?* —
 * from the calls you've come back and graded, and it doesn't editorialize past
 * what the counts support. This is the single source of the sentence: `/cool`
 * and `/practice` both call it, so they can never word it differently.
 */
export function waitReadingText(r: WaitRecord): string {
  const { graded, changed, same } = r;
  const call = (n: number) => `${n} call${n === 1 ? "" : "s"}`;
  if (changed === 0) {
    return `Of the ${call(graded)} you’ve come back and decided cold, the wait changed none of them — the calm you keeps agreeing with the hot you. Either your gut runs cooler than it feels, or the graded set is still small.`;
  }
  if (same === 0) {
    return `Every one of the ${call(graded)} you’ve decided cold came out different from the hot version. On your record so far, waiting earns its keep — the heat was doing your arithmetic.`;
  }
  const pct = Math.round((changed / graded) * 100);
  return `Across the ${call(graded)} you’ve decided cold, sleeping on it changed the call ${changed === 1 ? "once" : `${changed} times`} and left it the same ${same === 1 ? "once" : `${same} times`} — about ${pct}% of the time, the wait moved the answer. That’s the share of hot calls you’d have gotten wrong on the spot.`;
}

export type WaitProfile = {
  /** Any parked history at all — something waiting, or something resolved. */
  hasData: boolean;
  /** Parked calls still waiting to be decided cold. */
  waiting: number;
  /** Parked calls you came back and resolved (decided cold or let go). */
  resolved: number;
  /** Of those, how many you graded (said same/changed) — the meaningful
   *  denominator. */
  graded: number;
  /** Graded ones where cooling changed the call. */
  changed: number;
  /** Graded ones where the cold call matched the hot one. */
  same: number;
  /** The headline number, already formatted — null until enough graded returns
   *  to promote a percentage past noise. */
  headline: string | null;
  headlineLabel: string;
  /** A plain-language reading of where you stand. */
  verdict: string;
  tone: Tone;
};

/** Read the parked store from the browser and fold it into one profile. */
export function loadWaitProfile(): WaitProfile {
  const all = loadParked();
  const waiting = all.filter((p) => !p.resolvedOn && !!p.decision.trim()).length;
  const record: WaitRecord = parkedWaitRecord();
  const { resolved, graded, changed, same } = record;

  const base = {
    hasData: all.length > 0,
    waiting,
    resolved,
    graded,
    changed,
    same,
  };

  // Nothing parked ever: the invitation.
  if (all.length === 0) {
    return {
      ...base,
      headline: null,
      headlineLabel: "of your cooled calls, the wait moved the answer",
      verdict:
        "The cooling-off tool settles one bet — on a reversible call with no real clock, is the calm version of you worth waiting for? Park a hot decision there, come back and decide it cold, and say whether the wait changed anything. The answer to “does sleeping on it actually change my mind?” accrues here.",
      tone: "none",
    };
  }

  // Parked but nothing graded yet: the record is in the mail.
  if (graded === 0) {
    const verdict =
      resolved > 0
        ? `${resolved} cooled call${resolved === 1 ? "" : "s"} decided, none graded yet. On your next cold return, say whether waiting changed the call — that’s the one fact this reading needs.`
        : `${waiting} decision${waiting === 1 ? "" : "s"} parked and waiting to be decided cold. Come back and grade one, and this starts to answer whether sleeping on it moves you.`;
    return {
      ...base,
      headline: null,
      headlineLabel: "of your cooled calls, the wait moved the answer",
      verdict,
      tone: resolved > 0 ? "work" : "mid",
    };
  }

  // Graded, but too few to promote a percentage: the honest sentence, no big
  // number. The sentence itself caveats a small set.
  if (graded < GRADED_MIN) {
    return {
      ...base,
      headline: null,
      headlineLabel: "of your cooled calls, the wait moved the answer",
      verdict: waitReadingText(record),
      tone: changed > 0 ? "good" : "mid",
    };
  }

  // Enough to read: promote the share the wait actually moved, and say it plain.
  const pct = Math.round((changed / graded) * 100);
  return {
    ...base,
    headline: `${pct}%`,
    headlineLabel: "of your cooled calls, the wait moved the answer",
    verdict: waitReadingText(record),
    tone: changed > 0 ? "good" : "mid",
  };
}
