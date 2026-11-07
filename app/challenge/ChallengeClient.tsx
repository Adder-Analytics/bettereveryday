"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import {
  ACTIVITIES,
  BENEFITS,
  BLANK_CHALLENGE,
  ENHANCED,
  ISSUES_FOR,
  STANDARD,
  appealChecklist,
  challengeBody,
  challengeExample,
  challengeHeadline,
  challengeLetters,
  challengeRule,
  challengeSummary,
  isISODate,
  letterDate,
  money,
  parseChallengeInputs,
  readChallenge,
  readPip,
  remindersOf,
  stepsOf,
  todayISO,
  type ActivityId,
  type Benefit,
  type ChallengeInputs,
  type ChallengeRead,
  type ChallengeRegion,
  type CompRead,
  type Issue,
  type PipRead,
  type Stage,
  type YesNo,
} from "../data/challenge";

/**
 * The DWP said no: challenge it? (/challenge)
 *
 * The instrument for a DWP benefit decision that went against you: PIP,
 * Universal Credit, ESA and the rest. A decision letter reads like the end of
 * the matter; it's a first draft, with two more goes built in (a mandatory
 * reconsideration, then an independent tribunal) and each gated by a
 * one-month deadline. The tool dates the deadline, shows the PIP points gap to
 * the standard and enhanced rates, says what's at stake and what usually
 * happens, and writes the letter or the grounds of appeal.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/challenge.ts` so it can be checked without a browser.
 */

const STORE_KEY = "challenge:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const selectClass =
  "w-full px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors";
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

