/**
 * The read behind "Behind on Energy Bills: What Can They Do, and What Do You
 * Offer?" (/energy).
 *
 * Winter 2026/27. Ofgem's price cap for 1 January to 31 March 2027 was reported
 * (25 November 2026, by several secondary sources; ofgem.gov.uk doesn't resolve
 * from where this was written) as £2,166 a year for a typical dual-fuel home
 * paying by Direct Debit, up from £1,723: about 26%, landing on the three
 * coldest months. Households already behind get letters that read as though
 * the supplier sets the terms. Mostly it doesn't. The rules that matter:
 *
 *   - Ability to pay. Suppliers must take a customer's ability to pay into
 *     account when setting a repayment plan, and when setting how much a
 *     prepayment meter takes towards debt (Ofgem's standard licence
 *     conditions; Ofgem's 2025 "energy debt circuit breaker" strategy
 *     restates it). The usual evidence is an income and spending sheet in the
 *     Standard Financial Statement format, which free debt advisers produce.
 *   - Forced prepayment meters. After the 2023 scandal (agents forcing meters
 *     into vulnerable homes under warrant), Ofgem's Code of Practice became
 *     licence conditions from 8 November 2023. "Do not install" for: anyone
 *     who needs a continuous supply for health (powered medical equipment,
 *     refrigerated medicine); homes where everyone is 75 or over with no
 *     other support; homes with a child under 2; a severe or terminal
 *     condition where nobody could top up. Anyone else must be individually
 *     assessed first, and a meter only goes in where it's safe and
 *     practicable. Suppliers must try repeatedly to contact you and offer a
 *     repayment plan before going to court. (Ofgem press releases and NEA and
 *     Energy UK summaries, via search. Exact attempt counts and visit rules
 *     weren't confirmed, so the tool doesn't quote them.)
 *   - Disconnection for debt is rare: suppliers go for a prepayment meter
 *     instead. Pension-age households have extra winter protection (from
 *     memory: SLC 27.10, 1 October to 31 March).
 *   - Back-billing: handled by /catchup (SLC 21BA, 12 months).
 *   - Complaints: to the supplier; after 8 weeks or a deadlock letter, the
 *     Energy Ombudsman, free.
 *
 * Money in:
 *   - Warm Home Discount: £150 off electricity, 2026/27, for households on a
 *     qualifying means-tested benefit on the qualifying day (reported as
 *     23 August 2026), usually automatic, applied by 31 March. Helpline
 *     0800 030 9322 (from search). Not in Northern Ireland.
 *   - Cold Weather Payment: £25 for each 7-day spell of very cold weather,
 *     1 November to 31 March, England and Wales, on certain benefits (Pension
 *     Credit; Universal Credit and others with conditions). Scotland has the
 *     Winter Heating Payment instead.
 *   - Winter Fuel Payment (pension age), clawed back above £35,000 income.
 *   - Supplier hardship funds and the British Gas Energy Trust (some of its
 *     funds are open to customers of any supplier; from memory).
 *   - Fuel Direct: payments taken from benefits straight to the supplier.
 *   - Ofgem's Debt Relief Scheme: write-off of debt built up from 1 April
 *     2022 to 31 March 2024, first for households on means-tested benefits
 *     with at least £100 of that debt; suppliers identify and contact
 *     customers. Delayed: late-October 2026 reporting says early or spring
 *     2027, after a further consultation. Not law until it starts; the tool
 *     says don't stop paying to wait for it.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type EnRegion = "" | "gb" | "ni";
export type EnMeter = "" | "credit" | "prepay";
export type EnStage =
  | ""
  // credit meter
  | "worried"
  | "behind"
  | "demand"
  | "warrant"
  // prepayment
  | "offsupply"
  | "deductions"
  | "fitted";
export type EnOld = "" | "yes" | "no" | "unsure";
export type EnWho =
  | "medical"
  | "terminal"
  | "over75"
  | "under2"
  | "under5"
  | "disabled"
  | "mental"
  | "pension"
  | "benefits";

export type EnInputs = {
  /** The account, in a few words. Carried between tools. */
  what: string;
  supplier: string;
  region: EnRegion;
  meter: EnMeter;
  stage: EnStage;
  /** What's owed now. */
  owed: string;
  /** Credit meter: the monthly Direct Debit or usual monthly bill. */
  monthly: string;
  /** Prepayment: what the meter takes towards debt each week. */
  weekly: string;
  /** What you could put towards the debt each month, on top of what you use. */
  canPay: string;
  who: EnWho[];
  /** Does any of the debt date from April 2022 to March 2024? */
  old: EnOld;
};

