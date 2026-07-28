/**
 * Parked decisions (`cool:parked:v1`) — the cooling-off tool's scheduled return.
 *
 * The cooling-off tool (`/cool`) settles one question for a person deciding
 * hot: decide now, or once you're cool? Its most common verdict is *wait* —
 * "close this and come back to it cold; if it still looks the same tomorrow, it
 * wasn't the heat talking." But the site had no way to actually bring you back.
 * The tool leaned on its own copy ("this page keeps what you wrote… it's still
 * here when you come back cold") — which quietly makes the whole promise depend
 * on the one thing the return desk exists to replace: remembering, unprompted,
 * to return. A decision you slept on and never came back to isn't cooled; it's
 * abandoned, and the heat won by default.
 *
 * A parked decision is a genuinely different kind of return from the two the
 * desk already holds. A journal review is a forecast reality has settled and
 * you grade; a tripwire is a signal you watch for. This is neither: it's an
 * appointment to *finish deciding* a call you deferred while you couldn't judge
 * it straight. So it earns its own small store rather than being shoehorned into
 * a tripwire (whose premise — a signal set while calm, guarding a decision
 * already made — is the exact inverse of a hot, undecided call).
 *
 * This module mirrors tripwires.ts exactly: it is the single source for the
 * parked list, it normalizes defensively so hand-edited or older JSON degrades
 * to a safe value instead of throwing, and the return desk (`/review`) folds it
 * in beside the journal's reviews and the tripwire checks. Like every store on
 * the site it lives only in the browser and is sent nowhere; it rides in the
 * same full-backup bundle as the rest.
 */

export const PARKED_KEY = "cool:parked:v1";

export type Parked = {
  id: string;
  /** The call you were about to make, one line — what you'll decide when cool. */
  decision: string;
  /** What was driving it (a short label: "anger", "FOMO", …), for the return
   *  copy — so the desk can remind you which heat you parked it under. */
  feeling: string;
  /** Optional: anything to hand your cold self — the urgency, a fact to keep. */
  note: string;
  /** The cooling-off verdict at park time ("Sleep on it." / "Don't decide this
   *  tonight."), kept for context on return. */
  verdict: string;
  /** ISO date you parked it. */
  parkedOn: string;
  /** ISO date to come back and decide it cold. */
  decideOn: string;
  /** ISO date you resolved it ("" = still waiting to be decided). A parked
   *  decision ends in a deliberate answer — decided or let go — not by fading. */
  resolvedOn: string;
};

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Defensive normalization, shared by the tool and every read-side consumer (the
 * return desk, the site-wide backup nudge). Anything missing gets a safe
 * default; anything malformed degrades instead of throwing — the same contract
 * mergeTripwire and the journal's loader keep.
 */
export function mergeParked(raw: Partial<Parked> | null | undefined): Parked {
  const r = raw ?? {};
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id:
      typeof r.id === "string" && r.id
        ? r.id
        : `pk-${Math.random().toString(36).slice(2, 10)}`,
    decision: str(r.decision),
    feeling: str(r.feeling),
    note: str(r.note),
    verdict: str(r.verdict),
    parkedOn: typeof r.parkedOn === "string" && r.parkedOn ? r.parkedOn : todayISO(),
    decideOn: str(r.decideOn),
    resolvedOn: str(r.resolvedOn),
  };
}

/**
 * Read the parked list from the browser. Read-only, like tripwires.ts — every
 * writer goes through saveParked. Returns [] on the server and on malformed
 * storage, so the desk, the badge, and this tool can never disagree.
 */
export function loadParked(): Parked[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PARKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((p) => p && typeof p === "object").map(mergeParked)
      : [];
  } catch {
    return [];
  }
}

/** Persist the whole list. The single write path; degrades silently in a
 *  locked-down browser rather than throwing into the UI. */
export function saveParked(list: Parked[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PARKED_KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked — the tool stays usable, just not durable */
  }
}

/** A decision being parked — everything the caller supplies; the store fills
 *  the rest (id, parkedOn, unresolved). */
export type NewParked = {
  decision: string;
  feeling?: string;
  note?: string;
  verdict?: string;
  decideOn: string;
};

/** Park a decision and persist it. Returns the created record so the caller can
 *  confirm it. Prepends, so the newest sits on top of the list. */
export function parkDecision(input: NewParked): Parked {
  const pk = mergeParked({
    decision: input.decision.trim(),
    feeling: (input.feeling ?? "").trim(),
    note: (input.note ?? "").trim(),
    verdict: (input.verdict ?? "").trim(),
    parkedOn: todayISO(),
    decideOn: input.decideOn,
    resolvedOn: "",
  });
  saveParked([pk, ...loadParked()]);
  return pk;
}

/** Mark a parked decision resolved — you came back and decided it (or let it
 *  go). Idempotent by id; a no-op if the id is gone. */
export function resolveParked(id: string): void {
  saveParked(
    loadParked().map((p) =>
      p.id === id ? { ...p, resolvedOn: todayISO() } : p
    )
  );
}

/** Send a resolved parked decision back to waiting — for one closed by mistake. */
export function reopenParked(id: string): void {
  saveParked(
    loadParked().map((p) => (p.id === id ? { ...p, resolvedOn: "" } : p))
  );
}

/** Remove a parked decision entirely — for one parked in error. */
export function deleteParked(id: string): void {
  saveParked(loadParked().filter((p) => p.id !== id));
}

/** Find one parked decision by id (for the cooling-off tool's cold return). */
export function findParked(id: string): Parked | null {
  return loadParked().find((p) => p.id === id) ?? null;
}

/** Waiting and its date has arrived (or passed). */
export function isDueParked(p: Parked, today = todayISO()): boolean {
  return !p.resolvedOn && !!p.decideOn && p.decideOn <= today && !!p.decision.trim();
}

/** Waiting and its date is still ahead — the horizon. */
export function isUpcomingParked(p: Parked, today = todayISO()): boolean {
  return !p.resolvedOn && !!p.decideOn && p.decideOn > today && !!p.decision.trim();
}

/** One parked decision, flattened for the return desk — everything /review
 *  needs to show it and link back to the cold return. */
export type ScheduledParked = {
  id: string;
  decision: string;
  feeling: string;
  note: string;
  parkedOn: string;
  decideOn: string;
};

function toScheduled(p: Parked): ScheduledParked {
  return {
    id: p.id,
    decision: p.decision.trim(),
    feeling: p.feeling.trim(),
    note: p.note.trim(),
    parkedOn: p.parkedOn,
    decideOn: p.decideOn,
  };
}

/** Every waiting parked decision whose date has arrived. */
export function dueParkedItems(today = todayISO()): ScheduledParked[] {
  return loadParked()
    .filter((p) => isDueParked(p, today))
    .map(toScheduled);
}

/** Every waiting parked decision whose date is still ahead. */
export function upcomingParkedItems(today = todayISO()): ScheduledParked[] {
  return loadParked()
    .filter((p) => isUpcomingParked(p, today))
    .map(toScheduled);
}

/** Parked decisions whose date has arrived — folded into the homepage due
 *  badge alongside due reviews and tripwire checks. */
export function countDueParked(): number {
  const today = todayISO();
  return loadParked().filter((p) => isDueParked(p, today)).length;
}

/** Total parked decisions still waiting — the "never backed up" denominator. */
export function countParked(): number {
  return loadParked().filter((p) => !p.resolvedOn).length;
}

/** Parked decisions created strictly after the given ISO date — for the backup
 *  nudge. */
export function countParkedCreatedAfter(iso: string): number {
  return loadParked().filter((p) => p.parkedOn && p.parkedOn > iso).length;
}
