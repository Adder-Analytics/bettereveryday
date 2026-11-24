/**
 * The read behind "Attendance Allowance: Could They Get It, and What Do You
 * Write?" (/attendance).
 *
 * Attendance Allowance is £76.70 or £114.60 a week (2026/27) for someone over
 * State Pension age who needs help with personal care, or needs watching over
 * to stay safe, because of a physical or mental health condition. It isn't
 * means-tested, it isn't taxed, a diagnosis isn't needed, and it's about the
 * help someone *needs*, whether or not anyone gives it. Lower rate: help or
 * supervision by day, or by night. Higher rate: both, or under the special
 * rules for someone who may have 12 months or less to live.
 *
 * Two things make it the neglected key. First, it opens other money: for
 * someone who lives alone with nobody paid Carer's Allowance for them, it adds
 * a severe disability amount (£86.05 a week) to Pension Credit, and it's the
 * qualifying benefit a carer needs for Carer's Allowance; with a dementia
 * diagnosis it can take someone out of the council tax count. Second, the
 * barrier is the form. People describe their good days, write "I manage", and
 * leave out how long things take, how much they hurt and how close the last
 * fall was. They have adapted, and they rate themselves against a yardstick
 * that has moved (response shift). So this tool doesn't ask "can you dress?";
 * it asks what happens, how often, and what goes wrong without help, and turns
 * that into draft answers.
 *
 * The figures and rules (gov.uk and most advice sites were blocked from the
 * sandbox; these are from search summaries where several agreed, see
 * docs/2026-11-24-session-notes.md):
 *
 *   - 2026/27 rates £76.70 lower, £114.60 higher (DWP benefit and pension
 *     rates 2026/27, Which?, gov.scot's PADP uprating table all agree).
 *   - Needs must have lasted six months (the qualifying period); a claim can
 *     be made before then and is paid once the six months are up. Not
 *     backdated before the date of claim. Calling the helpline (0800 731 0122)
 *     for a form starts the claim on the date of the call, if the form is back
 *     within six weeks.
 *   - Special rules: a medical professional says the person may have 12 months
 *     or less to live; higher rate, no qualifying period, faster; form SR1
 *     from the doctor or nurse (send the claim without waiting for it).
 *   - Scotland: Pension Age Disability Payment from Social Security Scotland
 *     has replaced it for new claims, same rates; existing awards moved over
 *     automatically. Northern Ireland: Attendance Allowance through the
 *     Department for Communities.
 *   - Care homes: it stops after 28 days if the council or NHS pays for the
 *     care; self-funders keep it. Hospital: stops after 28 days. Both link
 *     stays less than 28 days apart.
 *   - Pension Credit severe disability addition £86.05; Carer's Allowance
 *     £86.45 (both from this site's /pensioncredit and /carers modules).
 *   - From memory, widely stated, not verified on gov.uk: the day test is
 *     "frequent attention throughout the day with bodily functions" or
 *     "continual supervision throughout the day to avoid substantial danger";
 *     the night test is "prolonged or repeated attention" (prolonged is
 *     usually taken as about 20 minutes or more, repeated as twice or more) or
 *     "another person to be awake for a prolonged period or at frequent
 *     intervals to watch over"; a mandatory reconsideration within one month
 *     of the decision; the severe mental impairment council tax disregard
 *     needs a doctor's certificate and a qualifying benefit, which includes
 *     Attendance Allowance. **Verify.**
 *
 * The read is a judgement of which rate the described needs point to, not a
 * decision; the DWP (or Social Security Scotland) decides. Pure data and
 * functions, no React.
 */

import { formatMoney, parseMoney } from "./worth";
import { addDaysISO, isISODate, letterDate, todayISO } from "./refund";
import { SDA, AA_LOWER, AA_HIGHER } from "./pensioncredit";
import { RATE as CA_RATE } from "./carers";

export { isISODate, letterDate, todayISO, AA_LOWER, AA_HIGHER, SDA, CA_RATE };

export type YesNo = "" | "yes" | "no";
export type Whose = "" | "mine" | "other";
export type Where = "" | "ew" | "scotland" | "ni";
export type Age = "" | "over" | "under";
export type Duration = "" | "under6" | "over6" | "terminal";
export type Setting = "" | "home" | "carehome-self" | "carehome-funded" | "hospital";
export type Current = "" | "none" | "lower" | "refused";
export type DayFreq = "" | "once" | "several" | "throughout";
export type Night = "" | "none" | "short" | "prolonged" | "repeated" | "watch";
export type Falls = "" | "0" | "1" | "2";
export type LivesWith = "" | "alone" | "partner" | "others";
export type CarerAge = "" | "none" | "under" | "over";
export type Pc = "" | "yes" | "no" | "unsure";

export type NeedId = "wash" | "dress" | "toilet" | "eat" | "meds" | "move" | "senses" | "supervise" | "mind";

export type AaInputs = {
  whose: Whose;
  /** What you call them, for the messages and drafts. */
  name: string;
  where: Where;
  age: Age;
  duration: Duration;
  setting: Setting;
  current: Current;
  /** Areas of daily life where help or watching over is needed. */
  needs: NeedId[];
  dayFreq: DayFreq;
  night: Night;
  falls: Falls;
  /** Things take much longer, hurt, or leave them exhausted. */
  slow: YesNo;
  livesWith: LivesWith;
  /** Someone is paid Carer's Allowance for looking after them. */
  carerPaid: YesNo;
  /** The main unpaid carer, if they care 35 hours a week or more. */
  carer: CarerAge;
  pensionCredit: Pc;
  /** A diagnosis of dementia or another severe impairment of memory or understanding. */
  dementia: YesNo;
  /** Council tax bill a year, for the dementia disregard. */
  councilTax: string;
};

export const BLANK_AA: AaInputs = {
  whose: "",
  name: "",
  where: "",
  age: "",
  duration: "",
  setting: "",
  current: "",
  needs: [],
  dayFreq: "",
  night: "",
  falls: "",
  slow: "",
  livesWith: "",
  carerPaid: "",
  carer: "",
  pensionCredit: "",
  dementia: "",
  councilTax: "",
};

export const HELPLINE = "0800 731 0122";
/** Days to return a form requested by phone and keep the call date as the claim date. */
export const RETURN_DAYS = 42;

export type Need = {
  id: NeedId;
  label: string;
  hint: string;
  /** Day test it speaks to: bodily functions, or supervision. */
  kind: "body" | "watch";
};