export const BLANK_EN: EnInputs = {
  what: "",
  supplier: "",
  region: "",
  meter: "",
  stage: "",
  owed: "",
  monthly: "",
  weekly: "",
  canPay: "",
  who: [],
  old: "",
};

/** Reported cap for a typical dual-fuel home, a year, Direct Debit. */
export const CAP_NOW = 1723;
export const CAP_JAN = 2166;
export const CAP_RISE = CAP_JAN / CAP_NOW - 1;
export const CAP_CHANGE = "2027-01-01";
export const WHD = 150;
export const WHD_BY = "2027-03-31";
export const CWP = 25;
export const DRS_MIN = 100;
export const OMBUDSMAN_WEEKS = 8;

export const WHO_OPTIONS: { id: EnWho; label: string }[] = [
  { id: "medical", label: "Someone needs power for medical equipment or medicine kept cold (oxygen, dialysis, a stairlift, a hoist)" },
  { id: "terminal", label: "Someone has a terminal or very serious illness (cancer, heart, lung or kidney disease)" },
  { id: "over75", label: "Everyone here is 75 or over, with no one else to help" },
  { id: "under2", label: "A child under 2" },
  { id: "under5", label: "A child aged 2 to 4" },
  { id: "disabled", label: "Someone disabled, or with a long-term health condition made worse by cold" },
  { id: "mental", label: "Someone with a mental health condition, or who'd struggle to top up or deal with letters" },
  { id: "pension", label: "Someone over State Pension age" },
  { id: "benefits", label: "You or your partner get Universal Credit, Pension Credit, Housing Benefit or another means-tested benefit" },
];

/** The "do not install" categories, as the rules describe them. */
const BARRED: EnWho[] = ["medical", "terminal", "over75", "under2"];
/** Must be individually assessed; a meter only where safe and practicable. */
const ASSESS: EnWho[] = ["under5", "disabled", "mental", "pension"];

export type EnStatus = "ni" | Exclude<EnStage, "">;

export type EnAction = { id: string; title: string; detail: string };

export type EnRead = {
  status: EnStatus;
  owed: number | null;
  monthly: number | null;
  weekly: number | null;
  canPay: number | null;
  /** Months to clear the debt at canPay. */
  months: number | null;
  /** Credit: the extra a month, at the same use, once the January cap applies. */
  janExtra: number | null;
  /** True before the January cap starts. */
  beforeJan: boolean;
  barred: EnWho[];
  assess: EnWho[];
  /** Qualifies for the Priority Services Register on what's been said. */
  psr: boolean;
  benefits: boolean;
  pension: boolean;
  /** Debt Relief Scheme: likely / maybe / no. */
  drs: "likely" | "maybe" | "no";
  actions: EnAction[];
};

const CUR = "£";

