/**
 * The read behind "Taking Money From Your Pension: How Much Tax, and What Does
 * It Start?" (/pension).
 *
 * From 55 (57 from 6 April 2028) you can take money out of a pension pot. A
 * quarter is usually tax-free; the rest is income, taxed in the tax year it's
 * paid, on top of everything else you earn that year. Three things catch
 * people:
 *
 *   1. *How* you take it changes the tax, a lot. A lump sum where each payment
 *      is a quarter tax-free (UFPLS) puts three quarters of it on top of this
 *      year's income. Moving the pot into drawdown and taking the tax-free
 *      quarter of the *whole pot* first can give the same cash with little or
 *      no tax this year, and no tax-free entitlement lost over a lifetime.
 *   2. *When* you take it changes the tax. Income tax is charged a year at a
 *      time and the rates rise with income, so a big taxable sum in one year
 *      pays more than the same sum across two. 5 April is the line.
 *   3. The first payment is usually taxed on an emergency "month 1" code, as if
 *      you'd get the same every month. On a large one-off that takes far too
 *      much (reclaim with P55, P53Z or P50Z), and for someone with a big salary
 *      it can take too little, with the rest collected later.
 *
 * And taking any taxable money from a pot (not tax-free cash alone, and not a
 * small pot of £10,000 or less) starts the money purchase annual allowance:
 * £10,000 a year into money purchase pensions from then on, employer's
 * contributions included, and you must tell other schemes within 91 days.
 *
 * Figures and rules, as far as the sources I could reach agree (gov.uk was
 * DNS-blocked from the sandbox; see docs/2026-11-21-session-notes.md):
 *
 *   - 2026/27 rest of UK: personal allowance £12,570 (tapered by £1 for every
 *     £2 over £100,000), basic 20% on the first £37,700 taxable, higher 40% to
 *     £125,140, additional 45%. Frozen for 2027/28 (Budget, 28 October 2026).
 *   - 2026/27 Scotland (Scottish Budget, 13 January 2026): starter 19% to
 *     £16,537, basic 20% to £29,526, intermediate 21% to £43,662, higher 42%
 *     to £75,000, advanced 45% to £125,140, top 48%. 2027/28 not set yet; the
 *     tool assumes the same.
 *   - Emergency code on a month 1 basis: 1257L M1 (S1257L in Scotland) gives
 *     1/12 of the allowance and of each band to one payment.
 *   - Tax-free cash: 25%, capped by the lump sum allowance (£268,275; left
 *     unchanged at the 2026 Budget).
 *   - MPAA: £10,000. Triggered by UFPLS or drawdown income; not by tax-free
 *     cash alone, a small pot lump sum, or a lifetime annuity that can't fall.
 *     Notify other schemes within 91 days of the provider's flexible access
 *     statement (which it must send within 31 days).
 *   - Small pots: up to £10,000, the whole pot; up to three from personal
 *     pensions; 25% tax-free; doesn't trigger the MPAA.
 *   - Normal minimum pension age: 55, rising to 57 on 6 April 2028 (Finance
 *     Act 2022). Born after 5 April 1973: 57. Born 6 April 1971 to 5 April
 *     1973: can access at 55 until 6 April 2028. Some schemes give a protected
 *     pension age.
 *   - Inheritance tax: from 6 April 2027 most unused pension funds and death
 *     benefits count in the estate (Finance Act 2026). Nil-rate band £325,000,
 *     residence nil-rate band £175,000, spouse exemption, unused bands pass to
 *     the survivor. Death benefits are free of income tax if the member dies
 *     before 75; after 75 the beneficiary pays income tax at their own rate.
 *
 * Not advice; Pension Wise (MoneyHelper) is free. Pure data and functions, no
 * React.
 */

import { formatMoney, parseMoney } from "./worth";
import { addDaysISO, isISODate, letterDate, todayISO } from "./refund";

export { isISODate, letterDate, todayISO };

export type YesNo = "" | "yes" | "no";
export type Unsure = "" | "yes" | "no" | "unsure";
export type Region = "" | "ruk" | "scotland";
export type Kind = "" | "dc" | "db" | "unsure";
export type Pattern = "" | "oneoff" | "regular";
export type Reason = "" | "spend" | "iht" | "gift" | "income";

export type PensionInputs = {
  dob: string;
  kind: Kind;
  /** Already taken the tax-free cash from this pot (it's in drawdown). */
  crystallised: YesNo;
  pot: string;
  amount: string;
  /** Other taxable income this tax year, and next (blank: same). */
  other: string;
  otherNext: string;
  region: Region;
  /** The first payment from this provider this tax year. */
  first: Unsure;
  pattern: Pattern;
  /** Paid into money purchase pensions a year, by you and any employer. */
  contrib: string;
  /** Taken taxable money from a pension pot before. */
  triggered: YesNo;
  benefits: YesNo;
  reason: Reason;
  /** Estate (home, savings, pensions) over the inheritance tax thresholds. */
  estate: Unsure;
  /** Expected payment date. */
  payDate: string;
};

