"use client";

import { useEffect, useMemo, useState } from "react";
import {
  readCarriedSubject,
  clearCarriedSubject,
  withSubject,
  readCarriedOptions,
  readCarriedFrom,
  CARRY_SOURCES,
  type CarrySource,
} from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import Link from "next/link";
import {
  appendDecisionEntry,
  CONFIDENCE_OPTIONS,
  todayISO,
  addDaysISO,
  REVIEW_DEFAULT_DAYS,
} from "../data/decisionLog";
import { loadJournalProfile } from "../data/journal";

/**
 * The flip point (/weigh).
 *
 * Every other tool on the site helps you *produce* a number — how sure you are
 * (calibrate), how to reach one (estimate), how far a fact should move it
 * (update), how to record it (decide), how to stress a plan (premortem). This
 * one is the missing verb: turning the number into a decision.
 *
 * It refuses the false precision of a full expected-value spreadsheet. Following
 * Pauker & Kassirer's threshold approach (NEJM, 1980) — doctors don't need the
 * exact probability of disease, only which side of a treatment threshold they're
 * on — the tool's real output isn't a verdict. It's the flip point: the
 * probability at which the two choices break even, and the one honest question —
 * are you clearly on one side of that line, or is this too close for the numbers
 * to decide?
 *
 * TWO FRAMES, ONE LINE. The tool opens on its original frame — a single move you
 * can take or skip, against a status quo you treat as the fixed zero. Its flip
 * point is p* = R / (B + R), where B is how much better acting is than holding
 * if it works out and R is how much worse if it doesn't. But the tool's own
 * stated moment is "stuck between two options," and a great many real calls —
 * two job offers, two apartments, buy or rent — aren't a move against a status
 * quo; they're two live options, *both* uncertain, neither of them the default.
 * Forcing those into "act vs. hold" is a lie about the shape of the choice. So a
 * second frame, "A or B," draws the same line for a symmetric two-option call:
 * name the one uncertain thing that decides which option is right, put the two
 * *regrets* on a scale (picking A when B was right; picking B when A was right),
 * and the flip point becomes p* = regretA / (regretA + regretB) — the probability
 * the hinge has to favor A before A is the bet. Same minimize-expected-regret
 * arithmetic; the honest frame for the moment you're actually in.
 *
 * Nothing here is sent anywhere. The inputs persist in your browser so a reload
 * doesn't wipe them; a decision you commit to can be logged to the journal as a
 * tracked forecast through the shared decisionLog appender — the same front door
 * the pre-mortem room uses. The mode you last used persists too, so the frame
 * you think in is the one waiting when you come back.
 */

const STORE_KEY = "weigh:v1";

/** Which frame the tool is in. "act" — a move vs. a status quo (the original).
 *  "ab" — a straight choice between two live options. */
type Mode = "act" | "ab";

type Inputs = {
  mode: Mode;
  decision: string;
  /** How sure the good case happens (act mode) / the hinge favors A (ab mode). 1–99. */
  p: number;
  hinge: string;
  /** The bad case is one you couldn't recover from. */
  ruin: boolean;

  // ---- "act or hold" frame ------------------------------------------------
  actLabel: string;
  altLabel: string;
  /** Upside of acting vs the alternative if it works — a positive magnitude. */
  upside: number;
  /** Downside of acting vs the alternative if it doesn't — a positive magnitude. */
  downside: number;

  // ---- "A or B" frame -----------------------------------------------------
  optionA: string;
  optionB: string;
  /** How bad it is to have picked A when B turns out right — a positive magnitude. */
  regretA: number;
  /** How bad it is to have picked B when A turns out right — a positive magnitude. */
  regretB: number;
};

/**
 * The blank the tool opens on: no decision, no magnitudes, a mid-point
 * probability, the original "act or hold" frame. With the magnitudes at zero the
 * flip point simply doesn't compute yet (calc is null), so the verdict — and the
 * "log this as a forecast" button — stay hidden until there's a real decision in
 * the fields. That closes the old hazard where a hurried visitor could file the
 * demo's "Take the new job" into their permanent journal. The illustrative
 * scenarios live in the EXAMPLE constants, shown read-only behind a toggle and
 * never written to the live fields or to storage.
 */
const BLANK: Inputs = {
  mode: "act",
  decision: "",
  p: 50,
  hinge: "",
  ruin: false,
  actLabel: "",
  altLabel: "",
  upside: 0,
  downside: 0,
  optionA: "",
  optionB: "",
  regretA: 0,
  regretB: 0,
};

const EXAMPLE: Inputs = {
  ...BLANK,
  mode: "act",
  decision: "Take the new job",
  actLabel: "Take it",
  altLabel: "Stay",
  hinge: "A year from now I'm happier and growing faster than I would have been",
  p: 65,
  upside: 7,
  downside: 5,
};

