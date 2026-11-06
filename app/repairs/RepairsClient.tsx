"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import {
  BLANK_REPAIR,
  PROBLEMS,
  daysWords,
  evidenceLines,
  isISODate,
  letterDate,
  parseRepairInputs,
  readRepairs,
  remindersOf,
  repairBody,
  repairExample,
  repairHeadline,
  repairLetters,
  repairRule,
  repairSummary,
  stepsOf,
  todayISO,
  type Cause,
  type ProblemId,
  type RentState,
  type RepairInputs,
  type RepairLandlord,
  type RepairRead,
  type RepairRegion,
  type Since,
  type Told,
  type YesNo,
} from "../data/repairs";

/**
 * The landlord won't fix it: what now? (/repairs)
 *
 * The instrument for a repair the landlord hasn't done, in England. Its
 * centrepiece is two clocks side by side: how long you've lived with the
 * problem, and how long, on paper, the landlord has known. The first is the
 * one you feel; the second is the one every remedy counts from. Then it dates
 * the ladder (their reply-by, one chaser, the council or a complaint, the
 * ombudsman) and writes each letter. Social tenants get Awaab's Law's
 * statutory timescales; private tenants get deadlines the tool sets and says
 * it set.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/repairs.ts` so it can be checked without a browser.
 */

const STORE_KEY = "repairs:v1";

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

