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
  BLANK_CHILDCARE,
  childcareBody,
  childcareExample,
  childcareHeadline,
  childcareRule,
  childcareSummary,
  datesOf,
  fundedApplies,
  hoursInvalid,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  notchRows,
  parentLine,
  parseChildcareInputs,
  readChildcare,
  remindersOf,
  threshold,
  todayISO,
  type Age,
  type ChildcareInputs,
  type ChildcareRead,
  type Code,
  type DateLine,
  type Household,
  type Nation,
  type Status,
  type YesNo,
} from "../data/childcare";

/**
 * Childcare codes: what you can get, and by when? (/childcare)
 *
 * The instrument for England's 30 funded hours and the UK's Tax-Free
 * Childcare. Both are worth thousands a year, both run on one HMRC account,
 * and both end by default: the account has to be reconfirmed every three
 * months, and the code has to be issued before a term starts. A second cliff
 * sits at £100,000 of adjusted net income, where one pound more loses all of
 * it. The tool dates the code, prices each date, draws the £100,000 line, and
 * puts the reconfirmations in a calendar.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/childcare.ts` so it can be checked without a browser.
 */

const STORE_KEY = "childcare:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase = "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff = "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow = "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card = "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const link = "text-[var(--accent)] hover:opacity-70 transition-opacity";
const action = "text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity";

