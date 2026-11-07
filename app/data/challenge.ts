/**
 * The read behind "The DWP Said No: Challenge It?" (/challenge).
 *
 * The letter says you scored 6 points, or that your Universal Credit has been
 * sanctioned, or that you've been overpaid. It's printed, numbered, signed off
 * by a "decision maker", and it reads like the end of the matter. It isn't.
 * A DWP decision is a first draft made on paper, often from a short
 * assessment, and the system gives you two more goes at it: a mandatory
 * reconsideration (the DWP looks again), then an appeal to an independent
 * tribunal. The figures say the second go is worth a lot. About one in four
 * PIP reconsiderations changes the award (DWP, quarter to July 2026), and
 * about two in three PIP appeals go the claimant's way at the tribunal (HMCTS,
 * January to March 2026). But every stage asks for a form, a deadline and
 * another wait, and people drop out at each one. That's administrative burden
 * (Herd and Moynihan, 2018): the costs of learning, complying and enduring
 * filter people by stamina, not by what they're entitled to.
 *
 * So the tool's job is to make the next step small and dated: the one-month
 * deadline (and the 13-month outer limit for a late request), the points gap
 * for PIP, what's at stake, what usually happens, and the letter.
 *
 * Great Britain (DWP benefits). gov.uk and legislation.gov.uk don't resolve
 * from the sandbox, so this rests on what agreed across Citizens Advice,
 * Shelter, councils' welfare rights pages, Disability Rights UK and Benefits
 * and Work summaries (see the session notes for 7 November 2026):
 *
 *   - Mandatory reconsideration: ask within one calendar month of the date on
 *     the decision letter. A late request can be accepted with a good reason
 *     up to 13 months from the decision. Asking for a written statement of
 *     reasons within the month extends the time, but the tool doesn't lean on
 *     it.
 *   - Appeal: to HMCTS (form SSCS1, online or on paper) within one calendar
 *     month of the date on the mandatory reconsideration notice, with a copy
 *     of that notice. The tribunal can accept a late appeal up to 13 months
 *     after the notice.
 *   - PIP: the Social Security (Personal Independence Payment) Regulations
 *     2013, Schedule 1. Ten daily living activities and two mobility
 *     activities; the highest descriptor in each activity scores; 8 points in
 *     a component for the standard rate, 12 for the enhanced. A descriptor
 *     applies only if you can do the activity reliably (reg 7: safely, to an
 *     acceptable standard, repeatedly, in a reasonable time, which is no more
 *     than twice as long as someone without the condition), on more than half
 *     of days.
 *   - The four-point rule (needing 4 points in one daily living activity) was
 *     withdrawn in July 2025. The Timms Review reports in autumn 2026; any
 *     change needs new law. Nothing here models it.
 *   - Weekly rates from 6 April 2026: daily living £76.70 (standard) and
 *     £114.60 (enhanced); mobility £30.30 and £80.00.
 *   - A challenge reopens the whole award, so a reconsideration or a tribunal
 *     can lower an award as well as raise it (Citizens Advice).
 *   - Universal Credit overpayments are recoverable whatever caused them; what
 *     can be appealed is whether there was one and how much. Lowering the
 *     deduction, or a waiver, is a separate request to DWP Debt Management.
 *   - Sanctions: you can ask for a hardship payment (repaid later) while you
 *     challenge.
 *
 * Scotland's disability benefits (Adult Disability Payment instead of PIP)
 * and Northern Ireland get a pointer; Universal Credit and ESA in Scotland
 * are DWP benefits and follow the same rules.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type ChallengeRegion = "" | "gb" | "scot" | "ni";
export type Benefit = "" | "pip" | "uc" | "esa" | "other";
/** Where you are: a decision letter, waiting on a reconsideration, or its answer. */
export type Stage = "" | "decision" | "waiting" | "upheld";
export type Issue =
  | ""
  | "refused"
  | "lower"
  | "reduced"
  | "length"
  | "sanction"
  | "overpayment"
  | "work"
  | "amount";

export const BENEFITS: { id: Exclude<Benefit, "">; label: string; name: string }[] = [
  { id: "pip", label: "Personal Independence Payment (PIP)", name: "Personal Independence Payment" },
  { id: "uc", label: "Universal Credit", name: "Universal Credit" },
  { id: "esa", label: "Employment and Support Allowance (ESA)", name: "Employment and Support Allowance" },
  { id: "other", label: "Another DWP benefit: Carer's Allowance, Attendance Allowance, Pension Credit…", name: "" },
];

export const ISSUES_FOR: Record<Exclude<Benefit, "">, { id: Exclude<Issue, "">; label: string }[]> = {
  pip: [
    { id: "refused", label: "They turned the claim down" },
    { id: "lower", label: "I got an award, but less than I think is right" },
    { id: "reduced", label: "After a review, they cut or stopped it" },
    { id: "length", label: "The award is right, but too short" },
  ],
  uc: [
    { id: "sanction", label: "A sanction" },
    { id: "overpayment", label: "They say I was overpaid" },
    { id: "work", label: "A work capability assessment said I'm fit for work, or put me in the wrong group" },
    { id: "amount", label: "The amount is wrong, or an element is missing" },
    { id: "refused", label: "The claim was refused or closed" },
  ],
  esa: [
    { id: "work", label: "A work capability assessment said I'm fit for work, or put me in the wrong group" },
    { id: "sanction", label: "A sanction" },
    { id: "overpayment", label: "They say I was overpaid" },
    { id: "refused", label: "The claim was refused or stopped for another reason" },
  ],
  other: [
    { id: "refused", label: "They turned the claim down, or stopped it" },
    { id: "amount", label: "The amount is wrong" },
    { id: "overpayment", label: "They say I was overpaid" },
  ],
};

/* ---------------- PIP ---------------- */

export type Component = "dl" | "mob";
export type ActivityId =
  | "food"
  | "nutrition"
  | "therapy"
  | "washing"
  | "toilet"
  | "dressing"
  | "communicating"
  | "reading"
  | "engaging"
  | "budgeting"
  | "journeys"
  | "moving";

