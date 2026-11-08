/**
 * The read behind "Behind on Council Tax: What Happens Next?" (/counciltax).
 *
 * Council tax is the debt that escalates fastest in England. One missed
 * monthly instalment brings a reminder; if it isn't paid within seven days,
 * the right to pay by instalments goes and the whole of the rest of the year
 * falls due at once. Then come a magistrates' court summons (with costs added),
 * a liability order, and the powers it unlocks: deductions from pay or
 * benefits, or bailiffs, whose fees start at £79. The usual mistake is the
 * drawer: a £160 problem that becomes a £1,300 one in a fortnight.
 *
 * The second half of the read is the bill itself. It's worked out from what the
 * council knows about who lives there, and it assumes two or more adults who
 * all count. A full-time student, a carer, someone with a severe mental
 * impairment, an apprentice or a teenager still at school doesn't count, so a
 * household can be paying 25% too much for years without anyone noticing. A
 * room or adaptation needed for a disabled resident moves the bill down a band.
 * Council Tax Reduction, for anyone on a low income, is a separate claim.
 *
 * England and Wales (the Council Tax (Administration and Enforcement)
 * Regulations 1992, as amended; discounts under the Local Government Finance
 * Act 1992 and its disregard schedule), from search summaries of council,
 * Citizens Advice, National Debtline, Shelter and Carers UK pages, since gov.uk
 * and legislation.gov.uk don't resolve from where this was written:
 *
 *   - Reminder: about seven days to pay the missed instalment. Pay it and the
 *     instalments carry on; if not, the rest of the year's bill becomes due
 *     (seven days later, on most councils' wording). A second miss in the
 *     same year gets a second reminder; a third loses the instalments without
 *     one.
 *   - Final notice: the whole balance is due; about seven days before a
 *     summons can be applied for.
 *   - Summons: issued at least 14 days before the hearing. Costs are added
 *     when it's issued, set by each council and meant to be reasonable;
 *     examples found ranged from about £70 to £100 for summons and liability
 *     order together. Paying the whole amount, with the costs, before the
 *     hearing means no liability order. Not being able to pay isn't a defence.
 *   - Liability order: attachment of earnings, deductions from benefits,
 *     bailiffs (£79 compliance fee; £247 once they visit, from May 2026), a
 *     charging order, bankruptcy, and in England only, and rarely, committal
 *     for wilful refusal or culpable neglect (abolished in Wales in 2019).
 *   - The council can't get a liability order for council tax that fell due
 *     more than six years before the summons.
 *   - Reform (England): confirmed on 12 October 2026 (council tax information
 *     letter 5/2026), in force from April 2027. A reminder and a final notice
 *     both become compulsory before instalments can be lost; the final notice
 *     can't come sooner than 41 days after the first missed payment or 14 days
 *     after the last reminder, and gives 21 days to catch up. Twelve monthly
 *     instalments become the default for new bills from April 2027 and for
 *     everyone from April 2028. Nothing here changes before then.
 *   - Discounts: 25% when only one adult counts; 50% when none do; exempt
 *     when everyone is a full-time student, or the only resident has a severe
 *     mental impairment. Disabled band reduction: charged at the band below
 *     (a sixth off in band A).
 *   - Bands as ninths of band D: A 6, B 7, C 8, D 9, E 11, F 13, G 15, H 18,
 *     and in Wales I 21.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type CtRegion = "" | "england" | "wales" | "scot" | "ni";
export type CtStage = "" | "bill" | "missed" | "reminder" | "final" | "summons" | "order" | "bailiff";
export type CtBand = "" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "unsure";
export type CtOnBill = "" | "none" | "25" | "50" | "exempt" | "unsure";
export type YesNo = "" | "yes" | "no";
export type CtCanPay = "" | "all" | "plan" | "none";
export type CtInstalments = "" | "10" | "12";

export type CtInputs = {
  /** The account, in a few words: "council tax 2026/27". Carried between tools. */
  what: string;
  /** The council's name. Optional. */
  council: string;
  region: CtRegion;
  stage: CtStage;
  /** ISO date printed on the reminder or final notice. */
  letterOn: string;
  /** ISO date of the magistrates' court hearing on a summons. */
  hearingOn: string;
  /** The yearly bill as charged now, after any discount already on it. */
  annual: string;
  /** Paid so far this year. */
  paid: string;
  instalments: CtInstalments;
  band: CtBand;
  /** Adults (18 and over) who live there, "1" to "4" (4 = four or more). */
  adults: string;
  /** How many of them are on the doesn't-count list. */
  notCounted: string;
  /** When nobody counts: is everyone a full-time student? */
  allStudents: YesNo;
  onBill: CtOnBill;
  /** A room, bathroom or space needed by a disabled resident. */
  disabled: YesNo;
  lowIncome: YesNo;
  canPay: CtCanPay;
};

