/**
 * The read behind "Is Your Tax Code Right?" (/taxcode).
 *
 * A PAYE tax code is HMRC's forecast of your year, written into your payslip:
 * the number times ten (plus nine, in the tables) is the tax-free pay spread
 * across the year, the letter says why, and a W1, M1 or X on the end says the
 * code is "non-cumulative", so each payslip is taxed as if it were the first
 * of the year. Most people never read it. Two things make that expensive.
 *
 *   1. A cumulative code is a running total. Every payslip recomputes the tax
 *      due on all the pay so far this year against all the allowance so far,
 *      and takes the difference. So a wrong code fixed before 5 April gives
 *      back every pound it over-took, in one payslip, with nothing to claim.
 *   2. The running total closes on 5 April. After that, an overpayment is a
 *      P800 calculation months later, and HMRC has mostly stopped paying those
 *      automatically since 2024: you claim it, within four years.
 *
 * And a non-cumulative (emergency) code never catches up by itself: it doesn't
 * remember the allowance from months you didn't work. The classic case is a
 * new job mid-year after time off, with no P45 and the wrong box ticked on the
 * starter checklist: every month taxed on one month's allowance, when the law
 * gives the allowance for the whole year so far.
 *
 * So the read's job is to decode the code, build the code these inputs would
 * give, run both through the year payslip by payslip, and say what the
 * difference costs by 5 April, how much of it is already gone, and what
 * brings it back.
 *
 * Figures are for 2026/27 (6 April 2026 to 5 April 2027). What agreed across
 * the sources I could reach (gov.uk, LITRG and legislation.gov.uk don't
 * resolve from the sandbox, so this is from payroll guides, accountancy
 * bodies' summaries and search snippets of LITRG and the HMRC manuals):
 *
 *   - Personal Allowance £12,570, frozen; reduced by £1 for every £2 of income
 *     over £100,000. Emergency code 1257L W1/M1/X.
 *   - England, Wales and Northern Ireland: 20% on the first £37,700 of taxable
 *     pay, 40% to £125,140, 45% above. Wales (C prefix) has the same rates.
 *   - Scotland (S prefix), 2026/27: starter 19% to £16,537 gross, basic 20% to
 *     £29,526, intermediate 21% to £43,662, higher 42% to £75,000, advanced
 *     45% to £125,140, top 48%. As bands of taxable pay above the allowance:
 *     3,967; 12,989; 14,136; 31,338; to 125,140; then above.
 *   - Marriage Allowance: £1,260 moves from one partner's allowance (N) to
 *     the other's (M).
 *   - K codes: negative allowance, added to pay. Tax taken under a K code
 *     can't be more than half the pay in the period (the overriding limit).
 *   - Owed tax from an earlier year is "coded out" only under £3,000; HMRC
 *     turns the tax into a cut in allowance at your marginal rate.
 *   - Starter checklist: statement A (first job since 6 April, no benefits or
 *     pension) gives 1257L cumulative; B (only job now, but another job or
 *     benefits since 6 April) gives 1257L W1/M1; C (another job or pension)
 *     gives BR. No checklist at all gives 0T.
 *   - Refunds: in-year through payroll when the code is corrected; after the
 *     year a P800, which you claim online (HMRC app, Personal Tax Account) or
 *     by cheque. Four years from the end of the tax year: 2022/23 overpayments
 *     must be claimed by 5 April 2027.
 *   - State Pension 2026/27: full new State Pension £241.30 a week
 *     (£12,547.60 a year). It's taxable but paid gross, so HMRC collects its
 *     tax through the code on a job or private pension.
 *
 * Not tax advice. Pure data and functions, no React, so the read can be
 * checked by a script. The arithmetic follows the PAYE tables' logic
 * (cumulative free pay, band limits pro rata) without their exact rounding,
 * so a payslip can differ by a pound or two.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

/** Whole pounds for big sums, pence for small ones. */
export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r) >= 100 || Number.isInteger(r)) return `£${Math.round(r).toLocaleString("en-GB")}`;
  return `£${r.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const PERSONAL_ALLOWANCE = 12570;
export const TAPER_FROM = 100000;
export const MARRIAGE_ALLOWANCE = 1260;
export const EMERGENCY_CODE = "1257L";
export const RATES_YEAR = 2026;
export const FULL_STATE_PENSION = 12547.6;
export const CODING_OUT_LIMIT = 3000;

export type Nation = "" | "eng" | "wal" | "sco";
export type Source = "" | "main" | "second" | "pension";
export type Start = "" | "before" | "during";
export type Earlier = "" | "none" | "p45" | "nop45";
export type Freq = "" | "week" | "fortnight" | "4week" | "month";
export type Marriage = "" | "none" | "receive" | "give";

export type TaxCodeInputs = {
  /** Who pays you, for the letters. Optional. */
  employer: string;
  /** The code exactly as the payslip shows it. */
  code: string;
  nation: Nation;
  source: Source;
  /** Second job only: yearly pay from the main job. */
  mainPay: string;
  start: Start;
  /** If started this tax year: the first day. */
  startDate: string;
  /** If started this tax year: any taxed pay earlier in the tax year? */
  earlier: Earlier;
  /** Taxable pay and tax from the earlier job (P45). Optional. */
  prevPay: string;
  prevTax: string;
  freq: Freq;
  /** Taxable pay per period, before tax. */
  pay: string;
  /** Tax on the latest payslip. Optional. */
  taxPaid: string;
  /** The latest pay date. */
  payDate: string;
  marriage: Marriage;
  /** Taxable benefits a year (company car, medical insurance). Optional. */
  benefits: string;
  /** State Pension a year. Optional. */
  statePension: string;
  /** Other untaxed income HMRC has put in your code, a year. Optional. */
  otherIncome: string;
  /** Job expenses HMRC allows (uniform, fees), a year. Optional. */
  expenses: string;
  /** Tax owed from an earlier year that HMRC is collecting through this code. Optional. */
  owed: string;
};

export const BLANK_TAXCODE: TaxCodeInputs = {
  employer: "",
  code: "",
  nation: "",
  source: "",
  mainPay: "",
  start: "",
  startDate: "",
  earlier: "",
  prevPay: "",
  prevTax: "",
  freq: "",
  pay: "",
  taxPaid: "",
  payDate: "",
  marriage: "",
  benefits: "",
  statePension: "",
  otherIncome: "",
  expenses: "",
  owed: "",
};

// ---------------------------------------------------------------- the code

export type Basis = "cumulative" | "noncumulative";

export type ParsedCode = {
  raw: string;
  /** Normalised, e.g. "S1257L M1". */
  text: string;
  prefix: "" | "S" | "C";
  kind: "allowance" | "k" | "flat" | "nt";
  /** The number in the code (allowance and K codes). */
  number: number;
  letter: "" | "L" | "M" | "N" | "T";
  /** For flat codes: BR, D0, D1, D2, D3. */
  flat: "" | "BR" | "D0" | "D1" | "D2" | "D3";
  basis: Basis;
  suffix: "" | "W1" | "M1" | "X";
};

export function parseCode(raw: string): ParsedCode | null {
  const s = raw.toUpperCase().replace(/[\s/._-]+/g, "");
  if (!s) return null;
  const m = s.match(/^([SC])?(?:(BR|D[0-3]|NT|0T)|(K)?(\d{1,5})([LMNT])?)(W1|M1|X)?$/);
  if (!m) return null;
  const prefix = (m[1] ?? "") as ParsedCode["prefix"];
  const special = m[2] ?? "";
  const suffix = (m[6] ?? "") as ParsedCode["suffix"];
  const basis: Basis = suffix ? "noncumulative" : "cumulative";
  const sfx = suffix ? ` ${suffix}` : "";
  if (special === "NT") {
    return { raw, text: `${prefix}NT${sfx}`, prefix, kind: "nt", number: 0, letter: "", flat: "", basis, suffix };
  }
  if (special === "0T") {
    return { raw, text: `${prefix}0T${sfx}`, prefix, kind: "allowance", number: 0, letter: "T", flat: "", basis, suffix };
  }
  if (special) {
    const flat = special as ParsedCode["flat"];
    // D2 and D3 exist only in Scotland.
    if ((flat === "D2" || flat === "D3") && prefix !== "S") return null;
    return { raw, text: `${prefix}${flat}${sfx}`, prefix, kind: "flat", number: 0, letter: "", flat, basis, suffix };
  }
  const k = m[3] === "K";
  const number = Number(m[4]);
  const letter = (m[5] ?? "") as ParsedCode["letter"];
  if (k && letter) return null;
  if (!k && !letter) return null;
  return {
    raw,
    text: `${prefix}${k ? "K" : ""}${number}${letter}${sfx}`,
    prefix,
    kind: k ? "k" : "allowance",
    number,
    letter,
    flat: "",
    basis,
    suffix,
  };
}

export function codeInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseCode(raw) === null;
}

/** The year's tax-free pay the code gives (negative for K codes). */
export function codeAllowance(c: ParsedCode): number {
  if (c.kind === "allowance") return c.number === 0 ? 0 : c.number * 10 + 9;
  if (c.kind === "k") return -(c.number * 10 + 9);
  return 0;
}

// ---------------------------------------------------------------- the bands

type Band = { upTo: number; rate: number; name: string };

const RUK_BANDS: Band[] = [
  { upTo: 37700, rate: 0.2, name: "basic" },
  { upTo: 125140, rate: 0.4, name: "higher" },
  { upTo: Infinity, rate: 0.45, name: "additional" },
];

const SCO_BANDS: Band[] = [
  { upTo: 3967, rate: 0.19, name: "starter" },
  { upTo: 16956, rate: 0.2, name: "basic" },
  { upTo: 31092, rate: 0.21, name: "intermediate" },
  { upTo: 62430, rate: 0.42, name: "higher" },
  { upTo: 125140, rate: 0.45, name: "advanced" },
  { upTo: Infinity, rate: 0.48, name: "top" },
];

function bandsFor(scottish: boolean): Band[] {
  return scottish ? SCO_BANDS : RUK_BANDS;
}

/** Tax on taxable pay, with band limits scaled to the share of the year. */
function bandTax(taxable: number, bands: Band[], frac: number): number {
  let tax = 0;
  let lower = 0;
  for (const b of bands) {
    const top = b.upTo === Infinity ? Infinity : b.upTo * frac;
    if (taxable <= lower) break;
    tax += (Math.min(taxable, top) - lower) * b.rate;
    lower = top;
  }
  return tax;
}

function flatRate(c: ParsedCode): number {
  const sco = c.prefix === "S";
  if (c.flat === "BR") return 0.2;
  if (c.flat === "D0") return sco ? 0.21 : 0.4;
  if (c.flat === "D1") return sco ? 0.42 : 0.45;
  if (c.flat === "D2") return 0.45;
  if (c.flat === "D3") return 0.48;
  return 0;
}

/** Tax due on `payToDate` at a point `frac` of the way through the year. */
function taxDue(c: ParsedCode, payToDate: number, frac: number): number {
  if (c.kind === "nt") return 0;
  if (c.kind === "flat") return payToDate * flatRate(c);
  const taxable = Math.max(0, Math.floor(payToDate - codeAllowance(c) * frac));
  return bandTax(taxable, bandsFor(c.prefix === "S"), frac);
}

/** The marginal rate on a year's taxable income. */
function marginalRate(taxable: number, scottish: boolean): number {
  for (const b of bandsFor(scottish)) if (taxable <= b.upTo) return b.rate;
  return scottish ? 0.48 : 0.45;
}

// ---------------------------------------------------------------- periods

export function periodsPerYear(f: Freq): number {
  if (f === "week") return 52;
  if (f === "fortnight") return 26;
  if (f === "4week") return 13;
  return 12;
}

/** The tax year (by its first calendar year) a date falls in. */
export function taxYearOf(iso: string): number {
  const y = Number(iso.slice(0, 4));
  return iso >= `${y}-04-06` ? y : y - 1;
}

/** The PAYE period number a date falls in. Month 1 is 6 April to 5 May. */
export function periodOf(iso: string, f: Freq): number {
  const ty = taxYearOf(iso);
  const P = periodsPerYear(f);
  if (f === "month" || f === "") {
    const y = Number(iso.slice(0, 4));
    const mo = Number(iso.slice(5, 7));
    const d = Number(iso.slice(8, 10));
    const n = (y - ty) * 12 + (mo - 4) + (d >= 6 ? 1 : 0);
    return Math.min(P, Math.max(1, n));
  }
  const a = new Date(`${ty}-04-06T00:00:00`).getTime();
  const b = new Date(`${iso}T00:00:00`).getTime();
  const days = Math.round((b - a) / 86400000);
  const len = f === "week" ? 7 : f === "fortnight" ? 14 : 28;
  return Math.min(P, Math.max(1, Math.floor(days / len) + 1));
}

function periodWord(f: Freq, plural = false): string {
  const w = f === "week" ? "week" : f === "fortnight" ? "fortnight" : f === "4week" ? "four weeks" : "month";
  if (!plural || f === "4week") return w;
  return `${w}s`;
}

/**
 * The first payday in this job: step back from the latest pay date one period
 * at a time while it stays on or after the start date. Someone who started on
 * 1 October and is paid on the 30th was first paid on 30 October, in month 7,
 * not month 6, where 1 October itself falls.
 */
export function firstPayday(startISO: string, payISO: string, f: Freq): string {
  let d = payISO;
  for (let i = 1; i < 60; i++) {
    const prev = f === "month" || f === "" ? addMonthsISO(payISO, -i) : addDaysISO(payISO, -periodDays(f) * i);
    if (prev < startISO) break;
    d = prev;
  }
  return d;
}

function periodDays(f: Freq): number {
  return f === "week" ? 7 : f === "fortnight" ? 14 : f === "4week" ? 28 : 30;
}

// ---------------------------------------------------------------- the read

export type AllowanceLine = { label: string; amount: number };

export type Scenario = {
  /** Tax deducted in each period from the start period to the year's end. */
  perPeriod: number[];
  soFar: number;
  year: number;
};

export type Flag = { id: string; title: string; body: string };

export type DateLine = { on: string; title: string; body: string };

export type TaxCodeRead = {
  code: ParsedCode;
  expected: ParsedCode;
  expectedText: string;
  expectedAllowance: number;
  lines: AllowanceLine[];
  P: number;
  s: number;
  n: number;
  payPer: number;
  /** Income this tax year, all sources, for the taper and the rate. */
  yearIncome: number;
  scottish: boolean;
  asIs: Scenario;
  right: Scenario;
  /** asIs − right: positive means the code takes too much. */
  diffSoFar: number;
  diffYear: number;
  thisPeriodAsIs: number;
  thisPeriodRight: number;
  taxPaid: number | null;
  /** taxPaid − what the code should take this period. */
  payslipGap: number | null;
  flags: Flag[];
  doubts: string[];
  ty: number;
  yearEnd: string;
  nextPay: string;
  verdict: "over" | "under" | "right" | "check";
};

function num(raw: string): number {
  return parseMoney(raw) ?? 0;
}

export function taxCodeReady(inp: TaxCodeInputs): boolean {
  if (!parseCode(inp.code)) return false;
  if (!inp.nation || !inp.source || !inp.freq) return false;
  if (parseMoney(inp.pay) === null) return false;
  if (!isISODate(inp.payDate)) return false;
  if (inp.start === "") return false;
  if (inp.start === "during") {
    if (!isISODate(inp.startDate) || inp.startDate > inp.payDate) return false;
    if (taxYearOf(inp.startDate) !== taxYearOf(inp.payDate)) return false;
    if (!inp.earlier) return false;
  }
  return true;
}

function simulate(
  c: ParsedCode,
  basis: Basis,
  s: number,
  n: number,
  P: number,
  pay: number,
  prevPay: number,
  prevTax: number
): Scenario {
  const perPeriod: number[] = [];
  let payToDate = prevPay;
  let taxToDate = prevTax;
  for (let k = s; k <= P; k++) {
    payToDate += pay;
    let t: number;
    if (c.kind === "nt") t = 0;
    else if (c.kind === "flat") t = pay * flatRate(c);
    else if (basis === "cumulative") t = taxDue(c, payToDate, k / P) - taxToDate;
    else t = taxDue(c, pay, 1 / P);
    // The overriding limit: a K code can't take more than half the pay.
    if (c.kind === "k") t = Math.min(t, pay * 0.5);
    t = Math.round(t * 100) / 100;
    taxToDate += t;
    perPeriod.push(t);
  }
  const sum = (a: number[]) => Math.round(a.reduce((x, y) => x + y, 0) * 100) / 100;
  return { perPeriod, soFar: sum(perPeriod.slice(0, n - s + 1)), year: sum(perPeriod) };
}

function codeText(prefix: string, allowance: number, letter: string): string {
  if (allowance >= 10) return `${prefix}${Math.floor(allowance / 10)}${letter}`;
  if (allowance > -10) return `${prefix}0T`;
  return `${prefix}K${Math.floor(-allowance / 10)}`;
}

export function readTaxCode(inp: TaxCodeInputs, today = todayISO()): TaxCodeRead | null {
  if (!taxCodeReady(inp)) return null;
  void today;
  const code = parseCode(inp.code) as ParsedCode;
  const doubts: string[] = [];
  const flags: Flag[] = [];
  const scottish = inp.nation === "sco";
  const prefix = scottish ? "S" : inp.nation === "wal" ? "C" : "";
  const P = periodsPerYear(inp.freq);
  const ty = taxYearOf(inp.payDate);
  const yearEnd = `${ty + 1}-04-05`;
  const s = inp.start === "during" ? periodOf(firstPayday(inp.startDate, inp.payDate, inp.freq), inp.freq) : 1;
  const n = Math.max(s, periodOf(inp.payDate, inp.freq));
  const payPer = parseMoney(inp.pay) ?? 0;
  const hadEarlier = inp.start === "during" && (inp.earlier === "p45" || inp.earlier === "nop45");
  const prevPay = hadEarlier ? num(inp.prevPay) : 0;
  const prevTax = hadEarlier ? num(inp.prevTax) : 0;

  const thisSourceYear = payPer * (P - s + 1);
  const mainPay = inp.source === "second" ? num(inp.mainPay) : 0;
  const benefits = num(inp.benefits);
  const statePension = num(inp.statePension);
  const otherIncome = num(inp.otherIncome);
  const expenses = num(inp.expenses);
  const owed = num(inp.owed);
  const yearIncome = thisSourceYear + prevPay + mainPay + benefits + statePension + otherIncome;

  // The allowance these inputs give.
  const lines: AllowanceLine[] = [{ label: "Personal Allowance", amount: PERSONAL_ALLOWANCE }];
  const taper = Math.min(PERSONAL_ALLOWANCE, Math.max(0, Math.floor((yearIncome - TAPER_FROM) / 2)));
  if (taper > 0) lines.push({ label: "Allowance lost on income over £100,000", amount: -taper });
  if (inp.marriage === "receive") lines.push({ label: "Marriage Allowance from your partner", amount: MARRIAGE_ALLOWANCE });
  if (inp.marriage === "give") lines.push({ label: "Marriage Allowance given to your partner", amount: -MARRIAGE_ALLOWANCE });
  if (expenses > 0) lines.push({ label: "Job expenses", amount: Math.round(expenses) });
  if (benefits > 0) lines.push({ label: "Taxable benefits", amount: -Math.round(benefits) });
  if (statePension > 0) lines.push({ label: "State Pension (paid without tax taken)", amount: -Math.round(statePension) });
  if (otherIncome > 0) lines.push({ label: "Other untaxed income", amount: -Math.round(otherIncome) });
  const fullAllowance = lines.reduce((t, l) => t + l.amount, 0);
  if (owed > 0) {
    const taxableGuess = Math.max(0, yearIncome - Math.max(0, fullAllowance));
    const rate = marginalRate(taxableGuess, scottish);
    lines.push({
      label: `Tax owed from an earlier year (${money(owed)} at ${Math.round(rate * 100)}%)`,
      amount: -Math.round(owed / rate),
    });
  }
  const expectedAllowance = lines.reduce((t, l) => t + l.amount, 0);
  const letter = inp.marriage === "receive" ? "M" : inp.marriage === "give" ? "N" : "L";

  let expectedText: string;
  if (inp.source === "second") {
    if (mainPay >= expectedAllowance) {
      // The allowance is used up by the main job: this one is taxed at the
      // rate the main job's pay has reached.
      const mainTaxable = Math.max(0, mainPay - Math.max(0, expectedAllowance));
      const r = marginalRate(mainTaxable, scottish);
      const flat = scottish
        ? r <= 0.2
          ? "BR"
          : r === 0.21
            ? "D0"
            : r === 0.42
              ? "D1"
              : r === 0.45
                ? "D2"
                : "D3"
        : r === 0.2
          ? "BR"
          : r === 0.4
            ? "D0"
            : "D1";
      expectedText = `${prefix}${flat}`;
    } else {
      expectedText = codeText(prefix, expectedAllowance - mainPay, letter);
    }
  } else {
    expectedText = codeText(prefix, expectedAllowance, letter);
  }
  const expected = parseCode(expectedText) as ParsedCode;

  // Run both through the year.
  const asIsUsesPrev = inp.earlier === "p45" && code.basis === "cumulative";
  const asIs = simulate(code, code.basis, s, n, P, payPer, asIsUsesPrev ? prevPay : 0, asIsUsesPrev ? prevTax : 0);
  const right = simulate(expected, "cumulative", s, n, P, payPer, hadEarlier ? prevPay : 0, hadEarlier ? prevTax : 0);
  const diffSoFar = Math.round(asIs.soFar - right.soFar);
  const diffYear = Math.round(asIs.year - right.year);
  const thisPeriodAsIs = asIs.perPeriod[n - s] ?? 0;
  const thisPeriodRight = right.perPeriod[n - s] ?? 0;
  const taxPaid = parseMoney(inp.taxPaid);
  const payslipGap = taxPaid !== null ? Math.round((taxPaid - thisPeriodAsIs) * 100) / 100 : null;

  // What's wrong with the code, piece by piece.
  if (code.prefix !== prefix) {
    const want = prefix === "S" ? "an S (Scottish rates)" : prefix === "C" ? "a C (Welsh rates)" : "no letter in front";
    const have = code.prefix === "S" ? "an S" : code.prefix === "C" ? "a C" : "no letter in front";
    flags.push({
      id: "prefix",
      title: "The letter in front doesn't match where you live",
      body: `You said you live in ${inp.nation === "sco" ? "Scotland" : inp.nation === "wal" ? "Wales" : "England or Northern Ireland"}, which should give ${want}; the code has ${have}. ${
        prefix === "S" || code.prefix === "S"
          ? "Scotland's bands are different, so this changes the tax on anything over about £16,500. It goes by where your main home is, and HMRC takes it from the address it holds, so update your address in the HMRC app or Personal Tax Account."
          : "Wales has the same rates as England, so this one doesn't change the tax, but your address with HMRC is worth updating."
      }`,
    });
  }
  if (code.basis === "noncumulative" && code.kind !== "flat" && code.kind !== "nt") {
    flags.push({
      id: "emergency",
      title: `${code.suffix} on the end: each payslip is taxed on its own`,
      body: `${code.suffix === "W1" ? "A" : "An"} ${code.suffix} code gives one ${periodWord(inp.freq)}'s share of the allowance each payday and forgets the rest. ${
        inp.start === "during" && s > 1
          ? `You started in period ${s} of ${P}, so the ${s - 1} ${periodWord(inp.freq, s - 1 !== 1)} of allowance from before you started are never used under this code. A cumulative code would give them back in your first payslips.`
          : "If your pay goes up and down, or the code was wrong earlier in the year, it never catches up."
      } It's meant to be temporary, until HMRC has your details. ${
        inp.earlier === "nop45" ? "Giving payroll your P45 usually fixes it." : "Telling HMRC (or payroll, via the starter checklist) usually fixes it."
      }`,
    });
  }
  if (inp.source !== "second" && (code.kind === "flat" || (code.kind === "allowance" && code.number === 0)) && expectedAllowance > 0) {
    flags.push({
      id: "noallowance",
      title: `${code.text} on your main income: no tax-free pay at all`,
      body: `${code.flat === "BR" ? "BR taxes every pound at 20%" : code.kind === "flat" ? `${code.flat} taxes every pound at a higher rate` : "0T gives no tax-free pay"}. It's the code for a second job, or what payroll uses when it has no starter checklist. ${
        inp.start === "during" && inp.earlier === "none"
          ? "If this is your first job since 6 April, the starter checklist's statement A gives the full allowance."
          : "If this is your only or main job, tell HMRC so the allowance moves here."
      }`,
    });
  }
  if (inp.source === "second" && code.kind === "allowance" && code.number > 0 && mainPay >= expectedAllowance) {
    flags.push({
      id: "double",
      title: "A second job with its own allowance",
      body: "Your main job pays more than the allowance, so it should be using all of it. If this job has an allowance too, you're getting it twice and the tax is being under-taken: a bill later, usually collected through next year's code.",
    });
  }
  if (inp.earlier === "nop45" && code.basis === "cumulative" && code.kind === "allowance" && code.number > 0) {
    flags.push({
      id: "nop45cum",
      title: "A full allowance here, with earlier pay this year it doesn't know about",
      body: "You had taxed pay earlier this tax year and this employer doesn't have your P45, but it's giving you the allowance from 6 April again. The earlier job used some of that, so this may be taking too little. Give payroll the P45, or tell HMRC about the earlier job.",
    });
  }
  if (code.kind === "k") {
    flags.push({
      id: "k",
      title: "A K code: more is being added to your pay than taken off",
      body: "K means the things HMRC is collecting through this code (benefits, State Pension, tax owed) are bigger than your allowance. It isn't a penalty, but each item in it is worth checking against the letter HMRC sent. Tax under a K code can't be more than half your pay in any period.",
    });
  }
  if (code.letter === "T") {
    doubts.push(
      "A T in the code means HMRC needs to review something, or there are items it hasn't explained in the letter. Ask it what's in the code: the HMRC app and your Personal Tax Account list each item."
    );
  }
  if (code.kind === "allowance" && code.letter && code.letter !== "T" && code.letter !== letter && !flags.some((f) => f.id === "noallowance")) {
    flags.push({
      id: "letter",
      title: `The letter ${code.letter} doesn't match your Marriage Allowance`,
      body:
        code.letter === "M"
          ? "M means you're receiving £1,260 of your partner's allowance. If you aren't, the code is too generous."
          : code.letter === "N"
            ? "N means you've given £1,260 of your allowance to your partner. If you haven't, or you've cancelled it, the code is £1,260 too small, about £252 a year at 20%."
            : "L is the standard allowance. If you've applied for Marriage Allowance, the code should show M (receiving) or N (giving).",
    });
  }

  const codeAllow = codeAllowance(code);
  if (
    inp.source !== "second" &&
    code.kind !== "flat" &&
    code.kind !== "nt" &&
    !(code.kind === "allowance" && code.number === 0) &&
    Math.abs(codeAllow - expectedAllowance) >= 100 &&
    // A wrong Marriage Allowance letter already explains a £1,260 gap.
    !(flags.some((f) => f.id === "letter") && Math.abs(Math.abs(codeAllow - expectedAllowance) - MARRIAGE_ALLOWANCE) < 30)
  ) {
    const gap = codeAllow - expectedAllowance;
    flags.push({
      id: "number",
      title: gap > 0 ? `The code gives ${money(gap)} more tax-free pay than these inputs` : `The code gives ${money(-gap)} less tax-free pay than these inputs`,
      body:
        gap > 0
          ? "Something you didn't enter may be missing: a benefit, untaxed income or tax owed. Or HMRC has an item wrong in your favour, which comes back as a bill. Check the list in the HMRC app."
          : "HMRC may be collecting something you didn't enter, or something it estimated: a benefit you no longer get, income you no longer have, tax owed that's been paid, or expenses it hasn't added. Each item is in the HMRC app, and you can change most of them there.",
    });
  }

  if (taxPaid !== null && payslipGap !== null && Math.abs(payslipGap) > Math.max(2, Math.abs(thisPeriodAsIs) * 0.03)) {
    flags.push({
      id: "payslip",
      title: payslipGap > 0 ? "The payslip took more than the code says" : "The payslip took less than the code says",
      body: `This code, run ${code.basis === "cumulative" ? "cumulatively" : "on its own"}, should take about ${money(Math.max(0, thisPeriodAsIs))} this ${periodWord(inp.freq)}${
        thisPeriodAsIs < 0 ? ` (in fact a refund of ${money(-thisPeriodAsIs)})` : ""
      }; the payslip shows ${money(taxPaid)}. ${
        inp.start === "during" || hadEarlier
          ? "If the pay or the start date you entered isn't exact, that explains some of it. Otherwise payroll may be running the code differently (non-cumulatively, or with the wrong pay to date)."
          : "If your pay this year hasn't been the same every period, that explains some of it, because a cumulative code looks at all of it. Otherwise ask payroll how they got the figure."
      }`,
    });
  }

  // Doubts.
  if (ty !== RATES_YEAR) {
    doubts.push(
      `The rates here are for 2026/27. Your pay date is in ${ty}/${String((ty + 1) % 100).padStart(2, "0")}, so the bands may differ a little (the Personal Allowance itself is frozen at £12,570 until 2031).`
    );
  }
  if (inp.earlier === "nop45" && !inp.prevPay.trim()) {
    doubts.push(
      "You had pay earlier this tax year but didn't enter it, so the read treats it as nothing. If it was more than a few hundred pounds, the 'right' figure here is too low: enter the pay and tax from that job's last payslip."
    );
  }
  if (inp.source === "second" && mainPay < expectedAllowance && mainPay > 0) {
    doubts.push(
      `Your main job pays less than your allowance, so about ${money(expectedAllowance - mainPay)} of it is going unused there. HMRC can split the allowance between the jobs; ask it to, and the main job's code goes down by the same amount.`
    );
  }
  if (inp.source === "second" && !inp.mainPay.trim()) {
    doubts.push("Without the main job's pay, the read assumes it uses your whole allowance, so this job should be on BR (or SBR).");
  }
  if (taper > 0) {
    doubts.push(
      "Income over £100,000 shrinks the allowance, and HMRC builds that into the code from its estimate of your income. If a bonus pushes you over, the code won't know until you tell HMRC, and pension contributions or Gift Aid can bring the income back under."
    );
  }
  if (inp.source === "pension") {
    doubts.push(
      "If this was the first time you took money from a pension pot (beyond the tax-free quarter), the provider usually taxes it on an emergency code as if you'd take the same every month. You can wait for it to correct, or claim it back now: form P55 if you haven't emptied the pot, P53Z if you have and you're still working, P50Z if you have and you aren't."
    );
  }
  if (owed >= CODING_OUT_LIMIT) {
    doubts.push(
      `HMRC only collects owed tax through a code when it's under ${money(CODING_OUT_LIMIT)}. If you owe more, it should be a separate bill (Simple Assessment or a tax return), not a code reduction.`
    );
  }
  if (statePension > 0 && statePension < FULL_STATE_PENSION * 0.5 && inp.source === "pension") {
    doubts.push("Check the State Pension figure against your annual letter from the DWP: HMRC uses the yearly amount, including any additional State Pension.");
  }

  const nextPay = inp.freq === "month" ? addMonthsISO(inp.payDate, 1) : addDaysISO(inp.payDate, periodDays(inp.freq));
  const over = diffYear >= 20;
  const under = diffYear <= -20;
  const verdict: TaxCodeRead["verdict"] = over ? "over" : under ? "under" : flags.length ? "check" : "right";

  return {
    code,
    expected,
    expectedText,
    expectedAllowance,
    lines,
    P,
    s,
    n,
    payPer,
    yearIncome,
    scottish,
    asIs,
    right,
    diffSoFar,
    diffYear,
    thisPeriodAsIs,
    thisPeriodRight,
    taxPaid,
    payslipGap,
    flags,
    doubts,
    ty,
    yearEnd,
    nextPay,
    verdict,
  };
}

