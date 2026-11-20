/**
 * The read behind "State Pension Gaps: Worth Paying, and By When?"
 * (/statepension).
 *
 * The new State Pension is built from qualifying years on your National
 * Insurance record: 35 for the full amount, at least 10 for any. A year with a
 * gap can be filled with voluntary contributions for up to six years after it
 * ends. For most people who'll be short, it's the cheapest inflation-proof
 * income they'll ever be offered: about £957 buys about £358 a year for life.
 * But a year bought that work would have filled anyway buys nothing, and a
 * year left too long closes for good. The tool sorts gap years into the ones
 * you'll need whatever happens (pay, oldest first), the ones you'll only need
 * if you stop work early (wait, and decide before each one closes), and the
 * ones you won't need, and prices what each buys.
 *
 * The rules and figures, as far as the sources I could reach agree (gov.uk was
 * DNS-blocked from the sandbox; see docs/2026-11-19-session-notes.md):
 *
 *   - Full new State Pension 2026/27: £241.30 a week; £250.70 from April 2027
 *     (a 3.9% rise, earnings growth beating CPI, confirmed at the 28 October
 *     2026 Budget). 35 qualifying years for the full amount if your record
 *     starts after April 2016; 10 for any at all. Each year is about 1/35:
 *     £6.89 a week, £358.50 a year.
 *   - Records before April 2016 have a "starting amount" that may be more or
 *     less than the 35-year arithmetic (contracted-out years lower it). For
 *     those, the forecast at gov.uk/check-state-pension is the only reliable
 *     guide; the tool asks for it and warns when it isn't given.
 *   - Voluntary Class 3 2026/27: £18.40 a week (£956.80 a year). Years paid
 *     within two tax years of their end are charged at their own rate
 *     (2024/25 £17.45, 2025/26 £17.75); older years at the rate in force when
 *     you pay. Class 2 for the self-employed with low profits: £3.65 a week
 *     (2024/25 £3.45, 2025/26 £3.50).
 *   - Six-year window: each tax year can be filled until the 5 April six years
 *     after it ends, so 2020/21 closes on 5 April 2027. The extended window
 *     back to 2006 closed on 5 April 2025.
 *   - Abroad: from 6 April 2026 voluntary Class 2 for time abroad has ended,
 *     and Class 3 for time abroad needs 10 years' UK residence or 10 years of
 *     contributions. Earlier years aren't affected. Former Class 2 payers
 *     abroad apply to pay Class 3 before 6 April 2027.
 *   - State Pension age: 66 for those born before 6 April 1960, rising a month
 *     per monthly birth cohort to 67 for those born from 6 March 1961; 67 for
 *     those born by 5 April 1977; then rising to 68 under current law (the
 *     2044 to 2046 rise, under review).
 *
 * Projections are in 2026/27 money; the State Pension rises each April. Not
 * financial advice. Pure data and functions, no React.
 */

import { formatMoney, parseMoney } from "./worth";
import { isISODate, letterDate, todayISO } from "./refund";

export { isISODate, letterDate, todayISO };

export type Source = "" | "years" | "forecast";
export type YesNo = "" | "yes" | "no";
export type Unsure = "" | "yes" | "no" | "unsure";
export type Tax = "" | "none" | "basic" | "higher";
export type Work = "" | "spa" | "earlier";

/** The six tax years open to fill today (by their starting year). */
export const GAP_YEARS = [2020, 2021, 2022, 2023, 2024, 2025] as const;
export type GapYear = (typeof GAP_YEARS)[number];

export type StatePensionInputs = {
  /** Date of birth, YYYY-MM-DD. */
  born: string;
  /** Count years from the record, or use the gov.uk forecast. */
  source: Source;
  /** Qualifying years on the record so far. */
  record: string;
  /** Any National Insurance before April 2016. */
  before2016: YesNo;
  /** The gov.uk forecast, a week, if you keep contributing until State Pension age. */
  forecast: string;
  /** Working (or getting credits) until State Pension age, or stopping earlier. */
  work: Work;
  /** The age you expect to stop, if earlier. */
  stopAge: string;
  /** The tax years with gaps you could fill (starting years, as strings). */
  gaps: string[];
  /** HMRC's quoted cost per gap year, if known (partial years cost less). */
  quotes: Record<string, string>;
  /** Self-employed with low profits in the gap years: Class 2 may apply. */
  selfEmployed: YesNo;
  /** Income tax on the State Pension in retirement. */
  tax: Tax;
  /** Expect Pension Credit or Housing Benefit in retirement. */
  meansTested: Unsure;
  /** Living abroad now. */
  abroad: YesNo;
};

