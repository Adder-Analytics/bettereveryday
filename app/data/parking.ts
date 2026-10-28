/**
 * The read behind "Parking Ticket: Pay or Appeal?" (/parking).
 *
 * A ticket on the windscreen, or a letter a week later with a photo of your
 * number plate. Most people do one of two things: pay the discount at once to
 * make it go away, or bin it and hope. The first often throws away a free
 * appeal; the second is how a £60 charge becomes £170 and a county court
 * claim.
 *
 * The decision turns on one sum: what does appealing cost if you lose?
 *
 *   - Council tickets (Penalty Charge Notices) are statutory. Pay within 14
 *     days (21 for a camera ticket sent by post) and it's halved. Most
 *     councils hold the discount while they consider a challenge sent inside
 *     that window, and re-offer it if they reject it. After a Notice to Owner,
 *     the discount has gone, and the formal representations and then the
 *     independent tribunal are free: if you lose, you pay the same full amount
 *     you'd pay now. So from there an appeal on any real ground costs nothing.
 *     What costs money is ignoring it: a charge certificate adds 50%, then it
 *     is registered as a debt and bailiffs can follow.
 *   - Private tickets (Parking Charge Notices, from a company on private land)
 *     are invoices under contract law, capped at £100 by the industry code and
 *     reduced by 40% if paid within 14 days. The first appeal is to the
 *     operator, within 28 days; most re-offer the discount if they reject it.
 *     The independent appeal (POPLA for BPA members, the IAS for IPC members)
 *     is free but usually costs the discount: lose, and you owe the full
 *     amount. So it's worth it when your chance of winning beats the break-even,
 *     extra ÷ full: 40% for £60 against £100. POPLA cancels about 40% of the
 *     appeals that complete its process (2022–24 annual reports), so a real
 *     ground clears that bar and no ground doesn't.
 *   - In England and Wales a private operator can pursue the registered keeper
 *     only if it follows Schedule 4 of the Protection of Freedoms Act 2012. For
 *     a camera ticket with nothing on the windscreen, the notice to keeper has
 *     to be given within 14 days of the parking; a posted notice counts as
 *     given on the second working day after posting. Late, and the keeper
 *     isn't liable unless the driver is named. In Scotland and Northern
 *     Ireland there's no keeper liability in force (Part 8 of the Transport
 *     (Scotland) Act 2019 hadn't commenced, as far as I could confirm), so the
 *     operator has to show who was driving.
 *   - Ignoring a private charge ends in a letter before claim (30 days to reply
 *     under the Pre-Action Protocol for Debt Claims) and then a county court
 *     claim. A claim ignored becomes a default judgment, a CCJ, on your credit
 *     file for six years unless paid within a month.
 *
 * The new government Private Parking Code of Practice was laid on 20 October
 * 2026 and isn't in force yet; it keeps the £100 cap and the 40% discount for
 * now. Charges are judged under the rules on the day of the parking.
 *
 * The read, by stage:
 *   council: challenge → wait → again → reps → tribunal → certificate → recovery
 *   private: appeal → wait → independent → debt → claimletter → court
 *   either:  pay, when there's no ground and nothing to gain from trying.
 *
 * Dates are conservative: the day on the notice counts as day one, so the
 * tool's "by" date is never later than the real one.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";
import { actDate, addDaysISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, todayISO };

export type Ticket = "" | "council" | "private" | "unsure";
export type Place = "" | "london" | "england" | "wales" | "scotland" | "ni";
export type How = "" | "car" | "post";
export type Stage =
  | ""
  | "new"
  | "waiting"
  | "rejected"
  | "nto"
  | "refused"
  | "certificate"
  | "recovery"
  | "debt"
  | "lbc"
  | "claim";
export type Ground = "paid" | "grace" | "wrong" | "sold" | "signs" | "loading" | "emergency" | "none";
export type Driver = "" | "me" | "other" | "unsaid";

export type ParkingInputs = {
  /** Where, in a few words: "the retail park on Mill Lane". */
  what: string;
  /** The council or company on the notice. */
  issuer: string;
  ticket: Ticket;
  place: Place;
  how: How;
  /** ISO date of the parking. */
  parkedOn: string;
  /** ISO date printed on the notice. */
  issuedOn: string;
  full: string;
  /** The reduced amount, as typed; blank means the usual discount. */
  discount: string;
  stage: Stage;
  /** ISO date on the latest letter: the rejection, the Notice to Owner, the claim's date of service. */
  stageOn: string;
  grounds: Ground[];
  /** What happened, in a sentence or two, for the letter. */
  detail: string;
  /** Private tickets: who was driving. */
  driver: Driver;
};

export const BLANK_PARKING: ParkingInputs = {
  what: "",
  issuer: "",
  ticket: "",
  place: "",
  how: "",
  parkedOn: "",
  issuedOn: "",
  full: "",
  discount: "",
  stage: "",
  stageOn: "",
  grounds: [],
  detail: "",
  driver: "",
};

