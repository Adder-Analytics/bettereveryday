/**
 * The read behind "Insure It or Carry It?" (/cover).
 *
 * The extended warranty at the till, phone or gadget cover, the rental car's
 * damage waiver, GAP, and the excess on a policy you're renewing. Each is the
 * same trade: pay a sure amount now to shrink a loss that might never come.
 * People get it wrong in both directions, in well-measured ways:
 *
 *   - Over-insuring small, replaceable things. Justin Sydnor (AEJ: Applied,
 *     2010) found most homeowners chose a low deductible, paying far more for
 *     it than it could be expected to return given how rarely they claimed.
 *     Jose Miguel Abito and Yuval Salant (Review of Economic Studies, 2019)
 *     found demand for extended warranties is driven mainly by people
 *     overestimating how often products fail: in their survey experiment,
 *     uninformed guesses ran around 13–15% against an expert figure of 5%,
 *     and the median price people would pay roughly halved once they saw it.
 *   - Under-insuring the losses that would actually ruin you. Kunreuther and
 *     colleagues (Risk Analysis, 2012) found the typical new US flood policy
 *     lapsed within two to four years, faster than people moved house.
 *
 * The rule that cuts both ways is old and simple: insure the loss you couldn't
 * absorb, carry the ones you could. For a loss you could carry, one division
 * says whether the cover is even in the running: its price over what it would
 * pay is the chance of a claim at which it breaks even. Sellers price above
 * that on average, so it only pays if you have a reason to think your own
 * odds are worse than theirs.
 *
 * The read, checked in order:
 *   1. "never"   — the cover costs at least as much as one claim would pay.
 *   2. "insure"  — the loss is bigger than you could pay from savings.
 *   3. "check"   — you may already be covered (a manufacturer's warranty,
 *                  your legal rights, a card, a home policy).
 *   4. by your read of the odds against the break-even: "carry" (less likely),
 *      "record" (more likely, on your own record), "doubt" (more likely, on
 *      feel), "house" (no idea), or "threshold" while unanswered.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";

/** Buy cover or not, or choose between two excess levels on one policy. */
export type CoverMode = "" | "cover" | "excess";
/** How the price is charged. */
export type CoverPer = "" | "once" | "month" | "year";
/** Whether something you already have might cover it. */
export type Covered = "" | "yes" | "unsure" | "no";
/** Your read of the odds against the break-even. */
export type Odds = "" | "less" | "record" | "feeling" | "unknown";

export type CoverInputs = {
  what: string;
  mode: CoverMode;
  /** cover: the price of the cover. excess: the extra premium for the lower excess. */
  price: string;
  pricePer: CoverPer;
  /** For a one-off price: how many years it covers. */
  years: string;
  /** cover: what replacing or repairing it would cost. excess: the higher excess. */
  loss: string;
  /** cover: the excess you'd still pay on a claim. excess: the lower excess. */
  excess: string;
  /** The biggest bill you could pay from savings without borrowing or real hardship. */
  buffer: string;
  covered: Covered;
  odds: Odds;
  /** "I'd worry without it." */
  worry: boolean;
};

export const BLANK_COVER: CoverInputs = {
  what: "",
  mode: "",
  price: "",
  pricePer: "once",
  years: "",
  loss: "",
  excess: "",
  buffer: "",
  covered: "",
  odds: "",
  worry: false,
};

export type CoverKind = "never" | "insure" | "check" | "threshold" | "carry" | "record" | "doubt" | "house";

export type CoverRead = {
  kind: CoverKind;
  /** What the cover costs over the period the odds are about. */
  cost: number;
  /** The most one claim would put back in your pocket. */
  payout: number;
  /** What you'd pay yourself in the worst case without it. */
  hit: number;
  buffer: number;
  /** cost / payout: the chance of a claim at which the cover breaks even. */
  breakEven: number;
  /** Years the odds are counted over: the term of a one-off price, else one. */
  term: number;
  /** "unsure" adds a note to check existing cover, without stopping the read. */
  unsureCovered: boolean;
};

export const PER_LABEL: Record<Exclude<CoverPer, "">, string> = {
  once: "once, up front",
  month: "a month",
  year: "a year",
};

/** Read a number of years: "3", "2.5", "3 years", "18 months". */
export function parseYears(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  const m = s.match(/^(\d+(?:[.,]\d+)?)\s*(y|yr|yrs|year|years|m|mo|mos|month|months)?$/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return m[2] && m[2].startsWith("m") ? n / 12 : n;
}

export function yearsInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseYears(raw) === null;
}

/** The currency the person typed, so answers come back in it. Defaults to £. */
export function coverCurrency(inp: CoverInputs): string {
  for (const raw of [inp.price, inp.loss, inp.excess, inp.buffer]) {
    const m = raw.match(/[£$€]/);
    if (m) return m[0];
  }
  return "£";
}

