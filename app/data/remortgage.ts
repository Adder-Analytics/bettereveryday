/**
 * The read behind "Fixed Rate Ending: What Does Waiting Cost, and By When?"
 * (/remortgage).
 *
 * When a fixed-rate mortgage deal ends, the loan doesn't stop: it moves onto
 * the lender's reversion rate (the standard variable rate, or SVR), which is
 * usually far above any deal on offer, and stays there until the borrower
 * picks something else. Nobody chooses the SVR; it's what happens when nobody
 * chooses. So the cost of a fixed rate ending is mostly the cost of the months
 * spent on a rate nobody picked, and the tool prices those months.
 *
 * The rules and figures, as far as the sources I could reach agree (gov.uk,
 * Moneyfacts and the trade press were DNS-blocked from the sandbox; see
 * docs/2026-11-17-session-notes.md):
 *
 *   - The Mortgage Charter (June 2023, reaffirmed by the Chancellor and the
 *     big lenders in March 2026, when they agreed to contact about 1.6 million
 *     borrowers whose fixes end in 2026): a borrower who is up to date can
 *     lock in a new deal with their own lender up to six months before the
 *     fix ends (some lenders allow less, three or four months), can ask for a
 *     better like-for-like deal with that lender if one appears before the
 *     new one starts, and can switch without a new affordability check. It
 *     also offers, as one-off help, a switch to interest-only for six months
 *     or a longer term, with the right to switch back within six months,
 *     without a new affordability check or a mark on the credit file.
 *   - Moving to another lender (a remortgage) means a full application and
 *     an affordability check, a valuation and legal work; it usually takes
 *     four to eight weeks once an application is in, and offers are usually
 *     valid for about six months. Early repayment charges apply if it
 *     completes before the fix ends, so the completion is timed for the day.
 *   - Rates in November 2026: the Bank of England raised Bank Rate from 3.75%
 *     to 4% on 5 November 2026, the first rise in over three years. Moneyfacts
 *     put the average SVR at 7.13% in September 2026 and the average new
 *     mortgage rate at 5.89% at the start of November. The tool uses 7.1% as a
 *     labelled stand-in only when the lender's own reversion rate isn't given.
 *   - Overpayments: most fixed deals allow up to 10% of the balance a year
 *     without a charge; at the switch itself, between deals, there's usually
 *     no charge at all. Rates are priced in loan-to-value bands (60%, 75%,
 *     80%, 85%, 90%, 95% are the common edges), so a small overpayment that
 *     crosses one can buy a lower rate for the whole deal.
 *
 * Arithmetic: monthly interest is the annual rate over 12, payments are the
 * standard repayment (annuity) formula over the months left, and "cost over
 * the deal" is interest paid plus fees, since the capital repaid is the
 * borrower's own money either way. Not financial advice. Pure data and
 * functions, no React, so the read can be checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type Repay = "" | "repayment" | "io";
export type Status = "" | "nothing" | "booked" | "applying";
export type YesNo = "" | "yes" | "no";
export type DealYears = "" | "2" | "3" | "5";

export type RemortgageInputs = {
  /** The date the fixed rate ends (the last day of the deal). */
  endDate: string;
  /** What will be owed when it ends. */
  balance: string;
  /** What the home is worth, roughly. Optional: only used for the loan-to-value band. */
  value: string;
  /** Years left on the mortgage term. */
  years: string;
  repay: Repay;
  /** The fixed rate now, as a percentage. */
  rate: string;
  /** The lender's reversion rate (SVR), as a percentage. Optional. */
  svr: string;
  upToDate: YesNo;
  status: Status;
  /** Your lender's offer (a product transfer): rate and fee. Optional. */
  ptRate: string;
  ptFee: string;
  /** Another lender's offer (a remortgage): rate, fee and other costs. Optional. */
  rmRate: string;
  rmFee: string;
  rmCosts: string;
  /** The length of deal being compared. */
  dealYears: DealYears;
  /** Add the fee to the loan rather than paying it upfront. */
  feeAdded: YesNo;
};

export const BLANK_REMORTGAGE: RemortgageInputs = {
  endDate: "",
  balance: "",
  value: "",
  years: "",
  repay: "",
  rate: "",
  svr: "",
  upToDate: "",
  status: "",
  ptRate: "",
  ptFee: "",
  rmRate: "",
  rmFee: "",
  rmCosts: "",
  dealYears: "",
  feeAdded: "",
};