export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r)
    ? `${CUR}${r.toLocaleString("en-GB")}`
    : `${CUR}${r.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function whole(n: number): string {
  return money(Math.round(n));
}

const CREDIT_STAGES: EnStage[] = ["worried", "behind", "demand", "warrant"];
const PREPAY_STAGES: EnStage[] = ["offsupply", "deductions", "fitted"];

export function stageFits(meter: EnMeter, stage: EnStage): boolean {
  if (!stage) return false;
  return meter === "credit" ? CREDIT_STAGES.includes(stage) : meter === "prepay" ? PREPAY_STAGES.includes(stage) : false;
}

function supplierName(inp: EnInputs): string {
  return inp.supplier.trim() || "your supplier";
}

function whoText(w: EnWho): string {
  switch (w) {
    case "medical":
      return "someone here needs a constant supply for medical equipment or medicine";
    case "terminal":
      return "someone here has a terminal or very serious illness";
    case "over75":
      return "everyone here is 75 or over, with no other support";
    case "under2":
      return "there's a child under 2 here";
    case "under5":
      return "there's a young child here";
    case "disabled":
      return "someone here is disabled or has a health condition made worse by cold";
    case "mental":
      return "someone here has a mental health condition or would struggle to top up";
    case "pension":
      return "someone here is over State Pension age";
    case "benefits":
      return "we're on a means-tested benefit";
  }
}

function listJoin(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

export function readEnergy(inp: EnInputs, today = todayISO()): EnRead | null {
  if (inp.region === "ni") return emptyRead("ni", inp, today);
  if (inp.region !== "gb" || !stageFits(inp.meter, inp.stage)) return null;
  return emptyRead(inp.stage as EnStatus, inp, today);
}

function emptyRead(status: EnStatus, inp: EnInputs, today: string): EnRead {
  const owed = parseMoney(inp.owed);
  const monthly = parseMoney(inp.monthly);
  const weekly = parseMoney(inp.weekly);
  const canPay = parseMoney(inp.canPay);
  const months = owed !== null && owed > 0 && canPay !== null && canPay > 0 ? Math.ceil(owed / canPay) : null;
  const beforeJan = today < CAP_CHANGE;
  const credit = inp.meter === "credit";
  const janExtra = credit && monthly !== null && monthly > 0 && beforeJan ? monthly * CAP_RISE : null;
  const barred = BARRED.filter((w) => inp.who.includes(w));
  const assess = ASSESS.filter((w) => inp.who.includes(w));
  const benefits = inp.who.includes("benefits");
  const pension = inp.who.includes("pension") || inp.who.includes("over75");
  const psr = barred.length > 0 || assess.length > 0;
  const hasDebt = owed === null ? status !== "worried" : owed >= DRS_MIN;
  const drs: EnRead["drs"] =
    !hasDebt || inp.old === "no" || status === "ni"
      ? "no"
      : benefits && inp.old === "yes"
        ? "likely"
        : "maybe";
  const read: EnRead = {
    status,
    owed,
    monthly,
    weekly,
    canPay,
    months,
    janExtra,
    beforeJan,
    barred,
    assess,
    psr,
    benefits,
    pension,
    drs,
    actions: [],
  };
  read.actions = enActions(inp, read);
  return read;
}

export function enHeadline(inp: EnInputs, read: EnRead): string {
  const s = supplierName(inp);
  const plan = read.canPay !== null && read.canPay > 0 ? `${money(read.canPay)} a month` : null;
  const clears =
    plan && read.months !== null
      ? ` That clears ${whole(read.owed ?? 0)} in ${read.months} month${read.months === 1 ? "" : "s"}.`
      : "";
  switch (read.status) {
    case "ni":
      return "Northern Ireland has its own regulator and rules. Start with the Consumer Council.";
    case "worried":
      return read.janExtra !== null
        ? `From 1 January the same energy costs about a quarter more: around ${whole(read.janExtra)} a month on your ${whole(read.monthly ?? 0)}. Read the meter that morning.`
        : read.beforeJan
          ? "The price cap rises about a quarter from 1 January. Read your meters that morning, and check what you're owed this winter."
          : "The price cap rose about a quarter on 1 January. Check what you're owed this winter, before you fall behind.";
    case "behind":
      return plan
        ? `Offer ${plan}, in writing, before ${s} picks a number for you.${clears}`
        : `Write to ${s} first with what you can afford. They have to take it into account.`;
    case "demand":
      return plan
        ? `A final demand isn't the final word. Offer ${plan}, and ask them to hold collection while they consider it.${clears}`
        : "A final demand isn't the final word. Work out what you can pay, then offer it in writing.";
    case "warrant":
      if (read.barred.length)
        return `They shouldn't force a prepayment meter into this home: ${whoText(read.barred[0])}. Tell them in writing today${plan ? `, and offer ${plan}` : ""}.${clears}`;
      if (read.assess.length)
        return `Before any meter goes in, ${s} has to assess your home and show it's safe. Tell them why it isn't${plan ? `, and offer ${plan}` : ""}.${clears}`;
      return plan
        ? `Offer ${plan} before the warrant hearing.${clears} A plan you keep is the answer a court looks for.`
        : "Answer before the warrant hearing with a plan you can keep. That's what stops it.";
    case "offsupply":
      return "Ring today for emergency and extra credit, and ask to be put on the Priority Services Register.";
    case "deductions":
      return read.weekly !== null
        ? `Ask ${s} to cut the ${money(read.weekly)} a week taken from your top-ups to what you can afford. They have to consider it.`
        : `Ask ${s} to cut what's taken from your top-ups to what you can afford. They have to consider it.`;
    case "fitted":
      return read.barred.length
        ? `That meter shouldn't have been forced in: ${whoText(read.barred[0])}. Ask for it to be switched back to credit, and for compensation.`
        : "If you weren't assessed or offered a plan first, ask for the meter to be switched back to credit, and complain.";
  }
}

