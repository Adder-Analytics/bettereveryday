/**
 * The read behind "Someone Has Died: What's Due, and When?" (/bereavement).
 *
 * The first weeks after a death bring a pile of tasks, and the lists handed to
 * the bereaved are usually sorted by agency (the registrar, the DWP, the bank,
 * the council) or by the order they come up. Neither tells you the thing you
 * most need to know: which of these costs money if it waits, and which can
 * wait as long as you need. This read sorts by cost of delay. Most of the pile
 * has none (probate has no deadline; nobody needs a decision about the house
 * this month), and a few have a steep one that nobody rings to remind you
 * about. The sharpest is Bereavement Support Payment: claim within three months
 * of the death and you get all of it (up to £9,800); each month later loses a
 * monthly payment, and after a year the lump sum goes.
 *
 * Mainly England and Wales, with Scotland and Northern Ireland's differences
 * where the timings change. Figures from search summaries of Citizens Advice,
 * Turn2us, Marie Curie, Age UK, council pages, HMRC guidance summaries and law
 * firms' notes, since gov.uk and legislation.gov.uk don't resolve from where
 * this was written. Kept only what agreed across sources:
 *
 *   - Registering: within five days in England, Wales and Northern Ireland,
 *     eight in Scotland. A coroner's inquiry or the medical paperwork can hold
 *     it up; the register office says when.
 *   - Tell Us Once (England, Wales, Scotland): offered at registration; the
 *     reference lasts 28 days. It tells HMRC, the DWP, DVLA, the Passport
 *     Office and the council. It doesn't tell banks, utilities, insurers,
 *     private pensions, landlords or phone companies.
 *   - Bereavement Support Payment (deaths from 6 April 2017): for a spouse or
 *     civil partner, or (since February 2023) a cohabiting partner who gets
 *     Child Benefit, under State Pension age at the death, where the person
 *     who died paid National Insurance for 25 weeks or died from an industrial
 *     accident or disease. Higher rate (pregnant or getting Child Benefit):
 *     £3,500 plus 18 monthly payments of £350, £9,800 in all. Standard rate:
 *     £2,500 plus 18 of £100, £4,300. Frozen since 2017; still the 2026/27
 *     rates. Claim within three months for all of it; a later claim is
 *     backdated three months, so each month after loses one monthly payment.
 *     After 12 months, no lump sum; after 21, usually nothing. Not taxed, and
 *     it doesn't reduce means-tested benefits.
 *   - Funeral Expenses Payment (England, Wales; NI has its own): for the
 *     person responsible for the funeral who gets a qualifying benefit
 *     (Universal Credit, Pension Credit, income-based JSA or ESA, Income
 *     Support, Housing Benefit, some tax credits). Burial or cremation fees
 *     plus up to £1,000 for other costs (£120 if there was a funeral plan).
 *     Claim within six months of the funeral. Taken back from the estate if
 *     there's money in it. Scotland: Funeral Support Payment, also six months.
 *   - Banks will usually pay a funeral director's invoice straight from the
 *     account of the person who died, before probate.
 *   - Inheritance tax: none on what goes to a spouse or civil partner, or
 *     below the £325,000 threshold (plus up to £175,000 for a home left to
 *     children or grandchildren, and a partner's unused allowances). Where
 *     there is some, it's due by the end of the sixth month after the month
 *     of the death; interest runs after that. From 6 April 2027, most unused
 *     pensions count towards the estate.
 *   - Probate (confirmation in Scotland): no deadline. Usually needed when the
 *     person owned a home in their sole name, or held more than a bank's
 *     threshold. No fee for estates of £5,000 or less; the fee rose in 2026.
 *   - Council tax: a home left empty after the liable person's death is
 *     usually exempt (Class F in England and Wales) until probate, and for up
 *     to six months after while it stays empty. A survivor now living alone
 *     gets 25% off from the day after the death.
 *   - Pensions: a lump sum from someone who died before 75 is usually tax-free
 *     if paid within two years of the scheme hearing of the death.
 *   - Debts: they're paid from the estate, not by relatives, unless a debt
 *     was joint or someone guaranteed it. If the estate runs out, the rest is
 *     written off. An executor who pays out before the debts are known can be
 *     personally liable; a Deceased Estates notice in The Gazette, and two
 *     months' wait, protects them.
 *   - A cohabiting partner inherits nothing without a will (except what was
 *     owned as joint tenants, and nominated pensions). A claim under the
 *     Inheritance (Provision for Family and Dependants) Act 1975 has to be made
 *     within six months of the grant.
 *   - A deed of variation, within two years of the death, can redirect an
 *     inheritance as if the will had said so.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type BvRegion = "" | "ew" | "scot" | "ni";
export type BvRole = "" | "spouse" | "cohab" | "family" | "executor";
export type YesNo = "" | "yes" | "no";
export type YesNoUnsure = "" | "yes" | "no" | "unsure";
export type BvHome = "" | "sole" | "joint" | "rented" | "other";
export type BvEstate = "" | "small" | "under" | "over" | "unsure";

export type BvInputs = {
  /** Their first name or how you'd like them named in letters; optional. */
  name: string;
  region: BvRegion;
  diedOn: string;
  coroner: YesNoUnsure;
  registered: YesNo;
  registeredOn: string;
  role: BvRole;
  /** Did you live with them? */
  livedWith: YesNo;
  /** Did they live alone (so the home is now empty)? Asked when you didn't live with them. */
  livedAlone: YesNo;
  /** Were you under State Pension age when they died? Spouse or partner only. */
  underSpa: YesNo;
  /** Do you get Child Benefit, or are you pregnant? Spouse or partner only. */
  children: YesNo;
  /** Are you (or whoever's arranging the funeral) on a qualifying benefit? */
  benefits: YesNo;
  funeralOn: string;
  home: BvHome;
  estate: BvEstate;
  /** Is everything going to a spouse or civil partner? */
  toSpouse: YesNoUnsure;
  /** Did they have a workplace or private pension? */
  pension: YesNoUnsure;
};

