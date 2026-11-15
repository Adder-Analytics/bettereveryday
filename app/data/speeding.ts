/**
 * The read behind "A Speeding Letter: What Now, and By When?" (/speeding).
 *
 * A camera flashed, or a letter has come with a photo of your number plate and
 * a form asking who was driving. Most people do one of three things: fill it
 * in and pay whatever comes next; put it in a drawer because they don't think
 * they were speeding much, or aren't sure who was driving; or go looking for a
 * technicality. The second is the expensive one. The form is a separate legal
 * duty, and not answering it is a worse offence than almost any speed.
 *
 * The rules (Great Britain), as the sources I could reach agree:
 *
 *   - Notice of Intended Prosecution (Road Traffic Offenders Act 1988, s.1):
 *     unless you were warned at the roadside, a notice has to be served on the
 *     driver or the registered keeper within 14 days of the offence. A letter
 *     sent first class is treated as arriving two working days after posting
 *     unless it can be shown otherwise. The 14 days don't help if the keeper's
 *     address couldn't be found with reasonable diligence (an out-of-date
 *     logbook) or if the person named second was named by the keeper (a
 *     company, a hire firm, a partner): that notice can come later. Nor after
 *     an accident the driver knew about (s.2).
 *   - Section 172 (Road Traffic Act 1988): the keeper must say who was driving,
 *     within 28 days. Not doing so is its own offence: 6 points and a fine of up
 *     to £1,000 (fine only for a company). There's a defence if you didn't know
 *     and couldn't with reasonable diligence have found out (s.172(4)), which
 *     courts read strictly. Naming someone who wasn't driving is perverting the
 *     course of justice, which regularly means prison.
 *   - What happens next is a police choice guided by the National Police Chiefs'
 *     Council's thresholds: usually nothing below the limit plus 10% plus 2 mph;
 *     a speed awareness course from there to the limit plus 10% plus 9 mph, if
 *     you haven't done one for an offence in the last three years (England and
 *     Wales only; Police Scotland doesn't offer courses); a conditional offer of
 *     a fixed penalty (£100 and 3 points, 28 days to accept) up to a higher line;
 *     court above that. Forces vary, so speeds near a line are read as "close".
 *     A fixed penalty isn't available if the 3 points would take you to 12.
 *   - Court (England and Wales Sentencing Council guideline): Band A, 3 points,
 *     a fine of 25–75% of weekly income after tax (starting at 50%); Band B, 4–6
 *     points or a 7–28 day ban, 75–125% (100%); Band C, 6 points or a 7–56 day
 *     ban, 125–175% (150%). Fines are capped at £1,000 (£2,500 on a motorway),
 *     cut by a third for a guilty plea at the first chance, and carry a 40%
 *     surcharge and prosecution costs. Low or benefit income is usually treated
 *     as about £120 a week. Scottish courts don't use the English guideline.
 *   - Speeding has to be prosecuted within six months of the offence.
 *   - Points count for three years from the offence and stay on the licence for
 *     four. Twelve within three years is usually a six-month ban ("totting up").
 *     Six within two years of passing a first test revokes the licence (Road
 *     Traffic (New Drivers) Act 1995): back to provisional and both tests again.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";
import { addBusinessDays } from "./collector";

export { actDate, isISODate, letterDate, todayISO };

export type Nation = "" | "ew" | "scot";
export type Limit = "" | "20" | "30" | "40" | "50" | "60" | "70";
/** What's arrived so far. */
export type Stage = "" | "flashed" | "nip" | "course" | "fpn" | "court";
/** Who the notice was addressed to. */
export type Keeper = "" | "me" | "oldaddress" | "named";
export type Drove = "" | "me" | "other" | "unsure";
export type YesNo = "" | "yes" | "no" | "unsure";

export type SpeedingInputs = {
  /** The car, in a few words or the registration: "the Corsa", "AB12 CDE". */
  what: string;
  nation: Nation;
  stage: Stage;
  offenceOn: string;
  limit: Limit;
  /** The recorded speed, as on the notice. */
  speed: string;
  /** The date printed on the Notice of Intended Prosecution. Optional. */
  nipOn: string;
  /** The date on the later letter: the offer, or the court papers. */
  letterOn: string;
  keeper: Keeper;
  drove: Drove;
  /** Points on the licence now, from offences in the last three years. */
  points: string;
  /** Passed a first driving test within two years before the offence. */
  newDriver: YesNo;
  /** Done a speed awareness course for an offence in the last three years. */
  course: YesNo;
  /** Take-home pay a week, for a court fine. Optional. */
  weekly: string;
};

