"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import {
  BILLS_EXAMPLE,
  BLANK_BILLS,
  MAX_COSTS,
  RULES,
  RULE_NAME,
  RULE_PRINCIPLE,
  amountInvalid,
  billsCurrency,
  billsHeadline,
  billsRule,
  billsSummary,
  billsWhy,
  blankCost,
  nextId,
  nowLine,
  outcomeLine,
  parseBillsInputs,
  readBills,
  stressLine,
  who,
  type BillsInputs,
  type BillsRead,
  type Cost,
  type Rule,
} from "../data/bills";
import { formatMoney } from "../data/worth";

/**
 * Who pays for what? (/bills)
 *
 * The instrument for two people sharing a home on unequal pay. Half each,
 * in proportion to pay, and pooling it all are each fair by a different
 * principle (equality of what goes in, ability to pay, equality of what's
 * left), so the tool lays the three side by side in money, says how much the
 * choice is worth, tests each against a drop in pay, and lets the couple pick.
 * It ends in a line to keep for the rule they chose.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The sums live
 * in `app/data/bills.ts` so they can be checked without a browser.
 */

const STORE_KEY = "bills:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const eyebrow =
  "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card =
  "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const linkClass = "text-[var(--accent)] hover:opacity-70 transition-opacity";

/** The shared costs people forget to list. */
const USUAL = [
  "Rent or mortgage",
  "Energy",
  "Council tax",
  "Water",
  "Internet and phones",
  "Groceries",
  "Insurance",
  "Childcare",
  "Car and transport",
  "Holidays, saved monthly",
];

