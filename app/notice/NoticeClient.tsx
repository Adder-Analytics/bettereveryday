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
  BLANK_NOTICE,
  GROUNDS,
  evidenceLines,
  isISODate,
  letterDate,
  money,
  noticeBody,
  noticeExample,
  noticeHeadline,
  noticeLetters,
  noticeRule,
  noticeSummary,
  parseNoticeInputs,
  readNotice,
  remindersOf,
  timelineOf,
  todayISO,
  type Aim,
  type DepositState,
  type GroundId,
  type NoticeInputs,
  type NoticeKind,
  type NoticeLandlord,
  type NoticeRead,
  type NoticeRegion,
  type NoticeRentPeriod,
  type YesNoUnsure,
} from "../data/notice";

/**
 * A notice to leave: do you have to go? (/notice)
 *
 * The instrument for a landlord's notice to leave in England, under the rules
 * that changed on 1 May 2026. It checks the notice (the form, the ground, the
 * notice period, the first-year rule), then lays the steps out on a timeline
 * so the date on the notice reads as what it is: the earliest the landlord can
 * ask a court, not the day you have to be out. For rent arrears it works out
 * the one figure that matters: how much takes you under the ground 8 line.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/notice.ts` so it can be checked without a browser.
 */

const STORE_KEY = "notice:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £950.";

function loadInputs(): NoticeInputs {
  if (typeof window === "undefined") return BLANK_NOTICE;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseNoticeInputs(JSON.parse(raw)) : BLANK_NOTICE;
  } catch {
    return BLANK_NOTICE;
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

function downloadIcs(inp: NoticeInputs, list: { on: string; title: string; body: string }[]): void {
  const what = inp.what.trim();
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
        `UID:notice-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(what ? `${r.title} (${what})` : r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/notice`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Notice to leave")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `notice-${list[list.length - 1].on}.ics`;
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
  onChange,
  hint,
  optional,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  optional?: boolean;
  max?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-2">
        {label}
        {optional ? <span className="text-[var(--muted)]"> (optional)</span> : null}
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

function MoneyField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
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
    </div>
  );
}