export const NEEDS: Need[] = [
  { id: "wash", label: "Washing, bathing or showering", hint: "Getting in and out of the bath, washing hair, feet, back.", kind: "body" },
  { id: "dress", label: "Dressing and undressing", hint: "Buttons, socks, shoes, bras, reaching, choosing clothes for the weather.", kind: "body" },
  { id: "toilet", label: "The toilet, or continence", hint: "Getting on and off, wiping, accidents, changing pads or clothes.", kind: "body" },
  { id: "eat", label: "Eating and drinking", hint: "Cutting food, lifting a cup, remembering to eat, choking.", kind: "body" },
  { id: "meds", label: "Medicines and treatment", hint: "Remembering, opening packs, eye drops, inhalers, injections, dressings.", kind: "body" },
  { id: "move", label: "Moving about indoors", hint: "Stairs, getting up from a chair or bed, getting about the house.", kind: "body" },
  { id: "senses", label: "Seeing, hearing or communicating", hint: "Reading post, using the phone, following a conversation, being understood.", kind: "body" },
  { id: "supervise", label: "Staying safe: needs watching or checking on", hint: "Falls, forgetting the cooker or taps, wandering, letting strangers in.", kind: "watch" },
  { id: "mind", label: "Mood, memory or confusion", hint: "Needs prompting or reassurance to do things, anxiety, low mood, getting muddled.", kind: "watch" },
];

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

export function pounds2(n: number): string {
  return `£${n.toFixed(2)}`;
}

function amt(raw: string): number {
  return Math.max(0, parseMoney(raw) ?? 0);
}

function given(raw: string): boolean {
  return raw.trim() !== "" && parseMoney(raw) !== null;
}

export type Verdict =
  | "terminal"
  | "higher"
  | "lower-day"
  | "lower-night"
  | "borderline"
  | "unlikely"
  | "pip"
  | "funded";

export type Unlock = { id: string; label: string; value: number | null; note: string; counted: boolean };

export type AaRead = {
  verdict: Verdict;
  where: Exclude<Where, "">;
  other: boolean;
  name: string;
  /** The weekly rate the needs point to (0 if none). */
  rate: number;
  dayMet: boolean;
  nightMet: boolean;
  /** Under six months so far: claim now, paid once six months are up. */
  waiting: boolean;
  /** Already on the lower rate: this is about moving up. */
  upgrade: boolean;
  refusedBefore: boolean;
  setting: Exclude<Setting, ""> | "home";
  needs: NeedId[];
  night: Night;
  dayFreq: DayFreq;
  falls: Falls;
  slow: boolean;
  unlocks: Unlock[];
  /** The allowance a year plus the counted unlocks. */
  yearValue: number;
  /** The date a claim started by phone today keeps, and the return-by date. */
  claimDate: string;
  returnBy: string;
  livesWith: LivesWith;
  carer: CarerAge;
  pensionCredit: Pc;
  dementia: boolean;
};

export function aaReady(inp: AaInputs): boolean {
  if (!inp.age) return false;
  if (inp.age === "under") return true;
  if (!inp.duration || !inp.setting) return false;
  if (inp.setting === "carehome-funded") return true;
  if (inp.duration === "terminal") return true;
  return !!inp.dayFreq && !!inp.night;
}

/** The day condition: frequent help with personal care, or continual watching over. */
export function dayMetOf(needs: NeedId[], freq: DayFreq): boolean {
  if (!needs.length) return false;
  if (freq === "throughout") return true;
  if (freq === "several") return true;
  return false;
}

/** The night condition: help that's prolonged or repeated, or someone awake to watch over. */
export function nightMetOf(night: Night): boolean {
  return night === "prolonged" || night === "repeated" || night === "watch";
}

function unlocksOf(inp: AaInputs, rate: number): Unlock[] {
  const out: Unlock[] = [];
  if (rate <= 0) return out;
  const where = inp.where || "ew";
  const alone = inp.livesWith === "alone";
  const noCarerPaid = inp.carerPaid !== "yes";
  const sdaFits = alone && noCarerPaid;
  const caClaimable = inp.carer === "under" && inp.carerPaid !== "yes";
  if (sdaFits && inp.pensionCredit === "yes")
    out.push({
      id: "sda",
      label: "Severe disability amount in Pension Credit",
      value: SDA * 52,
      note: `${pounds2(SDA)} a week added to the Pension Credit they already get, from the date of the award. Tell the Pension Service the day the letter comes.`,
      counted: true,
    });
  else if (sdaFits && inp.pensionCredit !== "yes")
    out.push({
      id: "sda",
      label: "Pension Credit, possibly for the first time",
      value: null,
      note: `For someone who lives alone with nobody paid Carer's Allowance for them, it adds ${pounds2(SDA)} a week to the Pension Credit minimum, so a full State Pension can stop being "too much". Check with the Pension Credit tool.`,
      counted: false,
    });
  if (caClaimable) {
    const clash = sdaFits && inp.pensionCredit === "yes";
    out.push({
      id: "ca",
      label: "Carer's Allowance for the carer",
      value: CA_RATE * 52,
      note: clash
        ? `${pounds2(CA_RATE)} a week for someone caring 35 hours or more, but if it's paid, the severe disability amount (${pounds2(SDA)}) stops. Not counted in the total; work out which is worth more first.`
        : sdaFits
          ? `${pounds2(CA_RATE)} a week for someone under State Pension age caring 35 hours a week or more, with an earnings limit. But if it's paid, Pension Credit's severe disability amount can't be: if they might claim Pension Credit, compare the two first.`
          : `${pounds2(CA_RATE)} a week for someone under State Pension age caring 35 hours a week or more, with an earnings limit. Attendance Allowance is the benefit it needs.`,
      counted: !clash,
    });
  }
  if (inp.carer === "over")
    out.push({
      id: "ue",
      label: "A carer amount in the carer's own Pension Credit",
      value: null,
      note: "A carer over State Pension age isn't paid Carer's Allowance on top of their pension, but claiming it gives 'underlying entitlement', which adds about £48 a week to their own Pension Credit or Housing Benefit, if they get or could get either.",
      counted: false,
    });
  if (inp.dementia === "yes" && where !== "ni") {
    const bill = given(inp.councilTax) ? amt(inp.councilTax) : 0;
    const share = alone ? 1 : inp.livesWith === "partner" || inp.livesWith === "others" ? 0.25 : 0;
    const value = bill > 0 && share > 0 ? bill * share : null;
    out.push({
      id: "smi",
      label: alone ? "Council tax: the whole bill, backdated" : "Council tax: usually 25% off, backdated",
      value,
      note: alone
        ? "With a dementia diagnosis and Attendance Allowance, someone is 'disregarded' for council tax; living alone, the bill goes to nothing. It needs a doctor's certificate, and councils backdate it to when both applied."
        : "With a dementia diagnosis and Attendance Allowance, someone is 'disregarded' for council tax. With one other adult left in the count, that's the 25% single person discount. It needs a doctor's certificate, and councils backdate it.",
      counted: value !== null,
    });
  }
  return out;
}

