/**
 * The read behind "A Baby's Coming: What to Tell, Claim, and By When?" (/baby).
 *
 * Expecting parents count forward to the due date. The money is mostly decided
 * by a date months before it that nobody marks: the qualifying week, the 15th
 * week before the week the baby is due (about 25 weeks pregnant). Whether you
 * get Statutory Maternity or Paternity Pay depends on being employed by then
 * for 26 weeks; how much you get for the first six weeks depends on your pay in
 * the eight weeks up to it; and the end of that week is the deadline to tell
 * your employer. After the birth, the deadlines get quiet again: Child Benefit
 * is only backdated three months, the £500 Sure Start Maternity Grant shuts six
 * months after the birth, and Statutory Paternity Pay has to be taken within a
 * year. So the read counts back from the due date and sorts everything by what
 * waiting would cost, the same way /bereavement does.
 *
 * UK-wide for statutory pay (HMRC runs it), with Scotland's grants and
 * Northern Ireland's employment law where they differ. Figures from search
 * summaries of payroll and HR notes, Turn2us, Working Families, Citizens
 * Advice, Social Security Scotland and law firms, since gov.uk doesn't resolve
 * from where this was written. Kept only what agreed across sources:
 *
 *   - Statutory Maternity Pay, 2026/27: 39 weeks; the first six at 90% of
 *     average weekly earnings (no cap), then £194.32 or 90% if lower. Needs 26
 *     weeks' employment with the same employer continuing into the qualifying
 *     week, and average earnings of at least £129 a week (the lower earnings
 *     limit, up from £125) over the eight weeks up to the last payday on or
 *     before the end of that week.
 *   - Notice: by the end of the qualifying week, tell your employer you're
 *     pregnant, the week the baby is due and when you want leave to start. The
 *     employer replies within 28 days with your return date. Leave can start
 *     from the 11th week before the due week. The MATB1 certificate is issued
 *     from 20 weeks before the due week; give it within 21 days of SMP
 *     starting, or the employer can refuse to pay it.
 *   - Maternity Allowance, for people who don't get SMP: the same £194.32 or
 *     90% for 39 weeks, if you worked (employed or self-employed) in 26 of the
 *     66 weeks before the due week and earned £30 a week on average in 13 of
 *     them. Claim from 26 weeks pregnant; a late claim is only backdated three
 *     months.
 *   - Paternity leave: a day-one right for employees in Great Britain since 6
 *     April 2026 (not Northern Ireland, which still needs 26 weeks). One or two
 *     weeks, in one or two blocks, within 52 weeks of the birth. Statutory
 *     Paternity Pay still needs 26 weeks by the qualifying week and earnings
 *     over £129; it's £194.32 a week or 90% if lower. Notice of the due date
 *     by the end of the qualifying week (for babies due 5 April to 25 July
 *     2026 a temporary 28-day rule applied), and 28 days before each block.
 *   - Register the birth within 42 days (England, Wales, Northern Ireland), 21
 *     in Scotland.
 *   - Child Benefit, 2026/27: £27.05 a week for the eldest or only child,
 *     £17.90 for each other. Backdated up to three months. Over £60,000 the
 *     higher earner repays 1% per £200; at £80,000 all of it. Claiming still
 *     gives a parent who isn't working National Insurance credits towards
 *     their State Pension, so claim and opt out of the payments rather than
 *     not claim.
 *   - Sure Start Maternity Grant (England, Wales, NI): £500 for a first child
 *     (usually no other child under 16) when you or your partner get a
 *     qualifying benefit such as Universal Credit. Claim from 11 weeks before
 *     the due date until six months after the birth.
 *   - Scotland's Pregnancy and Baby Payment: £796.65 for a first child,
 *     £398.35 otherwise, from April 2026. Apply from 24 weeks pregnant until
 *     six months after the birth. Not both this and the Sure Start grant.
 *
 * Not legal or tax advice. Pure data and functions, no React, so the read can
 * be checked by a script.
 */

import { actDate, addDaysISO, addMonthsISO, isISODate, letterDate, todayISO } from "./refund";

export { actDate, addDaysISO, isISODate, letterDate, todayISO };

export type BbRegion = "" | "ew" | "scot" | "ni";
export type BbRole = "" | "birth" | "partner";
export type BbWork = "" | "employed" | "self" | "none";
export type BbPer = "week" | "month" | "year";
export type BbIncome = "" | "under" | "between" | "over";
export type YesNo = "" | "yes" | "no";