export const BLANK_BV: BvInputs = {
  name: "",
  region: "",
  diedOn: "",
  coroner: "",
  registered: "",
  registeredOn: "",
  role: "",
  livedWith: "",
  livedAlone: "",
  underSpa: "",
  children: "",
  benefits: "",
  funeralOn: "",
  home: "",
  estate: "",
  toSpouse: "",
  pension: "",
};

/** Bereavement Support Payment, 2026/27 (unchanged since 2017). */
export const BSP = {
  higher: { lump: 3500, monthly: 350 },
  standard: { lump: 2500, monthly: 100 },
  months: 18,
};

export const FEP_OTHER = 1000;
export const IHT_THRESHOLD = 325000;
export const PENSION_IHT_FROM = "2027-04-06";

/**
 * How much a late claim costs, which is why the items are sorted by it.
 * "money": waiting past the date loses money or adds a charge.
 * "duty": a legal step with a date, but missing it by a little costs nothing.
 * "none": no deadline that bites; do it when you can.
 */
export type BvCost = "money" | "duty" | "none";

export type BvItem = {
  id: string;
  title: string;
  /** The date that matters, if there is one. */
  on: string;
  /** "by" a deadline, or "from" when something becomes possible or starts. */
  onKind: "by" | "around" | "";
  cost: BvCost;
  /** What's at stake, in money where it can be. */
  stake: string;
  detail: string;
  done?: boolean;
};

export type BspRate = "higher" | "standard";

export type BspRead = {
  rate: BspRate;
  full: number;
  /** What a claim made today would bring. */
  now: number;
  /** The date by which a claim gets all of it. */
  fullBy: string;
  lumpBy: string;
  lastBy: string;
  monthsLost: number;
  lumpLost: boolean;
};

export type BvRead = {
  region: Exclude<BvRegion, "">;
  diedOn: string;
  /** Whole days since the death. */
  days: number;
  items: BvItem[];
  bsp: BspRead | null;
  /** Why BSP doesn't apply, when the person might have expected it to. */
  bspNo: string;
  emptyHome: boolean;
  ihtMaybe: boolean;
};

const CUR = "£";

