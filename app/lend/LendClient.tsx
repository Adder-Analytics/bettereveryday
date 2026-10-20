"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { moneyInvalid } from "../data/worth";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import {
  BLANK_LEND,
  LEND_EXAMPLE,
  LONG_MONTHS,
  formatMoney,
  isoDay,
  lendCurrency,
  lendHeadline,
  lendMessage,
  lendName,
  lendRule,
  lendSummary,
  longDate,
  parseLendInputs,
  planCut,
  planSentence,
  readLend,
  type Ask,
  type Close,
  type LendInputs,
  type LendRead,
  type Lose,
  type Record_,
  type Why,
} from "../data/lend";

/**
 * Lend it, give it, or say no? (/lend)
 *
 * The instrument for a friend or relative asking to borrow money, or asking
 * you to co-sign. A loan puts an exchange rule inside a communal relationship
 * (Clark and Mills, 1979), a large share of these loans never come back
 * (Bankrate, 2019), and co-signing is a promise to pay all of it (the FTC's
 * cosigner notice). So the read starts from the most you could hand over and
 * never think about again, and ends in the words to say: a gift said as a
 * gift, a smaller offer, a loan written down with dates, or a no that offers
 * something else.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/lend.ts` so it can be checked without a browser.
 */

const STORE_KEY = "lend:v1";

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