export function enBody(inp: EnInputs, read: EnRead): string {
  const parts: string[] = [];
  switch (read.status) {
    case "ni":
      return "In Northern Ireland, energy is regulated by the Utility Regulator, most homes already use keypad prepayment meters, and the Warm Home Discount doesn't apply. Suppliers still have to offer a way to repay that you can afford. Ring your supplier, then the Consumer Council (free) if it isn't sorted. Advice NI gives free debt advice.";
    case "worried":
      parts.push(
        `Ofgem's cap for January to March 2027 was reported as ${money(CAP_JAN)} a year for a typical home, up from ${money(CAP_NOW)}. It caps the unit rates and standing charges, not your bill, so the more you use the more it costs, and it lands on the three months you use most.`,
      );
      if (read.janExtra !== null)
        parts.push(
          `If your Direct Debit was set for this autumn's prices, the same use would need roughly ${whole((read.monthly ?? 0) + read.janExtra)} a month. ${inp.supplier.trim() || "Your supplier"} may raise it; you can ask for the reasoning and give a reading first, so it's based on real use, not an estimate.`,
        );
      parts.push(
        "Readings taken on 1 January make sure December's energy is charged at December's price. A dated photo of each meter is enough.",
      );
      break;
    case "behind":
    case "demand":
      parts.push(
        "Suppliers have to take your ability to pay into account when they set a repayment plan. The letter will usually suggest a number that clears the debt quickly. You don't have to accept it: offer what you can keep, with your income and spending written down, and ask them to confirm it in writing.",
      );
      if (inp.meter === "credit")
        parts.push(
          "Keep paying for what you use now, even if it's less than they ask. A plan has two parts: your ongoing use, and a smaller amount towards the debt. Missing the first is what makes the debt grow.",
        );
      if (read.status === "demand")
        parts.push(
          "If it's gone to a debt collector, the supplier's rules still apply and you can deal with the supplier directly. Disconnection for debt is very rare now; what usually comes next is a letter about a prepayment meter.",
        );
      break;
    case "warrant":
      parts.push(
        "After the 2023 scandal, when agents forced meters into vulnerable homes, Ofgem made its rules part of every supplier's licence. A supplier mustn't force a prepayment meter into a home where someone needs a constant supply for health, where everyone is 75 or over with no other support, where there's a child under 2, or where someone is seriously or terminally ill and nobody could top up. Everyone else has to be assessed first, offered a repayment plan, and contacted repeatedly before a warrant.",
      );
      if (read.barred.length)
        parts.push(`On what you've said, ${listJoin(read.barred.map(whoText))}. That puts the home in the "do not install" group. Say so in writing, with any evidence (a letter from a GP or nurse, a birth certificate), and ask for confirmation.`);
      else if (read.assess.length)
        parts.push(`On what you've said, ${listJoin(read.assess.map(whoText))}. That doesn't rule a meter out, but they have to weigh it and show a meter would be safe and practicable. Tell them in writing what would happen if you couldn't top up.`);
      parts.push("A warrant needs a magistrates' court. You can write to the court, or go, and say a plan has been offered.");
      break;
    case "offsupply":
      parts.push(
        "Going without heat or light is called self-disconnection, and suppliers are meant to spot it and help. Every prepayment meter has emergency credit. Most suppliers also give extra or \"additional support\" credit to people who can't top up, and many have friendly-credit hours when the supply won't cut off (nights, weekends, bank holidays).",
      );
      parts.push(
        "Standing charges keep building while you're off supply, and they come off your next top-up. Ask for that debt to be taken slowly, at what you can afford.",
      );
      break;
    case "deductions":
      parts.push(
        "The amount a prepayment meter takes towards debt is set by the supplier, and it has to take your ability to pay into account. If the deduction leaves you rationing heat, ask for it to be lowered, with your income and spending written down. Ask in writing so there's a record.",
      );
      break;
    case "fitted":
      parts.push(
        "Ofgem made suppliers review forced installations after the 2023 scandal, and several paid compensation where meters went into homes that should have been protected. If no one assessed your home, you weren't offered a plan, or someone here is in a protected group, ask for the meter to be removed or switched back to credit mode, for any warrant costs to be taken off, and for compensation.",
      );
      break;
  }
  if (read.status !== "worried" && read.status !== "fitted" && read.months !== null && read.months > 24)
    parts.push(
      "That's a long plan, and that's fine if it's what you can afford. A free debt adviser can also check whether a grant or a write-off would shorten it.",
    );
  return parts.join(" ");
}

