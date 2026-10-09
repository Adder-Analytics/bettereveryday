/**
 * The arithmetic and the read behind "Where's Your Line?" (/walkaway).
 *
 * Most people walk into a negotiation (a job offer, a raise, a car, a house,
 * a freelance rate) with a hope and a vague sense of "too low". The line
 * between a deal worth taking and one worth refusing then gets drawn in the
 * room, by the other side's first number and by the discomfort of saying no.
 * Tuncel, Mislin, Kesebir and Pinkley (Psychological Science, 2016) found that
 * people take deals worse than their own alternative just to avoid an
 * impasse, and that the aversion to impasse pulls harder than the attraction
 * of agreement.
 *
 * The fix is old and procedural. Fisher and Ury (*Getting to Yes*, 1981): know
 * your best alternative to a negotiated agreement (BATNA), which is a course
 * of action, not a number. Malhotra and Bazerman (*Negotiation Genius*, 2007):
 * turn it into a reservation value, the worst number you'd still accept,
 * adjusted for what this deal offers beyond the number. Set an ambitious
 * target as well, because the target is what you'll aim at in the room.
 * And if you can, estimate how far the other side can go, because when their
 * limit is short of your line there's no deal to find.
 *
 * Direction matters everywhere. "up" means you want the number high (you're
 * being paid or selling). "down" means you want it low (you're paying).
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { formatNumber, parseNumber } from "./round";

export { parseNumber };

export type Direction = "" | "up" | "down";
/** How real is the alternative? */
export type Firm = "" | "inhand" | "likely" | "hope";
/** Apart from the number, is this deal better or worse than the alternative? */
export type Extra = "" | "better" | "same" | "worse";
/** Who knows more about what this is really worth? */
export type Knows = "" | "me" | "even" | "them";

export type WalkInputs = {
  deal: string;
  direction: Direction;
  unit: string;
  alt: string;
  altValue: string;
  firm: Firm;
  extra: Extra;
  extraValue: string;
  target: string;
  targetWhy: string;
  theirLimit: string;
  knows: Knows;
  theirOffer: string;
  live: string;
};

export const BLANK_WALK: WalkInputs = {
  deal: "",
  direction: "",
  unit: "",
  alt: "",
  altValue: "",
  firm: "",
  extra: "",
  extraValue: "",
  target: "",
  targetWhy: "",
  theirLimit: "",
  knows: "",
  theirOffer: "",
  live: "",
};

/**
 * Show a number with its unit. A lone currency symbol goes in front ("£58,000");
 * anything else follows ("45 an hour", "8 weeks").
 */
export function fmt(n: number, unit: string): string {
  const u = unit.trim();
  const sign = n < 0 ? "-" : "";
  const body = formatNumber(Math.abs(n));
  if (!u) return `${sign}${body}`;
  if (/^[$€£¥₹]$/.test(u)) return `${sign}${u}${body}`;
  return `${sign}${body} ${u}`;
}

/**
 * The walk-away (reservation) point, or null until there's enough to compute
 * it. Start from what the alternative is worth, then move it by what this deal
 * offers beyond the number. If this deal is better in other ways, you'd accept
 * a little less when being paid (or pay a little more when paying) to get it.
 */
export function walkAwayPoint(inp: WalkInputs): number | null {
  if (!inp.direction) return null;
  const alt = parseNumber(inp.altValue);
  if (alt === null) return null;
  if (!inp.extra) return null;
  let premium = 0;
  if (inp.extra !== "same") {
    const p = parseNumber(inp.extraValue);
    if (p === null) return null;
    premium = Math.abs(p) * (inp.extra === "better" ? 1 : -1);
  }
  return inp.direction === "up" ? alt - premium : alt + premium;
}

/** True when `a` is a better number than `b` for this side of the table. */
export function beats(dir: Direction, a: number, b: number): boolean {
  return dir === "up" ? a > b : a < b;
}

export type WalkKind = "target-inside" | "hope" | "no-room" | "ready";

export type WalkRead = {
  kind: WalkKind;
  line: number;
  target: number;
  /** Their likely limit, when the person gave a guess. */
  theirs: number | null;
  /** Whether a guessed limit falls short of the line (no zone of agreement). */
  noRoom: boolean;
};

