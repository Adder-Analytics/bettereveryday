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
  BLANK_EN,
  CAP_JAN,
  CAP_NOW,
  EN_EXAMPLE,
  WHO_OPTIONS,
  actDate,
  enBody,
  enHeadline,
  enLetters,
  enMoneyIn,
  enProtections,
  enReminders,
  enRule,
  enSummary,
  isISODate,
  money,
  parseEnInputs,
  readEnergy,
  todayISO,
  type EnInputs,
  type EnMeter,
  type EnOld,
  type EnRead,
  type EnRegion,
  type EnStage,
  type EnWho,
} from "../data/energy";

/**
 * Behind on energy bills: what can they do, and what do you offer? (/energy)
 *
 * The instrument for energy arrears and prepayment trouble in Great Britain.
 * The call turns on two things the supplier's letter leaves out: the supplier
 * has to take ability to pay into account, so the person who writes first with
 * a number usually sets it; and some households can't have a prepayment meter
 * forced on them at all. The tool reads the stage, flags the protections the
 * household falls into, lists the winter money it may be missing, and writes
 * the letter.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/energy.ts` so it can be checked without a browser.
 */

const STORE_KEY = "energy:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase = "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff = "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow = "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card = "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const link = "text-[var(--accent)] hover:opacity-70 transition-opacity";
const action = "text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity";
const MONEY_BAD = "Couldn't read that as an amount. Try something like £640.";

