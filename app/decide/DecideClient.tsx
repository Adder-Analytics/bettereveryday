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

/** What we persist per situation. Versioned key so the shape can evolve. */
type SituationEntry = {
  context: string;
  answers: Record<string, string>;
  conclusion: string;
};

type Store = Record<string, SituationEntry>;

const STORAGE_KEY = "decide:v1";

function emptyEntry(): SituationEntry {
  return { context: "", answers: {}, conclusion: "" };
}

function loadStore(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

/** How many of the worksheet's fields (context + each model + conclusion) have content. */
function countFilled(entry: SituationEntry): number {
  let n = 0;
  if (entry.context.trim()) n++;
  if (entry.conclusion.trim()) n++;
  for (const v of Object.values(entry.answers)) if (v.trim()) n++;
  return n;
}

function buildMemo(s: WorksheetSituation, entry: SituationEntry): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const lines: string[] = [];
  lines.push("DECISION WORKSHEET");
  lines.push(s.title);
  lines.push(today);
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
  lines.push("— worked through with the playbook at Better Every Day · /decide");
  return lines.join("\n");
}

const textareaClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-y leading-relaxed";

export default function DecideClient({
  situations,
}: {
  situations: WorksheetSituation[];
}) {
  const [hydrated, setHydrated] = useState(false);
  const [store, setStore] = useState<Store>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved work + honor a ?s=<id> deep link from the playbook. This reads
  // localStorage, which only exists on the client, so it must run after mount —
  // the `hydrated` gate below keeps the first client render matching the server.
  useEffect(() => {
    const saved = loadStore();
    const requested = new URLSearchParams(window.location.search).get("s");
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setStore(saved);
    if (requested && situations.some((s) => s.id === requested)) {
      setActiveId(requested);
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [situations]);

  // Persist whenever the store changes (after hydration, so we never clobber
  // saved work with the empty initial state on first paint).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* storage full or unavailable — the worksheet still works in-memory */
    }
  }, [store, hydrated]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  const active = situations.find((s) => s.id === activeId) ?? null;
  const entry = (activeId && store[activeId]) || emptyEntry();

  const update = useCallback(
    (id: string, fn: (e: SituationEntry) => SituationEntry) => {
      setStore((prev) => ({ ...prev, [id]: fn(prev[id] ?? emptyEntry()) }));
    },
    []
  );

  const select = useCallback((id: string) => {
    setActiveId(id);
    setCopied(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const copyMemo = useCallback(async () => {
    if (!active) return;
    const memo = buildMemo(active, entry);
    let ok = false;
    try {
      await navigator.clipboard.writeText(memo);
      ok = true;
    } catch {
      // Fallback for browsers without the async clipboard API.
      try {
        const ta = document.createElement("textarea");
        ta.value = memo;
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
  }, [active, entry]);

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
  }, [activeId]);

  // The initial render uses empty state, which matches the server exactly, so the
  // picker server-renders (good for SEO and no-JS). Saved-state badges and any
  // ?s= deep link are applied after mount in the effects above — a post-load
  // enhancement, not a hydration mismatch.

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
            const total = s.models.length + 2; // context + models + conclusion
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => select(s.id)}
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
        <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
          Everything you write stays in this browser — it&rsquo;s saved locally and
          never sent anywhere. When you&rsquo;re done, copy it out as a plain-text
          memo to keep with the decision.
        </p>
      </div>
    );
  }

  // ---- The worksheet for one situation ----------------------------------
  return (
    <div>
      <button
        type="button"
        onClick={() => select("")}
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

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyMemo}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors"
        >
          {copied ? "Copied ✓" : "Copy as a decision memo"}
        </button>
        <button
          type="button"
          onClick={clearActive}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Clear this worksheet
        </button>
      </div>

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
