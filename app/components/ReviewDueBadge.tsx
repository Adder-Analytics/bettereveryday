"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { countDueReviews } from "../data/journal";

/**
 * A tiny client island that surfaces the decision journal's "review due" count
 * where you already are — the homepage — instead of only inside /decide. The
 * journal can only nudge you if you open it; this brings the nudge to you.
 *
 * The counting lives in app/data/journal.ts (the shared read side of the
 * journal's log), so this badge and the practice hub can never disagree.
 * Renders null on the server and on first client paint (matching the server),
 * then reveals itself after mount only if there's actually something due — so
 * there's no hydration mismatch and no empty placeholder for new visitors.
 */
export default function ReviewDueBadge() {
  const [due, setDue] = useState(0);

  useEffect(() => {
    const count = countDueReviews();
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-time
       read from browser storage after mount; intentional, can't run in render */
    if (count > 0) setDue(count);
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