/** A stand-in reversion rate, used only when the lender's isn't given (Moneyfacts average, Sept 2026). */
export const DEFAULT_SVR = 7.1;
export const BOOK_MONTHS = 6;
export const APPLY_ELSEWHERE_MONTHS = 3;
export const RECHECK_DAYS = 28;
export const OVERPAY_SHARE = 0.1;
export const LTV_BANDS = [60, 75, 80, 85, 90, 95];
/** Term extension shown when the new payment is a stretch. */
export const EXTEND_YEARS = 5;
export const MAX_AGE_TERM = 40;

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

export function pct(n: number): string {
  return `${(Math.round(n * 100) / 100).toString()}%`;
}

/** A rate typed as "4.79", "4.79%" or " 4,79 ". null if blank or not a sensible rate. */
export function parseRate(raw: string): number | null {
  const s = raw.trim().replace(/%$/, "").trim().replace(",", ".");
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 25 ? n : null;
}

export function rateInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseRate(raw) === null;
}

export function parseYears(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 && n <= MAX_AGE_TERM ? n : null;
}

export function yearsInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseYears(raw) === null;
}

function amount(raw: string): number | null {
  return parseMoney(raw);
}

/** The monthly payment on `p` at `ratePct` over `n` months. */
export function payment(p: number, ratePct: number, n: number, io: boolean): number {
  const r = ratePct / 100 / 12;
  if (io) return p * r;
  if (n <= 0) return p;
  if (r === 0) return p / n;
  return (p * r) / (1 - Math.pow(1 + r, -n));
}

/** Interest paid and the balance left after `months` of payments. */
export function run(p: number, ratePct: number, n: number, months: number, io: boolean): { interest: number; left: number; pay: number } {
  const r = ratePct / 100 / 12;
  const pay = payment(p, ratePct, n, io);
  let bal = p;
  let interest = 0;
  for (let i = 0; i < Math.min(months, n); i++) {
    const int = bal * r;
    interest += int;
    bal = Math.max(0, bal + int - pay);
  }
  return { interest, left: bal, pay };
}

export type Option = {
  id: "pt" | "rm" | "svr";
  label: string;
  rate: number;
  fee: number;
  pay: number;
  /** Interest plus fees over the deal length. */
  cost: number;
  /** Extra interest from adding the fee to the loan, over the deal. */
  feeInterest: number;
  best?: boolean;
};

export type Band = { ltv: number; band: number; next: number; cut: number; withinAllowance: boolean };

export type Stage = "early" | "window" | "late" | "ended";

export type RemortgageRead = {
  today: string;
  stage: Stage;
  balance: number;
  months: number;
  io: boolean;
  rate: number;
  svr: number;
  svrAssumed: boolean;
  currentPay: number;
  svrPay: number;
  /** The deal being compared against the reversion rate: the cheapest offer, or none. */
  best: Option | null;
  options: Option[];
  horizon: number;
  /** Extra interest a month on the reversion rate over the best offer (or the current rate). */
  monthlyCost: number;
  /** The payment change from today's to the best offer's (or the reversion rate's). */
  shock: number;
  bookFrom: string;
  applyBy: string;
  recheck: string;
  newEnd: string;
  /** Days on the reversion rate already, if the fix has ended. */
  daysOn: number;
  band: Band | null;
  extended: { years: number; pay: number; extraInterest: number } | null;
  ioPay: number;
};

export function remortgageReady(inp: RemortgageInputs): boolean {
  return (
    isISODate(inp.endDate) &&
    (amount(inp.balance) ?? 0) > 0 &&
    parseYears(inp.years) !== null &&
    parseRate(inp.rate) !== null &&
    Boolean(inp.repay)
  );
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000);
}

export function bandOf(balance: number, value: number): Band | null {
  if (!(value > 0) || balance <= 0) return null;
  const ltv = (balance / value) * 100;
  const band = LTV_BANDS.find((b) => ltv <= b + 1e-9);
  if (band === undefined) return { ltv, band: 100, next: 95, cut: Math.ceil(balance - 0.95 * value), withinAllowance: false };
  const i = LTV_BANDS.indexOf(band);
  if (i === 0) return { ltv, band, next: 0, cut: 0, withinAllowance: false };
  const next = LTV_BANDS[i - 1];
  const cut = Math.ceil(balance - (next / 100) * value);
  return { ltv, band, next, cut, withinAllowance: cut <= balance * OVERPAY_SHARE };
}

