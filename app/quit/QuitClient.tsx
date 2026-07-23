"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/**
 * Would You Start It Today? (/quit).
 *
 * The playbook's "time to quit" situation was the last moment on the site that
 * named a stack of models — loss aversion, opportunity cost, the outside view,
 * kill criteria — and then left you to run them yourself. This is the instrument
 * for that moment: the project that's been "almost there" for a year, the job or
 * strategy or manuscript with the sunk decade, where everything already spent
 * argues for one more push, and one more after that.
 *
 * It refuses the two ways a quit tool cheapens. It is not a pros-and-cons tally
 * (that lets the sunk cost quietly stack the "stay" column with money and years
 * that are already gone). And it is not a "should I quit? yes/no" oracle — the
 * honest output is rarely a clean verdict; it's a decision stripped of the one
 * thing distorting it. So the tool does exactly two things the sunk-cost feeling
 * won't let you do alone. It quarantines what's already spent — names it, then
 * rules that it gets no vote, because it's a fact about the past, not a reason
 * about the future. And it runs the two forward tests that survive the strip:
 * the fresh-start test (knowing what you know now, would you *begin* this today?)
 * and the opportunity-cost test (does one more push beat the best *other* use of
 * the same time and money — not "better than nothing," better than the
 * alternative?). Where they disagree, the disagreement is the whole finding, and
 * a re-import guard makes you name the measured reason before you let the sunk
 * cost climb back in. Whatever you decide to keep doing, the deliverable is a
 * kill criterion — a state and a date, set now while you're calm. Nothing is
 * sent anywhere; inputs persist in your browser only.
 */

const STORE_KEY = "quit:v1";

/** Knowing what you know now, would you begin this today from scratch? */
type Start = "yes" | "no" | null;
/** Does one more push beat the next-best use of the same resources? */
type Beats = "push" | "alt" | "unsure" | null;

type Inputs = {
  /** What you're deciding whether to quit. */
  thing: string;
  /** What continuing will cost from here — the next chunk of time/money/effort. */
  nextPush: string;
  /** What's already gone — the sunk cost, quarantined. */
  sunk: string;
  start: Start;
  /** The real next-best use of the same time, money, attention. */
  alternative: string;
  beats: Beats;
  /** The measured reason continuing differs from starting — only for the rescue cell. */
  reason: string;
  /** The kill criterion: an observable state… */
  killState: string;
  /** …and a real date by which you're obligated to look. */
  killDate: string;
};

const BLANK: Inputs = {
  thing: "",
  nextPush: "",
  sunk: "",
  start: null,
  alternative: "",
  beats: null,
  reason: "",
  killState: "",
  killDate: "",
};

/**
 * The read-only worked example. It lands on the clean STOP with a full sunk-cost
 * box — the one move the sunk-cost feeling never lets you make alone: walking
 * away from something with years and savings already in it, because the two
 * forward tests both say the money already spent is the only thing still voting
 * to stay. It runs the tool's real readVerdict(), so it can't drift from the
 * live logic.
 */
const EXAMPLE: Inputs = {
  thing: "The side app I've been building nights and weekends for about two and a half years.",
  nextPush:
    "Another six months of every evening and most of Saturday, plus roughly $8k more in ads and contractors to finally get it in front of people.",
  sunk: "Two and a half years of nights. About $30k of my own savings. And I've told everyone I know that this is the thing.",
  start: "no",
  alternative:
    "The same evenings back with my partner and a real run at the senior role at work I keep deferring — which pays, compounds, and I'd actually get.",
  beats: "alt",
  reason: "",
  killState: "",
  killDate: "",
};

// ---- the pure logic, shared by the live tool and the worked example -------

type Cell = {
  key: "keep" | "stop" | "tell" | "rescue" | "clarify" | "lean-stop";
  title: string;
  /** One-line read of where you've landed. */
  read: string;
  /** The trap or the honest note for this cell, second person. */
  note: string;
  /** What to actually do. */
  move: string;
  /** Whether the verdict points at stopping (changes the deliverable). */
  quit: boolean;
  /** Whether this cell needs the "name the measured reason" guard. */
  guard: boolean;
  /** Whether to prompt a kill criterion (everything you keep doing). */
  killCriterion: boolean;
  tone: "good" | "bad" | "danger" | "steady";
};

