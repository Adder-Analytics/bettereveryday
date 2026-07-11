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
 * on — the tool's real output isn't "act" or "don't." It's the flip point: the
 * probability at which the two choices break even, p* = R / (B + R), where B is
 * how much better acting is than the alternative if it works out and R is how
 * much worse if it doesn't. Then it asks the one honest question — are you
 * clearly on one side of that line, or is this too close for the numbers to
 * decide?
 *
 * Nothing here is sent anywhere. The inputs persist in your browser so a reload
 * doesn't wipe them; a decision you commit to can be logged to the journal as a
 * tracked forecast through the shared decisionLog appender — the same front door
 * the pre-mortem room uses.
 */

const STORE_KEY = "weigh:v1";

type Inputs = {
  decision: string;
  actLabel: string;
  altLabel: string;
  hinge: string;
  /** Probability the good case happens, 1–99. */
  p: number;
  /** Upside of acting vs the alternative if it works — a positive magnitude. */
  upside: number;
  /** Downside of acting vs the alternative if it doesn't — a positive magnitude. */
  downside: number;
  /** The bad case is one you couldn't recover from. */
  ruin: boolean;
};

const SEED: Inputs = {
  decision: "Take the new job",
  actLabel: "Take it",
  altLabel: "Stay",
  hinge: "A year from now I'm happier and growing faster than I would have been",
  p: 65,
  upside: 7,
  downside: 5,
  ruin: false,
};

function loadInputs(): Inputs {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return SEED;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : SEED.decision,
      actLabel: typeof v.actLabel === "string" ? v.actLabel : SEED.actLabel,
      altLabel: typeof v.altLabel === "string" ? v.altLabel : SEED.altLabel,
      hinge: typeof v.hinge === "string" ? v.hinge : SEED.hinge,
      p: clampP(typeof v.p === "number" ? v.p : SEED.p),
      upside: nonNeg(typeof v.upside === "number" ? v.upside : SEED.upside),
      downside: nonNeg(typeof v.downside === "number" ? v.downside : SEED.downside),
      ruin: typeof v.ruin === "boolean" ? v.ruin : SEED.ruin,
    };
  } catch {
    return SEED;
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

export default function WeighClient() {
  const [inp, setInp] = useState<Inputs>(SEED);
  const [hydrated, setHydrated] = useState(false);
  const [gap, setGap] = useState<number | null>(null);
  const [scored, setScored] = useState(0);
  const [logged, setLogged] = useState<null | { conf: number; reviewOn: string }>(null);

  // Load persisted inputs and the real-world calibration signal on mount.
  useEffect(() => {
    const loaded = loadInputs();
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
    setInp(loaded);
    setGap(g);
    setScored(s);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
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

  const flipPct = calc ? Math.round(calc.flip * 100) : null;

  // How close is "too close to call"? Below an 8-point margin, a decision built
  // on made-up magnitudes is inside its own noise — the honest answer is "even."
  const CLOSE = 0.08;
  const tooClose = calc ? Math.abs(calc.margin) < CLOSE : false;

  // The calibration adjustment: shave your measured overconfidence off the
  // probability and see whether you're still on the same side of the line.
  const adjP =
    gap != null && scored >= 3 ? clampP(inp.p - gap) : null;
  const adjSide =
    calc && adjP != null ? adjP / 100 - calc.flip : null;

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

  const reviewPreview = addDaysISO(todayISO(), REVIEW_DEFAULT_DAYS);

  return (
    <div>
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
          — the alternative is the zero. Only the <em>ratio</em> matters, so any
          consistent scale works: 0–10, or dollars, or years. Don&rsquo;t agonize
          over the exact figures; the point is where they put the line.
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
          {inp.ruin ? (
            <div className="mb-5 rounded-lg border border-[var(--accent)] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                Stop — expected value is the wrong tool here
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
                You marked the downside unrecoverable. Averages assume you get to
                keep playing; against a loss you can&rsquo;t come back from, the
                question isn&rsquo;t <em>&ldquo;is this a good bet&rdquo;</em> —
                it&rsquo;s <em>don&rsquo;t bet the things you can&rsquo;t afford to
                lose</em>, almost regardless of the odds below. Buy a{" "}
                <Link href="/models#margin-of-safety" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
                  margin of safety
                </Link>{" "}
                or walk away. The flip point still tells you how strong the bet
                looks — but a strong bet on ruin is still ruin.
              </p>
            </div>
          ) : null}

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
            <div className="mt-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Too close to call — and that&rsquo;s the answer.
              </p>
              <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                You&rsquo;re only {Math.round(Math.abs(calc.margin) * 100)} point
                {Math.round(Math.abs(calc.margin) * 100) === 1 ? "" : "s"} from the
                line — inside the noise of numbers this rough. Don&rsquo;t let a
                spreadsheet cast the deciding vote. When expected value says
                &ldquo;about even,&rdquo; the tiebreaker is whatever you
                couldn&rsquo;t put a number on: how reversible it is, what you give
                up elsewhere, who you become, which regret you can live with.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {calc.margin > 0
                  ? `Clear enough: ${inp.actLabel.trim() || "act"}.`
                  : `Clear enough: ${inp.altLabel.trim() || "hold"}.`}
              </p>
              <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">
                You&rsquo;re {Math.round(Math.abs(calc.margin) * 100)} points{" "}
                {calc.margin > 0 ? "above" : "below"} the line — enough daylight
                that you&rsquo;d have to be badly wrong about your own odds for the
                decision to flip.
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                Logged to your journal
              </p>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Filed as a tracked forecast at {logged.conf}% confidence, with a
                review set for {formatHuman(logged.reviewOn)}. When the day comes,
                the{" "}
                <Link href="/decide?log=1" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
                  decision journal
                </Link>{" "}
                will ask what actually happened and grade this call against what
                you expected.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                Going ahead? Put it on the record
              </p>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                A decision worth working through the numbers is a forecast worth
                grading. Log it to your{" "}
                <Link href="/decide" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
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
    </div>
  );
}

/**
 * The decision line: a 0–100 track with the flip point marked, your probability
 * marked above it, and — if you have a track record — your calibration-adjusted
 * probability beside it. The band left of the flip point is "hold" territory;
 * the band right of it is "act" territory.
 */
function FlipTrack({
  flip,
  you,
  adj,
}: {
  flip: number;
  you: number;
  adj: number | null;
}) {
  const pct = (x: number) => `${Math.max(0, Math.min(1, x)) * 100}%`;
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
        <span>0%</span>
        <span className="font-medium text-[var(--foreground)]">
          flips at {Math.round(flip * 100)}%
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}
