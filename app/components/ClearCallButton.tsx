"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sweepAnswerNow } from "../data/answerLog";
import { STORES } from "../data/portable";

/**
 * "Clear this" — the shared reset for the answer-now family.
 *
 * Every answer-now instrument keeps a single worksheet slot: the last call you
 * worked, overwritten the next time you open it on a different one. To work a
 * *second* decision you had to hand-delete every field by hand — unless the tool
 * happened to be one of the three (act, quit, debrief) that grew a bespoke
 * "Clear this" button. This is that button, made shared so every quick tool has
 * it, and made *safe* so it can't quietly cost you a call.
 *
 * The safety is the point, not the convenience. The answer-now history
 * (answerLog.ts) only captures a call when the global recorder sweeps the slots
 * — on navigation, tab-hide, or unload (AnswerLogRecorder). A plain
 * `setInp(BLANK)` blanks the slot *in place*, with no navigation, so a call you
 * just finished could be overwritten before it was ever swept into the record:
 * gone, not archived. So this control sweeps *first* — it folds the current
 * worksheet into the shared history, then resets — and the finished call lands
 * on /decisions, reopenable, instead of being lost. That is the site's own
 * "keep the record, hand it back" promise, finally kept for the quick tools on a
 * reset too, not only when you happen to navigate away.
 *
 * It stays schema-agnostic the way answerLog.ts does: it asks portable.ts's own
 * `subject` extractor whether the slot held a recordable call (a non-empty
 * decision line), so it can tell you honestly whether the cleared call was
 * saved — without ever learning a tool's internal shape.
 *
 * `onReset` is the tool's own state reset (`() => setInp(BLANK)`), passed in
 * because the worksheet lives in the tool's React state, not here. Nothing in a
 * tool's logic is touched: this renders one button and calls back.
 */
export default function ClearCallButton({
  storeKey,
  onReset,
  label = "Clear this",
}: {
  /** The tool's localStorage slot, e.g. "weigh:v1". */
  storeKey: string;
  /** Reset the tool's own state to blank (e.g. `() => setInp(BLANK)`). */
  onReset: () => void;
  /** Button text; defaults to the family's "Clear this". */
  label?: string;
}) {
  // null — idle. "saved" — cleared a real call, now archived. "empty" — nothing
  // recordable was in the slot, so there's nothing to promise about /decisions.
  const [done, setDone] = useState<null | "saved" | "empty">(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const handle = useCallback(() => {
    // Was there a recordable call in the slot? Read it *before* anything clears
    // it, through portable's own subject extractor, so the confirmation is
    // honest rather than a hopeful claim.
    let recordable = false;
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(storeKey);
        const store = STORES.find((s) => s.key === storeKey);
        if (raw && store?.subject) recordable = Boolean(store.subject(raw));
      } catch {
        /* storage unavailable — fall back to the plain "cleared" wording */
      }
    }
    // Fold the finished call into the shared history BEFORE the reset blanks the
    // slot, so it lands on /decisions instead of being overwritten and lost.
    sweepAnswerNow();
    onReset();
    setDone(recordable ? "saved" : "empty");
    if (timer.current) clearTimeout(timer.current);
    // Fades on its own so it doesn't sit over the fresh worksheet indefinitely.
    timer.current = setTimeout(() => setDone(null), 8000);
  }, [storeKey, onReset]);

  return (
    <div className="mt-6" data-print-hide>
      <button
        type="button"
        onClick={handle}
        className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        {label}
      </button>
      {done ? (
        <p
          className="mt-2 text-xs text-[var(--muted)] leading-relaxed"
          role="status"
        >
          {done === "saved" ? (
            <>
              Cleared — a fresh worksheet is ready. Your last call is kept in{" "}
              <Link
                href="/decisions"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                your decisions
              </Link>
              , where you can reopen it.
            </>
          ) : (
            <>Cleared — a fresh worksheet is ready.</>
          )}
        </p>
      ) : null}
    </div>
  );
}
