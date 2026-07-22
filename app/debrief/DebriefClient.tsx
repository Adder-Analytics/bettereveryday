"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/**
 * The Outcome Isn't the Verdict (/debrief).
 *
 * Every other instrument on the site fires *before* the result is in: weigh a
 * close call, compare the options, forecast the magnitude, trace the
 * downstream, cool a hot one, run the pre-mortem, log the forecast. The only
 * backward-looking tool — the return desk — only works if you *logged the
 * decision in advance*, because it grades a written forecast against what
 * happened.
 *
 * But the site's own essays name the far more common case and never built the
 * instrument for it. "The Difference Between a Good Decision and a Good Outcome"
 * diagnoses *resulting* (Annie Duke): judging a decision by the result the dice
 * produced. "Experience Doesn't Teach" goes further — it argues the wild world
 * hands back outcomes that are late, noisy, and, worst of all, *edited by
 * hindsight*, so learning from raw experience updates you in the wrong
 * direction. And the playbook's "judging a decision" situation pointed its tool
 * at the decision journal, then apologised in its own copy: "If it wasn't
 * logged... this stops being guesswork." That admission is the gap. This is the
 * instrument for the un-logged past call.
 *
 * It refuses the two ways this could cheapen. It is not a "was I right?" score —
 * the whole point is that the outcome already answered "did it work?" and that
 * answer is *not* the verdict on the decision. And it does not pretend memory is
 * clean: it forces the split between what you actually knew *then* and what you
 * only learned *after*, because the after-facts are exactly what hindsight
 * smuggles into the judgment. The output is the 2x2 Duke draws — decision
 * quality against outcome quality — and, crucially, the *guarded lesson*: the
 * dangerous cell is the win you'd not repeat (fix the process the result is
 * hiding), and the costly cell is the loss you'd repeat (keep the process the
 * result is indicting). Nothing is sent anywhere; inputs persist in your
 * browser only.
 */

const STORE_KEY = "debrief:v1";

type OutcomeSide = "good" | "bad" | null;
/** Would you make the same call again, knowing only what you knew then? */
type Redo = "again" | "different" | null;
/** How much of the *outcome* was in your hands, versus the roll. */
type Control = "skill" | "mixed" | "luck" | null;

type Inputs = {
  /** The call you made. */
  decision: string;
  /** Roughly when — establishes that this is a past, un-logged call. */
  when: string;
  /** What actually happened. */
  outcome: string;
  outcomeSide: OutcomeSide;
  /** What you genuinely knew or could have known at the time. */
  knewThen: string;
  /** What you only found out afterward — quarantined from the judgment. */
  learnedAfter: string;
  redo: Redo;
  control: Control;
  /** Was the result unusually extreme, either direction? (regression flag) */
  extreme: boolean;
  /** What was knowable-then-and-ignored you'd weigh differently — or "nothing". */
  lesson: string;
};

const BLANK: Inputs = {
  decision: "",
  when: "",
  outcome: "",
  outcomeSide: null,
  knewThen: "",
  learnedAfter: "",
  redo: null,
  control: null,
  extreme: false,
  lesson: "",
};

/**
 * The read-only worked example. It deliberately lands in the *dangerous* cell —
 * a good outcome that earns a "fix the process" verdict — because that is the
 * one move no outcome-based learner ever makes on their own, and the one this
 * tool exists to force. It runs the tool's real readVerdict()/controlRead(), so
 * it can never drift from the live logic.
 */
const EXAMPLE: Inputs = {
  decision:
    "Put a big chunk of my savings into a single stock a coworker wouldn't stop raving about.",
  when: "About four months ago",
  outcome: "It jumped ~40% in a few weeks and I sold. Best trade I've ever made.",
  outcomeSide: "good",
  knewThen:
    "A tip from a coworker, a chart that had been going up, and a good feeling. No read on the business, no sense of the odds, no plan for what I'd do if it dropped 30%.",
  learnedAfter:
    "That the whole sector caught a lucky news cycle the week after I bought — nothing I could have known or predicted going in.",
  redo: "different",
  control: "luck",
  extreme: true,
  lesson:
    "Nothing about how I did it is worth keeping — I skipped every check I know to run and bet money I couldn't afford to lose on a hunch. The win is exactly what makes it dangerous: it wants me to do it again.",
};

// ---- the pure logic, shared by the live tool and the worked example -------

type Cell = {
  key: "earned" | "bad-beat" | "got-away" | "earned-failure";
  title: string;
  /** One-line read of the cell. */
  read: string;
  /** The trap this cell sets, in the second person. */
  trap: string;
  /** What to actually do with the process. */
  move: string;
  /** Whether the correct move is to change the process. */
  change: boolean;
  /** Visual tone. */
  tone: "good" | "bad" | "danger" | "steady";
};