export const BLANK_STATEPENSION: StatePensionInputs = {
  born: "",
  source: "",
  record: "",
  before2016: "",
  forecast: "",
  work: "",
  stopAge: "",
  gaps: [],
  quotes: {},
  selfEmployed: "",
  tax: "",
  meansTested: "",
  abroad: "",
};

export const FULL_WEEKLY = 241.3;
export const NEXT_WEEKLY = 250.7;
export const YEARS_FULL = 35;
export const YEARS_MIN = 10;
/** One qualifying year, a week and a year, in 2026/27 money. */
export const UNIT_WEEKLY = FULL_WEEKLY / YEARS_FULL;
export const UNIT_YEARLY = UNIT_WEEKLY * 52;
export const CLASS3_NOW = 18.4;
export const CLASS2_NOW = 3.65;
/** Own-year rates for the two most recent years, while they last. */
const OWN_RATE: Partial<Record<GapYear, { c3: number; c2: number }>> = {
  2024: { c3: 17.45, c2: 3.45 },
  2025: { c3: 17.75, c2: 3.5 },
};
/** Years a person reaching State Pension age typically lives on (ONS, rounded down). */
export const YEARS_IN_RETIREMENT = 20;
/** An RPI-linked annuity at 65 paid about £5,000 a year per £100,000 in 2026. */
export const ANNUITY_RATE = 0.05;
/** The first tax year the forecast's future years start from. */
export const BASE_YEAR = 2026;

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

export function pounds2(n: number): string {
  return `£${n.toFixed(2)}`;
}

export function taxYearLabel(y: number): string {
  return `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
}

/** The last day a gap year can be filled: 5 April six years after it ends. */
export function deadlineOf(y: number): string {
  return `${y + 7}-04-05`;
}

/** The last day a recent year can be paid at its own (lower) rate. */
export function cheapUntil(y: number): string | null {
  return OWN_RATE[y as GapYear] ? `${y + 3}-04-05` : null;
}

/** Whole number from text, or null. */
export function parseCount(raw: string, max = 70): number | null {
  const s = raw.trim();
  if (!/^\d{1,2}$/.test(s)) return null;
  const n = Number(s);
  return n <= max ? n : null;
}

export function countInvalid(raw: string, max = 70): boolean {
  return raw.trim() !== "" && parseCount(raw, max) === null;
}

/** State Pension age as [years, months] for a birth date, under current law. */
export function spaAge(born: string): [number, number] {
  if (born < "1960-04-06") return [66, 0];
  if (born < "1961-03-06") {
    const [y, m, d] = born.split("-").map(Number);
    // Cohorts run 6th to 5th: 6 April to 5 May 1960 is one month, and so on.
    let idx = (y - 1960) * 12 + (m - 4) + (d >= 6 ? 0 : -1);
    idx = Math.max(0, Math.min(10, idx));
    return [66, idx + 1];
  }
  if (born < "1977-04-06") return [67, 0];
  if (born < "1978-04-06") return [67, 6];
  return [68, 0];
}

function addYearsMonths(iso: string, years: number, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = (m - 1) + months;
  const ny = y + years + Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const last = new Date(ny, nm, 0).getDate();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${ny}-${p(nm)}-${p(Math.min(d, last))}`;
}

export function spaDate(born: string): string {
  const [y, m] = spaAge(born);
  return addYearsMonths(born, y, m);
}

/** The starting year of the tax year an ISO date falls in. */
export function taxYearOf(iso: string): number {
  const y = Number(iso.slice(0, 4));
  return iso.slice(5) >= "04-06" ? y : y - 1;
}

