/**
 * The read behind "Pay Now or Pay Monthly?" (/monthly).
 *
 * The laptop at £649 or "12 payments of £59.99". The sofa, interest-free over
 * a year. The trainers in four instalments at the checkout. The phone at
 * £35.50 a month for two years. Each is the same call: pay the price today, or
 * spread it. People make it on the size of the instalment, and three things
 * tilt that:
 *
 *   - The payment hides the rate. Victor Stango and Jonathan Zinman (Journal of
 *     Finance, 2009) found people systematically underestimate the interest
 *     rate implied by a loan's payments (exponential growth bias), and the
 *     people who underestimate most borrow more. "£59.99 a month" doesn't say
 *     21% a year, so the tool says it.
 *   - Spreading takes the sting out. Drazen Prelec and George Loewenstein
 *     (Marketing Science, 1998) described the "pain of paying" that tempers
 *     spending; split a price into small pieces and most of the pain goes.
 *     Marco Di Maggio, Justin Katz and Emily Williams (NBER w30508, 2022) found
 *     that access to buy-now-pay-later raised people's total spending, not just
 *     how they paid, even among people who didn't need the credit. So the tool
 *     asks whether you'd buy it at this price without the plan.
 *   - Plans stack. The CFPB (January 2025) found 63% of US pay-later borrowers
 *     had several loans at once at some point in 2022. One payment looks small;
 *     the month's total is what has to be paid.
 *
 * The sum: the plan's total (deposit + fee + every payment) against the price
 * today, and the yearly rate that makes the payments worth the price (the
 * effective annual rate, which is how a UK APR is quoted). When the plan is
 * genuinely interest-free and you'd buy anyway, spreading is free money, and
 * the only way it gets expensive is a missed payment, so the advice is to
 * automate every one.
 *
 * The read, checked in order:
 *   1. "stretch"  — you couldn't pay the full price today. The plan is a loan
 *                   to afford it, not a way to pay, whatever its rate.
 *   2. "cheaper"  — the plan totals less than the price (a rare offer).
 *   3. "free"     — interest-free (within rounding).
 *   4. "earns"    — it charges something, but your savings earn more.
 *   5. "costs"    — it charges something. Pay now.
 * Overlaid on any of them: `nudged`, when you wouldn't buy it at this price
 * without the plan, or would buy a cheaper one.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { parseMoney } from "./worth";

/**
 * "£649", "£59.99", "£1,719.88". Pennies whenever there are any: on a payment
 * plan the pennies are the point, and rounding £59.99 to £60 would hide them.
 */
export function formatMoney(n: number, cur: string): string {
  const cents = Math.round(n * 100);
  const whole = cents % 100 === 0;
  const txt = (cents / 100).toLocaleString("en-GB", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
  return `${cur}${txt}`;
}

export type Every = "week" | "fortnight" | "month";
export type Afford = "" | "yes" | "savings" | "no";
export type Without = "" | "yes" | "smaller" | "no";

export type MonthlyInputs = {
  what: string;
  /** The price if you pay in full today. */
  price: string;
  /** Each payment on the plan. */
  payment: string;
  /** How many payments. */
  count: string;
  every: Every;
  /** True when the first payment is taken at the checkout (pay-in-four). */
  firstToday: boolean;
  /** Paid up front, before the payments: a deposit. */
  deposit: string;
  /** Any fee to set it up or to end it. */
  fee: string;
  /** What your savings earn a year, as a percentage. */
  savings: string;
  /** What you already pay a month on other plans and cards. */
  others: string;
  afford: Afford;
  without: Without;
};

export const BLANK_MONTHLY: MonthlyInputs = {
  what: "",
  price: "",
  payment: "",
  count: "",
  every: "month",
  firstToday: false,
  deposit: "",
  fee: "",
  savings: "",
  others: "",
  afford: "",
  without: "",
};

export const PER_YEAR_EVERY: Record<Every, number> = { week: 52, fortnight: 26, month: 12 };

export type MonthlyKind = "stretch" | "cheaper" | "free" | "earns" | "costs";

export type MonthlyRead = {
  kind: MonthlyKind;
  price: number;
  payment: number;
  count: number;
  deposit: number;
  fee: number;
  /** Everything the plan takes: deposit, fee and every payment. */
  total: number;
  /** total − price. Negative when the plan costs less. */
  extra: number;
  /** The effective yearly rate the plan charges, as a fraction (0.21 = 21%). 0 when free or cheaper. */
  apr: number;
  /** What savings earn a year, as a fraction, or null if not given. */
  savings: number | null;
  /**
   * What keeping the money in savings while you pay would be worth, in today's
   * money: the price less the plan's payments discounted at the savings rate.
   * Null without a savings rate.
   */
  kept: number | null;
  /** The plan's payments as a monthly amount. */
  perMonth: number;
  /** Months until the last payment. */
  months: number;
  /** What you already pay a month on other plans, or 0. */
  others: number;
  /** True when you wouldn't buy it at this price without the plan. */
  nudged: boolean;
};

/** Extra under this share of the price (or £1) reads as interest-free. */
const FREE_SHARE = 0.002;

/** A plan's count, read the way people type it: "12", "24 payments". */
export function parseCount(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,3})\b/);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 520 ? n : null;
}

