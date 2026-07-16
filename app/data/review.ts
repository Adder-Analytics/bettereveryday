/**
 * The return desk (/review), read side.
 *
 * The whole site runs on one loop: decide now, come back later to see what
 * actually happened. Every tool has faithfully built the *first* half — the
 * calm worksheet, the honest forecast, the armed tripwire — and yesterday the
 * site finally made those records durable enough to survive the wait. But the
 * second half, the *return*, was never given a home. The most common failure in
 * any decision-journaling practice isn't a bad forecast; it's a forecast nobody
 * ever goes back to grade. A future-date you scheduled and never revisit is an
 * open loop (GTD's term): a commitment your mind keeps half-carrying because the
 * system it's filed in isn't one you actually review.
 *
 * This module is the review surface. It reads — never writes — every dated
 * thing the site is holding for you and folds it into one queue: the journal's
 * decisions due for review and the pre-mortems' armed tripwire checks, split
 * into what's due now and what's coming. Each tool still owns its own storage
 * and its own read side (journal.ts, premortem.ts); this file only composes
 * their flattened items into a single, sortable list. Like the due badge, it
 * borrows their counters so the desk and the tools can never disagree.
 *
 * It also carries the one nudge that keeps the durable record actually durable:
 * a plain reading of how much you've logged since your last backup, so the
 * record you're building toward doesn't quietly outrun the last copy you saved.
 */

import {
  dueReviews,
  upcomingReviews,
  countDecisions,
  countDecisionsLoggedAfter,
  type ScheduledReview,
} from "./journal";
import {
  dueTripwireCheckItems,
  upcomingTripwireCheckItems,
  countPremortems,
  countPremortemsCreatedAfter,
  type ScheduledCheck,
} from "./premortem";
import { readLastBackup } from "./portable";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Whole days from `fromISO` to `toISO` (positive when `toISO` is later).
 *  Local-midnight based, matching the ISO dates the tools store. Returns 0 on
 *  any unparseable input rather than NaN, so the UI never shows garbage. */
export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export type ReviewKind = "decision" | "tripwire";

/** One thing waiting for an answer, normalized across tools. */
export type ReviewItem = {
  id: string;
  kind: ReviewKind;
  /** The tool it lives in, for the group label. */
  tool: string;
  /** A one-line handle for what it's about. */
  title: string;
  /** The specific thing to check — what you expected, or the signal to watch. */
  detail: string;
  /** A short qualifier shown beside the title (confidence, the failure guarded). */
  meta: string;
  /** The scheduled date (ISO). */
  dateISO: string;
  /** today − dateISO in days: positive = overdue, negative = still ahead. */
  relDays: number;
  /** Where you go to answer it. */
  href: string;
};

function reviewToItem(r: ScheduledReview, today: string): ReviewItem {
  return {
    id: `decision:${r.id}`,
    kind: "decision",
    tool: "Decision journal",
    title: r.title,
    detail: r.expectation
      ? `You expected: ${r.expectation}`
      : "Log what actually happened and compare it to what you predicted.",
    meta:
      r.confidence != null
        ? `you were ${r.confidence}% sure`
        : "no confidence recorded",
    dateISO: r.reviewOn,
    relDays: daysBetween(r.reviewOn, today),
    // Deep-link straight to this entry's review screen, not the whole log —
    // the return only happens if it's one click from "it's due" to answering.
    href: `/decide?review=${encodeURIComponent(r.id)}`,
  };
}

function checkToItem(c: ScheduledCheck, today: string): ReviewItem {
  return {
    id: `tripwire:${c.id}`,
    kind: "tripwire",
    tool: "Pre-mortem room",
    title: c.plan,
    detail: c.signal
      ? `Watch for: ${c.signal}`
      : "Check whether the tripwire signal has appeared.",
    meta: c.failure ? `guards against: ${c.failure}` : "armed tripwire",
    dateISO: c.checkOn,
    relDays: daysBetween(c.checkOn, today),
    // Deep-link to the exact tripwire inside its pre-mortem (id is `pm:reason`),
    // so the desk lands you on the check that's due, not the room's front door.
    href: `/premortem?check=${encodeURIComponent(c.id)}`,
  };
}

/** How the record stands against its last saved copy — the durability nudge. */
export type BackupStatus = {
  /** Anything logged at all worth backing up? */
  hasRecord: boolean;
  /** ISO date of the last backup from this browser, or null if never. */
  lastBackupOn: string | null;
  /** Decisions + pre-mortems created since that backup (or the total, if
   *  never backed up). The count the nudge is built on. */
  newSince: number;
};

function backupStatus(): BackupStatus {
  const last = readLastBackup();
  const totalRecord = countDecisions() + countPremortems();
  if (totalRecord === 0) {
    return { hasRecord: false, lastBackupOn: last, newSince: 0 };
  }
  if (!last) {
    return { hasRecord: true, lastBackupOn: null, newSince: totalRecord };
  }
  const newSince =
    countDecisionsLoggedAfter(last) + countPremortemsCreatedAfter(last);
  // Guard against a marker dated in the future (clock skew / hand-editing):
  // never report negative or absurd counts.
  return { hasRecord: true, lastBackupOn: last, newSince: Math.max(0, newSince) };
}

export type ReviewQueue = {
  /** Due now, most overdue first. */
  due: ReviewItem[];
  /** Still ahead, soonest first. */
  upcoming: ReviewItem[];
  backup: BackupStatus;
  /** ISO date the queue was read — so the page can label "as of today". */
  today: string;
};

/**
 * Read everything the site is holding for a return, from the browser, and fold
 * it into one queue. Returns an empty, safe queue on the server or on any
 * storage failure (each underlying reader already degrades to []).
 */
export function loadReviewQueue(): ReviewQueue {
  const today = todayISO();

  const due: ReviewItem[] = [
    ...dueReviews(today).map((r) => reviewToItem(r, today)),
    ...dueTripwireCheckItems(today).map((c) => checkToItem(c, today)),
  ].sort((a, b) => b.relDays - a.relDays); // most overdue first

  const upcoming: ReviewItem[] = [
    ...upcomingReviews(today).map((r) => reviewToItem(r, today)),
    ...upcomingTripwireCheckItems(today).map((c) => checkToItem(c, today)),
  ].sort((a, b) => a.dateISO.localeCompare(b.dateISO)); // soonest first

  return { due, upcoming, backup: backupStatus(), today };
}

/** A human phrase for how overdue / how soon an item is, from its relDays. */
export function whenLabel(relDays: number): string {
  if (relDays <= 0) {
    const ahead = -relDays;
    if (ahead === 0) return "due today";
    if (ahead === 1) return "due tomorrow";
    if (ahead < 14) return `in ${ahead} days`;
    if (ahead < 60) return `in ${Math.round(ahead / 7)} weeks`;
    return `in ${Math.round(ahead / 30)} months`;
  }
  if (relDays === 1) return "1 day overdue";
  if (relDays < 14) return `${relDays} days overdue`;
  if (relDays < 60) return `${Math.round(relDays / 7)} weeks overdue`;
  return `${Math.round(relDays / 30)} months overdue`;
}
