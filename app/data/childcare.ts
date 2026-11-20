/**
 * The read behind "Childcare Codes: What You Can Get, and By When?" (/childcare).
 *
 * In England, working parents can get 30 funded hours a week of childcare
 * (38 weeks a year) from the term after their child is 9 months old until
 * they start school, and anyone can use Tax-Free Childcare, where the
 * government adds £2 for every £8 paid in. Both run on one HMRC account and
 * one rule that most families meet and many lose anyway: you have to
 * *reconfirm* every three months. Miss the date and the top-up stops at once,
 * and the funded place runs out at the end of a "grace period".
 *
 * The rules, as the sources I could reach agree (gov.uk itself was blocked
 * from the sandbox; see docs/2026-11-16-session-notes.md):
 *
 *   - Working parent entitlement (England): 30 hours a week, 38 weeks a year
 *     (1,140 hours, which most providers let you stretch over more weeks), for
 *     children from 9 months old to school age. From the term after the child
 *     reaches 9 months, or the term after the code is issued, whichever is
 *     later. Terms start 1 January, 1 April and 1 September; the code has to be
 *     issued by the day before (31 December, 31 March, 31 August). You can
 *     apply up to 16 weeks before the child turns 9 months.
 *   - Universal 15 hours (England): every child from the term after their
 *     third birthday, no code needed. Working parents get 15 more on top.
 *   - Who qualifies: each parent (or the only parent) expects to earn at least
 *     16 hours a week at their minimum wage over the next three months
 *     (£12.71 an hour at 21 and over from April 2026, £10.85 at 18 to 20,
 *     £8.00 under 18 or an apprentice), and neither expects adjusted net
 *     income over £100,000 in the tax year. Exceptions: on maternity,
 *     paternity, adoption or sick leave; self-employed for under 12 months; in
 *     a couple where one works and the other gets Carer's Allowance or can't
 *     work because of illness or disability.
 *   - Reconfirm every three months from the date you applied; HMRC emails a
 *     reminder about four weeks before. A missed date ends Tax-Free Childcare
 *     top-ups straight away. The funded place runs to the end of a grace
 *     period set by the date the code lapsed (councils publish the table:
 *     1 Jan–10 Feb → 31 Mar; 11 Feb–31 Mar → 31 Aug; 1 Apr–26 May → 31 Aug;
 *     27 May–31 Aug → 31 Dec; and, as I recall the autumn split, 1 Sep–31 Oct →
 *     31 Dec; 1 Nov–31 Dec → 31 Mar). A child can't start a new place on a
 *     code in its grace period.
 *   - Tax-Free Childcare (UK-wide): 20% of the bill, up to £500 a quarter
 *     (£2,000 a year) a child, or £1,000 a quarter if the child is disabled,
 *     until the September after they turn 11. The same earnings and £100,000
 *     rules. You can't have it at the same time as Universal Credit, and a
 *     successful application ends a UC claim.
 *   - Universal Credit childcare: 85% of what you pay, up to £1,071.09 a month
 *     for one child or £1,836.16 for two or more (2026/27). Paid in arrears.
 *   - Adjusted net income is income less gross pension contributions (and Gift
 *     Aid). Between £100,000 and £125,140 each extra pound is taxed at about
 *     60% in England, because the personal allowance tapers away, so a pound
 *     into a pension there costs about 40p of take-home pay.
 *
 * Not financial advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type Nation = "" | "eng" | "scot" | "wales" | "ni";
export type Household = "" | "couple" | "single";
/** What a parent is doing now, as the earnings test sees it. */
export type Status = "" | "work" | "leave" | "newself" | "carer" | "none";
export type Age = "" | "21" | "18" | "u18";
export type Code = "" | "none" | "have";
export type YesNo = "" | "yes" | "no";

export type ChildcareInputs = {
  /** The child's name or a nickname. */
  what: string;
  nation: Nation;
  /** Date of birth, or the due date if not born yet. */
  dob: string;
  household: Household;
  youStatus: Status;
  youAge: Age;
  /** Expected earnings in the next three months, before tax. */
  youPay3m: string;
  /** Income for this tax year (6 April to 5 April), before tax. */
  youIncome: string;
  /** Pension contributions taken from that income this tax year. */
  youPension: string;
  partnerStatus: Status;
  partnerAge: Age;
  partnerPay3m: string;
  partnerIncome: string;
  partnerPension: string;
  /** The monthly childcare bill, before any funded hours. Optional. */
  bill: string;
  /** Hours a week the child is (or will be) in childcare. Optional. */
  hours: string;
  /** What the provider charges an hour. Optional. */
  rate: string;
  uc: YesNo;
  code: Code;
  /** The date you applied, or last reconfirmed. */
  codeOn: string;
};

