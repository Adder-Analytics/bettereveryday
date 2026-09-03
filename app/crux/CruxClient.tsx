"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import PrintButton from "../components/PrintButton";

/**
 * Where do you actually disagree? (/crux)
 *
 * The instrument for a shared decision two people can't agree on. Almost the
 * entire kit is for a decision you make alone — it checks your options, your
 * odds, your confidence, your framing, the incentives of the person advising
 * you. But some of the hardest calls are joint: a partner, a cofounder, family,
 * a colleague, and you're deadlocked. Nothing in the toolkit met that shape, and
 * it's one of the most common hard-decision shapes there is.
 *
 * The core idea is a taxonomy, not a mood-fix: a genuine disagreement between two
 * reasonable people almost always traces to one of three roots, and each has a
 * *different* resolution —
 *   - FACTS: you'd agree on what to do if you agreed on what's true / what will
 *     happen. Evidence settles it, not more arguing. The move is to find the
 *     crux — the fact that, if it went the other way, would change a mind — and
 *     go get it (or bet on it, which forces a real probability out of each side).
 *   - VALUES: you want different things, or weight them differently. No fact will
 *     ever settle it, so arguing facts is the trap. The move is a *legitimate
 *     procedure* you both accept — whose call is it, make the weights explicit,
 *     or find the third option that serves both.
 *   - RISK: you agree on the facts and the goals; you draw the line on acceptable
 *     downside in different places. The move isn't to split the odds (you agree
 *     on those) — it's to look at the worst case together and ask whether you'd
 *     both survive it, which turns "brave vs. scared" into a shared question with
 *     an answer.
 * When it's tangled (the usual case), the single most useful act is to separate
 * the strands before arguing another round — because mixing them is *why* the
 * argument goes in circles.
 *
 * The double-crux move (the "tell"): each of you names the one thing that, if it
 * went the other way, would change your mind. If you both have one, that's where
 * the real argument is. If only you do, their "fact" claim is probably standing
 * in for a value. If neither does, it was never a facts fight, whatever it felt
 * like — which is the diagnostic doing its job.
 *
 * The site's signature discipline throughout: it's a private worksheet, so you
 * fill in your side *and* your honest account of theirs (perspective-taking as an
 * instrument, not couples therapy), it refuses the lecture and keeps the rigor,
 * and every read routes *out* to the tool that finishes that branch — /enough and
 * /test for a fact, /compare and /widen for a values split, /ruin and /doors for a
 * risk gap, /cool and /advise when you can't see it straight. Nothing is sent
 * anywhere; inputs persist in the browser. There's no forecast to log — sorting a
 * disagreement isn't a prediction — only the handoff.
 */

const STORE_KEY = "crux:v1";

/** What the disagreement is actually about, once the heat is stripped out —
 *  the decisive fork. */
type Root = "" | "facts" | "values" | "risk" | "cant";
/** The double-crux read: who can name the thing that would change their mind. */
type Tell = "" | "both" | "mine" | "neither";

type Inputs = {
  /** The decision the two of you are trying to make. Carries as the subject. */
  decision: string;
  /** Who's on the other side of it. */
  other: string;
  /** What you want to do, in a line. */
  youWant: string;
  /** What they want to do, in your honest account. */
  theyWant: string;
  /** The root of the disagreement. */
  root: Root;
  /** Whether each of you can name what would change your mind. */
  tell: Tell;
};

const BLANK: Inputs = {
  decision: "",
  other: "",
  youWant: "",
  theyWant: "",
  root: "",
  tell: "",
};

