"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { formatMoney, moneyInvalid } from "../data/worth";
import {
  BLANK_CATCHUP,
  actDate,
  catchupBody,
  catchupExample,
  catchupHeadline,
  catchupRule,
  catchupSummary,
  dateProblem,
  evidenceLines,
  isISODate,
  letterDate,
  limitMonths,
  mainLetter,
  parseCatchupInputs,
  readCatchup,
  todayISO,
  type Afford,
  type Basis,
  type CatchupInputs,
  type CatchupRead,
  type CatchupStage,
  type Conduct,
  type Fuel,
  type Region,
} from "../data/catchup";

/**
 * A catch-up energy bill: what do you owe? (/catchup)
 *
 * The instrument for the bill that arrives after a year or two of estimates or
 * a silent smart meter. The call turns on one date: energy used more than 12
 * months before the bill (13 in Northern Ireland) usually can't be charged. So
 * the tool splits the period at that date, seasonally, writes the complaint,
 * sizes the repayment plan for the rest, and dates the ombudsman.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/catchup.ts` so it can be checked without a browser.
 */

const STORE_KEY = "catchup:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £1,840.";

function money(n: number): string {
  return formatMoney(n, "£");
}

function loadInputs(): CatchupInputs {
  if (typeof window === "undefined") return BLANK_CATCHUP;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseCatchupInputs(JSON.parse(raw)) : BLANK_CATCHUP;
  } catch {
    return BLANK_CATCHUP;
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

/** The day the ombudsman opens, as one all-day event. */
function remindOn(read: CatchupRead, today: string): { on: string; title: string; body: string } | null {
  if (read.kind !== "wait" || !read.ombudsmanFrom || read.ombudsmanFrom < today) return null;
  return {
    on: read.ombudsmanFrom,
    title: "Energy bill: eight weeks are up",
    body: "If the supplier hasn't fixed the bill, apply to the ombudsman today. It's free.",
  };
}

function downloadIcs(inp: CatchupInputs, r: { on: string; title: string; body: string }): void {
  if (!isISODate(r.on)) return;
  const what = inp.what.trim();
  const day = r.on.replace(/-/g, "");
  const [y, m, d] = r.on.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  const end = `${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`;
  const event = [
    "BEGIN:VEVENT",
    `UID:catchup-${todayISO()}-${r.on}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(what ? `${r.title} (${what})` : r.title)}`,
    `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/catchup`)}`,
    "END:VEVENT",
  ];
  const blob = new Blob([wrapCalendar([event], "Energy bill")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-bill-${r.on}.ics`;
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

export default function CatchupClient() {
  const [inp, setInp] = useState<CatchupInputs>(BLANK_CATCHUP);
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

  const set = <K extends keyof CatchupInputs>(k: K, v: CatchupInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readCatchup(inp, today), [inp, today]);
  const problem = dateProblem(inp);
  const months = limitMonths(inp.region || "gb");

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
        {showExample ? <CatchupExample today={today} /> : null}
      </div>

      {/* ---- The bill ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="catchup-what" className={`block ${eyebrow} mb-2`}>
          Which bill?
        </label>
        <input
          id="catchup-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. gas and electricity at the flat"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <label htmlFor="catchup-supplier" className="block mt-4 text-sm text-[var(--foreground)] mb-2">
          The supplier <span className="text-[var(--muted)]">(optional)</span>
        </label>
        <input
          id="catchup-supplier"
          type="text"
          value={inp.supplier}
          onChange={(e) => set("supplier", e.target.value)}
          placeholder="The name on the bill"
          className={inputClass}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where is the home?</p>
        <Chips<Region>
          label="Where the home is"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "gb", label: "England, Scotland or Wales" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">For which fuel?</p>
        <Chips<Fuel>
          label="Which fuel"
          value={inp.fuel}
          onPick={(v) => set("fuel", v)}
          options={[
            { id: "gas", label: "Gas" },
            { id: "electricity", label: "Electricity" },
            { id: "both", label: "Both on one bill" },
          ]}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          Gas is mostly winter heating, so it changes how the period splits.
          With electric heating, pick gas.
        </p>
      </div>

      {/* ---- The amount and the dates ---- */}
      {inp.region && inp.fuel ? (
        <div className={card}>
          <p className={eyebrow}>The amount and the dates</p>
          <div className="mt-3 sm:max-w-[16rem]">
            <label htmlFor="catchup-amount" className="block text-sm text-[var(--foreground)] mb-2">
              What the bill asks for on top
            </label>
            <input
              id="catchup-amount"
              type="text"
              inputMode="decimal"
              value={inp.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="e.g. £1,840"
              aria-invalid={moneyInvalid(inp.amount)}
              className={inputClass}
            />
            {moneyInvalid(inp.amount) ? <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p> : null}
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            The shortfall: the balance it says you owe for the period, after
            what you&rsquo;ve already paid by direct debit. Not your normal
            monthly amount.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DateField id="catchup-bill-on" label="Date on the bill" value={inp.billOn} max={today} onChange={(v) => set("billOn", v)} />
            <DateField
              id="catchup-from"
              label="The period starts"
              value={inp.from}
              max={today}
              onChange={(v) => set("from", v)}
              hint="The last real reading before the gap."
            />
            <DateField
              id="catchup-to"
              label="And ends (optional)"
              value={inp.to}
              max={today}
              onChange={(v) => set("to", v)}
              hint="The new reading. Blank means the bill date."
            />
          </div>
          {problem ? <p className="mt-2 text-xs text-[var(--foreground)]">{problem}</p> : null}
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Is the bill based on a real reading?</p>
          <Chips<Basis>
            label="Whether the bill uses a real reading"
            value={inp.basis}
            onPick={(v) => set("basis", v)}
            options={[
              { id: "actual", label: "Yes: an engineer, a smart reading, or mine" },
              { id: "estimate", label: "No, it says estimated" },
              { id: "unsure", label: "I can't tell" },
            ]}
          />
        </div>
      ) : null}

      {/* ---- Why it's late ---- */}
      {inp.region && inp.fuel ? (
        <div className={card}>
          <p className={eyebrow}>Why it wasn&rsquo;t billed sooner</p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Be honest: this decides whether the {months}-month limit applies.
          </p>
          <div className="mt-3">
            <Chips<Conduct>
              label="Why the bill wasn't sent sooner"
              value={inp.conduct}
              onPick={(v) => set("conduct", v)}
              cols={1}
              options={[
                { id: "fine", label: "Their side: the smart meter stopped sending, they estimated, or they never asked" },
                { id: "ignored", label: "They asked me for readings, and I didn't send them" },
                { id: "blocked", label: "I refused access to the meter, or it was tampered with" },
                { id: "unpaid", label: "They sent correct bills at the time, and I didn't pay them" },
              ]}
            />
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where has it got to?</p>
          <Chips<CatchupStage>
            label="Where the complaint has got to"
            value={inp.stage}
            onPick={(v) => set("stage", v)}
            cols={1}
            options={[
              { id: "new", label: "The bill has just come" },
              { id: "complained", label: "I've complained, and I'm waiting" },
              { id: "deadlock", label: "They've sent a final response, or a deadlock letter" },
            ]}
          />
          {inp.stage === "complained" || inp.stage === "deadlock" ? (
            <div className="mt-4 sm:max-w-[16rem]">
              <DateField
                id="catchup-stage-on"
                label={inp.stage === "complained" ? "The day you complained" : "Date on the final response"}
                value={inp.stageOn}
                max={today}
                onChange={(v) => set("stageOn", v)}
              />
            </div>
          ) : null}
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Can you pay what&rsquo;s owed in one go?</p>
          <Chips<Afford>
            label="Whether you can pay in one go"
            value={inp.afford}
            onPick={(v) => set("afford", v)}
            options={[
              { id: "lump", label: "Yes" },
              { id: "spread", label: "No, I need to spread it" },
            ]}
          />
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? catchupHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give the amount, the bill&rsquo;s date and the period it covers,
            whether it&rsquo;s a real reading, why it&rsquo;s late and where
            it&rsquo;s got to, and the read appears: the part too old to
            charge, the complaint to send, and the plan to ask for.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_CATCHUP);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/** The bill split at the cut-off. */
function Split({ inp, read }: { inp: CatchupInputs; read: CatchupRead }) {
  const excluded = inp.conduct === "blocked" || inp.conduct === "unpaid";
  const oldPct = Math.round(read.share * 100);
  const rows: { label: string; value: number; note?: string }[] = [
    { label: "The bill asks for", value: read.amount },
    {
      label: `Used before ${letterDate(read.cutoff)}`,
      value: excluded ? 0 : read.tooOld,
      note: excluded
        ? "The limit doesn't apply here"
        : inp.conduct === "ignored" && read.tooOld > 0
          ? "Arguable: they asked for readings"
          : read.tooOld > 0
            ? "Too old to charge"
            : "None of the period is that old",
    },
    { label: "Can be charged", value: read.owed },
  ];
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The bill, split at the cut-off</p>
      {!excluded && read.share > 0 && read.share < 1 ? (
        <div aria-hidden="true" className="mt-3 flex h-2.5 overflow-hidden rounded-full border border-[var(--border)]">
          <div className="bg-[var(--accent)]" style={{ width: `${oldPct}%` }} />
          <div className="bg-[var(--border)] flex-1" />
        </div>
      ) : null}
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.label} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--foreground)]">{r.label}</span>
              {r.note ? <span className="block text-xs text-[var(--muted)]">{r.note}</span> : null}
            </span>
            <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">{money(r.value)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        An estimate: each day of the period is weighted by its month&rsquo;s
        share of a typical year&rsquo;s {inp.fuel === "electricity" ? "electricity" : inp.fuel === "gas" ? "gas" : "gas and electricity"},
        so winter days count for more. The supplier has to do the real split
        from the readings.
      </p>
      {inp.afford === "spread" && read.owed > 0 ? (
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The plan to ask for:{" "}
          <span className="font-medium">
            {money(read.perMonth)} a month for {read.planMonths} month{read.planMonths === 1 ? "" : "s"}
          </span>
          , as long as it took to build up, on top of your usual payment.
        </p>
      ) : null}
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: CatchupInputs; read: CatchupRead; today: string }) {
  const [copied, setCopied] = useState<"" | "main" | "line" | "all" | "no">("");
  const rule = catchupRule();
  const main = mainLetter(inp, read);
  const remind = remindOn(read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {catchupHeadline(inp, read)}
      </p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{catchupBody(inp, read)}</p>

      <Split inp={inp} read={read} />

      {main ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id="catchup-main-msg">{main.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            {read.kind === "ombudsman"
              ? "Paste this into the complaint form on the ombudsman's website, and upload the bill, your complaint and their replies."
              : "Email it or use the supplier's complaint form, and keep a copy. Fill in the square brackets, and attach a dated photo of the meter."}
          </p>
          <pre
            aria-labelledby="catchup-main-msg"
            className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
          >
            {main.text}
          </pre>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(main.text)) ? "main" : "no")}
            className={`mt-3 ${action}`}
          >
            {copied === "main" ? "Copied" : "Copy the letter"}
          </button>
        </div>
      ) : null}

      {read.ombudsmanFrom ? (
        <p className="mt-4 text-sm text-[var(--foreground)]">
          {inp.region === "ni" ? "The Consumer Council" : "The Energy Ombudsman"}:{" "}
          <span className="font-medium">
            from {actDate(read.ombudsmanFrom)}
            {read.ombudsmanBy ? ` to ${letterDate(read.ombudsmanBy)}` : ""}
          </span>
        </p>
      ) : null}
      {remind ? (
        <button type="button" onClick={() => downloadIcs(inp, remind)} className={`mt-2 ${action}`}>
          Add {actDate(remind.on)} to your calendar (.ics)
        </button>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>What to keep together</p>
        <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
          {evidenceLines(inp).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. The 12-month rule covers homes and microbusinesses in
        Great Britain; Northern Ireland&rsquo;s is 13 months where the
        supplier was at fault. A refund the supplier owes you isn&rsquo;t
        limited this way. If you&rsquo;re struggling to pay, Citizens Advice
        and StepChange give free help, and a supplier must offer a plan you
        can afford before it considers a prepayment meter.
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
            onClick={async () => setCopied((await copyText(catchupSummary(inp, read))) ? "all" : "no")}
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

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp }: { inp: CatchupInputs }) {
  const list: Handoff[] = [
    {
      href: withSubject("/debts", inp.what),
      label: "Other debts as well?",
      note: "Put the plan beside the cards and the overdraft, and see which to pay first.",
    },
    {
      href: withSubject("/rule", "photograph the meters every quarter"),
      label: "Make it a standing rule",
      note: "A dated photo of the meter each quarter is the evidence you'll want next time.",
    },
  ];
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
        <Link href="/writing/whose-delay-was-it" className={link}>
          Whose delay was it?
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
function CatchupExample({ today }: { today: string }) {
  const ex = catchupExample(today);
  const read = readCatchup(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        The smart meter in our flat stopped sending readings twenty months ago.
        The direct debit stayed at £95 a month on estimates, and nobody asked
        us for a reading. Last week an engineer read the meters, and the bill
        came: £1,840 more for gas and electricity. I was about to put it on a
        credit card.
      </p>
      <Split inp={ex} read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {catchupHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          I hadn&rsquo;t known the date mattered more than the total. Eight of
          the twenty months were more than a year before the bill, so they
          couldn&rsquo;t be charged at all. I sent the complaint with a photo
          of the meters. The supplier reissued the bill without the old
          months, and spread the rest over twenty months.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}bill.
      </p>
    </div>
  );
}