export function readAa(inp: AaInputs, today = todayISO()): AaRead | null {
  if (!aaReady(inp)) return null;
  const where = inp.where || "ew";
  const other = inp.whose === "other";
  const name = inp.name.trim().slice(0, 30);
  const setting = inp.setting || "home";
  const dayMet = dayMetOf(inp.needs, inp.dayFreq);
  const nightMet = nightMetOf(inp.night);
  let verdict: Verdict;
  if (inp.age === "under") verdict = "pip";
  else if (setting === "carehome-funded") verdict = "funded";
  else if (inp.duration === "terminal") verdict = "terminal";
  else if (dayMet && nightMet) verdict = "higher";
  else if (dayMet) verdict = "lower-day";
  else if (nightMet) verdict = "lower-night";
  else if (inp.needs.length || inp.night === "short" || inp.falls === "2") verdict = "borderline";
  else verdict = "unlikely";
  const rate =
    verdict === "terminal" || verdict === "higher"
      ? AA_HIGHER
      : verdict === "lower-day" || verdict === "lower-night"
        ? AA_LOWER
        : 0;
  const upgrade = inp.current === "lower";
  const unlocks = upgrade ? [] : unlocksOf(inp, rate);
  const counted = unlocks.reduce((s, u) => s + (u.counted && u.value ? u.value : 0), 0);
  const allowanceYear = upgrade ? Math.max(0, rate - AA_LOWER) * 52 : rate * 52;
  return {
    verdict,
    where,
    other,
    name,
    rate,
    dayMet,
    nightMet,
    waiting: inp.duration === "under6",
    upgrade,
    refusedBefore: inp.current === "refused",
    setting,
    needs: inp.needs,
    night: inp.night,
    dayFreq: inp.dayFreq,
    falls: inp.falls,
    slow: inp.slow === "yes",
    unlocks,
    yearValue: allowanceYear + counted,
    claimDate: today,
    returnBy: addDaysISO(today, RETURN_DAYS),
    livesWith: inp.livesWith,
    carer: inp.carer,
    pensionCredit: inp.pensionCredit,
    dementia: inp.dementia === "yes",
  };
}

/* ---------------------------------------------------------------- prose -- */

function who(read: AaRead): string {
  return read.other ? read.name || "they" : "you";
}

function whoCap(read: AaRead): string {
  const w = who(read);
  return w[0].toUpperCase() + w.slice(1);
}

function them(read: AaRead): string {
  return read.other ? read.name || "them" : "you";
}

/** "Attendance Allowance", or Scotland's replacement. */
export function benefitName(read: Pick<AaRead, "where">): string {
  return read.where === "scotland" ? "Pension Age Disability Payment" : "Attendance Allowance";
}

export function aaHeadline(read: AaRead): string {
  const w = who(read);
  const b = benefitName(read);
  if (read.upgrade) {
    if (read.rate === AA_HIGHER) return `Ask for the higher rate: ${pounds2(AA_HIGHER - AA_LOWER)} a week more.`;
    return `The lower rate looks right for now. Ask again if nights change.`;
  }
  switch (read.verdict) {
    case "pip":
      return `Not this one yet: under State Pension age, it's ${read.where === "scotland" ? "Adult Disability Payment" : "PIP"}.`;
    case "funded":
      return `Not while the council or NHS pays for the care home.`;
    case "terminal":
      return `Claim today under the special rules: ${pounds2(AA_HIGHER)} a week, fast.`;
    case "higher":
      return `${whoCap(read)} ${w === "you" ? "look" : "looks"} likely to get the higher rate: ${pounds2(AA_HIGHER)} a week.`;
    case "lower-day":
    case "lower-night":
      return `${whoCap(read)} ${w === "you" ? "look" : "looks"} likely to get ${b}: ${pounds2(AA_LOWER)} a week.`;
    case "borderline":
      return `Close. It may be more than it sounds; worth claiming with the right answers.`;
    case "unlikely":
      return `Probably not yet, on what you've described.`;
  }
}