export type BbInputs = {
  region: BbRegion;
  role: BbRole;
  dueOn: string;
  /** The date of birth, once the baby's here. */
  bornOn: string;
  work: BbWork;
  /** Started with this employer on. */
  startedOn: string;
  /** Gross pay, as typed. */
  pay: string;
  per: BbPer;
  /** Told the employer yet? */
  told: YesNo;
  /** Planned first day of leave; optional. */
  leaveOn: string;
  /** On Universal Credit, tax credits or another means-tested benefit. */
  benefits: YesNo;
  /** Another child under 16 in the household. */
  otherKids: YesNo;
  /** The higher earner's yearly income, for Child Benefit. */
  income: BbIncome;
};

export const BLANK_BB: BbInputs = {
  region: "",
  role: "",
  dueOn: "",
  bornOn: "",
  work: "",
  startedOn: "",
  pay: "",
  per: "month",
  told: "",
  leaveOn: "",
  benefits: "",
  otherKids: "",
  income: "",
};

/** 2026/27 rates. */
export const RATE = {
  flat: 194.32,
  lel: 129,
  maThreshold: 30,
  cbFirst: 27.05,
  cbOther: 17.9,
  ssmg: 500,
  pbpFirst: 796.65,
  pbpLater: 398.35,
};

export type BbCost = "money" | "duty" | "none";

export type BbItem = {
  id: string;
  title: string;
  on: string;
  /** "by" a deadline, "from" when it opens, "around" an approximate date. */
  onKind: "by" | "from" | "around" | "";
  cost: BbCost;
  stake: string;
  detail: string;
  done?: boolean;
};

/** Who pays what, if anything, while you're off. */
export type PayKind = "smp" | "ma" | "spp" | "none" | "unknown";

export type PayRead = {
  kind: PayKind;
  /** Why it's this kind, in a sentence. */
  why: string;
  /** Average weekly earnings, if pay was given. */
  awe: number | null;
  /** First six weeks' weekly rate (SMP), or the only rate. */
  high: number | null;
  /** Weeks 7 to 39. */
  low: number | null;
  total: number | null;
  /** What 52 weeks of usual pay would be, for the gap. */
  usualYear: number | null;
  /** Statutory pay over the same 52 weeks (SMP and MA; SPP is two weeks). */
  statYear: number | null;
};

export type BbRead = {
  region: Exclude<BbRegion, "">;
  role: Exclude<BbRole, "">;
  /** Sunday starting the week the baby is due. */
  ewc: string;
  /** Sunday starting the qualifying week, 15 weeks before. */
  qw: string;
  /** The Saturday that ends it: the notice deadline. */
  qwEnd: string;
  /** Latest start date that gives 26 weeks by the qualifying week. */
  startBy: string;
  born: boolean;
  /** The birth date, or the due date if not born yet. */
  birth: string;
  /** Weeks pregnant today, if not born. */
  weeksPregnant: number | null;
  pay: PayRead;
  /** First day of leave used for the pay timeline. */
  leaveFrom: string;
  items: BbItem[];
};

const CUR = "£";

export function money(n: number, pence = false): string {
  if (pence && Math.round(n * 100) % 100 !== 0)
    return `${CUR}${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${CUR}${Math.round(n).toLocaleString("en-GB")}`;
}