export const BLANK_CHILDCARE: ChildcareInputs = {
  what: "",
  nation: "",
  dob: "",
  household: "",
  youStatus: "",
  youAge: "",
  youPay3m: "",
  youIncome: "",
  youPension: "",
  partnerStatus: "",
  partnerAge: "",
  partnerPay3m: "",
  partnerIncome: "",
  partnerPension: "",
  bill: "",
  hours: "",
  rate: "",
  uc: "",
  code: "",
  codeOn: "",
};

export const MIN_HOURS = 16;
export const WEEKS_IN_QUARTER = 13;
export const WAGE: Record<Exclude<Age, "">, number> = { "21": 12.71, "18": 10.85, u18: 8.0 };
export const ANI_CAP = 100000;
export const TAPER_END = 125140;
export const FUNDED_WEEKS = 38;
export const FUNDED_YEAR = 30 * FUNDED_WEEKS; // 1,140 hours
export const UNIVERSAL_YEAR = 15 * FUNDED_WEEKS; // 570 hours
/** Weeks a year a year-round nursery place usually runs. */
export const NURSERY_WEEKS = 51;
/** A typical nursery hourly rate, used only when nothing else is given. */
export const DEFAULT_RATE = 8;
export const TFC_SHARE = 0.2;
export const TFC_CAP = 2000;
export const TFC_QUARTER = 500;
export const UC_SHARE = 0.85;
export const UC_CAP_ONE = 1071.09;
export const UC_CAP_TWO = 1836.16;
export const APPLY_WEEKS_BEFORE = 16;
export const RECONFIRM_MONTHS = 3;
export const REMINDER_DAYS = 28;

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

export function threshold(age: Age): number {
  return Math.round(MIN_HOURS * WAGE[age || "21"] * WEEKS_IN_QUARTER * 100) / 100;
}

function amount(raw: string): number | null {
  const n = parseMoney(raw);
  return n === null ? null : n;
}

export function hoursInvalid(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  const n = Number(t);
  return !Number.isFinite(n) || n < 0 || n > 80;
}

/** The first day of the funding term after a date. Terms start 1 Jan, 1 Apr, 1 Sep. */
export function termAfter(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (m <= 3) return `${y}-04-01`;
  if (m <= 8) return `${y}-09-01`;
  return `${y + 1}-01-01`;
}

export function termName(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  if (m === 1) return `the spring term (January ${y})`;
  if (m === 4) return `the summer term (April ${y})`;
  return `the autumn term (September ${y})`;
}

/** 1 September of the school year a child starts reception: the one after they turn 4. */
export function schoolStart(dob: string): string {
  const [y, m] = dob.split("-").map(Number);
  return m < 9 ? `${y + 4}-09-01` : `${y + 5}-09-01`;
}

/** Tax-Free Childcare ends at the September after the 11th birthday. */
export function tfcEnd(dob: string): string {
  const [y, m] = dob.split("-").map(Number);
  return m < 9 ? `${y + 11}-09-01` : `${y + 12}-09-01`;
}

/**
 * When a funded place ends after a missed reconfirmation: the end of this
 * term or the next, by the date the code lapsed. The autumn split (31 Oct) is
 * from memory of the DfE table; councils publish their own.
 */
export function graceEnd(lapse: string): string {
  const [y, m, d] = lapse.split("-").map(Number);
  const md = m * 100 + d;
  if (md <= 210) return `${y}-03-31`;
  if (md <= 526) return `${y}-08-31`;
  if (md <= 831) return `${y}-12-31`;
  if (md <= 1031) return `${y}-12-31`;
  return `${y + 1}-03-31`;
}

export type Parent = {
  who: "you" | "partner";
  status: Status;
  pay3m: number | null;
  line: number;
  /** Meets the earnings test, by pay or by an exception. null = can't tell yet. */
  meets: boolean | null;
  exception: string;
  ani: number | null;
  over: boolean;
  /** Gross pension contribution that brings income to £100,000. */
  toCut: number;
  /** Rough take-home cost of that contribution (England rates). */
  cutCost: number;
  short: number;
};

