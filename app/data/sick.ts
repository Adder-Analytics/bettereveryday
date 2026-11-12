/**
 * The read behind "Off Sick: What Are You Owed, and What Do You Send?" (/sick).
 *
 * Statutory Sick Pay changed on 6 April 2026 (Employment Rights Act 2025), and
 * most people still carry the old rule in their heads. Under it, the first
 * three qualifying days were unpaid "waiting days", and anyone earning under
 * the Lower Earnings Limit (£125 a week in 2025/26) got nothing at all. Both
 * are gone. SSP is now paid from the first qualifying day off, to anyone
 * employed, at the lower of the flat rate or 80% of average weekly earnings.
 * The read's first job is to replace the remembered rule with the current one,
 * in pounds: what the old rule would have paid you, and what you're owed now.
 *
 * Its second job is the cliff. SSP lasts 28 weeks in a period of sickness,
 * counting earlier spells that ended within 56 days, and then stops. Company
 * sick pay often runs out first. The read draws the income by week and dates
 * the steps before the drop: the fit note from day eight, the SSP1 form by the
 * start of week 23, and the claim for New Style ESA or Universal Credit (ESA
 * can be claimed up to three months before SSP ends).
 *
 * UK-wide (SSP isn't devolved). What agreed across the sources I could reach
 * (gov.uk, Acas and legislation.gov.uk don't resolve from the sandbox, so this
 * comes from payroll and law-firm guides, Citizens Advice and CPAG snippets):
 *
 *   - Rate 2026/27 (6 April 2026 to 5 April 2027): £123.25 a week, or 80% of
 *     average weekly earnings (AWE) if that's lower. AWE is gross pay subject
 *     to National Insurance in the eight weeks before the sickness, ÷ 8.
 *   - Daily rate: the weekly rate ÷ the number of qualifying days in the week
 *     (the days you normally work).
 *   - Linking: spells of four or more days separated by 56 days or less form
 *     one period of incapacity for work. With no waiting days the link now
 *     mostly matters for the 28-week limit.
 *   - Notification: the employer's own rule, or within seven days if it has
 *     none. It can't require notice in person, before the first qualifying
 *     day, or more than once a week. Late notice lets it withhold SSP for the
 *     days of delay only, unless there was good cause.
 *   - Evidence: self-certification (form SC2 or the employer's own) for the
 *     first seven calendar days; a fit note after that. A fit note can come
 *     from a GP, hospital doctor, nurse, pharmacist, physiotherapist or
 *     occupational therapist. A late fit note isn't a reason to stop SSP.
 *   - SSP1: within seven days if SSP isn't payable or stops unexpectedly; by
 *     the start of week 23 if it will run out while you're still sick.
 *   - Disputes: ask the employer for written reasons (SSP1), then HMRC's
 *     Statutory Payment Dispute Team for a formal decision. Citizens Advice
 *     says to contact HMRC within six months of when SSP should have started.
 *   - Company (contractual) sick pay includes SSP; it can't pay less than SSP
 *     for a week SSP is due.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

/** Pounds, with pence unless it's a whole number: SSP rates are quoted to the penny. */
export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r)
    ? `£${r.toLocaleString("en-GB")}`
    : `£${r.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** The flat weekly rate, 6 April 2026 to 5 April 2027. */
export const SSP_RATE = 123.25;
export const RATE_UNTIL = "2027-04-05";
/** The old rules, for the "what you remember" comparison. */
export const OLD_RATE = 118.75;
export const OLD_LEL = 125;
export const OLD_WAITING_DAYS = 3;
export const NEW_RULES_FROM = "2026-04-06";
export const MAX_WEEKS = 28;
export const LINK_DAYS = 56;

export type Status = "" | "employee" | "self";
export type Still = "" | "yes" | "no";
export type PayBasis = "" | "week" | "month" | "year";
export type YesNo = "" | "yes" | "no" | "unsure";
export type CoPay = "" | "none" | "some" | "unsure";

export type SickInputs = {
  /** The employer's name, for the letters. Optional. */
  employer: string;
  status: Status;
  /** First day off sick. */
  firstDay: string;
  /** Still off? */
  still: Still;
  /** Last day off sick, if back. */
  lastDay: string;
  /** The days you normally work, Monday to Sunday, as seven 0/1 characters. */
  days: string;
  payBasis: PayBasis;
  /** Gross pay over the eight weeks before, as an average per payBasis. */
  pay: string;
  /** Another spell of sickness that ended within 56 days before this one? */
  linked: YesNo;
  /** Weeks of SSP already paid in that linked spell. */
  linkedWeeks: string;
  /** When you told your employer. */
  toldOn: string;
  /** The employer's deadline for telling them, in days. Optional; 7 if none. */
  deadlineDays: string;
  /** A fit note, if off more than seven days? */
  fitNote: YesNo;
  coPay: CoPay;
  /** Weeks of company sick pay at full pay. */
  coFull: string;
  /** Weeks of company sick pay at half pay. */
  coHalf: string;
  /** SSP paid so far, in £. Optional. */
  paid: string;
  /** Has the employer said it won't pay SSP? */
  refused: YesNo;
};

export const BLANK_SICK: SickInputs = {
  employer: "",
  status: "",
  firstDay: "",
  still: "",
  lastDay: "",
  days: "1111100",
  payBasis: "",
  pay: "",
  linked: "",
  linkedWeeks: "",
  toldOn: "",
  deadlineDays: "",
  fitNote: "",
  coPay: "",
  coFull: "",
  coHalf: "",
  paid: "",
  refused: "",
};

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function num(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function numInvalid(raw: string): boolean {
  return raw.trim() !== "" && num(raw) === null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

/** Monday = 0 … Sunday = 6. */
function weekdayOf(iso: string): number {
  return (new Date(`${iso}T00:00:00`).getDay() + 6) % 7;
}

function isQualifying(days: string, iso: string): boolean {
  return days[weekdayOf(iso)] === "1";
}

/** Qualifying days from `from` to `to`, both inclusive. */
export function qualifyingBetween(days: string, from: string, to: string): number {
  if (!isISODate(from) || !isISODate(to) || to < from) return 0;
  let n = 0;
  let d = from;
  // A spell can't run past a few years; the guard keeps a typo from hanging.
  for (let i = 0; i < 2000 && d <= to; i++) {
    if (isQualifying(days, d)) n++;
    d = addDaysISO(d, 1);
  }
  return n;
}

/** The date on which the nth qualifying day from `from` falls. */
function nthQualifying(days: string, from: string, n: number): string {
  let d = from;
  let c = 0;
  for (let i = 0; i < 4000; i++) {
    if (isQualifying(days, d)) {
      c++;
      if (c >= n) return d;
    }
    d = addDaysISO(d, 1);
  }
  return d;
}

export function qualifyingPerWeek(days: string): number {
  return days.split("").filter((c) => c === "1").length;
}

export function weeklyEarnings(inp: SickInputs): number | null {
  const p = parseMoney(inp.pay);
  if (p === null) return null;
  if (inp.payBasis === "week") return p;
  if (inp.payBasis === "month") return (p * 12) / 52;
  if (inp.payBasis === "year") return p / 52;
  return null;
}

export type Phase = {
  id: "full" | "half" | "ssp" | "none";
  label: string;
  weeks: number;
  perWeek: number;
};

export type DateLine = { on: string; title: string; body: string };

export type SickRead = {
  status: "self" | "employee";
  awe: number;
  weekly: number;
  /** True when 80% of earnings is below the flat rate. */
  capped80: boolean;
  qd: number;
  daily: number;
  /** End of the counted spell: today if still off, else the last day. */
  to: string;
  calendarDays: number;
  qDays: number;
  /** Qualifying days of SSP left in this period, after any linked spell. */
  qDaysLeft: number;
  /** Qualifying days paid so far (capped at what's left). */
  paidDays: number;
  owedSoFar: number;
  /** What the pre-April-2026 rule would have paid for the same days. */
  oldRule: number;
  oldReason: "lel" | "short" | "waiting" | "linked";
  notifyBy: string;
  /** Qualifying days of late notice the employer could withhold. */
  lateDays: number;
  lateAmount: number;
  fitNoteFrom: string;
  needsFitNote: boolean;
  weekUsed: number;
  sspEnds: string;
  week23: string;
  claimFrom: string;
  /** Already into the last stretch (week 22 or later) and still off. */
  nearEnd: boolean;
  /** SSP ran out before the counted end. */
  exhausted: boolean;
  paidIn: number | null;
  short: number;
  phases: Phase[];
  doubts: string[];
};

export function sickReady(inp: SickInputs): boolean {
  if (inp.status === "self") return true;
  if (inp.status !== "employee") return false;
  if (!isISODate(inp.firstDay)) return false;
  if (inp.still === "no" && (!isISODate(inp.lastDay) || inp.lastDay < inp.firstDay)) return false;
  if (inp.still === "") return false;
  if (qualifyingPerWeek(inp.days) === 0) return false;
  return weeklyEarnings(inp) !== null;
}

export function readSick(inp: SickInputs, today = todayISO()): SickRead | null {
  if (!sickReady(inp)) return null;
  if (inp.status === "self") {
    return {
      status: "self",
      awe: 0,
      weekly: 0,
      capped80: false,
      qd: 0,
      daily: 0,
      to: today,
      calendarDays: 0,
      qDays: 0,
      qDaysLeft: 0,
      paidDays: 0,
      owedSoFar: 0,
      oldRule: 0,
      oldReason: "lel",
      notifyBy: today,
      lateDays: 0,
      lateAmount: 0,
      fitNoteFrom: today,
      needsFitNote: false,
      weekUsed: 0,
      sspEnds: today,
      week23: today,
      claimFrom: today,
      nearEnd: false,
      exhausted: false,
      paidIn: null,
      short: 0,
      phases: [],
      doubts: [],
    };
  }
  const doubts: string[] = [];
  const awe = weeklyEarnings(inp) ?? 0;
  const weekly = round2(Math.min(SSP_RATE, 0.8 * awe));
  const capped80 = 0.8 * awe < SSP_RATE;
  const qd = qualifyingPerWeek(inp.days);
  const daily = weekly / qd;

  const firstDay = inp.firstDay;
  const to = inp.still === "yes" ? (today < firstDay ? firstDay : today) : inp.lastDay;
  const calendarDays = daysBetween(firstDay, to) + 1;
  const qDays = qualifyingBetween(inp.days, firstDay, to);

  const linked = inp.linked === "yes";
  const usedWeeks = linked ? Math.min(MAX_WEEKS, num(inp.linkedWeeks) ?? 0) : 0;
  const qDaysLeft = Math.max(0, Math.round((MAX_WEEKS - usedWeeks) * qd));
  const paidDays = Math.min(qDays, qDaysLeft);
  const owedSoFar = round2(paidDays * daily);
  const exhausted = qDays > qDaysLeft;

  // The old rule, for the same days.
  let oldRule = 0;
  let oldReason: SickRead["oldReason"] = "waiting";
  if (awe < OLD_LEL) {
    oldReason = "lel";
  } else if (linked) {
    oldReason = "linked";
    oldRule = round2(Math.min(qDays, qDaysLeft) * (OLD_RATE / qd));
  } else if (calendarDays < 4) {
    oldReason = "short";
  } else {
    oldReason = "waiting";
    oldRule = round2(Math.max(0, Math.min(qDays, qDaysLeft) - OLD_WAITING_DAYS) * (OLD_RATE / qd));
  }

  // Notification.
  const deadline = num(inp.deadlineDays) ?? 7;
  const notifyBy = addDaysISO(firstDay, Math.max(0, Math.round(deadline) - 1));
  let lateDays = 0;
  if (isISODate(inp.toldOn) && inp.toldOn > notifyBy) {
    const lastLate = addDaysISO(inp.toldOn, -1);
    lateDays = qualifyingBetween(inp.days, addDaysISO(notifyBy, 1), lastLate < to ? lastLate : to);
  }
  const lateAmount = round2(Math.min(lateDays, paidDays) * daily);

  // Evidence.
  const fitNoteFrom = addDaysISO(firstDay, 7);
  const needsFitNote = calendarDays > 7;

  // The end of SSP, assuming the same pattern continues unbroken.
  const sspEnds = qDaysLeft > 0 ? nthQualifying(inp.days, firstDay, qDaysLeft) : firstDay;
  const week23 = addDaysISO(firstDay, Math.max(0, Math.round((22 - usedWeeks) * 7)));
  const claimFrom = addMonthsISO(sspEnds, -3);
  const weekUsed = Math.floor(daysBetween(firstDay, to) / 7) + 1 + usedWeeks;
  const nearEnd = inp.still === "yes" && weekUsed >= 22;

  // The payslip check, only where SSP alone is paid.
  const paidIn = inp.coPay === "some" ? null : parseMoney(inp.paid);
  const short = paidIn !== null ? round2(Math.max(0, owedSoFar - paidIn)) : 0;

  // The weeks ahead.
  const phases: Phase[] = [];
  const sspWeeksLeft = Math.max(0, MAX_WEEKS - usedWeeks);
  let rest = sspWeeksLeft;
  if (inp.coPay === "some") {
    const full = Math.max(0, num(inp.coFull) ?? 0);
    const half = Math.max(0, num(inp.coHalf) ?? 0);
    if (full > 0) phases.push({ id: "full", label: "Company sick pay, full pay", weeks: full, perWeek: round2(awe) });
    if (half > 0)
      phases.push({ id: "half", label: "Company sick pay, half pay", weeks: half, perWeek: round2(Math.max(awe / 2, weekly)) });
    rest = Math.max(0, sspWeeksLeft - full - half);
    if (full + half > sspWeeksLeft) {
      doubts.push(
        "Your company sick pay runs longer than the SSP left in this period, so it will be the company scheme, not SSP, that stops last. Check the scheme's own rules for what happens after."
      );
    }
  }
  if (rest > 0) phases.push({ id: "ssp", label: "Statutory Sick Pay", weeks: rest, perWeek: weekly });
  phases.push({ id: "none", label: "After SSP ends", weeks: 0, perWeek: 0 });

  if (awe === 0) {
    doubts.push(
      "With no earnings in the eight weeks before, 80% of nothing is nothing. If you'd only just started, ask payroll how they've worked out your average: it should reflect what you were contracted to earn, and HMRC can decide it if you disagree."
    );
  }
  if (inp.firstDay < NEW_RULES_FROM) {
    doubts.push(
      "This spell started before 6 April 2026, when the old rules applied (three waiting days, the £125 earnings floor). Days from 6 April are under the new rules, and there was transitional protection for people whose SSP would have gone down. Ask payroll to show how they split it."
    );
  }
  if (inp.firstDay > RATE_UNTIL || to > RATE_UNTIL) {
    doubts.push("The flat rate here is 2026/27's £123.25. It changes on 6 April 2027, so days after that will be at the new rate.");
  }
  if (linked && !(num(inp.linkedWeeks) ?? 0)) {
    doubts.push(
      "You said an earlier spell links to this one but not how many weeks of SSP it used. The read treats it as none; each week used then comes off the 28."
    );
  }
  if (inp.linked === "unsure") {
    doubts.push(
      "If you were off sick before and went back less than 8 weeks before this spell started, the two link, and SSP you had then comes off the 28 weeks. Payroll will know; the read assumes they don't link."
    );
  }
  if (inp.still === "no" && calendarDays < 4) {
    doubts.push(
      "Strictly, SSP is for a period of four or more days in a row off sick (counting days you don't normally work). Since April 2026 most payroll guides pay from day one for any qualifying day off; if yours didn't for a spell under four days, ask them which rule they used."
    );
  }

  return {
    status: "employee",
    awe,
    weekly,
    capped80,
    qd,
    daily,
    to,
    calendarDays,
    qDays,
    qDaysLeft,
    paidDays,
    owedSoFar,
    oldRule,
    oldReason,
    notifyBy,
    lateDays,
    lateAmount,
    fitNoteFrom,
    needsFitNote,
    weekUsed,
    sspEnds,
    week23,
    claimFrom,
    nearEnd,
    exhausted,
    paidIn,
    short,
    phases,
    doubts,
  };
}

function employerOf(inp: SickInputs): string {
  return inp.employer.trim() || "your employer";
}

function daysWord(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

export function sickHeadline(inp: SickInputs, read: SickRead, today = todayISO()): string {
  if (read.status === "self") {
    return "Self-employed people don't get SSP. Claim New Style ESA if you've paid enough National Insurance, or Universal Credit, from the first week you can't work.";
  }
  if (read.exhausted && inp.still === "yes") {
    return `Your SSP has run out (28 weeks, ending ${actDate(read.sspEnds)}). Claim New Style ESA or Universal Credit today if you haven't.`;
  }
  if (inp.refused === "yes") {
    return `Ask ${employerOf(inp)} for form SSP1 with its reasons, then take it to HMRC. On what you've entered you're owed ${money(read.owedSoFar)} so far.`;
  }
  if (read.short > 1 && (read.paidIn ?? 0) < 0.01) {
    return `You're owed ${money(read.owedSoFar)} of SSP for ${daysWord(read.paidDays)} off, and none of it has been paid.`;
  }
  if (read.short > 1) {
    return `Your SSP is ${money(read.short)} short so far: ${money(read.owedSoFar)} is owed for ${daysWord(read.paidDays)}, and ${money(read.paidIn ?? 0)} was paid.`;
  }
  if (read.nearEnd) {
    return `Your SSP ends after ${actDate(read.sspEnds)}. Claim New Style ESA or Universal Credit now, so the money doesn't stop.`;
  }
  if (inp.still === "yes" && read.needsFitNote && inp.fitNote !== "yes") {
    return read.fitNoteFrom < today
      ? `Get a fit note: you've been off ${read.calendarDays} days, and self-certifying only covers the first seven. Your SSP so far is ${money(read.owedSoFar)}.`
      : `Get a fit note before ${actDate(read.fitNoteFrom)}: from then, self-certifying no longer covers you.`;
  }
  if (inp.still === "yes" && !isISODate(inp.toldOn) && today <= read.notifyBy) {
    return `Tell ${employerOf(inp)} by ${actDate(read.notifyBy)}. SSP is ${money(read.weekly)} a week from your first day off.`;
  }
  if (read.oldReason !== "linked" && read.oldRule < read.owedSoFar - 1) {
    return `You're owed ${money(read.owedSoFar)} of SSP so far, from your first day off. The rule most people remember would have paid ${read.oldRule ? money(read.oldRule) : "nothing"}.`;
  }
  return `You're owed ${money(read.owedSoFar)} of SSP so far: ${money(read.weekly)} a week, from your first day off.`;
}