export function aaBody(read: AaRead): string {
  const parts: string[] = [];
  const b = benefitName(read);
  const t = read.other ? "they" : "you";
  const day = read.dayMet;
  const night = read.nightMet;
  if (read.upgrade) {
    parts.push(
      read.rate === AA_HIGHER
        ? `What you've described meets both the day and the night conditions, which is the higher rate. Call the helpline and report a change: the help needed at night has increased. The difference is ${pounds2(AA_HIGHER - AA_LOWER)} a week, about ${money((AA_HIGHER - AA_LOWER) * 52)} a year. A change can be reported once it has lasted six months, or straight away under the special rules.`
        : `What you've described meets ${day ? "the day" : night ? "the night" : "neither"} condition${day && night ? "s" : ""}, which is the lower rate. If ${t} start needing help more than once a night, or for long spells, or someone has to be awake to watch over ${them(read)}, that's the higher rate: report it.`,
    );
    return parts.join(" ");
  }
  switch (read.verdict) {
    case "pip":
      parts.push(
        read.where === "scotland"
          ? "Pension Age Disability Payment (Attendance Allowance's replacement in Scotland) is only for people over State Pension age. Under it, the benefit is Adult Disability Payment, which also has a mobility part. Claim it from Social Security Scotland."
          : "Attendance Allowance is only for people over State Pension age. Under it, the benefit is Personal Independence Payment (PIP), which has a mobility part as well as daily living. Someone already getting PIP or DLA when they reach State Pension age usually keeps it, and shouldn't claim Attendance Allowance instead.",
      );
      break;
    case "funded":
      parts.push(
        `${b} stops after 28 days in a care home when the council or the NHS pays for the care. If ${t} pay ${read.other ? "their" : "your"} own fees (a self-funder), it carries on, and it's worth claiming. If the council pays now but the fees will be paid from a house sale later (a deferred payment), ask: it can often be paid.`,
      );
      break;
    case "terminal":
      parts.push(
        read.where === "scotland"
          ? `When a clinician judges that someone has a progressive illness that's likely to cause their death, ${b} is claimed under the special rules for terminal illness: the higher rate, no waiting period, no questions about care needs, and a fast decision. Scotland doesn't use a 12-month line; the clinician fills in a BASRiS form. Apply without waiting for it.`
          : `When a doctor, nurse or other medical professional says someone may have 12 months or less to live, ${b} is claimed under the special rules: the higher rate, no six-month wait, no questions about care needs, and a decision in days or weeks rather than months. The professional fills in form SR1 and can send it themselves. Send the claim without waiting for it.`,
      );
      break;
    case "higher":
      parts.push(
        `What you've described meets the day condition (help with personal care several times a day, or watching over) and the night condition (help that's long or repeated, or someone needing to be awake). That's the higher rate: ${pounds2(AA_HIGHER)} a week, about ${money(AA_HIGHER * 52)} a year, not means-tested and not taxed.`,
      );
      break;
    case "lower-day":
      parts.push(
        `What you've described meets the day condition: help with personal care several times a day, or someone needing to keep an eye on ${them(read)}. That's the lower rate, ${pounds2(AA_LOWER)} a week, about ${money(AA_LOWER * 52)} a year, not means-tested and not taxed. If help is also needed at night, more than once or for long spells, it's the higher rate; say so on the form.`,
      );
      break;
    case "lower-night":
      parts.push(
        `What you've described meets the night condition: help that's long or repeated, or someone needing to be awake to watch over ${them(read)}. That's the lower rate, ${pounds2(AA_LOWER)} a week, about ${money(AA_LOWER * 52)} a year. If the days need help several times too, it's the higher rate.`,
      );
      break;
    case "borderline":
      parts.push(
        `On what you've ticked, the help is needed once or twice a day and not much at night, which is short of the test. But this is where most claims are lost by understatement, not by the rules. Go through a whole day slowly: every time ${t} need a hand, a reminder, someone nearby in case, or do it slowly, painfully or unsafely, counts. If that comes to several times a day, it's the lower rate.`,
      );
      break;
    case "unlikely":
      parts.push(
        `Nothing you've described needs help from another person yet. ${b} isn't about a condition; it's about the help or watching over it makes necessary. Come back when that changes: after a fall, a hospital stay, a new diagnosis, or when ${t} start avoiding the bath or the stairs.`,
      );
      break;
  }
  if (read.waiting && read.verdict !== "terminal" && read.verdict !== "pip" && read.verdict !== "funded" && read.verdict !== "unlikely")
    parts.push(
      `The needs have to have lasted six months before it's paid. ${read.other ? "They" : "You"} can claim before then, and it's paid from when the six months are up, so don't wait for the date to start the form.`,
    );
  if (read.setting === "hospital")
    parts.push(`It isn't paid after 28 days in hospital, but a claim can be made from a hospital bed and paid from discharge. Start it now.`);
  if (read.refusedBefore && read.rate > 0)
    parts.push(
      `A past refusal doesn't stop a new claim. Most refusals come from forms that described the good days; write this one from the worst typical day, with examples.`,
    );
  if (read.rate > 0 && read.verdict !== "pip" && read.verdict !== "funded")
    parts.push(
      read.where === "scotland"
        ? "It's paid from the date of the application, never before, so start it today on mygov.scot or by phone to Social Security Scotland."
        : `It's paid from the date of the claim, never before. Call ${HELPLINE} for the form today and the claim starts today, as long as it's back by ${letterDate(read.returnBy)}.`,
    );
  return parts.join(" ");
}

export type Tile = { label: string; value: string; note: string };

export function tilesOf(read: AaRead): Tile[] {
  if (read.verdict === "pip" || read.verdict === "funded" || read.verdict === "unlikely") return [];
  const out: Tile[] = [];
  if (read.upgrade) {
    if (read.rate !== AA_HIGHER) return [];
    out.push({ label: "Higher rate", value: pounds2(AA_HIGHER), note: "a week, from the lower rate's £76.70" });
    out.push({ label: "More a year", value: money((AA_HIGHER - AA_LOWER) * 52), note: "the difference" });
    out.push({ label: "Call", value: HELPLINE, note: "report a change in care needs" });
    return out;
  }
  if (read.rate > 0) {
    out.push({ label: benefitName(read), value: pounds2(read.rate), note: `a week, about ${money(read.rate * 52)} a year` });
    const extra = read.yearValue - read.rate * 52;
    out.push({
      label: "With what it unlocks",
      value: `about ${money(read.yearValue)}`,
      note: extra > 0 ? "a year, counting only what has a price" : "a year; see what else it opens below",
    });
  } else {
    out.push({ label: "If it's the lower rate", value: pounds2(AA_LOWER), note: `a week, about ${money(AA_LOWER * 52)} a year` });
    out.push({ label: "The day test", value: "Several times", note: "a day, help with personal care, or watching over" });
  }
  if (read.where === "scotland") out.push({ label: "Paid from", value: "the day you apply", note: "not before, so start it today" });
  else out.push({ label: "Return the form by", value: letterDate(read.returnBy), note: "to keep today as the claim date, if you call today" });
  return out;
}

/* ------------------------------------------------------- the form drafts -- */

export type Draft = { id: string; title: string; prompt: string; text: string };

type Voice = { I: string; my: string; me: string; am: string; Im: string };

function voice(): Voice {
  // The form is written as the person claiming, even when someone helps fill it in.
  return { I: "I", my: "my", me: "me", am: "am", Im: "I'm" };
}

function freqPhrase(read: AaRead): string {
  if (read.dayFreq === "throughout") return "throughout the day";
  if (read.dayFreq === "several") return "several times a day";
  return "[how many times a day]";
}

function slowLine(read: AaRead): string {
  return read.slow
    ? " When I do it on my own it takes [how long, e.g. 40 minutes instead of 10], it hurts [where], and afterwards I'm too exhausted to [what]."
    : " On my own it would take [how long] and I would [what goes wrong].";
}

