/**
 * The read behind "The Rent's Going Up: Pay It or Challenge It?" (/rent).
 *
 * A letter, an email or a form arrives from the landlord or the agent: the rent
 * goes up from a date in a couple of months. Most tenants do one of two
 * things. They pay it, because arguing feels like asking to be evicted. Or they
 * judge it by the percentage ("8% seems a lot") rather than by what the home
 * would actually let for. Both miss how much changed on 1 May 2026.
 *
 * England only (Housing Act 1988, s.13 and s.14, as amended by the Renters'
 * Rights Act; in force 1 May 2026). What agreed across the sources I could
 * reach (gov.uk itself was blocked from the sandbox, so these are Shelter,
 * tribunal decisions on gov.uk's asset server, and solicitors' and agents'
 * summaries):
 *
 *   - For a private periodic tenancy, a section 13 notice on Form 4A is the
 *     only way to raise the rent. Rent review clauses stopped working for
 *     increases from 1 May 2026, and an increase can't be made by a text, an
 *     email or a letter that isn't the form.
 *   - At least two months' notice, and the new rent must start at the start of
 *     a rent period (the day the rent is normally due).
 *   - Once a year: the new rent can't start within 52 weeks of the last
 *     section 13 increase (or, for most tenancies, of the tenancy starting).
 *   - The tenant can apply to the First-tier Tribunal (Property Chamber) on
 *     form MR1 for a market rent determination, but only before the date the
 *     new rent starts.
 *   - For applications after 1 May 2026, the tribunal can't set a rent above
 *     the figure in the notice, and the new rent takes effect from its
 *     decision, not backdated. It can delay it by up to two months more for
 *     undue hardship. (Under the old rules it could go higher and backdate.)
 *   - Notices served on the old Form 4 before 1 May 2026 still stand.
 *   - The fee was reported as £47 by one source and "free" by another, so the
 *     tool says to check the form's guidance and mentions help with fees.
 *   - Section 21 "no-fault" evictions ended on 1 May 2026, so a landlord needs
 *     a legal ground to end the tenancy; challenging a rent rise isn't one.
 *
 * The read checks the notice before the number, and the number against what
 * similar homes let for, not against last year's rent.
 *
 * Wales, Scotland and Northern Ireland, social housing and lodgers get a
 * pointer: their rules differ too much to model here.
 *
 * Not legal advice. Pure data and functions, no React, so the read can be
 * checked by a script.
 */

import { parseMoney } from "./worth";
import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, isISODate, letterDate, todayISO };

export type RentRegion = "" | "eng" | "wales" | "scot" | "ni";
export type Landlord = "" | "private" | "social" | "lodger";
export type NoticeForm = "" | "form" | "informal" | "unsure";
export type RentPeriod = "" | "month" | "week" | "fourweek";
export type YesNoUnsure = "" | "yes" | "no" | "unsure";
export type Afford = "" | "yes" | "stretch" | "no";

export const COMPARABLE_SLOTS = 5;

export type RentInputs = {
  /** The home, in a few words: "the flat on Elm Road". Optional. */
  what: string;
  /** The landlord's or agent's name, for the letters. Optional. */
  landlordName: string;
  region: RentRegion;
  landlord: Landlord;
  form: NoticeForm;
  /** ISO date the notice reached you. */
  servedOn: string;
  /** ISO date the new rent is meant to start. */
  startsOn: string;
  /** Is that the day the rent is normally due? */
  onRentDay: YesNoUnsure;
  /** ISO date the rent last went up (or the tenancy began). Optional. */
  lastChangeOn: string;
  period: RentPeriod;
  current: string;
  proposed: string;
  /** Asking rents for similar homes nearby, same period as the rent. */
  comparables: string[];
  /** Repairs or problems the landlord hasn't fixed. Optional. */
  repairs: string;
  afford: Afford;
};

