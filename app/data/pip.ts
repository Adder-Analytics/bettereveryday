/**
 * The read behind "PIP: Could You Get It, and What Do You Write?" (/pip).
 *
 * Personal Independence Payment is for people from 16 to State Pension age
 * whose health condition or disability makes daily living or getting around
 * harder. It isn't means-tested, isn't taxed, doesn't depend on work or
 * National Insurance, and isn't about the diagnosis: it's scored. Twelve
 * activities each have a ladder of statutory descriptors worth 0 to 12 points.
 * The highest descriptor that applies in each activity counts; 8 points across
 * the ten daily living activities is the standard rate, 12 the enhanced; the
 * same for the two mobility activities.
 *
 * The rule people don't know is the one that decides fluctuating claims: a
 * descriptor applies only if it applies on more than half the days (reg. 7),
 * and an activity only counts as done if it's done safely, to an acceptable
 * standard, repeatedly, and in no more than twice the time someone without the
 * condition would take (reg. 4(2A)). So the form isn't asking "can you cook?".
 * It's asking "on how many days can you cook a simple meal, safely, more than
 * once, in a reasonable time?" Nobody remembers that count. Memory keeps the
 * worst day and the latest day (the peak-end pattern), and an assessment sees
 * the day someone managed to get there. So this tool asks two things for each
 * activity: what happens on a bad day, and how many days a week are like that.
 * Then it scores both ways: what counts on what you've said, and what would
 * count if the "some days" turn out, counted, to be more than half.
 *
 * The figures and rules (gov.uk was blocked from the sandbox; these are from
 * search summaries where several agreed, and from the regulations as I know
 * them; see docs/2026-11-25-session-notes.md):
 *
 *   - 2026/27 weekly rates: daily living £76.70 standard, £114.60 enhanced;
 *     mobility £30.30 standard, £80.00 enhanced (Carers UK, Which?, Age UK
 *     agree). Proposed 2027/28 rates exist but aren't used here.
 *   - The four-point rule (at least 4 points in one daily living activity) was
 *     dropped from the welfare bill in July 2025 and isn't in force. The Timms
 *     review of PIP has made recommendations; any change to the test would
 *     need legislation and nothing has changed for claims made now.
 *   - Descriptors and points: the Social Security (Personal Independence
 *     Payment) Regulations 2013, Schedule 1, written from memory and checked
 *     against the shape of the DWP's assessment guide. **Verify wording.**
 *   - Reg. 4(2A) reliability (safely, acceptable standard, repeatedly,
 *     reasonable time = no more than twice as long) and reg. 7 (more than 50%
 *     of days; the highest-scoring if several do; if none does alone but they
 *     add up past half, the one met most often) are confirmed by search
 *     summaries of legislation.gov.uk and the DWP guidance.
 *   - Required period: needs for 3 months, expected to last 9 more. Special
 *     rules: a clinician says someone may have 12 months or less to live; the
 *     enhanced daily living rate without the test, form SR1, mobility still
 *     scored. New claims by phone (0800 917 2222, England and Wales); the form
 *     ("How your disability affects you", PIP2) arrives in about two weeks and
 *     is due back a month from its date; more time can be asked for.
 *     Scotland: Adult Disability Payment, Social Security Scotland, same rates.
 *     Northern Ireland: PIP via the Department for Communities.
 *   - From memory, not verified: PIP is paid from the date of the claim call;
 *     Blue Badge automatic with 8+ points in moving around or 10 points for
 *     "can't undertake any journey" because of distress (England); vehicle
 *     tax free with enhanced mobility, half with standard; Motability needs
 *     enhanced mobility; a carer needs the daily living part (either rate) for
 *     Carer's Allowance; PIP exempts a household from the benefit cap and
 *     isn't counted as income for Universal Credit. **Verify.**
 *
 * The read is a scoring of what you describe, not a decision; the DWP (or
 * Social Security Scotland) decides, usually after an assessment. Pure data
 * and functions, no React.
 */

import { formatMoney } from "./worth";
import { addDaysISO, isISODate, letterDate, todayISO } from "./refund";
import { RATE as CA_RATE } from "./carers";

export { isISODate, letterDate, todayISO, CA_RATE };

export const DL_STANDARD = 76.7;
export const DL_ENHANCED = 114.6;
export const MOB_STANDARD = 30.3;
export const MOB_ENHANCED = 80.0;
export const STANDARD_POINTS = 8;
export const ENHANCED_POINTS = 12;

/** Below this many activities answered, a low score is "so far", not a verdict. */
export const EARLY = 6;

export const CLAIM_LINE = "0800 917 2222";
/** Roughly when the form arrives after the claim call. */
export const FORM_ARRIVES_DAYS = 14;
/** The form is due back about a month from its date. */
export const FORM_DUE_DAYS = 30;

export type Whose = "" | "mine" | "other";
export type Where = "" | "ew" | "scotland" | "ni";
export type Age = "" | "adult" | "over" | "child";
export type Duration = "" | "ok" | "under3" | "terminal";
export type Current = "" | "none" | "review" | "refused";
/** How many days in a typical week the bad-day answer is true. */
export type Days = "" | "most" | "some" | "few";

export type ActivityId =
  | "food"
  | "eat"
  | "therapy"
  | "wash"
  | "toilet"
  | "dress"
  | "talk"
  | "read"
  | "people"
  | "money"
  | "plan"
  | "move";

export type Option = {
  /** The descriptor letter in Schedule 1. */
  id: string;
  points: number;
  /** What happens, in plain words. */
  label: string;
  /** The sentence that opens the draft for this descriptor, first person. */
  draft: string;
};

export type Activity = {
  id: ActivityId;
  n: number;
  part: "daily" | "mobility";
  label: string;
  /** What it covers and what to count, in plain words. */
  hint: string;
  options: Option[];
  /** Brackets that fit this activity: what goes wrong without help. */
  without: string;
};

/*
 * The descriptors, in plain words. Order is the Schedule's: a (0 points)
 * first. Labels describe behaviour on a bad day; points are the statute's.
 */
