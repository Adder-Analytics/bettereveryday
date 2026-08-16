"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  readCarriedSubject,
  readCarriedOptionList,
  readCarriedFrom,
  clearCarriedSubject,
  withSubject,
  withOptions,
  CARRY_SOURCES,
  type CarrySource,
} from "../data/carry";
import { encodeShare, readShare, clearShare, SHARE_PARAM } from "../data/share";
import CarriedNote from "../components/CarriedNote";
import PrintButton from "../components/PrintButton";
import Link from "next/link";
import {
  appendDecisionEntry,
  CONFIDENCE_OPTIONS,
  todayISO,
  addDaysISO,
  REVIEW_DEFAULT_DAYS,
} from "../data/decisionLog";

/**
 * The halo comes off (/compare).
 *
 * Every other instrument here works a *binary* call — act or don't (the flip
 * point), decide now or once you're cool, this effect or the next one. But the
 * most common real decision isn't act-or-don't; it's *which of these*: two jobs,
 * three apartments, a shortlist of offers. The trap in that shape is specific
 * and well-documented — the halo effect (Nisbett & Wilson, 1977): one strong
 * impression of an option quietly colours how you rate everything else about it,
 * so the choice is really made in the first ten seconds and the "comparison" is
 * a rationalisation.
 *
 * The fix is structural, not willpower — awareness of the halo doesn't dissolve
 * it. This tool runs Kahneman, Sibony & Sunstein's Mediating Assessments
 * Protocol (Noise, 2021): break the choice into a few factors that matter, score
 * every option one factor at a time (so you compare on a single dimension before
 * any overall impression can form), and — the discipline that does the work —
 * keep the holistic gut call *separate and last*. The tally stays hidden until
 * you've named which option your gut wants, so you can't watch a running score
 * anchor you as you go.
 *
 * The output that matters isn't the winning number. It's the gap between what
 * the factors say and what your gut wanted: when they disagree, either you're
 * weighting a factor more than you admitted, or there's one you never wrote
 * down — and that gap is the most useful thing on the page.
 *
 * Nothing is sent anywhere. Inputs persist in your browser; a choice you commit
 * to can be logged to the journal as a tracked forecast through the same shared
 * appender the flip point and the pre-mortem room use.
 */

const STORE_KEY = "compare:v1";

type Weight = 1 | 2 | 3;

type Option = { id: string; label: string };
type Factor = { id: string; label: string; weight: Weight };
/** scores[factorId][optionId] = 1..5; 0 or missing = not yet scored. */
type Scores = Record<string, Record<string, number>>;

type State = {
  decision: string;
  options: Option[];
  factors: Factor[];
  scores: Scores;
  /** optionId your gut wants, chosen before the tally is revealed. "" = unset. */
  gut: string;
};

const WEIGHT_LABEL: Record<Weight, string> = {
  1: "Minor",
  2: "Normal",
  3: "Major",
};

/**
 * The blank the tool opens on: an empty decision, two unnamed option slots, and
 * two unnamed factor slots — enough scaffolding to show the shape, nothing
 * pre-decided. The illustrative scenario lives in EXAMPLE, shown read-only
 * behind a toggle and never written to the live fields or to storage.
 */
const BLANK: State = {
  decision: "",
  options: [
    { id: "o1", label: "" },
    { id: "o2", label: "" },
  ],
  factors: [
    { id: "f1", label: "", weight: 2 },
    { id: "f2", label: "", weight: 2 },
  ],
  scores: {},
  gut: "",
};

const EXAMPLE: State = {
  decision: "Which job offer to take",
  options: [
    { id: "o1", label: "The startup" },
    { id: "o2", label: "The big company" },
    { id: "o3", label: "Stay put" },
  ],
  factors: [
    { id: "f1", label: "Pay & security", weight: 2 },
    { id: "f2", label: "How much I'd grow", weight: 3 },
    { id: "f3", label: "The people I'd work with", weight: 3 },
    { id: "f4", label: "Commute & flexibility", weight: 1 },
  ],
  scores: {
    f1: { o1: 2, o2: 5, o3: 3 },
    f2: { o1: 5, o2: 3, o3: 1 },
    f3: { o1: 4, o2: 3, o3: 4 },
    f4: { o1: 3, o2: 2, o3: 5 },
  },
  gut: "o2",
};

// ---- persistence ---------------------------------------------------------

function isWeight(n: unknown): n is Weight {
  return n === 1 || n === 2 || n === 3;
}

function cleanOptions(raw: unknown): Option[] {
  if (!Array.isArray(raw)) return BLANK.options.map((o) => ({ ...o }));
  const out: Option[] = [];
  for (const o of raw) {
    if (o && typeof o === "object") {
      const id = (o as { id?: unknown }).id;
      const label = (o as { label?: unknown }).label;
      if (typeof id === "string") {
        out.push({ id, label: typeof label === "string" ? label : "" });
      }
    }
  }
  return out.length >= 2 ? out.slice(0, 6) : BLANK.options.map((o) => ({ ...o }));
}

function cleanFactors(raw: unknown): Factor[] {
  if (!Array.isArray(raw)) return BLANK.factors.map((f) => ({ ...f }));
  const out: Factor[] = [];
  for (const f of raw) {
    if (f && typeof f === "object") {
      const id = (f as { id?: unknown }).id;
      const label = (f as { label?: unknown }).label;
      const weight = (f as { weight?: unknown }).weight;
      if (typeof id === "string") {
        out.push({
          id,
          label: typeof label === "string" ? label : "",
          weight: isWeight(weight) ? weight : 2,
        });
      }
    }
  }
  return out.length >= 1 ? out.slice(0, 6) : BLANK.factors.map((f) => ({ ...f }));
}

