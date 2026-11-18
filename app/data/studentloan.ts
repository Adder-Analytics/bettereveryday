/**
 * The read behind "Student Loan: Overpay, or Let It Run Out?" (/studentloan).
 *
 * A UK student loan from the Student Loans Company isn't an ordinary debt.
 * Repayments are a share of pay above a threshold, whatever the balance, and
 * whatever is left at the end of the term is written off. So for anyone who
 * won't clear it before the write-off, the balance isn't the bill: a pound
 * overpaid today doesn't lower what they'll repay, it only lowers what gets
 * written off. For someone who will clear it, overpaying saves interest at
 * the loan's rate. The tool runs the loan forward month by month to tell the
 * two apart, and prices an overpayment (and clearing it today) against
 * letting it run.
 *
 * The rules and figures, as far as the sources I could reach agree (gov.uk,
 * the IFS and the payroll press were DNS-blocked from the sandbox; see
 * docs/2026-11-18-session-notes.md):
 *
 *   - Thresholds from 6 April 2026 (2026/27): Plan 1 £26,900, Plan 2
 *     £29,385, Plan 4 (Scotland) £33,795, Plan 5 £25,000, Postgraduate
 *     £21,000. Repayments are 9% of pay above the threshold (6% for the
 *     Postgraduate Loan). 2025/26: Plan 1 £26,065, Plan 2 £28,470, Plan 4
 *     £32,745, Postgraduate £21,000; Plan 5 repayments start from April 2026.
 *   - The 2025 Autumn Budget froze the Plan 2 repayment threshold (and, per
 *     the IFS, the interest thresholds) at the April 2026 level for three
 *     years from April 2027. The Welsh Government said it won't follow the
 *     freeze for its borrowers. The IFS assumes RPI uprating resumes after.
 *   - Interest from 1 September 2026: RPI was 4.1%. Plan 1 and Plan 4 pay the
 *     lower of RPI and Bank Rate plus 1% (4.1%). Plan 5 pays RPI (4.1%).
 *     Plan 2 pays RPI on income up to the lower threshold, rising in a
 *     straight line to RPI plus 3% at the upper threshold (£52,885 from April
 *     2026); Postgraduate pays RPI plus 3%. For 2026/27 both are capped at 6%.
 *   - Write-off: Plan 1, 25 years after the April first due (first loan paid
 *     on or after 1 September 2006), else at 65; Plan 2, 30 years; Plan 4, 30
 *     years (older loans at 65 or 30 years, whichever first); Plan 5, 40
 *     years; Postgraduate, 30 years. Counted from the April after the course
 *     ends, when repayments were first due.
 *   - Refunds: if pay over a whole tax year was below the threshold but
 *     repayments were taken, the SLC refunds them on request. The SLC says
 *     over-repayment at the end of a loan is avoidable by switching to Direct
 *     Debit for the last two years, and contacts borrowers two years before.
 *     Graduates over-repaid about £184m in one recent year.
 *
 * Projections beyond 2026/27 are assumptions the user can change: pay rises
 * at a steady rate, RPI is steady, Bank Rate plus 1% stays above RPI, the 6%
 * cap isn't renewed, and the Plan 5 threshold rises with RPI from April 2027
 * (the Postgraduate threshold stays at £21,000, as it has since 2016).
 * Not financial advice. Pure data and functions, no React.
 */