export const ACTIVITIES: Activity[] = [
  {
    id: "food",
    n: 1,
    part: "daily",
    label: "Preparing food",
    hint: "Making a simple one-course hot meal from fresh ingredients: peeling, chopping, using the hob, lifting a pan, knowing it's cooked.",
    without: "[burned myself on [date] / left the hob on / skip meals and eat cold food from packets]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own, safely and in a reasonable time", draft: "" },
      { id: "b", points: 2, label: "I need an aid: a perching stool, adapted knives, a kettle tipper", draft: "I can only prepare food with [a perching stool / adapted knives / a kettle tipper], because I can't [stand for long / grip / lift a full pan]." },
      { id: "c", points: 2, label: "I can't use a cooker safely, only a microwave", draft: "I can't cook a simple meal using a cooker. I can only heat things in a microwave, because [I can't lift pans / I lose concentration and leave the hob on / I can't stand long enough]." },
      { id: "d", points: 2, label: "I need someone to prompt me to do it, or to start", draft: "I need someone to prompt me to prepare a meal. Without it I don't, because [I have no motivation / I forget / I can't organise the steps]." },
      { id: "e", points: 4, label: "I need someone there to watch over me or help me", draft: "I need someone with me to prepare and cook a simple meal, to [watch that I'm safe with the hob and knives / help me lift and drain pans / help me chop], because [I drop things / I get dizzy / I lose track]." },
      { id: "f", points: 8, label: "I can't prepare and cook food at all", draft: "I can't prepare and cook food at all. Someone else does it for me, because [what stops me]." },
    ],
  },
  {
    id: "eat",
    n: 2,
    part: "daily",
    label: "Eating and drinking",
    hint: "Cutting food, getting it to your mouth, chewing and swallowing, knowing when you've had enough. Includes tube feeding.",
    without: "[choke / don't eat / have lost [amount] in weight since [when]]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own", draft: "" },
      { id: "b", points: 2, label: "I need an aid, someone to cut up my food, or someone watching me eat", draft: "I need [adapted cutlery / someone to cut up my food / someone with me while I eat, because I choke]." },
      { id: "c", points: 2, label: "I'm fed by a tube or other therapeutic source, and manage it myself", draft: "I take nutrition through [a feeding tube / other], which I manage myself." },
      { id: "d", points: 4, label: "I need someone to prompt me to eat or drink", draft: "I need someone to remind or encourage me to eat and drink. Without it I don't eat, because [I don't feel hungry / I forget / my mental health]." },
      { id: "e", points: 6, label: "I need help to manage a feeding tube", draft: "I need someone to help me manage my [feeding tube]." },
      { id: "f", points: 10, label: "Someone else has to put food and drink in my mouth", draft: "I can't get food and drink to my mouth. Someone else has to feed me." },
    ],
  },
  {
    id: "therapy",
    n: 3,
    part: "daily",
    label: "Medicines, treatment and monitoring",
    hint: "Taking tablets, injections, inhalers, checking blood sugar, home therapy such as physio exercises or dialysis. Pill organisers and alarms count as aids.",
    without: "[missed doses / took a double dose on [date] / went into a hypo on [date]]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own, or don't need any", draft: "" },
      { id: "b", points: 1, label: "I need an aid (pill organiser, alarm) or a prompt or help with medicines or monitoring", draft: "I need [a pill organiser / phone alarms / someone to remind me / someone to check I've taken the right tablets / help with my blood sugar checks] to manage my medication, because [I forget / I can't open packs / I get confused]." },
      { id: "c", points: 2, label: "I need help with therapy at home, up to 3½ hours a week", draft: "I need someone to help me with [therapy, e.g. physiotherapy exercises] at home, for about [how long] a week." },
      { id: "d", points: 4, label: "Help with home therapy, 3½ to 7 hours a week", draft: "I need someone to help me with [therapy] at home, for about [how many] hours a week." },
      { id: "e", points: 6, label: "Help with home therapy, 7 to 14 hours a week", draft: "I need someone to help me with [therapy] at home, for about [how many] hours a week." },
      { id: "f", points: 8, label: "Help with home therapy, more than 14 hours a week", draft: "I need someone to help me with [therapy, e.g. home dialysis] at home, for more than 14 hours a week." },
    ],
  },
  {
    id: "wash",
    n: 4,
    part: "daily",
    label: "Washing and bathing",
    hint: "Washing your whole body, getting in and out of a bath or shower. A shower seat or rail counts as an aid.",
    without: "[go [number] days without washing / slipped in the shower on [date]]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own", draft: "" },
      { id: "b", points: 2, label: "I need an aid: a shower seat, bath board, grab rail, long-handled sponge", draft: "I can only wash using [a shower seat / bath board / grab rails / a long-handled sponge], because I can't [stand / balance / reach]." },
      { id: "c", points: 2, label: "I need prompting to wash, or someone nearby in case", draft: "I need someone to prompt me to wash, or to be nearby while I do, because [I have no motivation / I've fallen / I have seizures]." },
      { id: "d", points: 2, label: "I need help washing my hair or below the waist", draft: "I need someone to help me wash [my hair / my legs and feet], because I can't [bend / lift my arms / grip]." },
      { id: "e", points: 3, label: "I need help getting in or out of the bath or shower", draft: "I need someone to help me get in and out of the [bath / shower], because [my legs give way / I can't lift my leg over the side / I get dizzy]." },
      { id: "f", points: 4, label: "I need help washing between my shoulders and waist", draft: "I need someone to help me wash my body between my shoulders and waist, because I can't [reach / use my arms]." },
      { id: "g", points: 8, label: "I can't wash at all; someone has to wash all of me", draft: "I can't wash and bathe myself at all. Someone has to wash my whole body." },
    ],
  },
  {
    id: "toilet",
    n: 5,
    part: "daily",
    label: "The toilet, and continence",
    hint: "Getting on and off, cleaning yourself, managing pads, a catheter or stoma. A raised seat or rail counts as an aid.",
    without: "[have accidents / don't make it in time / can't clean myself properly]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own", draft: "" },
      { id: "b", points: 2, label: "I need an aid (raised seat, rails), or manage pads, a catheter or stoma myself", draft: "I need [a raised toilet seat / grab rails / pads / a catheter / a stoma bag], which I manage myself." },
      { id: "c", points: 2, label: "I need prompting or someone nearby", draft: "I need someone to prompt me to go to the toilet, or to be nearby, because [I forget / I've fallen]." },
      { id: "d", points: 4, label: "I need help with the toilet itself: getting on and off, or cleaning myself", draft: "I need someone to help me [get on and off the toilet / clean myself afterwards], because [I can't bend / twist / grip / stand up from low seats]." },
      { id: "e", points: 6, label: "I need help managing incontinence of bladder or bowel", draft: "I need someone to help me manage incontinence of my [bladder / bowel]: changing pads, cleaning myself, changing clothes and bedding." },
      { id: "f", points: 8, label: "I need help managing incontinence of both", draft: "I need someone to help me manage incontinence of both my bladder and bowel." },
    ],
  },
  {
    id: "dress",
    n: 6,
    part: "daily",
    label: "Dressing and undressing",
    hint: "Putting on and taking off clothes and shoes, choosing clothes for the weather, knowing when to change. Elastic laces and grabbers count as aids.",
    without: "[stay in the same clothes for days / sleep in my clothes / lost my balance putting trousers on]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own", draft: "" },
      { id: "b", points: 2, label: "I need an aid: a button hook, grabber, elastic laces", draft: "I need [a button hook / a grabber / elastic laces / to sit down] to dress, because I can't [grip / bend / balance]." },
      { id: "c", points: 2, label: "I need prompting to change, or to choose clothes that suit the weather", draft: "I need someone to prompt me to get dressed or change my clothes, or to choose clothes that are right for the weather, because [I have no motivation / I don't notice]." },
      { id: "d", points: 2, label: "I need help with my lower body: socks, shoes, trousers", draft: "I need someone to help me put on [socks / shoes / trousers / tights], because I can't [bend / reach my feet]." },
      { id: "e", points: 4, label: "I need help with my upper body: buttons, a bra, getting arms in", draft: "I need someone to help me dress my upper body: [buttons / zips / a bra / getting my arms into sleeves], because I can't [lift my arms / use my fingers]." },
      { id: "f", points: 8, label: "I can't dress or undress at all", draft: "I can't dress or undress myself at all. Someone has to do it for me." },
    ],
  },
  {
    id: "talk",
    n: 7,
    part: "daily",
    label: "Talking, hearing and understanding",
    hint: "Speaking and understanding what's said, in your first language. A hearing aid counts; communication support means someone trained or who knows you well.",
    without: "[misunderstood the doctor on [date] / can't use the phone]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own", draft: "" },
      { id: "b", points: 2, label: "I need an aid to speak or hear (hearing aid, speech app)", draft: "I need [hearing aids / a communication app] to speak or hear." },
      { id: "c", points: 4, label: "I need someone to help me with complex information (appointments, letters read aloud)", draft: "I need someone who knows me, or a trained supporter, to help me understand or express complex information, such as [what a doctor tells me / instructions], because [my hearing / my speech / processing]." },
      { id: "d", points: 8, label: "I need that help even with simple things (\"what time is it?\")", draft: "I need someone who knows me, or a trained supporter, to help me understand or express even simple information." },
      { id: "e", points: 12, label: "I can't express or understand speech at all, even with help", draft: "I can't express or understand verbal information at all, even with support." },
    ],
  },
  {
    id: "read",
    n: 8,
    part: "daily",
    label: "Reading signs, symbols and words",
    hint: "Reading and understanding written information in your language. Glasses don't count as an aid; a magnifier or screen reader does.",
    without: "[missed an appointment on [date] / can't read my post]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own (with glasses if I need them)", draft: "" },
      { id: "b", points: 2, label: "I need an aid other than glasses: a magnifier, screen reader, coloured overlay", draft: "I need [a magnifier / a screen reader / coloured overlays] to read, because [my sight / dyslexia]." },
      { id: "c", points: 2, label: "I need help understanding complex writing: letters, forms, bills", draft: "I need someone to help me read and understand complex information, like [letters, bills and forms], because [what makes it hard]." },
      { id: "d", points: 4, label: "I need help even with basic writing: signs, labels, a short note", draft: "I need someone to help me read and understand even basic information, like [signs, labels, a timetable]." },
      { id: "e", points: 8, label: "I can't read or understand signs, symbols or words at all", draft: "I can't read or understand signs, symbols or words at all." },
    ],
  },
  {
    id: "people",
    n: 9,
    part: "daily",
    label: "Mixing with other people",
    hint: "Being with people face to face: understanding body language, making relationships, without overwhelming anxiety or behaving in a way that's a risk.",
    without: "[had a panic attack on [date] / haven't left the house to see anyone since [when]]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own", draft: "" },
      { id: "b", points: 2, label: "I need someone to encourage me beforehand", draft: "I need someone to encourage me before I can be with other people, because [of anxiety / I don't understand social cues]." },
      { id: "c", points: 4, label: "I need someone I trust, or a trained person, with me", draft: "I can only be with other people if [someone I trust / a trained support worker] is with me, because [what happens: panic, shutdown, I can't follow what's happening]." },
      { id: "d", points: 8, label: "I can't, because of overwhelming distress, or because I might harm someone", draft: "I can't engage with other people face to face, because it causes me overwhelming psychological distress [or: I behave in a way that puts me or others at risk]." },
    ],
  },
  {
    id: "money",
    n: 10,
    part: "daily",
    label: "Budgeting decisions",
    hint: "Working out the cost of shopping and change, and planning bills and spending. Not about having enough money.",
    without: "[run out of money / missed bills / spent everything on [what]]",
    options: [
      { id: "a", points: 0, label: "I can do it on my own", draft: "" },
      { id: "b", points: 2, label: "I need help with complex decisions: bills, budgeting a month", draft: "I need someone to help me with complex budgeting decisions, like [planning bills / working out a month's money], because [I can't concentrate / my memory / anxiety]." },
      { id: "c", points: 4, label: "I need help even with simple ones: the cost of shopping, my change", draft: "I need someone to help me with simple budgeting decisions, like [working out the cost of a few items and my change]." },
      { id: "d", points: 6, label: "I can't make any budgeting decisions at all", draft: "I can't make any budgeting decisions at all. Someone else does it for me." },
    ],
  },
  {
    id: "plan",
    n: 11,
    part: "mobility",
    label: "Planning and following journeys",
    hint: "Working out a route and following it, on familiar and unfamiliar journeys, without getting lost or overwhelmed. Not about walking.",
    without: "[got lost on [date] / turned back because of panic / haven't been out alone since [when]]",
    options: [
      { id: "a", points: 0, label: "I can plan and follow journeys on my own", draft: "" },
      { id: "b", points: 4, label: "I need someone to encourage me before I can go out, or I couldn't face it", draft: "I need someone to encourage me before I can go on any journey, or the distress would be overwhelming." },
      { id: "c", points: 8, label: "I can't plan the route of a journey", draft: "I can't plan the route of a journey, because [my memory / I can't process the steps / my sight]." },
      { id: "d", points: 10, label: "I can't follow an unfamiliar route without someone, a guide dog or an aid", draft: "I can't follow the route of an unfamiliar journey without [another person / my assistance dog / an orientation aid], because [I get lost / panic / can't see]." },
      { id: "e", points: 10, label: "I can't go out at all: the distress would be overwhelming", draft: "I can't undertake any journey, because it causes me overwhelming psychological distress." },
      { id: "f", points: 12, label: "I can't follow even a familiar route without someone, a guide dog or an aid", draft: "I can't follow the route of even a familiar journey without [another person / my assistance dog / an orientation aid]." },
    ],
  },
  {
    id: "move",
    n: 12,
    part: "mobility",
    label: "Moving around",
    hint: "How far you can stand and walk, with a stick or frame if you use one, before pain, breathlessness, exhaustion or falling stops you. Count it safely, at a normal pace, and as often as you'd need to. 50 metres is about the length of an Olympic pool; 20 metres is two buses.",
    without: "[have to stop and lean on something / fell on [date] / am in pain for [how long] afterwards]",
    options: [
      { id: "a", points: 0, label: "More than 200 metres", draft: "" },
      { id: "b", points: 4, label: "More than 50 but no more than 200 metres", draft: "I can stand and walk more than 50 metres but no more than [how far, e.g. 100] metres before I have to stop, because of [pain / breathlessness / exhaustion / balance]." },
      { id: "c", points: 8, label: "20 to 50 metres, without a stick or frame", draft: "I can stand and walk only [how far, e.g. 30] metres before I have to stop, because of [pain / breathlessness / exhaustion]." },
      { id: "d", points: 10, label: "20 to 50 metres, only with a stick, crutches or frame", draft: "Even with my [stick / crutches / frame], I can stand and walk only [how far, e.g. 30] metres before I have to stop, because of [pain / breathlessness / balance]." },
      { id: "e", points: 12, label: "No more than 20 metres, with or without an aid", draft: "I can stand and move no more than [how far, e.g. 10] metres, with or without [my stick / frame / wheelchair], before I have to stop." },
      { id: "f", points: 12, label: "I can't stand and move more than 1 metre", draft: "I can't stand and move more than a metre, with or without an aid." },
    ],
  },
];

