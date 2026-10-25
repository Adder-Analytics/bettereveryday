/**
 * The read behind "Get Your Money Back" (/refund).
 *
 * The washing machine dies in month four. The parcel says delivered and isn't
 * there. The plasterer's wall cracks. Most people in that spot do one of two
 * things: ring up, get told no, and give up; or say nothing at all.
 *
 *   - Most people with a grievance never complain. The TARP studies for the US
 *     government (1970s–90s) put the share of unhappy customers who didn't
 *     complain at roughly 60–80% depending on the industry; later work (Kwok,
 *     2021) keeps finding the same reasons: it won't be worth the time, it
 *     won't work, and "I don't know where or how". Huppertz's effort model puts
 *     the expected effort first among them.
 *   - Some of that effort is put there on purpose. Sunstein ("Sludge Audits",
 *     Behavioural Public Policy, 2020) calls it sludge: friction that costs
 *     time and wears people down until they drop a claim they'd have won.
 *   - The rights are better than people think, and simpler than they look.
 *     In the UK the Consumer Rights Act 2015 gives 30 days to reject faulty
 *     goods for a full refund; after that one repair or replacement, then a
 *     refund; a fault in the first six months is presumed to have been there
 *     from the start; claims can run six years (five in Scotland). Goods are
 *     the seller's risk until they're in your hands (s29), so a lost parcel is
 *     the shop's problem, not the courier's. A service must be done with
 *     reasonable care and skill, or redone free, or the price cut. Online,
 *     the Consumer Contracts Regulations 2013 give 14 days after delivery to
 *     cancel for any reason.
 *   - And there's a second door most people don't know about. Section 75 of
 *     the Consumer Credit Act 1974 makes a credit card company equally liable
 *     for anything priced £100 to £30,000, even if only the deposit went on
 *     the card. Chargeback is the card schemes' own process for debit and
 *     credit cards: not a legal right, any amount, usually within 120 days.
 *
 * So the tool takes the effort out (it writes the message) and decides the
 * next step before the first one is sent: one remedy, named in law, with a
 * date to reply by, and the rung after that already chosen. Silence or a no
 * then isn't the end; it's the signal to take the next rung.
 *
 * The read, checked in order:
 *   1. "policy"   — changed your mind outside any legal right: the shop's
 *                   own returns policy is all there is, so ask nicely.
 *   2. "cancel"   — changed your mind about something bought online, still
 *                   inside the 14 days: cancel, in writing, by the date.
 *   3. "private"  — a private seller, and the problem isn't "not as
 *                   described": little recourse beyond the platform.
 *   4. "old"      — more than six years ago: likely out of time; ask anyway.
 *   5. "ask"      — you haven't asked yet: the first message.
 *   6. "wait"     — you've asked and the reply-by date hasn't come.
 *   7. "escalate" — refused, ignored, or the date has passed: the next rung.
 *
 * UK law, with the US differences noted in the copy. Not legal advice.
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";

export type Problem = "" | "faulty" | "described" | "missing" | "service" | "mind";
export type Where = "" | "online" | "shop" | "private";
export type Paid = "" | "credit" | "debit" | "platform" | "transfer";
export type Stage = "" | "none" | "asked" | "refused" | "ignored";

export type RefundInputs = {
  /** What it is, in a few words: "the washing machine". */
  what: string;
  /** Who you bought it from. */
  seller: string;
  problem: Problem;
  where: Where;
  /** The price, as typed. */
  price: string;
  paid: Paid;
  /** ISO date it arrived, or the work was finished, or it should have arrived. */
  got: string;
  /** They've already had one go at repairing, replacing or redoing it. */
  triedFix: boolean;
  stage: Stage;
  /** ISO date you first asked, when you have. */
  askedOn: string;
};

export const BLANK_REFUND: RefundInputs = {
  what: "",
  seller: "",
  problem: "",
  where: "",
  price: "",
  paid: "",
  got: "",
  triedFix: false,
  stage: "",
  askedOn: "",
};

