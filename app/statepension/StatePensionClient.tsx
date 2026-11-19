"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_STATEPENSION,
  CLASS3_NOW,
  FULL_WEEKLY,
  GAP_YEARS,
  UNIT_YEARLY,
  checksOf,
  countInvalid,
  datesOf,
  deadlineOf,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  parseStatePensionInputs,
  readStatePension,
  remindersOf,
  spaDate,
  statePensionBody,
  statePensionExample,
  statePensionHeadline,
  statePensionRule,
  statePensionSummary,
  taxYearLabel,
  tilesOf,
  todayISO,
  type DateLine,
  type GapPlan,
  type Source,
  type StatePensionInputs,
  type StatePensionRead,
  type Tax,
  type Unsure,
  type Work,
  type YesNo,
} from "../data/statepension";

/**
 * State Pension gaps: worth paying, and by when? (/statepension)
 *
 * Sorts the open gaps in a National Insurance record into the years you'll
 * need whatever happens, the ones you'll only need if you stop work early, and
 * the ones you won't, and prices what each buys.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/statepension.ts` so it can be checked without a browser.
 */

const STORE_KEY = "statepension:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase = "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff = "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow = "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card = "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const link = "text-[var(--accent)] hover:opacity-70 transition-opacity";
const action = "text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity";

