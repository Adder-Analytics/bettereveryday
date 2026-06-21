"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Plain, serializable shapes passed down from the server page. These mirror the
 * resolved situation data (see data/situations.ts) but carry only what the
 * worksheet needs, so the whole thing stays a Client Component boundary with
 * serializable props.
 */
export type WorksheetModel = {
  id: string;
  name: string;
  move: string;
  href: string;
};

export type WorksheetReference = {
  label: string;
  title: string;
  href: string;
};

export type WorksheetSituation = {
  id: string;
  title: string;
  scene: string;
  question: string;
  models: WorksheetModel[];
  references: WorksheetReference[];
};

/**
 * What we persist per situation while you're working it through. Versioned key
 * so the shape can evolve. `expectation`, `confidence`, and `reviewOn` are the
 * forecast — the part that turns a decision memo into a decision *journal*: a
 * record of what you expected and how sure you were, written before you know how
 * it turns out, so the result can't quietly rewrite it later (hindsight bias).
 */
type SituationEntry = {
  context: string;
  answers: Record<string, string>;
  conclusion: string;
  expectation: string;
  confidence: number | null;
  reviewOn: string; // ISO yyyy-mm-dd
};

type Store = Record<string, SituationEntry>;

/** Two-axis review: how it turned out, and — kept deliberately separate — */
/** whether the decision itself was good given only what you knew at the time. */
type OutcomeQuality = "good" | "bad" | "tbd";
type DecisionQuality = "again" | "different";

/**
 * A committed entry in the decision log. Snapshotted from a worksheet at the
 * moment you log it, so the log stays a self-contained record even if the
 * underlying situation data later changes. The review fields are filled in
 * later, when the review date comes due.
 */
type LogEntry = {
  id: string;
  situationId: string;
  situationTitle: string;
  question: string;
  decision: string;
  reasoning: { name: string; move: string; text: string }[];
  call: string;
  expectation: string;
  confidence: number | null;
  decidedOn: string; // ISO yyyy-mm-dd
  reviewOn: string; // ISO yyyy-mm-dd
  // Filled at review time:
  reviewedOn: string | null;
  outcome: string;
  outcomeQuality: OutcomeQuality | null;
  decisionQuality: DecisionQuality | null;
  lessons: string;
};

const STORAGE_KEY = "decide:v1";
const LOG_KEY = "decide:log:v1";

const CONFIDENCE_OPTIONS = [50, 60, 70, 80, 90] as const;
const REVIEW_DEFAULT_DAYS = 90;

