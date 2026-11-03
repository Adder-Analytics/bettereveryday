"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_REDUNDANCY,
  actDate,
  datesOf,
  isISODate,
  keepList,
  knowList,
  letterDate,
  money,
  numInvalid,
  parseRedundancyInputs,
  readRedundancy,
  redundancyBody,
  redundancyExample,
  redundancyHeadline,
  redundancyLetters,
  redundancyRule,
  redundancySummary,
  todayISO,
  type DateLine,
  type EmployerState,
  type NoticeHow,
  type PayBasis,
  type RedundancyInputs,
  type RedundancyRead,
  type Region,
  type Settlement,
} from "../data/redundancy";

/**
 * Made redundant: is the money right? (/redundancy)
 *
 * The instrument for a redundancy letter and the figure that comes with it.
 * It splits the money into what the law owes anyway (statutory redundancy
 * pay, notice, holiday) and what's on top, which is all a settlement
 * agreement is really paying for. Dates the time limits and writes the
 * request for a breakdown.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/redundancy.ts` so it can be checked without a browser.
 */

const STORE_KEY = "redundancy:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £16,000.";
const NUM_BAD = "Couldn't read that as a number. Try something like 4.";

function loadInputs(): RedundancyInputs {
  if (typeof window === "undefined") return BLANK_REDUNDANCY;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseRedundancyInputs(JSON.parse(raw)) : BLANK_REDUNDANCY;
  } catch {
    return BLANK_REDUNDANCY;
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

function downloadIcs(list: DateLine[]): void {
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
        `UID:redundancy-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/redundancy`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Redundancy")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "redundancy-dates.ics";
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

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  optional,
  kind = "money",
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  optional?: boolean;
  kind?: "money" | "number";
  hint?: string;
}) {
  const bad = kind === "money" ? moneyInvalid(value) : numInvalid(value);
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
        aria-invalid={bad}
        className={inputClass}
      />
      {bad ? (
        <p className="mt-1.5 text-xs text-[var(--muted)]">{kind === "money" ? MONEY_BAD : NUM_BAD}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

function DateField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-2">
        {label}
      </label>
      <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      {hint ? <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export default function RedundancyClient() {
  const [inp, setInp] = useState<RedundancyInputs>(BLANK_REDUNDANCY);
  const [hydrated, setHydrated] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [today] = useState(() => todayISO());

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time
       hydration from browser storage; intentionally synchronous on mount. */
    setInp(loadInputs());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(inp));
    } catch {
      /* storage full or blocked — the tool still works, just won't persist */
    }
  }, [inp, hydrated]);

  const set = <K extends keyof RedundancyInputs>(k: K, v: RedundancyInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readRedundancy(inp), [inp]);
  const insolvent = inp.employerState === "insolvent";
  const datesBad =
    isISODate(inp.toldOn) && isISODate(inp.leavesOn) && inp.leavesOn < inp.toldOn
      ? "The last day can't be before the day you were told."
      : isISODate(inp.started) && isISODate(inp.toldOn) && inp.started >= inp.toldOn
        ? "The start date has to be before the day you were told."
        : isISODate(inp.born) && isISODate(inp.started) && inp.born >= inp.started
          ? "Check the date of birth: it's after the start date."
          : "";

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
        {showExample ? <Example today={today} /> : null}
      </div>

      {/* ---- The job ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>The job</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Where do you work?</p>
        <Chips<Region>
          label="Where you work"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "gb", label: "England, Wales or Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Is the employer still trading?</p>
        <Chips<EmployerState>
          label="Whether the employer is still trading"
          value={inp.employerState}
          onPick={(v) => set("employerState", v)}
          cols={1}
          options={[
            { id: "trading", label: "Yes, they're cutting jobs" },
            { id: "insolvent", label: "No: administration, liquidation or it's shut down" },
          ]}
        />
        <div className="mt-5">
          <label htmlFor="red-employer" className="block text-sm text-[var(--foreground)] mb-2">
            Employer&rsquo;s name, for the letters <span className="text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id="red-employer"
            type="text"
            value={inp.employer}
            onChange={(e) => set("employer", e.target.value)}
            placeholder="e.g. Northway Logistics"
            className={inputClass}
          />
        </div>
      </div>

      {/* ---- The dates ---- */}
      {inp.region && inp.employerState ? (
        <div className={card}>
          <p className={eyebrow}>The dates</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Redundancy pay depends on your age and full years of service, so the
            exact dates matter: a few days can add a year.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField id="red-born" label="Your date of birth" value={inp.born} onChange={(v) => set("born", v)} />
            <DateField
              id="red-started"
              label="The day you started"
              value={inp.started}
              onChange={(v) => set("started", v)}
              hint="Include time with an earlier owner if the business was transferred."
            />
            <DateField
              id="red-told"
              label="The day you were given notice"
              value={inp.toldOn}
              onChange={(v) => set("toldOn", v)}
              hint="The dismissal letter, not the first at-risk meeting."
            />
            <DateField
              id="red-leaves"
              label="Your last day of employment"
              value={inp.leavesOn}
              onChange={(v) => set("leavesOn", v)}
              hint="The date your contract ends, even if you stop working sooner."
            />
          </div>
          {datesBad ? <p className="mt-3 text-sm text-[var(--accent)]">{datesBad}</p> : null}
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How is your notice being handled?</p>
          <Chips<NoticeHow>
            label="How your notice is being handled"
            value={inp.noticeHow}
            onPick={(v) => set("noticeHow", v)}
            cols={1}
            options={[
              { id: "work", label: "I'm working it" },
              { id: "garden", label: "Garden leave: paid to stay at home" },
              { id: "pilon", label: "Paid in lieu: I leave early and get it as a lump sum" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
          {!insolvent ? (
            <div className="mt-5 max-w-xs">
              <TextField
                id="red-contract"
                label="Notice in your contract, in weeks"
                value={inp.contractWeeks}
                onChange={(v) => set("contractWeeks", v)}
                placeholder="e.g. 4 (a month is about 4.3)"
                kind="number"
                optional
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- The pay ---- */}
      {inp.region && inp.employerState ? (
        <div className={card}>
          <p className={eyebrow}>Pay and holiday</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Your normal pay before tax is</p>
          <Chips<PayBasis>
            label="How you'll enter your pay"
            value={inp.payBasis}
            onPick={(v) => set("payBasis", v)}
            options={[
              { id: "year", label: "A yearly salary" },
              { id: "month", label: "A monthly amount" },
              { id: "week", label: "A weekly amount" },
            ]}
          />
          {inp.payBasis ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                id="red-pay"
                label={`Gross pay, ${inp.payBasis === "year" ? "a year" : inp.payBasis === "month" ? "a month" : "a week"}`}
                value={inp.pay}
                onChange={(v) => set("pay", v)}
                placeholder={inp.payBasis === "year" ? "e.g. £38,000" : inp.payBasis === "month" ? "e.g. £3,150" : "e.g. £730"}
                hint="Basic pay. If your hours or pay vary, use the average of the last 12 weeks."
              />
              <TextField
                id="red-days"
                label="Days you work in a normal week"
                value={inp.daysPerWeek}
                onChange={(v) => set("daysPerWeek", v)}
                placeholder="5"
                kind="number"
              />
            </div>
          ) : null}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="red-holiday"
              label="Holiday a year, in days, with bank holidays"
              value={inp.holidayDays}
              onChange={(v) => set("holidayDays", v)}
              placeholder="e.g. 33"
              kind="number"
              optional
              hint="Leave blank for the legal minimum: 28 for five days a week."
            />
            <TextField
              id="red-taken"
              label="Days taken this leave year"
              value={inp.holidayTaken}
              onChange={(v) => set("holidayTaken", v)}
              placeholder="e.g. 20"
              kind="number"
              hint="Including any booked before you leave."
            />
            <DateField
              id="red-leave-year"
              label="Your leave year started on"
              value={inp.leaveYearFrom}
              onChange={(v) => set("leaveYearFrom", v)}
              hint="Often 1 January or 1 April. Blank assumes January."
            />
          </div>
        </div>
      ) : null}

      {/* ---- The offer ---- */}
      {inp.region && inp.employerState && !insolvent ? (
        <div className={card}>
          <p className={eyebrow}>What they&rsquo;ve offered</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              id="red-offer"
              label="The total they've offered, before tax"
              value={inp.offer}
              onChange={(v) => set("offer", v)}
              placeholder="e.g. £16,000"
              optional
            />
            <TextField
              id="red-offer-red"
              label="The redundancy pay line, if it's split out"
              value={inp.offerRedundancy}
              onChange={(v) => set("offerRedundancy", v)}
              placeholder="e.g. £7,500"
              optional
            />
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Have they asked you to sign a settlement agreement?</p>
          <Chips<Settlement>
            label="Whether you've been asked to sign a settlement agreement"
            value={inp.settlement}
            onPick={(v) => set("settlement", v)}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No, or not yet" },
            ]}
          />
          <div className="mt-5 max-w-xs">
            <TextField
              id="red-outgoings"
              label="What you spend in a month"
              value={inp.outgoings}
              onChange={(v) => set("outgoings", v)}
              placeholder="e.g. £2,100"
              optional
              hint="Rent or mortgage, bills, food, debts. It turns the total into months."
            />
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? redundancyHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Fill in the dates, how your notice is handled and your pay. The read
            appears: what the law owes you line by line, how much of any offer
            is on top of that, the dates that matter, and the email asking for
            the breakdown.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_REDUNDANCY)} />
    </div>
  );
}

/** The offer as two blocks: owed anyway, and on top. */
function Split({ read }: { read: RedundancyRead }) {
  if (read.offer === null) return null;
  const total = Math.max(read.offer, read.owedLump);
  const owedShare = Math.min(1, read.owedLump / total);
  const short = read.offer < read.owedLump;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What the offer is made of</p>
      <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-[var(--border)]" aria-hidden="true">
        <span className="h-full bg-[var(--muted)]" style={{ width: `${owedShare * 100}%` }} />
        {!short ? <span className="h-full bg-[var(--accent)]" style={{ width: `${(1 - owedShare) * 100}%` }} /> : null}
      </div>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--muted)] align-middle mr-1.5" aria-hidden="true" />
        Owed by law anyway: <span className="font-medium">{money(read.owedLump)}</span>
        <br />
        {short ? (
          <>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--border)] align-middle mr-1.5" aria-hidden="true" />
            Offered: <span className="font-medium">{money(read.offer)}</span>, which is{" "}
            <span className="font-medium">{money(read.owedLump - read.offer)}</span> short
          </>
        ) : (
          <>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)] align-middle mr-1.5" aria-hidden="true" />
            On top: <span className="font-medium">{money(read.offer - read.owedLump)}</span>
          </>
        )}
      </p>
    </div>
  );
}

