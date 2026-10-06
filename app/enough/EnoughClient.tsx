"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import { encodeShare, readShare, clearShare, SHARE_PARAM } from "../data/share";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import PrintButton from "../components/PrintButton";

/**
 * Enough to decide? (/enough)
 *
 * The value-of-information instrument — the one making-the-call tool for the
 * moment *before* you're ready to weigh anything, when you keep telling yourself
 * you can't decide yet because you need to know more first. Every other tool in
 * the "deciding now" group assumes you have what you need and helps you use it;
 * this one meets the person still gathering, who genuinely can't tell whether
 * that's diligence or a way to put the decision off. From the inside the two are
 * nearly identical, because stalling wears the costume of thoroughness.
 *
 * The idea is Douglas Hubbard's (How to Measure Anything), on Ronald Howard's
 * decision-theory "value of information": a fact is worth knowing only for what
 * it would *change* about the decision — its decision value is exactly zero when
 * no realistic answer could move which option wins. The tool runs that test with
 * no math at all:
 *
 *   1. Name the one thing you feel you must find out first.
 *   2. Say what you'd do under each way it could turn out.
 *   3. Read the two answers back. Same move either way → the information has no
 *      decision value; you already have enough, and more research is delay.
 *      Different move → it's worth having, but only when it's cheap and in time;
 *      past that point more waiting doesn't buy a better call, only a later one.
 *
 * The read routes on that split: "you already have enough" hands you to the tools
 * that decide with what you have (the flip point, the comparison, the journal),
 * or — when the real block is discomfort, not missing facts — names that and
 * points at the tool for it. "It would change the call, and you can get it
 * cheaply" hands you to reality-testing (design the cheapest test) or the outside
 * view (the base rate). "It would change the call, but you can't get it in time"
 * hands you to the flip point (decide under the uncertainty) and a tripwire (to
 * catch it if it resolves against you later).
 *
 * It's the qualitative twin of the flip point's own value-of-information line,
 * run before you've put a single number on anything. Nothing is sent anywhere;
 * inputs persist in the browser. There's no forecast to log — a value-of-
 * information check isn't a prediction — only the handoff.
 */

const STORE_KEY = "enough:v1";

/** Reading the two outcomes back: does your move actually change? */
type Changes = "" | "same" | "different" | "unsure";
/** When it would change the call: can you get the fact cheaply and in time? */
type Gettable = "" | "cheap" | "costly" | "unknowable";

type Inputs = {
  /** The call you're facing — carries as the subject on handoffs. */
  decision: string;
  /** The one thing you keep feeling you must find out before you can decide. */
  unknown: string;
  /** What you'd do under one way it could turn out. */
  ifA: string;
  /** What you'd do under the other way. */
  ifB: string;
  /** Reading those back: same move either way, or different? */
  changes: Changes;
  /** If different: how gettable is the fact — cheaply, in time? */
  gettable: Gettable;
};

const BLANK: Inputs = {
  decision: "",
  unknown: "",
  ifA: "",
  ifB: "",
  changes: "",
  gettable: "",
};

function isChanges(v: unknown): v is Changes {
  return v === "" || v === "same" || v === "different" || v === "unsure";
}
function isGettable(v: unknown): v is Gettable {
  return v === "" || v === "cheap" || v === "costly" || v === "unknowable";
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      unknown: typeof v.unknown === "string" ? v.unknown : BLANK.unknown,
      ifA: typeof v.ifA === "string" ? v.ifA : BLANK.ifA,
      ifB: typeof v.ifB === "string" ? v.ifB : BLANK.ifB,
      changes: isChanges(v.changes) ? v.changes : BLANK.changes,
      gettable: isGettable(v.gettable) ? v.gettable : BLANK.gettable,
    };
  } catch {
    return BLANK;
  }
}

// ---- handing the value-of-information check to another person -----------
//
// "I need to know more first" is a verdict people rarely reach alone — it's
// argued over with the person the decision is with, or the advisor who might see
// that a fact you're chasing wouldn't move the call, or that one you aren't
// asking would. Peer-sharing (data/share.ts) hands the whole check over by link:
// the call, the one thing you feel you must find out, what you'd do under each
// way it turns out, and your read on whether it changes the move and how gettable
// it is. The recipient can change any of it to argue back — the point of the
// exercise is exactly that disagreement. The payload rides in the URL fragment,
// so it reaches no server, only whoever the link is handed to.

