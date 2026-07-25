"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  appendDecisionEntry,
  CONFIDENCE_OPTIONS,
  todayISO,
  addDaysISO,
  REVIEW_DEFAULT_DAYS,
} from "../data/decisionLog";

/**
 * You Are Not the Exception (/outside).
 *
 * The site had a tool for every *shape* of decision except the one its own
 * reference says is the most dangerous to get wrong from the inside. The Outside
 * View model spells out the procedure — "reference-class forecasting: pick the
 * class your case belongs to, take its actual outcome distribution as your
 * starting point, then let the particulars argue for a modest, evidence-backed
 * adjustment" — and ends with the coda that made this a gap rather than a nicety:
 * "knowing about the inside view doesn't protect you from it, so the lookup has
 * to be a mandatory procedure — a checklist step before commitment, not a virtue
 * you hope to remember." The site named the procedure and never built the
 * checklist. This is the checklist.
 *
 * It refuses the two ways this could cheapen into false precision. It does not
 * average a bag of guesses — it makes you list *actual outcomes* of *comparable
 * cases* and reads their distribution. And it does not pretend three numbers
 * settle a forecast — the output that matters is the same shape the flip point
 * and the compare tool converge on: the *gap* between what your plan says and
 * what the class actually did. The plan is a best-case story; the reference class
 * has already counted the surprises. When they disagree — and on a schedule or a
 * budget they almost always do, with the plan low — that gap is the planning
 * fallacy made visible, and closing it is the whole point.
 *
 * The one structural move worth naming: your own estimate is taken *first and
 * sealed*, before you look at a single comparison — otherwise the cases you
 * choose anchor the number, and the gap we came for disappears. Nothing is sent
 * anywhere; inputs persist in your browser, and a forecast you commit to logs to
 * the decision journal so reality grades it on the day.
 */

const STORE_KEY = "outside:v1";

type RefCase = { id: string; label: string; value: number | null };

type Inputs = {
  /** What you're forecasting — "How long will the renovation take?" */
  question: string;
  /** The unit the number is in — "weeks", "$k", "hours". */
  unit: string;
  /** Your inside-view estimate, taken before any comparison. */
  inside: number | null;
  /** True once the inside estimate is committed and the class opens. */
  sealed: boolean;
  /** The reference class: comparable cases and what they actually took. */
  cases: RefCase[];
  /** Your final outside-view number, after a modest adjustment off the base. */
  adjusted: number | null;
  /** The one measured difference that justifies moving off the base. */
  adjustReason: string;
};

function freshCase(): RefCase {
  return { id: newLocalId(), label: "", value: null };
}

function newLocalId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * The blank the tool opens on — no question, no estimate, three empty rows to
 * fill. Nothing computes until an inside estimate is sealed and at least three
 * real cases are entered, so a first-time visitor never faces someone else's
 * numbers (the discipline the flagship tools already hold). The illustrative
 * scenario lives in EXAMPLE, shown read-only behind a toggle and never written
 * to the live fields or storage.
 */
const BLANK: Inputs = {
  question: "",
  unit: "",
  inside: null,
  sealed: false,
  cases: [freshCase(), freshCase(), freshCase()],
  adjusted: null,
  adjustReason: "",
};

const EXAMPLE: Inputs = {
  question: "How long will the kitchen renovation take?",
  unit: "weeks",
  inside: 6,
  sealed: true,
  cases: [
    { id: "x1", label: "Our bathroom, last year", value: 9 },
    { id: "x2", label: "The neighbours' kitchen", value: 12 },
    { id: "x3", label: "My sister's remodel", value: 8 },
    { id: "x4", label: "A gut-job on the reno blog", value: 16 },
    { id: "x5", label: "The contractor's own 'typical'", value: 11 },
  ],
  adjusted: 10,
  adjustReason:
    "Our kitchen is a touch smaller than most of these — one measured difference, so a modest step below the middle, not below the whole class.",
};

