"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import {
  BLANK_BV,
  BSP,
  actDate,
  bvBody,
  bvExample,
  bvHeadline,
  bvLetters,
  bvReminders,
  bvRule,
  bvSummary,
  canWait,
  debtLines,
  isISODate,
  isPartner,
  letterDate,
  money,
  parseBvInputs,
  readBv,
  todayISO,
  type BspRead,
  type BvEstate,
  type BvHome,
  type BvInputs,
  type BvItem,
  type BvRead,
  type BvRegion,
  type BvRole,
  type YesNo,
  type YesNoUnsure,
} from "../data/bereavement";

/**
 * Someone has died: what's due, and when? (/bereavement)
 *
 * The instrument for the admin after a death, sorted by cost of delay rather
 * than by agency. A few things have a date that costs money if it passes
 * (Bereavement Support Payment's three months above all); most have none, and
 * the tool says so in as many words, because permission to leave them is half
 * the help. It dates what matters from the day of the death, says who doesn't
 * have to pay the debts, and writes the letters.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/bereavement.ts` so it can be checked without a browser.
 */

const STORE_KEY = "bereavement:v1";

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

function loadInputs(): BvInputs {
  if (typeof window === "undefined") return BLANK_BV;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseBvInputs(JSON.parse(raw)) : BLANK_BV;
  } catch {
    return BLANK_BV;
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
        `UID:bereavement-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/bereavement`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "After a death")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "after-a-death-dates.ics";
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
  const grid =
    cols === 3 ? "grid-cols-3" : cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
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

