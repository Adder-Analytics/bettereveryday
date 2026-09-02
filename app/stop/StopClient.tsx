"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import PrintButton from "../components/PrintButton";

/**
 * When do you stop looking? (/stop)
 *
 * The optimal-stopping instrument — the one making-the-call tool for a search
 * rather than a choice. Every other "deciding now" tool assumes you already hold
 * the options: the comparison scores the ones on your table, the flip point
 * weighs two you can name, the value-of-information check asks whether a fact
 * about a fixed choice would move it. This one meets the moment before you have
 * a table at all — when the options are still arriving one at a time, each is
 * take-it-or-leave-it, and the real decision isn't which one but *when to stop*.
 *
 * That's the secretary problem, and it has a proven answer (Christian & Griffiths
 * popularized it in Algorithms to Live By): with no recall over a sequence, look
 * at and reject the first 1/e ≈ 37% to calibrate, then take the first that beats
 * everyone in that window. The tool runs it with no math:
 *
 *   1. Name the search (carries as the subject).
 *   2. Gate the shape. The rule only holds for a genuine sequential, no-recall
 *      search. If you can revisit passed options or see them all at once, it's a
 *      comparison, not a stopping problem — route out to /compare honestly.
 *   3. Size the field — by a rough count, a time window, or (if neither) fall
 *      back to the robust qualitative version. Compute the look phase.
 *   4. Locate the person in the search — still looking / found a beater / past
 *      the look phase but nothing's beaten it / been looking far too long — and
 *      route each to the move: leap (act/decide), hold (keep the bar), or set a
 *      hard stop (tripwire) when over-searching has become its own failure.
 *
 * It's the sequential-search sibling of /enough: both answer "when do I stop
 * gathering and commit," one over information about a fixed choice, one over
 * options in a search. Nothing is sent anywhere; inputs persist in the browser.
 * There's no forecast to log — a stopping rule isn't a prediction — only the
 * handoff.
 */

const STORE_KEY = "stop:v1";

/** Is this really a sequential, no-recall search — or a comparison in disguise? */
type Shape = "" | "sequential" | "recall" | "allatonce";
/** How the field is bounded, which sets how the look phase is computed. */
type Mode = "" | "count" | "time" | "unbounded";
/** Where the person is standing in their own search right now. */
type Pos = "" | "looking" | "beater" | "searching" | "toolong";

type Inputs = {
  /** The search you're running — carries as the subject on handoffs. */
  search: string;
  /** Whether it's the shape the rule applies to. */
  shape: Shape;
  /** How you can bound the field. */
  mode: Mode;
  /** The count or time window, as typed (parsed defensively for the math). */
  size: string;
  /** Where you are in the search. */
  pos: Pos;
};

const BLANK: Inputs = {
  search: "",
  shape: "",
  mode: "",
  size: "",
  pos: "",
};

function isShape(v: unknown): v is Shape {
  return v === "" || v === "sequential" || v === "recall" || v === "allatonce";
}
function isMode(v: unknown): v is Mode {
  return v === "" || v === "count" || v === "time" || v === "unbounded";
}
function isPos(v: unknown): v is Pos {
  return (
    v === "" || v === "looking" || v === "beater" || v === "searching" || v === "toolong"
  );
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      search: typeof v.search === "string" ? v.search : BLANK.search,
      shape: isShape(v.shape) ? v.shape : BLANK.shape,
      mode: isMode(v.mode) ? v.mode : BLANK.mode,
      size: typeof v.size === "string" ? v.size : BLANK.size,
      pos: isPos(v.pos) ? v.pos : BLANK.pos,
    };
  } catch {
    return BLANK;
  }
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase =
  "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff =
  "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";

/**
 * Parse the typed field size to a positive integer, or null. Defensive: a blank,
 * a word, or a nonsense number reads as "unset," so the read falls back to a
 * prompt rather than showing a bogus look phase.
 */
