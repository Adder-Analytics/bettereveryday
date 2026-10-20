/**
 * The read behind "Lend It, Give It, or Say No?" (/lend).
 *
 * A brother needs £800 for the car. A friend is short on rent until payday. A
 * cousin asks you to co-sign the loan for her van. Each is the same call, made
 * at the worst moment: in person or by message, with someone you love waiting
 * for an answer. Three things make it go wrong:
 *
 *   - A loan between friends is two relationships at once. Margaret Clark and
 *     Judson Mills (JPSP, 1979) separated communal relationships, where people
 *     give in response to need and don't keep score, from exchange
 *     relationships, where a benefit calls for a prompt, comparable repayment.
 *     When people want a communal relationship, being repaid or asked for
 *     repayment sours it. A loan puts an exchange rule (pay me back, by then)
 *     inside a communal relationship, and every week it's unpaid both of you
 *     feel the score being kept.
 *   - It often doesn't come back. In Bankrate's 2019 US survey, 37% of people
 *     who had lent cash to friends or family lost money, and 21% said the
 *     relationship was harmed.
 *   - Co-signing isn't lending; it's promising to pay all of it. The FTC's
 *     cosigner notice says it plainly: you may have to pay up to the full
 *     amount of the debt if the borrower does not pay, plus late fees.
 *
 * So the tool starts from the one number that decides most of these calls:
 * how much you could hand over and never think about again. Up to that, give
 * it (or lend it as if you're giving it). Beyond it, a loan has to be one you
 * could wait for, written down with dates, or it's a no.
 *
 * The read, checked in order:
 *   1. "cosign"   — you've been asked to co-sign or guarantee. `cosignOk` says
 *                   whether you could pay all of it yourself without it hurting.
 *   2. "give"     — you could lose all of it without it hurting.
 *   3. "part"     — you could give some of it, but not all.
 *   4. "no"       — you'd need it back, or they didn't repay last time.
 *   5. "recurring"— the shortfall will come back next month; a loan only delays it.
 *   6. "terms"    — it would hurt to lose but you could wait for it: lend it, in
 *                   writing, with dates.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { parseMoney } from "./worth";
import { formatMoney } from "./monthly";

export { formatMoney };

export type Ask = "lend" | "cosign";
export type Lose = "" | "fine" | "hurt" | "need";
export type Record_ = "" | "first" | "repaid" | "late" | "never";
export type Why = "" | "emergency" | "gap" | "ongoing" | "venture" | "other";
export type Close = "" | "yes" | "strained" | "no";

export type LendInputs = {
  /** Who's asking, and what for. */
  what: string;
  /** How much they've asked for (or the loan you'd co-sign). */
  amount: string;
  ask: Ask;
  /** If it never came back: fine, it would hurt, or you need it back. */
  lose: Lose;
  /** The most you could hand over and never think about again. */
  spare: string;
  /** Their record with money they've borrowed before. */
  record: Record_;
  /** What it's for. */
  why: Why;
  /** If it never came back, would you two still be close? */
  close: Close;
  /** What they could realistically pay back a month. */
  per: string;
  /** The first repayment date, YYYY-MM-DD, or blank for the 1st of next month. */
  start: string;
};

export const BLANK_LEND: LendInputs = {
  what: "",
  amount: "",
  ask: "lend",
  lose: "",
  spare: "",
  record: "",
  why: "",
  close: "",
  per: "",
  start: "",
};

export type LendKind = "cosign" | "give" | "part" | "no" | "recurring" | "terms";

export type Repayment = { date: string; amount: number };

export type LendRead = {
  kind: LendKind;
  amount: number;
  /** The most you could give, or null if not given. */
  spare: number | null;
  /** What to offer on "part": the spare amount. */
  offer: number;
  /** On "cosign": true when you could pay all of it without it hurting. */
  cosignOk: boolean;
  /** On "no": true when the reason is that they didn't repay last time. */
  burned: boolean;
  /** The repayment plan, when a monthly amount was given and it's a loan. */
  plan: Repayment[];
};

/** Plans longer than this are cut off; the read says to lend less or shorten it. */
export const MAX_PAYMENTS = 120;
/** Past this many months, the read warns that it's a long time to owe a friend. */
export const LONG_MONTHS = 24;

/** "2026-11-01" from a date, in local time. */
export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** A YYYY-MM-DD string as [year, month (0-based), day], or null. */
function splitISO(s: string): [number, number, number] | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
  const check = new Date(y, mo, d);
  if (check.getMonth() !== mo) return null;
  return [y, mo, d];
}

/** The first repayment date: the one given, or the 1st of the month after `today`. */
export function firstDate(inp: LendInputs, today: Date): string {
  if (splitISO(inp.start)) return inp.start;
  return isoDay(new Date(today.getFullYear(), today.getMonth() + 1, 1));
}

/**
 * The same day in each following month, clamped to the month's end (31 Jan,
 * 28 Feb, 31 Mar), so a plan that starts on the 31st doesn't skip a month.
 */
