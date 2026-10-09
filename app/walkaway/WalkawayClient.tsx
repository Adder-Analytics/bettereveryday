"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  readCarriedSubject,
  clearCarriedSubject,
  withSubject,
} from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import {
  BLANK_WALK,
  WALK_EXAMPLE,
  altClause,
  fmt,
  liveHeadline,
  liveRead,
  opening,
  parseNumber,
  parseWalkInputs,
  readWalk,
  walkAwayPoint,
  walkHeadline,
  walkSummary,
  worseWord,
  type Direction,
  type Extra,
  type Firm,
  type Knows,
  type WalkInputs,
  type WalkRead,
} from "../data/walkaway";

/**
 * Where's your line? (/walkaway)
 *
 * The instrument for the half hour before a negotiation: a job offer, a raise,
 * a car, a house, a contract rate. Without it, the walk-away point gets set in
 * the room, by the other side's first number and by how much nobody likes
 * saying no. With it, you walk in having already decided three numbers: the
 * worst deal you'll take (from what you'll actually do if this falls through),
 * the deal you're aiming for, and what to say first.
 *
 * Private on purpose. A walk-away point is the one number you never hand the
 * other side, so this tool has no share link. Inputs persist in the browser.
 * The logic lives in `app/data/walkaway.ts` so it can be checked without a
 * browser.
 */

const STORE_KEY = "walkaway:v1";

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
const optional = (
  <span className="normal-case tracking-normal font-normal">(optional)</span>
);

