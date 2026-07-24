"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/**
 * Decided Isn't Done (/act).
 *
 * The playbook's "you've made the call — now make it happen" situation was the
 * last richly-modelled moment on the site with no instrument. It names the
 * intention–action gap and prescribes the fix in full: an if-then plan pointed
 * at *doing* (Gollwitzer's implementation intention — a concrete cue that fires
 * the first move), a backup if-then for the obstacle that would stop it, and a
 * tripwire — the same if-then pointed at *reconsidering* — so a decision quietly
 * going wrong doesn't coast past the moment to change course. Between them they
 * close both ways a decision dies after it's made: never started, never revisited.
 *
 * The tool refuses the two things that turn a plan back into a wish. It refuses
 * to run at all when the honest problem is the *wanting*, not the doing — the
 * model's own caveat is that an if-then is weak against a goal you don't actually
 * want, and no cue rescues that, so the tool names it and sends you to decide
 * whether to do the thing at all. And when you do want it, it refuses the two
 * vaguenesses that make each if-then fail: a cue you won't actually encounter
 * ("soon," "when I have time"), and a first step too big to finish this week —
 * because the first step's whole job is to start, not to finish, and action
 * creates the information deliberation can't. The deliverable is a plan you can
 * hold: three if-then sentences, with any weak link named. Nothing is sent
 * anywhere; inputs persist in your browser only.
 */

const STORE_KEY = "act:v1";

/** Is the hard part the doing, or the wanting? The model's caveat, as a gate. */
type Want = "want" | "should" | null;

type Inputs = {
  /** The call you've already made. */
  decision: string;
  want: Want;
  /** The smallest concrete first step — finishable this week. */
  firstMove: string;
  /** The cue that fires it: a time, a place, an event you'll notice. */
  cue: string;
  /** The one thing most likely to stop the first move. */
  obstacle: string;
  /** The pre-decided response if the obstacle shows up. */
  coping: string;
  /** The reconsider tripwire: an observable state… */
  reconsiderState: string;
  /** …and a real date you're obligated to look. */
  reconsiderDate: string;
};

const BLANK: Inputs = {
  decision: "",
  want: null,
  firstMove: "",
  cue: "",
  obstacle: "",
  coping: "",
  reconsiderState: "",
  reconsiderDate: "",
};

/**
 * The read-only worked example. A universal intention–action case — meaning to
 * save and never starting — built out to a load-bearing plan: a small first move
 * (open the account and move $200, not "make a financial plan"), a cue that will
 * unambiguously fire (payday), a coping if-then aimed at the *specific* obstacle
 * (the research-forever stall), and a reconsider tripwire. It runs the tool's
 * real assemblePlan(), so it can't drift from the live logic.
 */
const EXAMPLE: Inputs = {
  decision: "Actually start putting money aside for retirement, instead of meaning to.",
  want: "want",
  firstMove:
    "Open the index-fund account and move the first $200 in. Just the first transfer — not a whole strategy.",
  cue: "When my paycheck lands on the 1st, before I open any other tab.",
  obstacle:
    "I'll tell myself I have to find the 'best' fund first, and stall on research for another month.",
  coping:
    "If I catch myself researching, I put the $200 in the default target-date fund now and optimize later — a started account beats a perfect one.",
  reconsiderState: "the automatic transfer hasn't fired for two months running",
  reconsiderDate: "2026-11-01",
};

// ---- the pure logic, shared by the live tool and the worked example -------

/**
 * A conservative flag for a cue that will never actually fire. Only trips on
 * phrases that are unambiguously non-cues — "soon," "when I have time" — so a
 * real cue ("when I sit down at my desk at 9") is never falsely flagged. The
 * specificity is the active ingredient; a vague cue is the single most common
 * reason the most sincere plan still dies.
 */
const VAGUE_MARKERS = [
  "have time",
  "get a chance",
  "calm down",
  "things settle",
  "at some point",
  "eventually",
  "someday",
  "some day",
  "when i'm free",
  "when im free",
  "when i feel like",
  "in the future",
  "when possible",
  "asap",
  "one of these days",
  "sooner or later",
];

