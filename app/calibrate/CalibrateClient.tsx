"use client";

import { useEffect, useState } from "react";
import {
  rangeQuestions,
  binaryQuestions,
  pickRandom,
  ROUND_SIZE,
  BINARY_CONFIDENCE,
  type RangeQuestion,
  type BinaryQuestion,
} from "../data/calibration";

/**
 * The lifetime record, the genuinely useful part: calibration is a fact about
 * you that only emerges over volume, so a single ten-question round is noisy.
 * We accumulate every answered question across sessions, the same way the
 * decision journal accumulates reviewed decisions. Stays in the browser.
 */
type Record = {
  range: { n: number; hits: number };
  binary: { [confidence: number]: { n: number; hits: number } };
};

const STORAGE_KEY = "calibrate:v1";
const EMPTY_RECORD: Record = { range: { n: 0, hits: 0 }, binary: {} };

function loadRecord(): Record {
  if (typeof window === "undefined") return EMPTY_RECORD;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_RECORD;
    const parsed = JSON.parse(raw) as Partial<Record>;
    return {
      range: {
        n: parsed.range?.n ?? 0,
        hits: parsed.range?.hits ?? 0,
      },
      binary: parsed.binary ?? {},
    };
  } catch {
    return EMPTY_RECORD;
  }
}

function saveRecord(record: Record) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage full or blocked — the round still works, it just won't persist */
  }
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

function parseNum(s: string): number | null {
  const cleaned = s.replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : null;
}

const cardClass =
  "rounded-lg border border-[var(--border)] bg-[var(--card)] p-5";
const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors tabular-nums";
const primaryBtn =
  "px-4 py-2 text-sm font-medium rounded-lg border border-[var(--accent)] bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
const secondaryBtn =
  "px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors";

type Mode = "menu" | "range" | "binary";

export default function CalibrateClient() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [roundKey, setRoundKey] = useState(0);
  const [rangeRound, setRangeRound] = useState<RangeQuestion[]>([]);
  const [binaryRound, setBinaryRound] = useState<BinaryQuestion[]>([]);
  const [record, setRecord] = useState<Record>(EMPTY_RECORD);

  // One-time hydration from browser storage: the lifetime record only exists on
  // the client, so it must load after mount. The first client render matches the
  // server (empty menu shell), then the real record is applied here.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setRecord(loadRecord());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function startRange() {
    setRangeRound(pickRandom(rangeQuestions, ROUND_SIZE, Math.random));
    setMode("range");
    setRoundKey((k) => k + 1);
  }

  function startBinary() {
    setBinaryRound(pickRandom(binaryQuestions, ROUND_SIZE, Math.random));
    setMode("binary");
    setRoundKey((k) => k + 1);
  }

  function commitRange(hits: number, n: number) {
    setRecord((prev) => {
      const next: Record = {
        ...prev,
        range: { n: prev.range.n + n, hits: prev.range.hits + hits },
      };
      saveRecord(next);
      return next;
    });
  }

  function commitBinary(rounds: { confidence: number; correct: boolean }[]) {
    setRecord((prev) => {
      const binary = { ...prev.binary };
      for (const r of rounds) {
        const b = binary[r.confidence] ?? { n: 0, hits: 0 };
        binary[r.confidence] = {
          n: b.n + 1,
          hits: b.hits + (r.correct ? 1 : 0),
        };
      }
      const next: Record = { ...prev, binary };
      saveRecord(next);
      return next;
    });
  }

  function resetRecord() {
    setRecord(EMPTY_RECORD);
    saveRecord(EMPTY_RECORD);
  }

  if (!mounted) {
    // Avoid a hydration mismatch: the record and any randomized round only
    // exist on the client. Render the calm menu shell until mounted.
    return <MenuShell onRange={() => {}} onBinary={() => {}} record={null} onReset={() => {}} />;
  }

  if (mode === "range") {
    return (
      <RangeRound
        key={roundKey}
        questions={rangeRound}
        onComplete={commitRange}
        onAgain={startRange}
        onExit={() => setMode("menu")}
      />
    );
  }

  if (mode === "binary") {
    return (
      <BinaryRound
        key={roundKey}
        questions={binaryRound}
        onComplete={commitBinary}
        onAgain={startBinary}
        onExit={() => setMode("menu")}
      />
    );
  }

  return (
    <MenuShell
      onRange={startRange}
      onBinary={startBinary}
      record={record}
      onReset={resetRecord}
    />
  );
}