export const BLANK_CT: CtInputs = {
  what: "",
  council: "",
  region: "",
  stage: "",
  letterOn: "",
  hearingOn: "",
  annual: "",
  paid: "",
  instalments: "",
  band: "",
  adults: "",
  notCounted: "",
  allStudents: "",
  onBill: "",
  disabled: "",
  lowIncome: "",
  canPay: "",
};

/** The day England's new reminder rules start. */
export const REFORM_FROM = "2027-04-01";
export const REMINDER_DAYS = 7;
export const FINAL_DAYS = 7;
export const NEW_FINAL_DAYS = 21;
export const NEW_MIN_AFTER_REMINDER = 14;
export const BAILIFF_COMPLIANCE = 79;
export const BAILIFF_VISIT = 247;

/** Each band as ninths of band D. */
export const BAND_NINTHS: Record<Exclude<CtBand, "" | "unsure">, number> = {
  A: 6,
  B: 7,
  C: 8,
  D: 9,
  E: 11,
  F: 13,
  G: 15,
  H: 18,
  I: 21,
};
const BAND_ORDER: Exclude<CtBand, "" | "unsure">[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

/** The share of the bill paid after a disabled band reduction: the band below, or 5/6 in band A. */
export function bandReductionFactor(band: CtBand): number | null {
  if (band === "" || band === "unsure") return null;
  if (band === "A") return 5 / 6;
  const i = BAND_ORDER.indexOf(band);
  return BAND_NINTHS[BAND_ORDER[i - 1]] / BAND_NINTHS[band];
}

export type CtStatus =
  | "elsewhere" // Scotland or Northern Ireland
  | "check" // up to date: check the bill
  | "missed" // missed one, no letter yet
  | "reminder"
  | "final"
  | "summons"
  | "order"
  | "bailiff";

export type CtRung = { id: string; label: string; cost: string; detail: string };

export type CtRead = {
  status: CtStatus;
  /** True when the new (April 2027) rules govern the letter. */
  newRules: boolean;
  yearly: number | null;
  paid: number | null;
  instalmentCount: number;
  /** One instalment, from the yearly bill. */
  instalment: number | null;
  /** What's left of the year: the amount that falls due if instalments are lost. */
  balance: number | null;
  /** The last day to act on the current letter. */
  actBy: string;
  /** The day the whole balance falls due if the reminder isn't paid (old rules). */
  wholeDueOn: string;
  /** New rules: the earliest a final notice could come after this reminder. */
  finalNoSooner: string;
  /** True when `actBy` is already past. */
  actPassed: boolean;
  /** Summons: true when the hearing is today or past. */
  hearingPassed: boolean;
  /** Adults who count for council tax, or null if not given. */
  countable: number | null;
  /** The discount the household looks entitled to, in %. */
  expectedPct: number | null;
  /** The discount on the bill now, in %, or null if unsure. */
  billedPct: number | null;
  /** True when the household looks entitled to more discount than the bill shows. */
  discountGap: boolean;
  /** True when a disabled band reduction may apply. */
  bandReduction: boolean;
  /** The yearly bill if everything found here were applied, when it can be worked out. */
  fairYearly: number | null;
  /** The yearly saving, when it can be worked out. */
  saving: number | null;
  /** The enforcement ladder, with the current rung marked by `here`. */
  ladder: CtRung[];
  here: number;
};

const CUR = "£";

/** Pounds, with pence only when there are any: £79, £196.50. */
export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r)
    ? `${CUR}${r.toLocaleString("en-GB")}`
    : `${CUR}${r.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function amount(raw: string): number | null {
  const n = parseMoney(raw);
  return n !== null && n > 0 ? n : null;
}

function whole(raw: string): number | null {
  return /^\d$/.test(raw) ? Number(raw) : null;
}

export function ctReady(inp: CtInputs): boolean {
  if (!inp.region) return false;
  if (inp.region === "scot" || inp.region === "ni") return true;
  if (!inp.stage) return false;
  if (inp.stage === "bailiff") return true;
  if ((inp.stage === "reminder" || inp.stage === "final") && !isISODate(inp.letterOn)) return false;
  if (inp.stage === "summons" && !isISODate(inp.hearingOn)) return false;
  if (inp.stage !== "bill" && !inp.canPay) return false;
  return true;
}

function newRulesFor(inp: CtInputs, today: string): boolean {
  if (inp.region !== "england") return false;
  const on = isISODate(inp.letterOn) ? inp.letterOn : today;
  return on >= REFORM_FROM;
}

/** The discount (%) for a household from the number of adults who count. */
export function discountFor(countable: number, allStudents: boolean): number {
  if (countable <= 0) return allStudents ? 100 : 50;
  if (countable === 1) return 25;
  return 0;
}

const BILLED: Record<Exclude<CtOnBill, "" | "unsure">, number> = { none: 0, "25": 25, "50": 50, exempt: 100 };

export function ladderOf(read: Pick<CtRead, "balance" | "newRules">): CtRung[] {
  return [
    {
      id: "bill",
      label: "The bill",
      cost: "Monthly instalments",
      detail: "Ten a year unless you ask for twelve, which you can do at any time.",
    },
    {
      id: "reminder",
      label: "A reminder",
      cost: "Nothing added",
      detail: read.newRules
        ? "Pay the missed instalment and carry on; a final notice can't come for at least 14 days."
        : "Seven days to pay the missed instalment and keep paying monthly.",
    },
    {
      id: "final",
      label: "Instalments lost",
      cost: read.balance !== null ? `${money(read.balance)} due at once` : "The rest of the year due at once",
      detail: read.newRules
        ? "After a final notice and 21 days, the rest of the year's bill is due in one go."
        : "The rest of the year's bill is due in one go, and a summons can follow about a week later.",
    },
    {
      id: "summons",
      label: "A court summons",
      cost: "Costs added, often £70 to £100",
      detail: "Set by your council. Paying everything, costs included, before the hearing stops the order.",
    },
    {
      id: "order",
      label: "A liability order",
      cost: "Deductions or bailiffs",
      detail: "The council can take it from your pay or benefits, or pass it to bailiffs.",
    },
    {
      id: "bailiff",
      label: "Bailiffs",
      cost: `+${money(BAILIFF_COMPLIANCE)}, then +${money(BAILIFF_VISIT)}`,
      detail: "£79 when the notice is sent, £247 more if one visits.",
    },
  ];
}

const HERE: Record<CtStatus, number> = {
  elsewhere: -1,
  check: 0,
  missed: 1,
  reminder: 1,
  final: 2,
  summons: 3,
  order: 4,
  bailiff: 5,
};

export function readCt(inp: CtInputs, today = todayISO()): CtRead | null {
  if (!ctReady(inp)) return null;
  const elsewhere = inp.region === "scot" || inp.region === "ni";
  const status: CtStatus = elsewhere ? "elsewhere" : inp.stage === "bill" ? "check" : (inp.stage as CtStatus);
  const newRules = newRulesFor(inp, today);
  const yearly = amount(inp.annual);
  const paidRaw = parseMoney(inp.paid);
  const paid = paidRaw !== null && paidRaw >= 0 && inp.paid.trim() !== "" ? paidRaw : null;
  const instalmentCount = inp.instalments === "12" ? 12 : 10;
  const instalment = yearly !== null ? Math.round((yearly / instalmentCount) * 100) / 100 : null;
  const balance = yearly !== null && paid !== null ? Math.max(0, Math.round((yearly - paid) * 100) / 100) : null;

  let actBy = "";
  let wholeDueOn = "";
  let finalNoSooner = "";
  if (status === "reminder" && isISODate(inp.letterOn)) {
    actBy = addDaysISO(inp.letterOn, REMINDER_DAYS);
    if (newRules) finalNoSooner = addDaysISO(inp.letterOn, NEW_MIN_AFTER_REMINDER);
    else wholeDueOn = addDaysISO(inp.letterOn, REMINDER_DAYS * 2);
  } else if (status === "final" && isISODate(inp.letterOn)) {
    actBy = addDaysISO(inp.letterOn, newRules ? NEW_FINAL_DAYS : FINAL_DAYS);
  } else if (status === "summons" && isISODate(inp.hearingOn)) {
    actBy = inp.hearingOn;
  }

  // The household check.
  const adults = whole(inp.adults);
  const out = whole(inp.notCounted);
  const countable = adults !== null ? Math.max(0, adults - Math.min(out ?? 0, adults)) : null;
  // Four means "four or more": nobody gets a discount there unless at least three don't count.
  const expectedPct =
    countable !== null && !elsewhere ? discountFor(countable, inp.allStudents === "yes") : null;
  const billedPct = inp.onBill && inp.onBill !== "unsure" ? BILLED[inp.onBill] : null;
  const discountGap = expectedPct !== null && expectedPct > (billedPct ?? 0) && inp.onBill !== "";
  const bandReduction = !elsewhere && inp.disabled === "yes";

  let fairYearly: number | null = null;
  let saving: number | null = null;
  if (yearly !== null && billedPct !== null && billedPct < 100 && (discountGap || bandReduction)) {
    const gross = yearly / (1 - billedPct / 100);
    const factor = bandReduction ? bandReductionFactor(inp.band) : 1;
    if (factor !== null) {
      const pct = discountGap && expectedPct !== null ? expectedPct : billedPct;
      // Whole pounds: the inputs are rarely exact, so pence would be false precision.
      fairYearly = Math.round(gross * factor * (1 - pct / 100));
      saving = Math.round(yearly - fairYearly);
      if (saving <= 0) {
        fairYearly = null;
        saving = null;
      }
    }
  }

  const ladder = ladderOf({ balance, newRules });
  return {
    status,
    newRules,
    yearly,
    paid,
    instalmentCount,
    instalment,
    balance,
    actBy,
    wholeDueOn,
    finalNoSooner,
    actPassed: Boolean(actBy) && actBy < today,
    hearingPassed: status === "summons" && Boolean(actBy) && actBy <= today,
    countable,
    expectedPct,
    billedPct,
    discountGap,
    bandReduction,
    fairYearly,
    saving,
    ladder,
    here: HERE[status],
  };
}

function councilName(inp: CtInputs): string {
  return inp.council.trim() || "the council";
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pctWords(p: number): string {
  return p === 100 ? "a full exemption" : p === 50 ? "a 50% discount" : `a ${p}% discount`;
}

export function ctHeadline(inp: CtInputs, read: CtRead): string {
  const c = councilName(inp);
  const bal = read.balance !== null ? money(read.balance) : "the rest of the year's bill";
  switch (read.status) {
    case "elsewhere":
      return inp.region === "scot"
        ? "Scotland has its own steps: after the final reminder, a summary warrant adds 10%. Get free advice now."
        : "Northern Ireland has rates, not council tax, collected by Land & Property Services. Ring them before anything else.";
    case "check":
      if (read.saving !== null)
        return `The bill looks about ${money(read.saving)} a year too high for who lives there. Ask for it to be put right, and backdated.`;
      if (read.discountGap && read.expectedPct !== null)
        return `The bill may be missing ${pctWords(read.expectedPct)}. Ask ${c} to check, and to backdate it.`;
      if (read.bandReduction) return "Ask for a disabled band reduction: the bill would drop to the band below.";
      if (inp.lowIncome === "yes") return "Claim Council Tax Reduction. It's separate from any discount, and many people who could get it don't.";
      return "The bill looks right for who lives there. If the months are tight, ask to pay over twelve instead of ten.";
    case "missed":
      return read.instalment !== null
        ? `Pay the missed ${money(read.instalment)} now, before the reminder comes, or ring ${c} this week.`
        : `Pay the missed instalment now, before the reminder comes, or ring ${c} this week.`;
    case "reminder":
      if (read.actPassed)
        return read.newRules
          ? `Pay what you missed now, or ring ${c} today: a final notice can come from ${actDate(read.finalNoSooner)}.`
          : `The seven days have passed. Ring ${c} today and ask to keep paying monthly, before ${bal} is demanded at once.`;
      return read.instalment !== null
        ? `Pay the missed ${money(read.instalment)} by ${actDate(read.actBy)} and you keep paying monthly.${read.balance !== null && !read.newRules ? ` Miss it and ${bal} is due at once.` : ""}`
        : `Pay the missed instalment by ${actDate(read.actBy)} and you keep paying monthly.`;
    case "final":
      if (inp.canPay === "all")
        return read.actPassed
          ? `Pay ${bal} now, before ${c} asks the court for a summons and costs are added.`
          : `Pay ${bal} by ${actDate(read.actBy)} and it ends here, with nothing added.`;
      return read.actPassed
        ? `${cap(bal)} is due. Ask ${c} today to put you back on instalments, before a summons adds costs.`
        : `${cap(bal)} is due by ${actDate(read.actBy)}. Ask ${c} now to put you back on instalments; most will, if you ask before the summons.`;
    case "summons":
      if (read.hearingPassed)
        return `The hearing date has passed, so a liability order was probably made. Agree a plan with ${c} now, before it goes to bailiffs.`;
      return inp.canPay === "all"
        ? `Pay everything, costs included, before ${actDate(read.actBy)} and there's no liability order.`
        : `The hearing is on ${actDate(read.actBy)}. Agree a plan with ${c} before then, in writing.`;
    case "order":
      return `${cap(c)} can now take it from your pay or benefits, or send bailiffs. Ask for deductions: they add nothing to the bill.`;
    case "bailiff":
      return "It's with bailiffs now. The fees step up when one visits, so act before the first visit.";
  }
}