const DRAFTS: Record<NeedId, (read: AaRead, v: Voice) => Draft> = {
  wash: (read) => ({
    id: "wash",
    title: "Washing, bathing and showering",
    prompt: "The form asks if you have difficulty or need help washing, bathing, showering or checking your appearance.",
    text: `I can't get in or out of the bath [or shower] safely. I need someone to steady me getting in and out, and to wash my back, feet and hair, because I can't bend or reach [because of my hips / back / balance / breathlessness].${slowLine(read)} I need this help every day, usually in the morning, and it takes about [20] minutes.

Without help I don't wash properly: I [strip wash at the sink / go [number] days without washing]. On [date] I [slipped / got stuck in the bath and couldn't get out for [how long]].`,
  }),
  dress: (read) => ({
    id: "dress",
    title: "Dressing and undressing",
    prompt: "The form asks if you have difficulty or need help dressing or undressing.",
    text: `I need help to dress and undress, morning and night. I can't do up buttons, zips or a bra because [my fingers are stiff and painful / I can't feel them], and I can't bend to put on socks, tights or shoes.${slowLine(read)} Someone needs to help for about [15] minutes each time.

Without help I [stay in my nightclothes / sleep in my clothes / wear the same clothes for days], and I've lost my balance [and fallen] trying to put trousers on standing up.`,
  }),
  toilet: (read) => ({
    id: "toilet",
    title: "Using the toilet",
    prompt: "The form asks about using the toilet, and managing incontinence.",
    text: `I need help getting on and off the toilet and with cleaning myself, [number] times a day and [number] times a night. I can't get up from a low seat without someone to pull me up, even with a frame [or rail].

I have [accidents / leaks] about [how often]. When that happens I need help to clean myself, change my clothes and the bed, which takes about [20] minutes.${read.slow ? " Getting there takes so long that sometimes I don't make it in time." : ""}`,
  }),
  eat: () => ({
    id: "eat",
    title: "Eating and drinking",
    prompt: "The form asks about eating and drinking, including cutting up food and getting it to your mouth.",
    text: `I need someone to cut up my food [at every meal], and to help me hold a cup because my hands shake [and I spill hot drinks]. [I forget to eat and drink unless someone reminds me / I choke on some foods and need someone with me when I eat.]

This is at every meal, three times a day, about [10] minutes each. Without help I [skip meals / eat only cold food I can pick up / have lost [amount] in weight since [when]].`,
  }),
  meds: () => ({
    id: "meds",
    title: "Medicines and treatment",
    prompt: "The form asks about taking medicines and any medical treatment or therapy.",
    text: `I take [number] medicines at [number] times a day. I need someone to [remind me / check I've taken the right ones / open the packs and blister strips / put in my eye drops / help with my inhaler / do my injections / change my dressings], because [I forget whether I've taken them / my hands can't open them / I can't see the labels].

On [date] I [took a double dose / missed my tablets for [how long]] and [what happened]. Each time takes about [5–10] minutes.`,
  }),
  move: (read) => ({
    id: "move",
    title: "Moving about indoors",
    prompt: "The form asks about moving around indoors, getting in or out of bed or a chair, and using stairs.",
    text: `I need help getting up from a chair or out of bed, and someone with me on the stairs. I use [a walking frame / stick / rails / a stairlift], but I still [lose my balance / my knees give way / get dizzy when I stand up].${slowLine(read)}

This is needed [number] times a day, every time I get up or go up or down the stairs. ${read.falls === "2" ? "I have fallen [number] times in the last year, on [dates], and once I couldn't get up for [how long]." : read.falls === "1" ? "I fell on [date] and [what happened]. Since then I'm frightened of falling again." : "I'm frightened of falling, so I [stay downstairs / sleep in the chair]."}`,
  }),
  senses: () => ({
    id: "senses",
    title: "Seeing, hearing and communicating",
    prompt: "The form asks about difficulty seeing, hearing or speaking, and whether you need help communicating.",
    text: `Because of [my eyesight / hearing / speech / understanding], I need someone to [read my post and help me reply / make phone calls for me / come with me to appointments to explain / help me be understood]. I can't [read labels / recognise faces / use the phone].

This comes up [number] times a day, and it means I can't deal with [bills / letters / the doctor] on my own. Without help, [what goes wrong, e.g. I missed a hospital appointment on [date]].`,
  }),
  supervise: (read) => ({
    id: "supervise",
    title: "Keeping safe: needing someone to watch over",
    prompt: "The form asks whether you need someone to keep an eye on you, and if anything happens that puts you in danger.",
    text: `I need someone to keep an eye on me [throughout the day / when I move about], because [I fall without warning / I get dizzy / I have seizures / I forget things that put me in danger].

${read.falls === "2" ? "I've fallen [number] times in the last year. " : read.falls === "1" ? "I fell on [date]. " : ""}[I have left the cooker on / left taps running / let strangers in / gone out and got lost] on [dates]. On my own, [what could happen]. Someone checks on me [how often], and I need that ${freqPhrase(read)}.`,
  }),
  mind: (read) => ({
    id: "mind",
    title: "Mood, memory and confusion",
    prompt: "The form asks about any mental health condition or difficulty with memory, and how it affects what you need.",
    text: `Because of [my memory / dementia / depression / anxiety], I need someone to prompt me to [wash, change my clothes, eat, take my tablets], and to reassure me when I [get confused / panic / don't know what day it is]. Without prompting I [don't do these things at all / do them wrongly].

This is needed ${freqPhrase(read)}, and [some days are worse than others: on bad days, which are [how many] a week, I [what happens]].`,
  }),
};

function nightDraft(read: AaRead): Draft | null {
  if (read.night === "none" || read.night === "") return null;
  const body =
    read.night === "watch"
      ? `Someone needs to be awake to watch over me at night, because I [get up confused and wander / try to go out / fall when I get up / have breathing problems]. On [date] I [what happened]. Someone has to check on me about [number] times a night, or stay up with me for [how long].`
      : read.night === "repeated"
        ? `I need help [number] times a night, every night: to get to the toilet and back, [to turn over / with my pads / with my medicine / because I wake confused]. Each time takes about [10–20] minutes. Without help I [wet the bed / have fallen on the way to the toilet, on [date] / lie awake in pain].`
        : read.night === "prolonged"
          ? `I need help at night for about [20 minutes or more] at a time, [number] times a night: [to change the bed and my clothes / to settle me when I wake in pain / to get me back into bed]. Without it I [sit up in the chair all night / am left wet until morning].`
          : `I wake [number] times a night and need help to [get to the toilet / take my painkillers / be reassured]. Each time takes about [how long]. [Write down every time for a week: it's often more than it seems.]`;
  return {
    id: "night",
    title: "At night",
    prompt: "The form has a separate section for help needed during the night. Leaving it blank is the commonest way to lose the higher rate.",
    text: body,
  };
}