const EXAMPLE_AB: Inputs = {
  ...BLANK,
  mode: "ab",
  decision: "Two job offers",
  optionA: "The startup",
  optionB: "The established company",
  hinge: "The startup is still thriving in two years",
  p: 60,
  regretA: 6,
  regretB: 9,
};

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      mode: v.mode === "ab" ? "ab" : "act",
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      p: clampP(typeof v.p === "number" ? v.p : BLANK.p),
      hinge: typeof v.hinge === "string" ? v.hinge : BLANK.hinge,
      ruin: typeof v.ruin === "boolean" ? v.ruin : BLANK.ruin,
      actLabel: typeof v.actLabel === "string" ? v.actLabel : BLANK.actLabel,
      altLabel: typeof v.altLabel === "string" ? v.altLabel : BLANK.altLabel,
      upside: nonNeg(typeof v.upside === "number" ? v.upside : BLANK.upside),
      downside: nonNeg(typeof v.downside === "number" ? v.downside : BLANK.downside),
      optionA: typeof v.optionA === "string" ? v.optionA : BLANK.optionA,
      optionB: typeof v.optionB === "string" ? v.optionB : BLANK.optionB,
      regretA: nonNeg(typeof v.regretA === "number" ? v.regretA : BLANK.regretA),
      regretB: nonNeg(typeof v.regretB === "number" ? v.regretB : BLANK.regretB),
    };
  } catch {
    return BLANK;
  }
}

function clampP(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(99, Math.round(n)));
}

