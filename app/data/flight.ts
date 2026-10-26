/**
 * The read behind "Flight Delayed or Cancelled" (/flight).
 *
 * The board says delayed, then delayed again, then cancelled. Hours later
 * you're home or at the hotel, and the airline's email says it was
 * "extraordinary circumstances". Most people stop there, or hand a quarter or
 * more of the payout to a claims company to do what is, underneath, one form.
 *
 *   - The rules are fixed amounts, not a negotiation. UK261 (Regulation (EC)
 *     261/2004 as kept in UK law) and EU261 pay a flat sum per passenger by
 *     distance: £220 / £350 / £520 (EU: €250 / €400 / €600) for flights up to
 *     1,500 km, 1,500–3,500 km and over 3,500 km. Within the EU, every flight
 *     over 1,500 km gets the middle amount.
 *   - Delay counts from arrival at the final destination, when the doors open,
 *     and the cash starts at three hours (Sturgeon v Condor, CJEU, 2009). For
 *     flights over 3,500 km, three to four hours late is half (£260 / €300).
 *   - A cancellation pays the same unless you were told at least 14 days ahead,
 *     or the new flight kept close to the old times: with 7–13 days' notice,
 *     leaving no more than two hours early and arriving less than four hours
 *     late; with under seven days, no more than one hour early and less than
 *     two hours late (Article 5). If the new flight still got you there within
 *     2 / 3 / 4 hours of the original (by distance), the airline may halve it
 *     (Article 7(2)). Being bumped against your will pays the same way.
 *   - "Extraordinary circumstances" (weather, air traffic control, a strike by
 *     someone else, a bird strike, security) excuse the cash, not the care. A
 *     technical fault is part of running an airline and is not extraordinary
 *     (Huzar v Jet2, Court of Appeal, 2014; van der Lans v KLM, CJEU, 2015).
 *     Nor is a strike by the airline's own staff (Krüsemann v TUIfly, 2018;
 *     SAS, 2021). The airline has to prove it, and the reason in the first
 *     email is often the reason that loses.
 *   - Who's covered: any flight leaving the UK or the EU, whatever the airline;
 *     a flight into the UK from outside on a UK or EU airline (UK261); a
 *     flight into the EU from outside on an EU airline (EU261).
 *   - Claims run six years in England, Wales and Northern Ireland, five in
 *     Scotland; in the EU it depends on the country. After eight weeks, or a
 *     final "deadlock" reply, a UK claim can go to the airline's approved ADR
 *     scheme or the CAA, free; an EU one to the national enforcement body.
 *     Small claims court is always there.
 *
 * So the tool does the sum, writes the claim (citing the case that answers the
 * reason they gave), sets the reply-by date and the day the free escalation
 * opens, and lists what you were owed at the airport whether or not the cash
 * is due. The same idea as /refund: ask once, in writing, for one amount, by
 * a date, and decide the next step before the first message goes.
 *
 * The read, checked in order:
 *   1. "outside"  — neither UK nor EU rules reach this flight.
 *   2. "under"    — covered, but no cash: under three hours, two weeks'
 *                   notice, or a new flight close enough to the old one.
 *   3. "excused"  — the reason given is likely extraordinary: ask them to
 *                   name it, claim expenses.
 *   4. "old"      — more than six years ago.
 *   5. "ask"      — not claimed yet: the claim.
 *   6. "wait"     — claimed, inside the eight weeks.
 *   7. "escalate" — refused, or eight weeks of silence: ADR, the CAA, the
 *                   national body, or small claims.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";
import { actDate, addDaysISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, todayISO };

export type Problem = "" | "delay" | "cancel" | "bumped";
export type Place = "" | "uk" | "eu" | "other";
export type Carrier = "" | "uk" | "eu" | "other";
export type Band = "" | "short" | "medium" | "long";
/** How late you got to the final destination. "none": you didn't travel. */
export type Late = "" | "lt2" | "2to3" | "3to4" | "4plus" | "none";
export type Notice = "" | "14plus" | "7to13" | "lt7";
/** How much earlier than the original the replacement flight left. */
export type Early = "" | "no" | "1to2" | "over2";
export type Reason = "" | "tech" | "staff" | "knock" | "weather" | "atc" | "other" | "unknown";
export type Stage = "" | "none" | "asked" | "refused" | "ignored";

