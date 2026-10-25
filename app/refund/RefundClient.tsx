"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { moneyInvalid } from "../data/worth";
import {
  BLANK_REFUND,
  actDate,
  cardMessage,
  isISODate,
  parseRefundInputs,
  readRefund,
  refundBody,
  refundExample,
  refundHeadline,
  refundRule,
  refundSummary,
  sellerMessage,
  todayISO,
  type Paid,
  type Problem,
  type RefundInputs,
  type RefundRead,
  type Stage,
  type Where,
} from "../data/refund";

/**
 * Get your money back (/refund)
 *
 * The instrument for the thing that broke, never came, or was done badly.
 * Most people with a good claim never make it, mostly because it looks like
 * effort that won't work (TARP; Huppertz), and some of that effort is put
 * there on purpose (Sunstein's "sludge"). So the tool does the effort: it
 * finds the remedy the law gives you for this problem at this age, writes the
 * message, sets the reply-by date, and chooses the next rung (card company,
 * platform, ombudsman, small claims) before the first message is sent.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/refund.ts` so it can be checked without a browser.
 */

const STORE_KEY = "refund:v1";

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

function loadInputs(): RefundInputs {
  if (typeof window === "undefined") return BLANK_REFUND;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseRefundInputs(JSON.parse(raw)) : BLANK_REFUND;
  } catch {
    return BLANK_REFUND;
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
 * The reply-by (or cancel-by) date as one all-day event, so the next rung
 * comes back on its day. Built in the browser with the shared ics.ts plumbing.
 */
function downloadDateIcs(inp: RefundInputs, read: RefundRead): void {
  const cancel = read.kind === "cancel";
  const on = cancel ? read.cancelBy : read.replyBy;
  if (!on) return;
  const what = inp.what.trim() || "the refund";
  const day = on.replace(/-/g, "");
  const [y, m, d] = on.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  const end = `${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`;
  const summary = cancel ? `Last day to cancel: ${what}` : `Reply due: ${what}`;
  const at = read.rungs.findIndex((r) => r.now);
  const nextRung = at >= 0 ? read.rungs[at + 1] : undefined;
  const body = cancel
    ? "If you haven't told them you're cancelling, do it today, in writing."
    : `If they haven't put it right, take the next step${nextRung ? `: ${nextRung.head}` : ""}`;
  const event = [
    "BEGIN:VEVENT",
    `UID:refund-${todayISO()}-${on}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(`${body}\n${SITE_URL}/refund`)}`,
    "END:VEVENT",
  ];
  const blob = new Blob([wrapCalendar([event], "Refund")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cancel ? "cancel-by" : "reply-due"}-${on}.ics`;
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

function gotLabel(problem: Problem): string {
  if (problem === "missing") return "When should it have arrived?";
  if (problem === "service") return "When was the work finished?";
  return "When did it arrive, or when did you buy it in the shop?";
}

export default function RefundClient() {
  const [inp, setInp] = useState<RefundInputs>(BLANK_REFUND);
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

  const set = <K extends keyof RefundInputs>(k: K, v: RefundInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readRefund(inp, today), [inp, today]);
  const mind = inp.problem === "mind";
  const canFix = inp.problem === "faulty" || inp.problem === "described" || inp.problem === "service";
  const asked = inp.stage === "asked" || inp.stage === "refused" || inp.stage === "ignored";

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
        {showExample ? <RefundExample today={today} /> : null}
      </div>

      {/* ---- What went wrong ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="refund-what" className={`block ${eyebrow} mb-2`}>
          What is it?
        </label>
        <input
          id="refund-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. the washing machine"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <label htmlFor="refund-seller" className="block mt-4 text-sm text-[var(--foreground)] mb-2">
          Who did you buy it from? <span className="text-[var(--muted)]">(optional)</span>
        </label>
        <input
          id="refund-seller"
          type="text"
          value={inp.seller}
          onChange={(e) => set("seller", e.target.value)}
          placeholder="e.g. the shop, the builder, the seller's name"
          className={inputClass}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What&rsquo;s wrong?</p>
        <Chips<Problem>
          label="What's wrong"
          value={inp.problem}
          onPick={(v) => set("problem", v)}
          options={[
            { id: "faulty", label: "It's broken, or stopped working" },
            { id: "described", label: "It's not what was described, or the wrong thing" },
            { id: "missing", label: "It never arrived" },
            { id: "service", label: "A job was done badly: a repair, a builder, a clean" },
            { id: "mind", label: "Nothing's wrong; I've changed my mind" },
          ]}
        />
      </div>

      {/* ---- How you bought it ---- */}
      <div className={card}>
        <p className={eyebrow}>How you bought it</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Where from?</p>
        <Chips<Where>
          label="Where you bought it"
          value={inp.where}
          onPick={(v) => set("where", v)}
          cols={1}
          options={[
            { id: "online", label: "A business, online, by phone or by post" },
            { id: "shop", label: "A business, in person: a shop, or a trader at my home" },
            { id: "private", label: "A private person: a marketplace listing, a neighbour" },
          ]}
        />
        <label htmlFor="refund-got" className="block mt-5 text-sm text-[var(--foreground)] mb-2">
          {gotLabel(inp.problem)}
        </label>
        <input
          id="refund-got"
          type="date"
          value={inp.got}
          max={today}
          onChange={(e) => set("got", e.target.value)}
          className={`${inputClass} sm:max-w-[14rem]`}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          Roughly is fine. It decides which of your rights apply: the first
          30 days, the first six months, or up to six years.
        </p>
        {!mind ? (
          <>
            <label htmlFor="refund-price" className="block mt-5 text-sm text-[var(--foreground)] mb-2">
              What did it cost?
            </label>
            <input
              id="refund-price"
              type="text"
              inputMode="decimal"
              value={inp.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="e.g. £449"
              aria-invalid={moneyInvalid(inp.price)}
              className={`${inputClass} sm:max-w-[14rem]`}
            />
            {moneyInvalid(inp.price) ? (
              <p className="mt-1.5 text-xs text-[var(--muted)]">
                Couldn&rsquo;t read that as an amount. Try something like £449.
              </p>
            ) : null}
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How did you pay?</p>
            <Chips<Paid>
              label="How you paid"
              value={inp.paid}
              onPick={(v) => set("paid", v)}
              options={[
                { id: "credit", label: "Credit card (even just the deposit)" },
                { id: "debit", label: "Debit card" },
                { id: "platform", label: "PayPal, Klarna, or a marketplace checkout" },
                { id: "transfer", label: "Bank transfer or cash" },
              ]}
            />
            {canFix ? (
              <button
                type="button"
                aria-pressed={inp.triedFix}
                onClick={() => set("triedFix", !inp.triedFix)}
                className={`mt-4 w-full ${chipBase} ${inp.triedFix ? chipOn : chipOff}`}
              >
                <span aria-hidden="true">{inp.triedFix ? "✓ " : ""}</span>
                {inp.problem === "service"
                  ? "They've already come back once to put it right, and it's still wrong"
                  : "They've already repaired or replaced it once, and it's still wrong"}
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      {/* ---- Where it's got to ---- */}
      {!mind ? (
        <div className={card}>
          <p className={eyebrow}>Where it&rsquo;s got to</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Have you asked them to put it right?</p>
          <Chips<Stage>
            label="Where it's got to"
            value={inp.stage}
            onPick={(v) => set("stage", v)}
            options={[
              { id: "none", label: "Not yet" },
              { id: "asked", label: "Yes, and I'm waiting" },
              { id: "refused", label: "Yes, and they said no, or offered less" },
              { id: "ignored", label: "Yes, and they've gone quiet" },
            ]}
          />
          {asked ? (
            <>
              <label htmlFor="refund-asked" className="block mt-4 text-sm text-[var(--foreground)] mb-2">
                When did you first ask? <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <input
                id="refund-asked"
                type="date"
                value={inp.askedOn}
                max={today}
                onChange={(e) => set("askedOn", e.target.value)}
                className={`${inputClass} sm:max-w-[14rem]`}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? refundHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say what&rsquo;s wrong, where you bought it, when, how you paid
            and whether you&rsquo;ve asked yet, and the read appears: what the
            law gives you, the message to send, the date to reply by, and the
            step after that.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_REFUND);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function MessageBox({
  title,
  note,
  text,
  copied,
  onCopy,
  id,
}: {
  title: string;
  note?: string;
  text: string;
  copied: boolean;
  onCopy: () => void;
  id: string;
}) {
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow} id={id}>{title}</p>
      {note ? <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{note}</p> : null}
      <pre
        aria-labelledby={id}
        className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]"
      >
        {text}
      </pre>
      <button type="button" onClick={onCopy} className={`mt-3 ${action}`}>
        {copied ? "Copied" : "Copy the message"}
      </button>
    </div>
  );
}

function ReadBlock({ inp, read }: { inp: RefundInputs; read: RefundRead }) {
  const [copied, setCopied] = useState<"" | "seller" | "card" | "line" | "all" | "no">("");
  const rule = refundRule();
  const seller = sellerMessage(inp, read);
  const cardText = cardMessage(inp, read);
  const dated =
    read.kind === "cancel"
      ? read.cancelBy
      : read.kind === "ask" || read.kind === "wait" || (read.kind === "escalate" && !cardText)
        ? read.replyBy
        : "";
  const sellerTitle =
    read.kind === "escalate"
      ? cardText
        ? "Or one last message to the seller"
        : "Your final letter to the seller"
      : read.kind === "wait"
        ? "The message you sent, or should have"
        : "Your message to the seller";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {refundHeadline(inp, read)}
      </p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{refundBody(inp, read)}</p>

      {cardText ? (
        <MessageBox
          id="refund-card-msg"
          title={read.route === "platform" ? "Your claim to the platform" : "Your message to the card company"}
          note="Send it through the app or the complaints page, and attach the receipt, your messages to the seller, and photos."
          text={cardText}
          copied={copied === "card"}
          onCopy={async () => setCopied((await copyText(cardText)) ? "card" : "no")}
        />
      ) : null}

      <MessageBox
        id="refund-seller-msg"
        title={sellerTitle}
        note={
          read.kind === "policy" || read.kind === "cancel"
            ? undefined
            : "Fill in the square brackets. Keep it short and calm: one problem, one remedy, one date. Send it by email or their complaints form so it's dated."
        }
        text={seller}
        copied={copied === "seller"}
        onCopy={async () => setCopied((await copyText(seller)) ? "seller" : "no")}
      />

      {dated && isISODate(dated) ? (
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-sm text-[var(--foreground)]">
            {read.kind === "cancel" ? "Last day to cancel: " : "Reply due: "}
            <span className="font-medium">{actDate(dated)}</span>
          </p>
          <button type="button" onClick={() => downloadDateIcs(inp, read)} className={action}>
            Add it to your calendar (.ics)
          </button>
        </div>
      ) : null}

      {read.kind !== "policy" && read.kind !== "cancel" ? <Ladder read={read} /> : null}

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        UK law; not legal advice. Keep the receipt, photos of the problem and
        every message. <strong className="font-medium">In the US</strong>,
        the rough equivalents: dispute a card charge in writing within 60
        days of the statement it first appeared on (the Fair Credit Billing
        Act), lean on the store&rsquo;s policy and the implied warranty that
        goods work, and use your state&rsquo;s small claims court.
      </p>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          The credit card half is decided at the till, long before anything
          goes wrong. If you pay it off in full each month, it costs nothing
          and adds a second company that has to answer for the purchase.
        </p>
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
            onClick={async () => setCopied((await copyText(refundSummary(inp, read))) ? "all" : "no")}
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
      <Handoffs inp={inp} read={read} />
    </div>
  );
}

function Ladder({ read }: { read: RefundRead }) {
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The ladder, decided in advance</p>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        A no, or silence, isn&rsquo;t the end. It&rsquo;s the signal to take
        the next rung.
      </p>
      <ol className="mt-3 space-y-3 text-sm leading-relaxed">
        {read.rungs.map((r, i) => (
          <li
            key={r.id}
            className={`pl-3 border-l-2 ${r.now ? "border-[var(--accent)]" : "border-[var(--border)]"}`}
          >
            <p className={r.now ? "font-medium text-[var(--accent)]" : "font-medium text-[var(--foreground)]"}>
              {i + 1}. {r.head}
              {r.now ? " ← you're here" : ""}
            </p>
            <p className="mt-1 text-[var(--muted)]">{r.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: RefundInputs; read: RefundRead }) {
  const s = inp.what;
  const list: Handoff[] = [];
  if (inp.problem === "faulty" && (read.kind === "old" || read.window === "late")) {
    list.push({
      href: withSubject("/fix", s),
      label: "If they won't help",
      note: "Then it's your repair bill or a new one: fix it or replace it?",
    });
  }
  if ((inp.paid === "transfer" || inp.where === "private") && (inp.problem === "missing" || inp.problem === "described")) {
    list.push({
      href: withSubject("/scam", s),
      label: "If the seller has vanished",
      note: "A bank transfer to someone who's stopped answering may not be a dispute at all. Check whether it was ever real, and what to do in the first hour.",
    });
  }
  if (inp.problem !== "mind" && inp.where !== "private") {
    list.push({
      href: withSubject("/cover", "an extended warranty"),
      label: "Next time they offer a warranty",
      note: "The law already covers faults that were there from the start, for up to six years. Decide whether the extra cover buys anything on top.",
    });
  }
  list.push({
    href: withSubject("/rule", s),
    label: "Make it a standing rule",
    note: "Credit card over £100, ask once in writing with a date, next step decided in advance. Decide it once.",
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
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        More on why this works:{" "}
        <Link href="/writing/ask-once-in-writing-with-a-date" className={link}>
          Ask once, in writing, with a date
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
function RefundExample({ today }: { today: string }) {
  const ex = refundExample(today);
  const read = readRefund(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I bought a £449 washing machine online, on my credit card. Four
        months later it stopped draining. The shop sent an engineer, who
        replaced a pump; two weeks later it stopped again. This time the shop
        said it was out of their hands and I should contact the
        manufacturer. I&rsquo;d have left it there.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {refundHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          My contract was with the shop, not the manufacturer, and a fault
          inside six months is presumed to have been there all along. They&rsquo;d
          had their one repair, so I was owed a refund. And because it cost
          over £100 on a credit card, I didn&rsquo;t need the shop to agree: I
          sent the section 75 message to my card company with the engineer&rsquo;s
          note and the shop&rsquo;s email. The refund came through in three
          weeks.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}problem.
      </p>
    </div>
  );
}
