"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_SICK,
  DAY_NAMES,
  MAX_WEEKS,
  SSP_RATE,
  actDate,
  datesOf,
  isISODate,
  keepList,
  knowList,
  letterDate,
  money,
  numInvalid,
  oldRuleLine,
  parseSickInputs,
  readSick,
  sickBody,
  sickExample,
  sickHeadline,
  sickLetters,
  sickRule,
  sickSummary,
  todayISO,
  type CoPay,
  type DateLine,
  type PayBasis,
  type SickInputs,
  type SickRead,
  type Status,
  type Still,
  type YesNo,
} from "../data/sick";

/**
 * Off sick: what are you owed, and what do you send? (/sick)
 *
 * The instrument for Statutory Sick Pay since the April 2026 changes: paid
 * from the first day, with no earnings floor, at the lower of £123.25 or 80%
 * of average weekly earnings. It prices the days off, sets the remembered old
 * rule against the current one, draws the weeks ahead to the 28-week cliff,
 * dates the fit note, the SSP1 and the benefit claim, and writes the messages.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/sick.ts` so it can be checked without a browser.
 */

const STORE_KEY = "sick:v1";

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

function loadInputs(): SickInputs {
  if (typeof window === "undefined") return BLANK_SICK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseSickInputs(JSON.parse(raw)) : BLANK_SICK;
  } catch {
    return BLANK_SICK;
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
        `UID:sick-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/sick`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Sick pay")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sick-pay-dates.ics";
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

/** Seven toggles for the days you normally work. */
function WeekDays({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="group" aria-label="The days you normally work" className="grid grid-cols-7 gap-1.5">
      {DAY_NAMES.map((name, i) => {
        const on = value[i] === "1";
        return (
          <button
            key={name}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(value.slice(0, i) + (on ? "0" : "1") + value.slice(i + 1))}
            className={`text-sm py-1.5 rounded-lg border transition-colors text-center ${on ? chipOn : chipOff}`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

export default function SickClient() {
  const [inp, setInp] = useState<SickInputs>(BLANK_SICK);
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

  const set = <K extends keyof SickInputs>(k: K, v: SickInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readSick(inp, today), [inp, today]);
  const employee = inp.status === "employee";
  const datesBad =
    inp.still === "no" && isISODate(inp.firstDay) && isISODate(inp.lastDay) && inp.lastDay < inp.firstDay
      ? "The last day off can't be before the first."
      : isISODate(inp.firstDay) && inp.firstDay > today
        ? "The first day off is in the future. The read counts from it anyway."
        : "";
  const noDays = !inp.days.includes("1");

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

      {/* ---- Who pays you ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>Who pays you</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">How do you work?</p>
        <Chips<Status>
          label="How you work"
          value={inp.status}
          onPick={(v) => set("status", v)}
          cols={1}
          options={[
            { id: "employee", label: "On a payroll: employed, part-time, agency, zero-hours or casual" },
            { id: "self", label: "Self-employed only" },
          ]}
        />
        {employee ? (
          <div className="mt-5">
            <label htmlFor="sk-employer" className="block text-sm text-[var(--foreground)] mb-2">
              Employer&rsquo;s name, for the letters <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="sk-employer"
              type="text"
              value={inp.employer}
              onChange={(e) => set("employer", e.target.value)}
              placeholder="e.g. Corner Café"
              className={inputClass}
            />
          </div>
        ) : null}
      </div>

      {/* ---- The dates ---- */}
      {employee ? (
        <div className={card}>
          <p className={eyebrow}>The time off</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              id="sk-first"
              label="Your first day off sick"
              value={inp.firstDay}
              onChange={(v) => set("firstDay", v)}
              hint="If you went home partway through a shift, the next day."
            />
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Are you still off?</p>
          <Chips<Still>
            label="Whether you're still off"
            value={inp.still}
            onPick={(v) => set("still", v)}
            options={[
              { id: "yes", label: "Yes, still off" },
              { id: "no", label: "No, I'm back" },
            ]}
          />
          {inp.still === "no" ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateField id="sk-last" label="Your last day off sick" value={inp.lastDay} onChange={(v) => set("lastDay", v)} />
            </div>
          ) : null}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              id="sk-told"
              label="The day you told work"
              value={inp.toldOn}
              onChange={(v) => set("toldOn", v)}
              optional
            />
            <TextField
              id="sk-deadline"
              label="Their deadline for telling them, in days"
              value={inp.deadlineDays}
              onChange={(v) => set("deadlineDays", v)}
              placeholder="7 if there's no policy"
              kind="number"
              optional
              hint="From the sick policy. 1 means the first day."
            />
          </div>
          {datesBad ? <p className="mt-3 text-sm text-[var(--accent)]">{datesBad}</p> : null}
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            Were you off sick before this, with the earlier spell ending 8 weeks or less before this one started?
          </p>
          <Chips<YesNo>
            label="Whether an earlier spell links to this one"
            value={inp.linked}
            onPick={(v) => set("linked", v)}
            options={[
              { id: "no", label: "No" },
              { id: "yes", label: "Yes" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
          {inp.linked === "yes" ? (
            <div className="mt-4 max-w-xs">
              <TextField
                id="sk-linked-weeks"
                label="Weeks of sick pay in that earlier spell"
                value={inp.linkedWeeks}
                onChange={(v) => set("linkedWeeks", v)}
                placeholder="e.g. 2"
                kind="number"
                hint={`They come off the ${MAX_WEEKS} weeks. Count working weeks; 3 days is 0.6 of a 5-day week.`}
              />
            </div>
          ) : null}
          {inp.still === "yes" && isISODate(inp.firstDay) && today >= inp.firstDay ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Have you got a fit note?</p>
              <Chips<YesNo>
                label="Whether you have a fit note"
                value={inp.fitNote}
                onPick={(v) => set("fitNote", v)}
                options={[
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "Not yet" },
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- Your week and pay ---- */}
      {employee ? (
        <div className={card}>
          <p className={eyebrow}>Your week and your pay</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">The days you normally work</p>
          <WeekDays value={inp.days} onChange={(v) => set("days", v)} />
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            SSP is paid for these days only. If it varies, pick the days you agreed with your employer, or your usual pattern.
          </p>
          {noDays ? <p className="mt-2 text-sm text-[var(--accent)]">Pick at least one day.</p> : null}
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            Your pay before tax, on average, over the 8 weeks before you went off
          </p>
          <Chips<PayBasis>
            label="How you'll enter your pay"
            value={inp.payBasis}
            onPick={(v) => set("payBasis", v)}
            options={[
              { id: "week", label: "A weekly amount" },
              { id: "month", label: "A monthly amount" },
              { id: "year", label: "A yearly salary" },
            ]}
          />
          {inp.payBasis ? (
            <div className="mt-4 max-w-xs">
              <TextField
                id="sk-pay"
                label={inp.payBasis === "week" ? "A week's pay" : inp.payBasis === "month" ? "A month's pay" : "Yearly salary"}
                value={inp.pay}
                onChange={(v) => set("pay", v)}
                placeholder={inp.payBasis === "week" ? "e.g. £280" : inp.payBasis === "month" ? "e.g. £2,100" : "e.g. £26,000"}
                hint="Overtime, bonuses and commission paid in those 8 weeks count."
              />
            </div>
          ) : null}
          <p className="mt-6 text-sm text-[var(--foreground)] mb-2">Does your contract give company sick pay on top of SSP?</p>
          <Chips<CoPay>
            label="Whether there's company sick pay"
            value={inp.coPay}
            onPick={(v) => set("coPay", v)}
            cols={1}
            options={[
              { id: "none", label: "No, just SSP" },
              { id: "some", label: "Yes, full or half pay for a number of weeks" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
          {inp.coPay === "some" ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                id="sk-co-full"
                label="Weeks at full pay"
                value={inp.coFull}
                onChange={(v) => set("coFull", v)}
                placeholder="e.g. 4"
                kind="number"
              />
              <TextField
                id="sk-co-half"
                label="Then weeks at half pay"
                value={inp.coHalf}
                onChange={(v) => set("coHalf", v)}
                placeholder="e.g. 4"
                kind="number"
                optional
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- What they've paid ---- */}
      {employee ? (
        <div className={card}>
          <p className={eyebrow}>What they&rsquo;ve paid</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Not paid yet? Leave this blank. You&rsquo;ll still get what&rsquo;s owed and the dates.
          </p>
          {inp.coPay !== "some" ? (
            <div className="mt-4 max-w-xs">
              <TextField
                id="sk-paid"
                label="SSP paid so far for this spell (0 if none)"
                value={inp.paid}
                onChange={(v) => set("paid", v)}
                placeholder="e.g. £0"
                optional
              />
            </div>
          ) : null}
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Has your employer said you won&rsquo;t get SSP?</p>
          <Chips<YesNo>
            label="Whether your employer has refused SSP"
            value={inp.refused}
            onPick={(v) => set("refused", v)}
            options={[
              { id: "no", label: "No" },
              { id: "yes", label: "Yes" },
              { id: "unsure", label: "They haven't said" },
            ]}
          />
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? sickHeadline(inp, read, today) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say how you work, your first day off, whether you&rsquo;re back,
            your usual days and your pay. The read appears: what you&rsquo;re
            owed and from when, what the old rule would have paid, the weeks
            ahead, the dates, and the messages to send.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_SICK)} />
    </div>
  );
}

/** The old rule against the current one, for the same days. */
function OldVsNew({ read }: { read: SickRead }) {
  if (read.status === "self") return null;
  const max = Math.max(read.owedSoFar, read.oldRule, 1);
  const rows = [
    { label: "The rule most people remember (before 6 April 2026)", value: read.oldRule, tone: "muted" },
    { label: "The rule now", value: read.owedSoFar, tone: "accent" },
  ];
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The rule you remember, and the rule now</p>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--foreground)]">{r.label}</span>
              <span className="font-medium tabular-nums text-[var(--foreground)]">{money(r.value)}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]" aria-hidden="true">
              <span
                className={`block h-full ${r.tone === "accent" ? "bg-[var(--accent)]" : "bg-[var(--muted)]"}`}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">{oldRuleLine(read)}</p>
    </div>
  );
}

/** The weeks ahead: what comes in each week until SSP stops. */
function WeeksAhead({ inp, read }: { inp: SickInputs; read: SickRead }) {
  if (read.status === "self" || inp.still !== "yes") return null;
  const paying = read.phases.filter((p) => p.id !== "none");
  const max = Math.max(...paying.map((p) => p.perWeek), 1);
  // Weeks of SSP used before this spell, then each phase's span from there.
  const before = read.weekUsed - Math.floor((read.calendarDays - 1) / 7) - 1;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const spans = read.phases.map((p, i) => {
    if (p.id === "none") return `From week ${MAX_WEEKS + 1}`;
    const start = before + read.phases.slice(0, i).reduce((t, q) => t + q.weeks, 0);
    return `Weeks ${r1(start + 1)}–${r1(start + p.weeks)}`;
  });
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The weeks ahead, if you stay off</p>
      <ul className="mt-3 space-y-3">
        {read.phases.map((p, i) => {
          const span = spans[i];
          return (
            <li key={p.id} className="text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--foreground)]">
                  <span className="font-medium">{p.label}</span>
                  <span className="text-[var(--muted)]"> · {span}</span>
                </span>
                <span className={`font-medium tabular-nums ${p.id === "none" ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
                  {money(p.perWeek)}/wk
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]" aria-hidden="true">
                <span
                  className={`block h-full ${p.id === "ssp" ? "bg-[var(--accent)]" : "bg-[var(--foreground)]"}`}
                  style={{ width: `${(p.perWeek / max) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        SSP stops after {MAX_WEEKS} weeks in a period of sickness, on {letterDate(read.sspEnds)} if this spell runs on. The
        employer pays nothing after that unless your contract says so. What replaces it is a benefit you claim: New Style
        ESA (based on National Insurance) or Universal Credit (based on income). You can claim ESA up to three months
        before SSP ends, from {letterDate(read.claimFrom)}.
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: SickInputs; read: SickRead; today: string }) {
  const [copied, setCopied] = useState<string>("");
  const rule = sickRule();
  const letters = sickLetters(inp, read, today);
  const dates = datesOf(inp, read, today);
  const know = knowList(inp, read);
  const keep = keepList();
  const body = sickBody(inp, read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {sickHeadline(inp, read, today)}
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
      <OldVsNew read={read} />
      <WeeksAhead inp={inp} read={read} />

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
          <p className={eyebrow} id={`sk-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`sk-letter-${l.id}`}
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

      {read.status === "employee" ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>What to keep together</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {keep.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. Figures are for 6 April 2026 to 5 April 2027 (flat rate {money(SSP_RATE)}). Free help:
        Citizens Advice, Acas (England, Scotland and Wales), the Labour Relations Agency (Northern Ireland), your union
        if you have one, and HMRC&rsquo;s Statutory Payment Dispute Team if your employer won&rsquo;t pay.
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
            onClick={async () => setCopied((await copyText(sickSummary(inp, read, today))) ? "all" : "no")}
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
      href: "/challenge",
      label: "A benefit decision went against you?",
      note: "ESA and Universal Credit decisions can be looked at again; it dates the one-month deadline.",
    },
    {
      href: "/leaving",
      label: "The job ended while you were off?",
      note: "Check the final payslip, including holiday that built up while you were sick.",
    },
    {
      href: "/monthly",
      label: "Income dropping for a while?",
      note: "Find which monthly costs are worth pausing until it's back.",
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
        <Link href="/writing/the-rule-you-remember" className={link}>
          The rule you remember
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
  const ex = sickExample(today);
  const read = readSick(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I work Mondays, Wednesdays and Fridays at a café, about £120 a week. I
        had flu, then a chest infection, and was off from{" "}
        {letterDate(ex.firstDay)}{" "}to {letterDate(ex.lastDay)}. My payslip
        had no sick pay on it, and I didn&rsquo;t ask: I&rsquo;d always been
        told you had to earn over a certain amount, and that the first three
        days don&rsquo;t count anyway.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {sickHeadline(ex, read, today)}
        </p>
        <OldVsNew read={read} />
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Both of the things I&rsquo;d been told were true until April 2026.
          Now SSP is 80% of my {money(read.awe)}, so {money(read.weekly)}{" "}a
          week, or {money(read.daily)}{" "}for each of my days, from the first
          one. I sent the email; it was on the next payslip.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}figures.
      </p>
    </div>
  );
}