// ---------------------------------------------------------------- the words

/** The code, read aloud, part by part. */
export function decodeParts(c: ParsedCode): { part: string; means: string }[] {
  const out: { part: string; means: string }[] = [];
  if (c.prefix === "S") out.push({ part: "S", means: "Scottish rates: 19% to 48%, six bands." });
  if (c.prefix === "C") out.push({ part: "C", means: "Welsh rates, which are the same as England's." });
  if (c.kind === "nt") out.push({ part: "NT", means: "No tax is taken from this income at all." });
  if (c.kind === "flat") {
    const r = Math.round(flatRate(c) * 100);
    out.push({
      part: c.flat,
      means:
        c.flat === "BR"
          ? `Every pound taxed at ${r}%, with no tax-free pay. Normal for a second job or pension; wrong for your only one.`
          : `Every pound taxed at ${r}%, with no tax-free pay. Used for a second job when your main income already reaches that rate.`,
    });
  }
  if (c.kind === "allowance" && c.number === 0) {
    out.push({ part: "0T", means: "No tax-free pay; the normal bands apply to every pound. Used when HMRC or payroll has no details for you." });
  } else if (c.kind === "allowance") {
    out.push({
      part: String(c.number),
      means: `${money(c.number * 10 + 9)} of tax-free pay over the year (the number × 10, plus 9), spread evenly across your paydays.`,
    });
    const L: Record<string, string> = {
      L: "The standard Personal Allowance.",
      M: "You're receiving Marriage Allowance: £1,260 of your partner's allowance.",
      N: "You've given £1,260 of your allowance to your partner (Marriage Allowance).",
      T: "Items HMRC needs to review, or hasn't set out in your letter.",
    };
    if (c.letter) out.push({ part: c.letter, means: L[c.letter] });
  }
  if (c.kind === "k") {
    out.push({ part: "K", means: "Negative allowance: what HMRC is collecting through this code is more than your tax-free pay." });
    out.push({
      part: String(c.number),
      means: `${money(c.number * 10 + 9)} is added to your taxable pay over the year, spread across your paydays. Tax can't be more than half your pay in any period.`,
    });
  }
  if (c.suffix) {
    out.push({
      part: c.suffix,
      means: `Non-cumulative ("emergency" basis): each payslip is taxed as if it were the first of the year, with one ${c.suffix === "W1" ? "week's" : c.suffix === "M1" ? "month's" : "period's"} share of the allowance. Mistakes and gaps never catch up.`,
    });
  } else if (c.kind === "allowance" || c.kind === "k") {
    out.push({
      part: "(nothing after)",
      means: "Cumulative: each payslip works out the tax on all your pay since 6 April, so a corrected code gives back what was over-taken.",
    });
  }
  return out;
}