export function cueIsVague(cue: string): boolean {
  const c = cue.trim().toLowerCase();
  if (!c) return false; // empty is "incomplete," handled separately — not "vague"
  if (c === "soon" || c === "later" || c === "sometime") return true;
  return VAGUE_MARKERS.some((m) => c.includes(m));
}

type Gap = { label: string; why: string };

type AssembledPlan = {
  /** "When <cue>, I will <firstMove>." — null until both parts exist. */
  start: string | null;
  /** "If <obstacle>, I will <coping>." — null until both parts exist. */
  cope: string | null;
  /** "If <state> by <date>, I stop and reconsider." — null until both exist. */
  reconsider: string | null;
  level: "ready" | "partial" | "thin";
  headline: string;
  gaps: Gap[];
  /** The whole plan as plain text, for copying somewhere you'll see it. */
  plainText: string;
};

function trimmed(s: string): string {
  return s.trim();
}

/**
 * Assemble the structured fields into the three if-then sentences and read how
 * load-bearing the plan actually is. The starting if-then is the spine — without
 * a cue and a first move there is no plan, only a restated intention. Everything
 * else strengthens it: a concrete cue that fires, a coping plan for the obstacle,
 * a tripwire so the plan can't coast when it's gone wrong.
 */
export function assemblePlan(inp: Inputs): AssembledPlan {
  const first = trimmed(inp.firstMove);
  const cue = trimmed(inp.cue);
  const obstacle = trimmed(inp.obstacle);
  const coping = trimmed(inp.coping);
  const state = trimmed(inp.reconsiderState);
  const date = trimmed(inp.reconsiderDate);

  const start = first && cue ? `When ${cue}, I will ${first}` : null;
  const cope = obstacle && coping ? `If ${obstacle}, I will ${coping}` : null;
  const reconsider =
    state && date ? `If ${state} by ${date}, I stop and reconsider` : null;

  const gaps: Gap[] = [];
  let level: AssembledPlan["level"];
  let headline: string;

  if (!start) {
    level = "thin";
    headline = "Not a plan yet — still a wish";
    if (!first)
      gaps.push({
        label: "No first move",
        why: "An intention with no first step is the thing that quietly never happens. Name the smallest move you could finish this week.",
      });
    if (!cue)
      gaps.push({
        label: "No cue",
        why: "Without a trigger, the move waits on a later moment that never arrives. Bind it to a time, a place, or an event you'll actually notice.",
      });
  } else {
    if (cueIsVague(cue))
      gaps.push({
        label: "The cue is vague",
        why: "“Soon” and “when I have time” never become cues, so they never fire. Pin it to a concrete moment you can't miss — an existing event works best.",
      });
    if (!cope)
      gaps.push({
        label: "No plan for the obstacle",
        why: "The thing most likely to stop you is worth pre-deciding around. An if-then for the obstacle — decided now, not in the moment — is what shields the plan.",
      });
    if (!reconsider)
      gaps.push({
        label: "No tripwire to reconsider",
        why: "A plan welded to one cue can coast past the point it stopped being right. Set the signal that tells you to stop and rethink, so a good call doesn't drift into a bad one.",
      });
    level = gaps.length === 0 ? "ready" : "partial";
    headline =
      level === "ready"
        ? "A plan that can carry weight"
        : "The spine is there — here's the weak link";
  }

  // The copyable plain-text version — only the lines that actually exist.
  const lines: string[] = [];
  const decision = trimmed(inp.decision);
  if (decision) lines.push(`Plan — ${decision}`, "");
  if (start) lines.push(`• ${start}.`);
  if (cope) lines.push(`• ${cope}.`);
  if (reconsider) lines.push(`• ${reconsider}.`);
  const plainText = lines.join("\n");

  return { start, cope, reconsider, level, headline, gaps, plainText };
}

