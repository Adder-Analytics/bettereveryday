"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";
import {
  LENSES,
  PREMORTEM_SAVED_KEY,
  SAMPLE_PREMORTEM,
  dueTripwireChecks,
  isDueTripwireCheck,
  mergePremortem,
  mergeReason,
  type Premortem,
  type PremortemReason,
  type TriageKind,
} from "../data/premortem";
import { appendDecisionEntry, CONFIDENCE_OPTIONS } from "../data/decisionLog";
import { readCarriedSubject, clearCarriedSubject } from "../data/carry";
import { encodeShare, readShare, clearShare, SHARE_PARAM } from "../data/share";
import CarriedNote from "../components/CarriedNote";

/**
 * The pre-mortem room. Four screens, in the order Klein's exercise runs:
 * name the plan → declare it dead and write the history of the failure →
 * triage every cause (change the plan / set a tripwire / accept the risk) →
 * keep the artifact. A draft persists across visits so a pre-mortem can be
 * finished later; finished ones are saved locally, exactly like the decision
 * journal, and nothing ever leaves the browser.
 */

const SAVED_KEY = PREMORTEM_SAVED_KEY;
const DRAFT_KEY = "premortem:draft:v1";

const JUDGE_DEFAULT_DAYS = 365; // Klein's framing: "imagine we're a year out"
const TRIPWIRE_DEFAULT_DAYS = 30;
const REASON_TARGET = 5; // the nudge threshold, not a gate

type Step = "plan" | "imagine" | "triage";

type Draft = {
  step: Step;
  plan: string;
  judgeOn: string;
  reasons: PremortemReason[];
};

// ---- date helpers (local-time ISO, no library) --------------------------
function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatHuman(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyDraft(): Draft {
  return {
    step: "plan",
    plan: "",
    judgeOn: addDaysISO(todayISO(), JUDGE_DEFAULT_DAYS),
    reasons: [],
  };
}

// ---- handing the plan to another person (see data/share.ts) --------------
// A pre-mortem was built for a room. Klein's exercise gets its breadth from ten
// people around a table, each imagining the failure from where they sit; solo,
// this tool substitutes the lenses for that room. Peer-sharing restores the
// real thing across distance: a link that hands the plan to someone else so they
// run their *own* pre-mortem on it, in their own browser, and hand the failures
// back. The payload rides in the URL *fragment*, never the query string, so it
// reaches no server — only whoever you send the link to.
//
// THE DELIBERATE OMISSION — the reasons do NOT ride along. A pre-mortem's power
// is that each person imagines the failure *independently*, before anyone pools;
// hand someone your finished list and you've anchored them onto it — they nod at
// your six causes instead of surfacing the seventh only they can see. So the
// share carries the *setup* — the plan and the date to imagine standing on — and
// nothing else. What comes back is a genuinely independent pre-mortem, which is
// the only kind worth asking a second person for. (Same discipline the
// comparison uses when it refuses to share the gut.)

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Collapse whitespace and cap the shared plan, so a link stays a link. Mirrors
 *  the normalization the flip point's and comparison's shares apply. */
function capStr(s: string, n = 160): string {
  return s.replace(/\s+/g, " ").trim().slice(0, n);
}

/** The encodable subset of a saved pre-mortem: the plan and the judge date —
 *  the setup a recipient needs to imagine the same failure, and never the
 *  reasons (see the note above). */
function premortemSharePayload(pm: Premortem): Record<string, unknown> {
  return { plan: capStr(pm.plan), judgeOn: pm.judgeOn };
}

/** Rebuild a shareable setup from a decoded payload, defensively: a truncated or
 *  hand-edited link degrades to null (nothing adopted), never a throw. The plan
 *  is the one thing that must survive; a missing, malformed, or already-past
 *  judge date falls back to the default window out, exactly as a fresh draft
 *  would. */
function coerceSharedPremortem(
  data: unknown
): { plan: string; judgeOn: string } | null {
  if (!data || typeof data !== "object") return null;
  const v = data as { plan?: unknown; judgeOn?: unknown };
  const plan = typeof v.plan === "string" ? capStr(v.plan) : "";
  if (!plan) return null;
  let judgeOn =
    typeof v.judgeOn === "string" && ISO_DATE.test(v.judgeOn) ? v.judgeOn : "";
  if (judgeOn) {
    const t = new Date(`${judgeOn}T00:00:00`);
    // A date that won't parse, or one already in the past, is no use to a
    // recipient standing in the future — push it to the default horizon.
    if (Number.isNaN(t.getTime()) || judgeOn <= todayISO()) judgeOn = "";
  }
  if (!judgeOn) judgeOn = addDaysISO(todayISO(), JUDGE_DEFAULT_DAYS);
  return { plan, judgeOn };
}

/** A short, honest read of a shared plan for the "someone handed you this" card
 *  when the tool already holds a draft: the plan and the date to imagine on. */
function describeSharedPremortem(s: { plan: string; judgeOn: string }): {
  plan: string;
  line: string;
} {
  return {
    plan: s.plan.trim() || "A plan",
    line: s.judgeOn ? `Imagine standing on ${formatHuman(s.judgeOn)}` : "",
  };
}

// ---- pooling a second person's pre-mortem back (see data/share.ts) -------
// The setup-share above opens the loop: it hands someone the plan and the date
// and withholds the reasons, so they imagine the failure independently. This
// closes it. Once they've run their own pre-mortem, they hand their failure list
// *back*, and the original author pools it into theirs — triaging each returned
// cause the way they triaged their own. That's Klein's whole method: imagine
// alone, then pool.
//
// THE MIRROR-IMAGE OMISSION — the triage does NOT ride back. The setup withheld
// the reasons so the second person's list would be genuinely their own; the
// return withholds the *response* so the author decides for themselves what to
// do about each failure on their plan. A returned "accept it" or "change the
// plan" would be a guess about a plan the author owns and the returner doesn't.
// So each direction carries exactly what the other person is for — a fresh list
// one way, the author's own call the other — and neither carries the part that
// would anchor a judgment that isn't theirs to make.

const POOL_TAG = "premortem-pool";
const MAX_POOLED = 40; // a return is a list, not an archive
const MAX_REASON_LEN = 400; // one failure, capped so the link stays a link

/** Normalize a failure's text for de-dup and plan-matching: case-folded,
 *  whitespace-collapsed, trailing sentence punctuation dropped. So "The key
 *  hire left" and "the key hire left." never both survive a pool. */
function reasonKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim();
}

/** The encodable subset of a finished pre-mortem when handing it *back*: the
 *  plan (to match the author's saved pre-mortem) and the bare failure texts,
 *  never their triage (see the note above). */
function poolReturnPayload(pm: Premortem): Record<string, unknown> {
  const reasons = pm.reasons
    .map((r) => capStr(r.text, MAX_REASON_LEN))
    .filter(Boolean)
    .slice(0, MAX_POOLED);
  return { plan: capStr(pm.plan), reasons };
}

/** Rebuild a returned pre-mortem defensively: the plan and a de-duped list of
 *  non-empty failure texts. A truncated or hand-edited link degrades to null
 *  (nothing pooled), never a throw — exactly as the setup coerce does. */
function coercePoolReturn(
  data: unknown
): { plan: string; reasons: string[] } | null {
  if (!data || typeof data !== "object") return null;
  const v = data as { plan?: unknown; reasons?: unknown };
  const plan = typeof v.plan === "string" ? capStr(v.plan) : "";
  if (!plan) return null;
  const seen = new Set<string>();
  const reasons: string[] = [];
  if (Array.isArray(v.reasons)) {
    for (const raw of v.reasons) {
      if (typeof raw !== "string") continue;
      const text = capStr(raw, MAX_REASON_LEN);
      const key = reasonKey(text);
      if (!text || seen.has(key)) continue;
      seen.add(key);
      reasons.push(text);
      if (reasons.length >= MAX_POOLED) break;
    }
  }
  if (reasons.length === 0) return null;
  return { plan, reasons };
}

