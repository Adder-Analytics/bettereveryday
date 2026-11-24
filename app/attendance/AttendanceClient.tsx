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
  BLANK_AA,
  NEEDS,
  aaBody,
  aaExample,
  aaHeadline,
  aaRule,
  aaSummary,
  checksOf,
  draftsOf,
  formRules,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  parseAaInputs,
  pounds2,
  readAa,
  remindersOf,
  tilesOf,
  todayISO,
  type AaInputs,
  type AaRead,
  type Age,
  type CarerAge,
  type Current,
  type DateLine,
  type DayFreq,
  type Duration,
  type Falls,
  type LivesWith,
  type NeedId,
  type Night,
  type Pc,
  type Setting,
  type Where,
  type Whose,
  type YesNo,
} from "../data/attendance";

/**
 * Attendance Allowance: could they get it, and what do you write? (/attendance)
 *
 * Asks what actually happens (which tasks need help, how often by day, what
 * happens at night, falls), reads which rate that points to, counts what an
 * award opens, and drafts each answer for the form in the words the test turns
 * on. Dates the claim from the call for the form.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/attendance.ts` so it can be checked without a browser.
 */

const STORE_KEY = "attendance:v1";

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

function loadInputs(): AaInputs {
  if (typeof window === "undefined") return BLANK_AA;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseAaInputs(JSON.parse(raw)) : BLANK_AA;
  } catch {
    return BLANK_AA;
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
        `UID:attendance-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/attendance`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Attendance Allowance")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "attendance-allowance-dates.ics";
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

export default function AttendanceClient() {
  const [inp, setInp] = useState<AaInputs>(BLANK_AA);
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

  const set = <K extends keyof AaInputs>(k: K, v: AaInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));
  const toggleNeed = (id: NeedId) =>
    setInp((prev) => ({
      ...prev,
      needs: prev.needs.includes(id) ? prev.needs.filter((n) => n !== id) : NEEDS.map((n) => n.id).filter((n) => n === id || prev.needs.includes(n)),
    }));
  const read = useMemo(() => readAa(inp, today), [inp, today]);
  const other = inp.whose === "other";
  const you = other ? "they" : "you";
  const them = other ? "them" : "you";
  const assessing = inp.age === "over" && inp.setting !== "carehome-funded" && inp.duration !== "terminal" && !!inp.setting && !!inp.duration;
  const showHousehold = inp.age === "over" && inp.setting !== "carehome-funded" && !!inp.setting;
  const bad = moneyInvalid(inp.councilTax);

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
        {showExample ? <AaExample today={today} /> : null}
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
            { id: "mine", label: "Me" },
            { id: "other", label: "A parent, partner or relative" },
          ]}
        />
        {other ? (
          <div className="mt-5">
            <label htmlFor="aa-name" className="block text-sm text-[var(--foreground)] mb-2">
              What do you call them? {optional}
            </label>
            <input
              id="aa-name"
              type="text"
              value={inp.name}
              maxLength={30}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Mum"
              className={inputClass}
            />
            <p className={hintCls}>Only used in the drafts and messages below.</p>
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

        <Question>{other ? "Are they" : "Are you"} over State Pension age?</Question>
        <Chips<Age>
          label="Age"
          value={inp.age}
          onPick={(v) => set("age", v)}
          options={[
            { id: "over", label: "Yes, 66 or over" },
            { id: "under", label: "No, not yet" },
          ]}
        />

        {inp.age === "over" ? (
          <>
            <Question>How long has help been needed?</Question>
            <Chips<Duration>
              label="How long"
              value={inp.duration}
              onPick={(v) => set("duration", v)}
              cols={1}
              options={[
                { id: "over6", label: "Six months or more" },
                { id: "under6", label: "Less than six months (a recent fall, stroke or diagnosis)" },
                { id: "terminal", label: "A doctor or nurse has said it may be 12 months or less to live" },
              ]}
            />
            <Question>Where {other ? "do they" : "do you"} live now?</Question>
            <Chips<Setting>
              label="Setting"
              value={inp.setting}
              onPick={(v) => set("setting", v)}
              cols={1}
              options={[
                { id: "home", label: "At home (their own, or with family)" },
                { id: "carehome-self", label: "A care home, paying their own fees" },
                { id: "carehome-funded", label: "A care home the council or NHS pays for" },
                { id: "hospital", label: "In hospital at the moment" },
              ]}
            />
            <Question>{other ? "Do they" : "Do you"} get Attendance Allowance already?</Question>
            <Chips<Current>
              label="Already"
              value={inp.current}
              onPick={(v) => set("current", v)}
              cols={3}
              options={[
                { id: "none", label: "No" },
                { id: "lower", label: "Yes, the lower rate" },
                { id: "refused", label: "Refused before" },
              ]}
            />
          </>
        ) : null}
      </div>

      {assessing ? (
        <div className={card}>
          <p className={eyebrow}>By day</p>
          <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
            Tick everything where {you} need a hand, a reminder, or someone nearby, or where {you} do it slowly, in pain or
            unsafely, or go without. Think of a bad day, not the best one.
          </p>
          <div role="group" aria-label="Help needed" className="mt-4 grid grid-cols-1 gap-2">
            {NEEDS.map((n) => {
              const on = inp.needs.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleNeed(n.id)}
                  className={`${chipBase} ${on ? chipOn : chipOff}`}
                >
                  <span className="block">
                    {on ? "✓ " : ""}
                    {n.label}
                  </span>
                  <span className="block text-xs text-[var(--muted)] font-normal">{n.hint}</span>
                </button>
              );
            })}
          </div>

          <Question>Across a typical day, how often does something on that list come up?</Question>
          <Chips<DayFreq>
            label="How often by day"
            value={inp.dayFreq}
            onPick={(v) => set("dayFreq", v)}
            cols={1}
            options={[
              { id: "once", label: "Once or twice (or not at all)" },
              { id: "several", label: "Several times: morning, meals, evening, the toilet" },
              { id: "throughout", label: "Throughout the day, or someone needs to keep an eye on them" },
            ]}
          />
          <p className={hintCls}>Count every time: getting up, washing, dressing, each meal, each trip to the toilet, each dose.</p>

          <Question>Falls in the last year?</Question>
          <Chips<Falls>
            label="Falls"
            value={inp.falls}
            onPick={(v) => set("falls", v)}
            cols={3}
            options={[
              { id: "0", label: "None" },
              { id: "1", label: "One" },
              { id: "2", label: "Two or more" },
            ]}
          />

          <Question>Do things take much longer, hurt, or leave {them} exhausted?</Question>
          <Chips<YesNo>
            label="Slow or painful"
            value={inp.slow}
            onPick={(v) => set("slow", v)}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
            ]}
          />
        </div>
      ) : null}

      {assessing ? (
        <div className={card}>
          <p className={eyebrow}>At night</p>
          <Question>What happens at night?</Question>
          <Chips<Night>
            label="Night"
            value={inp.night}
            onPick={(v) => set("night", v)}
            cols={1}
            options={[
              { id: "none", label: "Sleeps through, or manages alone safely" },
              { id: "short", label: "Needs help once, briefly" },
              { id: "repeated", label: "Needs help twice or more (the toilet, turning, pain, confusion)" },
              { id: "prolonged", label: "Needs help for 20 minutes or more at a time" },
              { id: "watch", label: "Someone needs to be awake to watch over them (wandering, falls, breathing)" },
            ]}
          />
          <p className={hintCls}>
            The night is a separate test, and the difference between {pounds2(AA_LOWER)}{" "}and {pounds2(AA_HIGHER)}. It
            counts even if nobody is there to help.
          </p>
        </div>
      ) : null}

      {showHousehold ? (
        <div className={card}>
          <p className={eyebrow}>What else it could open</p>
          <Question>Who lives with {them}?</Question>
          <Chips<LivesWith>
            label="Lives with"
            value={inp.livesWith}
            onPick={(v) => set("livesWith", v)}
            cols={3}
            options={[
              { id: "alone", label: "Lives alone" },
              { id: "partner", label: "A partner" },
              { id: "others", label: "Family or others" },
            ]}
          />
          <Question>{other ? "Do they" : "Do you"} get Pension Credit?</Question>
          <Chips<Pc>
            label="Pension Credit"
            value={inp.pensionCredit}
            onPick={(v) => set("pensionCredit", v)}
            cols={3}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
          <Question>Does someone look after {them} for 35 hours a week or more?</Question>
          <Chips<CarerAge>
            label="Carer"
            value={inp.carer}
            onPick={(v) => set("carer", v)}
            cols={1}
            options={[
              { id: "none", label: "No" },
              { id: "under", label: "Yes, and the carer is under State Pension age" },
              { id: "over", label: "Yes, and the carer is over State Pension age" },
            ]}
          />
          {inp.carer === "under" || inp.carer === "over" ? (
            <>
              <Question>Is that carer already paid Carer&rsquo;s Allowance for it?</Question>
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
          <Question>A diagnosis of dementia, or another condition that badly affects memory or understanding?</Question>
          <Chips<YesNo>
            label="Dementia"
            value={inp.dementia}
            onPick={(v) => set("dementia", v)}
            options={[
              { id: "no", label: "No" },
              { id: "yes", label: "Yes" },
            ]}
          />
          {inp.dementia === "yes" && inp.where !== "ni" ? (
            <div className="mt-5">
              <label htmlFor="aa-ct" className="block text-sm text-[var(--foreground)] mb-2">
                Council tax, a year {optional}
              </label>
              <input
                id="aa-ct"
                type="text"
                inputMode="decimal"
                value={inp.councilTax}
                onChange={(e) => set("councilTax", e.target.value)}
                placeholder="£2,000"
                aria-invalid={bad}
                className={inputClass}
              />
              <p className={hintCls}>
                {bad
                  ? "Couldn't read that as an amount. Try something like £2,000."
                  : "To count the council tax discount that dementia plus Attendance Allowance brings."}
              </p>
            </div>
          ) : null}
          <p className={hintCls}>
            Not sure about Pension Credit? Check it with{" "}
            <Link href="/pensioncredit" className={link}>
              the Pension Credit tool
            </Link>
            . For a carer&rsquo;s earnings limit, see{" "}
            <Link href="/carers" className={link}>
              Carer&rsquo;s Allowance
            </Link>
            .
          </p>
        </div>
      ) : null}

      <AnnounceAnswer message={read ? aaHeadline(read) : null} />
      {read ? (
        <ReadBlock read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer who it&rsquo;s for, how long help has been needed, and what happens by day and at night. The read
            appears: which rate the needs point to ({pounds2(AA_LOWER)}{" "}or {pounds2(AA_HIGHER)}{" "}a week), what else
            it opens, draft answers for each part of the form, and the date the claim starts.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_AA)} />
    </div>
  );
}

