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
  BLANK_RENT,
  COMPARABLE_SLOTS,
  PERIOD_WORD,
  actDate,
  comparablesOf,
  delayLine,
  evidenceLines,
  isISODate,
  letterDate,
  money,
  parseRentInputs,
  readRent,
  remindersOf,
  rentBody,
  rentExample,
  rentHeadline,
  rentLetters,
  rentRule,
  rentSummary,
  todayISO,
  type Afford,
  type Landlord,
  type NoticeForm,
  type RentInputs,
  type RentPeriod,
  type RentRead,
  type RentRegion,
  type YesNoUnsure,
} from "../data/rent";

/**
 * The rent's going up: pay it or challenge it? (/rent)
 *
 * The instrument for a landlord's notice of a new rent in England, under the
 * rules that changed on 1 May 2026. It checks the notice before the number
 * (the form, two months, a rent day, once a year), then the number against
 * what similar homes let for rather than against last year's rent, and dates
 * the last day to ask the tribunal.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/rent.ts` so it can be checked without a browser.
 */

const STORE_KEY = "rent:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £1,150.";

function loadInputs(): RentInputs {
  if (typeof window === "undefined") return BLANK_RENT;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseRentInputs(JSON.parse(raw)) : BLANK_RENT;
  } catch {
    return BLANK_RENT;
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

function downloadIcs(inp: RentInputs, list: { on: string; title: string; body: string }[]): void {
  const what = inp.what.trim();
  const p = (n: number) => String(n).padStart(2, "0");
  const events = list
    .filter((r) => isISODate(r.on))
    .map((r) => {
      const day = r.on.replace(/-/g, "");
      const [y, m, d] = r.on.split("-").map(Number);
      const next = new Date(y, m - 1, d + 1);
      const end = `${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`;
      return [
        "BEGIN:VEVENT",
        `UID:rent-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(what ? `${r.title} (${what})` : r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/rent`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Rent increase")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rent-${list[list.length - 1].on}.ics`;
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

function MoneyField({
  id,
  label,
  value,
  onChange,
  placeholder,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-2">
        {label}
        {optional ? <span className="text-[var(--muted)]"> (optional)</span> : null}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={moneyInvalid(value)}
        className={inputClass}
      />
      {moneyInvalid(value) ? <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p> : null}
    </div>
  );
}

export default function RentClient() {
  const [inp, setInp] = useState<RentInputs>(BLANK_RENT);
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

  const set = <K extends keyof RentInputs>(k: K, v: RentInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));
  const setComparable = (i: number, v: string) =>
    setInp((prev) => ({ ...prev, comparables: prev.comparables.map((c, j) => (j === i ? v : c)) }));

  const read = useMemo(() => readRent(inp, today), [inp, today]);
  const inEngland = inp.region === "eng";
  const privateLet = inEngland && inp.landlord === "private";
  const formal = privateLet && (inp.form === "form" || inp.form === "unsure");
  const showMoney = inp.region !== "" && (inp.region !== "eng" ? false : inp.landlord === "lodger" || (privateLet && inp.form !== ""));
  const per = inp.period ? PERIOD_WORD[inp.period] : "";

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
        {showExample ? <RentExample today={today} /> : null}
      </div>

      {/* ---- The home ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="rent-what" className={`block ${eyebrow} mb-2`}>
          Which home? <span className="normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <input
          id="rent-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. the flat on Elm Road"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where is it?</p>
        <Chips<RentRegion>
          label="Where the home is"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "eng", label: "England" },
            { id: "wales", label: "Wales" },
            { id: "scot", label: "Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        {inEngland ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Who do you rent from?</p>
            <Chips<Landlord>
              label="Who you rent from"
              value={inp.landlord}
              onPick={(v) => set("landlord", v)}
              cols={1}
              options={[
                { id: "private", label: "A private landlord or letting agent" },
                { id: "social", label: "A council or housing association" },
                { id: "lodger", label: "I live in my landlord's home (a lodger)" },
              ]}
            />
          </>
        ) : null}
        {privateLet ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How did they tell you?</p>
            <Chips<NoticeForm>
              label="How the landlord told you"
              value={inp.form}
              onPick={(v) => set("form", v)}
              cols={1}
              options={[
                { id: "form", label: "A form headed “Form 4A: Landlord's notice proposing a new rent” (or Form 4)" },
                { id: "informal", label: "A text, an email, or a letter in their own words" },
                { id: "unsure", label: "A letter, but I'm not sure if it's the official form" },
              ]}
            />
          </>
        ) : null}
      </div>

      {/* ---- The notice ---- */}
      {formal ? (
        <div className={card}>
          <p className={eyebrow}>The notice</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rent-served" className="block text-sm text-[var(--foreground)] mb-2">
                The day it reached you
              </label>
              <input
                id="rent-served"
                type="date"
                value={inp.servedOn}
                max={today}
                onChange={(e) => set("servedOn", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="rent-starts" className="block text-sm text-[var(--foreground)] mb-2">
                The day the new rent starts
              </label>
              <input
                id="rent-starts"
                type="date"
                value={inp.startsOn}
                onChange={(e) => set("startsOn", e.target.value)}
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                It&rsquo;s in section 4 of the form.
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            Is that the day your rent is normally due?
          </p>
          <Chips<YesNoUnsure>
            label="Whether the start date is a rent day"
            value={inp.onRentDay}
            onPick={(v) => set("onRentDay", v)}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
          <div className="mt-5">
            <label htmlFor="rent-last" className="block text-sm text-[var(--foreground)] mb-2">
              When did the rent last change, or the tenancy start if it never has?{" "}
              <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="rent-last"
              type="date"
              value={inp.lastChangeOn}
              max={today}
              onChange={(e) => set("lastChangeOn", e.target.value)}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
              A section 13 increase can only come once every 52 weeks.
            </p>
          </div>
        </div>
      ) : null}

      {/* ---- The numbers ---- */}
      {showMoney ? (
        <div className={card}>
          <p className={eyebrow}>The numbers</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">How often do you pay rent?</p>
          <Chips<RentPeriod>
            label="How often you pay rent"
            value={inp.period}
            onPick={(v) => set("period", v)}
            options={[
              { id: "month", label: "Monthly" },
              { id: "week", label: "Weekly" },
              { id: "fourweek", label: "Every four weeks" },
            ]}
          />
          {inp.period ? (
            <>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MoneyField
                  id="rent-current"
                  label={`Rent now, ${per}`}
                  value={inp.current}
                  onChange={(v) => set("current", v)}
                  placeholder="e.g. £1,150"
                />
                <MoneyField
                  id="rent-proposed"
                  label={`New rent, ${per}`}
                  value={inp.proposed}
                  onChange={(v) => set("proposed", v)}
                  placeholder="e.g. £1,295"
                />
              </div>
              <p className="mt-5 text-sm text-[var(--foreground)]">
                What do similar homes nearby let for, {per}?
              </p>
              <p className="mt-1 mb-3 text-xs text-[var(--muted)] leading-relaxed">
                Same number of bedrooms, same kind of place, as close as you
                can find. Use listings on the big property sites now, or let
                in the last few months. Two is the minimum; four or five is
                better. Screenshot each one.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: COMPARABLE_SLOTS }, (_, i) => (
                  <div key={i}>
                    <label htmlFor={`rent-comp-${i}`} className="sr-only">
                      Similar home {i + 1}
                    </label>
                    <input
                      id={`rent-comp-${i}`}
                      type="text"
                      inputMode="decimal"
                      value={inp.comparables[i] ?? ""}
                      onChange={(e) => setComparable(i, e.target.value)}
                      placeholder={`Home ${i + 1}`}
                      aria-invalid={moneyInvalid(inp.comparables[i] ?? "")}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              {inp.comparables.some(moneyInvalid) ? (
                <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p>
              ) : null}
            </>
          ) : null}
          {privateLet && inp.form !== "informal" ? (
            <>
              <div className="mt-5">
                <label htmlFor="rent-repairs" className="block text-sm text-[var(--foreground)] mb-2">
                  Anything wrong with the home that hasn&rsquo;t been fixed?{" "}
                  <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  id="rent-repairs"
                  type="text"
                  value={inp.repairs}
                  onChange={(e) => set("repairs", e.target.value)}
                  placeholder="e.g. damp in the bedroom, reported in March"
                  className={inputClass}
                />
              </div>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Could you afford the new rent?</p>
              <Chips<Afford>
                label="Whether you could afford the new rent"
                value={inp.afford}
                onPick={(v) => set("afford", v)}
                cols={1}
                options={[
                  { id: "yes", label: "Yes" },
                  { id: "stretch", label: "Only just, by cutting back" },
                  { id: "no", label: "No" },
                ]}
              />
            </>
          ) : null}
          <div className="mt-5">
            <label htmlFor="rent-landlord-name" className="block text-sm text-[var(--foreground)] mb-2">
              Landlord&rsquo;s or agent&rsquo;s name, for the letter{" "}
              <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="rent-landlord-name"
              type="text"
              value={inp.landlordName}
              onChange={(e) => set("landlordName", e.target.value)}
              placeholder="e.g. Ms Patel, or Elm Lettings"
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? rentHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where the home is, who you rent from and how they told you. The
            read appears: whether the notice is valid, where the new rent sits
            against similar homes, the last day to ask the tribunal, and the
            letter to send.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_RENT);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/** Where the new rent sits among the similar homes, on one line. */
function Strip({ inp, read }: { inp: RentInputs; read: RentRead }) {
  const comps = comparablesOf(inp);
  if (comps.length < 2 || read.proposedMonthly === null) return null;
  const pts = [...comps, read.proposedMonthly, ...(read.currentMonthly !== null ? [read.currentMonthly] : [])];
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const span = hi - lo || 1;
  const frac = (v: number) => 0.04 + ((v - lo) / span) * 0.92;
  const pos = (v: number) => `${frac(v) * 100}%`;
  // Labels near an end hang inwards, so they never spill off the strip.
  const hang = (v: number) =>
    frac(v) < 0.2 ? "-translate-x-[0.4rem]" : frac(v) > 0.8 ? "-translate-x-[calc(100%-0.4rem)]" : "-translate-x-1/2";
  const scale = inp.period === "week" ? 12 / 52 : inp.period === "fourweek" ? 12 / 13 : 1;
  const show = (v: number) => money(v * scale);
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Against similar homes</p>
      <div className="relative mt-8 mb-8 h-2 rounded-full bg-[var(--border)]" aria-hidden="true">
        {comps.map((c, i) => (
          <span
            key={i}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-[var(--muted)]"
            style={{ left: pos(c) }}
          />
        ))}
        {read.currentMonthly !== null ? (
          <span className={`absolute ${hang(read.currentMonthly)} top-4 text-xs text-[var(--muted)] whitespace-nowrap`} style={{ left: pos(read.currentMonthly) }}>
            ▲ now {show(read.currentMonthly)}
          </span>
        ) : null}
        <span
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-1.5 rounded-sm bg-[var(--accent)]"
          style={{ left: pos(read.proposedMonthly) }}
        />
        <span
          className={`absolute ${hang(read.proposedMonthly)} -top-6 text-xs font-medium text-[var(--accent)] whitespace-nowrap`}
          style={{ left: pos(read.proposedMonthly) }}
        >
          new {show(read.proposedMonthly)}
        </span>
      </div>
      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        Grey dots are the homes you found
        {read.marketMonthly !== null ? <>; their middle is {show(read.marketMonthly)}</> : null}.
        {read.offerMonthly !== null && read.verdict === "above" ? (
          <> A fair figure to offer: <span className="font-medium">{show(read.offerMonthly)}</span>.</>
        ) : null}
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: RentInputs; read: RentRead; today: string }) {
  const [copied, setCopied] = useState<string>("");
  const rule = rentRule();
  const letters = rentLetters(inp, read, today);
  const reminders = remindersOf(read, today);
  const evidence = evidenceLines(inp, read);
  const delay = delayLine(read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {rentHeadline(inp, read)}
      </p>
      <div className="mt-4 space-y-3">
        {rentBody(inp, read)
          .split("\n\n")
          .map((para) => (
            <p key={para} className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
              {para}
            </p>
          ))}
      </div>

      {read.status === "open" && read.applyBy ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>Last day to apply to the tribunal</p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{actDate(read.applyBy)}</p>
          <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
            {read.daysLeft !== null && read.daysLeft >= 0
              ? `${read.daysLeft === 0 ? "Today" : read.daysLeft === 1 ? "Tomorrow" : `${read.daysLeft} days from now`}. `
              : ""}
            Apply on form MR1 (search &ldquo;market rent determination&rdquo;
            on GOV.UK); it has to arrive before the new rent starts. Check the
            fee in the form&rsquo;s guidance: help with fees is available on a
            low income.
          </p>
          {reminders.length ? (
            <button type="button" onClick={() => downloadIcs(inp, reminders)} className={`mt-2 ${action}`}>
              Add {reminders.length === 1 ? "it" : "it, and a week-before nudge,"} to your calendar (.ics)
            </button>
          ) : null}
          {delay ? <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{delay}</p> : null}
        </div>
      ) : null}

      {read.status === "open" || read.status === "lodger" ? <Strip inp={inp} read={read} /> : null}

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`rent-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`rent-letter-${l.id}`}
            className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
          >
            {l.text}
          </pre>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(l.text)) ? l.id : "no")}
            className={`mt-3 ${action}`}
          >
            {copied === l.id ? "Copied" : "Copy the letter"}
          </button>
        </div>
      ))}

      {evidence.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>What to keep together</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {evidence.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. Free help: Shelter (England), Citizens Advice, and
        your council&rsquo;s private renting team, which can also act if a
        landlord harasses you or tries to evict you without a court order.
      </p>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
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
            onClick={async () => setCopied((await copyText(rentSummary(inp, read, today))) ? "all" : "no")}
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

function Handoffs({ inp }: { inp: RentInputs }) {
  const list: Handoff[] = [
    {
      href: withSubject("/walkaway", inp.what),
      label: "Negotiating with the landlord?",
      note: "Set your line before you talk: what moving would really cost you, all in, decides the most you'd agree to.",
    },
    {
      href: withSubject("/split", inp.what),
      label: "Sharing with housemates?",
      note: "Split the new rent fairly between rooms that aren't equal.",
    },
    {
      href: withSubject("/deposit", inp.what),
      label: "Moving out after all?",
      note: "Get the deposit back without losing it to unfair deductions.",
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
        <Link href="/writing/not-how-much-it-went-up" className={link}>
          Not how much it went up, but what it would let for
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
function RentExample({ today }: { today: string }) {
  const ex = rentExample(today);
  const read = readRent(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        We pay £1,150 a month for a two-bed flat. On{" "}
        {letterDate(ex.servedOn)} the agent sent a Form 4A: £1,295 from{" "}
        {letterDate(ex.startsOn)}, up 12.6%. It felt like a lot, but I
        didn&rsquo;t know whether it was unfair, and I didn&rsquo;t want to be
        the tenant who makes trouble. The bedroom damp I reported in March is
        still there.
      </p>
      <Strip inp={ex} read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {rentHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Four similar flats nearby were listed between £1,175 and £1,250. I
          sent the agent the four listings, the damp photos and an offer of
          £1,210, and said that otherwise I&rsquo;d ask the tribunal before
          the start date. Under the new rules that couldn&rsquo;t cost us more
          than the £1,295 already asked. They came back at £1,225, with a date
          for the damp work, and we agreed.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}notice.
      </p>
    </div>
  );
}