export function taxCodeHeadline(inp: TaxCodeInputs, read: TaxCodeRead): string {
  if (read.verdict === "over") return `Your code is set to take about ${money(read.diffYear)} too much tax by 5 April.`;
  if (read.verdict === "under") return `Your code is set to take about ${money(-read.diffYear)} too little tax by 5 April: a bill later.`;
  if (read.verdict === "check") return `Your code works out about right in pounds, but ${read.flags.length === 1 ? "one thing" : `${read.flags.length} things`} in it ${read.flags.length === 1 ? "is" : "are"} worth checking.`;
  void inp;
  return `Your code looks right: ${read.code.text} is what these details give.`;
}

export function taxCodeBody(inp: TaxCodeInputs, read: TaxCodeRead): string {
  const paras: string[] = [];
  const same = read.code.text.replace(/\s.*$/, "") === read.expectedText && read.code.basis === "cumulative";
  if (!same) {
    paras.push(
      `Your payslip shows ${read.code.text}. These details give ${read.expectedText}${read.expected.kind === "flat" ? "" : ", run cumulatively"}.`
    );
  }
  if (read.verdict === "over") {
    paras.push(
      read.diffSoFar >= 1
        ? `About ${money(read.diffSoFar)} of it has already gone, in the payslips up to this one. A code is a running total: if it's corrected before 5 April, the next payslip works out the tax on everything since April with the right allowance, and that ${money(read.diffSoFar)} comes back in it. Nothing to claim.`
        : `Little has gone yet, so fixing it now stops the rest. The difference builds over the remaining ${read.P - read.n} ${periodWord(inp.freq, read.P - read.n !== 1)}.`
    );
    paras.push(
      `If it isn't fixed by 5 April ${read.ty + 1}, the year closes with the overpayment in it. HMRC works it out afterwards on a P800, usually from June, and since 2024 most of those have to be claimed, not just paid. That's still your money, but it's months later and only if you act.`
    );
  } else if (read.verdict === "under") {
    paras.push(
      `That's tax you'll owe either way. Fixed now, it's spread over the paydays left this year. Left alone, HMRC finds it after April and usually collects it by cutting next year's code (if it's under ${money(CODING_OUT_LIMIT)}), or sends a bill.`
    );
  } else if (read.verdict === "right" && !same) {
    paras.push("In pounds it comes to the same, so there's nothing to chase.");
  }
  return paras.join("\n\n");
}