function isRoot(v: unknown): v is Root {
  return (
    v === "" ||
    v === "facts" ||
    v === "values" ||
    v === "risk" ||
    v === "cant"
  );
}
function isTell(v: unknown): v is Tell {
  return v === "" || v === "both" || v === "mine" || v === "neither";
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      other: typeof v.other === "string" ? v.other : BLANK.other,
      youWant: typeof v.youWant === "string" ? v.youWant : BLANK.youWant,
      theyWant: typeof v.theyWant === "string" ? v.theyWant : BLANK.theyWant,
      root: isRoot(v.root) ? v.root : BLANK.root,
      tell: isTell(v.tell) ? v.tell : BLANK.tell,
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

export default function CruxClient() {
  const [inp, setInp] = useState<Inputs>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    const loaded = loadInputs();
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

  const decision = inp.decision.trim();
  const other = inp.other.trim();
  const youWant = inp.youWant.trim();
  const theyWant = inp.theyWant.trim();
  const positionsIn = Boolean(decision && other && youWant && theyWant);

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
        {showExample ? <CruxExample /> : null}
      </div>

      {/* ---- The decision and the two positions ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are the two of you trying to decide?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Whether to move to another city for my partner's job offer"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
          onClear={() => {
            set("decision", "");
            setCarriedSeed("");
          }}
        />

        {decision ? (
          <div className="mt-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              Who&rsquo;s on the other side of it?
            </label>
            <input
              type="text"
              value={inp.other}
              onChange={(e) => set("other", e.target.value)}
              placeholder="e.g. My partner"
              className={inputClass}
            />
          </div>
        ) : null}

        {decision && other ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
                What you want to do
              </label>
              <textarea
                value={inp.youWant}
                onChange={(e) => set("youWant", e.target.value)}
                rows={3}
                placeholder="In a line — the thing you keep coming back to."
                className={`${inputClass} resize-y`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
                What {other || "they"} want to do
              </label>
              <textarea
                value={inp.theyWant}
                onChange={(e) => set("theyWant", e.target.value)}
                rows={3}
                placeholder="Their side, put as fairly as you can — as they'd put it."
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>
        ) : null}

        {decision && other ? (
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            Write their side as <em>they&rsquo;d</em>{" "}put it, not as it sounds
            when you&rsquo;re losing the argument. If you can&rsquo;t state it so
            they&rsquo;d agree &ldquo;yes, that&rsquo;s what I mean,&rdquo; that
            gap is often the whole problem &mdash; and naming it is the first work.
          </p>
        ) : null}
      </div>

      {/* ---- The diagnostic gate ---- */}
      {positionsIn ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            Strip out the heat. What are you actually disagreeing about?
          </p>
          <p className="mb-3 text-sm text-[var(--muted)] leading-relaxed">
            The whole question &mdash; because each of these three has a different
            way out, and arguing one as if it were another is how you end up going
            in circles. Pick the one that&rsquo;s carrying the most weight.
          </p>
          <div className="flex flex-col gap-2">
            {(
              [
                [
                  "facts",
                  "What's true — or what will happen",
                  "We'd agree on what to do if we agreed on the facts: a number, a prediction, what actually happened. Evidence would settle it.",
                ],
                [
                  "values",
                  "What matters — what we each want",
                  "We want different things, or weight them differently. No fact would settle it; we're aiming at different goals.",
                ],
                [
                  "risk",
                  "How much risk is okay",
                  "We agree on the facts and on what matters — we just draw the line on acceptable downside in different places.",
                ],
                [
                  "cant",
                  "Honestly, I can't tell — it's all tangled",
                  "It's heated and mixed together; I can't yet separate what's a fact, what's a value, and what's about risk.",
                ],
              ] as [Root, string, string][]
            ).map(([val, label, detail]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("root", inp.root === val ? "" : val)}
                className={`${chipBase} ${inp.root === val ? chipOn : chipOff}`}
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

      {/* ---- The tell: the double-crux question ---- */}
      {positionsIn && inp.root !== "" ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            Can each of you name the one thing that would change your mind?
          </p>
          <p className="mb-3 text-sm text-[var(--muted)] leading-relaxed">
            This is the crux question: not &ldquo;why are you right&rdquo; but
            &ldquo;what would have to be true for you to switch sides?&rdquo; If
            you both have an answer, that&rsquo;s where the real argument is.
          </p>
          <div className="flex flex-col gap-2">
            {(
              [
                [
                  "both",
                  "Yes — I have one, and I think they do too",
                  "We can each point to the thing that would flip us. We just haven't compared them.",
                ],
                [
                  "mine",
                  "I have one — but I don't think anything would change theirs",
                  "I can say what would move me. When I imagine their side, nothing seems to.",
                ],
                [
                  "neither",
                  "Honestly, nothing would change mine either",
                  "If I'm honest, no fact or argument would move me off this. I suspect it's the same for them.",
                ],
              ] as [Tell, string, string][]
            ).map(([val, label, detail]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("tell", inp.tell === val ? "" : val)}
                className={`${chipBase} ${inp.tell === val ? chipOn : chipOff}`}
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

      {/* ---- The read + handoff ---- */}
      <Verdict inp={inp} />
    </div>
  );
}

function Verdict({ inp }: { inp: Inputs }) {
  const decision = inp.decision.trim();
  const other = inp.other.trim();
  const youWant = inp.youWant.trim();
  const theyWant = inp.theyWant.trim();
  const subject = inp.decision;

  if (!decision) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Name the decision, who&rsquo;s on the other side, and what each of you
          wants &mdash; and the read appears: which of the three disagreements
          you&rsquo;re really having, and the move that resolves that one instead
          of the two it isn&rsquo;t.
        </p>
      </div>
    );
  }

  if (!other) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Name who&rsquo;s on the other side above. A crux needs two positions to
          sit between.
        </p>
      </div>
    );
  }

  if (!youWant || !theyWant) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Write both positions &mdash; yours, and {other}&rsquo;s as fairly as you
          can put it. Stating the other side in a form they&rsquo;d accept is
          often the move that shrinks the gap before you&rsquo;ve sorted anything.
        </p>
      </div>
    );
  }

  if (inp.root === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Now the question that decides the rest: with the heat stripped out, what
          are you actually disagreeing about &mdash; a fact, a value, or how much
          risk is okay? Answer it above.
        </p>
      </div>
    );
  }

  if (inp.tell === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Last one: can each of you name what would change your mind? That&rsquo;s
          the tell &mdash; then the read turns into the move.
        </p>
      </div>
    );
  }

  return (
    <CruxRead
      root={inp.root}
      tell={inp.tell}
      other={other}
      subject={subject}
    />
  );
}

