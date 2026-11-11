/**
 * The read behind "A Tax Return Due: What Does Late Cost, and What Stops It?"
 * (/taxreturn).
 *
 * Self Assessment has two clocks that people treat as one. The filing clock
 * runs on the return: £100 the day after the deadline, £10 a day from three
 * months, then 5% of the year's tax (or £300 if more) at six months and again
 * at twelve. The paying clock runs on the money: interest from the day after,
 * then 5% of whatever's unpaid at 30 days, six months and twelve months, and
 * a payment plan agreed before each of those dates stops that penalty. The
 * usual, expensive move is to wait to file until you can pay. That lets the
 * filing penalties pile up on top of the payment ones, when the return could
 * have gone in on time and the money been spread over a year.
 *
 * The second surprise is the size of the January bill in the first year:
 * the year's tax, plus half as much again as the first payment on account
 * towards the next year, because nothing was taken at source.
 *
 * UK-wide (Finance Act 2009 schedules 55 and 56 for the penalties, TMA 1970
 * s.59A for payments on account), from search summaries of HMRC guidance
 * excerpts, LITRG, Which?, and accountants' 2025/26 penalty notes, since
 * gov.uk doesn't resolve from where this was written:
 *
 *   - The online deadline is 31 January after the tax year ends (paper: 31
 *     October). If HMRC's notice to file was sent after 31 October, the
 *     deadline is three months from the notice.
 *   - Late filing: £100; daily £10 for up to 90 days from three months late
 *     (max £900); at six months and twelve months, 5% of the tax due or £300,
 *     whichever is more (more again if information is deliberately withheld,
 *     which isn't modelled).
 *   - Late payment: 5% of the tax unpaid at the end of 30 days, at the end of
 *     the five months after that, and at the end of the eleven months after
 *     it. Payments on account get interest but no late payment penalty. A
 *     Time to Pay arrangement agreed before a penalty date stops that penalty
 *     while it's kept to; interest still runs.
 *   - Interest: Bank Rate plus 4% since 6 April 2025. 7.75% from 9 January
 *     2026, 8% from 24 November 2026 (Bank Rate 4% from 5 November 2026).
 *   - Payments on account: each half of the year's tax not taken at source,
 *     due 31 January and 31 July, unless that's £1,000 or less or 80% or more
 *     was collected at source. Reduce them with SA303 if next year will be
 *     lower; interest if you cut them too far.
 *   - Not registered: you should register by 5 October after the tax year. A
 *     non-deliberate failure to notify is a penalty on the tax that was late,
 *     so filing and paying by 31 January means nothing extra; and told
 *     unprompted within 12 months, it can be reduced to nothing.
 *   - Appeals: within 30 days of the penalty notice; a reasonable excuse is
 *     something outside your control (serious illness, a death, an HMRC
 *     system failure, post that never came), and the return must be sent
 *     without delay once it ends. Not knowing, no reminder, and not being able
 *     to pay don't count.
 *   - Making Tax Digital for Income Tax began on 6 April 2026 for sole traders
 *     and landlords with qualifying income over £50,000; from 2026/27 they're
 *     on points-based late filing and new late payment penalties. The read
 *     uses the older rules and says so for that year.
 *
 * Not tax advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type YesNo = "" | "yes" | "no";
/** How HMRC asked: the usual notice, a notice sent after 31 October, or not at all. */
export type TrAsked = "" | "usual" | "late" | "none";
/** Is there anything to put on the return? */
export type TrNeed = "" | "yes" | "unsure" | "nothing";
export type TrFiled = "" | "no" | "yes";
export type TrPaid = "" | "no" | "full" | "plan";
export type TrCanPay = "" | "all" | "plan" | "none";
export type TrExcuse = "" | "illness" | "death" | "hmrc" | "post" | "other" | "none";

export type TrInputs = {
  /** The tax year's end year: "2026" is 2025/26 (to 5 April 2026). */
  year: string;
  asked: TrAsked;
  /** ISO date of a notice to file sent after 31 October. */
  noticeOn: string;
  need: TrNeed;
  filed: TrFiled;
  /** ISO date the return went in, when it has. */
  filedOn: string;
  /** The year's income tax and Class 4 NI not already taken at source. */
  tax: string;
  /** Payments on account already made towards this year. */
  poaPaid: string;
  /** Was 80% or more of your tax taken at source (PAYE)? */
  mostPaye: YesNo;
  paid: TrPaid;
  /** ISO date paid in full. */
  paidOn: string;
  /** ISO date a Time to Pay plan was agreed. */
  planOn: string;
  /** Months the plan runs: "6", "12", ... */
  planMonths: string;
  canPay: TrCanPay;
  excuse: TrExcuse;
};

export const BLANK_TR: TrInputs = {
  year: "",
  asked: "",
  noticeOn: "",
  need: "",
  filed: "",
  filedOn: "",
  tax: "",
  poaPaid: "",
  mostPaye: "",
  paid: "",
  paidOn: "",
  planOn: "",
  planMonths: "",
  canPay: "",
  excuse: "",
};

