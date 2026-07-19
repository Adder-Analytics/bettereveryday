"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/**
 * And then what? (/trace)
 *
 * The consequence-tracing instrument. Every other tool on the site helps you
 * put an honest number on a thing or decide an either/or; none of them addresses
 * the most common avoidable mistake there is — stopping the analysis one step
 * too early, at the first-order effect. First-order effects are immediate,
 * visible, and the reason you're considering the move at all. Second- and
 * third-order effects are delayed, diffuse, and often point the other way. The
 * essay "And Then What?" ends on a procedure it never made drillable: ask "and
 * then what?", iterate, watch how the people affected adapt, and notice the
 * sign flip. This tool is that procedure.
 *
 * It refuses to be a "list your consequences" worksheet. The mechanism is the
 * SIGN PATTERN across orders. You tag each effect as better or worse for what
 * you actually want, and the tool reads the trajectory:
 *   first + / later −  → the trap: purely pleasant now, the bill comes later
 *                        (present bias is why this one works on us).
 *   first − / later +  → the treasure: costs up front, compounds after —
 *                        the shape of almost everything worth doing.
 *   first + / later +  → rare; usually you stopped one question too early.
 *   mixed / all −      → weigh the later cost, or the rare easy no.
 * The single most valuable thing a trace surfaces is the reversal — where the
 * sign flips between the effect you intended and the one that follows — and the
 * tool names it explicitly.
 *
 * Two lenses inject the places second-order effects actually hide: systems with
 * people who adapt (a rule that assumes everyone keeps behaving as before has
 * already failed — the cobra effect, Goodhart), and competitive arenas where
 * the first-order conclusion is already priced in (Howard Marks's second-level
 * thinking). Nothing is sent anywhere; inputs persist in the browser under
 * trace:v1. There is no journal write — a consequence trace isn't a forecast —
 * only links onward once you've seen the chain.
 */

const STORE_KEY = "trace:v1";

type Sign = "better" | "worse" | null;

type Inputs = {
  move: string;
  first: string;
  firstSign: Sign;
  second: string;
  secondSign: Sign;
  third: string;
  thirdSign: Sign;
  peopleAdapt: boolean;
  competitive: boolean;
};

/**
 * The blank the tool opens on: an empty move and three empty orders, no signs
 * chosen. The read (verdict "need-more") stays a gentle "keep going" prompt
 * until there's a real chain to score, so a newcomer with their own move to
 * trace starts clean rather than deleting someone else's side-project story
 * field by field. The illustrative scenario lives in EXAMPLE, shown read-only
 * behind a toggle and never written to the live fields or to storage.
 */
const BLANK: Inputs = {
  move: "",
  first: "",
  firstSign: null,
  second: "",
  secondSign: null,
  third: "",
  thirdSign: null,
  peopleAdapt: false,
  competitive: false,
};