export function datesOf(inp: TaxCodeInputs, read: TaxCodeRead, today = todayISO()): DateLine[] {
  const list: DateLine[] = [];
  if (read.verdict !== "right" && read.nextPay <= read.yearEnd) {
    list.push({
      on: read.nextPay,
      title: "Next payday, roughly: the first a corrected code could reach",
      body: "HMRC sends a new code to payroll electronically, usually within a few days of a change, but it may miss a payday. Check the payslip after.",
    });
  }
  list.push({
    on: read.yearEnd,
    title: "The tax year ends",
    body:
      read.verdict === "over"
        ? "Until today a corrected code puts the overpayment back in your pay. After it, it's a P800 claim."
        : "The running total closes. Anything still wrong becomes a P800 calculation after the year.",
  });
  list.push({
    on: read.yearEnd,
    title: `Last day to claim back tax overpaid in ${read.ty - 4}/${String((read.ty - 3) % 100).padStart(2, "0")}`,
    body: "Overpaid tax can be claimed for four years after the year ends. If your code was wrong back then too, claim through the HMRC app or Personal Tax Account.",
  });
  void inp;
  void today;
  return list;
}

export type TaxCodeLetter = { id: string; title: string; note: string; text: string };

export function taxCodeLetters(inp: TaxCodeInputs, read: TaxCodeRead): TaxCodeLetter[] {
  const out: TaxCodeLetter[] = [];
  const who = inp.employer.trim() || "[employer or pension provider]";
  const reasons: string[] = [];
  for (const f of read.flags) {
    if (f.id === "prefix") reasons.push(`I live in ${inp.nation === "sco" ? "Scotland" : inp.nation === "wal" ? "Wales" : "England or Northern Ireland"}, so the code should ${read.scottish ? "start with S" : inp.nation === "wal" ? "start with C" : "not start with S"}.`);
    if (f.id === "emergency") reasons.push(`It's on ${read.code.suffix === "W1" ? "a" : "an"} ${read.code.suffix} (emergency) basis.${inp.start === "during" && inp.earlier === "none" ? " This is my first job since 6 April, so it should be cumulative." : ""}`);
    if (f.id === "noallowance") reasons.push("It gives no tax-free pay, but this is my main income.");
    if (f.id === "letter") reasons.push(inp.marriage === "receive" ? "I receive Marriage Allowance (it should end in M)." : inp.marriage === "give" ? "I've transferred Marriage Allowance to my partner (it should end in N)." : "I don't have Marriage Allowance.");
    if (f.id === "number") reasons.push(`The allowance in it doesn't match my circumstances; I make it ${money(read.expectedAllowance)}${read.lines.length > 1 ? `: ${read.lines.map((l) => `${l.label} ${l.amount < 0 ? "−" : ""}${money(Math.abs(l.amount))}`).join(", ")}` : ""}.`);
    if (f.id === "nop45cum") reasons.push("I had another job earlier this tax year and this employer doesn't have my P45.");
    if (f.id === "double") reasons.push("This is my second job and my main job uses my whole allowance.");
  }
  if (read.verdict !== "right" || read.flags.some((f) => f.id !== "payslip")) {
    out.push({
      id: "hmrc",
      title: "What to tell HMRC",
      note: "Quickest in the HMRC app or your Personal Tax Account (Check your Income Tax for the current year), where you can see each item in the code and change most of them. Or phone the Income Tax helpline and read this out. Have your National Insurance number and a payslip to hand.",
      text: [
        `I'm calling about my tax code with ${who} for ${read.ty}/${String((read.ty + 1) % 100).padStart(2, "0")}.`,
        "",
        `My payslip shows ${read.code.text}. I think it should be ${read.expectedText}${read.expected.kind === "flat" ? "" : " on a cumulative basis"}, because:`,
        ...(reasons.length ? reasons.map((r) => `- ${r}`) : ["- [what's changed: a job, a benefit, Marriage Allowance, expenses]"]),
        "",
        "Please update the code and send it to my employer, and tell me what's in it. If tax has been over-taken, I'd like it refunded through payroll this tax year.",
      ].join("\n"),
    });
  }
  const payroll: string[] = [];
  if (inp.start === "during" && inp.earlier === "p45") {
    // nothing extra
  }
  if (inp.start === "during" && inp.earlier === "nop45") {
    payroll.push("I've attached the P45 from my previous job this tax year. Please use it so my tax is worked out on my pay for the whole year.");
  }
  if (inp.start === "during" && inp.earlier === "none" && (read.code.basis === "noncumulative" || read.code.kind === "flat" || (read.code.kind === "allowance" && read.code.number === 0))) {
    payroll.push(
      "On the starter checklist, statement A applies to me: this is my first job since 6 April, and I haven't had taxable Jobseeker's Allowance, Employment and Support Allowance, taxable Incapacity Benefit, a State or occupational pension. Please correct my record and apply 1257L on a cumulative basis until HMRC sends a code."
    );
  }
  if (read.flags.some((f) => f.id === "payslip")) {
    payroll.push(
      `My latest payslip shows ${money(read.taxPaid ?? 0)} tax on ${money(read.payPer)} with code ${read.code.text}. By my working that code should take about ${money(Math.max(0, read.thisPeriodAsIs))}. Could you check how it's been calculated, and whether it's being run ${read.code.basis === "cumulative" ? "cumulatively with my pay to date" : "as a W1/M1 code"}?`
    );
  }
  if (payroll.length) {
    out.push({
      id: "payroll",
      title: "Message to payroll",
      note: "Payroll can't change a code HMRC has sent, but it can fix the starter checklist, use a P45 and check its own sums. Email, so there's a record.",
      text: ["Dear Payroll,", "", ...payroll.flatMap((p) => [p, ""]), "Thank you.", "", "[Your name]", "[Employee or payroll number]"].join("\n"),
    });
  }
  return out;
}