/** Collapse whitespace and cap a shared string so a link stays a link. */
function capStr(s: string, n: number): string {
  return s.replace(/\s+/g, " ").trim().slice(0, n);
}

/** True when the tool holds no real work. A share link is adopted whole ONLY
 *  into a blank tool, so this is the gate that protects a check in progress. */
function isBlankInputs(i: Inputs): boolean {
  return (
    !i.decision.trim() &&
    !i.unknown.trim() &&
    !i.ifA.trim() &&
    !i.ifB.trim() &&
    i.changes === "" &&
    i.gettable === ""
  );
}

/** The encodable subset of a check: every field, free text capped so a link
 *  stays a link. */
function sharePayload(i: Inputs): Record<string, unknown> {
  return {
    decision: capStr(i.decision, 140),
    unknown: capStr(i.unknown, 200),
    ifA: capStr(i.ifA, 200),
    ifB: capStr(i.ifB, 200),
    changes: i.changes,
    gettable: i.gettable,
  };
}

/** Rebuild Inputs from a decoded share payload, reusing the same validators
 *  loadInputs trusts for localStorage, so a truncated or hand-edited link
 *  degrades to blank fields, never a throw. Returns null when nothing
 *  meaningful decoded. */
function coerceShared(data: unknown): Inputs | null {
  if (!data || typeof data !== "object") return null;
  const v = data as Partial<Inputs>;
  const out: Inputs = {
    decision: typeof v.decision === "string" ? capStr(v.decision, 140) : "",
    unknown: typeof v.unknown === "string" ? capStr(v.unknown, 200) : "",
    ifA: typeof v.ifA === "string" ? capStr(v.ifA, 200) : "",
    ifB: typeof v.ifB === "string" ? capStr(v.ifB, 200) : "",
    changes: isChanges(v.changes) ? v.changes : "",
    gettable: isGettable(v.gettable) ? v.gettable : "",
  };
  return isBlankInputs(out) ? null : out;
}