export type Activity = {
  id: ActivityId;
  component: Component;
  /** The number on the decision letter: "Activity 4". */
  n: number;
  label: string;
  /** The scores the descriptors in this activity can give, low to high. */
  points: number[];
  /** What to write about, for the letter. */
  prompt: string;
};

export const ACTIVITIES: Activity[] = [
  { id: "food", component: "dl", n: 1, label: "Preparing food", points: [0, 2, 4, 8], prompt: "peeling, chopping, using a cooker, and whether I need prompting, supervision or help to cook a simple meal" },
  { id: "nutrition", component: "dl", n: 2, label: "Taking nutrition", points: [0, 2, 4, 6, 10], prompt: "cutting food, getting it to my mouth, and whether I need prompting to eat" },
  { id: "therapy", component: "dl", n: 3, label: "Managing therapy or monitoring a health condition", points: [0, 1, 2, 4, 6, 8], prompt: "medication, monitoring and any therapy at home, and the help I need with it" },
  { id: "washing", component: "dl", n: 4, label: "Washing and bathing", points: [0, 2, 3, 4, 8], prompt: "getting in and out of the bath or shower, washing my hair and body, and the aids or help I need" },
  { id: "toilet", component: "dl", n: 5, label: "Managing toilet needs or incontinence", points: [0, 2, 4, 6, 8], prompt: "getting on and off the toilet, cleaning myself, and incontinence" },
  { id: "dressing", component: "dl", n: 6, label: "Dressing and undressing", points: [0, 2, 4, 8], prompt: "buttons, socks and shoes, choosing suitable clothes, and how long it takes" },
  { id: "communicating", component: "dl", n: 7, label: "Communicating verbally", points: [0, 2, 4, 8, 12], prompt: "speaking, hearing and understanding what's said" },
  { id: "reading", component: "dl", n: 8, label: "Reading and understanding signs, symbols and words", points: [0, 2, 4, 8], prompt: "reading and understanding everyday information, such as a letter or a sign" },
  { id: "engaging", component: "dl", n: 9, label: "Engaging with other people face to face", points: [0, 2, 4, 8], prompt: "meeting and talking with people, the anxiety or distress it causes, and who needs to be with me" },
  { id: "budgeting", component: "dl", n: 10, label: "Making budgeting decisions", points: [0, 2, 4, 6], prompt: "working out change, paying bills and planning what I spend" },
  { id: "journeys", component: "mob", n: 1, label: "Planning and following journeys", points: [0, 4, 8, 10, 12], prompt: "getting to places, familiar and unfamiliar, the distress a journey causes, and whether someone needs to come with me" },
  { id: "moving", component: "mob", n: 2, label: "Moving around", points: [0, 4, 8, 10, 12], prompt: "how far I can walk or move, safely and repeatedly, at a reasonable pace, and what happens afterwards" },
];

export const ACTIVITY_IDS = ACTIVITIES.map((a) => a.id);