export const ACTIVITY_IDS = ACTIVITIES.map((a) => a.id);

export function activityOf(id: ActivityId): Activity {
  return ACTIVITIES.find((a) => a.id === id)!;
}

/**
 * One activity's answer: what happens on a bad day, how many days a week are
 * like that, and (if bad days aren't most days) what happens on the others.
 */
export type Answer = { opt: string; days: Days; usual?: string };

export type PipInputs = {
  whose: Whose;
  /** What you call them, for the messages. */
  name: string;
  where: Where;
  age: Age;
  duration: Duration;
  current: Current;
  answers: Partial<Record<ActivityId, Answer>>;
  /** Someone looks after them 35 hours a week or more, under State Pension age. */
  carer: "" | "yes" | "no";
};

export const BLANK_PIP: PipInputs = {
  whose: "",
  name: "",
  where: "",
  age: "",
  duration: "",
  current: "",
  answers: {},
  carer: "",
};

export function money(n: number): string {
  return formatMoney(Math.round(n), "£");
}

export function pounds2(n: number): string {
  return `£${n.toFixed(2)}`;
}

export type Scored = {
  id: ActivityId;
  n: number;
  part: "daily" | "mobility";
  label: string;
  opt: Option;
  days: Days;
  /** What happens on the other days, when bad days aren't most days. */
  usual: Option | null;
  /** Points that count on what's described (bad-day answer on most days). */
  points: number;
  /** Points if the bad-day answer turns out to apply on more than half the days. */
  potential: number;
};

