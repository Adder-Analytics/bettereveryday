/**
 * The read behind "Dismissed: Do You Have a Claim, and By When?" (/dismissed).
 *
 * Someone has been sacked, given notice, or pushed into resigning, and the
 * first two things they "know" are usually wrong in 2026. They know you need
 * two years to claim unfair dismissal, and they know the deadline is three
 * months. The deadline became six months for jobs ending from 1 October 2026,
 * and the two years becomes six months for jobs ending from 1 January 2027.
 * Several claims never needed any service at all.
 *
 * Both rules are notches: one day either side of a line changes everything.
 * And the line is measured from a date the employer doesn't choose alone.
 * When notice is cut short or paid in lieu, the law adds the statutory minimum
 * notice to work out service (ERA 1996 s.97(2), and s.97(4) for someone forced
 * to resign), so a dismissal "with immediate effect" in late December can land
 * in 2027 for the qualifying period.
 *
 * The read's first job is the clock: the date to contact Acas by, which an
 * internal appeal doesn't pause. Its second job is the line: how much service
 * the law counts, against the threshold that applies, with the days either
 * side. Then each claim in turn, and the letters.
 *
 * Great Britain, with a short read for Northern Ireland. What agreed across
 * the sources I could reach (gov.uk, Acas and legislation.gov.uk don't resolve
 * from the sandbox, so this is law firms' and HR publishers' summaries of the
 * Employment Rights Act 2025 and its commencement regulations):
 *
 *   - Tribunal time limits (GB): six months less a day where the relevant date
 *     (for dismissal, the effective date of termination) is on or after
 *     1 October 2026; three months less a day before. Acas's worked examples:
 *     30 September 2026 runs to 29 December 2026; 1 October 2026 to 31 March
 *     2027. Sources agree for unfair dismissal and wages; most say the same
 *     for discrimination and for breach of contract in the tribunal, one
 *     disagrees on discrimination, so the read flags it.
 *   - Acas early conciliation comes first, and is required. Day A (contact)
 *     to Day B (certificate) doesn't count, and if the limit would expire
 *     within a month after Day B, you get until a month after Day B. The
 *     conciliation period itself is up to 12 weeks for notifications from
 *     1 December 2025. If only the employer contacts Acas, the clock doesn't
 *     stop.
 *   - Unfair dismissal qualifying period: two years; six months where the EDT
 *     is on or after 1 January 2027. s.97(2) extends the EDT by statutory
 *     notice not given, including a payment in lieu, for this purpose. Law
 *     firms agree a no-notice dismissal from about 25 December 2026 carries
 *     into 2027; they disagree on whether those carried-forward cases keep the
 *     compensation cap, so the read flags it.
 *   - No qualifying period for automatically unfair reasons: pregnancy and
 *     family leave, whistleblowing, health and safety, trade union reasons,
 *     asserting a statutory right (pay, holiday, sick pay, minimum wage,
 *     flexible working), among others. Discrimination (Equality Act 2010)
 *     needs no service and is a separate claim.
 *   - Statutory notice: a week after a month's service, then a week per full
 *     year, up to twelve. Notice pay is owed unless it was genuinely gross
 *     misconduct.
 *   - Basic award: like statutory redundancy pay (half, one or one and a half
 *     weeks per year by age, at most 20 years), a week's pay capped at £751
 *     from 6 April 2026 (£719 before). Compensatory award cap: the lower of
 *     £123,543 or 52 weeks' gross pay, removed for EDTs from 1 January 2027.
 *     Up to 25% more (or less) for an unreasonable failure to follow the Acas
 *     Code on discipline and grievance.
 *   - Northern Ireland: one year's service, three months, the Labour
 *     Relations Agency. The 2025 Act doesn't extend there.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";
import { money } from "./rent";
import { fullYears, redundancyWeeks, statutoryNoticeWeeks } from "./redundancy";

export { actDate, isISODate, letterDate, money, todayISO };

/** The Employment Rights Act 2025 six-month tribunal limit (GB). */
export const SIX_MONTHS_FROM = "2026-10-01";
/** Six months' service for unfair dismissal, and no compensation cap (GB). */
export const SHORT_QUALIFYING_FROM = "2027-01-01";
/** Acas early conciliation, at most, for notifications from 1 December 2025. */
export const EC_DAYS = 84;
export const COMP_CAP = 123543;

export type Region = "" | "gb" | "ni";
export type Stage = "" | "dismissed" | "resigned" | "pending";
export type Notice = "" | "worked" | "pilon" | "none";
export type Reason = "" | "conduct" | "gross" | "capability" | "sickness" | "redundancy" | "none" | "other";
export type Process = "" | "fair" | "some" | "none";
export type Appeal = "" | "yes" | "no";
export type PayBasis = "" | "week" | "month" | "year";

