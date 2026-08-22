/**
 * The decision home (/decisions): everything you've worked on one call, in one
 * place — grouped by the decision itself, not scattered across the tools.
 *
 * For a dozen sessions the site's central complaint about itself has been the
 * same: you can walk one real decision through doors → pre-mortem → journal →
 * tripwire, and the carry through-line will thread your one-liner from tool to
 * tool so you never retype it — but once you've saved the pieces, there is no
 * single view that shows them back together. The return desk (/review) gathers
 * the *scheduled* half (what's due to check), and each tool keeps its own list,
 * but "everything I've worked on THIS decision" had no home. It was deferred
 * five sessions running as a larger, "schema-coupled" build wanting a shared
 * decision id the tools don't store.
 *
 * The insight that makes it buildable today without any schema change: the four
 * tools that actually *persist* a decision each store it in the field the carry
 * through-line seeds — the journal's `decision`, the pre-mortem's `plan`, the
 * tripwire's `guard`, the cooling-off tool's `decision`. A decision carried
 * across those tools therefore lands under the *same* line in each store, so
 * grouping by that line — normalized, exact — reassembles the arc precisely for
 * the case the home is for (one call, worked across several tools), and leaves
 * an independently-typed record standing cleanly on its own. Not a fuzzy match
 * that might merge unrelated calls: an exact match on the text the tools already
 * agree on.
 *
 * Same discipline as review.ts: this module *reads* — never writes — composing
 * each tool's own read side (loadLoggedDecisions, loadSavedPremortems,
 * loadTripwires, loadParked). Every tool still owns its storage; this only folds
 * their records into one shape and groups them. The answer-now tools (doors,
 * weigh, compare, …) compute in-session and persist nothing, so they aren't
 * here — the home gathers what was actually kept, and says so.
 *
 * `groupDecisions` is a pure function of its inputs, so the grouping logic is
 * unit-testable without a browser; `loadDecisions` is the thin browser-reading
 * wrapper around it.
 */

import { loadLoggedDecisions } from "./journal";
import { loadSavedPremortems } from "./premortem";
import { loadTripwires } from "./tripwires";
import { loadParked } from "./parked";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export type WorkedKind = "decision" | "premortem" | "tripwire" | "parked";

/** How an item stands, for the status pill's colour. */
export type WorkedTone = "open" | "resolved" | "alert";

/**
 * One saved record, normalized across the four persisting tools. The home never
 * needs the full record — just enough to show what it was, where it stands, and
 * how to get back to it.
 */
export type WorkedItem = {
  /** Unique across tools, e.g. "decision:ab12". */
  id: string;
  kind: WorkedKind;
  /** The tool's name, for the row's badge. */
  toolLabel: string;
  /** The decision line — the grouping key (raw; normalized only for matching). */
  subject: string;
  /** One line of specifics under the subject. */
  detail: string;
  /** A short status word ("armed", "reviewed", "cooling"). */
  status: string;
  tone: WorkedTone;
  /** ISO date you worked it — the record's own timestamp. */
  workedOn: string;
  /** The next scheduled return (ISO), or "" when nothing is still pending. */
  dueOn: string;
  /** Deep link back to where you continue or answer it. */
  href: string;
  /** The link's text. */
  actionLabel: string;
};

/** A decision, reassembled: every record that shares its line, in worked order. */
export type DecisionGroup = {
  /** Normalized subject, or `solo:<id>` for a record with no subject to group on. */
  key: string;
  /** The decision line, in the casing it was first written. */
  subject: string;
  /** The records, oldest first — the arc in the order you worked it. */
  items: WorkedItem[];
  /** Distinct tools this decision was worked in. */
  toolCount: number;
  /** Earliest workedOn across the items. */
  firstOn: string;
  /** Latest workedOn across the items. */
  lastOn: string;
  /** Records with a return still pending (a dueOn set). */
  openCount: number;
  /** Soonest pending return across the items (ISO), or "" if none pending. */
  nextDueOn: string;
  /** True when something here is due today or overdue. */
  hasDue: boolean;
};

/** Collapse whitespace, drop case — the matching key both a carried subject and
 *  a typed one resolve to, so the same line groups regardless of trivial drift. */
function normKey(subject: string): string {
  return subject.replace(/\s+/g, " ").trim().toLowerCase();
}

const str = (v: string | null | undefined) => (v ?? "").trim();

function outcomeWord(q: "good" | "bad" | "tbd" | null): string {
  if (q === "good") return "went as expected";
  if (q === "bad") return "didn't go as expected";
  if (q === "tbd") return "outcome still open";
  return "";
}

