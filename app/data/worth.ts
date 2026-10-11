/**
 * The read behind "Is It Worth the Time?" (/worth).
 *
 * The everyday trade between time and money: pay for delivery or a cleaner,
 * drive across town to save a fiver, take the cheaper flight with the layover,
 * the cheaper flat with the longer commute. People make these calls on feel,
 * and the feel is unreliable in two well-measured ways:
 *
 *   - Relative thinking. Tversky and Kahneman (Science, 1981) found far more
 *     people would drive 20 minutes to save $5 on a $15 calculator than on a
 *     $125 one. The $5 and the 20 minutes are the same; only the percentage
 *     changed. So small savings on cheap things get chased and large savings
 *     on big purchases get waved away.
 *   - Time is harder to account for than money. Saini and Monga (JCR, 2008)
 *     found decisions about spending time lean more on heuristics than
 *     decisions about spending money, and the gap closed when people were
 *     prompted to account for the time.
 *
 * The fix is one division: the trade's price per hour, set against your own
 * price for an hour like that one. Whillans et al. (PNAS, 2017) add why it's
 * worth doing: buying time was linked to greater life satisfaction, yet very
 * few people think to spend money that way.
 *
 * The read, checked in order:
 *   1. "trivial"  — the gap between the options, over a year, is worth less
 *                   than fifteen minutes of your time. Pick either.
 *   2. "close"    — the trade's rate is within a quarter of your line. Let
 *                   whichever is tighter, time or money, decide.
 *   3. pay-to-save-time: "buy" (cheaper than your line) or "keep" (dearer).
 *      spend-time-to-save-money: "worth" (pays better than your line) or
 *      "notworth" (pays worse).
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { formatHours, hoursInDays, parseHours } from "./later";

/** Which way the trade runs. */
export type Direction = "" | "pay" | "save";
/** How often the money or the time recurs. */
export type Period = "" | "once" | "day" | "workday" | "week" | "month" | "year";
/** Which is scarcer right now. */
export type Tight = "" | "time" | "money" | "neither";

export type WorthInputs = {
  what: string;
  dir: Direction;
  money: string;
  moneyPer: Period;
  time: string;
  timePer: Period;
  /** What the hour would be spent doing: "commuting", "cooking". */
  hour: string;
  line: string;
  price: string;
  tight: Tight;
};

export const BLANK_WORTH: WorthInputs = {
  what: "",
  dir: "",
  money: "",
  moneyPer: "once",
  time: "",
  timePer: "once",
  hour: "",
  line: "",
  price: "",
  tight: "",
};

export type WorthKind = "trivial" | "close" | "buy" | "keep" | "worth" | "notworth";

export type WorthRead = {
  kind: WorthKind;
  /** Money per hour the trade works out at. */
  rate: number;
  /** Your price for an hour like this one. */
  line: number;
  /** rate / line. */
  ratio: number;
  /** Money and hours over a year (a one-off counts once). */
  yearMoney: number;
  yearHours: number;
  /** Which way a close call leans, from which is tighter. "" until answered. */
  lean: "" | "time" | "money" | "either";
};

/** How many times a year each period comes round. A one-off counts once. */
export const PER_YEAR: Record<Exclude<Period, "">, number> = {
  once: 1,
  day: 365,
  workday: 230,
  week: 52,
  month: 12,
  year: 1,
};

export const PERIOD_LABEL: Record<Exclude<Period, "">, string> = {
  once: "once",
  day: "a day",
  workday: "each working day",
  week: "a week",
  month: "a month",
  year: "a year",
};

/**
 * Parse an amount of money the way people type it: "40", "£40", "$1,200",
 * "12.50", "12,50", "1.5k". Blank, unreadable or negative → null.
 */
export function parseMoney(raw: string): number | null {
  let s = raw.trim().toLowerCase().replace(/[£$€\s]/g, "");
  if (!s) return null;
  let mult = 1;
  if (s.endsWith("k")) {
    mult = 1000;
    s = s.slice(0, -1);
  }
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s) * mult;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** True when a field has text that can't be read as money. */
export function moneyInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseMoney(raw) === null;
}

/** The currency the person typed, so answers come back in it. Defaults to £. */
export function currencyOf(inp: WorthInputs): string {
  for (const raw of [inp.money, inp.line, inp.price]) {
    const m = raw.match(/[£$€]/);
    if (m) return m[0];
  }
  return "£";
}

