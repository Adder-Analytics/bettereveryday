/**
 * The read behind "Power of Attorney: Is It Too Late, and What Does Waiting
 * Cost?" (/lpa).
 *
 * A Lasting Power of Attorney (LPA) lets someone you choose deal with your
 * money, or make health and care decisions, if you can't. It has to be made
 * while you can still understand what you're signing. If that line passes
 * first, nobody (not a husband or wife, not "next of kin") can sign for you
 * on accounts in your sole name or sell your share of a home. The route left
 * is a Court of Protection deputyship, which costs several times as much,
 * takes months, and comes with yearly supervision.
 *
 * Families tend to notice the change at a holiday, then wait for a crisis.
 * The commonest wrong belief is that a dementia diagnosis means it's already
 * too late. It doesn't: capacity is judged decision by decision, on the day.
 * So the useful advice is "do it on a good day, soon", and the useful number
 * is what waiting would cost.
 *
 * Figures (England and Wales), as far as the sources I could reach agree
 * (gov.uk and legislation.gov.uk were DNS-blocked from the sandbox; see
 * docs/2026-11-22-session-notes.md):
 *
 *   - LPA registration fee £92 per LPA since 17 November 2025 (was £82).
 *     Half (£46) if the donor's gross income is £12,000 or less; some
 *     means-tested benefits can mean no fee (form LPA120, sent with the
 *     application). Since 2 February 2026 Universal Credit alone no longer
 *     brings a reduction. A repeat application after an invalid one is £46
 *     if sent within three months of it coming back.
 *   - Registration: the OPG's quoted times range from about 8 to 20 weeks,
 *     including a statutory waiting period after notice for objections. The
 *     tool shows a range, not a date.
 *   - Deputyship: Court of Protection application £421 (one 2026 source said
 *     £432), £259 more if there's a hearing; OPG assessment fee £100; yearly
 *     supervision £320 (general) or £35 (minimal); a security bond with a
 *     yearly premium. Most estimates for an uncontested order are 6 to 10
 *     months after a few weeks preparing the forms; some longer.
 *   - From memory, widely stated, not verified on gov.uk: an LPA signed
 *     correctly while the donor had capacity can still be registered after
 *     they lose it; attorneys can only make small customary gifts; a health
 *     and welfare LPA is only used when the donor can't decide; the Use a
 *     Lasting Power of Attorney service gives access codes for LPAs
 *     registered from 1 September 2019; a search of the OPG register uses
 *     form OPG100; Enduring Powers of Attorney (made before 1 October 2007)
 *     still work for money and must be registered when the donor is becoming
 *     unable; DWP appointees can manage benefits only.
 *
 * Not advice. Pure data and functions, no React.
 */

import { formatMoney } from "./worth";
import { addDaysISO, isISODate, letterDate, todayISO } from "./refund";

export { isISODate, letterDate, todayISO };

export type YesNo = "" | "yes" | "no";
export type Who = "" | "self" | "other";
export type Where = "" | "ew" | "scotland" | "ni";
export type State = "" | "well" | "early" | "fluctuates" | "lost" | "unsure";
export type Existing = "" | "none" | "signed" | "registered" | "epa" | "unsure";
export type Which = "" | "both" | "finance" | "health";
export type People = "" | "1" | "2";
export type FeeBand = "" | "full" | "low" | "benefits";
export type Pressing = "bank" | "care" | "house" | "health" | "benefits";

export type LpaInputs = {
  who: Who;
  where: Where;
  state: State;
  existing: Existing;
  /** Which LPAs to make, or (if registered) which ones they have. */
  which: Which;
  /** Making them for one person or two (a couple). */
  people: People;
  fee: FeeBand;
  pressing: Pressing[];
  /** Owns a home jointly with someone else. */
  jointHome: YesNo;
  /** A date someone has to be able to act by (a sale, a care move). */
  needBy: string;
  /** What you call them, for the messages: "Mum", "Dad", "Pat". */
  name: string;
};

export const BLANK_LPA: LpaInputs = {
  who: "",
  where: "",
  state: "",
  existing: "",
  which: "",
  people: "",
  fee: "",
  pressing: [],
  jointHome: "",
  needBy: "",
  name: "",
};

export const LPA_FEE = 92;
export const LPA_HALF = 46;
export const COP_APPLICATION = 421;
export const COP_HEARING = 259;
export const OPG_ASSESSMENT = 100;
export const SUPERVISION = 320;
export const SUPERVISION_MINIMAL = 35;
/** Days to choose the people, fill it in and sign. */
export const SIGN_DAYS = 14;
/** Days from signing to it reaching the OPG. */
export const SEND_DAYS = 7;
export const REG_WEEKS_FAST = 8;
export const REG_WEEKS_SLOW = 20;
/** Days to prepare a deputyship application, then months for the order. */
export const DEPUTY_PREP_DAYS = 28;
export const DEPUTY_MONTHS_FAST = 6;
export const DEPUTY_MONTHS_SLOW = 10;

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

