/**
 * The read behind "No Will Yet: Who Would Get What, and What Would You
 * Change?" (/will).
 *
 * Everyone already has a will. If you don't write one, the intestacy rules
 * are yours: a default Parliament wrote in 1925 (amended since) for a married
 * couple with children of their own. It fits that family well enough. It
 * doesn't fit an unmarried partner (who gets nothing), a stepchild (nothing),
 * children from an earlier relationship (often nothing, if the estate is
 * under the spouse's fixed sum), a friend or carer (nothing), or anyone with
 * children under 18 (no guardian chosen, everything handed over at 18).
 *
 * So the tool doesn't start with "do you want a will?". It starts with your
 * family and what you own, and shows who the default gives it to, in pounds,
 * alongside what passes outside a will anyway (a jointly owned home, life
 * insurance in trust, a pension's death benefits). Then it lists the gaps
 * and drafts the notes for whoever writes it.
 *
 * Rules (England and Wales), as far as the sources I could reach agree
 * (gov.uk and legislation.gov.uk were DNS-blocked from the sandbox; see
 * docs/2026-11-26-session-notes.md):
 *
 *   - Administration of Estates Act 1925 s46, as amended by the Inheritance
 *     and Trustees' Powers Act 2014. Spouse or civil partner with issue:
 *     personal chattels, a statutory legacy of £322,000 (deaths from 26 July
 *     2023; the Fixed Net Sum Order 2023, confirmed by several 2026 sources),
 *     and half the rest; the other half to the issue on statutory trusts.
 *     Spouse without issue: everything. The spouse must survive by 28 days.
 *     No spouse: issue, then parents, then brothers and sisters of the whole
 *     blood (or their issue), then the half blood, grandparents, uncles and
 *     aunts of the whole blood, then the half blood, then the Crown.
 *   - Issue take per stirpes: a child who died first is replaced by their
 *     own children. Adopted children count; stepchildren don't. Statutory
 *     trusts vest at 18.
 *   - An unmarried partner gets nothing, but may claim under the Inheritance
 *     (Provision for Family and Dependants) Act 1975 (living together as a
 *     couple for the two years before the death, or being maintained),
 *     normally within six months of the grant.
 *   - Joint tenancy passes by survivorship; a tenant-in-common share goes by
 *     the will or intestacy. A life policy written in trust is outside the
 *     estate; one that isn't is inside. Pension death benefits are usually
 *     discretionary, guided by a nomination.
 *   - Wills Act 1837: in writing, signed in the presence of two witnesses
 *     present at the same time, who sign in your presence; a witness or
 *     their spouse loses any gift (s15). Marriage or a civil partnership
 *     revokes an earlier will unless made in expectation of it (s18); a
 *     divorce or dissolution treats the ex as having died (s18A).
 *   - Inheritance tax: nil-rate band £325,000, residence nil-rate band
 *     £175,000 when a home goes to direct descendants (tapered above £2m),
 *     spouse exemption, 40%. From 6 April 2027 most unused pension funds
 *     count (Finance Act 2026), which the tool mentions but doesn't price.
 *   - Reform: the Law Commission's 2025 wills report and the Ministry of
 *     Justice consultation "A fairer end to relationships" (June to August
 *     2026, including intestacy rights for cohabitants) are proposals, not
 *     law. The tool says so and doesn't plan around them.
 *   - Will Aid (November): suggested donation £120 for a single basic will,
 *     £200 for a pair of mirror wills (willaid.org.uk via search). Free Wills
 *     Month (March and October, 55 and over) is from memory.
 *   - Scotland and Northern Ireland have different rules (prior and legal
 *     rights in Scotland; a different statutory legacy and shares in
 *     Northern Ireland). The tool explains them in words and doesn't put
 *     pounds on them, because I couldn't verify the current figures.
 *
 * Not advice. Pure data and functions, no React.
 */

import { formatMoney } from "./worth";
import { addDaysISO, isISODate, letterDate, todayISO } from "./refund";

export { isISODate, letterDate, todayISO };

export type YesNo = "" | "yes" | "no";
export type Where = "" | "ew" | "scotland" | "ni";
export type Rel = "" | "married" | "separated" | "cohabiting" | "single";
export type Together = "" | "under2" | "2to5" | "5plus";
export type Kin = "" | "parents" | "siblings" | "halfsiblings" | "grandparents" | "aunts" | "halfaunts" | "none";
export type Home = "" | "none" | "sole" | "joint" | "common" | "unsure";
export type Insurance = "" | "none" | "trust" | "estate" | "unsure";
export type Pension = "" | "none" | "nominated" | "not" | "unsure";
export type Existing = "" | "none" | "current" | "beforeMarriage" | "beforeDivorce" | "old";
export type Want = "partner" | "guardians" | "stepchild" | "gift" | "protect" | "age";

export type WillInputs = {
  where: Where;
  rel: Rel;
  /** How long an unmarried couple have lived together. */
  together: Together;
  /** Living children, including adopted children. A whole number as text. */
  children: string;
  /** Children who died before you, leaving children of their own. */
  lines: string;
  /** Any child (or grandchild in a line) under 18. */
  under18: YesNo;
  /** Children from an earlier relationship (matters when married). */
  earlier: YesNo;
  /** A stepchild, or a partner's child, you think of as yours. */
  step: YesNo;
  /** The nearest living relative, when there's no partner and no children. */
  kin: Kin;
  home: Home;
  homeValue: string;
  mortgage: string;
  /** Savings, investments, a car, valuables: everything else you own. */
  savings: string;
  /** Debts other than the mortgage. */
  debts: string;
  insurance: Insurance;
  insuranceAmount: string;
  pension: Pension;
  existing: Existing;
  wants: Want[];
  /** Partner's name, for the messages only. */
  partnerName: string;
};

export const BLANK_WILL: WillInputs = {
  where: "",
  rel: "",
  together: "",
  children: "",
  lines: "",
  under18: "",
  earlier: "",
  step: "",
  kin: "",
  home: "",
  homeValue: "",
  mortgage: "",
  savings: "",
  debts: "",
  insurance: "",
  insuranceAmount: "",
  pension: "",
  existing: "",
  wants: [],
  partnerName: "",
};

