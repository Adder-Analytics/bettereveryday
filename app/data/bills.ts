/**
 * The sums behind "Who Pays for What?" (/bills).
 *
 * Two people share a home and one earns more. The bills were probably split
 * down the middle the week they moved in and never looked at again, and now
 * one of them is quietly short every month while the other is quietly
 * uncomfortable about it. There are three common answers, and each is fair by
 * a different principle:
 *
 *   - Half each. Equality of what goes in: the bills are a shared purchase
 *     and each of you buys half.
 *   - In proportion to pay. Each of you puts in the same share of what you
 *     take home: the ability-to-pay principle tax systems use.
 *   - Pool it. Equality of what's left: the bills come out first and you each
 *     have the same amount to spend on yourselves.
 *
 * Morton Deutsch (Journal of Social Issues, 1975) named the three values a
 * split can rest on (equity, equality and need) and argued that which one
 * people reach for depends on what kind of relationship they're in. That's
 * why the row is hard: two people can agree on every number and still hold
 * different principles. So the tool doesn't pick one. It lays the three side
 * by side in pounds, says how much the choice is actually worth (between half
 * each and the pool it's always half the gap in pay, for the lower earner),
 * tests each against a drop in either income, and lets the couple choose. It
 * ends in a line to keep for the rule they chose.
 *
 * YouGov (August 2024) found more Britons think bills should follow pay (48%)
 * than be split 50-50 (37%), while among working couples more actually split
 * 50-50 (46%) than by pay (38%). Gladstone, Garbinsky and Mogilner (JPSP,
 * 2022; six studies, N = 38,534) found couples who pooled all their money
 * were more satisfied and less likely to split up, most of all when money was
 * tight. Vogler and Pahl (Sociological Review, 1994) found a pool controlled
 * by one partner isn't an equal one: the couples with the most equality had a
 * jointly controlled pool. The page says each of these where it matters.
 *
 * Pure data and functions, no React, so the sums can be checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";

export type Rule = "even" | "pay" | "pool";

export type Cost = {
  id: string;
  name: string;
  /** A month, as typed: "£1,450", "160", "1.2k". */
  amount: string;
};

export type BillsInputs = {
  names: [string, string];
  /** Take-home pay a month, as typed. */
  pay: [string, string];
  costs: Cost[];
  /** What the first person pays towards these now, a month (optional). */
  now: string;
  /** The rule they chose, if they have. */
  rule: "" | Rule;
};

export const MAX_COSTS = 12;

export const RULES: Rule[] = ["even", "pay", "pool"];

export const RULE_NAME: Record<Rule, string> = {
  even: "Half each",
  pay: "In proportion to pay",
  pool: "Pool it",
};

/** The principle each rule rests on, in one line. */
export const RULE_PRINCIPLE: Record<Rule, string> = {
  even: "The bills are a shared purchase, and each of you buys half. Equal in, whatever you earn.",
  pay: "Each of you puts in the same share of what you take home. The higher earner pays more, and also keeps more.",
  pool: "One household, one budget. The bills come out first, and you each have the same left to spend on yourselves.",
};

export function blankCost(id: string, name = ""): Cost {
  return { id, name, amount: "" };
}

export const BLANK_BILLS: BillsInputs = {
  names: ["", ""],
  pay: ["", ""],
  costs: [blankCost("c1")],
  now: "",
  rule: "",
};