function monthly(start: string, n: number): string[] {
  const parts = splitISO(start);
  if (!parts) return [];
  const [y, mo, d] = parts;
  return Array.from({ length: n }, (_, i) => {
    const last = new Date(y, mo + i + 1, 0).getDate();
    return isoDay(new Date(y, mo + i, Math.min(d, last)));
  });
}

/** The repayments: `per` a month until it's paid, the last one smaller. */
export function repaymentPlan(amount: number, per: number, start: string): Repayment[] {
  if (!(amount > 0) || !(per > 0)) return [];
  const cents = Math.round(amount * 100);
  const step = Math.round(per * 100);
  if (step <= 0) return [];
  const n = Math.min(MAX_PAYMENTS, Math.ceil(cents / step));
  const dates = monthly(start, n);
  return dates.map((date, i) => ({
    date,
    amount: (i < n - 1 ? step : cents - step * (n - 1)) / 100,
  }));
}

/** True when `per` would take longer than MAX_PAYMENTS months to repay. */
export function planCut(read: LendRead, inp: LendInputs): boolean {
  const per = parseMoney(inp.per);
  return Boolean(per && per > 0 && Math.ceil(read.amount / per) > MAX_PAYMENTS);
}

/** The currency the person typed, so answers come back in it. Defaults to £. */
export function lendCurrency(inp: LendInputs): string {
  for (const raw of [inp.amount, inp.spare, inp.per]) {
    const m = raw.match(/[£$€]/);
    if (m) return m[0];
  }
  return "£";
}

/** The read so far, or null while the amount or the "if it never came back" answer is missing. */
export function readLend(inp: LendInputs, today: Date = new Date()): LendRead | null {
  const amount = parseMoney(inp.amount);
  if (!amount || !inp.lose) return null;
  const spare = parseMoney(inp.spare);
  const per = parseMoney(inp.per);
  const fits = inp.lose === "fine" || (spare !== null && spare >= amount);
  const someSpare = spare !== null && spare > 0 && spare < amount;

  let kind: LendKind;
  if (inp.ask === "cosign") kind = "cosign";
  else if (fits) kind = "give";
  else if (someSpare) kind = "part";
  else if (inp.lose === "need" || inp.record === "never") kind = "no";
  else if (inp.why === "ongoing") kind = "recurring";
  else kind = "terms";

  const plan =
    kind === "terms" && per ? repaymentPlan(amount, per, firstDate(inp, today)) : [];

  return {
    kind,
    amount,
    spare,
    offer: someSpare ? (spare as number) : 0,
    cosignOk: kind === "cosign" && fits,
    burned: kind === "no" && inp.lose !== "need" && inp.record === "never",
    plan,
  };
}

/** The ask, for mid-sentence use, with a fallback that's never blank. */
export function lendName(inp: LendInputs): string {
  const s = inp.what.trim().replace(/[.!?\s]+$/, "");
  return s || "them";
}

/** The answer's headline: the words printed largest, and spoken. */
export function lendHeadline(inp: LendInputs, read: LendRead): string {
  const cur = lendCurrency(inp);
  const amt = formatMoney(read.amount, cur);
  switch (read.kind) {
    case "cosign":
      return read.cosignOk
        ? `Sign only if you'd pay all ${amt} yourself without a word.`
        : `Don't sign. You'd be promising to pay all ${amt}.`;
    case "give":
      return inp.record === "never"
        ? "Give it if you want to. Don't call it a loan."
        : "Give it, or lend it as if you're giving it.";
    case "part":
      return `Offer the ${formatMoney(read.offer, cur)} you could give, not the ${amt}.`;
    case "no":
      return read.burned
        ? "Don't lend again. Help another way."
        : "Say no to the loan. Help another way.";
    case "recurring":
      return "A loan won't close a gap that comes back every month.";
    case "terms":
      return "Lend it in writing, with dates.";
  }
}