export type Rate = "none" | "standard" | "enhanced";

export type Verdict =
  | "award"
  | "close"
  | "unlikely"
  | "terminal"
  | "attendance"
  | "child";

export type PipRead = {
  verdict: Verdict;
  where: Exclude<Where, "">;
  other: boolean;
  name: string;
  scored: Scored[];
  dlPoints: number;
  mobPoints: number;
  dlPotential: number;
  mobPotential: number;
  dl: Rate;
  mob: Rate;
  dlIfCounted: Rate;
  mobIfCounted: Rate;
  /** Weekly total on what's described. */
  weekly: number;
  /** Weekly total if the "some days" answers count. */
  weeklyIfCounted: number;
  /** Activities answered "some days" that would change the score if counted. */
  uncertain: Scored[];
  /** Needs for under three months: claim, but it's paid once three months have passed. */
  waiting: boolean;
  review: boolean;
  refusedBefore: boolean;
  carer: boolean;
  claimDate: string;
  formArrives: string;
  formDue: string;
  answered: number;
};

export function rateOf(points: number): Rate {
  if (points >= ENHANCED_POINTS) return "enhanced";
  if (points >= STANDARD_POINTS) return "standard";
  return "none";
}

export function dlWeekly(r: Rate): number {
  return r === "enhanced" ? DL_ENHANCED : r === "standard" ? DL_STANDARD : 0;
}

export function mobWeekly(r: Rate): number {
  return r === "enhanced" ? MOB_ENHANCED : r === "standard" ? MOB_STANDARD : 0;
}

export function rateName(r: Rate): string {
  return r === "enhanced" ? "enhanced" : r === "standard" ? "standard" : "no";
}

/**
 * Score one activity. The bad-day descriptor counts if it's true on most days
 * (reg. 7: more than half). If not, what happens on the other days counts, and
 * the bad-day descriptor is the "potential": what it would be if a count shows
 * the bad days are more than half after all.
 */
export function scoreOf(a: Activity, ans: Answer | undefined): Scored | null {
  if (!ans || !ans.opt) return null;
  const opt = a.options.find((o) => o.id === ans.opt);
  if (!opt) return null;
  const days = ans.days || (opt.points === 0 ? "most" : "");
  const usualRaw = days && days !== "most" ? a.options.find((o) => o.id === ans.usual) ?? null : null;
  const usual = usualRaw && usualRaw.points <= opt.points ? usualRaw : null;
  const base = usual ? usual.points : 0;
  const points = days === "most" ? opt.points : base;
  const potential = days === "most" || days === "some" ? Math.max(opt.points, base) : base;
  return { id: a.id, n: a.n, part: a.part, label: a.label, opt, days, usual, points, potential };
}

export function pipReady(inp: PipInputs): boolean {
  if (!inp.age) return false;
  if (inp.age === "over" || inp.age === "child") return true;
  if (!inp.duration) return false;
  if (inp.duration === "terminal") return true;
  return ACTIVITIES.some((a) => {
    const s = scoreOf(a, inp.answers[a.id]);
    return !!s && (s.opt.points === 0 || !!s.days);
  });
}

export function readPip(inp: PipInputs, today = todayISO()): PipRead | null {
  if (!pipReady(inp)) return null;
  const where = inp.where || "ew";
  const scored = ACTIVITIES.map((a) => scoreOf(a, inp.answers[a.id])).filter((s): s is Scored => !!s);
  const sum = (part: "daily" | "mobility", k: "points" | "potential") =>
    scored.filter((s) => s.part === part).reduce((t, s) => t + s[k], 0);
  const dlPoints = sum("daily", "points");
  const mobPoints = sum("mobility", "points");
  const dlPotential = sum("daily", "potential");
  const mobPotential = sum("mobility", "potential");
  const terminal = inp.duration === "terminal";
  const dl: Rate = terminal ? "enhanced" : rateOf(dlPoints);
  const mob = rateOf(mobPoints);
  const dlIfCounted: Rate = terminal ? "enhanced" : rateOf(dlPotential);
  const mobIfCounted = rateOf(mobPotential);
  const weekly = dlWeekly(dl) + mobWeekly(mob);
  const weeklyIfCounted = dlWeekly(dlIfCounted) + mobWeekly(mobIfCounted);
  const uncertain = scored.filter((s) => s.potential > s.points);
  let verdict: Verdict;
  if (inp.age === "over") verdict = "attendance";
  else if (inp.age === "child") verdict = "child";
  else if (terminal) verdict = "terminal";
  else if (weekly > 0) verdict = "award";
  else if (weeklyIfCounted > 0 || dlPotential >= 6 || mobPotential >= 6) verdict = "close";
  else verdict = "unlikely";
  const formArrives = addDaysISO(today, FORM_ARRIVES_DAYS);
  return {
    verdict,
    where,
    other: inp.whose === "other",
    name: inp.name.trim().slice(0, 30),
    scored,
    dlPoints,
    mobPoints,
    dlPotential,
    mobPotential,
    dl,
    mob,
    dlIfCounted,
    mobIfCounted,
    weekly,
    weeklyIfCounted,
    uncertain,
    waiting: inp.duration === "under3",
    review: inp.current === "review",
    refusedBefore: inp.current === "refused",
    carer: inp.carer === "yes",
    claimDate: today,
    formArrives,
    formDue: addDaysISO(formArrives, FORM_DUE_DAYS),
    answered: scored.length,
  };
}