/**
 * The read, checked in order:
 *   1. "target-inside" — the target doesn't beat the walk-away, so there's
 *      nothing to aim at. Either the target is timid or the line is too high.
 *   2. "hope"          — the line is built on an alternative you don't have
 *      yet. Firm it up before you talk, or plan from what you do have.
 *   3. "no-room"       — their likely limit is short of your line. There may
 *      be no deal, and knowing that before the room is the point.
 *   4. "ready"         — a line, a target, room between them.
 */
export function readWalk(inp: WalkInputs): WalkRead | null {
  const line = walkAwayPoint(inp);
  if (line === null) return null;
  const target = parseNumber(inp.target);
  if (target === null) return null;
  if (!inp.firm) return null;
  const theirs = parseNumber(inp.theirLimit);
  const noRoom = theirs !== null && beats(inp.direction, line, theirs);
  const base = { line, target, theirs, noRoom };
  if (!beats(inp.direction, target, line)) return { kind: "target-inside", ...base };
  if (inp.firm === "hope") return { kind: "hope", ...base };
  if (noRoom) return { kind: "no-room", ...base };
  return { kind: "ready", ...base };
}

/** "below" or "above", for "no deal below £55,000". */
export function worseWord(dir: Direction): string {
  return dir === "down" ? "above" : "below";
}

/** The answer's headline: the words printed largest, and spoken. */
export function walkHeadline(inp: WalkInputs, read: WalkRead): string {
  const u = inp.unit;
  switch (read.kind) {
    case "target-inside":
      return inp.direction === "down"
        ? "Your target is no better than your walk-away. Aim lower."
        : "Your target is no better than your walk-away. Aim higher.";
    case "hope":
      return "Your walk-away rests on a hope. Firm it up before you talk.";
    case "no-room":
      return `There may be no deal here. Your line is ${fmt(read.line, u)}; they likely can't reach it.`;
    case "ready":
      return `Your line: no deal ${worseWord(inp.direction)} ${fmt(read.line, u)}. Aim for ${fmt(read.target, u)}.`;
  }
}

/**
 * A precise version of a number: three significant figures, so 92,437 reads
 * 92,400 and 1,234 reads 1,230. Mason, Lee, Wiley and Ames (JESP, 2013) found
 * that precise first offers drew smaller counteroffers than round ones,
 * because a precise number reads as homework. Three figures keeps it precise
 * without looking computed to the penny.
 */
export function precise(n: number): number {
  if (n === 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(n))) - 2);
  return Math.round(n / mag) * mag;
}

export type Opening =
  | { kind: "they-named"; offer: number; vs: "below-line" | "in-zone" | "past-target" }
  | { kind: "let-them"; }
  | { kind: "go-first"; point: number; rangeLow: number; rangeHigh: number };

/**
 * Who should put the first number down, and what it should be.
 *
 * - If they've already named one, the job is to stop it working as an anchor:
 *   say where it sits against your line and target.
 * - If they know more about what this is worth, going first mostly advertises
 *   what you don't know (Galinsky's caveat): let them open, then re-anchor.
 * - Otherwise go first, a little past the target, as a precise number or as a
 *   range that starts at the target and runs further (Ames and Mason's
 *   "bolstering" range, which in their studies won better deals than a single
 *   number without costing goodwill).
 */
export function opening(inp: WalkInputs, read: WalkRead): Opening | null {
  const dir = inp.direction;
  const offer = parseNumber(inp.theirOffer);
  if (offer !== null) {
    const vs = beats(dir, read.line, offer)
      ? "below-line"
      : beats(dir, read.target, offer)
        ? "in-zone"
        : "past-target";
    return { kind: "they-named", offer, vs };
  }
  if (!inp.knows) return null;
  if (inp.knows === "them") return { kind: "let-them" };
  const stretch = dir === "up" ? 1.1 : 0.9;
  const nudge = dir === "up" ? 1.05 : 0.95;
  const far = precise(read.target * stretch);
  return {
    kind: "go-first",
    point: precise(read.target * nudge),
    rangeLow: dir === "up" ? read.target : far,
    rangeHigh: dir === "up" ? far : read.target,
  };
}

export type LiveKind = "below-line" | "in-zone" | "at-target";

/**
 * The in-the-room check: a number is on the table right now. Where is it?
 * Exactly at the line counts as acceptable, since the line is the worst
 * number you said you'd still take.
 */
