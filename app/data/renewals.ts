/**
 * Dated renewal checks (`renewals:v1`): the free trials you're tracking, and the
 * subscriptions /keep told you to look at again.
 *
 * A free trial is a subscription whose default has already been chosen for
 * you: unless you act, it becomes a payment. Defaults are among the most
 * powerful things in choice architecture. Eric Johnson and Daniel Goldstein
 * (Science, 2003) found organ-donor consent near universal in countries where
 * it was the default and far lower where people had to opt in; Brigitte Madrian
 * and Dennis Shea (QJE, 2001) found automatic enrolment raised pension
 * participation among new hires from under half to over 85%. A trial is the
 * same lever pointed at your card.
 *
 * Klaus Miller, Navdeep Sahni and Avner Strulov-Shlain ran the cleanest test of
 * it: about two million readers of a European newspaper randomly offered trials
 * that either renewed automatically or ended on their own. Around half the
 * people who took an auto-renewing trial were inert (they kept paying because
 * they didn't act, not because they chose to), and they barely read the paper.
 * Many readers knew this about themselves and avoided auto-renewing offers
 * altogether, which cut sign-ups by about a quarter.
 *
 * So the useful move isn't more willpower at the end of the trial. It's to
 * change the default at the start: cancel the same day if the service lets you
 * keep the free time, or put the cancel-by date where it will fire, with the
 * decision waiting for you, before you enter the card number.
 *
 * /keep has the same problem one step later. Its "cancel and see if you miss
 * it" and "keep it for now, set a date" reads both end in a date, and until
 * today that date lived only in the copy ("put a date in your diary"). Those
 * returns ride in this store too, so the return desk (`/review`) brings all of
 * them back on their day.
 *
 * Kinds:
 *   "trial" — a free trial; comes back on its cancel-by date at /trial.
 *   "test"  — cancelled to see if you'd miss it; comes back at /keep.
 *   "hold"  — kept for now because leaving would lose something; comes back
 *             at /keep to ask the fresh-start question again.
 *
 * Mirrors parked.ts and tripwires.ts: one module owns the list, normalises
 * defensively, and the return desk, the due badge and the backup read it.
 * Pure data and functions, no React, so the reads can be checked by a script.
 * Nothing is sent anywhere.
 */

import { formatMoney, parseMoney } from "./worth";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "./ics";
import type { Period } from "./keep";

export const RENEWALS_KEY = "renewals:v1";

export type RenewalKind = "trial" | "test" | "hold";
/** If you cancel today, do you keep the free time? */
export type Access = "" | "keeps" | "ends" | "unsure";
/** At sign-up, before using it: do you expect to pay for it afterwards? */
export type Expect = "" | "pay" | "not" | "unsure";
/**
 * How it ended.
 *   kept      — you'd sign up again at the price, so it carries on.
 *   cancelled — you cancelled it in time (or at once).
 *   charged   — the first payment went out before you got to it.
 *   missed    — a /keep test: you missed it and rejoined.
 *   gone      — a /keep test: you didn't notice it had gone.
 */
export type Outcome = "" | "kept" | "cancelled" | "charged" | "missed" | "gone";

export type Renewal = {
  id: string;
  kind: RenewalKind;
  /** What it is: "Language app", "Gym". */
  name: string;
  /** The price it turns into, as typed ("£12.99"). */
  price: string;
  period: Period;
  /** ISO date it was set up. */
  startedOn: string;
  /** Trials: the date the first payment lands. Others: "". */
  chargeOn: string;
  /** ISO date it comes back on the return desk. */
  checkOn: string;
  access: Access;
  expect: Expect;
  /** /keep rows only: the row's id, so the row can show it's already dated. */
  ref: string;
  /** ISO date it was answered ("" = still waiting). */
  resolvedOn: string;
  outcome: Outcome;
};

export function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Same day next month (or the month's last day when it's shorter). */
export function addMonthsISO(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(new Date(`${s}T00:00:00`).getTime());
}

