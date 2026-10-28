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
  BLANK_PARKING,
  actDate,
  discountDays,
  discountOf,
  evidenceLines,
  isISODate,
  keeperNoticeLate,
  mainMessage,
  parkingBody,
  parkingExample,
  parkingHeadline,
  parkingRule,
  parkingSummary,
  parseParkingInputs,
  readParking,
  stagesFor,
  todayISO,
  toggleGround,
  tribunalName,
  type Driver,
  type Ground,
  type How,
  type ParkingInputs,
  type ParkingRead,
  type Place,
  type Stage,
  type Ticket,
} from "../data/parking";

/**
 * Parking ticket: pay or appeal? (/parking)
 *
 * The instrument for the ticket on the windscreen or the letter with a photo
 * of your number plate. The call turns on one sum: what appealing costs if you
 * lose. Often it's nothing (the discount is held, or already gone), sometimes
 * it's the discount, and ignoring it always costs most. So the tool works out
 * which, writes the appeal, and dates the next step.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/parking.ts` so it can be checked without a browser.
 */

const STORE_KEY = "parking:v1";

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
const MONEY_BAD = "Couldn't read that as an amount. Try something like £70.";

function money(n: number): string {
  return formatMoney(n, "£");
}

function loadInputs(): ParkingInputs {
  if (typeof window === "undefined") return BLANK_PARKING;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseParkingInputs(JSON.parse(raw)) : BLANK_PARKING;
  } catch {
    return BLANK_PARKING;
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
function remindOn(read: ParkingRead, today: string): { on: string; title: string; body: string } | null {
  const on = read.actBy || read.payBy;
  if (!on || on < today) return null;
  const paying = read.kind === "pay" || read.kind === "certificate";
  return {
    on,
    title: paying ? `Parking ticket: pay ${money(read.payNow)} today` : "Parking ticket: last day for the next step",
    body: paying
      ? "After today the amount goes up."
      : `Send it today if you haven't. Paying now would cost ${money(read.payNow)}.`,
  };
}

function downloadIcs(inp: ParkingInputs, r: { on: string; title: string; body: string }): void {
  if (!isISODate(r.on)) return;
  const what = inp.what.trim();
  const day = r.on.replace(/-/g, "");
  const [y, m, d] = r.on.split("-").map(Number);
  const next = new Date(y, m - 1, d + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  const end = `${next.getFullYear()}${p(next.getMonth() + 1)}${p(next.getDate())}`;
  const event = [
    "BEGIN:VEVENT",
    `UID:parking-${todayISO()}-${r.on}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(what ? `${r.title} (${what})` : r.title)}`,
    `DESCRIPTION:${icsEscape(`${r.body}\n${SITE_URL}/parking`)}`,
    "END:VEVENT",
  ];
  const blob = new Blob([wrapCalendar([event], "Parking")], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `parking-${r.on}.ics`;
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

const GROUND_OPTIONS: { id: Ground; label: string }[] = [
  { id: "paid", label: "I'd paid, or had a permit or badge (even with a typo in the registration)" },
  { id: "grace", label: "I was no more than ten minutes over, or left within a few minutes" },
  { id: "wrong", label: "Something on the ticket is wrong: the registration, the place, the time" },
  { id: "sold", label: "The car wasn't mine then: sold, stolen or on hire" },
  { id: "signs", label: "The signs or lines were missing, unclear or hidden" },
  { id: "loading", label: "I was loading, unloading, or dropping someone off" },
  { id: "emergency", label: "A breakdown, an emergency, or something out of my control" },
  { id: "none", label: "None of these: I was in the wrong" },
];

const STAGE_DATE_LABEL: Partial<Record<Stage, string>> = {
  rejected: "Date on the rejection letter",
  nto: "Date on the Notice to Owner",
  refused: "Date on the rejection of your representations",
  certificate: "Date on the Charge Certificate",
  recovery: "Date on the Order for Recovery",
  debt: "Date on the latest letter",
  lbc: "Date on the letter before claim",
  claim: "Date of service on the claim form",
};

export default function ParkingClient() {
  const [inp, setInp] = useState<ParkingInputs>(BLANK_PARKING);
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

  const set = <K extends keyof ParkingInputs>(k: K, v: ParkingInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readParking(inp, today), [inp, today]);
  const known = inp.ticket === "council" || inp.ticket === "private";
  const stages = stagesFor(inp.ticket);
  const disc = discountOf(inp);
  const late = keeperNoticeLate(inp);
  const showGrounds = known && inp.stage !== "" && inp.stage !== "certificate" && inp.stage !== "recovery";

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
        {showExample ? <ParkingExample today={today} /> : null}
      </div>

      {/* ---- The ticket ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="parking-what" className={`block ${eyebrow} mb-2`}>
          Where did you park?
        </label>
        <input
          id="parking-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. the retail park on Mill Lane"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Who sent it?</p>
        <Chips<Ticket>
          label="Who issued the ticket"
          value={inp.ticket}
          onPick={(v) => setInp((prev) => ({ ...prev, ticket: v, stage: "", stageOn: "" }))}
          cols={1}
          options={[
            { id: "council", label: "A council: it says Penalty Charge Notice" },
            { id: "private", label: "A company: it says Parking Charge Notice, on private land" },
            { id: "unsure", label: "I can't tell" },
          ]}
        />
        {inp.ticket === "unsure" ? (
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Look at the top and the small print. A council&rsquo;s ticket is a{" "}
            <strong className="font-medium">Penalty</strong>{" "}Charge Notice: it
            names the council, gives a contravention code, and cites the
            Traffic Management Act 2004. A company&rsquo;s is a{" "}
            <strong className="font-medium">Parking</strong> Charge Notice: it
            comes from a limited company, talks about the terms and conditions
            of the car park, and names POPLA or the IAS. Supermarkets, retail
            parks, hospitals and blocks of flats are usually private.
          </p>
        ) : null}
        {known ? (
          <>
            <label htmlFor="parking-issuer" className="block mt-4 text-sm text-[var(--foreground)] mb-2">
              {inp.ticket === "council" ? "Which council?" : "Which company?"}{" "}
              <span className="text-[var(--muted)]">(optional)</span>
            </label>
            <input
              id="parking-issuer"
              type="text"
              value={inp.issuer}
              onChange={(e) => set("issuer", e.target.value)}
              placeholder={inp.ticket === "council" ? "e.g. Leeds City Council" : "The name on the notice"}
              className={inputClass}
            />
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Where was it?</p>
            <Chips<Place>
              label="Where the parking was"
              value={inp.place}
              onPick={(v) => set("place", v)}
              options={[
                { id: "london", label: "London" },
                { id: "england", label: "England, outside London" },
                { id: "wales", label: "Wales" },
                { id: "scotland", label: "Scotland" },
                { id: "ni", label: "Northern Ireland" },
              ]}
            />
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How did it reach you?</p>
            <Chips<How>
              label="How the ticket arrived"
              value={inp.how}
              onPick={(v) => set("how", v)}
              options={[
                { id: "car", label: "On the windscreen, or handed to me" },
                { id: "post", label: "By post, from a camera" },
              ]}
            />
          </>
        ) : null}
      </div>

      {/* ---- Dates and amounts ---- */}
      {known && inp.how ? (
        <div className={card}>
          <p className={eyebrow}>The dates and the amount</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inp.ticket === "private" && inp.how === "post" ? (
              <div>
                <label htmlFor="parking-parked" className="block text-sm text-[var(--foreground)] mb-2">
                  The day you parked
                </label>
                <input
                  id="parking-parked"
                  type="date"
                  value={inp.parkedOn}
                  max={today}
                  onChange={(e) => set("parkedOn", e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : null}
            <div>
              <label htmlFor="parking-issued" className="block text-sm text-[var(--foreground)] mb-2">
                The date on the notice
              </label>
              <input
                id="parking-issued"
                type="date"
                value={inp.issuedOn}
                max={today}
                onChange={(e) => set("issuedOn", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {late === true ? (
            <p className="mt-2 text-xs text-[var(--foreground)] leading-relaxed">
              That&rsquo;s more than 14 days after the parking, counting the
              two working days post is taken to need. That matters: see the read.
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="parking-full" className="block text-sm text-[var(--foreground)] mb-2">
                The full amount
              </label>
              <input
                id="parking-full"
                type="text"
                inputMode="decimal"
                value={inp.full}
                onChange={(e) => set("full", e.target.value)}
                placeholder={inp.ticket === "council" ? "e.g. £70" : "e.g. £100"}
                aria-invalid={moneyInvalid(inp.full)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="parking-discount" className="block text-sm text-[var(--foreground)] mb-2">
                If paid early
              </label>
              <input
                id="parking-discount"
                type="text"
                inputMode="decimal"
                value={inp.discount}
                onChange={(e) => set("discount", e.target.value)}
                placeholder={disc ? money(disc.amount) : inp.ticket === "council" ? "e.g. £35" : "e.g. £60"}
                aria-invalid={moneyInvalid(inp.discount)}
                className={inputClass}
              />
            </div>
          </div>
          {moneyInvalid(inp.full) || moneyInvalid(inp.discount) ? (
            <p className="mt-1.5 text-xs text-[var(--muted)]">{MONEY_BAD}</p>
          ) : null}
          <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
            {inp.ticket === "council"
              ? `Council tickets are halved if paid within ${discountDays(inp)} days. Leave the second box blank for half.`
              : "Private tickets are capped at £100 and usually cut by 40% if paid within 14 days. Leave the second box blank for that."}
          </p>
        </div>
      ) : null}

      {/* ---- Where it's got to ---- */}
      {known && inp.how ? (
        <div className={card}>
          <p className={eyebrow}>Where it&rsquo;s got to</p>
          <div className="mt-3">
            <Chips<Stage>
              label="Where it's got to"
              value={inp.stage}
              onPick={(v) => set("stage", v)}
              cols={1}
              options={stages}
            />
          </div>
          {inp.stage && inp.stage !== "new" && inp.stage !== "waiting" ? (
            <div className="mt-4 sm:max-w-[16rem]">
              <label htmlFor="parking-stage-on" className="block text-sm text-[var(--foreground)] mb-2">
                {STAGE_DATE_LABEL[inp.stage] ?? "Date on the latest letter"}
              </label>
              <input
                id="parking-stage-on"
                type="date"
                value={inp.stageOn}
                max={today}
                onChange={(e) => set("stageOn", e.target.value)}
                className={inputClass}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ---- The grounds ---- */}
      {showGrounds ? (
        <section aria-label="Your grounds" className={card}>
          <p className={eyebrow}>What happened?</p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Pick everything that&rsquo;s true. Be honest: the tool is only
            useful if it tells you when to just pay.
          </p>
          <div role="group" aria-label="Grounds for appeal" className="mt-3 grid grid-cols-1 gap-2">
            {GROUND_OPTIONS.map((o) => {
              const on = inp.grounds.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("grounds", toggleGround(inp.grounds, o.id))}
                  className={`${chipBase} ${on ? chipOn : chipOff}`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          {inp.grounds.length && !inp.grounds.includes("none") ? (
            <>
              <label htmlFor="parking-detail" className="block mt-4 text-sm text-[var(--foreground)] mb-2">
                In a sentence, what happened? <span className="text-[var(--muted)]">(optional)</span>
              </label>
              <textarea
                id="parking-detail"
                value={inp.detail}
                onChange={(e) => set("detail", e.target.value)}
                rows={2}
                placeholder="e.g. Paid £2.40 at the machine at 10:02 for two hours; the registration was keyed with an O for a 0"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                Facts and times, not feelings. It goes into the letter as written.
              </p>
            </>
          ) : null}
          {inp.ticket === "private" ? (
            <>
              <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Who was driving?</p>
              <Chips<Driver>
                label="Who was driving"
                value={inp.driver}
                onPick={(v) => set("driver", v)}
                options={[
                  { id: "me", label: "I was" },
                  { id: "other", label: "Someone else" },
                  { id: "unsaid", label: "I'd rather not say" },
                ]}
              />
              <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
                This stays here. The letters are written as the registered
                keeper and never say who was driving, which you don&rsquo;t
                have to do for a private charge.
              </p>
            </>
          ) : null}
        </section>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? parkingHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} today={today} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say who sent it, where, how it arrived, the date and amount on the
            notice, where it&rsquo;s got to and what happened, and the read
            appears: what appealing costs if you lose, the letter to send, and
            the date for the next step.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_PARKING);
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
        {copied ? "Copied" : "Copy the letter"}
      </button>
    </div>
  );
}

/** The three outcomes side by side: pay now, appeal and win, appeal and lose. */
function Sums({ read }: { read: ParkingRead }) {
  const rows: { label: string; value: number; note?: string }[] = [
    { label: "Pay now", value: read.payNow },
    { label: "Appeal and win", value: 0 },
    {
      label: "Appeal and lose",
      value: read.ifLose,
      note:
        read.extra === 0 && read.extraWorst > 0
          ? `${money(read.payNow + read.extraWorst)} if they don't re-offer the discount`
          : undefined,
    },
  ];
  const free = read.extra === 0;
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What each choice costs</p>
      <ul className="mt-3 divide-y divide-[var(--border)]">
        {rows.map((r) => (
          <li key={r.label} className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--foreground)]">{r.label}</span>
              {r.note ? <span className="block text-xs text-[var(--muted)]">{r.note}</span> : null}
            </span>
            <span className="shrink-0 font-medium text-[var(--foreground)] tabular-nums">{money(r.value)}</span>
          </li>
        ))}
        <li className="py-2.5 flex items-baseline justify-between gap-4 text-sm">
          <span className="font-medium text-[var(--foreground)]">What trying costs</span>
          <span className="shrink-0 font-semibold text-[var(--accent)] tabular-nums">
            {free ? "Nothing" : money(read.extra)}
          </span>
        </li>
      </ul>
      <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
        {free
          ? "Losing costs what paying costs now, so any real ground is worth sending."
          : `Appealing is worth it if your chance of winning is better than ${Math.round(read.breakEven * 100)}%: ${money(read.extra)} at risk to save ${money(read.payNow)}.`}
      </p>
    </div>
  );
}

const ESCALATES: ParkingRead["kind"][] = ["pay", "challenge", "appeal", "wait", "again", "reps", "tribunal", "independent"];

function ReadBlock({ inp, read, today }: { inp: ParkingInputs; read: ParkingRead; today: string }) {
  const [copied, setCopied] = useState<"" | "main" | "line" | "all" | "no">("");
  const rule = parkingRule();
  const main = mainMessage(inp, read);
  const remind = remindOn(read, today);
  const council = read.ticket === "council";
  const showSums = ESCALATES.includes(read.kind) && read.kind !== "wait";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {parkingHeadline(inp, read)}
      </p>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">{parkingBody(inp, read)}</p>

      {showSums ? <Sums read={read} /> : null}

      {main ? (
        <MessageBox
          id="parking-main-msg"
          title={main.title}
          note={
            read.kind === "tribunal"
              ? `Appeal on ${tribunalName(inp)}'s website and paste this in as your reasons. Attach your photos and the council's letters.`
              : read.kind === "independent"
                ? "Paste this into the appeal form on POPLA's or the IAS's website, with the code from the rejection letter. Upload all your evidence with it; you may not get another chance."
                : council
                  ? "Use the council's online form if it has one and paste this in, or post it with proof of posting. Fill in the square brackets and keep a copy."
                  : "Use the company's online appeal form if it has one and paste this in, or email or post it. Fill in the square brackets and keep a copy."
          }
          text={main.text}
          copied={copied === "main"}
          onCopy={async () => setCopied((await copyText(main.text)) ? "main" : "no")}
        />
      ) : null}

      {read.discountEnds ? (
        <p className="mt-4 text-sm text-[var(--foreground)]">
          The discount ends: <span className="font-medium">{actDate(read.discountEnds)}</span>
        </p>
      ) : null}
      {read.actBy && read.actBy !== read.discountEnds ? (
        <p className="mt-2 text-sm text-[var(--foreground)]">
          Last day for the next step: <span className="font-medium">{actDate(read.actBy)}</span>
        </p>
      ) : null}
      {remind ? (
        <button type="button" onClick={() => downloadIcs(inp, remind)} className={`mt-2 ${action}`}>
          Add {actDate(remind.on)} to your calendar (.ics)
        </button>
      ) : null}
      {read.discountAssumed && showSums ? (
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          The early amount is assumed ({council ? "half" : "40% off"}). Put the
          figure from the notice in, if it&rsquo;s different.
        </p>
      ) : null}

      {ESCALATES.includes(read.kind) ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>If you ignore it</p>
          <ol className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-decimal pl-5">
            {council ? (
              <>
                <li>After 28 days, a Notice to Owner: the full {money(read.full)}.</li>
                <li>28 days after that, a Charge Certificate: {money(read.full * 1.5)}, and no more right to appeal.</li>
                <li>14 days later, it&rsquo;s registered as a debt with a court fee, then bailiffs, whose fees start at £75.</li>
              </>
            ) : (
              <>
                <li>Reminders, then a debt collector adding a fee of up to £70.</li>
                <li>A letter before claim: 30 days to reply.</li>
                <li>A court claim. Ignored, it becomes a CCJ on your credit file for six years.</li>
              </>
            )}
          </ol>
        </div>
      ) : null}

      {main ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>The evidence to send with it</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)] leading-relaxed list-disc pl-5">
            {evidenceLines(inp).map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 text-xs text-[var(--muted)] leading-relaxed">
        Not legal advice. Councils and operators differ on whether the discount
        is held during an appeal; the notice or their website says. Dates here
        count the day on the letter as day one, so they&rsquo;re never later
        than the real deadline. A new government code for private parking was
        laid before Parliament on 20 October 2026 and isn&rsquo;t in force yet;
        charges are judged under the rules on the day you parked. Citizens
        Advice gives free help.
      </p>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Next time, in a car park you don&rsquo;t know: photograph the sign at
          the entrance and keep the ticket or the app&rsquo;s screen until the
          month is out.
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
            onClick={async () => setCopied((await copyText(parkingSummary(inp, read))) ? "all" : "no")}
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

function Handoffs({ inp }: { inp: ParkingInputs }) {
  const list: Handoff[] = [
    {
      href: withSubject("/scam", "a text about an unpaid parking fine"),
      label: "A text says you owe a parking fine?",
      note: "Fake parking and toll texts are common. Councils and operators write by post; check before you click or pay.",
    },
    {
      href: withSubject("/rule", inp.what),
      label: "Make it a standing rule",
      note: "Photo of the sign on the way in, the receipt kept for a month. Decide it once.",
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
        <Link href="/writing/what-does-losing-cost" className={link}>
          What does losing cost?
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
function ParkingExample({ today }: { today: string }) {
  const ex = parkingExample(today);
  const read = readParking(ex, today);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Two hours at a retail park, paid at the machine. Fifteen days later, a
        letter from the parking company with a photo of my number plate: £100,
        or £60 if paid within 14 days. I&rsquo;d keyed an O for a 0 in the
        registration. My hand was on the card to pay the £60.
      </p>
      <Sums read={read} />
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {parkingHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Two things I didn&rsquo;t know. The company would re-offer the £60 if
          it rejected my appeal, so trying cost nothing. And the letter was
          dated fifteen days after the visit, so it reached me too late for the
          company to hold me liable as the keeper. I sent the appeal with the
          receipt photo. The charge was cancelled nine days later.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}ticket.
      </p>
    </div>
  );
}