/**
 * The verdict, from the two forward tests — the fresh-start test crossed with
 * the opportunity-cost test. The sunk cost is deliberately absent from this
 * function: it never gets to move the answer. The diagonal is honest; the
 * off-diagonal — where "I'd start it" and "the alternative wins" disagree — is
 * where the sunk cost hides, and where the guard fires.
 */
function readVerdict(start: Start, beats: Beats): Cell | null {
  if (start == null || beats == null) return null;

  if (start === "yes" && beats === "push") {
    return {
      key: "keep",
      title: "Keep going — and it's not the sunk cost",
      read: "You'd start this fresh today, and one more push still beats the best other use of the same time and money. Both forward tests point the same way.",
      note: "So the thing keeping you here is the merits, not the money already in. That's the rare, clean 'stay.' The only trap now is letting 'keep going' become a default you coast on instead of a call you keep making.",
      move: "Carry on — deliberately. Set the kill criterion below so staying stays a live decision, checked on a date, not a thing that happens to you by momentum.",
      quit: false,
      guard: false,
      killCriterion: true,
      tone: "good",
    };
  }

  if (start === "no" && beats === "alt") {
    return {
      key: "stop",
      title: "Time to stop",
      read: "You wouldn't begin this today, and the same time and money do more elsewhere. Every forward test says go — and the only thing still arguing to stay is what you've already spent.",
      note: "And what you've already spent doesn't get a vote. It's gone whether you stay or go; keeping on to 'not waste it' spends more to honour a loss that's already booked. That pull is loss aversion, not a reason.",
      move: "Stop. Quitting will feel like admitting the loss — but the loss is already real; quitting just stops adding to it. Redirect the next push into the alternative you named, and treat what's freed up as the actual win here.",
      quit: true,
      guard: false,
      killCriterion: false,
      tone: "bad",
    };
  }

  if (start === "yes" && beats === "alt") {
    return {
      key: "tell",
      title: "The tell",
      read: "You say you'd start this fresh — yet the same resources do better elsewhere. Those two can't both be the whole truth. One is the honest read; the other is the story.",
      note: "Usually the forward comparison is the honest one and 'I'd start it' is the romance the years have built. But check the reverse before you trust it: maybe you're underrating what the alternative really costs, or you value this in something other than its payoff — it's who you are, not what it returns. Either can be legitimate; neither survives being left unnamed.",
      move: "Name, in one sentence, which it is — the push is romance, or the alternative is overrated, or you're paying for identity not return. Then re-answer the forward test honestly. Don't spend another month on the tie.",
      quit: false,
      guard: false,
      killCriterion: true,
      tone: "danger",
    };
  }

  if (start === "no" && beats === "push") {
    return {
      key: "rescue",
      title: "The rescue case — name the reason or it's the sunk cost",
      read: "You wouldn't begin this today, but one more push still beats the alternative from here. That can genuinely be true — continuing is sometimes a different proposition from starting.",
      note: "But only for a specific, nameable reason: you're measurably near the finish (evidence, not a feeling of 'almost there'), or restarting elsewhere carries a real switching cost this doesn't. 'Almost there' has been the permanent condition of every project that ever died slowly. If you can't name the reason in a sentence, one of your two answers is the sunk cost wearing a disguise — and it's almost always 'the push still wins.'",
      move: "Write the measured reason below. If it holds, this is the one honest 'carry on despite' — so carry on, and set the kill criterion. If you can't write it, re-answer the forward test: the push probably doesn't win.",
      quit: false,
      guard: true,
      killCriterion: true,
      tone: "steady",
    };
  }

  if (start === "yes" && beats === "unsure") {
    return {
      key: "clarify",
      title: "You'd start it — now make the alternative real",
      read: "You'd begin this fresh; you just can't yet rank it against what else the same time and money could do. That 'can't tell' is the gap, and it's a real one.",
      note: "The next move isn't quit or commit — it's to make the alternative concrete enough to actually compare. 'The push wins' is easy to believe when the alternative is a vague 'something else.'",
      move: "Turn the alternative into one specific thing you could really do instead, then re-run the forward test. Until it's decided, set the kill criterion so 'I'm not sure' can't quietly harden into 'I stayed.'",
      quit: false,
      guard: false,
      killCriterion: true,
      tone: "steady",
    };
  }

  // start === "no" && beats === "unsure"
  return {
    key: "lean-stop",
    title: "Nothing's arguing to stay but the sunk cost",
    read: "You wouldn't begin this today, and you can't show the push beats the alternative. Put those together and there's no forward case for staying — only the pull of what's already spent.",
    note: "'I wouldn't start it' plus 'I can't tell if it beats the alternative' is not a case for continuing. Absent a nameable reason that continuing differs from starting, the honest default here is to stop.",
    move: "Either name the specific reason continuing beats starting — in which case you're in the rescue case, so make it explicit — or take the default and stop. Drifting on 'unsure' is how the sunk cost wins by forfeit.",
    quit: true,
    guard: false,
    killCriterion: false,
    tone: "bad",
  };
}