/** "Wednesday 29 October": a date to act on, in words. */
export function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function daysFrom(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/**
 * How many days before the first charge to cancel. Two: app stores ask for a
 * day's notice, and a charge can land early in the morning or on another time
 * zone's clock. A day spare costs nothing; a day short costs the first payment.
 */
export const CANCEL_MARGIN_DAYS = 2;

/** The date to cancel by: two days before the first charge, never before today. */
export function cancelByISO(chargeOn: string, today = todayISO()): string {
  if (!isISODate(chargeOn)) return "";
  const by = addDaysISO(chargeOn, -CANCEL_MARGIN_DAYS);
  return by < today ? today : by;
}

// ---------------------------------------------------------------------------
// The read at sign-up (pure)
// ---------------------------------------------------------------------------

export type TrialDraft = {
  name: string;
  price: string;
  period: Period;
  chargeOn: string;
  access: Access;
  expect: Expect;
};

export const BLANK_DRAFT: TrialDraft = {
  name: "",
  price: "",
  period: "month",
  chargeOn: "",
  access: "",
  expect: "",
};

export type TrialReadKind =
  /** Cancelling keeps the free time: cancel today. */
  | "now"
  /** Cancelling ends it, or you don't know: date it. */
  | "date"
  /** The charge is today or tomorrow: there's no margin left. */
  | "urgent"
  /** The date has already passed. */
  | "past";

export type TrialRead = {
  kind: TrialReadKind;
  cancelBy: string;
  /** Days from today to the first charge. */
  daysLeft: number;
  /** The first payment, or null if no readable price. */
  first: number | null;
  /** What it would cost a year if it ran on. */
  yearly: number | null;
};

const PER_YEAR: Record<Period, number> = { month: 12, year: 1, week: 52 };
const PERIOD_WORD: Record<Period, string> = { month: "a month", year: "a year", week: "a week" };

export function draftCurrency(price: string): string {
  const m = price.match(/[£$€]/);
  return m ? m[0] : "£";
}

/** The read, or null until there's a charge date. */
export function readTrial(d: TrialDraft, today = todayISO()): TrialRead | null {
  if (!isISODate(d.chargeOn)) return null;
  const daysLeft = daysFrom(today, d.chargeOn);
  const p = parseMoney(d.price);
  const first = p !== null && p > 0 ? p : null;
  const yearly = first === null ? null : first * PER_YEAR[d.period];
  const cancelBy = cancelByISO(d.chargeOn, today);
  const base = { cancelBy, daysLeft, first, yearly };
  if (daysLeft < 0) return { kind: "past", ...base };
  if (d.access === "keeps") return { kind: "now", ...base };
  if (daysLeft <= 1) return { kind: "urgent", ...base };
  return { kind: "date", ...base };
}

function trialName(d: { name: string }): string {
  const s = d.name.trim().replace(/[.!?\s]+$/, "");
  return s || "the trial";
}

/** "£12.99 a month", or "" when there's no readable price. */
export function priceText(price: string, period: Period): string {
  const p = parseMoney(price);
  return p === null || p <= 0 ? "" : `${formatMoney(p, draftCurrency(price))} ${PERIOD_WORD[period]}`;
}

/** The answer in a few words: printed largest and spoken. */
export function trialHeadline(r: TrialRead): string {
  switch (r.kind) {
    case "now":
      return "Cancel it today. You keep the free time, and nothing renews.";
    case "urgent":
      return "Cancel it today. There's no margin left.";
    case "past":
      return "That date has passed. Check whether it has charged you.";
    case "date":
      return `Cancel by ${prettyDate(r.cancelBy)}.`;
  }
}

/** The sentence under the headline that says why. */
export function trialWhy(d: TrialDraft, r: TrialRead): string {
  const cur = draftCurrency(d.price);
  const becomes = priceText(d.price, d.period);
  const charge = prettyDate(d.chargeOn);
  switch (r.kind) {
    case "now":
      return `That flips the default. Instead of ${trialName(d)} turning into a payment unless you act, it ends unless you choose it. If you'd pay for it at the end, signing up again takes a minute, and that's a decision you make, not one made for you.`;
    case "urgent":
      return `The first payment lands ${r.daysLeft === 0 ? "today" : "tomorrow"}${becomes ? `, at ${becomes}` : ""}. If you'd pay for it, keep it. If you're not sure, cancel now: you can sign up again later, and you can't easily take the payment back.`;
    case "past":
      return `The first charge was due on ${charge}. Look at your statement or the account page. If it has charged and you haven't used it since, ask for a refund straight away: many services give one when asked promptly. Then cancel.`;
    case "date": {
      const lead = `The first payment${r.first !== null ? ` of ${formatMoney(r.first, cur)}` : ""} lands on ${charge}. Cancelling two days early covers app stores that want a day's notice and charges that land early in the morning.`;
      const tail =
        d.access === "ends"
          ? " Cancelling ends the free time here, so you can't cancel today without losing it; the date has to do the work instead."
          : " Check now whether cancelling ends the free time: the cancel screen usually says before you confirm. If it doesn't end it, cancel today and the problem goes away.";
      return lead + tail;
    }
  }
}

/** What forgetting would cost, or null without a price. */
export function forgetCost(d: TrialDraft, r: TrialRead): string | null {
  if (r.first === null || r.yearly === null) return null;
  const cur = draftCurrency(d.price);
  if (d.period === "year") {
    return `Forgetting costs ${formatMoney(r.first, cur)} in one go, for a year you didn't choose.`;
  }
  return `Forgetting costs ${formatMoney(r.first, cur)} on ${prettyDate(d.chargeOn)}, then the same ${d.period === "week" ? "every week" : "every month"} until you notice: ${formatMoney(r.yearly, cur)} if it runs a year.`;
}

/** A note on the sign-up forecast, or null when none was given. */
export function expectNote(d: TrialDraft): string | null {
  switch (d.expect) {
    case "pay":
      return "You expect to pay for it. Then the date is for checking that you were right, at the price, for the use you actually got.";
    case "not":
      return "You don't expect to pay for it. That's exactly the trial that charges people: there's no reason to look at it again until the money's gone.";
    case "unsure":
      return "You don't know yet. That's what the trial is for; the date is when you'll know.";
    default:
      return null;
  }
}

/** The standing rule. */
export function trialRule(): string {
  return "My rule for free trials: before I enter the card number, I find out whether cancelling ends the free time. If it doesn't, I cancel the same day. If it does, the cancel-by date goes in my calendar before the trial starts.";
}

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------

const KINDS: RenewalKind[] = ["trial", "test", "hold"];
const PERIODS: Period[] = ["month", "year", "week"];
const ACCESS: Access[] = ["keeps", "ends", "unsure"];
const EXPECTS: Expect[] = ["pay", "not", "unsure"];
const OUTCOMES: Outcome[] = ["kept", "cancelled", "charged", "missed", "gone"];

function oneOf<T extends string>(v: unknown, list: T[], fallback: T): T {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : fallback;
}

/** Defensive normalisation: anything malformed degrades instead of throwing. */
export function mergeRenewal(raw: unknown): Renewal {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string) : "");
  const date = (k: string) => (isISODate(str(k)) ? str(k) : "");
  return {
    id: str("id") || `rn-${Math.random().toString(36).slice(2, 10)}`,
    kind: oneOf(r.kind, KINDS, "trial"),
    name: str("name"),
    price: str("price"),
    period: oneOf(r.period, PERIODS, "month"),
    startedOn: date("startedOn") || todayISO(),
    chargeOn: date("chargeOn"),
    checkOn: date("checkOn"),
    access: oneOf<Access>(r.access, ACCESS, ""),
    expect: oneOf<Expect>(r.expect, EXPECTS, ""),
    ref: str("ref"),
    resolvedOn: date("resolvedOn"),
    outcome: oneOf<Outcome>(r.outcome, OUTCOMES, ""),
  };
}

