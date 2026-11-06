/**
 * The read behind "The Landlord Won't Fix It: What Now?" (/repairs).
 *
 * The mould has been on the bedroom wall since March. You mentioned it at the
 * inspection, rang the agent twice, sent a photo once on WhatsApp. It feels
 * like they know. You live with it every day, so of course they know. On
 * paper, they may not: a landlord's duty to repair starts when they have
 * notice of the problem (O'Brien v Robinson [1973] AC 912), the "reasonable
 * time" runs from then, and every remedy that comes after (the council's
 * inspection, a complaint to the ombudsman, a claim for compensation) is built
 * on a dated report you can show someone. A call you can't prove is a report
 * nobody can find. That gap is the illusion of transparency (Gilovich,
 * Savitsky and Medvec, JPSP 1998): we overestimate how much of what we know
 * and feel is visible to other people. So the tool's first job is to put the
 * two clocks side by side: how long you've lived with it, and how long
 * they've known in writing.
 *
 * England. gov.uk, legislation.gov.uk and Shelter don't resolve from the
 * sandbox, so this rests on what agreed across law firms', councils', advice
 * services' and landlord bodies' summaries (see the session notes for
 * 6 November 2026):
 *
 *   - Private and social landlords: section 11 of the Landlord and Tenant Act
 *     1985 (structure and exterior; installations for water, gas, electricity,
 *     sanitation, heating and hot water) and section 9A (fit for human
 *     habitation through the tenancy, including damp and pests). The duty
 *     starts on notice; notice to the agent counts. There's no fixed number of
 *     days for a private landlord: a court asks what was reasonable, given
 *     how urgent and how big the job is.
 *   - Social landlords: Awaab's Law (the Hazards in Social Housing
 *     (Prescribed Requirements) (England) Regulations 2025). Since 27 October
 *     2025, for damp and mould that's a significant risk, and for any
 *     emergency hazard: investigate within 10 working days of becoming aware
 *     (24 hours for an emergency, and make it safe), a written summary within
 *     3 working days of the investigation, and safety work within 5 working
 *     days of it. Phase 2, from 30 November 2026, adds excess cold and heat,
 *     falls, fire and explosions, electrical hazards, domestic hygiene and
 *     pests, and structural collapse. Phase 3, expected in 2027, adds nearly
 *     all the rest. A tenant doesn't have to report in a particular way.
 *   - The Housing Ombudsman's Complaint Handling Code (statutory since April
 *     2024): a stage 1 reply within 10 working days, stage 2 within 20.
 *   - Awaab's Law doesn't yet apply to private landlords. The Renters' Rights
 *     Act 2025 gives the power; 2027 is the earliest start anyone gives.
 *   - Councils inspect private homes under the Housing Health and Safety
 *     Rating System (Housing Act 2004) and can serve an improvement notice;
 *     not complying is an offence, and opens a rent repayment order.
 *   - The Pre-Action Protocol for Housing Conditions Claims: a letter of
 *     claim, a landlord's reply within 20 working days. Legal aid covers
 *     disrepair that's a serious risk to health or safety.
 *   - Withholding rent is the costly mistake. There's no general right to,
 *     and arrears of three months' rent are a mandatory ground for possession
 *     (ground 8), whatever the state of the home. A narrow, formal route to
 *     take repair costs out of rent exists (Lee-Parker v Izzet, 1971), but
 *     it needs advice first.
 *   - Section 21 ended on 1 May 2026, so a landlord can't evict a tenant just
 *     for asking for repairs; they'd need a ground under section 8.
 *
 * The response deadlines the letters set for a private landlord (24 hours,
 * five working days, 14 days) are the tool's own, chosen to be ones a court
 * would be unlikely to call unreasonable. They aren't in any statute, and the
 * read says so.
 *
 * Wales, Scotland and Northern Ireland, and lodgers, get a pointer.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type RepairRegion = "" | "eng" | "wales" | "scot" | "ni";
export type RepairLandlord = "" | "private" | "social" | "lodger";
export type ProblemId =
  | "damp"
  | "heat"
  | "leak"
  | "gas"
  | "electric"
  | "toilet"
  | "structure"
  | "security"
  | "pests"
  | "appliance"
  | "other";
/** How you've told them so far. */
export type Told = "" | "none" | "spoken" | "written";
/** What's happened since. */
export type Since = "" | "nothing" | "acknowledged" | "visited" | "bodged" | "booked";
export type YesNo = "" | "yes" | "no";
export type Cause = "" | "no" | "me" | "unsure";
export type RentState = "" | "paid" | "behind";
export type Level = "emergency" | "urgent" | "routine";
/** Which phase of Awaab's Law brings this problem in for social landlords. */
export type Phase = 1 | 2 | 3;

export type Problem = {
  id: ProblemId;
  /** As a tenant would recognise it. */
  label: string;
  /** For letters: "damp and mould". */
  short: string;
  /** How urgent, before the household or the season is counted. */
  level: Level;
  /** The Awaab's Law phase that covers it as a significant hazard. */
  phase: Phase;
  /** Covered by s.11 / s.9A. False for appliances, which depend on the tenancy. */
  statutory: boolean;
};

export const PROBLEMS: Problem[] = [
  { id: "damp", label: "Damp or mould", short: "damp and mould", level: "routine", phase: 1, statutory: true },
  { id: "heat", label: "No heating, or no hot water", short: "no working heating or hot water", level: "urgent", phase: 2, statutory: true },
  { id: "leak", label: "Water coming in: a leak, a burst pipe, the roof", short: "water coming into the home", level: "urgent", phase: 3, statutory: true },
  { id: "gas", label: "A smell of gas, or the carbon monoxide alarm going off", short: "a possible gas leak", level: "emergency", phase: 2, statutory: true },
  { id: "electric", label: "Sparking, scorch marks, exposed wires or no power", short: "dangerous or failed electrics", level: "emergency", phase: 2, statutory: true },
  { id: "toilet", label: "The only toilet, or the water supply, doesn't work", short: "no working toilet or water supply", level: "emergency", phase: 3, statutory: true },
  { id: "structure", label: "A ceiling, floor, stairs or wall that looks unsafe", short: "a ceiling, floor, stair or wall that looks unsafe", level: "emergency", phase: 2, statutory: true },
  { id: "security", label: "A front door or window that won't lock", short: "a door or window that won't lock", level: "urgent", phase: 3, statutory: true },
  { id: "pests", label: "Mice, rats, cockroaches or bedbugs", short: "an infestation of pests", level: "routine", phase: 2, statutory: true },
  { id: "appliance", label: "An oven, fridge or washing machine the landlord supplied", short: "an appliance the landlord supplied that doesn't work", level: "routine", phase: 3, statutory: false },
  { id: "other", label: "Something else", short: "a repair", level: "routine", phase: 3, statutory: true },
];

