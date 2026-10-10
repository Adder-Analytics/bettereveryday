/**
 * The read behind "If It Were Next Week" (/later).
 *
 * Someone asks you to do something a good way off: a talk in March, a
 * committee seat from the autumn, helping a friend move next month. Saying yes
 * is easy because the cost lands on a future week that looks empty from here.
 * Zauberman and Lynch (JEP: General, 2005) found people expect more spare time
 * in the future than they have now, more so for time than for money, and
 * discount future time accordingly. Liberman and Trope (JPSP, 1998) found that
 * distant choices are made on desirability (why it'd be good) and near ones on
 * feasibility (how it'd fit). By the time the week arrives it is as full as
 * this one, and the yes has turned into "why did I agree to this?".
 *
 * The test is to move the ask into the near view: count the real hours, then
 * picture it landing next week, out of the week you actually have.
 *
 * The read, checked in order:
 *   1. "yes"     — you'd clear next week for it. A real yes, from a want or a
 *                  use, or an obligation you're willing to pay.
 *   2. "no"      — you wouldn't do it next week. The distance was doing the
 *                  deciding, so decline now, while it's cheap to.
 *   3. "smaller" — only grudgingly, but you want it or it's useful. Say yes to
 *                  a smaller version.
 *   4. "pressure"— only grudgingly, and the reason is guilt, flattery or a
 *                  debt. That's a hard-to-say-no, not a yes.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

/** How far off the thing is. */
export type When = "" | "week" | "weeks" | "months" | "far";
/** If it landed next week, out of the week you actually have. */
export type NextWeek = "" | "yes" | "grudging" | "no";
/** The main reason yes is tempting. */
export type Reason = "" | "want" | "useful" | "guilt" | "flattered" | "owe";
/** If you said yes and wanted out later, how hard would it be? */
export type Exit = "" | "easy" | "awkward" | "stuck";

export type LaterInputs = {
  ask: string;
  who: string;
  when: When;
  hoursEvent: string;
  hoursPrep: string;
  hoursTravel: string;
  hoursAfter: string;
  displaces: string;
  nextWeek: NextWeek;
  reason: Reason;
  exit: Exit;
  smaller: string;
};

export const BLANK_LATER: LaterInputs = {
  ask: "",
  who: "",
  when: "",
  hoursEvent: "",
  hoursPrep: "",
  hoursTravel: "",
  hoursAfter: "",
  displaces: "",
  nextWeek: "",
  reason: "",
  exit: "",
  smaller: "",
};

export type LaterKind = "yes" | "no" | "smaller" | "pressure";

export type LaterRead = { kind: LaterKind };

/** Reasons that make yes hard to refuse rather than worth giving. */
export function isPressure(r: Reason): boolean {
  return r === "guilt" || r === "flattered" || r === "owe";
}

/**
 * The read so far, or null while the questions that decide it are unanswered.
 * "No" doesn't need a reason: if you wouldn't do it next week, why yes is
 * tempting can't rescue it.
 */
export function readLater(inp: LaterInputs): LaterRead | null {
  if (inp.nextWeek === "no") return { kind: "no" };
  if (!inp.nextWeek || !inp.reason) return null;
  if (inp.nextWeek === "yes") return { kind: "yes" };
  return { kind: isPressure(inp.reason) ? "pressure" : "smaller" };
}

/**
 * Parse an hours field the way people type it: "3", "2.5", "1,5", "90 min",
 * "half a day" is not supported. Blank or unreadable → null. Negative → null.
 */
export function parseHours(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(",", ".");
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minutes)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0) return null;
  const unit = m[2] ?? "h";
  return unit.startsWith("m") ? n / 60 : n;
}

/** True when a field has text that can't be read as hours. */
export function hoursInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseHours(raw) === null;
}

export type HoursBreakdown = {
  event: number;
  prep: number;
  travel: number;
  after: number;
  total: number;
  /** How many fields had a readable value. */
  filled: number;
};

export function totalHours(inp: LaterInputs): HoursBreakdown {
  const vals = [inp.hoursEvent, inp.hoursPrep, inp.hoursTravel, inp.hoursAfter].map(parseHours);
  const [event, prep, travel, after] = vals.map((v) => v ?? 0);
  return {
    event,
    prep,
    travel,
    after,
    total: event + prep + travel + after,
    filled: vals.filter((v) => v !== null).length,
  };
}

/** "14 hours", "1 hour", "2.5 hours", "45 minutes". */
export function formatHours(h: number): string {
  if (h > 0 && h < 1) {
    const mins = Math.round(h * 60);
    return `${mins} minute${mins === 1 ? "" : "s"}`;
  }
  const r = Math.round(h * 10) / 10;
  const txt = Number.isInteger(r) ? String(r) : r.toFixed(1);
  return `${txt} hour${r === 1 ? "" : "s"}`;
}

/**
 * The total put in terms of a week, which is the unit the next-week test asks
 * you to picture. A working day is taken as eight hours.
 */
