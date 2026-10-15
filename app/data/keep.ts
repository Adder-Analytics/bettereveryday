/**
 * The read behind "Still Worth Paying For?" (/keep).
 *
 * The gym, the streaming services, the app that renewed in March, the news
 * site, the box that arrives every fortnight. Each one was a good call the day
 * it started. Since then it has renewed itself, quietly, and nobody has asked
 * the question again. Three well-measured pulls keep it going:
 *
 *   - We expect to use it more than we do. Stefano DellaVigna and Ulrike
 *     Malmendier (AER, 2006) followed 7,752 members of three US gyms: those
 *     on a monthly contract of over $70 went 4.3 times a month on average,
 *     paying more than $17 a visit when a 10-visit pass would have cost $10 a
 *     visit. Their leading explanation is overconfidence about future
 *     self-control, and monthly members were also slower to leave.
 *   - Flat rates feel safer than they are. Anja Lambrecht and Bernd Skiera
 *     (JMR, 2006) found people often choose a flat rate when paying per use
 *     would cost less, and that the bias persists. Two of the causes they
 *     name are an "insurance effect" (no surprise bills) and a "taxi meter
 *     effect" (paying per use makes each use feel like it costs something).
 *   - Whatever is already happening has the default's advantage. William
 *     Samuelson and Richard Zeckhauser (J. Risk and Uncertainty, 1988) named it
 *     status quo bias: options framed as the current state get chosen far more
 *     often than the same options framed as a change. A renewal is the status
 *     quo paying itself.
 *
 * The questions, per subscription:
 *   1. What is it costing a use? Last month's uses, counted, not planned.
 *   2. Is paying per use cheaper? If a pay-as-you-go price exists, the sum
 *      settles it.
 *   3. The fresh-start test: if you didn't have it, would you sign up today at
 *      this price? This turns a "should I cancel?" (which feels like a loss)
 *      into a "should I buy?" (which doesn't).
 *   4. If you're not sure: what would rejoining cost? Most subscriptions can
 *      be restarted in a minute at the same price, so cancelling is a cheap
 *      experiment, and the honest default for "not sure" is to cancel and see
 *      if you miss it. When cancelling would lose something (a price you can't
 *      get back, your history, a place), keep it for now and name the date to
 *      ask again.
 *
 * The read for one subscription, checked in order:
 *   "payg"    — paying per use would cost less than the subscription.
 *   "cancel"  — you wouldn't sign up today.
 *   "keep"    — you would.
 *   "test"    — not sure, and rejoining is easy: cancel and see.
 *   "hold"    — not sure, and you'd lose something by leaving.
 *   "open"    — not answered yet.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";

export type Period = "month" | "year" | "week";
export type SignUp = "" | "yes" | "unsure" | "no";
export type Rejoin = "" | "easy" | "lose";

export type KeepRow = {
  /** Stable id for React keys and focus; never shown. */
  id: string;
  name: string;
  price: string;
  period: Period;
  /** Times used in the last month, counted. */
  uses: string;
  /** What one use would cost without the subscription. */
  payg: string;
  signup: SignUp;
  rejoin: Rejoin;
};

export type KeepInputs = { rows: KeepRow[] };

export const MAX_ROWS = 15;

export function blankRow(id: string, name = ""): KeepRow {
  return { id, name, price: "", period: "month", uses: "", payg: "", signup: "", rejoin: "" };
}

export const BLANK_KEEP: KeepInputs = { rows: [blankRow("r1")] };

/** A fresh id that doesn't clash with any row already in the list. */
export function nextRowId(rows: KeepRow[]): string {
  let n = rows.length + 1;
  const taken = new Set(rows.map((r) => r.id));
  while (taken.has(`r${n}`)) n++;
  return `r${n}`;
}

export type KeepKind = "payg" | "cancel" | "keep" | "test" | "hold" | "open";