export function countInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseCount(raw) === null;
}

/** A yearly percentage: "4", "4.5%", "4,5". Null when blank or unreadable. */
export function parseRate(raw: string): number | null {
  const s = raw.trim().replace(/%$/, "").trim().replace(",", ".");
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return n >= 0 && n <= 100 ? n / 100 : null;
}

export function rateInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseRate(raw) === null;
}

/** The currency the person typed, so answers come back in it. Defaults to £. */
export function monthlyCurrency(inp: MonthlyInputs): string {
  for (const raw of [inp.price, inp.payment, inp.deposit, inp.fee, inp.others]) {
    const m = raw.match(/[£$€]/);
    if (m) return m[0];
  }
  return "£";
}

/** When each payment falls, in periods from today. */
function times(count: number, firstToday: boolean): number[] {
  return Array.from({ length: count }, (_, i) => (firstToday ? i : i + 1));
}

/** Today's value of the plan's payments at a per-period rate. */
function presentValue(payment: number, ts: number[], r: number): number {
  return ts.reduce((sum, t) => sum + payment / Math.pow(1 + r, t), 0);
}

/**
 * The per-period rate at which the payments are worth `financed` today.
 * Bisection: present value falls as the rate rises. Assumes the payments total
 * more than `financed`, so the rate is positive.
 */
