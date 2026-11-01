/**
 * The read behind "A Bailiff's Letter: What Can They Actually Do?" (/bailiff).
 *
 * A "Notice of Enforcement" arrives about council tax, a parking charge, a
 * court fine or a judgment. It says an enforcement agent (a bailiff) will
 * visit to take goods, and £79 has already been added. Most people do one of
 * two things: freeze and let the letter sit, or panic and pay money they need
 * for rent. The first is expensive, because the fees step up at fixed points;
 * the second is often unnecessary, because the firm will usually take an
 * affordable plan if it's offered in writing early.
 *
 * England and Wales only (Tribunals, Courts and Enforcement Act 2007,
 * Schedule 12; the Taking Control of Goods Regulations 2013 and the Fees
 * Regulations 2014, as amended from 1 May 2026 by the Taking Control of Goods
 * (Miscellaneous Amendments) Regulations 2026):
 *
 *   - Notice: a bailiff can't take control of goods until a set number of
 *     clear days after the notice of enforcement. Seven before 1 May 2026;
 *     fourteen for enforcement that started on or after it, or twenty-eight
 *     if a debt adviser asks before the period ends (not for some business
 *     debts). Sundays, bank holidays, Good Friday and Christmas Day aren't
 *     counted.
 *   - Fees (from 1 May 2026; older cases stay on the old scale): £79 when the
 *     notice is sent (compliance stage); £247 plus 7.5% of the debt above
 *     £1,900 once a bailiff visits (enforcement stage); £116 plus 7.5% above
 *     £1,900 if goods are taken for sale. Before May: £75, £235 and £110, with
 *     the 7.5% above £1,500. High Court enforcement officers have their own
 *     scale. County court bailiffs, who are court staff, add no fees of their
 *     own. The sale-stage figure is the one I could least confirm, so the tool
 *     calls it "about".
 *   - Entry: on a first visit, only through a door that's open or unlocked;
 *     never between 9pm and 6am; not if the only people home are under 16 or
 *     vulnerable. Force on a home needs special permission and is mostly for
 *     unpaid court fines and HMRC, or for goods already listed in a controlled
 *     goods agreement that's been broken.
 *   - Can't take: essentials (cooker or microwave, fridge, washing machine,
 *     beds and bedding, a table and chairs for each person), medical and
 *     disability aids, a Motability car or one with a Blue Badge, tools and a
 *     vehicle needed for work up to £1,350 in total, or other people's goods.
 *   - Only a court order (or, for council tax, a liability order from the
 *     magistrates) can send bailiffs. A debt collector chasing a card, a phone
 *     bill or a private parking charge has no such power, however its letter
 *     is worded.
 *
 * The read is the stage you're at, because each stage costs more than the
 * last and closes a door the earlier one left open.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type BailiffRegion = "" | "ew" | "scot" | "ni";
export type BailiffKind = "" | "council" | "parking" | "fine" | "ccj" | "hmrc" | "private" | "unsure";
export type BailiffStage = "" | "before" | "notice" | "visited" | "cga" | "removed";
export type CourtOfficer = "" | "county" | "high" | "unsure";
export type CanPay = "" | "all" | "plan" | "none";
export type Vulnerable = "" | "yes" | "no";

export type BailiffInputs = {
  /** The debt, in a few words: "council tax for last year". */
  what: string;
  /** Who's writing: the enforcement firm, or the council or court. */
  who: string;
  /** Who's owed: the council, the court. Optional. */
  creditor: string;
  /** What's owed before any bailiff fees. Optional. */
  amount: string;
  region: BailiffRegion;
  kind: BailiffKind;
  /** For a CCJ: county court bailiff, High Court enforcement officer, or not sure. */
  officer: CourtOfficer;
  stage: BailiffStage;
  /** ISO date on the notice of enforcement. */
  noticeOn: string;
  vulnerable: Vulnerable;
  canPay: CanPay;
};

export const BLANK_BAILIFF: BailiffInputs = {
  what: "",
  who: "",
  creditor: "",
  amount: "",
  region: "",
  kind: "",
  officer: "",
  stage: "",
  noticeOn: "",
  vulnerable: "",
  canPay: "",
};

