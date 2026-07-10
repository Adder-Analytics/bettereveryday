/**
 * The pre-mortem room (/premortem): content and shapes for the guided
 * solo pre-mortem.
 *
 * The technique is Gary Klein's (HBR, September 2007): before a plan starts,
 * declare that it has already failed and write the history of that failure.
 * The underlying finding is Mitchell, Russo & Pennington (1989) —
 * "prospective hindsight": imagining an event as having already happened
 * raises people's ability to correctly identify reasons for future outcomes
 * by about 30%. A certainty is explained; a possibility is debated.
 *
 * This file holds the content (the lenses that unstick a stalled brainstorm,
 * and the worked example) plus the stored shapes; the behavior lives in
 * PremortemClient. Like every tool on the site, what you write stays in the
 * browser and this module never writes anything itself.
 */

export type TriageKind = "change" | "tripwire" | "accept";

export type PremortemReason = {
  id: string;
  /** The cause of failure, written in past tense — it already happened. */
  text: string;
  /** What you decided to do about it; null means not yet triaged. */
  triage: TriageKind | null;
  /** change: what the plan now does differently · accept: why you can live with it. */
  detail: string;
  /** tripwire only: the observable signal that means "stop and reconsider". */
  signal: string;
  /** tripwire only: ISO date you'll check for the signal. */
  checkOn: string;
  /**
   * tripwire only: the check, answered. A tripwire check has to produce an
   * answer, not an acknowledgement — aviation checklists demand the actual
   * status spoken back ("flaps 20"), never a bare "checked", because a check
   * that doesn't record its answer quietly becomes a reminder you swiped away.
   * checkedOn is the ISO date the answer was recorded ("" = still armed);
   * fired is that answer (true = the signal appeared; null = unanswered).
   */
  checkedOn: string;
  fired: boolean | null;
};

export type Premortem = {
  id: string;
  /** The plan, in one line. */
  plan: string;
  /** ISO date of the imagined failure — the day you'd know it didn't work. */
  judgeOn: string;
  reasons: PremortemReason[];
  createdOn: string; // ISO yyyy-mm-dd
  /**
   * ISO date this plan was logged to the decision journal as a tracked
   * forecast ("" = not logged). The pre-mortem strengthens the plan and pulls
   * an inflated confidence back toward honesty; this records that the honest
   * number was captured, so the handoff can't be run twice by accident. Absent
   * in records saved before the handoff existed — they load as un-logged.
   */
  loggedOn: string;
};

export const PREMORTEM_SAVED_KEY = "premortem:v1";

/**
 * Defensive normalization, shared by the pre-mortem room and every read-side
 * consumer (the site-wide due badge, the journal's cross-link). Saved
 * pre-mortems are the user's thinking; like the decision log, they have to
 * survive shape drift and hand-edited JSON. Anything missing gets a safe
 * default; anything malformed degrades instead of throwing. Records saved
 * before the check fields existed load as still-armed tripwires.
 */
export function mergeReason(
  raw: Partial<PremortemReason> | null | undefined
): PremortemReason {
  const r = raw ?? {};
  const triage: TriageKind | null =
    r.triage === "change" || r.triage === "tripwire" || r.triage === "accept"
      ? r.triage
      : null;
  return {
    id:
      typeof r.id === "string" && r.id
        ? r.id
        : `r-${Math.random().toString(36).slice(2, 10)}`,
    text: typeof r.text === "string" ? r.text : "",
    triage,
    detail: typeof r.detail === "string" ? r.detail : "",
    signal: typeof r.signal === "string" ? r.signal : "",
    checkOn: typeof r.checkOn === "string" ? r.checkOn : "",
    checkedOn: typeof r.checkedOn === "string" ? r.checkedOn : "",
    fired: typeof r.fired === "boolean" ? r.fired : null,
  };
}

export function mergePremortem(
  raw: Partial<Premortem> | null | undefined
): Premortem {
  const r = raw ?? {};
  return {
    id:
      typeof r.id === "string" && r.id
        ? r.id
        : `pm-${Math.random().toString(36).slice(2, 10)}`,
    plan: typeof r.plan === "string" && r.plan ? r.plan : "A plan",
    judgeOn: typeof r.judgeOn === "string" ? r.judgeOn : "",
    reasons: Array.isArray(r.reasons)
      ? r.reasons.map(mergeReason).filter((x) => x.text.trim())
      : [],
    createdOn:
      typeof r.createdOn === "string" && r.createdOn ? r.createdOn : todayISO(),
    loggedOn: typeof r.loggedOn === "string" ? r.loggedOn : "",
  };
}

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** An armed tripwire whose check date has arrived and whose answer hasn't
 *  been recorded — the pre-mortem's equivalent of a review coming due. */
export function isDueTripwireCheck(r: PremortemReason, today = todayISO()): boolean {
  return (
    r.triage === "tripwire" &&
    !!r.signal.trim() &&
    !!r.checkOn &&
    r.checkOn <= today &&
    !r.checkedOn
  );
}

export function dueTripwireChecks(pm: Premortem, today = todayISO()): PremortemReason[] {
  return pm.reasons.filter((r) => isDueTripwireCheck(r, today));
}

/**
 * Read the saved pre-mortems from the browser. Read-only, like
 * app/data/journal.ts — the pre-mortem room owns its storage; this exists so
 * the due badge and the journal can count checks without duplicating the
 * merge discipline. Returns [] on the server and on any malformed storage.
 */