/** A first challenge or appeal: 28 days from the notice. */
export const APPEAL_DAYS = 28;
/** The discount window: 14 days, or 21 for a council camera ticket by post. */
export const DISCOUNT_DAYS = 14;
export const POSTAL_DISCOUNT_DAYS = 21;
/** Schedule 4: the notice to keeper must be given within 14 days of the parking. */
export const KEEPER_DAYS = 14;
/** A charge certificate adds half again. */
export const CERTIFICATE_UPLIFT = 0.5;
/** The industry cap on the debt-recovery fee added to a private charge. */
export const RECOVERY_FEE_CAP = 70;
/** The Pre-Action Protocol for Debt Claims gives 30 days to reply to a letter before claim. */
export const LBC_DAYS = 30;
/** An Order for Recovery: 21 days to pay or file a witness statement. */
export const RECOVERY_DAYS = 21;

export type Strength = "strong" | "fair" | "none";

export type ParkingKind =
  | "pay"
  | "challenge"
  | "appeal"
  | "wait"
  | "again"
  | "reps"
  | "tribunal"
  | "independent"
  | "certificate"
  | "recovery"
  | "debt"
  | "claimletter"
  | "court";

export type ParkingRead = {
  kind: ParkingKind;
  ticket: "council" | "private";
  strength: Strength;
  full: number;
  discount: number;
  /** True when the discount was worked out, not typed. */
  discountAssumed: boolean;
  /** What paying costs, on the path where you pay now. */
  payNow: number;
  /** The last day to pay that amount. "" when there's nothing to pay yet. */
  payBy: string;
  /** What you'd owe if you appeal and lose. */
  ifLose: number;
  /** What trying costs on top of paying now: ifLose − payNow. 0 means free. */
  extra: number;
  /** The worst case for `extra`, when the discount usually comes back but might not. */
  extraWorst: number;
  /** The chance of winning at which appealing and paying break even, 0–1. */
  breakEven: number;
  /** The last day for the next step: the appeal, the reply, the acknowledgment. */
  actBy: string;
  /** The day the discount runs out, when it's still in play. */
  discountEnds: string;
  /** Private, by post, England and Wales: the notice to keeper was late. null when it can't be judged. */
  keeperLate: boolean | null;
  /** Private: the keeper can't be held liable without the driver being named. */
  keeperFree: boolean;
  /** True when the date for the next step has already passed. */
  pastDue: boolean;
};

const CUR = "£";

function money(n: number): string {
  return formatMoney(n, CUR);
}

function pct(p: number): string {
  return `${Math.round(p * 100)}%`;
}

/** "2 in 5", "1 in 3": a chance in words, for the headline. */
export function chanceWords(p: number): string {
  if (p <= 0) return "any";
  const tries: [number, number][] = [
    [1, 5], [1, 4], [1, 3], [2, 5], [1, 2], [3, 5], [2, 3], [3, 4], [4, 5],
  ];
  let best = tries[0];
  for (const t of tries) if (Math.abs(t[0] / t[1] - p) < Math.abs(best[0] / best[1] - p)) best = t;
  return `${best[0]} in ${best[1]}`;
}