// ---- storage --------------------------------------------------------------

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    const start = (s: unknown): Start => (s === "yes" || s === "no" ? s : null);
    const beats = (s: unknown): Beats =>
      s === "push" || s === "alt" || s === "unsure" ? s : null;
    const str = (s: unknown, d: string) => (typeof s === "string" ? s : d);
    return {
      thing: str(v.thing, BLANK.thing),
      nextPush: str(v.nextPush, BLANK.nextPush),
      sunk: str(v.sunk, BLANK.sunk),
      start: start(v.start),
      alternative: str(v.alternative, BLANK.alternative),
      beats: beats(v.beats),
      reason: str(v.reason, BLANK.reason),
      killState: str(v.killState, BLANK.killState),
      killDate: str(v.killDate, BLANK.killDate),
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
  reason,
  onReason,
  killState,
  killDate,
  onKillState,
  onKillDate,
  readOnly = false,
}: {
  cell: Cell;
  reason: string;
  onReason?: (v: string) => void;
  killState: string;
  killDate: string;
  onKillState?: (v: string) => void;
  onKillDate?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <div className={`rounded-xl border-2 ${cellToneClasses[cell.tone]} bg-[var(--card)] p-5 sm:p-6`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The verdict — with the sunk cost set aside
        </p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {cell.title}
        </p>
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">{cell.read}</p>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">{cell.note}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">What to do: </span>
          {cell.move}
        </p>
      </div>

      {/* The re-import guard — name the measured reason, or it's the sunk cost */}
      {cell.guard ? (
        <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            The one measured reason continuing beats starting
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            One sentence, and it has to be a fact, not a feeling — a milestone with evidence
            behind it, or a switching cost you can point to. If the honest sentence won&rsquo;t
            come, that&rsquo;s your answer.
          </p>
          {readOnly ? (
            <p className="mt-3 text-sm italic text-[var(--muted)]">
              {reason || "— (left blank on purpose: no nameable reason, so the push doesn't win)"}
            </p>
          ) : (
            <textarea
              value={reason}
              onChange={(e) => onReason?.(e.target.value)}
              placeholder="e.g. The last integration test passed Tuesday; only the payment flow is left, ~2 weeks by the tracker — not a feeling of 'almost.'"
              className={`${areaClass} mt-3`}
            />
          )}
        </div>
      ) : null}

      {/* The deliverable: kill criterion (stay/continue) or a clean-exit note (stop) */}
      {cell.killCriterion ? (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Before you carry on — set the kill criterion
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            You&rsquo;ve decided to keep going, so decide <em>now</em>, while you&rsquo;re calm,
            what would make you stop — because in the moment you&rsquo;ll always find a reason for
            one more push. A good one is a <span className="text-[var(--foreground)]">state</span>{" "}
            you can&rsquo;t argue with and a <span className="text-[var(--foreground)]">date</span>{" "}
            you&rsquo;re obligated to look. Not &ldquo;if it&rsquo;s not working&rdquo; — that
            renegotiates itself every morning — but &ldquo;if I&rsquo;m under X by this date, I
            stop.&rdquo;
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                If this isn&rsquo;t true…
              </label>
              {readOnly ? (
                <p className="text-sm italic text-[var(--muted)] py-2">{killState || "—"}</p>
              ) : (
                <input
                  type="text"
                  value={killState}
                  onChange={(e) => onKillState?.(e.target.value)}
                  placeholder="e.g. 100 paying users, or the beta shipped"
                  className={inputClass}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                …by this date
              </label>
              {readOnly ? (
                <p className="text-sm italic text-[var(--muted)] py-2">{killDate || "—"}</p>
              ) : (
                <input
                  type="date"
                  value={killDate}
                  onChange={(e) => onKillDate?.(e.target.value)}
                  className={`${inputClass} sm:w-[10.5rem]`}
                />
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            …I stop and re-decide. Quitting on time will feel like quitting too early — that
            feeling is the bias, not the verdict. Put the date somewhere that outranks your future
            self: arm it as a{" "}
            <Link href="/premortem" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              tripwire
            </Link>{" "}
            so it lands in your{" "}
            <Link href="/review" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              return desk
            </Link>{" "}
            on the day, instead of a memory.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            The clean exit
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            There&rsquo;s no tripwire to set — the decision is to stop. The one thing worth doing
            is protecting the move from the regret that&rsquo;ll arrive tonight: write down, now,
            the forward reasons you stopped (the alternative that wins, the fresh-start answer), so
            when the sunk cost comes back to argue you&rsquo;ll have the calm version on record.
            Then actually redirect the freed-up time and money — a quit you don&rsquo;t reinvest
            just becomes a loss twice.
          </p>
        </div>
      )}
    </div>
  );
}

function QuitExample() {
  const cell = readVerdict(EXAMPLE.start, EXAMPLE.beats)!;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        A worked example — read-only, nothing here is saved
      </p>
      <dl className="mt-4 space-y-3 text-sm leading-relaxed">
        <div>
          <dt className="text-[var(--muted)]">The thing</dt>
          <dd className="text-[var(--foreground)]">{EXAMPLE.thing}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Already spent (set aside — no vote)</dt>
          <dd className="text-[var(--foreground)]">{EXAMPLE.sunk}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Would you start it today, from scratch?</dt>
          <dd className="text-[var(--foreground)]">No — I wouldn&rsquo;t begin this now.</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">The real alternative</dt>
          <dd className="text-[var(--foreground)]">{EXAMPLE.alternative}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">One more push vs. that alternative?</dt>
          <dd className="text-[var(--foreground)]">The alternative wins.</dd>
        </div>
      </dl>
      <div className="mt-5">
        <VerdictBlock
          cell={cell}
          reason={EXAMPLE.reason}
          killState={EXAMPLE.killState}
          killDate={EXAMPLE.killDate}
          readOnly
        />
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Note what the tool just did: it told someone to walk away from two and a half years and
        $30k. That&rsquo;s the move the sunk-cost feeling never makes on its own — the more
        you&rsquo;ve put in, the louder it argues to stay. Stripping the spent money out of the
        vote is the whole reason to run this instead of tallying pros and cons.
      </p>
    </div>
  );
}

export default function QuitClient() {
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

  const cell = useMemo(() => readVerdict(inp.start, inp.beats), [inp.start, inp.beats]);

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
        {showExample ? <QuitExample /> : null}
      </div>

      {/* ---- Step 1: the thing, and the next push ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 1 — the thing, and what the next push costs
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              What you&rsquo;re deciding whether to quit
            </label>
            <input
              type="text"
              value={inp.thing}
              onChange={(e) => set("thing", e.target.value)}
              placeholder="e.g. The startup. The PhD. The manuscript. The relationship."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              What one more push costs from here
            </label>
            <textarea
              value={inp.nextPush}
              onChange={(e) => set("nextPush", e.target.value)}
              placeholder="The next chunk of time, money, and attention it'll take to keep going — going forward, not what's already in."
              className={areaClass}
            />
          </div>
        </div>
      </div>

      {/* ---- Step 2: quarantine the sunk cost ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 2 — name what&rsquo;s already spent, then set it down
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Everything you&rsquo;ve already put in — the money, the years, the effort, the face
          you&rsquo;d lose. Write it out in full. Then understand what this box is: a{" "}
          <em>quarantine</em>. Every bit of it is gone whether you stay or go, so none of it gets a
          vote in what you do next — it&rsquo;s a fact about the past, not a reason about the
          future. Naming it here is how you stop it voting in secret, dressed up as
          &ldquo;I can&rsquo;t waste all that.&rdquo;
        </p>
        <textarea
          value={inp.sunk}
          onChange={(e) => set("sunk", e.target.value)}
          placeholder="The time, money, and effort already gone — the more it hurts to list, the more it's been quietly running the decision."
          className={`${areaClass} mt-4`}
        />
      </div>

      {/* ---- Step 3: the fresh-start test ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 3 — the fresh-start test
        </p>
        <p className="mt-2 text-base font-medium text-[var(--foreground)] leading-relaxed">
          Forget that you&rsquo;ve already started. If this were put in front of you today — nothing
          sunk, no history — would you <em>begin</em> it, knowing everything you know now?
        </p>
        <div className="mt-4">
          <Segmented
            name="Would you start it today?"
            value={inp.start}
            onChange={(v) => set("start", v)}
            options={[
              { value: "yes", label: "Yes — I'd start it today" },
              { value: "no", label: "No — I wouldn't begin this now" },
            ]}
          />
        </div>
        <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            This is the sunk-cost strip
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            A brand-new you, walking up to this today, carries none of what you&rsquo;ve spent — so
            their answer is the one the sunk cost can&rsquo;t reach. If they&rsquo;d walk on and you
            won&rsquo;t, the gap between you <em>is</em> the sunk cost. Answer as them, not as the
            person who&rsquo;s already paid.
          </p>
        </div>
      </div>

      {/* ---- Step 4: the forward comparison ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Step 4 — one more push against its real alternative
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Staying isn&rsquo;t measured against zero — it&rsquo;s measured against the best other
          thing the same time and money could do. &ldquo;Better than nothing&rdquo; is not the bar;
          &ldquo;better than the alternative&rdquo; is. Name the alternative first, concretely, or
          the comparison cheats in favour of staying.
        </p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Where the same time and money would actually go instead
          </label>
          <textarea
            value={inp.alternative}
            onChange={(e) => set("alternative", e.target.value)}
            placeholder="Your real next-best use — the specific other thing, not a vague 'something else.'"
            className={areaClass}
          />
        </div>
        <div className="mt-4">
          <p className="block text-sm font-medium text-[var(--foreground)] mb-2">
            From here forward, does one more push beat that alternative?
          </p>
          <Segmented
            name="Does the push beat the alternative?"
            value={inp.beats}
            onChange={(v) => set("beats", v)}
            options={[
              { value: "push", label: "The push still wins" },
              { value: "alt", label: "The alternative wins" },
              { value: "unsure", label: "Genuinely can't tell" },
            ]}
          />
        </div>
      </div>

      {/* ---- The verdict ---- */}
      {cell ? (
        <div className="mt-5">
          <VerdictBlock
            cell={cell}
            reason={inp.reason}
            onReason={(v) => set("reason", v)}
            killState={inp.killState}
            killDate={inp.killDate}
            onKillState={(v) => set("killState", v)}
            onKillDate={(v) => set("killDate", v)}
          />
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer the fresh-start test (Step 3) and the forward comparison (Step 4), and the
            verdict appears here — where the call lands once the sunk cost is out of the vote, and
            the one thing to do next.
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
          Clear this
        </button>
      </div>
    </div>
  );
}