export default function NoticeClient() {
  const [inp, setInp] = useState<NoticeInputs>(BLANK_NOTICE);
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

  const set = <K extends keyof NoticeInputs>(k: K, v: NoticeInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));
  const toggleGround = (id: GroundId) =>
    setInp((prev) => ({
      ...prev,
      grounds: prev.grounds.includes(id) ? prev.grounds.filter((g) => g !== id) : [...prev.grounds, id],
    }));

  const read = useMemo(() => readNotice(inp, today), [inp, today]);
  const inEngland = inp.region === "eng";
  const privateLet = inEngland && inp.landlord === "private";
  const formal = privateLet && (inp.kind === "form3a" || inp.kind === "unsure");
  const arrearsGround = inp.grounds.some((id) => GROUNDS.find((g) => g.id === id)?.arrears);
  const per = inp.period === "week" ? "a week" : inp.period === "fourweek" ? "every four weeks" : "a month";

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
        {showExample ? <NoticeExample today={today} /> : null}
      </div>

      {/* ---- The home ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="notice-what" className={`block ${eyebrow} mb-2`}>
          Which home? <span className="normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <input
          id="notice-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. the flat on Mill Lane"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where is it?</p>
        <Chips<NoticeRegion>
          label="Where the home is"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "eng", label: "England" },
            { id: "wales", label: "Wales" },
            { id: "scot", label: "Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        {inEngland ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Who do you rent from?</p>
            <Chips<NoticeLandlord>
              label="Who you rent from"
              value={inp.landlord}
              onPick={(v) => set("landlord", v)}
              cols={1}
              options={[
                { id: "private", label: "A private landlord or letting agent" },
                { id: "social", label: "A council or housing association" },
                { id: "lodger", label: "I live in my landlord's home (a lodger)" },
              ]}
            />
          </>
        ) : null}
        {privateLet ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What arrived?</p>
            <Chips<NoticeKind>
              label="What arrived"
              value={inp.kind}
              onPick={(v) => set("kind", v)}
              cols={1}
              options={[
                { id: "form3a", label: "A form headed “Form 3A: Notice seeking possession” (section 8)" },
                { id: "s21", label: "A section 21 notice (Form 6A), or one that gives no reason" },
                { id: "informal", label: "A text, an email, or a letter in their own words" },
                { id: "unsure", label: "A formal-looking letter, but I'm not sure what it is" },
                { id: "court", label: "Papers from the county court, with a hearing date" },
              ]}
            />
          </>
        ) : null}
        {privateLet && inp.kind === "court" ? (
          <div className="mt-5">
            <DateField
              id="notice-hearing"
              label="The hearing date"
              value={inp.hearingOn}
              onChange={(v) => set("hearingOn", v)}
              optional
              hint="It's on the claim form. You'll get a calendar reminder for it."
            />
          </div>
        ) : null}
      </div>

      {/* ---- The notice ---- */}
      {formal ? (
        <div className={card}>
          <p className={eyebrow}>The notice</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateField
              id="notice-served"
              label="The day it reached you"
              value={inp.servedOn}
              max={today}
              onChange={(v) => set("servedOn", v)}
            />
            <DateField
              id="notice-not-before"
              label="The date in the notice"
              value={inp.notBefore}
              onChange={(v) => set("notBefore", v)}
              hint="The date the landlord says court proceedings won't begin before. Leave it blank if there isn't one."
            />
          </div>
          <div className="mt-4">
            <DateField
              id="notice-start"
              label="The day your tenancy began"
              value={inp.tenancyStart}
              max={today}
              onChange={(v) => set("tenancyStart", v)}
              optional
              hint="The first tenancy, if you've renewed since. Selling or moving in can't end a tenancy in its first year."
            />
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)]">Which grounds does it give?</p>
          <p className="mt-1 mb-3 text-xs text-[var(--muted)] leading-relaxed">
            They&rsquo;re listed by number in the notice. Tick each one.
          </p>
          <div role="group" aria-label="The grounds in the notice" className="grid grid-cols-1 gap-2">
            {GROUNDS.map((g) => {
              const on = inp.grounds.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleGround(g.id)}
                  className={`${chipBase} ${on ? chipOn : chipOff}`}
                >
                  <span aria-hidden="true">{on ? "☑ " : "☐ "}</span>
                  {g.label}
                </button>
              );
            })}
          </div>

          {arrearsGround ? (
            <div className="mt-5">
              <p className="text-sm text-[var(--foreground)] mb-2">How often do you pay rent?</p>
              <Chips<NoticeRentPeriod>
                label="How often you pay rent"
                value={inp.period}
                onPick={(v) => set("period", v)}
                options={[
                  { id: "month", label: "Monthly" },
                  { id: "week", label: "Weekly" },
                  { id: "fourweek", label: "Every four weeks" },
                ]}
              />
              {inp.period ? (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MoneyField
                    id="notice-rent"
                    label={`Rent, ${per}`}
                    value={inp.rent}
                    onChange={(v) => set("rent", v)}
                    placeholder="e.g. £950"
                  />
                  <MoneyField
                    id="notice-owed"
                    label="What you owe now"
                    value={inp.owed}
                    onChange={(v) => set("owed", v)}
                    placeholder="e.g. £3,100"
                  />
                </div>
              ) : null}
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
                Is some of it down to a Universal Credit payment delay?
              </p>
              <Chips<YesNoUnsure>
                label="Whether a Universal Credit delay caused some of the arrears"
                value={inp.ucDelay}
                onPick={(v) => set("ucDelay", v)}
                options={[
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "No" },
                  { id: "unsure", label: "Not sure" },
                ]}
              />
            </div>
          ) : null}

          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Was your deposit protected?</p>
          <Chips<DepositState>
            label="Whether your deposit was protected"
            value={inp.deposit}
            onPick={(v) => set("deposit", v)}
            options={[
              { id: "protected", label: "Yes, I got a certificate" },
              { id: "not", label: "No" },
              { id: "unsure", label: "Not sure" },
              { id: "none", label: "I didn't pay a deposit" },
            ]}
          />
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What would you like?</p>
          <Chips<Aim>
            label="What you'd like to happen"
            value={inp.aim}
            onPick={(v) => set("aim", v)}
            options={[
              { id: "stay", label: "To stay" },
              { id: "go", label: "To go, on a date that suits me" },
              { id: "unsure", label: "I don't know yet" },
            ]}
          />
          <div className="mt-5">
            <label htmlFor="notice-landlord-name" className="block text-sm text-[var(--foreground)] mb-2">
              Landlord&rsquo;s or agent&rsquo;s name, for the letters{" "}
              <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="notice-landlord-name"
              type="text"
              value={inp.landlordName}
              onChange={(e) => set("landlordName", e.target.value)}
              placeholder="e.g. Mr Jones, or Mill Lettings"
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? noticeHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {formal
              ? "Add the day the notice reached you and tick at least one ground. The read appears: whether the notice works, the earliest each step could come, and the letters to send."
              : "Say where the home is, who you rent from and what arrived. The read appears: whether the notice works, the earliest you could really have to leave, and the letters to send."}
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_NOTICE);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/**
 * The steps from here, down the page, with the earliest date each could come.
 * The date in the notice sits in the middle of the line, not at the end, which
 * is the whole point.
 */
