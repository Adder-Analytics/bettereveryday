"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { moneyInvalid, parseMoney } from "../data/worth";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { isoDay } from "../data/lend";
import {
  BLANK_SELL,
  BOX_DAYS,
  SELL_EXAMPLE,
  formatMoney,
  parseSellInputs,
  readSell,
  sellCurrency,
  sellHeadline,
  sellName,
  sellRule,
  sellSummary,
  sellWords,
  type Buy,
  type Condition,
  type Effort,
  type Rush,
  type SellInputs,
  type SellRead,
  type Used,
  type Why,
} from "../data/sell";

/**
 * Sell it, keep it, or let it go? (/sell)
 *
 * The instrument for the thing you own but don't use. Owning it inflates it
 * (status quo bias, Samuelson and Zeckhauser, 1988; the endowment effect,
 * Kahneman, Knetsch and Thaler, 1990), what you paid anchors the price you ask
 * (Genesove and Mayer, 2001), and the number on the listing is itself a signal
 * (Backus, Blake and Tadelis, 2019). So the read asks the buyer's question,
 * prices from what similar ones sold for, and ends in the listing, the lowest
 * offer, and the reply to a lowball, or a box with a date on it.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/sell.ts` so it can be checked without a browser.
 */

const STORE_KEY = "sell:v1";

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

