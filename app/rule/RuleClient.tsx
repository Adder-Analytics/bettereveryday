"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import PrintButton from "../components/PrintButton";
import { todayISO, addDaysISO } from "../data/decisionLog";

/**
 * Make it a rule (/rule).
 *
 * Every other instrument here works one decision at a time — the flip point, the
 * pre-mortem, the survival check all assume a single call in front of you. But a
 * large share of the decisions a life actually spends aren't the big one-offs;
 * they're the *same small call, faced again and again*: the late work request,
 * the impulse buy, the one-more-episode, the "quick" favour that eats the
 * evening. Each looks too small for the kit's heavy tools, so it gets re-decided
 * from scratch every time — usually while tired, tempted, or rushed, and usually
 * the way you later wish you hadn't. In aggregate the recurring calls cost more
 * than the big ones, and they lose in the same quiet way: not by one bad choice,
 * but by the same choice made a hundred times in a compromised state.
 *
 * The decision-science answer to a *recurring* decision isn't to decide it better
 * each time — it's to decide it *once*, as a standing rule, and spend your
 * judgement on whether the rule is right rather than re-litigating the instance.
 * A bright line ("none on weeknights") beats a case-by-case intention ("I'll be
 * reasonable about it") because the case-by-case call is made by the version of
 * you least able to make it well. This is the Ulysses move from /tripwire, one
 * surface over: the tripwire binds a *single* decision against a future self; a
 * rule replaces a *recurring* one, so the fight simply doesn't get held each
 * time.
 *
 * The tool does four things a vague resolution doesn't: it gates (a genuine
 * one-off is the wrong shape for a rule — it routes you back to the front door);
 * it forces the rule into a *bright line* you can tell you've broken; it makes
 * you name the *rare, specific* exceptions that should genuinely override it
 * (binding against your weakness, not against the news that you were wrong); and
 * it schedules a review, because a rule is a standing decision to re-endorse, not
 * a life sentence. That review rides the site's existing return desk: the rule is
 * handed to /tripwire pre-filled, and comes back on its date like every other
 * scheduled return — so nothing new has to be remembered.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser so a reload
 * doesn't wipe them; there's no forecast to log — a rule isn't a prediction — only
 * a handoff to arm its review, and a printable copy to keep.
 */

const STORE_KEY = "rule:v1";

/** How often the call comes up. "oneoff" means it doesn't really recur — the
 *  wrong shape for a rule, so the tool routes it away. */
type Freq = "" | "often" | "sometimes" | "oneoff";
/** Which way the case-by-case call tends to go — the reason a rule would help. */
type Pattern = "" | "regret" | "inconsistent" | "tiring";
/** What bends the call in the moment — the predictable force a rule takes off
 *  the table. */
type Force = "" | "temptation" | "tired" | "pressure" | "rushed" | "cost";

type Inputs = {
  decision: string;
  freq: Freq;
  pattern: Pattern;
  force: Force;
  rule: string;
  /** Affirmed the rule is a bright line — a stranger could tell if it was broken. */
  bright: boolean;
  exceptions: string;
  reviewOn: string;
};

const BLANK: Inputs = {
  decision: "",
  freq: "",
  pattern: "",
  force: "",
  rule: "",
  bright: false,
  exceptions: "",
  reviewOn: "",
};

const EXAMPLE: Inputs = {
  decision: "Whether to answer work messages after dinner",
  freq: "often",
  pattern: "regret",
  force: "tired",
  rule: "No work messages after 7pm on weeknights — the laptop closes and the phone's work apps are off until morning.",
  bright: true,
  exceptions: "A genuine, named on-call week, agreed in advance — not a vague 'if it's urgent.'",
  reviewOn: "",
};