const EXAMPLE: Inputs = {
  move: "Say yes to the side project for the extra income",
  first: "More money coming in, and it feels good to be wanted and busy",
  firstSign: "better",
  second:
    "Evenings and weekends fill up; the work I already had gets done worse; I go into everything more tired",
  secondSign: "worse",
  third:
    "The day job and the relationships I was funding all this for quietly degrade — the thing the money was supposed to be for",
  thirdSign: "worse",
  peopleAdapt: false,
  competitive: false,
};

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      move: str(v.move, BLANK.move),
      first: str(v.first, BLANK.first),
      firstSign: sign(v.firstSign, BLANK.firstSign),
      second: str(v.second, BLANK.second),
      secondSign: sign(v.secondSign, BLANK.secondSign),
      third: str(v.third, BLANK.third),
      thirdSign: sign(v.thirdSign, BLANK.thirdSign),
      peopleAdapt: typeof v.peopleAdapt === "boolean" ? v.peopleAdapt : BLANK.peopleAdapt,
      competitive: typeof v.competitive === "boolean" ? v.competitive : BLANK.competitive,
    };
  } catch {
    return BLANK;
  }
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}
function sign(v: unknown, fallback: Sign): Sign {
  return v === "better" || v === "worse" || v === null ? (v as Sign) : fallback;
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";

type Verdict =
  | { kind: "need-more" }
  | { kind: "trap" }
  | { kind: "treasure" }
  | { kind: "mixed" }
  | { kind: "all-good" }
  | { kind: "all-bad" };

export default function TraceClient() {
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

  // The traced chain: an order counts only once it has both a description and a
  // sign. The first order defaults to "better" (it's why you'd do the thing).
  const chain = useMemo(() => {
    const orders: { text: string; sign: Sign }[] = [
      { text: inp.first, sign: inp.firstSign },
      { text: inp.second, sign: inp.secondSign },
      { text: inp.third, sign: inp.thirdSign },
    ];
    return orders
      .map((o, i) => ({ ...o, order: i + 1 }))
      .filter((o) => o.text.trim() !== "" && (o.sign === "better" || o.sign === "worse"));
  }, [inp.first, inp.firstSign, inp.second, inp.secondSign, inp.third, inp.thirdSign]);

  const verdict: Verdict = useMemo(() => {
    if (chain.length === 0 || !inp.move.trim()) return { kind: "need-more" };
    const first = chain[0];
    const later = chain.slice(1);
    if (later.length === 0) return { kind: "need-more" };
    const firstUp = first.sign === "better";
    const laterUp = later.some((o) => o.sign === "better");
    const laterDown = later.some((o) => o.sign === "worse");
    if (firstUp && laterDown && !laterUp) return { kind: "trap" };
    if (firstUp && laterUp && laterDown) return { kind: "mixed" };
    if (firstUp && laterUp && !laterDown) return { kind: "all-good" };
    if (!firstUp && laterUp) return { kind: "treasure" };
    return { kind: "all-bad" };
  }, [chain, inp.move]);

  // The reversal: the first sign differs from a later one. Down-flips (a win that
  // sours) and up-flips (a cost that pays off) are both worth naming.
  const reversal = useMemo(() => {
    if (chain.length < 2) return null as null | "down" | "up";
    const firstUp = chain[0].sign === "better";
    const flip = chain.slice(1).find((o) => (o.sign === "better") !== firstUp);
    if (!flip) return null;
    return firstUp ? "down" : "up";
  }, [chain]);

  const laterHasDownside = chain.slice(1).some((o) => o.sign === "worse");

  return (
    <div>
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
        {showExample ? <TraceExample /> : null}
      </div>

      {/* ---- The move ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you thinking of doing?
        </label>
        <input
          type="text"
          value={inp.move}
          onChange={(e) => set("move", e.target.value)}
          placeholder="e.g. Cut the price to win the deal"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          A move, a policy, a purchase, a habit, a rule you&rsquo;re about to set —
          anything whose effects you want to follow past the obvious one.
        </p>
      </div>

      {/* ---- Order 1 ---- */}
      <OrderBlock
        n={1}
        badge="First-order effect"
        prompt="What happens right away — the effect you're doing it for. Usually the reason it's tempting."
        value={inp.first}
        onText={(v) => set("first", v)}
        sign={inp.firstSign}
        onSign={(s) => set("firstSign", s)}
        placeholder="The immediate, visible, intended result"
      />

      {/* ---- Order 2 (with the lenses) ---- */}
      <OrderBlock
        n={2}
        badge="And then what?"
        prompt="What happens next — and above all, how the people affected adapt. Second-order effects live wherever people respond to what you did."
        value={inp.second}
        onText={(v) => set("second", v)}
        sign={inp.secondSign}
        onSign={(s) => set("secondSign", s)}
        placeholder="The response, the adjustment, the delayed cost or gain"
      >
        <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={inp.peopleAdapt}
              onChange={(e) => set("peopleAdapt", e.target.checked)}
              className="mt-1 accent-[var(--accent)]"
            />
            <span className="text-sm text-[var(--muted)] leading-relaxed">
              This plays out among{" "}
              <strong className="text-[var(--foreground)]">people who will adapt</strong>{" "}
              to it — a market, a team, a household, your own future self.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={inp.competitive}
              onChange={(e) => set("competitive", e.target.checked)}
              className="mt-1 accent-[var(--accent)]"
            />
            <span className="text-sm text-[var(--muted)] leading-relaxed">
              This is a{" "}
              <strong className="text-[var(--foreground)]">competitive arena</strong>{" "}
              where the obvious move is already visible to everyone — a market, a
              job hunt, buying or selling.
            </span>
          </label>
        </div>
      </OrderBlock>

      {/* ---- Order 3 ---- */}
      <OrderBlock
        n={3}
        badge="And then what, again?"
        prompt="The response to the response — the part almost nobody reaches. Optional, but it's usually where the real consequence lives."
        value={inp.third}
        onText={(v) => set("third", v)}
        sign={inp.thirdSign}
        onSign={(s) => set("thirdSign", s)}
        placeholder="What people do about what happens next"
        optional
      />

      {/* ---- The read ---- */}
      <div className="mt-6 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        {verdict.kind === "need-more" ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Keep going
            </p>
            <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
              First-order thinking is everyone&rsquo;s default — it&rsquo;s fast, it
              feels complete, and it&rsquo;s the answer everyone already has. Name
              the first effect and at least one that follows it, and mark whether
              each is <em>better</em> or <em>worse</em> for what you actually want.
              The pattern across them is the whole point.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              The shape of this chain
            </p>

            <SignTrail chain={chain} />

            {/* Reversal — the single most useful thing a trace reveals */}
            {reversal ? (
              <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                  The sign flips here
                </p>
                <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
                  {reversal === "down" ? (
                    <>
                      The effect you&rsquo;re doing it for is{" "}
                      <span className="font-medium">not</span>{" "}the one that lasts.
                      The move looks good at the first order and turns against you
                      later — which is exactly the chain you&rsquo;d have stopped
                      reading at the top. The first-order win is bait.
                    </>
                  ) : (
                    <>
                      The cost is all up front. It looks bad at the first order and
                      turns in your favour later — which is why most people quit
                      before the payoff and it stays available to whoever
                      doesn&rsquo;t.
                    </>
                  )}
                </p>
              </div>
            ) : null}

            {/* The verdict copy */}
            <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-2">
              {verdict.kind === "trap" ? (
                <>
                  <p className="font-semibold">
                    Purely pleasant now, the bill comes later — be suspicious.
                  </p>
                  <p className="text-[var(--muted)]">
                    This is the most reliable trap there is: first-order positive,
                    later negative. It works on us because we discount the future
                    steeply and the present barely at all — the near reward is
                    vivid and the deferred cost is abstract, so the chain that ends
                    badly still feels good at the top. The tell isn&rsquo;t that
                    it&rsquo;s a bad idea; it&rsquo;s that the part you like is the
                    part that reverses. Give anything whose upside is entirely up
                    front a second, colder look.
                  </p>
                </>
              ) : verdict.kind === "treasure" ? (
                <>
                  <p className="font-semibold">
                    Costs up front, compounds after — give it a second look.
                  </p>
                  <p className="text-[var(--muted)]">
                    First-order negative, later positive is the shape of nearly
                    everything worth doing — exercise, the hard conversation,
                    saving, the embarrassing question, the plan you pre-mortem.
                    They stay available precisely because the cost is all up front
                    and most people read only the first line. If you can survive
                    the first order, the chain is on your side.
                  </p>
                </>
              ) : verdict.kind === "mixed" ? (
                <>
                  <p className="font-semibold">
                    The later effects cut both ways — and you&rsquo;d have stopped
                    at the win.
                  </p>
                  <p className="text-[var(--muted)]">
                    There&rsquo;s a real gain here and a real cost trailing it. The
                    danger was never that you&rsquo;d miss the upside — that&rsquo;s
                    the first-order effect, the one that&rsquo;s easy to see. It&rsquo;s
                    that you&rsquo;d bank it and never price the downside that comes
                    after. Now that both are on the table, weigh them against each
                    other rather than acting on the half that arrives first.
                  </p>
                </>
              ) : verdict.kind === "all-good" ? (
                <>
                  <p className="font-semibold">
                    Good all the way down — which is worth one more push.
                  </p>
                  <p className="text-[var(--muted)]">
                    A chain that&rsquo;s positive at every order is rare, and it
                    usually means you stopped one &ldquo;and then what?&rdquo; too
                    early. Ask the uncomfortable version: who loses when this works,
                    and what do they do about it? The second order that bites is
                    almost always someone else&rsquo;s response you haven&rsquo;t
                    imagined yet.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Worse now and worse later — the rare easy no.</p>
                  <p className="text-[var(--muted)]">
                    Bad at the first order and bad at the ones after it. Most
                    decisions aren&rsquo;t this clean; this one is. The only thing
                    to check is whether you&rsquo;ve talked yourself into a
                    first-order cost by imagining a payoff you didn&rsquo;t actually
                    write down.
                  </p>
                </>
              )}
            </div>

            {/* Lens: people adapt */}
            {inp.peopleAdapt ? (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Because people adapt
                </p>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                  A rule that assumes everyone keeps behaving the way they did
                  before the rule is a rule that has already failed. The bounty
                  breeds rats; the metric gets gamed; the price you set moves the
                  behaviour you were pricing. Trace not just what happens, but{" "}
                  <em>what people will do about what happens</em> — that response
                  is usually the effect that actually decides it. See{" "}
                  <Link
                    href="/models#goodharts-law"
                    className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                  >
                    Goodhart&rsquo;s Law
                  </Link>
                  .
                </p>
              </div>
            ) : null}

            {/* Lens: competitive arena */}
            {inp.competitive ? (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Because it&rsquo;s competitive
                </p>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                  In a competitive arena the first-order conclusion is already
                  priced in — everyone who can see the obvious has seen it, and
                  whatever edge lived in it has been competed away. Howard
                  Marks&rsquo;s second-level thinking: the opportunity, if there is
                  one, lives only in the gap between what&rsquo;s true and what
                  everyone believes is true. If your reason is the first-order one,
                  assume it&rsquo;s in the price.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ---- Onward ---- */}
      {verdict.kind !== "need-more" ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            What to do with what you found
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <span className="text-[var(--foreground)]">Guard the effect you almost missed.</span>{" "}
              A later consequence you can name is something you can watch for. Set
              it as a tripwire — a signal and a date — in the{" "}
              <Link
                href="/premortem"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                pre-mortem room
              </Link>
              , so the version of you who crosses the line is warned by the version
              who saw it coming.
            </li>
            {laterHasDownside ? (
              <li>
                <span className="text-[var(--foreground)]">If it&rsquo;s an either/or, that later cost is your downside.</span>{" "}
                Take the first-order gain and the later cost to the{" "}
                <Link
                  href="/weigh"
                  className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                >
                  flip point
                </Link>{" "}
                and see how sure you&rsquo;d have to be for the move to still pay.
              </li>
            ) : null}
            <li>
              <span className="text-[var(--foreground)]">Put the call on the record.</span>{" "}
              If you go ahead, log what you expect in the{" "}
              <Link
                href="/decide"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                decision journal
              </Link>{" "}
              — including the second-order effect you&rsquo;re betting won&rsquo;t
              bite — and let reality grade it.
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The worked example, rendered read-only. It shows a finished trace — the three
 * effects, each tagged, the sign trail, and the reversal it exposes — for a
 * fixed scenario, reusing SignTrail so it can't drift from the live drawing. It
 * writes nothing: no state, no storage, no fields touched.
 */
function TraceExample() {
  const chain = [
    { order: 1, sign: "better" as Sign },
    { order: 2, sign: "worse" as Sign },
    { order: 3, sign: "worse" as Sign },
  ];
  const orders = [
    { badge: "First-order", text: EXAMPLE.first, sign: "better" as const },
    { badge: "And then what?", text: EXAMPLE.second, sign: "worse" as const },
    { badge: "And then what, again?", text: EXAMPLE.third, sign: "worse" as const },
  ];
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{EXAMPLE.move}</span>
      </p>
      <ol className="mt-4 space-y-3">
        {orders.map((o) => (
          <li key={o.badge} className="text-sm leading-relaxed">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              {o.badge}
            </span>
            <span
              className={`ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium align-middle ${
                o.sign === "better"
                  ? "bg-[var(--accent)] text-[var(--background)]"
                  : "bg-[var(--foreground)] text-[var(--background)]"
              }`}
            >
              {o.sign}
            </span>
            <span className="mt-1 block text-[var(--muted)]">{o.text}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The shape of this chain
        </p>
        <SignTrail chain={chain} />
        <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          The sign flips here
        </p>
        <p className="mt-1.5 text-sm text-[var(--foreground)] leading-relaxed">
          The effect you&rsquo;re doing it for isn&rsquo;t the one that lasts: the
          money and the buzz arrive first, the cost to everything the money was
          for arrives later. First-order win, later loss — the trap. The part you
          like is the part that reverses.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own trace below is blank — name the move you actually came here to
        follow.
      </p>
    </div>
  );
}

/**
 * One order in the chain: a labelled textarea plus a better/worse sign toggle.
 * Children (the lenses) render between the field and the toggle on order 2.
 */
function OrderBlock({
  n,
  badge,
  prompt,
  value,
  onText,
  sign,
  onSign,
  placeholder,
  optional,
  children,
}: {
  n: number;
  badge: string;
  prompt: string;
  value: string;
  onText: (v: string) => void;
  sign: Sign;
  onSign: (s: Sign) => void;
  placeholder: string;
  optional?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <div className="flex items-baseline gap-3">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-xs font-semibold text-[var(--muted)] tabular-nums"
          aria-hidden
        >
          {n}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            {badge}
            {optional ? (
              <span className="ml-2 font-normal normal-case tracking-normal">(optional)</span>
            ) : null}
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{prompt}</p>
      <textarea
        value={value}
        onChange={(e) => onText(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`mt-3 ${inputClass} resize-y`}
      />
      {children}
      <div className="mt-4">
        <p className="text-xs font-medium text-[var(--muted)] mb-2">
          Is this better or worse for what you actually want?
        </p>
        <div className="inline-flex rounded-lg border border-[var(--border)] overflow-hidden">
          <button
            type="button"
            onClick={() => onSign("better")}
            aria-pressed={sign === "better"}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              sign === "better"
                ? "bg-[var(--accent)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Better
          </button>
          <button
            type="button"
            onClick={() => onSign("worse")}
            aria-pressed={sign === "worse"}
            className={`px-3 py-1.5 text-sm font-medium border-l border-[var(--border)] transition-colors ${
              sign === "worse"
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Worse
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The chain, drawn: one chip per traced order, coloured by sign, so the
 * trajectory (and any flip) is legible at a glance.
 */
function SignTrail({
  chain,
}: {
  chain: { order: number; sign: Sign }[];
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {chain.map((o, i) => (
        <span key={o.order} className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              o.sign === "better"
                ? "bg-[var(--accent)] text-[var(--background)]"
                : "bg-[var(--foreground)] text-[var(--background)]"
            }`}
          >
            <span className="opacity-70">#{o.order}</span>
            {o.sign === "better" ? "better" : "worse"}
          </span>
          {i < chain.length - 1 ? (
            <span className="text-[var(--muted)]" aria-hidden>
              →
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
