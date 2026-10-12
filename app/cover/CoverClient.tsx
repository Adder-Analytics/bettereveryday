"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import { formatMoney, moneyInvalid } from "../data/worth";
import {
  BLANK_COVER,
  COVER_EXAMPLE,
  PER_LABEL,
  breakEvenSentence,
  carrying,
  coverCurrency,
  coverHeadline,
  coverName,
  coverRule,
  coverSummary,
  excessTip,
  oddsQuestion,
  oneIn,
  parseCoverInputs,
  readCover,
  yearsInvalid,
  type CoverInputs,
  type CoverMode,
  type CoverPer,
  type CoverRead,
  type Covered,
  type Odds,
} from "../data/cover";

/**
 * Insure it or carry it? (/cover)
 *
 * The instrument for the cover offered at the till and the excess on a
 * renewal. People over-insure small, replaceable things, mostly because they
 * overestimate how often things fail (Abito and Salant), pay heavily for low
 * deductibles (Sydnor), and drop the cover that would actually save them
 * after a few quiet years (Kunreuther and colleagues). The tool sorts the
 * loss by whether you could pay it from savings, and for the losses you
 * could, works out the chance of a claim at which the cover breaks even.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/cover.ts` so it can be checked without a browser.
 */

const STORE_KEY = "cover:v1";

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