export function knowList(inp: TaxCodeInputs, read: TaxCodeRead): string[] {
  const list: string[] = [
    "Your tax code only affects income tax. National Insurance is worked out on each payslip separately and isn't touched by a code change.",
    "HMRC sends you a coding notice (a P2) when your code changes, and lists each item in the HMRC app. Read the items, not just the code: a benefit you no longer get or income you no longer have stays in it until you say.",
  ];
  if (inp.start === "during") {
    list.push(
      "Starting a job, the starter checklist decides your first code. Statement A (first job since 6 April, no taxable benefits or pension) gives 1257L cumulative. B (no other job now, but one since April or benefits) gives 1257L on a W1/M1 basis. C (another job or pension) gives BR. No checklist at all gives 0T."
    );
  }
  list.push(
    "If you stop working partway through the year and don't start again or claim benefits, you can claim back over-taken tax straight away on form P50, without waiting for April."
  );
  if (read.verdict === "under") {
    list.push(
      "If HMRC's mistake caused an underpayment (it had the information and didn't use it), it can sometimes write the tax off under Extra-Statutory Concession A19. It's worth asking if you told HMRC promptly and reasonably believed your tax was right."
    );
  }
  list.push(
    "Tax refund companies charge a share (often 20% to 40%) for claims you can make yourself in the HMRC app for nothing. Be wary of texts and emails about a 'tax refund': HMRC doesn't send refund links."
  );
  return list;
}

