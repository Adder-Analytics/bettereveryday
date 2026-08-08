/**
 * Dated day-buckets: the plumbing under "are you getting better?"
 *
 * Every trainer keeps a lifetime record as running sums — the right shape for
 * a headline, and structurally unable to answer the site's own name. A trend
 * needs time in the data, so the trainers now also fold each answer into a
 * per-day bucket: one small object per calendar day you practised, merged in
 * place, capped, and stored inside the same record the trainer already owns.
 *
 * Day-resolution is deliberate. Per-answer timestamps would grow without
 * bound and invite reading tea leaves ("was 3pm worse than 9am?"); a day is
 * the smallest unit at which practice honestly accumulates, and ~400 buckets
 * is over a year of daily practice in a few kilobytes.
 *
 * The split below is by volume, not by calendar: "your first 30 answers vs
 * your latest 30" compares like with like even if the first 30 took a week
 * and the latest 30 took a month. Callers enforce their own minimums per
 * half — a trend computed on noise is astrology with axes.
 */

export type DayStamped = { d: string };

/** Over a year of daily practice; keeps the record a few KB at worst. */
export const MAX_DAYS = 400;

/** Days between the first and last bucket a trend must span before the site
 *  will call anything "over time". Two weeks is the honest minimum: a single
 *  sitting, however long, has no time axis. */
export const MIN_TREND_SPAN_DAYS = 14;

/** Local calendar date, yyyy-mm-dd — same convention as the journal. */
export function localDayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Fold one batch of results into today's bucket: merge if the day exists,
 * create it if not, keep the list sorted by date and capped at MAX_DAYS
 * (oldest dropped — the lifetime sums still remember everything).
 */
export function foldIntoDay<T extends DayStamped>(
  days: T[] | undefined,
  today: string,
  make: (d: string) => T,
  fold: (bucket: T) => T
): T[] {
  const list = Array.isArray(days) ? [...days] : [];
  const i = list.findIndex((b) => b.d === today);
  if (i >= 0) list[i] = fold(list[i]);
  else list.push(fold(make(today)));
  list.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return list.length > MAX_DAYS ? list.slice(list.length - MAX_DAYS) : list;
}

/** Whole days between the first and last bucket. 0 if fewer than two. */
export function spanDays(days: DayStamped[]): number {
  if (days.length < 2) return 0;
  const first = new Date(`${days[0].d}T00:00:00`).getTime();
  const last = new Date(`${days[days.length - 1].d}T00:00:00`).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last)) return 0;
  return Math.round((last - first) / 86_400_000);
}

/**
 * Split sorted buckets into an early half and a late half of roughly equal
 * *volume* (per the caller's weight — e.g. ranges answered that day). Buckets
 * with zero weight are ignored. Returns null when there aren't at least two
 * carrying buckets to split. Both halves are always non-empty.
 */
export function splitByWeight<T extends DayStamped>(
  days: T[],
  weight: (b: T) => number
): { early: T[]; late: T[] } | null {
  const list = days.filter((b) => weight(b) > 0);
  if (list.length < 2) return null;
  const total = list.reduce((s, b) => s + weight(b), 0);
  let acc = 0;
  let cut = list.length - 1; // late always keeps at least the last bucket
  for (let i = 0; i < list.length; i++) {
    acc += weight(list[i]);
    if (acc >= total / 2) {
      cut = Math.min(i + 1, list.length - 1);
      break;
    }
  }
  return { early: list.slice(0, cut), late: list.slice(cut) };
}

/**
 * The many-point generalization of splitByWeight, for a sparkline: divide the
 * carrying buckets (weight > 0) into contiguous windows of roughly equal
 * *volume*, oldest → newest, and return each window's buckets.
 *
 * The window count scales with how much you've actually done —
 * floor(total / minPer), clamped to [2, max] and never more than there are
 * buckets — so a thin record draws a coarse line and a thick one draws a
 * resolved curve, and no window is asked to carry much less than `minPer`. Each
 * bucket is placed by where its weight-midpoint falls, so one heavy day stays a
 * single point instead of being split across windows. Empty windows (a bucket
 * so heavy it spans several slots) collapse out, preserving order.
 *
 * Returns null when even two carrying windows can't be formed — the caller then
 * shows the two-number early/late read alone, with no line.
 */
export function windowByWeight<T extends DayStamped>(
  days: T[],
  weight: (b: T) => number,
  minPer: number,
  max: number
): T[][] | null {
  const list = days.filter((b) => weight(b) > 0);
  if (list.length < 2) return null;
  const total = list.reduce((s, b) => s + weight(b), 0);
  const count = Math.max(
    2,
    Math.min(max, list.length, Math.floor(total / minPer))
  );
  if (count < 2) return null;
  const windows: T[][] = Array.from({ length: count }, () => []);
  let acc = 0;
  for (const b of list) {
    const mid = acc + weight(b) / 2;
    const idx = Math.min(count - 1, Math.floor((mid / total) * count));
    windows[idx].push(b);
    acc += weight(b);
  }
  const nonEmpty = windows.filter((w) => w.length > 0);
  return nonEmpty.length >= 2 ? nonEmpty : null;
}