/** Read the list. [] on the server and on malformed storage. */
export function loadRenewals(): Renewal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RENEWALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const out: Renewal[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const r = mergeRenewal(item);
      // A return with no date can never come back; drop it rather than let it
      // sit uncounted in the list forever.
      if (!r.checkOn || seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  } catch {
    return [];
  }
}

export function saveRenewals(list: Renewal[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RENEWALS_KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked — the tool stays usable, just not durable */
  }
}

export type NewRenewal = {
  kind: RenewalKind;
  name: string;
  price: string;
  period: Period;
  chargeOn?: string;
  checkOn: string;
  access?: Access;
  expect?: Expect;
  ref?: string;
  /** Already answered at creation (a trial cancelled the same day). */
  outcome?: Outcome;
};

/** Add one and persist. Newest first. */
export function addRenewal(input: NewRenewal): Renewal {
  const today = todayISO();
  const r = mergeRenewal({
    ...input,
    name: input.name.trim(),
    price: input.price.trim(),
    startedOn: today,
    resolvedOn: input.outcome ? today : "",
    outcome: input.outcome ?? "",
  });
  saveRenewals([r, ...loadRenewals()]);
  return r;
}

export function answerRenewal(id: string, outcome: Outcome): void {
  const today = todayISO();
  saveRenewals(
    loadRenewals().map((r) => (r.id === id ? { ...r, outcome, resolvedOn: outcome ? today : "" } : r))
  );
}