function loadInputs(): CoverInputs {
  if (typeof window === "undefined") return BLANK_COVER;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseCoverInputs(JSON.parse(raw)) : BLANK_COVER;
  } catch {
    return BLANK_COVER;
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

/**
 * A money field. Says so under itself when it can't read the input, and can
 * carry a "how often" select beside it.
 */
function MoneyField({
  id,
  label,
  value,
  onChange,
  placeholder,
  optional,
  help,
  per,
  onPer,
  pers,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  optional?: boolean;
  help?: string;
  per?: CoverPer;
  onPer?: (p: CoverPer) => void;
  pers?: Exclude<CoverPer, "">[];
}) {
  const bad = moneyInvalid(value);
  const described = [bad ? `${id}-bad` : "", help ? `${id}-help` : ""].filter(Boolean).join(" ");
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--muted)] mb-1.5">
        {label}
        {optional ? <span className="opacity-70"> (optional)</span> : null}
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
          aria-describedby={described || undefined}
          className={`${inputClass} min-w-0 flex-1`}
        />
        {per !== undefined && onPer && pers ? (
          <select
            aria-label={`${label}: how often`}
            value={per}
            onChange={(e) => onPer(e.target.value as CoverPer)}
            className="shrink-0 px-2 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
          >
            {pers.map((p) => (
              <option key={p} value={p}>
                {PER_LABEL[p]}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {bad ? (
        <p id={`${id}-bad`} className="mt-1.5 text-xs text-[var(--muted)]">
          Type an amount, like 99, £12.50 or 1,200.
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

export default function CoverClient() {
  const [inp, setInp] = useState<CoverInputs>(BLANK_COVER);
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

  const set = <K extends keyof CoverInputs>(k: K, v: CoverInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readCover(inp), [inp]);
  const ex = inp.mode === "excess";
  const askOdds =
    read !== null && read.kind !== "never" && read.kind !== "insure" && read.kind !== "check";

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
        {showExample ? <CoverExample /> : null}
      </div>

      {/* ---- What's on offer ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="cover-what" className={`block ${eyebrow} mb-2`}>
          What&rsquo;s the cover?
        </label>
        <input
          id="cover-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. Three-year warranty on the new laptop"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-4 text-sm text-[var(--foreground)] mb-2">What are you deciding?</p>
        <Chips<CoverMode>
          label="What are you deciding?"
          value={inp.mode}
          onPick={(v) =>
            setInp((prev) => ({
              ...prev,
              mode: v,
              pricePer: v === "excess" && prev.pricePer === "once" ? "year" : prev.pricePer,
            }))
          }
          cols={2}
          options={[
            { id: "cover", label: "Whether to buy the cover" },
            { id: "excess", label: "Which excess to take on a policy" },
          ]}
        />
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          An extended warranty, phone or gadget cover, a rental car&rsquo;s damage
          waiver, travel cover, GAP: you&rsquo;re deciding whether to buy it. A
          lower excess (deductible) for a higher premium on your car, home or pet
          policy: you&rsquo;re choosing the excess.
        </p>
      </div>

      {/* ---- Step 1: the numbers ---- */}
      {inp.mode ? (
        <div className={card}>
          <p className={eyebrow}>The cover, in numbers</p>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {ex ? (
              <>
                <MoneyField
                  id="cover-price"
                  label="How much more the lower excess costs"
                  value={inp.price}
                  onChange={(v) => set("price", v)}
                  placeholder="e.g. £60"
                  per={inp.pricePer === "once" ? "year" : inp.pricePer}
                  onPer={(p) => set("pricePer", p)}
                  pers={["year", "month"]}
                />
                <MoneyField
                  id="cover-loss"
                  label="The higher excess"
                  value={inp.loss}
                  onChange={(v) => set("loss", v)}
                  placeholder="e.g. £500"
                />
                <MoneyField
                  id="cover-excess"
                  label="The lower excess"
                  value={inp.excess}
                  onChange={(v) => set("excess", v)}
                  placeholder="e.g. £250"
                />
              </>
            ) : (
              <>
                <MoneyField
                  id="cover-price"
                  label="What the cover costs"
                  value={inp.price}
                  onChange={(v) => set("price", v)}
                  placeholder="e.g. £99"
                  per={inp.pricePer}
                  onPer={(p) => set("pricePer", p)}
                  pers={["once", "month", "year"]}
                />
                {inp.pricePer === "once" ? (
                  <div>
                    <label htmlFor="cover-years" className="block text-sm text-[var(--muted)] mb-1.5">
                      How long it covers you for
                    </label>
                    <input
                      id="cover-years"
                      type="text"
                      inputMode="decimal"
                      value={inp.years}
                      onChange={(e) => set("years", e.target.value)}
                      placeholder="e.g. 3 years"
                      aria-invalid={yearsInvalid(inp.years) || undefined}
                      aria-describedby={yearsInvalid(inp.years) ? "cover-years-bad" : undefined}
                      className={inputClass}
                    />
                    {yearsInvalid(inp.years) ? (
                      <p id="cover-years-bad" className="mt-1.5 text-xs text-[var(--muted)]">
                        Type years, like 3 or 2.5, or months, like 18 months.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <MoneyField
                  id="cover-loss"
                  label="What replacing or repairing it would cost you"
                  value={inp.loss}
                  onChange={(v) => set("loss", v)}
                  placeholder="e.g. £600"
                  help="The worst realistic bill without cover. For a thing, what you'd actually pay to replace it then, which is often less than you paid. Count what keeping going would cost, like a hire car."
                />
                <MoneyField
                  id="cover-excess"
                  label="The excess you'd still pay on a claim"
                  value={inp.excess}
                  onChange={(v) => set("excess", v)}
                  placeholder="e.g. £50"
                  optional
                />
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* ---- Step 2: what you could carry ---- */}
      {inp.mode ? (
        <div className={card}>
          <p className={eyebrow}>What you could carry</p>
          <div className="mt-4">
            <MoneyField
              id="cover-buffer"
              label="The biggest bill you could pay from savings this month, without borrowing or real hardship"
              value={inp.buffer}
              onChange={(v) => set("buffer", v)}
              placeholder="e.g. £1,000"
              help="Be honest rather than brave. This one number decides most of the answer: insurance is for the losses above it."
            />
          </div>
          {!ex ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
                Could something you already have cover it?
              </p>
              <Chips<Covered>
                label="Could something you already have cover it?"
                value={inp.covered}
                onPick={(v) => set("covered", v)}
                options={[
                  { id: "yes", label: "Yes, possibly" },
                  { id: "unsure", label: "Not sure" },
                  { id: "no", label: "No" },
                ]}
              />
              <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
                The maker&rsquo;s warranty; your legal rights over faulty goods,
                which in the UK and EU run well past the first year; a credit
                card&rsquo;s purchase protection; your home contents policy; a
                packaged bank account.
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      {/* ---- Step 3: the odds, once the break-even is known ---- */}
      {read && askOdds ? (
        <div className={card}>
          <p className={eyebrow}>The odds</p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            {breakEvenSentence(inp, read)}
          </p>
          <p className="mt-4 text-sm text-[var(--foreground)] mb-2">{oddsQuestion(inp, read)}</p>
          <Chips<Odds>
            label={oddsQuestion(inp, read)}
            value={inp.odds}
            onPick={(v) => set("odds", v)}
            cols={2}
            options={[
              { id: "less", label: ex ? "No, less often than that" : "No, less likely than that" },
              { id: "record", label: ex ? "Yes, going by my claims so far" : "Yes, going by my own record" },
              { id: "feeling", label: "Yes, it feels that likely" },
              { id: "unknown", label: "I have no idea" },
            ]}
          />
          <label className="mt-4 flex items-start gap-2 text-sm text-[var(--muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={inp.worry}
              onChange={(e) => set("worry", e.target.checked)}
              className="mt-1 accent-[var(--accent)]"
            />
            <span>I&rsquo;d worry without it.</span>
          </label>
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? coverHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Fill in the cover and what you could pay from savings, and the read
            appears: whether this is a loss to insure or one to carry, and the
            odds the cover needs to beat.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_COVER);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function ReadBlock({ inp, read }: { inp: CoverInputs; read: CoverRead }) {
  const [copied, setCopied] = useState<"" | "line" | "all" | "no">("");
  const rule = coverRule(inp, read);
  const tip = excessTip(inp, read);
  const cur = coverCurrency(inp);
  const showPeace = inp.worry && carrying(read);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {coverHeadline(inp, read)}
      </p>
      <BufferBar inp={inp} read={read} />
      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <ReadBody inp={inp} read={read} />
        {tip ? <p>{tip}</p> : null}
        {read.unsureCovered && read.kind !== "insure" ? (
          <p className="pl-3 border-l-2 border-[var(--accent)]">
            <span className="font-medium">Check before you pay twice.</span>{" "}
            You weren&rsquo;t sure whether something already covers this. The
            maker&rsquo;s warranty, your legal rights over faulty goods and a
            card&rsquo;s purchase protection are the usual ones. Five minutes
            finding out can make the cover pointless.
          </p>
        ) : null}
        {showPeace ? (
          <p className="pl-3 border-l-2 border-[var(--accent)]">
            <span className="font-medium">Peace of mind has a price.</span>{" "}
            Wanting not to worry is fair, and it&rsquo;s most of what this cover
            sells. Name the price: much of the {formatMoney(read.cost, cur)}{" "}is
            paying for calm, not for claims. You can buy the same calm another
            way: put {formatMoney(read.cost, cur)}{" "}aside in a pot for this, and
            the first bill is already paid.
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          The offer comes at the till, when you&rsquo;ve just said yes to
          something and the question is put to you as a worry. A line set
          beforehand turns it into a lookup: is this loss over my number or not?
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
              setCopied((await copyText(coverSummary(inp, read))) ? "all" : "no")
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
 * The worst case without cover against what savings could pay. Purely a
 * picture of the sentence beside it, so it's hidden from screen readers.
 */
function BufferBar({ inp, read }: { inp: CoverInputs; read: CoverRead }) {
  const cur = coverCurrency(inp);
  const max = Math.max(read.hit, read.buffer) * 1.15 || 1;
  const pos = (n: number) => Math.min(100, Math.max(0, (n / max) * 100));
  const over = read.hit > read.buffer;
  return (
    <div className="mt-5" aria-hidden="true">
      <div className="relative h-2 rounded-full bg-[var(--border)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] opacity-20"
          style={{ width: `${pos(read.buffer)}%` }}
        />
        <div
          className="absolute -top-1 bottom-[-4px] w-px bg-[var(--muted)]"
          style={{ left: `${pos(read.buffer)}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)]"
          style={{ left: `${pos(read.hit)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-xs text-[var(--muted)]">
        <span>
          worst case {formatMoney(read.hit, cur)}
          {over ? ", over your line" : ", inside your line"}
        </span>
        <span>you could pay {formatMoney(read.buffer, cur)}</span>
      </div>
    </div>
  );
}

function ReadBody({ inp, read }: { inp: CoverInputs; read: CoverRead }) {
  const cur = coverCurrency(inp);
  const hit = formatMoney(read.hit, cur);
  const buf = formatMoney(read.buffer, cur);
  const ex = inp.mode === "excess";
  const be = breakEvenSentence(inp, read);
  switch (read.kind) {
    case "never":
      return (
        <p>
          {be}{" "}
          {ex
            ? "Unless you claim more than once a year, the lower excess can only lose you money."
            : "Unless you expect to claim more than once in that time, the cover can only lose you money."}
        </p>
      );
    case "insure":
      return ex ? (
        <p>
          With the higher excess, a single claim would cost you {hit}, more than
          the {buf}{" "}you could pay from savings. Keep the lower one for now. Once
          your savings could cover the higher excess, run it again. Then the
          lower one only pays if you claim often, and most people don&rsquo;t.
        </p>
      ) : (
        <>
          <p>
            Without cover, the worst case is {hit}, more than the {buf}{" "}you could
            pay from savings. That&rsquo;s what insurance is for: a small, sure
            cost to stop a loss you couldn&rsquo;t absorb. Shop around on price,
            but don&rsquo;t skip it. The other way out is to shrink the loss: plan
            to replace it with something cheaper, or build savings until you could.
          </p>
          {inp.pricePer !== "once" ? (
          <p className="text-[var(--muted)]">
            The usual mistake with this kind of cover is dropping it after a few
            quiet years. In a study of US flood insurance, the typical new policy
            lapsed within two to four years, faster than people moved house. A
            year without a claim isn&rsquo;t evidence you didn&rsquo;t need it.
          </p>
          ) : null}
        </>
      );
    case "check":
      return (
        <p>
          Before you pay for it twice, find out what you already have. The
          maker&rsquo;s warranty, your legal rights over faulty goods, a credit
          card&rsquo;s purchase protection, your home contents policy or a
          packaged bank account may cover some or all of {coverName(inp)}. If
          they don&rsquo;t, come back and answer &ldquo;No&rdquo;. The loss itself
          is one you could pay from savings, so there&rsquo;s no rush.
        </p>
      );
    case "threshold":
      return (
        <p>
          {be}{" "}The loss is one you could pay from savings, so the only
          question left is the odds. Answer it above.
        </p>
      );
    case "carry":
      return (
        <p>
          {be}{" "}It&rsquo;s less likely than that, and you could pay the worst
          case from savings. Keep the money. Over many offers like this,
          carrying the small risks yourself comes out well ahead, because cover
          is priced to pay out less than it takes in.
        </p>
      );
    case "record":
      return (
        <>
          <p>
            {be}{" "}If you really do claim more than most (a phone that&rsquo;s
            been dropped twice, a toddler, a bike on a city commute), the average
            doesn&rsquo;t describe you and the cover can pay.
          </p>
          <p>
            Two checks before you buy. Read the exclusions and the excess, which
            is where cover like this stops paying. And notice whether the price
            already reflects your record: insurers price claim history too.
          </p>
        </>
      );
    case "doubt":
      return (
        <p>
          {be}{" "}People guess high on this. In one study of extended warranties,
          people with no information put the chance of a product failing at
          around 13&ndash;15%, against an expert figure of 5%. Shown that
          figure, the median amount they&rsquo;d pay for the warranty roughly
          halved. A feeling that it&rsquo;s likely is what the offer at the till
          is built to produce. Look up a failure or claim rate before you pay.
        </p>
      );
    case "house":
      return ex ? (
        <p>
          {be}{" "}The insurer knows how often people like you claim, and set the
          price above it. In a large US study, most homeowners chose a low
          deductible that cost far more than it could be expected to save, given
          how rarely they claimed. With no reason to think you claim more than
          most, take the higher excess and keep the difference.
        </p>
      ) : (
        <p>
          {be}{" "}The seller knows the claim rate and you don&rsquo;t, and priced
          the cover to pay out less than it takes in. In the UK regulator&rsquo;s
          figures for 2025, gadget insurance paid out about 36p in claims for
          every £1 of premium. With no reason to think you&rsquo;re worse than
          average, the average is against you, and you could pay the worst case
          yourself.
        </p>
      );
  }
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: CoverInputs; read: CoverRead }) {
  const s = inp.what;
  const list: Handoff[] = [];
  if (read.kind === "doubt" || read.kind === "house") {
    list.push({
      href: withSubject("/outside", s),
      label: "Find the base rate",
      note: "How often do things like this actually fail or get claimed on? Start from the rate for the reference class, not the feeling.",
    });
  }
  if (carrying(read)) {
    list.push({
      href: withSubject("/rule", s),
      label: "Make it a standing rule",
      note: "The offer will come again at the next till. Decide it once, so the answer is ready before the question.",
    });
  }
  if (read.kind === "insure") {
    list.push({
      href: withSubject("/ruin", s),
      label: "Check the rest of the worst case",
      note: "If this loss would knock out more than the thing itself (an income, a home), run the survival check on the whole of it.",
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
function CoverExample() {
  const ex = COVER_EXAMPLE;
  const read = readCover(ex);
  if (!read) return null;
  const cur = coverCurrency(ex);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        At the till with a {formatMoney(read.hit, cur)}{" "}TV, I was offered a
        three-year warranty for {formatMoney(read.cost, cur)}. &ldquo;Screens
        aren&rsquo;t cheap to fix,&rdquo; the assistant said, and it felt
        sensible.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        I could pay {formatMoney(read.buffer, cur)}{" "}from savings if I had to,
        so a dead TV would hurt but not sink me. That left the odds: the
        warranty only paid for itself if the TV was likelier than{" "}
        {oneIn(read.breakEven)}{" "}to fail in three years. It felt that likely,
        and that was the problem.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {coverHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          When I looked for a failure rate instead of going on a feeling,
          nothing I found came close to {oneIn(read.breakEven)}, and the law
          already covered a set that failed early. I said no and put the{" "}
          {formatMoney(read.cost, cur)}{" "}in savings.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}cover.
      </p>
    </div>
  );
}
