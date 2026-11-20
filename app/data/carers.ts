/**
 * The read behind "Carer's Allowance: Can You Get It, and Can You Earn This?"
 * (/carers).
 *
 * Carer's Allowance pays £86.45 a week to someone who cares for 35 hours or
 * more for a person getting a disability benefit. It has a cliff edge: if your
 * earnings after the allowed deductions are more than £204 in a week, you get
 * nothing for that week, not a little less. A pound over costs £86.45. The
 * deductions are where most people go wrong: tax, National Insurance, half of
 * any pension contribution, some care costs and work expenses all come off
 * before the test, so many people who think they're over aren't, and others
 * find out from an overpayment letter that one month's overtime or bonus
 * crossed the line for every week that pay covered.
 *
 * The rules and figures, as far as the sources I could reach agree (gov.uk,
 * Carers UK and MoneySavingExpert were DNS-blocked from the sandbox; see
 * docs/2026-11-20-session-notes.md):
 *
 *   - 2026/27: £86.45 a week. Earnings limit £204 a week after deductions
 *     (it was £196 in 2025/26, £151 before April 2025). The limit is now tied
 *     to 16 hours at the National Living Wage (£12.71 × 16 = £203.36, rounded
 *     up). From April 2027 the NLW is £13.21, so the limit should be about
 *     £212; the DWP's proposed rate is £89.50. Both are "expected" here.
 *   - Deductions (DWP guidance via Carers UK's factsheet): income tax, Class 1
 *     NI, half of contributions to an occupational or personal pension,
 *     expenses wholly, exclusively and necessarily for the job (not
 *     commuting), and care costs paid to someone who isn't a close relative,
 *     for the person you care for or a child under 16, while you work, up to
 *     half of your net earnings.
 *   - Assessment: weekly pay counts in the week it's due; monthly pay is
 *     multiplied by 12 and divided by 52. Irregular earnings can be averaged
 *     over a recognisable cycle or five weeks (or another period that gives a
 *     fairer figure). The 2025 independent review (Liz Sayce) found the DWP's
 *     averaging guidance had been applied wrongly; the government began a
 *     review of about 200,000 cases in April 2026, with debts reduced,
 *     cancelled or refunded for an estimated 25,000.
 *   - The 28 October 2026 Budget announced work to remove the cliff edge "once
 *     the necessary infrastructure is in place". No date or design yet, so the
 *     cliff applies today.
 *   - Universal Credit: Carer's Allowance counts as unearned income and comes
 *     off UC in full; the UC carer element (£209.34 a month in 2026/27) needs
 *     the 35 hours, not the allowance itself.
 *   - Overlaps: Carer's Allowance isn't paid on top of a State Pension of at
 *     least the same amount, but "underlying entitlement" can still add a carer
 *     amount to Pension Credit or Housing Benefit.
 *   - The person you care for can lose a severe disability premium (in
 *     Pension Credit, Housing Benefit, income-related ESA or JSA, or Income
 *     Support) when someone is paid Carer's Allowance for them.
 *   - Backdating: up to three months, or to the date the disability benefit
 *     was awarded if you claim within three months of that decision.
 *   - Scotland: Carer Support Payment (Social Security Scotland) has replaced
 *     Carer's Allowance, with the same rate and earnings limit. Northern
 *     Ireland: Carer's Allowance through the Department for Communities.
 *
 * Tax and NI, when not given, are estimated for a 1257L code with no other
 * income: 20% and 8% above £12,570 a year (about £241.73 a week). Not advice.
 * Pure data and functions, no React.
 */

import { formatMoney, parseMoney } from "./worth";
import { isISODate, letterDate, todayISO } from "./refund";

export { isISODate, letterDate, todayISO };

export type YesNo = "" | "yes" | "no";
export type Unsure = "" | "yes" | "no" | "unsure";
export type Where = "" | "ew" | "scotland" | "ni";
export type Hours = "" | "35" | "20" | "under";
export type Qualifying = "" | "yes" | "waiting" | "no";
export type Work = "" | "none" | "employed" | "self";
export type Freq = "" | "weekly" | "fortnightly" | "fourweekly" | "monthly";
export type PensionType = "" | "normal" | "sacrifice";

export type CarersInputs = {
  where: Where;
  hours: Hours;
  qualifying: Qualifying;
  student: YesNo;
  statePension: YesNo;
  uc: YesNo;
  /** The person you care for gets Pension Credit, Housing Benefit, income-related ESA/JSA or Income Support. */
  caredMeansTested: Unsure;
  work: Work;
  freq: Freq;
  /** Gross pay for one pay period (after any salary sacrifice). */
  gross: string;
  /** Tax and NI on the payslip for one period; blank means estimate. */
  tax: string;
  ni: string;
  /** Your own pension contribution for one period. */
  pension: string;
  pensionType: PensionType;
  /** Work expenses you pay yourself, for one period. */
  expenses: string;
  /** Pay varies from period to period. */
  varies: YesNo;
  /** The biggest gross pay in one period recently. */
  highest: string;
  /** Pay per hour, to put the numbers in hours. */
  hourly: string;
  /** Self-employed: yearly profit after business expenses, and yearly pension contributions. */
  profit: string;
  selfPension: string;
  /** Care costs paid while you work, a week. */
  care: string;
  /** Had a letter saying you were overpaid. */
  overpaid: YesNo;
};