/** The discount and reduction paragraph: who doesn't count, and what's missing. */
export function householdLines(inp: CtInputs, read: CtRead): string[] {
  if (read.status === "elsewhere") return [];
  const out: string[] = [];
  const c = councilName(inp);
  if (read.countable !== null && read.expectedPct !== null) {
    const who =
      read.countable === 0
        ? "nobody living there counts"
        : read.countable === 1
          ? "only one adult living there counts"
          : `${read.countable} adults count`;
    if (read.discountGap) {
      const was = read.billedPct === null ? "" : read.billedPct === 0 ? " The bill shows no discount." : ` The bill shows ${read.billedPct}%.`;
      out.push(
        `On what you've said, ${who}, which gives ${pctWords(read.expectedPct)}.${was}${read.saving !== null && !read.bandReduction ? ` That's about ${money(read.saving)} a year.` : ""} Write to ${c} with who lives there and since when, and ask for it from the date it first applied. Councils routinely backdate a discount you were always entitled to.`,
      );
    } else if (inp.onBill === "unsure") {
      out.push(
        `On what you've said, ${who}, which gives ${read.expectedPct ? pctWords(read.expectedPct) : "no discount"}. The bill will say what's been applied; if it doesn't match, write to ${c}.`,
      );
    } else if (read.expectedPct === 0) {
      out.push(
        "With two or more adults who count, there's no discount for the household, but check the list: a full-time student, an apprentice, an 18- or 19-year-old still at school or college, a live-in carer or someone with a severe mental impairment doesn't count.",
      );
    }
    if (read.countable === 0 && inp.adults === "1" && inp.allStudents !== "yes")
      out.push(
        "If the only person living there has a severe mental impairment (dementia, a severe learning disability, the effects of a stroke, for example) and gets a qualifying benefit, the home is exempt altogether, not just 50% off.",
      );
  }
  if (read.bandReduction) {
    const f = bandReductionFactor(inp.band);
    out.push(
      `A room (other than a bathroom, kitchen or toilet), an extra bathroom or kitchen, or enough space for a wheelchair indoors, needed by a disabled person who lives there, means the bill is charged at the band below${inp.band === "A" ? "; in band A, a sixth comes off" : ""}.${f !== null ? ` That's about ${Math.round((1 - f) * 100)}% off.` : ""}${read.saving !== null ? ` With everything here, the year's bill would be about ${money(read.fairYearly ?? 0)}: ${money(read.saving)} less.` : ""} Ask ${c} for the disabled band reduction form.`,
    );
  }
  if (inp.lowIncome === "yes")
    out.push(
      `On a low income or benefits, claim Council Tax Reduction from ${c} as well. It's means-tested, separate from any discount, and each council runs its own scheme for working-age people, so the amount varies; pension-age schemes are national. Claim straight away and ask for it to be backdated, because many councils only go back a short way. If you're behind, ask ${c} to hold recovery while it's assessed.`,
    );
  return out;
}

