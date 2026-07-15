"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadReviewQueue,
  whenLabel,
  type ReviewItem,
  type ReviewQueue,
} from "../data/review";

/**
 * The return desk (/review): one place to answer everything the site scheduled.
 *
 * Every other tool captures a decision and points at the future; this one is
 * the future arriving. It reads — never writes — the whole queue on mount (the
 * same hydrate-once pattern the other clients use, so there's no hydration
 * mismatch and no flash of empty state on the server), then shows what's due,
 * what's coming, and whether the record has outrun its last backup.
 */

function toneForOverdue(relDays: number): string {
  // The more overdue, the warmer the accent — but never alarming; this is a
  // desk, not an inbox screaming at you.
  if (relDays >= 30) return "border-[var(--accent)]";
  return "border-[var(--border)]";
}

function ItemCard({ item, due }: { item: ReviewItem; due: boolean }) {
  return (
    <li
      className={`rounded-lg border ${
        due ? toneForOverdue(item.relDays) : "border-[var(--border)]"
      } bg-[var(--card)] px-4 py-3.5`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          {item.tool}
        </span>
        <span
          className={`shrink-0 text-xs tabular-nums ${
            due && item.relDays >= 30
              ? "text-[var(--accent)] font-medium"
              : "text-[var(--muted)]"
          }`}
        >
          {whenLabel(item.relDays)}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-medium text-[var(--foreground)] leading-snug">
        {item.title}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
        {item.detail}
      </p>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="text-xs text-[var(--muted)] italic">{item.meta}</span>
        {due && (
          <Link
            href={item.href}
            className="shrink-0 text-xs font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {item.kind === "decision" ? "Answer in the journal →" : "Answer in the room →"}
          </Link>
        )}
      </div>
    </li>
  );
}

export default function ReviewClient() {
  const [queue, setQueue] = useState<ReviewQueue | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setQueue(loadReviewQueue());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (queue === null) {
    return (
      <p className="text-sm text-[var(--muted)]">Reading what&rsquo;s waiting for you…</p>
    );
  }

  const { due, upcoming, backup } = queue;
  const nothingScheduled = due.length === 0 && upcoming.length === 0;

  return (
    <div>
      {/* The backup nudge — shown whenever the record has moved since the last
          saved copy, so durability keeps pace with the record it protects. */}
      {backup.hasRecord && backup.newSince > 0 && (
        <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm leading-relaxed">
          <span className="text-[var(--foreground)]">
            {backup.lastBackupOn
              ? `${backup.newSince} ${backup.newSince === 1 ? "record" : "records"} logged since your last backup.`
              : `You've logged ${backup.newSince} ${backup.newSince === 1 ? "record" : "records"} and never backed up.`}
          </span>{" "}
          <span className="text-[var(--muted)]">
            It all lives only in this browser.{" "}
            <Link
              href="/data"
              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Save a copy you own →
            </Link>
          </span>
        </div>
      )}

      {nothingScheduled ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            Nothing is waiting for an answer yet — the desk is clear.
          </p>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            This page fills itself. Every time you log a decision with a review
            date in the{" "}
            <Link href="/decide" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              journal
            </Link>
            , or arm a tripwire with a check date in the{" "}
            <Link href="/premortem" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
              pre-mortem room
            </Link>
            , it schedules a return here for the day it comes due. Come back —
            or bookmark this page — and it&rsquo;ll be the one place that tells
            you what you promised to check, and when.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Due now */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
              {due.length > 0
                ? `Due now · ${due.length}`
                : "Due now"}
            </h2>
            {due.length > 0 ? (
              <ul className="space-y-3">
                {due.map((item) => (
                  <ItemCard key={item.id} item={item} due />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                Nothing is due today. What you&rsquo;ve scheduled is below,
                waiting for its date.
              </p>
            )}
          </section>

          {/* Coming up */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
                Coming up · {upcoming.length}
              </h2>
              <ul className="space-y-3">
                {upcoming.map((item) => (
                  <ItemCard key={item.id} item={item} due={false} />
                ))}
              </ul>
              <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
                These aren&rsquo;t due yet. They&rsquo;re here so the wait is
                visible — the gap between deciding and knowing is where the
                learning actually happens.
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
