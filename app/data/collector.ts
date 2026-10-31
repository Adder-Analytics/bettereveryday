/**
 * The read behind "An Old Debt, a New Letter: Do You Still Owe It?" (/collector).
 *
 * A letter arrives from a company you've never heard of, about a credit card,
 * a phone contract or a catalogue account from years ago. It asks for the
 * whole balance, or "a token payment of £1 a month to show goodwill". Most
 * people do one of two things: pay something to make it stop, or bin it. The
 * first can hand the collector a claim it had lost; the second can end in a
 * court judgment on a debt that was too old to sue for.
 *
 *   - England, Wales and Northern Ireland (Limitation Act 1980, section 5;
 *     Limitation (Northern Ireland) Order 1989): a creditor has six years to
 *     take you to court for an ordinary debt, counted from when it could first
 *     sue (for a credit agreement, usually the default; in practice advisers
 *     count from the last payment or written acknowledgement). After that the
 *     debt is "statute-barred": it still exists, but no court will order you
 *     to pay it. A payment, or a written and signed acknowledgement, made
 *     before the six years run out starts the clock again. Once it's barred, a
 *     later payment doesn't revive the claim (section 29(7)), but the money is
 *     gone.
 *   - Scotland (Prescription and Limitation (Scotland) Act 1973, section 6):
 *     five years, and then the debt is extinguished. It no longer exists.
 *   - The FCA's debt collection rules (CONC 7.15) say a firm mustn't threaten
 *     court on a debt it knows is barred, and must stop asking for payment
 *     once you've said you won't pay because it's barred.
 *   - The exceptions: a court judgment (a CCJ, or for council tax a liability
 *     order or summary warrant) isn't barred by the six years, though one over
 *     six years old needs the court's permission to enforce. Most tax owed to
 *     HMRC and student loans from the Student Loans Company aren't limited
 *     this way. Benefit overpayments can still be taken from benefits you
 *     receive. A mortgage shortfall has six years for the interest and twelve
 *     for the capital (England, Wales and Northern Ireland).
 *   - Court papers: a limit is a defence, not something the court applies on
 *     its own. A claim form that's ignored becomes a judgment, barred or not.
 *     In England and Wales a claim form sent by post is served on the second
 *     business day after posting, and you have 14 days from then to respond,
 *     or 28 to file a defence if you acknowledge it first. A "letter of claim"
 *     under the Pre-Action Protocol for Debt Claims gives you 30 days to reply.
 *
 * The read is one date plus a margin. The clock usually starts a little after
 * the last payment (at the default), so a debt within three months either
 * side of the line is read as "close": ask for the dates before relying on it.
 *
 * Statuses:
 *   barred:    past the limit with margin, no court judgment.
 *   close:     within three months of the limit either way.
 *   live:      still inside the limit.
 *   partial:   a mortgage shortfall past six years but not twelve.
 *   unknown:   you don't know when you last paid.
 *   unclear:   a Scottish mortgage shortfall, where I couldn't pin the period.
 *   judgment:  there's a court judgment; the limit doesn't help.
 *   exempt:    HMRC tax or a student loan; the limit doesn't apply.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type DebtRegion = "" | "ew" | "scot" | "ni";
export type DebtKind = "" | "credit" | "bill" | "private" | "council" | "mortgage" | "benefit" | "tax" | "student";
export type Recognise = "" | "yes" | "no" | "unsure";
export type PaidKind = "" | "paid" | "never" | "unknown";
export type Court = "" | "none" | "letter" | "claim" | "judgment" | "unsure";

export type CollectorInputs = {
  /** The debt, in a few words: "the old store card". */
  what: string;
  /** Who's writing: the collector or the company that bought the debt. */
  who: string;
  /** What they're asking for. Optional. */
  amount: string;
  region: DebtRegion;
  kind: DebtKind;
  recognise: Recognise;
  paid: PaidKind;
  /** ISO date of the last payment, or when it first went unpaid if never paid. */
  since: string;
  /** ISO date of the last time you wrote or signed anything admitting it. Optional. */
  wrote: string;
  court: Court;
  /** ISO date on the letter of claim, or the issue date on the claim form. */
  courtOn: string;
};