function knowsYouDraft(read: AaRead): Draft {
  const nm = read.other ? read.name || "[name]" : "[name]";
  return {
    id: "knows",
    title: "From someone who knows them",
    prompt: "The form has a page for someone who knows the person to describe their needs. A relative, friend, carer or neighbour can sign it; it doesn't have to be a doctor.",
    text: `I am ${nm}'s [daughter / son / neighbour / friend], and I have known them for [number] years. I see them [how often].

${nm} needs help with ${read.needs.length ? read.needs.map((n) => NEEDS.find((x) => x.id === n)!.label.toLowerCase()).join("; ") : "[what]"}. In the last month I have seen [specific examples: e.g. I found them on the bathroom floor on [date]; they couldn't open their tablets; they hadn't eaten since the day before].${read.nightMet ? `\n\nAt night, ${nm} needs [what], about [number] times.` : ""}

${nm} tends to say "I manage". That means they go without, or do things slowly, in pain or unsafely. They need someone to help ${read.dayFreq === "throughout" ? "throughout the day" : "several times a day"}.`,
  };
}

export function draftsOf(read: AaRead): Draft[] {
  if (read.verdict === "pip" || read.verdict === "funded") return [];
  const v = voice();
  if (read.verdict === "terminal") return [];
  const out = read.needs.map((n) => DRAFTS[n](read, v));
  const nd = nightDraft(read);
  if (nd) out.push(nd);
  if (read.needs.length || nd) out.push(knowsYouDraft(read));
  return out;
}

/** What turns a true claim into a refusal, said plainly. */
export function formRules(read: AaRead): string[] {
  const t = read.other ? "they" : "you";
  return [
    `Describe a typical bad day, not the best one. If some days are worse, say how many a week and what happens on them.`,
    `Write about the help ${t} need, not the help ${t} get. Living alone with no help doesn't count against a claim; it's the reason for one.`,
    `If something is done slowly, in pain, unsafely, or only with a reminder, that's not doing it. Say how long it takes and what it costs.`,
    `Never write "I manage" without saying how. "I manage by sleeping in the chair because I can't get up the stairs" is an answer; "I manage" is a refusal.`,
    `Give numbers and examples: how many times a day, how many minutes, the date of the last fall.`,
    `Keep a diary for a few days before filling it in, including every time ${t} get up at night.`,
    `Answer every section, including nights. Photocopy the form before posting it, and send supporting letters if you have them, but don't wait for them.`,
    `No diagnosis is needed, and it's not means-tested: savings, a house and a good pension make no difference.`,
  ];
}

/* --------------------------------------------------------------- checks -- */

export function checksOf(read: AaRead): string[] {
  const out: string[] = [];
  const t = read.other ? "they" : "you";
  const b = benefitName(read);
  if (read.verdict === "pip") {
    out.push("Someone reaching State Pension age while on PIP or DLA usually keeps it; it can be worth more because of the mobility part.");
    out.push("PIP is claimed by phone first; the form comes after. The same rule applies: describe the worst typical day.");
    return out;
  }
  if (read.verdict === "funded") {
    out.push("If the council funding stops, or the home is paid for from a house sale under a deferred payment agreement, claim straight away.");
    out.push("Stays in hospital or a funded home of less than 28 days are added together if they're less than 28 days apart.");
    return out;
  }
  out.push(`${b} isn't counted as income for Pension Credit, Housing Benefit or Council Tax Reduction, isn't taxed, and doesn't affect the State Pension.`);
  out.push(`${read.other ? "They" : "You"} can spend it on anything. It's not for paying a carer, and nobody checks.`);
  if (read.livesWith === "alone" && read.pensionCredit !== "no")
    out.push(
      read.pensionCredit === "yes"
        ? `When it's awarded, tell the Pension Service the same day: Pension Credit goes up by ${pounds2(SDA)} a week (the severe disability amount) from the award date, and Housing Benefit or Council Tax Reduction may go up too.`
        : `For someone who lives alone, the award adds ${pounds2(SDA)} a week to the Pension Credit minimum. Check Pension Credit as soon as it's awarded and claim within three months to have it start from the award date.`,
    );
  if (read.livesWith !== "alone" && read.livesWith !== "")
    out.push(`The severe disability amount in Pension Credit needs ${t === "you" ? "you" : "them"} to live alone (or with a partner who also gets a disability benefit). Some people living in don't count, such as a live-in carer from a charity. Ask.`);
  if (read.carer === "under")
    out.push(
      `A carer under State Pension age who cares 35 hours a week or more can claim Carer's Allowance (${pounds2(CA_RATE)} a week) once this is awarded. But if they're paid it, the severe disability amount in Pension Credit stops. Work out which is bigger before claiming.`,
    );
  if (read.dementia)
    out.push("With a dementia diagnosis, ask the GP for the council tax 'severe mental impairment' certificate, and apply to the council once Attendance Allowance is awarded. It's backdated.");
  out.push(`If the decision is no, or the lower rate when you expected the higher, ask for a mandatory reconsideration within one month of the letter. Many decisions change at that stage.`);
  out.push("The DWP may ask for a phone call or, rarely, a visit. Have the copy of the form to hand, and have someone with you who knows the day-to-day.");
  if (read.where === "scotland")
    out.push("In Scotland, Pension Age Disability Payment from Social Security Scotland has replaced Attendance Allowance for new claims: the same rates and broadly the same test. Apply on mygov.scot or by phone; they'll collect supporting information for you if you ask.");
  if (read.where === "ni")
    out.push("In Northern Ireland, Attendance Allowance is run by the Department for Communities, with the same rates and rules. Apply through nidirect.");
  if (read.setting === "carehome-self")
    out.push("Self-funding a care home: keep claiming. If the savings fall to the council funding limit and the council takes over the fees, it stops after 28 days.");
  return out;
}

/* ---------------------------------------------------------------- dates -- */

export type DateLine = { on: string; title: string; body: string };

