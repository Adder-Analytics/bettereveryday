"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_REMORTGAGE,
  datesOf,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  parseRemortgageInputs,
  pct,
  rateInvalid,
  readRemortgage,
  remindersOf,
  remortgageBody,
  remortgageExample,
  remortgageHeadline,
  remortgageRule,
  remortgageSummary,
  todayISO,
  yearsInvalid,
  type DateLine,
  type DealYears,
  type RemortgageInputs,
  type RemortgageRead,
  type Repay,
  type Status,
  type YesNo,
} from "../data/remortgage";

/**
 * Fixed rate ending: what does waiting cost, and by when? (/remortgage)
 *
 * When a fixed-rate mortgage ends, the loan moves to the lender's reversion
 * rate until the borrower picks something else. The tool prices a month on
 * that rate against the borrower's own offers, dates the bookings (the
 * Mortgage Charter's six months with the same lender; about three for a new
 * one), compares the offers over the deal with fees counted, checks the
 * loan-to-value band, and writes the messages to the lender.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/remortgage.ts` so it can be checked without a browser.
 */

const STORE_KEY = "remortgage:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase = "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff = "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow = "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card = "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const link = "text-[var(--accent)] hover:opacity-70 transition-opacity";
const action = "text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity";

function loadInputs(): RemortgageInputs {
  if (typeof window === "undefined") return BLANK_REMORTGAGE;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseRemortgageInputs(JSON.parse(raw)) : BLANK_REMORTGAGE;
  } catch {
    return BLANK_REMORTGAGE;
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
        `UID:remortgage-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/remortgage`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Fixed rate ending")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mortgage-dates.ics";
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

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  bad,
  badText,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  bad: boolean;
  badText: string;
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
  return <Field {...props} bad={rateInvalid(props.value)} badText={`A rate as a percentage, like ${props.placeholder}.`} />;
}

const optional = <span className="text-[var(--muted)]">(optional)</span>;