/**
 * The read so far, or null while a number it needs is missing.
 */
export function readCover(inp: CoverInputs): CoverRead | null {
  if (!inp.mode || !inp.pricePer) return null;
  const price = parseMoney(inp.price);
  const loss = parseMoney(inp.loss);
  const excess = parseMoney(inp.excess) ?? 0;
  const buffer = parseMoney(inp.buffer);
  if (!price || !loss || buffer === null) return null;

  let term = 1;
  let cost = price;
  if (inp.pricePer === "once") {
    if (inp.mode === "cover") {
      const y = parseYears(inp.years);
      if (!y) return null;
      term = y;
    }
  } else if (inp.pricePer === "month") {
    cost = price * 12;
  }

  // cover: it pays the loss less the excess, and without it you pay the lot.
  // excess: the lower excess saves the difference on a claim, and with the
  // higher one the worst you pay is the higher excess.
  const payout = loss - excess;
  const hit = loss;
  if (payout <= 0) return null;

  const breakEven = cost / payout;
  const base = {
    cost,
    payout,
    hit,
    buffer,
    breakEven,
    term,
    unsureCovered: inp.mode === "cover" && inp.covered === "unsure",
  };

  if (breakEven >= 1) return { kind: "never", ...base };
  if (hit > buffer) return { kind: "insure", ...base };
  if (inp.mode === "cover" && inp.covered === "yes") return { kind: "check", ...base };
  switch (inp.odds) {
    case "less":
      return { kind: "carry", ...base };
    case "record":
      return { kind: "record", ...base };
    case "feeling":
      return { kind: "doubt", ...base };
    case "unknown":
      return { kind: "house", ...base };
    default:
      return { kind: "threshold", ...base };
  }
}

/**
 * "1 in 6": the break-even as odds people can picture. Rounded to a whole
 * number, so it reads as a rough threshold and not a precise figure.
 */
export function oneIn(p: number): string {
  if (p >= 1) return "certain";
  const n = 1 / p;
  if (n >= 1000) return "1 in 1,000+";
  const r = n >= 20 ? Math.round(n / 5) * 5 : Math.round(n);
  return `1 in ${Math.max(1, r).toLocaleString("en-GB")}`;
}

/** "17%", "0.8%". */
export function pct(p: number): string {
  const v = p * 100;
  if (v >= 10) return `${Math.round(v)}%`;
  if (v >= 1) return `${Math.round(v * 10) / 10}%`;
  return `${Math.round(v * 100) / 100}%`;
}

/** "over the 3 years it covers", "in a year". */
export function termPhrase(read: CoverRead): string {
  if (read.term === 1) return "in a year";
  const y = Math.round(read.term * 10) / 10;
  return `over the ${y} years it covers`;
}

/**
 * The break-even said in the terms of the choice: the chance a claim has to
 * beat for the cover to pay, or how often you'd have to claim for the lower
 * excess to pay.
 */
export function breakEvenSentence(inp: CoverInputs, read: CoverRead): string {
  const cur = coverCurrency(inp);
  const c = formatMoney(read.cost, cur);
  const p = formatMoney(read.payout, cur);
  if (read.breakEven >= 1) {
    return inp.mode === "excess"
      ? `The lower excess costs ${c} a year and saves you only ${p} on a claim: more than a claim a year would save.`
      : `The cover costs ${c} and would pay out at most ${p} on a claim: more than one claim could ever give back.`;
  }
  if (inp.mode === "excess") {
    const yrs = claimEvery(read) ?? "about once a year";
    return `The lower excess costs ${c} a year and saves you ${p} on a claim. It only pays if you'd claim more often than ${yrs}.`;
  }
  const per = read.term === 1 && inp.pricePer !== "once" ? " a year" : "";
  return `The cover costs ${c}${per} and would pay out at most ${p} on a claim. It only pays for itself if a claim is likelier than ${oneIn(read.breakEven)} (${pct(read.breakEven)}) ${termPhrase(read)}.`;
}

/** The question the odds chips answer, worded for the mode. */
export function oddsQuestion(inp: CoverInputs, read: CoverRead): string {
  if (inp.mode === "excess") {
    return `Do you claim more often than ${claimEvery(read) ?? "once a year"}?`;
  }
  return `Is a claim likelier than ${oneIn(read.breakEven)} ${termPhrase(read)}?`;
}

/** "once every 5 years", or null when the break-even is about yearly. */
export function claimEvery(read: CoverRead): string | null {
  const every = 1 / read.breakEven;
  return every >= 1.5 ? `once every ${Math.round(every)} years` : null;
}

