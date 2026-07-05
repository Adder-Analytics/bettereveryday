/**
 * Shared iCalendar (RFC 5545) plumbing for every tool that hands a date back
 * to the user's real calendar — the decision journal's review reminders and
 * the pre-mortem's tripwire check dates. The whole site's thesis about
 * feedback is that it only arrives if something is scheduled to deliver it;
 * these helpers are that delivery mechanism, generated entirely in the
 * browser with nothing sent anywhere.
 *
 * Each tool builds its own VEVENT blocks (the content differs); the spec
 * plumbing — escaping, 75-char folding, the VCALENDAR envelope — lives here
 * once so the two tools can't drift apart on conformance.
 */

export const SITE_URL = "https://bettereveryday.vercel.app";

/** Escape a value for an iCalendar TEXT property (RFC 5545 §3.3.11). */
export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold content lines to <=75 chars; continuation lines begin with a space. */
export function icsFold(line: string): string {
  if (line.length <= 75) return line;
  const chunks = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 0) {
    chunks.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return chunks.join("\r\n");
}

/** Current time as a UTC iCalendar timestamp, YYYYMMDDTHHMMSSZ. */
export function icsStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Wrap one or more VEVENT blocks in a VCALENDAR envelope, fold to ≤75 chars,
 *  and join with CRLF per RFC 5545. `product` names the tool in PRODID. */
export function wrapCalendar(events: string[][], product: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//Better Every Day//${product}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.flat(),
    "END:VCALENDAR",
  ];
  return lines.map(icsFold).join("\r\n") + "\r\n";
}