export function getActivity(id: ActivityId): Activity {
  const a = ACTIVITIES.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown activity ${id}`);
  return a;
}

export const STANDARD = 8;
export const ENHANCED = 12;

/** Weekly rates from 6 April 2026. */
export const PIP_RATES: Record<Component, { standard: number; enhanced: number }> = {
  dl: { standard: 76.7, enhanced: 114.6 },
  mob: { standard: 30.3, enhanced: 80.0 },
};
export const RATES_FROM = "6 April 2026";

export type Rate = "none" | "standard" | "enhanced";

export function rateFor(points: number): Rate {
  return points >= ENHANCED ? "enhanced" : points >= STANDARD ? "standard" : "none";
}

export function weeklyFor(c: Component, r: Rate): number {
  return r === "none" ? 0 : PIP_RATES[c][r];
}

/** Points per activity: "" while blank, else a score that activity can give. */
export type Points = Partial<Record<ActivityId, string>>;

function pointsOf(p: Points, id: ActivityId): number {
  const v = p[id];
  if (v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ---------------- Inputs ---------------- */

export type YesNo = "" | "yes" | "no";

export type ChallengeInputs = {
  /** The claim, in a few words. Optional. */
  what: string;
  region: ChallengeRegion;
  benefit: Benefit;
  issue: Issue;
  stage: Stage;
  /** The date printed on the decision letter. */
  decisionOn: string;
  /** The day you asked for the reconsideration (if you're waiting). */
  askedOn: string;
  /** The date on the mandatory reconsideration notice. */
  mrOn: string;
  /** PIP: the points the letter gave you, by activity. */
  given: Points;
  /** PIP: the points you think apply. */
  yours: Points;
  /** If late: why, in your words. */
  lateReason: string;
  /** Has anything new come in: a letter from a doctor, a diary, a carer's note? */
  evidence: YesNo;
};

export const BLANK_CHALLENGE: ChallengeInputs = {
  what: "",
  region: "",
  benefit: "",
  issue: "",
  stage: "",
  decisionOn: "",
  askedOn: "",
  mrOn: "",
  given: {},
  yours: {},
  lateReason: "",
  evidence: "",
};

/* ---------------- The read ---------------- */

/** Base rates, labelled with their source and period. */
export const MR_CHANGED_PIP = 26; // per cent, DWP, quarter to July 2026
export const APPEAL_WON_PIP = 67; // per cent, HMCTS, January to March 2026
export const MR_WAIT_DAYS = 45; // new PIP claims, quarter to July 2026; longer on average overall
export const APPEAL_WAIT_MONTHS = 8;

export type Status =
  | "elsewhere"
  | "ask" // in time to ask for a reconsideration
  | "late" // past a month, inside 13
  | "lapsed" // past 13 months
  | "waiting" // asked, no answer yet
  | "appeal" // reconsideration said no; in time to appeal
  | "appealLate"
  | "appealLapsed";

export type CompRead = {
  component: Component;
  given: number;
  yours: number;
  givenRate: Rate;
  yoursRate: Rate;
  /** Weekly money now and on your own count. */
  givenWeekly: number;
  yoursWeekly: number;
};

export type Dispute = { activity: Activity; given: number; yours: number };

export type PipRead = {
  dl: CompRead;
  mob: CompRead;
  disputes: Dispute[];
  /** Weekly money you'd gain if your own count were accepted in full. */
  gainWeekly: number;
  /** You have an award now that a challenge could put at risk. */
  atRisk: boolean;
  /** Points were entered at all. */
  entered: boolean;
};

export type ChallengeRead = {
  status: Status;
  benefitName: string;
  /** The deadline for the next step you control, if one is running. */
  dueOn: string;
  /** The outer limit for a late request or appeal. */
  outerOn: string;
  daysLeft: number | null;
  /** Days waited on a reconsideration. */
  waited: number | null;
  pip: PipRead | null;
};

export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}

function compRead(c: Component, given: Points, yours: Points): CompRead {
  const acts = ACTIVITIES.filter((a) => a.component === c);
  const g = acts.reduce((s, a) => s + pointsOf(given, a.id), 0);
  // Where you've left your own column blank, your count is what they gave.
  const y = acts.reduce((s, a) => s + (yours[a.id] ? pointsOf(yours, a.id) : pointsOf(given, a.id)), 0);
  const gr = rateFor(g);
  const yr = rateFor(y);
  return { component: c, given: g, yours: y, givenRate: gr, yoursRate: yr, givenWeekly: weeklyFor(c, gr), yoursWeekly: weeklyFor(c, yr) };
}

export function readPip(inp: ChallengeInputs): PipRead {
  const dl = compRead("dl", inp.given, inp.yours);
  const mob = compRead("mob", inp.given, inp.yours);
  const disputes: Dispute[] = ACTIVITIES.filter((a) => inp.yours[a.id] && pointsOf(inp.yours, a.id) > pointsOf(inp.given, a.id)).map(
    (a) => ({ activity: a, given: pointsOf(inp.given, a.id), yours: pointsOf(inp.yours, a.id) }),
  );
  const entered = ACTIVITIES.some((a) => (inp.given[a.id] ?? "") !== "" || (inp.yours[a.id] ?? "") !== "");
  const gainWeekly = Math.max(0, dl.yoursWeekly - dl.givenWeekly) + Math.max(0, mob.yoursWeekly - mob.givenWeekly);
  const atRisk = dl.givenRate !== "none" || mob.givenRate !== "none" || inp.issue === "lower" || inp.issue === "length";
  return { dl, mob, disputes, gainWeekly, atRisk, entered };
}

export function challengeReady(inp: ChallengeInputs): boolean {
  if (!inp.region) return false;
  if (inp.region === "ni") return true;
  if (!inp.benefit) return false;
  if (inp.region === "scot" && inp.benefit === "pip") return true;
  if (!inp.stage) return false;
  if (inp.stage === "decision") return isISODate(inp.decisionOn);
  if (inp.stage === "waiting") return isISODate(inp.askedOn);
  return isISODate(inp.mrOn);
}

export function benefitName(inp: ChallengeInputs): string {
  const b = BENEFITS.find((x) => x.id === inp.benefit);
  return b?.name || "the benefit";
}

export function readChallenge(inp: ChallengeInputs, today = todayISO()): ChallengeRead | null {
  if (!challengeReady(inp)) return null;
  const name = benefitName(inp);
  const base = { benefitName: name, dueOn: "", outerOn: "", daysLeft: null, waited: null, pip: null };
  if (inp.region === "ni" || (inp.region === "scot" && inp.benefit === "pip")) return { ...base, status: "elsewhere" };
  const pip = inp.benefit === "pip" ? readPip(inp) : null;
  if (inp.stage === "waiting") {
    return { ...base, status: "waiting", waited: Math.max(0, daysBetween(inp.askedOn, today)), pip };
  }
  const from = inp.stage === "decision" ? inp.decisionOn : inp.mrOn;
  const dueOn = addMonthsISO(from, 1);
  const outerOn = addMonthsISO(from, 13);
  const daysLeft = daysBetween(today, dueOn);
  const inTime = today <= dueOn;
  const inOuter = today <= outerOn;
  const status: Status =
    inp.stage === "decision"
      ? inTime
        ? "ask"
        : inOuter
          ? "late"
          : "lapsed"
      : inTime
        ? "appeal"
        : inOuter
          ? "appealLate"
          : "appealLapsed";
  return { ...base, status, dueOn, outerOn, daysLeft, pip };
}

/* ---------------- Words ---------------- */

export function money(n: number): string {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function wholeMoney(n: number): string {
  return `£${Math.round(n).toLocaleString("en-GB")}`;
}

function daysWords(n: number): string {
  if (n === 0) return "today";
  return n === 1 ? "1 day" : `${n} days`;
}

function compName(c: Component): string {
  return c === "dl" ? "daily living" : "mobility";
}

function rateWords(r: Rate): string {
  return r === "none" ? "nothing" : `the ${r} rate`;
}

/** "2 points short of the standard rate", or null if there's nothing to say. */
function gapWords(c: CompRead): string | null {
  if (c.given >= ENHANCED) return null;
  if (c.given >= STANDARD) return `${ENHANCED - c.given} ${ENHANCED - c.given === 1 ? "point" : "points"} short of the enhanced rate`;
  return `${STANDARD - c.given} ${STANDARD - c.given === 1 ? "point" : "points"} short of the standard rate`;
}

/** The nearest gap across both components: the one-line hook for PIP. */
function nearestGap(p: PipRead): string | null {
  const opts = [p.dl, p.mob]
    .filter((c) => c.given < ENHANCED)
    .map((c) => ({ c, need: (c.given >= STANDARD ? ENHANCED : STANDARD) - c.given }))
    .sort((a, b) => a.need - b.need);
  const best = opts[0];
  if (!best || !p.entered) return null;
  return `You're ${gapWords(best.c)} of ${compName(best.c.component)}`;
}