function CruxRead({
  root,
  tell,
  other,
  subject,
}: {
  root: Exclude<Root, "">;
  tell: Exclude<Tell, "">;
  other: string;
  subject: string;
}) {
  // ============ Facts — evidence settles it, so find the crux ============
  if (root === "facts") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          You&rsquo;re arguing a fact &mdash; so find the crux and go get it,
          don&rsquo;t keep debating it.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          If you&rsquo;d agree on the call once you agreed on what&rsquo;s true,
          then more argument is the wrong tool &mdash; evidence is the right one,
          and the two of you trading opinions will never produce it. The move is to
          find the <em>crux</em>: the single fact where, if it went the other way,
          at least one of you would change your mind. Everything else is noise
          around that one thing.
        </p>
        {tell === "both" ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            You both can name what would flip you &mdash; that&rsquo;s the clean
            case, and it&rsquo;s rarer than it should be. Put the two answers side
            by side. If they point at the same fact, you&rsquo;ve found the crux:
            stop arguing everything else and go settle just that. If they point at
            different facts, you&rsquo;ve found two cruxes &mdash; and probably a
            values or risk disagreement hiding underneath, since you&rsquo;re
            each weighing a different piece of evidence as decisive.
          </p>
        ) : tell === "mine" ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            You can name what would move you, but you don&rsquo;t think anything
            would move {other}. That&rsquo;s the tell that this isn&rsquo;t really
            a fact fight for them &mdash; a claim no evidence could change
            isn&rsquo;t a factual claim, it&rsquo;s a value or a fear wearing one.
            Ask them the crux question directly and gently: <em>&ldquo;what would
            have to be true for you to change your mind?&rdquo;</em>{" "}If the honest
            answer is &ldquo;nothing,&rdquo; re-sort the disagreement &mdash; the
            real one is below the facts.
          </p>
        ) : (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            But if nothing would change <em>your</em>{" "}mind either, then whatever
            this feels like, it isn&rsquo;t a disagreement about facts &mdash;
            because a fact is exactly the thing evidence <em>can</em>{" "}settle. When
            both sides are unmovable, the argument is about values or risk, and
            you&rsquo;re dressing it as facts because facts feel more winnable.
            Go back and re-sort it; the read you need is one of the others.
          </p>
        )}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Settle the fact &mdash; don&rsquo;t keep relitigating it
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)] leading-relaxed list-disc pl-5">
            <li>
              <span className="text-[var(--foreground)]">Go get the evidence</span>{" "}
              &mdash; the cheapest real test, a source you both already trust, a
              small experiment that produces the fact instead of another opinion
              about it.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Bet on it</span>{" "}&mdash; a
              concrete wager (even a small one) forces each of you to put a real
              probability on your claim. Someone who won&rsquo;t bet didn&rsquo;t
              believe it as hard as the argument sounded, and that alone often ends
              it.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Ask if it even matters</span>{" "}
              &mdash; before spending days resolving the fact, check whether it
              would actually change the decision. If you&rsquo;d make the same call
              either way, the fight is moot.
            </li>
          </ul>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/enough", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Is the fact even worth resolving? &rarr;
              </Link>{" "}
              Run the value-of-information test first: name the fact, say what
              each of you would do under each way it lands, and if the call is the
              same either way, you&rsquo;ve been fighting over something that
              doesn&rsquo;t change the answer.
            </li>
            <li>
              <Link
                href={withSubject("/test", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Design the cheapest test that settles it &rarr;
              </Link>{" "}
              If the fact would move the call, don&rsquo;t predict it together
              &mdash; find the smallest real experiment that produces the evidence,
              so reality breaks the tie instead of whoever argues longest.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ============ Values — no fact settles it, so pick a fair procedure ============
  if (root === "values") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          No fact will settle this &mdash; so stop arguing facts and pick a fair
          way to decide.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          This is the disagreement people waste the most time on, because it wears
          the costume of a factual argument. You keep trading evidence, and it
          keeps not working &mdash; because no evidence was ever going to move it.
          You and {other}{" "}want different things, or weight the same things
          differently, and that&rsquo;s not a mistake either of you can be argued
          out of. The relief is in naming it: once you both see it&rsquo;s a values
          split, you can stop trying to <em>win</em>{" "}and start trying to{" "}
          <em>decide</em>.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          What a values split needs isn&rsquo;t agreement &mdash; it&rsquo;s a{" "}
          <em>legitimate procedure</em>, one you both accept in advance because
          it&rsquo;s fair, not because it happens to give you the answer you
          wanted. Three that work:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)] leading-relaxed list-disc pl-5">
          <li>
            <span className="text-[var(--foreground)]">Whose call is it?</span>{" "}
            &mdash; usually one of you bears the cost or lives with the result
            more. Let the person with the most at stake in <em>this</em>{" "}decision
            decide it &mdash; and trade honestly: they take this one, you take the
            next one that&rsquo;s yours to live with.
          </li>
          <li>
            <span className="text-[var(--foreground)]">Make the weights explicit</span>{" "}
            &mdash; you probably don&rsquo;t disagree about the options, but about
            how much one thing counts. Score them on the criteria you both name and
            the real split becomes visible: it&rsquo;s one weight, not the whole
            choice, and naming it makes the trade honest instead of a tug of war.
          </li>
          <li>
            <span className="text-[var(--foreground)]">Find the third option</span>{" "}
            &mdash; a values clash on two options often has a third neither of you
            named that gives each of you the thing you actually care about. The
            deadlock is a sign you&rsquo;ve narrowed the frame to two.
          </li>
        </ul>
        {tell === "neither" ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            You said nothing would change either mind &mdash; which confirms this
            read. That&rsquo;s not stubbornness; it&rsquo;s the signature of a real
            values difference, and it&rsquo;s exactly why no amount of arguing has
            worked. Don&rsquo;t treat the immovability as a problem to break down.
            Treat it as the thing to build a fair procedure around.
          </p>
        ) : tell === "mine" ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            You can name what would change your mind but don&rsquo;t think{" "}
            {other}{" "}can &mdash; worth checking whether your own &ldquo;crux&rdquo;
            is really a value in disguise too. On a genuine values split, neither
            side usually has a fact that would flip them, and that&rsquo;s fine.
            The work isn&rsquo;t to find one; it&rsquo;s to agree how you&rsquo;ll
            decide without one.
          </p>
        ) : (
          <p className="mt-3 pl-3 border-l-2 border-[var(--muted)] text-sm text-[var(--muted)] leading-relaxed">
            You both named something that would change your mind &mdash; so make
            sure this really is a values split and not a fact one. If those
            mind-changers are actually facts, go run the fact read instead; if
            they turn out to be &ldquo;I&rsquo;d switch if it mattered more to
            you than to me,&rdquo; that&rsquo;s a value, and you&rsquo;re in the
            right place.
          </p>
        )}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Make the trade honest, or open the frame
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/compare", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Make the weights explicit &rarr;
              </Link>{" "}
              Score the options one factor at a time. You&rsquo;ll usually find you
              agree on almost every factor and split on exactly one weight &mdash;
              which turns a whole-choice standoff into a single, nameable trade.
            </li>
            <li>
              <Link
                href={withSubject("/widen", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Find the option that serves both &rarr;
              </Link>{" "}
              A two-way deadlock is a narrowed frame. Widen it and look for the
              third choice that gives each of you the thing you actually care
              about &mdash; the one neither side proposed because you were busy
              defending your own.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ============ Risk — same facts, same goals, different tolerance ============
  if (root === "risk") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          You agree on everything but the size of the bet &mdash; so size the
          downside together, not the odds.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Same facts, same goals &mdash; you just draw the line on acceptable
          downside in different places. One of you is looking at an opportunity and
          the other at a risk, and you&rsquo;re both looking at the same thing.
          That&rsquo;s why it curdles into character (&ldquo;you&rsquo;re
          reckless&rdquo; / &ldquo;you&rsquo;re a coward&rdquo;): it feels
          personal because it isn&rsquo;t about any fact you could check. The move
          isn&rsquo;t to split the difference on the odds &mdash; you already agree
          on those &mdash; it&rsquo;s to look at the worst case <em>together</em>{" "}
          and ask the one question that turns it from a temperament clash into a
          decision: if it went as badly as it realistically could, could you both
          live with it?
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)] leading-relaxed list-disc pl-5">
          <li>
            <span className="text-[var(--foreground)]">If the worst case is
            survivable</span>{" "}&mdash; the cautious one can afford to let it run.
            Cap the downside where you can, agree the line, and go. The fear was
            real but the stakes clear it.
          </li>
          <li>
            <span className="text-[var(--foreground)]">If it isn&rsquo;t</span>{" "}
            &mdash; the cautious one is right, and no upside justifies it, because
            there&rsquo;s no &ldquo;on average&rdquo; for the version of you
            that&rsquo;s out of the game. Don&rsquo;t drop the ambition &mdash;
            find the version of the same move whose worst case you&rsquo;d both
            survive.
          </li>
          <li>
            <span className="text-[var(--foreground)]">Settle reversibility
            first</span>{" "}&mdash; a risk fight is often really a hidden
            disagreement about whether this is a one-way door. If it can be undone,
            the stakes shrink and so does the argument.
          </li>
        </ul>
        {tell === "mine" || tell === "neither" ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            Since not everyone here can name what would change their mind, run the
            survival check out loud, together &mdash; it gives the argument the one
            thing temperament can&rsquo;t: a shared, answerable question. &ldquo;Is
            the worst case survivable?&rdquo; has a yes or a no, and it belongs to
            both of you, not to whoever is braver or more anxious by nature.
          </p>
        ) : (
          <p className="mt-3 pl-3 border-l-2 border-[var(--muted)] text-sm text-[var(--muted)] leading-relaxed">
            You both can name what would change your mind &mdash; good; that means
            the survival check below can actually move you. Do it together and
            let the answer, not the temperament, set the line.
          </p>
        )}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Answer the shared question
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/ruin", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Run the survival check together &rarr;
              </Link>{" "}
              Name the worst realistic outcome and ask whether you&rsquo;d both
              recover from it. That single question resolves most risk-tolerance
              splits &mdash; and where it says &ldquo;no,&rdquo; it says so for
              both of you.
            </li>
            <li>
              <Link
                href={withSubject("/doors", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Settle whether it&rsquo;s even reversible &rarr;
              </Link>{" "}
              Sort it into a one-way or two-way door. If you can walk it back, the
              downside the cautious one fears is smaller than it looks &mdash; and
              much of the disagreement was really about this, unspoken.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ============ Can't tell — separate the strands first ============
  return (
    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        The read
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        First untangle it &mdash; sort the disagreement into facts, values, and
        risk before you argue another round.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        The most common reason a disagreement won&rsquo;t resolve is that
        it&rsquo;s actually three disagreements knotted together, and you keep
        pulling on all three at once. You make a factual point, {other}{" "}answers
        with a value, you counter with a worry about risk &mdash; and every move
        lands on a different strand, so nothing ever closes. The single most useful
        thing you can do is stop and separate them, because each strand has a
        different way out and mixing them is <em>why</em>{" "}it goes in circles.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Take your two positions and, out loud or on paper, split the gap into its
        parts:
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)] leading-relaxed list-disc pl-5">
        <li>
          <span className="text-[var(--foreground)]">What&rsquo;s a fact?</span>{" "}
          &mdash; anything you disagree about that evidence could settle: a number,
          a prediction, what happened. That part gets tested, not argued.
        </li>
        <li>
          <span className="text-[var(--foreground)]">What&rsquo;s a value?</span>{" "}
          &mdash; anything where you simply want different things. That part
          gets a fair procedure, not more evidence.
        </li>
        <li>
          <span className="text-[var(--foreground)]">What&rsquo;s about risk?</span>{" "}
          &mdash; anything where you agree on the facts and the goal but not on how
          much downside is okay. That part gets a survival check.
        </li>
      </ul>
      {tell === "neither" ? (
        <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
          One shortcut: you said nothing would change either mind. That&rsquo;s a
          strong sign the load-bearing strand is <em>values</em>, not facts
          &mdash; because facts are the strand evidence <em>could</em>{" "}move. Start
          your sorting there.
        </p>
      ) : (
        <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
          Use the crux question to sort fast: each of you names the one thing
          that would change your mind. If you both can and it&rsquo;s a checkable
          fact, that&rsquo;s the facts strand &mdash; start there. If your
          mind-changers turn out to be &ldquo;nothing&rdquo; or &ldquo;if it
          mattered more to you,&rdquo; you&rsquo;re looking at a value.
        </p>
      )}
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Then come back and run the strand that&rsquo;s carrying the weight
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Sort the gap, pick the strand doing the most work, and re-run the
          question above &mdash; you&rsquo;ll land on the fact, value, or risk read
          and its handoff. If the heat itself is the problem, clear it first:
        </p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link
              href={withSubject("/cool", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              If it&rsquo;s too hot to sort, cool it first &rarr;
            </Link>{" "}
            You can&rsquo;t separate the strands mid-argument. Settle whether this
            even has to be decided right now, and get the distance to see it
            straight before you try again.
          </li>
          <li>
            <Link
              href={withSubject("/advise", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Can&rsquo;t see your own side straight? &rarr;
            </Link>{" "}
            Put the whole dispute to a friend in your head &mdash; what would you
            tell someone else caught in exactly this? The distance often reveals
            which strand you&rsquo;ve been overweighting.
          </li>
        </ul>
      </div>
      <PrintNote />
    </div>
  );
}

/** The keep-a-copy affordance, shown under a real read. Matches the siblings. */
function PrintNote() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <PrintButton label="Print / Save as PDF" />
    </div>
  );
}

/**
 * The worked example, rendered read-only. Walks the canonical joint decision — a
 * couple weighing a move for one partner's job — and shows the whole point: what
 * looks like one circular argument is three disagreements with three different
 * resolutions. Nothing lands in the person's own fields or storage.
 */
function CruxExample() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example &mdash; nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        You want to take a job offer in another city. Your partner doesn&rsquo;t
        want to move. You&rsquo;ve had the argument five times and it always ends
        the same way &mdash; because it feels like one disagreement, and it&rsquo;s
        three.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4 space-y-3">
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">The fact strand:</span>{" "}&ldquo;Is the job
          market there actually better for you?&rdquo; That&rsquo;s checkable
          &mdash; so check it, don&rsquo;t keep asserting it at each other.
        </p>
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">The values strand:</span>{" "}you weight
          career growth; they weight being near family. No fact settles that
          &mdash; it needs a fair procedure: whose turn is it, or a city that
          offers a version of both.
        </p>
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">The risk strand:</span>{" "}you think
          &ldquo;we can always move back&rdquo;; they think uprooting the
          kids&rsquo; school is a one-way door. Settle <em>that</em>{" "}&mdash; how
          reversible is it, really? &mdash; and the fear gets specific instead of
          total.
        </p>
      </div>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        The move isn&rsquo;t to win the argument. It&rsquo;s to notice you were
        having three, and give each the thing it needs: the job market{" "}
        <em>gets checked</em>, the family-vs-career split <em>gets a
        procedure</em>, and the &ldquo;can we move back&rdquo; question{" "}
        <em>gets a reversibility read</em>. Three tractable questions instead of
        one circular fight. That&rsquo;s the whole discipline:{" "}
        <span className="font-medium">separate the strands, then resolve each on
        its own terms.</span>
      </p>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank &mdash; run it on <em>your</em>{" "}
        disagreement.
      </p>
    </div>
  );
}
