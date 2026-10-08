/**
 * The read behind "Neither One Wins" (/par).
 *
 * Ruth Chang's account of hard choices: the options are comparable, but
 * neither is better and they aren't equally good either. They're *on a par*.
 * The test that tells a par from a tie is her small-improvement test. Make one
 * option a little better. If two options are truly equal, any small gain tips
 * it. If they're on a par, a small gain doesn't, because they differ in kind
 * and no amount of the same thing settles a difference in kind.
 *
 * The read has four outcomes, checked in order:
 *   1. "clear"   — one option is better overall. It's painful, not hard.
 *   2. "fact"    — something you could find out would settle it. That's
 *                  ignorance, not parity, so go and find it out.
 *   3. "tie" / "edge" — a small improvement tips it, so they were (nearly)
 *                  equal. Flip a coin, or take the one with the edge.
 *   4. "par"     — nothing small tips it. More weighing won't settle it, and
 *                  the call is yours to make by committing.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

export type Side = "a" | "b";
/** Weighed overall, is one of them better? */
export type Overall = "" | Side | "neither";
/** Could a fact you could find out settle it? */
export type Fact = "" | "yes" | "no";
/** After a small improvement, does the improved option now win? */
export type Sweet = "" | "tips" | "still";
/** If you never decide, which one happens anyway? */
export type Drift = "" | Side | "none";

export type ParInputs = {
  decision: string;
  aName: string;
  aBest: string;
  bName: string;
  bBest: string;
  overall: Overall;
  fact: Fact;
  factText: string;
  sweetA: Sweet;
  sweetB: Sweet;
  selfA: string;
  selfB: string;
  drift: Drift;
  choice: "" | Side;
};

export const BLANK_PAR: ParInputs = {
  decision: "",
  aName: "",
  aBest: "",
  bName: "",
  bBest: "",
  overall: "",
  fact: "",
  factText: "",
  sweetA: "",
  sweetB: "",
  selfA: "",
  selfB: "",
  drift: "",
  choice: "",
};

export type ParKind = "clear" | "fact" | "tie" | "edge" | "par";

export type ParRead = {
  kind: ParKind;
  /** The better option, for "clear" and "edge". */
  side?: Side;
};

/**
 * The read so far, or null while the questions that decide it are unanswered.
 * Later answers are ignored once an earlier one has settled the kind, so
 * changing "is one better?" back and forth can't leave a stale par behind.
 */
export function readPar(inp: ParInputs): ParRead | null {
  if (inp.overall === "a" || inp.overall === "b") {
    return { kind: "clear", side: inp.overall };
  }
  if (inp.overall !== "neither") return null;
  if (inp.fact === "yes") return { kind: "fact" };
  if (inp.fact !== "no") return null;
  if (!inp.sweetA || !inp.sweetB) return null;
  const aTips = inp.sweetA === "tips";
  const bTips = inp.sweetB === "tips";
  if (aTips && bTips) return { kind: "tie" };
  // A small gain to A settles it, but a small gain to B doesn't: A was already
  // at least as good as B, so A has the edge (and the mirror case for B).
  if (aTips) return { kind: "edge", side: "a" };
  if (bTips) return { kind: "edge", side: "b" };
  return { kind: "par" };
}

/** A name for an option that's never blank. */
export function sideName(inp: ParInputs, side: Side): string {
  const n = (side === "a" ? inp.aName : inp.bName).trim();
  return n || (side === "a" ? "Option A" : "Option B");
}

export function other(side: Side): Side {
  return side === "a" ? "b" : "a";
}

/** The answer's headline: the words printed largest, and spoken. */
export function parHeadline(inp: ParInputs, read: ParRead): string {
  switch (read.kind) {
    case "clear":
      return `Not a hard choice — a painful one. ${sideName(inp, read.side!)} is better.`;
    case "fact":
      return "Not on a par yet — you're missing a fact.";
    case "tie":
      return "A true tie. Flip a coin.";
    case "edge":
      return `Close, but ${midName(inp, read.side!)} has the edge.`;
    case "par":
      return "On a par. This one is yours to make.";
  }
}

/**
 * Finish "…someone who" cleanly whether or not the person typed those words
 * themselves, and drop a trailing full stop so it can sit mid-sentence.
 */