function loadInputs(): WalkInputs {
  if (typeof window === "undefined") return BLANK_WALK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseWalkInputs(JSON.parse(raw)) : BLANK_WALK;
  } catch {
    return BLANK_WALK;
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

/** A number field that says, under itself, when it can't read what was typed. */
function NumberField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: React.ReactNode;
}) {
  const bad = value.trim() !== "" && parseNumber(value) === null;
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={bad || undefined}
        aria-describedby={bad ? `${id}-bad` : undefined}
        className={inputClass}
      />
      {bad ? (
        <p id={`${id}-bad`} className="mt-1.5 text-xs text-[var(--muted)]">
          Type just the number, like 58000, 58,000 or 58k.
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

export default function WalkawayClient() {
  const [inp, setInp] = useState<WalkInputs>(BLANK_WALK);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    const loaded = loadInputs();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.deal.trim();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage and the URL; intentionally synchronous on mount. */
    setInp(seeded ? { ...loaded, deal: carried } : loaded);
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

  const set = <K extends keyof WalkInputs>(k: K, v: WalkInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readWalk(inp), [inp]);
  const line = useMemo(() => walkAwayPoint(inp), [inp]);
  const live = read ? liveRead(inp, read) : null;
  const up = inp.direction !== "down";
  const u = inp.unit;

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
        {showExample ? <WalkExample /> : null}
      </div>

      {/* ---- 1. The deal ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="walk-deal" className={`block ${eyebrow} mb-2`}>
          What are you negotiating?
        </label>
        <input
          id="walk-deal"
          type="text"
          value={inp.deal}
          onChange={(e) => set("deal", e.target.value)}
          placeholder="e.g. Salary for the Northwind offer"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.deal.trim() === carriedSeed}
          onClear={() => {
            set("deal", "");
            setCarriedSeed("");
          }}
        />

        <p className="mt-5 mb-2 text-sm text-[var(--foreground)]">
          Which way do you want the number to go?
        </p>
        <Chips<Direction>
          label="Which way do you want the number to go?"
          cols={2}
          value={inp.direction}
          onPick={(v) => set("direction", v)}
          options={[
            { id: "up", label: "Higher — I'm being paid, or selling" },
            { id: "down", label: "Lower — I'm paying, or buying" },
          ]}
        />

        <label htmlFor="walk-unit" className="mt-5 block text-sm text-[var(--foreground)] mb-1.5">
          In what unit? {optional}
        </label>
        <input
          id="walk-unit"
          type="text"
          value={inp.unit}
          onChange={(e) => set("unit", e.target.value)}
          placeholder="e.g. £, $, an hour, a month"
          className={`${inputClass} sm:max-w-xs`}
        />
      </div>

      {/* ---- 2. The alternative ---- */}
      {inp.direction ? (
        <div className={card}>
          <p className={eyebrow}>If this falls through</p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            Your walk-away point doesn&rsquo;t come from what you&rsquo;d like. It
            comes from what you&rsquo;ll actually <em>do</em>{" "}if there&rsquo;s no
            deal: stay where you are, take the other offer, buy the other car,
            keep the flat on the market. There&rsquo;s always something, even if
            it&rsquo;s &ldquo;nothing changes&rdquo;. Name it as an action.
          </p>
          <label htmlFor="walk-alt" className="block text-sm text-[var(--foreground)] mb-1.5">
            If there&rsquo;s no deal, I&rsquo;ll&hellip;
          </label>
          <input
            id="walk-alt"
            type="text"
            value={inp.alt}
            onChange={(e) => set("alt", e.target.value)}
            placeholder={up ? "e.g. stay in my current job at £58,000" : "e.g. buy the other one I saw, at £9,400"}
            className={inputClass}
          />
          <div className="mt-4">
            <NumberField
              id="walk-alt-value"
              label={<>What&rsquo;s that worth, in the same terms as this deal?</>}
              value={inp.altValue}
              onChange={(v) => set("altValue", v)}
              placeholder={up ? "e.g. 58,000" : "e.g. 9,400"}
            />
          </div>

          <p className="mt-5 mb-2 text-sm text-[var(--foreground)]">How real is it?</p>
          <Chips<Firm>
            label="How real is your alternative?"
            value={inp.firm}
            onPick={(v) => set("firm", v)}
            options={[
              { id: "inhand", label: "In hand — I could do it tomorrow" },
              { id: "likely", label: "Likely, not certain" },
              { id: "hope", label: "A hope — I don't have it yet" },
            ]}
          />

          <p className="mt-5 mb-2 text-sm text-[var(--foreground)]">
            Apart from the number, is this deal better or worse than that?
          </p>
          <p className="mb-3 text-xs text-[var(--muted)] leading-relaxed">
            The commute, the work itself, the car&rsquo;s condition, the hassle of
            starting over. These move your line: you&rsquo;d{" "}
            {up ? "accept a little less" : "pay a little more"}{" "}for a deal that&rsquo;s
            better in other ways.
          </p>
          <Chips<Extra>
            label="Apart from the number, is this deal better or worse than your alternative?"
            value={inp.extra}
            onPick={(v) => set("extra", v)}
            options={[
              { id: "better", label: "Better in other ways" },
              { id: "same", label: "About the same" },
              { id: "worse", label: "Worse in other ways" },
            ]}
          />
          {inp.extra === "better" || inp.extra === "worse" ? (
            <div className="mt-4">
              <NumberField
                id="walk-extra"
                label={
                  inp.extra === "better"
                    ? up
                      ? "How much less would you take, for that alone?"
                      : "How much more would you pay, for that alone?"
                    : up
                      ? "How much more would it have to pay to make up for that?"
                      : "How much less would it have to cost to make up for that?"
                }
                value={inp.extraValue}
                onChange={(v) => set("extraValue", v)}
                placeholder="e.g. 3,000"
              />
            </div>
          ) : null}

          {line !== null ? (
            <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
              <p className={eyebrow}>Your walk-away point</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
                {fmt(line, u)}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                Any deal {worseWord(inp.direction)}{" "}this is worse than what
                you&rsquo;ll do anyway, so the answer to it is no.
                {inp.firm === "likely" ? (
                  <>
                    {" "}Your alternative isn&rsquo;t certain, so before you go in, ask
                    what you&rsquo;d do if it fell through too. If that&rsquo;s much
                    worse, your real line sits between the two.
                  </>
                ) : null}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- 3. The target ---- */}
      {line !== null ? (
        <div className={card}>
          <p className={eyebrow}>What you&rsquo;re aiming for</p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            The walk-away is the floor. The target is what you&rsquo;ll actually aim
            at, and people who go in focused on an ambitious target tend to get
            more than people focused on their floor. Make it the best number you
            could justify out loud with a straight face: what the role pays
            elsewhere, what similar ones sold for, a quote from someone else.
          </p>
          <NumberField
            id="walk-target"
            label="Your target"
            value={inp.target}
            onChange={(v) => set("target", v)}
            placeholder={up ? "e.g. 68,000" : "e.g. 8,600"}
          />
          <label htmlFor="walk-target-why" className="mt-4 block text-sm text-[var(--foreground)] mb-1.5">
            What it&rsquo;s based on {optional}
          </label>
          <input
            id="walk-target-why"
            type="text"
            value={inp.targetWhy}
            onChange={(e) => set("targetWhy", e.target.value)}
            placeholder="e.g. the middle of three salary surveys for this role"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            This is the reason you&rsquo;ll say out loud. A number with a reason
            moves people; a number on its own invites a haggle.
          </p>
        </div>
      ) : null}

      {/* ---- 4. Their side ---- */}
      {line !== null && parseNumber(inp.target) !== null ? (
        <div className={card}>
          <p className={eyebrow}>Their side of the table</p>
          <div className="mt-4 space-y-5">
            <NumberField
              id="walk-their-limit"
              label={<>How far could they go, at a guess? {optional}</>}
              value={inp.theirLimit}
              onChange={(v) => set("theirLimit", v)}
              placeholder={up ? "e.g. 72,000" : "e.g. 8,200"}
              hint={
                up
                  ? "The top of a posted pay band, what they'd have to pay the next candidate, what the last one sold for."
                  : "What they paid for it, the lowest similar listing, what they'd get from the next buyer."
              }
            />
            <NumberField
              id="walk-their-offer"
              label={<>Have they already named a number? {optional}</>}
              value={inp.theirOffer}
              onChange={(v) => set("theirOffer", v)}
              placeholder="Leave blank if not"
            />
            {parseNumber(inp.theirOffer) === null ? (
              <div>
                <p className="mb-2 text-sm text-[var(--foreground)]">
                  Who knows more about what this is really worth?
                </p>
                <Chips<Knows>
                  label="Who knows more about what this is really worth?"
                  value={inp.knows}
                  onPick={(v) => set("knows", v)}
                  options={[
                    { id: "me", label: "I do" },
                    { id: "even", label: "About even" },
                    { id: "them", label: "They do" },
                  ]}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer
        message={
          read ? (live ? liveHeadline(inp, read, live) : walkHeadline(inp, read)) : null
        }
      />
      {read ? (
        <ReadBlock inp={inp} read={read} set={set} />
      ) : line === null ? (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer the questions above and your line appears: the worst deal
            you&rsquo;ll take, the one you&rsquo;re aiming for, and what to say first.
          </p>
        </div>
      ) : null}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_WALK);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

type Setter = <K extends keyof WalkInputs>(k: K, v: WalkInputs[K]) => void;

function ReadBlock({ inp, read, set }: { inp: WalkInputs; read: WalkRead; set: Setter }) {
  const [copied, setCopied] = useState<"" | "yes" | "no">("");
  const u = inp.unit;
  const alt = altClause(inp.alt);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>Your line</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {walkHeadline(inp, read)}
      </p>
      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <ReadBody inp={inp} read={read} />
      </div>

      {read.kind !== "target-inside" ? (
        <>
          <OpeningBlock inp={inp} read={read} />

          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <p className={eyebrow}>Your line card</p>
            <div className="mt-3 rounded-lg border border-[var(--accent)] p-4 space-y-2 text-sm text-[var(--foreground)] leading-relaxed">
              <p>
                <span className="font-medium">Walk-away: {fmt(read.line, u)}.</span>{" "}
                {inp.direction === "down" ? "Above" : "Below"}{" "}that, I say &ldquo;I
                can&rsquo;t make that work&rdquo;{alt ? <> and I {alt}</> : null}.
              </p>
              <p>
                <span className="font-medium">Target: {fmt(read.target, u)}</span>
                {inp.targetWhy.trim() ? <>, because {inp.targetWhy.trim().replace(/[.\s]+$/, "")}</> : null}.
              </p>
              <p className="text-[var(--muted)]">
                If I feel the pull to move my line in the room, I ask: did I learn
                something about my alternative, or do I just want this to be over?
                Only the first is a reason.
              </p>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              Decide it now, while nobody is watching you and no number has been
              said. In the room, people take deals worse than their own
              alternative to avoid the discomfort of no deal at all. A line
              written down beforehand is much harder to talk yourself past. Keep
              it to yourself: this is the one number you never tell them.
            </p>
            <button
              type="button"
              onClick={async () => setCopied((await copyText(walkSummary(inp, read))) ? "yes" : "no")}
              className="mt-3 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              {copied === "yes"
                ? "Copied — it's on your clipboard"
                : copied === "no"
                  ? "Couldn't copy — select the card above instead"
                  : "Copy the card as text"}
            </button>
          </div>

          <LiveCheck inp={inp} read={read} set={set} />
        </>
      ) : null}

      <Handoffs inp={inp} read={read} />
    </div>
  );
}

function ReadBody({ inp, read }: { inp: WalkInputs; read: WalkRead }) {
  const u = inp.unit;
  const up = inp.direction !== "down";
  switch (read.kind) {
    case "target-inside":
      return (
        <>
          <p>
            Your target, {fmt(read.target, u)}, doesn&rsquo;t beat your walk-away
            of {fmt(read.line, u)}. Even if you get everything you&rsquo;re aiming
            for, you&rsquo;d do as well or better by walking away.
          </p>
          <p>
            One of two things is off. Either the target is timid (check what
            deals like this actually go for, and aim at that), or your alternative
            is worth less than you said. If it&rsquo;s the second, fix the number
            above, and your line moves with it.
          </p>
        </>
      );
    case "hope":
      return (
        <>
          <p>
            The line of {fmt(read.line, u)}{" "}assumes an alternative you don&rsquo;t
            have yet. If it doesn&rsquo;t come through, your real fallback is
            worse, and you&rsquo;d be holding out for a number your situation
            can&rsquo;t back.
          </p>
          <p>
            The strongest move in any negotiation happens before it: make your
            alternative real. Get the other offer in writing, the second quote,
            the viewing booked. If you can&rsquo;t before you talk, redo this
            with what you&rsquo;d actually do today, and set the line from that.
          </p>
          {read.noRoom && read.theirs !== null ? (
            <p className="text-[var(--muted)]">
              And by your guess they can&rsquo;t go past {fmt(read.theirs, u)}, which
              is short of even this line.
            </p>
          ) : null}
        </>
      );
    case "no-room":
      return (
        <>
          <p>
            By your guess they can go to about {fmt(read.theirs!, u)}. Your line
            is {fmt(read.line, u)}. If both are right, there&rsquo;s no number you
            would both accept, and the most likely outcome of a long conversation
            is a deal you&rsquo;ll regret.
          </p>
          <p>
            That&rsquo;s worth knowing now. Before you go in, check the guess
            (it&rsquo;s the softest number here), and ask whether anything other
            than the {up ? "pay" : "price"}{" "}could close the gap: start date,
            terms, what&rsquo;s included, a review in six months. If nothing can,
            the right answer is a polite no, and it&rsquo;s fine to decide that
            today.
          </p>
        </>
      );
    case "ready": {
      const room = Math.abs(read.target - read.line);
      return (
        <>
          <p>
            You have {fmt(room, u)}{" "}of room between the deal you&rsquo;re aiming
            for and the one you&rsquo;d still take. Spend the conversation near
            the top of it, and concede slowly, in shrinking steps, with a reason
            each time.
          </p>
          {inp.firm === "likely" ? (
            <p className="text-[var(--muted)]">
              Your alternative is likely, not certain. If you can firm it up
              before you talk, do: it&rsquo;s the single thing that most improves
              where you stand.
            </p>
          ) : null}
        </>
      );
    }
  }
}

function OpeningBlock({ inp, read }: { inp: WalkInputs; read: WalkRead }) {
  const op = opening(inp, read);
  if (!op) return null;
  const u = inp.unit;
  const up = inp.direction !== "down";
  return (
    <div className="mt-5 pt-5 border-t border-[var(--border)]">
      <p className={eyebrow}>The first number</p>
      <div className="mt-3 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        {op.kind === "they-named" ? (
          op.vs === "below-line" ? (
            <p>
              They opened at <span className="font-medium">{fmt(op.offer, u)}</span>,
              which is past your line. Don&rsquo;t counter from it: a counter just
              above their number accepts their frame. Restate your own number and
              your reason as if theirs hadn&rsquo;t been said, and talk about what
              the {up ? "role" : "thing"}{" "}is worth, not about the gap.
            </p>
          ) : op.vs === "in-zone" ? (
            <p>
              They opened at <span className="font-medium">{fmt(op.offer, u)}</span>.
              That clears your line, so a deal is possible, but it&rsquo;s{" "}
              {fmt(Math.abs(read.target - op.offer), u)}{" "}away from your target.
              Their first number is an anchor, not a fact. Counter from your
              target, with your reason, not from the midpoint of theirs.
            </p>
          ) : (
            <p>
              They opened at <span className="font-medium">{fmt(op.offer, u)}</span>,
              which already meets your target. Two things: you may have set the
              target too modestly, and asking once more, for the number or for
              something else, rarely costs a deal this good.
            </p>
          )
        ) : op.kind === "let-them" ? (
          <p>
            They know more about what this is worth than you do. Going first
            mostly tells them what you don&rsquo;t know, so let them name the first
            number. When they do, don&rsquo;t react to it; restate your target and
            the reason for it.
          </p>
        ) : (
          <>
            <p>
              Name it first. The first number on the table pulls the final one
              toward it, and you know the market at least as well as they do. Go
              a little past your target, so there&rsquo;s room to concede and still
              land on it.
            </p>
            <p>
              Say{" "}
              <span className="font-medium">{fmt(op.point, u)}</span>, a precise
              number rather than a round one (it reads as homework, and draws a
              smaller counter), or a range:{" "}
              <span className="font-medium">
                {fmt(op.rangeLow, u)} to {fmt(op.rangeHigh, u)}
              </span>
              , which starts at your target and runs {up ? "up" : "down"}{" "}from it.
              Either way, give the reason in the same breath.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** For use in the room, or on a break from it: a number is on the table now. */
function LiveCheck({ inp, read, set }: { inp: WalkInputs; read: WalkRead; set: Setter }) {
  const live = liveRead(inp, read);
  const alt = altClause(inp.alt);
  return (
    <div className="mt-5 pt-5 border-t border-[var(--border)]">
      <p className={eyebrow}>In the room</p>
      <p className="mt-2 mb-3 text-sm text-[var(--muted)] leading-relaxed">
        Come back here on a break, or when the offer arrives by email. Type the
        number on the table and check it against what you decided before.
      </p>
      <NumberField
        id="walk-live"
        label="The number on the table now"
        value={inp.live}
        onChange={(v) => set("live", v)}
        placeholder="e.g. 63,500"
      />
      {live ? (
        <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
          <p className="text-base font-medium text-[var(--foreground)]">
            {liveHeadline(inp, read, live)}
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            {live.kind === "below-line" ? (
              <>
                Taking it leaves you worse off than {alt ? <>if you {alt}</> : <>your alternative</>}.
                Say no to this number. The only good reason to move your line now
                is news about your alternative, not the wish to have it settled.
              </>
            ) : live.kind === "in-zone" ? (
              <>
                You could take it. Before you do, ask once more with your reason,
                or ask for something that isn&rsquo;t the number (a start date, a
                review in six months, what&rsquo;s included). One more ask rarely
                loses a deal that&rsquo;s already this close.
              </>
            ) : (
              <>
                Take it, if the rest of the deal is what you expected. Then stop
                negotiating: past your target, the next ask costs more goodwill
                than it&rsquo;s likely to earn.
              </>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: WalkInputs; read: WalkRead }) {
  const s = inp.deal;
  const list: Handoff[] = [];
  switch (read.kind) {
    case "target-inside":
      list.push({
        href: withSubject("/outside", s),
        label: "Check the target against real deals",
        note: "What did people in your position actually get? The going rate is a better target than the one that feels safe to ask for.",
      });
      break;
    case "hope":
    case "no-room":
      list.push({
        href: withSubject("/widen", s),
        label: "Find a better alternative",
        note: "The best preparation is a stronger fallback. List the options you haven't chased yet: another offer, another seller, a different shape of deal.",
      });
      break;
    case "ready":
      list.push({
        href: withSubject("/decide", s),
        label: "Log the line before you go in",
        note: "Write down the deal you expect. Afterwards you can grade the preparation, not just the price you got.",
      });
      break;
  }
  list.push({
    href: withSubject("/incentives", s),
    label: "Is someone advising you with a stake?",
    note: "A recruiter, an agent or a broker is paid when the deal closes. Check whether their advice to take it is about you or about them.",
  });
  list.push({
    href: withSubject("/round", s),
    label: "Deciding the number with someone else?",
    note: "If you and a partner are setting the price to offer together, write your numbers down apart before either of you says one.",
  });
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
function WalkExample() {
  const ex = WALK_EXAMPLE;
  const read = readWalk(ex);
  if (!read) return null;
  const op = opening(ex, read);
  const u = ex.unit;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{ex.deal}.</span>{" "}If it falls through, I
        stay where I am, on £58,000, and that&rsquo;s certain. The new job is
        better in ways I&rsquo;d give up about £3,000 a year for (shorter
        commute, more senior work). So anything under{" "}
        <span className="font-medium">{fmt(read.line, u)}</span>{" "}is worse than
        staying.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Three salary surveys put the role at about {fmt(read.target, u)}, so
        that&rsquo;s my target. The posted band tops out at{" "}
        {fmt(read.theirs!, u)}, so there&rsquo;s room. They&rsquo;ve already offered{" "}
        {op?.kind === "they-named" ? fmt(op.offer, u) : "a number"}: above my
        line, short of my target.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {walkHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          So I don&rsquo;t counter with a polite step up from their number. I say
          £68,000 and give the survey figures. They come back at £65,500. That
          clears my line and is £2,500 short of the target, so I ask once more,
          for a salary review at six months, and take it.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}deal.
      </p>
    </div>
  );
}