// ---- defensive load ------------------------------------------------------
// The merge discipline for saved pre-mortems lives in data/premortem.ts now,
// shared with the read side (the due badge, the journal's cross-link) so the
// room and its readers can never disagree about a record's shape. The draft
// merge stays here — only this screen ever reads or writes a draft.

function mergeDraft(raw: Partial<Draft> | null | undefined): Draft {
  const base = emptyDraft();
  if (!raw) return base;
  const step: Step =
    raw.step === "plan" || raw.step === "imagine" || raw.step === "triage"
      ? raw.step
      : base.step;
  return {
    step,
    plan: typeof raw.plan === "string" ? raw.plan : base.plan,
    judgeOn: typeof raw.judgeOn === "string" && raw.judgeOn ? raw.judgeOn : base.judgeOn,
    reasons: Array.isArray(raw.reasons) ? raw.reasons.map(mergeReason) : base.reasons,
  };
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// ---- the artifact --------------------------------------------------------

const TRIAGE_LABELS: Record<TriageKind, string> = {
  change: "Plan changed",
  tripwire: "Tripwire set",
  accept: "Risk accepted",
};

function tripwires(pm: Premortem): PremortemReason[] {
  return pm.reasons.filter((r) => r.triage === "tripwire" && r.signal.trim());
}

/**
 * The review date for a plan logged to the journal: the day you said you'd
 * know whether it worked. If that day has already passed (an old pre-mortem),
 * fall back to a sensible window out rather than logging a review that's
 * instantly overdue.
 */
function reviewDateFor(pm: Premortem): string {
  const today = todayISO();
  return pm.judgeOn && pm.judgeOn > today ? pm.judgeOn : addDaysISO(today, 90);
}

/**
 * Fold a saved pre-mortem's triaged reasons into the journal's reasoning shape,
 * so the logged decision carries *why you were confident despite the risks* —
 * the imagined failure and the move you made about it (a plan change, a
 * tripwire, or an accepted risk). This is the contemporaneous record the review
 * will read back to you on the judge date.
 */
function buildPremortemReasoning(
  pm: Premortem
): { name: string; move: string; text: string }[] {
  return pm.reasons
    .filter((r) => r.triage)
    .map((r) => {
      const failure = r.text.trim();
      let text = `Imagined failure — ${failure}`;
      if (r.triage === "change") {
        text += r.detail.trim()
          ? ` Changed the plan: ${r.detail.trim()}`
          : " Changed the plan.";
      } else if (r.triage === "tripwire") {
        text += r.signal.trim()
          ? ` Tripwire: if ${r.signal.trim()}, stop and reconsider`
          : " Tripwire set";
        text += r.checkOn ? ` (check ${formatHuman(r.checkOn)}).` : ".";
      } else if (r.triage === "accept") {
        text += r.detail.trim()
          ? ` Accepted the risk: ${r.detail.trim()}`
          : " Accepted the risk with open eyes.";
      }
      return { name: TRIAGE_LABELS[r.triage as TriageKind], move: failure, text };
    });
}

function buildPremortemMemo(pm: Premortem): string {
  const lines: string[] = [];
  lines.push("PRE-MORTEM");
  lines.push(pm.plan.trim());
  lines.push(
    `Written ${formatHuman(pm.createdOn)}, imagining failure on ${formatHuman(pm.judgeOn)}`
  );
  lines.push("");
  lines.push("IT FAILED BECAUSE…");
  pm.reasons.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.text.trim()}`);
    if (r.triage === "change") {
      lines.push(`   → Plan changed: ${r.detail.trim() || "(not written down)"}`);
    } else if (r.triage === "tripwire") {
      lines.push(
        `   → Tripwire: if ${r.signal.trim() || "(no signal named)"} — stop and reconsider.` +
          (r.checkedOn
            ? r.fired
              ? ` FIRED ${formatHuman(r.checkedOn)}.`
              : ` Checked ${formatHuman(r.checkedOn)}: all clear.`
            : r.checkOn
              ? ` Check on ${formatHuman(r.checkOn)}.`
              : "")
      );
    } else if (r.triage === "accept") {
      lines.push(
        `   → Risk accepted${r.detail.trim() ? `: ${r.detail.trim()}` : "."}`
      );
    }
    lines.push("");
  });
  const tw = tripwires(pm);
  if (tw.length > 0) {
    lines.push(
      `${tw.length} tripwire${tw.length === 1 ? "" : "s"} armed. If a signal fires, the plan doesn't get the benefit of the doubt — that was decided today, while calm.`
    );
    lines.push("");
  }
  lines.push("— pre-mortem at Better Every Day · /premortem");
  return lines.join("\n");
}

// ---- tripwire reminders (.ics) -------------------------------------------
// A tripwire only works if the check actually happens — the 1996 Everest
// turnaround time failed the man who set it because nothing outside his own
// summit-fevered judgement enforced it. This puts each check date into the
// calendar you already look at. Spec plumbing shared with the decision
// journal (data/ics.ts).

function tripwireVEvent(pm: Premortem, r: PremortemReason): string[] {
  const day = r.checkOn.replace(/-/g, ""); // YYYYMMDD
  const dtStart = `${day}T090000`;
  const dtEnd = `${day}T093000`;
  const signal = r.signal.replace(/\s+/g, " ").trim();
  const title = signal.length > 70 ? `${signal.slice(0, 69)}…` : signal;

  const desc: string[] = [
    `Tripwire check for your plan: ${pm.plan.replace(/\s+/g, " ").trim()}`,
    `\nThe signal you named: ${signal}`,
    `\nThe failure it guards against: ${r.text.replace(/\s+/g, " ").trim()}`,
    "\nIf the signal has fired, the plan doesn't get the benefit of the doubt — you decided that in advance, while you were calm. Stop and reconsider, or recommit on purpose.",
    `\nYour pre-mortems: ${SITE_URL}/premortem`,
  ];

  return [
    "BEGIN:VEVENT",
    `UID:premortem-${pm.id}-${r.id}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${icsEscape(`Tripwire check: ${title}`)}`,
    `DESCRIPTION:${icsEscape(desc.join(""))}`,
    `URL:${SITE_URL}/premortem`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tripwire check",
    "TRIGGER:-PT0M",
    "END:VALARM",
    "END:VEVENT",
  ];
}

function buildTripwireICS(pm: Premortem): string {
  // Only still-armed checks get reminders — an answered check is history, and
  // stable UIDs mean a re-imported file updates rather than duplicates.
  const armed = tripwires(pm).filter((r) => r.checkOn && !r.checkedOn);
  return wrapCalendar(
    armed.map((r) => tripwireVEvent(pm, r)),
    "Pre-mortem Tripwires"
  );
}

const textareaClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-y leading-relaxed";

const inputClass =
  "px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors";

// =========================================================================