export const BLANK_SPEEDING: SpeedingInputs = {
  what: "",
  nation: "",
  stage: "",
  offenceOn: "",
  limit: "",
  speed: "",
  nipOn: "",
  letterOn: "",
  keeper: "",
  drove: "",
  points: "",
  newDriver: "",
  course: "",
  weekly: "",
};

export const NIP_DAYS = 14;
export const S172_DAYS = 28;
export const OFFER_DAYS = 28;
export const SJP_DAYS = 21;
export const FIXED_PENALTY = 100;
export const COURSE_LOW = 80;
export const COURSE_HIGH = 110;
export const S172_MAX_FINE = 1000;
export const S172_POINTS = 6;
export const FINE_CAP = 1000;
export const FINE_CAP_MOTORWAY = 2500;
export const MIN_WEEKLY = 120;
export const SURCHARGE = 0.4;

/**
 * NPCC thresholds by limit: [first speed usually enforced (limit + 10% + 2),
 * top of the course band (limit + 10% + 9), top of the fixed-penalty band].
 * Above the last, court. Forces vary at the edges.
 */
export const THRESHOLDS: Record<Exclude<Limit, "">, [number, number, number]> = {
  "20": [24, 31, 35],
  "30": [35, 42, 50],
  "40": [46, 53, 66],
  "50": [57, 64, 76],
  "60": [68, 75, 86],
  "70": [79, 86, 96],
};

/** Sentencing Council bands by limit: [top of Band A, top of Band B]. Above B is C. */
export const BANDS: Record<Exclude<Limit, "">, [number, number]> = {
  "20": [30, 40],
  "30": [40, 50],
  "40": [55, 65],
  "50": [65, 75],
  "60": [80, 90],
  "70": [90, 100],
};

export type Band = "A" | "B" | "C";

export const BAND_INFO: Record<Band, { low: number; start: number; high: number; points: string; pMin: number; pMax: number; ban: string }> = {
  A: { low: 0.25, start: 0.5, high: 0.75, points: "3 points", pMin: 3, pMax: 3, ban: "" },
  B: { low: 0.75, start: 1, high: 1.25, points: "4 to 6 points", pMin: 4, pMax: 6, ban: "or a ban of 7 to 28 days" },
  C: { low: 1.25, start: 1.5, high: 1.75, points: "6 points", pMin: 6, pMax: 6, ban: "or a ban of 7 to 56 days" },
};

export type Route = "below" | "course" | "fpn" | "court";

export type CourtFine = {
  income: number;
  /** Fine range after a first-chance guilty plea. */
  low: number;
  start: number;
  high: number;
  /** The starting fine with the surcharge, after the plea discount. */
  withSurcharge: number;
  capped: boolean;
};

export type SpeedingRead = {
  speed: number;
  limit: number;
  over: number;
  /** What the police would usually do at this speed. */
  route: Route;
  /** Why it isn't the course, when the speed is in the course band. */
  noCourse: "" | "scotland" | "recent" | "unsure";
  /** Within 1 mph of a threshold, either side. */
  close: boolean;
  /** Fixed penalty ruled out by totting up. */
  tottingBlocksFpn: boolean;
  band: Band;
  fine: CourtFine | null;
  /** The last day a notice can be served. */
  line14: string;
  /** When the notice is treated as arriving. "" without its date. */
  servedOn: string;
  /** The notice looks late, and the 14 days could help. */
  late: boolean;
  /** The notice looks late but the 14 days don't help (old address, named driver). */
  lateNoHelp: boolean;
  /** Return the driver form by. "" without the notice's date. */
  s172By: string;
  offerBy: string;
  courtBy: string;
  /** Prosecution has to start by. */
  prosecuteBy: string;
  /** These points stop counting. */
  countsUntil: string;
  pointsNow: number;
  /** Points this outcome adds: [min, max]. */
  adds: [number, number];
  /** Points after, at the top of the range. */
  after: number;
  revoke: boolean;
  totting: boolean;
  /** Not naming the driver would revoke or tot up where the speed wouldn't. */
  s172Revokes: boolean;
  s172Totting: boolean;
};

const CUR = "£";

export function money(n: number): string {
  return formatMoney(n, CUR);
}

