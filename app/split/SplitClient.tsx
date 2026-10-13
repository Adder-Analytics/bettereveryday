"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { moneyInvalid, parseMoney } from "../data/worth";
import {
  BLANK_SPLIT,
  MAX_PEOPLE,
  MIN_PEOPLE,
  SPLIT_EXAMPLE,
  equalSentence,
  evenOutRounded,
  money,
  parseRow,
  parseSplitInputs,
  personName,
  placementLine,
  readSplit,
  resize,
  roomName,
  rowGap,
  splitCurrency,
  splitHeadline,
  splitSummary,
  tightestSentence,
  type SplitInputs,
  type SplitRead,
} from "../data/split";

/**
 * Who gets which room? (/split)
 *
 * The instrument for housemates splitting the rent on rooms that aren't
 * equal. Each person, privately, prices every room so they wouldn't mind
 * which one they got, with their prices adding up to the whole rent. The
 * rooms go to the assignment that makes the most of everyone's numbers, and
 * the rents are set so nobody would rather swap, by as wide a margin as the
 * numbers allow (Su 1999; Spliddit; Gal et al. 2016; Peters et al. 2022).
 *
 * Entry is pass-the-phone, the same as the blind round (/round): each person
 * opens their own turn, and a locked row is never shown again until the
 * answer is out, so nobody prices against anybody else.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The maths
 * lives in `app/data/split.ts` so it can be checked without a browser.
 */

const STORE_KEY = "split:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase = "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff = "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow = "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card = "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const primaryBtn =
  "text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
const secondaryBtn =
  "text-sm font-medium px-3 py-1.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:opacity-80 transition-opacity";