export const FIRST_PENALTY = 100;
export const DAILY = 10;
export const DAILY_DAYS = 90;
export const FLOOR = 300;
export const PCT = 0.05;
export const POA_THRESHOLD = 1000;
export const ONLINE_PLAN_LIMIT = 30000;
/** The year Making Tax Digital for Income Tax's own penalties start (2026/27 ends 2027). */
export const MTD_FROM_END = 2027;

/**
 * HMRC late payment interest, by the date each rate took effect. Bank Rate
 * plus 4% from 6 April 2025; plus 2.5% before. The earliest rows are
 * approximate; the read says "about" wherever it uses them.
 */
export const INTEREST: { from: string; rate: number }[] = [
  { from: "2000-01-01", rate: 0.075 },
  { from: "2025-04-06", rate: 0.085 },
  { from: "2025-05-28", rate: 0.0825 },
  { from: "2025-08-18", rate: 0.08 },
  { from: "2026-01-09", rate: 0.0775 },
  { from: "2026-11-24", rate: 0.08 },
];

export function rateOn(iso: string): number {
  let r = INTEREST[0].rate;
  for (const row of INTEREST) if (iso >= row.from) r = row.rate;
  return r;
}

const CUR = "£";

/** Pounds, with pence only when there are any. */
export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r)
    ? `${CUR}${r.toLocaleString("en-GB")}`
    : `${CUR}${r.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Whole pounds, for estimates. */
export function pounds(n: number): string {
  return `${CUR}${Math.round(n).toLocaleString("en-GB")}`;
}

function amount(raw: string): number | null {
  const n = parseMoney(raw);
  return n !== null && n >= 0 && raw.trim() !== "" ? n : null;
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
}

/** "2025/26" for the year ending in 2026. */
export function yearLabel(end: number): string {
  return `${end - 1}/${String(end % 100).padStart(2, "0")}`;
}

/** The end year of the latest tax year to have finished by `today`. */
export function latestEnded(today: string): number {
  const y = Number(today.slice(0, 4));
  return today >= `${y}-04-06` ? y : y - 1;
}

/** The three returns worth offering: the latest finished year and the two before. */
export function yearOptions(today: string): number[] {
  const e = latestEnded(today);
  return [e, e - 1, e - 2];
}

/** Interest on `amt` unpaid from the day after `due` to `paid` (inclusive of neither end's day count quirks). */
export function interestOn(amt: number, due: string, paid: string): number {
  if (amt <= 0 || paid <= due) return 0;
  let total = 0;
  let d = addDaysISO(due, 1);
  // Walk rate periods, not days, so long spans stay cheap.
  while (d <= paid) {
    const r = rateOn(d);
    const nextChange = INTEREST.find((row) => row.from > d)?.from;
    const end = nextChange && nextChange <= paid ? addDaysISO(nextChange, -1) : paid;
    const days = daysBetween(d, end) + 1;
    total += (amt * r * days) / 365;
    d = addDaysISO(end, 1);
  }
  return total;
}

export type TrDates = {
  /** The filing deadline. */
  fileBy: string;
  /** The payment deadline (31 January). */
  payBy: string;
  /** First day the £10 daily penalty can run. */
  dailyFrom: string;
  /** Last day of the 90 daily penalty days. */
  dailyTo: string;
  /** First day still unfiled that brings the six-month penalty. */
  sixFrom: string;
  /** First day still unfiled that brings the twelve-month penalty. */
  twelveFrom: string;
  /** Last day to pay (or agree a plan) before each 5% late payment penalty. */
  pay30: string;
  pay6: string;
  pay12: string;
  /** The second payment on account towards next year: 31 July. */
  july: string;
  /** Registration deadline: 5 October after the tax year. */
  registerBy: string;
};

export function datesFor(end: number, noticeOn: string): TrDates {
  const normal = `${end + 1}-01-31`;
  // A notice sent after 31 October gives three months from the notice.
  const fileBy =
    isISODate(noticeOn) && noticeOn > `${end}-10-31` ? maxISO(normal, addMonthsISO(noticeOn, 3)) : normal;
  // A late notice moves the payment date too, for anyone who told HMRC by 5
  // October (the usual reason a notice comes late is HMRC's, not yours).
  const payBy = fileBy;
  const dailyFrom = addDaysISO(addMonthsISO(fileBy, 3), 1);
  const after30 = addDaysISO(payBy, 31);
  return {
    fileBy,
    payBy,
    dailyFrom,
    dailyTo: addDaysISO(dailyFrom, DAILY_DAYS - 1),
    sixFrom: addDaysISO(addMonthsISO(fileBy, 6), 1),
    twelveFrom: addDaysISO(addMonthsISO(fileBy, 12), 1),
    pay30: addDaysISO(payBy, 30),
    pay6: addDaysISO(addMonthsISO(after30, 5), -1),
    pay12: addDaysISO(addMonthsISO(after30, 11), -1),
    july: `${end + 1}-07-31`,
    registerBy: `${end}-10-05`,
  };
}

function maxISO(a: string, b: string): string {
  return a > b ? a : b;
}

export type TrMoney = {
  /** The year's tax not taken at source. */
  tax: number;
  /** Payments on account already made towards it. */
  poaPaid: number;
  /** What's left of this year's tax: due 31 January, with late payment penalties. */
  balancing: number;
  /** Each payment on account towards next year (0 if none apply). */
  poa: number;
  /** The whole 31 January bill: balancing plus the first payment on account. */
  january: number;
  /** True when this looks like the first year (nothing paid on account). */
  firstYear: boolean;
};

export function moneyFor(inp: TrInputs): TrMoney | null {
  const tax = amount(inp.tax);
  if (tax === null) return null;
  const poaPaid = amount(inp.poaPaid) ?? 0;
  const balancing = Math.max(0, tax - poaPaid);
  const poa = tax > POA_THRESHOLD && inp.mostPaye !== "yes" ? Math.round((tax / 2) * 100) / 100 : 0;
  return { tax, poaPaid, balancing, poa, january: balancing + poa, firstYear: poaPaid === 0 };
}

export type TrLine = { on: string; label: string; amount: number; kind: "file" | "pay" | "interest" };

export type TrCost = {
  lines: TrLine[];
  filing: number;
  latePay: number;
  interest: number;
  total: number;
};

export type TrScenario = {
  /** When the return goes in (ISO). */
  fileOn: string;
  /** When the January bill is cleared (ISO), for a single payment. */
  payOn: string;
  /** A plan agreed on this date (ISO), or "". */
  planOn?: string;
  /** Months the plan runs. */
  planMonths?: number;
};

/**
 * What a filing date and a paying date add, on the rules above. `tax` is the
 * year's tax (for the 5%-or-£300 filing penalties); the late payment penalties
 * fall on the balancing payment only; interest falls on everything unpaid at
 * 31 January, including the first payment on account.
 */
export function costOf(d: TrDates, m: TrMoney | null, s: TrScenario): TrCost {
  const lines: TrLine[] = [];
  const tax = m?.tax ?? 0;
  // Filing.
  if (s.fileOn > d.fileBy) lines.push({ on: addDaysISO(d.fileBy, 1), label: "Return late: the fixed penalty", amount: FIRST_PENALTY, kind: "file" });
  if (s.fileOn > d.dailyFrom) {
    const days = Math.min(DAILY_DAYS, daysBetween(d.dailyFrom, s.fileOn));
    lines.push({ on: d.dailyFrom, label: `£10 a day for ${days} day${days === 1 ? "" : "s"}`, amount: days * DAILY, kind: "file" });
  }
  if (s.fileOn >= d.sixFrom)
    lines.push({ on: d.sixFrom, label: "Six months late: 5% of the tax, or £300", amount: Math.max(FLOOR, tax * PCT), kind: "file" });
  if (s.fileOn >= d.twelveFrom)
    lines.push({ on: d.twelveFrom, label: "Twelve months late: 5% again, or £300", amount: Math.max(FLOOR, tax * PCT), kind: "file" });

  // Paying.
  if (m && m.january > 0) {
    const plan = s.planOn && isISODate(s.planOn) && s.planMonths ? s : null;
    // Penalties: on the balancing payment still unpaid after each date, unless a plan was agreed by it.
    const unpaidAfter = (lastSafe: string): number => {
      if (plan && plan.planOn! <= lastSafe) return 0;
      if (plan) {
        // A plan agreed later: the balancing payment is unpaid until the plan's payments clear it.
        return remainingOn(m.balancing, plan.planOn!, plan.planMonths!, lastSafe);
      }
      return s.payOn > lastSafe ? m.balancing : 0;
    };
    const steps: [string, string][] = [
      [d.pay30, "Unpaid after 30 days: 5%"],
      [d.pay6, "Unpaid after six months: 5% more"],
      [d.pay12, "Unpaid after twelve months: 5% more"],
    ];
    for (const [lastSafe, label] of steps) {
      const owed = unpaidAfter(lastSafe);
      if (owed > 0) lines.push({ on: addDaysISO(lastSafe, 1), label, amount: Math.round(owed * PCT * 100) / 100, kind: "pay" });
    }
    // Interest on the January bill.
    let interest = 0;
    if (plan) {
      const n = plan.planMonths!;
      const each = m.january / n;
      for (let i = 0; i < n; i++) interest += interestOn(each, d.payBy, addMonthsISO(plan.planOn!, i));
      // The second payment on account falls due in the plan too; leave it out to keep the read simple.
    } else {
      interest = interestOn(m.january, d.payBy, s.payOn);
    }
    if (interest > 0.5)
      lines.push({ on: addDaysISO(d.payBy, 1), label: "Interest on what was paid late", amount: Math.round(interest * 100) / 100, kind: "interest" });
  }
  const sum = (k: TrLine["kind"]) => lines.filter((l) => l.kind === k).reduce((a, l) => a + l.amount, 0);
  const filing = sum("file");
  const latePay = sum("pay");
  const interest = sum("interest");
  return { lines, filing, latePay, interest, total: filing + latePay + interest };
}

/** What's left of `amt` paid in `n` equal monthly parts from `start`, after `on`. */
function remainingOn(amt: number, start: string, n: number, on: string): number {
  let paid = 0;
  for (let i = 0; i < n; i++) if (addMonthsISO(start, i) <= on) paid++;
  return Math.max(0, amt * (1 - paid / n));
}

export type TrStatus =
  | "register" // not told HMRC, has something to report
  | "withdraw" // asked to file, nothing to report
  | "clear" // not asked, nothing to report
  | "early" // before the filing deadline, not filed
  | "late" // filing deadline passed, not filed
  | "unpaid" // filed, not paid
  | "plan" // filed, on a plan
  | "done"; // filed and paid

export type TrRead = {
  status: TrStatus;
  end: number;
  label: string;
  d: TrDates;
  m: TrMoney | null;
  /** Today's cost if the return went in and the bill were paid today (or on the dates given). */
  now: TrCost;
  /** The same if nothing happens until the next step up. */
  wait: TrCost | null;
  /** The date of the next step up, when there is one. */
  nextStep: string;
  /** What the next step adds. */
  nextAdds: number;
  /** The read's main date to act by. */
  actBy: string;
  /** The staircase: cost of filing on each date (paying the same day, or on the plan). */
  stairs: { on: string; label: string; total: number }[];
  /** True for 2026/27 onwards, where Making Tax Digital's own penalties can apply. */
  mtdYear: boolean;
  /** True when the year's filing deadline has passed (as of today). */
  pastDeadline: boolean;
};

export function trReady(inp: TrInputs): boolean {
  if (!/^\d{4}$/.test(inp.year)) return false;
  if (!inp.asked) return false;
  if (inp.asked === "late" && !isISODate(inp.noticeOn)) return false;
  if (!inp.need) return false;
  if (inp.need === "nothing") return true;
  if (inp.asked === "none") return true;
  if (!inp.filed) return false;
  if (inp.filed === "yes" && !isISODate(inp.filedOn)) return false;
  if (inp.filed === "yes" && !inp.paid) return false;
  if (inp.paid === "full" && !isISODate(inp.paidOn)) return false;
  if (inp.paid === "plan" && (!isISODate(inp.planOn) || !inp.planMonths)) return false;
  return true;
}

export function readTr(inp: TrInputs, today = todayISO()): TrRead | null {
  if (!trReady(inp)) return null;
  const end = Number(inp.year);
  const d = datesFor(end, inp.asked === "late" ? inp.noticeOn : "");
  const m = moneyFor(inp);
  const pastDeadline = today > d.fileBy;

  let status: TrStatus;
  if (inp.need === "nothing" && inp.asked !== "none") status = "withdraw";
  else if (inp.asked === "none") status = inp.need === "nothing" ? "clear" : "register";
  else if (inp.filed !== "yes") status = pastDeadline ? "late" : "early";
  else if (inp.paid === "full") status = "done";
  else if (inp.paid === "plan") status = "plan";
  else status = m && m.january === 0 ? "done" : "unpaid";

  const fileOn = inp.filed === "yes" && isISODate(inp.filedOn) ? inp.filedOn : maxISO(today, d.fileBy) === today ? today : d.fileBy;
  const payOn = inp.paid === "full" && isISODate(inp.paidOn) ? inp.paidOn : maxISO(today, d.payBy) === today ? today : d.payBy;
  const plan = inp.paid === "plan" ? { planOn: inp.planOn, planMonths: Number(inp.planMonths) || 12 } : {};
  const now = costOf(d, m, { fileOn, payOn, ...plan });

  // The next step up, from today, for whatever is still open.
  const candidates: string[] = [];
  if (inp.filed !== "yes") candidates.push(addDaysISO(d.fileBy, 1), d.dailyFrom, d.sixFrom, d.twelveFrom);
  if (inp.paid !== "full" && inp.paid !== "plan" && m && m.january > 0)
    candidates.push(addDaysISO(d.payBy, 1), addDaysISO(d.pay30, 1), addDaysISO(d.pay6, 1), addDaysISO(d.pay12, 1));
  const future = candidates.filter((c) => c > today).sort();
  let nextStep = future[0] ?? "";
  // While the daily penalty is running, every day is a step; the next big one is the six-month penalty.
  if (inp.filed !== "yes" && today >= d.dailyFrom && today <= d.dailyTo) {
    const big = future.filter((c) => c > d.dailyTo);
    nextStep = big[0] ?? nextStep;
  }
  let wait: TrCost | null = null;
  let nextAdds = 0;
  if (nextStep && (status === "early" || status === "late" || status === "unpaid")) {
    wait = costOf(d, m, {
      fileOn: inp.filed === "yes" ? fileOn : maxISO(nextStep, fileOn),
      payOn: inp.paid === "full" ? payOn : maxISO(nextStep, payOn),
    });
    nextAdds = wait.total - now.total;
  }

  let actBy = "";
  if (status === "early") actBy = d.fileBy;
  else if (status === "late") actBy = nextStep ? addDaysISO(nextStep, -1) : "";
  else if (status === "unpaid") actBy = nextStep ? addDaysISO(nextStep, -1) : "";
  else if (status === "register") actBy = today <= d.fileBy ? d.fileBy : "";

  // The staircase: file (and pay) on each step's date.
  const stairs: { on: string; label: string; total: number }[] = [];
  if (status === "early" || status === "late") {
    const points: [string, string][] = [
      [d.fileBy, "File and pay by the deadline"],
      [addDaysISO(d.fileBy, 1), "A day late"],
      [addDaysISO(d.pay30, 1), "Not paid by the 30-day point"],
      [addDaysISO(d.dailyFrom, 29), "A month into the daily penalty"],
      [d.dailyTo, "End of the daily penalty"],
      [d.sixFrom, "Six months late"],
      [d.twelveFrom, "Twelve months late"],
    ];
    for (const [on, label] of points.sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      const c = costOf(d, m, { fileOn: on, payOn: on });
      stairs.push({ on, label, total: c.total });
    }
  }

  return {
    status,
    end,
    label: yearLabel(end),
    d,
    m,
    now,
    wait,
    nextStep,
    nextAdds,
    actBy,
    stairs,
    mtdYear: end >= MTD_FROM_END,
    pastDeadline,
  };
}

/** The cheapest honest path when you can't pay: file on time, plan before the 30-day point. */
export function fileAndPlan(read: TrRead, today: string, months = 12): TrCost | null {
  if (!read.m || read.m.january <= 0) return null;
  const fileOn = maxISO(today, read.d.fileBy) === today ? today : read.d.fileBy;
  const planOn = maxISO(today, read.d.payBy) === today ? today : read.d.payBy;
  return costOf(read.d, read.m, { fileOn, payOn: planOn, planOn, planMonths: months });
}

/** The usual mistake: wait to file until you can pay, `months` after the deadline. */
export function waitToFile(read: TrRead, months = 6): TrCost {
  const on = addMonthsISO(read.d.fileBy, months);
  return costOf(read.d, read.m, { fileOn: on, payOn: on });
}

/** 0.0775 → "7.75%", 0.08 → "8%". */
export function pctOf(r: number): string {
  return `${Number((r * 100).toFixed(2))}%`;
}

export function trHeadline(inp: TrInputs, read: TrRead, today = todayISO()): string {
  const d = read.d;
  const m = read.m;
  switch (read.status) {
    case "clear":
      return "If there was nothing to report and HMRC hasn't asked, there's no return to file.";
    case "withdraw":
      return "If there was nothing to report, ask HMRC to withdraw the notice to file. If they do, there's no return to send and no penalty for not sending it.";
    case "register":
      return today <= d.fileBy
        ? `Register for Self Assessment now. If you file and pay by ${actDate(d.fileBy)}, registering late costs nothing.`
        : "Register and tell HMRC now, before they find out. Told unprompted within a year, the penalty for not telling them can be cut to nothing.";
    case "early":
      if (inp.canPay === "none" || inp.canPay === "plan")
        return `File by ${actDate(d.fileBy)} even if you can't pay. The £100 is for not filing; a payment plan set up by ${actDate(d.pay30)} stops the 5%.`;
      return m
        ? `File and pay ${money(m.january)} by ${actDate(d.fileBy)} and nothing is added. A day late adds £100, even if you owe nothing.`
        : `File by ${actDate(d.fileBy)} and nothing is added. A day late adds £100, even if you owe nothing.`;
    case "late": {
      const sofar = read.now.filing;
      if (today < d.dailyFrom)
        return `File by ${actDate(addDaysISO(d.dailyFrom, -1))} and the filing penalty stays at £100. From ${actDate(d.dailyFrom)} it grows by £10 a day.`;
      if (today <= d.dailyTo)
        return `File today: every day adds £10, up to £900 on ${actDate(d.dailyTo)}. The filing penalties are ${pounds(sofar)} so far.`;
      if (today < d.sixFrom)
        return `File by ${actDate(addDaysISO(d.sixFrom, -1))}. The next day adds ${pounds(Math.max(FLOOR, (m?.tax ?? 0) * PCT))} more.`;
      if (today < d.twelveFrom)
        return `File by ${actDate(addDaysISO(d.twelveFrom, -1))}. The next day adds ${pounds(Math.max(FLOOR, (m?.tax ?? 0) * PCT))} more, the last of the filing penalties.`;
      return "File now. The filing penalties have all landed; filing stops HMRC estimating your tax for you, and starts the clock on getting any of it back.";
    }
    case "unpaid":
      if (!m) return `Pay, or set up a payment plan, by ${actDate(read.actBy || d.pay30)}, the last day before a 5% penalty.`;
      if (read.actBy && today <= d.pay30)
        return `Pay ${money(m.january)}, or set up a payment plan, by ${actDate(d.pay30)}. After that, 5% of ${money(m.balancing)} is added.`;
      if (read.actBy)
        return `Pay, or agree a payment plan, by ${actDate(read.actBy)}. The next day adds 5% of whatever's left of ${money(m.balancing)}.`;
      return "Pay, or agree a payment plan, now. The penalties have all landed; interest is the only thing still growing.";
    case "plan":
      return "You're on a plan. Keep to it: miss a payment and the penalties it was holding off can be charged.";
    case "done":
      return read.now.total > 0
        ? `It's done. Being late added about ${pounds(read.now.total)}. If something outside your control caused it, appeal within 30 days of the penalty notice.`
        : "It's done, on time, with nothing added.";
  }
}