function cleanScores(raw: unknown): Scores {
  if (!raw || typeof raw !== "object") return {};
  const out: Scores = {};
  for (const [fid, row] of Object.entries(raw as Record<string, unknown>)) {
    if (row && typeof row === "object") {
      const cleanRow: Record<string, number> = {};
      for (const [oid, v] of Object.entries(row as Record<string, unknown>)) {
        if (typeof v === "number" && v >= 1 && v <= 5) {
          cleanRow[oid] = Math.round(v);
        }
      }
      out[fid] = cleanRow;
    }
  }
  return out;
}

function loadState(): State {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<State>;
    const options = cleanOptions(v.options);
    const factors = cleanFactors(v.factors);
    const optionIds = new Set(options.map((o) => o.id));
    return {
      decision: typeof v.decision === "string" ? v.decision : "",
      options,
      factors,
      scores: cleanScores(v.scores),
      gut: typeof v.gut === "string" && optionIds.has(v.gut) ? v.gut : "",
    };
  } catch {
    return BLANK;
  }
}

// ---- handing the comparison to another person ----------------------------
//
// The halo-off comparison is, of every instrument here, the one people are most
// likely to work *with* someone else: two job offers, three apartments, a
// shortlist you and a partner keep reshuffling. Peer-sharing (see data/share.ts)
// lets you hand the whole scored comparison to that person by link — the
// options, the factors, and how you scored them — so they open exactly what you
// weighed and can change the numbers to argue back. The payload rides in the URL
// *fragment*, never the query string, so it reaches no server, only whoever you
// send the link to.
//
// One deliberate omission: the gut is NOT shared. This tool's whole discipline
// is that the tally stays hidden until *you* name which option your gut wants —
// so adopting the sender's gut would hand the recipient a revealed answer and
// spend the one thing the tool exists to protect. The recipient adopts the
// scored structure and forms their *own* gut read, which is exactly the
// productive disagreement (their gut vs. your factors) worth sharing for.

/** Collapse whitespace and cap a shared string, so a link stays a link. Mirrors
 *  the normalization the through-line and the flip point's share both apply. */
function capStr(s: string, n = 120): string {
  return s.replace(/\s+/g, " ").trim().slice(0, n);
}

/** A fresh blank state — cloned so a reset can never mutate the shared BLANK. */
function blankState(): State {
  return {
    decision: "",
    options: BLANK.options.map((o) => ({ ...o })),
    factors: BLANK.factors.map((f) => ({ ...f })),
    scores: {},
    gut: "",
  };
}

/** True when the tool holds no real work — nothing named, nothing scored. A
 *  share link adopts a whole comparison ONLY into a blank tool, so this is the
 *  gate that protects a comparison in progress. Array length is ignored: the
 *  blank opens with two empty option slots and two empty factor slots. */
function isBlankState(s: State): boolean {
  return (
    !s.decision.trim() &&
    s.options.every((o) => !o.label.trim()) &&
    s.factors.every((f) => !f.label.trim()) &&
    Object.keys(s.scores).length === 0 &&
    !s.gut
  );
}

/** The encodable subset of a comparison: the structure and the scores, with
 *  labels capped so a link stays a link — but never the gut (see the note
 *  above). */
function sharePayload(s: State): Record<string, unknown> {
  return {
    decision: capStr(s.decision),
    options: s.options.map((o) => ({ id: o.id, label: capStr(o.label) })),
    factors: s.factors.map((f) => ({
      id: f.id,
      label: capStr(f.label),
      weight: f.weight,
    })),
    scores: s.scores,
  };
}

/** Rebuild a full State from a decoded share payload, reusing the same
 *  field-by-field cleaners loadState trusts for localStorage, so a truncated or
 *  hand-edited link degrades to blank fields, never a throw. The gut is always
 *  reset — the recipient names their own. Returns null when nothing meaningful
 *  decoded, so a blank payload can't seed a blank tool. */
function coerceSharedCompare(data: unknown): State | null {
  if (!data || typeof data !== "object") return null;
  const v = data as Partial<State>;
  const options = cleanOptions(
    Array.isArray(v.options)
      ? v.options.map((o) =>
          o && typeof o === "object"
            ? { ...o, label: capStr(String((o as { label?: unknown }).label ?? "")) }
            : o
        )
      : v.options
  );
  const factors = cleanFactors(
    Array.isArray(v.factors)
      ? v.factors.map((f) =>
          f && typeof f === "object"
            ? { ...f, label: capStr(String((f as { label?: unknown }).label ?? "")) }
            : f
        )
      : v.factors
  );
  const out: State = {
    decision: typeof v.decision === "string" ? capStr(v.decision) : "",
    options,
    factors,
    scores: cleanScores(v.scores),
    gut: "",
  };
  return isBlankState(out) ? null : out;
}

/** A short, honest read of a shared comparison for the "someone shared this"
 *  card: its subject and one line naming the shape — deliberately NOT the
 *  winner, so the pending preview can't pre-reveal the tally the gut gate
 *  protects. */
