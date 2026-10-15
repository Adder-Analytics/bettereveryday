"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { formatMoney, moneyInvalid } from "../data/worth";
import {
  BLANK_KEEP,
  KEEP_EXAMPLE,
  MAX_ROWS,
  billed,
  blankRow,
  keepCurrency,
  keepHeadline,
  keepRule,
  keepSummary,
  nextRowId,
  parseKeepInputs,
  perUseText,
  readRow,
  rowHeadline,
  rowName,
  rowWhy,
  signUpQuestion,
  totals,
  usesInvalid,
  type KeepInputs,
  type KeepRow,
  type Period,
  type Rejoin,
  type SignUp,
} from "../data/keep";

/**
 * Still worth paying for? (/keep)
 *
 * The instrument for the subscriptions that renew themselves. People expect
 * to use them more than they do (DellaVigna and Malmendier), flat rates feel
 * safer than they are (Lambrecht and Skiera), and a renewal has the status
 * quo's advantage (Samuelson and Zeckhauser). The tool goes through them one
 * by one: what each costs a use, whether paying per use would be cheaper, and
 * the fresh-start test — would you sign up today at this price? A "not sure"
 * on something easy to rejoin reads as "cancel and see if you miss it".
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/keep.ts` so it can be checked without a browser.
 */

const STORE_KEY = "keep:v1";

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

function loadInputs(): KeepInputs {
  if (typeof window === "undefined") return BLANK_KEEP;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseKeepInputs(JSON.parse(raw)) : BLANK_KEEP;
  } catch {
    return BLANK_KEEP;
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
  cols?: 2 | 3;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid ${cols === 3 ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2"} gap-2`}
    >
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

/** A short text field with an optional "can't read that" line and help. */
function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  bad,
  badText,
  help,
  optional,
  numeric,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  bad?: boolean;
  badText?: string;
  help?: string;
  optional?: boolean;
  numeric?: boolean;
}) {
  const described = [bad ? `${id}-bad` : "", help ? `${id}-help` : ""].filter(Boolean).join(" ");
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--muted)] mb-1.5">
        {label}
        {optional ? <span className="opacity-70"> (optional)</span> : null}
      </label>
      <input
        id={id}
        type="text"
        inputMode={numeric ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={bad || undefined}
        aria-describedby={described || undefined}
        className={inputClass}
      />
      {bad ? (
        <p id={`${id}-bad`} className="mt-1.5 text-xs text-[var(--muted)]">
          {badText}
        </p>
      ) : null}
      {help ? (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          {help}
        </p>
      ) : null}
    </div>
  );
}