export const BLANK_RENT: RentInputs = {
  what: "",
  landlordName: "",
  region: "",
  landlord: "",
  form: "",
  servedOn: "",
  startsOn: "",
  onRentDay: "",
  lastChangeOn: "",
  period: "",
  current: "",
  proposed: "",
  comparables: Array(COMPARABLE_SLOTS).fill(""),
  repairs: "",
  afford: "",
};

/** The day the Renters' Rights Act's rent rules took effect. */
export const NEW_RULES_FROM = "2026-05-01";
/** A proposal within this share of the comparables' middle reads as "about market". */
export const MARKET_BAND = 0.03;

export type RentStatus =
  /** Wales, Scotland or Northern Ireland. */
  | "elsewhere"
  /** A council or housing association. */
  | "social"
  /** You live with the landlord. */
  | "lodger"
  /** Not on the form: not a valid increase. */
  | "informal"
  /** On the form, but it fails a check. */
  | "invalid"
  /** Served before 1 May 2026, on the old rules. */
  | "old"
  /** Valid, and the start date has passed: too late for the tribunal. */
  | "passed"
  /** Valid, and there's still time to apply. */
  | "open";

export type Verdict = "" | "above" | "around" | "below";

export type RentRead = {
  status: RentStatus;
  /** Why the notice fails, in plain words. */
  problems: string[];
  /** Checks that couldn't be made, or are close. */
  doubts: string[];
  /** Monthly figures, whatever the rent period. */
  currentMonthly: number | null;
  proposedMonthly: number | null;
  riseMonthly: number | null;
  risePercent: number | null;
  /** The middle of the comparables, monthly. */
  marketMonthly: number | null;
  comparableCount: number;
  verdict: Verdict;
  /** The figure to offer: the lower of the proposal and the comparables' middle. */
  offerMonthly: number | null;
  /** The last day to apply to the tribunal (the day before the new rent starts). */
  applyBy: string;
  daysLeft: number | null;
};

const PER_MONTH: Record<Exclude<RentPeriod, "">, number> = {
  month: 1,
  week: 52 / 12,
  fourweek: 13 / 12,
};

export const PERIOD_WORD: Record<Exclude<RentPeriod, "">, string> = {
  month: "a month",
  week: "a week",
  fourweek: "every four weeks",
};