/**
 * The 2x2, Annie Duke's grid: decision quality (would you make the same call on
 * what you knew?) against outcome quality (did it work?). The diagonal is the
 * honest one; the off-diagonal is where all the learning — and mis-learning —
 * happens.
 */
function readVerdict(outcome: OutcomeSide, redo: Redo): Cell | null {
  if (outcome == null || redo == null) return null;
  if (redo === "again" && outcome === "good") {
    return {
      key: "earned",
      title: "Earned",
      read: "The decision and the result agree the easy way. You'd make the same call, and it paid.",
      trap: "The only trap here is banking the size of the win instead of the quality of the call. A great result can flatter a merely-good decision.",
      move: "Keep the process — you'd repeat it and it worked. Bank the reasoning, not the score.",
      change: false,
      tone: "good",
    };
  }
  if (redo === "again" && outcome === "bad") {
    return {
      key: "bad-beat",
      title: "A bad beat",
      read: "A sound bet that lost. You'd make the same call on what you knew — so the process isn't what failed. The dice were.",
      trap: "This cell costs people the most. The loss screams change something, and the honest answer is: don't. Indicting good judgment because it got unlucky is resulting run backwards.",
      move: "Keep the process. Losses like this are the price of making bets that pay in the long run. Don't tear up a good method over one bad roll.",
      change: false,
      tone: "steady",
    };
  }
  if (redo === "different" && outcome === "good") {
    return {
      key: "got-away",
      title: "You got away with it",
      read: "You wouldn't make this call again — and it worked anyway. The result rescued a decision you already know was flawed.",
      trap: "This is the dangerous cell. The win will quietly file a bad process as a good one, and you'll run it back until the luck runs out. Success is hiding the flaw from you.",
      move: "Do not bank the outcome. Fix the process now, while you can still see the mistake the result is trying to cover. This is the one win you should treat like a warning.",
      change: true,
      tone: "danger",
    };
  }
  // redo === "different" && outcome === "bad"
  return {
    key: "earned-failure",
    title: "Earned failure",
    read: "The one cell where the outcome told the truth: a call you'd not repeat, and it duly failed.",
    trap: "The trap is over-correcting — treating everything about it as broken, including the parts that were just variance.",
    move: "Change the process — but only for what was knowable then and ignored, not for the parts that were always going to be a roll.",
    change: true,
    tone: "bad",
  };
}

/** The skill-or-luck read, tempered by regression when the result was extreme. */
function controlRead(control: Control, extreme: boolean): string | null {
  if (control == null) return null;
  const base =
    control === "skill"
      ? "You're reading the outcome as mostly earned — mostly in your hands."
      : control === "mixed"
        ? "You're reading the outcome as part judgment, part roll."
        : "You're reading the outcome as mostly the roll — luck, not control.";
  if (!extreme) return base;
  const regress =
    " And you marked it an extreme result. Extremes regress: an unusually big win or an unusually bad loss almost always sits partway back toward ordinary next time, whatever your skill. So credit — or blame — yourself for less of this one than it feels like, and don't expect the size of it to repeat.";
  return base + regress;
}

// ---- storage --------------------------------------------------------------

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    const side = (s: unknown): OutcomeSide =>
      s === "good" || s === "bad" ? s : null;
    const redo = (s: unknown): Redo =>
      s === "again" || s === "different" ? s : null;
    const control = (s: unknown): Control =>
      s === "skill" || s === "mixed" || s === "luck" ? s : null;
    const str = (s: unknown, d: string) => (typeof s === "string" ? s : d);
    return {
      decision: str(v.decision, BLANK.decision),
      when: str(v.when, BLANK.when),
      outcome: str(v.outcome, BLANK.outcome),
      outcomeSide: side(v.outcomeSide),
      knewThen: str(v.knewThen, BLANK.knewThen),
      learnedAfter: str(v.learnedAfter, BLANK.learnedAfter),
      redo: redo(v.redo),
      control: control(v.control),
      extreme: typeof v.extreme === "boolean" ? v.extreme : BLANK.extreme,
      lesson: str(v.lesson, BLANK.lesson),
    };
  } catch {
    return BLANK;
  }
}

// ---- shared styling -------------------------------------------------------

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";

const areaClass = `${inputClass} min-h-[4.5rem] resize-y leading-relaxed`;

