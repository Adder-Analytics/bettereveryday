"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";

/**
 * Which door is this? (/doors)
 *
 * The triage that belongs *before* every other tool on the site. All the
 * instruments — the flip point, the pre-mortem, the decision journal — assume
 * you've already decided a decision is worth the machinery. This one answers the
 * question that comes first and almost nobody asks: does this choice even
 * deserve it?
 *
 * The frame is Bezos's Type 1 / Type 2 (the shareholder letter, 2015), which the
 * decision literature calls reversibility. A one-way door — you can't come back
 * through — earns slow, careful deliberation, because reversal won't bail out a
 * wrong call. A two-way door — you can walk right back — should be decided fast,
 * because the expensive thing there isn't a wrong call, it's a slow one: every
 * day of deliberation is a real cost, and the mistake, if you make it, is cheap
 * and undoable. The dominant error runs one direction — treating two-way doors
 * like one-way doors, agonizing over things you could simply undo — so the tool
 * is built to give a fast, reversible call the one thing it's usually denied:
 * permission to move.
 *
 * The site's own reference already prescribed this. The reversibility model
 * spells out the whole idea; the cooling-off tool uses it as the gate for the
 * hot state ("a two-way door makes waiting nearly free"); the playbook keeps
 * saying "first decide how reversible this really is." What was missing was the
 * cold-state instrument that actually runs the triage and prescribes how much
 * deliberation the decision has earned. This is that instrument.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser so a reload
 * doesn't wipe them; there's no forecast to log — a triage isn't a prediction —
 * only a handoff to the right next tool for the door you turn out to be facing.
 */

const STORE_KEY = "doors:v1";

/** How hard is it to undo if you're wrong? */
type Undo = "" | "easy" | "costly" | "none";
/** The worst realistic outcome if you're wrong. */
type Stakes = "" | "shrug" | "recover" | "ruin";
/** What acting teaches that deliberating can't. */
type Learn = "" | "only-trying" | "some" | "known";

type Inputs = {
  decision: string;
  undo: Undo;
  stakes: Stakes;
  learn: Learn;
  hot: boolean;
};

const BLANK: Inputs = {
  decision: "",
  undo: "",
  stakes: "",
  learn: "",
  hot: false,
};

const EXAMPLE: Inputs = {
  decision: "Which project tool the team should switch to",
  undo: "easy",
  stakes: "recover",
  learn: "only-trying",
  hot: false,
};

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      undo: isUndo(v.undo) ? v.undo : BLANK.undo,
      stakes: isStakes(v.stakes) ? v.stakes : BLANK.stakes,
      learn: isLearn(v.learn) ? v.learn : BLANK.learn,
      hot: typeof v.hot === "boolean" ? v.hot : BLANK.hot,
    };
  } catch {
    return BLANK;
  }
}

function isUndo(v: unknown): v is Undo {
  return v === "easy" || v === "costly" || v === "none";
}
function isStakes(v: unknown): v is Stakes {
  return v === "shrug" || v === "recover" || v === "ruin";
}
function isLearn(v: unknown): v is Learn {
  return v === "only-trying" || v === "some" || v === "known";
}

type Band = "two-way" | "middle" | "one-way";

type Verdict = {
  /** 0 (decide now) … 100 (deliberate hard) — where the marker sits. */
  score: number;
  band: Band;
  /** The worst case is unrecoverable — the margin-of-safety override. */
  ruin: boolean;
  /** They called it easily undoable *and* unrecoverable — a contradiction. */
  contradiction: boolean;
};

/**
 * The triage. Reversibility sets the base; stakes and the value of acting nudge
 * it; an unrecoverable downside overrides everything, because you can't "undo"
 * ruin — margin of safety, not expected value, owns that case.
 */
