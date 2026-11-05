/**
 * The read behind "A Notice to Leave: Do You Have to Go?" (/notice).
 *
 * A letter from the landlord says they want the home back, with a date on it.
 * Most tenants read that date as the day they have to be out. Some start
 * packing; some stop paying, thinking it's over anyway; some move out the week
 * before and lose the council's help on the way. But the date on a notice is
 * the earliest day the landlord can *ask a court*. Only a possession order, and
 * then bailiffs with a warrant, can make a tenant leave.
 *
 * England, private tenancies (Housing Act 1988, s.8 and Sch.2, as amended by
 * the Renters' Rights Act 2025; in force 1 May 2026). gov.uk, legislation.gov.uk
 * and Shelter were blocked from the sandbox, so this rests on what agreed across
 * law firms', landlord bodies', councils' and advice services' summaries:
 *
 *   - Section 21 "no-fault" notices ended on 1 May 2026. A section 21 (or an
 *     old Form 3 section 8) served before then could only be used if the
 *     landlord went to court by the earlier of its own time limit and 31 July
 *     2026. After that the route closed.
 *   - From 1 May 2026, a private landlord has to use Form 3A and name one or
 *     more grounds from Schedule 2. Each ground has its own minimum notice:
 *     four months for the landlord moving in (1), selling (1A) or major works
 *     (6); four weeks for rent arrears (8, 8A, 10, 11); two weeks for breaking
 *     the tenancy (12) or damage (13, 15); none for anti-social behaviour (14)
 *     or a serious conviction (7A). Several sources disagree at the edges, so
 *     the tool uses the figures most of them give.
 *   - Grounds 1 and 1A can't take effect in the first 12 months of the tenancy:
 *     the notice can't expire before the tenancy's first year is up. After using
 *     them, the landlord can't re-let for 12 months.
 *   - Ground 8 (mandatory arrears) needs at least three months' rent (13 weeks
 *     for weekly rent) owed both when the notice is served and at the hearing.
 *     Arrears caused only by a Universal Credit payment delay don't count. So
 *     bringing the arrears under the line before the hearing takes away the
 *     ground the court *must* follow; the discretionary ones (10, 11) remain.
 *   - The landlord has to start court proceedings within 12 months of serving
 *     the notice, or it lapses.
 *   - On most grounds (not the anti-social behaviour ones), a court can't make
 *     a possession order while the deposit is unprotected, unless it's been
 *     protected late or returned. Sources agree on the bar but not every detail,
 *     so the tool flags it for an adviser rather than calling the notice invalid.
 *   - Court: the first hearing is at least 28 days after the claim is issued
 *     (CPR 55.5). A possession order usually gives 14 days, up to six weeks for
 *     exceptional hardship (Housing Act 1980 s.89). After that the landlord
 *     needs a warrant and bailiffs. Changing the locks or removing a tenant
 *     without that is a criminal offence (Protection from Eviction Act 1977).
 *   - Homelessness: since 1 May 2026, a private tenant with a valid section 8
 *     notice whose date falls within 56 days is "threatened with homelessness",
 *     and the council owes a prevention duty. You can ask for help earlier.
 *   - The Housing Loss Prevention Advice Service gives free legal advice once
 *     there's a notice, and a duty adviser at court, with no means test.
 *
 * Wales, Scotland and Northern Ireland, social housing and lodgers get a
 * pointer: their rules differ too much to model here.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type NoticeRegion = "" | "eng" | "wales" | "scot" | "ni";
export type NoticeLandlord = "" | "private" | "social" | "lodger";
/** What actually arrived. */
export type NoticeKind = "" | "form3a" | "s21" | "informal" | "unsure" | "court";
export type GroundId = "g1" | "g1A" | "g6" | "g8" | "g8A" | "g10" | "g12" | "g13" | "g14" | "g7A" | "other";
export type NoticeRentPeriod = "" | "month" | "week" | "fourweek";
export type DepositState = "" | "protected" | "not" | "unsure" | "none";
export type YesNoUnsure = "" | "yes" | "no" | "unsure";
export type Aim = "" | "stay" | "go" | "unsure";

export type Ground = {
  id: GroundId;
  /** As a tenant would recognise it. */
  label: string;
  /** For letters: "ground 1A (selling the home)". */
  short: string;
  /** Minimum notice, in months or days; null when unknown. */
  months?: number;
  days?: number;
  /** Mandatory: if the landlord proves it, the court must order possession. */
  mandatory: boolean;
  /** Can't take effect in the tenancy's first 12 months. */
  firstYear?: boolean;
  /** About rent owed. */
  arrears?: boolean;
  /** Anti-social behaviour: the deposit bar doesn't apply. */
  asb?: boolean;
};

export const GROUNDS: Ground[] = [
  { id: "g1A", label: "Selling the home (ground 1A)", short: "ground 1A (selling the home)", months: 4, mandatory: true, firstYear: true },
  { id: "g1", label: "The landlord or their family moving in (ground 1)", short: "ground 1 (the landlord or family moving in)", months: 4, mandatory: true, firstYear: true },
  { id: "g6", label: "Major works or redevelopment (ground 6)", short: "ground 6 (redevelopment)", months: 4, mandatory: true },
  { id: "g8", label: "At least three months' rent owed (ground 8)", short: "ground 8 (serious rent arrears)", days: 28, mandatory: true, arrears: true },
  { id: "g8A", label: "Behind on rent again and again (ground 8A)", short: "ground 8A (repeated arrears)", days: 28, mandatory: true, arrears: true },
  { id: "g10", label: "Some rent owed, or often paid late (grounds 10 or 11)", short: "grounds 10 and 11 (rent arrears)", days: 28, mandatory: false, arrears: true },
  { id: "g12", label: "Breaking a term of the tenancy (ground 12)", short: "ground 12 (breach of the tenancy)", days: 14, mandatory: false },
  { id: "g13", label: "Damage to the home or furniture (grounds 13 or 15)", short: "grounds 13 and 15 (damage)", days: 14, mandatory: false },
  { id: "g14", label: "Nuisance or anti-social behaviour (ground 14)", short: "ground 14 (anti-social behaviour)", days: 0, mandatory: false, asb: true },
  { id: "g7A", label: "A conviction or order for serious anti-social behaviour (ground 7A)", short: "ground 7A (serious anti-social behaviour)", days: 0, mandatory: true, asb: true },
  { id: "other", label: "Another ground, or I can't tell", short: "another ground", mandatory: false },
];

