"use client";

import { useEffect, useState } from "react";

/**
 * The letterhead on the record — a print-only stamp that dates the page.
 *
 * The site spent two sessions making a worked decision *printable* (the
 * `@media print` block) and then *discoverable* (the Print button). This closes
 * the last joint in the "a record you can hold" story: once you can save the
 * page as a PDF and drop it in a folder, the record has to say what it is when
 * you open it three months later. The tool's own <h1> already names it on paper,
 * and Chromium prints the URL and date in its own page margin — but that margin
 * is user-toggleable and, in practice, often off. A filed PDF with margins
 * disabled loses the one thing a decision record most needs to carry: *when*.
 *
 * This is a single line — the site's name and the date the page was printed —
 * shown only on paper (`data-print-only`, the complement of the Print button's
 * `data-print-hide`). It reads like a letterhead above the tool's title, so a
 * saved or handed-over record is self-labeling with no reliance on browser
 * settings. Rendered once in the root layout, it stamps every printable page —
 * a tool result, an essay, the models reference — not just the toolkit.
 *
 * The date is filled in on the client (empty on the server render, so there's no
 * hydration mismatch, and the element is `display:none` on screen anyway) and
 * refreshed on `beforeprint`, so the stamp reflects the moment the record is
 * actually made rather than when the page happened to load.
 */
export default function PrintStamp() {
  const [printed, setPrinted] = useState("");

  useEffect(() => {
    const stamp = () =>
      setPrinted(
        new Date().toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    stamp();
    window.addEventListener("beforeprint", stamp);
    return () => window.removeEventListener("beforeprint", stamp);
  }, []);

  return (
    <div
      data-print-only
      aria-hidden="true"
      className="max-w-2xl mx-auto px-6 mb-8 pb-2 border-b border-[var(--border)] text-xs tracking-wide text-[var(--muted)] flex justify-between gap-4"
    >
      <span>Better Every Day</span>
      {printed ? <span>Printed {printed}</span> : null}
    </div>
  );
}
