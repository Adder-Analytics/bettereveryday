"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import {
  BLANK_WILL,
  NRB,
  RNRB,
  STATUTORY_LEGACY,
  checksOf,
  isISODate,
  keepList,
  letterDate,
  messagesOf,
  money,
  outsideOf,
  parseWillInputs,
  readWill,
  remindersOf,
  routesOf,
  tilesOf,
  todayISO,
  willBody,
  willExample,
  willHeadline,
  willRule,
  willSummary,
  type DateLine,
  type Existing,
  type Home,
  type Insurance,
  type Kin,
  type Pension,
  type Rel,
  type Together,
  type Want,
  type Where,
  type WillInputs,
  type WillRead,
  type YesNo,
} from "../data/will";

/**
 * No will yet: who would get what, and what would you change? (/will)
 *
 * Shows who the intestacy rules (England and Wales) would give your estate
 * to, in pounds, beside what passes outside a will anyway, then lists the
 * gaps, the ways to get one written and what it costs, and drafts the notes
 * for whoever writes it.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/will.ts` so it can be checked without a browser.
 */

const STORE_KEY = "will:v1";

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

function loadInputs(): WillInputs {
  if (typeof window === "undefined") return BLANK_WILL;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseWillInputs(JSON.parse(raw)) : BLANK_WILL;
  } catch {
    return BLANK_WILL;
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
        `UID:will-${todayISO()}-${r.on}-${i}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/will`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Making a will")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "will-dates.ics";
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

function MoneyField({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="block text-sm text-[var(--foreground)] mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-base" aria-hidden="true">
          £
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          maxLength={12}
          onChange={(e) => onChange(e.target.value.replace(/[^\d,]/g, ""))}
          placeholder={placeholder}
          className={`${inputClass} pl-7`}
        />
      </div>
      {hint ? <p className={hintCls}>{hint}</p> : null}
    </div>
  );
}

const optional = <span className="text-[var(--muted)]">(optional)</span>;

const WANT_OPTIONS: { id: Want; label: string }[] = [
  { id: "partner", label: "My partner provided for first" },
  { id: "guardians", label: "Choose who brings up my children" },
  { id: "age", label: "Children inherit later than 18" },
  { id: "protect", label: "Protect my children's share if my partner remarries" },
  { id: "stepchild", label: "Include a stepchild" },
  { id: "gift", label: "Leave something to a friend or a charity" },
];

export default function WillClient() {
  const [inp, setInp] = useState<WillInputs>(BLANK_WILL);
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

  const set = <K extends keyof WillInputs>(k: K, v: WillInputs[K]) => setInp((prev) => ({ ...prev, [k]: v }));
  const toggleWant = (w: Want) =>
    setInp((prev) => ({ ...prev, wants: prev.wants.includes(w) ? prev.wants.filter((x) => x !== w) : [...prev.wants, w] }));
  const read = useMemo(() => readWill(inp, today), [inp, today]);
  const ew = inp.where === "ew";
  const couple = inp.rel === "married" || inp.rel === "cohabiting" || inp.rel === "separated";
  const married = inp.rel === "married" || inp.rel === "separated";
  const kidCount = (Number(inp.children) || 0) + (Number(inp.lines) || 0);
  const needKin = inp.children !== "" && kidCount === 0 && (inp.rel === "single" || inp.rel === "cohabiting");

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
        {showExample ? <WillExample today={today} /> : null}
      </div>

      {/* ---- You ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>You</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Where do you live?</p>
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

        {inp.where ? (
          <>
            <Question>Are you</Question>
            <Chips<Rel>
              label="Relationship"
              value={inp.rel}
              onPick={(v) => set("rel", v)}
              options={[
                { id: "married", label: "Married or in a civil partnership" },
                { id: "cohabiting", label: "Living with a partner, not married" },
                { id: "separated", label: "Married, but separated (not divorced)" },
                { id: "single", label: "Single, divorced or widowed" },
              ]}
            />
          </>
        ) : null}

        {inp.rel === "cohabiting" && ew ? (
          <>
            <Question>How long have you lived together?</Question>
            <Chips<Together>
              label="How long together"
              value={inp.together}
              onPick={(v) => set("together", v)}
              cols={3}
              options={[
                { id: "under2", label: "Under 2 years" },
                { id: "2to5", label: "2 to 5 years" },
                { id: "5plus", label: "More than 5 years" },
              ]}
            />
          </>
        ) : null}

        {couple ? (
          <div className="mt-5">
            <label htmlFor="will-partner" className="block text-sm text-[var(--foreground)] mb-2">
              {inp.rel === "separated" ? "Their name" : "Your partner's name"} {optional}
            </label>
            <input
              id="will-partner"
              type="text"
              value={inp.partnerName}
              maxLength={30}
              onChange={(e) => set("partnerName", e.target.value)}
              placeholder="Sam"
              className={inputClass}
            />
            <p className={hintCls}>Only used in the read and the messages below.</p>
          </div>
        ) : null}

        {inp.rel ? (
          <>
            <Question>Do you have a will already?</Question>
            <Chips<Existing>
              label="Existing will"
              value={inp.existing}
              onPick={(v) => set("existing", v)}
              cols={1}
              options={[
                { id: "none", label: "No" },
                { id: "current", label: "Yes, and nothing big has changed since" },
                { id: "beforeMarriage", label: "Yes, but I made it before I married" },
                { id: "beforeDivorce", label: "Yes, but I made it before a divorce" },
                { id: "old", label: "Yes, but it's old and life has changed" },
              ]}
            />
          </>
        ) : null}
      </div>

      {/* ---- Family ---- */}
      {ew && inp.rel && (inp.rel !== "cohabiting" || inp.together) ? (
        <div className={card}>
          <p className={eyebrow}>Your family</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <div>
              <label htmlFor="will-children" className="block text-sm text-[var(--foreground)] mb-2">
                How many children do you have?
              </label>
              <input
                id="will-children"
                type="text"
                inputMode="numeric"
                value={inp.children}
                maxLength={2}
                onChange={(e) => set("children", e.target.value.replace(/\D/g, ""))}
                placeholder="0"
                className={inputClass}
              />
              <p className={hintCls}>Living children, any age, including adopted. Not stepchildren.</p>
            </div>
            <div className="mt-5 sm:mt-0">
              <label htmlFor="will-lines" className="block text-sm text-[var(--foreground)] mb-2">
                Children who died, leaving children {optional}
              </label>
              <input
                id="will-lines"
                type="text"
                inputMode="numeric"
                value={inp.lines}
                maxLength={1}
                onChange={(e) => set("lines", e.target.value.replace(/\D/g, ""))}
                placeholder="0"
                className={inputClass}
              />
              <p className={hintCls}>Their children take their share.</p>
            </div>
          </div>

          {kidCount > 0 ? (
            <>
              <Question>Is any of them under 18?</Question>
              <Chips<YesNo>
                label="Under 18"
                value={inp.under18}
                onPick={(v) => set("under18", v)}
                options={[
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "No" },
                ]}
              />
            </>
          ) : null}

          {kidCount > 0 && married ? (
            <>
              <Question>Are any from an earlier relationship?</Question>
              <Chips<YesNo>
                label="Earlier relationship"
                value={inp.earlier}
                onPick={(v) => set("earlier", v)}
                options={[
                  { id: "yes", label: "Yes" },
                  { id: "no", label: "No" },
                ]}
              />
            </>
          ) : null}

          <Question>Is there a stepchild, or a partner&rsquo;s child, you think of as yours?</Question>
          <Chips<YesNo>
            label="Stepchild"
            value={inp.step}
            onPick={(v) => set("step", v)}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
            ]}
          />

          {needKin ? (
            <>
              <Question>Who&rsquo;s your closest living relative?</Question>
              <Chips<Kin>
                label="Closest relative"
                value={inp.kin}
                onPick={(v) => set("kin", v)}
                options={[
                  { id: "parents", label: "A parent" },
                  { id: "siblings", label: "A brother or sister (or their children)" },
                  { id: "halfsiblings", label: "A half-brother or half-sister" },
                  { id: "grandparents", label: "A grandparent" },
                  { id: "aunts", label: "An aunt or uncle (or cousins)" },
                  { id: "halfaunts", label: "A parent's half-sibling" },
                  { id: "none", label: "Nobody I know of" },
                ]}
              />
              <p className={hintCls}>The first one on this list who&rsquo;s alive. The law goes down it in this order.</p>
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- What you own ---- */}
      {ew && inp.rel && inp.children !== "" ? (
        <div className={card}>
          <p className={eyebrow}>What you own</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">Round numbers are fine. Nothing leaves your browser.</p>
          <Question>Your home</Question>
          <Chips<Home>
            label="Home"
            value={inp.home}
            onPick={(v) => set("home", v)}
            cols={1}
            options={[
              { id: "none", label: "I rent, or don't own one" },
              { id: "sole", label: "I own it on my own" },
              { id: "joint", label: "Jointly, as joint tenants (it passes to the other owner)" },
              { id: "common", label: "Jointly, as tenants in common (my share is mine to leave)" },
              { id: "unsure", label: "Jointly, and I'm not sure which" },
            ]}
          />
          {inp.home && inp.home !== "none" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <MoneyField id="will-home" label="What it's worth" value={inp.homeValue} onChange={(v) => set("homeValue", v)} placeholder="320,000" />
              <MoneyField id="will-mortgage" label="Mortgage left" value={inp.mortgage} onChange={(v) => set("mortgage", v)} placeholder="190,000" />
            </div>
          ) : null}
          <MoneyField
            id="will-savings"
            label="Everything else: savings, investments, a car, valuables"
            value={inp.savings}
            onChange={(v) => set("savings", v)}
            placeholder="30,000"
            hint="Your share only, for anything held jointly. Leave pensions out."
          />
          <MoneyField id="will-debts" label={<>Debts besides the mortgage {optional}</>} value={inp.debts} onChange={(v) => set("debts", v)} placeholder="0" />

          <Question>Life insurance</Question>
          <Chips<Insurance>
            label="Life insurance"
            value={inp.insurance}
            onPick={(v) => set("insurance", v)}
            options={[
              { id: "none", label: "None" },
              { id: "trust", label: "Yes, written in trust" },
              { id: "estate", label: "Yes, not in trust" },
              { id: "unsure", label: "Yes, not sure about trust" },
            ]}
          />
          {inp.insurance && inp.insurance !== "none" ? (
            <MoneyField
              id="will-insurance"
              label="How much it pays out"
              value={inp.insuranceAmount}
              onChange={(v) => set("insuranceAmount", v)}
              placeholder="150,000"
              hint="Leave out a policy that only pays off the mortgage: it's already counted."
            />
          ) : null}

          <Question>A pension that pays out if you die</Question>
          <Chips<Pension>
            label="Pension"
            value={inp.pension}
            onPick={(v) => set("pension", v)}
            options={[
              { id: "nominated", label: "Yes, and I've filled in who gets it" },
              { id: "not", label: "Yes, but never filled in who gets it" },
              { id: "unsure", label: "Not sure" },
              { id: "none", label: "No" },
            ]}
          />
          <p className={hintCls}>Most workplace pensions and many personal ones do, including death-in-service cover.</p>

          <Question>What would you want that the default might not do? {optional}</Question>
          <div role="group" aria-label="What you'd want" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WANT_OPTIONS.map((o) => {
              const on = inp.wants.includes(o.id);
              return (
                <button key={o.id} type="button" aria-pressed={on} onClick={() => toggleWant(o.id)} className={`${chipBase} ${on ? chipOn : chipOff}`}>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <AnnounceAnswer message={read ? willHeadline(read) : null} />
      {read ? (
        <ReadBlock read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where you live, who your family is and how you own your home. The read appears: who the law would give
            everything to without a will, what passes outside it anyway, the gaps, and the notes to take to whoever writes it.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_WILL)} />
    </div>
  );
}

function Tiles({ read }: { read: WillRead }) {
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

function ShareList({ title, list, showMoney }: { title: string; list: { who: string; amount: number; note: string }[]; showMoney: boolean }) {
  if (!list.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>{title}</p>
      <ul className="mt-2 divide-y divide-[var(--border)]">
        {list.map((s) => (
          <li key={`${s.who}-${s.note}`} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--foreground)] font-medium">{s.who}</span>
              <span className="block text-xs text-[var(--muted)] leading-relaxed">{s.note}</span>
            </span>
            {showMoney && s.amount >= 0 ? (
              <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">{money(s.amount)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Body({ read }: { read: WillRead }) {
  return (
    <div className="mt-3 space-y-3">
      {willBody(read)
        .split("\n\n")
        .map((para) => (
          <p key={para.slice(0, 40)} className="text-sm text-[var(--foreground)] leading-relaxed">
            {para}
          </p>
        ))}
    </div>
  );
}

function ReadBlock({ read }: { read: WillRead }) {
  const [copied, setCopied] = useState("");
  const rule = willRule(read);
  const msgs = messagesOf(read);
  const reminders = remindersOf(read);
  const routes = routesOf(read);
  const outside = outsideOf(read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{willHeadline(read)}</p>
      <Body read={read} />
      <Tiles read={read} />

      {read.computed ? <ShareList title="Without a will, the estate goes to" list={read.shares} showMoney={read.moneyKnown} /> : null}
      <ShareList title="Outside the will, whatever it says" list={outside} showMoney={read.moneyKnown} />

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>Getting it written</p>
        <ul className="mt-3 space-y-3 text-sm text-[var(--foreground)] leading-relaxed">
          {routes.map((r) => (
            <li key={r.title}>
              <span className="font-medium">{r.title}</span> <span className="text-[var(--muted)]">({r.cost}).</span>{" "}
              <span className="text-[var(--muted)]">{r.body}</span>
            </li>
          ))}
        </ul>
      </div>

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
                <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">{letterDate(r.on)}</span>
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
          <p className={eyebrow} id={`will-msg-${m.id}`}>
            {m.title}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{m.note}</p>
          <pre
            aria-labelledby={`will-msg-${m.id}`}
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
        England and Wales rules: a spouse&rsquo;s fixed sum of {money(STATUTORY_LEGACY)}{" "}(deaths since July 2023);
        inheritance tax allowances of {money(NRB)}{" "}and {money(RNRB)}{" "}for a home left to children. The inheritance tax
        figure is rough. This isn&rsquo;t legal advice: Citizens Advice, the Law Society&rsquo;s Find a Solicitor and Will
        Aid can help.
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
            onClick={async () => setCopied((await copyText(willSummary(read))) ? "all" : "no")}
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
      href: "/lpa",
      label: "A will only works after you die.",
      note: "A power of attorney covers the years you might not be able to decide. It has to be made while you can.",
    },
    {
      href: "/bereavement",
      label: "Someone has just died?",
      note: "This sorts the paperwork by what waiting would cost, will or no will.",
    },
    {
      href: "/pension",
      label: "Taking money from a pension?",
      note: "From April 2027 most unused pots count for inheritance tax; see what taking it out actually changes.",
    },
    {
      href: "/baby",
      label: "A baby on the way?",
      note: "The money and dates for a new child. Add guardians to the list.",
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
        <Link href="/writing/the-will-you-already-have" className={link}>
          The will you already have
        </Link>
        .
      </p>
    </div>
  );
}

/** The worked example, read-only, on the same read the live tool uses. */
function WillExample({ today }: { today: string }) {
  const read = readWill(willExample(), today);
  const married = readWill({ ...willExample(), rel: "married" }, today);
  if (!read || !married) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">A worked example — nothing here is saved</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I&rsquo;m 38 and I&rsquo;ve lived with Sam for nine years. We&rsquo;re not married. We have two children, 7 and 4.
        We own the house together (£320,000, with £190,000 left on the mortgage), I have about £30,000 in savings and the
        car, and £150,000 of life insurance through a broker. There&rsquo;s a workplace pension too. No will: we always
        assumed everything would go to each other.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{willHeadline(read)}</p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Sam would get my half of the house, because we own it as joint tenants: about {money(read.homeOutside)}. But the
          savings and the insurance payout, {money(read.estate)}, would go to the children, {money(read.perChild)}{" "}each,
          held in trust until they&rsquo;re 18 and then handed over outright. Sam&rsquo;s only route to any of it is a court
          claim against our own children&rsquo;s inheritance. If we were married, Sam would get all {money(married.toSpouse)}.
          The insurance isn&rsquo;t in trust, so it waits for probate, and the pension&rsquo;s nomination form was never
          filled in. Two wills, a trust form and a pension form fix all of it, and Will Aid would write the wills this month
          for a donation.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}situation.
      </p>
    </div>
  );
}