/** A fresh id with this prefix that isn't taken. */
export function nextId(prefix: string, taken: { id: string }[]): string {
  const ids = new Set(taken.map((t) => t.id));
  let n = taken.length + 1;
  while (ids.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

/** A person's name for display, never blank. */
export function who(inp: BillsInputs, i: 0 | 1): string {
  return inp.names[i].trim() || (i === 0 ? "Person 1" : "Person 2");
}

/** The currency the person typed, so answers come back in it. Defaults to £. */
export function billsCurrency(inp: BillsInputs): string {
  const m = [...inp.pay, inp.now, ...inp.costs.map((c) => c.amount)].join(" ").match(/[£$€]/);
  return m ? m[0] : "£";
}

/** True when a field has text that can't be read as money. */
export function amountInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseMoney(raw) === null;
}

export type Outcome = {
  rule: Rule;
  /** What each pays towards the bills, a month. */
  pays: [number, number];
  /** What each has left after the bills (and any top-up), a month. */
  left: [number, number];
  /** The bills each pays as a share of their own take-home pay. */
  ofPay: [number, number];
  /**
   * Pool only: when the gap in pay is bigger than the bills, the higher
   * earner pays all of them and still tops the other up by this much to leave
   * you level. Zero otherwise.
   */
  topUp: number;
  /** Half each only: the lower earner can't cover half from their pay. */
  cantCover: boolean;
};

export type BillsRead = {
  income: [number, number];
  total: number;
  /** Index of the lower earner (0 when equal). */
  lower: 0 | 1;
  higher: 0 | 1;
  outcomes: Record<Rule, Outcome>;
  /** How far the lower earner's bills move between the rules, a month. */
  span: number;
  /** Pay close enough that the rule barely matters. */
  close: boolean;
  /** The bills come to more than you take home between you. */
  short: boolean;
  /** What each pays now, if said, and the rule it's nearest to. */
  now: { pays: [number, number]; nearest: Rule; off: number } | null;
  /** Typed "now" is more than the whole of the bills. */
  nowTooBig: boolean;
  /** Costs with an amount but no readable number, or a name but no amount. */
  unread: number;
};

/** Pay within this share of the two incomes together counts as close. */
const CLOSE = 0.1;

function outcome(rule: Rule, income: [number, number], total: number): Outcome {
  const both = income[0] + income[1];
  let pays: [number, number];
  let topUp = 0;
  if (rule === "even") {
    pays = [total / 2, total / 2];
  } else if (rule === "pay") {
    pays = [(total * income[0]) / both, (total * income[1]) / both];
  } else {
    const each = (both - total) / 2;
    const raw: [number, number] = [income[0] - each, income[1] - each];
    if (raw[0] < 0) {
      topUp = -raw[0];
      pays = [0, total];
    } else if (raw[1] < 0) {
      topUp = -raw[1];
      pays = [total, 0];
    } else {
      pays = raw;
    }
  }
  const lowIdx = income[0] <= income[1] ? 0 : 1;
  const left: [number, number] = [income[0] - pays[0], income[1] - pays[1]];
  if (topUp) {
    left[lowIdx] += topUp;
    left[lowIdx === 0 ? 1 : 0] -= topUp;
  }
  return {
    rule,
    pays,
    left,
    ofPay: [income[0] ? pays[0] / income[0] : 0, income[1] ? pays[1] / income[1] : 0],
    topUp,
    cantCover: rule === "even" && total / 2 > Math.min(income[0], income[1]),
  };
}

/** The whole read, or null until there's pay for both and at least one cost. */
export function readBills(inp: BillsInputs): BillsRead | null {
  const a = parseMoney(inp.pay[0]);
  const b = parseMoney(inp.pay[1]);
  if (a === null || b === null || a + b <= 0) return null;
  let total = 0;
  let unread = 0;
  for (const c of inp.costs) {
    const v = parseMoney(c.amount);
    if (v === null) {
      if (c.amount.trim() || c.name.trim()) unread++;
      continue;
    }
    total += v;
  }
  if (total <= 0) return null;
  const income: [number, number] = [a, b];
  const lower: 0 | 1 = a <= b ? 0 : 1;
  const higher: 0 | 1 = lower === 0 ? 1 : 0;
  const outcomes = {
    even: outcome("even", income, total),
    pay: outcome("pay", income, total),
    pool: outcome("pool", income, total),
  };
  const low = RULES.map((r) => outcomes[r].pays[lower]);
  const span = Math.max(...low) - Math.min(...low);
  const close = Math.abs(a - b) / (a + b) < CLOSE;

  let now: BillsRead["now"] = null;
  let nowTooBig = false;
  const n = parseMoney(inp.now);
  if (n !== null) {
    if (n > total + 0.5) nowTooBig = true;
    else {
      const pays: [number, number] = [n, total - n];
      let nearest: Rule = "even";
      let off = Infinity;
      for (const r of RULES) {
        const d = Math.abs(outcomes[r].pays[0] - n);
        if (d < off - 0.5) {
          off = d;
          nearest = r;
        }
      }
      now = { pays, nearest, off };
    }
  }

  return {
    income,
    total,
    lower,
    higher,
    outcomes,
    span,
    close,
    short: total > a + b,
    now,
    nowTooBig,
    unread,
  };
}

/** The answer in one sentence: printed largest and spoken. */
export function billsHeadline(inp: BillsInputs, read: BillsRead | null = readBills(inp)): string | null {
  if (!read) return null;
  const cur = billsCurrency(inp);
  if (read.short) {
    return `Your shared costs come to ${formatMoney(read.total, cur)} a month, more than the two of you take home.`;
  }
  if (read.close) {
    return `Your pay is close: every way of splitting lands within ${formatMoney(read.span, cur)} a month, so half each is fair enough.`;
  }
  return `The rule you choose moves up to ${formatMoney(read.span, cur)} a month between you.`;
}

/** The sentence under the headline that says what the number means. */
export function billsWhy(inp: BillsInputs, read: BillsRead): string {
  const cur = billsCurrency(inp);
  const lo = who(inp, read.lower);
  const o = read.outcomes;
  if (read.short) {
    return "No split fixes that: whichever rule you choose, the bills are bigger than the pay. Look at the biggest costs first, or at what else comes in.";
  }
  const m = (r: Rule) => formatMoney(o[r].pays[read.lower], cur);
  if (read.close) {
    return `With pay this similar, ${lo}'s share of the bills is ${m("even")} split in half, ${m("pay")} in proportion and ${m("pool")} pooled. Most couples on similar pay split evenly, and the difference here won't be worth an argument.`;
  }
  const gap = o.pool.topUp || o.even.cantCover ? "" : " Between half each and pooling, the gap is always half the difference in your pay.";
  return `That's ${lo}'s share of the bills: ${m("even")} if you split them in half, ${m("pay")} in proportion to pay, and ${m("pool")} if you pool it all.${gap} Each rule is fair by a different principle, so the question isn't which sum is right but which principle fits the two of you.`;
}

/** What one rule means for the two of you, as a short paragraph. */
export function outcomeLine(inp: BillsInputs, read: BillsRead, rule: Rule): string {
  const cur = billsCurrency(inp);
  const o = read.outcomes[rule];
  const part = (i: 0 | 1) =>
    `${who(inp, i)} pays ${formatMoney(o.pays[i], cur)} (${pct(o.ofPay[i])} of their pay) and ${
      o.left[i] < 0 ? `is ${formatMoney(-o.left[i], cur)} short` : `has ${formatMoney(o.left[i], cur)} left`
    }`;
  let s = `${part(0)}; ${part(1)}.`;
  if (o.topUp) {
    s += ` The gap in your pay is bigger than the bills, so ${who(inp, read.higher)} pays all of them and also moves ${formatMoney(o.topUp, cur)} a month to ${who(inp, read.lower)} to leave you level.`;
  }
  return s;
}

/** The strain check: what each rule does if the lower earner's pay stopped. */
export function stressLine(inp: BillsInputs, read: BillsRead): string | null {
  if (read.short) return null;
  const cur = billsCurrency(inp);
  const lo = who(inp, read.lower);
  const hi = who(inp, read.higher);
  const half = formatMoney(read.total / 2, cur);
  const even = read.outcomes.even;
  const first = even.cantCover
    ? `Half each is already more than ${lo} takes home.`
    : even.ofPay[read.lower] > 0.5
      ? `Half each already takes ${pct(even.ofPay[read.lower])} of ${lo}'s pay, leaving ${formatMoney(even.left[read.lower], cur)} for everything else.`
      : `Half each takes ${pct(even.ofPay[read.lower])} of ${lo}'s pay and ${pct(even.ofPay[read.higher])} of ${hi}'s.`;
  const canCarry = read.income[read.higher] >= read.total;
  const second = canCarry
    ? `If ${lo}'s pay stopped for a while (a lost job, parental leave, illness), in proportion and the pool move the bills to ${hi} without a new conversation; half each would still ask ${lo} for ${half} a month.`
    : `If either pay stopped, the other couldn't carry the bills alone under any rule, so whichever you choose, keep some savings that belong to you both.`;
  return `${first} ${second}`;
}

/** What you do now, against the three. */
export function nowLine(inp: BillsInputs, read: BillsRead): string | null {
  if (!read.now) return null;
  const cur = billsCurrency(inp);
  const { pays, nearest, off } = read.now;
  const now = `${who(inp, 0)} ${formatMoney(pays[0], cur)}, ${who(inp, 1)} ${formatMoney(pays[1], cur)}`;
  if (off < Math.max(10, read.total * 0.02)) {
    return `What you do now (${now}) is ${RULE_NAME[nearest].toLowerCase()}, near enough.`;
  }
  return `What you do now (${now}) is closest to ${RULE_NAME[nearest].toLowerCase()}, ${formatMoney(off, cur)} a month off it.`;
}

/** A share as a whole percentage. */
export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** The standing rule: the part of the answer to keep, for the rule chosen. */
export function billsRule(inp: BillsInputs, read: BillsRead, rule: Rule): string {
  const cur = billsCurrency(inp);
  const o = read.outcomes[rule];
  const a = who(inp, 0);
  const b = who(inp, 1);
  const pays = `${a} ${formatMoney(o.pays[0], cur)} a month and ${b} ${formatMoney(o.pays[1], cur)}`;
  const again = "We redo the sum whenever either of our pay changes, and we each keep some money that's ours to spend without asking.";
  if (rule === "even") {
    return `Our line for the bills: we split the shared costs in half, ${formatMoney(read.total / 2, cur)} each a month, and each keep the rest. ${again}`;
  }
  if (rule === "pay") {
    return `Our line for the bills: we each put in the same share of our take-home pay, ${pct(read.total / (read.income[0] + read.income[1]))} at today's pay: ${pays}. ${again}`;
  }
  const level = formatMoney(o.left[0], cur);
  const top = o.topUp
    ? ` ${who(inp, read.higher)} pays the bills and moves ${formatMoney(o.topUp, cur)} a month to ${who(inp, read.lower)}.`
    : ` That's ${pays}.`;
  return `Our line for the bills: our pay goes into one pot, the bills come out first, and we each have the same left over, ${level} a month at today's pay.${top} ${again}`;
}

/** Plain text to send each other. */
export function billsSummary(inp: BillsInputs, read: BillsRead | null = readBills(inp)): string {
  if (!read) return "";
  const cur = billsCurrency(inp);
  const lines: string[] = [];
  const head = billsHeadline(inp, read);
  if (head) lines.push(head, "");
  lines.push(`Shared costs: ${formatMoney(read.total, cur)} a month.`, "");
  for (const r of RULES) lines.push(`${RULE_NAME[r]}: ${outcomeLine(inp, read, r)}`);
  if (inp.rule) lines.push("", billsRule(inp, read, inp.rule));
  return lines.join("\n");
}

/** A short subject for the decision list. */
export function billsSubject(inp: BillsInputs): string | null {
  const names = inp.names.map((n) => n.trim()).filter(Boolean);
  const read = readBills(inp);
  if (names.length === 0 && !read) return null;
  const pair = names.length ? names.join(", ") : "two of you";
  return `Bills: ${pair}${read ? ` (${formatMoney(read.total, billsCurrency(inp))} a month)` : ""}`;
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseBillsInputs(raw: unknown): BillsInputs {
  if (!raw || typeof raw !== "object") return BLANK_BILLS;
  const v = raw as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === "string" ? x : "");
  const pair = (x: unknown): [string, string] =>
    Array.isArray(x) ? [str(x[0]), str(x[1])] : ["", ""];
  const costs: Cost[] = [];
  if (Array.isArray(v.costs)) {
    for (const item of v.costs.slice(0, MAX_COSTS)) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      let id = str(o.id);
      if (!id || costs.some((c) => c.id === id)) id = nextId("c", costs);
      costs.push({ id, name: str(o.name), amount: str(o.amount) });
    }
  }
  const rule = str(v.rule);
  return {
    names: pair(v.names),
    pay: pair(v.pay),
    costs: costs.length ? costs : [blankCost("c1")],
    now: str(v.now),
    rule: (RULES as string[]).includes(rule) ? (rule as Rule) : "",
  };
}

/**
 * The worked example: a couple who split everything in half when they moved
 * in, on similar pay. Then Robin went part-time to retrain, and half each
 * started taking more than half of Robin's pay.
 */
export const BILLS_EXAMPLE: BillsInputs = {
  names: ["Jordan", "Robin"],
  pay: ["£3,400", "£2,100"],
  costs: [
    { id: "c1", name: "Rent", amount: "£1,450" },
    { id: "c2", name: "Energy", amount: "£160" },
    { id: "c3", name: "Council tax", amount: "£150" },
    { id: "c4", name: "Groceries", amount: "£450" },
    { id: "c5", name: "Internet and phones", amount: "£70" },
    { id: "c6", name: "Insurance", amount: "£40" },
  ],
  now: "£1,160",
  rule: "",
};