/* ---------------------------------------------------------------- prose -- */

export function benefitName(read: Pick<PipRead, "where">): string {
  return read.where === "scotland" ? "Adult Disability Payment" : "PIP";
}

function whoCap(read: PipRead): string {
  if (!read.other) return "You";
  const n = read.name || "They";
  return n[0].toUpperCase() + n.slice(1);
}

function verb(read: PipRead, you: string, they: string): string {
  return read.other ? they : you;
}

function partsLine(dl: Rate, mob: Rate): string {
  const bits: string[] = [];
  if (dl !== "none") bits.push(`the ${rateName(dl)} daily living rate`);
  if (mob !== "none") bits.push(`the ${rateName(mob)} mobility rate`);
  return bits.join(" and ");
}

export function pipHeadline(read: PipRead): string {
  const b = benefitName(read);
  switch (read.verdict) {
    case "attendance":
      return "Over State Pension age, it's Attendance Allowance, not PIP.";
    case "child":
      return "Under 16, it's Disability Living Allowance for children.";
    case "terminal":
      return `Claim today under the special rules: at least ${pounds2(DL_ENHANCED)} a week.`;
    case "award":
      return `${whoCap(read)} ${verb(read, "score", "scores")} enough for ${partsLine(read.dl, read.mob)}: ${pounds2(read.weekly)} a week.`;
    case "close":
      return read.weeklyIfCounted > 0
        ? `Close: it turns on how many days are bad. Counted, it could be ${pounds2(read.weeklyIfCounted)} a week.`
        : `Close, but short of 8 points on what you've described.`;
    case "unlikely":
      return read.answered < EARLY
        ? `So far: ${read.dlPoints} daily living point${read.dlPoints === 1 ? "" : "s"}, ${read.mobPoints} mobility. Keep going.`
        : `Probably not on what you've described${b === "PIP" ? "" : ` for ${b}`}.`;
  }
}

export function pipBody(read: PipRead): string {
  const parts: string[] = [];
  const b = benefitName(read);
  const t = read.other ? "they" : "you";
  switch (read.verdict) {
    case "attendance":
      parts.push(
        `PIP can only be started before State Pension age. Someone already getting it at that age usually keeps it. Over that age, the benefit for help with personal care is ${read.where === "scotland" ? "Pension Age Disability Payment" : "Attendance Allowance"} (${pounds2(DL_STANDARD)} or ${pounds2(DL_ENHANCED)} a week). It has no mobility part, and it's decided on day and night needs rather than points.`,
      );
      return parts.join(" ");
    case "child":
      parts.push(
        read.where === "scotland"
          ? "Under 16 in Scotland, it's Child Disability Payment from Social Security Scotland, which carries on to 18. At 16 or after, it moves to Adult Disability Payment."
          : "Under 16, it's Disability Living Allowance (DLA) for children, claimed by a parent. Around 16, the DWP writes to invite a PIP claim; that's when this tool applies.",
      );
      return parts.join(" ");
    case "terminal":
      parts.push(
        read.where === "scotland"
          ? `When a clinician judges that someone has a progressive illness likely to cause their death, ${b} is paid under the special rules at the enhanced daily living rate, with no points test and no waiting. Scotland has no 12-month line; the clinician fills in a BASRiS form.`
          : `When a doctor, nurse or other clinician says someone may have 12 months or less to live, PIP is paid under the special rules: the enhanced daily living rate (${pounds2(DL_ENHANCED)} a week) without the points test, no three-month wait, and no assessment for daily living. The clinician completes form SR1 and can send it themselves.`,
      );
      parts.push(
        read.mob !== "none"
          ? `Mobility is still scored. On what you've described, it's the ${rateName(read.mob)} rate too: ${pounds2(read.weekly)} a week in all.`
          : `Mobility is still scored, from a short set of questions about getting around. Answer the two mobility activities below to see if that part is likely too.`,
      );
      return parts.join(" ");
    case "award":
      parts.push(
        `Daily living: ${read.dlPoints} point${read.dlPoints === 1 ? "" : "s"} (8 is the standard rate, 12 the enhanced). Mobility: ${read.mobPoints}. That's ${partsLine(read.dl, read.mob)}, ${pounds2(read.weekly)} a week, about ${money(read.weekly * 52)} a year. Not means-tested, not taxed, and ${t} can work.`,
      );
      break;
    case "close":
      parts.push(
        `Counting only what happens on most days, it's ${read.dlPoints} daily living point${read.dlPoints === 1 ? "" : "s"} and ${read.mobPoints} mobility (8 is the line for each). ${read.uncertain.length ? `But you've said some answers are true on "some days". A descriptor counts if it applies on more than half the days, and nobody knows that count until they keep one.` : "It's worth counting a fortnight before deciding."}`,
      );
      break;
    case "unlikely":
      if (read.answered < EARLY) {
        parts.push(
          `Each part needs 8 points, and they come from adding up the activities, so one or two answers rarely get there. Go through the rest, including the ones that seem minor: an aid or a reminder is worth 1 or 2 points, and those add up.`,
        );
        break;
      }
      parts.push(
        `Daily living: ${read.dlPoints} point${read.dlPoints === 1 ? "" : "s"}; mobility: ${read.mobPoints}. Each part needs 8. PIP isn't about the diagnosis; it's about what the condition stops ${t === "you" ? "you" : "them"} doing reliably. Before deciding, go through each activity again for a bad day, and ask of each thing ${t} "can" do: safely? to a good enough standard? more than once? in less than twice the time it would take someone else? If not, ${t} can't, for PIP's purposes.`,
      );
      break;
  }
  if (read.uncertain.length && (read.verdict === "award" || read.verdict === "close") && read.weeklyIfCounted > read.weekly) {
    const list = read.uncertain.map((s) => s.label.toLowerCase()).join(", ");
    parts.push(
      `If the bad days for ${list} turn out to be more than half the days, it's ${partsLine(read.dlIfCounted, read.mobIfCounted)}: ${pounds2(read.weeklyIfCounted)} a week, ${money((read.weeklyIfCounted - read.weekly) * 52)} a year more. Keep the two-week day count below before writing those answers.`,
    );
  }
  if (read.waiting)
    parts.push(
      `The needs have to have lasted three months (and be expected to last nine more) before it's paid. ${read.other ? "They" : "You"} can claim before that; it's paid once the three months are up.`,
    );
  if (read.review)
    parts.push(
      `For a review form, describe how things are now, and say plainly what's changed since the last award, better or worse. The award can go down as well as up, so answer from the same bad-day count.`,
    );
  if (read.refusedBefore && read.verdict !== "unlikely")
    parts.push(
      `A past refusal doesn't stop a new claim. If the decision was in the last month, a mandatory reconsideration is usually better than starting again; see the benefit decision tool.`,
    );
  if ((read.verdict === "award" || read.verdict === "close") && !read.review)
    parts.push(
      read.where === "scotland"
        ? "Apply on mygov.scot or by phone to Social Security Scotland. It's paid from the date you start the application."
        : read.where === "ni"
          ? "In Northern Ireland, PIP is claimed by phone from the Department for Communities (see nidirect). The same points apply."
          : `Claims start with a phone call to ${CLAIM_LINE}, and it's paid from that date. The form comes in about two weeks and is due back a month from its date.`,
    );
  return parts.join(" ");
}

