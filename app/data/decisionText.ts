/**
 * One decision, as plain text you can paste anywhere.
 *
 * The decision home (/decisions) reassembles a whole call's arc — the door sort,
 * the flip point, the logged forecast, the armed tripwire — into one card, and
 * the site's spine, printed on its own homepage, is that it "keeps the record
 * for you and can hand it back weeks later." It hands it back on screen, and the
 * page can be printed to PDF. But a person who has just worked a real decision
 * often wants the *reasoning itself*, in a form they can use elsewhere: pasted
 * into a private journal, sent to the spouse or cofounder the call is actually
 * about, dropped into a doc, or kept in their own notes. Until now the only ways
 * out were a PDF of the *whole page* (every decision at once, and not editable
 * text), an opaque backup blob (`/data`), or an encoded share link that only
 * four tools speak. None of those is "this one decision, as words a human can
 * read." This module is that missing form.
 *
 * WHY IT LIVES HERE AND TOUCHES NO TOOL. Everything the memo needs is already
 * assembled on the `DecisionGroup` the home builds — the subject line, each
 * record's tool, its one-line detail, the day it was worked, the return still
 * pending. So composing the memo reads *only* that already-built shape; it adds
 * no code to any instrument, cannot regress one, and a future tool joins the
 * memo the day it joins the home, with no change here. Same read-only discipline
 * as decisions.ts and review.ts.
 *
 * PURE, SO IT'S TESTABLE. `decisionToText` is a pure function of a group and the
 * day passed in — no browser, no clock of its own — so its output can be checked
 * without a DOM, the same way `groupDecisions` is. The client owns the one
 * impure step (putting the returned string on the clipboard).
 *
 * PRIVACY, UNBROKEN. The memo is assembled in the browser from records that were
 * already in the browser, and handed to the clipboard by an explicit click.
 * Nothing is sent anywhere; the footer says so, so a memo that travels by
 * paste-into-email carries its own honest provenance instead of implying the
 * site collected it.
 */

import type { DecisionGroup, WorkedItem } from "./decisions";
import { dueLabel } from "./decisions";
import { formatDate } from "./posts";

/** Capitalize the first letter so a due phrase reads as a clause of its own. */
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * The one-line summary under the title — the same facts, in the same order, the
 * card shows on screen (see `summaryLine` in DecisionsClient), so the memo and
 * the card can't tell two different stories about the same decision.
 */
function metaLine(group: DecisionGroup, today: string): string {
  const parts: string[] = [];
  if (group.toolCount > 1) parts.push(`worked across ${group.toolCount} tools`);
  if (group.firstOn) parts.push(`first worked ${formatDate(group.firstOn)}`);
  if (group.openCount > 0 && group.nextDueOn) {
    const when = dueLabel(group.nextDueOn, today);
    parts.push(`next return ${when || formatDate(group.nextDueOn)}`);
  } else if (group.items.every((i) => i.tone === "resolved")) {
    parts.push("closed out");
  }
  return parts.join(" · ");
}

/** One record, as a short block: the tool and day it was worked, the one-line
 *  detail the home already wrote, and — only when a return is still pending — the
 *  status and when it's due, so the memo names what's still owed without
 *  repeating "worked" under every finished step. */
function itemBlock(item: WorkedItem, today: string): string {
  const dated = item.workedOn ? ` — ${formatDate(item.workedOn)}` : "";
  const lines = [`• ${item.toolLabel}${dated}`, `  ${item.detail}`];
  if (item.dueOn) {
    const when = dueLabel(item.dueOn, today);
    lines.push(`  ↳ ${cap(item.status)}${when ? ` · ${when}` : ""}`);
  }
  return lines.join("\n");
}

/**
 * Compose a decision's whole arc into a plain-text memo. The shape:
 *
 *   {subject}
 *   {meta line}
 *
 *   • {tool} — {date}
 *     {detail}
 *     ↳ {status · when due}      (only when a return is still pending)
 *
 *   … one block per record, in the order it was worked …
 *
 *   —
 *   Kept privately in Better Every Day. Nothing here was sent anywhere.
 *
 * Pure: give it a group and today's date and it returns the same string every
 * time, no browser needed.
 */
export function decisionToText(group: DecisionGroup, today: string): string {
  const header = [group.subject];
  const meta = metaLine(group, today);
  if (meta) header.push(meta);

  const body = group.items.map((it) => itemBlock(it, today)).join("\n\n");

  const footer =
    "—\nKept privately in Better Every Day. Nothing here was sent anywhere.";

  return [header.join("\n"), body, footer].join("\n\n") + "\n";
}