export type Stage = "unborn" | "under9m" | "funded" | "school" | "over";

export type ChildcareRead = {
  today: string;
  stage: Stage;
  england: boolean;
  nineM: string;
  three: string;
  school: string;
  tfcEnds: string;
  applyFrom: string;
  /** The first term the 30 hours can start, given today and the code. */
  firstTerm: string;
  applyBy: string;
  /** True if the birthday term's deadline has already gone. */
  missedFirst: boolean;
  universalFrom: string;
  parents: Parent[];
  /** Everyone passes both tests. null = not enough to tell. */
  eligible: boolean | null;
  blocker: "" | "income" | "over" | "partner";
  rate: number;
  rateAssumed: boolean;
  annualBill: number | null;
  /** Annual value of the working-parent hours at this rate. */
  fundedValue: number;
  /** Annual Tax-Free Childcare top-up on what's left of the bill. */
  tfcValue: number;
  ucValue: number;
  nextDue: string;
  overdue: boolean;
  dues: string[];
  grace: string;
  /** Rough value of a term of funded hours. */
  termValue: number;
};

function parentOf(who: Parent["who"], status: Status, age: Age, payRaw: string, incomeRaw: string, pensionRaw: string, couple: boolean, otherWorks: boolean): Parent {
  const pay3m = amount(payRaw);
  const line = threshold(age);
  let meets: boolean | null = null;
  let exception = "";
  if (status === "leave") {
    meets = true;
    exception = "on leave, which counts as working";
  } else if (status === "newself") {
    meets = true;
    exception = "self-employed for under a year, so the earnings test doesn't apply yet";
  } else if (status === "carer") {
    meets = couple && otherWorks;
    exception = couple ? "not working, with Carer's Allowance or a health reason, which counts if the other parent works" : "";
  } else if (status === "none") {
    meets = false;
  } else if (status === "work") {
    meets = pay3m === null ? null : pay3m >= line;
  }
  const income = amount(incomeRaw);
  const pension = amount(pensionRaw) ?? 0;
  const ani = income === null ? null : Math.max(0, income - pension);
  const over = ani !== null && ani > ANI_CAP;
  const toCut = over && ani !== null ? Math.ceil(ani - ANI_CAP) : 0;
  const cutCost = over && ani !== null ? cutCostOf(ani, toCut) : 0;
  const short = status === "work" && pay3m !== null && pay3m < line ? Math.ceil(line - pay3m) : 0;
  return { who, status, pay3m, line, meets, exception, ani, over, toCut, cutCost, short };
}

/** Take-home cost of a gross pension contribution that brings `ani` down by `cut`. */
export function cutCostOf(ani: number, cut: number): number {
  const top = Math.max(0, Math.min(cut, ani - TAPER_END));
  const taper = cut - top;
  return Math.round(top * 0.55 + taper * 0.4);
}

export function childcareReady(inp: ChildcareInputs): boolean {
  if (!inp.nation || !isISODate(inp.dob) || !inp.household || !inp.youStatus) return false;
  if (inp.household === "couple" && !inp.partnerStatus) return false;
  return true;
}

function maxISO(a: string, b: string): string {
  return a > b ? a : b;
}

