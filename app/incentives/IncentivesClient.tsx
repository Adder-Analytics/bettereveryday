"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import PrintButton from "../components/PrintButton";

/**
 * Who gains if you say yes? (/incentives)
 *
 * The instrument that runs Munger's "show me the incentive and I'll show you the
 * outcome" on a recommendation you've been handed. It's the sibling of /test one
 * surface over: /test interrogates your *own* reasoning for what would prove it
 * wrong; this one interrogates the reasoning you were *given* — by someone who
 * gains from your yes — for how much of it is the advice and how much is the
 * incentive. Neither is about the odds or the options; both are about the
 * reliability of an input before you weigh it.
 *
 * The core distinction is alignment vs. divergence. When the messenger wins only
 * when you win (skin in the same game, paid on your outcome, a real fiduciary),
 * their incentive is on your side and the recommendation can be weighed on its
 * merits. When they win whether or not you do (a commission, a quota, a
 * fee-per-transaction, keeping you as a customer), the advice is worth exactly
 * what it would be worth from someone who *didn't* get paid for your yes — so you
 * discount it to its incentive-free core. The useful move on the diverged side is
 * never "distrust everyone": it's to get the same recommendation from someone
 * paid differently, or to change the structure so their pay tracks your outcome —
 * a margin of safety applied to the people you take advice from.
 *
 * The flow keeps the rigor and refuses the cynicism:
 *   1. Name the decision (carries as the subject across the kit).
 *   2. Name the messenger and — concretely — what they gain from your yes.
 *      Writing the gain down is the move: it's the thing people feel but don't
 *      make explicit, and it's invisible until it isn't.
 *   3. The alignment gate: when your interests and theirs pull apart, who does
 *      this recommendation serve? aligned / diverged / partly / can't-tell. This
 *      is the decisive fork.
 *   4. The tell: picture the exact moment your best interest is their loss — what
 *      would they do there? It modulates each gate: a diverged structure with a
 *      person who'd still steer you right is a trustworthy person inside a bad
 *      structure; an "aligned" one whose person would push their way is a claimed
 *      alignment that isn't structural.
 *
 * The reads route the position rather than issuing a verdict on the person.
 * Aligned routes *out* to /weigh and /test — the incentive isn't the problem, so
 * decide on the merits. Diverged routes to /widen (the options an incentivized
 * messenger never names — the ones they don't get paid for) and /test. Nothing is
 * sent anywhere; inputs persist in the browser. There's no forecast to log — a
 * check on a source isn't a prediction — only the handoff.
 */

const STORE_KEY = "incentives:v1";

/** When your interests and the messenger's pull apart, whose side is the
 *  recommendation on — the decisive fork. */
type Align = "" | "aligned" | "diverged" | "partly" | "cant";
/** What you'd expect them to do at the exact point your good is their loss. */
type Tell = "" | "yours" | "theirs" | "unknown";

type Inputs = {
  /** The decision — what you're being urged toward. Carries as the subject. */
  decision: string;
  /** Who's giving the recommendation. */
  messenger: string;
  /** What the messenger gains if you say yes, concretely. */
  gain: string;
  /** Whose side the incentive is on. */
  align: Align;
  /** What they'd do at the point of divergence. */
  tell: Tell;
};

const BLANK: Inputs = {
  decision: "",
  messenger: "",
  gain: "",
  align: "",
  tell: "",
};

