/**
 * The read behind "Pension Credit: Could You Get It, and What Does It Unlock?"
 * (/pensioncredit).
 *
 * Pension Credit tops up a pensioner's weekly income to a minimum, and it's
 * one of the most under-claimed benefits in the UK: the DWP's latest take-up
 * estimate (year ending March 2025) puts about 820,000 entitled households
 * (range 730,000 to 900,000) as not claiming, a take-up of about 62%. Up to
 * £2.5 billion a year goes unclaimed. In the research, about two-thirds of
 * people who don't claim give a reason that comes down to assuming they
 * wouldn't qualify: they own their home, they have some savings, they have a
 * small private pension. None of those rules you out.
 *
 * Two things make it worth more than the weekly sum. First, it's a gateway:
 * any award, even a few pounds of Savings Credit, brings a free TV licence at
 * 75, the Warm Home Discount and Cold Weather Payments, and the Guarantee
 * Credit part brings the maximum Housing Benefit and (in England and Wales)
 * usually the maximum Council Tax Reduction, plus free NHS dental treatment
 * and glasses vouchers. Second, Attendance Allowance isn't counted as income
 * and, for someone who lives alone with nobody paid to care for them, adds a
 * severe disability amount of £86.05 a week to the minimum. So claiming
 * Attendance Allowance can turn "not eligible" into thousands a year.
 *
 * And it can only be backdated three months, so every week past that is a
 * week's money lost for good.
 *
 * The figures (gov.uk and assets.publishing.service.gov.uk were DNS-blocked
 * from the sandbox; these are from search summaries where several agreed, see
 * docs/2026-11-23-session-notes.md):
 *
 *   - 2026/27 standard minimum guarantee £238.00 single, £363.25 couple
 *     (up 4.8%; the DWP press release and Age UK agree).
 *   - Severe disability addition £86.05 (one), £172.10 (couple, both qualify);
 *     carer addition £48.15 (Independent Age, CPAG).
 *   - Savings Credit: threshold £208.07 single, £329.75 couple; maximum £17.96
 *     and £20.10, which is exactly 60% of (minimum guarantee − threshold), so
 *     the figures check each other. Only for people who reached State Pension
 *     age before 6 April 2016.
 *   - Capital: first £10,000 ignored, then £1 a week of income for every £500
 *     or part of £500. No upper limit. The home you live in isn't counted.
 *   - Attendance Allowance 2026/27 £76.70 / £114.60 (DWP table via
 *     FedRateCalc). New State Pension £241.30, basic £184.90 (4.8% on £176.45).
 *   - TV licence £180 from 1 April 2026, free at 75 or over with Pension
 *     Credit (apply; it isn't automatic). Warm Home Discount £150 for winter
 *     2026/27 for Guarantee or Savings Credit, usually automatic. Cold Weather
 *     Payment £25 for each 7-day spell at or below 0°C, November to March
 *     (England and Wales; Scotland has the Winter Heating Payment).
 *   - Winter Fuel Payment is no longer gated by Pension Credit: since winter
 *     2025/26 everyone over State Pension age gets it, and it's taken back
 *     through tax over £35,000 of income unless you get Pension Credit.
 *   - Mixed-age couples (one partner under State Pension age) have claimed
 *     Universal Credit instead since 15 May 2019, unless already on Pension
 *     Credit before then.
 *   - From memory, widely stated, not verified on gov.uk: earnings disregard
 *     £5 a week single, £10 couple (£20 for carers and some disabled people);
 *     Savings Credit is reduced by 40p for every £1 of income above the
 *     minimum guarantee; Savings Credit under 10p a week isn't paid; you can
 *     claim from four months before State Pension age; Support for Mortgage
 *     Interest is a loan with no waiting period for Pension Credit; Housing
 *     Benefit and Council Tax Reduction don't count as income. **Verify.**
 *
 * The read is an estimate of the weekly award from what's entered. It doesn't
 * model children, housing costs beyond ground rent and service charges, the
 * £20 disregard, or the qualifying-income exclusions in Savings Credit. Not
 * advice; the DWP decides. Pure data and functions, no React.
 */