export type FlightInputs = {
  /** The flight, in a few words: "the 7:05 to Faro". */
  what: string;
  airline: string;
  problem: Problem;
  from: Place;
  to: Place;
  carrier: Carrier;
  band: Band;
  late: Late;
  notice: Notice;
  early: Early;
  reason: Reason;
  /** ISO date of the flight. */
  flown: string;
  /** Passengers on the booking, as typed. */
  pax: string;
  /** What you spent on food, a hotel or transport while you waited, as typed. */
  spent: string;
  stage: Stage;
  askedOn: string;
};

export const BLANK_FLIGHT: FlightInputs = {
  what: "",
  airline: "",
  problem: "",
  from: "",
  to: "",
  carrier: "",
  band: "",
  late: "",
  notice: "",
  early: "",
  reason: "",
  flown: "",
  pax: "",
  spent: "",
  stage: "",
  askedOn: "",
};

export type Regime = "uk" | "eu" | "none";
export type FlightKind = "outside" | "under" | "excused" | "old" | "ask" | "wait" | "escalate";
/** Why there's no cash, when there isn't. */
export type Under = "" | "short-delay" | "notice" | "rerouted";

export type FlightRead = {
  kind: FlightKind;
  regime: Regime;
  under: Under;
  /** Compensation per passenger, before any excuse. 0 when none is due. */
  each: number;
  /** True when the amount is the halved one. */
  halved: boolean;
  pax: number;
  /** Compensation for everyone on the booking. */
  total: number;
  /** Expenses to claim back, when typed. */
  spent: number | null;
  /** ISO date the airline should pay by. "" when there's no claim in play. */
  replyBy: string;
  /** ISO date the free escalation opens: eight weeks after the claim. */
  escalateFrom: string;
};

/** Days to ask the airline to pay within: the same 14 as /refund's letters. */
export const PAY_DAYS = 14;
/** ADR schemes and the CAA take a claim after eight weeks without a final answer. */
export const ESCALATE_DAYS = 56;
/** Claims run six years in England, Wales and Northern Ireland. */
export const LIMIT_YEARS = 6;

const AMOUNTS: Record<"uk" | "eu", [number, number, number]> = {
  uk: [220, 350, 520],
  eu: [250, 400, 600],
};

export function currencyOf(regime: Regime): string {
  return regime === "eu" ? "€" : "£";
}

export function regimeOf(inp: FlightInputs): Regime {
  if (inp.from === "uk") return "uk";
  if (inp.from === "eu") return "eu";
  if (inp.from === "other") {
    if (inp.to === "uk" && (inp.carrier === "uk" || inp.carrier === "eu")) return "uk";
    if (inp.to === "eu" && inp.carrier === "eu") return "eu";
  }
  return "none";
}

/** The full amount per passenger for this distance under these rules. */
export function fullAmount(inp: FlightInputs, regime: Regime): number {
  if (regime === "none" || !inp.band) return 0;
  let i = inp.band === "short" ? 0 : inp.band === "medium" ? 1 : 2;
  // Article 7(1)(b): every flight within the EU over 1,500 km gets the middle amount.
  if (regime === "eu" && inp.from === "eu" && inp.to === "eu" && i === 2) i = 1;
  return AMOUNTS[regime][i];
}

/** Hours of lateness inside which a rerouted arrival lets the airline halve the amount. */
function withinHalf(band: Band, late: Late): boolean {
  if (late === "lt2") return true;
  if (late === "2to3") return band === "medium" || band === "long";
  if (late === "3to4") return band === "long";
  return false;
}