function classify(inp: Inputs): Verdict | null {
  if (inp.undo === "" || inp.stakes === "" || inp.learn === "") return null;

  let score = inp.undo === "easy" ? 12 : inp.undo === "costly" ? 50 : 82;

  if (inp.stakes === "recover") score += 12;
  else if (inp.stakes === "shrug") score -= 8;

  // If you only learn by trying, acting is the research — lean toward moving.
  // If the facts are already all in, thinking is where the value is.
  if (inp.learn === "only-trying") score -= 12;
  else if (inp.learn === "known") score += 8;

  const ruin = inp.stakes === "ruin";
  const contradiction = ruin && inp.undo === "easy";
  if (ruin) score = Math.max(score, 88);

  score = Math.max(2, Math.min(98, Math.round(score)));
  const band: Band = score < 34 ? "two-way" : score > 66 ? "one-way" : "middle";
  return { score, band, ruin, contradiction };
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase =
  "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff =
  "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";

const UNDO_OPTIONS: { id: Undo; label: string; hint: string }[] = [
  { id: "easy", label: "Easily", hint: "I can walk right back through — cancel, return, switch back, for little cost." },
  { id: "costly", label: "At a cost", hint: "I can undo it, but it'll cost real time, money, or face." },
  { id: "none", label: "Not really", hint: "Once I do this, it's done. There's no coming back." },
];
const STAKES_OPTIONS: { id: Stakes; label: string; hint: string }[] = [
  { id: "shrug", label: "I'd shrug it off", hint: "A setback I'd have forgotten in a month." },
  { id: "recover", label: "Real, but I'd recover", hint: "Genuine damage — but I'd come back from it." },
  { id: "ruin", label: "I couldn't come back", hint: "Ruin, not a setback — a loss I couldn't recover from." },
];
const LEARN_OPTIONS: { id: Learn; label: string; hint: string }[] = [
  { id: "only-trying", label: "Only by trying it", hint: "No amount of thinking gets me the answer — I have to move to find out." },
  { id: "some", label: "Some", hint: "Acting would teach me a little the analysis can't." },
  { id: "known", label: "Nothing new", hint: "I already have all the information I'm going to get." },
];

export default function DoorsClient() {
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

  const verdict = useMemo(() => classify(inp), [inp]);
  const thing = inp.decision.trim();

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
        {showExample ? <DoorsExample /> : null}
      </div>

      {/* ---- The decision ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you deciding?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Whether to take the contract"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
          onClear={() => {
            set("decision", "");
            setCarriedSeed("");
          }}
        />
      </div>

      {/* ---- Q1: reversibility ---- */}
      <QuestionCard
        n={1}
        q="If you're wrong, can you undo it?"
        sub="Not whether you'd want to — whether you could, and at what cost. This is the axis that does the most work."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {UNDO_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => set("undo", o.id)}
              className={`${chipBase} ${inp.undo === o.id ? chipOn : chipOff}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {inp.undo ? (
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            {UNDO_OPTIONS.find((o) => o.id === inp.undo)?.hint}
          </p>
        ) : null}
      </QuestionCard>

      {/* ---- Q2: stakes ---- */}
      <QuestionCard
        n={2}
        q="How bad is the worst realistic outcome?"
        sub="If this goes the wrong way, what's the damage — honestly, not the catastrophized version."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {STAKES_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => set("stakes", o.id)}
              className={`${chipBase} ${inp.stakes === o.id ? chipOn : chipOff}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {inp.stakes ? (
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            {STAKES_OPTIONS.find((o) => o.id === inp.stakes)?.hint}
          </p>
        ) : null}
      </QuestionCard>

      {/* ---- Q3: value of acting ---- */}
      <QuestionCard
        n={3}
        q="Will doing it teach you something thinking can't?"
        sub="The quiet reason two-way doors should be fast: sometimes the cheapest way to get the information is to act and watch."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {LEARN_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => set("learn", o.id)}
              className={`${chipBase} ${inp.learn === o.id ? chipOn : chipOff}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {inp.learn ? (
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            {LEARN_OPTIONS.find((o) => o.id === inp.learn)?.hint}
          </p>
        ) : null}
        <label className="mt-4 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inp.hot}
            onChange={(e) => set("hot", e.target.checked)}
            className="mt-1 accent-[var(--accent)]"
          />
          <span className="text-sm text-[var(--muted)] leading-relaxed">
            I&rsquo;m deciding this{" "}
            <strong className="text-[var(--foreground)]">while hot</strong> —
            angry, panicked, rushed, or infatuated.
          </span>
        </label>
      </QuestionCard>

      {/* ---- The verdict ---- */}
      {verdict ? (
        <VerdictBlock verdict={verdict} inp={inp} thing={thing} />
      ) : (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer the three questions and the door tells you how much
            deliberation it&rsquo;s earned.
          </p>
        </div>
      )}
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
      <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
        {sub}
      </p>
      {children}
    </div>
  );
}

/**
 * The deliberation spectrum — the same drawn-line idiom the flip point uses, one
 * dimension: how much careful thought this decision has earned. Left is "decide
 * fast," right is "deliberate," with the two-way / one-way bands shaded and the
 * marker placed at the computed score.
 */
function DeliberationTrack({ score }: { score: number }) {
  const left = `${Math.max(0, Math.min(100, score))}%`;
  return (
    <div className="mt-5">
      <div className="relative h-9">
        <div className="absolute inset-x-0 top-4 h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--accent)] opacity-25"
            style={{ width: "34%" }}
            aria-hidden
          />
          <div
            className="absolute inset-y-0 right-0 bg-[var(--accent)]"
            style={{ width: "34%" }}
            aria-hidden
          />
        </div>
        {/* band boundaries */}
        <div className="absolute top-2.5 w-px h-5 bg-[var(--border)]" style={{ left: "34%" }} aria-hidden />
        <div className="absolute top-2.5 w-px h-5 bg-[var(--border)]" style={{ left: "66%" }} aria-hidden />
        {/* the marker */}
        <div
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left }}
        >
          <span className="text-[10px] font-semibold text-[var(--foreground)] leading-none">
            this
          </span>
          <span
            className="mt-0.5 w-2.5 h-2.5 rounded-full bg-[var(--foreground)]"
            aria-hidden
          />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-[var(--muted)]">
        <span>decide fast</span>
        <span>deliberate</span>
      </div>
    </div>
  );
}

function VerdictBlock({
  verdict,
  inp,
  thing,
}: {
  verdict: Verdict;
  inp: Inputs;
  thing: string;
}) {
  const it = thing || "this";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      {/* Ruin override — the margin-of-safety warning, ahead of everything */}
      {verdict.ruin ? (
        <div className="mb-5 rounded-lg border border-[var(--accent)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
            {verdict.contradiction
              ? "That doesn't add up — trust the stakes"
              : "First — the downside you can't take back"}
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            {verdict.contradiction ? (
              <>
                You called this easily undoable, but you also said the worst case
                is one you couldn&rsquo;t recover from. Those can&rsquo;t both be
                true: you can&rsquo;t walk back through a door that leads to ruin.
                When they disagree, the stakes win — this is a one-way door.{" "}
              </>
            ) : null}
            Before anything about speed: is there a version of{" "}
            <span className="font-medium">{it}</span> that caps the downside — a
            smaller bet, a buffer, an exit, a reversible first slice? Averages
            assume you get to keep playing; against a loss you can&rsquo;t come
            back from, the rule isn&rsquo;t &ldquo;is this a good bet&rdquo; —
            it&rsquo;s{" "}
            <em>don&rsquo;t bet what you can&rsquo;t afford to lose</em>. Buy a{" "}
            <Link
              href="/models#margin-of-safety"
              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              margin of safety
            </Link>{" "}
            first, then judge the rest.
          </p>
        </div>
      ) : null}

      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        The verdict
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {verdict.band === "two-way"
          ? "A two-way door. Decide fast."
          : verdict.band === "one-way"
            ? "A one-way door. This earns the slowness."
            : "A one-and-a-half-way door."}
      </p>

      <DeliberationTrack score={verdict.score} />

      {verdict.band === "two-way" ? (
        <TwoWayBody inp={inp} it={it} />
      ) : verdict.band === "one-way" ? (
        <OneWayBody inp={inp} it={it} ruin={verdict.ruin} />
      ) : (
        <MiddleBody inp={inp} it={it} />
      )}
    </div>
  );
}

function TwoWayBody({ inp, it }: { inp: Inputs; it: string }) {
  return (
    <div className="mt-5">
      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        You can walk back through this one, and being wrong costs little. That
        flips the math most people get backwards: the expensive thing here
        isn&rsquo;t a wrong call — it&rsquo;s a slow one. Every day you spend
        deliberating over <span className="font-medium">{it}</span> is a real
        cost you&rsquo;re paying for certainty you don&rsquo;t need. Pick, move,
        and let the world tell you what no amount of staring at it could.
      </p>
      {inp.learn === "only-trying" ? (
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          And you said you&rsquo;ll only really know by trying — so acting{" "}
          <em>is</em> the research. The fastest route to the answer runs through
          the door, not around it. Deliberating longer can&rsquo;t buy
          information that only moving will give you.
        </p>
      ) : null}
      <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
        The honest move: put a short deadline on it — decide by the end of the
        day, or the week — and hold it. If you&rsquo;re genuinely torn between two
        you&rsquo;d both be fine with, this is the one place a coin flip is
        rational: the flash of relief or dismay when it lands tells you which you
        actually wanted.
      </p>
      {inp.hot ? (
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          One caveat, since you&rsquo;re deciding this hot: on a two-way door,
          waiting is nearly free — so if the feeling is loud, sleep on it a day
          first. You lose almost nothing, and you get back the calm version of
          you.{" "}
          <Link
            href={withSubject("/cool", inp.decision)}
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Cool the call
          </Link>
          , then decide.
        </p>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          Still want to sanity-check the numbers before you move? Take it to the{" "}
          <Link
            href={withSubject("/weigh", inp.decision)}
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            flip point
          </Link>{" "}
          — but don&rsquo;t let a spreadsheet become the new way to stall.
        </p>
      )}
    </div>
  );
}

function OneWayBody({
  inp,
  it,
  ruin,
}: {
  inp: Inputs;
  it: string;
  ruin: boolean;
}) {
  return (
    <div className="mt-5">
      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        Once you&rsquo;re through, you don&rsquo;t get to come back. That puts{" "}
        <span className="font-medium">{it}</span> in the small class of decisions
        where thinking longer genuinely pays — because reversal won&rsquo;t bail
        out a wrong call the way it does for most choices. This is what slow,
        careful deliberation is <em>for</em>. Don&rsquo;t let it get decided in an
        afternoon, and don&rsquo;t let anyone rush you through it.
      </p>
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Where to take it next
        </p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link
              href={withSubject("/premortem", inp.decision)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Run a pre-mortem →
            </Link>{" "}
            Assume it&rsquo;s a year later and this went badly; write the story of
            why, before you commit. The failures you can&rsquo;t feel in advance
            become visible the moment you imagine them as already real.
          </li>
          <li>
            <Link
              href={withSubject("/decide", inp.decision)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Log it in the decision journal →
            </Link>{" "}
            Write what you expect and how sure you are, and set a date to come
            back. A one-way door is exactly the call worth grading later against
            what actually happened.
          </li>
          <li>
            <Link
              href={withSubject("/outside", inp.decision)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Check the outside view →
            </Link>{" "}
            If it turns on how long or how much, set your plan against what
            actually happened to everyone who tried something like it.
          </li>
          {ruin ? (
            <li>
              <Link
                href={withSubject("/weigh", inp.decision)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Weigh the stakes →
              </Link>{" "}
              If it&rsquo;s an either/or with an unrecoverable downside, the flip
              point will show you how strong the bet has to be — and flag when
              expected value is the wrong tool entirely.
            </li>
          ) : null}
        </ul>
      </div>
      {inp.hot ? (
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          And you&rsquo;re hot right now — so this is the one combination you
          never act on: a door that only swings one way, decided while the pulse
          is up. It&rsquo;ll still be there tomorrow.{" "}
          <Link
            href={withSubject("/cool", inp.decision)}
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Cool the call
          </Link>{" "}
          first.
        </p>
      ) : null}
    </div>
  );
}

function MiddleBody({ inp, it }: { inp: Inputs; it: string }) {
  return (
    <div className="mt-5">
      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        You can undo <span className="font-medium">{it}</span>, but it&rsquo;ll
        cost — so it deserves neither an afternoon&rsquo;s agonizing nor a snap
        call. The move is to spend a little to make the reversal cheaper or the
        call surer: the one fact that would most change your mind, a smaller
        reversible first version, a trial you can still back out of. Buy the cheap
        information, then decide — and don&rsquo;t let a recoverable choice turn
        into a standing argument.
      </p>
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Where to take it next
        </p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link
              href={withSubject("/weigh", inp.decision)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Find the flip point →
            </Link>{" "}
            If it&rsquo;s an either/or, stop arguing the exact odds and find the
            line where the call flips — then just ask which side you&rsquo;re on.
          </li>
          <li>
            <Link
              href={withSubject("/trace", inp.decision)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Trace it forward →
            </Link>{" "}
            If you suspect the bill comes later, follow the move past its
            first-order effect to where it might flip on you.
          </li>
          <li>
            <Link
              href={withSubject("/decide", inp.decision)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Log the call →
            </Link>{" "}
            Worth a line in the journal and a date to come back — a recoverable
            call is still a forecast you can learn from.
          </li>
        </ul>
      </div>
      {inp.hot ? (
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          Deciding it hot? Buy the distance first —{" "}
          <Link
            href={withSubject("/cool", inp.decision)}
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            cool the call
          </Link>
          , then run the cheap check above.
        </p>
      ) : null}
    </div>
  );
}

/**
 * The worked example, rendered read-only. It runs the same classify() the live
 * tool does, for a fixed scenario — the everyday two-way door people treat like
 * a one-way one — so a newcomer sees a finished pass without a single character
 * landing in their own fields or storage.
 */
function DoorsExample() {
  const verdict = classify(EXAMPLE);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{EXAMPLE.decision}.</span> A team can spend
        three weeks debating this. But you can{" "}
        <span className="font-medium">switch back easily</span>, the worst case is{" "}
        <span className="font-medium">real but recoverable</span>, and you&rsquo;ll{" "}
        <span className="font-medium">only really know by trying it</span>.
      </p>
      {verdict ? (
        <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            The verdict
          </p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            A two-way door. Decide fast.
          </p>
          <DeliberationTrack score={verdict.score} />
          <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
            The three weeks of debate cost more than picking wrong ever could —
            and picking wrong is undoable anyway. Set a deadline, run a two-week
            trial of the front-runner, and let the team&rsquo;s actual use settle
            it.
          </p>
        </div>
      ) : null}
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own three questions below are blank — answer them for the call
        you&rsquo;re actually facing.
      </p>
    </div>
  );
}
