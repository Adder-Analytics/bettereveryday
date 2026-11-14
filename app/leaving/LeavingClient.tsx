"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_DEDUCTION,
  BLANK_LEAVING,
  MAX_DEDUCTIONS,
  actDate,
  datesOf,
  isISODate,
  keepList,
  knowList,
  leavingBody,
  leavingExample,
  leavingHeadline,
  leavingLetters,
  leavingRule,
  leavingSummary,
  letterDate,
  money,
  numInvalid,
  parseLeavingInputs,
  readLeaving,
  todayISO,
  type DateLine,
  type Deduction,
  type DeductionKind,
  type Ended,
  type LeavingInputs,
  type LeavingRead,
  type NoticeServed,
  type Pattern,
  type PayBasis,
  type Region,
  type YesNo,
} from "../data/leaving";

/**
 * Leaving a job: is your last pay right? (/leaving)
 *
 * The instrument for the final payslip. It works out the holiday built up and
 * not taken (at a day's real pay, not salary ÷ 365), any notice cut short and
 * any days not paid, checks them against the payslip, judges each deduction
 * against the rule that it needs something in writing, dates the deadline and
 * writes the email.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/leaving.ts` so it can be checked without a browser.
 */

const STORE_KEY = "leaving:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £450.";
const NUM_BAD = "Couldn't read that as a number. Try something like 4.";

function loadInputs(): LeavingInputs {
  if (typeof window === "undefined") return BLANK_LEAVING;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseLeavingInputs(JSON.parse(raw)) : BLANK_LEAVING;
  } catch {
    return BLANK_LEAVING;
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
        `UID:leaving-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/leaving`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Final pay")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "final-pay-dates.ics";
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
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-2">
        {label}
        {optional ? <span className="text-[var(--muted)]"> (optional)</span> : null}
      </label>
      <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      {hint ? <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">{hint}</p> : null}
    </div>
  );
}

const KIND_OPTIONS: { id: DeductionKind; label: string }[] = [
  { id: "", label: "What was it for?" },
  { id: "holiday", label: "Holiday taken over what I'd built up" },
  { id: "training", label: "Training costs" },
  { id: "notice", label: "Notice I didn't work" },
  { id: "kit", label: "Equipment, uniform or kit" },
  { id: "overpay", label: "An earlier overpayment" },
  { id: "other", label: "Something else" },
];