export const BLANK_CARERS: CarersInputs = {
  where: "",
  hours: "",
  qualifying: "",
  student: "",
  statePension: "",
  uc: "",
  caredMeansTested: "",
  work: "",
  freq: "",
  gross: "",
  tax: "",
  ni: "",
  pension: "",
  pensionType: "",
  expenses: "",
  varies: "",
  highest: "",
  hourly: "",
  profit: "",
  selfPension: "",
  care: "",
  overpaid: "",
};

export const RATE = 86.45;
export const LIMIT = 204;
export const NEXT_RATE = 89.5;
export const NEXT_LIMIT = 212;
export const UC_CARER_MONTHLY = 209.34;
export const NLW = 12.71;
/** Personal allowance and NI primary threshold, a week (2026/27, 1257L). */
const THRESHOLD_WEEK = 12570 / 52;
/** A pound or so of headroom counts as "tight". */
export const TIGHT = 15;

/** Weeks one pay period covers. */
export const WEEKS: Record<Exclude<Freq, "">, number> = {
  weekly: 1,
  fortnightly: 2,
  fourweekly: 4,
  monthly: 52 / 12,
};

export const PERIOD_NAME: Record<Exclude<Freq, "">, string> = {
  weekly: "week",
  fortnightly: "fortnight",
  fourweekly: "four weeks",
  monthly: "month",
};

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

export function pounds2(n: number): string {
  return `£${n.toFixed(2)}`;
}

function amt(raw: string): number {
  return parseMoney(raw) ?? 0;
}

function given(raw: string): boolean {
  return raw.trim() !== "" && parseMoney(raw) !== null;
}

/** The figures that go into the weekly test, all a week. */
export type Breakdown = {
  gross: number;
  tax: number;
  ni: number;
  /** Half of your own pension contributions. */
  pensionHalf: number;
  expenses: number;
  /** Care costs actually allowed (capped at half of net earnings). */
  care: number;
  /** Care costs entered but over the cap. */
  careCapped: boolean;
  /** Earnings counted against the limit. */
  counted: number;
  /** True if tax and NI were estimated rather than taken from the payslip. */
  estimated: boolean;
};

type EarnArgs = {
  /** Gross a week. */
  gross: number;
  /** Own pension contributions a week. */
  pension: number;
  expenses: number;
  care: number;
  /** Payslip tax and NI a week, or null to estimate. */
  tax: number | null;
  ni: number | null;
  /** Self-employed: Class 4 at 6% instead of Class 1 at 8%. */
  self: boolean;
};

/** The weekly test: gross, less tax, NI, half the pension, expenses, then care costs up to half of what's left. */
export function countEarnings(a: EarnArgs): Breakdown {
  const over = Math.max(0, a.gross - THRESHOLD_WEEK);
  const estimated = a.tax === null || a.ni === null;
  const tax = a.tax ?? over * 0.2;
  const ni = a.ni ?? over * (a.self ? 0.06 : 0.08);
  const pensionHalf = a.pension / 2;
  const net = Math.max(0, a.gross - tax - ni - pensionHalf - a.expenses);
  const careCap = net / 2;
  const care = Math.min(a.care, careCap);
  return {
    gross: a.gross,
    tax,
    ni,
    pensionHalf,
    expenses: a.expenses,
    care,
    careCapped: a.care > careCap + 0.005,
    counted: Math.max(0, net - care),
    estimated,
  };
}

export type Verdict =
  | "noqual"
  | "waiting"
  | "hours"
  | "student"
  | "overlap"
  | "under"
  | "tight"
  | "over"
  | "wellover";

