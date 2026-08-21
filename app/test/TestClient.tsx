"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";

/**
 * Could you be wrong? (/test)
 *
 * The reality-testing instrument — the "R" in the Heath brothers' WRAP process
 * (Widen, Reality-test, Attain distance, Prepare to be wrong), and the one move
 * the rest of the toolkit didn't have. The site could widen a frame (/widen),
 * attain distance (/regret, /cool), and prepare to be wrong (/premortem,
 * /tripwire) — but it had no instrument for the step between having a leaning and
 * committing to it: checking whether the leaning survives contact with evidence
 * you went looking for on purpose.
 *
 * The bias it targets is confirmation bias, the most pervasive one there is,
 * because from the inside it is indistinguishable from diligence: once you lean,
 * you gather ammunition instead of evidence, and "doing your research" becomes
 * building the case for what you already wanted. Two moves break it, and the
 * tool runs both:
 *
 *   1. Consider the opposite. Name the single load-bearing assumption the whole
 *      call rests on, then state what observable evidence would prove it false —
 *      and check honestly whether you've gone looking for that, or only for its
 *      opposite. A belief nothing could falsify isn't a conviction; it's a
 *      closed loop, and the tool names that state plainly.
 *
 *   2. Ooch — don't predict, test. Where stakes and reversibility allow, run the
 *      smallest real experiment that generates actual evidence before you commit.
 *      Four lenses help design it, with a pre-commit guard so the test can't be
 *      rationalised away after the fact.
 *
 * Its near neighbour is the pre-mortem, which imagines the failure from the
 * inside; this goes and gathers the evidence from the outside. The read grades
 * the state and hands off: a designed test rides to the decision journal (log
 * what you expect, come back to grade it) or a tripwire (the day you check the
 * result); a belief that survived a real look rides on to be made to happen, or
 * to a pre-mortem to stress the rest.
 *
 * Nothing is sent anywhere. Inputs persist in the browser. There's no forecast
 * to log here — reality-testing isn't itself a prediction — only the handoff.
 */

const STORE_KEY = "test:v1";

/** Whether you've gone looking for the disconfirming evidence — the honest question. */
type Sought = "" | "looked" | "only-confirming" | "nothing";

type Inputs = {
  /** The call you're leaning toward — carries as the subject on handoffs. */
  decision: string;
  /** The single assumption the decision rests on: if it's false, the call is wrong. */
  belief: string;
  /** The observable evidence that would prove the assumption false — a falsifier. */
  disconfirmer: string;
  /** Have you actually gone looking for that evidence? */
  sought: Sought;
  /** The cheapest real test you could run before committing fully. */
  ooch: string;
};

const BLANK: Inputs = {
  decision: "",
  belief: "",
  disconfirmer: "",
  sought: "",
  ooch: "",
};

function isSought(v: unknown): v is Sought {
  return v === "" || v === "looked" || v === "only-confirming" || v === "nothing";
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      belief: typeof v.belief === "string" ? v.belief : BLANK.belief,
      disconfirmer: typeof v.disconfirmer === "string" ? v.disconfirmer : BLANK.disconfirmer,
      sought: isSought(v.sought) ? v.sought : BLANK.sought,
      ooch: typeof v.ooch === "string" ? v.ooch : BLANK.ooch,
    };
  } catch {
    return BLANK;
  }
}

/**
 * The tell, the same light touch as the frame-widener's. Certainty words in the
 * stated assumption — "obviously," "definitely," "everyone knows," "no way" — are
 * exactly where confirmation bias hides, because a belief that feels beyond
 * question is one you've stopped testing. It only nudges, and only when the
 * phrasing actually shows the tell.
 */