function whole(raw: string): number | null {
  const s = raw.trim().replace(/mph$/i, "").trim();
  if (!/^\d{1,3}$/.test(s)) return null;
  return Number(s);
}

export function speedInvalid(raw: string): boolean {
  if (!raw.trim()) return false;
  const n = whole(raw);
  return n === null || n < 1 || n > 200;
}

export function pointsInvalid(raw: string): boolean {
  if (!raw.trim()) return false;
  const n = whole(raw);
  return n === null || n > 30;
}

function needsLetter(s: Stage): boolean {
  return s === "course" || s === "fpn" || s === "court";
}

export function speedingReady(inp: SpeedingInputs): boolean {
  if (!inp.nation || !inp.stage || !inp.limit || !isISODate(inp.offenceOn)) return false;
  const sp = whole(inp.speed);
  if (sp === null || sp < 1 || sp > 200) return false;
  if (!inp.keeper) return false;
  if ((inp.stage === "flashed" || inp.stage === "nip") && !inp.drove) return false;
  if (pointsInvalid(inp.points)) return false;
  if (!inp.newDriver) return false;
  if (inp.nation === "ew" && !inp.course) return false;
  if (inp.nipOn && !isISODate(inp.nipOn)) return false;
  if (needsLetter(inp.stage) && inp.letterOn && !isISODate(inp.letterOn)) return false;
  return true;
}

export function routeOf(nation: Nation, limit: Exclude<Limit, "">, speed: number, course: YesNo): { route: Route; noCourse: SpeedingRead["noCourse"]; close: boolean } {
  const [a, b, c] = THRESHOLDS[limit];
  const close = [a, b + 1, c + 1].some((t) => Math.abs(speed - t) <= 1);
  if (speed < a) return { route: "below", noCourse: "", close };
  if (speed <= b) {
    if (nation === "scot") return { route: "fpn", noCourse: "scotland", close };
    if (course === "yes") return { route: "fpn", noCourse: "recent", close };
    if (course === "unsure") return { route: "course", noCourse: "unsure", close };
    return { route: "course", noCourse: "", close };
  }
  if (speed <= c) return { route: "fpn", noCourse: "", close };
  return { route: "court", noCourse: "", close };
}

export function bandOf(limit: Exclude<Limit, "">, speed: number): Band {
  const [a, b] = BANDS[limit];
  if (speed <= a) return "A";
  if (speed <= b) return "B";
  return "C";
}

export function courtFine(band: Band, weekly: number, motorway = false): CourtFine {
  const income = Math.max(MIN_WEEKLY, weekly);
  const cap = motorway ? FINE_CAP_MOTORWAY : FINE_CAP;
  const info = BAND_INFO[band];
  const plea = 2 / 3;
  const raw = (p: number) => Math.min(cap, income * p);
  const capped = income * info.high > cap;
  const start = Math.round(raw(info.start) * plea);
  return {
    income,
    low: Math.round(raw(info.low) * plea),
    start,
    high: Math.round(raw(info.high) * plea),
    withSurcharge: Math.round(start * (1 + SURCHARGE)),
    capped,
  };
}