function num(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v;
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    const cases = Array.isArray(v.cases)
      ? v.cases
          .map((c): RefCase => ({
            id: typeof c?.id === "string" ? c.id : newLocalId(),
            label: typeof c?.label === "string" ? c.label : "",
            value: num(c?.value),
          }))
      : BLANK.cases;
    return {
      question: typeof v.question === "string" ? v.question : BLANK.question,
      unit: typeof v.unit === "string" ? v.unit : BLANK.unit,
      inside: num(v.inside),
      sealed: typeof v.sealed === "boolean" ? v.sealed : BLANK.sealed,
      cases: cases.length ? cases : BLANK.cases,
      adjusted: num(v.adjusted),
      adjustReason: typeof v.adjustReason === "string" ? v.adjustReason : BLANK.adjustReason,
    };
  } catch {
    return BLANK;
  }
}

/** A compact, human unit — trims and defaults so the copy never reads oddly. */
function unitOf(inp: Inputs): string {
  return inp.unit.trim() || "units";
}

function fmt(n: number): string {
  // Keep whole numbers clean; show at most one decimal otherwise.
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

type Stats = {
  values: number[];
  sorted: number[];
  n: number;
  min: number;
  max: number;
  median: number;
  mean: number;
};

/** The distribution of the reference class — the outside view, in five numbers. */
function computeStats(values: number[]): Stats | null {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0);
  if (clean.length < 3) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  const median = n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const mean = clean.reduce((a, b) => a + b, 0) / n;
  return { values: clean, sorted, n, min: sorted[0], max: sorted[n - 1], median, mean };
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";

function formatHuman(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function OutsideClient() {
  const [inp, setInp] = useState<Inputs>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [conf, setConf] = useState<number>(70);
  const [logged, setLogged] = useState<null | { conf: number; reviewOn: string; n: number }>(null);

  useEffect(() => {
    const loaded = loadInputs();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setInp(loaded);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(inp));
    } catch {
      /* storage full or blocked — the tool still works, just won't persist */
    }
  }, [inp, hydrated]);

  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const setCase = (id: string, patch: Partial<RefCase>) =>
    setInp((prev) => ({
      ...prev,
      cases: prev.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const addCase = () => setInp((prev) => ({ ...prev, cases: [...prev.cases, freshCase()] }));

  const removeCase = (id: string) =>
    setInp((prev) => ({
      ...prev,
      cases: prev.cases.length > 1 ? prev.cases.filter((c) => c.id !== id) : prev.cases,
    }));

  const stats = useMemo(
    () => computeStats(inp.cases.map((c) => c.value).filter((v): v is number => v != null)),
    [inp.cases]
  );

  const unit = unitOf(inp);
  const filledCases = inp.cases.filter((c) => c.value != null && c.value > 0).length;

  function handleLog() {
    if (!stats || inp.inside == null) return;
    const finalN = inp.adjusted != null ? inp.adjusted : stats.median;
    const reviewOn = addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS);
    appendDecisionEntry({
      situationTitle: inp.question.trim() || "A forecast",
      decision: `Estimate: about ${fmt(finalN)} ${unit} — ${inp.question.trim() || "this"}`,
      question: inp.question.trim(),
      expectation: `About ${fmt(finalN)} ${unit}. The outside view (${stats.n} comparable cases) ran ${fmt(
        stats.min
      )}–${fmt(stats.max)}, middle ${fmt(stats.median)}. My first instinct was ${fmt(inp.inside)} ${unit}.`,
      call: inp.adjustReason.trim()
        ? `Adjusted off the base because: ${inp.adjustReason.trim()}`
        : `Started from the base case, no adjustment.`,
      confidence: conf,
      reviewOn,
    });
    setLogged({ conf, reviewOn, n: stats.n });
  }

  const reviewPreview = addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS);

  return (
    <div>
      {/* ---- New here? A read-only worked example (never touches the fields) ---- */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowExample((s) => !s)}
          className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {showExample ? "Hide the worked example ↑" : "New here? See a worked example ↓"}
        </button>
        {showExample ? <OutsideExample /> : null}
      </div>

      {/* ---- Step 1: the frame ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 1 — what are you forecasting?
        </p>
        <div className="mt-3">
          <input
            type="text"
            value={inp.question}
            onChange={(e) => set("question", e.target.value)}
            placeholder="e.g. How long will the kitchen renovation take?"
            className={inputClass}
          />
        </div>
        <div className="mt-3 max-w-[10rem]">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            In what unit?
          </label>
          <input
            type="text"
            value={inp.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="weeks"
            className={inputClass}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          A time or a cost — anything with a number and a unit. Days, weeks,
          dollars, hours.
        </p>
      </div>

      {/* ---- Step 2: seal your own estimate FIRST ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 2 — your own estimate, before you look at anything
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Answer from your plan, the way you would if someone asked you right now.
          Do this <em>before</em> the comparison below — otherwise the cases you
          pick will quietly anchor your number, and the gap we came here to find
          disappears.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="max-w-[10rem]">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Your estimate
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="any"
                value={inp.inside ?? ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  set("inside", Number.isFinite(v) ? v : null);
                }}
                disabled={inp.sealed}
                placeholder="6"
                className={`${inputClass} ${inp.sealed ? "opacity-60" : ""}`}
              />
              <span className="text-sm text-[var(--muted)] whitespace-nowrap">{unit}</span>
            </div>
          </div>
          {inp.sealed ? (
            <button
              type="button"
              onClick={() => set("sealed", false)}
              className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity pb-2"
            >
              Edit it
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (inp.inside != null) set("sealed", true);
              }}
              disabled={inp.inside == null}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Lock it in ↓
            </button>
          )}
        </div>
        {inp.sealed && inp.inside != null ? (
          <p className="mt-3 text-sm text-[var(--foreground)]">
            Sealed:{" "}
            <span className="font-medium">
              {fmt(inp.inside)} {unit}
            </span>
            . Now forget the plan and go find out what actually happened to things
            like it.
          </p>
        ) : null}
      </div>

      {/* ---- Step 3: build the reference class ---- */}
      {inp.sealed && inp.inside != null ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Step 3 — the reference class: things like this that already happened
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Yours or other people&rsquo;s — but real cases with{" "}
            <em>actual outcomes</em>, not more guesses. List what each one really
            took. The class already counted the surprises your plan can&rsquo;t
            see.
          </p>

          <div className="mt-4 space-y-2">
            {inp.cases.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={c.label}
                  onChange={(e) => setCase(c.id, { label: e.target.value })}
                  placeholder={`Case ${i + 1} — what was it?`}
                  className={`${inputClass} flex-1`}
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={c.value ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setCase(c.id, { value: Number.isFinite(v) ? v : null });
                    }}
                    placeholder="—"
                    className={`${inputClass} w-20 text-right`}
                    aria-label={`Actual ${unit} for case ${i + 1}`}
                  />
                  <span className="text-xs text-[var(--muted)] w-10">{unit}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCase(c.id)}
                  className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors px-1"
                  aria-label={`Remove case ${i + 1}`}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCase}
            className="mt-3 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            + Add another case
          </button>

          <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Choosing the class — the genuinely hard part
            </p>
            <ul className="mt-2 space-y-1.5 text-xs text-[var(--muted)] leading-relaxed">
              <li>
                <span className="text-[var(--foreground)]">Start broad,</span> narrow
                only as far as a <em>measured</em> difference takes you — never with
                adjectives (&ldquo;but ours is well-run&rdquo; is not a reference
                class).
              </li>
              <li>
                <span className="text-[var(--foreground)]">Reject folklore</span> you
                can&rsquo;t source. A number someone once said is not an outcome.
              </li>
              <li>
                <span className="text-[var(--foreground)]">A class of one is not a
                class.</span>{" "}
                Aim for at least three; more is better.
              </li>
            </ul>
          </div>
        </div>
      ) : null}

      {/* ---- The reveal: the base case vs your sealed plan ---- */}
      {inp.sealed && inp.inside != null ? (
        stats ? (
          <Reveal
            stats={stats}
            inside={inp.inside}
            unit={unit}
            adjusted={inp.adjusted}
            adjustReason={inp.adjustReason}
            onAdjusted={(v) => set("adjusted", v)}
            onReason={(v) => set("adjustReason", v)}
          />
        ) : (
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              A class of one is not a class.
            </p>
            <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
              You have {filledCases} case{filledCases === 1 ? "" : "s"} with a real
              number so far. With fewer than three, there&rsquo;s no distribution to
              read — one comparison is just another anecdote, and the outside view
              is a <em>shape</em>, not a single other data point. Add a couple more
              and the base case appears.
            </p>
          </div>
        )
      ) : null}

      {/* ---- The handoff ---- */}
      {stats && inp.inside != null ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] p-5 sm:p-6">
          {logged ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                Logged to your journal
              </p>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Filed as a tracked forecast at {logged.conf}% confidence, with a
                review set for {formatHuman(logged.reviewOn)}. When the day comes,
                the{" "}
                <Link
                  href="/decide?log=1"
                  className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                >
                  decision journal
                </Link>{" "}
                will ask what it actually took, and grade the outside view against
                the number your instinct first reached for.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                Put it on the record
              </p>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                A forecast is only worth making if reality gets to grade it. Log
                your outside-view number —{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {fmt(inp.adjusted != null ? inp.adjusted : stats.median)} {unit}
                </span>{" "}
                — to the{" "}
                <Link
                  href="/decide"
                  className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                >
                  decision journal
                </Link>
                , with a review on {formatHuman(reviewPreview)}, and find out later
                whether the class or your gut called it.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="text-sm text-[var(--muted)]">
                  How sure is this estimate?{" "}
                  <select
                    value={conf}
                    onChange={(e) => setConf(parseInt(e.target.value, 10))}
                    className="ml-1 px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                  >
                    {CONFIDENCE_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}%
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={handleLog}
                  className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
                >
                  Log this forecast
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The reveal. Reads where the sealed plan sits in the class, names the gap in
 * the planning fallacy's terms, then opens the modest-adjustment step with its
 * two guards: the spread guard (a wide class can't honestly promise a point) and
 * the re-import guard (if you adjust back to your first instinct without a
 * measured reason, you've smuggled the inside view back in).
 */
function Reveal({
  stats,
  inside,
  unit,
  adjusted,
  adjustReason,
  onAdjusted,
  onReason,
}: {
  stats: Stats;
  inside: number;
  unit: string;
  adjusted: number | null;
  adjustReason: string;
  onAdjusted: (v: number | null) => void;
  onReason: (v: string) => void;
}) {
  const { min, max, median, n, sorted } = stats;
  const higher = sorted.filter((v) => v > inside).length;
  const wide = min > 0 && max / min >= 3;
  const nearMedian = median > 0 && Math.abs(inside - median) / median <= 0.1;

  // The tiered read of where the plan lands.
  let headline: string;
  let body: React.ReactNode;
  if (inside < min) {
    headline = "Your plan is off the bottom of the whole class.";
    body = (
      <>
        Every one of the {n} comparable cases came in above your {fmt(inside)}-{unit}{" "}
        estimate. It isn&rsquo;t just optimistic — it&rsquo;s outside the entire
        range of what actually happened ({fmt(min)}–{fmt(max)} {unit}). This is the
        planning fallacy in its purest form: the plan is a best-case story, and the
        best case isn&rsquo;t in the data.
      </>
    );
  } else if (inside < median) {
    headline = `${higher} of ${n} comparable cases ran longer than your plan.`;
    body = (
      <>
        Your instinct ({fmt(inside)} {unit}) sits below the middle of the class
        ({fmt(median)} {unit}). That&rsquo;s the planning fallacy&rsquo;s
        signature — not a lie you&rsquo;re telling, just the view from inside a
        plan, which can only see the path that goes right. The class has already
        counted the surprises.
      </>
    );
  } else if (nearMedian) {
    headline = "Your instinct lands near the middle of the class.";
    body = (
      <>
        Inside view and outside view agree — the rarer, calmer case. A forecast
        that survives the comparison is one to trust <em>more</em>, not less. Start
        from {fmt(median)} {unit} and you&rsquo;re on firm ground.
      </>
    );
  } else if (inside <= max) {
    headline = "Your instinct runs above the middle of the class.";
    body = (
      <>
        Above the median ({fmt(median)} {unit}) but still inside the range. Either
        you&rsquo;re padding — no bad thing, if it&rsquo;s deliberate — or you know
        something specific that makes this case slower. If you can name that
        something and measure it, keep it. If it&rsquo;s just a feeling, the middle
        is the more honest place to stand.
      </>
    );
  } else {
    headline = "Your instinct runs above everything that actually happened.";
    body = (
      <>
        Your {fmt(inside)}-{unit} estimate is above the whole class ({fmt(min)}–
        {fmt(max)} {unit}). Unusual — most plans run optimistic, not pessimistic.
        Make sure you&rsquo;re not over-correcting, or padding a number nobody will
        thank you for.
      </>
    );
  }

  const finalN = adjusted != null ? adjusted : median;
  const reImport = inside < median && adjusted != null && adjusted <= inside;
  const inRange = adjusted != null && adjusted >= min && adjusted <= max;
  const belowClass = adjusted != null && adjusted < min;

  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        The base case
      </p>

      {/* The five numbers */}
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <Stat label="Lowest" value={`${fmt(min)}`} unit={unit} />
        <Stat label="Middle" value={`${fmt(median)}`} unit={unit} emphasis />
        <Stat label="Highest" value={`${fmt(max)}`} unit={unit} />
      </div>

      <OutsideTrack stats={stats} inside={inside} adjusted={adjusted} unit={unit} />

      {/* The read */}
      <div className="mt-5">
        <p className="text-sm font-semibold text-[var(--foreground)]">{headline}</p>
        <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">{body}</p>
      </div>

      {/* The spread guard */}
      {wide ? (
        <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            This class is too spread out to promise a point
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            The cases run from {fmt(min)} to {fmt(max)} {unit} — more than a 3× spread.
            When the class is this varied, the honest forecast isn&rsquo;t a single
            number, it&rsquo;s a <em>range</em>. Promise {fmt(min)}–{fmt(max)} {unit},
            plan around the middle, and hold back a buffer for the top of it.
          </p>
        </div>
      ) : null}

      {/* Step 4: the modest adjustment */}
      <div className="mt-5 pt-5 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 4 — adjust off the base, modestly
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Start from {fmt(median)} {unit} and move only for a difference you can
          actually measure — and only a little. Leave it blank to take the base case
          as-is.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="max-w-[10rem]">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Your outside-view number
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="any"
                value={adjusted ?? ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onAdjusted(Number.isFinite(v) ? v : null);
                }}
                placeholder={fmt(median)}
                className={`${inputClass} w-full`}
              />
              <span className="text-sm text-[var(--muted)] whitespace-nowrap">{unit}</span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            The one measured difference that justifies moving
          </label>
          <input
            type="text"
            value={adjustReason}
            onChange={(e) => onReason(e.target.value)}
            placeholder="e.g. our scope is smaller — one fewer room than most of these"
            className={inputClass}
          />
        </div>

        {/* The re-import guard */}
        {reImport ? (
          <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              You&rsquo;ve adjusted back to your first instinct.
            </p>
            <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
              Your outside-view number ({fmt(finalN)} {unit}) is at or below the very
              estimate the class just disagreed with. That&rsquo;s the trap: if you
              can&rsquo;t name a <em>measured</em> reason this case beats the class,
              you&rsquo;ve quietly slid back inside the plan. Knowing about the inside
              view doesn&rsquo;t protect you from it — that&rsquo;s exactly why this
              step is a checklist item and not a feeling.
            </p>
          </div>
        ) : belowClass ? (
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            That&rsquo;s below <em>every</em> case in the class. Make sure the reason
            is real and measured — the class is unanimous against you here.
          </p>
        ) : inRange && adjusted != null ? (
          <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
            Grounded: {fmt(finalN)} {unit}{" "}
            sits inside what actually happened to comparable cases. That&rsquo;s a
            forecast with the surprises already priced in.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  emphasis,
}: {
  label: string;
  value: string;
  unit: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        emphasis ? "border-[var(--accent)]" : "border-[var(--border)]"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--foreground)] leading-none">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-[var(--muted)]">{unit}</p>
    </div>
  );
}

/**
 * The distribution, drawn. A scale spanning the class (padded to include the plan
 * if it falls outside), the individual cases as faint dots, the median as a solid
 * tick, your sealed plan marked above, and the adjusted number marked below.
 */
function OutsideTrack({
  stats,
  inside,
  adjusted,
  unit,
}: {
  stats: Stats;
  inside: number;
  adjusted: number | null;
  unit: string;
}) {
  const { min, max, median, values } = stats;
  const lo = Math.min(min, inside, adjusted ?? inside);
  const hi = Math.max(max, inside, adjusted ?? inside);
  const span = hi - lo;
  const pos = (v: number) => (span <= 0 ? 50 : ((v - lo) / span) * 100);
  const clampPct = (p: number) => Math.max(0, Math.min(100, p));

  return (
    <div className="mt-5">
      <div className="relative h-14">
        {/* the class band, min→max */}
        <div className="absolute inset-x-0 top-8 h-1.5 rounded-full bg-[var(--border)]" aria-hidden />
        <div
          className="absolute top-8 h-1.5 rounded-full bg-[var(--accent)] opacity-30"
          style={{ left: `${clampPct(pos(min))}%`, width: `${clampPct(pos(max)) - clampPct(pos(min))}%` }}
          aria-hidden
        />
        {/* individual cases */}
        {values.map((v, i) => (
          <div
            key={i}
            className="absolute top-[30px] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--muted)]"
            style={{ left: `${clampPct(pos(v))}%` }}
            aria-hidden
          />
        ))}
        {/* median tick */}
        <div
          className="absolute top-6 -translate-x-1/2 w-0.5 h-5 bg-[var(--foreground)]"
          style={{ left: `${clampPct(pos(median))}%` }}
          aria-hidden
        />
        {/* your plan marker (above) */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${clampPct(pos(inside))}%` }}
        >
          <span className="text-[10px] font-semibold text-[var(--foreground)] leading-none whitespace-nowrap">
            your plan
          </span>
          <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-[var(--foreground)]" aria-hidden />
        </div>
        {/* adjusted marker (below), only if set and meaningfully apart from the plan */}
        {adjusted != null && Math.abs(pos(adjusted) - pos(inside)) >= 2 ? (
          <div
            className="absolute top-10 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${clampPct(pos(adjusted))}%` }}
          >
            <span className="w-2 h-2 rounded-full border border-[var(--accent)] bg-[var(--card)]" aria-hidden />
            <span className="mt-0.5 text-[10px] text-[var(--accent)] leading-none whitespace-nowrap">
              adjusted
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--muted)] tabular-nums">
        <span>
          {fmt(lo)} {unit}
        </span>
        <span className="font-medium text-[var(--foreground)]">
          middle {fmt(median)}
        </span>
        <span>
          {fmt(hi)} {unit}
        </span>
      </div>
    </div>
  );
}