function loadInputs(): RepairInputs {
  if (typeof window === "undefined") return BLANK_REPAIR;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseRepairInputs(JSON.parse(raw)) : BLANK_REPAIR;
  } catch {
    return BLANK_REPAIR;
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

function downloadIcs(inp: RepairInputs, list: { on: string; title: string; body: string }[]): void {
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
        `UID:repairs-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(what ? `${r.title} (${what})` : r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/repairs`)}`,
        "BEGIN:VALARM",
        "TRIGGER:PT9H",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Repairs")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `repairs-${list[list.length - 1].on}.ics`;
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
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  optional?: boolean;
  max?: string;
  min?: string;
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
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {hint ? <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">{hint}</p> : null}
    </div>
  );
}

export default function RepairsClient() {
  const [inp, setInp] = useState<RepairInputs>(BLANK_REPAIR);
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

  const set = <K extends keyof RepairInputs>(k: K, v: RepairInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));
  const toggleProblem = (id: ProblemId) =>
    setInp((prev) => ({
      ...prev,
      problems: prev.problems.includes(id) ? prev.problems.filter((p) => p !== id) : [...prev.problems, id],
    }));

  const read = useMemo(() => readRepairs(inp, today), [inp, today]);
  const inEngland = inp.region === "eng";
  const tenant = inEngland && (inp.landlord === "private" || inp.landlord === "social");

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
        {showExample ? <RepairsExample today={today} /> : null}
      </div>

      {/* ---- The home ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="repairs-what" className={`block ${eyebrow} mb-2`}>
          Which home? <span className="normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <input
          id="repairs-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. the flat on Hope Street"
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
        <Chips<RepairRegion>
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
            <Chips<RepairLandlord>
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
      </div>

      {/* ---- The problem ---- */}
      {tenant ? (
        <div className={card}>
          <p className={eyebrow}>What needs fixing</p>
          <p className="mt-1 mb-3 text-xs text-[var(--muted)] leading-relaxed">Tick everything that applies.</p>
          <div role="group" aria-label="What needs fixing" className="grid grid-cols-1 gap-2">
            {PROBLEMS.map((p) => {
              const on = inp.problems.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleProblem(p.id)}
                  className={`${chipBase} ${on ? chipOn : chipOff}`}
                >
                  <span aria-hidden="true">{on ? "☑ " : "☐ "}</span>
                  {p.label}
                </button>
              );
            })}
          </div>
          {inp.problems.includes("gas") ? (
            <p className="mt-3 rounded-lg border border-[var(--accent)] p-3 text-sm text-[var(--foreground)] leading-relaxed">
              If you can smell gas <em>now</em>: get everyone out, don&rsquo;t
              use switches or flames, and call the National Gas Emergency
              Service on <a href="tel:08001119999" className={link}>0800 111 999</a>. It&rsquo;s free.
            </p>
          ) : null}
          <div className="mt-5">
            <label htmlFor="repairs-where" className="block text-sm text-[var(--foreground)] mb-2">
              Where in the home, in a few words <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="repairs-where"
              type="text"
              value={inp.where}
              onChange={(e) => set("where", e.target.value)}
              placeholder="e.g. the back bedroom wall and ceiling"
              className={inputClass}
            />
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            Does anyone at home have a health condition or disability, or is anyone very young, older or pregnant?
          </p>
          <Chips<YesNo>
            label="Whether anyone at home is especially at risk"
            value={inp.vulnerable}
            onPick={(v) => set("vulnerable", v)}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
            ]}
          />
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Did you, or a visitor, cause it?</p>
          <Chips<Cause>
            label="Whether you caused it"
            value={inp.cause}
            onPick={(v) => set("cause", v)}
            options={[
              { id: "no", label: "No" },
              { id: "me", label: "Yes" },
              { id: "unsure", label: "Not sure, or they say so" },
            ]}
          />
          <div className="mt-5">
            <DateField
              id="repairs-started"
              label="Roughly when it started"
              value={inp.startedOn}
              max={today}
              onChange={(v) => set("startedOn", v)}
              optional
            />
          </div>
        </div>
      ) : null}

      {/* ---- What you've told them ---- */}
      {tenant && inp.problems.length ? (
        <div className={card}>
          <p className={eyebrow}>What you&rsquo;ve told them</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Have you told the landlord or agent?</p>
          <Chips<Told>
            label="How you've told them"
            value={inp.told}
            onPick={(v) => set("told", v)}
            cols={1}
            options={[
              { id: "none", label: "Not yet" },
              { id: "spoken", label: "Only by phone, or in person" },
              { id: "written", label: "In writing: an email, a text, a letter, or their portal" },
            ]}
          />
          {inp.told === "spoken" || inp.told === "written" ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateField
                id="repairs-told"
                label="The first time you told them at all"
                value={inp.toldOn}
                max={today}
                onChange={(v) => set("toldOn", v)}
                optional
                hint="A call or at the door. A rough date is fine."
              />
              {inp.told === "written" ? (
                <DateField
                  id="repairs-written"
                  label="The first time in writing"
                  value={inp.writtenOn}
                  max={today}
                  onChange={(v) => set("writtenOn", v)}
                  hint="Check your sent emails or messages for the date."
                />
              ) : null}
            </div>
          ) : null}
          {inp.told === "written" ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What&rsquo;s happened since?</p>
              <Chips<Since>
                label="What's happened since"
                value={inp.since}
                onPick={(v) => set("since", v)}
                cols={1}
                options={[
                  { id: "nothing", label: "Nothing, or no reply" },
                  { id: "acknowledged", label: "They replied, but nothing's been done" },
                  { id: "visited", label: "Someone came to look, but didn't fix it" },
                  { id: "bodged", label: "It was patched or painted over, and it's come back" },
                  { id: "booked", label: "They've booked a date for the work" },
                ]}
              />
              {inp.since === "booked" ? (
                <div className="mt-4">
                  <DateField
                    id="repairs-booked"
                    label="The booked date"
                    value={inp.bookedOn}
                    onChange={(v) => set("bookedOn", v)}
                  />
                </div>
              ) : null}
              {inp.since !== "booked" ? (
                <div className="mt-4">
                  <DateField
                    id="repairs-chased"
                    label="The day you last chased it in writing"
                    value={inp.chasedOn}
                    min={inp.writtenOn || undefined}
                    max={today}
                    onChange={(v) => set("chasedOn", v)}
                    optional
                    hint="Leave it blank if you haven't chased it since the first report."
                  />
                </div>
              ) : null}
            </>
          ) : null}
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Is the rent up to date?</p>
          <Chips<RentState>
            label="Whether the rent is up to date"
            value={inp.rent}
            onPick={(v) => set("rent", v)}
            options={[
              { id: "paid", label: "Yes" },
              { id: "behind", label: "I'm behind" },
            ]}
          />
          <div className="mt-5">
            <label htmlFor="repairs-landlord-name" className="block text-sm text-[var(--foreground)] mb-2">
              Landlord&rsquo;s or agent&rsquo;s name, for the letters{" "}
              <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="repairs-landlord-name"
              type="text"
              value={inp.landlordName}
              onChange={(e) => set("landlordName", e.target.value)}
              placeholder="e.g. Ms Patel, or Hope Street Lettings"
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? repairHeadline(inp, read, today) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {tenant
              ? "Tick what needs fixing and say how you've told them. The read appears: how long they've known on paper, the date to give them, what comes next, and the letters."
              : "Say where the home is and who you rent from. The read appears: how long they've known on paper, the date to give them, what comes next, and the letters."}
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_REPAIR);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/**
 * The two clocks: how long you've lived with it, and how long they've known in
 * writing. The gap between them is the whole point.
 */
function TwoClocks({ read }: { read: RepairRead }) {
  const lived = read.livedDays;
  if (lived === null || read.status === "elsewhere" || read.status === "lodger") return null;
  const paper = read.paperDays;
  const top = Math.max(lived, paper, 1);
  const pct = (v: number) => `${Math.max(v > 0 ? 2 : 0, Math.min(100, (v / top) * 100))}%`;
  return (
    <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
      <p className={eyebrow}>Two clocks</p>
      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-[var(--foreground)]">You&rsquo;ve lived with it</span>
            <span className="font-medium text-[var(--foreground)] tabular-nums">{daysWords(lived)}</span>
          </div>
          <div className="mt-1.5 h-3 rounded-full bg-[var(--border)]" aria-hidden="true">
            <div className="h-3 rounded-full bg-[var(--foreground)] opacity-70" style={{ width: pct(lived) }} />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-[var(--foreground)]">On paper, they&rsquo;ve known</span>
            <span className="font-semibold text-[var(--accent)] tabular-nums">{daysWords(paper)}</span>
          </div>
          <div className="mt-1.5 h-3 rounded-full bg-[var(--border)]" aria-hidden="true">
            <div className="h-3 rounded-full bg-[var(--accent)]" style={{ width: pct(paper) }} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        The first is the one you feel. The second is the one the council, an
        ombudsman or a court will count from{read.status === "report" ? ", and it starts the day you write" : ""}.
      </p>
    </div>
  );
}

function Steps({ inp, read, today }: { inp: RepairInputs; read: RepairRead; today: string }) {
  const steps = stepsOf(inp, read, today);
  if (!steps.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The steps, with dates</p>
      <ol className="mt-4 relative border-l-2 border-[var(--border)] ml-1.5 space-y-5">
        {steps.map((s) => {
          const key = s.title.includes("writing");
          return (
            <li key={`${s.title}-${s.on}`} className="pl-5 relative">
              <span
                aria-hidden="true"
                className={`absolute -left-[0.45rem] top-1 h-3 w-3 rounded-full border-2 ${
                  key
                    ? "border-[var(--accent)] bg-[var(--accent)]"
                    : s.done
                      ? "border-[var(--muted)] bg-[var(--muted)]"
                      : "border-[var(--muted)] bg-[var(--card)]"
                }`}
              />
              <p className={`text-xs ${key ? "text-[var(--accent)] font-medium" : "text-[var(--muted)]"}`}>
                {letterDate(s.on)}
                {s.on === today ? " (today)" : ""}
                {s.passed ? " · passed" : ""}
              </p>
              <p
                className={`text-sm leading-snug ${
                  key ? "font-semibold text-[var(--accent)]" : s.done ? "text-[var(--muted)]" : "font-medium text-[var(--foreground)]"
                }`}
              >
                {s.title}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)] leading-relaxed">{s.note}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: RepairInputs; read: RepairRead; today: string }) {
  const [copied, setCopied] = useState<string>("");
  const rule = repairRule();
  const letters = repairLetters(inp, read, today);
  const reminders = remindersOf(inp, read, today);
  const evidence = evidenceLines(inp, read);
  const england = read.status !== "elsewhere" && read.status !== "lodger";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {repairHeadline(inp, read, today)}
      </p>
      <TwoClocks read={read} />
      <div className="mt-4 space-y-3">
        {repairBody(inp, read, today)
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

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`repairs-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`repairs-letter-${l.id}`}
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

      {england ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>Free help, and a warning</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            <li>Shelter&rsquo;s helpline and Citizens Advice can look at your letters and the next step, for free.</li>
            <li>
              Legal aid can cover a claim where the disrepair is a serious risk
              to someone&rsquo;s health or safety. Search &ldquo;check if you can
              get legal aid&rdquo; on GOV.UK.
            </li>
            <li>
              Firms that cold-call or message about &ldquo;no win, no fee&rdquo;
              disrepair claims can take a large share of any compensation. Talk
              to a free adviser before you sign anything.
            </li>
            {inp.landlord === "social" ? (
              <li>The Housing Ombudsman is free, and you can ask it for help at any stage, even before you complain.</li>
            ) : null}
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            Not legal advice. Awaab&rsquo;s Law dates are as most sources give
            them for social landlords; it doesn&rsquo;t cover private landlords
            yet.
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
            onClick={async () => setCopied((await copyText(repairSummary(inp, read, today))) ? "all" : "no")}
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

function Handoffs({ inp, read }: { inp: RepairInputs; read: RepairRead }) {
  const list: Handoff[] = [];
  if (inp.landlord === "private" || read.rentBehind)
    list.push({
      href: withSubject("/notice", inp.what),
      label: "A notice to leave has arrived?",
      note: "Check it before you pack: the form, the ground and the date.",
    });
  if (read.rentBehind)
    list.push({
      href: withSubject("/debts", inp.what),
      label: "Behind on the rent and other things?",
      note: "Rent comes first. See which of the rest to pay first.",
    });
  list.push(
    {
      href: withSubject("/rent", inp.what),
      label: "The rent's going up too?",
      note: "A tribunal values the home in the state it's in, repairs and all.",
    },
    {
      href: withSubject("/deposit", inp.what),
      label: "Moving out over it?",
      note: "Your dated photos and reports help there too: they show what was the landlord's to fix.",
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
        <Link href="/writing/they-dont-know-until-its-written" className={link}>
          They don&rsquo;t know until it&rsquo;s written
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
function RepairsExample({ today }: { today: string }) {
  const ex = repairExample(today);
  const read = readRepairs(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Mould started on the wall of our son&rsquo;s bedroom in the spring. I
        mentioned it to the agent when they came to read the meter, and rang
        twice. Each time they said they&rsquo;d pass it on. Seven months later
        it&rsquo;s behind the wardrobe and on his window frame, and I&rsquo;d
        assumed they were dealing with it.
      </p>
      <TwoClocks read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {repairHeadline(ex, read, today)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          I sent the email that evening, with three photos and a date five
          working days out. The agent replied the next morning with a
          reference number. A surveyor came the following week and found a
          blocked air brick and a failed extractor fan. When the first fix
          didn&rsquo;t hold, the chaser and the council letter were already
          written, and the dates were in my calendar.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}home.
      </p>
    </div>
  );
}
