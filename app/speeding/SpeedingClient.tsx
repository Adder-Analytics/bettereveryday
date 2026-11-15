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
  BLANK_SPEEDING,
  datesOf,
  driverLine,
  fourteenDayLine,
  isISODate,
  keepList,
  letterDate,
  messageOf,
  parseSpeedingInputs,
  pointsInvalid,
  readSpeeding,
  remindersOf,
  routeLabel,
  rungsOf,
  speedInvalid,
  speedingBody,
  speedingExample,
  speedingHeadline,
  speedingRule,
  speedingSummary,
  todayISO,
  type DateLine,
  type Drove,
  type Keeper,
  type Limit,
  type Nation,
  type SpeedingInputs,
  type SpeedingRead,
  type Stage,
  type YesNo,
} from "../data/speeding";

/**
 * A speeding letter: what now, and by when? (/speeding)
 *
 * The instrument for a camera flash or a Notice of Intended Prosecution. The
 * speed decides the likely outcome (nothing, a course, a fixed penalty or
 * court), but the form that comes with the notice decides more: not naming
 * the driver within 28 days is 6 points and up to £1,000 on its own. So the
 * tool puts every answer's price side by side, with doing nothing last, checks
 * the 14 days, counts points against the new-driver and totting-up limits,
 * and dates the form.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/speeding.ts` so it can be checked without a browser.
 */

const STORE_KEY = "speeding:v1";

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