export const BLANK_COLLECTOR: CollectorInputs = {
  what: "",
  who: "",
  amount: "",
  region: "",
  kind: "",
  recognise: "",
  paid: "",
  since: "",
  wrote: "",
  court: "",
  courtOn: "",
};

/** Six years in England, Wales and Northern Ireland; five in Scotland. */
export function limitYears(r: DebtRegion): number {
  return r === "scot" ? 5 : 6;
}
/** A mortgage shortfall's capital (England, Wales, Northern Ireland). */
export const MORTGAGE_CAPITAL_YEARS = 12;
/** Days either side of the line read as "close". */
export const MARGIN_DAYS = 92;
/** The Pre-Action Protocol for Debt Claims: 30 days to reply to a letter of claim. */
export const LETTER_OF_CLAIM_DAYS = 30;
/** Days to respond to a claim form after it's served (England and Wales). */
export const RESPOND_DAYS = 14;
/** Days to file a defence after service if you acknowledge first. */
export const DEFENCE_DAYS = 28;

export type DebtStatus = "barred" | "close" | "live" | "partial" | "unknown" | "unclear" | "judgment" | "exempt";
export type DebtStage = "none" | "letter" | "claim";

export type CollectorRead = {
  status: DebtStatus;
  stage: DebtStage;
  /** The date the clock runs from: the later of the last payment and the last written admission. "" when unknown. */
  start: string;
  /** The date the limit runs out (the capital's, for a mortgage shortfall). "" when it doesn't apply. */
  barredOn: string;
  /** For a mortgage shortfall: when the interest's six years run out. */
  interestBarredOn: string;
  /** True when the last thing that restarted the clock was something you wrote. */
  restartedByWriting: boolean;
  /** England and Wales claim form: the deemed date of service. */
  servedOn: string;
  /** The day to reply or respond by. "" when it can't be worked out here. */
  replyBy: string;
  /** England and Wales claim form: the defence date if you acknowledge first. */
  defenceBy: string;
  amount: number | null;
};

const CUR = "£";

function money(n: number): string {
  return formatMoney(n, CUR);
}

