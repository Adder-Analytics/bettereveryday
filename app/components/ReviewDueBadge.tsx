"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * A tiny client island that surfaces the decision journal's "review due" count
 * where you already are — the homepage — instead of only inside /decide. The
 * journal can only nudge you if you open it; this brings the nudge to you.
 *
 * It reads the same localStorage key the journal writes (decide:log:v1) and
 * counts entries whose review date has arrived and that haven't been reviewed.
 * Renders null on the server and on first client paint (matching the server),
 * then reveals itself after mount only if there's actually something due — so
 * there's no hydration mismatch and no empty placeholder for new visitors.
 */
const LOG_KEY = "decide:log:v1";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function ReviewDueBadge() {
  const [due, setDue] = useState(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOG_KEY);
      if (!raw) return;
      const log = JSON.parse(raw);
      if (!Array.isArray(log)) return;
      const today = todayISO();
      const count = log.filter(
        (e) =>
          e &&
          !e.reviewedOn &&
          typeof e.reviewOn === "string" &&
          e.reviewOn <= today
      ).length;
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time
         read from browser storage after mount; intentional, can't run in render */
      if (count > 0) setDue(count);
    } catch {
      /* no log, unreadable storage, or bad JSON — show nothing */
    }
  }, []);

  if (due === 0) return null;

  return (
    <Link
      href="/decide?log=1"
      className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:opacity-80 transition-opacity"
    >
      <span className="text-[var(--accent)] font-medium">
        {due} decision{due === 1 ? "" : "s"} due for review
      </span>
      <span className="text-[var(--muted)]">in your journal →</span>
    </Link>
  );
}
