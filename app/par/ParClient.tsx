"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  readCarriedSubject,
  readCarriedOptions,
  readCarriedFrom,
  clearCarriedSubject,
  withSubject,
  CARRY_SOURCES,
} from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import {
  BLANK_PAR,
  PAR_EXAMPLE,
  commitmentText,
  other,
  parHeadline,
  parSummary,
  parseParInputs,
  readPar,
  sideName,
  midName,
  lowerLead,
  type Drift,
  type Fact,
  type Overall,
  type ParInputs,
  type ParRead,
  type Side,
  type Sweet,
} from "../data/par";

/**
 * Neither one wins (/par)
 *
 * The instrument for the choice that won't settle however it's weighed: two
 * good options, each with something the other can't give, and every pass at
 * the pros and cons comes out the same. The rest of the kit treats a stuck
 * call as a missing input — a probability, a fact, a frame, distance from a
 * feeling. Ruth Chang's point is that some choices aren't missing anything.
 * The options are on a par: comparable, neither better, and not equal either.
 * Then more analysis can't find the answer, because there isn't one to find,
 * and the choice is made by committing to one of them.
 *
 * The tool separates that case from the three it's usually confused with — one
 * option is better and the choice only hurts; a fact you could find out would
 * settle it; the two are simply equal — using Chang's small-improvement test.
 * Only when it's a real par does it ask for the commitment, and it writes that
 * commitment down as a sentence the person can keep.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/par.ts` so it can be checked without a browser.
 */

const STORE_KEY = "par:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase =
  "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff =
  "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow =
  "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card =
  "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";

function loadInputs(): ParInputs {
  if (typeof window === "undefined") return BLANK_PAR;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseParInputs(JSON.parse(raw)) : BLANK_PAR;
  } catch {
    return BLANK_PAR;
  }
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

