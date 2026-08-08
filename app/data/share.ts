/**
 * Handing a decision to another person.
 *
 * Every instrument on this site is, so far, single-player. You work a call
 * through the flip point or the comparison, and the result lives in your own
 * browser and nowhere else — which is the whole privacy story, and a good one.
 * But the calls people actually bring to a tool like this are rarely made alone.
 * Two job offers, a move, a hire, whether to quit — these get talked over with a
 * spouse, a cofounder, an advisor. The site had a rich answer for carrying a
 * decision from one *tool* to the next (see `carry.ts`, the through-line) and no
 * answer at all for carrying it from one *person* to the next. This module is
 * that answer: a link that encodes a whole worked decision, so you can hand it
 * to someone and they open exactly what you're weighing — the frame, your
 * numbers, the line it draws — and can change the numbers to argue back.
 *
 * THE PRIVACY INVARIANT, KEPT HONESTLY. The site's promise is "sent nowhere,"
 * and a share link must not quietly break it. So the payload rides in the URL
 * *fragment* (the part after `#`), never the query string. A fragment is never
 * transmitted in an HTTP request — the browser strips it before the request
 * leaves the machine — so opening a share link sends the decision to no server,
 * not even the one hosting this page. The data travels only inside the link
 * text itself, peer to peer, reaching only whoever the sender chose to hand it
 * to. That is the one encoding under which "share this" and "sent nowhere" are
 * both true at once, and it's why this is a fragment codec, not a query param.
 *
 * TOOL-AGNOSTIC ON PURPOSE. This module knows how to pack an opaque payload into
 * a fragment and read it back; it does not know what a flip point or a
 * comparison is. The envelope carries a tool tag (`t`) so a receiver can check
 * "is this meant for me?" and a version (`v`) so the wrapper can change without
 * silently misreading old links. Each tool owns the shape of its own `d`
 * payload and validates it defensively on the way in — exactly the discipline
 * `loadInputs` uses for localStorage. So today only the flip point reads these,
 * and the comparison or the pre-mortem can adopt the same codec later without
 * touching this file.
 *
 * DEFENSIVE THROUGHOUT. Decode never throws: a truncated, hand-edited, or
 * hostile fragment reads as "nothing shared," never as a crash or a half-parsed
 * object. Length is capped on both ends so a link stays a link and a
 * pathological fragment can't be handed to the JSON parser. Nothing here is
 * persisted; like the rest of the site's URL layer, it reads the address bar and
 * gets out of the way.
 */

/** The fragment key the payload rides in: `#s=<base64url>`. Short, and distinct
 *  from any query param the tools use so the two layers never collide. */
export const SHARE_PARAM = "s";

/** The wrapper format. Bumped only if the envelope itself changes — never for a
 *  tool's own payload shape, which is opaque here and validated by the tool. */
const SHARE_VERSION = 1 as const;

/** A shared link is a link, not a document. Cap the encoded fragment so a
 *  malformed or oversized one is ignored before it ever reaches the decoder,
 *  and so an honest payload (a decision, capped field by field by its tool)
 *  stays comfortably under it. */
const MAX_ENCODED = 8000;

type Envelope = {
  v: number;
  /** The tool the payload is meant for, so a receiver can ignore links that
   *  aren't theirs. */
  t: string;
  /** The tool's own payload — opaque to this module. */
  d: unknown;
};

// ---- base64url over UTF-8 ------------------------------------------------
// btoa/atob only speak Latin-1, but a decision carries real text — curly
// quotes, accents, other scripts. So encode through UTF-8 bytes first, and use
// the URL-safe alphabet (no +, /, or = padding) so the result is clean in a URL
// fragment without escaping.

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  // Restore the padding btoa/atob expect.
  const pad = b64.length % 4;
  if (pad === 2) b64 += "==";
  else if (pad === 3) b64 += "=";
  else if (pad === 1) throw new Error("bad base64url length");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Pack a tool's payload into a fragment-safe token. Returns "" if encoding
 * isn't possible (no browser primitives, or a payload that won't serialize, or
 * one that overflows the cap) so a caller can simply hide the affordance rather
 * than hand out a broken link. The returned string is the value only — the
 * caller builds `#${SHARE_PARAM}=${token}` onto whatever base URL it wants.
 */
export function encodeShare(tool: string, data: unknown): string {
  try {
    if (typeof btoa !== "function" || typeof TextEncoder !== "function") return "";
    const env: Envelope = { v: SHARE_VERSION, t: tool, d: data };
    const json = JSON.stringify(env);
    const token = bytesToBase64Url(new TextEncoder().encode(json));
    if (!token || token.length > MAX_ENCODED) return "";
    return token;
  } catch {
    return "";
  }
}

/**
 * Read a shared payload from the current URL fragment, if there is one meant for
 * the given tool. Returns the decoded `d` payload (still opaque — the caller
 * validates its shape) or null for "nothing shared / not for me / unreadable."
 * Client-only: reads `window.location.hash`, returns null on the server.
 *
 * The `tool` filter is deliberate: a link tagged for the comparison must read as
 * "nothing here" on the flip point, not as a malformed flip point. A future
 * version is likewise ignored rather than guessed at.
 */
export function readShare(tool: string): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return null;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get(SHARE_PARAM);
    if (!token || token.length > MAX_ENCODED) return null;
    const json = new TextDecoder().decode(base64UrlToBytes(token));
    const env = JSON.parse(json) as unknown;
    if (!env || typeof env !== "object") return null;
    const e = env as Partial<Envelope>;
    if (e.v !== SHARE_VERSION) return null;
    if (e.t !== tool) return null;
    return e.d ?? null;
  } catch {
    return null;
  }
}

/**
 * Whether the current URL carries a share fragment at all — for any tool. Lets a
 * page decide to look without committing to a tool tag; the read itself still
 * filters by tool. Cheap and defensive.
 */
export function hasShare(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return false;
    return new URLSearchParams(hash.slice(1)).has(SHARE_PARAM);
  } catch {
    return false;
  }
}

/**
 * Strip the share fragment from the address bar once a receiver has taken it in,
 * so a refresh doesn't re-apply it and the URL stops advertising someone else's
 * decision. Preserves any other fragment content and the whole query string.
 * Mirrors the `replaceState` the through-line uses to clear its own params.
 */
export function clearShare(): void {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.hash || url.hash.length < 2) return;
    const params = new URLSearchParams(url.hash.slice(1));
    if (!params.has(SHARE_PARAM)) return;
    params.delete(SHARE_PARAM);
    const rest = params.toString();
    window.history.replaceState(
      null,
      "",
      url.pathname + url.search + (rest ? `#${rest}` : "")
    );
  } catch {
    /* history unavailable — harmless: the receiver only adopts a shared
       decision into a blank tool, and only on an explicit action otherwise, so
       a lingering fragment can't clobber work. */
  }
}