function periodRate(payment: number, ts: number[], financed: number): number {
  let lo = 0;
  let hi = 1;
  while (presentValue(payment, ts, hi) > financed && hi < 1e6) hi *= 2;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (presentValue(payment, ts, mid) > financed) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The read so far, or null while a number it needs is missing. */
export function readMonthly(inp: MonthlyInputs): MonthlyRead | null {
  const price = parseMoney(inp.price);
  const payment = parseMoney(inp.payment);
  const count = parseCount(inp.count);
  if (!price || !payment || !count) return null;
  const deposit = parseMoney(inp.deposit) ?? 0;
  const fee = parseMoney(inp.fee) ?? 0;
  const savings = parseRate(inp.savings);
  const others = parseMoney(inp.others) ?? 0;
  const ppy = PER_YEAR_EVERY[inp.every];
  const ts = times(count, inp.firstToday);

  const total = deposit + fee + payment * count;
  const extra = total - price;
  const financed = price - deposit - fee;
  const tolerance = Math.max(1, price * FREE_SHARE);

  let apr = 0;
  if (extra > tolerance && financed > 0) {
    apr = Math.pow(1 + periodRate(payment, ts, financed), ppy) - 1;
  } else if (extra > tolerance) {
    // Deposit and fee alone cover the price: every payment is pure cost.
    apr = Infinity;
  }

  let kept: number | null = null;
  if (savings !== null) {
    const sp = Math.pow(1 + savings, 1 / ppy) - 1;
    kept = price - (deposit + fee + presentValue(payment, ts, sp));
  }

  const perMonth = (payment * ppy) / 12;
  const lastAt = ts[ts.length - 1];
  const months = (lastAt / ppy) * 12;
  const nudged = inp.without === "no" || inp.without === "smaller";

  let kind: MonthlyKind;
  if (inp.afford === "no") kind = "stretch";
  else if (extra < -tolerance) kind = "cheaper";
  else if (extra <= tolerance) kind = "free";
  else if (savings !== null && savings > apr) kind = "earns";
  else kind = "costs";

  return {
    kind,
    price,
    payment,
    count,
    deposit,
    fee,
    total,
    extra,
    apr,
    savings,
    kept,
    perMonth,
    months,
    others,
    nudged,
  };
}

/** "21%", "4.9%", "0%", "over 1,000%". One decimal under 10. */
export function formatRate(r: number): string {
  if (!Number.isFinite(r) || r * 100 >= 1000) return "over 1,000%";
  const pct = r * 100;
  if (pct < 10) return `${(Math.round(pct * 10) / 10).toString()}%`;
  return `${Math.round(pct).toLocaleString("en-GB")}%`;
}

/** "about 21%", or "over 1,000%" without the hedge. */
export function aboutRate(r: number): string {
  const f = formatRate(r);
  return f.startsWith("over") ? f : `about ${f}`;
}

/** "a year", "18 months", "6 weeks", "2 years". */
export function span(months: number): string {
  if (months < 1.5) {
    const w = Math.max(1, Math.round((months * 52) / 12));
    return `${w} week${w === 1 ? "" : "s"}`;
  }
  if (Math.abs(months - 12) < 0.5) return "a year";
  if (months < 24 || Math.abs(months - Math.round(months / 12) * 12) >= 0.5) {
    return `${Math.round(months)} months`;
  }
  return `${Math.round(months / 12)} years`;
}

/** "12 monthly payments of £59.99", with the deposit and fee if any. */
export function planName(inp: MonthlyInputs, read: MonthlyRead): string {
  const cur = monthlyCurrency(inp);
  const often = inp.every === "month" ? "monthly" : inp.every === "week" ? "weekly" : "fortnightly";
  const n = read.count;
  const pay = formatMoney(read.payment, cur);
  const head = n === 1 ? `one payment of ${pay}` : `${n} ${often} payments of ${pay}`;
  const bits: string[] = [];
  if (read.deposit > 0) bits.push(`a ${formatMoney(read.deposit, cur)} deposit`);
  if (read.fee > 0) bits.push(`a ${formatMoney(read.fee, cur)} fee`);
  return bits.length ? `${bits.join(" and ")}, then ${head}` : head;
}

/** The thing, for mid-sentence use, with a fallback that's never blank. */
export function monthlyName(inp: MonthlyInputs): string {
  const s = inp.what.trim().replace(/[.!?\s]+$/, "");
  if (!s) return "it";
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** The sum in one sentence: what the plan adds up to against the price. */
export function totalSentence(inp: MonthlyInputs, read: MonthlyRead): string {
  const cur = monthlyCurrency(inp);
  const plan = planName(inp, read);
  const total = formatMoney(read.total, cur);
  const price = formatMoney(read.price, cur);
  const head = `Altogether that's ${total} for ${plan}, against ${price} today.`;
  if (read.extra < -Math.max(1, read.price * FREE_SHARE)) {
    return `${head} The plan costs ${formatMoney(-read.extra, cur)} less than paying now.`;
  }
  if (read.apr === 0) return `${head} That's interest-free: spreading it costs nothing extra.`;
  return `${head} Spreading it costs ${formatMoney(read.extra, cur)} more, which is borrowing at ${aboutRate(read.apr)} a year.`;
}

/** The answer's headline: the words printed largest, and spoken. */
export function monthlyHeadline(read: MonthlyRead): string {
  switch (read.kind) {
    case "stretch":
      return read.apr === 0
        ? "This is a debt to afford it, even at 0%. Make sure you can."
        : `This is a loan at ${formatRate(read.apr)} to afford it. Make sure you can.`;
    case "cheaper":
      return read.nudged
        ? "The plan is cheaper. Is the thing worth buying?"
        : "Spread it. The plan costs less than paying now.";
    case "free":
      return read.nudged
        ? "Free to spread. Is it worth buying?"
        : "Spread it, and set every payment to come out automatically.";
    case "earns":
      return "Spread it. Your savings earn more than it charges.";
    case "costs":
      return read.nudged
        ? `Pay now, or wait. Spreading it costs ${formatRate(read.apr)} a year.`
        : `Pay now. Spreading it costs ${formatRate(read.apr)} a year.`;
  }
}

/** What the month looks like with this plan on top of the others. */
export function stackSentence(inp: MonthlyInputs, read: MonthlyRead): string {
  const cur = monthlyCurrency(inp);
  const per = `${inp.every === "month" ? "" : "about "}${formatMoney(read.perMonth, cur)}`;
  const until = read.months > 0 ? ` for ${span(read.months)}` : "";
  if (read.others > 0) {
    const all = formatMoney(read.perMonth + read.others, cur);
    return `With what you already pay on other plans and cards, that's ${all} a month going out before anything else${until}: ${per} of it this one.`;
  }
  return `It adds ${per} a month${until}. Plans stack quietly: count what every one of them takes together, not this one alone.`;
}

/** The standing rule: the reusable part of the answer. */
export function monthlyRule(): string {
  return "My line for pay-monthly offers: I add up every payment before I look at the monthly figure. If it totals more than the price today, I pay now or wait. If it's truly interest-free and I'd buy it anyway, I take it and set every payment to come out automatically, so a missed one can't make it expensive.";
}

/** The plain-text record, for notes or a message to yourself. */
export function monthlySummary(inp: MonthlyInputs, read: MonthlyRead): string {
  const lines: string[] = [];
  if (inp.what.trim()) lines.push(inp.what.trim());
  lines.push(totalSentence(inp, read));
  lines.push("");
  lines.push(monthlyHeadline(read));
  lines.push("");
  lines.push(monthlyRule());
  return lines.join("\n");
}

const EVERIES: Every[] = ["week", "fortnight", "month"];
const AFFORDS: Afford[] = ["yes", "savings", "no"];
const WITHOUTS: Without[] = ["yes", "smaller", "no"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseMonthlyInputs(raw: unknown): MonthlyInputs {
  if (!raw || typeof raw !== "object") return BLANK_MONTHLY;
  const v = raw as Record<string, unknown>;
  const str = (k: keyof MonthlyInputs) => (typeof v[k] === "string" ? (v[k] as string) : "");
  return {
    what: str("what"),
    price: str("price"),
    payment: str("payment"),
    count: str("count"),
    every: oneOf(v.every, EVERIES) || "month",
    firstToday: v.firstToday === true,
    deposit: str("deposit"),
    fee: str("fee"),
    savings: str("savings"),
    others: str("others"),
    afford: oneOf(v.afford, AFFORDS),
    without: oneOf(v.without, WITHOUTS),
  };
}

/**
 * The worked example: a £649 laptop, or 12 monthly payments of £59.99. The
 * plan totals £719.88, £70.88 more, which is borrowing at about 21% a year.
 * The buyer could pay today and would have bought it anyway; the monthly
 * figure had simply looked smaller than the price.
 */
export const MONTHLY_EXAMPLE: MonthlyInputs = {
  what: "A new laptop for work",
  price: "£649",
  payment: "£59.99",
  count: "12",
  every: "month",
  firstToday: false,
  deposit: "",
  fee: "",
  savings: "",
  others: "",
  afford: "yes",
  without: "yes",
};