export const BLANK_PENSION: PensionInputs = {
  dob: "",
  kind: "",
  crystallised: "",
  pot: "",
  amount: "",
  other: "",
  otherNext: "",
  region: "",
  first: "",
  pattern: "",
  contrib: "",
  triggered: "",
  benefits: "",
  reason: "",
  estate: "",
  payDate: "",
};

export const PA = 12570;
export const MPAA = 10000;
export const SMALL_POT = 10000;
export const LSA = 268275;
export const NRB = 325000;
export const RNRB = 175000;
export const IHT_RATE = 0.4;
/** Income tax a beneficiary is assumed to pay on an inherited pot after 75. */
export const BEN_RATE = 0.2;
const TAPER_START = 100000;
/** Saving from spreading that's worth waiting for: £250, or 2% of the sum if more. */
const worthWaiting = (amount: number) => Math.max(250, amount * 0.02);

type Band = { upTo: number; rate: number };

/** Bands on taxable income (after the personal allowance). */
const BANDS: Record<Exclude<Region, "">, Band[]> = {
  ruk: [
    { upTo: 37700, rate: 0.2 },
    { upTo: 125140, rate: 0.4 },
    { upTo: Infinity, rate: 0.45 },
  ],
  scotland: [
    { upTo: 16537 - PA, rate: 0.19 },
    { upTo: 29526 - PA, rate: 0.2 },
    { upTo: 43662 - PA, rate: 0.21 },
    { upTo: 75000 - PA, rate: 0.42 },
    { upTo: 125140, rate: 0.45 },
    { upTo: Infinity, rate: 0.48 },
  ],
};

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

function amt(raw: string): number {
  return parseMoney(raw) ?? 0;
}

function given(raw: string): boolean {
  return raw.trim() !== "" && parseMoney(raw) !== null;
}

export function allowanceFor(income: number): number {
  return Math.max(0, PA - Math.max(0, income - TAPER_START) / 2);
}

function onBands(taxable: number, bands: Band[]): number {
  let tax = 0;
  let lo = 0;
  for (const b of bands) {
    if (taxable <= lo) break;
    tax += (Math.min(taxable, b.upTo) - lo) * b.rate;
    lo = b.upTo;
  }
  return tax;
}

/** Income tax on a year's non-savings income. */
export function incomeTax(income: number, region: Exclude<Region, ""> = "ruk"): number {
  const taxable = Math.max(0, income - allowanceFor(income));
  return onBands(taxable, BANDS[region]);
}

/** Extra tax from adding `extra` taxable income on top of `other`. */
export function taxOn(extra: number, other: number, region: Exclude<Region, ""> = "ruk"): number {
  return incomeTax(other + extra, region) - incomeTax(other, region);
}

/** Tax a provider takes from one payment on an emergency month 1 code. */
export function emergencyTax(taxable: number, region: Exclude<Region, ""> = "ruk"): number {
  const free = (PA + 9) / 12;
  const bands = BANDS[region].map((b) => ({ upTo: b.upTo / 12, rate: b.rate }));
  return onBands(Math.max(0, taxable - free), bands);
}

/** The tax year an ISO date falls in, by the year it starts: 2026 for 2026/27. */
export function taxYearOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return m > 4 || (m === 4 && d >= 6) ? y : y - 1;
}

export function taxYearName(start: number): string {
  return `${start}/${String((start + 1) % 100).padStart(2, "0")}`;
}

export function ageOn(dob: string, on: string): number {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [y, m, d] = on.split("-").map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}