export type Tile = { label: string; value: string; note: string };

export function tilesOf(read: PipRead): Tile[] {
  if (read.verdict === "attendance" || read.verdict === "child") return [];
  const out: Tile[] = [];
  out.push({ label: "Daily living", value: read.verdict === "terminal" ? "Enhanced" : `${read.dlPoints} pts`, note: read.verdict === "terminal" ? "under the special rules, without points" : read.dlPotential > read.dlPoints ? `${read.dlPotential} if the "some days" count` : "8 standard, 12 enhanced" });
  out.push({ label: "Mobility", value: `${read.mobPoints} pts`, note: read.mobPotential > read.mobPoints ? `${read.mobPotential} if the "some days" count` : "8 standard, 12 enhanced" });
  if (read.weekly > 0)
    out.push({ label: "A week", value: pounds2(read.weekly), note: `about ${money(read.weekly * 52)} a year` });
  else if (read.weeklyIfCounted > 0)
    out.push({ label: "If counted", value: pounds2(read.weeklyIfCounted), note: `a week, about ${money(read.weeklyIfCounted * 52)} a year` });
  else out.push({ label: "The line", value: "8 points", note: "in either part, for the standard rate" });
  return out;
}

/* ------------------------------------------------------- the form drafts -- */

export type Draft = { id: string; title: string; prompt: string; text: string };

function daysPhrase(): string {
  return "This happens on [number] days out of 7, most weeks.";
}

/** Lower-case a sentence's first letter to follow a colon, but never "I". */
function follow(sentence: string): string {
  return /^I\b/.test(sentence) ? sentence : sentence.charAt(0).toLowerCase() + sentence.slice(1);
}

function draftFor(s: Scored, a: Activity): Draft {
  const opening =
    s.days !== "most" && s.usual && s.usual.points > 0
      ? `${s.usual.draft} On bad days, which are [number] days out of 7, it's worse: ${follow(s.opt.draft)}`
      : s.days !== "most" && s.usual
        ? `On most days I can manage this, but on bad days, which are [number] days out of 7, ${follow(s.opt.draft)}`
        : s.opt.draft;
  const reliability =
    s.part === "mobility" && s.id === "move"
      ? "After walking that far I [have to rest for [how long] / am in pain for the rest of the day]. I can't do it again [later that day]. On a good day I can manage [how far], but good days are [how many] a week."
      : "On my own, it takes me [how long, e.g. 45 minutes instead of 15], it hurts [where], and I [can't do it again later / have to rest afterwards]. Doing it without help isn't safe, because " +
        a.without +
        ".";
  return {
    id: s.id,
    title: `${a.n}. ${a.label}`,
    prompt: `${s.opt.points} point${s.opt.points === 1 ? "" : "s"} if the bad-day answer applies on more than half the days${s.points !== s.opt.points ? `; ${s.points} on what you've said now` : ""}. The form asks whether you use an aid and need help, then gives a box for detail: write in it.`,
    text: `${opening} ${s.days === "most" ? daysPhrase() : s.days === "some" ? "[Count a fortnight: if the bad days are more than half, say so, with the number.]" : ""}

${reliability}

[One real example: On [date], I [what happened].]`,
  };
}

function fluctuationDraft(read: PipRead): Draft {
  return {
    id: "fluctuates",
    title: "How it varies (for the extra information box)",
    prompt: "The form asks about each activity, but not directly about how things change from day to day. Say it once, here or at the start of the first box.",
    text: `My condition varies. In a typical week I have about [number] bad days, when [what I can't do], and [number] better days, when I can [what], but more slowly and with pain, and I pay for it the next day with [what].

I have kept a record of [two weeks]: out of 14 days, [number] were bad days. I have answered each question for how things are on most days, not my best days.

${read.uncertain.length ? `For ${read.uncertain.map((s) => s.label.toLowerCase()).join(", ")}, the help I need on bad days is needed on [number] days out of 14.` : "[Anything else that affects every activity: medication side effects, fatigue, pain, anxiety.]"}`,
  };
}

export function draftsOf(read: PipRead): Draft[] {
  if (read.verdict === "attendance" || read.verdict === "child") return [];
  const out: Draft[] = [];
  for (const s of read.scored) {
    if (s.potential === 0) continue;
    if (read.verdict === "terminal" && s.part === "daily") continue;
    out.push(draftFor(s, activityOf(s.id)));
  }
  if (out.length && read.verdict !== "terminal") out.push(fluctuationDraft(read));
  return out;
}

/** What turns a true claim into a refusal. */
export function formRules(read: PipRead): string[] {
  const t = read.other ? "they" : "you";
  return [
    `Answer for most days, not the best day. A descriptor counts if it applies on more than half the days in a year, so the question under every question is "on how many days?"`,
    `If ${t} can only do something unsafely, badly, once, or taking more than twice as long as someone else would, ${t} can't do it, for PIP. Say which, and why.`,
    `Tick "yes" for aids even if they're basic: a perching stool, a long-handled sponge, a pill organiser, phone alarms. Each can be 1 or 2 points.`,
    `Needing someone to remind, encourage or check counts. So does needing someone nearby in case. Say what happens when nobody's there.`,
    `Write in the boxes. The tick boxes alone lose claims; the boxes are where the days, the times and the examples go.`,
    `Give numbers: days a week, minutes, metres. "I can walk about 30 metres, the length of three buses, before the pain makes me stop" beats "I can't walk far".`,
    `Keep the day count for two weeks before filling it in. Photocopy the form, and send it on time without the supporting letters if they haven't come.`,
    `At the assessment, the assessor watches as well as asks: how ${t} got there, how ${t} sat, whether ${t} needed help with a coat. Describe a bad day; don't perform a good one. Take someone with ${t === "you" ? "you" : "them"}, and ask for the call to be recorded.`,
  ];
}

/* --------------------------------------------------------------- checks -- */

export type Unlock = { label: string; note: string };