// ---- storage --------------------------------------------------------------

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    const want = (s: unknown): Want =>
      s === "want" || s === "should" ? s : null;
    const str = (s: unknown, d: string) => (typeof s === "string" ? s : d);
    return {
      decision: str(v.decision, BLANK.decision),
      want: want(v.want),
      firstMove: str(v.firstMove, BLANK.firstMove),
      cue: str(v.cue, BLANK.cue),
      obstacle: str(v.obstacle, BLANK.obstacle),
      coping: str(v.coping, BLANK.coping),
      reconsiderState: str(v.reconsiderState, BLANK.reconsiderState),
      reconsiderDate: str(v.reconsiderDate, BLANK.reconsiderDate),
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

const levelToneClasses: Record<AssembledPlan["level"], string> = {
  ready: "border-[var(--accent)]",
  partial: "border-[var(--accent)]",
  thin: "border-[var(--border)]",
};

// ---- the plan block, shared by live + example -----------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      onClick={() => {
        try {
          navigator.clipboard?.writeText(text).then(
            () => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            },
            () => {}
          );
        } catch {
          /* clipboard blocked — the plan is still on screen to copy by hand */
        }
      }}
      className="text-xs text-[var(--accent)] hover:opacity-70 transition-opacity"
    >
      {copied ? "Copied ✓" : "Copy the plan"}
    </button>
  );
}