function loadInputs(): SplitInputs {
  if (typeof window === "undefined") return BLANK_SPLIT;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseSplitInputs(JSON.parse(raw)) : BLANK_SPLIT;
  } catch {
    return BLANK_SPLIT;
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

export default function SplitClient() {
  const [inp, setInp] = useState<SplitInputs>(BLANK_SPLIT);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [turn, setTurn] = useState<number | null>(null);
  const [lockedMsg, setLockedMsg] = useState("");
  const passRef = useRef<HTMLHeadingElement | null>(null);
  const turnRef = useRef<HTMLHeadingElement | null>(null);
  const [focusTo, setFocusTo] = useState<{ el: "pass" | "turn"; n: number } | null>(null);

  useEffect(() => {
    const loaded = loadInputs();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.what.trim();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage and the URL; intentionally synchronous on mount. */
    setInp(seeded ? { ...loaded, what: carried } : loaded);
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

  useEffect(() => {
    if (!focusTo) return;
    (focusTo.el === "pass" ? passRef : turnRef).current?.focus();
  }, [focusTo]);

  const n = inp.people.length;
  const rent = parseMoney(inp.rent);
  const rentOk = rent !== null && rent > 0;
  const read = useMemo(() => readSplit(inp), [inp]);
  const lockedCount = inp.locked.filter(Boolean).length;

  const setList = (k: "people" | "rooms", i: number, v: string) =>
    setInp((prev) => {
      const next = [...prev[k]];
      next[i] = v;
      return { ...prev, [k]: next };
    });

  const setBid = (person: number, room: number, v: string) =>
    setInp((prev) => {
      const bids = prev.bids.map((row) => [...row]);
      bids[person][room] = v;
      return { ...prev, bids };
    });

  const setLocked = (person: number, on: boolean, clear = false) =>
    setInp((prev) => {
      const locked = [...prev.locked];
      locked[person] = on;
      const bids = clear
        ? prev.bids.map((row, i) => (i === person ? row.map(() => "") : row))
        : prev.bids;
      return { ...prev, locked, bids };
    });

  const openTurn = (i: number) => {
    setTurn(i);
    setLockedMsg("");
    setFocusTo((f) => ({ el: "turn", n: (f?.n ?? 0) + 1 }));
  };

  const lockTurn = () => {
    if (turn === null) return;
    setLocked(turn, true);
    const left = inp.locked.filter((l, i) => !l && i !== turn).length;
    setLockedMsg(
      left
        ? `${personName(inp, turn)}'s prices are locked in and hidden. Pass the phone on.`
        : `${personName(inp, turn)}'s prices are locked in. That's everyone.`,
    );
    setTurn(null);
    setFocusTo((f) => ({ el: "pass", n: (f?.n ?? 0) + 1 }));
  };

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
        {showExample ? <SplitExample /> : null}
      </div>

      {/* ---- 1. The place ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="split-what" className={`block ${eyebrow} mb-2`}>
          What are you splitting?
        </label>
        <input
          id="split-what"
          type="text"
          value={inp.what}
          onChange={(e) => setInp((p) => ({ ...p, what: e.target.value }))}
          placeholder="e.g. The flat on Elm Road"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            setInp((p) => ({ ...p, what: "" }));
            setCarriedSeed("");
          }}
        />

        <label htmlFor="split-rent" className="mt-5 block text-sm text-[var(--muted)] mb-1.5">
          The rent for the whole place
        </label>
        <input
          id="split-rent"
          type="text"
          inputMode="decimal"
          value={inp.rent}
          onChange={(e) => setInp((p) => ({ ...p, rent: e.target.value }))}
          placeholder="e.g. £2,400"
          aria-invalid={moneyInvalid(inp.rent) || undefined}
          aria-describedby="split-rent-help"
          className={inputClass}
        />
        <p id="split-rent-help" className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          {moneyInvalid(inp.rent)
            ? "Type an amount, like 2400, £2,400 or 1,850.50. "
            : ""}
          Per month, or however often you pay it. Just the rent: split bills
          equally or by use, separately.
        </p>

        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How many of you, and rooms?</p>
        <div role="group" aria-label="How many housemates" className="flex flex-wrap gap-2">
          {Array.from({ length: MAX_PEOPLE - MIN_PEOPLE + 1 }, (_, k) => k + MIN_PEOPLE).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={n === k}
              onClick={() => {
                if (k === n) return;
                setTurn(null);
                setInp((p) => resize(p, k));
              }}
              className={`${chipBase} ${n === k ? chipOn : chipOff}`}
            >
              {k}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          One room each. A couple sharing a room counts as one, and splits their
          share between them. Changing the number clears everyone&rsquo;s prices.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <fieldset>
            <legend className="text-sm text-[var(--foreground)] mb-2">Who&rsquo;s moving in</legend>
            <div className="space-y-2">
              {inp.people.map((p, i) => (
                <input
                  key={i}
                  type="text"
                  value={p}
                  onChange={(e) => setList("people", i, e.target.value)}
                  placeholder={`Person ${i + 1}`}
                  aria-label={`Housemate ${i + 1}`}
                  className={inputClass}
                />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm text-[var(--foreground)] mb-2">The rooms</legend>
            <div className="space-y-2">
              {inp.rooms.map((r, i) => (
                <input
                  key={i}
                  type="text"
                  value={r}
                  onChange={(e) => setList("rooms", i, e.target.value)}
                  placeholder={`Room ${String.fromCharCode(65 + i)}${i === 0 ? ", e.g. Big room, en suite" : ""}`}
                  aria-label={`Room ${i + 1}`}
                  className={inputClass}
                />
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {/* ---- 2. Agree the method before the numbers ---- */}
      {rentOk ? (
        <div className={card}>
          <p className={eyebrow}>Before anyone types a number</p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            Agree out loud that you&rsquo;ll go with what comes out. It&rsquo;s
            much easier to accept a method you chose than a result you&rsquo;re
            looking at, and the method is the fair part: everyone prices every
            room, nobody sees anyone else&rsquo;s prices, and the rents are set so
            nobody would rather have someone else&rsquo;s room at its price.
          </p>
        </div>
      ) : null}

      {/* ---- 3. Private prices, one turn at a time ---- */}
      {rentOk ? (
        <div className={card}>
          <h2 ref={passRef} tabIndex={-1} className={`${eyebrow} focus:outline-none`}>
            Each of you prices the rooms, privately
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Pass this phone round. Each person opens their turn, prices every
            room, and locks it in. Locked prices are hidden until everyone&rsquo;s
            done. Don&rsquo;t say your numbers out loud.
          </p>

          {turn !== null ? (
            <TurnPanel
              key={turn}
              inp={inp}
              person={turn}
              rent={rent ?? 0}
              headingRef={turnRef}
              onBid={(r, v) => setBid(turn, r, v)}
              onEven={() => {
                const row = parseRow(inp.bids[turn]);
                if (!row || rent === null) return;
                const even = evenOutRounded(row, rent).map((x) => (Number.isInteger(x) ? String(x) : x.toFixed(2)));
                setInp((p) => {
                  const bids = p.bids.map((r) => [...r]);
                  bids[turn] = even;
                  return { ...p, bids };
                });
              }}
              onLock={lockTurn}
              onCancel={() => {
                setTurn(null);
                setFocusTo((f) => ({ el: "pass", n: (f?.n ?? 0) + 1 }));
              }}
            />
          ) : (
            <>
              {lockedMsg ? (
                <p className="mt-4 text-sm font-medium text-[var(--foreground)]" role="status">
                  {lockedMsg}
                </p>
              ) : null}
              <ul className="mt-4 space-y-2" aria-label="Who has priced the rooms">
                {inp.people.map((_, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2"
                  >
                    <span className="text-sm text-[var(--foreground)]">
                      {personName(inp, i)}
                      <span className="ml-2 text-xs text-[var(--muted)]">
                        {inp.locked[i] ? "✓ locked in" : "waiting"}
                      </span>
                    </span>
                    {inp.locked[i] ? (
                      <button
                        type="button"
                        onClick={() => setLocked(i, false, true)}
                        aria-label={`Clear ${personName(inp, i)}'s prices without showing them`}
                        className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      >
                        Redo
                      </button>
                    ) : (
                      <button type="button" onClick={() => openTurn(i)} className={secondaryBtn}>
                        I&rsquo;m {personName(inp, i)}{" "}&mdash; my turn
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {lockedCount < n ? (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {lockedCount} of {n} done. The answer appears when everyone has locked in.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {/* ---- The answer ---- */}
      <AnnounceAnswer message={read ? splitHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {rentOk
              ? "When everyone has priced the rooms, the answer appears here: who takes which room, what each of you pays, and how close anyone came to wanting a swap."
              : "Put in the rent, how many of you there are, and the rooms. Then each of you prices the rooms in turn."}
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_SPLIT);
          setCarriedSeed("");
          setTurn(null);
          setLockedMsg("");
        }}
      />
    </div>
  );
}

/** One person's private turn: a price for every room, adding up to the rent. */
function TurnPanel({
  inp,
  person,
  rent,
  headingRef,
  onBid,
  onEven,
  onLock,
  onCancel,
}: {
  inp: SplitInputs;
  person: number;
  rent: number;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBid: (room: number, v: string) => void;
  onEven: () => void;
  onLock: () => void;
  onCancel: () => void;
}) {
  const cur = splitCurrency(inp);
  const row = inp.bids[person];
  const gap = rowGap(row, rent);
  const filled = parseRow(row) !== null;
  const dec = Math.abs(rent - Math.round(rent)) > 1e-9 ? 2 : 0;
  const off = gap !== null && Math.abs(gap) >= 0.5 / 10 ** dec;
  const name = personName(inp, person);
  return (
    <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
      <h3 ref={headingRef} tabIndex={-1} className="text-base font-semibold text-[var(--foreground)] focus:outline-none">
        {name}&rsquo;s turn
      </h3>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        Price each room so that you{" "}
        <strong>wouldn&rsquo;t mind which one you got</strong> at those prices.
        Your prices must add up to the whole rent, {money(rent, cur, dec)}.
      </p>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        Price what matters to you: size, light, noise, the bathroom, the stairs.
        Your honest numbers are your best move. Pricing the room you want low
        to get it cheap can lose you the room.
      </p>
      <div className="mt-4 space-y-3">
        {inp.rooms.map((_, r) => {
          const id = `split-bid-${person}-${r}`;
          const bad = moneyInvalid(row[r] ?? "");
          return (
            <div key={r} className="grid grid-cols-[1fr_8rem] items-center gap-3">
              <label htmlFor={id} className="text-sm text-[var(--foreground)]">
                {roomName(inp, r)}
              </label>
              <input
                id={id}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={row[r] ?? ""}
                onChange={(e) => onBid(r, e.target.value)}
                placeholder={cur}
                aria-invalid={bad || undefined}
                className={inputClass}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]" aria-live="polite">
        {gap === null
          ? "Price every room to see the total."
          : !off
            ? `Adds up to ${money(rent, cur, dec)}. ✓`
            : gap > 0
              ? `${money(gap, cur, dec)} left to place.`
              : `${money(-gap, cur, dec)} over the rent.`}
      </p>
      {off ? (
        <div className="mt-2">
          <button type="button" onClick={onEven} className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity">
            {gap! > 0 ? "Spread what's left evenly" : "Take the extra off evenly"}
          </button>
          <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
            Only the gaps between your prices matter, so spreading the
            difference evenly doesn&rsquo;t change your answer. If you lock in
            without doing it, it&rsquo;s done for you.
          </p>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!filled} onClick={onLock} className={primaryBtn}>
          Lock in and hide my prices
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function ReadBlock({ inp, read }: { inp: SplitInputs; read: SplitRead }) {
  const [copied, setCopied] = useState<"" | "yes" | "no">("");
  const [showAll, setShowAll] = useState(false);
  const cur = splitCurrency(inp);
  const headline = splitHeadline(inp, read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>Who takes which room</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{headline}</p>

      <ul className="mt-5 divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {read.placements.map((p) => (
          <li key={p.person} className="flex items-baseline justify-between gap-4 py-2.5">
            <span className="text-sm text-[var(--foreground)]">
              <span className="font-medium">{personName(inp, p.person)}</span>
              <span className="text-[var(--muted)]"> takes </span>
              {roomName(inp, p.room)}
            </span>
            <span className="text-base font-semibold tabular-nums text-[var(--foreground)]">
              {money(p.price, cur, read.decimals)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <p>
          The rooms went to whoever valued them most, taken as a set, and the
          rents are the ones at which each of you prefers your own room to
          anyone else&rsquo;s, at its price, by as wide a margin as your numbers
          allow. What&rsquo;s left over is shared equally.
        </p>
        <p className={read.kind === "clear" ? "" : "pl-3 border-l-2 border-[var(--accent)]"}>
          {tightestSentence(inp, read)}
          {read.kind === "close"
            ? " That's within about 1% of the rent, so if their numbers were a rough guess, it's worth a second look at that room together before you sign."
            : ""}
        </p>
        <p>{equalSentence(inp, read)}</p>
        {read.evened.length ? (
          <p className="text-[var(--muted)]">
            {read.evened.length === 1
              ? `${personName(inp, read.evened[0])}'s prices didn't add up to the rent`
              : `Some prices didn't add up to the rent (${read.evened.map((i) => personName(inp, i)).join(", ")})`}
            , so the difference was spread evenly across their rooms. That
            doesn&rsquo;t change anything: only the gaps between
            one person&rsquo;s prices count.
          </p>
        ) : null}
        {read.negative ? (
          <p className="pl-3 border-l-2 border-[var(--accent)]">
            <span className="font-medium">One room comes out below zero.</span>{" "}
            Someone priced it so low that the fair answer is to pay them to take
            it. If that&rsquo;s a room nobody should live in, take it out of the
            split; otherwise the numbers are asking for it to be cheap.
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          aria-expanded={showAll}
          className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {showAll ? "Hide everyone's prices ↑" : "Show everyone's prices ↓"}
        </button>
        {showAll ? <BidsTable inp={inp} read={read} /> : null}
      </div>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Send it to the house</p>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--foreground)]">
          {read.placements.map((p) => placementLine(inp, read, p)).join("\n")}
        </pre>
        <div className="mt-3">
          <button
            type="button"
            onClick={async () => setCopied((await copyText(splitSummary(inp, read))) ? "yes" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "yes" ? "Copied the split, with how it was worked out" : "Copy the split as a message"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the lines above instead.</p>
        ) : null}
      </div>

      <div className="mt-5 pt-5 border-t border-[var(--border)]">
        <p className={eyebrow}>If someone won&rsquo;t accept it</p>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          <Link
            href={withSubject("/crux", inp.what)}
            className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
          >
            Find where you actually disagree →
          </Link>{" "}
          Usually it&rsquo;s one room, and either a fact (is the front room
          really that noisy?) or a value (does a bathroom of your own matter
          more than space?). Settle that, then price again.
        </p>
      </div>
    </div>
  );
}

/** Everyone's prices, after the answer, with each person's room marked. */
function BidsTable({ inp, read }: { inp: SplitInputs; read: SplitRead }) {
  const cur = splitCurrency(inp);
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <caption className="sr-only">What each person priced each room at. Their own room is marked.</caption>
        <thead>
          <tr>
            <th scope="col" className="text-left font-medium text-[var(--muted)] py-1.5 pr-3" />
            {inp.rooms.map((_, r) => (
              <th key={r} scope="col" className="text-right font-medium text-[var(--muted)] py-1.5 px-2">
                {roomName(inp, r)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inp.bids.map((row, i) => (
            <tr key={i} className="border-t border-[var(--border)]">
              <th scope="row" className="text-left font-medium text-[var(--foreground)] py-1.5 pr-3">
                {personName(inp, i)}
              </th>
              {row.map((b, r) => {
                const mine = read.placements[i].room === r;
                const v = parseMoney(b);
                return (
                  <td
                    key={r}
                    className={`text-right tabular-nums py-1.5 px-2 ${mine ? "text-[var(--accent)] font-semibold" : "text-[var(--foreground)]"}`}
                  >
                    {v === null ? "—" : money(v, cur, read.decimals)}
                    {mine ? <span className="sr-only"> (their room)</span> : null}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t border-[var(--border)]">
            <th scope="row" className="text-left font-medium text-[var(--muted)] py-1.5 pr-3">
              Rent
            </th>
            {inp.rooms.map((_, r) => {
              const p = read.placements.find((q) => q.room === r);
              return (
                <td key={r} className="text-right tabular-nums py-1.5 px-2 font-semibold text-[var(--foreground)]">
                  {p ? money(p.price, cur, read.decimals) : "—"}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * The worked example, read-only. Runs the same maths the live tool does on a
 * fixed case, so a newcomer sees a finished split without anything landing in
 * their own fields or storage.
 */
function SplitExample() {
  const ex = SPLIT_EXAMPLE;
  const read = readSplit(ex);
  if (!read) return null;
  const cur = splitCurrency(ex);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Alex, Sam and Priya were taking a {money(read.rent, cur)}-a-month flat:
        a big room with its own bathroom, a bright front room, and a box room
        over the stairs. Splitting it three ways meant someone paid{" "}
        {money(read.rent / 3, cur)}{" "}for the box room, and Alex and Priya both
        had their eye on the en suite.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        They passed one phone round. Each priced the three rooms so they
        wouldn&rsquo;t mind which they got, adding up to {money(read.rent, cur)}.
        Alex put the en suite at £1,050, Priya at £1,000. Sam cared more about
        light than a bathroom and put the front room highest.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The answer</p>
        <ul className="mt-2 space-y-1 text-sm text-[var(--foreground)]">
          {read.placements.map((p) => (
            <li key={p.person}>{placementLine(ex, read, p)}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          {splitHeadline(ex, read)}{" "}Priya didn&rsquo;t get the en suite, but at{" "}
          {money(read.placements[0].price, cur)}{" "}against her box room at{" "}
          {money(read.placements[2].price, cur)}, she wouldn&rsquo;t want it:
          by her own numbers, she&rsquo;s better off where she is.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}place.
      </p>
    </div>
  );
}