function parseSize(raw: string): number | null {
  const n = Number.parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * The look-phase size: 1/e ≈ 37% of the field, rounded. Kept honest at the
 * edges — a field of one has nothing to calibrate against, so the look phase is
 * zero (there's only one option; take it). Returned alongside the total so the
 * read can phrase "the first k of n."
 */
function lookPhase(n: number): number {
  return Math.max(0, Math.round(n / Math.E));
}

export default function StopClient() {
  const [inp, setInp] = useState<Inputs>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    const loaded = loadInputs();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.search.trim();
    const next = seeded ? { ...loaded, search: carried } : loaded;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setInp(next);
    setHydrated(true);
    if (seeded) setCarriedSeed(carried);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (carried) clearCarriedSubject();
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

  const search = inp.search.trim();
  const sequential = inp.shape === "sequential";

  return (
    <div>
      {/* ---- New here? A read-only worked example ---- */}
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
        {showExample ? <StopExample /> : null}
      </div>

      {/* ---- The search, and whether it's the right shape ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you searching for?
        </label>
        <input
          type="text"
          value={inp.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="e.g. An apartment to rent this spring"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.search.trim() === carriedSeed}
          onClear={() => {
            set("search", "");
            setCarriedSeed("");
          }}
        />

        {search ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              First &mdash; is it really this kind of search?
            </p>
            <p className="mb-3 text-sm text-[var(--muted)] leading-relaxed">
              The 37% rule only holds when the options come in a line and passing
              is final. Which one fits?
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  [
                    "sequential",
                    "One at a time, and passing is final",
                    "I see them in sequence, and if I don't take one it's gone — I can't hold them all side by side.",
                  ],
                  [
                    "recall",
                    "I can go back to earlier ones anytime",
                    "Nothing expires — any option I've seen is still available whenever I want it.",
                  ],
                  [
                    "allatonce",
                    "I can see them all at once, right now",
                    "They're already on the table together — a few offers, a shortlist — and I just have to pick.",
                  ],
                ] as [Shape, string, string][]
              ).map(([val, label, detail]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set("shape", inp.shape === val ? "" : val)}
                  className={`${chipBase} ${inp.shape === val ? chipOn : chipOff}`}
                >
                  <span className="block font-medium">{label}</span>
                  <span className="block mt-0.5 text-xs text-[var(--muted)] leading-relaxed">
                    {detail}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* ---- Size the field (only for a genuine sequential search) ---- */}
      {search && sequential ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            How big is the field?
          </p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            The look phase is the first 37% &mdash; so the tool needs a rough
            sense of the whole. A ballpark is plenty; the rule barely cares whether
            you&rsquo;re a little off.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {(
              [
                ["count", "I roughly know how many I'll see"],
                ["time", "I have a time window, not a count"],
                ["unbounded", "I can't bound it at all"],
              ] as [Mode, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  set("mode", inp.mode === val ? "" : val);
                  if (val === "unbounded") set("size", "");
                }}
                className={`${chipBase} ${inp.mode === val ? chipOn : chipOff}`}
              >
                {label}
              </button>
            ))}
          </div>

          {inp.mode === "count" ? (
            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
                About how many will you see in all?
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={inp.size}
                onChange={(e) => set("size", e.target.value)}
                placeholder="e.g. 12"
                className={inputClass}
              />
            </div>
          ) : null}

          {inp.mode === "time" ? (
            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
                How long will you look? (in weeks)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={inp.size}
                onChange={(e) => set("size", e.target.value)}
                placeholder="e.g. 6"
                className={inputClass}
              />
              <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                Same rule, measured in time instead of count: spend the first 37%
                of the window looking only.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- Where are you in the search right now? ---- */}
      {search && sequential && inp.mode !== "" ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            Where are you right now?
          </p>
          <div className="flex flex-col gap-2">
            {(
              [
                ["looking", "Still early — I've only seen a few"],
                ["beater", "Further in, and this one beats everything so far"],
                [
                  "searching",
                  "Past the early stretch, but nothing's beaten it yet",
                ],
                [
                  "toolong",
                  "I've been at this a long time — passed good ones hoping",
                ],
              ] as [Pos, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("pos", inp.pos === val ? "" : val)}
                className={`${chipBase} ${inp.pos === val ? chipOn : chipOff}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---- The read + handoff ---- */}
      <Verdict inp={inp} />
    </div>
  );
}

function Verdict({ inp }: { inp: Inputs }) {
  const search = inp.search.trim();
  const subject = inp.search;
  const n = parseSize(inp.size);
  const k = n !== null ? lookPhase(n) : null;

  // ---- Nothing to read yet ----
  if (!search) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Name the search and say what shape it is, and the read appears: your look
          phase, and whether the one in front of you is worth taking or worth
          passing.
        </p>
      </div>
    );
  }

  // ---- Shape gate not answered ----
  if (inp.shape === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Say whether the options come one at a time or all at once. The stopping
          rule only applies to a real sequential search &mdash; and if yours
          isn&rsquo;t one, the read will point you at the tool that is.
        </p>
      </div>
    );
  }

  // ---- Not a stopping problem: route out honestly ----
  if (inp.shape === "recall" || inp.shape === "allatonce") {
    const recall = inp.shape === "recall";
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          This isn&rsquo;t a stopping problem &mdash; it&rsquo;s a comparison.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          {recall
            ? "If you can go back to any option you've seen, nothing expires — so there's no cost to waiting and no rule about when to stop. "
            : "If they're all in front of you at once, you don't have a search at all — you have a slate. "}
          The whole difficulty the 37% rule solves is that passing is{" "}
          <em>final</em>{" "}and you can&rsquo;t see the field. That&rsquo;s not your
          situation. What you actually need is to lay the options side by side and
          score them, so one strong first impression can&rsquo;t decide it for you.
        </p>
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            The right tool for that
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/compare", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Score them past the halo &rarr;
              </Link>{" "}
              Rate every option a factor at a time, then set the tally against your
              gut and make the disagreement the thing you examine.
            </li>
            <li>
              <Link
                href={withSubject("/weigh", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Down to two, and close? Take them to the flip point &rarr;
              </Link>{" "}
              Find the probability where the call tips, so all that&rsquo;s left is
              which side of the line you&rsquo;re on.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ---- Sequential, but field not sized ----
  if (inp.mode === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Good &mdash; this is the shape the rule was built for. Say how big the
          field is, roughly, and the look phase falls out of it.
        </p>
      </div>
    );
  }

  // ---- Sequential, count/time chosen but no number yet ----
  if ((inp.mode === "count" || inp.mode === "time") && k === null) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          {inp.mode === "count"
            ? "Put in a rough number of options you expect to see in all, and the tool works out how many to look at before you start taking any seriously."
            : "Put in how many weeks your search runs, and the tool works out how long to spend looking before you commit to anything."}
        </p>
      </div>
    );
  }

  // ---- The rule box: the look phase, however the field was sized ----
  const ruleBox = <RuleBox mode={inp.mode} n={n} k={k} />;

  // ---- Position not chosen: show the rule and prompt ----
  if (inp.pos === "") {
    return (
      <div className="mt-5">
        {ruleBox}
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Now mark where you are in the search, above, and the read turns from a
            rule into the actual move: take this one, keep looking, or call time.
          </p>
        </div>
      </div>
    );
  }

  // ---- The position reads ----
  return (
    <div className="mt-5">
      {ruleBox}
      <PositionRead pos={inp.pos} mode={inp.mode} k={k} subject={subject} />
    </div>
  );
}

/** The look-phase rule, phrased for whichever way the field was sized. */
function RuleBox({ mode, n, k }: { mode: Mode; n: number | null; k: number | null }) {
  if (mode === "unbounded") {
    return (
      <div className="rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Your rule
        </p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--foreground)] leading-snug">
          Look at a handful to calibrate, then take the first that beats them.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          You can&rsquo;t bound the field, so use the robust version. See maybe
          five or six options deliberately as <em>research</em> &mdash; take none,
          no matter how good &mdash; purely to learn what the market offers and
          what a genuinely good one looks like. Let the best of those set your bar.
          Then commit to the first option that clears the bar. The exact number in
          the look phase barely matters; what matters is that you refuse to choose
          until you&rsquo;ve calibrated, and then actually leap when something
          beats your window.
        </p>
      </div>
    );
  }

  const total = n as number;
  const look = k as number;
  const unitWord = mode === "time" ? "week" : "option";
  const totalPhrase =
    mode === "time" ? `${total}-week search` : `about ${total} options`;

  return (
    <div className="rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Your rule
      </p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--foreground)] leading-snug">
        {mode === "time" ? (
          <>
            Spend the first {look === 1 ? "week" : `${look} weeks`} looking only.
            Then take the first that beats them.
          </>
        ) : (
          <>
            Look at the first {look === 1 ? "one" : look}, take none. Then take the
            first that beats all {look === 1 ? "of it" : look}.
          </>
        )}
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        For a {totalPhrase}, the look phase is 37% &mdash;{" "}
        <span className="font-medium">
          {look === 0
            ? "essentially none; the field's too small for the rule to bite"
            : `the first ${look} ${look === 1 ? unitWord : unitWord + "s"}`}
        </span>
        . In that stretch you deliberately choose <em>nothing</em>, however
        tempting, and use what you see only to learn what good looks like here.
        The moment the look phase ends, the rule flips: take the very first option
        that beats everything you saw while looking &mdash; and don&rsquo;t look
        back.
      </p>
      {look === 0 ? (
        <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-xs text-[var(--muted)] leading-relaxed">
          A field this small doesn&rsquo;t leave room to calibrate. With only a
          couple of options, the honest move is closer to a straight comparison
          &mdash; see what you can, then take the better one rather than waiting on
          a rule.
        </p>
      ) : null}
    </div>
  );
}

/** The move, given where the person is standing in their own search. */
function PositionRead({
  pos,
  mode,
  k,
  subject,
}: {
  pos: Pos;
  mode: Mode;
  k: number | null;
  subject: string;
}) {
  const lookLabel =
    mode === "time"
      ? k !== null && k > 0
        ? `first ${k === 1 ? "week" : `${k} weeks`}`
        : "look phase"
      : k !== null && k > 0
        ? `first ${k}`
        : "look phase";

  if (pos === "looking") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Keep looking &mdash; and take nothing.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          You&rsquo;re in the look phase, and its one job is to <em>calibrate</em>,
          not to choose. So even if one of these early options is wonderful, pass
          it &mdash; on purpose. This is the counterintuitive heart of the rule and
          the discipline people can&rsquo;t stand: the best-looking option you see
          in the {lookLabel} is not there to be taken, it&rsquo;s there to set the
          bar that lets you <em>recognize</em> the one worth taking later. Note who
          your current best is; that&rsquo;s your bar. Then keep going until the
          look phase is done.
        </p>
        <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
          The trap to name now, before it happens: falling for a look-phase option
          and stopping early. It feels like luck &mdash; &ldquo;why keep looking
          when this is great?&rdquo; &mdash; but you have no idea yet whether great
          here is common or rare. That&rsquo;s exactly what the look phase is for.
        </p>
        <PrintNote />
      </div>
    );
  }

  if (pos === "beater") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Take it.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          You&rsquo;re past the look phase, and this one beats everything you saw
          while calibrating. That is precisely the signal the rule waits for
          &mdash; so the move is to commit, now, before it&rsquo;s gone. It
          won&rsquo;t feel certain, and it isn&rsquo;t supposed to: you can&rsquo;t
          know it&rsquo;s <em>the</em> best, because knowing that would mean seeing
          every option, and by then most of them would have expired. Taking the
          first post-look option that beats your window is the move that lands the
          best one more often than any other &mdash; and holding out from{" "}
          <em>here</em> is how people miss it.
        </p>
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            So commit it
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/act", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Make the first concrete move &rarr;
              </Link>{" "}
              Put in the application, sign, make the offer &mdash; turn &ldquo;this
              is the one&rdquo; into the smallest action that claims it before
              someone else does.
            </li>
            <li>
              <Link
                href={withSubject("/decide", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Log what you expect first &rarr;
              </Link>{" "}
              If it&rsquo;s a big enough call, record the reasoning and your
              forecast now, so reality can grade it later &mdash; not your memory of
              how sure you felt.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  if (pos === "searching") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Take the next one that beats your bar.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The look phase is done, so you&rsquo;re now in the taking phase &mdash;
          you just haven&rsquo;t hit the trigger yet. Hold your nerve and your bar:
          the first option that beats the best of your look phase is the one you
          commit to, on sight. Don&rsquo;t re-open the ones you passed, and
          don&rsquo;t keep raising the bar because nothing has cleared it &mdash;
          that&rsquo;s how a good rule turns into an endless one.
        </p>
        <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
          One honest adjustment: if the field is genuinely running out and nothing
          has beaten your window, the bar was set high by luck in the look phase.
          As the options left dwindle, the math says lower the bar &mdash; take the
          best of what&rsquo;s realistically still coming rather than holding out
          for a winner that may not exist.
        </p>
        <PrintNote />
      </div>
    );
  }

  // pos === "toolong"
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        The read
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        You&rsquo;re past the rule &mdash; call time.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        If you&rsquo;ve been looking long past your window and passing good options
        sure a better one is coming, you&rsquo;ve hit the second failure mode, and
        it&rsquo;s the more expensive one. The rule already told you to take the
        first option that beat your look phase &mdash; and if some did and you let
        them go, the search stopped being diligence a while ago. Each further look
        now costs more than the marginal better option it might turn up: that&rsquo;s
        opportunity cost, and it&rsquo;s running against you.
      </p>
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Put a hard floor under it
        </p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link
              href={withSubject("/tripwire", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Set a stop: a date, and what you&rsquo;ll take &rarr;
            </Link>{" "}
            Name the day by which you commit to the best option available &mdash;
            an observable line, set now while you&rsquo;re calm, so &ldquo;just one
            more&rdquo; can&rsquo;t keep moving the goalposts.
          </li>
          <li>
            <Link
              href={withSubject("/enough", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Is it really about seeing more? &rarr;
            </Link>{" "}
            If the pull to keep looking is a hope that more <em>information</em>
            {" "}will make the call obvious, run the value-of-information test:
            usually another option wouldn&rsquo;t change what you&rsquo;d pick, and
            the looking is delay, not diligence.
          </li>
        </ul>
      </div>
      <PrintNote />
    </div>
  );
}

/** The keep-a-copy affordance, shown under a real read. Matches the siblings:
 *  a worked search is worth holding, or handing to whoever it's with. */
function PrintNote() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <PrintButton label="Print / Save as PDF" />
    </div>
  );
}

/**
 * The worked example, rendered read-only. Walks the canonical sequential search
 * — the apartment hunt — so a newcomer sees the whole rule (look phase, the
 * deliberate pass, the leap) without a character landing in their own fields or
 * storage.
 */
function StopExample() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example &mdash; nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        You&rsquo;re flat-hunting, and in this market a place you like is gone by
        the evening &mdash; so every viewing is take-it-or-leave-it. You&rsquo;ve
        got about six weeks and expect to see maybe{" "}
        <span className="font-medium">a dozen</span> places.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The rule
        </p>
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          37% of twelve is between four and five. So the first{" "}
          <span className="font-medium">four or five flats</span>, you see and{" "}
          <span className="font-medium">pass</span> &mdash; however good &mdash;
          just to learn the market: what a fair price buys, what &ldquo;good
          light&rdquo; actually looks like here, what&rsquo;s normal and what&rsquo;s
          rare. Then you take the <span className="font-medium">first flat that
          beats all of them</span>, the day you see it.
        </p>
      </div>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        The fifth flat you loved and let go wasn&rsquo;t a mistake &mdash; it set
        the bar that let you <em>recognize</em> the eighth, and commit that
        afternoon instead of losing it to someone who could. Skip the look phase
        and you&rsquo;d have grabbed the second place, never knowing it was
        middling. Never leap and you&rsquo;d have passed the eighth too, hoping,
        and taken whatever was free in week six. The rule is the discipline that
        sits between those two.
      </p>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank &mdash; run it on <em>your</em> search.
      </p>
    </div>
  );
}