export function unlocksOf(read: PipRead): Unlock[] {
  const out: Unlock[] = [];
  const dl = read.dl !== "none" || read.dlIfCounted !== "none";
  const mob = read.mob !== "none" || read.mobIfCounted !== "none";
  const mobEnh = read.mob === "enhanced" || read.mobIfCounted === "enhanced";
  const move = read.scored.find((s) => s.id === "move");
  const plan = read.scored.find((s) => s.id === "plan");
  if (!dl && !mob) return out;
  if (dl && read.carer)
    out.push({
      label: "Carer's Allowance for the carer",
      note: `${pounds2(CA_RATE)} a week for someone under State Pension age caring 35 hours a week or more, earning under the limit. It needs the daily living part, either rate. See the Carer's Allowance tool for the earnings cliff.`,
    });
  out.push({
    label: "Extra in Universal Credit or other benefits",
    note: "PIP isn't counted as income for Universal Credit, Housing Benefit or Council Tax Reduction, and any award takes a household out of the benefit cap. Some extra amounts follow it: a carer element for a carer, and a severe disability premium in older benefits for someone living alone. Tell every office that pays you when it's awarded.",
  });
  if ((move && move.potential >= 8) || (plan && plan.potential >= 10 && plan.opt.id === "e"))
    out.push({
      label: "A Blue Badge, usually without an assessment",
      note: "In England, an award with 8 points or more in moving around (or 10 for not being able to go out because of overwhelming distress) usually means a Blue Badge without further assessment. Apply to the council with the award letter.",
    });
  if (mob)
    out.push({
      label: mobEnh ? "Free vehicle tax, and Motability" : "Half-price vehicle tax",
      note: mobEnh
        ? "The enhanced mobility rate gives an exemption from vehicle tax, and can be swapped for a car, scooter or powered wheelchair through the Motability scheme."
        : "The standard mobility rate gives a 50% reduction in vehicle tax for a car registered in the claimant's name (or their nominated driver's).",
    });
  out.push({
    label: "A Disabled Persons Railcard, and local bus passes",
    note: "A third off most rail fares for the claimant and a companion. Free bus travel depends on the council and usually on the mobility points.",
  });
  return out;
}

export function checksOf(read: PipRead): string[] {
  const out: string[] = [];
  const b = benefitName(read);
  if (read.verdict === "attendance") {
    out.push("Already on PIP at State Pension age? It carries on, with the mobility part. Don't swap to Attendance Allowance.");
    out.push("Attendance Allowance is decided on the help needed by day and by night. It has its own tool on this site.");
    return out;
  }
  if (read.verdict === "child") {
    out.push("A child on DLA who turns 16 is invited to claim PIP; the DLA carries on until the PIP decision, so return the PIP form on time.");
    return out;
  }
  out.push(`${b} isn't means-tested or taxed, and doesn't depend on National Insurance. Work, savings and a partner's income make no difference.`);
  out.push("It's not about the diagnosis. Two people with the same condition can score very differently; the score is about what the condition stops each of them doing, on most days.");
  out.push(
    read.where === "scotland"
      ? "Adult Disability Payment uses the same activities and points as PIP. Social Security Scotland gathers supporting information for you if you ask, and face-to-face assessments are rare."
      : "Most claims include an assessment by phone, video or in person, by a health professional working for the DWP. You can take someone with you, and ask in advance for the call to be recorded.",
  );
  out.push("Send what you already have: a care plan, a letter from a consultant, nurse, physio, OT or support worker, a prescription list. Don't hold the form back for new letters.");
  out.push("If the decision is wrong, ask for a mandatory reconsideration within one month of the letter, then appeal to a tribunal. A large share of PIP appeals succeed.");
  if (read.where === "ni") out.push("In Northern Ireland, PIP is run by the Department for Communities, with the same points and rates.");
  out.push("The four-point rule that was in the news in 2025 isn't law; it was dropped. The Timms review may change PIP in future, but any change needs new legislation, and claims made now are decided on today's rules.");
  return out;
}

/* ---------------------------------------------------------------- dates -- */

export type DateLine = { on: string; title: string; body: string };

export function remindersOf(read: PipRead, today: string): DateLine[] {
  if (read.verdict === "attendance" || read.verdict === "child") return [];
  if (read.verdict === "unlikely") return [];
  const out: DateLine[] = [];
  const whose = read.other ? (read.name ? `${read.name}'s ` : "their ") : "";
  if (read.review) {
    out.push({ on: today, title: "Start the two-week day count", body: "Every day, tick the activities that were bad. Fill in the review form from the count, not from memory." });
    out.push({ on: addDaysISO(today, 14), title: "Fill in the review form from the count", body: "Say what has changed since the last award. Photocopy it, and post it by the date on the form." });
    return out;
  }
  out.push({
    on: today,
    title: read.where === "scotland" ? `Apply for ${whose}Adult Disability Payment` : `Call to start ${whose}PIP claim`,
    body:
      read.where === "scotland"
        ? "Apply on mygov.scot or by phone to Social Security Scotland. It's paid from the date you start."
        : read.verdict === "terminal"
          ? `Call ${CLAIM_LINE} and say it's a claim under the special rules. The clinician sends form SR1.`
          : `Call ${CLAIM_LINE}. It's paid from the date of this call. Have the National Insurance number, GP details and bank details to hand.`,
  });
  if (read.verdict !== "terminal")
    out.push({
      on: today,
      title: "Start the two-week day count",
      body: "Each evening, tick which activities were bad that day. By the time the form comes, you'll know how many days out of 14, which is what the points turn on.",
    });
  if (read.where !== "scotland" && read.verdict !== "terminal") {
    out.push({
      on: read.formArrives,
      title: "The form should have arrived",
      body: `If it hasn't, call ${CLAIM_LINE}. When it comes, note the date on it: it's due back a month from then. Ask for more time on the phone if you need it, and get it confirmed.`,
    });
    out.push({
      on: addDaysISO(read.formDue, -7),
      title: "Post the form this week",
      body: `Photocopy every page first. Due back about ${letterDate(read.formDue)}, if it was sent when expected; the date on the form is the one that counts. Send it recorded.`,
    });
  }
  return out.filter((d) => isISODate(d.on) && d.on >= today);
}

/* ------------------------------------------------------------- messages -- */

export type Message = { id: string; title: string; note: string; text: string };