// ---- date helpers (local-time ISO, no library) --------------------------
function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatHuman(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isDue(entry: LogEntry): boolean {
  return !entry.reviewedOn && !!entry.reviewOn && entry.reviewOn <= todayISO();
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyEntry(): SituationEntry {
  return {
    context: "",
    answers: {},
    conclusion: "",
    expectation: "",
    confidence: null,
    reviewOn: addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS),
  };
}

/**
 * Fill in any fields a stored entry is missing. Entries saved under the older
 * `decide:v1` shape (before the forecast fields existed) lack expectation /
 * confidence / reviewOn; normalizing on read keeps inputs controlled and stops
 * countFilled from touching undefined.
 */
function mergeEntry(raw: Partial<SituationEntry> | undefined | null): SituationEntry {
  const base = emptyEntry();
  if (!raw) return base;
  return {
    context: raw.context ?? base.context,
    answers: raw.answers ?? base.answers,
    conclusion: raw.conclusion ?? base.conclusion,
    expectation: raw.expectation ?? base.expectation,
    confidence: raw.confidence ?? base.confidence,
    reviewOn: raw.reviewOn || base.reviewOn,
  };
}

/**
 * Normalize a log entry read from storage or imported from a file. The log is
 * the one thing on this site worth protecting across years and devices, so it
 * has to survive shape drift (older entries, hand-edited or partial JSON) the
 * same way mergeEntry hardens the worksheet. Anything missing gets a safe
 * default; anything malformed gets dropped rather than rendered.
 */
function mergeLogEntry(raw: Partial<LogEntry> | null | undefined): LogEntry {
  const r = raw ?? {};
  const reasoning = Array.isArray(r.reasoning)
    ? r.reasoning.map((x) => ({
        name: typeof x?.name === "string" ? x.name : "",
        move: typeof x?.move === "string" ? x.move : "",
        text: typeof x?.text === "string" ? x.text : "",
      }))
    : [];
  const conf =
    typeof r.confidence === "number" &&
    (CONFIDENCE_OPTIONS as readonly number[]).includes(r.confidence)
      ? r.confidence
      : null;
  const oq: OutcomeQuality | null =
    r.outcomeQuality === "good" || r.outcomeQuality === "bad" || r.outcomeQuality === "tbd"
      ? r.outcomeQuality
      : null;
  const dq: DecisionQuality | null =
    r.decisionQuality === "again" || r.decisionQuality === "different"
      ? r.decisionQuality
      : null;
  return {
    id: typeof r.id === "string" && r.id ? r.id : newId(),
    situationId: typeof r.situationId === "string" ? r.situationId : "",
    situationTitle: typeof r.situationTitle === "string" && r.situationTitle ? r.situationTitle : "A decision",
    question: typeof r.question === "string" ? r.question : "",
    decision: typeof r.decision === "string" ? r.decision : "",
    reasoning,
    call: typeof r.call === "string" ? r.call : "",
    expectation: typeof r.expectation === "string" ? r.expectation : "",
    confidence: conf,
    decidedOn: typeof r.decidedOn === "string" && r.decidedOn ? r.decidedOn : todayISO(),
    reviewOn: typeof r.reviewOn === "string" && r.reviewOn ? r.reviewOn : addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS),
    reviewedOn: typeof r.reviewedOn === "string" && r.reviewedOn ? r.reviewedOn : null,
    outcome: typeof r.outcome === "string" ? r.outcome : "",
    outcomeQuality: oq,
    decisionQuality: dq,
    lessons: typeof r.lessons === "string" ? r.lessons : "",
  };
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/** How many of the worksheet's text fields have content. Defensive against
 *  partial entries persisted under the older shape. */
function countFilled(raw: Partial<SituationEntry>): number {
  const entry = mergeEntry(raw);
  let n = 0;
  if (entry.context.trim()) n++;
  if (entry.conclusion.trim()) n++;
  if (entry.expectation.trim()) n++;
  for (const v of Object.values(entry.answers)) if (v?.trim()) n++;
  return n;
}

function buildMemo(s: WorksheetSituation, entry: SituationEntry): string {
  const lines: string[] = [];
  lines.push("DECISION MEMO");
  lines.push(s.title);
  lines.push(formatHuman(todayISO()));
  lines.push("");
  if (entry.context.trim()) {
    lines.push(`The decision: ${entry.context.trim()}`);
    lines.push("");
  }
  lines.push(`Ask: ${s.question}`);
  lines.push("");
  for (const m of s.models) {
    const a = (entry.answers[m.id] ?? "").trim();
    lines.push(m.name.toUpperCase());
    lines.push(m.move);
    lines.push(a ? `→ ${a}` : "→ (not yet worked through)");
    lines.push("");
  }
  lines.push("WHAT I'M GOING TO DO");
  lines.push(entry.conclusion.trim() || "(undecided)");
  lines.push("");
  lines.push("WHAT I EXPECT TO HAPPEN");
  lines.push(entry.expectation.trim() || "(not stated)");
  if (entry.confidence != null) lines.push(`Confidence: ${entry.confidence}%`);
  lines.push(`Review on: ${formatHuman(entry.reviewOn)}`);
  lines.push("");
  lines.push("— worked through with the playbook at Better Every Day · /decide");
  return lines.join("\n");
}

function buildLogMemo(e: LogEntry): string {
  const lines: string[] = [];
  lines.push("DECISION JOURNAL ENTRY");
  lines.push(e.situationTitle);
  lines.push(`Decided: ${formatHuman(e.decidedOn)}`);
  lines.push("");
  if (e.decision.trim()) {
    lines.push(`The decision: ${e.decision.trim()}`);
    lines.push("");
  }
  lines.push(`Ask: ${e.question}`);
  lines.push("");
  for (const r of e.reasoning) {
    if (!r.text.trim()) continue;
    lines.push(r.name.toUpperCase());
    lines.push(`→ ${r.text.trim()}`);
    lines.push("");
  }
  lines.push("THE CALL");
  lines.push(e.call.trim() || "(undecided)");
  lines.push("");
  lines.push("WHAT I EXPECTED");
  lines.push(e.expectation.trim() || "(not stated)");
  if (e.confidence != null) lines.push(`Confidence at the time: ${e.confidence}%`);
  lines.push("");
  if (e.reviewedOn) {
    lines.push(`REVIEWED ${formatHuman(e.reviewedOn)}`);
    lines.push("What actually happened:");
    lines.push(e.outcome.trim() || "(not recorded)");
    if (e.outcomeQuality) lines.push(`Outcome: ${OUTCOME_LABELS[e.outcomeQuality]}`);
    if (e.decisionQuality)
      lines.push(`The decision itself, ignoring the result: ${DECISION_LABELS[e.decisionQuality]}`);
    if (e.lessons.trim()) {
      lines.push("What I'd carry forward:");
      lines.push(e.lessons.trim());
    }
  } else {
    lines.push(`Review due: ${formatHuman(e.reviewOn)}`);
  }
  lines.push("");
  lines.push("— decision journal at Better Every Day · /decide");
  return lines.join("\n");
}

// ---- calendar reminder (.ics) -------------------------------------------
// The journal's whole thesis is "come back when the outcome is in" — but that
// only happens if something reminds you, and a badge you only see if you visit
// the site can't. This writes a standard iCalendar file (RFC 5545) you can drop
// into Google / Apple / Outlook, so the review lands in the one place you'll
// actually look on the day. Generated entirely in the browser; like everything
// else here, nothing is sent anywhere.
const SITE_URL = "https://bettereveryday.vercel.app";

/** Escape a value for an iCalendar TEXT property (RFC 5545 §3.3.11). */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold content lines to <=75 chars; continuation lines begin with a space. */
function icsFold(line: string): string {
  if (line.length <= 75) return line;
  const chunks = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 0) {
    chunks.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return chunks.join("\r\n");
}

/** Current time as a UTC iCalendar timestamp, YYYYMMDDTHHMMSSZ. */
function icsStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** The VEVENT block for one decision's review — reused by the single-entry and
 *  bulk builders so both emit identical, spec-conformant events. */
function icsVEvent(e: LogEntry): string[] {
  const day = e.reviewOn.replace(/-/g, ""); // YYYYMMDD
  // A 9:00–9:30 floating-local event with an alarm at start: it fires at a
  // humane hour wherever you happen to be, instead of at midnight like a bare
  // all-day event, and it carries enough context to act on without the site.
  const dtStart = `${day}T090000`;
  const dtEnd = `${day}T093000`;
  const title = (e.decision.trim() || e.situationTitle).replace(/\s+/g, " ").trim();

  const desc: string[] = [
    "Time to review a decision you logged — grade it before memory rewrites what you expected.",
  ];
  if (e.question.trim()) desc.push(`\nYou asked: ${e.question.trim()}`);
  if (e.call.trim()) desc.push(`\nYour call: ${e.call.trim()}`);
  if (e.expectation.trim()) {
    const conf = e.confidence != null ? ` (${e.confidence}% confident)` : "";
    desc.push(`\nYou expected: ${e.expectation.trim()}${conf}`);
  }
  desc.push(
    "\nNow: what actually happened — and was it a good decision regardless of how it turned out?"
  );
  desc.push(`\nOpen your journal: ${SITE_URL}/decide?log=1`);

  return [
    "BEGIN:VEVENT",
    `UID:decide-${e.id}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(`Review your decision: ${title}`)}`,
    `DESCRIPTION:${icsEscape(desc.join(""))}`,
    `URL:${SITE_URL}/decide?log=1`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Review your decision",
    "TRIGGER:-PT0M",
    "END:VALARM",
    "END:VEVENT",
  ];
}

/** Wrap one or more VEVENT blocks in a VCALENDAR envelope, fold to ≤75 chars,
 *  and join with CRLF per RFC 5545. */
function wrapCalendar(events: string[][]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Better Every Day//Decision Journal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flat(),
    "END:VCALENDAR",
  ];
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

function buildICS(e: LogEntry): string {
  return wrapCalendar([icsVEvent(e)]);
}

/** One calendar file holding a review reminder for every still-pending
 *  decision — back-fill the whole backlog in one drop instead of one at a
 *  time. Stable per-entry UIDs mean re-importing only updates, never dupes. */
function buildICSBulk(entries: LogEntry[]): string {
  return wrapCalendar(entries.map(icsVEvent));
}

const OUTCOME_LABELS: Record<OutcomeQuality, string> = {
  good: "Turned out well",
  bad: "Turned out badly",
  tbd: "Too early to tell",
};

const DECISION_LABELS: Record<DecisionQuality, string> = {
  again: "I'd make the same call",
  different: "I'd decide differently",
};

/**
 * A worked example — one fully-filled, already-reviewed entry shown read-only so
 * a first-timer can see what a good forecast and an honest review look like
 * before writing their own. Deliberately the hardest, most instructive case: a
 * good decision that got a bad outcome. The two-axis grade (turned out badly,
 * but I'd make the same call) is exactly the resulting-proof distinction the
 * whole review screen exists to teach. It is never written into the user's log.
 */
const SAMPLE_ENTRY: LogEntry = {
  id: "sample",
  situationId: "sample",
  situationTitle: "A high-stakes, hard-to-reverse decision",
  question: "What does this look like if it goes wrong, and can I live with that?",
  decision: "Leave a stable job to join an early-stage startup as employee #6.",
  reasoning: [
    {
      name: "Inversion",
      move: "Ask what would make this a clear mistake, then check those failure modes.",
      text:
        "The obvious way this goes wrong: the company runs out of money and I'm job-hunting in a year with a gap and a pay cut. I checked: 14 months of runway, a lead investor who has bridged before. Survivable, not catastrophic — I have 6 months of savings.",
    },
    {
      name: "Expected value",
      move: "Weigh outcomes by how likely they are, not by how vivid they are.",
      text:
        "Maybe 40% this is a real win (equity + a role I can't get elsewhere yet), 60% it folds or stalls. Even the downside leaves me more hireable for having operated at that altitude. The upside is large and the floor is not the floor I feared.",
    },
    {
      name: "Reversibility",
      move: "One-way doors deserve more caution than two-way doors.",
      text:
        "Less one-way than it feels. My field is hiring; a former manager said the door stays open. The thing I can't get back is the year — but I'd spend that year learning either way.",
    },
  ],
  call:
    "Take it. The downside is recoverable and the upside isn't available any other way. The one reason that decided it: I'd regret not trying more than I'd regret a year that didn't work out.",
  expectation:
    "Within a year I'll have shipped something I'm proud of and learned more than I would have by staying — whether or not the company makes it.",
  confidence: 70,
  decidedOn: "2026-01-12",
  reviewOn: "2026-06-12",
  reviewedOn: "2026-06-14",
  outcome:
    "The company didn't make it — we wound down at month nine after the next round fell through. So the thing I was 70% unsure about happened. But I shipped the payments rewrite end to end, ran a team for the first time, and landed a better role within five weeks of the wind-down.",
  outcomeQuality: "bad",
  decisionQuality: "again",
  lessons:
    "Grade the bet, not the result: the company folding was inside the 60% I'd priced in, and everything I decided on still held. What I'd carry forward is that my real floor was higher than my gut's floor — I'd weighted the vivid disaster more than its actual probability. Next time, write the floor down in numbers before deciding, like I did here.",
};

/**
 * Calibration: the one thing only a journal can show you. Group reviewed entries
 * by the confidence you claimed at the time, and compare it to how often things
 * actually turned out the way you predicted. "good" means it went as expected
 * (a hit); "bad" means it didn't (a miss); "too early to tell" is excluded
 * because it isn't yet a resolved question. Grounded in the calibration idea
 * behind Tetlock's forecasting work and Parrish's decision-journal template,
 * but kept to the same coarse buckets the forecast uses — no false precision.
 */
type CalBucket = { confidence: number; n: number; hits: number };
function computeCalibration(log: LogEntry[]): {
  buckets: CalBucket[];
  scored: number;
  hits: number;
} {
  const scorable = log.filter(
    (e) =>
      e.reviewedOn &&
      e.confidence != null &&
      (e.outcomeQuality === "good" || e.outcomeQuality === "bad")
  );
  const buckets: CalBucket[] = CONFIDENCE_OPTIONS.map((c) => {
    const inBucket = scorable.filter((e) => e.confidence === c);
    return {
      confidence: c,
      n: inBucket.length,
      hits: inBucket.filter((e) => e.outcomeQuality === "good").length,
    };
  }).filter((b) => b.n > 0);
  return {
    buckets,
    scored: scorable.length,
    hits: scorable.filter((e) => e.outcomeQuality === "good").length,
  };
}

const CALIBRATION_MIN = 4; // below this, the numbers say more about luck than calibration

/**
 * Resulting: the journal's most thesis-central read, and the one it has been
 * collecting the data for all along without ever summarizing it. At review you
 * grade two things on purpose-separate axes — how it *turned out* (outcome) and,
 * ignoring the result, whether it was *the right call* (decision quality). The
 * trap the whole site exists to fight, which Annie Duke named "resulting," is
 * judging the second by the first: filing a good call that got unlucky as a
 * mistake, and a bad call that got lucky as wisdom. Crossing the two axes makes
 * that visible — and unlike a calibration curve, these are plain category counts,
 * so they stay honest even at the small samples a personal journal produces.
 *
 *               turned out WELL        turned out BADLY
 *  same call    earned (skill)         priced-in bad luck
 *  different    got away with it       genuine mistake
 *
 * The two off-diagonal cells are the *divergences* — every decision where the
 * outcome and your own honest judgment point opposite ways. That count is the
 * single most useful number here: it's the proof, in your own hand, that you
 * cannot read decision quality off results.
 */
type ResultingCell = "earned" | "unlucky" | "lucky" | "mistake";
function computeResulting(log: LogEntry[]): {
  counts: Record<ResultingCell, number>;
  scored: number;
  keptSame: number; // decisions you'd make again, regardless of outcome
  goodOutcomes: number; // decisions that turned out well, regardless of the call
  divergences: number; // outcome and judgment disagree
} {
  const scorable = log.filter(
    (e) =>
      e.reviewedOn &&
      (e.outcomeQuality === "good" || e.outcomeQuality === "bad") &&
      (e.decisionQuality === "again" || e.decisionQuality === "different")
  );
  const counts: Record<ResultingCell, number> = {
    earned: 0,
    unlucky: 0,
    lucky: 0,
    mistake: 0,
  };
  for (const e of scorable) {
    const good = e.outcomeQuality === "good";
    const same = e.decisionQuality === "again";
    if (good && same) counts.earned++;
    else if (!good && same) counts.unlucky++;
    else if (good && !same) counts.lucky++;
    else counts.mistake++;
  }
  return {
    counts,
    scored: scorable.length,
    keptSame: counts.earned + counts.unlucky,
    goodOutcomes: counts.earned + counts.lucky,
    divergences: counts.unlucky + counts.lucky,
  };
}

const RESULTING_MIN = 3; // one or two reviews isn't a pattern, but counts never lie

const textareaClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-y leading-relaxed";

// =========================================================================

export default function DecideClient({
  situations,
}: {
  situations: WorksheetSituation[];
}) {
  const [hydrated, setHydrated] = useState(false);
  const [store, setStore] = useState<Store>({});
  const [log, setLog] = useState<LogEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [screen, setScreen] = useState<"work" | "log">("work");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [viewingSample, setViewingSample] = useState(false);
  const [copied, setCopied] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [loggedEntry, setLoggedEntry] = useState<LogEntry | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved work + the log, and honor a ?s=<id> deep link from the playbook.
  // This reads localStorage, which only exists on the client, so it must run
  // after mount — the first client render uses empty state and matches the
  // server, so the picker SSRs; saved badges and the deep link are applied here.
  useEffect(() => {
    const savedStore = loadJSON<Store>(STORAGE_KEY, {});
    const savedLog = loadJSON<LogEntry[]>(LOG_KEY, []);
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("s");
    const wantsLog = params.get("log") === "1";
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setStore(savedStore && typeof savedStore === "object" ? savedStore : {});
    setLog(Array.isArray(savedLog) ? savedLog.map(mergeLogEntry) : []);
    if (requested && situations.some((s) => s.id === requested)) {
      setActiveId(requested);
    } else if (wantsLog) {
      setScreen("log");
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [situations]);

  // Persist the worksheet store after hydration (so we never clobber saved work
  // with the empty initial state on first paint).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* storage full or unavailable — the worksheet still works in-memory */
    }
  }, [store, hydrated]);

  // Persist the log after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(LOG_KEY, JSON.stringify(log));
    } catch {
      /* storage full or unavailable */
    }
  }, [log, hydrated]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  const active = situations.find((s) => s.id === activeId) ?? null;
  const entry = mergeEntry(activeId ? store[activeId] : null);
  const dueCount = log.filter(isDue).length;

  const update = useCallback(
    (id: string, fn: (e: SituationEntry) => SituationEntry) => {
      setStore((prev) => ({ ...prev, [id]: fn(mergeEntry(prev[id])) }));
    },
    []
  );

  const selectSituation = useCallback((id: string) => {
    setActiveId(id || null);
    setScreen("work");
    setCopied(false);
    setJustLogged(false);
    setLoggedEntry(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const goLog = useCallback(() => {
    setScreen("log");
    setReviewId(null);
    setActiveId(null);
    setViewingSample(false);
    setImportNote(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const openSample = useCallback(() => {
    setViewingSample(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  // Download the log as a JSON file. The journal lives only in this browser by
  // design; this is the escape hatch that makes that defensible — a backup you
  // own, and the way to carry it to another device, with nothing sent anywhere.
  const exportLog = useCallback(() => {
    try {
      const payload = JSON.stringify(
        { app: "bettereveryday-decision-log", version: 1, exportedAt: todayISO(), log },
        null,
        2
      );
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `decision-log-${todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      if (typeof window !== "undefined") window.alert("Couldn't export the log in this browser.");
    }
  }, [log]);

  // Merge a previously exported file back in. Entries are matched by id so
  // re-importing the same file (or a partial overlap) never duplicates; only
  // genuinely new decisions are added. Existing entries are left untouched, so
  // an import can't quietly overwrite a review you've already written.
  const importLog = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const rawEntries: unknown = Array.isArray(parsed) ? parsed : parsed?.log;
          if (!Array.isArray(rawEntries)) throw new Error("not a decision log");
          const incoming = rawEntries.map(mergeLogEntry);
          setLog((prev) => {
            const have = new Set(prev.map((e) => e.id));
            const added = incoming.filter((e) => !have.has(e.id));
            setImportNote(
              added.length === 0
                ? "Nothing new to import — those decisions are already in your log."
                : `Imported ${added.length} decision${added.length === 1 ? "" : "s"}.`
            );
            return added.length === 0 ? prev : [...added, ...prev];
          });
        } catch {
          setImportNote("That file didn't look like a decision-log export.");
        }
      };
      reader.onerror = () => setImportNote("Couldn't read that file.");
      reader.readAsText(file);
    },
    []
  );

  // Download a calendar reminder for one decision's review date. The journal
  // can only pay off if you come back; this puts the "come back" into the
  // calendar you already check, generated locally with nothing sent anywhere.
  const saveICS = useCallback((ics: string, filename: string) => {
    try {
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      if (typeof window !== "undefined")
        window.alert("Couldn't create the calendar file in this browser.");
    }
  }, []);

  const downloadICS = useCallback(
    (e: LogEntry) => saveICS(buildICS(e), `review-decision-${e.reviewOn}.ics`),
    [saveICS]
  );

  // One file with a reminder for every decision still awaiting review — so a
  // backlog of pending reviews can be back-filled into the calendar in one drop
  // instead of opening each entry. Stable per-entry UIDs keep re-adds idempotent.
  const downloadAllICS = useCallback(() => {
    const pending = log.filter((e) => !e.reviewedOn);
    if (pending.length === 0) return;
    saveICS(buildICSBulk(pending), `review-decisions-${todayISO()}.ics`);
  }, [log, saveICS]);

  const copy = useCallback(async (text: string) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
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
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const logDecision = useCallback(() => {
    if (!active) return;
    const e = mergeEntry(store[active.id]);
    if (!e.context.trim() && !e.conclusion.trim()) {
      if (typeof window !== "undefined") {
        window.alert(
          "Add at least the decision in one line, or the call you're making, before logging it."
        );
      }
      return;
    }
    const newEntry: LogEntry = {
      id: newId(),
      situationId: active.id,
      situationTitle: active.title,
      question: active.question,
      decision: e.context,
      reasoning: active.models.map((m) => ({
        name: m.name,
        move: m.move,
        text: e.answers[m.id] ?? "",
      })),
      call: e.conclusion,
      expectation: e.expectation,
      confidence: e.confidence,
      decidedOn: todayISO(),
      reviewOn: e.reviewOn || addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS),
      reviewedOn: null,
      outcome: "",
      outcomeQuality: null,
      decisionQuality: null,
      lessons: "",
    };
    setLog((prev) => [newEntry, ...prev]);
    setJustLogged(true);
    setLoggedEntry(newEntry);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [active, store]);

  const updateLogEntry = useCallback(
    (id: string, fn: (e: LogEntry) => LogEntry) => {
      setLog((prev) => prev.map((e) => (e.id === id ? fn(e) : e)));
    },
    []
  );

  const deleteLogEntry = useCallback(
    (id: string) => {
      if (
        typeof window !== "undefined" &&
        !window.confirm("Delete this decision from your log? This can't be undone.")
      ) {
        return;
      }
      setLog((prev) => prev.filter((e) => e.id !== id));
      setReviewId(null);
    },
    []
  );

  const clearActive = useCallback(() => {
    if (!activeId) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("Clear everything you've written for this situation?")
    ) {
      return;
    }
    setStore((prev) => {
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
    setJustLogged(false);
    setLoggedEntry(null);
  }, [activeId]);

  // ---- The worked example (read-only, never enters the user's log) ------
  if (viewingSample) {
    return (
      <SampleEntry
        onBack={() => {
          setViewingSample(false);
          if (typeof window !== "undefined") window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  // ---- The decision log -------------------------------------------------
  if (screen === "log") {
    const reviewing = reviewId ? log.find((e) => e.id === reviewId) ?? null : null;
    if (reviewing) {
      return (
        <ReviewDetail
          entry={reviewing}
          onBack={() => setReviewId(null)}
          onChange={(fn) => updateLogEntry(reviewing.id, fn)}
          onDelete={() => deleteLogEntry(reviewing.id)}
          onCopy={() => copy(buildLogMemo(reviewing))}
          onReminder={() => downloadICS(reviewing)}
          copied={copied}
        />
      );
    }
    return (
      <LogList
        log={log}
        onOpen={(id) => {
          setReviewId(id);
          if (typeof window !== "undefined") window.scrollTo({ top: 0 });
        }}
        onBack={() => selectSituation("")}
        onExport={exportLog}
        onImport={importLog}
        onViewSample={openSample}
        onRemindAll={downloadAllICS}
        importNote={importNote}
      />
    );
  }

  // ---- Situation picker -------------------------------------------------
  if (!active) {
    return (
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-6">
          What kind of decision are you in?
        </h2>
        <ul className="space-y-3">
          {situations.map((s) => {
            const saved = store[s.id];
            const filled = saved ? countFilled(saved) : 0;
            const total = s.models.length + 3; // context + models + conclusion + expectation
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => selectSituation(s.id)}
                  className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 hover:border-[var(--accent)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                      {s.title}
                    </span>
                    {filled > 0 && (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)] mt-0.5">
                        {filled}/{total} saved
                      </span>
                    )}
                  </div>
                  <span className="mt-1 block text-sm text-[var(--muted)] leading-relaxed">
                    {s.scene}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {hydrated && log.length > 0 && (
          <button
            type="button"
            onClick={goLog}
            className="mt-8 w-full text-left rounded-lg border border-dashed border-[var(--border)] px-4 py-3 hover:border-[var(--accent)] transition-colors"
          >
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Your decision log →
            </span>
            <span className="mt-1 block text-sm text-[var(--muted)] leading-relaxed">
              {log.length} decision{log.length === 1 ? "" : "s"} logged
              {dueCount > 0 ? ` · ${dueCount} due for review` : ""}. Come back when
              the outcome is in and compare it against what you expected.
            </span>
          </button>
        )}

        <p className="mt-6 text-sm text-[var(--muted)] leading-relaxed">
          Not sure what a finished entry looks like?{" "}
          <button
            type="button"
            onClick={openSample}
            className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
          >
            See a worked example →
          </button>
        </p>

        <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
          Everything you write stays in this browser — it&rsquo;s saved locally and
          never sent anywhere. Work a decision through, log it with what you expect
          to happen, and the log reminds you to come back and check. You can{" "}
          {hydrated && log.length > 0 ? "export it any time as a backup." : "export it as a backup once you've logged one."}
        </p>
      </div>
    );
  }

  // ---- The worksheet for one situation ----------------------------------
  return (
    <div>
      <button
        type="button"
        onClick={() => selectSituation("")}
        className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
      >
        ← A different situation
      </button>

      <h2 className="mt-6 text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug">
        {active.title}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        {active.scene}
      </p>

      <div className="mt-8">
        <label
          htmlFor="decide-context"
          className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
        >
          The decision, in one line
        </label>
        <textarea
          id="decide-context"
          rows={2}
          value={entry.context}
          onChange={(e) =>
            update(active.id, (prev) => ({ ...prev, context: e.target.value }))
          }
          placeholder="e.g. Take the offer in Berlin, or stay and wait for the promotion?"
          className={textareaClass}
        />
      </div>

      <p className="mt-8 text-sm font-medium text-[var(--foreground)] pl-4 border-l-2 border-[var(--accent)] leading-relaxed">
        Ask: {active.question}
      </p>

      <div className="mt-8 space-y-8">
        {active.models.map((m) => (
          <div key={m.id}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {m.name}
              </h3>
              <Link
                href={m.href}
                className="shrink-0 text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                what is this?
              </Link>
            </div>
            <p className="mt-1 mb-2 text-sm text-[var(--muted)] leading-relaxed">
              {m.move}
            </p>
            <textarea
              rows={3}
              value={entry.answers[m.id] ?? ""}
              onChange={(e) =>
                update(active.id, (prev) => ({
                  ...prev,
                  answers: { ...prev.answers, [m.id]: e.target.value },
                }))
              }
              placeholder="Your thinking…"
              aria-label={`Your thinking on ${m.name}`}
              className={textareaClass}
            />
          </div>
        ))}
      </div>

      <div className="mt-10">
        <label
          htmlFor="decide-conclusion"
          className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
        >
          What I&rsquo;m going to do
        </label>
        <textarea
          id="decide-conclusion"
          rows={3}
          value={entry.conclusion}
          onChange={(e) =>
            update(active.id, (prev) => ({
              ...prev,
              conclusion: e.target.value,
            }))
          }
          placeholder="The call, and the one reason that decided it. Write it down now — it's the part you'll want to check against later."
          className={textareaClass}
        />
      </div>

      {/* The forecast — what turns the memo into a journal you can learn from. */}
      <div className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The forecast
        </h3>
        <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
          Before you know how it turns out, pin down what you expect and how sure
          you are. This is the part the result can&rsquo;t rewrite — and the only way
          to find out, later, whether your gut is actually calibrated.
        </p>

        <div className="mt-5">
          <label
            htmlFor="decide-expectation"
            className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
          >
            What I expect to happen
          </label>
          <textarea
            id="decide-expectation"
            rows={2}
            value={entry.expectation}
            onChange={(e) =>
              update(active.id, (prev) => ({ ...prev, expectation: e.target.value }))
            }
            placeholder="The specific outcome you're predicting — concrete enough that you'll know whether it came true."
            className={textareaClass}
          />
        </div>

        <div className="mt-5">
          <span className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            How confident — that it goes the way you expect
          </span>
          <div className="flex flex-wrap gap-2">
            {CONFIDENCE_OPTIONS.map((c) => {
              const selected = entry.confidence === c;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    update(active.id, (prev) => ({
                      ...prev,
                      confidence: prev.confidence === c ? null : c,
                    }))
                  }
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
                  }`}
                >
                  {c}%
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="decide-review"
            className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
          >
            Review this on
          </label>
          <input
            id="decide-review"
            type="date"
            value={entry.reviewOn}
            min={todayISO()}
            onChange={(e) =>
              update(active.id, (prev) => ({ ...prev, reviewOn: e.target.value }))
            }
            className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={logDecision}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
        >
          Save to my decision log
        </button>
        <button
          type="button"
          onClick={() => copy(buildMemo(active, entry))}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors"
        >
          {copied ? "Copied ✓" : "Copy as a memo"}
        </button>
        <button
          type="button"
          onClick={clearActive}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Clear this worksheet
        </button>
      </div>

      {justLogged && (
        <div className="mt-4 rounded-lg border border-[var(--accent)] bg-[var(--card)] px-4 py-3">
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            Logged, with today&rsquo;s date and a review set for{" "}
            {formatHuman(entry.reviewOn)}. The journal only pays off if you come
            back when the outcome is in — so put the review where you&rsquo;ll
            actually see it.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {loggedEntry && (
              <button
                type="button"
                onClick={() => downloadICS(loggedEntry)}
                className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Add the review to my calendar ↓
              </button>
            )}
            <button
              type="button"
              onClick={goLog}
              className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              See your decision log →
            </button>
          </div>
        </div>
      )}

      {active.references.length > 0 && (
        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Go deeper
          </span>
          {active.references.map((ref) => (
            <Link
              key={ref.href}
              href={ref.href}
              className="text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              {ref.title} →
            </Link>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
        Saved automatically in this browser. Come back and it&rsquo;ll still be
        here. See the same situation in the{" "}
        <Link
          href={`/playbook#${active.id}`}
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          playbook
        </Link>
        .
      </p>
    </div>
  );
}

// =========================================================================
// The decision log: every committed decision, newest first, with the ones
// whose review date has arrived flagged. This is the half of a decision
// journal that actually pays off — you come back and confront what you
// predicted with what happened.

function LogList({
  log,
  onOpen,
  onBack,
  onExport,
  onImport,
  onViewSample,
  onRemindAll,
  importNote,
}: {
  log: LogEntry[];
  onOpen: (id: string) => void;
  onBack: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onViewSample: () => void;
  onRemindAll: () => void;
  importNote: string | null;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const sorted = [...log].sort((a, b) => {
    const aDue = isDue(a);
    const bDue = isDue(b);
    if (aDue !== bDue) return aDue ? -1 : 1; // due-for-review first
    return b.decidedOn.localeCompare(a.decidedOn); // then newest decided
  });
  const dueCount = log.filter(isDue).length;
  const pendingCount = log.filter((e) => !e.reviewedOn).length;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
      >
        ← Work a new decision
      </button>

      <h2 className="mt-6 text-xl font-semibold tracking-tight text-[var(--foreground)]">
        Your decision log
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        {log.length} decision{log.length === 1 ? "" : "s"} logged
        {dueCount > 0 ? (
          <>
            {" "}· <span className="text-[var(--accent)] font-medium">{dueCount} due for review</span>
          </>
        ) : (
          " · none due for review yet"
        )}
        . Open one to record what actually happened — and to see it next to what
        you expected at the time.
      </p>

      {pendingCount > 1 && (
        <button
          type="button"
          onClick={onRemindAll}
          className="mt-4 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Add all {pendingCount} pending reviews to my calendar ↓
        </button>
      )}

      <Resulting log={log} />
      <Calibration log={log} />

      {log.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)] leading-relaxed">
          Nothing logged yet. Work a decision through and hit{" "}
          <em>Save to my decision log</em> to start.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {sorted.map((e) => {
            const due = isDue(e);
            const reviewed = !!e.reviewedOn;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onOpen(e.id)}
                  className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 hover:border-[var(--accent)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                      {e.decision.trim() || e.situationTitle}
                    </span>
                    <span
                      className={`shrink-0 text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${
                        due
                          ? "text-[var(--accent)]"
                          : reviewed
                            ? "text-[var(--muted)]"
                            : "text-[var(--muted)]"
                      }`}
                    >
                      {due ? "Review due" : reviewed ? "Reviewed" : "Logged"}
                    </span>
                  </div>
                  <span className="mt-1 block text-xs text-[var(--muted)] leading-relaxed">
                    {e.situationTitle}
                  </span>
                  <span className="mt-1.5 block text-xs text-[var(--muted)]">
                    Decided {formatHuman(e.decidedOn)}
                    {e.confidence != null ? ` · ${e.confidence}% confident` : ""}
                    {reviewed
                      ? ` · reviewed ${formatHuman(e.reviewedOn as string)}`
                      : ` · review ${formatHuman(e.reviewOn)}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Backup / portability. The journal is local by design; this is what
          keeps that from meaning "lose it when you clear your browser." */}
      <div className="mt-10 pt-6 border-t border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {log.length > 0 && (
            <button
              type="button"
              onClick={onExport}
              className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Export as a file ↓
            </button>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Import a backup ↑
          </button>
          <button
            type="button"
            onClick={onViewSample}
            className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
          >
            See a worked example
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = ""; // allow re-importing the same file
            }}
          />
        </div>
        {importNote && (
          <p className="mt-3 text-sm text-[var(--foreground)]">{importNote}</p>
        )}
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Your log never leaves this browser. Export downloads a private copy you
          own — back it up, or import it on another device. Importing only adds
          decisions you don&rsquo;t already have; it never overwrites a review.
        </p>
      </div>
    </div>
  );
}

// =========================================================================
// Calibration: of the decisions you were N% sure of, how many actually went
// the way you predicted? It's the feedback a journal exists to give and that
// memory alone can't — but only once enough decisions have been reviewed that
// the answer is about you and not about luck.

function Calibration({ log }: { log: LogEntry[] }) {
  const { buckets, scored, hits } = computeCalibration(log);
  if (scored === 0) return null;

  if (scored < CALIBRATION_MIN) {
    const left = CALIBRATION_MIN - scored;
    return (
      <div className="mt-8 rounded-lg border border-dashed border-[var(--border)] px-4 py-3">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">Calibration</span>{" "}
          unlocks once you&rsquo;ve reviewed a few decisions with a confidence and a
          clear outcome. {scored} so far — about {left} more and it&rsquo;ll start
          telling you something real instead of something lucky.
        </p>
      </div>
    );
  }

  const overall = Math.round((hits / scored) * 100);
  const claimedAvg = Math.round(
    buckets.reduce((s, b) => s + b.confidence * b.n, 0) / scored
  );
  const gap = overall - claimedAvg;
  const verdict =
    gap <= -12
      ? "You tend to be more confident than the outcomes justify — the classic overconfidence."
      : gap >= 12
        ? "You tend to be less confident than you turn out to be right — you could trust your read a little more."
        : "Your confidence and your outcomes line up about right — well calibrated, so far.";

  return (
    <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Your calibration
      </h3>
      <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
        Across {scored} reviewed decision{scored === 1 ? "" : "s"} with a clear
        outcome, things went the way you predicted {overall}% of the time, against
        an average confidence of {claimedAvg}%. {verdict}
      </p>
      <ul className="mt-4 space-y-2.5">
        {buckets.map((b) => {
          const observed = Math.round((b.hits / b.n) * 100);
          return (
            <li key={b.confidence} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[var(--foreground)]">
                  When you said{" "}
                  <span className="font-semibold">{b.confidence}%</span>
                </span>
                <span className="text-[var(--muted)] text-xs">
                  {b.hits} of {b.n} went as expected · {observed}%
                </span>
              </div>
              {/* Claimed vs. observed, side by side. */}
              <div className="mt-1.5 space-y-1" aria-hidden>
                <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--muted)] opacity-50"
                    style={{ width: `${b.confidence}%` }}
                  />
                </div>
                <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)]"
                    style={{ width: `${observed}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        The faint bar is what you claimed; the amber bar is what actually
        happened. Where amber falls short of faint, you were overconfident at that
        level; where it runs past, you were underconfident. Still a small sample —
        read it as a hint, not a verdict.
      </p>
    </div>
  );
}

// =========================================================================
// Resulting: of the decisions you've reviewed, how often does the result agree
// with your own honest judgment of the call? The two off-diagonal cells — a good
// call that got unlucky, a bad call that got lucky — are the whole reason a
// journal beats memory. Plain counts, so they're honest from the very first few.

function Resulting({ log }: { log: LogEntry[] }) {
  const { counts, scored, keptSame, goodOutcomes, divergences } = computeResulting(log);
  if (scored === 0) return null;

  if (scored < RESULTING_MIN) {
    const left = RESULTING_MIN - scored;
    return (
      <div className="mt-6 rounded-lg border border-dashed border-[var(--border)] px-4 py-3">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">
            Decision vs. outcome
          </span>{" "}
          opens up once you&rsquo;ve reviewed a few decisions and graded both how
          they turned out and whether you&rsquo;d make the same call. {scored} so
          far — about {left} more and it&rsquo;ll show you where luck and judgment
          part ways.
        </p>
      </div>
    );
  }

  const keptPct = Math.round((keptSame / scored) * 100);
  const goodPct = Math.round((goodOutcomes / scored) * 100);
  const cells: { key: ResultingCell; label: string; gloss: string; strong: boolean }[] = [
    {
      key: "earned",
      label: "Earned it",
      gloss: "good call, good result — credit you can keep",
      strong: false,
    },
    {
      key: "unlucky",
      label: "Priced-in bad luck",
      gloss: "right call, bad result — a bet you shouldn't regret",
      strong: true,
    },
    {
      key: "lucky",
      label: "Got away with it",
      gloss: "wrong call, good result — don't bank the lesson",
      strong: true,
    },
    {
      key: "mistake",
      label: "Worth learning from",
      gloss: "wrong call, bad result — the real mistakes",
      strong: false,
    },
  ];

  return (
    <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Decision vs. outcome
      </h3>
      <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
        Across {scored} reviewed decision{scored === 1 ? "" : "s"},{" "}
        <span className="text-[var(--foreground)] font-medium">{goodPct}%</span>{" "}
        turned out well — but{" "}
        <span className="text-[var(--foreground)] font-medium">{keptPct}%</span>{" "}
        you&rsquo;d make the same way again. That second number is the one that
        tracks your judgment; the first is partly the dice.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {cells.map((c) => (
          <div
            key={c.key}
            className={`rounded-lg border p-3 ${
              c.strong ? "border-[var(--accent)]" : "border-[var(--border)]"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                {c.label}
              </span>
              <span className="text-base font-semibold text-[var(--foreground)] tabular-nums">
                {counts[c.key]}
              </span>
            </div>
            <span className="mt-1 block text-xs text-[var(--muted)] leading-relaxed">
              {c.gloss}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
        {divergences === 0 ? (
          <>
            So far, every result has matched your read of the call. Keep going —
            the moment they diverge is the moment the journal earns its keep.
          </>
        ) : (
          <>
            In{" "}
            <span className="text-[var(--foreground)] font-medium">
              {divergences} of {scored}
            </span>{" "}
            ({Math.round((divergences / scored) * 100)}%), the result and your
            honest judgment disagreed — good calls that got unlucky, or bad calls
            that got away with it. That gap is the proof, in your own hand, that
            you can&rsquo;t read the quality of a decision off how it happened to
            turn out. Bank the lesson from the calls you&rsquo;d change; forgive
            yourself the ones that were right and just unlucky.
          </>
        )}
      </p>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        Still a small sample — a tendency, not a verdict.
      </p>
    </div>
  );
}

// =========================================================================
// Reviewing one logged decision. The snapshot is read-only — that's the point,
// it's the contemporaneous record. The review fields below it are where you
// grade what happened, keeping the outcome and the decision-quality questions
// deliberately separate so a good call that got unlucky doesn't get filed as a
// mistake (and a lucky bad call doesn't get filed as wisdom).

function ReviewDetail({
  entry,
  onBack,
  onChange,
  onDelete,
  onCopy,
  onReminder,
  copied,
}: {
  entry: LogEntry;
  onBack: () => void;
  onChange: (fn: (e: LogEntry) => LogEntry) => void;
  onDelete: () => void;
  onCopy: () => void;
  onReminder: () => void;
  copied: boolean;
}) {
  const reasoned = entry.reasoning.filter((r) => r.text.trim());

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
      >
        ← Back to the log
      </button>

      <h2 className="mt-6 text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug">
        {entry.decision.trim() || entry.situationTitle}
      </h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {entry.situationTitle} · decided {formatHuman(entry.decidedOn)}
      </p>

      {/* The contemporaneous record — read-only on purpose. */}
      <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          What you wrote at the time
        </h3>

        {reasoned.length > 0 && (
          <ul className="space-y-2.5">
            {reasoned.map((r, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <span className="font-semibold text-[var(--foreground)]">
                  {r.name}.
                </span>{" "}
                <span className="text-[var(--muted)]">{r.text.trim()}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="text-sm leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">The call.</span>{" "}
          <span className="text-[var(--muted)]">
            {entry.call.trim() || "(undecided)"}
          </span>
        </div>

        <div className="text-sm leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">
            I expected.
          </span>{" "}
          <span className="text-[var(--muted)]">
            {entry.expectation.trim() || "(not stated)"}
            {entry.confidence != null ? ` — ${entry.confidence}% confident.` : ""}
          </span>
        </div>
      </div>

      {/* The review. */}
      <div className="mt-8">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What actually happened
        </h3>
        <textarea
          rows={3}
          value={entry.outcome}
          onChange={(e) => onChange((prev) => ({ ...prev, outcome: e.target.value }))}
          placeholder="Compare it to what you expected. Where were you right? Where were you surprised?"
          className={textareaClass}
        />
      </div>

      <div className="mt-6">
        <span className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          How it turned out
        </span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(OUTCOME_LABELS) as OutcomeQuality[]).map((k) => {
            const selected = entry.outcomeQuality === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    outcomeQuality: prev.outcomeQuality === k ? null : k,
                  }))
                }
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
                }`}
              >
                {OUTCOME_LABELS[k]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <span className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          The decision itself — ignoring how it turned out
        </span>
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-2">
          Given only what you knew when you decided, was it the right call? A good
          decision can lose and a bad one can win; grade the reasoning, not the
          dice.
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DECISION_LABELS) as DecisionQuality[]).map((k) => {
            const selected = entry.decisionQuality === k;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    decisionQuality: prev.decisionQuality === k ? null : k,
                  }))
                }
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
                }`}
              >
                {DECISION_LABELS[k]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="review-lessons"
          className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
        >
          What I&rsquo;d carry forward
        </label>
        <textarea
          id="review-lessons"
          rows={3}
          value={entry.lessons}
          onChange={(e) => onChange((prev) => ({ ...prev, lessons: e.target.value }))}
          placeholder="The one thing this decision teaches you about how you decide — not about how it happened to turn out."
          className={textareaClass}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {!entry.reviewedOn ? (
          <button
            type="button"
            onClick={() => onChange((prev) => ({ ...prev, reviewedOn: todayISO() }))}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
          >
            Mark reviewed
          </button>
        ) : (
          <span className="text-sm text-[var(--muted)]">
            Reviewed {formatHuman(entry.reviewedOn)}.{" "}
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, reviewedOn: null }))}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Reopen
            </button>
          </span>
        )}
        <button
          type="button"
          onClick={onCopy}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors"
        >
          {copied ? "Copied ✓" : "Copy entry"}
        </button>
        {!entry.reviewedOn && (
          <button
            type="button"
            onClick={onReminder}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            Add to calendar ↓
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// The worked example. A complete, already-reviewed entry rendered read-only so
// a first-timer can see the shape of a good forecast and an honest review
// before writing their own — and, specifically, see the resulting-proof move:
// an outcome graded "turned out badly" sitting next to a decision graded "I'd
// make the same call." It is illustrative only and never touches the log.

function SampleEntry({ onBack }: { onBack: () => void }) {
  const e = SAMPLE_ENTRY;
  const reasoned = e.reasoning.filter((r) => r.text.trim());
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
      >
        ← Back
      </button>

      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug">
        {e.decision}
      </h2>
      <p className="mt-1 text-xs text-[var(--muted)]">
        {e.situationTitle} · decided {formatHuman(e.decidedOn)} · reviewed{" "}
        {formatHuman(e.reviewedOn as string)}
      </p>
      <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
        This is a sample, not one of your decisions — nothing here is saved. It
        shows what a finished entry looks like once the outcome is in.
      </p>

      {/* The contemporaneous record. */}
      <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          What they wrote at the time
        </h3>
        <ul className="space-y-2.5">
          {reasoned.map((r, i) => (
            <li key={i} className="text-sm leading-relaxed">
              <span className="font-semibold text-[var(--foreground)]">{r.name}.</span>{" "}
              <span className="text-[var(--muted)]">{r.text}</span>
            </li>
          ))}
        </ul>
        <div className="text-sm leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">The call.</span>{" "}
          <span className="text-[var(--muted)]">{e.call}</span>
        </div>
        <div className="text-sm leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">I expected.</span>{" "}
          <span className="text-[var(--muted)]">
            {e.expectation} — {e.confidence}% confident.
          </span>
        </div>
      </div>

      {/* The review, shown as the record it becomes. */}
      <div className="mt-8 space-y-5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            What actually happened
          </h3>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{e.outcome}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-[var(--border)] p-3">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              How it turned out
            </span>
            <span className="mt-1 block text-sm font-medium text-[var(--foreground)]">
              {OUTCOME_LABELS[e.outcomeQuality as OutcomeQuality]}
            </span>
          </div>
          <div className="rounded-lg border border-[var(--accent)] p-3">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              The decision itself
            </span>
            <span className="mt-1 block text-sm font-medium text-[var(--foreground)]">
              {DECISION_LABELS[e.decisionQuality as DecisionQuality]}
            </span>
          </div>
        </div>

        <p className="text-sm text-[var(--muted)] leading-relaxed pl-4 border-l-2 border-[var(--accent)]">
          This is the whole point of grading two things at once: it{" "}
          <span className="text-[var(--foreground)]">turned out badly</span>, and it
          was still <span className="text-[var(--foreground)]">the right call</span>.
          A journal that only asked &ldquo;did it work?&rdquo; would file this as a
          mistake and teach you to make worse decisions that happen to get luckier.
        </p>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            What they&rsquo;d carry forward
          </h3>
          <p className="text-sm text-[var(--muted)] leading-relaxed">{e.lessons}</p>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
        >
          Work a real decision through
        </button>
      </div>
    </div>
  );
}
