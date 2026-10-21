/**
 * The read behind "Sell It, Keep It, or Let It Go?" (/sell).
 *
 * The bike in the hall, the camera in a drawer, the pram the youngest grew out
 * of, last year's phone. Each stays for one of a few reasons, and most of them
 * are about the past rather than the thing:
 *
 *   - Owning it changes how it looks. Samuelson and Zeckhauser (Journal of Risk
 *     and Uncertainty, 1988) found that people pick an option far more often
 *     when it's framed as the status quo; Kahneman, Knetsch and Thaler (JPE,
 *     1990) found owners of a mug asked about twice what buyers would pay. Gal
 *     and Rucker (2018) argue much of that is inertia rather than loss, which
 *     points at the same fix: ask the buyer's question, "would I buy this today
 *     for what it would fetch?", which doesn't feel like giving anything up.
 *   - What you paid sets the price you ask, and it shouldn't. Genesove and
 *     Mayer (QJE, 2001), on Boston flats in the 1990s: owners facing a loss on
 *     what they'd paid listed higher and sold much more slowly. The market
 *     never heard what you paid; what similar ones actually sold for is the
 *     only price that counts.
 *   - The number on the listing says something. Backus, Blake and Tadelis
 *     (JPE, 2019), on millions of eBay "Best Offer" listings: items listed at
 *     round numbers drew offers 8–12% lower but were 15–25% more likely to
 *     sell. A round number reads as "I want it gone"; a precise one reads as
 *     "I can wait". So the tool picks one on purpose, from what you care about
 *     more.
 *
 * The read, checked in order:
 *   1. "treasure" — it means something. Keep it for that, not for the money.
 *   2. "keep"     — you'd buy it again today for what it would fetch.
 *   3. "box"      — not sure. Put it out of sight with a date; if you haven't
 *                   fetched it by then, it goes.
 *   4. "give"     — it goes, but selling it would pay less than your time, or
 *                   nobody would pay for it.
 *   5. "sell"     — it goes, and it's worth selling: a price to ask, and the
 *                   lowest you'll take, decided now.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { parseMoney } from "./worth";
import { formatMoney } from "./monthly";
import { isoDay, longDate } from "./lend";

export { formatMoney, longDate };

export type Buy = "" | "yes" | "maybe" | "no";
export type Used = "" | "month" | "year" | "longer";
export type Why = "" | "might" | "means" | "paid" | "none";
export type Effort = "" | "easy" | "some" | "lots";
export type Rush = "" | "price" | "soon";
export type Condition = "" | "new" | "good" | "worn" | "repair";

export type SellInputs = {
  /** What it is. */
  what: string;
  /** What similar ones have actually sold for, after fees and postage. */
  worth: string;
  /** What you paid for it, if you remember. Only ever used to say it doesn't count. */
  paid: string;
  /** If you didn't own it, would you buy it today for that? */
  buy: Buy;
  /** When you last used it. */
  used: Used;
  /** The main reason it's still here. */
  why: Why;
  /** How much work selling it would be. */
  effort: Effort;
  /** What an hour of your time is worth to you. Optional. */
  rate: string;
  /** What matters more: the most money, or gone soon. */
  rush: Rush;
  condition: Condition;
};

export const BLANK_SELL: SellInputs = {
  what: "",
  worth: "",
  paid: "",
  buy: "",
  used: "",
  why: "",
  effort: "",
  rate: "",
  rush: "",
  condition: "",
};

export type SellKind = "treasure" | "keep" | "box" | "give" | "sell";

export type SellRead = {
  kind: SellKind;
  /** What similar ones sold for. */
  worth: number;
  /** What you paid, or null. */
  paid: number | null;
  /** The hours selling it would take. */
  hours: number;
  /** What selling it pays per hour of your time. */
  hourly: number;
  /** The price to list at. */
  ask: number;
  /** The lowest offer to accept, decided before the first one arrives. */
  floor: number;
  /** On "box": the day to open the box, YYYY-MM-DD. */
  boxUntil: string;
  /** On "give": true when nobody would pay, rather than it not being worth your time. */
  worthless: boolean;
};