function Timeline({ inp, read, today }: { inp: NoticeInputs; read: NoticeRead; today: string }) {
  const steps = timelineOf(inp, read, today);
  if (!steps.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What happens next, at the earliest</p>
      <ol className="mt-4 relative border-l-2 border-[var(--border)] ml-1.5 space-y-5">
        {steps.map((s, i) => {
          const last = i === steps.length - 1;
          const notice = s.title === "The date in the notice";
          return (
            <li key={s.title} className="pl-5 relative">
              <span
                aria-hidden="true"
                className={`absolute -left-[0.45rem] top-1 h-3 w-3 rounded-full border-2 ${
                  last
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : notice
                      ? "border-[var(--foreground)] bg-[var(--card)]"
                      : s.done
                        ? "border-[var(--muted)] bg-[var(--muted)]"
                        : "border-[var(--muted)] bg-[var(--card)]"
                }`}
              />
              <p className={`text-xs ${last ? "text-[var(--accent)] font-medium" : "text-[var(--muted)]"}`}>
                {letterDate(s.on)}
                {s.on === today ? " (today)" : ""}
              </p>
              <p
                className={`text-sm leading-snug ${
                  last ? "font-semibold text-[var(--accent)]" : "font-medium text-[var(--foreground)]"
                }`}
              >
                {s.title}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)] leading-relaxed">{s.note}</p>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Each date is the soonest the law allows. Courts are slower than that,
        so real dates are usually later.
      </p>
    </div>
  );
}

/** The arrears figure, as a bar: owed, the ground 8 line, and the gap. */
function ArrearsBar({ read }: { read: NoticeRead }) {
  const a = read.arrears;
  if (!a || !read.grounds.some((g) => g.id === "g8")) return null;
  const top = Math.max(a.owed, a.threshold) * 1.08 || 1;
  const pct = (v: number) => `${Math.min(100, (v / top) * 100)}%`;
  return (
    <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
      <p className={eyebrow}>The ground 8 line</p>
      <div className="relative mt-8 mb-3 h-3 rounded-full bg-[var(--border)]" aria-hidden="true">
        <span
          className="absolute left-0 top-0 h-3 rounded-full bg-[var(--accent)] opacity-80"
          style={{ width: pct(a.owed) }}
        />
        <span
          className="absolute -top-2 h-7 w-0.5 bg-[var(--foreground)]"
          style={{ left: pct(a.threshold) }}
        />
        <span
          className="absolute -top-7 -translate-x-1/2 text-xs font-medium text-[var(--foreground)] whitespace-nowrap"
          style={{ left: pct(a.threshold) }}
        >
          line {money(a.threshold)}
        </span>
      </div>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        You owe <span className="font-medium">{money(a.owed)}</span>.{" "}
        {a.meets ? (
          <>
            Pay <span className="font-semibold text-[var(--accent)]">{money(a.payToDrop)}</span>{" "}before
            the hearing, on top of the rent as it falls due, and you&rsquo;re under the line the court
            has to follow.
          </>
        ) : (
          <>That&rsquo;s under the line. Keep paying the rent as it falls due to stay there.</>
        )}
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: NoticeInputs; read: NoticeRead; today: string }) {
  const [copied, setCopied] = useState<string>("");
  const rule = noticeRule();
  const letters = noticeLetters(inp, read, today);
  const reminders = remindersOf(read, today, inp);
  const evidence = evidenceLines(inp, read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {noticeHeadline(inp, read)}
      </p>
      <ArrearsBar read={read} />
      <Timeline inp={inp} read={read} today={today} />
      <div className="mt-4 space-y-3">
        {noticeBody(inp, read, today)
          .split("\n\n")
          .map((para) => (
            <p key={para} className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
              {para}
            </p>
          ))}
      </div>

      {reminders.length ? (
        <button type="button" onClick={() => downloadIcs(inp, reminders)} className={`mt-4 ${action}`}>
          Add {reminders.length === 1 ? "the date" : `the ${reminders.length} dates`} to your calendar (.ics)
        </button>
      ) : null}

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`notice-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`notice-letter-${l.id}`}
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

      {evidence.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>What to keep together</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {evidence.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>Free help, and what&rsquo;s illegal</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          <li>
            The Housing Loss Prevention Advice Service gives free legal advice
            once you have a notice, with no means test, and has a duty adviser
            at court. Search &ldquo;find a legal aid adviser&rdquo; on GOV.UK
            and tick housing loss prevention.
          </li>
          <li>Shelter&rsquo;s helpline and Citizens Advice can check your notice.</li>
          <li>
            Changing the locks, removing your things, or cutting off gas,
            electricity or water to make you leave, without a court order, is
            illegal eviction and a criminal offence. Call the council&rsquo;s
            private renting team, and the police if you&rsquo;re locked out.
          </li>
        </ul>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Not legal advice. The notice periods are the ones most sources give
          for the May 2026 rules; check yours with an adviser.
        </p>
      </div>

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
            onClick={async () => setCopied((await copyText(noticeSummary(inp, read, today))) ? "all" : "no")}
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
      <Handoffs inp={inp} read={read} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: NoticeInputs; read: NoticeRead }) {
  const list: Handoff[] = [];
  if (read.arrears || inp.grounds.some((id) => GROUNDS.find((g) => g.id === id)?.arrears))
    list.push({
      href: withSubject("/debts", inp.what),
      label: "Other debts too?",
      note: "Rent comes first. See which of the rest to pay first, and what's a priority debt.",
    });
  list.push(
    {
      href: withSubject("/walkaway", inp.what),
      label: "Negotiating a leaving date?",
      note: "Set your line before you talk: what moving would really cost you, all in.",
    },
    {
      href: withSubject("/deposit", inp.what),
      label: "Moving out after all?",
      note: "Get the deposit back without losing it to unfair deductions.",
    },
    {
      href: withSubject("/bailiff", inp.what),
      label: "A bailiff's letter about a different debt?",
      note: "What enforcement agents can and can't do, and the fees they can charge.",
    },
  );
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
        <Link href="/writing/the-date-on-the-notice" className={link}>
          The date on the notice
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
function NoticeExample({ today }: { today: string }) {
  const ex = noticeExample(today);
  const read = readNotice(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        The rent on our flat is £950 a month. My hours were cut over the
        summer and we fell £3,100 behind. On {letterDate(ex.servedOn)} a Form
        3A came, on grounds 8, 10 and 11, with a date four weeks later. I
        read it as four weeks to find somewhere, and started looking at
        rooms.
      </p>
      <ArrearsBar read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {noticeHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The date was the earliest the landlord could apply to court, not a
          moving day; the earliest we could have been made to leave was{" "}
          {letterDate(read.earliestOut)}, and realistically months after
          that. Ground 8 is the one the court must follow, and it needs three
          months&rsquo; rent, £2,850, owed on the day of the hearing. We paid
          £251 from my sister&rsquo;s loan, kept the rent going and offered £100
          a month. The landlord agreed the plan rather than go to court, and
          the council&rsquo;s housing team helped us claim the housing
          element we&rsquo;d missed.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}notice.
      </p>
    </div>
  );
}
