"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { withSubject } from "../data/carry";

/**
 * The homepage's decision entry — the site's most useful thing, made the first
 * thing you can actually do.
 *
 * For a long time the homepage's one affordance for a stranger facing a decision
 * was a text link ("Facing a decision now? Find your tool →") pointing at the
 * guided front door. But the guided door (`/find`) opens with a "what are you
 * deciding?" field, and its whole through-line is built to carry that one line
 * from tool to tool so you type it once. This closes the last gap in that
 * through-line: you name the decision *here*, on the page you land on, and it
 * rides straight into the router — no cold field, no second typing, one fewer
 * click between arriving and working the real thing.
 *
 * It holds nothing and sends nothing. The subject lives in this component's
 * state until you submit, then travels only in the URL query the way every
 * handoff on the site does — reusing `withSubject`, the exact helper the tools
 * use between each other, so the homepage can't drift from the rest. Submitting
 * empty is fine: `/find` works without a subject, and `withSubject` puts no dead
 * `?subject=` on the link when the field is blank.
 */
export default function DecideHero() {
  const router = useRouter();
  const [subject, setSubject] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(withSubject("/find", subject));
      }}
      className="mt-8"
    >
      <label
        htmlFor="home-subject"
        className="block text-sm font-medium text-[var(--foreground)] mb-2"
      >
        Facing a decision? Name it in a line.
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="home-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Take the Berlin role, or stay?"
          aria-label="What are you deciding?"
          className="flex-1 min-w-0 rounded-md border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--background)] hover:opacity-90 transition-opacity"
        >
          Find your instrument &rarr;
        </button>
      </div>
      <p className="mt-2.5 text-xs text-[var(--muted)] leading-relaxed">
        Answer a question or two and you&rsquo;re handed the one instrument built
        for the shape of your decision &mdash; your words carried into it. Nothing
        leaves your browser.{" "}
        <Link
          href="/start"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Just here to read? Start with a reading path &rarr;
        </Link>
      </p>
    </form>
  );
}