export type RowRead = {
  kind: KeepKind;
  /** What it costs per month, whatever period it's billed in. */
  monthly: number;
  yearly: number;
  /** Uses in the last month, or null if not given. */
  uses: number | null;
  /** Cost per use, or null when uses weren't given; Infinity at zero uses. */
  perUse: number | null;
  /** What last month's uses would have cost paying per use, or null. */
  paygMonthly: number | null;
  /** What leaving would save a year, net of paying per use. */
  saving: number;
};

/** How many times it was used: a whole or decimal number, zero allowed. */
export function parseUses(raw: string): number | null {
  const s = raw.trim().replace(/\s*(times?|x|uses?|visits?)$/i, "");
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function usesInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseUses(raw) === null;
}

const PER_MONTH: Record<Period, number> = { month: 1, year: 1 / 12, week: 52 / 12 };

/** The read for one subscription, or null while it has no price. */
export function readRow(row: KeepRow): RowRead | null {
  const price = parseMoney(row.price);
  if (price === null || price <= 0) return null;
  const monthly = price * PER_MONTH[row.period];
  const yearly = monthly * 12;
  const uses = parseUses(row.uses);
  const perUse = uses === null ? null : uses > 0 ? monthly / uses : Infinity;
  const payg = parseMoney(row.payg);
  const paygMonthly = uses !== null && payg !== null ? payg * uses : null;
  const base = { monthly, yearly, uses, perUse, paygMonthly };

  if (paygMonthly !== null && paygMonthly < monthly) {
    return { kind: "payg", ...base, saving: (monthly - paygMonthly) * 12 };
  }
  switch (row.signup) {
    case "no":
      return { kind: "cancel", ...base, saving: yearly };
    case "yes":
      return { kind: "keep", ...base, saving: 0 };
    case "unsure":
      return row.rejoin === "lose"
        ? { kind: "hold", ...base, saving: 0 }
        : { kind: "test", ...base, saving: yearly };
    default:
      return { kind: "open", ...base, saving: 0 };
  }
}

/** The currency the person typed, so answers come back in it. Defaults to £. */
export function keepCurrency(inp: KeepInputs): string {
  for (const r of inp.rows) {
    for (const raw of [r.price, r.payg]) {
      const m = raw.match(/[£$€]/);
      if (m) return m[0];
    }
  }
  return "£";
}

/** The subscription's name for mid-sentence use, never blank. */
export function rowName(row: KeepRow): string {
  const s = row.name.trim().replace(/[.!?\s]+$/, "");
  return s || "this one";
}

const PERIOD_WORD: Record<Period, string> = { month: "a month", year: "a year", week: "a week" };

/** "£10.99 a month", in the period it's billed in. */
export function billed(row: KeepRow, cur: string): string {
  const p = parseMoney(row.price);
  return p === null ? "" : `${formatMoney(p, cur)} ${PERIOD_WORD[row.period]}`;
}

/** The fresh-start question, with the price in it. */
export function signUpQuestion(row: KeepRow, cur: string): string {
  const b = billed(row, cur);
  return b
    ? `If you didn't have it, would you sign up today at ${b}?`
    : "If you didn't have it, would you sign up today?";
}

/** The answer for one subscription in a few words: printed bold and spoken. */
export function rowHeadline(row: KeepRow, read: RowRead, cur: string): string {
  switch (read.kind) {
    case "payg":
      return `Cancel it and pay as you go. That saves about ${formatMoney(read.saving, cur)} a year.`;
    case "cancel":
      return row.period === "year" ? "Cancel it: turn off the renewal now." : "Cancel it.";
    case "keep":
      return "Keep it.";
    case "test":
      return row.period === "year"
        ? "Turn off the renewal and see if you miss it."
        : "Cancel it and see if you miss it.";
    case "hold":
      return "Keep it for now, and set a date to ask again.";
    case "open":
      return "Answer the sign-up question.";
  }
}

