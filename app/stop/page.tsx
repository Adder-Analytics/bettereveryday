import type { Metadata } from "next";
import Link from "next/link";
import StopClient from "./StopClient";

export const metadata: Metadata = {
  title: "When Do You Stop Looking? — Better Every Day",
  description:
    "You're searching — apartments, jobs, candidates, a used car — and they come one at a time, each take-it-or-leave-it. Run the secretary-problem answer without the math: look at (and pass) the first 37% to learn what good looks like, then take the first that beats them all. Know whether you're settling early or holding out too long.",
  openGraph: {
    title: "When Do You Stop Looking? — Better Every Day",
    description:
      "The 37% rule for a sequential search: look without choosing, then leap. Names the two ways people fail — grabbing the first shiny thing, and passing the best one hoping.",
    type: "website",
  },
};

export default function StopPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          When do you stop looking?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Some choices arrive all at once &mdash; three job offers on the table,
          two apartments you can walk through back to back. But a lot of them
          don&rsquo;t. You&rsquo;re looking for a place to live, a person to hire,
          a used car, and the options come <em>one at a time</em>. Each one is
          take-it-or-leave-it: hesitate and it&rsquo;s gone to someone else, and
          you can&rsquo;t line them all up because you haven&rsquo;t seen the rest
          yet. So every decent one asks the same nagging question &mdash; grab it,
          or hold out for something better?
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          From inside the search you can&rsquo;t tell which mistake you&rsquo;re
          about to make. Take the first good one and you might be settling before
          you even knew what the field looked like. Keep passing, sure the next
          will be better, and you can sail right past the best one you&rsquo;ll
          ever see &mdash; then take whatever&rsquo;s left when the clock runs out.
          &ldquo;I&rsquo;ll know it when I see it&rdquo; is not a stopping rule;
          it&rsquo;s how both of those happen.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This exact shape of problem has a known, proven answer &mdash;
          mathematicians call it the <em>secretary problem</em>, and the rule that
          solves it is beautifully simple. Spend the first{" "}
          <span className="font-medium text-[var(--foreground)]">37%</span> of your
          search just <em>looking</em>: pass every option, however good, and use
          them only to learn what &ldquo;good&rdquo; means here. Then take the
          first one that beats everything in that look phase. That single move
          lands you the best option more often than any other strategy &mdash; and
          it kills both failure modes at once.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          This tool runs it on your search: it works out your look phase, tells
          you which side of the line you&rsquo;re standing on right now, and hands
          you the move. If your options don&rsquo;t actually come one at a time
          &mdash; you can revisit any of them, or see them all at once &mdash;
          it&rsquo;ll say so and send you to the{" "}
          <Link
            href="/compare"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            comparison
          </Link>
          , which is the right tool for that. The idea in full is in the{" "}
          <Link
            href="/models#optimal-stopping"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            optimal-stopping model
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <StopClient />
    </div>
  );
}