export function messagesOf(read: PipRead): Message[] {
  const out: Message[] = [];
  const live = read.verdict === "award" || read.verdict === "close" || read.verdict === "terminal";
  if (!live) return out;
  if (read.where !== "scotland" && !read.review) {
    out.push({
      id: "call",
      title: "The claim call",
      note: `The PIP new claims line is ${CLAIM_LINE} (England and Wales; Relay UK 18001 then the number). The call takes about 20 minutes. If you're calling for someone else, they'll usually need to be there to agree.`,
      text: `I'd like to make a new claim for Personal Independence Payment${read.verdict === "terminal" ? " under the special rules for end of life. A [doctor / nurse] is completing form SR1" : ""}.

Name: [full name]
Date of birth: [date]
National Insurance number: [number]
Address and phone: [details]
GP or health professional: [name, practice, address]
Bank details: [account for payment]
Nationality and time in the UK: [details]
Any time in hospital, a care home or abroad: [details]

${read.verdict === "terminal" ? "" : "Please note today as the date of claim. If I need more time to return the form, I'll call before it's due."}`,
    });
  }
  if (read.verdict !== "terminal") {
    out.push({
      id: "letter",
      title: "To the GP, consultant, nurse or support worker",
      note: "Not required, and don't wait for it. A short letter that says what the condition stops someone doing, and how often, helps far more than one that lists diagnoses. Some surgeries charge.",
      text: `Dear [name],

${read.other ? `${read.name || "[name]"} (date of birth [date]) is` : "I (date of birth [date]) am"} claiming ${benefitName(read)}. Could you write a short letter describing how ${read.other ? "their" : "my"} condition affects what ${read.other ? "they" : "I"} can do reliably, meaning safely, repeatedly and in a reasonable time, and on how many days? In particular:

${read.scored.filter((s) => s.potential > 0).map((s) => `- ${s.label}`).join("\n") || "- [activities]"}

It's the effect on day-to-day activities, and how much it varies, that the decision turns on, more than the diagnosis. Thank you.

[Name]`,
    });
    out.push({
      id: "assessment",
      title: "Before the assessment: asking for it to be recorded, and for adjustments",
      note: "You can ask for a phone or video assessment to be recorded, and for reasonable adjustments (a home visit, a ground-floor room, a shorter session, someone with you). Ask in writing or on the phone when the appointment letter comes.",
      text: `Reference / NI number: [number]

I have an assessment on [date]. Please arrange for it to be audio recorded, and send me a copy of the assessment report (PA4) with the decision.

Because of my condition, I need these adjustments: [a home visit / a ground-floor room / breaks / a phone assessment instead of in person / [name] to be with me].

Thank you,
[Name]`,
    });
  }
  return out;
}

export function keepList(read: PipRead): string[] {
  const out = [
    "The date and time of the claim call, and the name of the person you spoke to.",
    "The two-week day count, which is your evidence for 'more than half the days'.",
    "A photocopy or photos of every page of the form, and the proof of postage.",
    "Copies of every letter you send with it.",
    "The decision letter, and ask for the assessment report (PA4): a refusal starts a one-month clock.",
  ];
  if (read.review) out[0] = "The date on the review form, and the date you posted it back.";
  return out;
}

export function pipRule(read: PipRead): string {
  if (read.verdict === "attendance") return "I claim Attendance Allowance instead, from the help needed by day and night.";
  if (read.verdict === "child") return "I claim DLA for a child now, and PIP when the letter comes at 16.";
  if (read.verdict === "terminal") return "I call today under the special rules and send the claim without waiting for the SR1.";
  if (read.verdict === "unlikely") return "I come back if something changes, and count a fortnight before deciding.";
  return "I count the days for two weeks and answer each question for most days, not my best one.";
}

export function pipSummary(read: PipRead, today = todayISO()): string {
  const lines = [`${benefitName(read)}: ${pipHeadline(read)}`, "", pipBody(read), ""];
  if (read.scored.some((s) => s.opt.points > 0)) {
    lines.push("Points by activity (counted / if the 'some days' count):");
    for (const s of read.scored) if (s.opt.points > 0) lines.push(`- ${s.n}. ${s.label}: ${s.points} / ${s.potential}`);
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
  const rem = remindersOf(read, today);
  if (rem.length) {
    lines.push("", "Dates:");
    for (const d of rem) lines.push(`- ${letterDate(d.on)}: ${d.title}. ${d.body}`);
  }
  lines.push(
    "",
    `Rule: ${pipRule(read)}`,
    "",
    `2026/27 rates: daily living ${pounds2(DL_STANDARD)} / ${pounds2(DL_ENHANCED)}, mobility ${pounds2(MOB_STANDARD)} / ${pounds2(MOB_ENHANCED)}. From https://bettereveryday.vercel.app/pip. A scoring of what you entered, not advice; the DWP decides.`,
  );
  return lines.join("\n");
}

/* -------------------------------------------------------------- parsing -- */

const WHOSES: Exclude<Whose, "">[] = ["mine", "other"];
const WHERES: Exclude<Where, "">[] = ["ew", "scotland", "ni"];
const AGES: Exclude<Age, "">[] = ["adult", "over", "child"];
const DURATIONS: Exclude<Duration, "">[] = ["ok", "under3", "terminal"];
const CURRENTS: Exclude<Current, "">[] = ["none", "review", "refused"];
const DAYSES: Exclude<Days, "">[] = ["most", "some", "few"];

function oneOf<T extends string>(v: unknown, list: T[]): T | "" {
  return typeof v === "string" && (list as string[]).includes(v) ? (v as T) : "";
}

export function parsePipInputs(raw: unknown): PipInputs {
  if (!raw || typeof raw !== "object") return BLANK_PIP;
  const v = raw as Record<string, unknown>;
  const answers: Partial<Record<ActivityId, Answer>> = {};
  if (v.answers && typeof v.answers === "object") {
    const a = v.answers as Record<string, unknown>;
    for (const act of ACTIVITIES) {
      const x = a[act.id];
      if (!x || typeof x !== "object") continue;
      const o = x as Record<string, unknown>;
      const opt = oneOf(o.opt, act.options.map((p) => p.id));
      if (!opt) continue;
      const usual = oneOf(o.usual, act.options.map((p) => p.id));
      answers[act.id] = usual ? { opt, days: oneOf(o.days, DAYSES), usual } : { opt, days: oneOf(o.days, DAYSES) };
    }
  }
  return {
    whose: oneOf(v.whose, WHOSES),
    name: typeof v.name === "string" ? v.name.slice(0, 30) : "",
    where: oneOf(v.where, WHERES),
    age: oneOf(v.age, AGES),
    duration: oneOf(v.duration, DURATIONS),
    current: oneOf(v.current, CURRENTS),
    answers,
    carer: oneOf(v.carer, ["yes", "no"] as const as unknown as ("yes" | "no")[]),
  };
}

/**
 * The worked example: Priya is 41 and has relapsing MS. Asked at the GP how
 * things are, the answer is "not bad, actually", because it's a good day.
 * Counted over two weeks: on most days, Priya needs someone there to cook
 * safely, help getting out of the shower, help with socks and shoes, and a
 * pill organiser with alarms; and can walk 50 to 200 metres before the legs
 * give out. On two or three days a week, it's 20 to 50 metres at most, which
 * is the difference between no mobility award and the standard rate.
 */
export function pipExample(): PipInputs {
  return {
    ...BLANK_PIP,
    whose: "mine",
    where: "ew",
    age: "adult",
    duration: "ok",
    current: "none",
    answers: {
      food: { opt: "e", days: "most" },
      therapy: { opt: "b", days: "most" },
      wash: { opt: "e", days: "most" },
      dress: { opt: "d", days: "most" },
      move: { opt: "c", days: "some", usual: "b" },
    },
    carer: "no",
  };
}
