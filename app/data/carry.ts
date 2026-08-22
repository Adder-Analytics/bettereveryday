/**
 * The through-line: type your decision once, carry it across the toolkit.
 *
 * The site grew one instrument at a time, and every one of them opens the same
 * way — a single field at the top asking "what are you deciding?" On its own
 * that's fine. The problem is what the tools then do to each other: they hand
 * off. The reversibility triage (/doors) tells a one-way door to go write a
 * pre-mortem; the consequence trace (/trace) sends a decision to the flip point;
 * the pre-mortem hands its plan to the journal. Every one of those handoffs was
 * a plain link — so the person clicked through and landed on a blank field, and
 * retyped the same one-liner they'd already typed a screen ago. A toolkit whose
 * tools keep saying "now take it to X" but drop the decision on the threshold
 * isn't one instrument; it's fourteen forms wearing a trench coat.
 *
 * This module is the connective tissue. A tool carries its subject — the "what
 * are you deciding?" line — out on its handoff links, and the destination reads
 * it back in and pre-fills its own subject field, but only when that field is
 * empty, so an incoming param can never clobber saved work. The result: a real
 * decision walked through doors → pre-mortem → journal is typed once, not three
 * times, and the site's own repeated "take it to the flip point" finally lands
 * seamless instead of on a cold start.
 *
 * Same throw-nothing, send-nothing discipline as the rest of the site: the
 * subject rides in the URL query only, is capped and whitespace-collapsed so a
 * link can't carry an essay, and nothing is persisted by this module — each
 * tool owns its own store, exactly as before.
 *
 * A deliberate boundary, learned from a prior day's mistake: a handoff carries
 * the subject ONLY when the destination actually reads it. A param the other end
 * ignores is a dead param that implies a bridge that doesn't fire — so a tool
 * that hands off to a genuinely subject-less destination (the return desk) links
 * plainly, and only the readers get the param. The tripwire was the last such
 * gap: it read its own `?guard=`/`?signal=` params but not the subject, so an
 * older-self or quit handoff carrying `withSubject("/tripwire", …)` dropped the
 * decision on the threshold. It now reads the carried subject as its guard, so
 * that handoff lands like every other — the through-line reaches every tool that
 * holds a decision.
 */

/** The query key the subject rides in. Short, human-legible in a URL. */
export const SUBJECT_PARAM = "subject";

/**
 * A handoff can carry more than the one-liner. When a tool already holds a
 * *two-option* decision — the halo-off comparison narrowed to two finalists it
 * can't separate — it can hand both option labels to the flip point's "A, or B"
 * frame, which is built for exactly that call. Same discipline as the subject:
 * carried in the URL only, normalized and capped, read only by a destination
 * that actually consumes it (today just /weigh), and never allowed to clobber a
 * field the receiver already has filled.
 */
export const OPTION_A_PARAM = "a";
export const OPTION_B_PARAM = "b";

/**
 * A handoff can also carry a *whole slate* of option labels, not just two. When
 * a tool widens a one-option frame into three, four, or more real alternatives
 * (see `/widen`), it can hand the entire list to the halo-off comparison, which
 * is built to score several options at once. The two-label `a`/`b` params above
 * are for the specific two-way call the flip point takes; this is for the
 * three-or-more case the comparison takes. Same discipline: URL only, each label
 * normalized and capped, the list length-capped so a link stays a link, read
 * only by a destination that consumes it (today just /compare), and never
 * allowed to clobber options the receiver already has filled.
 *
 * The labels are joined on the ASCII unit separator (U+001F) — a control
 * character no one types, so it can't appear inside a normalized label and
 * collide with the delimiter, and it survives URL-encoding cleanly.
 */
export const OPTIONS_PARAM = "opts";
const OPTIONS_SEP = "\u001f";
const MAX_OPTION_LIST = 6;

/**
 * The source a decision was carried *from*, so the "carried over" cue can name
 * it ("carried from your comparison") instead of the generic "your last step."
 * A controlled vocabulary, not free text: the receiver only honors a token it
 * knows, so an arbitrary URL can never inject a phrase into the UI. Add a source
 * here when a new handoff wants to name itself.
 */
export const FROM_PARAM = "from";
export const CARRY_SOURCES = {
  compare: "your comparison",
  widen: "widening your options",
} as const;
export type CarrySource = keyof typeof CARRY_SOURCES;

/** A one-liner, not an essay: cap the carried subject so a URL stays a URL. */
const MAX_SUBJECT = 240;

/** Collapse whitespace and cap length — the one normalization both ends share. */
function normalize(subject: string): string {
  return subject.replace(/\s+/g, " ").trim().slice(0, MAX_SUBJECT);
}

/**
 * Read the carried subject from the current URL. Client-only (reads
 * `window.location`); returns "" on the server or when there's nothing to carry.
 */
export function readCarriedSubject(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = new URLSearchParams(window.location.search).get(SUBJECT_PARAM);
    return raw ? normalize(raw) : "";
  } catch {
    return "";
  }
}

