"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_CARERS,
  LIMIT,
  NLW,
  PERIOD_NAME,
  RATE,
  breakdownLines,
  carersBody,
  carersExample,
  carersExampleOffer,
  carersHeadline,
  carersRule,
  carersSummary,
  checksOf,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  parseCarersInputs,
  pounds2,
  readCarers,
  remindersOf,
  tilesOf,
  todayISO,
  type CarersInputs,
  type CarersRead,
  type DateLine,
  type Freq,
  type Hours,
  type PensionType,
  type Qualifying,
  type Unsure,
  type Where,
  type Work,
  type YesNo,
} from "../data/carers";

/**
 * Carer's Allowance: can you get it, and can you earn this? (/carers)
 *
 * Works out earnings the way the Carer's Allowance test counts them (after
 * tax, NI, half of pension contributions, expenses and care costs), reads them
 * against the £204 weekly cliff, and shows the headroom, the ways back under,
 * and the band where extra pay leaves you worse off.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/carers.ts` so it can be checked without a browser.
 */

const STORE_KEY = "carers:v1";

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

function loadInputs(): CarersInputs {
  if (typeof window === "undefined") return BLANK_CARERS;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseCarersInputs(JSON.parse(raw)) : BLANK_CARERS;
  } catch {
    return BLANK_CARERS;
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
        `UID:carers-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/carers`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Carer's Allowance")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "carers-allowance-dates.ics";
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

export default function CarersClient() {
  const [inp, setInp] = useState<CarersInputs>(BLANK_CARERS);
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

  const set = <K extends keyof CarersInputs>(k: K, v: CarersInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));
  const read = useMemo(() => readCarers(inp), [inp]);
  const period = inp.freq ? PERIOD_NAME[inp.freq] : "pay period";
  const caring = inp.hours === "35" && inp.qualifying !== "no" && inp.qualifying !== "";

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
        {showExample ? <CarersExample /> : null}
      </div>

      {/* ---- The caring ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>The caring</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">How many hours a week do you care for one person?</p>
        <Chips<Hours>
          label="Hours of care"
          value={inp.hours}
          onPick={(v) => set("hours", v)}
          cols={3}
          options={[
            { id: "35", label: "35 or more" },
            { id: "20", label: "20 to 34" },
            { id: "under", label: "Under 20" },
          ]}
        />
        <p className={hintCls}>
          Count it all: personal care, meals, medicines, appointments, nights, supervision, travelling to them, paperwork.
        </p>

        <Question>Do they get a disability benefit?</Question>
        <Chips<Qualifying>
          label="Their benefit"
          value={inp.qualifying}
          onPick={(v) => set("qualifying", v)}
          cols={3}
          options={[
            { id: "yes", label: "Yes" },
            { id: "waiting", label: "Claimed, waiting" },
            { id: "no", label: "No" },
          ]}
        />
        <p className={hintCls}>
          PIP daily living (either rate), Attendance Allowance, DLA middle or highest care, Adult or Child Disability Payment
          in Scotland, Armed Forces Independence Payment, or Constant Attendance Allowance.
        </p>

        {caring ? (
          <>
            <Question>Where do you live?</Question>
            <Chips<Where>
              label="Where"
              value={inp.where}
              onPick={(v) => set("where", v)}
              cols={3}
              options={[
                { id: "ew", label: "England or Wales" },
                { id: "scotland", label: "Scotland" },
                { id: "ni", label: "Northern Ireland" },
              ]}
            />
            <Question>In full-time education (21 hours or more a week)?</Question>
            <Chips<YesNo>
              label="Full-time education"
              value={inp.student}
              onPick={(v) => set("student", v)}
              options={[
                { id: "no", label: "No" },
                { id: "yes", label: "Yes" },
              ]}
            />
            <Question>Do you get a State Pension?</Question>
            <Chips<YesNo>
              label="State Pension"
              value={inp.statePension}
              onPick={(v) => set("statePension", v)}
              options={[
                { id: "no", label: "No" },
                { id: "yes", label: "Yes" },
              ]}
            />
            <Question>Do you get Universal Credit?</Question>
            <Chips<YesNo>
              label="Universal Credit"
              value={inp.uc}
              onPick={(v) => set("uc", v)}
              options={[
                { id: "no", label: "No" },
                { id: "yes", label: "Yes" },
              ]}
            />
            <Question>
              Does the person you care for get Pension Credit, Housing Benefit, income-related ESA or Income Support?
            </Question>
            <Chips<Unsure>
              label="Their means-tested benefits"
              value={inp.caredMeansTested}
              onPick={(v) => set("caredMeansTested", v)}
              cols={3}
              options={[
                { id: "no", label: "No" },
                { id: "unsure", label: "Not sure" },
                { id: "yes", label: "Yes" },
              ]}
            />
            <p className={hintCls}>This matters for them, not you: your claim can cost them a premium.</p>
          </>
        ) : null}
      </div>

      {/* ---- Your work ---- */}
      {caring ? (
        <div className={card}>
          <p className={eyebrow}>Your work</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Do you work?</p>
          <Chips<Work>
            label="Work"
            value={inp.work}
            onPick={(v) => set("work", v)}
            cols={3}
            options={[
              { id: "none", label: "No" },
              { id: "employed", label: "Employed" },
              { id: "self", label: "Self-employed" },
            ]}
          />

          {inp.work === "employed" ? (
            <div className="mt-2">
              <Question>How often are you paid?</Question>
              <Chips<Freq>
                label="Pay frequency"
                value={inp.freq}
                onPick={(v) => set("freq", v)}
                options={[
                  { id: "weekly", label: "Weekly" },
                  { id: "fortnightly", label: "Fortnightly" },
                  { id: "fourweekly", label: "Every four weeks" },
                  { id: "monthly", label: "Monthly" },
                ]}
              />
              <div className="mt-5 space-y-4">
                <MoneyField
                  id="ca-gross"
                  label={`Gross pay for a normal ${period}`}
                  value={inp.gross}
                  onChange={(v) => set("gross", v)}
                  placeholder="£881.23"
                  hint="Before tax, from your payslip. Overtime and bonuses count in the period they're paid."
                />
                <MoneyField
                  id="ca-pension"
                  label={<>What you pay into a pension each {period} {optional}</>}
                  value={inp.pension}
                  onChange={(v) => set("pension", v)}
                  placeholder="£18.06"
                  hint="Your own contribution, not your employer's."
                />
                {inp.pension.trim() ? (
                  <Chips<PensionType>
                    label="Pension type"
                    value={inp.pensionType}
                    onPick={(v) => set("pensionType", v)}
                    options={[
                      { id: "normal", label: "Taken from my pay" },
                      { id: "sacrifice", label: "Salary sacrifice (gross is already lower)" },
                    ]}
                  />
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MoneyField
                    id="ca-tax"
                    label={<>Income tax each {period} {optional}</>}
                    value={inp.tax}
                    onChange={(v) => set("tax", v)}
                    placeholder="£0"
                  />
                  <MoneyField
                    id="ca-ni"
                    label={<>National Insurance each {period} {optional}</>}
                    value={inp.ni}
                    onChange={(v) => set("ni", v)}
                    placeholder="£0"
                  />
                </div>
                <p className="-mt-2 text-xs text-[var(--muted)] leading-relaxed">
                  Blank, and they&rsquo;re estimated for a standard tax code. Below about £242 a week there&rsquo;s neither.
                </p>
                <MoneyField
                  id="ca-expenses"
                  label={<>Work expenses you pay yourself, each {period} {optional}</>}
                  value={inp.expenses}
                  onChange={(v) => set("expenses", v)}
                  placeholder="£10"
                  hint="Things you need only to do the job: uniform, tools, a union fee. Not getting to work."
                />
                <MoneyField
                  id="ca-hourly"
                  label={<>Your hourly rate {optional}</>}
                  value={inp.hourly}
                  onChange={(v) => set("hourly", v)}
                  placeholder={`£${NLW.toFixed(2)}`}
                  hint="To put the answer in hours."
                />
              </div>
              <Question>Does your pay go up and down?</Question>
              <Chips<YesNo>
                label="Pay varies"
                value={inp.varies}
                onPick={(v) => set("varies", v)}
                options={[
                  { id: "no", label: "No, about the same" },
                  { id: "yes", label: "Yes: overtime, shifts, bonuses" },
                ]}
              />
              {inp.varies === "yes" ? (
                <div className="mt-4">
                  <MoneyField
                    id="ca-highest"
                    label={<>Your biggest gross pay in one {period} recently {optional}</>}
                    value={inp.highest}
                    onChange={(v) => set("highest", v)}
                    placeholder="£1,100"
                    hint="Or the one you're expecting, like December."
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {inp.work === "self" ? (
            <div className="mt-5 space-y-4">
              <MoneyField
                id="ca-profit"
                label="Your profit for a year"
                value={inp.profit}
                onChange={(v) => set("profit", v)}
                placeholder="£11,000"
                hint="Takings less allowable business expenses, from your last accounts or tax return."
              />
              <MoneyField
                id="ca-selfpension"
                label={<>What you pay into a pension in a year {optional}</>}
                value={inp.selfPension}
                onChange={(v) => set("selfPension", v)}
                placeholder="£600"
              />
            </div>
          ) : null}

          {inp.work === "employed" || inp.work === "self" ? (
            <div className="mt-4">
              <MoneyField
                id="ca-care"
                label={<>Care you pay for while you work, a week {optional}</>}
                value={inp.care}
                onChange={(v) => set("care", v)}
                placeholder="£40"
                hint="For the person you care for, or a child under 16, paid to someone who isn't a close relative. Up to half your earnings can come off."
              />
            </div>
          ) : null}

          <Question>Have you had a letter saying you were overpaid?</Question>
          <Chips<YesNo>
            label="Overpayment letter"
            value={inp.overpaid}
            onPick={(v) => set("overpaid", v)}
            options={[
              { id: "no", label: "No" },
              { id: "yes", label: "Yes" },
            ]}
          />
        </div>
      ) : null}

      <AnnounceAnswer message={read ? carersHeadline(read) : null} />
      {read ? (
        <ReadBlock read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer the questions about the caring, then your work. The read appears: whether you can get it, how your
            earnings count against £{LIMIT} a week, how much room you have, and what to send.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_CARERS)} />
    </div>
  );
}

function Breakdown({ read }: { read: CarersRead }) {
  const lines = breakdownLines(read);
  if (!lines.length) return null;
  const over = read.headroom < 0;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>How your earnings are counted, a week</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {lines.map((l) => (
          <li key={l.label} className="py-2 flex items-baseline justify-between gap-4 text-sm">
            <span className="text-[var(--foreground)]">{l.label}</span>
            <span className="shrink-0 tabular-nums text-[var(--foreground)]">
              {l.minus ? "− " : ""}
              {l.value}
            </span>
          </li>
        ))}
        <li className="py-2 flex items-baseline justify-between gap-4 text-sm">
          <span className="text-[var(--foreground)] font-semibold">Counted against the £{LIMIT} limit</span>
          <span className={`shrink-0 tabular-nums font-semibold ${over ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
            {pounds2(read.counted)}
          </span>
        </li>
      </ul>
      {read.work === "employed" && read.freq === "monthly" ? (
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">Monthly pay is turned into a weekly figure: × 12 ÷ 52.</p>
      ) : null}
      {read.highestCounted !== null ? (
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          {read.highestCost ? (
            <>
              Your biggest {PERIOD_NAME[read.freq]} counts as {pounds2(read.highestCounted)}{" "}a week: over. On its own, that
              pay would cost about <span className="font-semibold">{money(read.highestCost)}</span>{" "}of Carer&rsquo;s
              Allowance, unless it&rsquo;s averaged with your normal pay.
            </>
          ) : (
            <>
              Your biggest {PERIOD_NAME[read.freq]} counts as {pounds2(read.highestCounted)}{" "}a week: still under.
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

function Tiles({ read }: { read: CarersRead }) {
  const tiles = tilesOf(read);
  if (!tiles.length || read.work === "none") return null;
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

function ReadBlock({ read, today }: { read: CarersRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = carersRule(read);
  const msgs = messagesOf(read);
  const reminders = remindersOf(read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{carersHeadline(read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{carersBody(read)}</p>

      <Tiles read={read} />
      <Breakdown read={read} />

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
                  {r.on === today ? "Today" : letterDate(r.on)}
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
          <p className={eyebrow} id={`ca-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`ca-msg-${m.id}`}
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
        2026/27 figures: £{RATE.toFixed(2)}{" "}a week, earnings limit £{LIMIT}{" "}a week. The DWP makes the decision, and
        this isn&rsquo;t advice. Carers UK (0808 808 7777) and Citizens Advice can do a full benefits check for you and the
        person you care for.
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
            onClick={async () => setCopied((await copyText(carersSummary(read, today))) ? "all" : "no")}
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
      href: "/challenge",
      label: "Their PIP or Attendance Allowance refused, or your overpayment decision wrong?",
      note: "A decision is a first draft: challenge it within a month.",
    },
    {
      href: "/statepension",
      label: "Years out of work to care?",
      note: "Check your National Insurance record: Carer's Allowance and Carer's Credit fill years for free.",
    },
    {
      href: "/counciltax",
      label: "Living with the person you care for?",
      note: "A carer can be left out of the council tax count, and their bill may qualify for a discount.",
    },
    {
      href: "/taxcode",
      label: "Tax on your payslip looks wrong?",
      note: "Carer's Allowance is taxable, and HMRC sometimes collects it through your code.",
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
        <Link href="/writing/the-pound-that-costs-86" className={link}>
          The pound that costs £86
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function CarersExample() {
  const read = readCarers(carersExample());
  const offer = readCarers(carersExampleOffer());
  if (!read || !offer || !offer.breakdown) return null;
  // What he keeps a week now (pay less pension, plus the allowance) and on 20 hours (no allowance).
  const keepNow = (881.23 * 12) / 52 - (18.06 * 12) / 52 + RATE;
  const keepOffer = offer.breakdown.gross - offer.breakdown.tax - offer.breakdown.ni - (29.08 * 12) / 52;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I look after my mum, who gets Attendance Allowance, and I work 16 hours a week on the tills at £12.71 an hour,
        paid monthly: £881.23. Five per cent of my qualifying earnings goes into the workplace pension. In December I&rsquo;ll
        do overtime and get about £1,100. And my manager has offered me 20 hours a week from January.
      </p>
      <Breakdown read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{carersHeadline(read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The limit is set at 16 hours at the minimum wage, so I&rsquo;m under, but only just: most of my headroom is the
          half of my pension contribution that comes off. The December overtime would cost me about {money(read.highestCost ?? 0)}{" "}of Carer&rsquo;s Allowance for
          about {money(1100 - 881.23)}{" "}of extra pay, so I&rsquo;ll turn it down or ask for it to be spread. And the 20
          hours: my earnings would count as {pounds2(offer.counted)}{" "}a week, so I&rsquo;d lose the allowance and keep
          about {money(keepNow - keepOffer)}{" "}a week <em>less</em>{" "}than now, for four more hours of work. I&rsquo;d need
          about {money(offer.breakEvenGross ?? 0)}{" "}a week, around {Math.ceil((offer.breakEvenGross ?? 0) / NLW)}{" "}hours, before
          more work paid.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}pay.
      </p>
    </div>
  );
}