/** A row of mutually exclusive answers. */
function Chips<T extends string>({
  value,
  options,
  onPick,
  cols = 3,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onPick: (v: T) => void;
  cols?: 2 | 3;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid grid-cols-1 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2`}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onPick(o.id)}
          className={`${chipBase} ${value === o.id ? chipOn : chipOff}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ParClient() {
  const [inp, setInp] = useState<ParInputs>(BLANK_PAR);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [carriedOpts, setCarriedOpts] = useState<{ a: string; b: string; from: string } | null>(null);
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    const loaded = loadInputs();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.decision.trim();
    let next = seeded ? { ...loaded, decision: carried } : loaded;
    // The comparison hands its two too-close finalists here. Seed them only
    // into blank option fields, so a link can never overwrite a call in progress.
    const opts = readCarriedOptions();
    const from = readCarriedFrom();
    const seedOpts =
      Boolean(opts.optionA) &&
      Boolean(opts.optionB) &&
      !next.aName.trim() &&
      !next.bName.trim();
    if (seedOpts) next = { ...next, aName: opts.optionA, bName: opts.optionB };
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage and the URL; intentionally synchronous on mount. */
    setInp(next);
    setHydrated(true);
    if (seeded) setCarriedSeed(carried);
    if (seedOpts) {
      setCarriedOpts({
        a: opts.optionA,
        b: opts.optionB,
        from: from ? CARRY_SOURCES[from] : "your last step",
      });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    if (carried || opts.optionA || opts.optionB) clearCarriedSubject();
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(inp));
    } catch {
      /* storage full or blocked — the tool still works, just won't persist */
    }
  }, [inp, hydrated]);

  const set = <K extends keyof ParInputs>(k: K, v: ParInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readPar(inp), [inp]);
  const a = sideName(inp, "a");
  const b = sideName(inp, "b");
  const commitment = read?.kind === "par" ? commitmentText(inp) : null;

  return (
    <div>
      {/* ---- New here? A read-only worked example ---- */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowExample((s) => !s)}
          aria-expanded={showExample}
          className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {showExample ? "Hide the worked example ↑" : "New here? See a worked example ↓"}
        </button>
        {showExample ? <ParExample /> : null}
      </div>

      {/* ---- The two options ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="par-decision" className={`block ${eyebrow} mb-2`}>
          What are you deciding?
        </label>
        <input
          id="par-decision"
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Take the job in Edinburgh, or stay in Bristol"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
          onClear={() => {
            set("decision", "");
            setCarriedSeed("");
          }}
        />

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(["a", "b"] as Side[]).map((side) => {
            const nameKey = side === "a" ? "aName" : "bName";
            const bestKey = side === "a" ? "aBest" : "bBest";
            return (
              <div key={side}>
                <label htmlFor={`par-${side}-name`} className={`block ${eyebrow} mb-2`}>
                  {side === "a" ? "One option" : "The other"}
                </label>
                <input
                  id={`par-${side}-name`}
                  type="text"
                  value={inp[nameKey]}
                  onChange={(e) => set(nameKey, e.target.value)}
                  placeholder={side === "a" ? "e.g. Edinburgh" : "e.g. Bristol"}
                  className={inputClass}
                />
                <label
                  htmlFor={`par-${side}-best`}
                  className="mt-3 block text-sm text-[var(--muted)] mb-1.5"
                >
                  What it gives you that the other can&rsquo;t
                </label>
                <input
                  id={`par-${side}-best`}
                  type="text"
                  value={inp[bestKey]}
                  onChange={(e) => set(bestKey, e.target.value)}
                  placeholder={side === "a" ? "e.g. The research I trained for" : "e.g. Being near my sister's kids"}
                  className={inputClass}
                />
              </div>
            );
          })}
        </div>
        <CarriedNote
          show={
            carriedOpts !== null &&
            inp.aName === carriedOpts.a &&
            inp.bName === carriedOpts.b
          }
          lead={`Both options carried from ${carriedOpts?.from ?? "your last step"} — edit them above, or`}
          clearLabel="clear both"
          onClear={() => {
            setInp((prev) => ({ ...prev, aName: "", bName: "" }));
            setCarriedOpts(null);
          }}
        />
      </div>

      {/* ---- Step 1: is one better? ---- */}
      <div className={card}>
        <p className={eyebrow}>Weighed overall</p>
        <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
          Put the list down and answer honestly, taking everything together:{" "}
          <span className="text-[var(--foreground)]">is one of them better?</span>{" "}
          Not more exciting, not safer. Better, all things considered.
        </p>
        <Chips<Overall>
          label="Is one of them better overall?"
          value={inp.overall}
          onPick={(v) => set("overall", v)}
          options={[
            { id: "a", label: `${a} is better` },
            { id: "b", label: `${b} is better` },
            { id: "neither", label: "Neither — each wins on something" },
          ]}
        />
      </div>

      {/* ---- Step 2: is it ignorance? ---- */}
      {inp.overall === "neither" ? (
        <div className={card}>
          <p className={eyebrow}>Something you don&rsquo;t know?</p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            Is there a <em>fact</em>{" "}you could actually find out &mdash; the real
            salary, whether the school has a place, what the scan says &mdash; that
            would settle it? Not a feeling you&rsquo;re waiting to have. A fact.
          </p>
          <Chips<Fact>
            label="Could a fact you could find out settle it?"
            cols={2}
            value={inp.fact}
            onPick={(v) => set("fact", v)}
            options={[
              { id: "yes", label: "Yes — if I knew one thing, I'd know" },
              { id: "no", label: "No — I know enough, and it still won't settle" },
            ]}
          />
          {inp.fact === "yes" ? (
            <div className="mt-4">
              <label htmlFor="par-fact" className="block text-sm text-[var(--muted)] mb-1.5">
                What&rsquo;s the fact?
              </label>
              <input
                id="par-fact"
                type="text"
                value={inp.factText}
                onChange={(e) => set("factText", e.target.value)}
                placeholder="e.g. Whether the Edinburgh contract gets renewed after two years"
                className={inputClass}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- Step 3: the small-improvement test ---- */}
      {inp.overall === "neither" && inp.fact === "no" ? (
        <div className={card}>
          <p className={eyebrow}>The small-improvement test</p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            If two options were exactly equal, the smallest gain to either would
            tip it. So make each one a little better &mdash; a bit more of its best
            thing, or one small extra, like slightly more pay or a slightly shorter
            commute &mdash; and see whether that settles it.
          </p>
          <div className="mt-4 space-y-5">
            {(["a", "b"] as Side[]).map((side) => {
              const key = side === "a" ? "sweetA" : "sweetB";
              const name = midName(inp, side);
              const best = (side === "a" ? inp.aBest : inp.bBest).trim();
              return (
                <div key={side}>
                  <p className="text-sm text-[var(--foreground)] leading-relaxed mb-2">
                    Picture{" "}
                    <span className="font-medium">{name}</span>, slightly
                    better{best ? <>: a bit more of <em>{lowerLead(best)}</em></> : null}. Would you now
                    clearly take it over{" "}
                    <span className="font-medium">{midName(inp, other(side))}</span>?
                  </p>
                  <Chips<Sweet>
                    label={`Does a small improvement to ${name} settle it?`}
                    cols={2}
                    value={inp[key]}
                    onPick={(v) => set(key, v)}
                    options={[
                      { id: "tips", label: "Yes — that would settle it" },
                      { id: "still", label: "No — I still couldn't choose" },
                    ]}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer
        message={
          read
            ? commitment ?? parHeadline(inp, read)
            : null
        }
      />
      {read ? (
        <ReadBlock inp={inp} read={read} set={set} commitment={commitment} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer the questions above and the read appears: whether this is a
            painful choice, a missing fact, a tie, or a real hard choice that only
            you can settle.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_PAR);
          setCarriedSeed("");
          setCarriedOpts(null);
        }}
      />
    </div>
  );
}

type Setter = <K extends keyof ParInputs>(k: K, v: ParInputs[K]) => void;

function ReadBlock({
  inp,
  read,
  set,
  commitment,
}: {
  inp: ParInputs;
  read: ParRead;
  set: Setter;
  commitment: string | null;
}) {
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {parHeadline(inp, read)}
      </p>
      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <ReadBody inp={inp} read={read} />
      </div>
      {read.kind === "par" ? (
        <Commit inp={inp} set={set} commitment={commitment} />
      ) : null}
      <Handoffs inp={inp} read={read} committed={Boolean(commitment)} />
    </div>
  );
}

function ReadBody({ inp, read }: { inp: ParInputs; read: ParRead }) {
  switch (read.kind) {
    case "clear": {
      const win = midName(inp, read.side!);
      const lose = midName(inp, other(read.side!));
      const lost = (read.side === "a" ? inp.bBest : inp.aBest).trim();
      return (
        <>
          <p>
            When you weigh everything together, {win}{" "}comes out ahead. What
            makes this feel hard is that choosing it still costs you something
            real{lost ? <>: <em>{lowerLead(lost)}</em></> : <> &mdash; the best thing about {lose}</>}.
          </p>
          <p>
            That loss will hurt, and the hurt isn&rsquo;t a sign you chose wrong. It&rsquo;s
            what giving up a good thing feels like. Don&rsquo;t reopen the question
            each time you feel it. If you&rsquo;re not sure the &ldquo;better&rdquo;
            will last past this week, play it forward with your older self first.
          </p>
        </>
      );
    }
    case "fact":
      return (
        <>
          <p>
            A choice that a fact could settle isn&rsquo;t a hard choice. It&rsquo;s
            an unfinished one.{" "}
            {inp.factText.trim() ? (
              <>
                If you knew <em>{inp.factText.trim()}</em>, you&rsquo;d know which
                way to go.
              </>
            ) : (
              <>There&rsquo;s one thing that, if you knew it, would tell you which way to go.</>
            )}
          </p>
          <p>
            Before you chase it, check two things: that it really would change
            what you do, and that you can find it out cheaply and before the
            decision is due. If both hold, go and get it. If not, come back and
            answer &ldquo;no&rdquo; above.
          </p>
        </>
      );
    case "tie":
      return (
        <>
          <p>
            A small gain to either one would settle it, so they&rsquo;re equally
            good. No amount of weighing will find a difference that isn&rsquo;t
            there, and the time you spend looking is the only real cost left.
          </p>
          <p>
            So flip a coin, and take the result. If it lands and you feel a
            sinking &ldquo;oh no&rdquo;, that&rsquo;s worth hearing: go the other way. Either
            way, you&rsquo;re done today.
          </p>
          <DriftNote inp={inp} />
        </>
      );
    case "edge": {
      const win = midName(inp, read.side!);
      const lose = midName(inp, other(read.side!));
      return (
        <p>
          A little more would make {win}{" "}clearly better, but a little more
          wouldn&rsquo;t do the same for {lose}. So {win}{" "}is already at least as
          good, with a hair to spare. It isn&rsquo;t a hard choice in the deep
          sense. Take {win}, and stop weighing.
        </p>
      );
    }
    case "par":
      return (
        <>
          <p>
            You know enough. Neither is better. And they aren&rsquo;t equal,
            because a small gain to either one doesn&rsquo;t settle it. The
            philosopher Ruth Chang calls this being <em>on a par</em>: the two are
            good in different ways, and there&rsquo;s no common scale that ranks
            them.
          </p>
          <p>
            That means there&rsquo;s no hidden right answer for more weighing to
            find, so stop looking for one. Here, you settle it by committing. You
            pick the one you&rsquo;re willing to stand behind, and that commitment
            becomes your reason. It isn&rsquo;t a guess you could get wrong.
          </p>
        </>
      );
  }
}

/** For a tie or a par: what happens if nobody chooses. */
function DriftNote({ inp }: { inp: ParInputs }) {
  if (!inp.drift || inp.drift === "none") return null;
  const stay = midName(inp, inp.drift);
  const change = midName(inp, other(inp.drift));
  return (
    <p className="text-[var(--muted)]">
      One thing to know: if you don&rsquo;t choose, {stay}{" "}happens on its own.
      When Steven Levitt had more than 20,000 undecided people flip a coin over
      a big change, those the coin sent toward the change were, on average,
      happier six months later. On a close call, people tend to overrate staying
      put. That&rsquo;s not a reason to pick {change}, but it is a reason not to
      let {stay}{" "}win by default.
    </p>
  );
}

function Commit({
  inp,
  set,
  commitment,
}: {
  inp: ParInputs;
  set: Setter;
  commitment: string | null;
}) {
  const [copied, setCopied] = useState<"" | "yes" | "no">("");
  const a = sideName(inp, "a");
  const b = sideName(inp, "b");
  return (
    <div className="mt-5 pt-5 border-t border-[var(--border)]">
      <p className={eyebrow}>Choose who to be</p>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        Each option makes you a slightly different person. Finish each sentence
        plainly, in a few words, not as a slogan.
      </p>
      <div className="mt-4 space-y-4">
        {(["a", "b"] as Side[]).map((side) => {
          const key = side === "a" ? "selfA" : "selfB";
          return (
            <div key={side}>
              <label htmlFor={`par-self-${side}`} className="block text-sm text-[var(--foreground)] mb-1.5">
                Choosing <span className="font-medium">{midName(inp, side)}</span>, I&rsquo;m
                someone who&hellip;
              </label>
              <input
                id={`par-self-${side}`}
                type="text"
                value={inp[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={side === "a" ? "e.g. does the work while the door is open" : "e.g. is there for the people I love, day to day"}
                className={inputClass}
              />
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
        If you never decide, which one happens anyway?
      </p>
      <Chips<Drift>
        label="If you never decide, which one happens anyway?"
        value={inp.drift}
        onPick={(v) => set("drift", v)}
        options={[
          { id: "a", label: a },
          { id: "b", label: b },
          { id: "none", label: "Neither — I have to act either way" },
        ]}
      />
      {inp.drift === "a" || inp.drift === "b" ? (
        <div className="mt-3 text-sm leading-relaxed">
          <DriftNote inp={inp} />
        </div>
      ) : null}

      <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
        Which one are you willing to stand behind?
      </p>
      <Chips<"" | Side>
        label="Which one are you willing to stand behind?"
        cols={2}
        value={inp.choice}
        onPick={(v) => {
          set("choice", v);
          setCopied("");
        }}
        options={[
          { id: "a", label: `I'll stand behind ${a}` },
          { id: "b", label: `I'll stand behind ${b}` },
        ]}
      />

      {commitment ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>Your commitment</p>
          <p className="mt-2 text-lg font-medium leading-snug text-[var(--foreground)]">
            {commitment}
          </p>
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            Keep this sentence somewhere you&rsquo;ll see it. On the days the other
            option looks better, and there will be some, it&rsquo;s the answer to
            &ldquo;did I get it wrong?&rdquo; You didn&rsquo;t pick the better one,
            because there wasn&rsquo;t one. You picked yours.
          </p>
          <button
            type="button"
            onClick={async () => {
              const read = readPar(inp);
              if (!read) return;
              setCopied((await copyText(parSummary(inp, read))) ? "yes" : "no");
            }}
            className="mt-3 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "yes"
              ? "Copied — it's on your clipboard"
              : copied === "no"
                ? "Couldn't copy — select the sentence above instead"
                : "Copy it as text"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({
  inp,
  read,
  committed,
}: {
  inp: ParInputs;
  read: ParRead;
  committed: boolean;
}) {
  const s = inp.decision;
  const list: Handoff[] = [];
  switch (read.kind) {
    case "clear":
      list.push({
        href: withSubject("/act", s),
        label: "Make the first move",
        note: "A call that costs you something is the kind that quietly stalls. Set the smallest first step and the moment it happens.",
      });
      list.push({
        href: withSubject("/regret", s),
        label: "Check the lean will last",
        note: "If “better” might just be how it feels this week, play it forward to ten months and ten years.",
      });
      break;
    case "fact":
      list.push({
        href: withSubject("/enough", s),
        label: "Is the fact worth finding out?",
        note: "Say what you'd do under each answer. If it's the same either way, you already have enough.",
      });
      list.push({
        href: withSubject("/test", s),
        label: "Design the cheapest test",
        note: "If it would change the call, find the quickest real way to learn it before you commit.",
      });
      break;
    case "tie":
    case "edge":
      list.push({
        href: withSubject("/act", s),
        label: "Make the first move",
        note: "The weighing is over. Turn the call into one concrete step and when you'll take it.",
      });
      break;
    case "par":
      if (committed) {
        list.push({
          href: withSubject("/act", s),
          label: "Make it real this week",
          note: "A commitment that lives only in your head drifts back to the default. Set the first move and the cue that fires it.",
        });
        list.push({
          href: withSubject("/decide", s),
          label: "Put it in your journal",
          note: "Write down what you expect the next year to look like, and set a date to come back and see.",
        });
      } else {
        list.push({
          href: withSubject("/advise", s),
          label: "Still can't commit?",
          note: "Put the choice in a friend's name. If you'd tell them “either is fine, pick the one that's you”, that's your answer too.",
        });
      }
      break;
  }
  return (
    <div className="mt-5 pt-5 border-t border-[var(--border)]">
      <p className={eyebrow}>Where to take it next</p>
      <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
        {list.map((h) => (
          <li key={h.href}>
            <Link
              href={h.href}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              {h.label} →
            </Link>{" "}
            {h.note}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The worked example, read-only. Runs the same read the live tool does on a
 * fixed case, so a newcomer sees a finished pass without anything landing in
 * their own fields or storage.
 */
function ParExample() {
  const ex = PAR_EXAMPLE;
  const read = readPar(ex);
  const commitment = commitmentText(ex);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{ex.decision}.</span>{" "}Only Edinburgh
        gives me <em>{lowerLead(ex.aBest)}</em>. Only Bristol gives me{" "}
        <em>{lowerLead(ex.bBest)}</em>. I&rsquo;ve made the list four times.
        Neither is better overall, and there&rsquo;s nothing left to find out.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        The test: if Edinburgh paid ten percent more, would that settle it? No.
        If my commute in Bristol were twenty minutes shorter? No. A small gain
        to either doesn&rsquo;t tip it, so they aren&rsquo;t equal. They&rsquo;re on
        a par.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {parHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Choosing Edinburgh, I&rsquo;m someone who {ex.selfA}. Choosing Bristol,
          I&rsquo;m someone who {ex.selfB}. Bristol is also what happens if I
          never decide, so I check I&rsquo;m not just drifting into it. I&rsquo;m
          not, and I commit:
        </p>
        <p className="mt-3 text-base font-medium leading-snug text-[var(--foreground)]">
          {commitment}
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}two.
      </p>
    </div>
  );
}