export type CarersRead = {
  verdict: Verdict;
  where: Exclude<Where, ""> | "ew";
  work: Exclude<Work, "">;
  freq: Exclude<Freq, ""> | "weekly";
  weeksPerPeriod: number;
  breakdown: Breakdown | null;
  /** Counted earnings a week (0 if not working). */
  counted: number;
  /** Limit minus counted; negative when over. */
  headroom: number;
  /** More gross pay you could take in one pay period and stay under (employed only). */
  grossHeadroomPeriod: number | null;
  /** Hours that headroom buys at your rate, a week. */
  headroomHours: number | null;
  /** Ways back under, a week. */
  extraPension: number | null;
  sacrifice: number | null;
  fewerHours: number | null;
  /** Gross a week at which you'd be as well off without Carer's Allowance as at the limit with it. */
  breakEvenGross: number | null;
  /** How much less you keep a week than at the limit with the allowance (when over). */
  worseBy: number | null;
  /** True if the pension route is realistic (no more than a fifth of pay). */
  pensionRealistic: boolean;
  /** Gross a week that just fits under the limit. */
  limitGross: number | null;
  /** The biggest pay period, tested on its own. */
  highestCounted: number | null;
  highestCost: number | null;
  /** Headroom against the April 2027 limit, if pay doesn't change. */
  nextHeadroom: number;
  uc: boolean;
  statePension: boolean;
  caredMeansTested: Unsure;
  overpaid: boolean;
  varies: boolean;
  hours: Hours;
  pensionType: PensionType;
};

export function carersReady(inp: CarersInputs): boolean {
  if (!inp.hours || !inp.qualifying) return false;
  if (inp.hours !== "35" || inp.qualifying === "no") return true;
  if (!inp.work) return false;
  if (inp.work === "none") return true;
  if (inp.work === "self") return given(inp.profit);
  return Boolean(inp.freq) && given(inp.gross);
}

/** Smallest x in [0, hi] with f(x) true, for f monotone false→true. */
function solve(f: (x: number) => boolean, hi: number): number | null {
  if (!f(hi)) return null;
  if (f(0)) return 0;
  let lo = 0;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid)) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** Largest x in [0, hi] with f(x) true, for f monotone true→false. */