/** What might really be behind it. Each id is one checkbox. */
export const FLAGS = [
  { id: "pregnancy", label: "I'm pregnant, on or back from maternity, or asked about family leave", auto: true, discrim: true },
  { id: "right", label: "I'd asked about pay, holiday, sick pay, the minimum wage, hours or flexible working", auto: true, discrim: false },
  { id: "whistle", label: "I'd reported wrongdoing: fraud, danger, a legal breach, a cover-up", auto: true, discrim: false },
  { id: "safety", label: "I'd raised a health and safety concern, or refused to work somewhere unsafe", auto: true, discrim: false },
  { id: "union", label: "I'm in a union, or took part in union activity", auto: true, discrim: false },
  { id: "disability", label: "I have a health condition or disability, or had been off sick with one", auto: false, discrim: true },
  { id: "protected", label: "My age, race, sex, religion, sexuality or gender identity seemed to play a part", auto: false, discrim: true },
] as const;
export type FlagId = (typeof FLAGS)[number]["id"];

export type DismissedInputs = {
  employer: string;
  region: Region;
  stage: Stage;
  /** The day the job started. */
  started: string;
  /** The day you were told (or resigned). For "pending", the meeting date, optional. */
  toldOn: string;
  notice: Notice;
  /** The last day of employment, for worked notice or a resignation. */
  endsOn: string;
  reason: Reason;
  /** Comma-separated FlagIds. */
  flags: string;
  process: Process;
  appeal: Appeal;
  /** Date of birth, for the basic award. Optional. */
  born: string;
  payBasis: PayBasis;
  pay: string;
  /** Notice in the contract, in weeks. Optional. */
  contractWeeks: string;
  /** The day you contacted Acas (Day A). Optional. */
  acasOn: string;
  /** The day the certificate came (Day B). Optional. */
  certOn: string;
};

export const BLANK_DISMISSED: DismissedInputs = {
  employer: "",
  region: "",
  stage: "",
  started: "",
  toldOn: "",
  notice: "",
  endsOn: "",
  reason: "",
  flags: "",
  process: "",
  appeal: "",
  born: "",
  payBasis: "",
  pay: "",
  contractWeeks: "",
  acasOn: "",
  certOn: "",
};

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