export function sickBody(inp: SickInputs, read: SickRead): string {
  if (read.status === "self") {
    return [
      "SSP is paid by employers, so it only covers people on a payroll: employees, agency workers and people on zero-hours contracts. If you're self-employed there's no employer to pay it.",
      "New Style ESA is the contributory benefit: it depends on Class 2 or Class 4 National Insurance paid or credited in the last two or three tax years, not on savings or a partner's income. Universal Credit is means-tested and can be claimed alongside. Either needs a fit note after the first seven days.",
      "If you're also on a payroll somewhere (a part-time job alongside the business), that employer owes SSP for the days you'd have worked for it. Run the tool again as an employee for that job.",
    ].join("\n\n");
  }
  const parts: string[] = [];
  const rateLine = read.capped80
    ? `80% of your average weekly earnings (${money(read.awe)}) is ${money(read.weekly)}, which is below the flat rate of ${money(SSP_RATE)}, so that's your SSP.`
    : `Your SSP is the flat rate, ${money(SSP_RATE)} a week, because 80% of your average weekly earnings (${money(read.awe)}) is more than that.`;
  parts.push(
    `${rateLine} You normally work ${read.qd} ${read.qd === 1 ? "day" : "days"} a week, so each of those days off is worth ${money(read.daily)}.`
  );
  parts.push(
    `${read.calendarDays === 1 ? `${letterDate(inp.firstDay)} is ${read.qDays ? "a day you'd normally work" : "not a day you'd normally work"}` : `From ${letterDate(inp.firstDay)} to ${letterDate(read.to)} is ${daysWord(read.calendarDays)}, and you'd normally work on ${read.qDays} of them`}. ${
      read.exhausted
        ? `Only ${read.qDaysLeft} of those were still inside the 28 weeks, so SSP covers ${money(read.owedSoFar)}.`
        : `That's ${money(read.owedSoFar)} of SSP${inp.still === "yes" ? " so far" : ""}.`
    }${inp.coPay === "some" ? " Company sick pay includes the SSP rather than adding to it, so the payslip may show one sick pay line." : ""}`
  );
  if (read.lateDays > 0) {
    parts.push(
      `You told them after ${actDate(read.notifyBy)}, the deadline you entered, so they could hold back the ${daysWord(read.lateDays)} of delay (${money(read.lateAmount)}), and only those, unless you had good cause, such as being in hospital with no one to tell them.`
    );
  }
  return parts.join("\n\n");
}

export function oldRuleLine(read: SickRead): string {
  if (read.status === "self") return "";
  const was = read.oldRule ? money(read.oldRule) : "nothing";
  if (read.oldReason === "lel")
    return `Before 6 April 2026 you'd have got ${was}: your earnings are under the old £125 a week floor. That floor is gone, and the 80% rule replaced it.`;
  if (read.oldReason === "short")
    return `Before 6 April 2026 a spell this short paid ${was}: the first three working days were unpaid "waiting days". Those are gone.`;
  if (read.oldReason === "linked")
    return `The old rule would have paid ${was} for these days (the waiting days were served in the linked spell). The difference is the rate.`;
  return `Before 6 April 2026 the first three working days were unpaid "waiting days", so the same days would have paid ${was}. Those are gone: SSP starts on your first day off.`;
}

