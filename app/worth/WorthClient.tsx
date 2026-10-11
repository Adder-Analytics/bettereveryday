"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { formatHours, hoursInvalid, parseHours } from "../data/later";
import {
  BLANK_WORTH,
  PERIOD_LABEL,
  WORTH_EXAMPLE,
  currencyOf,
  formatMoney,
  hourName,
  lineRule,
  mixedPeriods,
  moneyInvalid,
  parseMoney,
  parseWorthInputs,
  rateSentence,
  readWorth,
  recurring,
  relativeNote,
  whatName,
  worthHeadline,
  worthSummary,
  yearSentence,
  type Direction,
  type Period,
  type Tight,
  type WorthInputs,
  type WorthRead,
} from "../data/worth";

/**
 * Is it worth the time? (/worth)
 *
 * The instrument for the everyday trade between time and money: pay for the
 * delivery or the cleaner, drive across town to save a fiver, take the cheaper
 * flat with the longer commute. The feel for these calls is unreliable: a
 * saving looks big or small as a share of the price (Tversky and Kahneman's
 * jacket and calculator), and time gets decided on rougher heuristics than
 * money (Saini and Monga). The tool does one division, the trade's price per
 * hour, and sets it against the person's own price for an hour like that one.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/worth.ts` so it can be checked without a browser.
 */

const STORE_KEY = "worth:v1";

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

