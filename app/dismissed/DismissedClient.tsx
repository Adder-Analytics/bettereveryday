"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_DISMISSED,
  DISMISSED_EXAMPLE,
  FLAGS,
  SHORT_QUALIFYING_FROM,
  actDate,
  datesOf,
  dismissedBody,
  dismissedHeadline,
  dismissedLetters,
  dismissedRule,
  dismissedSummary,
  flagsOf,
  isISODate,
  keepList,
  knowList,
  letterDate,
  money,
  numInvalid,
  parseDismissedInputs,
  readDismissed,
  serviceWords,
  toggleFlag,
  todayISO,
  type Appeal,
  type DateLine,
  type DismissedInputs,
  type DismissedRead,
  type Notice,
  type PayBasis,
  type Process,
  type Reason,
  type Region,
  type Stage,
} from "../data/dismissed";

/**
 * Dismissed: do you have a claim, and by when? (/dismissed)
 *
 * The instrument for being sacked, given notice or pushed into resigning,
 * under the 2026–27 rules: six months to start a claim for jobs ending from
 * 1 October 2026, and six months' service for unfair dismissal for jobs ending
 * from 1 January 2027. It dates the Acas deadline (which an appeal doesn't
 * pause), counts service the way the law does (statutory notice added), goes
 * through each claim, and writes the letters.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/dismissed.ts` so it can be checked without a browser.
 */

const STORE_KEY = "dismissed:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £2,100.";
const NUM_BAD = "Couldn't read that as a number. Try something like 4.";

