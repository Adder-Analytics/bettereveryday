"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { moneyInvalid } from "../data/worth";
import { rateInvalid } from "../data/monthly";
import {
  BLANK_DEBTS,
  DEBTS_EXAMPLE,
  MAX_DEBTS,
  blankDebt,
  closeEnough,
  compareSentence,
  debtName,
  debtsCurrency,
  debtsHeadline,
  debtsRule,
  debtsSummary,
  duration,
  firstTarget,
  formatMoney,
  monthLabel,
  nextId,
  parseDebtsInputs,
  readDebts,
  readyDebts,
  roundMoney,
  sequenceLines,
  thisMonth,
  type Debt,
  type DebtsInputs,
  type DebtsRead,
  type Stalled,
} from "../data/debts";

/**
 * Which debt first? (/debts)
 *
 * The instrument for several debts and one monthly amount to put towards
 * them. After the minimums, the arithmetic says the costliest rate first; the
 * popular advice says the smallest balance first, for the win; and what people
 * actually do is spread the money around (Gathergood et al.'s balance-matching
 * heuristic), which is the one choice with nothing going for it. The tool runs
 * all three orders on your own debts, says what the quick win really costs,
 * and shows what a little more each month would do, which is usually worth
 * more than the order.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/debts.ts` so it can be checked without a browser.
 */

const STORE_KEY = "debts:v1";

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

function loadInputs(): DebtsInputs {
  if (typeof window === "undefined") return BLANK_DEBTS;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseDebtsInputs(JSON.parse(raw)) : BLANK_DEBTS;
  } catch {
    return BLANK_DEBTS;
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

/** A small labelled text field. Says so under itself when it can't read it. */
function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  bad,
  badText,
  numeric = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  bad?: boolean;
  badText?: string;
  numeric?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--muted)] mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={numeric ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={bad || undefined}
        aria-describedby={bad ? `${id}-bad` : undefined}
        className={inputClass}
      />
      {bad ? (
        <p id={`${id}-bad`} className="mt-1.5 text-xs text-[var(--muted)]">
          {badText}
        </p>
      ) : null}
    </div>
  );
}

const MONEY_BAD = "Type an amount, like 95, £1,200 or 3.8k.";
const RATE_BAD = "Type a yearly rate, like 24.9 or 24.9%.";