export function challengeHeadline(inp: ChallengeInputs, read: ChallengeRead, today = todayISO()): string {
  const gap = read.pip && read.pip.entered ? nearestGap(read.pip) : null;
  switch (read.status) {
    case "elsewhere":
      return inp.region === "ni"
        ? "Northern Ireland has its own route: the Department for Communities, then the Appeals Service."
        : "In Scotland, PIP has become Adult Disability Payment, with its own route and its own deadlines.";
    case "ask": {
      const left = read.daysLeft ?? 0;
      const head =
        left === 0
          ? "Today is the last day to ask them to look again."
          : `You have ${daysWords(left)}, to ${actDate(read.dueOn)}, to ask them to look again.`;
      return gap ? `${head} ${gap}.` : head;
    }
    case "late":
      return `The month has passed, but you can still ask, with a reason, until ${letterDate(read.outerOn)}.`;
    case "lapsed":
      return "It's more than 13 months, so the usual route has closed. Two others may not have.";
    case "waiting": {
      const w = read.waited ?? 0;
      return w > 70
        ? `You've waited ${w} days. Nothing is running against you, and a chase is fair now.`
        : "Nothing is running against you while you wait. When the answer comes, you'll have a month.";
    }
    case "appeal": {
      const left = read.daysLeft ?? 0;
      const head = left === 0 ? "Today is the last day to appeal." : `Appeal by ${actDate(read.dueOn)}: ${daysWords(left)} left.`;
      return inp.benefit === "pip" ? `${head} About two in three PIP appeals go the claimant's way.` : `${head} The tribunal is independent of the DWP.`;
    }
    case "appealLate":
      return `The month has passed, but the tribunal can still accept the appeal, with a reason, until ${letterDate(read.outerOn)}.`;
    case "appealLapsed":
      return "It's more than 13 months since the reconsideration, so the appeal route has closed. A new claim may not have.";
  }
  void today;
}

function pipPointsPara(p: PipRead, inp: ChallengeInputs): string {
  const lines: string[] = [];
  lines.push(
    `They gave you ${p.dl.given} ${p.dl.given === 1 ? "point" : "points"} for daily living and ${p.mob.given} for mobility. Each component needs ${STANDARD} points for the standard rate and ${ENHANCED} for the enhanced, and only the highest descriptor in each activity counts.`,
  );
  if (p.disputes.length) {
    const own = `On your own count you'd have ${p.dl.yours} and ${p.mob.yours}: ${rateWords(p.dl.yoursRate)} of daily living and ${rateWords(p.mob.yoursRate)} of mobility`;
    lines.push(
      p.gainWeekly > 0
        ? `${own}, ${money(p.gainWeekly)} a week more than now (about ${wholeMoney(p.gainWeekly * 52)} a year, at the rates from ${RATES_FROM}).`
        : `${own}. That wouldn't change the rate, so check whether another activity is closer to the line before you spend effort on these.`,
    );
  } else {
    const gaps = [p.dl, p.mob].map((c) => (gapWords(c) ? `${gapWords(c)} of ${compName(c.component)}` : null)).filter(Boolean);
    if (gaps.length) lines.push(`You're ${gaps.join(", and ")}. Fill in your own column for any activity where the letter's points are too low, and the read will show what changes.`);
  }
  if (inp.issue === "length") lines.push("If only the length is wrong, say so plainly, and say why your condition won't improve in that time.");
  return lines.join(" ");
}

const RELIABLY =
  "A descriptor only counts if you can do the activity reliably: safely, to an acceptable standard, as often as you need to, and in a reasonable time (no more than twice as long as someone without your condition). And it has to apply on more than half of days. So write about what happens when you try, on the bad days as well as the good, not what you can manage once with gritted teeth.";