function solveMax(f: (x: number) => boolean, hi: number): number {
  if (f(hi)) return hi;
  if (!f(0)) return 0;
  let lo = 0;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function readCarers(inp: CarersInputs): CarersRead | null {
  if (!carersReady(inp)) return null;
  const where = inp.where || "ew";
  const work = inp.work || "none";
  const freq = inp.freq || "weekly";
  const w = WEEKS[freq];
  const self = work === "self";
  const hourly = given(inp.hourly) && amt(inp.hourly) > 0 ? amt(inp.hourly) : null;

  let args: EarnArgs | null = null;
  if (work === "employed") {
    const normal = inp.pensionType !== "sacrifice";
    args = {
      gross: amt(inp.gross) / w,
      pension: normal ? amt(inp.pension) / w : 0,
      expenses: amt(inp.expenses) / w,
      care: amt(inp.care),
      tax: given(inp.tax) || given(inp.ni) ? amt(inp.tax) / w : null,
      ni: given(inp.tax) || given(inp.ni) ? amt(inp.ni) / w : null,
      self: false,
    };
  } else if (self) {
    args = {
      gross: amt(inp.profit) / 52,
      pension: amt(inp.selfPension) / 52,
      expenses: 0,
      care: amt(inp.care),
      tax: null,
      ni: null,
      self: true,
    };
  }
  // With payslip tax given, keep the payslip's tax in proportion when testing other pay.
  const at = (gross: number, extra: Partial<EarnArgs> = {}): Breakdown => {
    if (!args) return countEarnings({ gross: 0, pension: 0, expenses: 0, care: 0, tax: 0, ni: 0, self });
    const scale = args.gross > 0 ? gross / args.gross : 0;
    return countEarnings({
      ...args,
      gross,
      tax: args.tax === null ? null : args.tax * scale,
      ni: args.ni === null ? null : args.ni * scale,
      ...extra,
    });
  };

  const breakdown = args ? at(args.gross) : null;
  const counted = breakdown ? breakdown.counted : 0;
  const headroom = LIMIT - counted;

  let verdict: Verdict;
  if (inp.hours !== "35") verdict = "hours";
  else if (inp.qualifying === "no") verdict = "noqual";
  else if (inp.student === "yes" && where !== "scotland") verdict = "student";
  else if (headroom < 0) verdict = counted > LIMIT + RATE ? "wellover" : "over";
  else if (inp.statePension === "yes") verdict = "overlap";
  else if (inp.qualifying === "waiting") verdict = "waiting";
  else verdict = headroom < TIGHT && work !== "none" ? "tight" : "under";

  let grossHeadroomPeriod: number | null = null;
  let headroomHours: number | null = null;
  let extraPension: number | null = null;
  let sacrifice: number | null = null;
  let fewerHours: number | null = null;
  let breakEvenGross: number | null = null;
  let worseBy: number | null = null;
  let pensionRealistic = false;
  let limitGross: number | null = null;
  let highestCounted: number | null = null;
  let highestCost: number | null = null;

  if (args && breakdown) {
    const g = args.gross;
    const fits = (gross: number) => at(gross).counted <= LIMIT + 1e-9;
    limitGross = solveMax(fits, Math.max(g, 2000));
    if (headroom >= 0 && !self) {
      grossHeadroomPeriod = Math.max(0, (limitGross - g) * w);
      headroomHours = hourly ? (limitGross - g) / hourly : null;
    }
    if (headroom < 0) {
      // Pay more into a pension (half counts), or sacrifice salary (all counts, and it cuts tax and NI too).
      if (!self) {
        extraPension = solve((c) => at(g, { pension: args!.pension + c }).counted <= LIMIT + 1e-9, g * 2 + 1);
        sacrifice = solve((s) => fits(g - s), g);
        fewerHours = sacrifice !== null && hourly ? sacrifice / hourly : null;
      } else {
        extraPension = solve((c) => at(g, { pension: args!.pension + c }).counted <= LIMIT + 1e-9, g * 2 + 1);
      }
      // What you keep from pay (before the test's half-pension rule): gross less tax, NI, pension, expenses.
      const keep = (gross: number) => {
        const b = at(gross);
        return gross - b.tax - b.ni - args!.pension - args!.expenses;
      };
      const target = keep(limitGross) + RATE;
      breakEvenGross = solve((x) => keep(x) >= target, Math.max(g * 3, 3000));
      worseBy = Math.max(0, target - keep(g));
      pensionRealistic = extraPension !== null && extraPension <= g * 0.2;
    }
    if (!self && inp.varies === "yes" && given(inp.highest)) {
      const hg = amt(inp.highest) / w;
      highestCounted = at(hg).counted;
      highestCost = highestCounted > LIMIT ? RATE * w : 0;
    }
  }

  return {
    verdict,
    where,
    work,
    freq,
    weeksPerPeriod: w,
    breakdown,
    counted,
    headroom,
    grossHeadroomPeriod,
    headroomHours,
    extraPension,
    sacrifice,
    fewerHours,
    breakEvenGross,
    worseBy,
    pensionRealistic,
    limitGross,
    highestCounted,
    highestCost,
    nextHeadroom: NEXT_LIMIT - counted,
    uc: inp.uc === "yes",
    statePension: inp.statePension === "yes",
    caredMeansTested: inp.caredMeansTested,
    overpaid: inp.overpaid === "yes",
    varies: inp.varies === "yes",
    hours: inp.hours,
    pensionType: inp.pensionType,
  };
}

function benefitName(read: CarersRead): string {
  return read.where === "scotland" ? "Carer Support Payment" : "Carer's Allowance";
}

function per(read: CarersRead): string {
  return PERIOD_NAME[read.freq];
}

export function carersHeadline(read: CarersRead): string {
  const name = benefitName(read);
  switch (read.verdict) {
    case "hours":
      return read.hours === "20"
        ? `Not ${name}, but you can protect your State Pension.`
        : `${name} needs 35 hours of care a week.`;
    case "noqual":
      return `Not yet: ${name} needs the person you care for to get a disability benefit.`;
    case "student":
      return `${name} isn't paid in full-time education.`;
    case "waiting":
      return `Claim as soon as their benefit is awarded. Your earnings fit.`;
    case "overlap":
      return `${name} won't be paid on top of your State Pension, but claim anyway.`;
    case "under":
      return read.work === "none"
        ? `You can get ${pounds2(RATE)} a week. Claim it.`
        : `You're under the limit by ${pounds2(read.headroom)} a week.`;
    case "tight":
      return `Under, but only by ${pounds2(read.headroom)} a week.`;
    case "over":
      return `Over by ${pounds2(-read.headroom)} a week, and that costs all ${pounds2(RATE)}.`;
    case "wellover":
      return `Over the limit, and earning more is worth more than ${name}.`;
  }
}

export function carersBody(read: CarersRead): string {
  const name = benefitName(read);
  const parts: string[] = [];
  const b = read.breakdown;
  switch (read.verdict) {
    case "hours":
      if (read.hours === "20")
        parts.push(
          `${name} and the Universal Credit carer element both need 35 hours a week. Caring for 20 hours or more a week (adding up care for more than one person) can get you Carer's Credit instead: no money, but a National Insurance credit for each week, so the caring years count towards your State Pension. Claim it with form CC1.`,
        );
      else
        parts.push(
          `${name} needs at least 35 hours of care a week for one person. Count everything: help with washing, meals, medicines, appointments, nights, keeping an eye on them, travel to them. If it does come to 35, it counts even if you also work.`,
        );
      break;
    case "noqual":
      parts.push(
        `The person you care for needs to get a qualifying disability benefit: Personal Independence Payment (the daily living part, either rate), Attendance Allowance, Disability Living Allowance (the middle or highest care rate), Adult or Child Disability Payment in Scotland, Armed Forces Independence Payment, or Constant Attendance Allowance.`,
      );
      parts.push(
        `If they don't get one yet, help them claim it first. When it's awarded, claim ${name} within three months and it can be backdated to the day their benefit started. If they were refused, a challenge often succeeds.`,
      );
      break;
    case "student":
      parts.push(
        `${name} isn't paid while you're in full-time education (21 hours or more a week of supervised study). Part-time study is fine. You may still get Carer's Credit for the National Insurance, and in Scotland Carer Support Payment can be paid to some students. Claim when the course ends.`,
      );
      break;
    case "waiting":
      parts.push(
        `${name} starts once the person you care for has a qualifying benefit. Claim within three months of their award letter and it's backdated to the day their benefit started, so don't wait for the first payment.`,
      );
      break;
    case "overlap":
      parts.push(
        `Carer's Allowance overlaps with your State Pension: if your pension is ${pounds2(RATE)} a week or more, nothing extra is paid. But claiming gives you "underlying entitlement", which adds a carer amount to Pension Credit and Housing Benefit, and can make you eligible for Pension Credit when you weren't. If you get, or might get, either, claim.`,
      );
      break;
    case "under":
      if (read.work === "none")
        parts.push(
          `With no earnings, the earnings limit doesn't touch you. ${name} is ${pounds2(RATE)} a week (about ${money(RATE * 52)} a year), it comes with a National Insurance credit for every week, and it can be backdated up to three months, so every week you wait past that is ${pounds2(RATE)} lost.`,
        );
      else
        parts.push(
          `After the deductions, your earnings count as ${pounds2(read.counted)} a week against a limit of ${pounds2(LIMIT)}. ${read.grossHeadroomPeriod !== null ? `You could take about ${money(read.grossHeadroomPeriod)} more gross pay in a ${per(read)} and stay under${read.headroomHours !== null ? ` (about ${read.headroomHours.toFixed(1)} more hours a week at your rate)` : ""}.` : ""}`,
        );
      break;
    case "tight":
      parts.push(
        `After the deductions, your earnings count as ${pounds2(read.counted)} a week against ${pounds2(LIMIT)}. ${read.grossHeadroomPeriod !== null ? `About ${money(read.grossHeadroomPeriod)} more gross pay in one ${per(read)}, a few extra hours, a bonus or a pay rise, would put you over, and a pound over loses the whole ${pounds2(RATE)} for ${read.weeksPerPeriod > 1 ? "every week that pay covers" : "that week"}.` : "A small rise in profit would put you over, and a pound over loses the whole payment."}`,
      );
      break;
    case "over": {
      const over = -read.headroom;
      parts.push(
        `After the deductions, your earnings count as ${pounds2(read.counted)} a week, ${pounds2(over)} over the ${pounds2(LIMIT)} limit. There's no taper: over by a penny, you lose the whole ${pounds2(RATE)} for ${read.work === "self" ? "every week (self-employed earnings are averaged, usually over a year)" : read.weeksPerPeriod > 1 ? `each week that pay covers (about ${money(RATE * read.weeksPerPeriod)} a ${per(read)})` : "that week"}.`,
      );
      if (read.breakEvenGross !== null && read.limitGross !== null && b && read.worseBy !== null)
        parts.push(
          `On ${money(b.gross)} a week${read.work === "self" ? " of profit" : ""} you keep about ${money(read.worseBy)} a week less than you would on about ${money(read.limitGross)} with ${name}. You'd need about ${money(read.breakEvenGross)} a week before the extra pay is worth more than the allowance.`,
        );
      const ways: string[] = [];
      if (read.extraPension !== null && read.pensionRealistic) ways.push(`paying about ${pounds2(read.extraPension)} a week more into a pension (only half counts)`);
      if (read.sacrifice !== null && read.pensionType === "sacrifice") ways.push(`a salary sacrifice of about ${pounds2(read.sacrifice)} a week`);
      if (read.fewerHours !== null) ways.push(`about ${read.fewerHours.toFixed(1)} fewer hours a week`);
      if (ways.length) parts.push(`Ways back under: ${ways.join(", or ")}. Care costs you pay while at work and work expenses also count, if you have them.`);
      else parts.push("Care costs you pay while at work and work expenses also count, if you have them.");
      break;
    }
    case "wellover":
      parts.push(
        `Your earnings count as ${pounds2(read.counted)} a week, more than ${pounds2(LIMIT + RATE)}, so you're better off on this pay than cutting back to get ${name}. You can still get Carer's Credit, which protects your State Pension for years your pay doesn't.`,
      );
      break;
  }
  if (read.uc && (read.verdict === "over" || read.verdict === "tight"))
    parts.push(
      `You get Universal Credit, which changes the sum: ${name} comes off your UC pound for pound, so a week you lose it is mostly made up by more UC, as long as your UC award was more than the allowance. Report the change anyway, so neither is overpaid.`,
    );
  if (read.statePension && read.verdict !== "overlap" && read.verdict !== "hours" && read.verdict !== "noqual")
    parts.push(`You get a State Pension, so ${name} itself may not be paid; claim for the underlying entitlement if you get, or might get, Pension Credit or Housing Benefit.`);
  return parts.join(" ");
}

export type Tile = { label: string; value: string; note: string };

export function tilesOf(read: CarersRead): Tile[] {
  if (!["under", "tight", "over", "wellover", "waiting"].includes(read.verdict)) return [];
  const out: Tile[] = [
    { label: "Counted earnings", value: pounds2(read.counted), note: `a week, against ${pounds2(LIMIT)}` },
    read.headroom >= 0
      ? { label: "Headroom", value: pounds2(read.headroom), note: "a week before you'd lose it" }
      : { label: "Over by", value: pounds2(-read.headroom), note: `a week, costing ${pounds2(RATE)}` },
    { label: "From April 2027", value: `about ${money(NEXT_LIMIT)}`, note: read.nextHeadroom >= 0 ? `limit; headroom about ${money(read.nextHeadroom)} on today's pay` : `limit; still over on today's pay` },
  ];
  return out;
}

export type Line = { label: string; value: string; minus: boolean };

export function breakdownLines(read: CarersRead): Line[] {
  const b = read.breakdown;
  if (!b) return [];
  const out: Line[] = [{ label: read.work === "self" ? "Profit, a week" : "Gross pay, a week", value: pounds2(b.gross), minus: false }];
  out.push({ label: `Income tax${b.estimated ? " (estimated)" : ""}`, value: pounds2(b.tax), minus: true });
  out.push({ label: `National Insurance${b.estimated ? " (estimated)" : ""}`, value: pounds2(b.ni), minus: true });
  if (b.pensionHalf > 0) out.push({ label: "Half your pension contributions", value: pounds2(b.pensionHalf), minus: true });
  if (b.expenses > 0) out.push({ label: "Work expenses", value: pounds2(b.expenses), minus: true });
  if (b.care > 0) out.push({ label: `Care costs while you work${b.careCapped ? " (capped at half)" : ""}`, value: pounds2(b.care), minus: true });
  return out;
}

export function checksOf(read: CarersRead): string[] {
  const name = benefitName(read);
  const out: string[] = [];
  if (read.caredMeansTested === "yes" || read.caredMeansTested === "unsure")
    out.push(
      `Before you claim: if the person you care for gets a severe disability premium or addition (in Pension Credit, Housing Benefit, income-related ESA or JSA, or Income Support), they usually lose it once someone is paid ${name} for them, and it can be worth about as much as the allowance. Ask their benefit office or a welfare rights adviser first. Universal Credit has no such premium.`,
    );
  if (read.work !== "none" && read.verdict !== "hours" && read.verdict !== "noqual")
    out.push(
      `Don't opt out of a workplace pension to take home more: half of what you pay in comes off your counted earnings, so opting out can push you over.`,
    );
  if (read.varies || read.freq === "monthly")
    out.push(
      `Watch the one-offs: overtime, a bonus, holiday pay paid out, back pay. Each is tested in the pay period it lands in. If your pay goes up and down, ask for it to be averaged over your normal cycle.`,
    );
  if (read.breakdown?.estimated)
    out.push("Tax and National Insurance here are estimates for a 1257L tax code and no other income. Use the figures on your payslip if you have them.");
  out.push(`Report changes to the Carer's Allowance Unit straight away: a new job, more hours, a pay rise, a break in caring of more than four weeks in 26 (12 if one of you is in hospital). An overpayment can go back years and has to be repaid.`);
  out.push(`${name} counts as taxable income, but there's no tax deducted from it. It comes with a National Insurance credit for every week it's paid.`);
  if (read.where === "scotland")
    out.push("In Scotland, Carer Support Payment from Social Security Scotland has replaced Carer's Allowance: same weekly amount and earnings limit, and some students can get it. Claim through mygov.scot.");
  if (read.where === "ni") out.push("In Northern Ireland, Carer's Allowance is run by the Department for Communities, with the same amount and earnings limit.");
  out.push("The 28 October 2026 Budget said the cliff edge will go once the systems are ready. There's no date, so it applies today.");
  return out;
}

export type DateLine = { on: string; title: string; body: string };

export function remindersOf(read: CarersRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  const name = benefitName(read);
  if (read.verdict === "under" || read.verdict === "tight" || read.verdict === "waiting" || read.verdict === "overlap") {
    out.push({
      on: today,
      title: `Claim ${name}`,
      body: `It can be backdated up to three months (or to the start of their disability benefit, if you claim within three months of that award). Each week past that is ${pounds2(RATE)} lost.`,
    });
  }
  if (read.work !== "none" && ["under", "tight", "over"].includes(read.verdict)) {
    out.push({
      on: "2026-12-01",
      title: "Check December pay against the Carer's Allowance limit",
      body: `Christmas overtime and holiday pay land now. Counted earnings over ${pounds2(LIMIT)} a week lose the whole week.`,
    });
    out.push({
      on: "2027-04-06",
      title: "Carer's Allowance: new limit and rate",
      body: `The earnings limit should rise to about ${pounds2(NEXT_LIMIT)} and the rate to about ${pounds2(NEXT_RATE)}. If your pay rises in April too, check it again.`,
    });
  }
  return out.filter((d) => d.on >= today).sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(read: CarersRead): Message[] {
  const out: Message[] = [];
  const name = benefitName(read);
  const b = read.breakdown;
  if (b && ["under", "tight", "over", "wellover"].includes(read.verdict)) {
    const lines = breakdownLines(read)
      .map((l) => `- ${l.label.replace(" (estimated)", "").replace("Half your", "Half my")}: ${l.minus ? "less " : ""}${l.value}`)
      .join("\n");
    const monthly = read.work === "employed" && read.freq === "monthly" ? `\n(I'm paid monthly, so this is my monthly pay × 12 ÷ 52.)` : "";
    out.push({
      id: "report",
      title: "To the Carer's Allowance Unit: my earnings",
      note: "Report online at gov.uk (Carer's Allowance: report a change), or by post with copies of your payslips. Keep a copy. Ask them to confirm how they've worked it out.",
      text: `Hello,

I get ${name}. My National Insurance number is [number]. I'm writing to tell you about my earnings${read.work === "self" ? " from self-employment" : ` from [employer], paid ${read.freq === "fourweekly" ? "every four weeks" : read.freq}`}, from [date].

As I understand the rules, my earnings a week are:
${lines}
- Counted against the limit: ${pounds2(read.counted)}${monthly}

${read.work === "self" ? "I enclose my latest accounts." : "I enclose my payslips."}${b.pensionHalf > 0 ? " Please deduct half of my pension contributions, as the rules allow." : ""}${b.care > 0 ? " Please also deduct the care costs I pay while I'm at work; I enclose receipts." : ""}${read.varies ? " My pay varies, so please average it over my normal cycle of work rather than taking one pay period on its own." : ""}

Please confirm in writing how you have calculated my earnings.

Thank you,
[Your name]`,
    });
  }
  if (read.verdict === "over" && read.work === "employed" && read.extraPension !== null && read.pensionRealistic) {
    const perPeriod = (x: number) => money(Math.ceil(x * read.weeksPerPeriod));
    out.push({
      id: "payroll",
      title: "To payroll or HR: a bigger pension contribution",
      note: `Only half of an ordinary pension contribution counts, so you'd need about ${pounds2(read.extraPension)} a week more to get back under. Ask if they offer salary sacrifice: all of it counts, but it can't take your pay below the minimum wage. Do this before the next pay run, not after.`,
      text: `Hello,

Please can you increase my pension contribution by ${perPeriod(read.extraPension)} a ${per(read)}, starting from my next pay. If you offer salary sacrifice for pension contributions, please let me know how that would work instead.

I'm asking because I get Carer's Allowance, which has a weekly earnings limit, so it matters that the change is in place before my next payslip.

Thank you,
[Your name]`,
    });
  }
  if (read.overpaid) {
    out.push({
      id: "overpaid",
      title: "To the DWP: about the overpayment",
      note: "You have one month from the date on the decision letter to ask for a mandatory reconsideration (up to 13 months with a good reason). Check every week they've counted: were half your pension contributions and any care costs deducted, and was pay that varies averaged? The DWP began reviewing about 200,000 cases in April 2026 after finding its averaging guidance had been applied wrongly.",
      text: `Hello,

My National Insurance number is [number]. I've had a letter dated [date] saying I was overpaid ${name} of £[amount] for [period].

Please send me the week-by-week calculation of my earnings for that period, showing what was deducted for tax, National Insurance, half of my pension contributions, care costs and expenses, and whether my earnings were averaged.

I'm asking for a mandatory reconsideration of the decision. [Say why: for example, my pension contributions weren't deducted / my earnings vary and should have been averaged / I told you about the change on (date).] Please also tell me whether my case is part of the review of earnings averaging cases, and put recovery on hold until this is decided.

Thank you,
[Your name]`,
    });
  }
  return out;
}

export function keepList(read: CarersRead): string[] {
  const out = ["Your National Insurance number and the National Insurance number of the person you care for, and their benefit award letter."];
  if (read.work === "employed") out.push("Every payslip while you get the allowance, and your pension statements. They're the proof if an overpayment letter ever comes.");
  if (read.work === "self") out.push("Your accounts and tax returns, and records of pension contributions.");
  out.push("Receipts for care you pay for while you work, and for work expenses.");
  out.push("A note of every change you report: the date, how, and a reference. Screenshot online reports.");
  return out;
}

export function carersRule(read: CarersRead): string {
  if (read.verdict === "over" || read.verdict === "tight")
    return `I check my counted earnings, not my gross pay, against ${pounds2(LIMIT)} a week before I agree extra hours, and I report every change the week it happens.`;
  if (read.verdict === "wellover") return "I keep my State Pension protected with Carer's Credit, and recheck if my hours drop.";
  if (read.verdict === "hours" || read.verdict === "noqual" || read.verdict === "student")
    return "I claim what fits now (Carer's Credit, their disability benefit) and claim Carer's Allowance within three months of becoming eligible.";
  return "I claim now, keep every payslip, and report every change in pay or caring the week it happens.";
}

export function carersSummary(read: CarersRead, today = todayISO()): string {
  const lines = [`Carer's Allowance: ${carersHeadline(read)}`, "", carersBody(read), ""];
  const bl = breakdownLines(read);
  if (bl.length) {
    lines.push("How my earnings are counted, a week:");
    for (const l of bl) lines.push(`- ${l.label}: ${l.minus ? "less " : ""}${l.value}`);
    lines.push(`- Counted: ${pounds2(read.counted)} (limit ${pounds2(LIMIT)})`, "");
  }
  const checks = checksOf(read);
  lines.push("Checks:");
  for (const c of checks) lines.push(`- ${c}`);
  lines.push("");
  const rem = remindersOf(read, today);
  if (rem.length) {
    lines.push("Dates:");
    for (const d of rem) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
    lines.push("");
  }
  lines.push(`Rule: ${carersRule(read)}`, "", `2026/27 figures: ${pounds2(RATE)} a week, limit ${pounds2(LIMIT)}. From https://bettereveryday.adder.dev/carers. Not advice.`);
  return lines.join("\n");
}

const WHERES: Exclude<Where, "">[] = ["ew", "scotland", "ni"];
const HOURS: Exclude<Hours, "">[] = ["35", "20", "under"];
const QUALS: Exclude<Qualifying, "">[] = ["yes", "waiting", "no"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];
const UNSURES: Exclude<Unsure, "">[] = ["yes", "no", "unsure"];
const WORKS: Exclude<Work, "">[] = ["none", "employed", "self"];
const FREQS: Exclude<Freq, "">[] = ["weekly", "fortnightly", "fourweekly", "monthly"];
const PTYPES: Exclude<PensionType, "">[] = ["normal", "sacrifice"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 20): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function parseCarersInputs(raw: unknown): CarersInputs {
  if (!raw || typeof raw !== "object") return BLANK_CARERS;
  const v = raw as Record<string, unknown>;
  return {
    where: oneOf(v.where, WHERES),
    hours: oneOf(v.hours, HOURS),
    qualifying: oneOf(v.qualifying, QUALS),
    student: oneOf(v.student, YESNOS),
    statePension: oneOf(v.statePension, YESNOS),
    uc: oneOf(v.uc, YESNOS),
    caredMeansTested: oneOf(v.caredMeansTested, UNSURES),
    work: oneOf(v.work, WORKS),
    freq: oneOf(v.freq, FREQS),
    gross: str(v.gross),
    tax: str(v.tax),
    ni: str(v.ni),
    pension: str(v.pension),
    pensionType: oneOf(v.pensionType, PTYPES),
    expenses: str(v.expenses),
    varies: oneOf(v.varies, YESNOS),
    highest: str(v.highest),
    hourly: str(v.hourly),
    profit: str(v.profit),
    selfPension: str(v.selfPension),
    care: str(v.care),
    overpaid: oneOf(v.overpaid, YESNOS),
  };
}

/**
 * The worked example: Dev works 16 hours a week at a supermarket at £12.71 an
 * hour, paid monthly (£881.23), with 5% of qualifying earnings going into the
 * workplace pension (£18.06 a month), and cares for his mum, who gets
 * Attendance Allowance. December overtime takes one month to £1,100, and
 * he's been offered 20 hours from January.
 */
export function carersExample(): CarersInputs {
  return {
    ...BLANK_CARERS,
    where: "ew",
    hours: "35",
    qualifying: "yes",
    student: "no",
    statePension: "no",
    uc: "no",
    caredMeansTested: "no",
    work: "employed",
    freq: "monthly",
    gross: "£881.23",
    pension: "£18.06",
    pensionType: "normal",
    varies: "yes",
    highest: "£1,100",
    hourly: "£12.71",
  };
}

/** The same worker on the 20 hours he's been offered (5% of the larger qualifying earnings). */
export function carersExampleOffer(): CarersInputs {
  return { ...carersExample(), gross: "£1,101.53", pension: "£29.08", varies: "no", highest: "" };
}