function birthdayAt(dob: string, age: number): string {
  const [by, bm, bd] = dob.split("-").map(Number);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${by + age}-${p(bm)}-${p(bd)}`;
}

export const NMPA_CHANGE = "2028-04-06";

/** The first date you can take money out, under the normal rules. */
export function accessDate(dob: string): string {
  const at55 = birthdayAt(dob, 55);
  return at55 < NMPA_CHANGE ? at55 : birthdayAt(dob, 57);
}

export type Method = "ufpls" | "tfc" | "drawdown" | "smallpot";

export type Route = {
  id: string;
  method: Method;
  label: string;
  /** Tax-free part, and the taxable part split by tax year (index 0 = this year). */
  taxFree: number;
  taxable: number[];
  tax: number;
  /** What comes off the first payment, roughly. */
  deducted: number;
  /** Cash in hand from the first payment. */
  firstInHand: number;
  /** Gross of the first payment. */
  firstGross: number;
  mpaa: boolean;
  /** Needs part of the money to wait for a later tax year. */
  waits: boolean;
  note: string;
};

export type Verdict = "young" | "db" | "taxfree" | "split" | "ok" | "costly";

export type PensionRead = {
  verdict: Verdict;
  region: Exclude<Region, "">;
  today: string;
  year: number;
  age: number;
  canFrom: string;
  /** 57th birthday. */
  at57: string;
  /** Under 57 on 6 April 2028 and could be locked out until 57. */
  window: boolean;
  pot: number;
  amount: number;
  other: number;
  otherNext: number;
  crystallised: boolean;
  routes: Route[];
  best: Route | null;
  /** The plain lump sum, all this year, as the baseline. */
  base: Route | null;
  saving: number;
  emptying: boolean;
  /** P55, P53Z or P50Z, or "" when no form is needed. */
  form: "" | "P55" | "P53Z" | "P50Z";
  overTaxed: number;
  underTaxed: number;
  first: boolean;
  regular: boolean;
  contrib: number;
  triggered: boolean;
  /** MPAA charge a year if the best route starts it and contributions carry on. */
  mpaaCharge: number;
  benefits: boolean;
  reason: Reason;
  estate: Unsure;
  /** Top marginal rate the best route reaches this year. */
  topRate: number;
  /** Income this year with the best route, for line checks. */
  incomeWith: number;
  lsaCapped: boolean;
  payDate: string;
  iht: IhtCompare | null;
};

export function pensionReady(inp: PensionInputs): boolean {
  if (!isISODate(inp.dob) || !inp.kind) return false;
  if (inp.kind === "db") return true;
  return given(inp.pot) && given(inp.amount) && amt(inp.amount) > 0 && Boolean(inp.crystallised);
}

/** Spread `total` taxable income over years with other income `others`, cheapest first, in £100 steps. */
export function spread(total: number, others: number[], region: Exclude<Region, "">): number[] {
  const out = others.map(() => 0);
  const step = Math.max(50, Math.min(1000, total / 400));
  let left = total;
  while (left > 1e-6) {
    const chunk = Math.min(step, left);
    let bi = 0;
    let bc = Infinity;
    for (let i = 0; i < others.length; i++) {
      const c = taxOn(out[i] + chunk, others[i], region) - taxOn(out[i], others[i], region);
      if (c < bc - 1e-9) {
        bc = c;
        bi = i;
      }
    }
    out[bi] += chunk;
    left -= chunk;
  }
  return out;
}

function marginalAt(income: number, region: Exclude<Region, "">): number {
  return (incomeTax(income + 100, region) - incomeTax(income, region)) / 100;
}

export function readPension(inp: PensionInputs, today = todayISO()): PensionRead | null {
  if (!pensionReady(inp)) return null;
  const region = inp.region || "ruk";
  const year = taxYearOf(today);
  const age = ageOn(inp.dob, today);
  const canFrom = accessDate(inp.dob);
  const window = birthdayAt(inp.dob, 55) < NMPA_CHANGE && birthdayAt(inp.dob, 57) > NMPA_CHANGE;
  const pot = amt(inp.pot);
  const amount = Math.min(amt(inp.amount), pot > 0 ? pot : amt(inp.amount));
  const other = amt(inp.other);
  const otherNext = given(inp.otherNext) ? amt(inp.otherNext) : other;
  const crystallised = inp.crystallised === "yes";
  const first = inp.first !== "no";
  const regular = inp.pattern === "regular";
  const contrib = amt(inp.contrib);
  const triggered = inp.triggered === "yes";
  const emptying = pot > 0 && amount >= pot - 0.5;

  const base: Omit<PensionRead, "verdict" | "routes" | "best" | "base" | "saving" | "form" | "overTaxed" | "underTaxed" | "mpaaCharge" | "topRate" | "incomeWith" | "lsaCapped" | "iht"> = {
    region,
    today,
    year,
    age,
    canFrom,
    at57: birthdayAt(inp.dob, 57),
    window,
    pot,
    amount,
    other,
    otherNext,
    crystallised,
    emptying,
    first,
    regular,
    contrib,
    triggered,
    benefits: inp.benefits === "yes",
    reason: inp.reason,
    estate: inp.estate,
    payDate: isISODate(inp.payDate) ? inp.payDate : "",
  };
  const empty = { routes: [], best: null, base: null, saving: 0, form: "" as const, overTaxed: 0, underTaxed: 0, mpaaCharge: 0, topRate: 0, incomeWith: other, lsaCapped: false, iht: null };

  if (inp.kind === "db") return { ...base, ...empty, verdict: "db" };
  if (today < canFrom) return { ...base, ...empty, verdict: "young" };

  const others = [other, otherNext, otherNext];
  let lsaCapped = false;
  const capTf = (tf: number) => {
    if (tf > LSA) {
      lsaCapped = true;
      return LSA;
    }
    return tf;
  };

  const make = (method: Method, id: string, label: string, taxFree: number, taxableTotal: number, years: 1 | 2 | 3, note: string): Route => {
    const alloc = years === 1 ? [taxableTotal, 0, 0] : spread(taxableTotal, others.slice(0, years), region).concat([0, 0]).slice(0, 3);
    const tax = alloc.reduce((s, t, i) => s + taxOn(t, others[i], region), 0);
    // The first payment: everything this year's share covers, with its tax-free part in proportion.
    const share = taxableTotal > 0 ? alloc[0] / taxableTotal : 1;
    const firstTaxable = alloc[0];
    const firstTf = method === "tfc" ? taxFree : taxFree * share;
    const firstGross = firstTf + firstTaxable;
    const trueFirst = taxOn(firstTaxable, other, region);
    let deducted: number;
    if (method === "smallpot") deducted = firstTaxable * 0.2;
    else if (first) deducted = emergencyTax(firstTaxable, region);
    else deducted = trueFirst;
    return {
      id,
      method,
      label,
      taxFree,
      taxable: alloc,
      tax,
      deducted,
      firstInHand: firstGross - deducted,
      firstGross,
      mpaa: method !== "smallpot" && taxableTotal > 0.5,
      waits: alloc[1] + alloc[2] > 0.5,
      note,
    };
  };

  const routes: Route[] = [];
  if (crystallised) {
    routes.push(make("drawdown", "drawdown", "Income from your drawdown pot, all this tax year", 0, amount, 1, "The tax-free cash is already taken, so all of it is taxable."));
    routes.push(make("drawdown", "drawdown2", "The same, split across 5 April", 0, amount, 2, "Part now, the rest from 6 April."));
  } else {
    if (emptying && pot <= SMALL_POT) {
      routes.push(make("smallpot", "smallpot", "The whole pot as a small pot lump sum", pot * 0.25, pot * 0.75, 1, "A quarter tax-free; usually 20% taken off the rest; doesn't start the £10,000 limit on paying in."));
    }
    const tfUf = capTf(amount * 0.25);
    routes.push(make("ufpls", "ufpls", "A lump sum, a quarter tax-free (UFPLS), all this tax year", tfUf, amount - tfUf, 1, "What most people get if they just ask for the money."));
    const tfAll = capTf(pot * 0.25);
    const tfc = Math.min(amount, tfAll);
    if (!emptying || pot > SMALL_POT) {
      routes.push(
        make(
          "tfc",
          "tfc",
          amount <= tfAll ? "Tax-free cash only: move the pot into drawdown and take the quarter" : "The tax-free quarter of the whole pot first, the rest as income",
          tfc,
          amount - tfc,
          1,
          amount <= tfAll
            ? `Move about ${money(Math.min(pot, amount * 4))} into drawdown and take its tax-free quarter. Nothing taxable, so no £10,000 limit on paying in.`
            : "The pot goes into drawdown; you take its whole tax-free quarter now, and the rest you need as taxable income.",
        ),
      );
    }
    if (amount - tfUf > 0.5) routes.push(make("ufpls", "ufpls2", "A lump sum split across 5 April", tfUf, amount - tfUf, 2, "Part before 5 April, the rest from 6 April."));
    if (amount - tfc > 0.5 && (!emptying || pot > SMALL_POT)) routes.push(make("tfc", "tfc2", "Tax-free quarter first, the taxable rest split across 5 April", tfc, amount - tfc, 2, "All the tax-free cash now; the taxable part either side of 5 April."));
    if (amount - tfUf > 60000) routes.push(make("ufpls", "ufpls3", "A lump sum over three tax years", tfUf, amount - tfUf, 3, "Spread across this tax year and the next two."));
  }

  // Drop routes that come out the same as an earlier one (a split the sums put all in one year).
  const seen = new Set<string>();
  const unique = routes.filter((r) => {
    const key = `${Math.round(r.taxFree)}:${r.taxable.map((t) => Math.round(t)).join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  routes.length = 0;
  routes.push(...unique);
  const baseRoute = routes.find((r) => r.id === "ufpls" || r.id === "drawdown") ?? routes[0];
  // Best: least tax; a near-tie goes to no waiting, then not starting the MPAA.
  const score = (r: Route) => r.tax + (r.waits ? worthWaiting(amount) : 0) + (r.mpaa && contrib > 0 && !triggered ? 50 : 0);
  const best = [...routes].sort((a, b) => score(a) - score(b))[0];
  const saving = Math.max(0, baseRoute.tax - best.tax);

  const trueFirst = taxOn(best.taxable[0], other, region);
  const overTaxed = Math.max(0, best.deducted - trueFirst);
  let form: PensionRead["form"] = "";
  if (!regular && first && best.method !== "smallpot" && best.taxable[0] > 0.5 && overTaxed >= 50) {
    if (emptying && !best.waits && best.method !== "tfc") form = other > 0 ? "P53Z" : "P50Z";
    else form = "P55";
  }
  const underTaxed = Math.max(0, trueFirst - best.deducted);
  const mpaaCharge = best.mpaa && !triggered && contrib > MPAA ? (contrib - MPAA) * Math.max(0.2, marginalAt(otherNext, region)) : 0;
  const incomeWith = other + best.taxable[0];
  const topRate = best.taxable[0] > 0.5 ? marginalAt(incomeWith - 100, region) : marginalAt(other, region);

  let verdict: Verdict;
  if (best.tax < 1) verdict = "taxfree";
  else if (best.waits && saving >= worthWaiting(amount)) verdict = "split";
  else if (best.tax / amount >= 0.3) verdict = "costly";
  else verdict = "ok";

  const iht = inp.reason === "iht" || inp.reason === "gift" ? ihtCompare(amount, best.tax, inp.estate) : null;

  return { ...base, verdict, routes, best, base: baseRoute, saving, form, overTaxed, underTaxed, mpaaCharge, topRate, incomeWith, lsaCapped, iht };
}

export type IhtCompare = {
  /** What a beneficiary ends up with from the same money. */
  leaveBefore75: number;
  leaveAfter75: number;
  takeKeep: number;
  takeGive: number;
  taxed: boolean;
};

/** The same pot left, or taken and kept, or taken and given away: what reaches the family. */
export function ihtCompare(amount: number, taxNow: number, estate: Unsure): IhtCompare {
  const taxed = estate === "yes";
  const iht = taxed ? IHT_RATE : 0;
  return {
    leaveBefore75: amount * (1 - iht),
    leaveAfter75: amount * (1 - iht) * (1 - BEN_RATE),
    takeKeep: (amount - taxNow) * (1 - iht),
    takeGive: amount - taxNow,
    taxed,
  };
}

const pct = (r: number) => `${Math.round(r * 100)}%`;

export function pensionHeadline(read: PensionRead): string {
  const b = read.best;
  switch (read.verdict) {
    case "young":
      return `You can't take it yet: not until ${letterDate(read.canFrom)}.`;
    case "db":
      return "A final salary pension works differently. Start with the scheme's own quote.";
    case "taxfree":
      return `You can take ${money(read.amount)} with no tax at all.`;
    case "split":
      return `Wait for part of it: splitting across 5 April saves about ${money(read.saving)}.`;
    case "costly":
      return `This costs about ${money(b!.tax)} in tax: ${pct(b!.tax / read.amount)} of what you take.`;
    case "ok":
      return read.saving >= 1
        ? `Take it the right way and the tax is about ${money(b!.tax)}, not ${money(read.base!.tax)}.`
        : `About ${money(b!.tax)} tax, at your normal rate.`;
  }
}

export function pensionBody(read: PensionRead): string {
  const parts: string[] = [];
  const b = read.best;
  const base = read.base;
  if (read.verdict === "young") {
    if (read.window)
      parts.push(
        `You turn 55 on ${letterDate(read.canFrom)}, before the minimum pension age rises to 57 on 6 April 2028. So you can take money from then until 5 April 2028, and after that not again until your 57th birthday (${letterDate(read.at57)}), unless your scheme gives you a protected pension age. Ask your provider now if you might need money in that gap.`,
      );
    parts.push(
      `Under the normal rules you can take money out of a pension from 55, rising to 57 on 6 April 2028. For you that's ${letterDate(read.canFrom)}. The exceptions are serious ill health and a "protected pension age" in some schemes' rules (ask yours). Anyone else offering to unlock your pension early is running a scam: HMRC charges up to 55% on an unauthorised payment, on top of whatever the scammer takes.`,
    );
    return parts.join(" ");
  }
  if (read.verdict === "db") {
    parts.push(
      `With a defined benefit (final salary or career average) pension, you don't draw from a pot: the scheme pays a pension for life. You can usually take a tax-free lump sum by giving up some of that pension. Ask for the quote and look at the rate: £12 of lump sum for each £1 a year of pension given up is common, and a pension that rises each year for life is often worth more than that. Transferring out to a pot is allowed, but over £30,000 the law requires regulated advice first, and most people are better off staying.`,
    );
    return parts.join(" ");
  }
  if (!b || !base) return "";
  const first = b.taxable[0];
  if (read.verdict === "taxfree") {
    parts.push(
      b.method === "smallpot"
        ? `A small pot lump sum takes the whole pot, a quarter tax-free, and with your other income the rest falls inside your allowance.`
        : `Your pot's tax-free quarter is about ${money(Math.min(read.pot * 0.25, LSA))}, so if you move enough of it into drawdown, the whole ${money(read.amount)} can be tax-free cash. Nothing is taxable, so there's no emergency tax and no £10,000 limit on paying in afterwards.`,
    );
    if (base.tax > 1) parts.push(`Asking for it as a plain lump sum (UFPLS) instead would make three quarters of it taxable this year: about ${money(base.tax)} in tax.`);
    parts.push(
      "The catch: the rest of whatever you move into drawdown has had its tax-free part used, so everything you take from it later is taxable. Over your lifetime the tax-free total is about the same either way. Not every workplace scheme offers drawdown; if yours doesn't, a transfer to one that does is usually free.",
    );
  } else {
    parts.push(
      `${b.label}: ${money(b.taxFree)} tax-free and ${money(b.taxable.reduce((s, t) => s + t, 0))} taxable${b.waits ? ` (${money(first)} this tax year, ${money(b.taxable[1])} from 6 April${b.taxable[2] > 0.5 ? `, ${money(b.taxable[2])} the year after` : ""})` : ""}. On top of your other income of ${money(read.other)}, the tax is about ${money(b.tax)}${b.taxable[0] > 0.5 ? `, and the last pound this year is taxed at ${pct(read.topRate)}` : ""}.`,
    );
    if (read.saving >= 1 && b.id !== base.id) parts.push(`A plain lump sum, all this tax year, would cost about ${money(base.tax)}: ${money(read.saving)} more.`);
    if (b.method === "tfc") parts.push("Taking the tax-free quarter of the whole pot first front-loads the tax-free cash; whatever stays in drawdown is all taxable later.");
  }
  if (b.taxable[0] > 0.5 && read.first && !read.regular && b.method !== "smallpot") {
    if (read.overTaxed >= 50)
      parts.push(
        `Expect too much tax off the first payment: providers usually use an emergency code that treats it as if you'd get the same every month. About ${money(b.deducted)} comes off where about ${money(b.deducted - read.overTaxed)} is due, so you'd get about ${money(b.firstInHand)}. Claim the ${money(read.overTaxed)} back with form ${read.form}; HMRC usually repays within weeks. Otherwise it waits for the end of the tax year.`,
      );
    else if (read.underTaxed >= 50)
      parts.push(
        `The emergency code will take too little: about ${money(b.deducted)} off when about ${money(b.deducted + read.underTaxed)} is due, because it gives this payment a share of an allowance your other income already uses. Keep about ${money(read.underTaxed)} aside: HMRC will collect it through your tax code or a bill after 5 April.`,
      );
  }
  if (b.mpaa && !read.triggered) {
    if (read.mpaaCharge > 0)
      parts.push(
        `This starts the money purchase annual allowance: from now on only ${money(MPAA)} a year can go into pensions like yours with tax relief, employer's contributions included. You pay in about ${money(read.contrib)} a year, so the excess would cost about ${money(read.mpaaCharge)} a year in tax unless you cut it.`,
      );
    else if (read.contrib > 0)
      parts.push(`This starts the ${money(MPAA)} a year limit on paying into a pension. You're under it, but you must tell your other schemes within 91 days.`);
  }
  return parts.join(" ");
}

export type Tile = { label: string; value: string; note: string };

export function tilesOf(read: PensionRead): Tile[] {
  const b = read.best;
  if (!b) return [];
  const out: Tile[] = [
    { label: "Tax, the best way", value: money(b.tax), note: b.tax > 0 ? `${pct(b.tax / read.amount)} of ${money(read.amount)}` : `on ${money(read.amount)}` },
    { label: "In hand on the day", value: money(b.firstInHand), note: b.waits ? `from the first payment of ${money(b.firstGross)}` : read.overTaxed >= 50 ? `then ${money(read.overTaxed)} back from HMRC` : "after tax taken off" },
  ];
  if (read.saving >= 1) out.push({ label: "Saved", value: money(read.saving), note: "against a plain lump sum now" });
  else out.push({ label: "Paying-in limit", value: b.mpaa && !read.triggered ? money(MPAA) : "unchanged", note: b.mpaa && !read.triggered ? "a year from now on" : "this doesn't start the MPAA" });
  return out;
}

export function checksOf(read: PensionRead): string[] {
  const out: string[] = [];
  if (read.verdict === "young") {
    out.push("A cold call, text or advert about your pension is a scam until proven otherwise. Check the firm on the FCA register yourself and call Pension Wise.");
    return out;
  }
  if (read.verdict === "db") {
    out.push("Get the scheme's quote in writing and ask what the pension increases by each year.");
    out.push("From 6 April 2027 a defined benefit pension that dies with you isn't caught by the inheritance tax change in the way a pot is; check what's payable to a spouse.");
    return out;
  }
  out.push("Book a free Pension Wise appointment (MoneyHelper) before you take anything. Your provider has to offer it, and it covers your own pot.");
  if (read.reason === "iht" || read.reason === "gift")
    out.push(
      "From 6 April 2027 most unused pension pots count towards inheritance tax. But money you take out and keep counts too: it just moves from your pension into your bank account. Taking it out only cuts inheritance tax if you spend it or give it away, and a gift over the £3,000 a year exemption is only clear if you live seven years (regular gifts from spare income are clear straight away).",
    );
  if ((read.reason === "iht" || read.reason === "gift") && read.estate !== "yes")
    out.push(
      `Inheritance tax is only paid above £${(NRB / 1000).toFixed(0)},000 (plus £${(RNRB / 1000).toFixed(0)},000 if your home goes to children or grandchildren), nothing on what goes to a spouse or civil partner, and the survivor inherits unused allowances: up to £1 million for a couple. Most estates pay none, even with the pension counted.`,
    );
  if (read.incomeWith > 50270 && read.other <= 50270 && read.region === "ruk")
    out.push("This tips you into higher-rate tax this year. If you were going to stop work soon, the same money next tax year, on a lower income, could be taxed at 20%.");
  if (read.incomeWith > 60000 && read.other <= 80000)
    out.push("It counts as income for the High Income Child Benefit Charge (from £60,000) and the £100,000 line for free childcare and the personal allowance. If either applies to your household, check before you take it.");
  if (read.incomeWith > 100000 && read.other < 125140)
    out.push("Between £100,000 and £125,140 you lose £1 of personal allowance for every £2, which makes the real rate 60% in that band. Spreading the withdrawal is worth most here.");
  if (read.benefits)
    out.push("Taking money out counts as income for means-tested benefits, and what you keep counts as savings (Universal Credit stops at £16,000). Spending or giving it away fast can be treated as if you still had it. Get a benefits check before you take anything.");
  if (read.window)
    out.push(`The minimum pension age rises to 57 on 6 April 2028, and you'll be under 57 then. Unless your scheme gives you a protected pension age, you may not be able to take more until ${letterDate(read.at57)}. Ask your provider.`);
  if (read.lsaCapped) out.push(`Tax-free cash is capped at £${LSA.toLocaleString("en-GB")} across all your pensions (the lump sum allowance).`);
  out.push("Taken money can't go back. Paying it back in later is limited, and recycling tax-free cash into a pension can bring a tax charge. HMRC has said cancelling a tax-free cash payment doesn't undo it.");
  out.push("A rumour before a Budget isn't a reason to take it. Many people who rushed before the 2024 and 2025 Budgets regretted it; the 2026 Budget left the tax-free cash rules alone.");
  if (read.region === "scotland") out.push("Scottish rates are used for this tax year; 2027/28 Scottish bands aren't set yet, so next year's figures assume no change.");
  else out.push("2026/27 rates; the bands are frozen for 2027/28, so next year is worked out the same way.");
  return out;
}

export type DateLine = { on: string; title: string; body: string };

export function remindersOf(read: PensionRead): DateLine[] {
  const out: DateLine[] = [];
  const today = read.today;
  const yearEnd = `${read.year + 1}-04-05`;
  const nextStart = `${read.year + 1}-04-06`;
  const b = read.best;
  if (read.verdict === "young") {
    out.push({ on: read.canFrom, title: "Your pension can be taken from today", body: "Book a Pension Wise appointment first. It's free." });
    return out;
  }
  if (!b) return out;
  if (b.taxable[0] > 0.5 && b.waits)
    out.push({ on: addDaysISO(yearEnd, -21), title: "Ask for this tax year's pension payment", body: `${money(b.taxFree * (b.method === "tfc" ? 1 : b.taxable[0] / b.taxable.reduce((s, t) => s + t, 0)) + b.taxable[0])} paid by 5 April. Providers can take a week or two.` });
  if (b.waits) out.push({ on: nextStart, title: "Take the next part of your pension money", body: `${money(b.taxable[1])} taxable in the new tax year.` });
  if (read.payDate && read.form) out.push({ on: addDaysISO(read.payDate, 7), title: `Claim emergency tax back: form ${read.form}`, body: `About ${money(read.overTaxed)} over-taken. Online at gov.uk; have the payment statement.` });
  if (read.payDate && b.mpaa && !read.triggered && read.contrib > 0)
    out.push({ on: addDaysISO(read.payDate, 31 + 60), title: "Tell your other pension schemes you've flexibly accessed", body: "Within 91 days of the flexible access statement. Send them a copy." });
  if (read.reason === "iht" || read.reason === "gift")
    out.push({ on: "2027-04-06", title: "Inheritance tax starts to count unused pension pots", body: "Check your expression of wishes and who's a beneficiary on every pension." });
  if (read.window) out.push({ on: "2028-03-01", title: "Minimum pension age rises to 57 on 6 April", body: "If you'll need money from your pension before 57, ask your provider about a protected pension age now." });
  return out.filter((d) => d.on >= today).sort((a, c) => (a.on < c.on ? -1 : a.on > c.on ? 1 : 0));
}

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(read: PensionRead): Message[] {
  const out: Message[] = [];
  const b = read.best;
  if (!b) return out;
  if (b.method === "tfc") {
    out.push({
      id: "provider",
      title: "To your pension provider: how you want it paid",
      note: "Send before you fill in any withdrawal form. If they only offer a full or partial lump sum (UFPLS), ask about transferring to a provider that offers drawdown, and check for exit fees.",
      text: `Hello,

My policy number is [number]. I'd like to take ${money(b.taxFree)} as a pension commencement lump sum (tax-free cash) by moving ${b.taxable.reduce((s, t) => s + t, 0) > 0.5 ? "my whole pot" : `about ${money(Math.min(read.pot, b.taxFree * 4))}`} into flexi-access drawdown.${b.taxable.reduce((s, t) => s + t, 0) > 0.5 ? ` I'd then like ${money(b.taxable[0])} as income${b.waits ? ` before 5 April and ${money(b.taxable[1])} after 6 April` : ""}.` : " I don't want to take any taxable income at this point."}

Please confirm:
- whether you offer drawdown on this plan, and any charges;
- the tax-free amount and the date it will be paid;
- ${b.taxable[0] > 0.5 ? "which tax code you'll use for the income payment" : "that no taxable payment will be made, so the money purchase annual allowance isn't triggered"}.

Thank you,
[Your name]`,
    });
  } else if (b.taxable[0] > 0.5 && b.method !== "smallpot") {
    out.push({
      id: "provider",
      title: "To your pension provider: before you take it",
      note: "Ask which tax code they'll use. If you have a P45 from this tax year, send it: it can stop the emergency code. Some people take a small first payment (say £100) so HMRC issues a proper code before the big one.",
      text: `Hello,

My policy number is [number]. I'm planning to take ${money(b.firstGross)}${b.waits ? ` before 5 April and the rest after 6 April` : ""}${b.method === "drawdown" ? " as income from my drawdown pot" : " as an uncrystallised funds pension lump sum"}.

Before I do, please tell me:
- which tax code you'll use for the payment, and whether it will be on a month 1 basis;
- whether you can use my current code if I send a P45 [or: whether you've had a code from HMRC for me];
- the date the payment will be made.

Thank you,
[Your name]`,
    });
  }
  if (b.mpaa && !read.triggered && read.contrib > 0) {
    out.push({
      id: "notify",
      title: "To your other pension schemes: the money purchase annual allowance",
      note: "You have to tell every scheme you're still paying into (or that your employer pays into) within 91 days of getting the flexible access statement. Send a copy of the statement.",
      text: `Hello,

My member number is [number]. I'm writing to tell you that I flexibly accessed a pension on [date], so the money purchase annual allowance applies to me from that date. A copy of the flexible access statement from [provider] is enclosed.

Please update your records${read.contrib > MPAA ? ", and tell me the contributions paid to my pension with you since that date, as the total from all schemes now exceeds the £10,000 limit" : ""}.

Thank you,
[Your name]`,
    });
  }
  return out;
}

export function keepList(read: PensionRead): string[] {
  if (read.verdict === "young" || read.verdict === "db") return ["Your latest pension statement and the scheme's contact details.", "Any letter about a protected pension age or a quote."];
  const out = ["The payment statement from your provider: the gross amount, the tax taken, and the tax code used."];
  if (read.form) out.push(`Your National Insurance number and that statement for form ${read.form}; you'll need the amount paid and the tax taken.`);
  if (read.best?.mpaa) out.push("The flexible access statement (it arrives within 31 days). Every future scheme you join needs to see it.");
  out.push("Your P60s and P45s for the year, so you can check HMRC's figures after 5 April.");
  if (read.reason === "iht" || read.reason === "gift") out.push("A record of every gift: the date, who to, how much, and whether it came from spare income.");
  return out;
}

export function pensionRule(read: PensionRead): string {
  switch (read.verdict) {
    case "young":
      return "I don't touch my pension before the minimum age, and I treat anyone who offers to unlock it early as a scammer.";
    case "db":
      return "I get the scheme's quote in writing and compare the lump sum with the pension I'd give up for life.";
    case "taxfree":
      return "I take tax-free cash first, nothing taxable until I need it, and I check what I take counts against nothing else.";
    case "split":
      return "I put taxable pension money in the tax years when my other income is lowest, and I watch 5 April.";
    default:
      return "I work out the tax on a pension withdrawal before I ask for it, take it the cheapest way, and claim back any emergency tax the same week.";
  }
}

export function pensionSummary(read: PensionRead): string {
  const lines = [`Pension withdrawal: ${pensionHeadline(read)}`, "", pensionBody(read), ""];
  if (read.routes.length) {
    lines.push("The ways to take it:");
    for (const r of read.routes) lines.push(`- ${r.label}: tax about ${money(r.tax)}${r.mpaa ? "; starts the £10,000 limit" : ""}${r.waits ? "; part waits for April" : ""}`);
    lines.push("");
  }
  lines.push("Checks:");
  for (const c of checksOf(read)) lines.push(`- ${c}`);
  lines.push("");
  const rem = remindersOf(read);
  if (rem.length) {
    lines.push("Dates:");
    for (const d of rem) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
    lines.push("");
  }
  lines.push(`Rule: ${pensionRule(read)}`, "", `${taxYearName(read.year)} rates. From https://bettereveryday.vercel.app/pension. Not advice; Pension Wise is free.`);
  return lines.join("\n");
}

const KINDS: Exclude<Kind, "">[] = ["dc", "db", "unsure"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];
const UNSURES: Exclude<Unsure, "">[] = ["yes", "no", "unsure"];
const REGIONS: Exclude<Region, "">[] = ["ruk", "scotland"];
const PATTERNS: Exclude<Pattern, "">[] = ["oneoff", "regular"];
const REASONS: Exclude<Reason, "">[] = ["spend", "iht", "gift", "income"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 20): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function parsePensionInputs(raw: unknown): PensionInputs {
  if (!raw || typeof raw !== "object") return BLANK_PENSION;
  const v = raw as Record<string, unknown>;
  return {
    dob: str(v.dob, 10),
    kind: oneOf(v.kind, KINDS),
    crystallised: oneOf(v.crystallised, YESNOS),
    pot: str(v.pot),
    amount: str(v.amount),
    other: str(v.other),
    otherNext: str(v.otherNext),
    region: oneOf(v.region, REGIONS),
    first: oneOf(v.first, UNSURES),
    pattern: oneOf(v.pattern, PATTERNS),
    contrib: str(v.contrib),
    triggered: oneOf(v.triggered, YESNOS),
    benefits: oneOf(v.benefits, YESNOS),
    reason: oneOf(v.reason, REASONS),
    estate: oneOf(v.estate, UNSURES),
    payDate: str(v.payDate, 10),
  };
}

/**
 * The worked example: Maureen is 63, works three days a week for £38,000, and
 * has £120,000 in an old workplace pot she hasn't touched. Her son is buying a
 * flat and she wants to give him £40,000, partly because she'd heard pensions
 * will be taxed on death from 2027. Her current employer pays about £3,800 a
 * year into her workplace pension.
 */
export function pensionExample(): PensionInputs {
  return {
    ...BLANK_PENSION,
    dob: "1963-06-14",
    kind: "dc",
    crystallised: "no",
    pot: "£120,000",
    amount: "£40,000",
    other: "£38,000",
    region: "ruk",
    first: "yes",
    pattern: "oneoff",
    contrib: "£3,800",
    triggered: "no",
    benefits: "no",
    reason: "gift",
    estate: "no",
  };
}
