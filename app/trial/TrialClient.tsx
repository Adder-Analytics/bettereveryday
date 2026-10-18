"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import ClearCallButton from "../components/ClearCallButton";
import CarriedNote from "../components/CarriedNote";
import RenewalCheck from "../components/RenewalCheck";
import { readCarriedSubject, clearCarriedSubject } from "../data/carry";
import { moneyInvalid } from "../data/worth";
import type { Period } from "../data/keep";
import {
  BLANK_DRAFT,
  TRIAL_EXAMPLE,
  addDaysISO,
  addMonthsISO,
  addRenewal,
  deleteRenewal,
  answerRenewal,
  expectNote,
  forgetCost,
  isISODate,
  loadRenewals,
  openTrials,
  prettyDate,
  priceText,
  readTrial,
  renewalCalendar,
  todayISO,
  trialHeadline,
  trialRecord,
  trialRecordText,
  trialRule,
  trialWhy,
  type Access,
  type Expect,
  type Renewal,
  type TrialDraft,
  type TrialRead,
} from "../data/renewals";

/**
 * Before the trial ends (/trial).
 *
 * A free trial is a subscription with its default already chosen: do nothing
 * and it becomes a payment. The tool changes the default at the moment you
 * sign up, which is the only moment it's cheap to change. If cancelling keeps
 * the free time, it says cancel today. If not, it works out the cancel-by date
 * (two days before the first charge), puts it on the return desk and in your
 * calendar, and on the day asks the fresh-start question with the price in it.
 *
 * The read lives in `app/data/renewals.ts` so it can be checked by a script.
 * The draft persists under `trial:v1`; the dated list under `renewals:v1`.
 * Nothing is sent anywhere.
 */

const STORE_KEY = "trial:v1";

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

const PERIODS: Period[] = ["month", "year", "week"];
const ACCESS: Access[] = ["keeps", "ends", "unsure"];
const EXPECTS: Expect[] = ["pay", "not", "unsure"];

function parseDraft(raw: unknown): TrialDraft {
  if (!raw || typeof raw !== "object") return BLANK_DRAFT;
  const v = raw as Record<string, unknown>;
  const str = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const one = <T extends string>(k: string, list: T[], fb: T): T =>
    (list as string[]).includes(str(k)) ? (str(k) as T) : fb;
  return {
    name: str("name"),
    price: str("price"),
    period: one<Period>("period", PERIODS, "month"),
    chargeOn: isISODate(str("chargeOn")) ? str("chargeOn") : "",
    access: one<Access>("access", ACCESS, ""),
    expect: one<Expect>("expect", EXPECTS, ""),
  };
}