export function remindersOf(read: AaRead, today: string): DateLine[] {
  if (read.verdict === "pip" || read.verdict === "funded" || read.verdict === "unlikely") return [];
  const out: DateLine[] = [];
  const whose = read.other ? (read.name ? `${read.name}'s ` : "their ") : "";
  if (read.upgrade) {
    if (read.rate === AA_HIGHER)
      out.push({ on: today, title: `Report ${whose}night-time needs`, body: `Call ${HELPLINE} and say the care needed at night has increased. Ask for the higher rate.` });
    return out;
  }
  out.push({
    on: today,
    title: read.where === "scotland" ? `Apply for ${whose}${benefitName(read)}` : `Call for ${whose}${benefitName(read)} form`,
    body:
      read.where === "scotland"
        ? "Apply on mygov.scot or call Social Security Scotland. The claim date is the day you start."
        : `Call ${HELPLINE} and ask for a claim form. The claim starts today, if the form is back within six weeks.`,
  });
  if (read.verdict !== "terminal")
    out.push({
      on: addDaysISO(today, 7),
      title: "Start the diary",
      body: "For three or four days, note every time help, a reminder or watching over is needed, day and night, and how long it took. Then fill in the form from it.",
    });
  if (read.where !== "scotland") out.push({
    on: addDaysISO(today, RETURN_DAYS - 7),
    title: "Post the form this week",
    body: `Photocopy it first. It has to arrive by ${letterDate(read.returnBy)} to keep the claim date. Send it without supporting letters if they haven't come.`,
  });
  out.push({
    on: addDaysISO(today, RETURN_DAYS + 56),
    title: "Chase the decision if nothing has come",
    body: `Call ${read.where === "scotland" ? "Social Security Scotland" : HELPLINE} with the National Insurance number. When the award comes, use it the same week${read.livesWith === "alone" ? ": Pension Credit, council tax" : ""}${read.carer === "under" ? ", Carer's Allowance" : ""}.`,
  });
  return out.filter((d) => isISODate(d.on) && d.on >= today).sort((a, b) => (a.on < b.on ? -1 : a.on > b.on ? 1 : 0));
}

/* ------------------------------------------------------------- messages -- */

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(read: AaRead): Message[] {
  const out: Message[] = [];
  const nm = read.name || "Mum";
  const b = benefitName(read);
  const live = read.verdict !== "pip" && read.verdict !== "funded" && read.verdict !== "unlikely";
  if (read.other && live && !read.upgrade && read.verdict !== "terminal") {
    out.push({
      id: "talk",
      title: `Bringing it up with ${read.name || "them"}`,
      note: "People who'd qualify often refuse because it sounds like admitting they can't cope, or like charity. Start from what it's for and that it isn't about money; offer to do the form together.",
      text: `${nm}, there's an allowance for people over pension age who need a hand with things like the bath, the stairs or remembering tablets. It's not means-tested, so the house and savings don't matter, and it's not about being hard up: it's for the extra things that cost money when getting about is harder, like a taxi, a cleaner or a bit of help.

From what I've seen, I think you'd get it. It's ${pounds2(read.rate || AA_LOWER)} a week${read.livesWith === "alone" && read.pensionCredit === "yes" ? ", and it would put your Pension Credit up as well" : ""}.

Shall we do the form together one afternoon? I'll write, you tell me. I'll ring for it now so it starts from today.`,
    });
  }
  if (live && !read.upgrade && read.where !== "scotland") {
    out.push({
      id: "call",
      title: "Calling for the form",
      note: `The Attendance Allowance helpline is ${HELPLINE}. Ringing for the form, rather than printing it, fixes the claim date as the day of the call. If you're calling for someone else, they may need to be with you to say it's OK.`,
      text: `Hello, I'd like to claim Attendance Allowance${read.other ? ` for ${read.name || "[name]"}, who is here with me` : ""}${read.verdict === "terminal" ? " under the special rules. A [doctor / nurse] is completing form SR1" : ""}.

Please send the claim form, and note today's date as the date of claim.

Name: [full name]
Date of birth: [date]
National Insurance number: [number]
Address: [address]

Please send the form to [address], and tell me the date it must be returned by.`,
    });
  }
  if (live && !read.upgrade && read.verdict !== "terminal") {
    out.push({
      id: "gp",
      title: "To the GP, nurse or therapist: a short supporting letter",
      note: "Not required, and don't hold the form back waiting for it. A letter from someone who treats them that describes what they can't do (not just the diagnosis) helps. Some surgeries charge.",
      text: `Dear Dr [name],

${read.other ? `${read.name || "[name]"} (date of birth [date])` : "I (date of birth [date])"} ${read.other ? "is" : "am"} claiming ${b}. Could you write a short letter describing how ${read.other ? "their" : "my"} conditions affect what ${read.other ? "they" : "I"} can do day to day? In particular:

${read.needs.length ? read.needs.map((n) => `- ${NEEDS.find((x) => x.id === n)!.label}`).join("\n") : "- [what]"}${read.nightMet ? "\n- Help needed at night" : ""}${read.falls && read.falls !== "0" ? "\n- Falls, and the risk of falling" : ""}

It's what ${read.other ? "they need help with" : "I need help with"} that matters for the claim, more than the diagnosis. Thank you.

${read.other ? "[Your name], on behalf of " + (read.name || "[name]") : "[Your name]"}`,
    });
  }
  if (live && !read.upgrade && read.livesWith === "alone" && read.pensionCredit === "yes") {
    out.push({
      id: "pc",
      title: "To the Pension Service, the day it's awarded",
      note: "The severe disability amount isn't added automatically everywhere. Report it by phone or letter as soon as the award letter arrives, and tell the council too for Housing Benefit or Council Tax Reduction.",
      text: `Hello,

${read.other ? `${read.name || "[name]"} has` : "I have"} been awarded ${b} from [date] (letter attached). ${read.other ? "They live" : "I live"} alone, and nobody is paid Carer's Allowance for looking after ${read.other ? "them" : "me"}.

Please add the severe disability amount to ${read.other ? "their" : "my"} Pension Credit from the date of the award.

National Insurance number: [number]

Thank you,
[Name]`,
    });
  }
  if (live && read.dementia && read.where !== "ni") {
    out.push({
      id: "council",
      title: "To the council: the severe mental impairment disregard",
      note: "Councils have their own form; the GP signs a certificate of the diagnosis. Ask for it to be backdated to when both the diagnosis and the allowance applied.",
      text: `Hello,

${read.other ? `${read.name || "[name]"} has` : "I have"} a diagnosis of [dementia] and gets ${b} (from [date]). Please send the form to apply for the severe mental impairment disregard for council tax, and backdate it to [the date both applied].

Council tax account: [number]
Address: [address]

Thank you,
[Name]`,
    });
  }
  return out;
}

