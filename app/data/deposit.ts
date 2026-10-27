/**
 * The read behind "Get Your Deposit Back" (/deposit).
 *
 * You've moved out, handed back the keys, and the email from the agent lists
 * the deductions: a new carpet, a full repaint, a professional clean, £60 for
 * picture-hook holes. Together they come to most of the deposit. Most tenants
 * haggle a little, or let it go, because it looks like their word against the
 * landlord's.
 *
 * It isn't. The deposit is the tenant's money, held as security, and the rules
 * put the work on the landlord:
 *
 *   - In England and Wales the landlord must protect the deposit in one of
 *     three government schemes (DPS, TDS, mydeposits) within 30 days and give
 *     the tenant the scheme's details. If they didn't, a court must order the
 *     deposit back plus one to three times its amount (Housing Act 2004,
 *     s.213–214, England; up to three times under the Renting Homes (Wales)
 *     Act 2016, Sch. 5). Scotland: 30 working days, and a tribunal can award
 *     up to three times, if you apply within three months of moving out.
 *   - Once landlord and tenant agree the amount, it must be repaid within ten
 *     days. Anything disputed stays protected in the scheme until it's settled.
 *   - Each scheme runs a free dispute service. An adjudicator decides on the
 *     written evidence alone (they never visit), and the landlord has to show
 *     each deduction is justified: the check-in report, the check-out report,
 *     photos, invoices. TDS and mydeposits ask for disputes within three months
 *     of the tenancy ending.
 *   - Fair wear and tear isn't chargeable: "reasonable use of the premises by
 *     the tenant and the ordinary operation of natural forces". The adjudicator
 *     weighs how long you lived there, how many of you, and the condition when
 *     you moved in.
 *   - Nor is betterment: the landlord can't charge for leaving the place better
 *     than it was. A replacement is apportioned by the item's remaining life.
 *     The DPS guide's worked example: a £500 carpet, two years into a five-year
 *     life, costs the tenant three-fifths, £300. The TDS lifespan guide gives
 *     carpets 2–4 years (cheap), 5–8 (medium), 8–15 (good), and decoration
 *     3–5 years.
 *   - In England, the Tenant Fees Act 2019 caps the deposit at five weeks' rent
 *     (six if the rent is £50,000 a year or more). The excess is a prohibited
 *     payment you can recover.
 *
 * So the tool prices each deduction the way an adjudicator would (accept it,
 * cut it to its share of the item's life, or refuse it as wear and tear or
 * unevidenced), turns that into one number to ask for, writes the reply, and
 * dates the last day to raise the free dispute. The same idea as /refund and
 * /flight: ask once, in writing, for one amount, by a date, and decide the
 * next step before the first message goes.
 *
 * The read, checked in order:
 *   1. "living"      — still there: what to do before you hand back the keys.
 *   2. "unprotected" — moved out, and it was never protected: the claim.
 *   3. "late"        — past the scheme's three months: small claims.
 *   4. "agreed"      — agreed, but not paid.
 *   5. "ask"         — moved out, not asked yet.
 *   6. "wait"        — asked, inside the 14 days.
 *   7. "reply"       — they've sent deductions: the counter.
 *   8. "dispute"     — no reply, or no movement: the scheme.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, todayISO };

export type Nation = "" | "england" | "wales" | "scotland" | "ni";
export type Protection = "" | "yes" | "late" | "no" | "unsure";
export type Scheme = "" | "dps" | "tds" | "myd" | "sds" | "lps" | "unknown";
export type Inventory = "" | "signed" | "photos" | "none";
export type RentPer = "" | "month" | "week";
export type Stage = "" | "living" | "none" | "silent" | "proposed" | "stuck" | "agreed";
export type ItemKind = "" | "clean" | "damage" | "wear" | "replace" | "redecorate" | "rent" | "other";
export type View = "" | "fair" | "much" | "not";

export type DepositItem = {
  /** What they're charging for, in their words: "new lounge carpet". */
  what: string;
  /** What they're asking, as typed. */
  amount: string;
  kind: ItemKind;
  view: View;
  /** How old the item (or the paintwork) was when you moved out, in years, as typed. */
  age: string;
  /** How long it should last, in years, as typed. */
  life: string;
  /** What you'd pay instead, as typed, when you think it's too much. */
  offer: string;
};

export type DepositInputs = {
  /** The place, in a few words: "the flat on Elm Road". */
  what: string;
  /** The landlord or the agent: who the message goes to. */
  landlord: string;
  nation: Nation;
  deposit: string;
  rent: string;
  rentPer: RentPer;
  protection: Protection;
  scheme: Scheme;
  inventory: Inventory;
  /** ISO date you moved out (the tenancy ended). */
  movedOut: string;
  stage: Stage;
  /** ISO date you asked for it back, or the date you agreed the amount. */
  askedOn: string;
  items: DepositItem[];
};

export const BLANK_ITEM: DepositItem = { what: "", amount: "", kind: "", view: "", age: "", life: "", offer: "" };