export function money(n: number): string {
  return `${CUR}${Math.round(n).toLocaleString("en-GB")}`;
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** The last day of the sixth month after the month of the death. */
export function ihtDue(diedOn: string): string {
  const [y, m] = diedOn.split("-").map(Number);
  const last = new Date(y, m - 1 + 7, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${last.getFullYear()}-${p(last.getMonth() + 1)}-${p(last.getDate())}`;
}

/** Whole months (rounded up) from `fromISO` to `toISO`; 0 if not after. */
function monthsAfter(fromISO: string, toISO: string): number {
  if (toISO <= fromISO) return 0;
  let n = 0;
  while (addMonthsISO(fromISO, n) < toISO && n < 60) n++;
  return n;
}

export function isPartner(inp: BvInputs): boolean {
  return inp.role === "spouse" || inp.role === "cohab";
}

/**
 * Bereavement Support Payment, if it could apply. Returns the money and
 * dates, or null with a reason.
 */
export function readBsp(inp: BvInputs, today: string): { bsp: BspRead | null; no: string } {
  if (!isPartner(inp)) return { bsp: null, no: "" };
  if (inp.diedOn < "2017-04-06") return { bsp: null, no: "" };
  if (inp.underSpa === "no")
    return {
      bsp: null,
      no: "Bereavement Support Payment is only for someone under State Pension age when their partner died. You may be able to inherit part of their State Pension instead: ask the Pension Service.",
    };
  if (inp.role === "cohab" && inp.children === "no")
    return {
      bsp: null,
      no: "Bereavement Support Payment covers an unmarried partner only if they get Child Benefit (or were pregnant). Without children, it isn't payable, which is worth knowing before you spend time on the form.",
    };
  if (inp.underSpa !== "yes" || !inp.children) return { bsp: null, no: "" };
  const rate: BspRate = inp.children === "yes" ? "higher" : "standard";
  const r = BSP[rate];
  const full = r.lump + r.monthly * BSP.months;
  const fullBy = addMonthsISO(inp.diedOn, 3);
  const lumpBy = addMonthsISO(inp.diedOn, 12);
  const lastBy = addMonthsISO(inp.diedOn, 21);
  const monthsLost = Math.min(BSP.months, monthsAfter(fullBy, today));
  const lumpLost = today > lumpBy;
  const now = (lumpLost ? 0 : r.lump) + r.monthly * (BSP.months - monthsLost);
  return { bsp: { rate, full, now, fullBy, lumpBy, lastBy, monthsLost, lumpLost }, no: "" };
}

export function canRead(inp: BvInputs): boolean {
  return inp.region !== "" && isISODate(inp.diedOn) && inp.role !== "";
}

export function readBv(inp: BvInputs, today = todayISO()): BvRead | null {
  if (!canRead(inp)) return null;
  if (inp.diedOn > today) return null;
  const region = inp.region as Exclude<BvRegion, "">;
  const scot = region === "scot";
  const ni = region === "ni";
  const items: BvItem[] = [];
  const name = inp.name.trim() || "them";

  // ---- Register the death ----
  const regDays = scot ? 8 : 5;
  const registered = inp.registered === "yes";
  items.push({
    id: "register",
    title: "Register the death",
    on: registered ? (isISODate(inp.registeredOn) ? inp.registeredOn : "") : inp.coroner === "yes" ? "" : addDaysISO(inp.diedOn, regDays),
    onKind: registered ? "" : inp.coroner === "yes" ? "" : "around",
    cost: "duty",
    stake: registered ? "Done" : "Needed for the funeral and every account",
    detail: registered
      ? "Done. Order several certified copies of the death certificate if you haven't: banks and insurers each want one, and copies bought later cost more."
      : inp.coroner === "yes"
        ? `With a coroner involved, the ${regDays} days wait for them. The coroner's office tells the register office when you can register, and can give an interim certificate if the inquest will take a while.`
        : `${scot ? "In Scotland, within eight days" : "Within five days"}, at any register office (the one where they died is quickest). If the doctor's paperwork is held up, the days wait for it: the register office will tell you. Buy several certified copies of the certificate while you're there.`,
    done: registered,
  });

  // ---- Tell Us Once ----
  if (!ni) {
    const from = registered && isISODate(inp.registeredOn) ? inp.registeredOn : addDaysISO(inp.diedOn, regDays);
    items.push({
      id: "tellusonce",
      title: "Tell Us Once",
      on: addDaysISO(from, 28),
      onKind: registered && isISODate(inp.registeredOn) ? "by" : "around",
      cost: "duty",
      stake: "Stops pension and benefit overpayments that get taken back later",
      detail:
        "The registrar gives you a reference that lasts 28 days. One phone call or online form tells HMRC, the DWP (State Pension and benefits), DVLA, the Passport Office and the council. It doesn't tell banks, energy, water, phone, insurers, private pensions or a landlord: those are yours, and they can all wait a week or two.",
    });
  }

  // ---- The empty home ----
  const emptyHome = inp.livedWith === "no" && inp.livedAlone === "yes" && (inp.home === "sole" || inp.home === "rented" || inp.home === "joint");
  if (emptyHome) {
    items.push({
      id: "insurance",
      title: "Tell the home insurer the house is empty",
      on: addDaysISO(inp.diedOn, 30),
      onKind: "around",
      cost: "money",
      stake: "An uninsured house, if there's a leak or a break-in",
      detail:
        "Most home policies cut back or stop cover once a home has been empty for 30 or 60 days. Ring the insurer, say the owner has died and the house is empty, and ask what they need (often weekly visits, the water off, the heating on low in winter). Take valuables and documents somewhere safe, and redirect the post.",
    });
  }

  // ---- Bereavement Support Payment ----
  const { bsp, no: bspNo } = readBsp(inp, today);
  if (bsp) {
    const r = BSP[bsp.rate];
    const past21 = today > bsp.lastBy;
    items.push({
      id: "bsp",
      title: "Claim Bereavement Support Payment",
      on: bsp.monthsLost === 0 ? bsp.fullBy : past21 ? bsp.lastBy : bsp.lumpLost ? bsp.lastBy : bsp.lumpBy,
      onKind: "by",
      cost: "money",
      stake:
        bsp.monthsLost === 0
          ? `${money(bsp.full)} in all; each month after ${letterDate(bsp.fullBy)} loses ${money(r.monthly)}`
          : past21
            ? "Usually too late now, but ask"
            : `${money(bsp.now)} if you claim now (it was ${money(bsp.full)})`,
      detail:
        bsp.monthsLost === 0
          ? `A ${money(r.lump)} lump sum and ${BSP.months} monthly payments of ${money(r.monthly)}, for losing your ${inp.role === "spouse" ? "husband, wife or civil partner" : "partner"}. It isn't taxed and doesn't reduce other benefits. Claim by phone on 0800 151 2012 (the Bereavement Service; they may offer it during the Tell Us Once call) or on form BSP1. ${name === "them" ? "They" : name} must have paid National Insurance for at least 25 weeks, or died because of an accident at work or an industrial disease.`
          : past21
            ? "More than 21 months on, it usually can't be paid. If the cause of death was only confirmed later, or you were told the wrong thing by the DWP, ring the Bereavement Service on 0800 151 2012 and ask anyway."
            : `A claim now is backdated three months, so ${bsp.monthsLost} of the ${BSP.months} monthly payments ${bsp.monthsLost === 1 ? "has" : "have"} gone${bsp.lumpLost ? ", and so has the lump sum (it's only paid within 12 months)" : `. The ${money(r.lump)} lump sum is still payable until ${letterDate(bsp.lumpBy)}`}. Every month you wait from here loses another ${money(r.monthly)}. Ring 0800 151 2012 today.`,
    });
  }

  // ---- Funeral help ----
  if (inp.benefits === "yes") {
    const on = isISODate(inp.funeralOn) ? addMonthsISO(inp.funeralOn, 6) : "";
    items.push({
      id: "funeral",
      title: scot ? "Claim Funeral Support Payment" : "Claim a Funeral Expenses Payment",
      on,
      onKind: on ? "by" : "",
      cost: "money",
      stake: scot ? "Burial or cremation costs, plus a set amount for the rest" : `Burial or cremation fees, plus up to ${money(FEP_OTHER)} for the rest`,
      detail: `${scot ? "From Social Security Scotland" : ni ? "From the Department for Communities" : "From the DWP"}, for whoever is responsible for the funeral and gets a qualifying benefit (Universal Credit, Pension Credit, income-based JSA or ESA, Income Support, Housing Benefit or some tax credits). Claim within six months of the funeral${on ? `, so by ${letterDate(on)}` : ""}; you can claim before it, with the funeral director's estimate. It's paid back from the estate if there's money in it. Agree a price with the funeral director before you sign: they have to publish a standard price list, so you can compare.`,
    });
  }

  // ---- Inheritance tax ----
  const ihtMaybe = (inp.estate === "over" || inp.estate === "unsure") && inp.toSpouse !== "yes";
  if (ihtMaybe) {
    const due = ihtDue(inp.diedOn);
    const pensionsIn = inp.diedOn >= PENSION_IHT_FROM;
    items.push({
      id: "iht",
      title: "Pay any inheritance tax",
      on: due,
      onKind: "by",
      cost: "money",
      stake: "Interest on the tax from the day after",
      detail: `Only if the estate is over the threshold: ${money(IHT_THRESHOLD)}, plus up to £175,000 more when a home goes to children or grandchildren, and more again if a husband, wife or civil partner died first and didn't use theirs. Anything left to a spouse or civil partner is tax-free. Where some is due, it's due by the end of the sixth month after the month of the death, and interest runs after that, even if probate isn't done. Banks can pay it straight from the accounts of the person who died.${pensionsIn ? " For deaths from 6 April 2027, most unused pension money counts towards the estate, so ask each pension scheme for its value early." : ""} Most estates owe nothing, but the executor still has to check.`,
    });
  }

  // ---- Pension lump sum ----
  if (inp.pension === "yes" || inp.pension === "unsure") {
    items.push({
      id: "pension",
      title: "Tell each pension scheme",
      on: addMonthsISO(inp.diedOn, 24),
      onKind: "by",
      cost: "money",
      stake: "Income tax on a lump sum paid after two years",
      detail:
        "Workplace and private pensions aren't told by Tell Us Once. Write to each one (old payslips, P60s and bank statements show which). Many pay a lump sum or a pension to whoever was named, outside the will. If they died before 75, a lump sum is usually tax-free when it's paid within two years of the scheme hearing of the death. The Pension Tracing Service finds schemes nobody knew about.",
    });
  }

  // ---- Council tax ----
  const liveAloneNow = inp.livedWith === "yes";
  if ((emptyHome || liveAloneNow) && ni) {
    items.push({
      id: "rates",
      title: "Tell Land & Property Services about the rates",
      on: "",
      onKind: "",
      cost: "money",
      stake: "Rates billed for a home nobody can use yet",
      detail:
        "Northern Ireland has rates, not council tax, billed by Land & Property Services. Tell them about the death, and ask what's due on the home while the estate is dealt with and whether any relief applies. If you lived with them and your income has dropped, ask about Rate Relief and Housing Benefit for rates.",
    });
  } else if (emptyHome || liveAloneNow) {
    items.push({
      id: "counciltax",
      title: "Tell the council about council tax",
      on: "",
      onKind: "",
      cost: "money",
      stake: emptyHome ? "A bill for an empty home that should be exempt" : "25% off, if you now live alone",
      detail: emptyHome
        ? `Tell Us Once tells the council about the death, but write to the council tax team too. A home left empty after the death of the person who paid is usually exempt${scot ? "" : " (Class F)"} until probate is granted, and for up to six months after while it stays empty. Nobody should be paying council tax on it in the meantime. Once someone moves in or it's sold, it ends.`
        : "If you're now the only adult in the home, you get a 25% single person discount from the day after the death. It isn't automatic: ask for it. If the bill was in their name only, it moves to yours; the council should restart the instalments rather than ask for the year at once.",
    });
  }

  // ---- A rented home ----
  if (inp.home === "rented" && emptyHome) {
    items.push({
      id: "tenancy",
      title: "Tell the landlord in writing",
      on: "",
      onKind: "",
      cost: "money",
      stake: "Rent keeps running from the estate until the tenancy ends",
      detail: region === "ew"
        ? "A tenancy doesn't end when the tenant dies. It passes to the estate (or to a partner or family member who lived there and can take it on), and rent keeps running until it's ended with notice. In England, since May 2026, a tenant's notice is usually two months; after a death, many landlords will agree to less if asked. Ask for the deposit back once the keys are returned."
        : "A tenancy doesn't end when the tenant dies, and rent can keep running until it's ended with notice. Write to the landlord, say when the home will be cleared, and ask whether they'll agree to end it early and return the deposit.",
    });
  }

  // ---- Deed of variation ----
  if (inp.role === "spouse" || inp.role === "family") {
    items.push({
      id: "variation",
      title: "If you'd rather pass some on: a deed of variation",
      on: addMonthsISO(inp.diedOn, 24),
      onKind: "by",
      cost: "none",
      stake: "Only matters if you want it",
      detail:
        "If you inherit something you'd like to go to someone else (often a parent passing it to children), a deed of variation signed within two years of the death treats it as if the will had said so, for inheritance tax and capital gains tax. Not urgent, and nothing to do if you don't want it.",
    });
  }

  // ---- Probate ----
  const probateLikely = inp.home === "sole" || inp.estate === "over";
  items.push({
    id: "probate",
    title: scot ? "Confirmation (Scotland's probate)" : "Probate",
    on: "",
    onKind: "",
    cost: "none",
    stake: "It waits until you're ready",
    detail: inp.estate === "small" && inp.home !== "sole"
      ? `With an estate of £5,000 or less and no home in their sole name, you probably won't need it: banks release small balances on a death certificate and a form.${scot ? "" : " If you do need it, there's no fee for an estate this small."}`
      : `${probateLikely ? "Likely needed: a home in their sole name, or balances over a bank's limit (often £5,000 to £50,000), can't be released without it." : "Needed if they owned a home in their sole name or held more than a bank's limit. Things owned jointly pass to the other owner without it."} There is no deadline, and it can wait until the funeral is past and you have the paperwork together. The executor named in the will applies; if there's no will, the closest relative does. ${inp.estate === "over" || inp.estate === "unsure" ? "Any inheritance tax is usually paid, or at least reported, before the grant." : ""}`.trim(),
  });

  // Sort: dated items by date, then undated; done items first so the list reads as a timeline.
  items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? -1 : 1;
    if (a.on && b.on) return a.on < b.on ? -1 : a.on > b.on ? 1 : 0;
    if (a.on) return -1;
    if (b.on) return 1;
    const order: BvCost[] = ["money", "duty", "none"];
    return order.indexOf(a.cost) - order.indexOf(b.cost);
  });

  return { region, diedOn: inp.diedOn, days: daysBetween(inp.diedOn, today), items, bsp, bspNo, emptyHome, ihtMaybe };
}