/* ----------------------------- the menu ----------------------------- */

function MenuShell({
  onRange,
  onBinary,
  record,
  onReset,
}: {
  onRange: () => void;
  onBinary: () => void;
  record: Record | null;
  onReset: () => void;
}) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cardClass}>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            90% ranges
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Ten questions with a number for an answer. For each, give a low and a
            high bound you&rsquo;re <span className="text-[var(--foreground)]">90% sure</span>{" "}
            contains the truth. Calibrated means about nine of ten land inside.
            Most people get half that — this is the test that shows you how
            overconfident you are.
          </p>
          <button onClick={onRange} className={`${primaryBtn} mt-4`}>
            Start ranges →
          </button>
        </div>
        <div className={cardClass}>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            True / false confidence
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Ten statements. Say whether each is true, and how sure you are —
            anywhere from a coin-flip 50% to a certain 100%. The scoring asks the
            only question that matters:{" "}
            <span className="text-[var(--foreground)]">
              when you said 80%, were you right about 80% of the time?
            </span>
          </p>
          <button onClick={onBinary} className={`${primaryBtn} mt-4`}>
            Start statements →
          </button>
        </div>
      </div>

      {record && <LifetimeRecord record={record} onReset={onReset} />}
    </div>
  );
}

function LifetimeRecord({
  record,
  onReset,
}: {
  record: Record;
  onReset: () => void;
}) {
  const rangeN = record.range.n;
  const binaryBuckets = BINARY_CONFIDENCE.map((c) => ({
    confidence: c,
    ...(record.binary[c] ?? { n: 0, hits: 0 }),
  })).filter((b) => b.n > 0);
  const binaryN = binaryBuckets.reduce((s, b) => s + b.n, 0);

  if (rangeN === 0 && binaryN === 0) return null;

  const rangeRate = rangeN > 0 ? Math.round((record.range.hits / rangeN) * 100) : null;

  return (
    <div className="mt-8 rounded-lg border border-[var(--border)] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Your record so far
        </h2>
        <button
          onClick={onReset}
          className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          Reset
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        Calibration is a pattern, not a single score — it only shows up over many
        questions. This accumulates across every round you do, here in your
        browser.
      </p>

      {rangeRate !== null && (
        <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
          Across <span className="font-semibold">{rangeN}</span> ranges you&rsquo;ve
          given, the true answer landed inside{" "}
          <span className="font-semibold">{rangeRate}%</span> of them.{" "}
          <span className="text-[var(--muted)]">
            {rangeN < 20
              ? "Early days — a few more rounds and this number means something."
              : rangeRate >= 83
                ? "That's the mark of a calibrated 90% interval. Well judged."
                : rangeRate >= 70
                  ? "Closing in on a true 90% — your ranges are a little too tight."
                  : "Well under 90% — like most people, your ranges are far too narrow for the confidence you're claiming."}
          </span>
        </p>
      )}

      {binaryBuckets.length > 0 && (
        <div className="mt-5">
          <p className="text-sm text-[var(--foreground)] mb-3">
            On <span className="font-semibold">{binaryN}</span> statements, claimed
            vs. actual:
          </p>
          <BucketBars buckets={binaryBuckets} />
        </div>
      )}
    </div>
  );
}

/* --------------------------- the range round --------------------------- */

type RangeInput = { low: string; high: string };