/** The day the 2026 amendments took effect. */
export const NEW_RULES_FROM = "2026-05-01";

type Scale = {
  compliance: number;
  enforcement: number;
  /** High Court only: the second enforcement stage. */
  enforcement2: number;
  sale: number;
  /** The 7.5% is charged on the debt above this. */
  threshold: number;
};

const STANDARD_NEW: Scale = { compliance: 79, enforcement: 247, enforcement2: 0, sale: 116, threshold: 1900 };
const STANDARD_OLD: Scale = { compliance: 75, enforcement: 235, enforcement2: 0, sale: 110, threshold: 1500 };
const HIGH_NEW: Scale = { compliance: 79, enforcement: 200, enforcement2: 520, sale: 550, threshold: 1200 };
const HIGH_OLD: Scale = { compliance: 75, enforcement: 190, enforcement2: 495, sale: 525, threshold: 1000 };
export const PERCENT = 0.075;
export const EXEMPT_TOOLS_LIMIT = 1350;

/** England and Wales bank holidays, which don't count as clear days. */
const BANK_HOLIDAYS = new Set([
  "2025-01-01", "2025-04-18", "2025-04-21", "2025-05-05", "2025-05-26", "2025-08-25", "2025-12-25", "2025-12-26",
  "2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04", "2026-05-25", "2026-08-31", "2026-12-25", "2026-12-28",
  "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28",
]);

