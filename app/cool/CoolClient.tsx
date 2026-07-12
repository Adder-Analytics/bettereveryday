"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/**
 * Cool the call (/cool).
 *
 * Every other instrument on the site assumes a calm person at the keyboard —
 * calibrate, estimate, update, weigh, premortem, decide all ask you to reason.
 * This one meets the person the others can't reach: the one deciding hot, with
 * their pulse up, when reasoning is exactly the faculty that's compromised.
 *
 * It isn't a feelings worksheet. Its output is a decision, and the decision is
 * a narrow one the research hands us: when you're hot, the real choice isn't
 * "act or don't" — it's "decide now, or once you're cool?" And that sub-choice
 * has an almost deterministic structure. From "You Give Better Advice Than You
 * Take" (the essay this tool is the instrument for): if the door swings both
 * ways, waiting is nearly free, so wait; if it doesn't, an irreversible call in
 * a hot state is the one you never make. So the verdict is gated on two facts a
 * hot person can still assess — is it reversible, and is the window genuinely
 * closing — and everything else is the two research-backed moves for
 * manufacturing distance (Solomon's paradox: answer it in the third person;
 * Loewenstein's hot–cold gap, via Welch's 10/10/10: run the three horizons),
 * with the one honest caveat kept in view — distance is for stripping the
 * overweighting, not for numbing a feeling that's real information.
 *
 * Nothing is sent anywhere. Inputs persist in your browser under `cool:v1` — on
 * purpose, because the tool's most common verdict is "sleep on it," and the
 * decision should still be here, unchanged, when you come back cold.
 */

const STORE_KEY = "cool:v1";

type Feeling = "anger" | "fear" | "fomo" | "sunk" | "other";
type Reversible = "two-way" | "one-way" | "unsure";
type Forced = "no" | "yes";

type Inputs = {
  decision: string;
  feeling: Feeling;
  reversible: Reversible;
  forced: Forced;
  name: string;
  tenMin: string;
  tenMonth: string;
  tenYear: string;
  /** Is the feeling itself information, or is it distorting the weights? */
  signal: "" | "signal" | "heat";
};

const SEED: Inputs = {
  decision: "Send the angry email to my boss tonight",
  feeling: "anger",
  reversible: "one-way",
  forced: "no",
  name: "",
  tenMin: "",
  tenMonth: "",
  tenYear: "",
  signal: "",
};

const FEELINGS: { id: Feeling; label: string }[] = [
  { id: "anger", label: "Anger" },
  { id: "fear", label: "Fear / panic" },
  { id: "fomo", label: "FOMO / infatuation" },
  { id: "sunk", label: "Sunk cost" },
  { id: "other", label: "Something else" },
];

function loadInputs(): Inputs {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return SEED;
    const v = JSON.parse(raw) as Partial<Inputs>;
    const feeling = FEELINGS.some((f) => f.id === v.feeling)
      ? (v.feeling as Feeling)
      : SEED.feeling;
    const reversible: Reversible =
      v.reversible === "two-way" || v.reversible === "one-way" || v.reversible === "unsure"
        ? v.reversible
        : SEED.reversible;
    const forced: Forced = v.forced === "yes" || v.forced === "no" ? v.forced : SEED.forced;
    const signal = v.signal === "signal" || v.signal === "heat" ? v.signal : "";
    return {
      decision: typeof v.decision === "string" ? v.decision : SEED.decision,
      feeling,
      reversible,
      forced,
      name: typeof v.name === "string" ? v.name : SEED.name,
      tenMin: typeof v.tenMin === "string" ? v.tenMin : "",
      tenMonth: typeof v.tenMonth === "string" ? v.tenMonth : "",
      tenYear: typeof v.tenYear === "string" ? v.tenYear : "",
      signal,
    };
  } catch {
    return SEED;
  }
}