function riskPara(p: PipRead): string {
  const now = p.dl.givenWeekly + p.mob.givenWeekly;
  return `One caution. A challenge reopens the whole decision, so the DWP or a tribunal can lower what you have as well as raise it${now > 0 ? `: at the moment that's ${money(now)} a week` : ""}. Before you send it, read the assessment report for the activities they scored, and make sure your evidence supports those too. If you're unsure, a free adviser can look at it first.`;
}

function issuePara(inp: ChallengeInputs): string | null {
  switch (inp.issue) {
    case "sanction":
      return "A sanction only applies if you failed to do something without a good reason. Say what happened that day and why, with anything that shows it: an appointment letter, a hospital or GP note, a message about a caring emergency, a bus that didn't come. If the sanction leaves you short of food, heating or rent, ask for a hardship payment through your journal or by phone. It's repaid from later payments, but it covers the gap while you challenge.";
    case "overpayment":
      return inp.benefit === "uc"
        ? "With Universal Credit, the DWP can recover almost any overpayment, even one caused by its own mistake. What you can challenge is whether you were overpaid and by how much, so ask for the calculation, period by period, and check it against your statements. Separately, you can ask DWP Debt Management to lower the deduction, or to write some off if repaying would cause real hardship. That's a request, not an appeal, and you can make it at the same time."
        : "Two things can be challenged: whether you were overpaid and by how much, and (for most benefits other than Universal Credit) whether it can be recovered at all, for example if it was the DWP's mistake and you couldn't reasonably have known. Ask for the calculation, period by period. Separately, you can ask DWP Debt Management to lower the repayments.";
    case "work":
      return "Ask for the assessment report first: it lists the descriptors the assessor considered and the points they gave. Then point to the specific activities they got wrong, with what happens when you try, how often, and what a doctor or support worker has seen.";
    case "amount":
      return inp.benefit === "uc"
        ? "Check the statement in your journal line by line: the standard allowance, housing, children, childcare, the carer element and any health element. Say which line is wrong or missing, what it should be, and send what proves it: a tenancy agreement, a childcare invoice, a fit note."
        : "Say what the amount should be and why, with what proves it.";
    case "reduced":
      return "If your condition hasn't improved since the last award, say so directly: what's the same, what's worse, and what evidence shows it. A reduction at review is a new decision, and it has to be justified on the evidence like any other.";
    case "refused":
      return inp.benefit === "pip" ? null : "Ask for the reason in writing if the letter doesn't give one clearly. Then answer that reason, with evidence.";
    default:
      return null;
  }
}

function baseRatePara(inp: ChallengeInputs, read: ChallengeRead): string {
  if (inp.benefit === "pip")
    return `What usually happens: about one in four PIP reconsiderations changes the award (${MR_CHANGED_PIP}%, DWP figures for the quarter to July 2026). About two in three PIP appeals that reach the tribunal go the claimant's way (${APPEAL_WON_PIP}%, January to March 2026). Many people stop after the first "no"${read.status === "appeal" || read.status === "appealLate" ? ", which is where you are now" : ""}, and that's exactly where the odds turn. The tribunal is a judge, a doctor and a disability expert who hear you in person; the decision was made on paper.`;
  return "What usually happens: a reconsideration changes the decision less often than an appeal does. The tribunal is independent of the DWP, hears you in person, and is where many decisions are put right. Many people stop after the reconsideration says no, which is exactly where the odds turn.";
}

function backPayPara(inp: ChallengeInputs): string {
  return inp.benefit === "pip"
    ? "If you win, the award is paid back to the date the decision took effect, so the wait costs you time, not the money. A full challenge can take most of a year: about six weeks or more for the reconsideration, and around eight months for an appeal."
    : "If you win, the money is paid back to the date the decision took effect, so the wait costs you time, not the money.";
}

function evidencePara(inp: ChallengeInputs): string {
  if (inp.issue === "overpayment" || inp.issue === "amount")
    return "Evidence here is paperwork: your statements or journal, payslips, bank statements, a tenancy agreement or childcare invoices for the period in question. Send copies, never originals, and say in one line what each shows.";
  if (inp.issue === "sanction")
    return "Send whatever shows what happened: the appointment letter or journal message, a hospital or GP note, texts, a bus or train company's notice. Copies, not originals.";
  return inp.evidence === "yes"
    ? "Send the new evidence with your letter, and say in one line what each piece shows. A letter that says what someone has seen you struggle with is worth more than one that only lists a diagnosis."
    : "New evidence moves decisions more than argument does. A short letter from someone who sees you (a GP, a nurse, a support worker, a carer, a friend) saying what they've seen you struggle with, a week's diary of what happened when you tried, a prescription list. You don't need it all before you send the letter: say it's coming.";
}

export function challengeBody(inp: ChallengeInputs, read: ChallengeRead, today = todayISO()): string {
  const paras: string[] = [];
  const pip = read.pip;
  switch (read.status) {
    case "elsewhere":
      if (inp.region === "ni")
        paras.push(
          "In Northern Ireland, benefits are run by the Department for Communities. The shape is the same (ask for a reconsideration, usually within a month of the decision, then appeal to the Appeals Service), but the forms and addresses differ. Advice NI can help for free, and check the date on your letter today.",
        );
      else
        paras.push(
          "Social Security Scotland runs Adult Disability Payment. You ask it for a re-determination first, then appeal to the tribunal, with its own deadlines, which aren't the DWP's. Check the date on your letter today and ask straight away; Citizens Advice Scotland can help for free. Universal Credit and ESA in Scotland are DWP benefits, so for those, pick them above.",
        );
      return paras.join("\n\n");
    case "ask":
      paras.push(
        `To challenge a DWP decision you first ask for a mandatory reconsideration: the DWP looks at it again. You have to ask within one calendar month of the date on the letter (${letterDate(inp.decisionOn)}), so by ${letterDate(read.dueOn)}. Don't wait for the perfect evidence: send the request in time, say what's wrong, and say more is coming.`,
      );
      break;
    case "late":
      paras.push(
        `The one-month deadline was ${letterDate(read.dueOn)}. The DWP can still accept a late request up to 13 months from the decision, so until ${letterDate(read.outerOn)}, if you give a reason: you were ill, in hospital, caring for someone, or the letter didn't reach you. Say why in a sentence or two at the top of the letter and send it now; every week makes the reason harder to accept.`,
      );
      break;
    case "lapsed":
      paras.push(
        `The decision was more than 13 months ago (${letterDate(inp.decisionOn)}), so a reconsideration won't be accepted now. Two routes may still be open. If the DWP made a clear mistake of fact or law (got a date wrong, ignored evidence it had, misapplied a rule), you can ask for it to be corrected for official error, which has no time limit. And if things are as they were or worse, you can make a new claim today.`,
      );
      return paras.join("\n\n");
    case "waiting": {
      const w = read.waited ?? 0;
      paras.push(
        `You asked on ${letterDate(inp.askedOn)}, ${w === 1 ? "1 day" : `${w} days`} ago. No deadline runs against you while the DWP decides. Reconsiderations often take six weeks or more${inp.benefit === "pip" ? ", and the average across all PIP cases has been longer" : ""}.${w > 70 ? " After ten weeks it's fair to chase: ring, ask where it is and when to expect it, and note the date and the name of who you spoke to." : ""}`,
      );
      paras.push(
        "When the answer comes it's called a mandatory reconsideration notice. If it still says no, or not enough, you have one month from the date on it to appeal to the tribunal. Put it in your calendar the day it arrives. Meanwhile, keep collecting evidence: it's not too late to send more.",
      );
      if (pip && pip.entered) paras.push(pipPointsPara(pip, inp));
      paras.push(baseRatePara(inp, read));
      return paras.join("\n\n");
    }
    case "appeal":
      paras.push(
        `The reconsideration didn't change it, so the next step is an appeal to an independent tribunal (HM Courts and Tribunals Service, not the DWP). You have one calendar month from the date on the notice (${letterDate(inp.mrOn)}), so until ${letterDate(read.dueOn)}. You can appeal online on GOV.UK ("appeal a benefit decision") or on form SSCS1, with a copy of the reconsideration notice.`,
      );
      paras.push(
        "Ask for a hearing (in person, by phone or by video) rather than a decision on the papers: the tribunal can ask you questions, and your answers are often what changes it. You can bring someone with you.",
      );
      break;
    case "appealLate":
      paras.push(
        `The one-month deadline was ${letterDate(read.dueOn)}. The tribunal can still accept a late appeal up to 13 months after the reconsideration notice, so until ${letterDate(read.outerOn)}, if you explain why. A late appeal is usually let through if the DWP doesn't object. Appeal online on GOV.UK ("appeal a benefit decision") or on form SSCS1, with the reason at the top.`,
      );
      break;
    case "appealLapsed":
      paras.push(
        "The tribunal can't accept an appeal more than 13 months after the reconsideration notice. If the DWP made a clear mistake of fact or law, you can still ask for it to be corrected for official error, which has no time limit, and you can make a new claim today if things are as they were or worse.",
      );
      return paras.join("\n\n");
  }
  if (pip && pip.entered) paras.push(pipPointsPara(pip, inp));
  if (inp.benefit === "pip" && inp.issue !== "length") paras.push(RELIABLY);
  const issue = issuePara(inp);
  if (issue) paras.push(issue);
  paras.push(evidencePara(inp));
  if (pip && pip.atRisk && inp.issue !== "refused") paras.push(riskPara(pip));
  paras.push(baseRatePara(inp, read));
  paras.push(backPayPara(inp));
  void today;
  return paras.join("\n\n");
}

