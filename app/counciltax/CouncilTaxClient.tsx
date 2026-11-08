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
  BLANK_CT,
  actDate,
  ctBody,
  ctExample,
  ctHeadline,
  ctLetters,
  ctReminders,
  ctRule,
  ctSummary,
  householdLines,
  isISODate,
  letterDate,
  money,
  parseCtInputs,
  readCt,
  todayISO,
  type CtBand,
  type CtCanPay,
  type CtInputs,
  type CtInstalments,
  type CtOnBill,
  type CtRead,
  type CtRegion,
  type CtStage,
  type YesNo,
} from "../data/counciltax";

/**
 * Behind on council tax: what happens next? (/counciltax)
 *
 * The instrument for a council tax reminder, final notice, summons or
 * liability order, and for a bill that may be counting someone who doesn't
 * count. The call turns on the stage: one missed instalment, left past the
 * reminder's seven days, makes the rest of the year due at once, so the tool
 * shows that cliff in money, dates the step that avoids it, and writes the
 * letter. The household check runs alongside, because a missing discount is
 * often the cheapest money in the whole situation.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/counciltax.ts` so it can be checked without a browser.
 */

const STORE_KEY = "counciltax:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £1,960.";

function loadInputs(): CtInputs {
  if (typeof window === "undefined") return BLANK_CT;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseCtInputs(JSON.parse(raw)) : BLANK_CT;
  } catch {
    return BLANK_CT;
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
        `UID:counciltax-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/counciltax`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P2D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Council tax")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `council-tax-${list[list.length - 1].on}.ics`;
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
  cols?: 1 | 2 | 4;
}) {
  const grid =
    cols === 4 ? "grid-cols-4" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
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

const ADULT_OPTIONS = [
  { id: "1", label: "1" },
  { id: "2", label: "2" },
  { id: "3", label: "3" },
  { id: "4", label: "4+" },
];

export default function CouncilTaxClient() {
  const [inp, setInp] = useState<CtInputs>(BLANK_CT);
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

  const set = <K extends keyof CtInputs>(k: K, v: CtInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readCt(inp, today), [inp, today]);
  const here = inp.region === "england" || inp.region === "wales";
  const pastBill = inp.stage !== "" && inp.stage !== "bill" && inp.stage !== "bailiff";
  const adults = Number(inp.adults) || 0;
  const notCountedOptions = Array.from({ length: adults + 1 }, (_, i) => ({
    id: String(i),
    label: i === adults && inp.adults === "4" ? `${i}+` : String(i),
  }));

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
        {showExample ? <CtExample today={today} /> : null}
      </div>

      {/* ---- Where, and which letter ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--foreground)] mb-2">Where is the home?</p>
        <Chips<CtRegion>
          label="Where the home is"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "england", label: "England" },
            { id: "wales", label: "Wales" },
            { id: "scot", label: "Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        {here ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What&rsquo;s the latest you&rsquo;ve had?</p>
            <Chips<CtStage>
              label="The latest letter or step"
              value={inp.stage}
              onPick={(v) => set("stage", v)}
              cols={1}
              options={[
                { id: "bill", label: "Just the bill: I'm up to date, and want to check it" },
                { id: "missed", label: "I've missed a payment, but no letter yet" },
                { id: "reminder", label: "A reminder notice" },
                { id: "final", label: "A final notice, or a letter saying I've lost the right to pay monthly" },
                { id: "summons", label: "A summons to the magistrates' court" },
                { id: "order", label: "A liability order, or a letter about taking it from my pay or benefits" },
                { id: "bailiff", label: "A notice of enforcement from bailiffs" },
              ]}
            />
            {inp.stage === "reminder" || inp.stage === "final" ? (
              <div className="mt-4">
                <label htmlFor="ct-letter-on" className="block text-sm text-[var(--foreground)] mb-2">
                  Date printed on the {inp.stage === "reminder" ? "reminder" : "final notice"}
                </label>
                <input
                  id="ct-letter-on"
                  type="date"
                  value={inp.letterOn}
                  max={today}
                  onChange={(e) => set("letterOn", e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                  The days run from the date on the letter, not the day it arrived.
                </p>
              </div>
            ) : null}
            {inp.stage === "summons" ? (
              <div className="mt-4">
                <label htmlFor="ct-hearing-on" className="block text-sm text-[var(--foreground)] mb-2">
                  Date of the hearing on the summons
                </label>
                <input
                  id="ct-hearing-on"
                  type="date"
                  value={inp.hearingOn}
                  onChange={(e) => set("hearingOn", e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : null}
            {inp.stage && inp.stage !== "bailiff" ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ct-what" className="block text-sm text-[var(--foreground)] mb-2">
                    What it&rsquo;s about <span className="text-[var(--muted)]">(optional)</span>
                  </label>
                  <input
                    id="ct-what"
                    type="text"
                    value={inp.what}
                    onChange={(e) => set("what", e.target.value)}
                    placeholder="e.g. council tax 2026/27"
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
                <div>
                  <label htmlFor="ct-council" className="block text-sm text-[var(--foreground)] mb-2">
                    The council <span className="text-[var(--muted)]">(optional)</span>
                  </label>
                  <input
                    id="ct-council"
                    type="text"
                    value={inp.council}
                    onChange={(e) => set("council", e.target.value)}
                    placeholder="e.g. Leeds City Council"
                    className={inputClass}
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {/* ---- The money ---- */}
      {here && inp.stage && inp.stage !== "bailiff" ? (
        <div className={card}>
          <p className={eyebrow}>The bill</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ct-annual" className="block text-sm text-[var(--foreground)] mb-2">
                This year&rsquo;s bill <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="ct-annual"
                type="text"
                inputMode="decimal"
                value={inp.annual}
                onChange={(e) => set("annual", e.target.value)}
                placeholder="e.g. £1,960"
                aria-invalid={moneyInvalid(inp.annual)}
                className={inputClass}
              />
              {moneyInvalid(inp.annual) ? <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p> : null}
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                The total for the year, after any discount already on it.
              </p>
            </div>
            <div>
              <label htmlFor="ct-paid" className="block text-sm text-[var(--foreground)] mb-2">
                Paid so far this year <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="ct-paid"
                type="text"
                inputMode="decimal"
                value={inp.paid}
                onChange={(e) => set("paid", e.target.value)}
                placeholder="e.g. £1,176"
                aria-invalid={moneyInvalid(inp.paid)}
                className={inputClass}
              />
              {moneyInvalid(inp.paid) ? <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p> : null}
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Paying over</p>
          <Chips<CtInstalments>
            label="Number of instalments"
            value={inp.instalments}
            onPick={(v) => set("instalments", v)}
            options={[
              { id: "10", label: "10 months (the usual)" },
              { id: "12", label: "12 months" },
            ]}
          />
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">
            Band <span className="text-[var(--muted)]">(on the bill; optional)</span>
          </p>
          <div role="group" aria-label="Council tax band" className="flex flex-wrap gap-2">
            {(["A", "B", "C", "D", "E", "F", "G", "H", ...(inp.region === "wales" ? ["I"] : []), "unsure"] as CtBand[]).map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={inp.band === b}
                onClick={() => set("band", b)}
                className={`${chipBase} ${inp.band === b ? chipOn : chipOff}`}
              >
                {b === "unsure" ? "Not sure" : b}
              </button>
            ))}
          </div>

          <p className={`mt-6 ${eyebrow}`}>Who lives there</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Adults (18 and over) living there, including you</p>
          <Chips<string>
            label="Number of adults"
            value={inp.adults}
            onPick={(v) => setInp((prev) => ({ ...prev, adults: v, notCounted: Number(prev.notCounted) > Number(v) ? "" : prev.notCounted }))}
            cols={4}
            options={ADULT_OPTIONS}
          />
          {inp.adults ? (
            <>
              <p className="mt-4 text-sm text-[var(--foreground)] mb-1">How many of them are any of these?</p>
              <ul className="mb-2 text-xs text-[var(--muted)] leading-relaxed list-disc pl-5 space-y-0.5">
                <li>a full-time student, or a student nurse</li>
                <li>an apprentice, or under 25 on government-funded training</li>
                <li>18 or 19 and still at school or college</li>
                <li>a carer living with the person they look after, 35+ hours a week (not their partner, or the parent of a child)</li>
                <li>someone with a severe mental impairment (dementia, a severe learning disability, a stroke&rsquo;s effects) with a qualifying benefit</li>
                <li>living in a care home or hospital, or in prison</li>
              </ul>
              <Chips<string>
                label="How many don't count"
                value={inp.notCounted}
                onPick={(v) => set("notCounted", v)}
                cols={4}
                options={notCountedOptions}
              />
              {inp.notCounted !== "" && Number(inp.notCounted) >= adults ? (
                <>
                  <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Are all of them full-time students?</p>
                  <Chips<YesNo>
                    label="Whether everyone is a full-time student"
                    value={inp.allStudents}
                    onPick={(v) => set("allStudents", v)}
                    options={[
                      { id: "yes", label: "Yes" },
                      { id: "no", label: "No" },
                    ]}
                  />
                </>
              ) : null}
            </>
          ) : null}
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">What discount does the bill show now?</p>
          <Chips<CtOnBill>
            label="The discount on the bill"
            value={inp.onBill}
            onPick={(v) => set("onBill", v)}
            options={[
              { id: "none", label: "None" },
              { id: "25", label: "25% (single person)" },
              { id: "50", label: "50%" },
              { id: "exempt", label: "Exempt" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">
            Does a disabled person living there need a room, an extra bathroom
            or kitchen, or space to use a wheelchair indoors?
          </p>
          <Chips<YesNo>
            label="Whether a disabled resident needs a room or space"
            value={inp.disabled}
            onPick={(v) => set("disabled", v)}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
            ]}
          />
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Are you on benefits or a low income?</p>
          <Chips<YesNo>
            label="Whether you're on benefits or a low income"
            value={inp.lowIncome}
            onPick={(v) => set("lowIncome", v)}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
            ]}
          />
          {pastBill ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Could you pay what&rsquo;s owed?</p>
              <Chips<CtCanPay>
                label="Whether you could pay"
                value={inp.canPay}
                onPick={(v) => set("canPay", v)}
                cols={1}
                options={[
                  { id: "all", label: "Yes, without missing rent or other bills" },
                  { id: "plan", label: "In instalments I could keep to" },
                  { id: "none", label: "Not at the moment" },
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? ctHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where the home is and the latest letter you&rsquo;ve had. The
            read appears: the date that keeps your instalments or the step
            that&rsquo;s coming, what it would add, whether the bill is
            missing a discount, and the letter to send.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_CT);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/**
 * The cliff: one missed instalment beside what falls due if the instalments
 * go. The bars are drawn to scale, because the scale is the point.
 */
function Cliff({ read }: { read: CtRead }) {
  if (read.instalment === null || read.balance === null || read.balance <= read.instalment) return null;
  if (read.status !== "missed" && read.status !== "reminder" && read.status !== "final") return null;
  const lost = read.status === "final";
  const pct = Math.max(4, Math.round((read.instalment / read.balance) * 100));
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>{lost ? "What changed" : "The cliff"}</p>
      <div className="mt-3 space-y-3">
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-[var(--foreground)]">{lost ? "What was due each month" : "Pay the missed instalment"}</span>
            <span className="font-medium tabular-nums text-[var(--foreground)]">{money(read.instalment)}</span>
          </div>
          <div className="mt-1 h-3 rounded bg-[var(--border)]/40" aria-hidden>
            <div className="h-3 rounded bg-[var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-[var(--foreground)]">{lost ? "What's due now" : "Or the rest of the year, at once"}</span>
            <span className="font-medium tabular-nums text-[var(--foreground)]">{money(read.balance)}</span>
          </div>
          <div className="mt-1 h-3 rounded bg-[var(--foreground)]/70" aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        {lost
          ? "Getting the instalments back is worth asking for: it turns the bottom bar back into the top one."
          : `Same debt, ${Math.round(read.balance / read.instalment)} times the bill, a week apart. The difference is whether the reminder gets an answer.`}
      </p>
    </div>
  );
}

/** The steps, with where you are marked. */
function Ladder({ read }: { read: CtRead }) {
  if (read.status === "elsewhere") return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The steps, and what each adds</p>
      <ol className="mt-3 space-y-0">
        {read.ladder.map((r, i) => {
          const isHere = i === read.here;
          const past = i < read.here;
          return (
            <li
              key={r.id}
              aria-current={isHere ? "step" : undefined}
              className={`relative pl-6 pb-3 last:pb-0 border-l-2 ml-1.5 ${past || isHere ? "border-[var(--accent)]" : "border-[var(--border)]"}`}
            >
              <span
                aria-hidden
                className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 ${isHere ? "bg-[var(--accent)] border-[var(--accent)]" : past ? "bg-[var(--card)] border-[var(--accent)]" : "bg-[var(--card)] border-[var(--border)]"}`}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className={isHere ? "font-semibold text-[var(--foreground)]" : past ? "text-[var(--muted)]" : "text-[var(--foreground)]"}>
                  {r.label}
                  {isHere ? <span className="ml-2 text-xs font-medium text-[var(--accent)]">you are here</span> : null}
                </span>
                <span className={`text-xs tabular-nums ${isHere ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>{r.cost}</span>
              </div>
              {isHere || i === read.here + 1 ? (
                <p className="mt-0.5 text-xs text-[var(--muted)] leading-relaxed">{r.detail}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: CtInputs; read: CtRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = ctRule();
  const letters = ctLetters(inp, read);
  const reminders = ctReminders(read, today);
  const household = householdLines(inp, read);
  const showDate = read.actBy && !read.actPassed && (read.status === "reminder" || read.status === "final" || read.status === "summons");
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{ctHeadline(inp, read)}</p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{ctBody(inp, read)}</p>

      {showDate ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>
            {read.status === "reminder" ? "Pay or write by" : read.status === "final" ? "The final notice runs out" : "The hearing"}
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{actDate(read.actBy)}</p>
          {reminders.length ? (
            <button type="button" onClick={() => downloadIcs(reminders)} className={`mt-2 ${action}`}>
              Add {reminders.length === 1 ? "it" : "the dates"} to your calendar (.ics)
            </button>
          ) : null}
        </div>
      ) : null}

      <Cliff read={read} />
      <Ladder read={read} />

      {household.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>Is the bill right?</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {household.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`ct-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`ct-letter-${l.id}`}
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
        Not legal advice. Free, confidential debt advice: National Debtline,
        StepChange and Citizens Advice in England, Wales and Scotland, and
        Advice NI in Northern Ireland. They can talk to the council for you
        and apply for Breathing Space. If the council won&rsquo;t deal with
        you fairly, complain to it, then to the Local Government and Social
        Care Ombudsman (England) or the Public Services Ombudsman for Wales.
        A dispute about the band itself goes to the Valuation Office Agency.
      </p>

      {read.status !== "elsewhere" ? (
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
              onClick={async () => setCopied((await copyText(ctSummary(inp, read))) ? "all" : "no")}
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
      <Handoffs inp={inp} read={read} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: CtInputs; read: CtRead }) {
  const list: Handoff[] = [];
  const subject = inp.what.trim() || "council tax";
  if (read.status === "bailiff" || read.status === "order")
    list.push({
      href: withSubject("/bailiff", subject),
      label: read.status === "bailiff" ? "Date the first visit and check the fees" : "If a bailiff's letter comes",
      note: "The bailiff tool dates the first day one can call and writes the offer to send before it.",
    });
  if (read.status !== "check" && read.status !== "elsewhere")
    list.push({
      href: withSubject("/debts", subject),
      label: "Other debts as well?",
      note: "Council tax comes before cards and loans, because of what can follow. Put the rest side by side.",
    });
  if (inp.lowIncome === "yes")
    list.push({
      href: withSubject("/challenge", subject),
      label: "A benefit decision went against you too?",
      note: "Council Tax Reduction often depends on the same income. The DWP tool dates the one-month deadline.",
    });
  list.push({
    href: withSubject("/scam", subject),
    label: "A text or call about a council tax refund or arrears?",
    note: "Check it before you click or pay. Councils don't text links asking for card details.",
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
        <Link href="/writing/the-whole-year-falls-due" className={link}>
          The whole year falls due
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
function CtExample({ today }: { today: string }) {
  const ex = ctExample(today);
  const read = readCt(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        The bill is £1,960 over ten months, and I&rsquo;d paid six. This month
        the car needed tyres, so the £196 didn&rsquo;t go out. A reminder came,
        dated {letterDate(ex.letterOn)}. My daughter lives with me and is at
        university full time, and the bill has never shown a discount.
      </p>
      <Cliff read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{ctHeadline(ex, read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          I emailed the council the same day, asking to spread the missed £196
          over the three months left. Then I sent the second letter, with her
          student certificate: with only one adult who counts, the bill should
          have had 25% off all along. They agreed the plan, applied the
          discount from when she started her course and credited the
          difference, which more than covered the month I&rsquo;d missed.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}letter.
      </p>
    </div>
  );
}