export function ctBody(inp: CtInputs, read: CtRead): string {
  const c = councilName(inp);
  const parts: string[] = [];
  const bal = read.balance !== null ? money(read.balance) : "the rest of the year's bill";

  switch (read.status) {
    case "elsewhere":
      return inp.region === "scot"
        ? "In Scotland, a missed council tax payment brings a reminder, then a final reminder. If it still isn't paid, the council gets a summary warrant from the sheriff court without a hearing, which adds a 10% surcharge, and sheriff officers can then arrest wages or a bank account or attach goods. Before that point, ask the council to let you keep paying by instalments and claim Council Tax Reduction if your income is low. Citizens Advice Scotland, Money Advice Scotland and National Debtline give free advice, and can tell you about the Debt Arrangement Scheme or a moratorium."
        : "Northern Ireland has domestic rates instead of council tax, billed by Land & Property Services (or included in the rent for many tenants). Ring LPS as soon as you miss a payment and ask for an arrangement; you may also be able to get Rate Relief or Housing Benefit for rates. If it reaches a court summons, LPS can get a decree enforced by the Enforcement of Judgments Office. Advice NI gives free debt advice.";
    case "check":
      parts.push(
        "Nothing's overdue, so this is the cheapest time to check the bill. It's worked out from what the council knows about who lives there, and it assumes everyone counts unless someone tells them otherwise.",
      );
      break;
    case "missed":
      parts.push(
        `A missed instalment brings a reminder, usually a week or two later. Paying before it arrives, or as soon as it does, keeps everything as it was. If you can't pay it, ring or write to ${c} now and ask to spread the rest of the year over the months that are left, or over twelve months if you're paying ten. Councils agree to this far more readily before a reminder has gone unpaid than after.`,
      );
      break;
    case "reminder":
      if (read.newRules)
        parts.push(
          `Under the rules in England from April 2027, a reminder must come before a final notice, and the final notice can't come sooner than 14 days after it (${actDate(read.finalNoSooner)}) or 41 days after the first missed payment, whichever is later. After the final notice you have 21 days to bring the account up to date before the instalments go.`,
        );
      else
        parts.push(
          read.actPassed
            ? `A reminder gives seven days to pay the missed instalment. That passed on ${actDate(read.actBy)}, so the instalments may already have gone and ${bal} may be due${read.wholeDueOn ? ` from ${actDate(read.wholeDueOn)}` : ""}. Many councils will still put you back on instalments if you ask now and pay what you've missed; ask before a summons is issued, because that adds costs.`
            : `A reminder gives seven days to pay the missed instalment: by ${actDate(read.actBy)}. Pay it and the instalments carry on as before. If not, you lose the right to pay monthly, and ${bal} becomes due in one go${read.wholeDueOn ? `, on most councils' wording from ${actDate(read.wholeDueOn)}` : ""}. That's the cliff: one missed payment turns into the whole year.`,
        );
      if (!read.newRules)
        parts.push(
          "If this is the second reminder this year, a third missed payment loses the instalments without another warning.",
        );
      if (!read.actPassed && inp.canPay !== "all")
        parts.push(
          `If you can't pay the missed amount, ring or write to ${c} before the date and ask for the rest of the year to be spread over the months left, or over twelve months.`,
        );
      break;
    case "final":
      parts.push(
        read.newRules
          ? `A final notice under the April 2027 rules gives 21 days, to ${actDate(read.actBy)}, to bring the account up to date. After that the instalments go and ${bal} is due in one go.`
          : `A final notice means the right to pay monthly has gone and ${bal} is due now. Usually after about seven days (${actDate(read.actBy)}) ${c} can ask the magistrates' court for a summons, and costs are added the day it's issued.`,
      );
      if (inp.canPay !== "all")
        parts.push(
          `Ask ${c} to put you back on instalments. You've no right to it now, but councils often agree, especially if you pay the instalments you missed and set up a direct debit. If even that's too much, offer what you can afford, with a budget, and claim Council Tax Reduction if your income is low.`,
        );
      break;
    case "summons":
      if (read.hearingPassed)
        parts.push(
          `If nothing was paid or agreed before the hearing on ${actDate(read.actBy)}, the court will almost certainly have made a liability order, adding the council's costs. The council doesn't have to tell you straight away. Ring ${c} and ask: if there is an order, choose how it's paid before it chooses for you.`,
        );
      else
        parts.push(
          `A summons means ${c} will ask the magistrates for a liability order on ${actDate(read.actBy)}, and its summons costs are already on the account. Paying everything, costs included, before the hearing means no order. Otherwise, the useful thing is to agree a plan with ${c} before the hearing: it will usually still get the order, but agree not to use it while you keep to the plan.`,
          "You can go to the hearing, but the court can only refuse the order on narrow grounds: you aren't the person liable, it's already paid, the bill or notices weren't properly sent, or the tax fell due more than six years before the summons. Not being able to pay isn't one of them, and the court can't set instalments; only the council can.",
        );
      break;
    case "order":
      parts.push(
        `A liability order lets ${c} take the money without going back to court. It can ask your employer to take a fixed share of your pay (an attachment of earnings), ask the DWP to take a small fixed amount from Universal Credit, Pension Credit or other benefits, pass it to bailiffs, or, for larger amounts, put a charge on a home you own or start bankruptcy.${inp.region === "england" ? " Prison for not paying exists in England but is rare: only for wilful refusal or culpable neglect, after a means inquiry." : " In Wales, prison for council tax was abolished in 2019."}`,
        `Deductions from pay or benefits add nothing to the debt; bailiffs add ${money(BAILIFF_COMPLIANCE)} when the notice is sent and ${money(BAILIFF_VISIT)} more if one visits. So if you're working or on benefits, write and ask for deductions, and offer an amount. If ${c} asks for details of your job or benefits, reply within 14 days: not replying can mean a fine.`,
      );
      break;
    case "bailiff":
      parts.push(
        `A notice of enforcement means ${c} has passed the debt to a bailiff firm and ${money(BAILIFF_COMPLIANCE)} has been added. Since 1 May 2026 a bailiff can't take goods until 14 clear days after the notice. The bailiff tool dates that, checks the fees and writes the offer to send before the visit. If you're vulnerable, ask ${c} to take the case back.`,
      );
      break;
  }

  if (read.status !== "check" && read.status !== "bailiff") {
    if (inp.canPay === "none")
      parts.push(
        "If you can't pay anything right now, call a free debt adviser today. Council tax is a priority debt, ahead of cards and loans, and in England and Wales an adviser can apply for Breathing Space, which pauses enforcement for 60 days.",
      );
    if (inp.region === "england" && !read.newRules && (read.status === "missed" || read.status === "reminder" || read.status === "final"))
      parts.push(
        "From April 2027 the rules in England get gentler (a compulsory final notice, at least 41 days after the first missed payment, then 21 days to catch up), but they don't apply to letters before then.",
      );
  }
  return parts.join(" ");
}