function journalItems(today: string): WorkedItem[] {
  return loadLoggedDecisions().map((d) => {
    const reviewed = d.reviewedOn != null;
    const due = !reviewed && !!d.reviewOn && d.reviewOn <= today;
    const conf = d.confidence != null ? ` · you were ${d.confidence}% sure` : "";
    let detail: string;
    if (reviewed) {
      const out = outcomeWord(d.outcomeQuality);
      detail = out ? `Reviewed — it ${out}.` : "Reviewed.";
    } else {
      detail = d.expectation
        ? `You expected: ${d.expectation}`
        : "Logged with a forecast; review scheduled.";
    }
    return {
      id: `decision:${d.id}`,
      kind: "decision",
      toolLabel: "Decision journal",
      subject: d.subject,
      detail: detail + conf,
      status: reviewed ? "reviewed" : due ? "review due" : "awaiting review",
      tone: reviewed ? "resolved" : due ? "alert" : "open",
      workedOn: d.decidedOn,
      dueOn: reviewed ? "" : d.reviewOn,
      href: `/decide?review=${encodeURIComponent(d.id)}`,
      actionLabel: reviewed ? "Open in the journal →" : "Answer in the journal →",
    };
  });
}

function premortemItems(today: string): WorkedItem[] {
  return loadSavedPremortems().map((pm) => {
    const armed = pm.reasons.filter(
      (r) => r.triage === "tripwire" && str(r.signal) && r.checkOn
    );
    const pendingChecks = armed.filter((r) => !r.checkedOn);
    const dueChecks = pendingChecks.filter((r) => r.checkOn <= today);
    const nextDue = pendingChecks
      .map((r) => r.checkOn)
      .sort((a, b) => a.localeCompare(b))[0];
    // Deep-link to the soonest pending check when there is one, so the desk lands
    // on the thing to answer; otherwise to the saved pre-mortem itself.
    const nextReason = pendingChecks.sort((a, b) =>
      a.checkOn.localeCompare(b.checkOn)
    )[0];
    const n = pm.reasons.length;
    const armedText =
      armed.length > 0
        ? `, ${armed.length} tripwire${armed.length === 1 ? "" : "s"} armed`
        : "";
    return {
      id: `premortem:${pm.id}`,
      kind: "premortem",
      toolLabel: "Pre-mortem",
      subject: pm.plan,
      detail: `${n} failure mode${n === 1 ? "" : "s"} imagined${armedText}.`,
      status:
        dueChecks.length > 0
          ? "check due"
          : pendingChecks.length > 0
            ? "watching"
            : "worked",
      tone: dueChecks.length > 0 ? "alert" : pendingChecks.length > 0 ? "open" : "resolved",
      workedOn: pm.createdOn,
      dueOn: nextDue ?? "",
      href: nextReason
        ? `/premortem?check=${encodeURIComponent(`${pm.id}:${nextReason.id}`)}`
        : "/premortem",
      actionLabel: nextReason ? "Answer in the room →" : "Open the pre-mortem →",
    };
  });
}

function tripwireItems(today: string): WorkedItem[] {
  return loadTripwires().map((t) => {
    const answered = !!t.checkedOn;
    const due = !answered && !!t.checkOn && t.checkOn <= today;
    const from = t.source ? ` · set from ${t.source}` : "";
    let detail: string;
    if (answered) {
      detail = t.fired
        ? "The signal fired — you stopped to reconsider."
        : "Checked — all clear.";
    } else {
      detail = str(t.signal) ? `Watch for: ${t.signal}` : "An armed tripwire.";
    }
    return {
      id: `tripwire:${t.id}`,
      kind: "tripwire",
      toolLabel: "Tripwire",
      subject: t.guard || "A tripwire you set",
      detail: detail + from,
      status: answered ? (t.fired ? "fired" : "all clear") : due ? "check due" : "armed",
      tone: answered ? (t.fired ? "alert" : "resolved") : due ? "alert" : "open",
      workedOn: t.createdOn,
      dueOn: answered ? "" : t.checkOn,
      href: `/tripwire?check=${encodeURIComponent(t.id)}`,
      actionLabel: answered ? "Open the tripwire →" : "Answer the tripwire →",
    };
  });
}

function parkedItems(today: string): WorkedItem[] {
  return loadParked().map((p) => {
    const resolved = !!p.resolvedOn;
    const due = !resolved && !!p.decideOn && p.decideOn <= today;
    let detail: string;
    if (resolved) {
      const moved =
        p.cooledMatch === "changed"
          ? " Waiting changed the call."
          : p.cooledMatch === "same"
            ? " The cold call matched the hot one."
            : "";
      detail = "Decided cold." + moved;
    } else {
      detail = p.feeling
        ? `Parked while ${p.feeling} — decide it cold.`
        : "Parked to sleep on — decide it cold.";
    }
    return {
      id: `parked:${p.id}`,
      kind: "parked",
      toolLabel: "Cooling-off",
      subject: p.decision || "A decision you're sleeping on",
      detail,
      status: resolved ? "decided" : due ? "ready to decide" : "cooling",
      tone: resolved ? "resolved" : due ? "alert" : "open",
      workedOn: p.parkedOn,
      dueOn: resolved ? "" : p.decideOn,
      href: `/cool?resume=${encodeURIComponent(p.id)}`,
      actionLabel: resolved ? "Open in cooling-off →" : "Decide it now →",
    };
  });
}

