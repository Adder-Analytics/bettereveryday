"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ClearCallButton from "../components/ClearCallButton";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import PrintButton from "../components/PrintButton";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import {
  encodeShare,
  readShare,
  clearShare,
  decodeShareToken,
  SHARE_PARAM,
} from "../data/share";
import {
  parseNumber,
  formatNumber,
  roundStats,
  collapsedOnto,
  SPREAD_HEADLINE,
  roundHeadline,
  type RoundStats,
} from "../data/round";

/**
 * Before Anyone Speaks (/round)
 *
 * The instrument for a group that has to land on one number — how long the
 * project will take, what to budget, what to offer, how likely the launch is to
 * work. The usual way is to talk it out, and talking means someone says a
 * number first; everyone after adjusts from it, and the group ends up with one
 * person's guess and everyone's agreement. This runs the fix from *Noise*
 * (estimate–talk–estimate), planning poker and the Delphi method:
 *
 *   1. Everyone commits a number privately — passing one device round the
 *      table, or by message, each person sending a reply link only to the
 *      organizer.
 *   2. All the numbers are revealed at once. The spread is the finding: tight
 *      means you already agree (take the middle and stop), wide means you're
 *      not picturing the same thing — and the people at the two ends speak
 *      first, about what they were counting, not about the number.
 *   3. Optionally, everyone estimates again, privately. The group's number is
 *      the middle of the last round, with a check for a second round that
 *      collapsed onto one person's first answer.
 *
 * Built shareable from the start — the only tool whose whole point is several
 * people — and still sent nowhere: invites and replies ride in the link
 * fragment, which no server sees. The arithmetic lives in data/round.ts.
 */

const STORE_KEY = "round:v1";
const MAX_PEOPLE = 20;

type RoundNo = 1 | 2;
type Phase = "setup" | "blind" | "reveal";

type Person = {
  id: string;
  name: string;
  /** Round one and round two answers. */
  v: [number | null, number | null];
  /** The one-line reason given with each answer. */
  why: [string, string];
};

type State = {
  question: string;
  unit: string;
  people: Person[];
  round: RoundNo;
  phase: Phase;
};

function newId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function blankPerson(): Person {
  return { id: newId(), name: "", v: [null, null], why: ["", ""] };
}

const BLANK: State = {
  question: "",
  unit: "",
  people: [],
  round: 1,
  phase: "setup",
};

function freshBlank(): State {
  return { ...BLANK, people: [blankPerson(), blankPerson(), blankPerson()] };
}

function capStr(s: string, n: number): string {
  return s.replace(/\s+/g, " ").trim().slice(0, n);
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function loadState(): State {
  if (typeof window === "undefined") return freshBlank();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return freshBlank();
    const v = JSON.parse(raw) as Partial<State>;
    const people = Array.isArray(v.people)
      ? v.people.slice(0, MAX_PEOPLE).map((p): Person => {
          const q = (p ?? {}) as Partial<Person>;
          const vv = Array.isArray(q.v) ? q.v : [];
          const ww = Array.isArray(q.why) ? q.why : [];
          return {
            id: typeof q.id === "string" ? q.id : newId(),
            name: typeof q.name === "string" ? q.name : "",
            v: [isNum(vv[0]) ? vv[0] : null, isNum(vv[1]) ? vv[1] : null],
            why: [
              typeof ww[0] === "string" ? ww[0] : "",
              typeof ww[1] === "string" ? ww[1] : "",
            ],
          };
        })
      : [];
    return {
      question: typeof v.question === "string" ? v.question : "",
      unit: typeof v.unit === "string" ? v.unit : "",
      people: people.length ? people : freshBlank().people,
      round: v.round === 2 ? 2 : 1,
      phase: v.phase === "blind" || v.phase === "reveal" ? v.phase : "setup",
    };
  } catch {
    return freshBlank();
  }
}

