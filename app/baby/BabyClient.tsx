"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import {
  BLANK_BB,
  RATE,
  actDate,
  addDaysISO,
  bbBody,
  bbExample,
  bbHeadline,
  bbLetters,
  bbReminders,
  bbRule,
  bbSummary,
  canWait,
  isISODate,
  letterDate,
  money,
  parseBbInputs,
  payDates,
  readBb,
  todayISO,
  type BbIncome,
  type BbInputs,
  type BbItem,
  type BbPer,
  type BbRead,
  type BbRegion,
  type BbRole,
  type BbWork,
  type YesNo,
} from "../data/baby";

/**
 * A baby's coming: what to tell, claim, and by when? (/baby)
 *
 * Counts back from the due date to the week that decides the money (the
 * qualifying week, about 25 weeks pregnant), says whether statutory pay
 * applies and how much, draws the pay through the year so the drops are
 * visible months ahead, and sorts everything else by what waiting would cost.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/baby.ts` so it can be checked without a browser.
 */

const STORE_KEY = "baby:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase = "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff = "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow = "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card = "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const link = "text-[var(--accent)] hover:opacity-70 transition-opacity";
const action = "text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity";

function loadInputs(): BbInputs {
  if (typeof window === "undefined") return BLANK_BB;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseBbInputs(JSON.parse(raw)) : BLANK_BB;
  } catch {
    return BLANK_BB;
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
        `UID:baby-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/baby`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P7D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "A baby's coming")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "baby-dates.ics";
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

const YES_NO: { id: YesNo; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];

