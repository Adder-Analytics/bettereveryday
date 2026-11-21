"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BEN_RATE,
  BLANK_PENSION,
  MPAA,
  checksOf,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  parsePensionInputs,
  pensionBody,
  pensionExample,
  pensionHeadline,
  pensionRule,
  pensionSummary,
  readPension,
  remindersOf,
  taxYearName,
  tilesOf,
  todayISO,
  type DateLine,
  type Kind,
  type Pattern,
  type PensionInputs,
  type PensionRead,
  type Reason,
  type Region,
  type Unsure,
  type YesNo,
} from "../data/pension";

/**
 * Taking money from your pension: how much tax, and what does it start? (/pension)
 *
 * Prices the ways of taking the same sum from a pension pot (a lump sum a
 * quarter tax-free, the whole pot's tax-free quarter first, either split across
 * 5 April, a small pot), shows what the emergency code will take off the first
 * payment and which form claims it back, and flags the money purchase annual
 * allowance, the April 2027 inheritance tax change and the 2028 rise in the
 * minimum pension age.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/pension.ts` so it can be checked without a browser.
 */

const STORE_KEY = "pension:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase = "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff = "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow = "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card = "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const link = "text-[var(--accent)] hover:opacity-70 transition-opacity";
const action = "text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity";
const hintCls = "mt-1.5 text-xs text-[var(--muted)] leading-relaxed";

function loadInputs(): PensionInputs {
  if (typeof window === "undefined") return BLANK_PENSION;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parsePensionInputs(JSON.parse(raw)) : BLANK_PENSION;
  } catch {
    return BLANK_PENSION;
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
        `UID:pension-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/pension`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Pension withdrawal")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pension-withdrawal-dates.ics";
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
        <p className={hintCls}>Couldn&rsquo;t read that as an amount. Try something like {placeholder}.</p>
      ) : hint ? (
        <p className={hintCls}>{hint}</p>
      ) : null}
    </div>
  );
}

function Question({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 text-sm text-[var(--foreground)] mb-2">{children}</p>;
}

const optional = <span className="text-[var(--muted)]">(optional)</span>;

function DateField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: React.ReactNode;
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
      {hint ? <p className={hintCls}>{hint}</p> : null}
    </div>
  );
}

