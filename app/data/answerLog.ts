/**
 * The answer-now history: turn the quick tools' one-slot memory into a record.
 *
 * The whole premise of this site is the return: you make a call, and you come
 * back weeks later to find out whether you were right. The decision journal
 * keeps that promise — it logs every decision and schedules its review. But the
 * *answer-now* family (the flip point, the door sort, the halo-off comparison,
 * the older-self read, and a dozen more) never did. Each of those tools keeps
 * exactly one worksheet: the last call you reached its answer on, in a single
 * localStorage slot, overwritten the next time you open it on a different call.
 * Work the same tool on Tuesday's decision and then on Friday's, and Tuesday's
 * is simply gone — not archived, not reviewable, gone. For a toolkit whose own
 * home page says it "keeps the record for you and can hand it back weeks later,"
 * that was a quiet lie for eighteen of its instruments.
 *
 * This module closes the gap without touching a single tool. It reads the same
 * single slots the tools already write, and folds each distinct call into one
 * shared, append-only history under `answerlog:v1`. The design turns on two
 * facts the site already established and this module simply reuses:
 *
 *   1. The backup registry (portable.ts) already carries, for every answer-now
 *      store, a `subject` extractor (the "what are you deciding?" line) and a
 *      `describe` summariser ("2 options across 3 factors"). That is exactly the
 *      per-tool schema knowledge a history needs — so this module is entirely
 *      schema-agnostic: it never learns any tool's internal shape, it asks
 *      portable's descriptors. A new answer-now tool joins the history the day
 *      it is registered for backup, with no change here.
 *
 *   2. The decision home (/decisions) already groups everything by that same
 *      subject line. So a call recorded here lands under the same heading as the
 *      journal entry, pre-mortem, and tripwire for the same decision — the arc
 *      reassembles for free.
 *
 * Capture is a *sweep*, not a per-keystroke write: a tiny global recorder (see
 * components/AnswerLogRecorder) sweeps the slots on navigation and when the tab
 * is hidden, so the tools stay untouched and the history is eventually
 * consistent — the live slot always holds the current worksheet, and the sweep
 * copies it into the record. One entry is kept per (tool, subject): editing the
 * same call refreshes its entry in place; starting a *different* call in the
 * same tool leaves the previous one standing as history. An entry's date only
 * moves when its content actually changed, so a passive sweep that finds nothing
 * new never re-stamps an old call as "today."
 *
 * Same discipline as the rest of the site: nothing leaves the browser, the log
 * is capped so it can't grow without bound, every read is defensive and degrades
 * to "no history" rather than throwing, and `foldSnapshot` is a pure function of
 * its inputs so the dedup-and-cap logic is testable without a browser.
 */

import { STORES } from "./portable";

/** The single shared key the whole answer-now history lives under. */
export const ANSWER_LOG_KEY = "answerlog:v1";

/**
 * The most distinct calls the history holds. Well past what one person works in
 * the quick tools, but bounded so a shared device or a long life of use can't
 * grow the store without limit. When full, the oldest-touched entry is evicted.
 */
export const MAX_HISTORY = 150 as const;

/**
 * One recorded call. Deliberately self-contained — it stores the already-
 * computed subject and detail strings rather than the raw worksheet, so the
 * history renders without re-parsing any tool's schema and stays small. `sig`
 * is a cheap fingerprint of the worksheet used only to tell "the content
 * changed" from "an unchanged passive sweep," so the date moves only on real
 * edits. `on` is the ISO date the content was last seen to change.
 */
export type Snapshot = {
  /** The tool's storage key, e.g. "weigh:v1" — identifies which instrument. */
  key: string;
  /** The decision line, in the casing it was written (the grouping subject). */
  subject: string;
  /** Case-folded, whitespace-collapsed subject — the dedup and match key. */
  norm: string;
  /** A one-line summary of the worksheet, from the tool's own describer. */
  detail: string;
  /** Cheap fingerprint of the worksheet, to detect real change vs. a no-op sweep. */
  sig: string;
  /** ISO yyyy-mm-dd the content last changed. */
  on: string;
};

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Collapse whitespace and case — the exact normalization /decisions groups on,
 *  so a call recorded here matches the same call typed into the journal. */