function loadDraft(): TrialDraft {
  if (typeof window === "undefined") return BLANK_DRAFT;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseDraft(JSON.parse(raw)) : BLANK_DRAFT;
  } catch {
    return BLANK_DRAFT;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadCalendar(r: Renewal): void {
  const text = renewalCalendar(r);
  if (!text) return;
  const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cancel-by-${r.checkOn}.ics`;
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
}: {
  value: T;
  options: { id: T; label: string }[];
  onPick: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onPick(value === o.id ? ("" as T) : o.id)}
          className={`${chipBase} ${value === o.id ? chipOn : chipOff}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function TrialClient() {
  const [d, setD] = useState<TrialDraft>(BLANK_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [today, setToday] = useState("");
  // Bumped whenever the dated list changes, so the list and record re-read.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const loaded = loadDraft();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.name.trim();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage and the URL; intentionally synchronous on mount. */
    setD(seeded ? { ...loaded, name: carried } : loaded);
    setToday(todayISO());
    setHydrated(true);
    if (seeded) setCarriedSeed(carried);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (carried) clearCarriedSubject();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(d));
    } catch {
      /* storage full or blocked — the tool still works, just won't persist */
    }
  }, [d, hydrated]);

  const set = <K extends keyof TrialDraft>(k: K, v: TrialDraft[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => (today ? readTrial(d, today) : null), [d, today]);
  const headline = read ? trialHeadline(read) : null;

  return (
    <div>
      <RenewalCheck onAnswered={() => setVersion((v) => v + 1)} />

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
        {showExample ? <TrialExample /> : null}
      </div>

      {/* ---- The trial ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="trial-name" className={eyebrow}>
          The free trial
        </label>
        <input
          id="trial-name"
          type="text"
          value={d.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Language app"
          className={`mt-2 ${inputClass}`}
        />
        <CarriedNote
          show={carriedSeed !== "" && d.name.trim() === carriedSeed}
          onClear={() => {
            set("name", "");
            setCarriedSeed("");
          }}
        />

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="trial-price" className="block text-sm text-[var(--muted)] mb-1.5">
              What it turns into
            </label>
            <input
              id="trial-price"
              type="text"
              inputMode="decimal"
              value={d.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="e.g. £12.99"
              aria-invalid={moneyInvalid(d.price) || undefined}
              aria-describedby={moneyInvalid(d.price) ? "trial-price-bad" : undefined}
              className={inputClass}
            />
            {moneyInvalid(d.price) ? (
              <p id="trial-price-bad" className="mt-1.5 text-xs text-[var(--muted)]">
                Type an amount, like 12.99 or £79.
              </p>
            ) : null}
          </div>
          <div>
            <p className="block text-sm text-[var(--muted)] mb-1.5">Charged</p>
            <Chips<Period>
              label="Charged"
              value={d.period}
              onPick={(v) => set("period", v || "month")}
              options={[
                { id: "month", label: "Monthly" },
                { id: "year", label: "Yearly" },
                { id: "week", label: "Weekly" },
              ]}
            />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm text-[var(--foreground)] mb-2">When does the first payment come out?</p>
          <div className="flex flex-wrap items-center gap-2">
            {today
              ? [
                  { label: "In 7 days", iso: addDaysISO(today, 7) },
                  { label: "In 14 days", iso: addDaysISO(today, 14) },
                  { label: "In a month", iso: addMonthsISO(today, 1) },
                  { label: "In 3 months", iso: addMonthsISO(today, 3) },
                ].map(({ label, iso }) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={d.chargeOn === iso}
                    onClick={() => set("chargeOn", iso)}
                    className={`${chipBase} ${d.chargeOn === iso ? chipOn : chipOff}`}
                  >
                    {label}
                  </button>
                ))
              : null}
            <input
              type="date"
              aria-label="The date of the first payment"
              value={d.chargeOn}
              onChange={(e) => set("chargeOn", e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            The sign-up page or the confirmation email gives the date. If it
            only says &ldquo;14 days&rdquo;, count from today.
          </p>
        </div>

        <div className="mt-5">
          <p className="text-sm text-[var(--foreground)] mb-2">If you cancelled today, would you keep the free time?</p>
          <Chips<Access>
            label="If you cancelled today, would you keep the free time?"
            value={d.access}
            onPick={(v) => set("access", v)}
            options={[
              { id: "keeps", label: "Yes, it runs to the end" },
              { id: "ends", label: "No, it ends at once" },
              { id: "unsure", label: "I don't know" },
            ]}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            It varies. Many services let you cancel and keep the rest of the
            trial; app-store trials on phones often end the moment you cancel.
            The cancel screen usually says before you confirm.
          </p>
        </div>

        <div className="mt-5">
          <p className="text-sm text-[var(--foreground)] mb-2">
            Before you&rsquo;ve used it: do you expect to pay for it afterwards?{" "}
            <span className="text-[var(--muted)]">(optional)</span>
          </p>
          <Chips<Expect>
            label="Do you expect to pay for it afterwards?"
            value={d.expect}
            onPick={(v) => set("expect", v)}
            options={[
              { id: "pay", label: "Probably" },
              { id: "not", label: "Probably not" },
              { id: "unsure", label: "No idea" },
            ]}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            A guess now, kept, so you can see later how your guesses about
            trials turn out.
          </p>
        </div>
      </div>

      {/* ---- The read ---- */}
      <AnnounceAnswer message={headline} />
      {read && headline ? (
        <ReadBlock
          d={d}
          read={read}
          headline={headline}
          onSaved={() => setVersion((v) => v + 1)}
        />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give the date of the first payment and the answer appears: cancel
            today, or the date to cancel by, and what forgetting would cost.
          </p>
        </div>
      )}

      <Holding version={version} onChange={() => setVersion((v) => v + 1)} />

      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setD(BLANK_DRAFT);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function ReadBlock({
  d,
  read,
  headline,
  onSaved,
}: {
  d: TrialDraft;
  read: TrialRead;
  headline: string;
  onSaved: () => void;
}) {
  const [saved, setSaved] = useState<Renewal | null>(null);
  const [copied, setCopied] = useState<"" | "yes" | "no">("");
  const confirm = useRef<HTMLParagraphElement>(null);
  const cost = forgetCost(d, read);
  const note = expectNote(d);
  const rule = trialRule();

  // A changed trial is a new one: forget the saved confirmation.
  const key = `${d.name}|${d.price}|${d.period}|${d.chargeOn}|${d.access}`;
  const [savedKey, setSavedKey] = useState("");
  const current = saved && savedKey === key ? saved : null;

  useEffect(() => {
    if (current) confirm.current?.focus();
  }, [current]);

  const save = (cancelledNow: boolean) => {
    const r = addRenewal({
      kind: "trial",
      name: d.name,
      price: d.price,
      period: d.period,
      chargeOn: d.chargeOn,
      checkOn: read.cancelBy,
      access: d.access,
      expect: d.expect,
      outcome: cancelledNow ? "cancelled" : undefined,
    });
    setSaved(r);
    setSavedKey(key);
    onSaved();
  };

  const canDate = read.kind === "date" || read.kind === "now";

  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The answer</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{headline}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{trialWhy(d, read)}</p>
      {cost ? <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">{cost}</p> : null}
      {note ? <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">{note}</p> : null}
      {read.kind !== "past" && read.daysLeft > 0 ? <DateBar read={read} /> : null}

      {/* ---- Make it happen ---- */}
      <div className="mt-5 pt-5 border-t border-[var(--border)]">
        {current ? (
          <div>
            <p
              ref={confirm}
              tabIndex={-1}
              className="text-sm text-[var(--foreground)] leading-relaxed focus:outline-none"
            >
              {current.outcome === "cancelled" ? (
                <>
                  Logged as cancelled on day one. Nothing will renew, and it
                  counts towards your record below.
                </>
              ) : (
                <>
                  On your{" "}
                  <Link href="/review" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
                    return desk
                  </Link>{" "}
                  for <span className="font-medium">{prettyDate(current.checkOn)}</span>, with the
                  question waiting. Put it in your calendar too: the desk only
                  helps if you open it.
                </>
              )}
            </p>
            {current.outcome !== "cancelled" ? (
              <button
                type="button"
                onClick={() => downloadCalendar(current)}
                className="mt-3 rounded-lg px-4 py-2 text-sm font-medium bg-[var(--accent)] text-[var(--background)] hover:opacity-80 transition-opacity"
              >
                Add it to your calendar
              </button>
            ) : null}
          </div>
        ) : read.kind === "now" ? (
          <div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Cancel it now, then log it here, so your record of trials is
              complete. Can&rsquo;t cancel yet (the account isn&rsquo;t set up)?
              Date it instead.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => save(true)}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-[var(--accent)] text-[var(--background)] hover:opacity-80 transition-opacity"
              >
                I&rsquo;ve cancelled it
              </button>
              <button
                type="button"
                onClick={() => save(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium border border-[var(--accent)] text-[var(--accent)] hover:opacity-80 transition-opacity"
              >
                Date it for {prettyDate(read.cancelBy)}
              </button>
            </div>
          </div>
        ) : canDate ? (
          <div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Do it now, before the trial starts: once it&rsquo;s running, the
              default is already working.
            </p>
            <button
              type="button"
              onClick={() => save(false)}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-medium bg-[var(--accent)] text-[var(--background)] hover:opacity-80 transition-opacity"
            >
              Put {prettyDate(read.cancelBy)} on the return desk
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <button
          type="button"
          onClick={async () => setCopied((await copyText(rule)) ? "yes" : "no")}
          className="mt-3 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {copied === "yes" ? "Copied your line" : "Copy your line"}
        </button>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">Couldn&rsquo;t copy. Select the line above instead.</p>
        ) : null}
      </div>

      <div className="mt-5 pt-5 border-t border-[var(--border)]">
        <p className={eyebrow}>Where to take it next</p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link href="/keep" className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium">
              The ones already running →
            </Link>{" "}
            Trials you didn&rsquo;t catch are subscriptions now. Ask each one
            whether you&rsquo;d sign up today, at this price.
          </li>
          <li>
            <Link href="/rule" className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium">
              Make it a standing rule →
            </Link>{" "}
            The next trial is already on its way. Decide once what happens at
            sign-up, so you don&rsquo;t decide it fresh each time.
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Today, the cancel-by date and the first charge on one line. A picture of the
 * sentence above it, so it's hidden from screen readers.
 */
function DateBar({ read }: { read: TrialRead }) {
  const span = Math.max(1, read.daysLeft);
  const byDays = Math.max(0, read.daysLeft - 2);
  const pct = Math.min(100, (byDays / span) * 100);
  return (
    <div className="mt-5" aria-hidden="true">
      <div className="relative h-2 rounded-full bg-[var(--border)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] opacity-40"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute -top-1 h-4 w-0.5 bg-[var(--accent)]"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-xs text-[var(--muted)]">
        <span>today</span>
        <span>{read.kind === "now" ? "cancel today" : `cancel by, ${read.daysLeft - byDays} days early`}</span>
        <span>first charge</span>
      </div>
    </div>
  );
}

/** The trials this browser is holding, and your record with them. */
function Holding({ version, onChange }: { version: number; onChange: () => void }) {
  const [list, setList] = useState<Renewal[]>([]);
  const [recordText, setRecordText] = useState<string | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- read from browser
       storage after mount and after each change; can't run in render. */
    setList(openTrials());
    setRecordText(trialRecordText(trialRecord(loadRenewals())));
    setToday(todayISO());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [version]);

  if (list.length === 0 && !recordText) return null;

  return (
    <div className={card}>
      <p className={eyebrow}>The trials you&rsquo;re tracking</p>
      {list.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {list.map((r) => {
            const due = r.checkOn <= today;
            const price = priceText(r.price, r.period);
            return (
              <li key={r.id} className="text-sm leading-relaxed">
                <p className="text-[var(--foreground)]">
                  <span className="font-medium">{r.name.trim() || "A free trial"}</span>
                  {price ? <span className="text-[var(--muted)]"> · becomes {price}</span> : null}
                </p>
                <p className="text-[var(--muted)]">
                  {due ? "Cancel-by date is here: " : "Cancel by "}
                  {prettyDate(r.checkOn)}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {due ? (
                    <a
                      href={`/trial?check=${encodeURIComponent(r.id)}`}
                      className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
                    >
                      Answer it now →
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      answerRenewal(r.id, "cancelled");
                      onChange();
                    }}
                    className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                  >
                    Cancelled it already
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadCalendar(r)}
                    className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Calendar file
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteRenewal(r.id);
                      onChange();
                    }}
                    aria-label={`Remove ${r.name.trim() || "this trial"}`}
                    className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {recordText ? (
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">{recordText}</p>
      ) : null}
    </div>
  );
}

/**
 * The worked example, read-only, on fixed dates so it reads the same every
 * day. Runs the same read the live tool does.
 */
function TrialExample() {
  const { today, draft } = TRIAL_EXAMPLE;
  const read = readTrial(draft, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        On a Sunday in October I started a 14-day trial of a language app. It
        becomes {priceText(draft.price, draft.period)} on {prettyDate(draft.chargeOn)}. The
        cancel screen said cancelling would end the trial at once, so cancelling
        on day one wasn&rsquo;t an option. I was fairly sure I&rsquo;d keep it:
        I&rsquo;d been meaning to learn Spanish for years.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The answer</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {trialHeadline(read)}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{forgetCost(draft, read)}</p>
      </div>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        The reminder came up on the morning of {prettyDate(read.cancelBy)}, with the question in it:
        would I sign up today, at £12.99 a month, for the use I&rsquo;d actually
        had? I&rsquo;d done four lessons in the first three days and none since.
        I cancelled it before lunch. I&rsquo;d guessed I&rsquo;d keep it, and
        that guess is now on my record too.
      </p>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own trial below is untouched.
      </p>
    </div>
  );
}
