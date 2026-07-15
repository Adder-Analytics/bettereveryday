"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { countDueReviews } from "../data/journal";
import { countDueTripwireChecks } from "../data/premortem";

/**
 * A tiny client island that surfaces the site's "something is waiting for an
 * answer" debt where you already are — the homepage — and sends you to the one
 * place that gathers all of it: the return desk at /review. The journal's
 * reviews and the pre-mortem's tripwire checks are the same kind of debt: a
 * question you scheduled, now due, that only pays off if it gets answered.
 *
 * The counting lives in the shared read sides (app/data/journal.ts and
 * app/data/premortem.ts), so this badge, the desk, and the tools can never
 * disagree. Renders null on the server and on first client paint (matching the
 * server), then reveals itself after mount only if there's actually something
 * due — so there's no hydration mismatch and no empty placeholder for new
 * visitors.
 */
export default function ReviewDueBadge() {
  const [due, setDue] = useState(0);

  useEffect(() => {
    const total = countDueReviews() + countDueTripwireChecks();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read from
       browser storage after mount; intentional, can't run in render */
    if (total > 0) setDue(total);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (due === 0) return null;

  return (
    <div className="mb-4">
      <Link
        href="/review"
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--foreground)] hover:opacity-80 transition-opacity"
      >
        <span className="text-[var(--accent)] font-medium">
          {due} {due === 1 ? "thing is" : "things are"} due for review
        </span>
        <span className="text-[var(--muted)]">at the return desk →</span>
      </Link>
    </div>
  );
}