export function normSubject(subject: string): string {
  return subject.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * A tiny, stable string fingerprint (FNV-1a, 32-bit, base36). Not a security
 * hash — just enough to notice when a worksheet's content differs from the one
 * already recorded, cheaply and deterministically, without storing the raw text.
 */
export function sig(raw: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // length guards against a rare collision on same-length edits being missed.
  return `${raw.length.toString(36)}.${(h >>> 0).toString(36)}`;
}

/**
 * Fold one freshly-swept snapshot into the log. Pure: no browser, no clock
 * beyond the `today` passed in, so the dedup-and-cap rules are unit-testable.
 *
 * Rules, in order:
 *   - Match on (key, norm): the same call in the same tool.
 *   - If matched and the fingerprint is unchanged → return the log untouched
 *     (`changed: false`), so a passive sweep never re-stamps or re-orders it.
 *   - If matched and changed → update its detail/subject/sig and move its date
 *     to today (the call was edited).
 *   - If unmatched → it is a new call; append it dated today.
 *   - Then cap to MAX_HISTORY, evicting the oldest-dated entries first.
 */
export function foldSnapshot(
  log: Snapshot[],
  incoming: { key: string; subject: string; detail: string; sig: string },
  today: string
): { log: Snapshot[]; changed: boolean } {
  const norm = normSubject(incoming.subject);
  if (!norm) return { log, changed: false }; // nothing to group on — skip
  const idx = log.findIndex((e) => e.key === incoming.key && e.norm === norm);

  if (idx >= 0) {
    if (log[idx].sig === incoming.sig) return { log, changed: false };
    const next = log.slice();
    next[idx] = {
      key: incoming.key,
      subject: incoming.subject,
      norm,
      detail: incoming.detail,
      sig: incoming.sig,
      on: today,
    };
    return { log: cap(next), changed: true };
  }

  const next = [
    ...log,
    {
      key: incoming.key,
      subject: incoming.subject,
      norm,
      detail: incoming.detail,
      sig: incoming.sig,
      on: today,
    },
  ];
  return { log: cap(next), changed: true };
}

/** Keep only the MAX_HISTORY most-recently-dated entries. Stable for ties. */
function cap(log: Snapshot[]): Snapshot[] {
  if (log.length <= MAX_HISTORY) return log;
  // Sort a copy by date descending, keep the head, but preserve the original
  // relative order of the survivors so the store doesn't churn needlessly.
  const keep = new Set(
    [...log]
      .map((e, i) => ({ e, i }))
      .sort((a, b) => (a.e.on === b.e.on ? a.i - b.i : a.e.on < b.e.on ? 1 : -1))
      .slice(0, MAX_HISTORY)
      .map((x) => x.i)
  );
  return log.filter((_, i) => keep.has(i));
}

/** Parse the stored log defensively into a clean Snapshot[]. Never throws. */
function readLog(): Snapshot[] {
  if (typeof window === "undefined") return [];
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(ANSWER_LOG_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return parsed
    .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
    .map((e) => ({
      key: str(e.key),
      subject: str(e.subject),
      norm: str(e.norm) || normSubject(str(e.subject)),
      detail: str(e.detail),
      sig: str(e.sig),
      on: str(e.on),
    }))
    .filter((e) => e.key && e.norm);
}

/** The answer-now stores worth recording: those the backup registry flags as
 *  answer-now worksheets and knows how to pull a subject from. Same source of
 *  truth /decisions already reads its drafts from. */
function answerNowStores() {
  return STORES.filter((s) => s.answerNow && s.subject);
}

/**
 * Read every answer-now slot and fold anything present into the history. Writes
 * the log back only when at least one call was new or edited, so an idle sweep
 * touches nothing. Fully defensive and browser-only: a no-op on the server or
 * when storage is unavailable. This is the one function the global recorder
 * calls.
 */
export function sweepAnswerNow(): void {
  if (typeof window === "undefined") return;
  const today = todayISO();
  let log = readLog();
  let changed = false;

  for (const store of answerNowStores()) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(store.key);
    } catch {
      continue;
    }
    if (raw == null) continue;

    let subject: string | null = null;
    try {
      subject = store.subject ? store.subject(raw) : null;
    } catch {
      subject = null;
    }
    if (!subject) continue; // a blank scratch worksheet has nothing to record

    let detail: string | null = null;
    try {
      detail = store.describe ? store.describe(raw) : null;
    } catch {
      detail = null;
    }

    const folded = foldSnapshot(
      log,
      { key: store.key, subject, detail: detail ?? "", sig: sig(raw) },
      today
    );
    log = folded.log;
    changed = changed || folded.changed;
  }

  if (!changed) return;
  try {
    window.localStorage.setItem(ANSWER_LOG_KEY, JSON.stringify(log));
  } catch {
    /* storage full or blocked — the live slots still hold the worksheets; the
       next sweep on a browser with room will pick them up. */
  }
}

/** One past call, flattened for a reader. The tool's page and label come from
 *  the backup registry so this stays schema-agnostic. */
export type PastCall = {
  key: string;
  subject: string;
  detail: string;
  on: string;
  /** The tool's page, e.g. "/weigh". */
  href: string;
  /** The tool's display name, e.g. "Flip point". */
  tool: string;
};

/**
 * Read the recorded history, newest-touched first, joined to each tool's page
 * and name from the backup registry. Entries whose tool is no longer registered
 * are dropped (they can't be linked or labelled). Reads only; never writes.
 */
export function loadAnswerHistory(): PastCall[] {
  const byKey = new Map(STORES.map((s) => [s.key, s]));
  return readLog()
    .map((e) => {
      const store = byKey.get(e.key);
      if (!store) return null;
      return {
        key: e.key,
        subject: e.subject,
        detail: e.detail,
        on: e.on,
        href: store.href,
        tool: store.tool,
      };
    })
    .filter((x): x is PastCall => x !== null)
    .sort((a, b) => (a.on === b.on ? 0 : a.on < b.on ? 1 : -1));
}