export function datesOf(inp: SickInputs, read: SickRead, today = todayISO()): DateLine[] {
  if (read.status === "self") return [];
  const out: DateLine[] = [];
  const still = inp.still === "yes";
  if (still && !isISODate(inp.toldOn) && read.notifyBy >= today) {
    out.push({
      on: read.notifyBy,
      title: `Tell ${employerOf(inp)} you're off sick`,
      body: "Their own rule if they have one, otherwise within seven days. A message is enough; they can't insist you do it in person.",
    });
  }
  if (still && inp.fitNote !== "yes") {
    out.push({
      on: read.fitNoteFrom,
      title: "Fit note needed from this day if you're still off",
      body: "Self-certifying covers the first seven days, weekends included. After that, a fit note from a GP, nurse, pharmacist, physio or occupational therapist.",
    });
  }
  if (still && read.calendarDays >= 21 && !read.exhausted) {
    if (read.claimFrom > today) {
      out.push({
        on: read.claimFrom,
        title: "You can claim New Style ESA from this day",
        body: "Up to three months before SSP ends, so there's no gap. Universal Credit can be claimed from week 23 if you're likely to still be off at week 28.",
      });
    }
    out.push({
      on: read.week23,
      title: "Employer should send form SSP1",
      body: "By the start of week 23, if your SSP will run out while you're still off. It's the form the ESA or Universal Credit claim asks for.",
    });
    out.push({
      on: read.sspEnds,
      title: "Your last day of SSP",
      body: "28 weeks in the period, if the spell runs on unbroken. After this the employer pays nothing unless your contract says otherwise.",
    });
  }
  if (inp.refused === "yes" || read.short > 1) {
    out.push({
      on: addMonthsISO(inp.firstDay, 6),
      title: "Contact HMRC by about now if it's still unpaid",
      body: "Citizens Advice says to call HMRC's Statutory Payment Dispute Team within six months of when SSP should have started.",
    });
  }
  return out.sort((a, b) => (a.on < b.on ? -1 : 1));
}