/** Items still ahead whose date costs money. */
export function moneyAhead(read: BvRead, today: string): BvItem[] {
  return read.items.filter((i) => i.cost === "money" && !i.done && (!i.on || i.on >= today));
}

export function bvHeadline(inp: BvInputs, read: BvRead, today: string): string {
  const reg = read.items.find((i) => i.id === "register");
  if (reg && !reg.done && reg.on && reg.on >= today && read.days <= 8)
    return `Register the death by about ${actDate(reg.on)}. Almost everything else can wait until after the funeral.`;
  if (read.bsp && read.bsp.monthsLost === 0 && today <= read.bsp.fullBy)
    return `Claim Bereavement Support Payment by ${actDate(read.bsp.fullBy)} and you get all ${money(read.bsp.full)}.`;
  if (read.bsp && read.bsp.now > 0 && today <= read.bsp.lastBy)
    return `Claim Bereavement Support Payment today: it's worth ${money(read.bsp.now)} now, and less each month.`;
  const dated = moneyAhead(read, today).filter((i) => i.on);
  if (dated.length) {
    const first = dated[0];
    return `The next date that costs money if missed: ${first.title.toLowerCase()}, by ${actDate(first.on)}.`;
  }
  const undated = moneyAhead(read, today);
  if (undated.length) return `Nothing here has a deadline this week. Of what saves money, start with this: ${undated[0].title.charAt(0).toLowerCase()}${undated[0].title.slice(1)}.`;
  return "Nothing here costs money if it waits. Take the time you need.";
}