export type CtLetter = { id: string; title: string; note: string; text: string };

function sign(): string[] {
  return ["", "Yours faithfully,", "[Your name]", "[Your address]", "[Council tax account number]"];
}

export function ctLetters(inp: CtInputs, read: CtRead): CtLetter[] {
  if (read.status === "elsewhere" || read.status === "bailiff") return [];
  const out: CtLetter[] = [];
  const c = councilName(inp);
  const greet = "Dear Council Tax team,";
  const what = inp.what.trim();
  const ref = `Account number: [number]${what ? `, ${what}` : ""}.`;

  // The plan letter, for any stage past the bill.
  if (read.status !== "check") {
    const lines: string[] = [greet, "", ref, ""];
    if (read.status === "missed" || read.status === "reminder") {
      lines.push(
        `I missed the instalment due on [date]${read.instalment !== null ? ` (${money(read.instalment)})` : ""}${read.status === "reminder" ? `, and I've received your reminder dated ${letterDate(inp.letterOn)}` : ""}.`,
        "",
      );
      if (inp.canPay === "all")
        lines.push("I'm paying it today, and the remaining instalments will be paid on time. Please confirm my instalments carry on as before.");
      else if (inp.canPay === "plan")
        lines.push(
          "I can't pay it all at once. Please let me keep paying by instalments, with the missed amount spread over the rest of the year, or over twelve monthly instalments if that's possible. I can pay £[amount] a month from [date].",
        );
      else
        lines.push(
          "I can't pay at the moment. I'm getting free debt advice and will write again with an offer. Please let me keep paying by instalments, and hold any recovery action for 30 days while I do.",
        );
    } else if (read.status === "final") {
      lines.push(`I've received your final notice dated ${letterDate(inp.letterOn)}.`, "");
      if (inp.canPay === "all")
        lines.push("Please confirm the exact amount needed to clear this year's account, and that no further action will be taken once it's paid.");
      else if (inp.canPay === "plan")
        lines.push(
          "I can't pay the full balance at once. Please reinstate my instalments. I'll pay the instalments I missed by [date] and set up a direct debit for the rest; if that isn't possible, I can afford £[amount] a month, starting [date]. My budget is attached.",
          "",
          "Please don't apply for a summons while you consider this.",
        );
      else
        lines.push(
          "I can't pay at the moment. I'm getting free debt advice and will write again with an offer. Please hold recovery action, and don't apply for a summons, for 30 days while I do.",
        );
    } else if (read.status === "summons") {
      lines.push(
        read.hearingPassed
          ? `I received a summons for a hearing on ${letterDate(inp.hearingOn)}. Please tell me whether a liability order was made, and the total now owed, including costs.`
          : `I've received a summons for a hearing on ${letterDate(inp.hearingOn)}.`,
        "",
      );
      if (inp.canPay === "all")
        lines.push("Please confirm the exact amount, including costs, that I need to pay before the hearing so that no liability order is applied for.");
      else if (inp.canPay === "plan")
        lines.push(
          `I can't pay the full amount at once. I can afford £[amount] a month, starting [date]; my budget is attached. Please accept this arrangement and confirm in writing that ${read.hearingPassed ? "no further action" : "if a liability order is made, no further action"} will be taken while I keep to it.`,
        );
      else
        lines.push("I can't pay at the moment. I'm getting free debt advice and will write again with an offer. Please hold any further action for 30 days while I do.");
    } else if (read.status === "order") {
      lines.push("I understand a liability order has been made for this account.", "");
      if (inp.canPay === "all") lines.push("Please confirm the full amount now owed, including costs, so I can pay it.");
      else if (inp.canPay === "plan")
        lines.push(
          "I can pay £[amount] a month, starting [date]; my budget is attached. If you'd rather, I agree to deductions from my [Universal Credit / other benefit] or an attachment of earnings with my employer, [name]. Please don't pass the account to enforcement agents, which would add fees I can't afford.",
        );
      else
        lines.push(
          "I can't pay at the moment. I'm getting free debt advice and will write again with an offer. Please don't pass the account to enforcement agents while I do; if I'm on benefits, I'd accept deductions from them instead.",
        );
    }
    if (inp.lowIncome === "yes")
      lines.push("", "I'm on a low income, and I'm also applying for Council Tax Reduction. Please hold recovery action while it's assessed.");
    if (read.discountGap) lines.push("", "I also think the bill is missing a discount I'm entitled to; I'm writing separately about that.");
    lines.push(...sign());
    out.push({
      id: "plan",
      title:
        inp.canPay === "all"
          ? "Confirm the amount, then pay"
          : inp.canPay === "plan"
            ? read.status === "order"
              ? "Ask for deductions, not bailiffs"
              : read.status === "final"
                ? "Ask to go back on instalments"
                : "Offer a plan you can keep"
            : "Ask for time while you get advice",
      note: `Email it to ${c} (the address is on the bill) or use its online form, and keep a copy. Fill in the square brackets; work the amount out from a budget, and a free adviser will help.`,
      text: lines.join("\n"),
    });
  }

  // The discount letter.
  if (read.discountGap || read.bandReduction || (read.countable !== null && read.countable < 2 && inp.onBill === "unsure")) {
    const lines: string[] = [greet, "", ref, ""];
    if (read.discountGap || inp.onBill === "unsure") {
      lines.push(
        `The adults living at this address are: [names, with the date each moved in]. Of these, [name] doesn't count for council tax because [they're a full-time student at ..., an apprentice, a live-in carer for ..., 18 or 19 and still at school or college, or have a severe mental impairment and receive ...].`,
        "",
        read.expectedPct === 100
          ? "I think the property is exempt. Please apply the exemption from [date], refund or credit anything overpaid, and send me a revised bill."
          : `That means ${read.countable === 0 ? "no adult counts" : "only one adult counts"}, so I think the bill should have ${read.expectedPct === 50 ? "a 50% discount" : "a 25% discount"}. Please apply it from [date it first applied], credit or refund anything overpaid, and send me a revised bill. I enclose [a student certificate / other evidence].`,
      );
    }
    if (read.bandReduction) {
      if (lines.length > 4) lines.push("");
      lines.push(
        "A disabled person who lives here, [name], needs [a room used mainly by them / an extra bathroom or kitchen / space to use a wheelchair indoors]. Please send me the form for a disabled band reduction, and apply it from [date] once it's approved.",
      );
    }
    lines.push(...sign());
    out.push({
      id: "discount",
      title: "Ask for the discount, backdated",
      note: `Send it to ${c} with the evidence, keep a copy, and ask for a reply in writing. If it says no, ask it to look again; if it still says no, or doesn't answer within two months, you can appeal to the Valuation Tribunal (within two months of its reply, or four months of your letter).`,
      text: lines.join("\n"),
    });
  }
  return out;
}