export default function RemortgageClient() {
  const [inp, setInp] = useState<RemortgageInputs>(BLANK_REMORTGAGE);
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

  const set = <K extends keyof RemortgageInputs>(k: K, v: RemortgageInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readRemortgage(inp, today), [inp, today]);

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
        {showExample ? <RemortgageExample today={today} /> : null}
      </div>

      {/* ---- The mortgage ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>The mortgage</p>
        <div className="mt-3">
          <label htmlFor="rm-end" className="block text-sm text-[var(--foreground)] mb-2">
            The date the fixed rate ends
          </label>
          <input id="rm-end" type="date" value={inp.endDate} onChange={(e) => set("endDate", e.target.value)} className={inputClass} />
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            On the annual statement, the offer letter or the lender&rsquo;s app. The last day of the deal.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MoneyField
            id="rm-balance"
            label="What you'll owe when it ends"
            value={inp.balance}
            onChange={(v) => set("balance", v)}
            placeholder="£186,000"
            hint="Today's balance is close enough."
          />
          <Field
            id="rm-years"
            label="Years left on the mortgage"
            value={inp.years}
            onChange={(v) => set("years", v)}
            placeholder="23"
            bad={yearsInvalid(inp.years)}
            badText="A number of years, like 23 or 18.5."
          />
          <RateField id="rm-rate" label="Your fixed rate now" value={inp.rate} onChange={(v) => set("rate", v)} placeholder="1.89%" />
          <RateField
            id="rm-svr"
            label={<>The lender&rsquo;s reversion rate {optional}</>}
            value={inp.svr}
            onChange={(v) => set("svr", v)}
            placeholder="7.24%"
            hint="Called the standard variable rate (SVR) or follow-on rate. Without it, a typical 7.1% is used."
          />
        </div>
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How is it paid?</p>
        <Chips<Repay>
          label="Repayment type"
          value={inp.repay}
          onPick={(v) => set("repay", v)}
          options={[
            { id: "repayment", label: "Repayment (capital and interest)" },
            { id: "io", label: "Interest-only" },
          ]}
        />
        <div className="mt-5">
          <MoneyField
            id="rm-value"
            label={<>What the home is worth, roughly {optional}</>}
            value={inp.value}
            onChange={(v) => set("value", v)}
            placeholder="£245,000"
            hint="Only used for the loan-to-value band, which sets the rates you're offered."
          />
        </div>
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Are you up to date with the payments?</p>
        <Chips<YesNo>
          label="Up to date"
          value={inp.upToDate}
          onPick={(v) => set("upToDate", v)}
          options={[
            { id: "yes", label: "Yes" },
            { id: "no", label: "No, I'm behind" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where are you with the next deal?</p>
        <Chips<Status>
          label="Next deal"
          value={inp.status}
          onPick={(v) => set("status", v)}
          cols={1}
          options={[
            { id: "nothing", label: "Haven't done anything yet" },
            { id: "applying", label: "Applying to another lender" },
            { id: "booked", label: "Booked a new deal with my lender" },
          ]}
        />
      </div>

      {/* ---- The offers ---- */}
      <div className={card}>
        <p className={eyebrow}>The offers {optional}</p>
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Your lender&rsquo;s app usually shows its product transfer rates from about six months before; a broker can
          quote other lenders. Leave either blank.
        </p>
        <p className="mt-4 text-sm font-medium text-[var(--foreground)]">Your lender (a product transfer)</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RateField id="rm-pt-rate" label="Rate" value={inp.ptRate} onChange={(v) => set("ptRate", v)} placeholder="4.79%" />
          <MoneyField id="rm-pt-fee" label="Fee" value={inp.ptFee} onChange={(v) => set("ptFee", v)} placeholder="£999" />
        </div>
        <p className="mt-5 text-sm font-medium text-[var(--foreground)]">Another lender (a remortgage)</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RateField id="rm-rm-rate" label="Rate" value={inp.rmRate} onChange={(v) => set("rmRate", v)} placeholder="4.49%" />
          <MoneyField id="rm-rm-fee" label="Fee" value={inp.rmFee} onChange={(v) => set("rmFee", v)} placeholder="£1,499" />
          <MoneyField
            id="rm-rm-costs"
            label="Other costs"
            value={inp.rmCosts}
            onChange={(v) => set("rmCosts", v)}
            placeholder="£0"
            hint="Legal or valuation, if not free; a broker's fee."
          />
        </div>
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Length of deal you&rsquo;re comparing</p>
        <Chips<DealYears>
          label="Deal length"
          value={inp.dealYears || "2"}
          onPick={(v) => set("dealYears", v)}
          cols={3}
          options={[
            { id: "2", label: "2 years" },
            { id: "3", label: "3 years" },
            { id: "5", label: "5 years" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">The fees</p>
        <Chips<YesNo>
          label="Fees"
          value={inp.feeAdded || "no"}
          onPick={(v) => set("feeAdded", v)}
          options={[
            { id: "no", label: "Paid upfront" },
            { id: "yes", label: "Added to the loan" },
          ]}
        />
      </div>

      <AnnounceAnswer message={read ? remortgageHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give the date the fix ends, what you owe, the years left, your rate and how it&rsquo;s paid. The read
            appears: what a month on the reversion rate costs, the dates to book by, and your offers side by side.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_REMORTGAGE)} />
    </div>
  );
}

/** The offers and the reversion rate, side by side over the deal. */
function Options({ read }: { read: RemortgageRead }) {
  const svr = read.options.find((o) => o.id === "svr")!;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Over {read.horizon / 12} years, interest and fees</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {read.options.map((o) => (
          <li key={o.id} className="py-2.5 text-sm">
            <span className="flex items-baseline justify-between gap-4">
              <span className={o.id === "svr" ? "text-[var(--accent)] font-semibold" : "text-[var(--foreground)] font-medium"}>
                {o.label}
                {o.best && read.options.length > 2 ? " (cheapest)" : ""}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--foreground)]">{money(o.cost)}</span>
            </span>
            <span className="block text-xs text-[var(--muted)] leading-relaxed">
              {pct(o.rate)}, about {money(o.pay)} a month
              {o.fee ? `, ${money(o.fee)} in fees` : ""}
              {o.feeInterest >= 1 ? ` (adding the fee to the loan costs ${money(o.feeInterest)} more in interest over the deal)` : ""}
              {o.id !== "svr" ? `. Saves ${money(svr.cost - o.cost)} against ${read.horizon / 12} years on the reversion rate.` : ". The rate nobody chose."}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        The capital you repay is yours either way, so the comparison is what you pay to borrow: interest plus fees. The
        reversion rate can change at any time; this holds it where it is.
      </p>
    </div>
  );
}

/** What each month costs, and the payment now against later. */
function Tiles({ read }: { read: RemortgageRead }) {
  const tiles = [
    { label: "Payment now", value: money(read.currentPay), note: `a month at ${pct(read.rate)}` },
    {
      label: read.best ? "On the cheapest offer" : "On the reversion rate",
      value: money(read.best ? read.best.pay : read.svrPay),
      note: `a month at ${pct(read.best ? read.best.rate : read.svr)}`,
    },
    {
      label: "A month on the reversion rate",
      value: money(read.monthlyCost),
      note: read.best ? "more in interest than the cheapest offer" : `more in interest than ${pct(read.rate)}`,
    },
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

/** If the new payment is a stretch: the two Charter levers, priced. */
function Stretch({ read }: { read: RemortgageRead }) {
  if (!read.extended) return null;
  const e = read.extended;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>If the new payment is too much</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        <li className="py-2.5 text-sm">
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-[var(--foreground)] font-medium">{e.years} more years on the term</span>
            <span className="shrink-0 font-medium tabular-nums text-[var(--foreground)]">{money(e.pay)} a month</span>
          </span>
          <span className="block text-xs text-[var(--muted)] leading-relaxed">
            About {money(e.extraInterest)} more interest over the life of the loan if it stays that way. You can usually
            shorten it again later, or overpay.
          </span>
        </li>
        <li className="py-2.5 text-sm">
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-[var(--foreground)] font-medium">Interest-only for six months</span>
            <span className="shrink-0 font-medium tabular-nums text-[var(--foreground)]">{money(read.ioPay)} a month</span>
          </span>
          <span className="block text-xs text-[var(--muted)] leading-relaxed">
            The balance doesn&rsquo;t fall for those months, so later payments are a little higher. One-off help.
          </span>
        </li>
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        Under the Mortgage Charter, if you&rsquo;re up to date, your lender will make either change without a new
        affordability check or a mark on your credit file, and let you switch back within six months. Free advice:
        MoneyHelper, or StepChange if you&rsquo;re already behind.
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: RemortgageInputs; read: RemortgageRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = remortgageRule(inp, read);
  const msgs = messagesOf(inp, read);
  const reminders = remindersOf(inp, read, today);
  const dates = datesOf(inp, read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{remortgageHeadline(inp, read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{remortgageBody(inp, read)}</p>

      <Tiles read={read} />
      <Options read={read} />
      <Stretch read={read} />

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>The dates</p>
        <ul className="mt-3 divide-y divide-[var(--border)]">
          {dates.map((r) => (
            <li key={`${r.on}-${r.title}`} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
              <span className="min-w-0">
                <span className={r.on < today ? "text-[var(--muted)]" : "text-[var(--foreground)]"}>{r.title}</span>
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
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Rates rose in November 2026, when the Bank of England put Bank Rate up to 4%. Booking early locks today&rsquo;s
          rate; if your lender&rsquo;s fall before the deal starts, ask to move to the lower one.
        </p>
      </div>

      {msgs.map((m) => (
        <div key={m.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`rm-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`rm-msg-${m.id}`}
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
        Not financial advice. A broker can see deals your lender&rsquo;s app doesn&rsquo;t, and many charge nothing to
        you. Your lender will never ask you to move money to a &ldquo;safe account&rdquo;, and a message about your
        mortgage that asks for card details or a code is a scam: ring the number on your statement.
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
            onClick={async () => setCopied((await copyText(remortgageSummary(inp, read, today))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole plan" : "Copy the whole plan as text"}
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
      href: "/bills",
      label: "Sharing the mortgage with a partner?",
      note: "A payment that jumps by a few hundred pounds is the moment to rework who pays what.",
    },
    {
      href: "/keep",
      label: "Need to find the extra each month?",
      note: "The quickest money is usually a subscription you'd not sign up for today.",
    },
    {
      href: "/debts",
      label: "Other debts on top?",
      note: "Put the spare money on one at a time, never spread, and see what each order costs.",
    },
    {
      href: "/scam",
      label: "A message about your mortgage wants money?",
      note: "Check it before you pay anything.",
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
        <Link href="/writing/the-rate-nobody-chose" className={link}>
          The rate nobody chose
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function RemortgageExample({ today }: { today: string }) {
  const ex = remortgageExample(today);
  const read = readRemortgage(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        We fixed at 1.89% for five years in 2021, and it ends on {letterDate(ex.endDate)}. We owe £186,000 with 23
        years to go. The bank&rsquo;s app is offering 4.79% with a £999 fee; a broker found 4.49% elsewhere for
        £1,499. We were going to deal with it after Christmas.
      </p>
      <Options read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{remortgageHeadline(ex, read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The bigger fee was worth it: the cheaper rate saved more than the extra £500 over two years. We booked the
          bank&rsquo;s deal that day as a fallback and applied through the broker before {letterDate(read.applyBy)}.
          We also paid {money(read.band?.cut ?? 0)} off from savings, which took us from{" "}
          {pct(Math.round((read.band?.ltv ?? 0) * 10) / 10)} to {read.band?.next}% loan-to-value, and the broker
          re-quoted. The payment still goes up by {money(read.shock)}{" "}a month, so the budget changed in January,
          not April.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}mortgage.
      </p>
    </div>
  );
}