export function bvBody(inp: BvInputs, read: BvRead, today: string): string {
  const ahead = moneyAhead(read, today);
  const waits = read.items.filter((i) => i.cost === "none").length;
  const parts: string[] = [];
  const open = read.items.filter((i) => !i.done).length;
  parts.push(
    ahead.length === 0
      ? `None of the ${open} things below costs money now if it waits.`
      : `Of the ${open} things still to do below, ${ahead.length === 1 ? "one costs" : `${ahead.length} cost`} money if ${ahead.length === 1 ? "it waits" : "they wait"}, and ${ahead.length === 1 ? "it's" : "they're"} marked.${waits ? ` ${waits === 1 ? "One has" : `${waits} have`} no deadline at all.` : ""}`,
  );
  if (read.bspNo) parts.push(read.bspNo);
  if (isPartner(inp) && read.bsp === null && !read.bspNo && (inp.underSpa === "" || inp.children === ""))
    parts.push("Answer the two questions about your age and Child Benefit to see whether Bereavement Support Payment applies: it's often the biggest sum here, and the one with the shortest window.");
  if (inp.role === "cohab")
    parts.push(
      "One hard fact for unmarried partners: without a will, a partner inherits nothing by law, however long you were together, except what you owned as joint tenants and any pension that names you. If that leaves you short, a claim under the Inheritance (Provision for Family and Dependants) Act 1975 has to be made within six months of the grant of probate. Talk to a solicitor early.",
    );
  return parts.join(" ");
}

