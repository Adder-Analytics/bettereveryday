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
  BLANK_COLLECTOR,
  actDate,
  collectorBody,
  collectorExample,
  collectorHeadline,
  collectorRule,
  collectorSummary,
  evidenceLines,
  isISODate,
  letterDate,
  limitYears,
  mainLetter,
  parseCollectorInputs,
  readCollector,
  reminderOf,
  todayISO,
  type Court,
  type CollectorInputs,
  type CollectorRead,
  type DebtKind,
  type DebtRegion,
  type PaidKind,
  type Recognise,
} from "../data/collector";

/**
 * An old debt, a new letter: do you still owe it? (/collector)
 *
 * The instrument for the letter from a debt collector or debt buyer about
 * something from years ago. The call turns on one date: the last payment, or
 * the last time you admitted the debt in writing. Six years later (five in
 * Scotland) it can't be taken to court, and in Scotland it no longer exists.
 * So the tool reads that date against the limit, says which letter to send,
 * and dates any court deadline, because a time limit is a defence you have to
 * raise, not something the court does for you.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/collector.ts` so it can be checked without a browser.
 */

const STORE_KEY = "collector:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £1,260.";

function loadInputs(): CollectorInputs {
  if (typeof window === "undefined") return BLANK_COLLECTOR;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseCollectorInputs(JSON.parse(raw)) : BLANK_COLLECTOR;
  } catch {
    return BLANK_COLLECTOR;
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

function downloadIcs(inp: CollectorInputs, r: { on: string; title: string; body: string }): void {
  if (!isISODate(r.on)) return;
  const what = inp.what.trim();
  const day = r.on.replace(/-/g, "");
  const [y, m, d] = r.on.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  const end = `${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`;
  const event = [
    "BEGIN:VEVENT",
    `UID:collector-${todayISO()}-${r.on}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(what ? `${r.title} (${what})` : r.title)}`,
    `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/collector`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P3D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(r.title)}`,
    "END:VALARM",
    "END:VEVENT",
  ];
  const blob = new Blob([wrapCalendar([event], "Old debt")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `old-debt-${r.on}.ics`;
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

function DateField({
  id,
  label,
  value,
  max,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  max: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-2">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {hint ? <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export default function CollectorClient() {
  const [inp, setInp] = useState<CollectorInputs>(BLANK_COLLECTOR);
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

  const set = <K extends keyof CollectorInputs>(k: K, v: CollectorInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readCollector(inp, today), [inp, today]);
  const years = limitYears(inp.region || "ew");
  const datesMatter = inp.kind !== "tax" && inp.kind !== "student" && inp.court !== "judgment";

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
        {showExample ? <CollectorExample today={today} /> : null}
      </div>

      {/* ---- The debt ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="collector-what" className={`block ${eyebrow} mb-2`}>
          Which debt?
        </label>
        <input
          id="collector-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. the old store card"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="collector-who" className="block text-sm text-[var(--foreground)] mb-2">
              Who&rsquo;s writing <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="collector-who"
              type="text"
              value={inp.who}
              onChange={(e) => set("who", e.target.value)}
              placeholder="The name on the letter"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="collector-amount" className="block text-sm text-[var(--foreground)] mb-2">
              What they&rsquo;re asking for <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="collector-amount"
              type="text"
              inputMode="decimal"
              value={inp.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="e.g. £1,260"
              aria-invalid={moneyInvalid(inp.amount)}
              className={inputClass}
            />
            {moneyInvalid(inp.amount) ? <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p> : null}
          </div>
        </div>
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where did you live when you took it on?</p>
        <Chips<DebtRegion>
          label="Where you lived"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "ew", label: "England or Wales" },
            { id: "scot", label: "Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          Usually the law where you lived when the agreement was made. If
          you&rsquo;ve moved between them, get advice before you rely on it.
        </p>
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What kind of debt?</p>
        <Chips<DebtKind>
          label="What kind of debt"
          value={inp.kind}
          onPick={(v) => set("kind", v)}
          options={[
            { id: "credit", label: "Credit card, loan, overdraft, catalogue" },
            { id: "bill", label: "Phone, broadband, energy or water bill" },
            { id: "private", label: "Rent arrears or another private debt" },
            { id: "council", label: "Council tax (rates in Northern Ireland)" },
            { id: "mortgage", label: "What's left after a home was repossessed" },
            { id: "benefit", label: "A benefit or tax credit overpayment" },
            { id: "tax", label: "Tax owed to HMRC" },
            { id: "student", label: "A student loan" },
          ]}
        />
      </div>

      {/* ---- The dates ---- */}
      {inp.region && inp.kind ? (
        <div className={card}>
          <p className={eyebrow}>The court, and the dates</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Has anything come from a court, or about one?</p>
          <Chips<Court>
            label="Whether there's been court action"
            value={inp.court}
            onPick={(v) => set("court", v)}
            cols={1}
            options={[
              { id: "none", label: "No, just letters, calls or texts" },
              { id: "letter", label: "A “letter of claim” or “letter before action” with a reply form" },
              { id: "claim", label: "A court claim form" },
              { id: "judgment", label: "They already have a judgment (a CCJ, or a liability order or summary warrant for council tax)" },
              { id: "unsure", label: "I'm not sure whether there was ever a court case" },
            ]}
          />
          {inp.court === "letter" || inp.court === "claim" ? (
            <div className="mt-4 sm:max-w-[16rem]">
              <DateField
                id="collector-court-on"
                label={inp.court === "letter" ? "Date on the letter of claim" : "Issue date on the claim form"}
                value={inp.courtOn}
                max={today}
                onChange={(v) => set("courtOn", v)}
                hint={inp.court === "claim" ? "Printed near the top, by the claim number." : undefined}
              />
            </div>
          ) : null}

          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Do you recognise the debt?</p>
          <Chips<Recognise>
            label="Whether you recognise the debt"
            value={inp.recognise}
            onPick={(v) => set("recognise", v)}
            options={[
              { id: "yes", label: "Yes, it's mine" },
              { id: "unsure", label: "Maybe, but I'm not sure" },
              { id: "no", label: "No, I don't recognise it" },
            ]}
          />

          {datesMatter ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">When did you last pay anything towards it?</p>
              <Chips<PaidKind>
                label="When you last paid"
                value={inp.paid}
                onPick={(v) => set("paid", v)}
                cols={1}
                options={[
                  { id: "paid", label: "I know roughly when" },
                  { id: "never", label: "I never paid anything towards it" },
                  { id: "unknown", label: "I don't know" },
                ]}
              />
              {inp.paid === "paid" || inp.paid === "never" ? (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DateField
                    id="collector-since"
                    label={inp.paid === "never" ? "When it first went unpaid" : "Your last payment"}
                    value={inp.since}
                    max={today}
                    onChange={(v) => set("since", v)}
                    hint="Your best guess. Old bank statements will show it."
                  />
                  <DateField
                    id="collector-wrote"
                    label="Last time you wrote saying you owed it (optional)"
                    value={inp.wrote}
                    max={today}
                    onChange={(v) => set("wrote", v)}
                    hint="A signed letter, a form or an email admitting it. A phone call doesn't count."
                  />
                </div>
              ) : null}
              <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                Include any payment at all, even £1, and payments the collector
                took from you. If it&rsquo;s a joint debt, a payment by the
                other person can count too.
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? collectorHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where you lived, what kind of debt it is, whether anything has
            come from a court, and roughly when you last paid. The read
            appears: whether it&rsquo;s past the {years}-year limit, the
            letter to send, and any deadline you mustn&rsquo;t miss.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_COLLECTOR);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/** The clock: from the start date to the limit, with today marked. */
function Clock({ inp, read, today }: { inp: CollectorInputs; read: CollectorRead; today: string }) {
  if (!read.start || !read.barredOn) return null;
  const a = new Date(`${read.start}T00:00:00`).getTime();
  const b = new Date(`${read.barredOn}T00:00:00`).getTime();
  const t = new Date(`${today}T00:00:00`).getTime();
  const pct = Math.max(0, Math.min(100, ((t - a) / (b - a)) * 100));
  const past = t >= b;
  const rows: { label: string; value: string; note?: string }[] = [
    {
      label: read.restartedByWriting ? "Last written admission" : inp.paid === "never" ? "First went unpaid" : "Last payment",
      value: letterDate(read.start),
      note: "The clock starts here",
    },
  ];
  if (read.interestBarredOn)
    rows.push({ label: "Interest can't be claimed after", value: letterDate(read.interestBarredOn) });
  rows.push({
    label: read.interestBarredOn ? "Capital can't be claimed after" : inp.region === "scot" ? "The debt is extinguished" : "It can't go to court after",
    value: letterDate(read.barredOn),
    note: read.status === "close" ? "Close: the real date may be a little later" : undefined,
  });
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The clock</p>
      <div
        role="img"
        aria-label={past ? "Today is past the limit." : `Today is ${Math.round(pct)}% of the way to the limit.`}
        className="mt-3 flex h-2.5 overflow-hidden rounded-full border border-[var(--border)]"
      >
        <div className="bg-[var(--accent)]" style={{ width: `${pct}%` }} />
        <div className="bg-[var(--border)] flex-1" />
      </div>
      <p className="mt-1.5 text-xs text-[var(--muted)]">{past ? "Today is past the line." : "Today, on the way to the line."}</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.label} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--foreground)]">{r.label}</span>
              {r.note ? <span className="block text-xs text-[var(--muted)]">{r.note}</span> : null}
            </span>
            <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        A payment or a signed admission before the line starts the clock
        again. After the line, paying doesn&rsquo;t bring the claim back, but
        you can&rsquo;t get the money back either.
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: CollectorInputs; read: CollectorRead; today: string }) {
  const [copied, setCopied] = useState<"" | "main" | "line" | "all" | "no">("");
  const rule = collectorRule();
  const main = mainLetter(inp, read);
  const remind = reminderOf(read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {collectorHeadline(inp, read)}
      </p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{collectorBody(inp, read)}</p>

      {read.replyBy ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>{read.stage === "claim" ? "The court deadline" : "Reply by"}</p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{actDate(read.replyBy)}</p>
          {read.defenceBy ? (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Or acknowledge the claim by then, and file the defence by {actDate(read.defenceBy)}.
            </p>
          ) : null}
          {remind ? (
            <button type="button" onClick={() => downloadIcs(inp, remind)} className={`mt-2 ${action}`}>
              Add it to your calendar (.ics)
            </button>
          ) : null}
        </div>
      ) : null}

      <Clock inp={inp} read={read} today={today} />

      {main ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id="collector-main-msg">{main.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{main.note}</p>
          <pre
            aria-labelledby="collector-main-msg"
            className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
          >
            {main.text}
          </pre>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(main.text)) ? "main" : "no")}
            className={`mt-3 ${action}`}
          >
            {copied === "main" ? "Copied" : "Copy the letter"}
          </button>
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>What to keep together</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {evidenceLines(inp, read).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. Free, confidential debt advice: National Debtline
        (England, Wales and Scotland), StepChange, Citizens Advice, and Advice
        NI in Northern Ireland. They can check the dates, write to the
        collector for you, and help with court forms. Be wary of firms that
        charge to &ldquo;write off&rdquo; debts.
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
            onClick={async () => setCopied((await copyText(collectorSummary(inp, read))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole plan" : "Copy the whole plan as text"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Couldn&rsquo;t copy. Select the words above instead.
          </p>
        ) : null}
      </div>
      <Handoffs inp={inp} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp }: { inp: CollectorInputs }) {
  const list: Handoff[] = [
    {
      href: withSubject("/scam", inp.what),
      label: "Not sure the letter is real?",
      note: "Check it before you call a number or pay into an account it gives.",
    },
    {
      href: withSubject("/debts", inp.what),
      label: "Other debts as well?",
      note: "Put the ones you do owe side by side, and see which to pay first.",
    },
  ];
  return (
    <div className="mt-5 pt-5 border-t border-[var(--border)]">
      <p className={eyebrow}>Where to take it next</p>
      <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
        {list.map((h) => (
          <li key={h.href}>
            <Link
              href={h.href}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              {h.label} →
            </Link>{" "}
            {h.note}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        More on why this works:{" "}
        <Link href="/writing/what-is-the-small-ask-worth-to-them" className={link}>
          What is the small ask worth to them?
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
function CollectorExample({ today }: { today: string }) {
  const ex = collectorExample(today);
  const read = readCollector(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        A letter came from a company I&rsquo;d never heard of. It had bought
        the debt on a store card I stopped paying when I lost my job, more than
        seven years ago. It wanted £1,260, or &ldquo;a token payment of £1 a
        month to show goodwill&rdquo;. A pound a month seemed the easy way to
        make it go away.
      </p>
      <Clock inp={ex} read={read} today={today} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {collectorHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The six years had run out more than a year before the letter came.
          Had it come two years earlier and I&rsquo;d sent the £1, the six
          years would have started again. I sent the statute-barred letter
          instead, and the company wrote back to say the account was closed.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}letter.
      </p>
    </div>
  );
}