const YES_NO: { id: YesNo; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
const YES_NO_UNSURE: { id: YesNoUnsure; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
  { id: "unsure", label: "Not sure" },
];

function Q({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-sm text-[var(--foreground)] mb-2">{children}</p>;
}

export default function BereavementClient() {
  const [inp, setInp] = useState<BvInputs>(BLANK_BV);
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

  const set = <K extends keyof BvInputs>(k: K, v: BvInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readBv(inp, today), [inp, today]);
  const partner = isPartner(inp);
  const future = isISODate(inp.diedOn) && inp.diedOn > today;

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
          {showExample ? "Hide the worked example ↑" : "See a worked example first ↓"}
        </button>
        {showExample ? <BvExample today={today} /> : null}
      </div>

      {/* ---- The essentials ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--foreground)] mb-2">Where did they live?</p>
        <Chips<BvRegion>
          label="Where they lived"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "ew", label: "England or Wales" },
            { id: "scot", label: "Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bv-died" className="block text-sm text-[var(--foreground)] mb-2">
              The date they died
            </label>
            <input
              id="bv-died"
              type="date"
              value={inp.diedOn}
              max={today}
              onChange={(e) => set("diedOn", e.target.value)}
              className={inputClass}
            />
            {future ? <p className="mt-1.5 text-xs text-[var(--muted)]">That date is in the future.</p> : null}
          </div>
          <div>
            <label htmlFor="bv-name" className="block text-sm text-[var(--foreground)] mb-2">
              Their name <span className="text-[var(--muted)]">(optional, for the letters)</span>
            </label>
            <input
              id="bv-name"
              type="text"
              value={inp.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. David Okafor"
              className={inputClass}
            />
          </div>
        </div>
        <Q>Who were they to you?</Q>
        <Chips<BvRole>
          label="Your relationship to them"
          value={inp.role}
          onPick={(v) => set("role", v)}
          options={[
            { id: "spouse", label: "My husband, wife or civil partner" },
            { id: "cohab", label: "My partner (we weren't married)" },
            { id: "family", label: "My parent, or another relative" },
            { id: "executor", label: "A friend, or I'm the executor" },
          ]}
        />
        <Q>Has the death been registered?</Q>
        <Chips<YesNo>
          label="Whether the death has been registered"
          value={inp.registered}
          onPick={(v) => set("registered", v)}
          options={YES_NO}
        />
        {inp.registered === "yes" && inp.region !== "ni" ? (
          <div className="mt-4">
            <label htmlFor="bv-reg" className="block text-sm text-[var(--foreground)] mb-2">
              Date it was registered <span className="text-[var(--muted)]">(optional; dates Tell Us Once)</span>
            </label>
            <input
              id="bv-reg"
              type="date"
              value={inp.registeredOn}
              max={today}
              onChange={(e) => set("registeredOn", e.target.value)}
              className={inputClass}
            />
          </div>
        ) : null}
        {inp.registered === "no" ? (
          <>
            <Q>Is a coroner (or in Scotland, the procurator fiscal) involved?</Q>
            <Chips<YesNoUnsure>
              label="Whether a coroner is involved"
              value={inp.coroner}
              onPick={(v) => set("coroner", v)}
              options={YES_NO_UNSURE}
            />
          </>
        ) : null}
      </div>

      {/* ---- The details that change the dates ---- */}
      {inp.region && inp.role && isISODate(inp.diedOn) && !future ? (
        <div className={card}>
          <p className={eyebrow}>What changes the list</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Answer what you can. Each question adds or removes something below; &ldquo;not sure&rdquo; is fine.
          </p>
          <Q>Did you live with them?</Q>
          <Chips<YesNo>
            label="Whether you lived with them"
            value={inp.livedWith}
            onPick={(v) => set("livedWith", v)}
            options={YES_NO}
          />
          {inp.livedWith === "no" ? (
            <>
              <Q>Did they live alone, so the home is empty now?</Q>
              <Chips<YesNo>
                label="Whether they lived alone"
                value={inp.livedAlone}
                onPick={(v) => set("livedAlone", v)}
                options={YES_NO}
              />
            </>
          ) : null}
          <Q>Their home was</Q>
          <Chips<BvHome>
            label="Their home"
            value={inp.home}
            onPick={(v) => set("home", v)}
            options={[
              { id: "sole", label: "Owned in their name alone" },
              { id: "joint", label: "Owned jointly with someone" },
              { id: "rented", label: "Rented" },
              { id: "other", label: "Something else (care home, family's home)" },
            ]}
          />
          {partner ? (
            <>
              <Q>Were you under State Pension age when they died?</Q>
              <Chips<YesNo>
                label="Whether you were under State Pension age"
                value={inp.underSpa}
                onPick={(v) => set("underSpa", v)}
                options={YES_NO}
              />
              <Q>Do you get Child Benefit, or were you pregnant when they died?</Q>
              <Chips<YesNo>
                label="Whether you get Child Benefit or were pregnant"
                value={inp.children}
                onPick={(v) => set("children", v)}
                options={YES_NO}
              />
            </>
          ) : null}
          <Q>
            Is whoever&rsquo;s arranging the funeral on Universal Credit, Pension Credit, Housing Benefit or
            another means-tested benefit?
          </Q>
          <Chips<YesNo>
            label="Whether the person arranging the funeral is on a qualifying benefit"
            value={inp.benefits}
            onPick={(v) => set("benefits", v)}
            options={YES_NO}
          />
          {inp.benefits === "yes" ? (
            <div className="mt-4">
              <label htmlFor="bv-funeral" className="block text-sm text-[var(--foreground)] mb-2">
                Date of the funeral <span className="text-[var(--muted)]">(if it&rsquo;s set)</span>
              </label>
              <input
                id="bv-funeral"
                type="date"
                value={inp.funeralOn}
                onChange={(e) => set("funeralOn", e.target.value)}
                className={inputClass}
              />
            </div>
          ) : null}
          <Q>Roughly what did they leave, counting their share of a home, savings and investments?</Q>
          <Chips<BvEstate>
            label="Rough size of the estate"
            value={inp.estate}
            onPick={(v) => set("estate", v)}
            options={[
              { id: "small", label: "£5,000 or less" },
              { id: "under", label: "Under £325,000" },
              { id: "over", label: "More than that" },
              { id: "unsure", label: "Not sure" },
            ]}
          />
          {inp.estate === "over" || inp.estate === "unsure" ? (
            <>
              <Q>Is everything going to a husband, wife or civil partner?</Q>
              <Chips<YesNoUnsure>
                label="Whether everything goes to a spouse or civil partner"
                value={inp.toSpouse}
                onPick={(v) => set("toSpouse", v)}
                options={YES_NO_UNSURE}
              />
            </>
          ) : null}
          <Q>Did they have a workplace or private pension (not just the State Pension)?</Q>
          <Chips<YesNoUnsure>
            label="Whether they had a workplace or private pension"
            value={inp.pension}
            onPick={(v) => set("pension", v)}
            options={YES_NO_UNSURE}
          />
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? bvHeadline(inp, read, today) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where they lived, the date they died and who they were to you.
            The list appears, dated from that day and sorted by what waiting
            would cost: the few things with a deadline that matters, and the
            many that can wait.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_BV)} />
    </div>
  );
}

/**
 * The window: what Bereavement Support Payment is worth if claimed now,
 * against the full amount, with the months already gone shown as a gap.
 */
function BspWindow({ bsp }: { bsp: BspRead }) {
  const r = BSP[bsp.rate];
  const points = [
    { label: `By ${letterDate(bsp.fullBy)}`, value: bsp.full },
    { label: "Six months on", value: r.lump + r.monthly * (BSP.months - 3) },
    { label: "A year on", value: r.lump + r.monthly * (BSP.months - 9) },
    { label: "Just after a year", value: r.monthly * (BSP.months - 10) },
  ];
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What waiting costs</p>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        Bereavement Support Payment, by when it&rsquo;s claimed:
      </p>
      <div className="mt-3 space-y-2.5">
        {points.map((p, i) => {
          const pct = Math.max(3, Math.round((p.value / bsp.full) * 100));
          return (
            <div key={p.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className={i === 0 ? "font-medium text-[var(--foreground)]" : "text-[var(--muted)]"}>{p.label}</span>
                <span className="font-medium tabular-nums text-[var(--foreground)]">{money(p.value)}</span>
              </div>
              <div className="mt-1 h-3 rounded bg-[var(--border)]/40" aria-hidden>
                <div
                  className={`h-3 rounded ${i === 0 ? "bg-[var(--accent)]" : "bg-[var(--foreground)]/50"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        {bsp.monthsLost === 0
          ? `Nobody rings to remind you. The registrar's five days are loud; this three-month window is silent, and it's the one that's worth ${money(bsp.full)}.`
          : `Claimed today: ${money(bsp.now)}. The months already gone can't be backdated past three, so the best day to claim is today.`}
      </p>
    </div>
  );
}

const COST_LABEL: Record<BvItem["cost"], string> = {
  money: "Costs money if it waits",
  duty: "Has a date",
  none: "No deadline",
};

/** The list, as a timeline from the death, with today marked. */
function Timeline({ read, today }: { read: BvRead; today: string }) {
  const rows = read.items;
  const firstAhead = rows.findIndex((i) => !i.done && (!i.on || i.on >= today));
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What&rsquo;s due, and when</p>
      <p className="mt-1 text-xs text-[var(--muted)]">
        From {letterDate(read.diedOn)}: {read.days === 0 ? "today" : read.days === 1 ? "yesterday" : `${read.days} days ago`}.
      </p>
      <ol className="mt-4 space-y-0">
        {rows.map((r, idx) => {
          const passed = !r.done && r.on !== "" && r.on < today;
          const showToday = idx === firstAhead;
          const strong = r.cost === "money" && !r.done && !passed;
          return (
            <li key={r.id} className="relative">
              {showToday ? (
                <div className="flex items-center gap-2 pb-3 ml-1.5 pl-6 border-l-2 border-[var(--accent)]" aria-hidden>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Today, {actDate(today)}</span>
                </div>
              ) : null}
              <div
                className={`relative pl-6 pb-4 border-l-2 ml-1.5 ${idx < firstAhead || firstAhead === -1 ? "border-[var(--accent)]" : "border-[var(--border)]"}`}
              >
                <span
                  aria-hidden
                  className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 ${strong ? "bg-[var(--accent)] border-[var(--accent)]" : r.done ? "bg-[var(--card)] border-[var(--accent)]" : "bg-[var(--card)] border-[var(--border)]"}`}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className={r.done ? "text-[var(--muted)]" : strong ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}>
                    {r.title}
                    {r.done ? <span className="ml-2 text-xs font-medium text-[var(--accent)]">done</span> : null}
                  </span>
                  <span className={`text-xs tabular-nums ${strong ? "text-[var(--foreground)] font-medium" : "text-[var(--muted)]"}`}>
                    {r.done ? "" : r.on ? `${passed ? "was " : ""}${r.onKind === "around" ? "about " : "by "}${letterDate(r.on)}` : "no fixed date"}
                  </span>
                </div>
                {!r.done ? (
                  <p className={`mt-0.5 text-xs ${strong ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                    {COST_LABEL[r.cost]}: {r.stake}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">{r.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: BvInputs; read: BvRead; today: string }) {
  const [copied, setCopied] = useState("");
  const rule = bvRule();
  const letters = bvLetters(inp, read);
  const reminders = bvReminders(read, today);
  const waits = canWait(inp, read);
  const debts = debtLines(inp);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{bvHeadline(inp, read, today)}</p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{bvBody(inp, read, today)}</p>

      {read.bsp && read.bsp.now > 0 ? <BspWindow bsp={read.bsp} /> : null}
      <Timeline read={read} today={today} />
      {reminders.length ? (
        <button type="button" onClick={() => downloadIcs(reminders)} className={`mt-3 ${action}`}>
          Add {reminders.length === 1 ? "the date" : `the ${reminders.length} dates`}{" "}to your calendar, with a week&rsquo;s warning (.ics)
        </button>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>What can wait</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {waits.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Two things not to put off: don&rsquo;t drive their car on their
          insurance (cover usually ends with the death), and keep their home
          and documents secure.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>Their debts aren&rsquo;t yours</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {debts.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`bv-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre
            aria-labelledby={`bv-letter-${l.id}`}
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
        Not legal advice. Free help: Citizens Advice (and Advice NI), the
        Bereavement Service on 0800 151 2012 for benefits, MoneyHelper&rsquo;s
        bereavement guides, and Cruse Bereavement Support on 0808 808 1677
        for the rest of it. If the estate is complicated, disputed or owes
        inheritance tax, a solicitor or the Probate helpline is worth the call.
      </p>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The line to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={async () => setCopied((await copyText(bvSummary(inp, read, today))) ? "all" : "no")}
            className={action}
          >
            {copied === "all" ? "Copied the whole list" : "Copy the whole list as text"}
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Worth sending to whoever&rsquo;s helping, so the list lives somewhere other than your head.
        </p>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words above instead.</p>
        ) : null}
      </div>
      <Handoffs inp={inp} read={read} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: BvInputs; read: BvRead }) {
  const list: Handoff[] = [];
  if (read.items.some((i) => i.id === "counciltax"))
    list.push({
      href: "/counciltax",
      label: "Check the council tax bill",
      note: "Once it's in your name, the council tax tool checks who counts in the house and dates any letter.",
    });
  list.push({
    href: "/scam",
    label: "A call, text or letter about their money?",
    note: "Fraudsters read death notices. Check anything asking for payment, bank details or an 'unclaimed inheritance' fee.",
  });
  list.push({
    href: "/collector",
    label: "A collector is chasing an old debt of theirs?",
    note: "It's a claim on the estate, not on you. The old-debt tool checks whether it's even still enforceable.",
  });
  if (inp.benefits === "yes" || inp.role === "cohab")
    list.push({
      href: "/challenge",
      label: "A benefit claim turned down?",
      note: "If Bereavement Support Payment or another benefit is refused, the DWP tool dates the one-month deadline to ask again.",
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
        More on why the list is sorted this way:{" "}
        <Link href="/writing/most-of-it-can-wait" className={link}>
          Most of it can wait
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
function BvExample({ today }: { today: string }) {
  const ex = bvExample(today);
  const read = readBv(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        My husband David died suddenly {read.days}{" "}days ago, at 52. We have
        two children at school and own the house jointly. The funeral&rsquo;s
        done, the death is registered, and there&rsquo;s a folder on the
        table of letters from his bank, his pension, his phone company and
        the council, all wanting something, all in the order they arrived.
      </p>
      {read.bsp ? <BspWindow bsp={read.bsp} /> : null}
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{bvHeadline(ex, read, today)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Nobody had mentioned it. I rang the Bereavement Service that
          afternoon. Then I wrote to his pension scheme, asked the council for
          the single person discount, and put the rest of the folder away
          until after half term. Nothing else in it had a date that mattered this month.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Take your time with them.
      </p>
    </div>
  );
}