/* ---------------- Steps ---------------- */

export type Step = { on: string; title: string; note: string; done?: boolean; passed?: boolean; key?: boolean; approx?: boolean };

function sortSteps(steps: Step[]): Step[] {
  return steps
    .map((s, i) => ({ s, i }))
    .sort((x, y) => (x.s.on < y.s.on ? -1 : x.s.on > y.s.on ? 1 : x.i - y.i))
    .map((x) => x.s);
}

function wantsReport(inp: ChallengeInputs): boolean {
  return inp.benefit === "pip" || inp.issue === "work";
}

export function stepsOf(inp: ChallengeInputs, read: ChallengeRead, today = todayISO()): Step[] {
  const s: Step[] = [];
  const decided = isISODate(inp.decisionOn);
  if (read.status === "ask" || read.status === "late") {
    s.push({ on: inp.decisionOn, title: "The decision letter", note: "The month counts from the date printed on it, not the day it arrived.", done: true });
    if (wantsReport(inp))
      s.push({ on: today, title: "Ask for the assessment report", note: "By phone or letter. It shows what the assessor wrote, so you can answer it point by point." });
    if (read.status === "ask")
      s.push({
        on: read.dueOn,
        title: "Last day to ask for a reconsideration",
        note: "Send it before this, even if more evidence is still coming.",
        key: true,
      });
    else
      s.push({
        on: today,
        title: "Send the late reconsideration request today",
        note: `With your reason at the top. The outer limit is ${letterDate(read.outerOn)}.`,
        key: true,
      });
    const sent = today;
    s.push({ on: addDaysISO(sent, MR_WAIT_DAYS), title: "The answer", note: "The mandatory reconsideration notice. Often six weeks, sometimes longer.", approx: true });
    s.push({ on: addMonthsISO(addDaysISO(sent, MR_WAIT_DAYS), 1), title: "The last day to appeal, if it's still no", note: "A month from the date on the notice.", approx: true });
  } else if (read.status === "waiting") {
    if (decided) s.push({ on: inp.decisionOn, title: "The decision letter", note: "", done: true });
    s.push({ on: inp.askedOn, title: "You asked for a reconsideration", note: "Nothing runs against you while you wait.", done: true });
    const expect = addDaysISO(inp.askedOn, MR_WAIT_DAYS);
    s.push({ on: expect < today ? today : expect, title: expect < today ? "The answer, any day now" : "The answer", note: "If it's still no, a month to appeal from the date on it.", approx: expect >= today });
    if ((read.waited ?? 0) <= 70) s.push({ on: addDaysISO(inp.askedOn, 70), title: "Chase it if nothing's come", note: "Ring, and note the date and who you spoke to." });
  } else if (read.status === "appeal" || read.status === "appealLate") {
    if (decided) s.push({ on: inp.decisionOn, title: "The decision letter", note: "", done: true });
    s.push({ on: inp.mrOn, title: "The reconsideration notice", note: "The month to appeal counts from the date printed on it.", done: true });
    s.push(
      read.status === "appeal"
        ? { on: read.dueOn, title: "Last day to appeal", note: "Online on GOV.UK or on form SSCS1, with a copy of the notice.", key: true }
        : { on: today, title: "Send the late appeal today", note: `With the reason at the top. The outer limit is ${letterDate(read.outerOn)}.`, key: true },
    );
    const from = read.status === "appeal" ? (today < read.dueOn ? today : read.dueOn) : today;
    s.push({
      on: addMonthsISO(from, APPEAL_WAIT_MONTHS),
      title: "The hearing",
      approx: true,
      note: "Waits run to about eight months. The DWP sends its bundle first: read it and send anything you want the tribunal to see.",
    });
  }
  for (const x of s) if (!x.done && x.on < today) x.passed = true;
  return sortSteps(s);
}

/* ---------------- Letters ---------------- */

export type ChallengeLetter = { id: string; title: string; note: string; text: string };

function header(inp: ChallengeInputs, today: string, subject: string): string[] {
  return [
    "[Your name]",
    "[Your address]",
    "National Insurance number: [your NI number]",
    "",
    letterDate(today),
    "",
    "Dear Sir or Madam,",
    "",
    subject,
    "",
  ];
}

function signOff(): string[] {
  return ["", "Yours faithfully,", "", "[Your name]", "[Your phone number]"];
}

function decisionRef(inp: ChallengeInputs): string {
  return `${benefitName(inp)}: decision dated ${isISODate(inp.decisionOn) ? letterDate(inp.decisionOn) : "[date on the decision letter]"}`;
}