/** The name to show for a person, falling back to their seat. */
function label(p: Person, i: number): string {
  return p.name.trim() || `Person ${i + 1}`;
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

// ---- by message: the invite and the reply --------------------------------
//
// Not every group is in one room. The organizer copies an invite link (the
// question, the unit, which round); each person opens it, answers privately,
// and gets a reply link to send to the organizer *only* — never the group
// thread, where the first reply would anchor everyone after it. The organizer
// pastes the replies back in. Both ride in the URL fragment, so neither reaches
// any server.

type Invite = { q: string; u: string; r: RoundNo };
type Reply = { q: string; r: RoundNo; n: string; v: number; w: string };

function coerceInvite(d: unknown): Invite | null {
  if (!d || typeof d !== "object") return null;
  const x = d as Partial<Invite>;
  if (typeof x.q !== "string" || !x.q.trim()) return null;
  return {
    q: capStr(x.q, 200),
    u: typeof x.u === "string" ? capStr(x.u, 30) : "",
    r: x.r === 2 ? 2 : 1,
  };
}

function coerceReply(d: unknown): Reply | null {
  if (!d || typeof d !== "object") return null;
  const x = d as Partial<Reply>;
  if (typeof x.n !== "string" || !x.n.trim() || !isNum(x.v)) return null;
  return {
    q: typeof x.q === "string" ? capStr(x.q, 200) : "",
    r: x.r === 2 ? 2 : 1,
    n: capStr(x.n, 40),
    v: x.v,
    w: typeof x.w === "string" ? capStr(x.w, 160) : "",
  };
}

/** Every reply token in a pasted blob — links, bare tokens, one per line or not. */
function repliesIn(text: string): Reply[] {
  const out: Reply[] = [];
  const re = new RegExp(`(?:^|[#&\\s])${SHARE_PARAM}=([A-Za-z0-9_-]+)`, "g");
  for (const m of text.matchAll(re)) {
    const r = coerceReply(decodeShareToken("round-reply", m[1]));
    if (r) out.push(r);
  }
  return out;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const primaryBtn =
  "text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
const secondaryBtn =
  "text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors";
const eyebrow =
  "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card =
  "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const linkClass =
  "text-[var(--accent)] hover:opacity-70 transition-opacity font-medium";

export default function RoundClient() {
  const [st, setSt] = useState<State>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);
  // The person whose private turn is open on this device, if any — never
  // persisted, so a reload can't leave someone's half-typed answer on screen.
  const [turnId, setTurnId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftWhy, setDraftWhy] = useState("");
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [pasteNote, setPasteNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passRef = useRef<HTMLHeadingElement | null>(null);
  const revealRef = useRef<HTMLHeadingElement | null>(null);
  // Where focus should land after the view under it is swapped out: the round's
  // heading after a turn locks (the form that held focus is gone), the reveal's
  // heading after the reveal. Moved in an effect, after the commit, so the
  // target is on the page when it's asked for.
  const [focusTo, setFocusTo] = useState<{ el: "pass" | "reveal"; n: number } | null>(null);

  useEffect(() => {
    const inv = coerceInvite(readShare("round-invite"));
    if (inv) {
      // Answering someone else's round: render the reply view and leave this
      // browser's own round untouched.
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the address bar on mount. */
      setInvite(inv);
      clearShare();
      setHydrated(true);
      return;
    }
    let next = loadState();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !next.question.trim();
    if (seeded) next = { ...next, question: carried };

    // The organizer clicked a reply link instead of pasting it: take it in.
    const reply = coerceReply(readShare("round-reply"));
    let note: string | null = null;
    if (reply) {
      const res = applyReplies(next, [reply]);
      next = res.state;
      note = res.note;
    }
     
    setSt(next);
    setHydrated(true);
    if (seeded) setCarriedSeed(carried);
    if (note) setPasteNote(note);
     
    if (carried) clearCarriedSubject();
    if (reply) clearShare();
  }, []);

  useEffect(() => {
    if (!hydrated || invite || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(st));
    } catch {
      /* storage full or blocked — the round still works, just won't persist */
    }
  }, [st, hydrated, invite]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!focusTo) return;
    (focusTo.el === "pass" ? passRef : revealRef).current?.focus();
  }, [focusTo]);

  const flashCopied = useCallback((key: string) => {
    setCopied(key);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 2500);
  }, []);

  if (invite) return <ReplyView invite={invite} />;

  const r = st.round;
  const ri = r - 1;
  const people = st.people;
  const answered = people.filter((p) => p.v[ri] !== null);
  const waiting = people.filter((p) => p.v[ri] === null);
  const turnPerson = turnId ? people.find((p) => p.id === turnId) ?? null : null;
  const unit = st.unit.trim();
  const question = st.question.trim();

  const update = (fn: (s: State) => State) => setSt((s) => fn(s));
  const setPerson = (id: string, fn: (p: Person) => Person) =>
    update((s) => ({ ...s, people: s.people.map((p) => (p.id === id ? fn(p) : p)) }));

  const draftNum = parseNumber(draft);

  const openTurn = (id: string) => {
    setTurnId(id);
    setDraft("");
    setDraftWhy("");
    setLockedMsg(null);
  };

  const lockTurn = () => {
    if (!turnPerson || draftNum === null) return;
    const id = turnPerson.id;
    setPerson(id, (p) => {
      const v: Person["v"] = [...p.v];
      const why: Person["why"] = [...p.why];
      v[ri] = draftNum;
      why[ri] = capStr(draftWhy, 160);
      return { ...p, v, why };
    });
    setTurnId(null);
    setDraft("");
    setDraftWhy("");
    const after = people.filter((p) => p.v[ri] === null && p.id !== id);
    const nextIdx = after.length ? people.indexOf(after[0]) : -1;
    setLockedMsg(
      after.length
        ? `Locked in. Hand the device to ${label(after[0], nextIdx)}.`
        : "Locked in. Everyone has answered — reveal them all at once."
    );
    setFocusTo((f) => ({ el: "pass", n: (f?.n ?? 0) + 1 }));
  };

  const reveal = () => {
    setTurnId(null);
    setLockedMsg(null);
    setPasteNote(null);
    update((s) => ({ ...s, phase: "reveal" }));
    setFocusTo((f) => ({ el: "reveal", n: (f?.n ?? 0) + 1 }));
  };

  const startRoundTwo = () => {
    setLockedMsg(null);
    update((s) => ({
      ...s,
      round: 2,
      phase: "blind",
      people: s.people.map((p) => ({ ...p, v: [p.v[0], null], why: [p.why[0], ""] })),
    }));
    setFocusTo((f) => ({ el: "pass", n: (f?.n ?? 0) + 1 }));
  };

  const copyInvite = async () => {
    const token = encodeShare("round-invite", { q: capStr(st.question, 200), u: capStr(st.unit, 30), r });
    if (!token) return;
    const ok = await copyText(`${window.location.origin}/round#${SHARE_PARAM}=${token}`);
    if (ok) flashCopied("invite");
  };

  const takePasted = () => {
    const replies = repliesIn(pasteText);
    if (!replies.length) {
      setPasteNote("No reply links found in that text. Paste the links people sent you, one or several at once.");
      return;
    }
    const res = applyReplies(st, replies);
    setSt(res.state);
    setPasteNote(res.note);
    setPasteText("");
  };

  const copySummary = async () => {
    const ok = await copyText(summaryText(st));
    if (ok) flashCopied("summary");
  };

  const withUnit = (n: number) => `${formatNumber(n)}${unit ? ` ${unit}` : ""}`;
  const stats1 = roundStats(people.map((p) => p.v[0]).filter((v): v is number => v !== null));
  const stats2 = roundStats(people.map((p) => p.v[1]).filter((v): v is number => v !== null));
  const shownStats = r === 2 ? stats2 : stats1;

  const announce =
    st.phase === "reveal" && shownStats
      ? r === 2 && shownStats.spread !== "wide"
        ? `Round two: ${roundHeadline(2, shownStats, withUnit)}`
        : `${r === 2 ? "Round two" : "Round one"}: ${roundHeadline(r, shownStats, withUnit)} The middle is ${withUnit(shownStats.middle)}.`
      : st.phase === "blind"
        ? lockedMsg
        : null;

  return (
    <div>
      {/* ---- New here? A read-only worked example ---- */}
      {st.phase === "setup" ? (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowExample((s) => !s)}
            className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {showExample ? "Hide the worked example ↑" : "New here? See a worked example ↓"}
          </button>
          {showExample ? <RoundExample /> : null}
        </div>
      ) : null}

      {pasteNote ? (
        <p role="status" className="mb-5 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
          {pasteNote}
        </p>
      ) : null}

      {/* ---- 1. Set up: the question, the unit, the people ---- */}
      {st.phase === "setup" ? (
        <div className={card}>
          <label htmlFor="round-question" className={`block ${eyebrow} mb-2`}>
            What number does the group need?
          </label>
          <input
            id="round-question"
            type="text"
            value={st.question}
            onChange={(e) => update((s) => ({ ...s, question: e.target.value }))}
            placeholder="e.g. How many weeks until the new site can launch?"
            className={inputClass}
          />
          <CarriedNote
            show={carriedSeed !== "" && st.question.trim() === carriedSeed}
            onClear={() => {
              update((s) => ({ ...s, question: "" }));
              setCarriedSeed("");
            }}
          />
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Ask it so the answer is one number: a duration, a cost, a price, a
            count, a percent chance. &ldquo;Should we launch in June?&rdquo; is a
            vote; &ldquo;How many weeks until it&rsquo;s ready?&rdquo; is an
            estimate &mdash; and the estimate is what anchors.
          </p>

          <label htmlFor="round-unit" className={`mt-5 block ${eyebrow} mb-2`}>
            In what unit? <span className="normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <input
            id="round-unit"
            type="text"
            value={st.unit}
            onChange={(e) => update((s) => ({ ...s, unit: e.target.value }))}
            placeholder="e.g. weeks, dollars, % chance"
            className={`${inputClass} sm:max-w-xs`}
          />

          <fieldset className="mt-5">
            <legend className={`${eyebrow} mb-2`}>Who&rsquo;s estimating?</legend>
            <ul className="space-y-2">
              {people.map((p, i) => (
                <li key={p.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    aria-label={`Name of person ${i + 1}`}
                    value={p.name}
                    onChange={(e) => setPerson(p.id, (q) => ({ ...q, name: e.target.value }))}
                    placeholder={`Person ${i + 1}`}
                    className={inputClass}
                  />
                  {people.length > 2 ? (
                    <button
                      type="button"
                      onClick={() => update((s) => ({ ...s, people: s.people.filter((q) => q.id !== p.id) }))}
                      aria-label={`Remove ${label(p, i)}`}
                      className="shrink-0 text-sm px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
            {people.length < MAX_PEOPLE ? (
              <button
                type="button"
                onClick={() => update((s) => ({ ...s, people: [...s.people, blankPerson()] }))}
                className="mt-3 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                + Add a person
              </button>
            ) : null}
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              Names only label the answers on this screen. Anyone answering by
              message types their own name, and it&rsquo;s matched here.
            </p>
          </fieldset>

          <div className="mt-6">
            <button
              type="button"
              disabled={!question}
              onClick={() => update((s) => ({ ...s, phase: "blind" }))}
              className={primaryBtn}
            >
              Start the blind round &rarr;
            </button>
            {!question ? (
              <p className="mt-2 text-xs text-[var(--muted)]">Write the question first.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ---- The question, pinned once the round starts ---- */}
      {st.phase !== "setup" ? (
        <div className="mb-5">
          <p className={eyebrow}>The question</p>
          <p className="mt-1 text-lg font-medium text-[var(--foreground)] leading-snug">
            {question}
            {unit ? <span className="text-[var(--muted)] font-normal"> ({unit})</span> : null}
          </p>
        </div>
      ) : null}

      {/* ---- 2. The blind round: pass the device, or collect by message ---- */}
      {st.phase === "blind" ? (
        <div className={card}>
          <h2 ref={passRef} tabIndex={-1} className={`${eyebrow} focus:outline-none`}>
            {r === 2 ? "Round two — estimate again, privately" : "Round one — everyone answers privately"}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            {r === 2
              ? "You've heard the reasons. Now each person gives their own number again, alone — move as far as the reasons moved you, and no further than that. Changing your mind is allowed. Moving to match the loudest voice isn't the point."
              : "Pass this device round the table. Each person taps their name, types a number and one line on why, and locks it in. Nobody sees anyone else's until everyone has answered. Don't say your number out loud. That's the whole trick."}
          </p>

          {turnPerson ? (
            <TurnPanel
              key={turnPerson.id}
              name={label(turnPerson, people.indexOf(turnPerson))}
              unit={unit}
              round={r}
              first={r === 2 ? turnPerson.v[0] : null}
              firstWhy={r === 2 ? turnPerson.why[0] : ""}
              draft={draft}
              setDraft={setDraft}
              draftWhy={draftWhy}
              setDraftWhy={setDraftWhy}
              valid={draftNum !== null}
              onLock={lockTurn}
              onCancel={() => setTurnId(null)}
            />
          ) : (
            <>
              {lockedMsg ? (
                <p className="mt-4 text-sm font-medium text-[var(--foreground)]">{lockedMsg}</p>
              ) : null}
              <ul className="mt-4 space-y-2" aria-label="Who has answered">
                {people.map((p, i) => {
                  const done = p.v[ri] !== null;
                  return (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2">
                      <span className="text-sm text-[var(--foreground)]">
                        {label(p, i)}
                        <span className="ml-2 text-xs text-[var(--muted)]">
                          {done ? "✓ locked in" : "waiting"}
                        </span>
                      </span>
                      {done ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPerson(p.id, (q) => {
                              const v: Person["v"] = [...q.v];
                              v[ri] = null;
                              return { ...q, v };
                            })
                          }
                          aria-label={`Clear ${label(p, i)}'s answer without showing it`}
                          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                          Redo
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openTurn(p.id)}
                          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:opacity-80 transition-opacity"
                        >
                          I&rsquo;m {label(p, i)}{" "}&mdash; my turn
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={answered.length < 2}
                  onClick={reveal}
                  className={primaryBtn}
                >
                  {waiting.length && answered.length >= 2
                    ? `Reveal the ${answered.length} so far`
                    : "Reveal them all at once"}
                </button>
                {r === 1 ? (
                  <button
                    type="button"
                    onClick={() => update((s) => ({ ...s, phase: "setup" }))}
                    className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    &larr; Change the question or people
                  </button>
                ) : null}
              </div>
              {answered.length < 2 ? (
                <p className="mt-2 text-xs text-[var(--muted)]">At least two answers to reveal.</p>
              ) : waiting.length ? (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Still waiting on {waiting.map((p) => label(p, people.indexOf(p))).join(", ")}. Revealing now leaves them out of this round.
                </p>
              ) : null}

              {/* ---- Not in one room: collect by message ---- */}
              <div className="mt-6 pt-5 border-t border-[var(--border)]">
                <p className={eyebrow}>Not in one room? Collect by message</p>
                <ol className="mt-2 space-y-1.5 text-sm text-[var(--muted)] leading-relaxed list-decimal pl-5">
                  <li>
                    Copy the invite and send it to everyone. It carries only the
                    question, never anyone&rsquo;s answer.
                  </li>
                  <li>
                    Each person answers on their own screen and gets a reply link.{" "}
                    <span className="text-[var(--foreground)]">
                      They send it to you alone, not to the group thread
                    </span>
                    : one number posted where others can see it anchors everyone
                    who answers after.
                  </li>
                  <li>Paste the replies below. Each one fills in that person&rsquo;s answer, still hidden.</li>
                </ol>
                <div className="mt-3">
                  <button type="button" onClick={copyInvite} className={secondaryBtn}>
                    {copied === "invite" ? "Copied — the invite is on your clipboard" : `Copy the round ${r === 2 ? "two" : "one"} invite`}
                  </button>
                </div>
                <label htmlFor="round-paste" className={`mt-4 block ${eyebrow} mb-2`}>
                  Paste replies
                </label>
                <textarea
                  id="round-paste"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={3}
                  placeholder="Paste one or more reply links here"
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={!pasteText.trim()}
                  onClick={takePasted}
                  className={`mt-2 ${secondaryBtn} disabled:opacity-40`}
                >
                  Add these answers (still hidden)
                </button>
                <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                  The invite and the replies travel inside the links themselves and
                  are sent to no server. You can mix both ways in one round.
                </p>
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* ---- 3. The reveal ---- */}
      {st.phase === "reveal" && shownStats ? (
        <RevealCard
          headingRef={revealRef}
          state={st}
          stats={shownStats}
          first={stats1}
          onRoundTwo={startRoundTwo}
          onCopySummary={copySummary}
          summaryCopied={copied === "summary"}
          onNewQuestion={() => {
            setLockedMsg(null);
            setPasteNote(null);
            update((s) => ({
              ...BLANK,
              people: s.people.map((p) => ({ ...p, v: [null, null], why: ["", ""] })),
            }));
          }}
        />
      ) : null}

      <AnnounceAnswer message={announce} />

      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setSt(freshBlank());
          setTurnId(null);
          setLockedMsg(null);
          setPasteNote(null);
        }}
      />
    </div>
  );
}

/** Fold replies into the round: matched to a person by name, or added. */
function applyReplies(s: State, replies: Reply[]): { state: State; note: string } {
  let people = s.people;
  const took: string[] = [];
  const skipped: string[] = [];
  for (const rep of replies) {
    if (rep.r !== s.round || (s.question.trim() && rep.q && norm(rep.q) !== norm(s.question))) {
      skipped.push(rep.n);
      continue;
    }
    const ri = rep.r - 1;
    const idx = people.findIndex((p, i) => norm(label(p, i)) === norm(rep.n));
    const apply = (p: Person): Person => {
      const v: Person["v"] = [...p.v];
      const why: Person["why"] = [...p.why];
      v[ri] = rep.v;
      why[ri] = rep.w;
      return { ...p, name: p.name.trim() ? p.name : rep.n, v, why };
    };
    if (idx >= 0) {
      people = people.map((p, i) => (i === idx ? apply(p) : p));
    } else {
      // Fill an unnamed seat before adding a new one.
      const empty = people.findIndex((p) => !p.name.trim() && p.v[ri] === null);
      if (empty >= 0) people = people.map((p, i) => (i === empty ? apply({ ...p, name: rep.n }) : p));
      else if (people.length < MAX_PEOPLE) people = [...people, apply({ ...blankPerson(), name: rep.n })];
      else {
        skipped.push(rep.n);
        continue;
      }
    }
    took.push(rep.n);
  }
  const phase: Phase = s.phase === "setup" && took.length && s.question.trim() ? "blind" : s.phase;
  const parts: string[] = [];
  if (took.length) parts.push(`Added ${took.length === 1 ? "an answer" : `${took.length} answers`} from ${took.join(", ")}, still hidden.`);
  if (skipped.length)
    parts.push(
      `Left out ${skipped.join(", ")}: ${skipped.length === 1 ? "that reply is" : "those replies are"} for a different question or round.`
    );
  return { state: { ...s, people, phase }, note: parts.join(" ") };
}

/** The whole round as plain text, for pasting into the meeting notes. */
function summaryText(s: State): string {
  const unit = s.unit.trim();
  const fmt = (n: number) => `${formatNumber(n)}${unit ? ` ${unit}` : ""}`;
  const lines = [`Blind round: ${s.question.trim()}`];
  for (const ri of s.round === 2 ? [0, 1] : [0]) {
    const vals = s.people.map((p) => p.v[ri]).filter((v): v is number => v !== null);
    const stats = roundStats(vals);
    lines.push("", `Round ${ri === 0 ? "one" : "two"}:`);
    s.people.forEach((p, i) => {
      const v = p.v[ri];
      if (v === null) return;
      lines.push(`- ${label(p, i)}: ${fmt(v)}${p.why[ri] ? ` (${p.why[ri]})` : ""}`);
    });
    if (stats) lines.push(`Middle ${fmt(stats.middle)}, range ${fmt(stats.low)}–${fmt(stats.high)}. ${ri === 0 ? SPREAD_HEADLINE[stats.spread] : stats.spread === "wide" ? roundHeadline(2, stats, fmt) : ""}`.trim());
  }
  const final = roundStats(
    s.people.map((p) => p.v[s.round - 1]).filter((v): v is number => v !== null)
  );
  if (final) lines.push("", `The group's number: ${fmt(final.middle)}`);
  return lines.join("\n");
}

function TurnPanel(props: {
  name: string;
  unit: string;
  round: RoundNo;
  first: number | null;
  firstWhy: string;
  draft: string;
  setDraft: (s: string) => void;
  draftWhy: string;
  setDraftWhy: (s: string) => void;
  valid: boolean;
  onLock: () => void;
  onCancel: () => void;
}) {
  const { name, unit, round, first, firstWhy, draft, setDraft, draftWhy, setDraftWhy, valid, onLock, onCancel } = props;
  return (
    <form
      className="mt-4 rounded-lg border border-[var(--accent)] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onLock();
      }}
    >
      <p className="text-sm font-medium text-[var(--foreground)]">
        {name}, this screen is just for you.
      </p>
      {round === 2 && first !== null ? (
        <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
          Your first answer was {formatNumber(first)}
          {unit ? ` ${unit}` : ""}
          {firstWhy ? ` — "${firstWhy}"` : ""}.
        </p>
      ) : null}
      <label htmlFor="round-draft" className={`mt-3 block ${eyebrow} mb-2`}>
        Your number{unit ? ` (${unit})` : ""}
      </label>
      <input
        id="round-draft"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="e.g. 12"
        className={`${inputClass} sm:max-w-xs`}
      />
      {draft.trim() && !valid ? (
        <p className="mt-1 text-xs text-[var(--muted)]">
          One number, please: 12, 4.5, 1,200, $30k, or 70%.
        </p>
      ) : null}
      <label htmlFor="round-draft-why" className={`mt-4 block ${eyebrow} mb-2`}>
        One line on why <span className="normal-case tracking-normal font-normal">(optional, shown at the reveal)</span>
      </label>
      <input
        id="round-draft-why"
        type="text"
        autoComplete="off"
        value={draftWhy}
        onChange={(e) => setDraftWhy(e.target.value)}
        placeholder="e.g. Counting two weeks for the legal review"
        className={inputClass}
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!valid} className={primaryBtn}>
          Lock it in and hide it
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Not me &mdash; go back
        </button>
      </div>
    </form>
  );
}

/** A number line with every answer on it — decoration; the list says the same. */
function Strip({ values, stats }: { values: { name: string; v: number }[]; stats: RoundStats }) {
  const span = stats.high - stats.low || 1;
  const pos = (v: number) => (stats.high === stats.low ? 50 : ((v - stats.low) / span) * 100);
  return (
    <div aria-hidden="true" className="mt-4 px-2">
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-[var(--border)]" />
        <div
          className="absolute top-0 bottom-0 w-px bg-[var(--accent)]"
          style={{ left: `${pos(stats.middle)}%` }}
        />
        {values.map((x, i) => (
          <div
            key={i}
            title={`${x.name}: ${formatNumber(x.v)}`}
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--background)] bg-[var(--foreground)]"
            style={{ left: `${pos(x.v)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-[var(--muted)]">
        <span>{formatNumber(stats.low)}</span>
        <span className="text-[var(--accent)]">middle {formatNumber(stats.middle)}</span>
        <span>{formatNumber(stats.high)}</span>
      </div>
    </div>
  );
}

function RevealCard(props: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  state: State;
  stats: RoundStats;
  first: RoundStats | null;
  onRoundTwo: () => void;
  onCopySummary: () => void;
  summaryCopied: boolean;
  onNewQuestion: () => void;
}) {
  const { headingRef, state, stats, first, onRoundTwo, onCopySummary, summaryCopied, onNewQuestion } = props;
  const r = state.round;
  const ri = r - 1;
  const unit = state.unit.trim();
  const fmt = (n: number) => `${formatNumber(n)}${unit ? ` ${unit}` : ""}`;
  const subject = state.question;

  const rows = state.people
    .map((p, i) => ({ p, i, name: label(p, i), v: p.v[ri], why: p.why[ri], v1: p.v[0] }))
    .filter((x): x is typeof x & { v: number } => x.v !== null)
    .sort((a, b) => a.v - b.v);
  const lowRow = rows[0];
  const highRow = rows[rows.length - 1];
  const collapsed = r === 2 ? collapsedOnto(state.people.map((p) => p.v[0]), state.people.map((p) => p.v[1])) : null;
  const collapsedName = collapsed !== null ? label(state.people[collapsed], collapsed) : null;
  const narrowed = r === 2 && first ? first.relSpread - stats.relSpread : 0;

  return (
    <div className={`rounded-xl border ${stats.spread === "wide" ? "border-[var(--border)]" : "border-[var(--accent)]"} bg-[var(--card)] p-5 sm:p-6`}>
      <h2 ref={headingRef} tabIndex={-1} className={`${eyebrow} focus:outline-none`}>
        {r === 2 ? "Round two, revealed" : "Round one, revealed"}
      </h2>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {roundHeadline(r, stats, fmt)}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {stats.n} answers, from {fmt(stats.low)} to {fmt(stats.high)}. The middle is{" "}
        <span className="text-[var(--foreground)] font-medium">{fmt(stats.middle)}</span>.
      </p>

      <Strip values={rows.map((x) => ({ name: x.name, v: x.v }))} stats={stats} />

      <ul className="mt-4 space-y-2">
        {rows.map((x) => (
          <li key={x.p.id} className="text-sm leading-relaxed">
            <span className="font-medium text-[var(--foreground)]">{x.name}</span>
            <span className="text-[var(--foreground)]">: {fmt(x.v)}</span>
            {r === 2 && x.v1 !== null && x.v1 !== x.v ? (
              <span className="text-xs text-[var(--muted)]"> (was {formatNumber(x.v1)})</span>
            ) : null}
            {x.why ? <span className="block text-[var(--muted)]">&ldquo;{x.why}&rdquo;</span> : null}
          </li>
        ))}
      </ul>

      {/* ---- What the spread means ---- */}
      <div className="mt-5 pt-4 border-t border-[var(--border)] text-sm text-[var(--foreground)] leading-relaxed">
        {r === 1 && stats.spread === "tight" ? (
          <p>
            Every answer sits within a fifth of the middle, so you agree about as
            well as independent estimates ever do. Talking it through now would
            mostly add noise: whoever argues hardest would pull the number, not
            whoever knows most. Take the middle, {fmt(stats.middle)}, and spend
            the meeting on something you disagree about.
          </p>
        ) : null}
        {r === 1 && stats.spread === "some" ? (
          <>
            <p>
              Close, but not the same. Give it five minutes, not an hour: the
              lowest and the highest each say what they were counting, then run
              round two or just take the middle, {fmt(stats.middle)}.
            </p>
            <SpeakOrder low={lowRow} high={highRow} fmt={fmt} />
          </>
        ) : null}
        {r === 1 && stats.spread === "wide" ? (
          <>
            <p>
              {stats.ratio !== null && stats.ratio >= 2
                ? `The highest answer is ${formatNumber(stats.ratio)} times the lowest. `
                : ""}
              A spread this wide is almost never a disagreement about the number.
              It means you&rsquo;re picturing different things: a different
              scope, a different idea of &ldquo;done,&rdquo; or a risk or fact that
              one person knows about and the rest don&rsquo;t. That&rsquo;s the
              most useful thing the round can tell you, and a discussion that
              started with one person&rsquo;s number would have buried it.
            </p>
            <SpeakOrder low={lowRow} high={highRow} fmt={fmt} />
          </>
        ) : null}

        {r === 2 ? (
          <>
            <p>
              {narrowed > 0.05
                ? "Hearing the reasons pulled the answers closer together. That's what the talk is for, as long as people moved because of reasons and not because of rank."
                : narrowed < -0.05
                  ? "The answers spread further apart after talking. Someone heard something that made the problem look bigger (or smaller). Find out what before you settle on a number."
                  : "Talking barely moved the spread. The gap isn't about information anyone was missing."}{" "}
              The group&rsquo;s number is the middle of this round:{" "}
              <span className="font-medium">{fmt(stats.middle)}</span>.
            </p>
            {collapsedName ? (
              <p className="mt-3 pl-3 border-l-2 border-[var(--accent)]">
                Everyone moved to {collapsedName}&rsquo;s first answer, and{" "}
                {collapsedName}{" "}didn&rsquo;t move. Maybe they were simply right,
                but agreement that complete deserves one question: did their
                reasons change your mind, or did their seniority or certainty?
                Ask each person to say in one line what moved them.
              </p>
            ) : null}
            {stats.spread === "wide" ? (
              <p className="mt-3">
                Still far apart after hearing each other out, which usually means
                it isn&rsquo;t about facts anymore. You may want different
                things, or draw the risk line in different places.{" "}
                <Link href={withSubject("/crux", subject)} className={linkClass}>
                  Find where you actually disagree &rarr;
                </Link>
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {/* ---- Next ---- */}
      <div className="mt-5 pt-4 border-t border-[var(--border)]">
        <p className={eyebrow}>{r === 1 ? "Then" : "Before you rely on it"}</p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          {r === 1 && stats.spread !== "tight" ? (
            <li>
              <button type="button" onClick={onRoundTwo} className={`${linkClass} text-left`}>
                After the talk, run round two &rarr;
              </button>{" "}
              Everyone answers again, privately. The group&rsquo;s number is the
              middle of the second round, not whatever the room settled on aloud.
            </li>
          ) : null}
          <li>
            <Link href={withSubject("/outside", subject)} className={linkClass}>
              A timeline or a budget? Check it against the base rate &rarr;
            </Link>{" "}
            A group&rsquo;s middle still shares the group&rsquo;s optimism. See what
            happened to projects like this one before you promise it.
          </li>
          <li>
            <Link href={withSubject("/weigh", subject)} className={linkClass}>
              A probability? See which side of the line it puts you &rarr;
            </Link>{" "}
            You may not need the exact number, only whether it&rsquo;s above the
            point where the decision flips.
          </li>
          <li>
            <Link href={withSubject("/decide", subject)} className={linkClass}>
              Write it down so you can check it later &rarr;
            </Link>{" "}
            Log the number and the range in the journal, and come back when the
            real answer is in.
          </li>
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onCopySummary} className={secondaryBtn}>
          {summaryCopied ? "Copied — paste it into your notes" : "Copy the result as text"}
        </button>
        <PrintButton label="Print / Save as PDF" />
        <button
          type="button"
          onClick={onNewQuestion}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Same people, new question
        </button>
      </div>
    </div>
  );
}

function SpeakOrder({
  low,
  high,
  fmt,
}: {
  low: { name: string; v: number; why: string };
  high: { name: string; v: number; why: string };
  fmt: (n: number) => string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Who speaks first</p>
      <ol className="mt-2 space-y-1.5 list-decimal pl-5">
        <li>
          <span className="font-medium">{low.name}</span> ({fmt(low.v)}), then{" "}
          <span className="font-medium">{high.name}</span> ({fmt(high.v)}). The two
          ends say what they were counting, not why they&rsquo;re right.
        </li>
        <li>
          Everyone else asks one question:{" "}
          <em>what are you including that I left out?</em>
        </li>
        <li>
          The most senior person in the room speaks last, or not at all. Their
          view is the one most likely to become everyone&rsquo;s.
        </li>
      </ol>
    </div>
  );
}

/** The other end of a by-message round: answer privately, send the reply to
 *  the organizer alone. Touches none of this browser's own storage. */
function ReplyView({ invite }: { invite: Invite }) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [why, setWhy] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const num = parseNumber(value);
  const ready = name.trim() !== "" && num !== null;
  // Someone opening an invite came to answer, not to read the introduction:
  // bring the question into view and put focus on it.
  const headRef = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    headRef.current?.scrollIntoView({ block: "start" });
    headRef.current?.focus({ preventScroll: true });
  }, []);

  const make = async () => {
    if (!ready || num === null) return;
    const token = encodeShare("round-reply", {
      q: invite.q,
      r: invite.r,
      n: capStr(name, 40),
      v: num,
      w: capStr(why, 160),
    });
    if (!token) return;
    const url = `${window.location.origin}/round#${SHARE_PARAM}=${token}`;
    setLink(url);
    setCopied(await copyText(url));
  };

  return (
    <div className={card}>
      <h2 ref={headRef} tabIndex={-1} className={`${eyebrow} scroll-mt-24 focus:outline-none`}>
        {invite.r === 2 ? "Round two — you've been asked again" : "You've been asked for a number"}
      </h2>
      <p className="mt-2 text-lg font-medium text-[var(--foreground)] leading-snug">
        {invite.q}
        {invite.u ? <span className="text-[var(--muted)] font-normal"> ({invite.u})</span> : null}
      </p>
      <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
        Answer on your own, before you hear anyone else&rsquo;s number. That&rsquo;s
        the point: the group gets each person&rsquo;s real view instead of
        everyone&rsquo;s adjustment to whoever spoke first.
      </p>

      {link ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {copied ? "Your reply link is on your clipboard." : "Here is your reply link."}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
            Send it <span className="text-[var(--foreground)]">only to the person who asked</span>,
            in a private message. Posting it in the group thread would show your
            number to everyone who hasn&rsquo;t answered yet.
          </p>
          <label htmlFor="round-reply-link" className="sr-only">Your reply link</label>
          <input
            id="round-reply-link"
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className={`${inputClass} mt-3 text-xs`}
          />
          <button
            type="button"
            onClick={() => {
              setLink("");
              setCopied(false);
            }}
            className="mt-3 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Change my answer
          </button>
        </div>
      ) : (
        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            make();
          }}
        >
          <label htmlFor="round-reply-name" className={`block ${eyebrow} mb-2`}>
            Your name
          </label>
          <input
            id="round-reply-name"
            type="text"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClass} sm:max-w-xs`}
          />
          <label htmlFor="round-reply-value" className={`mt-4 block ${eyebrow} mb-2`}>
            Your number{invite.u ? ` (${invite.u})` : ""}
          </label>
          <input
            id="round-reply-value"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`${inputClass} sm:max-w-xs`}
          />
          {value.trim() && num === null ? (
            <p className="mt-1 text-xs text-[var(--muted)]">One number, please: 12, 4.5, 1,200, $30k, or 70%.</p>
          ) : null}
          <label htmlFor="round-reply-why" className={`mt-4 block ${eyebrow} mb-2`}>
            One line on why <span className="normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <input
            id="round-reply-why"
            type="text"
            autoComplete="off"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="What are you counting that others might not?"
            className={inputClass}
          />
          <button type="submit" disabled={!ready} className={`mt-5 ${primaryBtn}`}>
            Make my reply link
          </button>
        </form>
      )}
      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Your answer travels only inside the link you send. It isn&rsquo;t sent to
        any server and isn&rsquo;t saved in this browser.{" "}
        <Link href="/round" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
          Run a round of your own
        </Link>
        .
      </p>
    </div>
  );
}

/** A read-only worked example: the spread that turned out to be the finding. */
function RoundExample() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example &mdash; nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Four people have to tell a client when the new website can launch. In the
        usual meeting the lead says &ldquo;about four weeks?&rdquo; and three
        people nod. This time they answer privately first:
      </p>
      <ul className="mt-3 space-y-1 text-sm text-[var(--foreground)] leading-relaxed">
        <li><span className="font-medium">Ana</span>: 3 weeks &mdash; &ldquo;the design is done&rdquo;</li>
        <li><span className="font-medium">Ben</span>: 4 weeks</li>
        <li><span className="font-medium">Chloe</span>: 4 weeks</li>
        <li><span className="font-medium">Dev</span>: 10 weeks &mdash; &ldquo;the client&rsquo;s legal team signs off every page&rdquo;</li>
      </ul>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        The highest is more than three times the lowest:{" "}
        <span className="font-medium">they aren&rsquo;t estimating the same thing</span>.
        Ana and Dev speak first. Nobody else knew about the legal review, and in the
        usual meeting Dev, the newest person there, would have nodded along to four.
        In round two they answer 8, 9, 9 and 10. The group&rsquo;s number is 9
        weeks, and the one person who knew the real constraint was heard before the
        number was set.
      </p>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own round below is blank. Set it up for <em>your</em>{" "}group&rsquo;s number.
      </p>
    </div>
  );
}