export function ctRule(): string {
  return "When a council tax reminder comes, I deal with it inside the seven days, by paying the missed instalment or writing to the council that week, because after that the whole year falls due. Once a year, when the bill comes, I check it counts only the people it should.";
}

/** Calendar reminders for the current letter. */
export function ctReminders(read: CtRead, today: string): { on: string; title: string; body: string }[] {
  const out: { on: string; title: string; body: string }[] = [];
  if (read.status === "reminder" && read.actBy >= today)
    out.push({
      on: read.actBy,
      title: "Last day to pay the missed council tax instalment",
      body: "Pay it, or make sure the council has your letter, or the rest of the year can fall due at once.",
    });
  if (read.status === "final" && read.actBy >= today)
    out.push({
      on: read.actBy,
      title: "Council tax final notice runs out",
      body: "After today the council can ask the court for a summons, which adds costs.",
    });
  if (read.status === "summons" && !read.hearingPassed) {
    const before = addDaysISO(read.actBy, -3);
    if (before >= today)
      out.push({
        on: before,
        title: "Agree a council tax plan before the hearing",
        body: "Make sure the council has your offer in writing, and its reply, before the hearing.",
      });
    out.push({
      on: read.actBy,
      title: "Council tax hearing at the magistrates' court",
      body: "The council asks for a liability order today.",
    });
  }
  return out;
}