export type RefundKind = "policy" | "cancel" | "private" | "old" | "ask" | "wait" | "escalate";

/** Where you are in the 30-day / six-month / six-year scheme for goods. */
export type Window = "reject" | "early" | "late" | "old";

/** The route after the seller. */
export type Route = "s75" | "chargeback" | "platform" | "court";

export type Rung = { id: "seller" | "card" | "ombudsman" | "court"; head: string; body: string; now: boolean };

export type RefundRead = {
  kind: RefundKind;
  window: Window;
  /** Days since it arrived (or was done, or was due). */
  days: number;
  /** The route after the seller, for this payment and date. */
  route: Route;
  /** True when a chargeback is likely still inside the usual 120 days. */
  chargebackOpen: boolean;
  /** ISO date the seller should reply by. "" when there's no letter in play. */
  replyBy: string;
  /** Online cancellations: the last day to cancel. */
  cancelBy: string;
  rungs: Rung[];
};

/** How many days to give the seller. Citizens Advice's template letters ask for 14. */
export const REPLY_DAYS = 14;
/** The usual chargeback window, from the purchase or the date it should have arrived. */
export const CHARGEBACK_DAYS = 120;
/** Section 75 covers single items (or sets) priced in this band. */
export const S75_MIN = 100;
export const S75_MAX = 30000;

export function todayISO(): string {
  return isoOf(new Date());
}

function isoOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(new Date(`${s}T00:00:00`).getTime());
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return isoOf(d);
}