function PlanBlock({ plan }: { plan: AssembledPlan }) {
  return (
    <div>
      <div className={`rounded-xl border-2 ${levelToneClasses[plan.level]} bg-[var(--card)] p-5 sm:p-6`}>
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Your plan
          </p>
          <CopyButton text={plan.plainText} />
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {plan.headline}
        </p>

        {plan.start ? (
          <ul className="mt-4 space-y-3">
            <li className="text-sm leading-relaxed">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                To start
              </span>
              <span className="mt-1 block text-[var(--foreground)]">{plan.start}.</span>
            </li>
            {plan.cope ? (
              <li className="text-sm leading-relaxed">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  If it stalls
                </span>
                <span className="mt-1 block text-[var(--foreground)]">{plan.cope}.</span>
              </li>
            ) : null}
            {plan.reconsider ? (
              <li className="text-sm leading-relaxed">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  To reconsider
                </span>
                <span className="mt-1 block text-[var(--foreground)]">
                  {plan.reconsider}.
                </span>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            A plan needs a first move and a cue to fire it. Fill those in and it
            assembles here — the sentence that hands the doing to the situation
            instead of to your busier, later self.
          </p>
        )}
      </div>

      {plan.gaps.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            {plan.level === "thin" ? "What's missing" : "The weak link to shore up"}
          </p>
          <ul className="mt-3 space-y-3">
            {plan.gaps.map((g) => (
              <li key={g.label} className="text-sm leading-relaxed">
                <span className="font-medium text-[var(--foreground)]">{g.label}.</span>{" "}
                <span className="text-[var(--muted)]">{g.why}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : plan.start ? (
        <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            All three if-thens are in place: a concrete cue to start, a plan for
            the obstacle, and a tripwire to stop and rethink. Put it where the cue
            lives — a calendar entry, a phone reminder, a note by the door — so it
            outranks the version of you that's tired and running late. To land the
            reconsider date in your{" "}
            <Link
              href="/review"
              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              return desk
            </Link>{" "}
            automatically, arm it as a{" "}
            <Link
              href="/premortem"
              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              tripwire
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ActExample() {
  const plan = assemblePlan(EXAMPLE);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        A worked example — read-only, nothing here is saved
      </p>
      <dl className="mt-4 space-y-3 text-sm leading-relaxed">
        <div>
          <dt className="text-[var(--muted)]">The call already made</dt>
          <dd className="text-[var(--foreground)]">{EXAMPLE.decision}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Is the hard part the doing, or the wanting?</dt>
          <dd className="text-[var(--foreground)]">
            The doing — I want this; I just never start.
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">The first move (small enough to finish this week)</dt>
          <dd className="text-[var(--foreground)]">{EXAMPLE.firstMove}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">The cue that fires it</dt>
          <dd className="text-[var(--foreground)]">{EXAMPLE.cue}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">The obstacle, and the plan for it</dt>
          <dd className="text-[var(--foreground)]">
            {EXAMPLE.obstacle} → {EXAMPLE.coping}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">The tripwire to reconsider</dt>
          <dd className="text-[var(--foreground)]">
            {EXAMPLE.reconsiderState}, by {EXAMPLE.reconsiderDate}
          </dd>
        </div>
      </dl>
      <div className="mt-5">
        <PlanBlock plan={plan} />
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Note what the tool just did: it turned &ldquo;I should save more&rdquo;
        into a sentence with a trigger, disarmed the one obstacle in advance, and
        set a line that says when to stop and rethink. That&rsquo;s the difference
        between a resolution — which waits to be remembered — and a plan, which
        hands the doing to the moment it&rsquo;ll actually happen.
      </p>
    </div>
  );
}

export default function ActClient() {
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

  const plan = useMemo(() => assemblePlan(inp), [inp]);

  function reset() {
    setInp(BLANK);
  }

  const wanting = inp.want === "want";
  const shoulding = inp.want === "should";

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
        {showExample ? <ActExample /> : null}
      </div>

      {/* ---- Step 1: the call, and the honest gate ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 1 — the call, and the honest gate
        </p>
        <div className="mt-3">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            What you&rsquo;ve decided to do
          </label>
          <input
            type="text"
            value={inp.decision}
            onChange={(e) => set("decision", e.target.value)}
            placeholder="e.g. Start saving for retirement. Have the conversation with my manager. See the doctor."
            className={inputClass}
          />
        </div>
        <p className="mt-4 text-base font-medium text-[var(--foreground)] leading-relaxed">
          Before you build a plan, one honest question: is the hard part the{" "}
          <em>doing</em>, or the <em>wanting</em>?
        </p>
        <div className="mt-3">
          <Segmented
            name="Is the hard part the doing or the wanting?"
            value={inp.want}
            onChange={(v) => set("want", v)}
            options={[
              { value: "want", label: "I want this — I just don't start" },
              { value: "should", label: "Honestly, I only feel I should" },
            ]}
          />
        </div>
        <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Why the gate is here
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            An if-then plan is powerful against one specific problem — starting,
            remembering, catching a narrow window — and weak against a goal you
            don&rsquo;t actually want, where the trouble is the wanting, not the
            planning. No cue rescues a decision your gut keeps voting against. If
            you&rsquo;ve set a good plan for this before and skated past it twice,
            read that as a signal to revisit the call itself, not to engineer a
            cleverer trigger.
          </p>
        </div>
      </div>

      {/* ---- The "wrong tool" branch ---- */}
      {shoulding ? (
        <div className="mt-5 rounded-xl border-2 border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            A plan isn&rsquo;t the tool you need
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            The problem is the wanting, not the doing
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            If you only feel you <em>should</em>, the most elaborate if-then in the
            world won&rsquo;t fire — a cue can only hand off an action you actually
            mean to take. Building a plan here would just be a more sophisticated
            way of not deciding.
          </p>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            So back up one step and settle whether to do the thing at all. If
            it&rsquo;s a fresh choice between options, weigh it at the{" "}
            <Link href="/weigh" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              flip point
            </Link>{" "}
            or line them up in{" "}
            <Link href="/compare" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              compare
            </Link>
            . If it&rsquo;s a thing you&rsquo;re already in and can&rsquo;t tell
            whether to keep at, run{" "}
            <Link href="/quit" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              would you start it today?
            </Link>{" "}
            Come back here once it&rsquo;s a real <em>want</em> — then a plan is
            exactly the right tool.
          </p>
        </div>
      ) : null}

      {/* ---- The builder — only once it's a genuine want ---- */}
      {wanting ? (
        <>
          {/* Step 2: the first move */}
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Step 2 — the first move, small enough to finish this week
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              Not the whole thing — the smallest concrete step you could complete
              in one sitting. The first move&rsquo;s job is to <em>start</em>, not
              to finish: a cheap, easy-to-undo first step taken now beats a perfect
              one planned forever, because action creates information no amount of
              deliberating can.
            </p>
            <textarea
              value={inp.firstMove}
              onChange={(e) => set("firstMove", e.target.value)}
              placeholder="e.g. Open the account and move the first $200 in — just the transfer, not the whole plan."
              className={`${areaClass} mt-4`}
            />
          </div>

          {/* Step 3: the cue */}
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Step 3 — the cue that fires it
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              &ldquo;When <em>this</em> happens, I&rsquo;ll do it.&rdquo; A time, a
              place, or an event you&rsquo;ll unambiguously notice — best of all,
              one that already happens on its own (after I pour my morning coffee;
              when I sit down Monday at 9; the moment my paycheck lands).
              &ldquo;Soon&rdquo; and &ldquo;when I have time&rdquo; never become
              cues, so they never fire.
            </p>
            <input
              type="text"
              value={inp.cue}
              onChange={(e) => set("cue", e.target.value)}
              placeholder="e.g. When my paycheck lands on the 1st, before I open any other tab."
              className={`${inputClass} mt-4`}
            />
            {inp.cue.trim() && cueIsVague(inp.cue) ? (
              <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                That reads as an intention, not a cue — there&rsquo;s no specific
                moment in it to trip. Anchor it to something concrete you&rsquo;ll
                actually encounter.
              </p>
            ) : null}
          </div>

          {/* Step 4: the obstacle + coping if-then */}
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Step 4 — the obstacle, and the plan for it
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              Name the one thing most likely to stop that first move — then decide{" "}
              <em>now</em>, while it&rsquo;s not happening, what you&rsquo;ll do
              when it does. A second if-then, aimed at the obstacle, is what keeps
              the plan from dying the first time the world doesn&rsquo;t cooperate.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  What&rsquo;s most likely to stop you
                </label>
                <input
                  type="text"
                  value={inp.obstacle}
                  onChange={(e) => set("obstacle", e.target.value)}
                  placeholder="e.g. I'll tell myself I need to research the 'best' option first."
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  If that happens, I will…
                </label>
                <textarea
                  value={inp.coping}
                  onChange={(e) => set("coping", e.target.value)}
                  placeholder="e.g. …put the money in the default option now and optimize later — a started account beats a perfect one."
                  className={areaClass}
                />
              </div>
            </div>
          </div>

          {/* Step 5: the reconsider tripwire */}
          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Step 5 — the tripwire to reconsider
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              The same if-then pointed the other way. A decision dies two ways —
              never started, or never revisited — and a plan welded to one cue can
              coast past the moment it stopped being right. So set the one signal
              that means <em>stop and rethink</em>: a{" "}
              <span className="text-[var(--foreground)]">state</span> you
              can&rsquo;t argue with and a{" "}
              <span className="text-[var(--foreground)]">date</span> you&rsquo;re
              obligated to look — not &ldquo;if it&rsquo;s not working&rdquo; (that
              renegotiates every morning), but &ldquo;if X by this date, I stop.&rdquo;
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  If I see this…
                </label>
                <input
                  type="text"
                  value={inp.reconsiderState}
                  onChange={(e) => set("reconsiderState", e.target.value)}
                  placeholder="e.g. the transfer hasn't fired two months running"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  …by this date
                </label>
                <input
                  type="date"
                  value={inp.reconsiderDate}
                  onChange={(e) => set("reconsiderDate", e.target.value)}
                  className={`${inputClass} sm:w-[10.5rem]`}
                />
              </div>
            </div>
          </div>

          {/* The assembled plan */}
          <div className="mt-5">
            <PlanBlock plan={plan} />
          </div>
        </>
      ) : null}

      {/* ---- Reset ---- */}
      <div className="mt-6">
        <button
          type="button"
          onClick={reset}
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Clear this
        </button>
      </div>
    </div>
  );
}
