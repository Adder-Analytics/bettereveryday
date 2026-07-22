import type { Metadata } from "next";
import Link from "next/link";
import DebriefClient from "./DebriefClient";

export const metadata: Metadata = {
  title: "The Outcome Isn't the Verdict — Better Every Day",
  description:
    "Something already happened and you never logged it. The result answers 'did it work?' — but that's a verdict on your luck, not your decision. A backward-looking debrief that separates the two, guards against hindsight, and tells you the one thing to actually change.",
  openGraph: {
    title: "The Outcome Isn't the Verdict — Better Every Day",
    description:
      "Resulting, run in reverse: reconstruct an un-logged past call under a hindsight guard, land it on Annie Duke's 2×2, and learn the right lesson — including the win you should fix and the loss you should keep.",
    type: "website",
  },
};

export default function DebriefPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          The outcome isn&rsquo;t the verdict
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A drunk driver makes it home safely; a careful one gets hit by someone running a red
          light. We know at a glance which got lucky and which got unlucky — and then we throw
          that knowledge away the moment it&rsquo;s our own call. The result is loud and visible;
          the quality of the decision is quiet and invisible, so we let the result stand in for
          it. Annie Duke calls it{" "}
          <Link
            href="/writing/decision-quality"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            resulting
          </Link>
          , and it quietly trains your judgment in the wrong direction: the lucky mistake gets
          filed as wisdom, the unlucky good bet gets filed as a blunder.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The site already has the fix for decisions you saw coming — log the forecast, come back
          and grade it. But most of what you&rsquo;d want to learn from is a call you{" "}
          <em>never logged</em>: it just happened, and now you&rsquo;re sitting with the result.
          Reconstructing it is dangerous ground, because{" "}
          <Link
            href="/writing/experience-doesnt-teach"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            memory edits the record after the fact
          </Link>{" "}
          — what you now know seeps backward into what you&rsquo;re sure you knew. So this tool
          does it under guard: it makes you split what you knew <em>then</em> from what you learned{" "}
          <em>after</em>, grades the decision on the first only, and lands it on the four-cell
          grid — including the two cells everyone gets wrong: the <em>win you should fix</em> and
          the <em>loss you should keep</em>.
        </p>
      </header>

      <DebriefClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser. The thinking behind it is in{" "}
          <Link
            href="/writing/decision-quality"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The Difference Between a Good Decision and a Good Outcome
          </Link>{" "}
          and{" "}
          <Link
            href="/writing/experience-doesnt-teach"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Experience Doesn&rsquo;t Teach
          </Link>
          ; the one-screen versions are the{" "}
          <Link
            href="/models#expected-value"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            expected value
          </Link>{" "}
          and{" "}
          <Link
            href="/models#regression-to-mean"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            regression to the mean
          </Link>{" "}
          models. This debrief works a call you never wrote down; the clean version is to write
          the <em>next</em> one down first — log it in the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>{" "}
          so reality grades it against words you can&rsquo;t edit, and it stops being
          reconstruction.
        </p>
      </div>
    </div>
  );
}