function dow(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(`${fromISO}T00:00:00`).getTime();
  const b = new Date(`${toISO}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** The Sunday on or before a date: the start of its week for statutory pay. */
export function weekStart(iso: string): string {
  return addDaysISO(iso, -dow(iso));
}

export function weeklyPay(inp: BbInputs): number | null {
  const n = Number(String(inp.pay).replace(/[£,\s]/g, ""));
  if (!inp.pay.trim() || !Number.isFinite(n) || n <= 0) return null;
  if (inp.per === "week") return n;
  if (inp.per === "month") return (n * 12) / 52;
  return n / 52;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function readPay(inp: BbInputs, qw: string, startBy: string): PayRead {
  const awe = inp.work === "employed" || inp.work === "self" ? weeklyPay(inp) : null;
  const none: PayRead = { kind: "none", why: "", awe, high: null, low: null, total: null, usualYear: null, statYear: null };
  const usualYear = awe ? awe * 52 : null;
  const ma = (why: string): PayRead => {
    if (awe === null) return { ...none, kind: "ma", why };
    if (awe < RATE.maThreshold)
      return { ...none, kind: "none", why: `${why} Maternity Allowance needs average earnings of at least ${money(RATE.maThreshold)} a week in 13 of the 66 weeks before the due week, and the pay you gave is below that.` };
    const w = r2(Math.min(RATE.flat, 0.9 * awe));
    return { kind: "ma", why, awe, high: w, low: w, total: r2(w * 39), usualYear, statYear: r2(w * 39) };
  };

  if (inp.role === "partner") {
    if (inp.work !== "employed")
      return { ...none, why: inp.work === "self" ? "Statutory Paternity Pay is for employees. Self-employed partners don't get it, and there's no paternity version of Maternity Allowance." : "Statutory Paternity Pay is for employees." };
    if (!isISODate(inp.startedOn)) return { ...none, kind: "unknown", why: "" };
    if (inp.startedOn > startBy)
      return { ...none, why: `Statutory Paternity Pay needs 26 weeks with this employer by the qualifying week (the week starting ${letterDate(qw)}), so a start after about ${letterDate(startBy)} misses it.${inp.region === "ni" ? "" : " The leave itself is still yours from day one; it's the pay that needs the 26 weeks."}` };
    if (awe === null) return { ...none, kind: "spp", why: "" };
    if (awe < RATE.lel)
      return { ...none, why: `Statutory Paternity Pay needs average earnings of at least ${money(RATE.lel)} a week in the eight weeks before the qualifying week, and the pay you gave is below that.` };
    const w = r2(Math.min(RATE.flat, 0.9 * awe));
    return { kind: "spp", why: "", awe, high: w, low: w, total: r2(w * 2), usualYear, statYear: r2(w * 2) };
  }

  if (inp.work === "none") return { ...none, why: "Statutory Maternity Pay and Maternity Allowance both depend on recent work. Without either, the help is Child Benefit, the grants below and, on a low income, Universal Credit." };
  if (inp.work === "self") return ma("Self-employed, you get Maternity Allowance rather than Statutory Maternity Pay.");
  if (inp.work !== "employed") return { ...none, kind: "unknown" };
  if (!isISODate(inp.startedOn)) return { ...none, kind: "unknown" };
  if (inp.startedOn > startBy)
    return ma(`Statutory Maternity Pay needs 26 weeks with this employer by the qualifying week (the week starting ${letterDate(qw)}), so a start after about ${letterDate(startBy)} misses it. Maternity Allowance is the fallback, from the DWP instead of your employer.`);
  if (awe === null) return { ...none, kind: "smp", why: "" };
  if (awe < RATE.lel)
    return ma(`Statutory Maternity Pay needs average earnings of at least ${money(RATE.lel)} a week in the eight weeks up to the qualifying week, and the pay you gave is below that.`);
  const high = r2(0.9 * awe);
  const low = r2(Math.min(RATE.flat, 0.9 * awe));
  return { kind: "smp", why: "", awe, high, low, total: r2(high * 6 + low * 33), usualYear, statYear: r2(high * 6 + low * 33) };
}

export function canRead(inp: BbInputs): boolean {
  return inp.region !== "" && inp.role !== "" && isISODate(inp.dueOn);
}

export function readBb(inp: BbInputs, today = todayISO()): BbRead | null {
  if (!canRead(inp)) return null;
  const region = inp.region as Exclude<BbRegion, "">;
  const role = inp.role as Exclude<BbRole, "">;
  const scot = region === "scot";
  const ni = region === "ni";
  const ewc = weekStart(inp.dueOn);
  const qw = addDaysISO(ewc, -15 * 7);
  const qwEnd = addDaysISO(qw, 6);
  // 26 weeks ending with the qualifying week; a week counts if employed in it.
  const startBy = addDaysISO(qw, -25 * 7 + 6);
  const born = isISODate(inp.bornOn) && inp.bornOn <= today;
  const birth = born ? inp.bornOn : inp.dueOn;
  const weeksPregnant = born ? null : Math.floor((280 - daysBetween(today, inp.dueOn)) / 7);
  const pay = readPay(inp, qw, startBy);
  const earliestLeave = addDaysISO(ewc, -11 * 7);
  let leaveFrom = isISODate(inp.leaveOn) ? inp.leaveOn : addDaysISO(ewc, -7);
  if (leaveFrom < earliestLeave) leaveFrom = earliestLeave;
  if (born && inp.bornOn < leaveFrom) leaveFrom = addDaysISO(inp.bornOn, 1);
  const items: BbItem[] = [];
  const told = inp.told === "yes";
  const employed = inp.work === "employed";

  // ---- Telling the employer ----
  if (employed && role === "birth") {
    items.push({
      id: "tell",
      title: "Tell your employer: pregnancy, due week, leave start",
      on: told ? "" : qwEnd,
      onKind: told ? "" : "by",
      cost: "duty",
      stake: told ? "Done" : "Late notice lets them push back the start of your leave and pay",
      detail: told
        ? "Done. They should have written back within 28 days with the date your leave ends (52 weeks after it starts unless you say otherwise). If they haven't, ask."
        : `By the end of the 15th week before the week your baby is due: ${actDate(qwEnd)}. Say you're pregnant, give the week it's due, and the date you want leave to start (you can change it later with 28 days' notice). Put it in writing; the letter is below. You can tell them sooner, and from then you're protected for time off for antenatal appointments and from being treated unfairly for being pregnant.`,
      done: told,
    });
  }
  if (employed && role === "partner") {
    const tempRule = !ni && inp.dueOn >= "2026-04-05" && inp.dueOn <= "2026-07-25";
    items.push({
      id: "tell",
      title: "Tell your employer you'll take paternity leave",
      on: told ? "" : qwEnd,
      onKind: told ? "" : "by",
      cost: "duty",
      stake: told ? "Done" : pay.kind === "spp" ? "Late notice can delay the leave and the pay" : "Late notice can delay the leave",
      detail: told
        ? "Done. You still give 28 days' notice before each block of leave you take."
        : `By the end of the 15th week before the due week (${actDate(qwEnd)}), say when the baby's due and whether you'll take one week or two${tempRule ? ". For a baby due between 5 April and 25 July 2026 with less than 26 weeks' service, a temporary 28-day notice rule applied instead" : ""}. Then give 28 days' notice before each block. ${ni ? "In Northern Ireland paternity leave still needs 26 weeks with the employer by the qualifying week." : "In Great Britain the leave is a day-one right since 6 April 2026."} The letter is below.`,
      done: told,
    });
  }

  // ---- Before the birth: the pay ----
  if (role === "birth" && pay.kind === "smp" && !born) {
    if (today <= qwEnd) items.push({
      id: "refperiod",
      title: "Keep your pay normal in the eight weeks before the qualifying week",
      on: qwEnd,
      onKind: "by",
      cost: "money",
      stake: pay.high ? `Your first six weeks are 90% of your pay in these weeks: ${money(pay.high * 6)} at your pay now` : "Your first six weeks are 90% of your pay in these weeks",
      detail: `The first six weeks of Statutory Maternity Pay are 90% of your average pay over the eight weeks (roughly) up to ${letterDate(qwEnd)}, with no cap. Unpaid leave, cut hours or a salary sacrifice that starts in those weeks lowers it for all six; a pay rise or overtime paid in them raises it. A pay rise backdated into the period later counts too, so tell payroll if you get one.`,
    });
    items.push({
      id: "matb1",
      title: "Give your employer the MATB1 certificate",
      on: addDaysISO(ewc, -20 * 7),
      onKind: "from",
      cost: "money",
      stake: "Without it, they can refuse to pay Statutory Maternity Pay",
      detail: `Your midwife or GP can sign it from ${letterDate(addDaysISO(ewc, -20 * 7))} (20 weeks before the due week). Give your employer the original or a copy no later than 21 days after your pay starts; most people hand it over with the notice letter.`,
    });
  }
  if (role === "birth" && (pay.kind === "ma" || (pay.kind === "none" && inp.work === "self"))) {
    const opens = addDaysISO(inp.dueOn, -14 * 7);
    const maStart = earliestLeave;
    items.push({
      id: "ma",
      title: "Claim Maternity Allowance (form MA1)",
      on: born ? addMonthsISO(addDaysISO(inp.bornOn, 1), 3) : opens,
      onKind: born ? "by" : "from",
      cost: "money",
      stake: pay.total ? `About ${money(pay.total)} over 39 weeks; a late claim is only backdated three months` : "Up to 39 weeks of pay; a late claim is only backdated three months",
      detail: `From the DWP. You can claim from 26 weeks pregnant (${letterDate(opens)}); payments can start from the 11th week before the due week (${letterDate(maStart)}). You'll need the MATB1 from your midwife and proof of earnings (payslips, or for the self-employed, the 13 weeks you choose).${employed ? " If your employer says you don't qualify for SMP, they should give you form SMP1 saying why; send it with the claim." : ""} Self-employed with low profits? HMRC may let you pay voluntary Class 2 contributions to get the full rate rather than the lower one: ask when you claim.`,
    });
  }

  // ---- Leave starts ----
  if (role === "birth" && employed && !born) {
    items.push({
      id: "leave",
      title: "Your maternity leave can start",
      on: earliestLeave,
      onKind: "from",
      cost: "none",
      stake: "Up to 52 weeks, whatever your pay",
      detail: `The earliest is ${letterDate(earliestLeave)}, 11 weeks before the due week; most people choose a week or two before the due date. If you're off with a pregnancy-related illness in the last four weeks, leave starts automatically. The leave is 52 weeks for every employee from day one; it's only the pay that has conditions. Holiday keeps building up during it, and you can take up to 10 paid keeping-in-touch days if you and your employer both want to.`,
    });
  }

  // ---- Grants ----
  if (inp.benefits === "yes") {
    if (scot) {
      const first = inp.otherKids !== "yes";
      items.push({
        id: "pbp",
        title: "Apply for the Pregnancy and Baby Payment",
        on: born || today >= addDaysISO(inp.dueOn, -16 * 7) ? addMonthsISO(birth, 6) : addDaysISO(inp.dueOn, -16 * 7),
        onKind: born || today >= addDaysISO(inp.dueOn, -16 * 7) ? "by" : "from",
        cost: "money",
        stake: `${money(first ? RATE.pbpFirst : RATE.pbpLater, true)}, gone six months after the birth`,
        detail: `From Social Security Scotland (Best Start Grant), for anyone on Universal Credit, tax credits, Housing Benefit or another qualifying benefit, and for any parent under 18. ${first ? `${money(RATE.pbpFirst, true)} for a first child` : `${money(RATE.pbpLater, true)} when there are other children`}. Apply from 24 weeks pregnant (${letterDate(addDaysISO(inp.dueOn, -16 * 7))}) until the baby is six months old${born ? `: ${letterDate(addMonthsISO(birth, 6))}` : ""}. Ask about Best Start Foods and the Scottish Child Payment in the same application.`,
      });
    } else if (inp.otherKids !== "yes") {
      const opens = addDaysISO(inp.dueOn, -11 * 7);
      items.push({
        id: "ssmg",
        title: "Claim the Sure Start Maternity Grant",
        on: born || today >= opens ? addMonthsISO(birth, 6) : opens,
        onKind: born || today >= opens ? "by" : "from",
        cost: "money",
        stake: `${money(RATE.ssmg)}, gone six months after the birth`,
        detail: `A one-off ${money(RATE.ssmg)} for a first child (or a multiple birth when there are other children) if you or your partner get Universal Credit, Pension Credit, income-based JSA or ESA, Income Support, or Child or Working Tax Credit. It isn't paid back. Claim from 11 weeks before the due date (${letterDate(opens)}) until six months after the birth${born ? `: ${letterDate(addMonthsISO(birth, 6))}` : ""}. The six months is a hard stop.`,
      });
    }
    items.push({
      id: scot ? "bsf" : "healthystart",
      title: scot ? "Best Start Foods" : "Apply for Healthy Start",
      on: scot ? "" : born ? "" : addDaysISO(inp.dueOn, -30 * 7),
      onKind: scot || born ? "" : "from",
      cost: "money",
      stake: "Money each week for milk, fruit and vegetables; it starts when you apply",
      detail: scot
        ? "A payment card for healthy food in pregnancy and until the child is three, if you're on a qualifying benefit. Apply with the Pregnancy and Baby Payment."
        : "A prepaid card for milk, fruit, vegetables and infant formula, plus free vitamins, from 10 weeks pregnant until the child is four, if you're on Universal Credit (with low earnings) or another qualifying benefit. Apply online at healthystart.nhs.uk; the sooner you apply, the more weeks you get.",
    });
  }

  // ---- After the birth ----
  const regDays = scot ? 21 : 42;
  items.push({
    id: "register",
    title: "Register the birth",
    on: addDaysISO(birth, regDays),
    onKind: born ? "by" : "around",
    cost: "duty",
    stake: "Needed for the birth certificate, and for Child Benefit",
    detail: `Within ${regDays} days of the birth${scot ? " in Scotland" : ""}, at the register office for the area where the baby was born (you usually need to book). If you're not married or in a civil partnership, both parents go together for both names to be on the certificate, or one takes a statutory declaration from the other.`,
  });

  const cbFirst = inp.otherKids !== "yes";
  const cbWeekly = cbFirst ? RATE.cbFirst : RATE.cbOther;
  items.push({
    id: "childbenefit",
    title: "Claim Child Benefit",
    on: addMonthsISO(birth, 3),
    onKind: born ? "by" : "around",
    cost: "money",
    stake:
      inp.income === "over"
        ? "No money at your income, but the National Insurance credits are worth claiming for"
        : `${money(cbWeekly, true)} a week (${money(cbWeekly * 52)} a year); only three months is backdated`,
    detail: `From HMRC, online or in the app, once the birth is registered (in some cases you can claim before). It's backdated up to three months, so claim within three months of the birth${born ? ` (by ${letterDate(addMonthsISO(birth, 3))})` : ""} to get every week. ${
      inp.income === "over"
        ? "Above £80,000 the higher earner would repay all of it in tax, so tick the box to not be paid. Still claim: it gives a parent who isn't working, or earns little, National Insurance credits towards their State Pension, and it gets the child a National Insurance number at 16 without a form."
        : inp.income === "between"
          ? "Between £60,000 and £80,000, the higher earner repays 1% for every £200 over £60,000 through tax. You still come out ahead by claiming, and the parent at home gets National Insurance credits towards their State Pension."
          : "Claim it in the name of the parent who'll earn less, or not work, while the child is small: it gives that parent National Insurance credits towards their State Pension."
    }`,
  });

  if (inp.benefits === "yes") {
    items.push({
      id: "uc",
      title: "Tell Universal Credit (or tax credits) about the baby",
      on: "",
      onKind: "",
      cost: "money",
      stake: "The extra for a child starts from when it's reported",
      detail: "Report the birth in your journal as soon as the baby's born, within the same assessment period. Reported late, the child's extra usually only starts from the assessment period you report it in. If you start maternity pay, report that too: Statutory Maternity Pay counts as earnings, Maternity Allowance doesn't. Childcare costs later can be claimed back at up to 85%.",
    });
  }

  if (role === "partner" && (employed || inp.work === "")) {
    const by = addDaysISO(addDaysISO(birth, 7 * 52), -1);
    items.push({
      id: "paternity",
      title: "Take your paternity leave",
      on: by,
      onKind: "by",
      cost: pay.kind === "spp" ? "money" : "duty",
      stake: pay.kind === "spp" && pay.total ? `${money(pay.total)} of Statutory Paternity Pay, if taken in time` : "One or two weeks, within the first year",
      detail: `One week or two, in one block or two separate weeks, any time in the 52 weeks after the birth (by ${letterDate(by)}), with 28 days' notice before each. ${pay.kind === "spp" ? `Statutory Paternity Pay is ${money(pay.high ?? RATE.flat, true)} a week for it. ` : ""}You can also take unpaid time off for two antenatal appointments, and from 6 April 2026 paternity leave can come after shared parental leave as well as before.`,
    });
  }

  if (role === "birth" && employed) {
    items.push({
      id: "shared",
      title: "Decide whether to share the leave",
      on: "",
      onKind: "",
      cost: "none",
      stake: "Only matters if your partner wants some of the year",
      detail: "Shared Parental Leave lets you end your maternity leave early and turn what's left (up to 50 weeks of leave and 37 of pay) into leave either of you can take, in up to three blocks each. Each block needs eight weeks' notice, so if you want it, start the conversation about two months before the date. Nothing to do if you don't.",
    });
  }

  items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? -1 : 1;
    if (a.on && b.on) return a.on < b.on ? -1 : a.on > b.on ? 1 : 0;
    if (a.on) return -1;
    if (b.on) return 1;
    const order: BbCost[] = ["money", "duty", "none"];
    return order.indexOf(a.cost) - order.indexOf(b.cost);
  });

  return { region, role, ewc, qw, qwEnd, startBy, born, birth, weeksPregnant, pay, leaveFrom, items };
}