function loadInputs(): ChallengeInputs {
  if (typeof window === "undefined") return BLANK_CHALLENGE;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseChallengeInputs(JSON.parse(raw)) : BLANK_CHALLENGE;
  } catch {
    return BLANK_CHALLENGE;
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

function downloadIcs(inp: ChallengeInputs, list: { on: string; title: string; body: string }[]): void {
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
        `UID:challenge-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(what ? `${r.title} (${what})` : r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/challenge`)}`,
        "BEGIN:VALARM",
        "TRIGGER:PT9H",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Benefit decision")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `benefit-decision-${list[list.length - 1].on}.ics`;
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
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  max?: string;
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

export default function ChallengeClient() {
  const [inp, setInp] = useState<ChallengeInputs>(BLANK_CHALLENGE);
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

  const set = <K extends keyof ChallengeInputs>(k: K, v: ChallengeInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));
  const setPoints = (col: "given" | "yours", id: ActivityId, v: string) =>
    setInp((prev) => {
      const next = { ...prev[col] };
      if (v === "") delete next[id];
      else next[id] = v;
      return { ...prev, [col]: next };
    });

  const read = useMemo(() => readChallenge(inp, today), [inp, today]);
  const dwp = inp.region === "gb" || (inp.region === "scot" && inp.benefit !== "" && inp.benefit !== "pip");
  const pip = dwp && inp.benefit === "pip";
  const issues = inp.benefit ? ISSUES_FOR[inp.benefit] : [];

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
        {showExample ? <ChallengeExample today={today} /> : null}
      </div>

      {/* ---- The benefit ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="challenge-what" className={`block ${eyebrow} mb-2`}>
          Which claim? <span className="normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <input
          id="challenge-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. my PIP claim, or Mum's Attendance Allowance"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where do you live?</p>
        <Chips<ChallengeRegion>
          label="Where you live"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "gb", label: "England or Wales" },
            { id: "scot", label: "Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        {inp.region === "gb" || inp.region === "scot" ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Which benefit is the decision about?</p>
            <Chips<Benefit>
              label="Which benefit"
              value={inp.benefit}
              onPick={(v) => setInp((prev) => ({ ...prev, benefit: v, issue: "" }))}
              cols={1}
              options={BENEFITS.map((b) => ({ id: b.id, label: b.label }))}
            />
          </>
        ) : null}
        {dwp && issues.length ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What did they decide?</p>
            <Chips<Issue>
              label="What they decided"
              value={inp.issue}
              onPick={(v) => set("issue", v)}
              cols={1}
              options={issues}
            />
          </>
        ) : null}
      </div>

      {/* ---- Where you are ---- */}
      {dwp ? (
        <div className={card}>
          <p className={eyebrow}>Where you are</p>
          <div className="mt-3">
            <Chips<Stage>
              label="Where you are"
              value={inp.stage}
              onPick={(v) => set("stage", v)}
              cols={1}
              options={[
                { id: "decision", label: "I've got the decision letter" },
                { id: "waiting", label: "I've asked them to look again, and I'm waiting" },
                { id: "upheld", label: "They looked again and still said no (a mandatory reconsideration notice)" },
              ]}
            />
          </div>
          {inp.stage ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateField
                  id="challenge-decision"
                  label={inp.stage === "decision" ? "The date printed on the decision letter" : "The date on the original decision letter (optional)"}
                  value={inp.decisionOn}
                  max={today}
                  onChange={(v) => set("decisionOn", v)}
                  hint={inp.stage === "decision" ? "Not the day it arrived: the month counts from the printed date." : undefined}
                />
              {inp.stage === "waiting" ? (
                <DateField
                  id="challenge-asked"
                  label="The day you asked them to look again"
                  value={inp.askedOn}
                  max={today}
                  onChange={(v) => set("askedOn", v)}
                />
              ) : null}
              {inp.stage === "upheld" ? (
                <DateField
                  id="challenge-mr"
                  label="The date printed on the reconsideration notice"
                  value={inp.mrOn}
                  max={today}
                  onChange={(v) => set("mrOn", v)}
                  hint="The month to appeal counts from this date."
                />
              ) : null}
            </div>
          ) : null}
          {read && (read.status === "late" || read.status === "appealLate") ? (
            <div className="mt-4">
              <label htmlFor="challenge-late" className="block text-sm text-[var(--foreground)] mb-2">
                Why it&rsquo;s late, in a sentence <span className="text-[var(--muted)]">(for the letter)</span>
              </label>
              <input
                id="challenge-late"
                type="text"
                value={inp.lateReason}
                onChange={(e) => set("lateReason", e.target.value)}
                placeholder="e.g. I was in hospital for most of September"
                className={inputClass}
              />
            </div>
          ) : null}
          {inp.stage ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
                Do you have anything new to send: a letter from a doctor or support worker, a diary, a carer&rsquo;s note?
              </p>
              <Chips<YesNo>
                label="Whether you have new evidence"
                value={inp.evidence}
                onPick={(v) => set("evidence", v)}
                options={[
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "Not yet" },
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- PIP points ---- */}
      {pip && inp.stage ? <PointsCard inp={inp} setPoints={setPoints} /> : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? challengeHeadline(inp, read, today) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where you live, which benefit, and where you are with it. The
            read appears: your deadline, what&rsquo;s at stake, what usually
            happens, and the letter.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_CHALLENGE);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function PointsCard({
  inp,
  setPoints,
}: {
  inp: ChallengeInputs;
  setPoints: (col: "given" | "yours", id: ActivityId, v: string) => void;
}) {
  const p = readPip(inp);
  return (
    <div className={card}>
      <p className={eyebrow}>Your points</p>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        The decision letter lists each activity and the points they gave.
        Copy those into the first column. In the second, put what you think
        is right, only where it&rsquo;s higher; leave the rest blank. Not sure
        which descriptor fits? Citizens Advice and Benefits and Work list them
        all with their points.
      </p>
      {(["dl", "mob"] as const).map((c) => (
        <fieldset key={c} className="mt-5">
          <legend className="text-sm font-medium text-[var(--foreground)] mb-2">
            {c === "dl" ? "Daily living" : "Mobility"}
          </legend>
          <div className="hidden sm:grid grid-cols-[1fr_6rem_6rem] gap-2 text-xs text-[var(--muted)] mb-1">
            <span>Activity</span>
            <span>They gave</span>
            <span>You think</span>
          </div>
          <div className="space-y-2">
            {ACTIVITIES.filter((a) => a.component === c).map((a) => (
              <div key={a.id} className="grid grid-cols-2 sm:grid-cols-[1fr_6rem_6rem] gap-2 items-center">
                <span className="col-span-2 sm:col-span-1 text-sm text-[var(--foreground)] leading-snug">
                  {a.n}. {a.label}
                </span>
                <select
                  aria-label={`${a.label}: points they gave`}
                  value={inp.given[a.id] ?? ""}
                  onChange={(e) => setPoints("given", a.id, e.target.value)}
                  className={selectClass}
                >
                  <option value="">Gave –</option>
                  {a.points.map((n) => (
                    <option key={n} value={String(n)}>
                      Gave {n}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={`${a.label}: points you think apply`}
                  value={inp.yours[a.id] ?? ""}
                  onChange={(e) => setPoints("yours", a.id, e.target.value)}
                  className={selectClass}
                >
                  <option value="">You –</option>
                  {a.points.map((n) => (
                    <option key={n} value={String(n)}>
                      You {n}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      {p.entered ? <PointsBars pip={p} /> : null}
    </div>
  );
}

/** One bar per component, with the 8 and 12 lines marked. */
function PointsBars({ pip }: { pip: PipRead }) {
  return (
    <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
      <p className={eyebrow}>Against the lines</p>
      <div className="mt-4 space-y-5">
        <Bar c={pip.dl} label="Daily living" />
        <Bar c={pip.mob} label="Mobility" />
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        {STANDARD} points for the standard rate, {ENHANCED} for the enhanced.
        The solid bar is what they gave; the lighter part is your own count.
      </p>
    </div>
  );
}

function Bar({ c, label }: { c: CompRead; label: string }) {
  const top = 16;
  const pct = (v: number) => `${Math.min(100, (v / top) * 100)}%`;
  const extra = Math.max(0, c.yours - c.given);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-[var(--foreground)]">{label}</span>
        <span className="tabular-nums text-[var(--foreground)]">
          {c.given}
          {extra ? <span className="text-[var(--accent)] font-semibold"> → {c.yours}</span> : null}{" "}
          <span className="text-[var(--muted)]">
            ({c.yoursRate === "none" ? "no award" : `${c.yoursRate}, ${money(c.yoursWeekly)} a week`})
          </span>
        </span>
      </div>
      <div className="relative mt-1.5 h-3 rounded-full bg-[var(--border)]" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] opacity-30" style={{ width: pct(Math.max(c.given, c.yours)) }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]" style={{ width: pct(c.given) }} />
        <div className="absolute -inset-y-1 w-0.5 bg-[var(--foreground)]" style={{ left: pct(STANDARD) }} />
        <div className="absolute -inset-y-1 w-0.5 bg-[var(--foreground)]" style={{ left: pct(ENHANCED) }} />
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-[var(--muted)]" aria-hidden="true">
        <span className="absolute -translate-x-1/2" style={{ left: pct(STANDARD) }}>8</span>
        <span className="absolute -translate-x-1/2" style={{ left: pct(ENHANCED) }}>12</span>
      </div>
    </div>
  );
}

function Steps({ inp, read, today }: { inp: ChallengeInputs; read: ChallengeRead; today: string }) {
  const steps = stepsOf(inp, read, today);
  if (!steps.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The steps, with dates</p>
      <ol className="mt-4 relative border-l-2 border-[var(--border)] ml-1.5 space-y-5">
        {steps.map((s) => (
          <li key={`${s.title}-${s.on}`} className="pl-5 relative">
            <span
              aria-hidden="true"
              className={`absolute -left-[0.45rem] top-1 h-3 w-3 rounded-full border-2 ${
                s.key
                  ? "border-[var(--accent)] bg-[var(--accent)]"
                  : s.done
                    ? "border-[var(--muted)] bg-[var(--muted)]"
                    : "border-[var(--muted)] bg-[var(--card)]"
              }`}
            />
            <p className={`text-xs ${s.key ? "text-[var(--accent)] font-medium" : "text-[var(--muted)]"}`}>
              {s.approx ? "About " : ""}
              {letterDate(s.on)}
              {s.on === today ? " (today)" : ""}
              {s.passed ? " · passed" : ""}
            </p>
            <p
              className={`text-sm leading-snug ${
                s.key ? "font-semibold text-[var(--accent)]" : s.done ? "text-[var(--muted)]" : "font-medium text-[var(--foreground)]"
              }`}
            >
              {s.title}
            </p>
            {s.note ? <p className="mt-0.5 text-xs text-[var(--muted)] leading-relaxed">{s.note}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: ChallengeInputs; read: ChallengeRead; today: string }) {
  const [copied, setCopied] = useState<string>("");
  const rule = challengeRule();
  const letters = challengeLetters(inp, read, today);
  const reminders = remindersOf(inp, read, today);
  const appealing = read.status === "appeal" || read.status === "appealLate";
  const dwp = read.status !== "elsewhere";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {challengeHeadline(inp, read, today)}
      </p>
      {read.daysLeft !== null && read.daysLeft >= 0 && (read.status === "ask" || read.status === "appeal") ? (
        <DeadlineBox read={read} />
      ) : null}
      <div className="mt-4 space-y-3">
        {challengeBody(inp, read, today)
          .split("\n\n")
          .map((para) => (
            <p key={para} className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
              {para}
            </p>
          ))}
      </div>
      <Steps inp={inp} read={read} today={today} />

      {reminders.length ? (
        <button type="button" onClick={() => downloadIcs(inp, reminders)} className={`mt-4 ${action}`}>
          Add {reminders.length === 1 ? "the date" : `the ${reminders.length} dates`} to your calendar (.ics)
        </button>
      ) : null}

      {appealing ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>Before you start the appeal form</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {appealChecklist(inp).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`challenge-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`challenge-letter-${l.id}`}
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

      {dwp ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>Free help</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            <li>
              Citizens Advice and local welfare rights services can check your
              letter, and some will come to the hearing with you, for free.
            </li>
            <li>
              Disability charities for your condition often have benefits
              advisers who know which descriptors are usually missed.
            </li>
            <li>
              If money is short while you wait, ask about a hardship payment
              (Universal Credit), a budgeting advance, or your council&rsquo;s
              local welfare scheme.
            </li>
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            Not legal advice. Rates are the weekly PIP rates from 6 April 2026;
            the success figures are the latest published quarters. The rules
            for PIP may change after the Timms Review, but only with new law.
          </p>
        </div>
      ) : null}

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
            onClick={async () => setCopied((await copyText(challengeSummary(inp, read, today))) ? "all" : "no")}
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

