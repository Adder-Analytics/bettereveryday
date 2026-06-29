"use client";

import { useEffect, useState } from "react";
import {
  bayesProblems,
  posterior,
  naturalFrequencies,
  pct,
  pickRandom,
  ROUND_SIZE,
  updateVerdict,
  type BayesProblem,
} from "../data/bayes";

/**
 * The lifetime record. Base-rate neglect, like calibration and estimation, is a
 * pattern that only shows over volume — one update is noise. We keep a running
 * miss (how many points off, typically) and a running *signed* miss, because the
 * sign is the whole diagnosis: coming in high, again and again, is the signature
 * of trusting the test and forgetting the base rate. Stays in the browser.
 */
type Record = {
  n: number;
  sumAbsErr: number;
  sumSignedErr: number;
  within: number;
};

const STORAGE_KEY = "update:v1";
const EMPTY_RECORD: Record = { n: 0, sumAbsErr: 0, sumSignedErr: 0, within: 0 };

function loadRecord(): Record {
  if (typeof window === "undefined") return EMPTY_RECORD;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_RECORD;
    const parsed = JSON.parse(raw) as Partial<Record>;
    return {
      n: parsed.n ?? 0,
      sumAbsErr: parsed.sumAbsErr ?? 0,
      sumSignedErr: parsed.sumSignedErr ?? 0,
      within: parsed.within ?? 0,
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

/** Parse a percentage entered as a bare number 0–100. */
function parsePct(s: string): number | null {
  const cleaned = s.replace(/[%\s,]/g, "");
  if (cleaned === "") return null;
  const v = Number(cleaned);
  return Number.isFinite(v) && v >= 0 && v <= 100 ? v : null;
}

/** Tidy whole-number formatting for crowd counts. */
function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

const cardClass = "rounded-lg border border-[var(--border)] bg-[var(--card)] p-5";
const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors tabular-nums";
const primaryBtn =
  "px-4 py-2 text-sm font-medium rounded-lg border border-[var(--accent)] bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
const secondaryBtn =
  "px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors";

type Mode = "menu" | "walk" | "round";

export default function UpdateClient() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [roundKey, setRoundKey] = useState(0);
  const [walkProblem, setWalkProblem] = useState<BayesProblem | null>(null);
  const [round, setRound] = useState<BayesProblem[]>([]);
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

  function startWalk() {
    const features = bayesProblems.filter((p) => p.feature);
    setWalkProblem(pickRandom(features, 1, Math.random)[0]);
    setMode("walk");
    setRoundKey((k) => k + 1);
  }

  function startRound() {
    setRound(pickRandom(bayesProblems, ROUND_SIZE, Math.random));
    setMode("round");
    setRoundKey((k) => k + 1);
  }

  /** Fold a batch of signed point-errors into the lifetime record. */
  function commit(signedErrors: number[]) {
    setRecord((prev) => {
      const next: Record = {
        n: prev.n + signedErrors.length,
        sumAbsErr: prev.sumAbsErr + signedErrors.reduce((s, e) => s + Math.abs(e), 0),
        sumSignedErr: prev.sumSignedErr + signedErrors.reduce((s, e) => s + e, 0),
        within: prev.within + signedErrors.filter((e) => Math.abs(e) <= 10).length,
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
    return <MenuShell onWalk={() => {}} onRound={() => {}} record={null} onReset={() => {}} />;
  }

  if (mode === "walk" && walkProblem) {
    return (
      <WalkRound
        key={roundKey}
        problem={walkProblem}
        onComplete={(signed) => commit([signed])}
        onAgain={startWalk}
        onExit={() => setMode("menu")}
      />
    );
  }

  if (mode === "round") {
    return (
      <QuickRound
        key={roundKey}
        problems={round}
        onComplete={commit}
        onAgain={startRound}
        onExit={() => setMode("menu")}
      />
    );
  }

  return (
    <MenuShell onWalk={startWalk} onRound={startRound} record={record} onReset={resetRecord} />
  );
}

/* ------------------------------- the menu ------------------------------- */

function MenuShell({
  onWalk,
  onRound,
  record,
  onReset,
}: {
  onWalk: () => void;
  onRound: () => void;
  record: Record | null;
  onReset: () => void;
}) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cardClass}>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Walk through one</h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            One scenario, in detail —{" "}
            <span className="text-[var(--foreground)]">
              a positive test for a rare disease
            </span>
            . Make your gut call first, then watch the same numbers redrawn as a
            crowd of people, where the answer stops being a trick and becomes
            something you can simply count.
          </p>
          <button onClick={onWalk} className={`${primaryBtn} mt-4`}>
            Walk through one →
          </button>
        </div>
        <div className={cardClass}>
          <h2 className="text-base font-semibold text-[var(--foreground)]">A round</h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Six quick scenarios — a fraud alert, a drug test, a flu test in
            season. For each, a base rate and a result; you give the odds it&rsquo;s
            real.{" "}
            <span className="text-[var(--foreground)]">Scored on how many points off you were</span>
            , and on whether you keep landing high.
          </p>
          <button onClick={onRound} className={`${primaryBtn} mt-4`}>
            Start a round →
          </button>
        </div>
      </div>

      {record && <LifetimeRecord record={record} onReset={onReset} />}
    </div>
  );
}

function LifetimeRecord({ record, onReset }: { record: Record; onReset: () => void }) {
  if (record.n === 0) return null;

  const typicalMiss = Math.round(record.sumAbsErr / record.n);
  const bias = record.sumSignedErr / record.n;
  const withinPct = Math.round((record.within / record.n) * 100);
  const leansHigh = bias >= 5;
  const leansLow = bias <= -5;

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
        Base-rate neglect is a pattern, not a single score — it shows up as a
        consistent <em>lean</em> over many updates. This accumulates across every
        round, here in your browser.
      </p>

      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        Across <span className="font-semibold">{record.n}</span> update
        {record.n === 1 ? "" : "s"}, your typical miss is{" "}
        <span className="font-semibold">{typicalMiss} point{typicalMiss === 1 ? "" : "s"}</span>, and{" "}
        <span className="font-semibold">{withinPct}%</span> landed within ten of
        the truth.
      </p>

      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        On average you came in{" "}
        <span className="font-semibold">
          {Math.abs(Math.round(bias))} point{Math.abs(Math.round(bias)) === 1 ? "" : "s"}{" "}
          {bias >= 0 ? "high" : "low"}
        </span>
        .{" "}
        <span className="text-[var(--muted)]">
          {record.n < ROUND_SIZE
            ? "A round or two more and this lean means something."
            : leansHigh
              ? "That's the classic base-rate-neglect signature — trusting the test and underweighting how rare the thing is. When a result surprises you, recount the crowd: most positives come from the big innocent group."
              : leansLow
                ? "You're erring cautious — underweighting the evidence rather than the base rate. Worth checking you're not waving away results that genuinely should move you."
                : "Nicely balanced — you're weighing the evidence against the base rate, not anchoring on either one."}
        </span>
      </p>
    </div>
  );
}

