import type { Metadata } from "next";
import Link from "next/link";
import QuitClient from "./QuitClient";

export const metadata: Metadata = {
  title: "Would You Start It Today? — Better Every Day",
  description:
    "You can't tell if it's time to quit, because everything you've already put in argues for one more push. This tool strips the sunk cost out of the call: it asks whether you'd start the thing fresh today, sets the next push against its real alternative, and — if you carry on — makes you set the kill criterion in advance.",
  openGraph: {
    title: "Would You Start It Today? — Better Every Day",
    description:
      "A quit-or-persevere tool that takes the sunk cost out of the vote: the fresh-start test, the opportunity-cost test, a guard against smuggling the loss back in, and a kill criterion for whatever you keep doing.",
    type: "website",
  },
};

export default function QuitPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Would you start it today?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The project that&rsquo;s been &ldquo;almost there&rdquo; for a year. The job, the
          strategy, the manuscript, the relationship with the sunk decade. The hardest thing about
          knowing when to quit is that everything you&rsquo;ve already spent argues for one more
          push — and one more after that. But what&rsquo;s spent is spent whether you stay or go;
          it&rsquo;s a fact about the past, and the decision is entirely about the future. The pain
          of writing the loss off is real, and it is{" "}
          <Link
            href="/writing/loss-aversion"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            not information
          </Link>{" "}
          about whether to continue.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          So this tool does the two things the sunk-cost feeling won&rsquo;t let you do alone. It{" "}
          <em>quarantines</em> what you&rsquo;ve already put in — you name it, and then it gets no
          vote. And it runs the two tests that survive the strip: would you{" "}
          <em>begin</em> this today from scratch, and does one more push beat the best{" "}
          <Link
            href="/models#opportunity-cost"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            other use
          </Link>{" "}
          of the same time and money — not &ldquo;better than nothing,&rdquo; better than the
          alternative? Where the two disagree, that gap is the finding. And whatever you decide to
          keep doing, you leave with a{" "}
          <Link
            href="/models#tripwires"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            kill criterion
          </Link>{" "}
          — a state and a date, set now while you&rsquo;re calm, because quitting on time always
          feels like quitting too early.
        </p>
      </header>

      <QuitClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser. The idea underneath it is{" "}
          <Link
            href="/models#loss-aversion"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            loss aversion
          </Link>{" "}
          and the{" "}
          <Link
            href="/models#opportunity-cost"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            opportunity cost
          </Link>{" "}
          you pay to honour a sunk one; the way to keep &ldquo;keep going&rdquo; honest is the{" "}
          <Link
            href="/models#tripwires"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            kill criterion
          </Link>
          . If the thing you might quit is a big commitment you haven&rsquo;t made yet — not one
          you&rsquo;re already deep in — run the{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem
          </Link>{" "}
          instead, and hold the funeral before you start. And the full playbook for this moment,
          with the models laid out, is{" "}
          <Link
            href="/playbook#time-to-quit"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            when you can&rsquo;t tell if it&rsquo;s time to quit
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