function loadInputs(): BillsInputs {
  if (typeof window === "undefined") return BLANK_BILLS;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseBillsInputs(JSON.parse(raw)) : BLANK_BILLS;
  } catch {
    return BLANK_BILLS;
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

export default function BillsClient() {
  const [inp, setInp] = useState<BillsInputs>(BLANK_BILLS);
  const [hydrated, setHydrated] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const focusId = useRef<string | null>(null);

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

  // After adding a cost, move focus into the field that needs typing next.
  useEffect(() => {
    const id = focusId.current;
    if (!id) return;
    focusId.current = null;
    document.getElementById(id)?.focus();
  }, [inp]);

  const setName = (i: 0 | 1, v: string) =>
    setInp((prev) => {
      const names: [string, string] = [...prev.names];
      names[i] = v;
      return { ...prev, names };
    });
  const setPay = (i: 0 | 1, v: string) =>
    setInp((prev) => {
      const pay: [string, string] = [...prev.pay];
      pay[i] = v;
      return { ...prev, pay };
    });
  const setCost = (id: string, k: "name" | "amount", v: string) =>
    setInp((prev) => ({ ...prev, costs: prev.costs.map((c) => (c.id === id ? { ...c, [k]: v } : c)) }));
  const addCost = (name = "") =>
    setInp((prev) => {
      if (prev.costs.length >= MAX_COSTS) return prev;
      // Fill an untouched blank row before adding a new one.
      const blank = prev.costs.find((c) => !c.name.trim() && !c.amount.trim());
      if (blank && name) {
        focusId.current = `bills-${blank.id}-amount`;
        return { ...prev, costs: prev.costs.map((c) => (c.id === blank.id ? { ...c, name } : c)) };
      }
      const id = nextId("c", prev.costs);
      focusId.current = name ? `bills-${id}-amount` : `bills-${id}-name`;
      return { ...prev, costs: [...prev.costs, blankCost(id, name)] };
    });
  const removeCost = (id: string) =>
    setInp((prev) => {
      const costs = prev.costs.filter((c) => c.id !== id);
      return { ...prev, costs: costs.length ? costs : [blankCost("c1")] };
    });
  const choose = (rule: Rule) => setInp((prev) => ({ ...prev, rule: prev.rule === rule ? "" : rule }));

  const read = useMemo(() => readBills(inp), [inp]);
  const headline = useMemo(() => billsHeadline(inp, read), [inp, read]);
  const listed = new Set(inp.costs.map((c) => c.name.trim().toLowerCase()));
  const cur = billsCurrency(inp);

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
        {showExample ? <BillsExample /> : null}
      </div>

      {/* ---- Step 1: the two of you ---- */}
      <section aria-label="The two of you" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>The two of you</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([0, 1] as const).map((i) => {
            const bad = amountInvalid(inp.pay[i]);
            return (
              <div key={i}>
                <label htmlFor={`bills-name-${i}`} className="block text-sm text-[var(--muted)] mb-1.5">
                  Name
                </label>
                <input
                  id={`bills-name-${i}`}
                  type="text"
                  value={inp.names[i]}
                  onChange={(e) => setName(i, e.target.value)}
                  placeholder={`Person ${i + 1}`}
                  className={inputClass}
                />
                <label htmlFor={`bills-pay-${i}`} className="mt-3 block text-sm text-[var(--muted)] mb-1.5">
                  {inp.names[i].trim() ? `${inp.names[i].trim()}'s take-home pay a month` : "Take-home pay a month"}
                </label>
                <input
                  id={`bills-pay-${i}`}
                  type="text"
                  inputMode="decimal"
                  value={inp.pay[i]}
                  onChange={(e) => setPay(i, e.target.value)}
                  placeholder="e.g. £2,400"
                  aria-invalid={bad || undefined}
                  aria-describedby={bad ? `bills-pay-${i}-bad` : undefined}
                  className={inputClass}
                />
                {bad ? (
                  <p id={`bills-pay-${i}-bad`} className="mt-1.5 text-xs text-[var(--muted)]">
                    Type an amount, like 2400 or £2,400.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          After tax, as it lands in your account. If it varies, use a typical
          month. Each of you types your own, if you like; nothing is sent
          anywhere.
        </p>
      </section>

      {/* ---- Step 2: what you share ---- */}
      <section aria-label="What you share" className={card}>
        <p className={eyebrow}>What you share, a month</p>
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          Only the costs you both use. Your own phone, your own car loan and
          your own nights out stay off the list, whichever rule you choose.
        </p>
        <div className="mt-4">
          <p className="text-xs text-[var(--muted)] mb-2">Tap to add:</p>
          <div className="flex flex-wrap gap-2">
            {USUAL.map((name) => {
              const has = listed.has(name.toLowerCase());
              return (
                <button
                  key={name}
                  type="button"
                  disabled={has || inp.costs.length >= MAX_COSTS}
                  onClick={() => addCost(name)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    has
                      ? "border-[var(--border)] text-[var(--muted)] opacity-50 cursor-default"
                      : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]"
                  }`}
                >
                  {has ? `✓ ${name}` : `+ ${name}`}
                </button>
              );
            })}
          </div>
        </div>
        <ul className="mt-5 space-y-3">
          {inp.costs.map((c, i) => (
            <CostRow key={c.id} cost={c} index={i} canRemove={inp.costs.length > 1} setCost={setCost} onRemove={() => removeCost(c.id)} />
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
          {inp.costs.length < MAX_COSTS ? (
            <button
              type="button"
              onClick={() => addCost()}
              className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              + Add another cost
            </button>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              That&rsquo;s {MAX_COSTS}. Fold the small ones together to make room.
            </p>
          )}
          {read ? (
            <p className="text-sm text-[var(--muted)]">
              Together: <span className="font-medium text-[var(--foreground)]">{formatMoney(read.total, cur)}</span> a month
            </p>
          ) : null}
        </div>
      </section>

      {/* ---- Step 3: what you do now (optional) ---- */}
      <section aria-label="What you do now" className={card}>
        <p className={eyebrow}>
          What you do now <span className="normal-case tracking-normal font-normal">(optional)</span>
        </p>
        <label htmlFor="bills-now" className="mt-2 block text-sm text-[var(--foreground)] leading-relaxed mb-1.5">
          How much of these does {who(inp, 0)} pay now, a month?
        </label>
        <input
          id="bills-now"
          type="text"
          inputMode="decimal"
          value={inp.now}
          onChange={(e) => setInp((prev) => ({ ...prev, now: e.target.value }))}
          placeholder="e.g. £1,100"
          aria-invalid={amountInvalid(inp.now) || read?.nowTooBig || undefined}
          aria-describedby="bills-now-hint"
          className={`${inputClass} sm:max-w-xs`}
        />
        <p id="bills-now-hint" className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          {read?.nowTooBig
            ? `That's more than the ${formatMoney(read.total, cur)} you listed. Check the list, or the amount.`
            : `${who(inp, 1)} pays the rest. If one of you pays the rent and the other the food, add up what each covers.`}
        </p>
      </section>

      {/* ---- The read ---- */}
      <AnnounceAnswer message={headline} />
      {read && headline ? (
        <ReadBlock inp={inp} read={read} headline={headline} choose={choose} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give both of your take-home pay and at least one shared cost, and
            the three ways of splitting appear.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_BILLS)} />
    </div>
  );
}

function CostRow({
  cost,
  index,
  canRemove,
  setCost,
  onRemove,
}: {
  cost: Cost;
  index: number;
  canRemove: boolean;
  setCost: (id: string, k: "name" | "amount", v: string) => void;
  onRemove: () => void;
}) {
  const id = `bills-${cost.id}`;
  const label = cost.name.trim() || `Cost ${index + 1}`;
  const bad = amountInvalid(cost.amount);
  return (
    <li className="grid grid-cols-[1fr_7rem] sm:grid-cols-[1fr_9rem_auto] gap-2 items-start">
      <div>
        <label htmlFor={`${id}-name`} className="sr-only">
          Cost {index + 1}
        </label>
        <input
          id={`${id}-name`}
          type="text"
          value={cost.name}
          onChange={(e) => setCost(cost.id, "name", e.target.value)}
          placeholder="e.g. Rent"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-amount`} className="sr-only">
          {label}, a month
        </label>
        <input
          id={`${id}-amount`}
          type="text"
          inputMode="decimal"
          value={cost.amount}
          onChange={(e) => setCost(cost.id, "amount", e.target.value)}
          placeholder="a month"
          aria-invalid={bad || undefined}
          aria-describedby={bad ? `${id}-amount-bad` : undefined}
          className={inputClass}
        />
        {bad ? (
          <p id={`${id}-amount-bad`} className="mt-1 text-xs text-[var(--muted)]">
            Type an amount.
          </p>
        ) : null}
      </div>
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="col-span-2 sm:col-span-1 justify-self-end sm:self-center text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Remove
        </button>
      ) : null}
    </li>
  );
}

function ReadBlock({
  inp,
  read,
  headline,
  choose,
}: {
  inp: BillsInputs;
  read: BillsRead;
  headline: string;
  choose: (rule: Rule) => void;
}) {
  const [copied, setCopied] = useState<"" | "line" | "all" | "no">("");
  const stress = stressLine(inp, read);
  const now = nowLine(inp, read);
  const rule = inp.rule ? billsRule(inp, read, inp.rule) : null;
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>Three fair ways to split it</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{headline}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{billsWhy(inp, read)}</p>

      {read.short ? null : (
        <>
          <ul className="mt-5 space-y-4">
            {RULES.map((r) => {
              const on = inp.rule === r;
              const o = read.outcomes[r];
              return (
                <li
                  key={r}
                  className={`rounded-lg border p-4 ${on ? "border-[var(--accent)]" : "border-[var(--border)]"}`}
                >
                  <p className="font-medium text-[var(--foreground)]">{RULE_NAME[r]}</p>
                  <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{RULE_PRINCIPLE[r]}</p>
                  <SplitBar pays={o.pays} total={read.total} />
                  <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">{outcomeLine(inp, read, r)}</p>
                  {o.cantCover ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Half is more than {who(inp, read.lower)}{" "}takes home, so this one
                      can&rsquo;t work as it stands.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => choose(r)}
                    className={`mt-3 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      on
                        ? "border-[var(--accent)] text-[var(--accent)] font-medium"
                        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {on ? "✓ The one we chose" : "Choose this one"}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-2 text-sm text-[var(--muted)] leading-relaxed">
            {stress ? <p>{stress}</p> : null}
            {now ? <p className="text-[var(--foreground)]">{now}</p> : null}
            {read.unread > 0 ? (
              <p>
                {read.unread === 1 ? "One cost has" : `${read.unread} costs have`} no amount
                that can be read yet, so {read.unread === 1 ? "it isn't" : "they aren't"} counted.
              </p>
            ) : null}
          </div>

          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <p className={eyebrow}>What usually decides it</p>
            <ul className="mt-3 space-y-2.5 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
              <li>
                <span className="font-medium">Why one of you earns less.</span>{" "}If it
                comes from a choice you made together (one of you went part-time
                for the children, or moved for the other&rsquo;s job), half each
                charges that person for a joint decision.
              </li>
              <li>
                <span className="font-medium">How tied together you are.</span>{" "}A
                new couple a year in and a couple with a mortgage and children
                aren&rsquo;t the same household. Keeping a tally suits the first;
                the second usually stops counting. In one large set of studies,
                couples who pooled everything were more satisfied and less likely
                to split up, most of all when money was tight.
              </li>
              <li>
                <span className="font-medium">What it leaves each of you.</span>{" "}If
                one rule leaves one of you with almost nothing of your own, it
                won&rsquo;t feel fair however it&rsquo;s argued.
              </li>
              <li>
                <span className="font-medium">Some money of your own, whatever you choose.</span>{" "}
                A pool one person controls isn&rsquo;t an equal one: in British
                research, the couples with the most equality ran their pool
                jointly and both had money to spend without asking.
              </li>
            </ul>
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              If you can&rsquo;t agree, the two of you may simply hold different
              principles. Say which one you each hold before arguing about the
              numbers.
            </p>
          </div>

          <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
            <p className={eyebrow}>Your line, to keep</p>
            {rule ? (
              <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Choose one of the three above, together, and your line appears
                here, with the amounts in it.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {rule ? (
                <button
                  type="button"
                  onClick={async () => setCopied((await copyText(rule)) ? "line" : "no")}
                  className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
                >
                  {copied === "line" ? "Copied your line" : "Copy your line"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={async () => setCopied((await copyText(billsSummary(inp, read))) ? "all" : "no")}
                className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                {copied === "all" ? "Copied the three" : "Copy all three to send each other"}
              </button>
            </div>
            {copied === "no" ? (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Couldn&rsquo;t copy. Select the text above instead.
              </p>
            ) : null}
          </div>
        </>
      )}

      <div className="mt-5 pt-5 border-t border-[var(--border)]">
        <p className={eyebrow}>Where to take it next</p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link href="/chores" className={`${linkClass} font-medium`}>
              Count the housework too →
            </Link>{" "}
            If one of you earns less partly because they do more at home, the
            bills are only half the picture. Split the chores on purpose as well.
          </li>
          <li>
            <Link href="/crux" className={`${linkClass} font-medium`}>
              Still disagree? →
            </Link>{" "}
            Find out whether it&rsquo;s a fact you see differently or a
            principle you weigh differently. They&rsquo;re settled different
            ways.
          </li>
          <li>
            <Link href="/keep" className={`${linkClass} font-medium`}>
              Shrink the list first →
            </Link>{" "}
            The subscriptions that renew themselves are often the easiest
            shared cost to cut.
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Who pays what under one rule, as a single bar. A picture of the sentence
 * beside it, so it's hidden from screen readers.
 */
function SplitBar({ pays, total }: { pays: [number, number]; total: number }) {
  const w = total > 0 ? Math.min(100, (pays[0] / total) * 100) : 50;
  return (
    <div className="mt-3 relative h-2 rounded-full bg-[var(--border)] overflow-hidden" aria-hidden="true">
      <div className="absolute inset-y-0 left-0 bg-[var(--accent)]" style={{ width: `${w}%` }} />
      <div className="absolute -top-1 -bottom-1 w-px bg-[var(--foreground)]" style={{ left: "50%" }} />
    </div>
  );
}

/**
 * The worked example, read-only: the same sums the live tool runs, on a fixed
 * couple, so nothing lands in your own fields or storage.
 */
function BillsExample() {
  const ex = BILLS_EXAMPLE;
  const read = readBills(ex);
  const headline = billsHeadline(ex, read);
  if (!read || !headline) return null;
  const cur = billsCurrency(ex);
  const o = read.outcomes;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Jordan and Robin split everything in half when they moved in, on
        similar pay. Then Robin went part-time to retrain, and now takes home{" "}
        {formatMoney(read.income[1], cur)}{" "}a month to Jordan&rsquo;s{" "}
        {formatMoney(read.income[0], cur)}. Their shared costs come to{" "}
        {formatMoney(read.total, cur)}. Nobody has said anything, but Robin
        has started turning down dinners out.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{headline}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--foreground)] leading-relaxed">
          {RULES.map((r) => (
            <li key={r}>
              <span className="font-medium">{RULE_NAME[r]}:</span> Robin pays{" "}
              {formatMoney(o[r].pays[1], cur)} and keeps {formatMoney(o[r].left[1], cur)}; Jordan keeps{" "}
              {formatMoney(o[r].left[0], cur)}.
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Half each now takes more than half of Robin&rsquo;s pay. The
          retraining was a plan they made together, so they chose in proportion
          to pay: each puts in the same share of what they earn, and they&rsquo;ll
          redo the sum when Robin goes back to full time.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own figures below are untouched. Run it on <em>your</em>{" "}bills.
      </p>
    </div>
  );
}