/** "£40", "£1,200", "£7.50", "£0.80". Whole numbers from 20 up. */
export function formatMoney(n: number, cur: string): string {
  const whole = n >= 20 || Number.isInteger(Math.round(n * 100) / 100);
  const txt = whole
    ? Math.round(n).toLocaleString("en-GB")
    : n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${cur}${txt}`;
}

/** True when one amount is a one-off and the other recurs. */
export function mixedPeriods(inp: WorthInputs): boolean {
  const a = inp.moneyPer === "once";
  const b = inp.timePer === "once";
  return Boolean(inp.moneyPer && inp.timePer) && a !== b;
}

/** True when both amounts recur, so the trade is a habit, not a one-off. */
export function recurring(inp: WorthInputs): boolean {
  return inp.moneyPer !== "" && inp.moneyPer !== "once" && inp.timePer !== "" && inp.timePer !== "once";
}

/** A trade is close when its rate is within a quarter of your line. */
export const CLOSE_LOW = 0.8;
export const CLOSE_HIGH = 1.25;

/**
 * The read so far, or null while a number it needs is missing.
 */
export function readWorth(inp: WorthInputs): WorthRead | null {
  if (!inp.dir || !inp.moneyPer || !inp.timePer) return null;
  const money = parseMoney(inp.money);
  const hours = parseHours(inp.time);
  const line = parseMoney(inp.line);
  if (!money || !hours || !line) return null;

  const yearMoney = money * PER_YEAR[inp.moneyPer];
  const yearHours = hours * PER_YEAR[inp.timePer];
  const rate = yearMoney / yearHours;
  const ratio = rate / line;
  const lean: WorthRead["lean"] =
    inp.tight === "time" ? "time" : inp.tight === "money" ? "money" : inp.tight === "neither" ? "either" : "";
  const base = { rate, line, ratio, yearMoney, yearHours, lean };

  // What the option you'd be giving up is worth, against the other, over a
  // year. Under fifteen minutes of your own time, and the weighing already
  // cost more than the difference.
  const gap = Math.abs(yearMoney - yearHours * line);
  if (gap < line * 0.25) return { kind: "trivial", ...base };

  if (ratio >= CLOSE_LOW && ratio <= CLOSE_HIGH) return { kind: "close", ...base };

  if (inp.dir === "pay") return { kind: ratio < 1 ? "buy" : "keep", ...base };
  return { kind: ratio > 1 ? "worth" : "notworth", ...base };
}

/** The answer's headline: the words printed largest, and spoken. */
export function worthHeadline(inp: WorthInputs, read: WorthRead): string {
  switch (read.kind) {
    case "trivial":
      return "Too small to weigh. Pick either.";
    case "buy":
      return "Buy the time.";
    case "keep":
      return "Keep the money.";
    case "worth":
      return "Worth your time.";
    case "notworth":
      return "Not worth your time.";
    case "close":
      if (read.lean === "either") return "Close enough that either is fine.";
      if (read.lean === "time")
        return inp.dir === "pay" ? "Close. Buy the time: it's the tighter one." : "Close. Keep the time: it's the tighter one.";
      if (read.lean === "money")
        return inp.dir === "pay" ? "Close. Keep the money: it's the tighter one." : "Close. Take the saving: money's the tighter one.";
      return "Too close for the arithmetic.";
  }
}

/** The trade's price per hour, said the way the read says it. */
export function rateSentence(inp: WorthInputs, read: WorthRead): string {
  const cur = currencyOf(inp);
  const r = formatMoney(read.rate, cur);
  const l = formatMoney(read.line, cur);
  return inp.dir === "pay"
    ? `You'd be paying ${r} an hour to get this time back. Your price for an hour like it is ${l}.`
    : `You'd be earning ${r} an hour, tax-free, by spending the time. Your price for an hour like it is ${l}.`;
}

/**
 * Relative thinking, caught in the act. When the saving or fee is a big share
 * of a small price, or a small share of a big one, the percentage is pulling
 * on the call. Returns a note only when it would push against the read.
 */
export function relativeNote(inp: WorthInputs, read: WorthRead): string | null {
  const money = parseMoney(inp.money);
  const price = parseMoney(inp.price);
  if (!money || !price || price <= 0) return null;
  const share = money / price;
  const cur = currencyOf(inp);
  const m = formatMoney(money, cur);
  const pct = Math.round(share * 100);
  if (share >= 0.2 && (read.kind === "notworth" || read.kind === "buy")) {
    return inp.dir === "save"
      ? `${pct}% off sounds like a lot. It's still ${m}, and the only question is whether ${m} is worth the time. Would you do the same for ${m} off something costing ${formatMoney(money * 25, cur)}? It's the same ${m}.`
      : `A ${m} charge on ${formatMoney(price, cur)} feels steep because it's ${pct}% of it. The order size doesn't change what the hour is worth to you.`;
  }
  if (share <= 0.05 && (read.kind === "worth" || read.kind === "keep")) {
    return inp.dir === "save"
      ? `It's only ${pct || "under 1"}% of the price, which makes it easy to wave away. It's still ${m}. You'd chase ${m} off something costing ${formatMoney(money * 3, cur)}, and it's the same money.`
      : `${m} disappears inside ${formatMoney(price, cur)}, which makes it easy to wave through. It's still ${m} for this time, the same as if it were the whole bill.`;
  }
  return null;
}