export function readSpeeding(inp: SpeedingInputs, today = todayISO()): SpeedingRead | null {
  if (!speedingReady(inp)) return null;
  void today;
  const limitKey = inp.limit as Exclude<Limit, "">;
  const limit = Number(limitKey);
  const speed = whole(inp.speed) as number;
  const { route: base, noCourse, close } = routeOf(inp.nation, limitKey, speed, inp.course);
  const pointsNow = whole(inp.points) ?? 0;
  let route: Route = base;
  let tottingBlocksFpn = false;
  if (route === "fpn" && pointsNow + 3 >= 12) {
    route = "court";
    tottingBlocksFpn = true;
  }
  const band = bandOf(limitKey, speed);
  const weekly = parseMoney(inp.weekly);
  const fine = weekly !== null && weekly >= 0 ? courtFine(band, weekly) : null;

  const line14 = addDaysISO(inp.offenceOn, NIP_DAYS);
  const servedOn = isISODate(inp.nipOn) ? addBusinessDays(inp.nipOn, 2) : "";
  const looksLate = servedOn !== "" && servedOn > line14;
  const late = looksLate && inp.keeper === "me";
  const lateNoHelp = looksLate && inp.keeper !== "me";
  const s172By = servedOn ? addDaysISO(servedOn, S172_DAYS) : "";
  const offerBy = (inp.stage === "course" || inp.stage === "fpn") && isISODate(inp.letterOn) ? addDaysISO(inp.letterOn, OFFER_DAYS) : "";
  const courtBy = inp.stage === "court" && inp.nation === "ew" && isISODate(inp.letterOn) ? addDaysISO(inp.letterOn, SJP_DAYS) : "";

  let adds: [number, number] = [0, 0];
  if (route === "fpn") adds = [3, 3];
  if (route === "court") adds = [BAND_INFO[band].pMin, BAND_INFO[band].pMax];
  if (route === "below" || route === "course") adds = [0, 3];
  const after = pointsNow + adds[1];
  const isNew = inp.newDriver === "yes";
  const revoke = isNew && after >= 6;
  const totting = after >= 12;
  const s172After = pointsNow + S172_POINTS;

  return {
    speed,
    limit,
    over: speed - limit,
    route,
    noCourse,
    close,
    tottingBlocksFpn,
    band,
    fine,
    line14,
    servedOn,
    late,
    lateNoHelp,
    s172By,
    offerBy,
    courtBy,
    prosecuteBy: addMonthsISO(inp.offenceOn, 6),
    countsUntil: addMonthsISO(inp.offenceOn, 36),
    pointsNow,
    adds,
    after,
    revoke,
    totting,
    s172Revokes: isNew && s172After >= 6 && !revoke,
    s172Totting: s172After >= 12 && !totting,
  };
}

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

function carName(inp: SpeedingInputs): string {
  return inp.what.trim() || "the car";
}

export function routeLabel(read: SpeedingRead): string {
  switch (read.route) {
    case "below":
      return "Usually no further action";
    case "course":
      return "A speed awareness course, if offered";
    case "fpn":
      return "A fixed penalty: £100 and 3 points";
    case "court":
      return `Court: Band ${read.band}, ${BAND_INFO[read.band].points}`;
  }
}

/** One line on what this speed usually leads to. */
export function outcomeLine(inp: SpeedingInputs, read: SpeedingRead): string {
  const at = `${read.speed} in a ${read.limit}`;
  const [a, b, c] = THRESHOLDS[inp.limit as Exclude<Limit, "">];
  const near = read.close ? " It's within a mile an hour of a line, and forces draw their lines slightly differently, so treat the next rung as possible too." : "";
  switch (read.route) {
    case "below":
      return `${at} is under the ${a} mph that police usually act at, so most forces would take it no further. They can still prosecute, and a notice that's already come still has to be answered.${near}`;
    case "course":
      return `${at} sits in the band (${a} to ${b} mph) where a speed awareness course is usually offered instead of points${read.noCourse === "unsure" ? ", as long as you haven't done one for an offence in the last three years" : ""}. It's about ${money(COURSE_LOW)} to ${money(COURSE_HIGH)}, a few hours online or in a room, and no points. If it isn't offered, the next rung is a fixed penalty.${near}`;
    case "fpn": {
      const why =
        read.noCourse === "scotland"
          ? " Police Scotland doesn't offer speed awareness courses, so the usual offer is the fixed penalty."
          : read.noCourse === "recent"
            ? ` It's in the course band (${a} to ${b} mph), but a course is only offered if you haven't done one for an offence in the last three years.`
            : "";
      return `${at} usually means a conditional offer of a fixed penalty: ${money(FIXED_PENALTY)} and 3 points, with 28 days to accept. Up to ${c} mph is usually dealt with this way.${why}${near}`;
    }
    case "court": {
      const info = BAND_INFO[read.band];
      if (read.tottingBlocksFpn)
        return `${at} would normally be a fixed penalty, but 3 more points would take you to ${read.pointsNow + 3}, and a fixed penalty isn't allowed when it would reach 12. So it goes to court, where 12 points usually means a six-month ban. That needs advice before you reply.`;
      return `${at} is over the ${c} mph where police usually offer a fixed penalty, so it's likely to go to court. Under the sentencing guideline that's Band ${read.band}: ${info.points}${info.ban ? ` ${info.ban}` : ""}, and a fine based on your weekly income.${near}`;
    }
  }
}