function soundsCertain(belief: string): boolean {
  const t = ` ${belief.toLowerCase()} `;
  return /\bobviously\b|\bdefinitely\b|\bclearly\b|\bof course\b|\beveryone knows\b|\bno way\b|\bcertain(ly)?\b|\bwithout a doubt\b|\bguaranteed\b|\bfor sure\b/.test(
    t
  );
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase =
  "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff =
  "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";

type Lens = { title: string; prompt: string; why: string };

const LENSES: Lens[] = [
  {
    title: "The small bet",
    prompt:
      "What's the smallest, most reversible slice of this you could try first — a pilot, a trial, a single week, one customer?",
    why: "Why bet the whole thing on a prediction when a cheap version generates the real evidence? A retailer unsure of a new line puts it in five stores, not a forecast.",
  },
  {
    title: "The disconfirming search",
    prompt:
      "Where would you go to find the evidence that you're wrong — the data, the person, the case — and would you actually accept it if you found it?",
    why: "Your instinct is to search for support. Deliberately searching for the opposite is one of the most reliable debiasing moves there is — but only if you've decided in advance to believe what you find.",
  },
  {
    title: "Ask someone who tried it",
    prompt:
      "Who has actually done this — not who has an opinion, but who has the scar tissue? What surprised them that isn't in your plan?",
    why: "The people who've done the thing know the failure modes you can't see yet. Their surprise is the cheapest evidence you'll ever get, and it's usually a phone call away.",
  },
  {
    title: "Pre-commit the result",
    prompt:
      "Before you look: write down exactly what result would make you change course. What number, what answer, what outcome means stop?",
    why: "Named after the fact, any result can be explained away — that's how a test becomes theatre. Named in advance, it binds you. This is the guard that makes the other three honest.",
  },
];

export default function TestClient() {
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

  const belief = inp.belief.trim();
  const certain = useMemo(() => soundsCertain(inp.belief), [inp.belief]);

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
        {showExample ? <TestExample /> : null}
      </div>

      {/* ---- The call and the assumption under it ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you leaning toward doing?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Sign the lease on the bigger office"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
          onClear={() => {
            set("decision", "");
            setCarriedSeed("");
          }}
        />

        <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          For this to be the right call, what has to be true?
        </label>
        <input
          type="text"
          value={inp.belief}
          onChange={(e) => set("belief", e.target.value)}
          placeholder="e.g. We'll grow into the space within a year"
          className={inputClass}
        />
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          The single load-bearing assumption &mdash; the one belief that, if it
          turned out false, would make this the wrong move. Not every reason. The
          one the whole thing rests on.
        </p>

        {certain ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-xs text-[var(--muted)] leading-relaxed">
            There&rsquo;s a tell in how you wrote that &mdash; <em>obviously</em>,{" "}
            <em>definitely</em>, <em>everyone knows</em>. A belief that feels beyond
            question is usually one you&rsquo;ve stopped testing. That&rsquo;s
            exactly the kind this tool is for.
          </p>
        ) : null}
      </div>

      {/* ---- Try to prove it wrong ---- */}
      {belief ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Now try to prove it wrong
          </p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            The single most reliable debiasing move is also the one your instinct
            skips: <em>consider the opposite</em>. Don&rsquo;t ask what supports the
            assumption &mdash; ask what would <em>break</em>{" "}it, then be honest about
            whether you&rsquo;ve gone looking.
          </p>

          <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            What would you have to see to know it&rsquo;s false?
          </label>
          <input
            type="text"
            value={inp.disconfirmer}
            onChange={(e) => set("disconfirmer", e.target.value)}
            placeholder="e.g. Our last two years of growth ran under 10%"
            className={inputClass}
          />
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Make it observable &mdash; a number, an answer, a thing that either
            happens or doesn&rsquo;t &mdash; so you can&rsquo;t argue with it later.
            If you genuinely can&rsquo;t name anything that would change your mind,
            that&rsquo;s the most important finding on this page.
          </p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              Have you actually gone looking for it?
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(
                [
                  ["looked", "Yes — I've genuinely looked"],
                  ["only-confirming", "No — mostly reasons it'll work"],
                  ["nothing", "Nothing would change my mind"],
                ] as [Sought, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set("sought", inp.sought === val ? "" : val)}
                  className={`${chipBase} ${inp.sought === val ? chipOn : chipOff}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ---- Test, don't predict ---- */}
      {belief ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Test, don&rsquo;t predict
          </p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            An argument about what <em>will</em>{" "}happen can run forever. A cheap
            experiment ends it. Where the stakes and reversibility allow, the
            strongest move isn&rsquo;t a better prediction &mdash; it&rsquo;s the
            smallest real test that produces actual evidence before you commit. If
            you&rsquo;re stuck designing one, run these lenses over the call:
          </p>

          <div className="space-y-3">
            {LENSES.map((l) => (
              <details
                key={l.title}
                className="group rounded-lg border border-[var(--border)] p-3"
              >
                <summary className="cursor-pointer list-none text-sm font-medium text-[var(--foreground)] flex items-start gap-2">
                  <span className="text-[var(--accent)] transition-transform group-open:rotate-90">
                    ›
                  </span>
                  <span>{l.title}</span>
                </summary>
                <p className="mt-2 pl-5 text-sm text-[var(--foreground)] leading-relaxed">
                  {l.prompt}
                </p>
                <p className="mt-1.5 pl-5 text-xs text-[var(--muted)] leading-relaxed">
                  {l.why}
                </p>
              </details>
            ))}
          </div>

          <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            The cheapest test you could run first
          </label>
          <input
            type="text"
            value={inp.ooch}
            onChange={(e) => set("ooch", e.target.value)}
            placeholder="e.g. Sublet a month-to-month desk block before committing to the lease"
            className={inputClass}
          />
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Small, real, and soon &mdash; something that turns your assumption into
            an observation. Leave it blank if this is genuinely a one-way door that
            can&rsquo;t be staged; the read will tell you what to do instead.
          </p>
        </div>
      ) : null}

      {/* ---- The read + handoff ---- */}
      <Verdict inp={inp} />
    </div>
  );
}

function Verdict({ inp }: { inp: Inputs }) {
  const belief = inp.belief.trim();
  const disc = inp.disconfirmer.trim();
  const ooch = inp.ooch.trim();
  const subject = inp.decision;

  if (!belief) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Name the one assumption the call rests on, then what would prove it
          false &mdash; and the read appears: whether the belief has survived a
          real look, whether it&rsquo;s a test you&rsquo;ve named but not run, or
          whether it&rsquo;s a conviction nothing could touch.
        </p>
      </div>
    );
  }

  // ---- The closed loop: nothing could falsify it ----
  if (inp.sought === "nothing") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          The belief can&rsquo;t lose.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          You said nothing would change your mind. That feels like conviction, but
          it&rsquo;s the confirmation trap in its purest form: a belief no evidence
          could touch isn&rsquo;t one you&rsquo;ve tested and won &mdash; it&rsquo;s
          one you&rsquo;ve sealed off from testing. The tell isn&rsquo;t that
          you&rsquo;re wrong; it&rsquo;s that you&rsquo;ve arranged things so
          you&rsquo;d never find out if you were.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Try the question in reverse: what would someone who thought this was a
          mistake point to? If you can name even one thing &mdash; a number, an
          outcome, an expert who&rsquo;d disagree &mdash; write it in the falsifier
          above. If you truly can&rsquo;t, the honest move isn&rsquo;t to commit
          harder; it&rsquo;s to notice that you&rsquo;re holding a belief for
          reasons other than the evidence, and to ask what those reasons are.
        </p>
      </div>
    );
  }

  // ---- No falsifier named yet ----
  if (!disc) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          You haven&rsquo;t said what would change your mind.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          You&rsquo;ve named the assumption &mdash; now name its opposite. Finish
          the sentence <em>&ldquo;I&rsquo;d know I was wrong if&hellip;&rdquo;</em>{" "}
          with something you could actually observe. Until you can, there&rsquo;s no
          test to run and no way to tell diligence from rationalisation. If nothing
          comes to mind at all, that itself is the answer &mdash; mark it above.
        </p>
      </div>
    );
  }

  // ---- Survived a real look ----
  if (inp.sought === "looked") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          It survived a real look.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          You named what would prove the assumption false, went looking for it, and
          it isn&rsquo;t there. That&rsquo;s the difference that matters: the belief
          is now <em>grounded</em>, not just assumed &mdash; you&rsquo;ve earned the
          confidence instead of manufacturing it. One honest check before you move
          on: did you look somewhere the disconfirming evidence would actually have
          been, and would you have accepted it? If yes, you&rsquo;re clear to
          commit.
        </p>
        {ooch ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--border)] text-xs text-[var(--muted)] leading-relaxed">
            You also sketched a test &mdash;{" "}
            <span className="text-[var(--foreground)]">{ooch}</span>. If it&rsquo;s
            cheap, run it anyway; a look confirmed is good, a look plus a small real
            result is better.
          </p>
        ) : null}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Where to take it next
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/act", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Now make it happen &rarr;
              </Link>{" "}
              A grounded call still dies if nothing moves. Turn it into a first
              concrete step that fires on a cue.
            </li>
            <li>
              <Link
                href={withSubject("/premortem", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Or stress the rest of it &rarr;
              </Link>{" "}
              You tested the load-bearing assumption; the pre-mortem imagines the
              other ways it could still fail, from the inside.
            </li>
            <li>
              <Link
                href={withSubject("/decide", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Or log what you expect &rarr;
              </Link>{" "}
              Record the forecast now, while you remember what you knew, so reality
              can grade the call later &mdash; not just the outcome.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // ---- Named the test, haven't run it ----
  const hasOoch = ooch.length > 0;
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        The read
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {hasOoch ? "You have a test to run." : "You know the test — you haven't run it."}
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        You can say what would prove the assumption false, but by your own answer
        you haven&rsquo;t gone looking &mdash; you&rsquo;ve been gathering the
        reasons it&rsquo;ll work. That&rsquo;s not a failure of nerve; it&rsquo;s
        just where confirmation bias leaves everyone. The fix is to close the gap
        between the test you named and the evidence you have.
      </p>

      {hasOoch ? (
        <>
          <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              The test you&rsquo;ll run
            </p>
            <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
              {ooch}
            </p>
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              Before you run it, pre-commit: you&rsquo;re wrong if{" "}
              <span className="text-[var(--foreground)]">{disc}</span>. Write that
              down where you can&rsquo;t edit it afterward &mdash; a named result
              binds you; a result judged after the fact gets explained away.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Make the test bind
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
              <li>
                <Link
                  href={withSubject("/decide", subject)}
                  className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
                >
                  Log it as a forecast &rarr;
                </Link>{" "}
                Record what you expect the test to show and how sure you are, then
                come back to grade it &mdash; the pre-commit, made into a record you
                can&rsquo;t rewrite.
              </li>
              <li>
                <Link
                  href={withSubject("/tripwire", subject)}
                  className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
                >
                  Set the deadline as a tripwire &rarr;
                </Link>{" "}
                Give the test a real day you&rsquo;re obligated to look at the
                result, handed back to you at the return desk so it can&rsquo;t
                quietly slip.
              </li>
            </ul>
          </div>
        </>
      ) : (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Two ways to close it
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Either go do the disconfirming search &mdash; look where the evidence
            above would actually be, and mark <em>&ldquo;I&rsquo;ve genuinely
            looked&rdquo;</em>{" "}once you have &mdash; or, better where you can, design
            the cheapest test in the panel above so the evidence comes to you.
          </p>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            If this is genuinely a one-way door that can&rsquo;t be staged or
            tested, reality-testing hands the baton along:
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/premortem", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Pre-mortem it instead &rarr;
              </Link>{" "}
              What you can&rsquo;t test from the outside, you can imagine failing
              from the inside &mdash; write the history of how it went wrong before
              you commit.
            </li>
            <li>
              <Link
                href={withSubject("/doors", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Or check the door first &rarr;
              </Link>{" "}
              Sure it can&rsquo;t be staged? Sort it by how reversible it really is
              &mdash; a surprising number of &ldquo;one-way&rdquo; calls have a cheap
              reversible slice hiding in them.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * The worked example, rendered read-only. Walks the canonical ooch — the founder
 * sure people will pay — from the sealed assumption through the falsifier to the
 * cheap test that settles it, so a newcomer sees the "predict → test" move
 * without a character landing in their own fields or storage.
 */
function TestExample() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example &mdash; nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        You&rsquo;re about to spend three months building the paid version of your
        app. The call rests on one assumption:{" "}
        <span className="font-medium">enough people will pay for it</span>. You&rsquo;ve
        been reading the encouraging comments, the &ldquo;I&rsquo;d totally use
        this&rdquo; replies &mdash; and every one of them feels like evidence.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The move
        </p>
        <ul className="mt-2 space-y-2.5 text-sm text-[var(--foreground)] leading-relaxed">
          <li>
            <span className="font-medium">Consider the opposite.</span> What would
            prove it false? <em>If I put a real price in front of them, almost
            nobody clicks buy.</em>{" "}Have you looked? No &mdash; &ldquo;I&rsquo;d use
            this&rdquo; is not &ldquo;here&rsquo;s my card,&rdquo; and you&rsquo;ve
            only collected the first kind.
          </li>
          <li>
            <span className="font-medium">Test, don&rsquo;t predict.</span> Instead
            of forecasting demand, put up a one-page pre-order with the real price
            and a <em>pay now</em>{" "}button. Run it for a week. Pre-commit: under ten
            real orders and you don&rsquo;t build it yet.
          </li>
        </ul>
      </div>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        Three months of building became one week of testing, and a prediction you
        could only argue about became a number you can&rsquo;t. That&rsquo;s the
        whole tool: the belief you were about to bet on, sent to meet the evidence
        before the bet.
      </p>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank &mdash; test <em>your</em> assumption.
      </p>
    </div>
  );
}
