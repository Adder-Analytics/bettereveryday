/**
 * The read behind "Leaving a Job: Is Your Last Pay Right?" (/leaving).
 *
 * Every job ends, and the last payslip is the one nobody checks. It's built
 * by hand, outside the normal payroll run, and it's where the money that's
 * easy to get wrong turns up: holiday you've built up and not taken, notice
 * the employer cut short, and deductions (training costs, "overtaken"
 * holiday, notice you didn't work) taken out on the way out of the door.
 *
 * The most common error isn't a missing line. It's the day rate. A day's
 * holiday pay for a salaried worker is a day's pay, and a year has about 260
 * working days for someone on five days a week. Payroll often divides the
 * salary by 365 instead, which pays each day about 29% less. Unless the
 * contract sets its own formula, the working-days reading is the one the
 * courts have used (Leisure Leagues UK v Maconnachie, EAT 2002, on
 * holiday pay on leaving; Hartley v King Edward VI College, UKSC 2017, on a
 * day's salary). The read checks the payslip's day rate against both.
 *
 * Great Britain and Northern Ireland. What agreed across the sources I could
 * reach (gov.uk and legislation.gov.uk don't resolve from the sandbox):
 *
 *   - Holiday on leaving (Working Time Regulations 1998 reg 14): the
 *     proportion of the leave year worked × the year's entitlement, less what
 *     was taken, paid in lieu. At least 5.6 weeks a year, capped at 28 days.
 *     Leave carried over (sickness, family leave, or because the employer
 *     stopped you taking it) is paid too. There's no exception for gross
 *     misconduct.
 *   - Irregular-hours and part-year workers, for leave years starting on or
 *     after 1 April 2024: holiday builds up at 12.07% of hours worked. The
 *     employer may instead add 12.07% to each payslip ("rolled-up" holiday
 *     pay), and then nothing more is owed on leaving.
 *   - Taking back overtaken holiday needs a written agreement (reg 14(4)).
 *     Any other deduction from wages needs a written contract term, or your
 *     written agreement before it was made (Employment Rights Act 1996 s.13;
 *     NI Order 1996 art.45). Recovering an overpayment of wages is the main
 *     exception (s.14). Deductions for the employer's benefit (training,
 *     uniform, kit) can't take pay for the period below the minimum wage
 *     (£12.71 an hour from 1 April 2026 for those 21 and over).
 *   - Notice: if the employer ends it, the legal minimum is a week after a
 *     month's service, then a week per full year up to twelve; the contract
 *     can give more, never less. If they end your employment before the
 *     notice runs out, the rest is owed. Gross misconduct ends the right to
 *     notice, not to wages or holiday.
 *   - Time limits (GB): a deduction claim runs from the date the short pay
 *     was paid. Six months less a day where that date is on or after
 *     1 October 2026 (Employment Rights Act 2025, s.152 and Sch.12), three
 *     before, with Acas early conciliation first. Notice pay is a contract
 *     claim, which may not have moved everywhere, so the read treats it as
 *     three months from the last day, to be safe. NI keeps three months and
 *     the Labour Relations Agency.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";
import { money } from "./rent";
import { statutoryNoticeWeeks } from "./redundancy";

export { actDate, isISODate, letterDate, money, todayISO };

export type Region = "" | "gb" | "ni";
export type Ended = "" | "resigned" | "dismissed" | "misconduct" | "fixed";
export type NoticeServed = "" | "full" | "early-them" | "early-me";
export type Pattern = "" | "fixed" | "irregular";
export type PayBasis = "" | "year" | "month" | "week";
export type YesNo = "" | "yes" | "no" | "unsure";
export type DeductionKind = "" | "holiday" | "training" | "notice" | "kit" | "overpay" | "other";

export type Deduction = {
  kind: DeductionKind;
  /** The amount taken off, as typed. */
  amount: string;
  /** Did you agree to it in writing (a contract clause counts)? */
  agreed: YesNo;
};

export type LeavingInputs = {
  /** The employer's name, for the letters. Optional. */
  employer: string;
  region: Region;
  ended: Ended;
  /** ISO date continuous employment began. */
  started: string;
  /** ISO date notice was given, by either side. */
  noticeOn: string;
  /** ISO date employment ended. */
  leftOn: string;
  /** ISO date the final pay was (or will be) paid. Optional. */
  payday: string;
  noticeServed: NoticeServed;
  /** Notice in the contract, in weeks. Optional. */
  contractWeeks: string;
  pattern: Pattern;
  payBasis: PayBasis;
  /** Gross pay in the basis above (fixed hours). */
  pay: string;
  /** Days worked in a normal week (fixed hours). */
  daysPerWeek: string;
  /** Hourly rate (irregular hours). */
  hourly: string;
  /** Hours worked so far this leave year (irregular hours). */
  hoursWorked: string;
  /** Was holiday pay added to every payslip? (irregular hours) */
  rolledUp: YesNo;
  /** Holiday a year, in days, with bank holidays (fixed hours). Optional. */
  holidayDays: string;
  /** ISO date the current leave year began. Optional. */
  leaveYearFrom: string;
  /** Days (or hours, irregular) taken this leave year. */
  holidayTaken: string;
  /** Days (or hours) carried over from last year. Optional. */
  carried: string;
  /** Did the final pay cover every day worked up to the last day? */
  wagesPaid: YesNo;
  /** Days (or hours) worked and not paid, if not. Optional. */
  unpaid: string;
  /** Holiday days (or hours) paid on the final payslip. Optional. */
  paidHolidayUnits: string;
  /** The holiday line's amount on the final payslip. Optional. */
  paidHoliday: string;
  /** Notice pay on the final payslip. Optional. */
  paidNotice: string;
  deductions: Deduction[];
};