function DeductionRow({
  idx,
  d,
  onChange,
  onRemove,
}: {
  idx: number;
  d: Deduction;
  onChange: (d: Deduction) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`lv-ded-kind-${idx}`} className="block text-sm text-[var(--foreground)] mb-2">
            Deduction {idx + 1}
          </label>
          <select
            id={`lv-ded-kind-${idx}`}
            value={d.kind}
            onChange={(e) => onChange({ ...d, kind: e.target.value as DeductionKind })}
            className={inputClass}
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.id || "none"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <TextField
          id={`lv-ded-amt-${idx}`}
          label="Amount taken off"
          value={d.amount}
          onChange={(v) => onChange({ ...d, amount: v })}
          placeholder="e.g. £450"
        />
      </div>
      {d.kind && d.kind !== "overpay" ? (
        <div className="mt-4">
          <p className="text-sm text-[var(--foreground)] mb-2">
            Did you agree to it in writing beforehand? A clause in your contract counts.
          </p>
          <Chips<YesNo>
            label={`Whether you agreed to deduction ${idx + 1} in writing`}
            value={d.agreed}
            onPick={(v) => onChange({ ...d, agreed: v })}
            options={[
              { id: "yes", label: "Yes, there's a clause or I signed something" },
              { id: "no", label: "No" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
        </div>
      ) : null}
      <button type="button" onClick={onRemove} className={`mt-3 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors`}>
        Remove this deduction
      </button>
    </div>
  );
}

export default function LeavingClient() {
  const [inp, setInp] = useState<LeavingInputs>(BLANK_LEAVING);
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

  const set = <K extends keyof LeavingInputs>(k: K, v: LeavingInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));
  const setDeduction = (i: number, d: Deduction) =>
    setInp((prev) => ({ ...prev, deductions: prev.deductions.map((x, j) => (j === i ? d : x)) }));
  const removeDeduction = (i: number) =>
    setInp((prev) => ({ ...prev, deductions: prev.deductions.filter((_, j) => j !== i) }));
  const addDeduction = () =>
    setInp((prev) =>
      prev.deductions.length >= MAX_DEDUCTIONS ? prev : { ...prev, deductions: [...prev.deductions, BLANK_DEDUCTION] }
    );

  const read = useMemo(() => readLeaving(inp), [inp]);
  const started = inp.region !== "" && inp.ended !== "";
  const noticeMatters = inp.ended === "resigned" || inp.ended === "dismissed";
  const irregular = inp.pattern === "irregular";
  const unitWord = irregular ? "hours" : "days";
  const datesBad =
    isISODate(inp.started) && isISODate(inp.leftOn) && inp.started >= inp.leftOn
      ? "The start date has to be before the last day."
      : noticeMatters && isISODate(inp.noticeOn) && isISODate(inp.leftOn) && inp.noticeOn > inp.leftOn
        ? "Notice can't be given after the last day."
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

      {/* ---- How it ended ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>How it ended</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Where did you work?</p>
        <Chips<Region>
          label="Where you worked"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "gb", label: "England, Wales or Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How did the job end?</p>
        <Chips<Ended>
          label="How the job ended"
          value={inp.ended}
          onPick={(v) => set("ended", v)}
          cols={1}
          options={[
            { id: "resigned", label: "I resigned" },
            { id: "dismissed", label: "They ended it (dismissed, or let go)" },
            { id: "misconduct", label: "Dismissed on the spot for gross misconduct" },
            { id: "fixed", label: "A fixed-term contract or temporary job came to its end" },
          ]}
        />
        {inp.ended === "dismissed" ? (
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            If it&rsquo;s a redundancy, use{" "}
            <Link href="/redundancy" className={link}>
              the redundancy tool
            </Link>
            : it adds redundancy pay to everything here.
          </p>
        ) : null}
        <div className="mt-5">
          <label htmlFor="lv-employer" className="block text-sm text-[var(--foreground)] mb-2">
            Employer&rsquo;s name, for the letters <span className="text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id="lv-employer"
            type="text"
            value={inp.employer}
            onChange={(e) => set("employer", e.target.value)}
            placeholder="e.g. Harbour Dental Group"
            className={inputClass}
          />
        </div>
      </div>

      {/* ---- The dates ---- */}
      {started ? (
        <div className={card}>
          <p className={eyebrow}>The dates</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField id="lv-started" label="The day you started" value={inp.started} onChange={(v) => set("started", v)} />
            <DateField
              id="lv-left"
              label="Your last day of employment"
              value={inp.leftOn}
              onChange={(v) => set("leftOn", v)}
              hint="The day the contract ended, even if you stopped working sooner."
            />
            {noticeMatters ? (
              <DateField
                id="lv-notice"
                label="The day notice was given"
                value={inp.noticeOn}
                onChange={(v) => set("noticeOn", v)}
                hint={inp.ended === "resigned" ? "The day you handed in your resignation." : "The day they told you, in writing or not."}
              />
            ) : null}
            <DateField
              id="lv-payday"
              label="The day the final pay was (or will be) paid"
              value={inp.payday}
              onChange={(v) => set("payday", v)}
              hint="Usually the next normal payday. The deadline runs from it."
              optional
            />
          </div>
          {datesBad ? <p className="mt-3 text-sm text-[var(--accent)]">{datesBad}</p> : null}
          {noticeMatters ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Did the notice run its full length?</p>
              <Chips<NoticeServed>
                label="Whether the notice ran its full length"
                value={inp.noticeServed}
                onPick={(v) => set("noticeServed", v)}
                cols={1}
                options={[
                  { id: "full", label: "Yes: I worked it, or was on garden leave, to the end" },
                  { id: "early-them", label: "No: they ended it early (or paid me to go)" },
                  { id: "early-me", label: "No: I left early, my choice" },
                ]}
              />
              <div className="mt-5 max-w-xs">
                <TextField
                  id="lv-contract"
                  label="Notice in your contract, in weeks"
                  value={inp.contractWeeks}
                  onChange={(v) => set("contractWeeks", v)}
                  placeholder="e.g. 4 (a month is about 4.3)"
                  kind="number"
                  optional
                />
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- Pay and holiday ---- */}
      {started ? (
        <div className={card}>
          <p className={eyebrow}>Pay and holiday</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Your hours were</p>
          <Chips<Pattern>
            label="Your working pattern"
            value={inp.pattern}
            onPick={(v) => set("pattern", v)}
            options={[
              { id: "fixed", label: "Regular: the same days most weeks" },
              { id: "irregular", label: "Irregular: zero-hours, shifts as offered, term-time" },
            ]}
          />
          {inp.pattern === "fixed" ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Your normal pay before tax is</p>
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
                    id="lv-pay"
                    label={`Gross pay, ${inp.payBasis === "year" ? "a year" : inp.payBasis === "month" ? "a month" : "a week"}`}
                    value={inp.pay}
                    onChange={(v) => set("pay", v)}
                    placeholder={inp.payBasis === "year" ? "e.g. £31,200" : inp.payBasis === "month" ? "e.g. £2,600" : "e.g. £600"}
                    hint="If overtime or commission are regular, holiday pay should include them: use your average over the last 52 weeks."
                  />
                  <TextField
                    id="lv-days"
                    label="Days you work in a normal week"
                    value={inp.daysPerWeek}
                    onChange={(v) => set("daysPerWeek", v)}
                    placeholder="5"
                    kind="number"
                  />
                </div>
              ) : null}
            </>
          ) : null}
          {irregular ? (
            <>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  id="lv-hourly"
                  label="Your hourly rate, before tax"
                  value={inp.hourly}
                  onChange={(v) => set("hourly", v)}
                  placeholder="e.g. £13.50"
                />
                <TextField
                  id="lv-hours"
                  label="Hours worked this leave year"
                  value={inp.hoursWorked}
                  onChange={(v) => set("hoursWorked", v)}
                  placeholder="e.g. 640"
                  kind="number"
                  hint="Add up the payslips since the leave year started."
                />
              </div>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
                Did each payslip have a separate holiday pay line on top of your hours?
              </p>
              <Chips<YesNo>
                label="Whether holiday pay was added to each payslip"
                value={inp.rolledUp}
                onPick={(v) => set("rolledUp", v)}
                options={[
                  { id: "yes", label: "Yes, about 12% extra each time" },
                  { id: "no", label: "No, I took paid holiday" },
                  { id: "unsure", label: "Not sure" },
                ]}
              />
            </>
          ) : null}
          {inp.pattern && inp.rolledUp !== "yes" ? (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!irregular ? (
                <TextField
                  id="lv-holiday"
                  label="Holiday a year, in days, with bank holidays"
                  value={inp.holidayDays}
                  onChange={(v) => set("holidayDays", v)}
                  placeholder="e.g. 28"
                  kind="number"
                  optional
                  hint="Leave blank for the legal minimum: 28 for five days a week."
                />
              ) : null}
              <DateField
                id="lv-leave-year"
                label="Your leave year started on"
                value={inp.leaveYearFrom}
                onChange={(v) => set("leaveYearFrom", v)}
                hint="Often 1 January or 1 April. Blank assumes January."
              />
              <TextField
                id="lv-taken"
                label={`Holiday ${unitWord} taken this leave year`}
                value={inp.holidayTaken}
                onChange={(v) => set("holidayTaken", v)}
                placeholder={irregular ? "e.g. 24" : "e.g. 10"}
                kind="number"
                hint="Including bank holidays you had off."
              />
              <TextField
                id="lv-carried"
                label={`${irregular ? "Hours" : "Days"} carried over from last year`}
                value={inp.carried}
                onChange={(v) => set("carried", v)}
                placeholder="e.g. 3"
                kind="number"
                optional
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- The payslip ---- */}
      {started && inp.pattern ? (
        <div className={card}>
          <p className={eyebrow}>The final payslip</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Haven&rsquo;t had it yet? Leave this part blank. You&rsquo;ll get
            what it should include, and an email asking them to confirm it.
          </p>
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Did it pay for every {irregular ? "hour" : "day"} you worked up to your last day?</p>
          <Chips<YesNo>
            label="Whether the final pay covered every day worked"
            value={inp.wagesPaid}
            onPick={(v) => set("wagesPaid", v)}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
          {inp.wagesPaid === "no" ? (
            <div className="mt-4 max-w-xs">
              <TextField
                id="lv-unpaid"
                label={`${irregular ? "Hours" : "Days"} worked and not paid`}
                value={inp.unpaid}
                onChange={(v) => set("unpaid", v)}
                placeholder="e.g. 3"
                kind="number"
              />
            </div>
          ) : null}
          {inp.rolledUp !== "yes" ? (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                id="lv-paid-units"
                label={`Holiday ${unitWord} it paid`}
                value={inp.paidHolidayUnits}
                onChange={(v) => set("paidHolidayUnits", v)}
                placeholder="e.g. 6"
                kind="number"
                optional
                hint="Often shown as a quantity next to the holiday line."
              />
              <TextField
                id="lv-paid-hol"
                label="The holiday pay line, in £"
                value={inp.paidHoliday}
                onChange={(v) => set("paidHoliday", v)}
                placeholder="e.g. £512.88"
                optional
              />
            </div>
          ) : null}
          {noticeMatters && inp.noticeServed === "early-them" ? (
            <div className="mt-5 max-w-xs">
              <TextField
                id="lv-paid-notice"
                label="Notice pay on it (0 if none)"
                value={inp.paidNotice}
                onChange={(v) => set("paidNotice", v)}
                placeholder="e.g. £0"
                optional
              />
            </div>
          ) : null}
          <p className="mt-6 text-sm text-[var(--foreground)] mb-2">Anything taken off, apart from tax, NI, pension and student loan?</p>
          <div className="space-y-3">
            {inp.deductions.map((d, i) => (
              <DeductionRow key={i} idx={i} d={d} onChange={(nd) => setDeduction(i, nd)} onRemove={() => removeDeduction(i)} />
            ))}
          </div>
          {inp.deductions.length < MAX_DEDUCTIONS ? (
            <button type="button" onClick={addDeduction} className={`mt-3 ${action}`}>
              + Add a deduction
            </button>
          ) : null}
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? leavingHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Fill in how the job ended, the dates and your pay. The read
            appears: what the final pay should include, whether the payslip
            matches, which deductions hold up, the deadline, and the email to
            send.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_LEAVING)} />
    </div>
  );
}

/** The day-rate comparison: working days vs calendar days vs the payslip. */
function DayRate({ read }: { read: LeavingRead }) {
  if (read.unit !== "day" || read.calendarRate === null || read.rolledUp) return null;
  const rows: { label: string; value: number; tone: "accent" | "muted" | "fg" }[] = [
    { label: `A day's pay (salary ÷ ${Math.round(52 * read.perWeek)} working days)`, value: read.rate, tone: "accent" },
    { label: "Salary ÷ 365 calendar days", value: read.calendarRate, tone: "muted" },
  ];
  if (read.paidRate !== null && !read.calendarDays) rows.push({ label: "Your payslip's rate", value: read.paidRate, tone: "fg" });
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What a day of holiday is worth</p>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--foreground)]">
                {r.label}
                {read.calendarDays && r.tone === "muted" ? <span className="text-[var(--accent)] font-medium"> (your payslip)</span> : null}
              </span>
              <span className="font-medium tabular-nums text-[var(--foreground)]">{money(r.value)}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]" aria-hidden="true">
              <span
                className={`block h-full ${r.tone === "accent" ? "bg-[var(--accent)]" : r.tone === "muted" ? "bg-[var(--muted)]" : "bg-[var(--foreground)]"}`}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Lines({ read }: { read: LeavingRead }) {
  if (!read.lines.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What the final pay should include</p>
      <ul className="mt-3 space-y-3">
        {read.lines.map((l) => (
          <li key={l.id} className="text-sm leading-relaxed">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--foreground)] font-medium">{l.label}</span>
              <span className="text-[var(--foreground)] font-medium tabular-nums">{money(l.owed)}</span>
            </div>
            {l.paid !== null ? (
              <p className={`text-xs ${l.owed - l.paid > 20 ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                The payslip shows {money(l.paid)}
                {l.owed - l.paid > 20 ? `: ${money(l.owed - l.paid)} short.` : "."}
              </p>
            ) : null}
            <p className="text-xs text-[var(--muted)]">{l.detail} Taxed as pay.</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const VERDICT_LABEL = { fair: "Allowed", check: "Ask to see the clause", challenge: "Challenge it" } as const;

function Deductions({ read }: { read: LeavingRead }) {
  if (!read.deductions.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The deductions</p>
      <ul className="mt-3 space-y-3">
        {read.deductions.map((d, i) => (
          <li key={`${d.kind}-${i}`} className="text-sm leading-relaxed">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--foreground)] font-medium">{d.label}</span>
              <span className="text-[var(--foreground)] font-medium tabular-nums">{money(d.amount)}</span>
            </div>
            <p className={`text-xs font-medium ${d.verdict === "challenge" ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
              {VERDICT_LABEL[d.verdict]}
              {d.verdict === "challenge" && d.challenge < d.amount - 0.5 ? `: ${money(d.challenge)} of it` : ""}
            </p>
            <p className="text-xs text-[var(--muted)]">{d.why}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: LeavingInputs; read: LeavingRead; today: string }) {
  const [copied, setCopied] = useState<string>("");
  const rule = leavingRule();
  const letters = leavingLetters(inp, read, today);
  const dates = datesOf(inp, read);
  const know = knowList(inp, read);
  const keep = keepList();
  const body = leavingBody(inp, read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {leavingHeadline(inp, read)}
      </p>
      {body ? (
        <div className="mt-4 space-y-3">
          {body.split("\n\n").map((para) => (
            <p key={para} className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>
      ) : null}
      <DayRate read={read} />
      <Lines read={read} />
      <Deductions read={read} />

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
          <p className={eyebrow} id={`lv-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`lv-letter-${l.id}`}
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
        Not legal advice. Free help: Acas (England, Scotland and Wales), the
        Labour Relations Agency (Northern Ireland), Citizens Advice, and your
        union if you have one.
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
            onClick={async () => setCopied((await copyText(leavingSummary(inp, read, today))) ? "all" : "no")}
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
      href: "/redundancy",
      label: "Was it a redundancy?",
      note: "Add statutory redundancy pay, and split any settlement offer into owed-anyway and on top.",
    },
    {
      href: "/dismissed",
      label: "Were you sacked?",
      note: "Some claims need no qualifying service, and the Acas deadline doesn't wait for an appeal. It dates it and goes through each claim.",
    },
    {
      href: "/monthly",
      label: "A gap before the next job?",
      note: "Find which monthly costs are worth keeping while the income stops.",
    },
    {
      href: "/debts",
      label: "Money tight while you look?",
      note: "With one amount a month to spare, decide which debt to pay first.",
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
        <Link href="/writing/check-the-denominator" className={link}>
          Check the denominator
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
  const ex = leavingExample(today);
  const read = readLeaving(ex);
  if (!read || read.paidRate === null) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I was a receptionist at a dental group for two years, on £31,200. I
        resigned with a month&rsquo;s notice and worked it, leaving on{" "}
        {letterDate(ex.leftOn)}. The last payslip had six days&rsquo; holiday
        at {money(read.paidRate)}{" "}a day, and £450 off for a course they
        sent me on last year. I nearly didn&rsquo;t look.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {leavingHeadline(ex, read)}
        </p>
        <DayRate read={read} />
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Payroll had divided my salary by 365. I work 260 days a year, so a
          day&rsquo;s pay is {money(read.rate)}, and I&rsquo;d built up{" "}
          {read.holidayOwed}{" "}days, not six. Nothing I&rsquo;d signed
          mentioned paying back training. I sent the email; the corrected
          payslip came the next week, with the £450 back on it.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}figures.
      </p>
    </div>
  );
}