export function trBody(inp: TrInputs, read: TrRead, today = todayISO()): string {
  const d = read.d;
  const m = read.m;
  const parts: string[] = [];
  switch (read.status) {
    case "clear":
      parts.push(
        "You need to register and file if you had self-employment income over £1,000, rent over £1,000, untaxed income over £2,500 (or £10,000 of savings or dividend income), capital gains to report, a share in a partnership, or a Child Benefit charge not paid through your tax code. If none of that applies, there's nothing to do. If you're not sure about one item, the gov.uk checker asks the same questions.",
      );
      break;
    case "withdraw":
      parts.push(
        `HMRC sends a notice to file to anyone it thinks needs to: people who filed last year, or who once registered as self-employed. If the ${read.label} year had nothing that needed a return (all your income was taxed through PAYE, no self-employment or rental income over £1,000, no untaxed income over £2,500, no gains to report, no Child Benefit charge you haven't already paid through your tax code), ask HMRC to withdraw it. The sooner the better: HMRC can only withdraw a notice within a time limit after the year ends.`,
        "If it agrees, any late filing penalty is cancelled too. If you've stopped being self-employed, tell HMRC that as well, or the notices keep coming.",
      );
      break;
    case "register":
      if (today <= d.fileBy)
        parts.push(
          `The rule is to register by ${letterDate(d.registerBy)}, but the penalty for missing that is a share of the tax that was paid late because of it. If the return is in and the tax paid by ${letterDate(d.fileBy)}, nothing was late, so there's nothing to charge. Registering gives you a Unique Taxpayer Reference, which can take a couple of weeks to arrive by post, and you need it to file. So register this week, not in January.`,
        );
      else
        parts.push(
          "Not telling HMRC is charged as a share of the tax that went unpaid because of it: up to 30% if it was careless, more if deliberate. Telling HMRC yourself, before it asks, cuts that a long way, and for a careless mistake disclosed within 12 months of the tax being due it can be nothing at all. Waiting for a letter from HMRC first is what makes it expensive. Register, file the return as soon as you have your reference, and pay or set up a plan.",
        );
      break;
    case "early":
      if (inp.asked === "late")
        parts.push(
          `Because HMRC's notice came after 31 October, you have three months from it: to ${letterDate(d.fileBy)}, for the payment too, as long as you told HMRC about the income by 5 October.`,
        );
      parts.push(
        `The return and the money have separate clocks. Filing late costs £100 the day after ${letterDate(d.fileBy)}, then from ${letterDate(d.dailyFrom)} £10 a day for 90 days, then 5% of the year's tax, or £300 if that's more, at six months and again at twelve. Paying late costs interest from the day after, then 5% of what's still unpaid at 30 days, six months and twelve months.`,
      );
      if (inp.canPay === "none" || inp.canPay === "plan")
        parts.push(
          `So if you can't pay, the costly move is waiting to file until you can. File on time and the filing clock never starts. Then set up a Time to Pay arrangement before ${letterDate(d.pay30)}, and the late payment penalties don't apply while you keep to it; you pay interest only. If you owe ${money(ONLINE_PLAN_LIMIT)} or less and the return is filed, you can usually set it up online yourself.`,
        );
      else
        parts.push(
          "If it's the return itself you've been putting off, it's usually an evening's work once the figures are in front of you. If a document is missing, an honest estimate marked as provisional is allowed, and you can amend the return for twelve months after the deadline.",
        );
      break;
    case "late":
      parts.push(
        `The deadline was ${letterDate(d.fileBy)}. The £100 has landed whatever you owe. The next steps are £10 a day from ${letterDate(d.dailyFrom)} for 90 days (up to £900), then 5% of the tax or £300 at six months (${letterDate(d.sixFrom)}) and again at twelve months (${letterDate(d.twelveFrom)}). The only thing that stops them is filing.`,
      );
      if (inp.canPay !== "all")
        parts.push(
          "If not being able to pay is why it hasn't gone in, file anyway. The filing penalties stop the day it's filed, and the tax can then go on a payment plan.",
        );
      if (inp.excuse && inp.excuse !== "none")
        parts.push(
          "If something outside your control stopped you filing, appeal each penalty within 30 days of its notice, and file as soon as the problem ends: an excuse only covers the time it lasted.",
        );
      break;
    case "unpaid":
      parts.push(
        `Interest has run on the whole January bill since ${letterDate(addDaysISO(d.payBy, 1))}, at about ${pctOf(rateOn(today))} a year. On top, 5% of the year's balancing payment is added if it's still unpaid after ${letterDate(d.pay30)}, again after ${letterDate(d.pay6)}, and again after ${letterDate(d.pay12)}. The payment on account part gets interest but no penalty.`,
        `A Time to Pay arrangement agreed before one of those dates stops that penalty and the ones after it, as long as you keep to it. If you owe ${money(ONLINE_PLAN_LIMIT)} or less you can usually set it up online; otherwise ring HMRC's Payment Support Service. Have ready what you can pay now and what you can pay a month.`,
      );
      break;
    case "plan":
      parts.push(
        "Interest still runs on what's left, but the late payment penalties don't, for any penalty date after the plan was agreed. Miss a payment, or the next bill, and HMRC can cancel the plan and charge them. If your income drops, ring before a payment is missed, not after.",
      );
      break;
    case "done":
      if (read.now.total > 0)
        parts.push(
          "A reasonable excuse is something that stopped you that was outside your control: a serious illness, a death close to you, an HMRC system failure, a fire or flood, post that never arrived. Not knowing about the deadline, not getting a reminder, relying on someone else, or not having the money don't count. Appeal online or by post within 30 days of each penalty notice.",
        );
      else parts.push("Put next year's dates in the calendar now. If you'll owe tax again, payments on account are due on 31 January and 31 July.");
      break;
  }
  if (m && m.poa > 0 && (read.status === "early" || read.status === "late" || read.status === "unpaid") && m.firstYear)
    parts.push(
      `January's bill isn't only this year's tax. It's ${money(m.balancing)} for ${read.label}, plus ${money(m.poa)} as the first payment towards the next year, with another ${money(m.poa)} ${d.july < today ? "that was due" : "due"} on ${letterDate(d.july)}. If next year's income will be lower, you can ask to reduce the payments on account.`,
    );
  if (read.mtdYear && (read.status === "early" || read.status === "late"))
    parts.push(
      "If you're in Making Tax Digital for Income Tax (sole traders and landlords with qualifying income over £50,000), its own late filing points and late payment penalties apply from 2026/27, not these. The deadlines are the same.",
    );
  return parts.join(" ");
}

