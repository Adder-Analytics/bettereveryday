/**
 * The read behind "A Catch-up Energy Bill: What Do You Owe?" (/catchup).
 *
 * The smart meter stopped sending readings, or the estimates ran low for a
 * year or two, and then one real reading lands: a bill for £1,800 more than
 * you've paid. Most people either pay it in a panic or argue with it in
 * general terms ("this can't be right"). Both miss the rule that decides most
 * of it.
 *
 *   - Great Britain (Ofgem's back-billing rule, standard licence condition
 *     21BA, in force for homes since May 2018): a supplier can't bill a
 *     domestic customer for gas or electricity used more than 12 months before
 *     the date of the bill, where the customer wasn't correctly billed for it
 *     before. The exception is a customer who behaved "obstructively or
 *     manifestly unreasonably": refusing access to the meter, tampering with
 *     it, or ignoring repeated requests for readings, judged case by case. It
 *     isn't a back-bill if a correct bill was sent at the time and simply
 *     wasn't paid.
 *   - Northern Ireland (the Utility Regulator's rule, since 2020): the same
 *     idea with 13 months, where the shortfall was the supplier's fault.
 *   - The complaint: write to the supplier and say it's a complaint. After
 *     eight weeks without a fix, or sooner with a "deadlock" letter, the
 *     Energy Ombudsman takes it free, within 12 months of that letter or of the
 *     eight weeks running out. In Northern Ireland the next stop is the
 *     Consumer Council.
 *   - The part that is owed: suppliers must offer a repayment plan you can
 *     afford. Citizens Advice's guidance is to ask for it to be spread over at
 *     least as long as the shortfall took to build up.
 *
 * The rule cuts by when the energy was used, not by when it was billed, and a
 * catch-up bill usually covers one long period between two readings. So the
 * tool splits that period at the cut-off, weighting each day by a typical
 * seasonal pattern for the fuel: a winter of gas heating costs far more than a
 * summer. The split is an estimate for the letter; the supplier has to do the
 * real one from the readings.
 *
 * Kinds:
 *   reading:   the bill itself is an estimate. Send a real reading first.
 *   backbill:  part of it is too old to charge. Dispute that part.
 *   arguable:  part of it is too old, but they'd asked for readings that
 *              weren't sent, so the exception may be argued.
 *   owed:      all of it falls inside the window. Check it, ask for a plan.
 *   excluded:  the rule doesn't apply (access refused, or the bills were
 *              correct and unpaid). Ask for a plan.
 *   wait:      complained, under eight weeks, nothing final yet.
 *   ombudsman: eight weeks have passed, or a deadlock letter came.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type Region = "" | "gb" | "ni";
export type Fuel = "" | "gas" | "electricity" | "both";
export type Basis = "" | "actual" | "estimate" | "unsure";
export type Conduct = "" | "fine" | "ignored" | "blocked" | "unpaid";
export type CatchupStage = "" | "new" | "complained" | "deadlock";
export type Afford = "" | "lump" | "spread";

export type CatchupInputs = {
  /** Which bill, in a few words: "gas and electricity at the flat". */
  what: string;
  /** The supplier's name, for the letter. */
  supplier: string;
  region: Region;
  fuel: Fuel;
  /** What the catch-up asks for on top of what you'd already paid. */
  amount: string;
  /** ISO date on the catch-up bill. */
  billOn: string;
  /** ISO date the period starts: the last real reading before the gap. */
  from: string;
  /** ISO date the period ends: the new real reading. Blank means the bill date. */
  to: string;
  basis: Basis;
  conduct: Conduct;
  stage: CatchupStage;
  /** ISO date you complained, or the date on the deadlock letter. */
  stageOn: string;
  afford: Afford;
};

export const BLANK_CATCHUP: CatchupInputs = {
  what: "",
  supplier: "",
  region: "",
  fuel: "",
  amount: "",
  billOn: "",
  from: "",
  to: "",
  basis: "",
  conduct: "",
  stage: "",
  stageOn: "",
  afford: "",
};

