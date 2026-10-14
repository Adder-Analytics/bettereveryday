/**
 * The read behind "Fix It or Replace It?" (/fix).
 *
 * The washing machine with a bad bearing, the laptop with a dead battery, the
 * car with a big garage quote, the boiler, the phone screen. Each is the same
 * call: pay a repair to keep the old one going, or pay more for a new one that
 * lasts longer. People make it on feel, and the feel is pulled from both sides:
 *
 *   - Towards repairing too long. What's already been spent votes, though it
 *     can't be recovered (the sunk cost; Arkes and Blumer, 1985). Erica Okada
 *     (JCR, 2001) found people keep a "mental book value" for what they own and
 *     resist replacing it until they feel they've had their money's worth.
 *   - Towards replacing too soon. Silvia Bellezza, Joshua Ackerman and
 *     Francesca Gino (JMR, 2017) found that when an appealing upgrade is
 *     available, people treat what they own more carelessly, partly to justify
 *     the upgrade without feeling wasteful. In a German Environment Agency
 *     study (UBA and Öko-Institut, 2012/13 data), about a third of the large
 *     household appliances people replaced still worked.
 *
 * The common rule of thumb, from Consumer Reports, is not to spend more than
 * half the price of a new one on a repair. That rule is this sum with a guess
 * baked in: a repair that costs half the price only pays if it buys half a new
 * one's life. The tool takes the guess out and asks for it directly.
 *
 * The sum: a new one costs (price − what the old one would fetch) ÷ its life
 * per year of use, less anything it saves to run. A repair beats it if it keeps
 * the old one going longer than quote ÷ that yearly cost. That's the one
 * number people can judge ("will it last another ten months?") far better than
 * a cost per year.
 *
 * The read, checked in order:
 *   1. "outlast"   — the repair would have to keep it going longer than a new
 *                    one would last. Replace it.
 *   2. by your read of how long it'll last against the break-even: "fix"
 *      (comfortably longer), "close" (about that), "replace" (shorter),
 *      "easy" (no idea, but the bar is under three months), "ask" (no idea),
 *      or "threshold" while unanswered.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { parseYears } from "./cover";
import { formatMoney, parseMoney } from "./worth";

/** Your read of how long the repaired one will last against the break-even. */
export type Last = "" | "longer" | "about" | "shorter" | "unknown";

/** The pulls on the call that aren't in the sum. */
export type Pulls = {
  /** "I've already spent a lot on it." */
  sunk: boolean;
  /** "The new one is better, and I want it." */
  upgrade: boolean;
  /** "Throwing it out feels wasteful." */
  waste: boolean;
  /** "I'm worried something else will go next." */
  next: boolean;
};

export type FixInputs = {
  what: string;
  /** The repair quote. */
  quote: string;
  /** What a new one costs. */
  price: string;
  /** How long a new one would last: "10 years". */
  life: string;
  /** What the old one would fetch as it is: a trade-in, a sale, scrap. */
  resale: string;
  /** What a new one would save a year to run: energy, fuel, upkeep. */
  saving: string;
  last: Last;
  pulls: Pulls;
};

export const NO_PULLS: Pulls = { sunk: false, upgrade: false, waste: false, next: false };

export const BLANK_FIX: FixInputs = {
  what: "",
  quote: "",
  price: "",
  life: "",
  resale: "",
  saving: "",
  last: "",
  pulls: NO_PULLS,
};

export type FixKind = "outlast" | "threshold" | "easy" | "fix" | "close" | "replace" | "ask";

export type FixRead = {
  kind: FixKind;
  quote: number;
  price: number;
  /** Years a new one would last. */
  life: number;
  resale: number;
  /** Yearly running saving with the new one. */
  saving: number;
  /** What owning a new one costs per year of use, net of the saving. */
  yearly: number;
  /** Years the repair has to keep it going to beat buying new. Infinity if never. */
  needed: number;
  /** True when the quote is over half the new price: the rule of thumb says replace. */
  halfRule: boolean;
};

/** Below this many years, a repair is cheap enough to take without a forecast. */
export const EASY_YEARS = 0.25;

/** The currency the person typed, so answers come back in it. Defaults to £. */
export function fixCurrency(inp: FixInputs): string {
  for (const raw of [inp.quote, inp.price, inp.resale, inp.saving]) {
    const m = raw.match(/[£$€]/);
    if (m) return m[0];
  }
  return "£";
}

/** The read so far, or null while a number it needs is missing. */
export function readFix(inp: FixInputs): FixRead | null {
  const quote = parseMoney(inp.quote);
  const price = parseMoney(inp.price);
  const life = parseYears(inp.life);
  if (!quote || !price || !life) return null;
  const resale = Math.min(parseMoney(inp.resale) ?? 0, price);
  const saving = parseMoney(inp.saving) ?? 0;

  const yearly = (price - resale) / life - saving;
  const needed = yearly > 0 ? quote / yearly : Infinity;
  const base = { quote, price, life, resale, saving, yearly, needed, halfRule: quote > price / 2 };

  if (needed >= life) return { kind: "outlast", ...base };
  switch (inp.last) {
    case "longer":
      return { kind: "fix", ...base };
    case "about":
      return { kind: "close", ...base };
    case "shorter":
      return { kind: "replace", ...base };
    case "unknown":
      return { kind: needed <= EASY_YEARS ? "easy" : "ask", ...base };
    default:
      return { kind: needed <= EASY_YEARS ? "easy" : "threshold", ...base };
  }
}

/**
 * A span of years said the way people say it: "3 weeks", "10 months",
 * "2½ years". Rounded, because the inputs are guesses.
 */