function disputeLines(inp: ChallengeInputs, p: PipRead | null): string[] {
  if (!p || !p.disputes.length) {
    if (inp.benefit !== "pip") return [];
    return [
      "Activity [number], [name]: you gave me [x] points. I believe descriptor [letter] applies, worth [y] points, because [what happens when I try, how often, how long it takes, and whether I can do it safely and repeatedly].",
      "",
    ];
  }
  const out: string[] = [];
  for (const d of p.disputes) {
    const a = d.activity;
    out.push(
      `${a.component === "dl" ? "Daily living" : "Mobility"} activity ${a.n}, ${a.label.toLowerCase()}: you gave me ${d.given} ${d.given === 1 ? "point" : "points"}. I believe a descriptor worth ${d.yours} ${d.yours === 1 ? "point" : "points"} applies, because [describe ${a.prompt}: what happens when I try, how often, how long it takes, and whether I can do it safely and repeatedly].`,
      "",
    );
  }
  return out;
}

function totalsLine(p: PipRead | null): string[] {
  if (!p || !p.disputes.length) return [];
  const parts: string[] = [];
  if (p.dl.yours !== p.dl.given) parts.push(`${p.dl.yours} points for daily living (${rateWords(p.dl.yoursRate)})`);
  if (p.mob.yours !== p.mob.given) parts.push(`${p.mob.yours} points for mobility (${rateWords(p.mob.yoursRate)})`);
  if (!parts.length) return [];
  return [`Taken together, that gives ${parts.join(" and ")}.`, ""];
}

function reasonsBlock(inp: ChallengeInputs, read: ChallengeRead): string[] {
  const appeal = read.status === "appeal" || read.status === "appealLate";
  const out: string[] = [];
  const p = read.pip;
  if (inp.benefit === "pip") {
    out.push(...disputeLines(inp, p), ...totalsLine(p));
    if (inp.issue === "length") out.push("I also disagree with the length of the award, because [why your condition won't improve in that time].", "");
    out.push("These difficulties apply on most days, and I can't do these activities reliably: safely, to an acceptable standard, repeatedly, and in a reasonable time.", "");
  } else {
    switch (inp.issue) {
      case "sanction":
        out.push("I had a good reason for [what you're said to have failed to do] on [date]: [what happened, and why].", "");
        break;
      case "overpayment":
        out.push(
          appeal
            ? "I don't accept that I was overpaid [or: that I was overpaid this much]. The DWP should show, period by period, what was paid and what it says should have been paid."
            : "I don't accept that I was overpaid [or: that I was overpaid this much]. Please send me a full calculation of the overpayment, period by period, showing what was paid and what you say should have been paid.",
          "",
          "[Why you think it's wrong.]",
          "",
        );
        break;
      case "work":
        out.push(
          "The assessment doesn't reflect what I can and can't do. In particular: [activity]: [what happens when I try, how often, and what a doctor or support worker has seen].",
          "",
        );
        break;
      case "amount":
        out.push("The amount is wrong because [which part is wrong or missing, and what it should be].", "");
        break;
      default:
        out.push("I believe the decision is wrong because [your reasons].", "");
    }
  }
  return out;
}

function evidenceLine(inp: ChallengeInputs): string[] {
  return inp.evidence === "yes"
    ? ["I enclose: [list each piece of evidence, and in a few words what it shows].", ""]
    : ["I am gathering further evidence and will send it as soon as I can. Please take it into account before you decide.", ""];
}

export function challengeLetters(inp: ChallengeInputs, read: ChallengeRead, today = todayISO()): ChallengeLetter[] {
  const out: ChallengeLetter[] = [];
  const st = read.status;
  if ((st === "ask" || st === "late" || st === "waiting") && wantsReport(inp)) {
    out.push({
      id: "report",
      title: "Ask for the assessment report",
      note: "Send it today, or ask by phone: it's often quicker. You can send the reconsideration before the report arrives.",
      text: [
        ...header(inp, today, decisionRef(inp)),
        `Please send me a copy of the assessment report${inp.benefit === "pip" ? " (the PA4)" : ""} and any other evidence used to make this decision.`,
        "",
        st === "waiting"
          ? "I have already asked for a mandatory reconsideration, and would like to see the report so I can send any further comments."
          : "I intend to ask for a mandatory reconsideration of the decision.",
        ...signOff(),
      ].join("\n"),
    });
  }
  if (st === "ask" || st === "late") {
    const late =
      st === "late"
        ? [
            `I am asking for this reconsideration after the one-month time limit, because ${inp.lateReason.trim() ? inp.lateReason.trim().replace(/\.$/, "") : "[your reason: illness, a hospital stay, caring, or the letter not reaching you]"}. I ask you to accept it as it is within 13 months of the decision.`,
            "",
          ]
        : [];
    out.push({
      id: "mr",
      title: st === "late" ? "Ask for a late reconsideration" : "Ask for a mandatory reconsideration",
      note:
        inp.benefit === "uc"
          ? "Universal Credit: post it in your journal, then keep a screenshot. Fill in every [bracket] in your own words; the specific examples are what change decisions."
          : "Send it to the address on the decision letter, or ring and then confirm in writing. Keep a copy and proof of posting. Fill in every [bracket] in your own words; the specific examples are what change decisions.",
      text: [
        ...header(inp, today, `Mandatory reconsideration request: ${decisionRef(inp)}`),
        `I am asking for a mandatory reconsideration of this decision. I believe it is wrong for the reasons below.`,
        "",
        ...late,
        ...reasonsBlock(inp, read),
        ...evidenceLine(inp),
        ...(wantsReport(inp) ? ["Please also send me a copy of the assessment report, if you haven't already.", ""] : []),
        "If you need more information before you decide, please phone me on [your phone number].",
        ...signOff(),
      ].join("\n"),
    });
  }
  if (st === "appeal" || st === "appealLate") {
    out.push({
      id: "grounds",
      title: "Your grounds of appeal",
      note: "Paste this into the \"reasons for appealing\" box on the online form, or onto form SSCS1. Keep it to what's wrong and why; the hearing is where you say the rest.",
      text: [
        ...(st === "appealLate"
          ? [
              `This appeal is late because ${inp.lateReason.trim() ? inp.lateReason.trim().replace(/\.$/, "") : "[your reason]"}. I ask the tribunal to accept it, as it is within 13 months of the reconsideration notice.`,
              "",
            ]
          : []),
        `I am appealing against the ${benefitName(inp)} decision, as confirmed by the mandatory reconsideration notice dated ${letterDate(inp.mrOn)}.`,
        "",
        ...reasonsBlock(inp, read),
        "I would like an oral hearing.",
      ].join("\n"),
    });
  }
  if (st === "waiting" && (read.waited ?? 0) > 70) {
    out.push({
      id: "chase",
      title: "Chase the reconsideration",
      note: "By phone first; send this if the call gets nowhere.",
      text: [
        ...header(inp, today, `Mandatory reconsideration: ${decisionRef(inp)}`),
        `I asked for a mandatory reconsideration of this decision on ${letterDate(inp.askedOn)}, ${read.waited} days ago, and haven't had a decision. Please tell me when I can expect it.`,
        ...signOff(),
      ].join("\n"),
    });
  }
  return out;
}