function loadInputs(): DismissedInputs {
  if (typeof window === "undefined") return BLANK_DISMISSED;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseDismissedInputs(JSON.parse(raw)) : BLANK_DISMISSED;
  } catch {
    return BLANK_DISMISSED;
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
        `UID:dismissed-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/dismissed`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Dismissal deadlines")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dismissal-deadlines.ics";
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

export default function DismissedClient() {
  const [inp, setInp] = useState<DismissedInputs>(BLANK_DISMISSED);
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

  const set = <K extends keyof DismissedInputs>(k: K, v: DismissedInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readDismissed(inp, today), [inp, today]);
  const flags = flagsOf(inp);
  const pending = inp.stage === "pending";
  const gone = inp.stage === "dismissed" || inp.stage === "resigned";
  const datesBad =
    isISODate(inp.started) && isISODate(inp.toldOn) && inp.toldOn < inp.started
      ? "The day you were told can't be before the job started."
      : inp.notice === "worked" && isISODate(inp.endsOn) && isISODate(inp.toldOn) && inp.endsOn < inp.toldOn
        ? "The last day can't be before the day you were told."
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

      {/* ---- What happened ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>What happened</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Where do you work?</p>
        <Chips<Region>
          label="Where you work"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "gb", label: "England, Scotland or Wales" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Which is closest?</p>
        <Chips<Stage>
          label="What happened"
          value={inp.stage}
          onPick={(v) => set("stage", v)}
          cols={1}
          options={[
            { id: "dismissed", label: "I've been dismissed, or given notice of dismissal" },
            { id: "resigned", label: "I resigned because of how I was treated" },
            { id: "pending", label: "Not yet: there's a disciplinary or performance meeting, or I think it's coming" },
          ]}
        />
        {inp.stage ? (
          <div className="mt-5">
            <label htmlFor="dm-employer" className="block text-sm text-[var(--foreground)] mb-2">
              Employer&rsquo;s name, for the letters <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="dm-employer"
              type="text"
              value={inp.employer}
              onChange={(e) => set("employer", e.target.value)}
              placeholder="e.g. Northgate Logistics"
              className={inputClass}
            />
          </div>
        ) : null}
      </div>

      {/* ---- The dates ---- */}
      {inp.stage ? (
        <div className={card}>
          <p className={eyebrow}>The dates</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              id="dm-started"
              label="The day the job started"
              value={inp.started}
              onChange={(v) => set("started", v)}
              hint="Your first day, from the contract or first payslip. A change of owner usually doesn't restart it."
            />
            <DateField
              id="dm-told"
              label={
                pending
                  ? "The meeting date"
                  : inp.stage === "resigned"
                    ? "The day you resigned"
                    : "The day you were told"
              }
              value={inp.toldOn}
              onChange={(v) => set("toldOn", v)}
              optional={pending}
            />
          </div>
          {inp.stage === "dismissed" ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What about notice?</p>
              <Chips<Notice>
                label="How notice was handled"
                value={inp.notice}
                onPick={(v) => set("notice", v)}
                cols={1}
                options={[
                  { id: "worked", label: "I'm working my notice, or on garden leave, until a set date" },
                  { id: "pilon", label: "It ended that day, and they're paying my notice in lieu" },
                  { id: "none", label: "It ended that day, with no notice pay" },
                ]}
              />
            </>
          ) : null}
          {(inp.stage === "dismissed" && inp.notice === "worked") || inp.stage === "resigned" ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateField
                id="dm-ends"
                label="Your last day of employment"
                value={inp.endsOn}
                onChange={(v) => set("endsOn", v)}
                optional={inp.stage === "resigned"}
                hint={inp.stage === "resigned" ? "If you worked notice. Leave blank if you left the day you resigned." : "The end of the notice, not the last day you went in."}
              />
            </div>
          ) : null}
          {datesBad ? <p className="mt-3 text-sm text-[var(--accent)]">{datesBad}</p> : null}
        </div>
      ) : null}

      {/* ---- The reason ---- */}
      {inp.stage ? (
        <div className={card}>
          <p className={eyebrow}>The reason</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">
            {pending ? "What's it about?" : inp.stage === "resigned" ? "What made you resign?" : "The reason they gave"}
          </p>
          <Chips<Reason>
            label="The reason given"
            value={inp.reason}
            onPick={(v) => set("reason", v)}
            options={[
              { id: "conduct", label: "Conduct" },
              { id: "gross", label: "Gross misconduct" },
              { id: "capability", label: "Performance" },
              { id: "sickness", label: "Sickness absence" },
              { id: "redundancy", label: "Redundancy" },
              { id: "none", label: "No reason given" },
              { id: "other", label: "Something else" },
            ]}
          />
          <p className="mt-6 text-sm text-[var(--foreground)] mb-1">Might any of these be behind it? Tick all that apply.</p>
          <p className="text-xs text-[var(--muted)] leading-relaxed mb-2">
            These claims need no length of service. It&rsquo;s the timing that usually gives it away.
          </p>
          <div role="group" aria-label="What might be behind it" className="grid grid-cols-1 gap-2">
            {FLAGS.map((f) => {
              const on = flags.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("flags", toggleFlag(inp.flags, f.id))}
                  className={`${chipBase} ${on ? chipOn : chipOff}`}
                >
                  {on ? "✓ " : ""}
                  {f.label}
                </button>
              );
            })}
          </div>
          {gone && inp.stage === "dismissed" ? (
            <>
              <p className="mt-6 text-sm text-[var(--foreground)] mb-2">Before the decision, were you&hellip;</p>
              <Chips<Process>
                label="How fair the process was"
                value={inp.process}
                onPick={(v) => set("process", v)}
                cols={1}
                options={[
                  { id: "fair", label: "Told the case in writing, invited to a meeting with someone with me, and offered an appeal" },
                  { id: "some", label: "Given some of that, not all" },
                  { id: "none", label: "None of it: it came out of the blue" },
                ]}
              />
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Are you appealing, or going to?</p>
              <Chips<Appeal>
                label="Whether you're appealing"
                value={inp.appeal}
                onPick={(v) => set("appeal", v)}
                options={[
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "No, or not offered one" },
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- Pay ---- */}
      {gone ? (
        <div className={card}>
          <p className={eyebrow}>Pay, for the figures</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Optional. Without it you still get the deadline and the claims.
          </p>
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Your pay before tax</p>
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
                id="dm-pay"
                label={inp.payBasis === "week" ? "A week's pay" : inp.payBasis === "month" ? "A month's pay" : "Yearly salary"}
                value={inp.pay}
                onChange={(v) => set("pay", v)}
                placeholder={inp.payBasis === "week" ? "e.g. £480" : inp.payBasis === "month" ? "e.g. £2,100" : "e.g. £26,000"}
              />
            </div>
          ) : null}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              id="dm-born"
              label="Your date of birth"
              value={inp.born}
              onChange={(v) => set("born", v)}
              optional
              hint="The basic award depends on your age in each year worked."
            />
            {inp.stage === "dismissed" ? (
              <TextField
                id="dm-contract"
                label="Notice in your contract, in weeks"
                value={inp.contractWeeks}
                onChange={(v) => set("contractWeeks", v)}
                placeholder="e.g. 4 (a month is about 4.3)"
                kind="number"
                optional
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ---- Acas ---- */}
      {gone ? (
        <div className={card}>
          <p className={eyebrow}>{inp.region === "ni" ? "The Labour Relations Agency" : "Acas"}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Haven&rsquo;t contacted them? Leave these blank; the read gives you the date to do it by.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              id="dm-acas"
              label="The day you contacted them"
              value={inp.acasOn}
              onChange={(v) => set("acasOn", v)}
              optional
            />
            {isISODate(inp.acasOn) ? (
              <DateField
                id="dm-cert"
                label="The day the certificate came"
                value={inp.certOn}
                onChange={(v) => set("certOn", v)}
                optional
                hint="By email, usually. Leave blank if conciliation is still going."
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? dismissedHeadline(inp, read, today) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where you work, what happened, when the job started and when
            you were told. The read appears: the date to contact Acas by, the
            service the law counts against the line that applies, each claim
            you might have, and the letters to send.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_DISMISSED)} />
    </div>
  );
}

/** The service the law counts against the line that applies. */
function TheLine({ inp, read, today }: { inp: DismissedInputs; read: DismissedRead; today: string }) {
  const counted = read.pending ? today : read.qualifyingEdt;
  const day = (a: string, b: string) =>
    Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000);
  const have = Math.max(0, day(inp.started, counted) + 1);
  const need = Math.max(1, day(inp.started, read.protectedOn) + 1);
  const max = Math.max(have, need);
  const over = read.pending ? today >= read.protectedOn : read.qualifies;
  const notch = read.region === "gb" && read.protectedOn === SHORT_QUALIFYING_FROM;
  const rows = [
    {
      label: read.pending ? "Your service so far" : "Service the law counts",
      sub: read.pending ? `to today` : `to ${letterDate(counted)}${read.extended ? ", statutory notice added" : ""}`,
      days: have,
      text: serviceWords(inp.started, counted),
      tone: over ? "accent" : "muted",
    },
    {
      label: "The line for unfair dismissal",
      sub: notch ? "a job ending on or after 1 January 2027" : read.region === "ni" ? "one year" : "two years",
      days: need,
      text: letterDate(read.protectedOn),
      tone: "fg",
    },
  ];
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Your service, and the line</p>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--foreground)]">
                <span className="font-medium">{r.label}</span>
                <span className="text-[var(--muted)]"> · {r.sub}</span>
              </span>
              <span className="font-medium tabular-nums text-[var(--foreground)] text-right">{r.text}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--border)]" aria-hidden="true">
              <span
                className={`block h-full ${r.tone === "accent" ? "bg-[var(--accent)]" : r.tone === "fg" ? "bg-[var(--foreground)]" : "bg-[var(--muted)]"}`}
                style={{ width: `${(r.days / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        {read.pending
          ? over
            ? "You're over the line."
            : `${day(today, read.protectedOn)} days to go.${notch ? " Until 31 December 2026 the line is two years; from 1 January 2027 it's six months, for jobs ending from that day." : ""}`
          : read.qualifies
            ? read.carried
              ? "Over the line only because the law adds the notice you weren't given."
              : "Over the line."
            : `${read.daysShort} ${read.daysShort === 1 ? "day" : "days"} short.${notch ? " Until 31 December 2026 the line is two years; from 1 January 2027 it's six months." : ""} Several claims below need no service at all.`}
      </p>
    </div>
  );
}

function Claims({ read }: { read: DismissedRead }) {
  const label = (s: string) => (s === "open" ? "Open to you" : s === "closed" ? "Not on these facts" : "Worth checking");
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Claim by claim</p>
      <ul className="mt-3 space-y-4">
        {read.claims.map((c) => (
          <li key={c.id} className="text-sm leading-relaxed">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="font-semibold text-[var(--foreground)]">{c.name}</span>
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${c.status === "open" ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
              >
                {label(c.status)}
              </span>
            </div>
            <p className="mt-1 text-[var(--muted)]">
              {c.why}
              {c.href ? (
                <>
                  {" "}
                  <Link href={c.href} className={link}>
                    Check it →
                  </Link>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: DismissedInputs; read: DismissedRead; today: string }) {
  const [copied, setCopied] = useState<string>("");
  const rule = dismissedRule(read);
  const letters = dismissedLetters(inp, read, today);
  const dates = datesOf(inp, read);
  const know = knowList(inp, read);
  const keep = keepList();
  const body = dismissedBody(inp, read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {dismissedHeadline(inp, read, today)}
      </p>
      {body ? (
        <div className="mt-4 space-y-3">
          {body.split("\n\n").map((para) => (
            <p key={para} className="text-sm text-[var(--foreground)] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      ) : null}

      {dates.length ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>{read.pending ? "The dates that change things" : "The clock"}</p>
          <ul className="mt-3 space-y-3">
            {dates.map((d) => (
              <li key={d.title} className="text-sm leading-relaxed">
                <span className="font-semibold text-[var(--foreground)]">{actDate(d.on)}</span>
                {d.on.slice(0, 4) !== today.slice(0, 4) ? ` ${d.on.slice(0, 4)}` : ""}
                {d.on < today ? <span className="text-[var(--muted)]"> (passed)</span> : null}
                <span className="text-[var(--foreground)]">: {d.title}.</span>{" "}
                <span className="text-[var(--muted)]">{d.body}</span>
              </li>
            ))}
          </ul>
          {dates.some((d) => d.on >= today) ? (
            <button type="button" onClick={() => downloadIcs(dates.filter((d) => d.on >= today))} className={`mt-3 ${action}`}>
              Add the ones still ahead to your calendar (.ics)
            </button>
          ) : null}
        </div>
      ) : null}

      <TheLine inp={inp} read={read} today={today} />
      <Claims read={read} />

      {!read.pending && (read.basicAward !== null || read.noticeShort !== null) ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>The figures</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {read.noticeShort !== null ? (
              <li>
                Notice pay owed: about <span className="font-medium">{money(read.noticeShort)}</span> before tax (
                {read.noticeShortWeeks} {read.noticeShortWeeks === 1 ? "week" : "weeks"}).
              </li>
            ) : null}
            {read.basicAward !== null ? (
              <li>
                Basic award, if unfair dismissal succeeds:{" "}
                <span className="font-medium">{read.basicAward > 0 ? money(read.basicAward) : "£0"}</span> (
                {read.basicWeeks} {read.basicWeeks === 1 ? "week" : "weeks"} at{" "}
                {read.weekly !== null && read.weekly > read.weekCap ? `the ${money(read.weekCap)} cap` : "your weekly pay"}
                ). {inp.reason === "redundancy" ? "Statutory redundancy pay already paid comes off it." : "It's for the job you lost; lost earnings come on top, as the compensatory award."}
              </li>
            ) : null}
            {read.basicAward !== null ? (
              <li>
                {read.compCap === null
                  ? "No cap on the compensatory award: your employment ends on or after 1 January 2027."
                  : `Compensatory award cap: ${money(read.compCap)} (the lower of ${money(123543)} or a year's pay).`}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

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

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`dm-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`dm-letter-${l.id}`}
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
        Not legal advice. Rules as of November 2026. Free help: Acas (England, Scotland and Wales), the Labour Relations
        Agency (Northern Ireland), Citizens Advice, a law centre, your union if you have one, and legal expenses cover
        on your home insurance.
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
            onClick={async () => setCopied((await copyText(dismissedSummary(inp, read, today))) ? "all" : "no")}
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
      href: "/leaving",
      label: "Is the final payslip right?",
      note: "Holiday built up, notice, and deductions, checked line by line.",
    },
    {
      href: "/redundancy",
      label: "Told it's redundancy?",
      note: "Check the redundancy pay and what a settlement agreement is paying for.",
    },
    {
      href: "/monthly",
      label: "Income stopping for a while?",
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
        <Link href="/writing/the-day-before-the-line" className={link}>
          The day before the line
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
  const ex = DISMISSED_EXAMPLE;
  const read = readDismissed(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I started at a warehouse on {letterDate(ex.started)}. In October I
        asked why my holiday pay was short. On {letterDate(ex.toldOn)}{" "}I was
        called in and told I was going &ldquo;for performance&rdquo;, with a
        week&rsquo;s pay in lieu of notice. Nobody had mentioned performance
        before. I&rsquo;d always heard you need two years to claim, and three
        months to do it, so I assumed that was that.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {dismissedHeadline(ex, read, today)}
        </p>
        <TheLine inp={ex} read={read} today={today} />
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Both things I&rsquo;d heard were wrong for me. Asking about holiday
          pay is asserting a legal right, and dismissal for that is unfair at
          any length of service. And for jobs ending from October 2026
          there&rsquo;s six months, not three. Had the same dismissal come
          seven weeks later, I&rsquo;d have had the ordinary claim too. I
          appealed, and contacted Acas the same week.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}dates.
      </p>
    </div>
  );
}