function loadInputs(): SpeedingInputs {
  if (typeof window === "undefined") return BLANK_SPEEDING;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseSpeedingInputs(JSON.parse(raw)) : BLANK_SPEEDING;
  } catch {
    return BLANK_SPEEDING;
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
        `UID:speeding-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/speeding`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P5D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Speeding letter")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "speeding-dates.ics";
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

export default function SpeedingClient() {
  const [inp, setInp] = useState<SpeedingInputs>(BLANK_SPEEDING);
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

  const set = <K extends keyof SpeedingInputs>(k: K, v: SpeedingInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readSpeeding(inp, today), [inp, today]);
  const early = inp.stage === "flashed" || inp.stage === "nip";
  const later = inp.stage === "course" || inp.stage === "fpn" || inp.stage === "court";

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
        {showExample ? <SpeedingExample today={today} /> : null}
      </div>

      {/* ---- The offence ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="speeding-what" className={`block ${eyebrow} mb-2`}>
          Which car?
        </label>
        <input
          id="speeding-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="The registration, or e.g. the Corsa"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where was it?</p>
        <Chips<Nation>
          label="Where it happened"
          value={inp.nation}
          onPick={(v) => set("nation", v)}
          options={[
            { id: "ew", label: "England or Wales" },
            { id: "scot", label: "Scotland" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What&rsquo;s happened so far?</p>
        <Chips<Stage>
          label="What's arrived"
          value={inp.stage}
          onPick={(v) => set("stage", v)}
          cols={1}
          options={[
            { id: "flashed", label: "A camera flashed, or I was stopped, and nothing's come yet" },
            { id: "nip", label: "A Notice of Intended Prosecution with a form asking who was driving" },
            { id: "course", label: "An offer of a speed awareness course" },
            { id: "fpn", label: "An offer of a fixed penalty (£100 and 3 points)" },
            { id: "court", label: "Court papers (a Single Justice Procedure notice, a summons or a citation)" },
          ]}
        />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DateField
            id="speeding-offence"
            label="Date of the offence"
            value={inp.offenceOn}
            max={today}
            onChange={(v) => set("offenceOn", v)}
            hint={inp.stage === "flashed" ? "Your best memory of the day." : "On the notice."}
          />
          <div>
            <label htmlFor="speeding-speed" className="block text-sm text-[var(--foreground)] mb-2">
              Speed {inp.stage === "flashed" ? "you think you were doing" : "on the notice"} (mph)
            </label>
            <input
              id="speeding-speed"
              type="text"
              inputMode="numeric"
              value={inp.speed}
              onChange={(e) => set("speed", e.target.value)}
              placeholder="e.g. 37"
              aria-invalid={speedInvalid(inp.speed)}
              className={inputClass}
            />
            {speedInvalid(inp.speed) ? (
              <p className="mt-1.5 text-xs text-[var(--muted)]">A whole number of miles an hour, like 37.</p>
            ) : null}
          </div>
        </div>
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">The speed limit</p>
        <Chips<Limit>
          label="Speed limit"
          value={inp.limit}
          onPick={(v) => set("limit", v)}
          cols={3}
          options={[
            { id: "20", label: "20" },
            { id: "30", label: "30" },
            { id: "40", label: "40" },
            { id: "50", label: "50" },
            { id: "60", label: "60" },
            { id: "70", label: "70" },
          ]}
        />
      </div>

      {/* ---- The notice ---- */}
      {inp.stage ? (
        <div className={card}>
          <p className={eyebrow}>The notice, and who was driving</p>
          {inp.stage !== "flashed" || later ? (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inp.stage !== "flashed" ? (
                <DateField
                  id="speeding-nip"
                  label="Date printed on the first notice (optional)"
                  value={inp.nipOn}
                  max={today}
                  onChange={(v) => set("nipOn", v)}
                  hint="The Notice of Intended Prosecution. It decides the 14 days and the 28."
                />
              ) : null}
              {later ? (
                <DateField
                  id="speeding-letter"
                  label={inp.stage === "court" ? "Date on the court papers" : "Date on the offer letter"}
                  value={inp.letterOn}
                  max={today}
                  onChange={(v) => set("letterOn", v)}
                />
              ) : null}
            </div>
          ) : null}
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Who was the notice sent to?</p>
          <Chips<Keeper>
            label="Who the notice was sent to"
            value={inp.keeper}
            onPick={(v) => set("keeper", v)}
            cols={1}
            options={[
              { id: "me", label: "Me, as the registered keeper, at the address on the logbook" },
              { id: "oldaddress", label: "Me as keeper, but the logbook (V5C) had an old address" },
              { id: "named", label: "Me, because the keeper named me (a company, lease or hire car, or someone else's)" },
            ]}
          />
          {early ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Who was driving?</p>
              <Chips<Drove>
                label="Who was driving"
                value={inp.drove}
                onPick={(v) => set("drove", v)}
                options={[
                  { id: "me", label: "Me" },
                  { id: "other", label: "Someone else, and I know who" },
                  { id: "unsure", label: "I'm not sure: the car's shared" },
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- The licence ---- */}
      {inp.stage && inp.nation ? (
        <div className={card}>
          <p className={eyebrow}>The licence</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="speeding-points" className="block text-sm text-[var(--foreground)] mb-2">
                Points on the licence now
              </label>
              <input
                id="speeding-points"
                type="text"
                inputMode="numeric"
                value={inp.points}
                onChange={(e) => set("points", e.target.value)}
                placeholder="0"
                aria-invalid={pointsInvalid(inp.points)}
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                {pointsInvalid(inp.points)
                  ? "A whole number, like 3."
                  : "From offences in the last three years. Check at gov.uk/view-driving-licence."}
              </p>
            </div>
            <div>
              <label htmlFor="speeding-weekly" className="block text-sm text-[var(--foreground)] mb-2">
                Take-home pay a week <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="speeding-weekly"
                type="text"
                inputMode="decimal"
                value={inp.weekly}
                onChange={(e) => set("weekly", e.target.value)}
                placeholder="e.g. £520"
                aria-invalid={moneyInvalid(inp.weekly)}
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                {moneyInvalid(inp.weekly)
                  ? "Couldn't read that as an amount. Try something like £520."
                  : "After tax and National Insurance. Only used to estimate a court fine."}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            Did you pass your first driving test less than two years before the offence?
          </p>
          <Chips<YesNo>
            label="Whether you're a new driver"
            value={inp.newDriver}
            onPick={(v) => set("newDriver", v)}
            options={[
              { id: "no", label: "No" },
              { id: "yes", label: "Yes" },
            ]}
          />
          {inp.nation === "ew" ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
                Have you done a speed awareness course for an offence in the last three years?
              </p>
              <Chips<YesNo>
                label="Whether you've done a course recently"
                value={inp.course}
                onPick={(v) => set("course", v)}
                options={[
                  { id: "no", label: "No" },
                  { id: "yes", label: "Yes" },
                  { id: "unsure", label: "Not sure" },
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? speedingHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where it was, what&rsquo;s arrived, the date, the speed and the limit, who the notice went to and
            who was driving, and your points. The read appears: what this speed usually leads to, what each answer
            costs (including doing nothing), whether the notice was in time, and the dates.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_SPEEDING);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/** Every answer side by side, with doing nothing last. */
function Rungs({ inp, read }: { inp: SpeedingInputs; read: SpeedingRead }) {
  const rows = rungsOf(inp, read);
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What each answer costs</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.label} className="py-2.5 flex items-start justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className={`${r.you ? "font-semibold" : ""} ${r.worst ? "text-[var(--accent)] font-semibold" : "text-[var(--foreground)]"}`}>
                {r.label}
                {r.you ? " ←" : ""}
              </span>
              <span className="block text-[var(--foreground)] tabular-nums">{r.money}</span>
              <span className="block text-xs text-[var(--muted)]">{r.note}</span>
            </span>
            <span className="shrink-0 text-right font-medium text-[var(--foreground)] tabular-nums">
              {r.points} {r.points === "1" ? "point" : "points"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        The arrow is what this speed usually leads to. The last row isn&rsquo;t chosen by anyone: it&rsquo;s what
        an unanswered form becomes. Court fines here are after a third off for pleading guilty at the first chance.
      </p>
    </div>
  );
}

/** Twelve boxes: points now, what this could add, and the lines at 6 and 12. */
function PointsBar({ inp, read }: { inp: SpeedingInputs; read: SpeedingRead }) {
  const isNew = inp.newDriver === "yes";
  const now = read.pointsNow;
  const lo = now + read.adds[0];
  const hi = now + read.adds[1];
  const cells = Array.from({ length: 12 }, (_, i) => i + 1);
  const label = `${now} points now; this could take you to ${lo === hi ? hi : `between ${lo} and ${hi}`}. ${isNew ? "Six revokes a new driver's licence. " : ""}Twelve in three years usually means a six-month ban.`;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Your points</p>
      <div role="img" aria-label={label} className="mt-3 grid grid-cols-12 gap-1">
        {cells.map((n) => {
          const filled = n <= now;
          const could = !filled && n <= hi;
          const line = (isNew && n === 6) || n === 12;
          return (
            <div
              key={n}
              className={`h-5 rounded-sm border ${line ? "border-[var(--foreground)]" : "border-[var(--border)]"} ${
                filled ? "bg-[var(--foreground)]" : could ? "bg-[var(--accent)] opacity-70" : ""
              }`}
            />
          );
        })}
      </div>
      <div className="mt-1 grid grid-cols-12 gap-1 text-[10px] text-[var(--muted)] tabular-nums">
        {cells.map((n) => (
          <span key={n} className="text-center">
            {n === 6 && isNew ? "6" : n === 12 ? "12" : ""}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        {now} now{read.adds[1] > 0 ? `; this could add ${read.adds[0] === read.adds[1] ? read.adds[1] : `${read.adds[0]} to ${read.adds[1]}`}` : ""}.{" "}
        {read.revoke
          ? "As a new driver, 6 revokes your licence: back to a provisional and both tests again."
          : read.totting
            ? "Twelve within three years usually means at least a six-month ban."
            : isNew
              ? "As a new driver, 6 within two years of passing revokes your licence."
              : "Twelve within three years usually means at least a six-month ban."}{" "}
        Points from this would stop counting on {letterDate(read.countsUntil)}.
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: SpeedingInputs; read: SpeedingRead; today: string }) {
  const [copied, setCopied] = useState<"" | "msg" | "line" | "all" | "no">("");
  const rule = speedingRule();
  const msg = messageOf(inp, read);
  const reminders = remindersOf(inp, read, today);
  const dates = datesOf(inp, read);
  const driver = inp.stage === "flashed" || inp.stage === "nip" ? driverLine(inp) : "";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{speedingHeadline(inp, read)}</p>
      <p className="mt-3 text-sm font-medium text-[var(--foreground)]">Likely at this speed: {routeLabel(read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{speedingBody(inp, read)}</p>

      <Rungs inp={inp} read={read} />

      {driver ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>The driver form</p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">{driver}</p>
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>The 14 days</p>
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">{fourteenDayLine(inp, read)}</p>
        {inp.stage !== "flashed" ? (
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            The 14 days don&rsquo;t apply if you were warned at the roadside or there was an accident you knew about.
            Most other &ldquo;technicalities&rdquo; people read about online fail in court and cost more than the
            fixed penalty would have.
          </p>
        ) : null}
      </div>

      <PointsBar inp={inp} read={read} />

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
            Add {reminders.length === 1 ? "the deadline" : "the deadlines"} to your calendar (.ics)
          </button>
        ) : null}
      </div>

      {msg ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id="speeding-msg">{msg.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{msg.note}</p>
          <pre
            aria-labelledby="speeding-msg"
            className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
          >
            {msg.text}
          </pre>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(msg.text)) ? "msg" : "no")}
            className={`mt-3 ${action}`}
          >
            {copied === "msg" ? "Copied" : "Copy it"}
          </button>
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>What to keep together</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {keepList(inp).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. Police don&rsquo;t text or email for speeding fines: a message asking you to pay one
        through a link is a scam, so pay only through the address or website printed on the paper notice. If a
        ban is possible, or you&rsquo;re near 6 or 12 points, talk to a motoring solicitor before you reply; many
        give a free first call. Points must be declared to your insurer if they ask, and usually at renewal.
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
            onClick={async () => setCopied((await copyText(speedingSummary(inp, read))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole plan" : "Copy the whole plan as text"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words above instead.</p>
        ) : null}
      </div>
      <Handoffs inp={inp} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp }: { inp: SpeedingInputs }) {
  const list: Handoff[] = [
    {
      href: withSubject("/scam", inp.what),
      label: "A text or email about the fine?",
      note: "Police send speeding notices by post. Check a message before you click or pay.",
    },
    {
      href: withSubject("/parking", inp.what),
      label: "Is it really a council penalty charge?",
      note: "Bus lanes, yellow boxes and parking are a different system, with no points.",
    },
    {
      href: withSubject("/debts", inp.what),
      label: "Can't pay a court fine at once?",
      note: "Ask the court for time to pay, then see where it fits with what else you owe.",
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
        <Link href="/writing/when-silence-is-the-worst-answer" className={link}>
          When silence is the worst answer
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
function SpeedingExample({ today }: { today: string }) {
  const ex = speedingExample(today);
  const read = readSpeeding(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        A notice came for our shared car: 37 in a 30, on a road we both use. Neither of us remembered the camera.
        It was on the hall table for a week while we argued about who it was, and I half thought that if we
        couldn&rsquo;t say, they couldn&rsquo;t do anything.
      </p>
      <Rungs inp={ex} read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{speedingHeadline(ex, read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The speed was in the course band: about £90 and no points for whoever was driving. Leaving the form was
          the only answer that put 6 points on a licence, and it would have been mine, as the keeper. I asked the
          police for the photos. They showed my partner&rsquo;s coat, and the form went back with a week to spare.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}letter.
      </p>
    </div>
  );
}