export function ctSummary(inp: CtInputs, read: CtRead): string {
  const lines: string[] = [];
  lines.push(`Council tax${inp.what.trim() ? `: ${inp.what.trim()}` : ""}${inp.council.trim() ? ` (${inp.council.trim()})` : ""}`);
  lines.push("", ctHeadline(inp, read), "", ctBody(inp, read));
  const hh = householdLines(inp, read);
  if (hh.length) lines.push("", "The bill:", ...hh.map((l) => `- ${l}`));
  if (read.status !== "elsewhere") {
    lines.push("", "The steps:");
    read.ladder.forEach((r, i) => lines.push(`${i === read.here ? "> " : "- "}${r.label}: ${r.cost}`));
  }
  for (const l of ctLetters(inp, read)) lines.push("", `${l.title}:`, "", l.text);
  if (read.status !== "elsewhere") lines.push("", ctRule());
  return lines.join("\n");
}

const REGIONS: CtRegion[] = ["england", "wales", "scot", "ni"];
const STAGES: CtStage[] = ["bill", "missed", "reminder", "final", "summons", "order", "bailiff"];
const BANDS: CtBand[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "unsure"];
const ON_BILL: CtOnBill[] = ["none", "25", "50", "exempt", "unsure"];
const YN: YesNo[] = ["yes", "no"];
const PAYS: CtCanPay[] = ["all", "plan", "none"];
const INST: CtInstalments[] = ["10", "12"];
const COUNTS = ["0", "1", "2", "3", "4"];

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
export function parseCtInputs(raw: unknown): CtInputs {
  if (!raw || typeof raw !== "object") return BLANK_CT;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what),
    council: str(v.council),
    region: oneOf(v.region, REGIONS),
    stage: oneOf(v.stage, STAGES),
    letterOn: date(v.letterOn),
    hearingOn: date(v.hearingOn),
    annual: str(v.annual, 40),
    paid: str(v.paid, 40),
    instalments: oneOf(v.instalments, INST),
    band: oneOf(v.band, BANDS),
    adults: oneOf(v.adults, COUNTS.slice(1)),
    notCounted: oneOf(v.notCounted, COUNTS),
    allStudents: oneOf(v.allStudents, YN),
    onBill: oneOf(v.onBill, ON_BILL),
    disabled: oneOf(v.disabled, YN),
    lowIncome: oneOf(v.lowIncome, YN),
    canPay: oneOf(v.canPay, PAYS),
  };
}

/**
 * The worked example: a £1,960 bill over ten months, six paid, this month's
 * missed, a reminder dated three days ago. Two adults live there, and one is a
 * full-time student, but the bill shows no discount.
 */
export function ctExample(today = todayISO()): CtInputs {
  return {
    what: "this year's council tax",
    council: "",
    region: "england",
    stage: "reminder",
    letterOn: addDaysISO(today, -3),
    hearingOn: "",
    annual: "£1,960",
    paid: "£1,176",
    instalments: "10",
    band: "C",
    adults: "2",
    notCounted: "1",
    allStudents: "",
    onBill: "none",
    disabled: "no",
    lowIncome: "no",
    canPay: "plan",
  };
}