export function readChildcare(inp: ChildcareInputs, today = todayISO()): ChildcareRead | null {
  if (!childcareReady(inp)) return null;
  const england = inp.nation === "eng";
  const couple = inp.household === "couple";
  const nineM = addMonthsISO(inp.dob, 9);
  const three = addMonthsISO(inp.dob, 36);
  const school = schoolStart(inp.dob);
  const tfcEnds = tfcEnd(inp.dob);
  const applyFrom = addDaysISO(nineM, -7 * APPLY_WEEKS_BEFORE);
  const birthdayTerm = termAfter(nineM);
  const hasCode = inp.code === "have";
  const firstTerm = hasCode ? birthdayTerm : maxISO(birthdayTerm, termAfter(today));
  const applyBy = addDaysISO(firstTerm, -1);
  const missedFirst = !hasCode && termAfter(today) > birthdayTerm && today < school;
  const universalFrom = termAfter(three);

  let stage: Stage;
  if (inp.dob > today) stage = "unborn";
  else if (today < nineM) stage = "under9m";
  else if (today < school) stage = "funded";
  else if (today < tfcEnds) stage = "school";
  else stage = "over";

  const youWorks = inp.youStatus === "work" || inp.youStatus === "leave" || inp.youStatus === "newself";
  const partnerWorks = inp.partnerStatus === "work" || inp.partnerStatus === "leave" || inp.partnerStatus === "newself";
  const parents: Parent[] = [parentOf("you", inp.youStatus, inp.youAge, inp.youPay3m, inp.youIncome, inp.youPension, couple, partnerWorks)];
  if (couple) parents.push(parentOf("partner", inp.partnerStatus, inp.partnerAge, inp.partnerPay3m, inp.partnerIncome, inp.partnerPension, couple, youWorks));

  let blocker: ChildcareRead["blocker"] = "";
  let eligible: boolean | null = true;
  if (parents.some((p) => p.over)) {
    eligible = false;
    blocker = "over";
  } else if (parents.some((p) => p.meets === false)) {
    eligible = false;
    blocker = parents[0].meets === false ? "income" : "partner";
  } else if (parents.some((p) => p.meets === null)) eligible = null;

  // The rate: typed, or worked out from the bill and hours, or a typical one.
  const bill = amount(inp.bill);
  const hours = inp.hours.trim() && !hoursInvalid(inp.hours) ? Number(inp.hours) : null;
  const typed = amount(inp.rate);
  let rate = DEFAULT_RATE;
  let rateAssumed = true;
  if (typed !== null && typed > 0) {
    rate = typed;
    rateAssumed = false;
  } else if (bill !== null && hours) {
    rate = Math.round(((bill * 12) / (hours * NURSERY_WEEKS)) * 100) / 100;
    rateAssumed = false;
  }
  const annualBill = bill !== null ? bill * 12 : hours ? hours * NURSERY_WEEKS * rate : null;
  const usedHours = hours !== null ? hours * NURSERY_WEEKS : FUNDED_YEAR;
  // From three, the first 570 hours are universal; the working part is the rest.
  const threeOrOver = today >= universalFrom;
  const fundedHours = england
    ? threeOrOver
      ? Math.max(0, Math.min(usedHours, FUNDED_YEAR) - UNIVERSAL_YEAR)
      : Math.min(usedHours, FUNDED_YEAR)
    : 0;
  const fundedValue = stage === "school" || stage === "over" ? 0 : Math.round(fundedHours * rate);
  const universalValue = england && threeOrOver && stage === "funded" ? Math.min(usedHours, UNIVERSAL_YEAR) * rate : 0;
  const left = annualBill !== null ? Math.max(0, annualBill - fundedValue - universalValue) : null;
  const tfcValue = stage === "over" ? 0 : left !== null ? Math.min(TFC_CAP, Math.round(left * TFC_SHARE)) : TFC_CAP;
  const ucValue = left !== null ? Math.round(Math.min(UC_CAP_ONE, (left / 12) * UC_SHARE) * 12) : 0;

  let nextDue = "";
  let overdue = false;
  const dues: string[] = [];
  if (hasCode && isISODate(inp.codeOn)) {
    nextDue = addMonthsISO(inp.codeOn, RECONFIRM_MONTHS);
    overdue = nextDue < today;
    for (let i = 1; i <= 4; i++) dues.push(addMonthsISO(inp.codeOn, RECONFIRM_MONTHS * i));
  }
  const grace = nextDue ? graceEnd(nextDue) : "";
  const termValue = Math.round(fundedValue / 3);

  return {
    today,
    stage,
    england,
    nineM,
    three,
    school,
    tfcEnds,
    applyFrom,
    firstTerm,
    applyBy,
    missedFirst,
    universalFrom,
    parents,
    eligible,
    blocker,
    rate,
    rateAssumed,
    annualBill,
    fundedValue,
    tfcValue,
    ucValue,
    nextDue,
    overdue,
    dues,
    grace,
    termValue,
  };
}

