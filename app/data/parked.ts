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

/**
 * When you come back cold and decide a parked call, the one thing worth
 * recording is whether cooling actually changed anything: `"same"` — the cold
 * call matched the hot one, the heat wasn't talking — or `"changed"` — waiting
 * moved you. `""` means you resolved it without saying (or haven't resolved it).
 * This is the empirical answer to the question the whole tool rests on: *does
 * sleeping on it actually change my mind?* Graded on return, never forced.
 */
export type WaitGrade = "" | "same" | "changed";

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
  /** Whether cooling changed the call, recorded on the cold return. See
   *  WaitGrade. "" until you say — grading is always optional. */
  cooledMatch: WaitGrade;
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
  const grade = (v: unknown): WaitGrade =>
    v === "same" || v === "changed" ? v : "";
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
    cooledMatch: grade(r.cooledMatch),
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
 *  go). Optionally record whether cooling changed the call (the wait grade);
 *  omit it to resolve without saying. Idempotent by id; a no-op if the id is
 *  gone. */
export function resolveParked(id: string, cooledMatch: WaitGrade = ""): void {
  saveParked(
    loadParked().map((p) =>
      p.id === id ? { ...p, resolvedOn: todayISO(), cooledMatch } : p
    )
  );
}

/** Send a resolved parked decision back to waiting — for one closed by mistake.
 *  Clears the wait grade too, since it's no longer decided. */
export function reopenParked(id: string): void {
  saveParked(
    loadParked().map((p) =>
      p.id === id ? { ...p, resolvedOn: "", cooledMatch: "" as WaitGrade } : p
    )
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

/** One open parked decision, flattened for the cooling-off tool's own list of
 *  what it's still holding for you — decision, when it comes back, and whether
 *  that day has arrived. */
export type OpenParked = {
  id: string;
  decision: string;
  feeling: string;
  decideOn: string;
  due: boolean;
};

/**
 * Every parked decision still waiting to be decided cold, soonest-return first,
 * with a `due` flag for the ones whose day has come. This is what /cool shows on
 * its own page — the tripwire tool lists its armed set; the cooling-off tool
 * should list the calls it's holding for you, so you can manage them without a
 * trip to the return desk.
 */
export function openParked(today = todayISO()): OpenParked[] {
  return loadParked()
    .filter((p) => !p.resolvedOn && !!p.decision.trim() && !!p.decideOn)
    .sort((a, b) => (a.decideOn < b.decideOn ? -1 : a.decideOn > b.decideOn ? 1 : 0))
    .map((p) => ({
      id: p.id,
      decision: p.decision.trim(),
      feeling: p.feeling.trim(),
      decideOn: p.decideOn,
      due: p.decideOn <= today,
    }));
}

/** The tally behind the cooling-off tool's own reading of itself: of the parked
 *  calls you came back and decided, how often waiting actually moved you. The
 *  empirical answer to "does sleeping on it change my mind?" */
export type WaitRecord = {
  /** Parked calls you resolved (decided cold or let go). */
  resolved: number;
  /** Of those, how many you graded (said same/changed) — the denominator that
   *  means something. */
  graded: number;
  /** Graded ones where cooling changed the call. */
  changed: number;
  /** Graded ones where the cold call matched the hot one. */
  same: number;
};

export function parkedWaitRecord(): WaitRecord {
  const resolvedList = loadParked().filter((p) => !!p.resolvedOn);
  const graded = resolvedList.filter(
    (p) => p.cooledMatch === "same" || p.cooledMatch === "changed"
  );
  return {
    resolved: resolvedList.length,
    graded: graded.length,
    changed: graded.filter((p) => p.cooledMatch === "changed").length,
    same: graded.filter((p) => p.cooledMatch === "same").length,
  };
}