function nonNeg(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/** Snap a 1–99 probability to the nearest journal confidence option (50–90). */
function snapConfidence(p: number): number {
  let best = CONFIDENCE_OPTIONS[0] as number;
  let bestD = Infinity;
  for (const c of CONFIDENCE_OPTIONS) {
    const d = Math.abs(c - p);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function formatHuman(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";

// How close is "too close to call"? Below an 8-point margin, a decision built
// on made-up magnitudes is inside its own noise — the honest answer is "even."
const CLOSE = 0.08;

export default function WeighClient() {
  const [inp, setInp] = useState<Inputs>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [gap, setGap] = useState<number | null>(null);
  const [scored, setScored] = useState(0);
  const [logged, setLogged] = useState<null | { conf: number; reviewOn: string }>(null);
  const [showExample, setShowExample] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [carriedFrom, setCarriedFrom] = useState<CarrySource | "">("");
  // The two option labels carried in from a two-option handoff (the halo-off
  // comparison's finalists), tracked so the A/B "carried over" cue can show
  // while they're untouched and name where they came from.
  const [optSeed, setOptSeed] = useState<{ a: string; b: string } | null>(null);

  // Load persisted inputs and the real-world calibration signal on mount.
  useEffect(() => {
    const loaded = loadInputs();
    // Carry the decision in from another tool's handoff, but never over saved
    // work: pre-fill the subject only when this tool's own field is still blank.
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.decision.trim();
    let next = seeded ? { ...loaded, decision: carried } : loaded;

    // A two-option handoff also carries both finalists. Seed them into the A/B
    // frame — and switch to that frame — but only when this tool's own option
    // fields are blank, so an incoming link can never clobber a call in
    // progress. Same never-clobber rule the subject seed follows.
    const carriedOpts = readCarriedOptions();
    const from = readCarriedFrom();
    const seedOpts =
      Boolean(carriedOpts.optionA) &&
      Boolean(carriedOpts.optionB) &&
      !next.optionA.trim() &&
      !next.optionB.trim();
    if (seedOpts) {
      next = {
        ...next,
        mode: "ab",
        optionA: carriedOpts.optionA,
        optionB: carriedOpts.optionB,
      };
    }

    let g: number | null = null;
    let s = 0;
    try {
      const prof = loadJournalProfile();
      g = prof.gap;
      s = prof.scored;
    } catch {
      /* no journal data — the adjustment simply won't show */
    }
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setInp(next);
    setGap(g);
    setScored(s);
    setHydrated(true);
    if (seeded) setCarriedSeed(carried);
    if (seedOpts) setOptSeed({ a: carriedOpts.optionA, b: carriedOpts.optionB });
    if ((seeded || seedOpts) && from) setCarriedFrom(from);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (carried || seedOpts || from) clearCarriedSubject();
  }, []);

  // Persist on every change, once hydrated (so we don't clobber saved inputs
  // with the seed before the first load lands).
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

  // Switching frames resets the "logged" confirmation (a call logged in one
  // frame shouldn't read as logged in the other) but keeps every field, so a
  // decision half-entered in one frame is still there if you switch back.
  const setMode = (m: Mode) =>
    setInp((prev) => (prev.mode === m ? prev : { ...prev, mode: m }));

  // Name the source in the "carried over" cue when a handoff told us where it
  // came from ("carried from your comparison" beats the generic "your last
  // step"). Falls back to undefined so CarriedNote uses its default wording.
  const sourceLabel = carriedFrom ? CARRY_SOURCES[carriedFrom] : "";
  const subjectLead = sourceLabel
    ? `Carried from ${sourceLabel} — edit it above, or`
    : undefined;

  // ---- "act or hold" compute --------------------------------------------
  const calc = useMemo(() => {
    const B = inp.upside;
    const R = inp.downside;
    const total = B + R;
    if (total <= 0) return null;
    const flip = R / total; // p* — the break-even probability, 0–1
    const p = inp.p / 100;
    const margin = p - flip; // >0 → acting wins on the numbers
    const evAct = p * B - (1 - p) * R; // relative to the alternative (= 0)
    // The required upside-to-downside ratio at the current probability:
    // acting wins iff B/R > (1 - p) / p.
    const requiredRatio = p > 0 ? (1 - p) / p : Infinity;
    return { B, R, flip, p, margin, evAct, requiredRatio };
  }, [inp.upside, inp.downside, inp.p]);

  // ---- "A or B" compute -------------------------------------------------
  // Same threshold arithmetic, made symmetric. p is the probability the hinge
  // favors A; the flip point is the probability at which A and B break even on
  // expected regret. Pick A iff (1-p)·regretA < p·regretB — i.e. iff p is above
  // p* = regretA / (regretA + regretB).
  const calcAB = useMemo(() => {
    const rA = inp.regretA; // regret of having picked A when B was right
    const rB = inp.regretB; // regret of having picked B when A was right
    const total = rA + rB;
    if (total <= 0) return null;
    const flip = rA / total; // p* — the break-even probability the hinge favors A
    const p = inp.p / 100;
    const margin = p - flip; // >0 → A wins on the numbers
    return { rA, rB, flip, p, margin };
  }, [inp.regretA, inp.regretB, inp.p]);

  const flipPct = calc ? Math.round(calc.flip * 100) : null;
  const flipPctAB = calcAB ? Math.round(calcAB.flip * 100) : null;

  const tooClose = calc ? Math.abs(calc.margin) < CLOSE : false;
  const tooCloseAB = calcAB ? Math.abs(calcAB.margin) < CLOSE : false;

  // The calibration adjustment: shave your measured overconfidence off the
  // probability and see whether you're still on the same side of the line.
  // Only meaningful for the "act or hold" frame, where p is "how sure it works
  // out" — the exact quantity the journal grades. In "A or B," p is "which way
  // the hinge falls," a directionless split the overconfidence gap doesn't map
  // onto cleanly, so the adjustment is left out of that frame on purpose.
  const adjP = gap != null && scored >= 3 ? clampP(inp.p - gap) : null;
  const adjSide = calc && adjP != null ? adjP / 100 - calc.flip : null;

  function handleLog() {
    if (!calc) return;
    const conf = snapConfidence(inp.p);
    const reviewOn = addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS);
    appendDecisionEntry({
      situationTitle: inp.decision.trim() || "A decision",
      decision: `${inp.actLabel.trim() || "Act"} — ${inp.decision.trim() || "this decision"}`,
      question: inp.decision.trim(),
      expectation:
        inp.hinge.trim() ||
        `${inp.actLabel.trim() || "Acting"} works out.`,
      call: `Flip point ${flipPct}%; my read ${inp.p}%.`,
      confidence: conf,
      reviewOn,
    });
    setLogged({ conf, reviewOn });
  }

  function handleLogAB() {
    if (!calcAB) return;
    const pickA = calcAB.margin >= 0;
    const chosen = pickA
      ? inp.optionA.trim() || "Option A"
      : inp.optionB.trim() || "Option B";
    const other = pickA
      ? inp.optionB.trim() || "the other option"
      : inp.optionA.trim() || "the other option";
    // Confidence that the chosen option is the right one: p is the odds the
    // hinge favors A, so the chosen side's odds are p (if A) or 100 - p (if B).
    const pRight = pickA ? inp.p : 100 - inp.p;
    const conf = snapConfidence(pRight);
    const reviewOn = addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS);
    appendDecisionEntry({
      situationTitle: inp.decision.trim() || "A decision",
      decision: `${chosen} — over ${other}`,
      question: inp.decision.trim(),
      expectation:
        inp.hinge.trim() || `${chosen} turns out to be the right call.`,
      call: `Flip point ${flipPctAB}% (odds the call favors ${inp.optionA.trim() || "A"}); my read ${inp.p}%. Leaning ${chosen}.`,
      confidence: conf,
      reviewOn,
    });
    setLogged({ conf, reviewOn });
  }

  const reviewPreview = addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS);

  const marginPts = calc ? Math.round(Math.abs(calc.margin) * 100) : 0;
  const marginPtsAB = calcAB ? Math.round(Math.abs(calcAB.margin) * 100) : 0;

  return (
    <div>
      {/* ---- The frame toggle ---- */}
      <div className="mb-5">
        <div
          role="tablist"
          aria-label="Which shape is your decision?"
          className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--card)] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inp.mode === "act"}
            onClick={() => setMode("act")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              inp.mode === "act"
                ? "bg-[var(--accent)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Do this, or don&rsquo;t
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inp.mode === "ab"}
            onClick={() => setMode("ab")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              inp.mode === "ab"
                ? "bg-[var(--accent)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            A, or B
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          {inp.mode === "act" ? (
            <>
              One move you could make or skip, weighed against staying put — the
              alternative is the fixed zero.
            </>
          ) : (
            <>
              Two live options, both uncertain, neither one the default — a
              straight choice between them.
            </>
          )}
        </p>
      </div>

      {/* ---- New here? A read-only worked example (never touches the fields) ---- */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowExample((s) => !s)}
          className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {showExample
            ? "Hide the worked example ↑"
            : "New here? See a worked example ↓"}
        </button>
        {showExample ? (
          inp.mode === "act" ? <WeighExample /> : <WeighExampleAB />
        ) : null}
      </div>

      {inp.mode === "act" ? (
        /* ==================== ACT OR HOLD ==================== */
        <>
          {/* ---- The frame ---- */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              What are you deciding?
            </label>
            <input
              type="text"
              value={inp.decision}
              onChange={(e) => set("decision", e.target.value)}
              placeholder="e.g. Take the new job"
              className={inputClass}
            />
            <CarriedNote
              show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
              lead={subjectLead}
              onClear={() => {
                set("decision", "");
                setCarriedSeed("");
              }}
            />

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
                  The move
                </label>
                <input
                  type="text"
                  value={inp.actLabel}
                  onChange={(e) => set("actLabel", e.target.value)}
                  placeholder="Take it"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
                  The alternative
                </label>
                <input
                  type="text"
                  value={inp.altLabel}
                  onChange={(e) => set("altLabel", e.target.value)}
                  placeholder="Stay"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
                The one thing it turns on
              </label>
              <input
                type="text"
                value={inp.hinge}
                onChange={(e) => set("hinge", e.target.value)}
                placeholder="The uncertain fact the whole decision depends on"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                If you can&rsquo;t name the one thing it hinges on, you&rsquo;re not
                ready to decide — you&rsquo;re still gathering.
              </p>
            </div>
          </div>

          {/* ---- The three numbers ---- */}
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              The stakes, on one scale
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              Rate both against <em>{inp.altLabel.trim() || "the alternative"}</em>{" "}
              — the alternative is the zero. Only the <em>ratio</em>{" "}matters, so
              any consistent scale works: 0–10, or dollars, or years. Don&rsquo;t
              agonize over the exact figures; the point is where they put the line.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  If <span className="text-[var(--accent)]">{inp.actLabel.trim() || "you act"}</span> and it works out
                </label>
                <p className="text-xs text-[var(--muted)] mb-2">
                  How much better than {inp.altLabel.trim() || "the alternative"}? (the upside)
                </p>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={Number.isFinite(inp.upside) ? inp.upside : 0}
                  onChange={(e) => set("upside", nonNeg(parseFloat(e.target.value)))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  If <span className="text-[var(--accent)]">{inp.actLabel.trim() || "you act"}</span> and it doesn&rsquo;t
                </label>
                <p className="text-xs text-[var(--muted)] mb-2">
                  How much worse than {inp.altLabel.trim() || "the alternative"}? (the downside)
                </p>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={Number.isFinite(inp.downside) ? inp.downside : 0}
                  onChange={(e) => set("downside", nonNeg(parseFloat(e.target.value)))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-2">
                <label
                  htmlFor="weigh-p"
                  className="block text-sm font-medium text-[var(--foreground)]"
                >
                  How sure are you it works out?
                </label>
                <span className="text-lg font-semibold tabular-nums text-[var(--foreground)]">
                  {inp.p}%
                </span>
              </div>
              <input
                id="weigh-p"
                type="range"
                min={1}
                max={99}
                value={inp.p}
                onChange={(e) => set("p", clampP(parseInt(e.target.value, 10)))}
                className="w-full accent-[var(--accent)]"
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                Your honest probability that the hinge resolves the good way. This is
                the number the{" "}
                <Link href="/calibrate" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
                  calibration trainer
                </Link>{" "}
                teaches you to trust.
              </p>
            </div>

            <label className="mt-5 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inp.ruin}
                onChange={(e) => set("ruin", e.target.checked)}
                className="mt-1 accent-[var(--accent)]"
              />
              <span className="text-sm text-[var(--muted)] leading-relaxed">
                The bad case is one I <strong className="text-[var(--foreground)]">couldn&rsquo;t
                recover from</strong> — ruin, not just a setback.
              </span>
            </label>
          </div>

          {/* ---- The verdict ---- */}
          {calc && flipPct != null ? (
            <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
              {inp.ruin ? <RuinWarning /> : null}

              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                The flip point
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
                {flipPct}%
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
                Above {flipPct}% sure,{" "}
                <span className="font-medium">{inp.actLabel.trim() || "acting"}</span>{" "}
                beats{" "}
                <span className="font-medium">{inp.altLabel.trim() || "the alternative"}</span>{" "}
                on the numbers. Below it, {inp.altLabel.trim() || "the alternative"}{" "}
                wins. You put yourself at{" "}
                <span className="font-medium">{inp.p}%</span>.
              </p>

              {/* The line, drawn */}
              <FlipTrack
                flip={calc.flip}
                you={calc.p}
                adj={adjP != null ? adjP / 100 : null}
              />

              {/* The read */}
              {tooClose ? (
                <TooCloseRead marginPts={marginPts} />
              ) : (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {calc.margin > 0
                      ? `Clear enough: ${inp.actLabel.trim() || "act"}.`
                      : `Clear enough: ${inp.altLabel.trim() || "hold"}.`}
                  </p>
                  <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                    You&rsquo;re {marginPts} points{" "}
                    {calc.margin > 0 ? "above" : "below"}{" "}
                    the line — enough daylight that you&rsquo;d have to be badly
                    wrong about your own odds for the decision to flip.
                  </p>
                </div>
              )}

              {/* The calibration adjustment — where the practice pays off */}
              {adjP != null && adjSide != null && gap != null ? (
                <div className="mt-5 pt-5 border-t border-[var(--border)]">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Your track record, applied
                  </p>
                  {Math.abs(gap) < 3 ? (
                    <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                      Your reviewed forecasts have run within {Math.abs(gap)} point
                      {Math.abs(gap) === 1 ? "" : "s"} of the mark — well calibrated,
                      so your {inp.p}% is worth taking at face value here.
                    </p>
                  ) : gap > 0 ? (
                    <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                      Your reviewed forecasts have run about{" "}
                      <span className="font-medium text-[var(--foreground)]">{gap} points overconfident</span>.
                      Shave that off and your {inp.p}% becomes{" "}
                      <span className="font-medium text-[var(--foreground)]">~{adjP}%</span> —{" "}
                      {adjSide >= 0
                        ? `still above the ${flipPct}% line. The call survives your own history.`
                        : `now below the ${flipPct}% line. On your track record, this isn't the bet it looks like.`}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                      Your reviewed forecasts have run about {Math.abs(gap)} points{" "}
                      <span className="font-medium text-[var(--foreground)]">under</span>confident —
                      if anything, your {inp.p}% is a touch pessimistic, and the real
                      figure sits nearer ~{adjP}%.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Value of information — the only number worth agonizing over */}
              <div className="mt-5 pt-5 border-t border-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Where to spend your worry
                </p>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                  At {inp.p}% sure, {inp.actLabel.trim() || "acting"} pays as long as
                  the upside is at least{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {calc.requiredRatio < 100 ? calc.requiredRatio.toFixed(2) : "∞"}×
                  </span>{" "}
                  the downside. The only input worth another hour of thought is the one
                  nearest the line — refining a number that can&rsquo;t change which
                  side you&rsquo;re on buys you nothing.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Give the upside and the downside a size — even a rough one — and the
                flip point appears.
              </p>
            </div>
          )}

          {/* ---- The handoff ---- */}
          {calc && !inp.ruin ? (
            <div className="mt-5 rounded-xl border border-[var(--border)] p-5 sm:p-6">
              {logged ? (
                <LoggedNote logged={logged} subject={inp.decision} />
              ) : (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Going ahead? Put it on the record
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                    A decision worth working through the numbers is a forecast worth
                    grading. Log it to your{" "}
                    <Link href={withSubject("/decide", inp.decision)} className="text-[var(--accent)] hover:opacity-70 transition-opacity">
                      decision journal
                    </Link>{" "}
                    — the hinge as what you expect, your {inp.p}% (rounded to{" "}
                    {snapConfidence(inp.p)}%) as the confidence, a review on{" "}
                    {formatHuman(reviewPreview)} — and reality gets to tell you later
                    whether the {inp.p}% was any good.
                  </p>
                  <button
                    type="button"
                    onClick={handleLog}
                    className="mt-4 text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
                  >
                    Log this as a forecast
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : (
        /* ==================== A OR B ==================== */
        <>
          {/* ---- The frame ---- */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              What are you choosing between?
            </label>
            <input
              type="text"
              value={inp.decision}
              onChange={(e) => set("decision", e.target.value)}
              placeholder="e.g. Which of two job offers"
              className={inputClass}
            />
            <CarriedNote
              show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
              lead={subjectLead}
              onClear={() => {
                set("decision", "");
                setCarriedSeed("");
              }}
            />

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                  Option A
                </label>
                <input
                  type="text"
                  value={inp.optionA}
                  onChange={(e) => set("optionA", e.target.value)}
                  placeholder="The startup"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
                  Option B
                </label>
                <input
                  type="text"
                  value={inp.optionB}
                  onChange={(e) => set("optionB", e.target.value)}
                  placeholder="The established company"
                  className={inputClass}
                />
              </div>
            </div>
            <CarriedNote
              show={
                optSeed !== null &&
                inp.optionA.trim() === optSeed.a &&
                inp.optionB.trim() === optSeed.b
              }
              lead={`The two you couldn't separate${
                sourceLabel ? `, carried from ${sourceLabel}` : ", carried over"
              } — edit either, or`}
              clearLabel="clear both"
              onClear={() => {
                set("optionA", "");
                set("optionB", "");
                setOptSeed(null);
              }}
            />

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
                The one thing it turns on
              </label>
              <input
                type="text"
                value={inp.hinge}
                onChange={(e) => set("hinge", e.target.value)}
                placeholder="The uncertain fact that decides which option is right"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                Name it so it points toward{" "}
                <span className="text-[var(--foreground)]">{inp.optionA.trim() || "A"}</span>{" "}
                when it goes the way you&rsquo;re hoping — the slider below is the
                odds it does. If you can&rsquo;t name it, you&rsquo;re still
                gathering, not deciding.
              </p>
            </div>
          </div>

          {/* ---- The two regrets ---- */}
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              The two ways of being wrong
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              You only regret a choice when the other one turns out right. Rate each
              regret on one shared scale — 0–10, or dollars, or years. Only the{" "}
              <em>ratio</em>{" "}matters; don&rsquo;t agonize over the exact figures.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  You picked <span className="text-[var(--accent)]">{inp.optionA.trim() || "A"}</span>, but <span className="font-medium">{inp.optionB.trim() || "B"}</span> was right
                </label>
                <p className="text-xs text-[var(--muted)] mb-2">
                  How much do you regret it? (the cost of a wrong A)
                </p>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={Number.isFinite(inp.regretA) ? inp.regretA : 0}
                  onChange={(e) => set("regretA", nonNeg(parseFloat(e.target.value)))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  You picked <span className="font-medium">{inp.optionB.trim() || "B"}</span>, but <span className="text-[var(--accent)]">{inp.optionA.trim() || "A"}</span> was right
                </label>
                <p className="text-xs text-[var(--muted)] mb-2">
                  How much do you regret it? (the cost of a wrong B)
                </p>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={Number.isFinite(inp.regretB) ? inp.regretB : 0}
                  onChange={(e) => set("regretB", nonNeg(parseFloat(e.target.value)))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-2">
                <label
                  htmlFor="weigh-p-ab"
                  className="block text-sm font-medium text-[var(--foreground)]"
                >
                  How likely is the hinge to favor {inp.optionA.trim() || "A"}?
                </label>
                <span className="text-lg font-semibold tabular-nums text-[var(--foreground)]">
                  {inp.p}%
                </span>
              </div>
              <input
                id="weigh-p-ab"
                type="range"
                min={1}
                max={99}
                value={inp.p}
                onChange={(e) => set("p", clampP(parseInt(e.target.value, 10)))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="mt-1 flex justify-between text-[10px] text-[var(--muted)] tabular-nums">
                <span>{inp.optionB.trim() || "B"} is right</span>
                <span>{inp.optionA.trim() || "A"} is right</span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                Your honest odds the one uncertain thing falls the way that makes{" "}
                {inp.optionA.trim() || "A"}{" "}the better choice.
              </p>
            </div>

            <label className="mt-5 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inp.ruin}
                onChange={(e) => set("ruin", e.target.checked)}
                className="mt-1 accent-[var(--accent)]"
              />
              <span className="text-sm text-[var(--muted)] leading-relaxed">
                One of these two ways of being wrong is one I{" "}
                <strong className="text-[var(--foreground)]">couldn&rsquo;t recover
                from</strong> — ruin, not just regret.
              </span>
            </label>
          </div>

          {/* ---- The verdict ---- */}
          {calcAB && flipPctAB != null ? (
            <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
              {inp.ruin ? <RuinWarning /> : null}

              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                The flip point
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
                {flipPctAB}%
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
                If the hinge is more than {flipPctAB}% likely to favor{" "}
                <span className="font-medium">{inp.optionA.trim() || "A"}</span>,{" "}
                <span className="font-medium">{inp.optionA.trim() || "A"}</span> is the
                better bet. Below it,{" "}
                <span className="font-medium">{inp.optionB.trim() || "B"}</span> is. You
                put the odds at <span className="font-medium">{inp.p}%</span>.
              </p>

              {/* The line, drawn — left band is B's, right band is A's */}
              <FlipTrack
                flip={calcAB.flip}
                you={calcAB.p}
                adj={null}
                ends={[
                  `${inp.optionB.trim() || "B"} is right`,
                  `${inp.optionA.trim() || "A"} is right`,
                ]}
              />

              {tooCloseAB ? (
                <TooCloseRead marginPts={marginPtsAB} />
              ) : (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Clear enough:{" "}
                    {calcAB.margin > 0
                      ? inp.optionA.trim() || "A"
                      : inp.optionB.trim() || "B"}
                    .
                  </p>
                  <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                    You&rsquo;re {marginPtsAB} points{" "}
                    {calcAB.margin > 0 ? "above" : "below"}{" "}
                    the line — enough daylight that you&rsquo;d have to be badly
                    wrong about the odds for the choice to flip.
                  </p>
                </div>
              )}

              {/* What the flip point is telling you — the regret ratio, read plainly */}
              <div className="mt-5 pt-5 border-t border-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  What the line is saying
                </p>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                  Because a wrong{" "}
                  <span className="font-medium text-[var(--foreground)]">{inp.optionA.trim() || "A"}</span>{" "}
                  costs you {inp.regretA} and a wrong{" "}
                  <span className="font-medium text-[var(--foreground)]">{inp.optionB.trim() || "B"}</span>{" "}
                  costs you {inp.regretB}, the odds only have to clear{" "}
                  <span className="font-medium text-[var(--foreground)]">{flipPctAB}%</span>{" "}
                  before {inp.optionA.trim() || "A"} is worth it.{" "}
                  {inp.regretA === inp.regretB
                    ? "The regrets are even, so the line sits at 50% — this is a pure bet on the hinge."
                    : inp.regretA < inp.regretB
                      ? `The cheaper mistake is a wrong ${inp.optionA.trim() || "A"}, so the bar for ${inp.optionA.trim() || "A"} sits below 50%.`
                      : `The costlier mistake is a wrong ${inp.optionA.trim() || "A"}, so ${inp.optionA.trim() || "A"} has to clear a higher bar than a coin flip.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Give each regret a size — even a rough one — and the flip point
                appears.
              </p>
            </div>
          )}

          {/* ---- The handoff ---- */}
          {calcAB && !inp.ruin ? (
            <div className="mt-5 rounded-xl border border-[var(--border)] p-5 sm:p-6">
              {logged ? (
                <LoggedNote logged={logged} subject={inp.decision} />
              ) : (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Going with one? Put it on the record
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                    A choice worth working through the numbers is a forecast worth
                    grading. Log the leaning call to your{" "}
                    <Link href={withSubject("/decide", inp.decision)} className="text-[var(--accent)] hover:opacity-70 transition-opacity">
                      decision journal
                    </Link>{" "}
                    — the hinge as what you expect, your read on which option is right
                    as the confidence, a review on {formatHuman(reviewPreview)} — and
                    reality gets to tell you later whether it was the right pick.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogAB}
                    className="mt-4 text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
                  >
                    Log this as a forecast
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/** The ruin guard — shared by both frames. Expected value is the wrong tool when
 *  the downside is a loss you can't come back from. */
function RuinWarning() {
  return (
    <div className="mb-5 rounded-lg border border-[var(--accent)] p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        Stop — expected value is the wrong tool here
      </p>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        You marked one outcome unrecoverable. Averages assume you get to keep
        playing; against a loss you can&rsquo;t come back from, the question
        isn&rsquo;t <em>&ldquo;is this a good bet&rdquo;</em> — it&rsquo;s{" "}
        <em>don&rsquo;t bet the things you can&rsquo;t afford to lose</em>, almost
        regardless of the odds below. Buy a{" "}
        <Link href="/models#margin-of-safety" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
          margin of safety
        </Link>{" "}
        or walk away. The flip point still tells you how strong the bet looks — but
        a strong bet on ruin is still ruin.
      </p>
    </div>
  );
}

/** The "too close to call" read — shared, since the tiebreaker is the same in
 *  both frames: whatever you couldn't put a number on. */
function TooCloseRead({ marginPts }: { marginPts: number }) {
  return (
    <div className="mt-5">
      <p className="text-sm font-semibold text-[var(--foreground)]">
        Too close to call — and that&rsquo;s the answer.
      </p>
      <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
        You&rsquo;re only {marginPts} point{marginPts === 1 ? "" : "s"} from the
        line — inside the noise of numbers this rough. Don&rsquo;t let a
        spreadsheet cast the deciding vote. When expected value says &ldquo;about
        even,&rdquo; the tiebreaker is whatever you couldn&rsquo;t put a number on:
        how reversible it is, what you give up elsewhere, who you become, which
        regret you can live with.
      </p>
    </div>
  );
}

/** The post-log confirmation — shared by both frames. */
function LoggedNote({
  logged,
  subject,
}: {
  logged: { conf: number; reviewOn: string };
  subject: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        Logged to your journal
      </p>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        Filed as a tracked forecast at {logged.conf}% confidence, with a review set
        for {formatHuman(logged.reviewOn)}. When the day comes, the{" "}
        <Link href={withSubject("/decide?log=1", subject)} className="text-[var(--accent)] hover:opacity-70 transition-opacity">
          decision journal
        </Link>{" "}
        will ask what actually happened and grade this call against what you
        expected.
      </p>
    </div>
  );
}

/**
 * The worked example (act frame), rendered read-only. It runs the same
 * p* = R/(B+R) the live tool does, for a fixed scenario, and reuses the FlipTrack
 * drawing — so a newcomer sees exactly what a finished pass produces without a
 * blank page, and without a single character landing in their own fields or
 * storage.
 */
function WeighExample() {
  const B = EXAMPLE.upside;
  const R = EXAMPLE.downside;
  const flip = R / (B + R);
  const flipPct = Math.round(flip * 100);
  const p = EXAMPLE.p / 100;
  const marginPts = Math.round(Math.abs(p - flip) * 100);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{EXAMPLE.decision}</span> —{" "}
        {EXAMPLE.actLabel.toLowerCase()} vs {EXAMPLE.altLabel.toLowerCase()},
        turning on whether a year from now you&rsquo;re happier and growing
        faster than you would have been.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        Upside if it works out:{" "}
        <span className="font-medium text-[var(--foreground)]">7</span>. Downside
        if it doesn&rsquo;t:{" "}
        <span className="font-medium text-[var(--foreground)]">5</span>. Honest
        odds it works out:{" "}
        <span className="font-medium text-[var(--foreground)]">65%</span>.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The flip point
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
          {flipPct}%
        </p>
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          Above {flipPct}% sure, taking it beats staying on the numbers; below it,
          staying wins. You put yourself at 65% — {marginPts} points above the
          line.
        </p>
        <FlipTrack flip={flip} you={p} adj={null} />
        <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
          Clear enough: take it. You&rsquo;d have to be badly wrong about your own
          odds for the call to flip.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own form below is blank — enter the call you actually came here to
        weigh.
      </p>
    </div>
  );
}

/**
 * The worked example (A/B frame), rendered read-only. Runs the same
 * p* = regretA/(regretA+regretB) the live tool does, for a fixed two-option
 * scenario, and reuses FlipTrack — so the symmetric frame gets the same
 * no-blank-page courtesy as the original, and nothing lands in the live fields.
 */
function WeighExampleAB() {
  const rA = EXAMPLE_AB.regretA;
  const rB = EXAMPLE_AB.regretB;
  const flip = rA / (rA + rB);
  const flipPct = Math.round(flip * 100);
  const p = EXAMPLE_AB.p / 100;
  const marginPts = Math.round(Math.abs(p - flip) * 100);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{EXAMPLE_AB.decision}</span> —{" "}
        {EXAMPLE_AB.optionA.toLowerCase()} vs {EXAMPLE_AB.optionB.toLowerCase()},
        turning on whether the startup is still thriving in two years.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        Pick the startup and it folds — regret:{" "}
        <span className="font-medium text-[var(--foreground)]">6</span>. Pick the
        safe job and the startup soars — regret:{" "}
        <span className="font-medium text-[var(--foreground)]">9</span>. Honest odds
        the startup thrives:{" "}
        <span className="font-medium text-[var(--foreground)]">60%</span>.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The flip point
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">
          {flipPct}%
        </p>
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          The regret of a wrong startup bet is the smaller one, so the bar for the
          startup sits below a coin flip — at {flipPct}%. You put the odds at 60%,{" "}
          {marginPts} points above the line.
        </p>
        <FlipTrack
          flip={flip}
          you={p}
          adj={null}
          ends={["Safe job is right", "Startup is right"]}
        />
        <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
          Clear enough: the startup. You&rsquo;d have to be badly wrong about the
          odds for the choice to flip.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own form below is blank — enter the two options you actually came here
        to choose between.
      </p>
    </div>
  );
}

/**
 * The decision line: a 0–100 track with the flip point marked, your probability
 * marked above it, and — if you have a track record — your calibration-adjusted
 * probability beside it. The band left of the flip point is one option's
 * territory; the band right of it is the other's. `ends` relabels the 0% / 100%
 * captions for the A/B frame, where the axis is "which option is right" rather
 * than a bare percentage.
 */
function FlipTrack({
  flip,
  you,
  adj,
  ends,
}: {
  flip: number;
  you: number;
  adj: number | null;
  ends?: [string, string];
}) {
  const pct = (x: number) => `${Math.max(0, Math.min(1, x)) * 100}%`;
  const [leftEnd, rightEnd] = ends ?? ["0%", "100%"];
  return (
    <div className="mt-5">
      <div className="relative h-9">
        {/* the bar: hold band | act band */}
        <div className="absolute inset-x-0 top-4 h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--accent)] opacity-25"
            style={{ width: pct(flip) }}
            aria-hidden
          />
          <div
            className="absolute inset-y-0 right-0 bg-[var(--accent)]"
            style={{ width: pct(1 - flip) }}
            aria-hidden
          />
        </div>
        {/* flip point marker */}
        <div
          className="absolute top-2.5 -translate-x-1/2 w-0.5 h-5 bg-[var(--foreground)]"
          style={{ left: pct(flip) }}
          aria-hidden
        />
        {/* you marker */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left: pct(you) }}
        >
          <span className="text-[10px] font-semibold text-[var(--foreground)] leading-none">
            you
          </span>
          <span className="mt-0.5 w-2.5 h-2.5 rounded-full bg-[var(--foreground)]" aria-hidden />
        </div>
        {/* adjusted marker (only if it differs enough to matter) */}
        {adj != null && Math.abs(adj - you) >= 0.02 ? (
          <div
            className="absolute top-5 -translate-x-1/2 flex flex-col items-center"
            style={{ left: pct(adj) }}
          >
            <span
              className="w-2 h-2 rounded-full border border-[var(--foreground)]"
              aria-hidden
            />
          </div>
        ) : null}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--muted)] tabular-nums">
        <span>{leftEnd}</span>
        <span className="font-medium text-[var(--foreground)]">
          flips at {Math.round(flip * 100)}%
        </span>
        <span>{rightEnd}</span>
      </div>
    </div>
  );
}