export const STATUTORY_LEGACY = 322000;
export const NRB = 325000;
export const RNRB = 175000;
export const RNRB_TAPER = 2000000;
export const IHT_RATE = 0.4;
export const WILL_AID_SINGLE = 120;
export const WILL_AID_MIRROR = 200;

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

function num(s: string): number {
  const n = Number(String(s).replace(/[£,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function whole(s: string, max: number): number {
  const n = Math.floor(num(s));
  return Math.min(n, max);
}

/** Who the default gives the estate to, in plain words. */
export type Verdict =
  | "cohab"
  | "spouse-all"
  | "spouse-split"
  | "separated"
  | "children"
  | "kin"
  | "crown"
  | "scotland"
  | "ni";

export type Share = { who: string; amount: number; note: string };

export type WillRead = {
  today: string;
  inp: WillInputs;
  verdict: Verdict;
  /** E&W numbers are computed; Scotland and NI are explained in words. */
  computed: boolean;
  /** Is there a valid will doing the work already? */
  hasWill: boolean;
  /** An old will that marriage cancelled. */
  revoked: boolean;
  partner: string;
  children: number;
  lines: number;
  stirpes: number;
  /** Net estate that passes by will or intestacy. */
  estate: number;
  homeEquity: number;
  /** Your share of the home that's in the estate. */
  homeInEstate: number;
  /** Your share of the home that passes to the co-owner automatically. */
  homeOutside: number;
  insuranceOutside: number;
  /** Who gets what from the estate under the default. */
  shares: Share[];
  /** Total to children (all lines together). */
  toChildren: number;
  /** Each child's share. */
  perChild: number;
  toSpouse: number;
  /** What a partner (married or not) ends up with, in and out of the estate. */
  partnerTotal: number;
  /** A rough inheritance tax bill under the default, 0 if none. */
  iht: number;
  ihtBase: number;
  moneyKnown: boolean;
};

export function willReady(inp: WillInputs): boolean {
  if (!inp.where) return false;
  if (inp.where !== "ew") return Boolean(inp.rel);
  if (!inp.rel) return false;
  if (inp.rel === "cohabiting" && !inp.together) return false;
  if (inp.children === "") return false;
  const kids = whole(inp.children, 20) + whole(inp.lines, 10);
  if (kids === 0 && (inp.rel === "single" || inp.rel === "cohabiting") && !inp.kin) return false;
  if (!inp.home) return false;
  return true;
}

function partnerOf(inp: WillInputs): string {
  const n = inp.partnerName.trim();
  if (n) return n;
  if (inp.rel === "married") return "your husband, wife or civil partner";
  if (inp.rel === "separated") return "the husband, wife or civil partner you've separated from";
  if (inp.rel === "cohabiting") return "your partner";
  return "";
}

const KIN_LABEL: Record<Exclude<Kin, "" | "none">, string> = {
  parents: "Your parents",
  siblings: "Your brothers and sisters",
  halfsiblings: "Your half-brothers and half-sisters",
  grandparents: "Your grandparents",
  aunts: "Your aunts and uncles",
  halfaunts: "Your parents' half-brothers and half-sisters",
};

export function readWill(inp: WillInputs, today = todayISO()): WillRead | null {
  if (!willReady(inp)) return null;
  const partner = partnerOf(inp);
  const children = whole(inp.children, 20);
  const lines = whole(inp.lines, 10);
  const stirpes = children + lines;
  const spouse = inp.rel === "married" || inp.rel === "separated";
  const hasWill = inp.existing === "current" || inp.existing === "old" || inp.existing === "beforeDivorce";
  const revoked = inp.existing === "beforeMarriage" && spouse && inp.where !== "scotland";

  const homeEquity = inp.home === "none" ? 0 : Math.max(0, num(inp.homeValue) - num(inp.mortgage));
  let homeInEstate = 0;
  let homeOutside = 0;
  if (inp.home === "sole") homeInEstate = homeEquity;
  else if (inp.home === "joint" || inp.home === "unsure") homeOutside = homeEquity / 2;
  else if (inp.home === "common") homeInEstate = homeEquity / 2;

  const insAmount = num(inp.insuranceAmount);
  const insuranceInEstate = inp.insurance === "estate" || inp.insurance === "unsure" ? insAmount : 0;
  const insuranceOutside = inp.insurance === "trust" ? insAmount : 0;
  const estate = Math.max(0, num(inp.savings) - num(inp.debts) + homeInEstate + insuranceInEstate);
  const moneyKnown = num(inp.savings) + homeEquity + insAmount > 0;

  const base = {
    today,
    inp,
    hasWill,
    revoked,
    partner,
    children,
    lines,
    stirpes,
    estate,
    homeEquity,
    homeInEstate,
    homeOutside,
    insuranceOutside,
    moneyKnown,
  };

  if (inp.where === "scotland" || inp.where === "ni") {
    return {
      ...base,
      verdict: inp.where,
      computed: false,
      shares: [],
      toChildren: 0,
      perChild: 0,
      toSpouse: 0,
      partnerTotal: 0,
      iht: 0,
      ihtBase: 0,
    };
  }

  const shares: Share[] = [];
  let toSpouse = 0;
  let toChildren = 0;
  let verdict: Verdict;

  if (spouse && stirpes > 0) {
    // Chattels are part of "savings" here; the statutory legacy and half the
    // rest is the same arithmetic whichever bucket they sit in, as long as the
    // chattels are worth less than the estate. Good enough for a read.
    const over = Math.max(0, estate - STATUTORY_LEGACY);
    toSpouse = Math.min(estate, STATUTORY_LEGACY) + over / 2;
    toChildren = over / 2;
    verdict = inp.rel === "separated" ? "separated" : over > 0 ? "spouse-split" : "spouse-all";
  } else if (spouse) {
    toSpouse = estate;
    verdict = inp.rel === "separated" ? "separated" : "spouse-all";
  } else if (stirpes > 0) {
    toChildren = estate;
    verdict = inp.rel === "cohabiting" ? "cohab" : "children";
  } else if (inp.kin && inp.kin !== "none") {
    verdict = inp.rel === "cohabiting" ? "cohab" : "kin";
  } else {
    verdict = inp.rel === "cohabiting" ? "cohab" : "crown";
  }

  if (toSpouse > 0 || spouse) {
    shares.push({
      who: inp.partnerName.trim() || (inp.rel === "separated" ? "Your separated husband, wife or civil partner" : "Your husband, wife or civil partner"),
      amount: toSpouse,
      note:
        stirpes > 0
          ? toChildren > 0
            ? `Your belongings, the first ${money(STATUTORY_LEGACY)}, and half the rest`
            : `Everything: the estate is under the ${money(STATUTORY_LEGACY)} fixed sum`
          : "Everything, because you have no children",
    });
  }
  if (inp.rel === "cohabiting") {
    shares.push({ who: inp.partnerName.trim() || "Your partner", amount: 0, note: "Nothing: unmarried partners have no right to inherit" });
  }
  const perChild = stirpes > 0 ? toChildren / stirpes : 0;
  if (stirpes > 0) {
    if (children > 0) {
      shares.push({
        who: children === 1 ? "Your child" : `Your ${children} children`,
        amount: perChild * children,
        note:
          toChildren === 0
            ? "Nothing now. They may inherit later from your spouse, if your spouse's own will says so"
            : `${children > 1 ? `${money(perChild)} each, ` : ""}${inp.under18 === "yes" ? "held in trust until 18, then theirs outright" : "theirs outright"}`,
      });
    }
    if (lines > 0) {
      shares.push({
        who: lines === 1 ? "The children of a child who died" : `The children of ${lines} children who died`,
        amount: perChild * lines,
        note: "Each family shares their parent's part",
      });
    }
  }
  if (!spouse && stirpes === 0) {
    if (inp.kin && inp.kin !== "none") {
      shares.push({
        who: KIN_LABEL[inp.kin],
        amount: estate,
        note:
          inp.kin === "parents" || inp.kin === "grandparents"
            ? "Shared equally between those alive"
            : "Shared equally; if one died first, their children take their share",
      });
    } else {
      shares.push({ who: "The Crown", amount: estate, note: "Nobody qualifies, so it goes to the state (bona vacantia)" });
    }
  }
  if (inp.step === "yes") {
    shares.push({ who: "A stepchild", amount: 0, note: "Nothing, unless legally adopted" });
  }

  // Inheritance tax, roughly: what doesn't go to a spouse, plus a jointly
  // owned home passing to someone who isn't a spouse.
  const exempt = toSpouse;
  const homeOutsideTaxable = spouse ? 0 : homeOutside;
  const ihtBase = Math.max(0, estate - exempt) + homeOutsideTaxable;
  let rnrb = 0;
  if (toChildren > 0 && homeInEstate > 0) {
    const homeToKids = homeInEstate * (estate > 0 ? toChildren / estate : 0);
    rnrb = Math.min(RNRB, homeToKids);
    const gross = estate + homeOutside;
    if (gross > RNRB_TAPER) rnrb = Math.max(0, rnrb - (gross - RNRB_TAPER) / 2);
  }
  const iht = verdict === "crown" ? 0 : Math.max(0, ihtBase - NRB - rnrb) * IHT_RATE;

  const partnerTotal = spouse ? toSpouse + homeOutside : inp.rel === "cohabiting" ? homeOutside : 0;

  return {
    ...base,
    verdict,
    computed: true,
    shares,
    toChildren,
    perChild,
    toSpouse,
    partnerTotal,
    iht,
    ihtBase,
  };
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function kidsWord(read: WillRead): string {
  const n = read.stirpes;
  if (read.children === 0) return "your grandchildren";
  return n === 1 ? "your child" : read.children === 2 && read.lines === 0 ? "your two children" : "your children";
}

export function willHeadline(read: WillRead): string {
  const est = read.moneyKnown ? `your ${money(read.estate)} estate` : "your estate";
  const p = read.partner;
  if (read.hasWill && read.inp.existing === "current") return "Your will decides this. Check it still says what you'd want.";
  if (read.verdict === "scotland") return "In Scotland, the rules are different, and a will matters just as much.";
  if (read.verdict === "ni") return "In Northern Ireland, the rules are close to England's, with different sums.";
  const prefix = read.revoked ? "Your old will was cancelled when you married. " : "";
  switch (read.verdict) {
    case "cohab":
      if (read.stirpes > 0) return `${prefix}Without a will, ${p} would get nothing from ${est}. It would go to ${kidsWord(read)}${read.inp.under18 === "yes" ? ", held until they're 18" : ""}.`;
      if (read.inp.kin && read.inp.kin !== "none") return `${prefix}Without a will, ${p} would get nothing from ${est}. ${KIN_LABEL[read.inp.kin]} would.`;
      return `${prefix}Without a will, ${p} would get nothing from ${est}. The Crown would.`;
    case "spouse-all":
      if (read.stirpes > 0)
        return `${prefix}Without a will, ${cap(p)} would get everything, and ${kidsWord(read)} nothing now.`;
      return `${prefix}Without a will, ${p} would get everything. For many couples that's the plan.`;
    case "spouse-split":
      return `${prefix}Without a will, ${p} would get ${money(read.toSpouse)}, and ${kidsWord(read)} ${money(read.toChildren)}${read.inp.under18 === "yes" ? ", held until 18" : ""}.`;
    case "separated":
      return `${prefix}Without a will, ${p} would still inherit${read.moneyKnown ? `: ${money(read.toSpouse)}` : ""}.`;
    case "children":
      return `${prefix}Without a will, ${kidsWord(read)} would get everything${read.inp.under18 === "yes" ? ", at 18, with nobody you chose to bring them up" : ""}.`;
    case "kin":
      return `${prefix}Without a will, ${est} would go to ${read.inp.kin ? KIN_LABEL[read.inp.kin as Exclude<Kin, "" | "none">].toLowerCase() : "relatives"}, and nobody else.`;
    case "crown":
      return `${prefix}Without a will, ${est} would go to the Crown. Friends, partners and charities get nothing.`;
    default:
      return "";
  }
}

export function willBody(read: WillRead): string {
  const paras: string[] = [];
  const inp = read.inp;
  if (read.verdict === "scotland") {
    paras.push(
      "Scotland has its own law of succession. Without a will, a husband, wife or civil partner first takes \"prior rights\": the home (up to a set value), its furniture (up to a set value) and a cash sum. Then \"legal rights\" give a spouse and the children each a share of the savings and other moveable property. Only then does the rest go in a fixed order, starting with the children.",
    );
    paras.push(
      inp.rel === "cohabiting"
        ? "An unmarried partner inherits nothing automatically. They can ask the Court of Session or a sheriff court for a share, but only within six months of the death, and the court decides how much. With a will, you decide."
        : "Even with a will, children (and a spouse) can claim legal rights to part of the moveable estate, so a Scottish will can't completely cut out a child. Marriage doesn't cancel a Scottish will, but a new child can let it be challenged, so review it at each life change.",
    );
    paras.push(
      "In Scotland you can make a will from age 12. It's valid if you sign it, and it's best signed on every page in front of one witness, which makes it \"self-proving\". The amounts change from time to time, so the tool doesn't put pounds on them: mygov.scot and the Law Society of Scotland have the current figures.",
    );
    return paras.join("\n\n");
  }
  if (read.verdict === "ni") {
    paras.push(
      "Northern Ireland's rules follow the same pattern as England's, with different numbers. A husband, wife or civil partner takes the personal belongings and a fixed sum first. The rest is split: half to the spouse with one child, a third to the spouse with more than one. With no children, the spouse shares with parents or brothers and sisters above a higher fixed sum.",
    );
    paras.push(
      inp.rel === "cohabiting"
        ? "An unmarried partner inherits nothing automatically. They can apply to court for reasonable provision under the 1979 Order, which is slow, costly and uncertain. A will avoids that."
        : "Marriage cancels an earlier will in Northern Ireland, as it does in England.",
    );
    paras.push("Check the current fixed sums on nidirect before relying on any figure; the tool doesn't use them.");
    return paras.join("\n\n");
  }

  if (read.hasWill && inp.existing === "current") {
    paras.push(
      "A valid will overrides everything below. What follows is what would happen without it, which is worth knowing because a will can fail: if it wasn't witnessed properly, if you marry after signing it, or if the person it leaves everything to dies first with nobody named instead.",
    );
  }
  if (read.revoked) {
    paras.push(
      "In England and Wales, getting married or forming a civil partnership cancels any will you made before, unless the will said it was made in expectation of marrying that person. So you're treated as having no will. Everything below applies until you make a new one.",
    );
  }
  if (inp.existing === "beforeDivorce") {
    paras.push(
      "After a final divorce order, your ex is treated as if they'd died: anything your will left them, and their role as executor, fails. The rest of the will stands. If they were the main beneficiary and the will names nobody instead, part of the estate can fall under the rules below.",
    );
  }

  switch (read.verdict) {
    case "cohab":
      paras.push(
        `The law treats an unmarried partner as a stranger, however long you've lived together. ${read.homeOutside > 0 ? `${cap(read.partner)} would get your half of the home, because you own it as joint tenants and it passes automatically${read.moneyKnown ? ` (about ${money(read.homeOutside)} of equity)` : ""}. Everything else` : "Everything"} goes by the rules: ${read.stirpes > 0 ? `to ${kidsWord(read)}${inp.under18 === "yes" ? ", held in trust until 18 and then handed over outright" : ""}` : inp.kin && inp.kin !== "none" ? `to ${KIN_LABEL[inp.kin].toLowerCase()}` : "to the Crown"}.`,
      );
      if (inp.home === "common") {
        paras.push(
          `You own the home as tenants in common, so your share doesn't pass to ${read.partner}. It's in the estate${read.stirpes > 0 ? `, so ${kidsWord(read)} would own half the house ${read.partner} lives in` : ""}. This is the single most common way unmarried partners end up having to sell.`,
        );
      }
      paras.push(
        inp.together === "under2"
          ? `${cap(read.partner)}'s only route would be a court claim under the 1975 Act as someone you supported financially. It's slow, expensive and uncertain.`
          : `${cap(read.partner)} could claim through the courts under the 1975 Act, because you've lived together as a couple for two years or more. That means a claim against your own family, normally within six months, with lawyers' costs, and the court decides what's "reasonable maintenance". A will costing about a hundred pounds avoids all of it.`,
      );
      break;
    case "spouse-all":
      paras.push(
        read.stirpes > 0
          ? `${cap(read.partner)} takes your belongings and the first ${money(STATUTORY_LEGACY)}${read.moneyKnown ? `, which is all of ${money(read.estate)}` : ""}. ${cap(kidsWord(read))} only inherit from what's left above that. Later, whatever your spouse leaves goes by their will, or by the rules on their death.`
          : `With no children, a husband, wife or civil partner takes everything. Parents and brothers and sisters get nothing.`,
      );
      if (inp.earlier === "yes") {
        paras.push(
          `You have children from an earlier relationship. Under the default they get nothing now, and later they're not your spouse's children: if your spouse dies without a will, it all goes to your spouse's family. A will, often with a trust for the home, is the usual fix.`,
        );
      }
      break;
    case "spouse-split":
      paras.push(
        `${cap(read.partner)} takes your belongings, the first ${money(STATUTORY_LEGACY)} and half of the rest: ${money(read.toSpouse)}. The other half, ${money(read.toChildren)}, goes to ${kidsWord(read)}${read.stirpes > 1 ? `, ${money(read.perChild)} each` : ""}${inp.under18 === "yes" ? ", held in trust until 18" : ""}.${read.homeInEstate > 0 ? ` If most of that is the house, ${read.partner} may have to buy the children's share out of it, or sell.` : ""}`,
      );
      break;
    case "separated":
      paras.push(
        `Separation doesn't end a marriage for inheritance. Until a final divorce order (or dissolution), ${read.partner} inherits as if you were still together: ${read.stirpes > 0 ? `the first ${money(STATUTORY_LEGACY)} and half the rest` : "everything"}. A new partner gets nothing. Check pension nominations and life insurance too: they often still name the person you've separated from.`,
      );
      break;
    case "children":
      paras.push(
        `${cap(kidsWord(read))} share everything equally${read.lines > 0 ? ", with the children of a child who died taking that child's share" : ""}.${inp.under18 === "yes" ? " Anything for a child under 18 is held in trust until 18, then handed over outright, whatever their age suggests about readiness. Two administrators are needed to deal with the estate when a child inherits." : ""}`,
      );
      break;
    case "kin":
      paras.push(
        `With no spouse and no children, the estate goes to ${inp.kin ? KIN_LABEL[inp.kin as Exclude<Kin, "" | "none">].toLowerCase() : "relatives"}, in equal shares. A friend, a godchild, a carer or a charity gets nothing, however close.`,
      );
      break;
    case "crown":
      paras.push(
        "With nobody in the line of relatives the law recognises, everything goes to the Crown (the Duchies of Lancaster or Cornwall in their areas). Friends, a partner, a carer or a charity can't inherit without a will.",
      );
      break;
  }

  if (inp.under18 === "yes") {
    paras.push(
      inp.rel === "single" || inp.rel === "cohabiting" || inp.rel === "separated"
        ? "A will is how you choose who brings up your children if you and the other parent both die. Without one, if nobody else has parental responsibility, a court decides."
        : "If you both die, a will is how you choose who brings up your children. Without one, a court decides.",
    );
  }
  return paras.join("\n\n");
}

export type Tile = { label: string; value: string; note: string };

export function tilesOf(read: WillRead): Tile[] {
  if (!read.computed || !read.moneyKnown) return [];
  const out: Tile[] = [];
  out.push({ label: "Goes by the rules", value: money(read.estate), note: "your estate, after debts" });
  if (read.inp.rel === "cohabiting") {
    out.push({
      label: "Your partner gets",
      value: money(read.partnerTotal),
      note: read.homeOutside > 0 ? "only your half of the home, outside the estate" : "nothing from the estate",
    });
  } else if (read.inp.rel === "married" || read.inp.rel === "separated") {
    out.push({
      label: "Spouse gets",
      value: money(read.partnerTotal),
      note: read.homeOutside > 0 ? "including your half of the home" : "from the estate",
    });
  }
  if (read.stirpes > 0) {
    out.push({
      label: read.stirpes > 1 ? "Each child" : "Your child",
      value: money(read.perChild),
      note: read.perChild === 0 ? "nothing now" : read.inp.under18 === "yes" ? "held until 18" : "outright",
    });
  }
  if (out.length < 3 && read.verdict !== "crown") {
    out.push({
      label: "Inheritance tax",
      value: read.iht > 0 ? `about ${money(read.iht)}` : "£0",
      note: read.iht > 0 ? "rough, 40% over the allowances" : "under the allowances",
    });
  }
  return out.slice(0, 3);
}

/** Things that pass outside a will, whatever it says. */
export function outsideOf(read: WillRead): Share[] {
  const out: Share[] = [];
  const inp = read.inp;
  if (inp.home === "joint" || inp.home === "unsure") {
    out.push({
      who: inp.rel === "married" || inp.rel === "separated" || inp.rel === "cohabiting" ? cap(read.partner) : "The co-owner",
      amount: read.homeOutside,
      note:
        inp.home === "unsure"
          ? "Your half of the home, if you own it as joint tenants (most couples do). Check the deeds: if it's tenants in common, it goes by your will instead"
          : "Your half of the home, automatically, as joint tenants",
    });
  }
  if (inp.insurance === "trust") {
    out.push({ who: "The people named in the trust", amount: read.insuranceOutside, note: "Life insurance written in trust, paid without waiting for probate" });
  }
  if (inp.pension === "nominated" || inp.pension === "not" || inp.pension === "unsure") {
    out.push({
      who: inp.pension === "nominated" ? "Whoever your nomination names" : "Whoever the trustees choose",
      amount: -1,
      note:
        inp.pension === "nominated"
          ? "Pension death benefits: the trustees decide, guided by your nomination form"
          : inp.rel === "cohabiting"
            ? "Pension death benefits: with no nomination, the trustees decide, and they may not know about an unmarried partner"
            : "Pension death benefits: with no nomination, the trustees decide who gets them",
    });
  }
  return out;
}

export function checksOf(read: WillRead): string[] {
  const out: string[] = [];
  const inp = read.inp;
  const ew = inp.where === "ew";
  if (inp.rel === "cohabiting") {
    out.push(
      "Unmarried partners pay inheritance tax like anyone else: there's no spouse exemption. Above £325,000 (plus £175,000 if your home goes to your children or grandchildren), it's 40%.",
    );
    if (ew) out.push(
      "The government consulted in summer 2026 on giving long-term cohabitants rights on intestacy. It's a proposal, not law, with no date. Don't plan around it.",
    );
  }
  if (ew && read.computed && read.iht > 0) {
    out.push(
      `On these numbers the default would leave a rough inheritance tax bill of ${money(read.iht)}: 40% of about ${money(Math.max(0, read.ihtBase - NRB))} above the £325,000 allowance${read.toChildren > 0 && read.homeInEstate > 0 ? ", after the home allowance" : ""}. It ignores gifts in the last seven years and an allowance passed on from a late spouse. A will that leaves more to a spouse, or to charity, can change it.`,
    );
  }
  if (inp.step === "yes") {
    out.push("Stepchildren inherit nothing under the rules unless legally adopted, and nothing from a step-parent's estate either. Only a will includes them.");
  }
  if (inp.under18 === "yes") {
    out.push(
      "A will can name guardians, and can hold a child's money in trust to an age you choose (25 is common) instead of handing it all over at 18. Ask the guardians first.",
    );
  }
  if (inp.insurance === "estate" || inp.insurance === "unsure") {
    out.push(
      "Life insurance that isn't in trust is paid into the estate. It waits for probate (often months), goes by the rules, and can push the estate over the inheritance tax threshold. Most insurers will put a policy in trust with a free form.",
    );
  }
  if (inp.pension === "not" || inp.pension === "unsure") {
    out.push(
      "Fill in each pension's nomination (\"expression of wish\") form. It's free, takes ten minutes, and it's what the trustees read first. It isn't covered by your will.",
    );
  }
  if (inp.pension !== "" && inp.pension !== "none") {
    out.push("From 6 April 2027 most unused pension pots count towards inheritance tax. The tool doesn't add them in.");
  }
  if (inp.rel === "separated") {
    out.push("Check every pension nomination and life policy: they keep naming the person you separated from until you change them.");
  }
  if (inp.home === "unsure") {
    out.push("Not sure how you own the home? The title register from HM Land Registry (£7 online) says. A \"restriction\" on it usually means tenants in common.");
  }
  if (ew) {
    out.push(
      "To be valid in England and Wales a will has to be in writing and signed by you in front of two adult witnesses who are there at the same time and sign too. A witness, or their husband, wife or civil partner, loses anything the will leaves them.",
    );
    out.push(
      "Getting married or forming a civil partnership cancels an earlier will. Divorce doesn't cancel it, but removes the ex. Review it at each big change: a wedding, a separation, a baby, a house, a death.",
    );
  }
  out.push("Debts don't pass to your family. They're paid from the estate first, and if there isn't enough, they go unpaid (unless someone co-signed).");
  return out;
}

export type Route = { title: string; cost: string; body: string };

export function routesOf(read: WillRead): Route[] {
  const inp = read.inp;
  const reasons: string[] = [];
  if (inp.earlier === "yes") reasons.push("children from an earlier relationship");
  if (inp.under18 === "yes" || inp.wants.includes("age")) reasons.push("a trust for children");
  if (inp.wants.includes("protect")) reasons.push("protecting the children's share if your partner remarries");
  if (read.iht > 0) reasons.push("inheritance tax");
  if (inp.rel === "separated") reasons.push("a separation");
  if (inp.home === "common" && inp.rel === "cohabiting") reasons.push("a home owned as tenants in common");
  const complex = reasons.length > 0;
  const november = read.today.slice(5, 7) === "11";
  const routes: Route[] = [
    {
      title: "Will Aid, in November",
      cost: `a donation: about ${money(WILL_AID_SINGLE)} single, ${money(WILL_AID_MIRROR)} for a couple`,
      body: november
        ? "Participating solicitors write a basic will and ask for a donation to charity instead of a fee. It's on now, to the end of the month: ring a participating solicitor this week."
        : "Each November, participating solicitors write a basic will and ask for a donation to charity instead of a fee. Don't wait for it if anything on this page worries you.",
    },
    {
      title: "Free Wills Month or a charity scheme",
      cost: "free",
      body: "In March and October, for people 55 and over, some solicitors write a simple will free; charities hope (but don't require) you'll leave them a gift. Some charities run free schemes all year, and some unions and home insurance policies include one.",
    },
    {
      title: "An online will service",
      cost: "roughly £50 to £150",
      body: "Fine for a simple estate where everything goes to a partner, then the children. Many include a check by a person. You still have to sign it properly with two witnesses.",
    },
    {
      title: "A solicitor",
      cost: "a few hundred pounds, more with trusts",
      body: complex
        ? `Worth it for you, because of ${reasons.length > 1 ? `${reasons.slice(0, -1).join(", ")} and ${reasons[reasons.length - 1]}` : reasons[0]}: drafting that cheap routes can get wrong.`
        : "Worth it if there's a business, property abroad, children from an earlier relationship, someone who might contest it, or you want a trust.",
    },
  ];
  if (inp.where === "scotland") {
    routes[0].body = "Will Aid runs in Scotland too, through participating solicitors.";
    routes[2].body = "Check the service writes Scottish wills: the law and the signing are different.";
  }
  return routes;
}

export type DateLine = { on: string; title: string; body: string };

export function remindersOf(read: WillRead): DateLine[] {
  if (read.hasWill && read.inp.existing === "current") {
    return [
      { on: addDaysISO(read.today, 7), title: "Read your will through", body: "Does it still name the right people, executors and guardians? Is the original where your executors can find it?" },
      { on: addDaysISO(read.today, 365 * 5), title: "Review your will", body: "Five years on, or sooner after a wedding, separation, baby, house move or death." },
    ];
  }
  const out: DateLine[] = [
    {
      on: addDaysISO(read.today, read.today.slice(5, 7) === "11" ? 2 : 7),
      title: "Book or start your will",
      body:
        read.today.slice(5, 7) === "11"
          ? "Will Aid runs to the end of November; otherwise an online service or a solicitor. Take your notes."
          : "An online service or a solicitor, or wait for Will Aid in November or Free Wills Month in March or October if you're 55 or over. Take your notes.",
    },
    { on: addDaysISO(read.today, 35), title: "Sign your will", body: "In front of two adult witnesses, at the same time, who don't inherit. Then tell your executors where it is." },
  ];
  if (read.inp.pension === "not" || read.inp.pension === "unsure") {
    out.splice(1, 0, { on: addDaysISO(read.today, 3), title: "Pension nomination forms", body: "Ask each scheme for its expression of wish form, or fill it in online." });
  }
  out.push({ on: addDaysISO(read.today, 365 * 5), title: "Review your will", body: "Five years on, or sooner after a wedding, separation, baby, house move or death." });
  return out.sort((a, b) => (a.on < b.on ? -1 : 1));
}

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(read: WillRead): Message[] {
  const inp = read.inp;
  const out: Message[] = [];
  const partner = inp.partnerName.trim() || "[partner's name]";
  const relLine =
    inp.rel === "married"
      ? `I'm married to ${partner}.`
      : inp.rel === "separated"
        ? `I'm married to ${partner} but we've separated. [Divorce under way? Date of final order?]`
        : inp.rel === "cohabiting"
          ? `I live with ${partner}; we're not married. We've been together [how many] years.`
          : "I'm not married and don't have a partner.";
  const kids =
    read.stirpes > 0
      ? `Children: ${read.children > 0 ? `${read.children} [names and dates of birth]` : ""}${read.lines > 0 ? `${read.children > 0 ? "; " : ""}grandchildren from ${read.lines === 1 ? "a child" : `${read.lines} children`} who died [names]` : ""}.${inp.earlier === "yes" ? " Some are from an earlier relationship [which]." : ""}${inp.step === "yes" ? " I also have a stepchild I want treated as my own [name]." : ""}`
      : inp.step === "yes"
        ? "No children of my own. A stepchild I want included [name]."
        : "No children.";
  const homeLine =
    inp.home === "none"
      ? "I don't own a home."
      : inp.home === "sole"
        ? `I own my home on my own [address], worth about ${money(num(inp.homeValue))}, mortgage ${money(num(inp.mortgage))}.`
        : inp.home === "joint"
          ? `I own my home jointly with ${inp.rel === "single" ? "[name]" : partner} as joint tenants [address], worth about ${money(num(inp.homeValue))}, mortgage ${money(num(inp.mortgage))}.`
          : inp.home === "common"
            ? `I own my home with ${inp.rel === "single" ? "[name]" : partner} as tenants in common, [my share], worth about ${money(num(inp.homeValue))}, mortgage ${money(num(inp.mortgage))}.`
            : `I own my home with ${inp.rel === "single" ? "[name]" : partner}; I'm not sure whether as joint tenants or tenants in common.`;
  const wishes: string[] = [];
  if (inp.wants.includes("partner")) wishes.push(`- ${inp.rel === "cohabiting" || inp.rel === "married" ? partner : "[my partner]"} to be provided for first: [everything / the home and enough to live on].`);
  if (inp.wants.includes("protect")) wishes.push("- My children's share protected if my partner remarries or needs care: [a life interest trust in my share of the home?].");
  if (inp.wants.includes("guardians")) wishes.push("- Guardians for my children if the other parent can't: [names; they've agreed]. A back-up: [name].");
  if (inp.wants.includes("age")) wishes.push("- My children to inherit at [25], not 18, with trustees: [names].");
  if (inp.wants.includes("stepchild")) wishes.push("- My stepchild [name] treated the same as my own children.");
  if (inp.wants.includes("gift")) wishes.push("- Gifts: [£ amount or item] to [friend / godchild / carer]; [£ or %] to [charity, with its registered number].");
  if (!wishes.length) wishes.push("- [Who gets what, and who gets it if they die first.]");
  out.push({
    id: "brief",
    title: "Notes for whoever writes it",
    note: "Take this to Will Aid, a solicitor or an online service. Fill in the brackets. It saves an appointment and the cost of a second one.",
    text: [
      "Notes for my will",
      "",
      `${relLine}`,
      kids,
      "",
      "What I own:",
      homeLine,
      `Savings, investments and other things: about ${money(num(inp.savings))}. Debts besides the mortgage: ${money(num(inp.debts))}.`,
      inp.insurance === "none" || !inp.insurance
        ? "Life insurance: none."
        : `Life insurance: ${money(num(inp.insuranceAmount))} [insurer, policy number], ${inp.insurance === "trust" ? "written in trust" : inp.insurance === "estate" ? "not in trust" : "not sure if it's in trust"}.`,
      inp.pension === "none" || !inp.pension
        ? "Pensions: none with death benefits."
        : `Pensions: [schemes]. Nomination form ${inp.pension === "nominated" ? "filled in, naming [who]" : "not filled in yet"}.`,
      "",
      "What I want:",
      ...wishes,
      "",
      "Executors (the people who sort it out): [names; ideally two, and a back-up].",
      "If the main people I leave things to die before me: [who instead].",
      "Funeral wishes: [burial / cremation / none].",
      "",
      "Questions:",
      read.iht > 0 || inp.rel === "cohabiting" ? "- Will inheritance tax be due, and can the will reduce it?" : "- Is there anything about my situation a simple will gets wrong?",
      inp.home === "joint" && inp.earlier === "yes" ? "- Should we change the home to tenants in common so my share can go to my children?" : "- Does how we own the home fit what I want?",
      "- Where will the original be kept, and how will my executors find it?",
    ].join("\n"),
  });

  if (inp.rel === "cohabiting" || inp.rel === "married") {
    out.push({
      id: "talk",
      title: `Raising it with ${inp.partnerName.trim() || "your partner"}`,
      note: "Most couples who do this make two wills at once (\"mirror wills\"). One line to start it, kept about the people, not about dying.",
      text:
        inp.rel === "cohabiting"
          ? `I found out something I didn't know: because we're not married, if either of us died without a will, the other would get nothing except the house${read.stirpes > 0 ? " (it'd go to the kids, held until they're 18)" : ""}. Can we sort out wills before Christmas? Will Aid does them for a donation this month.`
          : `I looked up what happens if one of us dies without a will. ${read.stirpes > 0 ? (read.toChildren > 0 ? "The kids would get part of it outright at 18, and you'd get the rest" : "You'd get everything, but nothing would say who looks after the kids if we both went") : "It's mostly fine, but nothing says what happens if we both go at once"}. Can we each do one? It's an afternoon.`,
    });
  }

  if (inp.wants.includes("guardians") || inp.under18 === "yes") {
    out.push({
      id: "guardian",
      title: "Asking someone to be a guardian",
      note: "Ask before you name them. A will can name a guardian who says no; better to know now.",
      text: `We're making our wills, and there's a question we'd like to ask you, and it's fine to say no or to think about it. If anything happened to both of us, would you be willing to be guardian to [children's names]? There'd be money in trust to bring them up; we'd write down what matters to us. We'd like to name you, with [name] as back-up.`,
    });
  }

  if (inp.pension === "not" || inp.pension === "unsure" || inp.rel === "separated") {
    out.push({
      id: "pension",
      title: "To each pension scheme",
      note: "Send to every scheme, including old workplace pensions. Most have the form online.",
      text: `Dear [scheme name],\n\nMember: [your name], [date of birth], [membership or policy number].\n\nPlease send me your expression of wish (nomination) form for death benefits, or tell me how to complete it online. ${inp.rel === "separated" ? "I want to update it following a separation." : "I'd like to name who should receive any lump sum or pension if I die."}\n\nPlease also confirm what death benefits the scheme currently provides.\n\nThank you,\n[your name]`,
    });
  }

  if (inp.insurance === "estate" || inp.insurance === "unsure") {
    out.push({
      id: "insurer",
      title: "To your life insurer",
      note: "Putting a policy in trust is usually free and doesn't change the cover.",
      text: `Dear [insurer],\n\nPolicy number: [number], [your name].\n\nPlease tell me whether this policy is written in trust. If it isn't, please send me your trust form so that I can put it in trust for [names]. I understand this usually means it can be paid without waiting for probate, and outside my estate.\n\nThank you,\n[your name]`,
    });
  }
  return out;
}

export function keepList(read: WillRead): string[] {
  const out = [
    "The signed original, unstapled and unmarked, somewhere safe: with the solicitor, the government's will storage service, or a fireproof box at home. A copy isn't enough to prove it.",
    "A note for your executors: where the original is, who wrote it, and how to reach them.",
    "A list of accounts, pensions, insurance policies and the house deeds, with reference numbers. Not passwords.",
  ];
  if (read.inp.under18 === "yes" || read.inp.wants.includes("guardians")) {
    out.push("A letter of wishes for the guardians: schooling, faith, family, what matters to you. Not binding, often the most read page.");
  }
  if (read.inp.pension !== "" && read.inp.pension !== "none") out.push("A copy of each pension nomination and the date you sent it.");
  return out;
}

export function willRule(read: WillRead): string {
  if (read.hasWill && read.inp.existing === "current") return "I read my will at every big change, and tell my executors where it is.";
  if (read.verdict === "cohab") return "Living together isn't a will. We each make one this month.";
  if (read.inp.under18 === "yes") return "I choose who brings up my children, in writing, before anyone has to ask.";
  if (read.verdict === "crown" || read.verdict === "kin") return "If I don't write it down, the law picks for me, and it doesn't know my friends.";
  return "Everyone has a will. Mine will be one I wrote.";
}

export function willSummary(read: WillRead): string {
  const lines = [`Making a will: ${willHeadline(read)}`, "", willBody(read), ""];
  if (read.computed && read.shares.length) {
    lines.push("Without a will:");
    for (const s of read.shares) lines.push(`- ${s.who}: ${read.moneyKnown ? money(s.amount) : ""}${read.moneyKnown ? " — " : ""}${s.note}`);
    lines.push("");
  }
  const outside = outsideOf(read);
  if (outside.length) {
    lines.push("Outside the will:");
    for (const s of outside) lines.push(`- ${s.who}: ${s.amount > 0 ? `${money(s.amount)} — ` : ""}${s.note}`);
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
    `Rule: ${willRule(read)}`,
    "",
    `England and Wales rules: statutory legacy ${money(STATUTORY_LEGACY)}; inheritance tax allowances ${money(NRB)} and ${money(RNRB)}. From https://bettereveryday.vercel.app/will. Not legal advice.`,
  );
  return lines.join("\n");
}

const WHERES: Exclude<Where, "">[] = ["ew", "scotland", "ni"];
const RELS: Exclude<Rel, "">[] = ["married", "separated", "cohabiting", "single"];
const TOGETHERS: Exclude<Together, "">[] = ["under2", "2to5", "5plus"];
const KINS: Exclude<Kin, "">[] = ["parents", "siblings", "halfsiblings", "grandparents", "aunts", "halfaunts", "none"];
const HOMES: Exclude<Home, "">[] = ["none", "sole", "joint", "common", "unsure"];
const INSURANCES: Exclude<Insurance, "">[] = ["none", "trust", "estate", "unsure"];
const PENSIONS: Exclude<Pension, "">[] = ["none", "nominated", "not", "unsure"];
const EXISTINGS: Exclude<Existing, "">[] = ["none", "current", "beforeMarriage", "beforeDivorce", "old"];
export const WANTS: Want[] = ["partner", "guardians", "age", "protect", "stepchild", "gift"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function numText(v: unknown, max = 12): string {
  if (typeof v !== "string") return "";
  const t = v.replace(/[^\d.,£\s]/g, "").slice(0, max);
  return t;
}

export function parseWillInputs(raw: unknown): WillInputs {
  if (!raw || typeof raw !== "object") return BLANK_WILL;
  const v = raw as Record<string, unknown>;
  const wants = Array.isArray(v.wants) ? WANTS.filter((w) => (v.wants as unknown[]).includes(w)) : [];
  return {
    where: oneOf(v.where, WHERES),
    rel: oneOf(v.rel, RELS),
    together: oneOf(v.together, TOGETHERS),
    children: typeof v.children === "string" && /^\d{0,2}$/.test(v.children) ? v.children : "",
    lines: typeof v.lines === "string" && /^\d{0,2}$/.test(v.lines) ? v.lines : "",
    under18: oneOf(v.under18, YESNOS),
    earlier: oneOf(v.earlier, YESNOS),
    step: oneOf(v.step, YESNOS),
    kin: oneOf(v.kin, KINS),
    home: oneOf(v.home, HOMES),
    homeValue: numText(v.homeValue),
    mortgage: numText(v.mortgage),
    savings: numText(v.savings),
    debts: numText(v.debts),
    insurance: oneOf(v.insurance, INSURANCES),
    insuranceAmount: numText(v.insuranceAmount),
    pension: oneOf(v.pension, PENSIONS),
    existing: oneOf(v.existing, EXISTINGS),
    wants,
    partnerName: typeof v.partnerName === "string" ? v.partnerName.slice(0, 30) : "",
  };
}

/**
 * The worked example: Jo, 38, has lived with Sam for nine years. Not married.
 * Two children, 7 and 4. The home is owned jointly (joint tenants), worth
 * £320,000 with £190,000 left on the mortgage. £22,000 in savings and a car
 * worth £8,000. £150,000 of life insurance not in trust; a workplace pension
 * whose nomination form was never filled in. No will.
 */
export function willExample(): WillInputs {
  return {
    ...BLANK_WILL,
    where: "ew",
    rel: "cohabiting",
    together: "5plus",
    children: "2",
    lines: "0",
    under18: "yes",
    earlier: "no",
    step: "no",
    home: "joint",
    homeValue: "320000",
    mortgage: "190000",
    savings: "30000",
    debts: "0",
    insurance: "estate",
    insuranceAmount: "150000",
    pension: "not",
    existing: "none",
    wants: ["partner", "guardians", "age"],
    partnerName: "Sam",
  };
}