import { formatMoney, parseMoney } from "./worth";
import { addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { isISODate, letterDate, todayISO };

export type Plan = "" | "1" | "2" | "4" | "5" | "pg";
export type YesNo = "" | "yes" | "no";

export type StudentLoanInputs = {
  plan: Plan;
  /** Plan 2 only: a Student Finance Wales borrower, not frozen. */
  wales: YesNo;
  /** Plan 1 or 4 only: first loan before September 2006 (Plan 1) or August 2007 (Plan 4). */
  older: YesNo;
  /** Year of birth, only for an older Plan 1 or 4 loan (written off at 65). */
  born: string;
  /** What the SLC says is owed. */
  balance: string;
  /** The year of the April repayments were first due. */
  firstDue: string;
  /** Pay before tax, a year. */
  salary: string;
  /** Average pay rise a year, %. */
  growth: string;
  /** A one-off overpayment being considered. */
  lump: string;
  /** An extra amount a month being considered. */
  extra: string;
  /** What the money would earn in savings instead, % a year. */
  savings: string;
  /** RPI from September 2027, %. */
  rpi: string;
  /** Pay in the last full tax year (6 April 2025 to 5 April 2026), for the refund check. */
  lastYear: string;
};

export const BLANK_STUDENTLOAN: StudentLoanInputs = {
  plan: "",
  wales: "",
  older: "",
  born: "",
  balance: "",
  firstDue: "",
  salary: "",
  growth: "",
  lump: "",
  extra: "",
  savings: "",
  rpi: "",
  lastYear: "",
};

/** The first tax year and academic year the tool's current figures apply to. */
export const BASE_YEAR = 2026;
/** RPI used for 2026/27 interest (March 2026). */
export const RPI_NOW = 4.1;
export const RATE_CAP_NOW = 6;
export const DEFAULT_GROWTH = 4;
export const DEFAULT_RPI = 3;
export const DEFAULT_SAVINGS = 4;
/** The reference overpayment priced when none is typed. */
export const REFERENCE_LUMP = 1000;
export const PLAN2_UPPER = 52885;
export const FREEZE_FROM = 2027;
export const FREEZE_TO = 2029;
/** Months before the end when the SLC suggests moving to Direct Debit. */
export const DD_MONTHS = 24;

export const THRESHOLD_NOW: Record<Exclude<Plan, "">, number> = { "1": 26900, "2": 29385, "4": 33795, "5": 25000, pg: 21000 };
export const THRESHOLD_LAST: Record<Exclude<Plan, "">, number | null> = { "1": 26065, "2": 28470, "4": 32745, "5": null, pg: 21000 };
export const TERM: Record<Exclude<Plan, "">, number> = { "1": 25, "2": 30, "4": 30, "5": 40, pg: 30 };
export const SHARE: Record<Exclude<Plan, "">, number> = { "1": 0.09, "2": 0.09, "4": 0.09, "5": 0.09, pg: 0.06 };
export const PLAN_NAME: Record<Exclude<Plan, "">, string> = {
  "1": "Plan 1",
  "2": "Plan 2",
  "4": "Plan 4",
  "5": "Plan 5",
  pg: "Postgraduate Loan",
};

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

export function pct(n: number): string {
  return `${(Math.round(n * 100) / 100).toString()}%`;
}

/** A rate typed as "3", "3.5%" or "3,5". null if blank or not sensible. */
export function parseRate(raw: string): number | null {
  const s = raw.trim().replace(/%$/, "").trim().replace(",", ".");
  if (!s) return null;
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > -10 && n < 20 ? n : null;
}

export function rateInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseRate(raw) === null;
}

export function parseYear(raw: string, min = 1960, max = 2035): number | null {
  const s = raw.trim();
  if (!/^\d{4}$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
}

export function yearInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseYear(raw) === null;
}

/** The tax year (by its starting year) a month falls in: April 2027 is 2027/28. */
function taxYearOf(y: number, m: number): number {
  return m >= 4 ? y : y - 1;
}

/** The academic (interest) year a month falls in: September 2026 to August 2027 is 2026. */
function acYearOf(y: number, m: number): number {
  return m >= 9 ? y : y - 1;
}

/** How many years of uprating a threshold has had by tax year `ty`. */
function upratings(plan: Exclude<Plan, "">, ty: number, frozen: boolean): number {
  if (ty <= BASE_YEAR) return 0;
  if (plan === "pg") return 0;
  if (plan === "2" && frozen) return Math.max(0, ty - FREEZE_TO);
  return ty - BASE_YEAR;
}

export function thresholdFor(plan: Exclude<Plan, "">, ty: number, rpi: number, frozen: boolean): number {
  return THRESHOLD_NOW[plan] * Math.pow(1 + rpi / 100, upratings(plan, ty, frozen));
}

export function upperFor(ty: number, rpi: number, frozen: boolean): number {
  return PLAN2_UPPER * Math.pow(1 + rpi / 100, upratings("2", ty, frozen));
}

