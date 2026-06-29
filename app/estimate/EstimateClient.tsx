"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fermiProblems,
  estimateQuestions,
  pickRandom,
  ONESHOT_ROUND_SIZE,
  logError,
  factorOff,
  type FermiProblem,
  type EstimateQuestion,
} from "../data/estimation";

/**
 * The lifetime record. Estimation skill, like calibration, is a pattern that
 * only shows over volume — one round is noise. We keep two running tallies:
 * how often a decomposition beat the gut guess, and how tight the one-shot
 * estimates have been (a typical miss, in factors of ten). Stays in the browser.
 */
type Record = {
  decompose: { n: number; beatGut: number };
  oneshot: { n: number; sumAbsLog: number; withinOrder: number };
};

const STORAGE_KEY = "estimate:v1";
const EMPTY_RECORD: Record = {
  decompose: { n: 0, beatGut: 0 },
  oneshot: { n: 0, sumAbsLog: 0, withinOrder: 0 },
};

function loadRecord(): Record {
  if (typeof window === "undefined") return EMPTY_RECORD;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_RECORD;
    const parsed = JSON.parse(raw) as Partial<Record>;
    return {
      decompose: {
        n: parsed.decompose?.n ?? 0,
        beatGut: parsed.decompose?.beatGut ?? 0,
      },
      oneshot: {
        n: parsed.oneshot?.n ?? 0,
        sumAbsLog: parsed.oneshot?.sumAbsLog ?? 0,
        withinOrder: parsed.oneshot?.withinOrder ?? 0,
      },
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

function parseNum(s: string): number | null {
  const cleaned = s.replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  const v = Number(cleaned);
  return Number.isFinite(v) && v > 0 ? v : null;
}

/** Compact, readable numbers across sixteen orders of magnitude. */
function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs !== 0 && abs >= 100_000) {
    return n.toLocaleString("en-US", {
      notation: "compact",
      compactDisplay: "long",
      maximumSignificantDigits: 3,
    });
  }
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** "1.8" / "30" / "120" — the bare ratio for "X× too high/low". */
function fmtFactor(r: number): string {
  if (!Number.isFinite(r)) return "∞";
  return r.toLocaleString("en-US", { maximumSignificantDigits: r < 10 ? 2 : 3 });
}

function offLabel(estimate: number, answer: number): string {
  const r = factorOff(estimate, answer);
  if (r < 1.05) return "spot on";
  return `${fmtFactor(r)}× too ${estimate >= answer ? "high" : "low"}`;
}

const cardClass = "rounded-lg border border-[var(--border)] bg-[var(--card)] p-5";
const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors tabular-nums";
const primaryBtn =
  "px-4 py-2 text-sm font-medium rounded-lg border border-[var(--accent)] bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
const secondaryBtn =
  "px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors";

type Mode = "menu" | "decompose" | "oneshot";

export default function EstimateClient() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [roundKey, setRoundKey] = useState(0);
  const [problem, setProblem] = useState<FermiProblem | null>(null);
  const [oneshotRound, setOneshotRound] = useState<EstimateQuestion[]>([]);
  const [record, setRecord] = useState<Record>(EMPTY_RECORD);

  // One-time hydration from browser storage: the record only exists on the
  // client, so it loads after mount. The first client render matches the server
  // (empty menu shell), then the real record is applied here.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setRecord(loadRecord());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function startDecompose() {
    setProblem(pickRandom(fermiProblems, 1, Math.random)[0]);
    setMode("decompose");
    setRoundKey((k) => k + 1);
  }

  function startOneshot() {
    setOneshotRound(pickRandom(estimateQuestions, ONESHOT_ROUND_SIZE, Math.random));
    setMode("oneshot");
    setRoundKey((k) => k + 1);
  }

  function commitDecompose(beatGut: boolean) {
    setRecord((prev) => {
      const next: Record = {
        ...prev,
        decompose: {
          n: prev.decompose.n + 1,
          beatGut: prev.decompose.beatGut + (beatGut ? 1 : 0),
        },
      };
      saveRecord(next);
      return next;
    });
  }

  function commitOneshot(logErrors: number[]) {
    setRecord((prev) => {
      const next: Record = {
        ...prev,
        oneshot: {
          n: prev.oneshot.n + logErrors.length,
          sumAbsLog: prev.oneshot.sumAbsLog + logErrors.reduce((s, e) => s + e, 0),
          withinOrder:
            prev.oneshot.withinOrder + logErrors.filter((e) => e <= 1).length,
        },
      };
      saveRecord(next);
      return next;
    });
  }

  function resetRecord() {
    setRecord(EMPTY_RECORD);
    saveRecord(EMPTY_RECORD);
  }

  if (!mounted) {
    return <MenuShell onDecompose={() => {}} onOneshot={() => {}} record={null} onReset={() => {}} />;
  }

  if (mode === "decompose" && problem) {
    return (
      <DecomposeRound
        key={roundKey}
        problem={problem}
        onComplete={commitDecompose}
        onAgain={startDecompose}
        onExit={() => setMode("menu")}
      />
    );
  }

  if (mode === "oneshot") {
    return (
      <OneshotRound
        key={roundKey}
        questions={oneshotRound}
        onComplete={commitOneshot}
        onAgain={startOneshot}
        onExit={() => setMode("menu")}
      />
    );
  }

  return (
    <MenuShell
      onDecompose={startDecompose}
      onOneshot={startOneshot}
      record={record}
      onReset={resetRecord}
    />
  );
}