export function speedingHeadline(inp: SpeedingInputs, read: SpeedingRead): string {
  if (read.revoke && read.route !== "below")
    return read.route === "course"
      ? "Take the course if it's offered: as a new driver, 3 points would cost you your licence."
      : `As a new driver, this takes you to ${read.after} points, and 6 revokes your licence. Get advice before you reply.`;
  if (read.tottingBlocksFpn) return `This would take you to ${read.pointsNow + 3} points, so it goes to court. Get advice before you reply.`;
  switch (inp.stage) {
    case "flashed":
      return `Watch the post until ${actDate(addDaysISO(read.line14, 3))}. If a notice comes, name the driver within 28 days.`;
    case "nip": {
      const by = read.s172By ? ` by ${actDate(read.s172By)}` : " within 28 days";
      if (read.late) return `Return the form${by} anyway, and keep the envelope: the notice looks late.`;
      if (inp.drove === "unsure") return `Name the driver${by}. Not knowing isn't an answer the law accepts easily.`;
      return `Return the form${by}. Not naming the driver is 6 points; this speed ${read.route === "course" ? "is likely a course with none" : read.route === "below" ? "may well go no further" : `carries ${read.adds[0] === read.adds[1] ? read.adds[0] : `${read.adds[0]} to ${read.adds[1]}`}`}.`;
    }
    case "course":
      return `Book the course${read.offerBy ? ` by ${actDate(read.offerBy)}` : " by the date on the offer"}: no points, about ${money(COURSE_LOW)} to ${money(COURSE_HIGH)}.`;
    case "fpn": {
      const by = read.offerBy ? ` by ${actDate(read.offerBy)}` : " within 28 days";
      const pts = read.band === "A" ? "for the same 3 points" : `and ${BAND_INFO[read.band].points} instead of 3`;
      if (read.fine && read.fine.withSurcharge > FIXED_PENALTY)
        return `Accept the fixed penalty${by}: court would cost about ${money(read.fine.withSurcharge)} plus costs, ${pts}.`;
      return `Accept the ${money(FIXED_PENALTY)} fixed penalty${by}, unless you have a real defence.`;
    }
    case "court": {
      const by = read.courtBy ? ` by ${actDate(read.courtBy)}` : inp.nation === "scot" ? " by the date on the citation" : " within 21 days";
      if (read.fine) return `Reply${by}. Pleading guilty now, the fine is about ${money(read.fine.start)}, plus a surcharge and costs.`;
      return `Reply${by}. A guilty plea at the first chance cuts the fine by a third.`;
    }
    default:
      return "";
  }
}

export function speedingBody(inp: SpeedingInputs, read: SpeedingRead): string {
  const parts: string[] = [outcomeLine(inp, read)];
  if (inp.stage === "nip" || inp.stage === "flashed") {
    parts.push(
      `Whatever the speed, the form that comes with the notice is a separate legal duty. The keeper has 28 days to say who was driving, and not doing it is an offence of its own: 6 points and a fine of up to ${money(S172_MAX_FINE)}. That's more than the speeding itself almost always carries, and it's the one outcome you choose by doing nothing.`,
    );
  }
  if (read.s172Revokes) parts.push("As a new driver, 6 points for not naming the driver would revoke your licence on their own, even though this speed might not.");
  if (read.s172Totting) parts.push(`With ${read.pointsNow} points already, 6 more for not naming the driver would reach 12 and usually a six-month ban.`);
  if (inp.stage === "course") {
    parts.push(
      `The offer letter gives a deadline to book and a later one to finish the course. Missing either usually turns it into a fixed penalty (${money(FIXED_PENALTY)} and 3 points), so book early and pick a date you can keep. A course isn't a conviction and puts nothing on your licence; insurers can ask about it, so answer truthfully if they do.`,
    );
  }
  if (inp.stage === "fpn" && read.route === "course" && !read.noCourse) {
    parts.push(
      "At this speed a course is often offered instead. It's the police's choice, not a right, but if you haven't done one in three years it's worth asking the unit on the letter before you pay.",
    );
  }
  if (inp.stage === "fpn" && !read.tottingBlocksFpn) {
    parts.push(
      "Turning down the offer means court. That's worth it only if you have a real defence (you weren't the driver and can show it, the notice was late, the limit wasn't signed properly), because a court fine is set by your income, comes with a surcharge and costs, and the points are the same or more.",
    );
  }
  if (inp.stage === "court") {
    parts.push(
      inp.nation === "scot"
        ? "Scottish courts don't use the English guideline, but the shape is similar: a guilty plea early earns a discount, and the court asks about your income. Reply by the date on the citation, or get advice if you want to plead not guilty."
        : "Court papers for speeding usually come as a Single Justice Procedure notice: you reply in writing or online, a magistrate decides without a hearing, and you can give mitigation and your income. Not replying means it's decided without you, on whatever income they assume.",
    );
  }
  return parts.join(" ");
}