export function keepList(): string[] {
  return [
    "Your payslips for the year, or at least the latest (it shows pay and tax to date).",
    "Any P45 from a job you left this tax year.",
    "HMRC's coding notices (P2), or a screenshot of the items in the HMRC app.",
    "A note of when you called HMRC, who you spoke to and what they said they'd change.",
  ];
}

export function taxCodeRule(): string {
  return "My tax code is HMRC's guess about my year. I read it whenever it changes: the number times ten is my tax-free pay, and W1, M1 or X means each payslip stands alone. Fixed before 5 April, over-taken tax comes back in one payslip. After that, I have to claim it.";
}

export function taxCodeSummary(inp: TaxCodeInputs, read: TaxCodeRead): string {
  const lines: string[] = [
    "Tax code check",
    "",
    taxCodeHeadline(inp, read),
    "",
    taxCodeBody(inp, read),
    "",
    "The code, read aloud:",
    ...decodeParts(read.code).map((p) => `- ${p.part}: ${p.means}`),
    "",
    `The allowance these details give: ${money(read.expectedAllowance)}`,
    ...read.lines.map((l) => `- ${l.label}: ${l.amount < 0 ? "−" : ""}${money(Math.abs(l.amount))}`),
    "",
    `Tax this year on this income, as coded: ${money(read.asIs.year)}. With ${read.expectedText}: ${money(read.right.year)}.`,
  ];
  if (read.flags.length) {
    lines.push("", "Worth fixing:", ...read.flags.map((f) => `- ${f.title}. ${f.body}`));
  }
  const dates = datesOf(inp, read);
  lines.push("", "Dates:", ...dates.map((d) => `- ${letterDate(d.on)}: ${d.title}.`));
  lines.push("", taxCodeRule());
  return lines.join("\n");
}