/** Great Britain: 12 months. Northern Ireland: 13. */
export function limitMonths(r: Region): number {
  return r === "ni" ? 13 : 12;
}
/** The supplier's eight weeks to resolve a complaint. */
export const COMPLAINT_DAYS = 56;
/** The Energy Ombudsman takes a case within 12 months of the deadlock or the eight weeks. */
export const OMBUDSMAN_MONTHS = 12;
/** A period longer than this is almost certainly a typo. */
const MAX_DAYS = 366 * 8;

/**
 * Rough shares of a year's use by month, January first, summing to 100. Gas is
 * mostly heating; electricity is flatter with a winter lift. My own rounding
 * of the usual UK seasonal shape: enough to split a period fairly, not to bill.
 */
const MONTH_WEIGHTS: Record<"gas" | "electricity" | "both", number[]> = {
  gas: [15.5, 13, 12, 8.5, 5.5, 3.5, 3, 3, 4, 7.5, 11, 13.5],
  electricity: [10, 9, 9, 8, 7.5, 7, 7, 7, 7.5, 8.5, 9.5, 10],
  both: [12.5, 11, 10.5, 8.2, 6.6, 5.4, 5.2, 5.2, 5.9, 8, 10.2, 11.7],
};

export type CatchupKind = "reading" | "backbill" | "arguable" | "owed" | "excluded" | "wait" | "ombudsman";

export type CatchupRead = {
  kind: CatchupKind;
  amount: number;
  /** The date before which energy can't be charged. */
  cutoff: string;
  /** The period's end: the new reading, or the bill date. */
  to: string;
  /** The share of the period's use that falls before the cut-off, 0–1. */
  share: number;
  /** The part of the bill for energy used before the cut-off. */
  tooOld: number;
  /** The part that can still be charged: amount − tooOld, or all of it when the rule doesn't apply. */
  owed: number;
  /** True when the rule applies cleanly to the too-old part. */
  ruleApplies: boolean;
  /** Months the shortfall built up over: the suggested repayment length. */
  planMonths: number;
  /** The owed amount spread over planMonths. */
  perMonth: number;
  /** The day the eight weeks run out, when you've complained. */
  ombudsmanFrom: string;
  /** The last day to go to the ombudsman. "" in Northern Ireland, where I couldn't confirm one. */
  ombudsmanBy: string;
  /** True when the ombudsman route is open today. */
  ombudsmanOpen: boolean;
};

const CUR = "£";

function money(n: number): string {
  return formatMoney(n, CUR);
}

export function amountOf(inp: CatchupInputs): number | null {
  const n = parseMoney(inp.amount);
  return n !== null && n > 0 ? n : null;
}