/** How long a box waits before its contents go. */
export const BOX_DAYS = 90;

const HOURS: Record<Exclude<Effort, "">, number> = { easy: 1, some: 3, lots: 6 };

/** The hours selling takes: photos, the listing, the messages, the handover. */
export function sellHours(effort: Effort): number {
  return effort ? HOURS[effort] : HOURS.some;
}

/**
 * The price to list at. If the most money matters more, a precise number about
 * a tenth above what similar ones sold for (£108, not £110): it signals you can
 * wait, and offers come in higher. If gone soon matters more, a round number
 * near the going price: offers come in lower, but it's more likely to sell.
 */
export function askPrice(worth: number, rush: Rush): number {
  if (!(worth > 0)) return 0;
  if (rush === "soon") {
    const step = worth >= 200 ? 10 : worth >= 20 ? 5 : 1;
    return Math.max(step, Math.round(worth / step) * step);
  }
  const t = Math.max(1, Math.round(worth * 1.1));
  return t >= 20 && t % 5 === 0 ? t - 2 : t;
}

/** The lowest offer to accept: a tenth under the going price, or a fifth when speed matters. */
export function floorPrice(worth: number, rush: Rush): number {
  if (!(worth > 0)) return 0;
  return Math.max(1, Math.round(worth * (rush === "soon" ? 0.8 : 0.9)));
}

/** The currency the person typed, so answers come back in it. Defaults to £. */
export function sellCurrency(inp: SellInputs): string {
  for (const raw of [inp.worth, inp.paid, inp.rate]) {
    const m = raw.match(/[£$€]/);
    if (m) return m[0];
  }
  return "£";
}

/** The read so far, or null while what it would fetch or the buyer's question is missing. */
export function readSell(inp: SellInputs, today: Date = new Date()): SellRead | null {
  const worth = parseMoney(inp.worth);
  if (worth === null || !inp.buy) return null;
  const paid = parseMoney(inp.paid);
  const rate = parseMoney(inp.rate);
  const hours = sellHours(inp.effort);
  const hourly = worth / hours;

  let kind: SellKind;
  if (inp.why === "means") kind = "treasure";
  else if (inp.buy === "yes") kind = "keep";
  else if (inp.buy === "maybe") kind = "box";
  else if (worth === 0 || (rate !== null && rate > 0 && hourly < rate)) kind = "give";
  else kind = "sell";

  const until = new Date(today.getFullYear(), today.getMonth(), today.getDate() + BOX_DAYS);

  return {
    kind,
    worth,
    paid,
    hours,
    hourly,
    ask: askPrice(worth, inp.rush),
    floor: floorPrice(worth, inp.rush),
    boxUntil: kind === "box" ? isoDay(until) : "",
    worthless: kind === "give" && worth === 0,
  };
}

/** The thing, for mid-sentence use, with a fallback that's never blank. */
export function sellName(inp: SellInputs): string {
  const s = inp.what.trim().replace(/[.!?\s]+$/, "");
  return s || "it";
}

