"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { countDueReviews } from "../data/journal";
import { countDueTripwireChecks } from "../data/premortem";

/**
 * A tiny client island that surfaces the site's two "something is waiting for
 * an answer" counts where you already are — the homepage — instead of only
 * inside their tools. The journal's reviews and the pre-mortem's tripwire
 * checks are the same kind of debt: a question you scheduled, now due, that
 * only pays off if it actually gets answered.
 *
 * The counting lives in the shared read sides (app/data/journal.ts and
 * app/data/premortem.ts), so this badge and the tools can never disagree.
 * Renders null on the server and on first client paint (matching the server),
 * then reveals itself after mount only if there's actually something due — so
 * there's no hydration mismatch and no empty placeholder for new visitors.
 */
export default function ReviewDueBadge() {
  const [due, setDue] = useState(0);
  const [checks, setChecks] = useState(0);

  useEffect(() => {
    const reviews = countDueReviews();
    const tripwires = countDueTripwireChecks();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read from
       browser storage after mount; intentional, can't run in render */
    if (reviews > 0) setDue(reviews);
    if (tripwires > 0) setChecks(tripwires);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (due === 0 && checks === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {due > 0 && (
        <Link
          href="/decide?log=1"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:opacity-80 transition-opacity"
        >
          <span className="text-[var(--accent)] font-medium">
            {due} decision{due === 1 ? "" : "s"} due for review
          </span>
          <span className="text-[var(--muted)]">in your journal →</span>
        </Link>
      )}
      {checks > 0 && (
        <Link
          href="/premortem"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:opacity-80 transition-opacity"
        >
          <span className="text-[var(--accent)] font-medium">
            {checks} tripwire check{checks === 1 ? "" : "s"} due
          </span>
          <span className="text-[var(--muted)]">in your pre-mortems →</span>
        </Link>
      )}
    </div>
  );
}