export function knowList(inp: SickInputs, read: SickRead): string[] {
  if (read.status === "self") {
    return [
      "A fit note is free from your GP after the first seven days, and can come from a nurse, pharmacist, physio or occupational therapist too.",
      "If you have income protection insurance, the claim deadline in the policy is often short. Check it this week.",
      "Universal Credit treats a fit note as a reason not to look for work; tell them as soon as you have one.",
    ];
  }
  const out = [
    "Your employer can't ask for a fit note for the first seven days. A late fit note isn't a reason to stop SSP.",
    "A fit note saying you \"may be fit for work\" with changes (fewer hours, lighter duties) is a fit note. If your employer can't make the changes, you stay off and SSP carries on.",
    "Holiday keeps building while you're off sick, and leave you couldn't take because of it carries over.",
    `SSP is taxed and has National Insurance taken like pay. If you're on Universal Credit it counts as earnings, so tell them.`,
    `Agency workers and people on zero-hours contracts get SSP too, from the agency or employer that pays them. If you have two jobs, each pays its own SSP.`,
  ];
  if (inp.linked !== "yes")
    out.push("If you go back and are off again within 56 days, the two spells link: the weeks you've already had count towards the 28.");
  if (inp.coPay !== "some")
    out.push("Check your contract or staff handbook for company sick pay. Many employers pay more than SSP for a set number of weeks.");
  return out;
}