/** The protections and the money, as lines. */
export function enProtections(inp: EnInputs, read: EnRead): string[] {
  if (read.status === "ni") return [];
  const lines: string[] = [];
  if (read.psr)
    lines.push(
      "Priority Services Register: free, run by your supplier and network. It flags your home for advance notice of power cuts, help in an emergency, and extra care with debt. Ask to join on the phone.",
    );
  if (read.status !== "warrant" && read.status !== "fitted" && read.barred.length && inp.meter === "credit")
    lines.push(`If it ever gets to a prepayment meter letter: ${whoText(read.barred[0])}, which is one of the groups a meter mustn't be forced on.`);
  if (read.pension)
    lines.push("Pension-age households have extra protection from disconnection over the winter (1 October to 31 March).");
  lines.push(
    "Some of a bill may be too old to charge: suppliers can't bill for energy used more than 12 months before the bill if you weren't billed correctly at the time. The catch-up bill tool splits it.",
  );
  lines.push(
    `A complaint: write to ${supplierName(inp)} and say it's a complaint. After ${OMBUDSMAN_WEEKS} weeks, or sooner with a "deadlock" letter, the Energy Ombudsman looks at it for free and can order an apology, a fix and compensation.`,
  );
  return lines;
}

export function enMoneyIn(inp: EnInputs, read: EnRead): string[] {
  if (read.status === "ni") return [];
  const lines: string[] = [];
  if (read.benefits) {
    lines.push(
      `Warm Home Discount: ${money(WHD)} off your electricity, usually automatic for households on a qualifying means-tested benefit in August. It should arrive by ${letterDate(WHD_BY)}. If it doesn't, ring the helpline (0800 030 9322) or your supplier.`,
    );
    lines.push(
      `Cold Weather Payment: ${money(CWP)} for each 7-day spell of very cold weather between November and March, paid automatically on Pension Credit and, with conditions, Universal Credit and some other benefits (England and Wales; Scotland has the Winter Heating Payment).`,
    );
    lines.push(
      "Fuel Direct: if you're on Universal Credit, Pension Credit or another means-tested benefit, the DWP can pay the supplier straight from your benefit, at a fixed low rate towards the debt. Ask the supplier or the DWP.",
    );
  } else {
    lines.push(
      `Check you aren't missing a benefit: many people who'd get Universal Credit, Pension Credit or Council Tax Reduction don't claim. Getting one also unlocks the ${money(WHD)} Warm Home Discount and Cold Weather Payments.`,
    );
  }
  if (read.pension)
    lines.push("Winter Fuel Payment: paid in November or December to people over State Pension age; it's taken back through tax if your income is over £35,000.");
  if (read.status !== "worried")
    lines.push(
      "Hardship funds: most large suppliers run one, and the British Gas Energy Trust has grants open to customers of other suppliers. A free debt adviser can apply with you; they usually want an income and spending sheet.",
    );
  if (read.drs === "likely")
    lines.push(
      `Ofgem's Debt Relief Scheme: a planned write-off of energy debt built up between April 2022 and March 2024, first for households on means-tested benefits with at least ${money(DRS_MIN)} of it. You look like you'd qualify. It's been delayed to early 2027; your supplier should contact you. Don't stop paying to wait for it.`,
    );
  else if (read.drs === "maybe")
    lines.push(
      "Ofgem's Debt Relief Scheme: a planned write-off of energy debt built up between April 2022 and March 2024, first for households on means-tested benefits, later possibly others. Delayed to early 2027. Ask your supplier how much of your debt dates from then. Don't stop paying to wait for it.",
    );
  return lines;
}

