/**
 * Standalone tripwires (/tripwire) — the site's cross-tool "reconsider" store.
 *
 * A tripwire is Chip and Dan Heath's device (and Annie Duke's kill criteria):
 * an observable signal and a date, chosen while you're calm, that mean *stop and
 * reconsider*. The pre-mortem room already grows tripwires out of a full failure
 * analysis — but nearly every other instrument on the site *also* ends by naming
 * one and then leaving you to re-type it somewhere. `/act` computes a perfect
 * reconsider line (a state and a date) and could only link you off to
 * `/premortem`; `/trace` finds the later cost that will sour the win; `/cool`
 * tells you to come back once you're cool. Those are tripwires with nowhere to
 * land — so the site's central promise, a system that brings you back at the
 * right moment, quietly broke everywhere except the one tool that owns the store.
 *
 * This module is that landing place: a standalone store any tool can arm a
 * tripwire into (deep-linked, pre-filled) and that the return desk (`/review`)
 * folds in beside the journal's reviews and the pre-mortem's checks, so a
 * tripwire set *anywhere* comes back on its date in the one place you look.
 * Like every store on the site it lives only in the browser; the read side
 * mirrors journal.ts and premortem.ts (SSR-safe, degrades to [] on malformed or
 * hand-edited storage) so the due badge, the desk, and this tool can never
 * disagree, and every check ends in a recorded answer — fired or all-clear —
 * because a reminder you swipe away is an acknowledgement, not a check.
 */

export const TRIPWIRES_KEY = "tripwires:v1";

export type Tripwire = {
  id: string;
  /** What this tripwire protects — the plan or decision, in one line. */
  guard: string;
  /** The observable signal that means "stop and reconsider". */
  signal: string;
  /** ISO date you're obligated to look. */
  checkOn: string;
  /** Optional: the failure it guards against, or why it matters. */
  failure: string;
  /**
   * Where it was armed from — a short tool label ("/act", "/trace", …) for
   * provenance, so the desk can say where a reconsider line came from. "" means
   * it was set on the tripwire page itself.
   */
  source: string;
  /** ISO date it was armed — for the backup nudge. */
  createdOn: string;
  /**
   * The check, answered. `checkedOn` is the ISO date the answer was recorded
   * ("" = still armed); `fired` is that answer (true = the signal appeared, stop
   * and reconsider; false = all clear, carry on; null = unanswered). A tripwire
   * check has to produce an answer, not an acknowledgement — the same discipline
   * the pre-mortem's checks keep.
   */
  checkedOn: string;
  fired: boolean | null;
};

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Defensive normalization, shared by the tool and every read-side consumer
 * (the return desk, the site-wide due badge, the backup nudge). Saved tripwires
 * are the user's thinking; like the decision log and pre-mortems they have to
 * survive shape drift and hand-edited JSON. Anything missing gets a safe
 * default; anything malformed degrades instead of throwing.
 */
export function mergeTripwire(
  raw: Partial<Tripwire> | null | undefined
): Tripwire {
  const r = raw ?? {};
  return {
    id:
      typeof r.id === "string" && r.id
        ? r.id
        : `tw-${Math.random().toString(36).slice(2, 10)}`,
    guard: typeof r.guard === "string" ? r.guard : "",
    signal: typeof r.signal === "string" ? r.signal : "",
    checkOn: typeof r.checkOn === "string" ? r.checkOn : "",
    failure: typeof r.failure === "string" ? r.failure : "",
    source: typeof r.source === "string" ? r.source : "",
    createdOn:
      typeof r.createdOn === "string" && r.createdOn ? r.createdOn : todayISO(),
    checkedOn: typeof r.checkedOn === "string" ? r.checkedOn : "",
    fired: typeof r.fired === "boolean" ? r.fired : null,
  };
}

/**
 * Read the saved tripwires from the browser. Read-only, like journal.ts and
 * premortem.ts — every writer goes through saveTripwires. Returns [] on the
 * server and on any malformed storage.
 */
export function loadTripwires(): Tripwire[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRIPWIRES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((p) => p && typeof p === "object").map(mergeTripwire)
      : [];
  } catch {
    return [];
  }
}