export function keepList(read: AaRead): string[] {
  const out = [
    "A photocopy or photos of every page of the form, and a note of the day you posted it.",
    "The date of the call that started the claim, and anyone you spoke to.",
    "The diary you kept, and copies of any supporting letters.",
    "The award or refusal letter: the award opens other money, and the refusal starts a one-month clock.",
  ];
  if (read.dementia) out.push("The GP's certificate of the diagnosis, for the council tax disregard.");
  if (read.livesWith === "alone" && read.pensionCredit === "yes") out.push("A note of the day you told the Pension Service about the award, and who you spoke to.");
  return out;
}

export function aaRule(read: AaRead): string {
  if (read.verdict === "pip") return "I check PIP now, and keep it when I reach State Pension age.";
  if (read.verdict === "funded") return "I claim the day the council stops paying the care home fees.";
  if (read.verdict === "unlikely") return "I come back to this after a fall, a hospital stay, or when the bath or the stairs get hard.";
  if (read.upgrade) return read.rate === AA_HIGHER ? "I report the night-time help this week and ask for the higher rate." : "I report it as soon as help is needed at night.";
  if (read.verdict === "terminal") return "I claim today under the special rules and send it without waiting for the doctor's form.";
  return "I call for the form today, fill it in from a diary of the worst typical days, and post a copy-kept form within six weeks.";
}

export function aaSummary(read: AaRead, today = todayISO()): string {
  const lines = [`${benefitName(read)}: ${aaHeadline(read)}`, "", aaBody(read), ""];
  if (read.unlocks.length) {
    lines.push("What it opens:");
    for (const u of read.unlocks) lines.push(`- ${u.label}${u.value ? ` (about ${money(u.value)} a year${u.counted ? "" : ", not counted"})` : ""}: ${u.note}`);
    lines.push("");
  }
  const drafts = draftsOf(read);
  if (drafts.length) {
    lines.push("Draft answers for the form (fill in the brackets):", "");
    for (const d of drafts) lines.push(`## ${d.title}`, d.text, "");
  }
  lines.push("Writing the form:");
  for (const r of formRules(read)) lines.push(`- ${r}`);
  lines.push("", "Checks:");
  for (const c of checksOf(read)) lines.push(`- ${c}`);
  lines.push("");
  const rem = remindersOf(read, today);
  if (rem.length) {
    lines.push("Dates:");
    for (const d of rem) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
    lines.push("");
  }
  lines.push(
    `Rule: ${aaRule(read)}`,
    "",
    `2026/27 rates: ${pounds2(AA_LOWER)} lower, ${pounds2(AA_HIGHER)} higher. From https://bettereveryday.vercel.app/attendance. A judgement from what you entered, not advice; the DWP decides.`,
  );
  return lines.join("\n");
}

/* -------------------------------------------------------------- parsing -- */

const WHOSES: Exclude<Whose, "">[] = ["mine", "other"];
const WHERES: Exclude<Where, "">[] = ["ew", "scotland", "ni"];
const AGES: Exclude<Age, "">[] = ["over", "under"];
const DURATIONS: Exclude<Duration, "">[] = ["under6", "over6", "terminal"];
const SETTINGS: Exclude<Setting, "">[] = ["home", "carehome-self", "carehome-funded", "hospital"];
const CURRENTS: Exclude<Current, "">[] = ["none", "lower", "refused"];
const DAYFREQS: Exclude<DayFreq, "">[] = ["once", "several", "throughout"];
const NIGHTS: Exclude<Night, "">[] = ["none", "short", "prolonged", "repeated", "watch"];
const FALLS: Exclude<Falls, "">[] = ["0", "1", "2"];
const LIVES: Exclude<LivesWith, "">[] = ["alone", "partner", "others"];
const CARERS: Exclude<CarerAge, "">[] = ["none", "under", "over"];
const PCS: Exclude<Pc, "">[] = ["yes", "no", "unsure"];
const YESNOS: Exclude<YesNo, "">[] = ["yes", "no"];
const NEED_IDS = NEEDS.map((n) => n.id);

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

function str(v: unknown, max = 20): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export function parseAaInputs(raw: unknown): AaInputs {
  if (!raw || typeof raw !== "object") return BLANK_AA;
  const v = raw as Record<string, unknown>;
  const needs = Array.isArray(v.needs)
    ? NEED_IDS.filter((id) => (v.needs as unknown[]).includes(id))
    : [];
  return {
    whose: oneOf(v.whose, WHOSES),
    name: str(v.name, 30),
    where: oneOf(v.where, WHERES),
    age: oneOf(v.age, AGES),
    duration: oneOf(v.duration, DURATIONS),
    setting: oneOf(v.setting, SETTINGS),
    current: oneOf(v.current, CURRENTS),
    needs,
    dayFreq: oneOf(v.dayFreq, DAYFREQS),
    night: oneOf(v.night, NIGHTS),
    falls: oneOf(v.falls, FALLS),
    slow: oneOf(v.slow, YESNOS),
    livesWith: oneOf(v.livesWith, LIVES),
    carerPaid: oneOf(v.carerPaid, YESNOS),
    carer: oneOf(v.carer, CARERS),
    pensionCredit: oneOf(v.pensionCredit, PCS),
    dementia: oneOf(v.dementia, YESNOS),
    councilTax: str(v.councilTax),
  };
}

/**
 * The worked example: Mum is 84, widowed, and lives alone, and already gets a
 * little Pension Credit. Mum can't get out of the bath without help, can't do
 * buttons, needs reminding about tablets, fell twice last winter, and gets up
 * twice a night needing help to the toilet. Asked how things are, the answer
 * is "I manage". A grown-up child helps about 20 hours a week.
 */
export function aaExample(): AaInputs {
  return {
    ...BLANK_AA,
    whose: "other",
    name: "Mum",
    where: "ew",
    age: "over",
    duration: "over6",
    setting: "home",
    current: "none",
    needs: ["wash", "dress", "meds", "move", "supervise"],
    dayFreq: "several",
    night: "repeated",
    falls: "2",
    slow: "yes",
    livesWith: "alone",
    carerPaid: "no",
    carer: "none",
    pensionCredit: "yes",
    dementia: "no",
  };
}