const minISO = (a: string, b: string): string =>
  !a ? b : !b ? a : a <= b ? a : b;
const maxISO = (a: string, b: string): string =>
  !a ? b : !b ? a : a >= b ? a : b;

/**
 * Fold worked items into decisions, grouped by their normalized subject. Pure —
 * no browser, no clock beyond the `today` passed in — so the grouping is
 * unit-testable. Items with no subject to group on each stand alone (keyed by
 * their own id), never merged into one "" bucket.
 *
 * Groups are returned most-recently-touched first; within a group, items run
 * oldest first, so a card reads as the arc in the order it was worked.
 */
export function groupDecisions(items: WorkedItem[], today: string): DecisionGroup[] {
  const groups = new Map<string, WorkedItem[]>();
  for (const item of items) {
    const norm = normKey(item.subject);
    const key = norm ? `k:${norm}` : `solo:${item.id}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  const result: DecisionGroup[] = [];
  for (const [key, bucket] of groups) {
    const sorted = [...bucket].sort((a, b) => {
      const c = a.workedOn.localeCompare(b.workedOn);
      return c !== 0 ? c : a.id.localeCompare(b.id);
    });
    let firstOn = "";
    let lastOn = "";
    let nextDueOn = "";
    let openCount = 0;
    let hasDue = false;
    const kinds = new Set<WorkedKind>();
    for (const it of sorted) {
      kinds.add(it.kind);
      if (it.workedOn) {
        firstOn = minISO(firstOn, it.workedOn);
        lastOn = maxISO(lastOn, it.workedOn);
      }
      if (it.dueOn) {
        openCount += 1;
        nextDueOn = minISO(nextDueOn, it.dueOn);
        if (it.dueOn <= today) hasDue = true;
      }
    }
    // The subject as first written — the origin record's casing, since items are
    // in worked order and the first is the earliest.
    const subject =
      sorted.find((it) => normKey(it.subject))?.subject || sorted[0].subject;
    result.push({
      key,
      subject,
      items: sorted,
      toolCount: kinds.size,
      firstOn,
      lastOn,
      openCount,
      nextDueOn,
      hasDue,
    });
  }

  // Most recently touched first; a group with a due item outranks a quiet one of
  // the same recency, so what needs you rises.
  result.sort((a, b) => {
    if (a.hasDue !== b.hasDue) return a.hasDue ? -1 : 1;
    const c = b.lastOn.localeCompare(a.lastOn);
    if (c !== 0) return c;
    return a.subject.localeCompare(b.subject);
  });
  return result;
}

export type DecisionsView = {
  groups: DecisionGroup[];
  /** Total saved records across the tools. */
  itemCount: number;
  /** Distinct decisions (groups). */
  decisionCount: number;
  /** Decisions with something still open (a pending return). */
  openDecisions: number;
  /** Decisions with something due today or overdue. */
  dueDecisions: number;
  today: string;
};

/**
 * Read every persisting tool's records from the browser and fold them into the
 * decision home. Returns an empty, safe view on the server or on any storage
 * failure (each underlying reader already degrades to []).
 */
export function loadDecisions(): DecisionsView {
  const today = todayISO();
  const items = [
    ...journalItems(today),
    ...premortemItems(today),
    ...tripwireItems(today),
    ...parkedItems(today),
  ];
  const groups = groupDecisions(items, today);
  return {
    groups,
    itemCount: items.length,
    decisionCount: groups.length,
    openDecisions: groups.filter((g) => g.openCount > 0).length,
    dueDecisions: groups.filter((g) => g.hasDue).length,
    today,
  };
}

/** A human phrase for a scheduled return date, relative to today. Mirrors the
 *  return desk's `whenLabel`, so the two surfaces speak the same way about time. */
export function dueLabel(dueOn: string, today: string): string {
  if (!dueOn) return "";
  const a = new Date(`${today}T00:00:00`).getTime();
  const b = new Date(`${dueOn}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return "";
  const rel = Math.round((a - b) / 86_400_000); // >0 overdue, <0 ahead
  if (rel > 0) {
    if (rel === 1) return "1 day overdue";
    if (rel < 14) return `${rel} days overdue`;
    if (rel < 60) return `${Math.round(rel / 7)} weeks overdue`;
    return `${Math.round(rel / 30)} months overdue`;
  }
  const ahead = -rel;
  if (ahead === 0) return "due today";
  if (ahead === 1) return "due tomorrow";
  if (ahead < 14) return `in ${ahead} days`;
  if (ahead < 60) return `in ${Math.round(ahead / 7)} weeks`;
  return `in ${Math.round(ahead / 30)} months`;
}