export function duration(years: number): string {
  if (!Number.isFinite(years)) return "forever";
  const weeks = years * 52;
  if (weeks < 6) {
    const w = Math.max(1, Math.round(weeks));
    return `${w} week${w === 1 ? "" : "s"}`;
  }
  const months = years * 12;
  if (months < 23.5) {
    const m = Math.max(2, Math.round(months));
    return `${m} months`;
  }
  const half = Math.round(years * 2) / 2;
  const whole = Math.floor(half);
  return `${whole}${half > whole ? "½" : ""} years`;
}

/** The thing, for mid-sentence use, with a fallback that's never blank. */
export function fixName(inp: FixInputs): string {
  const s = inp.what.trim().replace(/[.!?\s]+$/, "");
  if (!s) return "it";
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** The sum in one sentence: what a year of new costs, and what the repair has to buy. */
export function breakEvenSentence(inp: FixInputs, read: FixRead): string {
  const cur = fixCurrency(inp);
  const q = formatMoney(read.quote, cur);
  if (read.yearly <= 0) {
    return `A new one would save more to run each year than it costs per year of use, so it pays for itself however long a repair would last.`;
  }
  const y = formatMoney(read.yearly, cur);
  const bits: string[] = [];
  if (read.resale > 0) bits.push(`less the ${formatMoney(read.resale, cur)} the old one would fetch`);
  if (read.saving > 0) bits.push(`less the ${formatMoney(read.saving, cur)} a year it saves to run`);
  const net = bits.length ? `, ${bits.join(" and ")},` : ",";
  const newPart = `A new one costs ${formatMoney(read.price, cur)} and lasts about ${duration(read.life)}${net} which comes to ${y} for each year of use.`;
  if (read.needed >= read.life) {
    return `${newPart} At that rate the ${q} repair would have to keep the old one going for ${duration(read.needed)}, longer than a new one would last.`;
  }
  return `${newPart} The ${q} repair beats it if it keeps the old one going for more than ${duration(read.needed)}.`;
}

/** The question the "how long" chips answer. */
export function lastQuestion(read: FixRead): string {
  return `Repaired, will it keep going for more than ${duration(read.needed)}?`;
}

/** The answer's headline: the words printed largest, and spoken. */
export function fixHeadline(read: FixRead): string {
  const d = duration(read.needed);
  switch (read.kind) {
    case "outlast":
      return "Replace it. The repair would have to outlast a new one.";
    case "threshold":
      return `Fix it if it'll last more than ${d}.`;
    case "easy":
      return `Fix it. It only has to last ${d}.`;
    case "fix":
      return "Fix it.";
    case "close":
      return "Too close to call on money. Let the rest decide.";
    case "replace":
      return "Replace it.";
    case "ask":
      return `Fix it only if it'll last more than ${d}. Ask the repairer.`;
  }
}

/**
 * The rule of thumb against the sum: whether "don't spend more than half the
 * price of a new one" agrees here, and why it can't always.
 */
export function halfRuleSentence(read: FixRead): string {
  const says = read.halfRule ? "replace it" : "fix it";
  const head = `The usual rule of thumb, don't spend more than half the price of a new one, says ${says}. It's roughly this same sum with a guess built in: that a repair buys about half the life of a new one.`;
  if (!Number.isFinite(read.needed)) {
    return `${head} Here no repair can win, because the new one pays for itself in running costs.`;
  }
  const share = Math.round((read.needed / read.life) * 100);
  if (read.needed >= read.life) {
    return `${head} Here the repair would need ${duration(read.needed)}, more than a new one's whole life, so no guess saves it.`;
  }
  return `${head} Here the repair needs ${duration(read.needed)}, about ${share}% of a new one's life. The question is whether it'll last that long, not whether the quote is under half.`;
}

/** The standing rule: the reusable part of the answer. */
export function fixRule(): string {
  return "My line for repairs: divide the quote by what a new one costs per year of use. If I'm confident the repair buys more time than that, I fix it; if not, I replace it. What I've already spent on it doesn't count.";
}

/** The plain-text record, for notes or a message to yourself. */
export function fixSummary(inp: FixInputs, read: FixRead): string {
  const lines: string[] = [];
  if (inp.what.trim()) lines.push(inp.what.trim());
  lines.push(breakEvenSentence(inp, read));
  lines.push("");
  lines.push(fixHeadline(read));
  lines.push("");
  lines.push(fixRule());
  return lines.join("\n");
}

const LASTS: Last[] = ["longer", "about", "shorter", "unknown"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseFixInputs(raw: unknown): FixInputs {
  if (!raw || typeof raw !== "object") return BLANK_FIX;
  const v = raw as Record<string, unknown>;
  const str = (k: keyof FixInputs) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const p = v.pulls && typeof v.pulls === "object" ? (v.pulls as Record<string, unknown>) : {};
  return {
    what: str("what"),
    quote: str("quote"),
    price: str("price"),
    life: str("life"),
    resale: str("resale"),
    saving: str("saving"),
    last: oneOf(v.last, LASTS),
    pulls: {
      sunk: p.sunk === true,
      upgrade: p.upgrade === true,
      waste: p.waste === true,
      next: p.next === true,
    },
  };
}

/**
 * The worked example: a five-year-old laptop that needs a new battery and
 * keyboard for £120. A new one is £800 and lasts about five years, and the old
 * one would trade in for £100, so a year of new costs £140. The repair only
 * has to buy about ten months, the rest of the laptop is fine, and the pull
 * towards replacing was mostly the shiny new model.
 */
export const FIX_EXAMPLE: FixInputs = {
  what: "The old laptop: new battery and keyboard",
  quote: "£120",
  price: "£800",
  life: "5 years",
  resale: "£100",
  saving: "",
  last: "longer",
  pulls: { sunk: false, upgrade: true, waste: false, next: false },
};