function Tiles({ read }: { read: AaRead }) {
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

function Unlocks({ read }: { read: AaRead }) {
  if (!read.unlocks.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What the award opens</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {read.unlocks.map((u) => (
          <li key={u.id} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--foreground)]">{u.label}</span>
              <span className="block text-xs text-[var(--muted)]">{u.note}</span>
            </span>
            <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">
              {u.value ? `${money(u.value)}/yr${u.counted ? "" : "*"}` : "—"}
            </span>
          </li>
        ))}
      </ul>
      {read.unlocks.some((u) => u.value && !u.counted) ? (
        <p className="mt-2 text-xs text-[var(--muted)]">* Not in the total: it can&rsquo;t be had alongside something above.</p>
      ) : null}
    </div>
  );
}

function Drafts({ read }: { read: AaRead }) {
  const [copied, setCopied] = useState("");
  const drafts = draftsOf(read);
  if (!drafts.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Draft answers for the form</p>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        Written as the person claiming, because the form is. Replace every [bracket] with what really happens, and delete
        what doesn&rsquo;t apply. Specific beats general: a time, a number, a date.
      </p>
      <div className="mt-3 space-y-4">
        {drafts.map((d) => (
          <details key={d.id} className="rounded-lg border border-[var(--border)] p-3 group">
            <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">{d.title}</summary>
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{d.prompt}</p>
            <pre
              aria-label={`Draft: ${d.title}`}
              className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
            >
              {d.text}
            </pre>
            <button type="button" onClick={async () => setCopied((await copyText(d.text)) ? d.id : "no")} className={`mt-2 ${action}`}>
              {copied === d.id ? "Copied" : "Copy it"}
            </button>
          </details>
        ))}
      </div>
      {copied === "no" ? <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words instead.</p> : null}
    </div>
  );
}