export function selfClause(raw: string): string {
  let s = raw.trim().replace(/[.!\s]+$/, "");
  s = s.replace(/^(i'?m|i am)\s+/i, "");
  s = s.replace(/^(the kind of )?(person|someone) who\s+/i, "");
  // "Puts family first" reads as "someone who puts family first". Leave "I"
  // and all-caps words (an acronym) alone.
  return lowerLead(s);
}

/** Lower a leading capital for mid-sentence use, unless it looks like "I" or an acronym. */
export function lowerLead(raw: string): string {
  const s = raw.trim();
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

/**
 * An option's name for the middle of a sentence: "I'm choosing the Edinburgh
 * job", not "The Edinburgh job". Only a leading article is lowered, since
 * anything else may be a proper noun.
 */
export function midName(inp: ParInputs, side: Side): string {
  return sideName(inp, side).replace(/^(The|A|An)\s/, (m) => m.toLowerCase());
}

/**
 * The commitment, as a sentence the person can keep. Only for a par with a
 * choice made. The second sentence is the point of Chang's view: the option
 * not chosen wasn't worse, so choosing it isn't a mistake of fact.
 */
export function commitmentText(inp: ParInputs): string | null {
  if (!inp.choice) return null;
  const chosen = midName(inp, inp.choice);
  const notChosen = sideName(inp, other(inp.choice));
  const self = selfClause(inp.choice === "a" ? inp.selfA : inp.selfB);
  const who = self ? ` I'm someone who ${self}.` : "";
  return `I'm choosing ${chosen}.${who} ${notChosen} wasn't worse. I chose which one to stand behind.`;
}

/**
 * The plain-text record: what was weighed, the read, and the commitment. For
 * pasting into notes or a message to the person you're deciding near.
 */
export function parSummary(inp: ParInputs, read: ParRead): string {
  const lines: string[] = [];
  if (inp.decision.trim()) lines.push(inp.decision.trim());
  const best = (side: Side) => (side === "a" ? inp.aBest : inp.bBest).trim();
  for (const side of ["a", "b"] as Side[]) {
    const b = best(side);
    lines.push(`${sideName(inp, side)}${b ? ` — what only it gives: ${b}` : ""}`);
  }
  lines.push("");
  lines.push(parHeadline(inp, read));
  if (read.kind === "par") {
    const c = commitmentText(inp);
    if (c) lines.push(c);
  }
  return lines.join("\n");
}

function isSide(v: unknown): v is Side {
  return v === "a" || v === "b";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseParInputs(raw: unknown): ParInputs {
  if (!raw || typeof raw !== "object") return BLANK_PAR;
  const v = raw as Record<string, unknown>;
  const str = (k: keyof ParInputs) => (typeof v[k] === "string" ? (v[k] as string) : "");
  return {
    decision: str("decision"),
    aName: str("aName"),
    aBest: str("aBest"),
    bName: str("bName"),
    bBest: str("bBest"),
    overall: isSide(v.overall) || v.overall === "neither" ? (v.overall as Overall) : "",
    fact: v.fact === "yes" || v.fact === "no" ? v.fact : "",
    factText: str("factText"),
    sweetA: v.sweetA === "tips" || v.sweetA === "still" ? v.sweetA : "",
    sweetB: v.sweetB === "tips" || v.sweetB === "still" ? v.sweetB : "",
    selfA: str("selfA"),
    selfB: str("selfB"),
    drift: isSide(v.drift) || v.drift === "none" ? (v.drift as Drift) : "",
    choice: isSide(v.choice) ? v.choice : "",
  };
}

/**
 * The worked example: a research job in another city against staying near
 * family. Neither small sweetener tips it, so it's a par, and the person
 * commits to staying.
 */
export const PAR_EXAMPLE: ParInputs = {
  decision: "Take the job in Edinburgh, or stay in Bristol",
  aName: "Edinburgh",
  aBest: "The research I trained six years for, with the best group in the field",
  bName: "Bristol",
  bBest: "Ten minutes from my sister and her kids, every week of their childhood",
  overall: "neither",
  fact: "no",
  factText: "",
  sweetA: "still",
  sweetB: "still",
  selfA: "does the work while the door is open",
  selfB: "is there for the people I love, day to day",
  drift: "b",
  choice: "b",
};
