/**
 * The decision log, write side.
 *
 * The decision journal (/decide) owns the log: it renders it, reviews it, and
 * persists it under `decide:log:v1`. But it is no longer the only tool that
 * should be able to *add* to it — a plan that survives its pre-mortem deserves
 * to become a tracked forecast, not evaporate. This module is the one shared
 * place a new entry can be appended from, so the pre-mortem room can hand a
 * plan to the journal without importing the 2,000-line worksheet.
 *
 * It deliberately mirrors the `LogEntry` shape declared in DecideClient (the
 * same discipline app/data/journal.ts and app/data/trainers.ts already use to
 * read this key): the shapes must stay in sync, and both this appender and the
 * journal's own `mergeLogEntry` are defensive, so an entry written here loads
 * back through the journal unchanged. Reading stays in journal.ts; this file
 * only appends, so adding it can't regress the review, calibration, or
 * resulting screens.
 */

export type OutcomeQuality = "good" | "bad" | "tbd";
export type DecisionQuality = "again" | "different";
export type FirstMoveTaken = "yes" | "partly" | "no";

/** One committed decision. Mirror of DecideClient's LogEntry — keep in sync. */
export type LogEntry = {
  id: string;
  situationId: string;
  situationTitle: string;
  question: string;
  decision: string;
  reasoning: { name: string; move: string; text: string }[];
  call: string;
  firstStep: string;
  expectation: string;
  confidence: number | null;
  decidedOn: string; // ISO yyyy-mm-dd
  reviewOn: string; // ISO yyyy-mm-dd
  reviewedOn: string | null;
  outcome: string;
  outcomeQuality: OutcomeQuality | null;
  decisionQuality: DecisionQuality | null;
  firstMoveTaken: FirstMoveTaken | null;
  lessons: string;
};

/** The journal's own storage key and forecast constants — mirror, keep in sync. */
export const DECISION_LOG_KEY = "decide:log:v1";
export const CONFIDENCE_OPTIONS = [50, 60, 70, 80, 90] as const;
export const REVIEW_DEFAULT_DAYS = 90;

// ---- date helpers (local-time ISO, no library) --------------------------
export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Fill a partial entry with safe defaults into a complete, valid LogEntry —
 * the same normalization the journal applies on read, so a partial handoff
 * (a plan, a forecast, a review date) becomes a first-class log entry with
 * empty review fields waiting for the day it comes due.
 */
export function buildDecisionEntry(partial: Partial<LogEntry>): LogEntry {
  const today = todayISO();
  const reasoning = Array.isArray(partial.reasoning)
    ? partial.reasoning.map((r) => ({
        name: typeof r?.name === "string" ? r.name : "",
        move: typeof r?.move === "string" ? r.move : "",
        text: typeof r?.text === "string" ? r.text : "",
      }))
    : [];
  const conf =
    typeof partial.confidence === "number" &&
    (CONFIDENCE_OPTIONS as readonly number[]).includes(partial.confidence)
      ? partial.confidence
      : null;
  return {
    id: partial.id && typeof partial.id === "string" ? partial.id : newId(),
    situationId: partial.situationId ?? "",
    situationTitle: partial.situationTitle || "A decision",
    question: partial.question ?? "",
    decision: partial.decision ?? "",
    reasoning,
    call: partial.call ?? "",
    firstStep: partial.firstStep ?? "",
    expectation: partial.expectation ?? "",
    confidence: conf,
    decidedOn: partial.decidedOn || today,
    reviewOn: partial.reviewOn || addDaysISO(today, REVIEW_DEFAULT_DAYS),
    reviewedOn: null,
    outcome: "",
    outcomeQuality: null,
    decisionQuality: null,
    firstMoveTaken: null,
    lessons: "",
  };
}

/**
 * Read the log, prepend one new entry (newest first, matching the journal's
 * own ordering), and write it back. Returns the entry that was stored, or null
 * if storage is unavailable (the caller can still show its own confirmation).
 * Never throws: a full or blocked localStorage degrades to a no-op.
 */
export function appendDecisionEntry(partial: Partial<LogEntry>): LogEntry | null {
  const entry = buildDecisionEntry(partial);
  if (typeof window === "undefined") return null;
  try {
    let existing: unknown = null;
    try {
      const raw = window.localStorage.getItem(DECISION_LOG_KEY);
      existing = raw ? JSON.parse(raw) : null;
    } catch {
      existing = null;
    }
    const log = Array.isArray(existing) ? existing : [];
    window.localStorage.setItem(DECISION_LOG_KEY, JSON.stringify([entry, ...log]));
    return entry;
  } catch {
    return null;
  }
}