/** "52 hours and £2,080 a year", for a trade that recurs. */
export function yearSentence(inp: WorthInputs, read: WorthRead): string | null {
  if (!recurring(inp) && !mixedPeriods(inp)) return null;
  const cur = currencyOf(inp);
  const days = hoursInDays(read.yearHours);
  return `Over a year that's ${formatHours(read.yearHours)}${days ? ` (${days})` : ""} and ${formatMoney(read.yearMoney, cur)}.`;
}

/**
 * The line as a standing rule: the reusable part of the answer. Pricing your
 * time over and over has a cost of its own (DeVoe and House, JESP, 2012, found
 * people prompted to think of their hourly wage enjoyed leisure less), so the
 * point is to set the number once and stop.
 */
export function lineRule(inp: WorthInputs, read: WorthRead): string {
  const cur = currencyOf(inp);
  const l = formatMoney(read.line, cur);
  const hour = hourName(inp);
  return `My line for ${hour ? `an hour of ${hour}` : "an hour like this"}: ${l}. I'll pay up to ${l} an hour to skip it, and I won't spend the hour to save less than ${l}.`;
}

/** What the hour is spent on, lowered for mid-sentence use, or "" if blank. */
export function hourName(inp: WorthInputs): string {
  const s = inp.hour.trim().replace(/[.!?\s]+$/, "");
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** The trade, for mid-sentence use, with a fallback that's never blank. */
export function whatName(inp: WorthInputs): string {
  const s = inp.what.trim().replace(/[.!?\s]+$/, "");
  if (!s) return "this";
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** The plain-text record, for notes or a message to yourself. */
export function worthSummary(inp: WorthInputs, read: WorthRead): string {
  const cur = currencyOf(inp);
  const lines: string[] = [];
  if (inp.what.trim()) lines.push(inp.what.trim());
  const money = parseMoney(inp.money);
  const hours = parseHours(inp.time);
  if (money && hours && inp.moneyPer && inp.timePer) {
    const m = `${formatMoney(money, cur)} ${PERIOD_LABEL[inp.moneyPer]}`;
    const t = `${formatHours(hours)} ${PERIOD_LABEL[inp.timePer]}`;
    lines.push(inp.dir === "pay" ? `Pay ${m} to save ${t}` : `Spend ${t} to save ${m}`);
  }
  lines.push(`Works out at ${formatMoney(read.rate, cur)} an hour, against my line of ${formatMoney(read.line, cur)}.`);
  const yr = yearSentence(inp, read);
  if (yr) lines.push(yr);
  lines.push("");
  lines.push(worthHeadline(inp, read));
  lines.push("");
  lines.push(lineRule(inp, read));
  return lines.join("\n");
}

const DIRS: Direction[] = ["pay", "save"];
const PERIODS: Period[] = ["once", "day", "workday", "week", "month", "year"];
const TIGHTS: Tight[] = ["time", "money", "neither"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseWorthInputs(raw: unknown): WorthInputs {
  if (!raw || typeof raw !== "object") return BLANK_WORTH;
  const v = raw as Record<string, unknown>;
  const str = (k: keyof WorthInputs) => (typeof v[k] === "string" ? (v[k] as string) : "");
  return {
    what: str("what"),
    dir: oneOf(v.dir, DIRS),
    money: str("money"),
    moneyPer: oneOf(v.moneyPer, PERIODS) || "once",
    time: str("time"),
    timePer: oneOf(v.timePer, PERIODS) || "once",
    hour: str("hour"),
    line: str("line"),
    price: str("price"),
    tight: oneOf(v.tight, TIGHTS),
  };
}

/**
 * The worked example: a cheaper flat further out. £250 a month less rent for
 * 50 more minutes of commuting each working day. It feels like a good deal,
 * and it works out at about £16 an hour for the least-liked hour of the day.
 */
export const WORTH_EXAMPLE: WorthInputs = {
  what: "Take the cheaper flat further out",
  dir: "save",
  money: "£250",
  moneyPer: "month",
  time: "50 min",
  timePer: "workday",
  hour: "commuting",
  line: "£20",
  price: "£1,400",
  tight: "time",
};