function num(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export function numInvalid(raw: string): boolean {
  return raw.trim() !== "" && num(raw) === null;
}

export function flagsOf(inp: DismissedInputs): FlagId[] {
  const ids = FLAGS.map((f) => f.id as string);
  return inp.flags
    .split(",")
    .filter((s) => ids.includes(s))
    .map((s) => s as FlagId);
}

export function toggleFlag(flags: string, id: FlagId): string {
  const set = new Set(flags.split(",").filter(Boolean));
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return FLAGS.map((f) => f.id)
    .filter((f) => set.has(f))
    .join(",");
}

export function weeklyPay(inp: DismissedInputs): number | null {
  const n = parseMoney(inp.pay);
  if (n === null || n <= 0 || !inp.payBasis) return null;
  if (inp.payBasis === "week") return n;
  if (inp.payBasis === "month") return (n * 12) / 52;
  return n / 52;
}

/** "1 year and 7 months", "5 months", "3 weeks": service in words. */
export function serviceWords(from: string, to: string): string {
  if (!isISODate(from) || !isISODate(to) || to < from) return "no time";
  // Service runs to the end of the last day, so count from the day after.
  const end = addDaysISO(to, 1);
  const y = fullYears(from, end);
  let m = 0;
  while (m < 12 && addMonthsISO(from, 12 * y + m + 1) <= end) m++;
  if (y === 0 && m === 0) {
    const w = Math.floor(daysBetween(from, end) / 7);
    return w <= 0 ? "less than a week" : `${w} ${w === 1 ? "week" : "weeks"}`;
  }
  const ys = y ? `${y} ${y === 1 ? "year" : "years"}` : "";
  const ms = m ? `${m} ${m === 1 ? "month" : "months"}` : "";
  return ys && ms ? `${ys} and ${ms}` : ys || ms;
}

/** The last day of employment the read works from. */
export function edtOf(inp: DismissedInputs): string {
  if (inp.stage === "pending") return "";
  if (inp.stage === "resigned") return isISODate(inp.endsOn) ? inp.endsOn : inp.toldOn;
  if (inp.notice === "worked") return isISODate(inp.endsOn) ? inp.endsOn : "";
  return inp.toldOn;
}

/**
 * The service needed for ordinary unfair dismissal, as the first EDT that
 * qualifies. GB: two years, or six months for an EDT from 1 January 2027.
 * NI: one year.
 */
export function protectedFrom(region: Region, started: string): string {
  const after = (months: number) => addDaysISO(addMonthsISO(started, months), -1);
  if (region === "ni") return after(12);
  const two = after(24);
  const six = after(6) > SHORT_QUALIFYING_FROM ? after(6) : SHORT_QUALIFYING_FROM;
  return two < six ? two : six;
}

export function qualifiesAt(region: Region, started: string, edt: string): boolean {
  if (!isISODate(started) || !isISODate(edt)) return false;
  const after = (months: number) => addDaysISO(addMonthsISO(started, months), -1);
  if (region === "ni") return after(12) <= edt;
  if (edt >= SHORT_QUALIFYING_FROM) return after(6) <= edt;
  return after(24) <= edt;
}

export type ClaimStatus = "open" | "closed" | "check";
export type Claim = {
  id: string;
  name: string;
  status: ClaimStatus;
  /** One or two sentences: why this status. */
  why: string;
  href?: string;
};

export type DateLine = { on: string; title: string; body: string };

export type DismissedRead = {
  region: "gb" | "ni";
  pending: boolean;
  edt: string;
  /** The EDT for counting service, after s.97 adds statutory notice not given. */
  qualifyingEdt: string;
  /** True when s.97 moved the date. */
  extended: boolean;
  statNoticeWeeks: number;
  service: string;
  qualifies: boolean;
  /** Qualifies only because s.97 moved the date. */
  carried: boolean;
  /** The first EDT that would qualify. */
  protectedOn: string;
  /** For an EDT that didn't qualify: days between it and the line. */
  daysShort: number;
  /** For a no-notice dismissal: the first day it would carry over the line. */
  lineWithoutNotice: string;
  autoFlags: FlagId[];
  discrimFlags: FlagId[];
  months: 3 | 6;
  /** Contact Acas by this date (the time limit with no pause). */
  acasBy: string;
  /** The claim deadline with Acas's pause, if Acas was contacted in time. */
  claimBy: string;
  /** claimBy depends on a certificate that hasn't come: the latest it could be. */
  claimByEstimate: boolean;
  acasLate: boolean;
  passed: boolean;
  weekly: number | null;
  weekCap: number;
  basicWeeks: number;
  basicAward: number | null;
  compCap: number | null;
  noticeOwedWeeks: number;
  noticeServedWeeks: number;
  noticeShortWeeks: number;
  noticeShort: number | null;
  claims: Claim[];
  doubts: string[];
};

export function dismissedReady(inp: DismissedInputs): boolean {
  if (!inp.region || !inp.stage || !isISODate(inp.started)) return false;
  if (inp.stage === "pending") return true;
  if (!isISODate(inp.toldOn)) return false;
  if (inp.stage === "dismissed" && !inp.notice) return false;
  if (inp.stage === "dismissed" && inp.notice === "worked" && !isISODate(inp.endsOn)) return false;
  return true;
}

export function readDismissed(inp: DismissedInputs, today = todayISO()): DismissedRead | null {
  if (!dismissedReady(inp)) return null;
  const region = inp.region === "ni" ? "ni" : "gb";
  const pending = inp.stage === "pending";
  const doubts: string[] = [];
  const flags = flagsOf(inp);
  const autoFlags = flags.filter((f) => FLAGS.find((x) => x.id === f)?.auto);
  const discrimFlags = flags.filter((f) => FLAGS.find((x) => x.id === f)?.discrim);
  const weekly = weeklyPay(inp);

  const edt = pending ? "" : edtOf(inp);
  const toldOn = pending ? (isISODate(inp.toldOn) ? inp.toldOn : today) : inp.toldOn;
  const statNoticeWeeks = statutoryNoticeWeeks(inp.started, toldOn);

  // s.97(2)/(4): statutory notice not given still counts towards service.
  let qualifyingEdt = edt;
  if (!pending) {
    const statEnd = addDaysISO(toldOn, statNoticeWeeks * 7);
    if (statNoticeWeeks > 0 && statEnd > edt) qualifyingEdt = statEnd;
  }
  const extended = qualifyingEdt !== edt;
  const protectedOn = protectedFrom(region, inp.started);
  const qualifies = !pending && qualifiesAt(region, inp.started, qualifyingEdt);
  const carried = qualifies && !qualifiesAt(region, inp.started, edt);
  const daysShort = !pending && !qualifies ? Math.max(0, daysBetween(qualifyingEdt, protectedOn)) : 0;
  const lineNotice = statutoryNoticeWeeks(inp.started, protectedOn);
  const lineWithoutNotice = addDaysISO(protectedOn, -7 * lineNotice);

  const base = pending ? addDaysISO(today, 0) : edt;
  const months: 3 | 6 = region === "gb" && base >= SIX_MONTHS_FROM ? 6 : 3;
  const acasBy = pending ? "" : addDaysISO(addMonthsISO(edt, months), -1);
  let claimBy = acasBy;
  let claimByEstimate = false;
  const acasLate = !pending && isISODate(inp.acasOn) && inp.acasOn > acasBy;
  if (!pending && isISODate(inp.acasOn) && !acasLate) {
    const certKnown = isISODate(inp.certOn) && inp.certOn >= inp.acasOn;
    const cert = certKnown ? inp.certOn : addDaysISO(inp.acasOn, EC_DAYS);
    claimByEstimate = !certKnown;
    const paused = addDaysISO(acasBy, daysBetween(inp.acasOn, cert));
    const monthAfter = addMonthsISO(cert, 1);
    claimBy = paused > monthAfter ? paused : monthAfter;
  }
  const passed = !pending && (acasLate || (!isISODate(inp.acasOn) && today > acasBy) || today > claimBy);

  // Notice pay.
  const contract = num(inp.contractWeeks);
  const noticeOwedWeeks = Math.max(statNoticeWeeks, contract ?? 0);
  let noticeServedWeeks = 0;
  if (!pending) {
    if (inp.stage === "resigned") noticeServedWeeks = noticeOwedWeeks;
    else if (inp.notice === "pilon") noticeServedWeeks = noticeOwedWeeks;
    else if (inp.notice === "worked") noticeServedWeeks = Math.round((daysBetween(toldOn, edt) / 7) * 10) / 10;
  }
  const noticeShortWeeks =
    inp.stage === "dismissed" ? Math.max(0, Math.round((noticeOwedWeeks - noticeServedWeeks) * 10) / 10) : 0;
  const noticeShort = weekly !== null && noticeShortWeeks >= 0.5 ? noticeShortWeeks * weekly : null;

  // Awards.
  const capDate = edt || today;
  const weekCap = region === "ni" ? 783 : capDate >= "2026-04-06" ? 751 : 719;
  const years = edt ? fullYears(inp.started, addDaysISO(edt, 1)) : 0;
  const basicWeeks = isISODate(inp.born) && edt && years > 0 ? redundancyWeeks(inp.born, addDaysISO(edt, 1), years) : 0;
  const unfairPossible = qualifies || autoFlags.length > 0;
  const basicAward =
    !pending && unfairPossible && weekly !== null && isISODate(inp.born) ? basicWeeks * Math.min(weekly, weekCap) : null;
  const compCap =
    region === "gb" && edt && edt >= SHORT_QUALIFYING_FROM
      ? null
      : weekly !== null
        ? Math.min(region === "ni" ? 123785 : COMP_CAP, 52 * weekly)
        : region === "ni"
          ? 123785
          : COMP_CAP;

  // The claims, one by one.
  const claims: Claim[] = [];
  const need = region === "ni" ? "one year" : qualifyingEdt >= SHORT_QUALIFYING_FROM || pending ? "six months" : "two years";
  const unfairName = inp.stage === "resigned" ? "Constructive unfair dismissal" : "Unfair dismissal";
  if (pending) {
    claims.push({
      id: "unfair",
      name: unfairName,
      status: today >= protectedOn ? "open" : "check",
      why:
        today >= protectedOn
          ? `You already have the service (${serviceWords(inp.started, today)}). A dismissal from here has to be for a fair reason and done fairly.`
          : `You'd be covered for a job ending on or after ${letterDate(protectedOn)}. ${region === "gb" ? `A dismissal without notice from ${letterDate(lineWithoutNotice)} already carries over that line, because the law adds the statutory notice.` : ""}`,
    });
  } else if (qualifies) {
    claims.push({
      id: "unfair",
      name: unfairName,
      status: "open",
      why: carried
        ? `The law counts your service to ${letterDate(qualifyingEdt)}, adding the ${statNoticeWeeks}-week statutory notice you weren't given, which makes ${serviceWords(inp.started, qualifyingEdt)}: over the ${need} needed.`
        : inp.stage === "resigned"
          ? `You have ${serviceWords(inp.started, qualifyingEdt)}, over the ${need} needed. The question is whether what the employer did was serious enough to justify resigning (see below).`
          : `You have ${serviceWords(inp.started, qualifyingEdt)}, over the ${need} needed. The employer has to show a fair reason and a fair process.`,
    });
  } else {
    claims.push({
      id: "unfair",
      name: unfairName,
      status: autoFlags.length ? "check" : "closed",
      why: `The law counts ${serviceWords(inp.started, qualifyingEdt)} (to ${letterDate(qualifyingEdt)}). ${
        region === "gb" && protectedOn === SHORT_QUALIFYING_FROM
          ? `This claim needs two years for a job ending before 1 January 2027 and six months from then, so you'd have been covered ${daysShort} ${daysShort === 1 ? "day" : "days"} later.`
          : `This claim needs ${need}, which you'd have reached ${daysShort} ${daysShort === 1 ? "day" : "days"} later.`
      } ${autoFlags.length ? "But the reasons below need no service at all." : "Other claims below don't need any service."}`,
    });
  }
  if (autoFlags.length) {
    claims.push({
      id: "auto",
      name: "Automatically unfair dismissal",
      status: pending ? "check" : "open",
      why: "Dismissal for this reason is unfair whatever your length of service. You'd need to show it was the main reason, so write down now what you raised, when, and to whom, and when things changed.",
    });
  }
  if (discrimFlags.length) {
    claims.push({
      id: "discrim",
      name: "Discrimination",
      status: pending ? "check" : "open",
      why: `No service needed, and compensation isn't capped. ${discrimFlags.includes("disability") ? "With a disability, it can also be discrimination to dismiss for sickness absence without considering reasonable adjustments. " : ""}Earlier incidents have their own clock, from when they happened.`,
    });
  }
  if (!pending && inp.stage === "dismissed") {
    claims.push({
      id: "notice",
      name: "Notice pay (wrongful dismissal)",
      status: noticeShortWeeks >= 0.5 ? (inp.reason === "gross" ? "check" : "open") : "closed",
      why:
        noticeShortWeeks >= 0.5
          ? `You were owed ${noticeOwedWeeks} ${noticeOwedWeeks === 1 ? "week" : "weeks"} of notice${contract !== null && contract > statNoticeWeeks ? " under your contract" : ""} and got ${noticeServedWeeks ? `about ${noticeServedWeeks}` : "none"}${noticeShort !== null ? `: about ${money(noticeShort)} before tax` : ""}. ${inp.reason === "gross" ? "Notice isn't owed only if it really was gross misconduct, which the employer has to show." : "No service needed beyond a month."}`
          : `Your notice was ${inp.notice === "pilon" ? "paid in lieu" : "given"}. Check the payslip pays all ${noticeOwedWeeks} ${noticeOwedWeeks === 1 ? "week" : "weeks"}.`,
      href: "/leaving",
    });
  }
  if (!pending) {
    claims.push({
      id: "pay",
      name: "Unpaid wages and holiday",
      status: "check",
      why: "Holiday built up and not taken must be paid on leaving, gross misconduct or not. Check the final payslip.",
      href: "/leaving",
    });
  }
  if (inp.reason === "redundancy") {
    claims.push({
      id: "redundancy",
      name: "Redundancy pay",
      status: years >= 2 || (extended && fullYears(inp.started, addDaysISO(qualifyingEdt, 1)) >= 2) ? "open" : "closed",
      why: "Owed with two years' service, whatever else happens. Selection and consultation can make a redundancy unfair.",
      href: "/redundancy",
    });
  }

  // Doubts.
  if (carried && region === "gb" && edt < SHORT_QUALIFYING_FROM && qualifyingEdt >= SHORT_QUALIFYING_FROM) {
    doubts.push(
      "Your service only reaches the line because the statutory notice carries the date into 2027. Law firms agree that gives you the claim; they disagree on whether the old cap on compensation still applies to it."
    );
  }
  if (region === "gb" && discrimFlags.length && !pending) {
    doubts.push(
      `Most sources say discrimination claims also get ${months} months from 1 October 2026; one says three. Contacting Acas within three months of the dismissal (by ${letterDate(addDaysISO(addMonthsISO(edt, 3), -1))}) is safe either way.`
    );
  }
  if (inp.stage === "resigned") {
    doubts.push(
      "A resignation counts as a dismissal only if the employer seriously broke the contract (pay cut, demotion, bullying, a last straw after a run of things) and you resigned because of it, without waiting so long it looks like you accepted it. That's the hard part of these claims; take advice."
    );
  }
  if (inp.stage === "dismissed" && inp.notice === "none" && inp.reason !== "gross") {
    doubts.push("You were dismissed on the spot with no notice pay, but the reason given wasn't gross misconduct. Notice pay is owed unless it was.");
  }
  if (weekly === null && !pending) {
    doubts.push("No pay entered, so there are no figures for notice pay or the basic award.");
  }
  if (!pending && isISODate(inp.acasOn) && !isISODate(inp.certOn) && !acasLate) {
    doubts.push(
      `No certificate date yet, so the claim date assumes conciliation runs its full 12 weeks. When the certificate comes, enter its date: you'll always have at least a month from it.`
    );
  }
  if (!pending && years >= 2 && inp.reason !== "redundancy") {
    doubts.push(
      "With two years' service you can ask for the reasons for dismissal in writing, and they must reply within 14 days. A vague or changing reason helps a claim."
    );
  }

  return {
    region,
    pending,
    edt,
    qualifyingEdt,
    extended,
    statNoticeWeeks,
    service: pending ? serviceWords(inp.started, today) : serviceWords(inp.started, qualifyingEdt),
    qualifies,
    carried,
    protectedOn,
    daysShort,
    lineWithoutNotice,
    autoFlags,
    discrimFlags,
    months,
    acasBy,
    claimBy,
    claimByEstimate,
    acasLate,
    passed,
    weekly,
    weekCap,
    basicWeeks,
    basicAward,
    compCap,
    noticeOwedWeeks,
    noticeServedWeeks,
    noticeShortWeeks,
    noticeShort,
    claims,
    doubts,
  };
}