/** "£17.50 a use", "nothing yet this month", or null when uses weren't given. */
export function perUseText(read: RowRead, cur: string): string | null {
  if (read.perUse === null) return null;
  if (!Number.isFinite(read.perUse)) return "not used last month";
  return `${formatMoney(read.perUse, cur)} a use`;
}

/** The one sentence under the headline that says why. */
export function rowWhy(row: KeepRow, read: RowRead, cur: string): string {
  const per = perUseText(read, cur);
  const usedNone = read.uses === 0;
  switch (read.kind) {
    case "payg": {
      const u = read.uses ?? 0;
      return `Last month you used it ${u === 1 ? "once" : `${u} times`}. Paying for each use would have cost ${formatMoney(read.paygMonthly ?? 0, cur)} against ${formatMoney(read.monthly, cur)} for the subscription. Count again in a month: if you'd really use it more, rerun the sum with the new count, not the hopeful one.`;
    }
    case "cancel":
      return row.period === "year"
        ? "You wouldn't buy it today, so don't let it buy itself again. You keep it until the renewal date; what's paid is spent either way."
        : `You wouldn't buy it today, so it's only still here because leaving takes a minute. That minute saves ${formatMoney(read.yearly, cur)} a year.`;
    case "keep":
      return usedNone
        ? `You'd sign up again, though you didn't use it last month. If that was unusual, fine; if it happens twice in a row, ask again.`
        : per
          ? `You'd sign up again today, at ${per}. That's a subscription doing its job.`
          : "You'd sign up again today. That's a subscription doing its job.";
    case "test":
      return row.period === "year"
        ? "Turning off the renewal costs nothing: you keep it until the date. If you miss it before then, turn it back on."
        : row.rejoin === ""
          ? "If you can rejoin in a minute at the same price, cancelling is a cheap experiment, not a loss: cancel, and rejoin if you miss it within a month. If you'd lose something by leaving, say so above."
          : "You can rejoin in a minute at the same price, so cancelling is a cheap experiment, not a loss. If you miss it within a month, rejoin and stop wondering. If you don't notice it's gone, you have your answer.";
    case "hold":
      return `Leaving would cost you something you can't simply buy back. That's a real reason, and it's also a price: ${formatMoney(read.yearly, cur)} a year to keep it open. Put a date in your diary to ask again, so the renewal doesn't answer for you.`;
    case "open":
      return per
        ? `It costs ${formatMoney(read.monthly, cur)} a month, ${per}.`
        : `It costs ${formatMoney(read.monthly, cur)} a month, ${formatMoney(read.yearly, cur)} a year.`;
  }
}

export type KeepTotals = {
  /** Rows with a price. */
  priced: number;
  /** What all priced rows cost a year. */
  yearly: number;
  /** What the cancel, test and pay-as-you-go rows would free a year. */
  freed: number;
  /** Rows whose read says leave or test. */
  leaving: number;
  /** Rows not yet answered. */
  open: number;
};

export function totals(inp: KeepInputs): KeepTotals {
  let priced = 0, yearly = 0, freed = 0, leaving = 0, open = 0;
  for (const r of inp.rows) {
    const read = readRow(r);
    if (!read) continue;
    priced++;
    yearly += read.yearly;
    freed += read.saving;
    if (read.kind === "payg" || read.kind === "cancel" || read.kind === "test") leaving++;
    if (read.kind === "open") open++;
  }
  return { priced, yearly, freed, leaving, open };
}

/** The headline over the whole list: printed largest, and spoken. */
export function keepHeadline(inp: KeepInputs): string | null {
  const t = totals(inp);
  if (t.priced === 0) return null;
  const cur = keepCurrency(inp);
  const spend = `${formatMoney(t.yearly, cur)} a year`;
  if (t.open === t.priced) {
    return t.priced === 1
      ? `That's ${spend}. Now the sign-up question.`
      : `${t.priced} subscriptions, ${spend}. Now the sign-up questions.`;
  }
  if (t.leaving === 0) {
    return t.open > 0
      ? `Nothing to cancel yet, with ${t.open} still to answer.`
      : t.priced === 1
        ? "Keep it. You'd sign up again today."
        : `Keep all ${t.priced}. You'd sign up for each again today.`;
  }
  const what = t.priced === 1 ? "it" : t.leaving === 1 ? "one of them" : `${t.leaving} of them`;
  return `Cancelling ${what} would free ${formatMoney(t.freed, cur)} a year.`;
}