export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) || r >= 100
    ? `£${Math.round(r).toLocaleString("en-GB")}`
    : `£${r.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

function monthly(raw: string, period: RentPeriod): number | null {
  const n = parseMoney(raw);
  if (n === null || n <= 0 || !period) return null;
  return n * PER_MONTH[period];
}

/** The middle value: the median, which one odd listing can't drag around. */
export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function comparablesOf(inp: RentInputs): number[] {
  if (!inp.period) return [];
  return inp.comparables
    .map((c) => monthly(c, inp.period))
    .filter((n): n is number => n !== null);
}

/** Enough to give a read. */
export function rentReady(inp: RentInputs): boolean {
  if (!inp.region) return false;
  if (inp.region !== "eng") return true;
  if (!inp.landlord) return false;
  if (inp.landlord !== "private") return true;
  if (!inp.form) return false;
  if (inp.form === "informal") return true;
  return isISODate(inp.servedOn) && isISODate(inp.startsOn);
}

export function readRent(inp: RentInputs, today = todayISO()): RentRead | null {
  if (!rentReady(inp)) return null;
  const currentMonthly = monthly(inp.current, inp.period);
  const proposedMonthly = monthly(inp.proposed, inp.period);
  const riseMonthly =
    currentMonthly !== null && proposedMonthly !== null ? proposedMonthly - currentMonthly : null;
  const risePercent =
    riseMonthly !== null && currentMonthly ? (riseMonthly / currentMonthly) * 100 : null;
  const comps = comparablesOf(inp);
  const marketMonthly = comps.length >= 2 ? median(comps) : null;

  let verdict: Verdict = "";
  if (marketMonthly !== null && proposedMonthly !== null) {
    const gap = (proposedMonthly - marketMonthly) / marketMonthly;
    verdict = gap > MARKET_BAND ? "above" : gap < -MARKET_BAND ? "below" : "around";
  }
  const offerMonthly =
    proposedMonthly !== null && marketMonthly !== null
      ? Math.min(proposedMonthly, Math.max(marketMonthly, currentMonthly ?? 0))
      : null;

  const base: RentRead = {
    status: "open",
    problems: [],
    doubts: [],
    currentMonthly,
    proposedMonthly,
    riseMonthly,
    risePercent,
    marketMonthly,
    comparableCount: comps.length,
    verdict,
    offerMonthly,
    applyBy: "",
    daysLeft: null,
  };

  if (inp.region !== "eng") return { ...base, status: "elsewhere" };
  if (inp.landlord === "social") return { ...base, status: "social" };
  if (inp.landlord === "lodger") return { ...base, status: "lodger" };
  if (inp.form === "informal") return { ...base, status: "informal" };

  const problems: string[] = [];
  const doubts: string[] = [];
  const old = inp.servedOn < NEW_RULES_FROM;

  if (inp.form === "unsure")
    doubts.push(
      `Check the heading. A valid notice is the government's form: "Form 4A: Landlord's notice proposing a new rent" (or the old Form 4 if it was served before 1 May 2026). A letter or email in the landlord's own words isn't one.`,
    );

  if (inp.startsOn <= inp.servedOn) {
    problems.push("The new rent starts on or before the day the notice reached you.");
  } else if (!old) {
    const earliest = addMonthsISO(inp.servedOn, 2);
    if (inp.startsOn < earliest)
      problems.push(
        `It gives less than two months' notice. Served on ${letterDate(inp.servedOn)}, the new rent can't start before ${letterDate(earliest)}; this one says ${letterDate(inp.startsOn)}.`,
      );
    else if (daysBetween(earliest, inp.startsOn) <= 3)
      doubts.push(
        "The two months are only just met. If the notice was posted, the date it counts as served can be later than the date on it, so check the envelope and when it actually arrived.",
      );
  }

  if (inp.onRentDay === "no")
    problems.push("The new rent doesn't start on the day your rent is due. It has to start at the beginning of a rent period.");
  else if (inp.onRentDay === "unsure")
    doubts.push("Check the start date is the day your rent is normally due. If it isn't, the notice isn't valid.");

  if (isISODate(inp.lastChangeOn)) {
    const yearOn = addDaysISO(inp.lastChangeOn, 364);
    if (inp.startsOn < yearOn)
      problems.push(
        `It's less than 52 weeks since the rent last changed (or the tenancy began) on ${letterDate(inp.lastChangeOn)}. The earliest a section 13 increase can start is ${letterDate(yearOn)}.`,
      );
  } else {
    doubts.push("If the rent went up, or the tenancy began, less than 52 weeks before the new start date, the notice isn't valid.");
  }

  const applyBy = addDaysISO(inp.startsOn, -1);
  const daysLeft = daysBetween(today, applyBy);
  const withDates = { ...base, problems, doubts, applyBy, daysLeft };

  if (problems.length) return { ...withDates, status: "invalid" };
  if (old) return { ...withDates, status: "old" };
  if (today >= inp.startsOn) return { ...withDates, status: "passed" };
  return { ...withDates, status: "open" };
}

function homeOf(inp: RentInputs): string {
  return inp.what.trim() || "the home I rent";
}

/** A monthly figure, shown in the rent's own period: "£300 a week". */
function inPeriod(n: number | null, period: RentPeriod): string {
  if (n === null) return "";
  if (!period || period === "month") return `${money(n)} a month`;
  return `${money(n / PER_MONTH[period])} ${PERIOD_WORD[period]}`;
}

const WORDS = ["no", "one", "two", "three", "four", "five"];
function countWord(n: number): string {
  return WORDS[n] ?? String(n);
}