export function getProblem(id: ProblemId): Problem {
  const p = PROBLEMS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown problem ${id}`);
  return p;
}

export type RepairInputs = {
  /** The home, in a few words. Optional. */
  what: string;
  landlordName: string;
  region: RepairRegion;
  landlord: RepairLandlord;
  problems: ProblemId[];
  /** Where in the home, in a few words: "the back bedroom wall". Optional. */
  where: string;
  /** A child, someone older, pregnant, or with a health condition or disability. */
  vulnerable: YesNo;
  /** Did you or a visitor cause it? */
  cause: Cause;
  /** When it started, roughly. Optional. */
  startedOn: string;
  told: Told;
  /** The first time you told them at all (a call, at the door). Optional. */
  toldOn: string;
  /** The first time you told them in writing (text, email, letter, portal). */
  writtenOn: string;
  since: Since;
  /** The date they booked, when they've booked one. */
  bookedOn: string;
  /** The day you chased it in writing, if you have. Optional. */
  chasedOn: string;
  rent: RentState;
};

export const BLANK_REPAIR: RepairInputs = {
  what: "",
  landlordName: "",
  region: "",
  landlord: "",
  problems: [],
  where: "",
  vulnerable: "",
  cause: "",
  startedOn: "",
  told: "",
  toldOn: "",
  writtenOn: "",
  since: "",
  bookedOn: "",
  chasedOn: "",
  rent: "",
};

/** Awaab's Law phase 1 took effect. */
export const AWAAB_PHASE1 = "2025-10-27";
/** Phase 2: excess cold and heat, falls, fire and explosions, electrics, hygiene and pests, structural collapse. */
export const AWAAB_PHASE2 = "2026-11-30";
/** Statutory timescales for a social landlord (working days). */
export const INVESTIGATE_WD = 10;
export const SUMMARY_WD = 3;
export const SAFETY_WD = 5;
/** The Complaint Handling Code: stage 1 reply. */
export const STAGE1_WD = 10;
/** A final deadline in a chaser: seven days, or one for an emergency. */
export const CHASE_DAYS = 7;

export function chaseDaysFor(level: Level): number {
  return level === "emergency" ? 1 : CHASE_DAYS;
}

function chaseWords(level: Level): string {
  return level === "emergency" ? "24 hours" : "seven days";
}

/** England bank holidays, which aren't working days. */
const BANK_HOLIDAYS = new Set([
  "2025-12-25", "2025-12-26",
  "2026-01-01", "2026-04-03", "2026-04-06", "2026-05-04", "2026-05-25", "2026-08-31", "2026-12-25", "2026-12-28",
  "2027-01-01", "2027-03-26", "2027-03-29", "2027-05-03", "2027-05-31", "2027-08-30", "2027-12-27", "2027-12-28",
  "2028-01-03", "2028-04-14", "2028-04-17", "2028-05-01", "2028-05-29", "2028-08-28", "2028-12-25", "2028-12-26",
]);

function isWorkingDay(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00`).getDay();
  return day !== 0 && day !== 6 && !BANK_HOLIDAYS.has(iso);
}