export default function PremortemClient() {
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [saved, setSaved] = useState<Premortem[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [screen, setScreen] = useState<"home" | "work" | "view">("home");
  const [viewId, setViewId] = useState<string | null>(null); // "sample" allowed
  // The return desk deep-links here with ?check=<pm id>:<reason id>; this is the
  // reason to scroll to and highlight once the pre-mortem view opens.
  const [focusReasonId, setFocusReasonId] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [activeLens, setActiveLens] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The current draft was seeded from a plan someone else shared — drives the
  // "imagine independently" banner over the failure step. Session-only, like the
  // comparison's adopted-share banner: the draft itself persists, this cue does
  // not survive a refresh.
  const [fromShare, setFromShare] = useState(false);
  // A shared plan held because a draft was already in progress — surfaced on the
  // home screen as a card the person can open (starting a fresh pre-mortem on
  // it) or dismiss, never silently clobbering their unfinished work.
  const [pendingShare, setPendingShare] = useState<{
    plan: string;
    judgeOn: string;
  } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A second person's pre-mortem, handed back (#s=… tagged premortem-pool) and
  // waiting to be pooled into the author's saved plan. Held as a card, never
  // auto-merged — pooling seeds a triage flow the author drives. matchId is the
  // saved pre-mortem whose plan it belongs to, or null when nothing matches.
  const [pendingReturn, setPendingReturn] = useState<{
    plan: string;
    reasons: string[];
    matchId: string | null;
  } | null>(null);
  const [returnCopied, setReturnCopied] = useState(false);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // While a draft is a pool-and-triage of a returned list: how many reasons came
  // from the other person (they sit at the end, still untriaged), and — in the
  // ref — the saved pre-mortem this draft replaces on finish (null = brand-new).
  const [pooledCount, setPooledCount] = useState(0);
  const poolBaseRef = useRef<string | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement | null>(null);
  // A decision carried in from another tool's handoff, kept so "start fresh"
  // can seed the plan even after the landing auto-open has consumed it once.
  const carriedSubjectRef = useRef("");

  useEffect(() => {
    const savedList = loadJSON<Premortem[]>(SAVED_KEY, []);
    const savedDraft = loadJSON<Draft | null>(DRAFT_KEY, null);
    const merged = Array.isArray(savedList) ? savedList.map(mergePremortem) : [];
    // Honor a ?check=<pm id>:<reason id> deep link from the return desk: open
    // that pre-mortem's view straight to the tripwire whose check is due.
    const checkParam = new URLSearchParams(window.location.search).get("check");
    const [checkPmId, checkReasonId] = checkParam
      ? checkParam.split(":")
      : [null, null];
    const targetPm =
      checkPmId && merged.find((p) => p.id === checkPmId) ? checkPmId : null;
    // A decision handed over from another tool (?subject=…). Kept for startFresh.
    const carried = readCarriedSubject();
    carriedSubjectRef.current = carried;
    // A plan handed over by another *person* to pre-mortem (#s=…). The setup
    // only — the plan and the date — never their reasons (see share helpers).
    const shared = coerceSharedPremortem(readShare("premortem"));
    // A finished pre-mortem handed *back* by the person you shared the plan with
    // (tagged premortem-pool). Distinct tag, so a setup link and a return link
    // can never be misread for one another. Their failures, never their triage.
    const pooled = coercePoolReturn(readShare(POOL_TAG));
    const hasDraft = !!(
      savedDraft &&
      (savedDraft.plan || (savedDraft.reasons ?? []).length > 0)
    );
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setSaved(merged);
    if (hasDraft) {
      setDraft(mergeDraft(savedDraft));
      // A shared plan can't clobber an in-progress draft — hold it as a card the
      // person can open (starting fresh on it) or dismiss.
      if (shared && !targetPm) setPendingShare(shared);
    } else if (shared && !targetPm) {
      // A plan someone handed you to pre-mortem. Open a fresh draft straight at
      // the *failure* step — the plan and the date are given, so the recipient's
      // job is the one thing the share deliberately withheld: their own list.
      setDraft({
        ...emptyDraft(),
        step: "imagine",
        plan: shared.plan,
        judgeOn: shared.judgeOn,
      });
      setScreen("work");
      setFromShare(true);
    } else if (carried && !targetPm && !pooled) {
      // Seamless handoff: another tool sent a decision here. Open a fresh draft
      // with the plan already filled, rather than a cold home screen — but only
      // when there's no in-progress draft to respect and no return-desk deep link.
      setDraft({ ...emptyDraft(), plan: carried });
      setScreen("work");
      setCarriedSeed(carried);
    }
    if (pooled && !targetPm) {
      // A pooled return never opens anything on its own — it waits as a card the
      // author opens (into a triage flow) or dismisses, so it can't clobber a
      // draft or silently mutate a saved plan. Match it to the saved pre-mortem
      // it belongs to by plan (normalized the same way both links capped it); a
      // no-match becomes a fresh pre-mortem seeded with their failures.
      const match = merged.find(
        (p) => reasonKey(capStr(p.plan)) === reasonKey(pooled.plan)
      );
      setPendingReturn({
        plan: pooled.plan,
        reasons: pooled.reasons,
        matchId: match ? match.id : null,
      });
    }
    if (targetPm) {
      setViewId(targetPm);
      setScreen("view");
      if (checkReasonId) setFocusReasonId(checkReasonId);
      // Strip the param so a refresh doesn't reopen it and the URL stays clean;
      // the screen state carries the target from here.
      window.history.replaceState(null, "", window.location.pathname);
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (carried) clearCarriedSubject();
    // Strip the share fragment once read, whether adopted or held pending, so a
    // refresh doesn't re-apply it and the address bar stops carrying someone
    // else's plan. The pending card lives in state, not the URL, from here.
    if (shared || pooled) clearShare();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {
      /* storage full or unavailable — the tool still works in-memory */
    }
  }, [saved, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (draft) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      else window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* storage full or unavailable */
    }
  }, [draft, hydrated]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (shareTimer.current) clearTimeout(shareTimer.current);
      if (returnTimer.current) clearTimeout(returnTimer.current);
    },
    []
  );

  // Build a share link for a saved plan and put it on the clipboard. Encodes the
  // setup (plan + judge date, never the reasons) into the URL fragment — never a
  // server — with the same clipboard-then-execCommand fallback the other shares
  // and the memo copy use.
  const copyShareLink = useCallback(async (pm: Premortem) => {
    if (typeof window === "undefined") return;
    const token = encodeShare("premortem", premortemSharePayload(pm));
    if (!token) return;
    const link = `${window.location.origin}/premortem#${SHARE_PARAM}=${token}`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setShareCopied(true);
      if (shareTimer.current) clearTimeout(shareTimer.current);
      shareTimer.current = setTimeout(() => setShareCopied(false), 2500);
    }
  }, []);

  // Build the *return* link — the other half of the loop. Encodes a finished
  // pre-mortem's failure list (never its triage) under the premortem-pool tag,
  // so whoever shared the plan can pool the failures into theirs. Same
  // fragment-only, sent-nowhere encoding and clipboard fallback as the share.
  const copyReturnLink = useCallback(async (pm: Premortem) => {
    if (typeof window === "undefined") return;
    const token = encodeShare(POOL_TAG, poolReturnPayload(pm));
    if (!token) return;
    const link = `${window.location.origin}/premortem#${SHARE_PARAM}=${token}`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(link);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setReturnCopied(true);
      if (returnTimer.current) clearTimeout(returnTimer.current);
      returnTimer.current = setTimeout(() => setReturnCopied(false), 2500);
    }
  }, []);

  const top = useCallback(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, []);

  const startNew = useCallback(() => {
    // If a decision was carried in from another tool, seed the plan with it.
    const seed = carriedSubjectRef.current;
    carriedSubjectRef.current = "";
    setDraft(seed ? { ...emptyDraft(), plan: seed } : emptyDraft());
    setCarriedSeed(seed);
    setFromShare(false);
    poolBaseRef.current = null;
    setPooledCount(0);
    setScreen("work");
    setReasonInput("");
    setActiveLens(null);
    top();
  }, [top]);

  const resume = useCallback(() => {
    setScreen("work");
    top();
  }, [top]);

  const goHome = useCallback(() => {
    setScreen("home");
    setViewId(null);
    setFocusReasonId(null);
    setCopied(false);
    setShareCopied(false);
    setReturnCopied(false);
    top();
  }, [top]);

  const openView = useCallback(
    (id: string) => {
      setViewId(id);
      setScreen("view");
      setFocusReasonId(null);
      setCopied(false);
      setShareCopied(false);
      setReturnCopied(false);
      top();
    },
    [top]
  );

  // Pool a returned failure list into the author's plan. Rather than mutate the
  // saved record silently, it opens a *triage* flow — the returned failures land
  // at the end of the list, still untriaged, so the author decides what to do
  // about each one (change / tripwire / accept) exactly as with their own, then
  // saves. A match replaces the original pre-mortem in place (same id, so the
  // journal link and creation date survive); a no-match becomes a fresh
  // pre-mortem on that plan. Duplicates against what's already there are dropped.
  const poolReturnIn = useCallback(
    (ret: { plan: string; reasons: string[]; matchId: string | null }) => {
      const base = ret.matchId ? saved.find((p) => p.id === ret.matchId) : null;
      const existing: PremortemReason[] = base
        ? base.reasons.map((r) => ({ ...r }))
        : [];
      const seen = new Set(existing.map((r) => reasonKey(r.text)));
      const added: PremortemReason[] = [];
      for (const text of ret.reasons) {
        const key = reasonKey(text);
        if (seen.has(key)) continue;
        seen.add(key);
        added.push({
          id: newId(),
          text,
          triage: null,
          detail: "",
          signal: "",
          checkOn: "",
          checkedOn: "",
          fired: null,
        });
      }
      // Everything they sent was already in the plan: nothing to triage. Just
      // clear the card and drop the author on the finished pre-mortem.
      if (base && added.length === 0) {
        setPendingReturn(null);
        openView(base.id);
        return;
      }
      poolBaseRef.current = base ? base.id : null;
      setPooledCount(added.length);
      setDraft({
        // A match already has the author's own reasons triaged — drop straight
        // onto triage for the new ones. A no-match is effectively a fresh
        // pre-mortem on a plan the author didn't have saved, so land on the
        // failure step: the crystal ball shows them the plan and date they're
        // now standing in the wreckage of, and they can add their own causes
        // before triaging.
        step: base ? "triage" : "imagine",
        plan: base ? base.plan : ret.plan,
        judgeOn: base
          ? base.judgeOn
          : addDaysISO(todayISO(), JUDGE_DEFAULT_DAYS),
        reasons: [...existing, ...added],
      });
      setPendingReturn(null);
      setFromShare(false);
      setReasonInput("");
      setActiveLens(null);
      setScreen("work");
      top();
    },
    [saved, openView, top]
  );

  const setStep = useCallback(
    (step: Step) => {
      setDraft((d) => (d ? { ...d, step } : d));
      top();
    },
    [top]
  );

  const addReason = useCallback(() => {
    const text = reasonInput.trim();
    if (!text) return;
    setDraft((d) =>
      d
        ? {
            ...d,
            reasons: [
              ...d.reasons,
              {
                id: newId(),
                text,
                triage: null,
                detail: "",
                signal: "",
                checkOn: "",
                checkedOn: "",
                fired: null,
              },
            ],
          }
        : d
    );
    setReasonInput("");
    reasonRef.current?.focus();
  }, [reasonInput]);

  const removeReason = useCallback((id: string) => {
    setDraft((d) =>
      d ? { ...d, reasons: d.reasons.filter((r) => r.id !== id) } : d
    );
  }, []);

  const updateReason = useCallback(
    (id: string, fn: (r: PremortemReason) => PremortemReason) => {
      setDraft((d) =>
        d
          ? { ...d, reasons: d.reasons.map((r) => (r.id === id ? fn(r) : r)) }
          : d
      );
    },
    []
  );

  const abandonDraft = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Throw away this unfinished pre-mortem? This can't be undone.")
    ) {
      return;
    }
    setDraft(null);
    setScreen("home");
    poolBaseRef.current = null;
    setPooledCount(0);
    top();
  }, [top]);

  // Triage completeness: what still blocks the save.
  const untriaged = draft ? draft.reasons.filter((r) => r.triage === null).length : 0;
  const unsignaled = draft
    ? draft.reasons.filter((r) => r.triage === "tripwire" && !r.signal.trim()).length
    : 0;

  const finish = useCallback(() => {
    if (!draft || draft.reasons.length === 0) return;
    if (untriaged > 0 || unsignaled > 0) return;
    // Pooling a returned list replaces the original pre-mortem in place, so its
    // id, creation date, journal-logged flag, and received-provenance survive.
    // Everything else — a normal draft, or a pool with no matching saved plan —
    // is a brand-new record.
    const baseId = poolBaseRef.current;
    const base = baseId ? saved.find((p) => p.id === baseId) : null;
    const pm: Premortem = {
      id: base ? base.id : newId(),
      plan: draft.plan.trim(),
      judgeOn: draft.judgeOn,
      reasons: draft.reasons.map((r) => ({
        ...r,
        text: r.text.trim(),
        // A tripwire needs a date to exist as a tripwire; default one so a
        // signal never gets saved unscheduled.
        checkOn:
          r.triage === "tripwire" && !r.checkOn
            ? addDaysISO(todayISO(), TRIPWIRE_DEFAULT_DAYS)
            : r.checkOn,
      })),
      createdOn: base ? base.createdOn : todayISO(),
      loggedOn: base ? base.loggedOn : "",
      // A pre-mortem you were handed to run offers to send its failures back;
      // pooling preserves whatever the base already was.
      receivedShare: base ? base.receivedShare : fromShare,
    };
    if (base) {
      setSaved((prev) => prev.map((p) => (p.id === base.id ? pm : p)));
    } else {
      setSaved((prev) => [pm, ...prev]);
    }
    poolBaseRef.current = null;
    setPooledCount(0);
    setDraft(null);
    openView(pm.id);
  }, [draft, untriaged, unsignaled, openView, saved, fromShare]);

  // Record a tripwire check's answer (or re-arm it) on a saved pre-mortem.
  // The one mutation the artifact view is allowed: the record of the plan
  // stays read-only, but the checks are events that happen after saving.
  const updateSavedReason = useCallback(
    (pmId: string, reasonId: string, fn: (r: PremortemReason) => PremortemReason) => {
      setSaved((prev) =>
        prev.map((pm) =>
          pm.id === pmId
            ? {
                ...pm,
                reasons: pm.reasons.map((r) => (r.id === reasonId ? fn(r) : r)),
              }
            : pm
        )
      );
    },
    []
  );

  // Hand a saved plan to the decision journal: capture the honest, de-biased
  // confidence now that the funeral is fresh, write it as a tracked forecast
  // due on the judge date, and mark the pre-mortem logged so it can't be
  // double-filed. The journal owns the log; this appends through the shared
  // write module (data/decisionLog.ts), then records loggedOn locally.
  const logPremortemDecision = useCallback(
    (pm: Premortem, confidence: number, expectation: string) => {
      if (pm.loggedOn) return;
      const reviewOn = reviewDateFor(pm);
      appendDecisionEntry({
        situationId: "premortem",
        situationTitle: "A plan you ran a pre-mortem on",
        question:
          "Given the failure I already imagined, does the plan still convince me — and how sure am I now?",
        decision: pm.plan.trim(),
        reasoning: buildPremortemReasoning(pm),
        call: "Proceed — the plan survived its pre-mortem, strengthened.",
        firstStep: "",
        expectation:
          expectation.trim() || `The plan works out by ${formatHuman(reviewOn)}.`,
        confidence,
        reviewOn,
      });
      setSaved((prev) =>
        prev.map((p) => (p.id === pm.id ? { ...p, loggedOn: todayISO() } : p))
      );
    },
    []
  );

  const deletePremortem = useCallback(
    (id: string) => {
      if (
        typeof window !== "undefined" &&
        !window.confirm("Delete this pre-mortem? This can't be undone.")
      ) {
        return;
      }
      setSaved((prev) => prev.filter((p) => p.id !== id));
      goHome();
    },
    [goHome]
  );

  const copy = useCallback(async (text: string) => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const downloadICS = useCallback((pm: Premortem) => {
    try {
      const blob = new Blob([buildTripwireICS(pm)], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tripwires-${pm.createdOn}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      if (typeof window !== "undefined")
        window.alert("Couldn't create the calendar file in this browser.");
    }
  }, []);

  // ---- viewing a finished pre-mortem (or the sample) ---------------------
  if (screen === "view" && viewId) {
    const pm =
      viewId === "sample" ? SAMPLE_PREMORTEM : saved.find((p) => p.id === viewId) ?? null;
    if (pm) {
      return (
        <PremortemView
          pm={pm}
          isSample={viewId === "sample"}
          focusReasonId={focusReasonId}
          onBack={goHome}
          onCopy={() => copy(buildPremortemMemo(pm))}
          onICS={() => downloadICS(pm)}
          onShare={() => copyShareLink(pm)}
          onReturn={() => copyReturnLink(pm)}
          onDelete={() => deletePremortem(pm.id)}
          onUpdateReason={(reasonId, fn) => updateSavedReason(pm.id, reasonId, fn)}
          onLogDecision={(confidence, expectation) =>
            logPremortemDecision(pm, confidence, expectation)
          }
          copied={copied}
          shareCopied={shareCopied}
          returnCopied={returnCopied}
        />
      );
    }
  }

  // ---- the guided exercise ------------------------------------------------
  if (screen === "work" && draft) {
    if (draft.step === "plan") {
      return (
        <div>
          <StepHeader step={1} label="The plan" onExit={abandonDraft} />
          <div className="mt-8">
            <label
              htmlFor="pm-plan"
              className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
            >
              The plan, in one line
            </label>
            <textarea
              id="pm-plan"
              rows={2}
              value={draft.plan}
              onChange={(e) => setDraft((d) => (d ? { ...d, plan: e.target.value } : d))}
              placeholder="e.g. Rebuild the onboarding flow this quarter. Launch the paid tier by October. Move to Lisbon in the spring."
              className={textareaClass}
              autoFocus
            />
            <CarriedNote
              show={carriedSeed !== "" && draft.plan.trim() === carriedSeed}
              onClear={() => {
                setDraft((d) => (d ? { ...d, plan: "" } : d));
                setCarriedSeed("");
              }}
            />
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              A commitment you&rsquo;re about to make or have just made — concrete
              enough that failure would be recognizable.
            </p>
          </div>

          <div className="mt-8">
            <label
              htmlFor="pm-judge"
              className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
            >
              By when will you know whether it worked?
            </label>
            <input
              id="pm-judge"
              type="date"
              value={draft.judgeOn}
              min={todayISO()}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, judgeOn: e.target.value } : d))
              }
              className={inputClass}
            />
            <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
              This is the day the exercise will ask you to imagine standing on.
              Klein&rsquo;s default is a year out; closer is fine if the plan is
              smaller.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("imagine")}
              disabled={!draft.plan.trim()}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              It has already failed →
            </button>
          </div>
        </div>
      );
    }

    if (draft.step === "imagine") {
      const n = draft.reasons.length;
      return (
        <div>
          <StepHeader step={2} label="The failure" onExit={abandonDraft} />

          {pooledCount > 0 && (
            <div className="mt-6 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--card)] p-4">
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                <span className="font-medium">
                  {pooledCount} failure{pooledCount === 1 ? "" : "s"} from a second
                  pre-mortem are already listed below.
                </span>{" "}
                You don&rsquo;t have this plan saved, so it starts fresh with their
                causes. Add any of your own, then decide what to do about each.
              </p>
            </div>
          )}

          {fromShare && (
            <div className="mt-6 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--card)] p-4">
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                <span className="font-medium">
                  Someone handed you this plan to pre-mortem.
                </span>{" "}
                The plan and the date are theirs — the reasons should be yours.
                They didn&rsquo;t send their own list on purpose: a pre-mortem
                works because each person imagines the failure alone first, so an
                unseen list can&rsquo;t anchor yours. Write what you think killed
                it, then compare notes.
              </p>
            </div>
          )}

          {/* The crystal ball. The tense is the technique: not "what could go
              wrong" (a debate) but "it went wrong" (a history to explain). */}
          <div className="mt-8 rounded-lg border border-[var(--accent)] bg-[var(--card)] p-4">
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              It&rsquo;s <strong>{formatHuman(draft.judgeOn)}</strong>. The plan —{" "}
              <em>{draft.plan.trim()}</em> — has failed. Not disappointed, not
              behind schedule: <strong>failed</strong>, clearly enough that
              nobody&rsquo;s arguing about it.
            </p>
            <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
              You already know how it happened — you&rsquo;re standing in the
              wreckage. Write the reasons down one at a time, fast, in the past
              tense, the way you&rsquo;d explain it to a friend afterward. Don&rsquo;t
              filter for likelihood yet; that&rsquo;s the next step&rsquo;s job.
            </p>
          </div>

          <div className="mt-6">
            <label
              htmlFor="pm-reason"
              className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
            >
              It failed because…
            </label>
            <textarea
              id="pm-reason"
              ref={reasonRef}
              rows={2}
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addReason();
                }
              }}
              placeholder="…the person it all depended on left in month two."
              className={textareaClass}
              autoFocus
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-[var(--muted)]">
                Enter adds it and clears the box for the next one.
              </p>
              <button
                type="button"
                onClick={addReason}
                disabled={!reasonInput.trim()}
                className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add ↵
              </button>
            </div>
          </div>

          {n > 0 && (
            <ol className="mt-6 space-y-2">
              {draft.reasons.map((r, i) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5"
                >
                  <span className="text-xs font-semibold text-[var(--muted)] mt-0.5 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="flex-1 text-sm text-[var(--foreground)] leading-relaxed">
                    {r.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeReason(r.id)}
                    aria-label={`Remove reason ${i + 1}`}
                    className="shrink-0 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
          )}

          {/* Lenses: the solo substitute for the room full of people Klein's
              version gets its breadth from. */}
          <div className="mt-8">
            <span className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              Stuck? Walk the perimeter
            </span>
            <div className="flex flex-wrap gap-2">
              {LENSES.map((l) => {
                const active = activeLens === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setActiveLens(active ? null : l.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      active
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
                    }`}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
            {activeLens && (
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed pl-4 border-l-2 border-[var(--accent)]">
                {LENSES.find((l) => l.id === activeLens)?.prompt}
              </p>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("triage")}
              disabled={n === 0}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Done — now decide what to do about each →
            </button>
            <button
              type="button"
              onClick={() => setStep("plan")}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              ← Back
            </button>
          </div>
          {n > 0 && n < REASON_TARGET && (
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              {n} reason{n === 1 ? "" : "s"} so far. You can continue any time —
              but the first two are usually the ones you already knew about. The
              embarrassing ones, and the useful ones, tend to show up around
              number four or five.
            </p>
          )}
        </div>
      );
    }

    // ---- triage ----------------------------------------------------------
    return (
      <div>
        <StepHeader step={3} label="The response" onExit={abandonDraft} />

        {pooledCount > 0 && (
          <div className="mt-6 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--card)] p-4">
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              <span className="font-medium">
                {pooledCount} failure{pooledCount === 1 ? "" : "s"} came back from
                a second pre-mortem.
              </span>{" "}
              They&rsquo;re added to the end of your list, still untriaged — the
              other person imagined them, but the response is yours to decide, the
              same as your own. Triage each one below, then save to fold them into
              this plan.
            </p>
          </div>
        )}

        <p className="mt-8 text-sm text-[var(--muted)] leading-relaxed">
          A pre-mortem&rsquo;s output isn&rsquo;t a list of fears — it&rsquo;s
          decisions. For each cause of the imagined failure, pick one:{" "}
          <span className="text-[var(--foreground)]">change the plan</span> now,
          while it&rsquo;s cheap;{" "}
          <span className="text-[var(--foreground)]">set a tripwire</span> — a
          signal plus a date to check for it, decided while you&rsquo;re calm; or{" "}
          <span className="text-[var(--foreground)]">accept the risk</span> with
          open eyes and stop worrying about it.
        </p>

        <div className="mt-8 space-y-6">
          {draft.reasons.map((r, i) => (
            <div
              key={r.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
            >
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                <span className="text-xs font-semibold text-[var(--muted)] mr-2">
                  {i + 1}.
                </span>
                {r.text}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(
                  [
                    ["change", "Change the plan"],
                    ["tripwire", "Set a tripwire"],
                    ["accept", "Accept it"],
                  ] as const
                ).map(([kind, label]) => {
                  const selected = r.triage === kind;
                  return (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        updateReason(r.id, (prev) => ({
                          ...prev,
                          triage: prev.triage === kind ? null : kind,
                        }))
                      }
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {r.triage === "change" && (
                <div className="mt-3">
                  <textarea
                    rows={2}
                    value={r.detail}
                    onChange={(e) =>
                      updateReason(r.id, (prev) => ({ ...prev, detail: e.target.value }))
                    }
                    placeholder="What the plan now does differently — the cheapest version of this failure is the one you fix on paper, today."
                    aria-label={`What changes for reason ${i + 1}`}
                    className={textareaClass}
                  />
                </div>
              )}

              {r.triage === "tripwire" && (
                <div className="mt-3 space-y-3">
                  <textarea
                    rows={2}
                    value={r.signal}
                    onChange={(e) =>
                      updateReason(r.id, (prev) => ({ ...prev, signal: e.target.value }))
                    }
                    placeholder="The signal, as something you could observe and not argue with — a number, an event, a date passed. 'If we're below 100 signups', not 'if it feels slow'."
                    aria-label={`Tripwire signal for reason ${i + 1}`}
                    className={textareaClass}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor={`pm-check-${r.id}`}
                      className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]"
                    >
                      Check for it on
                    </label>
                    <input
                      id={`pm-check-${r.id}`}
                      type="date"
                      value={r.checkOn || addDaysISO(todayISO(), TRIPWIRE_DEFAULT_DAYS)}
                      min={todayISO()}
                      onChange={(e) =>
                        updateReason(r.id, (prev) => ({ ...prev, checkOn: e.target.value }))
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {r.triage === "accept" && (
                <div className="mt-3">
                  <textarea
                    rows={2}
                    value={r.detail}
                    onChange={(e) =>
                      updateReason(r.id, (prev) => ({ ...prev, detail: e.target.value }))
                    }
                    placeholder="Optional: why you can live with this one — so future-you knows it was seen, not missed."
                    aria-label={`Why reason ${i + 1} is acceptable`}
                    className={textareaClass}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={finish}
            disabled={untriaged > 0 || unsignaled > 0 || draft.reasons.length === 0}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save the pre-mortem
          </button>
          <button
            type="button"
            onClick={() => setStep("imagine")}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Add more reasons
          </button>
        </div>
        {(untriaged > 0 || unsignaled > 0) && (
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            {untriaged > 0
              ? `${untriaged} reason${untriaged === 1 ? "" : "s"} still need a decision. `
              : ""}
            {unsignaled > 0
              ? `${unsignaled} tripwire${unsignaled === 1 ? "" : "s"} still need the signal written down — a tripwire without an observable signal is just a worry.`
              : ""}
          </p>
        )}
      </div>
    );
  }

  // ---- home ---------------------------------------------------------------
  const pendingDesc = pendingShare ? describeSharedPremortem(pendingShare) : null;
  const draftInProgress = !!(
    draft &&
    (draft.plan.trim() || draft.reasons.length > 0)
  );
  return (
    <div>
      {/* ---- Handed back: a second person's failure list, waiting to be pooled
             into the author's plan ---- */}
      {hydrated && pendingReturn && (
        <div className="mb-5 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--card)] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            A second pre-mortem came back
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--foreground)] leading-relaxed">
            {pendingReturn.plan}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
            {pendingReturn.reasons.length} failure
            {pendingReturn.reasons.length === 1 ? "" : "s"} someone imagined for
            this plan
            {pendingReturn.matchId
              ? "."
              : " — which doesn't match one you have saved."}
          </p>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            {pendingReturn.matchId
              ? "Pool them in and you'll triage each returned failure the way you triaged your own — change the plan, set a tripwire, or accept it — then save to fold them into your pre-mortem."
              : "Pool them in to start a pre-mortem on this plan with their failures already listed, ready to triage."}{" "}
            Their triage didn&rsquo;t ride along on purpose: the response to a
            failure on your plan is yours to decide.
            {draftInProgress
              ? " This opens a triage flow and will replace the draft you have in progress."
              : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => poolReturnIn(pendingReturn)}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
            >
              Pool them in
            </button>
            <button
              type="button"
              onClick={() => setPendingReturn(null)}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ---- Shared with you: a plan to pre-mortem, held because a draft was
             already in progress ---- */}
      {hydrated && pendingShare && pendingDesc && (
        <div className="mb-5 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] bg-[var(--card)] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Someone handed you a plan to pre-mortem
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--foreground)] leading-relaxed">
            {pendingDesc.plan}
          </p>
          {pendingDesc.line && (
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
              {pendingDesc.line}
            </p>
          )}
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            You already have a pre-mortem in progress here. Opening theirs
            replaces that unfinished draft. Dismiss this to keep working on
            yours — the link stays good, so you can come back to their plan when
            you&rsquo;re ready.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                const s = pendingShare;
                setDraft({
                  ...emptyDraft(),
                  step: "imagine",
                  plan: s.plan,
                  judgeOn: s.judgeOn,
                });
                setFromShare(true);
                setPendingShare(null);
                setReasonInput("");
                setActiveLens(null);
                setScreen("work");
                top();
              }}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
            >
              Pre-mortem their plan
            </button>
            <button
              type="button"
              onClick={() => setPendingShare(null)}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={startNew}
        className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-4 hover:border-[var(--accent)] transition-colors"
      >
        <span className="text-sm font-semibold text-[var(--foreground)]">
          Run a pre-mortem →
        </span>
        <span className="mt-1 block text-sm text-[var(--muted)] leading-relaxed">
          Ten to twenty minutes. Name the plan, declare it dead, write the
          history of the failure — then turn every cause into a plan change, a
          tripwire, or a risk you accept on purpose.
        </span>
      </button>

      {hydrated && draft && (
        <button
          type="button"
          onClick={resume}
          className="mt-3 w-full text-left rounded-lg border border-[var(--accent)] bg-[var(--card)] px-4 py-3 hover:opacity-90 transition-opacity"
        >
          <span className="text-sm font-semibold text-[var(--foreground)]">
            Resume the one you started →
          </span>
          <span className="mt-1 block text-sm text-[var(--muted)] leading-relaxed">
            {draft.plan.trim() ? `“${draft.plan.trim()}”` : "Unnamed plan"}
            {draft.reasons.length > 0
              ? ` · ${draft.reasons.length} reason${draft.reasons.length === 1 ? "" : "s"} so far`
              : ""}
          </span>
        </button>
      )}

      {hydrated && saved.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Your pre-mortems
          </h2>
          <ul className="space-y-3">
            {saved.map((pm) => {
              const tw = tripwires(pm);
              const due = dueTripwireChecks(pm).length;
              const nextCheck = tw
                .filter((r) => !r.checkedOn)
                .map((r) => r.checkOn)
                .filter(Boolean)
                .sort()[0];
              return (
                <li key={pm.id}>
                  <button
                    type="button"
                    onClick={() => openView(pm.id)}
                    className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 hover:border-[var(--accent)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                        {pm.plan}
                      </span>
                      {due > 0 && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)] mt-0.5">
                          {due} check{due === 1 ? "" : "s"} due
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 block text-xs text-[var(--muted)]">
                      {formatHuman(pm.createdOn)} · {pm.reasons.length} reason
                      {pm.reasons.length === 1 ? "" : "s"}
                      {tw.length > 0
                        ? ` · ${tw.length} tripwire${tw.length === 1 ? "" : "s"}${
                            nextCheck ? ` · next check ${formatHuman(nextCheck)}` : ""
                          }`
                        : ""}
                      {pm.loggedOn ? " · logged to journal" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-6 text-sm text-[var(--muted)] leading-relaxed">
        Not sure what a finished one looks like?{" "}
        <button
          type="button"
          onClick={() => openView("sample")}
          className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
        >
          See a worked example →
        </button>
      </p>

      <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
        Everything you write stays in this browser — it&rsquo;s saved locally and
        never sent anywhere. An unfinished pre-mortem keeps until you come back;
        finished ones are listed here, with their tripwire dates ready to drop
        into your calendar. When a check date arrives, the pre-mortem asks for
        the answer — fired, or all clear — and keeps it on the record.
      </p>
    </div>
  );
}

// =========================================================================

function StepHeader({
  step,
  label,
  onExit,
}: {
  step: number;
  label: string;
  onExit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Step {step} of 3 — {label}
      </span>
      <button
        type="button"
        onClick={onExit}
        className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        Discard
      </button>
    </div>
  );
}

function PremortemView({
  pm,
  isSample,
  focusReasonId,
  onBack,
  onCopy,
  onICS,
  onShare,
  onReturn,
  onDelete,
  onUpdateReason,
  onLogDecision,
  copied,
  shareCopied,
  returnCopied,
}: {
  pm: Premortem;
  isSample: boolean;
  focusReasonId: string | null;
  onBack: () => void;
  onCopy: () => void;
  onICS: () => void;
  onShare: () => void;
  onReturn: () => void;
  onDelete: () => void;
  onUpdateReason: (reasonId: string, fn: (r: PremortemReason) => PremortemReason) => void;
  onLogDecision: (confidence: number, expectation: string) => void;
  copied: boolean;
  shareCopied: boolean;
  returnCopied: boolean;
}) {
  const tw = tripwires(pm);
  const armedTw = tw.filter((r) => r.checkOn && !r.checkedOn);
  const changes = pm.reasons.filter((r) => r.triage === "change").length;
  const accepted = pm.reasons.filter((r) => r.triage === "accept").length;
  const dueChecks = dueTripwireChecks(pm).length;

  // When the return desk deep-links to one tripwire, bring it to the middle of
  // the screen and glow its card briefly, so the check that's due is the thing
  // the eye lands on — then fade, so it reads as a highlight, not a permanent
  // state. Only the navigation friction is removed; the answer is still yours.
  const focusRef = useRef<HTMLLIElement | null>(null);
  const [glow, setGlow] = useState(false);
  useEffect(() => {
    if (!focusReasonId || !focusRef.current) return;
    focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    setGlow(true);
    const t = setTimeout(() => setGlow(false), 2400);
    return () => clearTimeout(t);
  }, [focusReasonId]);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
      >
        ← Back
      </button>

      {isSample && (
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          A worked example — not saved to your list
        </p>
      )}

      <h2 className="mt-4 text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug">
        {pm.plan}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Pre-mortem written {formatHuman(pm.createdOn)}, imagining failure on{" "}
        {formatHuman(pm.judgeOn)} · {changes} plan change{changes === 1 ? "" : "s"} ·{" "}
        {tw.length} tripwire{tw.length === 1 ? "" : "s"} · {accepted} accepted risk
        {accepted === 1 ? "" : "s"}
      </p>
      {dueChecks > 0 && !isSample && (
        <p className="mt-3 text-sm font-medium text-[var(--accent)]">
          {dueChecks} tripwire check{dueChecks === 1 ? "" : "s"} due — the
          signal{dueChecks === 1 ? " is" : "s are"} waiting for an answer below.
        </p>
      )}

      <h3 className="mt-8 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        It failed because…
      </h3>
      <ol className="mt-4 space-y-4">
        {pm.reasons.map((r, i) => {
          const focused = r.id === focusReasonId;
          return (
          <li
            key={r.id}
            ref={focused ? focusRef : undefined}
            className={`rounded-lg border bg-[var(--card)] p-4 transition-all duration-500 ${
              focused && glow
                ? "border-[var(--accent)] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]"
                : "border-[var(--border)]"
            }`}
          >
            <p className="text-sm text-[var(--foreground)] leading-relaxed">
              <span className="text-xs font-semibold text-[var(--muted)] mr-2">
                {i + 1}.
              </span>
              {r.text}
            </p>
            {r.triage && (
              <div className="mt-2 pl-4 border-l-2 border-[var(--accent)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                  {TRIAGE_LABELS[r.triage]}
                </p>
                {r.triage === "tripwire" ? (
                  <>
                    <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
                      If {r.signal.trim()} — stop and reconsider.
                      {r.checkOn && !r.checkedOn
                        ? ` Check on ${formatHuman(r.checkOn)}.`
                        : ""}
                    </p>
                    <TripwireCheck
                      reason={r}
                      isSample={isSample}
                      onUpdate={(fn) => onUpdateReason(r.id, fn)}
                    />
                  </>
                ) : r.detail.trim() ? (
                  <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
                    {r.detail.trim()}
                  </p>
                ) : null}
              </div>
            )}
          </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCopy}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors"
        >
          {copied ? "Copied ✓" : "Copy as a memo"}
        </button>
        {armedTw.length > 0 && (
          <button
            type="button"
            onClick={onICS}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors"
          >
            Add tripwire checks to my calendar ↓
          </button>
        )}
        {!isSample && (
          <button
            type="button"
            onClick={onDelete}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {tw.length > 0 && (
        <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
          A tripwire only works if the check actually happens — the calendar is
          what makes it a mechanism instead of a hope. Each reminder carries the
          signal and the failure it guards, so you can act on it without coming
          back here.
        </p>
      )}

      {/* ---- Ask someone else to pre-mortem the same plan ---- */}
      {!isSample && (
        <div className="mt-8 rounded-xl border border-[var(--border)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Get a second pre-mortem
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            A pre-mortem was built for a room — several people each imagining the
            failure from where they sit, then pooling what they found. Copy a
            link that hands this plan and its date to a partner, a cofounder, an
            advisor, and they&rsquo;ll run their own pre-mortem on it in their
            browser. Your reasons don&rsquo;t ride along on purpose: the failures
            you each picture alone are exactly what a second pair of eyes is for,
            and an unseen list can&rsquo;t anchor theirs. It&rsquo;s sent to no
            server; only whoever you hand the link to can open it.
          </p>
          <button
            type="button"
            onClick={onShare}
            className="mt-4 text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
          >
            {shareCopied
              ? "Copied — the link is on your clipboard"
              : "Copy a link to this plan"}
          </button>
        </div>
      )}

      {/* ---- Hand it back: close the loop for a plan someone gave you to
             pre-mortem ---- */}
      {!isSample && pm.receivedShare && (
        <div className="mt-6 rounded-xl border border-[var(--border)] border-l-2 border-l-[var(--accent)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Hand it back
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Someone handed you this plan to pre-mortem. Send your failures back so
            they can pool them into theirs — the cause you saw from where you sit
            and they couldn&rsquo;t is exactly what asking a second person is for.
            Only your failure list travels, not what you&rsquo;d do about each:
            the response to a failure on their plan is theirs to decide. It&rsquo;s
            sent to no server; only they can open it.
          </p>
          <button
            type="button"
            onClick={onReturn}
            className="mt-4 text-sm font-medium px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
          >
            {returnCopied
              ? "Copied — the link is on your clipboard"
              : "Copy a link that sends your failures back"}
          </button>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-[var(--border)]">
        <LogToJournal pm={pm} isSample={isSample} onLog={onLogDecision} />
      </div>
    </div>
  );
}

// =========================================================================
// The handoff to the decision journal. A pre-mortem does two things to a plan:
// it strengthens it, and — more quietly — it drags an inflated confidence back
// toward honesty. Veinott, Klein & Wright (2010) measured it: imagining the
// plan already failed lowered people's confidence in it about twice as much as
// a pro/con list did. That de-biased number is the one worth recording — but
// only if it's captured now, while the funeral is fresh, before optimism seeps
// back. So the room offers to log the plan as a tracked forecast: what you
// expect, how sure you are, reviewed on the day you said you'd know. From then
// on it's an ordinary journal entry — it comes due, gets graded against what
// actually happened, and feeds your real-world calibration like any other bet.

function LogToJournal({
  pm,
  isSample,
  onLog,
}: {
  pm: Premortem;
  isSample: boolean;
  onLog: (confidence: number, expectation: string) => void;
}) {
  const reviewOn = reviewDateFor(pm);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [expectation, setExpectation] = useState(
    `The plan works out — I'll know by ${formatHuman(reviewOn)}.`
  );

  // The worked example only demonstrates the shape; it never writes anything.
  if (isSample) {
    return (
      <p className="text-sm text-[var(--muted)] leading-relaxed">
        The plan survived its funeral — the last move is to put the forecast on
        the record. On a real pre-mortem, this is where you&rsquo;d log the plan
        to your{" "}
        <Link
          href="/decide"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          decision journal
        </Link>{" "}
        with the honest, de-biased confidence the exercise just gave you — so
        that when the judge date arrives, reality grades the forecast, not just
        the outcome.
      </p>
    );
  }

  // Already logged: the record is in the journal, waiting for its review date.
  if (pm.loggedOn) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          Logged to your journal
        </p>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          This plan is now a tracked forecast, filed {formatHuman(pm.loggedOn)}{" "}
          with a review set for {formatHuman(reviewOn)}. When the day comes, the{" "}
          <Link
            href="/decide?log=1"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>{" "}
          will ask what actually happened and grade it against what you expected
          — the funeral&rsquo;s forecast, kept honest by reality.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Now record the honest number
      </p>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
        Imagining this plan already dead does something a pro-and-con list
        doesn&rsquo;t: it pulls an inflated confidence back toward the truth —
        about twice as far, when it was measured. Capture that de-biased number
        now, while the funeral is fresh, and the{" "}
        <Link
          href="/decide"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          decision journal
        </Link>{" "}
        will bring the plan back to you on {formatHuman(reviewOn)} to grade the
        forecast, not just the outcome.{" "}
        <Link
          href="/writing/the-honest-number-comes-after"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Why the number after is the honest one →
        </Link>
      </p>

      <div className="mt-5">
        <label
          htmlFor={`pm-expect-${pm.id}`}
          className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2"
        >
          What I expect to happen
        </label>
        <textarea
          id={`pm-expect-${pm.id}`}
          rows={2}
          value={expectation}
          onChange={(e) => setExpectation(e.target.value)}
          placeholder="The specific outcome you're predicting — concrete enough that you'll know whether it came true."
          className={textareaClass}
        />
      </div>

      <div className="mt-5">
        <span className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          How confident — now, that the plan works out
        </span>
        <div className="flex flex-wrap gap-2">
          {CONFIDENCE_OPTIONS.map((c) => {
            const selected = confidence === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={selected}
                onClick={() => setConfidence(selected ? null : c)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)]"
                }`}
              >
                {c}%
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => confidence != null && onLog(confidence, expectation)}
          disabled={confidence == null}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Log this plan to my decision journal
        </button>
        {confidence == null && (
          <span className="text-xs text-[var(--muted)]">
            Pick the confidence that survived the pre-mortem.
          </span>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// The tripwire check, answered. A calendar reminder you swipe away is not a
// check — aviation checklists demand the actual status spoken back ("flaps
// 20"), never a bare "checked", because an acknowledgement carries no
// information. So a check here produces one of two recorded answers: the
// signal appeared (the tripwire fired), or it didn't (all clear, re-arm if
// the risk is still live). If it fired, the response was decided the day the
// tripwire was set: the plan doesn't get the benefit of the doubt.

function TripwireCheck({
  reason,
  isSample,
  onUpdate,
}: {
  reason: PremortemReason;
  isSample: boolean;
  onUpdate: (fn: (r: PremortemReason) => PremortemReason) => void;
}) {
  const [rearmOn, setRearmOn] = useState(() =>
    addDaysISO(todayISO(), TRIPWIRE_DEFAULT_DAYS)
  );

  // Still armed. The sample's armed tripwire stays a plain record — the
  // interactive check belongs to real plans only.
  if (!reason.checkedOn) {
    if (isSample) return null;
    const due = isDueTripwireCheck(reason);
    return (
      <div className="mt-3">
        <p
          className={`text-sm leading-relaxed ${
            due ? "font-medium text-[var(--accent)]" : "text-[var(--muted)]"
          }`}
        >
          {due
            ? "This check is due. Has the signal appeared?"
            : "Already know the answer? A check doesn't have to wait for its date."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onUpdate((prev) => ({ ...prev, checkedOn: todayISO(), fired: true }))
            }
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors"
          >
            It fired — the signal appeared
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdate((prev) => ({ ...prev, checkedOn: todayISO(), fired: false }))
            }
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            All clear
          </button>
        </div>
      </div>
    );
  }

  // Answered: all clear.
  if (reason.fired === false) {
    return (
      <div className="mt-3">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Checked {formatHuman(reason.checkedOn)} — all clear.
        </p>
        {!isSample && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label
              htmlFor={`rearm-${reason.id}`}
              className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]"
            >
              Still a live risk? Re-arm for
            </label>
            <input
              id={`rearm-${reason.id}`}
              type="date"
              value={rearmOn}
              min={todayISO()}
              onChange={(e) => setRearmOn(e.target.value)}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() =>
                onUpdate((prev) => ({
                  ...prev,
                  checkOn: rearmOn || addDaysISO(todayISO(), TRIPWIRE_DEFAULT_DAYS),
                  checkedOn: "",
                  fired: null,
                }))
              }
              className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Re-arm ↻
            </button>
            <button
              type="button"
              onClick={() =>
                onUpdate((prev) => ({ ...prev, checkedOn: "", fired: null }))
              }
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              undo
            </button>
          </div>
        )}
      </div>
    );
  }

  // Answered: it fired. The pre-committed response, held to.
  return (
    <div className="mt-3 rounded-lg border border-[var(--accent)] bg-[var(--card)] px-4 py-3">
      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-semibold">
          Fired {formatHuman(reason.checkedOn)}.
        </span>{" "}
        The plan doesn&rsquo;t get the benefit of the doubt — you decided that
        the day you set this tripwire, while you were calm. Stop and
        reconsider on purpose, before momentum votes for you.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/decide?s=time-to-quit"
          className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Work the quitting question through →
        </Link>
        {!isSample && (
          <button
            type="button"
            onClick={() =>
              onUpdate((prev) => ({ ...prev, checkedOn: "", fired: null }))
            }
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            recorded by mistake?
          </button>
        )}
      </div>
    </div>
  );
}