/** The 14-day check, in words. */
export function fourteenDayLine(inp: SpeedingInputs, read: SpeedingRead): string {
  if (inp.keeper === "named")
    return "You were named as the driver by the car's keeper, so the 14 days were met by the notice to them. Yours can lawfully arrive weeks later.";
  if (!read.servedOn)
    return `A notice has to reach the registered keeper by ${letterDate(read.line14)}, 14 days after the offence. Add the date printed on it to check.`;
  if (read.late)
    return `The notice is dated ${letterDate(inp.nipOn)}, so it's treated as arriving on ${letterDate(read.servedOn)}, after the 14 days ran out on ${letterDate(read.line14)}. If that's right, the speeding can't be prosecuted. It doesn't excuse the driver form, so return that, and raise the late notice if it goes further. Keep the envelope and note the day it came.`;
  if (read.lateNoHelp)
    return `The notice is dated after the 14 days, but they don't help when the logbook had an old address: the law allows for a keeper the police couldn't find. Update the logbook now, since an out-of-date one is a fine of its own.`;
  return `The notice is dated ${letterDate(inp.nipOn)}, so it's treated as arriving by ${letterDate(read.servedOn)}, inside the 14 days (which ran to ${letterDate(read.line14)}). Arguments about the date won't help here.`;
}

/** What to do about the driver question. */
export function driverLine(inp: SpeedingInputs): string {
  switch (inp.drove) {
    case "me":
      return "Name yourself on the form and sign it. That's what starts the offer of a course or a fixed penalty; nothing happens until the form is back.";
    case "other":
      return "Name the driver, with their full address, on the form, and sign it. They'll get their own notice, and the 14 days don't apply to theirs. Never name someone who wasn't driving, or take points for someone who was: that's perverting the course of justice, and people go to prison for it.";
    case "unsure":
      return "You still have to reply within 28 days. Ask the police for the camera photos (most forces will send them or show them online), check diaries, messages and fuel receipts, and ask everyone who drives the car. If you still can't say, the form must go back with everything you know and what you did to find out. That's the only defence the law gives, and courts expect real effort.";
    default:
      return "";
  }
}

/** The rungs, side by side: what each answer costs. */
export type Rung = { label: string; money: string; points: string; note: string; you?: boolean; worst?: boolean };

export function rungsOf(inp: SpeedingInputs, read: SpeedingRead): Rung[] {
  const out: Rung[] = [];
  if (inp.nation === "ew")
    out.push({
      label: "Speed awareness course",
      money: `about ${money(COURSE_LOW)} to ${money(COURSE_HIGH)}`,
      points: "0",
      note: read.route === "course" ? "Usually offered at this speed" : read.noCourse === "recent" ? "Not if you've done one in three years" : "Only in the course band",
      you: read.route === "course",
    });
  out.push({
    label: "Fixed penalty",
    money: money(FIXED_PENALTY),
    points: "3",
    note: read.tottingBlocksFpn ? "Not allowed: it would reach 12 points" : read.route === "fpn" ? "Usually offered at this speed" : read.route === "course" ? "If the course isn't offered" : read.route === "court" ? "Over the line for this speed" : "If they act at all",
    you: read.route === "fpn",
  });
  const info = BAND_INFO[read.band];
  out.push({
    label: `Court, Band ${read.band}`,
    money: read.fine ? `about ${money(read.fine.start)}, plus 40% and costs` : "a share of a week's pay, plus 40% and costs",
    points: info.pMin === info.pMax ? String(info.pMin) : `${info.pMin}–${info.pMax}`,
    note: read.route === "court" ? "Likely at this speed" : "If you turn down an offer",
    you: read.route === "court",
  });
  out.push({
    label: "Not naming the driver",
    money: `up to ${money(S172_MAX_FINE)}, plus costs`,
    points: String(S172_POINTS),
    note: "What doing nothing with the form becomes",
    worst: true,
  });
  return out;
}

export type DateLine = { on: string; title: string; body: string };