/** Add n working days (weekends and England bank holidays don't count). */
export function addWorkingDaysISO(iso: string, n: number): string {
  let d = iso;
  let left = n;
  while (left > 0) {
    d = addDaysISO(d, 1);
    if (isWorkingDay(d)) left -= 1;
  }
  return d;
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** October to March: no heating is an emergency, not an inconvenience. */
export function isColdSeason(iso: string): boolean {
  const m = Number(iso.slice(5, 7));
  return m >= 10 || m <= 3;
}

export type RepairStatus =
  /** Wales, Scotland or Northern Ireland. */
  | "elsewhere"
  | "lodger"
  /** Not told in writing yet (maybe not told at all). */
  | "report"
  /** In writing, inside the time this read gives them. */
  | "waiting"
  /** They've booked a date that hasn't come yet. */
  | "booked"
  /** In writing, and past the time. */
  | "overdue";

export type AwaabRead = {
  /** The problems Awaab's Law covers today. */
  covered: boolean;
  /** When it will cover them, if not yet. */
  coversFrom: string;
  /** Phase 3 only: no date fixed. */
  later: boolean;
  /** The day the landlord became aware, as far as you can show. */
  awareOn: string;
  investigateBy: string;
  summaryBy: string;
  safetyBy: string;
};

export type RepairRead = {
  status: RepairStatus;
  problems: Problem[];
  level: Level;
  /** The worst problem, for the headline. */
  lead: Problem | null;
  /** Days since it started (or since you first told them, if that's all you know). */
  livedDays: number | null;
  /** Days since the first written report; 0 when there isn't one. */
  paperDays: number;
  /** Days since any report you could point to; null when there isn't one. */
  spokenDays: number | null;
  /** The day the written clock started, or today when it starts now. */
  clockFrom: string;
  /** The reply-by this read gives them. */
  dueOn: string;
  /** Words for the time given: "24 hours", "five working days", "14 days". */
  dueWords: string;
  /** The day you chased it, if after the written report. */
  chasedOn: string;
  /** After a chaser: the final deadline. */
  chaseDue: string;
  /** Past the chaser's deadline too: go to the council or the ombudsman. */
  escalate: boolean;
  awaab: AwaabRead | null;
  /** Gas: get out and call first. */
  gas: boolean;
  /** You (or a visitor) caused it. */
  yours: boolean;
  /** Damp, and you're not sure you didn't cause it: the condensation note. */
  condensation: boolean;
  rentBehind: boolean;
};

export function repairReady(inp: RepairInputs): boolean {
  if (!inp.region) return false;
  if (inp.region !== "eng") return true;
  if (!inp.landlord) return false;
  if (inp.landlord === "lodger") return true;
  if (!inp.problems.length || !inp.told) return false;
  if (inp.told === "written" && !isISODate(inp.writtenOn)) return false;
  return true;
}

const LEVEL_RANK: Record<Level, number> = { emergency: 3, urgent: 2, routine: 1 };

/** How urgent this problem is in this home today. */
export function levelOf(p: Problem, inp: RepairInputs, today: string): Level {
  if (p.id === "heat" && (isColdSeason(today) || inp.vulnerable === "yes")) return "emergency";
  if (p.id === "damp" && inp.vulnerable === "yes") return "urgent";
  return p.level;
}

function dueFrom(level: Level, from: string): { on: string; words: string } {
  if (level === "emergency") return { on: addDaysISO(from, 1), words: "24 hours" };
  if (level === "urgent") return { on: addWorkingDaysISO(from, 5), words: "five working days" };
  return { on: addDaysISO(from, 14), words: "14 days" };
}

export function readRepairs(inp: RepairInputs, today = todayISO()): RepairRead | null {
  if (!repairReady(inp)) return null;
  const problems = PROBLEMS.filter((p) => inp.problems.includes(p.id));
  const blank: RepairRead = {
    status: "elsewhere",
    problems,
    level: "routine",
    lead: null,
    livedDays: null,
    paperDays: 0,
    spokenDays: null,
    clockFrom: today,
    dueOn: "",
    dueWords: "",
    chasedOn: "",
    chaseDue: "",
    escalate: false,
    awaab: null,
    gas: false,
    yours: false,
    condensation: false,
    rentBehind: inp.rent === "behind",
  };
  if (inp.region !== "eng") return blank;
  if (inp.landlord === "lodger") return { ...blank, status: "lodger" };

  let level: Level = "routine";
  let lead: Problem | null = null;
  for (const p of problems) {
    const l = levelOf(p, inp, today);
    if (!lead || LEVEL_RANK[l] > LEVEL_RANK[level]) {
      level = l;
      lead = p;
    }
  }

  const written = inp.told === "written" && isISODate(inp.writtenOn) ? inp.writtenOn : "";
  const spokenOn = isISODate(inp.toldOn) ? inp.toldOn : "";
  const firstTold = [spokenOn, written].filter(Boolean).sort()[0] ?? "";
  const startedOn = isISODate(inp.startedOn) ? inp.startedOn : firstTold;
  const livedDays = startedOn && startedOn <= today ? daysBetween(startedOn, today) : null;
  const paperDays = written && written <= today ? daysBetween(written, today) : 0;
  const spokenDays = firstTold && firstTold <= today ? daysBetween(firstTold, today) : null;

  const clockFrom = written || today;
  const due = dueFrom(level, clockFrom);
  const chased = isISODate(inp.chasedOn) && (!written || inp.chasedOn >= written) ? inp.chasedOn : "";
  const chaseDue = chased ? addDaysISO(chased, chaseDaysFor(level)) : "";

  let awaab: AwaabRead | null = null;
  if (inp.landlord === "social") {
    const emergency = level === "emergency";
    const phase = Math.min(...problems.map((p) => p.phase)) as Phase;
    const coversFrom = emergency || phase === 1 ? AWAAB_PHASE1 : phase === 2 ? AWAAB_PHASE2 : "";
    const covered = Boolean(coversFrom) && coversFrom <= today;
    // Under Awaab's Law any report counts, so the clock runs from the first one you can show.
    const awareOn = firstTold || today;
    const effectiveAware = coversFrom && awareOn < coversFrom ? coversFrom : awareOn;
    const investigateBy = emergency ? addDaysISO(effectiveAware, 1) : addWorkingDaysISO(effectiveAware, INVESTIGATE_WD);
    awaab = {
      covered,
      coversFrom,
      later: !coversFrom,
      awareOn,
      investigateBy,
      summaryBy: emergency ? investigateBy : addWorkingDaysISO(investigateBy, SUMMARY_WD),
      safetyBy: emergency ? investigateBy : addWorkingDaysISO(investigateBy, SAFETY_WD),
    };
  }

  // The date they're judged against: Awaab's Law, when it applies, else this read's own.
  const awaabDue = awaab && coversByThen(awaab) ? awaab.safetyBy : "";
  const dueOn = awaabDue || due.on;
  const dueWords = awaabDue ? (level === "emergency" ? "24 hours" : "the Awaab's Law timescales") : due.words;

  let status: RepairStatus;
  if (!written) status = "report";
  else if (inp.since === "booked" && isISODate(inp.bookedOn) && inp.bookedOn >= today) status = "booked";
  else status = today > dueOn ? "overdue" : "waiting";

  const escalate = status === "overdue" && Boolean(chaseDue) && today > chaseDue;
  const yours = inp.cause === "me";
  return {
    ...blank,
    status,
    level,
    lead,
    chasedOn: chased,
    livedDays,
    paperDays,
    spokenDays,
    clockFrom,
    dueOn,
    dueWords,
    chaseDue,
    escalate,
    awaab,
    gas: problems.some((p) => p.id === "gas"),
    yours,
    condensation: problems.some((p) => p.id === "damp") && inp.cause !== "no",
  };
}

/** Awaab's Law covers it, today or by the time the deadline lands. */
function coversByThen(a: AwaabRead): boolean {
  return a.covered || (Boolean(a.coversFrom) && a.coversFrom <= a.investigateBy);
}

function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "a, b and c". */
function listOf(xs: string[]): string {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

function homeOf(inp: RepairInputs): string {
  return inp.what.trim() || "the home I rent";
}

/** "214 days", "1 day", "today". */
export function daysWords(n: number): string {
  if (n <= 0) return "none";
  return n === 1 ? "1 day" : `${n.toLocaleString("en-GB")} days`;
}

function problemWords(read: RepairRead): string {
  return listOf(read.problems.map((p) => p.short));
}

export function repairHeadline(inp: RepairInputs, read: RepairRead, today = todayISO()): string {
  switch (read.status) {
    case "elsewhere":
      return inp.region === "scot"
        ? "Scotland has its own repair rules, and a tribunal that can order the work."
        : inp.region === "wales"
          ? "Wales has its own rules: the home has to be fit to live in, and kept in repair."
          : "Northern Ireland has its own rules. The council can still inspect.";
    case "lodger":
      return "As a lodger you have less room to push, but gas safety still applies in full.";
    case "report": {
      if (read.gas) return "Gas first: get everyone out, and call 0800 111 999 now.";
      const lived = read.livedDays;
      if (lived !== null && lived >= 7)
        return `You've lived with it for ${daysWords(lived)}. On paper, they've known for none. Put it in writing today.`;
      return read.level === "emergency"
        ? "Report it in writing now, and ask for it to be made safe within 24 hours."
        : "Put it in writing today. That's the day the clock starts.";
    }
    case "booked":
      return `They've booked ${actDate(inp.bookedOn)}. Confirm it in writing, and keep the paper trail going.`;
    case "waiting":
      if (read.gas) return "Gas first: if you can smell it now, get out and call 0800 111 999.";
      return read.paperDays === 0
        ? `It's in writing from today. Give them until ${actDate(read.dueOn)}.`
        : `They've had it in writing for ${daysWords(read.paperDays)}. Give them until ${actDate(read.dueOn)}.`;
    case "overdue": {
      const late = daysBetween(read.dueOn, today);
      const who = inp.landlord === "social" ? "make a formal complaint" : "ask the council to inspect";
      if (read.escalate) return `Your final deadline has passed. Now ${who}.`;
      if (read.chaseDue) return `You've chased it. If nothing happens by ${actDate(read.chaseDue)}, ${who}.`;
      return `They're ${daysWords(late)} past a reasonable time. Chase it once, with a final date, then ${who}.`;
    }
  }
}

export function repairBody(inp: RepairInputs, read: RepairRead, today = todayISO()): string {
  const out: string[] = [];
  if (read.status === "elsewhere") {
    if (inp.region === "scot")
      out.push(
        "Private landlords in Scotland have to meet the Repairing Standard: wind- and watertight, safe gas and electrics, working heating and hot water, smoke and carbon monoxide alarms. Report it to the landlord in writing and keep a copy. If they don't act within a reasonable time, you can apply to the First-tier Tribunal (Housing and Property Chamber), which can order the work. Social tenants complain to the landlord, then the Scottish Public Services Ombudsman. Shelter Scotland and Citizens Advice Scotland can help.",
      );
    else if (inp.region === "wales")
      out.push(
        "Under the Renting Homes (Wales) Act 2016, your landlord has to keep the home fit for human habitation and in repair, and the contract can't take that away. Report it in writing and keep a copy. If they don't act, the council's environmental health team can inspect, and Shelter Cymru or Citizens Advice can help with a claim.",
      );
    else
      out.push(
        "Report it to the landlord in writing and keep a copy. If they don't act, the council's environmental health team can inspect, and Housing Rights (housingrights.org.uk) gives free advice. Housing Executive and housing association tenants complain to the landlord first, then the NI Public Services Ombudsman.",
      );
    out.push("This tool's dates and letters are written for England, but the habit is the same: in writing, dated, with a photo and a date to reply by.");
    return out.join("\n\n");
  }
  if (read.status === "lodger") {
    out.push(
      "If you live in your landlord's own home, most of the repair rules for tenants still apply on paper (section 11 covers most lettings under seven years), but you can be asked to leave with reasonable notice and no court, so pushing hard has a cost. Gas safety is different: a landlord who lets a room must have the gas appliances checked every year, and a carbon monoxide or gas problem is an emergency whoever you rent from.",
    );
    out.push("Report it in writing, keep a copy, and if it's dangerous call the council's environmental health team. Citizens Advice can help you weigh it up.");
    return out.join("\n\n");
  }

  if (read.gas)
    out.push(
      "If you can smell gas now, or the carbon monoxide alarm is sounding: open the windows, turn off the gas at the meter if you can, don't use switches or flames, get everyone out and call the National Gas Emergency Service on 0800 111 999. They come for free and make it safe. Then tell the landlord in writing; the repair is theirs.",
    );

  if (read.yours)
    out.push(
      "If you or a visitor caused it, the repair is usually yours to pay for. Tell the landlord in writing anyway, because they may need to do structural work and an unreported problem tends to grow. You can offer to arrange and pay for the fix, or ask them to and pay them back.",
    );

  const lived = read.livedDays;
  if (read.status === "report") {
    const said = read.spokenDays !== null
      ? ` You told them ${read.spokenDays === 0 ? "today" : `${daysWords(read.spokenDays)} ago`}, but only in a call or in person, so all you can show is your word.`
      : "";
    out.push(
      `A landlord's duty to repair starts when they know about the problem, and the "reasonable time" to fix it runs from then.${said}${lived !== null && lived >= 7 ? ` You've been living with it for ${daysWords(lived)}, so it feels obvious that they know. Every step that comes next (the council, a complaint, compensation) starts with a dated report you can show someone.` : " Every step that comes next starts with a dated report you can show someone."} An email or a message in the landlord's or agent's portal is enough. Telling the agent counts as telling the landlord.`,
    );
    if (inp.landlord === "social" && read.awaab && read.spokenDays !== null && coversByThen(read.awaab))
      out.push(
        `Under Awaab's Law you don't have to report in a particular way, so the landlord's clock may already be running from your call. Writing it down now means you can prove it. If they became aware on ${letterDate(read.awaab.awareOn)}, they had to investigate by ${letterDate(read.awaab.investigateBy)}.`,
      );
  }

  if (read.status === "waiting" || read.status === "overdue" || read.status === "booked") {
    if (lived !== null && read.paperDays > 0 && lived > read.paperDays + 7)
      out.push(
        `You've lived with it for ${daysWords(lived)}; on paper they've known for ${daysWords(read.paperDays)}. The second number is the one a council, an ombudsman or a court will count from.`,
      );
  }

  if (inp.landlord === "private" || (inp.landlord === "social" && read.awaab && !coversByThen(read.awaab))) {
    const why =
      read.level === "emergency"
        ? "It's an emergency: something that could hurt someone or leaves the home without a basic service. Ask for it to be made safe within 24 hours, and the full repair after."
        : read.level === "urgent"
          ? `It's urgent${read.lead?.id === "damp" ? " because of who lives with it" : ""}. Five working days to come and look, and a date for the work, is a fair ask.`
          : "It isn't an emergency, but it is their job. Fourteen days to come and look, or to give you a date for the work, is a fair ask.";
    if (read.status !== "booked")
      out.push(
        `${why} There's no fixed number of days in the law for ${inp.landlord === "private" ? "a private landlord" : "this kind of repair yet"}: a court asks what was reasonable for the job. The deadline in your letter is this tool's, chosen to be one a court would be unlikely to call unreasonable.`,
      );
  }

  if (inp.landlord === "social" && read.awaab) {
    const a = read.awaab;
    if (coversByThen(a)) {
      const lead = a.covered
        ? "As a social tenant you have Awaab's Law: your landlord has to"
        : `From ${letterDate(a.coversFrom)}, Awaab's Law covers this kind of problem too. Counting from then, your landlord will have to`;
      out.push(
        read.level === "emergency"
          ? `${lead} investigate an emergency hazard and make it safe within 24 hours (by ${letterDate(a.investigateBy)}).`
          : `${lead} investigate within ${INVESTIGATE_WD} working days of becoming aware (by ${letterDate(a.investigateBy)}), send you a written summary within ${SUMMARY_WD} working days of that (by ${letterDate(a.summaryBy)}), and start the work to make it safe within ${SAFETY_WD} working days (by ${letterDate(a.safetyBy)}). If they can't make the home safe in time, they have to offer you somewhere suitable to stay, at their cost.`,
      );
    } else if (a.later)
      out.push(
        "Awaab's Law's fixed timescales don't cover this kind of problem yet; most of the rest are expected in 2027. Your landlord still has to fix it in a reasonable time, and its own repairs policy usually gives a target. Ask for it.",
      );
  }

  if (read.status === "booked")
    out.push(
      `Reply to confirm ${actDate(inp.bookedOn)} in writing, and say what the work is meant to fix. If they don't turn up, or the fix doesn't hold, your written report still stands from ${letterDate(read.clockFrom)}.`,
    );

  if (read.status === "overdue") {
    if (inp.landlord === "private")
      out.push(
        read.escalate || read.level === "emergency"
          ? `${read.level === "emergency" && !read.escalate ? "It's an emergency, so don't wait long: chase it today with a 24-hour deadline, and if nothing happens, a" : "A"}sk the council's private housing (or environmental health) team to inspect. Many have an out-of-hours line for emergencies. They rate the home under the Housing Health and Safety Rating System, and for a serious hazard they can order the landlord to do the work. Ignoring that order is a criminal offence, and lets you apply to a tribunal to win back rent.`
          : `Send one chaser with a final date (${chaseWords(read.level)}, ${actDate(addDaysISO(today, chaseDaysFor(read.level)))}) and say what you'll do next: ask the council to inspect. Most landlords move at that line. If they don't, the council letter is below.`,
      );
    else
      out.push(
        read.escalate
          ? "Make a formal complaint. Under the Housing Ombudsman's code they have to reply at stage 1 within 10 working days, and at stage 2 within 20. If you're still unhappy after that, or they don't reply, take it to the Housing Ombudsman. It's free."
          : `Chase once, with a final date (${actDate(addDaysISO(today, chaseDaysFor(read.level)))}), and say you'll make a formal complaint if nothing happens. The complaint letter is below if you'd rather go straight to it.`,
      );
    if (inp.since === "bodged")
      out.push(
        "A fix that didn't hold isn't a fix. Painting over mould, or wiping it, doesn't deal with why it's there. Say so in writing, with a new photo, so the record shows it came back.",
      );
  }

  if (read.condensation && !read.yours)
    out.push(
      "If they say the mould is condensation from drying clothes or cooking, that doesn't settle it. Damp is one of the things a home has to be free of to be fit to live in, and a home that can't be heated or aired properly is the landlord's problem. Note how you heat and ventilate it, and ask what they found.",
    );

  out.push(
    read.rentBehind
      ? "You're behind on the rent. Clear it, or agree a plan in writing, before you push on repairs: three months' arrears is a ground a court must follow, whatever the state of the home. Don't stop paying to make a point."
      : "Keep paying the rent. Holding it back feels fair, but there's no general right to, and three months' arrears is a ground a court must follow whatever the state of the home. There's a narrow, formal way to take repair costs off the rent; get advice before you try it.",
  );
  if (inp.landlord === "private")
    out.push(
      "Asking for repairs can't be held against you the way it once could. Since 1 May 2026, section 21 has gone, so a landlord who wants you out needs a ground, like selling or moving in, with four months' notice and not in your first year. If a notice arrives after you've complained, check it.",
    );
  return out.join("\n\n");
}

export type Step = {
  title: string;
  on: string;
  note: string;
  /** Something that happened (you did it). */
  done?: boolean;
  /** A deadline whose date has gone. */
  passed?: boolean;
};

/** The ladder from here, each with its date, in date order. */
export function stepsOf(inp: RepairInputs, read: RepairRead, today = todayISO()): Step[] {
  if (read.status === "elsewhere" || read.status === "lodger") return [];
  const steps: Step[] = [];
  const written = read.status !== "report";
  const gone = (on: string) => on < today;
  if (isISODate(inp.startedOn) && inp.startedOn <= today)
    steps.push({ title: "It started", on: inp.startedOn, note: "Only you know this date.", done: true });
  if (isISODate(inp.toldOn) && inp.toldOn <= today && (!written || inp.toldOn < read.clockFrom))
    steps.push({ title: "You told them", on: inp.toldOn, note: "A call or at the door. True, but hard to prove.", done: true });
  steps.push({
    title: written ? "You put it in writing" : "Put it in writing",
    on: written ? read.clockFrom : today,
    note: written ? "The clock you can prove starts here." : "Today. The clock you can prove starts here.",
    done: written,
  });
  const a = read.awaab;
  if (a && coversByThen(a)) {
    if (read.level === "emergency")
      steps.push({ title: "Deadline: made safe", on: a.investigateBy, note: "Awaab's Law: an emergency within 24 hours.", passed: gone(a.investigateBy) });
    else {
      steps.push({ title: "Deadline: investigate", on: a.investigateBy, note: `Awaab's Law: ${INVESTIGATE_WD} working days from when they knew.`, passed: gone(a.investigateBy) });
      steps.push({ title: "Deadline: written summary", on: a.summaryBy, note: `${SUMMARY_WD} working days after the investigation.`, passed: gone(a.summaryBy) });
      steps.push({ title: "Deadline: safety work starts", on: a.safetyBy, note: `${SAFETY_WD} working days after the investigation.`, passed: gone(a.safetyBy) });
    }
  } else {
    steps.push({
      title: "Their reply-by",
      on: read.dueOn,
      note: written
        ? `${capital(read.dueWords)} from your report: a fair time for this kind of repair.`
        : `${capital(read.dueWords)}: the deadline your letter sets.`,
      passed: gone(read.dueOn),
    });
  }
  if (read.status === "booked") {
    steps.push({ title: "The booked visit", on: inp.bookedOn, note: "Confirm it in writing. Photos before and after." });
    steps.push({ title: "If nobody comes, chase", on: addDaysISO(inp.bookedOn, 1), note: "The next day, with a final date." });
    return sortSteps(steps);
  }
  const days = chaseDaysFor(read.level);
  const chaseOn =
    read.chasedOn ||
    (read.status === "report"
      ? addDaysISO(dueFrom(read.level, today).on, 1)
      : read.dueOn >= today
        ? addDaysISO(read.dueOn, 1)
        : today);
  const finalOn = read.chaseDue || addDaysISO(chaseOn, days);
  steps.push({
    title: read.chasedOn ? "You chased it" : "Chase once, with a final date",
    on: chaseOn,
    note: `${capital(chaseWords(read.level))}, and say what you'll do next.`,
    done: Boolean(read.chasedOn),
  });
  steps.push({ title: "Your final date", on: finalOn, note: "If nothing has happened, take the next step.", passed: gone(finalOn) });
  const after = addDaysISO(finalOn, 1) < today ? today : addDaysISO(finalOn, 1);
  if (inp.landlord === "private") {
    steps.push({ title: "Ask the council to inspect", on: after, note: "Its private housing team can order the work. Free." });
    steps.push({
      title: "A claim, if you need one",
      on: addDaysISO(after, 14),
      note: "A letter of claim under the protocol; they get 20 working days to reply. Get advice first.",
    });
  } else {
    steps.push({ title: "Formal complaint", on: after, note: `A stage 1 reply within ${STAGE1_WD} working days.` });
    steps.push({
      title: "The Housing Ombudsman",
      on: addWorkingDaysISO(after, STAGE1_WD + 20),
      note: "After stage 2, or sooner if they don't reply. Free.",
    });
  }
  return sortSteps(steps);
}

/** Date order; things you did come before deadlines on the same day. */
function sortSteps(steps: Step[]): Step[] {
  return steps
    .map((s, i) => ({ s, i }))
    .sort((x, y) => (x.s.on < y.s.on ? -1 : x.s.on > y.s.on ? 1 : x.i - y.i))
    .map((x) => x.s);
}

export type RepairLetter = { id: string; title: string; note: string; text: string };

function signOff(): string[] {
  return ["", "Yours sincerely,", "", "[Your name]", "[Your address]", "[Your phone number]"];
}

function dear(inp: RepairInputs): string {
  return `Dear ${inp.landlordName.trim() || "[landlord or agent]"},`;
}

function whereLine(inp: RepairInputs): string {
  return inp.where.trim() ? ` (${inp.where.trim().replace(/\.$/, "")})` : "";
}

function householdLine(inp: RepairInputs): string[] {
  return inp.vulnerable === "yes"
    ? ["", "Someone living here is especially at risk from it: [a young child / someone older / someone pregnant / someone with a health condition]. Please treat it as urgent."]
    : [];
}

function lawLine(inp: RepairInputs, read: RepairRead): string {
  const statutory = read.problems.some((p) => p.statutory);
  if (inp.landlord === "social" && read.awaab && coversByThen(read.awaab))
    return read.level === "emergency"
      ? "This is an emergency hazard. Under the Hazards in Social Housing (Prescribed Requirements) (England) Regulations 2025 (Awaab's Law), please investigate and make the home safe within 24 hours."
      : `Under the Hazards in Social Housing (Prescribed Requirements) (England) Regulations 2025 (Awaab's Law), please investigate within ${INVESTIGATE_WD} working days, send me a written summary of what you find within ${SUMMARY_WD} working days of that, and carry out any safety work within ${SAFETY_WD} working days.`;
  if (!statutory)
    return "You supplied it with the tenancy, so please repair or replace it.";
  return "Under section 11 of the Landlord and Tenant Act 1985 you're responsible for repairs to the structure and exterior of the home and the installations for water, gas, electricity, sanitation, heating and hot water, and under section 9A the home has to be fit for human habitation throughout the tenancy.";
}

/** In a chaser, a social landlord's deadlines are already set: name them. */
function chaseLawLine(inp: RepairInputs, read: RepairRead): string {
  const a = read.awaab;
  if (inp.landlord === "social" && a && coversByThen(a))
    return read.level === "emergency"
      ? `This is an emergency hazard. Under Awaab's Law you had to investigate and make the home safe by ${letterDate(a.investigateBy)}.`
      : `Under Awaab's Law (the Hazards in Social Housing (Prescribed Requirements) (England) Regulations 2025) you have to investigate by ${letterDate(a.investigateBy)}, send me a written summary by ${letterDate(a.summaryBy)} and start any safety work by ${letterDate(a.safetyBy)}.`;
  return lawLine(inp, read);
}

function askLine(read: RepairRead, inp: RepairInputs, today: string): string {
  if (inp.landlord === "social" && read.awaab && coversByThen(read.awaab))
    return "Please let me know when you can come, and give me a reference number for this report.";
  const by = read.level === "emergency" ? addDaysISO(today, 1) : read.level === "urgent" ? addWorkingDaysISO(today, 5) : addDaysISO(today, 14);
  return read.level === "emergency"
    ? `Please make it safe within 24 hours, by ${actDate(by)}, and let me know when the full repair will be done.`
    : `Please arrange for someone to inspect it, or let me know when the work will be done, by ${actDate(by)}.`;
}

/** The letters that fit this read, most useful first. */
export function repairLetters(inp: RepairInputs, read: RepairRead, today = todayISO()): RepairLetter[] {
  if (read.status === "elsewhere" || read.status === "lodger") return [];
  const out: RepairLetter[] = [];
  const home = homeOf(inp);
  const head = [letterDate(today), "", dear(inp), ""];
  const what = problemWords(read);
  const started = isISODate(inp.startedOn) ? ` It started around ${letterDate(inp.startedOn)}.` : "";
  const toldBefore = isISODate(inp.toldOn) && (!isISODate(inp.writtenOn) || inp.toldOn < inp.writtenOn)
    ? ` I first told you about it on ${letterDate(inp.toldOn)}.`
    : "";

  if (read.status === "report") {
    out.push({
      id: "report",
      title: "Report it in writing",
      note: "Send it by email, or through the agent's portal, so it's dated. Attach two or three photos. Keep a copy.",
      text: [
        ...head,
        `Re: repairs needed at ${home}`,
        "",
        `I'm writing to report ${what}${whereLine(inp)}.${started}${toldBefore}`,
        ...householdLine(inp),
        "",
        lawLine(inp, read),
        "",
        askLine(read, inp, today),
        "",
        `I'll give access at a reasonable time with 24 hours' notice.${read.problems.every((p) => p.id === "gas") ? "" : " I've attached photos."}`,
        "",
        "Please confirm you've received this.",
        ...signOff(),
      ].join("\n"),
    });
    return out;
  }

  const ref = `my report of ${letterDate(read.clockFrom)}`;
  if (read.status === "booked") {
    out.push({
      id: "confirm",
      title: "Confirm the visit",
      note: "Short. It puts the date, and what the work is for, on the record.",
      text: [
        ...head,
        `Re: repairs at ${home}`,
        "",
        `Thank you for arranging a visit on ${letterDate(inp.bookedOn)} about ${ref} (${what}${whereLine(inp)}).`,
        "",
        "Please let me know the time, and what the work will involve. If the visit has to move, please tell me in writing.",
        ...signOff(),
      ].join("\n"),
    });
    return out;
  }

  const sinceLine =
    inp.since === "acknowledged"
      ? "You acknowledged it, but nothing has been done since."
      : inp.since === "visited"
        ? "Someone came to look, but the work hasn't been done."
        : inp.since === "bodged"
          ? "It was patched, but the problem has come back. I've attached new photos."
          : "I haven't had a reply.";
  // A chaser for later is dated the day it should go, not today.
  const sendOn = read.status === "waiting" ? addDaysISO(read.dueOn, 1) : today;
  const finalOn = addDaysISO(sendOn, chaseDaysFor(read.level));
  const next =
    inp.landlord === "private"
      ? "ask the council's private housing team to inspect the home"
      : "make a formal complaint under your complaints policy and, if I need to, take it to the Housing Ombudsman";

  if (!read.escalate)
  out.push({
    id: "chase",
    title: read.status === "waiting" ? `A chaser, for ${actDate(addDaysISO(read.dueOn, 1))} if nothing happens` : "Chase it, with a final date",
    note:
      read.status === "waiting"
        ? "Not yet. If the reply-by passes with nothing, send this the next day."
        : "One chaser, firm and polite, with what you'll do next. Then do it.",
    text: [
      letterDate(sendOn),
      "",
      dear(inp),
      "",
      `Re: repairs at ${home}, ${ref}`,
      "",
      `On ${letterDate(read.clockFrom)} I reported ${what}${whereLine(inp)}. ${sinceLine}`,
      ...householdLine(inp),
      "",
      chaseLawLine(inp, read),
      "",
      `Please carry out the repair, or tell me in writing when it will be done, by ${letterDate(finalOn)}. If I haven't heard by then, I'll ${next}.`,
      "",
      "I'll give access at a reasonable time with 24 hours' notice.",
      ...signOff(),
    ].join("\n"),
  });

  if (read.status === "overdue") {
    if (inp.landlord === "private") {
      out.push({
        id: "council",
        title: "To the council's private housing team",
        note: "Search the council's site for \"private sector housing\" or \"environmental health\"; most have an online form. Paste this in and attach the photos and your letters.",
        text: [
          letterDate(today),
          "",
          "Dear Private Sector Housing team,",
          "",
          `Re: request for an inspection, ${home}`,
          "",
          `I rent ${inp.what.trim() ? home : "my home"} from a private landlord${inp.landlordName.trim() ? `, ${inp.landlordName.trim()}` : ""}. There is ${what}${whereLine(inp)}.${started}`,
          ...householdLine(inp),
          "",
          `I reported it in writing on ${letterDate(read.clockFrom)}${read.chaseDue ? ` and chased it on ${letterDate(addDaysISO(read.chaseDue, -CHASE_DAYS))}` : ""}. ${sinceLine}`,
          "",
          "Please inspect the home under the Housing Health and Safety Rating System and take whatever action you think is right under Part 1 of the Housing Act 2004. I've attached photos and copies of my letters.",
          "",
          "I'm available for a visit on [days and times].",
          ...signOff(),
        ].join("\n"),
      });
    } else {
      out.push({
        id: "complaint",
        title: "A formal complaint (stage 1)",
        note: "Use the landlord's complaints form or email, and say clearly that it's a formal complaint. They have 5 working days to acknowledge it and 10 to reply.",
        text: [
          ...head,
          `Re: formal complaint, repairs at ${home}`,
          "",
          `Please treat this as a formal complaint under your complaints policy and the Housing Ombudsman's Complaint Handling Code.`,
          "",
          `On ${letterDate(read.awaab?.awareOn && read.awaab.awareOn < read.clockFrom ? read.awaab.awareOn : read.clockFrom)} I reported ${what}${whereLine(inp)}. ${sinceLine}`,
          ...householdLine(inp),
          "",
          read.awaab && coversByThen(read.awaab)
            ? `Under Awaab's Law you had to investigate by ${letterDate(read.awaab.investigateBy)}${read.level === "emergency" ? " and make the home safe" : ` and start any safety work by ${letterDate(read.awaab.safetyBy)}`}.`
            : "The repair hasn't been done in a reasonable time.",
          "",
          "To put it right, I'm asking you to: [carry out the repair by a date; tell me what caused it; compensate me for the time the home has been affected and for damaged belongings].",
          ...signOff(),
        ].join("\n"),
      });
    }
  }
  return out;
}

export function evidenceLines(inp: RepairInputs, read: RepairRead): string[] {
  if (read.status === "elsewhere" || read.status === "lodger") return [];
  const out = [
    "Photos and a short video, with the date: wide enough to show which room, close enough to show the problem. Take new ones every couple of weeks.",
    "Every report and reply, in one folder or email label. Screenshot texts and WhatsApps, which can vanish.",
    "A short diary: when it got worse, visits that didn't happen, nights you slept in another room.",
  ];
  if (read.problems.some((p) => p.id === "damp" || p.id === "leak"))
    out.push("Anything it's spoiled (clothes, bedding, furniture), with receipts if you have them.");
  if (read.problems.some((p) => p.id === "heat"))
    out.push("What you've spent on heaters or extra electricity while the heating was off.");
  if (inp.vulnerable === "yes") out.push("A note from a GP or health visitor if someone's health has been affected.");
  return out;
}

export function remindersOf(inp: RepairInputs, read: RepairRead, today: string): { on: string; title: string; body: string }[] {
  if (read.status === "elsewhere" || read.status === "lodger") return [];
  const out: { on: string; title: string; body: string }[] = [];
  if (read.status === "report") {
    const due = dueFrom(read.level, today);
    out.push({ on: addDaysISO(due.on, 1), title: "Repair: chase it if nothing's happened", body: "Send the chaser with a final seven-day date." });
    return out;
  }
  if (read.status === "booked" && isISODate(inp.bookedOn))
    out.push({ on: inp.bookedOn, title: "Repair visit booked", body: "Be in, take photos before and after, and note who came." });
  if (read.dueOn >= today)
    out.push({ on: addDaysISO(read.dueOn, 1), title: "Repair: chase it if nothing's happened", body: "Send the chaser with a final seven-day date." });
  const finalOn = read.chaseDue || (read.status === "overdue" ? addDaysISO(today, CHASE_DAYS) : "");
  if (finalOn && finalOn >= today)
    out.push({
      on: addDaysISO(finalOn, 1),
      title: inp.landlord === "social" ? "Repair: make the formal complaint" : "Repair: ask the council to inspect",
      body: "Your final deadline has passed. Send the next letter.",
    });
  return out;
}

export function repairRule(): string {
  return "When something in my home needs fixing, I report it in writing the day I notice it, with a photo and a date to reply by, and I keep paying the rent. If the date passes, I chase once with a final date, then go to the council or the ombudsman.";
}

export function repairSummary(inp: RepairInputs, read: RepairRead, today = todayISO()): string {
  const lines: string[] = [];
  lines.push(`A repair the landlord hasn't fixed${inp.what.trim() ? `: ${inp.what.trim()}` : ""}`);
  lines.push("", repairHeadline(inp, read, today), "", repairBody(inp, read, today));
  const steps = stepsOf(inp, read, today);
  if (steps.length) {
    lines.push("", "The steps:");
    for (const s of steps) lines.push(`- ${letterDate(s.on)}: ${s.title}. ${s.note}`);
  }
  for (const l of repairLetters(inp, read, today)) lines.push("", `${l.title}:`, "", l.text);
  lines.push("", repairRule());
  return lines.join("\n");
}

const REGIONS: RepairRegion[] = ["eng", "wales", "scot", "ni"];
const LANDLORDS: RepairLandlord[] = ["private", "social", "lodger"];
const PROBLEM_IDS: ProblemId[] = PROBLEMS.map((p) => p.id);
const TOLD: Told[] = ["none", "spoken", "written"];
const SINCE: Since[] = ["nothing", "acknowledged", "visited", "bodged", "booked"];
const YN: YesNo[] = ["yes", "no"];
const CAUSES: Cause[] = ["no", "me", "unsure"];
const RENTS: RentState[] = ["paid", "behind"];

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
export function parseRepairInputs(raw: unknown): RepairInputs {
  if (!raw || typeof raw !== "object") return BLANK_REPAIR;
  const v = raw as Record<string, unknown>;
  const problems = Array.isArray(v.problems)
    ? PROBLEM_IDS.filter((id) => (v.problems as unknown[]).includes(id))
    : [];
  return {
    what: str(v.what),
    landlordName: str(v.landlordName),
    region: oneOf(v.region, REGIONS),
    landlord: oneOf(v.landlord, LANDLORDS),
    problems,
    where: str(v.where),
    vulnerable: oneOf(v.vulnerable, YN),
    cause: oneOf(v.cause, CAUSES),
    startedOn: date(v.startedOn),
    told: oneOf(v.told, TOLD),
    toldOn: date(v.toldOn),
    writtenOn: date(v.writtenOn),
    since: oneOf(v.since, SINCE),
    bookedOn: date(v.bookedOn),
    chasedOn: date(v.chasedOn),
    rent: oneOf(v.rent, RENTS),
  };
}

/**
 * The worked example: mould in a child's bedroom since the spring, two calls
 * to the agent, and nothing in writing.
 */
export function repairExample(today = todayISO()): RepairInputs {
  return {
    what: "the flat on Hope Street",
    landlordName: "",
    region: "eng",
    landlord: "private",
    problems: ["damp"],
    where: "the back bedroom, where our son sleeps",
    vulnerable: "yes",
    cause: "no",
    startedOn: addMonthsISO(today, -7),
    told: "spoken",
    toldOn: addMonthsISO(today, -5),
    writtenOn: "",
    since: "nothing",
    bookedOn: "",
    chasedOn: "",
    rent: "paid",
  };
}