function loadInputs(): LendInputs {
  if (typeof window === "undefined") return BLANK_LEND;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseLendInputs(JSON.parse(raw)) : BLANK_LEND;
  } catch {
    return BLANK_LEND;
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
 * Every repayment as an all-day event, so a missed one is noticed on the day
 * rather than months later, when asking has become awkward. Built in the
 * browser with the shared ics.ts plumbing; nothing is sent anywhere.
 */
function downloadPlanIcs(inp: LendInputs, read: LendRead): void {
  const cur = lendCurrency(inp);
  const who = lendName(inp);
  const agreed = isoDay(new Date());
  const events = read.plan.map((p, i) => {
    const day = p.date.replace(/-/g, "");
    const [y, m, d] = p.date.split("-").map(Number);
    const end = isoDay(new Date(y, m - 1, d + 1)).replace(/-/g, "");
    const summary = `Repayment due: ${formatMoney(p.amount, cur)} (${who})`;
    const desc = [
      `Payment ${i + 1} of ${read.plan.length} on the loan of ${formatMoney(read.amount, cur)} agreed on ${agreed}.`,
      "\nIf it hasn't arrived, a friendly message today is easier than a hard one in three months.",
      `\n${SITE_URL}/lend`,
    ].join("");
    return [
      "BEGIN:VEVENT",
      `UID:lend-${agreed}-${p.date}-${i}@bettereveryday`,
      `DTSTAMP:${icsStamp()}`,
      `DTSTART;VALUE=DATE:${day}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${icsEscape(summary)}`,
      `DESCRIPTION:${icsEscape(desc)}`,
      "END:VEVENT",
    ];
  });
  const blob = new Blob([wrapCalendar(events, "Lend")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `repayments-${read.plan[0]?.date ?? agreed}.ics`;
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

const MONEY_BAD = "Type an amount, like 300, £800 or 1,200.";

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

export default function LendClient() {
  const [inp, setInp] = useState<LendInputs>(BLANK_LEND);
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

  const set = <K extends keyof LendInputs>(k: K, v: LendInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readLend(inp), [inp]);
  const cosign = inp.ask === "cosign";

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
        {showExample ? <LendExample /> : null}
      </div>

      {/* ---- Who's asking ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="lend-what" className={`block ${eyebrow} mb-2`}>
          Who&rsquo;s asking, and what for?
        </label>
        <input
          id="lend-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. Sam, for rent until payday"
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

      {/* ---- Step 1: the ask ---- */}
      <div className={card}>
        <p className={eyebrow}>The ask</p>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <Chips<Ask>
            label="What they've asked for"
            value={inp.ask}
            onPick={(v) => set("ask", v)}
            options={[
              { id: "lend", label: "To borrow money" },
              { id: "cosign", label: "To co-sign or guarantee a loan" },
            ]}
          />
          <MoneyField
            id="lend-amount"
            label={cosign ? "How much is the loan you'd be signing for?" : "How much have they asked for?"}
            value={inp.amount}
            onChange={(v) => set("amount", v)}
            placeholder="e.g. £800"
            help={cosign ? "The whole loan, not the monthly payment: that's what the lender could ask you for." : undefined}
          />
        </div>
      </div>

      {/* ---- Step 2: the question that decides most of it ---- */}
      <div className={card}>
        <p className={eyebrow}>The question that decides most of it</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">
          {cosign
            ? "If they stopped paying and the lender came to you for all of it, how would that be?"
            : "If it never came back, how would that be?"}
        </p>
        <Chips<Lose>
          label={cosign ? "If you had to pay all of it" : "If it never came back"}
          value={inp.lose}
          onPick={(v) => set("lose", v)}
          cols={1}
          options={[
            { id: "fine", label: "Fine. I could lose it without it hurting." },
            { id: "hurt", label: "It would hurt, but I'd manage" },
            { id: "need", label: "I'd need it back: it's rent, bills or my only savings" },
          ]}
        />
        {inp.lose && inp.lose !== "fine" ? (
          <div className="mt-4">
            <MoneyField
              id="lend-spare"
              label="The most you could give them and never think about again"
              value={inp.spare}
              onChange={(v) => set("spare", v)}
              placeholder="e.g. £300"
              optional
              help="As a gift, not a loan: an amount you'd never ask about and wouldn't mind seeing them spend on a holiday. £0 is an honest answer."
            />
          </div>
        ) : null}
      </div>

      {/* ---- Step 3: what you know ---- */}
      {read && !cosign ? (
        <div className={card}>
          <p className={eyebrow}>What you know</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">What&rsquo;s it for?</p>
          <Chips<Why>
            label="What the money is for"
            value={inp.why}
            onPick={(v) => set("why", v)}
            options={[
              { id: "emergency", label: "A one-off emergency" },
              { id: "gap", label: "A gap until money comes in" },
              { id: "ongoing", label: "Money's short every month" },
              { id: "venture", label: "To start or invest in something" },
              { id: "other", label: "Something else" },
            ]}
          />
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            Have they borrowed from you before?
          </p>
          <Chips<Record_>
            label="Their record with money borrowed before"
            value={inp.record}
            onPick={(v) => set("record", v)}
            options={[
              { id: "first", label: "No, this is the first time" },
              { id: "repaid", label: "Yes, and paid it back on time" },
              { id: "late", label: "Yes, and paid it back late or in part" },
              { id: "never", label: "Yes, and never paid it back" },
            ]}
          />
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            If it never came back, would you two still be close?
          </p>
          <Chips<Close>
            label="Whether you'd still be close if it never came back"
            value={inp.close}
            onPick={(v) => set("close", v)}
            options={[
              { id: "yes", label: "Yes, nothing would change" },
              { id: "strained", label: "It would sit between us" },
              { id: "no", label: "Honestly, probably not" },
            ]}
          />
        </div>
      ) : null}

      {/* ---- Step 4: the terms, when it's a loan ---- */}
      {read?.kind === "terms" ? (
        <div className={card}>
          <p className={eyebrow}>The terms</p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Agree these with them now, while you&rsquo;re both glad about it.
            The dates are what make asking later about the agreement rather
            than about the friendship.
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MoneyField
              id="lend-per"
              label="They'll pay back a month"
              value={inp.per}
              onChange={(v) => set("per", v)}
              placeholder="e.g. £100"
            />
            <div>
              <label htmlFor="lend-start" className="block text-sm text-[var(--muted)] mb-1.5">
                First payment on <span className="opacity-70">(optional)</span>
              </label>
              <input
                id="lend-start"
                type="date"
                value={inp.start}
                onChange={(e) => set("start", e.target.value)}
                aria-describedby="lend-start-help"
                className={inputClass}
              />
              <p id="lend-start-help" className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                Blank means the 1st of next month. If they&rsquo;re waiting on
                pay, make it the day after it lands.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? lendHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Fill in the amount and answer the question above, and the read
            appears: whether to give it, lend it or say no, and the words to
            say it with.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_LEND);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function ReadBlock({ inp, read }: { inp: LendInputs; read: LendRead }) {
  const [copied, setCopied] = useState<"" | "message" | "line" | "all" | "no">("");
  const rule = lendRule();
  const message = lendMessage(inp, read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {lendHeadline(inp, read)}
      </p>
      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <ReadBody inp={inp} read={read} />
        <Notes inp={inp} read={read} />
      </div>

      <PlanBlock inp={inp} read={read} />

      <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
        <p className={eyebrow}>{read.kind === "terms" ? "The terms, to send" : "What to say"}</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{message}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Change the words to sound like you. Keep the parts that do the work:
          {read.kind === "terms"
            ? " the amount, the dates, and what happens if one's late."
            : read.kind === "give" || read.kind === "part"
              ? " that it's a gift, and that you don't want it back."
              : " the no, said once and plainly, and the help you're offering instead."}
        </p>
        <button
          type="button"
          onClick={async () => setCopied((await copyText(message)) ? "message" : "no")}
          className="mt-3 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {copied === "message" ? "Copied" : "Copy these words"}
        </button>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          The next ask will come in person or by message, with someone you
          care about waiting for an answer. A line decided now is easier to
          hold then.
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
            onClick={async () => setCopied((await copyText(lendSummary(inp, read))) ? "all" : "no")}
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

function ReadBody({ inp, read }: { inp: LendInputs; read: LendRead }) {
  const cur = lendCurrency(inp);
  const amt = formatMoney(read.amount, cur);
  switch (read.kind) {
    case "cosign":
      return read.cosignOk ? (
        <p>
          Co-signing isn&rsquo;t lending. It&rsquo;s a promise to pay all{" "}
          {amt}, plus any late fees, and the lender can often come to you
          without chasing them first. You could pay it without it hurting, so
          it can be a kind thing to do. Sign it as if it were a gift you might
          one day have to make, and ask to be told before a payment is missed,
          not after.
        </p>
      ) : (
        <p>
          Co-signing isn&rsquo;t lending. It&rsquo;s a promise to pay all{" "}
          {amt}. US lenders have to warn co-signers in writing that they may
          have to pay up to the full amount if the borrower doesn&rsquo;t, plus
          late fees, and a missed payment can land on your credit record too.
          You couldn&rsquo;t pay it without it hurting, so it isn&rsquo;t a
          promise you can make. If you want to help, give what you could lose
          instead.
        </p>
      );
    case "give":
      return (
        <p>
          You could lose all of it without it hurting, so the kindest way to
          lend it is not to lend it. A loan puts a score between you: every
          week it&rsquo;s unpaid, you notice and they know you notice. A gift
          doesn&rsquo;t. If they insist on paying it back, accept it when it
          comes, but don&rsquo;t ask and don&rsquo;t count.
        </p>
      );
    case "part":
      return (
        <p>
          Losing all {amt}{" "}would hurt. Losing{" "}
          {formatMoney(read.offer, cur)}{" "}wouldn&rsquo;t. Offering that as a
          gift helps now and puts nothing between you. If they still need the
          rest, that part is a loan, and it&rsquo;s only one to make if you
          could wait for it, written down with dates. Usually the smaller gift
          is the better help: it comes with no debt attached.
        </p>
      );
    case "no":
      return read.burned ? (
        <p>
          Last time it didn&rsquo;t come back. That&rsquo;s the best guide to
          this time, however different the reason sounds. Lending again turns
          one unpaid debt into two, and a second one is harder on the
          friendship than the first. Saying no to the loan isn&rsquo;t saying
          no to them: offer help that isn&rsquo;t money, or a gift you could
          lose.
        </p>
      ) : (
        <p>
          You&rsquo;d need this money back, and money lent to friends and
          family often doesn&rsquo;t come back. In one US survey, more than a
          third of people who had lent cash lost money. Lending what you
          can&rsquo;t lose turns their problem into yours, and the friendship
          into a debt. Saying no to the loan isn&rsquo;t saying no to them.
        </p>
      );
    case "recurring":
      return (
        <p>
          If money&rsquo;s short every month, a loan covers this month and
          adds a debt to the next. It delays the problem and puts you inside
          it. What helps is changing the month itself: going through it
          together, or helping them talk to whoever they owe. If you want to
          give money too, give an amount you could lose, and call it a gift.
        </p>
      );
    case "terms":
      return (
        <p>
          Losing it would hurt, but you could wait for it. That&rsquo;s a loan,
          and it needs the things a bank loan has and a favour doesn&rsquo;t:
          the amount, the dates, and what happens if one&rsquo;s late, written
          down and agreed now, while you&rsquo;re both glad about it. Then
          asking later is about the agreement, not the friendship.
          {read.plan.length === 0 ? " Add what they could pay back a month, above, to put dates on it." : ""}
        </p>
      );
  }
}

/** The sentences that depend on the answers, not the kind. */
function Notes({ inp, read }: { inp: LendInputs; read: LendRead }) {
  const notes: { key: string; head: string; body: React.ReactNode }[] = [];
  const lending = read.kind === "terms" || read.kind === "part";
  if (lending && inp.record === "late") {
    notes.push({
      key: "late",
      head: "Last time it came back late.",
      body: "Expect the same. Only lend if you could wait that long again without minding, and put the dates in writing this time.",
    });
  }
  if (read.kind === "terms" && (inp.close === "no" || inp.close === "strained")) {
    notes.push({
      key: "close",
      head: "The friendship is part of what you're lending.",
      body: inp.close === "no"
        ? "You said you probably wouldn't stay close if it never came back. So you'd risk losing them as well as the money. A smaller gift you'd never ask about may be the better help."
        : "You said it would sit between you if it never came back. That's the score a loan keeps. The written dates help, because a missed one becomes a fact you can mention, not a grudge you carry.",
    });
  }
  if (inp.why === "venture" && read.kind !== "cosign") {
    notes.push({
      key: "venture",
      head: "Money to start something is an investment, not a loan.",
      body: (
        <>
          It comes back only if the venture works, and most new businesses
          don&rsquo;t last: in the US, about half close within five years. Put
          in only what you could lose, and ask what share it buys, if any. To
          see the odds for this kind of venture, try{" "}
          <Link href={withSubject("/outside", inp.what)} className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the outside view
          </Link>
          .
        </>
      ),
    });
  }
  if (inp.why === "gap" && read.kind === "terms") {
    notes.push({
      key: "gap",
      head: "A gap with an end date is the best case for a loan.",
      body: "Tie the repayment to the money they're waiting for: the first payment the day after it lands, and in one go if it's enough.",
    });
  }
  if (inp.why === "emergency" && (read.kind === "no" || read.kind === "part")) {
    notes.push({
      key: "emergency",
      head: "Emergencies have other doors.",
      body: "Whoever's owed (the landlord, the garage, the energy company) will often agree a payment plan if asked before the date. Helping make that call can be worth more than the money.",
    });
  }
  if (read.plan.length > LONG_MONTHS) {
    notes.push({
      key: "long",
      head: `That's ${read.plan.length} months of owing you.`,
      body: "A loan between friends that runs for years tends to be forgotten by one of you and remembered by the other. Lend less, or agree a larger monthly amount.",
    });
  }
  if (planCut(read, inp)) {
    notes.push({
      key: "cut",
      head: "At that rate it would take over ten years.",
      body: "The dates below stop at ten years. A loan that long is really a gift, so decide whether it is one.",
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

/** The repayment dates, when it's a loan with a monthly amount. */
function PlanBlock({ inp, read }: { inp: LendInputs; read: LendRead }) {
  if (read.plan.length === 0) return null;
  const cur = lendCurrency(inp);
  const shown = read.plan.length > 12 ? [...read.plan.slice(0, 11), read.plan[read.plan.length - 1]] : read.plan;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The repayments</p>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        {planSentence(inp, read.plan)}.
      </p>
      <ul className="mt-3 space-y-1 text-sm text-[var(--muted)] tabular-nums">
        {shown.map((p, i) => (
          <li key={p.date} className="flex justify-between gap-4">
            <span>
              {i === shown.length - 1 && shown.length < read.plan.length ? "… " : ""}
              {longDate(p.date)}
            </span>
            <span>{formatMoney(p.amount, cur)}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => downloadPlanIcs(inp, read)}
        className="mt-3 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
      >
        Put the dates in your calendar (.ics)
      </button>
      <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
        So a missed payment is noticed on the day, when a friendly message is
        easy, not months later, when it isn&rsquo;t.
      </p>
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: LendInputs; read: LendRead }) {
  const s = inp.what;
  const list: Handoff[] = [];
  if (read.kind === "terms" || (read.kind === "cosign" && read.cosignOk)) {
    list.push({
      href: withSubject("/ruin", s),
      label: "Can you survive the worst case?",
      note: "If it never came back and a bad month landed on top, would you be all right? Check before you hand it over.",
    });
  }
  list.push({
    href: withSubject("/advise", s),
    label: "Advise a friend",
    note: "If a friend told you this story, what would you tell them to do? It's easier to see from outside.",
  });
  list.push({
    href: withSubject("/rule", s),
    label: "Make it a standing rule",
    note: "Asks like this come again. Decide your line once, cold, so the next one isn't decided on the doorstep.",
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
function LendExample() {
  const ex = LEND_EXAMPLE;
  const read = readLend(ex);
  if (!read) return null;
  const cur = lendCurrency(ex);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        My brother rang: the car needed {formatMoney(read.amount, cur)}{" "}of
        work, and without it he couldn&rsquo;t get to his job. He&rsquo;d pay
        me back, he said. The last time I lent him money it came back, but
        late and in pieces, and I&rsquo;d spent most of a year not mentioning
        it.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Losing {formatMoney(read.amount, cur)}{" "}would have hurt. Losing{" "}
        {formatMoney(read.offer, cur)}{" "}wouldn&rsquo;t: that much I could
        give and never think about again.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {lendHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          I gave him {formatMoney(read.offer, cur)}{" "}and told him it
          wasn&rsquo;t a loan. The garage agreed to take the rest over two
          months. Nobody owes anybody, and we still talk about the car, not
          the money.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}ask.
      </p>
    </div>
  );
}