function Q({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-sm text-[var(--foreground)] mb-2">{children}</p>;
}

export default function BabyClient() {
  const [inp, setInp] = useState<BbInputs>(BLANK_BB);
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

  const set = <K extends keyof BbInputs>(k: K, v: BbInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readBb(inp, today), [inp, today]);
  const birth = inp.role === "birth";

  return (
    <div>
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowExample((s) => !s)}
          aria-expanded={showExample}
          className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {showExample ? "Hide the worked example ↑" : "See a worked example first ↓"}
        </button>
        {showExample ? <BbExample today={today} /> : null}
      </div>

      {/* ---- The essentials ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--foreground)] mb-2">Where do you live?</p>
        <Chips<BbRegion>
          label="Where you live"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "ew", label: "England or Wales" },
            { id: "scot", label: "Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        <Q>Which are you?</Q>
        <Chips<BbRole>
          label="Which parent you are"
          value={inp.role}
          onPick={(v) => set("role", v)}
          options={[
            { id: "birth", label: "I'm pregnant, or I've just given birth" },
            { id: "partner", label: "I'm the partner, or the other parent" },
          ]}
        />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="bb-due" className="block text-sm text-[var(--foreground)] mb-2">
              The due date
            </label>
            <input id="bb-due" type="date" value={inp.dueOn} onChange={(e) => set("dueOn", e.target.value)} className={inputClass} />
            <p className="mt-1.5 text-xs text-[var(--muted)]">From the dating scan, or on the MATB1.</p>
          </div>
          <div>
            <label htmlFor="bb-born" className="block text-sm text-[var(--foreground)] mb-2">
              Date of birth <span className="text-[var(--muted)]">(once the baby&rsquo;s here)</span>
            </label>
            <input id="bb-born" type="date" value={inp.bornOn} max={today} onChange={(e) => set("bornOn", e.target.value)} className={inputClass} />
          </div>
        </div>
        <Q>{birth ? "Your work" : "Your work, as the partner"}</Q>
        <Chips<BbWork>
          label="Your work"
          value={inp.work}
          onPick={(v) => set("work", v)}
          cols={1}
          options={[
            { id: "employed", label: "Employed (including agency or zero-hours, if you're paid through payroll)" },
            { id: "self", label: "Self-employed" },
            { id: "none", label: "Not working at the moment" },
          ]}
        />
        {inp.work === "employed" ? (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bb-start" className="block text-sm text-[var(--foreground)] mb-2">
                Started with this employer on
              </label>
              <input
                id="bb-start"
                type="date"
                value={inp.startedOn}
                max={today}
                onChange={(e) => set("startedOn", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="bb-leave" className="block text-sm text-[var(--foreground)] mb-2">
                Leave to start on <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input id="bb-leave" type="date" value={inp.leaveOn} onChange={(e) => set("leaveOn", e.target.value)} className={inputClass} />
            </div>
          </div>
        ) : null}
        {inp.work === "employed" || inp.work === "self" ? (
          <div className="mt-5">
            <label htmlFor="bb-pay" className="block text-sm text-[var(--foreground)] mb-2">
              {inp.work === "self" ? "Roughly what you make, before tax" : "Your pay before tax and deductions"}{" "}
              <span className="text-[var(--muted)]">(optional, for the amounts)</span>
            </label>
            <div className="flex gap-2">
              <input
                id="bb-pay"
                type="text"
                inputMode="decimal"
                value={inp.pay}
                onChange={(e) => set("pay", e.target.value)}
                placeholder="e.g. 2,600"
                className={inputClass}
              />
              <select
                aria-label="Pay period"
                value={inp.per}
                onChange={(e) => set("per", e.target.value as BbPer)}
                className="px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
              >
                <option value="week">a week</option>
                <option value="month">a month</option>
                <option value="year">a year</option>
              </select>
            </div>
          </div>
        ) : null}
        {inp.work === "employed" ? (
          <>
            <Q>Have you told your employer in writing yet?</Q>
            <Chips<YesNo> label="Whether you've told your employer" value={inp.told} onPick={(v) => set("told", v)} options={YES_NO} />
          </>
        ) : null}
      </div>

      {read ? (
        <div className={card}>
          <p className={eyebrow}>What changes the list</p>
          <Q>Do you or your partner get Universal Credit, tax credits, or another means-tested benefit?</Q>
          <Chips<YesNo> label="Whether you get a means-tested benefit" value={inp.benefits} onPick={(v) => set("benefits", v)} options={YES_NO} />
          <Q>Is there another child under 16 in your home?</Q>
          <Chips<YesNo> label="Whether there's another child under 16" value={inp.otherKids} onPick={(v) => set("otherKids", v)} options={YES_NO} />
          <Q>The higher earner in the home earns</Q>
          <Chips<BbIncome>
            label="The higher earner's income"
            value={inp.income}
            onPick={(v) => set("income", v)}
            cols={1}
            options={[
              { id: "under", label: "Under £60,000 a year" },
              { id: "between", label: "£60,000 to £80,000" },
              { id: "over", label: "Over £80,000" },
            ]}
          />
        </div>
      ) : null}

      <AnnounceAnswer message={read ? bbHeadline(inp, read, today) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where you live, which parent you are and the due date. The list
            appears, counted back from the due date: the week that decides the
            pay, what to tell your employer and when, and the claims after the
            birth that are only backdated a few months.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_BB)} />
    </div>
  );
}

/**
 * The count back: due week, qualifying week, and the 26 weeks before it, on
 * one line, so the week that decides is visibly far from the date everyone
 * watches.
 */
function CountBack({ read, today }: { read: BbRead; today: string }) {
  // The pregnancy as a ruler, week 0 to the due week, so the qualifying week
  // shows up where it really is: well before the end.
  const start = addDaysISO(read.ewc, -40 * 7);
  const end = addDaysISO(read.ewc, 7);
  const span = Math.max(1, (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000);
  const x = (iso: string) => Math.min(100, Math.max(0, ((new Date(iso).getTime() - new Date(start).getTime()) / 86_400_000 / span) * 100));
  const refFrom = addDaysISO(read.qw, -56);
  const todayIn = today >= start && today <= end;
  const ticks = [
    { iso: start, label: "Week 0", align: "left" },
    { iso: read.qwEnd, label: "Week 25", align: "center" },
    { iso: read.ewc, label: "Due", align: "right" },
  ];
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Count back, not forward</p>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        The due date is the one everyone watches. The pay is decided about 15 weeks before it, by whether you&rsquo;d
        been with your employer 26 weeks by then and what you earned in the eight weeks up to it.
      </p>
      <div className="relative mt-8 mb-9 h-3 rounded bg-[var(--border)]/40" aria-hidden>
        <div className="absolute inset-y-0 rounded bg-[var(--accent)]/30" style={{ left: `${x(refFrom)}%`, width: `${x(read.qwEnd) - x(refFrom)}%` }} />
        <div className="absolute -top-1 h-5 w-0.5 bg-[var(--accent)]" style={{ left: `${x(read.qwEnd)}%` }} />
        <div className="absolute -top-1 h-5 w-0.5 bg-[var(--foreground)]/60" style={{ left: `calc(${x(read.ewc)}% - 2px)` }} />
        {todayIn ? (
          <div className="absolute -top-6" style={{ left: `${x(today)}%` }}>
            <span className="absolute -translate-x-1/2 -top-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)] whitespace-nowrap">Today</span>
            <div className="mt-3.5 h-6 w-0.5 bg-[var(--foreground)]" />
          </div>
        ) : null}
        {ticks.map((t) => (
          <span
            key={t.label}
            className={`absolute top-5 text-[11px] whitespace-nowrap ${t.label === "Week 25" ? "text-[var(--accent)] font-semibold -translate-x-1/2" : "text-[var(--muted)]"} ${t.align === "right" ? "-translate-x-full" : ""}`}
            style={{ left: `${x(t.iso)}%` }}
          >
            {t.label}
          </span>
        ))}
      </div>
      <ul className="space-y-1.5 text-sm">
        {todayIn ? (
          <li className="flex justify-between gap-3">
            <span className="font-medium text-[var(--foreground)]">Today</span>
            <span className="tabular-nums text-[var(--muted)]">{letterDate(today)}</span>
          </li>
        ) : null}
        <li className="flex justify-between gap-3">
          <span className="text-[var(--muted)]">Started with them by</span>
          <span className="tabular-nums text-right text-[var(--foreground)]">about {letterDate(read.startBy)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-[var(--muted)]">
            <span className="inline-block h-2 w-3 rounded-sm bg-[var(--accent)]/30 mr-1.5 align-middle" aria-hidden />
            Pay that sets the first six weeks
          </span>
          <span className="tabular-nums text-right text-[var(--foreground)]">8 weeks to {letterDate(read.qwEnd)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="font-semibold text-[var(--accent)]">Qualifying week ends: tell your employer</span>
          <span className="tabular-nums text-right shrink-0 font-semibold text-[var(--foreground)]">{letterDate(read.qwEnd)}</span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-[var(--muted)]">Due week begins</span>
          <span className="tabular-nums text-[var(--foreground)]">{letterDate(read.ewc)}</span>
        </li>
      </ul>
    </div>
  );
}

/**
 * Pay through the year, as a step chart: usual pay as a dashed line, the
 * statutory pay as bars week by week, so the drop at week 7 and the stop at
 * week 40 are seen months before they're felt.
 */
function PayYear({ read }: { read: BbRead }) {
  const p = read.pay;
  if (!p.awe || !p.high || !p.low || p.kind === "spp" || p.kind === "none" || p.kind === "unknown") return null;
  const weeks = Array.from({ length: 52 }, (_, i) => (i < 6 && p.kind === "smp" ? p.high! : i < 39 ? p.low! : 0));
  const top = Math.max(p.awe, ...weeks) * 1.08;
  const W = 520;
  const H = 150;
  const bw = W / 52;
  const y = (v: number) => H - (v / top) * H;
  const { drop, stop } = payDates(read);
  const gap = (p.usualYear ?? 0) - (p.statYear ?? 0);
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Your pay through the year</p>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        {p.kind === "smp" ? "Statutory Maternity Pay" : "Maternity Allowance"}, week by week, against your usual {money(p.awe)} a week (before tax).
      </p>
      <svg viewBox={`0 0 ${W} ${H + 32}`} className="mt-3 w-full h-auto" role="img" aria-label={`Weekly pay: ${p.kind === "smp" ? `${money(p.high, true)} for weeks 1 to 6, then ` : ""}${money(p.low, true)} to week 39, then nothing to week 52.`}>
        {weeks.map((v, i) => (
          <rect
            key={i}
            x={i * bw + 0.5}
            y={y(v)}
            width={bw - 1}
            height={Math.max(0, H - y(v))}
            className={i < 6 && p.kind === "smp" ? "fill-[var(--accent)]" : "fill-[var(--foreground)]"}
            fillOpacity={i < 6 && p.kind === "smp" ? 1 : 0.45}
          />
        ))}
        <line x1={0} x2={W} y1={y(p.awe)} y2={y(p.awe)} className="stroke-[var(--foreground)]" strokeDasharray="4 4" strokeWidth={1} />
        <line x1={0} x2={W} y1={H} y2={H} className="stroke-[var(--border)]" strokeWidth={1} />
        {[
          { w: 0, label: "Week 1", anchor: "start" as const },
          { w: 39, label: "Week 40", anchor: "middle" as const },
          { w: 52, label: "52", anchor: "end" as const },
        ].map((t) => (
          <text key={t.w} x={t.w * bw} y={H + 26} textAnchor={t.anchor} className="fill-[var(--muted)]" fontSize={20}>
            {t.label}
          </text>
        ))}
      </svg>
      <ul className="mt-3 space-y-1.5 text-sm">
        {p.kind === "smp" ? (
          <li className="flex justify-between gap-3">
            <span className="text-[var(--muted)]">Weeks 1 to 6, from {letterDate(read.leaveFrom)}</span>
            <span className="tabular-nums font-medium text-right whitespace-nowrap text-[var(--foreground)]">{money(p.high, true)} a week</span>
          </li>
        ) : null}
        <li className="flex justify-between gap-3">
          <span className="text-[var(--muted)]">{p.kind === "smp" ? `Weeks 7 to 39, from ${letterDate(drop)}` : `Weeks 1 to 39, from ${letterDate(read.leaveFrom)}`}</span>
          <span className="tabular-nums font-medium text-right whitespace-nowrap text-[var(--foreground)]">{money(p.low, true)} a week</span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="text-[var(--muted)]">Weeks 40 to 52, from {letterDate(stop)}</span>
          <span className="tabular-nums font-medium text-right whitespace-nowrap text-[var(--foreground)]">nothing statutory</span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        {gap > 0
          ? `Over the year, that's ${money(p.statYear ?? 0)} against ${money(p.usualYear ?? 0)} of usual pay: ${money(gap)} less, before tax and any enhanced pay. `
          : ""}
        The dates assume leave from {letterDate(read.leaveFrom)}; change it above. When the household&rsquo;s income drops, check Universal Credit with a benefits calculator (Turn2us or entitledto): many families on maternity pay qualify for some.
      </p>
    </div>
  );
}

const COST_LABEL: Record<BbItem["cost"], string> = {
  money: "Costs money if it waits",
  duty: "Has a date",
  none: "No deadline",
};

function whenLabel(r: BbItem, passed: boolean): string {
  if (r.done) return "";
  if (!r.on) return "no fixed date";
  const k = r.onKind === "around" ? "about " : r.onKind === "from" ? "from " : "by ";
  return `${passed ? "was " : ""}${k}${letterDate(r.on)}`;
}

function Timeline({ read, today }: { read: BbRead; today: string }) {
  const rows = read.items;
  const isPassed = (r: BbItem) => !r.done && r.on !== "" && r.on < today && r.onKind !== "from";
  const firstAhead = rows.findIndex((i) => !i.done && (!i.on || i.on >= today));
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What&rsquo;s due, and when</p>
      <ol className="mt-4 space-y-0">
        {rows.map((r, idx) => {
          const passed = isPassed(r);
          const showToday = idx === firstAhead;
          const strong = r.cost === "money" && !r.done && !passed;
          return (
            <li key={r.id} className="relative">
              {showToday ? (
                <div className="flex items-center gap-2 pb-3 ml-1.5 pl-6 border-l-2 border-[var(--accent)]" aria-hidden>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">Today, {actDate(today)}</span>
                </div>
              ) : null}
              <div className={`relative pl-6 pb-4 border-l-2 ml-1.5 ${idx < firstAhead || firstAhead === -1 ? "border-[var(--accent)]" : "border-[var(--border)]"}`}>
                <span
                  aria-hidden
                  className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 ${strong ? "bg-[var(--accent)] border-[var(--accent)]" : r.done ? "bg-[var(--card)] border-[var(--accent)]" : "bg-[var(--card)] border-[var(--border)]"}`}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className={r.done ? "text-[var(--muted)]" : strong ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}>
                    {r.title}
                    {r.done ? <span className="ml-2 text-xs font-medium text-[var(--accent)]">done</span> : null}
                  </span>
                  <span className={`text-xs tabular-nums ${strong ? "text-[var(--foreground)] font-medium" : "text-[var(--muted)]"}`}>{whenLabel(r, passed)}</span>
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

function ReadBlock({ inp, read, today }: { inp: BbInputs; read: BbRead; today: string }) {
  const [copied, setCopied] = useState("");
  const letters = bbLetters(inp, read);
  const reminders = bbReminders(read, today);
  const waits = canWait(inp, read);
  const showCount = !read.born && (inp.work === "employed" || inp.work === "");
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{bbHeadline(inp, read, today)}</p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{bbBody(inp, read, today)}</p>

      {showCount ? <CountBack read={read} today={today} /> : null}
      <PayYear read={read} />
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
      </div>

      {letters.map((l) => (
        <div key={l.id} className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id={`bb-letter-${l.id}`}>{l.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{l.note}</p>
          <pre aria-labelledby={`bb-letter-${l.id}`} className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]">
            {l.text}
          </pre>
          <button type="button" onClick={async () => setCopied((await copyText(l.text)) ? l.id : "no")} className={`mt-3 ${action}`}>
            {copied === l.id ? "Copied" : "Copy the letter"}
          </button>
        </div>
      ))}

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Rates are for 2026/27 (statutory pay {money(RATE.flat, true)} a week; lower earnings limit {money(RATE.lel)}).
        Not legal advice. Free help: Maternity Action&rsquo;s advice line, Working Families, Citizens Advice (and
        Advice NI), and Acas on 0300 123 1100 if your employer treats you unfairly for being pregnant. A claim to an
        employment tribunal has a short time limit (usually three months less a day), and starts with Acas early
        conciliation.
      </p>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The line to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{bbRule()}</p>
        <button
          type="button"
          onClick={async () => setCopied((await copyText(bbSummary(inp, read, today))) ? "all" : "no")}
          className={`mt-3 ${action}`}
        >
          {copied === "all" ? "Copied the whole list" : "Copy the whole list as text"}
        </button>
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">Worth sending to your partner, so the dates live in two heads.</p>
        {copied === "no" ? <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the words above instead.</p> : null}
      </div>
      <Handoffs inp={inp} />
    </div>
  );
}

function Handoffs({ inp }: { inp: BbInputs }) {
  const list: { href: string; label: string; note: string }[] = [];
  list.push({
    href: "/bills",
    label: "Rework who pays for what",
    note: "When one pay drops to statutory, a half-each split of the bills stops being fair. The bills tool lays out the three rules in money.",
  });
  if (inp.work === "employed")
    list.push({
      href: "/leaving",
      label: "Not going back?",
      note: "If you resign at the end of leave, the holiday built up while you were off is owed. The last-pay tool checks the payslip.",
    });
  if (inp.benefits === "yes")
    list.push({
      href: "/challenge",
      label: "A claim turned down?",
      note: "Maternity Allowance and the grants are DWP decisions: you can ask for a mandatory reconsideration within a month.",
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
        Why the list counts back:{" "}
        <Link href="/writing/count-back-from-the-due-date" className={link}>
          Count back from the due date
        </Link>
        .
      </p>
    </div>
  );
}

function BbExample({ today }: { today: string }) {
  const ex = bbExample(today);
  const read = readBb(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I&rsquo;m 18 weeks pregnant with our first, due {letterDate(ex.dueOn)}. I&rsquo;ve been at the same firm three
        years on £2,600 a month. I was going to tell my manager &ldquo;nearer the time&rdquo;, and I&rsquo;d been
        thinking about taking a couple of weeks&rsquo; unpaid leave next month, while work&rsquo;s quiet.
      </p>
      <CountBack read={read} today={today} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{bbHeadline(ex, read, today)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The unpaid leave would have fallen in the eight weeks that set my first six weeks of pay. Two weeks unpaid
          there would have cut my average by about a quarter, and cost me about {money((read.pay.high ?? 0) * 6 * 0.25)}{" "}
          of maternity pay for a holiday. I moved it to the spring, sent the letter, and put the qualifying week in
          the calendar.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">Your own fields below are blank.</p>
    </div>
  );
}