/** Each month the tribunal takes, the old rent stands: what that's worth. */
export function delayLine(read: RentRead): string | null {
  if (read.status !== "open" || read.riseMonthly === null || read.riseMonthly <= 0) return null;
  return `While a tribunal decides, the old rent stands: ${money(read.riseMonthly)} a month you don't pay, and the new rent isn't backdated. Three months is ${money(read.riseMonthly * 3)}; six is ${money(read.riseMonthly * 6)}.`;
}

export function rentHeadline(inp: RentInputs, read: RentRead): string {
  switch (read.status) {
    case "elsewhere":
      return inp.region === "scot"
        ? "Scotland has its own rules: you usually have 21 days to refer it to a rent officer."
        : inp.region === "wales"
          ? "Wales has its own rules. Check them before you pay or argue."
          : "Northern Ireland has its own rules. Check them before you pay or argue.";
    case "social":
      return "Social rents follow a government formula. Ask for the calculation.";
    case "lodger":
      return "As a lodger there's no tribunal. This one is a negotiation.";
    case "informal":
      return "That isn't a valid rent increase. Your rent hasn't changed.";
    case "invalid":
      return `This notice doesn't work. Your rent stays at ${read.currentMonthly !== null ? inPeriod(read.currentMonthly, inp.period) : "what it is"} until a valid one arrives.`;
    case "old":
      return "This notice was served under the old rules, before 1 May 2026.";
    case "passed":
      return "The start date has passed, so it's too late for the tribunal on this notice.";
    case "open": {
      const by = actDate(read.applyBy);
      if (read.verdict === "above")
        return `It's above what similar homes let for. Challenge it: apply by ${by}.`;
      if (read.verdict === "around")
        return `It's about what similar homes let for. A tribunal is unlikely to cut it much; decide by ${by}.`;
      if (read.verdict === "below")
        return `It's below what similar homes let for. Accept it, or negotiate on what needs fixing; decide by ${by}.`;
      return `The notice looks valid. Check it against similar homes before ${by}.`;
    }
  }
}

