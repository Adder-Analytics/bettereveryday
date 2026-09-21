"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadBackupStatus, type BackupStatus } from "../data/review";

/**
 * The durability nudge, surfaced where people actually are.
 *
 * The site's whole premise is that you come back in three months to see what
 * happened — but everything you log lives only in this browser, and localStorage
 * is not durable: a cleared cache or a new device loses it all. `portable.ts`
 * exists to cut the escape hatch (a backup file you hold), and `review.ts`
 * already computes the one fact that would make a person use it — "your record
 * has outrun its last backup." The catch: that fact rendered *only* on the
 * return desk (/review), and the only ways to the desk light up when something
 * is *due*. So the person most at risk — logging steadily, nothing due yet, the
 * normal early state since reviews are scheduled months out — was precisely the
 * one who never saw it. A record you will lose is a review you will never do.
 *
 * This is that same signal as a tiny client island, so it can ride the homepage
 * and the decisions archive — the places a person looks at the record itself —
 * not just the page they reach when a debt comes due. It reads the exact shared
 * `loadBackupStatus()` the desk uses, so the surfaces can never disagree.
 *
 * Restraint, matched to `ReviewDueBadge`: renders nothing on the server or the
 * first client paint (no hydration mismatch, no placeholder), then reveals
 * itself after mount only when there's genuinely something unsaved to nudge
 * about. Its border is the plain one, not the accent the "due for review" pill
 * carries — backing up is housekeeping you should see, not an alarm, so when
 * both show at once the due-review pill stays the louder of the two.
 */
export default function BackupNudge({ className = "" }: { className?: string }) {
  const [backup, setBackup] = useState<BackupStatus | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read from
       browser storage after mount; intentional, can't run in render. */
    setBackup(loadBackupStatus());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Nothing to nudge about: no record yet, or the record is already covered by
  // a backup that postdates it. Also the server/first-paint case (backup null).
  if (!backup || !backup.hasRecord || backup.newSince === 0) return null;

  const { newSince, lastBackupOn } = backup;
  const n = `${newSince} ${newSince === 1 ? "record" : "records"}`;

  return (
    <div className={className}>
      <Link
        href="/data"
        className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm hover:border-[var(--accent)] transition-colors"
      >
        <span className="text-[var(--foreground)]">
          {lastBackupOn
            ? `${n} logged since your last backup`
            : `${n} live only in this browser, never backed up`}
        </span>
        <span className="text-[var(--accent)] font-medium">
          Save a copy you own →
        </span>
      </Link>
    </div>
  );
}
