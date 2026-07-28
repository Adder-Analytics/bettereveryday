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
 * ignores is a dead param that implies a bridge that doesn't fire — so the tools
 * that hand off to a subject-less destination (the return desk, a tripwire) link
 * plainly, and only the readers below get the param.
 */

/** The query key the subject rides in. Short, human-legible in a URL. */
export const SUBJECT_PARAM = "subject";

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

/**
 * Append the subject to a handoff href when there is one to carry. Preserves any
 * params the href already has (e.g. `/decide?log=1`), URL-encodes the value, and
 * returns the href untouched when the subject is empty — so a blank field never
 * puts a `?subject=` on a link.
 */
export function withSubject(href: string, subject: string): string {
  const s = normalize(subject);
  if (!s) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}${SUBJECT_PARAM}=${encodeURIComponent(s)}`;
}

/**
 * Strip the subject param from the URL after a receiver has applied it, so a
 * refresh doesn't re-apply it and the address bar stays clean. Client-only and
 * defensive — keeps the rest of the query intact. Mirrors the `replaceState`
 * the journal and pre-mortem already use for their own deep links.
 */
export function clearCarriedSubject(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(SUBJECT_PARAM)) return;
    url.searchParams.delete(SUBJECT_PARAM);
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