/** "Sunday 1 November 2026". */
export function longDate(iso: string): string {
  const p = splitISO(iso);
  if (!p) return iso;
  return new Date(p[0], p[1], p[2]).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "November 2026". */
export function monthYear(iso: string): string {
  const p = splitISO(iso);
  if (!p) return iso;
  return new Date(p[0], p[1], 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** "1st", "2nd", "23rd", "31st". */
function ordinal(n: number): string {
  const t = n % 100;
  if (t >= 11 && t <= 13) return `${n}th`;
  const end = n % 10 === 1 ? "st" : n % 10 === 2 ? "nd" : n % 10 === 3 ? "rd" : "th";
  return `${n}${end}`;
}

/** The plan in one sentence: "£100 a month on the 1st, from November 2026 to June 2027 (8 payments)". */
export function planSentence(inp: LendInputs, plan: Repayment[]): string {
  if (plan.length === 0) return "";
  const cur = lendCurrency(inp);
  const first = plan[0];
  const last = plan[plan.length - 1];
  const d = Number(first.date.slice(8, 10));
  const day = d > 28 ? `${ordinal(d)} (or the month's last day)` : ordinal(d);
  if (plan.length === 1) {
    return `${formatMoney(first.amount, cur)} in one payment on ${longDate(first.date)}`;
  }
  const tail =
    Math.abs(last.amount - first.amount) > 0.005
      ? `, the last one ${formatMoney(last.amount, cur)}`
      : "";
  return `${formatMoney(first.amount, cur)} a month on the ${day}, from ${monthYear(first.date)} to ${monthYear(last.date)} (${plan.length} payments${tail})`;
}

/**
 * The words to send or say. Each kind has its own: the terms written down, a
 * gift said as a gift, a smaller offer, or a no that offers something else.
 */
export function lendMessage(inp: LendInputs, read: LendRead): string {
  const cur = lendCurrency(inp);
  const amt = formatMoney(read.amount, cur);
  switch (read.kind) {
    case "cosign":
      return read.cosignOk
        ? `I'll co-sign. I've read what it means: if a payment's missed, the lender can come to me for all of it. So if you ever think you might miss one, tell me first and we'll sort it out before it's late.`
        : `I can't co-sign. It would make me responsible for the whole ${amt}, and I can't take that on. I'd still like to help: can we look at the other options together?`;
    case "give":
      return `I'd like to help. Here's ${amt}. It's not a loan: I don't want it back, and I won't be keeping count. If you're ever in a position to do the same for someone, that's plenty.`;
    case "part":
      return `I can't lend you ${amt}. What I can do is give you ${formatMoney(read.offer, cur)}, and it's a gift, not a loan, so you don't need to pay it back.`;
    case "no":
      return `I can't lend you money right now. It would leave me short, and I don't want money sitting between us. I'd still like to help another way: can I help you go through the options?`;
    case "recurring":
      return `I don't think a loan would fix this, because the same gap would be back next month and you'd owe me on top. Can we sit down and look at the month together instead?`;
    case "terms": {
      const head = `Here's what we agreed, written down so neither of us has to remember it. I'm lending you ${amt}.`;
      const repay = read.plan.length
        ? ` You'll pay it back ${planSentence(inp, read.plan)}.`
        : " You'll pay it back on dates we agree now, and we'll write them here.";
      return `${head}${repay} If a payment's going to be late, tell me before the day and we'll move it. No awkwardness either way.`;
    }
  }
}

/** The standing rule: the reusable part of the answer. */
export function lendRule(): string {
  return "My line for lending to friends and family: I only lend what I could give. Up to that, I give it and don't keep count. Beyond it, I lend only what I could wait for, written down with dates, and I never co-sign for more than I could pay myself.";
}

/** The plain-text record, for notes or a message to yourself. */
export function lendSummary(inp: LendInputs, read: LendRead): string {
  const lines: string[] = [];
  if (inp.what.trim()) lines.push(inp.what.trim());
  lines.push(lendHeadline(inp, read));
  lines.push("");
  lines.push(lendMessage(inp, read));
  if (read.plan.length > 1) {
    const cur = lendCurrency(inp);
    lines.push("");
    for (const p of read.plan) lines.push(`${longDate(p.date)}: ${formatMoney(p.amount, cur)}`);
  }
  lines.push("");
  lines.push(lendRule());
  return lines.join("\n");
}

const ASKS: Ask[] = ["lend", "cosign"];
const LOSES: Lose[] = ["fine", "hurt", "need"];
const RECORDS: Record_[] = ["first", "repaid", "late", "never"];
const WHYS: Why[] = ["emergency", "gap", "ongoing", "venture", "other"];
const CLOSES: Close[] = ["yes", "strained", "no"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseLendInputs(raw: unknown): LendInputs {
  if (!raw || typeof raw !== "object") return BLANK_LEND;
  const v = raw as Record<string, unknown>;
  const str = (k: keyof LendInputs) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const start = str("start");
  return {
    what: str("what"),
    amount: str("amount"),
    ask: oneOf(v.ask, ASKS) || "lend",
    lose: oneOf(v.lose, LOSES),
    spare: str("spare"),
    record: oneOf(v.record, RECORDS),
    why: oneOf(v.why, WHYS),
    close: oneOf(v.close, CLOSES),
    per: str("per"),
    start: splitISO(start) ? start : "",
  };
}

/**
 * The worked example: a brother needs £800 for a car repair to keep getting to
 * work. Losing it would hurt; the most the lender could give outright is £300.
 * So the read is to offer the £300 as a gift, not lend the £800.
 */
export const LEND_EXAMPLE: LendInputs = {
  what: "My brother, for the car repair",
  amount: "£800",
  ask: "lend",
  lose: "hurt",
  spare: "£300",
  record: "late",
  why: "emergency",
  close: "strained",
  per: "",
  start: "",
};