function counts(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00`).getDay();
  return day !== 0 && !BANK_HOLIDAYS.has(iso) && !iso.endsWith("-12-25");
}

/**
 * A bailiff can't take control of goods on a Sunday, a bank holiday, Good
 * Friday or Christmas Day either, so the first visit day is the next day that
 * counts. The last of `n` clear days after `fromISO`: the day of the notice isn't
 * counted, nor Sundays or bank holidays.
 */
export function lastClearDay(fromISO: string, n: number): string {
  let d = fromISO;
  let left = n;
  let guard = 0;
  while (left > 0 && guard < 120) {
    d = addDaysISO(d, 1);
    if (counts(d)) left -= 1;
    guard += 1;
  }
  return d;
}

export type BailiffStatus =
  | "elsewhere" // Scotland or Northern Ireland
  | "collector" // a private debt with no court order: no bailiffs
  | "before" // the creditor has warned, nothing's with bailiffs yet
  | "notice" // a notice of enforcement, no visit yet
  | "visited" // a bailiff has called
  | "cga" // a controlled goods agreement is in place
  | "removed"; // goods taken, or a notice of sale

export type FeeLine = { label: string; amount: number; note?: string };

export type BailiffRead = {
  status: BailiffStatus;
  /** The debt before fees, when given. */
  amount: number | null;
  /** True for a High Court writ. */
  high: boolean;
  /** True for county court bailiffs, who charge no fees of their own. */
  courtStaff: boolean;
  /** True when the case is on the post-May-2026 rules (or no date given). */
  newRules: boolean;
  /** The minimum notice in clear days on these rules. */
  noticeDays: number;
  /** The last clear day of the notice period: the day an adviser must ask by. */
  adviserBy: string;
  /** The first day a bailiff may take control of goods. */
  visitFrom: string;
  /** The first day if an adviser gets the 28 days. */
  visitFromExtended: string;
  /** True when the earliest visit date is today or already past. */
  visitOpen: boolean;
  /** Fees that should already be on the account at this stage. */
  feesSoFar: FeeLine[];
  /** The fee added if it goes one stage further. */
  nextFee: FeeLine | null;
};

const CUR = "£";

/** Pounds, with pence only when there are any: £79, £326.50. */
export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r)
    ? `${CUR}${r.toLocaleString("en-GB")}`
    : `${CUR}${r.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function amountOf(inp: BailiffInputs): number | null {
  const n = parseMoney(inp.amount);
  return n !== null && n > 0 ? n : null;
}

export function bailiffReady(inp: BailiffInputs): boolean {
  if (!inp.region) return false;
  if (inp.region !== "ew") return true;
  if (!inp.kind) return false;
  if (inp.kind === "private") return true;
  if (inp.kind === "ccj" && !inp.officer) return false;
  if (!inp.stage || !inp.vulnerable || !inp.canPay) return false;
  if (inp.stage === "notice" && !isISODate(inp.noticeOn)) return false;
  if (inp.noticeOn && !isISODate(inp.noticeOn)) return false;
  return true;
}

function percentFee(amount: number | null, threshold: number): number {
  if (amount === null || amount <= threshold) return 0;
  return Math.round((amount - threshold) * PERCENT * 100) / 100;
}

function stageFee(base: number, amount: number | null, threshold: number, label: string, about = false): FeeLine {
  const pct = percentFee(amount, threshold);
  const note =
    amount === null
      ? `plus 7.5% of the debt above ${money(threshold)}`
      : pct > 0
        ? `${money(base)} plus 7.5% of ${money(amount - threshold)}`
        : undefined;
  return { label, amount: base + pct, note: about ? (note ? `About: ${note}` : "About this") : note };
}

export function readBailiff(inp: BailiffInputs, today = todayISO()): BailiffRead | null {
  if (!bailiffReady(inp)) return null;
  const amount = amountOf(inp);
  const high = inp.kind === "ccj" && inp.officer === "high";
  const courtStaff = inp.kind === "ccj" && inp.officer === "county";
  const newRules = !isISODate(inp.noticeOn) || inp.noticeOn >= NEW_RULES_FROM;
  const noticeDays = newRules ? 14 : 7;

  let status: BailiffStatus;
  if (inp.region !== "ew") status = "elsewhere";
  else if (inp.kind === "private") status = "collector";
  else status = inp.stage as Exclude<BailiffStage, "">;

  let adviserBy = "";
  let visitFrom = "";
  let visitFromExtended = "";
  if (status !== "elsewhere" && status !== "collector" && isISODate(inp.noticeOn)) {
    adviserBy = lastClearDay(inp.noticeOn, noticeDays);
    visitFrom = lastClearDay(adviserBy, 1);
    if (newRules) visitFromExtended = lastClearDay(lastClearDay(inp.noticeOn, 28), 1);
  }

  const feesSoFar: FeeLine[] = [];
  let nextFee: FeeLine | null = null;
  const fees = status !== "elsewhere" && status !== "collector" && status !== "before" && !courtStaff && inp.kind !== "hmrc";
  if (fees) {
    const s = high ? (newRules ? HIGH_NEW : HIGH_OLD) : newRules ? STANDARD_NEW : STANDARD_OLD;
    const compliance: FeeLine = { label: "Compliance fee, when the notice was sent", amount: s.compliance };
    const enforcement = stageFee(
      s.enforcement,
      amount,
      s.threshold,
      high ? "First enforcement fee, once an officer visits" : "Enforcement fee, once a bailiff visits",
    );
    const sale = high
      ? stageFee(s.sale, amount, s.threshold, "Sale fee, if goods are taken for sale")
      : stageFee(s.sale, amount, s.threshold, "Sale fee, if goods are taken for sale", true);
    feesSoFar.push(compliance);
    if (status === "notice") nextFee = enforcement;
    else if (status === "visited" || status === "cga") {
      feesSoFar.push(enforcement);
      nextFee = high ? { label: "Second enforcement fee, on a further visit", amount: s.enforcement2 } : sale;
    } else if (status === "removed") {
      feesSoFar.push(enforcement);
      if (high) feesSoFar.push({ label: "Second enforcement fee", amount: s.enforcement2, note: "If there was a second visit" });
      feesSoFar.push(sale);
    }
  }

  return {
    status,
    amount,
    high,
    courtStaff,
    newRules,
    noticeDays,
    adviserBy,
    visitFrom,
    visitFromExtended,
    visitOpen: Boolean(visitFrom) && visitFrom <= today,
    feesSoFar,
    nextFee,
  };
}

export function feesTotal(read: BailiffRead): number {
  return read.feesSoFar.reduce((t, f) => t + f.amount, 0);
}

function whoName(inp: BailiffInputs): string {
  return inp.who.trim() || (inp.kind === "hmrc" ? "HMRC" : "the enforcement firm");
}

function creditorName(inp: BailiffInputs): string {
  const c = inp.creditor.trim();
  if (c) return c;
  switch (inp.kind) {
    case "council":
    case "parking":
      return "the council";
    case "fine":
      return "the magistrates' court";
    case "hmrc":
      return "HMRC";
    case "ccj":
      return "the person or company that got the judgment";
    default:
      return "whoever is owed";
  }
}

export function bailiffHeadline(inp: BailiffInputs, read: BailiffRead): string {
  const pay = inp.canPay;
  switch (read.status) {
    case "elsewhere":
      return inp.region === "scot"
        ? "Scotland has its own rules: sheriff officers, not bailiffs. Get free advice before you do anything else."
        : "Northern Ireland has its own system, run by the Enforcement of Judgments Office. Get free advice first.";
    case "collector":
      return "A debt collector can't send bailiffs. Only a court can.";
    case "before":
      return pay === "all"
        ? `Pay ${creditorName(inp)} now, before it reaches bailiffs and £79 is added.`
        : `It isn't with bailiffs yet. Offer ${creditorName(inp)} a plan now, before £79 is added.`;
    case "notice": {
      const next = read.nextFee ? feesTotal(read) + read.nextFee.amount : 0;
      if (read.visitOpen) return "A bailiff can visit now. Put your offer in writing today, and keep the doors locked.";
      if (read.courtStaff)
        return read.visitFrom
          ? `Act before ${actDate(read.visitFrom)}. A county court bailiff can call from then; you can ask the court to suspend the warrant.`
          : "Act before the first visit. You can ask the court to suspend the warrant.";
      if (!read.visitFrom) return "Act before the first visit. Offer a plan in writing today.";
      return next > 0
        ? `Act before ${actDate(read.visitFrom)}. From then a bailiff can call, and the fees go from ${money(feesTotal(read))} to ${money(next)}.`
        : `Act before ${actDate(read.visitFrom)}: from then a bailiff can call.`;
    }
    case "visited":
      return inp.kind === "fine" || inp.kind === "hmrc"
        ? "Offer a plan in writing today, before the next visit, and keep to what you offer."
        : "You don't have to open the door. Offer a plan in writing today, and keep to what you offer.";
    case "cga":
      return "Keep to the agreement you signed, or tell them before a payment is missed.";
    case "removed":
      return "You can still stop the sale. Act on the notice of sale today.";
  }
}

/** What they can and can't do, in a few lines. */
export function powersLines(inp: BailiffInputs, read: BailiffRead): string[] {
  if (read.status === "elsewhere" || read.status === "collector") return [];
  const out: string[] = [];
  if (inp.kind === "fine" || inp.kind === "hmrc")
    out.push(
      inp.kind === "fine"
        ? "For an unpaid court fine, a bailiff can in some cases be allowed to force entry. Don't rely on keeping the door shut: deal with it before the visit."
        : "HMRC's own officers collect tax. They can get a warrant to force entry, so ask HMRC for time to pay before they visit.",
    );
  else
    out.push(
      "On a first visit a bailiff can only come in through a door that's open or unlocked. You don't have to open it: talk through the door or a window, or on the phone. Lock the doors, and the car.",
    );
  out.push("They can't come in between 9pm and 6am, or if the only people home are under 16 or vulnerable.");
  out.push(
    `They can't take essentials (cooker or microwave, fridge, washing machine, beds and bedding, a table and chairs for each person), medical or disability aids, a Motability car or one with a Blue Badge, tools or a vehicle you need for work up to ${money(EXEMPT_TOOLS_LIMIT)} in total, or anything that belongs to someone else.`,
  );
  out.push("A car on the street or your drive can be clamped. Keep proof if it isn't yours, or if it's exempt.");
  if (read.status === "cga")
    out.push("Goods listed in a controlled goods agreement can be taken, with force if needed, if you break it. That's why it's worth keeping, or renegotiating before you miss a payment.");
  return out;
}

export function bailiffBody(inp: BailiffInputs, read: BailiffRead): string {
  const who = whoName(inp);
  const creditor = creditorName(inp);
  const parts: string[] = [];

  if (read.status === "elsewhere") {
    return inp.region === "scot"
      ? "In Scotland, debts are enforced by sheriff officers through \"diligence\": attachment of goods, arrestment of wages or bank accounts. They need a court decree or, for council tax, a summary warrant, and the rules on what they can take and when they can enter your home differ from England's. Call Citizens Advice Scotland or National Debtline today; they can check the paperwork, and tell you about a Debt Arrangement Scheme or a moratorium that stops action while you get advice."
      : "In Northern Ireland, court judgments are enforced by the Enforcement of Judgments Office, not private bailiffs, and the process starts with a notice of intent to enforce. Call Advice NI today: it's free, and can help you reply and make an offer the Office will accept.";
  }

  if (read.status === "collector") {
    return `Bailiffs (enforcement agents) need a court order, or for council tax a liability order from the magistrates. A debt collector chasing a credit card, a loan, a phone or energy bill or a private parking charge has none, so it can't enter your home, take anything, or add a bailiff's fee, however its letter is worded. Words like "field agent", "doorstep visit" or "enforcement" are there to make you pay. You don't have to let a doorstep collector in or talk to them. What can follow is a court claim, so if the debt is yours, deal with it in writing. If the letter says there's already a county court judgment, come back and pick "a county court judgment": that changes the answer.`;
  }

  if (read.status === "before") {
    switch (inp.kind) {
      case "council":
        parts.push(
          `Once a liability order is made, ${creditor} can pass council tax to bailiffs, and £79 is added the moment the notice of enforcement is sent. Until then you can deal with ${creditor} directly. Ask for an instalment plan you can afford, in writing, and ask whether you can get Council Tax Reduction or a discount (single person, student, disability). If you're on benefits, the council can take it in small deductions from them instead of sending bailiffs; if you're working, from your pay. Either costs nothing extra.`,
        );
        break;
      case "parking":
        parts.push(
          "An unpaid council parking, bus lane or congestion charge goes to the Traffic Enforcement Centre, then to bailiffs. If you never got the notices and that's why it wasn't paid or challenged, you can file a witness statement (form TE9, or TE7 if you're out of time) and the case goes back to the council. If you did get them, paying now avoids the bailiff's fees.",
        );
        break;
      case "fine":
        parts.push(
          "Contact the court's fines office now. You can ask to pay in instalments, or to have it taken from your benefits or pay, which avoids bailiffs. If you didn't know about the case (a single justice procedure notice that never reached you), you may be able to make a statutory declaration and have it reopened.",
        );
        break;
      case "ccj":
        parts.push(
          read.high
            ? "A judgment over £600 can be moved to the High Court for an enforcement officer, whose fees are higher. Pay what the judgment ordered, or ask the court to let you pay in instalments (form N245), and do it before a writ is issued."
            : "If you can't pay what the judgment ordered, ask the court to change it to instalments you can afford, on form N245. If you never saw the claim because it went to an old address, you can apply to set the judgment aside; the sooner, the better.",
        );
        break;
      case "hmrc":
        parts.push(
          "Ring the number on HMRC's letter and ask for a Time to Pay arrangement before it acts. HMRC can collect without going to court first, so the earlier you call, the more choice you have.",
        );
        break;
      default:
        parts.push(`Ask ${creditor} who the debt is with and what powers it has. Until a court order exists, no bailiff can be sent.`);
    }
    if (inp.canPay === "none")
      parts.push("If you can't pay anything right now, get free debt advice today. In England and Wales an adviser can apply for Breathing Space, which pauses enforcement and most interest for 60 days.");
    return parts.join(" ");
  }

  // With bailiffs: notice, visited, cga, removed.
  if (read.status === "notice") {
    if (read.visitOpen)
      parts.push(
        `The notice period ended on ${actDate(read.adviserBy)}, so a bailiff can call any day now (not on a Sunday or bank holiday, and not between 9pm and 6am).`,
      );
    else if (read.visitFrom)
      parts.push(
        read.newRules
          ? `A bailiff can't take control of goods until ${read.noticeDays} clear days after the notice (Sundays and bank holidays don't count), so the earliest visit is ${actDate(read.visitFrom)}. A free debt adviser can ask for 28 days instead, for a debt that isn't a business debt, if they ask by ${actDate(read.adviserBy)}; that would move it to ${actDate(read.visitFromExtended)}. The notice is often treated as given a day or two after it was posted, but plan on the earlier date.`
          : `On a notice from before May 2026 the minimum was 7 clear days, so the earliest visit was ${actDate(read.visitFrom)}.`,
      );
    parts.push(
      read.courtStaff
        ? "County court bailiffs are court staff, so they add no fees of their own. You can ask the court to suspend the warrant on form N245, offering what you can pay each month; there's a fee, which you can ask to be waived if you're on a low income (Help with Fees)."
        : `Right now the fees are ${money(feesTotal(read))}. If a bailiff visits, they go up by ${read.nextFee ? money(read.nextFee.amount) : "the enforcement fee"}. That's the cost of waiting, and it's why the time to write is now, not after the knock.`,
    );
  } else if (read.status === "visited") {
    parts.push(
      `${read.feesSoFar.length ? `A visit adds the enforcement fee, so the fees should now be ${money(feesTotal(read))}. ` : ""}If you weren't there, or no bailiff actually came, ask for the date and time of the visit and the body-camera footage${read.feesSoFar.length ? ", and challenge the fee if it doesn't hold up" : ""}. The next step is a further visit to take goods, so write to ${who} today.`,
    );
  } else if (read.status === "cga") {
    parts.push(
      `A controlled goods agreement means you've agreed to pay by instalments and the listed goods stay with you. If you can't keep a payment, tell ${who} before it's missed and offer what you can: a broken agreement lets them come back and take the listed goods, with force if needed. If anything on the list is exempt or belongs to someone else, say so in writing now.`,
    );
  } else if (read.status === "removed") {
    parts.push(
      `Goods taken must be stored, and there's a minimum period before they can be sold; the notice of sale gives the date. Paying the full amount, including the fees (${money(feesTotal(read))} on the scale), before then stops the sale. If something taken was exempt (a work tool under ${money(EXEMPT_TOOLS_LIMIT)}, a Motability car, a cooker) or belongs to someone else, write to ${who} today with proof; an owner can apply to court to get their goods back. Sales usually raise far less than goods are worth, so get advice today.`,
    );
  }

  switch (inp.kind) {
    case "council":
      parts.push(
        `The firm works for ${creditor}, so it's ${creditor} you complain to if the firm won't take a fair plan.${inp.vulnerable === "yes" ? ` Because you're vulnerable, also ask ${creditor} to take the case back from the bailiffs; many will.` : ""}`,
      );
      break;
    case "parking":
      parts.push(
        "If you never received the parking charge notices, you can still file form TE7 and TE9 with the Traffic Enforcement Centre; if the council accepts it, the warrant is cancelled and the fees go with it.",
      );
      break;
    case "fine":
      parts.push("You can also ask the court's fines office to take payments from your benefits or pay instead.");
      break;
    case "hmrc":
      parts.push("HMRC's officers don't use the bailiffs' fee scale; ring HMRC and ask for Time to Pay.");
      break;
    default:
      break;
  }

  if (inp.vulnerable === "yes")
    parts.push(
      `Because something's making this harder, tell ${who} and ${creditor} in writing, with brief evidence if you have it (a GP letter, proof of benefits). The national standards for enforcement agents say they must take it into account, and a vulnerable person should get time to get advice before anything else happens.`,
    );
  if (inp.canPay === "none")
    parts.push(
      "If you can't pay anything, call a free debt adviser today. In England and Wales they can apply for Breathing Space: 60 days in which enforcement has to stop.",
    );
  else if (inp.canPay === "all")
    parts.push(`If you can pay it all, ask ${who} for a breakdown first, so you pay the debt and the right fees, then pay the firm, not ${creditor}, and keep the receipt.`);
  return parts.join(" ");
}

/** The letter to send, or null where there isn't one to write. */
export function mainLetter(inp: BailiffInputs, read: BailiffRead): { title: string; note: string; text: string } | null {
  if (read.status === "elsewhere") return null;
  const what = inp.what.trim();
  const ref = `Your reference: [reference]${what ? `, about ${what}` : ""}.`;
  const sign = ["", "Yours faithfully,", "[Your name]", "[Your address]"];

  if (read.status === "collector") {
    const who = inp.who.trim();
    return {
      title: "Ask what power they have",
      note: "Send it by email or post and keep a copy. Don't add anything that says the debt is yours.",
      text: [
        who && !/^the /i.test(who) ? `Dear ${who},` : "Dear Sir or Madam,",
        "",
        `${ref} Your letter dated [date] says you may visit my home.`,
        "",
        "Please tell me whether there is a court judgment for this debt, and if so the court and the claim number. If there isn't, you have no power to enter my home or take my goods, and I don't consent to a visit. Please deal with me in writing only.",
        "",
        "Nothing in this letter is an acknowledgement that I owe this debt.",
        ...sign,
      ].join("\n"),
    };
  }

  const toBailiff = read.status !== "before";
  const greet = inp.who.trim() && toBailiff && !/^the /i.test(inp.who.trim()) ? `Dear ${inp.who.trim()},` : "Dear Sir or Madam,";
  const lines: string[] = [greet, ""];
  lines.push(
    toBailiff
      ? `${ref} I've received your notice of enforcement dated ${inp.noticeOn ? letterDate(inp.noticeOn) : "[date]"}${read.amount !== null ? `, for a debt of ${money(read.amount)}` : ""}.`
      : `${ref} I've received your letter dated [date] saying the debt may be passed to enforcement agents${read.amount !== null ? ` (${money(read.amount)})` : ""}.`,
    "",
  );
  if (inp.vulnerable === "yes")
    lines.push(
      "I'm in a vulnerable situation: [say briefly, for example a health condition, a disability, a recent bereavement, or caring alone for young children]. I enclose [evidence]. Please take this into account under the national standards for enforcement agents, and put enforcement on hold while I get advice.",
      "",
    );
  if (inp.canPay === "all") {
    lines.push(
      "I intend to pay in full. Before I do, please send me a breakdown of the amount you're asking for, showing the debt and each fee separately, and confirm the exact amount needed to settle the account.",
    );
  } else if (inp.canPay === "plan") {
    lines.push(
      "I can't pay the full amount at once. My budget is attached: after essential bills I can afford £[amount] a [week or month], starting [date]. Please accept this arrangement and confirm it in writing.",
      "",
      toBailiff
        ? "Please also send me a breakdown of the amount, showing the debt and each fee separately."
        : `Please don't pass the account to enforcement agents while I keep to this plan.${inp.kind === "council" ? " If I'm on benefits or working, I'd also accept deductions from them instead." : ""}`,
    );
  } else {
    lines.push(
      "I can't pay anything at the moment. I'm getting free debt advice and will write again with an offer. Please put the account on hold for 30 days while I do.",
    );
  }
  if (toBailiff) lines.push("", "Please don't visit my home while you consider this. Please reply in writing.");
  lines.push(...sign);
  if (toBailiff) lines.push("", `Copy to: ${creditorName(inp)}`);
  return {
    title: inp.canPay === "all" ? "Ask for the breakdown, then pay" : inp.canPay === "plan" ? "An offer you can keep to" : "Ask for time while you get advice",
    note: toBailiff
      ? `Email it to ${whoName(inp)} today, keep a copy, and send the same to ${creditorName(inp)}. Fill in the square brackets. Work the amount out from a budget; a free adviser will help.`
      : "Send it today and keep a copy. Fill in the square brackets. Work the amount out from a budget; a free adviser will help.",
    text: lines.join("\n"),
  };
}

/** What to keep or gather. */
export function evidenceLines(inp: BailiffInputs, read: BailiffRead): string[] {
  if (read.status === "elsewhere") return [];
  const out: string[] = ["Every letter, with its envelope: the date it arrived can matter."];
  if (read.status !== "collector" && read.status !== "before")
    out.push("A note of every visit and call: the date, the time, the name and number on the bailiff's ID, what was said.");
  out.push("A copy of what you send, and proof you sent it.");
  if (read.status !== "collector") {
    out.push("Proof for anything they can't take: a Blue Badge or Motability papers, receipts for things that belong to someone else, invoices that show a van or tools are for work.");
    out.push("Receipts for every payment.");
  }
  if (inp.vulnerable === "yes") out.push("Brief evidence of what's making it harder: a GP or support worker's letter, a benefit award letter.");
  return out;
}

export function bailiffRule(): string {
  return "When a bailiff's letter comes, I act before the first visit, not after it: I check who's owed and on what order, offer in writing what I can keep to, and I don't open the door to someone I haven't agreed to see.";
}

/** Calendar reminders for the notice period. */
export function remindersOf(read: BailiffRead, today: string): { on: string; title: string; body: string }[] {
  const out: { on: string; title: string; body: string }[] = [];
  if (read.status !== "notice") return out;
  if (read.newRules && read.adviserBy && read.adviserBy >= today)
    out.push({
      on: read.adviserBy,
      title: "Last day for a debt adviser to ask for 28 days",
      body: "An adviser must ask the enforcement firm before the notice period ends.",
    });
  if (read.visitFrom && read.visitFrom >= today)
    out.push({
      on: read.visitFrom,
      title: "A bailiff can visit from today",
      body: "Make sure your offer is in writing before now. Keep the doors locked.",
    });
  return out;
}

export function bailiffSummary(inp: BailiffInputs, read: BailiffRead): string {
  const lines: string[] = [];
  lines.push(`A bailiff's letter${inp.what.trim() ? `: ${inp.what.trim()}` : ""}${inp.who.trim() ? ` (${inp.who.trim()})` : ""}`);
  lines.push("", bailiffHeadline(inp, read), "", bailiffBody(inp, read));
  const powers = powersLines(inp, read);
  if (powers.length) lines.push("", "What they can and can't do:", ...powers.map((p) => `- ${p}`));
  if (read.feesSoFar.length) {
    lines.push("", "Fees on the scale:", ...read.feesSoFar.map((f) => `- ${f.label}: ${money(f.amount)}`));
    if (read.nextFee) lines.push(`- Next: ${read.nextFee.label}: ${money(read.nextFee.amount)}`);
  }
  if (read.visitFrom) lines.push("", `Earliest visit: ${letterDate(read.visitFrom)}.`);
  const msg = mainLetter(inp, read);
  if (msg) lines.push("", `${msg.title}:`, "", msg.text);
  lines.push("", bailiffRule());
  return lines.join("\n");
}

const REGIONS: BailiffRegion[] = ["ew", "scot", "ni"];
const KINDS: BailiffKind[] = ["council", "parking", "fine", "ccj", "hmrc", "private", "unsure"];
const STAGES: BailiffStage[] = ["before", "notice", "visited", "cga", "removed"];
const OFFICERS: CourtOfficer[] = ["county", "high", "unsure"];
const PAYS: CanPay[] = ["all", "plan", "none"];
const VULNS: Vulnerable[] = ["yes", "no"];

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
export function parseBailiffInputs(raw: unknown): BailiffInputs {
  if (!raw || typeof raw !== "object") return BLANK_BAILIFF;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what),
    who: str(v.who),
    creditor: str(v.creditor),
    amount: str(v.amount, 40),
    region: oneOf(v.region, REGIONS),
    kind: oneOf(v.kind, KINDS),
    officer: oneOf(v.officer, OFFICERS),
    stage: oneOf(v.stage, STAGES),
    noticeOn: date(v.noticeOn),
    vulnerable: oneOf(v.vulnerable, VULNS),
    canPay: oneOf(v.canPay, PAYS),
  };
}

/**
 * The worked example: council tax arrears of £640, a notice of enforcement
 * dated three days ago, and a plan the household can keep to.
 */
export function bailiffExample(today = todayISO()): BailiffInputs {
  return {
    what: "last year's council tax",
    who: "",
    creditor: "the council",
    amount: "£640",
    region: "ew",
    kind: "council",
    officer: "",
    stage: "notice",
    noticeOn: addDaysISO(today, -3),
    vulnerable: "no",
    canPay: "plan",
  };
}