export default function PensionClient() {
  const [inp, setInp] = useState<PensionInputs>(BLANK_PENSION);
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

  const set = <K extends keyof PensionInputs>(k: K, v: PensionInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));
  const read = useMemo(() => readPension(inp, today), [inp, today]);
  const pot = inp.kind === "dc" || inp.kind === "unsure";

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
        {showExample ? <PensionExample today={today} /> : null}
      </div>

      {/* ---- The pension ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>The pension</p>
        <div className="mt-3">
          <DateField
            id="pn-dob"
            label="Your date of birth"
            value={inp.dob}
            onChange={(v) => set("dob", v)}
            hint="The minimum age is 55, rising to 57 on 6 April 2028."
          />
        </div>
        <Question>What kind of pension is it?</Question>
        <Chips<Kind>
          label="Kind of pension"
          value={inp.kind}
          onPick={(v) => set("kind", v)}
          cols={3}
          options={[
            { id: "dc", label: "A pot that's invested" },
            { id: "db", label: "Final salary or career average" },
            { id: "unsure", label: "Not sure" },
          ]}
        />
        <p className={hintCls}>
          A pot has a value on your statement (personal pensions, SIPPs, most workplace pensions since 2012). Final salary
          schemes promise a yearly pension instead.
        </p>

        {pot ? (
          <>
            <Question>Have you already taken the tax-free cash from this pot?</Question>
            <Chips<YesNo>
              label="Tax-free cash taken"
              value={inp.crystallised}
              onPick={(v) => set("crystallised", v)}
              options={[
                { id: "no", label: "No, it's untouched" },
                { id: "yes", label: "Yes, it's in drawdown" },
              ]}
            />
            <div className="mt-5 space-y-4">
              <MoneyField
                id="pn-pot"
                label={inp.crystallised === "yes" ? "What's left in the drawdown pot" : "What the pot is worth"}
                value={inp.pot}
                onChange={(v) => set("pot", v)}
                placeholder="£120,000"
                hint="From your latest statement or the provider's website."
              />
              <MoneyField
                id="pn-amount"
                label="How much you want to take out"
                value={inp.amount}
                onChange={(v) => set("amount", v)}
                placeholder="£40,000"
                hint="Before tax. The whole pot is fine too."
              />
            </div>
          </>
        ) : null}
      </div>

      {/* ---- Your income ---- */}
      {pot ? (
        <div className={card}>
          <p className={eyebrow}>Your income and the rest</p>
          <div className="mt-3 space-y-4">
            <MoneyField
              id="pn-other"
              label={`Your other taxable income this tax year (${taxYearName(read?.year ?? 2026)})`}
              value={inp.other}
              onChange={(v) => set("other", v)}
              placeholder="£38,000"
              hint="Pay, State Pension, other pensions, rental profit, for the whole year to 5 April. Not ISAs."
            />
            <MoneyField
              id="pn-othernext"
              label={<>And next tax year {optional}</>}
              value={inp.otherNext}
              onChange={(v) => set("otherNext", v)}
              placeholder="the same"
              hint="If you're stopping work or the State Pension starts, it changes when to take it."
            />
          </div>
          <Question>Where do you live?</Question>
          <Chips<Region>
            label="Where"
            value={inp.region}
            onPick={(v) => set("region", v)}
            options={[
              { id: "ruk", label: "England, Wales or Northern Ireland" },
              { id: "scotland", label: "Scotland" },
            ]}
          />
          <Question>Is this the first payment from this pension this tax year?</Question>
          <Chips<Unsure>
            label="First payment"
            value={inp.first}
            onPick={(v) => set("first", v)}
            cols={3}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
          <Question>A one-off, or the first of regular payments?</Question>
          <Chips<Pattern>
            label="Pattern"
            value={inp.pattern}
            onPick={(v) => set("pattern", v)}
            options={[
              { id: "oneoff", label: "A one-off" },
              { id: "regular", label: "Regular, every month" },
            ]}
          />
          <div className="mt-5">
            <MoneyField
              id="pn-contrib"
              label={<>Paid into pensions a year, by you and any employer {optional}</>}
              value={inp.contrib}
              onChange={(v) => set("contrib", v)}
              placeholder="£3,800"
              hint="If you're still paying in, taking taxable money can cap it."
            />
          </div>
          <Question>Have you taken taxable money from a pension pot before?</Question>
          <Chips<YesNo>
            label="Taxable money taken before"
            value={inp.triggered}
            onPick={(v) => set("triggered", v)}
            options={[
              { id: "no", label: "No, never (or only tax-free cash)" },
              { id: "yes", label: "Yes" },
            ]}
          />
          <Question>Do you get Universal Credit, Pension Credit, Housing Benefit or Council Tax Reduction?</Question>
          <Chips<YesNo>
            label="Means-tested benefits"
            value={inp.benefits}
            onPick={(v) => set("benefits", v)}
            options={[
              { id: "no", label: "No" },
              { id: "yes", label: "Yes" },
            ]}
          />
          <Question>What&rsquo;s the money for?</Question>
          <Chips<Reason>
            label="Reason"
            value={inp.reason}
            onPick={(v) => set("reason", v)}
            options={[
              { id: "spend", label: "Something big: a car, a home, debts" },
              { id: "income", label: "To live on" },
              { id: "gift", label: "To give to family" },
              { id: "iht", label: "Worried about inheritance tax or the Budget" },
            ]}
          />
          {inp.reason === "iht" || inp.reason === "gift" ? (
            <>
              <Question>Is everything you own (home, savings, pensions) worth more than £500,000? (£1 million for a couple)</Question>
              <Chips<Unsure>
                label="Estate over the thresholds"
                value={inp.estate}
                onPick={(v) => set("estate", v)}
                cols={3}
                options={[
                  { id: "no", label: "No" },
                  { id: "unsure", label: "Not sure" },
                  { id: "yes", label: "Yes" },
                ]}
              />
            </>
          ) : null}
          <div className="mt-5">
            <DateField
              id="pn-paydate"
              label={<>When you expect to be paid {optional}</>}
              value={inp.payDate}
              onChange={(v) => set("payDate", v)}
              hint="For the reminders: claiming emergency tax back, and telling other schemes."
            />
          </div>
        </div>
      ) : null}

      <AnnounceAnswer message={read ? pensionHeadline(read) : null} />
      {read ? (
        <ReadBlock read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give your date of birth, the kind of pension, what&rsquo;s in it and how much you want. The read appears: the
            ways to take it and the tax on each, what comes off the first payment, and what it starts.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_PENSION)} />
    </div>
  );
}