export function datesOf(inp: SpeedingInputs, read: SpeedingRead): DateLine[] {
  const out: DateLine[] = [];
  out.push({ on: inp.offenceOn, title: "The offence", body: "The clocks below run from here." });
  if (inp.keeper !== "named")
    out.push({ on: read.line14, title: "Last day for the notice to reach the keeper", body: "14 days after the offence. A first-class letter counts as arriving two working days after posting." });
  if (read.s172By) out.push({ on: read.s172By, title: "Return the driver form", body: "28 days from when the notice is treated as arriving. Not replying is 6 points and up to £1,000." });
  if (read.offerBy) out.push({ on: read.offerBy, title: "Accept the offer", body: "About 28 days from the offer. Miss it and it usually goes to court." });
  if (read.courtBy) out.push({ on: read.courtBy, title: "Reply to the court papers", body: "21 days from the Single Justice Procedure notice. Plead early for a third off the fine." });
  out.push({ on: read.prosecuteBy, title: "Prosecution has to have started", body: "Six months from the offence. Papers can arrive a little after." });
  out.push({ on: read.countsUntil, title: "Any points from this stop counting", body: "Three years from the offence. They stay on the licence for four." });
  return out;
}

/** Reminders worth putting in a calendar. */
export function remindersOf(inp: SpeedingInputs, read: SpeedingRead, today: string): DateLine[] {
  const out: DateLine[] = [];
  if (inp.stage === "flashed" && read.line14 >= today)
    out.push({ on: addDaysISO(read.line14, 3), title: "Has a speeding notice come?", body: "If it came, the driver form is due 28 days from when it arrived." });
  if (read.s172By && read.s172By >= today) out.push({ on: read.s172By, title: "Return the speeding driver form", body: "Last day of the 28 days. Not replying is 6 points and up to £1,000." });
  if (read.offerBy && read.offerBy >= today) out.push({ on: read.offerBy, title: "Accept the speeding offer", body: "Course or fixed penalty: last day to accept." });
  if (read.courtBy && read.courtBy >= today) out.push({ on: read.courtBy, title: "Reply to the speeding court papers", body: "Single Justice Procedure notice: last day to reply." });
  return out;
}

/** The message to send, if one is needed. */
export function messageOf(inp: SpeedingInputs, read: SpeedingRead): { title: string; note: string; text: string } | null {
  const car = inp.what.trim() || "[registration]";
  const when = letterDate(inp.offenceOn);
  if (inp.stage === "nip" && inp.drove === "unsure") {
    return {
      title: "To send with the driver form",
      note: "Fill in the form as far as you can, sign it, and send this with it before the 28 days run out. Keep a copy and proof of posting. Replace the brackets.",
      text: [
        "Notice reference: [reference on the notice]",
        "",
        `I am the registered keeper of ${car}. I have returned the form within 28 days, but I can't say for certain who was driving on ${when} at [time on the notice].`,
        "",
        "The people who were insured to drive it and could have been driving are:",
        "[name, address]",
        "[name, address]",
        "",
        "To find out, I have: [checked my diary and messages for that day; asked each of them; looked at fuel and parking receipts].",
        "",
        "Please send me the camera photographs, which may let me identify the driver. I will reply within 7 days of receiving them.",
        "",
        "[Your name]",
        "[Date]",
      ].join("\n"),
    };
  }
  if (inp.stage === "nip" && read.late) {
    return {
      title: "A note to keep with the envelope",
      note: "Not to send now. Return the driver form as normal. If it goes to court, this note and the envelope are your evidence that the notice came late, and that's when to raise it, ideally with advice.",
      text: [
        `Notice of Intended Prosecution for ${car}, offence on ${when}.`,
        `Date printed on the notice: ${letterDate(inp.nipOn)}.`,
        "Date it arrived: [the day it came through the door].",
        "Postmark on the envelope: [date, if there is one].",
        `The 14 days for serving it ran out on ${letterDate(read.line14)}.`,
        "I was the registered keeper at this address at the time, and the logbook was up to date.",
      ].join("\n"),
    };
  }
  if (inp.stage === "court" && inp.nation === "ew") {
    const income = parseMoney(inp.weekly);
    return {
      title: "Mitigation to put with a guilty plea",
      note: "For the Single Justice Procedure form or the online plea. Short, true and specific works best. Leave out anything you can't stand behind, and fill in the income section fully: without it the court guesses.",
      text: [
        `I plead guilty to exceeding the ${read.limit} mph limit on ${when}.`,
        "",
        "[How long you've driven, and your record: \"I have driven for 12 years with no previous points.\"]",
        "[What happened, without excuses: \"I was late for work and didn't notice the limit had dropped from 40.\"]",
        "[What you've done since: \"I now use the speed-limit warning on my phone's maps.\"]",
        "[What points or a ban would do, if it matters: work that needs a licence, caring for someone.]",
        "",
        income !== null ? `My take-home pay is about ${money(income)} a week.` : "My take-home pay is about £[amount] a week.",
        "[Any large outgoings: rent, childcare, debts you're repaying.]",
        "",
        "I'd ask the court to allow time to pay, at £[amount] a month.",
      ].join("\n"),
    };
  }
  return null;
}