function loadInputs(): WorthInputs {
  if (typeof window === "undefined") return BLANK_WORTH;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseWorthInputs(JSON.parse(raw)) : BLANK_WORTH;
  } catch {
    return BLANK_WORTH;
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
  cols = 3,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onPick: (v: T) => void;
  cols?: 2 | 3;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid grid-cols-1 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2`}
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

const PERIODS: Exclude<Period, "">[] = ["once", "day", "workday", "week", "month", "year"];

/**
 * An amount with how often it comes round. The amount says so under itself
 * when it can't read the input.
 */
function AmountField({
  id,
  label,
  kind,
  value,
  onChange,
  per,
  onPer,
  placeholder,
}: {
  id: string;
  label: string;
  kind: "money" | "hours";
  value: string;
  onChange: (v: string) => void;
  per: Period;
  onPer: (p: Period) => void;
  placeholder: string;
}) {
  const bad = kind === "money" ? moneyInvalid(value) : hoursInvalid(value);
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--muted)] mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={bad || undefined}
          aria-describedby={bad ? `${id}-bad` : undefined}
          className={`${inputClass} min-w-0 flex-1`}
        />
        <select
          aria-label={`${label}: how often`}
          value={per}
          onChange={(e) => onPer(e.target.value as Period)}
          className="shrink-0 px-2 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABEL[p]}
            </option>
          ))}
        </select>
      </div>
      {bad ? (
        <p id={`${id}-bad`} className="mt-1.5 text-xs text-[var(--muted)]">
          {kind === "money"
            ? "Type an amount, like 40, £12.50 or 1,200."
            : "Type hours as a number, like 3 or 1.5, or minutes, like 40 min."}
        </p>
      ) : null}
    </div>
  );
}

export default function WorthClient() {
  const [inp, setInp] = useState<WorthInputs>(BLANK_WORTH);
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

  const set = <K extends keyof WorthInputs>(k: K, v: WorthInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readWorth(inp), [inp]);
  const pay = inp.dir === "pay";
  const hour = hourName(inp);

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
        {showExample ? <WorthExample /> : null}
      </div>

      {/* ---- The trade ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="worth-what" className={`block ${eyebrow} mb-2`}>
          What are you weighing?
        </label>
        <input
          id="worth-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. Pay for grocery delivery instead of going myself"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Which way does it run?</p>
        <Chips<Direction>
          label="Which way does the trade run?"
          value={inp.dir}
          onPick={(v) => set("dir", v)}
          cols={2}
          options={[
            { id: "pay", label: "Pay money to save time" },
            { id: "save", label: "Spend time to save money" },
          ]}
        />
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Delivery, a cleaner, a taxi, the direct flight: you pay to save time.
          Driving across town for a better price, doing it yourself, the cheaper
          flat further out: you spend time to save money.
        </p>
      </div>

      {/* ---- Step 1: the two numbers ---- */}
      {inp.dir ? (
        <div className={card}>
          <p className={eyebrow}>The trade, in numbers</p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            Count the whole of the time: the round trip, the queue, the parking,
            not just the minutes at the till.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <AmountField
              id="worth-money"
              kind="money"
              label={pay ? "What it costs" : "What you'd save"}
              value={inp.money}
              onChange={(v) => set("money", v)}
              per={inp.moneyPer}
              onPer={(p) => set("moneyPer", p)}
              placeholder={pay ? "e.g. £6" : "e.g. £5"}
            />
            <AmountField
              id="worth-time"
              kind="hours"
              label={pay ? "The time it saves you" : "The time it takes you"}
              value={inp.time}
              onChange={(v) => set("time", v)}
              per={inp.timePer}
              onPer={(p) => set("timePer", p)}
              placeholder="e.g. 40 min"
            />
          </div>
          {mixedPeriods(inp) ? (
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              One of these is a one-off and the other recurs, so the read counts
              the one-off against a single year. If it lasts longer (a dishwasher,
              a bike), each hour comes out cheaper than shown.
            </p>
          ) : null}
          <label htmlFor="worth-price" className="mt-5 block text-sm text-[var(--muted)] mb-1.5">
            {pay ? "The price of the thing itself, if there is one" : "The full price of the thing, if there is one"}{" "}
            <span className="opacity-70">(optional)</span>
          </label>
          <input
            id="worth-price"
            type="text"
            inputMode="decimal"
            value={inp.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder={pay ? "e.g. £60 of groceries" : "e.g. £125 for the jacket"}
            aria-invalid={moneyInvalid(inp.price) || undefined}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            Only used to check whether the percentage is doing the persuading.
          </p>
        </div>
      ) : null}

      {/* ---- Step 2: your line ---- */}
      {inp.dir ? (
        <div className={card}>
          <p className={eyebrow}>Your price for an hour</p>
          <label htmlFor="worth-hour" className="mt-3 block text-sm text-[var(--muted)] mb-1.5">
            What would the hour be spent doing?
          </label>
          <input
            id="worth-hour"
            type="text"
            value={inp.hour}
            onChange={(e) => set("hour", e.target.value)}
            placeholder={pay ? "e.g. the weekly shop" : "e.g. driving across town"}
            className={inputClass}
          />
          <label htmlFor="worth-line" className="mt-4 block text-sm text-[var(--foreground)] mb-1.5">
            What would someone have to pay you to spend an hour of your free time{" "}
            {hour ? <>on {hour}</> : <>like this</>}?
          </label>
          <input
            id="worth-line"
            type="text"
            inputMode="decimal"
            value={inp.line}
            onChange={(e) => set("line", e.target.value)}
            placeholder="e.g. £15"
            aria-invalid={moneyInvalid(inp.line) || undefined}
            aria-describedby="worth-line-help"
            className={inputClass}
          />
          <div id="worth-line-help" className="mt-2 text-xs text-[var(--muted)] leading-relaxed space-y-1.5">
            <p>
              Not your hourly wage. Unless you could actually work that hour for
              pay, your free hour isn&rsquo;t for sale at that rate. Price the hour
              itself: an hour of something you dislike is worth more to escape
              than an hour of something you&rsquo;d half enjoy.
            </p>
            <p>
              If you do use pay as a guide, use take-home pay. Money you save
              isn&rsquo;t taxed.
            </p>
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            Which is tighter for you right now?
          </p>
          <Chips<Tight>
            label="Which is tighter for you right now?"
            value={inp.tight}
            onPick={(v) => set("tight", v)}
            options={[
              { id: "time", label: "Time" },
              { id: "money", label: "Money" },
              { id: "neither", label: "Neither, really" },
            ]}
          />
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? worthHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Fill in the trade and your price for an hour, and the read appears:
            what the trade works out at per hour, and whether that&rsquo;s worth it
            to you.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_WORTH);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function ReadBlock({ inp, read }: { inp: WorthInputs; read: WorthRead }) {
  const [copied, setCopied] = useState<"" | "line" | "all" | "no">("");
  const rule = lineRule(inp, read);
  const year = yearSentence(inp, read);
  const rel = relativeNote(inp, read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {worthHeadline(inp, read)}
      </p>
      <RateBar inp={inp} read={read} />
      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <p>
          {rateSentence(inp, read)}
          {year ? <> {year}</> : null}
        </p>
        <ReadBody inp={inp} read={read} />
        {rel ? (
          <p className="pl-3 border-l-2 border-[var(--accent)]">
            <span className="font-medium">Watch the percentage.</span>{" "}{rel}
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Set it once and reuse it. Pricing every hour as it comes is its own
          cost: people prompted to think of their time in money terms enjoy their
          free time less. A number you&rsquo;ve already set lets you stop doing
          the sum.
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
            onClick={async () =>
              setCopied((await copyText(worthSummary(inp, read))) ? "all" : "no")
            }
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
 * The trade's rate against your line, on one strip. The line sits in the
 * middle; the shaded band around it is "close". Purely a picture of the
 * sentence below it, so it's hidden from screen readers.
 */
function RateBar({ inp, read }: { inp: WorthInputs; read: WorthRead }) {
  // Log scale, so half and double sit the same distance from the line.
  const pos = (ratio: number) =>
    Math.min(100, Math.max(0, 50 + (Math.log2(ratio) / 2) * 50));
  const cur = currencyOf(inp);
  return (
    <div className="mt-5" aria-hidden="true">
      <div className="relative h-2 rounded-full bg-[var(--border)]">
        <div
          className="absolute inset-y-0 rounded-full bg-[var(--accent)] opacity-20"
          style={{ left: `${pos(0.8)}%`, right: `${100 - pos(1.25)}%` }}
        />
        <div className="absolute -top-1 bottom-[-4px] w-px bg-[var(--muted)]" style={{ left: "50%" }} />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]"
          style={{ left: `${pos(read.ratio)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
        <span>{formatMoney(read.line / 4, cur)}/h</span>
        <span>your line, {formatMoney(read.line, cur)}/h</span>
        <span>{formatMoney(read.line * 4, cur)}/h</span>
      </div>
    </div>
  );
}