function RangeRound({
  questions,
  onComplete,
  onAgain,
  onExit,
}: {
  questions: RangeQuestion[];
  onComplete: (hits: number, n: number) => void;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [inputs, setInputs] = useState<{ [id: string]: RangeInput }>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = questions.every((q) => {
    const v = inputs[q.id];
    return v && parseNum(v.low) !== null && parseNum(v.high) !== null;
  });

  const results = questions.map((q) => {
    const v = inputs[q.id] ?? { low: "", high: "" };
    const low = parseNum(v.low);
    const high = parseNum(v.high);
    const lo = low !== null && high !== null ? Math.min(low, high) : null;
    const hi = low !== null && high !== null ? Math.max(low, high) : null;
    const hit = lo !== null && hi !== null && q.answer >= lo && q.answer <= hi;
    return { q, lo, hi, hit };
  });
  const hits = results.filter((r) => r.hit).length;

  function submit() {
    if (!allAnswered || submitted) return;
    setSubmitted(true);
    onComplete(hits, questions.length);
  }

  return (
    <div>
      <RoundHeader onExit={onExit} kind="range" />

      <ol className="mt-8 space-y-6">
        {results.map(({ q, lo, hi, hit }, i) => (
          <li key={q.id}>
            <div className="flex gap-3">
              <span className="shrink-0 w-5 text-sm font-mono text-[var(--muted)] pt-2 tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                  {q.prompt}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    aria-label={`${q.prompt} — low bound`}
                    inputMode="decimal"
                    disabled={submitted}
                    value={inputs[q.id]?.low ?? ""}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        [q.id]: { low: e.target.value, high: prev[q.id]?.high ?? "" },
                      }))
                    }
                    placeholder="low"
                    className={`${inputClass} w-28`}
                  />
                  <span className="text-[var(--muted)] text-sm">to</span>
                  <input
                    aria-label={`${q.prompt} — high bound`}
                    inputMode="decimal"
                    disabled={submitted}
                    value={inputs[q.id]?.high ?? ""}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        [q.id]: { low: prev[q.id]?.low ?? "", high: e.target.value },
                      }))
                    }
                    placeholder="high"
                    className={`${inputClass} w-28`}
                  />
                  <span className="text-[var(--muted)] text-sm">{q.unit}</span>
                </div>

                {submitted && (
                  <div
                    className={`mt-2 rounded-md border px-3 py-2 text-xs leading-relaxed ${
                      hit
                        ? "border-[var(--border)] bg-[var(--card)]"
                        : "border-[var(--accent)]"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        hit ? "text-[var(--foreground)]" : "text-[var(--accent)]"
                      }`}
                    >
                      {hit ? "Inside" : "Missed"}
                    </span>
                    <span className="text-[var(--muted)]">
                      {" "}— answer: {fmt(q.answer)} {q.unit}. You said {fmt(lo ?? 0)}–
                      {fmt(hi ?? 0)}. {q.note}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {!submitted ? (
        <div className="mt-8 flex items-center gap-4">
          <button onClick={submit} disabled={!allAnswered} className={primaryBtn}>
            Score my ranges
          </button>
          {!allAnswered && (
            <span className="text-xs text-[var(--muted)]">
              Give a low and high for all ten.
            </span>
          )}
        </div>
      ) : (
        <RangeResult hits={hits} n={questions.length} onAgain={onAgain} onExit={onExit} />
      )}
    </div>
  );
}

