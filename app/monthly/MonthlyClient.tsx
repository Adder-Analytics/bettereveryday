"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_MONTHLY,
  MONTHLY_EXAMPLE,
  aboutRate,
  countInvalid,
  formatMoney,
  formatRate,
  monthlyCurrency,
  monthlyHeadline,
  monthlyName,
  monthlyRule,
  monthlySummary,
  parseMonthlyInputs,
  rateInvalid,
  readMonthly,
  span,
  stackSentence,
  totalSentence,
  type Afford,
  type Every,
  type MonthlyInputs,
  type MonthlyRead,
  type Without,
} from "../data/monthly";

/**
 * Pay now or pay monthly? (/monthly)
 *
 * The instrument for a price with a payment plan beside it: "£649, or 12
 * payments of £59.99". The instalment hides the rate (people underestimate the
 * interest a stream of payments implies; Stango and Zinman), spreading takes
 * the sting out of paying (Prelec and Loewenstein), and pay-later access raises
 * total spending, not just how it's paid (Di Maggio, Katz and Williams). The
 * tool adds the plan up, turns the difference into a yearly rate, and asks the
 * two questions that decide it: could you pay today, and would you buy it at
 * this price without the plan?
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/monthly.ts` so it can be checked without a browser.
 */

const STORE_KEY = "monthly:v1";

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