export type SickLetter = { id: string; title: string; note: string; text: string };

export function sickLetters(inp: SickInputs, read: SickRead, today = todayISO()): SickLetter[] {
  if (read.status === "self") return [];
  const who = inp.employer.trim();
  const dear = who ? `Dear ${who} payroll team,` : "Dear payroll team,";
  const out: SickLetter[] = [];
  if (inp.still === "yes") {
    out.push({
      id: "tell",
      title: "Telling work you're off",
      note: "A text or email is enough, unless your sick policy asks for a call. Keep a copy.",
      text: [
        "Hello,",
        "",
        `I'm unwell and won't be able to work. My first day off sick was ${letterDate(inp.firstDay)}. I don't yet know when I'll be back, and I'll keep you updated.`,
        "",
        `I'm self-certifying for the first seven days. If I'm off for longer than that I'll send a fit note, which I'd need from ${letterDate(read.fitNoteFrom)}.`,
        "",
        "Please let me know if you need anything else from me for sick pay.",
        "",
        "Thanks,",
      ].join("\n"),
    });
  }
  const ask = inp.refused === "yes" || read.short > 1 || inp.refused === "unsure";
  if (ask) {
    out.push({
      id: "ask",
      title: "Asking for your SSP",
      note: "Send it in writing. If they still won't pay, the SSP1 they send back (or don't) is what HMRC's Statutory Payment Dispute Team will ask for.",
      text: [
        dear,
        "",
        `I've been off sick since ${letterDate(inp.firstDay)}${inp.still === "no" ? `, returning after ${letterDate(inp.lastDay)}` : ""}. I told my manager on ${isISODate(inp.toldOn) ? letterDate(inp.toldOn) : "[date]"}${read.needsFitNote ? " and have provided [self-certification / a fit note] for the period" : " and have self-certified"}.`,
        "",
        `Since 6 April 2026 Statutory Sick Pay is payable from the first qualifying day of sickness, with no lower earnings limit, at £${SSP_RATE.toFixed(2)} a week or 80% of average weekly earnings if lower. My average weekly earnings in the eight weeks before were about ${money(read.awe)}, so my weekly rate is ${money(read.weekly)}. I normally work ${read.qd} days a week, which makes the daily rate ${money(read.daily)}.`,
        "",
        `For ${read.paidDays} qualifying days that comes to ${money(read.owedSoFar)}${read.paidIn !== null ? `. I've been paid ${money(read.paidIn)}, leaving ${money(read.short)}` : ""}.`,
        "",
        "Please pay the balance in the next payroll. If you've decided I'm not entitled to some or all of it, please give me your reasons in writing on form SSP1 within seven days, so I can ask HMRC for a decision.",
        "",
        "Yours faithfully,",
        "",
        letterDate(today),
      ].join("\n"),
    });
  }
  if (inp.still === "yes" && read.calendarDays >= 21) {
    out.push({
      id: "ssp1",
      title: "Asking for the SSP1 early",
      note: "For a claim for New Style ESA, which you can make up to three months before SSP ends.",
      text: [
        dear,
        "",
        `I've been off sick since ${letterDate(inp.firstDay)} and expect to be off for some time. On my reckoning my Statutory Sick Pay will end after ${letterDate(read.sspEnds)}.`,
        "",
        "So I can claim New Style Employment and Support Allowance without a gap, please send me form SSP1 now, or by the start of week 23 at the latest, and confirm the last day you expect to pay SSP.",
        "",
        "Thank you,",
        "",
        letterDate(today),
      ].join("\n"),
    });
  }
  return out;
}