/** Add n working days (Monday to Friday; bank holidays aren't counted). */
export function addWorkingDaysISO(iso: string, n: number): string {
  let d = iso;
  let left = n;
  while (left > 0) {
    d = addDaysISO(d, 1);
    const day = new Date(`${d}T00:00:00`).getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return d;
}

export function fullOf(inp: ParkingInputs): number | null {
  const n = parseMoney(inp.full);
  return n !== null && n > 0 ? n : null;
}

function ticketOf(inp: ParkingInputs): "council" | "private" | null {
  return inp.ticket === "council" || inp.ticket === "private" ? inp.ticket : null;
}

/** The reduced amount: typed, or the usual (half for a council, 40% off for a private operator). */
export function discountOf(inp: ParkingInputs): { amount: number; assumed: boolean } | null {
  const full = fullOf(inp);
  if (full === null) return null;
  const typed = parseMoney(inp.discount);
  if (typed !== null && typed > 0 && typed <= full) return { amount: typed, assumed: false };
  const t = ticketOf(inp);
  return { amount: Math.round(full * (t === "council" ? 0.5 : 0.6) * 100) / 100, assumed: true };
}

export function discountDays(inp: ParkingInputs): number {
  return inp.ticket === "council" && inp.how === "post" ? POSTAL_DISCOUNT_DAYS : DISCOUNT_DAYS;
}

function inEnglandOrWales(p: Place): boolean {
  return p === "london" || p === "england" || p === "wales";
}

/**
 * Schedule 4: a camera ticket with nothing on the windscreen has to reach the
 * keeper within 14 days, counting from the day after the parking. A posted
 * notice is taken as given on the second working day after posting, and we
 * take the date on it as the posting date.
 */
export function keeperNoticeLate(inp: ParkingInputs): boolean | null {
  if (inp.ticket !== "private" || inp.how !== "post" || !inEnglandOrWales(inp.place)) return null;
  if (!isISODate(inp.parkedOn) || !isISODate(inp.issuedOn)) return null;
  const given = addWorkingDaysISO(inp.issuedOn, 2);
  return given > addDaysISO(inp.parkedOn, KEEPER_DAYS);
}

const STRONG: Ground[] = ["paid", "grace", "wrong", "sold"];
const FAIR: Ground[] = ["signs", "loading", "emergency"];

/** Can the registered keeper refuse to pay without naming the driver? */
export function keeperFreeOf(inp: ParkingInputs): boolean {
  if (inp.ticket !== "private") return false;
  if (keeperNoticeLate(inp) === true) return true;
  return (inp.place === "scotland" || inp.place === "ni") && (inp.driver === "other" || inp.driver === "unsaid");
}

export function strengthOf(inp: ParkingInputs): Strength {
  if (keeperFreeOf(inp)) return "strong";
  const g = inp.grounds;
  // The council grace period is statutory only in England.
  const graceStrong = inp.ticket === "private" || inp.place === "england" || inp.place === "london";
  if (g.some((x) => STRONG.includes(x) && (x !== "grace" || graceStrong))) return "strong";
  if (g.some((x) => FAIR.includes(x) || x === "grace")) return "fair";
  return "none";
}

export function stagesFor(t: Ticket): { id: Stage; label: string }[] {
  if (t === "council")
    return [
      { id: "new", label: "I've just got the ticket" },
      { id: "waiting", label: "I've challenged it and I'm waiting" },
      { id: "rejected", label: "They've rejected my challenge" },
      { id: "nto", label: "A Notice to Owner has arrived" },
      { id: "refused", label: "They've rejected my formal representations" },
      { id: "certificate", label: "A Charge Certificate has arrived (it's gone up by half)" },
      { id: "recovery", label: "An Order for Recovery, or a bailiff's letter" },
    ];
  if (t === "private")
    return [
      { id: "new", label: "I've just got the ticket or letter" },
      { id: "waiting", label: "I've appealed to the company and I'm waiting" },
      { id: "rejected", label: "They've rejected my appeal" },
      { id: "debt", label: "A debt collector is writing to me" },
      { id: "lbc", label: "A letter before claim has arrived" },
      { id: "claim", label: "A court claim form has arrived" },
    ];
  return [];
}

function needsGrounds(s: Stage): boolean {
  return s !== "certificate" && s !== "recovery" && s !== "claim" && s !== "waiting";
}

export function parkingReady(inp: ParkingInputs): boolean {
  const t = ticketOf(inp);
  if (!t || !inp.place || !inp.how || !inp.stage) return false;
  if (!stagesFor(t).some((s) => s.id === inp.stage)) return false;
  if (fullOf(inp) === null || !isISODate(inp.issuedOn)) return false;
  if (inp.stage !== "new" && !isISODate(inp.stageOn)) return false;
  if (needsGrounds(inp.stage) && inp.grounds.length === 0) return false;
  return true;
}

export function readParking(inp: ParkingInputs, today = todayISO()): ParkingRead | null {
  if (!parkingReady(inp)) return null;
  const ticket = ticketOf(inp) as "council" | "private";
  const full = fullOf(inp) as number;
  const disc = discountOf(inp) as { amount: number; assumed: boolean };
  const D = disc.amount;
  const strength = strengthOf(inp);
  const keeperLate = keeperNoticeLate(inp);
  const keeperFree = keeperFreeOf(inp);
  const discountEnds = addDaysISO(inp.issuedOn, discountDays(inp) - 1);
  const appealBy = addDaysISO(inp.issuedOn, APPEAL_DAYS - 1);
  const inDiscount = today <= discountEnds;
  const at = inp.stageOn;

  const base = {
    ticket,
    strength,
    full,
    discount: D,
    discountAssumed: disc.assumed,
    keeperLate,
    keeperFree,
  };

  let kind: ParkingKind;
  let payNow = full;
  let payBy = "";
  let ifLose = full;
  let extraWorst = 0;
  let actBy = "";
  let discountEndsOut = "";

  switch (inp.stage) {
    case "new": {
      payNow = inDiscount ? D : full;
      payBy = inDiscount ? discountEnds : appealBy;
      discountEndsOut = inDiscount ? discountEnds : "";
      actBy = appealBy;
      if (strength === "none") {
        kind = "pay";
        ifLose = payNow;
      } else if (ticket === "council") {
        kind = "challenge";
        // Most councils hold the discount for a challenge sent inside the window.
        ifLose = payNow;
        if (inDiscount) actBy = discountEnds;
      } else {
        kind = "appeal";
        // Most operators re-offer the discount for 14 days if they reject.
        ifLose = payNow;
        extraWorst = full - payNow;
        if (inDiscount) actBy = discountEnds;
      }
      break;
    }
    case "waiting": {
      kind = "wait";
      payNow = D;
      ifLose = D;
      extraWorst = ticket === "private" ? full - D : 0;
      actBy = "";
      break;
    }
    case "rejected": {
      // Most rejections re-offer the discount for 14 days from the letter.
      const reOffer = addDaysISO(at, DISCOUNT_DAYS - 1);
      const still = today <= reOffer;
      payNow = still ? D : full;
      ifLose = full;
      if (ticket === "council") {
        // Not paying means waiting for the Notice to Owner; the discount goes.
        kind = strength === "none" ? "pay" : "again";
        payBy = still ? reOffer : "";
        actBy = strength === "none" ? payBy : "";
      } else {
        kind = strength === "none" ? "pay" : "independent";
        payBy = still ? reOffer : addDaysISO(at, APPEAL_DAYS - 1);
        actBy = strength === "none" ? payBy : addDaysISO(at, APPEAL_DAYS - 1);
      }
      break;
    }
    case "nto": {
      kind = strength === "none" ? "pay" : "reps";
      payNow = full;
      ifLose = full;
      actBy = addDaysISO(at, APPEAL_DAYS - 1);
      payBy = actBy;
      break;
    }
    case "refused": {
      kind = strength === "none" ? "pay" : "tribunal";
      payNow = full;
      ifLose = full;
      actBy = addDaysISO(at, APPEAL_DAYS - 1);
      payBy = actBy;
      break;
    }
    case "certificate": {
      kind = "certificate";
      payNow = full * (1 + CERTIFICATE_UPLIFT);
      ifLose = payNow;
      actBy = addDaysISO(at, DISCOUNT_DAYS - 1);
      payBy = actBy;
      break;
    }
    case "recovery": {
      kind = "recovery";
      payNow = full * (1 + CERTIFICATE_UPLIFT);
      ifLose = payNow;
      actBy = addDaysISO(at, RECOVERY_DAYS - 1);
      payBy = actBy;
      break;
    }
    case "debt": {
      kind = "debt";
      payNow = full;
      ifLose = full;
      actBy = "";
      break;
    }
    case "lbc": {
      kind = "claimletter";
      payNow = full;
      ifLose = full;
      actBy = addDaysISO(at, LBC_DAYS - 1);
      break;
    }
    default: {
      kind = "court";
      payNow = full;
      ifLose = full;
      // The date of service on the form: 14 days to acknowledge, 28 to defend.
      // Scotland and Northern Ireland run different procedures: the form gives the date.
      actBy = inEnglandOrWales(inp.place) ? addDaysISO(at, 14 - 1) : "";
      break;
    }
  }

  const extra = Math.max(0, Math.round((ifLose - payNow) * 100) / 100);
  return {
    ...base,
    kind,
    payNow,
    payBy,
    ifLose,
    extra,
    extraWorst: Math.max(extra, Math.round(extraWorst * 100) / 100),
    breakEven: ifLose > 0 ? extra / ifLose : 0,
    actBy,
    discountEnds: discountEndsOut,
    pastDue: Boolean(actBy) && actBy < today,
  };
}

export function tribunalName(inp: ParkingInputs): string {
  switch (inp.place) {
    case "london":
      return "London Tribunals";
    case "scotland":
      return "the First-tier Tribunal for Scotland";
    case "ni":
      return "the Northern Ireland Traffic Penalty Tribunal";
    default:
      return "the Traffic Penalty Tribunal";
  }
}

function issuerName(inp: ParkingInputs): string {
  return inp.issuer.trim() || (inp.ticket === "council" ? "the council" : "the parking company");
}

function greeting(inp: ParkingInputs): string {
  const who = inp.issuer.trim();
  return who && !/^the /i.test(who) ? `Dear ${who},` : "Dear Sir or Madam,";
}

function capital(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function placeWords(inp: ParkingInputs): string {
  return inp.what.trim() || "[where you parked]";
}

const GROUND_LINES: Record<Exclude<Ground, "none">, { council: string; private: string }> = {
  paid: {
    council:
      "I had paid for this parking, or held a valid permit or badge, at the time. [Say how: the receipt, the app's confirmation, the permit number.] A copy is attached.",
    private:
      "Parking had been paid for, or a valid permit was held, at the time. [Say how: the receipt, the app's confirmation, the permit number.] If the registration was keyed wrongly, the payment still shows the vehicle was entitled to park, and the operator suffered no loss.",
  },
  grace: {
    council:
      "The vehicle was there no more than ten minutes after the paid-for or permitted time ended. The law gives a ten-minute grace period at the end of paid and limited-time parking, so no penalty charge should have been issued.",
    private:
      "The vehicle was there no more than ten minutes after the paid-for or permitted time ended, or left within the few minutes needed to read the signs and decide not to stay. The industry code requires a grace period for both.",
  },
  wrong: {
    council:
      "The penalty charge notice is wrong on its face: [the registration / the location / the time / the contravention code] doesn't match what happened. The contravention didn't occur as described.",
    private:
      "The notice is wrong: [the registration / the location / the times] don't match what happened. The photos or records relied on need to be produced and checked.",
  },
  sold: {
    council:
      "I wasn't the owner of the vehicle at the time: it had been [sold / stolen / on hire to someone else]. [Give the date and the buyer's or hire company's details, or the crime reference.]",
    private:
      "I wasn't the keeper of the vehicle at the time: it had been [sold / stolen / on hire to someone else]. [Give the date and the buyer's or hire company's details, or the crime reference.]",
  },
  signs: {
    council:
      "The restriction wasn't properly signed or marked: [the sign was missing / hidden / faded; the lines were worn / absent]. Photos are attached. A restriction that isn't adequately signed can't be enforced.",
    private:
      "The terms weren't displayed clearly enough to form a contract with the driver: [the signs were missing / too small to read from a car / hidden / not at the entrance]. Photos are attached. Without prominent terms, no contract and no charge.",
  },
  loading: {
    council:
      "The vehicle was being loaded or unloaded, or a passenger was being dropped off or picked up, which this restriction allows. [Say what, for how long, and who can confirm it.]",
    private:
      "The vehicle was stopped only to load or unload, or to drop off or pick up a passenger, which isn't parking. [Say what, for how long, and who can confirm it.]",
  },
  emergency: {
    council:
      "The vehicle was there because of something outside my control: [the breakdown / the medical emergency / the hold-up]. Evidence is attached. I ask the council to use its discretion to cancel the charge.",
    private:
      "The vehicle was there because of something outside the driver's control: [the breakdown / the medical emergency / the hold-up]. Evidence is attached. These are the mitigating circumstances the industry code asks operators to take into account.",
  },
};

function groundLines(inp: ParkingInputs): string[] {
  const t = inp.ticket === "council" ? "council" : "private";
  return inp.grounds.filter((g): g is Exclude<Ground, "none"> => g !== "none").map((g) => GROUND_LINES[g][t]);
}

function keeperLines(inp: ParkingInputs, read: ParkingRead): string[] {
  if (read.ticket !== "private") return [];
  const out: string[] = [];
  if (read.keeperLate) {
    out.push(
      `I'm the registered keeper. The parking was on ${letterDate(inp.parkedOn)} and the notice is dated ${letterDate(inp.issuedOn)}, so it was given more than 14 days after the parking. Under paragraph 9 of Schedule 4 to the Protection of Freedoms Act 2012, the keeper can't be held liable, and I'm not obliged to name the driver.`,
    );
  } else if (read.keeperFree) {
    out.push(
      "I'm the registered keeper. There's no keeper liability for private parking charges here, so the charge can only be pursued against the driver, and I'm not obliged to say who that was.",
    );
  } else {
    out.push("I'm writing as the registered keeper.");
  }
  return out;
}

function detailLine(inp: ParkingInputs): string[] {
  const d = inp.detail.trim();
  return d ? [d.endsWith(".") || d.endsWith("!") ? d : `${d}.`] : [];
}

function refLine(inp: ParkingInputs): string {
  const kind = inp.ticket === "council" ? "penalty charge notice" : "parking charge";
  return `${kind} [reference number], dated ${letterDate(inp.issuedOn)}, for vehicle [registration] at ${placeWords(inp)}`;
}

/** The council letter: the informal challenge, the formal representations, or the tribunal statement. */
export function councilMessage(inp: ParkingInputs, read: ParkingRead): string {
  const lines: string[] = [];
  const formal = read.kind === "reps";
  const tribunal = read.kind === "tribunal";
  if (!tribunal) lines.push(greeting(inp), "");
  lines.push(
    tribunal
      ? `I appeal against ${refLine(inp)}.`
      : formal
        ? `I make formal representations against ${refLine(inp)}.`
        : `I'm challenging ${refLine(inp)}.`,
    "",
  );
  for (const l of [...detailLine(inp), ...groundLines(inp)]) lines.push(l, "");
  if (read.kind === "challenge" && read.discountEnds) {
    lines.push(
      "I ask you to cancel it. If you don't, please re-offer the reduced amount for 14 days from your reply, as this challenge is made inside the discount period.",
    );
  } else if (tribunal) {
    lines.push("I ask the adjudicator to allow the appeal and cancel the charge.");
  } else {
    lines.push("I ask you to cancel it.");
  }
  if (!tribunal) lines.push("", "Yours faithfully,", "[Your name]", "[Your address]");
  return lines.join("\n");
}

/** The private letter: the appeal to the operator, or the statement for POPLA or the IAS. */
export function privateMessage(inp: ParkingInputs, read: ParkingRead): string {
  const independent = read.kind === "independent";
  const lines: string[] = [];
  if (!independent) lines.push(greeting(inp), "");
  lines.push(
    independent
      ? `I appeal against ${refLine(inp)}, issued by ${issuerName(inp)}.`
      : `I'm appealing against ${refLine(inp)}.`,
    "",
  );
  for (const l of [...keeperLines(inp, read), ...detailLine(inp), ...groundLines(inp)]) lines.push(l, "");
  if (independent) {
    lines.push(
      "I also ask the operator to produce its contract with the landowner, showing it has the authority to issue and pursue charges on this land, and photos of the signs as they stood on the day.",
      "",
      "I ask for the appeal to be allowed and the charge cancelled.",
    );
  } else {
    lines.push(
      "Please cancel the charge. If you reject this appeal, please send the code for the independent appeals service, and don't pass the charge to a debt collector while the appeal is open.",
      "",
      "Yours faithfully,",
      "[Your name]",
      "[Your address]",
    );
  }
  return lines.join("\n");
}

/** The reply to a letter before claim, or to a debt collector. */
export function disputeMessage(inp: ParkingInputs, read: ParkingRead): string {
  const lines: string[] = [greeting(inp), ""];
  lines.push(`I dispute ${refLine(inp)}${read.kind === "debt" ? "" : ", and the claim you say you'll bring"}.`, "");
  for (const l of [...keeperLines(inp, read), ...detailLine(inp), ...groundLines(inp)]) lines.push(l, "");
  if (read.kind === "claimletter") {
    lines.push(
      "Under the Pre-Action Protocol for Debt Claims, please send me copies of: the photos of the vehicle; the wording and positions of the signs on the day; your contract with the landowner; and a breakdown of the amount claimed, including any added fees and the basis for them.",
      "",
      "Please don't start proceedings while I'm waiting for these documents. I'll reply in full within 30 days of receiving them.",
    );
  } else {
    lines.push(
      "Please deal with me directly, not through a collection agent, and send copies of the photos, the signs and the basis for any added fee. I won't pay a charge I've disputed, or a fee added to it.",
    );
  }
  lines.push("", "Yours faithfully,", "[Your name]", "[Your address]");
  return lines.join("\n");
}

export function mainMessage(inp: ParkingInputs, read: ParkingRead): { title: string; text: string } | null {
  switch (read.kind) {
    case "challenge":
      return { title: "The challenge to send", text: councilMessage(inp, read) };
    case "reps":
      return { title: "The formal representations", text: councilMessage(inp, read) };
    case "tribunal":
      return { title: `The statement for ${tribunalName(inp)}`, text: councilMessage(inp, read) };
    case "again":
      return { title: "For the Notice to Owner, if you wait for it", text: councilMessage(inp, { ...read, kind: "reps" }) };
    case "appeal":
      return { title: "The appeal to send", text: privateMessage(inp, read) };
    case "independent":
      return { title: "The statement for POPLA or the IAS", text: privateMessage(inp, read) };
    case "claimletter":
    case "debt":
      return { title: read.kind === "debt" ? "The letter to the company" : "The reply to the letter before claim", text: disputeMessage(inp, read) };
    default:
      return null;
  }
}

export function parkingHeadline(inp: ParkingInputs, read: ParkingRead): string {
  const by = read.actBy ? actDate(read.actBy) : "";
  switch (read.kind) {
    case "pay":
      return read.payBy ? `Pay ${money(read.payNow)} by ${actDate(read.payBy)}.` : `Pay ${money(read.payNow)}.`;
    case "challenge":
    case "reps":
    case "tribunal":
      return read.pastDue
        ? `The deadline has passed. Send it today and ask them to accept it late.`
        : `Appeal by ${by}: losing costs you nothing extra.`;
    case "appeal":
      return read.pastDue
        ? `The 28 days have passed. Send it today anyway.`
        : `Appeal by ${by}: it should cost you nothing extra.`;
    case "wait":
      return "Wait for their answer. Don't pay, and don't ignore the reply.";
    case "again":
      return read.extra > 0
        ? `Pay ${money(read.payNow)} by ${actDate(read.payBy)}, or wait for the Notice to Owner if your chance is better than ${chanceWords(read.breakEven)}.`
        : "Don't pay yet: wait for the Notice to Owner. Losing costs nothing extra.";
    case "independent":
      return read.pastDue
        ? `The 28 days for the independent appeal have passed.`
        : read.extra > 0
          ? `Appeal by ${by} if your chance is better than ${chanceWords(read.breakEven)}.`
          : `Appeal by ${by}: losing costs you nothing extra.`;
    case "certificate":
      return `Pay ${money(read.payNow)} by ${actDate(read.payBy)}. The chance to appeal has gone.`;
    case "recovery":
      return `Act by ${by}: pay ${money(read.payNow)}, or file a witness statement if you have grounds.`;
    case "debt":
      return "The debt collector can't do anything. Write to the company, not the collector.";
    case "claimletter":
      return `Reply in writing by ${by}. Don't ignore it.`;
    default:
      return by ? `Acknowledge the claim by ${by}. Don't ignore it.` : "Respond to the claim by the date on the form. Don't ignore it.";
  }
}

export function parkingBody(inp: ParkingInputs, read: ParkingRead): string {
  const council = read.ticket === "council";
  const who = issuerName(inp);
  const keeper = read.keeperLate
    ? ` The notice reached you more than 14 days after the parking, so as the keeper you aren't liable unless you name the driver. Don't.`
    : read.keeperFree
      ? ` There's no keeper liability here, so the company has to show who was driving.`
      : "";
  switch (read.kind) {
    case "pay": {
      const tail =
        inp.stage === "new" && read.discountEnds
          ? ` That's the discount; after ${actDate(read.discountEnds)} it's ${money(read.full)}.`
          : "";
      return `You've said there's no ground: you were in the wrong, the signs were clear, and nothing went wrong with paying. Appealing anyway mostly delays you into the full amount, so pay the smallest number on offer, from ${who}'s own website or the number on the notice.${tail} Never ignore it: ${council ? "unpaid, it goes up by half and is registered as a debt" : "unpaid, it gains a debt collector's fee of up to £70 and ends in a county court claim"}.`;
    }
    case "challenge":
      return `You have a ${read.strength === "strong" ? "strong" : "reasonable"} ground. Most councils hold the ${money(read.discount)} discount while they consider a challenge sent inside the ${discountDays(inp)} days, and re-offer it if they say no, so appealing costs you nothing: win and you pay nothing, lose and you pay the same ${money(read.payNow)} you'd pay today. Check the notice or the council's website says so. Send it in writing, with photos, before ${read.discountEnds ? actDate(read.discountEnds) : actDate(read.actBy)}.`;
    case "appeal":
      return `You have a ${read.strength === "strong" ? "strong" : "reasonable"} ground.${keeper} Appeal to ${who} in writing within 28 days, and before ${read.discountEnds ? actDate(read.discountEnds) : "the discount ends"} if you can. Most operators re-offer the ${money(read.discount)} discount for 14 days if they reject an appeal, so trying usually costs nothing. If yours doesn't, the worst case is ${money(read.extraWorst)} more. If they reject it, they must give you a code for the free independent appeal.`;
    case "wait":
      return council
        ? `The council should reply, usually within a few weeks. If it rejects the challenge, it normally re-offers the discount for 14 days. If it accepts, that's the end of it. Keep the dates: if you hear nothing and a Notice to Owner arrives instead, make formal representations within 28 days.`
        : `The company should reply within 28 days. If it rejects the appeal, it must send a code for POPLA or the IAS, and most re-offer the discount for 14 days. Don't pay a debt collector while the appeal is open; reply only to the company.`;
    case "again":
      if (read.extra === 0)
        return `The council said no, and the discount has gone, so you'd pay ${money(read.full)} now or later. Wait for the Notice to Owner, then make formal representations within 28 days and, if they're rejected, appeal to ${tribunalName(inp)}. Both are free, and losing costs the same ${money(read.full)}.`;
      return `The council said no. You can pay the re-offered ${money(read.discount)} by ${actDate(read.payBy)}, or not pay and wait for the Notice to Owner, then make formal representations and, if they're rejected, appeal to ${tribunalName(inp)}. That route is free, but the discount goes: lose, and you pay ${money(read.full)}, ${money(read.extra)} more. So it's worth it if your chance of winning is better than ${pct(read.breakEven)}. An independent adjudicator reads it fresh; the council's first answer isn't the last word.`;
    case "reps":
      return `The discount has gone, so paying now costs ${money(read.full)}, and that's also the most you'll pay if you make representations and lose: they're free, and so is the appeal to ${tribunalName(inp)} after. So any real ground is worth putting in. Send them by ${actDate(read.actBy)}; after that the charge goes up by half.`;
    case "tribunal":
      return `Appealing to ${tribunalName(inp)} is free and independent of the council, and if you lose you pay ${money(read.full)}, what you'd pay today. You'll usually get 28 days to pay after the decision. Appeal online by ${actDate(read.actBy)}, with your photos and the council's rejection letter.`;
    case "independent":
      return read.extra > 0
        ? `${capital(who)} rejected it.${keeper} The independent appeal (POPLA if they're in the British Parking Association, the IAS if they're in the IPC; the letter gives the code) is free, but appealing usually gives up the ${money(read.discount)} discount: lose, and you owe ${money(read.full)}, ${money(read.extra)} more. That's worth it if your chance is better than ${pct(read.breakEven)}. POPLA cancels about 40% of the appeals that complete its process, and a ${read.strength === "strong" ? "strong" : "reasonable"} ground puts you ${read.strength === "strong" ? "well above that" : "near it"}. Otherwise, pay ${money(read.discount)} by ${actDate(read.payBy)} if the letter re-offers it.`
        : `${capital(who)} rejected it, and the discount has gone, so the free independent appeal costs nothing extra: lose and you pay ${money(read.full)}, what you'd pay now.${keeper} Use the code in the rejection letter (POPLA or the IAS) by ${actDate(read.actBy)}.`;
    case "certificate":
      return `The Charge Certificate means the time for representations has passed, and the charge has gone up by half, to ${money(read.payNow)}. Pay it within 14 days, by ${actDate(read.payBy)}, or it's registered as a debt and a court fee is added. One exception: if you never received the Notice to Owner, or made representations or appealed and got no answer, wait for the Order for Recovery and file a witness statement saying so.`;
    case "recovery":
      return inp.place === "scotland" || inp.place === "ni"
        ? `The charge is now being recovered as a debt. Call ${who} today, and get free advice from Citizens Advice before the deadline.`
        : `The charge has been registered at the Traffic Enforcement Centre. You have 21 days to pay ${money(read.payNow)} plus the court fee, or to file a witness statement (form TE9) on one of its grounds: you never got the Notice to Owner, you made representations or appealed and heard nothing, or you'd already paid. Filing it truthfully sends the case back to the council. A false statement is a criminal offence. If the date has passed, ask for form TE7 to file late. After that, bailiffs can be instructed, and their fees start at £75.`;
    case "debt":
      return `A debt collector has no more power than the company: it can't take anything, can't add a CCJ, and can't send bailiffs. Only a court can. The fee it adds (capped at £${RECOVERY_FEE_CAP} by the industry code) is disputed, and you don't have to deal with the collector.${keeper} If you have a ground, write once to ${who} disputing the charge and keep a copy. Then watch the post for a letter before claim, which you must answer.`;
    case "claimletter":
      return `This is the step before a court claim, and the one to answer. The Pre-Action Protocol for Debt Claims gives you 30 days to reply, by ${actDate(read.actBy)}: dispute it, ask for the documents, and the company has to wait for them before suing.${keeper} If you have no ground, paying the original charge now, before a claim is filed, stops the court costs.`;
    default:
      if (!read.actBy)
        return `A court claim is the one letter that must never be ignored: do nothing, and the company wins by default. The form says how to respond and by when (simple procedure in Scotland, the small claims process in Northern Ireland).${keeper} Get free advice from Citizens Advice before the date on the form. If you'd rather settle, offer to pay the original charge now.`;
      return `A claim form from the county court is the one letter that must never be ignored: do nothing, and the company gets a default judgment, a CCJ that stays on your credit file for six years unless you pay in full within a month. Acknowledge the claim online (Money Claim Online, with the codes on the form) within 14 days of the date of service, by ${actDate(read.actBy)}, which gives you 28 days from service to file a defence.${keeper} Get free advice from Citizens Advice before you file it. If you'd rather settle, offer to pay the original charge now, before it reaches a hearing.`;
  }
}

/** What to keep or gather, by ground. */
export function evidenceLines(inp: ParkingInputs): string[] {
  const out: string[] = ["The notice itself, both sides, and every letter after it, with the envelopes."];
  const g = inp.grounds;
  if (g.includes("paid")) out.push("The payment: the receipt, the app's confirmation screen, or the bank or card line, with the time.");
  if (g.includes("signs")) out.push("Photos of the signs and lines as a driver sees them: from the entrance, from where you parked, and up close.");
  if (g.includes("grace")) out.push("The times: the ticket's or app's end time against the time on the notice.");
  if (g.includes("wrong")) out.push("Whatever shows the detail is wrong: the V5C for the registration, a photo of the actual place.");
  if (g.includes("sold")) out.push("Proof of the sale, theft or hire: the V5C slip, the crime reference, the hire agreement.");
  if (g.includes("loading")) out.push("Who was dropped off or what was loaded, and a note from the person or the delivery.");
  if (g.includes("emergency")) out.push("The breakdown report, a doctor's or hospital note, or whatever shows what happened.");
  out.push("A note of what you sent and when, and proof of posting or the online confirmation.");
  return out;
}

export function parkingRule(): string {
  return "Before I pay a parking ticket, I ask what appealing costs if I lose. If it's nothing, I appeal on any real ground; if it's the discount, I appeal only when my chance beats the break-even. I never ignore one.";
}

export function parkingSummary(inp: ParkingInputs, read: ParkingRead): string {
  const lines: string[] = [];
  lines.push(`Parking ticket: ${placeWords(inp)}${inp.issuer.trim() ? ` (${inp.issuer.trim()})` : ""}`);
  lines.push("");
  lines.push(parkingHeadline(inp, read));
  lines.push("");
  lines.push(parkingBody(inp, read));
  lines.push("");
  lines.push(`Pay now: ${money(read.payNow)}. Appeal and win: ${money(0)}. Appeal and lose: ${money(read.ifLose)}.`);
  if (read.actBy) lines.push(`Next step by: ${actDate(read.actBy)}`);
  const msg = mainMessage(inp, read);
  if (msg) {
    lines.push("");
    lines.push(`${msg.title}:`);
    lines.push("");
    lines.push(msg.text);
  }
  lines.push("");
  lines.push(parkingRule());
  return lines.join("\n");
}

const TICKETS: Ticket[] = ["council", "private", "unsure"];
const PLACES: Place[] = ["london", "england", "wales", "scotland", "ni"];
const HOWS: How[] = ["car", "post"];
const STAGES: Stage[] = ["new", "waiting", "rejected", "nto", "refused", "certificate", "recovery", "debt", "lbc", "claim"];
const GROUNDS: Ground[] = ["paid", "grace", "wrong", "sold", "signs", "loading", "emergency", "none"];
const DRIVERS: Driver[] = ["me", "other", "unsaid"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

/** "None" is exclusive: picking it clears the rest, and picking a ground clears it. */
export function toggleGround(list: Ground[], g: Ground): Ground[] {
  if (list.includes(g)) return list.filter((x) => x !== g);
  if (g === "none") return ["none"];
  return [...list.filter((x) => x !== "none"), g];
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseParkingInputs(raw: unknown): ParkingInputs {
  if (!raw || typeof raw !== "object") return BLANK_PARKING;
  const v = raw as Record<string, unknown>;
  const grounds = Array.isArray(v.grounds)
    ? GROUNDS.filter((g) => (v.grounds as unknown[]).includes(g))
    : [];
  return {
    what: str(v.what),
    issuer: str(v.issuer),
    ticket: oneOf(v.ticket, TICKETS),
    place: oneOf(v.place, PLACES),
    how: oneOf(v.how, HOWS),
    parkedOn: date(v.parkedOn),
    issuedOn: date(v.issuedOn),
    full: str(v.full, 40),
    discount: str(v.discount, 40),
    stage: oneOf(v.stage, STAGES),
    stageOn: date(v.stageOn),
    grounds: grounds.includes("none") ? ["none"] : grounds,
    detail: str(v.detail, 600),
    driver: oneOf(v.driver, DRIVERS),
  };
}

/**
 * The worked example: a camera ticket from a retail car park. The driver paid
 * at the machine but keyed one letter of the registration wrong, and the
 * letter arrived over two weeks after the visit.
 */
export const PARKING_EXAMPLE: ParkingInputs = {
  what: "the retail park on Mill Lane",
  issuer: "",
  ticket: "private",
  place: "england",
  how: "post",
  parkedOn: "",
  issuedOn: "",
  full: "£100",
  discount: "£60",
  stage: "new",
  stageOn: "",
  grounds: ["paid"],
  detail: "Two hours were paid for at the machine, at 10:02, for £2.40; the registration was keyed with an O for a 0",
  driver: "unsaid",
};

/** The example's dates, relative to today. */
export function parkingExample(today = todayISO()): ParkingInputs {
  return { ...PARKING_EXAMPLE, parkedOn: addDaysISO(today, -19), issuedOn: addDaysISO(today, -4) };
}