function loadInputs(): EnInputs {
  if (typeof window === "undefined") return BLANK_EN;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseEnInputs(JSON.parse(raw)) : BLANK_EN;
  } catch {
    return BLANK_EN;
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
        `UID:energy-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/energy`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Energy bills")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-${list[0].on}.ics`;
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
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-2">
        {label} <span className="text-[var(--muted)]">(optional)</span>
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

const CREDIT_OPTIONS: { id: EnStage; label: string }[] = [
  { id: "worried", label: "I'm not behind yet, but I'm worried about January" },
  { id: "behind", label: "I'm behind, but no serious letters yet" },
  { id: "demand", label: "A final demand, or a debt collector's letter" },
  { id: "warrant", label: "A letter about fitting a prepayment meter, or a warrant" },
];
const PREPAY_OPTIONS: { id: EnStage; label: string }[] = [
  { id: "offsupply", label: "I can't keep it topped up; we're going without" },
  { id: "deductions", label: "Too much of each top-up goes on debt" },
  { id: "fitted", label: "It was forced in, or switched remotely, without my agreement" },
];

export default function EnergyClient() {
  const [inp, setInp] = useState<EnInputs>(BLANK_EN);
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

  const set = <K extends keyof EnInputs>(k: K, v: EnInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));
  const toggleWho = (w: EnWho) =>
    setInp((prev) => ({ ...prev, who: prev.who.includes(w) ? prev.who.filter((x) => x !== w) : [...prev.who, w] }));

  const read = useMemo(() => readEnergy(inp, today), [inp, today]);
  const gb = inp.region === "gb";
  const staged = gb && read !== null;
  const prepay = inp.meter === "prepay";
  const inDebt = staged && inp.stage !== "worried";

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
        {showExample ? <EnExample today={today} /> : null}
      </div>

      {/* ---- Where, the meter, and the stage ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--foreground)] mb-2">Where is the home?</p>
        <Chips<EnRegion>
          label="Where the home is"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "gb", label: "England, Scotland or Wales" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        {gb ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How do you pay for energy?</p>
            <Chips<EnMeter>
              label="How you pay"
              value={inp.meter}
              onPick={(v) => setInp((prev) => ({ ...prev, meter: v, stage: "" }))}
              options={[
                { id: "credit", label: "Bills or Direct Debit" },
                { id: "prepay", label: "Prepayment: a key, card, or smart meter on pay-as-you-go" },
              ]}
            />
          </>
        ) : null}
        {gb && inp.meter ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where are you?</p>
            <Chips<EnStage>
              label="Where you are"
              value={inp.stage}
              onPick={(v) => set("stage", v)}
              cols={1}
              options={prepay ? PREPAY_OPTIONS : CREDIT_OPTIONS}
            />
          </>
        ) : null}
      </div>

      {staged ? (
        <div className={card}>
          <p className={eyebrow}>The money</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inDebt ? (
              <MoneyField id="en-owed" label="What you owe now" value={inp.owed} onChange={(v) => set("owed", v)} placeholder="e.g. £640" />
            ) : null}
            {!prepay ? (
              <MoneyField
                id="en-monthly"
                label="Your monthly Direct Debit or bill"
                value={inp.monthly}
                onChange={(v) => set("monthly", v)}
                placeholder="e.g. £118"
                hint="For gas and electricity together."
              />
            ) : (
              <MoneyField
                id="en-weekly"
                label="Taken towards debt each week"
                value={inp.weekly}
                onChange={(v) => set("weekly", v)}
                placeholder="e.g. £12"
                hint="On the meter's display or your statement."
              />
            )}
            {inDebt ? (
              <MoneyField
                id="en-canpay"
                label="What you could put towards the debt each month"
                value={inp.canPay}
                onChange={(v) => set("canPay", v)}
                placeholder="e.g. £30"
                hint="After rent, food and the energy you use. Honest and keepable beats big."
              />
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="en-supplier" className="block text-sm text-[var(--foreground)] mb-2">
                Supplier <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="en-supplier"
                type="text"
                value={inp.supplier}
                onChange={(e) => set("supplier", e.target.value)}
                placeholder="e.g. the name on the bill"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="en-what" className="block text-sm text-[var(--foreground)] mb-2">
                What it&rsquo;s about <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="en-what"
                type="text"
                value={inp.what}
                onChange={(e) => set("what", e.target.value)}
                placeholder="e.g. gas and electricity"
                className={inputClass}
              />
              <CarriedNote
                show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
                onClear={() => {
                  set("what", "");
                  setCarriedSeed("");
                }}
              />
            </div>
          </div>

          <p className={`mt-6 ${eyebrow}`}>Who lives there</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Tick any that apply. They change what a supplier is allowed to do.</p>
          <div role="group" aria-label="Who lives there" className="grid grid-cols-1 gap-2">
            {WHO_OPTIONS.map((o) => {
              const on = inp.who.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleWho(o.id)}
                  className={`${chipBase} ${on ? chipOn : chipOff}`}
                >
                  <span aria-hidden className="mr-2">{on ? "✓" : "○"}</span>
                  {o.label}
                </button>
              );
            })}
          </div>
          {inDebt ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Does any of the debt go back to April 2022 – March 2024?</p>
              <Chips<EnOld>
                label="Whether the debt dates from 2022 to 2024"
                value={inp.old}
                onPick={(v) => set("old", v)}
                options={[
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "No, it's newer" },
                  { id: "unsure", label: "Not sure" },
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      <AnnounceAnswer message={read ? enHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where the home is, how you pay, and where you are. The read
            appears: what protects your household, the plan to offer, the money
            you may be due this winter, and the letter to send.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_EN);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/** The January rise drawn to scale: this autumn's monthly cost beside January's at the same use. */
function Rise({ read }: { read: EnRead }) {
  if (read.janExtra === null || read.monthly === null) return null;
  const now = read.monthly;
  const jan = now + read.janExtra;
  const pct = Math.round((now / jan) * 100);
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Same use, new price</p>
      <div className="mt-3 space-y-3">
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-[var(--foreground)]">Your monthly cost now</span>
            <span className="font-medium tabular-nums text-[var(--foreground)]">{money(Math.round(now))}</span>
          </div>
          <div className="mt-1 h-3 rounded bg-[var(--border)]/40" aria-hidden>
            <div className="h-3 rounded bg-[var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-[var(--foreground)]">From 1 January, about</span>
            <span className="font-medium tabular-nums text-[var(--foreground)]">{money(Math.round(jan))}</span>
          </div>
          <div className="mt-1 h-3 rounded bg-[var(--foreground)]/70" aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        Scaled by the reported change in the typical cap, {money(CAP_NOW)} to {money(CAP_JAN)} a year. Gas rose more than
        electricity, so an all-electric home will see less and a gas-heated one a little more.
      </p>
    </div>
  );
}

function Lines({ title, lines }: { title: string; lines: string[] }) {
  if (!lines.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: EnInputs; read: EnRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = enRule(read);
  const letters = enLetters(inp, read, today);
  const reminders = enReminders(inp, read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{enHeadline(inp, read)}</p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{enBody(inp, read)}</p>

      <Rise read={read} />

      {read.actions.length ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>In this order</p>
          <ol className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-decimal pl-5">
            {read.actions.map((a) => (
              <li key={a.id}>
                <span className="font-medium">{a.title}.</span> <span className="text-[var(--muted)]">{a.detail}</span>
              </li>
            ))}
          </ol>
          {reminders.length ? (
            <div className="mt-3">
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Dates: {reminders.map((r) => `${actDate(r.on)} (${r.title.toLowerCase()})`).join("; ")}.
              </p>
              <button type="button" onClick={() => downloadIcs(reminders)} className={`mt-2 ${action}`}>
                Add {reminders.length === 1 ? "it" : "the dates"} to your calendar (.ics)
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <Lines title="What protects you" lines={enProtections(inp, read)} />
      <Lines title="Money you may be due this winter" lines={enMoneyIn(inp, read)} />

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`en-letter-${l.id}`}>
            {l.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`en-letter-${l.id}`}
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

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. The January cap figure is as reported on 25 November
        2026; check Ofgem&rsquo;s site and your supplier&rsquo;s letter. Free,
        confidential help: National Debtline, StepChange and Citizens Advice
        (they can talk to the supplier and apply for Breathing Space, which
        pauses most collection for 60 days in England and Wales); Citizens
        Advice&rsquo;s consumer service for energy; Advice Direct Scotland. If a
        supplier won&rsquo;t sort it, the Energy Ombudsman is free.
      </p>

      {read.status !== "ni" ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>Your line, to keep</p>
          <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <button type="button" onClick={async () => setCopied((await copyText(rule)) ? "line" : "no")} className={action}>
              {copied === "line" ? "Copied your line" : "Copy your line"}
            </button>
            <button
              type="button"
              onClick={async () => setCopied((await copyText(enSummary(inp, read, today))) ? "all" : "no")}
              className={action}
            >
              {copied === "all" ? "Copied the whole plan" : "Copy the whole plan as text"}
            </button>
          </div>
          {copied === "no" ? <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words above instead.</p> : null}
        </div>
      ) : null}
      <Handoffs inp={inp} read={read} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: EnInputs; read: EnRead }) {
  const subject = inp.what.trim() || "energy bills";
  const list: Handoff[] = [
    {
      href: withSubject("/catchup", subject),
      label: "One big bill for months of old use?",
      note: "Suppliers can't charge for energy used more than 12 months before the bill if they didn't bill it right. This splits it.",
    },
  ];
  if (read.status !== "worried" && read.status !== "ni")
    list.push({
      href: withSubject("/debts", subject),
      label: "Other debts as well?",
      note: "Energy and council tax come before cards and loans, because of what can follow. Put them side by side.",
    });
  if (read.pension)
    list.push({
      href: withSubject("/pensioncredit", subject),
      label: "Over State Pension age and not on Pension Credit?",
      note: "It unlocks the Warm Home Discount, Cold Weather Payments and help with council tax.",
    });
  list.push({
    href: withSubject("/scam", subject),
    label: "A text about an energy rebate or a refund?",
    note: "The Warm Home Discount is applied automatically. Nobody needs your card details to give it to you.",
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
        <Link href="/writing/the-first-number-on-the-table" className={link}>
          The first number on the table
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only: same read, fixed case, nothing saved. */
function EnExample({ today }: { today: string }) {
  const ex = EN_EXAMPLE;
  const read = readEnergy(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I&rsquo;m £640 behind on gas and electricity. Some of it is from the
        winter of 2022 and never quite went away. I&rsquo;m on Universal Credit
        and my son is 14 months old. The letter says the supplier will apply
        for a warrant to fit a prepayment meter unless I pay £160 a month on
        top of my £118 Direct Debit. I can manage £30.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{enHeadline(ex, read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          I emailed the letter the same evening with his birth certificate and
          an income and spending sheet from a debt adviser. The supplier
          cancelled the warrant application, put us on the Priority Services
          Register and agreed £30 a month. The Warm Home Discount came off in
          January, and the adviser told me to expect a letter about the Debt
          Relief Scheme for the 2022 part.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}bill.
      </p>
    </div>
  );
}