function isFreq(v: unknown): v is Freq {
  return v === "often" || v === "sometimes" || v === "oneoff";
}
function isPattern(v: unknown): v is Pattern {
  return v === "regret" || v === "inconsistent" || v === "tiring";
}
function isForce(v: unknown): v is Force {
  return (
    v === "temptation" ||
    v === "tired" ||
    v === "pressure" ||
    v === "rushed" ||
    v === "cost"
  );
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      freq: isFreq(v.freq) ? v.freq : BLANK.freq,
      pattern: isPattern(v.pattern) ? v.pattern : BLANK.pattern,
      force: isForce(v.force) ? v.force : BLANK.force,
      rule: typeof v.rule === "string" ? v.rule : BLANK.rule,
      bright: typeof v.bright === "boolean" ? v.bright : BLANK.bright,
      exceptions: typeof v.exceptions === "string" ? v.exceptions : BLANK.exceptions,
      reviewOn: typeof v.reviewOn === "string" ? v.reviewOn : BLANK.reviewOn,
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

const FREQ_OPTIONS: { id: Freq; label: string; hint: string }[] = [
  { id: "often", label: "All the time", hint: "Most days, or many times a week — it's a standing feature of my life." },
  { id: "sometimes", label: "Regularly", hint: "A few times a month — often enough that deciding it fresh each time adds up." },
  { id: "oneoff", label: "It's really a one-off", hint: "It comes in different shapes each time, or it won't come back — each instance is its own call." },
];
const PATTERN_OPTIONS: { id: Pattern; label: string; hint: string }[] = [
  { id: "regret", label: "I keep choosing the thing I later regret", hint: "In the moment I go one way; with hindsight I wish I'd gone the other — reliably." },
  { id: "inconsistent", label: "It's a coin toss — I'm all over the place", hint: "No pattern I'd defend, just whatever the moment pushes me toward. The inconsistency itself is the cost." },
  { id: "tiring", label: "I usually get it right — it's just exhausting to keep deciding", hint: "The call is fine; paying the deliberation and the willpower every single time is the drain." },
];
const FORCE_OPTIONS: { id: Force; label: string; hint: string }[] = [
  { id: "temptation", label: "Temptation — it feels good right now", hint: "The reward is immediate and the cost is later, so the present always argues louder. (Present bias — the same engine behind sunk cost and a hot decision.)" },
  { id: "tired", label: "Tiredness — I'm depleted by the time it comes up", hint: "The call tends to land when my judgement is lowest, so the worst version of me is the one deciding." },
  { id: "pressure", label: "Other people — it's hard to say no in the moment", hint: "The pressure is social and immediate; the cost of yes is private and later." },
  { id: "rushed", label: "No time — I have to answer on the spot", hint: "The moment gives me no room to think, so I default to whatever's easiest right then." },
  { id: "cost", label: "Nothing bends it — I just don't want to keep spending the decision", hint: "I'd make the same call cold; the point of a rule here is to stop paying for it over and over." },
];

export default function RuleClient() {
  const [inp, setInp] = useState<Inputs>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    const loaded = loadInputs();
    // Carry the decision in from another tool's handoff, but never over saved
    // work: pre-fill the subject only when this tool's own field is still blank.
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.decision.trim();
    const next = seeded ? { ...loaded, decision: carried } : loaded;
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

  const thing = inp.decision.trim();
  const isOneOff = inp.freq === "oneoff";
  // The diagnosis is complete once we know it recurs and why deciding fresh goes
  // wrong — the gate for showing the case and the rule-writing card.
  const diagnosed =
    inp.freq !== "" && !isOneOff && inp.pattern !== "" && inp.force !== "";
  const hasRule = inp.rule.trim().length > 0;

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
        {showExample ? <RuleExample /> : null}
      </div>

      {/* ---- The decision ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What decision keeps coming back?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Whether to say yes to a last-minute weekend work request"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
          onClear={() => {
            set("decision", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Not a single big call — the same small one you face over and over.
        </p>
      </div>

      {/* ---- Q1: does it actually recur? ---- */}
      <QuestionCard
        n={1}
        q="How often does this come up?"
        sub="A rule earns its keep only when the same call comes back. For a genuine one-off, deciding it well once is the whole job."
      >
        <ChipRow
          options={FREQ_OPTIONS}
          value={inp.freq}
          onPick={(id) => set("freq", id)}
        />
      </QuestionCard>

      {/* ---- One-off: the wrong tool. Route away honestly. ---- */}
      {isOneOff ? (
        <OneOffRedirect thing={thing} decision={inp.decision} />
      ) : inp.freq !== "" ? (
        <>
          {/* ---- Q2: which way does it go? ---- */}
          <QuestionCard
            n={2}
            q="Left to decide it each time, how does it go?"
            sub="This is the case for a rule — the gap between the call you make in the moment and the one you'd endorse cold."
          >
            <ChipCol
              options={PATTERN_OPTIONS}
              value={inp.pattern}
              onPick={(id) => set("pattern", id)}
            />
          </QuestionCard>

          {/* ---- Q3: what bends it? ---- */}
          <QuestionCard
            n={3}
            q="What bends the call in the moment?"
            sub="The force a rule takes off the table. Name it — a rule works precisely by settling the decision before this shows up."
          >
            <ChipCol
              options={FORCE_OPTIONS}
              value={inp.force}
              onPick={(id) => set("force", id)}
            />
          </QuestionCard>
        </>
      ) : null}

      {/* ---- The case, then the rule ---- */}
      {diagnosed ? (
        <>
          <CaseForRule pattern={inp.pattern} force={inp.force} thing={thing} />
          <RuleBuilder inp={inp} set={set} thing={thing} hasRule={hasRule} />
        </>
      ) : null}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onPick,
}: {
  options: { id: string; label: string; hint: string }[];
  value: string;
  onPick: (id: never) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id as never)}
            className={`${chipBase} ${value === o.id ? chipOn : chipOff}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {value ? (
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          {options.find((o) => o.id === value)?.hint}
        </p>
      ) : null}
    </>
  );
}

function ChipCol({
  options,
  value,
  onPick,
}: {
  options: { id: string; label: string; hint: string }[];
  value: string;
  onPick: (id: never) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id as never)}
            className={`rounded-lg border px-4 py-3 text-left transition-colors ${
              on
                ? "border-[var(--accent)] bg-[var(--card)]"
                : "border-[var(--border)] hover:border-[var(--accent)]"
            }`}
          >
            <span
              className={`block text-sm font-medium leading-snug ${
                on ? "text-[var(--accent)]" : "text-[var(--foreground)]"
              }`}
            >
              {o.label}
            </span>
            {on ? (
              <span className="mt-1 block text-xs text-[var(--muted)] leading-relaxed">
                {o.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function QuestionCard({
  n,
  q,
  sub,
  children,
}: {
  n: number;
  q: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        {n} · {q}
      </p>
      <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">{sub}</p>
      {children}
    </div>
  );
}

/**
 * A genuine one-off is the wrong shape for a rule — the honest move is to send it
 * to the front door, or to the reversibility triage if the real question is
 * whether it deserves the agonizing at all.
 */
function OneOffRedirect({ thing, decision }: { thing: string; decision: string }) {
  const it = thing || "this";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        This is the wrong tool — and that&rsquo;s worth knowing
      </p>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        A rule is a machine for a decision you&rsquo;ll face <em>again</em>. If{" "}
        <span className="font-medium">{it}</span> is really a one-off — its own
        shape each time, or a call that won&rsquo;t come back — then a standing
        rule would either never fire or quietly go wrong, binding a future you
        can&rsquo;t see. The whole job here is to decide this <em>once</em>, well.
      </p>
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Where to take it instead
        </p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link
              href={withSubject("/find", decision)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Find the right instrument →
            </Link>{" "}
            Answer a question or two about the shape of this one call and get the
            tool built for it.
          </li>
          <li>
            <Link
              href={withSubject("/doors", decision)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Or check which door it is →
            </Link>{" "}
            If the real question is whether it even deserves the agonizing, sort it
            by how reversible it is first.
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * The reasoning, adapted to the diagnosis. Draws the case for a rule from *why*
 * deciding fresh goes wrong (the pattern) and *what* bends it (the force) — the
 * same shape the other tools use to explain their own verdict before handing you
 * the work.
 */
function CaseForRule({
  pattern,
  force,
  thing,
}: {
  pattern: Pattern;
  force: Force;
  thing: string;
}) {
  const it = thing || "this";
  const forceName =
    force === "temptation"
      ? "the pull of the immediate reward"
      : force === "tired"
        ? "the depletion that meets it"
        : force === "pressure"
          ? "the pressure to say yes on the spot"
          : force === "rushed"
            ? "the no-time-to-think of the moment"
            : "the sheer repetition";

  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Why a rule, and not more willpower
      </p>
      {pattern === "tiring" ? (
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          You said you usually get <span className="font-medium">{it}</span> right
          — so this isn&rsquo;t about fixing a bad call. It&rsquo;s that every
          instance costs you the same deliberation and the same scrap of
          willpower, and those are finite. A rule spends the judgement <em>once</em>
          , up front, and buys back every future re-decision. The call was never
          the expensive part; making it again and again was.
        </p>
      ) : pattern === "inconsistent" ? (
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          Decided case by case, <span className="font-medium">{it}</span> comes out
          however the moment pushes — and {forceName} pushes differently every
          time, so there&rsquo;s no pattern you&rsquo;d actually defend. The
          inconsistency <em>is</em> the cost. A rule replaces a decision made by
          whoever you happen to be in the moment with one made by the version of
          you thinking clearly right now.
        </p>
      ) : (
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          The tell is the gap: in the moment you go one way, and with hindsight you
          reliably wish you&rsquo;d gone the other. That gap is {forceName}. You
          won&rsquo;t out-argue it at the moment of choice — it&rsquo;s loudest
          exactly then, by design. A rule doesn&rsquo;t make you stronger at the
          line; it settles <span className="font-medium">{it}</span> now, while
          you&rsquo;re calm, so the line never has to be defended.
        </p>
      )}
      <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
        This is the{" "}
        <Link
          href="/writing/decide-it-once"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          decide-it-once
        </Link>{" "}
        move: a recurring decision is better made a single time, as a standing
        rule, than freshly under pressure — the same logic as{" "}
        <Link
          href="/tripwire"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          binding a decision to a tripwire
        </Link>
        , pointed at a call that comes back instead of one that&rsquo;s made once.
        Now write the rule so it can actually hold.
      </p>
    </div>
  );
}

/**
 * The rule-writing card and the standing-rule output. Two disciplines it forces:
 * a *bright line* (a rule you can't tell you've broken is decoration — the same
 * "a bind you can talk your way out of" failure the tripwire essay names), and
 * *named, rare exceptions* (so the rule binds against your predictable weakness,
 * not against genuine news that it's wrong).
 */
function RuleBuilder({
  inp,
  set,
  thing,
  hasRule,
}: {
  inp: Inputs;
  set: <K extends keyof Inputs>(k: K, v: Inputs[K]) => void;
  thing: string;
  hasRule: boolean;
}) {
  const it = thing || "this";
  const hasExceptions = inp.exceptions.trim().length > 0;
  const reviewDefault = addDaysISO(todayISO(), 90);
  const review = inp.reviewOn || "";

  // The tripwire handoff: the rule as the guard, the review as the signal, its
  // date as the check — reusing the return desk, no new plumbing.
  const reviewSignal =
    "The review date has arrived (or a named exception keeps firing) — re-decide whether this rule still serves me, or recommit to it on purpose.";
  const forceGuarded =
    inp.force === "temptation"
      ? "Deciding it fresh under the pull of the immediate reward"
      : inp.force === "tired"
        ? "Deciding it fresh while depleted"
        : inp.force === "pressure"
          ? "Deciding it fresh under social pressure"
          : inp.force === "rushed"
            ? "Deciding it fresh with no time to think"
            : "Paying the deliberation over and over";
  const tripwireHref =
    `/tripwire?guard=${encodeURIComponent(inp.rule.trim())}` +
    `&signal=${encodeURIComponent(reviewSignal)}` +
    (review ? `&on=${encodeURIComponent(review)}` : "") +
    `&failure=${encodeURIComponent(forceGuarded)}` +
    `&from=${encodeURIComponent("/rule")}`;

  return (
    <>
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Write it as a bright line
        </p>
        <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
          The one test that separates a rule from a wish:{" "}
          <em>could a stranger watching tell whether you&rsquo;d broken it?</em> A
          bright line is countable and unambiguous — &ldquo;none on
          weeknights,&rdquo; not &ldquo;less often;&rdquo; &ldquo;decided at the
          door,&rdquo; not &ldquo;be reasonable about it.&rdquo; A rule you have to
          interpret in the moment just hands the decision back to the version of
          you that couldn&rsquo;t be trusted with it.
        </p>
        <textarea
          value={inp.rule}
          onChange={(e) => set("rule", e.target.value)}
          rows={2}
          placeholder={`e.g. No ${it === "this" ? "…" : ""}—state the line so plainly you can't argue with it later`}
          className={`${inputClass} resize-y`}
        />
        <label className="mt-3 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inp.bright}
            onChange={(e) => set("bright", e.target.checked)}
            className="mt-1 accent-[var(--accent)]"
          />
          <span className="text-sm text-[var(--muted)] leading-relaxed">
            A stranger watching could tell whether I&rsquo;d broken this — it&rsquo;s
            a <strong className="text-[var(--foreground)]">bright line</strong>, not
            a direction.
          </span>
        </label>

        <div className="mt-5">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            The exceptions that genuinely override it
          </label>
          <p className="mb-2 text-sm text-[var(--muted)] leading-relaxed">
            The hard part. Name the <em>rare, specific</em> conditions under which
            the rule really shouldn&rsquo;t apply — so it binds against your
            predictable weakness, not against the news that you were wrong. Vague
            exceptions (&ldquo;unless it&rsquo;s important&rdquo;) are a trapdoor
            the moment will always find; too many, and you&rsquo;ve written no rule
            at all. If there are none you&rsquo;d defend cold, that&rsquo;s a
            strong rule — say so.
          </p>
          <textarea
            value={inp.exceptions}
            onChange={(e) => set("exceptions", e.target.value)}
            rows={2}
            placeholder="e.g. A real, pre-agreed on-call week — not a vague 'if it's urgent.' Or: none."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="mt-5">
          <label
            htmlFor="rule-review"
            className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
          >
            When will you check the rule still serves you?
          </label>
          <p className="mb-2 text-sm text-[var(--muted)] leading-relaxed">
            A rule is a standing decision, not a life sentence — set to be
            re-endorsed, not obeyed forever. Pick a date to look again. (A quarter
            out — {reviewDefault} — is a sensible default.)
          </p>
          <input
            id="rule-review"
            type="date"
            value={review}
            min={todayISO()}
            onChange={(e) => set("reviewOn", e.target.value)}
            className={`${inputClass} max-w-[16rem]`}
          />
        </div>
      </div>

      {/* ---- The standing rule ---- */}
      {hasRule ? (
        <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Your standing rule
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--foreground)] leading-snug">
            {inp.rule.trim()}
          </p>

          {!inp.bright ? (
            <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
              One check before you rely on it: is that a bright line, or a
              direction? If you couldn&rsquo;t tell from the outside whether
              you&rsquo;d broken it, tighten it until you could — otherwise the
              moment will interpret it in its own favour.
            </p>
          ) : null}

          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              {hasExceptions ? "Overridden only when" : "Exceptions"}
            </p>
            <p className="mt-1.5 text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
              {hasExceptions
                ? inp.exceptions.trim()
                : "None named yet. A rule with no stated exception is the strongest kind — as long as you'd defend having none while calm. If there's a real one, name it now, before the moment invents a vague one for you."}
            </p>
          </div>

          <FreshStartLine it={it} />

          {/* Arm the review on the return desk */}
          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Bring it back to review
            </p>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              A rule you never revisit is just as much on autopilot as the
              case-by-case call it replaced. Arm the review as a tripwire and it
              lands back on your return desk{review ? ` on ${formatHuman(review)}` : ""} —
              along with everything else the site is holding for you — so you
              re-endorse the rule on purpose or retire it, rather than obeying it
              out of habit.
            </p>
            <Link
              href={tripwireHref}
              className="mt-4 inline-block text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
            >
              Arm the review as a tripwire →
            </Link>
            {!review ? (
              <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                Set a date above and it rides along; leave it and you can pick the
                date on the next screen.
              </p>
            ) : null}
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <PrintButton
              label="Print / Save the rule as PDF"
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            />
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Write the rule above as a bright line and it appears here as a standing
            rule you can keep, print, and bring back to review.
          </p>
        </div>
      )}
    </>
  );
}