/** Items still ahead whose date costs money. */
export function moneyAhead(read: BbRead, today: string): BbItem[] {
  return read.items.filter((i) => i.cost === "money" && !i.done && (!i.on || i.on >= today || i.onKind === "from"));
}

/** The dates the weekly pay changes, from the first day of leave. */
export function payDates(read: BbRead): { drop: string; stop: string } {
  return { drop: addDaysISO(read.leaveFrom, 6 * 7), stop: addDaysISO(read.leaveFrom, 39 * 7) };
}

export function bbHeadline(inp: BbInputs, read: BbRead, today: string): string {
  const p = read.pay;
  const tell = read.items.find((i) => i.id === "tell");
  if (tell && !tell.done && tell.on && tell.on >= today) {
    if (p.kind === "smp" && p.total) return `Tell your employer by ${actDate(read.qwEnd)}, the end of the week that decides about ${money(p.total)} of maternity pay.`;
    if (p.kind === "spp" && p.total) return `Tell your employer by ${actDate(read.qwEnd)}, then take your two weeks in the first year: ${money(p.total)} of paternity pay.`;
    return `Tell your employer by ${actDate(read.qwEnd)}: the end of the 15th week before the due week.`;
  }
  if (read.role === "birth" && p.kind === "ma") {
    const ma = read.items.find((i) => i.id === "ma");
    if (ma && ma.onKind === "from" && ma.on > today)
      return `Claim Maternity Allowance from ${actDate(ma.on)}${p.total ? `: about ${money(p.total)} over 39 weeks` : ""}.`;
    if (ma) return `Claim Maternity Allowance now${p.total ? `: about ${money(p.total)} over 39 weeks` : ""}. A late claim is only backdated three months.`;
  }
  if (read.role === "birth" && p.kind === "smp" && p.total && !read.born)
    return `Your maternity pay is settled at about ${money(p.total)}. Give your employer the MATB1, then after the birth claim Child Benefit within three months.`;
  const openNow = moneyAhead(read, today).find((i) => i.onKind === "from" && i.on && i.on <= today);
  if (openNow) return `Open now, and worth doing this week: ${openNow.title.charAt(0).toLowerCase()}${openNow.title.slice(1)}.`;
  const dated = moneyAhead(read, today).filter((i) => i.on && i.onKind === "by");
  if (dated.length) {
    const first = dated[0];
    return `Next date that costs money: ${first.title.charAt(0).toLowerCase()}${first.title.slice(1)}, by ${actDate(first.on)}.`;
  }
  if (!read.born) return "Nothing here costs money before the birth. After it: register, then claim Child Benefit within three months.";
  return "Nothing here costs money if it waits. Enjoy the baby.";
}

