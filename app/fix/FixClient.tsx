"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { formatMoney, moneyInvalid } from "../data/worth";
import { yearsInvalid } from "../data/cover";
import {
  BLANK_FIX,
  FIX_EXAMPLE,
  breakEvenSentence,
  duration,
  fixCurrency,
  fixHeadline,
  fixName,
  fixRule,
  fixSummary,
  halfRuleSentence,
  lastQuestion,
  parseFixInputs,
  readFix,
  type FixInputs,
  type FixRead,
  type Last,
  type Pulls,
} from "../data/fix";

/**
 * Fix it or replace it? (/fix)
 *
 * The instrument for a repair quote set against the price of a new one. The
 * feel is pulled both ways: towards repairing too long by what's already been
 * spent (the sunk cost, and Okada's "mental book value"), and towards
 * replacing too soon by an appealing upgrade (Bellezza, Ackerman and Gino).
 * The tool turns the quote into the one number people can judge: how long
 * the repair has to keep the old one going to beat a new one's cost per year
 * of use.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/fix.ts` so it can be checked without a browser.
 */

const STORE_KEY = "fix:v1";

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

function loadInputs(): FixInputs {
  if (typeof window === "undefined") return BLANK_FIX;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseFixInputs(JSON.parse(raw)) : BLANK_FIX;
  } catch {
    return BLANK_FIX;
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
}: {
  value: T;
  options: { id: T; label: string }[];
  onPick: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
  help?: string;
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
          Type an amount, like 120, £12.50 or 1,200.
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

const PULLS: { id: keyof Pulls; label: string }[] = [
  { id: "sunk", label: "I've already spent a lot on it." },
  { id: "upgrade", label: "The new one is better, and I want it." },
  { id: "waste", label: "Throwing it out feels wasteful." },
  { id: "next", label: "I'm worried something else will go next." },
];

export default function FixClient() {
  const [inp, setInp] = useState<FixInputs>(BLANK_FIX);
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

  const set = <K extends keyof FixInputs>(k: K, v: FixInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));
  const setPull = (k: keyof Pulls, v: boolean) =>
    setInp((prev) => ({ ...prev, pulls: { ...prev.pulls, [k]: v } }));

  const read = useMemo(() => readFix(inp), [inp]);
  const askLast = read !== null && read.kind !== "outlast";
  const lifeBad = yearsInvalid(inp.life);

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
        {showExample ? <FixExample /> : null}
      </div>

      {/* ---- What's broken ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="fix-what" className={`block ${eyebrow} mb-2`}>
          What needs fixing?
        </label>
        <input
          id="fix-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. Washing machine: drum bearing has gone"
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

      {/* ---- Step 1: the two prices ---- */}
      <div className={card}>
        <p className={eyebrow}>The two prices</p>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <MoneyField
            id="fix-quote"
            label="The repair quote"
            value={inp.quote}
            onChange={(v) => set("quote", v)}
            placeholder="e.g. £180"
            help="Everything it would take to get it working: parts, labour, the call-out. If you'd do it yourself, the parts, and your time if it's a lot of it."
          />
          <MoneyField
            id="fix-price"
            label="What a new one would cost"
            value={inp.price}
            onChange={(v) => set("price", v)}
            placeholder="e.g. £450"
            help="The one you'd actually buy if this one went, delivered and fitted. Not the top of the range unless that's what you'd buy."
          />
          <div>
            <label htmlFor="fix-life" className="block text-sm text-[var(--muted)] mb-1.5">
              How long a new one would last
            </label>
            <input
              id="fix-life"
              type="text"
              inputMode="decimal"
              value={inp.life}
              onChange={(e) => set("life", e.target.value)}
              placeholder="e.g. 10 years"
              aria-invalid={lifeBad || undefined}
              aria-describedby={lifeBad ? "fix-life-bad fix-life-help" : "fix-life-help"}
              className={inputClass}
            />
            {lifeBad ? (
              <p id="fix-life-bad" className="mt-1.5 text-xs text-[var(--muted)]">
                Type years, like 10 or 4.5, or months, like 30 months.
              </p>
            ) : null}
            <p id="fix-life-help" className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
              Before you&rsquo;d replace it anyway. How long the last one lasted is
              a fair guide, or ask the shop what they see.
            </p>
          </div>
          <MoneyField
            id="fix-resale"
            label="What the old one would fetch as it is"
            value={inp.resale}
            onChange={(v) => set("resale", v)}
            placeholder="e.g. £100"
            optional
            help="A trade-in, a sale for parts, scrap. Leave it blank if it would go to the tip."
          />
          <MoneyField
            id="fix-saving"
            label="What a new one would save you a year to run"
            value={inp.saving}
            onChange={(v) => set("saving", v)}
            placeholder="e.g. £30"
            optional
            help="Energy, fuel, servicing. Count only what you'd really save, not what the label promises."
          />
        </div>
      </div>

      {/* ---- Step 2: the bar the repair has to clear ---- */}
      {read && askLast ? (
        <div className={card}>
          <p className={eyebrow}>The bar</p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            {breakEvenSentence(inp, read)}
          </p>
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">{lastQuestion(read)}</p>
          <Chips<Last>
            label={lastQuestion(read)}
            value={inp.last}
            onPick={(v) => set("last", v)}
            options={[
              { id: "longer", label: "Yes, comfortably" },
              { id: "about", label: "About that, maybe" },
              { id: "shorter", label: "No, I doubt it" },
              { id: "unknown", label: "I have no idea" },
            ]}
          />
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            Ask the person quoting two questions: how long does one usually go
            on after this repair, and is anything else on it close to going?
            They see hundreds of these. An honest &ldquo;I wouldn&rsquo;t bother&rdquo;
            is worth more than any sum.
          </p>
        </div>
      ) : null}

      {/* ---- Step 3: what else is pulling ---- */}
      {read ? (
        <div className={card}>
          <p className={eyebrow}>What else is pulling</p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            Tick any that are true. They don&rsquo;t change the sum; each gets a
            sentence in the read.
          </p>
          <div className="mt-3 space-y-2">
            {PULLS.map((p) => (
              <label
                key={p.id}
                className="flex items-start gap-2 text-sm text-[var(--muted)] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={inp.pulls[p.id]}
                  onChange={(e) => setPull(p.id, e.target.checked)}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? fixHeadline(read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Fill in the quote, the price of a new one and how long a new one
            lasts, and the read appears: how long the repair has to keep it
            going to be the better buy.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_FIX);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function ReadBlock({ inp, read }: { inp: FixInputs; read: FixRead }) {
  const [copied, setCopied] = useState<"" | "line" | "all" | "no">("");
  const rule = fixRule();
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {fixHeadline(read)}
      </p>
      <LifeBar read={read} />
      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <ReadBody inp={inp} read={read} />
        <PullNotes inp={inp} read={read} />
        <p className="text-[var(--muted)]">{halfRuleSentence(read)}</p>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          The quote usually arrives by phone, with the thing in bits and someone
          waiting for a yes. One division, done before you answer, turns
          &ldquo;is it worth it?&rdquo; into &ldquo;will it last that long?&rdquo;
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
            onClick={async () => setCopied((await copyText(fixSummary(inp, read))) ? "all" : "no")}
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
 * How long the repair has to last against a new one's whole life. Purely a
 * picture of the sentence beside it, so it's hidden from screen readers.
 */
function LifeBar({ read }: { read: FixRead }) {
  const finite = Number.isFinite(read.needed);
  const max = Math.max(read.life, finite ? read.needed : read.life) * 1.1 || 1;
  const pos = (n: number) => Math.min(100, Math.max(0, (n / max) * 100));
  const neededAt = finite ? pos(read.needed) : 100;
  return (
    <div className="mt-5" aria-hidden="true">
      <div className="relative h-2 rounded-full bg-[var(--border)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] opacity-20"
          style={{ width: `${pos(read.life)}%` }}
        />
        <div
          className="absolute -top-1 bottom-[-4px] w-px bg-[var(--muted)]"
          style={{ left: `${pos(read.life)}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]"
          style={{ left: `${neededAt}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-xs text-[var(--muted)]">
        <span>
          {finite ? `repair has to last ${duration(read.needed)}` : "no repair can win"}
        </span>
        <span>a new one lasts {duration(read.life)}</span>
      </div>
    </div>
  );
}

function ReadBody({ inp, read }: { inp: FixInputs; read: FixRead }) {
  const cur = fixCurrency(inp);
  const be = breakEvenSentence(inp, read);
  const d = duration(read.needed);
  const q = formatMoney(read.quote, cur);
  switch (read.kind) {
    case "outlast":
      return (
        <p>
          {be}{" "}Even a perfect repair can&rsquo;t win that. Put the {q}{" "}
          towards the new one, and see if the old one will fetch something as
          it is: for parts, a trade-in, or someone who fixes things themselves.
        </p>
      );
    case "threshold":
      return (
        <p>
          {be}{" "}That&rsquo;s the whole question now: will it keep going for
          more than {d}? Answer it above.
        </p>
      );
    case "easy":
      return (
        <p>
          {be}{" "}That&rsquo;s a low bar. Unless you&rsquo;ve been told something
          else on {fixName(inp)}{" "}is about to go, the repair pays for itself
          almost straight away. Fix it, and run the sum again next time.
        </p>
      );
    case "fix":
      return (
        <p>
          {be}{" "}You expect it to last comfortably longer, so the repair is the
          better buy. Every month it runs past {d}{" "}is a month of a new one
          you didn&rsquo;t pay for. If it breaks again, run the sum again on the
          new quote. Don&rsquo;t count this one: by then it&rsquo;s spent.
        </p>
      );
    case "close":
      return (
        <p>
          {be}{" "}You think it&rsquo;ll last about that long, which means the
          money comes out roughly even either way. Let the other things decide:
          the hassle of another breakdown, the waste of throwing it out, whether
          the new one does something you&rsquo;d really use. Any of those is a
          fair tie-breaker when the money is a draw.
        </p>
      );
    case "replace":
      return (
        <p>
          {be}{" "}You doubt it&rsquo;ll last that long, so the {q}{" "}would buy
          less time than the same money spent on a new one. Replace it. If the
          doubt is only a feeling, ask the repairer what they see first; if
          it&rsquo;s because other parts are wearing too, you&rsquo;re right.
        </p>
      );
    case "ask":
      return (
        <p>
          {be}{" "}You don&rsquo;t know yet, and you don&rsquo;t need to guess.
          The person quoting does know: ask how long one usually goes on after
          this repair, and what else on it is close to going. If the honest
          answer is comfortably more than {d}, fix it. If they hesitate,
          replace it.
        </p>
      );
  }
}

/** One sentence for each pull the person ticked. */
function PullNotes({ inp, read }: { inp: FixInputs; read: FixRead }) {
  const cur = fixCurrency(inp);
  const p = inp.pulls;
  const notes: { key: string; head: string; body: string }[] = [];
  if (p.sunk) {
    notes.push({
      key: "sunk",
      head: "What you've spent is gone either way.",
      body: "The price you paid and the repairs so far don't come back whichever you choose, so they can't tell you which is better. People keep a running tally of what a thing has cost them and resist replacing it until it feels paid off; that tally is a feeling, not a reason. Only the quote, the new price and the time ahead count.",
    });
  }
  if (p.upgrade) {
    const fixWins = read.kind === "fix" || read.kind === "easy";
    const newWins = read.kind === "outlast" || read.kind === "replace";
    const perYear = formatMoney(Math.max(0, read.yearly), cur);
    const pull =
      "Just notice the pull: people treat what they own more carelessly once a better version is on offer, partly so replacing it won't feel wasteful.";
    notes.push({
      key: "upgrade",
      head: "Wanting the new one is allowed. Price it.",
      body: fixWins
        ? `On the sum, the repair wins. Replacing anyway means buying the new one early, and each year you bring it forward costs about ${perYear}. If the upgrade is worth that to you, buy it on purpose and say so. ${pull}`
        : newWins
          ? "Here the sum already leans towards a new one, so the upgrade costs you nothing extra. Make sure it's the upgrade you'd pick with no breakdown hurrying you."
          : `If the repair would last past ${duration(read.needed)}, replacing anyway means buying the new one early, at about ${perYear} for each year you bring it forward. Decide whether the upgrade is worth that before you decide how long the old one has left. ${pull}`,
    });
  }
  if (p.waste) {
    notes.push({
      key: "waste",
      head: "Repair is usually the lower-waste choice.",
      body: read.kind === "fix" || read.kind === "easy"
        ? "Good news: here the money and the waste point the same way."
        : "That's a fair thing to weigh, and the sum shows its price. In a close call, let it decide. When the sum clearly says replace, you can still cut the waste: sell it for parts, or pass it to someone who repairs things.",
    });
  }
  if (p.next) {
    notes.push({
      key: "next",
      head: "Put the worry into the estimate.",
      body: `That's the real question, not a side worry. Ask what else on ${fixName(inp)} is near the end. If something is, add its likely cost to the quote, or shorten how long you expect the repair to buy, and run it again.`,
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

function Handoffs({ inp, read }: { inp: FixInputs; read: FixRead }) {
  const s = inp.what;
  const list: Handoff[] = [];
  if (read.kind === "ask") {
    list.push({
      href: withSubject("/outside", s),
      label: "Find the base rate",
      note: "How long do things like this usually last, and after this repair? Start from the record for the type, not your hope for this one.",
    });
  }
  if (read.kind === "outlast" || read.kind === "replace") {
    list.push({
      href: "/cover",
      label: "Before the till: the warranty",
      note: "Buying new means you'll be offered cover on it. Decide now whether a loss like this is one to insure or one to carry.",
    });
  }
  if (inp.pulls.sunk) {
    list.push({
      href: withSubject("/quit", s),
      label: "Would you start it today?",
      note: "If what you've put in is doing the arguing, the quit-or-stay test takes the past out of the vote.",
    });
  }
  list.push({
    href: withSubject("/rule", s),
    label: "Make it a standing rule",
    note: "Something else will break. Decide the sum once, so the next quote is a division, not a debate.",
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
function FixExample() {
  const ex = FIX_EXAMPLE;
  const read = readFix(ex);
  if (!read) return null;
  const cur = fixCurrency(ex);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        My five-year-old laptop&rsquo;s battery lasted an hour and two keys had
        stopped working. The shop quoted {formatMoney(read.quote, cur)}{" "}for
        both. The new model was {formatMoney(read.price, cur)}, thinner and
        faster, and I&rsquo;d already half decided.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        A new one would last about {duration(read.life)}{" "}and the old one would
        trade in for {formatMoney(read.resale, cur)}, so a year of new came to{" "}
        {formatMoney(read.yearly, cur)}. The repair only had to keep the old one
        going for {duration(read.needed)}. Everything else on it was fine, and
        it did all I needed.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {fixHeadline(read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The pull was the new model, not the old one&rsquo;s faults. Buying it
          then meant paying about {formatMoney(read.yearly, cur)}{" "}for each year
          I brought it forward. I had it repaired and set a reminder to look
          again when it actually slowed me down.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}repair.
      </p>
    </div>
  );
}