function addMonthsISO(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  d.setMonth(d.getMonth() + months);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "March 2027", for ranges where a day would be false precision. */
export function monthYear(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function monthRange(a: string, b: string): string {
  const x = monthYear(a);
  const y = monthYear(b);
  if (x === y) return x;
  const [xm, xy] = x.split(" ");
  const [ym, yy] = y.split(" ");
  return xy === yy ? `${xm} to ${ym} ${yy}` : `${x} to ${y}`;
}

export type Verdict =
  | "make"
  | "now"
  | "late"
  | "register"
  | "registered"
  | "epa-register"
  | "epa-ok"
  | "elsewhere";

export type Timing = "ok" | "tight" | "late";

export type LpaRead = {
  verdict: Verdict;
  who: Exclude<Who, "">;
  where: Exclude<Where, "">;
  state: State;
  existing: Existing;
  which: Which;
  /** How many LPAs to register. */
  count: number;
  fee: FeeBand;
  perFee: number;
  feeTotal: number;
  /** Fees a deputyship would cost in the first year, and each year after. */
  deputyFirst: number;
  deputyYearly: number;
  pressing: Pressing[];
  jointHome: boolean;
  needBy: string;
  timing: Timing | null;
  /** Dates: sign, send, earliest and latest it's usable. */
  signBy: string;
  sendBy: string;
  readyFrom: string;
  readyTo: string;
  /** Deputyship: apply by, and earliest and latest order. */
  applyBy: string;
  orderFrom: string;
  orderTo: string;
  /** Their name for the messages, or a stand-in. */
  them: string;
  today: string;
};

export function lpaReady(inp: LpaInputs): boolean {
  if (!inp.who || !inp.where) return false;
  if (inp.where !== "ew") return true;
  if (!inp.existing) return false;
  if (inp.who === "other" && !inp.state) return false;
  return true;
}

function feeEach(band: FeeBand): number {
  if (band === "benefits") return 0;
  if (band === "low") return LPA_HALF;
  return LPA_FEE;
}

export function readLpa(inp: LpaInputs, today = todayISO()): LpaRead | null {
  if (!lpaReady(inp)) return null;
  const who = inp.who as Exclude<Who, "">;
  const where = inp.where as Exclude<Where, "">;
  const state: State = who === "self" && !inp.state ? "well" : inp.state;
  const existing = inp.existing;

  let verdict: Verdict;
  if (where !== "ew") verdict = "elsewhere";
  else if (existing === "registered") verdict = "registered";
  else if (existing === "signed") verdict = "register";
  else if (existing === "epa") verdict = state === "well" ? "epa-ok" : "epa-register";
  else if (state === "lost") verdict = "late";
  else if (state === "well") verdict = "make";
  else verdict = "now";

  const types = inp.which === "finance" || inp.which === "health" ? 1 : 2;
  const people = inp.people === "2" ? 2 : 1;
  // An old EPA covers money; the gap is a health and welfare LPA.
  let count = types * people;
  if (verdict === "epa-ok") count = people;
  if (verdict === "epa-register") count = people;
  if (verdict === "register") count = types;
  if (verdict === "registered" || verdict === "late" || verdict === "elsewhere") count = 0;
  const perFee = feeEach(inp.fee);
  const feeTotal = perFee * count;

  const deputyFirst = COP_APPLICATION + OPG_ASSESSMENT + SUPERVISION;
  const deputyYearly = SUPERVISION;

  const signBy = verdict === "register" || verdict === "epa-register" ? today : addDaysISO(today, SIGN_DAYS);
  const sendBy = verdict === "register" || verdict === "epa-register" ? addDaysISO(today, 3) : addDaysISO(signBy, SEND_DAYS);
  const readyFrom = addDaysISO(sendBy, REG_WEEKS_FAST * 7);
  const readyTo = addDaysISO(sendBy, REG_WEEKS_SLOW * 7);
  const applyBy = addDaysISO(today, DEPUTY_PREP_DAYS);
  const orderFrom = addMonthsISO(applyBy, DEPUTY_MONTHS_FAST);
  const orderTo = addMonthsISO(applyBy, DEPUTY_MONTHS_SLOW);

  const needBy = isISODate(inp.needBy) && inp.needBy >= today ? inp.needBy : "";
  let timing: Timing | null = null;
  if (needBy && verdict !== "registered" && verdict !== "elsewhere" && verdict !== "epa-ok") {
    const [from, to] = verdict === "late" ? [orderFrom, orderTo] : [readyFrom, readyTo];
    timing = needBy < from ? "late" : needBy < to ? "tight" : "ok";
  }

  const name = inp.name.trim().slice(0, 30);
  const them = who === "self" ? "you" : name || "them";

  return {
    verdict,
    who,
    where,
    state,
    existing,
    which: inp.which,
    count,
    fee: inp.fee,
    perFee,
    feeTotal,
    deputyFirst,
    deputyYearly,
    pressing: inp.pressing,
    jointHome: inp.jointHome === "yes",
    needBy,
    timing,
    signBy,
    sendBy,
    readyFrom,
    readyTo,
    applyBy,
    orderFrom,
    orderTo,
    them,
    today,
  };
}

/** "your mum" style possessive for the body text. */
function theirs(read: LpaRead): string {
  return read.who === "self" ? "your" : read.them === "them" ? "their" : `${read.them}'s`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function feeWords(read: LpaRead): string {
  if (read.count === 0) return "";
  if (read.feeTotal === 0) return `${read.count === 1 ? "one LPA" : `${read.count} LPAs`}, possibly with no fee`;
  return `${money(read.feeTotal)} (${read.count} × ${money(read.perFee)})`;
}

export function lpaHeadline(read: LpaRead): string {
  switch (read.verdict) {
    case "make":
      return read.feeTotal > 0
        ? `No rush, but no reason to wait: ${money(read.feeTotal)} and an evening now, or a court later.`
        : "No rush, but no reason to wait: an evening now, or a court later.";
    case "now":
      return "Do it now, on a good day. A diagnosis isn't the line; understanding this decision is.";
    case "late":
      return `It's too late for an LPA. The route now is the Court of Protection: about ${money(read.deputyFirst)} and 6 to 10 months.`;
    case "register":
      return "Send it to the Office of the Public Guardian now. It can still be registered.";
    case "registered":
      return "It's ready to use. Now tell the bank, and check what it doesn't cover.";
    case "epa-register":
      return "The old Enduring Power of Attorney still works for money, but it has to be registered now.";
    case "epa-ok":
      return "The old Enduring Power still works for money. Health and care decisions need a new LPA.";
    case "elsewhere":
      return read.where === "scotland"
        ? "In Scotland it's a power of attorney, registered with the Office of the Public Guardian (Scotland)."
        : "In Northern Ireland it's an Enduring Power of Attorney, and it covers money only.";
  }
}

export function lpaBody(read: LpaRead): string {
  const p: string[] = [];
  const you = read.who === "self";
  const range = monthRange(read.readyFrom, read.readyTo);
  switch (read.verdict) {
    case "make":
      p.push(
        you
          ? `If an accident, a stroke or an illness left you unable to decide, nobody could sign for you on accounts in your sole name, sell your share of a home, or make care decisions as of right. Not a husband or wife, not "next of kin". An LPA names who can. Made now it costs ${feeWords(read)}, and if you sent it in the next three weeks it would be usable around ${range}.`
          : `${cap(theirs(read))} fine today, which is the easy time: they choose the people and sign it themselves. It costs ${feeWords(read)}, and sent within three weeks it would be usable around ${range}.`,
      );
      p.push(
        `Left until it's needed and too late, the route is a Court of Protection deputyship: about ${money(read.deputyFirst)} in fees the first year and ${money(read.deputyYearly)} a year after, 6 to 10 months' wait, and a deputy the court picks rather than one ${you ? "you" : "they"} chose.`,
      );
      break;
    case "now":
      p.push(
        `Memory problems or a dementia diagnosis don't by themselves mean it's too late. The test is whether, on the day, ${you ? "you" : read.them === "them" ? "they" : read.them} can understand what an LPA does, remember it long enough to decide, weigh it up and say what ${you ? "you" : "they"} want. That's judged on this decision and that day, so pick a good day, a good time of day, and someone who isn't rushing.`,
      );
      p.push(
        `The certificate provider has to be satisfied ${you ? "you understand" : "they understand"} it. If anyone might later question it, ask a GP or a solicitor to assess and note capacity when it's signed. Cost now: ${feeWords(read)}; usable around ${range}. Wait until it's too late and it's about ${money(read.deputyFirst)} in court and supervision fees in the first year, ${money(read.deputyYearly)} a year after, and 6 to 10 months with nobody able to act.`,
      );
      break;
    case "late":
      p.push(
        `If ${read.them === "them" ? "they" : read.them} can't understand, remember and weigh up what an LPA is, even on a good day, it can't be made. Someone, usually family, applies to the Court of Protection to be their property and financial affairs deputy. Fees: ${money(COP_APPLICATION)} to apply, ${money(OPG_ASSESSMENT)} for the OPG's assessment and ${money(SUPERVISION)} a year in supervision (${money(SUPERVISION_MINIMAL)} if the estate is small), plus a yearly security bond, and ${money(COP_HEARING)} more if there's a hearing.`,
      );
      p.push(
        `Applied for by ${letterDate(read.applyBy)}, an order is likely around ${monthRange(read.orderFrom, read.orderTo)}. Until then, use what still works: a DWP appointee for benefits, the other holder on a joint account, and doctors deciding health questions in their best interests, which by law means asking the family.`,
      );
      if (read.state === "lost")
        p.push("If you're not sure they've really lost it (it can come and go, and depends on the decision), get a GP's view before giving up on an LPA: it's far cheaper and quicker.");
      break;
    case "register":
      p.push(
        `An LPA does nothing until the Office of the Public Guardian registers it, and it can't be registered after the person who made it dies. If it was signed properly while ${you ? "you" : "they"} understood it, it can usually still be registered even if ${you ? "you've" : "they've"} lost capacity since.`,
      );
      p.push(
        `Check it before you send it: a missing signature, a wrong date order or an unwitnessed page can get it rejected, and if ${you ? "you" : "they"} can no longer sign again, a mistake may not be fixable. Fee: ${feeWords(read)}. Sent this week, it should be usable around ${range}.`,
      );
      break;
    case "registered":
      p.push(
        `A registered LPA works as soon as it's registered (for money, if ${you ? "you" : "they"} allowed that, even while ${you ? "you" : "they"} can still decide). Each bank, pension and utility has to see it once, and for LPAs registered from 1 September 2019 the attorneys can give them an access code from gov.uk's Use a lasting power of attorney service instead of posting the paper.`,
      );
      if (read.which === "finance")
        p.push(`It's money only. If ${you ? "you" : read.them === "them" ? "they" : read.them} can still decide, a health and welfare LPA as well costs ${money(LPA_FEE)} and covers care, where to live and treatment.`);
      if (read.which === "health")
        p.push(`It's health and welfare only. If ${you ? "you" : read.them === "them" ? "they" : read.them} can still decide, a property and financial affairs LPA as well costs ${money(LPA_FEE)}; without one, paying care fees or selling a home would need a deputy.`);
      break;
    case "epa-register":
      p.push(
        `An Enduring Power of Attorney made before 1 October 2007 still works, for money and property only. Once ${read.them === "them" ? "the person who made it" : read.them} is becoming unable to manage, the attorney must register it with the Office of the Public Guardian, telling them and at least three relatives first. Fee ${money(read.perFee)}${read.count > 1 ? " each" : ""}.`,
      );
      p.push(
        read.state === "lost"
          ? "It doesn't cover health and care decisions. Those will be made by doctors and social workers in their best interests, and they must consult you."
          : `It doesn't cover health and care decisions. If ${read.them === "them" ? "they" : read.them} can still understand one, a health and welfare LPA as well costs ${money(LPA_FEE)}.`,
      );
      break;
    case "epa-ok":
      p.push(
        `An Enduring Power of Attorney made before 1 October 2007 is still valid for money and property. It only has to be registered when ${you ? "you're" : "they're"} becoming unable to manage. It doesn't cover health, care or where to live: a health and welfare LPA does, for ${money(LPA_FEE)}${read.count > 1 ? " each" : ""}.`,
      );
      break;
    case "elsewhere":
      if (read.where === "scotland")
        p.push(
          "A continuing power of attorney covers money and property; a welfare power covers health and care. A solicitor or doctor must sign a certificate that the person understands it, and it's registered with the Office of the Public Guardian (Scotland). The same rule applies: it has to be made while they understand it. If it's too late, the route is a guardianship or intervention order from the sheriff court, which is slower and dearer.",
        );
      else
        p.push(
          "Northern Ireland hasn't brought in Lasting Powers of Attorney. An Enduring Power of Attorney covers property and finance, and is registered with the Office of Care and Protection when the person is becoming unable to manage. There's no power for health decisions yet. If it's too late, the court can appoint a controller. Ask a solicitor or Advice NI.",
        );
      break;
  }
  if (read.timing === "late")
    p.push(
      `You need someone able to act by ${letterDate(read.needBy)}, and ${read.verdict === "late" ? "an order" : "registration"} probably won't be through by then. Tell the buyer's solicitor, the care home or the council now, and ask what they'll accept in the meantime.`,
    );
  else if (read.timing === "tight")
    p.push(`You need someone able to act by ${letterDate(read.needBy)}. That's possible but not certain: start this week, and tell whoever's waiting that it's in hand.`);
  return p.join("\n\n");
}

export type Tile = { label: string; value: string; note: string };

export function tilesOf(read: LpaRead): Tile[] {
  if (read.verdict === "late")
    return [
      { label: "Fees, first year", value: money(read.deputyFirst), note: `plus a bond, and ${money(COP_HEARING)} if there's a hearing` },
      { label: "Each year after", value: money(read.deputyYearly), note: "supervision, and a report to the OPG" },
      { label: "Likely order", value: monthRange(read.orderFrom, read.orderTo), note: `if you apply by ${letterDate(read.applyBy)}` },
    ];
  if (read.verdict === "make" || read.verdict === "now" || read.verdict === "register" || read.verdict === "epa-register" || read.verdict === "epa-ok")
    return [
      {
        label: "To do it now",
        value: read.feeTotal > 0 ? money(read.feeTotal) : read.count > 0 ? "£0" : "—",
        note: read.count > 0 ? (read.feeTotal > 0 ? `${read.count} × ${money(read.perFee)} to register` : "if the fee exemption applies") : "",
      },
      { label: "Usable around", value: monthRange(read.readyFrom, read.readyTo), note: `if it reaches the OPG by ${letterDate(read.sendBy)}` },
      read.verdict === "register"
        ? { label: "If it comes back", value: money(LPA_HALF), note: "to resend within three months; more if they can't re-sign" }
        : read.verdict === "epa-ok" || read.verdict === "epa-register"
          ? { label: "The old EPA covers", value: "Money", note: "and property; not health, care or where to live" }
          : { label: "If it's left too late", value: `${money(read.deputyFirst)}`, note: `then ${money(read.deputyYearly)} a year, and 6 to 10 months` },
    ];
  return [];
}

export function checksOf(read: LpaRead): string[] {
  const out: string[] = [];
  const has = (x: Pressing) => read.pressing.includes(x);
  const they = read.who === "self" ? "you" : "they";
  if (read.verdict === "elsewhere") {
    out.push("Wherever you live, the line is the same: it has to be made while the person understands it. Don't wait for a crisis.");
    out.push("Banks, pension providers and the DWP can set up an appointee for benefits only, which doesn't need a court.");
    return out;
  }
  if (has("bank") || read.verdict === "late")
    out.push(
      `Banks won't take instructions from family without an LPA or a deputyship order, and a bank mandate or "third-party access" stops working once the account holder can't decide. A joint account can usually still be used by the other holder, but bank policies differ, so ask.`,
    );
  if (read.verdict === "make" || read.verdict === "now")
    out.push(
      "While they can still decide: set up direct debits for the regular bills, make sure the pension and benefits are paid into an account someone else can see, and write down where the documents are. It makes the gap before registration far easier.",
    );
  if (has("care") || read.verdict === "late")
    out.push(
      `Attorneys and deputies can't give ${read.who === "self" ? "your" : "their"} money or home away beyond small gifts on birthdays, Christmas or a wedding. Putting a house in the children's names to avoid care fees needs the court, and the council can treat it as deprivation of assets anyway.`,
    );
  if ((has("house") || read.jointHome) && read.verdict === "registered" && read.which !== "health")
    out.push("Selling or remortgaging: with a registered property and financial affairs LPA, the attorney can sign for them. Show it to the conveyancer early; if an attorney is also a co-owner, ask whether a second person has to sign too.");
  else if (has("house") || read.jointHome)
    out.push(
      `If ${they} own a home jointly and lose capacity, it usually can't be sold or remortgaged without an attorney under a property and financial affairs LPA, or a deputy, acting for ${read.who === "self" ? "you" : "them"}. Sometimes a second person has to be appointed too. Sole owners are no different: no LPA, no sale.`,
    );
  if (has("health") || read.verdict === "late" || read.verdict === "epa-register")
    out.push(
      `Without a health and welfare LPA, doctors decide treatment in ${read.who === "self" ? "your" : "their"} best interests. They must ask the family what ${they} would have wanted, but family can't insist. With one, the attorney decides, and life-sustaining treatment only if the LPA says so (option A on the form).`,
    );
  if (has("benefits") || read.verdict === "late")
    out.push(
      "For benefits only (State Pension, Pension Credit, Attendance Allowance), the DWP can make someone an appointee. It's free, needs no court, and is usually quicker. It doesn't cover savings, a private pension or a house.",
    );
  if (read.verdict === "make" || read.verdict === "now") {
    out.push(
      "Make them on gov.uk (Make a lasting power of attorney) rather than downloading forms: it checks the order of signatures and the details, and mistakes are the main reason applications come back. Doing it yourself costs only the fee; a solicitor typically charges a few hundred pounds per LPA.",
    );
    out.push(
      `A husband, wife or civil partner has no automatic power over ${read.who === "self" ? "your" : "their"} sole accounts or ${read.who === "self" ? "your" : "their"} care. Couples usually each make their own, naming each other and a back-up.`,
    );
  }
  if (read.who === "other" && (read.state === "early" || read.state === "fluctuates" || read.state === "lost" || read.state === "unsure"))
    out.push(
      "Money they may be missing: Attendance Allowance (or PIP under State Pension age) isn't means-tested and often applies once someone needs help or supervision with dementia; and a diagnosis plus a qualifying benefit can take them out of the council tax count entirely (the severe mental impairment rule), backdated.",
    );
  if (read.existing === "unsure")
    out.push("Not sure one was ever made? Ask the Office of the Public Guardian to search the register (form OPG100). It tells you if an LPA, EPA or deputy is registered.");
  if (read.fee === "low" || read.fee === "benefits")
    out.push(
      "Ask for the reduction with form LPA120 at the same time as you apply, with evidence; it isn't applied later. Since February 2026 Universal Credit alone doesn't bring a reduction: the test is income of £12,000 or less, or certain other means-tested benefits.",
    );
  out.push("Scams and pressure: an LPA gives real power. Choose people who'd keep records and get on with each other, and be wary of anyone new keen to be named.");
  return out;
}

export type Step = { title: string; body: string };

/** How to make one that won't come back. Only for making. */
export function stepsOf(read: LpaRead): Step[] {
  const making = read.verdict === "make" || read.verdict === "now" || read.verdict === "epa-ok" || (read.verdict === "epa-register" && read.state !== "lost");
  if (!making) return [];
  const out: Step[] = [
    {
      title: "Choose the attorneys, and a back-up",
      body: "Anyone over 18 you trust with the money or the decisions: often a partner and one or two adult children. Add a replacement in case one can't act. Ask them first.",
    },
    {
      title: "Decide how they act",
      body: `"Jointly and severally" lets any one of them act alone, which is easiest. "Jointly" means all must agree on everything, and if one dies or drops out the LPA can stop working. You can mix: jointly for selling the house, separately for everything else.`,
    },
    {
      title: "Find a certificate provider",
      body: "Someone who has known the person well for at least two years, or a professional such as a GP or solicitor. They confirm the person understands it and isn't being pressured. Not a family member, and not an attorney.",
    },
  ];
  if (read.which !== "finance")
    out.push({
      title: "Health and welfare: decide about life-sustaining treatment",
      body: "Option A lets the attorneys decide about life-sustaining treatment; option B leaves it to the doctors. Talk this one through; it's the question families most wish they'd asked.",
    });
  out.push(
    {
      title: "Sign in the right order",
      body: "The person making it signs first, then the certificate provider, then the attorneys and replacements. Signatures need a witness over 18, and an attorney can't witness the person's own signature. Dates must run in that order.",
    },
    {
      title: "Send it to the Office of the Public Guardian",
      body: `With the fee${read.fee === "low" || read.fee === "benefits" ? " and form LPA120 with the evidence for the reduction" : ""}. Either the person or an attorney can apply. Keep copies of every page.`,
    },
  );
  return out;
}

export type DateLine = { on: string; title: string; body: string };

export function remindersOf(read: LpaRead): DateLine[] {
  const out: DateLine[] = [];
  const t = read.today;
  switch (read.verdict) {
    case "make":
    case "now":
    case "epa-ok":
      if (read.who === "other")
        out.push({
          on: addDaysISO(t, 3),
          title: `Talk to ${read.them === "them" ? "them" : read.them} about a Lasting Power of Attorney`,
          body: "Lead with their wishes, not your worries. The message in the tool has an opening.",
        });
      out.push({
        on: read.signBy,
        title: "Sign the Lasting Power of Attorney",
        body: read.verdict === "now" ? "Pick a good day and time of day. Certificate provider ready; witness over 18." : "Signing order: the person, then certificate provider, then attorneys.",
      });
      out.push({ on: read.sendBy, title: "Send the LPA to the Office of the Public Guardian", body: read.perFee > 0 ? `With the fee (${money(read.perFee)} each) and copies kept.` : "With form LPA120 and the evidence for no fee, and copies kept." });
      out.push({
        on: addDaysISO(read.readyTo, 7),
        title: "Chase the LPA if it hasn't come back",
        body: "Call the Office of the Public Guardian with the reference on their letter.",
      });
      break;
    case "register":
    case "epa-register":
      out.push({ on: read.sendBy, title: "Send the power of attorney to the OPG to register", body: "Check every signature and date first; keep copies." });
      out.push({ on: addDaysISO(read.readyTo, 7), title: "Chase the registration if it hasn't come back", body: "Call the Office of the Public Guardian with the reference." });
      break;
    case "late":
      out.push({ on: addDaysISO(t, 2), title: "Ask the DWP about becoming an appointee", body: "For their benefits only. Free, no court." });
      out.push({ on: read.applyBy, title: "Send the deputyship application to the Court of Protection", body: `Fee ${money(COP_APPLICATION)}. Forms COP1, COP1A, COP3 (capacity, from a doctor or social worker) and COP4.` });
      break;
    case "registered":
      out.push({ on: addDaysISO(t, 7), title: "Show the LPA to the bank, pension and utilities", body: "Use an access code from gov.uk's Use a lasting power of attorney service, or a certified copy." });
      break;
    case "elsewhere":
      break;
  }
  if (read.needBy) out.push({ on: read.needBy, title: "Someone needs to be able to act by today", body: "The sale, the move or the decision you said this was for." });
  return out.filter((d) => isISODate(d.on) && d.on >= t).sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(read: LpaRead): Message[] {
  const out: Message[] = [];
  const named = read.them !== "them" && read.them !== "you";
  const making = read.verdict === "make" || read.verdict === "now" || read.verdict === "epa-ok";
  if (making && read.who === "other")
    out.push({
      id: "talk",
      title: "Opening the conversation",
      note: "Not a script to read out; a way in. Lead with their wishes and choices, not your worries. If you've made your own, say so: it makes it ordinary, not a verdict on them.",
      text: `${named ? `${read.them}, ` : ""}can I ask you something that's been on my mind?

I've been reading about what happens if someone has an accident or gets ill and can't sort things out for a while. It turns out that even family can't just step in: the bank won't talk to us, and nobody can pay a bill from your account or decide about care, unless you've said in advance who you'd want.

There's a form for it called a Lasting Power of Attorney. You choose who, and you can say what they can and can't do. It doesn't take anything away from you while you're managing fine.${read.verdict === "now" ? "" : " I'm doing one for myself too."}

I'd rather we did it while it's just paperwork than in a hurry in a hospital corridor. Could we look at it together one afternoon? You'd be the one deciding who and how.`,
    });
  if (making && read.who === "self")
    out.push({
      id: "attorneys",
      title: "Asking someone to be your attorney",
      note: "Ask before you name them. Tell them where you keep things.",
      text: `Hello,

I'm making a Lasting Power of Attorney, so that if I'm ever unable to manage my own affairs someone I trust can step in. I'd like to name you as one of my attorneys${read.which !== "finance" ? ", for money and for health and care decisions" : ", for money"}.

It wouldn't mean anything unless it was needed, and you'd always have to act in my interests and keep records. I'll tell you where my papers are and what I'd want.

Would you be willing? It's fine to say no.

Thank you,
[Your name]`,
    });
  if (read.verdict === "now")
    out.push({
      id: "gp",
      title: "To the GP: a capacity assessment for an LPA",
      note: "Worth it if anyone might later question the LPA, or if you're unsure. GPs may charge for this; a solicitor can arrange one too.",
      text: `Dear Dr [name],

[Name, date of birth] would like to make a Lasting Power of Attorney. Because of [memory problems / a recent diagnosis], we'd like a medical opinion that they have the capacity to make it, recorded at the time.

Could you see [name] for this, ideally in the morning when they're at their best, and let us know if there's a fee? If it helps, the certificate provider can be there too.

Thank you,
[Your name], [relationship]`,
    });
  if (read.verdict === "registered")
    out.push({
      id: "bank",
      title: "To the bank: registering the LPA",
      note: "Most banks have an online form for this. Ask for the attorney to be added to every account, including savings.",
      text: `Hello,

I'm an attorney under a registered Lasting Power of Attorney for [name, date of birth], who has accounts with you ([sort codes and account numbers]).

The LPA access code from the Office of the Public Guardian's Use a lasting power of attorney service is [code]. Please register the LPA on all their accounts and confirm what access I'll have.

Thank you,
[Your name], [phone]`,
    });
  if (read.verdict === "late")
    out.push(
      {
        id: "appointee",
        title: "To the DWP: becoming an appointee",
        note: "Call the office that pays each benefit (the Pension Service for State Pension and Pension Credit, Attendance Allowance for that). They'll usually visit. It only covers benefits.",
        text: `Hello,

I'm [your name], [relationship] of [name, date of birth, National Insurance number]. They can no longer manage their own affairs because of [dementia / a stroke / illness] and there's no power of attorney.

I'd like to apply to be their appointee for [State Pension / Pension Credit / Attendance Allowance]. Please tell me what you need and arrange a visit.

Thank you,
[Your name], [phone]`,
      },
      {
        id: "bank-late",
        title: "To the bank: while a deputyship is applied for",
        note: "Ask before money runs short. Some banks will pay care home fees or essential bills while an application is in progress; policies vary.",
        text: `Hello,

[Name, date of birth] has accounts with you and can no longer manage them because of [reason]. There's no power of attorney, and I'm applying to the Court of Protection to be their deputy.

Until the order is made, please tell me:
- whether essential bills and care fees can continue to be paid from their account;
- whether a joint account holder can continue to use the joint account;
- what you need from me once the order is made.

Thank you,
[Your name], [relationship], [phone]`,
      },
    );
  return out;
}

export function keepList(read: LpaRead): string[] {
  const out: string[] = [];
  if (read.verdict === "late") {
    out.push("A list of their accounts, pensions, property and debts, with rough values. The court and the bond need them.");
    out.push("A note from their GP or social worker about their capacity; the court's form COP3 has to be completed by one of them.");
    out.push("Receipts for anything you pay on their behalf. A deputy keeps accounts and reports every year.");
  } else {
    out.push("The original, registered LPA somewhere safe, and certified copies (the person or a solicitor can certify each page).");
    out.push("The LPA reference and the access code from the Use a lasting power of attorney service.");
    out.push("A list of accounts, pensions, policies and passwords' locations, kept with it.");
  }
  out.push("Their GP practice, NHS number and medication list, for a hospital stay.");
  return out;
}

export function lpaRule(read: LpaRead): string {
  if (read.verdict === "late") return "I use what works now (appointee, joint account, best interests) and apply to be deputy this month.";
  if (read.verdict === "register" || read.verdict === "epa-register") return "I check every signature and send it to the OPG this week.";
  if (read.verdict === "registered") return "I show the LPA to every bank and pension once, and keep a record of everything I do with it.";
  if (read.verdict === "now") return "We do it on the next good day, not after the next crisis.";
  return "I make mine while it's paperwork, and ask the people I love to do theirs.";
}

export function lpaSummary(read: LpaRead): string {
  const lines = [`Power of attorney: ${lpaHeadline(read)}`, "", lpaBody(read), ""];
  const tiles = tilesOf(read);
  if (tiles.length) {
    for (const t of tiles) lines.push(`- ${t.label}: ${t.value}${t.note ? ` (${t.note})` : ""}`);
    lines.push("");
  }
  const steps = stepsOf(read);
  if (steps.length) {
    lines.push("Making it:");
    steps.forEach((s, i) => lines.push(`${i + 1}. ${s.title}. ${s.body}`));
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
  lines.push(
    `Rule: ${lpaRule(read)}`,
    "",
    `England and Wales figures: ${money(LPA_FEE)} per LPA; deputyship ${money(COP_APPLICATION)} application, ${money(OPG_ASSESSMENT)} assessment, ${money(SUPERVISION)} a year. From https://bettereveryday.vercel.app/lpa. Not advice.`,
  );
  return lines.join("\n");
}

const WHOS: Exclude<Who, "">[] = ["self", "other"];
const WHERES: Exclude<Where, "">[] = ["ew", "scotland", "ni"];
const STATES: Exclude<State, "">[] = ["well", "early", "fluctuates", "lost", "unsure"];
const EXISTINGS: Exclude<Existing, "">[] = ["none", "signed", "registered", "epa", "unsure"];
const WHICHES: Exclude<Which, "">[] = ["both", "finance", "health"];
const PEOPLES: Exclude<People, "">[] = ["1", "2"];
const FEES: Exclude<FeeBand, "">[] = ["full", "low", "benefits"];
const PRESSINGS: Pressing[] = ["bank", "care", "house", "health", "benefits"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

export function parseLpaInputs(raw: unknown): LpaInputs {
  if (!raw || typeof raw !== "object") return BLANK_LPA;
  const v = raw as Record<string, unknown>;
  const pressing = Array.isArray(v.pressing)
    ? PRESSINGS.filter((p) => (v.pressing as unknown[]).includes(p))
    : [];
  return {
    who: oneOf(v.who, WHOS),
    where: oneOf(v.where, WHERES),
    state: oneOf(v.state, STATES),
    existing: oneOf(v.existing, EXISTINGS),
    which: oneOf(v.which, WHICHES),
    people: oneOf(v.people, PEOPLES),
    fee: oneOf(v.fee, FEES),
    pressing,
    jointHome: oneOf(v.jointHome, YESNOS),
    needBy: typeof v.needBy === "string" && isISODate(v.needBy) ? v.needBy : "",
    name: typeof v.name === "string" ? v.name.slice(0, 30) : "",
  };
}

/**
 * The worked example: at Christmas Sam notices Mum (79, widowed, owns her
 * house alone) repeating herself and missing bills. The GP has mentioned
 * early Alzheimer's. She may need to sell the house to pay for care within a
 * year or two. No LPA.
 */
export function lpaExample(): LpaInputs {
  return {
    ...BLANK_LPA,
    who: "other",
    where: "ew",
    state: "early",
    existing: "none",
    which: "both",
    people: "1",
    fee: "full",
    pressing: ["bank", "care", "house"],
    jointHome: "no",
    name: "Mum",
  };
}
