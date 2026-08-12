"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  readCarriedSubject,
  clearCarriedSubject,
  withSubject,
  withOptions,
  withOptionList,
} from "../data/carry";
import CarriedNote from "../components/CarriedNote";

/**
 * What else could you do? (/widen)
 *
 * The instrument at the front of the funnel. Every other tool here *evaluates*
 * options — sorts them by reversibility, finds the flip point between two,
 * scores several past the halo. Not one of them helps you *generate* the
 * options in the first place. But the most common and most damaging decision
 * mistake happens before any of that: narrow framing. Chip and Dan Heath, in
 * "Decisive," name it the first villain of decision-making — treating a choice
 * as "whether or not to do X" when the real choice is "X, or Y, or Z, or some
 * combination nobody wrote down." Paul Nutt's research is the receipt: decisions
 * that considered only one option failed far more often than those that weighed
 * even two. Teenagers frame ~two-thirds of their calls as "whether or not";
 * organizations weigh a second alternative only about a third of the time.
 *
 * The site already had the *essay* ("The First Mistake Is the Question") and
 * kept pointing at the concept from /compare and the triage — but there was no
 * instrument, and the essay's own closing line promised one the site didn't
 * keep. This is it. It does the one move that's most of the value: refuse to
 * decide between one thing and nothing. It catches the "whether or not" tell,
 * runs the vanishing-options test and three more generators, guards against the
 * decoy options people plant to flatter the first, and then — the point of a
 * *toolkit* — hands the real slate on to the instruments built to weigh it: two
 * options to the flip point, three or more to the halo-off comparison.
 *
 * It also keeps the honest half the essay does: past a handful, more options
 * mostly produce stall, not better calls. The failure to beat is the frame with
 * *one* option in it. One to two or three is where the value lives.
 *
 * Nothing is sent anywhere. Inputs persist in the browser. There's no forecast
 * to log — widening isn't a prediction — only the handoff to the next tool.
 */

const STORE_KEY = "widen:v1";

/** Whether an alternative is a real option or a decoy planted to flatter the first. */
type Kind = "" | "real" | "sham";

type Added = { id: string; label: string; kind: Kind };

type Inputs = {
  decision: string;
  /** The single option on the table — the thing you're weighing "whether or not" to do. */
  option: string;
  added: Added[];
};

const BLANK: Inputs = {
  decision: "",
  option: "",
  added: [
    { id: "a1", label: "", kind: "" },
    { id: "a2", label: "", kind: "" },
  ],
};

const EXAMPLE: Inputs = {
  decision: "Whether to quit my job",
  option: "Quit and figure it out from there",
  added: [
    { id: "e1", label: "Negotiate the part of the job that's making me want to leave", kind: "real" },
    { id: "e2", label: "Transfer to a different team", kind: "real" },
    { id: "e3", label: "Stay, but start the side project on nights and weekends", kind: "real" },
    { id: "e4", label: "Do nothing and just complain about it", kind: "sham" },
  ],
};

/** The most options we'll carry onward — matches the comparison's own cap. */
const MAX_OPTIONS = 6;
const MAX_ADDED = MAX_OPTIONS - 1; // the pinned original is always one of them

function isKind(v: unknown): v is Kind {
  return v === "" || v === "real" || v === "sham";
}

function cleanAdded(raw: unknown): Added[] {
  if (!Array.isArray(raw)) return BLANK.added.map((a) => ({ ...a }));
  const out: Added[] = [];
  for (const a of raw) {
    if (a && typeof a === "object") {
      const id = (a as { id?: unknown }).id;
      const label = (a as { label?: unknown }).label;
      const kind = (a as { kind?: unknown }).kind;
      if (typeof id === "string") {
        out.push({
          id,
          label: typeof label === "string" ? label : "",
          kind: isKind(kind) ? kind : "",
        });
      }
    }
  }
  if (out.length === 0) return BLANK.added.map((a) => ({ ...a }));
  return out.slice(0, MAX_ADDED);
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      option: typeof v.option === "string" ? v.option : BLANK.option,
      added: cleanAdded(v.added),
    };
  } catch {
    return BLANK;
  }
}

/**
 * The grammatical tell. Narrow framing hides in the word "whether," in "or not,"
 * in a bare "should I …" — anything with exactly two sides, this-or-nothing. A
 * light touch: it only nudges, and only when the phrasing actually shows the
 * tell, so it never scolds a decision that's genuinely already open.
 */