export function bbBody(inp: BbInputs, read: BbRead, today: string): string {
  const parts: string[] = [];
  const p = read.pay;
  const wk = read.weeksPregnant;
  if (!read.born && wk !== null && wk >= 0 && wk <= 42) {
    parts.push(
      today <= read.qwEnd
        ? `You're about ${wk} weeks pregnant. The date that matters most for the money isn't the due date: it's the end of the qualifying week, ${letterDate(read.qwEnd)}, about 25 weeks in.`
        : `You're about ${wk} weeks pregnant, past the qualifying week (it ended ${letterDate(read.qwEnd)}), so whether statutory pay applies is now settled.`,
    );
  }
  if (p.kind === "smp" && p.total && p.high && p.low)
    parts.push(
      `On ${money(p.awe ?? 0)} a week, Statutory Maternity Pay is ${money(p.high, true)} a week for six weeks, then ${money(p.low, true)} for 33: ${money(p.total)} in all, before tax. Check your contract or staff handbook for enhanced maternity pay on top: many employers pay more.`,
    );
  else if (p.kind === "smp")
    parts.push("You look set for Statutory Maternity Pay. Add your pay to see how much, and when it drops.");
  else if (p.kind === "spp" && p.total)
    parts.push(`Statutory Paternity Pay is ${money(p.high ?? 0, true)} a week for up to two weeks: ${money(p.total)}. Some employers pay full pay for it; check the handbook.`);
  else if (p.kind === "spp")
    parts.push("You look set for Statutory Paternity Pay. Add your pay to see how much.");
  else if (p.kind === "ma" && p.total)
    parts.push(`${p.why} It's ${money(p.high ?? 0, true)} a week for 39 weeks: about ${money(p.total)}.`);
  else if (p.why) parts.push(p.why);
  else if (p.kind === "unknown" && inp.work === "employed") parts.push("Add the date you started with this employer to see whether statutory pay applies.");
  if (read.role === "birth" && p.kind === "none" && inp.work === "self")
    parts.push("Check the earnings test with the DWP anyway: it's any 13 weeks you choose in the 66, so a quiet patch doesn't rule you out.");
  const ahead = moneyAhead(read, today).length;
  if (ahead) parts.push(`Below, ${ahead === 1 ? "one thing is" : `${ahead} things are`} marked as costing money if ${ahead === 1 ? "it waits" : "they wait"}.`);
  return parts.join(" ");
}