export function keepList(inp: SpeedingInputs): string[] {
  const out = [
    "The notice and every later letter, with the envelope, and a note of the day each one arrived.",
    "A photo or copy of the driver form before you send it, and proof of posting (or the online confirmation).",
  ];
  if (inp.drove === "unsure") out.push("Everything you checked to work out who was driving, and when.");
  if (inp.keeper === "oldaddress") out.push("Proof you've updated the logbook (V5C) address with the DVLA.");
  out.push("When it's settled: the course certificate or the fixed-penalty receipt, and the date points come off.");
  return out;
}

export function speedingRule(): string {
  return "When a speeding letter comes, I answer the question it asks, who was driving, inside 28 days and truthfully, whatever I think of the speed. Doing nothing is the one answer that costs more than all the others.";
}

export function speedingSummary(inp: SpeedingInputs, read: SpeedingRead): string {
  const lines: string[] = [];
  lines.push(`A speeding letter: ${carName(inp)}, ${read.speed} in a ${read.limit} on ${letterDate(inp.offenceOn)}`);
  lines.push("", speedingHeadline(inp, read), "", speedingBody(inp, read));
  lines.push("", fourteenDayLine(inp, read));
  const d = driverLine(inp);
  if (d && (inp.stage === "nip" || inp.stage === "flashed")) lines.push("", d);
  lines.push("", "Dates:");
  for (const r of datesOf(inp, read)) lines.push(`- ${letterDate(r.on)}: ${r.title}`);
  lines.push("", "What each answer costs:");
  for (const r of rungsOf(inp, read)) lines.push(`- ${r.label}: ${r.money}, ${r.points} points`);
  const msg = messageOf(inp, read);
  if (msg) lines.push("", `${msg.title}:`, "", msg.text);
  lines.push("", speedingRule());
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const NATIONS: Nation[] = ["ew", "scot"];
const LIMITS: Limit[] = ["20", "30", "40", "50", "60", "70"];
const STAGES: Stage[] = ["flashed", "nip", "course", "fpn", "court"];
const KEEPERS: Keeper[] = ["me", "oldaddress", "named"];
const DROVES: Drove[] = ["me", "other", "unsure"];
const YESNOS: YesNo[] = ["yes", "no", "unsure"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

export function parseSpeedingInputs(raw: unknown): SpeedingInputs {
  if (!raw || typeof raw !== "object") return BLANK_SPEEDING;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what, 80),
    nation: oneOf(v.nation, NATIONS),
    stage: oneOf(v.stage, STAGES),
    offenceOn: date(v.offenceOn),
    limit: oneOf(v.limit, LIMITS),
    speed: str(v.speed, 10),
    nipOn: date(v.nipOn),
    letterOn: date(v.letterOn),
    keeper: oneOf(v.keeper, KEEPERS),
    drove: oneOf(v.drove, DROVES),
    points: str(v.points, 4),
    newDriver: oneOf(v.newDriver, YESNOS),
    course: oneOf(v.course, YESNOS),
    weekly: str(v.weekly, 20),
  };
}

/**
 * The worked example: 37 in a 30 on a fixed camera, a shared car, and a
 * notice dated four days later. The keeper isn't sure who was driving and is
 * tempted to leave the form, since "they can't prove who it was".
 */
export function speedingExample(today = todayISO()): SpeedingInputs {
  const offenceOn = addDaysISO(today, -10);
  return {
    what: "the shared Corsa",
    nation: "ew",
    stage: "nip",
    offenceOn,
    limit: "30",
    speed: "37",
    nipOn: addDaysISO(offenceOn, 4),
    letterOn: "",
    keeper: "me",
    drove: "unsure",
    points: "0",
    newDriver: "no",
    course: "no",
    weekly: "",
  };
}