function Routes({ read }: { read: PensionRead }) {
  if (read.routes.length < 2 || !read.best) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The ways to take {money(read.amount)}</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {read.routes.map((r) => {
          const best = r.id === read.best!.id;
          return (
            <li key={r.id} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
              <span className="min-w-0">
                <span className={`text-[var(--foreground)] ${best ? "font-semibold" : ""}`}>
                  {r.label}
                  {best ? <span className="text-[var(--accent)]"> · best</span> : null}
                </span>
                <span className="block text-xs text-[var(--muted)]">
                  {r.note}
                  {r.mpaa && !read.triggered ? ` Caps paying in at ${money(MPAA)} a year.` : ""}
                </span>
              </span>
              <span className={`shrink-0 tabular-nums ${best ? "font-semibold text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
                {money(r.tax)}{" "}<span className="text-xs text-[var(--muted)] font-normal">tax</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Iht({ read }: { read: PensionRead }) {
  const c = read.iht;
  if (!c || !read.best) return null;
  const rows = [
    { label: "Leave it in the pension, and you die before 75", value: c.leaveBefore75 },
    { label: "Leave it, and you die after 75", value: c.leaveAfter75, note: `they pay income tax, assumed ${Math.round(BEN_RATE * 100)}%` },
    { label: "Take it out now and keep it", value: c.takeKeep },
    { label: "Take it out now and give it away (you live seven years)", value: c.takeGive },
  ];
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What reaches your family from {money(read.amount)}</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.label} className="py-2 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 text-[var(--foreground)]">
              {r.label}
              {r.note ? <span className="block text-xs text-[var(--muted)]">{r.note}</span> : null}
            </span>
            <span className="shrink-0 tabular-nums text-[var(--foreground)]">{money(r.value)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        {c.taxed
          ? "With inheritance tax at 40% on deaths from 6 April 2027. Taking it out and keeping it is still in your estate; only spending it or giving it away takes it out."
          : "No inheritance tax, because you said your estate is under the thresholds (or you're not sure). Leaving it is free of income tax if you die before 75."}
      </p>
    </div>
  );
}

function Tiles({ read }: { read: PensionRead }) {
  const tiles = tilesOf(read);
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

function ReadBlock({ read }: { read: PensionRead }) {
  const [copied, setCopied] = useState("");
  const rule = pensionRule(read);
  const msgs = messagesOf(read);
  const reminders = remindersOf(read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{pensionHeadline(read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{pensionBody(read)}</p>

      <Tiles read={read} />
      <Routes read={read} />
      <Iht read={read} />

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>Worth knowing</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {checksOf(read).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      {reminders.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>The dates</p>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {reminders.map((r) => (
              <li key={`${r.on}-${r.title}`} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0">
                  <span className="text-[var(--foreground)]">{r.title}</span>
                  <span className="block text-xs text-[var(--muted)]">{r.body}</span>
                </span>
                <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">
                  {r.on === read.today ? "Today" : letterDate(r.on)}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => downloadIcs(reminders)} className={`mt-2 ${action}`}>
            Add {reminders.length === 1 ? "the reminder" : `${reminders.length} reminders`} to your calendar (.ics)
          </button>
        </div>
      ) : null}

      {msgs.map((m) => (
        <div key={m.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`pn-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`pn-msg-${m.id}`}
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
        {taxYearName(read.year)}{" "}income tax rates, worked out on your figures; your provider and HMRC have the final word,
        and this isn&rsquo;t advice. Pension Wise, from MoneyHelper, gives a free appointment on your options.
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
            onClick={async () => setCopied((await copyText(pensionSummary(read))) ? "all" : "no")}
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
      href: "/statepension",
      label: "Your State Pension forecast is short?",
      note: "Filling a gap in your National Insurance record is often the best-value pension money you can spend.",
    },
    {
      href: "/taxcode",
      label: "A new tax code arrived after the withdrawal?",
      note: "HMRC often guesses you'll take the same again. Check it.",
    },
    {
      href: "/scam",
      label: "Someone called offering a pension review or early access?",
      note: "Check before you send a penny or sign a transfer.",
    },
    {
      href: "/bereavement",
      label: "Dealing with the pension of someone who died?",
      note: "What's due and when, including the inheritance tax change from April 2027.",
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
        <Link href="/writing/same-money-different-tax" className={link}>
          Same money, different tax
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function PensionExample({ today }: { today: string }) {
  const read = readPension(pensionExample(), today);
  if (!read || !read.best || !read.base) return null;
  const b = read.best;
  const base = read.base;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I&rsquo;m 63 and work three days a week for £38,000. I&rsquo;ve got £120,000 in an old workplace pension I&rsquo;ve
        never touched. My son&rsquo;s buying a flat and I want to give him £40,000, and I&rsquo;d heard pensions get taxed
        when you die from 2027, so it seemed like a good time. My current employer pays about £3,800 a year into my new
        pension.
      </p>
      <Routes read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{pensionHeadline(read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          If I&rsquo;d just asked for £40,000, a quarter would be tax-free and £30,000 would land on top of my salary: about{" "}
          {money(base.tax)}{" "}of tax, much of it at 40%, and the emergency code would take about {money(base.deducted)}{" "}off on the
          day. Instead I move the pot into drawdown and take its whole tax-free quarter, £30,000, plus £10,000 of income, which
          stays in the basic-rate band: about {money(b.tax)}. Over my life I get the same £30,000 tax-free either way. And
          the inheritance tax worry doesn&rsquo;t apply to me: with my house, my estate is under the thresholds, and money
          in my bank account would be counted anyway. Giving it to my son is what matters; if I live seven years, it&rsquo;s
          out of my estate entirely.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}pension.
      </p>
    </div>
  );
}