function looksNarrow(decision: string, option: string): boolean {
  const t = `${decision} ${option}`.toLowerCase();
  return /\bwhether\b|\bor not\b|\byes or no\b|^\s*should i\b/.test(t);
}

let idCounter = 0;
function freshId(): string {
  idCounter += 1;
  return `a${Date.now().toString(36)}${idCounter}`;
}

/** The real slate: the pinned original plus every added option not marked a decoy. */
function realOptions(inp: Inputs): string[] {
  const out: string[] = [];
  const first = inp.option.trim();
  if (first) out.push(first);
  for (const a of inp.added) {
    const label = a.label.trim();
    if (label && a.kind !== "sham") out.push(label);
  }
  return out.slice(0, MAX_OPTIONS);
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
    title: "The vanishing test",
    prompt:
      "Suppose that option is suddenly off the table — impossible, illegal, gone. What would you do instead?",
    why: "People who swear they have only one choice can almost always answer this instantly — which proves the others were there all along, just painted over by the frame.",
  },
  {
    title: "Opportunity cost",
    prompt: "What else could the same time, money, and energy buy?",
    why: "“Or not” is never really nothing — it's whatever you'd do with the resources instead. Name that thing and it stops being a shadow and becomes a real rival.",
  },
  {
    title: "And, not or",
    prompt:
      "Is there a version where you do this and keep another door open — a smaller, both-at-once, try-it-first move?",
    why: "The frame forces a divorce between options that could sometimes both be had. A pilot, a trial, a part-time version often beats the all-or-nothing leap.",
  },
  {
    title: "Someone already solved it",
    prompt: "Who has faced this exact call? What did they choose that you haven't listed?",
    why: "Most decisions aren't original. Another person's path is a cheaper teacher than your own future regret — and usually an option you hadn't thought to name.",
  },
];

export default function WidenClient() {
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

  const setAddedLabel = (id: string, label: string) =>
    setInp((s) => ({
      ...s,
      added: s.added.map((a) => (a.id === id ? { ...a, label } : a)),
    }));

  const setAddedKind = (id: string, kind: Kind) =>
    setInp((s) => ({
      ...s,
      added: s.added.map((a) => (a.id === id ? { ...a, kind } : a)),
    }));

  const addRow = () =>
    setInp((s) =>
      s.added.length >= MAX_ADDED
        ? s
        : { ...s, added: [...s.added, { id: freshId(), label: "", kind: "" }] }
    );

  const removeRow = (id: string) =>
    setInp((s) =>
      s.added.length <= 1 ? s : { ...s, added: s.added.filter((a) => a.id !== id) }
    );

  const option = inp.option.trim();
  const optionRef = option ? (
    <span className="font-medium text-[var(--foreground)]">{option}</span>
  ) : (
    "that one option"
  );

  const narrow = looksNarrow(inp.decision, inp.option);
  const reals = useMemo(() => realOptions(inp), [inp]);
  const shamCount = inp.added.filter((a) => a.label.trim() && a.kind === "sham").length;
  const unconfirmed = inp.added.filter((a) => a.label.trim() && a.kind === "").length;

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
        {showExample ? <WidenExample /> : null}
      </div>

      {/* ---- The one option on the table ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you deciding?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Whether to take the job in another city"
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
          What&rsquo;s the one option you&rsquo;re weighing?
        </label>
        <input
          type="text"
          value={inp.option}
          onChange={(e) => set("option", e.target.value)}
          placeholder="e.g. Take the job"
          className={inputClass}
        />
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          The single thing you&rsquo;re leaning toward doing — the one the whole
          decision has quietly narrowed down to.
        </p>

        {narrow ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-xs text-[var(--muted)] leading-relaxed">
            There&rsquo;s the tell — <em>whether</em>, <em>or not</em>, a bare{" "}
            <em>should I</em>. Almost grammatical: a decision with exactly two
            sides, this-or-nothing, is usually a wide-open situation wearing a
            yes/no mask.
          </p>
        ) : null}
      </div>

      {/* ---- The frame check ---- */}
      {option ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            What the frame is really offering you
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            Right now you have one option — {optionRef} — and its shadow,{" "}
            <em>&ldquo;&hellip;or not.&rdquo;</em>{" "}But &ldquo;or not&rdquo; isn&rsquo;t a
            choice; it&rsquo;s the absence of one. Decisions that weigh a single
            option fail far more often than ones that weigh even two — not because
            the thinking is worse, but because all the diligence in the world,
            spent inside a box you didn&rsquo;t notice, only makes you surer of a
            choice you never opened up. So before you weigh {optionRef}, force the
            frame open.
          </p>
        </div>
      ) : null}

      {/* ---- Widen the frame ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Widen the frame
        </p>
        <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
          Name at least one real alternative — not ten. The whole gain is in
          refusing to decide between one thing and nothing; going from one option
          to two or three is where almost all of it lives. If you&rsquo;re stuck,
          run one of these four lenses over the call:
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

        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            The options you&rsquo;d actually consider
          </p>
          {option ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2">
              <span className="text-xs text-[var(--muted)] shrink-0">On the table:</span>
              <span className="text-sm text-[var(--foreground)] truncate">{option}</span>
            </div>
          ) : null}
          {inp.added.map((a, i) => {
            const filled = a.label.trim().length > 0;
            return (
              <div key={a.id}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={a.label}
                    onChange={(e) => setAddedLabel(a.id, e.target.value)}
                    placeholder={
                      i === 0
                        ? "e.g. Negotiate what's making me want to leave"
                        : "Another real option"
                    }
                    className={inputClass}
                  />
                  {inp.added.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRow(a.id)}
                      aria-label="Remove this option"
                      className="shrink-0 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                {/* The decoy guard — appears once a row has a label. */}
                {filled ? (
                  <div className="mt-2 pl-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--muted)]">
                      Would you genuinely take this if it won?
                    </span>
                    <button
                      type="button"
                      onClick={() => setAddedKind(a.id, "real")}
                      className={`${chipBase} ${a.kind === "real" ? chipOn : chipOff}`}
                    >
                      A real option
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddedKind(a.id, "sham")}
                      className={`${chipBase} ${a.kind === "sham" ? chipOn : chipOff}`}
                    >
                      Only to flatter the first
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
          {inp.added.length < MAX_ADDED ? (
            <button
              type="button"
              onClick={addRow}
              className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              + Add another option
            </button>
          ) : null}
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            The decoy guard matters: a favorite trick — yours and everyone
            else&rsquo;s — is to pad the list with options no one would take, so the
            one you already wanted looks obvious. Those don&rsquo;t count. Mark them,
            and they&rsquo;re set aside.
          </p>
        </div>
      </div>

      {/* ---- The read + handoff ---- */}
      <Verdict
        inp={inp}
        reals={reals}
        shamCount={shamCount}
        unconfirmed={unconfirmed}
      />
    </div>
  );
}