/** The interest rate for an academic year, given pay in that year. */
export function rateFor(plan: Exclude<Plan, "">, ay: number, pay: number, ty: number, rpi: number, frozen: boolean): number {
  const r = ay <= BASE_YEAR ? RPI_NOW : rpi;
  const capped = (x: number) => (ay <= BASE_YEAR ? Math.min(x, RATE_CAP_NOW) : x);
  if (plan === "1" || plan === "4" || plan === "5") return r;
  if (plan === "pg") return capped(r + 3);
  const lo = thresholdFor("2", ty, rpi, frozen);
  const hi = upperFor(ty, rpi, frozen);
  const frac = Math.max(0, Math.min(1, (pay - lo) / Math.max(1, hi - lo)));
  return capped(r + 3 * frac);
}

export type Run = {
  /** Everything paid from now on, including any overpayment. */
  total: number;
  /** The same, discounted to today at the savings rate. */
  pv: number;
  /** ISO month (first of the month) the loan is cleared, or "" if written off. */
  clearedOn: string;
  /** What's written off at the end (0 if cleared). */
  writtenOff: number;
  /** Interest added from now on. */
  interest: number;
  /** The repayment in the first month. */
  firstPay: number;
};

type Params = {
  plan: Exclude<Plan, "">;
  balance: number;
  salary: number;
  growth: number;
  rpi: number;
  savings: number;
  frozen: boolean;
  /** First of the current month. */
  start: string;
  /** First of the write-off month. */
  end: string;
};