function daysIn(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** The period's end: the new reading, or the bill date when none is given. */
export function periodEnd(inp: CatchupInputs): string {
  return isISODate(inp.to) ? inp.to : inp.billOn;
}

export function cutoffOf(inp: CatchupInputs): string {
  return addMonthsISO(inp.billOn, -limitMonths(inp.region));
}

/** The number of days in the period, or 0 when the dates don't make one. */
export function periodDays(inp: CatchupInputs): number {
  const end = periodEnd(inp);
  if (!isISODate(inp.from) || !isISODate(end) || inp.from >= end) return 0;
  const a = new Date(`${inp.from}T00:00:00`).getTime();
  const b = new Date(`${end}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * The share of the period's use that falls before the cut-off, weighting each
 * day by its month's share of a typical year. Days run from `from` up to, not
 * including, `end`.
 */
export function shareBefore(from: string, end: string, cutoff: string, fuel: Fuel): number {
  if (!isISODate(from) || !isISODate(end) || from >= end) return 0;
  if (cutoff <= from) return 0;
  if (cutoff >= end) return 1;
  const w = MONTH_WEIGHTS[fuel === "gas" || fuel === "electricity" ? fuel : "both"];
  let before = 0;
  let total = 0;
  let d = from;
  let guard = 0;
  while (d < end && guard < MAX_DAYS + 2) {
    const dt = new Date(`${d}T00:00:00`);
    const m = dt.getMonth();
    const x = w[m] / daysIn(dt.getFullYear(), m);
    total += x;
    if (d < cutoff) before += x;
    d = addDaysISO(d, 1);
    guard += 1;
  }
  return total > 0 ? before / total : 0;
}

function needsStageDate(s: CatchupStage): boolean {
  return s === "complained" || s === "deadlock";
}

export function catchupReady(inp: CatchupInputs): boolean {
  if (!inp.region || !inp.fuel || !inp.basis || !inp.conduct || !inp.stage) return false;
  if (amountOf(inp) === null || !isISODate(inp.billOn) || !isISODate(inp.from)) return false;
  if (inp.to && !isISODate(inp.to)) return false;
  const days = periodDays(inp);
  if (days <= 0 || days > MAX_DAYS) return false;
  if (needsStageDate(inp.stage) && !isISODate(inp.stageOn)) return false;
  return true;
}

/** Why the read isn't showing, when it's the dates that are wrong. */
export function dateProblem(inp: CatchupInputs): string {
  const end = periodEnd(inp);
  if (!isISODate(inp.from) || !isISODate(end)) return "";
  if (inp.from >= end) return "The start of the period has to be before its end.";
  if (periodDays(inp) > MAX_DAYS) return "That's a period of more than eight years. Check the start date.";
  return "";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function readCatchup(inp: CatchupInputs, today = todayISO()): CatchupRead | null {
  if (!catchupReady(inp)) return null;
  const amount = amountOf(inp) as number;
  const end = periodEnd(inp);
  const cutoff = cutoffOf(inp);
  const share = shareBefore(inp.from, end, cutoff, inp.fuel);
  const tooOld = round2(amount * share);
  const excluded = inp.conduct === "blocked" || inp.conduct === "unpaid";
  const ruleApplies = !excluded && inp.conduct !== "ignored" && tooOld > 0;
  const owed = excluded ? amount : round2(amount - tooOld);
  const planMonths = Math.max(1, Math.ceil(periodDays(inp) / 30.44));
  const perMonth = round2(owed / planMonths);

  let ombudsmanFrom = "";
  let ombudsmanBy = "";
  if (inp.stage === "complained") {
    ombudsmanFrom = addDaysISO(inp.stageOn, COMPLAINT_DAYS);
    ombudsmanBy = addDaysISO(addMonthsISO(ombudsmanFrom, OMBUDSMAN_MONTHS), -1);
  } else if (inp.stage === "deadlock") {
    ombudsmanFrom = inp.stageOn;
    ombudsmanBy = addDaysISO(addMonthsISO(inp.stageOn, OMBUDSMAN_MONTHS), -1);
  }
  // The 12-month window is the Energy Ombudsman's; I couldn't confirm one for
  // the Consumer Council in Northern Ireland, so no closing date is given there.
  if (inp.region === "ni") ombudsmanBy = "";
  const ombudsmanOpen = Boolean(ombudsmanFrom) && ombudsmanFrom <= today && (!ombudsmanBy || today <= ombudsmanBy);

  let kind: CatchupKind;
  if (inp.stage === "deadlock" || (inp.stage === "complained" && ombudsmanFrom <= today)) kind = "ombudsman";
  else if (inp.stage === "complained") kind = "wait";
  else if (inp.basis === "estimate") kind = "reading";
  else if (excluded) kind = "excluded";
  else if (tooOld <= 0) kind = "owed";
  else if (inp.conduct === "ignored") kind = "arguable";
  else kind = "backbill";

  return {
    kind,
    amount,
    cutoff,
    to: end,
    share,
    tooOld: excluded ? 0 : tooOld,
    owed,
    ruleApplies,
    planMonths,
    perMonth,
    ombudsmanFrom,
    ombudsmanBy,
    ombudsmanOpen,
  };
}

function supplierName(inp: CatchupInputs): string {
  return inp.supplier.trim() || "the supplier";
}

function greeting(inp: CatchupInputs): string {
  const who = inp.supplier.trim();
  return who && !/^the /i.test(who) ? `Dear ${who},` : "Dear Sir or Madam,";
}

function capital(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function escalation(inp: CatchupInputs): string {
  return inp.region === "ni" ? "the Consumer Council for Northern Ireland" : "the Energy Ombudsman";
}

function ruleName(inp: CatchupInputs): string {
  return inp.region === "ni"
    ? "the Utility Regulator's back-billing rule"
    : "Ofgem's back-billing rule (standard licence condition 21BA)";
}

function ruleSentence(inp: CatchupInputs): string {
  return inp.region === "ni"
    ? "Under the Utility Regulator's back-billing rule, a supplier can't bill a domestic customer for energy used more than 13 months before the bill where the shortfall arose from the supplier's own failure to bill correctly."
    : "Under Ofgem's back-billing rule (standard licence condition 21BA of your supply licence), a supplier can't bill a domestic customer for energy used more than 12 months before the date of the bill, unless the customer behaved obstructively or manifestly unreasonably.";
}

function fuelWords(inp: CatchupInputs): string {
  return inp.fuel === "gas" ? "gas" : inp.fuel === "electricity" ? "electricity" : "gas and electricity";
}

/** True when the letter disputes the bill, not only asks for time to pay. */
function disputes(inp: CatchupInputs, read: CatchupRead): boolean {
  return read.tooOld > 0 || inp.basis !== "actual";
}

/** The complaint to the supplier, written for the read's kind. */
export function complaintLetter(inp: CatchupInputs, read: CatchupRead): string {
  const lines: string[] = [greeting(inp), ""];
  const disputing = disputes(inp, read);
  lines.push(
    `Account [account number], ${fuelWords(inp)}${inp.what.trim() ? `, ${inp.what.trim()}` : ""}. I'm writing about your bill dated ${letterDate(inp.billOn)}, which asks for ${money(read.amount)} for energy used from ${letterDate(inp.from)} to ${letterDate(read.to)}.${disputing ? " Please treat this letter as a formal complaint." : ""}`,
    "",
  );
  if (inp.basis === "estimate" || inp.basis === "unsure") {
    lines.push(
      `${inp.basis === "estimate" ? "The bill is based on an estimated reading." : "The bill doesn't make clear whether it's based on a real reading."} My meter reading${inp.fuel === "both" ? "s" : ""} today ${inp.fuel === "both" ? "are" : "is"} [reading], photo attached. Please rebill on actual readings and show the readings used at each end of the period.`,
      "",
    );
  }
  if (read.tooOld > 0) {
    lines.push(ruleSentence(inp), "");
    if (inp.conduct === "ignored") {
      lines.push(
        "I accept I didn't send readings when asked. [Say why, briefly: the reminders went to an old email; the meter is in a locked cupboard; I was told the smart meter was sending them.] That isn't obstructive or manifestly unreasonable: the meter was accessible and you could have arranged a visit to read it.",
        "",
      );
    } else {
      lines.push(
        "I didn't prevent you from reading the meter. [Say how: readings sent when asked; a smart meter you installed; access given whenever asked.]",
        "",
      );
    }
    lines.push(
      `So energy used before ${letterDate(read.cutoff)} can't be charged. On a seasonal pro-rata split of the period, that's about ${money(read.tooOld)} of this bill. Please reissue the bill charging only for energy used from ${letterDate(read.cutoff)}, and show the calculation.`,
      "",
    );
  }
  if (inp.afford === "spread" || read.owed > 0) {
    lines.push(
      inp.afford === "spread"
        ? `For the part that is due, I ask for a repayment plan I can afford. The shortfall built up over ${read.planMonths} month${read.planMonths === 1 ? "" : "s"}, so I ask for it to be spread over at least that long: about ${money(read.perMonth)} a month on top of my usual payments. [Or: I can afford £__ a month.]`
        : `Once the bill is corrected, I'll pay the part that is due${read.tooOld > 0 ? `, about ${money(read.owed)}` : ""}.`,
      "",
    );
  }
  if (disputing)
    lines.push(
      "While this complaint is open, please put recovery of the disputed amount on hold and don't pass it to a debt collector. I'll keep paying for my current use.",
      "",
      `If this isn't resolved within eight weeks, I'll take it to ${escalation(inp)}.`,
      "",
    );
  lines.push(
    "Yours sincerely,",
    "[Your name]",
    "[Your address]",
  );
  return lines.join("\n");
}

/** What to paste into the ombudsman's form. */
export function ombudsmanStatement(inp: CatchupInputs, read: CatchupRead): string {
  const lines: string[] = [];
  lines.push(
    `${capital(supplierName(inp))} sent a bill dated ${letterDate(inp.billOn)} for ${money(read.amount)}, for ${fuelWords(inp)} used from ${letterDate(inp.from)} to ${letterDate(read.to)}. I complained on ${inp.stage === "complained" ? letterDate(inp.stageOn) : "[the date you complained]"}${inp.stage === "deadlock" ? `, and they sent a final response on ${letterDate(inp.stageOn)}` : ", and eight weeks have passed without a resolution"}.`,
    "",
  );
  if (read.tooOld > 0) {
    lines.push(
      `${ruleSentence(inp)} About ${money(read.tooOld)} of the bill is for energy used before ${letterDate(read.cutoff)}. ${inp.conduct === "ignored" ? "I didn't send readings when asked, but the meter was accessible and I didn't obstruct it being read." : "I didn't obstruct the meter being read."}`,
      "",
    );
  }
  if (inp.basis === "estimate") lines.push("The bill was based on an estimated reading, and I've supplied an actual one.", "");
  lines.push("I ask for:");
  const asks: string[] = [];
  if (read.tooOld > 0) asks.push(`the bill to be reissued without the charges for energy used before ${letterDate(read.cutoff)}`);
  if (inp.basis !== "actual") asks.push("the bill to be recalculated on actual readings");
  if (inp.afford === "spread") asks.push(`an affordable repayment plan for the rest, over at least ${read.planMonths} months`);
  asks.push("an apology and a goodwill payment for the time this has taken");
  for (const a of asks) lines.push(`- ${a}`);
  return lines.join("\n");
}

export function mainLetter(inp: CatchupInputs, read: CatchupRead): { title: string; text: string } | null {
  switch (read.kind) {
    case "ombudsman":
      return {
        title: inp.region === "ni" ? "For the Consumer Council" : "For the Energy Ombudsman's form",
        text: ombudsmanStatement(inp, read),
      };
    case "wait":
      return null;
    case "owed":
    case "excluded":
      if (disputes(inp, read)) return { title: "The letter to send", text: complaintLetter(inp, read) };
      return inp.afford === "spread" ? { title: "The plan request to send", text: complaintLetter(inp, read) } : null;
    default:
      return { title: "The complaint to send", text: complaintLetter(inp, read) };
  }
}

export function catchupHeadline(inp: CatchupInputs, read: CatchupRead): string {
  switch (read.kind) {
    case "reading":
      return read.tooOld > 0
        ? `Send a real reading today, and don't pay the ${money(read.tooOld)} that's too old to charge.`
        : "Send a real reading today, before you pay anything.";
    case "backbill":
      return `About ${money(read.tooOld)} of this is too old to charge. Don't pay that part.`;
    case "arguable":
      return `About ${money(read.tooOld)} is for energy used over ${limitMonths(inp.region)} months ago. Dispute it.`;
    case "owed":
      return inp.afford === "spread"
        ? `It's all inside the ${limitMonths(inp.region)} months. Ask for ${money(read.perMonth)} a month over ${read.planMonths} months.`
        : `It's all inside the ${limitMonths(inp.region)} months, so it's owed. Check the readings first.`;
    case "excluded":
      return inp.afford === "spread"
        ? `The time limit won't help here. Ask for ${money(read.perMonth)} a month over ${read.planMonths} months.`
        : "The time limit won't help here. Check the readings, then pay.";
    case "wait":
      return `Wait until ${actDate(read.ombudsmanFrom)}, then go to ${escalation(inp)}.`;
    default:
      return read.ombudsmanOpen
        ? read.ombudsmanBy
          ? `Take it to ${escalation(inp)}, by ${letterDate(read.ombudsmanBy)}.`
          : `Take it to ${escalation(inp)} now.`
        : read.ombudsmanBy && read.ombudsmanBy < todayISO()
          ? `The 12 months to go to ${escalation(inp)} have passed.`
          : `Take it to ${escalation(inp)}.`;
  }
}

export function catchupBody(inp: CatchupInputs, read: CatchupRead): string {
  const who = supplierName(inp);
  const months = limitMonths(inp.region);
  const split = `The bill covers ${letterDate(inp.from)} to ${letterDate(read.to)}. ${capital(ruleName(inp))} stops ${who} charging for energy used more than ${months} months before the bill, so anything used before ${letterDate(read.cutoff)} is off the table. That's about ${Math.round(read.share * 100)}% of the period's use, weighting each month by how much ${fuelWords(inp)} a home typically uses then: about ${money(read.tooOld)}, leaving ${money(read.owed)}.`;
  switch (read.kind) {
    case "reading":
      return `The bill is built on an estimate, so the number itself may be wrong in either direction. Photograph the meter today and send the reading, and ask for the bill to be redone on actual readings before you pay anything.${read.tooOld > 0 ? ` ${split}` : ""}`;
    case "backbill":
      return `${split} You don't have to prove the supplier was at fault; it has to show you obstructed the reading. Send the complaint below, keep paying for your current use, and don't pay the disputed part while it's open.`;
    case "arguable":
      return `${split} The catch: ${who} asked for readings and didn't get them, and a supplier can refuse the limit if a customer behaved "obstructively or manifestly unreasonably". Missing reminders is a weaker case than refusing access, and each one is judged on its facts. Dispute it anyway: the worst case is paying what the bill already says, and ${escalation(inp)} decides for free.`;
    case "owed":
      return `All of the period falls within the ${months} months before the bill, so the time limit doesn't cut anything. That doesn't make the number right: check the start and end readings against your own records or photos, and that the unit rates match your tariff.${inp.afford === "spread" ? ` ${capital(who)} must offer a plan you can afford. The shortfall built up over ${read.planMonths} months, so ask for at least that long: ${money(read.perMonth)} a month on top of your usual payment.` : ""}`;
    case "excluded":
      return `${inp.conduct === "blocked" ? "Where access to the meter was refused, or it was interfered with, the back-billing limit doesn't apply." : "If correct bills were sent at the time and weren't paid, this isn't a back-bill: the debt was billed and is owed."} Check the readings and the rates anyway.${inp.afford === "spread" ? ` ${capital(who)} must still offer a plan you can afford: ask for ${money(read.perMonth)} a month over ${read.planMonths} months, or what you can manage, and get free help from Citizens Advice or StepChange if it's more than you can pay.` : ""}`;
    case "wait":
      return `${capital(who)} has eight weeks from your complaint to fix it. Keep paying for your current use, don't pay the disputed part, and keep every letter. If they send a final "deadlock" response sooner, you can go to ${escalation(inp)} the same day. ${inp.region === "ni" ? "" : "It's free, and its decision binds the supplier if you accept it."}`.trim();
    default:
      return `${escalation(inp) === "the Energy Ombudsman" ? "The Energy Ombudsman is free, independent, and its decision binds the supplier if you accept it; you can still go to court if you don't." : "The Consumer Council for Northern Ireland takes energy complaints free once the supplier's own process is done."} Apply online with the bill, your complaint, their replies and your meter photos.${read.tooOld > 0 ? ` The case is about one date: energy used before ${letterDate(read.cutoff)} can't be charged.` : ""}${read.ombudsmanBy ? ` The window closes ${letterDate(read.ombudsmanBy)}.` : ""}`;
  }
}

/** What to keep or gather. */
export function evidenceLines(inp: CatchupInputs): string[] {
  const out: string[] = [
    "The catch-up bill, and every bill and statement for the period it covers.",
    "A photo of the meter today, with the date, and any older photos or readings you have.",
  ];
  if (inp.conduct === "fine" || inp.conduct === "ignored")
    out.push("Anything showing you didn't block a reading: emails sending readings, the smart meter install date, messages about faults.");
  out.push("Your payments over the period: the direct debit amounts from your bank statements.");
  out.push("A note of every call: the date, the name, what was said.");
  return out;
}

export function catchupRule(): string {
  return "When a big catch-up bill arrives, I check one date before I check the total: when was the energy used? Anything used more than 12 months before the bill isn't mine to pay unless I blocked the meter. I photograph the meter on the first of each quarter.";
}

export function catchupSummary(inp: CatchupInputs, read: CatchupRead): string {
  const lines: string[] = [];
  lines.push(`Catch-up energy bill${inp.what.trim() ? `: ${inp.what.trim()}` : ""}${inp.supplier.trim() ? ` (${inp.supplier.trim()})` : ""}`);
  lines.push("");
  lines.push(catchupHeadline(inp, read));
  lines.push("");
  lines.push(catchupBody(inp, read));
  lines.push("");
  lines.push(`The bill: ${money(read.amount)}. Too old to charge: ${money(read.tooOld)}. Can be charged: ${money(read.owed)}.`);
  if (read.ombudsmanFrom)
    lines.push(`${capital(escalation(inp))} from ${letterDate(read.ombudsmanFrom)}${read.ombudsmanBy ? ` to ${letterDate(read.ombudsmanBy)}` : ""}.`);
  const msg = mainLetter(inp, read);
  if (msg) {
    lines.push("", `${msg.title}:`, "", msg.text);
  }
  lines.push("", catchupRule());
  return lines.join("\n");
}

const REGIONS: Region[] = ["gb", "ni"];
const FUELS: Fuel[] = ["gas", "electricity", "both"];
const BASES: Basis[] = ["actual", "estimate", "unsure"];
const CONDUCTS: Conduct[] = ["fine", "ignored", "blocked", "unpaid"];
const STAGES: CatchupStage[] = ["new", "complained", "deadlock"];
const AFFORDS: Afford[] = ["lump", "spread"];

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
export function parseCatchupInputs(raw: unknown): CatchupInputs {
  if (!raw || typeof raw !== "object") return BLANK_CATCHUP;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what),
    supplier: str(v.supplier),
    region: oneOf(v.region, REGIONS),
    fuel: oneOf(v.fuel, FUELS),
    amount: str(v.amount, 40),
    billOn: date(v.billOn),
    from: date(v.from),
    to: date(v.to),
    basis: oneOf(v.basis, BASES),
    conduct: oneOf(v.conduct, CONDUCTS),
    stage: oneOf(v.stage, STAGES),
    stageOn: date(v.stageOn),
    afford: oneOf(v.afford, AFFORDS),
  };
}

/**
 * The worked example: a smart meter that stopped sending readings in the
 * spring before last, a direct debit set from estimates, and an engineer's
 * reading this month.
 */
export const CATCHUP_EXAMPLE: CatchupInputs = {
  what: "the flat on Elm Road",
  supplier: "",
  region: "gb",
  fuel: "both",
  amount: "£1,840",
  billOn: "",
  from: "",
  to: "",
  basis: "actual",
  conduct: "fine",
  stage: "new",
  stageOn: "",
  afford: "spread",
};

/** The example's dates, relative to today: twenty months unbilled. */
export function catchupExample(today = todayISO()): CatchupInputs {
  const billOn = addDaysISO(today, -3);
  return { ...CATCHUP_EXAMPLE, billOn, from: addMonthsISO(billOn, -20), to: addDaysISO(billOn, -6) };
}