/** A short, honest read of a shared check for the "someone shared this" card. */
function describeShared(i: Inputs): { subject: string; line: string } {
  const subject = i.decision.trim() || "A value-of-information check";
  const line = i.unknown.trim()
    ? `Waiting on: ${capStr(i.unknown, 90)}${i.unknown.trim().length > 90 ? "…" : ""}`
    : "";
  return { subject, line };
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase =
  "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff =
  "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

export default function EnoughClient() {
  const [inp, setInp] = useState<Inputs>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);
  // A check handed in by a share link. `adoptedShare` — adopted whole into a
  // blank tool (banner). `pendingShare` — the tool already held work, so the
  // shared one waits in a card. `copied` — the transient copy confirmation.
  const [adoptedShare, setAdoptedShare] = useState(false);
  const [pendingShare, setPendingShare] = useState<Inputs | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loaded = loadInputs();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.decision.trim();
    let next = seeded ? { ...loaded, decision: carried } : loaded;

    // A share link hands a WHOLE check in from another person — all-or-nothing,
    // adopted only into a blank tool so two people's answers can't blend. If the
    // tool already holds work, surface the shared check as a card to open or
    // dismiss rather than clobbering it.
    const shared = coerceShared(readShare("enough"));
    let adopted = false;
    let pending: Inputs | null = null;
    if (shared) {
      if (isBlankInputs(next)) {
        next = shared;
        adopted = true;
      } else {
        pending = shared;
      }
    }
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setInp(next);
    setHydrated(true);
    if (seeded) setCarriedSeed(carried);
    if (adopted) setAdoptedShare(true);
    if (pending) setPendingShare(pending);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (carried) clearCarriedSubject();
    if (shared) clearShare();
  }, []);

  // Clear the copy-confirmation timer on unmount so it can't fire into a gone
  // component.
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  // Build the share link and put it on the clipboard. Encodes the whole check
  // into the URL fragment — never a server — with the clipboard-then-execCommand
  // fallback the other adopters use.
  const copyShareLink = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = encodeShare("enough", sharePayload(inp));
    if (!token) return;
    const link = `${window.location.origin}/enough#${SHARE_PARAM}=${token}`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2500);
    }
  }, [inp]);

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
  const unknown = inp.unknown.trim();
  const hasSubstance = decision !== "" && unknown !== "";
  const pendingDesc = pendingShare ? describeShared(pendingShare) : null;
  const bothFilled = inp.ifA.trim() !== "" && inp.ifB.trim() !== "";
  // A light nudge only: identical text in both boxes is the plainest possible
  // sign the fact can't move the call — worth naming, never worth deciding for
  // the person, so the explicit "does your move change?" chip still does the work.
  const looksIdentical = useMemo(
    () => bothFilled && norm(inp.ifA) === norm(inp.ifB),
    [bothFilled, inp.ifA, inp.ifB]
  );

  return (
    <div>
      {/* ---- Shared with you: adopted whole into a blank tool ---- */}
      {adoptedShare ? (
        <div className="mb-5 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--card)] p-4">
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            <span className="font-medium">
              You&rsquo;re looking at a check someone shared with you.
            </span>{" "}
            The call and what they&rsquo;d do each way are theirs &mdash; change any
            answer to argue back, or{" "}
            <button
              type="button"
              onClick={() => {
                setInp(BLANK);
                setAdoptedShare(false);
              }}
              className="font-medium text-[var(--accent)] underline underline-offset-2 hover:opacity-70 transition-opacity"
            >
              start from a blank tool
            </button>
            .
          </p>
        </div>
      ) : null}

      {/* ---- Shared with you: held, because the tool already had work ---- */}
      {pendingShare && pendingDesc ? (
        <div className="mb-5 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--card)] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            A check was shared with you
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--foreground)] leading-relaxed">
            {pendingDesc.subject}
          </p>
          {pendingDesc.line ? (
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
              {pendingDesc.line}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            You already have a check in progress here. Opening theirs replaces
            what&rsquo;s in the tool now.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setInp(pendingShare);
                setPendingShare(null);
              }}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
            >
              Open it in the tool
            </button>
            <button
              type="button"
              onClick={() => setPendingShare(null)}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

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
        {showExample ? <EnoughExample /> : null}
      </div>

      {/* ---- The call and the thing you're waiting to know ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="enough-decision" className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you trying to decide?
        </label>
        <input
          id="enough-decision"
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Take the job in the other city"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
          onClear={() => {
            set("decision", "");
            setCarriedSeed("");
          }}
        />

        <label htmlFor="enough-unknown" className="mt-5 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What do you keep feeling you need to find out first?
        </label>
        <input
          id="enough-unknown"
          type="text"
          value={inp.unknown}
          onChange={(e) => set("unknown", e.target.value)}
          placeholder="e.g. What the rent would actually be downtown"
          className={inputClass}
        />
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          One specific thing, not &ldquo;more information.&rdquo; The fact, the
          number, the answer, the opinion you&rsquo;ve been telling yourself you
          have to have before you can move. If several are jostling, take the one
          you&rsquo;d chase first &mdash; you can run the others after.
        </p>
      </div>

      {/* ---- Play it out both ways ---- */}
      {decision && unknown ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Now play it out both ways
          </p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            Here is the whole test. Don&rsquo;t ask whether you&rsquo;d <em>like</em>{" "}
            to know &mdash; ask what you&rsquo;d actually <em>do</em> under each way
            it could turn out. Write the move, not the feeling.
          </p>

          <label htmlFor="enough-if-a" className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            If it turns out one way, I&rsquo;d&hellip;
          </label>
          <input
            id="enough-if-a"
            type="text"
            value={inp.ifA}
            onChange={(e) => set("ifA", e.target.value)}
            placeholder="e.g. If rent is normal — take the job"
            className={inputClass}
          />

          <label htmlFor="enough-if-b" className="mt-4 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            If it turns out the other way, I&rsquo;d&hellip;
          </label>
          <input
            id="enough-if-b"
            type="text"
            value={inp.ifB}
            onChange={(e) => set("ifB", e.target.value)}
            placeholder="e.g. If rent is steep — still take it, the salary covers it"
            className={inputClass}
          />

          {looksIdentical ? (
            <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-xs text-[var(--muted)] leading-relaxed">
              You&rsquo;ve written the same move in both boxes. That&rsquo;s the
              plainest version of the whole finding: if the answer can&rsquo;t
              change what you do, it can&rsquo;t be worth waiting on.
            </p>
          ) : null}

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              Reading those two back &mdash; does your move change?
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {(
                [
                  ["same", "Same move either way"],
                  ["different", "It changes what I'd do"],
                  ["unsure", "I'm not sure yet"],
                ] as [Changes, string][]
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set("changes", inp.changes === val ? "" : val)}
                  className={`${chipBase} ${inp.changes === val ? chipOn : chipOff}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ---- Can you get it? (only when it would change the call) ---- */}
      {decision && unknown && inp.changes === "different" ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Then it&rsquo;s worth knowing &mdash; can you get it?
          </p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            A fact that would flip the call has real value. But value isn&rsquo;t
            the whole story: it&rsquo;s only worth chasing if you can get it{" "}
            <em>cheaply</em>{" "}and <em>before the decision has to be made</em>. How
            hard is this one to actually learn?
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {(
              [
                ["cheap", "Cheaply, and in time"],
                ["costly", "Only at real cost, or too slowly"],
                ["unknowable", "Can't really be known in time"],
              ] as [Gettable, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() =>
                  set("gettable", inp.gettable === val ? "" : val)
                }
                className={`${chipBase} ${inp.gettable === val ? chipOn : chipOff}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---- The read + handoff ---- */}
      <AnnounceAnswer message={readHeadline(inp)} />
      <Verdict inp={inp} />

      {/* ---- Hand it to someone: the same check, carried person to person ---- */}
      {hasSubstance ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Get a second read on it
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            &ldquo;I need to know more first&rdquo; is worth arguing over with
            someone who can see it from outside &mdash; they might spot that the
            fact you&rsquo;re chasing wouldn&rsquo;t change your move, or that one
            you aren&rsquo;t asking would. Copy a link that carries this whole check
            &mdash; the call, the thing you&rsquo;re waiting on, and what you&rsquo;d
            do each way &mdash; so they can open exactly what you weighed and change
            any answer to argue back. It rides inside the link itself and is sent to
            no server; only whoever you hand it to can read it.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyShareLink}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              {copied ? "Copied — the link is on your clipboard" : "Copy a link to this check"}
            </button>
          </div>
        </div>
      ) : null}

      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK);
          setAdoptedShare(false);
          setPendingShare(null);
        }}
      />
    </div>
  );
}

