"use client";

import ClearCallButton from "../components/ClearCallButton";
import PrintButton from "../components/PrintButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import {
  ACTIVITIES,
  BLANK_PIP,
  DL_ENHANCED,
  DL_STANDARD,
  MOB_ENHANCED,
  MOB_STANDARD,
  checksOf,
  draftsOf,
  formRules,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  parsePipInputs,
  pipBody,
  pipExample,
  pipHeadline,
  pipRule,
  pipSummary,
  pounds2,
  readPip,
  remindersOf,
  scoreOf,
  tilesOf,
  todayISO,
  unlocksOf,
  type Activity,
  type ActivityId,
  type Age,
  type Answer,
  type Current,
  type DateLine,
  type Days,
  type Duration,
  type PipInputs,
  type PipRead,
  type Where,
  type Whose,
} from "../data/pip";

/**
 * PIP: could you get it, and what do you write? (/pip)
 *
 * For each of the twelve activities, asks what happens on a bad day, how many
 * days a week are like that, and what happens on the others. Scores the
 * statutory descriptors both ways (what counts on most days, and what would
 * count if the bad days turn out to be more than half), drafts each answer,
 * and gives a two-week day count to settle the difference.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/pip.ts` so it can be checked without a browser.
 */

const STORE_KEY = "pip:v1";

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

function loadInputs(): PipInputs {
  if (typeof window === "undefined") return BLANK_PIP;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parsePipInputs(JSON.parse(raw)) : BLANK_PIP;
  } catch {
    return BLANK_PIP;
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
        `UID:pip-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/pip`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "PIP")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pip-dates.ics";
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

export default function PipClient() {
  const [inp, setInp] = useState<PipInputs>(BLANK_PIP);
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

  const set = <K extends keyof PipInputs>(k: K, v: PipInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));
  const setAnswer = (id: ActivityId, patch: Partial<Answer>) =>
    setInp((prev) => {
      const cur: Answer = prev.answers[id] ?? { opt: "", days: "" };
      return { ...prev, answers: { ...prev.answers, [id]: { ...cur, ...patch } } };
    });
  const read = useMemo(() => readPip(inp, today), [inp, today]);
  const other = inp.whose === "other";
  const scoring = inp.age === "adult" && !!inp.duration;

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
        {showExample ? <PipExample today={today} /> : null}
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
            { id: "other", label: "Someone I help" },
          ]}
        />
        {other ? (
          <div className="mt-5">
            <label htmlFor="pip-name" className="block text-sm text-[var(--foreground)] mb-2">
              Their first name {optional}
            </label>
            <input
              id="pip-name"
              type="text"
              value={inp.name}
              maxLength={30}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Sam"
              className={inputClass}
            />
            <p className={hintCls}>
              Only used in the read and the messages. The drafts stay in the first person, because the form is written as
              the person claiming.
            </p>
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

        <Question>How old?</Question>
        <Chips<Age>
          label="Age"
          value={inp.age}
          onPick={(v) => set("age", v)}
          cols={3}
          options={[
            { id: "adult", label: "16 to State Pension age" },
            { id: "over", label: "Over State Pension age" },
            { id: "child", label: "Under 16" },
          ]}
        />

        {inp.age === "adult" ? (
          <>
            <Question>How long have things been like this?</Question>
            <Chips<Duration>
              label="How long"
              value={inp.duration}
              onPick={(v) => set("duration", v)}
              cols={1}
              options={[
                { id: "ok", label: "Three months or more, and likely to carry on" },
                { id: "under3", label: "Less than three months (a new diagnosis, an accident, a relapse)" },
                { id: "terminal", label: "A doctor or nurse has said it may be 12 months or less to live" },
              ]}
            />
            <Question>Where are things now?</Question>
            <Chips<Current>
              label="Current"
              value={inp.current}
              onPick={(v) => set("current", v)}
              cols={3}
              options={[
                { id: "none", label: "Thinking of claiming" },
                { id: "review", label: "Getting PIP; review form came" },
                { id: "refused", label: "Refused before" },
              ]}
            />
          </>
        ) : null}
      </div>

      {scoring ? (
        <>
          <div className={card}>
            <p className={eyebrow}>How to answer</p>
            <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
              For each activity, pick what happens on a <strong>bad day</strong>, then say how many days a week are like
              that. If {other ? "they" : "you"} can do something but not safely, not well enough, not more than once, or
              only taking more than twice as long as someone else would, count it as <em>can&rsquo;t</em>. Skip anything
              that doesn&rsquo;t apply.
            </p>
          </div>
          <ActivityCard title="Daily living" part="daily" inp={inp} setAnswer={setAnswer} />
          <ActivityCard title="Getting around" part="mobility" inp={inp} setAnswer={setAnswer} />
          <div className={card}>
            <p className={eyebrow}>One more thing</p>
            <Question>Does someone under State Pension age look after {other ? "them" : "you"} for 35 hours a week or more?</Question>
            <Chips<"yes" | "no">
              label="Carer"
              value={inp.carer as "yes" | "no"}
              onPick={(v) => set("carer", v)}
              options={[
                { id: "no", label: "No" },
                { id: "yes", label: "Yes" },
              ]}
            />
            <p className={hintCls}>The daily living part is what a carer needs for Carer&rsquo;s Allowance.</p>
          </div>
        </>
      ) : null}

      <AnnounceAnswer message={read ? pipHeadline(read) : null} />
      {read ? (
        <ReadBlock read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer who it&rsquo;s for, then at least one activity. The read appears: the points in each part, which rate
            that is ({pounds2(DL_STANDARD)}{" "}or {pounds2(DL_ENHANCED)}{" "}a week for daily living, {pounds2(MOB_STANDARD)}{" "}
            or {pounds2(MOB_ENHANCED)}{" "}for mobility), what changes if the bad days are more than half, draft answers
            for each activity, and a two-week day count to print.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_PIP)} />
    </div>
  );
}

