"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_STUDENTLOAN,
  DEFAULT_GROWTH,
  DEFAULT_RPI,
  DEFAULT_SAVINGS,
  THRESHOLD_LAST,
  datesOf,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  monthYear,
  olderApplies,
  parseStudentLoanInputs,
  pct,
  rateInvalid,
  readStudentLoan,
  remindersOf,
  rowsOf,
  studentLoanBody,
  studentLoanExample,
  studentLoanHeadline,
  studentLoanRule,
  studentLoanSummary,
  todayISO,
  yearInvalid,
  type DateLine,
  type Plan,
  type StudentLoanInputs,
  type StudentLoanRead,
  type YesNo,
} from "../data/studentloan";

/**
 * Student loan: overpay, or let it run out? (/studentloan)
 *
 * Runs a UK student loan forward month by month to tell borrowers who will
 * clear it from those who won't, prices an overpayment and clearing it today
 * against letting it run, and checks for refunds.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/studentloan.ts` so it can be checked without a browser.
 */

const STORE_KEY = "studentloan:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase = "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff = "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow = "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card = "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const link = "text-[var(--accent)] hover:opacity-70 transition-opacity";
const action = "text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity";

function loadInputs(): StudentLoanInputs {
  if (typeof window === "undefined") return BLANK_STUDENTLOAN;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseStudentLoanInputs(JSON.parse(raw)) : BLANK_STUDENTLOAN;
  } catch {
    return BLANK_STUDENTLOAN;
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
        `UID:studentloan-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/studentloan`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Student loan")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "student-loan-dates.ics";
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

function RateField(props: { id: string; label: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; hint?: string }) {
  return <Field {...props} bad={rateInvalid(props.value)} badText={`A percentage, like ${props.placeholder}.`} />;
}

function YearField(props: { id: string; label: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string; hint?: string }) {
  return <Field {...props} bad={yearInvalid(props.value)} badText={`A year, like ${props.placeholder}.`} />;
}

const optional = <span className="text-[var(--muted)]">(optional)</span>;

export default function StudentLoanClient() {
  const [inp, setInp] = useState<StudentLoanInputs>(BLANK_STUDENTLOAN);
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

  const set = <K extends keyof StudentLoanInputs>(k: K, v: StudentLoanInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readStudentLoan(inp, today), [inp, today]);
  const lastTh = inp.plan ? THRESHOLD_LAST[inp.plan] : null;

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
        {showExample ? <StudentLoanExample today={today} /> : null}
      </div>

      {/* ---- The loan ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>The loan</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Which plan?</p>
        <Chips<Plan>
          label="Plan"
          value={inp.plan}
          onPick={(v) => set("plan", v)}
          cols={1}
          options={[
            { id: "2", label: "Plan 2: England or Wales, started 2012 to 2022" },
            { id: "5", label: "Plan 5: England, started from August 2023" },
            { id: "1", label: "Plan 1: England or Wales before 2012, or Northern Ireland" },
            { id: "4", label: "Plan 4: Scotland" },
            { id: "pg", label: "Postgraduate Loan: master's or doctoral, England or Wales" },
          ]}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          Your Student Loans Company online account says which. If you have a Postgraduate Loan as well, run it
          separately: it&rsquo;s repaid at the same time, at 6% over £21,000.
        </p>
        {inp.plan === "2" ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Was the loan from Student Finance Wales?</p>
            <Chips<YesNo>
              label="Student Finance Wales"
              value={inp.wales}
              onPick={(v) => set("wales", v)}
              options={[
                { id: "no", label: "No, Student Finance England" },
                { id: "yes", label: "Yes, Wales" },
              ]}
            />
            <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
              The Welsh Government says it won&rsquo;t follow the threshold freeze from April 2027.
            </p>
          </>
        ) : null}
        {olderApplies(inp) ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
              Was your first loan paid before {inp.plan === "1" ? "September 2006" : "August 2007"}?
            </p>
            <Chips<YesNo>
              label="Older loan"
              value={inp.older}
              onPick={(v) => set("older", v)}
              options={[
                { id: "no", label: "No" },
                { id: "yes", label: "Yes" },
              ]}
            />
            {inp.older === "yes" ? (
              <div className="mt-4">
                <YearField
                  id="sl-born"
                  label="Year you were born"
                  value={inp.born}
                  onChange={(v) => set("born", v)}
                  placeholder="1982"
                  hint={inp.plan === "1" ? "Older Plan 1 loans are written off at 65." : "Older Plan 4 loans go at 65 or after 30 years, whichever comes first."}
                />
              </div>
            ) : null}
          </>
        ) : null}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoneyField id="sl-balance" label="What you owe now" value={inp.balance} onChange={(v) => set("balance", v)} placeholder="£52,000" hint="From your SLC online account." />
          <YearField
            id="sl-due"
            label="The April repayments were first due"
            value={inp.firstDue}
            onChange={(v) => set("firstDue", v)}
            placeholder="2021"
            hint="The April after you left the course. Finished in summer 2020? That's 2021."
          />
          <MoneyField id="sl-salary" label="Your pay before tax, a year" value={inp.salary} onChange={(v) => set("salary", v)} placeholder="£34,000" hint="Salary plus any regular bonus or overtime." />
          <RateField
            id="sl-growth"
            label={<>Pay rises, on average {optional}</>}
            value={inp.growth}
            onChange={(v) => set("growth", v)}
            placeholder={`${DEFAULT_GROWTH}%`}
            hint={`A year, including promotions. Without it, ${DEFAULT_GROWTH}%.`}
          />
        </div>
      </div>

      {/* ---- The overpayment ---- */}
      <div className={card}>
        <p className={eyebrow}>The overpayment you&rsquo;re weighing {optional}</p>
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Leave both blank and the read prices £1,000 as an example.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoneyField id="sl-lump" label="A one-off amount now" value={inp.lump} onChange={(v) => set("lump", v)} placeholder="£8,000" />
          <MoneyField id="sl-extra" label="Or extra each month" value={inp.extra} onChange={(v) => set("extra", v)} placeholder="£100" />
          <RateField
            id="sl-savings"
            label={<>What savings would pay instead {optional}</>}
            value={inp.savings}
            onChange={(v) => set("savings", v)}
            placeholder={`${DEFAULT_SAVINGS}%`}
            hint={`Used to put future payments in today's money. Without it, ${DEFAULT_SAVINGS}%.`}
          />
          <RateField
            id="sl-rpi"
            label={<>Inflation (RPI) from September 2027 {optional}</>}
            value={inp.rpi}
            onChange={(v) => set("rpi", v)}
            placeholder={`${DEFAULT_RPI}%`}
            hint={`Sets future interest and thresholds. Without it, ${DEFAULT_RPI}%.`}
          />
        </div>
      </div>

      {/* ---- Refund check ---- */}
      <div className={card}>
        <p className={eyebrow}>Owed a refund? {optional}</p>
        <div className="mt-3">
          <MoneyField
            id="sl-last"
            label="Your total pay from 6 April 2025 to 5 April 2026"
            value={inp.lastYear}
            onChange={(v) => set("lastYear", v)}
            placeholder="£24,500"
            hint={
              lastTh
                ? `On your P60. Under ${money(lastTh)} for the whole year, but repayments taken in the months you earned more? They can come back.`
                : "On your P60. If it was under that year's threshold but repayments were taken, they can come back."
            }
          />
        </div>
      </div>

      <AnnounceAnswer message={read ? studentLoanHeadline(read) : null} />
      {read ? (
        <ReadBlock read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Pick your plan, and give what you owe, the April repayments started and your pay. The read appears: whether
            you&rsquo;re on course to clear it, what an overpayment would change, and the dates that matter.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_STUDENTLOAN)} />
    </div>
  );
}