export function keepList(): string[] {
  return [
    "The message where you told work, with its date.",
    "Every fit note (a photo of each is fine) and any self-certification form.",
    "Payslips for the eight weeks before you went off, and every one since.",
    "Your contract or the sick pay policy, if there's company sick pay.",
    "Any SSP1 form, and notes of calls with HR or payroll: date, name, what was said.",
  ];
}

export function sickRule(): string {
  return "Sick pay starts on the first day now, whatever I earn. I tell them that day, self-certify for seven days, get a fit note on day eight, and plan the claim before week 23.";
}

export function sickSummary(inp: SickInputs, read: SickRead, today = todayISO()): string {
  const lines = [`Off sick — ${letterDate(today)}`, "", sickHeadline(inp, read, today), "", sickBody(inp, read)];
  const old = oldRuleLine(read);
  if (old) lines.push("", old);
  const dates = datesOf(inp, read, today);
  if (dates.length) {
    lines.push("", "Dates:");
    for (const d of dates) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
  }
  if (read.doubts.length) {
    lines.push("", "Worth checking:");
    for (const d of read.doubts) lines.push(`- ${d}`);
  }
  lines.push("", "From bettereveryday.vercel.app/sick. Not legal advice.");
  return lines.join("\n");
}

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

export function parseSickInputs(raw: unknown): SickInputs {
  if (!raw || typeof raw !== "object") return BLANK_SICK;
  const r = raw as Record<string, unknown>;
  const days = typeof r.days === "string" && /^[01]{7}$/.test(r.days) ? r.days : BLANK_SICK.days;
  return {
    employer: str(r.employer, 80),
    status: oneOf<Status>(r.status, ["employee", "self"]),
    firstDay: date(r.firstDay),
    still: oneOf<Still>(r.still, ["yes", "no"]),
    lastDay: date(r.lastDay),
    days,
    payBasis: oneOf<PayBasis>(r.payBasis, ["week", "month", "year"]),
    pay: str(r.pay, 20),
    linked: oneOf<YesNo>(r.linked, ["yes", "no", "unsure"]),
    linkedWeeks: str(r.linkedWeeks, 6),
    toldOn: date(r.toldOn),
    deadlineDays: str(r.deadlineDays, 4),
    fitNote: oneOf<YesNo>(r.fitNote, ["yes", "no", "unsure"]),
    coPay: oneOf<CoPay>(r.coPay, ["none", "some", "unsure"]),
    coFull: str(r.coFull, 6),
    coHalf: str(r.coHalf, 6),
    paid: str(r.paid, 20),
    refused: oneOf<YesNo>(r.refused, ["yes", "no", "unsure"]),
  };
}

/**
 * The worked example: three days a week in a café on about £120 a week, off
 * for twelve days with flu and then a chest infection. Under the old rules
 * they'd have got nothing (under £125 a week); now it's 80% of £120.
 */
export function sickExample(today = todayISO()): SickInputs {
  const lastDay = addDaysISO(today, -3);
  const firstDay = addDaysISO(lastDay, -11);
  return {
    ...BLANK_SICK,
    employer: "Corner Café",
    status: "employee",
    firstDay,
    still: "no",
    lastDay,
    days: "1010100",
    payBasis: "week",
    pay: "£120",
    linked: "no",
    toldOn: firstDay,
    fitNote: "yes",
    coPay: "none",
    paid: "£0",
    refused: "unsure",
  };
}