export function readRemortgage(inp: RemortgageInputs, today = todayISO()): RemortgageRead | null {
  if (!remortgageReady(inp)) return null;
  const balance = amount(inp.balance)!;
  const years = parseYears(inp.years)!;
  const months = Math.max(1, Math.round(years * 12));
  const io = inp.repay === "io";
  const rate = parseRate(inp.rate)!;
  const typedSvr = parseRate(inp.svr);
  const svr = typedSvr ?? DEFAULT_SVR;
  const svrAssumed = typedSvr === null;
  const horizon = Number(inp.dealYears || "2") * 12;
  const added = inp.feeAdded === "yes";

  const currentPay = payment(balance, rate, months, io);
  const svrRun = run(balance, svr, months, horizon, io);

  const options: Option[] = [];
  const offer = (id: "pt" | "rm", label: string, r: number | null, feeRaw: string, costsRaw: string): void => {
    if (r === null) return;
    const fee = amount(feeRaw) ?? 0;
    const costs = amount(costsRaw) ?? 0;
    const p = added ? balance + fee : balance;
    const res = run(p, r, months, horizon, io);
    const base = added ? run(balance, r, months, horizon, io).interest : res.interest;
    options.push({ id, label, rate: r, fee: fee + costs, pay: res.pay, cost: res.interest + fee + costs, feeInterest: res.interest - base });
  };
  offer("pt", "Your lender's offer", parseRate(inp.ptRate), inp.ptFee, "");
  offer("rm", "Another lender's offer", parseRate(inp.rmRate), inp.rmFee, inp.rmCosts);
  let best: Option | null = null;
  for (const o of options) if (!best || o.cost < best.cost) best = o;
  if (best) best.best = true;
  options.push({ id: "svr", label: "Doing nothing: the reversion rate", rate: svr, fee: 0, pay: svrRun.pay, cost: svrRun.interest, feeInterest: 0 });

  const compareRate = best ? best.rate : rate;
  const monthlyCost = Math.max(0, (balance * (svr - compareRate)) / 1200);
  const shock = (best ? best.pay : svrRun.pay) - currentPay;

  const bookFrom = addMonthsISO(inp.endDate, -BOOK_MONTHS);
  const applyBy = addMonthsISO(inp.endDate, -APPLY_ELSEWHERE_MONTHS);
  const recheck = addDaysISO(inp.endDate, -RECHECK_DAYS);
  const newEnd = addMonthsISO(inp.endDate, horizon);

  let stage: Stage;
  if (today > inp.endDate) stage = "ended";
  else if (today < bookFrom) stage = "early";
  else if (today <= applyBy) stage = "window";
  else stage = "late";
  const daysOn = stage === "ended" ? daysBetween(inp.endDate, today) : 0;

  const band = bandOf(balance, amount(inp.value) ?? 0);

  let extended: RemortgageRead["extended"] = null;
  if (!io && shock >= 100) {
    const r = best ? best.rate : svr;
    const extMonths = months + EXTEND_YEARS * 12;
    const pay = payment(balance, r, extMonths, false);
    const extraInterest = pay * extMonths - payment(balance, r, months, false) * months;
    extended = { years: EXTEND_YEARS, pay, extraInterest };
  }
  const ioPay = (balance * (best ? best.rate : svr)) / 1200;

  return {
    today,
    stage,
    balance,
    months,
    io,
    rate,
    svr,
    svrAssumed,
    currentPay,
    svrPay: svrRun.pay,
    best,
    options,
    horizon,
    monthlyCost,
    shock,
    bookFrom,
    applyBy,
    recheck,
    newEnd,
    daysOn,
    band,
    extended,
    ioPay,
  };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** What the months on the reversion rate have cost so far. */
export function costSoFar(read: RemortgageRead): number {
  return Math.round((read.monthlyCost * 12 * read.daysOn) / 365);
}

export function remortgageHeadline(inp: RemortgageInputs, read: RemortgageRead): string {
  const vs = read.best ? "than the offer" : `than your old ${pct(read.rate)}`;
  if (inp.upToDate === "no")
    return `Ring the lender before ${letterDate(inp.endDate)}. Behind on payments, a new deal isn't automatic, but the lender should talk you through the options, and the reversion rate would add about ${money(read.svrPay - read.currentPay)} a month.`;
  if (read.stage === "ended") {
    if (inp.status === "booked") return `The fix ended on ${letterDate(inp.endDate)}. Check the new rate has started: each month still on the reversion rate costs about ${money(read.monthlyCost)} more in interest ${vs}.`;
    return `You've been on the reversion rate since ${letterDate(addDaysISO(inp.endDate, 1))}: about ${money(read.monthlyCost)} a month more in interest ${vs}, roughly ${money(costSoFar(read))} so far. You can switch today with no early repayment charge.`;
  }
  if (inp.status === "booked")
    return `Booked. Check your lender's rates again by ${actDate(read.recheck)}: if a cheaper like-for-like deal appears before yours starts, you can usually ask to move to it.`;
  if (inp.status === "applying")
    return `Keep your own lender's deal booked as a fallback until the new lender's offer is in writing and the completion date is ${letterDate(addDaysISO(inp.endDate, 1))}. A gap costs about ${money(read.monthlyCost)} a month.`;
  if (read.stage === "early")
    return `Most lenders let you book a new deal from ${letterDate(read.bookFrom)}. Doing nothing would put the payment up by about ${money(read.svrPay - read.currentPay)} a month on ${letterDate(addDaysISO(inp.endDate, 1))}.`;
  if (read.stage === "window")
    return `Book a deal now: you're inside the six-month window. Each month on the reversion rate would cost about ${money(read.monthlyCost)} more in interest ${vs}.`;
  return `${read.monthlyCost >= 1 ? `Book with your own lender this week: each month on the reversion rate would cost about ${money(read.monthlyCost)} more in interest ${vs}.` : "Book with your own lender this week."} A new lender may not complete by ${letterDate(inp.endDate)}.`;
}

export function remortgageBody(inp: RemortgageInputs, read: RemortgageRead): string {
  const parts: string[] = [];
  const from = letterDate(addDaysISO(inp.endDate, 1));
  const svrNote = read.svrAssumed ? ` (here ${pct(read.svr)}, a typical one; your annual statement or offer letter gives your lender's)` : ` of ${pct(read.svr)}`;
  if (read.stage === "ended")
    parts.push(
      `Your ${pct(read.rate)} fix ended on ${letterDate(inp.endDate)}, and unless a new deal has started, the loan has been on the reversion rate${svrNote} since ${from}: about ${money(read.svrPay)} a month instead of ${money(read.currentPay)}.`,
    );
  else
    parts.push(
      `Your ${pct(read.rate)} fix ends on ${letterDate(inp.endDate)}. From ${from}, unless you choose something, the loan moves to the reversion rate${svrNote}, and the payment goes from about ${money(read.currentPay)} to ${money(read.svrPay)} a month.`,
    );
  if (read.best) {
    const b = read.best;
    parts.push(
      `${cap(b.label.replace(/^Your/, "your"))} at ${pct(b.rate)} would be about ${money(b.pay)} a month (${read.shock >= 0 ? `${money(read.shock)} more` : `${money(-read.shock)} less`} than now). Over ${read.horizon / 12} years it costs about ${money(b.cost)} in interest and fees, against ${money(read.options.find((o) => o.id === "svr")!.cost)} on the reversion rate.`,
    );
  } else if (read.stage !== "early") {
    parts.push("Add a quote below, from your lender's app or a broker, to price the switch.");
  }
  if (read.stage === "early")
    parts.push(
      `Leaving before ${letterDate(inp.endDate)} usually means an early repayment charge, so a move to another lender is timed to complete the day after the fix ends. You can start comparing now.`,
    );
  if (read.stage === "late" && inp.status !== "booked")
    parts.push(
      `A new lender usually needs four to eight weeks from application to completion, so with under three months left, book your own lender's deal first (it takes days, with no affordability check if you're up to date) and keep looking. Most lenders let you leave a booked product transfer before it starts.`,
    );
  if (read.band && read.band.next && read.band.cut > 0 && read.band.withinAllowance)
    parts.push(
      `You owe about ${pct(Math.round(read.band.ltv * 10) / 10)} of the home's value. Paying ${money(read.band.cut)} off before the switch would bring it to ${read.band.next}%, a band where rates are usually lower: most fixes allow 10% a year without a charge, and between deals there's usually none.`,
    );
  return parts.join(" ");
}

export type DateLine = { on: string; title: string; body: string };

export function datesOf(inp: RemortgageInputs, read: RemortgageRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  if (read.stage !== "ended") {
    out.push({ on: read.bookFrom, title: "Your lender's deals can usually be booked", body: "Up to six months ahead under the Mortgage Charter; some lenders allow three or four." });
    out.push({ on: read.applyBy, title: "Apply to another lender by", body: "Offers take weeks and legal work four to eight; aim to complete the day after the fix ends." });
    out.push({ on: read.recheck, title: "Check for a cheaper like-for-like deal", body: "If your lender's rates have fallen since you booked, ask to move to the lower one before it starts." });
  }
  out.push({ on: inp.endDate, title: "The fix ends", body: `The reversion rate (${pct(read.svr)}) starts the next day if nothing else does.` });
  out.push({ on: read.newEnd, title: `A ${read.horizon / 12}-year deal from then would end`, body: "Start again six months before." });
  return out.filter((d) => d.on >= today || d.title === "The fix ends").sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

export function remindersOf(inp: RemortgageInputs, read: RemortgageRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  if (read.stage === "ended") {
    out.push({ on: today, title: "Switch off the reversion rate", body: `About ${money(read.monthlyCost)} a month. No early repayment charge now.` });
  } else {
    if (inp.status !== "booked") {
      out.push({ on: read.bookFrom > today ? read.bookFrom : today, title: "Book the next mortgage deal", body: `Fix ends ${letterDate(inp.endDate)}. Ask your lender for its product transfer rates; compare with a broker.` });
      if (read.applyBy >= today) out.push({ on: read.applyBy, title: "Last sensible day to apply to a new lender", body: `To complete by ${letterDate(addDaysISO(inp.endDate, 1))}.` });
    }
    if (read.recheck >= today) out.push({ on: read.recheck, title: "Recheck the booked mortgage rate", body: "A cheaper like-for-like deal from your lender? Ask to switch before it starts." });
    out.push({ on: addDaysISO(inp.endDate, -7), title: "Confirm the new mortgage rate starts", body: `The fix ends ${letterDate(inp.endDate)}. Check the new payment and direct debit.` });
  }
  out.push({ on: addMonthsISO(read.newEnd, -BOOK_MONTHS), title: "The next mortgage deal can be booked", body: `A ${read.horizon / 12}-year deal from ${letterDate(addDaysISO(inp.endDate, 1))} ends ${letterDate(read.newEnd)}.` });
  return out.filter((d) => d.on >= today);
}

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(inp: RemortgageInputs, read: RemortgageRead): Message[] {
  const out: Message[] = [];
  const end = letterDate(inp.endDate);
  if (inp.status !== "booked" || read.stage === "ended")
    out.push({
      id: "lender",
      title: "To your lender: the deals you can switch to",
      note: "Send it through the app's secure messages or read it down the phone. Ask for the answers in writing, and compare them with a broker's before you accept: a product transfer is quick, but your lender's best rate isn't always the market's.",
      text: `Hello,

My fixed rate ends on ${end} (mortgage account [number]). Please can you tell me:

- the product transfer deals available to me now, for two and five years, with the rate, any fee, and the monthly payment for each;
- whether a fee can be paid upfront rather than added to the loan;
- the reversion rate that applies from ${letterDate(addDaysISO(inp.endDate, 1))} if I do nothing, and today's redemption figure;
- whether, if I book now and a cheaper like-for-like deal appears before it starts, I can move to that one;
- the early repayment charges and overpayment allowance on the new deal.

I am up to date with my payments.

Thank you,
[Your name]`,
    });
  if ((read.shock >= 100 && !read.io) || inp.upToDate === "no")
    out.push({
      id: "charter",
      title: "To your lender: if the new payment is too much",
      note: "Under the Mortgage Charter, a borrower who is up to date can switch to interest-only for six months, or extend the term, without a new affordability check and without it affecting the credit file, and switch back within six months. Lenders treat this as one-off help. Behind on payments? Ask anyway, and get free debt advice from MoneyHelper or StepChange.",
      text: `Hello,

My fixed rate ends on ${end} (mortgage account [number]). The new payment will be about ${money(read.best ? read.best.pay : read.svrPay)} a month, up from ${money(read.currentPay)}, and I'm worried about affording it.

Please can you set out the options under the Mortgage Charter, including:
- extending the term (and what the payment and total interest would be);
- switching to interest-only payments for six months;
- whether either would show on my credit file, and how I'd switch back.

Please don't make any change until I've confirmed in writing.

Thank you,
[Your name]`,
    });
  return out;
}

export function keepList(read: RemortgageRead): string[] {
  const out = [
    "The latest annual statement: the balance, the reversion rate and the date the fix ends.",
    "Each offer in writing (the illustration or ESIS), with its rate, fees, payment and the date it expires.",
    "The early repayment charge schedule and overpayment allowance on the current deal and the new one.",
    "Confirmation of the new rate's start date and the first payment, once it's booked.",
  ];
  if (read.band && read.band.withinAllowance) out.push("A recent valuation or sale prices nearby: the band is worked out on the lender's valuation, not yours.");
  return out;
}

export function remortgageRule(inp: RemortgageInputs, read: RemortgageRead): string {
  void inp;
  return `Six months before a deal ends, I book the next one; a month before, I check it's still the cheapest. The reversion rate is the rate nobody chose, and here it costs about ${money(read.monthlyCost)} a month.`;
}

export function remortgageSummary(inp: RemortgageInputs, read: RemortgageRead, today = todayISO()): string {
  const lines = [`Fixed rate ending: ${remortgageHeadline(inp, read)}`, "", remortgageBody(inp, read), ""];
  lines.push(`Over ${read.horizon / 12} years (interest and fees):`);
  for (const o of read.options) lines.push(`- ${o.label}, ${pct(o.rate)}: ${money(o.pay)} a month, ${money(o.cost)}${o.best ? " (cheapest)" : ""}`);
  lines.push("", "Dates:");
  for (const d of datesOf(inp, read, today)) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
  lines.push("", `Rule: ${remortgageRule(inp, read)}`, "", "From https://bettereveryday.vercel.app/remortgage. Not financial advice.");
  return lines.join("\n");
}

const REPAYS: Exclude<Repay, "">[] = ["repayment", "io"];
const STATUSES: Exclude<Status, "">[] = ["nothing", "booked", "applying"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];
const DEALS: Exclude<DealYears, "">[] = ["2", "3", "5"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 20): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function parseRemortgageInputs(raw: unknown): RemortgageInputs {
  if (!raw || typeof raw !== "object") return BLANK_REMORTGAGE;
  const v = raw as Record<string, unknown>;
  return {
    endDate: typeof v.endDate === "string" && isISODate(v.endDate) ? v.endDate : "",
    balance: str(v.balance),
    value: str(v.value),
    years: str(v.years, 6),
    repay: oneOf(v.repay, REPAYS),
    rate: str(v.rate, 8),
    svr: str(v.svr, 8),
    upToDate: oneOf(v.upToDate, YESNOS),
    status: oneOf(v.status, STATUSES),
    ptRate: str(v.ptRate, 8),
    ptFee: str(v.ptFee),
    rmRate: str(v.rmRate, 8),
    rmFee: str(v.rmFee),
    rmCosts: str(v.rmCosts),
    dealYears: oneOf(v.dealYears, DEALS),
    feeAdded: oneOf(v.feeAdded, YESNOS),
  };
}

/**
 * The worked example: a five-year fix taken in late 2021 at 1.89%, ending in
 * about four months, with an offer from the lender and one from a broker.
 */
export function remortgageExample(today = todayISO()): RemortgageInputs {
  return {
    endDate: addDaysISO(addMonthsISO(today, 4), 14),
    balance: "£186,000",
    value: "£245,000",
    years: "23",
    repay: "repayment",
    rate: "1.89",
    svr: "7.24",
    upToDate: "yes",
    status: "nothing",
    ptRate: "4.79",
    ptFee: "£999",
    rmRate: "4.49",
    rmFee: "£1,499",
    rmCosts: "",
    dealYears: "2",
    feeAdded: "yes",
  };
}