export function ageLabel([y, m]: [number, number]): string {
  return m ? `${y} and ${m} month${m === 1 ? "" : "s"}` : String(y);
}

export type Verdict = "past" | "pay" | "wait" | "full" | "nogaps" | "under10";

export type GapPlan = {
  year: number;
  label: string;
  /** "pay": needed whatever happens. "maybe": only if you stop early. "skip": not needed. */
  status: "pay" | "maybe" | "skip";
  cost: number;
  /** True if the cost is HMRC's own quote. */
  quoted: boolean;
  /** Extra State Pension a year it buys, in 2026/27 money. */
  gain: number;
  deadline: string;
  /** Pay by this date for the lower own-year rate (2024/25, 2025/26). */
  cheapBy: string | null;
};

export type StatePensionRead = {
  verdict: Verdict;
  source: Exclude<Source, "">;
  spa: string;
  spaAgeLabel: string;
  /** Tax years from 2026/27 up to State Pension age. */
  futureYears: number;
  /** Of those, the years you expect to work or get credits. */
  expectedYears: number;
  /** Qualifying years at State Pension age if you keep going to the end (years mode). */
  projectedFull: number | null;
  projectedExpected: number | null;
  /** Weekly State Pension, 2026/27 money: if you work to SPA, and if you stop when planned. */
  weeklyFull: number;
  weeklyExpected: number;
  /** Years of gaps you'd need: if you work to SPA, and if you stop when planned. */
  needSure: number;
  needExpected: number;
  /** Years short even working to State Pension age, before capping at the open gaps. */
  shortSure: number;
  /** Years short if you stop when planned, before capping at the open gaps. */
  shortExpected: number;
  /** How many more years beyond the open gaps you'd still be short. */
  stillShort: number;
  plans: GapPlan[];
  payCost: number;
  payGain: number;
  maybeCost: number;
  maybeGain: number;
  /** Net of tax, a year, for what you'd pay now. */
  payGainNet: number;
  /** Years of State Pension to get back what you pay now, after tax. */
  payback: number | null;
  breakEvenAge: number | null;
  taxRate: number;
  pre2016Caveat: boolean;
  meansTested: Unsure;
  abroad: boolean;
  selfEmployed: boolean;
  /** Under 10 years for any State Pension, on the expected path, with the gaps. */
  under10: boolean;
};

export function statePensionReady(inp: StatePensionInputs): boolean {
  if (!isISODate(inp.born) || inp.born < "1940-01-01" || inp.born > "2012-01-01") return false;
  if (inp.source === "years") return parseCount(inp.record) !== null;
  if (inp.source === "forecast") {
    const f = parseMoney(inp.forecast);
    return f !== null && f >= 0 && f < 1000;
  }
  return false;
}

function costOf(y: GapYear, inp: StatePensionInputs, today: string): { cost: number; quoted: boolean } {
  const q = parseMoney(inp.quotes[String(y)] ?? "");
  if (q !== null && q > 0) return { cost: q, quoted: true };
  const own = OWN_RATE[y];
  const cheap = cheapUntil(y);
  const useOwn = own && cheap && today <= cheap;
  const class2 = inp.selfEmployed === "yes";
  const weekly = useOwn ? (class2 ? own.c2 : own.c3) : class2 ? CLASS2_NOW : CLASS3_NOW;
  return { cost: weekly * 52, quoted: false };
}

const TAX_RATE: Record<Exclude<Tax, "">, number> = { none: 0, basic: 0.2, higher: 0.4 };