/** What can wait: said plainly. */
export function canWait(inp: BbInputs, read: BbRead): string[] {
  const out = [
    "Childcare. Funded hours and Tax-Free Childcare (the government adds £2 for every £8, up to £2,000 a year) start months from now. Set a reminder for when the baby is about five months old; the codes have to be applied for the term before.",
    "A will and life cover. Worth doing in the first year, especially if you're not married, but nothing changes if it's next month rather than this one.",
    "A passport for the baby, a Junior ISA, a savings account. Whenever suits.",
  ];
  if (read.role === "birth" && inp.work === "employed")
    out.push("Asking to come back part-time or flexibly. You can ask from day one, and the employer has two months to answer, so ask about three months before you plan to return.");
  return out;
}

export type BbLetter = { id: string; title: string; note: string; text: string };

function sig(): string {
  return "Yours sincerely,\n\n[Your name]\n[Job title, team]";
}

export function bbLetters(inp: BbInputs, read: BbRead): BbLetter[] {
  const out: BbLetter[] = [];
  if (inp.work !== "employed") return out;
  const due = letterDate(inp.dueOn);
  const ewc = letterDate(read.ewc);
  if (read.role === "birth") {
    const start = isISODate(inp.leaveOn) ? letterDate(inp.leaveOn) : "[the date you want leave to start]";
    out.push({
      id: "maternity",
      title: "To your employer: notice of pregnancy and maternity leave",
      note: `Send by ${letterDate(read.qwEnd)}. Email to your manager and HR is fine; keep a copy. Attach the MATB1 if you have it.`,
      text: `Dear [manager's name],

I'm writing to let you know that I'm pregnant. My baby is due on ${due}, in the week beginning ${ewc}.

I'd like to start my maternity leave on ${start}, and to receive Statutory Maternity Pay [and any enhanced maternity pay under the company's policy] from then. [My MATB1 certificate is attached. / I'll send my MATB1 certificate as soon as my midwife gives it to me.]

Please confirm in writing, within 28 days, the date my maternity leave will end. I understand I'm entitled to 52 weeks' leave, and that I'll give you at least eight weeks' notice if I want to come back earlier.

I'd also be grateful to know about any enhanced pay, keeping-in-touch days and how holiday will be handled while I'm away, and to arrange the risk assessment for my work while I'm pregnant.

${sig()}`,
    });
  } else {
    out.push({
      id: "paternity",
      title: "To your employer: notice of paternity leave",
      note: `Send by ${letterDate(read.qwEnd)}. It covers what form SC3 asks for; your employer may want their own form too.`,
      text: `Dear [manager's name],

I'm writing to give notice that I intend to take paternity leave.

My [partner's / baby's mother's] baby is due on ${due}, in the week beginning ${ewc}. I'll be responsible for the child's upbringing as [the father / the partner of the mother].

I'd like to take [one week / two weeks / two separate weeks] of paternity leave, starting [on the day of the birth / a set number of days after the birth / on a set date], and to receive Statutory Paternity Pay [and any enhanced pay under the company's policy] for it. I'll confirm each block at least 28 days before it starts.

I'd also like to take unpaid time off to go to two antenatal appointments, and will let you know the dates.

${sig()}`,
    });
  }
  return out;
}