function Verdict({
  inp,
  reals,
  shamCount,
  unconfirmed,
}: {
  inp: Inputs;
  reals: string[];
  shamCount: number;
  unconfirmed: number;
}) {
  const option = inp.option.trim();
  if (!option) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Name the one option you&rsquo;re weighing, then the alternatives — and
          the read appears: whether you&rsquo;ve got a real choice on your hands,
          or still just one option and its shadow.
        </p>
      </div>
    );
  }

  const count = reals.length;
  const subject = inp.decision;

  // ---- Still one real option ----
  if (count < 2) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {shamCount > 0
            ? "Every alternative here is a decoy."
            : "Still one option and its shadow."}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          {shamCount > 0 ? (
            <>
              You named alternatives, but marked them all as there to flatter the
              first. Strip the decoys and you&rsquo;re back where you started: a
              &ldquo;whether or not,&rdquo; the frame most likely to fail. That&rsquo;s
              worth noticing rather than papering over — run the vanishing test
              above for real this time. If {option} were simply gone, you would do{" "}
              <em>something</em>. That something is the option you&rsquo;re
              pretending you don&rsquo;t have.
            </>
          ) : (
            <>
              You haven&rsquo;t named a second option yet, so this is still a
              &ldquo;whether or not&rdquo; — the single most common way a decision
              goes wrong before any reasoning starts. Try the vanishing test above:
              if {option} were off the table entirely, what would you scramble to
              do? Whatever that is, it&rsquo;s a real alternative you already have.
            </>
          )}
        </p>
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Or — is it genuinely just one path?
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Rare, but real: sometimes, honestly, there&rsquo;s one thing to do.
            Then this isn&rsquo;t a <em>which</em>, it&rsquo;s a <em>whether</em> —
            and a whether deserves a different test than a wider frame.
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/doors", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Is it even reversible? →
              </Link>{" "}
              Sort it by how easily you could walk it back — a one-way door earns
              slow thought, a two-way door earns speed.
            </li>
            <li>
              <Link
                href={withSubject("/premortem", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                What would make it fail? →
              </Link>{" "}
              Declare it dead a year out and write the history of what went wrong,
              before you commit to the one path.
            </li>
            <li>
              <Link
                href={withSubject("/trace", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Where does the bill land? →
              </Link>{" "}
              Follow it past the first-order payoff to the place the effect you
              want turns into one you have to live with.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // ---- A real choice: two, or a slate ----
  const two = count === 2;
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        The read
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {two
          ? "Now it's a real two-way call."
          : `Now there's a real slate — ${count} options.`}
      </p>

      <ul className="mt-4 space-y-1.5">
        {reals.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
            <span className="text-[var(--accent)] font-medium shrink-0">
              {i + 1}.
            </span>
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        {two ? (
          <>
            You&rsquo;ve broken the frame open into two genuine options — the whole
            point. The choice is no longer &ldquo;do this or not&rdquo; but this{" "}
            <em>or</em> that, which is a choice you can actually reason about. Take
            both to the flip point: find the odds where the call tips, and just ask
            which side you&rsquo;re on.
          </>
        ) : (
          <>
            You&rsquo;ve turned a one-option frame into a real set of live
            alternatives — exactly the move the frame was hiding from you. Now weigh
            them honestly: score each one a factor at a time, so no single strong
            first impression halos the whole choice.
          </>
        )}
      </p>

      {unconfirmed > 0 ? (
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          {unconfirmed === 1
            ? "One option above isn't yet marked real or decoy — confirm it so the count is honest."
            : `${unconfirmed} options above aren't yet marked real or decoy — confirm them so the count is honest.`}
        </p>
      ) : null}

      {count >= 4 ? (
        <p className="mt-3 pl-3 border-l-2 border-[var(--border)] text-xs text-[var(--muted)] leading-relaxed">
          A caution the other way: past a handful, more options mostly produce
          stall, not better calls, and endless widening is its own way of never
          deciding. You&rsquo;ve beaten the failure that matters — the frame with
          one option in it. Don&rsquo;t let the list become the new place to hide.
        </p>
      ) : null}

      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Where to take it next
        </p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          {two ? (
            <li>
              <Link
                href={withOptions("/weigh", {
                  subject,
                  optionA: reals[0],
                  optionB: reals[1],
                  from: "widen",
                })}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Take both to the flip point →
              </Link>{" "}
              Both options ride over, so you land on the A/B call with them already
              in place — no retyping.
            </li>
          ) : (
            <li>
              <Link
                href={withOptionList("/compare", {
                  subject,
                  options: reals,
                  from: "widen",
                })}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Score the whole slate →
              </Link>{" "}
              All {count} options ride over to the halo-off comparison, pre-filled,
              ready to score a factor at a time.
            </li>
          )}
          <li>
            <Link
              href={withSubject("/doors", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Or check how much thought it deserves →
            </Link>{" "}
            If the whole call is easily reversible, sort it by which door it is
            before you spend real deliberation weighing the set.
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * The worked example, rendered read-only. Runs the same realOptions() the live
 * tool does on the site's own canonical narrow frame — "should I quit?" — so a
 * newcomer sees the frame break open from one option into a real slate, and sees
 * the decoy guard set aside the strawman, without a character landing in their
 * own fields or storage.
 */
function WidenExample() {
  const reals = realOptions(EXAMPLE);
  const sham = EXAMPLE.added.find((a) => a.kind === "sham");
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        The frame arrives as{" "}
        <span className="font-medium">&ldquo;should I quit my job?&rdquo;</span> — one
        option, {" "}
        <span className="font-medium">quit and figure it out</span>, weighed against
        nothing. The word <em>should I</em> is the tell. Run the vanishing test —{" "}
        <em>if quitting were off the table, what would I do?</em> — and the hidden
        options walk back in.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The frame, opened
        </p>
        <ul className="mt-2 space-y-1.5">
          {reals.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
              <span className="text-[var(--accent)] font-medium shrink-0">{i + 1}.</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          One option became <span className="font-medium">{reals.length}</span>. The
          decoy guard caught the strawman —{" "}
          {sham ? <em>&ldquo;{sham.label.toLowerCase()}&rdquo;</em> : "the padding"} —
          and set it aside, so it can&rsquo;t make quitting look obvious by standing
          next to something no one would pick. Four real options go to the halo-off
          comparison to be scored; if it had narrowed to two, they&rsquo;d go to the
          flip point instead.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank — open <em>your</em> frame.
      </p>
    </div>
  );
}