function describeSharedCompare(s: State): { subject: string; line: string } {
  const subject = s.decision.trim() || "A comparison";
  const opts = s.options.filter((o) => o.label.trim()).length;
  const facs = s.factors.filter((f) => f.label.trim()).length;
  const line =
    opts >= 2 && facs >= 1
      ? `${opts} options weighed on ${facs} factor${facs === 1 ? "" : "s"}`
      : "";
  return { subject, line };
}

// ---- id + label helpers --------------------------------------------------

let idCounter = 0;
function freshId(prefix: string): string {
  idCounter += 1;
  return `${prefix}${Date.now().toString(36)}${idCounter}`;
}

function formatHuman(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function optionName(o: Option, i: number): string {
  return o.label.trim() || `Option ${i + 1}`;
}

function factorName(f: Factor, i: number): string {
  return f.label.trim() || `Factor ${i + 1}`;
}

// ---- the core computation ------------------------------------------------

type Computed = {
  /** Factors every option has been scored on — only these count. */
  activeFactors: Factor[];
  /** optionId -> weighted total over active factors. */
  totals: Record<string, number>;
  /** Highest possible total on the active factors (5 x sum of weights). */
  maxTotal: number;
  /** Options sorted best-first by total. */
  ranked: Option[];
  /** Gap between the top two totals. */
  margin: number;
  /** Below this the top two are inside the noise of a rough 1–5 rating. */
  closeBand: number;
  tooClose: boolean;
  /** For each active factor, the option(s) that lead it. */
  leaders: Record<string, string[]>;
  /**
   * The single factor the winner is riding on: drop it and the winner changes.
   * null when no single factor is pivotal (a robust lead).
   */
  hingeFactorId: string | null;
};

function topByTotals(
  options: Option[],
  factors: Factor[],
  scores: Scores
): { id: string; total: number }[] {
  return options
    .map((o) => {
      let total = 0;
      for (const f of factors) {
        total += f.weight * (scores[f.id]?.[o.id] ?? 0);
      }
      return { id: o.id, total };
    })
    .sort((a, b) => b.total - a.total);
}

function compute(state: State): Computed | null {
  const labelled = state.options.filter((o) => o.label.trim().length > 0);
  if (labelled.length < 2) return null;

  const activeFactors = state.factors.filter(
    (f) =>
      f.label.trim().length > 0 &&
      labelled.every((o) => (state.scores[f.id]?.[o.id] ?? 0) >= 1)
  );
  if (activeFactors.length < 1) return null;

  const ordered = topByTotals(labelled, activeFactors, state.scores);
  const totals: Record<string, number> = {};
  for (const r of ordered) totals[r.id] = r.total;

  const byId = new Map(labelled.map((o) => [o.id, o]));
  const ranked = ordered.map((r) => byId.get(r.id)!);

  const maxTotal = 5 * activeFactors.reduce((s, f) => s + f.weight, 0);
  const margin = ordered.length >= 2 ? ordered[0].total - ordered[1].total : ordered[0].total;
  const closeBand = maxTotal * 0.08;
  const tooClose = ordered.length >= 2 && margin < closeBand;

  const leaders: Record<string, string[]> = {};
  for (const f of activeFactors) {
    let best = -1;
    let winners: string[] = [];
    for (const o of labelled) {
      const s = state.scores[f.id]?.[o.id] ?? 0;
      if (s > best) {
        best = s;
        winners = [o.id];
      } else if (s === best) {
        winners.push(o.id);
      }
    }
    leaders[f.id] = winners;
  }

  // Sensitivity: is the winner riding on a single factor? Drop each active
  // factor in turn; if removing one changes who's on top, the choice hinges on
  // it. Only meaningful with 2+ factors.
  let hingeFactorId: string | null = null;
  if (activeFactors.length >= 2) {
    const winnerId = ordered[0].id;
    for (const f of activeFactors) {
      const without = activeFactors.filter((x) => x.id !== f.id);
      const re = topByTotals(labelled, without, state.scores);
      if (re[0].id !== winnerId) {
        hingeFactorId = f.id;
        break;
      }
    }
  }

  return {
    activeFactors,
    totals,
    maxTotal,
    ranked,
    margin,
    closeBand,
    tooClose,
    leaders,
    hingeFactorId,
  };
}

// ---- shared styles -------------------------------------------------------

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";

const SCALE = [1, 2, 3, 4, 5];

// ==========================================================================

export default function CompareClient() {
  const [state, setState] = useState<State>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  // When a handoff named where it came from (the frame-widener hands a whole
  // slate over), the carried-over cue names that source instead of the generic
  // "your last step."
  const [carriedFrom, setCarriedFrom] = useState<CarrySource | "">("");
  // True when the options were seeded from a carried slate, so the cue's clear
  // action knows to empty the option labels too, not just the subject.
  const [seededOptions, setSeededOptions] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [conf, setConf] = useState<number>(70);
  const [logged, setLogged] = useState<null | { conf: number; reviewOn: string; label: string }>(
    null
  );
  // A comparison handed in by a share link. `adoptedShare` — it was adopted
  // whole into a blank tool (banner). `pendingShare` — the tool already held a
  // comparison, so the shared one waits in a card the person can open (replacing
  // their draft) or dismiss. `copied` — the transient confirmation on the "copy
  // a link" affordance.
  const [adoptedShare, setAdoptedShare] = useState(false);
  const [pendingShare, setPendingShare] = useState<State | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loaded = loadState();
    // Carry the decision in from another tool's handoff, but never over saved
    // work: pre-fill the subject only when this tool's own field is still blank.
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.decision.trim();
    let next = seeded ? { ...loaded, decision: carried } : loaded;

    // A handoff can also carry a whole *slate* of option labels — the
    // frame-widener turning a one-option frame into three or four real
    // alternatives. Seed them only into blank option slots, the same
    // never-clobber rule the subject seed follows, so an incoming link can't
    // overwrite a comparison already in progress.
    const carriedOptions = readCarriedOptionList();
    const optionsBlank = next.options.every((o) => !o.label.trim());
    const seedOpts = carriedOptions.length >= 2 && optionsBlank;
    if (seedOpts) {
      next = {
        ...next,
        options: carriedOptions.map((label, i) => ({ id: `oc${i + 1}`, label })),
      };
    }
    const from = readCarriedFrom();

    // A share link hands a WHOLE comparison in from another person. It's
    // all-or-nothing, never field-by-field: adopting the entire scored structure
    // only into a blank tool keeps two people's numbers from blending into a
    // nonsense hybrid. If this tool already holds work, don't touch it — surface
    // the shared comparison as a card the person can open or dismiss.
    const shared = coerceSharedCompare(readShare("compare"));
    let adopted = false;
    let pending: State | null = null;
    if (shared) {
      if (isBlankState(next)) {
        next = shared;
        adopted = true;
      } else {
        pending = shared;
      }
    }
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setState(next);
    setHydrated(true);
    if (seeded) setCarriedSeed(carried);
    if (seedOpts) setSeededOptions(true);
    if ((seeded || seedOpts) && from) setCarriedFrom(from);
    if (adopted) setAdoptedShare(true);
    if (pending) setPendingShare(pending);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (carried || seedOpts || from) clearCarriedSubject();
    // Strip the share fragment once read, whether adopted or held pending, so a
    // refresh doesn't re-apply it and the address bar stops carrying someone
    // else's comparison. The pending card lives in state, not the URL, from here.
    if (shared) clearShare();
  }, []);

  // Clear the copy-confirmation timer on unmount so it can't fire into a gone
  // component.
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  // Build the share link and put it on the clipboard. Encodes the scored
  // comparison (never the gut) into the URL fragment — never a server — with the
  // same clipboard-then-execCommand fallback the flip point and journal use.
  const copyShareLink = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = encodeShare("compare", sharePayload(state));
    if (!token) return;
    const link = `${window.location.origin}/compare#${SHARE_PARAM}=${token}`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    }
  }, [state]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — the tool still works, just won't persist */
    }
  }, [state, hydrated]);

  // ---- mutators ----
  const setDecision = (decision: string) => setState((s) => ({ ...s, decision }));

  const setOptionLabel = (id: string, label: string) =>
    setState((s) => ({
      ...s,
      options: s.options.map((o) => (o.id === id ? { ...o, label } : o)),
    }));

  const addOption = () =>
    setState((s) =>
      s.options.length >= 6 ? s : { ...s, options: [...s.options, { id: freshId("o"), label: "" }] }
    );

  const removeOption = (id: string) =>
    setState((s) => {
      if (s.options.length <= 2) return s;
      const scores: Scores = {};
      for (const [fid, row] of Object.entries(s.scores)) {
        const next: Record<string, number> = { ...row };
        delete next[id];
        scores[fid] = next;
      }
      return {
        ...s,
        options: s.options.filter((o) => o.id !== id),
        scores,
        gut: s.gut === id ? "" : s.gut,
      };
    });

  const setFactorLabel = (id: string, label: string) =>
    setState((s) => ({
      ...s,
      factors: s.factors.map((f) => (f.id === id ? { ...f, label } : f)),
    }));

  const setFactorWeight = (id: string, weight: Weight) =>
    setState((s) => ({
      ...s,
      factors: s.factors.map((f) => (f.id === id ? { ...f, weight } : f)),
    }));

  const addFactor = () =>
    setState((s) =>
      s.factors.length >= 6
        ? s
        : { ...s, factors: [...s.factors, { id: freshId("f"), label: "", weight: 2 }] }
    );

  const removeFactor = (id: string) =>
    setState((s) => {
      if (s.factors.length <= 1) return s;
      const scores: Scores = { ...s.scores };
      delete scores[id];
      return { ...s, factors: s.factors.filter((f) => f.id !== id), scores };
    });

  const setScore = (factorId: string, optionId: string, value: number) =>
    setState((s) => ({
      ...s,
      scores: {
        ...s.scores,
        [factorId]: { ...(s.scores[factorId] ?? {}), [optionId]: value },
      },
    }));

  const setGut = (gut: string) => setState((s) => ({ ...s, gut }));

  const calc = useMemo(() => compute(state), [state]);

  // The gut question can appear once there's something worth revealing.
  const readyForGut = calc != null;
  const revealed = calc != null && state.gut.length > 0;

  const labelledOptions = state.options.filter((o) => o.label.trim().length > 0);
  const gutOption = labelledOptions.find((o) => o.id === state.gut) ?? null;

  // Once revealed, the shape of the answer.
  const winner = revealed && calc ? calc.ranked[0] : null;
  const runnerUp = revealed && calc && calc.ranked.length >= 2 ? calc.ranked[1] : null;
  const gutAgrees = revealed && winner != null && state.gut === winner.id;
  // The gut's pick, is it essentially tied with the winner (inside the band)?
  const gutTiedWithTop =
    revealed && calc && !gutAgrees && gutOption != null
      ? calc.totals[winner!.id] - calc.totals[gutOption.id] < calc.closeBand
      : false;

  function handleLog() {
    if (!calc || !winner) return;
    const idx = state.options.findIndex((o) => o.id === winner.id);
    const winnerLabel = optionName(winner, idx < 0 ? 0 : idx);
    const runnerLabel = runnerUp
      ? optionName(runnerUp, state.options.findIndex((o) => o.id === runnerUp.id))
      : "the alternatives";
    // The factors the winner actually leads — the case for it, in its own terms.
    const ledFactors = calc.activeFactors
      .filter((f) => calc.leaders[f.id]?.includes(winner.id))
      .map((f) => f.label.trim())
      .filter(Boolean);
    const because =
      ledFactors.length > 0
        ? `it led on ${ledFactors.slice(0, 3).join(", ")}`
        : `it came out ahead across the factors that mattered`;
    const reviewOn = addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS);
    appendDecisionEntry({
      situationTitle: state.decision.trim() || "A choice between options",
      decision: `Chose ${winnerLabel}${state.decision.trim() ? ` — ${state.decision.trim()}` : ""}`,
      question: state.decision.trim() || `Which option: ${labelledOptions.map((o, i) => optionName(o, i)).join(", ")}?`,
      expectation: `${winnerLabel} proves the right call over ${runnerLabel} — ${because}.`,
      call: `Scored ${calc.activeFactors.length} factor${calc.activeFactors.length === 1 ? "" : "s"}; ${winnerLabel} led. Gut ${gutAgrees ? "agreed" : gutOption ? `wanted ${optionName(gutOption, 0)}` : "unset"}.`,
      confidence: conf,
      reviewOn,
    });
    setLogged({ conf, reviewOn, label: winnerLabel });
  }

  const reviewPreview = addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS);

  const pendingDesc = pendingShare ? describeSharedCompare(pendingShare) : null;

  return (
    <div>
      {/* ---- Shared with you: adopted whole into a blank tool ---- */}
      {adoptedShare ? (
        <div className="mb-5 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            <span className="font-medium">
              You&rsquo;re looking at a comparison someone shared with you.
            </span>{" "}
            The options and scores below are theirs — name which one your own gut
            wants to see how it lands, change any score to argue back, or{" "}
            <button
              type="button"
              onClick={() => {
                setState(blankState());
                setAdoptedShare(false);
                setLogged(null);
              }}
              className="font-medium text-[var(--accent)] underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              start from a blank tool
            </button>
            .
          </p>
        </div>
      ) : null}

      {/* ---- Shared with you: held, because the tool already had work ---- */}
      {pendingShare && pendingDesc ? (
        <div className="mb-5 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--card)] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            A comparison was shared with you
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--foreground)] leading-relaxed">
            {pendingDesc.subject}
          </p>
          {pendingDesc.line ? (
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
              {pendingDesc.line}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            You already have a comparison in progress here. Opening theirs
            replaces what&rsquo;s in the tool now.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setState(pendingShare);
                setPendingShare(null);
                setLogged(null);
              }}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
            >
              Open it in the tool
            </button>
            <button
              type="button"
              onClick={() => setPendingShare(null)}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {/* ---- New here? A read-only worked example (never touches the fields) ---- */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowExample((s) => !s)}
          className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {showExample ? "Hide the worked example ↑" : "New here? See a worked example ↓"}
        </button>
        {showExample ? <CompareExample /> : null}
      </div>

      {/* ---- The choice + the options ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you choosing between?
        </label>
        <input
          type="text"
          value={state.decision}
          onChange={(e) => setDecision(e.target.value)}
          placeholder="e.g. Which job offer to take"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && state.decision.trim() === carriedSeed}
          lead={
            carriedFrom
              ? `Carried from ${CARRY_SOURCES[carriedFrom]} — edit ${
                  seededOptions ? "the decision and options below, or" : "it above, or"
                }`
              : undefined
          }
          clearLabel={seededOptions ? "clear all" : undefined}
          onClear={() => {
            setDecision("");
            setCarriedSeed("");
            if (seededOptions) {
              setState((s) => ({
                ...s,
                options: blankState().options,
                scores: {},
                gut: "",
              }));
              setSeededOptions(false);
            }
          }}
        />

        <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The options on the table
        </p>
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          Name the real ones — and if you&rsquo;ve framed this as{" "}
          <em>whether or not</em>, that&rsquo;s a warning: a two-option list that&rsquo;s
          really &ldquo;the thing&rdquo; vs &ldquo;nothing&rdquo; often hides the option
          you didn&rsquo;t let yourself write down.{" "}
          <Link
            href={withSubject("/widen", state.decision)}
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Widen the frame first
          </Link>{" "}
          if you&rsquo;re not sure you&rsquo;ve got the whole set.
        </p>
        <div className="mt-3 space-y-2">
          {state.options.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2">
              <input
                type="text"
                value={o.label}
                onChange={(e) => setOptionLabel(o.id, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className={inputClass}
              />
              {state.options.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removeOption(o.id)}
                  aria-label={`Remove ${optionName(o, i)}`}
                  className="shrink-0 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {state.options.length < 6 ? (
          <button
            type="button"
            onClick={addOption}
            className="mt-3 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            + Add an option
          </button>
        ) : null}
      </div>

      {/* ---- The factors ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The factors that actually matter
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Name the handful of things this choice really turns on — three or four
          is usually enough. Mark how much each one weighs, but keep it coarse:{" "}
          <em>minor / normal / major</em>. Fine-grained weights are false
          precision; the ranking should survive you nudging any single one.
        </p>
        <div className="mt-4 space-y-3">
          {state.factors.map((f, i) => (
            <div key={f.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={f.label}
                onChange={(e) => setFactorLabel(f.id, e.target.value)}
                placeholder={`Factor ${i + 1} — e.g. how much I'd grow`}
                className={inputClass}
              />
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                  {([1, 2, 3] as Weight[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setFactorWeight(f.id, w)}
                      aria-pressed={f.weight === w}
                      className={`px-2.5 py-1.5 text-xs transition-colors ${
                        f.weight === w
                          ? "bg-[var(--accent)] text-[var(--background)]"
                          : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {WEIGHT_LABEL[w]}
                    </button>
                  ))}
                </div>
                {state.factors.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeFactor(f.id)}
                    aria-label={`Remove ${factorName(f, i)}`}
                    className="px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {state.factors.length < 6 ? (
          <button
            type="button"
            onClick={addFactor}
            className="mt-3 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            + Add a factor
          </button>
        ) : null}
      </div>

      {/* ---- The scoring — one factor at a time (the anti-halo core) ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Score them — one factor at a time
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Go <em>across a row</em>, not down a column: rate every option on this
          one factor before moving to the next. Judging a single dimension at a
          time is the whole point — it stops one strong impression of an option
          from quietly colouring how you score everything else about it. Rate
          1&nbsp;(worst here) to 5&nbsp;(best here).
        </p>

        {labelledOptions.length < 2 ? (
          <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
            Name at least two options above, and they&rsquo;ll appear here to score.
          </p>
        ) : (
          <div className="mt-5 space-y-6">
            {state.factors
              .filter((f) => f.label.trim().length > 0)
              .map((f, fi) => (
                <div key={f.id}>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {factorName(f, fi)}
                    </p>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                      {WEIGHT_LABEL[f.weight]}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {labelledOptions.map((o, oi) => {
                      const current = state.scores[f.id]?.[o.id] ?? 0;
                      return (
                        <div
                          key={o.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="text-sm text-[var(--foreground)] truncate">
                            {optionName(o, state.options.findIndex((x) => x.id === o.id))}
                          </span>
                          <div
                            className="flex gap-1 shrink-0"
                            role="group"
                            aria-label={`Score ${optionName(o, oi)} on ${factorName(f, fi)}`}
                          >
                            {SCALE.map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setScore(f.id, o.id, n)}
                                aria-pressed={current === n}
                                aria-label={`${n} of 5`}
                                className={`w-8 h-8 rounded-md text-xs tabular-nums border transition-colors ${
                                  current === n
                                    ? "bg-[var(--accent)] text-[var(--background)] border-[var(--accent)]"
                                    : "bg-[var(--background)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]"
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ---- The gut call — asked last, kept separate ---- */}
      {readyForGut ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Before you total it up — which one do you want?
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Not which one <em>should</em>{" "}win &mdash; which one you find yourself hoping
            does. Name it before the tally shows, so the number can&rsquo;t talk
            you out of information your gut is carrying. The tally stays hidden
            until you pick.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {labelledOptions.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setGut(o.id)}
                aria-pressed={state.gut === o.id}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  state.gut === o.id
                    ? "bg-[var(--accent)] text-[var(--background)] border-[var(--accent)]"
                    : "bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)]"
                }`}
              >
                {optionName(o, i)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---- The reveal ---- */}
      {revealed && calc && winner ? (
        <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Where the factors land
          </p>

          {/* the ranked bars */}
          <div className="mt-4 space-y-3">
            {calc.ranked.map((o, i) => {
              const total = calc.totals[o.id];
              const pct = calc.maxTotal > 0 ? (total / calc.maxTotal) * 100 : 0;
              const isTop = i === 0;
              return (
                <div key={o.id}>
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span
                      className={`text-sm ${
                        isTop
                          ? "font-semibold text-[var(--foreground)]"
                          : "text-[var(--foreground)]"
                      }`}
                    >
                      {optionName(o, state.options.findIndex((x) => x.id === o.id))}
                      {state.gut === o.id ? (
                        <span className="ml-2 text-[10px] uppercase tracking-widest text-[var(--accent)]">
                          your gut
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs tabular-nums text-[var(--muted)]">
                      {Math.round(pct)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className={isTop ? "h-full bg-[var(--accent)]" : "h-full bg-[var(--accent)] opacity-40"}
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* the read */}
          <div className="mt-6">
            {calc.tooClose ? (
              <>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Too close to separate — and that&rsquo;s the answer.
                </p>
                <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                  The top options land inside the noise of a rough 1&ndash;5 rating.
                  Don&rsquo;t let a tally you built in five minutes cast the deciding
                  vote between things this evenly matched. When the factors call it
                  even, the tiebreaker is whatever you couldn&rsquo;t score: which
                  one is more reversible, which regret you could live with, who
                  you&rsquo;d become. Your gut wanted{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {gutOption ? optionName(gutOption, 0) : "one of them"}
                  </span>
                  ; on a genuine tie that&rsquo;s a fine place to let it decide —
                  but first see whether a single unknown actually separates the
                  two, below.
                </p>
              </>
            ) : gutAgrees ? (
              <>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Your reasons back your instinct: {optionName(winner, 0)}.
                </p>
                <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                  The option your gut wanted is the one the factors put on top,
                  scored one dimension at a time. That agreement is worth
                  something — it means the pick isn&rsquo;t just a first impression
                  dressed up. Sanity-check it once against the profile below, then
                  go.
                </p>
              </>
            ) : gutTiedWithTop ? (
              <>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  A near-tie: {optionName(winner, 0)} edges it, but your gut&rsquo;s
                  pick is right behind.
                </p>
                <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                  {gutOption ? optionName(gutOption, 0) : "Your pick"} sits inside a
                  hair of the top on the factors. With that little between them, the
                  thing your gut is registering — something you may not have written
                  down — is a reasonable tiebreaker. Check the profile below before
                  you overrule it.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  The gap worth examining: your gut wanted{" "}
                  {gutOption ? optionName(gutOption, 0) : "another"}, the factors say{" "}
                  {optionName(winner, 0)}.
                </p>
                <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                  This disagreement is the most useful thing on the page — don&rsquo;t
                  resolve it by just trusting the number. There are only two honest
                  explanations, and only you know which:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)] leading-relaxed list-disc pl-5">
                  <li>
                    <span className="text-[var(--foreground)]">
                      You&rsquo;re weighting a factor more than you told the tool.
                    </span>{" "}
                    Find the one that makes{" "}
                    {gutOption ? optionName(gutOption, 0) : "your pick"} shine, and if
                    it really matters that much, raise its weight and look again.
                  </li>
                  <li>
                    <span className="text-[var(--foreground)]">
                      There&rsquo;s a factor you never wrote down.
                    </span>{" "}
                    Something is pulling you toward{" "}
                    {gutOption ? optionName(gutOption, 0) : "it"} that isn&rsquo;t on
                    the list. Name it, add it as a factor, score it — and see whether
                    the ranking moves.
                  </li>
                </ul>
                <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                  If neither holds up — no missing factor, no misweight you&rsquo;d
                  defend — then the tally is telling you something your first
                  impression got wrong. That&rsquo;s exactly the case this tool
                  exists to catch.
                </p>
              </>
            )}
          </div>

          {/* the profile — which option leads each factor */}
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              The profile — who leads each factor
            </p>
            <div className="mt-3 space-y-1.5">
              {calc.activeFactors.map((f) => {
                const leadIds = calc.leaders[f.id] ?? [];
                const names = leadIds.map((id) => {
                  const idx = state.options.findIndex((x) => x.id === id);
                  return optionName(state.options[idx], idx);
                });
                return (
                  <div key={f.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-[var(--muted)]">
                      {f.label.trim()}
                      <span className="ml-1.5 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                        {WEIGHT_LABEL[f.weight]}
                      </span>
                    </span>
                    <span className="text-[var(--foreground)] text-right">
                      {names.length === calc.ranked.length ? "tied" : names.join(", ")}
                    </span>
                  </div>
                );
              })}
            </div>
            {calc.hingeFactorId ? (
              <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
                <span className="text-[var(--foreground)] font-medium">
                  The whole choice is riding on{" "}
                  {state.factors.find((f) => f.id === calc.hingeFactorId)?.label.trim()}.
                </span>{" "}
                Drop that one factor and a different option wins. So that&rsquo;s the
                score to be surest of — if you&rsquo;re not confident in it, the rest
                of the exercise is resting on sand. Refining any other number
                won&rsquo;t change the answer.
              </p>
            ) : calc.activeFactors.length >= 2 && !calc.tooClose ? (
              <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
                No single factor is carrying this — {optionName(winner, 0)} stays on
                top even if you drop any one of them. That&rsquo;s a robust lead, not
                a knife-edge.
              </p>
            ) : null}
          </div>
        </div>
      ) : readyForGut ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Pick the option your gut wants above, and the tally appears beside it.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Name two or more options and at least one factor, score every option on
            it, and the comparison appears.
          </p>
        </div>
      )}

      {/* ---- Two finalists, too close to separate: hand them to the flip point ----
          When the tally can't tell the top two apart, scoring them more finely
          won't help — that's what "too close" *means*. The honest next move isn't
          a better average; it's to name the single thing you don't yet know that
          decides between them and which way you'd regret being wrong. That's the
          flip point's A/B frame, and it's built for exactly two options. This card
          takes the place of the journal handoff in the too-close case (they're
          mutually exclusive), turning a former dead-end into a live next step. */}
      {revealed && calc && winner && calc.tooClose && calc.ranked.length >= 2 ? (() => {
        const fA = calc.ranked[0];
        const fB = calc.ranked[1];
        const labelA = optionName(fA, state.options.findIndex((x) => x.id === fA.id));
        const labelB = optionName(fB, state.options.findIndex((x) => x.id === fB.id));
        return (
          <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Two finalists, too close to score — sharpen the one call between them
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              A tally this even isn&rsquo;t asking for finer scores — it&rsquo;s
              telling you the two are matched on everything you could put a number
              on. What&rsquo;s left is the thing you <em>couldn&rsquo;t</em>: the one
              uncertain fact that decides which is right, and which way you&rsquo;d
              regret being wrong. That&rsquo;s the question the flip point&rsquo;s
              &ldquo;A, or B&rdquo; frame is built for — it won&rsquo;t re-score{" "}
              {labelA} and {labelB}, it&rsquo;ll draw the single line between them.
            </p>
            <Link
              href={withOptions("/weigh", {
                subject: state.decision,
                optionA: labelA,
                optionB: labelB,
                from: "compare",
              })}
              className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Take {labelA} and {labelB}{" "}to the flip point &rarr;
            </Link>
          </div>
        );
      })() : null}

      {/* ---- The handoff ---- */}
      {revealed && calc && winner && !calc.tooClose ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] p-5 sm:p-6">
          {logged ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                Logged to your journal
              </p>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Filed <span className="text-[var(--foreground)]">{logged.label}</span>{" "}
                as a tracked forecast at {logged.conf}% confidence, with a review
                set for {formatHuman(logged.reviewOn)}. When the day comes, the{" "}
                <Link
                  href={withSubject("/decide?log=1", state.decision)}
                  className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                >
                  decision journal
                </Link>{" "}
                will ask whether this was, in fact, the right one to pick.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                Going with {optionName(winner, 0)}? Put it on the record
              </p>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                A choice worth scoring is a forecast worth grading. Log it to your{" "}
                <Link
                  href={withSubject("/decide", state.decision)}
                  className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                >
                  decision journal
                </Link>{" "}
                — with a review on {formatHuman(reviewPreview)} — and reality gets
                to tell you later whether {optionName(winner, 0)} was the right call.
              </p>
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[var(--muted)]">How sure it&rsquo;s the right pick?</span>
                <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                  {CONFIDENCE_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setConf(c)}
                      aria-pressed={conf === c}
                      className={`px-2.5 py-1.5 text-xs tabular-nums transition-colors ${
                        conf === c
                          ? "bg-[var(--accent)] text-[var(--background)]"
                          : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {c}%
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLog}
                className="mt-4 text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
              >
                Log this choice as a forecast
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* ---- Hand it to someone: the same comparison, carried person to person ---- */}
      {calc ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Talk it over with someone
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Two offers, three apartments &mdash; the calls this tool is for are the
            ones you make with someone else. Copy a link that carries this whole
            comparison &mdash; the options, the factors, and how you scored them
            &mdash; so a partner or a friend can open exactly what you weighed and
            change a score to argue back. Their gut stays theirs to name. It rides
            inside the link itself and is sent to no server; only whoever you hand
            it to can read it.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyShareLink}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              {copied ? "Copied — the link is on your clipboard" : "Copy a link to this comparison"}
            </button>
            <PrintButton
              label="Print / Save as PDF"
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The worked example, rendered read-only. It runs the same compute() the live
 * tool does, over a fixed scenario, so a newcomer sees exactly what a finished
 * pass produces — including the gut-vs-factors gap that is the whole point —
 * without a blank page and without a single character landing in their fields.
 */