/** What can wait: said plainly, because permission is part of the help. */
export function canWait(inp: BvInputs, read: BvRead): string[] {
  const out = [
    "Clearing the home and sorting belongings. There's no rush unless it's rented, and even then the landlord can usually be asked for time.",
    `${read.region === "scot" ? "Confirmation" : "Probate"}. No deadline. Many people start it a month or two after the funeral.`,
    "Their final tax return. HMRC writes to the executor; it's often months later.",
    "Closing email, social media and subscriptions. Cancel the ones that cost money; the rest can stay as they are.",
  ];
  if (inp.home === "sole" || inp.home === "joint") out.push("Any decision about the house. Nobody has to decide whether to sell, keep or move for months.");
  return out;
}

/** Their debts: who does and doesn't pay. */
export function debtLines(inp: BvInputs): string[] {
  const exec = inp.role === "executor" || inp.role === "family";
  const out = [
    "You don't inherit their debts. Cards, loans, overdrafts and bills are paid from what they left, and if that runs out, the rest is written off. Nobody in the family has to pay from their own money.",
    "The exceptions: a joint account or joint loan (you owe all of it), a debt you guaranteed, and a joint mortgage. Bills for a home you lived in together may move to you from the date of death, but not before.",
    "Don't pay a creditor from your own money to make them go away, and don't sign anything saying you'll pay. A firm that says otherwise is wrong; the letter below says so.",
  ];
  if (exec)
    out.push(
      "If you're the executor, don't pay anyone out of the estate, or hand out inheritances, until you know what's owed: an executor who pays out first can end up paying a debt themselves. Putting a Deceased Estates notice in The Gazette and waiting two months protects you.",
    );
  return out;
}