/** The deadline, big: the one number that decides whether the next step exists. */
function DeadlineBox({ read }: { read: ChallengeRead }) {
  const left = read.daysLeft ?? 0;
  const total = 30;
  const pct = Math.max(2, Math.min(100, ((total - Math.min(total, left)) / total) * 100));
  return (
    <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
      <p className={eyebrow}>{read.status === "ask" ? "The month to ask" : "The month to appeal"}</p>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="text-sm text-[var(--foreground)]">Last day: {letterDate(read.dueOn)}</span>
        <span className="text-lg font-semibold text-[var(--accent)] tabular-nums">
          {left === 0 ? "today" : `${left} ${left === 1 ? "day" : "days"} left`}
        </span>
      </div>
      <div className="mt-2 h-3 rounded-full bg-[var(--border)]" aria-hidden="true">
        <div className="h-3 rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        Miss it and a late request is still possible, with a reason, up to{" "}
        {letterDate(read.outerOn)}. Inside the month, you don&rsquo;t need one.
      </p>
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp }: { inp: ChallengeInputs }) {
  const list: Handoff[] = [];
  if (inp.issue === "overpayment" || inp.issue === "sanction" || inp.benefit === "uc")
    list.push({
      href: withSubject("/debts", inp.what),
      label: "Money short while you wait?",
      note: "See which bills come first, and which can wait.",
    });
  list.push({
    href: withSubject("/collector", inp.what),
    label: "A letter about an old debt too?",
    note: "Check whether you still owe it before you pay a penny.",
  });
  if (inp.benefit === "uc" || inp.issue === "overpayment")
    list.push({
      href: withSubject("/notice", inp.what),
      label: "Behind on rent because of it?",
      note: "If a notice to leave arrives, check it: arrears caused only by a Universal Credit delay don't count towards the mandatory ground.",
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
        <Link href="/writing/the-first-no-is-a-draft" className={link}>
          The first no is a draft
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
function ChallengeExample({ today }: { today: string }) {
  const ex = challengeExample(today);
  const read = readChallenge(ex, today);
  if (!read || !read.pip) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        My first PIP claim came back with 6 points for daily living and 4 for
        mobility: nothing. The letter read like the end of it. The assessment
        had lasted forty minutes, and the report said I could walk 50 metres
        because I&rsquo;d walked from the waiting room. It didn&rsquo;t say I
        sat on the stairs for ten minutes afterwards.
      </p>
      <PointsBars pip={read.pip} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {challengeHeadline(ex, read, today)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          I rang for the assessment report that afternoon and sent the
          reconsideration a week later, three activities, each with what
          happens when I try. My physio wrote half a page about the walking.
          The reconsideration still said no. I appealed the same week, and at
          the hearing the doctor on the panel asked me about the stairs. The
          award came through at the standard rate of both, backdated to the
          claim.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}letter.
      </p>
    </div>
  );
}
