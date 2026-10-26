"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_FLIGHT,
  actDate,
  careLines,
  claimMessage,
  escalateMessage,
  flightBody,
  flightExample,
  flightHeadline,
  flightRule,
  flightSummary,
  isISODate,
  parseFlightInputs,
  readFlight,
  regimeOf,
  todayISO,
  type Band,
  type Carrier,
  type Early,
  type FlightInputs,
  type FlightRead,
  type Late,
  type Notice,
  type Place,
  type Problem,
  type Reason,
  type Stage,
} from "../data/flight";

/**
 * Flight delayed or cancelled (/flight)
 *
 * The instrument for the flight that landed hours late, was cancelled at short
 * notice, or left without you. The compensation is a fixed amount by distance
 * (UK261 / EU261), the airline's first reason often isn't a defence (a
 * technical fault isn't extraordinary), and the free escalation opens after
 * eight weeks. So the tool does the sum, writes the claim with the answer to
 * their reason in it, and dates the next step before the first message goes.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/flight.ts` so it can be checked without a browser.
 */

const STORE_KEY = "flight:v1";

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
const link = "text-[var(--accent)] hover:opacity-70 transition-opacity";
const action = "text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity";

function loadInputs(): FlightInputs {
  if (typeof window === "undefined") return BLANK_FLIGHT;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseFlightInputs(JSON.parse(raw)) : BLANK_FLIGHT;
  } catch {
    return BLANK_FLIGHT;
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

/** The day the free escalation opens, as one all-day event. */
function downloadEscalateIcs(inp: FlightInputs, read: FlightRead): void {
  const on = read.escalateFrom;
  if (!on || !isISODate(on)) return;
  const what = inp.what.trim() || "the flight claim";
  const day = on.replace(/-/g, "");
  const [y, m, d] = on.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  const end = `${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`;
  const body =
    read.regime === "uk"
      ? "If the airline hasn't paid or given a final answer, take it to its ADR scheme or the CAA. Free."
      : "If the airline hasn't paid or given a final answer, take it to the national enforcement body.";
  const event = [
    "BEGIN:VEVENT",
    `UID:flight-${todayISO()}-${on}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(`Escalate if unpaid: ${what}`)}`,
    `DESCRIPTION:${icsEscape(`${body}\n${SITE_URL}/flight`)}`,
    "END:VEVENT",
  ];
  const blob = new Blob([wrapCalendar([event], "Flight claim")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flight-escalate-${on}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** A row of mutually exclusive answers. */
function Chips<T extends string>({
  value,
  options,
  onPick,
  label,
  cols = 2,
}: {
  value: T;
  options: { id: T; label: string }[];
  onPick: (v: T) => void;
  label: string;
  cols?: 1 | 2;
}) {
  const grid = cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
  return (
    <div role="group" aria-label={label} className={`grid ${grid} gap-2`}>
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

const LATE_OPTIONS: { id: Late; label: string }[] = [
  { id: "lt2", label: "Under 2 hours" },
  { id: "2to3", label: "2 to 3 hours" },
  { id: "3to4", label: "3 to 4 hours" },
  { id: "4plus", label: "4 hours or more" },
];

export default function FlightClient() {
  const [inp, setInp] = useState<FlightInputs>(BLANK_FLIGHT);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [today] = useState(() => todayISO());

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

  const set = <K extends keyof FlightInputs>(k: K, v: FlightInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readFlight(inp, today), [inp, today]);
  const askCarrier = inp.from === "other" && (inp.to === "uk" || inp.to === "eu");
  const regime = regimeOf(inp);
  const covered = Boolean(inp.from && inp.to) && regime !== "none";
  const rerouted = inp.problem === "cancel" || inp.problem === "bumped";
  const showLate = inp.problem === "delay" || inp.problem === "bumped" || (inp.problem === "cancel" && inp.notice !== "" && inp.notice !== "14plus");
  const showEarly =
    inp.problem === "cancel" &&
    (inp.notice === "7to13" || inp.notice === "lt7") &&
    inp.late !== "" &&
    inp.late !== "none" &&
    inp.late !== "4plus";
  const asked = inp.stage === "asked" || inp.stage === "refused" || inp.stage === "ignored";

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
        {showExample ? <FlightExample today={today} /> : null}
      </div>

      {/* ---- The flight ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="flight-what" className={`block ${eyebrow} mb-2`}>
          Which flight?
        </label>
        <input
          id="flight-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. the 07:05 from Gatwick to Faro"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <label htmlFor="flight-airline" className="block mt-4 text-sm text-[var(--foreground)] mb-2">
          Which airline? <span className="text-[var(--muted)]">(optional)</span>
        </label>
        <input
          id="flight-airline"
          type="text"
          value={inp.airline}
          onChange={(e) => set("airline", e.target.value)}
          placeholder="The one that operated it, not the travel agent"
          className={inputClass}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What happened?</p>
        <Chips<Problem>
          label="What happened"
          value={inp.problem}
          onPick={(v) => set("problem", v)}
          cols={1}
          options={[
            { id: "delay", label: "It was delayed (or I missed a connection on the same booking)" },
            { id: "cancel", label: "It was cancelled" },
            { id: "bumped", label: "I was bumped: refused boarding against my will" },
          ]}
        />
        <label htmlFor="flight-flown" className="block mt-5 text-sm text-[var(--foreground)] mb-2">
          When was the flight?
        </label>
        <input
          id="flight-flown"
          type="date"
          value={inp.flown}
          max={today}
          onChange={(e) => set("flown", e.target.value)}
          className={`${inputClass} sm:max-w-[14rem]`}
        />
        <label htmlFor="flight-pax" className="block mt-5 text-sm text-[var(--foreground)] mb-2">
          How many passengers on the booking?
        </label>
        <input
          id="flight-pax"
          type="text"
          inputMode="numeric"
          value={inp.pax}
          onChange={(e) => set("pax", e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
          placeholder="1"
          className={`${inputClass} max-w-[6rem]`}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          Each passenger with a ticket is owed the full amount, children
          included. Babies travelling free on a lap aren&rsquo;t covered.
        </p>
      </div>

      {/* ---- Where it flew ---- */}
      <div className={card}>
        <p className={eyebrow}>Where it flew</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">It left from</p>
        <Chips<Place>
          label="Where it left from"
          value={inp.from}
          onPick={(v) => set("from", v)}
          options={[
            { id: "uk", label: "The UK" },
            { id: "eu", label: "The EU, Iceland, Norway or Switzerland" },
            { id: "other", label: "Somewhere else" },
          ]}
        />
        <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Its final destination was</p>
        <Chips<Place>
          label="Where it was going"
          value={inp.to}
          onPick={(v) => set("to", v)}
          options={[
            { id: "uk", label: "The UK" },
            { id: "eu", label: "The EU, Iceland, Norway or Switzerland" },
            { id: "other", label: "Somewhere else" },
          ]}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          With connections on one booking, use the first airport and the last.
        </p>
        {askCarrier ? (
          <>
            <p className="mt-4 text-sm text-[var(--foreground)] mb-2">The airline is based in</p>
            <Chips<Carrier>
              label="Where the airline is based"
              value={inp.carrier}
              onPick={(v) => set("carrier", v)}
              options={[
                { id: "uk", label: "The UK" },
                { id: "eu", label: "The EU" },
                { id: "other", label: "Somewhere else" },
              ]}
            />
          </>
        ) : null}
        {covered ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How far is it?</p>
            <Chips<Band>
              label="Flight distance"
              value={inp.band}
              onPick={(v) => set("band", v)}
              cols={1}
              options={[
                { id: "short", label: "Up to 1,500 km: London to Paris, Dublin, Amsterdam, Barcelona" },
                { id: "medium", label: "1,500 to 3,500 km: London to Lisbon, Faro, Athens, the Canaries" },
                { id: "long", label: "Over 3,500 km: London to New York, Dubai, Delhi" },
              ]}
            />
            <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
              Not sure? Search &ldquo;distance from [first airport] to [last
              airport]&rdquo;. It&rsquo;s the straight-line distance.
            </p>
          </>
        ) : null}
      </div>

      {/* ---- What happened, exactly ---- */}
      {covered && inp.problem ? (
        <div className={card}>
          <p className={eyebrow}>What happened, exactly</p>
          {inp.problem === "cancel" ? (
            <>
              <p className="mt-3 text-sm text-[var(--foreground)] mb-2">When did they tell you?</p>
              <Chips<Notice>
                label="Notice of the cancellation"
                value={inp.notice}
                onPick={(v) => set("notice", v)}
                cols={1}
                options={[
                  { id: "14plus", label: "Two weeks or more before the flight" },
                  { id: "7to13", label: "Between 7 and 13 days before" },
                  { id: "lt7", label: "Less than a week before, or at the airport" },
                ]}
              />
            </>
          ) : null}
          {showLate ? (
            <>
              <p className="mt-4 text-sm text-[var(--foreground)] mb-2">
                {rerouted
                  ? "How much later than planned did the replacement get you to your final destination?"
                  : "How late did you reach your final destination?"}
              </p>
              <Chips<Late>
                label="How late you arrived"
                value={inp.late}
                onPick={(v) => set("late", v)}
                options={rerouted ? [...LATE_OPTIONS, { id: "none", label: "I didn't fly, or took a refund" }] : LATE_OPTIONS}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                It&rsquo;s when the doors opened at the gate, not when the
                wheels touched down. A flight-tracking site will show the
                actual time.
              </p>
            </>
          ) : null}
          {showEarly ? (
            <>
              <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Did the replacement leave earlier than your original?</p>
              <Chips<Early>
                label="How much earlier the replacement left"
                value={inp.early}
                onPick={(v) => set("early", v)}
                options={[
                  { id: "no", label: "No, or less than an hour earlier" },
                  { id: "1to2", label: "1 to 2 hours earlier" },
                  { id: "over2", label: "More than 2 hours earlier" },
                ]}
              />
            </>
          ) : null}
          {inp.problem !== "bumped" ? (
            <>
              <p className="mt-4 text-sm text-[var(--foreground)] mb-2">What reason did they give?</p>
              <Chips<Reason>
                label="The reason they gave"
                value={inp.reason}
                onPick={(v) => set("reason", v)}
                options={[
                  { id: "tech", label: "A technical or mechanical problem" },
                  { id: "staff", label: "Crew shortage, or their own staff on strike" },
                  { id: "knock", label: "The plane was late from an earlier flight" },
                  { id: "weather", label: "Bad weather" },
                  { id: "atc", label: "Air traffic control, or a strike by airport staff" },
                  { id: "other", label: "A bird strike, security alert or sick passenger" },
                  { id: "unknown", label: "No reason, or I don't know" },
                ]}
              />
            </>
          ) : null}
          <label htmlFor="flight-spent" className="block mt-5 text-sm text-[var(--foreground)] mb-2">
            What did you spend on food, a hotel or transport while you waited?{" "}
            <span className="text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id="flight-spent"
            type="text"
            inputMode="decimal"
            value={inp.spent}
            onChange={(e) => set("spent", e.target.value)}
            placeholder="e.g. £46"
            aria-invalid={moneyInvalid(inp.spent)}
            className={`${inputClass} sm:max-w-[14rem]`}
          />
          {moneyInvalid(inp.spent) ? (
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Couldn&rsquo;t read that as an amount. Try something like £46.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ---- Where it's got to ---- */}
      {covered && inp.problem ? (
        <div className={card}>
          <p className={eyebrow}>Where it&rsquo;s got to</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Have you claimed from the airline?</p>
          <Chips<Stage>
            label="Where it's got to"
            value={inp.stage}
            onPick={(v) => set("stage", v)}
            options={[
              { id: "none", label: "Not yet" },
              { id: "asked", label: "Yes, and I'm waiting" },
              { id: "refused", label: "Yes, and they said no, or offered vouchers" },
              { id: "ignored", label: "Yes, and they've gone quiet" },
            ]}
          />
          {asked ? (
            <>
              <label htmlFor="flight-asked" className="block mt-4 text-sm text-[var(--foreground)] mb-2">
                When did you claim? <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="flight-asked"
                type="date"
                value={inp.askedOn}
                max={today}
                onChange={(e) => set("askedOn", e.target.value)}
                className={`${inputClass} sm:max-w-[14rem]`}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? flightHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say what happened, where the flight went, how far, how late, the
            reason they gave and whether you&rsquo;ve claimed, and the read
            appears: what you&rsquo;re owed, the claim to send, and the date
            the next step opens.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_FLIGHT);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function MessageBox({
  title,
  note,
  text,
  copied,
  onCopy,
  id,
}: {
  title: string;
  note?: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
  id: string;
}) {
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow} id={id}>{title}</p>
      {note ? <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{note}</p> : null}
      <pre
        aria-labelledby={id}
        className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
      >
        {text}
      </pre>
      <button type="button" onClick={onCopy} className={`mt-3 ${action}`}>
        {copied ? "Copied" : "Copy the message"}
      </button>
    </div>
  );
}

function ReadBlock({ inp, read }: { inp: FlightInputs; read: FlightRead }) {
  const [copied, setCopied] = useState<"" | "claim" | "esc" | "line" | "all" | "no">("");
  const rule = flightRule();
  const esc = escalateMessage(inp, read);
  const claim = read.kind === "outside" || read.kind === "old" ? null : claimMessage(inp, read);
  const showClaim = claim !== null && (read.kind !== "under" || read.spent !== null);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {flightHeadline(inp, read)}
      </p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{flightBody(inp, read)}</p>

      {esc ? (
        <MessageBox
          id="flight-esc-msg"
          title={read.regime === "uk" ? "For the ADR scheme or the CAA" : "For the national enforcement body"}
          note="Paste it into their online form. Attach your booking, your claim, the airline's reply and any receipts."
          text={esc}
          copied={copied === "esc"}
          onCopy={async () => setCopied((await copyText(esc)) ? "esc" : "no")}
        />
      ) : null}

      {showClaim && claim ? (
        <MessageBox
          id="flight-claim-msg"
          title={
            read.kind === "escalate"
              ? "The claim you sent, or should have"
              : read.kind === "under"
                ? "Your expenses claim to the airline"
                : read.kind === "excused"
                  ? "Your message to the airline"
                  : "Your claim to the airline"
          }
          note="Send it through the airline's own claims form or customer relations email, so it's dated. Fill in the square brackets."
          text={claim}
          copied={copied === "claim"}
          onCopy={async () => setCopied((await copyText(claim)) ? "claim" : "no")}
        />
      ) : null}

      {read.replyBy && isISODate(read.replyBy) ? (
        <p className="mt-4 text-sm text-[var(--foreground)]">
          Pay-by date in the message: <span className="font-medium">{actDate(read.replyBy)}</span>
        </p>
      ) : null}
      {read.escalateFrom && isISODate(read.escalateFrom) && read.kind !== "escalate" ? (
        <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-sm text-[var(--foreground)]">
            Free escalation opens: <span className="font-medium">{actDate(read.escalateFrom)}</span>
          </p>
          <button type="button" onClick={() => downloadEscalateIcs(inp, read)} className={action}>
            Add it to your calendar (.ics)
          </button>
        </div>
      ) : null}

      {read.kind !== "outside" ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>What you were owed at the airport, whatever the cause</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {careLines(inp).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        UK261 and EU261; not legal advice. The EU agreed changes to its rules
        in 2026 that aren&rsquo;t in force yet, and they don&rsquo;t change
        UK261. <strong className="font-medium">In the US</strong>, there&rsquo;s
        no cash for a delay by law. Since 2024 the airline must refund you
        automatically, in money, if it cancels or significantly changes a
        flight and you don&rsquo;t take the alternative; bumped passengers
        are owed denied-boarding compensation of up to four times the one-way
        fare, capped.
      </p>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          At the airport: photograph the departures board, keep every
          receipt, and ask the desk for the reason in writing. That&rsquo;s
          most of the evidence a claim ever needs.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={async () => setCopied((await copyText(rule)) ? "line" : "no")}
            className={action}
          >
            {copied === "line" ? "Copied your line" : "Copy your line"}
          </button>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(flightSummary(inp, read))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole plan" : "Copy the whole plan as text"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Couldn&rsquo;t copy. Select the words above instead.
          </p>
        ) : null}
      </div>
      <Handoffs inp={inp} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp }: { inp: FlightInputs }) {
  const s = inp.what;
  const list: Handoff[] = [
    {
      href: withSubject("/refund", "the hotel"),
      label: "The rest of the trip",
      note: "The hotel you couldn't reach, the car hire, the holiday that wasn't as described: what the law gives you, and the message to send.",
    },
    {
      href: withSubject("/scam", "a call about my flight compensation"),
      label: "If someone calls offering to claim it for you",
      note: "Cold calls and texts about \"your flight compensation\" are a known scam. Check before you give details or pay a fee.",
    },
    {
      href: withSubject("/rule", s),
      label: "Make it a standing rule",
      note: "Three hours late, claim it yourself that week, money not vouchers. Decide it once.",
    },
  ];
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
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        More on why this works:{" "}
        <Link href="/writing/ask-once-in-writing-with-a-date" className={link}>
          Ask once, in writing, with a date
        </Link>
        .
      </p>
    </div>
  );
}

/**
 * The worked example, read-only. Runs the same read the live tool does on a
 * fixed case, so a newcomer sees a finished pass without anything landing in
 * their own fields or storage.
 */
function FlightExample({ today }: { today: string }) {
  const ex = flightExample(today);
  const read = readFlight(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Four of us flew Gatwick to Faro for half-term. The desk said
        &ldquo;technical issue&rdquo;; we landed four hours forty late and
        spent £46 on sandwiches and drinks. I claimed online, and three weeks
        later the airline said no, citing extraordinary circumstances. I&rsquo;d
        have left it there.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {flightHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Gatwick to Faro is about 1,700 km, so it&rsquo;s £350 each, £1,400
          for the four of us, plus the £46. A technical fault isn&rsquo;t
          extraordinary: the Court of Appeal settled that in 2014. I asked for
          a final response, pasted the case into the ADR form, and the airline
          paid before a decision was needed.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}flight.
      </p>
    </div>
  );
}