export default function DebtsClient() {
  const [inp, setInp] = useState<DebtsInputs>(BLANK_DEBTS);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);
  const focusId = useRef<string | null>(null);

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

  useEffect(() => {
    if (!focusId.current) return;
    document.getElementById(focusId.current)?.focus();
    focusId.current = null;
  });

  const set = <K extends keyof DebtsInputs>(k: K, v: DebtsInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));
  const setDebt = <K extends keyof Debt>(id: string, k: K, v: Debt[K]) =>
    setInp((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === id ? { ...d, [k]: v } : d)),
    }));
  const addDebt = () =>
    setInp((prev) => {
      if (prev.debts.length >= MAX_DEBTS) return prev;
      const id = nextId("d", prev.debts);
      focusId.current = `debts-${id}-name`;
      return { ...prev, debts: [...prev.debts, blankDebt(id)] };
    });
  const removeDebt = (id: string) =>
    setInp((prev) => {
      const debts = prev.debts.filter((d) => d.id !== id);
      return { ...prev, debts: debts.length ? debts : [blankDebt("d1")] };
    });

  const read = useMemo(() => readDebts(inp), [inp]);
  const ready = useMemo(() => readyDebts(inp), [inp]);
  const cur = debtsCurrency(inp);
  const headline = read ? debtsHeadline(inp, read) : null;

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
        {showExample ? <DebtsExample /> : null}
      </div>

      {/* ---- What it's for ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="debts-what" className={`block ${eyebrow} mb-2`}>
          What are you working towards?
        </label>
        <input
          id="debts-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. Clear the cards by next summer"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
      </div>

      {/* ---- Step 1: the debts ---- */}
      <section aria-label="Your debts" className={card}>
        <p className={eyebrow}>Each debt</p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Cards, store cards, overdrafts, loans, pay-later plans. The balance,
          the yearly rate and the minimum are all on the latest statement or
          in the app. Leave a mortgage out: it&rsquo;s cheap, long and secured,
          and belongs in a different sum.
        </p>
        <div className="mt-4 space-y-5">
          {inp.debts.map((d, i) => (
            <DebtRow
              key={d.id}
              debt={d}
              index={i}
              canRemove={inp.debts.length > 1}
              onSet={setDebt}
              onRemove={() => removeDebt(d.id)}
            />
          ))}
        </div>
        {inp.debts.length < MAX_DEBTS ? (
          <button
            type="button"
            onClick={addDebt}
            className="mt-4 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            + Add another debt
          </button>
        ) : (
          <p className="mt-4 text-xs text-[var(--muted)]">
            That&rsquo;s {MAX_DEBTS}. Put small ones on the same rate together
            to make room.
          </p>
        )}
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          On a 0% deal, put 0, and check when it ends: if it ends before the
          debt would be cleared, run it again with the rate it goes to. A
          minimum left blank is guessed at 3% of the balance.
        </p>
      </section>

      {/* ---- Step 2: the money ---- */}
      <section aria-label="What you can pay" className={card}>
        <p className={eyebrow}>What you can pay</p>
        <div className="mt-4">
          <Field
            id="debts-budget"
            label="Each month, towards all of them, minimums included"
            value={inp.budget}
            onChange={(v) => set("budget", v)}
            placeholder="e.g. £400"
            bad={moneyInvalid(inp.budget)}
            badText={MONEY_BAD}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            An amount you can keep paying every month after rent, bills and
            food, not a stretch you&rsquo;ll manage twice.
            {ready.length > 0 ? (
              <>
                {" "}The minimums on these come to{" "}
                {formatMoney(ready.reduce((s, d) => s + d.minimum, 0), cur)}.
              </>
            ) : null}
          </p>
        </div>
        {ready.length > 1 ? (
          <div className="mt-5">
            <p className="text-sm text-[var(--foreground)] mb-2">
              Have you tried to pay these down before and run out of steam?
            </p>
            <div role="group" aria-label="Have you tried before and stalled?" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  { id: "no", label: "No, or it went fine" },
                  { id: "yes", label: "Yes, I've stalled before" },
                ] as { id: Stalled; label: string }[]
              ).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={inp.stalled === o.id}
                  onClick={() => set("stalled", inp.stalled === o.id ? "" : o.id)}
                  className={`${chipBase} ${inp.stalled === o.id ? chipOn : chipOff}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              If you have, an early cleared debt is worth more to you: people
              who close accounts are more likely to finish.
            </p>
          </div>
        ) : null}
      </section>

      {/* ---- The read ---- */}
      <AnnounceAnswer message={headline} />
      {read && headline ? (
        <ReadBlock inp={inp} read={read} headline={headline} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give at least one debt a balance and a rate, and say what you can
            pay each month, and the read appears: which debt to pay first, when
            each one goes, and what the order really costs.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_DEBTS);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function DebtRow({
  debt,
  index,
  canRemove,
  onSet,
  onRemove,
}: {
  debt: Debt;
  index: number;
  canRemove: boolean;
  onSet: <K extends keyof Debt>(id: string, k: K, v: Debt[K]) => void;
  onRemove: () => void;
}) {
  const id = `debts-${debt.id}`;
  const label = debtName(debt, index);
  return (
    <div className={index > 0 ? "pt-5 border-t border-[var(--border)]" : ""}>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Field
            id={`${id}-name`}
            label={`Debt ${index + 1}`}
            value={debt.name}
            onChange={(v) => onSet(debt.id, "name", v)}
            placeholder={index === 0 ? "e.g. Visa" : index === 1 ? "e.g. Store card" : "e.g. Overdraft"}
            numeric={false}
          />
        </div>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="mb-2.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Field
          id={`${id}-balance`}
          label="Balance"
          value={debt.balance}
          onChange={(v) => onSet(debt.id, "balance", v)}
          placeholder="£1,200"
          bad={moneyInvalid(debt.balance)}
          badText={MONEY_BAD}
        />
        <Field
          id={`${id}-rate`}
          label="Rate (APR %)"
          value={debt.rate}
          onChange={(v) => onSet(debt.id, "rate", v)}
          placeholder="24.9"
          bad={rateInvalid(debt.rate)}
          badText={RATE_BAD}
        />
        <Field
          id={`${id}-minimum`}
          label="Minimum"
          value={debt.minimum}
          onChange={(v) => onSet(debt.id, "minimum", v)}
          placeholder="£40"
          bad={moneyInvalid(debt.minimum)}
          badText={MONEY_BAD}
        />
      </div>
    </div>
  );
}

function ReadBlock({ inp, read, headline }: { inp: DebtsInputs; read: DebtsRead; headline: string }) {
  const [copied, setCopied] = useState<"" | "line" | "all" | "no">("");
  const [now] = useState(() => new Date());
  const rule = debtsRule(read);
  const stuck = read.kind === "short" || read.kind === "never";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {headline}
      </p>
      {stuck ? (
        <StuckBody inp={inp} read={read} />
      ) : (
        <>
          <p className="mt-4 text-base text-[var(--foreground)] leading-relaxed font-medium">
            {thisMonth(inp, read)}
          </p>
          <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
            <ReadBody inp={inp} read={read} />
          </div>
          <Sequence inp={inp} read={read} now={now} />
          {read.kind !== "one" ? <OrderBars inp={inp} read={read} /> : null}
          <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
            <Notes inp={inp} read={read} />
          </div>
        </>
      )}

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          The statement prints the minimum because it&rsquo;s the smallest
          number the lender will accept. People shown it pay less. Set your
          own amount as a fixed monthly payment, so the minimum never gets a
          vote.
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
            onClick={async () => setCopied((await copyText(debtsSummary(inp, read, now))) ? "all" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "all" ? "Copied the whole plan" : "Copy the whole plan as text"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Couldn&rsquo;t copy. Select the line above instead.
          </p>
        ) : null}
      </div>
      <Handoffs inp={inp} read={read} />
    </div>
  );
}

/** When the money doesn't cover the minimums, or the interest. */
function StuckBody({ inp, read }: { inp: DebtsInputs; read: DebtsRead }) {
  const cur = debtsCurrency(inp);
  const monthlyInterest = read.debts.reduce((s, d) => s + (d.balance * d.rate) / 12, 0);
  return (
    <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
      {read.kind === "short" ? (
        <p>
          You can put {formatMoney(read.budget, cur)}{" "}a month towards them,
          and the minimums add up to {formatMoney(read.minimums, cur)}. No order
          fixes that, and missing minimums adds fees and marks your credit
          file. The order question can wait; this one can&rsquo;t.
        </p>
      ) : (
        <p>
          The interest on these is running at about{" "}
          {roundMoney(monthlyInterest, cur)}{" "}a month. At{" "}
          {formatMoney(read.budget, cur)}{" "}a month, with these rates, the
          balances barely move: on these numbers they wouldn&rsquo;t clear in
          fifty years. Paying in a different order won&rsquo;t change that.
          Paying more, or paying a lower rate, will.
        </p>
      )}
      <p>
        <span className="font-medium">Talk to free debt advice first, this week.</span>{" "}
        In the UK, StepChange, National Debtline and Citizens Advice are free
        and can ask lenders to freeze interest or accept less. In the US, a
        nonprofit counsellor through the NFCC can set up a plan with your
        lenders. Avoid anyone who charges up front to &ldquo;sort your
        debts&rdquo;: the free services do it for nothing.
      </p>
      <p>
        <span className="font-medium">Then tell each lender before you miss a payment.</span>{" "}
        Lenders have to treat you fairly if you&rsquo;re in difficulty, and a
        call made before the missed payment goes much better than one made
        after.
      </p>
    </div>
  );
}

function ReadBody({ inp, read }: { inp: DebtsInputs; read: DebtsRead }) {
  const cur = debtsCurrency(inp);
  const first = firstTarget(read);
  const rateFirst = read.debts.find((d) => d.id === read.rate.sequence[0]) ?? first;
  const months = duration(read.plan.months);
  const interest = roundMoney(read.plan.interest, cur);
  switch (read.kind) {
    case "one":
      return (
        <p>
          With one debt there&rsquo;s nothing to order. Paying{" "}
          {formatMoney(read.budget, cur)}{" "}a month clears it in {months},
          with {interest}{" "}in interest along the way.
        </p>
      );
    case "same":
      return (
        <p>
          {first.name}{" "}has both the smallest balance and the highest rate,
          so the two usual answers agree: clear it first, then move its whole
          payment to the next. Everything clears in {months}, with {interest}{" "}
          in interest.
        </p>
      );
    case "close":
      return (
        <p>
          Going strictly by rate you&rsquo;d start with {rateFirst.name}. But
          clearing {first.name}{" "}first, the smallest,{" "}
          {read.gap < 1
            ? "costs nothing extra in interest over the whole plan"
            : `costs only about ${roundMoney(read.gap, cur)} more in interest over the whole plan, on ${formatMoney(read.total, cur)} owed`}
          . That&rsquo;s a cheap price for a debt gone
          by month {read.plan.firstWin ?? 1}, and the evidence says the early
          win helps people finish. Everything clears in {months}.
        </p>
      );
    case "hybrid":
      return (
        <p>
          You&rsquo;ve stalled before, so an early win is worth something.{" "}
          {first.name}{" "}is small enough to clear by month{" "}
          {read.plan.firstWin ?? 1}. After that, go strictly by rate. The detour
          costs about{" "}
          {roundMoney(Math.max(0, read.hybrid.interest - read.rate.interest), cur)}{" "}
          against going by rate from the start; smallest-first all the way
          would cost {roundMoney(read.gap, cur)}. Everything clears in {months}.
        </p>
      );
    case "rate":
      return (
        <p>
          {first.name}{" "}charges the most, so every extra{" "}
          {cur}{" "}there saves the most interest. Clearing the smallest first
          instead would cost about {roundMoney(read.gap, cur)}{" "}more, more
          than you need to pay for a quick win. Everything clears in {months},
          with {interest}{" "}in interest.
          {read.small.firstWin !== null && read.rate.firstWin !== null && read.small.firstWin < read.rate.firstWin ? (
            <>
              {" "}The cost of going by rate is patience: your first debt goes
              in month {read.rate.firstWin}{" "}rather than month{" "}
              {read.small.firstWin}.
            </>
          ) : null}
        </p>
      );
    default:
      return null;
  }
}

/** When each debt goes, under the recommended plan. */
function Sequence({ inp, read, now }: { inp: DebtsInputs; read: DebtsRead; now: Date }) {
  const lines = sequenceLines(inp, read, now);
  if (lines.length < 2) return null;
  return (
    <div className="mt-5">
      <p className={eyebrow}>When each one goes</p>
      <ol className="mt-2 space-y-1.5 text-sm text-[var(--foreground)] leading-relaxed list-decimal pl-5">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        When one is cleared, its whole payment moves to the next. Keep paying
        the same total every month.
      </p>
    </div>
  );
}

/**
 * The interest each order costs, on one scale. A picture of the comparison
 * sentence beneath it, so it's hidden from screen readers.
 */
function OrderBars({ inp, read }: { inp: DebtsInputs; read: DebtsRead }) {
  const cur = debtsCurrency(inp);
  const rows = [
    { key: "rate", label: "Costliest first", plan: read.rate },
    ...(read.kind === "same" ? [] : [{ key: "small", label: "Smallest first", plan: read.small }]),
    ...(read.kind === "hybrid" ? [{ key: "hybrid", label: "One win, then rate", plan: read.hybrid }] : []),
    { key: "spread", label: "Spread around", plan: read.spread },
  ];
  const max = Math.max(...rows.map((r) => r.plan.interest)) || 1;
  const w = (n: number) => `${Math.max(2, Math.min(100, (n / max) * 100))}%`;
  return (
    <div className="mt-5">
      <p className={eyebrow}>Interest, by order</p>
      <div className="mt-3 space-y-2" aria-hidden="true">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="w-28 shrink-0">{r.label}</span>
            <div className="relative h-2 flex-1 rounded-full bg-[var(--border)]">
              <div
                className={`absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] ${r.plan.order === read.plan.order ? "" : "opacity-40"}`}
                style={{ width: w(r.plan.interest) }}
              />
            </div>
            <span className="w-16 shrink-0 text-right tabular-nums">{roundMoney(r.plan.interest, cur)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">{compareSentence(inp, read)}</p>
    </div>
  );
}

/** The sentences that don't depend on the order: the amount, spreading, guesses. */
function Notes({ inp, read }: { inp: DebtsInputs; read: DebtsRead }) {
  const cur = debtsCurrency(inp);
  const notes: { key: string; head: string; body: string }[] = [];
  const m = read.minOnly;
  if (m.interest - read.plan.interest > closeEnough(read.total)) {
    notes.push({
      key: "amount",
      head: "The amount matters more than the order.",
      body: `Paying only the minimums would take ${duration(m.months)} and cost ${roundMoney(m.interest, cur)} in interest${m.months === null ? " over fifty years, and still not clear it" : ""}. Your ${formatMoney(read.budget, cur)} a month saves ${roundMoney(m.interest - read.plan.interest, cur)} of that${read.kind === "one" ? "" : `, against ${roundMoney(read.gap, cur)} between the two orders`}.`,
    });
  }
  if (read.more && read.plan.months !== null) {
    const saved = read.plan.interest - read.more.plan.interest;
    const sooner = read.plan.months - (read.more.plan.months ?? read.plan.months);
    if (saved > 1) {
      notes.push({
        key: "more",
        head: `${formatMoney(read.more.step, cur)} more a month would save about ${roundMoney(saved, cur)}.`,
        body: `It would clear everything${sooner > 0 ? ` ${duration(sooner)} sooner` : ""}, in ${duration(read.more.plan.months)}. A subscription cancelled or a payment plan not taken is where that usually comes from.`,
      });
    }
  }
  if (read.kind !== "one" && read.spreadGap > 1) {
    notes.push({
      key: "spread",
      head: "Don't spread it.",
      body: `Putting the extra on every debt in proportion to its balance is what most people do, and it's the one order with nothing going for it: it costs ${roundMoney(read.spreadGap, cur)} more than going by rate${read.spread.firstWin !== null && read.plan.firstWin !== null && read.spread.firstWin > read.plan.firstWin ? `, and your first debt wouldn't go until month ${read.spread.firstWin}, not month ${read.plan.firstWin}` : ""}. Pay one at a time.`,
    });
  }
  const zero = read.debts.filter((d) => d.rate === 0);
  if (zero.length) {
    notes.push({
      key: "zero",
      head: `${zero.map((d) => d.name).join(" and ")} ${zero.length === 1 ? "is" : "are"} at 0%.`,
      body: "That's why it comes last. Check when the deal ends: if it ends before the balance would be cleared under this plan, the rate it goes to is the one that counts. Put that in and run it again.",
    });
  }
  const guessed = read.debts.filter((d) => d.guessed);
  if (guessed.length) {
    notes.push({
      key: "guessed",
      head: "Some minimums are guesses.",
      body: `${guessed.map((d) => `${d.name} (${formatMoney(d.minimum, cur)})`).join(", ")}: 3% of the balance. Put the real figures in from the statement for a firmer plan.`,
    });
  }
  if (notes.length === 0) return null;
  return (
    <>
      {notes.map((n) => (
        <p key={n.key} className="pl-3 border-l-2 border-[var(--accent)]">
          <span className="font-medium">{n.head}</span>{" "}
          {n.body}
        </p>
      ))}
    </>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: DebtsInputs; read: DebtsRead }) {
  const s = inp.what;
  const list: Handoff[] = [];
  list.push({
    href: withSubject("/keep", s),
    label: "Find the money: keep or cancel",
    note: "The quickest extra each month is usually a subscription you'd not sign up for today.",
  });
  if (read.kind === "short" || read.kind === "never") {
    list.push({
      href: withSubject("/ruin", s),
      label: "Can you survive the worst case?",
      note: "Before anything else, check what a bad month would do, and what you'd cut first.",
    });
  }
  list.push({
    href: withSubject("/monthly", s),
    label: "Before the next plan: pay now or pay monthly?",
    note: "The next 'only £X a month' at a checkout adds a minimum to this list. Add it up first.",
  });
  list.push({
    href: withSubject("/rule", s),
    label: "Make it a standing rule",
    note: "Decide once what happens to a cleared card and to any windfall, so you don't decide it again in a shop.",
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
 * fixed case, so a newcomer sees a finished pass without anything landing in
 * their own fields or storage.
 */
function DebtsExample() {
  const ex = DEBTS_EXAMPLE;
  const read = readDebts(ex);
  const [now] = useState(() => new Date());
  if (!read) return null;
  const cur = debtsCurrency(ex);
  const first = firstTarget(read);
  const small = read.debts.find((d) => d.id === read.small.sequence[0]) ?? first;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Four debts, {formatMoney(read.total, cur)}{" "}in all: an old card, a
        store card and two credit cards. I could put{" "}
        {formatMoney(read.budget, cur)}{" "}a month towards them, and I&rsquo;d
        been paying a bit extra on each, roughly in proportion to what I owed.
        A friend told me to clear the smallest first, the{" "}
        {small.name.toLowerCase()}, for the win.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Smallest-first came to {roundMoney(read.small.interest, cur)}{" "}in
        interest. Going by rate, starting with the {first.name.toLowerCase()}{" "}
        at {Math.round(first.rate * 1000) / 10}%, came to{" "}
        {roundMoney(read.rate.interest, cur)}: {roundMoney(read.gap, cur)}{" "}
        less, and the {first.name.toLowerCase()}{" "}still went in{" "}
        {duration(read.rate.firstWin)}. My way, spread around, was the worst of
        the three.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {debtsHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The bigger surprise was the minimums. Paying only those would have
          taken {duration(read.minOnly.months)}{" "}and cost{" "}
          {roundMoney(read.minOnly.interest, cur)}{" "}in interest. At{" "}
          {formatMoney(read.budget, cur)}{" "}a month it&rsquo;s all gone by{" "}
          {monthLabel(read.plan.months ?? 0, now)}. The order was worth{" "}
          {roundMoney(read.gap, cur)}; paying more than the minimum was worth
          thousands.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}debts.
      </p>
    </div>
  );
}