function ActivityCard({
  title,
  part,
  inp,
  setAnswer,
}: {
  title: string;
  part: "daily" | "mobility";
  inp: PipInputs;
  setAnswer: (id: ActivityId, patch: Partial<Answer>) => void;
}) {
  const list = ACTIVITIES.filter((a) => a.part === part);
  const total = list.reduce((t, a) => t + (scoreOf(a, inp.answers[a.id])?.points ?? 0), 0);
  return (
    <div className={card}>
      <div className="flex items-baseline justify-between gap-4">
        <p className={eyebrow}>{title}</p>
        <p className="text-xs text-[var(--muted)] tabular-nums">
          {total} point{total === 1 ? "" : "s"} counted · 8 standard, 12 enhanced
        </p>
      </div>
      <div className="mt-2 divide-y divide-[var(--border)]">
        {list.map((a) => (
          <ActivityRow key={a.id} a={a} ans={inp.answers[a.id]} setAnswer={setAnswer} />
        ))}
      </div>
    </div>
  );
}

function ActivityRow({
  a,
  ans,
  setAnswer,
}: {
  a: Activity;
  ans: Answer | undefined;
  setAnswer: (id: ActivityId, patch: Partial<Answer>) => void;
}) {
  const s = scoreOf(a, ans);
  const opt = s?.opt;
  const showDays = !!opt && opt.points > 0;
  const showUsual = showDays && !!ans?.days && ans.days !== "most";
  const lower = opt ? a.options.filter((o) => o.points < opt.points) : [];
  return (
    <div className="py-5">
      <p className="text-sm font-medium text-[var(--foreground)]">
        {a.n}. {a.label}
        {s && (s.points > 0 || s.potential > 0) ? (
          <span className="ml-2 text-xs font-normal text-[var(--accent)] tabular-nums">
            {s.points} pt{s.points === 1 ? "" : "s"}
            {s.potential > s.points ? ` (${s.potential} if most days)` : ""}
          </span>
        ) : null}
      </p>
      <p className={hintCls}>{a.hint}</p>
      <p className="mt-3 text-xs text-[var(--muted)] mb-2">On a bad day:</p>
      <Chips<string>
        label={`${a.label}: on a bad day`}
        value={ans?.opt ?? ""}
        onPick={(v) => setAnswer(a.id, { opt: v, usual: undefined })}
        cols={1}
        options={a.options.map((o) => ({ id: o.id, label: o.points ? `${o.label} · ${o.points}` : o.label }))}
      />
      {showDays ? (
        <>
          <p className="mt-4 text-xs text-[var(--muted)] mb-2">How many days a week is it like that?</p>
          <Chips<Days>
            label={`${a.label}: how many days`}
            value={ans?.days ?? ""}
            onPick={(v) => setAnswer(a.id, { days: v })}
            cols={3}
            options={[
              { id: "most", label: "4 or more days" },
              { id: "some", label: "2 or 3 days" },
              { id: "few", label: "1 day or fewer" },
            ]}
          />
        </>
      ) : null}
      {showUsual ? (
        <>
          <p className="mt-4 text-xs text-[var(--muted)] mb-2">And on the other days?</p>
          <Chips<string>
            label={`${a.label}: on other days`}
            value={ans?.usual ?? ""}
            onPick={(v) => setAnswer(a.id, { usual: v })}
            cols={1}
            options={lower.map((o) => ({ id: o.id, label: o.points ? `${o.label} · ${o.points}` : o.label }))}
          />
        </>
      ) : null}
    </div>
  );
}

