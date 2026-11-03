/**
 * The read behind "Made Redundant: Is the Money Right?" (/redundancy).
 *
 * The letter says your role is at risk, or that it's gone. A figure follows,
 * sometimes with a settlement agreement to sign. Most people look at one
 * number, the total, and judge it by how big it feels. A lump sum of a few
 * thousand pounds feels like more than it is (Goldstein, Hershfield and
 * Benartzi, "The Illusion of Wealth and Its Reversal", JMR 2016), and the
 * total hides the only question that matters when you're asked to sign: how
 * much of it you're owed anyway.
 *
 * So the read splits it. Three lines are owed by law whether or not you sign
 * anything: statutory redundancy pay (with two years' service), notice pay and
 * holiday you've built up and not taken. Whatever is offered above those is
 * what the employer is paying for your signature, and the claims it gives up.
 *
 * Great Britain and Northern Ireland (Employment Rights Act 1996 ss.86, 135,
 * 145, 155, 162; the NI order mirrors it). What agreed across the sources I
 * could reach (gov.uk and legislation.gov.uk don't resolve from the sandbox,
 * so these are payroll bodies, law firms' rate tables and Acas summaries):
 *
 *   - Statutory redundancy pay: half a week's pay for each full year of service
 *     under 22, one week from 22 to 40, a week and a half from 41, counting
 *     back from the "relevant date", at most 20 years. A week's pay is capped:
 *     £751 in Great Britain and £783 in Northern Ireland from 6 April 2026
 *     (£719 in GB for 2025/26; £700 for 2024/25). Two years' service needed.
 *   - The relevant date moves later if the employer gave less than the
 *     statutory minimum notice (s.145(5)), so paying in lieu still counts the
 *     statutory notice towards service. It can tip someone over two years.
 *   - Statutory notice: a week after a month's service, then a week for each
 *     full year, up to twelve. The contract can give more, never less.
 *   - Holiday: 5.6 weeks a year (28 days for five days a week), built up
 *     through the leave year and paid out if untaken when you leave.
 *   - Tax: the first £30,000 of a termination payment that is genuinely
 *     compensation (statutory and enhanced redundancy pay) is free of income
 *     tax and NI. Notice pay (PENP) and holiday pay are taxed as pay.
 *   - Tribunal time limits (GB): six months less a day for claims where the
 *     employment ends on or after 1 October 2026 (Employment Rights Act 2025),
 *     three months less a day before that, with Acas early conciliation
 *     first. Unfair dismissal needs two years' service, falling to six months
 *     where employment ends on or after 1 January 2027 (SI 2026/559), when the
 *     cap on the compensatory award also goes. Northern Ireland keeps three
 *     months and the Labour Relations Agency.
 *   - A settlement agreement is only binding if you've had advice from an
 *     independent adviser; employers usually pay towards it. The Acas Code
 *     suggests at least ten calendar days to consider one.
 *   - An insolvent employer: the Redundancy Payments Service pays statutory
 *     redundancy pay, notice pay and holiday pay, at the capped weekly rate.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";
import { money } from "./rent";

export { actDate, isISODate, letterDate, money, todayISO };

export type Region = "" | "gb" | "ni";
export type PayBasis = "" | "year" | "month" | "week";
export type NoticeHow = "" | "work" | "pilon" | "garden" | "unsure";
export type Settlement = "" | "yes" | "no";
export type EmployerState = "" | "trading" | "insolvent";

export type RedundancyInputs = {
  /** The employer's name, for the letters. Optional. */
  employer: string;
  region: Region;
  employerState: EmployerState;
  /** ISO date of birth. */
  born: string;
  /** ISO date continuous employment began. */
  started: string;
  /** ISO date you were given notice of dismissal. */
  toldOn: string;
  /** ISO date your employment ends (your last day on the payroll). */
  leavesOn: string;
  noticeHow: NoticeHow;
  /** Notice in your contract, in weeks. Optional. */
  contractWeeks: string;
  payBasis: PayBasis;
  /** Gross pay, before tax, in the basis above. */
  pay: string;
  /** Days worked in a normal week. */
  daysPerWeek: string;
  /** Holiday a year, in days, including bank holidays. Optional. */
  holidayDays: string;
  /** ISO date the current leave year began. Optional. */
  leaveYearFrom: string;
  /** Days of holiday taken (or booked before leaving) this leave year. */
  holidayTaken: string;
  /** The total the employer has offered, gross. Optional. */
  offer: string;
  /** The redundancy payment line on its own, if the letter splits it. Optional. */
  offerRedundancy: string;
  settlement: Settlement;
  /** What you spend in a month. Optional, for the runway. */
  outgoings: string;
};