/**
 * A best-effort rewrite of a first-person decision into the third person — the
 * Solomon's-paradox move made concrete. It doesn't have to be grammatically
 * perfect; seeing your own dilemma with someone else's name on it is the whole
 * mechanism, and the original stays visible above it.
 */
function toThirdPerson(text: string, rawName: string): string {
  const name = rawName.trim();
  const subj = name || "a friend";
  const poss = name ? `${name}’s` : "their";
  const refl = name || "them";
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const rules: [RegExp, string][] = [
    // question openers first, so "Am I" → "Is she", not "Is I"
    [/\bam I\b/gi, `is ${subj}`],
    [/\bdo I\b/gi, `does ${subj}`],
    [/\bhave I\b/gi, `has ${subj}`],
    [/\bwas I\b/gi, `was ${subj}`],
    [/\bcan I\b/gi, `can ${subj}`],
    // contractions
    [/\bI['’]m\b/gi, `${subj} is`],
    [/\bI['’]ve\b/gi, `${subj} has`],
    [/\bI['’]ll\b/gi, `${subj} will`],
    [/\bI['’]d\b/gi, `${subj} would`],
    // pronouns
    [/\bmyself\b/gi, refl],
    [/\bmy\b/gi, poss],
    [/\bmine\b/gi, poss],
    [/\bme\b/gi, refl],
    [/\bI\b/g, subj],
  ];

  let out = text;
  for (const [re, sub] of rules) out = out.replace(re, sub);
  return cap(out.trim());
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";

const chipBase =
  "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff = "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";

type Verdict = {
  key: "wait" | "wait-strong" | "reversible-go" | "forced";
  tone: "hold" | "go";
  headline: string;
  body: string;
};

export default function CoolClient() {
  const [inp, setInp] = useState<Inputs>(SEED);
  const [hydrated, setHydrated] = useState(false);

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

  const oneWay = inp.reversible === "one-way" || inp.reversible === "unsure";
  const forced = inp.forced === "yes";

  const verdict: Verdict = useMemo(() => {
    if (!oneWay && !forced) {
      return {
        key: "wait",
        tone: "hold",
        headline: "Sleep on it.",
        body:
          "This one is reversible and nothing outside you is forcing the clock — so waiting costs almost nothing, and it buys the one thing a hot state can't give you: the calm version of you who has to live with the call. Most hot decisions have a fuse far shorter than the choice itself. Close this and come back to it cold; if it still looks the same tomorrow, it wasn't the heat talking.",
      };
    }
    if (!oneWay && forced) {
      return {
        key: "reversible-go",
        tone: "go",
        headline: "You can move — the door swings back.",
        body:
          "The window's closing, but this is reversible: if you get it wrong you can undo it, so the stakes of deciding while hot are low. Do the two-minute distance pass below — answer it in someone else's name, run the three horizons — then decide and move. A cheap-to-undo choice doesn't deserve agonizing, and you'll learn more by acting than by stalling.",
      };
    }
    if (oneWay && !forced) {
      return {
        key: "wait-strong",
        tone: "hold",
        headline: "Don't decide this tonight.",
        body:
          "This is the one combination you never act on hot: a door that only swings one way, and nothing external actually forcing you to walk through it now. The urgency is coming from the feeling, not the calendar. Whatever you'd lose by waiting a day is almost always smaller than what you'd lose by getting an irreversible call wrong while your pulse is up. The door will still be there tomorrow. Decide then.",
      };
    }
    return {
      key: "forced",
      tone: "hold",
      headline: "Forced to make a one-way call while hot — the worst spot to be in.",
      body:
        "An irreversible decision with a real, closing window is the hardest case there is, so don't skip straight to it. First: is there a reversible version? Buy time (ask for 24 hours — people grant it far more often than the panic expects), make the smallest undoable piece instead of the whole thing, or take the move that keeps your options open. If there is genuinely no way to wait and no smaller version, then decide — but decide from the cold frame below, not the hot one: answer it in someone else's name, and only trust the answer that survives all three horizons.",
    };
  }, [oneWay, forced]);

  const thirdPerson = toThirdPerson(inp.decision.trim() || "my decision", inp.name);
  const horizonsFilled =
    inp.tenMin.trim() !== "" || inp.tenMonth.trim() !== "" || inp.tenYear.trim() !== "";

  return (
    <div>
      {/* ---- The call ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you about to do?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Send the angry email"
          className={inputClass}
        />

        <div className="mt-4">
          <p className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            What&rsquo;s driving it?
          </p>
          <div className="flex flex-wrap gap-2">
            {FEELINGS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => set("feeling", f.id)}
                className={`${chipBase} ${inp.feeling === f.id ? chipOn : chipOff}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            The feeling doesn&rsquo;t decide the verdict — it just names what
            you&rsquo;re working against. A hot state rarely announces itself as a
            feeling; it shows up disguised as simply <em>seeing clearly</em>.
          </p>
        </div>
      </div>

      {/* ---- The two facts that settle it ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          When you&rsquo;re hot, the real decision isn&rsquo;t{" "}
          <em>act or don&rsquo;t</em> — it&rsquo;s <em>decide now, or once
          you&rsquo;re cool?</em> Two facts settle that, and you can judge both
          even now.
        </p>

        <div className="mt-5">
          <p className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Can you undo it?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set("reversible", "two-way")}
              className={`${chipBase} ${inp.reversible === "two-way" ? chipOn : chipOff}`}
            >
              Reversible — the door swings both ways
            </button>
            <button
              type="button"
              onClick={() => set("reversible", "one-way")}
              className={`${chipBase} ${inp.reversible === "one-way" ? chipOn : chipOff}`}
            >
              One-way — can&rsquo;t take it back
            </button>
            <button
              type="button"
              onClick={() => set("reversible", "unsure")}
              className={`${chipBase} ${inp.reversible === "unsure" ? chipOn : chipOff}`}
            >
              Not sure
            </button>
          </div>
          {inp.reversible === "unsure" ? (
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              When you can&rsquo;t tell, treat it as one-way — the caution is
              cheap and the mistake isn&rsquo;t.
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          <p className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Is something outside you actually forcing the clock?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set("forced", "no")}
              className={`${chipBase} ${inp.forced === "no" ? chipOn : chipOff}`}
            >
              No — I could wait if I chose to
            </button>
            <button
              type="button"
              onClick={() => set("forced", "yes")}
              className={`${chipBase} ${inp.forced === "yes" ? chipOn : chipOff}`}
            >
              Yes — a real, external cutoff, very soon
            </button>
          </div>
          {forced ? (
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              Be honest about the clock. FOMO and sunk cost both manufacture a
              &ldquo;now or never&rdquo; that isn&rsquo;t real. Count it as forced
              only if the cutoff is genuinely someone else&rsquo;s hard deadline —
              not the urgency the feeling is generating.
            </p>
          ) : null}
        </div>
      </div>

      {/* ---- The verdict ---- */}
      <div
        className={`mt-5 rounded-xl border p-5 sm:p-6 ${
          verdict.tone === "hold"
            ? "border-[var(--accent)] bg-[var(--card)]"
            : "border-[var(--border)] bg-[var(--card)]"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The call
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] leading-snug">
          {verdict.headline}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          {verdict.body}
        </p>
      </div>

      {/* ---- Manufacturing distance ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Get some distance
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          You reason more wisely about a friend&rsquo;s dilemma than your own
          identical one — a measured effect (Solomon&rsquo;s paradox), and it
          closes when you look at your own problem from the outside. Two ways to
          step back.
        </p>

        {/* Across person */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Across person: whose name should be on it?
          </label>
          <input
            type="text"
            value={inp.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="a friend's name (or leave blank)"
            className={inputClass}
          />
          <div className="mt-3 rounded-lg border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--muted)]">
              Answer this one instead — the advice you&rsquo;d give is usually
              clearer than the one you&rsquo;re giving yourself:
            </p>
            <p className="mt-1.5 text-base font-medium text-[var(--foreground)] leading-snug">
              &ldquo;{thirdPerson}?&rdquo;
            </p>
          </div>
        </div>

        {/* Across time */}
        <div className="mt-6">
          <p className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Across time: how will this look in&hellip;
          </p>
          <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">
            A hot state collapses the three horizons into one loud now. Pulling
            them back apart is the recalibration the feeling is blocking.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                10 minutes
              </label>
              <textarea
                value={inp.tenMin}
                onChange={(e) => set("tenMin", e.target.value)}
                rows={3}
                placeholder="the immediate rush or relief"
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                10 months
              </label>
              <textarea
                value={inp.tenMonth}
                onChange={(e) => set("tenMonth", e.target.value)}
                rows={3}
                placeholder="once the feeling has passed"
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                10 years
              </label>
              <textarea
                value={inp.tenYear}
                onChange={(e) => set("tenYear", e.target.value)}
                rows={3}
                placeholder="in the shape of a whole life"
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
          {horizonsFilled ? (
            <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
              The tell of a hot call is the ten-minute answer pulling hardest,
              and the opposite way from the ten-year one. If your three
              disagree, trust the longer horizons — that gap is the heat. If all
              three point the same way, this one survived the distance, and
              that&rsquo;s worth knowing too: it isn&rsquo;t the feeling
              deciding.
            </p>
          ) : null}
        </div>
      </div>

      {/* ---- Signal vs heat ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          One check before you cool it off
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Distance is for stripping the visceral <em>overweighting</em> — not for
          numbing a feeling that carries real information. Some feelings are data:
          the dread walking into a place, the way a person makes you smaller, the
          quiet wrongness of a deal that pencils out fine. &ldquo;I&rsquo;m sure
          I&rsquo;ll feel differently in a week&rdquo; is also exactly how you talk
          yourself out of acting on those. Which is this?
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => set("signal", inp.signal === "heat" ? "" : "heat")}
            className={`${chipBase} ${inp.signal === "heat" ? chipOn : chipOff}`}
          >
            Heat — it&rsquo;ll pass, and it&rsquo;s distorting the weights
          </button>
          <button
            type="button"
            onClick={() => set("signal", inp.signal === "signal" ? "" : "signal")}
            className={`${chipBase} ${inp.signal === "signal" ? chipOn : chipOff}`}
          >
            Signal — the feeling is telling me something true
          </button>
        </div>
        {inp.signal === "signal" ? (
          <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
            Then don&rsquo;t let the distance talk you out of it. Cooling off is
            for the choices a hot state <em>overweights</em>; a real signal
            survives the ten-year view instead of flattening under it. Give it the
            same distance pass — but if it still stands once you&rsquo;re calm,
            that&rsquo;s a reason to act, not to wait it out.
          </p>
        ) : inp.signal === "heat" ? (
          <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
            Then the verdict above holds. The goal was never to feel less — only
            to keep the feeling from doing your arithmetic for you.
          </p>
        ) : null}
      </div>

      {/* ---- The handoff ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Once you&rsquo;re cool
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          This page keeps what you wrote, so a decision you slept on is still
          here — unchanged — when you come back cold. If the call still stands
          then, weigh it properly rather than on a feeling: find its{" "}
          <Link href="/weigh" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            flip point
          </Link>{" "}
          to see which side of the line it&rsquo;s really on, or work it through
          and log it in the{" "}
          <Link href="/decide" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            decision journal
          </Link>
          . If it&rsquo;s a &ldquo;should I quit&rdquo; that keeps coming back,
          the{" "}
          <Link href="/playbook#time-to-quit" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            playbook
          </Link>{" "}
          has the version of this built for the long haul.
        </p>
      </div>
    </div>
  );
}
