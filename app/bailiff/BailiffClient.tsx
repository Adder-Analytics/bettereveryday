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
  BLANK_BAILIFF,
  actDate,
  bailiffBody,
  bailiffExample,
  bailiffHeadline,
  bailiffRule,
  bailiffSummary,
  evidenceLines,
  feesTotal,
  isISODate,
  letterDate,
  mainLetter,
  money,
  parseBailiffInputs,
  powersLines,
  readBailiff,
  remindersOf,
  todayISO,
  type BailiffInputs,
  type BailiffKind,
  type BailiffRead,
  type BailiffRegion,
  type BailiffStage,
  type CanPay,
  type CourtOfficer,
  type Vulnerable,
} from "../data/bailiff";

/**
 * A bailiff's letter: what can they actually do? (/bailiff)
 *
 * The instrument for a notice of enforcement, a bailiff at the door, or a
 * debt collector's letter that talks like one. The call turns on the stage
 * you're at: each stage adds a fixed fee and closes a door the last one left
 * open, so the tool dates the next step, prices it, says what a bailiff can
 * and can't do there, and writes the offer to send before it.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/bailiff.ts` so it can be checked without a browser.
 */

const STORE_KEY = "bailiff:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £640.";

function loadInputs(): BailiffInputs {
  if (typeof window === "undefined") return BLANK_BAILIFF;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseBailiffInputs(JSON.parse(raw)) : BLANK_BAILIFF;
  } catch {
    return BLANK_BAILIFF;
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

function downloadIcs(inp: BailiffInputs, list: { on: string; title: string; body: string }[]): void {
  const what = inp.what.trim();
  const p = (n: number) => String(n).padStart(2, "0");
  const events = list
    .filter((r) => isISODate(r.on))
    .map((r) => {
      const day = r.on.replace(/-/g, "");
      const [y, m, d] = r.on.split("-").map(Number);
      const next = new Date(y, m - 1, d + 1);
      const end = `${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`;
      return [
        "BEGIN:VEVENT",
        `UID:bailiff-${todayISO()}-${r.on}-${r.title.length}@bettereveryday`,
        `DTSTAMP:${icsStamp()}`,
        `DTSTART;VALUE=DATE:${day}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(what ? `${r.title} (${what})` : r.title)}`,
        `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/bailiff`)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P3D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(r.title)}`,
        "END:VALARM",
        "END:VEVENT",
      ];
    });
  if (!events.length) return;
  const blob = new Blob([wrapCalendar(events, "Bailiff's letter")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bailiff-${list[list.length - 1].on}.ics`;
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

export default function BailiffClient() {
  const [inp, setInp] = useState<BailiffInputs>(BLANK_BAILIFF);
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

  const set = <K extends keyof BailiffInputs>(k: K, v: BailiffInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readBailiff(inp, today), [inp, today]);
  const inEngland = inp.region === "ew";
  const courtOrder = inEngland && inp.kind !== "" && inp.kind !== "private";
  const withBailiffs = inp.stage !== "" && inp.stage !== "before";

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
        {showExample ? <BailiffExample today={today} /> : null}
      </div>

      {/* ---- The debt ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="bailiff-what" className={`block ${eyebrow} mb-2`}>
          What&rsquo;s it about?
        </label>
        <input
          id="bailiff-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. last year's council tax"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where do you live?</p>
        <Chips<BailiffRegion>
          label="Where you live"
          value={inp.region}
          onPick={(v) => set("region", v)}
          options={[
            { id: "ew", label: "England or Wales" },
            { id: "scot", label: "Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        {inEngland ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">What&rsquo;s the debt?</p>
            <Chips<BailiffKind>
              label="What the debt is"
              value={inp.kind}
              onPick={(v) => set("kind", v)}
              cols={1}
              options={[
                { id: "council", label: "Council tax or business rates" },
                { id: "parking", label: "A council parking, bus lane or congestion charge" },
                { id: "fine", label: "A fine from a magistrates' court" },
                { id: "ccj", label: "A county court judgment (CCJ)" },
                { id: "hmrc", label: "Tax owed to HMRC" },
                { id: "private", label: "A card, loan, phone or energy bill, or a private parking charge, with no court judgment" },
                { id: "unsure", label: "I'm not sure" },
              ]}
            />
            {inp.kind === "ccj" ? (
              <>
                <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Who&rsquo;s enforcing it?</p>
                <Chips<CourtOfficer>
                  label="Who is enforcing the judgment"
                  value={inp.officer}
                  onPick={(v) => set("officer", v)}
                  cols={1}
                  options={[
                    { id: "county", label: "The county court's own bailiffs (a warrant of control)" },
                    { id: "high", label: "A High Court enforcement officer (a writ of control)" },
                    { id: "unsure", label: "Not sure" },
                  ]}
                />
                <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                  The letter will say. A High Court officer works for a
                  private firm and charges higher fees.
                </p>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {/* ---- Where it's got to ---- */}
      {courtOrder && (inp.kind !== "ccj" || inp.officer) ? (
        <div className={card}>
          <p className={eyebrow}>Where it&rsquo;s got to</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">What&rsquo;s happened so far?</p>
          <Chips<BailiffStage>
            label="What has happened so far"
            value={inp.stage}
            onPick={(v) => set("stage", v)}
            cols={1}
            options={[
              { id: "before", label: "A letter saying it will be passed to bailiffs (nothing from them yet)" },
              { id: "notice", label: "A “notice of enforcement” from the bailiffs" },
              { id: "visited", label: "A bailiff has been to the house" },
              { id: "cga", label: "I signed a “controlled goods agreement” to pay in instalments" },
              { id: "removed", label: "They've taken something, or sent a notice of sale" },
            ]}
          />
          {withBailiffs ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bailiff-notice-on" className="block text-sm text-[var(--foreground)] mb-2">
                  Date on the notice of enforcement
                  {inp.stage !== "notice" ? <span className="text-[var(--muted)]"> (if you have it)</span> : null}
                </label>
                <input
                  id="bailiff-notice-on"
                  type="date"
                  value={inp.noticeOn}
                  max={today}
                  onChange={(e) => set("noticeOn", e.target.value)}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                  It sets the notice period and which fee scale applies (the
                  rules changed on 1 May 2026).
                </p>
              </div>
              <div>
                <label htmlFor="bailiff-amount" className="block text-sm text-[var(--foreground)] mb-2">
                  The debt, before their fees <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  id="bailiff-amount"
                  type="text"
                  inputMode="decimal"
                  value={inp.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  placeholder="e.g. £640"
                  aria-invalid={moneyInvalid(inp.amount)}
                  className={inputClass}
                />
                {moneyInvalid(inp.amount) ? <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p> : null}
              </div>
            </div>
          ) : null}
          {inp.stage ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {withBailiffs ? (
                <div>
                  <label htmlFor="bailiff-who" className="block text-sm text-[var(--foreground)] mb-2">
                    The bailiff firm <span className="text-[var(--muted)]">(optional)</span>
                  </label>
                  <input
                    id="bailiff-who"
                    type="text"
                    value={inp.who}
                    onChange={(e) => set("who", e.target.value)}
                    placeholder="The name on the notice"
                    className={inputClass}
                  />
                </div>
              ) : null}
              <div>
                <label htmlFor="bailiff-creditor" className="block text-sm text-[var(--foreground)] mb-2">
                  Who&rsquo;s owed <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  id="bailiff-creditor"
                  type="text"
                  value={inp.creditor}
                  onChange={(e) => set("creditor", e.target.value)}
                  placeholder="e.g. Leeds City Council"
                  className={inputClass}
                />
              </div>
            </div>
          ) : null}

          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Could you pay it?</p>
          <Chips<CanPay>
            label="Whether you could pay it"
            value={inp.canPay}
            onPick={(v) => set("canPay", v)}
            cols={1}
            options={[
              { id: "all", label: "Yes, all of it, without missing rent or bills" },
              { id: "plan", label: "In instalments I could keep to" },
              { id: "none", label: "Not at the moment" },
            ]}
          />
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            Is anything making this harder: illness or disability, mental
            health, a bereavement, pregnancy, caring alone for young children,
            trouble with English or reading?
          </p>
          <Chips<Vulnerable>
            label="Whether anything is making this harder"
            value={inp.vulnerable}
            onPick={(v) => set("vulnerable", v)}
            options={[
              { id: "yes", label: "Yes" },
              { id: "no", label: "No" },
            ]}
          />
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? bailiffHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where you live, what the debt is and what&rsquo;s happened so
            far. The read appears: what a bailiff can and can&rsquo;t do at
            this stage, the fees that should be on it, the first day they can
            call, and the letter to send before then.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_BAILIFF);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

/** The fee ladder: what's on it now, and what the next step adds. */
function Fees({ read }: { read: BailiffRead }) {
  if (!read.feesSoFar.length) return null;
  const total = feesTotal(read);
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>The fees, on the legal scale</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {read.feesSoFar.map((f) => (
          <li key={f.label} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--foreground)]">{f.label}</span>
              {f.note ? <span className="block text-xs text-[var(--muted)]">{f.note}</span> : null}
            </span>
            <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">{money(f.amount)}</span>
          </li>
        ))}
        <li className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
          <span className="text-[var(--foreground)] font-medium">Should be on it now</span>
          <span className="shrink-0 font-semibold text-[var(--foreground)] tabular-nums">{money(total)}</span>
        </li>
        {read.nextFee ? (
          <li className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--muted)]">Next: {read.nextFee.label.toLowerCase()}</span>
              {read.nextFee.note ? <span className="block text-xs text-[var(--muted)]">{read.nextFee.note}</span> : null}
            </span>
            <span className="shrink-0 text-[var(--muted)] tabular-nums">+{money(read.nextFee.amount)}</span>
          </li>
        ) : null}
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        {read.newRules
          ? "The scale from 1 May 2026."
          : "The scale before 1 May 2026, which still applies to cases that started then."}{" "}
        Each fee can only be charged once that stage has really happened, and
        nothing else can be added on top. If what they ask for is more, ask
        for a breakdown.
      </p>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: BailiffInputs; read: BailiffRead; today: string }) {
  const [copied, setCopied] = useState<"" | "main" | "line" | "all" | "no">("");
  const rule = bailiffRule();
  const main = mainLetter(inp, read);
  const reminders = remindersOf(read, today);
  const powers = powersLines(inp, read);
  const evidence = evidenceLines(inp, read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {bailiffHeadline(inp, read)}
      </p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{bailiffBody(inp, read)}</p>

      {read.status === "notice" && read.visitFrom && !read.visitOpen ? (
        <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
          <p className={eyebrow}>The first day a bailiff can call</p>
          <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{actDate(read.visitFrom)}</p>
          {read.newRules && read.adviserBy ? (
            <p className="mt-1 text-sm text-[var(--muted)]">
              For 28 days instead, a debt adviser must ask by {actDate(read.adviserBy)}.
            </p>
          ) : null}
          {reminders.length ? (
            <button type="button" onClick={() => downloadIcs(inp, reminders)} className={`mt-2 ${action}`}>
              Add {reminders.length === 1 ? "it" : "both dates"} to your calendar (.ics)
            </button>
          ) : null}
        </div>
      ) : null}

      <Fees read={read} />

      {powers.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>What they can and can&rsquo;t do</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {powers.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {main ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow} id="bailiff-main-msg">{main.title}</p>
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{main.note}</p>
          <pre
            aria-labelledby="bailiff-main-msg"
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

      {evidence.length ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>What to keep together</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {evidence.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {read.status !== "elsewhere" && read.status !== "collector" ? (
        <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
          If a bailiff behaves badly (threats, entering when they
          shouldn&rsquo;t, wrong fees), complain to the firm first, then to
          whoever&rsquo;s owed; for a council, the Local Government and Social
          Care Ombudsman after that. The Enforcement Conduct Board also takes
          complaints about firms it oversees, and you can complain about an
          individual bailiff to the county court on form EAC2.
        </p>
      ) : null}

      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. Free, confidential debt advice: National Debtline,
        StepChange and Citizens Advice in England, Wales and Scotland, and
        Advice NI in Northern Ireland. They can write to the bailiffs for you,
        ask for the 28-day extension, and apply for Breathing Space. Be wary
        of anyone who charges to &ldquo;stop the bailiffs&rdquo;.
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
            onClick={async () => setCopied((await copyText(bailiffSummary(inp, read))) ? "all" : "no")}
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

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: BailiffInputs; read: BailiffRead }) {
  const list: Handoff[] = [];
  if (read.status === "collector")
    list.push({
      href: withSubject("/collector", inp.what),
      label: "Is the debt years old?",
      note: "Check whether it's past the six-year limit before you pay anything.",
    });
  if (inp.kind === "parking")
    list.push({
      href: withSubject("/parking", inp.what),
      label: "Never got the parking notices?",
      note: "The parking tool covers form TE9 and every earlier stage.",
    });
  list.push({
    href: withSubject("/scam", inp.what),
    label: "Not sure the letter or caller is real?",
    note: "Check it before you pay into an account it gives. Ring the council or court on a number you find yourself.",
  });
  list.push({
    href: withSubject("/debts", inp.what),
    label: "Other debts as well?",
    note: "Council tax and fines come first, because of what can follow. Put the rest side by side.",
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
        <Link href="/writing/the-fee-schedule-is-a-clock" className={link}>
          The fee schedule is a clock
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
function BailiffExample({ today }: { today: string }) {
  const ex = bailiffExample(today);
  const read = readBailiff(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I fell behind on council tax when my hours were cut, and stopped
        opening the council&rsquo;s letters. Then a &ldquo;notice of
        enforcement&rdquo; came from a firm I&rsquo;d never heard of, dated{" "}
        {letterDate(ex.noticeOn)}: £640, plus £79 already, and a bailiff
        &ldquo;will attend&rdquo;. I couldn&rsquo;t pay it all, so I put it
        back in the drawer.
      </p>
      <Fees read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {bailiffHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The drawer was the expensive choice: a visit would have added £247,
          more than a third of the debt. I emailed the firm an offer of £60 a
          month with a budget attached, copied to the council, the same day.
          They accepted it in writing, and nobody came.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}letter.
      </p>
    </div>
  );
}