/* ------------------------------- the menu ------------------------------- */

function MenuShell({
  onDecompose,
  onOneshot,
  record,
  onReset,
}: {
  onDecompose: () => void;
  onOneshot: () => void;
  record: Record | null;
  onReset: () => void;
}) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cardClass}>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Decompose</h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            A question you can&rsquo;t answer head-on —{" "}
            <span className="text-[var(--foreground)]">
              how many piano tuners work in Chicago?
            </span>{" "}
            Make a gut guess first, then break it into smaller things you{" "}
            <em>can</em> estimate and watch the chain land closer than the guess
            did. The whole method, in one problem.
          </p>
          <button onClick={onDecompose} className={`${primaryBtn} mt-4`}>
            Start a problem →
          </button>
        </div>
        <div className={cardClass}>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            One-shot estimates
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Eight quantities that span orders of magnitude — trees on Earth,
            neurons in a brain. One number each. Scored not on getting it exactly
            right, but on{" "}
            <span className="text-[var(--foreground)]">
              how many factors of ten you were off
            </span>
            . The miss you&rsquo;re chasing down to is one order of magnitude.
          </p>
          <button onClick={onOneshot} className={`${primaryBtn} mt-4`}>
            Start a round →
          </button>
        </div>
      </div>

      {record && <LifetimeRecord record={record} onReset={onReset} />}
    </div>
  );
}

function LifetimeRecord({ record, onReset }: { record: Record; onReset: () => void }) {
  const { decompose, oneshot } = record;
  if (decompose.n === 0 && oneshot.n === 0) return null;

  const typicalFactor =
    oneshot.n > 0 ? Math.pow(10, oneshot.sumAbsLog / oneshot.n) : null;
  const withinPct =
    oneshot.n > 0 ? Math.round((oneshot.withinOrder / oneshot.n) * 100) : null;

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
        Estimation is a pattern, not a single score — it shows up over many
        questions. This accumulates across every round, here in your browser.
      </p>

      {typicalFactor !== null && (
        <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
          Across <span className="font-semibold">{oneshot.n}</span> one-shot
          estimates, your typical miss is a factor of{" "}
          <span className="font-semibold">{fmtFactor(typicalFactor)}×</span>, and{" "}
          <span className="font-semibold">{withinPct}%</span> landed within an
          order of magnitude.{" "}
          <span className="text-[var(--muted)]">
            {oneshot.n < 16
              ? "Early days — a few more rounds and this means something."
              : typicalFactor <= 3
                ? "That's genuinely good Fermi — most of your guesses are in the right neighbourhood."
                : typicalFactor <= 10
                  ? "Solid — mostly inside an order of magnitude. Decomposing the hard ones will tighten it."
                  : "Lots of room — try breaking the wild ones into factors before you commit a number."}
          </span>
        </p>
      )}

      {decompose.n > 0 && (
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          On <span className="font-semibold">{decompose.n}</span> decomposition
          {decompose.n === 1 ? "" : "s"}, breaking the problem down beat your gut
          guess <span className="font-semibold">{decompose.beatGut}</span> time
          {decompose.beatGut === 1 ? "" : "s"}.{" "}
          <span className="text-[var(--muted)]">
            That&rsquo;s the whole case for the method, measured on you.
          </span>
        </p>
      )}
    </div>
  );
}