function RangeResult({
  hits,
  n,
  onAgain,
  onExit,
}: {
  hits: number;
  n: number;
  onAgain: () => void;
  onExit: () => void;
}) {
  const expected = Math.round(n * 0.9);
  const verdict =
    hits >= expected
      ? "That's calibrated — your 90% really did behave like 90%. Rare, and worth trusting."
      : hits >= Math.round(n * 0.7)
        ? "Close, but your ranges ran a little tight — a genuine 90% interval should have caught more."
        : hits >= Math.round(n * 0.5)
          ? "This is the usual result: ranges far too narrow for the confidence claimed. The fix isn't to know more — it's to widen the range until you'd genuinely be surprised to be wrong."
          : "Heavily overconfident — almost everyone starts here. Your ranges were a small fraction as wide as a true 90% needs to be.";

  return (
    <div className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Your result
      </h2>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        The true answer fell inside{" "}
        <span className="font-semibold">{hits} of {n}</span> of your ranges. A
        well-calibrated 90% interval would catch about{" "}
        <span className="font-semibold">{expected}</span>. {verdict}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onAgain} className={primaryBtn}>
          Another ten →
        </button>
        <button onClick={onExit} className={secondaryBtn}>
          Back to menu
        </button>
      </div>
    </div>
  );
}

/* --------------------------- the binary round --------------------------- */

type BinaryInput = { choice: boolean | null; confidence: number | null };

