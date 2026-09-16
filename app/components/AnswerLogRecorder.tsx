"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sweepAnswerNow } from "../data/answerLog";

/**
 * The answer-now recorder — the one global that keeps the quick tools' history.
 *
 * Mounted once in the root layout, it renders nothing. Its only job is to call
 * `sweepAnswerNow()` at the moments a worksheet is likely to have just been
 * finished with, so each distinct call the answer-now tools reach lands in the
 * shared history (see data/answerLog.ts) instead of being overwritten and lost:
 *
 *   - on every route change — you worked a call, then navigated on (very often
 *     via the tool's own "take it to X" handoff), so the slot you just left is
 *     swept the instant you move;
 *   - when the tab is hidden or the page is being unloaded — you switched away
 *     or closed it without navigating within the app.
 *
 * The sweep is cheap (it reads a handful of small slots and writes only when
 * something actually changed) and idempotent, so firing it often is harmless.
 * Because the tools' live slots always hold the current worksheet, the history
 * is only ever *eventually* consistent — and that's enough: the very next sweep,
 * including the one on the next page you open, catches anything a missed unload
 * left behind. Nothing here reaches into a tool; the instruments are untouched.
 */
export default function AnswerLogRecorder() {
  const pathname = usePathname();

  // Sweep on mount and whenever the route changes.
  useEffect(() => {
    sweepAnswerNow();
  }, [pathname]);

  // Sweep when the tab is hidden or the page is being torn down — the exits a
  // route change doesn't cover.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") sweepAnswerNow();
    };
    const onPageHide = () => sweepAnswerNow();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