/** The thing with a capital, to start a listing or a label. */
function titleName(inp: SellInputs, fallback: string): string {
  const s = inp.what.trim().replace(/[.!?\s]+$/, "");
  if (!s) return fallback;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The answer's headline: the words printed largest, and spoken. */
export function sellHeadline(inp: SellInputs, read: SellRead): string {
  const cur = sellCurrency(inp);
  switch (read.kind) {
    case "treasure":
      return "Keep it for what it means, not what it would fetch.";
    case "keep":
      return "Keep it. You'd buy it again.";
    case "box":
      return `Box it, and date the box: ${longDate(read.boxUntil)}.`;
    case "give":
      return read.worthless
        ? "Give it away this week."
        : "Give it away. Selling it would cost more time than it pays.";
    case "sell":
      return `Sell it. Ask ${formatMoney(read.ask, cur)}; take no less than ${formatMoney(read.floor, cur)}.`;
  }
}

const CONDITION_LINE: Record<Exclude<Condition, "">, string> = {
  new: "Like new, hardly used.",
  good: "Good condition, light signs of use.",
  worn: "Well used, fully working.",
  repair: "Needs repair: [say what's wrong].",
};

/**
 * The words to use. For "sell", the listing and the reply to a low offer; for
 * "give", a free listing; for "box", the label for the box. Keeping needs no
 * words, so those kinds get none.
 */
export function sellWords(
  inp: SellInputs,
  read: SellRead,
  today: Date = new Date(),
): { listing: string; reply: string } | null {
  const cur = sellCurrency(inp);
  const cond = inp.condition ? ` ${CONDITION_LINE[inp.condition]}` : "";
  switch (read.kind) {
    case "treasure":
    case "keep":
      return null;
    case "box": {
      const after = read.worth > 0
        ? `sell it: ask ${formatMoney(read.ask, cur)}, take no less than ${formatMoney(read.floor, cur)}.`
        : "give it away.";
      return {
        listing: `${titleName(inp, "This box")}. Boxed on ${longDate(isoDay(today))}. If I haven't opened it by ${longDate(read.boxUntil)}, ${after}`,
        reply: "",
      };
    }
    case "give":
      return {
        listing: `${titleName(inp, "[What it is]")}. Free to a good home.${cond} Collection from [area], any time this week. First to collect has it.`,
        reply: "",
      };
    case "sell":
      return {
        listing: `${titleName(inp, "[What it is]")}.${cond} ${formatMoney(read.ask, cur)}. No longer used, so it should go to someone who will. Collection from [area], or I can post at cost.`,
        reply: `Thanks for the offer. The lowest I can take is ${formatMoney(read.floor, cur)}. If that works, it's yours.`,
      };
  }
}

/** The standing rule: the reusable part of the answer. */
export function sellRule(): string {
  return "My line for things I don't use: if I wouldn't buy it today for what it would sell for, it goes. I price it from what similar ones sold for, never from what I paid, and decide my lowest before the first offer. If selling it isn't worth my time, I give it away. If I'm not sure, I box it and date the box.";
}

/** The plain-text record, for notes or a message to yourself. */
export function sellSummary(inp: SellInputs, read: SellRead): string {
  const lines: string[] = [];
  if (inp.what.trim()) lines.push(inp.what.trim());
  lines.push(sellHeadline(inp, read));
  const words = sellWords(inp, read);
  if (words) {
    lines.push("");
    lines.push(words.listing);
    if (words.reply) {
      lines.push("");
      lines.push(`To a low offer: ${words.reply}`);
    }
  }
  lines.push("");
  lines.push(sellRule());
  return lines.join("\n");
}

const BUYS: Buy[] = ["yes", "maybe", "no"];
const USEDS: Used[] = ["month", "year", "longer"];
const WHYS: Why[] = ["might", "means", "paid", "none"];
const EFFORTS: Effort[] = ["easy", "some", "lots"];
const RUSHES: Rush[] = ["price", "soon"];
const CONDITIONS: Condition[] = ["new", "good", "worn", "repair"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseSellInputs(raw: unknown): SellInputs {
  if (!raw || typeof raw !== "object") return BLANK_SELL;
  const v = raw as Record<string, unknown>;
  const str = (k: keyof SellInputs) => (typeof v[k] === "string" ? (v[k] as string) : "");
  return {
    what: str("what"),
    worth: str("worth"),
    paid: str("paid"),
    buy: oneOf(v.buy, BUYS),
    used: oneOf(v.used, USEDS),
    why: oneOf(v.why, WHYS),
    effort: oneOf(v.effort, EFFORTS),
    rate: str("rate"),
    rush: oneOf(v.rush, RUSHES),
    condition: oneOf(v.condition, CONDITIONS),
  };
}

/**
 * The worked example: a road bike bought for £900, ridden twice last year.
 * Similar ones have sold for about £350. Would they buy it today for £350? No.
 * So: sell it, listed at a precise £383, with £315 as the lowest offer.
 */
export const SELL_EXAMPLE: SellInputs = {
  what: "the road bike in the hall",
  worth: "£350",
  paid: "£900",
  buy: "no",
  used: "longer",
  why: "paid",
  effort: "some",
  rate: "",
  rush: "price",
  condition: "good",
};