/* ---------------- Checklists and the rest ---------------- */

export function appealChecklist(inp: ChallengeInputs): string[] {
  return [
    "The mandatory reconsideration notice: the form asks for a copy, and won't go through without it.",
    "Your National Insurance number and the dates on both letters.",
    "Your grounds (below), and the names of anyone who'll come with you or can give evidence.",
    "Ask for a hearing, and say which dates you can't do and any help you need to take part.",
    inp.benefit === "pip"
      ? "Afterwards, the DWP sends its bundle: the assessment, the decisions and its reasons. Read it, mark what's wrong, and send the tribunal anything new well before the hearing."
      : "Afterwards, the DWP sends its bundle: read it, mark what's wrong, and send anything new well before the hearing.",
  ];
}

export function remindersOf(inp: ChallengeInputs, read: ChallengeRead, today: string): { on: string; title: string; body: string }[] {
  const out: { on: string; title: string; body: string }[] = [];
  const name = benefitName(inp);
  if (read.status === "ask" && read.dueOn >= today) {
    const early = addDaysISO(read.dueOn, -7);
    if (early > today) out.push({ on: early, title: `${name}: send the reconsideration this week`, body: `The last day is ${letterDate(read.dueOn)}.` });
    out.push({ on: read.dueOn, title: `${name}: last day to ask for a reconsideration`, body: "Send it today if you haven't." });
  }
  if (read.status === "appeal" && read.dueOn >= today) {
    const early = addDaysISO(read.dueOn, -7);
    if (early > today) out.push({ on: early, title: `${name}: send the appeal this week`, body: `The last day is ${letterDate(read.dueOn)}.` });
    out.push({ on: read.dueOn, title: `${name}: last day to appeal`, body: "Online on GOV.UK or form SSCS1, with the reconsideration notice." });
  }
  if (read.status === "waiting" && (read.waited ?? 0) <= 70)
    out.push({ on: addDaysISO(inp.askedOn, 70), title: `${name}: chase the reconsideration`, body: "Ring and ask when to expect it." });
  return out;
}

export function challengeRule(): string {
  return "When a benefit decision goes against me, I write the deadline down the day the letter arrives, ask for the report, and send my reasons inside the month, with evidence to follow. If the answer is still no, I appeal. The first no is a draft.";
}

export function challengeSummary(inp: ChallengeInputs, read: ChallengeRead, today = todayISO()): string {
  const lines: string[] = [];
  lines.push(`Challenging a benefit decision${inp.what.trim() ? `: ${inp.what.trim()}` : ""}`);
  lines.push("", challengeHeadline(inp, read, today), "", challengeBody(inp, read, today));
  const steps = stepsOf(inp, read, today);
  if (steps.length) {
    lines.push("", "The steps:");
    for (const s of steps) lines.push(`- ${s.approx ? "About " : ""}${letterDate(s.on)}: ${s.title}.${s.note ? ` ${s.note}` : ""}`);
  }
  for (const l of challengeLetters(inp, read, today)) lines.push("", `${l.title}:`, "", l.text);
  lines.push("", challengeRule());
  return lines.join("\n");
}

/* ---------------- Storage ---------------- */

const REGIONS: ChallengeRegion[] = ["gb", "scot", "ni"];
const BENEFIT_IDS: Benefit[] = ["pip", "uc", "esa", "other"];
const STAGES: Stage[] = ["decision", "waiting", "upheld"];
const ISSUE_IDS: Issue[] = ["refused", "lower", "reduced", "length", "sanction", "overpayment", "work", "amount"];
const YN: YesNo[] = ["yes", "no"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

function points(v: unknown): Points {
  if (!v || typeof v !== "object") return {};
  const raw = v as Record<string, unknown>;
  const out: Points = {};
  for (const a of ACTIVITIES) {
    const x = raw[a.id];
    if (typeof x === "string" && x !== "" && a.points.includes(Number(x))) out[a.id] = x;
  }
  return out;
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseChallengeInputs(raw: unknown): ChallengeInputs {
  if (!raw || typeof raw !== "object") return BLANK_CHALLENGE;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what),
    region: oneOf(v.region, REGIONS),
    benefit: oneOf(v.benefit, BENEFIT_IDS),
    issue: oneOf(v.issue, ISSUE_IDS),
    stage: oneOf(v.stage, STAGES),
    decisionOn: date(v.decisionOn),
    askedOn: date(v.askedOn),
    mrOn: date(v.mrOn),
    given: points(v.given),
    yours: points(v.yours),
    lateReason: str(v.lateReason, 400),
    evidence: oneOf(v.evidence, YN),
  };
}

/**
 * The worked example: a first PIP claim turned down nine days ago with 6
 * points for daily living and 4 for mobility, where two activities were
 * scored too low.
 */
export function challengeExample(today = todayISO()): ChallengeInputs {
  return {
    what: "my PIP claim",
    region: "gb",
    benefit: "pip",
    issue: "refused",
    stage: "decision",
    decisionOn: addDaysISO(today, -9),
    askedOn: "",
    mrOn: "",
    given: { food: "2", washing: "2", dressing: "2", moving: "4" },
    yours: { washing: "4", therapy: "1", moving: "8" },
    lateReason: "",
    evidence: "no",
  };
}