export const BLANK_DEPOSIT: DepositInputs = {
  what: "",
  landlord: "",
  nation: "",
  deposit: "",
  rent: "",
  rentPer: "",
  protection: "",
  scheme: "",
  inventory: "",
  movedOut: "",
  stage: "",
  askedOn: "",
  items: [],
};

export const MAX_ITEMS = 12;
/** Days to give the landlord to reply: the same 14 as the other letters. */
export const REPLY_DAYS = 14;
/** Once the amount is agreed, it must be repaid within ten days. */
export const PAY_DAYS = 10;
/** TDS and mydeposits take disputes up to three months after the tenancy ends. */
export const DISPUTE_MONTHS = 3;
/** A contract claim (and a deposit-protection claim) runs six years. */
export const LIMIT_YEARS = 6;

export type Verdict = "accept" | "apportion" | "spent" | "wear" | "unproven" | "refuse" | "offer" | "open";

export type ItemRead = {
  index: number;
  label: string;
  claimed: number;
  /** What's fair to pay. null when it's for you to put a figure on. */
  fair: number | null;
  verdict: Verdict;
  /** The share of life left, 0–1, when apportioned. */
  share: number | null;
  /** One sentence for the message: why this figure. */
  why: string;
};

export type DepositKind = "living" | "unprotected" | "late" | "agreed" | "ask" | "wait" | "reply" | "dispute";

export type DepositRead = {
  kind: DepositKind;
  deposit: number;
  items: ItemRead[];
  /** What they're asking for, in total. */
  claimed: number;
  /** What's fair, in total: accepted, apportioned and offered. Open items count at their claimed amount. */
  fair: number;
  /** Items still needing your figure. */
  open: number;
  /** What to ask back: the deposit less the fair total. */
  back: number;
  /** The part nobody disputes, which can be released now. */
  undisputed: number;
  /** England: the most the deposit could lawfully be. null when it can't be worked out. */
  cap: number | null;
  /** How much over the cap, when it is. */
  over: number;
  /** ISO date the landlord should reply by. "" when there's no letter in play. */
  replyBy: string;
  /** ISO last day to raise the scheme's dispute (England and Wales). "" when unknown. */
  disputeBy: string;
  /** Scotland: last day to apply to the tribunal about protection. */
  tribunalBy: string;
  /** Agreed amounts: the date the ten days ran out. */
  payBy: string;
};

const CUR = "£";

function money(n: number): string {
  return formatMoney(n, CUR);
}