function isAlign(v: unknown): v is Align {
  return (
    v === "" ||
    v === "aligned" ||
    v === "diverged" ||
    v === "partly" ||
    v === "cant"
  );
}
function isTell(v: unknown): v is Tell {
  return v === "" || v === "yours" || v === "theirs" || v === "unknown";
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      messenger: typeof v.messenger === "string" ? v.messenger : BLANK.messenger,
      gain: typeof v.gain === "string" ? v.gain : BLANK.gain,
      align: isAlign(v.align) ? v.align : BLANK.align,
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

export default function IncentivesClient() {
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
  const messenger = inp.messenger.trim();
  const gain = inp.gain.trim();

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
        {showExample ? <IncentivesExample /> : null}
      </div>

      {/* ---- The decision ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you being urged toward?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Move my savings into the fund my adviser is recommending"
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
              Who&rsquo;s recommending it?
            </label>
            <input
              type="text"
              value={inp.messenger}
              onChange={(e) => set("messenger", e.target.value)}
              placeholder="e.g. My financial adviser"
              className={inputClass}
            />
          </div>
        ) : null}

        {decision && messenger ? (
          <div className="mt-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              What do they gain if you say yes?
            </label>
            <p className="mb-2 text-sm text-[var(--muted)] leading-relaxed">
              Be concrete, and don&rsquo;t stop at money &mdash; a commission or a
              fee, yes, but also a quota met, a client kept, a target hit, status,
              a favour owed, an awkward conversation avoided. Writing it down is
              the move: it&rsquo;s the thing you can feel but rarely make explicit.
            </p>
            <textarea
              value={inp.gain}
              onChange={(e) => set("gain", e.target.value)}
              rows={3}
              placeholder="e.g. A trailing commission on the fund every year I hold it — paid to them whether or not it beats a plain index."
              className={`${inputClass} resize-y`}
            />
          </div>
        ) : null}
      </div>

      {/* ---- The alignment gate ---- */}
      {decision && messenger && gain ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            When your interests and theirs pull apart, whose side is the
            recommendation on?
          </p>
          <p className="mb-3 text-sm text-[var(--muted)] leading-relaxed">
            The whole question. Not whether they&rsquo;re a good person &mdash;
            how they get <em>paid</em>. Do they win only when you win, or win
            either way?
          </p>
          <div className="flex flex-col gap-2">
            {(
              [
                [
                  "aligned",
                  "They win only if I win",
                  "Paid on my outcome, skin in the same game, a real fiduciary — if this goes badly for me, it goes badly for them too.",
                ],
                [
                  "diverged",
                  "They win whether or not I do",
                  "A commission, a quota, a fee on the transaction, keeping me as a customer — they get paid for the yes, and the yes is theirs either way.",
                ],
                [
                  "partly",
                  "Partly — aligned on the big thing, not on the details",
                  "They do better when I do well, but they also do better if I buy sooner, bigger, or the option that happens to pay them more.",
                ],
                [
                  "cant",
                  "Honestly, I don't know how they're paid",
                  "I've never actually found out what they get out of my choosing one way over another.",
                ],
              ] as [Align, string, string][]
            ).map(([val, label, detail]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("align", inp.align === val ? "" : val)}
                className={`${chipBase} ${inp.align === val ? chipOn : chipOff}`}
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

      {/* ---- The tell ---- */}
      {decision && messenger && gain && inp.align !== "" ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            Picture the exact moment your best move would cost them. What do you
            expect them to do?
          </p>
          <p className="mb-3 text-sm text-[var(--muted)] leading-relaxed">
            The case where what&rsquo;s best for you is the worst thing for their
            pay &mdash; the cheaper option, the &ldquo;actually, don&rsquo;t,&rdquo;
            the walk-away. This is the tell that structure alone can&rsquo;t give
            you.
          </p>
          <div className="flex flex-col gap-2">
            {(
              [
                [
                  "yours",
                  "Steer me right — even at their own cost",
                  "I've seen them leave money on the table for me, or send me somewhere they don't get paid.",
                ],
                [
                  "theirs",
                  "Push their way — or go quiet about the better option",
                  "They'd nudge me toward what pays them, and the option that doesn't just wouldn't come up.",
                ],
                [
                  "unknown",
                  "I genuinely don't know — I've never seen them at that fork",
                  "The relationship's never been tested at the point where our interests split.",
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
  const messenger = inp.messenger.trim();
  const gain = inp.gain.trim();
  const subject = inp.decision;

  // ---- Nothing to read yet ----
  if (!decision) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Name the call, who&rsquo;s pushing it, and what they get out of your yes,
          and the read appears: whether the incentive is on your side &mdash; in
          which case you can weigh the advice on its merits &mdash; or pulling
          against you, in which case you subtract it and get the version from
          someone paid differently.
        </p>
      </div>
    );
  }

  if (!messenger) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Name who&rsquo;s recommending it above. The check only means something
          once there&rsquo;s a messenger whose incentive you can look at.
        </p>
      </div>
    );
  }

  if (!gain) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Write down what they gain from your yes. Naming it plainly is half the
          work &mdash; an incentive you can&rsquo;t see is one you can&rsquo;t
          subtract.
        </p>
      </div>
    );
  }

  if (inp.align === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Now the one question that decides the rest: when your interests and
          theirs pull apart, whose side is the recommendation on? Answer it above.
        </p>
      </div>
    );
  }

  if (inp.tell === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Last one: at the exact point your best move would cost them, what would
          they do? That&rsquo;s the tell &mdash; then the read turns into the move.
        </p>
      </div>
    );
  }

  return (
    <IncentiveRead
      align={inp.align}
      tell={inp.tell}
      messenger={messenger}
      gain={gain}
      subject={subject}
    />
  );
}

/** A short quotation of the named gain, so the read speaks to the actual stake. */
function GainQuote({ gain }: { gain: string }) {
  return (
    <span className="text-[var(--foreground)]">
      &ldquo;{gain.length > 140 ? `${gain.slice(0, 140).trimEnd()}…` : gain}
      &rdquo;
    </span>
  );
}

function IncentiveRead({
  align,
  tell,
  messenger,
  gain,
  subject,
}: {
  align: Exclude<Align, "">;
  tell: Exclude<Tell, "">;
  messenger: string;
  gain: string;
  subject: string;
}) {
  // ============ Aligned — the incentive is on your side ============
  if (align === "aligned") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          The incentive&rsquo;s on your side &mdash; weigh the advice on its
          merits.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          You said the gain is <GainQuote gain={gain} />, but that {messenger}{" "}
          wins only when you win. That&rsquo;s the strongest thing you can have in a
          source: their skin is in the same game as yours, so the advice and the
          incentive point the same way, and the reflex to discount it would just be
          throwing away good counsel. This isn&rsquo;t an incentive problem &mdash;
          it&rsquo;s an ordinary decision, and the move is to weigh it, not to
          second-guess the messenger.
        </p>
        {tell === "theirs" || tell === "unknown" ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            One catch worth pressing on, though: you called the structure aligned,
            but at the fork where your good would cost them you expect them to{" "}
            {tell === "theirs"
              ? "push their own way"
              : "you're not sure — you've never seen it"}
            . Those two don&rsquo;t sit together. &ldquo;We put clients
            first&rdquo; is a slogan; &ldquo;we&rsquo;re only paid when you
            profit&rdquo; is a structure &mdash; and if the person would tilt your
            way at their own expense only reluctantly, the alignment may be claimed
            rather than built into how they&rsquo;re actually paid. Check the
            structure once more before you lean on it: <em>exactly</em>{" "}how does
            their money change with your outcome?
          </p>
        ) : (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            The one thing to confirm: that the alignment is <em>structural</em>,
            not just claimed. &ldquo;We put clients first&rdquo; is a slogan;
            &ldquo;we&rsquo;re paid only when you profit&rdquo; is a structure. If
            you can point to the mechanism &mdash; paid on your result, holding the
            same position, on the hook if it fails &mdash; trust it. If you can
            only point to a promise, treat it as unproven and look again at how the
            money actually moves.
          </p>
        )}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            So decide it, don&rsquo;t discount it
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/weigh", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Weigh it on the merits &rarr;
              </Link>{" "}
              With the incentive off the table, this is a straight odds-against-
              stakes call. Find the flip point and judge which side of the line
              you&rsquo;re on.
            </li>
            <li>
              <Link
                href={withSubject("/test", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Still stress your own reasons &rarr;
              </Link>{" "}
              A trustworthy messenger can still be wrong. Now that you&rsquo;re not
              worried about their motive, check <em>your</em>{" "}case: what would prove
              this the wrong call, and have you looked for it?
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ============ Diverged — the incentive pulls against you ============
  if (align === "diverged") {
    const trusted = tell === "yours";
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Discount the advice to its incentive-free core.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The gain you named &mdash; <GainQuote gain={gain} /> &mdash; pays out
          whether or not the choice is good for you. That doesn&rsquo;t make{" "}
          {messenger}{" "}a liar, and it doesn&rsquo;t make the advice wrong. It means
          the advice is worth exactly what it would be worth coming from someone
          who <em>didn&rsquo;t</em>{" "}get paid for your yes &mdash; and the honest
          way to value it is to subtract the incentive and see what&rsquo;s left.
          Show me the incentive and I&rsquo;ll show you the outcome: when the
          reward is for the recommendation rather than for your result, the
          recommendation bends toward the reward, usually without anyone deciding
          to be dishonest.
        </p>
        {trusted ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            You do expect this one to steer you right even at their own cost
            &mdash; and that matters; a trustworthy person inside a bad structure
            is far better than a cynic inside a good one. But don&rsquo;t let it do
            the whole job. Relying on someone&rsquo;s virtue to overcome their own
            incentive works right up until the month it doesn&rsquo;t &mdash; a bad
            quarter, new management, a bigger target. Trust the person, and still
            fix the structure: the two aren&rsquo;t in competition.
          </p>
        ) : tell === "theirs" ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            And you expect them to push their own way at the fork &mdash; so the
            structure and the person point the same direction, away from you.
            That&rsquo;s the clean case for discounting hard: take the
            recommendation as a starting bid to be checked against an independent
            source, not as advice.
          </p>
        ) : (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            You&rsquo;ve never seen them at the fork where your good is their loss
            &mdash; so you can&rsquo;t lean on the person to offset the structure.
            Until you have, assume the incentive is doing the talking and get the
            independent read below.
          </p>
        )}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Don&rsquo;t distrust them &mdash; disarm the incentive
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            The move isn&rsquo;t to walk away or to assume you&rsquo;re being
            conned. It&rsquo;s to get to the same decision without the tilt:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)] leading-relaxed list-disc pl-5">
            <li>
              <span className="text-[var(--foreground)]">Get a second opinion
              from someone paid differently</span>{" "}&mdash; a fee-only version of
              the same expert, a friend with no stake, whoever loses nothing if you
              say no.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Change the structure</span>{" "}
              &mdash; a flat fee instead of a commission, paid-on-results, a
              fiduciary duty in writing &mdash; so their pay starts tracking your
              outcome instead of your yes.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Ask for the option they
              don&rsquo;t get paid for</span>{" "}&mdash; the index fund, the repair
              instead of the replacement, the do-nothing &mdash; and watch the
              reaction. What they say about that is more telling than the pitch.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Subtract the messenger</span>{" "}
              &mdash; ask whether you&rsquo;d want this if a stranger with nothing
              to gain had described it in plain terms. If the appeal was the push,
              not the merits, that&rsquo;s where it shows.
            </li>
          </ul>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/widen", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Find the options they never mentioned &rarr;
              </Link>{" "}
              An incentivized messenger frames the choice as their option versus
              nothing. Widen it to the alternatives they don&rsquo;t get paid for
              &mdash; the ones that were never going to come up on their own.
            </li>
            <li>
              <Link
                href={withSubject("/test", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Stress-test the case, minus their push &rarr;
              </Link>{" "}
              Now strip their reasons out and pressure-test your own: name what
              would prove this the wrong call and go looking for it, so you&rsquo;re
              not just inheriting a case someone was paid to build.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ============ Partly — aligned on the whole, diverged on a seam ============
  if (align === "partly") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Find the one seam where you split &mdash; and read the advice there.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          This is the common and slippery case: {messenger}{" "}broadly does better
          when you do well, so you relax &mdash; and then the incentive (
          <GainQuote gain={gain} />) quietly bends the <em>details</em>. The estate
          agent genuinely wants the sale, and also wants it <em>fast</em>{" "}and
          doesn&rsquo;t mind a lower price to get it. The doctor wants you well, and
          the procedure that pays is the one that comes to mind first. The advice
          is mostly good; the tilt lives in a specific dimension &mdash; how much,
          how soon, which version &mdash; and that&rsquo;s the only place you have
          to be sharp.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          So name the seam. On which one axis do their interests and yours point
          different ways &mdash; the price, the timing, the size, the specific
          product? Trust the shared direction, and put all your scrutiny on that
          single dimension: get an independent read <em>on that axis alone</em>,
          and treat their advice about it as a bid, not a verdict.
        </p>
        {tell === "theirs" || tell === "unknown" ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            And since you {tell === "theirs" ? "expect them to push their own way" : "haven't seen them at the fork"}{" "}
            when it comes to that split, don&rsquo;t assume goodwill carries you
            across it. The broad alignment is real; on the seam, treat it like the
            diverged case &mdash; verify it elsewhere.
          </p>
        ) : (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            You&rsquo;d expect them to steer you right even where it costs them
            &mdash; good. That earns them the benefit of the doubt on the shared
            direction. It still doesn&rsquo;t settle the seam on its own: name it
            and check it, because a decent person can hold an honest blind spot
            exactly where their pay is involved.
          </p>
        )}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Trust the direction, scrutinize the seam
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/trace", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Follow where the incentive leads &rarr;
              </Link>{" "}
              Trace the recommendation a step or two out &mdash; and then what?
              &mdash; to see where the detail they&rsquo;re nudging (the timing, the
              size) actually lands you once the deal is done.
            </li>
            <li>
              <Link
                href={withSubject("/widen", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Widen the version on the seam &rarr;
              </Link>{" "}
              On the one axis where you split, surface the alternatives &mdash; the
              slower, smaller, or different-product version &mdash; so their
              preferred setting isn&rsquo;t the only one on the table.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ============ Can't tell — find out how they're paid first ============
  return (
    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        The read
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        Find out how they&rsquo;re paid &mdash; that one fact reorders everything.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        You can name what {messenger}{" "}might gain &mdash; <GainQuote gain={gain} />{" "}
        &mdash; but you can&rsquo;t yet say whether their pay rises and falls with
        your outcome or with your yes. That&rsquo;s the one fact the whole check
        turns on, and until you have it, weighing the advice is guessing. So get
        it before anything else: the question isn&rsquo;t rude, it&rsquo;s basic
        diligence.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Ask it plainly &mdash; <em>&ldquo;How do you get paid on this? Do you make
        more if I choose one way over another?&rdquo;</em>{" "}&mdash; and listen as
        much to <em>how</em>{" "}they answer as to what they say. A clean, specific
        answer (&ldquo;a flat fee,&rdquo; &ldquo;a 3% commission on this
        product&rdquo;) lets you run the real check. Vagueness, deflection, or
        offence where a plain number should be is itself the answer: opacity
        around a payment almost always hides a divergence. Then come back and pick
        the side you&rsquo;ve just uncovered.
      </p>
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Get the fact, then run the check
        </p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link
              href={withSubject("/test", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Meanwhile, don&rsquo;t inherit their case &rarr;
            </Link>{" "}
            While you find out, pressure-test the recommendation on its own: name
            what would prove it wrong and look for that, so a pitch you can&rsquo;t
            yet price isn&rsquo;t quietly becoming your own conviction.
          </li>
          <li>
            <Link
              href={withSubject("/widen", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              And get a second option in view &rarr;
            </Link>{" "}
            The cheapest hedge against an incentive you can&rsquo;t yet see is a
            second option from a different source &mdash; so this recommendation
            isn&rsquo;t the only thing on the table when the answer comes back.
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
 * The worked example, rendered read-only. Walks the canonical case — a
 * commission-paid recommendation — and, crucially, shows the *reshape*: the move
 * isn't "distrust the adviser," it's "get the fee-only version and compare against
 * the option they don't get paid for." That's the useful part, and the part
 * people miss. Nothing lands in the person's own fields or storage.
 */
function IncentivesExample() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example &mdash; nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Your adviser recommends moving your savings into an actively-managed fund.
        They&rsquo;re warm, they know their stuff, and the pitch is convincing. But
        you stop and ask the question underneath it: what do they get if you say
        yes?
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4 space-y-3">
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">What they gain:</span>{" "}a trailing
          commission every year you hold the fund &mdash; paid to them whether or
          not it beats a plain, cheap index fund.
        </p>
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">Whose side is the incentive on?</span>{" "}
          Diverged. They&rsquo;re paid for the <em>yes</em>{" "}and for the
          <em> product</em>, not for your returns. The index fund that might serve
          you better pays them nothing &mdash; so it was never going to be the
          recommendation, however good they are.
        </p>
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">The tell:</span>{" "}at the fork where the
          cheaper option is better for you and worse for them &mdash; would it even
          come up? Probably not on its own.
        </p>
      </div>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        The move isn&rsquo;t to fire the adviser or assume they&rsquo;re crooked.
        It&rsquo;s to disarm the incentive: ask for the fee-only version of the same
        advice, put the recommended fund side by side with a low-cost index fund
        they earn nothing on, and ask directly what they&rsquo;d do if you chose the
        index. The good advice survives that; the part that was really their
        commission talking doesn&rsquo;t. Same expert, decision made on the merits.
        That&rsquo;s the whole discipline:{" "}
        <span className="font-medium">subtract the incentive, then decide.</span>
      </p>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank &mdash; run it on <em>your</em>{" "}call.
      </p>
    </div>
  );
}