export default function KeepClient() {
  const [inp, setInp] = useState<KeepInputs>(BLANK_KEEP);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);
  const focusRow = useRef<string | null>(null);

  useEffect(() => {
    const loaded = loadInputs();
    const carried = readCarriedSubject();
    const first = loaded.rows[0];
    const seeded = Boolean(carried) && loaded.rows.length === 1 && !first.name.trim();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage and the URL; intentionally synchronous on mount. */
    setInp(seeded ? { rows: [{ ...first, name: carried }] } : loaded);
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

  // After "Add another", move focus into the new row's name field.
  useEffect(() => {
    const id = focusRow.current;
    if (!id) return;
    focusRow.current = null;
    document.getElementById(`keep-${id}-name`)?.focus();
  }, [inp.rows.length]);

  const setRow = <K extends keyof KeepRow>(id: string, k: K, v: KeepRow[K]) =>
    setInp((prev) => ({ rows: prev.rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)) }));
  const addRow = () =>
    setInp((prev) => {
      if (prev.rows.length >= MAX_ROWS) return prev;
      const id = nextRowId(prev.rows);
      focusRow.current = id;
      return { rows: [...prev.rows, blankRow(id)] };
    });
  const removeRow = (id: string) =>
    setInp((prev) => {
      const rows = prev.rows.filter((r) => r.id !== id);
      return rows.length ? { rows } : BLANK_KEEP;
    });

  const cur = keepCurrency(inp);
  const headline = useMemo(() => keepHeadline(inp), [inp]);

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
        {showExample ? <KeepExample /> : null}
      </div>

      {/* ---- Step 1: find them ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>First, find them all</p>
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          The ones you remember aren&rsquo;t the problem. Five minutes with these
          finds the rest:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)] leading-relaxed list-disc pl-5">
          <li>Your last two months of bank and card statements, for anything that repeats.</li>
          <li>
            The subscriptions page in your phone&rsquo;s app store. Charges made
            through it often show on the statement under the store&rsquo;s name,
            not the app&rsquo;s.
          </li>
          <li>
            Your email, for &ldquo;renewal&rdquo;, &ldquo;receipt&rdquo; and
            &ldquo;your trial&rdquo;. Yearly ones won&rsquo;t be on two months of
            statements.
          </li>
        </ul>
      </div>

      {/* ---- Step 2: one card per subscription ---- */}
      {inp.rows.map((row, i) => (
        <RowCard
          key={row.id}
          row={row}
          index={i}
          count={inp.rows.length}
          cur={cur}
          setRow={setRow}
          onRemove={() => removeRow(row.id)}
          carried={
            i === 0 && carriedSeed !== "" && row.name.trim() === carriedSeed ? (
              <CarriedNote
                show
                onClear={() => {
                  setRow(row.id, "name", "");
                  setCarriedSeed("");
                }}
              />
            ) : null
          }
        />
      ))}
      <div className="mt-4">
        {inp.rows.length < MAX_ROWS ? (
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            + Add another subscription
          </button>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            That&rsquo;s {MAX_ROWS}. Run these first, then start again with the rest.
          </p>
        )}
      </div>

      {/* ---- The read ---- */}
      <AnnounceAnswer message={headline} />
      {headline ? (
        <ReadBlock inp={inp} headline={headline} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give a subscription a price and the read appears: what it costs a
            year and a use, and, once you&rsquo;ve answered the sign-up
            question, whether to keep it.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_KEEP);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function RowCard({
  row,
  index,
  count,
  cur,
  setRow,
  onRemove,
  carried,
}: {
  row: KeepRow;
  index: number;
  count: number;
  cur: string;
  setRow: <K extends keyof KeepRow>(id: string, k: K, v: KeepRow[K]) => void;
  onRemove: () => void;
  carried: React.ReactNode;
}) {
  const id = `keep-${row.id}`;
  const read = readRow(row);
  const set = <K extends keyof KeepRow>(k: K, v: KeepRow[K]) => setRow(row.id, k, v);
  const label = row.name.trim() || `Subscription ${index + 1}`;
  return (
    <section aria-label={label} className={card}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`${id}-name`} className={eyebrow}>
          {count > 1 ? `Subscription ${index + 1}` : "The subscription"}
        </label>
        {count > 1 ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Remove
          </button>
        ) : null}
      </div>
      <input
        id={`${id}-name`}
        type="text"
        value={row.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="e.g. Gym membership"
        className={`mt-2 ${inputClass}`}
      />
      {carried}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          id={`${id}-price`}
          label="What it costs"
          value={row.price}
          onChange={(v) => set("price", v)}
          placeholder="e.g. £45"
          numeric
          bad={moneyInvalid(row.price)}
          badText="Type an amount, like 45, £10.99 or 1,200."
        />
        <div>
          <p className="block text-sm text-[var(--muted)] mb-1.5">
            Billed
          </p>
          <Chips<Period>
            label="Billed"
            value={row.period}
            onPick={(v) => set("period", v)}
            cols={3}
            options={[
              { id: "month", label: "Monthly" },
              { id: "year", label: "Yearly" },
              { id: "week", label: "Weekly" },
            ]}
          />
        </div>
        <Field
          id={`${id}-uses`}
          label="Times you used it in the last month"
          value={row.uses}
          onChange={(v) => set("uses", v)}
          placeholder="e.g. 3"
          numeric
          optional
          bad={usesInvalid(row.uses)}
          badText="Type a number, like 3 or 0."
          help="Count, don't guess: the app's history or your diary will say. The month you meant to have doesn't count."
        />
        <Field
          id={`${id}-payg`}
          label="What one use would cost without it"
          value={row.payg}
          onChange={(v) => set("payg", v)}
          placeholder="e.g. £8"
          numeric
          optional
          bad={moneyInvalid(row.payg)}
          badText="Type an amount, like 8 or £3.50."
          help="A single gym visit, renting the one film, buying the one issue. Leave it blank if there's no such thing."
        />
      </div>

      {read ? (
        <div className="mt-5">
          <p className="text-sm text-[var(--foreground)] mb-2">{signUpQuestion(row, cur)}</p>
          <Chips<SignUp>
            label={signUpQuestion(row, cur)}
            value={row.signup}
            onPick={(v) => set("signup", v)}
            cols={3}
            options={[
              { id: "yes", label: "Yes" },
              { id: "unsure", label: "Not sure" },
              { id: "no", label: "No" },
            ]}
          />
          {row.signup === "unsure" ? (
            <div className="mt-4">
              <p className="text-sm text-[var(--foreground)] mb-2">If you cancelled, could you rejoin as easily?</p>
              <Chips<Rejoin>
                label="If you cancelled, could you rejoin as easily?"
                value={row.rejoin}
                onPick={(v) => set("rejoin", v)}
                options={[
                  { id: "easy", label: "Yes, same price, nothing lost" },
                  { id: "lose", label: "No: I'd lose a price, my history or a place" },
                ]}
              />
            </div>
          ) : null}
          <RowVerdict row={row} cur={cur} />
        </div>
      ) : null}
    </section>
  );
}