function daysWord(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

export function anyClaim(read: DismissedRead): boolean {
  return read.claims.some((c) => c.status !== "closed" && c.id !== "pay" && c.id !== "redundancy");
}

export function dismissedHeadline(inp: DismissedInputs, read: DismissedRead, today = todayISO()): string {
  const body = read.region === "ni" ? "the Labour Relations Agency" : "Acas";
  if (read.pending) {
    if (today >= read.protectedOn) {
      return `You already have the ${read.region === "ni" ? "year" : "service"} for unfair dismissal. If they dismiss you, they need a fair reason and a fair process, and you'd have ${read.region === "gb" ? "six" : "three"} months to act.`;
    }
    return read.region === "gb"
      ? `You're protected from unfair dismissal for a job ending on or after ${actDate(read.protectedOn)} ${read.protectedOn.slice(0, 4)}. A dismissal without notice from ${actDate(read.lineWithoutNotice)} already counts as ending then.`
      : `You're protected from unfair dismissal for a job ending on or after ${actDate(read.protectedOn)} ${read.protectedOn.slice(0, 4)}.`;
  }
  if (read.acasLate || (!isISODate(inp.acasOn) && today > read.acasBy)) {
    return `The usual deadline passed on ${actDate(read.acasBy)}. A tribunal accepts late claims only rarely, so contact ${body} today and write down why it's late.`;
  }
  if (isISODate(inp.acasOn)) {
    return read.claimByEstimate
      ? `${body} has paused the clock. If conciliation runs the full 12 weeks, your claim deadline is ${actDate(read.claimBy)} ${read.claimBy.slice(0, 4)}; enter the certificate date when it comes.`
      : `Your claim deadline is ${actDate(read.claimBy)} ${read.claimBy.slice(0, 4)}, with ${body}'s pause counted. ${daysBetween(today, read.claimBy)} days to go.`;
  }
  const left = daysBetween(today, read.acasBy);
  if (!anyClaim(read)) {
    return `On what you've entered there's no dismissal claim, but check the final pay. If anything else comes to light, ${body} by ${actDate(read.acasBy)} keeps it open.`;
  }
  return `Contact ${body} by ${actDate(read.acasBy)} ${read.acasBy.slice(0, 4)} to keep a claim open. ${inp.appeal === "yes" ? "Your appeal doesn't pause this clock." : `That's ${daysWord(left)}, and an appeal wouldn't pause it.`}`;
}

export function dismissedBody(inp: DismissedInputs, read: DismissedRead): string {
  const parts: string[] = [];
  if (read.pending) {
    parts.push(
      `You've worked there ${read.service}. The line is measured to the day your employment ends, not the day you're told, and if notice is cut short or paid in lieu, the law adds the statutory notice (${read.statNoticeWeeks || 1} week${read.statNoticeWeeks > 1 ? "s" : ""} for you) before counting.`
    );
    if (read.region === "gb" && read.protectedOn === SHORT_QUALIFYING_FROM) {
      parts.push(
        "Until 31 December 2026 unfair dismissal needs two years. From 1 January 2027 it needs six months, for any job ending on or after that day. You'd be on the right side of the line from New Year's Day."
      );
    }
    parts.push(
      "Whatever the service: if you're invited to a disciplinary meeting you're entitled to be told the case in advance, to bring a colleague or union rep, and to appeal. Ask for anything that's said in writing."
    );
    return parts.join("\n\n");
  }
  const body = read.region === "ni" ? "the Labour Relations Agency" : "Acas";
  parts.push(
    `Your employment ${read.edt < todayISO() ? "ended" : "ends"} on ${letterDate(read.edt)}. ${
      read.region === "gb" && read.months === 6
        ? "Because that's on or after 1 October 2026, you have six months less a day, not the three most people remember."
        : read.region === "gb"
          ? "Because that's before 1 October 2026, the old three-month limit applies."
          : "In Northern Ireland the limit is three months less a day."
    } The first step is early conciliation with ${body}, which is free, is required before a claim, and pauses the clock while it runs.`
  );
  if (read.extended && (read.carried || !read.qualifies)) {
    const wk = `${read.statNoticeWeeks} ${read.statNoticeWeeks === 1 ? "week" : "weeks"}`;
    const why =
      inp.stage === "resigned"
        ? `Because you resigned in response to what the employer did, the law adds the ${wk} of notice the employer would have had to give`
        : inp.notice === "pilon"
          ? `Your notice was paid in lieu rather than worked, so the law still adds the ${wk} of statutory notice`
          : `You were given less than the legal minimum notice (${wk}), so the law adds it`;
    parts.push(
      `${why}: for counting service, your employment ends on ${letterDate(read.qualifyingEdt)}.${read.carried ? " That's what takes you over the line." : ""}`
    );
  }
  if (!read.qualifies && read.daysShort > 0 && read.daysShort <= 120) {
    parts.push(
      `${read.daysShort} more ${read.daysShort === 1 ? "day" : "days"} would have given you the service for unfair dismissal.${read.region === "gb" && read.protectedOn === SHORT_QUALIFYING_FROM ? " The line is 1 January 2027, when the qualifying period falls to six months." : ""} Timing a dismissal just before the line isn't unlawful in itself, but if the real reason is one of those that need no service, the timing is worth writing down.`
    );
  }
  if (inp.appeal === "yes") {
    parts.push(
      `Go to the appeal, and contact ${body} anyway. If the appeal reinstates you, you can drop the claim. If you wait for it and it fails, the deadline doesn't move.`
    );
  } else if (inp.appeal === "no" && inp.stage === "dismissed") {
    parts.push(
      "If you were offered an appeal, use it. Not appealing can reduce compensation by up to 25%, and an appeal hearing often shows what the employer's case really is."
    );
  }
  if ((inp.process === "none" || inp.process === "some") && (inp.reason === "conduct" || inp.reason === "gross" || inp.reason === "capability")) {
    parts.push(
      "For conduct or performance, the Acas Code expects a fair process: the case put to you in writing, a meeting where you can bring someone, a decision, and an appeal. Skipping steps can make a dismissal unfair, and a tribunal can raise an award by up to 25%."
    );
  }
  return parts.join("\n\n");
}

export function datesOf(inp: DismissedInputs, read: DismissedRead): DateLine[] {
  const body = read.region === "ni" ? "the Labour Relations Agency" : "Acas";
  const out: DateLine[] = [];
  if (read.pending) {
    out.push({
      on: read.protectedOn,
      title: "Unfair dismissal protection starts",
      body: "For a job ending on or after this day.",
    });
    if (read.region === "gb" && read.lineWithoutNotice < read.protectedOn) {
      out.push({
        on: read.lineWithoutNotice,
        title: "A dismissal without notice from here carries over the line",
        body: "The statutory notice is added before service is counted.",
      });
    }
    return out.sort((a, b) => (a.on < b.on ? -1 : 1));
  }
  out.push({ on: read.edt, title: "Employment ends", body: "The time limit counts from this day." });
  if (!isISODate(inp.acasOn) || read.acasLate) {
    out.push({
      on: read.acasBy,
      title: `Last day to contact ${body}`,
      body: `Early conciliation is required before a tribunal claim and pauses the clock. An internal appeal doesn't.`,
    });
  } else {
    out.push({ on: inp.acasOn, title: `${body} contacted`, body: "The clock stopped the next day." });
    out.push({
      on: read.claimBy,
      title: read.claimByEstimate ? "Latest possible claim deadline" : "Tribunal claim deadline",
      body: read.claimByEstimate
        ? "If conciliation runs the full 12 weeks. Recheck when the certificate comes."
        : "The claim form (ET1) must be in by the end of this day.",
    });
  }
  return out.sort((a, b) => (a.on < b.on ? -1 : 1));
}

export function knowList(inp: DismissedInputs, read: DismissedRead): string[] {
  const out = [
    read.region === "ni"
      ? "Early conciliation with the Labour Relations Agency is free and confidential. Contact it online or by phone."
      : "Acas early conciliation is free. You notify online or by phone with your and the employer's details; Acas contacts them, and you don't have to agree to anything. You get a certificate number either way, which the claim form needs.",
    "Claim Universal Credit or New Style Jobseeker's Allowance straight away. Don't wait to see how the claim goes.",
    "Check your home insurance: many policies include legal expenses cover for employment disputes, which can pay for a solicitor.",
    "An employer doesn't have to give a reference, but one it gives must be accurate and fair.",
  ];
  if (inp.reason === "redundancy") out.push("Offered a settlement agreement? It's only binding if you've had independent advice, usually paid for by the employer.");
  if (read.region === "gb" && read.edt && read.edt < SHORT_QUALIFYING_FROM && read.compCap !== null)
    out.push(`Compensation for unfair dismissal is capped at the lower of ${money(COMP_CAP)} or a year's pay for jobs ending before 1 January 2027; for jobs ending from then, the cap goes.`);
  return out;
}

export type DismissedLetter = { id: string; title: string; note: string; text: string };

export function dismissedLetters(inp: DismissedInputs, read: DismissedRead, today = todayISO()): DismissedLetter[] {
  const who = inp.employer.trim();
  const dear = "Dear [name],";
  const out: DismissedLetter[] = [];
  if (read.pending) {
    out.push({
      id: "meeting",
      title: "Before a disciplinary or capability meeting",
      note: "Send it once you're invited. It asks for what the Acas Code says you should have anyway.",
      text: [
        dear,
        "",
        `Thank you for the invitation to the meeting${isISODate(inp.toldOn) ? ` on ${letterDate(inp.toldOn)}` : ""}.`,
        "",
        "So I can prepare, please send me in writing the allegations or concerns, and copies of any evidence or statements you'll rely on, before the meeting.",
        "",
        "I'd like to be accompanied by [a colleague / my trade union representative], [name]. Please confirm that's acceptable, or suggest another time within five working days if they're not available.",
        "",
        "Yours sincerely,",
        "",
        letterDate(today),
      ].join("\n"),
    });
    return out;
  }
  if (inp.stage === "dismissed") {
    out.push({
      id: "reasons",
      title: "Asking for the reason in writing",
      note: "Send it now. With two years' service (or if you were pregnant or on maternity leave) they must reply within 14 days; either way, the answer fixes their reason on paper.",
      text: [
        dear,
        "",
        `On ${letterDate(inp.toldOn)} I was told that my employment${who ? ` with ${who}` : ""} would end${read.edt !== inp.toldOn ? ` on ${letterDate(read.edt)}` : " with immediate effect"}.`,
        "",
        "Please give me a written statement of the reasons for my dismissal, under section 92 of the Employment Rights Act 1996, together with a copy of any notes of the meeting at which the decision was made.",
        "",
        "Please also confirm the amount and date of my final pay, including notice pay and any holiday I've built up and not taken.",
        "",
        "Yours sincerely,",
        "",
        letterDate(today),
      ].join("\n"),
    });
    out.push({
      id: "appeal",
      title: "Appealing the dismissal",
      note: "Check the dismissal letter for the appeal deadline, often five to ten days. The appeal doesn't pause the tribunal clock.",
      text: [
        dear,
        "",
        `I am appealing against the decision to dismiss me, given on ${letterDate(inp.toldOn)}.`,
        "",
        "My grounds are:",
        `1. ${inp.process === "fair" ? "[The decision was wrong on the evidence because ...]" : "The process was not fair: [I wasn't told the case against me in advance / I wasn't offered the chance to be accompanied / I wasn't warned dismissal was possible]."}`,
        `2. ${read.autoFlags.length || read.discrimFlags.length ? "I believe the real reason for my dismissal is [that I raised ... on (date) / my pregnancy / my health condition], not the reason given." : "[The sanction was too harsh for what happened, given my record / Other employees in the same position were not dismissed]."}`,
        "3. [Anything the decision didn't take into account.]",
        "",
        "I would like an appeal hearing with someone not involved in the original decision, and to be accompanied by [name]. Please send me any evidence the appeal will consider.",
        "",
        "Yours sincerely,",
        "",
        letterDate(today),
      ].join("\n"),
    });
  }
  if (read.noticeShort !== null && read.noticeShortWeeks >= 0.5 && inp.stage === "dismissed") {
    out.push({
      id: "notice",
      title: "Asking for the notice pay",
      note: "For notice cut short. A breach of contract claim can go to a tribunal on the same clock.",
      text: [
        dear,
        "",
        `My employment ended on ${letterDate(read.edt)}. With ${serviceWords(inp.started, read.edt)} service I was entitled to ${read.noticeOwedWeeks} ${read.noticeOwedWeeks === 1 ? "week" : "weeks"}' notice${num(inp.contractWeeks) !== null && (num(inp.contractWeeks) ?? 0) > read.statNoticeWeeks ? " under my contract" : " (Employment Rights Act 1996, section 86)"}, and received ${read.noticeServedWeeks ? `about ${read.noticeServedWeeks}` : "none"}.`,
        "",
        `Please pay the ${read.noticeShortWeeks} ${read.noticeShortWeeks === 1 ? "week" : "weeks"} outstanding, about ${money(read.noticeShort)} before tax, within 14 days. If it isn't paid, I'll contact ${read.region === "ni" ? "the Labour Relations Agency" : "Acas"} to begin early conciliation.`,
        "",
        "Yours sincerely,",
        "",
        letterDate(today),
      ].join("\n"),
    });
  }
  return out;
}

export function keepList(): string[] {
  return [
    "The dismissal letter or email, and any invitation to meetings, with their dates.",
    "Your contract and handbook (the notice clause and the disciplinary policy).",
    "Emails or messages where you raised a concern, asked about pay or rights, or told them about a pregnancy or health condition.",
    "Payslips for the last three months, and the final one.",
    "A dated timeline written now, while you remember: who said what, when.",
  ];
}

export function dismissedRule(read: DismissedRead): string {
  if (read.pending) return "My protection is measured to the day my job ends, with the statutory notice added. I know my date, and I put every meeting in writing.";
  return `The appeal is theirs; the clock is mine. I contact ${read.region === "ni" ? "the LRA" : "Acas"} by ${letterDate(read.acasBy)} whatever the appeal says.`;
}

export function dismissedSummary(inp: DismissedInputs, read: DismissedRead, today = todayISO()): string {
  const lines = [`Dismissed — ${letterDate(today)}`, "", dismissedHeadline(inp, read, today), "", dismissedBody(inp, read)];
  lines.push("", "Claims:");
  for (const c of read.claims) lines.push(`- ${c.name} (${c.status === "open" ? "open" : c.status === "closed" ? "not on these facts" : "check"}): ${c.why}`);
  const dates = datesOf(inp, read);
  if (dates.length) {
    lines.push("", "Dates:");
    for (const d of dates) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
  }
  if (read.doubts.length) {
    lines.push("", "Worth checking:");
    for (const d of read.doubts) lines.push(`- ${d}`);
  }
  lines.push("", "From bettereveryday.vercel.app/dismissed. Not legal advice.");
  return lines.join("\n");
}

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

export function parseDismissedInputs(raw: unknown): DismissedInputs {
  if (!raw || typeof raw !== "object") return BLANK_DISMISSED;
  const r = raw as Record<string, unknown>;
  const flags = str(r.flags, 200)
    .split(",")
    .filter((s) => FLAGS.some((f) => f.id === s))
    .join(",");
  return {
    employer: str(r.employer, 80),
    region: oneOf<Region>(r.region, ["gb", "ni"]),
    stage: oneOf<Stage>(r.stage, ["dismissed", "resigned", "pending"]),
    started: date(r.started),
    toldOn: date(r.toldOn),
    notice: oneOf<Notice>(r.notice, ["worked", "pilon", "none"]),
    endsOn: date(r.endsOn),
    reason: oneOf<Reason>(r.reason, ["conduct", "gross", "capability", "sickness", "redundancy", "none", "other"]),
    flags,
    process: oneOf<Process>(r.process, ["fair", "some", "none"]),
    appeal: oneOf<Appeal>(r.appeal, ["yes", "no"]),
    born: date(r.born),
    payBasis: oneOf<PayBasis>(r.payBasis, ["week", "month", "year"]),
    pay: str(r.pay, 20),
    contractWeeks: str(r.contractWeeks, 4),
    acasOn: date(r.acasOn),
    certOn: date(r.certOn),
  };
}

/**
 * The worked example: eight months in a warehouse job, dismissed "for
 * performance" with a week's pay in lieu, two weeks after asking why holiday
 * pay was short. No two years, so most people stop there; but asking about
 * holiday pay is asserting a statutory right, which needs no service, and the
 * deadline is six months, not three.
 */
export const DISMISSED_EXAMPLE: DismissedInputs = {
  ...BLANK_DISMISSED,
  employer: "Northgate Logistics",
  region: "gb",
  stage: "dismissed",
  started: "2026-03-02",
  toldOn: "2026-11-06",
  notice: "pilon",
  reason: "capability",
  flags: "right",
  process: "none",
  appeal: "yes",
  payBasis: "year",
  pay: "£26,000",
};