/** Let it run, overpay, or clear it today: the totals side by side. */
function Rows({ read }: { read: StudentLoanRead }) {
  const rows = rowsOf(read);
  const least = Math.min(...rows.map((r) => r.total));
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What you&rsquo;d pay from now, in all</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.id} className="py-2.5 text-sm">
            <span className="flex items-baseline justify-between gap-4">
              <span className={r.total === least ? "text-[var(--accent)] font-semibold" : "text-[var(--foreground)] font-medium"}>
                {r.label}
                {r.total === least ? " (least)" : ""}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--foreground)]">{money(r.total)}</span>
            </span>
            <span className="block text-xs text-[var(--muted)] leading-relaxed">
              {money(r.pv)}{" "}in today&rsquo;s money; {r.note}.
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        Assumes pay rises of {pct(read.growth)} a year and RPI of {pct(read.rpi)}{" "}from September 2027.
        &ldquo;Today&rsquo;s money&rdquo; counts a pound paid later as worth less, at the {pct(read.savings)} savings
        would pay.
      </p>
    </div>
  );
}

function Tiles({ read }: { read: StudentLoanRead }) {
  const tiles = [
    { label: "Repaying now", value: money(read.monthlyNow), note: `a month, ${read.plan === "pg" ? "6%" : "9%"} over ${money(read.threshold)}` },
    { label: "Interest now", value: pct(read.rateNow), note: "set each September" },
    read.base.clearedOn
      ? { label: "Cleared", value: monthYear(read.base.clearedOn), note: "on these numbers" }
      : { label: "Written off", value: money(read.base.writtenOff), note: `in ${monthYear(read.writeOff)}` },
  ];
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

function ReadBlock({ read, today }: { read: StudentLoanRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = studentLoanRule(read);
  const msgs = messagesOf(read);
  const reminders = remindersOf(read, today);
  const dates = datesOf(read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{studentLoanHeadline(read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{studentLoanBody(read)}</p>

      {read.verdict !== "done" ? (
        <>
          <Tiles read={read} />
          <Rows read={read} />
          <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
            <p className={eyebrow}>Before you overpay anything</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
              <li>Money overpaid can&rsquo;t be taken back, even if you lose your job.</li>
              <li>Clear anything dearer first: a credit card, overdraft or car finance usually charges more.</li>
              <li>
                A mortgage lender counts the monthly repayment, not the balance, so overpaying doesn&rsquo;t help you borrow
                more unless it clears the loan.
              </li>
              <li>
                Paying into a workplace pension instead gets tax relief, often an employer match, and lowers the pay the
                repayment is worked out on if it&rsquo;s by salary sacrifice.
              </li>
            </ul>
          </div>
        </>
      ) : null}

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
          <p className={eyebrow} id={`sl-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`sl-msg-${m.id}`}
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
        Not financial advice. The Student Loans Company won&rsquo;t ask for your bank login or a payment by phone out of
        the blue; emails promising to cancel or reduce your loan for a fee are scams. Log in to your account directly.
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
            onClick={async () => setCopied((await copyText(studentLoanSummary(read, today))) ? "all" : "no")}
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
      href: "/debts",
      label: "Other debts too?",
      note: "Cards and loans that charge more come first. See what each order costs.",
    },
    {
      href: "/taxcode",
      label: "Payslip looks wrong?",
      note: "Check the tax code while you're checking the student loan plan type.",
    },
    {
      href: "/remortgage",
      label: "Saving for a home, or remortgaging?",
      note: "The deposit and the rate matter more than the student loan balance.",
    },
    {
      href: "/scam",
      label: "An email offers to cancel your loan?",
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
        <Link href="/writing/the-balance-isnt-the-bill" className={link}>
          The balance isn&rsquo;t the bill
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function StudentLoanExample({ today }: { today: string }) {
  const ex = studentLoanExample();
  const read = readStudentLoan(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I finished my degree in 2020 and owe about £52,000 on Plan 2. I earn £34,000. My grandmother left me £8,000, and
        my first thought was to make the debt smaller: it&rsquo;s been growing every year even though I pay something
        every month.
      </p>
      <Rows read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{studentLoanHeadline(read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Letting it run, I&rsquo;d pay about {money(read.base.total)} over the next {read.writeOffYears}{" "}years. To clear
          it I&rsquo;d need to be earning about {money(read.clearSalary ?? 0)}{" "}now. The £8,000 went into a Lifetime ISA
          and an emergency fund instead. The balance still grows; it isn&rsquo;t my bill.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}loan.
      </p>
    </div>
  );
}