/** The standing rule: the reusable part of the answer. */
export function keepRule(): string {
  return "My line for subscriptions: once a year, I ask of each one whether I'd sign up today at this price, counting last month's uses, not the ones I plan. If I'm not sure and I can rejoin easily, I cancel and see if I miss it.";
}

/** The plain-text list, for notes or a message to yourself. */
export function keepSummary(inp: KeepInputs): string {
  const cur = keepCurrency(inp);
  const lines: string[] = [];
  const head = keepHeadline(inp);
  if (head) lines.push(head, "");
  for (const r of inp.rows) {
    const read = readRow(r);
    if (!read) continue;
    const per = perUseText(read, cur);
    lines.push(`${rowName(r)} (${billed(r, cur)}${per ? `, ${per}` : ""}): ${rowHeadline(r, read, cur)}`);
  }
  lines.push("", keepRule());
  return lines.join("\n");
}

/** A short subject for the decision list: the first few names. */
export function keepSubject(inp: KeepInputs): string | null {
  const names = inp.rows.map((r) => r.name.trim()).filter(Boolean);
  if (names.length === 0) return null;
  const shown = names.slice(0, 3).join(", ");
  return names.length > 3 ? `Subscriptions: ${shown} and ${names.length - 3} more` : `Subscriptions: ${shown}`;
}

const PERIODS: Period[] = ["month", "year", "week"];
const SIGNUPS: SignUp[] = ["yes", "unsure", "no"];
const REJOINS: Rejoin[] = ["easy", "lose"];

function oneOf<T extends string>(v: unknown, list: T[], fallback: T | ""): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : fallback;
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseKeepInputs(raw: unknown): KeepInputs {
  if (!raw || typeof raw !== "object") return BLANK_KEEP;
  const list = (raw as Record<string, unknown>).rows;
  if (!Array.isArray(list)) return BLANK_KEEP;
  const rows: KeepRow[] = [];
  const seen = new Set<string>();
  for (const item of list.slice(0, MAX_ROWS)) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    const str = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
    let id = str("id");
    if (!id || seen.has(id)) id = nextRowId(rows);
    seen.add(id);
    rows.push({
      id,
      name: str("name"),
      price: str("price"),
      period: (oneOf(v.period, PERIODS, "month") || "month") as Period,
      uses: str("uses"),
      payg: str("payg"),
      signup: oneOf(v.signup, SIGNUPS, ""),
      rejoin: oneOf(v.rejoin, REJOINS, ""),
    });
  }
  return rows.length ? { rows } : BLANK_KEEP;
}

/**
 * The worked example: four subscriptions found on two months of statements.
 * The gym is the DellaVigna and Malmendier case in miniature; the streaming
 * service is the "not sure" that a cancel settles; the news site renews yearly
 * and wouldn't be bought today; the cloud storage is doing its job.
 */
export const KEEP_EXAMPLE: KeepInputs = {
  rows: [
    { id: "e1", name: "Gym", price: "£45", period: "month", uses: "3", payg: "£8", signup: "unsure", rejoin: "easy" },
    { id: "e2", name: "Second streaming service", price: "£10.99", period: "month", uses: "2", payg: "", signup: "unsure", rejoin: "easy" },
    { id: "e3", name: "News site", price: "£99", period: "year", uses: "", payg: "", signup: "no", rejoin: "" },
    { id: "e4", name: "Photo storage", price: "£2.49", period: "month", uses: "", payg: "", signup: "yes", rejoin: "" },
  ],
};