function enActions(inp: EnInputs, read: EnRead): EnAction[] {
  const s = supplierName(inp);
  const a: EnAction[] = [];
  if (read.status === "ni") return a;
  if (read.status === "offsupply")
    a.push({ id: "credit", title: "Ring for emergency and extra credit", detail: `Today. Tell ${s} you can't top up and ask for additional support credit.` });
  if (read.status === "warrant" || read.status === "fitted")
    a.push({ id: "tell", title: "Tell them who lives here, in writing", detail: "Email or letter, with any evidence. Keep a copy." });
  if (read.psr)
    a.push({ id: "psr", title: "Join the Priority Services Register", detail: `Ask ${s}; it takes a few minutes and costs nothing.` });
  if (["behind", "demand", "warrant", "deductions"].includes(read.status))
    a.push({
      id: "offer",
      title: read.status === "deductions" ? "Ask for a lower weekly deduction" : "Offer a plan you can keep",
      detail: "Write down your income and spending first. The letter below has the shape.",
    });
  if (read.status === "worried" && read.beforeJan && inp.meter === "credit")
    a.push({ id: "read", title: "Read the meters on 1 January", detail: "Photo each one, then send the readings." });
  if (read.benefits) a.push({ id: "whd", title: "Check the Warm Home Discount arrives", detail: `${money(WHD)}, by ${letterDate(WHD_BY)}.` });
  if (read.status !== "worried")
    a.push({ id: "advice", title: "Talk to a free debt adviser", detail: "National Debtline, StepChange or Citizens Advice. They can deal with the supplier for you." });
  return a;
}

export type EnLetter = { id: string; title: string; note: string; text: string };

function opening(inp: EnInputs, dated: string): string {
  const s = inp.supplier.trim();
  return `${dated}\n\n${s ? `To: ${s}\n\n` : ""}Dear Sir or Madam,`;
}

function signOff(): string {
  return "Yours faithfully,\n[Your name]\n[Account number]\n[Address]";
}