export function deleteRenewal(id: string): void {
  saveRenewals(loadRenewals().filter((r) => r.id !== id));
}

export function findRenewal(id: string): Renewal | null {
  return loadRenewals().find((r) => r.id === id) ?? null;
}

/** The open /keep return for a row, if there is one. */
export function openRenewalFor(ref: string, name: string): Renewal | null {
  return (
    loadRenewals().find(
      (r) => r.kind !== "trial" && !r.resolvedOn && r.ref === ref && r.name.trim() === name.trim()
    ) ?? null
  );
}

export function isDueRenewal(r: Renewal, today = todayISO()): boolean {
  return !r.resolvedOn && !!r.checkOn && r.checkOn <= today;
}

export function isUpcomingRenewal(r: Renewal, today = todayISO()): boolean {
  return !r.resolvedOn && !!r.checkOn && r.checkOn > today;
}

/** Where you go to answer it. */
export function renewalHref(r: Renewal): string {
  return `${r.kind === "trial" ? "/trial" : "/keep"}?check=${encodeURIComponent(r.id)}`;
}

/** The handle shown on the desk and in the calendar. */
export function renewalTitle(r: Renewal): string {
  const name = r.name.trim() || (r.kind === "trial" ? "A free trial" : "A subscription");
  switch (r.kind) {
    case "trial":
      return `Free trial ends: ${name}`;
    case "test":
      return `Did you miss it? ${name}`;
    case "hold":
      return `Still worth it? ${name}`;
  }
}

/** The question waiting for you on the day. */
export function renewalQuestion(r: Renewal): string {
  const price = priceText(r.price, r.period);
  const at = price ? ` at ${price}` : "";
  switch (r.kind) {
    case "trial":
      return `Would you sign up for it today${at}, for the use you've actually had from it? If not, cancel it before ${r.chargeOn ? prettyDate(r.chargeOn) : "the first charge"}.`;
    case "test":
      return "You cancelled it to see if you'd miss it. Did you?";
    case "hold":
      return `You kept it because leaving would lose something. Would you sign up today${at}?`;
  }
}

export type ScheduledRenewal = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  checkOn: string;
  href: string;
};

function toScheduled(r: Renewal): ScheduledRenewal {
  const price = priceText(r.price, r.period);
  return {
    id: r.id,
    title: renewalTitle(r),
    detail: renewalQuestion(r),
    meta:
      r.kind === "trial"
        ? `${price ? `becomes ${price}` : "a free trial"}${r.chargeOn ? `, first charge ${r.chargeOn}` : ""}`
        : r.kind === "test"
          ? "cancelled to see if you'd miss it"
          : `kept for now${price ? ` at ${price}` : ""}`,
    checkOn: r.checkOn,
    href: renewalHref(r),
  };
}

export function dueRenewalItems(today = todayISO()): ScheduledRenewal[] {
  return loadRenewals().filter((r) => isDueRenewal(r, today)).map(toScheduled);
}

export function upcomingRenewalItems(today = todayISO()): ScheduledRenewal[] {
  return loadRenewals().filter((r) => isUpcomingRenewal(r, today)).map(toScheduled);
}

export function countDueRenewals(): number {
  const today = todayISO();
  return loadRenewals().filter((r) => isDueRenewal(r, today)).length;
}