export function rentBody(inp: RentInputs, read: RentRead): string {
  const parts: string[] = [];
  switch (read.status) {
    case "elsewhere":
      if (inp.region === "scot")
        parts.push(
          "For a private residential tenancy, the landlord has to give three months' notice on the prescribed form, and can raise the rent only once in 12 months. You can refer the increase to a rent officer (Rent Service Scotland), usually within 21 days of getting the notice. Shelter Scotland and Citizens Advice Scotland have the current rules, including any rent control in your area.",
        );
      else if (inp.region === "wales")
        parts.push(
          "Under the Renting Homes (Wales) Act, a landlord usually has to give at least two months' notice and can raise the rent only once a year. Shelter Cymru and Citizens Advice can tell you what applies to your contract and whether you can challenge it.",
        );
      else
        parts.push(
          "Private tenancies in Northern Ireland have their own notice rules, including limits on how often the rent can go up. Housing Rights (housingrights.org.uk) gives free advice.",
        );
      break;
    case "social":
      parts.push(
        "Council and housing association rents in England are set by the government's rent standard, which caps the yearly rise to a formula. Ask your landlord how they worked out the new figure. If it seems wrong, Shelter and Citizens Advice can help, and housing association tenants can complain to the Housing Ombudsman.",
      );
      break;
    case "lodger":
      parts.push(
        "If you live in your landlord's home, you're an excluded occupier or a lodger, not an assured tenant, so section 13 and the tribunal don't apply. What you have is a negotiation: what similar rooms let for, what the landlord would lose to an empty room and a search, and what you'd pay elsewhere.",
      );
      if (read.verdict === "above" && read.marketMonthly !== null)
        parts.push(`The rooms you found suggest about ${inPeriod(read.marketMonthly, inp.period)}, which is a fair figure to offer.`);
      break;
    case "informal":
      parts.push(
        "Since 1 May 2026, the only way a private landlord in England can raise the rent on a periodic tenancy is a section 13 notice on Form 4A, with two months' notice. A text, an email, a letter in their own words or a rent review clause in the contract doesn't do it.",
        "So keep paying your current rent, and don't start paying the higher amount while you decide: paying it could be taken as agreeing. Reply politely, in writing, saying you'll look at a formal notice if one comes. That notice would also give you the right to ask the tribunal.",
      );
      break;
    case "invalid":
      parts.push(
        "A section 13 notice has to meet each rule, and this one doesn't:",
        ...read.problems.map((p) => `• ${p}`),
        "An invalid notice doesn't change the rent. Keep paying what you pay now, and tell the landlord in writing why the notice doesn't work. They can serve a new, correct one, which would start the clock again.",
      );
      break;
    case "old":
      parts.push(
        "Notices served on the old Form 4 before 1 May 2026 still stand. Under those rules the tribunal could set a higher rent than the notice asked for, and backdate it, so challenges were riskier.",
      );
      if (inp.startsOn > todayISO())
        parts.push(`If you want to challenge it, you have to apply before ${letterDate(inp.startsOn)}. Get free advice first: Shelter or Citizens Advice.`);
      else
        parts.push(
          "If the start date has passed and you didn't apply, the new rent is now your rent. The next increase can't start until 52 weeks after this one, and has to use the new form, under the new rules.",
        );
      break;
    case "passed":
      parts.push(
        "You can only apply to the tribunal before the new rent starts, so on this notice the new rent is now your rent. The next increase can't start until 52 weeks after this one, and it has to come on Form 4A with two months' notice.",
        "Next time, the order is: check the notice, check the comparables, and apply before the start date if it's above them.",
      );
      break;
    case "open": {
      if (read.riseMonthly !== null && read.risePercent !== null && read.riseMonthly > 0)
        parts.push(
          `The rise is ${inPeriod(read.riseMonthly, inp.period)} (${read.risePercent.toFixed(1)}%), or ${money(read.riseMonthly * 12)} a year. The percentage isn't the test, though. The tribunal asks what this home would let for on the open market, in its current condition.`,
        );
      if (read.marketMonthly !== null && read.proposedMonthly !== null) {
        const diff = read.proposedMonthly - read.marketMonthly;
        parts.push(
          `The middle of the ${countWord(read.comparableCount)} similar homes you found is ${inPeriod(read.marketMonthly, inp.period)}. The new rent is ${inPeriod(read.proposedMonthly, inp.period)}, ${inPeriod(Math.abs(diff), inp.period)} ${diff >= 0 ? "above" : "below"} it.`,
        );
      } else {
        parts.push(
          "Add at least two similar homes nearby (same size, same kind of place, let recently or on the market now) to see where the new rent sits. That's the evidence the tribunal will weigh.",
        );
      }
      if (read.verdict === "above")
        parts.push(
          "Since 1 May 2026 the tribunal can't set a rent above the one in the notice, and the new rent runs from its decision, not backdated. So applying can't leave you worse off than accepting, except for your time. Send the landlord your evidence and an offer first; if they won't move, apply on form MR1 before the start date.",
        );
      else if (read.verdict === "around")
        parts.push(
          "A tribunal sets the market rent, so it would probably land close to this. You can still apply, and the old rent stands until it decides. But a challenge you expect to lose mostly buys time, so weigh that against how you want things with this landlord. Things that need fixing are the strongest reason to offer a little less.",
        );
      else if (read.verdict === "below")
        parts.push(
          "A tribunal would be unlikely to cut it, since homes like yours let for more. If repairs are outstanding, that's the lever: the tribunal values the home in its actual condition, and a landlord would usually rather fix something than lose a good tenant.",
        );
      if (inp.repairs.trim())
        parts.push(
          "The repairs you listed matter: the tribunal values the home as it is, not as it would be if it were fixed. Put them in writing to the landlord now, with photos, whatever you decide about the rent.",
        );
      if (inp.afford === "no" || inp.afford === "stretch")
        parts.push(
          "If paying the new rent would cause you real hardship, say so on the tribunal form. It can delay the new rent by up to two months. If you're on Universal Credit or Housing Benefit, tell them about the change once it's settled.",
        );
      parts.push(
        "Challenging isn't a reason to end your tenancy: since 1 May 2026 a landlord needs a legal ground to evict, and section 21 no-fault notices have gone.",
      );
      break;
    }
  }
  if (read.doubts.length && (read.status === "open" || read.status === "passed"))
    parts.push("Worth checking:", ...read.doubts.map((d) => `• ${d}`));
  return parts.join("\n\n");
}