export function enLetters(inp: EnInputs, read: EnRead, today = todayISO()): EnLetter[] {
  if (read.status === "ni" || read.status === "worried") return [];
  const out: EnLetter[] = [];
  const dated = letterDate(today);
  const owedText = read.owed !== null ? ` of ${money(read.owed)}` : "";
  // Groups already named in the body of a warrant or meter letter aren't repeated in the closing note.
  const meterLetter = read.status === "warrant" || read.status === "fitted";
  const named: EnWho[] = meterLetter ? (read.barred.length ? read.barred : read.assess) : [];
  const who = [...read.barred, ...read.assess, ...(read.benefits ? (["benefits"] as EnWho[]) : [])].filter((w) => !named.includes(w));
  const whoPara = who.length
    ? `\n\nPlease note that ${listJoin(who.map(whoText))}. ${read.psr ? "Please add us to your Priority Services Register and record this on our account." : "Please take this into account."}`
    : named.length
      ? "\n\nPlease add us to your Priority Services Register and record our circumstances on the account."
      : "";
  const offer =
    read.canPay !== null && read.canPay > 0
      ? `I can afford to pay ${money(read.canPay)} a month towards the arrears${read.status !== "deductions" && inp.meter === "credit" ? ", on top of paying for the energy we use" : ""}. I've attached a statement of our income and outgoings.`
      : "I've attached a statement of our income and outgoings showing what we can afford, and I'd like a plan based on it.";

  if (read.status === "behind" || read.status === "demand" || read.status === "warrant") {
    out.push({
      id: "plan",
      title: read.status === "warrant" ? "To the supplier: no meter, a plan instead" : "To the supplier: the plan you can keep",
      note: "Email it if you can, so there's a dated copy. Attach an income and spending sheet; a free debt adviser can make one in the standard format suppliers accept.",
      text: `${opening(inp, dated)}\n\nI'm writing about the arrears${owedText} on my account. I want to pay them, at a rate I can keep up.\n\n${offer} Under your licence conditions you must take my ability to pay into account when agreeing a repayment arrangement. Please confirm the plan in writing, and put any further collection action on hold while you consider it.${
        read.status === "warrant"
          ? `\n\nI do not agree to a prepayment meter being installed, or a smart meter being switched to prepayment mode.${
              read.barred.length
                ? ` Our household falls within the groups for whom Ofgem's rules say a prepayment meter must not be installed involuntarily, because ${listJoin(read.barred.map(whoText))}.`
                : read.assess.length
                  ? ` Before any installation you must assess our circumstances, including that ${listJoin(read.assess.map(whoText))}, and be satisfied it would be safe and reasonably practicable. I don't believe it would be.`
                  : " Please confirm what assessment of our circumstances has been carried out."
            } If you have applied, or intend to apply, for a warrant, please tell me the court and the date, and confirm that you will tell the court about this offer.`
          : ""
      }${whoPara}\n\nIf this is not resolved, please treat this letter as a complaint.\n\n${signOff()}`,
    });
  }
  if (read.status === "offsupply" || read.status === "deductions") {
    out.push({
      id: "prepay",
      title: "To the supplier: credit, and a lower deduction",
      note: "Ring first if you're off supply now; send this after, so the request is on record.",
      text: `${opening(inp, dated)}\n\nI have a prepayment meter and I'm struggling to keep it topped up${
        read.status === "offsupply" ? "; we have been going without gas or electricity" : ""
      }.\n\nPlease:\n1. give us additional support credit if we need it while this is sorted out;\n2. reduce the amount taken towards debt${read.weekly !== null ? ` from ${money(read.weekly)} a week` : ""} to ${
        read.canPay !== null && read.canPay > 0 ? `${money((read.canPay * 12) / 52)} a week (${money(read.canPay)} a month)` : "an amount based on the attached statement of our income and outgoings"
      }, which is what we can afford. You must take our ability to pay into account when setting this;\n3. tell me about any hardship fund or grant we could apply for.${whoPara}\n\nIf this is not resolved, please treat this letter as a complaint.\n\n${signOff()}`,
    });
  }
  if (read.status === "fitted") {
    out.push({
      id: "fitted",
      title: "To the supplier: switch it back",
      note: "Send it as a complaint. After eight weeks, or a deadlock letter, the Energy Ombudsman can take it.",
      text: `${opening(inp, dated)}\n\nThis is a complaint about the prepayment meter installed at my home (or my smart meter being switched to prepayment mode) without my agreement.\n\n${
        read.barred.length
          ? `Our household is one where Ofgem's rules say a prepayment meter must not be installed involuntarily, because ${listJoin(read.barred.map(whoText))}.`
          : read.assess.length
            ? `I do not believe our circumstances were properly assessed, including that ${listJoin(read.assess.map(whoText))}.`
            : "I do not believe our circumstances were properly assessed, or that I was offered a repayment plan I could afford first."
      }\n\nPlease:\n1. remove the meter or switch it back to credit mode;\n2. remove any warrant or installation charges from my account;\n3. pay compensation for the distress and inconvenience caused;\n4. send me the records of the contact attempts and the assessment carried out before the installation.${whoPara}\n\n${signOff()}`,
    });
  }
  return out;
}

export function enReminders(inp: EnInputs, read: EnRead, today = todayISO()): { on: string; title: string; body: string }[] {
  if (read.status === "ni") return [];
  const out: { on: string; title: string; body: string }[] = [];
  if (inp.meter === "credit" && today <= CAP_CHANGE)
    out.push({
      on: CAP_CHANGE,
      title: "Read the gas and electricity meters",
      body: "Price cap changes today. Photograph each meter with the date, then send the readings to your supplier so December is charged at December's price.",
    });
  if (["behind", "demand", "warrant", "deductions", "offsupply", "fitted"].includes(read.status))
    out.push({
      on: addDaysISO(today, OMBUDSMAN_WEEKS * 7),
      title: "Energy complaint: eight weeks",
      body: "If the supplier hasn't sorted it, the Energy Ombudsman can take the complaint now, free.",
    });
  if (read.benefits && today <= WHD_BY)
    out.push({
      on: WHD_BY,
      title: "Has the £150 Warm Home Discount arrived?",
      body: "If not, ring 0800 030 9322 or your supplier.",
    });
  return out.sort((a, b) => (a.on < b.on ? -1 : 1));
}

export function enRule(read: EnRead): string {
  if (read.status === "worried") return "Read the meter on New Year's Day, and claim what's mine before the cold comes.";
  return "Offer first, in writing, at what I can actually keep. The pace is mine to propose.";
}

export function enSummary(inp: EnInputs, read: EnRead, today = todayISO()): string {
  const lines = [
    "Behind on energy bills — the read",
    "",
    enHeadline(inp, read),
    "",
    enBody(inp, read),
  ];
  if (read.actions.length) {
    lines.push("", "Next:");
    for (const a of read.actions) lines.push(`- ${a.title}: ${a.detail}`);
  }
  const prot = enProtections(inp, read);
  if (prot.length) {
    lines.push("", "What protects you:");
    for (const p of prot) lines.push(`- ${p}`);
  }
  const m = enMoneyIn(inp, read);
  if (m.length) {
    lines.push("", "Money you may be due:");
    for (const p of m) lines.push(`- ${p}`);
  }
  for (const l of enLetters(inp, read, today)) lines.push("", `${l.title}:`, "", l.text);
  if (read.status !== "ni") lines.push("", enRule(read));
  lines.push("", "From Better Every Day — /energy. Not legal advice.");
  return lines.join("\n");
}

const REGIONS: EnRegion[] = ["gb", "ni"];
const METERS: EnMeter[] = ["credit", "prepay"];
const STAGES: EnStage[] = [...CREDIT_STAGES, ...PREPAY_STAGES];
const OLDS: EnOld[] = ["yes", "no", "unsure"];
const WHOS: EnWho[] = WHO_OPTIONS.map((o) => o.id);

function str(v: unknown, max = 120): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}
function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

export function parseEnInputs(raw: unknown): EnInputs {
  if (!raw || typeof raw !== "object") return BLANK_EN;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what),
    supplier: str(v.supplier, 80),
    region: oneOf(v.region, REGIONS),
    meter: oneOf(v.meter, METERS),
    stage: oneOf(v.stage, STAGES),
    owed: str(v.owed, 40),
    monthly: str(v.monthly, 40),
    weekly: str(v.weekly, 40),
    canPay: str(v.canPay, 40),
    who: Array.isArray(v.who) ? WHOS.filter((w) => (v.who as unknown[]).includes(w)) : [],
    old: oneOf(v.old, OLDS),
  };
}

/**
 * The worked example: Dee, £640 behind on a credit meter, a letter saying the
 * supplier will apply for a warrant to fit a prepayment meter. A baby of 14
 * months, Universal Credit, part of the debt from the 2022 winter.
 */
export const EN_EXAMPLE: EnInputs = {
  what: "gas and electricity",
  supplier: "",
  region: "gb",
  meter: "credit",
  stage: "warrant",
  owed: "£640",
  monthly: "£118",
  weekly: "",
  canPay: "£30",
  who: ["under2", "benefits"],
  old: "yes",
};