/* ---------------------------- decompose round ---------------------------- */

type Phase = "gut" | "build" | "done";

function DecomposeRound({
  problem,
  onComplete,
  onAgain,
  onExit,
}: {
  problem: FermiProblem;
  onComplete: (beatGut: boolean) => void;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("gut");
  const [gut, setGut] = useState("");
  const [factors, setFactors] = useState<{ [i: number]: string }>({});

  const gutNum = parseNum(gut);

  const product = useMemo(() => {
    let p = 1;
    for (let i = 0; i < problem.factors.length; i++) {
      const v = parseNum(factors[i] ?? "");
      if (v === null) return null;
      p = problem.factors[i].op === "×" ? p * v : p / v;
    }
    return p;
  }, [factors, problem.factors]);

  function score() {
    if (gutNum === null || product === null || phase === "done") return;
    setPhase("done");
    onComplete(logError(product, problem.answer) < logError(gutNum, problem.answer));
  }

  return (
    <div>
      <button
        onClick={onExit}
        className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
      >
        ← Back to menu
      </button>

      <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] px-4 py-3">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">The move.</span>{" "}
          You don&rsquo;t know the answer — but you know, or can guess, the pieces
          it&rsquo;s made of. Estimate each piece; their product is your answer.
          Rough factors are fine: errors in opposite directions tend to cancel.
        </p>
      </div>

      <h2 className="mt-8 text-lg font-medium text-[var(--foreground)] leading-snug">
        {problem.prompt}
      </h2>

      {/* Step 1 — the gut guess, captured before the breakdown is shown. */}
      <div className="mt-5">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
          First, a gut guess — no working
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Your gut guess"
            inputMode="decimal"
            disabled={phase !== "gut"}
            value={gut}
            onChange={(e) => setGut(e.target.value)}
            placeholder="one number"
            className={`${inputClass} w-40`}
          />
          <span className="text-[var(--muted)] text-sm">{problem.unit}</span>
          {phase === "gut" && (
            <button
              onClick={() => gutNum !== null && setPhase("build")}
              disabled={gutNum === null}
              className={`${secondaryBtn} ml-1`}
            >
              Reveal the breakdown →
            </button>
          )}
        </div>
      </div>

      {/* Step 2 — the decomposition. */}
      {phase !== "gut" && (
        <>
          <ol className="mt-8 space-y-5">
            {problem.factors.map((f, i) => {
              const v = parseNum(factors[i] ?? "");
              return (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 text-sm font-mono text-[var(--muted)] pt-2 tabular-nums">
                    {f.op}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--foreground)] leading-relaxed">
                      {f.prompt}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <input
                        aria-label={f.prompt}
                        inputMode="decimal"
                        disabled={phase === "done"}
                        value={factors[i] ?? ""}
                        onChange={(e) =>
                          setFactors((prev) => ({ ...prev, [i]: e.target.value }))
                        }
                        placeholder="estimate"
                        className={`${inputClass} w-36`}
                      />
                      <span className="text-[var(--muted)] text-sm">{f.unit}</span>
                    </div>
                    {phase === "done" && (
                      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                        A reasonable value: {f.op}{" "}
                        <span className="text-[var(--foreground)]">
                          {fmt(f.reference)} {f.unit}
                        </span>
                        {v !== null && ` (you put ${fmt(v)})`}. {f.note}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm">
            <span className="text-[var(--muted)]">Your estimate so far: </span>
            <span className="font-semibold text-[var(--foreground)] tabular-nums">
              {product === null ? "—" : `${fmt(product)} ${problem.unit}`}
            </span>
          </div>
        </>
      )}

      {phase === "build" && (
        <div className="mt-6 flex items-center gap-4">
          <button onClick={score} disabled={product === null} className={primaryBtn}>
            Reveal the answer
          </button>
          {product === null && (
            <span className="text-xs text-[var(--muted)]">Fill in every factor.</span>
          )}
        </div>
      )}

      {phase === "done" && gutNum !== null && product !== null && (
        <DecomposeResult
          problem={problem}
          gut={gutNum}
          decomposed={product}
          onAgain={onAgain}
          onExit={onExit}
        />
      )}
    </div>
  );
}

function DecomposeResult({
  problem,
  gut,
  decomposed,
  onAgain,
  onExit,
}: {
  problem: FermiProblem;
  gut: number;
  decomposed: number;
  onAgain: () => void;
  onExit: () => void;
}) {
  const answer = problem.answer;
  const beat = logError(decomposed, answer) < logError(gut, answer);

  return (
    <div className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Gut vs. decomposition
      </h2>

      <LogStrip
        unit={problem.unit}
        points={[
          { label: "Gut", value: gut },
          { label: "Decomposed", value: decomposed, accent: true },
          { label: "Truth", value: answer, truth: true },
        ]}
      />

      <ul className="mt-5 space-y-1.5 text-sm">
        <li className="flex justify-between gap-3">
          <span className="text-[var(--muted)]">Your gut guess</span>
          <span className="text-[var(--foreground)] tabular-nums">
            {fmt(gut)} {problem.unit}{" "}
            <span className="text-[var(--muted)]">· {offLabel(gut, answer)}</span>
          </span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-[var(--muted)]">Your decomposition</span>
          <span className="text-[var(--accent)] font-medium tabular-nums">
            {fmt(decomposed)} {problem.unit}{" "}
            <span className="text-[var(--muted)] font-normal">
              · {offLabel(decomposed, answer)}
            </span>
          </span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-[var(--muted)]">True answer</span>
          <span className="text-[var(--foreground)] font-semibold tabular-nums">
            {fmt(answer)} {problem.unit}
          </span>
        </li>
      </ul>

      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        {beat
          ? "Your decomposition beat your gut — the usual result, and the whole point. "
          : "This time your gut held its own. It happens, especially when you already had a feel for the answer — but it won't on the questions you have no handle on. "}
        <span className="text-[var(--muted)]">{problem.note}</span>
      </p>

      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">{problem.source}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onAgain} className={primaryBtn}>
          Another problem →
        </button>
        <button onClick={onExit} className={secondaryBtn}>
          Back to menu
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- one-shot round ----------------------------- */

function OneshotRound({
  questions,
  onComplete,
  onAgain,
  onExit,
}: {
  questions: EstimateQuestion[];
  onComplete: (logErrors: number[]) => void;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [inputs, setInputs] = useState<{ [id: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = questions.every((q) => parseNum(inputs[q.id] ?? "") !== null);

  const results = questions.map((q) => {
    const v = parseNum(inputs[q.id] ?? "");
    const logErr = v === null ? Infinity : logError(v, q.answer);
    return { q, v, logErr };
  });

  function submit() {
    if (!allAnswered || submitted) return;
    setSubmitted(true);
    onComplete(results.map((r) => r.logErr));
  }

  return (
    <div>
      <button
        onClick={onExit}
        className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
      >
        ← Back to menu
      </button>

      <div className="mt-4 rounded-lg border border-dashed border-[var(--border)] px-4 py-3">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">Aim for the order of magnitude.</span>{" "}
          Exact is hopeless and beside the point. The win is landing within a
          factor of ten — and you&rsquo;ll do that far more often if you pause to
          break the hard ones into pieces in your head before you type a number.
        </p>
      </div>

      <ol className="mt-8 space-y-6">
        {results.map(({ q, v, logErr }, i) => (
          <li key={q.id}>
            <div className="flex gap-3">
              <span className="shrink-0 w-5 text-sm font-mono text-[var(--muted)] pt-2 tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--foreground)] leading-relaxed">{q.prompt}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    aria-label={q.prompt}
                    inputMode="decimal"
                    disabled={submitted}
                    value={inputs[q.id] ?? ""}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder="your estimate"
                    className={`${inputClass} w-44`}
                  />
                  <span className="text-[var(--muted)] text-sm">{q.unit}</span>
                </div>

                {submitted && (
                  <div
                    className={`mt-2 rounded-md border px-3 py-2 text-xs leading-relaxed ${
                      logErr <= 1
                        ? "border-[var(--border)] bg-[var(--card)]"
                        : "border-[var(--accent)]"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        logErr <= 1 ? "text-[var(--foreground)]" : "text-[var(--accent)]"
                      }`}
                    >
                      {logErr <= 1 ? "Within range" : "Off"}
                    </span>
                    <span className="text-[var(--muted)]">
                      {" "}— answer: {fmt(q.answer)} {q.unit}.{" "}
                      {v !== null && `You said ${fmt(v)} (${offLabel(v, q.answer)}). `}
                      {q.note}
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
            Score my estimates
          </button>
          {!allAnswered && (
            <span className="text-xs text-[var(--muted)]">Give a number for all {questions.length}.</span>
          )}
        </div>
      ) : (
        <OneshotResult results={results} onAgain={onAgain} onExit={onExit} />
      )}
    </div>
  );
}

function OneshotResult({
  results,
  onAgain,
  onExit,
}: {
  results: { logErr: number }[];
  onAgain: () => void;
  onExit: () => void;
}) {
  const n = results.length;
  const within = results.filter((r) => r.logErr <= 1).length;
  const meanLog = results.reduce((s, r) => s + Math.min(r.logErr, 6), 0) / n;
  const typicalFactor = Math.pow(10, meanLog);

  return (
    <div className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Your round
      </h2>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-semibold">{within} of {n}</span> landed within an
        order of magnitude, and your typical miss was a factor of{" "}
        <span className="font-semibold">{fmtFactor(typicalFactor)}×</span>.{" "}
        {within === n
          ? "Every one inside ten-fold — that's the target, cleared."
          : within >= Math.round(n * 0.6)
            ? "Most inside ten-fold. The misses are usually the ones worth decomposing."
            : "The fix isn't knowing more facts — it's breaking the wild ones into factors before committing a number."}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={onAgain} className={primaryBtn}>
          Another round →
        </button>
        <button onClick={onExit} className={secondaryBtn}>
          Back to menu
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ shared bits ------------------------------ */

/**
 * A log-scale strip: a quantity guessed across orders of magnitude is only
 * legible on a log axis. Markers for the gut guess, the decomposition, and the
 * truth, positioned by log10 over a domain padded around the spread.
 */
function LogStrip({
  unit,
  points,
}: {
  unit: string;
  points: { label: string; value: number; accent?: boolean; truth?: boolean }[];
}) {
  const logs = points
    .map((p) => p.value)
    .filter((v) => v > 0)
    .map((v) => Math.log10(v));
  const lo = Math.floor(Math.min(...logs) - 0.5);
  const hi = Math.ceil(Math.max(...logs) + 0.5);
  const span = Math.max(hi - lo, 1);
  const pos = (v: number) => ((Math.log10(v) - lo) / span) * 100;

  return (
    <div className="mt-4 mb-2" aria-hidden>
      <div className="relative h-px bg-[var(--border)] mt-8 mb-1">
        {points.map((p) => {
          const left = Math.max(0, Math.min(100, pos(p.value)));
          return (
            <div
              key={p.label}
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${left}%`, top: "-1.5rem" }}
            >
              <span
                className={`text-[10px] whitespace-nowrap ${
                  p.truth
                    ? "text-[var(--foreground)] font-semibold"
                    : p.accent
                      ? "text-[var(--accent)]"
                      : "text-[var(--muted)]"
                }`}
              >
                {p.label}
              </span>
              <span
                className={`mt-1 h-2.5 w-2.5 rounded-full border-2 ${
                  p.truth
                    ? "bg-[var(--foreground)] border-[var(--foreground)]"
                    : p.accent
                      ? "bg-[var(--accent)] border-[var(--accent)]"
                      : "bg-[var(--background)] border-[var(--muted)]"
                }`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--muted)] tabular-nums">
        <span>{fmt(Math.pow(10, lo))}</span>
        <span className="text-[var(--muted)]">
          each step ×10 · in {unit}
        </span>
        <span>{fmt(Math.pow(10, hi))}</span>
      </div>
    </div>
  );
}
