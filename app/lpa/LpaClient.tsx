"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import {
  BLANK_LPA,
  COP_APPLICATION,
  LPA_FEE,
  OPG_ASSESSMENT,
  SUPERVISION,
  checksOf,
  isISODate,
  keepList,
  letterDate,
  lpaBody,
  lpaExample,
  lpaHeadline,
  lpaRule,
  lpaSummary,
  messagesOf,
  money,
  monthRange,
  parseLpaInputs,
  readLpa,
  remindersOf,
  stepsOf,
  tilesOf,
  todayISO,
  type DateLine,
  type Existing,
  type FeeBand,
  type LpaInputs,
  type LpaRead,
  type People,
  type Pressing,
  type State,
  type Where,
  type Which,
  type Who,
  type YesNo,
} from "../data/lpa";

/**
 * Power of attorney: is it too late, and what does waiting cost? (/lpa)
 *
 * Reads where someone is (well, early decline, capacity gone, a form signed
 * but not registered, an old EPA) against the line that matters, capacity,
 * and prices doing it now against a Court of Protection deputyship later.
 * Dates the steps and writes the conversation opener and the letters.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/lpa.ts` so it can be checked without a browser.
 */

const STORE_KEY = "lpa:v1";

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

function loadInputs(): LpaInputs {
  if (typeof window === "undefined") return BLANK_LPA;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseLpaInputs(JSON.parse(raw)) : BLANK_LPA;
  } catch {
    return BLANK_LPA;
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
        `UID:lpa-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/lpa`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Power of attorney")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "power-of-attorney-dates.ics";
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

function Question({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 text-sm text-[var(--foreground)] mb-2">{children}</p>;
}

const optional = <span className="text-[var(--muted)]">(optional)</span>;

const PRESSING_OPTIONS: { id: Pressing; label: string }[] = [
  { id: "bank", label: "Bills and the bank" },
  { id: "care", label: "Paying for care, or a care home" },
  { id: "house", label: "Selling or remortgaging a home" },
  { id: "health", label: "Hospital, treatment or care decisions" },
  { id: "benefits", label: "Just their benefits" },
];

export default function LpaClient() {
  const [inp, setInp] = useState<LpaInputs>(BLANK_LPA);
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

  const set = <K extends keyof LpaInputs>(k: K, v: LpaInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));
  const togglePressing = (p: Pressing) =>
    setInp((prev) => ({
      ...prev,
      pressing: prev.pressing.includes(p) ? prev.pressing.filter((x) => x !== p) : [...prev.pressing, p],
    }));
  const read = useMemo(() => readLpa(inp, today), [inp, today]);
  const self = inp.who === "self";
  const ew = inp.where === "ew";
  const making = ew && (inp.existing === "none" || inp.existing === "unsure" || inp.existing === "epa" || inp.existing === "signed");
  const lost = inp.state === "lost";

  const stateOptions: { id: State; label: string }[] = self
    ? [
        { id: "well", label: "I'm well; this is planning ahead" },
        { id: "early", label: "I've had a diagnosis, or my memory's going" },
      ]
    : [
        { id: "well", label: "Fine: this is planning ahead" },
        { id: "early", label: "Memory problems or a diagnosis, but they follow a conversation" },
        { id: "fluctuates", label: "Good days and bad days" },
        { id: "lost", label: "Can't follow or remember a decision like this, even on a good day" },
        { id: "unsure", label: "Not sure" },
      ];

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
        {showExample ? <LpaExample today={today} /> : null}
      </div>

      {/* ---- Who ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>Who it&rsquo;s for</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Whose power of attorney is this about?</p>
        <Chips<Who>
          label="Whose"
          value={inp.who}
          onPick={(v) => setInp((prev) => ({ ...prev, who: v, state: v === "self" && prev.state === "lost" ? "" : prev.state }))}
          options={[
            { id: "self", label: "Mine" },
            { id: "other", label: "A parent, partner or relative" },
          ]}
        />

        <Question>Where do they live?</Question>
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

        {inp.who === "other" ? (
          <div className="mt-5">
            <label htmlFor="lpa-name" className="block text-sm text-[var(--foreground)] mb-2">
              What do you call them? {optional}
            </label>
            <input
              id="lpa-name"
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

        {ew && inp.who ? (
          <>
            <Question>{self ? "How are you?" : "How are they, today?"}</Question>
            <Chips<State> label="Their state" value={inp.state} onPick={(v) => set("state", v)} cols={1} options={stateOptions} />
            {!self ? (
              <p className={hintCls}>
                What counts is whether they can understand what it does, remember it long enough, weigh it up and tell you
                what they want, on a good day. A diagnosis alone doesn&rsquo;t settle it.
              </p>
            ) : null}

            <Question>Is there one already?</Question>
            <Chips<Existing>
              label="Existing power of attorney"
              value={inp.existing}
              onPick={(v) => set("existing", v)}
              options={[
                { id: "none", label: "No" },
                { id: "signed", label: "Signed, but never registered" },
                { id: "registered", label: "Yes, registered" },
                { id: "epa", label: "An old Enduring Power (before Oct 2007)" },
                { id: "unsure", label: "Not sure" },
              ]}
            />
          </>
        ) : null}
      </div>

      {/* ---- Details ---- */}
      {ew && inp.who && inp.existing ? (
        <div className={card}>
          <p className={eyebrow}>The details</p>

          {inp.existing === "registered" ? (
            <>
              <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Which do they have?</p>
              <Chips<Which>
                label="Which LPAs"
                value={inp.which}
                onPick={(v) => set("which", v)}
                cols={3}
                options={[
                  { id: "both", label: "Both" },
                  { id: "finance", label: "Money only" },
                  { id: "health", label: "Health only" },
                ]}
              />
            </>
          ) : making && !(lost && inp.existing !== "signed") ? (
            <>
              <p className="mt-3 text-sm text-[var(--foreground)] mb-2">
                {inp.existing === "signed" ? "Which ones were signed?" : "Which ones?"}
              </p>
              <Chips<Which>
                label="Which LPAs"
                value={inp.which}
                onPick={(v) => set("which", v)}
                cols={1}
                options={[
                  { id: "both", label: "Both: money and property, and health and welfare" },
                  { id: "finance", label: "Property and financial affairs only" },
                  { id: "health", label: "Health and welfare only" },
                ]}
              />
              {inp.existing !== "signed" ? (
                <>
                  <Question>For one person, or a couple?</Question>
                  <Chips<People>
                    label="How many people"
                    value={inp.people}
                    onPick={(v) => set("people", v)}
                    options={[
                      { id: "1", label: "One" },
                      { id: "2", label: "Two (each makes their own)" },
                    ]}
                  />
                </>
              ) : null}
              <Question>Their income</Question>
              <Chips<FeeBand>
                label="Fee"
                value={inp.fee}
                onPick={(v) => set("fee", v)}
                cols={1}
                options={[
                  { id: "full", label: `Over £12,000 a year (£${LPA_FEE} each)` },
                  { id: "low", label: "£12,000 a year or less before tax (half)" },
                  { id: "benefits", label: "On a means-tested benefit such as Pension Credit (maybe free)" },
                ]}
              />
            </>
          ) : null}

          <Question>What&rsquo;s pressing, if anything? {optional}</Question>
          <div role="group" aria-label="What's pressing" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESSING_OPTIONS.map((o) => {
              const on = inp.pressing.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => togglePressing(o.id)}
                  className={`${chipBase} ${on ? chipOn : chipOff}`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <Question>Do {self ? "you" : "they"} own a home jointly with someone?</Question>
          <Chips<YesNo>
            label="Joint home"
            value={inp.jointHome}
            onPick={(v) => set("jointHome", v)}
            options={[
              { id: "no", label: "No" },
              { id: "yes", label: "Yes" },
            ]}
          />

          <div className="mt-5">
            <label htmlFor="lpa-needby" className="block text-sm text-[var(--foreground)] mb-2">
              A date someone has to be able to act by {optional}
            </label>
            <input
              id="lpa-needby"
              type="date"
              value={inp.needBy}
              min={today}
              onChange={(e) => set("needBy", e.target.value)}
              className={inputClass}
            />
            <p className={hintCls}>A house sale, a move into care, a hospital discharge.</p>
          </div>
        </div>
      ) : null}

      <AnnounceAnswer message={read ? lpaHeadline(read) : null} />
      {read ? (
        <ReadBlock read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say whose it is, where they live, how they are and whether there&rsquo;s one already. The read appears: whether
            it can still be made, what it costs now against a court later, when it would be usable, and what to send.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_LPA)} />
    </div>
  );
}

function Tiles({ read }: { read: LpaRead }) {
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

function Body({ read }: { read: LpaRead }) {
  return (
    <div className="mt-3 space-y-3">
      {lpaBody(read)
        .split("\n\n")
        .map((para) => (
          <p key={para.slice(0, 40)} className="text-sm text-[var(--foreground)] leading-relaxed">
            {para}
          </p>
        ))}
    </div>
  );
}

function ReadBlock({ read }: { read: LpaRead }) {
  const [copied, setCopied] = useState("");
  const rule = lpaRule(read);
  const msgs = messagesOf(read);
  const reminders = remindersOf(read);
  const steps = stepsOf(read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{lpaHeadline(read)}</p>
      <Body read={read} />
      <Tiles read={read} />

      {steps.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>Making one that won&rsquo;t come back</p>
          <ol className="mt-3 space-y-3 text-sm text-[var(--foreground)] leading-relaxed list-decimal pl-5">
            {steps.map((s) => (
              <li key={s.title}>
                <span className="font-medium">{s.title}.</span> <span className="text-[var(--muted)]">{s.body}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

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
                  {r.on === read.today ? "Today" : letterDate(r.on)}
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
          <p className={eyebrow} id={`lpa-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`lpa-msg-${m.id}`}
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
        England and Wales figures: £{LPA_FEE}{" "}to register each LPA; a deputyship costs £{COP_APPLICATION}{" "}to apply, £
        {OPG_ASSESSMENT}{" "}for the assessment and £{SUPERVISION}{" "}a year in supervision. Registration and court times
        vary; check gov.uk for today&rsquo;s. This isn&rsquo;t legal advice. Age UK, the Alzheimer&rsquo;s Society and
        Citizens Advice can help, and a solicitor can if things are contested.
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
            onClick={async () => setCopied((await copyText(lpaSummary(read))) ? "all" : "no")}
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
      href: "/carers",
      label: "Caring for them 35 hours a week or more?",
      note: "Carer's Allowance has an earnings cliff; this counts your pay the way the rule does.",
    },
    {
      href: "/counciltax",
      label: "A dementia diagnosis in the house?",
      note: "With a qualifying benefit they may not count for council tax at all, backdated.",
    },
    {
      href: "/challenge",
      label: "Attendance Allowance or PIP refused?",
      note: "A decision is a first draft: challenge it within a month.",
    },
    {
      href: "/scam",
      label: "A call or letter about their money you weren't expecting?",
      note: "People with memory problems are targeted. Check it before anyone pays.",
    },
    {
      href: "/bereavement",
      label: "An LPA ends when the person dies.",
      note: "After that it's the will and the executor; this sorts what's urgent.",
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
        <Link href="/writing/sign-it-on-a-good-day" className={link}>
          Sign it on a good day
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function LpaExample({ today }: { today: string }) {
  const read = readLpa(lpaExample(), today);
  const late = readLpa({ ...lpaExample(), state: "lost" }, today);
  if (!read || !late) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Over Christmas I noticed Mum, who&rsquo;s 79 and has lived alone since Dad died, asking the same questions and
        leaving letters unopened. The GP has mentioned early Alzheimer&rsquo;s. She owns the house outright, and in a year
        or two it may have to be sold to pay for care. There&rsquo;s no power of attorney. I&rsquo;d assumed the diagnosis
        meant it was too late.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{lpaHeadline(read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          She still follows a conversation, so she can very likely make both LPAs if we do it soon, on a morning when
          she&rsquo;s at her best, with the GP noting her capacity. That&rsquo;s {money(read.feeTotal)}, and sent before
          Christmas it should be usable around {monthRange(read.readyFrom, read.readyTo)}. If we wait until she can&rsquo;t
          follow it, selling the house would need a deputy: about {money(late.deputyFirst)}{" "}in fees the first year,{" "}
          {money(late.deputyYearly)}{" "}every year after, and an order around {monthRange(late.orderFrom, late.orderTo)}{" "}
          at the earliest, with nobody able to sign anything until then. The tool also flagged Attendance Allowance and the
          council tax discount she&rsquo;s probably missing.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}situation.
      </p>
    </div>
  );
}