export type TrLetter = { id: string; title: string; note: string; text: string };

const EXCUSE_TEXT: Record<Exclude<TrExcuse, "" | "none">, string> = {
  illness: "I was seriously ill [or: in hospital / caring for someone who was seriously ill] from [date] to [date], and couldn't deal with my tax affairs during that time. [Brief details, and what you can enclose: a letter from a doctor or hospital.]",
  death: "[Name], my [relationship], died on [date], shortly before the deadline. I was dealing with the funeral and their affairs and couldn't complete the return. [Enclose a copy of the death certificate if you can.]",
  hmrc: "I tried to file online on [date], before the deadline, and couldn't because [HMRC's system was unavailable / my Government Gateway account was locked / I was waiting for my Unique Taxpayer Reference, which I requested on (date)]. [Screenshots or reference numbers.]",
  post: "I didn't receive [the notice to file / my Unique Taxpayer Reference / my activation code] until [date]. [Why: a change of address you'd told HMRC about on (date), postal delays.]",
  other: "[What happened, when it started and ended, and why it was outside your control.]",
};

export function trLetters(inp: TrInputs, read: TrRead): TrLetter[] {
  const out: TrLetter[] = [];
  const ref = "Unique Taxpayer Reference (UTR): [10 digits]";
  if (read.status === "withdraw") {
    out.push({
      id: "withdraw",
      title: "Ask HMRC to withdraw the notice to file",
      note: "Send it through your HMRC online account, or by post to the Self Assessment address on gov.uk, and keep a copy. Ask as soon as you can; HMRC can only withdraw a notice within a time limit.",
      text: [
        "Dear HMRC,",
        "",
        ref,
        `Tax year: ${read.label}`,
        "",
        `I've been sent a notice to file a Self Assessment tax return for ${read.label}. I don't think I need to file one: [all my income was taxed through PAYE / I stopped being self-employed on (date) / I had no untaxed income above the limits].`,
        "",
        "Please withdraw the notice to file for this year, cancel any late filing penalty, and [take me out of Self Assessment / tell me if I still need to file in future years].",
        "",
        "Yours faithfully,",
        "[Your name]",
        "[Your address]",
        "[National Insurance number]",
      ].join("\n"),
    });
  }
  if ((read.status === "late" || read.status === "done" || read.status === "unpaid" || read.status === "plan") && read.now.filing > 0 && inp.excuse && inp.excuse !== "none") {
    out.push({
      id: "appeal",
      title: "Appeal the late filing penalty",
      note: "Send it within 30 days of the date on the penalty notice, online through your HMRC account or with form SA370 by post. File the return first, or with the appeal: HMRC won't consider it until the return is in. Keep a copy.",
      text: [
        "Dear HMRC,",
        "",
        ref,
        `Tax year: ${read.label}`,
        "Penalty notice dated: [date]",
        "",
        `I'm appealing against the late filing penalty${read.now.filing > FIRST_PENALTY ? "s" : ""} for ${read.label}, because I had a reasonable excuse for filing late.`,
        "",
        EXCUSE_TEXT[inp.excuse],
        "",
        `I filed the return on ${inp.filed === "yes" && isISODate(inp.filedOn) ? letterDate(inp.filedOn) : "[date]"}, as soon as I could once that ended.`,
        "",
        "Please cancel the penalty. If you don't agree, please tell me how to ask for an independent review.",
        "",
        "Yours faithfully,",
        "[Your name]",
        "[Your address]",
      ].join("\n"),
    });
  }
  const m = read.m;
  if (
    m &&
    m.january > 0 &&
    (read.status === "unpaid" || ((read.status === "early" || read.status === "late") && inp.canPay !== "all"))
  ) {
    out.push({
      id: "plan",
      title: "What to say to set up a payment plan",
      note:
        m.january <= ONLINE_PLAN_LIMIT
          ? "With the return filed and no other HMRC plans, you can usually do this online through your HMRC account. If not, ring the Payment Support Service. Either way, have these figures ready."
          : "Over £30,000, ring HMRC's Payment Support Service; you'll be asked about your income and outgoings. Have these figures ready.",
      text: [
        `I owe ${money(m.january)} for my ${read.label} Self Assessment, due on ${letterDate(read.d.payBy)}.`,
        `My return ${inp.filed === "yes" ? "is filed" : "will be filed by [date]"}. UTR: [10 digits].`,
        "I can't pay it all at once. I can pay £[amount] now and £[amount] a month from [date], which would clear it in [number] months.",
        "My income is about £[amount] a month and my essential spending about £[amount].",
        m.poa > 0 ? `I know a further ${money(m.poa)} is due on ${letterDate(read.d.july)}. [I'd like that included / I'll pay it on time / I think my income this year will be lower and I'll ask to reduce it.]` : "",
        "Please confirm the plan in writing.",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }
  return out;
}

export function trRule(): string {
  return "Every January I file by the 31st even if I can't pay, because the return and the money have separate clocks. If I can't pay, I set up a plan before the 30-day point, and I put a share of untaxed income aside the day it lands.";
}

export function trReminders(read: TrRead, today: string): { on: string; title: string; body: string }[] {
  const out: { on: string; title: string; body: string }[] = [];
  const add = (on: string, title: string, body: string) => {
    if (on && on >= today) out.push({ on, title, body });
  };
  const d = read.d;
  if (read.status === "register") add(addDaysISO(today, 14), "Chase your Self Assessment reference (UTR)", "If it hasn't arrived, ring HMRC: you need it to file by 31 January.");
  if (read.status === "early" || read.status === "register") {
    add(addDaysISO(d.fileBy, -14), "Two weeks to file your tax return", "Start now: you need your login and UTR, and January's helplines are busy.");
    add(d.fileBy, "Tax return and payment due today", "File online by midnight. If you can't pay, file anyway, then set up a payment plan.");
  }
  if (read.status === "late") {
    add(addDaysISO(d.dailyFrom, -1), "Last day before the £10-a-day tax return penalty", "File today to keep the filing penalty at £100.");
    add(addDaysISO(d.sixFrom, -1), "Last day before the six-month tax return penalty", "File today: tomorrow adds 5% of the tax or £300.");
  }
  if ((read.status === "early" || read.status === "late" || read.status === "unpaid") && read.m && read.m.january > 0)
    add(d.pay30, "Last day to pay or set up a tax payment plan", "After today, 5% of the unpaid tax is added. A plan agreed today stops it.");
  if (read.m && read.m.poa > 0 && read.status !== "withdraw") add(d.july, "Second payment on account due", `About ${money(read.m.poa)} towards next year's tax.`);
  return out;
}

export function trSummary(inp: TrInputs, read: TrRead, today = todayISO()): string {
  const lines: string[] = [];
  lines.push(`Self Assessment ${read.label}`);
  lines.push("", trHeadline(inp, read, today), "", trBody(inp, read, today));
  if (read.now.lines.length) {
    lines.push("", "What's been added:");
    for (const l of read.now.lines) lines.push(`- ${l.label}: ${money(l.amount)}`);
  }
  if (read.stairs.length) {
    lines.push("", "If it all happens on:");
    for (const s of read.stairs) lines.push(`- ${letterDate(s.on)} (${s.label}): about ${pounds(s.total)} added`);
  }
  for (const l of trLetters(inp, read)) lines.push("", `${l.title}:`, "", l.text);
  lines.push("", trRule());
  return lines.join("\n");
}

const ASKED: TrAsked[] = ["usual", "late", "none"];
const NEED: TrNeed[] = ["yes", "unsure", "nothing"];
const FILED: TrFiled[] = ["no", "yes"];
const PAID: TrPaid[] = ["no", "full", "plan"];
const CAN: TrCanPay[] = ["all", "plan", "none"];
const EXCUSES: TrExcuse[] = ["illness", "death", "hmrc", "post", "other", "none"];
const YN: YesNo[] = ["yes", "no"];
const MONTHS = ["3", "6", "12", "24"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 40): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

export function parseTrInputs(raw: unknown): TrInputs {
  if (!raw || typeof raw !== "object") return BLANK_TR;
  const v = raw as Record<string, unknown>;
  return {
    year: typeof v.year === "string" && /^\d{4}$/.test(v.year) ? v.year : "",
    asked: oneOf(v.asked, ASKED),
    noticeOn: date(v.noticeOn),
    need: oneOf(v.need, NEED),
    filed: oneOf(v.filed, FILED),
    filedOn: date(v.filedOn),
    tax: str(v.tax),
    poaPaid: str(v.poaPaid),
    mostPaye: oneOf(v.mostPaye, YN),
    paid: oneOf(v.paid, PAID),
    paidOn: date(v.paidOn),
    planOn: date(v.planOn),
    planMonths: oneOf(v.planMonths, MONTHS),
    canPay: oneOf(v.canPay, CAN),
    excuse: oneOf(v.excuse, EXCUSES),
  };
}

/**
 * The worked example: a first year self-employed, £4,200 of tax for the year,
 * no return yet, and no money for January. The plan was to file "when I can
 * pay", around the summer.
 */
export function trExample(today = todayISO()): TrInputs {
  return {
    year: String(latestEnded(today)),
    asked: "usual",
    noticeOn: "",
    need: "yes",
    filed: "no",
    filedOn: "",
    tax: "£4,200",
    poaPaid: "",
    mostPaye: "no",
    paid: "",
    paidOn: "",
    planOn: "",
    planMonths: "",
    canPay: "plan",
    excuse: "",
  };
}