/** Article 5(1)(c): a cancellation with a new flight close enough to the old one pays nothing. */
function rerouteExempt(inp: FlightInputs): boolean {
  if (inp.late === "none" || inp.late === "4plus") return false;
  if (inp.notice === "7to13") return inp.early !== "over2";
  if (inp.notice === "lt7") return inp.early === "no" && inp.late === "lt2";
  return false;
}

export function paxOf(inp: FlightInputs): number {
  const n = Number.parseInt(inp.pax.trim(), 10);
  return Number.isFinite(n) && n >= 1 && n <= 20 ? n : 1;
}

/** True when the read has what it needs. */
export function flightReady(inp: FlightInputs): boolean {
  if (!inp.problem || !inp.from || !inp.to) return false;
  if (inp.from === "other" && inp.to !== "other" && !inp.carrier) return false;
  if (regimeOf(inp) === "none") return true;
  if (inp.problem === "cancel" && !inp.notice) return false;
  if (!inp.band) return false;
  if (!inp.late && !(inp.problem === "cancel" && inp.notice === "14plus")) return false;
  if (inp.problem === "delay" && inp.late === "none") return false;
  if (inp.problem === "cancel" && inp.notice !== "14plus" && inp.late !== "none" && inp.late !== "4plus" && !inp.early) return false;
  if (inp.problem !== "bumped" && !inp.reason) return false;
  return isISODate(inp.flown) && Boolean(inp.stage);
}

function excusedReason(r: Reason): boolean {
  return r === "weather" || r === "atc" || r === "other";
}

export function readFlight(inp: FlightInputs, today = todayISO()): FlightRead | null {
  if (!flightReady(inp)) return null;
  const regime = regimeOf(inp);
  const pax = paxOf(inp);
  const spent = parseMoney(inp.spent);
  const base: FlightRead = {
    kind: "outside",
    regime,
    under: "",
    each: 0,
    halved: false,
    pax,
    total: 0,
    spent: spent && spent > 0 ? spent : null,
    replyBy: "",
    escalateFrom: "",
  };
  if (regime === "none") return base;

  const full = fullAmount(inp, regime);
  let each = full;
  let halved = false;
  let under: Under = "";
  if (inp.problem === "delay") {
    if (inp.late === "lt2" || inp.late === "2to3") under = "short-delay";
    else if (inp.late === "3to4" && inp.band === "long") halved = true;
  } else if (inp.problem === "cancel") {
    if (inp.notice === "14plus") under = "notice";
    else if (rerouteExempt(inp)) under = "rerouted";
    else if (inp.late !== "none" && withinHalf(inp.band, inp.late)) halved = true;
  } else if (inp.late !== "none" && withinHalf(inp.band, inp.late)) {
    halved = true;
  }
  if (under) each = 0;
  else if (halved) each = full / 2;
  const read: FlightRead = { ...base, each, halved, under, total: each * pax };

  if (under) {
    read.kind = "under";
    return read;
  }
  if (inp.problem !== "bumped" && excusedReason(inp.reason)) {
    read.kind = "excused";
    read.replyBy = addDaysISO(today, PAY_DAYS);
    return read;
  }
  const flown = inp.flown > today ? today : inp.flown;
  if (addDaysISO(flown, Math.round(LIMIT_YEARS * 365.25)) < today) {
    read.kind = "old";
    return read;
  }
  const asked = isISODate(inp.askedOn) ? (inp.askedOn > today ? today : inp.askedOn) : "";
  if (inp.stage === "none") {
    read.kind = "ask";
    read.replyBy = addDaysISO(today, PAY_DAYS);
    read.escalateFrom = addDaysISO(today, ESCALATE_DAYS);
  } else if ((inp.stage === "asked" || inp.stage === "ignored") && (asked ? addDaysISO(asked, ESCALATE_DAYS) > today : inp.stage === "asked")) {
    read.kind = "wait";
    read.replyBy = asked ? addDaysISO(asked, PAY_DAYS) : "";
    read.escalateFrom = asked ? addDaysISO(asked, ESCALATE_DAYS) : "";
  } else {
    read.kind = "escalate";
    read.escalateFrom = today;
  }
  return read;
}

