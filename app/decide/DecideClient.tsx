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

const OUTCOME_LABELS: Record<OutcomeQuality, string> = {
  good: "Turned out well",
  bad: "Turned out badly",
  tbd: "Too early to tell",
};

const DECISION_LABELS: Record<DecisionQuality, string> = {
  again: "I'd make the same call",
  different: "I'd decide differently",
};

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
  const [copied, setCopied] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
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
    setLog(Array.isArray(savedLog) ? savedLog : []);
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
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const goLog = useCallback(() => {
    setScreen("log");
    setReviewId(null);
    setActiveId(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

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
  }, [activeId]);

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

        <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
          Everything you write stays in this browser — it&rsquo;s saved locally and
          never sent anywhere. Work a decision through, log it with what you expect
          to happen, and the log reminds you to come back and check.
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
        <p className="mt-4 text-sm text-[var(--foreground)] rounded-lg border border-[var(--accent)] bg-[var(--card)] px-4 py-3 leading-relaxed">
          Logged. It&rsquo;s saved with today&rsquo;s date and a reminder to review
          on {formatHuman(entry.reviewOn)}.{" "}
          <button
            type="button"
            onClick={goLog}
            className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
          >
            See your decision log →
          </button>
        </p>
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
}: {
  log: LogEntry[];
  onOpen: (id: string) => void;
  onBack: () => void;
}) {
  const sorted = [...log].sort((a, b) => {
    const aDue = isDue(a);
    const bDue = isDue(b);
    if (aDue !== bDue) return aDue ? -1 : 1; // due-for-review first
    return b.decidedOn.localeCompare(a.decidedOn); // then newest decided
  });
  const dueCount = log.filter(isDue).length;

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
  copied,
}: {
  entry: LogEntry;
  onBack: () => void;
  onChange: (fn: (e: LogEntry) => LogEntry) => void;
  onDelete: () => void;
  onCopy: () => void;
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