function loadInputs(): SellInputs {
  if (typeof window === "undefined") return BLANK_SELL;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseSellInputs(JSON.parse(raw)) : BLANK_SELL;
  } catch {
    return BLANK_SELL;
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

/**
 * The box's date as one all-day event, so "I'll see if I miss it" has an end.
 * Built in the browser with the shared ics.ts plumbing; nothing is sent anywhere.
 */
function downloadBoxIcs(inp: SellInputs, read: SellRead): void {
  const cur = sellCurrency(inp);
  const what = sellName(inp);
  const boxed = isoDay(new Date());
  const day = read.boxUntil.replace(/-/g, "");
  const [y, m, d] = read.boxUntil.split("-").map(Number);
  const end = isoDay(new Date(y, m - 1, d + 1)).replace(/-/g, "");
  const then = read.worth > 0
    ? `If you haven't opened the box since ${boxed}, sell it: ask ${formatMoney(read.ask, cur)}, take no less than ${formatMoney(read.floor, cur)}.`
    : `If you haven't opened the box since ${boxed}, give it away.`;
  const event = [
    "BEGIN:VEVENT",
    `UID:sell-${boxed}-${read.boxUntil}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(`Open the box? (${what})`)}`,
    `DESCRIPTION:${icsEscape(`${then}\nNot missing it is the answer.\n${SITE_URL}/sell`)}`,
    "END:VEVENT",
  ];
  const blob = new Blob([wrapCalendar([event], "Sell")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `open-the-box-${read.boxUntil}.ics`;
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

const MONEY_BAD = "Type an amount, like 40, £350 or 1,200.";

/** A money field. Says so under itself when it can't read the input. */
function MoneyField({
  id,
  label,
  value,
  onChange,
  placeholder,
  optional,
  help,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  optional?: boolean;
  help?: React.ReactNode;
}) {
  const bad = moneyInvalid(value);
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
          {MONEY_BAD}
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

export default function SellClient() {
  const [inp, setInp] = useState<SellInputs>(BLANK_SELL);
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

  const set = <K extends keyof SellInputs>(k: K, v: SellInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readSell(inp), [inp]);
  const cur = sellCurrency(inp);
  const worth = parseMoney(inp.worth);
  const forWorth = worth !== null && worth > 0 ? `for ${formatMoney(worth, cur)}` : "for what it would fetch";
  const selling = read !== null && read.worth > 0 && (read.kind === "sell" || read.kind === "give" || read.kind === "box");

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
        {showExample ? <SellExample /> : null}
      </div>

      {/* ---- What it is ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="sell-what" className={`block ${eyebrow} mb-2`}>
          What is it?
        </label>
        <input
          id="sell-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. the camera in the drawer"
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

      {/* ---- Step 1: the price that counts ---- */}
      <div className={card}>
        <p className={eyebrow}>The price that counts</p>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <MoneyField
            id="sell-worth"
            label="What have similar ones actually sold for?"
            value={inp.worth}
            onChange={(v) => set("worth", v)}
            placeholder="e.g. £350"
            help={
              <>
                Sold prices, not asking prices: on eBay, tick &ldquo;Sold
                items&rdquo; and take a typical one. Count what you&rsquo;d
                get after fees and postage. If nobody would pay for it, put
                0.
              </>
            }
          />
          <MoneyField
            id="sell-paid"
            label="What did you pay for it?"
            value={inp.paid}
            onChange={(v) => set("paid", v)}
            placeholder="e.g. £900"
            optional
            help="Only so the read can set it aside. Buyers never see it."
          />
        </div>
      </div>

      {/* ---- Step 2: the buyer's question ---- */}
      <div className={card}>
        <p className={eyebrow}>The buyer&rsquo;s question</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">
          If you didn&rsquo;t have it, would you buy it today {forWorth}?
        </p>
        <Chips<Buy>
          label="Would you buy it today"
          value={inp.buy}
          onPick={(v) => set("buy", v)}
          cols={1}
          options={[
            { id: "yes", label: "Yes, I'd buy it again" },
            { id: "maybe", label: "I'm honestly not sure" },
            { id: "no", label: "No, I wouldn't" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">When did you last use it?</p>
        <Chips<Used>
          label="When you last used it"
          value={inp.used}
          onPick={(v) => set("used", v)}
          options={[
            { id: "month", label: "In the last month" },
            { id: "year", label: "In the last year" },
            { id: "longer", label: "Over a year ago, or never" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Why is it still here?</p>
        <Chips<Why>
          label="Why it's still here"
          value={inp.why}
          onPick={(v) => set("why", v)}
          options={[
            { id: "might", label: "I might need it one day" },
            { id: "means", label: "It means something to me" },
            { id: "paid", label: "I paid a lot for it" },
            { id: "none", label: "No reason, it just is" },
          ]}
        />
      </div>

      {/* ---- Step 3: selling it ---- */}
      {selling ? (
        <div className={card}>
          <p className={eyebrow}>Selling it</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">
            How much work would selling it be?
          </p>
          <Chips<Effort>
            label="How much work selling it would be"
            value={inp.effort}
            onPick={(v) => set("effort", v)}
            cols={1}
            options={[
              { id: "easy", label: "Easy: a few photos, someone collects (about an hour)" },
              { id: "some", label: "Some: questions, a meet-up or a parcel (about 3 hours)" },
              { id: "lots", label: "A lot: big, fragile or fiddly to post (about 6 hours)" },
            ]}
          />
          <div className="mt-5">
            <MoneyField
              id="sell-rate"
              label="What's an hour of your time worth to you?"
              value={inp.rate}
              onChange={(v) => set("rate", v)}
              placeholder="e.g. £15"
              optional
              help={
                <>
                  If selling pays less than this an hour, the read says give
                  it away. Not sure?{" "}
                  <Link href="/worth" className={link}>
                    Put a price on an hour
                  </Link>
                  .
                </>
              }
            />
          </div>
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What matters more?</p>
          <Chips<Rush>
            label="What matters more"
            value={inp.rush}
            onPick={(v) => set("rush", v)}
            options={[
              { id: "price", label: "Getting the most for it" },
              { id: "soon", label: "Having it gone soon" },
            ]}
          />
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What condition is it in?</p>
          <Chips<Condition>
            label="Its condition"
            value={inp.condition}
            onPick={(v) => set("condition", v)}
            options={[
              { id: "new", label: "Like new" },
              { id: "good", label: "Good, light wear" },
              { id: "worn", label: "Well used, works" },
              { id: "repair", label: "Needs a repair" },
            ]}
          />
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? sellHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Fill in what similar ones sold for and answer the buyer&rsquo;s
            question, and the read appears: keep it, box it, give it away, or
            sell it, with the listing and the lowest offer to take.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_SELL);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function ReadBlock({ inp, read }: { inp: SellInputs; read: SellRead }) {
  const [copied, setCopied] = useState<"" | "listing" | "reply" | "line" | "all" | "no">("");
  const rule = sellRule();
  const words = sellWords(inp, read);
  const wordsHead =
    read.kind === "box" ? "The label for the box" : read.kind === "give" ? "The listing, free" : "The listing";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {sellHeadline(inp, read)}
      </p>
      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <ReadBody inp={inp} read={read} />
        <Notes inp={inp} read={read} />
      </div>

      {words ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>{wordsHead}</p>
          <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{words.listing}</p>
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            {read.kind === "box"
              ? "Write it on the box, or tape it to the thing. Then put it somewhere you'd have to go and fetch it."
              : "Fill in the square brackets. Good photos in daylight, from every side, do more than any wording."}
          </p>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(words.listing)) ? "listing" : "no")}
            className="mt-3 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "listing" ? "Copied" : read.kind === "box" ? "Copy the label" : "Copy the listing"}
          </button>
          {read.kind === "box" ? (
            <button
              type="button"
              onClick={() => downloadBoxIcs(inp, read)}
              className="mt-3 ml-5 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Put the date in your calendar (.ics)
            </button>
          ) : null}
          {words.reply ? (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className={eyebrow}>To a low offer</p>
              <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{words.reply}</p>
              <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
                Decided now, before the first offer arrives. An offer below it
                isn&rsquo;t an insult; it&rsquo;s a question, and this is the
                answer.
              </p>
              <button
                type="button"
                onClick={async () => setCopied((await copyText(words.reply)) ? "reply" : "no")}
                className="mt-3 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                {copied === "reply" ? "Copied" : "Copy the reply"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          There&rsquo;s always a next thing in the cupboard. A line decided
          once makes it a five-minute job instead of a decision.
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
            onClick={async () => setCopied((await copyText(sellSummary(inp, read))) ? "all" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "all" ? "Copied the whole read" : "Copy the whole read as text"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Couldn&rsquo;t copy. Select the words above instead.
          </p>
        ) : null}
      </div>
      <Handoffs inp={inp} read={read} />
    </div>
  );
}

function ReadBody({ inp, read }: { inp: SellInputs; read: SellRead }) {
  const cur = sellCurrency(inp);
  const worth = formatMoney(read.worth, cur);
  switch (read.kind) {
    case "treasure":
      return (
        <p>
          Some things are worth more than they&rsquo;d sell for, and
          that&rsquo;s a fine reason to keep one. The test is whether it&rsquo;s
          kept where you&rsquo;d see it. If it lives in a box you never open,
          it&rsquo;s the memory you&rsquo;re keeping, and a photo of it keeps
          that too. If it&rsquo;s one of many, keep the best one.
        </p>
      );
    case "keep":
      return (
        <p>
          You&rsquo;d pay {read.worth > 0 ? worth : "for it"}{" "}to have it if
          you didn&rsquo;t, so keeping it isn&rsquo;t inertia. It&rsquo;s a
          purchase you&rsquo;d make again. Make it easy to reach, so it gets
          used.
        </p>
      );
    case "box":
      return (
        <p>
          Not sure is an honest answer, and arguing with yourself won&rsquo;t
          settle it. Not using it will. Put it in a box, out of sight but not
          out of reach, with today&rsquo;s date and the date{" "}
          {BOX_DAYS}{" "}days from now. If you go and fetch it, you&rsquo;ve
          found out it&rsquo;s a keeper. If the date comes and you
          haven&rsquo;t, you&rsquo;ve found out the other thing, and it goes
          without another debate.
        </p>
      );
    case "give":
      return read.worthless ? (
        <p>
          Nobody would pay for it, so the only question is whether it&rsquo;s
          useful to someone. If it works, list it free and let the first
          person who wants it collect it. If it doesn&rsquo;t, recycle it.
          Either way, this week, before it settles back into the cupboard.
        </p>
      ) : (
        <p>
          You wouldn&rsquo;t buy it, so it goes. But at {worth}{" "}for about{" "}
          {read.hours}{" "}hour{read.hours === 1 ? "" : "s"}{" "}of photos,
          messages and handover, selling it pays about{" "}
          {formatMoney(read.hourly, cur)}{" "}an hour, less than you said your
          time is worth. Give it to someone who&rsquo;ll use it, or list it
          free and let the first person collect it.
        </p>
      );
    case "sell":
      return (
        <p>
          You wouldn&rsquo;t buy it today for {worth}, so keeping it is buying
          it again at that price every day it stays. Sell it. The price comes
          from what similar ones sold for, not from what you paid or what
          others are asking.{" "}
          {inp.rush === "soon"
            ? "You'd rather it went soon, so list it at a round number near the going price. Round prices draw lower offers but sell more often: they read as a seller who wants it gone."
            : "List it at a precise number a little above the going price. Precise prices draw higher offers: they read as a seller who can wait."}{" "}
          Decide the lowest you&rsquo;ll take now, before the first offer
          arrives and starts to feel like the real price.
        </p>
      );
  }
}

/** The sentences that depend on the answers, not the kind. */
function Notes({ inp, read }: { inp: SellInputs; read: SellRead }) {
  const cur = sellCurrency(inp);
  const notes: { key: string; head: string; body: React.ReactNode }[] = [];
  const going = read.kind === "sell" || read.kind === "give" || read.kind === "box";
  if (read.kind !== "treasure" && read.paid !== null && read.paid > read.worth) {
    notes.push({
      key: "paid",
      head: "What you paid isn't on the listing.",
      body: `You paid ${formatMoney(read.paid, cur)} and it would fetch about ${formatMoney(read.worth, cur)}. The ${formatMoney(read.paid - read.worth, cur)} between them went while you owned it, not when you sell it, and keeping it won't bring it back. In a study of Boston flats in the 1990s, owners facing a loss on what they'd paid listed higher and took much longer to sell. Buyers never heard the old price.`,
    });
  } else if (read.kind !== "treasure" && inp.why === "paid") {
    notes.push({
      key: "paid",
      head: "What you paid isn't on the listing.",
      body: "That money went while you owned it, not when you sell it, and keeping it won't bring it back. Sellers who price from what they paid list too high and wait much longer to sell. Buyers never heard the old price.",
    });
  }
  if (inp.why === "might" && going) {
    notes.push({
      key: "might",
      head: "If you did need one again, you could buy one.",
      body: read.worth > 0
        ? `They sell for about ${formatMoney(read.worth, cur)}, so selling now and rebuying one day costs little more than the difference in condition. Keeping it costs the space every day, for a day that may not come.`
        : "Nobody pays for these, which usually means they're easy to find again. Keeping it costs the space every day, for a day that may not come.",
    });
  }
  if (read.kind === "keep" && inp.used === "longer") {
    notes.push({
      key: "unused",
      head: "You'd buy it, but you haven't used it in over a year.",
      body: "Would you buy it to keep where it is now? If the honest answer is that you'd buy it to use, and you haven't, try the box instead.",
    });
  }
  if (read.kind === "box" && inp.used === "month") {
    notes.push({
      key: "recent",
      head: "You used it this month.",
      body: "Then the box will probably be fetched, and that's a fine answer. Box it anyway if you're unsure: the date settles it.",
    });
  }
  if (read.kind === "sell" && parseMoney(inp.rate) === null) {
    notes.push({
      key: "hourly",
      head: `That's about ${formatMoney(read.hourly, cur)} an hour for your time.`,
      body: (
        <>
          About {read.hours}{" "}hour{read.hours === 1 ? "" : "s"}{" "}of photos,
          messages and handover for {formatMoney(read.worth, cur)}. If that
          isn&rsquo;t worth it to you, give it away instead.{" "}
          <Link href="/worth" className={link}>
            What&rsquo;s an hour worth?
          </Link>
        </>
      ),
    });
  }
  if (inp.condition === "repair" && (read.kind === "sell" || read.kind === "give")) {
    notes.push({
      key: "repair",
      head: "Say what's wrong, plainly.",
      body: (
        <>
          Sold as needing repair, with the fault named, it goes to someone who
          can fix it and comes back as no complaint. Whether to fix it first is
          its own sum:{" "}
          <Link href={withSubject("/fix", inp.what)} className={link}>
            fix it or replace it
          </Link>
          .
        </>
      ),
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

function Handoffs({ inp, read }: { inp: SellInputs; read: SellRead }) {
  const s = inp.what;
  const list: Handoff[] = [];
  if (read.kind === "sell") {
    list.push({
      href: withSubject("/walkaway", s),
      label: "Where's your line?",
      note: "If a buyer haggles in person, set your walk-away and your target before you meet, not on the doorstep.",
    });
  }
  if (read.kind === "box") {
    list.push({
      href: withSubject("/premortem", s),
      label: "Imagine it failed",
      note: "If the box is still shut on the day and you keep it anyway, what would the reason be? Name it now.",
    });
  }
  list.push({
    href: withSubject("/rule", s),
    label: "Make it a standing rule",
    note: "There's always another thing in the cupboard. Decide your line once, so the next one is a five-minute job.",
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
function SellExample() {
  const ex = SELL_EXAMPLE;
  const read = readSell(ex);
  if (!read) return null;
  const cur = sellCurrency(ex);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        The road bike cost me {formatMoney(read.paid ?? 0, cur)}{" "}four years
        ago. I rode it twice last summer. It lives in the hall, and every few
        months I decide to start riding again, or to sell it once I&rsquo;ve
        worked out what it&rsquo;s worth.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Sold listings for the same model put it at about{" "}
        {formatMoney(read.worth, cur)}. Would I buy it today for that? No. I
        wouldn&rsquo;t even have to think about it.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {sellHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          I&rsquo;d been waiting to get &ldquo;a fair price&rdquo; for it, and
          fair had meant something near the {formatMoney(read.paid ?? 0, cur)}.
          Nobody buying it had heard that number. I listed it at{" "}
          {formatMoney(read.ask, cur)}, said no to an offer of &pound;250
          with the reply ready, and sold it for &pound;340 a week later.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}thing.
      </p>
    </div>
  );
}