function loadInputs(): MonthlyInputs {
  if (typeof window === "undefined") return BLANK_MONTHLY;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseMonthlyInputs(JSON.parse(raw)) : BLANK_MONTHLY;
  } catch {
    return BLANK_MONTHLY;
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

/** A text field. Says so under itself when it can't read the input. */
function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  optional,
  help,
  bad,
  badText,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  optional?: boolean;
  help?: string;
  bad: boolean;
  badText: string;
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
        inputMode="decimal"
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

const MONEY_BAD = "Type an amount, like 59.99, £649 or 1,200.";

function MoneyField(props: Omit<Parameters<typeof Field>[0], "bad" | "badText">) {
  return <Field {...props} bad={moneyInvalid(props.value)} badText={MONEY_BAD} />;
}

export default function MonthlyClient() {
  const [inp, setInp] = useState<MonthlyInputs>(BLANK_MONTHLY);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);

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

  const set = <K extends keyof MonthlyInputs>(k: K, v: MonthlyInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readMonthly(inp), [inp]);

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
        {showExample ? <MonthlyExample /> : null}
      </div>

      {/* ---- What it is ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="monthly-what" className={`block ${eyebrow} mb-2`}>
          What are you buying?
        </label>
        <input
          id="monthly-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. Sofa from the sale"
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

      {/* ---- Step 1: the price and the plan ---- */}
      <div className={card}>
        <p className={eyebrow}>The price and the plan</p>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <MoneyField
            id="monthly-price"
            label="The price if you pay in full today"
            value={inp.price}
            onChange={(v) => set("price", v)}
            placeholder="e.g. £649"
            help="The same thing, delivered the same way. If paying in full gets a discount the plan doesn't, use the discounted price."
          />
          <div className="grid grid-cols-2 gap-3">
            <MoneyField
              id="monthly-payment"
              label="Each payment"
              value={inp.payment}
              onChange={(v) => set("payment", v)}
              placeholder="e.g. £59.99"
            />
            <Field
              id="monthly-count"
              label="How many"
              value={inp.count}
              onChange={(v) => set("count", v)}
              placeholder="e.g. 12"
              bad={countInvalid(inp.count)}
              badText="Type a number of payments, like 4 or 24."
            />
          </div>
          <div>
            <p className="text-sm text-[var(--muted)] mb-1.5">How often</p>
            <Chips<Every>
              label="How often the payments come out"
              value={inp.every}
              onPick={(v) => set("every", v)}
              cols={3}
              options={[
                { id: "week", label: "Weekly" },
                { id: "fortnight", label: "Fortnightly" },
                { id: "month", label: "Monthly" },
              ]}
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-[var(--muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={inp.firstToday}
              onChange={(e) => set("firstToday", e.target.checked)}
              className="mt-1 accent-[var(--accent)]"
            />
            <span>The first payment is taken today, at the checkout (as with pay-in-three or pay-in-four).</span>
          </label>
          <MoneyField
            id="monthly-deposit"
            label="A deposit up front"
            value={inp.deposit}
            onChange={(v) => set("deposit", v)}
            placeholder="e.g. £50"
            optional
          />
          <MoneyField
            id="monthly-fee"
            label="Any fee to set it up or to finish it"
            value={inp.fee}
            onChange={(v) => set("fee", v)}
            placeholder="e.g. £29"
            optional
            help="An arrangement fee, an admin fee, an option-to-purchase fee at the end. Not a late fee: those only land if a payment is missed."
          />
        </div>
      </div>

      {/* ---- Step 2: the two questions that decide it ---- */}
      {read ? (
        <div className={card}>
          <p className={eyebrow}>Two questions that decide it</p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            {totalSentence(inp, read)}
          </p>
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">
            Could you pay {formatMoney(read.price, monthlyCurrency(inp))} today without going short?
          </p>
          <Chips<Afford>
            label="Could you pay the full price today without going short?"
            value={inp.afford}
            onPick={(v) => set("afford", v)}
            cols={1}
            options={[
              { id: "yes", label: "Yes, easily" },
              { id: "savings", label: "Only from savings I keep for emergencies" },
              { id: "no", label: "No, that's why the plan appeals" },
            ]}
          />
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            Without the plan, would you buy {monthlyName(inp) === "it" ? "it" : "this"} at this price?
          </p>
          <Chips<Without>
            label="Without the plan, would you buy it at this price?"
            value={inp.without}
            onPick={(v) => set("without", v)}
            cols={1}
            options={[
              { id: "yes", label: "Yes, I'd already decided" },
              { id: "smaller", label: "I'd buy a cheaper one" },
              { id: "no", label: "Probably not" },
            ]}
          />
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            Be honest with the second one. A price in small pieces is easier to
            say yes to, and people offered pay-later spend more in total, not
            just more slowly.
          </p>
        </div>
      ) : null}

      {/* ---- Step 3: optional context ---- */}
      {read ? (
        <div className={card}>
          <p className={eyebrow}>If you know them</p>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <Field
              id="monthly-savings"
              label="What your savings earn a year"
              value={inp.savings}
              onChange={(v) => set("savings", v)}
              placeholder="e.g. 4%"
              optional
              bad={rateInvalid(inp.savings)}
              badText="Type a percentage, like 4 or 4.5%."
              help="The rate on the account the money would come from. It shows what keeping the money there is worth while you pay."
            />
            <MoneyField
              id="monthly-others"
              label="What you already pay a month on other plans and cards"
              value={inp.others}
              onChange={(v) => set("others", v)}
              placeholder="e.g. £85"
              optional
              help="Other pay-later instalments, phone and car finance, the minimum on cards. Not rent or bills."
            />
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? monthlyHeadline(read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Fill in the price, each payment and how many there are, and the
            read appears: what the plan adds up to, and the yearly rate it
            charges.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_MONTHLY);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function ReadBlock({ inp, read }: { inp: MonthlyInputs; read: MonthlyRead }) {
  const [copied, setCopied] = useState<"" | "line" | "all" | "no">("");
  const rule = monthlyRule();
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {monthlyHeadline(read)}
      </p>
      <TotalBars inp={inp} read={read} />
      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <ReadBody inp={inp} read={read} />
        <Notes inp={inp} read={read} />
        <p className="text-[var(--muted)]">{stackSentence(inp, read)}</p>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          The offer comes at the checkout, with the monthly figure in large
          type and the total in small. One multiplication, done before you
          tap, puts them the right way round.
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
            onClick={async () => setCopied((await copyText(monthlySummary(inp, read))) ? "all" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "all" ? "Copied the whole read" : "Copy the whole read as text"}
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

/**
 * The price today against the plan's total, as two bars on one scale. Purely
 * a picture of the sentence below it, so it's hidden from screen readers.
 */
function TotalBars({ inp, read }: { inp: MonthlyInputs; read: MonthlyRead }) {
  const cur = monthlyCurrency(inp);
  const max = Math.max(read.price, read.total) || 1;
  const w = (n: number) => `${Math.max(2, Math.min(100, (n / max) * 100))}%`;
  const rows = [
    { label: "Pay today", value: read.price, strong: false },
    { label: "Spread it", value: read.total, strong: true },
  ];
  return (
    <div className="mt-5 space-y-2" aria-hidden="true">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-xs text-[var(--muted)]">
          <span className="w-16 shrink-0">{r.label}</span>
          <div className="relative h-2 flex-1 rounded-full bg-[var(--border)]">
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] ${r.strong ? "" : "opacity-40"}`}
              style={{ width: w(r.value) }}
            />
          </div>
          <span className="w-20 shrink-0 text-right tabular-nums">{formatMoney(r.value, cur)}</span>
        </div>
      ))}
    </div>
  );
}

function ReadBody({ inp, read }: { inp: MonthlyInputs; read: MonthlyRead }) {
  const cur = monthlyCurrency(inp);
  const total = totalSentence(inp, read);
  const extra = formatMoney(Math.max(0, read.extra), cur);
  const name = monthlyName(inp);
  switch (read.kind) {
    case "stretch":
      return (
        <p>
          {total}{" "}You couldn&rsquo;t pay for {name}{" "}today, so the plan
          isn&rsquo;t a way of paying; it&rsquo;s borrowing to afford it.
          That can be the right call for something you need, like the cooker
          or the car that gets you to work. Before you sign, check two things:
          that every payment fits in the months ahead with room to spare, and
          what a missed one costs. If it&rsquo;s something you want rather
          than need, the cheapest plan is usually to save for{" "}
          {span(read.months > 0 ? read.months : 1)}{" "}and buy it then.
        </p>
      );
    case "cheaper":
      return (
        <p>
          {total}{" "}That&rsquo;s unusual. Check the plan&rsquo;s price is for
          the same thing, with the same delivery and warranty, and that
          there&rsquo;s no fee at the end. If it holds, take it and set every
          payment to come out automatically.
        </p>
      );
    case "free":
      return (
        <p>
          {total}{" "}When it&rsquo;s truly interest-free, spreading is the
          better deal: the money stays with you longer for nothing. The shop
          pays for the free part, and late fees pay for some of it too, so the
          one way this goes wrong for you is a late payment. Set every payment to come
          out automatically, from an account that will have the money on the
          day, and read what a missed payment costs before you sign. On some
          &ldquo;no interest if paid in full&rdquo; deals, a balance left at the
          end is charged all the interest back to day one.
        </p>
      );
    case "earns":
      return (
        <p>
          {total}{" "}Your savings earn{" "}
          {read.savings !== null ? formatRate(read.savings) : "more"}, more
          than the plan charges, so leaving the money where it is and paying
          monthly comes out slightly ahead. It&rsquo;s a small edge, and one
          late payment wipes it out: set them all to come out automatically.
        </p>
      );
    case "costs":
      return (
        <p>
          {total}{" "}That {extra}{" "}buys nothing but time. If you could pay
          today, pay today. If you&rsquo;d rather not empty the account, a
          month or two of saving the payment first usually gets you there
          without the rate. For comparison, a typical credit card charges
          over 20% a year, and a decent savings account pays a few percent.
        </p>
      );
  }
}

/** The sentences that depend on the answers, not the sum. */
function Notes({ inp, read }: { inp: MonthlyInputs; read: MonthlyRead }) {
  const cur = monthlyCurrency(inp);
  const notes: { key: string; head: string; body: string }[] = [];
  if (read.nudged) {
    const smaller = inp.without === "smaller";
    notes.push({
      key: "nudged",
      head: "The plan is deciding what you buy, not just how you pay.",
      body: smaller
        ? `Without it you'd buy a cheaper one. The plan makes ${formatMoney(read.payment, cur)} feel like the price, but the price is ${formatMoney(read.price, cur)}${read.extra > 0.5 ? `, or ${formatMoney(read.total, cur)} spread` : ""}. Ask what the step up buys you, as money paid today, and whether you'd pay that for it.`
        : `Without it you probably wouldn't buy it at all. That's the pull researchers find: offered pay-later, people spend more in total, not just more slowly. Ask whether you'd hand over ${formatMoney(read.price, cur)} for it today, in one go. If that's a no, the plan was making the decision.`,
    });
  }
  if (inp.afford === "savings") {
    notes.push({
      key: "savings",
      head: "An emergency fund is for emergencies.",
      body: read.apr === 0
        ? "With a free plan you don't have to touch it: spread the cost and leave the cushion where it is."
        : `If paying today would leave nothing to fall back on, the plan's ${formatMoney(Math.max(0, read.extra), cur)} is the price of keeping your cushion. That can be worth paying for something you need. For something you want, refilling the savings first is cheaper.`,
    });
  }
  if (read.kept !== null && read.kept > 0.5 && (read.kind === "free" || read.kind === "earns" || read.kind === "cheaper")) {
    notes.push({
      key: "kept",
      head: `Keeping the money in savings is worth about ${formatMoney(read.kept, cur)}.`,
      body: `That's what it would earn at ${formatRate(read.savings ?? 0)} while you pay it off, in today's money. Real, but small: it's not a reason to buy, only a reason to spread what you'd buy anyway.`,
    });
  }
  if (read.kind === "costs" && read.savings !== null && read.savings > 0) {
    notes.push({
      key: "earn-less",
      head: "Your savings earn less than this costs.",
      body: `They make ${formatRate(read.savings)} a year; the plan charges ${aboutRate(read.apr)}. Paying from savings comes out ahead.`,
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

function Handoffs({ inp, read }: { inp: MonthlyInputs; read: MonthlyRead }) {
  const s = inp.what;
  const list: Handoff[] = [];
  if (read.nudged) {
    list.push({
      href: withSubject("/cool", s),
      label: "Cool the call",
      note: "If it's the checkout doing the wanting, give the decision a night and see if it's still a yes when the offer isn't in front of you.",
    });
  }
  if (read.kind === "stretch") {
    list.push({
      href: withSubject("/ruin", s),
      label: "Can you survive the worst case?",
      note: "If a month went wrong (lost hours, a big bill), could you still make every payment? Check before you sign, not after.",
    });
  }
  list.push({
    href: withSubject("/cover", s),
    label: "Next at the checkout: the warranty",
    note: "The same screen often offers cover on what you're buying. Decide whether a loss like this is one to insure or one to carry.",
  });
  list.push({
    href: withSubject("/rule", s),
    label: "Make it a standing rule",
    note: "The next offer is a click away. Decide the sum once, so 'only £X a month' gets multiplied before it gets a yes.",
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
function MonthlyExample() {
  const ex = MONTHLY_EXAMPLE;
  const read = readMonthly(ex);
  if (!read) return null;
  const cur = monthlyCurrency(ex);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I needed a new laptop for work. The shop had it at{" "}
        {formatMoney(read.price, cur)}, and under the price, in bigger type:
        &ldquo;or {formatMoney(read.payment, cur)}{" "}a month.&rdquo; Sixty a
        month felt easier than six hundred and fifty, and I had my finger on
        the button.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        {read.count}{" "}payments of {formatMoney(read.payment, cur)}{" "}came to{" "}
        {formatMoney(read.total, cur)}, which was {formatMoney(read.extra, cur)}{" "}
        more than the price. Spread over a year, that&rsquo;s borrowing at{" "}
        {aboutRate(read.apr)}: credit-card territory, for a laptop I could
        have paid for that day and had already decided to buy.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {monthlyHeadline(read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          I paid the {formatMoney(read.price, cur)}{" "}and kept the{" "}
          {formatMoney(read.extra, cur)}. Nothing about the laptop changed;
          only which number I looked at first.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}offer.
      </p>
    </div>
  );
}