/** The answer for one subscription, under its own questions. */
function RowVerdict({ row, cur }: { row: KeepRow; cur: string }) {
  const read = readRow(row);
  if (!read) return null;
  const per = perUseText(read, cur);
  return (
    <div className="mt-4 pl-3 border-l-2 border-[var(--accent)]">
      <p className="text-xs text-[var(--muted)]">
        {formatMoney(read.yearly, cur)} a year{per ? ` · ${per}` : ""}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{rowHeadline(row, read, cur)}</p>
      <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{rowWhy(row, read, cur)}</p>
    </div>
  );
}

function ReadBlock({ inp, headline }: { inp: KeepInputs; headline: string }) {
  const [copied, setCopied] = useState<"" | "line" | "all" | "no">("");
  const cur = keepCurrency(inp);
  const t = totals(inp);
  const rule = keepRule();
  const priced = inp.rows
    .map((r) => ({ row: r, read: readRow(r) }))
    .filter((x): x is { row: KeepRow; read: NonNullable<ReturnType<typeof readRow>> } => x.read !== null)
    .sort((a, b) => b.read.yearly - a.read.yearly);
  const tests = priced.filter((x) => x.read.kind === "test" || x.read.kind === "hold");
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{headline}</p>
      <SpendBar inp={inp} />
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        {t.priced === 1 ? "It costs" : `Together they cost`} {formatMoney(t.yearly, cur)}{" "}
        a year, {formatMoney(t.yearly / 12, cur)}{" "}a month.
        {t.freed > 0
          ? ` On your answers, ${formatMoney(t.freed, cur)} of that is money you'd rather have back.`
          : ""}
        {t.open > 0 ? ` ${t.open === 1 ? "One is" : `${t.open} are`} still waiting for the sign-up question.` : ""}
      </p>
      <ul className="mt-4 space-y-2 text-sm leading-relaxed">
        {priced.map(({ row, read }) => (
          <li key={row.id} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <span className="text-[var(--foreground)] font-medium sm:w-2/5 break-words">
              {rowName(row)}{" "}
              <span className="font-normal text-[var(--muted)]">({billed(row, cur)})</span>
            </span>
            <span className="text-[var(--muted)] sm:w-3/5">{rowHeadline(row, read, cur)}</span>
          </li>
        ))}
      </ul>
      {tests.length > 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For the ones you&rsquo;re not sure about, put a date in your diary a
          month from today. Rejoin anything you&rsquo;ve missed by then; let the
          rest go for good.
        </p>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Signing up is one decision; every renewal after it is a decision made
          by default. Once a year turns the default back into a choice.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={async () => setCopied((await copyText(rule)) ? "line" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "line" ? "Copied your line" : "Copy your line"}
          </button>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(keepSummary(inp))) ? "all" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "all" ? "Copied the list" : "Copy the list as text"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Couldn&rsquo;t copy. Select the line above instead.
          </p>
        ) : null}
      </div>
      <Handoffs tests={tests.length > 0} />
    </div>
  );
}