function Lines({ read }: { read: RedundancyRead }) {
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>{read.status === "insolvent" ? "What the government scheme pays" : "What the law owes you"}</p>
      <ul className="mt-3 space-y-3">
        {read.lines.map((l) => (
          <li key={l.id} className="text-sm leading-relaxed">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--foreground)] font-medium">{l.label}</span>
              <span className="text-[var(--foreground)] font-medium tabular-nums">{money(l.amount)}</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {l.detail} {l.taxable ? "Taxed as pay." : "Tax-free up to £30,000."}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: RedundancyInputs; read: RedundancyRead; today: string }) {
  const [copied, setCopied] = useState<string>("");
  const rule = redundancyRule();
  const letters = redundancyLetters(inp, read, today);
  const dates = datesOf(inp, read);
  const know = knowList(inp, read);
  const keep = keepList(read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {redundancyHeadline(inp, read)}
      </p>
      <Split read={read} />
      <div className="mt-4 space-y-3">
        {redundancyBody(inp, read)
          .split("\n\n")
          .map((para) => (
            <p key={para} className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
              {para}
            </p>
          ))}
      </div>
      <Lines read={read} />

      {read.doubts.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>Worth checking</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {read.doubts.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {dates.length ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>The dates that matter</p>
          <ul className="mt-3 space-y-3">
            {dates.map((d) => (
              <li key={d.title} className="text-sm leading-relaxed">
                <span className="font-semibold text-[var(--foreground)]">{actDate(d.on)}</span>
                {d.on.slice(0, 4) !== today.slice(0, 4) ? ` ${d.on.slice(0, 4)}` : ""}
                <span className="text-[var(--foreground)]">: {d.title}.</span>{" "}
                <span className="text-[var(--muted)]">{d.body}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => downloadIcs(dates)} className={`mt-3 ${action}`}>
            Add them to your calendar (.ics), with a week&rsquo;s warning
          </button>
        </div>
      ) : null}

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`red-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`red-letter-${l.id}`}
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

      {know.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>Also worth knowing</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {know.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>What to keep together</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {keep.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. Free help: Acas (England, Scotland and Wales), the
        Labour Relations Agency (Northern Ireland), Citizens Advice, and your
        union if you have one. A settlement agreement needs an adviser&rsquo;s
        signature anyway, so ask the employer to pay for one.
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
            onClick={async () => setCopied((await copyText(redundancySummary(inp, read, today))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole plan" : "Copy the whole plan as text"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words above instead.</p>
        ) : null}
      </div>
      <Handoffs />
    </div>
  );
}

function Handoffs() {
  const list = [
    {
      href: "/walkaway",
      label: "Negotiating the package?",
      note: "Set your line before the meeting: what you'd get by not signing, and the least you'd sign for.",
    },
    {
      href: "/debts",
      label: "Money tight while you look?",
      note: "With one amount a month to spare, decide which debt to pay first.",
    },
    {
      href: "/monthly",
      label: "Cutting back?",
      note: "Find which monthly costs are worth keeping when the income stops.",
    },
  ];
  return (
    <div className="mt-5 pt-5 border-t border-[var(--border)]">
      <p className={eyebrow}>Where to take it next</p>
      <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
        {list.map((h) => (
          <li key={h.href}>
            <Link href={h.href} className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium">
              {h.label} →
            </Link>{" "}
            {h.note}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        More on why this works:{" "}
        <Link href="/writing/the-price-of-your-signature" className={link}>
          The price of your signature
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
function Example({ today }: { today: string }) {
  const ex = redundancyExample(today);
  const read = readRedundancy(ex);
  if (!read || read.extra === null) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I&rsquo;m 46 and I&rsquo;ve worked in the planning office at a
        logistics firm for eight years, on £38,000. On{" "}
        {letterDate(ex.toldOn)}{" "}they confirmed my role was going, with a
        month&rsquo;s pay in lieu of notice, and handed me a settlement
        agreement: £16,000 if I sign. It sounded like a lot. Four months&rsquo;
        salary, near enough.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {redundancyHeadline(ex, read)}
        </p>
        <Split read={read} />
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The law already gave me {money(read.statutory)}{" "}of redundancy pay,
          eight weeks&rsquo; notice (not the month they&rsquo;d said: after
          eight years the legal minimum is longer than my contract) and the
          holiday I hadn&rsquo;t taken. So the agreement was paying{" "}
          {money(read.extra)} for me to give up any claim about how I was
          picked. I asked for the breakdown and for them to pay for the
          adviser. The adviser spotted that I was the only one in my pool. The
          signed version paid £21,500.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}figures.
      </p>
    </div>
  );
}