function Segmented<T extends string>({
  value,
  options,
  onChange,
  name,
}: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  name: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={name}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`px-3.5 py-2 text-sm rounded-lg border transition-colors ${
              active
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const cellToneClasses: Record<Cell["tone"], string> = {
  good: "border-[var(--accent)]",
  steady: "border-[var(--accent)]",
  danger: "border-[var(--accent)]",
  bad: "border-[var(--border)]",
};

// ---- the verdict block, shared by live + example --------------------------

function VerdictBlock({
  cell,
  control,
  extreme,
  redo,
}: {
  cell: Cell;
  control: Control;
  extreme: boolean;
  redo: Redo;
}) {
  const control_read = controlRead(control, extreme);
  return (
    <div>
      <div className={`rounded-xl border-2 ${cellToneClasses[cell.tone]} bg-[var(--card)] p-5 sm:p-6`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The verdict — decision × outcome
        </p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {cell.title}
        </p>
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">{cell.read}</p>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          <span className="text-[var(--foreground)] font-medium">The trap: </span>
          {cell.trap}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">What to do: </span>
          {cell.move}
        </p>
      </div>

      {control_read ? (
        <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Skill or luck
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{control_read}</p>
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The one thing to carry out
        </p>
        {cell.change ? (
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            Change <em>one</em>{" "}concrete thing in how you&rsquo;ll decide this next time —
            and only for what was knowable then and ignored, not for the roll. Then put it
            where you&rsquo;ll actually meet it again: arm it as a{" "}
            <Link href="/premortem" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              tripwire
            </Link>{" "}
            or write it as a rule when you{" "}
            <Link href="/decide" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              log the next call
            </Link>
            .{" "}
            {redo === "different" && cell.key === "got-away" ? (
              <span className="text-[var(--muted)]">
                The win makes this feel unnecessary. That feeling is the whole reason to do it.
              </span>
            ) : null}
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            Don&rsquo;t change the process. You&rsquo;d make the same call again, so the
            method held — the result just didn&rsquo;t break your way this time. If anything,
            the move is to notice you were <em>right to bet</em> and keep betting like this.
            <span className="text-[var(--muted)]">
              {" "}
              The loss makes this feel like negligence. It isn&rsquo;t; it&rsquo;s variance.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function DebriefExample() {
  const cell = readVerdict(EXAMPLE.outcomeSide, EXAMPLE.redo)!;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        A worked example — read-only, nothing here is saved
      </p>
      <dl className="mt-4 space-y-3 text-sm leading-relaxed">
        <div>
          <dt className="text-[var(--muted)]">The call</dt>
          <dd className="text-[var(--foreground)]">{EXAMPLE.decision}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">What happened</dt>
          <dd className="text-[var(--foreground)]">
            {EXAMPLE.outcome}{" "}
            <span className="text-[var(--muted)]">(a good outcome)</span>
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Knew at the time</dt>
          <dd className="text-[var(--foreground)]">{EXAMPLE.knewThen}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Only learned after (set aside)</dt>
          <dd className="text-[var(--foreground)]">{EXAMPLE.learnedAfter}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Make the same call again, on what you knew then?</dt>
          <dd className="text-[var(--foreground)]">No — I&rsquo;d decide it differently.</dd>
        </div>
      </dl>
      <div className="mt-5">
        <VerdictBlock cell={cell} control={EXAMPLE.control} extreme={EXAMPLE.extreme} redo={EXAMPLE.redo} />
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Note what just happened: a <em>win</em> came out the other side with a{" "}
        <em>fix-the-process</em> verdict. That is the one move outcome-based learning never
        makes on its own — and the only reason to run the debrief instead of just feeling good
        about the result.
      </p>
    </div>
  );
}

export default function DebriefClient() {
  const [inp, setInp] = useState<Inputs>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [showExample, setShowExample] = useState(false);

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

  const cell = useMemo(() => readVerdict(inp.outcomeSide, inp.redo), [inp.outcomeSide, inp.redo]);

  function reset() {
    setInp(BLANK);
  }

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
        {showExample ? <DebriefExample /> : null}
      </div>

      {/* ---- Step 1: the call and the result ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 1 — the call, and what it got
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              The call you made
            </label>
            <input
              type="text"
              value={inp.decision}
              onChange={(e) => set("decision", e.target.value)}
              placeholder="e.g. Took the bigger role at the smaller company"
              className={inputClass}
            />
          </div>
          <div className="max-w-[16rem]">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Roughly when? <span className="text-[var(--muted)] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={inp.when}
              onChange={(e) => set("when", e.target.value)}
              placeholder="last year"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              What actually happened
            </label>
            <textarea
              value={inp.outcome}
              onChange={(e) => set("outcome", e.target.value)}
              placeholder="The result you're sitting with now — the thing that's making you revisit the call."
              className={areaClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              On the whole, did it work out?
            </label>
            <Segmented
              name="Did it work out?"
              value={inp.outcomeSide}
              onChange={(v) => set("outcomeSide", v)}
              options={[
                { value: "good", label: "It worked out" },
                { value: "bad", label: "It went badly" },
              ]}
            />
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              That&rsquo;s the outcome&rsquo;s verdict — on your luck. It is <em>not</em> the
              verdict on the decision. Name it, then set it down: from here you grade the call,
              not the result.
            </p>
          </div>
        </div>
      </div>

      {/* ---- Step 2: split memory — the hindsight guard ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 2 — split what you knew from what you found out
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          You&rsquo;re about to judge the call — so first quarantine the contaminant. After a
          result lands, memory quietly rewrites the record so it looks like you knew more than
          you did (that&rsquo;s hindsight bias). The only defence is to separate the two by hand.
          The right-hand box can&rsquo;t count toward the decision: you&rsquo;re grading the
          reasoning you had, not the facts that arrived later.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              What you actually knew then
            </label>
            <textarea
              value={inp.knewThen}
              onChange={(e) => set("knewThen", e.target.value)}
              placeholder="The information and options genuinely in front of you at the time."
              className={areaClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              What you only learned <em>after</em>
            </label>
            <textarea
              value={inp.learnedAfter}
              onChange={(e) => set("learnedAfter", e.target.value)}
              placeholder="Everything the result taught you that you couldn't have known going in. This does not count."
              className={areaClass}
            />
          </div>
        </div>
      </div>

      {/* ---- Step 3: the one question ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 3 — the one question that grades the decision
        </p>
        <p className="mt-2 text-base font-medium text-[var(--foreground)] leading-relaxed">
          Knowing only what you knew then — not what you know now — would you make the same call
          again?
        </p>
        <div className="mt-4">
          <Segmented
            name="Would you make the same call again?"
            value={inp.redo}
            onChange={(v) => set("redo", v)}
            options={[
              { value: "again", label: "Yes — I'd make the same call" },
              { value: "different", label: "No — I'd decide it differently" },
            ]}
          />
        </div>
        <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Answer it honestly against these, not against the result
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-[var(--muted)] leading-relaxed">
            <li>
              <span className="text-[var(--foreground)]">Did you reason from what was knowable
              then</span> — or is the answer leaning on something in the right-hand box above?
            </li>
            <li>
              <span className="text-[var(--foreground)]">Did you weigh the downside honestly,</span>{" "}
              or mostly picture the upside?
            </li>
            <li>
              <span className="text-[var(--foreground)]">Did you account for a range of
              outcomes,</span> or bet the whole thing on the one you hoped for?
            </li>
          </ul>
        </div>
      </div>

      {/* ---- Step 4: skill or luck ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 4 — how much of the result was in your hands?
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Separate your steering from the roll. This is what stops you over-crediting a win or
          over-blaming a loss.
        </p>
        <div className="mt-4">
          <Segmented
            name="How much of the result was in your hands?"
            value={inp.control}
            onChange={(v) => set("control", v)}
            options={[
              { value: "skill", label: "Mostly my doing" },
              { value: "mixed", label: "A mix" },
              { value: "luck", label: "Mostly the roll" },
            ]}
          />
        </div>
        <label className="mt-4 flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={inp.extreme}
            onChange={(e) => set("extreme", e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
          />
          <span className="text-sm text-[var(--foreground)] leading-relaxed">
            This result was unusually extreme — a big win or a bad loss, not a middling one.
            <span className="block text-xs text-[var(--muted)] mt-0.5">
              Extremes regress toward ordinary; the tool will factor that in.
            </span>
          </span>
        </label>
      </div>

      {/* ---- The verdict ---- */}
      {cell ? (
        <div className="mt-5">
          <VerdictBlock cell={cell} control={inp.control} extreme={inp.extreme} redo={inp.redo} />

          {/* the guarded lesson */}
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              The lesson — guarded
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              {cell.change
                ? "What was knowable at the time that you'd weigh differently next time? Name the one thing — the check you skipped, the downside you waved off — that was in front of you, not the fact the result handed you afterward."
                : "You'd make this call again, so there may be no process change to make. If the honest answer is “nothing — it was the roll,” that is a complete and correct answer. Write that, and resist the pull to invent a fix for bad luck."}
            </p>
            <textarea
              value={inp.lesson}
              onChange={(e) => set("lesson", e.target.value)}
              placeholder={
                cell.change
                  ? "The one knowable-then thing I'd do differently…"
                  : "Nothing about the process — it was variance. (Or: the one thing, if there is one.)"
              }
              className={`${areaClass} mt-3`}
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Set both the outcome (Step 1) and whether you&rsquo;d make the same call again
            (Step 3), and the verdict appears here — the cell your decision actually lands in,
            and what to do about it.
          </p>
        </div>
      )}

      {/* ---- Reset ---- */}
      <div className="mt-6">
        <button
          type="button"
          onClick={reset}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Clear this debrief
        </button>
      </div>
    </div>
  );
}
