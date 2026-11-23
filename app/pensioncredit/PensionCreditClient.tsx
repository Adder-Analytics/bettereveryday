"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  AA_HIGHER,
  AA_LOWER,
  BLANK_PC,
  MG,
  breakdownLines,
  checksOf,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  parsePcInputs,
  pcBody,
  pcExample,
  pcHeadline,
  pcRule,
  pcSummary,
  pounds2,
  readPc,
  remindersOf,
  tilesOf,
  todayISO,
  type Carer,
  type DateLine,
  type Disability,
  type Home,
  type Household,
  type PcInputs,
  type PcRead,
  type Where,
  type Whose,
  type YesNo,
} from "../data/pensioncredit";

/**
 * Pension Credit: could you get it, and what does it unlock? (/pensioncredit)
 *
 * Estimates the weekly award from income, savings and the additions (severe
 * disability, carer, service charges), adds up what any award unlocks, shows
 * what Attendance Allowance would change, and dates the three-month backdating
 * line. Writes the conversation opener, the claim call and the letters.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/pensioncredit.ts` so it can be checked without a browser.
 */

const STORE_KEY = "pensioncredit:v1";

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

function loadInputs(): PcInputs {
  if (typeof window === "undefined") return BLANK_PC;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parsePcInputs(JSON.parse(raw)) : BLANK_PC;
  } catch {
    return BLANK_PC;
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
        `UID:pensioncredit-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/pensioncredit`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Pension Credit")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pension-credit-dates.ics";
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
    <div className="mt-5">
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

export default function PensionCreditClient() {
  const [inp, setInp] = useState<PcInputs>(BLANK_PC);
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

  const set = <K extends keyof PcInputs>(k: K, v: PcInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));
  const read = useMemo(() => readPc(inp, today), [inp, today]);
  const other = inp.whose === "other";
  const couple = inp.household === "couple";
  const you = other ? "they" : "you";
  const your = other ? "their" : "your";
  const both = couple ? " (both added together)" : "";
  const counting = inp.household === "single" || inp.household === "couple";

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
        {showExample ? <PcExample today={today} /> : null}
      </div>

      {/* ---- Who ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>Who it&rsquo;s for</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Is this for you, or someone you help?</p>
        <Chips<Whose>
          label="Whose"
          value={inp.whose}
          onPick={(v) => set("whose", v)}
          options={[
            { id: "mine", label: "Me (or me and my partner)" },
            { id: "other", label: "A parent or relative" },
          ]}
        />
        {other ? (
          <div className="mt-5">
            <label htmlFor="pc-name" className="block text-sm text-[var(--foreground)] mb-2">
              What do you call them? {optional}
            </label>
            <input
              id="pc-name"
              type="text"
              value={inp.name}
              maxLength={30}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Mum"
              className={inputClass}
            />
            <p className={hintCls}>Only used in the messages below.</p>
          </div>
        ) : null}

        <Question>Where {other ? "do they" : "do you"} live?</Question>
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

        <Question>Single, or a couple?</Question>
        <Chips<Household>
          label="Household"
          value={inp.household}
          onPick={(v) => set("household", v)}
          cols={1}
          options={[
            { id: "single", label: "Single, widowed or separated, over State Pension age" },
            { id: "couple", label: "A couple, both over State Pension age" },
            { id: "mixed", label: "A couple, one still under State Pension age" },
          ]}
        />
        <p className={hintCls}>A couple means married, in a civil partnership, or living together as if you were.</p>

        {counting ? (
          <>
            <Question>Did {couple ? "the older of them" : you} reach State Pension age before 6 April 2016?</Question>
            <Chips<YesNo>
              label="Before April 2016"
              value={inp.before2016}
              onPick={(v) => set("before2016", v)}
              options={[
                { id: "yes", label: "Yes, before April 2016" },
                { id: "no", label: "No, since then" },
              ]}
            />
            <p className={hintCls}>
              Roughly: a man born before 6 April 1951, or a woman born before 6 April 1953. It decides whether there&rsquo;s
              Savings Credit, the part for people with a small pension or savings of their own.
            </p>

            <Question>Is {couple ? "either of them" : you === "you" ? "you" : "they"} 75 or over?</Question>
            <Chips<YesNo>
              label="75 or over"
              value={inp.over75}
              onPick={(v) => set("over75", v)}
              options={[
                { id: "no", label: "No" },
                { id: "yes", label: "Yes" },
              ]}
            />
          </>
        ) : null}
      </div>

      {counting ? (
        <div className={card}>
          <p className={eyebrow}>Money coming in</p>
          <MoneyField
            id="pc-sp"
            label={<>State Pension, a week{both}</>}
            value={inp.statePension}
            onChange={(v) => set("statePension", v)}
            placeholder="£184.90"
            hint={`On the annual uprating letter. Full new State Pension is £241.30, full basic £184.90 (2026/27). Paid every four weeks? Divide by four.`}
          />
          <MoneyField
            id="pc-other"
            label={<>Workplace and private pensions, a month, before tax{both} {optional}</>}
            value={inp.otherPension}
            onChange={(v) => set("otherPension", v)}
            placeholder="£150"
            hint="Including a widow's or widower's pension from a late partner's scheme, and annuities."
          />
          <MoneyField
            id="pc-earn"
            label={<>Earnings from work, a week, after tax {optional}</>}
            value={inp.earnings}
            onChange={(v) => set("earnings", v)}
            placeholder="£0"
          />
          <MoneyField
            id="pc-inc"
            label={<>Other income that counts, a week {optional}</>}
            value={inp.otherIncome}
            onChange={(v) => set("otherIncome", v)}
            placeholder="£0"
            hint="Carer's Allowance if it's actually paid, and other taxable benefits. Leave out Attendance Allowance, PIP, DLA, Housing Benefit and Council Tax Reduction: they don't count."
          />
          <MoneyField
            id="pc-sav"
            label={<>Savings and investments{both} {optional}</>}
            value={inp.savings}
            onChange={(v) => set("savings", v)}
            placeholder="£12,000"
            hint="Bank, building society, ISAs, Premium Bonds, shares. Not the home they live in. The first £10,000 is ignored, and there's no upper limit."
          />
        </div>
      ) : null}

      {counting ? (
        <div className={card}>
          <p className={eyebrow}>Health and caring</p>
          <Question>
            Does {couple ? "either of them" : you === "you" ? "you" : "they"} get Attendance Allowance, PIP (daily living) or DLA
            (care, middle or highest)?
          </Question>
          <Chips<Disability>
            label="Disability benefit"
            value={inp.disability}
            onPick={(v) => set("disability", v)}
            cols={couple ? 2 : 1}
            options={
              couple
                ? [
                    { id: "none", label: "No" },
                    { id: "might", label: "No, but one of them needs help with personal care" },
                    { id: "one", label: "Yes, one of them" },
                    { id: "both", label: "Yes, both" },
                  ]
                : [
                    { id: "none", label: "No" },
                    { id: "might", label: `No, but ${you} need help with washing, dressing, stairs or medicines` },
                    { id: "one", label: "Yes" },
                  ]
            }
          />
          <p className={hintCls}>
            Attendance Allowance is {pounds2(AA_LOWER)}{" "}or {pounds2(AA_HIGHER)}{" "}a week, isn&rsquo;t means-tested, and
            doesn&rsquo;t count as income for Pension Credit.
          </p>

          {inp.disability === "one" || inp.disability === "both" || inp.disability === "might" ? (
            <>
              <Question>Does another adult live with {other ? "them" : "you"}, other than a partner?</Question>
              <Chips<YesNo>
                label="Another adult lives in"
                value={inp.othersLiveIn}
                onPick={(v) => set("othersLiveIn", v)}
                options={[
                  { id: "no", label: `No, ${couple ? "just the two of them" : "lives alone"}` },
                  { id: "yes", label: "Yes, a grown-up child or someone else" },
                ]}
              />
              <Question>Is anyone paid Carer&rsquo;s Allowance for looking after {other ? "them" : "you"}?</Question>
              <Chips<YesNo>
                label="Carer paid"
                value={inp.carerPaid}
                onPick={(v) => set("carerPaid", v)}
                options={[
                  { id: "no", label: "No" },
                  { id: "yes", label: "Yes" },
                ]}
              />
            </>
          ) : null}

          <Question>
            Does {couple ? "either of them" : you === "you" ? "you" : "they"} look after someone else for 35 hours a week or more?
          </Question>
          <Chips<Carer>
            label="Caring for someone"
            value={inp.youCare}
            onPick={(v) => set("youCare", v)}
            cols={couple ? 3 : 2}
            options={
              couple
                ? [
                    { id: "none", label: "No" },
                    { id: "one", label: "One of them" },
                    { id: "both", label: "Both" },
                  ]
                : [
                    { id: "none", label: "No" },
                    { id: "one", label: "Yes" },
                  ]
            }
          />
          <p className={hintCls}>
            For someone who gets a disability benefit. Carer&rsquo;s Allowance isn&rsquo;t paid on top of a State Pension, but
            claiming it adds a carer amount to Pension Credit.{" "}
            <Link href="/carers" className={link}>
              More on that
            </Link>
            .
          </p>
        </div>
      ) : null}

      {counting ? (
        <div className={card}>
          <p className={eyebrow}>Home</p>
          <Question>{other ? "Their" : "Your"}{" "}home is&hellip;</Question>
          <Chips<Home>
            label="Home"
            value={inp.home}
            onPick={(v) => set("home", v)}
            options={[
              { id: "owned", label: "Owned outright" },
              { id: "mortgage", label: "Owned, with a mortgage" },
              { id: "rent", label: "Rented" },
              { id: "family", label: "Living with family" },
            ]}
          />
          {inp.home === "owned" || inp.home === "mortgage" ? (
            <MoneyField
              id="pc-sc"
              label={<>Ground rent and service charges, a year {optional}</>}
              value={inp.serviceCharges}
              onChange={(v) => set("serviceCharges", v)}
              placeholder="£0"
              hint="For a leasehold flat. Some service charges are added to the minimum."
            />
          ) : null}
          {inp.home === "rent" ? (
            <MoneyField
              id="pc-rent"
              label={<>Rent, a week {optional}</>}
              value={inp.rent}
              onChange={(v) => set("rent", v)}
              placeholder="£120"
              hint="To count the Housing Benefit that Guarantee Credit brings."
            />
          ) : null}
          {inp.where !== "ni" ? (
            <MoneyField
              id="pc-ct"
              label={<>Council tax, a year {optional}</>}
              value={inp.councilTax}
              onChange={(v) => set("councilTax", v)}
              placeholder="£1,900"
              hint="Before any discount. To count the Council Tax Reduction that Guarantee Credit usually brings."
            />
          ) : null}
        </div>
      ) : null}

      <AnnounceAnswer message={read ? pcHeadline(read) : null} />
      {read ? (
        <ReadBlock read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer who it&rsquo;s for, the State Pension figure, and the health question. The read appears: whether{" "}
            {your} income is under the minimum ({pounds2(MG.single)}{" "}a week single, {pounds2(MG.couple)}{" "}a couple), what it
            would pay, what it unlocks, and how far back a claim made today can reach.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_PC)} />
    </div>
  );
}

function Breakdown({ read }: { read: PcRead }) {
  const lines = breakdownLines(read);
  if (!lines.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>How it&rsquo;s worked out, a week</p>
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
          <span className="text-[var(--foreground)] font-semibold">
            {read.calc.total > 0 ? "Pension Credit, a week" : "Over the minimum by"}
          </span>
          <span className="shrink-0 tabular-nums font-semibold text-[var(--accent)]">
            {pounds2(read.calc.total > 0 ? read.calc.total : read.shortBy)}
          </span>
        </li>
      </ul>
      {read.calc.savings > 0 ? (
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Includes {pounds2(read.calc.savings)}{" "}of Savings Credit: 60p for each pound of income over the threshold, up to a
          maximum, less 40p for each pound over the minimum.
        </p>
      ) : null}
    </div>
  );
}

function Tiles({ read }: { read: PcRead }) {
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

function Unlocks({ read }: { read: PcRead }) {
  if (!read.unlocks.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What the award unlocks</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {read.unlocks.map((u) => (
          <li key={u.id} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--foreground)]">{u.label}</span>
              <span className="block text-xs text-[var(--muted)]">{u.note}</span>
            </span>
            <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">
              {u.value ? `${money(u.value)}/yr` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadBlock({ read, today }: { read: PcRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = pcRule(read);
  const msgs = messagesOf(read);
  const reminders = remindersOf(read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{pcHeadline(read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{pcBody(read)}</p>

      <Tiles read={read} />
      <Breakdown read={read} />
      <Unlocks read={read} />

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
          <p className={eyebrow} id={`pc-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`pc-msg-${m.id}`}
            className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
          >
            {m.text}
          </pre>
          <button type="button" onClick={async () => setCopied((await copyText(m.text)) ? m.id : "no")} className={`mt-3 ${action}`}>
            {copied === m.id ? "Copied" : "Copy it"}
          </button>
        </div>
      ))}

      {read.verdict !== "no" && read.verdict !== "mixed" ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>What to keep together</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {keepList(read).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        2026/27 figures. An estimate from what you entered: it doesn&rsquo;t model children, mortgage interest or every
        disregard, and the DWP makes the decision. Age UK (0800 678 1602), Independent Age and Citizens Advice can do a full
        benefits check for free.
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
            onClick={async () => setCopied((await copyText(pcSummary(read, today))) ? "all" : "no")}
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
      label: "Pension Credit or Attendance Allowance refused?",
      note: "A decision is a first draft: ask for a mandatory reconsideration within a month.",
    },
    {
      href: "/counciltax",
      label: "Behind on council tax, or the bill counts the wrong people?",
      note: "Check the discounts, including the one for severe mental impairment, and keep the instalments.",
    },
    {
      href: "/lpa",
      label: "Helping a parent with forms and money?",
      note: "Nobody can sign for them without a power of attorney. Check the window is still open.",
    },
    {
      href: "/carers",
      label: "Caring for them 35 hours a week?",
      note: "Carer's Allowance, and the severe disability amount it can cost them.",
    },
    {
      href: "/statepension",
      label: "Not at State Pension age yet?",
      note: "Fill the gaps in your National Insurance record while you still can.",
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
        <Link href="/writing/the-key-not-the-coin" className={link}>
          The key, not the coin
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function PcExample({ today }: { today: string }) {
  const read = readPc(pcExample(), today);
  if (!read || !read.withAa || read.yearValueWithAa === null) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Pat is 78, widowed, and lives alone in the house they&rsquo;ve owned for forty years. The State Pension comes to
        £219.90 a week, an old workplace pension pays £150 a month, and there&rsquo;s £12,600 in the building society.
        &ldquo;I&rsquo;m not poor, I own my house,&rdquo; Pat says. But the stairs are getting hard, and Pat needs help
        getting in and out of the bath.
      </p>
      <Breakdown read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{pcHeadline(read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The house doesn&rsquo;t count, and the savings count as only £6 a week. Pat is just over the minimum, but reached
          State Pension age before 2016, so there&rsquo;s Savings Credit of {pounds2(read.calc.total)}{" "}a week. Small, but
          it makes the £180 TV licence free and brings the £150 Warm Home Discount: about {money(read.yearValue)}{" "}a year in
          all.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The bigger number is the one nobody mentioned. Help with the bath is exactly what Attendance Allowance is for, and
          it isn&rsquo;t counted as income. For someone living alone, it adds £86.05 a week to the minimum. Pension Credit
          becomes {pounds2(read.withAa.total)}{" "}a week, the Guarantee Credit takes the council tax to nothing, and with the
          allowance itself that&rsquo;s about <span className="font-semibold">{money(read.yearValueWithAa)}</span>{" "}a year.
          So: claim Pension Credit now, backdated three months, and Attendance Allowance this week. When the allowance is
          awarded, tell the Pension Service, and the extra amount is added.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}figures.
      </p>
    </div>
  );
}