import { formatMoney, parseMoney } from "./worth";
import { addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { isISODate, letterDate, todayISO };

export type YesNo = "" | "yes" | "no";
export type Where = "" | "ew" | "scotland" | "ni";
export type Whose = "" | "mine" | "other";
export type Household = "" | "single" | "couple" | "mixed";
export type Disability = "" | "none" | "one" | "both" | "might";
export type Carer = "" | "none" | "one" | "both";
export type Home = "" | "owned" | "mortgage" | "rent" | "family";

export type PcInputs = {
  whose: Whose;
  /** What you call them, for the messages. */
  name: string;
  where: Where;
  household: Household;
  /** Reached State Pension age before 6 April 2016 (Savings Credit). */
  before2016: YesNo;
  /** Anyone in the household is 75 or over (TV licence). */
  over75: YesNo;
  /** State Pension a week, both added together for a couple. */
  statePension: string;
  /** Workplace and private pensions, a month, before tax. */
  otherPension: string;
  /** Earnings from work, a week, after tax. */
  earnings: string;
  /** Other income that counts (Carer's Allowance, other benefits), a week. */
  otherIncome: string;
  /** Savings and investments, not the home. */
  savings: string;
  /** Attendance Allowance, PIP daily living or DLA care (middle or highest). */
  disability: Disability;
  /** Another adult (not a partner) lives with them. */
  othersLiveIn: YesNo;
  /** Someone is paid Carer's Allowance (or the UC carer element) for looking after them. */
  carerPaid: YesNo;
  /** They themselves are entitled to Carer's Allowance for looking after someone. */
  youCare: Carer;
  home: Home;
  /** Ground rent and service charges, a year (leasehold). */
  serviceCharges: string;
  /** Rent a week (for Housing Benefit). */
  rent: string;
  /** Council tax bill a year. */
  councilTax: string;
};

export const BLANK_PC: PcInputs = {
  whose: "",
  name: "",
  where: "",
  household: "",
  before2016: "",
  over75: "",
  statePension: "",
  otherPension: "",
  earnings: "",
  otherIncome: "",
  savings: "",
  disability: "",
  othersLiveIn: "",
  carerPaid: "",
  youCare: "",
  home: "",
  serviceCharges: "",
  rent: "",
  councilTax: "",
};

/** 2026/27 rates, a week. */
export const MG = { single: 238.0, couple: 363.25 };
export const SC_THRESHOLD = { single: 208.07, couple: 329.75 };
export const SC_MAX = { single: 17.96, couple: 20.1 };
export const SDA = 86.05;
export const CARER_ADD = 48.15;
export const DISREGARD = { single: 5, couple: 10 };
export const CAPITAL_FREE = 10000;
export const AA_LOWER = 76.7;
export const AA_HIGHER = 114.6;
export const NEW_SP = 241.3;
export const BASIC_SP = 184.9;
export const TV_LICENCE = 180;
export const WHD = 150;
export const CWP = 25;
/** Within this many pounds a week of an award counts as "close". */
export const CLOSE = 25;

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

export function pounds2(n: number): string {
  return `£${n.toFixed(2)}`;
}

function amt(raw: string): number {
  return Math.max(0, parseMoney(raw) ?? 0);
}

function given(raw: string): boolean {
  return raw.trim() !== "" && parseMoney(raw) !== null;
}

/** £1 a week for every £500, or part of £500, over £10,000. */
export function deemedIncome(capital: number): number {
  if (capital <= CAPITAL_FREE) return 0;
  return Math.ceil((capital - CAPITAL_FREE) / 500 - 1e-9);
}

export type Calc = {
  /** The minimum the DWP says you need, a week, with additions. */
  minimum: number;
  /** Severe disability and carer additions included in it. */
  sda: number;
  carer: number;
  housing: number;
  /** Income that counts, a week. */
  income: number;
  /** Pieces of the income, a week. */
  parts: { label: string; value: number }[];
  guarantee: number;
  savings: number;
  /** Weekly award (0 if under 10p of Savings Credit alone). */
  total: number;
};

type CalcArgs = {
  couple: boolean;
  before2016: boolean;
  sp: number;
  otherPensionWeek: number;
  earningsWeek: number;
  otherIncome: number;
  capital: number;
  disability: Exclude<Disability, "" | "might">;
  othersLiveIn: boolean;
  carerPaid: boolean;
  youCare: Exclude<Carer, "">;
  housingWeek: number;
};

/** The severe disability addition, under the couple rules. */
export function sdaOf(a: Pick<CalcArgs, "couple" | "disability" | "othersLiveIn" | "carerPaid">): number {
  if (a.othersLiveIn || a.disability === "none") return 0;
  if (!a.couple) return a.carerPaid ? 0 : SDA;
  // A couple needs both partners to get a qualifying benefit (or one registered blind).
  if (a.disability !== "both") return 0;
  return a.carerPaid ? SDA : SDA * 2;
}

export function calc(a: CalcArgs): Calc {
  const k = a.couple ? "couple" : "single";
  const sda = sdaOf(a);
  const carer = a.youCare === "both" && a.couple ? CARER_ADD * 2 : a.youCare === "none" ? 0 : CARER_ADD;
  const minimum = MG[k] + sda + carer + a.housingWeek;
  const earned = Math.max(0, a.earningsWeek - DISREGARD[k]);
  const deemed = deemedIncome(a.capital);
  const parts = [
    { label: "State Pension", value: a.sp },
    { label: "Other pensions", value: a.otherPensionWeek },
    { label: `Earnings, less £${DISREGARD[k]}`, value: earned },
    { label: "Other income", value: a.otherIncome },
    { label: `Savings over £10,000, counted as`, value: deemed },
  ].filter((p) => p.value > 0);
  const income = parts.reduce((s, p) => s + p.value, 0);
  const guarantee = Math.max(0, minimum - income);
  let savings = 0;
  if (a.before2016) {
    // 60% of qualifying income above the threshold, up to the maximum, less 40% of income above the minimum.
    const raw = Math.min(SC_MAX[k], 0.6 * Math.max(0, income - SC_THRESHOLD[k]));
    savings = Math.max(0, raw - 0.4 * Math.max(0, income - minimum));
    if (savings < 0.1) savings = 0;
  }
  return {
    minimum,
    sda,
    carer,
    housing: a.housingWeek,
    income,
    parts,
    guarantee,
    savings,
    total: guarantee + savings,
  };
}

export type Verdict = "guarantee" | "savings" | "close" | "aa" | "no" | "mixed";

export type Unlock = { id: string; label: string; value: number | null; note: string };

export type PcRead = {
  verdict: Verdict;
  where: Exclude<Where, "">;
  other: boolean;
  name: string;
  couple: boolean;
  calc: Calc;
  /** The same household if Attendance Allowance were awarded (lower rate), when "might". */
  withAa: Calc | null;
  /** What the award unlocks, a year. */
  unlocks: Unlock[];
  /** Weekly award × 52 plus the counted unlocks. */
  yearValue: number;
  /** The same, with Attendance Allowance itself added, when withAa applies. */
  yearValueWithAa: number | null;
  /** The earliest date a claim made today can reach back to. */
  backdateTo: string;
  /** How far short of an award, a week, when there isn't one. */
  shortBy: number;
  over75: boolean;
  home: Exclude<Home, ""> | "owned";
  savingsGiven: number;
  disability: Disability;
  before2016: boolean;
};

export function pcReady(inp: PcInputs): boolean {
  if (!inp.household) return false;
  if (inp.household === "mixed") return true;
  if (!inp.before2016 || !inp.disability) return false;
  return given(inp.statePension);
}

function argsOf(inp: PcInputs, aa: boolean): CalcArgs {
  const couple = inp.household === "couple";
  const disability: CalcArgs["disability"] =
    inp.disability === "might" ? (aa ? "one" : "none") : inp.disability === "" ? "none" : inp.disability;
  // For a couple "might" means one of them, which doesn't bring the couple addition on its own.
  const housingWeek = inp.home === "owned" || inp.home === "mortgage" ? amt(inp.serviceCharges) / 52 : 0;
  return {
    couple,
    before2016: inp.before2016 === "yes",
    sp: amt(inp.statePension),
    otherPensionWeek: (amt(inp.otherPension) * 12) / 52,
    earningsWeek: amt(inp.earnings),
    otherIncome: amt(inp.otherIncome),
    capital: amt(inp.savings),
    disability,
    othersLiveIn: inp.othersLiveIn === "yes",
    carerPaid: inp.carerPaid === "yes",
    youCare: inp.youCare || "none",
    housingWeek,
  };
}

export function unlocksOf(inp: PcInputs, c: Calc): Unlock[] {
  const where = inp.where || "ew";
  const out: Unlock[] = [];
  if (c.total <= 0) return out;
  const gc = c.guarantee > 0;
  if (inp.over75 === "yes")
    out.push({ id: "tv", label: "Free TV licence", value: TV_LICENCE, note: "At 75 or over. Apply to TV Licensing once the award letter comes; it isn't automatic." });
  if (where !== "ni")
    out.push({ id: "whd", label: "Warm Home Discount", value: WHD, note: "Off the electricity bill in the winter, usually without applying, if the supplier is in the scheme." });
  if (gc && where !== "ni" && given(inp.councilTax) && amt(inp.councilTax) > 0)
    out.push({
      id: "ctr",
      label: "Council Tax Reduction",
      value: amt(inp.councilTax),
      note: "With Guarantee Credit, usually the whole bill (less any adult who lives with them). Apply to the council.",
    });
  if (gc && inp.home === "rent" && given(inp.rent) && amt(inp.rent) > 0)
    out.push({
      id: "hb",
      label: "Housing Benefit",
      value: amt(inp.rent) * 52,
      note: "With Guarantee Credit, up to the eligible rent in full. Claim it with Pension Credit, or from the council.",
    });
  if (gc && !out.some((u) => u.id === "ctr") && where !== "ni")
    out.push({ id: "ctr", label: "Council Tax Reduction", value: null, note: "Usually the whole bill with Guarantee Credit. Add the bill above to count it." });
  if (where !== "scotland")
    out.push({ id: "cwp", label: "Cold Weather Payments", value: null, note: `£${CWP} for each week of freezing weather from November to March, paid automatically.` });
  if (gc) out.push({ id: "nhs", label: "Free NHS dental treatment and glasses vouchers", value: null, note: "And help with travel to hospital. Show the award letter." });
  return out;
}

export function readPc(inp: PcInputs, today = todayISO()): PcRead | null {
  if (!pcReady(inp)) return null;
  const where = inp.where || "ew";
  const other = inp.whose === "other";
  const name = inp.name.trim().slice(0, 30);
  const couple = inp.household === "couple";
  const backdateTo = addMonthsISO(today, -3);
  const empty = calc({ ...argsOf({ ...inp, statePension: "0" }, false), sp: 0 });
  if (inp.household === "mixed") {
    return {
      verdict: "mixed",
      where,
      other,
      name,
      couple: true,
      calc: { ...empty, guarantee: 0, savings: 0, total: 0 },
      withAa: null,
      unlocks: [],
      yearValue: 0,
      yearValueWithAa: null,
      backdateTo,
      shortBy: 0,
      over75: inp.over75 === "yes",
      home: inp.home || "owned",
      savingsGiven: amt(inp.savings),
      disability: inp.disability,
      before2016: inp.before2016 === "yes",
    };
  }
  const c = calc(argsOf(inp, false));
  // Attendance Allowance only adds the severe disability amount when it's for one person living alone, or both of a couple.
  let withAa: Calc | null = null;
  if (inp.disability === "might") {
    const w = calc(argsOf(inp, true));
    if (w.total > c.total + 0.5) withAa = w;
  }
  const unlocks = unlocksOf(inp, c);
  const counted = unlocks.reduce((s, u) => s + (u.value ?? 0), 0);
  const yearValue = c.total * 52 + counted;
  let yearValueWithAa: number | null = null;
  if (withAa) {
    const u2 = unlocksOf(inp, withAa).reduce((s, u) => s + (u.value ?? 0), 0);
    yearValueWithAa = withAa.total * 52 + u2 + AA_LOWER * 52;
  }
  let verdict: Verdict;
  if (c.guarantee > 0) verdict = "guarantee";
  else if (c.savings > 0) verdict = "savings";
  else if (withAa) verdict = "aa";
  else if (c.income - c.minimum <= CLOSE) verdict = "close";
  else verdict = "no";
  return {
    verdict,
    where,
    other,
    name,
    couple,
    calc: c,
    withAa,
    unlocks,
    yearValue,
    yearValueWithAa,
    backdateTo,
    shortBy: Math.max(0, c.income - c.minimum),
    over75: inp.over75 === "yes",
    home: inp.home || "owned",
    savingsGiven: amt(inp.savings),
    disability: inp.disability,
    before2016: inp.before2016 === "yes",
  };
}

/** "you" or their name, for prose. */
function who(read: PcRead): string {
  return read.other ? read.name || "they" : "you";
}

function whoCap(read: PcRead): string {
  const w = who(read);
  return w[0].toUpperCase() + w.slice(1);
}

function they(read: PcRead): { subj: string; poss: string; has: string; gets: string } {
  if (!read.other) return { subj: "you", poss: "your", has: "have", gets: "get" };
  return { subj: "they", poss: "their", has: "have", gets: "get" };
}

export function pcHeadline(read: PcRead): string {
  const w = who(read);
  switch (read.verdict) {
    case "mixed":
      return "Not yet: a couple with one partner under State Pension age claims Universal Credit.";
    case "guarantee":
      return `${whoCap(read)} could get about ${pounds2(read.calc.total)} a week. Claim it.`;
    case "savings":
      return `About ${pounds2(read.calc.total)} a week, and it's the key to more. Claim it.`;
    case "aa":
      return `Not on these figures, but with Attendance Allowance ${w === "you" ? "you" : w} could get about ${pounds2(read.withAa?.total ?? 0)} a week.`;
    case "close":
      return `Close: about ${pounds2(read.shortBy)} a week over. Claim anyway if anything's uncertain.`;
    case "no":
      return `Probably not on these figures.`;
  }
}

export function pcBody(read: PcRead): string {
  const c = read.calc;
  const t = they(read);
  const parts: string[] = [];
  const minimumNote = `The DWP's minimum for ${read.couple ? "a couple" : "one person"} is ${pounds2(read.couple ? MG.couple : MG.single)} a week${c.sda ? `, plus ${pounds2(c.sda)} for severe disability` : ""}${c.carer ? `, plus ${pounds2(c.carer)} as a carer` : ""}${c.housing ? `, plus ${pounds2(c.housing)} for ground rent and service charges` : ""}${c.sda || c.carer || c.housing ? `: ${pounds2(c.minimum)}` : ""}. ${read.other ? "Their" : "Your"} income counts as ${pounds2(c.income)} a week.`;
  switch (read.verdict) {
    case "mixed":
      parts.push(
        "Since 15 May 2019, a couple where one partner is under State Pension age can't make a new claim for Pension Credit; they claim Universal Credit instead, and switch when the younger partner reaches State Pension age. A couple already getting Pension Credit before then keeps it while nothing changes. Universal Credit counts the older partner's State Pension as income, so check it with a benefits calculator rather than assuming it pays nothing.",
      );
      break;
    case "guarantee":
      parts.push(minimumNote);
      parts.push(
        `That leaves ${pounds2(c.guarantee)} of Guarantee Credit${c.savings ? `, and ${pounds2(c.savings)} of Savings Credit on top` : ""}: about ${money(c.total * 52)} a year. Guarantee Credit is the part that matters most, because it brings the rest: the maximum Housing Benefit, usually the whole council tax bill, free dental treatment, and more.`,
      );
      break;
    case "savings":
      parts.push(minimumNote);
      parts.push(
        `${read.other ? "Their" : "Your"} income is above the minimum, so there's no Guarantee Credit, but because ${t.subj} reached State Pension age before April 2016, there's Savings Credit of about ${pounds2(c.savings)} a week (${money(c.savings * 52)} a year). It looks small. It isn't: any Pension Credit award brings ${read.over75 ? "a free TV licence, " : ""}the Warm Home Discount and Cold Weather Payments.`,
      );
      break;
    case "aa": {
      const w = read.withAa!;
      parts.push(minimumNote);
      parts.push(
        `On those figures, nothing. But Attendance Allowance (${pounds2(AA_LOWER)} or ${pounds2(AA_HIGHER)} a week, for help with personal care, not a test of income) isn't counted as income, and for someone who ${read.couple ? "is one of a couple who both get it" : "lives alone"} with nobody paid to care for them, it adds ${pounds2(w.sda)} a week to the minimum. With it, Pension Credit would be about ${pounds2(w.total)} a week. Claim Attendance Allowance first, then claim Pension Credit within three months of the award and ask for it to start from the same date.`,
      );
      break;
    }
    case "close":
      parts.push(minimumNote);
      parts.push(
        `That's ${pounds2(read.shortBy)} a week more than the minimum${read.before2016 ? ", so Savings Credit has tapered away too" : ""}. Small things move this: savings that have since been spent, ground rent or a service charge on a flat, a carer's entitlement, or a disability benefit. A full new State Pension (£241.30) is only just above the single minimum, so any of them can tip it. A claim costs nothing, and a refusal doesn't count against ${t.subj === "you" ? "you" : "them"}.`,
      );
      break;
    case "no":
      parts.push(minimumNote);
      parts.push(
        `That's ${pounds2(read.shortBy)} a week above it, so Pension Credit is unlikely unless something changes: income falls, savings are spent, a partner dies, or ${t.subj} start getting a disability benefit. Check again when it does.`,
      );
      break;
  }
  if (read.verdict !== "mixed" && read.savingsGiven > CAPITAL_FREE && (read.verdict === "guarantee" || read.verdict === "savings" || read.verdict === "close"))
    parts.push(
      `Savings over £10,000 don't rule ${t.subj === "you" ? "you" : "them"} out; they count as ${pounds2(deemedIncome(read.savingsGiven))} a week of income. There's no upper limit.`,
    );
  if (read.withAa && read.verdict !== "aa")
    parts.push(
      `And Attendance Allowance would change it: it isn't counted as income, and for someone who ${read.couple ? "is one of a couple who both get it" : "lives alone"} with nobody paid to care for them it adds ${pounds2(read.withAa.sda)} a week to the minimum. With it, Pension Credit would be about ${pounds2(read.withAa.total)} a week, with Guarantee Credit and everything that comes with it.`,
    );
  if (read.verdict === "guarantee" || read.verdict === "savings")
    parts.push(
      `It can be backdated three months, to ${letterDate(read.backdateTo)} for a claim made today. Every week of delay after that is about ${pounds2(c.total)} gone for good.`,
    );
  return parts.join(" ");
}

export type Tile = { label: string; value: string; note: string };

export function tilesOf(read: PcRead): Tile[] {
  if (read.verdict === "mixed") return [];
  const out: Tile[] = [];
  if (read.calc.total > 0) {
    out.push({ label: "Pension Credit", value: pounds2(read.calc.total), note: `a week, about ${money(read.calc.total * 52)} a year` });
    out.push({ label: "With what it unlocks", value: `about ${money(read.yearValue)}`, note: "a year, counting only what has a price" });
    out.push({ label: "Backdated to", value: letterDate(read.backdateTo), note: "if the claim goes in today" });
  } else if (read.withAa && read.yearValueWithAa !== null) {
    out.push({ label: "Now", value: "£0", note: "Pension Credit on these figures" });
    out.push({ label: "With Attendance Allowance", value: pounds2(read.withAa.total), note: "a week of Pension Credit" });
    out.push({ label: "Worth together", value: `about ${money(read.yearValueWithAa)}`, note: "a year, with the allowance itself (lower rate)" });
  } else {
    out.push({ label: "The minimum", value: pounds2(read.calc.minimum), note: "a week, with additions" });
    out.push({ label: "Income counted", value: pounds2(read.calc.income), note: "a week" });
    out.push({ label: "Over by", value: pounds2(read.shortBy), note: "a week" });
  }
  return out;
}

export type Line = { label: string; value: string; minus: boolean };

export function breakdownLines(read: PcRead): Line[] {
  if (read.verdict === "mixed") return [];
  const c = read.calc;
  const out: Line[] = [{ label: `Minimum guarantee, ${read.couple ? "couple" : "single"}`, value: pounds2(read.couple ? MG.couple : MG.single), minus: false }];
  if (c.sda) out.push({ label: "Severe disability addition", value: `+ ${pounds2(c.sda)}`, minus: false });
  if (c.carer) out.push({ label: "Carer addition", value: `+ ${pounds2(c.carer)}`, minus: false });
  if (c.housing) out.push({ label: "Ground rent and service charges", value: `+ ${pounds2(c.housing)}`, minus: false });
  for (const p of c.parts) out.push({ label: p.label, value: pounds2(p.value), minus: true });
  return out;
}

export function checksOf(read: PcRead): string[] {
  const t = they(read);
  const out: string[] = [];
  if (read.verdict === "mixed") {
    out.push("When the younger partner reaches State Pension age, claim Pension Credit straight away (you can apply up to four months before) and ask for it to start on that date.");
    out.push("The older partner can still get a free TV licence at 75 only through Pension Credit, so it matters to claim on the day.");
    return out;
  }
  out.push(
    `The home ${t.subj} live in isn't counted, whether it's owned outright or with a mortgage. Nor are Attendance Allowance, PIP, DLA, Housing Benefit, Council Tax Reduction or the Winter Fuel Payment.`,
  );
  if (read.disability === "might" || read.disability === "none")
    out.push(
      `Attendance Allowance is for anyone over State Pension age who needs help with washing, dressing, eating, getting to the toilet, medicines or being supervised, day or night, for six months or more. It's not means-tested, and a diagnosis isn't needed; it's about the help needed, even if nobody gives it. Lower rate ${pounds2(AA_LOWER)}, higher ${pounds2(AA_HIGHER)} a week.`,
    );
  if (read.calc.sda === 0 && (read.disability === "one" || read.disability === "both"))
    out.push(
      read.couple && read.disability === "one"
        ? "The severe disability addition for a couple needs both partners to get a qualifying disability benefit (or one to be registered blind). If the other partner might qualify for Attendance Allowance too, it's worth claiming."
        : "The severe disability addition isn't included because another adult lives there or someone is paid Carer's Allowance for looking after them. Some people don't count (a carer living in from a charity, a lodger in some cases); ask when you claim.",
    );
  if (read.calc.sda > 0)
    out.push(
      `The severe disability addition stops if someone starts being paid Carer's Allowance for looking after ${t.subj === "you" ? "you" : "them"}, or another adult moves in. Before a relative claims Carer's Allowance, work out whether ${t.subj === "you" ? "you'd" : "they'd"} lose more than the carer gains.`,
    );
  if (read.withAa && read.verdict !== "aa")
    out.push(
      "Claim Pension Credit now and Attendance Allowance alongside it. When the allowance is awarded, tell the Pension Service straight away: the severe disability amount is added from the award, and the award letter brings Guarantee Credit's extras.",
    );
  if (read.home === "mortgage")
    out.push("With a mortgage, Pension Credit can open Support for Mortgage Interest: a loan towards the interest, paid to the lender and repaid when the home is sold. Ask about it when you claim; it's optional.");
  if (read.home === "rent")
    out.push("Renting: you can claim Housing Benefit on the same Pension Credit call. With Guarantee Credit there's no income test for it.");
  if (read.home === "family")
    out.push("Living with family: a son or daughter living in can reduce Housing Benefit and stop the severe disability addition, but not the core Pension Credit.");
  out.push(
    `Claim online on gov.uk or by phone. The DWP will want ${t.poss} National Insurance number, bank details, and figures for pensions, savings and any earnings. Missing figures can be sent later; don't wait to have every statement before you claim.`,
  );
  out.push("After the award, report changes within a month: savings going over a £500 step, a pension starting or rising, someone moving in or out, a stay in hospital or care. An overpayment can go back years.");
  if (read.where === "scotland")
    out.push("In Scotland the Pension Age Winter Heating Payment replaces the Winter Fuel Payment, and the Winter Heating Payment replaces Cold Weather Payments, both from Social Security Scotland. Pension Credit itself works the same.");
  if (read.where === "ni")
    out.push("In Northern Ireland, claim through the Pension Service at the Department for Communities. There's no Warm Home Discount or Council Tax Reduction there; ask about Housing Benefit for rates instead.");
  out.push("Winter Fuel Payment no longer depends on Pension Credit: everyone over State Pension age gets it, and it's taken back through tax only if income is over £35,000 and there's no Pension Credit.");
  return out;
}

export type DateLine = { on: string; title: string; body: string };

export function remindersOf(read: PcRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  const whose = read.other ? (read.name ? `${read.name}'s ` : "their ") : "";
  if (read.verdict === "guarantee" || read.verdict === "savings" || read.verdict === "close") {
    out.push({
      on: today,
      title: `Claim ${whose}Pension Credit and ask to backdate it`,
      body: `A claim today can reach back to ${letterDate(read.backdateTo)}, no further. Ask for three months' backdating on the call or form.`,
    });
    out.push({
      on: addDaysISO(today, 42),
      title: "Chase the Pension Credit decision",
      body: "If no letter has come, call and ask where the claim is. When the award comes, use it at once: TV licence, council tax, Housing Benefit.",
    });
  }
  if (read.verdict === "aa" || read.withAa) {
    out.push({
      on: today,
      title: "Claim Attendance Allowance",
      body: "Form AA1 from gov.uk or the Attendance Allowance helpline. It's paid from the date of the claim, so start it now, even if the form takes a while.",
    });
  }
  if (read.verdict !== "mixed") {
    out.push({
      on: "2027-04-06",
      title: "Pension Credit: new rates, check again",
      body: "The minimum rises in April, and so do pensions. Someone just over this year can be under next year, and the reverse.",
    });
  }
  return out.filter((d) => d.on >= today).sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(read: PcRead): Message[] {
  const out: Message[] = [];
  const c = read.calc;
  const claiming = read.verdict === "guarantee" || read.verdict === "savings" || read.verdict === "close";
  const nm = read.name || "Mum";
  if (read.other && read.verdict !== "no" && read.verdict !== "mixed") {
    out.push({
      id: "talk",
      title: `Bringing it up with ${read.name || "them"}`,
      note: "Most people who don't claim think they wouldn't qualify, or that it's charity. Start from what it unlocks and the money they've paid in, not from 'you're struggling'. Offer to do the call with them; you can be on speakerphone with their permission.",
      text: `${nm}, I was reading about Pension Credit. Apparently nearly a million people who could get it don't, mostly because they think owning their home or having a bit of savings rules them out. It doesn't.

On the figures I've got, you could get about ${pounds2(read.verdict === "aa" ? read.withAa?.total ?? 0 : c.total)} a week${read.over75 ? ", and it would make your TV licence free" : ""}${read.verdict === "guarantee" ? " and probably sort the council tax" : ""}. ${read.verdict === "aa" ? "It would start with Attendance Allowance, for the help you need with things like washing and getting about, which isn't about money at all." : "It's not charity: it's part of the pension system you paid into."}

Shall we do the phone call together one morning this week? It takes about half an hour, and I'll have the papers ready.`,
    });
  }
  if (claiming) {
    out.push({
      id: "claim",
      title: "On the claim call: what to say and have ready",
      note: "Call the Pension Credit claim line (number on gov.uk) or claim online. If you're calling for someone else, they need to be with you to give permission, unless you're their appointee or attorney.",
      text: `Hello, I'd like to make a claim for Pension Credit${read.other ? ` for ${read.name || "[name]"}, who is here with me` : ""}.

Please backdate the claim by three months, to ${letterDate(read.backdateTo)}.${read.home === "rent" ? "\nI'd also like to claim Housing Benefit at the same time." : ""}${read.home === "mortgage" ? "\nPlease also tell me about Support for Mortgage Interest." : ""}

Figures, a week unless I say otherwise:
- State Pension: ${pounds2(c.parts.find((p) => p.label === "State Pension")?.value ?? 0)}
- Other pensions: £[amount] a month before tax, from [scheme]
- Savings and investments: £[total]${c.sda ? "\n- Attendance Allowance / PIP / DLA: yes, and nobody is paid Carer's Allowance for looking after me, and no other adult lives here" : ""}${c.carer ? "\n- Carer's Allowance: entitled (paid or not) for looking after [name]" : ""}${c.housing ? "\n- Ground rent and service charges: £[amount] a year" : ""}

National Insurance number: [number]
Bank: [sort code, account number]

Have ready: NI number, bank details, the latest pension statements, bank and savings balances, any award letters.`,
    });
  }
  if (read.over75 && claiming) {
    out.push({
      id: "tv",
      title: "To TV Licensing: a free licence at 75 with Pension Credit",
      note: "Do this once the award letter arrives. Apply online at tvlicensing.co.uk or by phone; they check with the DWP. If you've already paid for this year, ask for a refund of the unused part.",
      text: `Hello,

I'm ${read.other ? "[name]" : "[your name]"}, aged 75 or over, and I get Pension Credit (award letter dated [date]). Please change my licence to a free over-75 licence and refund the unused part of what I've paid.

Licence number: [number]
Address: [address]
National Insurance number: [number]

Thank you,
[Name]`,
    });
  }
  if (claiming && read.where !== "ni" && (read.verdict === "guarantee" || read.home === "rent")) {
    out.push({
      id: "council",
      title: "To the council: Council Tax Reduction" + (read.home === "rent" ? " and Housing Benefit" : ""),
      note: "Councils often hear from the DWP, but not always and not quickly. Apply directly as soon as the award comes, and ask for it to start from the date Pension Credit started.",
      text: `Hello,

I've been awarded Pension Credit${c.guarantee > 0 ? " (Guarantee Credit)" : ""} from [date]; a copy of the letter is attached.

Please assess me for Council Tax Reduction${read.home === "rent" ? " and Housing Benefit" : ""} from that date. ${c.guarantee > 0 ? "As I get the Guarantee Credit, I understand I should get the maximum reduction." : ""}

Council tax account: [number]
Address: [address]

Thank you,
[Name]`,
    });
  }
  return out;
}

export function keepList(read: PcRead): string[] {
  const out = ["The award letter: it's the key for the TV licence, council tax, Housing Benefit, dental treatment and glasses."];
  out.push("A note of the claim: the date, how, and any reference. The backdating counts from the claim date.");
  out.push("Pension statements and savings balances from the claim date, in case figures are queried later.");
  if (read.withAa || read.verdict === "aa") out.push("A copy of the Attendance Allowance form before it's posted, and the award letter when it comes.");
  out.push("A note of every change you report, with the date.");
  return out;
}

export function pcRule(read: PcRead): string {
  if (read.verdict === "aa") return "I claim Attendance Allowance first, then Pension Credit within three months of the award.";
  if (read.withAa) return "I claim Pension Credit and Attendance Allowance this week, ask for three months' backdating, and report the allowance the day it's awarded.";
  if (read.verdict === "mixed") return "I claim Pension Credit on the day the younger of us reaches State Pension age.";
  if (read.verdict === "no") return "I check again every April, and whenever income, savings or health changes.";
  return "I claim this week, ask for three months' backdating, and use the award letter for everything it unlocks.";
}

export function pcSummary(read: PcRead, today = todayISO()): string {
  const lines = [`Pension Credit: ${pcHeadline(read)}`, "", pcBody(read), ""];
  const bl = breakdownLines(read);
  if (bl.length) {
    lines.push("How it's worked out, a week:");
    for (const l of bl) lines.push(`- ${l.label}: ${l.minus ? "less " : ""}${l.value}`);
    lines.push(`- Pension Credit: ${pounds2(read.calc.total)}`, "");
  }
  if (read.unlocks.length) {
    lines.push("What it unlocks:");
    for (const u of read.unlocks) lines.push(`- ${u.label}${u.value ? ` (about ${money(u.value)} a year)` : ""}: ${u.note}`);
    lines.push("");
  }
  lines.push("Checks:");
  for (const c of checksOf(read)) lines.push(`- ${c}`);
  lines.push("");
  const rem = remindersOf(read, today);
  if (rem.length) {
    lines.push("Dates:");
    for (const d of rem) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
    lines.push("");
  }
  lines.push(
    `Rule: ${pcRule(read)}`,
    "",
    `2026/27 figures: minimum ${pounds2(MG.single)} single, ${pounds2(MG.couple)} couple. From https://bettereveryday.vercel.app/pensioncredit. An estimate, not advice; the DWP decides.`,
  );
  return lines.join("\n");
}

const WHERES: Exclude<Where, "">[] = ["ew", "scotland", "ni"];
const WHOSES: Exclude<Whose, "">[] = ["mine", "other"];
const HOUSEHOLDS: Exclude<Household, "">[] = ["single", "couple", "mixed"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];
const DISABILITIES: Exclude<Disability, "">[] = ["none", "one", "both", "might"];
const CARERS: Exclude<Carer, "">[] = ["none", "one", "both"];
const HOMES: Exclude<Home, "">[] = ["owned", "mortgage", "rent", "family"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 20): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function parsePcInputs(raw: unknown): PcInputs {
  if (!raw || typeof raw !== "object") return BLANK_PC;
  const v = raw as Record<string, unknown>;
  return {
    whose: oneOf(v.whose, WHOSES),
    name: str(v.name, 30),
    where: oneOf(v.where, WHERES),
    household: oneOf(v.household, HOUSEHOLDS),
    before2016: oneOf(v.before2016, YESNOS),
    over75: oneOf(v.over75, YESNOS),
    statePension: str(v.statePension),
    otherPension: str(v.otherPension),
    earnings: str(v.earnings),
    otherIncome: str(v.otherIncome),
    savings: str(v.savings),
    disability: oneOf(v.disability, DISABILITIES),
    othersLiveIn: oneOf(v.othersLiveIn, YESNOS),
    carerPaid: oneOf(v.carerPaid, YESNOS),
    youCare: oneOf(v.youCare, CARERS),
    home: oneOf(v.home, HOMES),
    serviceCharges: str(v.serviceCharges),
    rent: str(v.rent),
    councilTax: str(v.councilTax),
  };
}

/**
 * The worked example: Pat, 78, widowed, lives alone in a house they own. The
 * basic State Pension plus a little additional pension comes to £219.90 a
 * week, a workplace pension pays £150 a month, and there's £12,600 in the
 * building society. Pat struggles with the stairs and with washing, but has
 * never claimed Attendance Allowance. Council tax is £1,980 a year.
 */
export function pcExample(): PcInputs {
  return {
    ...BLANK_PC,
    whose: "other",
    name: "Pat",
    where: "ew",
    household: "single",
    before2016: "yes",
    over75: "yes",
    statePension: "£219.90",
    otherPension: "£150",
    savings: "£12,600",
    disability: "might",
    othersLiveIn: "no",
    carerPaid: "no",
    youCare: "none",
    home: "owned",
    councilTax: "£1,980",
  };
}