function capital(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function years(raw: string): number | null {
  const s = raw.trim().replace(/\s*(years?|yrs?|y)$/i, "");
  if (!s) return null;
  // "3 to 5", "3-5": the middle of the range.
  const range = s.match(/^(\d+(?:\.\d+)?)\s*(?:to|-|–)\s*(\d+(?:\.\d+)?)$/i);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

export function depositOf(inp: DepositInputs): number | null {
  const n = parseMoney(inp.deposit);
  return n !== null && n > 0 ? n : null;
}

/** England's Tenant Fees Act cap: five weeks' rent, six from £50,000 a year. */
export function capOf(inp: DepositInputs): number | null {
  if (inp.nation !== "england" || !inp.rentPer) return null;
  const r = parseMoney(inp.rent);
  if (r === null || r <= 0) return null;
  const weekly = inp.rentPer === "week" ? r : (r * 12) / 52;
  const annual = weekly * 52;
  return Math.floor(weekly * (annual >= 50000 ? 6 : 5) * 100) / 100;
}

/** True when the item has anything typed in it. */
export function itemUsed(it: DepositItem): boolean {
  return it.what.trim() !== "" || it.amount.trim() !== "";
}

export function itemNeedsAge(it: DepositItem): boolean {
  return it.kind === "replace" || it.kind === "redecorate";
}

/** The share of an item's life left when you moved out, or null if not typed. */
export function lifeLeft(it: DepositItem): number | null {
  const age = years(it.age);
  const life = years(it.life);
  if (age === null || life === null || life <= 0) return null;
  return Math.max(0, life - age) / life;
}

function itemLabel(it: DepositItem, i: number): string {
  return it.what.trim() || `item ${i + 1}`;
}

function ageWords(it: DepositItem): string {
  const age = years(it.age) ?? 0;
  const life = years(it.life) ?? 0;
  const yrs = (n: number) => `${n} year${n === 1 ? "" : "s"}`;
  return it.kind === "redecorate"
    ? `The decoration was about ${yrs(age)} old when I moved out, against a usual life of about ${yrs(life)}`
    : `It was about ${yrs(age)} old when I moved out, against a usual life of about ${yrs(life)}`;
}

/** One deduction, priced the way an adjudicator would. */
export function readItem(it: DepositItem, i: number, inventory: Inventory): ItemRead {
  const claimed = parseMoney(it.amount) ?? 0;
  const label = itemLabel(it, i);
  const base = { index: i, label, claimed, share: null };
  const offer = parseMoney(it.offer);
  const noRecord = inventory === "none";

  if (it.view === "not") {
    if (it.kind === "wear" || it.kind === "replace" || it.kind === "redecorate")
      return { ...base, fair: 0, verdict: "wear", why: "This is fair wear and tear from ordinary use over the tenancy, which isn't chargeable." };
    if (noRecord)
      return { ...base, fair: 0, verdict: "unproven", why: "There was no check-in inventory, so nothing shows this was any different when I moved in." };
    return {
      ...base,
      fair: 0,
      verdict: "refuse",
      why:
        it.kind === "clean"
          ? "I left the property as clean as it was at check-in, as the check-out report and my photos show."
          : it.kind === "rent"
            ? "I don't owe this: my payments are up to date, and I can show the statements."
            : "This isn't my responsibility: the check-in report shows it in the same condition, allowing for fair wear and tear.",
    };
  }

  if (itemNeedsAge(it)) {
    const share = lifeLeft(it);
    if (share !== null) {
      const fair = Math.round(claimed * share * 100) / 100;
      if (fair <= 0)
        return { ...base, share, fair: 0, verdict: "spent", why: `${ageWords(it)}, so it had reached the end of its life. Charging for a new one would leave the property better than it was.` };
      if (it.view === "fair" && fair >= claimed) return { ...base, share, fair: claimed, verdict: "accept", why: "I accept this." };
      return {
        ...base,
        share,
        fair,
        verdict: "apportion",
        why: `${ageWords(it)}, so a fair share of the cost is the life it had left: ${money(fair)} of ${money(claimed)}. Charging the full price would leave the property better than it was.`,
      };
    }
  }

  if (it.kind === "wear" && it.view !== "fair")
    return { ...base, fair: 0, verdict: "wear", why: "This is fair wear and tear from ordinary use over the tenancy, which isn't chargeable." };

  if (it.view === "much") {
    if (offer !== null && offer < claimed)
      return {
        ...base,
        fair: offer,
        verdict: "offer",
        why:
          it.kind === "clean"
            ? `I'll pay ${money(offer)}, the cost of cleaning what's actually below the check-in standard. The standard is how it was when I moved in, not better.`
            : `I'll pay ${money(offer)}. ${money(claimed)} is more than this reasonably costs; please send the quote or invoice if you disagree.`,
      };
    return {
      ...base,
      fair: null,
      verdict: "open",
      why: itemNeedsAge(it)
        ? "Please tell me how old it was and send the original invoice, so a fair share can be worked out from the life it had left."
        : "Please send the quote or invoice for this: the amount looks higher than it should cost.",
    };
  }

  return { ...base, fair: claimed, verdict: "accept", why: "I accept this." };
}

/** True when the read has what it needs. */
export function depositReady(inp: DepositInputs): boolean {
  if (!inp.nation || !inp.protection || !inp.stage) return false;
  if (depositOf(inp) === null) return false;
  if (inp.stage === "living") return true;
  if (!isISODate(inp.movedOut)) return false;
  if (inp.stage === "proposed" || inp.stage === "stuck") {
    const used = inp.items.filter(itemUsed);
    if (!used.length) return false;
    if (used.some((it) => parseMoney(it.amount) === null || !it.kind || !it.view)) return false;
  }
  return true;
}

export function readDeposit(inp: DepositInputs, today = todayISO()): DepositRead | null {
  if (!depositReady(inp)) return null;
  const deposit = depositOf(inp) ?? 0;
  const counting = inp.stage === "proposed" || inp.stage === "stuck";
  const items = counting ? inp.items.map((it, i) => ({ it, i })).filter(({ it }) => itemUsed(it)).map(({ it, i }) => readItem(it, i, inp.inventory)) : [];
  const claimed = items.reduce((s, r) => s + r.claimed, 0);
  const fairRaw = items.reduce((s, r) => s + (r.fair ?? r.claimed), 0);
  const fair = Math.min(deposit, Math.round(fairRaw * 100) / 100);
  const open = items.filter((r) => r.fair === null).length;
  const cap = capOf(inp);
  const over = cap !== null && deposit > cap + 0.5 ? Math.round((deposit - cap) * 100) / 100 : 0;
  const moved = isISODate(inp.movedOut) ? (inp.movedOut > today ? today : inp.movedOut) : "";
  const ew = inp.nation === "england" || inp.nation === "wales";
  const asked = isISODate(inp.askedOn) ? (inp.askedOn > today ? today : inp.askedOn) : "";
  const read: DepositRead = {
    kind: "ask",
    deposit,
    items,
    claimed,
    fair,
    open,
    back: Math.max(0, Math.round((deposit - fair) * 100) / 100),
    undisputed: Math.max(0, Math.round((deposit - claimed) * 100) / 100),
    cap,
    over,
    replyBy: "",
    disputeBy: moved && ew && inp.protection !== "no" ? addMonthsISO(moved, DISPUTE_MONTHS) : "",
    tribunalBy: moved && inp.nation === "scotland" && (inp.protection === "no" || inp.protection === "late") ? addMonthsISO(moved, 3) : "",
    payBy: "",
  };

  if (inp.stage === "living") {
    read.kind = "living";
    read.disputeBy = "";
    read.tribunalBy = "";
    return read;
  }
  if (inp.protection === "no") {
    read.kind = "unprotected";
    read.replyBy = addDaysISO(today, REPLY_DAYS);
    return read;
  }
  if (inp.stage === "agreed") {
    read.kind = "agreed";
    read.payBy = asked ? addDaysISO(asked, PAY_DAYS) : "";
    read.replyBy = addDaysISO(today, 7);
    return read;
  }
  if (read.disputeBy && read.disputeBy < today) {
    read.kind = "late";
    read.replyBy = addDaysISO(today, REPLY_DAYS);
    return read;
  }
  if (inp.stage === "none") {
    read.kind = "ask";
    read.replyBy = addDaysISO(today, REPLY_DAYS);
  } else if (inp.stage === "silent") {
    const by = asked ? addDaysISO(asked, REPLY_DAYS) : "";
    if (by && by > today) {
      read.kind = "wait";
      read.replyBy = by;
    } else {
      read.kind = "dispute";
    }
  } else if (inp.stage === "proposed") {
    read.kind = "reply";
    read.replyBy = addDaysISO(today, REPLY_DAYS);
    if (read.disputeBy && read.replyBy > read.disputeBy) read.replyBy = read.disputeBy > today ? read.disputeBy : today;
  } else {
    read.kind = "dispute";
  }
  return read;
}

/** The scheme's name, for this nation. */
export function schemeName(inp: DepositInputs): string {
  switch (inp.scheme) {
    case "dps":
      return "the Deposit Protection Service";
    case "tds":
      return inp.nation === "ni" ? "TDS Northern Ireland" : "the Tenancy Deposit Scheme";
    case "myd":
      return inp.nation === "scotland" ? "mydeposits Scotland" : inp.nation === "ni" ? "mydeposits Northern Ireland" : "mydeposits";
    case "sds":
      return "SafeDeposits Scotland";
    case "lps":
      return inp.nation === "ni" ? "the Letting Protection Service Northern Ireland" : "the Letting Protection Service Scotland";
    default:
      return "the deposit scheme";
  }
}

/** The schemes that exist where you rent, for the picker. */
export function schemesFor(nation: Nation): { id: Scheme; label: string }[] {
  if (nation === "scotland")
    return [
      { id: "sds", label: "SafeDeposits Scotland" },
      { id: "lps", label: "Letting Protection Service Scotland" },
      { id: "myd", label: "mydeposits Scotland" },
      { id: "unknown", label: "I don't know" },
    ];
  if (nation === "ni")
    return [
      { id: "tds", label: "TDS Northern Ireland" },
      { id: "lps", label: "Letting Protection Service NI" },
      { id: "myd", label: "mydeposits Northern Ireland" },
      { id: "unknown", label: "I don't know" },
    ];
  return [
    { id: "dps", label: "Deposit Protection Service (DPS)" },
    { id: "tds", label: "Tenancy Deposit Scheme (TDS)" },
    { id: "myd", label: "mydeposits" },
    { id: "unknown", label: "I don't know" },
  ];
}

function placeWords(inp: DepositInputs): string {
  return inp.what.trim() || "the property";
}

function greeting(inp: DepositInputs): string {
  const who = inp.landlord.trim();
  return who && !/^(the|a|an|my)\s/i.test(who) ? `Dear ${who},` : "Hello,";
}

function signOff(lines: string[]): void {
  lines.push("");
  lines.push("Thank you,");
  lines.push("[your name, your forwarding address, and your bank details for the repayment]");
}

function movedWords(inp: DepositInputs): string {
  return isISODate(inp.movedOut) ? ` on ${letterDate(inp.movedOut)}` : "";
}

function itemLine(r: ItemRead): string {
  if (r.verdict === "accept") return `- ${capital(r.label)}: ${money(r.claimed)}. I accept this.`;
  if (r.fair === null) return `- ${capital(r.label)} (${money(r.claimed)}): ${r.why}`;
  if (r.fair <= 0) return `- ${capital(r.label)} (${money(r.claimed)}): I don't accept this. ${r.why}`;
  return `- ${capital(r.label)}: ${money(r.claimed)} claimed, ${money(r.fair)} fair. ${r.why}`;
}

function overLine(read: DepositRead): string {
  return `Separately, the deposit of ${money(read.deposit)} was more than the ${money(read.cap ?? 0)} the Tenant Fees Act 2019 allows for this rent (five weeks' rent, or six if the rent is £50,000 a year or more). The extra ${money(read.over)} is a prohibited payment and should be repaid in full, whatever happens with the rest.`;
}

/** The first ask, after moving out. */
export function askMessage(inp: DepositInputs, read: DepositRead): string {
  const lines: string[] = [greeting(inp), ""];
  lines.push(`I moved out of ${placeWords(inp)}${movedWords(inp)} and returned the keys. I'd like my deposit of ${money(read.deposit)} back in full.`);
  lines.push("");
  lines.push(
    inp.inventory === "none"
      ? "I left the property in the condition I found it, allowing for fair wear and tear."
      : "I left the property in the condition recorded at check-in, allowing for fair wear and tear, and I have photos from the day I left.",
  );
  lines.push("");
  lines.push(`If you're proposing any deductions, please send me an itemised list by ${letterDate(read.replyBy)}, with the evidence for each: the check-in and check-out reports, photos, and quotes or invoices. Once we've agreed the amount, it has to be repaid within ${PAY_DAYS} days.`);
  if (read.over > 0) {
    lines.push("");
    lines.push(overLine(read));
  }
  signOff(lines);
  return lines.join("\n");
}

/** The counter to their deductions. */
export function replyMessage(inp: DepositInputs, read: DepositRead): string {
  const lines: string[] = [greeting(inp), ""];
  lines.push(`Thank you for the proposed deductions from my deposit of ${money(read.deposit)} for ${placeWords(inp)}. I've gone through each one.`);
  lines.push("");
  read.items.forEach((r) => lines.push(itemLine(r)));
  lines.push("");
  const settled = read.items.filter((r) => r.fair !== null).reduce((s, r) => s + (r.fair ?? 0), 0);
  if (read.open > 0) {
    lines.push(`For the rest, I agree to ${money(Math.min(read.deposit, settled))} in total, and I'll look again at the item${read.open === 1 ? "" : "s"} above once I've seen the evidence. Please return ${money(Math.max(0, read.deposit - read.claimed))} now${read.claimed >= read.deposit ? " if any of the deposit isn't in dispute" : ", the part that isn't in dispute"}.`);
  } else if (read.fair <= 0) {
    lines.push(`So I don't accept any deduction. Please return the full ${money(read.deposit)}.`);
  } else {
    const now = read.undisputed > 0 && read.undisputed < read.back ? ` In any case, please release the ${money(read.undisputed)} that isn't in dispute now.` : "";
    lines.push(`So I agree to deductions of ${money(read.fair)}. Please return the balance of ${money(read.back)} within ${PAY_DAYS} days of agreeing.${now}`);
  }
  if (read.claimed > read.deposit) {
    lines.push("");
    lines.push(`Your list comes to ${money(read.claimed)}, more than the deposit. Anything above the deposit would have to be proved in court; the scheme can only decide on the deposit itself.`);
  }
  if (read.over > 0) {
    lines.push("");
    lines.push(overLine(read));
  }
  lines.push("");
  lines.push(
    `I'd rather agree this between us. If we haven't by ${letterDate(read.replyBy)}, I'll refer the disputed amount to ${schemeName(inp)}'s free dispute resolution service, where the deductions will need the check-in report, the check-out report and invoices to support them.`,
  );
  signOff(lines);
  return lines.join("\n");
}

/** The statement for the scheme's dispute form. */
export function disputeMessage(inp: DepositInputs, read: DepositRead): string {
  const lines: string[] = [];
  const who = inp.landlord.trim() || "the landlord";
  lines.push(`My tenancy at ${placeWords(inp)} ended${movedWords(inp)}. The deposit is ${money(read.deposit)}.`);
  lines.push("");
  if (read.items.length) {
    lines.push(`${capital(who)} proposes deductions of ${money(read.claimed)}. I accept ${money(read.items.filter((r) => r.verdict === "accept").reduce((s, r) => s + r.claimed, 0))} of that. On the rest:`);
    lines.push("");
    read.items.filter((r) => r.verdict !== "accept").forEach((r) => lines.push(itemLine(r).replace(/I'll pay/g, "I offered")));
    lines.push("");
    lines.push(`I'm asking for ${money(read.back)} of the deposit to be returned to me.`);
  } else {
    const asked = isISODate(inp.askedOn) ? ` on ${letterDate(inp.askedOn)}` : "";
    lines.push(`I asked ${who === "the landlord" ? "the landlord" : who} for the deposit back${asked} and have had no reply and no itemised deductions. I'm asking for the full ${money(read.deposit)} to be returned.`);
  }
  lines.push("");
  lines.push(
    `The landlord has to show that each deduction is justified, and adjudicators allow for fair wear and tear and don't award betterment.${inp.inventory === "none" ? " There was no check-in inventory, so there's no record of the condition at the start to compare against." : " I'm attaching the check-in inventory, my photos from moving out, and our correspondence."}`,
  );
  return lines.join("\n");
}

/** The chase for an agreed amount that hasn't arrived. */
export function agreedMessage(inp: DepositInputs, read: DepositRead): string {
  const lines: string[] = [greeting(inp), ""];
  const on = isISODate(inp.askedOn) ? ` on ${letterDate(inp.askedOn)}` : "";
  lines.push(`We agreed${on} the amount of my deposit to be returned for ${placeWords(inp)}. It hasn't arrived.`);
  lines.push("");
  lines.push(`The deposit scheme rules require it to be repaid within ${PAY_DAYS} days of agreement. Please pay it by ${letterDate(read.replyBy)}. If it hasn't arrived by then, I'll ask ${schemeName(inp)} to release it.`);
  signOff(lines);
  return lines.join("\n");
}

/** The letter for a deposit that was never protected. */
export function unprotectedMessage(inp: DepositInputs, read: DepositRead): string {
  const lines: string[] = [greeting(inp), ""];
  const base = read.items.length ? read.back : read.deposit;
  lines.push(`I paid a deposit of ${money(read.deposit)} for ${placeWords(inp)}. I've checked, and it wasn't protected in a government-approved deposit scheme, and I wasn't given the scheme's details.`);
  lines.push("");
  if (inp.nation === "scotland") {
    lines.push(`A landlord must lodge a deposit with an approved scheme within 30 working days of the tenancy starting (Tenancy Deposit Schemes (Scotland) Regulations 2011). If not, the First-tier Tribunal must order the landlord to pay up to three times the deposit.`);
    lines.push("");
    lines.push(`Please return ${money(base)} by ${letterDate(read.replyBy)}. If you don't, I'll apply to the tribunal for the deposit and the payment.`);
  } else if (inp.nation === "ni") {
    lines.push(`A landlord in Northern Ireland must protect a deposit in an approved scheme and give the tenant its details. If not, the council can fine the landlord.`);
    lines.push("");
    lines.push(`Please return ${money(base)} by ${letterDate(read.replyBy)}. If you don't, I'll report this to the council and claim the deposit through the small claims court.`);
  } else {
    const law =
      inp.nation === "wales"
        ? "section 45 of the Renting Homes (Wales) Act 2016. Where it isn't, the court must order the landlord to pay up to three times the deposit (Schedule 5)"
        : "section 213 of the Housing Act 2004. Where it isn't, the court must order the deposit's return and a payment of between one and three times its amount (section 214)";
    lines.push(`A deposit must be protected, and the scheme's details given to the tenant, within 30 days, under ${law}.`);
    lines.push("");
    lines.push(`Please return ${money(base)} by ${letterDate(read.replyBy)}. If you'd like to settle the penalty without a court claim, I'm open to that. If I haven't heard by then, I'll start a claim in the county court.`);
  }
  if (read.over > 0) {
    lines.push("");
    lines.push(overLine(read));
  }
  signOff(lines);
  return lines.join("\n");
}

/** The letter before a small claim, once the scheme's window has closed. */
export function lateMessage(inp: DepositInputs, read: DepositRead): string {
  const lines: string[] = [greeting(inp), ""];
  const amount = read.items.length ? read.back : read.deposit;
  lines.push(`I moved out of ${placeWords(inp)}${movedWords(inp)}. ${money(amount)} of my ${money(read.deposit)} deposit is still owed to me${read.items.length ? ", after the deductions I accept" : ""}.`);
  lines.push("");
  if (read.items.length) {
    read.items.filter((r) => r.verdict !== "accept").forEach((r) => lines.push(itemLine(r)));
    lines.push("");
  }
  lines.push(`Please pay ${money(amount)} by ${letterDate(read.replyBy)}. If it hasn't arrived by then, I'll make a claim in the small claims court without further notice.`);
  signOff(lines);
  return lines.join("\n");
}

/** The main message for this read, with its title. */
export function mainMessage(inp: DepositInputs, read: DepositRead): { title: string; text: string } | null {
  switch (read.kind) {
    case "living":
      return null;
    case "unprotected":
      return { title: "Your letter to the landlord", text: unprotectedMessage(inp, read) };
    case "late":
      return { title: "Your letter before a small claim", text: lateMessage(inp, read) };
    case "agreed":
      return { title: "Your chase", text: agreedMessage(inp, read) };
    case "ask":
    case "wait":
      return { title: read.kind === "wait" ? "The message you sent, or should have" : "Your message to the landlord", text: askMessage(inp, read.replyBy ? read : { ...read, replyBy: addDaysISO(todayISO(), REPLY_DAYS) }) };
    case "reply":
      return { title: "Your reply to their deductions", text: replyMessage(inp, read) };
    case "dispute":
      return { title: `For ${schemeName(inp)}'s dispute form`, text: disputeMessage(inp, read) };
  }
}

/** The answer's headline: the words printed largest, and spoken. */
export function depositHeadline(inp: DepositInputs, read: DepositRead): string {
  switch (read.kind) {
    case "living":
      return "Before you hand back the keys: photograph every room.";
    case "unprotected":
      return inp.nation === "ni"
        ? `It was never protected. Ask for ${money(read.items.length ? read.back : read.deposit)} back, and tell the council.`
        : `It was never protected. That's ${money(read.deposit)} back, plus up to ${money(read.deposit * 3)} on top.`;
    case "late":
      return `The scheme's window has closed. Small claims is still open for ${money(read.items.length ? read.back : read.deposit)}.`;
    case "agreed":
      return read.payBy && read.payBy < todayISO() ? `The ${PAY_DAYS} days are up. Chase it, then go to the scheme.` : `They have ${PAY_DAYS} days from agreeing to pay it.`;
    case "ask":
      return `Ask for all ${money(read.deposit)}, in writing, today.`;
    case "wait":
      return `They have until ${actDate(read.replyBy)} to list any deductions.`;
    case "reply":
      if (read.claimed <= 0) return "Nothing to dispute.";
      if (read.fair <= 0) return `None of it is chargeable. Ask for all ${money(read.deposit)} back.`;
      if (read.fair >= Math.min(read.claimed, read.deposit) && read.open === 0) return "Their deductions look fair. Agree, and get the rest within ten days.";
      return `They want ${money(Math.min(read.claimed, read.deposit))}. Fair is about ${money(read.fair)}${read.open ? ", so far" : ""}. Ask for ${money(read.back)} back.`;
    case "dispute":
      return read.items.length
        ? `Take the ${money(Math.max(0, Math.min(read.claimed, read.deposit) - read.fair))} you disagree on to the scheme. It's free.`
        : `No reply. Raise a dispute with ${schemeName(inp)}; it's free.`;
  }
}

/** One paragraph under the headline: why this, in plain words. */
export function depositBody(inp: DepositInputs, read: DepositRead): string {
  const scheme = schemeName(inp);
  const deadline = read.disputeBy ? ` The last day to raise it is ${actDate(read.disputeBy)}, three months after you moved out.` : "";
  switch (read.kind) {
    case "living":
      return `Deposit disputes are decided on paper, and the paper is made in the last week. Dig out the check-in inventory and go room by room against it. On the last day, photograph and video every room, the oven, the fridge, the bathroom and the meter readings, with the date on. Clean to the standard you found it (not better), keep the receipts, and give your forwarding address in writing. Check now that the deposit is protected: search the scheme websites with your name, postcode and deposit amount.${inp.protection === "no" ? " If it isn't, see below: that changes everything." : ""}`;
    case "unprotected":
      if (inp.nation === "scotland")
        return `In Scotland a deposit must be lodged with an approved scheme within 30 working days. Because it wasn't, the tribunal must order the landlord to pay you up to three times the deposit, as well as returning it. You must apply within three months of moving out: by ${read.tribunalBy ? actDate(read.tribunalBy) : "three months after you left"}. The application is free.`;
      if (inp.nation === "ni")
        return "In Northern Ireland the landlord had to protect the deposit and give you the details. The penalty is a council fine rather than a payment to you, so the letter asks for the deposit itself and says you'll report it. The deposit can still be claimed in the small claims court.";
      return inp.nation === "wales"
        ? "In Wales a deposit must be protected within 30 days. If it wasn't, the court must order the landlord to pay up to three times the deposit, and the claim survives the end of the contract. The letter asks for the deposit back first; many landlords settle once it's in writing. Shelter Cymru has template letters and can help."
        : "In England a deposit must be protected within 30 days, with the details given to you. If it wasn't, the court must order the deposit back plus one to three times its amount, depending on how bad the breach was. You have six years from the breach, and it doesn't matter that the tenancy has ended. The letter asks for the deposit back first; many landlords settle once it's in writing. Shelter and Citizens Advice can help with the court claim.";
    case "late":
      return `The schemes take disputes for about three months after the tenancy ends, and that's passed. The deposit is still yours, though: a claim for it runs six years in England and Wales. Send the letter below, and if it isn't paid, claim online through the small claims court (Money Claim Online in England and Wales); the fee is modest and you don't need a lawyer. Ask ${scheme} first whether it will still take the dispute: some make exceptions.`;
    case "agreed":
      return `Once the amount is agreed, the landlord has ${PAY_DAYS} days to repay it.${read.payBy ? ` That was ${actDate(read.payBy)}.` : ""} If it still hasn't come, tell ${scheme}: if the deposit is held by the scheme it can repay you directly, and if the landlord holds it under an insured scheme, the scheme can step in and recover it from them.`;
    case "ask":
      return `The deposit is your money held as security, not theirs to keep until you argue. Ask for it in writing, so there's a date on it, and ask for any deductions to be itemised with evidence. Then decide the next step now: if there's no list by ${actDate(read.replyBy)}, it goes to ${scheme}'s free dispute service.${deadline}`;
    case "wait":
      return `If an itemised list arrives, come back and enter it: the tool prices each line and writes your reply. If nothing has come by ${actDate(read.replyBy)}, raise a dispute with ${scheme}. It's free, and the money stays protected until it's decided.${deadline}`;
    case "reply":
      return `Each line is priced the way an adjudicator would. Fair wear and tear isn't chargeable. A replacement is charged only for the life the old one had left, because the landlord can't end up better off than at the start. Cleaning is owed back to the check-in standard, not to a professional standard.${inp.inventory === "none" ? " And with no check-in inventory, the landlord can't show the condition changed: the burden is on them." : ""} Send the reply below, ask for the undisputed part now, and if there's no agreement, take the rest to ${scheme}. Adjudicators split most disputed deposits, and the landlord has to bring evidence for every pound.${deadline}`;
    case "dispute":
      return `${scheme} decides on the written evidence alone, for free, and its decision is final. The landlord has to justify each deduction; you have to show your side. Raise the dispute online, paste in the statement below, and attach the check-in inventory, your move-out photos, the tenancy agreement and every message. The disputed money stays protected until it's decided.${deadline}`;
  }
}

/** Before moving out, or for the dispute: what makes the evidence. */
export function evidenceLines(inp: DepositInputs): string[] {
  return [
    inp.inventory === "none"
      ? "There was no check-in inventory. That helps you: the landlord has nothing to compare the end against. Keep any messages or photos from the start."
      : "The check-in inventory, signed if you have it. It's the baseline everything is measured against.",
    "Dated photos and video of every room on the day you left, including the oven, the fridge, the bathroom and the meters.",
    "Receipts for any cleaning or repairs you paid for, and your rent statements.",
    "Every message about the deposit, so the dates are on record.",
  ];
}

/** The standing rule: the reusable part. */
export function depositRule(): string {
  return "My line for deposits: photos on the way in and on the way out, the scheme checked in the first month, and every deduction answered in writing: wear and tear isn't chargeable, and a replacement is charged only for the life the old one had left.";
}

/** The plain-text record. */
export function depositSummary(inp: DepositInputs, read: DepositRead): string {
  const lines: string[] = [];
  const what = inp.what.trim();
  if (what) lines.push(capital(what));
  lines.push(depositHeadline(inp, read));
  lines.push("");
  lines.push(depositBody(inp, read));
  if (read.items.length) {
    lines.push("");
    lines.push("The deductions, priced:");
    read.items.forEach((r) => lines.push(itemLine(r)));
  }
  const main = mainMessage(inp, read);
  if (main) {
    lines.push("");
    lines.push(`${main.title}:`);
    lines.push(main.text);
  }
  if (read.kind === "reply") {
    lines.push("");
    lines.push(`If it comes to the scheme, for ${schemeName(inp)}'s form:`);
    lines.push(disputeMessage(inp, read));
  }
  if (read.disputeBy && read.kind !== "late") {
    lines.push("");
    lines.push(`Last day to raise the dispute: ${letterDate(read.disputeBy)}`);
  }
  if (read.tribunalBy) {
    lines.push("");
    lines.push(`Last day to apply to the tribunal: ${letterDate(read.tribunalBy)}`);
  }
  lines.push("");
  lines.push(depositRule());
  return lines.join("\n");
}

const NATIONS: Nation[] = ["england", "wales", "scotland", "ni"];
const PROTECTIONS: Protection[] = ["yes", "late", "no", "unsure"];
const SCHEMES: Scheme[] = ["dps", "tds", "myd", "sds", "lps", "unknown"];
const INVENTORIES: Inventory[] = ["signed", "photos", "none"];
const RENT_PERS: RentPer[] = ["month", "week"];
const STAGES: Stage[] = ["living", "none", "silent", "proposed", "stuck", "agreed"];
const KINDS: ItemKind[] = ["clean", "damage", "wear", "replace", "redecorate", "rent", "other"];
const VIEWS: View[] = ["fair", "much", "not"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

function parseItem(raw: unknown): DepositItem {
  if (!raw || typeof raw !== "object") return BLANK_ITEM;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what, 120),
    amount: str(v.amount, 40),
    kind: oneOf(v.kind, KINDS),
    view: oneOf(v.view, VIEWS),
    age: str(v.age, 10),
    life: str(v.life, 10),
    offer: str(v.offer, 40),
  };
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseDepositInputs(raw: unknown): DepositInputs {
  if (!raw || typeof raw !== "object") return BLANK_DEPOSIT;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what),
    landlord: str(v.landlord),
    nation: oneOf(v.nation, NATIONS),
    deposit: str(v.deposit, 40),
    rent: str(v.rent, 40),
    rentPer: oneOf(v.rentPer, RENT_PERS),
    protection: oneOf(v.protection, PROTECTIONS),
    scheme: oneOf(v.scheme, SCHEMES),
    inventory: oneOf(v.inventory, INVENTORIES),
    movedOut: date(v.movedOut),
    stage: oneOf(v.stage, STAGES),
    askedOn: date(v.askedOn),
    items: Array.isArray(v.items) ? v.items.slice(0, MAX_ITEMS).map(parseItem) : [],
  };
}

/**
 * The worked example: three years in a two-bed flat, a £1,200 deposit, and a
 * list of deductions that comes to more than the deposit.
 */
export const DEPOSIT_EXAMPLE: DepositInputs = {
  what: "the flat on Elm Road",
  landlord: "the letting agent",
  nation: "england",
  deposit: "£1,200",
  rent: "£1,100",
  rentPer: "month",
  protection: "yes",
  scheme: "tds",
  inventory: "signed",
  movedOut: "",
  stage: "proposed",
  askedOn: "",
  items: [
    { what: "new lounge carpet", amount: "£600", kind: "replace", view: "much", age: "5", life: "6", offer: "" },
    { what: "full repaint", amount: "£450", kind: "redecorate", view: "much", age: "3", life: "5", offer: "" },
    { what: "professional clean", amount: "£250", kind: "clean", view: "much", age: "", life: "", offer: "£80" },
    { what: "filling picture-hook holes", amount: "£60", kind: "wear", view: "not", age: "", life: "", offer: "" },
    { what: "broken bathroom blind", amount: "£35", kind: "damage", view: "fair", age: "", life: "", offer: "" },
  ],
};

/** The example's dates, relative to today. */
export function depositExample(today = todayISO()): DepositInputs {
  return { ...DEPOSIT_EXAMPLE, movedOut: addDaysISO(today, -12) };
}