export type RentLetter = { id: string; title: string; note: string; text: string };

function signOff(): string[] {
  return ["", "Yours sincerely,", "", "[Your name]", "[Your address]"];
}

function dear(inp: RentInputs): string {
  return `Dear ${inp.landlordName.trim() || "[landlord or agent]"},`;
}

/** The letters that fit this read, most useful first. */
export function rentLetters(inp: RentInputs, read: RentRead, today = todayISO()): RentLetter[] {
  const out: RentLetter[] = [];
  const home = homeOf(inp);
  const cur = read.currentMonthly !== null ? inPeriod(read.currentMonthly, inp.period) : "[current rent]";
  const head = [letterDate(today), "", dear(inp), ""];

  if (read.status === "informal") {
    out.push({
      id: "informal",
      title: "Reply to the request",
      note: "Polite and short. It doesn't refuse to talk; it says what a valid increase needs.",
      text: [
        ...head,
        `Re: rent for ${home}`,
        "",
        `Thank you for your message about increasing the rent. As I understand it, since 1 May 2026 the rent on a periodic assured tenancy can only be increased by a notice under section 13 of the Housing Act 1988 on Form 4A, giving at least two months' notice. I'll continue to pay my current rent of ${cur} until then.`,
        "",
        "If you serve a notice, I'll consider it carefully and get back to you.",
        ...signOff(),
      ].join("\n"),
    });
  }

  if (read.status === "invalid") {
    out.push({
      id: "invalid",
      title: "Why the notice doesn't work",
      note: "Send it in writing and keep a copy. It's not a refusal to pay more ever, just this notice.",
      text: [
        ...head,
        `Re: notice of a new rent for ${home}, served on ${letterDate(inp.servedOn)}`,
        "",
        "Thank you for your notice proposing a new rent. I don't believe it's a valid notice under section 13 of the Housing Act 1988, because:",
        "",
        ...read.problems.map((p) => `- ${p}`),
        "",
        `So my rent remains ${cur}, and I'll keep paying that. If you serve a valid notice, I'll consider it.`,
        ...signOff(),
      ].join("\n"),
    });
  }

  if (read.status === "open" && read.proposedMonthly !== null) {
    const comps = comparablesOf(inp);
    const offer = read.offerMonthly;
    const showOffer = offer !== null && read.verdict === "above" && offer < read.proposedMonthly - 0.5;
    const lines = [
      ...head,
      `Re: your notice of a new rent for ${home}, from ${letterDate(inp.startsOn)}`,
      "",
      `Thank you for your notice proposing a rent of ${inPeriod(read.proposedMonthly, inp.period)}.`,
    ];
    if (comps.length) {
      lines.push(
        "",
        "I've looked at what similar homes nearby let for:",
        ...comps.map((c, i) => `- Home ${i + 1}: ${inPeriod(c, inp.period)} [add the address or link]`),
      );
      if (read.marketMonthly !== null) lines.push("", `The middle of these is ${inPeriod(read.marketMonthly, inp.period)}.`);
    }
    if (inp.repairs.trim())
      lines.push("", `There are also problems with the home that haven't been fixed: ${inp.repairs.trim().replace(/\.$/, "")}.`);
    if (showOffer && offer !== null)
      lines.push(
        "",
        `I'd like to stay, and I'd be happy to agree a new rent of ${inPeriod(offer, inp.period)}${inp.repairs.trim() ? ", or the rent you propose once those repairs are done" : ""}. Please let me know by ${letterDate(addDaysISO(today, 10))}.`,
        "",
        `If we can't agree, I'll ask the First-tier Tribunal to decide the market rent before the new rent is due to start.`,
      );
    else
      lines.push(
        "",
        inp.repairs.trim()
          ? `I'd like to stay. Could we agree a date for those repairs? Please let me know by ${letterDate(addDaysISO(today, 10))}.`
          : `I'd like to stay, and I'd be grateful if you could confirm the new rent in writing.`,
      );
    lines.push(...signOff());
    out.push({
      id: "negotiate",
      title: showOffer ? "Your evidence and an offer" : inp.repairs.trim() ? "Accept, with the repairs" : "Accept it in writing",
      note: showOffer
        ? "Send it soon: it leaves time to apply to the tribunal if they won't move. Replace each [add the address or link] with the listing."
        : "Short, and on the record.",
      text: lines.join("\n"),
    });

    if (showOffer) {
      out.push({
        id: "applied",
        title: "Once you've applied to the tribunal",
        note: "Send it the day you apply. Courteous is better than defiant; you'll still be living there.",
        text: [
          "[Date]",
          "",
          dear(inp),
          "",
          `Re: rent for ${home}`,
          "",
          `I've applied to the First-tier Tribunal (Property Chamber) to decide the market rent for ${home}, following your notice of ${letterDate(inp.servedOn)}. They'll be in touch with you.`,
          "",
          `Until the tribunal decides, I'll continue to pay the current rent of ${cur}, as the law provides. I'll pay whatever rent the tribunal sets from the date it takes effect.`,
          "",
          "I'd still be glad to agree a figure with you in the meantime if you'd like to talk.",
          ...signOff(),
        ].join("\n"),
      });
    }
  }

  if (read.status === "lodger" && read.proposedMonthly !== null && read.verdict === "above" && read.offerMonthly !== null) {
    out.push({
      id: "lodger",
      title: "A counter-offer",
      note: "Friendly: you share a home. Give the evidence and a number.",
      text: [
        `Hi ${inp.landlordName.trim() || "[name]"},`,
        "",
        `Thanks for letting me know about the rent. I've looked at similar rooms nearby and they're going for about ${inPeriod(read.offerMonthly, inp.period)}. Would that work? I'd like to stay, and I'm happy to talk it through.`,
        "",
        "[Your name]",
      ].join("\n"),
    });
  }
  return out;
}