export function getGround(id: GroundId): Ground {
  const g = GROUNDS.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown ground ${id}`);
  return g;
}

export type NoticeInputs = {
  /** The home, in a few words. Optional. */
  what: string;
  landlordName: string;
  region: NoticeRegion;
  landlord: NoticeLandlord;
  kind: NoticeKind;
  /** ISO date the notice reached you. */
  servedOn: string;
  /** ISO date the tenancy began (the first one, if you've renewed). Optional. */
  tenancyStart: string;
  /** The date in the notice: proceedings won't begin before it. Optional. */
  notBefore: string;
  grounds: GroundId[];
  /** Court papers: the hearing date, if there is one. */
  hearingOn: string;
  period: NoticeRentPeriod;
  rent: string;
  owed: string;
  /** Is some of it down to a Universal Credit payment delay? */
  ucDelay: YesNoUnsure;
  deposit: DepositState;
  aim: Aim;
};

export const BLANK_NOTICE: NoticeInputs = {
  what: "",
  landlordName: "",
  region: "",
  landlord: "",
  kind: "",
  servedOn: "",
  tenancyStart: "",
  notBefore: "",
  grounds: [],
  hearingOn: "",
  period: "",
  rent: "",
  owed: "",
  ucDelay: "",
  deposit: "",
  aim: "",
};

/** The Renters' Rights Act's tenancy reforms took effect. */
export const NEW_RULES_FROM = "2026-05-01";
/** The last day a pre-May notice could be taken to court. */
export const OLD_NOTICE_CUTOFF = "2026-07-31";
/** The council's prevention duty starts this many days before the notice date. */
export const COUNCIL_DAYS = 56;
/** First hearing: at least 28 days after the claim (CPR 55.5). */
export const HEARING_MIN_DAYS = 28;
/** A possession order usually gives 14 days. */
export const ORDER_DAYS = 14;

export type NoticeStatus =
  | "elsewhere"
  | "social"
  | "lodger"
  /** Court papers have arrived. */
  | "court"
  /** A text, email or letter: not a notice. */
  | "informal"
  /** Section 21: gone. */
  | "s21"
  /** A section 8 on the old rules, past its cut-off. */
  | "old"
  /** Form 3A, but it fails a check. */
  | "invalid"
  /** Form 3A, more than 12 months old. */
  | "lapsed"
  /** Form 3A, and nothing found wrong. */
  | "valid";

export type ArrearsRead = {
  /** Monthly-equivalent rent isn't needed; these are in pounds owed. */
  threshold: number;
  owed: number;
  /** At or over the ground 8 line. */
  meets: boolean;
  /** Paying this (on top of rent as it falls due) takes it under the line. */
  payToDrop: number;
  /** What's left owing after that payment. */
  after: number;
};

export type NoticeRead = {
  status: NoticeStatus;
  problems: string[];
  doubts: string[];
  /** Grounds ticked. */
  grounds: Ground[];
  /** Any mandatory ground still standing. */
  mandatory: boolean;
  /** The mandatory grounds still standing. */
  mandatoryGrounds: Ground[];
  /** The earliest date the notice could lawfully give. */
  requiredDate: string;
  /** The date to treat as the earliest court claim. */
  earliestCourt: string;
  /** The earliest a court could make you leave, if everything moved at once. */
  earliestOut: string;
  /** From here the council owes help (date in notice minus 56 days). */
  councilFrom: string;
  /** The notice lapses if there's no court claim by then. */
  lapsesOn: string;
  arrears: ArrearsRead | null;
  /** Deposit not protected (or unsure), and a ground it would block. */
  depositFlag: boolean;
  daysToCourt: number | null;
};

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) || r >= 100
    ? `£${Math.round(r).toLocaleString("en-GB")}`
    : `£${r.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** The earliest date a ground's notice period allows. */
export function groundEarliest(g: Ground, servedOn: string): string {
  if (g.months !== undefined) return addMonthsISO(servedOn, g.months);
  if (g.days !== undefined) return addDaysISO(servedOn, g.days);
  return servedOn;
}

/** "four months", "four weeks", "two weeks", "no notice". */
export function periodWords(g: Ground): string {
  if (g.months !== undefined) return g.months === 4 ? "four months" : `${g.months} months`;
  if (g.days === 0) return "no notice period";
  if (g.days === 28) return "four weeks";
  if (g.days === 14) return "two weeks";
  if (g.days !== undefined) return `${g.days} days`;
  return "a notice period that depends on the ground";
}

/** Ground 8's line: three months' rent, or 13 weeks' for weekly rent. */
export function arrearsThreshold(rent: number, period: Exclude<NoticeRentPeriod, "">): number {
  if (period === "month") return rent * 3;
  if (period === "week") return rent * 13;
  return rent * 3.25; // four-weekly: 13 weeks
}

export function readArrears(inp: NoticeInputs): ArrearsRead | null {
  const rent = parseMoney(inp.rent);
  const owed = parseMoney(inp.owed);
  if (!inp.period || rent === null || rent <= 0 || owed === null || owed < 0) return null;
  const threshold = Math.round(arrearsThreshold(rent, inp.period) * 100) / 100;
  const meets = owed >= threshold;
  // Pounds, rounded up, to land at least a pound under the line.
  const payToDrop = meets ? Math.ceil(owed - threshold + 1) : 0;
  return { threshold, owed, meets, payToDrop, after: Math.max(0, owed - payToDrop) };
}

/** Enough to give a read. */
export function noticeReady(inp: NoticeInputs): boolean {
  if (!inp.region) return false;
  if (inp.region !== "eng") return true;
  if (!inp.landlord) return false;
  if (inp.landlord !== "private") return true;
  if (!inp.kind) return false;
  if (inp.kind === "informal" || inp.kind === "court") return true;
  if (inp.kind === "s21") return true;
  return isISODate(inp.servedOn) && inp.grounds.length > 0;
}

export function readNotice(inp: NoticeInputs, today = todayISO()): NoticeRead | null {
  if (!noticeReady(inp)) return null;
  const grounds = GROUNDS.filter((g) => inp.grounds.includes(g.id));
  const arrears = grounds.some((g) => g.arrears) ? readArrears(inp) : null;
  const base: NoticeRead = {
    status: "valid",
    problems: [],
    doubts: [],
    grounds,
    mandatory: false,
    mandatoryGrounds: [],
    requiredDate: "",
    earliestCourt: "",
    earliestOut: "",
    councilFrom: "",
    lapsesOn: "",
    arrears,
    depositFlag: false,
    daysToCourt: null,
  };

  if (inp.region !== "eng") return { ...base, status: "elsewhere" };
  if (inp.landlord === "social") return { ...base, status: "social" };
  if (inp.landlord === "lodger") return { ...base, status: "lodger" };
  if (inp.kind === "court") return { ...base, status: "court" };
  if (inp.kind === "informal") return { ...base, status: "informal" };
  if (inp.kind === "s21") return { ...base, status: "s21" };

  const problems: string[] = [];
  const doubts: string[] = [];
  const served = inp.servedOn;

  if (inp.kind === "unsure")
    doubts.push(
      `Check the heading. Since 1 May 2026 a private landlord's notice has to be the government's form: "Form 3A: Notice seeking possession of a property let on an assured tenancy". A letter in their own words isn't one.`,
    );

  // Old rules: served before 1 May 2026, and the window to use it has shut.
  if (served < NEW_RULES_FROM && today > OLD_NOTICE_CUTOFF) {
    return { ...base, status: "old", grounds, problems, doubts };
  }

  // Each ground's minimum notice; the notice has to satisfy the longest.
  let requiredDate = served;
  for (const g of grounds) {
    const e = groundEarliest(g, served);
    if (e > requiredDate) requiredDate = e;
  }

  const hasNotBefore = isISODate(inp.notBefore);
  if (hasNotBefore) {
    if (inp.notBefore < requiredDate) {
      const longest = grounds.find((g) => groundEarliest(g, served) === requiredDate) ?? null;
      problems.push(
        `It doesn't give enough notice. ${longest ? `For ${longest.short} the minimum is ${periodWords(longest)}` : "For the grounds it uses"}: served on ${letterDate(served)}, the date in the notice can't be before ${letterDate(requiredDate)}. This one says ${letterDate(inp.notBefore)}.`,
      );
    } else if (requiredDate > served && daysBetween(requiredDate, inp.notBefore) <= 3) {
      doubts.push(
        "The notice period is only just met. If the notice was posted, the day it counts as served can be a day or two after it was sent, which could make it too short. Check the envelope and when it arrived.",
      );
    }
  } else if (requiredDate > served) {
    doubts.push(
      `Find the date in the notice (the landlord says court proceedings won't begin before it). It can't be earlier than ${letterDate(requiredDate)} for the grounds you ticked.`,
    );
  }

  // Grounds 1 and 1A: not in the tenancy's first year.
  const firstYear = grounds.filter((g) => g.firstYear);
  if (firstYear.length) {
    if (isISODate(inp.tenancyStart)) {
      const yearOn = addMonthsISO(inp.tenancyStart, 12);
      const ends = hasNotBefore ? inp.notBefore : requiredDate;
      if (ends < yearOn) {
        const lone = firstYear.length === grounds.length;
        problems.push(
          `${firstYear.map((g) => g.short).join(" and ").replace(/^ground/, "Ground")} can't be used to end a tenancy in its first 12 months. Yours began on ${letterDate(inp.tenancyStart)}, so the notice can't end before ${letterDate(yearOn)}${lone ? "" : " on that ground"}.`,
        );
      }
    } else {
      doubts.push(
        "Grounds 1 and 1A can't be used to end a tenancy in its first 12 months. If you moved in less than a year before the date in the notice, it doesn't work on those grounds. Check the date the tenancy began.",
      );
    }
  }

  // Ground 8: the arrears line.
  const g8 = grounds.find((g) => g.id === "g8");
  let g8stands = Boolean(g8);
  if (g8) {
    if (arrears && !arrears.meets) {
      g8stands = false;
    } else if (!arrears) {
      doubts.push(
        "Add your rent and what you owe: ground 8 only works if you owe at least three months' rent (13 weeks' for weekly rent), both when the notice was served and at the hearing.",
      );
    }
    if (inp.ucDelay === "yes" || inp.ucDelay === "unsure")
      doubts.push(
        "Arrears caused only by a delay in Universal Credit paying your housing costs don't count towards ground 8. Ask the UC service for your payment history and take it to the adviser.",
      );
  }

  // Deposit: on most grounds a court can't order possession while it's unprotected.
  const blocking = grounds.some((g) => !g.asb);
  const depositFlag = blocking && (inp.deposit === "not" || inp.deposit === "unsure");
  if (inp.deposit === "unsure" && blocking)
    doubts.push(
      "Check your deposit was protected: search the three schemes (DPS, mydeposits, TDS) with your details. On most grounds, a court can't order possession while a deposit sits unprotected.",
    );

  const lapsesOn = addMonthsISO(served, 12);
  const earliestCourt = hasNotBefore && inp.notBefore > requiredDate ? inp.notBefore : requiredDate;
  // The order can't take effect within 14 days of service even with no notice period.
  const earliestOut = addDaysISO(earliestCourt, HEARING_MIN_DAYS + ORDER_DAYS);
  const councilFrom = addDaysISO(earliestCourt, -COUNCIL_DAYS);
  const mandatoryGrounds = grounds.filter((g) => g.mandatory && (g.id !== "g8" || g8stands));
  const mandatory = mandatoryGrounds.length > 0;

  const out: NoticeRead = {
    ...base,
    problems,
    doubts,
    grounds,
    mandatory,
    mandatoryGrounds,
    requiredDate,
    earliestCourt,
    earliestOut,
    councilFrom,
    lapsesOn,
    depositFlag,
    daysToCourt: daysBetween(today, earliestCourt),
  };

  if (problems.length)
    return { ...out, status: "invalid", doubts: doubts.filter((d) => !d.startsWith("The notice period is only just met")) };
  if (today > lapsesOn) return { ...out, status: "lapsed" };
  return { ...out, status: "valid" };
}

function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "a, b and c". */
function listOf(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

function homeOf(inp: NoticeInputs): string {
  return inp.what.trim() || "the home I rent";
}

export function noticeHeadline(inp: NoticeInputs, read: NoticeRead): string {
  switch (read.status) {
    case "elsewhere":
      return inp.region === "scot"
        ? "Scotland has its own eviction rules: a tribunal, not a court, decides."
        : inp.region === "wales"
          ? "Wales has its own rules. Check the notice against them before you act."
          : "Northern Ireland has its own rules. Get free advice before you act.";
    case "social":
      return "A council or housing association has to go to court too. Get advice now.";
    case "lodger":
      return "As a lodger, you can be asked to leave without a court. 'Reasonable notice' is the rule.";
    case "court":
      return "Court papers are the stage where free help matters most. Get it this week.";
    case "informal":
      return "That isn't a notice. Your tenancy carries on.";
    case "s21":
      return "Section 21 notices have ended. This one can't end your tenancy.";
    case "old":
      return "This notice was served under the old rules, and the time to use it has run out.";
    case "invalid":
      return "This notice doesn't work. Your tenancy carries on.";
    case "lapsed":
      return "This notice has lapsed: the landlord didn't go to court within 12 months.";
    case "valid": {
      const a = read.arrears;
      const g8 = read.grounds.some((g) => g.id === "g8");
      const others = read.mandatoryGrounds.some((g) => g.id !== "g8");
      if (a && g8 && !others && a.meets)
        return `Pay ${money(a.payToDrop)} off the arrears before the hearing, keep paying the rent, and the court no longer has to evict you.`;
      if (a && g8 && !others && !a.meets)
        return "You're under the ground 8 line. Keep paying the rent, and the court doesn't have to evict you.";
      if (!isISODate(inp.notBefore) || read.earliestCourt === inp.servedOn)
        return "The notice looks valid, but it isn't an eviction. Only a court can make you leave.";
      return `The notice looks valid, but it isn't an eviction. You don't have to be out on ${letterDate(read.earliestCourt)}.`;
    }
  }
}

export function noticeBody(inp: NoticeInputs, read: NoticeRead, today = todayISO()): string {
  const parts: string[] = [];
  switch (read.status) {
    case "elsewhere":
      if (inp.region === "scot")
        parts.push(
          "Most private tenants in Scotland have a private residential tenancy. A landlord has to give a Notice to Leave on one of the eviction grounds, then apply to the First-tier Tribunal (Housing and Property Chamber), which decides whether it's reasonable to evict. You don't have to leave on the date in the notice. Shelter Scotland and Citizens Advice Scotland give free advice.",
        );
      else if (inp.region === "wales")
        parts.push(
          "Under the Renting Homes (Wales) Act, most tenants are contract-holders, and a no-fault notice has to give at least six months. Breach notices are shorter. Only a court order can make you leave. Shelter Cymru and Citizens Advice can check your notice.",
        );
      else
        parts.push(
          "Private tenancies in Northern Ireland have their own notice to quit periods, which depend on how long you've lived there, and only a court can order you out. Housing Rights (housingrights.org.uk) gives free advice.",
        );
      break;
    case "social":
      parts.push(
        "Council and housing association tenants have their own forms of tenancy and notice, and the landlord still needs a court order. Social landlords are also expected to follow a pre-action protocol before going to court for rent arrears, which means talking to you about a payment plan first. Get free advice from Shelter or Citizens Advice now, and from the Housing Loss Prevention Advice Service once there's a notice.",
      );
      break;
    case "lodger":
      parts.push(
        "If you live in your landlord's own home and share a kitchen or bathroom with them, you're usually an excluded occupier. They don't need a court order. They have to give reasonable notice, which is often the length of your rent period (a week, a month), or whatever your agreement says. They can't use violence, and they can't throw you out without that notice. If you're not sure whether you share with the landlord in the legal sense, get advice: it decides which rules apply.",
      );
      break;
    case "court":
      parts.push(
        "If you've had a claim form (N5) and particulars (N119) from the county court, there's a hearing date on it. Two things to do this week:",
        "• Fill in the defence form that came with the papers (N11R) and return it within 14 days. Say if the notice was wrong, if the arrears are lower than claimed, if repairs were reported and not done, or if your deposit wasn't protected.",
        "• Contact the Housing Loss Prevention Advice Service (search \"find a legal aid adviser\" on GOV.UK and tick housing loss prevention). It's free with no means test once there's a possession claim, and there's a duty adviser at the court on the day.",
        "Go to the hearing, even if you think you've got no case. A judge can delay or suspend an order, or give up to six weeks to leave for exceptional hardship, but only if you're there to ask. Tell the council's housing team now, too.",
      );
      break;
    case "informal":
      parts.push(
        "A private landlord in England can only end an assured tenancy by serving a section 8 notice on Form 3A, giving a legal ground and the right notice, and then getting a court order. A text, an email, a conversation or a letter in their own words doesn't do it, and \"you have to be out by the end of the month\" has no legal force.",
        "So keep paying your rent and keep living there. Reply in writing, politely, saying you'll consider any formal notice. If they change the locks, remove your things or cut off the gas or electricity, that's illegal eviction, a criminal offence: call the council's private renting team, and the police if you're locked out.",
      );
      break;
    case "s21":
      parts.push(
        "Section 21 \"no-fault\" eviction ended in England on 1 May 2026. A section 21 notice served after that date has no effect. One served before it could only be used if the landlord applied to court by 31 July 2026 (or sooner, if the notice ran out first), and that window has closed.",
        "Unless you've already had court papers from a claim made by then, your tenancy carries on. To end it now, a landlord needs a section 8 notice on Form 3A, with a legal ground, the right notice and then a court order.",
      );
      break;
    case "old":
      parts.push(
        "Notices served before 1 May 2026 (section 21, or section 8 on the old Form 3) could only be taken to court by 31 July 2026 at the latest. That date has passed, so unless the landlord made a court claim by then, this notice can't be used. Your tenancy carries on, and any new notice has to be on Form 3A under the new rules.",
      );
      break;
    case "invalid":
      parts.push(
        "A section 8 notice has to meet each rule for the grounds it uses, and this one doesn't:",
        ...read.problems.map((p) => `• ${p}`),
        "A notice that doesn't work can't be the basis of a court claim. Keep paying the rent and tell the landlord in writing why it doesn't work. They can serve a new, correct one, which would start the clock again, so use the time: get free advice now, and look at what you'd do if a valid one came.",
      );
      if (inp.deposit === "not")
        parts.push(
          "Your deposit wasn't protected, either. On most grounds a court can't make a possession order until it's protected or returned, and you may be owed one to three times the deposit. Tell the adviser.",
        );
      break;
    case "lapsed":
      parts.push(
        `A section 8 notice has to be followed by a court claim within 12 months of being served. This one was served on ${letterDate(inp.servedOn)}, so it ran out on ${letterDate(read.lapsesOn)}. Unless you've had court papers, the landlord would need a new notice.`,
      );
      break;
    case "valid": {
      const days = read.daysToCourt;
      const lead =
        read.earliestCourt === inp.servedOn
          ? `On ${read.grounds.length > 1 ? "the grounds used" : read.grounds[0].short}, the landlord can apply to court as soon as the notice is served. That still isn't an eviction.`
          : `The date in the notice, ${letterDate(read.earliestCourt)}, is the earliest day the landlord can apply to court${days !== null && days > 0 ? `, ${days} days from now` : ""}. It is not the day you have to leave.`;
      parts.push(
        `${lead} After that, they have to make a claim; the court sets a hearing at least four weeks later; and if it makes a possession order, that usually gives 14 days, or up to six weeks for exceptional hardship. Even if every step moved at once, you couldn't be made to leave before ${letterDate(read.earliestOut)}. In practice it's usually months more, and if you're still there after the order, the landlord needs bailiffs with a warrant.`,
      );
      const a = read.arrears;
      if (a && read.grounds.some((g) => g.id === "g8")) {
        if (!a.meets)
          parts.push(
            `Ground 8 is the one a court has to follow, and it needs at least ${money(a.threshold)} owed (${inp.period === "week" ? "13 weeks'" : "three months'"} rent) both when the notice was served and on the day of the hearing. You owe ${money(a.owed)}, under the line. Keep paying the rent each time it falls due so it stays under, and ground 8 can't succeed at the hearing.`,
          );
        else
          parts.push(
            `Ground 8 needs at least ${money(a.threshold)} owed (${inp.period === "week" ? "13 weeks'" : "three months'"} rent) both when the notice was served and on the day of the hearing. You owe ${money(a.owed)}. Pay ${money(a.payToDrop)} off before the hearing (leaving ${money(a.after)}) and keep paying the rent each time it falls due, and the court no longer has to evict you on that ground. The landlord can still ask under grounds 10 and 11, but there the court decides what's reasonable, and a tenant who's paying usually gets a suspended order, not an eviction.`,
            "Missing a payment in the meantime adds it to the arrears and puts you back over the line. Get a dated statement of the account from the landlord, and pay by a method that leaves a record.",
          );
      }
      const mg = read.mandatoryGrounds.filter((g) => g.id !== "g8");
      if (mg.length)
        parts.push(
          `${capital(listOf(mg.map((g) => g.short)))} ${mg.length > 1 ? "are" : "is"} mandatory: if the landlord proves it, the court has to order possession. Your best defences are the notice itself, the facts the landlord has to prove, and (on most grounds) the deposit.`,
        );
      else if (!read.mandatory)
        parts.push(
          `${read.grounds.some((g) => g.id === "g8") ? "With ground 8 out of the way, what's left is discretionary" : "Every ground in this notice is discretionary"}: even if the landlord proves it, the court has to decide it's reasonable to evict you. It can adjourn, or make an order that's suspended for as long as you keep to conditions (${read.grounds.some((g) => g.arrears) ? "the rent plus something off the arrears, say" : "no further complaints, or a repair put right, say"}). Show you've acted on the problem.`,
        );
      if (read.grounds.some((g) => g.id === "g1" || g.id === "g1A"))
        parts.push(
          "If the landlord says they're selling or moving in, they can't then re-let the home for 12 months, and misusing those grounds can be fined. If you'd like more time, ask: a landlord who's selling usually prefers a tenant who leaves on an agreed date to one who waits for the bailiffs.",
        );
      if (read.depositFlag)
        parts.push(
          inp.deposit === "not"
            ? "Your deposit wasn't protected. On most grounds, a court can't make a possession order until the landlord protects it or returns it, and you may also be owed one to three times the deposit. Tell the adviser: it's one of the strongest points you have."
            : "",
        );
      if (inp.aim === "go")
        parts.push(
          "If you'd rather go, agree the date in writing. Staying until the bailiffs costs the landlord time and can add their court costs (often hundreds of pounds) to what you owe, so a date that suits you both is worth asking for. Tell the council before you move: leaving on an agreed date shouldn't count against you, but ask them first.",
        );
      else
        parts.push(
          `Keep paying the rent and keep living there. Contact the council's housing team ${read.councilFrom > today ? `now, and no later than ${letterDate(read.councilFrom)}, when the notice is 56 days from its date and they owe you help to keep your home or find another` : "now: the notice is within 56 days of its date, so they owe you help to keep your home or find another"}. Don't move out before you've talked to them.`,
        );
      break;
    }
  }
  const showDoubts = read.status === "valid" || read.status === "invalid";
  const doubts = read.doubts.filter(Boolean);
  if (showDoubts && doubts.length) parts.push("Worth checking:", ...doubts.map((d) => `• ${d}`));
  return parts.filter(Boolean).join("\n\n");
}

/** The steps from here, with the earliest date each could come. */
export type Step = { title: string; on: string; note: string; done?: boolean };

export function timelineOf(inp: NoticeInputs, read: NoticeRead, today = todayISO()): Step[] {
  if (read.status !== "valid") return [];
  const steps: Step[] = [
    { title: "The notice reached you", on: inp.servedOn, note: "Nothing about your tenancy has changed yet.", done: true },
  ];
  steps.push({
    title: "The council owes you help",
    on: read.councilFrom > inp.servedOn ? read.councilFrom : inp.servedOn,
    note: "From 56 days before the date in the notice. You can ask sooner.",
    done: read.councilFrom <= today,
  });
  steps.push({
    title: "The date in the notice",
    on: read.earliestCourt,
    note: "The earliest the landlord can apply to court. Not the day you leave.",
    done: read.earliestCourt <= today,
  });
  steps.push({
    title: "The earliest hearing",
    on: addDaysISO(read.earliestCourt, HEARING_MIN_DAYS),
    note: "At least four weeks after a claim; you'd get papers and a date. Usually later.",
  });
  steps.push({
    title: "The earliest you could have to leave",
    on: read.earliestOut,
    note: "If an order is made, usually 14 days; up to six weeks for exceptional hardship. After that, only bailiffs with a warrant.",
  });
  return steps;
}

export type NoticeLetter = { id: string; title: string; note: string; text: string };

function signOff(): string[] {
  return ["", "Yours sincerely,", "", "[Your name]", "[Your address]"];
}

function dear(inp: NoticeInputs): string {
  return `Dear ${inp.landlordName.trim() || "[landlord or agent]"},`;
}

/** The letters that fit this read, most useful first. */
export function noticeLetters(inp: NoticeInputs, read: NoticeRead, today = todayISO()): NoticeLetter[] {
  const out: NoticeLetter[] = [];
  const home = homeOf(inp);
  const head = [letterDate(today), "", dear(inp), ""];
  const servedLine = isISODate(inp.servedOn) ? ` served on ${letterDate(inp.servedOn)}` : "";

  const reasons: string[] = [];
  if (read.status === "informal")
    reasons.push(
      "Since 1 May 2026, a landlord can only seek possession of an assured tenancy in England by serving a notice under section 8 of the Housing Act 1988 on Form 3A, on a ground in Schedule 2 and with the notice that ground requires, followed by a court order.",
    );
  if (read.status === "s21")
    reasons.push(
      "Section 21 of the Housing Act 1988 was repealed for assured tenancies from 1 May 2026, and a notice served before then could only be relied on in proceedings issued by 31 July 2026.",
    );
  if (read.status === "old")
    reasons.push("It was served before 1 May 2026, and proceedings on a notice served before then had to be issued by 31 July 2026.");
  if (read.status === "lapsed")
    reasons.push(`It was served more than 12 months ago, and no proceedings were issued within that time.`);
  if (read.status === "invalid") reasons.push(...read.problems);

  if (reasons.length) {
    out.push({
      id: "invalid",
      title: read.status === "informal" ? "Reply to the message" : "Why the notice doesn't work",
      note: "Polite and on the record. Send it in writing and keep a copy; it doesn't refuse to talk.",
      text: [
        ...head,
        `Re: ${read.status === "informal" ? "your message asking me to leave" : `your notice seeking possession${servedLine}`}, ${home}`,
        "",
        read.status === "informal"
          ? "Thank you for your message. I don't believe it ends my tenancy, because:"
          : read.status === "invalid"
            ? "I've received your notice. I don't believe it's a valid notice, because:"
            : "I've received your notice. I don't believe it can be relied on, because:",
        "",
        ...reasons.map((r) => `- ${r}`),
        "",
        "So my tenancy continues, and I'll keep paying the rent as usual. If you'd like to discuss anything about the tenancy, I'm happy to do so in writing.",
        ...signOff(),
      ].join("\n"),
    });
  }

  if (read.status === "valid") {
    const a = read.arrears;
    if (a && a.owed > 0 && read.grounds.some((g) => g.arrears)) {
      const payBy = addDaysISO(today, 14);
      const lump = a.meets ? a.payToDrop : 0;
      out.push({
        id: "arrears",
        title: "An offer on the arrears",
        note: "Offer only what you can keep to: a broken plan is worse than a small one. Fill in the monthly figure after a free budget check (StepChange, National Debtline or Citizens Advice).",
        text: [
          ...head,
          `Re: rent arrears and your notice${servedLine}, ${home}`,
          "",
          `I've received your notice. I'm sorry the rent has fallen behind, and I want to put it right and stay in my home.`,
          "",
          `I understand the arrears are ${money(a.owed)}. Could you send me a dated statement of the account, so we're working from the same figure?`,
          "",
          "I propose:",
          ...(lump > 0 ? [`- a payment of ${money(lump)} by ${letterDate(payBy)};`] : []),
          "- to pay the rent in full each time it falls due; and",
          `- to pay [amount] a month off the remaining ${lump > 0 ? money(a.after) : "arrears"} until it's cleared.`,
          ...(inp.ucDelay === "yes" || inp.ucDelay === "unsure"
            ? ["", "Some of the arrears built up while my Universal Credit housing payment was delayed. I've asked the UC service for my payment history and will send it to you."]
            : []),
          "",
          "I'd be grateful if you'd agree this in writing and not issue court proceedings while I keep to it.",
          ...signOff(),
        ].join("\n"),
      });
    }

    if (inp.aim === "go") {
      out.push({
        id: "agree",
        title: "Agree a moving date",
        note: "Only if you've decided to go and have somewhere to go to. Talk to the council first.",
        text: [
          ...head,
          `Re: your notice seeking possession${servedLine}, ${home}`,
          "",
          "I've received your notice. I'm looking for somewhere else to live, and I'd like us to agree a date for me to leave rather than go to court.",
          "",
          "I can leave by [date]. Could you confirm in writing that you agree, that the tenancy will end on that date, and that you'll return my deposit through the scheme promptly after I go? I'd also be grateful for a reference for my next landlord.",
          "",
          "Until then I'll keep paying the rent as usual.",
          ...signOff(),
        ].join("\n"),
      });
    } else if (!(read.arrears && read.grounds.some((g) => g.arrears))) {
      out.push({
        id: "acknowledge",
        title: "Acknowledge it, on the record",
        note: "Calm and short. It doesn't argue; it tells them you know how this works.",
        text: [
          ...head,
          `Re: your notice seeking possession${servedLine}, ${home}`,
          "",
          `I've received your notice relying on ${listOf(read.grounds.map((g) => g.short))}.`,
          "",
          "I'm taking advice. In the meantime I'll keep paying the rent and looking after the home, and I understand the tenancy continues unless and until a court makes an order.",
          "",
          ...(read.grounds.some((g) => g.id === "g1A")
            ? ["Could you let me know what stage the sale has reached, and whether you'd be open to me staying until it completes? Knowing the timing would help me plan.", ""]
            : read.grounds.some((g) => g.id === "g1")
              ? ["Could you let me know who will be moving in and when, so I can plan?", ""]
              : []),
          "Please contact me in writing about the tenancy.",
          ...signOff(),
        ].join("\n"),
      });
    }

    out.push({
      id: "council",
      title: "To the council's housing team",
      note: "Email or use their online form. Attach a copy of the notice. Ask for a written personalised housing plan.",
      text: [
        letterDate(today),
        "",
        "Dear Housing Options team,",
        "",
        `Re: threatened with homelessness: section 8 notice, ${home}`,
        "",
        `I rent privately, and on ${letterDate(inp.servedOn)} my landlord gave me a section 8 notice (Form 3A) relying on ${listOf(read.grounds.map((g) => g.short))}. ${read.earliestCourt === inp.servedOn ? "It says they can go to court straight away." : `The date in the notice is ${letterDate(read.earliestCourt)}.`} A copy is attached.`,
        "",
        read.councilFrom <= today
          ? `As ${read.earliestCourt === inp.servedOn ? "they can go to court now" : "that date is within 56 days"}, I believe I'm threatened with homelessness and that you owe me the prevention duty under section 195 of the Housing Act 1996. Please accept my application and assess my needs.`
          : `I'd like to apply for help now. From ${letterDate(read.councilFrom)} the date in the notice will be within 56 days, and I understand I'll be threatened with homelessness under section 175 of the Housing Act 1996.`,
        "",
        "I'd like help to stay in my home if that's possible, and to find somewhere else if it isn't. Please tell me what you need from me.",
        "",
        "Yours faithfully,",
        "",
        "[Your name]",
        "[Your address, phone and email]",
      ].join("\n"),
    });
  }
  return out;
}

/** What to keep or gather. */
export function evidenceLines(inp: NoticeInputs, read: NoticeRead): string[] {
  if (read.status === "elsewhere" || read.status === "social" || read.status === "lodger") return [];
  const out = ["The notice or message, and the envelope, email or photo showing the day it arrived."];
  out.push("Your tenancy agreement, and anything showing the day the tenancy began.");
  if (read.arrears || read.grounds.some((g) => g.arrears))
    out.push("A record of every rent payment (bank statements), and any Universal Credit payment history.");
  out.push("Your deposit certificate or the scheme's confirmation (DPS, mydeposits or TDS), or proof there wasn't one.");
  out.push("Copies of repair requests and the landlord's replies, with dates and photos.");
  out.push("A copy of every letter you send, and proof you sent it.");
  return out;
}

/** The dates worth a calendar entry. */
export function remindersOf(read: NoticeRead, today: string, inp: NoticeInputs): { on: string; title: string; body: string }[] {
  const out: { on: string; title: string; body: string }[] = [];
  if (read.status === "court" && isISODate(inp.hearingOn) && inp.hearingOn >= today) {
    out.push({
      on: inp.hearingOn,
      title: "Possession hearing: go, and ask for the duty adviser",
      body: "Arrive early and ask for the Housing Loss Prevention Advice Service duty adviser. Bring the notice, rent records and repair evidence.",
    });
    return out;
  }
  if (read.status !== "valid") return out;
  if (read.councilFrom > today)
    out.push({
      on: read.councilFrom,
      title: "The council now owes you help (56 days before the notice date)",
      body: "If you haven't already, apply to the council's housing team today, with a copy of the notice.",
    });
  if (read.earliestCourt >= today)
    out.push({
      on: read.earliestCourt,
      title: "Earliest the landlord can go to court (not the day you leave)",
      body: "Keep paying rent. If court papers arrive, fill in the defence form within 14 days and contact the Housing Loss Prevention Advice Service.",
    });
  if (read.lapsesOn >= today)
    out.push({
      on: read.lapsesOn,
      title: "The notice lapses today if there's been no court claim",
      body: "A section 8 notice has to be followed by a court claim within 12 months of service.",
    });
  return out;
}

export function noticeRule(): string {
  return "When a notice to leave arrives, I check it before I pack: the form, the ground and the date. The date is when the landlord can ask a court, not when I have to go. I keep paying rent, contact the council and a free adviser, and only leave on a date I've chosen or a court has set.";
}

export function noticeSummary(inp: NoticeInputs, read: NoticeRead, today = todayISO()): string {
  const lines: string[] = [];
  lines.push(`A notice to leave${inp.what.trim() ? `: ${inp.what.trim()}` : ""}`);
  lines.push("", noticeHeadline(inp, read), "", noticeBody(inp, read, today));
  const steps = timelineOf(inp, read, today);
  if (steps.length) {
    lines.push("", "What happens next, at the earliest:");
    for (const s of steps) lines.push(`- ${letterDate(s.on)}: ${s.title}. ${s.note}`);
  }
  for (const l of noticeLetters(inp, read, today)) lines.push("", `${l.title}:`, "", l.text);
  lines.push("", noticeRule());
  return lines.join("\n");
}

const REGIONS: NoticeRegion[] = ["eng", "wales", "scot", "ni"];
const LANDLORDS: NoticeLandlord[] = ["private", "social", "lodger"];
const KINDS: NoticeKind[] = ["form3a", "s21", "informal", "unsure", "court"];
const GROUND_IDS: GroundId[] = GROUNDS.map((g) => g.id);
const PERIODS: NoticeRentPeriod[] = ["month", "week", "fourweek"];
const DEPOSITS: DepositState[] = ["protected", "not", "unsure", "none"];
const YNU: YesNoUnsure[] = ["yes", "no", "unsure"];
const AIMS: Aim[] = ["stay", "go", "unsure"];

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
export function parseNoticeInputs(raw: unknown): NoticeInputs {
  if (!raw || typeof raw !== "object") return BLANK_NOTICE;
  const v = raw as Record<string, unknown>;
  const grounds = Array.isArray(v.grounds)
    ? GROUND_IDS.filter((id) => (v.grounds as unknown[]).includes(id))
    : [];
  return {
    what: str(v.what),
    landlordName: str(v.landlordName),
    region: oneOf(v.region, REGIONS),
    landlord: oneOf(v.landlord, LANDLORDS),
    kind: oneOf(v.kind, KINDS),
    servedOn: date(v.servedOn),
    tenancyStart: date(v.tenancyStart),
    notBefore: date(v.notBefore),
    grounds,
    hearingOn: date(v.hearingOn),
    period: oneOf(v.period, PERIODS),
    rent: str(v.rent, 40),
    owed: str(v.owed, 40),
    ucDelay: oneOf(v.ucDelay, YNU),
    deposit: oneOf(v.deposit, DEPOSITS),
    aim: oneOf(v.aim, AIMS),
  };
}

/**
 * The worked example: £950 a month, £3,100 behind after a run of short weeks,
 * and a Form 3A on grounds 8, 10 and 11 that arrived ten days ago with a date
 * four weeks after it.
 */
export function noticeExample(today = todayISO()): NoticeInputs {
  const served = addDaysISO(today, -10);
  return {
    what: "the flat on Mill Lane",
    landlordName: "",
    region: "eng",
    landlord: "private",
    kind: "form3a",
    servedOn: served,
    tenancyStart: addMonthsISO(today, -30),
    notBefore: addDaysISO(served, 28),
    grounds: ["g8", "g10"],
    hearingOn: "",
    period: "month",
    rent: "£950",
    owed: "£3,100",
    ucDelay: "no",
    deposit: "protected",
    aim: "stay",
  };
}
