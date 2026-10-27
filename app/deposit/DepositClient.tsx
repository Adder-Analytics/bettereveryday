"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import { formatMoney, moneyInvalid } from "../data/worth";
import {
  BLANK_DEPOSIT,
  BLANK_ITEM,
  MAX_ITEMS,
  actDate,
  depositBody,
  depositExample,
  depositHeadline,
  depositRule,
  depositSummary,
  disputeMessage,
  evidenceLines,
  isISODate,
  itemNeedsAge,
  mainMessage,
  parseDepositInputs,
  readDeposit,
  schemeName,
  schemesFor,
  todayISO,
  type DepositInputs,
  type DepositItem,
  type DepositRead,
  type Inventory,
  type ItemKind,
  type ItemRead,
  type Nation,
  type Protection,
  type RentPer,
  type Scheme,
  type Stage,
  type View,
} from "../data/deposit";

/**
 * Get your deposit back (/deposit)
 *
 * The instrument for the list of deductions that arrives after you've handed
 * back the keys. The landlord has to justify each one; fair wear and tear and
 * betterment aren't chargeable; a replacement is apportioned by the life the
 * old item had left; and the free dispute service closes about three months
 * after the tenancy ends. So the tool prices each line the way an adjudicator
 * would, writes the reply, and dates the last day to raise the dispute.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/deposit.ts` so it can be checked without a browser.
 */

const STORE_KEY = "deposit:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £450.";

function money(n: number): string {
  return formatMoney(n, "£");
}