export function amountOf(inp: CollectorInputs): number | null {
  const n = parseMoney(inp.amount);
  return n !== null && n > 0 ? n : null;
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** Add business days, skipping weekends. Bank holidays aren't counted out. */
export function addBusinessDays(iso: string, n: number): string {
  let d = iso;
  let left = n;
  let guard = 0;
  while (left > 0 && guard < 60) {
    d = addDaysISO(d, 1);
    const day = new Date(`${d}T00:00:00`).getDay();
    if (day !== 0 && day !== 6) left -= 1;
    guard += 1;
  }
  return d;
}

function needsCourtDate(c: Court): boolean {
  return c === "letter" || c === "claim";
}

function needsDates(kind: DebtKind): boolean {
  return kind !== "tax" && kind !== "student";
}

export function collectorReady(inp: CollectorInputs): boolean {
  if (!inp.region || !inp.kind || !inp.recognise || !inp.court) return false;
  if (inp.wrote && !isISODate(inp.wrote)) return false;
  if (needsCourtDate(inp.court) && !isISODate(inp.courtOn)) return false;
  if (inp.court === "judgment" || !needsDates(inp.kind)) return true;
  if (!inp.paid) return false;
  if (inp.paid !== "unknown" && !isISODate(inp.since)) return false;
  return true;
}

/** The date the clock runs from, or "" when the last payment isn't known. */
export function clockStart(inp: CollectorInputs): string {
  if (inp.paid === "unknown" || !isISODate(inp.since)) return "";
  return isISODate(inp.wrote) && inp.wrote > inp.since ? inp.wrote : inp.since;
}

export function readCollector(inp: CollectorInputs, today = todayISO()): CollectorRead | null {
  if (!collectorReady(inp)) return null;
  const start = clockStart(inp);
  const years = limitYears(inp.region);
  const stage: DebtStage = inp.court === "claim" ? "claim" : inp.court === "letter" ? "letter" : "none";

  let barredOn = "";
  let interestBarredOn = "";
  let status: DebtStatus;
  if (inp.court === "judgment") status = "judgment";
  else if (!needsDates(inp.kind)) status = "exempt";
  else if (!start) status = "unknown";
  else if (inp.kind === "mortgage" && inp.region === "scot") status = "unclear";
  else if (inp.kind === "mortgage") {
    interestBarredOn = addMonthsISO(start, years * 12);
    barredOn = addMonthsISO(start, MORTGAGE_CAPITAL_YEARS * 12);
    const past = daysBetween(barredOn, today);
    if (past >= MARGIN_DAYS) status = "barred";
    else if (past > -MARGIN_DAYS) status = "close";
    else if (daysBetween(interestBarredOn, today) >= MARGIN_DAYS) status = "partial";
    else status = "live";
  } else {
    barredOn = addMonthsISO(start, years * 12);
    const past = daysBetween(barredOn, today);
    if (past >= MARGIN_DAYS) status = "barred";
    else if (past > -MARGIN_DAYS) status = "close";
    else status = "live";
  }

  let servedOn = "";
  let replyBy = "";
  let defenceBy = "";
  if (stage === "letter" && inp.region === "ew") {
    replyBy = addDaysISO(inp.courtOn, LETTER_OF_CLAIM_DAYS);
  } else if (stage === "claim" && inp.region === "ew") {
    servedOn = addBusinessDays(inp.courtOn, 2);
    replyBy = addDaysISO(servedOn, RESPOND_DAYS);
    defenceBy = addDaysISO(servedOn, DEFENCE_DAYS);
  }

  return {
    status,
    stage,
    start,
    barredOn,
    interestBarredOn,
    restartedByWriting: Boolean(start) && start === inp.wrote && inp.wrote !== inp.since,
    servedOn,
    replyBy,
    defenceBy,
    amount: amountOf(inp),
  };
}

function whoName(inp: CollectorInputs): string {
  return inp.who.trim() || "the collector";
}

function capital(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function greeting(inp: CollectorInputs): string {
  const who = inp.who.trim();
  return who && !/^the /i.test(who) ? `Dear ${who},` : "Dear Sir or Madam,";
}

function lawName(inp: CollectorInputs): string {
  if (inp.region === "scot") return "section 6 of the Prescription and Limitation (Scotland) Act 1973";
  if (inp.region === "ni") return "the Limitation (Northern Ireland) Order 1989";
  return "section 5 of the Limitation Act 1980";
}

function yearsWord(inp: CollectorInputs): string {
  if (inp.kind === "mortgage" && inp.region !== "scot") return "twelve";
  return inp.region === "scot" ? "five" : "six";
}

function isCredit(inp: CollectorInputs): boolean {
  return inp.kind === "credit";
}

function opening(inp: CollectorInputs, read: CollectorRead): string {
  const what = inp.what.trim();
  return `Your reference: [reference]${what ? `, about ${what}` : ""}. I've received your letter dated [date]${read.amount !== null ? ` asking me to pay ${money(read.amount)}` : ""}.`;
}

/** The letter for a debt that looks past the limit. */
export function barredLetter(inp: CollectorInputs, read: CollectorRead): string {
  const lines: string[] = [greeting(inp), "", opening(inp, read), ""];
  if (inp.region === "scot") {
    lines.push(
      `I don't acknowledge that I owe this debt. No payment has been made and I haven't acknowledged it in writing for more than five years, and no court action has been raised. Under ${lawName(inp)}, the obligation has been extinguished: the debt no longer exists.`,
      "",
      "Please close the account, stop contacting me about it, and confirm in writing that you've done so. Under the FCA's rules on statute-barred debt (CONC 7.15), you shouldn't be asking me to pay a debt that has prescribed.",
    );
  } else {
    lines.push(
      `I don't acknowledge that I owe this debt. I haven't made a payment or acknowledged it in writing for more than ${yearsWord(inp)} years, and no court judgment has been obtained. Any claim is therefore statute-barred under ${lawName(inp)}.`,
      "",
      "I won't be making any payment. Under the FCA's rules on statute-barred debt (CONC 7.15), please stop asking me to pay, and don't contact me about it by phone or at my home. Please confirm in writing that you've closed the account.",
    );
  }
  lines.push(
    "",
    "If you believe this is wrong, send me the date of the last payment, the date of the default notice, and the evidence for both.",
    "",
  );
  if (read.stage === "letter")
    lines.push("This is my reply to your letter of claim. As the claim is statute-barred, I'd defend any court action on that basis.", "");
  lines.push("Yours faithfully,", "[Your name]", "[Your address]");
  return lines.join("\n");
}

/** The letter that asks them to prove the debt, without admitting it. */
export function proveLetter(inp: CollectorInputs, read: CollectorRead): string {
  const lines: string[] = [greeting(inp), "", opening(inp, read), ""];
  lines.push(
    inp.recognise === "no"
      ? "I don't recognise this debt. Nothing in this letter is an acknowledgement that I owe it."
      : "Before I deal with this, I need to check the details. Nothing in this letter is an acknowledgement that I owe this debt.",
    "",
    "Please send me:",
    "- who owns the debt now, and a copy of the notice of assignment if it was sold to you;",
    "- a statement of account showing every payment, with the date of the last one;",
    "- the date of the default notice, or when the account was closed;",
    "- whether any court action has been taken, and if so the claim number;",
  );
  if (isCredit(inp))
    lines.push(
      "- a copy of the signed credit agreement and the current statement, under section 77 or 78 of the Consumer Credit Act 1974. I enclose a £1 postal order for the fee.",
    );
  if (inp.recognise === "no") lines.push("- what checks you've made that the person who owed this is me.");
  lines.push(
    "",
    "While you do this, please put the account on hold. The FCA's debt collection rules (CONC 7) say a firm should suspend recovery while a debt is disputed. Please reply in writing; I'd rather not be called.",
    "",
  );
  if (read.stage === "letter")
    lines.push(
      "This is my reply to your letter of claim. Under the Pre-Action Protocol for Debt Claims, please don't start court action until you've sent these documents and I've had 30 days to consider them.",
      "",
    );
  lines.push("Yours faithfully,", "[Your name]", "[Your address]");
  return lines.join("\n");
}

/** The offer for a debt that's owed and within the limit. */
export function offerLetter(inp: CollectorInputs, read: CollectorRead): string {
  const lines: string[] = [greeting(inp), "", opening(inp, read), ""];
  lines.push(
    "I can't pay this in one go. My budget is attached: after essential bills, I can afford £[amount] a month, starting [date].",
    "",
    "Please accept this, freeze interest and charges while I pay, and confirm in writing. If I'm getting free debt advice, I'll let you know, and I ask you to hold collection for 30 days while I do.",
    "",
  );
  if (read.stage === "letter")
    lines.push("This is my reply to your letter of claim. Please don't start court action while I'm paying what I can afford.", "");
  if (read.status === "judgment")
    lines.push("If this is about a court judgment, please send me the claim number and the date of the judgment.", "");
  lines.push("Yours faithfully,", "[Your name]", "[Your address]");
  return lines.join("\n");
}

/** What to write in the defence box when the claim looks barred. */
export function defenceText(inp: CollectorInputs, read: CollectorRead): string {
  const law = inp.region === "ni" ? lawName(inp) : "section 5 of the Limitation Act 1980";
  return [
    `The claim is statute-barred. The cause of action accrued more than ${yearsWord(inp)} years before the claim was issued. I made no payment after ${read.start ? letterDate(read.start) : "[date of last payment]"}, and I haven't acknowledged the debt in writing since. I rely on ${law}.`,
    "",
    "I don't admit the debt. I ask the claimant to prove the date of the default notice and of the last payment, and that it owns the debt.",
  ].join("\n");
}

export function mainLetter(inp: CollectorInputs, read: CollectorRead): { title: string; note: string; text: string } | null {
  if (read.stage === "claim") {
    if (read.status === "barred" && inp.region !== "scot")
      return {
        title: "What to put in the defence",
        note: "Respond on the form or online (Money Claim Online, with the password on the claim pack). Tick that you dispute the whole claim, and use this as the defence. Get a free adviser to look over it if you can.",
        text: defenceText(inp, read),
      };
    return null;
  }
  const note =
    read.stage === "letter"
      ? "Use the reply form that came with the letter of claim, and send this with it. Keep a copy and get proof of posting."
      : "Send it by post or email and keep a copy. Fill in the square brackets. Don't add anything that says the debt is yours.";
  if (inp.recognise === "no")
    return { title: "Ask them to prove it", note, text: proveLetter(inp, read) };
  switch (read.status) {
    case "barred":
      return { title: inp.region === "scot" ? "The letter to send: it's prescribed" : "The letter to send: it's statute-barred", note, text: barredLetter(inp, read) };
    case "close":
    case "unknown":
    case "unclear":
    case "partial":
      return { title: "Ask for the dates first", note, text: proveLetter(inp, read) };
    case "live":
      return inp.recognise === "unsure"
        ? { title: "Ask for the details first", note, text: proveLetter(inp, read) }
        : { title: "An offer you can keep to", note: `${note} Work out the amount from a budget first; a free adviser will help you do one.`, text: offerLetter(inp, read) };
    case "judgment":
      return { title: "An offer you can keep to", note, text: offerLetter(inp, read) };
    default:
      return null;
  }
}

export function collectorHeadline(inp: CollectorInputs, read: CollectorRead): string {
  const years = yearsWord(inp);
  if (read.stage === "claim") {
    if (read.replyBy)
      return read.status === "barred"
        ? `Respond to the court by ${actDate(read.replyBy)}. Old or not, a claim you ignore becomes a judgment.`
        : `Respond to the court by ${actDate(read.replyBy)}, and get free debt advice today.`;
    return "Respond to the court by the date on the form. Never ignore a claim, however old the debt.";
  }
  if (inp.recognise === "no" && read.status !== "judgment" && read.status !== "exempt")
    return "Don't pay a debt you don't recognise. Ask them to prove it.";
  const by = read.stage === "letter" && read.replyBy ? ` Reply by ${actDate(read.replyBy)}.` : read.stage === "letter" ? " Reply to the letter of claim now." : "";
  switch (read.status) {
    case "barred":
      return inp.region === "scot"
        ? `After five years, a Scottish debt no longer exists. Don't pay; send the letter.${by}`
        : `This looks too old to take you to court for. Don't pay; send the letter.${by}`;
    case "close":
      return `It's within a few months of the ${years}-year line. Don't pay or sign anything yet: ask for the dates.${by}`;
    case "unknown":
      return `Find the dates before anything else. Don't pay or sign until you have them.${by}`;
    case "unclear":
      return `Get advice before you reply: the time limit for a Scottish mortgage shortfall is disputed.${by}`;
    case "partial":
      return `The interest is too old to claim, but the capital isn't until ${letterDate(read.barredOn)}.${by}`;
    case "live":
      return `It can still go to court until ${letterDate(read.barredOn)}. Deal with it, on terms you can keep to.${by}`;
    case "judgment":
      return "A court judgment isn't affected by the time limit. Make an offer you can keep to.";
    default:
      return inp.kind === "tax"
        ? "Tax owed to HMRC isn't limited this way. Call them and ask for time to pay."
        : "A student loan isn't limited this way, and you only repay it when you earn enough.";
  }
}

/** "Your last payment was 3 May 2019", or the written admission, or when it first went unpaid. */
function startPhrase(inp: CollectorInputs, read: CollectorRead): string {
  if (read.restartedByWriting) return `You last admitted it in writing on ${letterDate(read.start)}`;
  if (inp.paid === "never") return `It first went unpaid on ${letterDate(read.start)}`;
  return `Your last payment was ${letterDate(read.start)}`;
}

export function collectorBody(inp: CollectorInputs, read: CollectorRead): string {
  const who = whoName(inp);
  const restart = read.restartedByWriting
    ? " The clock runs from that, not from your last payment."
    : "";
  const parts: string[] = [];

  if (read.stage === "claim") {
    if (inp.region !== "ew")
      parts.push(
        inp.region === "scot"
          ? "In Scotland a claim comes as a simple procedure form with a last date for a response printed on it. Respond by then, and if the debt is over five years old, say it has prescribed."
          : "In Northern Ireland the court papers give the date to respond by. Respond by then, and if the debt is over six years old, say it's statute-barred.",
      );
    else
      parts.push(
        `A claim form sent by post is served on the second business day after it was posted, usually ${letterDate(read.servedOn)} for a form issued ${letterDate(inp.courtOn)}. You have 14 days from then to respond: ${actDate(read.replyBy)}. If you file an acknowledgment of service first, the defence is due by ${actDate(read.defenceBy)}. Bank holidays aren't counted here, so treat the earlier date as the deadline.`,
      );
    parts.push(
      read.status === "barred"
        ? `The time limit is a defence you have to raise. The court won't apply it on its own, so a claim you ignore becomes a judgment that the six years can't undo. On your dates, the claim looks statute-barred: say so in the defence.`
        : read.status === "close" || read.status === "unknown"
          ? "The dates are too close, or too uncertain, to rely on the time limit without help. Call National Debtline, StepChange or Citizens Advice today: they'll help you respond, and ask the claimant for the documents."
          : "If you owe it, you can admit it and offer what you can afford on the response form, and the court sets the instalments. Free debt advice can help you fill it in.",
    );
    return parts.join(" ");
  }

  if (inp.recognise === "no" && read.status !== "judgment" && read.status !== "exempt") {
    parts.push(
      `${capital(who)} has to show the debt is yours and that it owns it. Debts are bought and sold in bulk, often with thin records, and identity fraud happens. Send the letter below, check your credit file (free through any of the three agencies) for an account you don't know, and don't pay or agree to anything on the phone. If the letter itself looks wrong, check it with "is it real?" first.`,
    );
    if (read.status === "barred") parts.push(`On the dates you gave it would be past the ${yearsWord(inp)}-year limit anyway.`);
    return parts.join(" ");
  }

  switch (read.status) {
    case "barred":
      parts.push(
        inp.region === "scot"
          ? `${startPhrase(inp, read)}, more than five years ago. In Scotland, once five years pass without a payment, a written admission or a court action, the debt is extinguished: it isn't just unenforceable, it's gone.${restart}`
          : `${startPhrase(inp, read)}, so the ${yearsWord(inp)} years ran out around ${letterDate(read.barredOn)}. The debt still exists, but no court will order you to pay it, so ${who} can only ask.${restart}`,
        "Paying anything now won't revive the claim, but you'd never get the money back, so don't pay unless you want to. Send the letter: once you've said you won't pay because it's barred, the FCA's rules say they must stop asking.",
      );
      if (inp.court === "unsure")
        parts.push(
          "You weren't sure whether there's been a court case. A judgment would change everything, so check: a search of the Register of Judgments costs a few pounds, and the letter asks them too.",
        );
      if (inp.kind === "council")
        parts.push(
          "For council tax, the limit is for getting a liability order (a summary warrant in Scotland). If you were ever summonsed to the magistrates' court over it, there may already be one, and then there's no limit.",
        );
      if (inp.kind === "benefit")
        parts.push(
          "For a benefit overpayment, the limit stops court action, but the DWP can still take it in deductions from benefits you receive now or later.",
        );
      if (inp.kind === "mortgage")
        parts.push("For a mortgage shortfall, that's the twelve years for the capital; the interest went after six.");
      parts.push("A default drops off your credit file six years after it was registered, whatever happens to the debt.");
      return parts.join(" ");
    case "close":
      return `${startPhrase(inp, read)}, so the ${yearsWord(inp)} years run out around ${letterDate(read.barredOn)}, within a few months of today.${restart} The clock often starts at the default, which can be a month or more after the last payment, so the real line may be later than this. Don't pay anything or sign anything that admits the debt: a payment before the line starts it again. Ask ${who} for the dates in writing. It's a fair request, and their answer settles it.`;
    case "unknown":
      return `Everything turns on one date: your last payment (or the last time you admitted the debt in writing). Check old bank statements, and your credit file, which shows defaults from the last six years. If the debt isn't on it at all, the default is probably more than six years old. Ask ${who} for a statement in writing, and don't pay or sign anything until you know.`;
    case "unclear":
      return "In England, Wales and Northern Ireland a mortgage shortfall has six years for the interest and twelve for the capital. In Scotland the period is argued over, so get free advice (Citizens Advice Scotland or National Debtline) before you reply, and meanwhile ask for the dates without admitting anything.";
    case "partial":
      return `${startPhrase(inp, read)}. For a mortgage shortfall the interest can only be claimed for six years (that ran out around ${letterDate(read.interestBarredOn)}), but the capital can be claimed for twelve, until about ${letterDate(read.barredOn)}. Ask the lender for a breakdown of capital and interest, and get free advice before offering anything. Lenders agreed long ago to tell borrowers within six years of the sale if they meant to pursue a shortfall; if you heard nothing in that time, tell the adviser.`;
    case "live":
      parts.push(
        `${startPhrase(inp, read)}, so ${who} can take it to court until about ${letterDate(read.barredOn)}.${restart} If it's yours, waiting it out isn't a plan: a court claim before then ends in a judgment, with costs added.`,
        "What you can do is set the terms. Do a budget, offer what you can actually keep to, and ask them to freeze interest. If it's more than you can manage, free debt advice (StepChange, National Debtline, Citizens Advice) can set up a plan for you.",
      );
      if (inp.region === "ew")
        parts.push("In England and Wales an adviser can also apply for Breathing Space: 60 days with interest, charges and collection paused.");
      if (inp.recognise === "unsure") parts.push("You weren't sure it's yours, so ask for the details before you offer anything.");
      return parts.join(" ");
    case "judgment":
      return `A judgment doesn't run out like an ordinary debt. In England and Wales one over six years old needs the court's permission to send bailiffs, but it's still owed. Check it's yours: if it was entered when you'd moved and never saw the papers, you can apply to have it set aside, and the sooner the better. If it's yours, offer what you can afford; if you can't keep up the payments the court set, you can ask it to change them. A CCJ comes off your credit file six years after the judgment date.`;
    default:
      return inp.kind === "tax"
        ? "HMRC can collect most tax debts however old they are, and it has its own powers that don't need a court first. Ring the number on the letter and ask for a Time to Pay arrangement before it acts; if the letter claims to be HMRC and asks you to pay a new account, check it's real first."
        : "Loans from the Student Loans Company are repaid through your pay once you earn over the threshold, and written off after a set term. The time limit doesn't apply. If the letter is about arrears on an old loan or from a collector, check it's real, then ask the Student Loans Company directly.";
  }
}

/** What to keep or gather. */
export function evidenceLines(inp: CollectorInputs, read: CollectorRead): string[] {
  const out: string[] = ["Every letter about the debt, with its envelope if you have it: the postmark can matter."];
  if (read.status !== "judgment" && read.status !== "exempt")
    out.push("Bank statements around your last payment, or anything showing when it stopped.");
  out.push("A copy of what you send, and proof of posting or the email.");
  out.push("A note of every call: the date, who, what was said. Better still, ask them to write instead.");
  if (read.stage === "claim") out.push("The claim form, with the date you received it.");
  return out;
}

export function collectorRule(): string {
  return "When a letter comes about an old debt, I don't pay, sign or agree to anything until I know two dates: my last payment, and the last time I admitted it in writing. Not even £1 as goodwill. And I never ignore court papers.";
}

/** One all-day reminder for a reply deadline. */
export function reminderOf(read: CollectorRead, today: string): { on: string; title: string; body: string } | null {
  if (!read.replyBy || read.replyBy < today) return null;
  return read.stage === "claim"
    ? { on: read.replyBy, title: "Respond to the court claim", body: "Last day to respond to the claim form. Do it before today if you can." }
    : { on: read.replyBy, title: "Reply to the letter of claim", body: "Last day of the 30 days to reply to the letter of claim." };
}

export function collectorSummary(inp: CollectorInputs, read: CollectorRead): string {
  const lines: string[] = [];
  lines.push(`An old debt${inp.what.trim() ? `: ${inp.what.trim()}` : ""}${inp.who.trim() ? ` (${inp.who.trim()})` : ""}`);
  lines.push("", collectorHeadline(inp, read), "", collectorBody(inp, read));
  if (read.barredOn) lines.push("", `The limit runs out: ${letterDate(read.barredOn)}.`);
  if (read.replyBy) lines.push(`Reply by: ${letterDate(read.replyBy)}.`);
  const msg = mainLetter(inp, read);
  if (msg) lines.push("", `${msg.title}:`, "", msg.text);
  lines.push("", collectorRule());
  return lines.join("\n");
}

const REGIONS: DebtRegion[] = ["ew", "scot", "ni"];
const KINDS: DebtKind[] = ["credit", "bill", "private", "council", "mortgage", "benefit", "tax", "student"];
const RECOGNISES: Recognise[] = ["yes", "no", "unsure"];
const PAIDS: PaidKind[] = ["paid", "never", "unknown"];
const COURTS: Court[] = ["none", "letter", "claim", "judgment", "unsure"];

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
export function parseCollectorInputs(raw: unknown): CollectorInputs {
  if (!raw || typeof raw !== "object") return BLANK_COLLECTOR;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what),
    who: str(v.who),
    amount: str(v.amount, 40),
    region: oneOf(v.region, REGIONS),
    kind: oneOf(v.kind, KINDS),
    recognise: oneOf(v.recognise, RECOGNISES),
    paid: oneOf(v.paid, PAIDS),
    since: date(v.since),
    wrote: date(v.wrote),
    court: oneOf(v.court, COURTS),
    courtOn: date(v.courtOn),
  };
}

/**
 * The worked example: a store card from years ago, a last payment seven years
 * and four months back, and a letter from a company that bought the debt
 * asking for the balance or "£1 a month to show goodwill".
 */
export function collectorExample(today = todayISO()): CollectorInputs {
  return {
    what: "the old store card",
    who: "",
    amount: "£1,260",
    region: "ew",
    kind: "credit",
    recognise: "yes",
    paid: "paid",
    since: addMonthsISO(today, -88),
    wrote: "",
    court: "none",
    courtOn: "",
  };
}