function ReadBlock({ read, today }: { read: AaRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = aaRule(read);
  const msgs = messagesOf(read);
  const reminders = remindersOf(read, today);
  const live = read.verdict !== "pip" && read.verdict !== "funded" && read.verdict !== "unlikely";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{aaHeadline(read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{aaBody(read)}</p>

      <Tiles read={read} />
      <Unlocks read={read} />
      <Drafts read={read} />

      {live && read.verdict !== "terminal" ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>Writing the form: what turns a true claim into a no</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {formRules(read).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
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
          <p className={eyebrow} id={`aa-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`aa-msg-${m.id}`}
            className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
          >
            {m.text}
          </pre>
          <button type="button" onClick={async () => setCopied((await copyText(m.text)) ? m.id : "no")} className={`mt-3 ${action}`}>
            {copied === m.id ? "Copied" : "Copy it"}
          </button>
        </div>
      ))}

      {live ? (
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
        2026/27 rates. A judgement from what you entered, not a decision: the DWP (or Social Security Scotland) decides,
        and the test turns on details a checklist can&rsquo;t capture. Age UK (0800 678 1602), Independent Age and Citizens
        Advice help with the form for free.
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
            onClick={async () => setCopied((await copyText(aaSummary(read, today))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole read" : "Copy the whole read and drafts as text"}
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
      href: "/pensioncredit",
      label: "Lives alone on the State Pension?",
      note: "Attendance Allowance adds £86.05 a week to the Pension Credit minimum. See what that does to the award.",
    },
    {
      href: "/challenge",
      label: "Refused, or the lower rate when it should be higher?",
      note: "Ask for a mandatory reconsideration within a month. A decision is a first draft.",
    },
    {
      href: "/carers",
      label: "Caring 35 hours a week?",
      note: "Carer's Allowance needs this award, and has an earnings limit with a cliff.",
    },
    {
      href: "/lpa",
      label: "Filling in forms for a parent?",
      note: "Check a power of attorney can still be made. Nobody can sign for them without one.",
    },
    {
      href: "/counciltax",
      label: "Dementia in the household?",
      note: "The severe mental impairment discount, and the rest of the bill.",
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
        More on why the form goes wrong:{" "}
        <Link href="/writing/what-i-manage-means" className={link}>
          What &ldquo;I manage&rdquo; means
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function AaExample({ today }: { today: string }) {
  const read = readAa(aaExample(), today);
  if (!read) return null;
  const wash = draftsOf(read).find((d) => d.id === "wash");
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Mum is 84, widowed, lives alone, and gets a little Pension Credit. Asked how things are, the answer is always
        &ldquo;I manage&rdquo;. Watched for a week, managing looks like this: a strip wash at the sink because the bath is
        impossible without someone to steady them; cardigans instead of anything with buttons; tablets that are sometimes
        taken twice; two falls last winter; and two trips to the toilet every night, holding the wall.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{aaHeadline(read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Help several times a day meets the day test; help twice a night meets the night test. Both together is the higher
          rate, {pounds2(AA_HIGHER)}{" "}a week. Because Mum lives alone, gets Pension Credit, and nobody is paid
          Carer&rsquo;s Allowance for the caring, the award also adds £86.05 a week to the Pension Credit. Together, about{" "}
          <span className="font-semibold">{money(read.yearValue)}</span>{" "}a year, from a claim that would have said
          &ldquo;I manage&rdquo;.
        </p>
        {wash ? (
          <>
            <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">The draft for washing, before the brackets are filled in:</p>
            <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]">{wash.text}</pre>
          </>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}situation.
      </p>
    </div>
  );
}