function FreshStartLine({ it }: { it: string }) {
  return (
    <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
      From here, {it === "this" ? "the recurring call" : `“${it}”`} isn&rsquo;t a
      decision anymore — it&rsquo;s a rule. When it comes up, you don&rsquo;t
      re-argue it; you apply it, or you invoke a named exception. If you find
      yourself re-opening the case in the moment, that&rsquo;s the signal the rule
      is wrong or the moment is compromised — note it for the review, don&rsquo;t
      litigate it live.
    </p>
  );
}

/** Human date for the return-desk line. Local-time, no library. */
function formatHuman(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The worked example, read-only. A fixed, everyday recurring call — the kind
 * everyone re-decides badly at night — carried through to a finished rule, so a
 * newcomer sees a full pass without a character landing in their own fields.
 */
function RuleExample() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{EXAMPLE.decision}.</span> It comes up{" "}
        <span className="font-medium">most evenings</span>; left to decide it each
        time, you <span className="font-medium">answer, then resent it</span>,
        because you&rsquo;re <span className="font-medium">depleted by then</span>{" "}
        and the reply feels easier than the guilt. You won&rsquo;t win that at 9pm
        — so you don&rsquo;t schedule the fight.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The standing rule
        </p>
        <p className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)] leading-snug">
          {EXAMPLE.rule}
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Overridden only when
        </p>
        <p className="mt-1 text-sm text-[var(--foreground)] leading-relaxed">
          {EXAMPLE.exceptions}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          Bright enough that you can&rsquo;t argue with it at 9pm, one real
          exception so it isn&rsquo;t brittle, and a date to check whether it still
          fits your job. The evening decision is over — you made it once, this
          morning, cold.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank — build the rule for the call you actually
        keep facing.
      </p>
    </div>
  );
}
