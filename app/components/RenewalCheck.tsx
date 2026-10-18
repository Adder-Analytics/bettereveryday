"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  answerRenewal,
  findRenewal,
  prettyDate,
  priceText,
  renewalQuestion,
  todayISO,
  type Outcome,
  type Renewal,
} from "../data/renewals";

/**
 * The return for a dated renewal (`?check=<id>`), shared by /trial and /keep.
 *
 * The return desk links here on the day. The screen asks the one question that
 * was waiting (would you sign up today, at this price? / did you miss it?) and
 * records the answer, so the item leaves the desk with a result, not a swipe.
 * Each answer gets the one thing to do next, in a sentence.
 *
 * Reads the id from the URL after mount (like /cool's `?resume=`), so the page
 * stays static and there's no hydration mismatch. Renders nothing when there's
 * no `check` parameter or the id isn't in this browser.
 */

type Choice = { outcome: Outcome; label: string };

function choicesFor(r: Renewal): Choice[] {
  switch (r.kind) {
    case "trial":
      return [
        { outcome: "kept", label: "Yes: I'll keep paying for it" },
        { outcome: "cancelled", label: "No: I've cancelled it" },
        { outcome: "charged", label: "Too late: it's already charged me" },
      ];
    case "test":
      return [
        { outcome: "gone", label: "I didn't miss it" },
        { outcome: "missed", label: "I missed it, so I've rejoined" },
      ];
    case "hold":
      return [
        { outcome: "kept", label: "Yes: I'd sign up again" },
        { outcome: "cancelled", label: "No: I've cancelled it" },
      ];
  }
}

function afterText(r: Renewal, o: Outcome): string {
  const price = priceText(r.price, r.period);
  switch (o) {
    case "kept":
      return r.kind === "trial"
        ? `Then it's a subscription you chose${price ? `, at ${price}` : ""}. Give it the fresh-start question once a year, like the rest.`
        : "Then it's earning its place. Ask again next year.";
    case "cancelled":
      return r.kind === "trial"
        ? "Done, and nothing was charged. If you find you want it later, signing up is a decision you can make on purpose."
        : "Done. If you find you miss it, rejoining is a decision you can make on purpose.";
    case "charged":
      return "Cancel it now so it doesn't charge again. If you haven't used it since the charge, ask for a refund straight away: many services give one when asked promptly. Next time, put the date two days before the charge, or cancel on day one if the free time survives it.";
    case "missed":
      return "Good: now you know it's worth the money, and you're paying for it on purpose.";
    case "gone":
      return price
        ? `Then that's ${price} you don't need to spend, settled by a month rather than by argument.`
        : "Then you have your answer, settled by a month rather than by argument.";
    default:
      return "";
  }
}

export default function RenewalCheck({ onAnswered }: { onAnswered?: () => void } = {}) {
  const [item, setItem] = useState<Renewal | null>(null);
  const [done, setDone] = useState<Outcome>("");
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("check");
    const found = id ? findRenewal(id) : null;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read from the
       URL and browser storage after mount; intentional, can't run in render. */
    if (found) {
      setItem(found);
      if (found.resolvedOn) setDone(found.outcome);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (item) heading.current?.focus();
  }, [item]);

  if (!item) return null;

  const name = item.name.trim() || (item.kind === "trial" ? "Your free trial" : "This subscription");
  const due = item.checkOn <= todayISO();
  const price = priceText(item.price, item.period);
  const intro =
    item.kind === "trial"
      ? `You started a free trial of ${name} on ${prettyDate(item.startedOn)}.${price ? ` It becomes ${price}` : " It starts charging"}${item.chargeOn ? ` on ${prettyDate(item.chargeOn)}` : ""}.`
      : item.kind === "test"
        ? `On ${prettyDate(item.startedOn)} you cancelled ${name} to see if you'd miss it.`
        : `On ${prettyDate(item.startedOn)} you kept ${name} for now${price ? `, at ${price}` : ""}, because leaving would lose something.`;

  return (
    <section
      aria-label="The question you set for today"
      className="mb-8 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        {due ? "It's back, as you asked" : `Coming back on ${prettyDate(item.checkOn)}`}
      </p>
      <h2
        ref={heading}
        tabIndex={-1}
        className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)] focus:outline-none"
      >
        {name}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{intro}</p>
      {done ? (
        <div className="mt-4 pl-3 border-l-2 border-[var(--accent)]">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {choicesFor(item).find((c) => c.outcome === done)?.label ?? "Answered."}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">{afterText(item, done)}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/review"
              className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              Back to the return desk →
            </Link>
            <button
              type="button"
              onClick={() => {
                answerRenewal(item.id, "");
                setDone("");
                onAnswered?.();
              }}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Undo
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 text-base text-[var(--foreground)] leading-relaxed">
            {renewalQuestion(item)}
          </p>
          <div role="group" aria-label={renewalQuestion(item)} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {choicesFor(item).map((c) => (
              <button
                key={c.outcome}
                type="button"
                onClick={() => {
                  answerRenewal(item.id, c.outcome);
                  setDone(c.outcome);
                  onAnswered?.();
                }}
                className="text-sm px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] transition-colors text-left"
              >
                {c.label}
              </button>
            ))}
          </div>
          {item.kind !== "test" ? (
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              Count the use you actually had, not the use you meant to have.
              {item.kind === "trial" ? " Cancel first, then answer here." : ""}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
