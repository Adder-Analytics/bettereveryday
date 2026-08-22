"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  loadDecisions,
  dueLabel,
  type DecisionsView,
  type DecisionGroup,
  type WorkedItem,
  type WorkedTone,
} from "../data/decisions";
import { formatDate } from "../data/posts";
import PrintButton from "../components/PrintButton";

/**
 * The decision home (/decisions), rendered.
 *
 * Reads the whole record once on mount — the same hydrate-once pattern the other
 * clients use, so there's no server/client mismatch and no flash of an empty
 * state that isn't real yet — then shows each decision as a card: the line you
 * worked, a one-glance summary, and every saved piece under it in the order you
 * worked it, each linking straight back into its tool.
 *
 * A search box filters by the decision line, for when the record has grown past
 * a scroll. The print button turns the whole record into something you can hold
 * (the site-wide print stylesheet does the rest); the search box drops off the
 * printed page, since a filter is a screen affordance, not part of the record.
 */

const toneClass: Record<WorkedTone, string> = {
  open: "border-[var(--border)] text-[var(--muted)]",
  alert: "border-[var(--accent)] text-[var(--accent)]",
  resolved: "border-[var(--border)] text-[var(--muted)] opacity-80",
};

function StatusPill({ item }: { item: WorkedItem }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${toneClass[item.tone]}`}
    >
      {item.status}
    </span>
  );
}

function ItemRow({ item, today }: { item: WorkedItem; today: string }) {
  const due = item.dueOn ? dueLabel(item.dueOn, today) : "";
  return (
    <li className="border-t border-[var(--border)] pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          {item.toolLabel}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-[var(--muted)]">
          {item.workedOn ? formatDate(item.workedOn) : ""}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-[var(--foreground)] leading-relaxed">
        {item.detail}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-2">
          <StatusPill item={item} />
          {due && (
            <span
              className={`text-xs ${
                item.tone === "alert"
                  ? "text-[var(--accent)] font-medium"
                  : "text-[var(--muted)]"
              }`}
            >
              {due}
            </span>
          )}
        </div>
        <Link
          href={item.href}
          className="shrink-0 text-xs font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {item.actionLabel}
        </Link>
      </div>
    </li>
  );
}

function summaryLine(group: DecisionGroup, today: string): string {
  const parts: string[] = [];
  if (group.toolCount > 1) {
    parts.push(`worked across ${group.toolCount} tools`);
  }
  if (group.firstOn) {
    parts.push(`first worked ${formatDate(group.firstOn)}`);
  }
  if (group.openCount > 0 && group.nextDueOn) {
    const when = dueLabel(group.nextDueOn, today);
    parts.push(`next return ${when || formatDate(group.nextDueOn)}`);
  } else if (group.items.every((i) => i.tone === "resolved")) {
    parts.push("closed out");
  }
  return parts.join(" · ");
}

function GroupCard({ group, today }: { group: DecisionGroup; today: string }) {
  return (
    <li
      className={`rounded-xl border bg-[var(--card)] p-5 ${
        group.hasDue ? "border-[var(--accent)]" : "border-[var(--border)]"
      }`}
    >
      <h3 className="text-base font-semibold text-[var(--foreground)] leading-snug">
        {group.subject}
      </h3>
      {summaryLine(group, today) && (
        <p className="mt-1 text-xs text-[var(--muted)]">
          {summaryLine(group, today)}
        </p>
      )}
      <ul className="mt-4 space-y-3">
        {group.items.map((item) => (
          <ItemRow key={item.id} item={item} today={today} />
        ))}
      </ul>
    </li>
  );
}

export default function DecisionsClient() {
  const [view, setView] = useState<DecisionsView | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setView(loadDecisions());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const filtered = useMemo(() => {
    if (!view) return [];
    const q = query.trim().toLowerCase();
    if (!q) return view.groups;
    return view.groups.filter(
      (g) =>
        g.subject.toLowerCase().includes(q) ||
        g.items.some((i) => i.detail.toLowerCase().includes(q))
    );
  }, [view, query]);

  if (view === null) {
    return (
      <p className="text-sm text-[var(--muted)]">Reading your record…</p>
    );
  }

  if (view.itemCount === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          Nothing saved here yet &mdash; this page fills itself as you work.
        </p>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          The moment you log a decision in the{" "}
          <Link href="/decide" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            journal
          </Link>
          , hold a{" "}
          <Link href="/premortem" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            pre-mortem
          </Link>
          , arm a{" "}
          <Link href="/tripwire" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            tripwire
          </Link>
          , or park a hot call to{" "}
          <Link href="/cool" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            cool
          </Link>
          , it lands here &mdash; and if you carried one decision across several of
          them, they&rsquo;ll be grouped as one. Not sure where to start?{" "}
          <Link href="/find" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            Find your tool in a question or two →
          </Link>
        </p>
      </div>
    );
  }

  const { itemCount, decisionCount, openDecisions, dueDecisions, today } = view;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-3">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          <span className="text-[var(--foreground)] font-medium">
            {decisionCount} decision{decisionCount === 1 ? "" : "s"}
          </span>{" "}
          from {itemCount} saved record{itemCount === 1 ? "" : "s"}
          {openDecisions > 0 && (
            <>
              {" · "}
              {openDecisions} still open
            </>
          )}
          {dueDecisions > 0 && (
            <>
              {" · "}
              <Link
                href="/review"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                {dueDecisions} with something due →
              </Link>
            </>
          )}
        </p>
        <div data-print-hide>
          <PrintButton
            label="Print / Save as PDF"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          />
        </div>
      </div>

      {view.groups.length > 4 && (
        <div data-print-hide className="mb-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by decision…"
            aria-label="Filter your decisions"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No decision matches &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((group) => (
            <GroupCard key={group.key} group={group} today={today} />
          ))}
        </ul>
      )}
    </div>
  );
}