function loadInputs(): StatePensionInputs {
  if (typeof window === "undefined") return BLANK_STATEPENSION;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseStatePensionInputs(JSON.parse(raw)) : BLANK_STATEPENSION;
  } catch {
    return BLANK_STATEPENSION;
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
    .map((r, i) => {
      const day = r.on.replace(/-/g, "");
      const [y, m, d] = r.on.split("-").map(Number);
      const next = new Date(y, m - 1, d + 1);
      const end = `${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`;
      return [
        "BEGIN:VEVENT",
        `UID:statepension-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/statepension`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "State Pension gaps")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "state-pension-dates.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
  cols?: 1 | 2 | 3;
}) {
  const grid = cols === 3 ? "grid-cols-1 sm:grid-cols-3" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
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

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  bad,
  badText,
  numeric = true,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  bad: boolean;
  badText: string;
  numeric?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-2">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={numeric ? "decimal" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={bad}
        className={inputClass}
      />
      {bad ? (
        <p className="mt-1.5 text-xs text-[var(--muted)]">{badText}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

function MoneyField(props: { id: string; label: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; hint?: string }) {
  return <Field {...props} bad={moneyInvalid(props.value)} badText={`Couldn't read that as an amount. Try something like ${props.placeholder}.`} />;
}

function CountField(props: { id: string; label: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; hint?: string }) {
  return <Field {...props} bad={countInvalid(props.value)} badText={`A whole number, like ${props.placeholder}.`} />;
}

const optional = <span className="text-[var(--muted)]">(optional)</span>;

export default function StatePensionClient() {
  const [inp, setInp] = useState<StatePensionInputs>(BLANK_STATEPENSION);
  const [hydrated, setHydrated] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [today] = useState(() => todayISO());

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount. */
    setInp(loadInputs());
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

  const set = <K extends keyof StatePensionInputs>(k: K, v: StatePensionInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));
  const toggleGap = (y: string) =>
    setInp((prev) => ({ ...prev, gaps: prev.gaps.includes(y) ? prev.gaps.filter((g) => g !== y) : [...prev.gaps, y] }));
  const setQuote = (y: string, v: string) => setInp((prev) => ({ ...prev, quotes: { ...prev.quotes, [y]: v } }));

  const read = useMemo(() => readStatePension(inp, today), [inp, today]);
  const openYears = GAP_YEARS.filter((y) => deadlineOf(y) >= today);
  const bornOk = isISODate(inp.born);

  return (
    <div>
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowExample((s) => !s)}
          aria-expanded={showExample}
          className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {showExample ? "Hide the worked example ↑" : "New here? See a worked example ↓"}
        </button>
        {showExample ? <StatePensionExample today={today} /> : null}
      </div>

      {/* ---- You ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>You</p>
        <div className="mt-3">
          <label htmlFor="sp-born" className="block text-sm text-[var(--foreground)] mb-2">
            Your date of birth
          </label>
          <input
            id="sp-born"
            type="date"
            value={inp.born}
            onChange={(e) => set("born", e.target.value)}
            min="1940-01-01"
            max="2011-12-31"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            {bornOk
              ? `State Pension age: ${letterDate(spaDate(inp.born))}, under current law.`
              : "Sets your State Pension age: 66 to 68, depending on when you were born."}
          </p>
        </div>

        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Until State Pension age, will you be working or getting credits?</p>
        <Chips<Work>
          label="Working until State Pension age"
          value={inp.work}
          onPick={(v) => set("work", v)}
          cols={1}
          options={[
            { id: "spa", label: "Yes, every year until then" },
            { id: "earlier", label: "I expect to stop earlier" },
          ]}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          A year counts if you earned more than about £125 a week from one job, paid self-employed National Insurance, or got credits
          (Child Benefit for a child under 12, caring, Universal Credit, sickness benefits).
        </p>
        {inp.work === "earlier" ? (
          <div className="mt-4">
            <CountField id="sp-stop" label="The age you expect to stop" value={inp.stopAge} onChange={(v) => set("stopAge", v)} placeholder="62" />
          </div>
        ) : null}
      </div>

      {/* ---- Your record ---- */}
      <div className={card}>
        <p className={eyebrow}>Your record</p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Sign in at{" "}
          <span className="text-[var(--foreground)] font-medium">gov.uk/check-state-pension</span> (or the HMRC app). It
          shows your forecast and every year of your National Insurance record. Then give either:
        </p>
        <div className="mt-3">
          <Chips<Source>
            label="What you have"
            value={inp.source}
            onPick={(v) => set("source", v)}
            options={[
              { id: "forecast", label: "My forecast (best)" },
              { id: "years", label: "A count of my qualifying years" },
            ]}
          />
        </div>
        {inp.source === "forecast" ? (
          <div className="mt-4">
            <MoneyField
              id="sp-forecast"
              label="Your forecast, a week"
              value={inp.forecast}
              onChange={(v) => set("forecast", v)}
              placeholder="£220.50"
              hint={`The amount it says you can get if you keep contributing until State Pension age. The full amount is £${FULL_WEEKLY.toFixed(2)}.`}
            />
          </div>
        ) : null}
        {inp.source === "years" ? (
          <div className="mt-4 space-y-4">
            <CountField
              id="sp-record"
              label="Qualifying years on your record so far"
              value={inp.record}
              onChange={(v) => set("record", v)}
              placeholder="24"
              hint="Count the years marked 'Full year'."
            />
            <div>
              <p className="text-sm text-[var(--foreground)] mb-2">Did you pay or get National Insurance before April 2016?</p>
              <Chips<YesNo>
                label="Before April 2016"
                value={inp.before2016}
                onPick={(v) => set("before2016", v)}
                options={[
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "No, it all started after" },
                ]}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                If yes, your pension has a starting amount that may not match 35 years exactly (contracted-out years lower
                it). The forecast knows it; a count doesn&rsquo;t.
              </p>
            </div>
          </div>
        ) : null}

        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Which of these years have gaps?</p>
        <div role="group" aria-label="Years with gaps" className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {openYears.map((y) => {
            const on = inp.gaps.includes(String(y));
            return (
              <button
                key={y}
                type="button"
                aria-pressed={on}
                onClick={() => toggleGap(String(y))}
                className={`${chipBase} ${on ? chipOn : chipOff}`}
              >
                {taxYearLabel(y)}
                <span className="block text-xs font-normal text-[var(--muted)]">closes {letterDate(deadlineOf(y))}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          These are the only years you can still fill. Your record marks them &lsquo;Not a full year&rsquo; with a cost. Older
          gaps have closed.
        </p>
        {inp.gaps.length ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {openYears
              .filter((y) => inp.gaps.includes(String(y)))
              .map((y) => (
                <MoneyField
                  key={y}
                  id={`sp-quote-${y}`}
                  label={<>Cost shown for {taxYearLabel(y)} {optional}</>}
                  value={inp.quotes[String(y)] ?? ""}
                  onChange={(v) => setQuote(String(y), v)}
                  placeholder="£412.30"
                  hint="A part year costs less than a whole one."
                />
              ))}
          </div>
        ) : null}
      </div>

      {/* ---- Things that change the answer ---- */}
      <div className={card}>
        <p className={eyebrow}>Things that change the answer {optional}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Tax on your pension in retirement</p>
        <Chips<Tax>
          label="Tax in retirement"
          value={inp.tax}
          onPick={(v) => set("tax", v)}
          cols={3}
          options={[
            { id: "none", label: "None" },
            { id: "basic", label: "Basic rate (20%)" },
            { id: "higher", label: "Higher rate (40%)" },
          ]}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          The full State Pension alone is just over the personal allowance, so most people with any other pension pay 20%.
          Without an answer, 20%.
        </p>
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Likely to get Pension Credit or Housing Benefit?</p>
        <Chips<Unsure>
          label="Means-tested benefits"
          value={inp.meansTested}
          onPick={(v) => set("meansTested", v)}
          cols={3}
          options={[
            { id: "no", label: "No" },
            { id: "unsure", label: "Not sure" },
            { id: "yes", label: "Yes" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Self-employed with low profits in the gap years?</p>
        <Chips<YesNo>
          label="Self-employed"
          value={inp.selfEmployed}
          onPick={(v) => set("selfEmployed", v)}
          options={[
            { id: "no", label: "No" },
            { id: "yes", label: "Yes" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Living abroad now?</p>
        <Chips<YesNo>
          label="Abroad"
          value={inp.abroad}
          onPick={(v) => set("abroad", v)}
          options={[
            { id: "no", label: "No, in the UK" },
            { id: "yes", label: "Yes" },
          ]}
        />
      </div>

      <AnnounceAnswer message={read ? statePensionHeadline(read) : null} />
      {read ? (
        <ReadBlock read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give your date of birth and your forecast (or your count of qualifying years), and tick any gaps. The read
            appears: which years to pay for now, which to decide on later, which to leave, and the dates each one closes.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_STATEPENSION)} />
    </div>
  );
}

const STATUS: Record<GapPlan["status"], { label: string; cls: string }> = {
  pay: { label: "Pay", cls: "text-[var(--accent)] font-semibold" },
  maybe: { label: "Decide later", cls: "text-[var(--foreground)] font-medium" },
  skip: { label: "Not needed", cls: "text-[var(--muted)]" },
};

function Plans({ read }: { read: StatePensionRead }) {
  if (!read.plans.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The open gaps, oldest first</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {read.plans.map((p) => (
          <li key={p.year} className="py-2.5 text-sm">
            <span className="flex items-baseline justify-between gap-4">
              <span className="text-[var(--foreground)] font-medium">
                {p.label}: <span className={STATUS[p.status].cls}>{STATUS[p.status].label}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--foreground)]">{money(p.cost)}</span>
            </span>
            <span className="block text-xs text-[var(--muted)] leading-relaxed">
              {p.gain ? `Adds about ${money(p.gain)} a year. ` : p.status === "skip" ? "Would add nothing on your path. " : ""}
              {p.quoted ? "HMRC's figure. " : ""}
              {p.cheapBy ? `This price if paid by ${letterDate(p.cheapBy)}. ` : ""}
              Closes {letterDate(p.deadline)}.
            </span>
          </li>
        ))}
      </ul>
      {read.payCost > 0 ? (
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          The years to pay: {money(read.payCost)}{" "}for about {money(read.payGain)}{" "}a year, in today&rsquo;s money. Over
          20 years of retirement that&rsquo;s about {money(read.payGain * 20)}{" "}before tax. Bought from an insurer at 65, the
          same inflation-linked income would cost about {money(read.payGain / 0.05)}.
        </p>
      ) : null}
    </div>
  );
}

function Tiles({ read }: { read: StatePensionRead }) {
  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {tilesOf(read).map((t) => (
        <div key={t.label} className="rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>{t.label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--foreground)]">{t.value}</p>
          <p className="text-xs text-[var(--muted)] leading-relaxed">{t.note}</p>
        </div>
      ))}
    </div>
  );
}

function ReadBlock({ read, today }: { read: StatePensionRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = statePensionRule(read);
  const msgs = messagesOf(read);
  const reminders = remindersOf(read, today);
  const dates = datesOf(read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{statePensionHeadline(read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{statePensionBody(read)}</p>

      {read.verdict !== "past" ? <Tiles read={read} /> : null}
      <Plans read={read} />

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>Before you pay anything</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {checksOf(read).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      {dates.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>The dates</p>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {dates.map((r) => (
              <li key={`${r.on}-${r.title}`} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0">
                  <span className="text-[var(--foreground)]">{r.title}</span>
                  <span className="block text-xs text-[var(--muted)]">{r.body}</span>
                </span>
                <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">{letterDate(r.on)}</span>
              </li>
            ))}
          </ul>
          {reminders.length ? (
            <button type="button" onClick={() => downloadIcs(reminders)} className={`mt-2 ${action}`}>
              Add {reminders.length === 1 ? "the reminder" : `${reminders.length} reminders`} to your calendar (.ics)
            </button>
          ) : null}
        </div>
      ) : null}

      {msgs.map((m) => (
        <div key={m.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`sp-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`sp-msg-${m.id}`}
            className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
          >
            {m.text}
          </pre>
          <button type="button" onClick={async () => setCopied((await copyText(m.text)) ? m.id : "no")} className={`mt-3 ${action}`}>
            {copied === m.id ? "Copied" : "Copy it"}
          </button>
        </div>
      ))}

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>What to keep together</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {keepList(read).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not financial advice. Figures are in 2026/27 money; the State Pension rises each April. HMRC and the DWP won&rsquo;t
        text you a link to pay National Insurance or ask for bank details by phone out of the blue. Sign in to gov.uk
        yourself.
      </p>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <button type="button" onClick={async () => setCopied((await copyText(rule)) ? "line" : "no")} className={action}>
            {copied === "line" ? "Copied your line" : "Copy your line"}
          </button>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(statePensionSummary(read, today))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole read" : "Copy the whole read as text"}
          </button>
        </div>
        {copied === "no" ? <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words above instead.</p> : null}
      </div>
      <Handoffs />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs() {
  const list: Handoff[] = [
    {
      href: "/taxcode",
      label: "Already getting a State Pension and a payslip?",
      note: "Check the tax code: HMRC collects the State Pension's tax through it.",
    },
    {
      href: "/baby",
      label: "A baby on the way?",
      note: "Claim Child Benefit even if you'd repay it: it gives the parent at home credits towards their State Pension.",
    },
    {
      href: "/cover",
      label: "Weighing other insurance?",
      note: "Insure what you couldn't pay yourself. Outliving your savings is one of those.",
    },
    {
      href: "/scam",
      label: "A text says you can claim back pension money?",
      note: "Check it before you click anything.",
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
        <Link href="/writing/the-bet-you-want-to-lose" className={link}>
          The bet you want to lose
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function StatePensionExample({ today }: { today: string }) {
  const ex = statePensionExample();
  const read = readStatePension(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I was born in September 1968. I took three years out from 2020 to look after my mum, and my record has gaps for
        2020/21, 2021/22 and 2022/23. My forecast says £234.41 a week if I work until 67. I&rsquo;d like to stop at 65. A
        friend said paying for gaps is a waste because you might not live long enough to get it back.
      </p>
      <Plans read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{statePensionHeadline(read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Even working to 67 I&rsquo;d be one year short, so I&rsquo;ll fill 2020/21 before it closes in April: about{" "}
          {money(CLASS3_NOW * 52)}{" "}for about {money(UNIT_YEARLY)}{" "}a year, back in about {read.payback?.toFixed(1)}{" "}
          years of pension. The other two I only need if I stop at 65, and they stay open until 2028 and 2029, so I&rsquo;ll
          decide each spring. First I&rsquo;m asking HMRC whether caring for Mum should have given me Carer&rsquo;s Credit:
          that would fill them for nothing.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}record.
      </p>
    </div>
  );
}
