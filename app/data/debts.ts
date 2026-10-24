/**
 * The read behind "Which Debt First?" (/debts).
 *
 * Two cards, an overdraft and a car loan. Every month there's some money to
 * put towards them, and the question is where the money beyond the minimums
 * goes. The arithmetic has one answer: after every minimum, everything else
 * goes to the debt with the highest rate (the "avalanche"). The popular advice
 * has another: clear the smallest balance first, for the win (the
 * "snowball"). What people actually do is a third thing, and it's the worst:
 *
 *   - They spread it. John Gathergood, Neale Mahoney, Neil Stewart and Jörg
 *     Weber (American Economic Review 109(3), 2019) followed 1.4 million UK
 *     cardholders. Paying the minimums and sending the rest to the costlier
 *     card would put about 97% of the extra there; people with two cards put
 *     about 51% there. Payments tracked each card's share of the balance (the
 *     "balance-matching heuristic"), whatever the rates, and how badly they
 *     allocated didn't change when more money was at stake.
 *   - Left alone, they pay the smallest first even when it costs. Moty Amar,
 *     Dan Ariely, Shahar Ayal, Cynthia Cryder and Scott Rick (Journal of
 *     Marketing Research 48, 2011) called it "debt account aversion": in four
 *     experiments people cleared small debts first though the large ones
 *     charged more. Showing the interest each debt was running up helped.
 *   - But the win is real. Eric Gal and Blakeley McShane (JMR 49, 2012), with
 *     about 6,000 people in a debt settlement programme, found that closing
 *     accounts predicted getting out of debt altogether, whatever the
 *     balances closed (observational, so suggestive). Jacqueline Kettle, Remi
 *     Trudel, Simon Blanchard and Gerald Häubl (Journal of Consumer Research
 *     43(3), 2016) found that putting the extra on one account rather than
 *     spreading it made people pay more, most of all when it was the
 *     smallest: people judge progress by the biggest share knocked off any
 *     one debt.
 *   - The minimum is an anchor. Neil Stewart (Psychological Science, 2009):
 *     with the minimum printed, people chose to repay less; the FCA repeated
 *     the experiment (Occasional Paper 42) and found the same pull down.
 *
 * So the tool runs all three orders on your own debts, month by month, and
 * shows what the difference really costs. When the snowball costs next to
 * nothing it says take the win; when it costs real money it says go by rate;
 * and if you've tried before and stalled, it offers one quick win and then the
 * rate. Whichever order, it shows that concentrating beats spreading, and what
 * a little more each month would do, which is usually worth more than the
 * order.
 *
 * The model: each month, every balance accrues a twelfth of its yearly rate;
 * then every debt gets at least today's minimum (or what's left of it), and
 * everything else goes to the target. When a debt is cleared, its minimum
 * joins the money going to the next one, because the budget stays the same.
 * Real minimums shrink as balances fall; keeping today's is both simpler and
 * the better habit. It's arithmetic for comparing orders, not a statement.
 *
 * Kinds, checked in order:
 *   1. "short"  — the money doesn't cover the minimums.
 *   2. "never"  — it covers them, but not the interest: the debt never clears.
 *   3. "one"    — there's only one debt; nothing to order.
 *   4. "same"   — the smallest debt is also the costliest: no trade-off.
 *   5. "close"  — the snowball costs next to nothing more. Take the win.
 *   6. "hybrid" — you've stalled before: one quick win, then by rate.
 *   7. "rate"   — go by rate; the snowball costs real money.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { parseMoney } from "./worth";
import { formatMoney, parseRate } from "./monthly";

export { formatMoney };

/** Interest and gaps, to the whole unit: pennies there are noise. */
export function roundMoney(n: number, cur: string): string {
  return formatMoney(Math.round(n), cur);
}

export type Debt = {
  id: string;
  name: string;
  balance: string;
  /** Yearly rate, as typed: "24.9", "24.9%". */
  rate: string;
  /** Today's minimum payment. */
  minimum: string;
};

export type Stalled = "" | "no" | "yes";

export type DebtsInputs = {
  /** The subject line, carried in from other tools. */
  what: string;
  debts: Debt[];
  /** What you can put towards all of them each month, minimums included. */
  budget: string;
  /** Have you tried to pay them down before and run out of steam? */
  stalled: Stalled;
};