/** What to keep or gather. */
export function evidenceLines(inp: RentInputs, read: RentRead): string[] {
  if (read.status === "elsewhere" || read.status === "social") return [];
  const out = ["The notice or message itself, and the envelope or email showing when it arrived."];
  if (read.status !== "lodger") out.push("Your tenancy agreement, and proof of when the rent last changed.");
  out.push("Screenshots of each similar home you found, with the date, the rent, the size and the address or link. Listings vanish.");
  if (read.status === "open") {
    out.push("Photos of anything wrong with the home, dated, and copies of every time you reported it.");
    out.push("A copy of every letter you send, and proof you sent it.");
  }
  return out;
}

/** The tribunal deadline, and a nudge a week before. */
export function remindersOf(read: RentRead, today: string): { on: string; title: string; body: string }[] {
  if (read.status !== "open" || !read.applyBy) return [];
  const out: { on: string; title: string; body: string }[] = [];
  const nudge = addDaysISO(read.applyBy, -7);
  if (nudge >= today)
    out.push({
      on: nudge,
      title: "One week left to challenge the rent increase",
      body: "If the landlord hasn't agreed a figure, decide now whether to apply to the tribunal (form MR1).",
    });
  if (read.applyBy >= today)
    out.push({
      on: read.applyBy,
      title: "Last day to apply to the tribunal about the rent",
      body: "The application must reach the tribunal before the new rent starts tomorrow.",
    });
  return out;
}

