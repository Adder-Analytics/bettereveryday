/**
 * The blind round's arithmetic (/round), kept apart from the UI so it can be
 * checked on its own.
 *
 * A group that has to settle on one number — how long, how much, how likely —
 * usually gets it by talking, and talking means someone says a number first.
 * Everyone after that adjusts from it (anchoring), the senior or the confident
 * voice pulls hardest, and the group ends up with one person's guess and
 * everyone's agreement. The fix in Kahneman, Sibony and Sunstein's *Noise*
 * (and in planning poker, and the Delphi method before both) is procedural:
 * everyone commits a number privately, the numbers are revealed at once, the
 * spread is discussed — starting with the people furthest apart — and then
 * everyone estimates again, privately. The group's number is the middle of the
 * second round.
 *
 * This module is the part of that procedure that is just arithmetic: reading a
 * typed number, finding the middle and the spread, sorting the spread into
 * "you agree", "talk briefly", or "you're not estimating the same thing", and
 * noticing when a second round collapsed onto one person's first answer —
 * agreement that might be deference, not persuasion.
 */

/** Read a number as people type it: "1,200", "$4.5k", "2m", "70%", "-3". */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/[,\s$€£¥%]/g, "");
  const m = /^(-?\d*\.?\d+)([kKmM])?$/.exec(s);
  if (!m) return null;
  let n = Number(m[1]);
  if (m[2] === "k" || m[2] === "K") n *= 1_000;
  if (m[2] === "m" || m[2] === "M") n *= 1_000_000;
  return Number.isFinite(n) ? n : null;
}

/** Print a number the way a person would say it back. */
export function formatNumber(n: number): string {
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export type Spread = "tight" | "some" | "wide";

export type RoundStats = {
  n: number;
  low: number;
  high: number;
  middle: number;
  /** Range as a share of the middle: 0.25 means the range is a quarter of it. */
  relSpread: number;
  /** High over low, when both are positive; null otherwise. */
  ratio: number | null;
  spread: Spread;
};

/**
 * The thresholds are deliberately plain. Within a fifth of the middle, the
 * estimates agree as well as estimates ever do and talking will mostly add
 * noise. Past about two-thirds — or once the high is double the low — the
 * group is almost certainly picturing different things (different scope,
 * different assumptions, a fact one person has), which is the useful finding.
 */
export function roundStats(values: number[]): RoundStats | null {
  if (values.length < 2) return null;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const middle = median(values);
  const base = Math.abs(middle) > 1e-9 ? Math.abs(middle) : Math.max(Math.abs(low), Math.abs(high), 1e-9);
  const relSpread = (high - low) / base;
  const ratio = low > 0 ? high / low : null;
  const spread: Spread =
    relSpread <= 0.2 ? "tight" : relSpread <= 0.66 && (ratio === null || ratio < 2) ? "some" : "wide";
  return { n: values.length, low, high, middle, relSpread, ratio, spread };
}

/** The headline for each kind of spread — shared by the card and the live region. */
export const SPREAD_HEADLINE: Record<Spread, string> = {
  tight: "You already agree.",
  some: "Close — talk briefly, then settle it.",
  wide: "You're not estimating the same thing.",
};

/**
 * After round two the talking is done, so "talk briefly" no longer applies:
 * either the group has its number, or it's still apart after hearing each
 * other, which says the gap was never about information.
 */
export function roundTwoHeadline(stats: RoundStats, fmt: (n: number) => string): string {
  return stats.spread === "wide"
    ? "Still far apart after hearing each other."
    : `The group's number: ${fmt(stats.middle)}.`;
}

/** The headline for whichever round is being read. */
export function roundHeadline(round: 1 | 2, stats: RoundStats, fmt: (n: number) => string): string {
  return round === 2 ? roundTwoHeadline(stats, fmt) : SPREAD_HEADLINE[stats.spread];
}

/**
 * Did the second round collapse onto one person's first answer? When everyone
 * else moves to exactly where one person already was, and that person didn't
 * move, the group may have been persuaded — or may simply have deferred.
 * Worth one question before the number is final. Returns the index of that
 * person, or null.
 */
export function collapsedOnto(
  first: (number | null)[],
  second: (number | null)[]
): number | null {
  const pairs = first
    .map((a, i) => ({ i, a, b: second[i] }))
    .filter((p): p is { i: number; a: number; b: number } => p.a !== null && p.b !== null);
  if (pairs.length < 3) return null;
  const close = (x: number, y: number) =>
    Math.abs(x - y) <= Math.max(Math.abs(y) * 0.02, 1e-9);
  for (const anchor of pairs) {
    if (!close(anchor.b, anchor.a)) continue;
    const others = pairs.filter((p) => p.i !== anchor.i);
    const allMovedThere = others.every((p) => close(p.b, anchor.a));
    const anyMoved = others.some((p) => !close(p.a, anchor.a));
    if (allMovedThere && anyMoved) return anchor.i;
  }
  return null;
}