export function readStatePension(inp: StatePensionInputs, today = todayISO()): StatePensionRead | null {
  if (!statePensionReady(inp)) return null;
  const source = inp.source as Exclude<Source, "">;
  const spa = spaDate(inp.born);
  const age = spaAge(inp.born);
  const spaAgeLabel = ageLabel(age);
  const spaYears = age[0] + age[1] / 12;
  const taxRate = inp.tax ? TAX_RATE[inp.tax] : 0.2;

  // Future qualifying years: 2026/27 up to the tax year before the one you reach SPA in.
  const futureYears = Math.max(0, taxYearOf(spa) - BASE_YEAR);
  let expectedYears = futureYears;
  if (inp.work === "earlier") {
    const stop = parseCount(inp.stopAge, 80);
    if (stop !== null) {
      const stopDate = addYearsMonths(inp.born, stop, 0);
      expectedYears = Math.max(0, Math.min(futureYears, taxYearOf(stopDate) - BASE_YEAR));
    }
  }

  const open = GAP_YEARS.filter((y) => inp.gaps.includes(String(y)) && deadlineOf(y) >= today);
  const nGaps = open.length;

  let needSure = 0;
  let needExpected = 0;
  let shortSure = 0;
  let shortExpected = 0;
  let weeklyFull = 0;
  let weeklyExpected = 0;
  let projectedFull: number | null = null;
  let projectedExpected: number | null = null;
  let stillShort = 0;
  let under10 = false;
  // Gain of the k-th year bought (1-based), on the expected path.
  let gainOf: (k: number) => number = () => UNIT_YEARLY;

  if (source === "years") {
    const rec = parseCount(inp.record) ?? 0;
    projectedFull = rec + futureYears;
    projectedExpected = rec + expectedYears;
    const weeklyFor = (years: number) => (years < YEARS_MIN ? 0 : Math.min(years, YEARS_FULL) * UNIT_WEEKLY);
    weeklyFull = weeklyFor(projectedFull);
    weeklyExpected = weeklyFor(projectedExpected);
    shortSure = Math.max(0, YEARS_FULL - projectedFull);
    needSure = Math.min(nGaps, shortSure);
    shortExpected = Math.max(0, YEARS_FULL - projectedExpected);
    needExpected = Math.min(nGaps, shortExpected);
    stillShort = Math.max(0, YEARS_FULL - projectedExpected - nGaps);
    under10 = projectedExpected + nGaps < YEARS_MIN;
    const base = projectedExpected;
    gainOf = (k) => (weeklyFor(base + k) - weeklyFor(base + k - 1)) * 52;
  } else {
    const f = parseMoney(inp.forecast) ?? 0;
    weeklyFull = f;
    const missed = futureYears - expectedYears;
    weeklyExpected = Math.max(0, f - missed * UNIT_WEEKLY);
    const yearsFor = (short: number) => (short <= 0.005 ? 0 : Math.ceil(short / UNIT_WEEKLY - 0.001));
    const shortFull = FULL_WEEKLY - weeklyFull;
    const shortExp = FULL_WEEKLY - weeklyExpected;
    shortSure = yearsFor(shortFull);
    needSure = Math.min(nGaps, shortSure);
    shortExpected = yearsFor(shortExp);
    needExpected = Math.min(nGaps, shortExpected);
    stillShort = Math.max(0, yearsFor(shortExp) - nGaps);
    const base = weeklyExpected;
    gainOf = (k) => Math.max(0, Math.min(FULL_WEEKLY, base + k * UNIT_WEEKLY) - Math.min(FULL_WEEKLY, base + (k - 1) * UNIT_WEEKLY)) * 52;
  }

  // Oldest first: they close first, and leaving the recent ones open keeps the choice longest.
  const plans: GapPlan[] = open.map((y, i) => {
    const { cost, quoted } = costOf(y, inp, today);
    let status: GapPlan["status"] = i < needSure ? "pay" : i < needExpected ? "maybe" : "skip";
    // Under 10 years, or past State Pension age: nothing is a sure buy; it's a question for the DWP.
    if ((under10 || spa <= today) && status === "pay") status = "maybe";
    return {
      year: y,
      label: taxYearLabel(y),
      status,
      cost,
      quoted,
      gain: status === "skip" ? 0 : under10 ? 0 : gainOf(i + 1),
      deadline: deadlineOf(y),
      cheapBy: cheapUntil(y) && today <= (cheapUntil(y) as string) ? cheapUntil(y) : null,
    };
  });
  const sum = (list: GapPlan[], k: "cost" | "gain") => list.reduce((s, p) => s + p[k], 0);
  const pay = plans.filter((p) => p.status === "pay");
  const maybe = plans.filter((p) => p.status === "maybe");
  const payCost = sum(pay, "cost");
  const payGain = sum(pay, "gain");
  const payGainNet = payGain * (1 - taxRate);
  const payback = payGainNet > 0 ? payCost / payGainNet : null;

  let verdict: Verdict;
  if (spa <= today) verdict = "past";
  else if (under10 && nGaps > 0) verdict = "under10";
  else if (needSure > 0) verdict = "pay";
  else if (needExpected > 0) verdict = "wait";
  else if (nGaps === 0 && (source === "years" ? (projectedExpected ?? 0) < YEARS_FULL : weeklyExpected < FULL_WEEKLY - 0.005)) verdict = "nogaps";
  else verdict = "full";

  return {
    verdict,
    source,
    spa,
    spaAgeLabel,
    futureYears,
    expectedYears,
    projectedFull,
    projectedExpected,
    weeklyFull,
    weeklyExpected,
    needSure,
    needExpected,
    shortSure,
    shortExpected,
    stillShort,
    plans,
    payCost,
    payGain,
    maybeCost: sum(maybe, "cost"),
    maybeGain: sum(maybe, "gain"),
    payGainNet,
    payback,
    breakEvenAge: payback !== null ? spaYears + payback : null,
    taxRate,
    pre2016Caveat: source === "years" && inp.before2016 !== "no",
    meansTested: inp.meansTested,
    abroad: inp.abroad === "yes",
    selfEmployed: inp.selfEmployed === "yes",
    under10,
  };
}