function addMonthsISO(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return isoOf(d);
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** "25 October 2026": a date for a letter. */
export function letterDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** "Saturday 8 November": a date to act on. */
export function actDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function refundCurrency(inp: RefundInputs): string {
  const m = inp.price.match(/[£$€]/);
  return m ? m[0] : "£";
}

export function priceOf(inp: RefundInputs): number | null {
  return parseMoney(inp.price);
}

function priceText(inp: RefundInputs): string {
  const p = priceOf(inp);
  return p === null ? "" : formatMoney(p, refundCurrency(inp));
}

export function windowOf(got: string, today: string): Window {
  if (daysBetween(got, today) <= 30) return "reject";
  if (today <= addMonthsISO(got, 6)) return "early";
  if (today <= addMonthsISO(got, 72)) return "late";
  return "old";
}

export function routeOf(inp: RefundInputs, days: number): Route {
  const p = priceOf(inp);
  if (inp.paid === "credit" && p !== null && p >= S75_MIN && p <= S75_MAX && inp.where !== "private") return "s75";
  if ((inp.paid === "credit" || inp.paid === "debit") && days <= CHARGEBACK_DAYS) return "chargeback";
  if (inp.paid === "platform") return "platform";
  return "court";
}

/** True when the read has what it needs. */
export function refundReady(inp: RefundInputs): boolean {
  if (!inp.problem || !inp.where) return false;
  if (inp.problem === "mind") return isISODate(inp.got) || inp.where !== "online";
  return Boolean(inp.paid) && isISODate(inp.got) && Boolean(inp.stage);
}

export function readRefund(inp: RefundInputs, today = todayISO()): RefundRead | null {
  if (!refundReady(inp)) return null;
  const got = isISODate(inp.got) ? (inp.got > today ? today : inp.got) : today;
  const days = daysBetween(got, today);
  const window = windowOf(got, today);
  const route = routeOf(inp, days);
  const chargebackOpen = days <= CHARGEBACK_DAYS;
  const cancelBy = addDaysISO(got, 14);
  const asked = isISODate(inp.askedOn) ? inp.askedOn : "";
  let kind: RefundKind;
  let replyBy = "";
  if (inp.problem === "mind") {
    kind = inp.where === "online" && today <= cancelBy ? "cancel" : "policy";
  } else if (inp.where === "private" && inp.problem !== "described" && inp.problem !== "missing") {
    kind = "private";
  } else if (window === "old") {
    kind = "old";
  } else if (inp.stage === "none") {
    kind = "ask";
    replyBy = addDaysISO(today, REPLY_DAYS);
  } else if (inp.stage === "asked" && (!asked || addDaysISO(asked, REPLY_DAYS) > today)) {
    kind = "wait";
    replyBy = asked ? addDaysISO(asked, REPLY_DAYS) : addDaysISO(today, REPLY_DAYS);
  } else {
    kind = "escalate";
    replyBy = addDaysISO(today, REPLY_DAYS);
  }
  const read: RefundRead = { kind, window, days, route, chargebackOpen, replyBy, cancelBy, rungs: [] };
  read.rungs = ladder(inp, read);
  return read;
}

/** The thing you're asking for, in the words that go in the letter. */
export function remedyOf(inp: RefundInputs, read: RefundRead): string {
  const price = priceText(inp);
  const full = price ? `a full refund of ${price}` : "a full refund";
  switch (inp.problem) {
    case "missing":
      return `delivery of the order by ${letterDate(read.replyBy || addDaysISO(todayISO(), REPLY_DAYS))}, or ${full}`;
    case "service":
      return inp.triedFix
        ? "a reduction in the price that reflects the poor work, up to a full refund"
        : "the work to be put right at no cost to me, within a reasonable time";
    case "mind":
      return full;
    default:
      if (inp.where === "private") return full;
      if (inp.triedFix) return read.window === "late" ? "a refund (less a fair deduction for the use I've had)" : full;
      if (read.window === "reject") return full;
      return "a free repair or replacement";
  }
}

/** The law the letter leans on, one sentence. */
function lawLine(inp: RefundInputs, read: RefundRead): string {
  if (inp.where === "private") return "The item wasn't as you described it in the listing.";
  switch (inp.problem) {
    case "missing":
      return "Under the Consumer Rights Act 2015, goods remain the seller's responsibility until they are in my possession, so a lost or undelivered parcel is for you to resolve, not the courier.";
    case "service":
      return "Under the Consumer Rights Act 2015, a service must be carried out with reasonable care and skill." + (inp.triedFix
        ? " You've already had the chance to put it right, so I'm entitled to a price reduction."
        : " Where it isn't, I'm entitled to have it done again properly at no cost.");
    case "mind":
      return "Under the Consumer Contracts Regulations 2013, I'm cancelling within 14 days of delivery.";
    default: {
      const base = "Under the Consumer Rights Act 2015, goods must be of satisfactory quality, fit for purpose and as described.";
      if (inp.triedFix) return `${base} You've already had one attempt at a repair or replacement, so I'm now exercising my final right to reject.`;
      if (read.window === "reject") return `${base} I'm within 30 days of delivery, so I'm exercising my short-term right to reject.`;
      if (read.window === "early") return `${base} The fault appeared within six months of delivery, so it's presumed to have been there from the start.`;
      return `${base} Goods must also last a reasonable time, and this shouldn't have failed so soon.`;
    }
  }
}

function problemLine(inp: RefundInputs): string {
  switch (inp.problem) {
    case "faulty":
      return "It's faulty: [say what's wrong, and when it started].";
    case "described":
      return "It isn't as described: [say what's different from the listing or what you were told].";
    case "missing":
      return "It hasn't arrived.";
    case "service":
      return "It wasn't done to a reasonable standard: [say what's wrong].";
    default:
      return "";
  }
}

function capital(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function gotWord(inp: RefundInputs): string {
  if (inp.problem === "missing") return "was due on";
  if (inp.problem === "service") return "was finished on";
  return "arrived on";
}

/** What happens next if the seller doesn't put it right: the phrase for the letter. */
function nextPhrase(inp: RefundInputs, route: Route): string {
  switch (route) {
    case "s75":
      return "make a claim against my credit card provider under section 75 of the Consumer Credit Act 1974";
    case "chargeback":
      return "ask my card provider to reverse the payment";
    case "platform":
      return "open a claim with the platform I paid through";
    case "court":
      return inp.where === "private"
        ? "consider a claim in the small claims court"
        : "start a claim in the small claims court without further notice";
  }
}

/** The message to the seller: the first ask, or the final one before the next rung. */
export function sellerMessage(inp: RefundInputs, read: RefundRead, today = todayISO()): string {
  const seller = inp.seller.trim();
  const what = inp.what.trim() || (inp.problem === "service" ? "the work" : "my order");
  const price = priceText(inp);
  const lines: string[] = [];
  lines.push(seller && !/^(the|a|an|my)\s/i.test(seller) ? `Dear ${seller},` : "Hello,");
  lines.push("");
  if (read.kind === "cancel") {
    lines.push(`I'm writing to cancel my order for ${what}${price ? ` (${price})` : ""}, which arrived on ${letterDate(inp.got)}. ${lawLine(inp, read)}`);
    lines.push("");
    lines.push("Please tell me how to return it, and refund me, including the standard delivery charge, within 14 days of receiving it back or of my proof of postage.");
  } else if (read.kind === "policy") {
    lines.push(`I bought ${what}${price ? ` for ${price}` : ""}${isISODate(inp.got) ? ` on ${letterDate(inp.got)}` : ""}, and it isn't right for me. It's unused and I have the receipt.`);
    lines.push("");
    lines.push("Could I return it for a refund, or an exchange or credit note if a refund isn't possible?");
  } else {
    const first = read.kind === "ask" || read.kind === "wait" || read.kind === "old" || read.kind === "private";
    const intro = `${capital(what)}${price ? `, which cost ${price},` : ""} ${gotWord(inp)} ${letterDate(inp.got)}.`;
    if (first) {
      lines.push(`${intro} ${problemLine(inp)}`);
      lines.push("");
      if (read.kind !== "private") lines.push(lawLine(inp, read));
      else lines.push("Your listing said [quote it]. That isn't what I received.");
      lines.push("");
      lines.push(`I'm asking for ${remedyOf(inp, read)}. Please reply by ${letterDate(read.replyBy || addDaysISO(today, REPLY_DAYS))}.`);
      if (read.kind === "old") {
        lines.push("");
        lines.push("I realise it's some time since I bought it, and I'd appreciate it if you'd consider this as a goodwill gesture.");
      }
    } else {
      const asked = isISODate(inp.askedOn) ? ` on ${letterDate(inp.askedOn)}` : "";
      const reply = inp.stage === "refused" ? "You refused." : "I haven't had a satisfactory reply.";
      lines.push(`I wrote to you${asked} about ${what}${price ? ` (${price})` : ""}, which ${gotWord(inp)} ${letterDate(inp.got)}, asking for ${remedyOf(inp, read)}. ${reply}`);
      lines.push("");
      lines.push(lawLine(inp, read));
      lines.push("");
      lines.push(`I'm asking again for ${remedyOf(inp, read)}. If this isn't resolved by ${letterDate(read.replyBy)}, I will ${nextPhrase(inp, read.route)}.`);
    }
  }
  lines.push("");
  lines.push("Thank you,");
  lines.push("[your name, order number, and how to reach you]");
  return lines.join("\n");
}

/** The message to the card company or platform, when that's the next rung. */
export function cardMessage(inp: RefundInputs, read: RefundRead): string | null {
  if (read.kind !== "escalate" || read.route === "court") return null;
  const seller = inp.seller.trim() || "the seller";
  const what = inp.what.trim() || (inp.problem === "service" ? "a service" : "an order");
  const price = priceText(inp);
  const asked = isISODate(inp.askedOn) ? ` on ${letterDate(inp.askedOn)}` : "";
  const answer = inp.stage === "refused" ? "they refused" : "I haven't had a satisfactory reply";
  const problem = problemLine(inp).replace(/\s*\[[^\]]*\]\.?$/, ".").replace(/:\.$/, ".");
  const lines: string[] = [];
  if (read.route === "s75") {
    lines.push("I'm making a claim under section 75 of the Consumer Credit Act 1974.");
    lines.push("");
    lines.push(`I paid ${seller}${price ? ` ${price}` : ""} for ${what} using this card (ending [last four digits]). It ${gotWord(inp)} ${letterDate(inp.got)}. ${problem}`);
    lines.push("");
    lines.push(`I asked ${seller} for ${remedyOf(inp, read)}${asked}, and ${answer}. As you're jointly liable with the seller, I'm asking you to refund ${price || "the amount"}.`);
  } else if (read.route === "chargeback") {
    lines.push(`I'd like to raise a chargeback on a card payment of ${price || "[amount]"} to ${seller}${isISODate(inp.got) ? `, for ${what} that ${gotWord(inp)} ${letterDate(inp.got)}` : ""}.`);
    lines.push("");
    lines.push(`${problem} I asked ${seller} to put it right${asked}, and ${answer}.`);
  } else {
    lines.push(`I'm opening a claim about my payment of ${price || "[amount]"} to ${seller} for ${what}, which ${gotWord(inp)} ${letterDate(inp.got)}.`);
    lines.push("");
    lines.push(`${problem} I asked the seller to put it right${asked}, and ${answer}.`);
  }
  lines.push("");
  lines.push("I attach the receipt, my messages to the seller, and photos.");
  return lines.join("\n");
}

/** The answer's headline: the words printed largest, and spoken. */
export function refundHeadline(inp: RefundInputs, read: RefundRead): string {
  switch (read.kind) {
    case "policy":
      return inp.where === "private"
        ? "A private sale can't be returned for a change of mind."
        : "There's no legal right here, but ask: most shops will.";
    case "cancel":
      return `You can still cancel. Tell them by ${actDate(read.cancelBy)}.`;
    case "private":
      return "A private seller owes you what they described, not more.";
    case "old":
      return "It's probably out of time. Ask anyway, as a goodwill gesture.";
    case "wait":
      return `Give them until ${actDate(read.replyBy)}. The next step is ready.`;
    case "ask":
      if (inp.problem === "missing") return "It's the seller's problem, not the courier's. Ask them to deliver or refund.";
      if (inp.problem === "service") return inp.triedFix ? "Ask for money off: they've had their chance to fix it." : "Ask them to put it right, free.";
      if (inp.triedFix) return "They've had their one go. Ask for your money back.";
      if (read.window === "reject") return "You can reject it. Ask for a full refund, in writing.";
      return "Ask for a free repair or replacement, in writing.";
    case "escalate":
      switch (read.route) {
        case "s75":
          return "Claim from your card company: it's as liable as the seller.";
        case "chargeback":
          return `Ask your bank for a chargeback, before about ${actDate(addDaysISO(inp.got, CHARGEBACK_DAYS))}.`;
        case "platform":
          return "Open a claim with the platform you paid through.";
        case "court":
          return "Send a final letter with a date. Then small claims.";
      }
  }
}

/** The ladder: every rung, with the one you're on marked. */
export function ladder(inp: RefundInputs, read: RefundRead): Rung[] {
  const rungs: Rung[] = [];
  const onSeller = read.kind === "ask" || read.kind === "wait" || read.kind === "old" || read.kind === "private";
  rungs.push({
    id: "seller",
    head: "Ask the seller, in writing, for one thing, by a date.",
    body: "Email, or their complaints form, so there's a record with a date on it. Name the remedy and the law, give them 14 days, and keep the reply. A phone call is fine for speed, but follow it with a message that says what was agreed.",
    now: onSeller,
  });
  if (inp.paid === "credit" || inp.paid === "debit" || inp.paid === "platform") {
    let body: string;
    if (read.route === "s75") {
      body = "Because you paid by credit card and it cost between £100 and £30,000, section 75 makes the card company equally liable. Claim from them directly: it's a legal right, there's no 120-day limit, and it counts even if only the deposit went on the card.";
    } else if (read.route === "chargeback") {
      body = `Your card provider can reverse the payment through the card scheme. It isn't a legal right, but it covers any amount, and it usually has to be raised within about 120 days of paying or of the date it should have arrived (here, by about ${actDate(addDaysISO(inp.got, CHARGEBACK_DAYS))}). Ask for a "chargeback" by name.`;
    } else if (read.route === "platform") {
      body = "PayPal, Klarna, eBay, Etsy and most marketplaces have their own buyer protection, with their own deadline (PayPal's is 180 days from payment). Open the claim inside the app. If you paid PayPal with a credit card, section 75 usually doesn't reach the seller, because PayPal sits in between.";
    } else {
      body = "A chargeback usually has to be raised within about 120 days, and this is past that. Ask your bank anyway (some schemes run longer for goods that were due later), but expect the letter and the court to be your route.";
    }
    rungs.push({ id: "card", head: "Go round them: your card or the platform.", body, now: read.kind === "escalate" && read.route !== "court" });
  }
  rungs.push({
    id: "ombudsman",
    head: "If there's an ombudsman, use it.",
    body: "Energy, phone and broadband companies, banks and insurers must belong to one, and many retailers and trades join an approved scheme. After eight weeks, or a final \"deadlock\" letter, you can take it to them, free.",
    now: false,
  });
  rungs.push({
    id: "court",
    head: "A final letter with a date, then small claims.",
    body: "Say what you'll do and by when, and then do it. In England and Wales the small claims track takes claims up to £10,000 online, without a lawyer; Scotland's simple procedure and Northern Ireland's small claims go to £5,000. The court fee is usually added to what they owe you if you win. Many sellers pay when the letter arrives.",
    now: read.kind === "escalate" && read.route === "court",
  });
  return rungs;
}

/** One paragraph under the headline: why this, in plain words. */
export function refundBody(inp: RefundInputs, read: RefundRead): string {
  const wait = read.replyBy ? actDate(read.replyBy) : "";
  switch (read.kind) {
    case "policy":
      return inp.where === "shop" || inp.where === "private"
        ? "The law gives you rights when something's wrong with what you bought, not when you've changed your mind about it in a shop or from a private seller. Many shops still take things back under their own returns policy, so check the receipt or the website, and ask while it's unused and you have the receipt."
        : `The 14 days to cancel an online order ran out on ${actDate(read.cancelBy)}. The shop's own returns policy may still be longer (many are 28 days or more, and longer at Christmas), so check it and ask.`;
    case "cancel":
      return "Online, by phone or by post, you can cancel for any reason within 14 days of delivery. Tell them in writing; then you have another 14 days to send it back, and they must refund you, including the standard delivery charge, within 14 days of getting it back or of your proof of postage. You may have to pay the return postage, and some things are excluded: made-to-order items, perishables, and sealed things like cosmetics or software once you've opened them.";
    case "private":
      return "Buying from a private person isn't covered by the Consumer Rights Act: the item has to be as they described it and theirs to sell, but there's no promise it's of satisfactory quality. So check the listing. If it said \"works perfectly\" and it doesn't, that's not as described, and you can switch the answer above. If you paid through a marketplace's checkout, its buyer protection may cover more than the law does.";
    case "old":
      return "Claims for goods and services usually have to be brought within six years in England, Wales and Northern Ireland, and five in Scotland. That's passed. A polite message asking for a goodwill gesture still costs nothing, and some sellers, and some manufacturers' warranties, will help.";
    case "ask":
      return `Send the message below, today. It asks for one thing, names the law that gives it to you, and sets a date: ${wait}. Decide now what you'll do if that date passes with no answer or a no, so that it's a step, not a fresh decision. It's on the ladder below.`;
    case "wait":
      return isISODate(inp.askedOn)
        ? `You asked on ${actDate(inp.askedOn)}, so they have until ${wait}. Don't chase sooner; put the date in your calendar. If it passes, or they say no, come back: the next step and its message are ready below.`
        : `Give them 14 days from when you asked. If you tell the tool the date you sent it, it'll give you the exact day. If that passes, or they say no, the next step is ready below.`;
    case "escalate": {
      const why = inp.stage === "refused" ? "They've said no" : inp.stage === "ignored" ? "They haven't answered" : "Their 14 days are up";
      switch (read.route) {
        case "s75":
          return `${why}, so go round them. Your card company is jointly liable for this purchase, so it has to look at the claim on its merits. Send the message below through its app or complaints page, with the receipt and your messages to the seller. If it says no or drags past eight weeks, the Financial Ombudsman will look at it, free.`;
        case "chargeback":
          return `${why}, so ask your card provider to reverse the payment. Do it soon: the window is usually about 120 days. Send the message below with the receipt and your messages to the seller.`;
        case "platform":
          return `${why}, so use the protection you paid for. Open a claim in the app you paid through, and attach your messages to the seller.`;
        case "court":
          return `${why}. You paid by ${inp.paid === "transfer" ? "bank transfer or cash" : "card, but outside the usual chargeback window"}, so there's no one to go round them. The next step is a final letter that names a date and what you'll do after it. Send it, and if the date passes, start a small claim. Many sellers settle when that letter lands.`;
      }
    }
  }
}

/** The standing rule: the reusable part. */
export function refundRule(): string {
  return "My line for things that go wrong: anything over £100 goes on a credit card. When something's faulty, late or badly done, I ask once, in writing, for one remedy by a date, and I decide before I send it what I'll do if the date passes.";
}

/** The plain-text record. */
export function refundSummary(inp: RefundInputs, read: RefundRead): string {
  const lines: string[] = [];
  const what = inp.what.trim();
  if (what) lines.push(`${capital(what)}${inp.seller.trim() ? ` (${inp.seller.trim()})` : ""}`);
  lines.push(refundHeadline(inp, read));
  lines.push("");
  lines.push(refundBody(inp, read));
  lines.push("");
  lines.push("The message to the seller:");
  lines.push(sellerMessage(inp, read));
  const card = cardMessage(inp, read);
  if (card) {
    lines.push("");
    lines.push("The message to the card company or platform:");
    lines.push(card);
  }
  if (read.kind !== "policy" && read.kind !== "cancel") {
    lines.push("");
    lines.push("The ladder:");
    read.rungs.forEach((r, i) => lines.push(`${i + 1}. ${r.head}${r.now ? " (you're here)" : ""}`));
  }
  lines.push("");
  lines.push(refundRule());
  return lines.join("\n");
}

const PROBLEMS: Problem[] = ["faulty", "described", "missing", "service", "mind"];
const WHERES: Where[] = ["online", "shop", "private"];
const PAIDS: Paid[] = ["credit", "debit", "platform", "transfer"];
const STAGES: Stage[] = ["none", "asked", "refused", "ignored"];

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
export function parseRefundInputs(raw: unknown): RefundInputs {
  if (!raw || typeof raw !== "object") return BLANK_REFUND;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what),
    seller: str(v.seller),
    problem: oneOf(v.problem, PROBLEMS),
    where: oneOf(v.where, WHERES),
    price: str(v.price, 40),
    paid: oneOf(v.paid, PAIDS),
    got: date(v.got),
    triedFix: v.triedFix === true,
    stage: oneOf(v.stage, STAGES),
    askedOn: date(v.askedOn),
  };
}

/**
 * The worked example: a £449 washing machine, bought online on a credit card,
 * that stopped draining after four months. The shop offered a repair, the
 * repair failed, and then it said the warranty was the manufacturer's problem.
 */
export const REFUND_EXAMPLE: RefundInputs = {
  what: "the washing machine",
  seller: "the shop",
  problem: "faulty",
  where: "online",
  price: "£449",
  paid: "credit",
  got: "",
  triedFix: true,
  stage: "refused",
  askedOn: "",
};

/** The example's dates, relative to today, so the windows read the same whenever it's opened. */
export function refundExample(today = todayISO()): RefundInputs {
  return { ...REFUND_EXAMPLE, got: addMonthsISO(today, -4), askedOn: addDaysISO(today, -16) };
}
