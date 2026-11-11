"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { withSubject } from "../data/carry";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_TR,
  actDate,
  fileAndPlan,
  isISODate,
  letterDate,
  money,
  parseTrInputs,
  pounds,
  readTr,
  todayISO,
  trBody,
  trExample,
  trHeadline,
  trLetters,
  trReminders,
  trRule,
  trSummary,
  waitToFile,
  yearLabel,
  yearOptions,
  type TrAsked,
  type TrCanPay,
  type TrExcuse,
  type TrFiled,
  type TrInputs,
  type TrNeed,
  type TrPaid,
  type TrRead,
  type YesNo,
} from "../data/taxreturn";

/**
 * A tax return due: what does late cost, and what stops it? (/taxreturn)
 *
 * The instrument for a Self Assessment return that's due, late, filed but
 * unpaid, or on a plan. Its point is that the return and the money run on
 * separate clocks: it prices each step of both, shows the usual mistake
 * (waiting to file until you can pay) against filing on time and spreading
 * the tax, explains the first-year January bill, and writes the letters.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/taxreturn.ts` so it can be checked without a browser.
 */

const STORE_KEY = "taxreturn:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £4,200.";

function loadInputs(): TrInputs {
  if (typeof window === "undefined") return BLANK_TR;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseTrInputs(JSON.parse(raw)) : BLANK_TR;
  } catch {
    return BLANK_TR;
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

function downloadIcs(list: { on: string; title: string; body: string }[]): void {
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
        `UID:taxreturn-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/taxreturn`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Tax return")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tax-return-dates.ics`;
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
  cols?: 1 | 2 | 3 | 4;
}) {
  const grid =
    cols === 4
      ? "grid-cols-4"
      : cols === 3
        ? "grid-cols-1 sm:grid-cols-3"
        : cols === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1";
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
        aria-invalid={moneyInvalid(value)}
        className={inputClass}
      />
      {moneyInvalid(value) ? <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p> : null}
      {hint ? <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export default function TaxReturnClient() {
  const [inp, setInp] = useState<TrInputs>(BLANK_TR);
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

  const set = <K extends keyof TrInputs>(k: K, v: TrInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readTr(inp, today), [inp, today]);
  const years = yearOptions(today);
  const needsReturn = inp.asked !== "" && inp.asked !== "none" && inp.need !== "" && inp.need !== "nothing";
  const end = Number(inp.year) || years[0];
  const deadlinePassed = today > `${end + 1}-01-31`;
  const showCanPay =
    needsReturn && (inp.filed === "no" || (inp.filed === "yes" && inp.paid === "no"));
  const showExcuse =
    needsReturn &&
    ((inp.filed === "no" && deadlinePassed) ||
      (inp.filed === "yes" && isISODate(inp.filedOn) && read !== null && inp.filedOn > read.d.fileBy));

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
        {showExample ? <TrExample today={today} /> : null}
      </div>

      {/* ---- Which return ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--foreground)] mb-2">Which year&rsquo;s return?</p>
        <Chips<string>
          label="Tax year"
          value={inp.year}
          onPick={(v) => set("year", v)}
          cols={3}
          options={years.map((y) => ({
            id: String(y),
            label: `${yearLabel(y)}${today <= `${y + 1}-01-31` ? ` (due 31 Jan ${y + 1})` : " (deadline passed)"}`,
          }))}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          A tax year runs from 6 April to 5 April. The return for it is due
          online by the next 31 January.
        </p>

        {inp.year ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Has HMRC asked you to file it?</p>
            <Chips<TrAsked>
              label="Whether HMRC has asked you to file"
              value={inp.asked}
              onPick={(v) => set("asked", v)}
              cols={1}
              options={[
                { id: "usual", label: "Yes: I'm in Self Assessment, or got a notice before November" },
                { id: "late", label: "Yes, but the notice was sent after 31 October" },
                { id: "none", label: "No: I've never registered, or not for this income" },
              ]}
            />
            {inp.asked === "late" ? (
              <div className="mt-4">
                <label htmlFor="tr-notice-on" className="block text-sm text-[var(--foreground)] mb-2">
                  Date on the notice to file
                </label>
                <input
                  id="tr-notice-on"
                  type="date"
                  value={inp.noticeOn}
                  onChange={(e) => set("noticeOn", e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                  A notice sent after 31 October gives you three months from its date.
                </p>
              </div>
            ) : null}

            {inp.asked ? (
              <>
                <p className="mt-5 text-sm text-[var(--foreground)] mb-1">
                  Was there anything in {yearLabel(end)} that needs a return?
                </p>
                <ul className="mb-2 text-xs text-[var(--muted)] leading-relaxed list-disc pl-5 space-y-0.5">
                  <li>self-employed or freelance income over £1,000 before expenses</li>
                  <li>rent over £1,000, or a share in a partnership</li>
                  <li>untaxed income over £2,500, or over £10,000 of savings or dividends</li>
                  <li>capital gains to report, or foreign income</li>
                  <li>the High Income Child Benefit Charge, if it isn&rsquo;t being collected through your tax code</li>
                </ul>
                <Chips<TrNeed>
                  label="Whether there's anything to report"
                  value={inp.need}
                  onPick={(v) => set("need", v)}
                  cols={3}
                  options={[
                    { id: "yes", label: "Yes" },
                    { id: "unsure", label: "Not sure" },
                    { id: "nothing", label: "No, nothing" },
                  ]}
                />
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {/* ---- Where it's got to ---- */}
      {needsReturn ? (
        <div className={card}>
          <p className={eyebrow}>The return</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Have you filed it?</p>
          <Chips<TrFiled>
            label="Whether the return is filed"
            value={inp.filed}
            onPick={(v) => set("filed", v)}
            options={[
              { id: "no", label: "Not yet" },
              { id: "yes", label: "Yes" },
            ]}
          />
          {inp.filed === "yes" ? (
            <div className="mt-4">
              <label htmlFor="tr-filed-on" className="block text-sm text-[var(--foreground)] mb-2">
                The day it went in
              </label>
              <input
                id="tr-filed-on"
                type="date"
                value={inp.filedOn}
                max={today}
                onChange={(e) => set("filedOn", e.target.value)}
                className={inputClass}
              />
            </div>
          ) : null}

          <p className={`mt-6 ${eyebrow}`}>The tax</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MoneyField
              id="tr-tax"
              label={
                <>
                  Tax for the year <span className="text-[var(--muted)]">(a guess is fine)</span>
                </>
              }
              value={inp.tax}
              onChange={(v) => set("tax", v)}
              placeholder="e.g. £4,200"
              hint="Income tax and Class 4 National Insurance not already taken off through PAYE. The return's calculation shows it."
            />
            <MoneyField
              id="tr-poa"
              label={
                <>
                  Already paid towards it <span className="text-[var(--muted)]">(optional)</span>
                </>
              }
              value={inp.poaPaid}
              onChange={(v) => set("poaPaid", v)}
              placeholder="£0 if it's your first year"
              hint="Payments on account made last January and July."
            />
          </div>
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">
            Was most of your tax (80% or more) already taken through PAYE?
          </p>
          <Chips<YesNo>
            label="Whether most tax was taken through PAYE"
            value={inp.mostPaye}
            onPick={(v) => set("mostPaye", v)}
            options={[
              { id: "no", label: "No, or I'm self-employed" },
              { id: "yes", label: "Yes" },
            ]}
          />

          {inp.filed === "yes" ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Have you paid it?</p>
              <Chips<TrPaid>
                label="Whether the tax is paid"
                value={inp.paid}
                onPick={(v) => set("paid", v)}
                cols={1}
                options={[
                  { id: "no", label: "Not yet, or not all of it" },
                  { id: "full", label: "Yes, in full" },
                  { id: "plan", label: "I'm on a payment plan (Time to Pay)" },
                ]}
              />
              {inp.paid === "full" ? (
                <div className="mt-4">
                  <label htmlFor="tr-paid-on" className="block text-sm text-[var(--foreground)] mb-2">
                    The day you paid
                  </label>
                  <input
                    id="tr-paid-on"
                    type="date"
                    value={inp.paidOn}
                    max={today}
                    onChange={(e) => set("paidOn", e.target.value)}
                    className={inputClass}
                  />
                </div>
              ) : null}
              {inp.paid === "plan" ? (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tr-plan-on" className="block text-sm text-[var(--foreground)] mb-2">
                      The day the plan was agreed
                    </label>
                    <input
                      id="tr-plan-on"
                      type="date"
                      value={inp.planOn}
                      max={today}
                      onChange={(e) => set("planOn", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground)] mb-2">Over</p>
                    <Chips<string>
                      label="Months the plan runs"
                      value={inp.planMonths}
                      onPick={(v) => set("planMonths", v)}
                      cols={4}
                      options={[
                        { id: "3", label: "3 mo" },
                        { id: "6", label: "6 mo" },
                        { id: "12", label: "12 mo" },
                        { id: "24", label: "24 mo" },
                      ]}
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {showCanPay ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Could you pay the January bill?</p>
              <Chips<TrCanPay>
                label="Whether you could pay"
                value={inp.canPay}
                onPick={(v) => set("canPay", v)}
                cols={1}
                options={[
                  { id: "all", label: "Yes, in one go" },
                  { id: "plan", label: "Over a few months" },
                  { id: "none", label: "Not at the moment" },
                ]}
              />
            </>
          ) : null}

          {showExcuse ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Did something outside your control stop you filing on time?</p>
              <Chips<TrExcuse>
                label="What stopped you filing on time"
                value={inp.excuse}
                onPick={(v) => set("excuse", v)}
                cols={1}
                options={[
                  { id: "illness", label: "Serious illness or a hospital stay (mine, or someone I care for)" },
                  { id: "death", label: "A death close to me" },
                  { id: "hmrc", label: "HMRC's system, or my login, didn't work" },
                  { id: "post", label: "A letter or code from HMRC never came" },
                  { id: "other", label: "Something else outside my control" },
                  { id: "none", label: "No, I just didn't get to it" },
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? trHeadline(inp, read, today) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Pick the year, say whether HMRC has asked, and where the return has
            got to. The read appears: the date to act by, what each step after
            it adds in pounds, what the January bill really is, and what to
            send.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_TR)} />
    </div>
  );
}

/**
 * The staircase: what filing and paying on each date would add. Drawn to
 * scale against the last step, with today's step marked.
 */
function Stairs({ read, today }: { read: TrRead; today: string }) {
  if (!read.stairs.length) return null;
  const max = Math.max(...read.stairs.map((s) => s.total), 1);
  let here = -1;
  read.stairs.forEach((s, i) => {
    if (s.on <= today) here = i;
  });
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>If the return goes in, and the bill is paid, on</p>
      <ul className="mt-3 space-y-3">
        {read.stairs.map((s, i) => (
          <li key={s.on + s.label} aria-current={i === here ? "step" : undefined}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className={i === here ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}>
                {letterDate(s.on)}
                <span className="text-[var(--muted)]"> · {s.label}</span>
                {i === here ? <span className="ml-2 text-xs font-medium text-[var(--accent)]">you are here</span> : null}
              </span>
              <span className="font-medium tabular-nums text-[var(--foreground)] whitespace-nowrap">
                {s.total < 1 ? "nothing" : `+${pounds(s.total)}`}
              </span>
            </div>
            <div className="mt-1 h-2.5 rounded bg-[var(--border)]/40" aria-hidden>
              <div
                className={`h-2.5 rounded ${i === 0 ? "bg-[var(--accent)]" : "bg-[var(--foreground)]/70"}`}
                style={{ width: `${s.total < 1 ? 1 : Math.max(2, Math.round((s.total / max) * 100))}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        Penalties plus interest, with nothing appealed.
        {read.m ? "" : " Without the tax figure, the 5% steps show as their £300 minimum and the payment ones are left out."}
      </p>
    </div>
  );
}

/** The usual mistake beside the cheap path, in pounds. */
function TwoPaths({ read, today }: { read: TrRead; today: string }) {
  if (read.status !== "early" || !read.m || read.m.january <= 0) return null;
  const plan = fileAndPlan(read, today, 12);
  const wait = waitToFile(read, 6);
  if (!plan) return null;
  const max = Math.max(plan.total, wait.total, 1);
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Can&rsquo;t pay in January? Two ways to go</p>
      <div className="mt-3 space-y-3">
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-[var(--foreground)]">File on time, pay over 12 months on a plan</span>
            <span className="font-medium tabular-nums text-[var(--foreground)] whitespace-nowrap">+{pounds(plan.total)}</span>
          </div>
          <div className="mt-1 h-3 rounded bg-[var(--border)]/40" aria-hidden>
            <div className="h-3 rounded bg-[var(--accent)]" style={{ width: `${Math.max(2, Math.round((plan.total / max) * 100))}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-[var(--foreground)]">Wait to file until you can pay, at the end of July</span>
            <span className="font-medium tabular-nums text-[var(--foreground)] whitespace-nowrap">+{pounds(wait.total)}</span>
          </div>
          <div className="mt-1 h-3 rounded bg-[var(--foreground)]/70" style={{ width: `${Math.max(2, Math.round((wait.total / max) * 100))}%` }} aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        The first is interest only. The second is{" "}
        {wait.lines
          .map((l) => `${l.label.toLowerCase().replace(/^return late: /, "")} (${pounds(l.amount)})`)
          .join(", ")}
        . Same tax, paid by about the same time.
      </p>
    </div>
  );
}

/** January's bill, split into this year's tax and the first payment towards next year. */
function JanuaryBill({ read }: { read: TrRead }) {
  const m = read.m;
  if (!m || m.poa <= 0 || read.status === "done" || read.status === "withdraw" || read.status === "clear") return null;
  const total = m.january;
  const a = Math.round((m.balancing / total) * 100);
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What&rsquo;s due on {letterDate(read.d.payBy)}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--foreground)]">{money(total)}</p>
      <div className="mt-2 flex h-3 rounded overflow-hidden" aria-hidden>
        <div className="bg-[var(--foreground)]/70" style={{ width: `${a}%` }} />
        <div className="bg-[var(--accent)]" style={{ width: `${100 - a}%` }} />
      </div>
      <ul className="mt-3 space-y-1 text-sm text-[var(--foreground)]">
        <li className="flex justify-between gap-3">
          <span>
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--foreground)]/70 mr-2" aria-hidden />
            What&rsquo;s left of {read.label}&rsquo;s tax
          </span>
          <span className="tabular-nums">{money(m.balancing)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span>
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--accent)] mr-2" aria-hidden />
            First payment towards next year
          </span>
          <span className="tabular-nums">{money(m.poa)}</span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        Then another {money(m.poa)} on {letterDate(read.d.july)}.{" "}
        {m.firstYear
          ? "In a first year nothing was paid ahead, so January carries the whole year's tax and half of next year's. From the second year it evens out."
          : "Payments on account are half of this year's tax each, on the assumption next year will be the same."}{" "}
        If you expect next year to be lower, you can ask HMRC to reduce them (online, or form SA303); cut them too far and you pay interest on the difference.
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: TrInputs; read: TrRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = trRule();
  const letters = trLetters(inp, read);
  const reminders = trReminders(read, today);
  const showAdded = (read.status === "late" || read.status === "unpaid" || read.status === "done" || read.status === "plan") && read.now.lines.length > 0;
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{trHeadline(inp, read, today)}</p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{trBody(inp, read, today)}</p>

      {read.actBy && read.actBy >= today ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>
            {read.status === "early" || read.status === "register" ? "File and pay by" : "Before the next step, act by"}
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {actDate(read.actBy)} {read.actBy.slice(0, 4)}
          </p>
          {read.nextAdds > 0.5 ? (
            <p className="mt-1 text-sm text-[var(--muted)]">The day after adds about {pounds(read.nextAdds)}.</p>
          ) : null}
          {reminders.length ? (
            <button type="button" onClick={() => downloadIcs(reminders)} className={`mt-2 ${action}`}>
              Add the dates to your calendar (.ics)
            </button>
          ) : null}
        </div>
      ) : reminders.length ? (
        <button type="button" onClick={() => downloadIcs(reminders)} className={`mt-4 ${action}`}>
          Add the dates to your calendar (.ics)
        </button>
      ) : null}

      {showAdded ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>{read.status === "late" ? "Added so far, if you filed and paid today" : "What being late added"}</p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--foreground)]">
            {read.now.lines.map((l) => (
              <li key={l.label + l.on} className="flex justify-between gap-3">
                <span>{l.label}</span>
                <span className="tabular-nums whitespace-nowrap">{money(l.amount)}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 border-t border-[var(--border)] pt-1.5 font-medium">
              <span>Total</span>
              <span className="tabular-nums whitespace-nowrap">{money(read.now.total)}</span>
            </li>
          </ul>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Interest is an estimate at HMRC&rsquo;s rates; the statement in your HMRC account is the exact figure.
            {read.status === "plan" ? " On a plan, interest runs on each part until it's paid." : ""}
          </p>
        </div>
      ) : null}

      <TwoPaths read={read} today={today} />
      <JanuaryBill read={read} />
      <Stairs read={read} today={today} />

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`tr-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`tr-letter-${l.id}`}
            className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
          >
            {l.text}
          </pre>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(l.text)) ? l.id : "no")}
            className={`mt-3 ${action}`}
          >
            {copied === l.id ? "Copied" : l.id === "plan" ? "Copy the figures" : "Copy the letter"}
          </button>
        </div>
      ))}

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not tax advice. Free help: TaxAid (for people on low incomes who
        can&rsquo;t afford an adviser) and Tax Help for Older People; LITRG
        publishes plain guides. If you can&rsquo;t pay other bills as well,
        National Debtline and StepChange give free debt advice. HMRC never
        texts or emails a link to claim a refund or to pay a penalty.
      </p>

      {read.status !== "clear" && read.status !== "withdraw" ? (
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
              onClick={async () => setCopied((await copyText(trSummary(inp, read, today))) ? "all" : "no")}
              className={action}
            >
              {copied === "all" ? "Copied the whole plan" : "Copy the whole plan as text"}
            </button>
          </div>
          {copied === "no" ? (
            <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words above instead.</p>
          ) : null}
        </div>
      ) : null}
      <Handoffs read={read} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ read }: { read: TrRead }) {
  const list: Handoff[] = [];
  const subject = `Self Assessment ${read.label}`;
  list.push({
    href: withSubject("/scam", "a message from HMRC"),
    label: "A text or email about a tax refund or a penalty?",
    note: "They peak around the deadline. Check it before you click, pay or reply.",
  });
  if (read.status === "early" || read.status === "late" || read.status === "unpaid" || read.status === "plan")
    list.push({
      href: withSubject("/debts", subject),
      label: "Other debts as well?",
      note: "Tax owed to HMRC is a priority debt, ahead of cards and loans. Put the rest side by side.",
    });
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
        <Link href="/writing/file-it-even-if-you-cant-pay" className={link}>
          File it even if you can&rsquo;t pay it
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
function TrExample({ today }: { today: string }) {
  const ex = trExample(today);
  const read = readTr(ex, today);
  if (!read) return null;
  const plan = fileAndPlan(read, today, 12);
  const wait = waitToFile(read, 6);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I went freelance in the {read.label}{" "}tax year. My first return&rsquo;s
        not done, and the tax on it comes to about £4,200. I don&rsquo;t have
        that for January, so my plan was to file in the summer, once
        I&rsquo;d saved it.
      </p>
      <JanuaryBill read={read} />
      <TwoPaths read={read} today={today} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{trHeadline(ex, read, today)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The bill was worse than I thought: {money(read.m?.january ?? 0)}, not
          £4,200, because of the payment towards next year. I filed in
          January anyway and set up a twelve-month plan online before the
          deadline. It cost me about {pounds(plan?.total ?? 0)} in interest. Waiting
          until the summer would have cost about {pounds(wait.total)}, most of
          it penalties for a return that took an evening.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}return.
      </p>
    </div>
  );
}