function years(n: number): string {
  return `${n} year${n === 1 ? "" : "s"}`;
}

function ageText(n: number): string {
  return String(Math.floor(n));
}

export function statePensionHeadline(read: StatePensionRead): string {
  switch (read.verdict) {
    case "past":
      return "You've reached State Pension age.";
    case "under10":
      return "These gaps alone won't reach the 10 years for any State Pension.";
    case "pay":
      return `Worth paying for ${years(read.needSure)}: you'll be short even if you work to the end.`;
    case "wait":
      return "Not yet. Work could fill it; decide before each year closes.";
    case "nogaps":
      return "You'd be short, but there are no open gaps to buy.";
    case "full":
      return "Don't pay. You're on course for the full amount.";
  }
}

export function statePensionBody(read: StatePensionRead): string {
  const spa = `${letterDate(read.spa)} (age ${read.spaAgeLabel})`;
  const parts: string[] = [];
  switch (read.verdict) {
    case "past":
      parts.push(`Your State Pension age was ${spa}. Gaps in the six years before it can sometimes still be filled, and doing so raises the pension you're paid from then on. Ask the Pension Service before paying, and check whether it would reduce any Pension Credit.`);
      break;
    case "under10": {
      parts.push(`You need at least 10 qualifying years to get any new State Pension. On the path you've described you'd reach ${read.projectedExpected ?? 0}, and the gaps you can fill don't bring that to 10, so paying for them now would buy nothing on its own.`);
      parts.push("More years of work, credits, or years worked in another EEA country or Switzerland (which can count towards the 10 but not the amount) may change that. Ask the Future Pension Centre before paying.");
      break;
    }
    case "pay": {
      const first = read.plans.find((p) => p.status === "pay");
      parts.push(`Working or getting credits every year until ${spa}, you'd still get ${pounds2(read.weeklyFull)} a week, not the full ${pounds2(FULL_WEEKLY)}. That's ${years(read.shortSure)} short whatever you do, so ${read.needSure === read.shortSure ? (read.needSure === 1 ? "that gap is" : "those gaps are") : read.needSure === 1 ? "the gap you can fill is" : `the ${read.needSure} gaps you can fill are`} worth filling.`);
      parts.push(`Paying ${money(read.payCost)} adds about ${money(read.payGain)} a year to your State Pension for life, in today's money, rising each April.${read.payback !== null ? ` After ${read.taxRate ? `${Math.round(read.taxRate * 100)}% tax` : "tax"}, you'd get it back in about ${read.payback.toFixed(1)} years of pension, by about age ${ageText(read.breakEvenAge ?? 0)}.` : ""}`);
      if (first) parts.push(`The oldest, ${first.label}, closes on ${letterDate(first.deadline)}.`);
      break;
    }
    case "wait": {
      const first = read.plans.find((p) => p.status === "maybe");
      parts.push(`If you keep working or getting credits until ${spa}, you'll reach the full amount without paying anything. If you stop when you've said, you'd be ${years(read.shortExpected)} short. So don't buy a year you may not need; buy it before it closes if you still will.`);
      if (first) parts.push(`The first decision is ${first.label}, which closes on ${letterDate(first.deadline)}. Check your forecast that spring.`);
      break;
    }
    case "nogaps":
      parts.push(`On the path you've described you'd get about ${pounds2(read.weeklyExpected)} a week at ${spa}, short of the full ${pounds2(FULL_WEEKLY)}. You haven't ticked any gaps in the last six years, so the way to close it is more years: work, or National Insurance credits for caring, looking after a child under 12, or claiming benefits.`);
      break;
    case "full":
      parts.push(`On the path you've described you'd reach the full ${pounds2(FULL_WEEKLY)} a week (${pounds2(NEXT_WEEKLY)} from April 2027) by ${spa}. A year you pay for now would add nothing.`);
      if (read.plans.length) parts.push("Keep the gaps in mind if your plans change: each can still be filled until its deadline.");
      break;
  }
  if (read.verdict === "past") return parts.join(" ");
  if (read.stillShort > 0 && read.verdict !== "under10" && read.verdict !== "nogaps")
    parts.push(`Even with every open gap filled you'd be ${years(read.stillShort)} short of the full amount on that path, so credits or more years of work matter too.`);
  if (read.pre2016Caveat) parts.push("You have National Insurance from before April 2016, so the 35-year count is only a guide: get your forecast, which knows your starting amount.");
  return parts.join(" ");
}

export type Tile = { label: string; value: string; note: string };

export function tilesOf(read: StatePensionRead): Tile[] {
  return [
    { label: "State Pension age", value: letterDate(read.spa), note: `age ${read.spaAgeLabel}` },
    {
      label: "On your path",
      value: `${pounds2(read.weeklyExpected)}`,
      note: read.weeklyExpected >= FULL_WEEKLY - 0.005 ? "a week: the full amount" : `a week, of the full ${pounds2(FULL_WEEKLY)}`,
    },
    { label: "One year buys", value: money(UNIT_YEARLY), note: `a year for life, for about ${money(CLASS3_NOW * 52)}` },
  ];
}

export type DateLine = { on: string; title: string; body: string };

export function datesOf(read: StatePensionRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  for (const p of read.plans) {
    if (p.status === "skip") continue;
    if (p.cheapBy) out.push({ on: p.cheapBy, title: `${p.label} at its own rate`, body: `Last day to pay ${p.label} at the lower rate for that year. After this it costs the rate in force when you pay.` });
    out.push({
      on: p.deadline,
      title: `${p.label} closes`,
      body: p.status === "pay" ? "Last day to fill it. You need this one: pay well before." : "Last day to fill it. Check your forecast first: work may have filled the gap.",
    });
  }
  if (read.verdict !== "past") out.push({ on: read.spa, title: "State Pension age", body: "The State Pension doesn't start by itself: you'll get a letter about two months before. Claim online or by phone." });
  return out.filter((d) => d.on >= today).sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

function minusWeeks(iso: string, weeks: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - weeks * 7);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function remindersOf(read: StatePensionRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  if (read.verdict === "past") return out;
  for (const p of read.plans) {
    if (p.status === "skip") continue;
    // A year you need: pay before the lower own-year rate ends, if it has one, else before it closes.
    const by = p.status === "pay" && p.cheapBy ? p.cheapBy : p.deadline;
    const on = minusWeeks(by, 8);
    out.push({
      on: on < today ? today : on,
      title: p.status === "pay" ? `Pay voluntary NI for ${p.label}` : `Decide on voluntary NI for ${p.label}`,
      body: `${p.label} can be filled until ${letterDate(p.deadline)}${p.status === "pay" && p.cheapBy ? `, and costs less if paid by ${letterDate(p.cheapBy)}` : ""}. ${p.status === "pay" ? "Get the payment reference from HMRC and pay." : "Check your State Pension forecast: if you'd still be short, pay; if work has filled it, don't."}`,
    });
  }
  out.push({ on: "2027-04-20", title: "Check your State Pension forecast", body: "A new tax year has been added to your record. Check it at gov.uk/check-state-pension." });
  return out.filter((d) => d.on >= today);
}

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(read: StatePensionRead): Message[] {
  const out: Message[] = [];
  const pay = read.plans.filter((p) => p.status === "pay");
  const maybe = read.plans.filter((p) => p.status === "maybe");
  const list = (pay.length ? pay : maybe).map((p) => p.label);
  const yearsText = list.length ? list.join(", ") : "[the years with gaps]";
  if (read.verdict !== "full") {
    out.push({
      id: "check",
      title: "To the Future Pension Centre: check before you pay",
      note: "The DWP's Future Pension Centre (0800 731 0175) can say whether a year would raise your State Pension and by how much. Have your National Insurance number ready. Ask them to confirm in writing if you can.",
      text: `Hello,

My National Insurance number is [number]. Before I pay voluntary contributions, please can you confirm:

- whether filling ${yearsText} would increase my State Pension, and by how much a week for each year;
- my forecast if I keep working until State Pension age, and if I stop at [age];
- whether any of those years could be covered by National Insurance credits instead.

Thank you,
[Your name]`,
    });
  }
  if (pay.length || maybe.length) {
    out.push({
      id: "pay",
      title: "To HMRC: the payment reference",
      note: "You can pay online through your State Pension forecast at gov.uk (it gives the cost and a reference for each year), or ring the National Insurance helpline (0300 200 3500). HMRC won't text or email you a link to pay.",
      text: `Hello,

My National Insurance number is [number]. I'd like to pay voluntary ${read.selfEmployed ? "Class 2 (I was self-employed with low profits)" : "Class 3"} National Insurance contributions for ${yearsText}.

Please can you tell me the amount for each year and the 18-digit payment reference to use.

Thank you,
[Your name]`,
    });
  }
  out.push({
    id: "credits",
    title: "To HMRC: a gap that should have been a credit",
    note: "If you were caring, looking after a child under 12, or claiming benefits in a gap year, you may be owed free credits. A grandparent or relative who looked after a child under 12 while the parent worked can claim the parent's spare credit (form CA9176), back to 2011.",
    text: `Hello,

My National Insurance number is [number]. My record shows a gap in [tax year]. During that year I was [claiming Child Benefit for a child under 12 / caring for someone for 20 hours or more a week / looking after my grandchild, who was under 12, while their parent worked / claiming Universal Credit].

Please can you check whether I should have National Insurance credits for that year, and add them if so.

Thank you,
[Your name]`,
  });
  return out;
}

export function checksOf(read: StatePensionRead): string[] {
  const out: string[] = [
    "Get your forecast and record at gov.uk/check-state-pension. The record shows each year, whether it counts, and the cost of filling it. Partial years cost less.",
    "Look for free credits first: Child Benefit for a child under 12, caring 20 hours a week (Carer's Allowance or Carer's Credit), Universal Credit or sickness benefits, or looking after a grandchild under 12.",
  ];
  if (read.meansTested === "yes" || read.meansTested === "unsure")
    out.push("If you're likely to get Pension Credit or Housing Benefit, extra State Pension can mostly come off them. Ask the Pension Service before paying.");
  if (read.selfEmployed) out.push("Self-employed with profits under the small profits threshold in those years? Class 2 is about a fifth of the cost of Class 3. Ask HMRC which applies.");
  if (read.abroad)
    out.push("Living abroad: from 6 April 2026 Class 2 for time abroad has ended, and Class 3 needs 10 years' UK residence or 10 years of contributions. Years before 2026/27 aren't affected. If you used to pay Class 2 abroad, apply to pay Class 3 before 6 April 2027.");
  out.push("The State Pension stops when you die, so this is insurance against a long life, not an investment you get back. Bought from an insurer, the same inflation-linked income would cost several times as much.");
  return out;
}

export function keepList(read: StatePensionRead): string[] {
  const out = [
    "Your National Insurance number and Government Gateway (or GOV.UK One Login) sign-in.",
    "A screenshot or PDF of your forecast and National Insurance record, dated.",
  ];
  if (read.plans.some((p) => p.status !== "skip")) out.push("The payment reference and receipt for each year you pay, and a later screenshot showing the year now counts (it can take a few weeks).");
  out.push("Notes of any calls with the Future Pension Centre or HMRC: date, name, what they said.");
  return out;
}

export function statePensionRule(read: StatePensionRead): string {
  if (read.verdict === "pay") return "I pay for the State Pension years I'll be short of whatever happens, oldest first, before each one closes. The rest I decide each spring.";
  if (read.verdict === "wait") return "I don't buy a State Pension year that work might fill. I check my forecast each spring and pay before a year closes if I'd still be short.";
  return "I check my State Pension forecast each spring, and look for missing credits before paying for any year.";
}

export function statePensionSummary(read: StatePensionRead, today = todayISO()): string {
  const lines = [`State Pension gaps: ${statePensionHeadline(read)}`, "", statePensionBody(read), ""];
  if (read.plans.length) {
    lines.push("The open gaps:");
    for (const p of read.plans) {
      const what = p.status === "pay" ? "pay" : p.status === "maybe" ? "decide later" : "not needed";
      lines.push(`- ${p.label}: ${what}; about ${money(p.cost)}${p.quoted ? " (HMRC's quote)" : ""}${p.gain ? `, adds about ${money(p.gain)} a year` : ""}; closes ${letterDate(p.deadline)}`);
    }
    lines.push("");
  }
  const dates = datesOf(read, today);
  if (dates.length) {
    lines.push("Dates:");
    for (const d of dates) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
    lines.push("");
  }
  lines.push(`Rule: ${statePensionRule(read)}`, "", "In 2026/27 money. From https://bettereveryday.adder.dev/statepension. Not financial advice.");
  return lines.join("\n");
}

const SOURCES: Exclude<Source, "">[] = ["years", "forecast"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];
const UNSURES: Exclude<Unsure, "">[] = ["yes", "no", "unsure"];
const TAXES: Exclude<Tax, "">[] = ["none", "basic", "higher"];
const WORKS: Exclude<Work, "">[] = ["spa", "earlier"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 20): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function parseStatePensionInputs(raw: unknown): StatePensionInputs {
  if (!raw || typeof raw !== "object") return BLANK_STATEPENSION;
  const v = raw as Record<string, unknown>;
  const allowed = GAP_YEARS.map(String);
  const gaps = Array.isArray(v.gaps) ? v.gaps.filter((g): g is string => typeof g === "string" && allowed.includes(g)) : [];
  const quotes: Record<string, string> = {};
  if (v.quotes && typeof v.quotes === "object") {
    for (const [k, q] of Object.entries(v.quotes as Record<string, unknown>)) if (allowed.includes(k)) quotes[k] = str(q);
  }
  return {
    born: str(v.born, 10),
    source: oneOf(v.source, SOURCES),
    record: str(v.record, 3),
    before2016: oneOf(v.before2016, YESNOS),
    forecast: str(v.forecast),
    work: oneOf(v.work, WORKS),
    stopAge: str(v.stopAge, 3),
    gaps: Array.from(new Set(gaps)),
    quotes,
    selfEmployed: oneOf(v.selfEmployed, YESNOS),
    tax: oneOf(v.tax, TAXES),
    meansTested: oneOf(v.meansTested, UNSURES),
    abroad: oneOf(v.abroad, YESNOS),
  };
}

/**
 * The worked example: born in 1968, a forecast one year short of the full
 * amount after three years out of work caring for her mother (gaps in 2020/21
 * to 2022/23), and a plan to stop at 65.
 */
export function statePensionExample(): StatePensionInputs {
  return {
    ...BLANK_STATEPENSION,
    born: "1968-09-14",
    source: "forecast",
    forecast: "£234.41",
    before2016: "yes",
    work: "earlier",
    stopAge: "65",
    gaps: ["2020", "2021", "2022"],
    tax: "basic",
    meansTested: "no",
  };
}