function loadInputs(): ChildcareInputs {
  if (typeof window === "undefined") return BLANK_CHILDCARE;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseChildcareInputs(JSON.parse(raw)) : BLANK_CHILDCARE;
  } catch {
    return BLANK_CHILDCARE;
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
        `UID:childcare-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/childcare`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Childcare codes")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "childcare-dates.ics";
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
  const grid = cols === 3 ? "grid-cols-3" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
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
  hint,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
}) {
  const bad = moneyInvalid(value);
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-2">
        {label}
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
        <p className="mt-1.5 text-xs text-[var(--muted)]">Couldn&rsquo;t read that as an amount. Try something like {placeholder}.</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

const STATUS_OPTIONS: { id: Status; label: string }[] = [
  { id: "work", label: "Working (employed or self-employed)" },
  { id: "leave", label: "On maternity, paternity, adoption or sick leave" },
  { id: "newself", label: "Self-employed, started less than a year ago" },
  { id: "carer", label: "Not working: Carer's Allowance, or can't work through illness or disability" },
  { id: "none", label: "Not working" },
];

function ParentFields({
  who,
  inp,
  set,
}: {
  who: "you" | "partner";
  inp: ChildcareInputs;
  set: <K extends keyof ChildcareInputs>(k: K, v: ChildcareInputs[K]) => void;
}) {
  const k = (s: "Status" | "Age" | "Pay3m" | "Income" | "Pension") => `${who}${s}` as keyof ChildcareInputs;
  const status = inp[k("Status")] as Status;
  const age = inp[k("Age")] as Age;
  const title = who === "you" ? "You" : "Your partner";
  return (
    <div className={card}>
      <p className={eyebrow}>{title}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Right now, {who === "you" ? "you're" : "they're"}&hellip;</p>
      <Chips<Status> label={`${title}: work`} value={status} onPick={(v) => set(k("Status"), v)} cols={1} options={STATUS_OPTIONS} />
      {status === "work" ? (
        <>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Age</p>
          <Chips<Age>
            label={`${title}: age`}
            value={age || "21"}
            onPick={(v) => set(k("Age"), v)}
            cols={3}
            options={[
              { id: "21", label: "21 or over" },
              { id: "18", label: "18 to 20" },
              { id: "u18", label: "Under 18 / apprentice" },
            ]}
          />
          <div className="mt-5">
            <MoneyField
              id={`cc-${who}-pay`}
              label="Pay expected over the next three months, before tax"
              value={inp[k("Pay3m")] as string}
              onChange={(v) => set(k("Pay3m"), v)}
              placeholder="£4,500"
              hint={`The line is ${money(threshold(age))}: 16 hours a week at the minimum wage for that age, for 13 weeks. Self-employed? Your expected profit.`}
            />
          </div>
        </>
      ) : null}
      {status ? (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoneyField
            id={`cc-${who}-income`}
            label={
              <>
                Income this tax year <span className="text-[var(--muted)]">(optional)</span>
              </>
            }
            value={inp[k("Income")] as string}
            onChange={(v) => set(k("Income"), v)}
            placeholder="£62,000"
            hint="6 April to 5 April, before tax: salary, bonus, rent, interest. Only used to check the £100,000 line."
          />
          <MoneyField
            id={`cc-${who}-pension`}
            label={
              <>
                Pension contributions from it <span className="text-[var(--muted)]">(optional)</span>
              </>
            }
            value={inp[k("Pension")] as string}
            onChange={(v) => set(k("Pension"), v)}
            placeholder="£3,000"
            hint="Workplace or salary sacrifice for the year, or personal contributions grossed up."
          />
        </div>
      ) : null}
    </div>
  );
}

export default function ChildcareClient() {
  const [inp, setInp] = useState<ChildcareInputs>(BLANK_CHILDCARE);
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

  const set = <K extends keyof ChildcareInputs>(k: K, v: ChildcareInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readChildcare(inp, today), [inp, today]);

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
        {showExample ? <ChildcareExample today={today} /> : null}
      </div>

      {/* ---- The child ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="cc-what" className={`block ${eyebrow} mb-2`}>
          The child
        </label>
        <input
          id="cc-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="A first name or nickname"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <div className="mt-5">
          <label htmlFor="cc-dob" className="block text-sm text-[var(--foreground)] mb-2">
            Date of birth, or the due date
          </label>
          <input id="cc-dob" type="date" value={inp.dob} onChange={(e) => set("dob", e.target.value)} className={inputClass} />
        </div>
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where do you live?</p>
        <Chips<Nation>
          label="Where you live"
          value={inp.nation}
          onPick={(v) => set("nation", v)}
          options={[
            { id: "eng", label: "England" },
            { id: "scot", label: "Scotland" },
            { id: "wales", label: "Wales" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Who lives with the child?</p>
        <Chips<Household>
          label="Household"
          value={inp.household}
          onPick={(v) => set("household", v)}
          options={[
            { id: "couple", label: "Me and a partner" },
            { id: "single", label: "Just me" },
          ]}
        />
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          A partner who lives with you counts even if they aren&rsquo;t the child&rsquo;s parent.
        </p>
      </div>

      {inp.household ? <ParentFields who="you" inp={inp} set={set} /> : null}
      {inp.household === "couple" ? <ParentFields who="partner" inp={inp} set={set} /> : null}

      {/* ---- The childcare ---- */}
      {inp.household && inp.youStatus ? (
        <div className={card}>
          <p className={eyebrow}>The childcare</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MoneyField
              id="cc-bill"
              label={
                <>
                  Monthly bill <span className="text-[var(--muted)]">(optional)</span>
                </>
              }
              value={inp.bill}
              onChange={(v) => set("bill", v)}
              placeholder="£1,200"
              hint="Before any funded hours."
            />
            <div>
              <label htmlFor="cc-hours" className="block text-sm text-[var(--foreground)] mb-2">
                Hours a week <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="cc-hours"
                type="text"
                inputMode="decimal"
                value={inp.hours}
                onChange={(e) => set("hours", e.target.value)}
                placeholder="40"
                aria-invalid={hoursInvalid(inp.hours)}
                className={inputClass}
              />
              {hoursInvalid(inp.hours) ? <p className="mt-1.5 text-xs text-[var(--muted)]">A number of hours, like 40.</p> : null}
            </div>
            <MoneyField
              id="cc-rate"
              label={
                <>
                  Hourly rate <span className="text-[var(--muted)]">(optional)</span>
                </>
              }
              value={inp.rate}
              onChange={(v) => set("rate", v)}
              placeholder="£8.50"
            />
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Do you get Universal Credit?</p>
          <Chips<YesNo>
            label="Universal Credit"
            value={inp.uc}
            onPick={(v) => set("uc", v)}
            options={[
              { id: "no", label: "No" },
              { id: "yes", label: "Yes" },
            ]}
          />
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">The childcare account (30 hours or Tax-Free Childcare)</p>
          <Chips<Code>
            label="Childcare account"
            value={inp.code}
            onPick={(v) => set("code", v)}
            cols={1}
            options={[
              { id: "none", label: "We haven't applied yet" },
              { id: "have", label: "We have an account and a code" },
            ]}
          />
          {inp.code === "have" ? (
            <div className="mt-4">
              <label htmlFor="cc-codeon" className="block text-sm text-[var(--foreground)] mb-2">
                When you applied, or last reconfirmed
              </label>
              <input
                id="cc-codeon"
                type="date"
                value={inp.codeOn}
                max={today}
                onChange={(e) => set("codeOn", e.target.value)}
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                The account shows the exact &ldquo;reconfirm by&rdquo; date. Three months from this is close.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <AnnounceAnswer message={read ? childcareHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give the child&rsquo;s date of birth (or due date), where you live, and who works. The read appears: when
            the code has to be in, what the hours and the top-up are worth, the reconfirmation dates, and where the
            £100,000 line sits.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_CHILDCARE);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/** What a year of help is worth, side by side. */
function Values({ inp, read }: { inp: ChildcareInputs; read: ChildcareRead }) {
  const tiles: { label: string; value: string; note: string }[] = [];
  if (fundedApplies(read))
    tiles.push({
      label: "Funded hours",
      value: money(read.fundedValue),
      note: `a year, at ${money(read.rate)} an hour${read.rateAssumed ? " (a typical rate; add yours)" : ""}`,
    });
  if (read.stage !== "over")
    tiles.push({
      label: "Tax-Free Childcare",
      value: money(read.tfcValue),
      note: read.annualBill === null ? "a year at most; add the bill for yours" : "a year: 20% of what's left of the bill",
    });
  if (inp.uc === "yes") tiles.push({ label: "UC childcare instead", value: money(read.ucValue), note: "a year: 85% of what's left, capped" });
  if (!tiles.length) return null;
  return (
    <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>{t.label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--foreground)]">{t.value}</p>
          <p className="text-xs text-[var(--muted)] leading-relaxed">{t.note}</p>
        </div>
      ))}
    </div>
  );
}

/** The £100,000 line, drawn as three rows. */
function Notch({ read }: { read: ChildcareRead }) {
  const p = read.parents.find((x) => x.over);
  if (!p) return null;
  const rows = notchRows(read, p);
  return (
    <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
      <p className={eyebrow}>The £100,000 line</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.label} className="py-2.5 text-sm">
            <span className="flex items-baseline justify-between gap-4">
              <span className={r.lost ? "text-[var(--accent)] font-semibold" : "text-[var(--foreground)] font-medium"}>{r.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--foreground)]">{r.amount}</span>
            </span>
            <span className="block text-xs text-[var(--muted)] leading-relaxed">{r.note}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        The test is each parent&rsquo;s own adjusted net income for the tax year, as you expect it when you apply and
        each time you reconfirm. Pension contributions made by 5 April count for this year. Rough England tax rates;
        Scotland&rsquo;s are a little different.
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: ChildcareInputs; read: ChildcareRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = childcareRule(inp, read);
  const msgs = messagesOf(inp, read);
  const reminders = remindersOf(inp, read, today);
  const dates = datesOf(inp, read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{childcareHeadline(inp, read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{childcareBody(inp, read)}</p>

      <Values inp={inp} read={read} />
      <Notch read={read} />

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>Who qualifies</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed">
          {read.parents.map((p) => (
            <li key={p.who}>{parentLine(inp, p)}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Both tests apply to each parent at every reconfirmation, as you expect things to be over the next three
          months. A drop in hours, unpaid leave or a bonus can change the answer.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>The dates</p>
        <ul className="mt-3 divide-y divide-[var(--border)]">
          {dates.map((r) => (
            <li key={`${r.on}-${r.title}`} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
              <span className="min-w-0">
                <span className={r.on < today ? "text-[var(--muted)]" : "text-[var(--foreground)]"}>{r.title}</span>
                <span className="block text-xs text-[var(--muted)]">
                  {r.body}
                  {r.money ? ` ${r.money}.` : ""}
                </span>
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
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Miss a reconfirmation and the Tax-Free Childcare top-up stops straight away; the funded place carries on to
          the end of a grace period, and a child can&rsquo;t start a new place on a code in one. Your council publishes
          its grace-period table.
        </p>
      </div>

      {msgs.map((m) => (
        <div key={m.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`cc-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`cc-msg-${m.id}`}
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
          {keepList(inp, read).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not financial advice. Apply and reconfirm only through the government&rsquo;s childcare service on gov.uk (in
        Wales, the Welsh Government&rsquo;s); HMRC doesn&rsquo;t text links asking for bank details. Tax-Free Childcare
        can be paid in ahead: money in the account keeps its top-up, but each three-month period&rsquo;s £500 cap
        doesn&rsquo;t roll over.
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
            onClick={async () => setCopied((await copyText(childcareSummary(inp, read, today))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole plan" : "Copy the whole plan as text"}
          </button>
        </div>
        {copied === "no" ? <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words above instead.</p> : null}
      </div>
      <Handoffs inp={inp} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp }: { inp: ChildcareInputs }) {
  const list: Handoff[] = [
    {
      href: withSubject("/baby", inp.what),
      label: "Still expecting?",
      note: "Maternity and paternity pay are decided months before the due date. Date those first.",
    },
    {
      href: withSubject("/bills", inp.what),
      label: "Splitting the nursery bill between you?",
      note: "Half each stops being fair when one of you drops to part-time.",
    },
    {
      href: withSubject("/challenge", inp.what),
      label: "A Universal Credit decision got the childcare wrong?",
      note: "Ask for it to be looked at again, in writing, within a month.",
    },
    {
      href: withSubject("/taxcode", inp.what),
      label: "Near £100,000 and the payslip looks off?",
      note: "Check the tax code: the allowance tapers away above £100,000.",
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
        <Link href="/writing/the-benefit-that-ends-by-default" className={link}>
          The benefit that ends by default
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function ChildcareExample({ today }: { today: string }) {
  const ex = childcareExample(today);
  const read = readChildcare(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Asha turns 9 months next month, and I go back to work in January. The nursery is £1,350 a month for four
        days. My partner earns £108,000 with a small pension, and we&rsquo;d both heard that over £100,000 you
        don&rsquo;t get the 30 hours, so we hadn&rsquo;t applied.
      </p>
      <Notch read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{childcareHeadline(ex, read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The line is on adjusted net income, not salary. {money(read.parents[1].toCut)} more into the pension by
          salary sacrifice brought my partner to £100,000, for about {money(read.parents[1].cutCost)}{" "}less take-home
          pay, and the money&rsquo;s still ours, in the pension. We applied that week, the code came through, and the
          nursery had it well before {letterDate(read.applyBy)}. The reconfirmation dates are in both our calendars.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}family.
      </p>
    </div>
  );
}