/* ------------------------- the natural-frequency picture ------------------------- */

function FrequencyBars({ problem }: { problem: BayesProblem }) {
  const f = naturalFrequencies(problem);
  const post = posterior(problem);

  // Among the positives, the share that's real — the posterior, made visible.
  const truePct = f.positives === 0 ? 0 : (f.truePositives / f.positives) * 100;

  return (
    <div className="mt-5 space-y-5">
      <div>
        <p className="text-xs text-[var(--muted)] mb-1.5">
          Picture <span className="font-semibold text-[var(--foreground)]">{fmt(f.total)}</span>{" "}
          people in this situation. About{" "}
          <span className="text-[var(--foreground)]">{fmt(f.withCondition)}</span> of them are{" "}
          {problem.conditionNoun}; the test flags{" "}
          <span className="text-[var(--foreground)]">{fmt(f.truePositives)}</span> of those. Of the{" "}
          <span className="text-[var(--foreground)]">{fmt(f.withoutCondition)}</span> who aren&rsquo;t,
          it still flags about{" "}
          <span className="text-[var(--foreground)]">{fmt(f.falsePositives)}</span> of them anyway.
        </p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
          Everyone who got {problem.resultNoun} ({fmt(f.positives)} people)
        </p>
        <div className="flex h-7 w-full overflow-hidden rounded-md border border-[var(--border)]">
          <div
            className="flex items-center justify-center bg-[var(--accent)] text-[var(--background)] text-[10px] font-medium"
            style={{ width: `${Math.max(truePct, 2)}%` }}
            title={`${fmt(f.truePositives)} truly affected`}
          >
            {truePct >= 12 ? fmt(f.truePositives) : ""}
          </div>
          <div
            className="flex items-center justify-center text-[10px] text-[var(--muted)]"
            style={{ width: `${100 - truePct}%` }}
            title={`${fmt(f.falsePositives)} false alarms`}
          >
            {100 - truePct >= 12 ? `${fmt(f.falsePositives)} false alarms` : ""}
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-[var(--muted)]">
          <span>
            <span className="text-[var(--accent)]">■</span> {fmt(f.truePositives)} really affected
          </span>
          <span>{fmt(f.falsePositives)} false alarms</span>
        </div>
      </div>

      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        So of everyone who got {problem.resultNoun}, the share who are really{" "}
        affected is {fmt(f.truePositives)} out of {fmt(f.positives)} —{" "}
        <span className="font-semibold text-[var(--accent)]">about {pct(post)}%</span>.
      </p>
    </div>
  );
}