/** Still waiting — the backup nudge's denominator. */
export function countRenewals(): number {
  return loadRenewals().filter((r) => !r.resolvedOn).length;
}

export function countRenewalsCreatedAfter(iso: string): number {
  return loadRenewals().filter((r) => r.startedOn > iso).length;
}

/** Open trials, soonest first, for /trial's own list. */
export function openTrials(): Renewal[] {
  return loadRenewals()
    .filter((r) => r.kind === "trial" && !r.resolvedOn)
    .sort((a, b) => a.checkOn.localeCompare(b.checkOn));
}

export type TrialRecord = {
  /** Trials answered. */
  ended: number;
  kept: number;
  cancelled: number;
  charged: number;
  /** Of the answered trials with a forecast, how many you expected to pay for. */
  forecast: number;
  expectedPay: number;
  /** Of those same trials, how many you actually kept. */
  keptOfForecast: number;
};

/** Your own record with trials: how they ended, against what you expected. */
export function trialRecord(list: Renewal[] = loadRenewals()): TrialRecord {
  const ended = list.filter((r) => r.kind === "trial" && !!r.resolvedOn);
  const withForecast = ended.filter((r) => r.expect === "pay" || r.expect === "not");
  return {
    ended: ended.length,
    kept: ended.filter((r) => r.outcome === "kept").length,
    cancelled: ended.filter((r) => r.outcome === "cancelled").length,
    charged: ended.filter((r) => r.outcome === "charged").length,
    forecast: withForecast.length,
    expectedPay: withForecast.filter((r) => r.expect === "pay").length,
    keptOfForecast: withForecast.filter((r) => r.outcome === "kept").length,
  };
}

/** The record in a sentence, or null with nothing answered yet. */
export function trialRecordText(t: TrialRecord): string | null {
  if (t.ended === 0) return null;
  const parts = [`${t.kept} kept`, `${t.cancelled} cancelled`];
  if (t.charged > 0) parts.push(`${t.charged} charged before you got to ${t.charged === 1 ? "it" : "them"}`);
  const head = `Of the ${t.ended === 1 ? "one trial" : `${t.ended} trials`} you've tracked to the end: ${parts.join(", ")}.`;
  if (t.forecast < 2) return head;
  return `${head} At sign-up you expected to pay for ${t.expectedPay} of the ${t.forecast} you made a guess about; you kept ${t.keptOfForecast}.`;
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

/**
 * One reminder as a calendar file: a short event at 9am on the check date with
 * an alarm, linking straight to the screen where you answer it. Returns "" for
 * a record without a usable date.
 */
export function renewalCalendar(r: Renewal): string {
  if (!isISODate(r.checkOn)) return "";
  const day = r.checkOn.replace(/-/g, "");
  const url = `${SITE_URL}${renewalHref(r)}`;
  const desc = [
    renewalQuestion(r),
    r.kind === "trial" && r.chargeOn ? `\n\nFirst charge: ${prettyDate(r.chargeOn)}.` : "",
    `\n\nAnswer it: ${url}`,
  ].join("");
  const event = [
    "BEGIN:VEVENT",
    `UID:renewal-${r.id.replace(/[^a-zA-Z0-9_-]/g, "-")}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART:${day}T090000`,
    `DTEND:${day}T091500`,
    `SUMMARY:${icsEscape(renewalTitle(r))}`,
    `DESCRIPTION:${icsEscape(desc)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(renewalTitle(r))}`,
    "TRIGGER:-PT0M",
    "END:VALARM",
    "END:VEVENT",
  ];
  return wrapCalendar([event], "Renewals");
}

// ---------------------------------------------------------------------------
// The worked example
// ---------------------------------------------------------------------------

/**
 * A 14-day trial of a language app that becomes £12.99 a month, started on a
 * Sunday. Fixed dates so the example reads the same every day.
 */
export const TRIAL_EXAMPLE = {
  today: "2026-10-18",
  draft: {
    name: "Language app",
    price: "£12.99",
    period: "month" as Period,
    chargeOn: "2026-11-01",
    access: "ends" as Access,
    expect: "pay" as Expect,
  },
};