/** The answer's headline: the words printed largest, and spoken. */
export function coverHeadline(inp: CoverInputs, read: CoverRead): string {
  const ex = inp.mode === "excess";
  switch (read.kind) {
    case "never":
      return ex ? "Take the higher excess. The saving costs more than it saves." : "Carry it. The cover costs more than a claim would pay.";
    case "insure":
      return ex ? "Keep the lower excess. You couldn't pay the higher one." : "Insure it. This is the loss insurance is for.";
    case "check":
      return "Check what already covers it first.";
    case "threshold":
      return ex
        ? `The lower excess pays only if you claim more than ${claimEvery(read) ?? "once a year"}.`
        : `Worth it only if a claim is likelier than ${oneIn(read.breakEven)}.`;
    case "carry":
      return ex ? "Take the higher excess." : "Carry it yourself.";
    case "record":
      return ex ? "The lower excess is worth it on your record." : "Worth it on your record.";
    case "doubt":
      return ex ? "Probably take the higher excess. The feeling runs high." : "Probably not. The feeling runs high.";
    case "house":
      return ex ? "Take the higher excess. The insurer set the odds." : "Carry it. The seller set the odds.";
  }
}

/** True when the read ends with you carrying the risk yourself. */
export function carrying(read: CoverRead): boolean {
  return read.kind === "never" || read.kind === "carry" || read.kind === "doubt" || read.kind === "house";
}

/**
 * The standing rule: the reusable part of the answer. The buffer is what
 * makes the call, so most future offers at the till are a lookup.
 */
export function coverRule(inp: CoverInputs, read: CoverRead): string {
  const cur = coverCurrency(inp);
  const b = formatMoney(read.buffer, cur);
  return `My line for cover: I insure losses I couldn't pay from savings, anything over ${b}. Below that I carry the risk myself, and put what the cover would have cost into savings instead. I take the highest excess I could pay without borrowing.`;
}

/**
 * The cheapest excess that still keeps the worst case payable: worth naming
 * when you have to insure, because a higher excess is how the price comes down.
 */
export function excessTip(inp: CoverInputs, read: CoverRead): string | null {
  if (read.kind !== "insure" || inp.mode !== "cover") return null;
  const cur = coverCurrency(inp);
  const ex = parseMoney(inp.excess) ?? 0;
  if (read.buffer <= ex) return null;
  return `To bring the price down, ask for the highest excess you could pay from savings, up to ${formatMoney(read.buffer, cur)}. That's the part you can carry, and it's usually the cheapest thing to stop insuring.`;
}

/** The thing, for mid-sentence use, with a fallback that's never blank. */
export function coverName(inp: CoverInputs): string {
  const s = inp.what.trim().replace(/[.!?\s]+$/, "");
  if (!s) return "this";
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/** The plain-text record, for notes or a message to yourself. */
export function coverSummary(inp: CoverInputs, read: CoverRead): string {
  const cur = coverCurrency(inp);
  const lines: string[] = [];
  if (inp.what.trim()) lines.push(inp.what.trim());
  lines.push(breakEvenSentence(inp, read));
  lines.push(
    `Without it, the worst I'd pay is ${formatMoney(read.hit, cur)}. I could pay up to ${formatMoney(read.buffer, cur)} from savings.`,
  );
  lines.push("");
  lines.push(coverHeadline(inp, read));
  lines.push("");
  lines.push(coverRule(inp, read));
  return lines.join("\n");
}

const MODES: CoverMode[] = ["cover", "excess"];
const PERS: CoverPer[] = ["once", "month", "year"];
const COVEREDS: Covered[] = ["yes", "unsure", "no"];
const ODDS: Odds[] = ["less", "record", "feeling", "unknown"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseCoverInputs(raw: unknown): CoverInputs {
  if (!raw || typeof raw !== "object") return BLANK_COVER;
  const v = raw as Record<string, unknown>;
  const str = (k: keyof CoverInputs) => (typeof v[k] === "string" ? (v[k] as string) : "");
  return {
    what: str("what"),
    mode: oneOf(v.mode, MODES),
    price: str("price"),
    pricePer: oneOf(v.pricePer, PERS) || "once",
    years: str("years"),
    loss: str("loss"),
    excess: str("excess"),
    buffer: str("buffer"),
    covered: oneOf(v.covered, COVEREDS),
    odds: oneOf(v.odds, ODDS),
    worry: v.worry === true,
  };
}

/**
 * The worked example: a three-year extended warranty on a £600 TV, offered
 * at the till for £99. It breaks even only if the TV is likelier than about
 * 1 in 6 to fail in those years, and it felt that likely, which is exactly
 * the overestimate Abito and Salant measured.
 */
export const COVER_EXAMPLE: CoverInputs = {
  what: "Three-year extended warranty on the new TV",
  mode: "cover",
  price: "£99",
  pricePer: "once",
  years: "3",
  loss: "£600",
  excess: "",
  buffer: "£1,000",
  covered: "unsure",
  odds: "feeling",
  worry: false,
};