/** Runs the loan month by month from `start` to the write-off or zero. */
export function simulate(p: Params, lump: number, extra: number): Run {
  let bal = p.balance;
  let total = 0;
  let pv = 0;
  let interest = 0;
  let firstPay = 0;
  const [sy, sm] = p.start.split("-").map(Number);
  const ty0 = taxYearOf(sy, sm);
  const dm = Math.pow(1 + p.savings / 100, -1 / 12);
  let disc = 1;
  if (lump > 0) {
    const l = Math.min(lump, bal);
    bal -= l;
    total += l;
    pv += l;
  }
  let y = sy;
  let m = sm;
  let k = 0;
  const [ey, em] = p.end.split("-").map(Number);
  while (bal > 0.005 && (y < ey || (y === ey && m < em)) && k < 12 * 60) {
    const ty = taxYearOf(y, m);
    const ay = acYearOf(y, m);
    const pay = p.salary * Math.pow(1 + p.growth / 100, ty - ty0);
    const r = rateFor(p.plan, ay, pay, ty, p.rpi, p.frozen);
    const int = (bal * r) / 1200;
    interest += int;
    bal += int;
    const th = thresholdFor(p.plan, ty, p.rpi, p.frozen);
    let rep = Math.max(0, ((pay - th) * SHARE[p.plan]) / 12);
    if (k === 0) firstPay = rep;
    rep += extra;
    rep = Math.min(rep, bal);
    bal -= rep;
    total += rep;
    pv += rep * disc;
    disc *= dm;
    k++;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  const p2 = (n: number) => String(n).padStart(2, "0");
  const cleared = bal <= 0.005;
  // The month the last payment fell in.
  let cy = y;
  let cm = m - 1;
  if (cm < 1) {
    cm = 12;
    cy--;
  }
  return {
    total,
    pv,
    clearedOn: cleared ? `${cy}-${p2(cm)}-01` : "",
    writtenOff: cleared ? 0 : bal,
    interest,
    firstPay,
  };
}

export type Verdict = "never" | "close" | "clears" | "edge" | "done";

export type StudentLoanRead = {
  plan: Exclude<Plan, "">;
  balance: number;
  salary: number;
  growth: number;
  rpi: number;
  savings: number;
  frozen: boolean;
  /** First of the write-off month. */
  writeOff: string;
  writeOffYears: number;
  /** True when the write-off is worked out from age 65 (an older loan). */
  atAge: boolean;
  threshold: number;
  rateNow: number;
  monthlyNow: number;
  base: Run;
  /** The overpayment being priced: the user's, or the £1,000 reference. */
  lump: number;
  extra: number;
  referenced: boolean;
  over: Run;
  /** Total paid with the overpayment minus without: negative is a saving. */
  diff: number;
  pvDiff: number;
  /** What clearing it today would cost, against letting it run. */
  clearNow: number;
  /** The starting pay at which it would clear before the write-off, if it doesn't now. */
  clearSalary: number | null;
  /** The average pay rise at which it would clear before the write-off, if it doesn't now. */
  clearGrowth: number | null;
  /** The smallest one-off overpayment today that would cut the total paid, if it doesn't clear now. */
  breakEven: number | null;
  verdict: Verdict;
  /** Plan 2 frozen: extra repaid over the loan's life because of the freeze. */
  freezeCost: number;
  /** Plan 2 frozen: extra repaid in 2027/28 alone because of the freeze. */
  freezeFirstYear: number;
  /** Repayments taken last tax year that should come back. */
  refund: { year: string; threshold: number; pay: number } | null;
  /** Pay this year is under the threshold: anything taken can be claimed back after 5 April. */
  underNow: boolean;
  /** The month to switch to Direct Debit, if it clears. */
  ddFrom: string;
};

export function studentLoanReady(inp: StudentLoanInputs): boolean {
  if (!inp.plan) return false;
  if ((parseMoney(inp.balance) ?? 0) <= 0) return false;
  if (parseMoney(inp.salary) === null) return false;
  if (olderApplies(inp) && inp.older === "yes") return parseYear(inp.born, 1940, 2010) !== null && parseYear(inp.firstDue, 1990, 2035) !== null;
  return parseYear(inp.firstDue, 1990, 2035) !== null;
}

export function olderApplies(inp: StudentLoanInputs): boolean {
  return inp.plan === "1" || inp.plan === "4";
}

function firstOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** The first month of the write-off, and whether it came from age 65. */
export function writeOffOf(inp: StudentLoanInputs): { on: string; atAge: boolean } | null {
  const plan = inp.plan;
  if (!plan) return null;
  const due = parseYear(inp.firstDue, 1990, 2035);
  if (due === null) return null;
  const byTerm = due + TERM[plan];
  if (olderApplies(inp) && inp.older === "yes") {
    const born = parseYear(inp.born, 1940, 2010);
    if (born === null) return null;
    const at65 = born + 65;
    if (plan === "1") return { on: `${at65}-04-01`, atAge: true };
    return at65 < byTerm ? { on: `${at65}-04-01`, atAge: true } : { on: `${byTerm}-04-01`, atAge: false };
  }
  return { on: `${byTerm}-04-01`, atAge: false };
}

function clearsBefore(r: Run): boolean {
  return r.clearedOn !== "";
}

export function readStudentLoan(inp: StudentLoanInputs, today = todayISO()): StudentLoanRead | null {
  if (!studentLoanReady(inp)) return null;
  const plan = inp.plan as Exclude<Plan, "">;
  const balance = parseMoney(inp.balance)!;
  const salary = parseMoney(inp.salary)!;
  const growth = parseRate(inp.growth) ?? DEFAULT_GROWTH;
  const rpi = parseRate(inp.rpi) ?? DEFAULT_RPI;
  const savings = parseRate(inp.savings) ?? DEFAULT_SAVINGS;
  const frozen = !(plan === "2" && inp.wales === "yes");
  const wo = writeOffOf(inp)!;
  const start = firstOfMonth(today);
  const params: Params = { plan, balance, salary, growth, rpi, savings, frozen, start, end: wo.on };

  const [ty, tm] = start.split("-").map(Number);
  const tyNow = taxYearOf(ty, tm);
  const threshold = thresholdFor(plan, tyNow, rpi, frozen);
  const rateNow = rateFor(plan, acYearOf(ty, tm), salary, tyNow, rpi, frozen);
  const monthlyNow = Math.max(0, ((salary - threshold) * SHARE[plan]) / 12);

  const typedLump = parseMoney(inp.lump) ?? 0;
  const typedExtra = parseMoney(inp.extra) ?? 0;
  const referenced = typedLump <= 0 && typedExtra <= 0;
  const lump = referenced ? Math.min(REFERENCE_LUMP, balance) : typedLump;
  const extra = referenced ? 0 : typedExtra;

  const done = start >= wo.on;
  const base = simulate(params, 0, 0);
  const over = simulate(params, lump, extra);
  const diff = over.total - base.total;
  const pvDiff = over.pv - base.pv;
  const clearNow = balance - base.total;

  let clearSalary: number | null = null;
  if (!done && !clearsBefore(base)) {
    let lo = salary;
    let hi = 1_000_000;
    if (clearsBefore(simulate({ ...params, salary: hi }, 0, 0))) {
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (clearsBefore(simulate({ ...params, salary: mid }, 0, 0))) hi = mid;
        else lo = mid;
      }
      clearSalary = Math.ceil(hi / 500) * 500;
    }
  }

  let clearGrowth: number | null = null;
  let breakEven: number | null = null;
  if (!done && !clearsBefore(base)) {
    let lo = growth;
    let hi = 15;
    if (clearsBefore(simulate({ ...params, growth: hi }, 0, 0))) {
      for (let i = 0; i < 30; i++) {
        const mid = (lo + hi) / 2;
        if (clearsBefore(simulate({ ...params, growth: mid }, 0, 0))) hi = mid;
        else lo = mid;
      }
      clearGrowth = Math.ceil(hi * 10) / 10;
    }
    // Small overpayments only shrink the write-off; a big enough one clears the
    // loan early and stops the repayments. Find the first lump that pays.
    const steps = 200;
    for (let i = 1; i <= steps; i++) {
      const l = (balance * i) / steps;
      if (simulate(params, l, 0).total < base.total - 1) {
        let a = (balance * (i - 1)) / steps;
        let b = l;
        for (let j = 0; j < 25; j++) {
          const mid = (a + b) / 2;
          if (simulate(params, mid, 0).total < base.total - 1) b = mid;
          else a = mid;
        }
        breakEven = Math.ceil(b / 100) * 100;
        break;
      }
    }
  }

  let verdict: Verdict;
  if (done) verdict = "done";
  else if (clearsBefore(base)) verdict = "clears";
  else if (diff < -1) verdict = "edge";
  else if (breakEven !== null && breakEven <= balance * 0.5) verdict = "close";
  else verdict = "never";

  let freezeCost = 0;
  let freezeFirstYear = 0;
  if (plan === "2" && frozen && !done) {
    const unfrozen = simulate({ ...params, frozen: false }, 0, 0);
    freezeCost = Math.max(0, base.total - unfrozen.total);
    const t27 = thresholdFor("2", FREEZE_FROM, rpi, true);
    const u27 = thresholdFor("2", FREEZE_FROM, rpi, false);
    const pay27 = salary * Math.pow(1 + growth / 100, FREEZE_FROM - tyNow);
    freezeFirstYear = Math.max(0, (Math.max(0, pay27 - t27) - Math.max(0, pay27 - u27)) * SHARE["2"]);
  }

  let refund: StudentLoanRead["refund"] = null;
  const lastPay = parseMoney(inp.lastYear);
  const lastTh = THRESHOLD_LAST[plan];
  if (lastPay !== null && lastTh !== null && lastPay < lastTh) refund = { year: "2025/26 (6 April 2025 to 5 April 2026)", threshold: lastTh, pay: lastPay };

  const ddFrom = base.clearedOn ? addMonthsISO(base.clearedOn, -DD_MONTHS) : "";

  return {
    plan,
    balance,
    salary,
    growth,
    rpi,
    savings,
    frozen,
    writeOff: wo.on,
    writeOffYears: Math.max(0, Number(wo.on.slice(0, 4)) - ty),
    atAge: wo.atAge,
    threshold,
    rateNow,
    monthlyNow,
    base,
    lump,
    extra,
    referenced,
    over,
    diff,
    pvDiff,
    clearNow,
    clearSalary,
    clearGrowth,
    breakEven,
    verdict,
    freezeCost,
    freezeFirstYear,
    refund,
    underNow: salary < threshold,
    ddFrom,
  };
}