function CompareExample() {
  const calc = compute(EXAMPLE)!;
  const winner = calc.ranked[0];
  const gutOption = EXAMPLE.options.find((o) => o.id === EXAMPLE.gut)!;
  const winnerName = optionName(
    winner,
    EXAMPLE.options.findIndex((o) => o.id === winner.id)
  );
  const gutName = optionName(
    gutOption,
    EXAMPLE.options.findIndex((o) => o.id === gutOption.id)
  );
  const hingeLabel = calc.hingeFactorId
    ? EXAMPLE.factors.find((f) => f.id === calc.hingeFactorId)?.label.trim()
    : null;

  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{EXAMPLE.decision}</span> — three options
        (the startup, the big company, staying put), scored one factor at a time
        on pay, growth, people, and commute.
      </p>

      <div className="mt-4 space-y-2">
        {calc.ranked.map((o, i) => {
          const total = calc.totals[o.id];
          const pct = calc.maxTotal > 0 ? (total / calc.maxTotal) * 100 : 0;
          const name = optionName(
            o,
            EXAMPLE.options.findIndex((x) => x.id === o.id)
          );
          return (
            <div key={o.id}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-sm text-[var(--foreground)]">
                  {name}
                  {o.id === EXAMPLE.gut ? (
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-[var(--accent)]">
                      the gut pick
                    </span>
                  ) : null}
                </span>
                <span className="text-xs tabular-nums text-[var(--muted)]">
                  {Math.round(pct)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className={i === 0 ? "h-full bg-[var(--accent)]" : "h-full bg-[var(--accent)] opacity-40"}
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        The gut wanted <span className="font-medium">{gutName}</span> — the safe,
        high-paying one — but scored a factor at a time,{" "}
        <span className="font-medium">{winnerName}</span> comes out on top, carried
        by growth and people, the two factors marked <em>major</em>.
        {hingeLabel ? (
          <>
            {" "}
            And the choice is riding on <span className="font-medium">{hingeLabel}</span>:
            drop that one factor and the ranking flips — so that&rsquo;s the score to be
            surest of.
          </>
        ) : null}{" "}
        That gap between the gut and the factors is the signal: either{" "}
        {gutName} is winning on something not yet on the list (name it, add it), or
        the first impression was overrating security. The tool doesn&rsquo;t settle
        it for you — it just makes sure you actually look.
      </p>

      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own form below is blank — enter the choice you actually came here to make.
      </p>
    </div>
  );
}