/** The read's headline as plain text for the live region — mirrors Verdict's
 *  branches; null while it's still only prompting. */
function readHeadline(inp: Inputs): string | null {
  if (!inp.decision.trim() || !inp.unknown.trim() || inp.changes === "") return null;
  const head =
    inp.changes === "unsure"
      ? "Then get concrete before you go get anything."
      : inp.changes === "same"
        ? "You already have enough."
        : inp.gettable === ""
          ? "This one’s worth knowing."
          : inp.gettable === "cheap"
            ? "Go get it — cheaply."
            : "More waiting won’t buy the answer.";
  return `The read: ${head}`;
}

function Verdict({ inp }: { inp: Inputs }) {
  const decision = inp.decision.trim();
  const unknown = inp.unknown.trim();
  const subject = inp.decision;

  // ---- Nothing to read yet ----
  if (!decision || !unknown) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Name the call and the one thing you keep feeling you need to know first,
          then play it out both ways &mdash; and the read appears: whether the
          answer would actually change your move, or whether you already have
          enough and the waiting is the decision in disguise.
        </p>
      </div>
    );
  }

  // ---- Played it out, but hasn't judged the split ----
  if (inp.changes === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Write what you&rsquo;d do under each way it could turn out, then mark
          whether your move changes. That one judgement is the whole test &mdash;
          everything the read says turns on it.
        </p>
      </div>
    );
  }

  // ---- Not sure whether it changes the call ----
  if (inp.changes === "unsure") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Then get concrete before you go get anything.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          &ldquo;Not sure&rdquo; usually means the two outcomes are still abstract.
          Finish both sentences with an actual move &mdash; <em>if it&rsquo;s this,
          I&rsquo;d do that</em>{" "}&mdash; specific enough that you can hold the two
          side by side and see whether they differ. If, once they&rsquo;re both
          concrete, you honestly can&rsquo;t make them come out different,
          that&rsquo;s not a gap in the exercise. That <em>is</em>{" "}the finding: the
          fact wouldn&rsquo;t change your call, so you don&rsquo;t need it to
          decide.
        </p>
        <PrintNote />
      </div>
    );
  }

  // ---- You already have enough ----
  if (inp.changes === "same") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          You already have enough.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          By your own answer, the thing you&rsquo;ve been waiting to learn
          wouldn&rsquo;t change what you do &mdash; the move is the same whichever
          way it lands. That means its decision value is zero: not small, zero. More
          research here can&rsquo;t improve the call, it can only postpone it. What
          you have isn&rsquo;t a shortage of information; it&rsquo;s a reluctance to
          commit, and it&rsquo;s been borrowing the good name of diligence. The
          honest next step isn&rsquo;t to know more. It&rsquo;s to decide.
        </p>

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            So decide it &mdash; with what you have
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/weigh", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Two options, still close? Take it to the flip point &rarr;
              </Link>{" "}
              Find the probability where the call tips, and judge only which side
              you&rsquo;re on &mdash; no missing fact required.
            </li>
            <li>
              <Link
                href={withSubject("/compare", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Several on the table? Score them past the halo &rarr;
              </Link>{" "}
              Rate each option a factor at a time on what you already know, so one
              strong impression can&rsquo;t decide it for you.
            </li>
            <li>
              <Link
                href={withSubject("/decide", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Ready to commit? Log what you expect &rarr;
              </Link>{" "}
              Put the call and your forecast on the record now, so reality can grade
              it later &mdash; not your memory.
            </li>
          </ul>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Or be honest about what&rsquo;s really in the way
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            If you have enough and still can&rsquo;t move, the block isn&rsquo;t a
            missing fact &mdash; it&rsquo;s something else wearing the fact&rsquo;s
            clothes. Name it:
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/act", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                It&rsquo;s the doing I&rsquo;m avoiding &rarr;
              </Link>{" "}
              Turn the call into the smallest first move that fires on a cue &mdash;
              the gap is between deciding and starting, not deciding and knowing.
            </li>
            <li>
              <Link
                href={withSubject("/cool", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                I&rsquo;m too wound up to trust myself &rarr;
              </Link>{" "}
              If the stall is heat, not fog, park it and decide it cold &mdash;
              researching is just how the pressure is leaking out.
            </li>
            <li>
              <Link
                href={withSubject("/advise", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                I can&rsquo;t see my own call straight &rarr;
              </Link>{" "}
              Put it in a friend&rsquo;s name. You&rsquo;d tell them they have
              enough; the trouble is only that it&rsquo;s yours.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ---- It would change the call (inp.changes === "different") ----
  if (inp.gettable === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          This one&rsquo;s worth knowing.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Good &mdash; you&rsquo;ve found a fact that would actually flip the call,
          which is rarer than it feels and exactly where your worry should go. But
          worth knowing isn&rsquo;t the same as worth waiting for. Say how hard it
          is to get, above, and the read will tell you whether to chase it or decide
          without it.
        </p>
      </div>
    );
  }

  if (inp.gettable === "cheap") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Go get it &mdash; cheaply.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          This is the one case where more information earns its keep: it would
          change the call, and you can get it cheaply and in time. So this
          isn&rsquo;t paralysis &mdash; it&rsquo;s the right next move. The only
          discipline is to go after <em>this</em>{" "}fact and then decide, rather than
          letting a real question become a licence to research everything else too.
          The best version isn&rsquo;t reading more &mdash; it&rsquo;s the smallest
          real test that produces the answer directly.
        </p>
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            The cheapest way to learn it
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/test", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Don&rsquo;t predict it &mdash; test it &rarr;
              </Link>{" "}
              Design the smallest real experiment that would settle the fact, with
              the result you&rsquo;d act on named in advance so it can&rsquo;t be
              explained away.
            </li>
            <li>
              <Link
                href={withSubject("/outside", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                If it&rsquo;s a &ldquo;how long / how likely,&rdquo; use the base rate &rarr;
              </Link>{" "}
              What happened to everyone who tried something like this usually answers
              the question faster and truer than another round of your own guessing.
            </li>
          </ul>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            One guard: decide now what answer would send you which way. A fact
            you&rsquo;ll re-interpret after you see it isn&rsquo;t information &mdash;
            it&rsquo;s another way to not decide.
          </p>
        </div>
        <PrintNote />
      </div>
    );
  }

  // costly or unknowable
  const unknowable = inp.gettable === "unknowable";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        The read
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        More waiting won&rsquo;t buy the answer.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        {unknowable
          ? "The fact would change the call — but it can't be known in time, and no amount of waiting will change that. "
          : "The fact would change the call — but getting it costs more, in money or time, than the better decision it would buy. "}
        So the choice isn&rsquo;t really &ldquo;decide now or learn first.&rdquo;
        It&rsquo;s &ldquo;decide now, or decide the same way later, having paid to
        wait.&rdquo; The honest move is to decide <em>under</em>{" "}the uncertainty
        &mdash; treat the thing you can&rsquo;t know as a probability, not a
        blank &mdash; and set something to catch it if it lands the wrong way.
      </p>
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Decide without it &mdash; but not blind
        </p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link
              href={withSubject("/weigh", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Take it to the flip point &rarr;
            </Link>{" "}
            Put the unknown in as your honest probability and find the line where
            the call tips &mdash; you don&rsquo;t need the exact odds, only which
            side of the line you&rsquo;re on.
          </li>
          <li>
            <Link
              href={withSubject("/tripwire", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Set a tripwire for the way it could go wrong &rarr;
            </Link>{" "}
            Name the observable signal that would mean the unknown resolved against
            you, and the date you&rsquo;ll look &mdash; so a bet made under
            uncertainty can&rsquo;t quietly curdle before you notice.
          </li>
        </ul>
      </div>
      <PrintNote />
    </div>
  );
}

/** The keep-a-copy affordance, shown under a real read. Matches the flip point:
 *  a worked call is worth holding, or handing to whoever the decision is with. */
function PrintNote() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <PrintButton label="Print / Save as PDF" />
    </div>
  );
}

/**
 * The worked example, rendered read-only. Walks the canonical value-of-
 * information contrast on one decision — the fact you were waiting on that
 * wouldn't have moved the call, and the one you weren't asking that would have —
 * so a newcomer sees the whole test without a character landing in their own
 * fields or storage.
 */
function EnoughExample() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example &mdash; nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        You&rsquo;ve been offered a job in another city and you keep saying you
        can&rsquo;t decide until you know{" "}
        <span className="font-medium">exactly what the rent would be downtown</span>.
        So you open another listings tab. Run the test instead.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Play it out both ways
        </p>
        <ul className="mt-2 space-y-2.5 text-sm text-[var(--foreground)] leading-relaxed">
          <li>
            <span className="font-medium">If rent is normal,</span>{" "}you&rsquo;d take
            the job.
          </li>
          <li>
            <span className="font-medium">If rent is steep,</span>{" "}you&rsquo;d&hellip;
            still take it &mdash; the salary covers either, and the job is the whole
            reason you&rsquo;re moving.
          </li>
        </ul>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Same move either way. The rent number has been feeling like the crux, but
          it can&rsquo;t change the call &mdash; so all those tabs were delay, not
          diligence. <span className="font-medium">You already have enough on
          that.</span>
        </p>
      </div>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        Now the fact you <em>weren&rsquo;t</em>{" "}asking:{" "}
        <span className="font-medium">is the manager someone you could work
        for?</span>{" "}If yes, you&rsquo;d go; if no, you&rsquo;d pass. That one flips
        the call &mdash; so it&rsquo;s worth a cheap test: ask to meet the team, or
        talk to someone who left. That&rsquo;s where the worry belongs. The tool
        turns &ldquo;I need to know more&rdquo; into <em>which</em>{" "}more, and whether
        it would change anything at all.
      </p>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank &mdash; run it on <em>your</em> call.
      </p>
    </div>
  );
}