/**
 * The worked example, rendered read-only. It runs the same computeStats the live
 * tool does over a fixed reference class and reuses OutsideTrack — so a newcomer
 * sees exactly what a finished pass produces, and not a character of it lands in
 * their own fields or storage.
 */
function OutsideExample() {
  const stats = computeStats(EXAMPLE.cases.map((c) => c.value).filter((v): v is number => v != null))!;
  const unit = unitOf(EXAMPLE);
  const inside = EXAMPLE.inside!;
  const higher = stats.sorted.filter((v) => v > inside).length;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{EXAMPLE.question}</span> Your plan says{" "}
        <span className="font-medium">
          {fmt(inside)} {unit}
        </span>
        . Before trusting it, you list five renovations that actually finished:{" "}
        {EXAMPLE.cases.map((c) => `${fmt(c.value!)}`).join(", ")} {unit}.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Lowest" value={fmt(stats.min)} unit={unit} />
          <Stat label="Middle" value={fmt(stats.median)} unit={unit} emphasis />
          <Stat label="Highest" value={fmt(stats.max)} unit={unit} />
        </div>
        <OutsideTrack stats={stats} inside={inside} adjusted={EXAMPLE.adjusted} unit={unit} />
        <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
          All {stats.n} of {stats.n} cases ran longer than the plan.
        </p>
        <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
          The {fmt(inside)}-{unit} instinct sits below the whole class ({fmt(stats.min)}–
          {fmt(stats.max)} {unit}, middle {fmt(stats.median)}) — {higher} of {stats.n}{" "}
          comparable jobs took longer. Starting from the middle and stepping down
          one modest, measured notch for a smaller scope lands at{" "}
          <span className="text-[var(--foreground)] font-medium">
            {fmt(EXAMPLE.adjusted!)} {unit}
          </span>{" "}
          — still inside what really happened, instead of the best-case story.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own form below is blank — enter the forecast you actually came here to
        pressure-test.
      </p>
    </div>
  );
}