const ENUMS: { [K in keyof TaxCodeInputs]?: readonly string[] } = {
  nation: ["", "eng", "wal", "sco"],
  source: ["", "main", "second", "pension"],
  start: ["", "before", "during"],
  earlier: ["", "none", "p45", "nop45"],
  freq: ["", "week", "fortnight", "4week", "month"],
  marriage: ["", "none", "receive", "give"],
};

export function parseTaxCodeInputs(raw: unknown): TaxCodeInputs {
  const out: TaxCodeInputs = { ...BLANK_TAXCODE };
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  for (const k of Object.keys(BLANK_TAXCODE) as (keyof TaxCodeInputs)[]) {
    const v = r[k];
    if (typeof v !== "string") continue;
    const allowed = ENUMS[k];
    if (allowed && !allowed.includes(v)) continue;
    (out as Record<string, string>)[k] = v.slice(0, 200);
  }
  return out;
}

/**
 * The worked example: a new job in October after six months off, no P45, the
 * wrong box ticked, and an emergency code on every payslip.
 */
export function taxCodeExample(): TaxCodeInputs {
  return {
    ...BLANK_TAXCODE,
    employer: "Harbour Logistics",
    code: "1257L M1",
    nation: "eng",
    source: "main",
    start: "during",
    startDate: "2026-10-01",
    earlier: "none",
    freq: "month",
    pay: "2400",
    taxPaid: "270.20",
    payDate: "2026-10-30",
    marriage: "none",
  };
}
