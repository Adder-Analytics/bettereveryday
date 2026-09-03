import type { Metadata } from "next";
import Link from "next/link";
import CruxClient from "./CruxClient";

export const metadata: Metadata = {
  title: "Where Do You Actually Disagree? — Better Every Day",
  description:
    "You and someone you have to decide with are stuck — a partner, a cofounder, family. Sort the disagreement into its real root: a fact you can settle with evidence, a values split that needs a fair procedure not more arguing, or a gap in risk tolerance you close with a survival check. Then find the crux — the one thing that, if it went the other way, would change a mind.",
  openGraph: {
    title: "Where Do You Actually Disagree? — Better Every Day",
    description:
      "Most stuck arguments are three disagreements knotted together — facts, values, and risk — each with a different resolution. Separate the strands and the fight stops going in circles.",
    type: "website",
  },
};

export default function CruxPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Where do you actually disagree?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Most of the toolkit is for a decision you make alone. But a lot of the
          hardest ones you don&rsquo;t &mdash; you have to make them{" "}
          <em>with</em>{" "}someone: a partner, a cofounder, a sibling, a colleague.
          And you&rsquo;re stuck. You&rsquo;ve argued it in circles, traded the
          same points three times, and you&rsquo;re no closer. The frustrating
          part is that you both seem reasonable, and yet the gap won&rsquo;t
          close.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It won&rsquo;t close because you&rsquo;re usually not having one
          argument &mdash; you&rsquo;re having up to three at once, tangled
          together. Part of it is a disagreement about <em>what&rsquo;s true</em>{" "}
          or what will happen. Part is a disagreement about <em>what
          matters</em>. And part is a disagreement about <em>how much risk is
          okay</em>. Each of those has a completely different resolution &mdash;
          evidence settles a fact, no evidence ever settles a value, and a
          survival check settles a risk &mdash; so when you argue all three as
          one, every move lands on the wrong strand and nothing gives.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool does the one thing that unsticks it: it separates the
          strands, and then finds the <em>crux</em> &mdash; the one thing that,
          if it turned out the other way, would actually change a mind. It&rsquo;s
          still a private worksheet: you fill in your side <em>and</em>{" "}your best
          honest account of theirs, which is itself the move most stuck arguments
          skip. Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <CruxClient />
      <p className="mt-10 text-sm text-[var(--muted)] leading-relaxed">
        Not a joint decision?{" "}
        <Link
          href="/find"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Find the tool for the decision you&rsquo;re actually in &rarr;
        </Link>
      </p>
    </div>
  );
}