/** Persist the whole list. The single write path; degrades silently in a
 *  locked-down browser rather than throwing into the UI. */
export function saveTripwires(list: Tripwire[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRIPWIRES_KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked — the tool stays usable, just not durable */
  }
}

/** A tripwire being armed — everything a caller supplies; the store fills the
 *  rest (id, createdOn, unanswered check). Blank/whitespace fields are allowed
 *  through so a deep-link can pre-fill part of one and the user completes it. */
export type NewTripwire = {
  guard?: string;
  signal?: string;
  checkOn?: string;
  failure?: string;
  source?: string;
};

/** Arm a tripwire and persist it. Returns the created record so the caller can
 *  scroll to or highlight it. Prepends, so the newest sits on top of the list. */
export function armTripwire(input: NewTripwire): Tripwire {
  const tw = mergeTripwire({
    guard: input.guard ?? "",
    signal: input.signal ?? "",
    checkOn: input.checkOn ?? "",
    failure: input.failure ?? "",
    source: input.source ?? "",
    createdOn: todayISO(),
  });
  saveTripwires([tw, ...loadTripwires()]);
  return tw;
}

/** Record the answer to a check: fired (the signal appeared) or all-clear.
 *  Idempotent by id; a no-op if the id is gone. */
export function answerTripwire(id: string, fired: boolean): void {
  saveTripwires(
    loadTripwires().map((t) =>
      t.id === id ? { ...t, fired, checkedOn: todayISO() } : t
    )
  );
}

/** Send an answered tripwire back to armed — for an answer recorded by mistake. */
export function reopenTripwire(id: string): void {
  saveTripwires(
    loadTripwires().map((t) =>
      t.id === id ? { ...t, fired: null, checkedOn: "" } : t
    )
  );
}

/** Remove a tripwire entirely — for one armed in error. */
export function deleteTripwire(id: string): void {
  saveTripwires(loadTripwires().filter((t) => t.id !== id));
}

/** Armed and its date has arrived (or passed) and it hasn't been answered. */
export function isDueTripwire(t: Tripwire, today = todayISO()): boolean {
  return (
    !!t.signal.trim() && !!t.checkOn && t.checkOn <= today && !t.checkedOn
  );
}

/** Armed and its date is still ahead — the horizon. */
export function isUpcomingTripwire(t: Tripwire, today = todayISO()): boolean {
  return (
    !!t.signal.trim() && !!t.checkOn && t.checkOn > today && !t.checkedOn
  );
}

/** One tripwire, flattened for the return desk — everything /review needs to
 *  show it and link back to the exact check. */
export type ScheduledTripwire = {
  id: string;
  guard: string;
  signal: string;
  failure: string;
  source: string;
  checkOn: string;
};

function toScheduled(t: Tripwire): ScheduledTripwire {
  return {
    id: t.id,
    guard: t.guard.trim(),
    signal: t.signal.trim(),
    failure: t.failure.trim(),
    source: t.source.trim(),
    checkOn: t.checkOn,
  };
}

/** Every armed tripwire whose date has arrived. */
export function dueTripwireItems(today = todayISO()): ScheduledTripwire[] {
  return loadTripwires()
    .filter((t) => isDueTripwire(t, today))
    .map(toScheduled);
}

/** Every armed tripwire whose date is still ahead. */
export function upcomingTripwireItems(today = todayISO()): ScheduledTripwire[] {
  return loadTripwires()
    .filter((t) => isUpcomingTripwire(t, today))
    .map(toScheduled);
}

/** Armed tripwires whose date has arrived — the one number worth chasing you
 *  around the site, folded into the homepage due badge. */
export function countDueTripwires(): number {
  const today = todayISO();
  return loadTripwires().filter((t) => isDueTripwire(t, today)).length;
}

/** Total saved tripwires — the "never backed up" denominator. */
export function countTripwires(): number {
  return loadTripwires().length;
}

/** Tripwires armed strictly after the given ISO date — for the backup nudge. */
export function countTripwiresCreatedAfter(iso: string): number {
  return loadTripwires().filter((t) => t.createdOn && t.createdOn > iso).length;
}