/** Append one `key=value` to an href, preserving any params already on it. */
function appendParam(href: string, key: string, value: string): string {
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}${key}=${encodeURIComponent(value)}`;
}

/**
 * Append the subject to a handoff href when there is one to carry. Preserves any
 * params the href already has (e.g. `/decide?log=1`), URL-encodes the value, and
 * returns the href untouched when the subject is empty — so a blank field never
 * puts a `?subject=` on a link.
 */
export function withSubject(href: string, subject: string): string {
  const s = normalize(subject);
  if (!s) return href;
  return appendParam(href, SUBJECT_PARAM, s);
}

/**
 * Carry a two-option decision on a handoff link: the subject (optional) plus the
 * two option labels, and the source that's handing off so the destination can
 * name it. Every part is optional and each is added only when non-empty — so a
 * blank field never puts a dead param on the link, the same no-dead-param rule
 * `withSubject` follows. Used by the halo-off comparison to hand its two
 * finalists to the flip point's A/B frame.
 */
export function withOptions(
  href: string,
  carry: {
    subject?: string;
    optionA?: string;
    optionB?: string;
    from?: CarrySource;
  }
): string {
  let out = carry.subject ? withSubject(href, carry.subject) : href;
  const a = carry.optionA ? normalize(carry.optionA) : "";
  const b = carry.optionB ? normalize(carry.optionB) : "";
  if (a) out = appendParam(out, OPTION_A_PARAM, a);
  if (b) out = appendParam(out, OPTION_B_PARAM, b);
  if (carry.from) out = appendParam(out, FROM_PARAM, carry.from);
  return out;
}

/**
 * Read the two carried option labels from the current URL. Client-only; returns
 * empty strings when there's nothing to carry. The receiver decides whether to
 * apply them (only into blank fields — never over saved work).
 */
export function readCarriedOptions(): { optionA: string; optionB: string } {
  if (typeof window === "undefined") return { optionA: "", optionB: "" };
  try {
    const p = new URLSearchParams(window.location.search);
    return {
      optionA: normalize(p.get(OPTION_A_PARAM) ?? ""),
      optionB: normalize(p.get(OPTION_B_PARAM) ?? ""),
    };
  } catch {
    return { optionA: "", optionB: "" };
  }
}

/**
 * Carry a whole slate of option labels on a handoff link: the subject (optional)
 * plus the list, and the source that's handing off. The list is normalized,
 * empties dropped, and capped at `MAX_OPTION_LIST` so a link stays a link; the
 * param is added only when at least two survive, since a slate of one isn't a
 * comparison. Used by the frame-widener to hand three-or-more real options to
 * the halo-off comparison.
 */
export function withOptionList(
  href: string,
  carry: {
    subject?: string;
    options: string[];
    from?: CarrySource;
  }
): string {
  let out = carry.subject ? withSubject(href, carry.subject) : href;
  const cleaned = carry.options
    .map(normalize)
    .filter(Boolean)
    .slice(0, MAX_OPTION_LIST);
  if (cleaned.length >= 2) {
    out = appendParam(out, OPTIONS_PARAM, cleaned.join(OPTIONS_SEP));
    if (carry.from) out = appendParam(out, FROM_PARAM, carry.from);
  }
  return out;
}

/**
 * Read the carried option slate from the current URL. Client-only; returns an
 * empty array when there's nothing to carry or the fragment is malformed. The
 * receiver decides whether to apply it (only into blank options — never over
 * saved work). Degrades to `[]`, never throws, so a truncated or hand-edited
 * link reads as "nothing carried."
 */
export function readCarriedOptionList(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = new URLSearchParams(window.location.search).get(OPTIONS_PARAM);
    if (!raw) return [];
    return raw
      .split(OPTIONS_SEP)
      .map(normalize)
      .filter(Boolean)
      .slice(0, MAX_OPTION_LIST);
  } catch {
    return [];
  }
}

/**
 * Read the source that handed off, but only if it's a token we recognize —
 * anything else reads as "no named source" so the cue falls back to its generic
 * wording rather than trusting an arbitrary URL string.
 */
export function readCarriedFrom(): CarrySource | "" {
  if (typeof window === "undefined") return "";
  try {
    const raw = new URLSearchParams(window.location.search).get(FROM_PARAM);
    return raw && raw in CARRY_SOURCES ? (raw as CarrySource) : "";
  } catch {
    return "";
  }
}

/**
 * Strip every carry param (subject, the two option labels, the source) from the
 * URL after a receiver has applied them, so a refresh doesn't re-apply them and
 * the address bar stays clean. Client-only and defensive — keeps the rest of the
 * query intact. Mirrors the `replaceState` the journal and pre-mortem already
 * use for their own deep links. Named for the subject it originally cleared;
 * every caller that only ever carried a subject is unaffected, since deleting an
 * absent param is a no-op.
 */
export function clearCarriedSubject(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const keys = [
      SUBJECT_PARAM,
      OPTION_A_PARAM,
      OPTION_B_PARAM,
      OPTIONS_PARAM,
      FROM_PARAM,
    ];
    if (!keys.some((k) => url.searchParams.has(k))) return;
    for (const k of keys) url.searchParams.delete(k);
    const qs = url.searchParams.toString();
    window.history.replaceState(
      null,
      "",
      url.pathname + (qs ? `?${qs}` : "") + url.hash
    );
  } catch {
    /* history unavailable — the pre-fill already happened; a stale param is
       harmless because receivers only apply it when their field is empty. */
  }
}