function BinaryRound({
  questions,
  onComplete,
  onAgain,
  onExit,
}: {
  questions: BinaryQuestion[];
  onComplete: (rounds: { confidence: number; correct: boolean }[]) => void;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [inputs, setInputs] = useState<{ [id: string]: BinaryInput }>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = questions.every((q) => {
    const v = inputs[q.id];
    return v && v.choice !== null && v.confidence !== null;
  });

  const results = questions.map((q) => {
    const v = inputs[q.id] ?? { choice: null, confidence: null };
    const correct = v.choice === q.answer;
    return { q, choice: v.choice, confidence: v.confidence, correct };
  });

  function submit() {
    if (!allAnswered || submitted) return;
    setSubmitted(true);
    onComplete(
      results.map((r) => ({ confidence: r.confidence as number, correct: r.correct }))
    );
  }

  const buckets = BINARY_CONFIDENCE.map((c) => {
    const inBucket = results.filter((r) => r.confidence === c);
    return {
      confidence: c,
      n: inBucket.length,
      hits: inBucket.filter((r) => r.correct).length,
    };
  }).filter((b) => b.n > 0);

  return (
    <div>
      <RoundHeader onExit={onExit} kind="binary" />

      <ol className="mt-8 space-y-7">
        {results.map(({ q, choice, confidence, correct }, i) => (
          <li key={q.id}>
            <div className="flex gap-3">
              <span className="shrink-0 w-5 text-sm font-mono text-[var(--muted)] pt-0.5 tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--foreground)] leading-relaxed">
                  {q.prompt}
                </p>

                <div className="mt-2.5 flex gap-2">
                  {[
                    { label: "True", val: true },
                    { label: "False", val: false },
                  ].map(({ label, val }) => {
                    const selected = choice === val;
                    return (
                      <button
                        key={label}
                        type="button"
                        disabled={submitted}
                        aria-pressed={selected}
                        onClick={() =>
                          setInputs((prev) => ({
                            ...prev,
                            [q.id]: { choice: val, confidence: prev[q.id]?.confidence ?? null },
                          }))
                        }
                        className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${
                          selected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                            : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                    How sure
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {BINARY_CONFIDENCE.map((c) => {
                      const selected = confidence === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          disabled={submitted}
                          aria-pressed={selected}
                          onClick={() =>
                            setInputs((prev) => ({
                              ...prev,
                              [q.id]: { choice: prev[q.id]?.choice ?? null, confidence: c },
                            }))
                          }
                          className={`px-2.5 py-1 text-xs rounded-lg border transition-colors tabular-nums ${
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

                {submitted && (
                  <div
                    className={`mt-2.5 rounded-md border px-3 py-2 text-xs leading-relaxed ${
                      correct
                        ? "border-[var(--border)] bg-[var(--card)]"
                        : "border-[var(--accent)]"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        correct ? "text-[var(--foreground)]" : "text-[var(--accent)]"
                      }`}
                    >
                      {correct ? "Right" : "Wrong"}
                    </span>
                    <span className="text-[var(--muted)]">
                      {" "}— it&rsquo;s {q.answer ? "true" : "false"}. {q.note}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {!submitted ? (
        <div className="mt-8 flex items-center gap-4">
          <button onClick={submit} disabled={!allAnswered} className={primaryBtn}>
            Score my answers
          </button>
          {!allAnswered && (
            <span className="text-xs text-[var(--muted)]">
              Pick true/false and a confidence for all ten.
            </span>
          )}
        </div>
      ) : (
        <BinaryResult buckets={buckets} results={results} onAgain={onAgain} onExit={onExit} />
      )}
    </div>
  );
}

function BinaryResult({
  buckets,
  results,
  onAgain,
  onExit,
}: {
  buckets: { confidence: number; n: number; hits: number }[];
  results: { correct: boolean; confidence: number | null }[];
  onAgain: () => void;
  onExit: () => void;
}) {
  const n = results.length;
  const correct = results.filter((r) => r.correct).length;
  const claimedAvg = Math.round(
    results.reduce((s, r) => s + (r.confidence ?? 0), 0) / n
  );
  const observed = Math.round((correct / n) * 100);
  const gap = observed - claimedAvg;
  const verdict =
    gap <= -12
      ? "You were more sure than you were right — the classic overconfidence. Aim to spread your bets more honestly: save 90% and 100% for the things you'd stake real money on."
      : gap >= 12
        ? "You were right more often than you claimed — you can afford to trust your read a little more."
        : "Your confidence and your accuracy lined up well. That's calibration.";

  return (
    <div className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Your result
      </h2>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        You got <span className="font-semibold">{correct} of {n}</span> right, at an
        average confidence of <span className="font-semibold">{claimedAvg}%</span>.{" "}
        {verdict}
      </p>
      <div className="mt-5">
        <p className="text-xs text-[var(--muted)] mb-3">
          Claimed confidence (faint) vs. how often you were actually right
          (solid), by bucket:
        </p>
        <BucketBars buckets={buckets} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onAgain} className={primaryBtn}>
          Another ten →
        </button>
        <button onClick={onExit} className={secondaryBtn}>
          Back to menu
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ shared bits ------------------------------ */

function BucketBars({
  buckets,
}: {
  buckets: { confidence: number; n: number; hits: number }[];
}) {
  return (
    <ul className="space-y-2.5">
      {buckets.map((b) => {
        const observed = Math.round((b.hits / b.n) * 100);
        return (
          <li key={b.confidence} className="text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[var(--foreground)]">
                When you said <span className="font-semibold tabular-nums">{b.confidence}%</span>
              </span>
              <span className="text-[var(--muted)] text-xs tabular-nums">
                right {b.hits} of {b.n} · {observed}%
              </span>
            </div>
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
  );
}

function RoundHeader({ onExit, kind }: { onExit: () => void; kind: "range" | "binary" }) {
  return (
    <div>
      <button
        onClick={onExit}
        className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
      >
        ← Back to menu
      </button>
      {kind === "range" ? (
        <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] px-4 py-3">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            <span className="font-semibold text-[var(--foreground)]">The equivalent bet.</span>{" "}
            For each range, ask yourself: would you rather win $1,000 if the true
            answer lands inside it — or win $1,000 on a spin that pays out 9 times
            in 10? If you&rsquo;d take the wheel, your range isn&rsquo;t really 90% sure
            yet. Widen it until the two bets feel equally good.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] px-4 py-3">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            <span className="font-semibold text-[var(--foreground)]">Be honest about 50%.</span>{" "}
            If you genuinely have no idea, say 50% — that&rsquo;s a coin flip, and
            it&rsquo;s the right answer more often than pride likes to admit. Save 90%
            and 100% for what you actually know.
          </p>
        </div>
      )}
    </div>
  );
}