/**
 * The year's spend split into what stays and what goes. A picture of the
 * sentence below it, so it's hidden from screen readers.
 */
function SpendBar({ inp }: { inp: KeepInputs }) {
  const t = totals(inp);
  if (t.yearly <= 0) return null;
  const cur = keepCurrency(inp);
  const freedPct = Math.min(100, (t.freed / t.yearly) * 100);
  return (
    <div className="mt-5" aria-hidden="true">
      <div className="relative h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]"
          style={{ width: `${freedPct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-xs text-[var(--muted)]">
        <span>{t.freed > 0 ? `${formatMoney(t.freed, cur)} to free` : "nothing to free yet"}</span>
        <span>{formatMoney(t.yearly, cur)} a year in all</span>
      </div>
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ tests }: { tests: boolean }) {
  const list: Handoff[] = [];
  if (tests) {
    list.push({
      href: "/tripwire",
      label: "Set the date to look again",
      note: "For the ones you're keeping for now: decide in advance what would make you cancel, so the next renewal has a question waiting.",
    });
  }
  list.push({
    href: "/worth",
    label: "The service that saves you time",
    note: "If a subscription is buying back hours, a cleaner, a meal box, delivery, price it against what your time is worth to you.",
  });
  list.push({
    href: "/rule",
    label: "Make it a standing rule",
    note: "The next free trial is already on its way. Decide now what happens when it ends.",
  });
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
    </div>
  );
}

/**
 * The worked example, read-only. Runs the same read the live tool does on a
 * fixed list, so a newcomer sees a finished pass without anything landing in
 * their own fields or storage.
 */
function KeepExample() {
  const ex = KEEP_EXAMPLE;
  const cur = keepCurrency(ex);
  const headline = keepHeadline(ex);
  const t = totals(ex);
  const gym = ex.rows[0];
  const gymRead = readRow(gym);
  if (!headline || !gymRead) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Two months of statements turned up four: the gym, a second streaming
        service, a news site that renews each spring, and photo storage. I&rsquo;d
        have guessed about £30 a month. They came to{" "}
        {formatMoney(t.yearly / 12, cur)}, {formatMoney(t.yearly, cur)}{" "}a year.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I&rsquo;d been to the gym three times last month, which made it{" "}
        {perUseText(gymRead, cur)}. A drop-in visit is £8. I wasn&rsquo;t sure
        about the streaming service, and it&rsquo;s a minute to rejoin. I
        wouldn&rsquo;t buy the news site today. The photos I&rsquo;d sign up for
        again tomorrow.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{headline}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--foreground)] leading-relaxed">
          {ex.rows.map((r) => {
            const rd = readRow(r);
            return rd ? (
              <li key={r.id}>
                <span className="font-medium">{rowName(r)}:</span> {rowHeadline(r, rd, cur)}
              </li>
            ) : null;
          })}
        </ul>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          A month later I hadn&rsquo;t missed the streaming service once. I
          went to the gym about as often on drop-ins as I had on the
          membership, and paid for the visits I made, not the ones I meant to.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own list below is untouched. Run it on <em>your</em>{" "}statements.
      </p>
    </div>
  );
}