function Tiles({ read }: { read: PipRead }) {
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

function Points({ read }: { read: PipRead }) {
  const rows = read.scored.filter((s) => s.potential > 0);
  if (!rows.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Where the points come from</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {rows.map((s) => (
          <li key={s.id} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--foreground)]">
                {s.n}. {s.label}
              </span>
              <span className="block text-xs text-[var(--muted)]">
                {s.days === "most" ? s.opt.label : `Bad days: ${s.opt.label.toLowerCase()}${s.usual ? `; other days: ${s.usual.label.toLowerCase()}` : ""}`}
              </span>
            </span>
            <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">
              {s.points}
              {s.potential > s.points ? <span className="text-[var(--muted)] font-normal"> / {s.potential}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      {rows.some((s) => s.potential > s.points) ? (
        <p className="mt-2 text-xs text-[var(--muted)]">
          The second number is what counts if a two-week count shows the bad days are more than half.
        </p>
      ) : null}
    </div>
  );
}

/** A two-week tick sheet for the activities that are in play, to print. */
function DayCount({ read, today }: { read: PipRead; today: string }) {
  const rows = read.scored.filter((s) => s.potential > 0);
  if (!rows.length || read.verdict === "terminal") return null;
  const days = Array.from({ length: 14 }, (_, i) => {
    const [y, m, d] = today.split("-").map(Number);
    const dt = new Date(y, m - 1, d + i);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  });
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The two-week day count</p>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        Each evening, tick every activity that was like the bad-day answer. At the end, count the ticks: 8 or more out of
        14 is more than half, and that&rsquo;s the number to put in the draft. Print it and keep it by the bed, or copy
        the rows into a notebook.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="text-xs border-collapse tabular-nums">
          <thead>
            <tr>
              <th scope="col" className="text-left font-medium text-[var(--muted)] pr-3 py-1">
                Activity
              </th>
              {days.map((d) => (
                <th key={d} scope="col" className="font-normal text-[var(--muted)] px-1 py-1 min-w-[2rem]">
                  {d}
                </th>
              ))}
              <th scope="col" className="font-medium text-[var(--muted)] pl-2 py-1">
                /14
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-[var(--border)]">
                <th scope="row" className="text-left font-normal text-[var(--foreground)] pr-3 py-2 whitespace-nowrap">
                  {s.label}
                </th>
                {days.map((d) => (
                  <td key={d} className="px-1 py-2 text-center">
                    <span aria-hidden className="inline-block w-4 h-4 border border-[var(--border)] rounded-sm" />
                  </td>
                ))}
                <td className="pl-2 py-2">
                  <span aria-hidden className="inline-block w-6 border-b border-[var(--border)]">
                    &nbsp;
                  </span>
                </td>
              </tr>
            ))}
            <tr className="border-t border-[var(--border)]">
              <th scope="row" className="text-left font-normal text-[var(--foreground)] pr-3 py-2 whitespace-nowrap">
                Up in the night? How often
              </th>
              {days.map((d) => (
                <td key={d} className="px-1 py-2 text-center">
                  <span aria-hidden className="inline-block w-4 h-4 border border-[var(--border)] rounded-sm" />
                </td>
              ))}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <PrintButton label="Print the page with the day count" />
      </div>
    </div>
  );
}