export type BbReminder = { on: string; title: string; body: string };

export function bbReminders(read: BbRead, today: string): BbReminder[] {
  return read.items
    .filter((i) => i.on && !i.done && i.on >= today && i.cost !== "none")
    .map((i) => ({ on: i.on, title: i.title, body: `${i.stake}. ${i.detail}` }));
}

export function bbRule(): string {
  return "When a baby's coming, I count back from the due date, not forward to it. The money is settled at about 25 weeks, and after the birth the deadlines are quiet ones, so they go in the calendar the day I find them.";
}

export function bbSummary(inp: BbInputs, read: BbRead, today: string): string {
  const lines = [bbHeadline(inp, read, today), "", bbBody(inp, read, today), ""];
  for (const i of read.items) {
    const when = i.done ? "done" : i.on ? `${i.onKind === "around" ? "about " : i.onKind === "from" ? "from " : "by "}${letterDate(i.on)}` : "no fixed date";
    lines.push(`- ${i.title} (${when}). ${i.stake}.`);
  }
  lines.push("", "Can wait:");
  for (const w of canWait(inp, read)) lines.push(`- ${w}`);
  lines.push("", bbRule(), "", "From https://bettereveryday.vercel.app/baby. Not legal advice.");
  return lines.join("\n");
}

/** The worked example: 18 weeks pregnant, employed, on £2,600 a month. */
export function bbExample(today: string): BbInputs {
  return {
    ...BLANK_BB,
    region: "ew",
    role: "birth",
    dueOn: addDaysISO(today, 22 * 7),
    work: "employed",
    startedOn: addDaysISO(today, -3 * 365),
    pay: "2600",
    per: "month",
    told: "no",
    benefits: "no",
    otherKids: "no",
    income: "under",
  };
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function iso(v: unknown): string {
  return typeof v === "string" && isISODate(v) ? v : "";
}

export function parseBbInputs(raw: unknown): BbInputs {
  if (!raw || typeof raw !== "object") return BLANK_BB;
  const r = raw as Record<string, unknown>;
  const yn = ["", "yes", "no"] as const;
  return {
    region: pick(r.region, ["", "ew", "scot", "ni"] as const, ""),
    role: pick(r.role, ["", "birth", "partner"] as const, ""),
    dueOn: iso(r.dueOn),
    bornOn: iso(r.bornOn),
    work: pick(r.work, ["", "employed", "self", "none"] as const, ""),
    startedOn: iso(r.startedOn),
    pay: typeof r.pay === "string" ? r.pay.slice(0, 12) : "",
    per: pick(r.per, ["week", "month", "year"] as const, "month"),
    told: pick(r.told, yn, ""),
    leaveOn: iso(r.leaveOn),
    benefits: pick(r.benefits, yn, ""),
    otherKids: pick(r.otherKids, yn, ""),
    income: pick(r.income, ["", "under", "between", "over"] as const, ""),
  };
}