function monthYear(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export { monthYear };

/** "an overpayment of £8,000 now" / "£50 a month extra" / both. */
export function overLabel(read: StudentLoanRead): string {
  const parts: string[] = [];
  if (read.lump > 0) parts.push(`${money(read.lump)} now`);
  if (read.extra > 0) parts.push(`${money(read.extra)} a month`);
  return parts.join(" and ");
}

export function studentLoanHeadline(read: StudentLoanRead): string {
  const name = PLAN_NAME[read.plan];
  const over = overLabel(read);
  switch (read.verdict) {
    case "done":
      return `This ${name} loan should already have been written off (${monthYear(read.writeOff)}). If repayments are still being taken, ask the Student Loans Company to stop them and refund the difference.`;
    case "never":
      return `On these numbers you won't clear it: about ${money(read.base.writtenOff)} is written off in ${monthYear(read.writeOff)}. Overpaying ${over} wouldn't lower what you repay; it would add ${money(read.diff)} to it.`;
    case "close":
      return `You're close to the line: on these numbers about ${money(read.base.writtenOff)} is written off in ${monthYear(read.writeOff)}. A small overpayment is lost, but anything over about ${money(read.breakEven ?? 0)} now would start to cut what you repay.`;
    case "edge":
      return `On these numbers the overpayment tips it: ${over} would clear the loan before the write-off and cut what you repay by about ${money(-read.diff)}.`;
    case "clears":
      return `You're on course to clear it in ${monthYear(read.base.clearedOn)}. Overpaying ${over} would save about ${money(-read.diff)} in total, as if it earned the loan's ${pct(read.rateNow)} interest.`;
  }
}

export function studentLoanBody(read: StudentLoanRead): string {
  const parts: string[] = [];
  const name = PLAN_NAME[read.plan];
  const share = read.plan === "pg" ? "6%" : "9%";
  if (read.verdict === "done") {
    parts.push(
      `${name} loans are written off ${read.atAge ? "at 65" : `${TERM[read.plan]} years after the April repayments were first due`}. Ring the Student Loans Company with your customer reference and ask them to confirm the date in writing.`,
    );
    return parts.join(" ");
  }
  parts.push(
    `What you repay is set by your pay, not the balance: ${share} of everything over ${money(read.threshold)} a year, ${read.underNow ? "so nothing while you earn under it" : `about ${money(read.monthlyNow)} a month now`}. Interest is ${pct(read.rateNow)} at the moment, and whatever is left in ${monthYear(read.writeOff)} is written off.`,
  );
  if (read.verdict === "never" || read.verdict === "close") {
    parts.push(
      read.base.total < 1
        ? `On these numbers your pay never passes the threshold, so letting it run you'd pay nothing at all. Clearing it today would cost ${money(read.balance)}.`
        : `Letting it run, you'd pay about ${money(read.base.total)} in all from now (${money(read.base.pv)} in today's money, counting what savings would earn at ${pct(read.savings)}). Clearing it today would cost ${money(read.balance)}.`,
    );
    if (read.clearSalary !== null && read.clearGrowth !== null)
      parts.push(
        `It would only clear before the write-off if you earned about ${money(read.clearSalary)} now with ${pct(read.growth)} rises, or kept your pay and got rises of about ${pct(read.clearGrowth)} a year on average.`,
      );
    if (read.verdict === "close")
      parts.push(
        `Near the line, small overpayments only shrink the write-off; a big one stops the repayments years early. If your pay is likely to rise faster than ${pct(read.growth)}, you may clear it anyway, so check again each April before paying in.`,
      );
    else
      parts.push(
        "For you it works less like a debt and more like an extra tax on pay above the threshold for a fixed number of years. The money you'd overpay does more as savings, a pension contribution or a house deposit.",
      );
  } else {
    parts.push(
      `Letting it run, you'd pay about ${money(read.base.total)} in all from now. With the overpayment, about ${money(read.over.total)}, including the overpayment itself.`,
    );
    if (read.pvDiff > -1)
      parts.push(
        `Counted in today's money at ${pct(read.savings)}, though, it's roughly a wash (${read.pvDiff > 0 ? `${money(read.pvDiff)} worse` : "no better"}): savings paying ${pct(read.savings)} would do as well, and stay yours if you lose your job or need a deposit.`,
      );
    else
      parts.push(
        `Counted in today's money at ${pct(read.savings)}, the saving is about ${money(-read.pvDiff)}. Overpaid money can't be taken back, so keep an emergency fund first, and clear any card or loan charging more.`,
      );
  }
  if (read.freezeCost >= 50)
    parts.push(
      `The Plan 2 threshold is frozen at £29,385 from April 2027 to April 2030 instead of rising with prices. On these numbers that adds about ${money(read.freezeFirstYear)} to what you repay in 2027/28 and about ${money(read.freezeCost)} over the loan.`,
    );
  if (read.refund)
    parts.push(
      `Last tax year you earned ${money(read.refund.pay)}, under the ${money(read.refund.threshold)} threshold for that year, so any repayments taken from your pay then can be refunded: ask the Student Loans Company.`,
    );
  return parts.join(" ");
}

export type Row = { id: string; label: string; total: number; pv: number; note: string };

export function rowsOf(read: StudentLoanRead): Row[] {
  const fate = (r: Run) => (r.clearedOn ? `cleared ${monthYear(r.clearedOn)}` : `${money(r.writtenOff)} written off ${monthYear(read.writeOff)}`);
  const rows: Row[] = [
    { id: "run", label: "Let it run", total: read.base.total, pv: read.base.pv, note: fate(read.base) },
    {
      id: "over",
      label: `Overpay ${overLabel(read)}${read.referenced ? " (an example)" : ""}`,
      total: read.over.total,
      pv: read.over.pv,
      note: fate(read.over),
    },
  ];
  if (read.lump < read.balance) rows.push({ id: "clear", label: "Clear it today", total: read.balance, pv: read.balance, note: "nothing more to pay" });
  return rows;
}

export type DateLine = { on: string; title: string; body: string };

export function datesOf(read: StudentLoanRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  if (read.verdict === "done") return out;
  out.push({ on: "2027-04-05", title: "The tax year ends", body: read.underNow ? "If your pay for the whole year is under the threshold, claim back anything taken." : "Check your P60 against the student loan deductions on your payslips." });
  if (read.plan === "2" && read.frozen) out.push({ on: "2027-04-06", title: "The Plan 2 threshold freeze starts", body: "£29,385 until April 2030, instead of rising with prices." });
  out.push({ on: "2027-09-01", title: "Interest rates reset", body: read.plan === "2" || read.plan === "pg" ? "The 6% cap was set for 2026/27 only. Check the new rate." : "Set from the March RPI figure. Check the new rate." });
  if (read.plan === "2" && read.frozen) out.push({ on: "2030-04-06", title: "The freeze is due to end", body: "Thresholds are expected to rise with RPI again." });
  if (read.ddFrom) out.push({ on: read.ddFrom, title: "Switch to Direct Debit", body: "Two years before it clears, so your employer can't overpay it at the end." });
  if (read.base.clearedOn) out.push({ on: read.base.clearedOn, title: "On course to clear it", body: "On these numbers. Check the balance each year." });
  out.push({ on: read.writeOff, title: "Written off", body: read.atAge ? "At 65, for older loans. Whatever is left goes." : `${TERM[read.plan]} years after the April repayments were first due. Whatever is left goes.` });
  return out.filter((d) => d.on >= today).sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

export function remindersOf(read: StudentLoanRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  if (read.verdict === "done") return out;
  out.push({ on: "2027-04-20", title: "Student loan: run the sums again", body: "New tax year, new threshold. Check your P60, the balance and whether overpaying makes sense." });
  if (read.refund || read.underNow) out.push({ on: read.refund ? today : "2027-04-06", title: "Claim back student loan repayments", body: "Pay for the tax year under the threshold. Ask the Student Loans Company for a refund, with your P60." });
  if (read.ddFrom) out.push({ on: read.ddFrom, title: "Switch the student loan to Direct Debit", body: "Two years before it clears, so it isn't overpaid at the end." });
  return out.filter((d) => d.on >= today);
}

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(read: StudentLoanRead): Message[] {
  const out: Message[] = [];
  const name = PLAN_NAME[read.plan];
  out.push({
    id: "check",
    title: "To the Student Loans Company: check the numbers first",
    note: "Send it through your online account's secure messages, or read it down the phone (0300 100 0611 for England). The plan type matters: an employer using the wrong one takes the wrong amount.",
    text: `Hello,

My customer reference number is [number]. Please can you confirm, in writing:

- which plan or plans my loan is on (I believe ${name});
- the balance today, and the interest rate being charged;
- the date my loan will be written off;
- the repayments you've received from HMRC for the last two tax years, so I can check them against my P60s.

Thank you,
[Your name]`,
  });
  if (read.refund || read.underNow)
    out.push({
      id: "refund",
      title: "To the Student Loans Company: a refund",
      note: "If your pay over a whole tax year (6 April to 5 April) was under the threshold, repayments taken in the months you earned more can come back. Have your P60 or final payslip to hand. Ask about earlier years too.",
      text: `Hello,

My customer reference number is [number]. In the tax year ${read.refund ? read.refund.year : "6 April 2026 to 5 April 2027"} my total income was ${read.refund ? money(read.refund.pay) : "[amount]"}, below the ${name} repayment threshold of ${money(read.refund ? read.refund.threshold : read.threshold)} for that year, but student loan repayments were taken from my pay.

Please can you refund the repayments for that year. I can send my P60 if you need it.

Thank you,
[Your name]`,
    });
  if (read.ddFrom)
    out.push({
      id: "dd",
      title: `To the Student Loans Company: in ${monthYear(read.ddFrom)}, switch to Direct Debit`,
      note: "HMRC passes on payroll deductions with a delay, so loans cleared through pay are often overpaid at the end. The SLC says paying the last two years by Direct Debit avoids it.",
      text: `Hello,

My customer reference number is [number]. I expect to finish repaying my loan in about two years. Please can you move my repayments from my salary to Direct Debit for the rest of the loan, tell me the monthly amount, and confirm you'll tell HMRC and my employer to stop deductions.

Thank you,
[Your name]`,
    });
  return out;
}

export function keepList(read: StudentLoanRead): string[] {
  const out = [
    "Your SLC customer reference number and online account login.",
    "Each year's P60, and a payslip showing the student loan plan type your employer is using.",
    "The annual statement from the Student Loans Company: balance, interest and the write-off date.",
  ];
  if (read.refund || read.underNow) out.push("The P60 or final payslip for any year you earned under the threshold.");
  if (read.verdict === "clears") out.push("A note of any overpayment you make, with the date: it can't be taken back.");
  return out;
}

export function studentLoanRule(read: StudentLoanRead): string {
  if (read.verdict === "clears" || read.verdict === "edge")
    return "I'm on course to clear my student loan, so an overpayment earns its interest rate, but only after the emergency fund and dearer debts. I switch to Direct Debit two years before the end.";
  return "My student loan bill is set by my pay, not the balance. I only overpay if I'm on course to clear it before it's written off, and I run the sums again each April.";
}

export function studentLoanSummary(read: StudentLoanRead, today = todayISO()): string {
  const lines = [`Student loan (${PLAN_NAME[read.plan]}): ${studentLoanHeadline(read)}`, "", studentLoanBody(read), ""];
  if (read.verdict !== "done") {
    lines.push(`From now, in all (and in today's money at ${pct(read.savings)}):`);
    for (const r of rowsOf(read)) lines.push(`- ${r.label}: ${money(r.total)} (${money(r.pv)}), ${r.note}`);
    lines.push("", "Dates:");
    for (const d of datesOf(read, today)) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
  }
  lines.push("", `Rule: ${studentLoanRule(read)}`, "", `Assumes pay rises of ${pct(read.growth)} a year and RPI of ${pct(read.rpi)} from September 2027.`, "From https://bettereveryday.vercel.app/studentloan. Not financial advice.");
  return lines.join("\n");
}

const PLANS: Exclude<Plan, "">[] = ["1", "2", "4", "5", "pg"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 20): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function parseStudentLoanInputs(raw: unknown): StudentLoanInputs {
  if (!raw || typeof raw !== "object") return BLANK_STUDENTLOAN;
  const v = raw as Record<string, unknown>;
  return {
    plan: oneOf(v.plan, PLANS),
    wales: oneOf(v.wales, YESNOS),
    older: oneOf(v.older, YESNOS),
    born: str(v.born, 4),
    balance: str(v.balance),
    firstDue: str(v.firstDue, 4),
    salary: str(v.salary),
    growth: str(v.growth, 6),
    lump: str(v.lump),
    extra: str(v.extra),
    savings: str(v.savings, 6),
    rpi: str(v.rpi, 6),
    lastYear: str(v.lastYear),
  };
}

/**
 * The worked example: a Plan 2 graduate who left in 2020, about £52,000 owed,
 * on £34,000, with £8,000 from a grandparent and an urge to clear the debt.
 */
export function studentLoanExample(): StudentLoanInputs {
  return {
    ...BLANK_STUDENTLOAN,
    plan: "2",
    wales: "no",
    balance: "£52,000",
    firstDue: "2021",
    salary: "£34,000",
    lump: "£8,000",
  };
}