function Drafts({ read }: { read: PipRead }) {
  const [copied, setCopied] = useState("");
  const drafts = draftsOf(read);
  if (!drafts.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Draft answers for the form</p>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        Written as the person claiming, because the form is. Replace every [bracket] with what really happens, and delete
        what doesn&rsquo;t apply. Never write anything that isn&rsquo;t true; the point is to say all of what is.
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

function ReadBlock({ read, today }: { read: PipRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = pipRule(read);
  const msgs = messagesOf(read);
  const reminders = remindersOf(read, today);
  const unlocks = unlocksOf(read);
  const live = read.verdict === "award" || read.verdict === "close" || read.verdict === "terminal";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{pipHeadline(read)}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{pipBody(read)}</p>

      <Tiles read={read} />
      <Points read={read} />
      <DayCount read={read} today={today} />
      <Drafts read={read} />

      {read.verdict !== "attendance" && read.verdict !== "child" ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>Writing the form: what turns a true claim into a no</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {formRules(read).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {unlocks.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>What an award opens</p>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {unlocks.map((u) => (
              <li key={u.label} className="py-2.5 text-sm">
                <span className="text-[var(--foreground)]">{u.label}</span>
                <span className="block text-xs text-[var(--muted)] leading-relaxed">{u.note}</span>
              </li>
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
          <p className={eyebrow} id={`pip-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`pip-msg-${m.id}`}
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
        2026/27 rates. A scoring of what you entered, not a decision: the DWP (or Social Security Scotland) decides, usually
        after an assessment, and the descriptors carry case law a checklist can&rsquo;t. Citizens Advice, Scope, Mind and
        local welfare rights services help with the form for free.
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
            onClick={async () => setCopied((await copyText(pipSummary(read, today))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole read" : "Copy the whole read and drafts as text"}
          </button>
        </div>
        {copied === "no" ? <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words above instead.</p> : null}
      </div>
      <Handoffs read={read} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ read }: { read: PipRead }) {
  const list: Handoff[] = [];
  if (read.verdict === "attendance")
    list.push({
      href: "/attendance",
      label: "Over State Pension age?",
      note: "Attendance Allowance: which rate the day and night needs point to, and what to write.",
    });
  list.push(
    {
      href: "/challenge",
      label: "Refused, or fewer points than you expected?",
      note: "Ask for a mandatory reconsideration within a month, and for the assessment report.",
    },
    {
      href: "/carers",
      label: "Someone caring 35 hours a week?",
      note: "Carer's Allowance needs the daily living part, and has an earnings limit with a cliff.",
    },
    {
      href: "/sick",
      label: "Off work with it?",
      note: "Sick pay, fit notes, and what you're owed while you're off.",
    },
  );
  if (read.verdict !== "attendance")
    list.push({
      href: "/attendance",
      label: "Helping a parent over pension age?",
      note: "Their benefit is Attendance Allowance, with its own form and its own trap.",
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
        More on why the form goes wrong:{" "}
        <Link href="/writing/which-day-are-you-describing" className={link}>
          Which day are you describing?
        </Link>
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function PipExample({ today }: { today: string }) {
  const read = readPip(pipExample(), today);
  if (!read) return null;
  const move = draftsOf(read).find((d) => d.id === "move");
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Priya is 41 and has relapsing MS. At the GP last week, on a good day, the answer to &ldquo;how are things?&rdquo;
        was &ldquo;not bad, actually.&rdquo; Counted over two weeks, it looks different. On most days Priya needs someone
        in the kitchen to cook safely, help getting out of the shower, help with socks and shoes, and a pill organiser with
        phone alarms, and can walk 50 to 200 metres before the legs give out. On two or three days a week, it&rsquo;s 30
        metres at most.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{pipHeadline(read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Cooking with someone there (4), help out of the shower (3), help with the lower body (2) and a pill organiser (1)
          make {read.dlPoints}{" "}daily living points: the standard rate. Mobility is {read.mobPoints}{" "}points on the
          usual days, short of 8. But if the bad walking days are four a week rather than two or three, it&rsquo;s 8, and
          the standard mobility rate too: <span className="font-semibold">{money((read.weeklyIfCounted - read.weekly) * 52)}</span>{" "}
          a year more, settled by a fortnight of ticks rather than a memory of last Tuesday.
        </p>
        {move ? (
          <>
            <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">The draft for moving around, before the brackets are filled in:</p>
            <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]">{move.text}</pre>
          </>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}situation.
      </p>
    </div>
  );
}