function ReadBody({ inp, read }: { inp: WorthInputs; read: WorthRead }) {
  const hour = hourName(inp);
  const commute = /commut/i.test(`${inp.hour} ${inp.what}`);
  switch (read.kind) {
    case "trivial":
      return (
        <p>
          Over a year, the difference between the two options is worth less than
          fifteen minutes of your time, and you&rsquo;ve probably spent that
          deciding. Take whichever is easier to do right now, and don&rsquo;t
          think about it again.
        </p>
      );
    case "buy":
      return (
        <>
          <p>
            The time costs less than it&rsquo;s worth to you, so the money is the
            better thing to give up. Few people think to spend money this way:
            asked how they&rsquo;d spend a $40 windfall, only 2% of 98 working
            adults said they&rsquo;d use it to save time. Yet in a small field
            experiment (60 people), they felt less rushed and happier in the
            week they spent $40 buying time than in the week they spent it on
            a thing.
          </p>
          {recurring(inp) ? (
            <p>
              It recurs, so it&rsquo;s a habit, not a treat. Set it up once (a
              standing order, a regular slot) so you don&rsquo;t argue yourself
              out of it each week.
            </p>
          ) : null}
        </>
      );
    case "keep":
      return (
        <p>
          That&rsquo;s more than an hour {hour ? <>of {hour}</> : <>like this</>}{" "}is
          worth to you, so keep the money and spend the time. If the time is what
          you&rsquo;re short of, look for a cheaper way to buy it back: a slower
          delivery slot, a friend to swap with, doing it less often.
        </p>
      );
    case "worth":
      return (
        <p>
          The saving pays better than your own price for the time. And money
          saved isn&rsquo;t taxed, so it&rsquo;s worth more than the same amount
          earned. Do it.
        </p>
      );
    case "notworth":
      return (
        <>
          <p>
            You&rsquo;d be selling an hour {hour ? <>of {hour}</> : <>like this</>}{" "}for
            less than you&rsquo;d take for it. If it still feels worth it, check
            whether the percentage off is doing the persuading, or whether the
            hour is pleasanter than you priced it. If it is, raise your line and
            run it again.
          </p>
          {commute ? (
            <p className="text-[var(--muted)]">
              Commuting deserves a high price. It came bottom of 28 daily
              activities for enjoyment in Kahneman and colleagues&rsquo; study of
              how people spend their days, and a 19-year German panel found people
              with longer commutes were less satisfied with their lives, with no
              sign the cheaper housing or better pay made up for it.
            </p>
          ) : null}
        </>
      );
    case "close":
      return (
        <p>
          {read.lean === "time"
            ? `The trade is within a quarter of your line, so the arithmetic can't separate them. Time is the tighter one for you right now, so ${inp.dir === "pay" ? "pay for it" : "keep the hour"}.`
            : read.lean === "money"
              ? `The trade is within a quarter of your line, so the arithmetic can't separate them. Money is the tighter one for you right now, so ${inp.dir === "pay" ? "keep it and spend the time" : "take the saving"}.`
              : read.lean === "either"
                ? "The trade is within a quarter of your line, and neither time nor money is tight. Either choice is fine. Pick one and stop weighing it."
                : "The trade is within a quarter of your line, so the arithmetic can't separate them. Say which is tighter right now, time or money, and let that decide."}
        </p>
      );
  }
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: WorthInputs; read: WorthRead }) {
  const s = inp.what;
  const list: Handoff[] = [];
  const settled = read.kind !== "trivial" && !(read.kind === "close" && read.lean === "");
  if (settled && recurring(inp)) {
    list.push({
      href: withSubject("/rule", s),
      label: "Make it a standing rule",
      note: "It comes round again and again. Decide it once, so the next one doesn't need a sitting.",
    });
  }
  if ((read.kind === "notworth" || read.kind === "keep") && read.yearMoney >= read.line * 40) {
    list.push({
      href: withSubject("/compare", s),
      label: "Part of a bigger choice?",
      note: "If this is one side of a move or a new job, the hour is one factor among several. Weigh them together.",
    });
  }
  if (read.kind === "buy" && !recurring(inp)) {
    list.push({
      href: withSubject("/act", s),
      label: "Book it now",
      note: "A time-saving purchase you meant to make is easy to talk yourself out of on the day.",
    });
  }
  if (read.kind === "trivial") {
    list.push({
      href: "/doors",
      label: "Agonising over small calls?",
      note: "Sort how much thought a decision deserves before giving it any.",
    });
  }
  if (list.length === 0) return null;
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
function WorthExample() {
  const ex = WORTH_EXAMPLE;
  const read = readWorth(ex);
  if (!read) return null;
  const cur = currencyOf(ex);
  const money = parseMoney(ex.money) ?? 0;
  const hours = parseHours(ex.time) ?? 0;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        We were about to {whatName(ex)}: {formatMoney(money, cur)}{" "}a month less
        rent, which felt like an easy win. The catch was {formatHours(hours)}{" "}
        more commuting each working day.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Over a year that&rsquo;s {formatMoney(read.yearMoney, cur)}{" "}saved for{" "}
        {formatHours(Math.round(read.yearHours))}{" "}on a train. I asked what
        someone would have to pay me to spend an hour of a free evening
        commuting, and the honest answer was {formatMoney(read.line, cur)}.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {worthHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The cheaper flat was paying me {formatMoney(read.rate, cur)}{" "}an hour to
          commute. We kept looking closer in.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}trade.
      </p>
    </div>
  );
}