function money(n: number, regime: Regime): string {
  return formatMoney(n, currencyOf(regime));
}

function capital(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function bandWords(band: Band): string {
  if (band === "short") return "up to 1,500 km";
  if (band === "medium") return "between 1,500 and 3,500 km";
  return "over 3,500 km";
}

function lateWords(late: Late): string {
  switch (late) {
    case "lt2":
      return "less than two hours";
    case "2to3":
      return "between two and three hours";
    case "3to4":
      return "between three and four hours";
    case "4plus":
      return "more than four hours";
    default:
      return "";
  }
}

function noticeWords(n: Notice): string {
  if (n === "7to13") return "between seven and thirteen days before departure";
  if (n === "lt7") return "less than seven days before departure";
  return "at least two weeks before departure";
}

/** The rules, in the words that go in a letter. */
export function lawName(regime: Regime): string {
  return regime === "uk"
    ? "Regulation (EC) No 261/2004 as it applies in UK law (UK261)"
    : "Regulation (EC) No 261/2004 (EU261)";
}

/** The answer to the reason they gave, when there's a case for it. */
export function reasonLine(inp: FlightInputs): string {
  switch (inp.reason) {
    case "tech":
      return "You've said the cause was a technical problem. Technical faults that arise in the normal running of an airline are not extraordinary circumstances (Jet2.com v Huzar, Court of Appeal, 2014; van der Lans v KLM, CJEU, C-257/14, 2015).";
    case "staff":
      return "You've said the cause was crew availability or industrial action by your own staff. Those are within an airline's control and are not extraordinary circumstances (Krüsemann v TUIfly, CJEU, C-195/17, 2018; SAS, CJEU, C-28/20, 2021).";
    case "knock":
      return "You've said the aircraft was late from an earlier flight. A knock-on delay only counts as extraordinary if the earlier delay was itself caused by extraordinary circumstances, which you would need to show, along with the reasonable measures you took.";
    case "weather":
    case "atc":
    case "other":
      return `If you consider that extraordinary circumstances applied, please tell me specifically what they were, how they caused the ${inp.problem === "cancel" ? "cancellation of" : "delay to"} this flight, and what reasonable measures you took to avoid it.`;
    default:
      return "If you consider that extraordinary circumstances applied, please tell me specifically what they were and what reasonable measures you took to avoid them.";
  }
}

function whatHappened(inp: FlightInputs): string {
  const flight = inp.what.trim() || "my flight";
  const on = isISODate(inp.flown) ? ` on ${letterDate(inp.flown)}` : "";
  if (inp.problem === "delay") {
    return `${capital(flight)}${on} arrived at its final destination ${lateWords(inp.late)} late.`;
  }
  const rest = !inp.late
    ? ""
    : inp.late === "none"
      ? " I did not travel on an alternative flight."
      : ` The alternative flight got me to my final destination ${lateWords(inp.late)} later than originally scheduled.`;
  if (inp.problem === "cancel") {
    return `${capital(flight)}${on} was cancelled, and I was told ${noticeWords(inp.notice)}.${rest}`;
  }
  return `I was denied boarding on ${flight}${on} against my will, although I had a confirmed booking and checked in on time.${rest}`;
}

function amountLine(inp: FlightInputs, read: FlightRead): string {
  const each = money(read.each, read.regime);
  const dist = `The flight distance is ${bandWords(inp.band)}`;
  const amt = read.halved
    ? `so the compensation is ${each} per passenger (the reduced amount under Article 7)`
    : `so the compensation is ${each} per passenger under Article 7`;
  const many = read.pax > 1 ? `, ${money(read.total, read.regime)} for the ${read.pax} passengers on this booking` : "";
  return `${dist}, ${amt}${many}.`;
}

function spentLine(read: FlightRead): string {
  if (!read.spent) return "";
  return `I also spent ${money(read.spent, read.regime)} on meals, accommodation and transport while waiting, which you were obliged to provide under Article 9. Receipts are attached.`;
}

/** The claim to the airline: the first ask, or, when excused, the request to name the cause. */
export function claimMessage(inp: FlightInputs, read: FlightRead, today = todayISO()): string {
  const airline = inp.airline.trim();
  const lines: string[] = [];
  lines.push(airline && !/^(the|a|an|my)\s/i.test(airline) ? `Dear ${airline},` : "Hello,");
  lines.push("");
  const law = lawName(read.regime);
  const by = letterDate(read.replyBy || addDaysISO(today, PAY_DAYS));
  if (read.kind === "under") {
    lines.push(`${whatHappened(inp)}`);
    lines.push("");
    lines.push(`Under Article 9 of ${law}, you were obliged to provide meals and refreshments, and accommodation and transport where an overnight stay was needed.${read.spent ? ` I spent ${money(read.spent, read.regime)} on these myself. Receipts are attached.` : ""}`);
    lines.push("");
    lines.push(read.spent ? `Please reimburse ${money(read.spent, read.regime)} by ${by}.` : "Please confirm how I can claim back reasonable costs I paid for these.");
  } else if (read.kind === "excused") {
    lines.push(whatHappened(inp));
    lines.push("");
    lines.push(`Under ${law}, compensation of ${money(read.each, read.regime)} per passenger${read.pax > 1 ? ` (${money(read.total, read.regime)} for the ${read.pax} passengers on this booking)` : ""} is due unless the ${inp.problem === "cancel" ? "cancellation" : "delay"} was caused by extraordinary circumstances that could not have been avoided even if all reasonable measures had been taken.`);
    lines.push("");
    lines.push(reasonLine(inp));
    const sp = spentLine(read);
    if (sp) {
      lines.push("");
      lines.push(`${sp} Care is owed whatever the cause, so please reimburse this by ${by}.`);
    }
    lines.push("");
    lines.push(`Please reply by ${by}. If you can't show that extraordinary circumstances applied, please pay the compensation by bank transfer to [account name, sort code and account number].`);
  } else {
    lines.push(`I'm claiming compensation under ${law}.`);
    lines.push("");
    lines.push(whatHappened(inp));
    lines.push("");
    lines.push(amountLine(inp, read));
    if (inp.problem !== "bumped") {
      lines.push("");
      lines.push(reasonLine(inp));
    }
    const sp = spentLine(read);
    if (sp) {
      lines.push("");
      lines.push(sp);
    }
    lines.push("");
    const sum = read.total + (read.spent ?? 0);
    lines.push(`Please pay ${money(sum, read.regime)} by ${by}, by bank transfer to [account name, sort code and account number] rather than in vouchers.`);
    lines.push("");
    lines.push(
      read.regime === "uk"
        ? "If this isn't resolved, I'll refer it to your approved alternative dispute resolution scheme, or to the Civil Aviation Authority, once eight weeks have passed, or sooner if you send a final response."
        : "If this isn't resolved, I'll refer it to the national enforcement body, or to court.",
    );
  }
  lines.push("");
  lines.push("Thank you,");
  lines.push("[names of everyone on the booking, booking reference, flight number, and how to reach you]");
  return lines.join("\n");
}

/** What to put in the ADR, CAA or national-body form, when that's the next step. */
export function escalateMessage(inp: FlightInputs, read: FlightRead): string | null {
  if (read.kind !== "escalate") return null;
  const airline = inp.airline.trim() || "The airline";
  const asked = isISODate(inp.askedOn) ? ` on ${letterDate(inp.askedOn)}` : "";
  const answer =
    inp.stage === "refused"
      ? `${capital(airline)} refused${inp.reason && inp.reason !== "unknown" ? ", citing the reason below" : ""}.`
      : `${capital(airline)} has not given a final response.`;
  const lines: string[] = [];
  lines.push(`I claimed compensation under ${lawName(read.regime)} from ${airline === "The airline" ? "the airline" : airline}${asked}. ${answer}`);
  lines.push("");
  lines.push(whatHappened(inp));
  lines.push("");
  lines.push(amountLine(inp, read));
  if (inp.problem !== "bumped") {
    lines.push("");
    lines.push(
      inp.reason === "tech" || inp.reason === "staff" || inp.reason === "knock"
        ? reasonLine(inp).replace(/^You've said/, "The airline said").replace(/which you would need to show, along with the reasonable measures you took/, "which the airline has not shown")
        : "The airline has not shown that extraordinary circumstances caused this, or what reasonable measures it took to avoid them.",
    );
  }
  const sp = spentLine(read);
  if (sp) {
    lines.push("");
    lines.push(sp.replace(/which you were obliged/, "which the airline was obliged"));
  }
  lines.push("");
  lines.push(`I'm asking for ${money(read.total + (read.spent ?? 0), read.regime)}. My claim and the airline's reply are attached.`);
  return lines.join("\n");
}

/** The answer's headline: the words printed largest, and spoken. */
export function flightHeadline(inp: FlightInputs, read: FlightRead): string {
  const total = money(read.total, read.regime);
  switch (read.kind) {
    case "outside":
      return "UK and EU rules don't reach this flight.";
    case "under":
      if (read.under === "notice") return "Two weeks' notice means no cash. A refund or a new flight is still yours to choose.";
      if (read.under === "rerouted") return "The new flight was close enough to the old one: no cash, but costs are covered.";
      return "Under three hours late: no cash. Meals and costs are still covered.";
    case "excused":
      return "If it really was outside their control, there's no cash. Make them name it.";
    case "old":
      return "This is probably too long ago to claim.";
    case "ask":
      return `Claim ${total} yourself${read.pax === 2 ? ", for both of you" : read.pax > 2 ? `, for all ${read.pax} of you` : ""}. It's a form, not a fight.`;
    case "wait":
      return read.escalateFrom
        ? `They have until ${actDate(read.escalateFrom)}. Then it goes somewhere free.`
        : "Give them eight weeks from your claim. Then it goes somewhere free.";
    case "escalate":
      return read.regime === "uk"
        ? `Take the ${total} to the airline's ADR scheme or the CAA. It's free.`
        : `Take the ${total} to the national enforcement body, or small claims.`;
  }
}

/** One paragraph under the headline: why this, in plain words. */
export function flightBody(inp: FlightInputs, read: FlightRead): string {
  switch (read.kind) {
    case "outside":
      if (inp.from === "other" && inp.to === "other")
        return "UK261 and EU261 cover flights leaving the UK or the EU, and some flights arriving there. A flight between two places outside both isn't covered, unless it was one leg of a single booking that started in the UK or the EU; then measure from the first airport. Check the rules of the country you left from: Canada, for instance, has its own compensation scheme, and in the US the airline must refund a cancelled flight if you don't take the alternative.";
      if (inp.to === "uk")
        return "A flight into the UK from outside is covered only when the airline is a UK or EU one. This airline is neither, so UK261 doesn't apply. Check the rules of the country you flew from, and the airline's own conditions of carriage.";
      if (inp.to === "eu")
        return inp.carrier === "uk"
          ? "Since Brexit, a flight into the EU from outside is covered by EU261 only on an EU airline, and UK261 only covers UK arrivals. A UK airline flying into the EU from elsewhere falls between the two. Check the rules of the country you left from."
          : "A flight into the EU from outside is covered only when the airline is an EU one. Check the rules of the country you flew from, and the airline's own conditions of carriage.";
      return "Neither UK nor EU rules reach this flight. Check the rules of the country you flew from.";
    case "under":
      if (read.under === "notice")
        return "When an airline cancels at least 14 days ahead, there's no compensation. But you choose between a full refund and a new flight at the earliest opportunity (or a later date that suits you), and the choice is yours, not theirs. Vouchers are optional; you can insist on money.";
      if (read.under === "rerouted")
        return "With less than two weeks' notice, the cash is still due unless the new flight kept close to the original: with seven to thirteen days' notice, leaving no more than two hours early and arriving less than four hours late; with under seven days, no more than an hour early and less than two hours late. This one did. You were still owed the choice of a refund, and meals and a hotel if you were kept waiting.";
      return "The cash starts when you reach your final destination three hours or more late, measured when the doors open, not when the wheels touch down. If it was close, check the actual arrival time on a flight-tracking site. Either way, the airline had to look after you while you waited, and if it didn't, reasonable costs are claimable.";
    case "excused":
      return `Weather that makes flying unsafe, air traffic control restrictions, strikes by people who don't work for the airline, bird strikes and security alerts can all be "extraordinary circumstances". But the airline has to prove it, for this flight, and show it took reasonable measures. So the message below doesn't claim the cash outright: it asks them to name the cause.${read.spent ? " It does claim what you spent: care is owed even when the cause was out of their hands." : ""} If their answer is vague, or the cause turns out to be a technical fault or crew, change the reason above and the claim is ready.`;
    case "old":
      return "Claims usually have to be made within six years in England, Wales and Northern Ireland, and five in Scotland; in EU countries the limit is often shorter. That's passed. A polite request costs nothing, but expect a no.";
    case "ask":
      return `Send the claim below to the airline's own claims form, today, and save a copy. Don't use a claims company: they keep a large share of the payout for filing the same form. The message cites the rule, the amount and, if they gave one, the answer to their reason. Ask for money, not vouchers. If they say no, or the eight weeks to ${actDate(read.escalateFrom)} pass without a final answer, the next step is free, and it's below.`;
    case "wait":
      return read.escalateFrom
        ? `Airlines get eight weeks to give a final answer. Yours ends on ${actDate(read.escalateFrom)}. If the money arrives, good. If a no arrives first, or nothing has by then, come back and take the next step: the message is ready.`
        : "Airlines get eight weeks to give a final answer. Tell the tool the date you claimed and it will give you the exact day.";
    case "escalate": {
      const why = inp.stage === "refused" ? "They've said no" : "The eight weeks are up";
      return read.regime === "uk"
        ? `${why}, so go to the referee. Many airlines flying from the UK belong to an approved ADR scheme (usually AviationADR or CEDR), and their final reply should name it. If the airline isn't in one, the Civil Aviation Authority's Passenger Advice and Complaints Team takes the case. Both are free, and an ADR decision you accept binds the airline. If their no doesn't say it's final, reply asking for a final response (a "deadlock letter"); that opens the door at once. Paste the text below into the scheme's form, with your claim and their reply. Small claims court is the backstop.`
        : `${why}. Each EU country has a national enforcement body for passenger rights, usually in the country the flight left from, and some airlines belong to an ADR scheme. Complaints are free. If neither works, small claims, or the European Small Claims Procedure for cross-border cases up to €5,000.`;
    }
  }
}

/** What you were owed at the airport, compensation or not. */
export function careLines(inp: FlightInputs): string[] {
  const hours = inp.band === "short" ? "two" : inp.band === "medium" ? "three" : inp.band === "long" ? "four" : "two to four";
  const lines = [
    `Meals and refreshments once the delay passed ${hours} hours (for this distance), and two phone calls or emails.`,
    "A hotel and transport to it if you were kept overnight.",
  ];
  if (inp.problem === "delay") lines.push("If the delay passed five hours and you chose not to fly, a full refund, and a flight back to where you started if you were mid-journey.");
  else lines.push("Your choice of a full refund or a new flight at the earliest opportunity, with another airline if that's sooner. Vouchers are optional.");
  lines.push("If they didn't provide any of it, reasonable costs you paid yourself can be claimed back: keep every receipt.");
  return lines;
}

/** The standing rule: the reusable part. */
export function flightRule(): string {
  return "My line for flights: three hours late at the door, cancelled inside two weeks, or bumped, I claim it myself, in writing, that week, and I ask for money, not vouchers. The reason they give is a claim, not a ruling.";
}

/** The plain-text record. */
export function flightSummary(inp: FlightInputs, read: FlightRead): string {
  const lines: string[] = [];
  const what = inp.what.trim();
  if (what) lines.push(`${capital(what)}${inp.airline.trim() ? ` (${inp.airline.trim()})` : ""}`);
  lines.push(flightHeadline(inp, read));
  lines.push("");
  lines.push(flightBody(inp, read));
  if (read.kind !== "outside") {
    const esc = escalateMessage(inp, read);
    if (esc) {
      lines.push("");
      lines.push("For the ADR scheme, the CAA or the national body:");
      lines.push(esc);
    }
    if (read.kind !== "old") {
      lines.push("");
      lines.push("The claim to the airline:");
      lines.push(claimMessage(inp, read));
    }
    lines.push("");
    lines.push("What you were owed at the airport:");
    careLines(inp).forEach((l) => lines.push(`- ${l}`));
  }
  lines.push("");
  lines.push(flightRule());
  return lines.join("\n");
}

const PROBLEMS: Problem[] = ["delay", "cancel", "bumped"];
const PLACES: Place[] = ["uk", "eu", "other"];
const CARRIERS: Carrier[] = ["uk", "eu", "other"];
const BANDS: Band[] = ["short", "medium", "long"];
const LATES: Late[] = ["lt2", "2to3", "3to4", "4plus", "none"];
const NOTICES: Notice[] = ["14plus", "7to13", "lt7"];
const EARLIES: Early[] = ["no", "1to2", "over2"];
const REASONS: Reason[] = ["tech", "staff", "knock", "weather", "atc", "other", "unknown"];
const STAGES: Stage[] = ["none", "asked", "refused", "ignored"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function date(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseFlightInputs(raw: unknown): FlightInputs {
  if (!raw || typeof raw !== "object") return BLANK_FLIGHT;
  const v = raw as Record<string, unknown>;
  return {
    what: str(v.what),
    airline: str(v.airline),
    problem: oneOf(v.problem, PROBLEMS),
    from: oneOf(v.from, PLACES),
    to: oneOf(v.to, PLACES),
    carrier: oneOf(v.carrier, CARRIERS),
    band: oneOf(v.band, BANDS),
    late: oneOf(v.late, LATES),
    notice: oneOf(v.notice, NOTICES),
    early: oneOf(v.early, EARLIES),
    reason: oneOf(v.reason, REASONS),
    flown: date(v.flown),
    pax: str(v.pax, 4),
    spent: str(v.spent, 40),
    stage: oneOf(v.stage, STAGES),
    askedOn: date(v.askedOn),
  };
}

/**
 * The worked example: a family of four, Gatwick to Faro, four hours forty
 * late. The airline said "technical issue", then refused the claim citing
 * extraordinary circumstances.
 */
export const FLIGHT_EXAMPLE: FlightInputs = {
  what: "the 07:05 from Gatwick to Faro",
  airline: "the airline",
  problem: "delay",
  from: "uk",
  to: "eu",
  carrier: "",
  band: "medium",
  late: "4plus",
  notice: "",
  early: "",
  reason: "tech",
  flown: "",
  pax: "4",
  spent: "£46",
  stage: "refused",
  askedOn: "",
};

/** The example's dates, relative to today. */
export function flightExample(today = todayISO()): FlightInputs {
  return { ...FLIGHT_EXAMPLE, flown: addDaysISO(today, -40), askedOn: addDaysISO(today, -30) };
}
