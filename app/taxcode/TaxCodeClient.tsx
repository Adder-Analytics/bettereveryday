"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_TAXCODE,
  actDate,
  codeInvalid,
  datesOf,
  decodeParts,
  isISODate,
  keepList,
  knowList,
  letterDate,
  money,
  parseCode,
  parseTaxCodeInputs,
  readTaxCode,
  taxCodeBody,
  taxCodeExample,
  taxCodeHeadline,
  taxCodeLetters,
  taxCodeRule,
  taxCodeSummary,
  taxYearOf,
  todayISO,
  type DateLine,
  type Earlier,
  type Freq,
  type Marriage,
  type Nation,
  type ParsedCode,
  type Source,
  type Start,
  type TaxCodeInputs,
  type TaxCodeRead,
} from "../data/taxcode";

/**
 * Is your tax code right? (/taxcode)
 *
 * Decodes a PAYE tax code, builds the code the person's details would give,
 * runs both through the tax year payslip by payslip, and says what the
 * difference costs by 5 April, how much has already gone, and what brings it
 * back: a corrected cumulative code refunds in one payslip until the year
 * closes; after that it's a P800 claim.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/taxcode.ts` so it can be checked without a browser.
 */

const STORE_KEY = "taxcode:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £2,400.";

function loadInputs(): TaxCodeInputs {
  if (typeof window === "undefined") return BLANK_TAXCODE;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseTaxCodeInputs(JSON.parse(raw)) : BLANK_TAXCODE;
  } catch {
    return BLANK_TAXCODE;
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
        `UID:taxcode-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/taxcode`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Tax code")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tax-code-dates.ics";
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
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  optional?: boolean;
  hint?: string;
}) {
  const bad = moneyInvalid(value);
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
        <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p>
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

/** The code, read aloud, part by part. */
function Decoded({ code }: { code: ParsedCode }) {
  const parts = decodeParts(code);
  return (
    <dl className="mt-4 rounded-lg border border-[var(--border)] p-4 space-y-2.5">
      {parts.map((p) => (
        <div key={p.part} className="grid grid-cols-[4.5rem_1fr] gap-3 text-sm leading-relaxed">
          <dt className="font-mono font-semibold text-[var(--foreground)] break-words">{p.part}</dt>
          <dd className="text-[var(--foreground)]">{p.means}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function TaxCodeClient() {
  const [inp, setInp] = useState<TaxCodeInputs>(BLANK_TAXCODE);
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

  const set = <K extends keyof TaxCodeInputs>(k: K, v: TaxCodeInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const code = parseCode(inp.code);
  const read = useMemo(() => readTaxCode(inp, today), [inp, today]);
  const startBad =
    inp.start === "during" && isISODate(inp.startDate) && isISODate(inp.payDate)
      ? inp.startDate > inp.payDate
        ? "The start date is after the pay date."
        : taxYearOf(inp.startDate) !== taxYearOf(inp.payDate)
          ? "That start date is in an earlier tax year (before 6 April), so pick “Before 6 April” instead."
          : ""
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
        {showExample ? <Example /> : null}
      </div>

      {/* ---- The code ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>Your code</p>
        <label htmlFor="tc-code" className="mt-3 block text-sm text-[var(--foreground)] mb-2">
          The tax code on your latest payslip
        </label>
        <input
          id="tc-code"
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          value={inp.code}
          onChange={(e) => set("code", e.target.value)}
          placeholder="e.g. 1257L, S1257L, 1257L M1, BR, K475"
          aria-invalid={codeInvalid(inp.code)}
          className={`${inputClass} font-mono uppercase`}
        />
        {codeInvalid(inp.code) ? (
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            Couldn&rsquo;t read that as a tax code. Codes look like 1257L, S1257L, C1257L, 1257L M1, BR, 0T, D0, NT
            or K475. Copy it exactly, letters and all.
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            Usually near your name or National Insurance number. Include anything after it, like W1, M1 or X.
          </p>
        )}
        {code ? <Decoded code={code} /> : null}
        <div className="mt-5">
          <label htmlFor="tc-employer" className="block text-sm text-[var(--foreground)] mb-2">
            Who pays it, for the letters <span className="text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id="tc-employer"
            type="text"
            value={inp.employer}
            onChange={(e) => set("employer", e.target.value)}
            placeholder="e.g. Harbour Logistics"
            className={inputClass}
          />
        </div>
      </div>

      {/* ---- Where and what ---- */}
      <div className={card}>
        <p className={eyebrow}>Where you live, and what this income is</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Where is your main home?</p>
        <Chips<Nation>
          label="Where your main home is"
          value={inp.nation}
          onPick={(v) => set("nation", v)}
          options={[
            { id: "eng", label: "England or Northern Ireland" },
            { id: "sco", label: "Scotland" },
            { id: "wal", label: "Wales" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What is this code for?</p>
        <Chips<Source>
          label="What this income is"
          value={inp.source}
          onPick={(v) => set("source", v)}
          cols={1}
          options={[
            { id: "main", label: "My only job, or my main one" },
            { id: "second", label: "A second job (I have another that pays more)" },
            { id: "pension", label: "A workplace or private pension" },
          ]}
        />
        {inp.source === "second" ? (
          <div className="mt-4 max-w-xs">
            <MoneyField
              id="tc-main"
              label="Your main job's pay for the year, before tax"
              value={inp.mainPay}
              onChange={(v) => set("mainPay", v)}
              placeholder="e.g. £28,000"
            />
          </div>
        ) : null}
        {inp.source === "pension" ? (
          <div className="mt-4 max-w-xs">
            <MoneyField
              id="tc-sp"
              label="Your State Pension for the year"
              value={inp.statePension}
              onChange={(v) => set("statePension", v)}
              placeholder="e.g. £12,547.60"
              optional
              hint="The full new State Pension is £241.30 a week in 2026/27, £12,547.60 a year. It's paid without tax taken, so HMRC collects its tax through this code."
            />
          </div>
        ) : null}
      </div>

      {/* ---- This year ---- */}
      <div className={card}>
        <p className={eyebrow}>This tax year</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">When did this job or pension start paying you?</p>
        <Chips<Start>
          label="When this started"
          value={inp.start}
          onPick={(v) => set("start", v)}
          options={[
            { id: "before", label: "Before 6 April" },
            { id: "during", label: "Since 6 April" },
          ]}
        />
        {inp.start === "during" ? (
          <>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateField id="tc-start" label="The day you started" value={inp.startDate} onChange={(v) => set("startDate", v)} />
            </div>
            {startBad ? <p className="mt-2 text-sm text-[var(--accent)]">{startBad}</p> : null}
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Before that, since 6 April, did you have other taxed pay?</p>
            <Chips<Earlier>
              label="Other taxed pay earlier this tax year"
              value={inp.earlier}
              onPick={(v) => set("earlier", v)}
              cols={1}
              options={[
                { id: "none", label: "No: this is my first job since 6 April" },
                { id: "p45", label: "Yes, and I gave this employer my P45" },
                { id: "nop45", label: "Yes, but they haven't got my P45" },
              ]}
            />
            {inp.earlier === "p45" || inp.earlier === "nop45" ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MoneyField
                  id="tc-prevpay"
                  label="Pay from that job since 6 April"
                  value={inp.prevPay}
                  onChange={(v) => set("prevPay", v)}
                  placeholder="e.g. £9,000"
                  hint="On the P45, or the last payslip's 'pay to date'."
                />
                <MoneyField
                  id="tc-prevtax"
                  label="Tax taken by that job"
                  value={inp.prevTax}
                  onChange={(v) => set("prevTax", v)}
                  placeholder="e.g. £400"
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {/* ---- The pay ---- */}
      <div className={card}>
        <p className={eyebrow}>Your pay</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">How often are you paid?</p>
        <Chips<Freq>
          label="How often you're paid"
          value={inp.freq}
          onPick={(v) => set("freq", v)}
          options={[
            { id: "month", label: "Monthly" },
            { id: "week", label: "Weekly" },
            { id: "fortnight", label: "Every two weeks" },
            { id: "4week", label: "Every four weeks" },
          ]}
        />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoneyField
            id="tc-pay"
            label="Taxable pay each payday, before tax"
            value={inp.pay}
            onChange={(v) => set("pay", v)}
            placeholder="e.g. £2,400"
            hint="Gross pay less any pension taken before tax. If it varies, use a typical one."
          />
          <DateField id="tc-paydate" label="Date of your latest payslip" value={inp.payDate} onChange={(v) => set("payDate", v)} />
          <MoneyField
            id="tc-taxpaid"
            label="Tax taken on that payslip"
            value={inp.taxPaid}
            onChange={(v) => set("taxPaid", v)}
            placeholder="e.g. £270.20"
            optional
            hint="Checks payroll is running the code the way the code says."
          />
        </div>
      </div>

      {/* ---- What's in the code ---- */}
      <div className={card}>
        <p className={eyebrow}>What else should be in your code</p>
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Leave blank whatever doesn&rsquo;t apply. These are the items HMRC adds or takes off the allowance.
        </p>
        <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Marriage Allowance?</p>
        <Chips<Marriage>
          label="Marriage Allowance"
          value={inp.marriage}
          onPick={(v) => set("marriage", v)}
          cols={1}
          options={[
            { id: "none", label: "No, or not sure" },
            { id: "receive", label: "My partner transferred some of theirs to me" },
            { id: "give", label: "I transferred some of mine to my partner" },
          ]}
        />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoneyField
            id="tc-benefits"
            label="Taxable benefits from work, a year"
            value={inp.benefits}
            onChange={(v) => set("benefits", v)}
            placeholder="e.g. £3,200"
            optional
            hint="Company car, fuel, private medical insurance: the 'cash equivalent' on your P11D or in the HMRC app."
          />
          {inp.source !== "pension" ? (
            <MoneyField
              id="tc-sp2"
              label="State Pension, a year"
              value={inp.statePension}
              onChange={(v) => set("statePension", v)}
              placeholder="e.g. £12,547.60"
              optional
            />
          ) : null}
          <MoneyField
            id="tc-other"
            label="Other untaxed income HMRC has put in your code"
            value={inp.otherIncome}
            onChange={(v) => set("otherIncome", v)}
            placeholder="e.g. £1,500"
            optional
            hint="Rent, savings interest over your allowance, a small side income. Only if HMRC is collecting it through this code."
          />
          <MoneyField
            id="tc-exp"
            label="Job expenses HMRC allows, a year"
            value={inp.expenses}
            onChange={(v) => set("expenses", v)}
            placeholder="e.g. £60"
            optional
            hint="Uniform washing (often a flat £60), professional fees, working from home if your employer requires it."
          />
          <MoneyField
            id="tc-owed"
            label="Tax owed from an earlier year, being collected through this code"
            value={inp.owed}
            onChange={(v) => set("owed", v)}
            placeholder="e.g. £300"
            optional
            hint="HMRC's letter says if it's doing this."
          />
        </div>
      </div>

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? taxCodeHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give the code, where you live, what the income is, when it started, how often you&rsquo;re paid, how much
            and your latest pay date. The read appears: the code these details give, what the difference costs by
            5 April, how much has already gone, and what to send to get it back.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_TAXCODE)} />
    </div>
  );
}

/** Tax on this income for the year: as coded, and with the code these details give. */
function TheYear({ read, freqLabel }: { read: TaxCodeRead; freqLabel: string }) {
  const max = Math.max(read.asIs.year, read.right.year, 1);
  const rows = [
    { label: `As coded (${read.code.text})`, year: read.asIs.year, soFar: read.asIs.soFar, tone: "muted" },
    { label: `With ${read.expectedText}`, year: read.right.year, soFar: read.right.soFar, tone: "accent" },
  ];
  const left = read.P - read.n;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Tax on this income, to 5 April</p>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--foreground)] break-words min-w-0">{r.label}</span>
              <span className="font-medium tabular-nums text-[var(--foreground)]">{money(r.year)}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]" aria-hidden="true">
              <span
                className={`block h-full ${r.tone === "accent" ? "bg-[var(--accent)]" : "bg-[var(--muted)]"}`}
                style={{ width: `${(Math.max(0, r.year) / max) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">{money(r.soFar)} of it by this payslip</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        Payslip {read.n} of {read.P}
        {read.s > 1 ? ` (your first was ${read.s})` : ""}, with {left} {left === 1 ? "payday" : "paydays"} left and the
        same pay each {freqLabel}. Worked the way the PAYE tables work, so a real payslip can differ by a pound or two.
      </p>
    </div>
  );
}

function Allowance({ read }: { read: TaxCodeRead }) {
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The allowance these details give</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {read.lines.map((l) => (
          <li key={l.label} className="flex justify-between gap-4">
            <span className="text-[var(--foreground)] min-w-0">{l.label}</span>
            <span className="tabular-nums text-[var(--foreground)]">
              {l.amount < 0 ? "−" : "+"}
              {money(Math.abs(l.amount))}
            </span>
          </li>
        ))}
        <li className="flex justify-between gap-4 pt-1.5 border-t border-[var(--border)] font-medium">
          <span className="text-[var(--foreground)]">Tax-free pay for the year</span>
          <span className="tabular-nums text-[var(--foreground)]">
            {read.expectedAllowance < 0 ? "−" : ""}
            {money(Math.abs(read.expectedAllowance))}
          </span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        Drop the last digit and add the letter: that&rsquo;s the code. A negative total becomes a K code.
        {read.expected.kind === "flat" ? " On a second job, the allowance is used by the main one, so this one is taxed at a flat rate." : ""}
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: TaxCodeInputs; read: TaxCodeRead; today: string }) {
  const [copied, setCopied] = useState<string>("");
  const rule = taxCodeRule();
  const letters = taxCodeLetters(inp, read);
  const dates = datesOf(inp, read, today);
  const know = knowList(inp, read);
  const keep = keepList();
  const body = taxCodeBody(inp, read);
  const freqLabel = inp.freq === "week" ? "week" : inp.freq === "fortnight" ? "fortnight" : inp.freq === "4week" ? "four weeks" : "month";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{taxCodeHeadline(inp, read)}</p>
      {body ? (
        <div className="mt-4 space-y-3">
          {body.split("\n\n").map((para) => (
            <p key={para} className="text-sm text-[var(--foreground)] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      ) : null}
      <TheYear read={read} freqLabel={freqLabel} />

      {read.flags.length ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>What&rsquo;s off</p>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed">
            {read.flags.map((f) => (
              <li key={f.id}>
                <span className="font-semibold text-[var(--foreground)]">{f.title}.</span>{" "}
                <span className="text-[var(--foreground)]">{f.body}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Allowance read={read} />

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
                {d.on < today ? <span className="text-[var(--accent)]"> (passed)</span> : null}
                <span className="text-[var(--foreground)]">: {d.title}.</span>{" "}
                <span className="text-[var(--muted)]">{d.body}</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => downloadIcs(dates.filter((d) => d.on >= today))} className={`mt-3 ${action}`}>
            Add the ones still ahead to your calendar (.ics)
          </button>
        </div>
      ) : null}

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`tc-letter-${l.id}`}>
            {l.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`tc-letter-${l.id}`}
            className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
          >
            {l.text}
          </pre>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(l.text)) ? l.id : "no")}
            className={`mt-3 ${action}`}
          >
            {copied === l.id ? "Copied" : "Copy the message"}
          </button>
        </div>
      ))}

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>Also worth knowing</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {know.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>What to keep together</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {keep.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not tax advice. Rates and bands are for 6 April 2026 to 5 April 2027. Free help: the HMRC app and your Personal
        Tax Account, TaxAid and Tax Help for Older People (for people on low incomes), and Citizens Advice.
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
            onClick={async () => setCopied((await copyText(taxCodeSummary(inp, read))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole read" : "Copy the whole read as text"}
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
      href: "/taxreturn",
      label: "HMRC wants a tax return as well?",
      note: "Dates both penalty clocks and writes the appeal or the request to withdraw the notice.",
    },
    {
      href: "/leaving",
      label: "Left a job this year?",
      note: "Check the final payslip: holiday built up, notice, deductions. And keep the P45 for the next one.",
    },
    {
      href: "/scam",
      label: "A text says you're owed a tax refund?",
      note: "HMRC doesn't send refund links. Check the message before you tap anything.",
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
        <Link href="/writing/before-the-total-closes" className={link}>
          Before the total closes
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
function Example() {
  const ex = taxCodeExample();
  const read = readTaxCode(ex, ex.payDate);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I spent the spring and summer looking after my dad and didn&rsquo;t work. On {letterDate(ex.startDate)}{" "}I
        started at a warehouse on £2,400 a month. I had no P45, and the form they gave me asked about other jobs and
        benefits, so I ticked the middle box to be safe. My first payslip, on {letterDate(ex.payDate)}, took{" "}
        {money(270.2)}{" "}in tax with the code 1257L M1. I assumed that was just what tax is.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{taxCodeHeadline(ex, read)}</p>
        <TheYear read={read} freqLabel="month" />
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The M1 gave me one month&rsquo;s allowance a month, {money(1048.25)}, and forgot the six months since April
          when I earned nothing. A cumulative 1257L gives the allowance for the whole year so far, so my first four
          payslips would have had no tax at all. I emailed payroll that statement A applied, and the {money(270.2)}{" "}
          came back in November&rsquo;s pay.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}payslip.
      </p>
    </div>
  );
}