export type BvLetter = { id: string; title: string; note: string; text: string };

function sig(): string {
  return "Yours faithfully,\n\n[Your name]\n[Your address]\n[Phone or email]";
}

export function bvLetters(inp: BvInputs, read: BvRead): BvLetter[] {
  const n = inp.name.trim() || "[their full name]";
  const died = letterDate(read.diedOn);
  const as =
    inp.role === "executor" ? "the executor" : inp.role === "spouse" || inp.role === "cohab" ? "their partner" : "the relative dealing with their affairs";
  const rel =
    inp.role === "spouse"
      ? "their husband, wife or civil partner [delete as needed]"
      : inp.role === "cohab"
        ? "their partner"
        : inp.role === "executor"
          ? "the executor of their estate"
          : "their [son, daughter, relative] and am dealing with their affairs";
  const out: BvLetter[] = [];
  out.push({
    id: "notify",
    title: "To a bank, utility or company: telling them of the death",
    note: "Send one to each account. A copy of the death certificate usually goes with it (a certified copy, not a photocopy, for banks). The Death Notification Service can tell many banks at once.",
    text: `Dear Sir or Madam,

Account or reference: [number]
Name on the account: ${n}

I'm writing to tell you that ${n}, of [their address], died on ${died}. I'm ${rel}.

Please:
- note the death on your records and stop any marketing;
- stop any direct debits or standing orders from, or charges to, this account, except [any you want kept running];
- send me a statement of the balance on the date of death, and of anything paid in or out since;
- tell me what you need to close the account, or transfer it, and whether you need a grant of probate;
- write to me at the address below from now on.

${inp.role === "cohab" || inp.role === "spouse" ? "If this account was in our joint names, please confirm how it will be dealt with." : `I am not personally liable for any debt ${n} owed. Please deal with me only as the person handling the estate, and don't contact other members of the family about it.`}

${sig()}`,
  });
  out.push({
    id: "creditor",
    title: "To a firm chasing you for their debt",
    note: "For a creditor or collector asking you, or anyone in the family, to pay what the person who died owed. Not for a joint debt or one you guaranteed: those are yours.",
    text: `Dear Sir or Madam,

Account or reference: [number]
Name on the account: ${n}

You have asked me to pay a debt owed by ${n}, who died on ${died}.

I was not a joint account holder and did not guarantee this debt, so I am not liable for it. Any debt ${n} owed is a claim on their estate, and will be dealt with by the person administering it, in the proper order, once the estate is known. If there isn't enough in the estate, it is not paid by family members.

Please send any claim, with a statement of the balance on the date of death, to the executor or administrator${inp.role === "executor" ? " (me)" : ""} at the address below, and do not contact me or other members of the family to ask for payment. Asking relatives to pay a debt they don't owe is contrary to the FCA's rules on treating customers fairly, and I will complain to the Financial Ombudsman if it continues.

${sig()}`,
  });
  if (read.items.some((i) => i.id === "counciltax")) {
    out.push({
      id: "counciltax",
      title: read.emptyHome ? "To the council: council tax on the empty home" : "To the council: the single person discount",
      note: read.emptyHome
        ? "Even if Tell Us Once has told the council, this asks for the exemption by name and gives them the executor's address."
        : "Send it once the death is registered. Ask for the change from the day after the death.",
      text: read.emptyHome
        ? `Dear Council Tax team,

Property: [address]
Council tax account: [number]

${n}, who was liable for council tax at this property, died on ${died}. They lived there alone, and the property has been empty since.

Please apply the exemption for a property left unoccupied after the death of the liable person${read.region === "scot" ? "" : " (Class F)"} from ${died}, and send a revised bill. Probate has not yet been granted. I'll tell you when it is, and when anyone moves in or the property is sold.

Please write to me, as ${as}, at the address below.

${sig()}`
        : `Dear Council Tax team,

Property: [address]
Council tax account: [number]

${n} died on ${died}. I continue to live at this property and I'm now the only adult living here.

Please apply the 25% single person discount from ${letterDate(addDaysISO(read.diedOn, 1))}, move the account into my name if it isn't already, and send a revised bill with instalments for the rest of the year.

${sig()}`,
    });
  }
  if (read.items.some((i) => i.id === "tenancy")) {
    out.push({
      id: "tenancy",
      title: "To the landlord: ending the tenancy",
      note: "The person dealing with the estate can send this. Ask for less notice if you'll be out sooner; many landlords agree after a death.",
      text: `Dear [landlord or agent],

Property: [address]

I'm sorry to tell you that your tenant, ${n}, died on ${died}. I'm ${rel}.

I'd like to end the tenancy. I expect to have the property cleared by [date]. Please confirm whether you'll accept the tenancy ending on that date, or tell me the earliest date you will accept, and what rent will be due until then. Any rent will be paid from the estate.

Please also let me know how the deposit will be returned, and arrange a check-out once the keys are back.

${sig()}`,
    });
  }
  return out;
}

export type BvReminder = { on: string; title: string; body: string };

/** Calendar entries for dated items still ahead, with a week's warning set by the client. */
export function bvReminders(read: BvRead, today: string): BvReminder[] {
  return read.items
    .filter((i) => i.on && !i.done && i.on >= today && i.cost !== "none")
    .map((i) => ({ on: i.on, title: i.title, body: `${i.stake}. ${i.detail}` }));
}

export function bvRule(): string {
  return "When someone dies, I sort what has to be done by what waiting would cost, not by who wrote first. I do the few with a money deadline this month, and give myself permission to leave the rest.";
}

export function bvSummary(inp: BvInputs, read: BvRead, today: string): string {
  const lines = [bvHeadline(inp, read, today), "", bvBody(inp, read, today), ""];
  for (const i of read.items) {
    const when = i.done ? "done" : i.on ? `${i.onKind === "around" ? "about " : "by "}${letterDate(i.on)}` : "no fixed date";
    lines.push(`- ${i.title} (${when}). ${i.stake}.`);
  }
  lines.push("", "Can wait:");
  for (const w of canWait(inp, read)) lines.push(`- ${w}`);
  lines.push("", bvRule(), "", "From https://bettereveryday.vercel.app/bereavement. Not legal advice.");
  return lines.join("\n");
}

/** The worked example: a husband, two children, a few weeks on. */
export function bvExample(today: string): BvInputs {
  return {
    ...BLANK_BV,
    name: "David",
    region: "ew",
    diedOn: addDaysISO(today, -40),
    coroner: "no",
    registered: "yes",
    registeredOn: addDaysISO(today, -36),
    role: "spouse",
    livedWith: "yes",
    underSpa: "yes",
    children: "yes",
    benefits: "no",
    home: "joint",
    estate: "under",
    toSpouse: "yes",
    pension: "yes",
  };
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function iso(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

export function parseBvInputs(raw: unknown): BvInputs {
  if (!raw || typeof raw !== "object") return BLANK_BV;
  const r = raw as Record<string, unknown>;
  const yn = ["", "yes", "no"] as const;
  const ynu = ["", "yes", "no", "unsure"] as const;
  return {
    name: typeof r.name === "string" ? r.name.slice(0, 80) : "",
    region: pick(r.region, ["", "ew", "scot", "ni"] as const, ""),
    diedOn: iso(r.diedOn),
    coroner: pick(r.coroner, ynu, ""),
    registered: pick(r.registered, yn, ""),
    registeredOn: iso(r.registeredOn),
    role: pick(r.role, ["", "spouse", "cohab", "family", "executor"] as const, ""),
    livedWith: pick(r.livedWith, yn, ""),
    livedAlone: pick(r.livedAlone, yn, ""),
    underSpa: pick(r.underSpa, yn, ""),
    children: pick(r.children, yn, ""),
    benefits: pick(r.benefits, yn, ""),
    funeralOn: iso(r.funeralOn),
    home: pick(r.home, ["", "sole", "joint", "rented", "other"] as const, ""),
    estate: pick(r.estate, ["", "small", "under", "over", "unsure"] as const, ""),
    toSpouse: pick(r.toSpouse, ynu, ""),
    pension: pick(r.pension, ynu, ""),
  };
}