export function rentRule(): string {
  return "When the rent goes up, I check the notice before the number, and the number against what similar homes let for, not against what I paid last year. If I'm going to challenge it, I apply before the start date.";
}

export function rentSummary(inp: RentInputs, read: RentRead, today = todayISO()): string {
  const lines: string[] = [];
  lines.push(`The rent's going up${inp.what.trim() ? `: ${inp.what.trim()}` : ""}`);
  lines.push("", rentHeadline(inp, read), "", rentBody(inp, read));
  if (read.status === "open") {
    const d = delayLine(read);
    if (d) lines.push("", d);
    lines.push("", `Last day to apply to the tribunal: ${letterDate(read.applyBy)}.`);
  }
  const letters = rentLetters(inp, read, today);
  for (const l of letters) lines.push("", `${l.title}:`, "", l.text);
  lines.push("", rentRule());
  return lines.join("\n");
}

const REGIONS: RentRegion[] = ["eng", "wales", "scot", "ni"];
const LANDLORDS: Landlord[] = ["private", "social", "lodger"];
const FORMS: NoticeForm[] = ["form", "informal", "unsure"];
const PERIODS: RentPeriod[] = ["month", "week", "fourweek"];
const YNU: YesNoUnsure[] = ["yes", "no", "unsure"];
const AFFORDS: Afford[] = ["yes", "stretch", "no"];

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
export function parseRentInputs(raw: unknown): RentInputs {
  if (!raw || typeof raw !== "object") return BLANK_RENT;
  const v = raw as Record<string, unknown>;
  const comps = Array.isArray(v.comparables) ? v.comparables : [];
  return {
    what: str(v.what),
    landlordName: str(v.landlordName),
    region: oneOf(v.region, REGIONS),
    landlord: oneOf(v.landlord, LANDLORDS),
    form: oneOf(v.form, FORMS),
    servedOn: date(v.servedOn),
    startsOn: date(v.startsOn),
    onRentDay: oneOf(v.onRentDay, YNU),
    lastChangeOn: date(v.lastChangeOn),
    period: oneOf(v.period, PERIODS),
    current: str(v.current, 40),
    proposed: str(v.proposed, 40),
    comparables: Array.from({ length: COMPARABLE_SLOTS }, (_, i) => str(comps[i], 40)),
    repairs: str(v.repairs, 400),
    afford: oneOf(v.afford, AFFORDS),
  };
}

/**
 * The worked example: a flat at £1,150 a month, a Form 4A notice for £1,295
 * that arrived a week ago, and four similar flats letting for about £1,200.
 */
export function rentExample(today = todayISO()): RentInputs {
  const served = addDaysISO(today, -7);
  const d = new Date(`${addMonthsISO(served, 2)}T00:00:00`);
  // The first of the month on or after two months from service: a rent day.
  const start =
    d.getDate() === 1
      ? addMonthsISO(served, 2)
      : `${d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear()}-${String(((d.getMonth() + 1) % 12) + 1).padStart(2, "0")}-01`;
  return {
    what: "the two-bed flat on Elm Road",
    landlordName: "",
    region: "eng",
    landlord: "private",
    form: "form",
    servedOn: served,
    startsOn: start,
    onRentDay: "yes",
    lastChangeOn: addDaysISO(today, -400),
    period: "month",
    current: "£1,150",
    proposed: "£1,295",
    comparables: ["£1,175", "£1,225", "£1,195", "£1,250", ""],
    repairs: "damp in the bedroom, reported in March",
    afford: "stretch",
  };
}