export function loadSavedPremortems(): Premortem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PREMORTEM_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((p) => p && typeof p === "object").map(mergePremortem)
      : [];
  } catch {
    return [];
  }
}

/** Armed tripwire checks whose date has arrived, across every saved
 *  pre-mortem — the one pre-mortem number worth chasing you around the site. */
export function countDueTripwireChecks(): number {
  const today = todayISO();
  return loadSavedPremortems().reduce(
    (n, pm) => n + dueTripwireChecks(pm, today).length,
    0
  );
}

/**
 * Lenses for when the list stalls. Klein's teams get their breadth from the
 * room — ten people around a table each carrying different worries. Solo, you
 * have to walk the perimeter yourself, so these are the directions failures
 * usually come from. Each prompt is written to make you remember specifics,
 * not nod along.
 */
export const LENSES = [
  {
    id: "people",
    name: "People",
    prompt:
      "Someone had to say yes, stay, care, or deliver for this to work — and didn't. The key person left. The stakeholder never really bought in, and you knew it. The customers were being polite, not interested. Who was this plan quietly depending on?",
  },
  {
    id: "money",
    name: "Money & fuel",
    prompt:
      "It ran out of something: budget, runway, inventory, goodwill, your own attention. What got consumed faster than the plan assumed — and what income, funding, or help never actually materialized?",
  },
  {
    id: "time",
    name: "Time",
    prompt:
      "Everything took longer. Which single step turned out to be three steps? What did the plan schedule for the best case? Deadlines slipped quietly because nothing enforced them — which one slipped first?",
  },
  {
    id: "world",
    name: "The outside world",
    prompt:
      "Something outside the plan moved: a competitor shipped, a platform changed its rules, a price doubled, the team got reorged, a regulation landed. What did the plan assume would hold still that never promised to?",
  },
  {
    id: "you",
    name: "You",
    prompt:
      "The plan assumed a version of you that didn't show up — the one with free evenings, steady motivation, and no competing crisis. Where has that assumption failed before? What did this plan need from you that the last plan didn't get?",
  },
] as const;

/**
 * A worked example — one finished pre-mortem, shown read-only so a first-timer
 * can see what honest reasons and a full triage look like before writing their
 * own. Deliberately a modest, familiar plan (not a startup pitch): the point
 * is that the technique earns its keep on ordinary commitments. All three
 * triage moves appear, because the lesson is that a pre-mortem's output is
 * decisions, not dread. Never written into the user's saved list.
 */
export const SAMPLE_PREMORTEM: Premortem = {
  id: "sample",
  plan: "Launch a paid tier for my side project by the end of October.",
  judgeOn: "2026-10-31",
  createdOn: "2026-04-06",
  loggedOn: "",
  reasons: [
    {
      id: "s1",
      text:
        "Six months in, the paid tier exists and four people pay for it. I built the features first and asked who would pay at the end — and the honest answer, which I could have had in April, was 'nobody I actually talked to.'",
      triage: "change",
      detail:
        "Reverse the order: before writing any code, get ten current users on calls and ask what they'd pay for this month. Build the tier around the most common answer — or, if there isn't one, don't build it.",
      signal: "",
      checkOn: "",
      checkedOn: "",
      fired: null,
    },
    {
      id: "s2",
      text:
        "The launch slipped past October because billing was three times the job I budgeted — tax handling, refunds, failed cards, invoices for EU customers.",
      triage: "tripwire",
      detail: "",
      signal:
        "Billing isn't demoably working end-to-end (checkout → paid → refund) by September 1",
      checkOn: "2026-09-01",
      checkedOn: "",
      fired: null,
    },
    {
      id: "s3",
      text:
        "The free users I counted on converting felt ambushed instead: features they'd used for a year moved behind the paywall, and the loudest of them left in public.",
      triage: "change",
      detail:
        "Grandfather everything existing users already use. The paid tier is new value only — nobody wakes up to find yesterday's tool behind a gate.",
      signal: "",
      checkOn: "",
      checkedOn: "",
      fired: null,
    },
    {
      id: "s4",
      text:
        "My own momentum died in August. Two weeks of holiday became six weeks of not opening the repo, and the launch quietly became 'someday.'",
      triage: "tripwire",
      detail: "",
      signal: "A full week with zero commits while the launch is supposedly on",
      checkOn: "2026-06-15",
      checkedOn: "2026-06-15",
      fired: false,
    },
    {
      id: "s5",
      text:
        "A bigger competitor shipped a free version of my core feature a month before launch, and the pitch collapsed from 'unique' to 'nicer.'",
      triage: "accept",
      detail:
        "I can't control it and won't try to outrun it. The niche is small enough that support and taste are the moat, not the feature list — and if it happens, the plan changes anyway, on that day and not before.",
      signal: "",
      checkOn: "",
      checkedOn: "",
      fired: null,
    },
    {
      id: "s6",
      text:
        "The price was wrong the whole time and I never found out, because I set it once, told no one, and was too embarrassed to ask.",
      triage: "change",
      detail:
        "Show the price page to five trusted users before launch and ask each one: too high, too low, or shrug? Three shrugs means ship it.",
      signal: "",
      checkOn: "",
      checkedOn: "",
      fired: null,
    },
  ],
};