function childName(inp: ChildcareInputs): string {
  return inp.what.trim() || "your child";
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function whoLabel(p: Parent, inp: ChildcareInputs): string {
  void inp;
  return p.who === "you" ? "You" : "Your partner";
}

/** What's at stake if a parent crosses £100,000: the hours and the top-up. */
export function atStake(read: ChildcareRead): number {
  return read.fundedValue + read.tfcValue;
}

export function fundedApplies(read: ChildcareRead): boolean {
  return read.england && (read.stage === "unborn" || read.stage === "under9m" || read.stage === "funded");
}

export function childcareHeadline(inp: ChildcareInputs, read: ChildcareRead): string {
  const name = childName(inp);
  const over = read.parents.find((p) => p.over);
  if (read.stage === "over") return `Tax-Free Childcare stopped on ${letterDate(read.tfcEnds)}, the September after ${name} turned 11.`;
  if (over) {
    const stake = atStake(read);
    if (stake > over.cutCost)
      return `${money(over.toCut)} more into a pension this tax year would keep about ${money(stake)} a year of childcare help, for about ${money(over.cutCost)} of take-home pay.`;
    return `Over £100,000 the childcare help goes. ${money(over.toCut)} into a pension would bring it back, but for about ${money(over.cutCost)} of take-home pay against ${money(stake)} a year of help.`;
  }
  if (read.blocker === "income" || read.blocker === "partner") {
    const p = read.parents.find((x) => x.meets === false)!;
    if (p.short > 0) return `${p.who === "you" ? "You'd" : "Your partner would"} need about ${money(p.short)} more pay in the next three months to qualify.`;
    return `On these answers, the earnings test isn't met, so the codes won't be issued yet.`;
  }
  if (read.overdue) return `The reconfirmation looks overdue. Log in today: Tax-Free Childcare stops at once, and the funded place runs out on ${letterDate(read.grace)}.`;
  if (inp.code === "have" && read.nextDue)
    return fundedApplies(read) && read.termValue
      ? `Reconfirm by ${actDate(read.nextDue)}. Miss it and the top-up stops at once, and about ${money(read.termValue)} a term of funded hours ends on ${letterDate(read.grace)}.`
      : `Reconfirm by ${actDate(read.nextDue)}. Miss it and the Tax-Free Childcare top-up stops at once.`;
  if (fundedApplies(read)) {
    const when = termName(read.firstTerm);
    if (read.today < read.applyFrom)
      return `Apply between ${letterDate(read.applyFrom)} and ${letterDate(read.applyBy)} for 30 funded hours from ${when}.`;
    return `Apply by ${actDate(read.applyBy)} for 30 funded hours from ${when}: about ${money(read.fundedValue)} a year.`;
  }
  const tfc = read.annualBill === null ? `up to ${money(TFC_CAP)}` : `about ${money(read.tfcValue)}`;
  if (!read.england && read.stage !== "school")
    return `Tax-Free Childcare is worth ${tfc} a year here; funded hours work differently in ${nationName(inp.nation)}.`;
  return `Tax-Free Childcare is worth ${tfc} a year on this bill, until ${letterDate(read.tfcEnds)}.`;
}

export function nationName(n: Nation): string {
  return n === "scot" ? "Scotland" : n === "wales" ? "Wales" : n === "ni" ? "Northern Ireland" : "England";
}

export function childcareBody(inp: ChildcareInputs, read: ChildcareRead): string {
  const name = childName(inp);
  const parts: string[] = [];
  if (fundedApplies(read)) {
    const t = read.today;
    if (inp.code === "have" && read.firstTerm <= t) parts.push(`The funded hours can run until ${name} starts school, usually ${letterDate(read.school)}, as long as every reconfirmation is in on time.`);
    else if (read.missedFirst) parts.push(`${cap(name)} turned 9 months on ${letterDate(read.nineM)}, so the hours could have started earlier; the earliest now is ${termName(read.firstTerm)}, and the code has to be issued by ${letterDate(read.applyBy)}.`);
    else
      parts.push(
        `${cap(name)} ${read.nineM > t ? "turns" : "turned"} 9 months on ${letterDate(read.nineM)}, so the 30 hours can start in ${termName(read.firstTerm)}. The code has to be issued by the day before, ${letterDate(read.applyBy)}${read.applyFrom > t ? `, and you can apply from ${letterDate(read.applyFrom)}` : ", and you can apply now"}.`,
      );
    if (read.universalFrom > t && read.universalFrom < read.school)
      parts.push(`From ${termName(read.universalFrom)}, after ${name}'s third birthday, 15 of the hours are universal and need no code.`);
    else if (read.universalFrom <= t) parts.push(`${cap(name)} already gets the universal 15 hours; the code adds the other 15.`);
    if (!(inp.code === "have" && read.firstTerm <= t)) parts.push(`The funded hours end when ${name} starts school, usually ${letterDate(read.school)}.`);
  } else if (read.england && read.stage === "school") {
    parts.push(`${cap(name)} is at school, so funded hours have finished. Tax-Free Childcare still covers registered wraparound care, breakfast and after-school clubs and holiday clubs until ${letterDate(read.tfcEnds)}.`);
  } else if (!read.england) {
    parts.push(nationNote(inp.nation));
  }
  if (read.eligible === null) parts.push("Add the expected pay for the next three months to check the earnings test.");
  if (inp.uc === "yes")
    parts.push(
      `On Universal Credit, the childcare element pays 85% of what's left of the bill (here about ${money(read.ucValue)} a year, up to ${money(UC_CAP_ONE)} a month for one child), against Tax-Free Childcare's 20% (about ${money(read.tfcValue)}). You can't have both, and a successful Tax-Free Childcare application ends the UC claim. Don't apply for it while on UC without checking with an adviser. The funded hours are separate: you can have those with either.`,
    );
  return parts.join(" ");
}

export function nationNote(n: Nation): string {
  if (n === "scot")
    return "In Scotland, every 3 and 4 year old (and eligible 2 year olds) gets 1,140 funded hours a year through the council, with no earnings test and no code. Tax-Free Childcare is UK-wide and works as below.";
  if (n === "wales")
    return "In Wales, the Childcare Offer for 3 and 4 year olds (up to 30 hours in term time, and 9 weeks of holidays) is applied for through the Welsh Government's own service, not HMRC. Tax-Free Childcare is UK-wide and works as below.";
  return "In Northern Ireland there's no HMRC funded-hours code; pre-school places and the Northern Ireland Childcare Subsidy Scheme work differently. Tax-Free Childcare is UK-wide and works as below.";
}

export function parentLine(inp: ChildcareInputs, p: Parent): string {
  const who = whoLabel(p, inp);
  const bits: string[] = [];
  if (p.exception && p.meets) bits.push(`${who}: ${p.exception}.`);
  else if (p.status === "carer" && !p.meets) bits.push(`${who}: Carer's Allowance or a health reason only counts in a couple where the other parent works.`);
  else if (p.status === "none") bits.push(`${who}: not working, so the earnings test isn't met unless that changes.`);
  else if (p.pay3m === null) bits.push(`${who}: add the pay you expect over the next three months.`);
  else if (p.meets) bits.push(`${who}: ${money(p.pay3m)} expected against the ${money(p.line)} line. Passes.`);
  else bits.push(`${who}: ${money(p.pay3m)} expected against the ${money(p.line)} line, ${money(p.short)} short: about ${Math.ceil(p.short / (p.line / (MIN_HOURS * WEEKS_IN_QUARTER)) / WEEKS_IN_QUARTER)} more paid hours a week at the minimum wage.`);
  if (p.ani !== null) {
    if (p.over)
      bits.push(`Adjusted net income about ${money(p.ani)}: ${money(p.toCut)} over the £100,000 line, which ends both the hours and the top-up for the whole family.`);
    else if (p.ani > ANI_CAP - 5000)
      bits.push(`Adjusted net income about ${money(p.ani)}: ${money(ANI_CAP - p.ani)} under the line. A bonus or pay rise could cross it.`);
    else bits.push(`Adjusted net income about ${money(p.ani)}: under £100,000.`);
  }
  return bits.join(" ");
}

export type Rung = { label: string; amount: string; note: string; lost?: boolean };

/** The notch, drawn: what crossing £100,000 by £1 costs, and what the pension route costs. */
export function notchRows(read: ChildcareRead, p: Parent): Rung[] {
  const rows: Rung[] = [];
  rows.push({
    label: `At ${money(ANI_CAP)} or less`,
    amount: `${money(atStake(read))} a year`,
    note: fundedApplies(read) ? `${money(read.fundedValue)} of funded hours and ${money(read.tfcValue)} of Tax-Free Childcare` : `Tax-Free Childcare`,
  });
  rows.push({
    label: `At ${money(ANI_CAP + 1)}`,
    amount: "£0",
    note: "All of it goes, for the whole family, on £1 of income.",
    lost: true,
  });
  rows.push({
    label: `${money(p.toCut)} more into a pension`,
    amount: `about ${money(p.cutCost)}`,
    note: `Take-home cost after tax relief at about ${p.ani !== null && p.ani > TAPER_END ? "45–60" : "60"}%. The ${money(p.toCut)} isn't spent: it's in the pension.`,
  });
  return rows;
}

export type DateLine = { on: string; title: string; body: string; money?: string };

export function datesOf(inp: ChildcareInputs, read: ChildcareRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  const name = childName(inp);
  if (fundedApplies(read)) {
    if (inp.code !== "have") {
      if (read.applyFrom > today) out.push({ on: read.applyFrom, title: "You can apply for the code", body: "Sixteen weeks before 9 months. Apply in the HMRC childcare service." });
      out.push({ on: read.applyBy, title: "Code issued by", body: `For ${termName(read.firstTerm)}. Apply weeks before: checks can take time.` });
    }
    out.push({ on: read.firstTerm, title: "The 30 hours can start", body: termName(read.firstTerm), money: read.fundedValue ? `${money(read.fundedValue)} a year` : undefined });
    if (read.universalFrom > today && read.universalFrom < read.school)
      out.push({ on: read.universalFrom, title: "15 hours become universal", body: `After ${name}'s third birthday, no code needed for those.` });
    out.push({ on: read.school, title: "Funded hours end", body: "Starting reception, usually." });
  }
  for (const d of read.dues) {
    if (d < today && d !== read.nextDue) continue;
    out.push({ on: d, title: "Reconfirm the childcare account", body: `Window opens ${letterDate(addDaysISO(d, -REMINDER_DAYS))}. Missed, the place runs to ${letterDate(graceEnd(d))}.` });
  }
  if (read.stage !== "over") out.push({ on: read.tfcEnds, title: "Tax-Free Childcare ends", body: "The September after the 11th birthday." });
  return out.sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

export function remindersOf(inp: ChildcareInputs, read: ChildcareRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  if (fundedApplies(read) && inp.code !== "have" && read.applyBy >= today) {
    const start = read.applyFrom > today ? read.applyFrom : today;
    const nudge = addDaysISO(read.applyBy, -42);
    out.push({ on: nudge > start ? nudge : start, title: "Apply for the childcare code", body: `Code must be issued by ${letterDate(read.applyBy)} for ${termName(read.firstTerm)}.` });
    out.push({ on: read.applyBy, title: "Last day: childcare code issued", body: `For ${termName(read.firstTerm)}.` });
  }
  for (const d of read.dues) {
    if (d < today) continue;
    out.push({ on: addDaysISO(d, -14), title: "Reconfirm the childcare account", body: `Due ${letterDate(d)}. Five minutes in the HMRC childcare service.` });
  }
  return out;
}

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(inp: ChildcareInputs, read: ChildcareRead): Message[] {
  const name = childName(inp);
  const out: Message[] = [];
  const over = read.parents.find((p) => p.over);
  if (over) {
    out.push({
      id: "payroll",
      title: "To payroll or HR: more into the pension",
      note: "Salary sacrifice also saves National Insurance. Ask before the next payroll cut-off; the contribution has to be made in this tax year. If your employer doesn't offer it, a personal pension contribution does the same job for adjusted net income.",
      text: `Hello,

I'd like to increase my pension contribution by salary sacrifice (or, if that isn't available, through the workplace scheme) by a total of ${money(over.toCut)} before 5 April, starting with the next payroll you can.

Please can you confirm:
- the date the change will take effect;
- the new monthly amount, or a one-off amount from a bonus if that's possible;
- that it reduces my pay for tax purposes (so my adjusted net income).

Thank you,
[Your name]
[Employee number]`,
    });
  }
  if (fundedApplies(read)) {
    out.push({
      id: "nursery",
      title: "To the nursery: the code, and the questions to ask",
      note: "Give the code before the term starts; the provider checks it with the council. Ask in writing what's included: funded hours can't be made conditional on buying extra ones, but providers can charge for meals and consumables.",
      text: `Hello,

Here is ${name}'s 30 hours code for ${termName(read.firstTerm)}:

Code: [11-digit code]
Child's date of birth: ${isISODate(inp.dob) ? letterDate(inp.dob) : "[date]"}
Parent's National Insurance number: [NI number]

Please could you confirm:
- that the code has been checked and the funded hours will start on ${letterDate(read.firstTerm)};
- how the hours will be spread (term time only, or stretched across the year), and what the monthly invoice will be after them;
- any charges for meals, nappies or activities, and whether they're optional.

Thank you,
[Your name]`,
    });
  }
  return out;
}

export function keepList(inp: ChildcareInputs, read: ChildcareRead): string[] {
  const out = [
    "The childcare account login (Government Gateway), and the code with its start and end dates, as the account shows them.",
    "The reconfirmation dates in a calendar, not just in HMRC's email.",
    "Payslips or invoices that show what you expected to earn when you reconfirmed.",
    "The nursery's invoices and what they say about funded hours and extra charges.",
  ];
  if (read.parents.some((p) => p.over || (p.ani !== null && p.ani > ANI_CAP - 5000)))
    out.push("Your P60, pension statements and any bonus letters: adjusted net income is checked against the whole tax year.");
  return out;
}

export function childcareRule(inp: ChildcareInputs, read: ChildcareRead): string {
  const day = read.nextDue ? Number(read.nextDue.slice(8, 10)) : 0;
  if (day) return `Every three months, on the ${ordinal(day)}, I reconfirm the childcare account before anything else that day. Five minutes, against a term of funded hours.`;
  return "When a benefit has to be renewed, I put the renewal in the calendar the day I get it, two weeks early, because it ends by default.";
}

function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
  return `${n}${s}`;
}

export function childcareSummary(inp: ChildcareInputs, read: ChildcareRead, today = todayISO()): string {
  const lines = [`Childcare for ${childName(inp)}: ${childcareHeadline(inp, read)}`, "", childcareBody(inp, read), ""];
  for (const p of read.parents) lines.push(parentLine(inp, p));
  lines.push("");
  lines.push("Dates:");
  for (const d of datesOf(inp, read, today)) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
  lines.push("", `Rule: ${childcareRule(inp, read)}`, "", "From https://bettereveryday.adder.dev/childcare. Not financial advice.");
  return lines.join("\n");
}

const NATIONS: Exclude<Nation, "">[] = ["eng", "scot", "wales", "ni"];
const HOUSEHOLDS: Exclude<Household, "">[] = ["couple", "single"];
const STATUSES: Exclude<Status, "">[] = ["work", "leave", "newself", "carer", "none"];
const AGES: Exclude<Age, "">[] = ["21", "18", "u18"];
const CODES: Exclude<Code, "">[] = ["none", "have"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

export function parseChildcareInputs(raw: unknown): ChildcareInputs {
  if (!raw || typeof raw !== "object") return BLANK_CHILDCARE;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what, 80),
    nation: oneOf(v.nation, NATIONS),
    dob: date(v.dob),
    household: oneOf(v.household, HOUSEHOLDS),
    youStatus: oneOf(v.youStatus, STATUSES),
    youAge: oneOf(v.youAge, AGES),
    youPay3m: str(v.youPay3m, 20),
    youIncome: str(v.youIncome, 20),
    youPension: str(v.youPension, 20),
    partnerStatus: oneOf(v.partnerStatus, STATUSES),
    partnerAge: oneOf(v.partnerAge, AGES),
    partnerPay3m: str(v.partnerPay3m, 20),
    partnerIncome: str(v.partnerIncome, 20),
    partnerPension: str(v.partnerPension, 20),
    bill: str(v.bill, 20),
    hours: str(v.hours, 6),
    rate: str(v.rate, 20),
    uc: oneOf(v.uc, YESNOS),
    code: oneOf(v.code, CODES),
    codeOn: date(v.codeOn),
  };
}

/**
 * The worked example: a baby who turns 9 months in about four weeks, one
 * parent on maternity leave, the other just over £100,000.
 */
export function childcareExample(today = todayISO()): ChildcareInputs {
  return {
    what: "Asha",
    nation: "eng",
    dob: addDaysISO(addMonthsISO(today, -9), 26),
    household: "couple",
    youStatus: "leave",
    youAge: "21",
    youPay3m: "",
    youIncome: "£38,000",
    youPension: "£1,900",
    partnerStatus: "work",
    partnerAge: "21",
    partnerPay3m: "£27,000",
    partnerIncome: "£108,000",
    partnerPension: "£3,000",
    bill: "£1,350",
    hours: "40",
    rate: "",
    uc: "no",
    code: "none",
    codeOn: "",
  };
}
