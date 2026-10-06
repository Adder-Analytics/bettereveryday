"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Says the answer out loud.
 *
 * Every instrument ends in an answer, and on screen that answer is the loudest
 * thing on the page — a bordered card, a headline in large type. To a screen
 * reader it was silent: the answer is computed live from the inputs and drawn
 * further down the page, so someone who picks the last option hears the button
 * they pressed and then nothing. They have to go hunting for whether anything
 * happened. Not one of the tools had a live region.
 *
 * This is that live region, shared. Each tool passes the short headline of its
 * answer — the same words it prints largest — and this component speaks it
 * politely when it first appears and whenever it changes. Three rules keep it
 * from becoming noise:
 *
 * - **It's settled, not typed.** The message is spoken only after it has held
 *   still for a moment, so a number typed digit by digit is announced once, at
 *   the end, not on every keystroke.
 * - **Restoring isn't answering.** Tools reload your last call from the browser
 *   right after the page mounts. A headline that arrives in that first moment
 *   is taken as the starting state, not news, so opening a tool you used
 *   yesterday doesn't start talking.
 * - **Silence clears.** When the answer goes away (inputs cleared), the region
 *   empties quietly, so the next answer is fresh news even if it's the same.
 *
 * The region is mounted from the first render and never unmounted, because
 * assistive tech only reliably announces changes to a live region it already
 * knew about. It renders nothing visible.
 */

/** How long a headline must hold still before it is spoken. */
const SETTLE_MS = 700;
/** Changes inside this window after mount are hydration, not answers. */
const RESTORE_MS = 900;

export default function AnnounceAnswer({
  message,
}: {
  /** The answer's headline, or empty/null while there's no answer yet. */
  message: string | null | undefined;
}) {
  const [spoken, setSpoken] = useState("");
  const mountedAt = useRef(0);
  const last = useRef<string>("");

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const next = (message ?? "").replace(/\s+/g, " ").trim();

  useEffect(() => {
    if (next === last.current) return;
    if (!next) {
      last.current = "";
      // Clearing is not an announcement; empty the region so the next answer
      // (even an identical one) is a fresh change.
      const t = setTimeout(() => setSpoken(""), 0);
      return () => clearTimeout(t);
    }
    if (Date.now() - mountedAt.current < RESTORE_MS) {
      last.current = next;
      return;
    }
    const t = setTimeout(() => {
      last.current = next;
      setSpoken(next);
    }, SETTLE_MS);
    return () => clearTimeout(t);
  }, [next]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {spoken}
    </div>
  );
}