export const BLANK_REDUNDANCY: RedundancyInputs = {
  employer: "",
  region: "",
  employerState: "",
  born: "",
  started: "",
  toldOn: "",
  leavesOn: "",
  noticeHow: "",
  contractWeeks: "",
  payBasis: "",
  pay: "",
  daysPerWeek: "5",
  holidayDays: "",
  leaveYearFrom: "",
  holidayTaken: "",
  offer: "",
  offerRedundancy: "",
  settlement: "",
  outgoings: "",
};

/** The tax-free band for genuine termination compensation. */
export const TAX_FREE = 30000;
/** The Employment Rights Act 2025 six-month tribunal limit. */
export const SIX_MONTHS_FROM = "2026-10-01";
/** The six-month unfair dismissal qualifying period. */
export const SHORT_QUALIFYING_FROM = "2027-01-01";

/** The weekly pay cap for statutory redundancy pay, by the relevant date. */
export function weekCap(region: Region, relevant: string): { cap: number; sure: boolean } {
  if (region === "ni") return { cap: 783, sure: relevant >= "2026-04-06" };
  if (relevant >= "2026-04-06") return { cap: 751, sure: true };
  if (relevant >= "2025-04-06") return { cap: 719, sure: true };
  if (relevant >= "2024-04-06") return { cap: 700, sure: true };
  return { cap: 700, sure: false };
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** Full years from one date to another: an age, or a length of service. */
export function fullYears(fromISO: string, toISO: string): number {
  if (!isISODate(fromISO) || !isISODate(toISO) || toISO < fromISO) return 0;
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  let y = ty - fy;
  if (tm < fm || (tm === fm && td < fd)) y -= 1;
  return Math.max(0, y);
}

/** Statutory minimum notice, in weeks, for service at a date. */
export function statutoryNoticeWeeks(started: string, on: string): number {
  if (!isISODate(started) || !isISODate(on)) return 0;
  if (addMonthsISO(started, 1) > on) return 0;
  const years = fullYears(started, on);
  return years < 2 ? 1 : Math.min(12, years);
}

/**
 * Weeks of pay for statutory redundancy pay: each full year back from the
 * relevant date, at most twenty, rated by the age at the start of that year.
 */
export function redundancyWeeks(born: string, relevant: string, years: number): number {
  let weeks = 0;
  for (let k = 1; k <= Math.min(20, years); k++) {
    const yearStart = addMonthsISO(relevant, -12 * k);
    const age = fullYears(born, yearStart);
    weeks += age >= 41 ? 1.5 : age >= 22 ? 1 : 0.5;
  }
  return weeks;
}

export function weeklyPay(inp: RedundancyInputs): number | null {
  const n = parseMoney(inp.pay);
  if (n === null || n <= 0 || !inp.payBasis) return null;
  if (inp.payBasis === "week") return n;
  if (inp.payBasis === "month") return (n * 12) / 52;
  return n / 52;
}

function num(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function numInvalid(raw: string): boolean {
  return raw.trim() !== "" && num(raw) === null;
}

/** The latest anniversary of the leave year's start on or before a date. */
function leaveYearStart(from: string, leaves: string): string {
  if (isISODate(from) && from <= leaves) {
    let s = from;
    while (addMonthsISO(s, 12) <= leaves) s = addMonthsISO(s, 12);
    return s;
  }
  return `${leaves.slice(0, 4)}-01-01`;
}

export type Line = { id: "redundancy" | "notice" | "shortfall" | "holiday"; label: string; amount: number; taxable: boolean; detail: string };

export type RedundancyStatus =
  /** The employer is insolvent: the Redundancy Payments Service pays. */
  | "insolvent"
  /** Under two years at the relevant date: no statutory redundancy pay. */
  | "short"
  /** Two years or more. */
  | "owed";

export type RedundancyRead = {
  status: RedundancyStatus;
  weekly: number;
  cap: number;
  capSure: boolean;
  capped: boolean;
  /** Full years of service at the relevant date. */
  years: number;
  age: number;
  /** s.145(5): the date service and pay are counted to. */
  relevant: string;
  /** True when the statutory notice pushed the relevant date later. */
  extended: boolean;
  redundancyWeeks: number;
  statutory: number;
  statNoticeWeeks: number;
  noticeWeeks: number;
  noticePay: number;
  /** Notice paid as a lump sum (in lieu), rather than as salary while you work or wait. */
  noticeLump: boolean;
  /** Weeks of notice short when you're leaving before notice runs out and working it. */
  noticeShortWeeks: number;
  holidayEntitlement: number;
  holidayAccrued: number;
  holidayOwed: number;
  holidayPay: number;
  /** The lines owed by law, paid on leaving. */
  lines: Line[];
  /** The sum of the lines paid as a lump sum on leaving. */
  owedLump: number;
  offer: number | null;
  /** offer − owedLump. Negative is a shortfall. */
  extra: number | null;
  offerRedundancy: number | null;
  /** The redundancy line in the offer is below statutory. */
  redundancyLow: boolean;
  /** The parts of the money that are taxed as pay, and the part over £30,000. */
  taxable: number;
  taxFree: number;
  /** Months of outgoings the money covers, before tax. */
  runway: number | null;
  /** Tribunal: last day to start early conciliation. */
  claimBy: string;
  claimMonths: number;
  /** Unfair dismissal protection by service. */
  unfairCovered: boolean;
  /** The six-month qualifying rule applies to this leaving date. */
  shortQualifying: boolean;
  doubts: string[];
};

export function redundancyReady(inp: RedundancyInputs): boolean {
  return (
    inp.region !== "" &&
    inp.employerState !== "" &&
    isISODate(inp.born) &&
    isISODate(inp.started) &&
    isISODate(inp.toldOn) &&
    isISODate(inp.leavesOn) &&
    inp.leavesOn >= inp.toldOn &&
    inp.started < inp.toldOn &&
    inp.born < inp.started &&
    inp.noticeHow !== "" &&
    weeklyPay(inp) !== null
  );
}

export function readRedundancy(inp: RedundancyInputs): RedundancyRead | null {
  if (!redundancyReady(inp)) return null;
  const weekly = weeklyPay(inp) as number;
  const doubts: string[] = [];

  const statNotice = statutoryNoticeWeeks(inp.started, inp.toldOn);
  const statEnds = addDaysISO(inp.toldOn, statNotice * 7);
  const extended = statEnds > inp.leavesOn;
  const relevant = extended ? statEnds : inp.leavesOn;
  const years = fullYears(inp.started, relevant);
  const age = fullYears(inp.born, relevant);
  const { cap, sure } = weekCap(inp.region, relevant);
  if (!sure) {
    doubts.push(
      inp.region === "ni"
        ? "Your leaving date is before 6 April 2026, so the Northern Ireland cap may have been lower than £783. Check the figure for your year with the Labour Relations Agency."
        : "Your leaving date is before April 2024, so check the weekly cap for that year."
    );
  }
  const capped = weekly > cap;
  const rWeeks = years >= 2 ? redundancyWeeks(inp.born, relevant, years) : 0;
  const statutory = rWeeks * Math.min(weekly, cap);

  const insolvent = inp.employerState === "insolvent";
  // The Redundancy Payments Service pays notice and holiday at the capped
  // weekly rate too, statutory notice only, and at most six weeks of holiday.
  const payRate = insolvent ? Math.min(weekly, cap) : weekly;
  const contract = num(inp.contractWeeks);
  const noticeWeeks = insolvent ? statNotice : Math.max(statNotice, contract ?? 0);
  const noticePay = noticeWeeks * payRate;
  const noticeLump = insolvent || inp.noticeHow === "pilon";
  const servedDays = daysBetween(inp.toldOn, inp.leavesOn);
  const noticeShortWeeks =
    inp.noticeHow === "work" || inp.noticeHow === "garden" || inp.noticeHow === "unsure"
      ? Math.max(0, Math.round(((noticeWeeks * 7 - servedDays) / 7) * 10) / 10)
      : 0;
  if (inp.noticeHow === "unsure") {
    doubts.push(
      "You weren't sure how the notice is being handled. If you're paid in lieu, it's a lump sum on the last payslip; if you work it or are on garden leave, it's your normal pay until the leaving date. Ask HR to confirm which in writing."
    );
  }
  if (!insolvent && contract === null && inp.contractWeeks.trim() === "") {
    doubts.push(
      `No contractual notice entered, so this uses the legal minimum (${noticeWeeks} week${noticeWeeks === 1 ? "" : "s"}). Check your contract: many give a month or three.`
    );
  }

  const days = num(inp.daysPerWeek) ?? 5;
  const perWeek = Math.min(Math.max(days, 0.5), 7);
  const legalMin = Math.min(28, 5.6 * perWeek);
  const given = num(inp.holidayDays);
  const entitlement = given !== null && given > 0 ? Math.max(given, legalMin) : legalMin;
  if (given !== null && given > 0 && given < legalMin) {
    doubts.push(
      `${given} days a year is below the legal minimum for ${perWeek} days a week (${Math.round(legalMin * 10) / 10}, including bank holidays), so this uses the minimum.`
    );
  }
  const lyStart = leaveYearStart(inp.leaveYearFrom, inp.leavesOn);
  if (!isISODate(inp.leaveYearFrom)) {
    doubts.push("No leave year start entered, so the holiday figure assumes it runs from 1 January. Check your contract or handbook.");
  }
  const share = Math.min(1, (daysBetween(lyStart, inp.leavesOn) + 1) / 365);
  const accrued = entitlement * share;
  const taken = num(inp.holidayTaken) ?? 0;
  if (inp.holidayTaken.trim() === "") {
    doubts.push("No holiday taken entered, so this assumes none. Include days booked before you leave.");
  }
  const holidayOwed = Math.min(
    insolvent ? 6 * perWeek : Infinity,
    Math.max(0, Math.round((accrued - taken) * 10) / 10)
  );
  const holidayPay = holidayOwed * (payRate / perWeek);
  if (accrued - taken < -0.05) {
    doubts.push(
      `You've taken more holiday than you've built up (${Math.round(accrued * 10) / 10} days so far), so check the contract: some let the employer take the difference from the last pay.`
    );
  }

  const lines: Line[] = [];
  if (years >= 2) {
    lines.push({
      id: "redundancy",
      label: "Statutory redundancy pay",
      amount: statutory,
      taxable: false,
      detail: `${fmtWeeks(rWeeks)} at ${money(Math.min(weekly, cap))} a week${capped ? `, the legal cap` : ""}, for ${years} full years${years > 20 ? `; only the last 20 count` : ""}.`,
    });
  }
  lines.push({
    id: "notice",
    label: noticeLump ? "Notice pay, in lieu" : "Notice pay",
    amount: noticePay,
    taxable: true,
    detail: `${fmtWeeks(noticeWeeks)} at ${money(payRate)}, ${insolvent ? "the statutory notice, at most the cap" : contract !== null && contract > statNotice ? "from your contract" : "the legal minimum"}.${noticeLump ? "" : " Paid as normal salary while you work it or are on garden leave."}`,
  });
  if (noticeShortWeeks >= 0.5 && !noticeLump) {
    lines.push({
      id: "shortfall",
      label: "Notice cut short, in lieu",
      amount: noticeShortWeeks * weekly,
      taxable: true,
      detail: `Your leaving date gives about ${fmtWeeks(noticeShortWeeks)} less than the notice above. Unless you agreed to go early, those weeks are owed as a lump sum.`,
    });
  }
  lines.push({
    id: "holiday",
    label: "Holiday not taken",
    amount: holidayPay,
    taxable: true,
    detail: `${fmtDays(holidayOwed)} at ${money(payRate / perWeek)} a day: ${fmtDays(Math.round(accrued * 10) / 10)} built up since ${letterDate(lyStart)}, less ${fmtDays(taken)} taken.`,
  });

  const lumpLines = lines.filter((l) => l.id !== "notice" || noticeLump);
  const owedLump = lumpLines.reduce((s, l) => s + l.amount, 0);

  const offerRaw = insolvent ? null : parseMoney(inp.offer);
  const offer = offerRaw !== null && offerRaw > 0 ? offerRaw : null;
  const extra = offer !== null ? offer - owedLump : null;
  const offerRedRaw = parseMoney(inp.offerRedundancy);
  const offerRedundancy = offerRedRaw !== null && offerRedRaw > 0 ? offerRedRaw : null;
  const redundancyLow = offerRedundancy !== null && years >= 2 && offerRedundancy + 0.5 < statutory;

  // Compensation (statutory, plus anything on top) shares the £30,000 band;
  // notice in lieu and holiday are pay.
  const shortfallPay = noticeShortWeeks >= 0.5 && !noticeLump ? noticeShortWeeks * weekly : 0;
  const payParts = holidayPay + (noticeLump ? noticePay : 0) + shortfallPay;
  const compensation = Math.max(statutory, offer !== null ? offer - payParts : statutory);
  const taxFree = Math.min(TAX_FREE, compensation);
  const taxable = payParts + Math.max(0, compensation - TAX_FREE);

  const out = parseMoney(inp.outgoings);
  const pot = offer !== null ? Math.max(offer, owedLump) : owedLump;
  const runway = out !== null && out > 0 && pot / out >= 0.1 ? pot / out : null;

  const claimMonths = inp.region === "gb" && inp.leavesOn >= SIX_MONTHS_FROM ? 6 : 3;
  const claimBy = addDaysISO(addMonthsISO(inp.leavesOn, claimMonths), -1);
  // For the qualifying period, the leaving date is pushed back by any
  // statutory notice not given (ERA s.97(2)).
  const qualifyingDate = relevant;
  const shortQualifying = inp.region === "gb" && qualifyingDate >= SHORT_QUALIFYING_FROM;
  const unfairCovered = shortQualifying
    ? addMonthsISO(inp.started, 6) <= qualifyingDate
    : years >= 2;

  const status: RedundancyStatus = inp.employerState === "insolvent" ? "insolvent" : years >= 2 ? "owed" : "short";

  return {
    status,
    weekly,
    cap,
    capSure: sure,
    capped,
    years,
    age,
    relevant,
    extended,
    redundancyWeeks: rWeeks,
    statutory,
    statNoticeWeeks: statNotice,
    noticeWeeks,
    noticePay,
    noticeLump,
    noticeShortWeeks,
    holidayEntitlement: entitlement,
    holidayAccrued: accrued,
    holidayOwed,
    holidayPay,
    lines,
    owedLump,
    offer,
    extra,
    offerRedundancy,
    redundancyLow,
    taxable,
    taxFree,
    runway,
    claimBy,
    claimMonths,
    unfairCovered,
    shortQualifying,
    doubts,
  };
}

function fmtWeeks(w: number): string {
  const r = Math.round(w * 10) / 10;
  return `${r} week${r === 1 ? "" : "s"}`;
}

function fmtDays(d: number): string {
  const r = Math.round(d * 10) / 10;
  return `${r} day${r === 1 ? "" : "s"}`;
}

function employerOf(inp: RedundancyInputs): string {
  return inp.employer.trim() || "the company";
}

/** A gap worth raising: under £20 is rounding, not a case. */
const MATERIAL = 20;

export function redundancyHeadline(inp: RedundancyInputs, read: RedundancyRead): string {
  if (read.status === "insolvent") {
    return `Claim from the Redundancy Payments Service: about ${money(read.owedLump)} by the government's capped rules.`;
  }
  if (read.extra !== null) {
    if (read.extra < -MATERIAL) {
      return `The offer is ${money(-read.extra)} short of what the law already owes you.`;
    }
    if (inp.settlement === "yes") {
      return read.extra <= MATERIAL
        ? "The offer is only what you're owed anyway. Your signature is being bought for nothing."
        : `Of the ${money(read.offer as number)} offered, ${money(read.owedLump)} is owed anyway. Your signature is being bought for ${money(read.extra)}.`;
    }
    return read.extra <= MATERIAL
      ? `The offer matches what you're owed by law: ${money(read.owedLump)}.`
      : `The offer covers what you're owed, with ${money(read.extra)} on top.`;
  }
  if (!read.noticeLump) {
    const n = `${fmtWeeks(read.noticeWeeks)}' notice paid as salary`;
    return read.owedLump < 1
      ? `By law you're owed ${n}. Nothing more is due on leaving.`
      : `By law you're owed ${money(read.owedLump)} on leaving, on top of ${n}.`;
  }
  return `By law you're owed at least ${money(read.owedLump)} when you leave.`;
}

export function redundancyBody(inp: RedundancyInputs, read: RedundancyRead): string {
  const paras: string[] = [];
  const emp = employerOf(inp);

  if (read.status === "insolvent") {
    paras.push(
      `When the employer is insolvent, the government's Redundancy Payments Service pays what it can't: statutory redundancy pay, up to 8 weeks of unpaid wages, up to 6 weeks of holiday and statutory notice pay, all at the capped rate of ${money(read.cap)} a week. Claim online (search "claim redundancy pay insolvent employer" on GOV.UK) once the insolvency practitioner sends you the case reference. Notice pay from the service is reduced by anything you earn in a new job during the notice weeks.`
    );
  } else if (read.status === "short") {
    paras.push(
      `You'll have ${read.years === 1 ? "one full year" : read.years === 0 ? "less than a year" : `${read.years} full years`} of service at ${letterDate(read.relevant)}, so there's no statutory redundancy pay: it needs two. Notice pay and holiday are still owed, and a contractual or company scheme may pay redundancy from day one. Check the handbook.`
    );
  } else {
    paras.push(
      `You'll have ${read.years} full years of service at ${letterDate(read.relevant)} and be ${read.age}. That's ${fmtWeeks(read.redundancyWeeks)} of pay${read.capped ? `, at the capped ${money(read.cap)} a week rather than your ${money(read.weekly)}` : ""}: ${money(read.statutory)} of statutory redundancy pay.`
    );
  }
  if (read.extended) {
    paras.push(
      `The statutory notice still counts even though you're leaving sooner: service and pay are worked out to ${letterDate(read.relevant)}, ${read.statNoticeWeeks} week${read.statNoticeWeeks === 1 ? "" : "s"} after you were told, not to your last day.`
    );
  }
  if (read.noticeShortWeeks >= 0.5 && !read.noticeLump) {
    paras.push(
      `Your leaving date is about ${fmtWeeks(read.noticeShortWeeks)} short of the ${fmtWeeks(read.noticeWeeks)}' notice you're owed. Unless you agreed to go early, those weeks should be paid: ask for ${money(read.noticeShortWeeks * read.weekly)} in lieu.`
    );
  }

  if (read.extra !== null && read.status !== "insolvent") {
    if (read.extra < -MATERIAL) {
      paras.push(
        `${emp === "the company" ? "The company's" : `${emp}'s`} figure of ${money(read.offer as number)} is below the ${money(read.owedLump)} the law already gives you. Before anything else, ask for a written breakdown: which part is redundancy pay, which is notice and which is holiday. The gap is usually one missing line.`
      );
    } else if (inp.settlement === "yes") {
      paras.push(
        `A settlement agreement trades your right to bring claims (unfair selection, discrimination, a missed consultation) for money. The money that pays for that is only the part above what you're owed anyway: ${read.extra > MATERIAL ? money(read.extra) : "nothing here"}. Judge that figure, not the total, against what you'd be giving up. You'll need independent advice for the agreement to be binding, and employers usually pay towards it; ask for at least ten days to decide.`
      );
    }
  }
  if (read.redundancyLow) {
    paras.push(
      `The redundancy line in the offer (${money(read.offerRedundancy as number)}) is below the statutory minimum of ${money(read.statutory)}. That part can't be bargained down. It's owed by law.`
    );
  }

  if (read.taxable > 0 || read.taxFree > 0) {
    paras.push(
      `Tax: ${read.taxFree >= 1 ? `${money(read.taxFree)} is redundancy compensation inside the £30,000 tax-free band. ` : ""}${money(read.taxable)} is taxed as pay${read.noticeLump || read.noticeShortWeeks >= 0.5 ? " (notice in lieu and holiday)" : " (holiday)"}${read.taxable > read.lines.filter((l) => l.taxable && (l.id !== "notice" || read.noticeLump)).reduce((t, l) => t + l.amount, 0) + 1 ? ", including the part over £30,000" : ""}.`
    );
  }
  if (read.runway !== null) {
    const m = Math.floor(read.runway * 10) / 10;
    paras.push(
      `At your outgoings, the ${read.offer !== null ? "offer" : "money owed"} covers about ${m} month${m === 1 ? "" : "s"}, a little less after tax. That's the number to hold the total against, not how big it sounds.`
    );
  }
  return paras.join("\n\n");
}

export type DateLine = { on: string; title: string; body: string };

export function datesOf(inp: RedundancyInputs, read: RedundancyRead): DateLine[] {
  const out: DateLine[] = [];
  out.push({
    on: inp.leavesOn,
    title: "Last day of employment",
    body: "Check the last payslip against the breakdown: notice, holiday, redundancy pay.",
  });
  if (read.status !== "insolvent") {
    out.push({
      on: read.claimBy,
      title: inp.region === "ni" ? "Last day to contact the Labour Relations Agency" : "Last day to start Acas early conciliation",
      body: `For an unfair dismissal or unfair selection claim, or unpaid notice or holiday: ${read.claimMonths} months less a day from leaving${inp.region === "gb" && read.claimMonths === 3 ? " (leaving dates from 1 October 2026 get six)" : ""}.`,
    });
  }
  if (read.status === "owed") {
    out.push({
      on: addDaysISO(addMonthsISO(read.relevant, 6), -1),
      title: "Ask in writing for statutory redundancy pay by",
      body: "If it hasn't been paid, a written claim to the employer within six months keeps your right to it.",
    });
  }
  return out.filter((d) => isISODate(d.on)).sort((a, b) => a.on.localeCompare(b.on));
}

export function knowList(inp: RedundancyInputs, read: RedundancyRead): string[] {
  const list: string[] = [];
  if (read.status === "insolvent") return list;
  if (read.years >= 2) {
    list.push(
      "During your notice you can take reasonable paid time off to look for work or train. The legal minimum pays up to two-fifths of a week's pay for it."
    );
  }
  list.push(
    "If they offer another job, you can try it for four weeks without losing your redundancy pay. Turning down a suitable one unreasonably can cost it."
  );
  list.push(
    "If 20 or more people are going at one site within 90 days, the employer has to consult collectively first. Ask how many are affected."
  );
  list.push(
    "You can ask how you were selected and see your own scores. A pool of one, criteria nobody explained, or scores that don't match your reviews are what unfair selection claims are made of."
  );
  if (read.unfairCovered) {
    list.push(
      read.shortQualifying
        ? "Because your employment ends on or after 1 January 2027, six months' service is enough for unfair dismissal protection, and the cap on compensation has gone. That makes your signature worth more than it would have been."
        : "With two years' service you're protected from unfair dismissal. A redundancy can still be unfair if the selection or the consultation was."
    );
  } else if (inp.region === "gb") {
    list.push(
      read.relevant < SHORT_QUALIFYING_FROM && addMonthsISO(inp.started, 6) <= SHORT_QUALIFYING_FROM
        ? "You don't yet have the service for unfair dismissal (two years). From 1 January 2027 it falls to six months for employment ending on or after that date, so a leaving date in the new year changes this. Discrimination claims need no service at all."
        : "You don't have the service for unfair dismissal yet. Discrimination claims need no service at all."
    );
  }
  return list;
}

export type RedundancyLetter = { id: string; title: string; note: string; text: string };

export function redundancyLetters(inp: RedundancyInputs, read: RedundancyRead, today = todayISO()): RedundancyLetter[] {
  if (read.status === "insolvent") return [];
  const letters: RedundancyLetter[] = [];
  const breakdown = read.lines.map((l) => `- ${l.label}: ${money(l.amount)}. ${l.detail}`);

  const ask: string[] = [
    letterDate(today),
    "",
    `Dear HR${inp.employer.trim() ? ` at ${inp.employer.trim()}` : ""},`,
    "",
    `Thank you for confirming my redundancy, with my employment ending on ${letterDate(inp.leavesOn)}. Before I can agree the figures, please send me a written breakdown of what will be paid, line by line.`,
    "",
    "By my calculation I am owed at least:",
    ...breakdown,
  ];
  if (read.extended) {
    ask.push(
      "",
      `My statutory notice runs to ${letterDate(read.relevant)}, so under section 145(5) of the Employment Rights Act 1996 my service is counted to that date.`
    );
  }
  if (read.noticeShortWeeks >= 0.5 && !read.noticeLump) {
    ask.push(
      "",
      `My leaving date gives me about ${fmtWeeks(read.noticeShortWeeks)} less than my notice entitlement of ${fmtWeeks(read.noticeWeeks)}. Please confirm those weeks will be paid in lieu.`
    );
  }
  if (read.extra !== null && read.extra < -MATERIAL) {
    ask.push(
      "",
      `The figure I've been given, ${money(read.offer as number)}, is ${money(-read.extra)} less than the total above. Please explain the difference or correct it.`
    );
  }
  if (read.redundancyLow) {
    ask.push(
      "",
      `The redundancy payment of ${money(read.offerRedundancy as number)} is below the statutory minimum of ${money(read.statutory)} for my age, service and the weekly cap.`
    );
  }
  ask.push(
    "",
    "Please also confirm how I was selected, my scores against the criteria, and whether any other roles are available.",
    "",
    "Kind regards,",
    "[Your name]"
  );
  letters.push({
    id: "breakdown",
    title: "Ask for the breakdown",
    note: "Send this by email so it's dated. Most mistakes are one missing line, and putting your figures first usually gets them checked.",
    text: ask.join("\n"),
  });

  if (inp.settlement === "yes") {
    letters.push({
      id: "settlement",
      title: "Reply to the settlement agreement",
      note: "This doesn't accept or refuse. It asks for what you need to decide properly: time, advice paid for, and the breakdown.",
      text: [
        letterDate(today),
        "",
        `Dear HR${inp.employer.trim() ? ` at ${inp.employer.trim()}` : ""},`,
        "",
        `Thank you for the draft settlement agreement. I'd like to take independent legal advice before I respond, as the agreement requires. Please confirm:`,
        "",
        "- how much the company will contribute towards that advice;",
        `- that I have at least ten calendar days to consider it, in line with the Acas Code of Practice on settlement agreements;`,
        "- a breakdown of the payment into redundancy pay, notice pay, holiday pay and any additional sum;",
        "- an agreed reference, and an agreed announcement to colleagues.",
        "",
        read.extra !== null && read.extra > MATERIAL
          ? `By my calculation, ${money(read.owedLump)} of the ${money(read.offer as number)} is owed to me anyway, so the payment for the agreement itself is ${money(read.extra)}. I'll consider it on that basis.`
          : `By my calculation, the amounts I'm owed by law come to ${money(read.owedLump)}, so I'd expect the payment for the agreement to be in addition to that.`,
        "",
        "Kind regards,",
        "[Your name]",
      ].join("\n"),
    });
  }
  return letters;
}

export function keepList(read: RedundancyRead): string[] {
  const list = [
    "The at-risk letter, the dismissal letter, and every email about the figures.",
    "Your contract and the staff handbook (notice, holiday year, any redundancy scheme).",
    "The last three months of payslips: they settle what a week's pay is.",
    "Notes of each consultation meeting, with the date and who was there.",
  ];
  if (read.status !== "insolvent") list.push("The selection criteria and your scores, if they share them.");
  return list;
}

export function redundancyRule(): string {
  return "When I'm made redundant, I split the money before I judge it: what the law owes me anyway, and what's on top. If I'm asked to sign, only the part on top is the price of my signature.";
}

export function redundancySummary(inp: RedundancyInputs, read: RedundancyRead, today = todayISO()): string {
  const lines = [`Made redundant: is the money right?`, "", redundancyHeadline(inp, read), "", redundancyBody(inp, read), ""];
  lines.push("Owed by law:");
  for (const l of read.lines) lines.push(`- ${l.label}: ${money(l.amount)}. ${l.detail}`);
  const dates = datesOf(inp, read);
  if (dates.length) {
    lines.push("", "Dates:");
    for (const d of dates) lines.push(`- ${letterDate(d.on)}: ${d.title}.`);
  }
  for (const l of redundancyLetters(inp, read, today)) lines.push("", `${l.title}:`, "", l.text);
  lines.push("", redundancyRule());
  return lines.join("\n");
}

const REGIONS: Region[] = ["gb", "ni"];
const BASES: PayBasis[] = ["year", "month", "week"];
const HOWS: NoticeHow[] = ["work", "pilon", "garden", "unsure"];
const SETTLE: Settlement[] = ["yes", "no"];
const STATES: EmployerState[] = ["trading", "insolvent"];

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
export function parseRedundancyInputs(raw: unknown): RedundancyInputs {
  if (!raw || typeof raw !== "object") return BLANK_REDUNDANCY;
  const v = raw as Record<string, unknown>;
  return {
    employer: str(v.employer),
    region: oneOf(v.region, REGIONS),
    employerState: oneOf(v.employerState, STATES),
    born: date(v.born),
    started: date(v.started),
    toldOn: date(v.toldOn),
    leavesOn: date(v.leavesOn),
    noticeHow: oneOf(v.noticeHow, HOWS),
    contractWeeks: str(v.contractWeeks, 10),
    payBasis: oneOf(v.payBasis, BASES),
    pay: str(v.pay, 40),
    daysPerWeek: typeof v.daysPerWeek === "string" ? v.daysPerWeek.slice(0, 10) : "5",
    holidayDays: str(v.holidayDays, 10),
    leaveYearFrom: date(v.leaveYearFrom),
    holidayTaken: str(v.holidayTaken, 10),
    offer: str(v.offer, 40),
    offerRedundancy: str(v.offerRedundancy, 40),
    settlement: oneOf(v.settlement, SETTLE),
    outgoings: str(v.outgoings, 40),
  };
}

/**
 * The worked example: eight years at a logistics firm, £38,000 a year, 46,
 * told a week ago, paid a month in lieu, and offered £16,000 to sign.
 */
export function redundancyExample(today = todayISO()): RedundancyInputs {
  const told = addDaysISO(today, -7);
  return {
    employer: "Northway Logistics",
    region: "gb",
    employerState: "trading",
    born: addMonthsISO(told, -12 * 46 - 5),
    started: addMonthsISO(told, -12 * 8 - 3),
    toldOn: told,
    leavesOn: addDaysISO(told, 14),
    noticeHow: "pilon",
    contractWeeks: "4",
    payBasis: "year",
    pay: "£38,000",
    daysPerWeek: "5",
    holidayDays: "33",
    leaveYearFrom: addMonthsISO(told, -10),
    holidayTaken: "20",
    offer: "£16,000",
    offerRedundancy: "",
    settlement: "yes",
    outgoings: "£2,100",
  };
}