export function hoursInDays(h: number): string | null {
  if (h < 4) return null;
  const days = h / 8;
  if (days < 0.75) return "about half a working day";
  if (days < 1.25) return "about a full working day";
  const half = Math.round(days * 2) / 2;
  const txt = Number.isInteger(half) ? String(half) : half.toFixed(1);
  return `about ${txt} working days`;
}

/**
 * The share of the total that isn't the thing itself: prep, travel and the
 * day after. That's the part the far-off view leaves out.
 */
export function hiddenShare(b: HoursBreakdown): number | null {
  if (b.total <= 0 || b.event <= 0) return null;
  return (b.total - b.event) / b.total;
}

/** The ask, for mid-sentence use, with a fallback that's never blank. */
export function askName(inp: LaterInputs): string {
  const s = inp.ask.trim().replace(/[.!\s]+$/, "");
  if (!s) return "this";
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** The answer's headline: the words printed largest, and spoken. */
export function laterHeadline(read: LaterRead): string {
  switch (read.kind) {
    case "yes":
      return "Yes. It passes the next-week test.";
    case "no":
      return "No. Only the distance made it a yes.";
    case "smaller":
      return "A smaller yes.";
    case "pressure":
      return "Not a yes. A hard-to-say-no.";
  }
}

/**
 * A short reply to send, in plain words, so the answer actually leaves the
 * page. Deliberately brief: a decline that explains too much invites a
 * counter-argument. The person can edit it before sending.
 */
export function replyText(inp: LaterInputs, read: LaterRead): string {
  const smaller = inp.smaller.trim().replace(/[.!\s]+$/, "");
  switch (read.kind) {
    case "yes":
      return "Yes, I'd be glad to. I'll block out the time for it now.";
    case "no":
      return "Thank you for thinking of me. I can't take this on, and I'd rather say so now than let you down nearer the time. I hope it goes really well.";
    case "smaller":
    case "pressure":
      if (smaller) {
        return read.kind === "smaller"
          ? `Thank you for asking me. I can't take on the whole thing, but I could ${lowerFirst(smaller)}. Would that help?`
          : `Thank you for thinking of me. I can't take this on, but I could ${lowerFirst(smaller)}, if that's useful.`;
      }
      return read.kind === "smaller"
        ? "Thank you for asking me. I can't take on the whole thing, but I'd like to help with part of it. Could we talk about a smaller piece?"
        : "Thank you for thinking of me. I can't take this on, and I'd rather say so now than let you down nearer the time. I hope it goes really well.";
  }
}

function lowerFirst(s: string): string {
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** The plain-text record, for notes or a message to yourself. */
export function laterSummary(inp: LaterInputs, read: LaterRead): string {
  const lines: string[] = [];
  const ask = inp.ask.trim();
  const who = inp.who.trim();
  if (ask) lines.push(who ? `${ask} (asked by ${lowerFirst(who)})` : ask);
  const b = totalHours(inp);
  if (b.total > 0) {
    const days = hoursInDays(b.total);
    lines.push(`Real cost: ${formatHours(b.total)}${days ? ` (${days})` : ""}`);
  }
  if (inp.displaces.trim()) lines.push(`It comes out of: ${inp.displaces.trim()}`);
  lines.push("");
  lines.push(laterHeadline(read));
  lines.push("");
  lines.push(`Reply: ${replyText(inp, read)}`);
  return lines.join("\n");
}

const WHENS: When[] = ["week", "weeks", "months", "far"];
const NEXTS: NextWeek[] = ["yes", "grudging", "no"];
const REASONS: Reason[] = ["want", "useful", "guilt", "flattered", "owe"];
const EXITS: Exit[] = ["easy", "awkward", "stuck"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseLaterInputs(raw: unknown): LaterInputs {
  if (!raw || typeof raw !== "object") return BLANK_LATER;
  const v = raw as Record<string, unknown>;
  const str = (k: keyof LaterInputs) => (typeof v[k] === "string" ? (v[k] as string) : "");
  return {
    ask: str("ask"),
    who: str("who"),
    when: oneOf(v.when, WHENS),
    hoursEvent: str("hoursEvent"),
    hoursPrep: str("hoursPrep"),
    hoursTravel: str("hoursTravel"),
    hoursAfter: str("hoursAfter"),
    displaces: str("displaces"),
    nextWeek: oneOf(v.nextWeek, NEXTS),
    reason: oneOf(v.reason, REASONS),
    exit: oneOf(v.exit, EXITS),
    smaller: str("smaller"),
  };
}

/**
 * The worked example: asked in June to give a talk at a regional meetup in
 * October. The talk is 45 minutes; the real cost is fifteen hours. Next week
 * it'd be a grudging yes, and the pull is mostly flattery, so it's a
 * hard-to-say-no, answered with a smaller offer.
 */
export const LATER_EXAMPLE: LaterInputs = {
  ask: "Give a talk at the regional data meetup in October",
  who: "An organiser I met once",
  when: "months",
  hoursEvent: "3",
  hoursPrep: "10",
  hoursTravel: "2",
  hoursAfter: "",
  displaces: "Two evenings and a Saturday with the kids",
  nextWeek: "grudging",
  reason: "flattered",
  exit: "stuck",
  smaller: "Share last year's slides with whoever gives it",
};