function loadInputs(): DepositInputs {
  if (typeof window === "undefined") return BLANK_DEPOSIT;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseDepositInputs(JSON.parse(raw)) : BLANK_DEPOSIT;
  } catch {
    return BLANK_DEPOSIT;
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

/** The day to act on, as one all-day event. */
function remindOn(read: DepositRead, today: string): { on: string; title: string; body: string } | null {
  const deadline = read.disputeBy || read.tribunalBy;
  if (read.replyBy && (!deadline || read.replyBy < deadline) && read.kind !== "unprotected" && read.kind !== "late" && read.kind !== "agreed") {
    return {
      on: read.replyBy,
      title: "Deposit: has the landlord replied?",
      body: `If there's no agreement, raise the dispute with the scheme.${deadline ? ` The last day is ${actDate(deadline)}.` : ""}`,
    };
  }
  if (deadline && deadline >= today) {
    return {
      on: deadline,
      title: read.tribunalBy ? "Deposit: last day to apply to the tribunal" : "Deposit: last day to raise the dispute",
      body: read.tribunalBy ? "Apply to the First-tier Tribunal today if it isn't settled." : "Raise the dispute with the scheme today if it isn't settled.",
    };
  }
  return null;
}

function downloadIcs(inp: DepositInputs, r: { on: string; title: string; body: string }): void {
  if (!isISODate(r.on)) return;
  const what = inp.what.trim();
  const day = r.on.replace(/-/g, "");
  const [y, m, d] = r.on.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  const end = `${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`;
  const event = [
    "BEGIN:VEVENT",
    `UID:deposit-${todayISO()}-${r.on}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(what ? `${r.title} (${what})` : r.title)}`,
    `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/deposit`)}`,
    "END:VEVENT",
  ];
  const blob = new Blob([wrapCalendar([event], "Deposit")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `deposit-${r.on}.ics`;
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

const KIND_OPTIONS: { id: ItemKind; label: string }[] = [
  { id: "clean", label: "Cleaning" },
  { id: "damage", label: "Damage or a breakage" },
  { id: "wear", label: "Marks, scuffs, fading, hook holes, worn patches" },
  { id: "replace", label: "Replacing something: a carpet, sofa, mattress, appliance" },
  { id: "redecorate", label: "Repainting or redecorating" },
  { id: "rent", label: "Rent or bills owed" },
  { id: "other", label: "Something else" },
];

const VIEW_OPTIONS: { id: View; label: string }[] = [
  { id: "fair", label: "Fair" },
  { id: "much", label: "Too much" },
  { id: "not", label: "Not mine to pay" },
];

export default function DepositClient() {
  const [inp, setInp] = useState<DepositInputs>(BLANK_DEPOSIT);
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

  const set = <K extends keyof DepositInputs>(k: K, v: DepositInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));
  const setItem = <K extends keyof DepositItem>(i: number, k: K, v: DepositItem[K]) =>
    setInp((prev) => ({ ...prev, items: prev.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) }));
  const addItem = () =>
    setInp((prev) => (prev.items.length >= MAX_ITEMS ? prev : { ...prev, items: [...prev.items, BLANK_ITEM] }));
  const removeItem = (i: number) => setInp((prev) => ({ ...prev, items: prev.items.filter((_, j) => j !== i) }));

  const read = useMemo(() => readDeposit(inp, today), [inp, today]);
  const movedOut = inp.stage !== "" && inp.stage !== "living";
  const listing = inp.stage === "proposed" || inp.stage === "stuck";
  const items = listing && inp.items.length === 0 ? [BLANK_ITEM] : inp.items;

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
        {showExample ? <DepositExample today={today} /> : null}
      </div>

      {/* ---- The tenancy ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="deposit-what" className={`block ${eyebrow} mb-2`}>
          Which place?
        </label>
        <input
          id="deposit-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. the flat on Elm Road"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <label htmlFor="deposit-landlord" className="block mt-4 text-sm text-[var(--foreground)] mb-2">
          Landlord or agent <span className="text-[var(--muted)]">(optional)</span>
        </label>
        <input
          id="deposit-landlord"
          type="text"
          value={inp.landlord}
          onChange={(e) => set("landlord", e.target.value)}
          placeholder="Whoever holds the deposit and sent the deductions"
          className={inputClass}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where is it?</p>
        <Chips<Nation>
          label="Where the property is"
          value={inp.nation}
          onPick={(v) => setInp((prev) => ({ ...prev, nation: v, scheme: "" }))}
          options={[
            { id: "england", label: "England" },
            { id: "wales", label: "Wales" },
            { id: "scotland", label: "Scotland" },
            { id: "ni", label: "Northern Ireland" },
          ]}
        />
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deposit-amount" className="block text-sm text-[var(--foreground)] mb-2">
              The deposit
            </label>
            <input
              id="deposit-amount"
              type="text"
              inputMode="decimal"
              value={inp.deposit}
              onChange={(e) => set("deposit", e.target.value)}
              placeholder="e.g. £1,200"
              aria-invalid={moneyInvalid(inp.deposit)}
              className={inputClass}
            />
            {moneyInvalid(inp.deposit) ? <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p> : null}
          </div>
          {inp.nation === "england" ? (
            <div>
              <label htmlFor="deposit-rent" className="block text-sm text-[var(--foreground)] mb-2">
                The rent <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="deposit-rent"
                  type="text"
                  inputMode="decimal"
                  value={inp.rent}
                  onChange={(e) => set("rent", e.target.value)}
                  placeholder="e.g. £1,100"
                  aria-invalid={moneyInvalid(inp.rent)}
                  className={inputClass}
                />
                <select
                  aria-label="Rent period"
                  value={inp.rentPer}
                  onChange={(e) => set("rentPer", e.target.value as RentPer)}
                  className={`${inputClass} max-w-[8rem]`}
                >
                  <option value="">per…</option>
                  <option value="month">a month</option>
                  <option value="week">a week</option>
                </select>
              </div>
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                To check the deposit wasn&rsquo;t over the legal cap.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* ---- Protection and evidence ---- */}
      {inp.nation ? (
        <div className={card}>
          <p className={eyebrow}>The deposit scheme</p>
          <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Was it protected in a government scheme?</p>
          <Chips<Protection>
            label="Was the deposit protected"
            value={inp.protection}
            onPick={(v) => set("protection", v)}
            cols={1}
            options={[
              { id: "yes", label: `Yes, and I was sent the scheme's details within ${inp.nation === "scotland" ? "30 working days" : "30 days"}` },
              { id: "late", label: "Yes, but late, or I was never sent the details" },
              { id: "no", label: "No, it was never protected" },
              { id: "unsure", label: "I don't know" },
            ]}
          />
          {inp.protection === "unsure" ? (
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              Each scheme has a free &ldquo;check your deposit&rdquo; search on
              its website: try your surname, the postcode, the deposit amount
              and the start date on each one. If none of them has it, come
              back and pick &ldquo;never protected&rdquo;.
            </p>
          ) : null}
          {inp.protection && inp.protection !== "no" ? (
            <>
              <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Which scheme?</p>
              <Chips<Scheme>
                label="Which scheme"
                value={inp.scheme}
                onPick={(v) => set("scheme", v)}
                options={schemesFor(inp.nation)}
              />
            </>
          ) : null}
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">Was there a check-in inventory?</p>
          <Chips<Inventory>
            label="Check-in inventory"
            value={inp.inventory}
            onPick={(v) => set("inventory", v)}
            cols={1}
            options={[
              { id: "signed", label: "Yes, a written inventory or check-in report" },
              { id: "photos", label: "Only my own photos from moving in" },
              { id: "none", label: "No, nothing" },
            ]}
          />
        </div>
      ) : null}

      {/* ---- Where it's got to ---- */}
      {inp.nation ? (
        <div className={card}>
          <p className={eyebrow}>Where it&rsquo;s got to</p>
          <Chips<Stage>
            label="Where it's got to"
            value={inp.stage}
            onPick={(v) => set("stage", v)}
            cols={1}
            options={[
              { id: "living", label: "I haven't moved out yet" },
              { id: "none", label: "I've moved out and haven't asked for it yet" },
              { id: "silent", label: "I've asked, and heard nothing" },
              { id: "proposed", label: "They've sent a list of deductions" },
              { id: "stuck", label: "We've gone back and forth and won't agree" },
              { id: "agreed", label: "We agreed an amount, but it hasn't been paid" },
            ]}
          />
          {movedOut ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deposit-moved" className="block text-sm text-[var(--foreground)] mb-2">
                  When did you move out?
                </label>
                <input
                  id="deposit-moved"
                  type="date"
                  value={inp.movedOut}
                  max={today}
                  onChange={(e) => set("movedOut", e.target.value)}
                  className={inputClass}
                />
              </div>
              {inp.stage === "silent" || inp.stage === "agreed" ? (
                <div>
                  <label htmlFor="deposit-asked" className="block text-sm text-[var(--foreground)] mb-2">
                    {inp.stage === "agreed" ? "When did you agree it?" : "When did you ask?"}{" "}
                    <span className="text-[var(--muted)]">(optional)</span>
                  </label>
                  <input
                    id="deposit-asked"
                    type="date"
                    value={inp.askedOn}
                    max={today}
                    onChange={(e) => set("askedOn", e.target.value)}
                    className={inputClass}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- The deductions ---- */}
      {inp.nation && listing ? (
        <section aria-label="Their deductions" className={card}>
          <p className={eyebrow}>Their deductions, one line each</p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Copy each line from their list, say what it&rsquo;s for, and
            whether you think it&rsquo;s fair. The tool prices it the way an
            adjudicator would.
          </p>
          <div className="mt-4 space-y-5">
            {items.map((it, i) => (
              <ItemRow
                key={i}
                item={it}
                index={i}
                canRemove={items.length > 1}
                onSet={(k, v) => (inp.items.length === 0 ? setInp((prev) => ({ ...prev, items: [{ ...BLANK_ITEM, [k]: v }] })) : setItem(i, k, v))}
                onRemove={() => removeItem(i)}
              />
            ))}
          </div>
          {items.length < MAX_ITEMS ? (
            <button type="button" onClick={addItem} className={`mt-4 ${action}`}>
              + Add another deduction
            </button>
          ) : null}
        </section>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? depositHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say where the place is, the deposit, whether it was protected and
            where things have got to{listing ? ", and for each deduction, the amount, what it's for and your view" : ""}, and the read appears: the
            number to ask for, the message to send, and the last day to take
            it to the free dispute service.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_DEPOSIT);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function ItemRow({
  item,
  index,
  canRemove,
  onSet,
  onRemove,
}: {
  item: DepositItem;
  index: number;
  canRemove: boolean;
  onSet: <K extends keyof DepositItem>(k: K, v: DepositItem[K]) => void;
  onRemove: () => void;
}) {
  const id = `deposit-item-${index}`;
  const label = item.what.trim() || `deduction ${index + 1}`;
  const needsAge = itemNeedsAge(item);
  const showOffer = item.view === "much" && !(needsAge && item.age.trim() && item.life.trim());
  return (
    <div className={index > 0 ? "pt-5 border-t border-[var(--border)]" : ""}>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <div>
          <label htmlFor={`${id}-what`} className="block text-sm text-[var(--foreground)] mb-2">
            Deduction {index + 1}
          </label>
          <input
            id={`${id}-what`}
            type="text"
            value={item.what}
            onChange={(e) => onSet("what", e.target.value)}
            placeholder={index === 0 ? "e.g. new lounge carpet" : index === 1 ? "e.g. professional clean" : "e.g. broken blind"}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${id}-amount`} className="block text-sm text-[var(--foreground)] mb-2">
            Amount
          </label>
          <input
            id={`${id}-amount`}
            type="text"
            inputMode="decimal"
            value={item.amount}
            onChange={(e) => onSet("amount", e.target.value)}
            placeholder="£600"
            aria-invalid={moneyInvalid(item.amount)}
            className={inputClass}
          />
        </div>
      </div>
      {moneyInvalid(item.amount) ? <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p> : null}
      <label htmlFor={`${id}-kind`} className="block mt-3 text-sm text-[var(--foreground)] mb-2">
        What&rsquo;s it for?
      </label>
      <select
        id={`${id}-kind`}
        value={item.kind}
        onChange={(e) => onSet("kind", e.target.value as ItemKind)}
        className={inputClass}
      >
        <option value="">Choose…</option>
        {KIND_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {needsAge ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${id}-age`} className="block text-sm text-[var(--foreground)] mb-2">
                {item.kind === "redecorate" ? "Years since painted" : "Age when you left"}
              </label>
              <input
                id={`${id}-age`}
                type="text"
                inputMode="decimal"
                value={item.age}
                onChange={(e) => onSet("age", e.target.value)}
                placeholder="e.g. 5 years"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`${id}-life`} className="block text-sm text-[var(--foreground)] mb-2">
                Usual life
              </label>
              <input
                id={`${id}-life`}
                type="text"
                inputMode="decimal"
                value={item.life}
                onChange={(e) => onSet("life", e.target.value)}
                placeholder={item.kind === "redecorate" ? "3 to 5 years" : "e.g. 6 years"}
                className={inputClass}
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            {item.kind === "redecorate"
              ? "Adjudicators commonly allow three to five years for paintwork; nearer three for a busy house or a big family. Count from when it was last done, not from when you moved in."
              : "A guide used in deposit disputes gives carpets 2 to 4 years (cheap), 5 to 8 (medium) and 8 to 15 (good). The check-in inventory often says how old things were; if not, ask for the invoice."}
          </p>
        </>
      ) : null}
      <p className="mt-3 text-sm text-[var(--foreground)] mb-2">Your view</p>
      <div role="group" aria-label={`Your view on ${label}`} className="flex flex-wrap gap-2">
        {VIEW_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={item.view === o.id}
            onClick={() => onSet("view", o.id)}
            className={`${chipBase} ${item.view === o.id ? chipOn : chipOff}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {showOffer ? (
        <>
          <label htmlFor={`${id}-offer`} className="block mt-3 text-sm text-[var(--foreground)] mb-2">
            What would be fair? <span className="text-[var(--muted)]">(optional)</span>
          </label>
          <input
            id={`${id}-offer`}
            type="text"
            inputMode="decimal"
            value={item.offer}
            onChange={(e) => onSet("offer", e.target.value)}
            placeholder={item.kind === "clean" ? "e.g. £80 for the oven" : "e.g. £100"}
            aria-invalid={moneyInvalid(item.offer)}
            className={`${inputClass} sm:max-w-[14rem]`}
          />
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            {item.kind === "clean"
              ? "What it would cost to clean only what's below the check-in standard. A local cleaner's hourly rate times the hours is a fair way to get it."
              : "A quote you found, or leave it blank and the reply asks them for the invoice."}
          </p>
        </>
      ) : null}
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
          className="mt-3 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Remove
        </button>
      ) : null}
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

const VERDICT_WORDS: Record<ItemRead["verdict"], string> = {
  accept: "Fair",
  apportion: "Its share of life left",
  spent: "Past its life",
  wear: "Wear and tear",
  unproven: "No record to compare",
  refuse: "Not yours",
  offer: "Your offer",
  open: "Ask for the invoice",
};

function PricedTable({ read }: { read: DepositRead }) {
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>Their deductions, priced</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {read.items.map((r) => (
          <li key={r.index} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--foreground)]">{r.label}</span>
              <span className="block text-xs text-[var(--muted)]">{VERDICT_WORDS[r.verdict]}</span>
            </span>
            <span className="shrink-0 text-right tabular-nums">
              {r.fair !== null && r.fair !== r.claimed ? (
                <>
                  <span className="text-[var(--muted)] line-through mr-2">{money(r.claimed)}</span>
                  <span className="font-medium text-[var(--foreground)]">{money(r.fair)}</span>
                </>
              ) : (
                <span className="font-medium text-[var(--foreground)]">{money(r.claimed)}</span>
              )}
            </span>
          </li>
        ))}
        <li className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
          <span className="font-medium text-[var(--foreground)]">Fair deductions{read.open ? " (so far)" : ""}</span>
          <span className="shrink-0 tabular-nums">
            <span className="text-[var(--muted)] line-through mr-2">{money(read.claimed)}</span>
            <span className="font-semibold text-[var(--foreground)]">{money(read.fair)}</span>
          </span>
        </li>
        <li className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
          <span className="font-medium text-[var(--foreground)]">Back to you, of {money(read.deposit)}</span>
          <span className="shrink-0 font-semibold text-[var(--accent)] tabular-nums">{money(read.back)}</span>
        </li>
      </ul>
    </div>
  );
}

function ReadBlock({ inp, read, today }: { inp: DepositInputs; read: DepositRead; today: string }) {
  const [copied, setCopied] = useState<"" | "main" | "dispute" | "line" | "all" | "no">("");
  const rule = depositRule();
  const main = mainMessage(inp, read);
  const dispute = read.kind === "reply" ? disputeMessage(inp, read) : null;
  const remind = remindOn(read, today);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {depositHeadline(inp, read)}
      </p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{depositBody(inp, read)}</p>

      {read.items.length ? <PricedTable read={read} /> : null}

      {read.over > 0 ? (
        <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
          <strong className="font-medium">The deposit was over the cap.</strong>{" "}
          For this rent the most it could be was {money(read.cap ?? 0)}, so{" "}
          {money(read.over)} of it was a banned payment under the Tenant Fees
          Act. The message asks for it back. If they refuse, Trading Standards
          can act, and you can apply to the First-tier Tribunal to recover it.
        </p>
      ) : null}

      {main ? (
        <MessageBox
          id="deposit-main-msg"
          title={main.title}
          note={
            read.kind === "dispute"
              ? "Raise the dispute on the scheme's website and paste this in. Attach the inventory, your photos, the tenancy agreement and the messages."
              : "Send it by email so it's dated, and keep a copy. Fill in the square brackets."
          }
          text={main.text}
          copied={copied === "main"}
          onCopy={async () => setCopied((await copyText(main.text)) ? "main" : "no")}
        />
      ) : null}

      {dispute ? (
        <details className="mt-4 rounded-lg border border-[var(--border)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">
            If it comes to the scheme: the statement for {schemeName(inp)}&rsquo;s form
          </summary>
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[var(--foreground)]">
            {dispute}
          </pre>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(dispute)) ? "dispute" : "no")}
            className={`mt-3 ${action}`}
          >
            {copied === "dispute" ? "Copied" : "Copy the statement"}
          </button>
        </details>
      ) : null}

      {read.replyBy && isISODate(read.replyBy) && read.kind !== "wait" ? (
        <p className="mt-4 text-sm text-[var(--foreground)]">
          Reply-by date in the message: <span className="font-medium">{actDate(read.replyBy)}</span>
        </p>
      ) : null}
      {read.disputeBy && read.kind !== "late" ? (
        <p className="mt-2 text-sm text-[var(--foreground)]">
          Last day to raise the free dispute: <span className="font-medium">{actDate(read.disputeBy)}</span>
        </p>
      ) : null}
      {read.tribunalBy ? (
        <p className="mt-2 text-sm text-[var(--foreground)]">
          Last day to apply to the tribunal: <span className="font-medium">{actDate(read.tribunalBy)}</span>
        </p>
      ) : null}
      {remind ? (
        <button type="button" onClick={() => downloadIcs(inp, remind)} className={`mt-2 ${action}`}>
          Add {actDate(remind.on)} to your calendar (.ics)
        </button>
      ) : null}

      {inp.protection === "late" && read.kind !== "living" ? (
        <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
          <strong className="font-medium">Protected late, or no details?</strong>{" "}
          {inp.nation === "scotland"
            ? `That's a breach too: the tribunal can award up to three times the deposit if you apply within three months of moving out${read.tribunalBy ? `, by ${actDate(read.tribunalBy)}` : ""}.`
            : inp.nation === "ni"
              ? "That's a breach of the rules; tell the council."
              : `That's a breach in itself, separate from the deductions: a court can award ${inp.nation === "wales" ? "up to three times" : "one to three times"} the deposit, and the claim runs six years. Settle the deductions first, then ask Shelter${inp.nation === "wales" ? " Cymru" : ""} or Citizens Advice about it.`}
        </p>
      ) : null}

      {read.kind === "living" || read.kind === "dispute" ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>{read.kind === "living" ? "The evidence to make now" : "The evidence to attach"}</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {evidenceLines(inp).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. Adjudicators decide each case on its evidence, and the
        age-based share is the method the schemes&rsquo; own guides use, not a
        guarantee. Scheme deadlines differ: TDS and mydeposits take disputes
        within three months of the tenancy ending; check yours. Shelter,
        Shelter Cymru and Citizens Advice give free help.
      </p>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Next time, on the day you move in: photograph every room, note
          anything already worn or broken on the inventory before you sign
          it, and check the deposit appears on a scheme&rsquo;s website within
          the month.
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
            onClick={async () => setCopied((await copyText(depositSummary(inp, read))) ? "all" : "no")}
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
      <Handoffs inp={inp} />
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp }: { inp: DepositInputs }) {
  const s = inp.what;
  const list: Handoff[] = [
    {
      href: withSubject("/split", "the next flat"),
      label: "The next place, if you're sharing",
      note: "Who gets which room, and what each pays for it, so nobody feels they're subsidising someone else.",
    },
    {
      href: withSubject("/bills", "the bills at the new place"),
      label: "The bills at the new place",
      note: "Half each, in proportion to pay, or pooled: pick the split before the first bill arrives.",
    },
    {
      href: withSubject("/rule", s),
      label: "Make it a standing rule",
      note: "Photos in, photos out, the scheme checked in month one. Decide it once.",
    },
  ];
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
        <Link href="/writing/charge-for-the-life-that-was-left" className={link}>
          Charge for the life that was left
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
function DepositExample({ today }: { today: string }) {
  const ex = depositExample(today);
  const read = readDeposit(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Three years in a two-bed flat, £1,200 deposit. The agent&rsquo;s list:
        a new lounge carpet £600, a full repaint £450, a professional clean
        £250, £60 for filling picture-hook holes, and £35 for a blind I did
        break. £1,395: more than the whole deposit. I was ready to offer half
        and hope.
      </p>
      <PricedTable read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {depositHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The carpet was five years into a six-year life, so its share is a
          sixth: £100. The paint was three years into five: £180. The oven
          really was grim, so I offered £80 for that, not a professional clean
          of the whole flat. The hook holes are wear and tear. The blind was me.
          The agent came back at £450; I said I&rsquo;d take it to the scheme,
          and they settled at £395.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}deposit.
      </p>
    </div>
  );
}