/* ---------------------------- the walk-through ---------------------------- */

type Phase = "guess" | "done";

function WalkRound({
  problem,
  onComplete,
  onAgain,
  onExit,
}: {
  problem: BayesProblem;
  onComplete: (signedError: number) => void;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("guess");
  const [guess, setGuess] = useState("");

  const guessNum = parsePct(guess);
  const truth = pct(posterior(problem));

  function reveal() {
    if (guessNum === null || phase === "done") return;
    setPhase("done");
    onComplete(guessNum - truth);
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
          A test result feels like an answer. It isn&rsquo;t — it&rsquo;s evidence, and how
          much it should move you depends on how common the thing was to begin
          with. Guess first; then count the crowd.
        </p>
      </div>

      <h2 className="mt-8 text-lg font-medium text-[var(--foreground)] leading-snug">
        {problem.title}
      </h2>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{problem.scenario}</p>
      <p className="mt-3 text-sm font-medium text-[var(--foreground)] leading-relaxed">
        {problem.question}
      </p>

      <div className="mt-5">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
          Your gut answer — the chance it&rsquo;s real
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Your gut answer, as a percentage"
            inputMode="numeric"
            disabled={phase === "done"}
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="0–100"
            className={`${inputClass} w-28`}
          />
          <span className="text-[var(--muted)] text-sm">%</span>
          {phase === "guess" && (
            <button
              onClick={reveal}
              disabled={guessNum === null}
              className={`${primaryBtn} ml-1`}
            >
              Count the crowd →
            </button>
          )}
        </div>
      </div>

      {phase === "done" && guessNum !== null && (
        <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Your guess vs. the truth
          </h2>

          <ul className="mt-4 space-y-1.5 text-sm">
            <li className="flex justify-between gap-3">
              <span className="text-[var(--muted)]">Your gut answer</span>
              <span className="text-[var(--foreground)] tabular-nums">{Math.round(guessNum)}%</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-[var(--muted)]">The actual chance</span>
              <span className="text-[var(--accent)] font-semibold tabular-nums">{truth}%</span>
            </li>
          </ul>

          <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
            {Math.abs(guessNum - truth) <= 5
              ? "Spot on — you already weighed the base rate."
              : guessNum > truth
                ? `You came in about ${Math.round(guessNum - truth)} points high — the base-rate-neglect direction, trusting the test and forgetting how rare the thing is.`
                : `You came in about ${Math.round(truth - guessNum)} points low — you underweighted the evidence this time.`}
          </p>

          <FrequencyBars problem={problem} />

          <p className="mt-5 text-sm text-[var(--foreground)] leading-relaxed">
            {problem.note}
          </p>
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">{problem.source}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={onAgain} className={primaryBtn}>
              Another one →
            </button>
            <button onClick={onExit} className={secondaryBtn}>
              Back to menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- a round ------------------------------- */

function QuickRound({
  problems,
  onComplete,
  onAgain,
  onExit,
}: {
  problems: BayesProblem[];
  onComplete: (signedErrors: number[]) => void;
  onAgain: () => void;
  onExit: () => void;
}) {
  const [inputs, setInputs] = useState<{ [id: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = problems.every((p) => parsePct(inputs[p.id] ?? "") !== null);

  const results = problems.map((p) => {
    const v = parsePct(inputs[p.id] ?? "");
    const truth = pct(posterior(p));
    const signed = v === null ? 0 : v - truth;
    return { p, v, truth, signed };
  });

  function submit() {
    if (!allAnswered || submitted) return;
    setSubmitted(true);
    onComplete(results.map((r) => r.signed));
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
          <span className="font-semibold text-[var(--foreground)]">For each one</span>, weigh the
          result against the base rate and give the chance it&rsquo;s real. The trap is
          fixating on the test&rsquo;s accuracy — when the thing is rare, most positives
          aren&rsquo;t.
        </p>
      </div>

      <ol className="mt-8 space-y-7">
        {results.map(({ p, v, truth, signed }, i) => (
          <li key={p.id}>
            <div className="flex gap-3">
              <span className="shrink-0 w-5 text-sm font-mono text-[var(--muted)] pt-0.5 tabular-nums">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--foreground)] leading-relaxed">{p.scenario}</p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)] leading-relaxed">
                  {p.question}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    aria-label={p.question}
                    inputMode="numeric"
                    disabled={submitted}
                    value={inputs[p.id] ?? ""}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    placeholder="0–100"
                    className={`${inputClass} w-28`}
                  />
                  <span className="text-[var(--muted)] text-sm">%</span>
                </div>

                {submitted && (
                  <div
                    className={`mt-2 rounded-md border px-3 py-2 text-xs leading-relaxed ${
                      Math.abs(signed) <= 10
                        ? "border-[var(--border)] bg-[var(--card)]"
                        : "border-[var(--accent)]"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        Math.abs(signed) <= 10 ? "text-[var(--foreground)]" : "text-[var(--accent)]"
                      }`}
                    >
                      {Math.abs(signed) <= 10 ? "Close" : "Off"}
                    </span>
                    <span className="text-[var(--muted)]">
                      {" "}— the real answer is{" "}
                      <span className="text-[var(--foreground)]">{truth}%</span>
                      {v !== null &&
                        ` (you said ${Math.round(v)}% — ${Math.abs(Math.round(signed))} ${
                          Math.abs(Math.round(signed)) === 1 ? "point" : "points"
                        } ${signed >= 0 ? "high" : "low"})`}
                      . {p.note}
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
            Score my updates
          </button>
          {!allAnswered && (
            <span className="text-xs text-[var(--muted)]">Give a percentage for all {problems.length}.</span>
          )}
        </div>
      ) : (
        <RoundResult results={results} onAgain={onAgain} onExit={onExit} />
      )}
    </div>
  );
}

function RoundResult({
  results,
  onAgain,
  onExit,
}: {
  results: { signed: number }[];
  onAgain: () => void;
  onExit: () => void;
}) {
  const n = results.length;
  const within = results.filter((r) => Math.abs(r.signed) <= 10).length;
  const meanAbs = Math.round(results.reduce((s, r) => s + Math.abs(r.signed), 0) / n);
  const bias = results.reduce((s, r) => s + r.signed, 0) / n;

  return (
    <div className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Your round
      </h2>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-semibold">{within} of {n}</span> landed within ten
        points, and your typical miss was{" "}
        <span className="font-semibold">{meanAbs} point{meanAbs === 1 ? "" : "s"}</span>.{" "}
        {updateVerdict(meanAbs)}
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        {bias >= 5
          ? "You leaned high overall — the base-rate-neglect direction. The cure isn't more caution in general; it's recounting the crowd whenever a result surprises you."
          : bias <= -5
            ? "You leaned low overall — underweighting the evidence rather than the base rate."
            : "Your highs and lows roughly cancelled — you're weighing evidence against the base rate, not anchoring on either."}
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