export const BLANK_DEDUCTION: Deduction = { kind: "", amount: "", agreed: "" };
export const MAX_DEDUCTIONS = 4;

export const BLANK_LEAVING: LeavingInputs = {
  employer: "",
  region: "",
  ended: "",
  started: "",
  noticeOn: "",
  leftOn: "",
  payday: "",
  noticeServed: "",
  contractWeeks: "",
  pattern: "",
  payBasis: "",
  pay: "",
  daysPerWeek: "5",
  hourly: "",
  hoursWorked: "",
  rolledUp: "",
  holidayDays: "",
  leaveYearFrom: "",
  holidayTaken: "",
  carried: "",
  wagesPaid: "",
  unpaid: "",
  paidHolidayUnits: "",
  paidHoliday: "",
  paidNotice: "",
  deductions: [],
};

/** The Employment Rights Act 2025 six-month tribunal limit. */
export const SIX_MONTHS_FROM = "2026-10-01";
/** Irregular-hours accrual applies to leave years starting from this date. */
export const ACCRUAL_FROM = "2024-04-01";
/** The National Living Wage (21 and over) from 1 April 2026. */
export const MIN_WAGE = 12.71;
/** A gap worth raising: under £20 is rounding, not a case. */
const MATERIAL = 20;

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

function num(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function numInvalid(raw: string): boolean {
  return raw.trim() !== "" && num(raw) === null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** The latest anniversary of the leave year's start on or before a date. */
function leaveYearStart(from: string, on: string): string {
  if (isISODate(from) && from <= on) {
    let s = from;
    while (addMonthsISO(s, 12) <= on) s = addMonthsISO(s, 12);
    return s;
  }
  return `${on.slice(0, 4)}-01-01`;
}

export function weeklyPay(inp: LeavingInputs): number | null {
  const n = parseMoney(inp.pay);
  if (n === null || n <= 0 || !inp.payBasis) return null;
  if (inp.payBasis === "week") return n;
  if (inp.payBasis === "month") return (n * 12) / 52;
  return n / 52;
}

export function leavingReady(inp: LeavingInputs): boolean {
  if (inp.region === "" || inp.ended === "" || inp.pattern === "") return false;
  if (!isISODate(inp.started) || !isISODate(inp.leftOn) || inp.started >= inp.leftOn) return false;
  const needsNotice = inp.ended !== "fixed" && inp.ended !== "misconduct";
  if (needsNotice) {
    if (!isISODate(inp.noticeOn) || inp.noticeOn > inp.leftOn || inp.noticeOn < inp.started) return false;
    if (inp.noticeServed === "") return false;
  }
  if (inp.pattern === "fixed") return weeklyPay(inp) !== null;
  const h = parseMoney(inp.hourly);
  return h !== null && h > 0 && inp.rolledUp !== "";
}

export type LineId = "holiday" | "notice" | "wages";
export type Line = {
  id: LineId;
  label: string;
  /** What the law gives, as far as the read can tell. */
  owed: number;
  /** What the payslip shows, if entered. */
  paid: number | null;
  detail: string;
};

export type DeductionVerdict = "fair" | "check" | "challenge";
export type DeductionRead = {
  kind: DeductionKind;
  label: string;
  amount: number;
  verdict: DeductionVerdict;
  /** The part worth challenging (all of it, or the excess over what's allowed). */
  challenge: number;
  why: string;
};

export type LeavingRead = {
  unit: "day" | "hour";
  /** Pay for one day (fixed) or one hour (irregular). */
  rate: number;
  /** Fixed hours only: salary ÷ 365, the calendar-day rate payroll often uses. */
  calendarRate: number | null;
  weekly: number | null;
  perWeek: number;
  leaveYearFrom: string;
  entitlement: number;
  accrued: number;
  carried: number;
  taken: number;
  /** accrued + carried − taken; negative when overtaken. */
  balance: number;
  /** Units of holiday owed on leaving (≥ 0). */
  holidayOwed: number;
  rolledUp: boolean;
  noticeWeeks: number;
  statNoticeWeeks: number;
  servedWeeks: number;
  noticeShortWeeks: number;
  lines: Line[];
  /** The payslip's holiday day (or hour) rate, if it can be worked out. */
  paidRate: number | null;
  /** The payslip's rate matches salary ÷ 365. */
  calendarDays: boolean;
  deductions: DeductionRead[];
  /** Short on the lines the payslip shows, plus deductions worth challenging. */
  short: number;
  /** Deductions to ask about (not clearly wrong). */
  toCheck: number;
  /** Total owed across the lines, for when there's no payslip yet. */
  owedTotal: number;
  /** The payslip details were entered, so the read can compare. */
  compared: boolean;
  claimBy: string;
  claimMonths: number;
  noticeClaimBy: string | null;
  doubts: string[];
};

const KIND_LABEL: Record<Exclude<DeductionKind, "">, string> = {
  holiday: "Holiday taken over what you'd built up",
  training: "Training costs",
  notice: "Notice not worked",
  kit: "Equipment, uniform or kit",
  overpay: "An earlier overpayment",
  other: "Something else",
};

export function deductionLabel(kind: DeductionKind): string {
  return kind ? KIND_LABEL[kind] : "A deduction";
}

function unitWord(read: { unit: "day" | "hour" }, n: number): string {
  const r = round1(n);
  return `${r} ${read.unit}${r === 1 ? "" : "s"}`;
}

export function readLeaving(inp: LeavingInputs): LeavingRead | null {
  if (!leavingReady(inp)) return null;
  const doubts: string[] = [];
  const irregular = inp.pattern === "irregular";

  // ---- The holiday year ----
  const lyStart = leaveYearStart(inp.leaveYearFrom, inp.leftOn);
  if (!isISODate(inp.leaveYearFrom)) {
    doubts.push("No leave year start entered, so this assumes it runs from 1 January. Check your contract or handbook: 1 April is common too.");
  }
  // Holiday builds up from the later of the leave year's start and the day you started.
  const accrualFrom = inp.started > lyStart ? inp.started : lyStart;
  const yearDays = daysBetween(lyStart, addMonthsISO(lyStart, 12));
  const share = Math.min(1, (daysBetween(accrualFrom, inp.leftOn) + 1) / yearDays);

  let rate: number;
  let calendarRate: number | null = null;
  let weekly: number | null;
  let perWeek = 5;
  let entitlement: number;
  let accrued: number;
  const rolledUp = irregular && inp.rolledUp === "yes";

  if (!irregular) {
    weekly = weeklyPay(inp) as number;
    perWeek = Math.min(Math.max(num(inp.daysPerWeek) ?? 5, 0.5), 7);
    rate = weekly / perWeek;
    calendarRate = (weekly * 52) / 365;
    const legalMin = Math.min(28, 5.6 * perWeek);
    const given = num(inp.holidayDays);
    entitlement = given !== null && given > 0 ? Math.max(given, legalMin) : legalMin;
    if (given !== null && given > 0 && given < legalMin) {
      doubts.push(
        `${given} days a year is below the legal minimum for ${perWeek} days a week (${round1(legalMin)}, including bank holidays), so this uses the minimum.`
      );
    }
    accrued = entitlement * share;
  } else {
    rate = parseMoney(inp.hourly) as number;
    const hours = num(inp.hoursWorked);
    const weeksIn = (daysBetween(accrualFrom, inp.leftOn) + 1) / 7;
    weekly = hours !== null && hours > 0 && weeksIn >= 1 ? (hours * rate) / weeksIn : null;
    entitlement = 0;
    accrued = rolledUp ? 0 : (hours ?? 0) * 0.1207;
    if (!rolledUp && (hours === null || inp.hoursWorked.trim() === "")) {
      doubts.push("No hours entered for this leave year, so no holiday can be worked out. Your payslips or timesheets will show them.");
    }
    if (inp.rolledUp === "unsure") {
      doubts.push("Not sure whether holiday pay was added to each payslip? Look for a separate holiday line next to your hours. If it's there every time, nothing more is owed on leaving; if not, this read is what's owed.");
    }
    if (!rolledUp && lyStart < ACCRUAL_FROM) {
      doubts.push("Your leave year started before 1 April 2024, when the 12.07% rule began, so the older method may apply to it.");
    }
  }

  const carried = num(inp.carried) ?? 0;
  const taken = num(inp.holidayTaken) ?? 0;
  if (inp.holidayTaken.trim() === "" && !rolledUp) {
    doubts.push(`No holiday taken entered, so this assumes none. Count every ${irregular ? "hour" : "day"} taken since the leave year started.`);
  }
  const balance = rolledUp ? 0 : accrued + carried - taken;
  const holidayOwed = Math.max(0, round1(balance));
  const unit: "day" | "hour" = irregular ? "hour" : "day";

  // ---- Notice ----
  const statNoticeWeeks =
    inp.ended === "dismissed" && isISODate(inp.noticeOn) ? statutoryNoticeWeeks(inp.started, inp.noticeOn) : 0;
  const contract = num(inp.contractWeeks);
  let noticeWeeks = 0;
  if (inp.ended === "dismissed") noticeWeeks = Math.max(statNoticeWeeks, contract ?? 0);
  else if (inp.ended === "resigned") noticeWeeks = Math.max(1, contract ?? 0);
  const servedWeeks = isISODate(inp.noticeOn) ? daysBetween(inp.noticeOn, inp.leftOn) / 7 : 0;
  const noticeShortWeeks =
    inp.noticeServed === "early-them" && (inp.ended === "dismissed" || inp.ended === "resigned")
      ? Math.max(0, round1(noticeWeeks - servedWeeks))
      : 0;
  if (inp.noticeServed === "early-them" && contract === null && inp.contractWeeks.trim() === "") {
    doubts.push(
      inp.ended === "resigned"
        ? "No contractual notice entered, so this assumes one week, the legal minimum for an employee. If your contract says more, enter it."
        : `No contractual notice entered, so this uses the legal minimum (${noticeWeeks} week${noticeWeeks === 1 ? "" : "s"}). Check your contract: many give a month or more.`
    );
  }
  if (noticeShortWeeks > 0 && weekly === null) {
    doubts.push("Enter your hours this leave year so the notice pay can be priced from your average week.");
  }

  // ---- Lines ----
  const lines: Line[] = [];
  const paidUnits = num(inp.paidHolidayUnits);
  const paidHolRaw = parseMoney(inp.paidHoliday);
  const paidHol = paidHolRaw !== null && paidHolRaw >= 0 && inp.paidHoliday.trim() !== "" ? paidHolRaw : null;
  if (!rolledUp && (holidayOwed >= 0.05 || paidHol !== null)) {
    const owed = holidayOwed * rate;
    const parts = [`${unitWord({ unit }, round1(accrued))} built up since ${letterDate(accrualFrom)}`];
    if (carried > 0) parts.push(`${unitWord({ unit }, carried)} carried over`);
    parts.push(`less ${unitWord({ unit }, taken)} taken`);
    lines.push({
      id: "holiday",
      label: "Holiday not taken",
      owed,
      paid: paidHol,
      detail: `${unitWord({ unit }, holidayOwed)} at ${money(rate)} a${unit === "hour" ? "n hour" : " day"}: ${parts.join(", ")}.${irregular ? " Built up at 12.07% of hours worked." : ""}`,
    });
  }
  const paidNoticeRaw = parseMoney(inp.paidNotice);
  const paidNotice = paidNoticeRaw !== null && inp.paidNotice.trim() !== "" ? paidNoticeRaw : null;
  if (noticeShortWeeks >= 0.5 && weekly !== null) {
    lines.push({
      id: "notice",
      label: "Notice cut short, in lieu",
      owed: noticeShortWeeks * weekly,
      paid: paidNotice,
      detail: `About ${round1(noticeShortWeeks)} week${round1(noticeShortWeeks) === 1 ? "" : "s"} of your ${noticeWeeks}-week notice ${inp.ended === "dismissed" ? `(${contract !== null && contract > statNoticeWeeks ? "from your contract" : "the legal minimum"})` : "period"} at ${money(weekly)} a week.`,
    });
  }
  const unpaidN = num(inp.unpaid);
  if (inp.wagesPaid === "no" && unpaidN !== null && unpaidN > 0) {
    lines.push({
      id: "wages",
      label: "Days worked and not paid",
      owed: unpaidN * rate,
      paid: 0,
      detail: `${unitWord({ unit }, unpaidN)} at ${money(rate)}.`,
    });
  }

  // ---- The payslip's day rate ----
  let paidRate: number | null = null;
  let calendarDays = false;
  if (paidHol !== null && paidUnits !== null && paidUnits > 0) {
    paidRate = paidHol / paidUnits;
    if (calendarRate !== null && Math.abs(paidRate - calendarRate) / calendarRate < 0.03 && rate - paidRate > 1) {
      calendarDays = true;
    }
  }
  if (paidHol !== null && paidUnits !== null && paidUnits > 0 && holidayOwed - paidUnits >= 0.5) {
    doubts.push(
      `The payslip pays ${unitWord({ unit }, paidUnits)} of holiday; this read makes it ${unitWord({ unit }, holidayOwed)}. Ask how they counted: the usual gaps are bank holidays, carried-over days, and the leave year's start.`
    );
  }

  // ---- Deductions ----
  const overtakenValue = Math.max(0, -balance) * rate;
  const deductions: DeductionRead[] = [];
  for (const d of inp.deductions) {
    const amt = parseMoney(d.amount);
    if (!d.kind || amt === null || amt <= 0) continue;
    const label = deductionLabel(d.kind);
    let verdict: DeductionVerdict;
    let challenge = 0;
    let why: string;
    if (d.kind === "overpay") {
      verdict = "fair";
      why = "Recovering wages you were overpaid is the one deduction the law allows without your agreement. You can ask them to show the overpayment, and to spread it if it's large.";
    } else if (d.kind === "holiday") {
      if (rolledUp) {
        verdict = "challenge";
        challenge = amt;
        why = "Your holiday pay was added to each payslip, so there's no balance to take back.";
      } else if (overtakenValue < 1) {
        verdict = "challenge";
        challenge = amt;
        why = `By this read you hadn't taken more than you'd built up (${unitWord({ unit }, holidayOwed)} left), so there's nothing to take back. Ask how they worked it out.`;
      } else if (d.agreed === "yes") {
        const excess = Math.max(0, amt - overtakenValue);
        verdict = excess > MATERIAL ? "challenge" : "fair";
        challenge = excess > MATERIAL ? excess : 0;
        why =
          excess > MATERIAL
            ? `You'd taken about ${unitWord({ unit }, -balance)} more than you'd built up, worth ${money(overtakenValue)} at your rate. The deduction is ${money(excess)} more than that.`
            : `You'd taken about ${unitWord({ unit }, -balance)} more than you'd built up, worth ${money(overtakenValue)}, and you'd agreed in writing that they could take it back.`;
      } else {
        verdict = d.agreed === "no" ? "challenge" : "check";
        challenge = d.agreed === "no" ? amt : 0;
        why =
          d.agreed === "no"
            ? "Taking back holiday you'd taken early needs a written agreement, usually a clause in the contract. Without one, they can't."
            : "Taking back holiday you'd taken early needs a written agreement, usually a clause in the contract. Ask them to point to it.";
      }
    } else {
      const floor =
        d.kind === "training" || d.kind === "kit"
          ? ` Even with a clause, a deduction like this can't take your pay for the period below the minimum wage (${money(MIN_WAGE)} an hour if you're 21 or over).`
          : "";
      const noticeNote =
        d.kind === "notice"
          ? " Not working your notice doesn't let them keep wages you'd already earned; at most they could claim what it actually cost them, which is rarely anything."
          : "";
      if (d.agreed === "yes") {
        verdict = "check";
        why = `This needs a written contract term, or your written agreement before it was taken. You say there is one, so check it covers this amount.${floor}${d.kind === "training" ? " Many clauses taper the cost over time; check how long ago the course was." : ""}`;
      } else if (d.agreed === "no") {
        verdict = "challenge";
        challenge = amt;
        why = `A deduction from wages needs a written contract term, or your written agreement before it was taken. Without one, it's an unlawful deduction.${noticeNote}`;
      } else {
        verdict = "check";
        why = `This needs a written contract term, or your written agreement before it was taken. Ask them to show you which clause they're relying on.${noticeNote}${floor}`;
      }
    }
    deductions.push({ kind: d.kind, label, amount: amt, verdict, challenge, why });
  }

  // ---- Totals ----
  const compared = lines.some((l) => l.paid !== null) || paidNotice !== null;
  const lineShort = lines.reduce((s, l) => (l.paid !== null ? s + Math.max(0, l.owed - l.paid) : s), 0);
  const challenged = deductions.reduce((s, d) => s + d.challenge, 0);
  const short = lineShort + challenged;
  const toCheck = deductions.filter((d) => d.verdict === "check").reduce((s, d) => s + d.amount, 0);
  const owedTotal = lines.reduce((s, l) => s + l.owed, 0);

  if (inp.wagesPaid === "no" && (unpaidN === null || unpaidN <= 0)) {
    doubts.push(`Enter how many ${unit}s weren't paid and the read will price them.`);
  }
  if (inp.wagesPaid === "unsure") {
    doubts.push("Check the last payslip's period: it should run to your last day. Anything after the previous payday that isn't on it is still owed.");
  }

  // ---- Dates ----
  const from = isISODate(inp.payday) ? inp.payday : inp.leftOn;
  const claimMonths = inp.region === "gb" && from >= SIX_MONTHS_FROM ? 6 : 3;
  const claimBy = addDaysISO(addMonthsISO(from, claimMonths), -1);
  const noticeClaimBy = noticeShortWeeks >= 0.5 ? addDaysISO(addMonthsISO(inp.leftOn, 3), -1) : null;
  if (!isISODate(inp.payday)) {
    doubts.push("No final payday entered, so the deadline is counted from your last day. It really runs from the day the short pay was paid, which is usually later.");
  }

  return {
    unit,
    rate,
    calendarRate,
    weekly,
    perWeek,
    leaveYearFrom: accrualFrom,
    entitlement,
    accrued,
    carried,
    taken,
    balance,
    holidayOwed,
    rolledUp,
    noticeWeeks,
    statNoticeWeeks,
    servedWeeks,
    noticeShortWeeks,
    lines,
    paidRate,
    calendarDays,
    deductions,
    short,
    toCheck,
    owedTotal,
    compared,
    claimBy,
    claimMonths,
    noticeClaimBy,
    doubts,
  };
}

function employerOf(inp: LeavingInputs): string {
  return inp.employer.trim() || "your employer";
}

export function leavingHeadline(inp: LeavingInputs, read: LeavingRead): string {
  if (read.short > MATERIAL) return `Your last pay looks about ${money(read.short)} short.`;
  if (read.compared) {
    return read.toCheck > 0
      ? `The lines look right; ${money(read.toCheck)} of deductions is worth asking about.`
      : "Your last pay looks right.";
  }
  if (read.owedTotal >= 1) {
    const parts = read.lines.map((l) =>
      l.id === "holiday" ? `${money(l.owed)} for holiday` : l.id === "notice" ? `${money(l.owed)} of notice pay` : `${money(l.owed)} of unpaid wages`
    );
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
    return `Your final pay should include about ${list}, before tax.`;
  }
  if (read.rolledUp) return "Your holiday pay was paid as you went, so only your normal pay for the days worked is due.";
  if (read.balance < -0.05) return `You've taken about ${unitWord(read, -read.balance)} more holiday than you'd built up.`;
  return "Nothing beyond your normal pay for the days you worked is owed.";
}

export function leavingBody(inp: LeavingInputs, read: LeavingRead): string {
  const paras: string[] = [];
  const emp = employerOf(inp);

  if (read.calendarDays && read.paidRate !== null) {
    paras.push(
      `The payslip prices a day's holiday at ${money(read.paidRate)}: your salary divided by 365. A year has about ${Math.round(52 * read.perWeek)} working days for you, not 365, and a day's holiday is a day's pay: ${money(read.rate)}. Unless your contract sets its own formula, that's the reading the courts have used, and it's worth ${money(read.rate - read.paidRate)} on every day.`
    );
  } else if (read.unit === "day" && !read.compared && read.holidayOwed > 0 && read.calendarRate !== null) {
    paras.push(
      `When the payslip comes, check the day rate. A day's holiday is a day's pay: your salary over the ${Math.round(52 * read.perWeek)} days you'd work in a year, ${money(read.rate)}. Payroll often divides by 365 instead, which gives ${money(read.calendarRate)} and pays every day about ${Math.round((1 - read.calendarRate / read.rate) * 100)}% less.`
    );
  }

  if (read.rolledUp) {
    paras.push(
      "Because your holiday pay was added to each payslip (12.07% of what you earned, shown as its own line), there's nothing more to pay out on leaving. If the payslips don't show it as a separate line, it may not have been paid at all: ask."
    );
  } else if (read.balance < -0.05) {
    paras.push(
      `You'd taken about ${unitWord(read, -read.balance)} more than you'd built up by your last day. ${emp === "your employer" ? "Your employer" : emp} can only take that back from your pay if you agreed in writing, usually through a clause in the contract.`
    );
  } else if (read.holidayOwed > 0) {
    paras.push(
      `Holiday builds up through the leave year whether you take it or not, and what's left when you go must be paid${inp.ended === "misconduct" ? ", even after a dismissal for gross misconduct. The law has no exception for it" : ""}.`
    );
  }

  if (read.noticeShortWeeks >= 0.5) {
    paras.push(
      inp.ended === "resigned"
        ? `You gave notice and ${emp} ended it early. Unless you agreed to go sooner, the rest of your notice is owed as pay: about ${round1(read.noticeShortWeeks)} week${round1(read.noticeShortWeeks) === 1 ? "" : "s"}.`
        : `You were owed ${read.noticeWeeks} week${read.noticeWeeks === 1 ? "" : "s"}' notice${read.statNoticeWeeks >= read.noticeWeeks && read.statNoticeWeeks > 1 ? ", the legal minimum for your years of service" : ""}, and it was cut short by about ${round1(read.noticeShortWeeks)} week${round1(read.noticeShortWeeks) === 1 ? "" : "s"}. That's owed as pay in lieu.`
    );
  } else if (inp.noticeServed === "early-me") {
    paras.push(
      `You left before your notice ran out. That can mean no pay for the weeks you didn't work, but it doesn't cancel what you'd already earned: wages for the days you worked and the holiday you'd built up are still owed. ${emp === "your employer" ? "Your employer" : emp} can't keep them as a penalty unless your contract says so in writing, and even then only what it really cost them.`
    );
  } else if (inp.ended === "misconduct") {
    paras.push("A dismissal for gross misconduct ends the right to notice pay, not to wages for the days worked or to holiday pay.");
  }

  const bad = read.deductions.filter((d) => d.verdict === "challenge");
  const check = read.deductions.filter((d) => d.verdict === "check");
  if (bad.length) {
    paras.push(
      `${bad.length === 1 ? "One deduction looks" : `${bad.length} deductions look`} wrong, worth ${money(bad.reduce((s, d) => s + d.challenge, 0))}. An employer can't take money from your wages, final ones included, beyond what a written contract term or your written agreement, made before the deduction, allows.`
    );
  } else if (check.length) {
    paras.push(
      `${check.length === 1 ? "One deduction needs" : `${check.length} deductions need`} checking against your contract. Ask which clause each one relies on.`
    );
  }
  return paras.join("\n\n");
}

export type DateLine = { on: string; title: string; body: string };

export function datesOf(inp: LeavingInputs, read: LeavingRead): DateLine[] {
  const out: DateLine[] = [];
  if (isISODate(inp.payday)) {
    out.push({
      on: inp.payday,
      title: "Final pay due",
      body: "Check the payslip line by line, and that a P45 comes with it or soon after.",
    });
  }
  out.push({
    on: read.claimBy,
    title: inp.region === "ni" ? "Last day to contact the Labour Relations Agency" : "Last day to start Acas early conciliation",
    body: `For unpaid holiday, wages or a deduction: ${read.claimMonths} months less a day from ${isISODate(inp.payday) ? "the day the short pay was paid" : "your last day"}${inp.region === "gb" && read.claimMonths === 3 ? " (pay dates from 1 October 2026 get six)" : ""}.`,
  });
  if (read.noticeClaimBy) {
    out.push({
      on: read.noticeClaimBy,
      title: "To be safe, start any notice pay claim by",
      body: "Notice pay is a contract claim. Treat it as three months less a day from your last day, even if six may now apply.",
    });
  }
  return out.filter((d) => isISODate(d.on)).sort((a, b) => a.on.localeCompare(b.on));
}

export function knowList(inp: LeavingInputs, read: LeavingRead): string[] {
  const list: string[] = [];
  if (read.unit === "day") {
    list.push(
      "If your pay varies (regular overtime, commission, shift allowances), holiday pay for the first four weeks of the year should include them, averaged over the last 52 weeks you were paid. Basic pay alone can be short."
    );
  }
  list.push(
    "An employer can make you use holiday during your notice, but only if they tell you at least twice as many days ahead as the holiday they want you to take."
  );
  if (read.carried === 0 && !read.rolledUp) {
    list.push(
      "Holiday you couldn't take last year because you were off sick, on family leave, or because the employer stopped you, can carry over and is paid on leaving too."
    );
  }
  list.push("You should get a P45 when you leave. Without it, a new employer may put you on an emergency tax code for a while.");
  list.push(
    "If the employer has gone bust, the government's Redundancy Payments Service can pay unpaid wages (up to eight weeks), holiday (up to six) and notice, at a capped weekly rate."
  );
  return list;
}

export type LeavingLetter = { id: string; title: string; note: string; text: string };

export function leavingLetters(inp: LeavingInputs, read: LeavingRead, today = todayISO()): LeavingLetter[] {
  const letters: LeavingLetter[] = [];
  const to = `Dear ${inp.employer.trim() ? `${inp.employer.trim()} payroll` : "Payroll"},`;
  const ni = inp.region === "ni";
  const lines = read.lines.map(
    (l) =>
      `- ${l.label}: ${money(l.owed)}${l.paid !== null ? ` (the payslip shows ${money(l.paid)})` : ""}. ${l.detail}`
  );
  const questioned = read.deductions.filter((d) => d.verdict !== "fair");

  if (!lines.length && !questioned.length) return letters;
  // A payslip that checks out needs no letter.
  if (read.compared && read.short <= MATERIAL && !questioned.length) return letters;
  const ended = inp.leftOn < today ? "ended" : "ends";

  const ask: string[] = [letterDate(today), "", to, ""];
  ask.push(
    read.compared || questioned.length
      ? `Thank you for my final pay. My employment ended on ${letterDate(inp.leftOn)}, and I'd be grateful if you could check the payslip against my figures below.`
      : `My employment ${ended} on ${letterDate(inp.leftOn)}. So I can check my final payslip, please confirm what it will include. By my calculation:`
  );
  if (lines.length) ask.push("", ...lines);
  if (read.calendarDays && read.paidRate !== null) {
    ask.push(
      "",
      `The holiday has been paid at ${money(read.paidRate)} a day, which is my salary divided by 365. A day's holiday pay is a day's pay, and I work ${Math.round(52 * read.perWeek)} days a year, so the rate should be ${money(read.rate)}. If my contract sets out a different formula, please point me to the clause.`
    );
  }
  if (questioned.length) {
    ask.push("", "Please also explain these deductions, and send me the written term or agreement each one relies on:");
    for (const d of questioned) ask.push(`- ${d.label}: ${money(d.amount)}.`);
  }
  if (read.short > MATERIAL) {
    ask.push("", `By my figures I'm owed a further ${money(read.short)}. Please pay it, with a corrected payslip, within 14 days.`);
  }
  ask.push("", "Please also send my P45 if it hasn't already been sent.", "", "Kind regards,", "[Your name]");
  letters.push({
    id: "check",
    title: read.compared || questioned.length ? "Ask them to check it" : "Ask what it will include",
    note: "Send it by email so it's dated. Most final-pay mistakes are fixed at this stage once someone has to look at the sum.",
    text: ask.join("\n"),
  });

  if (read.short > MATERIAL) {
    const law = ni
      ? "Part IV of the Employment Rights (Northern Ireland) Order 1996 and regulation 14 of the Working Time Regulations (Northern Ireland) 2016"
      : "Part II of the Employment Rights Act 1996 and regulation 14 of the Working Time Regulations 1998";
    letters.push({
      id: "formal",
      title: "If they don't put it right",
      note: `Send this if the first email gets no answer or a no. It names the law and the next step, which is ${ni ? "the Labour Relations Agency" : "Acas early conciliation"}, free and required before a tribunal claim.`,
      text: [
        letterDate(today),
        "",
        to,
        "",
        `I wrote about my final pay and it hasn't been corrected. I'm owed ${money(read.short)}:`,
        "",
        ...read.lines
          .filter((l) => l.paid !== null && l.owed - l.paid > 0.5)
          .map((l) => `- ${l.label}: ${money(l.owed - (l.paid as number))} short.`),
        ...read.deductions.filter((d) => d.challenge > 0).map((d) => `- ${d.label}: ${money(d.challenge)} deducted without a written agreement.`),
        "",
        `A shortfall in wages, including holiday pay owed on leaving, is an unlawful deduction under ${law}. Please pay the ${money(read.short)} within seven days. If it isn't paid, I'll contact ${ni ? "the Labour Relations Agency" : "Acas"} to start early conciliation, as the first step to an employment tribunal claim.`,
        "",
        "Kind regards,",
        "[Your name]",
      ].join("\n"),
    });
  }
  return letters;
}

export function keepList(): string[] {
  return [
    "Your contract and the staff handbook: the leave year, holiday entitlement, notice and any deduction clauses.",
    "The final payslip, and the two or three before it.",
    "Your holiday record: the booking system, or the emails that approved each day off.",
    "The resignation or dismissal letter, with the date notice was given.",
    "Every email about your final pay, and any reply.",
  ];
}

export function leavingRule(): string {
  return "When I leave a job, I check the last payslip before I spend it: the holiday I'd built up, priced at a day's real pay (salary over working days, not over 365), any notice cut short, and every deduction against something I signed.";
}

export function leavingSummary(inp: LeavingInputs, read: LeavingRead, today = todayISO()): string {
  const out = ["Leaving a job: is the last pay right?", "", leavingHeadline(inp, read)];
  const body = leavingBody(inp, read);
  if (body) out.push("", body);
  if (read.lines.length) {
    out.push("", "Owed:");
    for (const l of read.lines) out.push(`- ${l.label}: ${money(l.owed)}${l.paid !== null ? ` (paid ${money(l.paid)})` : ""}. ${l.detail}`);
  }
  if (read.deductions.length) {
    out.push("", "Deductions:");
    for (const d of read.deductions) out.push(`- ${d.label}, ${money(d.amount)}: ${d.why}`);
  }
  const dates = datesOf(inp, read);
  if (dates.length) {
    out.push("", "Dates:");
    for (const d of dates) out.push(`- ${letterDate(d.on)}: ${d.title}.`);
  }
  for (const l of leavingLetters(inp, read, today)) out.push("", `${l.title}:`, "", l.text);
  out.push("", leavingRule());
  return out.join("\n");
}

const REGIONS: Region[] = ["gb", "ni"];
const ENDED: Ended[] = ["resigned", "dismissed", "misconduct", "fixed"];
const SERVED: NoticeServed[] = ["full", "early-them", "early-me"];
const PATTERNS: Pattern[] = ["fixed", "irregular"];
const BASES: PayBasis[] = ["year", "month", "week"];
const YN: YesNo[] = ["yes", "no", "unsure"];
const KINDS: DeductionKind[] = ["holiday", "training", "notice", "kit", "overpay", "other"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseLeavingInputs(raw: unknown): LeavingInputs {
  if (!raw || typeof raw !== "object") return BLANK_LEAVING;
  const v = raw as Record<string, unknown>;
  const deds = Array.isArray(v.deductions)
    ? v.deductions.slice(0, MAX_DEDUCTIONS).map((d) => {
        const o = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
        return { kind: oneOf(o.kind, KINDS), amount: str(o.amount, 40), agreed: oneOf(o.agreed, YN) };
      })
    : [];
  return {
    employer: str(v.employer),
    region: oneOf(v.region, REGIONS),
    ended: oneOf(v.ended, ENDED),
    started: date(v.started),
    noticeOn: date(v.noticeOn),
    leftOn: date(v.leftOn),
    payday: date(v.payday),
    noticeServed: oneOf(v.noticeServed, SERVED),
    contractWeeks: str(v.contractWeeks, 10),
    pattern: oneOf(v.pattern, PATTERNS),
    payBasis: oneOf(v.payBasis, BASES),
    pay: str(v.pay, 40),
    daysPerWeek: typeof v.daysPerWeek === "string" ? v.daysPerWeek.slice(0, 10) : "5",
    hourly: str(v.hourly, 40),
    hoursWorked: str(v.hoursWorked, 10),
    rolledUp: oneOf(v.rolledUp, YN),
    holidayDays: str(v.holidayDays, 10),
    leaveYearFrom: date(v.leaveYearFrom),
    holidayTaken: str(v.holidayTaken, 10),
    carried: str(v.carried, 10),
    wagesPaid: oneOf(v.wagesPaid, YN),
    unpaid: str(v.unpaid, 10),
    paidHolidayUnits: str(v.paidHolidayUnits, 10),
    paidHoliday: str(v.paidHoliday, 40),
    paidNotice: str(v.paidNotice, 40),
    deductions: deds,
  };
}

/**
 * The worked example: two years and a bit on £31,200, resigned with a
 * month's notice, worked it. The last payslip pays six days' holiday at
 * salary ÷ 365 and takes £450 for a course, with no clause anyone can find.
 */
export function leavingExample(today = todayISO()): LeavingInputs {
  const left = addDaysISO(today, -10);
  return {
    employer: "Harbour Dental Group",
    region: "gb",
    ended: "resigned",
    started: addMonthsISO(left, -12 * 2 - 4),
    noticeOn: addMonthsISO(left, -1),
    leftOn: left,
    payday: addDaysISO(left, 5),
    noticeServed: "full",
    contractWeeks: "4",
    pattern: "fixed",
    payBasis: "year",
    pay: "£31,200",
    daysPerWeek: "5",
    hourly: "",
    hoursWorked: "",
    rolledUp: "",
    holidayDays: "28",
    leaveYearFrom: addMonthsISO(left, -7),
    holidayTaken: "10",
    carried: "",
    wagesPaid: "yes",
    unpaid: "",
    paidHolidayUnits: "6",
    paidHoliday: "£512.88",
    paidNotice: "",
    deductions: [{ kind: "training", amount: "£450", agreed: "no" }],
  };
}