export const MAX_DEBTS = 8;

export function blankDebt(id: string): Debt {
  return { id, name: "", balance: "", rate: "", minimum: "" };
}

export const BLANK_DEBTS: DebtsInputs = {
  what: "",
  debts: [blankDebt("d1"), blankDebt("d2")],
  budget: "",
  stalled: "",
};

export function nextId(prefix: string, taken: { id: string }[]): string {
  const ids = new Set(taken.map((t) => t.id));
  let n = taken.length + 1;
  while (ids.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

/** The currency the person typed, so answers come back in it. Defaults to £. */
export function debtsCurrency(inp: DebtsInputs): string {
  for (const raw of [inp.budget, ...inp.debts.flatMap((d) => [d.balance, d.minimum])]) {
    const m = raw.match(/[£$€]/);
    if (m) return m[0];
  }
  return "£";
}

/** A debt's name for display, never blank. */
export function debtName(d: { name: string }, index: number): string {
  const s = d.name.trim();
  return s || `Debt ${index + 1}`;
}

/** A debt the sums can use: a balance above zero and a readable rate. */
export type ReadyDebt = {
  id: string;
  name: string;
  balance: number;
  rate: number;
  minimum: number;
  /** True when the minimum was left blank and estimated. */
  guessed: boolean;
};

/**
 * A minimum left blank: 3% of the balance, at least 25, never more than the
 * balance. Roughly what UK and US cards ask; the read says it's a guess.
 */
export function guessMinimum(balance: number): number {
  return Math.min(balance, Math.max(25, Math.round(balance * 0.03)));
}

/** The debts with a balance and a rate, in the order typed. */
export function readyDebts(inp: DebtsInputs): ReadyDebt[] {
  const out: ReadyDebt[] = [];
  inp.debts.forEach((d, i) => {
    const balance = parseMoney(d.balance);
    const rate = parseRate(d.rate);
    if (!balance || balance <= 0 || rate === null) return;
    const typed = parseMoney(d.minimum);
    const guessed = typed === null;
    const minimum = Math.min(balance, guessed ? guessMinimum(balance) : typed);
    out.push({ id: d.id, name: debtName(d, i), balance, rate, minimum, guessed });
  });
  return out;
}

export type Order = "rate" | "small" | "hybrid" | "spread";

/** The order the extra money goes in. Ties fall to the other measure. */
export function targetOrder(debts: ReadyDebt[], order: Exclude<Order, "spread">): string[] {
  const byRate = [...debts].sort((a, b) => b.rate - a.rate || a.balance - b.balance);
  const bySize = [...debts].sort((a, b) => a.balance - b.balance || b.rate - a.rate);
  if (order === "rate") return byRate.map((d) => d.id);
  if (order === "small") return bySize.map((d) => d.id);
  const first = bySize[0];
  return [first.id, ...byRate.filter((d) => d.id !== first.id).map((d) => d.id)];
}

export type Plan = {
  order: Order;
  /** The targets in order (empty for "spread"). */
  sequence: string[];
  /** Months to clear everything, or null if it never clears within the horizon. */
  months: number | null;
  /** Total interest paid until clear (or over the horizon, if it never clears). */
  interest: number;
  /** The month each debt reaches zero, by id; missing when it never does. */
  clearedAt: Record<string, number>;
  /** The month the first debt is cleared, or null. */
  firstWin: number | null;
};

/** Fifty years. A plan that hasn't cleared by then isn't going to. */
const HORIZON = 600;
const EPS = 0.005;

/**
 * Run one plan month by month. `roll` is false for "minimums only", where a
 * cleared debt's minimum stops being paid rather than moving on.
 */
export function simulate(
  debts: ReadyDebt[],
  budget: number,
  order: Order,
  roll = true
): Plan {
  const sequence = order === "spread" ? [] : targetOrder(debts, order);
  const bal: Record<string, number> = {};
  for (const d of debts) bal[d.id] = d.balance;
  const clearedAt: Record<string, number> = {};
  let interest = 0;
  let month = 0;
  const open = () => debts.some((d) => bal[d.id] > EPS);

  while (open() && month < HORIZON) {
    month++;
    for (const d of debts) {
      if (bal[d.id] <= EPS) continue;
      const i = (bal[d.id] * d.rate) / 12;
      bal[d.id] += i;
      interest += i;
    }
    let pool = roll ? budget : debts.reduce((s, d) => s + (bal[d.id] > EPS ? d.minimum : 0), 0);
    for (const d of debts) {
      if (bal[d.id] <= EPS) continue;
      const pay = Math.min(d.minimum, bal[d.id], pool);
      bal[d.id] -= pay;
      pool -= pay;
    }
    if (roll && pool > EPS) {
      if (order === "spread") {
        // The balance-matching heuristic: the extra in proportion to balance,
        // repeated while a share clears a debt and leaves money over.
        for (let guard = 0; guard < debts.length && pool > EPS; guard++) {
          const live = debts.filter((d) => bal[d.id] > EPS);
          const total = live.reduce((s, d) => s + bal[d.id], 0);
          if (total <= EPS) break;
          let left = pool;
          for (const d of live) {
            const pay = Math.min(bal[d.id], (pool * bal[d.id]) / total);
            bal[d.id] -= pay;
            left -= pay;
          }
          pool = left;
        }
      } else {
        for (const id of sequence) {
          if (pool <= EPS) break;
          const pay = Math.min(bal[id], pool);
          bal[id] -= pay;
          pool -= pay;
        }
      }
    }
    for (const d of debts) {
      if (bal[d.id] <= EPS && clearedAt[d.id] === undefined) {
        bal[d.id] = 0;
        clearedAt[d.id] = month;
      }
    }
  }

  const done = !open();
  const wins = Object.values(clearedAt);
  return {
    order,
    sequence,
    months: done ? month : null,
    interest,
    clearedAt,
    firstWin: wins.length ? Math.min(...wins) : null,
  };
}

export type DebtsKind = "short" | "never" | "one" | "same" | "close" | "hybrid" | "rate";

export type DebtsRead = {
  kind: DebtsKind;
  debts: ReadyDebt[];
  budget: number;
  /** The minimums added up. */
  minimums: number;
  total: number;
  /** The plan the read recommends. */
  plan: Plan;
  rate: Plan;
  small: Plan;
  hybrid: Plan;
  spread: Plan;
  /** Paying only the minimums, with no rolling over. */
  minOnly: Plan;
  /** What the snowball costs over the avalanche. */
  gap: number;
  /** What spreading costs over the avalanche. */
  spreadGap: number;
  /** A little more each month, and what it does to the recommended plan. */
  more: { step: number; plan: Plan } | null;
  /** True when any minimum was estimated. */
  guessed: boolean;
};

/** Under this, the snowball's extra cost reads as "next to nothing". */
export function closeEnough(total: number): number {
  return Math.max(20, total * 0.01);
}

/** A hybrid's first win has to come soon to be worth the detour. */
const QUICK_WIN = 6;

/** A round step up: about a tenth of the budget, to the nearest 10, at least 10. */
export function stepUp(budget: number): number {
  return Math.max(10, Math.round(budget / 100) * 10);
}

/** The read so far, or null while there's nothing to read. */
export function readDebts(inp: DebtsInputs): DebtsRead | null {
  const debts = readyDebts(inp);
  const budget = parseMoney(inp.budget);
  if (!debts.length || !budget) return null;
  const minimums = debts.reduce((s, d) => s + d.minimum, 0);
  const total = debts.reduce((s, d) => s + d.balance, 0);
  const guessed = debts.some((d) => d.guessed);

  const rate = simulate(debts, budget, "rate");
  const small = simulate(debts, budget, "small");
  const hybrid = simulate(debts, budget, "hybrid");
  const spread = simulate(debts, budget, "spread");
  const minOnly = simulate(debts, minimums, "rate", false);
  const gap = Math.max(0, small.interest - rate.interest);
  const spreadGap = Math.max(0, spread.interest - rate.interest);

  const sameOrder = rate.sequence.join() === small.sequence.join();
  const hybridWin = hybrid.firstWin ?? Infinity;

  let kind: DebtsKind;
  let plan = rate;
  if (budget + EPS < minimums) kind = "short";
  else if (rate.months === null) kind = "never";
  else if (debts.length === 1) kind = "one";
  else if (sameOrder) kind = "same";
  else if (gap <= closeEnough(total)) {
    kind = "close";
    plan = small;
  } else if (inp.stalled === "yes" && hybridWin <= QUICK_WIN && hybrid.sequence[0] !== rate.sequence[0]) {
    kind = "hybrid";
    plan = hybrid;
  } else kind = "rate";

  let more: DebtsRead["more"] = null;
  if (kind !== "short") {
    const step = stepUp(budget);
    const p = simulate(debts, budget + step, plan.order);
    if (p.months !== null) more = { step, plan: p };
  }

  return {
    kind,
    debts,
    budget,
    minimums,
    total,
    plan,
    rate,
    small,
    hybrid,
    spread,
    minOnly,
    gap,
    spreadGap,
    more,
    guessed,
  };
}

/** "7 months", "a year", "2 years and 3 months", "over 50 years". */
export function duration(months: number | null): string {
  if (months === null) return "over 50 years";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  const ys = y === 1 ? "a year" : `${y} years`;
  return m === 0 ? ys : `${y === 1 ? "1 year" : ys} and ${m} month${m === 1 ? "" : "s"}`;
}

/** The calendar month `n` months from `now`: "March 2027". */
export function monthLabel(n: number, now: Date): string {
  const d = new Date(now.getFullYear(), now.getMonth() + n, 1);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function byId(read: DebtsRead, id: string): ReadyDebt {
  return read.debts.find((d) => d.id === id) ?? read.debts[0];
}

/** The debt the extra goes to first under the recommended plan. */
export function firstTarget(read: DebtsRead): ReadyDebt {
  return byId(read, read.plan.sequence[0] ?? read.debts[0].id);
}

/** The answer's headline: the words printed largest, and spoken. */
export function debtsHeadline(inp: DebtsInputs, read: DebtsRead): string {
  const cur = debtsCurrency(inp);
  const first = firstTarget(read).name;
  switch (read.kind) {
    case "short":
      return `The minimums come to ${formatMoney(read.minimums, cur)}. Get help before you choose an order.`;
    case "never":
      return "At this amount the interest keeps up with you. Something has to change first.";
    case "one":
      return `Everything you can spare goes on ${first}. Clear in ${duration(read.plan.months)}.`;
    case "same":
      return `Pay off ${first} first. It's the smallest and the costliest.`;
    case "close":
      return read.gap < 1
        ? `Pay off ${first} first. The quick win costs nothing extra.`
        : `Pay off ${first} first. The quick win costs only about ${roundMoney(read.gap, cur)}.`;
    case "hybrid":
      return `Clear ${first} first for a quick win, then go by rate.`;
    case "rate":
      return `Pay off ${first} first: it charges the most.`;
  }
}

/** This month, in one instruction. */
export function thisMonth(inp: DebtsInputs, read: DebtsRead): string {
  const cur = debtsCurrency(inp);
  if (read.kind === "short" || read.kind === "never") return "";
  const target = firstTarget(read);
  const others = read.debts.filter((d) => d.id !== target.id);
  const extra = read.budget - others.reduce((s, d) => s + d.minimum, 0);
  const onTarget = formatMoney(Math.min(target.balance, Math.max(target.minimum, extra)), cur);
  if (!others.length) return `This month: pay ${onTarget} on ${target.name}.`;
  const mins = others.map((d) => `${d.name} (${formatMoney(d.minimum, cur)})`);
  const list = mins.length === 1 ? mins[0] : `${mins.slice(0, -1).join(", ")} and ${mins[mins.length - 1]}`;
  return `This month: pay the minimum on ${list}, and put ${onTarget} on ${target.name}.`;
}

/** The plan's sequence, with the month each one goes. */
export function sequenceLines(inp: DebtsInputs, read: DebtsRead, now: Date): string[] {
  const p = read.plan;
  const ids = p.sequence.length ? p.sequence : read.debts.map((d) => d.id);
  return ids
    .map((id) => ({ d: byId(read, id), at: p.clearedAt[id] }))
    .sort((a, b) => (a.at ?? Infinity) - (b.at ?? Infinity))
    .map(({ d, at }) =>
      at === undefined
        ? `${d.name}: not cleared within 50 years`
        : `${d.name}: gone by ${monthLabel(at, now)} (${duration(at)})`
    );
}

/** The comparison in one sentence, for the copy-out. */
export function compareSentence(inp: DebtsInputs, read: DebtsRead): string {
  const cur = debtsCurrency(inp);
  if (read.kind === "short" || read.kind === "never" || read.kind === "one") return "";
  const r = `Costliest first: clear in ${duration(read.rate.months)}, ${roundMoney(read.rate.interest, cur)} in interest.`;
  const s = `Smallest first: ${duration(read.small.months)}, ${roundMoney(read.small.interest, cur)}.`;
  const sp = `Spread across them all: ${duration(read.spread.months)}, ${roundMoney(read.spread.interest, cur)}.`;
  return read.kind === "same" ? `${r} ${sp}` : `${r} ${s} ${sp}`;
}

/** The standing rule: the reusable part of the answer. */
export function debtsRule(read: DebtsRead): string {
  if (read.kind === "close" || read.kind === "hybrid") {
    return "My line for debts: I pay every minimum, then put everything else on one debt at a time, never spread. I take a quick win when it's cheap, then go by rate. When one's cleared, its payment moves to the next, and I don't borrow again on the cleared one.";
  }
  return "My line for debts: I pay every minimum, then put everything else on the debt with the highest rate, never spread. When one's cleared, its payment moves to the next, and I don't borrow again on the cleared one.";
}

/** The plain-text record, for notes or a message to yourself. */
export function debtsSummary(inp: DebtsInputs, read: DebtsRead, now: Date): string {
  const lines: string[] = [];
  if (inp.what.trim()) lines.push(inp.what.trim());
  lines.push(debtsHeadline(inp, read));
  const tm = thisMonth(inp, read);
  if (tm) {
    lines.push("");
    lines.push(tm);
    lines.push("");
    for (const l of sequenceLines(inp, read, now)) lines.push(`- ${l}`);
  }
  const c = compareSentence(inp, read);
  if (c) {
    lines.push("");
    lines.push(c);
  }
  lines.push("");
  lines.push(debtsRule(read));
  return lines.join("\n");
}

const STALLEDS: Stalled[] = ["no", "yes"];

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseDebtsInputs(raw: unknown): DebtsInputs {
  if (!raw || typeof raw !== "object") return BLANK_DEBTS;
  const v = raw as Record<string, unknown>;
  const s = (x: unknown) => (typeof x === "string" ? x : "");
  const debts: Debt[] = [];
  if (Array.isArray(v.debts)) {
    for (const item of v.debts.slice(0, MAX_DEBTS)) {
      if (!item || typeof item !== "object") continue;
      const d = item as Record<string, unknown>;
      let id = s(d.id);
      if (!id || debts.some((x) => x.id === id)) id = nextId("d", debts);
      debts.push({ id, name: s(d.name), balance: s(d.balance), rate: s(d.rate), minimum: s(d.minimum) });
    }
  }
  return {
    what: s(v.what),
    debts: debts.length ? debts : BLANK_DEBTS.debts,
    budget: s(v.budget),
    stalled: typeof v.stalled === "string" && (STALLEDS as string[]).includes(v.stalled) ? (v.stalled as Stalled) : "",
  };
}

/**
 * The worked example: an old card, a store card and two credit cards, £7,550
 * in all, with £400 a month to put towards them. The smallest (the old card)
 * is the cheapest, so smallest-first and costliest-first disagree. Going by
 * rate saves about £95 over two years; paying only the minimums would take
 * over seven years and cost about £7,000 in interest. The order matters; the
 * amount matters far more.
 */
export const DEBTS_EXAMPLE: DebtsInputs = {
  what: "Clearing the cards before next summer",
  debts: [
    { id: "d1", name: "Old card", balance: "£450", rate: "19.9", minimum: "£25" },
    { id: "d2", name: "Store card", balance: "£1,200", rate: "29.9", minimum: "£40" },
    { id: "d3", name: "Visa", balance: "£3,800", rate: "24.9", minimum: "£95" },
    { id: "d4", name: "Mastercard", balance: "£2,100", rate: "21.9", minimum: "£55" },
  ],
  budget: "£400",
  stalled: "no",
};