export function liveRead(inp: WalkInputs, read: WalkRead): { kind: LiveKind; offer: number } | null {
  const offer = parseNumber(inp.live);
  if (offer === null) return null;
  const dir = inp.direction;
  if (beats(dir, read.line, offer)) return { kind: "below-line", offer };
  if (beats(dir, read.target, offer)) return { kind: "in-zone", offer };
  return { kind: "at-target", offer };
}

export function liveHeadline(inp: WalkInputs, read: WalkRead, live: { kind: LiveKind; offer: number }): string {
  const u = inp.unit;
  switch (live.kind) {
    case "below-line":
      return `${fmt(live.offer, u)} is past your line. This one is a no.`;
    case "in-zone":
      return `${fmt(live.offer, u)} clears your line, ${fmt(Math.abs(read.target - live.offer), u)} from your target.`;
    case "at-target":
      return `${fmt(live.offer, u)} meets your target.`;
  }
}

/** The alternative, phrased to finish "…I'll". */
export function altClause(raw: string): string {
  let s = raw.trim().replace(/[.!\s]+$/, "");
  s = s.replace(/^(i'?ll|i will|i'?d|i would)\s+/i, "");
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/**
 * The line card as plain text: what you'd say and do, in your own words, for
 * a note on your phone or a sticky note under the laptop.
 */
export function walkSummary(inp: WalkInputs, read: WalkRead): string {
  const u = inp.unit;
  const lines: string[] = [];
  if (inp.deal.trim()) lines.push(inp.deal.trim());
  lines.push("");
  const alt = altClause(inp.alt);
  lines.push(
    `My walk-away: ${fmt(read.line, u)}. ${inp.direction === "down" ? "Above" : "Below"} that, I say "I can't make that work"${alt ? ` and I ${alt}` : ""}.`,
  );
  const why = inp.targetWhy.trim().replace(/[.\s]+$/, "");
  lines.push(`My target: ${fmt(read.target, u)}${why ? ` (${why})` : ""}.`);
  const op = opening(inp, read);
  if (op?.kind === "go-first") {
    lines.push(`I open first: ${fmt(op.point, u)}, or ${fmt(op.rangeLow, u)} to ${fmt(op.rangeHigh, u)}, with my reason.`);
  } else if (op?.kind === "let-them") {
    lines.push("I let them name the first number, then restate my target and why.");
  } else if (op?.kind === "they-named") {
    lines.push(`They opened at ${fmt(op.offer, u)}. I counter from my target, not from their number.`);
  }
  lines.push("If I feel the pull to move my line in the room: did I learn something about my alternative, or do I just want this to be over? Only the first is a reason.");
  return lines.join("\n");
}

function pick<T extends string>(v: unknown, allowed: readonly T[]): T | "" {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseWalkInputs(raw: unknown): WalkInputs {
  if (!raw || typeof raw !== "object") return BLANK_WALK;
  const v = raw as Record<string, unknown>;
  const str = (k: keyof WalkInputs) => (typeof v[k] === "string" ? (v[k] as string) : "");
  return {
    deal: str("deal"),
    direction: pick(v.direction, ["up", "down"] as const),
    unit: str("unit"),
    alt: str("alt"),
    altValue: str("altValue"),
    firm: pick(v.firm, ["inhand", "likely", "hope"] as const),
    extra: pick(v.extra, ["better", "same", "worse"] as const),
    extraValue: str("extraValue"),
    target: str("target"),
    targetWhy: str("targetWhy"),
    theirLimit: str("theirLimit"),
    knows: pick(v.knows, ["me", "even", "them"] as const),
    theirOffer: str("theirOffer"),
    live: str("live"),
  };
}

/**
 * The worked example, told in the first person: an offer from another
 * company. Staying put at £58,000 is the alternative, and it's in hand. The
 * new job is better in ways worth about £3,000 a year, so the line is
 * £55,000. Salary surveys put the role at £68,000. They opened at £60,000.
 */
export const WALK_EXAMPLE: WalkInputs = {
  deal: "Salary for the senior designer offer at Northwind",
  direction: "up",
  unit: "£",
  alt: "Stay in my current job at £58,000",
  altValue: "58,000",
  firm: "inhand",
  extra: "better",
  extraValue: "3,000",
  target: "68,000",
  targetWhy: "the middle of three salary surveys for this role in this city",
  theirLimit: "72,000",
  knows: "even",
  theirOffer: "60,000",
  live: "",
};
